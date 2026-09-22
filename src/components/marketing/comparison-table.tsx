"use client";

import React from "react";
import { TiltCard } from "@/components/ui/tilt-card";

interface ComparisonFeature {
  name: string;
  category: string;
  syncbay: string;
  vercel: string;
  railway: string;
  highlight?: boolean;
}

const FEATURES: ComparisonFeature[] = [
  {
    name: "Container Cold Starts",
    category: "Compute & Architecture",
    syncbay: "0 ms (Edge Containers)",
    vercel: "250 – 800 ms (Serverless)",
    railway: "2,000 – 5,000 ms (Spin-up)",
    highlight: true,
  },
  {
    name: "Multi-Region Edge Failover",
    category: "Compute & Architecture",
    syncbay: "6 Tier-1 Global Edge POPs",
    vercel: "Serverless Edge Functions only",
    railway: "Single region per service",
    highlight: true,
  },
  {
    name: "Managed Serverless PostgreSQL",
    category: "Databases & Storage",
    syncbay: "Built-in, 1-Click Provisioning",
    vercel: "Third-party Neon Add-on",
    railway: "Raw Docker Container",
  },
  {
    name: "Managed Redis / Valkey Cache",
    category: "Databases & Storage",
    syncbay: "Built-in with Connection Helpers",
    vercel: "Third-party Upstash Add-on",
    railway: "Separate Service Billing",
  },
  {
    name: "Interactive Web Terminal Shell",
    category: "Developer Experience",
    syncbay: "Full VT100 Interactive Shell",
    vercel: "Not Available",
    railway: "Logs viewer only",
    highlight: true,
  },
  {
    name: "Database Query Studio",
    category: "Developer Experience",
    syncbay: "Built-in SQL & Redis Query Runner",
    vercel: "Not Available",
    railway: "Basic Table Inspector",
    highlight: true,
  },
  {
    name: "Ephemeral PR Preview Environments",
    category: "CI/CD & Automation",
    syncbay: "Automated with cloned variables",
    vercel: "Frontend static only",
    railway: "Paid add-on / Manual setup",
  },
  {
    name: "Zero-Downtime Blue/Green Rollback",
    category: "CI/CD & Automation",
    syncbay: "Automated HTTP Healthcheck Gate",
    vercel: "Instant Rollback (Frontend only)",
    railway: "Rolling replace (Possible downtime)",
  },
  {
    name: "Base Developer Pricing",
    category: "Pricing & Fair Billing",
    syncbay: "Free Tier ($0) • $5/mo Pro",
    vercel: "$20 / member / month",
    railway: "$5 base fee + usage markup",
    highlight: true,
  },
  {
    name: "Network Egress Pricing",
    category: "Pricing & Fair Billing",
    syncbay: "$0.04 / GB (At-cost)",
    vercel: "$0.15 / GB",
    railway: "$0.10 / GB",
  },
];

export function ComparisonTable() {
  return (
    <div className="space-y-8">
      {/* Section Header */}
      <div className="text-center max-w-2xl mx-auto">
        <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-3">
          Why Teams Switch to Syncbay
        </h2>
        <p className="text-sm" style={{ color: "#6b7280" }}>
          A side-by-side breakdown against Vercel and Railway. Built for teams who need more.
        </p>
      </div>

      <TiltCard intensity={3} glowColor="rgba(6,182,212,0.08)">
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: "rgba(8, 8, 18, 0.7)",
            border: "1px solid rgba(255,255,255,0.06)",
            backdropFilter: "blur(20px)",
            boxShadow: "0 25px 60px -12px rgba(0,0,0,0.5)",
          }}
        >
          {/* Table Header */}
          <div
            className="p-6"
            style={{
              borderBottom: "1px solid rgba(255,255,255,0.06)",
              background: "linear-gradient(135deg, rgba(6,182,212,0.03), rgba(124,58,237,0.03))",
            }}
          >
            <h3 className="text-lg font-bold text-white tracking-tight">
              Platform Comparison Matrix
            </h3>
            <p className="text-xs mt-1" style={{ color: "#4b5563" }}>
              Feature-by-feature competitive analysis
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs" style={{ fontFamily: "'Inter', sans-serif" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <th
                    className="py-3.5 px-5 font-semibold w-2/5"
                    style={{ color: "#6b7280", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.06em" }}
                  >
                    Feature
                  </th>
                  <th
                    className="py-3.5 px-5 font-bold w-1/5"
                    style={{
                      color: "#06B6D4",
                      background: "rgba(6,182,212,0.04)",
                      borderLeft: "1px solid rgba(6,182,212,0.1)",
                      borderRight: "1px solid rgba(6,182,212,0.1)",
                    }}
                  >
                    ⚡ Syncbay
                  </th>
                  <th className="py-3.5 px-5 font-medium w-1/5" style={{ color: "#6b7280" }}>
                    ▲ Vercel
                  </th>
                  <th className="py-3.5 px-5 font-medium w-1/5" style={{ color: "#6b7280" }}>
                    🚂 Railway
                  </th>
                </tr>
              </thead>
              <tbody>
                {FEATURES.map((feat, idx) => (
                  <tr
                    key={idx}
                    className="transition-colors"
                    style={{
                      borderBottom: "1px solid rgba(255,255,255,0.03)",
                      background: feat.highlight ? "rgba(6,182,212,0.02)" : "transparent",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.02)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background = feat.highlight ? "rgba(6,182,212,0.02)" : "transparent";
                    }}
                  >
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-2">
                        {feat.highlight && (
                          <span
                            className="w-1.5 h-1.5 rounded-full shrink-0"
                            style={{ background: "#06B6D4", boxShadow: "0 0 6px rgba(6,182,212,0.5)" }}
                          />
                        )}
                        <span className="font-medium" style={{ color: "#e2e8f0" }}>
                          {feat.name}
                        </span>
                      </div>
                      <span className="text-[10px] block mt-0.5" style={{ color: "#4b5563" }}>
                        {feat.category}
                      </span>
                    </td>
                    <td
                      className="py-3.5 px-5 font-bold"
                      style={{
                        color: "#22d3ee",
                        background: "rgba(6,182,212,0.04)",
                        borderLeft: "1px solid rgba(6,182,212,0.08)",
                        borderRight: "1px solid rgba(6,182,212,0.08)",
                      }}
                    >
                      {feat.syncbay}
                    </td>
                    <td className="py-3.5 px-5" style={{ color: "#6b7280" }}>
                      {feat.vercel}
                    </td>
                    <td className="py-3.5 px-5" style={{ color: "#6b7280" }}>
                      {feat.railway}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </TiltCard>
    </div>
  );
}
