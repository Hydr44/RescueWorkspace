import React from "react";
import { COLORS, alpha, SHADOW } from "../../lib/theme";
import { FONT_SANS } from "../../lib/fonts";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { StatusBar } from "./StatusBar";

/** Dimensione logica della finestra desktop (poi scalata sullo Stage). */
export const DESKTOP_W = 1560;
export const DESKTOP_H = 946;

/**
 * Finestra macOS completa: title bar con semafori + shell app
 * (Sidebar + Topbar + contenuto + StatusBar).
 */
export const DesktopFrame: React.FC<{
  active: string;
  crumbs: string[];
  children: React.ReactNode;
  contentPad?: number;
}> = ({ active, crumbs, children, contentPad = 24 }) => {
  return (
    <div
      style={{
        width: DESKTOP_W,
        height: DESKTOP_H,
        borderRadius: 15,
        overflow: "hidden",
        background: COLORS.bg,
        border: `1px solid ${alpha(COLORS.white, 0.09)}`,
        boxShadow: SHADOW.device,
        fontFamily: FONT_SANS,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Title bar macOS */}
      <div
        style={{
          height: 30,
          flexShrink: 0,
          background: COLORS.sidebar,
          display: "flex",
          alignItems: "center",
          padding: "0 14px",
          position: "relative",
          borderBottom: `1px solid ${alpha(COLORS.white, 0.04)}`,
        }}
      >
        <div style={{ display: "flex", gap: 8 }}>
          {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
            <span
              key={c}
              style={{ width: 12, height: 12, borderRadius: "50%", background: c }}
            />
          ))}
        </div>
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            textAlign: "center",
            fontSize: 12,
            fontWeight: 500,
            color: alpha(COLORS.white, 0.4),
            pointerEvents: "none",
          }}
        >
          RescueManager
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
        <Sidebar active={active} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
          <Topbar crumbs={crumbs} />
          <div
            style={{
              flex: 1,
              background: COLORS.bg,
              padding: contentPad,
              overflow: "hidden",
              minHeight: 0,
            }}
          >
            {children}
          </div>
          <StatusBar />
        </div>
      </div>
    </div>
  );
};
