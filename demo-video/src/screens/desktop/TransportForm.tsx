import React from "react";
import { COLORS, alpha } from "../../lib/theme";
import { Icon } from "../../components/ui/Icon";
import { DesktopPill } from "../../components/ui/Pill";
import { SOCCORSO, DRIVER } from "../../lib/data";

/**
 * Nuovo Trasporto — ricostruzione fedele di src/pages/TransportNew.jsx (app reale):
 * pagina a colonna singola ARROTONDATA (card rounded-xl 12, controlli rounded-lg 8),
 * barra di completamento in testa, card a sezioni con icona colorata, timeline percorso,
 * slot di assegnazione. Stato mostrato: intervento di soccorso.
 */
const CARD_R = 12;
const CTL_R = 8;
const TILE_R = 8;

const IconTile: React.FC<{ name: string; color: string }> = ({ name, color }) => (
  <div style={{ width: 28, height: 28, borderRadius: TILE_R, background: alpha(color, 0.12), display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
    <Icon name={name} size={15} color={color} />
  </div>
);

const SecHead: React.FC<{ icon: string; color: string; title: string; hint?: string; right?: React.ReactNode }> = ({ icon, color, title, hint, right }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
    <IconTile name={icon} color={color} />
    <span style={{ fontSize: 14, fontWeight: 600, color: COLORS.ink200 }}>{title}</span>
    <div style={{ marginLeft: "auto" }}>{right ?? (hint ? <span style={{ fontSize: 10.5, color: COLORS.muted }}>{hint}</span> : null)}</div>
  </div>
);

const Card: React.FC<{ children: React.ReactNode; border?: string; pad?: number }> = ({ children, border = COLORS.border, pad = 18 }) => (
  <div style={{ background: COLORS.card, border: `1px solid ${border}`, borderRadius: CARD_R, padding: pad }}>{children}</div>
);

const Fld: React.FC<{ label: string; value: string; mono?: boolean; required?: boolean }> = ({ label, value, mono, required }) => (
  <div>
    <div style={{ fontSize: 11.5, fontWeight: 500, color: COLORS.body, marginBottom: 6 }}>
      {label}{required && <span style={{ color: COLORS.danger }}> *</span>}
    </div>
    <div style={{ height: 36, display: "flex", alignItems: "center", padding: "0 11px", fontSize: 12.5, fontFamily: mono ? "'JetBrains Mono', monospace" : undefined, color: COLORS.ink200, background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: CTL_R }}>
      {value}
    </div>
  </div>
);

const grid2: React.CSSProperties = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 };

const ServiceCard: React.FC<{ icon: string; color: string; label: string; desc: string; active?: boolean }> = ({ icon, color, label, desc, active }) => (
  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8, padding: "12px 14px", borderRadius: CTL_R, background: active ? alpha(color, 0.12) : COLORS.bg, border: `1px solid ${active ? alpha(color, 0.45) : COLORS.border}` }}>
    <IconTile name={icon} color={active ? color : COLORS.muted} />
    <div style={{ fontSize: 13, fontWeight: 600, color: active ? COLORS.ink : COLORS.body }}>{label}</div>
    <div style={{ fontSize: 10.5, color: COLORS.muted, lineHeight: 1.4 }}>{desc}</div>
  </div>
);

const Slot: React.FC<{ icon: string; color: string; role: string; filled?: boolean; name?: string; meta?: string }> = ({ icon, color, role, filled, name, meta }) => (
  <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 11, padding: "12px 14px", borderRadius: CTL_R, background: COLORS.bg, border: filled ? `1px solid ${COLORS.border}` : `1px dashed ${COLORS.borderHover}` }}>
    <div style={{ width: 34, height: 34, borderRadius: TILE_R, background: alpha(color, 0.12), display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <Icon name={icon} size={17} color={color} />
    </div>
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: 0.8, textTransform: "uppercase", color: COLORS.muted }}>{role}</div>
      {filled ? (
        <>
          <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.ink200 }}>{name}</div>
          <div style={{ fontSize: 10.5, color: COLORS.muted }}>{meta}</div>
        </>
      ) : (
        <div style={{ fontSize: 12, color: COLORS.faint }}>Seleziona…</div>
      )}
    </div>
    <Icon name="chevronDown" size={14} color={COLORS.muted} style={{ marginLeft: "auto" }} />
  </div>
);

const TimelineNode: React.FC<{ dot: string; icon: string; label: string; value: string; connector?: boolean }> = ({ dot, icon, label, value, connector }) => (
  <div style={{ display: "flex", gap: 12 }}>
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ width: 26, height: 26, borderRadius: 999, background: alpha(dot, 0.15), border: `1px solid ${alpha(dot, 0.5)}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon name={icon} size={13} color={dot} />
      </div>
      {connector && <div style={{ width: 2, flex: 1, minHeight: 24, background: `linear-gradient(${COLORS.brandHover}, ${COLORS.sage[400]})`, marginTop: 2, marginBottom: 2 }} />}
    </div>
    <div style={{ paddingBottom: connector ? 14 : 0, flex: 1 }}>
      <div style={{ fontSize: 9.5, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", color: COLORS.muted, marginBottom: 4 }}>{label}</div>
      <div style={{ height: 36, display: "flex", alignItems: "center", padding: "0 11px", fontSize: 12.5, color: COLORS.ink200, background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: CTL_R }}>{value}</div>
    </div>
  </div>
);

export const TransportForm: React.FC<{ completion?: number; assigned?: boolean }> = ({ completion = 100, assigned }) => {
  const pct = Math.round(completion);
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 32, height: 32, borderRadius: CTL_R, background: COLORS.card, border: `1px solid ${COLORS.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name="arrowLeft" size={16} color={COLORS.body} />
          </div>
          <div>
            <div style={{ fontSize: 19, fontWeight: 600, color: COLORS.ink }}>Nuovo Trasporto</div>
            <div style={{ fontSize: 11.5, color: COLORS.muted, marginTop: 3 }}>Completamento: {pct}%</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ display: "inline-flex", alignItems: "center", height: 32, padding: "0 12px", fontSize: 12, color: COLORS.body, background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: CTL_R }}>Annulla</div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, height: 32, padding: "0 14px", fontSize: 12, fontWeight: 600, color: "#fff", background: COLORS.brand, borderRadius: CTL_R, boxShadow: `0 6px 18px ${alpha(COLORS.brand, 0.35)}` }}>
            <Icon name="check" size={14} color="#fff" /> Salva Trasporto
          </div>
        </div>
      </div>
      {/* Progress bar */}
      <div style={{ height: 4, background: COLORS.card, borderRadius: 3, overflow: "hidden", marginBottom: 14 }}>
        <div style={{ height: "100%", width: `${pct}%`, background: COLORS.brand }} />
      </div>

      {/* Cards */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12, minHeight: 0 }}>
        <Card pad={16}>
          <SecHead icon="truck" color={COLORS.blue400} title="Tipologia servizio" hint="Seleziona la natura del trasporto" />
          <div style={{ display: "flex", gap: 12 }}>
            <ServiceCard icon="truck" color={COLORS.brandHover} label="Trasporto" desc="Trasporto ordinario di veicoli da A a B" />
            <ServiceCard icon="alertCircle" color={COLORS.danger} label="Soccorso Stradale" desc="Traino, recupero o assistenza in strada" active />
            <ServiceCard icon="package" color={COLORS.plum[400]} label="Mezzi Speciali" desc="Eccezionale, ADR, carichi fuori sagoma" />
          </div>
        </Card>

        <Card border={alpha(COLORS.danger, 0.28)} pad={16}>
          <SecHead icon="alertCircle" color={COLORS.danger} title="Dati intervento soccorso" hint={`Conv. ${SOCCORSO.convenzione}`} />
          <div style={{ ...grid2, marginBottom: 12 }}>
            <Fld label="Tipo intervento" value={SOCCORSO.intervento} />
            <Fld label="Motivo" value={SOCCORSO.motivo} />
            <Fld label="Targa veicolo soccorso" value={SOCCORSO.targa} mono />
            <Fld label="Marca / modello" value={SOCCORSO.modello} />
          </div>
          <div style={grid2}>
            <Fld label="Convenzione / assicurazione" value={SOCCORSO.convenzione} />
            <Fld label="Numero pratica" value={SOCCORSO.pratica} mono />
          </div>
        </Card>

        <Card pad={16}>
          <SecHead icon="user" color={COLORS.blue400} title="Cliente" right={<DesktopPill label="Collegato" color={COLORS.sage[400]} dot />} />
          <div style={grid2}>
            <Fld label="Nome cliente" value={SOCCORSO.client} required />
            <Fld label="Telefono" value={SOCCORSO.phone} />
          </div>
        </Card>

        <Card pad={16}>
          <SecHead icon="mapPin" color={COLORS.sage[400]} title="Percorso" />
          <div>
            <TimelineNode dot={COLORS.brandHover} icon="navigation" label="Partenza" value={SOCCORSO.partenza} connector />
            <TimelineNode dot={COLORS.sage[400]} icon="mapPin" label="Arrivo" value={SOCCORSO.arrivo} />
          </div>
        </Card>

        <Card pad={16}>
          <SecHead icon="calendar" color={COLORS.plum[400]} title="Quando & quanto" />
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16 }}>
            <div style={{ width: 200 }}>
              <div style={{ fontSize: 11.5, fontWeight: 500, color: COLORS.body, marginBottom: 6 }}>Prezzo trasporto</div>
              <div style={{ height: 40, display: "flex", alignItems: "center", gap: 8, padding: "0 12px", background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: CTL_R }}>
                <span style={{ fontSize: 14, color: COLORS.muted }}>€</span>
                <span style={{ fontSize: 16, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: COLORS.ink }}>148,00</span>
              </div>
            </div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, height: 34, padding: "0 14px", borderRadius: 999, background: alpha(COLORS.danger, 0.14), border: `1px solid ${alpha(COLORS.danger, 0.35)}`, color: COLORS.danger, fontSize: 12.5, fontWeight: 600 }}>
              <Icon name="zap" size={14} color={COLORS.danger} /> Urgente
            </div>
          </div>
        </Card>

        <Card pad={16}>
          <SecHead icon="shield" color={COLORS.sand[400]} title="Assegnazione" right={<span style={{ fontSize: 10.5, color: assigned ? COLORS.sage[400] : COLORS.muted }}>{assigned ? "Completa" : "Parziale"}</span>} />
          <div style={{ display: "flex", gap: 12 }}>
            <Slot icon="user" color={COLORS.sand[400]} role="Autista" filled={assigned} name={DRIVER.name} meta="Disponibile ora" />
            <Slot icon="truck" color={COLORS.brandHover} role="Veicolo" filled={assigned} name={DRIVER.vehicle} meta={DRIVER.plate} />
          </div>
        </Card>
      </div>
    </div>
  );
};
