import React from "react";
import { MOBILE } from "../../lib/theme";
import { FONT_SANS } from "../../lib/fonts";
import { Icon } from "../ui/Icon";

const TABS = [
  { label: "Home", icon: "home", key: "home" },
  { label: "Trasporti", icon: "truck", key: "trasporti" },
  { label: "Demolizioni", icon: "car", key: "demolizioni" },
  { label: "Ricambi", icon: "wrench", key: "ricambi" },
  { label: "Profilo", icon: "user", key: "profilo" },
];

export const TabBar: React.FC<{ active: string }> = ({ active }) => (
  <div
    style={{
      flexShrink: 0,
      height: 84,
      background: "#0B1220",
      borderTop: `0.5px solid ${MOBILE.border}`,
      display: "flex",
      alignItems: "flex-start",
      paddingTop: 12,
      fontFamily: FONT_SANS,
    }}
  >
    {TABS.map((t) => {
      const on = t.key === active;
      const col = on ? MOBILE.brand : MOBILE.textMuted;
      return (
        <div
          key={t.key}
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 5,
          }}
        >
          <Icon name={t.icon} size={22} color={col} strokeWidth={on ? 2.2 : 1.8} />
          <span style={{ fontSize: 10.5, fontWeight: on ? 600 : 400, color: col }}>
            {t.label}
          </span>
        </div>
      );
    })}
  </div>
);
