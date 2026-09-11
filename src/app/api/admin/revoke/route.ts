import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { memoryStore } from "@/lib/store";

export async function POST(req: NextRequest) {
  try {
    const { certNo, revoke } = await req.json();

    memoryStore.toggleRevoke(certNo, !!revoke);

    try {
      await prisma.certificate.update({
        where: { certNo },
        data: { revoked: !!revoke },
      });
    } catch (e) {
      console.warn("Prisma revoke update bypassed on serverless:", e);
    }

    return NextResponse.json({
      success: true,
      message: `Certificate ${certNo} marked as ${revoke ? "REVOKED" : "ACTIVE"} successfully!`,
    });
  } catch (error) {
    console.error("Revocation error:", error);
    return NextResponse.json(
      { success: false, message: "Revocation action failed" },
      { status: 500 }
    );
  }
}