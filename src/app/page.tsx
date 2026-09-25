"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
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
    gradient: "linear-gradient(135deg, rgba(6,182,212,0.18), rgba(59,130,246,0.12))",
    glowColor: "rgba(6,182,212,0.35)",
  },
  {
    icon: "💻",
    title: "Developer CLI & Manifest",
    description: "Declarative syncbay.json for services, databases, volumes, and scaling. Deploy with syncbay up directly from your local terminal.",
    gradient: "linear-gradient(135deg, rgba(124,58,237,0.18), rgba(139,92,246,0.12))",
    glowColor: "rgba(124,58,237,0.35)",
  },
  {
    icon: "📟",
    title: "Web Shell & SQL Studio",
    description: "Interactive VT100 terminal connecting to containers in real-time. Built-in query studio with visual schema tree and explain plans.",
    gradient: "linear-gradient(135deg, rgba(236,72,153,0.18), rgba(244,114,182,0.12))",
    glowColor: "rgba(236,72,153,0.35)",
  },
  {
    icon: "🐘",
    title: "Managed Postgres & Redis",
    description: "One-click serverless PostgreSQL, Redis/Valkey, and MySQL. Auto-injected and resolved across inter-service variables.",
    gradient: "linear-gradient(135deg, rgba(34,197,94,0.18), rgba(52,211,153,0.12))",
    glowColor: "rgba(34,197,94,0.35)",
  },
  {
    icon: "🔀",
    title: "Blue/Green Auto-Rollbacks",
    description: "Zero-downtime deployments with automated HTTP health probes. Instant sub-second rollback on any degradation signal.",
    gradient: "linear-gradient(135deg, rgba(245,158,11,0.18), rgba(251,191,36,0.12))",
    glowColor: "rgba(245,158,11,0.35)",
  },
  {
    icon: "📦",
    title: "Nixpacks Runtime Engine",
    description: "Auto-detection for Node.js, Python, Go, Rust, Ruby, or Dockerfile. OCI-compliant images with smart 4-phase caching.",
    gradient: "linear-gradient(135deg, rgba(59,130,246,0.18), rgba(96,165,250,0.12))",
    glowColor: "rgba(59,130,246,0.35)",
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
    <div
      className="min-h-screen relative selection:bg-cyan-500/30 selection:text-white"
      style={{ background: "#050510", color: "#f1f5f9" }}
    >
      {/* Navigation Bar with Glassmorphic 3D Bevel */}
      <header
        className="sticky top-0 z-50"
        style={{
          borderBottom: "1px solid rgba(6,182,212,0.25)",
          background: "rgba(8,8,18,0.8)",
          backdropFilter: "blur(20px) saturate(1.5)",
          WebkitBackdropFilter: "blur(20px) saturate(1.5)",
          boxShadow: "0 4px 30px rgba(0,0,0,0.5)",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3 group">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-base font-black transition-all duration-300 group-hover:scale-110 shadow-lg"
              style={{
                background: "linear-gradient(135deg, #06B6D4, #7C3AED)",
                color: "#050510",
                boxShadow: "0 0 25px rgba(6,182,212,0.4), inset 0 1px 0 rgba(255,255,255,0.4)",
              }}
            >
              ⚡
            </div>
            <span className="font-extrabold text-xl tracking-tight font-mono">
              <span className="text-white">SYNCBAY</span>
              <span style={{ color: "#06B6D4" }}>.APP</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center space-x-8 text-xs font-semibold" style={{ color: "#94a3b8" }}>
            <Link href="/pricing" className="font-bold transition-colors hover:text-white" style={{ color: "#38bdf8" }}>
              Plans & Pricing
            </Link>
            <a href="#comparison" className="hover:text-white transition-colors">
              Compare Platforms
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
                className="px-4 py-2 rounded-xl font-bold transition-all text-sm hover:scale-105"
                style={{
                  background: "linear-gradient(135deg, #06B6D4, #3B82F6)",
                  color: "#050510",
                  boxShadow: "0 0 20px rgba(6,182,212,0.4)",
                }}
              >
                Console Dashboard →
              </Link>
            ) : (
              <>
                <Link
                  href="/auth/signin"
                  className="px-4 py-2 rounded-xl transition-all font-semibold hover:border-cyan-400"
                  style={{
                    border: "1px solid rgba(255,255,255,0.18)",
                    color: "#e2e8f0",
                    background: "rgba(255,255,255,0.04)",
                  }}
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/signin"
                  className="px-4 py-2 rounded-xl font-bold transition-all hover:scale-105 shadow-lg"
                  style={{
                    background: "linear-gradient(135deg, #06B6D4, #3B82F6)",
                    color: "#050510",
                    boxShadow: "0 0 20px rgba(6,182,212,0.35)",
                  }}
                >
                  Deploy Free
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Sections */}
      <main className="relative z-10 space-y-32 pb-32">
        {/* 3D Realistic Hero */}
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
            <div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase mb-3"
              style={{
                background: "rgba(6, 182, 212, 0.15)",
                border: "1px solid rgba(6, 182, 212, 0.4)",
                color: "#38bdf8",
              }}
            >
              ⚙ Architectural Primitives
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-3">
              Built for Infinite Scale & 0ms Starts
            </h2>
            <p className="text-sm font-medium" style={{ color: "#94a3b8" }}>
              Everything required to run mission-critical production services — zero operational overhead.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feat) => (
              <TiltCard key={feat.title} glowColor={feat.glowColor} intensity={14}>
                <div
                  className="p-7 rounded-2xl h-full flex flex-col justify-between"
                  style={{
                    background: feat.gradient,
                  }}
                >
                  <div>
                    <div
                      className="text-2xl mb-4 w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
                      style={{
                        background: "rgba(18, 18, 28, 0.9)",
                        border: "1px solid rgba(255, 255, 255, 0.2)",
                        boxShadow: "0 0 20px rgba(6,182,212,0.25)",
                      }}
                    >
                      {feat.icon}
                    </div>
                    <h3 className="text-base font-black text-white mb-2 tracking-tight">
                      {feat.title}
                    </h3>
                    <p className="text-xs font-medium leading-relaxed text-slate-300">
                      {feat.description}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs font-mono">
                    <span style={{ color: "#38bdf8" }}>Cloud Native</span>
                    <span className="text-emerald-400 font-bold">● Active</span>
                  </div>
                </div>
              </TiltCard>
            ))}
          </div>
        </section>

        {/* 3D Realistic Cyber CTA Section */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6">
          <div
            className="relative rounded-3xl p-12 md:p-16 text-center overflow-hidden"
            style={{
              background: "linear-gradient(135deg, rgba(22, 22, 38, 0.95), rgba(10, 10, 20, 0.98))",
              border: "1px solid rgba(6, 182, 212, 0.45)",
              boxShadow: "0 30px 80px -15px rgba(0,0,0,0.9), 0 0 50px rgba(6, 182, 212, 0.2)",
              backdropFilter: "blur(24px)",
            }}
          >
            {/* Background glowing gradients */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: "radial-gradient(circle at 50% 0%, rgba(6,182,212,0.25), transparent 70%)",
              }}
            />

            <div className="relative z-10">
              <h2
                className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight mb-4 text-white drop-shadow-md"
                style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
              >
                Ready to Own the Cloud?
              </h2>
              <p
                className="text-base sm:text-lg max-w-2xl mx-auto mb-10 leading-relaxed font-medium"
                style={{ color: "#cbd5e1" }}
              >
                Join thousands of engineers deploying without limits. 6 global POPs, zero cold starts,
                attached serverless Postgres, and interactive shell terminals.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/auth/signin"
                  className="w-full sm:w-auto px-10 py-4 rounded-xl font-black text-sm text-center transition-all duration-200 hover:scale-105 shadow-xl"
                  style={{
                    background: "linear-gradient(135deg, #06B6D4, #3B82F6)",
                    color: "#050510",
                    boxShadow: "0 10px 30px rgba(6,182,212,0.45), inset 0 1px 0 rgba(255,255,255,0.4)",
                  }}
                >
                  🚀 Get Started Free in 30s
                </Link>
                <Link
                  href="/pricing"
                  className="w-full sm:w-auto px-8 py-4 rounded-xl font-bold text-sm text-center transition-all duration-200 hover:border-cyan-400"
                  style={{
                    border: "1px solid rgba(6, 182, 212, 0.4)",
                    background: "rgba(255,255,255,0.06)",
                    color: "#f8fafc",
                  }}
                >
                  View Plans & Pricing →
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer with Compliance */}
      <footer
        className="relative z-10 border-t py-12 px-4 sm:px-6 text-xs"
        style={{
          borderTopColor: "rgba(6, 182, 212, 0.25)",
          background: "rgba(8, 8, 16, 0.9)",
          color: "#94a3b8",
        }}
      >
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
            <span className="font-extrabold text-sm tracking-tight text-white font-mono">
              SYNCBAY<span style={{ color: "#06B6D4" }}>.APP</span>
            </span>
            <span className="hidden sm:inline" style={{ color: "#374151" }}>|</span>
            <div>
              Syncbay Technologies Inc. · 548 Market St, Suite 82194, San Francisco, CA 94104 · Incorporated in Delaware, USA · Tier-1 American Cloud Infrastructure
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 font-semibold">
            <Link href="/pricing" className="transition-colors hover:text-white" style={{ color: "#38bdf8" }}>
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
            <span className="flex items-center gap-1.5" style={{ color: "#4ade80" }}>
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#4ade80]" />
              All Systems Operational
            </span>
          </div>
        </div>
      </footer>

      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: "Syncbay PaaS",
            applicationCategory: "DevOpsApplication",
            operatingSystem: "Cloud, Linux Edge",
            offers: { "@type": "Offer", price: "0.00", priceCurrency: "USD" },
            publisher: {
              "@type": "Organization",
              name: "Syncbay Technologies Inc.",
              url: "https://www.syncbay.app",
              address: {
                "@type": "PostalAddress",
                streetAddress: "548 Market St, Suite 82194",
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
