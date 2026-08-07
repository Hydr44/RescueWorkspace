import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { Stage } from "../components/ui/Stage";
import { LogoMark } from "../components/ui/Logo";
import { Icon } from "../components/ui/Icon";
import { COLORS, alpha } from "../lib/theme";
import { FONT_SANS } from "../lib/fonts";
import { rise, fadeUp, interpolate } from "../lib/anim";

const CHIPS = [
  { l: "Soccorso stradale", i: "navigation" },
  { l: "Trasporti", i: "truck" },
  { l: "Demolizioni VFU", i: "recycle" },
  { l: "Rifiuti RENTRI", i: "trash2" },
  { l: "Fatturazione", i: "euro" },
];

export const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const markP = rise(frame, fps, 2, "pop");
  const title = fadeUp(frame, fps, 14, 26, "slide");
  const url = fadeUp(frame, fps, 46, 20, "slide");

  return (
    <Stage glowX={0.5} glowY={0.4}>
      <AbsoluteFill
        style={{ justifyContent: "center", alignItems: "center", fontFamily: FONT_SANS }}
      >
        <div style={{ transform: `scale(${interpolate(markP, [0, 1], [0.5, 1])})`, marginBottom: 26 }}>
          <LogoMark size={92} />
        </div>
        <div
          style={{
            fontSize: 52,
            fontWeight: 700,
            letterSpacing: -1,
            color: COLORS.ink,
            textAlign: "center",
            opacity: title.opacity,
            transform: `translateY(${title.translateY}px)`,
          }}
        >
          Un'unica piattaforma.{" "}
          <span style={{ color: COLORS.brandHover }}>Tutta la tua attività.</span>
        </div>

        <div style={{ display: "flex", gap: 14, marginTop: 40, flexWrap: "wrap", justifyContent: "center", maxWidth: 1200 }}>
          {CHIPS.map((c, i) => {
            const p = fadeUp(frame, fps, 24 + i * 5, 18, "pop");
            return (
              <div
                key={c.l}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 11,
                  padding: "13px 22px",
                  borderRadius: 0,
                  background: alpha(COLORS.brand, 0.12),
                  border: `1px solid ${alpha(COLORS.brand, 0.28)}`,
                  fontSize: 21,
                  fontWeight: 500,
                  color: COLORS.ink200,
                  opacity: p.opacity,
                  transform: `translateY(${p.translateY}px)`,
                }}
              >
                <Icon name={c.i} size={20} color={COLORS.blue400} />
                {c.l}
              </div>
            );
          })}
        </div>

        <div
          style={{
            marginTop: 52,
            fontSize: 30,
            fontWeight: 600,
            color: COLORS.white,
            letterSpacing: 0.5,
            opacity: url.opacity,
            transform: `translateY(${url.translateY}px)`,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <span style={{ color: COLORS.brandHover }}>›</span> rescuemanager.eu
        </div>
      </AbsoluteFill>
    </Stage>
  );
};
