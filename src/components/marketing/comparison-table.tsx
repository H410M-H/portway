"use client";

import React from "react";

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
    <div className="w-full rounded-2xl border border-zinc-800 bg-zinc-950/80 backdrop-blur-xl overflow-hidden shadow-2xl">
      <div className="p-6 border-b border-zinc-800 bg-gradient-to-r from-zinc-900 via-zinc-950 to-zinc-900">
        <h3 className="text-xl font-bold text-white tracking-tight">
          How Syncbay Compares to the Competition
        </h3>
        <p className="text-xs text-zinc-400 mt-1">
          Designed from the ground up for teams who have outgrown Vercel&apos;s frontend constraints and Railway&apos;s single-region bottlenecks.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse font-sans text-xs">
          <thead>
            <tr className="border-b border-zinc-800 bg-black/60">
              <th className="py-3.5 px-5 font-semibold text-zinc-400 w-2/5">Platform Feature</th>
              <th className="py-3.5 px-5 font-bold text-cyan-400 bg-cyan-950/20 border-x border-cyan-500/20 w-1/5">
                ⚡ Syncbay Edge
              </th>
              <th className="py-3.5 px-5 font-medium text-zinc-400 w-1/5">▲ Vercel</th>
              <th className="py-3.5 px-5 font-medium text-zinc-400 w-1/5">🚂 Railway</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-900">
            {FEATURES.map((feat, idx) => (
              <tr
                key={idx}
                className={`transition-colors hover:bg-zinc-900/30 ${
                  feat.highlight ? "bg-cyan-950/5" : ""
                }`}
              >
                <td className="py-3 px-5 text-zinc-200 font-medium">
                  <div className="flex items-center gap-2">
                    {feat.highlight && (
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
                    )}
                    <span>{feat.name}</span>
                  </div>
                  <span className="text-[10px] text-zinc-500 block font-normal mt-0.5">
                    {feat.category}
                  </span>
                </td>
                <td className="py-3 px-5 font-bold text-cyan-300 bg-cyan-950/15 border-x border-cyan-500/20">
                  {feat.syncbay}
                </td>
                <td className="py-3 px-5 text-zinc-400">{feat.vercel}</td>
                <td className="py-3 px-5 text-zinc-400">{feat.railway}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
