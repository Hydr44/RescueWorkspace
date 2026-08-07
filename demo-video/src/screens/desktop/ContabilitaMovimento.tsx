import React from "react";
import { COLORS, alpha } from "../../lib/theme";
import { Icon } from "../../components/ui/Icon";
import { MOVIMENTO } from "../../lib/data";

/**
 * Nuovo Movimento — prima nota — fedele a src/pages/AccountingEntryNew.jsx:
 * ARROTONDATO (card rounded-xl 12, controlli rounded-lg 8), colonna max-w-3xl,
 * partita doppia con Dare/Avere mutuamente esclusivi (una sola riga conto),
 * toggle Movimento Manuale / Fattura Passiva Estera. Input piu scuri delle card.
 */
const CARD_R = 12;
const CTL_R = 8;

const label = (t: string) => (
  <div style={{ fontSize: 10, fontWeight: 500, letterSpacing: 0.6, textTransform: "uppercase", color: COLORS.muted, marginBottom: 6 }}>{t}</div>
);

const Input: React.FC<{ value: string; mono?: boolean; muted?: boolean; focus?: boolean; suffix?: string }> = ({ value, mono, muted, focus, suffix }) => (
  <div style={{ height: 36, display: "flex", alignItems: "center", justifyContent: suffix ? "space-between" : undefined, padding: "0 11px", fontSize: 12.5, fontFamily: mono ? "'JetBrains Mono', monospace" : undefined, color: muted ? COLORS.faint : COLORS.ink200, background: COLORS.bg, border: `1px solid ${focus ? alpha(COLORS.brand, 0.6) : COLORS.border}`, borderRadius: CTL_R, boxShadow: focus ? `0 0 0 3px ${alpha(COLORS.brand, 0.18)}` : "none" }}>
    <span>{value}</span>{suffix && <span style={{ color: COLORS.muted }}>{suffix}</span>}
  </div>
);

const CardBox: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: CARD_R, overflow: "hidden" }}>
    <div style={{ padding: "11px 18px", borderBottom: `1px solid ${COLORS.border}`, fontSize: 11, fontWeight: 600, letterSpacing: 0.8, textTransform: "uppercase", color: COLORS.muted }}>{title}</div>
    <div style={{ padding: 18 }}>{children}</div>
  </div>
);

const grid2: React.CSSProperties = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 };

export const ContabilitaMovimento: React.FC<{ focus?: number; saved?: boolean; toast?: string }> = ({ focus = -1, toast }) => (
  <div style={{ height: "100%", display: "flex", flexDirection: "column", position: "relative" }}>
    <div style={{ maxWidth: 720, width: "100%", margin: "0 auto", display: "flex", flexDirection: "column", gap: 18 }}>
      {/* header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 32, height: 32, borderRadius: CTL_R, background: COLORS.card, border: `1px solid ${COLORS.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name="arrowLeft" size={16} color={COLORS.body} />
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 600, color: COLORS.ink }}>Nuovo Movimento</div>
            <div style={{ fontSize: 11.5, color: COLORS.muted, marginTop: 2 }}>Registrazione in partita doppia</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ display: "inline-flex", alignItems: "center", height: 32, padding: "0 12px", fontSize: 12, color: COLORS.body, background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: CTL_R }}>Annulla</div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, height: 32, padding: "0 14px", fontSize: 12, fontWeight: 600, color: "#fff", background: COLORS.brand, borderRadius: CTL_R, boxShadow: `0 4px 12px ${alpha(COLORS.brand, 0.25)}` }}>
            <Icon name="check" size={14} color="#fff" /> Salva
          </div>
        </div>
      </div>

      {/* toggle pills */}
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, height: 32, padding: "0 16px", fontSize: 12, fontWeight: 500, color: "#fff", background: COLORS.brand, border: `1px solid ${COLORS.brand}`, borderRadius: CTL_R }}>
          <Icon name="fileText" size={14} color="#fff" /> Movimento Manuale
        </div>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, height: 32, padding: "0 16px", fontSize: 12, fontWeight: 500, color: COLORS.muted, background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: CTL_R }}>
          <Icon name="layers" size={14} color={COLORS.muted} /> Fattura Passiva Estera
        </div>
      </div>

      <CardBox title="Dati Movimento">
        <div style={grid2}>
          <div>{label("Data Contabile *")}<Input value={MOVIMENTO.data} focus={focus === 0} /></div>
          <div>{label("Conto *")}<Input value="26.05 — Banca c/c Intesa" focus={focus === 1} /><div style={{ fontSize: 10, color: COLORS.faint, marginTop: 5 }}>Categoria: Attività · Disponibilità liquide</div></div>
        </div>
      </CardBox>

      <CardBox title="Importi">
        <div style={grid2}>
          <div>{label("Dare €")}<Input value="180,56" mono focus={focus === 2} /><div style={{ fontSize: 10, color: COLORS.faint, marginTop: 5 }}>Addebito sul conto</div></div>
          <div>{label("Avere €")}<Input value="0,00" mono muted /><div style={{ fontSize: 10, color: COLORS.faint, marginTop: 5 }}>Accredito sul conto</div></div>
        </div>
      </CardBox>

      <CardBox title="Dettagli">
        <div style={grid2}>
          <div>{label("Descrizione")}<Input value={MOVIMENTO.causale} focus={focus === 3} /></div>
          <div>{label("Riferimento")}<Input value="FATT 128/2026" mono /></div>
        </div>
      </CardBox>

      {/* footer */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 2 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: COLORS.muted }}><Icon name="arrowLeft" size={13} color={COLORS.muted} /> Torna alla lista</span>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, height: 38, padding: "0 18px", fontSize: 12.5, fontWeight: 600, color: "#fff", background: COLORS.brand, borderRadius: CTL_R, boxShadow: `0 6px 18px ${alpha(COLORS.brand, 0.3)}` }}>
          <Icon name="check" size={15} color="#fff" /> Salva Movimento
        </div>
      </div>
    </div>

    {toast && (
      <div style={{ position: "absolute", right: 4, bottom: 4, display: "flex", alignItems: "center", gap: 10, padding: "13px 18px", background: COLORS.card, border: `1px solid ${alpha(COLORS.sage[500], 0.4)}`, borderRadius: CTL_R, boxShadow: "0 18px 50px rgba(0,0,0,0.5)" }}>
        <Icon name="checkCircle" size={20} color={COLORS.sage[400]} />
        <span style={{ fontSize: 13.5, color: COLORS.ink200 }}>{toast}</span>
      </div>
    )}
  </div>
);
