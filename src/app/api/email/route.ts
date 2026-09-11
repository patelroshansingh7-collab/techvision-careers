import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { certNo, email } = await req.json();

    // Production Resend or Mock Email dispatch
    console.log(`[Email Dispatch] Sending Certificate #${certNo} PDF link to ${email}`);

    return NextResponse.json({
      success: true,
      message: `Certificate copy queued and sent to ${email}`,
    });
  } catch (error) {
    console.error("Email API error:", error);
    return NextResponse.json(
      { success: false, message: "Email dispatch failed" },
      { status: 500 }
    );
  }
}