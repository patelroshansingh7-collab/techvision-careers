import React from "react";
import Link from "next/link";
import { Award, ShieldCheck, Mail, Phone, MapPin, Globe } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="bg-brand-navy-dark border-t border-slate-800/80 text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand Info */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-brand-navy border border-brand-gold flex items-center justify-center text-brand-gold-light">
                <Award className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-sm text-white tracking-wider">
                TECHVISON CAREERS
              </span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              Empowering student engineers with certified technical internship credentials, hands-on skill evaluations, and verifiable QR portfolios.
            </p>
            <div className="flex items-center gap-2 text-emerald-400 font-semibold text-[11px]">
              <ShieldCheck className="w-4 h-4" />
              <span>ISO 9001:2015 Compliant Verification</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-white uppercase tracking-wider text-xs mb-3">
              Direct Portals
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="hover:text-brand-gold-light transition">
                  All 22+ Internship Courses
                </Link>
              </li>
              <li>
                <Link href="/verify/TVC-IN-2026-0142" className="hover:text-brand-gold-light transition">
                  QR Credential Verification
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-brand-gold-light transition">
                  Candidate Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Top Domain Categories */}
          <div>
            <h4 className="font-bold text-white uppercase tracking-wider text-xs mb-3">
              Internship Domains
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/courses/full-stack-web-development-react-node" className="hover:text-brand-gold-light transition">
                  Full Stack Web Development
                </Link>
              </li>
              <li>
                <Link href="/courses/python-for-machine-learning" className="hover:text-brand-gold-light transition">
                  Machine Learning & AI
                </Link>
              </li>
              <li>
                <Link href="/courses/cloud-devops-docker-kubernetes-cicd" className="hover:text-brand-gold-light transition">
                  Cloud Computing & DevOps
                </Link>
              </li>
              <li>
                <Link href="/courses/cybersecurity-fundamentals-ethical-hacking" className="hover:text-brand-gold-light transition">
                  Cybersecurity & Ethical Hacking
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact & Support */}
          <div className="space-y-2">
            <h4 className="font-bold text-white uppercase tracking-wider text-xs mb-3">
              Official Support
            </h4>
            <div className="flex items-center gap-2 text-slate-300">
              <Mail className="w-4 h-4 text-brand-gold" />
              <span>credentials@techvisioncareers.com</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <Phone className="w-4 h-4 text-brand-gold" />
              <span>+91 (080) 4567-8900</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <Globe className="w-4 h-4 text-brand-gold" />
              <span>www.techvisioncareers.com</span>
            </div>
            <div className="flex items-start gap-2 text-slate-400 text-[11px] pt-1">
              <MapPin className="w-4 h-4 text-brand-gold flex-shrink-0 mt-0.5" />
              <span>TechVision Tower, Cyber Gateway Park, Bangalore 560100, India</span>
            </div>
          </div>
        </div>

        {/* Bottom Bar & Legal */}
        <div className="pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px]">
          <p>© {new Date().getFullYear()} TechVision Careers Inc. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="/legal/privacy" className="hover:text-brand-gold transition">
              Privacy Policy
            </Link>
            <Link href="/legal/terms" className="hover:text-brand-gold transition">
              Terms of Service
            </Link>
            <Link href="/legal/refund" className="hover:text-brand-gold transition">
              Refund & Cancellation Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};