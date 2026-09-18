"use client";

import React, { useEffect, useState } from "react";

interface EdgeRegionPing {
  id: string;
  name: string;
  location: string;
  distanceKm: number;
  latencyMs: number;
  status: string;
}

export function GeoLatencyWidget() {
  const [geoData, setGeoData] = useState<{
    client?: { ip: string; country: string; city: string };
    routing?: { activeRegion: { id: string; location: string }; estimatedLatencyMs: number };
    regions?: EdgeRegionPing[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/geo/locate")
      .then((res) => res.json())
      .then((data) => {
        setGeoData(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="rounded-2xl border border-cyan-500/20 bg-black/80 backdrop-blur-xl p-6 shadow-2xl relative overflow-hidden">
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-zinc-800 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <h4 className="text-sm font-bold text-white tracking-wide uppercase font-mono">
              Live Edge Network Latency Probe
            </h4>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Real-time ping from your browser to Syncbay&apos;s 6 Tier-1 Global Edge POPs
          </p>
        </div>

        {geoData?.client && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 font-mono">
            <span>📍 Detected:</span>
            <span className="text-cyan-400 font-bold">
              {geoData.client.city}, {geoData.client.country}
            </span>
            <span className="text-zinc-500">•</span>
            <span className="text-emerald-400 font-bold">
              ~{geoData.routing?.estimatedLatencyMs}ms ({geoData.routing?.activeRegion.id.toUpperCase()})
            </span>
          </div>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-24 rounded-xl bg-zinc-900/50 animate-pulse border border-zinc-800" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 font-mono">
          {geoData?.regions?.map((reg) => {
            const isClosest = reg.id === geoData.routing?.activeRegion.id;
            return (
              <div
                key={reg.id}
                className={`p-3.5 rounded-xl border transition-all ${
                  isClosest
                    ? "border-cyan-500/60 bg-cyan-950/20 shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                    : "border-zinc-800/80 bg-zinc-950/60 hover:border-zinc-700"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-white uppercase">{reg.id}</span>
                  {isClosest && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold">
                      CLOSEST
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-zinc-400 truncate mb-2">{reg.name}</div>
                <div className="text-lg font-black text-emerald-400">
                  {reg.latencyMs} <span className="text-[10px] text-zinc-500 font-normal">ms</span>
                </div>
                <div className="text-[10px] text-zinc-500 mt-1">
                  {reg.distanceKm ? `${reg.distanceKm.toLocaleString()} km` : "Edge"}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
