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
  glowColor: string;
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
    gradient: "linear-gradient(135deg, rgba(6,182,212,0.18), rgba(59,130,246,0.12))",
    glowColor: "rgba(6,182,212,0.3)",
  },
  {
    id: "fastapi-redis",
    title: "Python FastAPI & Redis",
    description: "Async Python REST API with Pydantic v2, JWT authentication, and high-speed Redis caching.",
    runtime: "Python 3.11",
    icon: "⚡",
    stars: "9.8k",
    tags: ["FastAPI", "Redis", "Pydantic", "Uvicorn"],
    gradient: "linear-gradient(135deg, rgba(124,58,237,0.18), rgba(236,72,153,0.12))",
    glowColor: "rgba(124,58,237,0.3)",
  },
  {
    id: "go-fiber",
    title: "Go Fiber Microservice",
    description: "Ultra-fast Golang HTTP framework with sub-millisecond response times and low memory footprint.",
    runtime: "Go 1.22",
    icon: "🐹",
    stars: "7.4k",
    tags: ["Go", "Fiber", "Microservices", "Docker"],
    gradient: "linear-gradient(135deg, rgba(34,197,94,0.18), rgba(6,182,212,0.12))",
    glowColor: "rgba(34,197,94,0.3)",
  },
  {
    id: "rust-axum",
    title: "Rust Axum Edge Worker",
    description: "Memory-safe, high-concurrency API server built on Tokio, Tower, and Hyper with zero GC.",
    runtime: "Rust 1.78",
    icon: "🦀",
    stars: "6.1k",
    tags: ["Rust", "Axum", "Tokio", "High-Perf"],
    gradient: "linear-gradient(135deg, rgba(245,158,11,0.18), rgba(239,68,68,0.12))",
    glowColor: "rgba(245,158,11,0.3)",
  },
  {
    id: "node-express-ws",
    title: "Node.js & WebSockets",
    description: "Real-time pub/sub architecture with Socket.io, cluster support, and Redis backplane.",
    runtime: "Node.js 20",
    icon: "🔌",
    stars: "8.3k",
    tags: ["Express", "Socket.io", "Redis", "Real-Time"],
    gradient: "linear-gradient(135deg, rgba(6,182,212,0.18), rgba(16,185,129,0.12))",
    glowColor: "rgba(6,182,212,0.3)",
  },
  {
    id: "django-celery",
    title: "Django 5 & Celery Workers",
    description: "Full-stack Python batteries-included framework with async background workers and PostgreSQL.",
    runtime: "Python 3.12",
    icon: "🦄",
    stars: "11.5k",
    tags: ["Django", "Celery", "Postgres", "Redis"],
    gradient: "linear-gradient(135deg, rgba(59,130,246,0.18), rgba(124,58,237,0.12))",
    glowColor: "rgba(59,130,246,0.3)",
  },
];

export function TemplatesCatalog() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto">
        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase mb-3"
          style={{
            background: "rgba(124, 58, 237, 0.15)",
            border: "1px solid rgba(124, 58, 237, 0.4)",
            color: "#c084fc",
          }}
        >
          ⚡ Instant Architecture
        </div>
        <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-3">
          1-Click Production Templates
        </h2>
        <p className="text-sm font-medium" style={{ color: "#94a3b8" }}>
          Production-grade starter kits with database, caching, and CI/CD pre-configured.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {TEMPLATES.map((tpl) => (
          <TiltCard key={tpl.id} glowColor={tpl.glowColor} intensity={14}>
            <div
              className="p-6 rounded-2xl h-full flex flex-col justify-between"
              style={{
                background: tpl.gradient,
              }}
            >
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold shadow-lg"
                    style={{
                      background: "rgba(18, 18, 28, 0.9)",
                      border: "1px solid rgba(255, 255, 255, 0.2)",
                    }}
                  >
                    {tpl.icon}
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="px-2.5 py-1 rounded-md text-[11px] font-mono font-bold"
                      style={{
                        background: "rgba(0,0,0,0.5)",
                        border: "1px solid rgba(255, 255, 255, 0.15)",
                        color: "#38bdf8",
                      }}
                    >
                      {tpl.runtime}
                    </span>
                    <span
                      className="text-xs font-semibold flex items-center gap-1"
                      style={{ color: "#facc15" }}
                    >
                      ★ {tpl.stars}
                    </span>
                  </div>
                </div>

                <h3 className="text-base font-extrabold text-white mb-2 tracking-tight">
                  {tpl.title}
                </h3>
                <p className="text-xs font-medium leading-relaxed mb-4 text-slate-300">
                  {tpl.description}
                </p>

                <div className="flex flex-wrap gap-1.5 mb-6">
                  {tpl.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2.5 py-1 rounded-md text-[10px] font-medium"
                      style={{
                        background: "rgba(255,255,255,0.08)",
                        border: "1px solid rgba(255,255,255,0.12)",
                        color: "#e2e8f0",
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <Link
                href="/dashboard/projects/new"
                className="w-full block py-2.5 rounded-xl text-center text-xs font-bold transition-all duration-200 hover:scale-[1.02]"
                style={{
                  background: "linear-gradient(135deg, rgba(6,182,212,0.9), rgba(59,130,246,0.9))",
                  color: "#050510",
                  boxShadow: "0 4px 15px rgba(6,182,212,0.3)",
                }}
              >
                Deploy Template →
              </Link>
            </div>
          </TiltCard>
        ))}
      </div>
    </div>
  );
}
