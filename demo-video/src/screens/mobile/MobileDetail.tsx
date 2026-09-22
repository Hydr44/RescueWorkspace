import React from "react";
import { MOBILE, MOBILE_STATUS } from "../../lib/theme";
import { FONT_SANS } from "../../lib/fonts";
import { Icon } from "../../components/ui/Icon";
import { MobilePill } from "../../components/ui/Pill";
import { SOCCORSO } from "../../lib/data";

const StepDot: React.FC<{ label: string; state: "done" | "current" | "pending" }> = ({ label, state }) => {
  const color = state === "pending" ? MOBILE.textMuted : MOBILE.brand;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 7, flex: 1 }}>
      <div
        style={{
          width: 26,
          height: 26,
          borderRadius: 0,
          background: state === "pending" ? "transparent" : color,
          border: `2px solid ${color}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {state === "done" && <Icon name="check" size={14} color="#fff" />}
        {state === "current" && <div style={{ width: 8, height: 8, borderRadius: 0, background: "#fff" }} />}
      </div>
      <span style={{ fontSize: 11, color: state === "pending" ? MOBILE.textMuted : MOBILE.textPrimary, fontWeight: state === "current" ? 600 : 400 }}>
        {label}
      </span>
    </div>
  );
};

const RoutePoint: React.FC<{ kind: "pickup" | "dropoff"; label: string; addr: string }> = ({ kind, label, addr }) => (
  <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
    <div style={{ width: 11, height: 11, marginTop: 2, background: kind === "pickup" ? MOBILE.pickup : MOBILE.dropoff }} />
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: 0.7, color: MOBILE.textMuted, textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontSize: 13, color: MOBILE.textPrimary, marginTop: 2 }}>{addr}</div>
    </div>
  </div>
);

export const MobileDetail: React.FC = () => (
  <div style={{ flex: 1, display: "flex", flexDirection: "column", fontFamily: FONT_SANS }}>
    {/* header */}
    <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "6px 18px 14px" }}>
      <Icon name="arrowLeft" size={22} color={MOBILE.textPrimary} />
      <span style={{ fontSize: 18, fontWeight: 600, color: MOBILE.textPrimary, flex: 1 }}>
        Trasporto {SOCCORSO.number}
      </span>
      <MobilePill label={MOBILE_STATUS.enroute.label} bg={MOBILE_STATUS.enroute.bg} fg={MOBILE_STATUS.enroute.fg} />
    </div>

    <div style={{ flex: 1, padding: "0 18px", display: "flex", flexDirection: "column", gap: 14 }}>
      {/* cliente */}
      <div style={{ background: MOBILE.card, border: `0.5px solid ${MOBILE.border}`, padding: 15 }}>
        <div style={{ fontSize: 17, fontWeight: 600, color: MOBILE.textPrimary }}>{SOCCORSO.client}</div>
        <div style={{ fontSize: 13, color: MOBILE.brand, marginTop: 4, display: "flex", alignItems: "center", gap: 6 }}>
          <Icon name="phone" size={13} color={MOBILE.brand} /> {SOCCORSO.phone}
        </div>
      </div>

      {/* stepper */}
      <div style={{ background: MOBILE.card, border: `0.5px solid ${MOBILE.border}`, padding: "18px 15px" }}>
        <div style={{ display: "flex", position: "relative" }}>
          <div style={{ position: "absolute", top: 13, left: "17%", right: "17%", height: 2, background: MOBILE.border }} />
          <StepDot label="Assegnato" state="done" />
          <StepDot label="In Viaggio" state="current" />
          <StepDot label="Consegnato" state="pending" />
        </div>
      </div>

      {/* CTA */}
      <div style={{ height: 52, background: MOBILE.brand, display: "flex", alignItems: "center", justifyContent: "center", gap: 9, color: "#fff", fontSize: 15, fontWeight: 600 }}>
        <Icon name="navigation2" size={18} color="#fff" />
        Avvia navigazione
      </div>

      {/* 4 buttons */}
      <div style={{ display: "flex", gap: 10 }}>
        {[
          { l: "Foto", i: "camera" },
          { l: "Firma", i: "edit" },
          { l: "Chiama", i: "phone" },
          { l: "Segui", i: "share2" },
        ].map((b) => (
          <div key={b.l} style={{ flex: 1, height: 62, border: `0.5px solid ${MOBILE.border}`, background: MOBILE.card, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <Icon name={b.i} size={19} color={MOBILE.textSecondary} />
            <span style={{ fontSize: 11.5, color: MOBILE.textSecondary }}>{b.l}</span>
          </div>
        ))}
      </div>

      {/* dettagli */}
      <div style={{ background: MOBILE.card, border: `0.5px solid ${MOBILE.border}`, padding: 15, display: "flex", flexDirection: "column", gap: 13 }}>
        <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.8, color: MOBILE.textMuted, textTransform: "uppercase" }}>Dettagli</span>
        <RoutePoint kind="pickup" label="Ritiro" addr={SOCCORSO.partenza} />
        <RoutePoint kind="dropoff" label="Consegna" addr={SOCCORSO.arrivo} />
        <div style={{ display: "flex", justifyContent: "space-between", borderTop: `0.5px solid ${MOBILE.border}`, paddingTop: 12 }}>
          <span style={{ fontSize: 13, color: MOBILE.textMuted }}>Prezzo</span>
          <span style={{ fontSize: 15, fontWeight: 600, color: MOBILE.success }}>{SOCCORSO.prezzo}</span>
        </div>
      </div>
    </div>
    <div style={{ height: 24 }} />
  </div>
);
