import React from "react";
import { COLORS } from "../../lib/theme";
import { Icon } from "../../components/ui/Icon";
import { CfTopbar, CfCard, CfRowFull, CfRow2, CfVal, CfSegment, CfGreenBtn, CfFooter, CF_COLORS } from "../../components/desktop/cf";
import { CLIENTE } from "../../lib/data";

/**
 * Nuovo cliente — fedele a src/pages/ClientNew.jsx: datasheet SQUADRATO "ibrido",
 * colonna 900px, gutter label 130px, toggle Azienda/Privato, sezioni con barra blu,
 * ring completamento, footer con hint tastiera. Stato: Azienda.
 */
export const ClienteForm: React.FC<{ focus?: number; saved?: boolean; toast?: string }> = ({ focus = -1, saved, toast }) => {
  const pct = saved ? 100 : 76;
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", position: "relative" }}>
      <div style={{ maxWidth: 860, width: "100%", margin: "0 auto", flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
        <CfTopbar title="Nuovo cliente" sub="Azienda · P.IVA" pct={pct} primary="Salva" primaryIcon="check" />

        {/* segmented Azienda/Privato */}
        <div style={{ marginBottom: 12 }}>
          <CfSegment options={["Azienda", "Privato"]} active={0} />
        </div>

        <CfCard title="Dati azienda">
          <CfRowFull label="Codice cliente" first>
            <div style={{ display: "flex", alignItems: "center", gap: 8, width: "100%" }}>
              <CfVal value="Auto-generato" mono muted />
              <div style={{ display: "inline-flex", alignItems: "center", gap: 5, height: 26, padding: "0 9px", fontSize: 11, color: CF_COLORS.txt2, background: CF_COLORS.surface, border: `1px solid ${CF_COLORS.border}` }}><Icon name="refreshCw" size={12} color={CF_COLORS.txt2} /> Genera</div>
            </div>
          </CfRowFull>
          <CfRowFull label="Ragione sociale *"><CfVal value={CLIENTE.ragioneSociale} focus={focus === 0} /></CfRowFull>
          <CfRow2
            l1="Partita IVA *" c1={<div style={{ display: "flex", alignItems: "center", gap: 8, width: "100%" }}><CfVal value={CLIENTE.piva} mono focus={focus === 1} /><CfGreenBtn label="Auto" icon="zap" /></div>}
            l2="Cod. fiscale" c2={<CfVal value={CLIENTE.cf} mono />}
          />
          <CfRow2
            l1="Categoria" c1={<CfVal value="Officina" focus={focus === 2} />}
            l2="Sconto" c2={<CfVal value="10 %" />}
          />
        </CfCard>

        <CfCard title="Contatti">
          <CfRow2 first
            l1="Email" c1={<CfVal value={CLIENTE.email} focus={focus === 3} />}
            l2="Telefono" c2={<CfVal value={CLIENTE.telefono} />}
          />
        </CfCard>

        <CfCard title="Indirizzo">
          <CfRowFull label="Via / indirizzo" first><CfVal value={CLIENTE.indirizzo} focus={focus === 4} /></CfRowFull>
          <CfRow2
            l1="CAP" c1={<CfVal value={CLIENTE.cap} mono />}
            l2="Città · Pr." c2={<CfVal value={CLIENTE.citta} />}
          />
        </CfCard>

        <CfCard title="Fatturazione elettronica (SDI)">
          <CfRow2 first
            l1="Cod. dest." c1={<CfVal value={CLIENTE.sdi} mono focus={focus === 5} />}
            l2="PEC" c2={<CfVal value={CLIENTE.pec} />}
          />
        </CfCard>

        <CfFooter primary="Salva cliente" primaryIcon="check" secondary="Annulla" />
      </div>

      {toast && (
        <div style={{ position: "absolute", right: 4, bottom: 4, display: "flex", alignItems: "center", gap: 10, padding: "13px 18px", background: CF_COLORS.surface, border: `1px solid ${COLORS.sage[500]}`, boxShadow: "0 18px 50px rgba(0,0,0,0.5)" }}>
          <Icon name="checkCircle" size={20} color={COLORS.sage[400]} />
          <span style={{ fontSize: 13.5, color: CF_COLORS.txt }}>{toast}</span>
        </div>
      )}
    </div>
  );
};
