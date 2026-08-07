import React from "react";
import { MOBILE } from "../../lib/theme";
import { FONT_SANS } from "../../lib/fonts";
import { Icon } from "../../components/ui/Icon";

const SIGN_PATH =
  "M20 90 C40 40, 60 40, 70 70 S95 120, 115 80 S150 20, 175 70 C190 100, 210 60, 235 75 C255 87, 270 70, 300 55";
const SIGN_LEN = 620;

export const MobileFirma: React.FC<{ signProgress?: number; done?: boolean }> = ({
  signProgress = 1,
  done = false,
}) => (
  <div style={{ flex: 1, display: "flex", flexDirection: "column", fontFamily: FONT_SANS }}>
    {/* header */}
    <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "6px 18px 14px" }}>
      <Icon name="arrowLeft" size={22} color={MOBILE.textPrimary} />
      <span style={{ fontSize: 18, fontWeight: 600, color: MOBILE.textPrimary }}>Firma del cliente</span>
    </div>

    <div style={{ flex: 1, padding: "0 18px", display: "flex", flexDirection: "column" }}>
      {/* chi firma */}
      <div style={{ fontSize: 12, fontWeight: 500, color: MOBILE.textSecondary, marginBottom: 8 }}>Chi firma</div>
      <div style={{ display: "flex", marginBottom: 20, border: `0.5px solid ${MOBILE.border}` }}>
        {["Cliente", "Concessionaria", "Officina"].map((t, i) => {
          const on = i === 0;
          return (
            <div key={t} style={{ flex: 1, height: 42, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: on ? 600 : 400, color: on ? "#fff" : MOBILE.textMuted, background: on ? MOBILE.brand : "transparent", borderLeft: i > 0 ? `0.5px solid ${MOBILE.border}` : "none" }}>
              {t}
            </div>
          );
        })}
      </div>

      {/* canvas */}
      <div style={{ position: "relative", height: 250, background: "#fff", border: `2px solid ${done ? MOBILE.success : MOBILE.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg width="330" height="150" viewBox="0 0 330 150">
          <path
            d={SIGN_PATH}
            fill="none"
            stroke="#0d1b34"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={SIGN_LEN}
            strokeDashoffset={SIGN_LEN * (1 - signProgress)}
          />
        </svg>
        {signProgress < 0.05 && (
          <span style={{ position: "absolute", fontSize: 14, color: "#9aa4b2" }}>Firma qui</span>
        )}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
        <span style={{ fontSize: 12, color: MOBILE.textMuted, maxWidth: 220, lineHeight: 1.4 }}>
          Firma per accettare le condizioni e autorizzare il trasporto.
        </span>
        <span style={{ fontSize: 12.5, color: MOBILE.error }}>Cancella</span>
      </div>

      <div style={{ flex: 1 }} />

      {done ? (
        <div style={{ background: "#0F2E25", border: `0.5px solid ${MOBILE.success}`, padding: 16, display: "flex", alignItems: "center", gap: 12, marginBottom: 22 }}>
          <Icon name="checkCircle" size={24} color={MOBILE.success} />
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: MOBILE.success }}>Firma raccolta</div>
            <div style={{ fontSize: 12, color: MOBILE.textSecondary, marginTop: 2 }}>Consenso firmato · 03/08/2026 09:58</div>
          </div>
        </div>
      ) : (
        <div style={{ height: 52, background: MOBILE.brand, display: "flex", alignItems: "center", justifyContent: "center", gap: 9, color: "#fff", fontSize: 15, fontWeight: 600, marginBottom: 22 }}>
          <Icon name="check" size={18} color="#fff" /> Conferma firma
        </div>
      )}
    </div>
  </div>
);
