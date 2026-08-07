import React from "react";
import { COLORS, alpha, RADIUS } from "../../lib/theme";
import { Btn, Card, SectionHead } from "../../components/desktop/kit";
import { DesktopPill } from "../../components/ui/Pill";
import { Icon } from "../../components/ui/Icon";
import { SOCCORSO, DRIVER } from "../../lib/data";

const STATES = [
  { k: "new", l: "Nuovo", c: COLORS.blue400 },
  { k: "assigned", l: "Assegnato", c: COLORS.sand[400] },
  { k: "enroute", l: "In Viaggio", c: COLORS.plum[400] },
  { k: "done", l: "Completato", c: COLORS.sage[400] },
];

const Info: React.FC<{ l: string; v: string; mono?: boolean }> = ({ l, v, mono }) => (
  <div style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: `1px solid ${alpha(COLORS.border, 0.6)}` }}>
    <span style={{ fontSize: 12, color: COLORS.muted }}>{l}</span>
    <span style={{ fontSize: 12.5, color: COLORS.ink200, fontFamily: mono ? "'JetBrains Mono', monospace" : undefined }}>{v}</span>
  </div>
);

export const TransportDetail: React.FC<{ status?: string; invoiced?: boolean; toast?: string }> = ({
  status = "done",
  invoiced,
  toast,
}) => {
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", position: "relative" }}>
      {/* header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 20, fontWeight: 600, color: COLORS.ink }}>Trasporto {SOCCORSO.number}</span>
            <DesktopPill label="Completato" color={COLORS.sage[400]} />
            <DesktopPill label="Soccorso" color={COLORS.danger} dotColor={COLORS.danger} uppercase={false} />
            {invoiced && <DesktopPill label="Fatturato" color={COLORS.sage[400]} />}
          </div>
          <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 6 }}>Creato il 03/08/2026 · 08:42</div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Btn label="Stampa" icon="printer" />
          <Btn label="Modifica" icon="edit" />
          <Btn label="Crea Fattura" icon="euro" variant="sand" glow />
        </div>
      </div>

      {/* status selector */}
      <Card style={{ marginBottom: 12 }} pad={14}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: 10 }}>
            {STATES.map((s) => {
              const on = s.k === status;
              return (
                <div key={s.k} style={{ display: "flex", alignItems: "center", gap: 7, padding: "7px 13px", borderRadius: RADIUS.md, fontSize: 12, fontWeight: 500, color: on ? s.c : COLORS.muted, background: on ? alpha(s.c, 0.12) : COLORS.bg, border: `1px solid ${on ? alpha(s.c, 0.3) : COLORS.border}` }}>
                  {on && <Icon name="checkCircle" size={14} color={s.c} />}
                  {s.l}
                  {on && <span style={{ fontSize: 10, opacity: 0.7 }}>attuale</span>}
                </div>
              );
            })}
          </div>
          <span style={{ fontSize: 12, color: COLORS.muted }}>Clicca uno stato per cambiare</span>
        </div>
      </Card>

      {/* grid */}
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, minHeight: 0 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Card>
            <SectionHead icon="user" title="Cliente" color={COLORS.brandHover} />
            <Info l="Nome" v={SOCCORSO.client} />
            <Info l="Telefono" v={SOCCORSO.phone} />
          </Card>
          <Card>
            <SectionHead icon="alertCircle" title="Intervento soccorso" color={COLORS.danger} />
            <Info l="Tipo" v={SOCCORSO.intervento} />
            <Info l="Motivo" v={SOCCORSO.motivo} />
            <Info l="Targa veicolo" v={SOCCORSO.targa} mono />
            <Info l="Convenzione" v={`${SOCCORSO.convenzione} · ${SOCCORSO.pratica}`} />
          </Card>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Card>
            <SectionHead icon="truck" title="Assegnazione" color={COLORS.sand[400]} />
            <Info l="Autista" v={DRIVER.name} />
            <Info l="Veicolo" v={`${DRIVER.vehicle} · ${DRIVER.plate}`} />
          </Card>
          <Card>
            <SectionHead icon="euro" title="Riepilogo costo" color={COLORS.sage[400]} hint="IVA esclusa" />
            <Info l="Diritto fisso di intervento" v="€ 50,00" />
            <Info l={`Traino (${SOCCORSO.km} km)`} v="€ 98,00" />
            <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.ink }}>Totale</span>
              <span style={{ fontSize: 18, fontWeight: 700, color: COLORS.sage[400] }}>{SOCCORSO.prezzo}</span>
            </div>
          </Card>
        </div>
      </div>

      {toast && (
        <div style={{ position: "absolute", right: 4, bottom: 4, display: "flex", alignItems: "center", gap: 10, padding: "13px 18px", background: COLORS.card, border: `1px solid ${alpha(COLORS.sage[500], 0.4)}`, borderRadius: RADIUS.md, boxShadow: "0 18px 50px rgba(0,0,0,0.5)" }}>
          <Icon name="checkCircle" size={20} color={COLORS.sage[400]} />
          <span style={{ fontSize: 13.5, color: COLORS.ink200 }}>{toast}</span>
        </div>
      )}
    </div>
  );
};
