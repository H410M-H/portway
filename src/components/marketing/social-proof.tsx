"use client";

import React from "react";
import { TiltCard } from "@/components/ui/tilt-card";

interface Testimonial {
  quote: string;
  name: string;
  role: string;
  company: string;
  avatar: string;
  highlight: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      "We cut our cloud bill by 65% while dropping international API latency from 180ms down to 24ms. Having attached PostgreSQL and Redis with zero connection configuration was a breath of fresh air.",
    name: "Alex Thorne",
    role: "Chief Technology Officer",
    company: "Loomis Pay",
    avatar: "👨‍💻",
    highlight: "-65% Cloud Spend · 24ms Global",
  },
  {
    quote:
      "Syncbay replaced our entire staging and preview pipeline. Ephemeral PR previews spin up in under 30 seconds with isolated databases, and our engineers love having the in-browser VT100 shell.",
    name: "Sarah Chen",
    role: "VP of Engineering",
    company: "Hyperion AI",
    avatar: "👩‍💻",
    highlight: "<30s Ephemeral Previews",
  },
  {
    quote:
      "Blue/green deployments with automatic sub-second health rollbacks saved us on two critical Friday afternoon deployments. The platform detects HTTP 500 spikes and reverts traffic before users notice.",
    name: "Marcus Brody",
    role: "Lead DevOps Architect",
    company: "Kinetix Cloud",
    avatar: "🚀",
    highlight: "Zero-Downtime Blue/Green",
  },
  {
    quote:
      "The Nixpacks engine is magical. We pushed a complex polyglot repo with Python FastAPI backend and Next.js frontend, and Syncbay just built and scaled both containers without a single Dockerfile error.",
    name: "Elena Rostova",
    role: "Founding Engineer",
    company: "Pulse Analytics",
    avatar: "⚡",
    highlight: "Zero-Dockerfile Nixpacks",
  },
];

const METRICS = [
  { value: "99.99%", label: "Uptime SLA", desc: "Contractually backed multi-region mesh" },
  { value: "0 ms", label: "Cold Start Time", desc: "Persistent active-active edge containers" },
  { value: "<30 sec", label: "Average Deploy", desc: "4-phase cached Nixpacks compilation" },
  { value: "6 POPs", label: "Anycast Mesh", desc: "US, Europe, Asia-Pacific coverage" },
];

export function SocialProof() {
  return (
    <section id="testimonials" className="relative py-24 sm:py-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Platform Scale Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20">
        {METRICS.map((metric) => (
          <div
            key={metric.label}
            className="p-6 rounded-2xl text-center"
            style={{
              background: "rgba(15, 15, 30, 0.6)",
              border: "1px solid rgba(6, 182, 212, 0.25)",
              boxShadow: "0 10px 30px -10px rgba(0,0,0,0.5)",
            }}
          >
            <div className="text-3xl sm:text-4xl font-black font-mono tracking-tight mb-2 text-white">
              <span
                style={{
                  background: "linear-gradient(135deg, #06B6D4, #3B82F6)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                {metric.value}
              </span>
            </div>
            <div className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider mb-1">
              {metric.label}
            </div>
            <div className="text-xs text-slate-400 font-medium">
              {metric.desc}
            </div>
          </div>
        ))}
      </div>

      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase mb-4 shadow-lg"
          style={{
            background: "rgba(236, 72, 153, 0.12)",
            border: "1px solid rgba(236, 72, 153, 0.35)",
            color: "#f472b6",
            boxShadow: "0 0 20px rgba(236, 72, 153, 0.15)",
          }}
        >
          <span>💬 Engineer Stories</span>
        </div>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight mb-4">
          Trusted by Developers Who Refuse Cloud Lock-In
        </h2>
        <p className="text-base sm:text-lg font-medium leading-relaxed" style={{ color: "#94a3b8" }}>
          See why fast-growing software companies and indie founders are switching from legacy platforms to Syncbay.
        </p>
      </div>

      {/* Testimonials Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {TESTIMONIALS.map((t) => (
          <TiltCard key={t.name} glowColor="rgba(6, 182, 212, 0.25)" intensity={8}>
            <div
              className="p-8 rounded-3xl h-full flex flex-col justify-between"
              style={{
                background: "linear-gradient(135deg, rgba(16, 16, 32, 0.9), rgba(8, 8, 20, 0.95))",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                boxShadow: "0 20px 40px -15px rgba(0,0,0,0.8)",
              }}
            >
              <div>
                {/* Highlight Badge */}
                <div className="inline-block px-3 py-1 rounded-full text-xs font-mono font-bold text-cyan-400 bg-cyan-950/40 border border-cyan-800/40 mb-4">
                  ★ {t.highlight}
                </div>

                <p className="text-sm sm:text-base font-medium leading-relaxed text-slate-200 mb-8 italic">
                  &ldquo;{t.quote}&rdquo;
                </p>
              </div>

              {/* Author Info */}
              <div className="pt-4 border-t border-white/10 flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl bg-white/5 border border-white/10">
                  {t.avatar}
                </div>
                <div>
                  <h4 className="text-sm font-black text-white leading-tight">
                    {t.name}
                  </h4>
                  <p className="text-xs text-slate-400 font-medium">
                    {t.role} · <span className="text-cyan-400 font-semibold">{t.company}</span>
                  </p>
                </div>
              </div>
            </div>
          </TiltCard>
        ))}
      </div>
    </section>
  );
}
