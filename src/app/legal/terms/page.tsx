import React from "react";
import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="py-12 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      <div className="space-y-2 border-b border-slate-800 pb-6">
        <span className="text-xs font-bold text-brand-gold uppercase tracking-wider">
          Legal & Compliance
        </span>
        <h1 className="text-3xl font-black text-white">Terms of Service</h1>
        <p className="text-xs text-slate-400">Last updated: June 2026</p>
      </div>

      <div className="space-y-6 text-xs sm:text-sm text-slate-300 leading-relaxed bg-slate-900/60 p-6 sm:p-8 rounded-3xl border border-slate-800">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-white">1. Acceptance of Terms</h2>
          <p>
            By enrolling in any of the TechVision Careers internship courses and paying the certification fee of ₹149, you agree to these Terms of Service.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-white">2. Credential Authenticity & Integrity</h2>
          <p>
            Candidates are responsible for providing their genuine legal name and academic details. Any fraudulent representations or unauthorized tampering with certificate files will result in permanent revocation of the credential on the public verification registry.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-white">3. Intellectual Property</h2>
          <p>
            The TechVision Careers brand identity, logos, vector layout designs, and seals are protected intellectual property. Certificates are licensed to the individual candidate for career showcase, LinkedIn, and resume purposes.
          </p>
        </section>
      </div>
    </div>
  );
}