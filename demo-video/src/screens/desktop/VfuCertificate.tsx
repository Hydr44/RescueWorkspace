import React from "react";
import { COLORS, alpha, RADIUS } from "../../lib/theme";
import { Btn, Card, SectionHead } from "../../components/desktop/kit";
import { DesktopPill } from "../../components/ui/Pill";
import { Icon } from "../../components/ui/Icon";
import { LogoMark } from "../../components/ui/Logo";
import { VFU } from "../../lib/data";

const FLOW = ["Conferito", "In carico", "Validato", "Da radiare", "Inviato a STA", "Radiato", "Demolito"];

const Sum: React.FC<{ l: string; v: string; icon: string; color: string }> = ({ l, v, icon, color }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 0", borderBottom: `1px solid ${alpha(COLORS.border, 0.6)}` }}>
    <div style={{ width: 30, height: 30, borderRadius: 0, background: alpha(color, 0.14), display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Icon name={icon} size={15} color={color} />
    </div>
    <span style={{ fontSize: 12.5, color: COLORS.muted, flex: 1 }}>{l}</span>
    <span style={{ fontSize: 12.5, fontWeight: 500, color: COLORS.ink200 }}>{v}</span>
  </div>
);

export const VfuCertificate: React.FC<{ generated?: boolean; toast?: string }> = ({
  generated = true,
  toast,
}) => (
  <div style={{ height: "100%", display: "flex", flexDirection: "column", position: "relative" }}>
    {/* header */}
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 20, fontWeight: 600, color: COLORS.ink }}>Pratica {VFU.id}</span>
          <DesktopPill label="Demolito" color={COLORS.sage[400]} />
          <DesktopPill label="Con PRA" color={COLORS.brandHover} size={10} />
        </div>
        <div style={{ fontSize: 12.5, color: COLORS.muted, marginTop: 6 }}>{VFU.marca} · {VFU.targa} · {VFU.intestatario}</div>
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <Btn label="Scarica PDF" icon="download" />
        <Btn label="Chiudi pratica" icon="check" variant="sage" />
      </div>
    </div>

    {/* state flow */}
    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 16 }}>
      {FLOW.map((s, i) => (
        <React.Fragment key={s}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "6px 12px", borderRadius: RADIUS.pill, fontSize: 11.5, fontWeight: 500, color: COLORS.sage[400], background: alpha(COLORS.sage[500], 0.12), border: `1px solid ${alpha(COLORS.sage[500], 0.25)}` }}>
            <Icon name="check" size={12} color={COLORS.sage[400]} /> {s}
          </div>
          {i < FLOW.length - 1 && <div style={{ width: 18, height: 1.5, background: alpha(COLORS.sage[500], 0.4) }} />}
        </React.Fragment>
      ))}
    </div>

    <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1.05fr", gap: 14, minHeight: 0 }}>
      {/* riepilogo */}
      <Card pad={20} style={{ display: "flex", flexDirection: "column" }}>
        <SectionHead icon="checkCircle" title="Chiusura pratica VFU" color={COLORS.sage[400]} />
        <Sum l="Pesate (ingresso → carcassa)" v={`${VFU.pesoIngresso} → ${VFU.pesoCarcassa} kg`} icon="barChart2" color={COLORS.brandHover} />
        <Sum l="CER bonifica" v="8 righe" icon="droplet" color={COLORS.plum[400]} />
        <Sum l="Movimenti RENTRI" v="Trasmessi ✓" icon="trash2" color={COLORS.sage[400]} />
        <Sum l="Radiazione PRA" v="Confermata da STA" icon="fileText" color={COLORS.sand[400]} />
        <Sum l="Fattura cliente" v="Emessa" icon="euro" color={COLORS.sage[400]} />
        <div style={{ marginTop: "auto", paddingTop: 18 }}>
          <Btn label="Genera Certificato di Rottamazione" icon="fileCheck" variant="primary" glow />
        </div>
      </Card>

      {/* CDR document */}
      <div style={{ opacity: generated ? 1 : 0.15, display: "flex", alignItems: "stretch" }}>
        <div style={{ flex: 1, background: "linear-gradient(180deg,#fbfcfe,#eef1f6)", borderRadius: RADIUS.lg, padding: "26px 30px", boxShadow: "0 24px 60px rgba(0,0,0,0.45)", display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" }}>
          {/* header */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, borderBottom: "2px solid #d7dde8", paddingBottom: 16, marginBottom: 18 }}>
            <LogoMark size={38} />
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#0f1b2e", letterSpacing: 0.5 }}>CERTIFICATO DI ROTTAMAZIONE</div>
              <div style={{ fontSize: 11, color: "#5a6b82" }}>Art. 5 D.Lgs. 209/2003 — Registro VFU ACI/MIT</div>
            </div>
          </div>
          {[
            ["N° certificato", "CDR-2026-000318", true],
            ["Targa", VFU.targa, true],
            ["Telaio", VFU.telaio, true],
            ["Marca / Modello", VFU.marca, false],
            ["Intestatario", VFU.intestatario, false],
            ["Data di rilascio", "03/08/2026", false],
            ["Centro di raccolta", "Autosoccorso Bianchi SRL", false],
          ].map(([l, v, mono]) => (
            <div key={l as string} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #e4e8f0" }}>
              <span style={{ fontSize: 12, color: "#5a6b82" }}>{l}</span>
              <span style={{ fontSize: 12.5, fontWeight: 600, color: "#16233a", fontFamily: mono ? "'JetBrains Mono', monospace" : undefined }}>{v}</span>
            </div>
          ))}
          {/* stamp */}
          <div style={{ position: "absolute", right: 26, bottom: 24, width: 118, height: 118, borderRadius: "50%", border: `3px solid ${alpha(COLORS.sage[600], 0.85)}`, transform: "rotate(-14deg)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, color: COLORS.sage[600] }}>
            <span style={{ fontSize: 15, fontWeight: 800, letterSpacing: 1 }}>ROTTAMATO</span>
            <span style={{ fontSize: 8.5, fontWeight: 600 }}>D.Lgs 209/03</span>
            <span style={{ fontSize: 8.5, fontWeight: 600 }}>03·08·2026</span>
          </div>
          <div style={{ marginTop: "auto", fontSize: 10.5, color: "#7a8699", paddingTop: 14 }}>
            Documento generato dal sistema · valido ai fini della radiazione al PRA
          </div>
        </div>
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
