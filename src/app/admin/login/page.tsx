"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, Lock, Mail, ArrowRight, KeyRound } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Verified Admin Credentials check
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (
      (cleanEmail === "patelroshansingh7@gmail.com" && cleanPassword === "Rp_techvision123@b") ||
      (cleanEmail === "admin@techvisioncareers.com" && cleanPassword === "admin_techvision_2026")
    ) {
      if (typeof window !== "undefined") {
        localStorage.setItem("tv_admin_session", "true");
      }
      router.push("/admin");
    } else {
      setError("Incorrect email or password. Access denied.");
      setLoading(false);
    }
  };

  return (
    <div className="py-20 max-w-md mx-auto px-4 space-y-6">
      <div className="text-center space-y-2">
        <div className="w-14 h-14 rounded-2xl bg-brand-navy border border-brand-gold flex items-center justify-center text-brand-gold-light mx-auto shadow-xl">
          <ShieldCheck className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-black text-white">Admin Authority Login</h1>
        <p className="text-xs text-slate-400">
          Restricted access. Only authorized administrators can log in to verify payments and issue certificates.
        </p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xl">
        {error && (
          <div className="p-3 bg-rose-950/90 border border-rose-800 text-rose-200 text-xs rounded-xl flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-slate-300 text-xs font-bold mb-1.5">
              Admin Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="email"
                required
                placeholder="patelroshansingh7@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-gold placeholder-slate-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 text-xs font-bold mb-1.5">
              Admin Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-gold placeholder-slate-600"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-brand-gold hover:bg-brand-gold-light text-brand-navy-dark font-extrabold text-xs rounded-xl shadow-lg shadow-brand-gold/20 flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <span>{loading ? "Verifying Credentials..." : "Sign In to Admin Panel"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>

        <div className="pt-2 border-t border-slate-800 text-center">
          <Link href="/" className="text-xs text-slate-400 hover:text-slate-200 transition">
            ← Return to Main Website
          </Link>
        </div>
      </div>
    </div>
  );
}