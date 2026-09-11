import React from "react";
import Link from "next/link";

export default function RefundPage() {
  return (
    <div className="py-12 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      <div className="space-y-2 border-b border-slate-800 pb-6">
        <span className="text-xs font-bold text-brand-gold uppercase tracking-wider">
          Legal & Compliance
        </span>
        <h1 className="text-3xl font-black text-white">Refund & Cancellation Policy</h1>
        <p className="text-xs text-slate-400">Last updated: June 2026</p>
      </div>

      <div className="space-y-6 text-xs sm:text-sm text-slate-300 leading-relaxed bg-slate-900/60 p-6 sm:p-8 rounded-3xl border border-slate-800">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-white">1. Certification Fee</h2>
          <p>
            The ₹149 fee covers administrative processing, curriculum access, cryptographic ledger entry, dynamic QR generation, and lifetime cloud credential hosting.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-white">2. Refund Eligibility</h2>
          <p>
            If duplicate payments occur due to a technical network error or gateway issue, the duplicate transaction will be refunded within 5-7 working days upon contacting credentials@techvisioncareers.com.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-white">3. Correction Policy</h2>
          <p>
            If there is a typo in your issued certificate (such as name misspelling), you can contact administrative support to request a free re-issuance without paying again.
          </p>
        </section>
      </div>
    </div>
  );
}