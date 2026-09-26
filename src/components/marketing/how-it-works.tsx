"use client";

import React, { useState } from "react";
import { TiltCard } from "@/components/ui/tilt-card";

interface WorkflowStep {
  step: string;
  badge: string;
  title: string;
  description: string;
  codeTitle: string;
  codeSnippet: string;
  timing: string;
  highlights: string[];
}

const STEPS: WorkflowStep[] = [
  {
    step: "01",
    badge: "Declarative GitOps",
    title: "Connect Repo or Run `syncbay up`",
    description:
      "Push to GitHub or deploy directly from your local terminal with the Syncbay CLI. The platform detects your project structure, reads syncbay.json, and initializes ephemeral build sandboxes.",
    codeTitle: "terminal — local environment",
    codeSnippet: `# 1-line installation and instant deployment
$ npm i -g syncbay
$ syncbay up --project api-edge --env production

✔ Linked GitHub repo: github.com/acme/api-edge
✔ Discovered syncbay.json manifest
✔ Injected database context: PostgreSQL (iad1)`,
    timing: "Immediate (0.2s)",
    highlights: [
      "Native GitHub App with automatic webhook triggers",
      "Declarative syncbay.json manifest for services & databases",
      "Local CLI support for rapid terminal-first deployment",
    ],
  },
  {
    step: "02",
    badge: "Smart Buildpack Engine",
    title: "4-Phase Nixpacks Layered Compilation",
    description:
      "Forget complex multi-stage Dockerfiles. The Nixpacks buildpack engine automatically inspects your repository, installs system libraries, resolves dependencies, and compiles minimal OCI images with zero bloat.",
    codeTitle: "buildpack log stream",
    codeSnippet: `⚡ Nixpacks 4-Phase Build Engine:
[1/4 Setup]   Found package.json -> Node.js 20.12.0
[2/4 Install] Restoring cached node_modules (hit: 98.4%)
[3/4 Build]   Running: npm run build (compiled in 14.2s)
[4/4 Package] Created OCI artifact: sha256:8f3b20...
✔ Layer caching saved 42.6s on build pipeline`,
    timing: "14 – 28s average",
    highlights: [
      "Auto-detects Node.js, Python, Go, Rust, Ruby & Docker",
      "Smart 4-phase caching for lightning fast rebuilds",
      "Isolated ephemeral build containers with zero host contamination",
    ],
  },
  {
    step: "03",
    badge: "Global Edge Mesh",
    title: "Zero-Downtime Rollout Across 6 POPs",
    description:
      "Your compiled application is simultaneously distributed to 6 edge regions worldwide. Automated HTTP health checks ensure 100% availability, rolling back instantly if any probe fails.",
    codeTitle: "edge routing & telemetry",
    codeSnippet: `🌍 Propagating to 6 Global Anycast POPs:
✔ [iad1] N. Virginia   -> Healthy (200 OK, 8ms)
✔ [sfo1] San Francisco -> Healthy (200 OK, 11ms)
✔ [fra1] Frankfurt     -> Healthy (200 OK, 16ms)
✔ [lhr1] London        -> Healthy (200 OK, 14ms)
✔ [sin1] Singapore     -> Healthy (200 OK, 24ms)
✔ [syd1] Sydney        -> Healthy (200 OK, 31ms)
✨ Live at https://api-edge.syncbay.app (Auto-SSL Active)`,
    timing: "Sub-second routing",
    highlights: [
      "Anycast DNS routing requests to the nearest edge point",
      "Automatic Let's Encrypt / Cloudflare SSL certificate provisioning",
      "Blue/Green traffic switching with sub-second automated rollbacks",
    ],
  },
];

export function HowItWorks() {
  const [activeStep, setActiveStep] = useState(0);

  return (
    <section id="workflow" className="relative py-24 sm:py-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase mb-4 shadow-lg"
          style={{
            background: "rgba(124, 58, 237, 0.15)",
            border: "1px solid rgba(124, 58, 237, 0.4)",
            color: "#c084fc",
            boxShadow: "0 0 20px rgba(124, 58, 237, 0.15)",
          }}
        >
          <span>🔄 Workflow Pipeline</span>
        </div>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight mb-4">
          From `git push` to 6 Global POPs in 3 Steps
        </h2>
        <p className="text-base sm:text-lg font-medium leading-relaxed" style={{ color: "#94a3b8" }}>
          No YAML nightmares, no cluster nodes to babysit. Deploy production-ready code with complete observability from commit to edge.
        </p>
      </div>

      {/* Step Selector Pills */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        {STEPS.map((s, idx) => {
          const isSelected = activeStep === idx;
          return (
            <button
              key={s.step}
              onClick={() => setActiveStep(idx)}
              className="p-5 rounded-2xl text-left transition-all duration-300 cursor-pointer flex items-start gap-4"
              style={{
                background: isSelected
                  ? "linear-gradient(135deg, rgba(6, 182, 212, 0.18), rgba(124, 58, 237, 0.15))"
                  : "rgba(15, 15, 31, 0.6)",
                border: isSelected
                  ? "1px solid rgba(6, 182, 212, 0.6)"
                  : "1px solid rgba(255, 255, 255, 0.06)",
                boxShadow: isSelected
                  ? "0 10px 30px rgba(6, 182, 212, 0.2)"
                  : "none",
              }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center font-mono font-black text-base flex-shrink-0"
                style={{
                  background: isSelected
                    ? "linear-gradient(135deg, #06B6D4, #7C3AED)"
                    : "rgba(255, 255, 255, 0.05)",
                  color: isSelected ? "#050510" : "#94a3b8",
                }}
              >
                {s.step}
              </div>
              <div>
                <div className="text-xs font-mono font-bold uppercase mb-1" style={{ color: isSelected ? "#38bdf8" : "#64748b" }}>
                  {s.badge}
                </div>
                <h4 className="text-sm font-black text-white leading-tight">
                  {s.title}
                </h4>
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Step Showcase */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* Left Side: Step Details */}
        <div
          className="lg:col-span-5 p-8 rounded-3xl flex flex-col justify-between"
          style={{
            background: "linear-gradient(135deg, rgba(20, 20, 38, 0.8), rgba(10, 10, 24, 0.9))",
            border: "1px solid rgba(6, 182, 212, 0.25)",
            backdropFilter: "blur(20px)",
          }}
        >
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span
                className="px-3 py-1 rounded-full text-xs font-mono font-bold uppercase"
                style={{ background: "rgba(6, 182, 212, 0.15)", color: "#38bdf8", border: "1px solid rgba(6, 182, 212, 0.3)" }}
              >
                Step {STEPS[activeStep].step} · {STEPS[activeStep].badge}
              </span>
              <span className="text-xs font-mono text-emerald-400 font-bold">
                ⚡ {STEPS[activeStep].timing}
              </span>
            </div>

            <h3 className="text-2xl font-black text-white tracking-tight mb-4">
              {STEPS[activeStep].title}
            </h3>

            <p className="text-sm font-medium leading-relaxed text-slate-300 mb-6">
              {STEPS[activeStep].description}
            </p>

            <div className="space-y-3 pt-4 border-t border-white/10 text-xs font-medium text-slate-300">
              {STEPS[activeStep].highlights.map((h, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <span className="text-cyan-400 font-bold mt-0.5">✔</span>
                  <span>{h}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-white/10 flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400">
              Step {activeStep + 1} of {STEPS.length}
            </span>
            <div className="flex gap-2">
              <button
                disabled={activeStep === 0}
                onClick={() => setActiveStep((prev) => Math.max(0, prev - 1))}
                className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-30 cursor-pointer"
                style={{ border: "1px solid rgba(255, 255, 255, 0.15)", background: "rgba(255,255,255,0.05)" }}
              >
                ← Prev
              </button>
              <button
                disabled={activeStep === STEPS.length - 1}
                onClick={() => setActiveStep((prev) => Math.min(STEPS.length - 1, prev + 1))}
                className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-30 cursor-pointer"
                style={{
                  background: "linear-gradient(135deg, #06B6D4, #3B82F6)",
                  color: "#050510",
                }}
              >
                Next Step →
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Interactive Terminal & Code View */}
        <div className="lg:col-span-7">
          <TiltCard glowColor="rgba(6, 182, 212, 0.35)" intensity={8}>
            <div
              className="rounded-3xl p-6 sm:p-8 h-full flex flex-col justify-between font-mono"
              style={{
                background: "rgba(7, 7, 16, 0.95)",
                border: "1px solid rgba(6, 182, 212, 0.35)",
                boxShadow: "0 25px 60px -15px rgba(0,0,0,0.8), 0 0 35px rgba(6,182,212,0.15)",
              }}
            >
              {/* Window Controls Bar */}
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                  <span className="ml-2 text-xs font-medium text-slate-400">
                    {STEPS[activeStep].codeTitle}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee] animate-pulse" />
                  <span>LIVE CONSOLE</span>
                </div>
              </div>

              {/* Code Pre Block */}
              <div className="overflow-x-auto text-xs sm:text-sm leading-relaxed text-slate-300 py-2">
                <pre style={{ margin: 0 }}>
                  <code>{STEPS[activeStep].codeSnippet}</code>
                </pre>
              </div>

              {/* Terminal Footer Indicator */}
              <div className="pt-4 mt-4 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
                <span>Syncbay Engine v2.4 · Cloud Hyper-Plane</span>
                <span className="text-cyan-400 font-bold">100% Automated</span>
              </div>
            </div>
          </TiltCard>
        </div>
      </div>
    </section>
  );
}
