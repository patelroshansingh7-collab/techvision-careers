"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Key,
  User,
  Code2,
  GraduationCap,
  ScrollText,
  Play,
  Square,
  Calendar,
  AlertTriangle,
  Download,
  Printer,
  ChevronDown,
  ChevronUp,
  Award,
  Loader2,
  Check,
} from "lucide-react";
import { CertificateView } from "@/components/certificate/certificate-view";
import { CertificateActions } from "@/components/certificate/certificate-actions";
import { formatDateSlash } from "@/lib/utils";

export default function VerifyPage({
  params,
}: {
  params: { cert_no: string };
}) {
  const { cert_no } = params;
  const [certData, setCertData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFullCert, setShowFullCert] = useState(false);

  useEffect(() => {
    async function fetchCert() {
      try {
        const res = await fetch(`/api/certificates/${cert_no}`);
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.message || "Certificate record not found");
        }
        setCertData(data.certificate);
      } catch (err: any) {
        setError(err.message || "Invalid or unverified certificate ID");
      } finally {
        setLoading(false);
      }
    }
    fetchCert();
  }, [cert_no]);

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
        <h2 className="text-base font-bold text-white">
          Verifying Credential in Official Registry...
        </h2>
        <p className="text-xs text-slate-400">
          Fetching cryptographic details for #{cert_no}
        </p>
      </div>
    );
  }

  if (error || !certData) {
    return (
      <div className="py-20 max-w-md mx-auto px-4 text-center space-y-5">
        <div className="w-16 h-16 rounded-3xl bg-rose-950/80 border border-rose-800 text-rose-400 flex items-center justify-center mx-auto shadow-xl">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <span className="px-3 py-1 rounded-full bg-rose-950 text-rose-300 border border-rose-800 text-xs font-bold">
            UNVERIFIED / INVALID CREDENTIAL
          </span>
          <h1 className="text-2xl font-black text-white">
            Certificate Not Found
          </h1>
          <p className="text-xs text-slate-400">
            No official record was found matching Certificate ID{" "}
            <code className="text-rose-300 font-mono">{cert_no}</code>.
          </p>
        </div>

        <div className="pt-2">
          <Link
            href="/"
            className="inline-block py-2.5 px-6 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl transition"
          >
            Return to Official Portal
          </Link>
        </div>
      </div>
    );
  }

  const isRevoked = certData.revoked;
  const startStr = formatDateSlash(certData.startDate) || "12/06/2026";
  const endStr = formatDateSlash(certData.endDate) || "12/07/2026";
  const issueStr = formatDateSlash(certData.issuedAt) || "12/06/2026";

  return (
    <div className="py-8 sm:py-12 max-w-2xl mx-auto px-4 sm:px-6 space-y-6">
      {/* =========================================================================
          EXACT VERIFIED CARD LAYOUT (MATCHING UPLOADED SCREENSHOT)
          ========================================================================= */}
      <div className="bg-white text-slate-900 rounded-3xl p-6 sm:p-10 shadow-2xl border border-slate-200/80 relative overflow-hidden font-sans">
        
        {/* Subtle Faint Circular Green Checkmark Watermark in Center Background */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
          <div className="w-72 h-72 rounded-full border-[18px] border-emerald-500/10 flex items-center justify-center">
            <svg
              className="w-48 h-48 text-emerald-500/15 stroke-current"
              viewBox="0 0 24 24"
              fill="none"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        </div>

        <div className="relative z-10 space-y-6">
          {/* Top Header: Green Line with 2 Green Shield Icons + VERIFIED text */}
          <div className="flex items-center justify-center gap-3">
            <span className="h-[2px] w-12 sm:w-16 bg-emerald-600 rounded-full" />
            
            <div className="flex items-center gap-2 text-emerald-600 font-extrabold text-lg sm:text-xl tracking-wider">
              <div className="w-6 h-6 rounded-full border-2 border-emerald-600 flex items-center justify-center">
                <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3.5]" />
              </div>
              <span className="font-black">VERIFIED</span>
              <div className="w-6 h-6 rounded-full border-2 border-emerald-600 flex items-center justify-center">
                <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3.5]" />
              </div>
            </div>

            <span className="h-[2px] w-12 sm:w-16 bg-emerald-600 rounded-full" />
          </div>

          {/* Certificate Details Headline */}
          <h1 className="text-2xl sm:text-3xl font-black text-center text-slate-900 tracking-tight">
            Certificate Details
          </h1>

          {/* Details List with exact icons and dividers */}
          <div className="space-y-4 pt-2 text-sm sm:text-base">
            
            {/* 1. CIN */}
            <div className="flex items-center gap-3.5 pb-3 border-b border-slate-100">
              <Key className="w-5 h-5 text-slate-700 flex-shrink-0" />
              <div className="text-slate-800">
                <span className="font-semibold text-slate-700">CIN: </span>
                <span className="font-mono font-bold text-slate-900">{certData.certNo}</span>
              </div>
            </div>

            {/* 2. Name */}
            <div className="flex items-center gap-3.5 pb-3 border-b border-slate-100">
              <User className="w-5 h-5 text-slate-700 flex-shrink-0" />
              <div className="text-slate-800">
                <span className="font-semibold text-slate-700">Name: </span>
                <span className="font-bold text-slate-950">{certData.internName}</span>
              </div>
            </div>

            {/* 3. Internship Track */}
            <div className="flex items-start gap-3.5 pb-3 border-b border-slate-100">
              <Code2 className="w-5 h-5 text-slate-700 flex-shrink-0 mt-0.5" />
              <div className="text-slate-800">
                <span className="font-semibold text-slate-700">Internship Track: </span>
                <span className="font-bold text-slate-950">{certData.courseTitle}</span>
              </div>
            </div>

            {/* 4. College */}
            <div className="flex items-start gap-3.5 pb-3 border-b border-slate-100">
              <GraduationCap className="w-5 h-5 text-slate-700 flex-shrink-0 mt-0.5" />
              <div className="text-slate-800">
                <span className="font-semibold text-slate-700">College: </span>
                <span className="font-bold text-slate-950">
                  {certData.college || "Rajkiya Engineering college Azamgarh"}
                </span>
              </div>
            </div>

            {/* 5. LoR */}
            <div className="flex items-center gap-3.5 pb-3 border-b border-slate-100">
              <ScrollText className="w-5 h-5 text-slate-700 flex-shrink-0" />
              <div className="text-slate-800">
                <span className="font-semibold text-slate-700">LoR: </span>
                <span className="font-bold text-slate-950">Yes</span>
              </div>
            </div>

            {/* 6. Start Date */}
            <div className="flex items-center gap-3.5 pb-3 border-b border-slate-100">
              <Play className="w-4 h-4 text-slate-700 flex-shrink-0" />
              <div className="text-slate-800">
                <span className="font-semibold text-slate-700">Start Date: </span>
                <span className="font-bold text-slate-950">{startStr}</span>
              </div>
            </div>

            {/* 7. End Date */}
            <div className="flex items-center gap-3.5 pb-3 border-b border-slate-100">
              <Square className="w-4 h-4 text-slate-700 flex-shrink-0" />
              <div className="text-slate-800">
                <span className="font-semibold text-slate-700">End Date: </span>
                <span className="font-bold text-slate-950">{endStr}</span>
              </div>
            </div>

            {/* 8. Issue Date */}
            <div className="flex items-center gap-3.5">
              <Calendar className="w-5 h-5 text-slate-700 flex-shrink-0" />
              <div className="text-slate-800">
                <span className="font-semibold text-slate-700">Issue Date: </span>
                <span className="font-bold text-slate-950">{issueStr}</span>
              </div>
            </div>

          </div>

          {/* Issuer Trust Footnote */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Official TechVision Careers Registry</span>
            </span>
            <span className="font-semibold text-emerald-700">ISO 9001:2015</span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          ACTIONS: DOWNLOAD PDF & TOGGLE FULL CERTIFICATE DOCUMENT
          ========================================================================= */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <CertificateActions
          certNo={certData.certNo}
          internName={certData.internName}
          containerId="verified-certificate-stage"
        />

        <div className="pt-2 text-center">
          <button
            onClick={() => setShowFullCert(!showFullCert)}
            className="text-xs font-bold text-brand-gold-light hover:underline inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Award className="w-4 h-4" />
            <span>
              {showFullCert
                ? "Hide Full A4 Certificate Document"
                : "View Full Official A4 Certificate Document"}
            </span>
            {showFullCert ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Expandable Full A4 Certificate Canvas */}
      {showFullCert && (
        <div className="bg-slate-950 border border-slate-800 rounded-3xl p-4 sm:p-8 flex flex-col items-center shadow-2xl overflow-hidden animate-fadeIn">
          <div className="w-full flex items-center justify-between text-xs text-slate-400 pb-3 mb-4 border-b border-slate-800">
            <span className="font-semibold text-slate-200">
              Official A4 Document
            </span>
            <span className="font-mono text-brand-gold-light font-bold">
              {certData.certNo}
            </span>
          </div>

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
              containerId="verified-certificate-stage"
            />
          </div>
        </div>
      )}
    </div>
  );
}