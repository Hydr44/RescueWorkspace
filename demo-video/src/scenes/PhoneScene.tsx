import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { Stage } from "../components/ui/Stage";
import { PhoneFrame, PHONE_W, PHONE_H } from "../components/mobile/PhoneFrame";
import { COLORS } from "../lib/theme";
import { FONT_SANS } from "../lib/fonts";
import { track, rise, fadeUp, interpolate } from "../lib/anim";

export type PhoneCam = { f: number; scale?: number; fy?: number };
export type Side = { kicker?: string; text: string; sub?: string };

const SideView: React.FC<{ side: Side; opacity: number; shift: number }> = ({ side, opacity, shift }) => (
  <div
    style={{
      position: "absolute",
      left: 130,
      top: 0,
      bottom: 0,
      width: 820,
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      fontFamily: FONT_SANS,
      opacity,
      transform: `translateY(${shift}px)`,
    }}
  >
    {side.kicker && (
      <div style={{ fontSize: 17, fontWeight: 600, letterSpacing: 3.5, textTransform: "uppercase", color: COLORS.blue400, marginBottom: 18 }}>
        {side.kicker}
      </div>
    )}
    <div style={{ fontSize: 60, fontWeight: 700, lineHeight: 1.08, letterSpacing: -1.5, color: COLORS.ink }}>
      {side.text}
    </div>
    {side.sub && (
      <div style={{ marginTop: 22, fontSize: 26, lineHeight: 1.4, color: COLORS.body, maxWidth: 640 }}>
        {side.sub}
      </div>
    )}
  </div>
);

const SingleSide: React.FC<{ side: Side }> = ({ side }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const a = fadeUp(frame, fps, 6, 26, "slide");
  const out = interpolate(frame, [durationInFrames - 14, durationInFrames - 2], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return <SideView side={side} opacity={Math.min(a.opacity, out)} shift={a.translateY} />;
};

const SeqSide: React.FC<{ sides: Side[] }> = ({ sides }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const seg = durationInFrames / sides.length;
  const idx = Math.min(sides.length - 1, Math.floor(frame / seg));
  const local = frame - idx * seg;
  const isLast = idx === sides.length - 1;
  const inA = interpolate(local, [0, 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const shift = interpolate(local, [0, 12], [24, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const out = isLast ? 1 : interpolate(local, [seg - 16, seg - 4], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return <SideView side={sides[idx]} opacity={Math.min(inA, out)} shift={shift} />;
};

/** Scena mobile: telefono grande a destra, testo feature a sinistra (singolo o in sequenza). */
export const PhoneScene: React.FC<{
  children: React.ReactNode;
  side?: Side;
  sides?: Side[];
  camera?: PhoneCam[];
  overlay?: React.ReactNode;
  glow?: { x: number; y: number };
}> = ({ children, side, sides, camera, overlay, glow }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const enter = rise(frame, fps, 0, "slide");
  const enterX = interpolate(enter, [0, 1], [80, 0]);
  const opacity = interpolate(enter, [0, 1], [0, 1]);
  const float = Math.sin(frame / 46) * 6;

  const idleZoom = interpolate(frame, [0, durationInFrames], [1, 1.06], { extrapolateRight: "clamp" });
  const camScale = track(frame, camera ?? [{ f: 0, scale: 1 }], "scale", 1) * idleZoom;
  const fy = track(frame, camera ?? [{ f: 0, fy: 0.5 }], "fy", 0.5);
  const dy = (fy * PHONE_H - PHONE_H / 2) * camScale;

  return (
    <Stage glowX={glow?.x ?? 0.72} glowY={glow?.y ?? 0.45}>
      {sides ? <SeqSide sides={sides} /> : side ? <SingleSide side={side} /> : null}
      <AbsoluteFill>
        <div
          style={{
            position: "absolute",
            left: 1408,
            top: (1080 - PHONE_H) / 2,
            width: PHONE_W,
            height: PHONE_H,
            transform: `translate(${enterX}px, ${float - dy}px) scale(${camScale})`,
            transformOrigin: "center center",
            opacity,
          }}
        >
          <div style={{ position: "relative", width: PHONE_W, height: PHONE_H }}>
            <PhoneFrame>{children}</PhoneFrame>
            {overlay}
          </div>
        </div>
      </AbsoluteFill>
    </Stage>
  );
};
