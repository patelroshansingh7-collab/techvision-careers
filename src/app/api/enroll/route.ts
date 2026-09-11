import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateOrderId } from "@/lib/cert-id";
import { ENGINEERING_COURSES } from "@/lib/courses-data";
import { memoryStore } from "@/lib/store";
import { sendEnrollmentNotifications } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      courseSlug,
      userName,
      email,
      college,
      startDate,
      mode = "Online",
    } = body;

    if (!courseSlug || !userName || !email || !startDate) {
      return NextResponse.json(
        { success: false, message: "Missing required enrollment fields" },
        { status: 400 }
      );
    }

    // Sync from cloud storage first so this lambda has the latest config and state
    await memoryStore.syncFromCloud().catch(() => {});

    const cleanEmail = email.toLowerCase().trim();
    const cleanName = userName.trim();

    // 1. Try Prisma DB first
    try {
      let user = await prisma.user.findUnique({
        where: { email: cleanEmail },
      });

      if (!user) {
        user = await prisma.user.create({
          data: {
            email: cleanEmail,
            name: cleanName,
            role: "STUDENT",
          },
        });
      }

      let course = await prisma.course.findUnique({
        where: { slug: courseSlug },
      });

      if (!course) {
        const courseStatic = ENGINEERING_COURSES.find((c) => c.slug === courseSlug);
        if (courseStatic) {
          course = await prisma.course.create({
            data: {
              slug: courseStatic.slug,
              title: courseStatic.title,
              category: courseStatic.category,
              durationDays: courseStatic.durationDays,
              mode: courseStatic.mode,
              priceINR: courseStatic.priceINR,
              description: courseStatic.description,
              learn: JSON.stringify(courseStatic.learn),
              tools: JSON.stringify(courseStatic.tools),
              thumbnail: courseStatic.thumbnail,
            },
          });
        }
      }

      if (user && course) {
        const start = new Date(startDate);
        const end = new Date(start);
        end.setDate(end.getDate() + (course.durationDays || 30));
        const orderId = generateOrderId();

        const enrollment = await prisma.enrollment.create({
          data: {
            orderId,
            userId: user.id,
            courseId: course.id,
            userName: cleanName,
            college: college ? college.trim() : null,
            startDate: start,
            endDate: end,
            mode,
            amountINR: course.priceINR || 149,
            paymentStatus: "PENDING",
            lor: true,
          },
        });

        // Sync to memory store with exact orderId
        memoryStore.createEnrollment({
          courseSlug,
          userName: cleanName,
          email: cleanEmail,
          college,
          startDate,
          mode,
          orderId: enrollment.orderId,
        });

        // Trigger Instant Email & Mobile Notifications (To Student & Admin)
        try {
          await sendEnrollmentNotifications({
            userName: cleanName,
            userEmail: cleanEmail,
            courseTitle: course.title,
            orderId: enrollment.orderId,
            college,
            amountINR: enrollment.amountINR,
            mode,
          });
        } catch (e) {
          console.error("Async email error:", e);
        }

        // Sync to cloud storage so all serverless lambdas have the record immediately
        try {
          await memoryStore.syncToCloud();
        } catch (e) {}

        return NextResponse.json({
          success: true,
          orderId: enrollment.orderId,
          amountINR: enrollment.amountINR,
          enrollmentId: enrollment.id,
        });
      }
    } catch (dbErr) {
      console.warn("Prisma DB write bypassed on serverless, using memory store:", dbErr);
    }

    // 2. Fallback: Resilient memory store
    const memEnrollment = memoryStore.createEnrollment({
      courseSlug,
      userName: cleanName,
      email: cleanEmail,
      college,
      startDate,
      mode,
    });

    // Sync to cloud storage immediately
    try {
      await memoryStore.syncToCloud();
    } catch (e) {}

    // Trigger Instant Email & Mobile Notifications (To Student & Admin)
    try {
      await sendEnrollmentNotifications({
        userName: cleanName,
        userEmail: cleanEmail,
        courseTitle: memEnrollment.course.title,
        orderId: memEnrollment.orderId,
        college,
        amountINR: memEnrollment.amountINR,
        mode,
      });
    } catch (e) {
      console.error("Async email error:", e);
    }

    return NextResponse.json({
      success: true,
      orderId: memEnrollment.orderId,
      amountINR: memEnrollment.amountINR,
      enrollmentId: memEnrollment.id,
    });
  } catch (error: any) {
    console.error("Enrollment error:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Internal server error during enrollment" },
      { status: 500 }
    );
  }
}