import nodemailer from "nodemailer";
import { getEmailConfig } from "./email-config";
import { memoryStore } from "./store";

interface EnrollmentEmailData {
  userName: string;
  userEmail: string;
  courseTitle: string;
  orderId: string;
  college?: string | null;
  amountINR: number;
  mode: string;
}

interface PaymentProofEmailData {
  userName: string;
  userEmail: string;
  courseTitle: string;
  orderId: string;
  utrNumber?: string | null;
  hasScreenshot?: boolean;
}

// 1. Mobile Push Notification via ntfy.sh (Instant Alert with sound on Admin Phone)
export async function sendNtfyPush({
  topic,
  title,
  message,
  clickUrl,
  priority = "high",
  tags = "bell",
}: {
  topic: string;
  title: string;
  message: string;
  clickUrl?: string;
  priority?: string;
  tags?: string;
}): Promise<boolean> {
  try {
    const cleanTopic = topic.trim().replace(/^https?:\/\/ntfy\.sh\//, "");
    const priorityMap: Record<string, number> = {
      urgent: 5,
      high: 4,
      default: 3,
      low: 2,
      min: 1,
    };
    const prioNum = priorityMap[priority.toLowerCase()] || 4;
    const tagList = tags
      ? tags.split(",").map((t) => t.trim()).filter(Boolean)
      : ["bell"];

    const payload: Record<string, any> = {
      topic: cleanTopic,
      title,
      message,
      priority: prioNum,
      tags: tagList,
    };
    if (clickUrl) {
      payload.click = clickUrl;
    }

    const res = await fetch("https://ntfy.sh", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    console.log(`[ntfy.sh] Push sent to topic "${cleanTopic}", status: ${res.status}`);
    return res.ok;
  } catch (err) {
    console.error("[ntfy.sh] Push error:", err);
    return false;
  }
}

// 2. WhatsApp Notification via CallMeBot API
export async function sendWhatsAppAlert({
  phone,
  apiKey,
  message,
}: {
  phone: string;
  apiKey: string;
  message: string;
}): Promise<boolean> {
  if (!apiKey || !phone) return false;
  try {
    const cleanPhone = phone.replace(/[^0-9]/g, "");
    const url = `https://api.callmebot.com/whatsapp.php?phone=${cleanPhone}&text=${encodeURIComponent(
      message
    )}&apikey=${encodeURIComponent(apiKey.trim())}`;
    const res = await fetch(url);
    console.log(`[CallMeBot WhatsApp] Sent to ${cleanPhone}, status: ${res.status}`);
    return res.ok;
  } catch (err) {
    console.error("[CallMeBot WhatsApp] Failed:", err);
    return false;
  }
}

// 3. SMS Notification via Fast2SMS API
export async function sendFast2SmsAlert({
  phone,
  apiKey,
  message,
}: {
  phone: string;
  apiKey: string;
  message: string;
}): Promise<boolean> {
  if (!apiKey || !phone) return false;
  try {
    const cleanPhone = phone.replace(/[^0-9]/g, "").slice(-10);
    const res = await fetch("https://www.fast2sms.com/dev/bulkV2", {
      method: "POST",
      headers: {
        authorization: apiKey.trim(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        route: "q",
        message: message,
        language: "english",
        flash: 0,
        numbers: cleanPhone,
      }),
    });
    console.log(`[Fast2SMS] Sent to ${cleanPhone}, status: ${res.status}`);
    return res.ok;
  } catch (err) {
    console.error("[Fast2SMS] Failed:", err);
    return false;
  }
}

// 4. Test Mobile Notification
export async function sendTestMobileNotification() {
  const config = getEmailConfig();
  const topic = config.ntfyTopic || "techvision_admin_9555593671";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://techvision-careers.vercel.app";

  const ntfySuccess = await sendNtfyPush({
    topic,
    title: "🔔 TechVision Careers: Mobile Alert Test Successful! ✅",
    message: `Namaste Admin!\nYour mobile alert system for phone 9555593671 is ACTIVE and CONNECTED!\n\nYou will receive instant notification sound on this device whenever a student enrolls or submits payment proof.`,
    clickUrl: `${appUrl}/admin`,
    priority: "urgent",
    tags: "bell,white_check_mark,sparkles",
  });

  let whatsappSuccess = false;
  if (config.whatsappApiKey && (config.whatsappPhone || config.adminPhone)) {
    const targetPhone = config.whatsappPhone || config.adminPhone || "919555593671";
    whatsappSuccess = await sendWhatsAppAlert({
      phone: targetPhone,
      apiKey: config.whatsappApiKey,
      message: "🔔 TechVision Careers: WhatsApp alert test successful! ✅",
    });
  }

  let smsSuccess = false;
  if (config.fast2smsApiKey && config.adminPhone) {
    smsSuccess = await sendFast2SmsAlert({
      phone: config.adminPhone,
      apiKey: config.fast2smsApiKey,
      message: "TechVision Careers: Mobile SMS alert test successful! ✅",
    });
  }

  return {
    success: ntfySuccess || whatsappSuccess || smsSuccess,
    ntfySuccess,
    whatsappSuccess,
    smsSuccess,
    topic,
    phone: config.adminPhone || "9555593671",
    subscribeUrl: `https://ntfy.sh/${topic}`,
    message: ntfySuccess
      ? `Mobile push alert sent to phone topic "${topic}"!`
      : "Mobile alert could not be sent.",
  };
}

function getTransporter() {
  const config = getEmailConfig();
  const user = (config.senderEmail || process.env.GMAIL_USER || process.env.SMTP_USER || "patelroshansingh7@gmail.com").trim();
  const pass = (config.gmailAppPassword || process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS || "fusxcwbterwxrfnr").trim().replace(/\s+/g, "");

  if (user && pass) {
    const isGmail = user.includes("@gmail.com");
    if (isGmail) {
      return nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: user.trim(),
          pass: pass.trim().replace(/\s+/g, ""),
        },
      });
    }

    return nodemailer.createTransport({
      host: config.smtpHost || "smtp.gmail.com",
      port: config.smtpPort || 587,
      secure: config.smtpPort === 465,
      auth: {
        user: user.trim(),
        pass: pass.trim(),
      },
    });
  }
  return null;
}

// 5. Cloud Email Relay (FormSubmit - Direct-to-Inbox without requiring SMTP setup)
export async function sendEmailRelay({
  to,
  subject,
  data,
}: {
  to: string;
  subject: string;
  data: Record<string, any>;
}): Promise<boolean> {
  try {
    const targetEmail = (to || "patelroshansingh7@gmail.com").trim();
    const payload: Record<string, any> = {
      _subject: subject,
      _template: "table",
      ...data,
    };

    const res = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(targetEmail)}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Origin: "https://techvision-careers.vercel.app",
        Referer: "https://techvision-careers.vercel.app/",
      },
      body: JSON.stringify(payload),
    });

    console.log(`[Email Relay] Dispatched to ${targetEmail}, status: ${res.status}`);
    return res.ok;
  } catch (err) {
    console.error("[Email Relay Error]:", err);
    return false;
  }
}

export async function sendTestEmail(targetEmail?: string) {
  const config = getEmailConfig();
  const recipient = targetEmail || config.adminEmail || "patelroshansingh7@gmail.com";
  const transporter = getTransporter();

  let nodemailerSuccess = false;

  // Try Nodemailer if credentials provided
  if (transporter) {
    try {
      const info = await transporter.sendMail({
        from: `"TechVision Careers Official" <${config.senderEmail}>`,
        to: recipient,
        subject: "🧪 TechVision Careers: Email Notification Test Successful! ✅",
        html: `
          <div style="font-family: Arial, sans-serif; background: #0E1B47; color: #FFFFFF; padding: 24px; border-radius: 12px; max-width: 500px; margin: 0 auto; border: 1px solid #C9A14A;">
            <h2 style="color: #C9A14A; margin-top: 0;">TechVision Careers Email Test</h2>
            <p style="color: #E2E8F0; font-size: 14px;">This is a test notification confirming that your email delivery system is <strong>100% active and connected!</strong></p>
            <div style="background: #081028; padding: 12px; border-radius: 8px; font-size: 12px; color: #94A3B8; margin: 16px 0;">
              <p style="margin: 4px 0;">• Sender: <strong>${config.senderEmail}</strong></p>
              <p style="margin: 4px 0;">• Recipient: <strong>${recipient}</strong></p>
              <p style="margin: 4px 0;">• Time: <strong>${new Date().toLocaleString()}</strong></p>
            </div>
            <p style="color: #34D399; font-size: 13px; font-weight: bold;">✅ All student enrollments and payment alerts will now arrive in your inbox!</p>
          </div>
        `,
      });

      console.log(`[Test Email] Sent via Nodemailer to ${recipient}, msgId: ${info.messageId}`);
      nodemailerSuccess = true;
    } catch (error: any) {
      console.warn("[Nodemailer Error, falling back to FormSubmit relay]:", error);
    }
  }

  // Also dispatch via FormSubmit Direct Cloud Relay
  await sendEmailRelay({
    to: recipient,
    subject: "🧪 TechVision Careers: Admin Phone Email Test ✅",
    data: {
      "Notification Type": "Admin Email Test",
      "Recipient Phone Email": recipient,
      "Status": "ACTIVE & CONNECTED",
      "Message": "You will receive an email message whenever any student enrolls or submits payment!",
      "Admin Panel": "https://techvision-careers.vercel.app/admin",
      "Timestamp": new Date().toLocaleString(),
    },
  });

  return {
    success: true,
    message: nodemailerSuccess
      ? `Test email delivered to ${recipient} via Gmail SMTP! Check your inbox.`
      : `Test email dispatched to ${recipient}! Check your inbox (or Spam tab). Click 'Activate Form' if you received a FormSubmit confirmation email to unlock instant notifications.`,
  };
}

export async function sendEnrollmentNotifications(data: EnrollmentEmailData) {
  const config = getEmailConfig();
  const rawAdminEmail = config.adminEmail;
  const adminEmail = (!rawAdminEmail || rawAdminEmail.toLowerCase().includes("techvisioncareers.com"))
    ? "patelroshansingh7@gmail.com"
    : rawAdminEmail;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://techvision-careers.vercel.app";
  const paymentLink = `${appUrl}/payment/${data.orderId}`;
  const adminLink = `${appUrl}/admin`;
  const quickApproveUrl = `${appUrl}/api/admin/quick-approve?orderId=${data.orderId}&key=tv_secret_admin_session_valid`;

  // 1. Student HTML Email
  const userHtml = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8" /></head>
    <body style="font-family: Arial, sans-serif; background-color: #0B132B; color: #E2E8F0; padding: 24px; margin: 0;">
      <div style="max-width: 600px; margin: 0 auto; background: #0E1B47; border: 1px solid #C9A14A; border-radius: 16px; padding: 32px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
        <div style="text-align: center; border-bottom: 1px solid rgba(201, 161, 74, 0.3); padding-bottom: 20px; margin-bottom: 24px;">
          <h2 style="color: #C9A14A; margin: 0; font-size: 24px; letter-spacing: 1px;">TECHVISION CAREERS</h2>
          <p style="color: #94A3B8; font-size: 11px; margin-top: 4px; text-transform: uppercase;">Empowering Careers Through Technology & Skills</p>
        </div>

        <h1 style="color: #FFFFFF; font-size: 22px; margin-top: 0;">🎉 Congratulations, ${data.userName}!</h1>
        <p style="color: #CBD5E1; font-size: 14px; line-height: 1.6;">
          Your enrollment in <strong>${data.courseTitle}</strong> has been registered successfully!
        </p>

        <div style="background: #081028; border: 1px solid #1E293B; border-radius: 12px; padding: 18px; margin: 20px 0;">
          <table style="width: 100%; font-size: 13px; color: #CBD5E1; border-collapse: collapse;">
            <tr>
              <td style="padding: 6px 0; color: #94A3B8;">Order ID:</td>
              <td style="padding: 6px 0; text-align: right; font-family: monospace; font-weight: bold; color: #FDE047;">${data.orderId}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #94A3B8;">Internship Course:</td>
              <td style="padding: 6px 0; text-align: right; font-weight: bold; color: #FFFFFF;">${data.courseTitle}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #94A3B8;">Mode:</td>
              <td style="padding: 6px 0; text-align: right; color: #FFFFFF;">${data.mode}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #94A3B8;">Certification Fee:</td>
              <td style="padding: 6px 0; text-align: right; font-weight: bold; color: #34D399;">₹${data.amountINR}</td>
            </tr>
          </table>
        </div>

        <div style="text-align: center; margin: 28px 0;">
          <p style="color: #E2E8F0; font-size: 13px; margin-bottom: 16px;">
            To activate your official certificate with verifiable QR code, please complete the nominal fee of <strong>₹${data.amountINR}</strong> and upload your payment proof.
          </p>
          <a href="${paymentLink}" style="display: inline-block; background: #C9A14A; color: #0E1B47; font-weight: bold; font-size: 14px; padding: 12px 28px; border-radius: 10px; text-decoration: none; box-shadow: 0 4px 14px rgba(201, 161, 74, 0.4);">
            Complete ₹${data.amountINR} Payment & Upload Proof →
          </a>
        </div>

        <div style="border-top: 1px solid #1E293B; padding-top: 16px; margin-top: 24px; text-align: center; font-size: 11px; color: #64748B;">
          <p style="margin: 4px 0;">TechVision Careers Authority • All Rights Reserved</p>
          <p style="margin: 4px 0;">Questions? Visit https://techvision-careers.vercel.app</p>
        </div>
      </div>
    </body>
    </html>
  `;

  // 2. Admin HTML Alert with 1-Click Verification
  const adminHtml = `
    <!DOCTYPE html>
    <html>
    <body style="font-family: Arial, sans-serif; background-color: #0F172A; color: #F8FAFC; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background: #1E293B; border: 1px solid #F59E0B; border-radius: 12px; padding: 24px;">
        <h2 style="color: #F59E0B; margin-top: 0; font-size: 20px;">🚨 New Candidate Enrollment Alert</h2>
        <p style="color: #E2E8F0; font-size: 14px;">A new student has just enrolled on TechVision Careers:</p>
        
        <div style="background: #0F172A; border-radius: 8px; padding: 16px; margin: 16px 0; font-size: 13px;">
          <p style="margin: 6px 0;"><strong>Candidate Name:</strong> ${data.userName}</p>
          <p style="margin: 6px 0;"><strong>Email:</strong> ${data.userEmail}</p>
          <p style="margin: 6px 0;"><strong>College:</strong> ${data.college || "N/A"}</p>
          <p style="margin: 6px 0;"><strong>Course:</strong> ${data.courseTitle}</p>
          <p style="margin: 6px 0;"><strong>Order ID:</strong> <code style="color: #FDE047;">${data.orderId}</code></p>
          <p style="margin: 6px 0;"><strong>Payable Fee:</strong> ₹${data.amountINR}</p>
        </div>

        <div style="text-align: center; margin: 22px 0 8px;">
          <a href="${quickApproveUrl}" style="display: block; width: 100%; box-sizing: border-box; background: #10B981; background: linear-gradient(135deg, #10B981, #059669); color: #FFFFFF; font-weight: 900; font-size: 14px; padding: 14px 20px; border-radius: 10px; text-decoration: none; box-shadow: 0 4px 14px rgba(16, 185, 129, 0.35); text-align: center;">
            ⚡ 1-Click Instant Approve & Issue Certificate →
          </a>
        </div>

        <div style="text-align: center; margin-top: 10px;">
          <a href="${adminLink}" style="color: #94A3B8; font-size: 12px; text-decoration: underline;">
            Open Admin Panel for Manual Review
          </a>
        </div>
      </div>
    </body>
    </html>
  `;

  const transporter = getTransporter();

  // Send to Student
  if (transporter) {
    try {
      await transporter.sendMail({
        from: `"TechVision Careers" <${config.senderEmail}>`,
        to: data.userEmail,
        subject: `🎉 Congratulations! Your Enrollment in ${data.courseTitle} is Successful — TechVision Careers`,
        html: userHtml,
      });
      console.log(`[Email] Real student enrollment email sent to ${data.userEmail}`);
    } catch (err) {
      console.error("[Email Error] Failed to send student email:", err);
    }
  } else {
    console.log(`[Pending Setup] Email not sent to ${data.userEmail} because SMTP/App Password is not yet configured.`);
  }

  // Send to Admin
  if (transporter) {
    try {
      await transporter.sendMail({
        from: `"TechVision Portal" <${config.senderEmail}>`,
        to: adminEmail,
        subject: `🚨 New Enrollment: ${data.userName} enrolled in ${data.courseTitle} (Order #${data.orderId})`,
        html: adminHtml,
      });
      console.log(`[Email] Real admin alert email sent to ${adminEmail}`);
    } catch (err) {
      console.error("[Email Error] Failed to send admin email:", err);
    }
  } else {
    console.log(`[Pending Setup] Admin email alert not sent to ${adminEmail} because SMTP/App Password is not yet configured.`);
  }

  // Send direct email message to Admin phone email (patelroshansingh7@gmail.com) via FormSubmit Cloud Relay
  sendEmailRelay({
    to: adminEmail,
    subject: `🎓 New Student Enrollment: ${data.userName} (₹${data.amountINR}) - TechVision Careers`,
    data: {
      "Candidate Name": data.userName,
      "Internship Course": data.courseTitle,
      "Order ID": data.orderId,
      "Certification Fee": `₹${data.amountINR}`,
      "Student Email": data.userEmail,
      "College": data.college || "N/A",
      "Mode": data.mode,
      "Student Payment Link": paymentLink,
      "Admin Approval Panel": adminLink,
      "Timestamp": new Date().toLocaleString(),
    },
  }).catch((e) => console.error("Admin enrollment email relay error:", e));

  // 3. Instant Mobile Push Notification to Admin Phone (ntfy.sh)
  const mobileTopic = config.ntfyTopic || "techvision_admin_9555593671";
  try {
    await sendNtfyPush({
      topic: mobileTopic,
      title: `🎓 New Student Enrolled! (${data.userName})`,
      message: `Candidate: ${data.userName}\nCourse: ${data.courseTitle}\nFee: ₹${data.amountINR}\nOrder ID: ${data.orderId}\nEmail: ${data.userEmail}\nCollege: ${data.college || "N/A"}\n👉 Open Admin Panel to view enrollment.`,
      clickUrl: `${appUrl}/admin`,
      priority: "high",
      tags: "mortarboard,bell,white_check_mark",
    });
  } catch (e) {
    console.error("ntfy push error:", e);
  }

  // 4. Instant WhatsApp to Admin Phone (if configured)
  if (config.whatsappApiKey && (config.whatsappPhone || config.adminPhone)) {
    const targetPhone = config.whatsappPhone || config.adminPhone || "919555593671";
    sendWhatsAppAlert({
      phone: targetPhone,
      apiKey: config.whatsappApiKey,
      message: `🚨 *TechVision Careers: New Student Enrollment!*\n\n👤 *Candidate:* ${data.userName}\n📚 *Course:* ${data.courseTitle}\n💰 *Fee:* ₹${data.amountINR}\n🆔 *Order ID:* ${data.orderId}\n📧 *Email:* ${data.userEmail}\n\n👉 Open Admin Panel: ${appUrl}/admin`,
    }).catch((e) => console.error("WhatsApp error:", e));
  }

  // 5. Instant SMS via Fast2SMS (if configured)
  if (config.fast2smsApiKey && config.adminPhone) {
    sendFast2SmsAlert({
      phone: config.adminPhone,
      apiKey: config.fast2smsApiKey,
      message: `TechVision: New Enrollment! Candidate: ${data.userName}, Course: ${data.courseTitle}, Order: ${data.orderId}`,
    }).catch((e) => console.error("Fast2SMS error:", e));
  }

  // 6. Record In-App Alert for Dashboard Real-Time Bell
  try {
    memoryStore.addNotification({
      type: "ENROLLMENT",
      title: `🎓 New Student: ${data.userName}`,
      message: `Enrolled in ${data.courseTitle} (Order #${data.orderId})`,
      orderId: data.orderId,
      userName: data.userName,
      userEmail: data.userEmail,
      courseTitle: data.courseTitle,
      amountINR: data.amountINR,
    });
  } catch (e) {
    console.error("Dashboard notification store error:", e);
  }
}

export async function sendPaymentProofNotifications(data: PaymentProofEmailData) {
  const config = getEmailConfig();
  const rawAdminEmail = config.adminEmail;
  const adminEmail = (!rawAdminEmail || rawAdminEmail.toLowerCase().includes("techvisioncareers.com"))
    ? "patelroshansingh7@gmail.com"
    : rawAdminEmail;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://techvision-careers.vercel.app";
  const certPageLink = `${appUrl}/generate/${data.orderId}`;
  const adminLink = `${appUrl}/admin`;
  const quickApproveUrl = `${appUrl}/api/admin/quick-approve?orderId=${data.orderId}&key=tv_secret_admin_session_valid`;

  // 1. Student Confirmation Email
  const userHtml = `
    <!DOCTYPE html>
    <html>
    <body style="font-family: Arial, sans-serif; background-color: #0B132B; color: #E2E8F0; padding: 24px;">
      <div style="max-width: 600px; margin: 0 auto; background: #0E1B47; border: 1px solid #10B981; border-radius: 16px; padding: 32px;">
        <h2 style="color: #10B981; margin-top: 0; font-size: 22px;">💳 Payment Details Submitted!</h2>
        <p style="color: #CBD5E1; font-size: 14px; line-height: 1.6;">
          Hello <strong>${data.userName}</strong>, we have received your payment details for <strong>${data.courseTitle}</strong>.
        </p>

        <div style="background: #081028; border: 1px solid #1E293B; border-radius: 10px; padding: 16px; margin: 18px 0; font-size: 13px;">
          <p style="margin: 4px 0;"><strong>Order ID:</strong> ${data.orderId}</p>
          <p style="margin: 4px 0;"><strong>Submitted UTR:</strong> ${data.utrNumber || "Payment Screenshot Uploaded"}</p>
          <p style="margin: 4px 0; color: #F59E0B;"><strong>Status:</strong> Under Review by Admin Authority</p>
        </div>

        <p style="color: #94A3B8; font-size: 12px; line-height: 1.5;">
          Our administration team is verifying your ₹149 credit. Once verified, your official Certificate will automatically unlock.
        </p>

        <div style="text-align: center; margin-top: 24px;">
          <a href="${certPageLink}" style="display: inline-block; background: #C9A14A; color: #0E1B47; font-weight: bold; font-size: 13px; padding: 12px 24px; border-radius: 8px; text-decoration: none;">
            Check Certificate Generation Status →
          </a>
        </div>
      </div>
    </body>
    </html>
  `;

  // 2. Admin URGENT Action Alert with 1-Click Verification
  const adminHtml = `
    <!DOCTYPE html>
    <html>
    <body style="font-family: Arial, sans-serif; background-color: #0F172A; color: #F8FAFC; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background: #1E293B; border: 2px solid #10B981; border-radius: 16px; padding: 26px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
        <div style="background: #10B981; color: #064E3B; font-weight: bold; font-size: 11px; padding: 5px 12px; border-radius: 20px; display: inline-block; text-transform: uppercase;">
          Urgent Action Required
        </div>
        <h2 style="color: #FFFFFF; margin: 12px 0 6px; font-size: 20px;">⚡ Verify Payment for ${data.userName}</h2>
        <p style="color: #CBD5E1; font-size: 13px;">The student has uploaded payment proof for <strong>${data.courseTitle}</strong>:</p>
        
        <div style="background: #0F172A; border-radius: 10px; padding: 18px; margin: 16px 0; font-size: 13px; border: 1px solid #334155;">
          <p style="margin: 5px 0;"><strong>Candidate Name:</strong> ${data.userName} (${data.userEmail})</p>
          <p style="margin: 5px 0;"><strong>Order ID:</strong> <code style="color:#FDE047;">${data.orderId}</code></p>
          <p style="margin: 5px 0;"><strong>Submitted UTR / Ref ID:</strong> <span style="color: #FDE047; font-family: monospace; font-weight: bold; font-size: 15px;">${data.utrNumber || "Uploaded as Screenshot"}</span></p>
          <p style="margin: 5px 0;"><strong>Screenshot Proof:</strong> ${data.hasScreenshot ? "✅ Attached in Admin Dashboard" : "None"}</p>
        </div>

        <p style="color: #E2E8F0; font-size: 13px; margin-bottom: 20px;">
          Please check your UPI / Bank Account for ₹149 credit. Click the button below to approve and instantly issue the certificate:
        </p>

        <!-- 1-Click Verification Button -->
        <div style="text-align: center; margin: 25px 0 10px;">
          <a href="${quickApproveUrl}" style="display: block; width: 100%; box-sizing: border-box; background: #10B981; background: linear-gradient(135deg, #10B981, #059669); color: #FFFFFF; font-weight: 900; font-size: 15px; padding: 16px 24px; border-radius: 12px; text-decoration: none; box-shadow: 0 6px 18px rgba(16, 185, 129, 0.4); text-align: center; letter-spacing: 0.5px;">
            ⚡ 1-CLICK VERIFY & ISSUE CERTIFICATE NOW →
          </a>
        </div>
        <p style="text-align: center; font-size: 11px; color: #94A3B8; margin: 6px 0 16px;">
          (Clicking above immediately unlocks & issues the student certificate without login)
        </p>

        <div style="text-align: center; border-top: 1px solid #334155; padding-top: 14px;">
          <a href="${adminLink}" style="color: #38BDF8; font-size: 12px; text-decoration: underline;">
            🔍 Open Admin Panel for Manual Review
          </a>
        </div>
      </div>
    </body>
    </html>
  `;

  const transporter = getTransporter();

  // Send Student Email
  if (transporter) {
    try {
      await transporter.sendMail({
        from: `"TechVision Careers" <${config.senderEmail}>`,
        to: data.userEmail,
        subject: `💳 Payment Details Submitted for Order #${data.orderId} — TechVision Careers`,
        html: userHtml,
      });
      console.log(`[Email] Payment confirmation email sent to ${data.userEmail}`);
    } catch (err) {
      console.error("[Email Error] Failed to send payment confirmation to student:", err);
    }
  }

  // Send Admin Email
  if (transporter) {
    try {
      await transporter.sendMail({
        from: `"TechVision Portal" <${config.senderEmail}>`,
        to: adminEmail,
        subject: `⚡ URGENT: Verify Payment Proof from ${data.userName} (UTR: ${data.utrNumber || 'Screenshot'})`,
        html: adminHtml,
      });
      console.log(`[Email] Admin payment verification alert sent to ${adminEmail}`);
    } catch (err) {
      console.error("[Email Error] Failed to send admin payment alert:", err);
    }
  }

  // Send direct email message to Admin phone email (patelroshansingh7@gmail.com) via FormSubmit Cloud Relay
  sendEmailRelay({
    to: adminEmail,
    subject: `⚡ URGENT: Payment Proof Uploaded for Order #${data.orderId} (${data.userName})`,
    data: {
      "Candidate Name": data.userName,
      "Internship Course": data.courseTitle,
      "Order ID": data.orderId,
      "Submitted UTR / Ref ID": data.utrNumber || "Screenshot Attached",
      "Screenshot Uploaded": data.hasScreenshot ? "Yes (Attached in Admin)" : "No",
      "Student Email": data.userEmail,
      "1-Click Verify & Approve": quickApproveUrl,
      "Admin Approval Link": adminLink,
      "Upload Time": new Date().toLocaleString(),
    },
  }).catch((e) => console.error("Admin payment proof email relay error:", e));

  // 3. Instant Mobile Push Notification to Admin Phone (ntfy.sh)
  const mobileTopic = config.ntfyTopic || "techvision_admin_9555593671";
  try {
    await sendNtfyPush({
      topic: mobileTopic,
      title: `💳 Urgent: Verify ₹149 Payment from ${data.userName}!`,
      message: `Student: ${data.userName}\nCourse: ${data.courseTitle}\nSubmitted UTR: ${data.utrNumber || "Screenshot uploaded"}\nOrder ID: ${data.orderId}\n👉 Tap to 1-Click Verify & Issue Certificate!`,
      clickUrl: quickApproveUrl,
      priority: "urgent",
      tags: "credit_card,moneybag,warning",
    });
  } catch (e) {
    console.error("ntfy push error:", e);
  }

  // 4. Instant WhatsApp to Admin Phone (if configured)
  if (config.whatsappApiKey && (config.whatsappPhone || config.adminPhone)) {
    const targetPhone = config.whatsappPhone || config.adminPhone || "919555593671";
    sendWhatsAppAlert({
      phone: targetPhone,
      apiKey: config.whatsappApiKey,
      message: `💳 *URGENT: Verify Payment Proof!*\n\n👤 *Candidate:* ${data.userName}\n📚 *Course:* ${data.courseTitle}\n🔢 *Submitted UTR:* ${data.utrNumber || "Screenshot uploaded"}\n🆔 *Order ID:* ${data.orderId}\n\n👉 1-Click Verify & Issue Certificate:\n${quickApproveUrl}`,
    }).catch((e) => console.error("WhatsApp error:", e));
  }

  // 5. Instant SMS via Fast2SMS (if configured)
  if (config.fast2smsApiKey && config.adminPhone) {
    sendFast2SmsAlert({
      phone: config.adminPhone,
      apiKey: config.fast2smsApiKey,
      message: `TechVision URGENT: Payment proof submitted by ${data.userName} for ${data.courseTitle}. Order: ${data.orderId}`,
    }).catch((e) => console.error("Fast2SMS error:", e));
  }

  // 6. Record In-App Alert for Dashboard Real-Time Bell
  try {
    memoryStore.addNotification({
      type: "PAYMENT_PROOF",
      title: `💳 Payment Proof: ${data.userName}`,
      message: `Uploaded payment proof for ${data.courseTitle} (UTR: ${data.utrNumber || "Screenshot"})`,
      orderId: data.orderId,
      userName: data.userName,
      userEmail: data.userEmail,
      courseTitle: data.courseTitle,
      utrNumber: data.utrNumber,
    });
  } catch (e) {
    console.error("Dashboard notification store error:", e);
  }
}

export async function sendCertificateIssuedNotifications({
  userName,
  userEmail,
  courseTitle,
  orderId,
  certNo,
}: {
  userName: string;
  userEmail: string;
  courseTitle: string;
  orderId: string;
  certNo: string;
}) {
  const config = getEmailConfig();
  const rawAdminEmail = config.adminEmail;
  const adminEmail = (!rawAdminEmail || rawAdminEmail.toLowerCase().includes("techvisioncareers.com"))
    ? "patelroshansingh7@gmail.com"
    : rawAdminEmail;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://techvision-careers.vercel.app";
  const certViewLink = `${appUrl}/generate/${orderId}`;
  const verifyLink = `${appUrl}/verify/${certNo}`;

  const studentHtml = `
    <!DOCTYPE html>
    <html>
    <body style="font-family: Arial, sans-serif; background-color: #0B132B; color: #E2E8F0; padding: 24px;">
      <div style="max-width: 600px; margin: 0 auto; background: #0E1B47; border: 2px solid #C9A14A; border-radius: 16px; padding: 32px;">
        <div style="text-align: center; border-bottom: 1px solid rgba(201, 161, 74, 0.3); padding-bottom: 18px; margin-bottom: 20px;">
          <h2 style="color: #C9A14A; margin: 0; font-size: 24px; letter-spacing: 1px;">TECHVISION CAREERS</h2>
          <p style="color: #94A3B8; font-size: 11px; margin-top: 4px; text-transform: uppercase;">Official Verification Authority</p>
        </div>
        <h1 style="color: #34D399; font-size: 22px; margin-top: 0;">🎉 Congratulations, ${userName}!</h1>
        <p style="color: #CBD5E1; font-size: 14px; line-height: 1.6;">
          Your payment has been verified by the Admin Authority, and your official Verified Certificate of Completion for <strong>${courseTitle}</strong> has been generated and activated!
        </p>
        <div style="background: #081028; border: 1px solid #1E293B; border-radius: 12px; padding: 18px; margin: 20px 0;">
          <table style="width: 100%; font-size: 13px; color: #CBD5E1; border-collapse: collapse;">
            <tr>
              <td style="padding: 6px 0; color: #94A3B8;">Candidate Name:</td>
              <td style="padding: 6px 0; text-align: right; font-weight: bold; color: #FFFFFF;">${userName}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #94A3B8;">Certificate No:</td>
              <td style="padding: 6px 0; text-align: right; font-family: monospace; font-weight: bold; color: #FDE047;">${certNo}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #94A3B8;">Course:</td>
              <td style="padding: 6px 0; text-align: right; font-weight: bold; color: #FFFFFF;">${courseTitle}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #94A3B8;">Status:</td>
              <td style="padding: 6px 0; text-align: right; font-weight: bold; color: #34D399;">VERIFIED & ACTIVE ✅</td>
            </tr>
          </table>
        </div>
        <div style="text-align: center; margin: 28px 0;">
          <a href="${certViewLink}" style="display: inline-block; background: #C9A14A; color: #0E1B47; font-weight: bold; font-size: 14px; padding: 14px 28px; border-radius: 10px; text-decoration: none; margin-bottom: 12px; box-shadow: 0 4px 14px rgba(201, 161, 74, 0.4);">
            View & Download Certificate PDF →
          </a>
          <br>
          <a href="${verifyLink}" style="color: #60A5FA; font-size: 12px; text-decoration: underline;">
            Public Verification Link: ${verifyLink}
          </a>
        </div>
      </div>
    </body>
    </html>
  `;

  const transporter = getTransporter();
  if (transporter && userEmail) {
    try {
      await transporter.sendMail({
        from: `"TechVision Careers" <${config.senderEmail || "patelroshansingh7@gmail.com"}>`,
        to: userEmail,
        subject: `🎓 Your Certificate #${certNo} is Ready! — TechVision Careers`,
        html: studentHtml,
      });
      console.log(`[Email] Certificate issued email sent to ${userEmail}`);
    } catch (err) {
      console.error("[Email Error] Failed to send certificate email to student:", err);
    }
  }

  // Admin alert
  if (transporter && adminEmail) {
    try {
      await transporter.sendMail({
        from: `"TechVision Portal" <${config.senderEmail || "patelroshansingh7@gmail.com"}>`,
        to: adminEmail,
        subject: `✅ Certificate Issued: ${userName} (#${certNo})`,
        html: `
          <div style="font-family: Arial, sans-serif; background: #0E1B47; color: #FFFFFF; padding: 24px; border-radius: 12px; max-width: 500px; margin: 0 auto; border: 1px solid #10B981;">
            <h3 style="color: #10B981; margin-top: 0;">✅ Certificate Generated Successfully</h3>
            <p>Certificate <strong>#${certNo}</strong> has been generated and unlocked for student <strong>${userName}</strong>.</p>
            <p>Order: <code>#${orderId}</code></p>
            <p>Student Email: ${userEmail}</p>
          </div>
        `,
      });
    } catch (err) {}
  }
}