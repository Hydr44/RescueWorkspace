import React from "react";
import { MOBILE } from "../../lib/theme";
import { FONT_SANS } from "../../lib/fonts";

export const SCREEN_W = 400;
export const SCREEN_H = 866;
const BEZEL = 15;
export const PHONE_W = SCREEN_W + BEZEL * 2;
export const PHONE_H = SCREEN_H + BEZEL * 2;

/** Status bar iOS (ora + segnale/wifi/batteria). */
export const MobileStatusBar: React.FC<{ dark?: boolean }> = () => {
  const col = MOBILE.textPrimary;
  return (
    <div
      style={{
        height: 46,
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 26px 0 30px",
        fontFamily: FONT_SANS,
      }}
    >
      <span style={{ fontSize: 15, fontWeight: 600, color: col }}>9:41</span>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {/* signal */}
        <svg width="18" height="12" viewBox="0 0 18 12">
          {[0, 1, 2, 3].map((i) => (
            <rect
              key={i}
              x={i * 4.6}
              y={9 - i * 3}
              width="3"
              height={3 + i * 3}
              rx="0.6"
              fill={col}
            />
          ))}
        </svg>
        {/* wifi */}
        <svg width="17" height="12" viewBox="0 0 24 18" fill="none">
          <path d="M2 6a15 15 0 0 1 20 0" stroke={col} strokeWidth="2.2" strokeLinecap="round" />
          <path d="M6 10a9 9 0 0 1 12 0" stroke={col} strokeWidth="2.2" strokeLinecap="round" />
          <circle cx="12" cy="15" r="1.6" fill={col} />
        </svg>
        {/* battery */}
        <svg width="26" height="13" viewBox="0 0 26 13">
          <rect x="0.6" y="0.6" width="22" height="11.8" rx="3" fill="none" stroke={col} strokeOpacity="0.5" />
          <rect x="2.2" y="2.2" width="17" height="8.6" rx="1.6" fill={col} />
          <rect x="23.4" y="4" width="1.8" height="5" rx="1" fill={col} fillOpacity="0.6" />
        </svg>
      </div>
    </div>
  );
};

/** Telefono: bezel nero, notch/dynamic island, schermo scuro. */
export const PhoneFrame: React.FC<{
  children: React.ReactNode;
  statusBar?: boolean;
}> = ({ children, statusBar = true }) => {
  return (
    <div
      style={{
        width: PHONE_W,
        height: PHONE_H,
        borderRadius: 62,
        background: "linear-gradient(150deg, #23272f, #0b0d12)",
        padding: BEZEL,
        boxShadow:
          "0 40px 90px rgba(0,0,0,0.7), inset 0 0 2px 1px rgba(255,255,255,0.08)",
      }}
    >
      <div
        style={{
          position: "relative",
          width: SCREEN_W,
          height: SCREEN_H,
          borderRadius: 48,
          overflow: "hidden",
          background: MOBILE.bg,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {statusBar && <MobileStatusBar />}
        {/* dynamic island */}
        <div
          style={{
            position: "absolute",
            top: 12,
            left: "50%",
            transform: "translateX(-50%)",
            width: 116,
            height: 32,
            borderRadius: 20,
            background: "#000",
            zIndex: 20,
          }}
        />
        <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
          {children}
        </div>
      </div>
    </div>
  );
};
