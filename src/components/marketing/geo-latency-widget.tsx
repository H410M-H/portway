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
      .then((data) => { setGeoData(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8">
      {/* Section Header */}
      <div className="text-center max-w-2xl mx-auto">
        <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-3">
          Global Edge Network
        </h2>
        <p className="text-sm" style={{ color: "#6b7280" }}>
          6 Tier-1 Points of Presence. Your code runs where your users are.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
        {/* 3D Globe */}
        <div className="flex-shrink-0 relative">
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: "radial-gradient(circle, rgba(124,58,237,0.1) 0%, transparent 70%)",
              filter: "blur(40px)",
            }}
          />
          <Globe3D size={380} className="relative z-10" />
        </div>

        {/* Region Cards */}
        <div className="flex-1 w-full">
          {/* Detected Location Badge */}
          {geoData?.client && (
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono mb-4"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
                color: "#94a3b8",
              }}
            >
              <span>📍</span>
              <span style={{ color: "#06B6D4" }}>
                {geoData.client.city}, {geoData.client.country}
              </span>
              <span style={{ color: "#374151" }}>→</span>
              <span style={{ color: "#22c55e" }}>
                ~{geoData.routing?.estimatedLatencyMs}ms ({geoData.routing?.activeRegion.id.toUpperCase()})
              </span>
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="h-24 rounded-xl animate-pulse"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.04)" }}
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono">
              {geoData?.regions?.map((reg) => {
                const isClosest = reg.id === geoData.routing?.activeRegion.id;
                return (
                  <TiltCard
                    key={reg.id}
                    glowColor={isClosest ? "rgba(6,182,212,0.2)" : "rgba(124,58,237,0.1)"}
                    intensity={10}
                  >
                    <div
                      className="p-4 rounded-xl transition-all"
                      style={{
                        background: isClosest ? "rgba(6,182,212,0.05)" : "rgba(255,255,255,0.02)",
                        border: `1px solid ${isClosest ? "rgba(6,182,212,0.3)" : "rgba(255,255,255,0.06)"}`,
                        boxShadow: isClosest ? "0 0 20px rgba(6,182,212,0.1)" : "none",
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-white uppercase">{reg.id}</span>
                        {isClosest && (
                          <span
                            className="text-[9px] px-2 py-0.5 rounded-full font-bold"
                            style={{
                              background: "rgba(6,182,212,0.15)",
                              color: "#06B6D4",
                              border: "1px solid rgba(6,182,212,0.25)",
                            }}
                          >
                            NEAREST
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] mb-2" style={{ color: "#6b7280" }}>
                        {reg.name}
                      </div>
                      <div className="text-xl font-black" style={{ color: "#22c55e" }}>
                        {reg.latencyMs}
                        <span className="text-[10px] font-normal ml-0.5" style={{ color: "#4b5563" }}>ms</span>
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
