"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";

const TERMINAL_LOGS = [
  { text: "$ syncbay up --project cloud-edge", color: "#e2e8f0", delay: 0 },
  { text: "⚡ Analyzing repository structure...", color: "#06B6D4", delay: 400 },
  { text: "✔ Detected: Node.js 20 (Next.js 16 App Router)", color: "#22c55e", delay: 900 },
  { text: "✔ Attached Managed Postgres: ${{ Postgres.URL }}", color: "#22c55e", delay: 1400 },
  { text: "🚀 Ephemeral build container active (0ms cold start)", color: "#06B6D4", delay: 1900 },
  { text: "✔ Image pushed: registry.syncbay.edge/cloud-edge:v1", color: "#22c55e", delay: 2400 },
  { text: "🌍 Routing to 6 POPs: [iad1, sfo1, fra1, lhr1, sin1, syd1]", color: "#a78bfa", delay: 2900 },
  { text: "✔ Healthcheck passed (200 OK, 12ms)", color: "#22c55e", delay: 3400 },
  { text: "✨ Live → https://cloud-edge.syncbay.app", color: "#fbbf24", delay: 3900 },
];

const STATS = [
  { label: "Global Edge POPs", value: "6", suffix: "regions" },
  { label: "Cold Start Time", value: "0", suffix: "ms" },
  { label: "Deploy Speed", value: "<30", suffix: "seconds" },
  { label: "Uptime SLA", value: "99.99", suffix: "%" },
];

export function LandingHero() {
  const [copied, setCopied] = useState(false);
  const [visibleLogs, setVisibleLogs] = useState(0);
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timers = TERMINAL_LOGS.map((log, i) =>
      setTimeout(() => setVisibleLogs(i + 1), log.delay + 500)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  const copyCmd = () => {
    navigator.clipboard.writeText("npm i -g syncbay && syncbay up");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="relative z-10 pt-20 sm:pt-28 pb-20 px-4 max-w-7xl mx-auto">
      {/* Badge */}
      <div className="flex justify-center mb-8">
        <div
          className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full text-xs font-semibold tracking-wide"
          style={{
            background: "linear-gradient(135deg, rgba(6,182,212,0.1), rgba(124,58,237,0.1))",
            border: "1px solid rgba(6,182,212,0.2)",
            color: "#67e8f9",
          }}
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
          </span>
          SYNCBAY CLOUD HYPER-PLANE v2.0 — Now Live
        </div>
      </div>

      {/* Headline */}
      <h1
        className="text-center text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[1.05] mb-6"
        style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
      >
        <span className="text-white">Deploy in Seconds.</span>
        <br />
        <span
          style={{
            background: "linear-gradient(135deg, #06B6D4 0%, #7C3AED 40%, #EC4899 70%, #F59E0B 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Scale Without Limits.
        </span>
      </h1>

      {/* Subtitle */}
      <p className="text-center text-base sm:text-lg md:text-xl max-w-3xl mx-auto mb-12 leading-relaxed" style={{ color: "#94a3b8" }}>
        The next-generation PaaS that outperforms Vercel and Railway. Deploy any codebase to 6 global
        edge POPs with zero cold starts, managed PostgreSQL, interactive Web Shell, and built-in SQL Studio.
      </p>

      {/* CTA Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
        <Link
          href="/auth/signin"
          className="group relative w-full sm:w-auto"
        >
          <div
            className="absolute -inset-0.5 rounded-2xl opacity-70 group-hover:opacity-100 transition-opacity duration-300 blur-sm"
            style={{ background: "linear-gradient(135deg, #06B6D4, #7C3AED, #EC4899)" }}
          />
          <div
            className="relative px-8 py-4 rounded-xl font-extrabold text-sm text-center transition-all"
            style={{
              background: "linear-gradient(135deg, #06B6D4, #3B82F6)",
              color: "#000",
            }}
          >
            🚀 Start Deploying Free — 30 Seconds
          </div>
        </Link>

        <div
          className="flex items-center gap-3 px-5 py-3.5 rounded-xl text-xs font-mono"
          style={{
            background: "rgba(15,15,25,0.8)",
            border: "1px solid rgba(255,255,255,0.08)",
            backdropFilter: "blur(12px)",
            color: "#94a3b8",
          }}
        >
          <span style={{ color: "#4b5563" }}>$</span>
          <code style={{ color: "#e2e8f0" }}>npm i -g syncbay && syncbay up</code>
          <button
            type="button"
            onClick={copyCmd}
            className="px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all"
            style={{
              background: "rgba(255,255,255,0.06)",
              color: copied ? "#22c55e" : "#94a3b8",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mb-16">
        {STATS.map((stat) => (
          <div
            key={stat.label}
            className="text-center p-4 rounded-2xl"
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.06)",
              backdropFilter: "blur(8px)",
            }}
          >
            <div className="text-3xl sm:text-4xl font-black" style={{ color: "#06B6D4" }}>
              {stat.value}
              <span className="text-sm font-medium ml-1" style={{ color: "#6b7280" }}>
                {stat.suffix}
              </span>
            </div>
            <div className="text-[11px] font-medium mt-1" style={{ color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* 3D Terminal */}
      <div className="max-w-4xl mx-auto" style={{ perspective: "1200px" }}>
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            transform: "rotateX(4deg)",
            transformStyle: "preserve-3d",
            background: "rgba(8, 8, 18, 0.9)",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 25px 60px -12px rgba(0,0,0,0.8), 0 0 40px rgba(6,182,212,0.08), inset 0 1px 0 rgba(255,255,255,0.05)",
          }}
        >
          {/* Terminal Header */}
          <div
            className="flex items-center justify-between px-5 py-3"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}
          >
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ background: "#ef4444" }} />
              <div className="w-3 h-3 rounded-full" style={{ background: "#f59e0b" }} />
              <div className="w-3 h-3 rounded-full" style={{ background: "#22c55e" }} />
              <span className="ml-3 text-[11px] font-semibold font-mono" style={{ color: "#6b7280" }}>
                syncbay-cli — deployment
              </span>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-mono" style={{ color: "#4b5563" }}>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                6 Edge POPs Online
              </span>
            </div>
          </div>

          {/* Terminal Body */}
          <div ref={terminalRef} className="p-6 font-mono text-[13px] space-y-1.5 min-h-[280px]">
            {TERMINAL_LOGS.slice(0, visibleLogs).map((log, idx) => (
              <div
                key={idx}
                className="leading-relaxed"
                style={{
                  color: log.color,
                  animation: "fadeSlideIn 0.3s ease-out forwards",
                  fontWeight: idx === TERMINAL_LOGS.length - 1 ? 700 : 400,
                }}
              >
                {log.text}
              </div>
            ))}
            {visibleLogs >= TERMINAL_LOGS.length && (
              <div className="flex items-center pt-3" style={{ color: "#4b5563" }}>
                <span
                  className="inline-block w-2 h-5 mr-2"
                  style={{ background: "#06B6D4", animation: "blink 1s step-end infinite" }}
                />
                Ready for production traffic across all POPs...
              </div>
            )}
          </div>
        </div>

        {/* Terminal reflection */}
        <div
          className="h-16 rounded-b-2xl mx-4"
          style={{
            background: "linear-gradient(to bottom, rgba(6,182,212,0.04), transparent)",
            filter: "blur(8px)",
            transform: "scaleY(-0.3) translateY(-20px)",
          }}
        />
      </div>
    </section>
  );
}
