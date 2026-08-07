import React from "react";
import { COLORS, alpha } from "../../lib/theme";
import { Icon } from "../../components/ui/Icon";
import { DesktopPill } from "../../components/ui/Pill";
import { ORG } from "../../lib/data";

export type Riga = { desc: string; qty: number; price: number; vat: number; codice?: string };

const CARD_R = 12;
const CTL_R = 8;
const TILE_R = 8;

const eur = (n: number) => new Intl.NumberFormat("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n) + " €";

const Tile: React.FC<{ icon: string; color: string }> = ({ icon, color }) => (
  <div style={{ width: 30, height: 30, borderRadius: TILE_R, background: alpha(color, 0.12), display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
    <Icon name={icon} size={16} color={color} />
  </div>
);

const CardHead: React.FC<{ icon: string; color: string; title: string; sub?: string; right?: React.ReactNode }> = ({ icon, color, title, sub, right }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
    <Tile icon={icon} color={color} />
    <div>
      <div style={{ fontSize: 13.5, fontWeight: 600, color: COLORS.ink200 }}>{title}</div>
      {sub && <div style={{ fontSize: 10.5, color: COLORS.muted }}>{sub}</div>}
    </div>
    <div style={{ marginLeft: "auto" }}>{right}</div>
  </div>
);

const Card: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: CARD_R, padding: 14, ...style }}>{children}</div>
);

const KV: React.FC<{ l: string; v: string; mono?: boolean }> = ({ l, v, mono }) => (
  <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0" }}>
    <span style={{ fontSize: 11, color: COLORS.muted }}>{l}</span>
    <span style={{ fontSize: 11.5, color: COLORS.ink200, fontFamily: mono ? "'JetBrains Mono', monospace" : undefined }}>{v}</span>
  </div>
);

export const InvoiceScreen: React.FC<{
  number: string;
  data?: string;
  clienteNome: string;
  clienteTipo?: string;
  clienteMeta: string;
  righe: Riga[];
  causale: string;
  sent?: boolean;
  toast?: string;
  codDest?: string;
}> = ({ number, data = "04/08/2026", clienteNome, clienteTipo = "Privato", clienteMeta, righe, causale, sent, toast, codDest = "0000000" }) => {
  const imponibile = righe.reduce((a, r) => a + r.qty * r.price, 0);
  const iva = righe.reduce((a, r) => a + (r.qty * r.price * r.vat) / 100, 0);
  const totale = imponibile + iva;
  const azienda = clienteTipo.toLowerCase().startsWith("az");
  const COLS = "70px 1fr 46px 90px 52px 46px 96px";

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", position: "relative" }}>
      {/* header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 32, height: 32, borderRadius: CTL_R, background: COLORS.card, border: `1px solid ${COLORS.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name="arrowLeft" size={16} color={COLORS.body} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 999, background: alpha(COLORS.sage[500], 0.14), display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name="fileText" size={17} color={COLORS.sage[400]} />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 600, color: COLORS.ink }}>Nuova Fattura</div>
              <div style={{ fontSize: 11, color: COLORS.muted, marginTop: 1 }}>#{number} · {data} · {eur(totale)}</div>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {sent && <DesktopPill label="Salvata" color={COLORS.sage[400]} dot />}
          <div style={{ display: "inline-flex", alignItems: "center", height: 32, padding: "0 12px", fontSize: 12, color: COLORS.body, background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: CTL_R }}>Annulla</div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, height: 32, padding: "0 14px", fontSize: 12, fontWeight: 600, color: "#fff", background: COLORS.sage[600], borderRadius: CTL_R, boxShadow: `0 6px 18px ${alpha(COLORS.sage[600], 0.35)}` }}>
            <Icon name="check" size={14} color="#fff" /> Salva Fattura
          </div>
        </div>
      </div>

      {/* Emessa da */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 14px", background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: CARD_R, marginBottom: 12 }}>
        <span style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: COLORS.muted }}>Emessa da</span>
        <span style={{ fontSize: 12.5, fontWeight: 600, color: COLORS.ink200 }}>{ORG.name}</span>
        <span style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: COLORS.muted }}>P.IVA {ORG.piva}</span>
        <span style={{ fontSize: 11, color: COLORS.muted }}>· Regime RF01</span>
        <DesktopPill label="SDI PROD" color={COLORS.sage[400]} size={9} />
      </div>

      {/* Cliente + Documento + SdI */}
      <div style={{ display: "grid", gridTemplateColumns: "1.25fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
        <Card>
          <CardHead icon="user" color={COLORS.plum[400]} title="Cliente" sub="Cessionario / Committente" right={<DesktopPill label={azienda ? "Azienda" : "Persona fisica"} color={azienda ? COLORS.plum[400] : COLORS.blue400} size={9} />} />
          <div style={{ fontSize: 13.5, fontWeight: 600, color: COLORS.ink200 }}>{clienteNome}</div>
          <div style={{ fontSize: 11, color: COLORS.muted, marginTop: 4, lineHeight: 1.5 }}>{clienteMeta}</div>
        </Card>
        <Card>
          <CardHead icon="fileText" color={COLORS.sand[400]} title="Dati Documento" sub="Informazioni fattura" />
          <KV l="Tipo" v="TD01 · Fattura" />
          <KV l="Numero" v={number} mono />
          <KV l="Data" v={data} />
          <KV l="Valuta" v="EUR" />
        </Card>
        <Card>
          <CardHead icon="zap" color={COLORS.blue400} title="Trasmissione SdI" sub="Sistema di Interscambio" />
          <KV l="Cod. Destinatario" v={codDest} mono />
          <KV l="Firma" v="CAdES-BES" />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0" }}>
            <span style={{ fontSize: 11, color: COLORS.muted }}>Stato</span>
            <DesktopPill label={sent ? "Trasmessa a SdI" : "Pronta all'invio"} color={sent ? COLORS.sage[400] : COLORS.blue400} size={9} dot />
          </div>
        </Card>
      </div>

      {/* Righe */}
      <div style={{ flex: 1, background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: CARD_R, overflow: "hidden", display: "flex", flexDirection: "column", minHeight: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderBottom: `1px solid ${COLORS.border}` }}>
          <Tile icon="list" color={COLORS.sage[400]} />
          <span style={{ fontSize: 13.5, fontWeight: 600, color: COLORS.ink200 }}>Righe Fattura</span>
          <span style={{ fontSize: 10.5, color: COLORS.muted }}>Dettaglio beni e servizi</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: COLS, background: COLORS.bg, padding: "9px 16px", fontSize: 9.5, fontWeight: 600, letterSpacing: 0.6, textTransform: "uppercase", color: COLORS.muted }}>
          <div>Codice</div><div>Descrizione voce</div><div style={{ textAlign: "right" }}>Q.tà</div><div style={{ textAlign: "right" }}>Prezzo €</div><div style={{ textAlign: "right" }}>IVA %</div><div style={{ textAlign: "right" }}>Sc. %</div><div style={{ textAlign: "right" }}>Totale €</div>
        </div>
        {righe.map((r, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: COLS, padding: "11px 16px", alignItems: "center", fontSize: 12, color: COLORS.body, borderTop: `1px solid ${alpha(COLORS.border, 0.6)}` }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", color: COLORS.faint }}>{r.codice ?? "—"}</div>
            <div style={{ color: COLORS.ink200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", paddingRight: 8 }}>{r.desc}</div>
            <div style={{ textAlign: "right" }}>{r.qty}</div>
            <div style={{ textAlign: "right", fontFamily: "'JetBrains Mono', monospace" }}>{eur(r.price)}</div>
            <div style={{ textAlign: "right" }}>{r.vat}</div>
            <div style={{ textAlign: "right" }}>0</div>
            <div style={{ textAlign: "right", fontFamily: "'JetBrains Mono', monospace", color: COLORS.ink200 }}>{eur(r.qty * r.price)}</div>
          </div>
        ))}
        <div style={{ marginTop: "auto", padding: "10px 16px", borderTop: `1px solid ${COLORS.border}`, fontSize: 11, color: COLORS.muted }}>
          <span style={{ fontWeight: 600 }}>Causale:</span> {causale}
        </div>
      </div>

      {/* totali */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
        <div style={{ width: 300 }}>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 12, color: COLORS.muted }}>
            <span>Imponibile</span><span style={{ fontFamily: "'JetBrains Mono', monospace", color: COLORS.body }}>{eur(imponibile)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 12, color: COLORS.muted }}>
            <span>IVA</span><span style={{ fontFamily: "'JetBrains Mono', monospace", color: COLORS.body }}>{eur(iva)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 9, marginTop: 3, borderTop: `1px solid ${COLORS.border}` }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: COLORS.ink }}>Totale</span>
            <span style={{ fontSize: 17, fontWeight: 700, color: COLORS.sage[400], fontFamily: "'JetBrains Mono', monospace" }}>{eur(totale)}</span>
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
};
