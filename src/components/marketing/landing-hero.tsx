"use client";

import React, { useState } from "react";
import Link from "next/link";

interface LandingHeroProps {
  onThemeChange?: (theme: "cyber" | "matrix" | "synthwave" | "aurora") => void;
  activeTheme?: "cyber" | "matrix" | "synthwave" | "aurora";
}

const TERMINAL_LOGS = [
  { text: "$ syncbay up --project cloud-edge", color: "text-zinc-300", delay: 0 },
  { text: "⚡ [syncbay] Analyzing repository structure...", color: "text-cyan-400", delay: 300 },
  { text: "✔ [nixpacks] Detected runtime: Node.js 20 (Next.js 16 App Router)", color: "text-emerald-400", delay: 700 },
  { text: "✔ [database] Attached Managed Postgres: ${{ Postgres.URL }}", color: "text-emerald-400", delay: 1100 },
  { text: "🚀 [build] Ephemeral build container active (0 cold start)", color: "text-cyan-300", delay: 1500 },
  { text: "✔ [build] Container image pushed: registry.syncbay.edge/cloud-edge:v1", color: "text-emerald-400", delay: 2000 },
  { text: "🌍 [deploy] Routing to 6 Edge POPs: [iad1, sfo1, fra1, lhr1, sin1, syd1]", color: "text-purple-400", delay: 2400 },
  { text: "✔ [healthcheck] HTTP /health passed (200 OK, 12ms)", color: "text-emerald-400", delay: 2800 },
  { text: "✨ [active] Live at https://cloud-edge.syncbay.app", color: "text-yellow-300 font-bold", delay: 3200 },
];

export function LandingHero({ onThemeChange, activeTheme = "cyber" }: LandingHeroProps) {
  const [copied, setCopied] = useState(false);

  const copyCliCommand = () => {
    navigator.clipboard.writeText("npm i -g syncbay && syncbay up");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="relative z-10 pt-16 pb-20 px-4 max-w-7xl mx-auto flex flex-col items-center text-center">
      {/* Top Banner Tag & ASCII Theme Switcher */}
      <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-950/40 backdrop-blur-md text-cyan-300 text-xs font-mono font-semibold">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          SYNCBAY CLOUD HYPER-PLANE v2.0
        </div>

        {onThemeChange && (
          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-zinc-800 bg-black/60 backdrop-blur-md text-[11px] font-mono text-zinc-400">
            <span className="text-zinc-500 mr-1">ASCII Glow:</span>
            {(["cyber", "matrix", "synthwave", "aurora"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => onThemeChange(t)}
                className={`px-2 py-0.5 rounded capitalize transition-all ${
                  activeTheme === t
                    ? "bg-zinc-800 text-white font-bold"
                    : "hover:text-zinc-200"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Headline */}
      <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-white max-w-5xl leading-[1.08] mb-6 font-sans">
        Deploy in Seconds. <br />
        <span className="bg-gradient-to-r from-cyan-400 via-fuchsia-400 to-amber-300 bg-clip-text text-transparent">
          The Edge Cloud Hyper-Plane.
        </span>
      </h1>

      {/* Subtitle */}
      <p className="text-base sm:text-lg md:text-xl text-zinc-400 max-w-3xl leading-relaxed mb-10">
        Syncbay is the developer PaaS designed to dethrone Vercel and Railway. Deploy any Dockerfile or Nixpacks codebase to 6 global edge POPs with zero cold starts, attached managed PostgreSQL, interactive Web Shell, and built-in SQL Query Studio.
      </p>

      {/* Primary Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center gap-4 mb-12 w-full sm:w-auto">
        <Link
          href="/auth/signin"
          className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-extrabold text-sm shadow-[0_0_30px_rgba(6,182,212,0.4)] transition-all transform hover:-translate-y-0.5"
        >
          🚀 Launch Project in 30s (Free)
        </Link>

        <div className="flex items-center bg-black/80 border border-zinc-800 rounded-xl px-4 py-3 text-xs font-mono text-zinc-300 shadow-xl">
          <span className="text-zinc-500 mr-2">$</span>
          <code>npm i -g syncbay && syncbay up</code>
          <button
            type="button"
            onClick={copyCliCommand}
            className="ml-3 px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded text-[11px] font-semibold transition-colors"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>

      {/* Interactive Live Simulated Terminal */}
      <div className="w-full max-w-3xl rounded-2xl border border-zinc-800 bg-black/90 backdrop-blur-2xl shadow-2xl overflow-hidden text-left font-mono text-xs">
        {/* Terminal Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-zinc-900/80 border-b border-zinc-800">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <div className="w-3 h-3 rounded-full bg-green-500/80" />
            <span className="ml-2 text-zinc-400 font-semibold text-[11px]">
              syncbay-cli — fast-edge-deploy
            </span>
          </div>
          <span className="text-[10px] text-zinc-500">6 Global Edge POPs Active</span>
        </div>

        {/* Terminal Output */}
        <div className="p-5 space-y-2 select-text">
          {TERMINAL_LOGS.map((log, idx) => (
            <div key={idx} className={`leading-relaxed ${log.color}`}>
              {log.text}
            </div>
          ))}
          <div className="flex items-center text-zinc-500 pt-2">
            <span className="inline-block w-2 h-4 bg-cyan-400 animate-pulse mr-2" />
            <span>Ready for incoming production traffic across all POPs...</span>
          </div>
        </div>
      </div>
    </section>
  );
}
