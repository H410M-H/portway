"use client";

import React, { useState } from "react";
import { trpc } from "@/lib/trpc-client";

export function EdgeProxyConsole() {
  const { data: regions, refetch: refetchRegions } = trpc.edge.getRegions.useQuery();
  const { data: routing, refetch: refetchRouting } = trpc.edge.getRoutingDecision.useQuery();
  const { data: pings, refetch: refetchPings, isFetching: pingsFetching } = trpc.edge.pingPops.useQuery();

  const toggleStatusMutation = trpc.edge.toggleRegionStatus.useMutation({
    onSuccess: () => {
      refetchRegions();
      refetchRouting();
      refetchPings();
    },
  });

  const [simulatedRegion, setSimulatedRegion] = useState("iad1");

  const handleSimulateOutage = async (status: "HEALTHY" | "OUTAGE" | "RESET") => {
    await toggleStatusMutation.mutateAsync({
      regionId: simulatedRegion,
      status,
    });
  };

  return (
    <div className="space-y-6 font-mono text-xs">
      {/* Top Banner: Client Geo Ingress Routing */}
      <div className="border border-zinc-800 rounded-xl bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 p-5 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <h3 className="text-sm font-bold text-white tracking-wide uppercase">
                Active Edge Ingress Decision
              </h3>
            </div>
            <p className="text-zinc-400 text-xs mt-1">
              Client detected in{" "}
              <span className="text-cyan-400 font-semibold">{routing?.detectedCountry}</span> (
              {routing?.detectedCity}) • Client IP: {routing?.clientIp}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3 py-1.5 rounded-lg bg-black border border-zinc-800 text-right">
              <div className="text-[10px] text-zinc-500 uppercase">Routed Edge Node</div>
              <div className="text-cyan-400 font-bold text-xs">
                {routing?.activeRegion.id.toUpperCase()} ({routing?.activeRegion.location})
              </div>
            </div>

            <div className="px-3 py-1.5 rounded-lg bg-black border border-zinc-800 text-right">
              <div className="text-[10px] text-zinc-500 uppercase">Estimated Latency</div>
              <div className="text-emerald-400 font-bold text-xs">
                ~{routing?.estimatedLatencyMs} ms
              </div>
            </div>
          </div>
        </div>

        {routing?.isFailover && (
          <div className="mt-4 p-3 rounded bg-amber-950/40 border border-amber-800/60 text-amber-300 text-xs">
            <span className="font-bold">⚡ Automated Edge Failover Active:</span> {routing.failoverReason}
          </div>
        )}
      </div>

      {/* Global Edge Regions Grid */}
      <div className="border border-zinc-800 rounded-xl bg-zinc-950 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-sm font-bold text-white">Global Edge Network POPs (6 Datacenters)</h4>
            <p className="text-zinc-500 text-xs">
              Cloudflare Containers edge fabric with TLS 1.3 termination and HTTP/3 QUIC
            </p>
          </div>
          <button
            type="button"
            onClick={() => refetchPings()}
            disabled={pingsFetching}
            className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded text-xs transition-colors"
          >
            {pingsFetching ? "Probing..." : "⚡ Re-probe Latencies"}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {regions?.map((reg) => {
            const ping = pings?.find((p) => p.regionId === reg.id);
            const isOutage = reg.status === "OUTAGE";
            const isDegraded = reg.status === "DEGRADED";

            return (
              <div
                key={reg.id}
                className={`p-4 rounded-lg border transition-all ${
                  isOutage
                    ? "border-red-900/60 bg-red-950/20"
                    : isDegraded
                    ? "border-amber-800/60 bg-amber-950/20"
                    : "border-zinc-800 bg-black/60 hover:border-zinc-700"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-white flex items-center gap-1.5">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isOutage
                          ? "bg-red-500"
                          : isDegraded
                          ? "bg-amber-400"
                          : "bg-emerald-400"
                      }`}
                    />
                    {reg.id.toUpperCase()}
                  </span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                      isOutage
                        ? "bg-red-900/60 text-red-300"
                        : isDegraded
                        ? "bg-amber-900/60 text-amber-300"
                        : "bg-emerald-950 text-emerald-300 border border-emerald-800/40"
                    }`}
                  >
                    {reg.status}
                  </span>
                </div>

                <div className="text-zinc-400 text-xs font-sans mb-3">{reg.location}</div>

                <div className="space-y-1.5 text-[11px] text-zinc-400 border-t border-zinc-800/80 pt-2.5">
                  <div className="flex justify-between">
                    <span>Edge Roundtrip:</span>
                    <span className="text-white font-bold">{ping ? `${ping.latencyMs} ms` : `${reg.averageLatencyMs} ms`}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Distance:</span>
                    <span className="text-zinc-300">{ping ? `${ping.distanceKm.toLocaleString()} km` : "Calculated"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Active Containers:</span>
                    <span className="text-cyan-400 font-bold">{reg.activeContainers}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Protocols:</span>
                    <span className="text-zinc-300">TLS 1.3 • HTTP/3 QUIC</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Edge Resilience & Chaos Simulator */}
      <div className="border border-zinc-800 rounded-xl bg-black p-5">
        <h4 className="text-sm font-bold text-white mb-1">
          Chaos Engineering: Edge POP Failover Simulator
        </h4>
        <p className="text-zinc-500 text-xs mb-4">
          Test zero-downtime routing resilience. Simulate an edge POP outage to verify automated traffic shifting.
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={simulatedRegion}
            onChange={(e) => setSimulatedRegion(e.target.value)}
            className="bg-zinc-900 border border-zinc-700 text-white rounded px-3 py-1.5 text-xs focus:outline-none focus:border-cyan-500"
          >
            {regions?.map((r) => (
              <option key={r.id} value={r.id}>
                {r.id.toUpperCase()} — {r.location}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => handleSimulateOutage("OUTAGE")}
            disabled={toggleStatusMutation.isPending}
            className="px-3 py-1.5 rounded bg-red-950 hover:bg-red-900 border border-red-800 text-red-200 font-bold transition-colors text-xs"
          >
            💥 Trigger Region Outage
          </button>

          <button
            type="button"
            onClick={() => handleSimulateOutage("RESET")}
            disabled={toggleStatusMutation.isPending}
            className="px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold transition-colors text-xs"
          >
            ↺ Reset to Healthy
          </button>
        </div>
      </div>
    </div>
  );
}
