"use client";

import React, { useEffect, useState } from "react";
import { Globe3D } from "@/components/ui/globe-3d";
import { TiltCard } from "@/components/ui/tilt-card";

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
    <div className="space-y-8">
      {/* Section Header */}
      <div className="text-center max-w-2xl mx-auto">
        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase mb-3"
          style={{
            background: "rgba(6, 182, 212, 0.15)",
            border: "1px solid rgba(6, 182, 212, 0.4)",
            color: "#38bdf8",
          }}
        >
          🌐 Multi-Region Edge Mesh
        </div>
        <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-3">
          Instant Global Edge Routing
        </h2>
        <p className="text-sm font-medium" style={{ color: "#94a3b8" }}>
          6 Tier-1 Edge POPs with real-time health-gated failover. Sub-20ms latency across 95% of global users.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
        {/* 3D Globe with Cyan Atmospheric Glow */}
        <div className="flex-shrink-0 relative">
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: "radial-gradient(circle, rgba(6,182,212,0.2) 0%, rgba(124,58,237,0.15) 50%, transparent 75%)",
              filter: "blur(40px)",
            }}
          />
          <Globe3D size={400} className="relative z-10" />
        </div>

        {/* Region Cards */}
        <div className="flex-1 w-full">
          {/* Detected Location Badge */}
          {geoData?.client && (
            <div
              className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-xs font-mono mb-5 shadow-lg"
              style={{
                background: "linear-gradient(135deg, rgba(22, 22, 35, 0.95), rgba(12, 12, 20, 0.95))",
                border: "1px solid rgba(6, 182, 212, 0.4)",
                color: "#cbd5e1",
                boxShadow: "0 0 20px rgba(6, 182, 212, 0.15)",
              }}
            >
              <span className="text-sm">📍</span>
              <span className="font-bold" style={{ color: "#38bdf8" }}>
                {geoData.client.city}, {geoData.client.country}
              </span>
              <span style={{ color: "#64748b" }}>→</span>
              <span className="font-bold flex items-center gap-1.5" style={{ color: "#4ade80" }}>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_#4ade80]" />
                ~{geoData.routing?.estimatedLatencyMs}ms ({geoData.routing?.activeRegion.id.toUpperCase()})
              </span>
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="h-28 rounded-xl animate-pulse"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 font-mono">
              {geoData?.regions?.map((reg) => {
                const isClosest = reg.id === geoData.routing?.activeRegion.id;
                return (
                  <TiltCard
                    key={reg.id}
                    glowColor={isClosest ? "rgba(6,182,212,0.4)" : "rgba(124,58,237,0.25)"}
                    intensity={12}
                  >
                    <div
                      className="p-5 rounded-xl transition-all"
                      style={{
                        background: isClosest
                          ? "linear-gradient(135deg, rgba(6,182,212,0.18), rgba(59,130,246,0.12))"
                          : "linear-gradient(135deg, rgba(20,20,32,0.9), rgba(10,10,18,0.95))",
                        border: isClosest
                          ? "1px solid rgba(6,182,212,0.6)"
                          : "1px solid rgba(255,255,255,0.12)",
                        boxShadow: isClosest
                          ? "0 0 25px rgba(6,182,212,0.25), inset 0 1px 0 rgba(255,255,255,0.2)"
                          : "0 8px 20px rgba(0,0,0,0.5)",
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-black text-white uppercase tracking-wider">
                          {reg.id}
                        </span>
                        {isClosest && (
                          <span
                            className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                            style={{
                              background: "rgba(6,182,212,0.25)",
                              color: "#38bdf8",
                              border: "1px solid rgba(6,182,212,0.5)",
                              boxShadow: "0 0 10px rgba(6,182,212,0.4)",
                            }}
                          >
                            ROUTED
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] font-semibold mb-3" style={{ color: "#94a3b8" }}>
                        {reg.name}
                      </div>
                      <div
                        className="text-2xl font-black"
                        style={{
                          color: reg.latencyMs < 20 ? "#4ade80" : reg.latencyMs < 50 ? "#38bdf8" : "#facc15",
                          textShadow: "0 0 12px rgba(74,222,128,0.4)",
                        }}
                      >
                        {reg.latencyMs}
                        <span className="text-xs font-normal ml-1" style={{ color: "#94a3b8" }}>
                          ms
                        </span>
                      </div>
                    </div>
                  </TiltCard>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
