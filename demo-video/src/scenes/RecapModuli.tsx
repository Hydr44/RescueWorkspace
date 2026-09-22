import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { Stage } from "../components/ui/Stage";
import { Icon } from "../components/ui/Icon";
import { COLORS, alpha } from "../lib/theme";
import { FONT_SANS } from "../lib/fonts";
import { fadeUp, interpolate } from "../lib/anim";

const MODULES = [
  { icon: "truck", label: "Soccorso & trasporti", desc: "Interventi, listini, assegnazioni", color: COLORS.blue400 },
  { icon: "navigation", label: "Tracking GPS", desc: "Flotta in tempo reale", color: COLORS.plum[400] },
  { icon: "recycle", label: "Demolizioni VFU", desc: "Registro ACI/MIT e lavorazione", color: COLORS.sage[400] },
  { icon: "trash2", label: "Rifiuti RENTRI", desc: "Carico/scarico e trasmissioni", color: COLORS.sand[400] },
  { icon: "mapPin", label: "Custodia veicoli", desc: "Piazzale e posizioni", color: COLORS.blue400 },
  { icon: "wrench", label: "Ricambi", desc: "Magazzino e ricerca", color: COLORS.plum[400] },
  { icon: "euro", label: "Fatturazione", desc: "Fattura elettronica SdI", color: COLORS.sage[400] },
  { icon: "phone", label: "App autista", desc: "Navigazione, foto, firma", color: COLORS.sand[400] },
];

export const RecapModuli: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const title = fadeUp(frame, fps, 6, 26, "slide");
  const out = interpolate(frame, [durationInFrames - 16, durationInFrames - 2], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <Stage glowX={0.5} glowY={0.38}>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", fontFamily: FONT_SANS, opacity: out }}>
        <div
          style={{
            fontSize: 46,
            fontWeight: 700,
            letterSpacing: -1,
            color: COLORS.ink,
            textAlign: "center",
            opacity: title.opacity,
            transform: `translateY(${title.translateY}px)`,
            marginBottom: 48,
          }}
        >
          Un'unica piattaforma per <span style={{ color: COLORS.brandHover }}>tutta la tua attività</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 300px)", gap: 20 }}>
          {MODULES.map((m, i) => {
            const p = fadeUp(frame, fps, 18 + i * 6, 26, "pop");
            return (
              <div
                key={m.label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  padding: "20px 22px",
                  background: alpha(COLORS.card, 0.9),
                  border: `1px solid ${COLORS.border}`,
                  opacity: p.opacity,
                  transform: `translateY(${p.translateY}px)`,
                }}
              >
                <div style={{ width: 48, height: 48, background: alpha(m.color, 0.14), display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon name={m.icon} size={24} color={m.color} />
                </div>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 600, color: COLORS.ink200 }}>{m.label}</div>
                  <div style={{ fontSize: 13.5, color: COLORS.muted, marginTop: 3 }}>{m.desc}</div>
                </div>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </Stage>
  );
};
