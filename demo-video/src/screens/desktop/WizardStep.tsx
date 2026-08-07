import React from "react";
import { COLORS } from "../../lib/theme";
import { Btn, Card, Field, SectionHead } from "../../components/desktop/kit";
import { Icon } from "../../components/ui/Icon";
import { CfStepper } from "./VfuWizardCerca";

type FieldDef = { label: string; value: string; mono?: boolean; full?: boolean };
type Section = { head?: string; icon?: string; color?: string; fields: FieldDef[] };

export const WizardStep: React.FC<{
  step: number; // indice attivo 0..3
  sections: Section[];
  primary: string;
  primaryIcon?: string;
}> = ({ step, sections, primary, primaryIcon = "arrowRight" }) => (
  <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
    {/* topbar (fedele a WizardShell) */}
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
      <div style={{ width: 32, height: 32, background: COLORS.bg, border: `1px solid ${COLORS.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon name="arrowLeft" size={16} color={COLORS.body} />
      </div>
      <div>
        <div style={{ fontSize: 16, fontWeight: 600, color: COLORS.ink }}>Nuova pratica VFU</div>
        <div style={{ fontSize: 11, color: COLORS.muted, marginTop: 2 }}>Registro Veicoli Fuori Uso — ACI/MIT · Passo {step + 1}/4</div>
      </div>
    </div>

    <CfStepper current={step} />

    {/* body */}
    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12, minHeight: 0 }}>
      {sections.map((sec, si) => (
        <Card key={si} pad={18}>
          {sec.head && <SectionHead icon={sec.icon ?? "fileText"} title={sec.head} color={sec.color ?? COLORS.brandHover} />}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {sec.fields.map((fld, fi) => (
              <div key={fi} style={{ gridColumn: fld.full ? "1 / -1" : undefined }}>
                <Field label={fld.label} value={fld.value} mono={fld.mono} />
              </div>
            ))}
          </div>
        </Card>
      ))}
      <div style={{ marginTop: "auto", display: "flex", justifyContent: "flex-end", gap: 10, paddingTop: 6 }}>
        <Btn label="Indietro" />
        <Btn label={primary} icon={primaryIcon} variant="primary" glow />
      </div>
    </div>
  </div>
);
