import React from "react";
import { COLORS, alpha } from "../../lib/theme";
import { FONT_SANS, FONT_MONO } from "../../lib/fonts";
import { Icon } from "../ui/Icon";
import { ORG } from "../../lib/data";

export const StatusBar: React.FC = () => {
  return (
    <div
      style={{
        height: 32,
        flexShrink: 0,
        background: COLORS.sidebar,
        borderTop: `1px solid #1a2d45`,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 20px",
        fontFamily: FONT_SANS,
        fontSize: 10.5,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: COLORS.sage[400],
              boxShadow: `0 0 6px ${COLORS.sage[400]}`,
            }}
          />
          <span style={{ color: COLORS.sage[400] }}>Online</span>
        </span>
        <span style={{ width: 1, height: 12, background: alpha(COLORS.white, 0.1) }} />
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Icon name="shield" size={12} color={COLORS.blue400} />
          <span style={{ color: alpha(COLORS.white, 0.55) }}>Piano {ORG.plan}</span>
        </span>
      </div>

      <div style={{ color: alpha(COLORS.white, 0.2) }}>{ORG.name}</div>

      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <span style={{ color: COLORS.sage[400] }}>Sync: OK</span>
        <span style={{ color: alpha(COLORS.white, 0.35) }}>
          P.IVA:{" "}
          <span style={{ fontFamily: FONT_MONO, color: COLORS.blue200 }}>
            {ORG.piva}
          </span>
        </span>
        <span style={{ fontFamily: FONT_MONO, color: alpha(COLORS.white, 0.4) }}>
          v2.4.10
        </span>
      </div>
    </div>
  );
};
