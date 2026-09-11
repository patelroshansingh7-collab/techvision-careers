import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

const baseUrl = "https://techvision-careers.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "TechVision Careers | Industry-Certified Engineering Internship Portal",
    template: "%s | TechVision Careers",
  },
  description:
    "TechVision Careers offers industry-certified engineering internship programs in 22+ domains with verifiable QR credentials and official certificates for ₹149.",
  keywords: [
    "TechVision",
    "TechVision Careers",
    "Tech Vision",
    "TechVision Careers portal",
    "IT Internship",
    "Engineering Certificate",
    "Verified Credentials",
    "Full Stack Web Development",
    "AI ML Internship",
    "Online Internship",
    "TechVision internship verification",
  ],
  authors: [{ name: "TechVision Careers Authority" }],
  creator: "TechVision Careers",
  publisher: "TechVision Careers",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [
      { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: baseUrl,
  },
  openGraph: {
    title: "TechVision Careers — Engineering & IT Internship Portal",
    description:
      "Enroll in industry internship courses for ₹149. Generate and verify official certificates with tamper-proof QR codes.",
    url: baseUrl,
    siteName: "TechVision Careers",
    images: [
      {
        url: `${baseUrl}/logo.png`,
        width: 512,
        height: 512,
        alt: "TechVision Careers Logo",
      },
    ],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "TechVision Careers",
    description: "Official Engineering Internship Certification Portal",
    images: [`${baseUrl}/logo.png`],
  },
  verification: {
    google: "nj-gQOXjJyqPFayKWws1XMrclRerWERT8VSpt_syWuk",
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "EducationalOrganization",
      "@id": `${baseUrl}/#organization`,
      name: "TechVision Careers",
      alternateName: "TechVision",
      url: baseUrl,
      logo: `${baseUrl}/logo.png`,
      description: "Premier engineering internship certification and credentials authority.",
      sameAs: [
        "https://www.linkedin.com/company/techvisioncareers",
        "https://twitter.com/techvisioncareers"
      ]
    },
    {
      "@type": "WebSite",
      "@id": `${baseUrl}/#website`,
      url: baseUrl,
      name: "TechVision Careers",
      publisher: {
        "@id": `${baseUrl}/#organization`
      },
      potentialAction: {
        "@type": "SearchAction",
        target: `${baseUrl}/?q={search_term_string}`,
        "query-input": "required name=search_term_string"
      }
    }
  ]
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta name="google-site-verification" content="nj-gQOXjJyqPFayKWws1XMrclRerWERT8VSpt_syWuk" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body className="bg-brand-navy-dark text-slate-100 min-h-screen flex flex-col font-sans selection:bg-brand-gold selection:text-brand-navy-dark">
        <Navbar />
        <main className="flex-1 flex flex-col">{children}</main>
        <Footer />
      </body>
    </html>
  );
}