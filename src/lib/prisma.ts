import { PrismaClient } from "@prisma/client";
import path from "path";
import fs from "fs";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function getDatabaseUrl(): string {
  const envDbUrl = process.env.DATABASE_URL;

  // If using PostgreSQL / MySQL cloud DB (e.g. Neon, Supabase)
  if (envDbUrl && !envDbUrl.startsWith("file:")) {
    return envDbUrl;
  }

  // On Vercel / AWS Lambda Serverless environments:
  // The root project folder is read-only. Only /tmp is writable.
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    try {
      const tmpDbPath = path.join("/tmp", "dev.db");
      const possibleSources = [
        path.join(process.cwd(), "prisma", "dev.db"),
        path.join(process.cwd(), "dev.db"),
        path.join(__dirname, "..", "..", "..", "prisma", "dev.db"),
      ];

      if (!fs.existsSync(tmpDbPath)) {
        for (const src of possibleSources) {
          if (fs.existsSync(src)) {
            fs.copyFileSync(src, tmpDbPath);
            break;
          }
        }
      }
      return `file:${tmpDbPath}`;
    } catch (e) {
      console.warn("Could not copy sqlite db to /tmp:", e);
    }
  }

  return envDbUrl || "file:./dev.db";
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: getDatabaseUrl(),
      },
    },
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;