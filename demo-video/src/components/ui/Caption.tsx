import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, FONT, SHADOW, alpha } from "../../lib/theme";
import { FONT_SANS } from "../../lib/fonts";
import { fadeUp, interpolate, rise } from "../../lib/anim";

/**
 * Didascalia "lower-third" in basso: barra accent + kicker + testo narrativo.
 * Entra morbida e (opzionale) esce prima della fine della sequenza.
 */
export const Caption: React.FC<{
  kicker?: string;
  text: string;
  align?: "left" | "center";
  outAt?: number; // frame locale in cui iniziare l'uscita
}> = ({ kicker, text, align = "left", outAt }) => {
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();
  const inA = fadeUp(frame, fps, 4, 30, "slide");
  const exitStart = outAt ?? durationInFrames - 14;
  const out = interpolate(frame, [exitStart, exitStart + 12], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const opacity = Math.min(inA.opacity, out);

  return (
    <AbsoluteFill
      style={{
        justifyContent: "flex-end",
        alignItems: align === "center" ? "center" : "flex-start",
        padding: "0 0 74px 84px",
        fontFamily: FONT_SANS || FONT.sans,
      }}
    >
      <div
        style={{
          opacity,
          transform: `translateY(${inA.translateY}px)`,
          display: "flex",
          alignItems: "stretch",
          gap: 20,
          maxWidth: 1180,
          background: "rgba(10,15,26,0.72)",
          backdropFilter: "blur(10px)",
          border: `1px solid ${alpha(COLORS.white, 0.08)}`,
          borderRadius: 0,
          padding: "22px 30px 24px 24px",
          boxShadow: SHADOW.float,
        }}
      >
        <div
          style={{
            width: 5,
            borderRadius: 0,
            background: `linear-gradient(${COLORS.logoTeal}, ${COLORS.brand})`,
          }}
        />
        <div>
          {kicker && (
            <div
              style={{
                fontSize: 15,
                fontWeight: 600,
                letterSpacing: 3,
                textTransform: "uppercase",
                color: COLORS.blue400,
                marginBottom: 8,
              }}
            >
              {kicker}
            </div>
          )}
          <div
            style={{
              fontSize: 34,
              lineHeight: 1.22,
              fontWeight: 600,
              color: COLORS.ink,
              letterSpacing: -0.3,
            }}
          >
            {text}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

/**
 * Sequenza di didascalie: divide la durata della scena in N parti e mostra
 * una didascalia per parte (fade in/out). Per i beat lunghi del video da 5'.
 */
export const SeqCaption: React.FC<{
  items: { kicker?: string; text: string }[];
  align?: "left" | "center";
}> = ({ items, align = "left" }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  if (items.length === 0) return null;
  const seg = durationInFrames / items.length;
  const idx = Math.min(items.length - 1, Math.floor(frame / seg));
  const local = frame - idx * seg;
  const isLast = idx === items.length - 1;
  const inA = interpolate(local, [0, 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const rise = interpolate(local, [0, 12], [26, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const out = isLast
    ? 1
    : interpolate(local, [seg - 16, seg - 4], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const opacity = Math.min(inA, out);
  const it = items[idx];

  return (
    <AbsoluteFill
      style={{
        justifyContent: "flex-end",
        alignItems: align === "center" ? "center" : "flex-start",
        padding: "0 0 74px 84px",
        fontFamily: FONT_SANS || FONT.sans,
      }}
    >
      <div
        style={{
          opacity,
          transform: `translateY(${rise}px)`,
          display: "flex",
          alignItems: "stretch",
          gap: 20,
          maxWidth: 1180,
          background: "rgba(10,15,26,0.72)",
          backdropFilter: "blur(10px)",
          border: `1px solid ${alpha(COLORS.white, 0.08)}`,
          borderRadius: 0,
          padding: "22px 30px 24px 24px",
          boxShadow: SHADOW.float,
        }}
      >
        <div style={{ width: 5, background: `linear-gradient(${COLORS.logoTeal}, ${COLORS.brand})` }} />
        <div>
          {it.kicker && (
            <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: 3, textTransform: "uppercase", color: COLORS.blue400, marginBottom: 8 }}>
              {it.kicker}
            </div>
          )}
          <div style={{ fontSize: 34, lineHeight: 1.22, fontWeight: 600, color: COLORS.ink, letterSpacing: -0.3 }}>
            {it.text}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** Cartello capitolo a tutto schermo. */
export const ChapterCard: React.FC<{
  index: string;
  title: string;
  subtitle?: string;
  accent?: string;
}> = ({ index, title, subtitle, accent = COLORS.brand }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const p = rise(frame, fps, 0, "slide");
  const line = interpolate(p, [0, 1], [0, 560]);
  const out = interpolate(
    frame,
    [durationInFrames - 16, durationInFrames - 2],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const t1 = fadeUp(frame, fps, 6, 26, "slide");
  const t2 = fadeUp(frame, fps, 14, 22, "slide");

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "flex-start",
        padding: "0 0 0 180px",
        fontFamily: FONT_SANS || FONT.sans,
        opacity: out,
      }}
    >
      {index ? (
        <div
          style={{
            fontSize: 190,
            fontWeight: 700,
            lineHeight: 1,
            color: alpha(accent, 0.16),
            letterSpacing: -6,
            marginBottom: 6,
            transform: `translateY(${interpolate(p, [0, 1], [40, 0])}px)`,
          }}
        >
          {index}
        </div>
      ) : null}
      <div
        style={{
          height: 4,
          width: line,
          background: `linear-gradient(90deg, ${accent}, transparent)`,
          borderRadius: 0,
          marginBottom: 26,
        }}
      />
      <div
        style={{
          fontSize: 74,
          fontWeight: 700,
          color: COLORS.ink,
          letterSpacing: -1.5,
          opacity: t1.opacity,
          transform: `translateY(${t1.translateY}px)`,
        }}
      >
        {title}
      </div>
      {subtitle && (
        <div
          style={{
            marginTop: 18,
            fontSize: 30,
            fontWeight: 400,
            color: COLORS.body,
            opacity: t2.opacity,
            transform: `translateY(${t2.translateY}px)`,
          }}
        >
          {subtitle}
        </div>
      )}
    </AbsoluteFill>
  );
};
