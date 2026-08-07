import React from "react";
import { useCurrentFrame, useVideoConfig, spring } from "remotion";
import { interpolate, Easing } from "../../lib/anim";

export type CursorKey = { f: number; x: number; y: number };

/**
 * Cursore del mouse animato (coordinate in px sullo schermo del video).
 * Si muove tra i keyframe con easing morbido e mostra un "ripple" ai click.
 */
export const Cursor: React.FC<{
  keys: CursorKey[];
  clicks?: number[];
  scale?: number;
  hidden?: boolean;
}> = ({ keys, clicks = [], scale = 1, hidden }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (hidden || keys.length === 0) return null;

  // posizione piecewise tra keyframe
  let x = keys[0].x;
  let y = keys[0].y;
  if (frame <= keys[0].f) {
    x = keys[0].x;
    y = keys[0].y;
  } else if (frame >= keys[keys.length - 1].f) {
    x = keys[keys.length - 1].x;
    y = keys[keys.length - 1].y;
  } else {
    for (let i = 0; i < keys.length - 1; i++) {
      const a = keys[i];
      const b = keys[i + 1];
      if (frame >= a.f && frame <= b.f) {
        const t = interpolate(frame, [a.f, b.f], [0, 1], {
          easing: Easing.inOut(Easing.cubic),
        });
        x = interpolate(t, [0, 1], [a.x, b.x]);
        y = interpolate(t, [0, 1], [a.y, b.y]);
        break;
      }
    }
  }

  // click: piccola compressione del puntatore + ripple
  let press = 0;
  let ripple: { p: number } | null = null;
  for (const c of clicks) {
    if (frame >= c - 3 && frame <= c + 3) {
      press = Math.max(press, 1 - Math.abs(frame - c) / 3);
    }
    if (frame >= c && frame <= c + 18) {
      ripple = {
        p: spring({ frame: frame - c, fps, config: { damping: 200 }, durationInFrames: 18 }),
      };
    }
  }

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        transform: `translate(${x}px, ${y}px)`,
        zIndex: 9999,
        pointerEvents: "none",
        filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.5))",
      }}
    >
      {ripple && (
        <div
          style={{
            position: "absolute",
            left: -2,
            top: -2,
            width: 44,
            height: 44,
            marginLeft: -22 + 2,
            marginTop: -22 + 2,
            borderRadius: "50%",
            border: "2px solid rgba(96,165,250,0.9)",
            transform: `scale(${interpolate(ripple.p, [0, 1], [0.2, 1.3])})`,
            opacity: interpolate(ripple.p, [0, 1], [0.7, 0]),
          }}
        />
      )}
      <svg
        width={30 * scale}
        height={30 * scale}
        viewBox="0 0 24 24"
        style={{ transform: `scale(${1 - press * 0.15})`, transformOrigin: "4px 2px" }}
      >
        <path
          d="M4 2 L4 20 L9 15 L12 21.5 L14.8 20.3 L11.8 14 L18.5 14 Z"
          fill="#ffffff"
          stroke="rgba(2,6,23,0.75)"
          strokeWidth={1.2}
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};
