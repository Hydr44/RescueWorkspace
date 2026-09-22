import React from "react";
import { COLORS, alpha, RADIUS } from "../../lib/theme";
import { KpiCard, PageHeader, Btn } from "../../components/desktop/kit";
import { Icon } from "../../components/ui/Icon";
import { DesktopPill } from "../../components/ui/Pill";
import { DRIVER, SOCCORSO } from "../../lib/data";

type P = { x: number; y: number };
const ROUTE: P[] = [
  { x: 120, y: 500 },
  { x: 250, y: 430 },
  { x: 330, y: 300 },
  { x: 470, y: 250 },
  { x: 600, y: 170 },
  { x: 720, y: 120 },
];

export const pointOnPolyline = (pts: P[], t: number): { pt: P; angle: number } => {
  const segs: number[] = [];
  let total = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const d = Math.hypot(pts[i + 1].x - pts[i].x, pts[i + 1].y - pts[i].y);
    segs.push(d);
    total += d;
  }
  let target = t * total;
  for (let i = 0; i < segs.length; i++) {
    if (target <= segs[i] || i === segs.length - 1) {
      const f = segs[i] === 0 ? 0 : target / segs[i];
      const a = pts[i];
      const b = pts[i + 1];
      return {
        pt: { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f },
        angle: (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI,
      };
    }
    target -= segs[i];
  }
  return { pt: pts[pts.length - 1], angle: 0 };
};

const routePath = ROUTE.map((p, i) => `${i === 0 ? "M" : "L"}${p.x} ${p.y}`).join(" ");

export const TrackingMap: React.FC<{ progress?: number; pulse?: number }> = ({
  progress = 0.5,
  pulse = 0,
}) => {
  const { pt, angle } = pointOnPolyline(ROUTE, progress);
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <PageHeader
        title="Tracking Live"
        subtitle="3 soccorso & trasporti con GPS · 2 in viaggio"
        right={<><Btn label="Aggiorna" icon="refreshCw" /></>}
      />
      <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
        <KpiCard title="In Viaggio" value="2" icon="navigation" color={COLORS.blue400} />
        <KpiCard title="Assegnati" value="4" icon="user" color={COLORS.sand[400]} />
        <KpiCard title="GPS Live" value="3" icon="wifi" color={COLORS.sage[400]} active />
        <KpiCard title="Con Mappa" value="3" icon="mapPin" color={COLORS.plum[400]} />
        <KpiCard title="Live Ora" value="2" icon="activity" color="#e06b8b" />
      </div>

      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 322px", gap: 12, minHeight: 0 }}>
        {/* MAP */}
        <div
          style={{
            position: "relative",
            borderRadius: RADIUS.lg,
            overflow: "hidden",
            border: `1px solid ${COLORS.border}`,
            background: "#0c141f",
          }}
        >
          <svg width="100%" height="100%" viewBox="0 0 840 610" preserveAspectRatio="xMidYMid slice">
            {/* water/land tint */}
            <rect width="840" height="610" fill="#0c141f" />
            {/* faint roads */}
            {[
              "M0 180 L840 120",
              "M0 360 L840 300",
              "M0 520 L840 470",
              "M180 0 L120 610",
              "M420 0 L460 610",
              "M660 0 L700 610",
            ].map((d, i) => (
              <path key={i} d={d} stroke={alpha(COLORS.white, 0.05)} strokeWidth={i < 3 ? 10 : 6} fill="none" />
            ))}
            {[...Array(9)].map((_, i) => (
              <path key={"m" + i} d={`M0 ${70 + i * 65} L840 ${40 + i * 65}`} stroke={alpha(COLORS.white, 0.02)} strokeWidth="2" fill="none" />
            ))}
            {/* route casing + line */}
            <path d={routePath} stroke="#0c141f" strokeWidth="11" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <path d={routePath} stroke={COLORS.brandHover} strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            {/* dest pin */}
            <g transform={`translate(${ROUTE[ROUTE.length - 1].x}, ${ROUTE[ROUTE.length - 1].y})`}>
              <circle r={13 + pulse * 10} fill={alpha(COLORS.danger, 0.25 * (1 - pulse))} />
              <circle r="8" fill={COLORS.danger} stroke="#fff" strokeWidth="2.5" />
            </g>
            {/* start */}
            <circle cx={ROUTE[0].x} cy={ROUTE[0].y} r="7" fill={COLORS.sage[400]} stroke="#fff" strokeWidth="2.5" />
            {/* driver marker */}
            <g transform={`translate(${pt.x}, ${pt.y})`}>
              <circle r={16 + pulse * 12} fill={alpha(COLORS.brandHover, 0.22)} />
              <g transform={`rotate(${angle})`}>
                <polygon points="12,0 -8,-8 -3,0 -8,8" fill={COLORS.brandHover} stroke="#fff" strokeWidth="1.5" />
              </g>
            </g>
          </svg>
          {/* LIVE badge */}
          <div style={{ position: "absolute", top: 14, left: 14, display: "flex", alignItems: "center", gap: 7, background: alpha("#000", 0.5), padding: "6px 11px", borderRadius: 0, fontSize: 11.5, fontWeight: 600, color: COLORS.sage[400] }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: COLORS.sage[400] }} /> LIVE · {DRIVER.name}
          </div>
          {/* legend */}
          <div style={{ position: "absolute", bottom: 14, left: 14, display: "flex", gap: 14, background: alpha("#000", 0.5), padding: "7px 12px", borderRadius: 0, fontSize: 11, color: COLORS.body }}>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 8, height: 8, borderRadius: "50%", background: COLORS.sage[400] }} />Partenza</span>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 8, height: 8, borderRadius: "50%", background: COLORS.brandHover }} />Autista</span>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 8, height: 8, borderRadius: "50%", background: COLORS.danger }} />Destinazione</span>
          </div>
        </div>

        {/* SIDEBAR LIST */}
        <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: RADIUS.lg, padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: COLORS.ink200 }}>Soccorso & trasporti (3)</div>
          {[
            { c: SOCCORSO.client, r: `${SOCCORSO.partenza} → Ancona`, d: DRIVER.name, live: true, st: "enroute" },
            { c: "Marco Neri", r: "Via Roma 4 → Deposito Nord", d: "A. Verdi", live: true, st: "enroute" },
            { c: "AutoFlotta SPA", r: "Milano → Bologna", d: "M. Gialli", live: false, st: "assigned" },
          ].map((r, i) => (
            <div key={i} style={{ padding: 12, borderRadius: RADIUS.md, background: COLORS.bg, border: `1px solid ${alpha(COLORS.border, 0.7)}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.ink200 }}>{r.c}</span>
                {r.live ? <DesktopPill label="LIVE" color={COLORS.sage[400]} size={9} dot /> : <DesktopPill label="Assegnato" color={COLORS.sand[400]} size={9} />}
              </div>
              <div style={{ fontSize: 11, color: COLORS.muted, marginBottom: 6 }}>{r.r}</div>
              <div style={{ fontSize: 11, color: COLORS.faint, display: "flex", alignItems: "center", gap: 6 }}>
                <Icon name="user" size={12} color={COLORS.faint} /> {r.d}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
