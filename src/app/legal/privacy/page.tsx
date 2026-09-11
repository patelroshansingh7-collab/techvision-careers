import React from "react";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export default function PrivacyPolicyPage() {
  return (
    <div className="py-12 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      <div className="space-y-2 border-b border-slate-800 pb-6">
        <span className="text-xs font-bold text-brand-gold uppercase tracking-wider">
          Legal & Compliance
        </span>
        <h1 className="text-3xl font-black text-white">Privacy Policy</h1>
        <p className="text-xs text-slate-400">Last updated: June 2026</p>
      </div>

      <div className="space-y-6 text-xs sm:text-sm text-slate-300 leading-relaxed bg-slate-900/60 p-6 sm:p-8 rounded-3xl border border-slate-800">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-white">1. Information We Collect</h2>
          <p>
            TechVision Careers collects candidate information including your full name, email address, affiliated academic institution, course selection, and transaction identifiers to generate and maintain your verifiable internship credentials.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-white">2. Purpose of Data Processing</h2>
          <p>
            Your information is strictly used for issuing tamper-proof digital certificates, facilitating public QR verification links for employers and recruiters, processing your ₹149 enrollment fee, and emailing credential backups.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-white">3. Public Ledger & Verification</h2>
          <p>
            When a certificate is generated, the candidate name, domain title, start and end dates, and certificate identification number are published on a publicly accessible read-only verification URL (/verify/[cert_no]) for authenticity validation.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-white">4. Data Security</h2>
          <p>
            All payment and candidate data is encrypted using 256-bit SSL protocols. We do not store credit card numbers or banking passwords on our servers.
          </p>
        </section>
      </div>
    </div>
  );
}