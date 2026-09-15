import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateCertNo } from "@/lib/cert-id";
import { memoryStore } from "@/lib/store";
import { sendCertificateIssuedNotifications } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const adminKey = req.headers.get("x-admin-key");
    const referer = req.headers.get("referer") || "";
    const isFromAdmin = adminKey === "tv_secret_admin_session_valid" || referer.includes("/admin");

    if (!isFromAdmin) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Admin authority login required." },
        { status: 401 }
      );
    }

    // Sync from persistent cloud storage first so admin always has the latest enrollments
    await memoryStore.syncFromCloud().catch(() => {});
    const memOrders = memoryStore.getAllEnrollments();
    let dbOrders: any[] = [];

    try {
      dbOrders = await prisma.enrollment.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          course: true,
          user: true,
          certificate: true,
        },
        take: 150,
      });
    } catch (e) {
      console.warn("Prisma admin orders lookup bypassed:", e);
    }

    // Smart Merge & Strict Deduplication:
    // Deduplicate by certNo, by orderId, and by student identity (name + course)
    const orderMap = new Map<string, any>();
    const certIndex = new Map<string, string>(); // certNo -> orderId
    const identityIndex = new Map<string, string>(); // studentName|courseSlug -> orderId

    function addOrder(order: any) {
      if (!order || !order.orderId) return;

      const certNo = order.certificate?.certNo;
      const studentName = (order.userName || "").toLowerCase().trim();
      const courseSlug = (order.course?.slug || order.course?.title || "").toLowerCase().trim();
      const identityKey = studentName && courseSlug ? `${studentName}|${courseSlug}` : null;

      // 1. Check if certNo already seen
      if (certNo && certIndex.has(certNo)) {
        const existingOrderId = certIndex.get(certNo)!;
        const existing = orderMap.get(existingOrderId);
        if (existing) {
          orderMap.set(existingOrderId, { ...existing, ...order, orderId: existingOrderId });
          return;
        }
      }

      // 2. Check if student identity already seen with same cert
      if (identityKey && identityIndex.has(identityKey)) {
        const existingOrderId = identityIndex.get(identityKey)!;
        const existing = orderMap.get(existingOrderId);
        if (existing && existing.certificate && order.certificate) {
          orderMap.set(existingOrderId, { ...existing, ...order, orderId: existingOrderId });
          return;
        }
      }

      if (certNo) certIndex.set(certNo, order.orderId);
      if (identityKey) identityIndex.set(identityKey, order.orderId);
      orderMap.set(order.orderId, order);
    }

    for (const order of memOrders) {
      addOrder({
        id: order.id,
        orderId: order.orderId,
        userName: order.userName,
        college: order.college,
        startDate: order.startDate,
        endDate: order.endDate,
        mode: order.mode,
        amountINR: order.amountINR,
        paymentStatus: order.paymentStatus,
        utrNumber: order.utrNumber,
        paymentScreenshot: order.paymentScreenshot,
        paymentLink: order.paymentLink,
        course: order.course,
        user: { email: order.userEmail },
        certificate: order.certificate,
        createdAt: order.createdAt,
      });
    }

    for (const order of dbOrders) {
      addOrder(order);
    }

    const enrollments = Array.from(orderMap.values()).sort(
      (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );

    return NextResponse.json({ success: true, enrollments });
  } catch (error) {
    console.error("Admin orders error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const adminKey = req.headers.get("x-admin-key");
    const referer = req.headers.get("referer") || "";
    const isFromAdmin = adminKey === "tv_secret_admin_session_valid" || referer.includes("/admin");

    if (!isFromAdmin) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Admin authority login required." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { orderId, action, rejectionReason, order: incomingOrder } = body;

    // Sync from persistent cloud storage first so admin action always operates on latest state
    await memoryStore.syncFromCloud().catch(() => {});

    // 1. Manually Add Student from Admin Panel
    if (action === "ADD_STUDENT" || action === "CREATE_STUDENT") {
      const newEnr = memoryStore.addStudentDirectly({
        userName: body.userName,
        userEmail: body.userEmail,
        college: body.college,
        courseSlug: body.courseSlug,
        mode: body.mode || "Hybrid",
        startDate: body.startDate,
        amountINR: Number(body.amountINR) || 149,
        paymentStatus: body.paymentStatus || (body.issueCertificate ? "PAID" : "PENDING"),
        utrNumber: body.utrNumber,
        issueCertificate: body.issueCertificate ?? true,
      });

      await memoryStore.syncToCloud().catch(() => {});

      return NextResponse.json({
        success: true,
        message: `Student ${newEnr.userName} registered successfully! Order ID: ${newEnr.orderId}${
          newEnr.certificate ? ` (Certificate: ${newEnr.certificate.certNo})` : ""
        }`,
        order: newEnr,
      });
    }

    // 2. Sync Local Storage Orders from Admin Client
    if (action === "SYNC_LOCAL" && Array.isArray(body.orders)) {
      for (const ord of body.orders) {
        if (ord && ord.orderId) {
          memoryStore.registerExternalOrder({
            orderId: ord.orderId,
            userName: ord.userName,
            userEmail: ord.user?.email || ord.userEmail,
            courseTitle: ord.course?.title,
            courseSlug: ord.course?.slug,
            college: ord.college,
            amountINR: ord.amountINR,
            utrNumber: ord.utrNumber,
            paymentScreenshot: ord.paymentScreenshot,
            paymentStatus: ord.paymentStatus,
          });
        }
      }
      await memoryStore.syncToCloud().catch(() => {});
      return NextResponse.json({ success: true, message: "Local orders synchronized." });
    }

    // 3. Delete Order
    if (action === "DELETE_ORDER" && orderId) {
      memoryStore.deleteOrder(orderId);
      try {
        await prisma.enrollment.delete({ where: { orderId } });
      } catch (e) {}
      await memoryStore.syncToCloud().catch(() => {});
      return NextResponse.json({ success: true, message: `Order #${orderId} deleted.` });
    }

    // 4. Approve & Generate Certificate
    if (action === "APPROVE_AND_GENERATE" || action === "MANUAL_APPROVE") {
      // 1. If order was sent from frontend fallback, register it first
      if (incomingOrder && incomingOrder.orderId) {
        memoryStore.registerExternalOrder({
          orderId: incomingOrder.orderId,
          userName: incomingOrder.userName,
          userEmail: incomingOrder.user?.email || incomingOrder.userEmail,
          courseTitle: incomingOrder.course?.title,
          courseSlug: incomingOrder.course?.slug,
          college: incomingOrder.college,
          amountINR: incomingOrder.amountINR,
          utrNumber: incomingOrder.utrNumber,
          paymentScreenshot: incomingOrder.paymentScreenshot,
          paymentStatus: "PAID",
        });
      }

      // 2. Issue certificate via Memory Store
      let memEnr = memoryStore.approveAndIssueCertificate(orderId);
      let certNo = memEnr?.certificate?.certNo || "";

      // 3. Resilient fallback if orderId lookup failed (e.g. casing)
      if (!memEnr) {
        const all = memoryStore.getAllEnrollments();
        const matched = all.find((e) => e.orderId.toLowerCase() === (orderId || "").toLowerCase());
        if (matched) {
          memEnr = memoryStore.approveAndIssueCertificate(matched.orderId);
          certNo = memEnr?.certificate?.certNo || "";
        }
      }

      // 4. If still no certificate, generate directly
      if (!certNo) {
        certNo = generateCertNo();
        const existing = memoryStore.getEnrollmentByOrderId(orderId);
        if (existing) {
          existing.paymentStatus = "PAID";
          existing.certificate = {
            id: `cert_${Date.now()}`,
            certNo,
            enrollmentId: existing.id,
            pdfUrl: `/api/certificates/${certNo}/pdf`,
            qrPayload: `https://techvision-careers.vercel.app/verify/${certNo}`,
            issuedAt: new Date().toISOString(),
            revoked: false,
          };
          memEnr = existing;
        }
      }

      // 5. Try Prisma DB
      try {
        const enrollment = await prisma.enrollment.update({
          where: { orderId },
          data: { paymentStatus: "PAID" },
          include: { certificate: true },
        });

        let cert = enrollment.certificate;
        if (!cert) {
          certNo = certNo || generateCertNo();
          cert = await prisma.certificate.create({
            data: {
              certNo,
              enrollmentId: enrollment.id,
              pdfUrl: `/api/certificates/${certNo}/pdf`,
              qrPayload: `${process.env.NEXT_PUBLIC_APP_URL || "https://techvision-careers.vercel.app"}/verify/${certNo}`,
            },
          });
        }
        certNo = cert.certNo;
      } catch (dbErr) {
        console.warn("Prisma approval bypassed on serverless:", dbErr);
      }

      // 6. Sync updated certificate immediately to cloud storage
      await memoryStore.syncToCloud().catch(() => {});

      // 7. Send certificate ready email notification to student & admin
      if (memEnr && memEnr.userEmail && certNo) {
        sendCertificateIssuedNotifications({
          userName: memEnr.userName,
          userEmail: memEnr.userEmail,
          courseTitle: memEnr.course?.title || "Engineering Internship Course",
          orderId: memEnr.orderId,
          certNo,
        }).catch((e) => console.error("Async cert email error:", e));
      }

      return NextResponse.json({
        success: true,
        message: `Order #${orderId} verified and Certificate #${certNo} generated successfully!`,
        certNo,
        order: memEnr,
      });
    }

    if (action === "REJECT") {
      memoryStore.rejectPayment(orderId);
      try {
        await prisma.enrollment.update({
          where: { orderId },
          data: { paymentStatus: "REJECTED" },
        });
      } catch (e) {}

      await memoryStore.syncToCloud().catch(() => {});

      return NextResponse.json({
        success: true,
        message: `Order #${orderId} has been rejected.`,
      });
    }

    return NextResponse.json({ success: false, message: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Admin order action error:", error);
    return NextResponse.json({ success: false, message: "Action failed" }, { status: 500 });
  }
}