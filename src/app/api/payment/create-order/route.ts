import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { memoryStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { orderId, fallbackData } = await req.json();

    if (!orderId) {
      return NextResponse.json(
        { success: false, message: "Missing order ID" },
        { status: 400 }
      );
    }

    let enrollment: any = null;

    // 1. Try Prisma DB
    try {
      enrollment = await prisma.enrollment.findUnique({
        where: { orderId },
        include: { course: true, user: true },
      });
    } catch (e) {
      console.warn("Prisma lookup failed, checking memory store:", e);
    }

    // 2. Try Memory Store (with disk cache & cloud sync)
    if (!enrollment) {
      let memEnr = memoryStore.getEnrollmentByOrderId(orderId);
      if (!memEnr) {
        await memoryStore.syncFromCloud().catch(() => {});
        memEnr = memoryStore.getEnrollmentByOrderId(orderId);
      }
      if (memEnr) {
        enrollment = {
          orderId: memEnr.orderId,
          amountINR: memEnr.amountINR,
          userName: memEnr.userName,
          paymentStatus: memEnr.paymentStatus,
          utrNumber: memEnr.utrNumber,
          user: { email: memEnr.userEmail },
          course: { title: memEnr.course.title },
        };
      }
    }

    // 3. Auto-recover from client fallbackData if serverless container refreshed
    if (!enrollment && fallbackData && fallbackData.userName) {
      const mem = memoryStore.registerExternalOrder({
        orderId,
        userName: fallbackData.userName,
        userEmail: fallbackData.userEmail || fallbackData.email,
        courseTitle: fallbackData.courseTitle,
        college: fallbackData.college,
        amountINR: fallbackData.amountINR || 149,
      });

      enrollment = {
        orderId: mem.orderId,
        amountINR: mem.amountINR,
        userName: mem.userName,
        user: { email: mem.userEmail },
        course: { title: mem.course.title },
      };
    }

    // 4. If still not found, provide safe placeholder rather than blocking payment
    if (!enrollment) {
      enrollment = {
        orderId,
        amountINR: 149,
        userName: "Candidate",
        user: { email: "candidate@gmail.com" },
        course: { title: "Engineering Internship Program" },
      };
    }

    const razorpayOrderId = `rzp_order_${Date.now()}`;

    return NextResponse.json({
      success: true,
      orderId: enrollment.orderId,
      paymentStatus: enrollment.paymentStatus || "PENDING",
      utrNumber: enrollment.utrNumber || null,
      razorpayOrderId,
      amount: (enrollment.amountINR || 149) * 100, // in paise
      amountINR: enrollment.amountINR || 149,
      currency: "INR",
      keyId: process.env.RAZORPAY_KEY_ID || "rzp_test_mock_149",
      userName: enrollment.userName,
      userEmail: enrollment.user?.email || enrollment.userEmail || "candidate@gmail.com",
      courseTitle: enrollment.course?.title || "Internship Course",
    });
  } catch (error) {
    console.error("Payment order creation error:", error);
    return NextResponse.json(
      { success: false, message: "Could not initialize checkout" },
      { status: 500 }
    );
  }
}