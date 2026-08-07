import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { COLORS } from "../../lib/theme";
import { interpolate } from "../../lib/anim";

/**
 * Sfondo "cinematografico" dietro i dispositivi: gradiente navy profondo,
 * bagliore brand che respira lentamente, griglia tenue e vignettatura.
 */
export const Stage: React.FC<{
  children?: React.ReactNode;
  glowX?: number; // 0..1
  glowY?: number; // 0..1
  glowColor?: string;
}> = ({ children, glowX = 0.5, glowY = 0.42, glowColor = COLORS.stageGlow }) => {
  const frame = useCurrentFrame();
  const breathe = interpolate(
    Math.sin(frame / 40),
    [-1, 1],
    [0.55, 0.85]
  );
  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(160deg, ${COLORS.stageTop} 0%, ${COLORS.stageBottom} 100%)`,
      }}
    >
      {/* bagliore brand */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(60% 55% at ${glowX * 100}% ${
            glowY * 100
          }%, ${glowColor} 0%, transparent 60%)`,
          opacity: breathe * 0.5,
          filter: "blur(8px)",
        }}
      />
      {/* griglia tenue */}
      <AbsoluteFill
        style={{
          backgroundImage: `linear-gradient(${COLORS.white} 1px, transparent 1px), linear-gradient(90deg, ${COLORS.white} 1px, transparent 1px)`,
          backgroundSize: "68px 68px",
          opacity: 0.02,
          maskImage:
            "radial-gradient(70% 70% at 50% 45%, black 0%, transparent 85%)",
        }}
      />
      {children}
      {/* vignettatura */}
      <AbsoluteFill
        style={{
          boxShadow: "inset 0 0 340px 90px rgba(0,0,0,0.65)",
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};
