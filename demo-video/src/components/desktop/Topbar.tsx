import React from "react";
import { COLORS, alpha } from "../../lib/theme";
import { FONT_SANS } from "../../lib/fonts";
import { Icon } from "../ui/Icon";

export const Topbar: React.FC<{ crumbs: string[] }> = ({ crumbs }) => {
  return (
    <div
      style={{
        height: 48,
        flexShrink: 0,
        background: COLORS.card,
        borderBottom: `1px solid ${COLORS.border}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px",
        fontFamily: FONT_SANS,
      }}
    >
      {/* breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {crumbs.map((c, i) => {
          const last = i === crumbs.length - 1;
          return (
            <React.Fragment key={c}>
              {i > 0 && (
                <Icon name="chevronRight" size={13} color={COLORS.slate600} />
              )}
              <span
                style={{
                  fontSize: 14,
                  fontWeight: last ? 500 : 400,
                  color: last ? COLORS.body : COLORS.muted,
                }}
              >
                {c}
              </span>
            </React.Fragment>
          );
        })}
      </div>

      {/* right */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            height: 32,
            padding: "0 12px",
            fontSize: 12,
            color: COLORS.muted,
            background: COLORS.bg,
            border: `1px solid ${COLORS.border}`,
            borderRadius: 0,
          }}
        >
          <Icon name="search" size={14} color={COLORS.muted} />
          <span>Cerca…</span>
          <span
            style={{
              marginLeft: 22,
              fontSize: 11,
              color: COLORS.faint,
              border: `1px solid ${COLORS.border}`,
              borderRadius: 0,
              padding: "1px 6px",
            }}
          >
            ⌘K
          </span>
        </div>
        <div
          style={{
            position: "relative",
            width: 32,
            height: 32,
            borderRadius: 0,
            border: `1px solid ${COLORS.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon name="bell" size={16} color={COLORS.body} />
          <span
            style={{
              position: "absolute",
              top: 6,
              right: 7,
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: COLORS.danger,
            }}
          />
        </div>
      </div>
    </div>
  );
};
