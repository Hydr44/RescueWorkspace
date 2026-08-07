import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { Stage } from "../components/ui/Stage";
import { Caption, SeqCaption } from "../components/ui/Caption";
import { Cursor, CursorKey } from "../components/ui/Cursor";
import { DesktopFrame, DESKTOP_W, DESKTOP_H } from "../components/desktop/DesktopFrame";
import { track, rise, interpolate } from "../lib/anim";

const BASE_SCALE = 0.9;

export type CameraKey = { f: number; scale?: number; fx?: number; fy?: number };

/**
 * Scena desktop: Stage + finestra macOS con camera cinematica (zoom/pan verso
 * un punto della UI), cursore animato e didascalia (singola o in sequenza).
 * Se `camera` non è fornita, applica un lento drift continuo su tutta la durata.
 */
export const DesktopScene: React.FC<{
  active: string;
  crumbs: string[];
  children: React.ReactNode;
  caption?: { kicker?: string; text: string; outAt?: number };
  captions?: { kicker?: string; text: string }[];
  camera?: CameraKey[];
  cursor?: { keys: CursorKey[]; clicks?: number[] };
  glow?: { x: number; y: number };
}> = ({ active, crumbs, children, caption, captions, camera, cursor, glow }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const enter = rise(frame, fps, 0, "slide");
  const enterScale = interpolate(enter, [0, 1], [0.965, 1]);
  const opacity = interpolate(enter, [0, 1], [0, 1]);

  let camScale: number;
  let fx: number;
  let fy: number;
  if (camera) {
    camScale = track(frame, camera, "scale", 1);
    fx = track(frame, camera, "fx", 0.5);
    fy = track(frame, camera, "fy", 0.5);
  } else {
    // drift automatico continuo sull'intera durata (per beat lunghi)
    camScale = interpolate(frame, [0, durationInFrames], [1.0, 1.09], { extrapolateRight: "clamp" });
    fx = 0.5;
    fy = interpolate(frame, [0, durationInFrames], [0.47, 0.56], { extrapolateRight: "clamp" });
  }

  const s = BASE_SCALE * camScale * enterScale;
  const dx = fx * DESKTOP_W - DESKTOP_W / 2;
  const dy = fy * DESKTOP_H - DESKTOP_H / 2;

  return (
    <Stage glowX={glow?.x ?? 0.5} glowY={glow?.y ?? 0.4}>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div
          style={{
            width: DESKTOP_W,
            height: DESKTOP_H,
            position: "relative",
            transform: `scale(${s}) translate(${-dx}px, ${-dy}px)`,
            transformOrigin: "center center",
            opacity,
          }}
        >
          <DesktopFrame active={active} crumbs={crumbs}>
            {children}
          </DesktopFrame>
          {cursor && <Cursor keys={cursor.keys} clicks={cursor.clicks} scale={1.4} />}
        </div>
      </AbsoluteFill>
      {captions ? (
        <SeqCaption items={captions} />
      ) : caption ? (
        <Caption kicker={caption.kicker} text={caption.text} outAt={caption.outAt} />
      ) : null}
    </Stage>
  );
};
