"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AsciiBackground } from "@/components/ui/ascii-background";
import { LandingHero } from "@/components/marketing/landing-hero";
import { GeoLatencyWidget } from "@/components/marketing/geo-latency-widget";
import { ComparisonTable } from "@/components/marketing/comparison-table";
import { TemplatesCatalog } from "@/components/marketing/templates-catalog";

export default function HomePage() {
  const [asciiTheme, setAsciiTheme] = useState<"cyber" | "matrix" | "synthwave" | "aurora">("cyber");
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
    <div className="min-h-screen bg-black text-white relative selection:bg-cyan-500 selection:text-black">
      {/* Dynamic Colorful ASCII Cloud Background */}
      <AsciiBackground theme={asciiTheme} opacity={0.28} density="medium" />

      {/* Navigation Topbar */}
      <header className="sticky top-0 z-40 border-b border-zinc-800/80 bg-black/70 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 via-fuchsia-500 to-indigo-600 flex items-center justify-center text-black font-black text-sm shadow-[0_0_15px_rgba(6,182,212,0.5)] group-hover:scale-105 transition-transform">
              ⚡
            </div>
            <span className="font-extrabold text-lg tracking-tight text-white font-mono">
              SYNCBAY<span className="text-cyan-400">.APP</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center space-x-6 text-xs text-zinc-400 font-medium">
            <Link href="/pricing" className="text-cyan-400 font-bold hover:text-white transition-colors">
              Plans &amp; Pricing 💎
            </Link>
            <a href="#comparison" className="hover:text-white transition-colors">
              Compare Vercel &amp; Railway
            </a>
            <a href="#latency" className="hover:text-white transition-colors">
              Global Edge POPs
            </a>
            <a href="#templates" className="hover:text-white transition-colors">
              Templates
            </a>
            <a href="/api/v1/openapi.json" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">
              OpenAPI Spec ↗
            </a>
          </nav>

          <div className="flex items-center space-x-3 font-mono text-xs">
            {sessionUser ? (
              <Link
                href="/dashboard"
                className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-bold transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)]"
              >
                Go to Console →
              </Link>
            ) : (
              <>
                <Link
                  href="/auth/signin"
                  className="px-3.5 py-1.5 rounded-lg border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/signin"
                  className="px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-bold transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                >
                  Deploy Free
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 space-y-28 pb-28">
        {/* Hero Section */}
        <LandingHero activeTheme={asciiTheme} onThemeChange={setAsciiTheme} />

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
            <h2 className="text-3xl font-black text-white tracking-tight">
              Enterprise Cloud Primitives Without the Cloud Tax
            </h2>
            <p className="text-sm text-zinc-400 mt-2">
              Everything required to run mission-critical production services with zero operational overhead.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono text-xs">
            <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-950/80 backdrop-blur-xl">
              <div className="text-2xl mb-3">🌍</div>
              <h3 className="text-sm font-bold text-white mb-1.5">6-POP Edge Network (M5)</h3>
              <p className="text-zinc-400 font-sans leading-relaxed text-xs">
                Active-active deployment across N. Virginia, San Francisco, Frankfurt, London, Singapore, and Sydney. Automated health checks shift traffic in under 500ms on POP degradation.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-950/80 backdrop-blur-xl">
              <div className="text-2xl mb-3">💻</div>
              <h3 className="text-sm font-bold text-white mb-1.5">Developer CLI & Manifest (M6)</h3>
              <p className="text-zinc-400 font-sans leading-relaxed text-xs">
                Declarative `syncbay.json` defines services, databases, volumes, and scaling policies. Deploy directly from git or local terminal with `syncbay up`.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-950/80 backdrop-blur-xl">
              <div className="text-2xl mb-3">📟</div>
              <h3 className="text-sm font-bold text-white mb-1.5">Web Shell & SQL Studio (M7)</h3>
              <p className="text-zinc-400 font-sans leading-relaxed text-xs">
                Interactive VT100 web terminal connecting to running containers. Embedded database query studio with visual schema explorer, explain plans, and safe mode guards.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-950/80 backdrop-blur-xl">
              <div className="text-2xl mb-3">🐘</div>
              <h3 className="text-sm font-bold text-white mb-1.5">Managed Postgres & Redis</h3>
              <p className="text-zinc-400 font-sans leading-relaxed text-xs">
                One-click serverless PostgreSQL, Redis/Valkey, and MySQL instances. Automatically resolved via inter-service environment variables <code>{"${{ Postgres.URL }}"}</code>.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-950/80 backdrop-blur-xl">
              <div className="text-2xl mb-3">🔀</div>
              <h3 className="text-sm font-bold text-white mb-1.5">Blue/Green Auto-Rollbacks</h3>
              <p className="text-zinc-400 font-sans leading-relaxed text-xs">
                Zero-downtime deployment transitions. New releases must pass automated HTTP healthchecks before incoming traffic is shifted. Instant rollback triggers if unhealthy.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-950/80 backdrop-blur-xl">
              <div className="text-2xl mb-3">📦</div>
              <h3 className="text-sm font-bold text-white mb-1.5">Nixpacks Runtime Engine</h3>
              <p className="text-zinc-400 font-sans leading-relaxed text-xs">
                Automatic detection for Node.js, Python, Go, Rust, Ruby, or standard Dockerfile. Generates OCI-compliant container manifests with smart dependency caching.
              </p>
            </div>
          </div>
        </section>

        {/* Call to Action Banner */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="rounded-3xl border border-cyan-500/40 bg-gradient-to-br from-cyan-950/40 via-black to-fuchsia-950/40 p-10 md:p-14 text-center shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-cyan-500/10 via-transparent to-transparent pointer-events-none" />
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-4 font-sans">
              Ready to Own the Cloud?
            </h2>
            <p className="text-sm sm:text-base text-zinc-300 max-w-2xl mx-auto mb-8 leading-relaxed">
              Join thousands of developers migrating from Vercel and Railway to the next-generation edge platform. Deploy your first service in under 30 seconds.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/auth/signin"
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-extrabold text-sm shadow-[0_0_25px_rgba(6,182,212,0.5)] transition-all font-mono"
              >
                Deploy Now (Free Tier Included)
              </Link>
              <a
                href="/api/v1/openapi.json"
                target="_blank"
                rel="noreferrer"
                className="w-full sm:w-auto px-6 py-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white font-bold text-sm transition-colors font-mono"
              >
                Inspect Public API ↗
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 bg-black/90 py-12 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-zinc-500 font-mono">
          <div className="flex flex-col gap-1 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start space-x-2">
              <span className="text-white font-bold">SYNCBAY TECHNOLOGIES INC.</span>
              <span>• San Francisco, CA, USA 🇺🇸</span>
              <span>• MSNS-DEV™</span>
            </div>
            <div className="text-[11px] text-zinc-600">
              100 Montgomery St, Suite 1400, San Francisco, CA 94104 · Incorporated in Delaware, USA · Tier-1 American Cloud Infrastructure
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6">
            <Link href="/pricing" className="text-cyan-400 hover:text-white transition-colors">
              Plans &amp; Pricing
            </Link>
            <Link href="/auth/signin" className="hover:text-zinc-300 transition-colors">
              Console Sign In
            </Link>
            <a href="/api/v1/openapi.json" target="_blank" rel="noreferrer" className="hover:text-zinc-300 transition-colors">
              OpenAPI 3.1
            </a>
            <a href="/api/geo/locate" target="_blank" rel="noreferrer" className="hover:text-zinc-300 transition-colors">
              Geo Telemetry
            </a>
            <span className="text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              All Systems Operational
            </span>
          </div>
        </div>
      </footer>

      {/* SEO Schema.org JSON-LD with Official American Company Location */}
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
