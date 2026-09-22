import React from "react";
import { COLORS } from "../../lib/theme";
import { Icon } from "../../components/ui/Icon";
import { CfTopbar, CfCard, CfRowFull, CfRow2, CfVal, CfSegment, CfFooter, CF_COLORS } from "../../components/desktop/cf";
import { RICAMBIO } from "../../lib/data";

/**
 * Nuovo ricambio — fedele a src/pages/SparePartAddPage.jsx: datasheet SQUADRATO,
 * colonna singola, gutter label 130px, condizione segmentata, ring completamento,
 * footer con "Salva e stampa etichetta". (Niente lista laterale.)
 */
export const RicambiScreen: React.FC<{ focus?: number; added?: boolean; toast?: string }> = ({ focus = -1, added, toast }) => {
  const pct = added ? 100 : 72;
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", position: "relative" }}>
      <div style={{ maxWidth: 860, width: "100%", margin: "0 auto", flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
        <CfTopbar title="Nuovo ricambio" sub="Un solo flusso · pochi campi · foto ed etichetta incluse" pct={pct} primary="Salva" primaryIcon="check" />

        {/* scan bar */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, background: CF_COLORS.surface, border: `1px solid ${CF_COLORS.border}`, padding: 10, marginBottom: 12 }}>
          <div style={{ width: 34, height: 34, background: CF_COLORS.input, border: `1px solid ${CF_COLORS.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name="search" size={16} color={COLORS.blue400} />
          </div>
          <span style={{ fontSize: 12.5, color: COLORS.placeholder }}>Scansiona o incolla un codice ricambio…</span>
        </div>

        <CfCard title="Dati ricambio">
          <CfRowFull label="Codice" first><CfVal value="RM-FRE-0042 · assegnato al salvataggio" mono muted /></CfRowFull>
          <CfRowFull label="Nome *"><CfVal value={RICAMBIO.descrizione} focus={focus === 0} /></CfRowFull>
          <CfRow2
            l1="Categoria" c1={<CfVal value={RICAMBIO.categoria} focus={focus === 1} />}
            l2="Condizione" c2={<CfSegment options={["Usato", "Rigenerato", "Nuovo"]} active={0} />}
          />
          <CfRow2
            l1="Quantità" c1={<CfVal value="1" />}
            l2="Prezzo" c2={<div style={{ display: "flex", alignItems: "center", gap: 8, width: "100%" }}><CfVal value={RICAMBIO.prezzoVen} mono focus={focus === 2} /></div>}
          />
          <CfRowFull label="Ubicazione"><CfVal value={RICAMBIO.ubicazione} focus={focus === 3} /></CfRowFull>
        </CfCard>

        <CfCard title="Provenienza">
          <CfRowFull label="Da demolizione" first>
            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <div style={{ width: 16, height: 16, background: COLORS.brand, display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="check" size={11} color="#fff" /></div>
              <span style={{ fontSize: 12.5, color: CF_COLORS.txt }}>Pezzo proveniente da un'auto rottamata</span>
            </div>
          </CfRowFull>
          <CfRow2
            l1="Marca" c1={<CfVal value="Fiat" focus={focus === 4} />}
            l2="Modello" c2={<CfVal value="Panda 1.2" />}
          />
          <CfRowFull label="Anno"><CfVal value="2015" /></CfRowFull>
        </CfCard>

        <CfCard title="Foto">
          <div style={{ margin: 14, height: 84, border: `1.5px dashed ${CF_COLORS.border}`, background: CF_COLORS.input, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <Icon name="image" size={22} color={CF_COLORS.muted} />
            <span style={{ fontSize: 11.5, color: CF_COLORS.muted }}>Trascina o clicca per aggiungere foto</span>
          </div>
        </CfCard>

        <CfFooter primary="Salva e stampa etichetta" primaryIcon="printer" secondary="Salva" />
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
