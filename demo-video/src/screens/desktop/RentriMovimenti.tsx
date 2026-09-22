import React from "react";
import { COLORS, alpha, RADIUS } from "../../lib/theme";
import { Btn, PageHeader, KpiCard } from "../../components/desktop/kit";
import { DesktopPill } from "../../components/ui/Pill";
import { Icon } from "../../components/ui/Icon";

type Row = { data: string; tipo: "Carico" | "Scarico"; cer: string; desc: string; qta: string; st: string };

const ST: Record<string, { l: string; c: string }> = {
  pending: { l: "Da trasmettere", c: COLORS.sand[400] },
  sent: { l: "Trasmesso", c: COLORS.sage[400] },
  rentri: { l: "RENTRI", c: COLORS.sage[400] },
};

export const RentriMovimenti: React.FC<{ transmitted?: boolean; toast?: string }> = ({
  transmitted,
  toast,
}) => {
  const rows: Row[] = [
    { data: "03/08", tipo: "Carico", cer: "16 01 04*", desc: "Veicolo fuori uso", qta: "980 kg", st: transmitted ? "sent" : "pending" },
    { data: "03/08", tipo: "Carico", cer: "16 06 01*", desc: "Batterie al piombo", qta: "14 kg", st: "sent" },
    { data: "03/08", tipo: "Carico", cer: "13 02 05*", desc: "Oli minerali motore", qta: "8 kg", st: "sent" },
    { data: "03/08", tipo: "Carico", cer: "16 01 13*", desc: "Liquidi per freni", qta: "2 kg", st: "sent" },
    { data: "02/08", tipo: "Scarico", cer: "16 01 03", desc: "Pneumatici fuori uso", qta: "42 kg", st: "rentri" },
    { data: "02/08", tipo: "Scarico", cer: "16 01 17", desc: "Metalli ferrosi", qta: "610 kg", st: "rentri" },
  ];
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", position: "relative" }}>
      <PageHeader
        title="Rifiuti RENTRI"
        subtitle="Registro cronologico di carico e scarico"
        right={<><Btn label="Sincronizza" icon="refreshCw" /><Btn label="Nuovo movimento" icon="plus" variant="primary" glow /></>}
      />

      <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
        <KpiCard title="Carico" value="34" icon="download" color={COLORS.sage[400]} />
        <KpiCard title="Scarico" value="22" icon="package" color={COLORS.plum[400]} />
        <KpiCard title="Da trasmettere" value={transmitted ? "0" : "1"} icon="clock" color={COLORS.sand[400]} active={!transmitted} />
        <KpiCard title="Trasmessi" value={transmitted ? "56" : "55"} icon="checkCircle" color={COLORS.sage[400]} />
      </div>

      {/* filter pills */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        {["Carico (34)", "Scarico (22)", "Tutti"].map((t, i) => (
          <div key={t} style={{ fontSize: 12, fontWeight: 500, padding: "7px 14px", borderRadius: RADIUS.md, color: i === 0 ? "#fff" : COLORS.body, background: i === 0 ? COLORS.brand : COLORS.card, border: `1px solid ${i === 0 ? COLORS.brand : COLORS.border}` }}>{t}</div>
        ))}
      </div>

      {/* table */}
      <div style={{ flex: 1, background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: RADIUS.lg, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "70px 90px 110px 1fr 100px 150px", background: COLORS.bg, padding: "10px 18px", fontSize: 10, fontWeight: 600, letterSpacing: 0.8, textTransform: "uppercase", color: COLORS.muted }}>
          {["Data", "Tipo", "EER", "Descrizione", "Quantità", "Stato"].map((c) => <div key={c}>{c}</div>)}
        </div>
        {rows.map((r, i) => {
          const s = ST[r.st];
          const hot = i === 0 && !transmitted;
          const justSent = i === 0 && transmitted;
          return (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "70px 90px 110px 1fr 100px 150px", padding: "14px 18px", alignItems: "center", fontSize: 12.5, color: COLORS.body, borderTop: `1px solid ${alpha(COLORS.border, 0.6)}`, background: hot ? alpha(COLORS.sand[500], 0.08) : justSent ? alpha(COLORS.sage[500], 0.08) : "transparent" }}>
              <div style={{ color: COLORS.muted }}>{r.data}</div>
              <div>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11.5, color: r.tipo === "Carico" ? COLORS.sage[400] : COLORS.plum[400] }}>
                  <Icon name={r.tipo === "Carico" ? "download" : "package"} size={13} color={r.tipo === "Carico" ? COLORS.sage[400] : COLORS.plum[400]} />
                  {r.tipo}
                </span>
              </div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", color: r.cer.includes("*") ? COLORS.sand[300] : COLORS.ink200 }}>{r.cer}</div>
              <div style={{ color: COLORS.ink200 }}>{r.desc}</div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", color: COLORS.body }}>{r.qta}</div>
              <div><DesktopPill label={s.l} color={s.c} size={10} dot={r.st !== "pending"} /></div>
            </div>
          );
        })}
      </div>

      {/* transmit action bar */}
      {!transmitted && (
        <div style={{ marginTop: 12, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderRadius: RADIUS.md, background: alpha(COLORS.sand[500], 0.1), border: `1px solid ${alpha(COLORS.sand[500], 0.25)}` }}>
          <span style={{ fontSize: 12.5, color: COLORS.sand[300], display: "flex", alignItems: "center", gap: 8 }}>
            <Icon name="alertCircle" size={16} color={COLORS.sand[400]} /> 1 movimento di carico da trasmettere a RENTRI
          </span>
          <Btn label="Trasmetti a RENTRI" icon="wifi" variant="primary" glow />
        </div>
      )}

      {toast && (
        <div style={{ position: "absolute", right: 4, bottom: 4, display: "flex", alignItems: "center", gap: 10, padding: "13px 18px", background: COLORS.card, border: `1px solid ${alpha(COLORS.sage[500], 0.4)}`, borderRadius: RADIUS.md, boxShadow: "0 18px 50px rgba(0,0,0,0.5)" }}>
          <Icon name="checkCircle" size={20} color={COLORS.sage[400]} />
          <span style={{ fontSize: 13.5, color: COLORS.ink200 }}>{toast}</span>
        </div>
      )}
    </div>
  );
};
