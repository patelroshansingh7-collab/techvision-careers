"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Award,
  Calendar,
  User,
  Mail,
  School,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Lock,
} from "lucide-react";
import { ENGINEERING_COURSES } from "@/lib/courses-data";
import { formatINR } from "@/lib/utils";

export default function EnrollPage({
  params,
}: {
  params: { course_slug: string };
}) {
  const router = useRouter();
  const course =
    ENGINEERING_COURSES.find((c) => c.slug === params.course_slug) ||
    ENGINEERING_COURSES[0];

  // Form State
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [college, setCollege] = useState("");
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [mode, setMode] = useState<"Online" | "Hybrid">(
    course.mode === "Hybrid" ? "Hybrid" : "Online"
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim()) {
      setError("Please enter your full name as it should appear on the certificate.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseSlug: course.slug,
          userName: userName.trim(),
          email: email.trim(),
          college: college.trim() || "Independent Candidate",
          startDate,
          mode,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Enrollment failed");
      }

      if (typeof window !== "undefined") {
        localStorage.setItem(
          `tv_order_${data.orderId}`,
          JSON.stringify({
            orderId: data.orderId,
            userName: userName.trim(),
            userEmail: email.trim(),
            courseTitle: course.title,
            courseSlug: course.slug,
            college: college.trim() || "Independent Candidate",
            startDate,
            amountINR: course.priceINR || 149,
          })
        );
        localStorage.setItem("tv_student_email", email.trim());
      }

      // Redirect to payment checkout with orderId
      router.push(`/payment/${data.orderId}`);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="py-12 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-gold/10 border border-brand-gold/30 text-brand-gold-light text-xs font-bold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Step 1 of 2: Candidate Enrollment</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white">
          Enroll in {course.title}
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
          Please provide accurate details. Your name and dates will be officially printed on your final verifiable credential.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Form Column (7 cols) */}
        <div className="md:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
          {error && (
            <div className="p-3.5 bg-rose-950/80 border border-rose-800 text-rose-200 text-xs rounded-xl">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Candidate Name */}
            <div>
              <label className="block text-slate-300 text-xs font-bold mb-1.5">
                Full Name (Printed on Certificate) *
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  required
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="e.g. Roshan Singh"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-gold transition font-medium"
                />
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-slate-300 text-xs font-bold mb-1.5">
                Email Address (Certificate Delivery) *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. roshan.singh@example.com"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-gold transition font-medium"
                />
              </div>
            </div>

            {/* College / Organization */}
            <div>
              <label className="block text-slate-300 text-xs font-bold mb-1.5">
                College / University / Organization
              </label>
              <div className="relative">
                <School className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  value={college}
                  onChange={(e) => setCollege(e.target.value)}
                  placeholder="e.g. Indian Institute of Technology / NIT"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-gold transition font-medium"
                />
              </div>
            </div>

            {/* Start Date & Mode Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 text-xs font-bold mb-1.5">
                  Internship Start Date *
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-3 py-2.5 text-xs text-white focus:outline-none focus:border-brand-gold transition font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 text-xs font-bold mb-1.5">
                  Internship Mode
                </label>
                <select
                  value={mode}
                  onChange={(e) => setMode(e.target.value as "Online" | "Hybrid")}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-brand-gold transition font-medium"
                >
                  <option value="Online">Online / Remote</option>
                  <option value="Hybrid">Hybrid</option>
                </select>
              </div>
            </div>

            {/* Submit CTA */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-6 bg-gradient-to-r from-brand-gold via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-brand-navy-dark font-extrabold text-sm rounded-xl shadow-xl shadow-brand-gold/25 flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <span>Creating Enrollment...</span>
                ) : (
                  <>
                    <span>Proceed to Payment ({formatINR(course.priceINR)})</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Order Summary Column (5 cols) */}
        <div className="md:col-span-5 bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-5">
          <h3 className="text-xs font-bold text-brand-gold uppercase tracking-wider">
            Order Summary
          </h3>

          <div className="space-y-3 pb-4 border-b border-slate-800 text-xs">
            <div className="flex items-start justify-between gap-2">
              <span className="text-slate-400 font-medium">Selected Course:</span>
              <span className="font-bold text-white text-right">{course.title}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-medium">Domain Category:</span>
              <span className="text-slate-200">{course.category}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-medium">Duration:</span>
              <span className="text-slate-200">{course.durationDays} Days</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-medium">Verification Status:</span>
              <span className="text-emerald-400 font-bold">QR Auto-Enabled</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="font-bold text-slate-300">Total Payable:</span>
            <span className="font-black text-xl text-white">
              {formatINR(course.priceINR)}
            </span>
          </div>

          <div className="p-3 bg-brand-navy/60 border border-brand-gold/30 rounded-xl space-y-1 text-[11px] text-slate-300">
            <div className="flex items-center gap-1.5 font-bold text-brand-gold-light">
              <Lock className="w-3.5 h-3.5" />
              <span>Safe & Secure Checkout</span>
            </div>
            <p className="text-slate-400 leading-tight">
              Encrypted transaction processed via Razorpay / UPI gateway.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}