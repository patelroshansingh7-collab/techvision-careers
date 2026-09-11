import React from "react";
import Link from "next/link";
import { Clock, Globe, ArrowRight, CheckCircle2, Layers } from "lucide-react";
import { CourseData } from "@/lib/courses-data";
import { formatINR } from "@/lib/utils";

interface CourseCardProps {
  course: CourseData;
}

export const CourseCard: React.FC<CourseCardProps> = ({ course }) => {
  return (
    <div className="bg-slate-900/80 border border-slate-800 hover:border-brand-gold/50 rounded-2xl p-5 flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:shadow-brand-gold/5 group relative overflow-hidden">
      {/* Top Category Badge & Mode */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="px-2.5 py-1 bg-brand-navy/90 text-brand-gold-light border border-brand-gold/30 rounded-lg text-[11px] font-bold tracking-wide">
            {course.category}
          </span>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
            <Clock className="w-3.5 h-3.5 text-brand-gold" />
            <span>{course.durationDays} Days</span>
            <span className="text-slate-600">•</span>
            <span>{course.mode}</span>
          </div>
        </div>

        {/* Course Title */}
        <h3 className="font-bold text-base text-white group-hover:text-brand-gold-light transition-colors line-clamp-2 min-h-[48px]">
          {course.title}
        </h3>

        {/* Description */}
        <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
          {course.description}
        </p>

        {/* Tools Pill Tags */}
        <div className="flex flex-wrap gap-1.5 my-3.5">
          {course.tools.map((tool, idx) => (
            <span
              key={idx}
              className="px-2 py-0.5 bg-slate-950/80 border border-slate-800 rounded-md text-[10px] text-slate-300 font-mono"
            >
              {tool}
            </span>
          ))}
        </div>

        {/* Core Learning Outcomes */}
        <div className="space-y-1.5 pt-2 border-t border-slate-800/80 text-[11px] text-slate-300">
          {course.learn.slice(0, 2).map((bullet, idx) => (
            <div key={idx} className="flex items-start gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span className="line-clamp-1">{bullet}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Card Footer: Price & CTA */}
      <div className="mt-5 pt-3.5 border-t border-slate-800/80 flex items-center justify-between">
        <div>
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
            Internship Credential
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-black text-white">
              {formatINR(course.priceINR)}
            </span>
            <span className="text-[11px] text-slate-500 line-through">₹2,999</span>
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-800/60">
              95% OFF
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/courses/${course.slug}`}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition"
            title="View Course Syllabus"
          >
            <Layers className="w-4 h-4" />
          </Link>
          <Link
            href={`/enroll/${course.slug}`}
            className="py-2 px-3.5 bg-brand-gold hover:bg-brand-gold-light text-brand-navy-dark font-bold text-xs rounded-xl shadow-md shadow-brand-gold/20 flex items-center gap-1 transition"
          >
            <span>Enroll</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
};