import React from "react";
import { MOBILE } from "../../lib/theme";
import { FONT_SANS } from "../../lib/fonts";
import { LogoMark } from "../../components/ui/Logo";
import { SOCCORSO } from "../../lib/data";

/** Banner notifica push iOS (da posizionare in alto sullo schermo del telefono). */
export const PushBanner: React.FC = () => (
  <div
    style={{
      width: 356,
      background: "rgba(30,34,44,0.86)",
      backdropFilter: "blur(24px)",
      borderRadius: 22,
      padding: "13px 15px",
      display: "flex",
      alignItems: "center",
      gap: 12,
      fontFamily: FONT_SANS,
      boxShadow: "0 20px 50px rgba(0,0,0,0.55)",
    }}
  >
    <div
      style={{
        width: 40,
        height: 40,
        borderRadius: 10,
        background: MOBILE.brand,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <LogoMark size={26} />
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.75)", letterSpacing: 0.3 }}>
          RESCUEMANAGER
        </span>
        <span style={{ fontSize: 11.5, color: "rgba(255,255,255,0.4)" }}>adesso</span>
      </div>
      <div style={{ fontSize: 14.5, fontWeight: 600, color: "#fff" }}>Nuovo trasporto assegnato</div>
      <div style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", marginTop: 1 }}>
        {SOCCORSO.client} · {SOCCORSO.intervento} · Ancona
      </div>
    </div>
  </div>
);
