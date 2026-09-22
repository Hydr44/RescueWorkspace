import React from "react";
import { MOBILE, MOBILE_STATUS } from "../../lib/theme";
import { FONT_SANS } from "../../lib/fonts";
import { Icon } from "../../components/ui/Icon";
import { MobilePill } from "../../components/ui/Pill";
import { TabBar } from "../../components/mobile/TabBar";
import { DRIVER, SOCCORSO } from "../../lib/data";

const RoutePoint: React.FC<{ kind: "pickup" | "dropoff"; label: string; addr: string }> = ({
  kind,
  label,
  addr,
}) => (
  <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
    <div
      style={{
        width: 12,
        height: 12,
        marginTop: 2,
        background: kind === "pickup" ? MOBILE.pickup : MOBILE.dropoff,
      }}
    />
    <div style={{ flex: 1 }}>
      <div
        style={{
          fontSize: 9,
          fontWeight: 600,
          letterSpacing: 0.8,
          color: MOBILE.textMuted,
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 13.5, color: MOBILE.textPrimary, marginTop: 2 }}>{addr}</div>
    </div>
  </div>
);

const ActionBtn: React.FC<{ label: string; icon: string; primary?: boolean }> = ({
  label,
  icon,
  primary,
}) => (
  <div
    style={{
      flex: 1,
      height: 44,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 7,
      fontSize: 13,
      fontWeight: 500,
      color: primary ? "#fff" : MOBILE.textSecondary,
      background: primary ? MOBILE.brand : "transparent",
      borderLeft: primary ? "none" : `0.5px solid ${MOBILE.border}`,
    }}
  >
    <Icon name={icon} size={17} color={primary ? "#fff" : MOBILE.textSecondary} />
    {label}
  </div>
);

export const MobileHome: React.FC = () => {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", fontFamily: FONT_SANS }}>
      {/* Header greeting */}
      <div
        style={{
          padding: "8px 20px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <div style={{ fontSize: 22, fontWeight: 600, color: MOBILE.textPrimary }}>
            Buongiorno, {DRIVER.name.split(" ")[0]}
          </div>
          <div style={{ fontSize: 13, color: MOBILE.textMuted, marginTop: 3 }}>
            lunedì 3 agosto
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ position: "relative" }}>
            <Icon name="bell" size={22} color={MOBILE.textSecondary} />
            <span
              style={{
                position: "absolute",
                top: -2,
                right: -2,
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: MOBILE.error,
              }}
            />
          </div>
          <div
            style={{
              width: 38,
              height: 38,
              background: MOBILE.brand,
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            {DRIVER.initials}
          </div>
        </div>
      </div>

      <div style={{ flex: 1, padding: "0 20px", overflow: "hidden" }}>
        {/* ADESSO */}
        <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: 1.4, color: MOBILE.textMuted, marginBottom: 10 }}>
          ADESSO
        </div>
        <div
          style={{
            background: MOBILE.card,
            border: `0.5px solid ${MOBILE.borderAccent}`,
            padding: 16,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
            <div style={{ fontSize: 18, fontWeight: 600, color: MOBILE.textPrimary }}>
              {SOCCORSO.client}
            </div>
            <MobilePill label={MOBILE_STATUS.assigned.label} bg={MOBILE_STATUS.assigned.bg} fg={MOBILE_STATUS.assigned.fg} size={12} />
          </div>
          <div style={{ fontSize: 12, fontFamily: "'JetBrains Mono', monospace", color: MOBILE.textMuted, marginBottom: 16 }}>
            #{SOCCORSO.number} · {SOCCORSO.intervento}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
            <RoutePoint kind="pickup" label="Ritiro" addr={SOCCORSO.partenza} />
            <RoutePoint kind="dropoff" label="Consegna" addr={SOCCORSO.arrivo} />
          </div>

          <div style={{ display: "flex", borderTop: `0.5px solid ${MOBILE.border}`, margin: "0 -16px -16px", overflow: "hidden" }}>
            <ActionBtn label="Naviga" icon="navigation2" />
            <ActionBtn label="Chiama" icon="phone" />
            <ActionBtn label="Inizia viaggio" icon="play" primary />
          </div>
        </div>

        {/* A SEGUIRE */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "22px 0 12px" }}>
          <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: 1.4, color: MOBILE.textMuted }}>
            A SEGUIRE
          </span>
          <span style={{ fontSize: 12, color: MOBILE.brand }}>Vedi tutti →</span>
        </div>

        {[
          { t: "10:30", c: "Marco Neri", a: "Via Roma 4 — Jesi", s: "assigned" as const },
          { t: "12:15", c: "AutoFlotta SPA", a: "Milano Lambrate", s: "new" as const },
        ].map((r) => (
          <div
            key={r.t}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: "13px 14px",
              background: MOBILE.card,
              border: `0.5px solid ${MOBILE.border}`,
              marginBottom: 8,
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 600, color: MOBILE.textSecondary, width: 42 }}>{r.t}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, color: MOBILE.textPrimary }}>{r.c}</div>
              <div style={{ fontSize: 11.5, color: MOBILE.textMuted, marginTop: 2 }}>{r.a}</div>
            </div>
            <MobilePill label={MOBILE_STATUS[r.s].label} bg={MOBILE_STATUS[r.s].bg} fg={MOBILE_STATUS[r.s].fg} size={11} />
          </div>
        ))}
      </div>

      <TabBar active="home" />
    </div>
  );
};
