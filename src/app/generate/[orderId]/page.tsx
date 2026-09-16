"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Award,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  Share2,
  ExternalLink,
  Download,
  Loader2,
  AlertTriangle,
  Lock,
  ArrowRight,
  Clock,
  RefreshCw,
  Eye,
} from "lucide-react";
import { CertificateView } from "@/components/certificate/certificate-view";
import { CertificateActions } from "@/components/certificate/certificate-actions";
import confetti from "canvas-confetti";

export default function GenerateCertificatePage({
  params,
}: {
  params: { orderId: string };
}) {
  const { orderId } = params;
  const [certData, setCertData] = useState<any>(null);
  const [orderInfo, setOrderInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrderAndCert = async () => {
    setLoading(true);
    setError(null);
    try {
      let localFallback: any = null;
      try {
        const saved = localStorage.getItem(`tv_order_${orderId}`);
        if (saved) localFallback = JSON.parse(saved);
      } catch (e) {}

      // Fetch order details
      const orderRes = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, fallbackData: localFallback }),
      });
      const data = await orderRes.json();
      if (!orderRes.ok || !data.success) {
        throw new Error(data.message || "Order not found");
      }
      setOrderInfo({
        ...data,
        ...(localFallback ? { paymentStatus: localFallback.paymentStatus || data.paymentStatus, utrNumber: localFallback.utrNumber || data.utrNumber } : {}),
      });

      // Check if certificate exists (via secure student orders lookup)
      const studentRes = await fetch(`/api/student/orders?query=${encodeURIComponent(orderId)}`);
      const studentData = await studentRes.json();
      if (studentData.success && studentData.enrollments?.length > 0) {
        const found = studentData.enrollments[0];
        setOrderInfo((prev: any) => ({ ...prev, ...found }));
          if (found.certificate) {
            const certRes = await fetch(`/api/certificates/${found.certificate.certNo}`);
            const certFull = await certRes.json();
            if (certFull.success) {
              setCertData(certFull.certificate);

              // Trigger celebration confetti
              try {
                confetti({
                  particleCount: 90,
                  spread: 65,
                  origin: { y: 0.6 },
                  colors: ["#C9A14A", "#0E1B47", "#E8C97A", "#10B981"],
                });
              } catch {}
            }
          }
        }
      } catch (err: any) {
      setError(err.message || "Error fetching status");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderAndCert();
  }, [orderId]);

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 text-brand-gold animate-spin" />
        <h2 className="text-base font-bold text-white">
          Checking Payment & Certificate Status...
        </h2>
        <p className="text-xs text-slate-400">
          Verifying administrative clearance for order #{orderId}
        </p>
      </div>
    );
  }

  // 1. IF NOT PAID & NO PROOF SUBMITTED -> PROMPT PAYMENT
  if (!orderInfo || orderInfo.paymentStatus === "PENDING") {
    return (
      <div className="py-20 max-w-lg mx-auto px-4 text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-amber-950/80 border border-amber-700 text-amber-400 flex items-center justify-center mx-auto shadow-2xl">
          <Lock className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="px-3 py-1 rounded-full bg-amber-950 text-amber-300 border border-amber-800 text-xs font-bold">
            PAYMENT PROOF REQUIRED
          </span>
          <h1 className="text-2xl font-black text-white">
            Certificate Generation Locked
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Certificates are only generated once the nominal fee of <strong>₹149</strong> is completed and payment proof (UTR number or screenshot) is submitted.
          </p>
        </div>

        <div className="pt-2">
          <Link
            href={`/payment/${orderId}`}
            className="inline-flex items-center gap-2 py-3.5 px-6 bg-brand-gold hover:bg-brand-gold-light text-brand-navy-dark font-extrabold text-xs rounded-xl shadow-xl shadow-brand-gold/25 transition"
          >
            <span>Complete ₹149 Payment & Upload Proof</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  // 2. IF PAYMENT PROOF SUBMITTED, BUT WAITING FOR ADMIN APPROVAL
  if (orderInfo.paymentStatus === "SUBMITTED" && !certData) {
    return (
      <div className="py-16 max-w-2xl mx-auto px-4 text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-amber-950/80 border border-amber-600 text-amber-300 flex items-center justify-center mx-auto shadow-2xl animate-pulse">
          <Clock className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="px-3.5 py-1 rounded-full bg-amber-950/90 text-amber-300 border border-amber-700 text-xs font-extrabold">
            PAYMENT PROOF SUBMITTED • UNDER ADMIN REVIEW
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            Payment Verification in Progress
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto leading-relaxed">
            Thank you, <strong className="text-white">{orderInfo.userName}</strong>! Your payment proof for <strong className="text-brand-gold-light">{orderInfo.course?.title || "Internship"}</strong> has been submitted to the Admin Authority.
          </p>
        </div>

        {/* Submitted Proof Summary Box */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-left text-xs space-y-3 max-w-md mx-auto">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-slate-400">Order ID:</span>
            <span className="font-mono text-white font-bold">{orderId}</span>
          </div>

          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-slate-400">Submitted UTR / Ref:</span>
            <span className="font-mono font-bold text-amber-300">
              {orderInfo.utrNumber || "Screenshot uploaded"}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400">Admin Approval Status:</span>
            <span className="text-amber-400 font-bold flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              Pending Admin Confirmation
            </span>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <button
            onClick={fetchOrderAndCert}
            className="py-3 px-6 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl border border-slate-700 inline-flex items-center gap-2 transition cursor-pointer"
          >
            <RefreshCw className="w-4 h-4 text-brand-gold" />
            <span>Refresh & Check Approval Status</span>
          </button>

          <p className="text-[11px] text-slate-500">
            Once Admin approves your payment, your Certificate and Public QR link will appear here automatically.
          </p>
        </div>
      </div>
    );
  }

  // 3. IF REJECTED
  if (orderInfo.paymentStatus === "REJECTED") {
    return (
      <div className="py-20 max-w-lg mx-auto px-4 text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-rose-950 border border-rose-700 text-rose-400 flex items-center justify-center mx-auto shadow-2xl">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="px-3 py-1 rounded-full bg-rose-950 text-rose-300 border border-rose-800 text-xs font-bold">
            PAYMENT PROOF REJECTED
          </span>
          <h1 className="text-2xl font-black text-white">
            Payment Verification Failed
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            The submitted UTR number or screenshot could not be verified in the bank ledger. Please re-check and submit the correct proof.
          </p>
        </div>

        <div className="pt-2">
          <Link
            href={`/payment/${orderId}`}
            className="inline-flex items-center gap-2 py-3 px-6 bg-brand-gold text-brand-navy-dark font-extrabold text-xs rounded-xl"
          >
            <span>Re-Submit Payment Proof</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  // 4. APPROVED & CERTIFICATE ISSUED!
  return (
    <div className="py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Top Banner Celebration */}
      <div className="bg-gradient-to-r from-brand-navy via-slate-900 to-slate-900 border border-brand-gold/40 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-2xl">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-emerald-950/80 border border-emerald-700 text-emerald-300 rounded-full text-xs font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              PAYMENT VERIFIED & APPROVED BY ADMIN
            </span>
            <span className="text-xs text-brand-gold-light font-mono font-bold">
              CIN: {certData.certNo}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            Congratulations, {certData.internName}! 🎉
          </h1>
          <p className="text-xs sm:text-sm text-slate-300">
            Your official Technical Internship Credential in{" "}
            <strong className="text-white">{certData.courseTitle}</strong> is now live and verifiable.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/verify/${certData.certNo}`}
            target="_blank"
            className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <ExternalLink className="w-4 h-4 text-brand-gold" />
            <span>Open Public Verify Card</span>
          </Link>
        </div>
      </div>

      {/* Action Buttons Row */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
        <CertificateActions
          certNo={certData.certNo}
          internName={certData.internName}
          containerId="issued-certificate-view"
        />
      </div>

      {/* Live High-Res Certificate Canvas */}
      <div className="bg-slate-950 border border-slate-800/80 rounded-3xl p-4 sm:p-8 flex flex-col items-center shadow-2xl overflow-hidden">
        <div className="w-full flex items-center justify-between text-xs text-slate-400 pb-3 mb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-brand-gold" />
            <span className="font-semibold text-slate-200">
              Official Verifiable A4 Landscape Document
            </span>
          </div>
          <span className="font-mono text-brand-gold-light font-bold">
            {certData.certNo}
          </span>
        </div>

        {/* Certificate Rendering Box */}
        <div className="w-full flex justify-center py-2">
          <CertificateView
            data={{
              certNo: certData.certNo,
              internName: certData.internName,
              courseTitle: certData.courseTitle,
              startDate: certData.startDate,
              endDate: certData.endDate,
              issueDate: certData.issuedAt,
              mode: certData.mode,
              qrPayload: certData.qrPayload,
            }}
            containerId="issued-certificate-view"
          />
        </div>
      </div>
    </div>
  );
}