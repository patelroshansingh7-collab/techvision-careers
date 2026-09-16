"use client";

import React, { useEffect, useRef, useState } from "react";
import { Calendar, User, Award, Check } from "lucide-react";
import { generateQrDataUrl } from "@/lib/qr";
import { formatDate } from "@/lib/utils";

export interface CertificateData {
  certNo: string;
  internName: string;
  courseTitle: string;
  startDate: string | Date;
  endDate: string | Date;
  issueDate?: string | Date;
  mode?: string;
  mentorName?: string;
  mentorTitle?: string;
  directorName?: string;
  directorTitle?: string;
  qrPayload?: string;
}

export interface CertificateViewProps {
  data: CertificateData;
  scale?: number;
  containerId?: string;
  isInteractive?: boolean;
  autoFit?: boolean;
  maxScale?: number;
}

export const CertificateView: React.FC<CertificateViewProps> = ({
  data,
  scale: explicitScale,
  containerId = "techvision-cert-node",
  autoFit = true,
  maxScale = 1,
}) => {
  const [qrSrc, setQrSrc] = useState<string>("");
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);

  const formattedStart = formatDate(data.startDate);
  const formattedEnd = formatDate(data.endDate);
  const formattedIssue = formatDate(data.issueDate || data.startDate);
  const certId = data.certNo || "TVC-IN-2026-0142";

  // Native certificate dimensions (A4 Landscape)
  const CERT_WIDTH = 1122;
  const CERT_HEIGHT = 793;

  // Responsive measurement for mobile and desktop screens
  useEffect(() => {
    if (!autoFit) return;
    const el = containerRef.current;
    if (!el) return;

    const measure = () => {
      const w = el.clientWidth;
      if (w > 0) {
        setContainerWidth(w);
      }
    };

    measure();

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width || entry.target.clientWidth;
        if (w > 0) {
          setContainerWidth(w);
        }
      }
    });

    ro.observe(el);
    window.addEventListener("resize", measure);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [autoFit]);

  // Compute active scale:
  // If autoFit is active and containerWidth is measured, fit 100% of container width (capped at maxScale)
  // Otherwise fallback to explicitScale or 1
  const computedScale =
    autoFit && containerWidth > 0
      ? Math.min(maxScale, containerWidth / CERT_WIDTH)
      : explicitScale ?? 1;

  const stageWidth = Math.round(CERT_WIDTH * computedScale);
  const stageHeight = Math.round(CERT_HEIGHT * computedScale);

  // Build full verifiable URL for mobile phone scanning
  const getVerificationUrl = () => {
    // If a non-local URL was passed in, use it
    if (
      data.qrPayload &&
      data.qrPayload.startsWith("http") &&
      !data.qrPayload.includes("localhost") &&
      !data.qrPayload.includes("172.11")
    ) {
      return data.qrPayload;
    }

    if (typeof window !== "undefined") {
      const origin = window.location.origin;
      if (
        !origin.includes("localhost") &&
        !origin.includes("127.0.0.1") &&
        !origin.includes("172.11")
      ) {
        return `${origin}/verify/${certId}`;
      }
    }

    // Default to the live Vercel production domain
    return `https://techvision-careers.vercel.app/verify/${certId}`;
  };

  const verifyUrl = getVerificationUrl();

  useEffect(() => {
    let isMounted = true;
    generateQrDataUrl(verifyUrl).then((url) => {
      if (isMounted) setQrSrc(url);
    });
    return () => {
      isMounted = false;
    };
  }, [verifyUrl]);

  return (
    <div
      ref={containerRef}
      className="w-full flex justify-center items-center overflow-hidden"
    >
      <div
        style={{
          width: containerWidth > 0 ? `${stageWidth}px` : "100%",
          height: containerWidth > 0 ? `${stageHeight}px` : "auto",
          aspectRatio: `${CERT_WIDTH} / ${CERT_HEIGHT}`,
          maxWidth: `${CERT_WIDTH}px`,
          position: "relative",
          overflow: "hidden",
          transition: "width 0.15s ease-out, height 0.15s ease-out",
        }}
      >
        <div
          style={{
            width: `${CERT_WIDTH}px`,
            height: `${CERT_HEIGHT}px`,
            transform: `scale(${computedScale})`,
            transformOrigin: "top left",
            position: "absolute",
            top: 0,
            left: 0,
            transition: "transform 0.15s ease-out",
          }}
        >
          <div id={containerId} className="cert-canvas-card">
        {/* Top-Left Triangular Corners */}
        <div className="corner-tl-navy" />
        <div className="corner-tl-gold" />

        {/* Top-Left Circular Laurel Monogram Badge */}
        <div className="corner-badge-tl">
          <div className="corner-badge-inner">
            <span className="badge-stars">★★★</span>
            <span className="badge-monogram">TC</span>
            <span className="badge-subtext">TECHVISION</span>
          </div>
        </div>

        {/* Top-Right Tag & Corner */}
        <div className="corner-tr-navy" />
        <div className="corner-tr-gold" />
        <div className="cert-id-tag">Certificate ID: {certId}</div>

        {/* Bottom Ribbons */}
        <div className="corner-bl-gold" />
        <div className="corner-bl-navy" />
        <div className="corner-br-gold" />
        <div className="corner-br-navy" />

        {/* Inner Gold Frame */}
        <div className="inner-gold-frame">
          {/* Brand Header */}
          <div className="cert-header-brand">
            <div className="brand-emblem-box">
              <span className="brand-emblem-t">T</span>
              <span className="brand-emblem-v">V</span>
              <span className="brand-emblem-star">★</span>
            </div>
            <div className="brand-title-wrap">
              <div className="brand-main-spelling">
                <span className="brand-navy-txt">TECHVISON</span>
                <span className="brand-gold-txt">CAREERS</span>
              </div>
              <span className="brand-sub-tagline">
                EMPOWERING CAREERS THROUGH TECHNOLOGY & SKILLS
              </span>
            </div>
          </div>

          {/* Certificate Title Section */}
          <div className="cert-title-section">
            <h1 className="cert-heading-main">CERTIFICATE</h1>
            <div className="cert-sub-divider">
              <span className="gold-divider-bar" />
              <span className="cert-sub-text">OF INTERNSHIP</span>
              <span className="gold-divider-bar" />
            </div>
            <p className="certify-statement">This is to certify that</p>
          </div>

          {/* Participant Cursive Name */}
          <div className="recipient-name-block">
            <div className="recipient-cursive-name">
              {data.internName || "Roshan Singh"}
            </div>
            <div className="diamond-underline-wrap">
              <span className="diamond-bar" />
              <span className="diamond-point">◆</span>
              <span className="diamond-bar" />
            </div>
          </div>

          {/* 3-Column Body */}
          <div className="cert-body-columns">
            {/* Left Metadata Column */}
            <div className="cert-meta-left">
              <div className="meta-item-box">
                <div className="meta-gold-circle">
                  <Calendar className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="meta-field-label">START DATE</span>
                  <span className="meta-field-value">{formattedStart}</span>
                </div>
              </div>

              <div className="meta-item-box">
                <div className="meta-gold-circle">
                  <Calendar className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="meta-field-label">END DATE</span>
                  <span className="meta-field-value">{formattedEnd}</span>
                </div>
              </div>

              <div className="meta-item-box">
                <div className="meta-gold-circle">
                  <Calendar className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="meta-field-label">ISSUE DATE</span>
                  <span className="meta-field-value">{formattedIssue}</span>
                </div>
              </div>

              <div className="meta-item-box">
                <div className="meta-gold-circle">
                  <User className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="meta-field-label">MODE</span>
                  <span className="meta-field-value">{data.mode || "Online"}</span>
                </div>
              </div>

              <div className="meta-item-box">
                <div className="meta-gold-circle">
                  <Award className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="meta-field-label">PROGRAM</span>
                  <span className="meta-field-value">Internship</span>
                </div>
              </div>
            </div>

            {/* Center Narrative Paragraph */}
            <div className="cert-center-narrative">
              <p className="narrative-line-1" style={{ wordSpacing: "3px" }}>
                has successfully completed the Internship Program in
              </p>
              <div className="narrative-course-highlight" style={{ wordSpacing: "3px" }}>
                {data.courseTitle || "Full-Stack Web Development"}
              </div>
              <p className="narrative-details-line" style={{ wordSpacing: "2.5px" }}>
                conducted by <strong>TechVision Careers</strong> from{" "}
                <strong>{formattedStart}</strong> to <strong>{formattedEnd}</strong>.
              </p>
              <p className="narrative-details-line" style={{ wordSpacing: "2.5px" }}>
                During this internship, <strong>{data.internName || "Roshan Singh"}</strong>{" "}
                demonstrated commendable technical proficiency, dedication, and problem-solving skills.
              </p>
              <p className="narrative-best-wishes" style={{ wordSpacing: "2px" }}>
                We wish them all the best in their future career endeavors.
              </p>
            </div>

            {/* Right Column: Verified Shield + QR */}
            <div className="cert-verify-right">
              <div className="verified-shield-badge">
                <div className="shield-icon-circle">
                  <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3.5]" />
                </div>
                <span className="shield-verified-text">VERIFIED</span>
              </div>

              <a
                href={verifyUrl}
                target="_blank"
                rel="noreferrer"
                className="cert-qr-container hover:scale-105 transition-transform"
                title="Click to open verification link"
              >
                {qrSrc ? (
                  <img
                    src={qrSrc}
                    alt="Verification QR Code"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full bg-slate-100 flex items-center justify-center text-[10px] text-slate-400">
                    QR Code
                  </div>
                )}
              </a>
              <span className="scan-verify-note">
                Scan to Verify<br />Authenticity
              </span>
            </div>
          </div>

          {/* Bottom Footer: Signatories & Gold Circular Medal */}
          <div className="cert-footer-row">
            {/* Left Signatory: Rahul Sharma */}
            <div className="sig-column-box">
              <div className="sig-cursive-preview">
                <img
                  src="/assets/signatures/rahul_signature.png"
                  alt="Rahul Sharma Signature"
                  className="h-10 object-contain mx-auto"
                />
              </div>
              <div className="sig-gold-line" />
              <div className="sig-person-name">
                {data.mentorName || "Rahul Sharma"}
              </div>
              <div className="sig-person-title">
                {data.mentorTitle || "Program Director"}
              </div>
            </div>

            {/* Center Circular Gold Embossed Seal */}
            <div className="center-gold-seal">
              <div className="seal-circle-outer">
                <div className="seal-circle-inner">
                  <span className="seal-top-text">COMMITMENT TO</span>
                  <span className="seal-stars">★★★</span>
                  <span className="seal-main-word">EXCELLENCE</span>
                  <span className="seal-flourish">❧ ☙</span>
                </div>
              </div>
            </div>

            {/* Right Signatory: Anjali Mehta */}
            <div className="sig-column-box">
              <div className="sig-cursive-preview">
                <img
                  src="/assets/signatures/anjali_signature.png"
                  alt="Anjali Signature"
                  className="h-11 object-contain mx-auto"
                />
              </div>
              <div className="sig-gold-line" />
              <div className="sig-person-name">
                {data.directorName || "Anjali Mehta"}
              </div>
              <div className="sig-person-title">
                {data.directorTitle || "Head of Operations"}
              </div>
            </div>
          </div>

          {/* Bottom URL Footer */}
          <div className="cert-bottom-link-row">
            <span>🌐 www.techvisioncareers.com</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
  );
};