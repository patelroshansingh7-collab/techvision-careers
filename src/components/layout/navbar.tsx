"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Award, ShieldCheck, BookOpen, User, Menu, X, Sparkles, CheckCircle2 } from "lucide-react";

export const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-brand-navy-dark/95 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-gold via-amber-500 to-amber-700 p-0.5 shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-brand-navy rounded-[10px] flex items-center justify-center text-brand-gold-light">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-white group-hover:text-brand-gold-light transition-colors">
                TECHVISION CAREERS
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-brand-gold/20 text-brand-gold-light border border-brand-gold/40 rounded-full">
                22+ COURSES
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              Empowering Careers Through Technology & Skills
            </p>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-900/80 p-1.5 rounded-xl border border-slate-800 text-xs font-semibold">
          <Link
            href="/"
            className="px-3.5 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/80 transition flex items-center gap-1.5"
          >
            <BookOpen className="w-4 h-4 text-cyan-400" />
            <span>All Courses</span>
            <span className="px-1.5 py-0.2 bg-brand-gold/20 text-brand-gold-light text-[10px] rounded-full font-bold">
              22
            </span>
          </Link>

          <Link
            href="/verify/TVC-IN-2026-0142"
            className="px-3.5 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/80 transition flex items-center gap-1.5"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Verify Portal</span>
          </Link>

          <Link
            href="/dashboard"
            className="px-3.5 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/80 transition flex items-center gap-1.5"
          >
            <User className="w-4 h-4 text-amber-400" />
            <span>Student Portal</span>
          </Link>
        </nav>

        {/* Right CTA */}
        <div className="hidden sm:flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-slate-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Fixed Fee: <strong className="text-brand-gold-light">₹149 / cert</strong></span>
          </div>

          <Link
            href="/enroll/full-stack-web-development-react-node"
            className="px-4 py-2 bg-gradient-to-r from-brand-gold via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-brand-navy-dark font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 flex items-center gap-1.5 transition transform hover:-translate-y-0.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Enroll Now</span>
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-lg bg-slate-900 text-slate-300 border border-slate-800"
          aria-label="Toggle Navigation"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-brand-navy-dark px-4 py-4 space-y-2">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm text-slate-200 hover:bg-slate-800"
          >
            Browse 22+ IT Courses
          </Link>
          <Link
            href="/verify/TVC-IN-2026-0142"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm text-slate-200 hover:bg-slate-800"
          >
            Public Verification Portal
          </Link>
          <Link
            href="/dashboard"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm text-slate-200 hover:bg-slate-800"
          >
            My Enrolled Certificates
          </Link>
          <div className="pt-2">
            <Link
              href="/enroll/full-stack-web-development-react-node"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full py-2.5 bg-brand-gold text-brand-navy-dark font-bold text-center rounded-lg text-sm block"
            >
              Enroll for ₹149
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};