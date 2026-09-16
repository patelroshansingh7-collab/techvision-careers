"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Award,
  ShieldCheck,
  Sparkles,
  BookOpen,
  ArrowRight,
  QrCode,
  Download,
  Users,
  CheckCircle,
  HelpCircle,
  ChevronDown,
  Star,
  Zap,
} from "lucide-react";
import { ENGINEERING_COURSES, CourseData } from "@/lib/courses-data";
import { CourseCard } from "@/components/courses/course-card";
import { CourseFilter } from "@/components/courses/course-filter";
import { CertificateView } from "@/components/certificate/certificate-view";
import { CertificateActions } from "@/components/certificate/certificate-actions";
import { formatINR } from "@/lib/utils";

export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Interactive Live Preview State
  const [previewName, setPreviewName] = useState("Roshan Singh");
  const [previewCourse, setPreviewCourse] = useState(ENGINEERING_COURSES[0].title);
  const [previewDate, setPreviewDate] = useState("2026-06-12");
  const [previewMode, setPreviewMode] = useState("Online");

  // Filtered Courses
  const filteredCourses = useMemo(() => {
    return ENGINEERING_COURSES.filter((course) => {
      const matchesCategory =
        selectedCategory === "All" || course.category === selectedCategory;
      const matchesSearch =
        course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.tools.some((t) =>
          t.toLowerCase().includes(searchQuery.toLowerCase())
        );
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  // FAQ State
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: "How does the QR code verification work?",
      a: "Every certificate issued contains a unique Certificate ID (e.g. TVC-IN-2026-0142) and an embedded QR code. When scanned by employers, universities, or recruiters, it instantly opens a secure, public verification page (/verify/<cert_no>) verifying the candidate's name, domain, dates, and authentic certification status without requiring any login.",
    },
    {
      q: "Are these certificates accepted on LinkedIn and resumes?",
      a: "Yes, 100%. You can directly add your TechVision Careers certificate ID and verification link to the 'Licenses & Certifications' section of your LinkedIn profile, portfolio, and resume to demonstrate verified technical internship competence.",
    },
    {
      q: "Is there any hidden cost beyond ₹149?",
      a: "No. The ₹149 fee covers complete enrollment, course syllabus evaluation materials, unique certificate generation, lifetime verifiable digital credential hosting, and high-resolution PDF download with no additional recurring charges.",
    },
    {
      q: "How quickly is the certificate generated after payment?",
      a: "Instantly. As soon as your ₹149 payment is completed, you are redirected to your generation portal where your unique certificate with custom QR code is rendered and ready for instant PDF / PNG download and email dispatch.",
    },
    {
      q: "Can I choose both Online and Hybrid modes?",
      a: "Yes, during enrollment you can specify whether you are completing the internship track in an Online remote format or Hybrid hands-on project format, and this is clearly noted on your final credential.",
    },
  ];

  return (
    <div className="space-y-16 sm:space-y-24 pb-16">
      {/* =========================================================================
          HERO SECTION
          ========================================================================= */}
      <section className="relative overflow-hidden pt-12 sm:pt-20 pb-16 border-b border-slate-800/80 bg-gradient-to-b from-brand-navy-dark via-brand-navy/30 to-brand-navy-dark">
        {/* Glow Spheres */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-gold/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 left-1/4 w-72 h-72 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            {/* Top Tag */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-gold/10 border border-brand-gold/30 text-brand-gold-light text-xs font-bold tracking-wide animate-pulse">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Official 2026 Engineering Internship Portal • 22+ Tracks</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
              Launch Your Tech Career With{" "}
              <span className="bg-gradient-to-r from-brand-gold-light via-brand-gold to-amber-500 bg-clip-text text-transparent">
                Verifiable Internship
              </span>{" "}
              Credentials
            </h1>

            {/* Subtitle */}
            <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Enroll in 22+ industry-standard engineering tracks. Pay a flat nominal fee of{" "}
              <strong className="text-brand-gold-light font-bold">₹149</strong> to receive your unique
              Certificate ID with instant public QR verification and high-res vector PDF.
            </p>

            {/* Hero CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
              <a
                href="#courses-catalog"
                className="w-full sm:w-auto py-3.5 px-7 bg-gradient-to-r from-brand-gold via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-brand-navy-dark font-extrabold text-sm rounded-xl shadow-xl shadow-amber-500/25 flex items-center justify-center gap-2 transition transform hover:-translate-y-0.5"
              >
                <BookOpen className="w-4 h-4" />
                <span>Explore 22+ Courses (₹149)</span>
              </a>

              <a
                href="#live-preview-studio"
                className="w-full sm:w-auto py-3.5 px-6 bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700 font-semibold text-sm rounded-xl flex items-center justify-center gap-2 transition"
              >
                <Award className="w-4 h-4 text-brand-gold" />
                <span>Live Certificate Studio</span>
              </a>
            </div>

            {/* Trust Metrics Pill */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-8 max-w-3xl mx-auto text-left">
              <div className="bg-slate-900/60 border border-slate-800/80 p-3.5 rounded-xl">
                <div className="text-lg font-black text-white">22+</div>
                <div className="text-[11px] text-slate-400">Engineering Tracks</div>
              </div>
              <div className="bg-slate-900/60 border border-slate-800/80 p-3.5 rounded-xl">
                <div className="text-lg font-black text-emerald-400">₹149</div>
                <div className="text-[11px] text-slate-400">Fixed Fee / Cert</div>
              </div>
              <div className="bg-slate-900/60 border border-slate-800/80 p-3.5 rounded-xl">
                <div className="text-lg font-black text-amber-400">100%</div>
                <div className="text-[11px] text-slate-400">QR Verifiable</div>
              </div>
              <div className="bg-slate-900/60 border border-slate-800/80 p-3.5 rounded-xl">
                <div className="text-lg font-black text-cyan-400">Instant</div>
                <div className="text-[11px] text-slate-400">PDF Generation</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          3-STEP "HOW IT WORKS" WORKFLOW
          ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto space-y-2 mb-12">
          <span className="text-xs font-bold text-brand-gold uppercase tracking-wider">
            Simple 3-Step Process
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            How You Get Your Official Credential
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            From enrollment to instant verified credential in less than 2 minutes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Step 1 */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 relative">
            <div className="w-10 h-10 rounded-xl bg-brand-navy border border-brand-gold flex items-center justify-center text-brand-gold-light font-black text-base mb-4">
              01
            </div>
            <h3 className="font-bold text-base text-white mb-2">
              Select Your Engineering Track
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Choose from 22+ industry tracks in Web Development, AI/ML, Cloud DevOps, Cybersecurity, Mobile Apps, Data Science, and IoT.
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 relative">
            <div className="w-10 h-10 rounded-xl bg-brand-navy border border-brand-gold flex items-center justify-center text-brand-gold-light font-black text-base mb-4">
              02
            </div>
            <h3 className="font-bold text-base text-white mb-2">
              Enroll & Pay Flat ₹149
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Enter your candidate details, college name, and preferred start date. Complete the secure nominal ₹149 checkout via UPI / Razorpay.
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 relative">
            <div className="w-10 h-10 rounded-xl bg-brand-navy border border-brand-gold flex items-center justify-center text-brand-gold-light font-black text-base mb-4">
              03
            </div>
            <h3 className="font-bold text-base text-white mb-2">
              Instant Download & QR Verification
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Immediately download your high-res print-ready PDF certificate with unique ID and permanent public <code className="text-brand-gold-light">/verify/[id]</code> validation.
            </p>
          </div>
        </div>
      </section>

      {/* =========================================================================
          ALL 22 COURSES CATALOG
          ========================================================================= */}
      <section id="courses-catalog" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 scroll-mt-24">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-brand-gold/20 text-brand-gold-light border border-brand-gold/30 rounded-full text-[11px] font-bold">
                COMPREHENSIVE DIRECTORY
              </span>
              <span className="text-xs text-slate-400">• All 22 Engineering Domains</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
              Select Your Internship Course Track
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-xl">
              Each course includes industry-grade syllabus modules, hands-on tool proficiencies, and an official verified internship certificate.
            </p>
          </div>
        </div>

        {/* Filter Controls */}
        <CourseFilter
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          totalCoursesCount={filteredCourses.length}
        />

        {/* Courses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <CourseCard key={course.slug} course={course} />
          ))}
        </div>

        {filteredCourses.length === 0 && (
          <div className="text-center py-16 bg-slate-900/40 rounded-2xl border border-slate-800">
            <BookOpen className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <h4 className="text-base font-bold text-slate-300">No courses match your search</h4>
            <p className="text-xs text-slate-500 mt-1">Try clearing your search query or selecting "All" categories.</p>
          </div>
        )}
      </section>

      {/* =========================================================================
          LIVE INTERACTIVE CERTIFICATE STUDIO SECTION
          ========================================================================= */}
      <section id="live-preview-studio" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 scroll-mt-24">
        <div className="bg-gradient-to-r from-brand-navy via-slate-900 to-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 space-y-8">
          <div className="max-w-2xl space-y-2">
            <span className="px-2.5 py-0.5 bg-brand-gold/20 text-brand-gold-light border border-brand-gold/30 rounded-full text-[11px] font-bold">
              PIXEL-PERFECT DESIGN ENGINE
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              Live Interactive Certificate Studio
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Test how your certificate will look in real-time. Type your name, switch courses, and observe the live vector render matching the official TechVision Careers layout.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Interactive Form Controls (4 Cols) */}
            <div className="lg:col-span-4 bg-slate-950/80 border border-slate-800 rounded-2xl p-5 space-y-4">
              <h3 className="text-xs font-bold text-brand-gold uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> Customize Live Preview
              </h3>

              <div>
                <label className="block text-slate-400 text-xs font-medium mb-1">
                  Candidate Name
                </label>
                <input
                  type="text"
                  value={previewName}
                  onChange={(e) => setPreviewName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-gold transition"
                  placeholder="e.g. Roshan Singh"
                />
              </div>

              <div>
                <label className="block text-slate-400 text-xs font-medium mb-1">
                  Domain / Track
                </label>
                <select
                  value={previewCourse}
                  onChange={(e) => setPreviewCourse(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-gold transition"
                >
                  {ENGINEERING_COURSES.map((c) => (
                    <option key={c.slug} value={c.title}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 text-xs font-medium mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={previewDate}
                    onChange={(e) => setPreviewDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-brand-gold"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-xs font-medium mb-1">
                    Mode
                  </label>
                  <select
                    value={previewMode}
                    onChange={(e) => setPreviewMode(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-brand-gold"
                  >
                    <option value="Online">Online</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800/80 space-y-3">
                <Link
                  href={`/enroll/${ENGINEERING_COURSES.find((c) => c.title === previewCourse)?.slug || "full-stack-web-development-react-node"}`}
                  className="w-full py-3 bg-brand-gold hover:bg-brand-gold-light text-brand-navy-dark font-extrabold text-xs rounded-xl shadow-lg shadow-brand-gold/20 flex items-center justify-center gap-2 transition"
                >
                  <span>Enroll in This Track for ₹149</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>ISO 9001:2015 Seal</span>
                  </span>
                  <Link
                    href="/verify/TVC-IN-2026-0142"
                    className="text-brand-gold-light hover:underline font-semibold"
                  >
                    View Sample Verification →
                  </Link>
                </div>
              </div>
            </div>

            {/* Right Live Stage (8 Cols) */}
            <div className="lg:col-span-8 flex flex-col items-center">
              <div className="w-full bg-slate-950/90 border border-slate-800 rounded-2xl p-4 overflow-hidden flex flex-col items-center">
                <div className="w-full flex items-center justify-between text-xs text-slate-400 pb-3 mb-3 border-b border-slate-800">
                  <span className="font-semibold text-slate-200">
                    Live Official Verifiable A4 Credential
                  </span>
                  <span className="font-mono text-brand-gold-light">
                    ID: TVC-IN-2026-0142
                  </span>
                </div>

                {/* Responsive Certificate View Wrapper */}
                <div className="w-full flex justify-center py-2">
                  <CertificateView
                    data={{
                      certNo: "TVC-IN-2026-0142",
                      internName: previewName || "Roshan Singh",
                      courseTitle: previewCourse,
                      startDate: new Date(previewDate),
                      endDate: new Date(
                        new Date(previewDate).getTime() + 30 * 24 * 60 * 60 * 1000
                      ),
                      mode: previewMode,
                    }}
                    containerId="homepage-demo-cert"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          VERIFICATION FEATURES & TRUST
          ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-950/60 border border-emerald-800/80 flex items-center justify-center text-emerald-400">
              <QrCode className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-white">
              Instant QR Verification
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Every certificate has an embedded QR code linking directly to a public verification page accessible by HRs and universities 24/7.
            </p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-950/60 border border-amber-800/80 flex items-center justify-center text-amber-400">
              <Award className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-white">
              Official Authority Seals
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Signed by Program Directors and authorized signatories with gold embossed seals and unique alphanumeric tracking hashes.
            </p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-950/60 border border-indigo-800/80 flex items-center justify-center text-indigo-400">
              <Download className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-white">
              Lifetime Digital Access
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Re-download your high-resolution A4 landscape PDF and PNG credentials anytime through your candidate portal.
            </p>
          </div>
        </div>
      </section>

      {/* =========================================================================
          FAQ SECTION
          ========================================================================= */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="text-center space-y-2">
          <span className="text-xs font-bold text-brand-gold uppercase tracking-wider">
            Got Questions?
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden transition"
            >
              <button
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full p-4 sm:p-5 flex items-center justify-between text-left gap-4 cursor-pointer"
              >
                <span className="font-bold text-sm text-slate-200">{faq.q}</span>
                <ChevronDown
                  className={`w-4 h-4 text-brand-gold flex-shrink-0 transition-transform ${
                    openFaq === idx ? "rotate-180" : ""
                  }`}
                />
              </button>
              {openFaq === idx && (
                <div className="px-5 pb-5 text-xs text-slate-400 leading-relaxed border-t border-slate-800/60 pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* =========================================================================
          BOTTOM CTA
          ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-brand-navy via-brand-navy-light to-brand-navy border border-brand-gold/40 rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden shadow-2xl">
          <div className="max-w-2xl mx-auto space-y-5 relative z-10">
            <span className="px-3 py-1 bg-brand-gold text-brand-navy-dark font-extrabold text-xs rounded-full uppercase tracking-wider inline-block">
              Limited Period Offer — ₹149
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white">
              Get Your Certified Internship Credential Today
            </h2>
            <p className="text-xs sm:text-sm text-slate-300">
              Join thousands of engineering students from IITs, NITs, and top universities who showcase TechVision Careers verifiable credentials.
            </p>
            <div className="pt-2">
              <a
                href="#courses-catalog"
                className="inline-flex items-center gap-2 py-3.5 px-8 bg-brand-gold hover:bg-brand-gold-light text-brand-navy-dark font-black text-sm rounded-xl shadow-xl shadow-brand-gold/30 transition transform hover:scale-105"
              >
                <span>Browse All 22 Tracks Now</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}