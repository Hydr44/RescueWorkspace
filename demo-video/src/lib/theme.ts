/**
 * Design tokens del video, allineati 1:1 allo stile reale di RescueManager
 * Desktop (tema "Navy Dark", sempre attivo).  Valori estratti da
 * src/index.css / tailwind.config.js / design-tokens.css dell'app reale.
 */

export const COLORS = {
  // ---- Chrome / navy strutturale (valori esatti dell'app) ----
  sidebar: "#0c1929", // sidebar + status bar
  bg: "#141c27", // background app / content
  card: "#1a2536", // card, pannelli, topbar
  border: "#243044", // bordo standard
  borderHover: "#2d3d56",
  hoverFill: "#1e2b3d", // hover bottoni scuri

  // ---- Brand ----
  brand: "#2563eb", // blu brand UI (blue-600)
  brandHover: "#3b82f6", // blue-500
  logoBlue: "#005dfa", // blu del logo
  logoTeal: "#29b7ae", // teal del logo (goccia)

  // ---- Testo (slate, dark mode) ----
  ink: "#f1f5f9", // slate-100 titoli forti
  ink200: "#e2e8f0", // slate-200
  body: "#cbd5e1", // slate-300 body
  muted: "#64748b", // slate-500 secondario
  faint: "#475569", // slate-600 molto tenue
  placeholder: "#475569",

  // ---- Palette MUTED (moduli / stati) ----
  // sage = success/positivo (verde desaturato)
  sage: {
    300: "#95b6a0",
    400: "#78a184",
    500: "#5e8a6b",
    600: "#4c7057",
  },
  // plum = accento secondario / focus (viola desaturato)
  plum: {
    300: "#aa9fc6",
    400: "#897fb5",
    500: "#6d6299",
    600: "#584f7d",
  },
  // sand = warning / demo (ambra desaturato)
  sand: {
    300: "#d2b77e",
    400: "#c2a262",
    500: "#a8894b",
    600: "#8a6f3d",
  },

  // ---- Stati "puri" ----
  success: "#10B981",
  warning: "#F59E0B",
  danger: "#EF4444",
  dangerBtn: "#DC2626",
  info: "#3B82F6",

  // slate estesi per marker/dettagli
  slate400: "#829ab1",
  slate600: "#486581",
  blue200: "#bfdbfe",
  blue300: "#93c5fd",
  blue400: "#60a5fa",

  white: "#ffffff",
  black: "#000000",

  // ---- Stage cinematografico (dietro i dispositivi) ----
  stageTop: "#0a1220",
  stageBottom: "#060a12",
  stageGlow: "#12244a",
} as const;

/** rgba helper per i pattern bg-{c}-500/10, border-{c}-500/20 ecc. */
export const alpha = (hex: string, a: number) => {
  const h = hex.replace("#", "");
  const r = Number.parseInt(h.substring(0, 2), 16);
  const g = Number.parseInt(h.substring(2, 4), 16);
  const b = Number.parseInt(h.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
};

// L'app reale è "tutta squadrata" (border-radius 0 ovunque). I raggi restano
// solo su elementi hardware/OS (finestra macOS, telefono) e su piccoli LED/pip.
export const RADIUS = {
  md: 0,
  lg: 0,
  xl: 0,
  pill: 0,
};

export const SHADOW = {
  card: "0 1px 2px rgba(0,0,0,0.20), 0 8px 24px rgba(0,0,0,0.25)",
  float: "0 18px 50px rgba(2,6,23,0.55)",
  device: "0 50px 130px rgba(0,0,0,0.65)",
  phone: "0 40px 90px rgba(0,0,0,0.7)",
  glowBrand: "0 8px 30px rgba(37,99,235,0.35)",
};

export const FONT = {
  sans: "Inter, system-ui, -apple-system, sans-serif",
  mono: "'JetBrains Mono', 'Fira Code', Monaco, monospace",
};

/** Dimensioni chrome reali dell'app desktop. */
export const CHROME = {
  sidebar: 250,
  topbar: 48,
  statusbar: 32,
  brandHeader: 80,
};

export const VIDEO = {
  width: 1920,
  height: 1080,
  fps: 30,
};

/**
 * Palette app MOBILE (design system "blu notte", RescueMobile/tailwind.config.js).
 * Regole reali: superfici piatte, bordi 0.5px, border-radius 0 (squadrato),
 * nessuna ombra, font Inter con soli pesi 400/500.
 */
export const MOBILE = {
  bg: "#0A0F1A",
  side: "#070B14",
  card: "#121A2B",
  elevated: "#0E1626",
  border: "#1F2A40",
  borderAccent: "#1D3A63",
  textPrimary: "#ECF1F8",
  textSecondary: "#B4C0D3",
  textMuted: "#7C8AA3",
  brand: "#2B7FF6",
  brandHover: "#2169D7",
  success: "#2FD4A0",
  warning: "#F2AE52",
  error: "#F26A5E",
  purple: "#9C8CF4",
  gray: "#9CABC2",
  greenSave: "#1F8A5B",
  pickup: "#5AA0FF", // quadratino ritiro
  dropoff: "#37DBAA", // quadratino consegna
  whatsapp: "#25D366",
} as const;

/** Stati trasporto lato MOBILE (statusColors.ts): pill fondo scuro + testo tinta. */
export const MOBILE_STATUS = {
  new: { label: "Nuovo", bg: "#13294A", fg: "#6E97C4" },
  assigned: { label: "Assegnato", bg: "#2E2614", fg: "#C9A56E" },
  enroute: { label: "In Viaggio", bg: "#231E3E", fg: "#9B95C2" },
  done: { label: "Consegnato", bg: "#0F2E25", fg: "#5EB397" },
  canceled: { label: "Annullato", bg: "#2E1614", fg: "#CE8B82" },
} as const;

/** Colori di stato trasporto (StatusBadge reale). */
export const TRANSPORT_STATUS = {
  new: { label: "Da Fare", color: COLORS.sand[400] },
  assigned: { label: "Assegnato", color: COLORS.slate400 },
  enroute: { label: "In Viaggio", color: COLORS.brandHover },
  inprogress: { label: "In Corso", color: COLORS.brandHover },
  done: { label: "Completato", color: COLORS.sage[400] },
} as const;
