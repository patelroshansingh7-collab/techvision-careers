import fs from "fs";
import path from "path";

export interface EmailSettings {
  adminEmail: string;
  senderEmail: string;
  adminPhone?: string;
  gmailAppPassword?: string;
  resendApiKey?: string;
  smtpHost?: string;
  smtpPort?: number;
  ntfyTopic?: string;
  enableMobilePush?: boolean;
  whatsappApiKey?: string;
  whatsappPhone?: string;
  fast2smsApiKey?: string;
}

export type NotificationSettings = EmailSettings;

// In-memory cache across serverless warm executions
const globalCache = globalThis as unknown as {
  tv_email_config?: NotificationSettings;
};

const CONFIG_FILE =
  process.platform === "win32"
    ? path.join(process.cwd(), ".tmp_notification_config.json")
    : "/tmp/tv_notification_config.json";

export function getEmailConfig(): NotificationSettings {
  // 1. In-Memory Cache
  if (globalCache.tv_email_config) {
    return globalCache.tv_email_config;
  }

  // 2. Read from disk if exists
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const data = fs.readFileSync(CONFIG_FILE, "utf-8");
      const parsed = JSON.parse(data);
      globalCache.tv_email_config = parsed;
      return parsed;
    }
  } catch (e) {
    // ignore
  }

  // 3. Fallback to Defaults and Environment Variables
  const envConfig: NotificationSettings = {
    adminEmail: process.env.ADMIN_EMAIL || "patelroshansingh7@gmail.com",
    adminPhone: process.env.ADMIN_PHONE || "9555593671",
    senderEmail: process.env.GMAIL_USER || process.env.SMTP_USER || "patelroshansingh7@gmail.com",
    gmailAppPassword: process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS || "fusxcwbterwxrfnr",
    resendApiKey: process.env.RESEND_API_KEY || "",
    smtpHost: process.env.SMTP_HOST || "smtp.gmail.com",
    smtpPort: parseInt(process.env.SMTP_PORT || "587"),
    ntfyTopic: process.env.NTFY_TOPIC || "techvision_admin_9555593671",
    enableMobilePush: true,
    whatsappPhone: process.env.WHATSAPP_PHONE || "919555593671",
    whatsappApiKey: process.env.CALLMEBOT_API_KEY || "",
    fast2smsApiKey: process.env.FAST2SMS_API_KEY || "",
  };

  globalCache.tv_email_config = envConfig;
  return envConfig;
}

export function saveEmailConfig(newConfig: Partial<NotificationSettings>): NotificationSettings {
  const current = getEmailConfig();
  const updated: NotificationSettings = {
    ...current,
    ...newConfig,
  };

  globalCache.tv_email_config = updated;

  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(updated, null, 2), "utf-8");
  } catch (e) {
    console.warn("Could not persist notification config to disk:", e);
  }

  return updated;
}