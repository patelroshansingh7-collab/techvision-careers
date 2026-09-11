"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Award,
  ShieldCheck,
  Download,
  ExternalLink,
  BookOpen,
  Calendar,
  User,
  Plus,
  CheckCircle2,
  Clock,
  Sparkles,
  Search,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  Loader2,
  X,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function DashboardPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if student has their own saved email in localStorage or URL
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const urlEmail = urlParams.get("email") || urlParams.get("query") || "";
      const savedEmail = localStorage.getItem("tv_student_email") || "";
      const initial = urlEmail || savedEmail;

      if (initial) {
        setSearchQuery(initial);
        performSearch(initial);
      }
    }
  }, []);

  const performSearch = async (queryToSearch: string) => {
    const trimmed = queryToSearch.trim();
    if (!trimmed) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/student/orders?query=${encodeURIComponent(trimmed)}`);
      const data = await res.json();

      if (data.success) {
        setOrders(data.enrollments || []);
        setHasSearched(true);
        // Save to localStorage for convenience of this specific student
        if (typeof window !== "undefined" && trimmed.includes("@")) {
          localStorage.setItem("tv_student_email", trimmed);
        }
      } else {
        setError(data.message || "Failed to search credentials");
      }
    } catch (err: any) {
      console.error(err);
      setError("Network error while looking up credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(searchQuery);
  };

  const handleClear = () => {
    setSearchQuery("");
    setHasSearched(false);
    setOrders([]);
    setError(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("tv_student_email");
    }
  };

  return (
    <div className="py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-brand-gold/20 text-brand-gold-light border border-brand-gold/30 rounded-full text-xs font-bold">
              CANDIDATE CREDENTIAL HUB
            </span>
            <span className="px-2 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-800 rounded-full text-[10px] font-bold flex items-center gap-1">
              <Lock className="w-3 h-3 text-emerald-400" />
              PRIVACY PROTECTED
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            My Enrolled Internships & Certificates
          </h1>
          <p className="text-xs text-slate-400">
            Access, download, and share your verified credentials securely.
          </p>
        </div>

        <Link
          href="/#courses-catalog"
          className="py-3 px-5 bg-brand-gold hover:bg-brand-gold-light text-brand-navy-dark font-extrabold text-xs rounded-xl shadow-md shadow-brand-gold/20 flex items-center gap-1.5 transition self-start sm:self-center"
        >
          <Plus className="w-4 h-4" />
          <span>Enroll New Track (₹149)</span>
        </Link>
      </div>

      {/* Secure Search Form */}
      <div className="bg-slate-900/90 border border-slate-800 hover:border-brand-gold/30 rounded-3xl p-6 sm:p-7 space-y-4 transition">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Search className="w-4 h-4 text-brand-gold" />
              <span>Find Your Verified Credentials</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Enter your registered Email Address or Certificate ID to retrieve your certificates.
            </p>
          </div>
          <span className="text-[11px] text-slate-500 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Confidential candidate lookup
          </span>
        </div>

        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Enter registered email (e.g. roshan@gmail.com) or Certificate ID..."
              className="w-full pl-10 pr-10 py-3 bg-slate-950/90 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-brand-gold transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1"
                title="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !searchQuery.trim()}
            className="py-3 px-6 bg-brand-gold hover:bg-brand-gold-light disabled:opacity-50 disabled:cursor-not-allowed text-brand-navy-dark font-extrabold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 flex-shrink-0"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Searching...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>Search My Certificates</span>
              </>
            )}
          </button>
        </form>

        {error && (
          <div className="p-3 bg-red-950/60 border border-red-800 text-red-300 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Content Area */}
      <div>
        {/* CASE 1: Initial State (Has NOT searched yet) */}
        {!hasSearched && (
          <div className="bg-slate-900/50 border border-slate-800/80 rounded-3xl p-8 sm:p-12 text-center space-y-6">
            <div className="w-14 h-14 bg-emerald-950/80 border border-emerald-700/60 rounded-2xl flex items-center justify-center mx-auto text-emerald-400 shadow-lg shadow-emerald-950/50">
              <ShieldCheck className="w-7 h-7" />
            </div>

            <div className="max-w-xl mx-auto space-y-2">
              <h3 className="text-lg font-bold text-white">
                Candidate Privacy & Confidentiality Protected
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                To safeguard student personal information and ensure credential security, student records are strictly private and never shown publicly. Please enter your registered email address or Certificate ID above to retrieve your credentials.
              </p>
            </div>

            {/* 3 Privacy Pillars */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto pt-4 text-left">
              <div className="bg-slate-950/70 border border-slate-800/80 p-4 rounded-2xl space-y-1.5">
                <div className="flex items-center gap-2 text-brand-gold text-xs font-bold">
                  <Lock className="w-4 h-4" />
                  <span>Strict Data Privacy</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Your enrollments, contact info, and certificates are hidden from other candidates.
                </p>
              </div>

              <div className="bg-slate-950/70 border border-slate-800/80 p-4 rounded-2xl space-y-1.5">
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                  <Award className="w-4 h-4" />
                  <span>Instant PDF Download</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Retrieve and download your signed, high-resolution certificate anytime.
                </p>
              </div>

              <div className="bg-slate-950/70 border border-slate-800/80 p-4 rounded-2xl space-y-1.5">
                <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>QR Verifiable</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Share permanent verification links with employers and on your LinkedIn profile.
                </p>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3 text-xs">
              <Link
                href="/#courses-catalog"
                className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl font-semibold transition"
              >
                Browse 22+ Internship Tracks
              </Link>
              <Link
                href="/verify/TVC-IN-2026-0142"
                className="py-2.5 px-4 bg-slate-950 hover:bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800 rounded-xl font-medium transition"
              >
                Open QR Verification Portal
              </Link>
            </div>
          </div>
        )}

        {/* CASE 2: Has Searched AND Found Orders */}
        {hasSearched && orders.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-brand-gold" />
                <span>Your Enrolled Credentials ({orders.length})</span>
              </h2>
              <span className="text-xs text-slate-400">
                Registered under: <strong className="text-brand-gold-light">{searchQuery}</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {orders.map((order) => {
                const hasCert = !!order.certificate;
                const certNo = order.certificate?.certNo;

                return (
                  <div
                    key={order.id}
                    className="bg-slate-900/90 border border-slate-800 hover:border-brand-gold/40 rounded-2xl p-5 space-y-4 transition shadow-lg shadow-black/20"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="px-2 py-0.5 bg-slate-950 text-brand-gold-light border border-slate-800 text-[10px] font-bold rounded-md uppercase">
                          {order.course?.category || "Engineering"}
                        </span>
                        <h3 className="font-bold text-sm text-white mt-1.5 line-clamp-1">
                          {order.course?.title || "Internship Course"}
                        </h3>
                        <span className="text-xs text-slate-400 block mt-0.5">
                          Candidate: <strong className="text-slate-200">{order.userName}</strong>
                        </span>
                      </div>

                      <div>
                        {hasCert ? (
                          <span className="px-2.5 py-1 bg-emerald-950/90 text-emerald-300 border border-emerald-700/80 text-[10px] font-extrabold rounded-lg flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            ISSUED
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 bg-amber-950/90 text-amber-300 border border-amber-700/80 text-[10px] font-extrabold rounded-lg flex items-center gap-1">
                            <Clock className="w-3 h-3 text-amber-400" />
                            {order.paymentStatus || "PENDING"}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                      <div>
                        <span className="text-slate-500 block text-[10px]">Start Date</span>
                        <span className="text-slate-200 font-medium">{formatDate(order.startDate)}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">Certificate ID</span>
                        <span className="text-brand-gold-light font-mono font-bold">
                          {certNo || "Pending Approval"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      {hasCert ? (
                        <div className="flex items-center gap-2 w-full">
                          <Link
                            href={`/generate/${order.orderId}`}
                            className="flex-1 py-2.5 px-3 bg-brand-gold hover:bg-brand-gold-light text-brand-navy-dark font-extrabold text-xs rounded-xl text-center transition flex items-center justify-center gap-1.5"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>View & Download PDF</span>
                          </Link>
                          <Link
                            href={`/verify/${certNo}`}
                            target="_blank"
                            className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1 transition"
                            title="Open Verification Link"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      ) : (
                        <Link
                          href={`/payment/${order.orderId}`}
                          className="w-full py-2.5 px-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl text-center transition flex items-center justify-center gap-1.5"
                        >
                          <Clock className="w-3.5 h-3.5" />
                          <span>Complete ₹149 Payment</span>
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* CASE 3: Has Searched AND 0 Found */}
        {hasSearched && orders.length === 0 && (
          <div className="text-center py-16 bg-slate-900/60 rounded-3xl border border-slate-800 space-y-4 max-w-2xl mx-auto p-8">
            <div className="w-12 h-12 bg-slate-800/80 rounded-2xl flex items-center justify-center mx-auto text-slate-400">
              <Award className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-200">
                No active credentials found for &quot;{searchQuery}&quot;
              </h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Please ensure you entered the exact email address used during enrollment. If you just submitted your payment, admin verification is in progress.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleClear}
                className="py-2 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl"
              >
                Try Another Email
              </button>
              <Link
                href="/#courses-catalog"
                className="py-2 px-4 bg-brand-gold hover:bg-brand-gold-light text-brand-navy-dark text-xs font-bold rounded-xl"
              >
                Enroll in 22+ Courses (₹149)
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}