import React from "react";
import { MOBILE } from "../../lib/theme";
import { FONT_SANS } from "../../lib/fonts";
import { Icon } from "../../components/ui/Icon";

export const MobileCondizioni: React.FC<{ accepted?: boolean }> = ({ accepted = true }) => (
  <div style={{ flex: 1, display: "flex", flexDirection: "column", fontFamily: FONT_SANS }}>
    {/* header */}
    <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "6px 18px 12px" }}>
      <Icon name="x" size={22} color={MOBILE.textPrimary} />
      <span style={{ fontSize: 18, fontWeight: 600, color: MOBILE.textPrimary }}>Condizioni del servizio</span>
    </div>

    <div style={{ flex: 1, padding: "0 18px", display: "flex", flexDirection: "column" }}>
      {/* language */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 14px", background: MOBILE.card, border: `0.5px solid ${MOBILE.border}`, marginBottom: 16 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 13.5, color: MOBILE.textPrimary }}>
          <Icon name="messageCircle" size={16} color={MOBILE.textSecondary} /> Lingua: Italiano
        </span>
        <Icon name="chevronDown" size={16} color={MOBILE.textMuted} />
      </div>

      {/* terms */}
      <div style={{ flex: 1, background: MOBILE.card, border: `0.5px solid ${MOBILE.border}`, padding: 16, overflow: "hidden" }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: MOBILE.textPrimary, marginBottom: 12 }}>Condizioni di trasporto e custodia</div>
        {[
          "Il cliente autorizza il trasporto del veicolo indicato e dichiara che i dati forniti sono corretti.",
          "Eventuali danni preesistenti sono documentati dalle foto allegate all'intervento al momento del ritiro.",
          "La responsabilità del vettore è limitata ai casi previsti dalle vigenti normative sul trasporto.",
          "Il trattamento dei dati personali avviene ai sensi del Reg. UE 2016/679 (GDPR).",
        ].map((p, i) => (
          <div key={i} style={{ fontSize: 12.5, lineHeight: 1.55, color: MOBILE.textSecondary, marginBottom: 10 }}>
            {p}
          </div>
        ))}
      </div>

      {/* checkbox */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 2px 16px" }}>
        <div style={{ width: 24, height: 24, background: accepted ? MOBILE.success : "transparent", border: `1.5px solid ${accepted ? MOBILE.success : MOBILE.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          {accepted && <Icon name="check" size={15} color="#0A0F1A" />}
        </div>
        <span style={{ fontSize: 13, color: MOBILE.textPrimary, lineHeight: 1.4 }}>
          Il cliente ha letto e accetta le condizioni del servizio
        </span>
      </div>
    </div>

    {/* CTA */}
    <div style={{ padding: "0 18px 22px" }}>
      <div style={{ height: 52, background: accepted ? MOBILE.brand : MOBILE.border, display: "flex", alignItems: "center", justifyContent: "center", gap: 9, color: "#fff", fontSize: 15, fontWeight: 600 }}>
        Prosegui alla firma
        <Icon name="arrowRight" size={18} color="#fff" />
      </div>
    </div>
  </div>
);
