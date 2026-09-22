import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { interpolate } from "../lib/anim";
import { FONT_SANS } from "../lib/fonts";

import { TransportForm } from "../screens/desktop/TransportForm";
import { TrackingMap } from "../screens/desktop/TrackingMap";
import { TransportDetail } from "../screens/desktop/TransportDetail";
import { VfuTimeline } from "../screens/desktop/VfuTimeline";
import { RentriMovimenti } from "../screens/desktop/RentriMovimenti";
import { VfuCertificate } from "../screens/desktop/VfuCertificate";
import { VfuWizardCerca } from "../screens/desktop/VfuWizardCerca";
import { InvoiceScreen } from "../screens/desktop/InvoiceScreen";
import { ClienteForm } from "../screens/desktop/ClienteForm";
import { RicambiScreen } from "../screens/desktop/RicambiScreen";
import { ContabilitaMovimento } from "../screens/desktop/ContabilitaMovimento";
import { SOCCORSO, VFU, CLIENTE } from "../lib/data";
import { MobileHome } from "../screens/mobile/MobileHome";
import { MobileFirma } from "../screens/mobile/MobileFirma";
import { PushBanner } from "../screens/mobile/PushBanner";
import { PHONE_W } from "../components/mobile/PhoneFrame";

// helper: frazione della durata della scena
const useDur = () => useVideoConfig().durationInFrames;

export const FormAnimated: React.FC = () => {
  const f = useCurrentFrame();
  const d = useDur();
  const completion = interpolate(f, [0, d * 0.75], [63, 100], { extrapolateRight: "clamp" });
  return <TransportForm completion={completion} assigned={f > d * 0.18} />;
};

export const TrackingAnimated: React.FC = () => {
  const f = useCurrentFrame();
  const d = useDur();
  const progress = interpolate(f, [0, d], [0.12, 0.92], { extrapolateRight: "clamp" });
  const pulse = Math.abs(Math.sin(f / 12));
  return <TrackingMap progress={progress} pulse={pulse} />;
};

export const DetailInvoiceAnimated: React.FC = () => {
  const f = useCurrentFrame();
  const d = useDur();
  return <TransportDetail status="done" invoiced={f > d * 0.55} toast={f > d * 0.5 ? "Bozza fattura creata da TR0042" : undefined} />;
};

export const WizardAnimated: React.FC = () => {
  const f = useCurrentFrame();
  const d = useDur();
  return <VfuWizardCerca found={f > d * 0.34} />;
};

export const TimelineAnimated: React.FC = () => {
  const f = useCurrentFrame();
  const d = useDur();
  const checked = Math.round(interpolate(f, [d * 0.12, d * 0.82], [3, 6], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  const progress = interpolate(f, [d * 0.12, d * 0.82], [40, 52], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return <VfuTimeline activeIndex={2} checked={checked} progress={progress} />;
};

export const RentriAnimated: React.FC = () => {
  const f = useCurrentFrame();
  const d = useDur();
  const transmitted = f > d * 0.5;
  return <RentriMovimenti transmitted={transmitted} toast={f > d * 0.56 ? "Movimento trasmesso a RENTRI ✓" : undefined} />;
};

export const CertificateAnimated: React.FC = () => {
  const f = useCurrentFrame();
  const d = useDur();
  return <VfuCertificate generated={f > d * 0.32} toast={f > d * 0.44 ? "Certificato di Rottamazione generato" : undefined} />;
};

export const FirmaAnimated: React.FC = () => {
  const f = useCurrentFrame();
  const d = useDur();
  const signProgress = interpolate(f, [d * 0.12, d * 0.72], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return <MobileFirma signProgress={signProgress} done={f > d * 0.82} />;
};

export const InvoiceSoccorsoAnimated: React.FC = () => {
  const f = useCurrentFrame();
  const d = useDur();
  return (
    <InvoiceScreen
      number="128/2026"
      clienteNome={SOCCORSO.client}
      clienteTipo="Privato"
      clienteMeta="CF CNTGLI90A41A271K · Via Marconi 8 — Ancona (AN)"
      righe={[
        { desc: `Trasporto ${SOCCORSO.number} — A14 Ancona Nord → Ancona · Diritto fisso di intervento`, qty: 1, price: 50, vat: 22 },
        { desc: `Trasporto ${SOCCORSO.number} — Traino ${SOCCORSO.km} km`, qty: 1, price: 98, vat: 22 },
      ]}
      causale={`Soccorso stradale ${SOCCORSO.number} — conv. ${SOCCORSO.convenzione} ${SOCCORSO.pratica}`}
      sent={f > d * 0.5}
    />
  );
};

export const InvoiceDemoAnimated: React.FC = () => {
  const f = useCurrentFrame();
  const d = useDur();
  const veh = `${VFU.marca} targa ${VFU.targa}`;
  return (
    <InvoiceScreen
      number="129/2026"
      clienteNome={VFU.intestatario}
      clienteTipo="Privato"
      clienteMeta="CF RSSMRA80A01H501U · Via Roma 14 — Ancona (AN)"
      righe={[
        { desc: `Servizio demolizione VFU — ${veh}`, qty: 1, price: 30, vat: 22 },
        { desc: `Pratica radiazione PRA — ${veh}`, qty: 1, price: 25, vat: 22 },
        { desc: `Ritiro veicolo a domicilio — ${veh}`, qty: 1, price: 50, vat: 22 },
        { desc: `Compilazione CdR Allegato IV — ${veh}`, qty: 1, price: 10, vat: 22 },
      ]}
      causale={`Servizio demolizione veicolo ${VFU.targa} ${VFU.marca} — D.Lgs 209/2003`}
      sent={f > d * 0.5}
    />
  );
};

// ---------- Gestione & amministrazione ----------

const focusOver = (f: number, d: number, n: number, end = 0.5) =>
  Math.min(n - 1, Math.max(0, Math.floor(interpolate(f, [0, d * end], [0, n], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }))));

export const ClienteAnimated: React.FC = () => {
  const f = useCurrentFrame();
  const d = useDur();
  return (
    <ClienteForm
      focus={f < d * 0.6 ? focusOver(f, d, 13, 0.52) : -1}
      saved={f > d * 0.62}
      toast={f > d * 0.66 ? "Cliente salvato in anagrafica" : undefined}
    />
  );
};

export const RicambiAnimated: React.FC = () => {
  const f = useCurrentFrame();
  const d = useDur();
  return (
    <RicambiScreen
      focus={f < d * 0.6 ? focusOver(f, d, 9, 0.5) : -1}
      added={f > d * 0.62}
      toast={f > d * 0.68 ? "Ricambio aggiunto a magazzino" : undefined}
    />
  );
};

export const MovimentoAnimated: React.FC = () => {
  const f = useCurrentFrame();
  const d = useDur();
  return (
    <ContabilitaMovimento
      focus={f < d * 0.6 ? focusOver(f, d, 7, 0.5) : -1}
      saved={f > d * 0.62}
      toast={f > d * 0.68 ? "Movimento registrato in prima nota" : undefined}
    />
  );
};

/** Fattura commerciale completa: le righe compaiono una a una, poi invio al SdI. */
export const InvoiceCompletaAnimated: React.FC = () => {
  const f = useCurrentFrame();
  const d = useDur();
  const righe = [
    { desc: "Soccorso stradale TR0039 — traino 22 km (A14)", qty: 1, price: 132, vat: 22 },
    { desc: "Custodia veicolo in deposito — 3 giorni", qty: 3, price: 12, vat: 22 },
    { desc: "Diritto fisso di intervento", qty: 1, price: 50, vat: 22 },
    { desc: "Disco freno anteriore ventilato Ø312 (ricambio)", qty: 2, price: 58, vat: 22 },
  ];
  const n = Math.max(1, Math.round(interpolate(f, [d * 0.08, d * 0.5], [1, righe.length], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })));
  return (
    <InvoiceScreen
      number="130/2026"
      clienteNome={CLIENTE.ragioneSociale}
      clienteTipo="Azienda"
      clienteMeta={`P.IVA ${CLIENTE.piva} · ${CLIENTE.indirizzo} — ${CLIENTE.citta}`}
      codDest={CLIENTE.sdi}
      righe={righe.slice(0, n)}
      causale={`Convenzione officina — riepilogo servizi agosto 2026`}
      sent={f > d * 0.72}
      toast={f > d * 0.78 ? "Fattura trasmessa al SdI ✓" : undefined}
    />
  );
};

/** Home con banner notifica push che scende dall'alto e poi risale (timing relativo). */
export const NotifHome: React.FC = () => <MobileHome />;

export const NotifOverlay: React.FC = () => {
  const f = useCurrentFrame();
  const d = useDur();
  const inEnd = d * 0.2;
  const outStart = d * 0.66;
  const outEnd = d * 0.82;
  const yIn = interpolate(f, [d * 0.05, inEnd], [-160, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const yOut = interpolate(f, [outStart, outEnd], [0, -180], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const y = f < outStart ? yIn : yOut;
  const opacity = interpolate(f, [d * 0.05, inEnd, outStart, outEnd], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", top: 62, left: (PHONE_W - 356) / 2, transform: `translateY(${y}px)`, opacity, fontFamily: FONT_SANS, zIndex: 40 }}>
      <PushBanner />
    </div>
  );
};
