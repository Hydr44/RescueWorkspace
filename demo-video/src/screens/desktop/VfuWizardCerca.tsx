import React from "react";
import { COLORS, alpha } from "../../lib/theme";
import { Icon } from "../../components/ui/Icon";
import { DesktopPill } from "../../components/ui/Pill";
import { VFU } from "../../lib/data";

/**
 * Nuova pratica VFU — Step 1 "Cerca veicolo" — fedele a src/pages/nuova-pratica/
 * (WizardShell + Cerca). SQUADRATO (cf-* datasheet, border-radius 0 ovunque),
 * topbar + stepper a badge quadrati con connettori, targa HERO ACI/MIT, card
 * tipo veicolo, riquadro risultato "Veicolo trovato".
 */
const CF = { surface: COLORS.card, input: COLORS.bg, border: COLORS.border, blue: COLORS.brand, blueHi: COLORS.brandHover };

const STEPS = [
  { l: "Cerca veicolo", s: "PRA o non-PRA" },
  { l: "Dati pratica", s: "Intestatario" },
  { l: "Documenti", s: "Targhe e allegati" },
  { l: "Conferma", s: "Invio al Registro" },
];

/** Stepper reale: badge quadrati (i dot rounded-full sono resi 0 dal cf-root) + connettori. */
export const CfStepper: React.FC<{ current: number }> = ({ current }) => (
  <div style={{ display: "flex", alignItems: "center", background: CF.surface, border: `1px solid ${CF.border}`, padding: "12px 16px", marginBottom: 14 }}>
    {STEPS.map((st, i) => {
      const done = i < current;
      const on = i === current;
      const badgeBg = done ? COLORS.success : on ? COLORS.brandHover : CF.surface;
      const badgeFg = done || on ? "#fff" : COLORS.muted;
      return (
        <React.Fragment key={st.l}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 26, height: 26, background: badgeBg, border: `1px solid ${done ? COLORS.success : on ? COLORS.brandHover : CF.border}`, color: badgeFg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 600, boxShadow: on ? `0 0 0 4px ${alpha(COLORS.brandHover, 0.2)}` : "none" }}>
              {done ? <Icon name="check" size={13} color="#fff" /> : i + 1}
            </div>
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: on ? COLORS.ink : done ? COLORS.body : COLORS.muted }}>{st.l}</div>
              <div style={{ fontSize: 10, color: COLORS.faint }}>{st.s}</div>
            </div>
          </div>
          {i < STEPS.length - 1 && <div style={{ flex: 1, height: 1, margin: "0 12px", background: done ? alpha(COLORS.success, 0.4) : CF.border }} />}
        </React.Fragment>
      );
    })}
  </div>
);

const HeroPlate: React.FC<{ text: string }> = ({ text }) => (
  <div style={{ display: "flex", height: 60, background: "#fff", border: "1px solid #0d1117", boxShadow: "0 6px 20px rgba(0,0,0,0.35)", alignItems: "stretch", overflow: "hidden" }}>
    <div style={{ width: 44, background: "#003399", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, paddingTop: 4 }}>
      <div style={{ display: "flex", gap: 2 }}>
        <span style={{ color: "#FFCC00", fontSize: 6 }}>★</span>
        <span style={{ color: "#FFCC00", fontSize: 6 }}>★</span>
      </div>
      <span style={{ color: "#fff", fontSize: 13, fontWeight: 800 }}>I</span>
    </div>
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'JetBrains Mono', monospace", fontSize: 30, fontWeight: 800, letterSpacing: 8, color: "#0d1117" }}>
      {text}
    </div>
  </div>
);

const VTypeCard: React.FC<{ label: string; icon: string; on?: boolean }> = ({ label, icon, on }) => (
  <div style={{ flex: 1, position: "relative", padding: "14px 8px", textAlign: "center", background: on ? alpha(CF.blue, 0.1) : CF.input, border: `1px solid ${on ? CF.blue : CF.border}` }}>
    {on && <div style={{ position: "absolute", top: 6, right: 6 }}><Icon name="check" size={12} color={CF.blueHi} /></div>}
    <Icon name={icon} size={22} color={on ? CF.blueHi : COLORS.muted} style={{ margin: "0 auto 8px" }} />
    <div style={{ fontSize: 12, fontWeight: 600, color: on ? COLORS.ink : COLORS.body }}>{label}</div>
  </div>
);

const CfInput: React.FC<{ label: string; value: string; mono?: boolean }> = ({ label, value, mono }) => (
  <div>
    <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: 0.6, textTransform: "uppercase", color: COLORS.muted, marginBottom: 6 }}>{label}</div>
    <div style={{ height: 34, display: "flex", alignItems: "center", padding: "0 10px", fontSize: 12.5, fontFamily: mono ? "'JetBrains Mono', monospace" : undefined, color: COLORS.ink200, background: CF.input, border: `1px solid ${CF.border}` }}>{value}</div>
  </div>
);

const KV: React.FC<{ l: string; v: string; mono?: boolean; last?: boolean }> = ({ l, v, mono, last }) => (
  <div style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: last ? "none" : `1px solid ${alpha(CF.border, 0.6)}` }}>
    <span style={{ fontSize: 11.5, color: COLORS.muted }}>{l}</span>
    <span style={{ fontSize: 12.5, color: COLORS.ink200, fontFamily: mono ? "'JetBrains Mono', monospace" : undefined }}>{v}</span>
  </div>
);

export const VfuWizardCerca: React.FC<{ found?: boolean }> = ({ found = true }) => (
  <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
    {/* topbar */}
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
      <div style={{ width: 32, height: 32, background: CF.input, border: `1px solid ${CF.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon name="arrowLeft" size={16} color={COLORS.body} />
      </div>
      <div>
        <div style={{ fontSize: 16, fontWeight: 600, color: COLORS.ink }}>Nuova pratica VFU</div>
        <div style={{ fontSize: 11, color: COLORS.muted, marginTop: 2 }}>Registro Veicoli Fuori Uso — ACI/MIT · Passo 1/4</div>
      </div>
    </div>

    <CfStepper current={0} />

    {/* body */}
    <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1.15fr 1fr", gap: 14, minHeight: 0 }}>
      <div style={{ background: CF.surface, border: `1px solid ${CF.border}`, padding: 20 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: COLORS.ink, marginBottom: 6, textAlign: "center" }}>Cerca il veicolo</div>
        <div style={{ fontSize: 11.5, color: COLORS.muted, lineHeight: 1.5, marginBottom: 16, textAlign: "center" }}>
          Il Registro ACI/MIT verifica il veicolo e pre-compila i dati anagrafici.
        </div>

        <HeroPlate text={VFU.targa} />
        <div style={{ fontSize: 11, color: COLORS.muted, textAlign: "center", margin: "10px 0 18px" }}>
          Non hai la targa? <span style={{ color: CF.blueHi }}>Cerca per telaio</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <span style={{ fontSize: 11.5, fontWeight: 600, color: COLORS.body }}>Tipo di veicolo <span style={{ color: COLORS.danger }}>*</span></span>
          <DesktopPill label="Soggetto a PRA" color={CF.blueHi} size={9} />
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
          <VTypeCard label="Autoveicolo" icon="car" on />
          <VTypeCard label="Motoveicolo" icon="navigation2" />
          <VTypeCard label="Ciclomotore" icon="navigation2" />
          <VTypeCard label="Rimorchio" icon="package" />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 18 }}>
          <CfInput label="Causale" value={VFU.causale} />
          <CfInput label="CF intestatario (opz.)" value="RSSMRA80A01H501U" mono />
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, height: 42, background: CF.blue, color: "#fff", fontSize: 13, fontWeight: 600 }}>
          <Icon name="search" size={16} color="#fff" /> Cerca veicolo nel Registro
        </div>
      </div>

      {/* result */}
      <div style={{ opacity: found ? 1 : 0.25, display: "flex" }}>
        <div style={{ flex: 1, background: CF.surface, border: `1px solid ${found ? alpha(COLORS.sage[500], 0.4) : CF.border}`, padding: 20, display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Icon name="checkCircle" size={18} color={COLORS.sage[400]} />
              <span style={{ fontSize: 14, fontWeight: 600, color: COLORS.ink200 }}>Veicolo trovato</span>
            </div>
            <DesktopPill label="Soggetto a PRA" color={CF.blueHi} size={9} />
          </div>
          <KV l="Targa" v={VFU.targa} mono />
          <KV l="Telaio" v={VFU.telaio} mono />
          <KV l="Tipo" v={`A — ${VFU.tipo}`} />
          <KV l="Marca / Modello" v={VFU.marca} />
          <KV l="Intestatario" v={VFU.intestatario} />
          <KV l="Radiabile" v="Sì (con obbligo PRA)" last />
          <div style={{ marginTop: "auto", paddingTop: 16, display: "flex", gap: 10 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, height: 38, padding: "0 16px", background: COLORS.sage[600], color: "#fff", fontSize: 12.5, fontWeight: 600 }}>
              <Icon name="plus" size={15} color="#fff" /> Aggiungi alla pratica
            </div>
            <div style={{ display: "inline-flex", alignItems: "center", height: 38, padding: "0 14px", background: CF.input, border: `1px solid ${CF.border}`, color: COLORS.body, fontSize: 12.5 }}>Cerca un altro</div>
          </div>
        </div>
      </div>
    </div>
  </div>
);
