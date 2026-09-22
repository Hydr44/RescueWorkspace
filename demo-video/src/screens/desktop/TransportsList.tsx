import React from "react";
import { COLORS, alpha } from "../../lib/theme";
import { Btn, KpiCard, PageHeader } from "../../components/desktop/kit";
import { DesktopPill } from "../../components/ui/Pill";
import { Icon } from "../../components/ui/Icon";

const ROWS = [
  { id: "TR0042", data: "03/08", cliente: "Giulia Conti", comm: "—", from: "A14 Ancona Nord", to: "Officina Centrale — Ancona", st: "new", isNew: true },
  { id: "TR0041", data: "03/08", cliente: "Marco Neri", comm: "Europ Assistance", from: "Via Roma 4 — Jesi", to: "Deposito Nord — Ancona", st: "enroute" },
  { id: "TR0040", data: "02/08", cliente: "Elena Costa", comm: "—", from: "Via Verdi 9 — Osimo", to: "Carrozzeria Sironi", st: "done" },
  { id: "TR0039", data: "02/08", cliente: "AutoFlotta SPA", comm: "AutoFlotta SPA", from: "Milano Lambrate", to: "Bologna Fiera", st: "assigned" },
  { id: "TR0038", data: "01/08", cliente: "Paolo Gallo", comm: "—", from: "SS16 km 44 — Senigallia", to: "Officina Centrale — Ancona", st: "done" },
  { id: "TR0037", data: "01/08", cliente: "Sara De Luca", comm: "AXA Assistance", from: "Via Piave 2 — Falconara", to: "Deposito Sud — Ancona", st: "done" },
];

const ST: Record<string, { label: string; color: string }> = {
  new: { label: "Nuovo", color: COLORS.blue400 },
  assigned: { label: "Assegnato", color: COLORS.sand[400] },
  enroute: { label: "In Viaggio", color: COLORS.plum[400] },
  done: { label: "Completato", color: COLORS.sage[400] },
};

const COLS = ["ID", "Data", "Cliente", "Committente", "Partenza", "Arrivo", "Stato", ""];

export const TransportsList: React.FC<{ highlightNew?: boolean }> = ({
  highlightNew,
}) => {
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <PageHeader
        title="Soccorso & trasporti"
        subtitle="342 soccorso & trasporti totali"
        right={
          <>
            <Btn label="PDF" icon="download" />
            <Btn label="CSV" icon="download" />
            <Btn label="Nuovo Trasporto" icon="plus" variant="primary" glow />
          </>
        }
      />

      {/* KPI */}
      <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
        <KpiCard title="Nuovi" value="6" icon="clock" color={COLORS.blue400} active={highlightNew} delta="+2 oggi" />
        <KpiCard title="Assegnati" value="4" icon="truck" color={COLORS.sand[400]} />
        <KpiCard title="In Viaggio" value="3" icon="navigation" color={COLORS.plum[400]} />
        <KpiCard title="Completati" value="329" icon="checkCircle" color={COLORS.sage[400]} />
        <KpiCard title="Fatturati" value="280" icon="euro" color={COLORS.sage[400]} />
      </div>

      {/* Toolbar */}
      <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            gap: 8,
            height: 34,
            padding: "0 12px",
            background: COLORS.card,
            border: `1px solid ${COLORS.border}`,
            borderRadius: 0,
            fontSize: 12.5,
            color: COLORS.faint,
          }}
        >
          <Icon name="search" size={14} color={COLORS.muted} />
          Cerca cliente, committente, targa, indirizzo…
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, height: 34, padding: "0 12px", background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 0, fontSize: 12.5, color: COLORS.body }}>
          Tutti gli stati
          <Icon name="chevronDown" size={13} color={COLORS.muted} />
        </div>
      </div>

      {/* Table */}
      <div
        style={{
          flex: 1,
          background: COLORS.card,
          border: `1px solid ${COLORS.border}`,
          borderRadius: 0,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "84px 64px 1.3fr 1.2fr 1.5fr 1.5fr 118px 40px",
            background: COLORS.bg,
            padding: "10px 16px",
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: 0.8,
            textTransform: "uppercase",
            color: COLORS.muted,
          }}
        >
          {COLS.map((c, i) => (
            <div key={i}>{c}</div>
          ))}
        </div>
        {ROWS.map((r) => {
          const s = ST[r.st];
          const hot = highlightNew && r.isNew;
          return (
            <div
              key={r.id}
              style={{
                display: "grid",
                gridTemplateColumns: "84px 64px 1.3fr 1.2fr 1.5fr 1.5fr 118px 40px",
                padding: "13px 16px",
                alignItems: "center",
                fontSize: 12,
                color: COLORS.body,
                borderTop: `1px solid ${alpha(COLORS.border, 0.6)}`,
                borderLeft: `3px solid ${r.st === "new" ? COLORS.danger : "transparent"}`,
                background: hot ? alpha(COLORS.brand, 0.08) : "transparent",
              }}
            >
              <div style={{ fontFamily: "'JetBrains Mono', monospace", color: COLORS.ink200 }}>{r.id}</div>
              <div style={{ color: COLORS.muted }}>{r.data}</div>
              <div style={{ color: COLORS.ink200, fontWeight: 500 }}>{r.cliente}</div>
              <div style={{ color: r.comm === "—" ? COLORS.faint : COLORS.body }}>{r.comm}</div>
              <div style={{ color: COLORS.muted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.from}</div>
              <div style={{ color: COLORS.muted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.to}</div>
              <div><DesktopPill label={s.label} color={s.color} size={10} /></div>
              <div><Icon name="moreVertical" size={16} color={COLORS.muted} /></div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
