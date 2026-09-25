"use client";

import React, { useRef, useState, type ReactNode } from "react";

interface TiltCardProps {
  children: ReactNode;
  className?: string;
  glowColor?: string;
  intensity?: number;
}

export function TiltCard({
  children,
  className = "",
  glowColor = "rgba(6, 182, 212, 0.35)",
  intensity = 16,
}: TiltCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState("perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px)");
  const [glowPos, setGlowPos] = useState({ x: 50, y: 50 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const rotateX = (y - 0.5) * -intensity;
    const rotateY = (x - 0.5) * intensity;
    setTransform(
      `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(12px) scale3d(1.03, 1.03, 1.03)`
    );
    setGlowPos({ x: x * 100, y: y * 100 });
  };

  const handleMouseLeave = () => {
    setTransform("perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px) scale3d(1, 1, 1)");
    setIsHovered(false);
  };

  return (
    <div
      ref={cardRef}
      className={`relative transition-all duration-300 ease-out rounded-2xl ${className}`}
      style={{
        transform,
        transformStyle: "preserve-3d",
        background: "linear-gradient(135deg, rgba(22, 22, 35, 0.85) 0%, rgba(10, 10, 18, 0.95) 100%)",
        border: isHovered
          ? "1px solid rgba(6, 182, 212, 0.65)"
          : "1px solid rgba(255, 255, 255, 0.14)",
        boxShadow: isHovered
          ? `0 20px 40px -10px rgba(0, 0, 0, 0.9), 0 0 30px ${glowColor}, inset 0 1px 1px rgba(255, 255, 255, 0.25)`
          : "0 12px 30px -5px rgba(0, 0, 0, 0.7), 0 0 15px rgba(6, 182, 212, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.12)",
        backdropFilter: "blur(16px)",
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
    >
      {/* 3D Specular Light & Glow Follow */}
      {isHovered && (
        <div
          className="absolute inset-0 rounded-[inherit] pointer-events-none z-0 transition-opacity duration-300"
          style={{
            background: `radial-gradient(circle 280px at ${glowPos.x}% ${glowPos.y}%, ${glowColor}, transparent 70%)`,
            opacity: 0.9,
          }}
        />
      )}

      {/* Cyber 3D edge highlight */}
      <div
        className="absolute top-0 left-4 right-4 h-[1px] pointer-events-none z-10"
        style={{
          background: isHovered
            ? "linear-gradient(90deg, transparent, #06b6d4, #8b5cf6, transparent)"
            : "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)",
        }}
      />

      <div className="relative z-10">{children}</div>
    </div>
  );
}
