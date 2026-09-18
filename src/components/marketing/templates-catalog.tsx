"use client";

import React from "react";
import Link from "next/link";

interface Template {
  id: string;
  title: string;
  description: string;
  runtime: string;
  icon: string;
  stars: string;
  tags: string[];
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
  },
  {
    id: "fastapi-redis",
    title: "Python FastAPI & Redis",
    description: "Async Python REST API with Pydantic v2, JWT authentication, and high-speed Redis caching.",
    runtime: "Python 3.11",
    icon: "⚡",
    stars: "9.8k",
    tags: ["FastAPI", "Redis", "Pydantic", "Uvicorn"],
  },
  {
    id: "go-fiber",
    title: "Go Fiber Microservice",
    description: "Ultra-fast Golang HTTP framework with sub-millisecond response times and low memory footprint.",
    runtime: "Go 1.22",
    icon: "🐹",
    stars: "7.4k",
    tags: ["Go", "Fiber", "Microservices", "Docker"],
  },
  {
    id: "rust-axum",
    title: "Rust Axum Edge Worker",
    description: "Memory-safe, high-concurrency API server built on Tokio, Tower, and Hyper with zero garbage collection.",
    runtime: "Rust 1.78",
    icon: "🦀",
    stars: "6.1k",
    tags: ["Rust", "Axum", "Tokio", "High-Perf"],
  },
  {
    id: "node-express-ws",
    title: "Express & WebSocket Server",
    description: "Real-time bi-directional streaming server with Socket.io / WS and connection pooling.",
    runtime: "Node.js 20",
    icon: "🟢",
    stars: "5.3k",
    tags: ["Express", "WebSocket", "Realtime", "API"],
  },
  {
    id: "rails-postgres",
    title: "Ruby on Rails 8",
    description: "Modern Rails full-stack app with Hotwire Turbo, Propshaft, and background job queuing.",
    runtime: "Ruby 3.3",
    icon: "💎",
    stars: "4.9k",
    tags: ["Rails 8", "Postgres", "Sidekiq", "Hotwire"],
  },
];

export function TemplatesCatalog() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-white tracking-tight">
            1-Click Deploy Starter Templates
          </h3>
          <p className="text-xs text-zinc-400 mt-1">
            Jumpstart your next project with pre-configured Dockerfile, Nixpacks plans, and attached databases.
          </p>
        </div>

        <Link
          href="/dashboard"
          className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold font-mono flex items-center gap-1 self-start md:self-auto"
        >
          View all 48 templates →
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {TEMPLATES.map((tpl) => (
          <div
            key={tpl.id}
            className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-5 hover:border-zinc-700 hover:bg-zinc-900/40 transition-all flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-lg">
                  {tpl.icon}
                </div>
                <span className="text-[10px] text-zinc-500 font-mono">
                  ⭐ {tpl.stars}
                </span>
              </div>

              <h4 className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors mb-1.5">
                {tpl.title}
              </h4>
              <p className="text-xs text-zinc-400 leading-relaxed mb-4">
                {tpl.description}
              </p>
            </div>

            <div>
              <div className="flex flex-wrap gap-1.5 mb-4">
                {tpl.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] px-2 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800 font-mono"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <Link
                href={`/auth/signin?template=${tpl.id}`}
                className="w-full py-2 px-3 rounded-lg bg-zinc-900 hover:bg-cyan-500 hover:text-black border border-zinc-700 hover:border-cyan-400 text-zinc-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
              >
                <span>Deploy Template</span>
                <span>→</span>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
