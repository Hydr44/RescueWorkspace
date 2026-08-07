import {
  interpolate,
  spring,
  Easing,
  interpolateColors,
} from "remotion";

/**
 * Raccolta di helper di animazione riutilizzabili in tutto il video.
 * L'obiettivo e' un movimento "cinematografico": molle morbide, easing
 * naturali, nessuno scatto.
 */

export const SPRING = {
  // Comparsa morbida, poco rimbalzo (elementi UI)
  smooth: { damping: 200, stiffness: 100, mass: 1 },
  // Comparsa con leggero overshoot (badge, pill, icone)
  pop: { damping: 12, stiffness: 140, mass: 0.8 },
  // Movimento pesante e lento (pannelli, telefono che entra)
  slide: { damping: 26, stiffness: 90, mass: 1.1 },
} as const;

/** spring 0->1 con preset e delay (in frame). */
export const rise = (
  frame: number,
  fps: number,
  delay = 0,
  preset: keyof typeof SPRING = "smooth"
) =>
  spring({
    frame: frame - delay,
    fps,
    config: SPRING[preset],
    durationInFrames: undefined,
  });

/** Fade-in + salita di alcuni px, restituisce {opacity, translateY}. */
export const fadeUp = (
  frame: number,
  fps: number,
  delay = 0,
  distance = 24,
  preset: keyof typeof SPRING = "smooth"
) => {
  const p = rise(frame, fps, delay, preset);
  return {
    opacity: interpolate(p, [0, 1], [0, 1], { extrapolateRight: "clamp" }),
    translateY: interpolate(p, [0, 1], [distance, 0]),
    progress: p,
  };
};

/** Ken Burns: zoom/pan lento e continuo su una schermata. */
export const kenBurns = (
  frame: number,
  durationInFrames: number,
  opts?: {
    fromScale?: number;
    toScale?: number;
    fromX?: number;
    toX?: number;
    fromY?: number;
    toY?: number;
  }
) => {
  const {
    fromScale = 1,
    toScale = 1.06,
    fromX = 0,
    toX = 0,
    fromY = 0,
    toY = 0,
  } = opts ?? {};
  const t = interpolate(frame, [0, durationInFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.ease),
  });
  return {
    scale: interpolate(t, [0, 1], [fromScale, toScale]),
    x: interpolate(t, [0, 1], [fromX, toX]),
    y: interpolate(t, [0, 1], [fromY, toY]),
  };
};

/**
 * Zoom "focus": la camera si avvicina a un punto specifico della scena in un
 * intervallo di frame, poi resta. Restituisce transform CSS pronto (origin al
 * centro del target in coordinate 0..1).
 */
export const focusZoom = (
  frame: number,
  fps: number,
  {
    start,
    scale = 1.8,
    originX = 0.5,
    originY = 0.5,
    settle = 18,
  }: {
    start: number;
    scale?: number;
    originX?: number;
    originY?: number;
    settle?: number;
  }
) => {
  const p = spring({
    frame: frame - start,
    fps,
    config: SPRING.slide,
    durationInFrames: settle,
  });
  const s = interpolate(p, [0, 1], [1, scale]);
  return {
    transform: `scale(${s})`,
    transformOrigin: `${originX * 100}% ${originY * 100}%`,
  };
};

export const clampProgress = (
  frame: number,
  start: number,
  duration: number,
  easing = Easing.inOut(Easing.ease)
) =>
  interpolate(frame, [start, start + duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing,
  });

/**
 * Interpola un campo numerico su una lista di keyframe {f, <field>}.
 * Usato per i movimenti di camera (scale/fx/fy) e per animare prop di scena.
 */
export const track = <T extends { f: number }>(
  frame: number,
  keys: T[],
  field: keyof T,
  dflt: number
): number => {
  if (!keys || keys.length === 0) return dflt;
  const arr = keys.map((k) => ({ f: k.f, v: (k[field] as number) ?? dflt }));
  if (frame <= arr[0].f) return arr[0].v;
  if (frame >= arr[arr.length - 1].f) return arr[arr.length - 1].v;
  for (let i = 0; i < arr.length - 1; i++) {
    if (frame >= arr[i].f && frame <= arr[i + 1].f) {
      return interpolate(frame, [arr[i].f, arr[i + 1].f], [arr[i].v, arr[i + 1].v], {
        easing: Easing.inOut(Easing.cubic),
      });
    }
  }
  return dflt;
};

export { interpolate, spring, Easing, interpolateColors };
