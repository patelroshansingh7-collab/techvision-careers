"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Sparkles,
  QrCode,
  ArrowRight,
  Loader2,
  AlertCircle,
  UploadCloud,
  FileImage,
  Link2,
  Copy,
  Check,
} from "lucide-react";
import { formatINR } from "@/lib/utils";

export default function PaymentPage({
  params,
}: {
  params: { orderId: string };
}) {
  const router = useRouter();
  const { orderId } = params;

  const [paymentData, setPaymentData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form inputs
  const [utrNumber, setUtrNumber] = useState("");
  const [paymentLink, setPaymentLink] = useState("");
  const [screenshotBase64, setScreenshotBase64] = useState<string | null>(null);
  const [screenshotFileName, setScreenshotFileName] = useState<string | null>(null);
  const [copiedUpi, setCopiedUpi] = useState(false);

  useEffect(() => {
    async function fetchOrder() {
      let localFallback: any = null;
      if (typeof window !== "undefined") {
        try {
          const raw = localStorage.getItem(`tv_order_${orderId}`);
          if (raw) localFallback = JSON.parse(raw);
        } catch {}
      }

      try {
        const res = await fetch("/api/payment/create-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId, fallbackData: localFallback }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          if (localFallback) {
            setPaymentData(localFallback);
            return;
          }
          throw new Error(data.message || "Failed to load order");
        }
        setPaymentData(data);
        if (typeof window !== "undefined") {
          localStorage.setItem(`tv_order_${orderId}`, JSON.stringify(data));
          if (data.userEmail) {
            localStorage.setItem("tv_student_email", data.userEmail);
          }
        }
      } catch (err: any) {
        if (localFallback) {
          setPaymentData(localFallback);
        } else {
          setError(err.message || "Unable to fetch payment details");
        }
      } finally {
        setLoading(false);
      }
    }
    fetchOrder();
  }, [orderId]);

  // Helper to compress screenshot client-side before sending (avoids Vercel 4.5MB limit and cloud JSON size limits)
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (readerEvent) => {
        const img = new Image();
        img.onload = () => {
          const maxDimension = 1000;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxDimension) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            }
          } else {
            if (height > maxDimension) {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve(readerEvent.target?.result as string);
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          // Compress to JPEG with 0.72 quality (~40-80KB from 4MB)
          const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.72);
          resolve(compressedDataUrl);
        };
        img.onerror = () => {
          resolve(readerEvent.target?.result as string);
        };
        img.src = readerEvent.target?.result as string;
      };
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  };

  // Handle Screenshot Upload with auto-compression
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      setError("Screenshot image size should be less than 20MB.");
      return;
    }

    try {
      setScreenshotFileName(`${file.name} (Compressing...)`);
      const compressed = await compressImage(file);
      setScreenshotBase64(compressed);
      setScreenshotFileName(file.name);
      setError(null);
    } catch (err) {
      console.error("Compression error, fallback to raw reader:", err);
      const reader = new FileReader();
      reader.onload = () => {
        setScreenshotBase64(reader.result as string);
        setScreenshotFileName(file.name);
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit Payment Details
  const handleSubmitPayment = async (e?: React.FormEvent, isSimulated = false) => {
    if (e) e.preventDefault();

    if (!isSimulated) {
      if (!utrNumber.trim() && !screenshotBase64 && !paymentLink.trim()) {
        setError("Please enter the 12-digit UTR number or upload your payment screenshot.");
        return;
      }
    }

    setSubmitting(true);
    setError(null);

    // If student only uploaded screenshot without entering text UTR, mark as SCREENSHOT_PROOF
    const finalUtr = utrNumber.trim() || (screenshotBase64 ? "SCREENSHOT_PROOF" : "");

    try {
      const res = await fetch("/api/payment/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          utrNumber: isSimulated ? `SIM_${Date.now()}` : finalUtr,
          paymentScreenshot: screenshotBase64,
          paymentLink: paymentLink.trim() || null,
          isSimulated,
          userName: paymentData?.userName,
          userEmail: paymentData?.userEmail,
          courseTitle: paymentData?.courseTitle,
          college: paymentData?.college,
          amountINR: paymentData?.amountINR || (paymentData?.amount ? paymentData.amount / 100 : 149),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Payment verification failed");
      }

      // Update localStorage cache with SUBMITTED status and screenshot
      try {
        const cached = localStorage.getItem(`tv_order_${orderId}`);
        const parsed = cached ? JSON.parse(cached) : {};
        localStorage.setItem(
          `tv_order_${orderId}`,
          JSON.stringify({
            ...parsed,
            paymentStatus: data.paymentStatus || "SUBMITTED",
            utrNumber: finalUtr || null,
            paymentScreenshot: screenshotBase64 || parsed.paymentScreenshot || null,
          })
        );
      } catch (e) {}

      // Success -> Redirect to Certificate Generation
      router.push(`/generate/${orderId}`);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Could not verify payment");
      setSubmitting(false);
    }
  };

  const copyUpiId = () => {
    navigator.clipboard.writeText("techvision@upi");
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 3000);
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 text-brand-gold animate-spin" />
        <p className="text-xs text-slate-400">Loading payment checkout...</p>
      </div>
    );
  }

  if (error && !paymentData) {
    return (
      <div className="py-24 max-w-md mx-auto px-4 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-lg font-bold text-white">Order Error</h2>
        <p className="text-xs text-slate-400">{error}</p>
        <Link
          href="/"
          className="inline-block py-2 px-4 bg-slate-800 text-slate-200 text-xs font-semibold rounded-xl"
        >
          Return to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="py-12 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-brand-gold/10 border border-brand-gold/30 text-brand-gold-light text-xs font-bold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Step 2 of 2: Payment & Verification Proof</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white">
          Complete ₹149 Payment
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Order ID: <code className="text-brand-gold-light font-mono font-bold">{orderId}</code>
        </p>
      </div>

      {error && (
        <div className="p-3.5 bg-rose-950/80 border border-rose-800 text-rose-200 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
        
        {/* Candidate & Amount Summary */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div>
            <span className="text-slate-400 text-[11px] block">Candidate Details</span>
            <strong className="text-white text-sm">{paymentData?.userName}</strong>
            <span className="text-slate-500 text-[11px] block">{paymentData?.userEmail}</span>
            <span className="text-brand-gold-light text-[11px] block font-medium mt-0.5">
              Course: {paymentData?.courseTitle}
            </span>
          </div>

          <div className="sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-800">
            <span className="text-slate-400 text-[11px] block">Payable Amount</span>
            <strong className="text-2xl font-black text-white">{formatINR(149)}</strong>
            <span className="text-emerald-400 text-[10px] font-bold block">One-time Certification Fee</span>
          </div>
        </div>

        {/* STEP 1: Scan & Pay QR */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <QrCode className="w-4 h-4 text-brand-gold" />
              <span>1. Scan QR with Any UPI App (GPay / PhonePe / Paytm)</span>
            </h3>
            <span className="text-xs font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-lg border border-emerald-800">
              ₹149
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6 p-4 bg-slate-900/90 rounded-xl border border-slate-800">
            <div className="w-36 h-36 bg-white p-2 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
              <img
                src="/assets/upi_qr.jpg"
                alt="UPI QR Code"
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <div className="text-brand-navy font-bold text-center text-xs">
                Scan QR<br />
                <span className="text-[10px] font-mono">₹149</span>
              </div>
            </div>

            <div className="flex-1 space-y-2.5 text-xs text-slate-300">
              <div>
                <span className="text-slate-400 text-[11px] block font-medium">Official UPI ID:</span>
                <div className="flex items-center gap-2 mt-1">
                  <code className="bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-700 font-mono text-xs text-brand-gold-light font-bold">
                    techvision@upi
                  </code>
                  <button
                    type="button"
                    onClick={copyUpiId}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition"
                    title="Copy UPI ID"
                  >
                    {copiedUpi ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed">
                Open any UPI app, scan the QR code above or pay to <strong className="text-white">techvision@upi</strong>, and enter the payment details below to generate your certificate.
              </p>
            </div>
          </div>
        </div>

        {/* STEP 2: Fill Payment Details & Upload Screenshot */}
        <form onSubmit={(e) => handleSubmitPayment(e, false)} className="space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <FileImage className="w-4 h-4 text-brand-gold" />
            <span>2. Enter Payment Details & Screenshot</span>
          </h3>

          <div className="space-y-3">
            {/* UTR / Transaction ID */}
            <div>
              <label className="block text-slate-300 text-xs font-bold mb-1">
                12-Digit UPI Transaction Reference / UTR Number *
              </label>
              <input
                type="text"
                value={utrNumber}
                onChange={(e) => setUtrNumber(e.target.value)}
                placeholder="e.g. 422019384910 or UPI Ref ID"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-gold font-mono"
              />
            </div>

            {/* Screenshot Upload */}
            <div>
              <label className="block text-slate-300 text-xs font-bold mb-1">
                Payment Screenshot (Proof)
              </label>
              <div className="border-2 border-dashed border-slate-700 hover:border-brand-gold/60 rounded-xl p-4 bg-slate-950/60 text-center transition">
                <input
                  type="file"
                  id="screenshot-file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <label
                  htmlFor="screenshot-file"
                  className="cursor-pointer flex flex-col items-center justify-center space-y-1.5 text-xs"
                >
                  <UploadCloud className="w-6 h-6 text-brand-gold" />
                  <span className="font-semibold text-slate-200">
                    {screenshotFileName ? screenshotFileName : "Click to select or upload payment screenshot"}
                  </span>
                  <span className="text-[10px] text-slate-500">PNG, JPG, JPEG up to 5MB</span>
                </label>

                {/* Thumbnail Preview */}
                {screenshotBase64 && (
                  <div className="mt-3 flex items-center justify-center">
                    <img
                      src={screenshotBase64}
                      alt="Payment Preview"
                      className="max-h-32 rounded-lg border border-slate-700 object-contain shadow-md"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Payment Completion Link (Optional) */}
            <div>
              <label className="block text-slate-300 text-xs font-bold mb-1">
                Payment Completion Link / Drive URL (Optional)
              </label>
              <div className="relative">
                <Link2 className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                <input
                  type="url"
                  value={paymentLink}
                  onChange={(e) => setPaymentLink(e.target.value)}
                  placeholder="https://pay.upi/receipt/... or screenshot link"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-gold"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 px-6 bg-gradient-to-r from-brand-gold via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-brand-navy-dark font-black text-sm rounded-xl shadow-xl shadow-brand-gold/25 flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Payment Proof & Generating Certificate...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Submit Payment Details & Generate Certificate</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Quick Test Option */}
        <div className="pt-2 border-t border-slate-800 text-center">
          <button
            type="button"
            onClick={() => handleSubmitPayment(undefined, true)}
            disabled={submitting}
            className="text-xs font-semibold text-slate-400 hover:text-brand-gold-light inline-flex items-center gap-1.5 transition cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Developer / Quick Test Mode: Auto-Approve & Generate Certificate</span>
          </button>
        </div>

        {/* Security Trust Footnote */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800">
          <span className="flex items-center gap-1">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span>256-Bit Encrypted & Verified</span>
          </span>
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-brand-gold" />
            <span>Instant Certificate Unlocking</span>
          </span>
        </div>

      </div>
    </div>
  );
}