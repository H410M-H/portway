"use client";

import React from "react";
import Link from "next/link";
import { TiltCard } from "@/components/ui/tilt-card";

interface Template {
  id: string;
  title: string;
  description: string;
  runtime: string;
  icon: string;
  stars: string;
  tags: string[];
  gradient: string;
}

const TEMPLATES: Template[] = [
  {
    id: "nextjs-postgres",
    title: "Next.js 16 & PostgreSQL",
    description: "App Router, Server Actions, Tailwind CSS, Prisma ORM, and attached serverless Postgres.",
    runtime: "Node.js 20",
    icon: "▲",
    stars: "14.2k",
    tags: ["React 19", "Prisma", "Postgres", "Tailwind"],
    gradient: "linear-gradient(135deg, rgba(6,182,212,0.12), rgba(59,130,246,0.08))",
  },
  {
    id: "fastapi-redis",
    title: "Python FastAPI & Redis",
    description: "Async Python REST API with Pydantic v2, JWT authentication, and high-speed Redis caching.",
    runtime: "Python 3.11",
    icon: "⚡",
    stars: "9.8k",
    tags: ["FastAPI", "Redis", "Pydantic", "Uvicorn"],
    gradient: "linear-gradient(135deg, rgba(124,58,237,0.12), rgba(236,72,153,0.08))",
  },
  {
    id: "go-fiber",
    title: "Go Fiber Microservice",
    description: "Ultra-fast Golang HTTP framework with sub-millisecond response times and low memory footprint.",
    runtime: "Go 1.22",
    icon: "🐹",
    stars: "7.4k",
    tags: ["Go", "Fiber", "Microservices", "Docker"],
    gradient: "linear-gradient(135deg, rgba(34,197,94,0.12), rgba(6,182,212,0.08))",
  },
  {
    id: "rust-axum",
    title: "Rust Axum Edge Worker",
    description: "Memory-safe, high-concurrency API server built on Tokio, Tower, and Hyper with zero GC.",
    runtime: "Rust 1.78",
    icon: "🦀",
    stars: "6.1k",
    tags: ["Rust", "Axum", "Tokio", "High-Perf"],
    gradient: "linear-gradient(135deg, rgba(245,158,11,0.12), rgba(239,68,68,0.08))",
  },
  {
    id: "node-express-ws",
    title: "Express & WebSocket Server",
    description: "Real-time bi-directional streaming server with Socket.io / WS and connection pooling.",
    runtime: "Node.js 20",
    icon: "🟢",
    stars: "5.3k",
    tags: ["Express", "WebSocket", "Realtime", "API"],
    gradient: "linear-gradient(135deg, rgba(34,197,94,0.12), rgba(52,211,153,0.08))",
  },
  {
    id: "rails-postgres",
    title: "Ruby on Rails 8",
    description: "Modern Rails full-stack app with Hotwire Turbo, Propshaft, and background job queuing.",
    runtime: "Ruby 3.3",
    icon: "💎",
    stars: "4.9k",
    tags: ["Rails 8", "Postgres", "Sidekiq", "Hotwire"],
    gradient: "linear-gradient(135deg, rgba(239,68,68,0.12), rgba(236,72,153,0.08))",
  },
];

export function TemplatesCatalog() {
  return (
    <div className="space-y-8">
      {/* Section Header */}
      <div className="text-center max-w-2xl mx-auto">
        <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-3">
          One-Click Deploy Templates
        </h2>
        <p className="text-sm" style={{ color: "#6b7280" }}>
          Pre-configured starter kits with Dockerfile, Nixpacks, and databases ready to launch.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {TEMPLATES.map((tpl) => (
          <TiltCard
            key={tpl.id}
            glowColor={tpl.gradient.includes("cyan") ? "rgba(6,182,212,0.12)" : "rgba(124,58,237,0.12)"}
            intensity={12}
          >
            <div
              className="h-full p-5 rounded-xl flex flex-col justify-between group"
              style={{
                background: tpl.gradient,
                border: "1px solid rgba(255,255,255,0.06)",
                backdropFilter: "blur(8px)",
              }}
            >
              <div>
                {/* Icon + Stars */}
                <div className="flex items-center justify-between mb-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    {tpl.icon}
                  </div>
                  <span className="text-[10px] font-mono" style={{ color: "#6b7280" }}>
                    ⭐ {tpl.stars}
                  </span>
                </div>

                {/* Title + Description */}
                <h4
                  className="text-sm font-bold mb-1.5 transition-colors"
                  style={{ color: "#f1f5f9" }}
                >
                  {tpl.title}
                </h4>
                <p className="text-xs leading-relaxed mb-4" style={{ color: "#94a3b8" }}>
                  {tpl.description}
                </p>
              </div>

              <div>
                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {tpl.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] px-2 py-0.5 rounded-md font-mono"
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.06)",
                        color: "#94a3b8",
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Deploy Button */}
                <Link
                  href={`/auth/signin?template=${tpl.id}`}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "#e2e8f0",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "rgba(6,182,212,0.2)";
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(6,182,212,0.4)";
                    (e.currentTarget as HTMLElement).style.color = "#06B6D4";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)";
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.08)";
                    (e.currentTarget as HTMLElement).style.color = "#e2e8f0";
                  }}
                >
                  <span>Deploy Template</span>
                  <span>→</span>
                </Link>
              </div>
            </div>
          </TiltCard>
        ))}
      </div>

      {/* View All Link */}
      <div className="text-center">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-xs font-mono font-semibold transition-colors"
          style={{ color: "#06B6D4" }}
        >
          Browse all 48 templates →
        </Link>
      </div>
    </div>
  );
}
