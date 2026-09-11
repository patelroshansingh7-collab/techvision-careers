import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { memoryStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Sync from persistent cloud storage first so stats reflect all instances
    await memoryStore.syncFromCloud().catch(() => {});
    const memOrders = memoryStore.getAllEnrollments();
    let dbOrders: any[] = [];

    try {
      dbOrders = await prisma.enrollment.findMany({
        include: {
          course: true,
          certificate: true,
        },
      });
    } catch (e) {
      console.warn("Prisma stats lookup bypassed:", e);
    }

    // Deduplicate exactly like admin orders
    const orderMap = new Map<string, any>();
    const certIndex = new Map<string, string>();
    const identityIndex = new Map<string, string>();

    function addOrder(order: any) {
      if (!order || !order.orderId) return;

      const certNo = order.certificate?.certNo;
      const studentName = (order.userName || "").toLowerCase().trim();
      const courseSlug = (order.course?.slug || order.course?.title || "").toLowerCase().trim();
      const identityKey = studentName && courseSlug ? `${studentName}|${courseSlug}` : null;

      if (certNo && certIndex.has(certNo)) {
        const existingOrderId = certIndex.get(certNo)!;
        const existing = orderMap.get(existingOrderId);
        if (existing) {
          orderMap.set(existingOrderId, { ...existing, ...order, orderId: existingOrderId });
          return;
        }
      }

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

    for (const order of memOrders) addOrder(order);
    for (const order of dbOrders) addOrder(order);

    const allOrders = Array.from(orderMap.values());
    const paidOrders = allOrders.filter(
      (o) => o.paymentStatus === "PAID" || o.paymentStatus === "MANUAL_APPROVED"
    );
    const totalRevenueINR = paidOrders.reduce((sum, o) => sum + (Number(o.amountINR) || 149), 0);
    const totalCertificates = allOrders.filter((o) => o.certificate && !o.certificate.revoked).length;
    const revokedCertificates = allOrders.filter((o) => o.certificate && o.certificate.revoked).length;
    const totalEnrollments = allOrders.length;

    return NextResponse.json({
      success: true,
      stats: {
        totalRevenueINR,
        totalEnrollments,
        totalCertificates,
        revokedCertificates,
      },
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}