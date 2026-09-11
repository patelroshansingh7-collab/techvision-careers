import { NextRequest, NextResponse } from "next/server";
import { getEmailConfig, saveEmailConfig } from "@/lib/email-config";
import { sendTestEmail, sendTestMobileNotification } from "@/lib/email";
import { memoryStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await memoryStore.syncFromCloud().catch(() => {});
    const config = getEmailConfig();
    const notifications = memoryStore.getNotifications();
    const unreadCount = notifications.filter((n) => !n.read).length;

    const topic = config.ntfyTopic || "techvision_admin_9555593671";

    return NextResponse.json({
      success: true,
      settings: {
        adminEmail: config.adminEmail || "patelroshansingh7@gmail.com",
        adminPhone: config.adminPhone || "9555593671",
        senderEmail: config.senderEmail || "patelroshansingh7@gmail.com",
        hasPassword: !!config.gmailAppPassword,
        isConfigured: !!(config.senderEmail && config.gmailAppPassword),
        ntfyTopic: topic,
        subscribeUrl: `https://ntfy.sh/${topic}`,
        whatsappPhone: config.whatsappPhone || "919555593671",
        hasWhatsapp: !!config.whatsappApiKey,
        hasFast2sms: !!config.fast2smsApiKey,
      },
      notifications,
      unreadCount,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      adminEmail,
      adminPhone,
      senderEmail,
      gmailAppPassword,
      ntfyTopic,
      whatsappApiKey,
      whatsappPhone,
      fast2smsApiKey,
      action,
    } = body;

    // 1. Test Email
    if (action === "TEST" || action === "TEST_EMAIL") {
      if (gmailAppPassword) {
        saveEmailConfig({
          adminEmail,
          senderEmail,
          gmailAppPassword,
        });
      }
      const testResult = await sendTestEmail(adminEmail);
      return NextResponse.json(testResult, { status: testResult.success ? 200 : 400 });
    }

    // 2. Test Mobile Notification (ntfy.sh push + WhatsApp/SMS)
    if (action === "TEST_MOBILE") {
      if (adminPhone || ntfyTopic || whatsappApiKey || fast2smsApiKey) {
        saveEmailConfig({
          adminPhone,
          ntfyTopic,
          whatsappApiKey,
          whatsappPhone,
          fast2smsApiKey,
        });
      }
      const testResult = await sendTestMobileNotification();
      return NextResponse.json(testResult, { status: testResult.success ? 200 : 400 });
    }

    // 3. Mark in-app notifications as read
    if (action === "MARK_READ") {
      memoryStore.markAllNotificationsRead();
      return NextResponse.json({ success: true, message: "Notifications marked as read" });
    }

    // 4. Save all notification settings
    const updated = saveEmailConfig({
      adminEmail: adminEmail ? adminEmail.trim() : undefined,
      adminPhone: adminPhone ? adminPhone.trim() : undefined,
      senderEmail: senderEmail ? senderEmail.trim() : undefined,
      gmailAppPassword: gmailAppPassword ? gmailAppPassword.trim() : undefined,
      ntfyTopic: ntfyTopic ? ntfyTopic.trim() : undefined,
      whatsappApiKey: whatsappApiKey ? whatsappApiKey.trim() : undefined,
      whatsappPhone: whatsappPhone ? whatsappPhone.trim() : undefined,
      fast2smsApiKey: fast2smsApiKey ? fast2smsApiKey.trim() : undefined,
    });

    await memoryStore.syncToCloud().catch(() => {});

    return NextResponse.json({
      success: true,
      message: "Notification settings saved successfully! ✅",
      isConfigured: !!(updated.senderEmail && updated.gmailAppPassword),
      settings: {
        adminEmail: updated.adminEmail,
        adminPhone: updated.adminPhone,
        ntfyTopic: updated.ntfyTopic,
        subscribeUrl: `https://ntfy.sh/${updated.ntfyTopic || "techvision_admin_9555593671"}`,
      },
    });
  } catch (error: any) {
    console.error("Notification settings update error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
