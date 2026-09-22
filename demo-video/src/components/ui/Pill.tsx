import React from "react";
import { alpha } from "../../lib/theme";

/**
 * Pill di stato stile desktop (dark): testo tinta, fondo tinta/10, bordo tinta/20.
 * Con `dotColor` la pill diventa NEUTRA (grigia) con solo il pallino colorato,
 * come il badge tipologia reale ("un solo segnale").
 */
export const DesktopPill: React.FC<{
  label: string;
  color: string;
  size?: number;
  dot?: boolean;
  dotColor?: string;
  uppercase?: boolean;
}> = ({ label, color, size = 12, dot = false, dotColor, uppercase = true }) => {
  const neutral = "#8595ab";
  const base = dotColor ? neutral : color;
  const pip = dotColor ?? color;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        fontSize: size,
        fontWeight: 600,
        letterSpacing: uppercase ? 0.6 : 0,
        textTransform: uppercase ? "uppercase" : "none",
        color: base,
        background: alpha(base, 0.1),
        border: `1px solid ${alpha(base, 0.22)}`,
        borderRadius: 0,
        padding: `5px 11px`,
        lineHeight: 1,
      }}
    >
      {(dot || dotColor) && (
        <span style={{ width: 7, height: 7, borderRadius: "50%", background: pip }} />
      )}
      {label}
    </span>
  );
};

/** Pill di stato stile mobile (fondo scuro pieno + testo tinta, squadrata). */
export const MobilePill: React.FC<{
  label: string;
  bg: string;
  fg: string;
  size?: number;
}> = ({ label, bg, fg, size = 13 }) => (
  <span
    style={{
      display: "inline-flex",
      alignItems: "center",
      fontSize: size,
      fontWeight: 500,
      color: fg,
      background: bg,
      padding: "5px 11px",
      lineHeight: 1,
    }}
  >
    {label}
  </span>
);
