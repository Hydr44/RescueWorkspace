import React from "react";
import { MOBILE } from "../../lib/theme";
import { FONT_SANS } from "../../lib/fonts";
import { Icon } from "../../components/ui/Icon";
import { SOCCORSO } from "../../lib/data";

const TurnRight: React.FC = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
    <path d="M7 21 V11 a4 4 0 0 1 4 -4 h6" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    <polyline points="14 3 18 7 14 11" stroke="#fff" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const MobileNavigate: React.FC<{
  distance?: string;
  maneuver?: string;
  eta?: string;
}> = ({ distance = "Tra 200 m", maneuver = "Gira a destra su Via Marconi", eta = "09:53" }) => {
  const route = "M200 900 L200 560 L200 470 Q200 420 250 400 L340 360 L320 150";
  return (
    <div style={{ flex: 1, position: "relative", background: "#0A0F1A", fontFamily: FONT_SANS, overflow: "hidden" }}>
      {/* MAP */}
      <svg width="100%" height="100%" viewBox="0 0 400 866" preserveAspectRatio="xMidYMid slice" style={{ position: "absolute", inset: 0 }}>
        <rect width="400" height="866" fill="#0b111d" />
        {/* faint roads */}
        {["M-20 300 L420 250", "M-20 620 L420 560", "M120 -20 L90 900", "M300 -20 L340 900"].map((d, i) => (
          <path key={i} d={d} stroke="rgba(255,255,255,0.05)" strokeWidth="14" fill="none" />
        ))}
        {/* route casing + line */}
        <path d={route} stroke="#0A0F1A" strokeWidth="16" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d={route} stroke={MOBILE.brand} strokeWidth="9" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        {/* destination */}
        <circle cx="320" cy="150" r="9" fill={MOBILE.success} stroke="#fff" strokeWidth="2.5" />
        {/* driver arrow (fixed lower-center) */}
        <g transform="translate(200,560)">
          <circle r="26" fill="rgba(43,127,246,0.20)" />
          <polygon points="0,-16 11,10 0,3 -11,10" fill={MOBILE.brand} stroke="#fff" strokeWidth="2" />
        </g>
      </svg>

      {/* Maneuver banner */}
      <div style={{ position: "absolute", top: 14, left: 14, right: 14, background: "rgba(18,26,43,0.92)", border: `0.5px solid #26374F`, borderRadius: 0, padding: 14, display: "flex", alignItems: "center", gap: 13, backdropFilter: "blur(8px)" }}>
        <Icon name="chevronLeft" size={22} color={MOBILE.textMuted} />
        <div style={{ width: 48, height: 48, borderRadius: 0, background: MOBILE.brand, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <TurnRight />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 20, fontWeight: 600, color: "#5EA0F8" }}>{distance}</div>
          <div style={{ fontSize: 14, color: MOBILE.textPrimary, marginTop: 1 }}>{maneuver}</div>
        </div>
      </div>
      <div style={{ position: "absolute", top: 108, left: 26, display: "flex", alignItems: "center", gap: 6, background: "rgba(18,26,43,0.9)", padding: "6px 11px", borderRadius: 0, fontSize: 12, color: MOBILE.textMuted }}>
        <Icon name="cornerDownRight" size={13} color={MOBILE.textMuted} /> poi prosegui dritto
      </div>

      {/* Recenter */}
      <div style={{ position: "absolute", right: 16, bottom: 316, width: 46, height: 46, borderRadius: 0, background: "rgba(18,26,43,0.92)", border: `0.5px solid ${MOBILE.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon name="crosshair" size={20} color={MOBILE.brand} />
      </div>

      {/* Bottom sheet */}
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 300, background: MOBILE.card, borderTop: `0.5px solid ${MOBILE.border}`, borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: "12px 18px 20px" }}>
        <div style={{ width: 40, height: 4, borderRadius: 0, background: MOBILE.border, margin: "0 auto 16px" }} />
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 30, fontWeight: 700, color: MOBILE.success, lineHeight: 1 }}>{eta}</div>
            <div style={{ fontSize: 12, color: MOBILE.textMuted, marginTop: 4 }}>arrivo previsto</div>
          </div>
          <div style={{ display: "flex", gap: 22 }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 17, fontWeight: 600, color: MOBILE.textPrimary }}>{SOCCORSO.eta}</div>
              <div style={{ fontSize: 11, color: MOBILE.textMuted }}>tempo</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 17, fontWeight: 600, color: MOBILE.textPrimary }}>{SOCCORSO.distanza}</div>
              <div style={{ fontSize: 11, color: MOBILE.textMuted }}>distanza</div>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "12px 0", borderTop: `0.5px solid ${MOBILE.border}` }}>
          <Icon name="phone" size={18} color={MOBILE.success} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13.5, color: MOBILE.textPrimary }}>Chiama cliente</div>
            <div style={{ fontSize: 11.5, color: MOBILE.textMuted }}>{SOCCORSO.client} · {SOCCORSO.phone}</div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
          <div style={{ flex: 1, height: 48, background: MOBILE.brand, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, color: "#fff", fontSize: 14, fontWeight: 600 }}>
            <Icon name="checkCircle" size={17} color="#fff" /> Consegnato
          </div>
          <div style={{ width: 56, height: 48, border: `0.5px solid ${MOBILE.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name="camera" size={19} color={MOBILE.textSecondary} />
          </div>
          <div style={{ width: 56, height: 48, border: `0.5px solid ${MOBILE.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name="edit" size={19} color={MOBILE.textSecondary} />
          </div>
        </div>
        <div style={{ textAlign: "center", marginTop: 14, fontSize: 12.5, color: MOBILE.brand, display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
          <Icon name="volume2" size={15} color={MOBILE.brand} /> Naviga con voce (app Mappe)
        </div>
      </div>
    </div>
  );
};
