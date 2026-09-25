"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { DeepSpaceScene } from "@/components/3d/deep-space-scene";

export function GlobalSpaceBackground() {
  const pathname = usePathname();
  const [motionMode, setMotionMode] = useState<"auto" | "subtle" | "hero" | "paused">("auto");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("syncbay_cosmic_motion");
    if (saved && ["auto", "subtle", "hero", "paused"].includes(saved)) {
      setMotionMode(saved as any);
    }
  }, []);

  const handleToggle = () => {
    const nextMode =
      motionMode === "auto"
        ? "subtle"
        : motionMode === "subtle"
        ? "hero"
        : motionMode === "hero"
        ? "paused"
        : "auto";
    setMotionMode(nextMode);
    localStorage.setItem("syncbay_cosmic_motion", nextMode);
  };

  if (!mounted) return null;

  // Determine effective mode
  let effectiveMode: "hero" | "subtle" | "paused" = "subtle";
  if (motionMode === "auto") {
    effectiveMode = pathname === "/" ? "hero" : "subtle";
  } else if (motionMode === "paused") {
    effectiveMode = "paused";
  } else {
    effectiveMode = motionMode;
  }

  return (
    <>
      {effectiveMode !== "paused" && (
        <DeepSpaceScene
          mode={effectiveMode === "hero" ? "hero" : "subtle"}
          interactive={true}
        />
      )}

      {/* Subtle Cosmic Ambience Gradients across all pages */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            effectiveMode === "hero"
              ? "radial-gradient(ellipse 80% 60% at 50% -20%, rgba(6,182,212,0.18) 0%, rgba(124,58,237,0.1) 40%, transparent 80%)"
              : "radial-gradient(ellipse 90% 70% at 50% -30%, rgba(6,182,212,0.08) 0%, rgba(124,58,237,0.05) 50%, transparent 90%)",
        }}
        aria-hidden="true"
      />

      {/* Discrete Cosmic Atmosphere Toggle Pill */}
      <div
        style={{
          position: "fixed",
          bottom: "16px",
          right: "16px",
          zIndex: 40,
        }}
      >
        <button
          onClick={handleToggle}
          title={`Space Atmosphere: ${motionMode.toUpperCase()} (Click to cycle)`}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            background: "rgba(18, 18, 24, 0.75)",
            border: "1px solid rgba(6, 182, 212, 0.3)",
            backdropFilter: "blur(12px)",
            padding: "5px 10px",
            borderRadius: "9999px",
            fontSize: "11px",
            color: "#a1a1aa",
            cursor: "pointer",
            boxShadow: "0 0 15px rgba(6, 182, 212, 0.15)",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "#06b6d4";
            e.currentTarget.style.color = "#ffffff";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "rgba(6, 182, 212, 0.3)";
            e.currentTarget.style.color = "#a1a1aa";
          }}
        >
          <span style={{ fontSize: "12px" }}>🚀</span>
          <span>Cosmic BG:</span>
          <span
            style={{
              color: effectiveMode === "paused" ? "#ef4444" : "#06b6d4",
              fontWeight: 600,
              textTransform: "uppercase",
            }}
          >
            {motionMode}
          </span>
        </button>
      </div>
    </>
  );
}
