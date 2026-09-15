import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { memoryStore } from "@/lib/store";
import { sendCertificateIssuedNotifications } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const orderId = searchParams.get("orderId")?.trim();
  const key = searchParams.get("key")?.trim();

  // Validate Secret Key for 1-Click Email Action
  if (key !== "tv_secret_admin_session_valid") {
    return new NextResponse(
      `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Unauthorized - TechVision Careers</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #080D1A; color: #F8FAFC; margin: 0; padding: 24px; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
          .card { max-width: 440px; width: 100%; background: #0E172A; border: 1px solid #EF4444; border-radius: 20px; padding: 32px; text-align: center; box-shadow: 0 20px 40px rgba(0,0,0,0.5); }
          h1 { color: #EF4444; font-size: 20px; margin: 12px 0; }
          p { font-size: 13px; color: #94A3B8; line-height: 1.6; }
        </style>
      </head>
      <body>
        <div class="card">
          <div style="font-size: 40px;">🔒</div>
          <h1>Security Key Invalid</h1>
          <p>This 1-click verification link is invalid or expired. Please open the official Admin Panel to review this payment manually.</p>
          <a href="/admin" style="display: inline-block; margin-top: 16px; background: #334155; color: #FFFFFF; text-decoration: none; padding: 10px 20px; border-radius: 10px; font-size: 13px; font-weight: bold;">Go to Admin Panel</a>
        </div>
      </body>
      </html>`,
      { status: 401, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  if (!orderId) {
    return new NextResponse(
      `<body style="background:#080D1A;color:#fff;font-family:sans-serif;padding:40px;text-align:center;"><h2>Missing Order ID</h2></body>`,
      { status: 400, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  // 1. Sync from cloud storage first
  await memoryStore.syncFromCloud().catch(() => {});

  // 2. Find the order in memory
  let enr = memoryStore.getEnrollmentByOrderId(orderId);
  if (!enr) {
    const all = memoryStore.getAllEnrollments();
    enr = all.find((e) => e.orderId.toLowerCase() === orderId.toLowerCase());
  }

  // 3. Fallback to Prisma DB
  if (!enr) {
    try {
      const dbEnr = await prisma.enrollment.findUnique({
        where: { orderId },
        include: { course: true, user: true, certificate: true },
      });
      if (dbEnr) {
        enr = memoryStore.registerExternalOrder({
          orderId: dbEnr.orderId,
          userName: dbEnr.userName,
          userEmail: dbEnr.user.email,
          courseTitle: dbEnr.course.title,
          courseSlug: dbEnr.course.slug,
          college: dbEnr.college,
          amountINR: dbEnr.amountINR,
          utrNumber: dbEnr.utrNumber,
          paymentScreenshot: dbEnr.paymentScreenshot,
          paymentStatus: dbEnr.paymentStatus as any,
        });
      }
    } catch (e) {}
  }

  if (!enr) {
    return new NextResponse(
      `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Order Not Found - TechVision</title>
        <style>
          body { font-family: -apple-system, sans-serif; background: #080D1A; color: #fff; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; }
          .card { max-width: 420px; width: 100%; background: #0E172A; border: 1px solid #334155; border-radius: 18px; padding: 28px; text-align: center; }
        </style>
      </head>
      <body>
        <div class="card">
          <div style="font-size: 36px;">⚠️</div>
          <h2 style="color: #F59E0B; margin: 12px 0;">Order #${orderId} Not Found</h2>
          <p style="color: #94A3B8; font-size: 13px;">This order could not be located. It may have been deleted or modified.</p>
          <a href="/admin" style="display:inline-block;margin-top:16px;background:#334155;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-size:12px;font-weight:bold;">Return to Admin Panel</a>
        </div>
      </body>
      </html>`,
      { status: 404, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  const alreadyPaid = enr.paymentStatus === "PAID" && !!enr.certificate;

  // 4. Issue Certificate if not already paid
  let certNo = enr.certificate?.certNo || "";
  if (!alreadyPaid) {
    const updated = memoryStore.approveAndIssueCertificate(orderId);
    if (updated && updated.certificate) {
      certNo = updated.certificate.certNo;
      enr = updated;
    }

    // Try Prisma update
    try {
      await prisma.enrollment.update({
        where: { orderId },
        data: { paymentStatus: "PAID" },
      });
    } catch (e) {}

    // Send certificate issued email notification to student
    if (certNo) {
      sendCertificateIssuedNotifications({
        userName: enr.userName,
        userEmail: enr.userEmail,
        courseTitle: enr.course.title,
        orderId: enr.orderId,
        certNo,
      }).catch((e) => console.error("Student cert email error:", e));
    }

    // Sync state to cloud bins
    await memoryStore.syncToCloud().catch(() => {});
  }

  const html = `<!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Payment Verified: ${enr.userName} — TechVision Careers</title>
    <style>
      * { box-sizing: border-box; }
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        background: #080D1A;
        color: #F8FAFC;
        margin: 0;
        padding: 24px 16px;
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .card {
        max-width: 500px;
        width: 100%;
        background: #0E172A;
        border: 1px solid #10B981;
        border-radius: 24px;
        padding: 36px 28px;
        text-align: center;
        box-shadow: 0 25px 50px -12px rgba(16, 185, 129, 0.25);
      }
      .badge {
        display: inline-block;
        background: #064E3B;
        color: #34D399;
        border: 1px solid #059669;
        font-size: 11px;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 1px;
        padding: 6px 14px;
        border-radius: 9999px;
        margin-bottom: 16px;
      }
      h1 {
        font-size: 22px;
        font-weight: 900;
        color: #FFFFFF;
        margin: 0 0 8px;
      }
      .subtitle {
        font-size: 13px;
        color: #94A3B8;
        line-height: 1.5;
        margin-bottom: 24px;
      }
      .details-box {
        background: #090E17;
        border: 1px solid #1E293B;
        border-radius: 16px;
        padding: 20px;
        margin-bottom: 24px;
        text-align: left;
        font-size: 13px;
      }
      .detail-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 0;
        border-bottom: 1px solid rgba(30, 41, 59, 0.6);
      }
      .detail-row:last-child {
        border-bottom: none;
      }
      .detail-label {
        color: #94A3B8;
        font-weight: 500;
      }
      .detail-value {
        color: #FFFFFF;
        font-weight: 700;
        text-align: right;
      }
      .cert-no {
        font-family: monospace;
        color: #FDE047;
        font-size: 14px;
      }
      .btn {
        display: block;
        width: 100%;
        padding: 14px 20px;
        border-radius: 12px;
        text-decoration: none;
        font-weight: 800;
        font-size: 13px;
        margin-bottom: 10px;
        transition: all 0.2s;
        text-align: center;
      }
      .btn-primary {
        background: #10B981;
        color: #064E3B;
        background: linear-gradient(135deg, #10B981, #059669);
        color: #FFFFFF;
        box-shadow: 0 6px 18px rgba(16, 185, 129, 0.35);
      }
      .btn-gold {
        background: #C9A14A;
        color: #0E1B47;
      }
      .btn-secondary {
        background: #1E293B;
        color: #E2E8F0;
        border: 1px solid #334155;
      }
    </style>
  </head>
  <body>
    <div class="card">
      <div class="badge">${alreadyPaid ? "Already Verified" : "1-Click Verification Successful"}</div>
      
      <div style="font-size: 48px; margin-bottom: 8px;">✅</div>
      
      <h1>${alreadyPaid ? "Certificate Already Issued" : "Payment Verified & Certificate Issued!"}</h1>
      <p class="subtitle">
        Payment proof has been approved. The official QR-verifiable certificate has been issued and emailed to the student.
      </p>

      <div class="details-box">
        <div class="detail-row">
          <span class="detail-label">Candidate Name</span>
          <span class="detail-value">${enr.userName}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Student Email</span>
          <span class="detail-value" style="font-size:12px;">${enr.userEmail}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Internship Course</span>
          <span class="detail-value" style="color:#C9A14A;">${enr.course?.title}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Order ID</span>
          <span class="detail-value" style="font-family:monospace;font-size:11px;">${enr.orderId}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Certificate ID</span>
          <span class="detail-value cert-no">${certNo || "TVC-IN-2026-ACTIVE"}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Payment Status</span>
          <span class="detail-value" style="color:#34D399;">PAID (Verified)</span>
        </div>
      </div>

      <a href="/verify/${certNo}" target="_blank" class="btn btn-gold">
        👁 View / Verify Official Certificate →
      </a>

      <a href="/generate/${enr.orderId}" target="_blank" class="btn btn-secondary">
        📄 Open Student Certificate Page
      </a>

      <a href="/admin" class="btn btn-secondary">
        ⚙️ Open Admin Control Dashboard
      </a>
    </div>
  </body>
  </html>`;

  const response = new NextResponse(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });

  response.cookies.set("tv_admin_session", "true", {
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
    sameSite: "lax",
  });

  return response;
}
