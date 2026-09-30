import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateCertNo } from "@/lib/cert-id";
import { memoryStore } from "@/lib/store";
import { sendPaymentProofNotifications, sendCertificateIssuedNotifications } from "@/lib/email";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      orderId,
      utrNumber,
      paymentScreenshot,
      paymentLink,
      paymentId,
      isSimulated = false,
      userName,
      userEmail,
      courseTitle,
      college,
      amountINR,
    } = body;

    if (!orderId) {
      return NextResponse.json(
        { success: false, message: "Order ID is required" },
        { status: 400 }
      );
    }

    let studentName = userName || "";
    let studentEmail = userEmail || "";
    let finalCourseTitle = courseTitle || "";

    // Guarantee that if a screenshot is uploaded without a manual UTR, it is explicitly marked as SCREENSHOT_PROOF
    const effectiveUtr =
      (utrNumber && utrNumber.trim()) ||
      (paymentScreenshot ? "SCREENSHOT_PROOF" : null);

    // Offload heavy base64 screenshot to dedicated cloud storage bin so main ledger stays ultra-light (< 20KB)
    let finalScreenshot = paymentScreenshot;
    if (paymentScreenshot && paymentScreenshot.length > 500 && !paymentScreenshot.startsWith("http")) {
      finalScreenshot = await memoryStore.offloadScreenshotToCloud(orderId, paymentScreenshot).catch(() => paymentScreenshot);
    }

    // 1. Sync from cloud storage first so this lambda instance has the latest order
    await memoryStore.syncFromCloud().catch(() => {});

    // 2. Try Memory Store
    let memEnr = memoryStore.submitPaymentProof(orderId, {
      utrNumber: effectiveUtr,
      paymentScreenshot: finalScreenshot,
      paymentLink,
      isSimulated,
    });

    if (memEnr) {
      studentName = memEnr.userName || studentName;
      studentEmail = memEnr.userEmail || studentEmail;
      finalCourseTitle = memEnr.course?.title || finalCourseTitle;
    }

    // 2. Try Prisma DB
    try {
      const enrollment = await prisma.enrollment.findUnique({
        where: { orderId },
        include: { course: true, user: true, certificate: true },
      });

      if (enrollment) {
        studentName = enrollment.userName || studentName;
        studentEmail = enrollment.user.email || studentEmail;
        finalCourseTitle = enrollment.course.title || finalCourseTitle;

        const effectivePaymentId =
          paymentId ||
          (effectiveUtr ? `UPI_UTR_${effectiveUtr}` : `pay_proof_${Date.now()}`);

        if (isSimulated) {
          const updatedEnrollment = await prisma.enrollment.update({
            where: { orderId },
            data: {
              paymentStatus: "PAID",
              paymentId: effectivePaymentId,
              utrNumber: effectiveUtr || `SIM_${Date.now()}`,
              paymentScreenshot: paymentScreenshot || null,
              paymentLink: paymentLink ? paymentLink.trim() : null,
            },
          });

          let certificate = enrollment.certificate;
          if (!certificate) {
            const certNo = generateCertNo();
            certificate = await prisma.certificate.create({
              data: {
                certNo,
                enrollmentId: updatedEnrollment.id,
                pdfUrl: `/api/certificates/${certNo}/pdf`,
                qrPayload: `https://techvision-careers.vercel.app/verify/${certNo}`,
              },
            });
          }

          if (certificate && studentEmail) {
            try {
              await sendCertificateIssuedNotifications({
                userName: studentName || "Student",
                userEmail: studentEmail,
                courseTitle: finalCourseTitle || "Internship Course",
                orderId,
                certNo: certificate.certNo,
                startDate: updatedEnrollment.startDate,
                endDate: updatedEnrollment.endDate,
              });
            } catch (e) {
              console.error("Async cert email error:", e);
            }
          }

          return NextResponse.json({
            success: true,
            message: "Payment verified and certificate issued.",
            paymentStatus: "PAID",
            certNo: certificate.certNo,
            orderId: updatedEnrollment.orderId,
          });
        }

        const updatedEnrollment = await prisma.enrollment.update({
          where: { orderId },
          data: {
            paymentStatus: "SUBMITTED",
            paymentId: effectivePaymentId,
            utrNumber: effectiveUtr,
            paymentScreenshot: paymentScreenshot || null,
            paymentLink: paymentLink ? paymentLink.trim() : null,
          },
        });

        // Trigger Instant Mobile & Email Alert to Admin & Student
        try {
          await sendPaymentProofNotifications({
            userName: studentName || "Student",
            userEmail: studentEmail || "student@example.com",
            courseTitle: finalCourseTitle || "Internship Course",
            orderId,
            utrNumber: effectiveUtr,
            hasScreenshot: !!paymentScreenshot,
          });
        } catch (e) {
          console.error("Async email/mobile error:", e);
        }

        return NextResponse.json({
          success: true,
          message: "Payment proof submitted successfully for Admin review.",
          paymentStatus: "SUBMITTED",
          orderId: updatedEnrollment.orderId,
        });
      }
    } catch (dbErr) {
      console.warn("Prisma verification bypassed on serverless:", dbErr);
    }

    // 3. Resilient Auto-Recovery: If order was created in another serverless lambda instance
    if (!memEnr) {
      memEnr = memoryStore.registerExternalOrder({
        orderId,
        userName: studentName || "Candidate",
        userEmail: studentEmail || "student@example.com",
        courseTitle: finalCourseTitle || "Engineering Internship Course",
        college,
        amountINR: amountINR || 149,
        utrNumber: effectiveUtr,
        paymentScreenshot: finalScreenshot,
        paymentLink,
        paymentStatus: isSimulated ? "PAID" : "SUBMITTED",
      });
    }

    if (memEnr) {
      // Trigger Instant Mobile & Email Alert to Admin & Student
      try {
        await sendPaymentProofNotifications({
          userName: studentName || memEnr.userName,
          userEmail: studentEmail || memEnr.userEmail,
          courseTitle: finalCourseTitle || memEnr.course?.title || "Internship Course",
          orderId,
          utrNumber: effectiveUtr,
          hasScreenshot: !!finalScreenshot,
        });
      } catch (err) {
        console.error("Notification dispatch error:", err);
      }

      // Persist proof to cloud bins
      await memoryStore.patchEnrollmentToCloud(memEnr).catch(() => {});
      await memoryStore.syncToCloud().catch(() => {});

      return NextResponse.json({
        success: true,
        message: isSimulated
          ? "Payment verified and certificate issued."
          : "Payment proof submitted successfully for Admin review.",
        paymentStatus: memEnr.paymentStatus,
        certNo: memEnr.certificate?.certNo,
        orderId: memEnr.orderId,
      });
    }

    return NextResponse.json(
      { success: false, message: "Order verification failed" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Payment verification error:", error);
    return NextResponse.json(
      { success: false, message: "Payment submission failed" },
      { status: 500 }
    );
  }
}