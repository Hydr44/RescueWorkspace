import React from "react";
import { MOBILE } from "../../lib/theme";
import { FONT_SANS } from "../../lib/fonts";
import { Icon } from "../../components/ui/Icon";

const PHOTO_GRADS = [
  "linear-gradient(135deg, #2a3342, #141b26)",
  "linear-gradient(135deg, #33404f, #1a2230)",
  "linear-gradient(135deg, #2d3a44, #171f28)",
  "linear-gradient(135deg, #38424e, #1c2530)",
];

export const MobilePhotos: React.FC<{ count?: number }> = ({ count = 3 }) => (
  <div style={{ flex: 1, display: "flex", flexDirection: "column", fontFamily: FONT_SANS }}>
    {/* header */}
    <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "6px 18px 12px" }}>
      <Icon name="arrowLeft" size={22} color={MOBILE.textPrimary} />
      <span style={{ fontSize: 18, fontWeight: 600, color: MOBILE.textPrimary, flex: 1 }}>Foto veicolo</span>
      <span style={{ fontSize: 13, color: MOBILE.textMuted }}>{count} foto</span>
    </div>

    <div style={{ flex: 1, padding: "0 18px", display: "flex", flexDirection: "column" }}>
      <div style={{ fontSize: 13, color: MOBILE.textMuted, lineHeight: 1.45, marginBottom: 16 }}>
        Documenta lo stato del veicolo al ritiro: scatta le foto dei danni preesistenti.
      </div>

      {/* note */}
      <div style={{ fontSize: 12, fontWeight: 500, color: MOBILE.textSecondary, marginBottom: 7 }}>
        Note sullo stato del veicolo
      </div>
      <div style={{ minHeight: 58, background: MOBILE.card, border: `0.5px solid ${MOBILE.border}`, padding: 12, fontSize: 13, color: MOBILE.textPrimary, marginBottom: 16, lineHeight: 1.4 }}>
        Graffio su paraurti anteriore dx, specchietto sinistro danneggiato.
      </div>

      {/* buttons */}
      <div style={{ display: "flex", gap: 10, marginBottom: 18 }}>
        {[
          { l: "Scatta foto", i: "camera" },
          { l: "Dalla galleria", i: "image" },
        ].map((b) => (
          <div key={b.l} style={{ flex: 1, height: 46, border: `0.5px solid ${MOBILE.border}`, background: MOBILE.card, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 13.5, color: MOBILE.textSecondary }}>
            <Icon name={b.i} size={17} color={MOBILE.textSecondary} /> {b.l}
          </div>
        ))}
      </div>

      {/* grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
        {[0, 1, 2, 3, 4, 5].map((i) => {
          const filled = i < count;
          return (
            <div key={i} style={{ position: "relative", aspectRatio: "1", background: filled ? PHOTO_GRADS[i % PHOTO_GRADS.length] : MOBILE.elevated, border: filled ? "none" : `1px dashed ${MOBILE.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {filled ? (
                <>
                  <Icon name="car" size={34} color="rgba(255,255,255,0.28)" />
                  <div style={{ position: "absolute", top: 6, right: 6, width: 20, height: 20, borderRadius: "50%", background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon name="x" size={12} color={MOBILE.error} />
                  </div>
                </>
              ) : (
                <Icon name="plus" size={20} color={MOBILE.textMuted} />
              )}
            </div>
          );
        })}
      </div>
    </div>

    {/* save */}
    <div style={{ padding: "14px 18px 22px" }}>
      <div style={{ height: 52, background: MOBILE.brand, display: "flex", alignItems: "center", justifyContent: "center", gap: 9, color: "#fff", fontSize: 15, fontWeight: 600 }}>
        <Icon name="check" size={18} color="#fff" /> Salva
      </div>
    </div>
  </div>
);
