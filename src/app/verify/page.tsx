"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
  Search,
  CheckCircle2,
  Award,
  Lock,
  ArrowRight,
  FileCheck,
  QrCode,
  Building2,
  ExternalLink,
} from "lucide-react";

export default function VerifyPortalPage() {
  const [certNo, setCertNo] = useState("");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = certNo.trim();
    if (!clean) return;
    router.push(`/verify/${encodeURIComponent(clean)}`);
  };

  return (
    <div className="py-12 sm:py-16 max-w-4xl mx-auto px-4 sm:px-6 space-y-12">
      {/* Header Banner */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
          <ShieldCheck className="w-4 h-4" />
          <span>Official Public Credential Verification Engine</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
          Verify Official <span className="text-brand-gold-light">Internship Certificate</span>
        </h1>

        <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto">
          Authenticate student credentials, letters of recommendation, and internship completion
          records issued by TechVision Careers.
        </p>
      </div>

      {/* Main Verification Input Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden backdrop-blur-sm">
        <div className="absolute top-0 right-0 w-80 h-80 bg-brand-gold/5 rounded-full blur-3xl pointer-events-none" />

        <form onSubmit={handleSearch} className="space-y-6 relative z-10">
          <div className="space-y-2">
            <label
              htmlFor="certNoInput"
              className="block text-xs font-bold uppercase tracking-wider text-slate-300"
            >
              Enter Certificate Identification Number (CIN) or Order ID
            </label>
            <div className="relative">
              <input
                id="certNoInput"
                type="text"
                value={certNo}
                onChange={(e) => setCertNo(e.target.value)}
                placeholder="e.g. TVC-IN-2026-0142"
                className="w-full px-5 py-4 pl-12 rounded-2xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 font-mono text-base sm:text-lg focus:outline-none focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/30 uppercase transition"
                autoComplete="off"
                required
              />
              <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            </div>
            <p className="text-xs text-slate-400">
              The Certificate ID is printed on the bottom left and top of every official certificate, or embedded in the QR code.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              type="submit"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-brand-gold via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-brand-navy-dark font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition transform hover:-translate-y-0.5 cursor-pointer"
            >
              <ShieldCheck className="w-5 h-5" />
              <span>Verify Credential Now</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>

            <span className="text-xs text-slate-400 hidden sm:inline">or</span>

            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>Try Demo:</span>
              <button
                type="button"
                onClick={() => {
                  setCertNo("TVC-IN-2026-0142");
                  router.push("/verify/TVC-IN-2026-0142");
                }}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-brand-gold-light font-mono font-bold transition cursor-pointer"
              >
                TVC-IN-2026-0142
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Feature Highlights Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <QrCode className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-white text-sm">Instant QR Scan</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Every certificate features a unique QR code. Pointing any smartphone camera directly displays the live tamper-evident verification record.
          </p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-brand-gold/10 border border-brand-gold/20 text-brand-gold-light flex items-center justify-center">
            <Building2 className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-white text-sm">Recognized Standards</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            ISO 9001:2015 certified & AICTE aligned internship syllabus verified for university credits, placement drives, and background checks.
          </p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
            <Lock className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-white text-sm">Tamper-Proof Registry</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Records are permanently stored with cryptographically unique CINs, preventing counterfeit certificates and duplicate claims.
          </p>
        </div>
      </div>

      {/* Back to Home / Dashboard Links */}
      <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4 text-xs text-slate-400">
        <Link
          href="/"
          className="text-slate-300 hover:text-white transition flex items-center gap-1.5"
        >
          <span>← Back to TechVision Careers Home</span>
        </Link>
        <span className="hidden sm:inline text-slate-600">•</span>
        <Link
          href="/dashboard"
          className="text-brand-gold-light hover:underline flex items-center gap-1.5 font-semibold"
        >
          <span>Candidate Dashboard (Search Enrolled Credentials)</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
