import React from "react";
import { COLORS, alpha } from "../../lib/theme";
import { KpiCard, PageHeader, Card } from "../../components/desktop/kit";
import { Icon } from "../../components/ui/Icon";

const BARS = [
  { d: "Lun", v: 6 },
  { d: "Mar", v: 8 },
  { d: "Mer", v: 5 },
  { d: "Gio", v: 9 },
  { d: "Ven", v: 11 },
  { d: "Sab", v: 7 },
  { d: "Dom", v: 9 },
];
const MAXV = 12;

const FEED = [
  { icon: "truck", color: COLORS.blue400, t: "Nuovo soccorso · Giulia Conti", s: "adesso" },
  { icon: "navigation", color: COLORS.plum[400], t: "Luca Ferrari è in viaggio · TR0041", s: "4 min fa" },
  { icon: "recycle", color: COLORS.sage[400], t: "Pratica VFU aperta · Fiat Panda", s: "22 min fa" },
  { icon: "euro", color: COLORS.sage[400], t: "Fattura 127/2026 trasmessa a SdI", s: "1 ora fa" },
  { icon: "trash2", color: COLORS.sand[400], t: "Movimento RENTRI trasmesso", s: "2 ore fa" },
];

const TILES = [
  { icon: "truck", label: "Soccorso & trasporti", color: COLORS.blue400 },
  { icon: "recycle", label: "Demolizioni RVFU", color: COLORS.sage[400] },
  { icon: "trash2", label: "Rifiuti RENTRI", color: COLORS.sand[400] },
  { icon: "euro", label: "Fatture", color: COLORS.plum[400] },
];

export const Dashboard: React.FC = () => (
  <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
    <PageHeader title="Dashboard" subtitle="Panoramica operativa · 3 agosto 2026" />

    <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
      <KpiCard title="Interventi oggi" value="9" icon="truck" color={COLORS.blue400} delta="+2 vs ieri" />
      <KpiCard title="In corso" value="3" icon="navigation" color={COLORS.plum[400]} />
      <KpiCard title="Completati oggi" value="6" icon="checkCircle" color={COLORS.sage[400]} />
      <KpiCard title="Fatturato mese" value="€ 24.8k" icon="euro" color={COLORS.sage[400]} delta="+12%" />
      <KpiCard title="In custodia" value="18" icon="mapPin" color={COLORS.sand[400]} />
    </div>

    <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 12, minHeight: 0 }}>
      {/* chart */}
      <Card style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.ink200, marginBottom: 4 }}>Interventi · ultimi 7 giorni</div>
        <div style={{ fontSize: 11.5, color: COLORS.muted, marginBottom: 18 }}>Media 7,9 al giorno</div>
        <div style={{ flex: 1, display: "flex", alignItems: "flex-end", gap: 20, padding: "0 6px 4px" }}>
          {BARS.map((b) => (
            <div key={b.d} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8, height: "100%", justifyContent: "flex-end" }}>
              <div style={{ fontSize: 11, color: COLORS.body }}>{b.v}</div>
              <div style={{ width: "62%", height: `${(b.v / MAXV) * 100}%`, background: `linear-gradient(${COLORS.brandHover}, ${alpha(COLORS.brand, 0.5)})` }} />
              <div style={{ fontSize: 11, color: COLORS.muted }}>{b.d}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* feed */}
      <Card style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.ink200, marginBottom: 14 }}>Attività recente</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {FEED.map((f, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 11 }}>
              <div style={{ width: 30, height: 30, background: alpha(f.color, 0.14), display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon name={f.icon} size={15} color={f.color} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12.5, color: COLORS.ink200, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{f.t}</div>
                <div style={{ fontSize: 10.5, color: COLORS.muted }}>{f.s}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>

    {/* module tiles */}
    <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
      {TILES.map((t) => (
        <div key={t.label} style={{ flex: 1, display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", background: COLORS.card, border: `1px solid ${COLORS.border}` }}>
          <div style={{ width: 34, height: 34, background: alpha(t.color, 0.14), display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name={t.icon} size={17} color={t.color} />
          </div>
          <span style={{ fontSize: 12.5, fontWeight: 500, color: COLORS.ink200 }}>{t.label}</span>
        </div>
      ))}
    </div>
  </div>
);
