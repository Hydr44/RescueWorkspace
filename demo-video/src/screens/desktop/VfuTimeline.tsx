import React from "react";
import { COLORS, alpha, RADIUS } from "../../lib/theme";
import { Btn, Card } from "../../components/desktop/kit";
import { DesktopPill } from "../../components/ui/Pill";
import { Icon } from "../../components/ui/Icon";
import { VFU, VFU_STEPS } from "../../lib/data";

type StepState = "done" | "current" | "pending";

const CHECKLIST = [
  { l: "Carburante aspirato", done: true },
  { l: "Olio motore", done: true },
  { l: "Olio cambio", done: true },
  { l: "Liquido freni", done: false },
  { l: "Antigelo", done: false },
  { l: "Gas condizionatore recuperato (R134a)", done: false },
];

export const VfuTimeline: React.FC<{
  activeIndex?: number;
  progress?: number;
  checked?: number;
}> = ({ activeIndex = 2, progress = 40, checked = 3 }) => {
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 20, fontWeight: 600, color: COLORS.ink }}>Lavorazione VFU</span>
            <span style={{ fontSize: 13, fontFamily: "'JetBrains Mono', monospace", color: COLORS.muted }}>{VFU.id}</span>
            <DesktopPill label="Preso in carico" color={COLORS.plum[400]} />
            <DesktopPill label="Con PRA" color={COLORS.brandHover} size={10} />
          </div>
          <div style={{ fontSize: 12.5, color: COLORS.muted, marginTop: 6 }}>{VFU.marca} · {VFU.targa} · {VFU.intestatario}</div>
        </div>
      </div>
      {/* progress */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <div style={{ flex: 1, height: 6, background: COLORS.border, borderRadius: 0, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${progress}%`, background: `linear-gradient(90deg, ${COLORS.sage[500]}, ${COLORS.sage[400]})`, borderRadius: 0 }} />
        </div>
        <span style={{ fontSize: 12, color: COLORS.body }}>Avanzamento {Math.round(progress)}% · {activeIndex}/{VFU_STEPS.length} fasi completate</span>
      </div>

      {/* master-detail */}
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "278px 1fr", gap: 14, minHeight: 0 }}>
        {/* sidebar fasi */}
        <Card pad={12} style={{ overflow: "hidden" }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.8, textTransform: "uppercase", color: COLORS.muted, padding: "2px 6px 10px" }}>Fasi di lavorazione</div>
          {VFU_STEPS.map((st, i) => {
            const state: StepState = i < activeIndex ? "done" : i === activeIndex ? "current" : "pending";
            const color = state === "done" ? COLORS.sage[400] : state === "current" ? COLORS.brandHover : COLORS.muted;
            return (
              <div key={st.code} style={{ display: "flex", alignItems: "center", gap: 11, padding: "10px 10px", borderRadius: RADIUS.md, marginBottom: 3, background: state === "current" ? alpha(COLORS.brand, 0.1) : "transparent", border: `1px solid ${state === "current" ? alpha(COLORS.brand, 0.25) : "transparent"}` }}>
                <div style={{ width: 30, height: 30, borderRadius: 0, background: alpha(color, 0.15), display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {state === "done" ? <Icon name="check" size={15} color={color} /> : <Icon name={st.icon} size={15} color={color} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: state === "current" ? 600 : 500, color: state === "pending" ? COLORS.muted : COLORS.ink200 }}>{st.label}</div>
                  <div style={{ fontSize: 10, color: color }}>{state === "done" ? "Completato" : state === "current" ? "In corso" : "In attesa"}</div>
                </div>
              </div>
            );
          })}
        </Card>

        {/* detail */}
        <Card pad={20} style={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 0, background: alpha(COLORS.sage[500], 0.16), display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name="droplet" size={19} color={COLORS.sage[400]} />
              </div>
              <span style={{ fontSize: 18, fontWeight: 600, color: COLORS.ink }}>Bonifica ambientale</span>
            </div>
            <DesktopPill label="Scade tra 3 gg" color={COLORS.sand[400]} size={11} />
          </div>
          <div style={{ fontSize: 12.5, color: COLORS.muted, lineHeight: 1.5, marginBottom: 18 }}>
            Aspirazione di tutti i liquidi: carburante, olio motore, olio cambio, liquido freni, antigelo. Rimozione filtro olio.
          </div>

          {/* checklist */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 20px", marginBottom: 18 }}>
            {CHECKLIST.map((c, i) => {
              const done = i < checked;
              return (
                <div key={c.l} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 20, height: 20, borderRadius: 0, background: done ? COLORS.sage[500] : "transparent", border: `1.5px solid ${done ? COLORS.sage[500] : COLORS.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {done && <Icon name="check" size={12} color="#fff" />}
                  </div>
                  <span style={{ fontSize: 12.5, color: done ? COLORS.ink200 : COLORS.muted }}>{c.l}</span>
                </div>
              );
            })}
          </div>

          {/* flow chips */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: "auto" }}>
            {[
              "Cliente registrato in Clienti",
              "Veicolo su RENTRI · movimento di carico",
              "Esplosione CER automatica alla bonifica",
            ].map((c) => (
              <span key={c} style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 11, color: COLORS.plum[300], background: alpha(COLORS.plum[500], 0.12), border: `1px solid ${alpha(COLORS.plum[500], 0.22)}`, borderRadius: 0, padding: "5px 10px" }}>
                <Icon name="zap" size={12} color={COLORS.plum[300]} /> {c}
              </span>
            ))}
          </div>

          {/* actions */}
          <div style={{ display: "flex", gap: 10, marginTop: 18, paddingTop: 16, borderTop: `1px solid ${COLORS.border}` }}>
            <Btn label="Completa fase" icon="check" variant="primary" glow />
            <Btn label="Salta" icon="chevronRight" />
            <div style={{ marginLeft: "auto", fontSize: 11.5, color: COLORS.muted, alignSelf: "center" }}>Avviato: 03/08 09:10</div>
          </div>
        </Card>
      </div>
    </div>
  );
};
