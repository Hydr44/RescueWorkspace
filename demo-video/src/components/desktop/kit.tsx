import React from "react";
import { COLORS, alpha, RADIUS } from "../../lib/theme";
import { Icon } from "../ui/Icon";

export const Card: React.FC<{
  children: React.ReactNode;
  style?: React.CSSProperties;
  pad?: number;
  radius?: number; // override per schermate arrotondate (Nuovo Trasporto, Fattura, Prima nota)
}> = ({ children, style, pad = 16, radius = RADIUS.lg }) => (
  <div
    style={{
      background: COLORS.card,
      border: `1px solid ${COLORS.border}`,
      borderRadius: radius,
      padding: pad,
      ...style,
    }}
  >
    {children}
  </div>
);

export const PageHeader: React.FC<{
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}> = ({ title, subtitle, right }) => (
  <div
    style={{
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "space-between",
      marginBottom: 18,
    }}
  >
    <div>
      <div style={{ fontSize: 20, fontWeight: 600, color: COLORS.ink }}>{title}</div>
      {subtitle && (
        <div style={{ fontSize: 12.5, color: COLORS.muted, marginTop: 4 }}>
          {subtitle}
        </div>
      )}
    </div>
    {right && <div style={{ display: "flex", gap: 10 }}>{right}</div>}
  </div>
);

export const Btn: React.FC<{
  label: string;
  icon?: string;
  variant?: "primary" | "secondary" | "sand" | "sage" | "green" | "sageSolid";
  glow?: boolean;
  radius?: number;
}> = ({ label, icon, variant = "secondary", glow, radius = RADIUS.md }) => {
  const map = {
    primary: { bg: COLORS.brand, fg: COLORS.white, bd: COLORS.brand },
    sand: { bg: alpha(COLORS.sand[500], 0.16), fg: COLORS.sand[300], bd: alpha(COLORS.sand[500], 0.3) },
    sage: { bg: alpha(COLORS.sage[500], 0.16), fg: COLORS.sage[300], bd: alpha(COLORS.sage[500], 0.3) },
    green: { bg: COLORS.sage[600], fg: COLORS.white, bd: COLORS.sage[600] },
    sageSolid: { bg: COLORS.sage[600], fg: COLORS.white, bd: COLORS.sage[600] },
    secondary: { bg: COLORS.card, fg: COLORS.body, bd: COLORS.border },
  }[variant];
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        height: 34,
        padding: "0 14px",
        fontSize: 12.5,
        fontWeight: 500,
        color: map.fg,
        background: map.bg,
        border: `1px solid ${map.bd}`,
        borderRadius: radius,
        boxShadow: glow ? `0 6px 18px ${alpha(variant === "sageSolid" || variant === "green" ? COLORS.sage[600] : COLORS.brand, 0.35)}` : "none",
        whiteSpace: "nowrap",
      }}
    >
      {icon && <Icon name={icon} size={15} color={map.fg} />}
      {label}
    </div>
  );
};

export const KpiCard: React.FC<{
  title: string;
  value: string;
  icon: string;
  color: string;
  active?: boolean;
  delta?: string;
}> = ({ title, value, icon, color, active, delta }) => (
  <div
    style={{
      flex: 1,
      background: COLORS.card,
      border: `1px solid ${active ? alpha(color, 0.4) : COLORS.border}`,
      borderRadius: RADIUS.lg,
      padding: 16,
    }}
  >
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span
        style={{
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: 1,
          textTransform: "uppercase",
          color: COLORS.muted,
        }}
      >
        {title}
      </span>
      <div
        style={{
          width: 30,
          height: 30,
          borderRadius: 0,
          background: alpha(color, 0.12),
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon name={icon} size={15} color={color} />
      </div>
    </div>
    <div style={{ fontSize: 26, fontWeight: 600, color: COLORS.ink, marginTop: 12 }}>
      {value}
    </div>
    {delta && (
      <div style={{ fontSize: 10.5, color: COLORS.sage[400], marginTop: 4 }}>{delta}</div>
    )}
  </div>
);

/** Header di sezione form: icona colorata + titolo + sottotitolo a destra. */
export const SectionHead: React.FC<{
  icon: string;
  title: string;
  color: string;
  hint?: string;
}> = ({ icon, title, color, hint }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 14,
    }}
  >
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div
        style={{
          width: 30,
          height: 30,
          borderRadius: 0,
          background: alpha(color, 0.14),
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon name={icon} size={16} color={color} />
      </div>
      <span style={{ fontSize: 15, fontWeight: 600, color: COLORS.ink200 }}>{title}</span>
    </div>
    {hint && <span style={{ fontSize: 11.5, color: COLORS.muted }}>{hint}</span>}
  </div>
);

/** Campo form (label + valore in box). */
export const Field: React.FC<{
  label: string;
  value?: string;
  placeholder?: string;
  focus?: boolean;
  mono?: boolean;
  required?: boolean;
  radius?: number;
  bg?: string; // input piu scuro del card per le schermate arrotondate
}> = ({ label, value, placeholder, focus, mono, required, radius = RADIUS.md, bg = COLORS.card }) => (
  <div>
    <div style={{ fontSize: 12, fontWeight: 500, color: COLORS.body, marginBottom: 6 }}>
      {label}
      {required && <span style={{ color: COLORS.danger }}> *</span>}
    </div>
    <div
      style={{
        height: 38,
        display: "flex",
        alignItems: "center",
        padding: "0 12px",
        fontSize: 13,
        fontFamily: mono ? "'JetBrains Mono', monospace" : undefined,
        color: value ? COLORS.ink200 : COLORS.faint,
        background: bg,
        border: `1px solid ${focus ? COLORS.brand : COLORS.border}`,
        borderRadius: radius,
        boxShadow: focus ? `0 0 0 3px ${alpha(COLORS.brand, 0.25)}` : "none",
      }}
    >
      {value || placeholder}
    </div>
  </div>
);
