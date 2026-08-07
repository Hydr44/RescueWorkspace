import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { Stage } from "../components/ui/Stage";
import { FullLogo } from "../components/ui/Logo";
import { COLORS } from "../lib/theme";
import { FONT_SANS } from "../lib/fonts";
import { rise, fadeUp, interpolate } from "../lib/anim";

export const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const p = rise(frame, fps, 2, "pop");
  const logoScale = interpolate(p, [0, 1], [0.72, 1]);
  const logoOp = interpolate(p, [0, 1], [0, 1]);
  const lineW = interpolate(rise(frame, fps, 18, "slide"), [0, 1], [0, 440]);
  const tag = fadeUp(frame, fps, 26, 22, "slide");
  const out = interpolate(frame, [durationInFrames - 16, durationInFrames - 1], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <Stage glowX={0.5} glowY={0.44}>
      <AbsoluteFill
        style={{ justifyContent: "center", alignItems: "center", fontFamily: FONT_SANS, opacity: out }}
      >
        <div
          style={{
            transform: `scale(${logoScale})`,
            opacity: logoOp,
            filter: `drop-shadow(0 24px 70px ${COLORS.brand}55)`,
          }}
        >
          <FullLogo height={132} />
        </div>
        <div
          style={{
            height: 3,
            width: lineW,
            marginTop: 44,
            background: `linear-gradient(90deg, transparent, ${COLORS.logoTeal}, ${COLORS.brand}, transparent)`,
          }}
        />
        <div
          style={{
            marginTop: 28,
            fontSize: 28,
            fontWeight: 400,
            color: COLORS.body,
            opacity: tag.opacity,
            transform: `translateY(${tag.translateY}px)`,
            textAlign: "center",
          }}
        >
          Un solo gestionale per soccorso stradale e autodemolizioni
        </div>
      </AbsoluteFill>
    </Stage>
  );
};
