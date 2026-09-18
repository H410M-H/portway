"use client";

import React, { useEffect, useRef, useState } from "react";

interface AsciiBackgroundProps {
  opacity?: number;
  interactive?: boolean;
  theme?: "cyber" | "matrix" | "synthwave" | "aurora";
  density?: "low" | "medium" | "high";
  className?: string;
}

const THEME_COLORS = {
  cyber: ["#00ffff", "#ff007f", "#7928ca", "#00dfd8", "#f81ce5", "#ffffff"],
  matrix: ["#00ff66", "#00cc44", "#008822", "#66ff99", "#33ff77", "#aaffcc"],
  synthwave: ["#ff007f", "#ff7700", "#7928ca", "#00f0ff", "#ffe600", "#ff0055"],
  aurora: ["#00f5d4", "#7b2cbf", "#f72585", "#4361ee", "#4cc9f0", "#7209b7"],
};

const ASCII_CHARS = [
  " ", "·", "•", "▪", "▫", "+", "*", "☁", "✦", "✧", "▲", "◆", "░", "▒", "▓", "%", "#", "@"
];

export function AsciiBackground({
  opacity = 0.35,
  interactive = true,
  theme = "cyber",
  density = "medium",
  className = "",
}: AsciiBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: -1000, y: -1000 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    const colors = THEME_COLORS[theme] || THEME_COLORS.cyber;
    const spacing = density === "high" ? 16 : density === "medium" ? 22 : 32;
    const cols = Math.floor(width / spacing);
    const rows = Math.floor(height / spacing);

    let time = 0;

    const render = () => {
      time += 0.02;
      ctx.clearRect(0, 0, width, height);

      ctx.font = `${spacing * 0.75}px monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = c * spacing + spacing / 2;
          const y = r * spacing + spacing / 2;

          // Wave equation for flowing cyber-cloud hyper-plane
          const wave1 = Math.sin(c * 0.12 + time) * Math.cos(r * 0.14 - time * 0.8);
          const wave2 = Math.sin((c + r) * 0.08 + time * 1.2);
          const wave3 = Math.cos(Math.sqrt(c * c + r * r) * 0.09 - time);
          let intensity = (wave1 + wave2 + wave3 + 3) / 6; // 0 to 1

          // Proximity boost to mouse position
          if (interactive && mousePos.x > 0) {
            const dx = x - mousePos.x;
            const dy = y - mousePos.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 180) {
              intensity = Math.min(1, intensity + (1 - dist / 180) * 0.7);
            }
          }

          if (intensity > 0.35) {
            const charIndex = Math.min(
              ASCII_CHARS.length - 1,
              Math.floor(intensity * ASCII_CHARS.length)
            );
            const char = ASCII_CHARS[charIndex];

            const colorIndex = Math.floor((intensity * colors.length + c * 0.05) % colors.length);
            const color = colors[colorIndex];

            ctx.fillStyle = color;
            ctx.globalAlpha = (intensity * 0.85).toFixed(2) as any;
            ctx.fillText(char, x, y);
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };

    if (interactive) {
      window.addEventListener("mousemove", handleMouseMove);
    }

    return () => {
      window.removeEventListener("resize", handleResize);
      if (interactive) {
        window.removeEventListener("mousemove", handleMouseMove);
      }
      cancelAnimationFrame(animationFrameId);
    };
  }, [theme, density, interactive]);

  return (
    <div
      className={`pointer-events-none fixed inset-0 z-0 overflow-hidden ${className}`}
      style={{ opacity }}
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
}
