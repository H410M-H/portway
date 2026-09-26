"use client";

import React, { useState } from "react";
import { TiltCard } from "@/components/ui/tilt-card";

const CODE_EXAMPLES = {
  manifest: {
    filename: "syncbay.json",
    language: "json",
    description: "Declarative infrastructure-as-code for microservices, managed databases, persistent volumes, and scaling rules.",
    code: `{
  "$schema": "https://syncbay.app/schema/v1.json",
  "name": "ecommerce-edge",
  "services": [
    {
      "name": "api",
      "runtime": "node20",
      "buildCommand": "pnpm build",
      "startCommand": "node dist/server.js",
      "port": 3000,
      "scaleToZero": false,
      "regions": ["iad1", "sfo1", "fra1", "sin1"],
      "env": {
        "DATABASE_URL": "\${{ databases.main-pg.url }}",
        "REDIS_URL": "\${{ databases.cache-redis.url }}",
        "BUCKET_NAME": "\${{ buckets.media-uploads.name }}"
      }
    }
  ],
  "databases": [
    {
      "name": "main-pg",
      "provider": "POSTGRES",
      "version": "16",
      "pooling": true
    },
    {
      "name": "cache-redis",
      "provider": "REDIS",
      "eviction": "allkeys-lru"
    }
  ]
}`,
  },
  cli: {
    filename: "terminal — syncbay cli",
    language: "bash",
    description: "High-speed developer CLI to provision resources, stream live logs, launch interactive web shells, and manage deployments.",
    code: `# Install Syncbay CLI globally
$ npm install -g syncbay

# Log in with your developer token or GitHub account
$ syncbay login

# Validate local manifest and initialize workspace
$ syncbay validate

# Deploy current directory straight to 6 global edge POPs
$ syncbay up --env production

# Stream live real-time logs across all active edge containers
$ syncbay logs -f --service api

# SSH into running container with an interactive VT100 shell
$ syncbay shell --service api --region iad1`,
  },
  env: {
    filename: ".env.production (auto-injected)",
    language: "env",
    description: "Inter-service variable resolution. Database credentials and bucket endpoints are encrypted and injected at runtime.",
    code: `# Auto-injected at container startup via secure enclave
DATABASE_URL="postgres://syncbay_usr:x89aF2...p@pg-iad1.syncbay.internal:5432/main?sslmode=require"
REDIS_URL="rediss://default:m92Kx0...q@redis-sfo1.syncbay.internal:6379"

# S3-compatible zero-egress bucket credentials
S3_ENDPOINT="https://storage.syncbay.edge"
S3_BUCKET="media-uploads"
S3_REGION="auto"

# Global Edge Mesh Environment
SYNCBAY_POP_ID="iad1"
SYNCBAY_DEPLOYMENT_ID="dep_8192a8b940"
PORT="3000"`,
  },
};

export function CliManifestShowcase() {
  const [activeTab, setActiveTab] = useState<"manifest" | "cli" | "env">("manifest");
  const [copied, setCopied] = useState(false);

  const activeExample = CODE_EXAMPLES[activeTab];

  const handleCopy = () => {
    navigator.clipboard.writeText(activeExample.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="cli-manifest" className="relative py-24 sm:py-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase mb-4 shadow-lg"
          style={{
            background: "rgba(6, 182, 212, 0.12)",
            border: "1px solid rgba(6, 182, 212, 0.35)",
            color: "#38bdf8",
            boxShadow: "0 0 20px rgba(6, 182, 212, 0.15)",
          }}
        >
          <span>💻 Developer-First Experience</span>
        </div>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight mb-4">
          Declarative by Design. Terminal Native.
        </h2>
        <p className="text-base sm:text-lg font-medium leading-relaxed" style={{ color: "#94a3b8" }}>
          Everything you love about GitOps: describe your multi-container topology in `syncbay.json` and deploy with a single terminal command.
        </p>
      </div>

      {/* Code Showcase Window with Tabs */}
      <TiltCard glowColor="rgba(6, 182, 212, 0.3)" intensity={6}>
        <div
          className="rounded-3xl p-6 sm:p-10 font-mono relative overflow-hidden"
          style={{
            background: "rgba(8, 8, 18, 0.95)",
            border: "1px solid rgba(6, 182, 212, 0.35)",
            boxShadow: "0 30px 80px -20px rgba(0,0,0,0.9), 0 0 40px rgba(6,182,212,0.15)",
          }}
        >
          {/* Top Bar with Tabs and Copy Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-6 border-b border-white/10">
            {/* Tab Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setActiveTab("manifest")}
                className="px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2"
                style={{
                  background: activeTab === "manifest" ? "rgba(6, 182, 212, 0.2)" : "rgba(255, 255, 255, 0.04)",
                  color: activeTab === "manifest" ? "#38bdf8" : "#94a3b8",
                  border: activeTab === "manifest" ? "1px solid rgba(6, 182, 212, 0.5)" : "1px solid transparent",
                }}
              >
                <span>📄</span>
                <span>syncbay.json</span>
              </button>
              <button
                onClick={() => setActiveTab("cli")}
                className="px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2"
                style={{
                  background: activeTab === "cli" ? "rgba(124, 58, 237, 0.2)" : "rgba(255, 255, 255, 0.04)",
                  color: activeTab === "cli" ? "#c084fc" : "#94a3b8",
                  border: activeTab === "cli" ? "1px solid rgba(124, 58, 237, 0.5)" : "1px solid transparent",
                }}
              >
                <span>⚡</span>
                <span>syncbay CLI</span>
              </button>
              <button
                onClick={() => setActiveTab("env")}
                className="px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2"
                style={{
                  background: activeTab === "env" ? "rgba(16, 185, 129, 0.2)" : "rgba(255, 255, 255, 0.04)",
                  color: activeTab === "env" ? "#34d399" : "#94a3b8",
                  border: activeTab === "env" ? "1px solid rgba(16, 185, 129, 0.5)" : "1px solid transparent",
                }}
              >
                <span>🔐</span>
                <span>Secret References</span>
              </button>
            </div>

            {/* Copy Button */}
            <button
              onClick={handleCopy}
              className="px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-2 self-start sm:self-auto"
              style={{
                background: "rgba(255, 255, 255, 0.06)",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                color: copied ? "#4ade80" : "#f1f5f9",
              }}
            >
              <span>{copied ? "✔" : "📋"}</span>
              <span>{copied ? "Copied to Clipboard!" : "Copy Code"}</span>
            </button>
          </div>

          {/* Description of active tab */}
          <p className="text-xs text-slate-400 font-sans font-medium mb-4">
            {activeExample.description}
          </p>

          {/* Code Viewer */}
          <div
            className="p-5 rounded-2xl overflow-x-auto text-xs sm:text-sm leading-relaxed"
            style={{
              background: "rgba(4, 4, 10, 0.8)",
              border: "1px solid rgba(255, 255, 255, 0.05)",
              color: "#e2e8f0",
            }}
          >
            <pre style={{ margin: 0 }}>
              <code>{activeExample.code}</code>
            </pre>
          </div>

          {/* Footer Highlights */}
          <div className="mt-6 pt-4 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-slate-400 font-sans">
            <div className="flex flex-wrap items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="text-cyan-400">✔</span> Zero lock-in
              </span>
              <span className="flex items-center gap-1.5">
                <span className="text-cyan-400">✔</span> OCI compliant
              </span>
              <span className="flex items-center gap-1.5">
                <span className="text-cyan-400">✔</span> JSON schema validated
              </span>
            </div>
            <span className="font-mono text-cyan-400 font-bold">syncbay-spec v1.4</span>
          </div>
        </div>
      </TiltCard>
    </section>
  );
}
