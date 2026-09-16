import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Clock,
  Globe,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Award,
  Layers,
  FileCheck,
  QrCode,
} from "lucide-react";
import { ENGINEERING_COURSES } from "@/lib/courses-data";
import { CertificateView } from "@/components/certificate/certificate-view";
import { formatINR } from "@/lib/utils";

export default function CourseDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const course = ENGINEERING_COURSES.find((c) => c.slug === params.slug);

  if (!course) {
    notFound();
  }

  return (
    <div className="py-12 space-y-12">
      {/* Top Breadcrumb & Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 text-xs text-slate-400 mb-4">
          <Link href="/" className="hover:text-brand-gold-light">
            Home
          </Link>
          <span>/</span>
          <Link href="/#courses-catalog" className="hover:text-brand-gold-light">
            Courses
          </Link>
          <span>/</span>
          <span className="text-white font-medium">{course.title}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Info (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="flex items-center gap-2.5">
              <span className="px-3 py-1 bg-brand-gold/20 text-brand-gold-light border border-brand-gold/30 rounded-lg text-xs font-bold">
                {course.category} Track
              </span>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-brand-gold" />
                {course.durationDays} Days Comprehensive
              </span>
              <span className="text-xs text-slate-400">• {course.mode}</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black text-white leading-tight">
              {course.title}
            </h1>

            <p className="text-sm text-slate-300 leading-relaxed">
              {course.description}
            </p>

            {/* Key Tools & Technologies */}
            <div className="space-y-2 pt-2">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Validated Tools & Technologies
              </h4>
              <div className="flex flex-wrap gap-2">
                {course.tools.map((t, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1.5 bg-slate-900 border border-slate-700 text-brand-gold-light text-xs font-mono font-bold rounded-xl"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Learning Outcomes Curriculum */}
            <div className="space-y-3 pt-4 border-t border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-brand-gold" />
                <span>Internship Curriculum & Competencies</span>
              </h3>
              <div className="grid grid-cols-1 gap-2.5">
                {course.learn.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-200"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Pricing & Enrollment Card (5 cols) */}
          <div className="lg:col-span-5 bg-slate-900 border border-brand-gold/40 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-brand-gold uppercase tracking-wider block">
                Official Credential Fee
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-black text-white">
                  {formatINR(course.priceINR)}
                </span>
                <span className="text-sm text-slate-500 line-through">₹2,999</span>
                <span className="text-xs font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-800">
                  Save 95%
                </span>
              </div>
              <p className="text-[11px] text-slate-400 pt-1">
                One-time payment • No hidden exam or certificate fees
              </p>
            </div>

            <div className="space-y-3 text-xs text-slate-300 pt-2 border-t border-slate-800">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-brand-gold flex-shrink-0" />
                <span>Unique Certificate ID (<code className="text-brand-gold-light">TVC-IN-2026-XXXX</code>)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-brand-gold flex-shrink-0" />
                <span>Permanent QR code verification link</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-brand-gold flex-shrink-0" />
                <span>High-resolution vector PDF download</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-brand-gold flex-shrink-0" />
                <span>LinkedIn and resume profile integration</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-brand-gold flex-shrink-0" />
                <span>Authorized signatories & ISO 9001:2015 seal</span>
              </div>
            </div>

            <Link
              href={`/enroll/${course.slug}`}
              className="w-full py-4 bg-gradient-to-r from-brand-gold via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-brand-navy-dark font-extrabold text-sm rounded-2xl shadow-xl shadow-brand-gold/25 flex items-center justify-center gap-2 transition transform hover:-translate-y-0.5"
            >
              <Sparkles className="w-4 h-4" />
              <span>Enroll Now for {formatINR(course.priceINR)}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Instant Automated Issuance on Completion</span>
            </div>
          </div>
        </div>
      </section>

      {/* Certificate Sample Section for this course */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 pt-6 border-t border-slate-800">
        <div className="text-center space-y-2">
          <span className="text-xs font-bold text-brand-gold uppercase tracking-wider">
            Credential Layout Preview
          </span>
          <h2 className="text-2xl font-extrabold text-white">
            Sample Certificate for {course.title}
          </h2>
          <p className="text-xs text-slate-400">
            This exact pixel-perfect certificate will be issued to your name upon enrollment.
          </p>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-3xl p-3 sm:p-8 flex justify-center overflow-hidden">
          <CertificateView
            data={{
              certNo: "TVC-IN-2026-0142",
              internName: "Roshan Singh",
              courseTitle: course.title,
              startDate: new Date("2026-06-12"),
              endDate: new Date("2026-07-12"),
              mode: course.mode,
            }}
            containerId="course-detail-sample-cert"
          />
        </div>
      </section>
    </div>
  );
}