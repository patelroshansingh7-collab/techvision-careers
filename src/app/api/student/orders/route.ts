import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { memoryStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = (
      searchParams.get("query") ||
      searchParams.get("email") ||
      searchParams.get("certNo") ||
      searchParams.get("orderId") ||
      ""
    ).trim().toLowerCase();

    // STRICT PRIVACY: If no search query is provided, NEVER return all orders!
    if (!query) {
      return NextResponse.json({
        success: true,
        enrollments: [],
        message: "Please provide a registered email or certificate ID.",
      });
    }

    // Ensure this lambda has the latest enrollments and certificates from cloud storage
    await memoryStore.syncFromCloud().catch(() => {});
    const memOrders = memoryStore.getAllEnrollments();
    let dbOrders: any[] = [];

    try {
      dbOrders = await prisma.enrollment.findMany({
        where: {
          OR: [
            { user: { email: { equals: query } } },
            { orderId: { equals: query } },
            { certificate: { certNo: { equals: query } } },
          ],
        },
        include: {
          course: true,
          user: true,
          certificate: true,
        },
        take: 20,
      });
    } catch (e) {
      console.warn("Prisma student search bypassed:", e);
    }

    // Filter memory store safely
    const matchedMem = memOrders.filter((order) => {
      const emailMatch = (order.userEmail || "").toLowerCase() === query;
      const orderMatch = (order.orderId || "").toLowerCase() === query;
      const certMatch = (order.certificate?.certNo || "").toLowerCase() === query;
      return emailMatch || orderMatch || certMatch;
    });

    const orderMap = new Map<string, any>();
    for (const order of matchedMem) {
      orderMap.set(order.orderId, {
        id: order.id,
        orderId: order.orderId,
        userName: order.userName,
        startDate: order.startDate,
        endDate: order.endDate,
        paymentStatus: order.paymentStatus,
        course: {
          title: order.course?.title,
          category: order.course?.category,
          slug: order.course?.slug,
        },
        certificate: order.certificate
          ? {
              certNo: order.certificate.certNo,
              pdfUrl: order.certificate.pdfUrl,
              revoked: order.certificate.revoked,
            }
          : null,
      });
    }

    for (const order of dbOrders) {
      orderMap.set(order.orderId, {
        id: order.id,
        orderId: order.orderId,
        userName: order.userName,
        startDate: order.startDate,
        endDate: order.endDate,
        paymentStatus: order.paymentStatus,
        course: {
          title: order.course?.title,
          category: order.course?.category,
          slug: order.course?.slug,
        },
        certificate: order.certificate
          ? {
              certNo: order.certificate.certNo,
              pdfUrl: order.certificate.pdfUrl,
              revoked: order.certificate.revoked,
            }
          : null,
      });
    }

    const enrollments = Array.from(orderMap.values());
    return NextResponse.json({
      success: true,
      enrollments,
      count: enrollments.length,
    });
  } catch (error) {
    console.error("Student orders search error:", error);
    return NextResponse.json(
      { success: false, message: "Search query failed" },
      { status: 500 }
    );
  }
}
