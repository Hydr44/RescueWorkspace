import React from "react";
import { COLORS, alpha } from "../../lib/theme";
import { FONT_SANS } from "../../lib/fonts";
import { Icon } from "../ui/Icon";
import { Wordmark } from "../ui/Logo";
import { ORG } from "../../lib/data";

type Item = { label: string; icon: string; route: string; badge?: string };
type Section = { title: string; items: Item[] };

const MENU: Section[] = [
  {
    title: "Operativo",
    items: [
      { label: "Dashboard", icon: "home", route: "dashboard" },
      { label: "Soccorso & trasporti", icon: "truck", route: "trasporti", badge: "7" },
      { label: "Tracking GPS", icon: "navigation", route: "tracking" },
      { label: "Demolizioni RVFU", icon: "recycle", route: "demolizioni" },
      { label: "Rifiuti RENTRI", icon: "trash2", route: "rifiuti" },
      { label: "Calendario", icon: "calendar", route: "calendario" },
    ],
  },
  {
    title: "Anagrafiche",
    items: [
      { label: "Clienti", icon: "user", route: "clienti", badge: "218" },
      { label: "Mezzi", icon: "layers", route: "mezzi" },
      { label: "Custodia veicoli", icon: "mapPin", route: "piazzale" },
      { label: "Autisti", icon: "users", route: "autisti" },
      { label: "Ricambi", icon: "wrench", route: "ricambi" },
    ],
  },
  {
    title: "Vendite",
    items: [{ label: "Preventivi", icon: "fileText", route: "preventivi", badge: "3" }],
  },
  {
    title: "Analisi",
    items: [
      { label: "Report", icon: "barChart2", route: "report" },
      { label: "Contabilità", icon: "euro", route: "contabilita" },
      { label: "Fatture", icon: "fileText", route: "fatture" },
    ],
  },
  {
    title: "Sistema",
    items: [{ label: "Impostazioni", icon: "settings", route: "settings" }],
  },
];

export const Sidebar: React.FC<{ active: string }> = ({ active }) => {
  return (
    <div
      style={{
        width: 250,
        flexShrink: 0,
        height: "100%",
        background: COLORS.sidebar,
        borderRight: `1px solid ${alpha(COLORS.white, 0.05)}`,
        display: "flex",
        flexDirection: "column",
        fontFamily: FONT_SANS,
      }}
    >
      {/* Brand header */}
      <div
        style={{
          height: 80,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderBottom: `1px solid ${alpha(COLORS.white, 0.05)}`,
        }}
      >
        <Wordmark size={20} />
      </div>

      {/* Org switcher */}
      <div style={{ padding: "14px 14px 6px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: alpha(COLORS.white, 0.05),
            border: `1px solid ${alpha(COLORS.white, 0.05)}`,
            borderRadius: 0,
            padding: "9px 11px",
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 0,
              background: COLORS.brand,
              color: COLORS.white,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            {ORG.initials}
          </div>
          <div style={{ lineHeight: 1.2, overflow: "hidden" }}>
            <div
              style={{
                fontSize: 12.5,
                fontWeight: 600,
                color: alpha(COLORS.white, 0.85),
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                maxWidth: 150,
              }}
            >
              {ORG.name}
            </div>
            <div style={{ fontSize: 10, color: alpha(COLORS.white, 0.25) }}>
              Piano {ORG.plan}
            </div>
          </div>
          <Icon name="chevronDown" size={14} color={alpha(COLORS.white, 0.3)} />
        </div>
      </div>

      {/* Menu */}
      <div style={{ flex: 1, overflow: "hidden", padding: "6px 12px" }}>
        {MENU.map((section) => (
          <div key={section.title} style={{ marginBottom: 14 }}>
            <div
              style={{
                fontSize: 9,
                fontWeight: 600,
                letterSpacing: 2.2,
                textTransform: "uppercase",
                color: alpha(COLORS.blue300, 0.3),
                padding: "0 6px 7px",
              }}
            >
              {section.title}
            </div>
            {section.items.map((it) => {
              const on = it.route === active;
              return (
                <div
                  key={it.route}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "8px 12px",
                    borderRadius: 0,
                    marginBottom: 2,
                    fontSize: 12.5,
                    fontWeight: 500,
                    color: on ? COLORS.white : alpha(COLORS.white, 0.38),
                    background: on ? alpha(COLORS.brand, 0.2) : "transparent",
                    border: `1px solid ${on ? alpha(COLORS.brand, 0.25) : "transparent"}`,
                  }}
                >
                  <Icon
                    name={it.icon}
                    size={16}
                    color={on ? COLORS.blue400 : alpha(COLORS.white, 0.38)}
                  />
                  <span style={{ flex: 1, whiteSpace: "nowrap" }}>{it.label}</span>
                  {it.badge && (
                    <span
                      style={{
                        fontSize: 9.5,
                        fontWeight: 600,
                        color: COLORS.sage[300],
                        background: alpha(COLORS.sage[500], 0.2),
                        borderRadius: 0,
                        padding: "2px 6px",
                      }}
                    >
                      {it.badge}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* User card */}
      <div
        style={{
          padding: "12px 16px",
          borderTop: `1px solid ${alpha(COLORS.white, 0.05)}`,
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 0,
            background: COLORS.brand,
            color: COLORS.white,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          {ORG.operatorInitials}
        </div>
        <div style={{ flex: 1, lineHeight: 1.25 }}>
          <div style={{ fontSize: 12, color: alpha(COLORS.white, 0.7) }}>
            {ORG.operator}
          </div>
          <div style={{ fontSize: 10, color: alpha(COLORS.white, 0.25) }}>
            Operatore
          </div>
        </div>
        <Icon name="logOut" size={15} color={alpha(COLORS.white, 0.3)} />
      </div>
    </div>
  );
};
