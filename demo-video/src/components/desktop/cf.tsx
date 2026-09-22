import React from "react";
import { COLORS, alpha } from "../../lib/theme";
import { Icon } from "../ui/Icon";

/**
 * Kit "datasheet" (cf-*) fedele a src/lib/datasheetStyle.js dell'app reale:
 * tutto SQUADRATO, flat, scuro. Riga = gutter label 130px maiuscolo a destra con
 * hairline verticale + campo. Card con barra blu 3px prima del titolo maiuscolo.
 * Usato da Ricambi (SparePartAddPage) e Cliente (ClientNew).
 */
const S = { surface: COLORS.card, input: COLORS.bg, border: COLORS.border, blue: COLORS.brand, green: COLORS.sage[600], muted: COLORS.muted, txt: COLORS.ink200, txt2: COLORS.body };

export const CfTopbar: React.FC<{ title: string; sub: string; pct: number; primary: string; primaryIcon?: string }> = ({ title, sub, pct, primary, primaryIcon = "check" }) => {
  const ringColor = pct >= 80 ? COLORS.success : pct >= 50 ? COLORS.warning : COLORS.muted;
  const C = 2 * Math.PI * 13;
  return (
    <div style={{ height: 54, display: "flex", alignItems: "center", gap: 12, borderBottom: `1px solid ${S.border}`, marginBottom: 14, paddingRight: 2 }}>
      <div style={{ width: 34, height: 34, background: S.input, border: `1px solid ${S.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon name="arrowLeft" size={16} color={S.txt2} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: COLORS.ink }}>{title}</div>
        <div style={{ fontSize: 11, color: S.muted, marginTop: 1 }}>{sub}</div>
      </div>
      {/* completion ring */}
      <div style={{ position: "relative", width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg width={34} height={34} viewBox="0 0 34 34" style={{ transform: "rotate(-90deg)" }}>
          <circle cx={17} cy={17} r={13} fill="none" stroke={S.border} strokeWidth={3} />
          <circle cx={17} cy={17} r={13} fill="none" stroke={ringColor} strokeWidth={3} strokeDasharray={`${(pct / 100) * C} ${C}`} strokeLinecap="round" />
        </svg>
        <span style={{ position: "absolute", fontSize: 9, fontWeight: 700, color: ringColor }}>{pct}%</span>
      </div>
      <div style={{ display: "inline-flex", alignItems: "center", height: 34, padding: "0 12px", fontSize: 12, color: S.txt2, background: S.surface, border: `1px solid ${S.border}` }}>Annulla</div>
      <div style={{ display: "inline-flex", alignItems: "center", gap: 8, height: 34, padding: "0 14px", fontSize: 12, fontWeight: 600, color: "#fff", background: S.blue }}>
        <Icon name={primaryIcon} size={14} color="#fff" /> {primary}
      </div>
    </div>
  );
};

export const CfCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div style={{ background: S.surface, border: `1px solid ${S.border}`, marginBottom: 12 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "11px 14px", borderBottom: `1px solid ${S.border}` }}>
      <div style={{ width: 3, height: 13, background: S.blue }} />
      <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: 1.1, textTransform: "uppercase", color: S.txt2 }}>{title}</span>
    </div>
    <div>{children}</div>
  </div>
);

/** Cella label+campo (usata dentro le righe). */
const Cell: React.FC<{ label: string; children: React.ReactNode; borderLeft?: boolean }> = ({ label, children, borderLeft }) => (
  <div style={{ display: "flex", alignItems: "stretch", minHeight: 42, borderLeft: borderLeft ? `1px solid ${S.border}` : undefined }}>
    <div style={{ width: 130, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "flex-end", padding: "0 12px", borderRight: `1px solid ${S.border}`, fontSize: 10, fontWeight: 600, letterSpacing: 0.7, textTransform: "uppercase", color: S.muted, textAlign: "right" }}>{label}</div>
    <div style={{ flex: 1, display: "flex", alignItems: "center", padding: "6px 10px", minWidth: 0 }}>{children}</div>
  </div>
);

export const CfRowFull: React.FC<{ label: string; children: React.ReactNode; first?: boolean }> = ({ label, children, first }) => (
  <div style={{ borderTop: first ? "none" : `1px solid ${S.border}` }}>
    <Cell label={label}>{children}</Cell>
  </div>
);

export const CfRow2: React.FC<{ l1: string; c1: React.ReactNode; l2: string; c2: React.ReactNode; first?: boolean }> = ({ l1, c1, l2, c2, first }) => (
  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderTop: first ? "none" : `1px solid ${S.border}` }}>
    <Cell label={l1}>{c1}</Cell>
    <Cell label={l2} borderLeft>{c2}</Cell>
  </div>
);

/** Valore campo (input datasheet). */
export const CfVal: React.FC<{ value: string; mono?: boolean; muted?: boolean; focus?: boolean; ph?: boolean }> = ({ value, mono, muted, focus, ph }) => (
  <div style={{ width: "100%", height: 32, display: "flex", alignItems: "center", padding: "0 10px", fontSize: 12.5, fontFamily: mono ? "'JetBrains Mono', monospace" : undefined, color: ph ? COLORS.placeholder : muted ? S.muted : S.txt, background: S.input, border: `1px solid ${focus ? S.blue : S.border}`, boxShadow: focus ? `0 0 0 2px ${alpha(S.blue, 0.35)}` : "none" }}>{value}</div>
);

/** Toggle segmentato squadrato (es. Azienda/Privato, Usato/Rigenerato/Nuovo). */
export const CfSegment: React.FC<{ options: string[]; active: number }> = ({ options, active }) => (
  <div style={{ display: "inline-flex", border: `1px solid ${S.border}` }}>
    {options.map((o, i) => (
      <div key={o} style={{ padding: "6px 14px", fontSize: 12, fontWeight: 500, color: i === active ? "#fff" : S.txt2, background: i === active ? S.blue : S.input, borderLeft: i > 0 ? `1px solid ${S.border}` : undefined }}>{o}</div>
    ))}
  </div>
);

export const CfGreenBtn: React.FC<{ label: string; icon?: string }> = ({ label, icon = "zap" }) => (
  <div style={{ display: "inline-flex", alignItems: "center", gap: 5, height: 26, padding: "0 9px", fontSize: 11, fontWeight: 600, color: "#fff", background: S.green }}>
    <Icon name={icon} size={12} color="#fff" /> {label}
  </div>
);

export const CfFooter: React.FC<{ hints?: string; primary: string; primaryIcon?: string; secondary?: string }> = ({ hints = "* Obbligatori   ⌘S Salva   Esc Esci", primary, primaryIcon = "check", secondary = "Annulla" }) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 52, padding: "0 4px", borderTop: `1px solid ${S.border}`, marginTop: 4 }}>
    <span style={{ fontSize: 10.5, color: S.muted }}>{hints}</span>
    <div style={{ display: "flex", gap: 10 }}>
      <div style={{ display: "inline-flex", alignItems: "center", height: 34, padding: "0 14px", fontSize: 12, color: S.txt2, background: S.surface, border: `1px solid ${S.border}` }}>{secondary}</div>
      <div style={{ display: "inline-flex", alignItems: "center", gap: 8, height: 34, padding: "0 16px", fontSize: 12, fontWeight: 600, color: "#fff", background: S.blue }}>
        <Icon name={primaryIcon} size={14} color="#fff" /> {primary}
      </div>
    </div>
  </div>
);

export const CF_COLORS = S;
