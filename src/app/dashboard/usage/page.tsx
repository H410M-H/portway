"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc-client";
import Link from "next/link";
import { useDashboard } from "../dashboard-shell";

export default function UsagePage() {
  const dashboard = useDashboard();
  const { data: fetchedWorkspaces } = trpc.workspace.list.useQuery();
  const workspaces = dashboard?.workspaces || fetchedWorkspaces;
  const [selectedWsId, setSelectedWsId] = useState<string>("");

  const activeWorkspace =
    workspaces?.find((w) => w.id === (selectedWsId || dashboard?.currentWorkspace?.id)) ||
    dashboard?.currentWorkspace ||
    workspaces?.[0];

  const workspaceId = activeWorkspace?.id;

  const {
    data: usage,
    isLoading: usageLoading,
  } = trpc.metrics.workspaceUsage.useQuery(
    { workspaceId: workspaceId! },
    { enabled: !!workspaceId }
  );

  const costDollars = (usage?.estimatedCostCents ?? 0) / 100;
  const capDollars = activeWorkspace?.spendingCapCents ? activeWorkspace.spendingCapCents / 100 : null;
  const spendPercent = capDollars && capDollars > 0 ? Math.min(100, (costDollars / capDollars) * 100) : 0;
  const isNearCap = capDollars ? spendPercent >= 80 : false;

  const totals = usage?.totals || {
    CPU_ACTIVE_SECONDS: 0,
    MEMORY_GIB_HOURS: 0,
    DISK_GB_HOURS: 0,
    EGRESS_GB: 0,
    DB_STORAGE_GB: 0,
    BUCKET_STORAGE_GB: 0,
  };

  const cpuCost = (totals.CPU_ACTIVE_SECONDS * 0.00002).toFixed(2);
  const memCost = (totals.MEMORY_GIB_HOURS * 0.005).toFixed(2);
  const diskCost = (totals.DISK_GB_HOURS * 0.0001).toFixed(2);
  const egressCost = (totals.EGRESS_GB * 0.09).toFixed(2);
  const dbCost = (totals.DB_STORAGE_GB * 0.02).toFixed(2);
  const bucketCost = (totals.BUCKET_STORAGE_GB * 0.015).toFixed(2);

  return (
    <div className="fade-in" style={{ maxWidth: "1000px", margin: "0 auto" }}>
      {/* ── Page Header ── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Usage &amp; Billing</h1>
          <p className="page-subtitle">
            Real-time infrastructure compute, memory, storage, and egress telemetry breakdown.
          </p>
        </div>

        {/* Workspace selector */}
        {workspaces && workspaces.length > 1 && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>Workspace:</span>
            <select
              className="input"
              style={{ width: "auto", padding: "6px 12px", fontSize: "0.875rem" }}
              value={selectedWsId || activeWorkspace?.id}
              onChange={(e) => {
                setSelectedWsId(e.target.value);
                dashboard?.setCurrentWorkspaceId(e.target.value);
              }}
            >
              {workspaces.map((ws) => (
                <option key={ws.id} value={ws.id}>
                  {ws.name} ({ws.slug})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* ── Plans & Fair Value Banner ── */}
      <div
        className="card"
        style={{
          marginBottom: "24px",
          background: "linear-gradient(135deg, rgba(99,102,241,0.12), rgba(6,182,212,0.12))",
          borderColor: "var(--border-emphasis)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <span style={{ fontSize: "20px" }}>💎</span>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0 }}>
              Syncbay Fair Value Cloud Guarantee
            </h3>
            <span className="badge badge-active" style={{ fontSize: "0.65rem" }}>
              Zero Seat Tax
            </span>
          </div>
          <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", margin: 0 }}>
            Save $1,200+/yr vs Vercel Pro and avoid Railway compute markups. 5 team seats included free on Pro ($10-$12/mo).
          </p>
        </div>

        <Link href="/pricing" className="btn btn-primary btn-sm">
          Compare All Plans &amp; Tiers →
        </Link>
      </div>

      {/* ── Spending Cap Gauge Card with 80% Alert Threshold ── */}
      <div
        className="card"
        style={{
          marginBottom: "28px",
          background: isNearCap ? "rgba(239, 68, 68, 0.08)" : "var(--bg-card)",
          borderColor: isNearCap ? "rgba(239, 68, 68, 0.4)" : "var(--border-subtle)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
          <div>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 700 }}>
              Monthly Spending Cap
            </h3>
            <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginTop: "4px" }}>
              Enforces hard limits to protect against runaway container compute or egress bills.
            </p>
          </div>

          <Link href="/dashboard/settings" className="btn btn-secondary btn-sm">
            ⚙️ Edit Cap in Settings
          </Link>
        </div>

        {capDollars ? (
          <div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "12px", marginBottom: "12px" }}>
              <span style={{ fontSize: "2.25rem", fontWeight: 800, color: isNearCap ? "#f87171" : "var(--text-primary)" }}>
                ${costDollars.toFixed(2)}
              </span>
              <span style={{ color: "var(--text-muted)", fontSize: "1rem" }}>
                of ${capDollars.toFixed(2)} budget limit ({spendPercent.toFixed(1)}%)
              </span>
            </div>

            {/* Visual Gauge Progress Bar */}
            <div
              style={{
                width: "100%",
                height: "16px",
                background: "var(--bg-overlay)",
                borderRadius: "999px",
                overflow: "hidden",
                border: "1px solid var(--border-subtle)",
                marginBottom: "12px",
              }}
            >
              <div
                style={{
                  width: `${spendPercent}%`,
                  height: "100%",
                  background: isNearCap
                    ? "linear-gradient(90deg, #f59e0b, #ef4444)"
                    : "linear-gradient(90deg, var(--brand-primary), var(--brand-accent))",
                  borderRadius: "999px",
                  transition: "width 0.4s ease",
                }}
              />
            </div>

            {/* 80% Threshold Warning Banner */}
            {isNearCap ? (
              <div
                style={{
                  padding: "14px 16px",
                  borderRadius: "var(--radius-md)",
                  background: "rgba(239, 68, 68, 0.15)",
                  border: "1px solid rgba(239, 68, 68, 0.35)",
                  color: "#fca5a5",
                  fontSize: "0.875rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                }}
              >
                <span style={{ fontSize: "20px" }}>🚨</span>
                <div>
                  <strong>Spending Cap Alert (80%+ Threshold Exceeded):</strong> This workspace has reached{" "}
                  <strong>{spendPercent.toFixed(1)}%</strong> of its monthly limit. When 100% is reached, services will
                  scale to zero and reject incoming requests until the next billing cycle or until the cap is increased.
                </div>
              </div>
            ) : (
              <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                Healthy status: Workspace is operating comfortably within its monthly budget limit.
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: "1.75rem", fontWeight: 800 }}>${costDollars.toFixed(2)}</div>
              <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginTop: "2px" }}>
                No spending cap set. Compute resources will scale according to demand.
              </p>
            </div>
            <Link href="/dashboard/settings" className="btn btn-primary btn-sm">
              Set Spending Cap
            </Link>
          </div>
        )}
      </div>

      {/* ── Resource Breakdown Grid ── */}
      <h3 style={{ marginBottom: "16px" }}>Telemetry Breakdown by Resource</h3>

      {usageLoading ? (
        <div style={{ textAlign: "center", padding: "48px" }}>
          <div className="loading-bar" style={{ width: "200px", margin: "0 auto 16px" }} />
          <p style={{ color: "var(--text-muted)" }}>Loading telemetry data...</p>
        </div>
      ) : (
        <div className="grid-3" style={{ marginBottom: "36px" }}>
          {/* CPU Active Seconds */}
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
              <span className="stat-label">Compute (vCPU)</span>
              <span style={{ fontSize: "18px" }}>⚡</span>
            </div>
            <div className="stat-value" style={{ fontSize: "1.6rem" }}>
              {totals.CPU_ACTIVE_SECONDS.toLocaleString()} s
            </div>
            <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginTop: "4px" }}>
              Rate: $0.00002 / active-sec
            </div>
            <div style={{ marginTop: "12px", paddingTop: "10px", borderTop: "1px solid var(--border-subtle)", display: "flex", justifyContent: "space-between", fontWeight: 600 }}>
              <span style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>Est. Cost:</span>
              <span style={{ color: "var(--brand-accent)" }}>${cpuCost}</span>
            </div>
          </div>

          {/* Memory GiB-Hours */}
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
              <span className="stat-label">Memory (RAM)</span>
              <span style={{ fontSize: "18px" }}>🧠</span>
            </div>
            <div className="stat-value" style={{ fontSize: "1.6rem" }}>
              {totals.MEMORY_GIB_HOURS.toFixed(2)} GiB-h
            </div>
            <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginTop: "4px" }}>
              Rate: $0.005 / GiB-hour
            </div>
            <div style={{ marginTop: "12px", paddingTop: "10px", borderTop: "1px solid var(--border-subtle)", display: "flex", justifyContent: "space-between", fontWeight: 600 }}>
              <span style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>Est. Cost:</span>
              <span style={{ color: "var(--brand-accent)" }}>${memCost}</span>
            </div>
          </div>

          {/* Disk GB-Hours */}
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
              <span className="stat-label">Persistent Volumes</span>
              <span style={{ fontSize: "18px" }}>💾</span>
            </div>
            <div className="stat-value" style={{ fontSize: "1.6rem" }}>
              {totals.DISK_GB_HOURS.toFixed(2)} GB-h
            </div>
            <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginTop: "4px" }}>
              Rate: $0.0001 / GB-hour
            </div>
            <div style={{ marginTop: "12px", paddingTop: "10px", borderTop: "1px solid var(--border-subtle)", display: "flex", justifyContent: "space-between", fontWeight: 600 }}>
              <span style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>Est. Cost:</span>
              <span style={{ color: "var(--brand-accent)" }}>${diskCost}</span>
            </div>
          </div>

          {/* Network Egress */}
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
              <span className="stat-label">Network Egress</span>
              <span style={{ fontSize: "18px" }}>🌐</span>
            </div>
            <div className="stat-value" style={{ fontSize: "1.6rem" }}>
              {totals.EGRESS_GB.toFixed(2)} GB
            </div>
            <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginTop: "4px" }}>
              Rate: $0.09 / GB (Cloudflare edge)
            </div>
            <div style={{ marginTop: "12px", paddingTop: "10px", borderTop: "1px solid var(--border-subtle)", display: "flex", justifyContent: "space-between", fontWeight: 600 }}>
              <span style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>Est. Cost:</span>
              <span style={{ color: "var(--brand-accent)" }}>${egressCost}</span>
            </div>
          </div>

          {/* Managed DB Storage */}
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
              <span className="stat-label">Managed Databases</span>
              <span style={{ fontSize: "18px" }}>🐘</span>
            </div>
            <div className="stat-value" style={{ fontSize: "1.6rem" }}>
              {totals.DB_STORAGE_GB.toFixed(2)} GB
            </div>
            <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginTop: "4px" }}>
              Rate: $0.02 / GB-month
            </div>
            <div style={{ marginTop: "12px", paddingTop: "10px", borderTop: "1px solid var(--border-subtle)", display: "flex", justifyContent: "space-between", fontWeight: 600 }}>
              <span style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>Est. Cost:</span>
              <span style={{ color: "var(--brand-accent)" }}>${dbCost}</span>
            </div>
          </div>

          {/* Object Storage */}
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
              <span className="stat-label">R2 Object Buckets</span>
              <span style={{ fontSize: "18px" }}>🪣</span>
            </div>
            <div className="stat-value" style={{ fontSize: "1.6rem" }}>
              {totals.BUCKET_STORAGE_GB.toFixed(2)} GB
            </div>
            <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginTop: "4px" }}>
              Rate: $0.015 / GB-month (Zero egress fees)
            </div>
            <div style={{ marginTop: "12px", paddingTop: "10px", borderTop: "1px solid var(--border-subtle)", display: "flex", justifyContent: "space-between", fontWeight: 600 }}>
              <span style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>Est. Cost:</span>
              <span style={{ color: "var(--brand-accent)" }}>${bucketCost}</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Scale to Zero Callout ── */}
      <div
        className="card"
        style={{
          marginBottom: "32px",
          background: "linear-gradient(135deg, rgba(99,102,241,0.06), rgba(6,182,212,0.06))",
          borderColor: "var(--border-emphasis)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
          <span style={{ fontSize: "24px" }}>💡</span>
          <h4 style={{ fontSize: "1.05rem" }}>Syncbay Scale-to-Zero Architecture</h4>
        </div>
        <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
          Services with <code>scaleToZero: true</code> automatically power down to 0 active replicas when idle for
          over 300 seconds. When idle, CPU and memory usage drops to zero, saving up to 85% on your monthly bill.
          Incoming HTTPS requests wake containers up in ~250ms via Cloudflare container routing.
        </p>
      </div>

      {/* ── Usage Records Table ── */}
      <div className="card">
        <h3 style={{ marginBottom: "6px" }}>Usage Records &amp; Metering</h3>
        <p style={{ fontSize: "0.875rem", marginBottom: "16px" }}>
          Recent metered telemetry records aggregated for this billing cycle.
        </p>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Resource Dimension</th>
                <th>Quantity</th>
                <th>Pricing Unit</th>
                <th style={{ textAlign: "right" }}>Calculated Charge</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <div style={{ fontWeight: 600 }}>CPU Active Compute Time</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Worker execution &amp; web serving</div>
                </td>
                <td>{totals.CPU_ACTIVE_SECONDS.toLocaleString()} sec</td>
                <td>$0.00002 / s</td>
                <td style={{ textAlign: "right", fontWeight: 600 }}>${cpuCost}</td>
              </tr>
              <tr>
                <td>
                  <div style={{ fontWeight: 600 }}>Container Memory Allocation</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>RAM provisioned during active state</div>
                </td>
                <td>{totals.MEMORY_GIB_HOURS.toFixed(2)} GiB-hours</td>
                <td>$0.005 / GiB-h</td>
                <td style={{ textAlign: "right", fontWeight: 600 }}>${memCost}</td>
              </tr>
              <tr>
                <td>
                  <div style={{ fontWeight: 600 }}>Persistent Volume Storage</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Mounted disk capacity</div>
                </td>
                <td>{totals.DISK_GB_HOURS.toFixed(2)} GB-hours</td>
                <td>$0.0001 / GB-h</td>
                <td style={{ textAlign: "right", fontWeight: 600 }}>${diskCost}</td>
              </tr>
              <tr>
                <td>
                  <div style={{ fontWeight: 600 }}>Outbound Network Bandwidth</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Traffic to clients via Edge CDN</div>
                </td>
                <td>{totals.EGRESS_GB.toFixed(2)} GB</td>
                <td>$0.09 / GB</td>
                <td style={{ textAlign: "right", fontWeight: 600 }}>${egressCost}</td>
              </tr>
              <tr>
                <td>
                  <div style={{ fontWeight: 600 }}>Managed Database Storage</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Postgres, Redis, MySQL instances</div>
                </td>
                <td>{totals.DB_STORAGE_GB.toFixed(2)} GB</td>
                <td>$0.02 / GB-mo</td>
                <td style={{ textAlign: "right", fontWeight: 600 }}>${dbCost}</td>
              </tr>
              <tr>
                <td>
                  <div style={{ fontWeight: 600 }}>R2 Object Storage Buckets</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>S3-compatible bucket assets</div>
                </td>
                <td>{totals.BUCKET_STORAGE_GB.toFixed(2)} GB</td>
                <td>$0.015 / GB-mo</td>
                <td style={{ textAlign: "right", fontWeight: 600 }}>${bucketCost}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Individual metered usage event records */}
        {usage?.records && usage.records.length > 0 && (
          <div style={{ marginTop: "24px" }}>
            <h4 style={{ marginBottom: "8px", fontSize: "0.9375rem" }}>Recent Metered Ingestion Events</h4>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Resource Type</th>
                    <th>Measured Quantity</th>
                    <th style={{ textAlign: "right" }}>Period Window</th>
                  </tr>
                </thead>
                <tbody>
                  {usage.records.map((rec: any) => (
                    <tr key={rec.id}>
                      <td style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
                        {new Date(rec.createdAt).toLocaleString()}
                      </td>
                      <td>
                        <span className="badge badge-queued" style={{ fontSize: "0.7rem" }}>
                          {rec.resourceType}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600 }}>
                        {rec.quantity.toLocaleString()}{" "}
                        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 400 }}>
                          {rec.resourceType.includes("SECONDS")
                            ? "sec"
                            : rec.resourceType.includes("GIB") || rec.resourceType.includes("GB")
                            ? "GB"
                            : "units"}
                        </span>
                      </td>
                      <td style={{ textAlign: "right", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                        {new Date(rec.periodStart).toLocaleDateString()} – {new Date(rec.periodEnd).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
