"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ParticleField } from "@/components/ui/particle-field";
import { LandingHero } from "@/components/marketing/landing-hero";
import { GeoLatencyWidget } from "@/components/marketing/geo-latency-widget";
import { ComparisonTable } from "@/components/marketing/comparison-table";
import { TemplatesCatalog } from "@/components/marketing/templates-catalog";
import { TiltCard } from "@/components/ui/tilt-card";

const FEATURES = [
  {
    icon: "🌍",
    title: "6-POP Edge Network",
    description: "Active-active deployment across N. Virginia, San Francisco, Frankfurt, London, Singapore, and Sydney. Traffic auto-shifts in under 500ms.",
    gradient: "linear-gradient(135deg, rgba(6,182,212,0.08), rgba(59,130,246,0.05))",
    glowColor: "rgba(6,182,212,0.15)",
  },
  {
    icon: "💻",
    title: "Developer CLI & Manifest",
    description: "Declarative syncbay.json for services, databases, volumes, and scaling. Deploy with syncbay up from your terminal.",
    gradient: "linear-gradient(135deg, rgba(124,58,237,0.08), rgba(139,92,246,0.05))",
    glowColor: "rgba(124,58,237,0.15)",
  },
  {
    icon: "📟",
    title: "Web Shell & SQL Studio",
    description: "Interactive VT100 terminal connecting to containers. Built-in query studio with visual schema explorer and explain plans.",
    gradient: "linear-gradient(135deg, rgba(236,72,153,0.08), rgba(244,114,182,0.05))",
    glowColor: "rgba(236,72,153,0.15)",
  },
  {
    icon: "🐘",
    title: "Managed Postgres & Redis",
    description: "One-click serverless PostgreSQL, Redis/Valkey, and MySQL. Auto-resolved via inter-service variables.",
    gradient: "linear-gradient(135deg, rgba(34,197,94,0.08), rgba(52,211,153,0.05))",
    glowColor: "rgba(34,197,94,0.15)",
  },
  {
    icon: "🔀",
    title: "Blue/Green Auto-Rollbacks",
    description: "Zero-downtime deployments with automated HTTP healthchecks. Instant rollback on any degradation signal.",
    gradient: "linear-gradient(135deg, rgba(245,158,11,0.08), rgba(251,191,36,0.05))",
    glowColor: "rgba(245,158,11,0.15)",
  },
  {
    icon: "📦",
    title: "Nixpacks Runtime Engine",
    description: "Auto-detection for Node.js, Python, Go, Rust, Ruby, or Dockerfile. OCI-compliant images with smart caching.",
    gradient: "linear-gradient(135deg, rgba(59,130,246,0.08), rgba(96,165,250,0.05))",
    glowColor: "rgba(59,130,246,0.15)",
  },
];

export default function HomePage() {
  const [sessionUser, setSessionUser] = useState<{ name?: string | null; email?: string | null } | null>(null);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((data) => {
        if (data?.user) setSessionUser(data.user);
      })
      .catch(() => null);
  }, []);

  return (
    <div className="min-h-screen relative selection:bg-cyan-500/30 selection:text-white" style={{ background: "#050510", color: "#f1f5f9" }}>
      {/* Particle Field Background */}
      <ParticleField density={60} speed={0.2} />

      {/* Top Gradient Ambience */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background: "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(124,58,237,0.12) 0%, transparent 60%)",
        }}
      />

      {/* Navigation */}
      <header
        className="sticky top-0 z-50"
        style={{
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          background: "rgba(5,5,16,0.6)",
          backdropFilter: "blur(20px) saturate(1.5)",
          WebkitBackdropFilter: "blur(20px) saturate(1.5)",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3 group">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black transition-all group-hover:scale-110"
              style={{
                background: "linear-gradient(135deg, #06B6D4, #7C3AED)",
                color: "#000",
                boxShadow: "0 0 20px rgba(6,182,212,0.3)",
              }}
            >
              ⚡
            </div>
            <span className="font-extrabold text-lg tracking-tight font-mono">
              <span className="text-white">SYNCBAY</span>
              <span style={{ color: "#06B6D4" }}>.APP</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center space-x-8 text-xs font-medium" style={{ color: "#6b7280" }}>
            <Link href="/pricing" className="font-bold transition-colors hover:text-white" style={{ color: "#06B6D4" }}>
              Plans & Pricing
            </Link>
            <a href="#comparison" className="hover:text-white transition-colors">
              Compare
            </a>
            <a href="#latency" className="hover:text-white transition-colors">
              Edge Network
            </a>
            <a href="#templates" className="hover:text-white transition-colors">
              Templates
            </a>
            <a href="/api/v1/openapi.json" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">
              API ↗
            </a>
          </nav>

          <div className="flex items-center space-x-3 font-mono text-xs">
            {sessionUser ? (
              <Link
                href="/dashboard"
                className="px-4 py-2 rounded-xl font-bold transition-all text-sm"
                style={{
                  background: "linear-gradient(135deg, #06B6D4, #3B82F6)",
                  color: "#000",
                  boxShadow: "0 0 15px rgba(6,182,212,0.25)",
                }}
              >
                Console →
              </Link>
            ) : (
              <>
                <Link
                  href="/auth/signin"
                  className="px-3.5 py-1.5 rounded-lg transition-all"
                  style={{
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "#94a3b8",
                  }}
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/signin"
                  className="px-4 py-1.5 rounded-lg font-bold transition-all"
                  style={{
                    background: "linear-gradient(135deg, #06B6D4, #3B82F6)",
                    color: "#000",
                    boxShadow: "0 0 15px rgba(6,182,212,0.25)",
                  }}
                >
                  Deploy Free
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 space-y-32 pb-32">
        {/* Hero Section */}
        <LandingHero />

        {/* Global Edge Latency Section */}
        <section id="latency" className="max-w-7xl mx-auto px-4 sm:px-6">
          <GeoLatencyWidget />
        </section>

        {/* Comparison Matrix Section */}
        <section id="comparison" className="max-w-7xl mx-auto px-4 sm:px-6">
          <ComparisonTable />
        </section>

        {/* 1-Click Templates Section */}
        <section id="templates" className="max-w-7xl mx-auto px-4 sm:px-6">
          <TemplatesCatalog />
        </section>

        {/* Core Architecture Features Grid */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-3">
              Enterprise Cloud Primitives
            </h2>
            <p className="text-sm" style={{ color: "#6b7280" }}>
              Everything required to run mission-critical production services — zero operational overhead.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((feat) => (
              <TiltCard key={feat.title} glowColor={feat.glowColor} intensity={12}>
                <div
                  className="p-6 rounded-2xl h-full"
                  style={{
                    background: feat.gradient,
                    border: "1px solid rgba(255,255,255,0.06)",
                    backdropFilter: "blur(8px)",
                  }}
                >
                  <div
                    className="text-2xl mb-4 w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    {feat.icon}
                  </div>
                  <h3 className="text-sm font-bold text-white mb-2">{feat.title}</h3>
                  <p className="text-xs leading-relaxed" style={{ color: "#94a3b8" }}>
                    {feat.description}
                  </p>
                </div>
              </TiltCard>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6">
          <div
            className="relative rounded-3xl p-12 md:p-16 text-center overflow-hidden"
            style={{
              background: "linear-gradient(135deg, rgba(6,182,212,0.06), rgba(124,58,237,0.06), rgba(236,72,153,0.04))",
              border: "1px solid rgba(6,182,212,0.15)",
              boxShadow: "0 0 60px rgba(6,182,212,0.08), inset 0 1px 0 rgba(255,255,255,0.05)",
            }}
          >
            {/* Background radial */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: "radial-gradient(circle at 50% 0%, rgba(6,182,212,0.12), transparent 60%)",
              }}
            />

            {/* Decorative orbs */}
            <div
              className="absolute -top-20 -left-20 w-60 h-60 rounded-full pointer-events-none"
              style={{
                background: "radial-gradient(circle, rgba(124,58,237,0.15), transparent 70%)",
                filter: "blur(60px)",
              }}
            />
            <div
              className="absolute -bottom-20 -right-20 w-60 h-60 rounded-full pointer-events-none"
              style={{
                background: "radial-gradient(circle, rgba(236,72,153,0.15), transparent 70%)",
                filter: "blur(60px)",
              }}
            />

            <div className="relative z-10">
              <h2
                className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight mb-4"
                style={{ fontFamily: "'Inter', system-ui, sans-serif", color: "#fff" }}
              >
                Ready to Own the Cloud?
              </h2>
              <p className="text-sm sm:text-base max-w-2xl mx-auto mb-10 leading-relaxed" style={{ color: "#94a3b8" }}>
                Join thousands of developers migrating from Vercel and Railway to the next-generation edge platform.
                Deploy your first service in under 30 seconds.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/auth/signin"
                  className="group relative w-full sm:w-auto"
                >
                  <div
                    className="absolute -inset-1 rounded-2xl opacity-60 group-hover:opacity-100 transition-opacity duration-500 blur-md"
                    style={{ background: "linear-gradient(135deg, #06B6D4, #7C3AED, #EC4899)" }}
                  />
                  <div
                    className="relative px-10 py-5 rounded-xl font-extrabold text-sm text-center transition-all"
                    style={{
                      background: "linear-gradient(135deg, #06B6D4, #3B82F6)",
                      color: "#000",
                      boxShadow: "0 0 30px rgba(6,182,212,0.3)",
                    }}
                  >
                    Deploy Now — Free Tier Included
                  </div>
                </Link>
                <a
                  href="/api/v1/openapi.json"
                  target="_blank"
                  rel="noreferrer"
                  className="w-full sm:w-auto px-8 py-5 rounded-xl font-bold text-sm text-center transition-all"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "#e2e8f0",
                  }}
                >
                  Inspect Public API ↗
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer
        className="py-12 px-4 sm:px-6"
        style={{
          borderTop: "1px solid rgba(255,255,255,0.05)",
          background: "rgba(5,5,16,0.9)",
        }}
      >
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs font-mono" style={{ color: "#4b5563" }}>
          <div className="flex flex-col gap-1 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start space-x-2">
              <span className="font-bold" style={{ color: "#e2e8f0" }}>SYNCBAY TECHNOLOGIES INC.</span>
              <span>• San Francisco, CA, USA 🇺🇸</span>
              <span>• MSNS-DEV™</span>
            </div>
            <div className="text-[11px]" style={{ color: "#374151" }}>
              100 Montgomery St, Suite 1400, San Francisco, CA 94104 · Incorporated in Delaware, USA · Tier-1 American Cloud Infrastructure
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6">
            <Link href="/pricing" className="transition-colors hover:text-white" style={{ color: "#06B6D4" }}>
              Plans & Pricing
            </Link>
            <Link href="/auth/signin" className="hover:text-white transition-colors">
              Console Sign In
            </Link>
            <a href="/api/v1/openapi.json" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">
              OpenAPI 3.1
            </a>
            <a href="/api/geo/locate" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">
              Geo Telemetry
            </a>
            <span className="flex items-center gap-1" style={{ color: "#22c55e" }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#22c55e", boxShadow: "0 0 6px rgba(34,197,94,0.5)" }} />
              All Systems Operational
            </span>
          </div>
        </div>
      </footer>

      {/* SEO Schema.org JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: "Syncbay PaaS",
            applicationCategory: "DevOpsApplication",
            operatingSystem: "Cloud, Linux Edge",
            offers: {
              "@type": "Offer",
              price: "0.00",
              priceCurrency: "USD",
            },
            publisher: {
              "@type": "Organization",
              name: "Syncbay Technologies Inc.",
              url: "https://www.syncbay.app",
              address: {
                "@type": "PostalAddress",
                streetAddress: "100 Montgomery St, Suite 1400",
                addressLocality: "San Francisco",
                addressRegion: "CA",
                postalCode: "94104",
                addressCountry: "US",
              },
            },
            description:
              "The Cloud Hyper-Plane for Modern Developers. Next-Gen PaaS with 6 global edge POPs, managed PostgreSQL, web shell, and SQL Query Studio.",
          }),
        }}
      />
    </div>
  );
}
