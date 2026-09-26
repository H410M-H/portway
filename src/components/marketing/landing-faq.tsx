"use client";

import React, { useState } from "react";

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const FAQS: FAQItem[] = [
  {
    category: "Architecture",
    question: "How does Syncbay compare to Vercel and Railway?",
    answer:
      "Unlike Vercel (which is constrained to serverless Lambda functions with cold starts and aggressive timeout limits) and Railway (which isolates each service to a single cloud region), Syncbay deploys full OCI containers simultaneously across 6 global edge POPs with 0ms cold starts, attached serverless PostgreSQL, an in-browser VT100 web terminal shell, and an embedded SQL query studio.",
  },
  {
    category: "Builds & Runtimes",
    question: "Do I need to write a Dockerfile to deploy?",
    answer:
      "No! While custom Dockerfiles are fully supported, Syncbay incorporates the Nixpacks buildpack engine. It automatically detects your codebase (Node.js, Python, Go, Rust, Ruby, PHP, and more), identifies package managers, installs required system packages, and compiles optimized OCI images with smart 4-phase caching in seconds.",
  },
  {
    category: "Databases",
    question: "How do managed PostgreSQL and Redis work?",
    answer:
      "You can provision managed databases in 1 click. Syncbay provisions serverless PostgreSQL instances with integrated connection pooling (pgbouncer) and high-throughput Redis/Valkey caches. Connection strings are automatically encrypted and injected into your services as ${{ databases.main-pg.url }} environment variables, with no manual copy-pasting.",
  },
  {
    category: "Storage & Bandwidth",
    question: "Are there bandwidth egress fees for Object Storage?",
    answer:
      "Zero! Unlike AWS S3 and GCP Cloud Storage which charge punitive egress transfer fees of $0.09/GB, Syncbay Object Storage offers a strict $0 egress policy. You get full S3 API compatibility, presigned upload/download URLs, and global CDN caching with predictable, fair storage pricing.",
  },
  {
    category: "Production Reliability",
    question: "How does blue/green deployment and automated rollback work?",
    answer:
      "When a new build completes, Syncbay launches the new container revision alongside your active deployment and runs automated HTTP health probes. Traffic is smoothly shifted only after health probes return 200 OK. If any probe fails or error rates exceed thresholds within the warmup window, traffic is instantly reverted in under 500ms without dropping a single active connection.",
  },
  {
    category: "Domains & Networking",
    question: "Can I bring my own custom domains and wildcard subdomains?",
    answer:
      "Yes. Syncbay provides automatic wildcard subdomains (*.syncbay.app) for instant sharing and testing, and full support for apex domains (example.com), subdomains (api.example.com), and wildcards (*.example.com). TLS/SSL certificates are provisioned and renewed automatically via Cloudflare and Let's Encrypt at zero additional charge.",
  },
];

export function LandingFaq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section id="faq" className="relative py-24 sm:py-32 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
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
          <span>💡 Answers & Details</span>
        </div>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight mb-4">
          Frequently Asked Questions
        </h2>
        <p className="text-base sm:text-lg font-medium leading-relaxed" style={{ color: "#94a3b8" }}>
          Everything you need to know about migrating, deploying, and scaling on Syncbay.
        </p>
      </div>

      {/* Accordion List */}
      <div className="space-y-4">
        {FAQS.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={faq.question}
              className="rounded-2xl transition-all duration-200 overflow-hidden"
              style={{
                background: isOpen ? "rgba(18, 18, 36, 0.85)" : "rgba(12, 12, 24, 0.6)",
                border: isOpen ? "1px solid rgba(6, 182, 212, 0.4)" : "1px solid rgba(255, 255, 255, 0.06)",
                boxShadow: isOpen ? "0 10px 30px rgba(6, 182, 212, 0.15)" : "none",
              }}
            >
              <button
                onClick={() => toggle(idx)}
                className="w-full p-6 text-left flex items-center justify-between gap-4 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-mono font-bold"
                    style={{
                      background: isOpen ? "rgba(6, 182, 212, 0.2)" : "rgba(255, 255, 255, 0.05)",
                      color: isOpen ? "#38bdf8" : "#94a3b8",
                      border: isOpen ? "1px solid rgba(6, 182, 212, 0.3)" : "none",
                    }}
                  >
                    Q{idx + 1}
                  </span>
                  <span className="text-base sm:text-lg font-bold text-white tracking-tight">
                    {faq.question}
                  </span>
                </div>
                <span
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-mono font-bold transition-transform duration-200 flex-shrink-0"
                  style={{
                    background: isOpen ? "rgba(6, 182, 212, 0.2)" : "rgba(255, 255, 255, 0.05)",
                    color: isOpen ? "#38bdf8" : "#94a3b8",
                    transform: isOpen ? "rotate(45deg)" : "rotate(0deg)",
                  }}
                >
                  +
                </span>
              </button>

              {isOpen && (
                <div className="px-6 pb-6 pt-2 border-t border-white/10 text-sm font-medium leading-relaxed text-slate-300">
                  <p>{faq.answer}</p>
                  <div className="mt-4 flex items-center gap-2 text-xs font-mono text-cyan-400">
                    <span>Category: {faq.category}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
