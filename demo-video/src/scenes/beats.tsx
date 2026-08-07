import React from "react";
import { DesktopScene } from "./DesktopScene";
import { PhoneScene } from "./PhoneScene";
import { ChapterCard } from "../components/ui/Caption";
import { Stage } from "../components/ui/Stage";
import { COLORS } from "../lib/theme";

import { TransportsList } from "../screens/desktop/TransportsList";
import { MobileDetail } from "../screens/mobile/MobileDetail";
import { MobileNavigate } from "../screens/mobile/MobileNavigate";
import { MobilePhotos } from "../screens/mobile/MobilePhotos";
import {
  FormAnimated,
  TrackingAnimated,
  DetailInvoiceAnimated,
  WizardAnimated,
  TimelineAnimated,
  RentriAnimated,
  CertificateAnimated,
  FirmaAnimated,
  NotifHome,
  NotifOverlay,
  InvoiceSoccorsoAnimated,
  InvoiceDemoAnimated,
} from "./animated";

/** Durate (in frame @30fps) — centralizzate per calcolare la lunghezza totale. */
export const DUR = {
  intro: 100,
  chapter: 78,
  list: 118,
  form: 165,
  tracking: 120,
  notif: 122,
  detail: 96,
  navigate: 140,
  photos: 96,
  firma: 132,
  invoice: 120,
  wizard: 146,
  timeline: 150,
  rentri: 90,
  certificate: 152,
  fattura: 134,
  outro: 128,
};

// ---------- CAPITOLO 1 — SOCCORSO ----------

export const BeatChapter1: React.FC = () => (
  <Stage glowX={0.32} glowY={0.5}>
    <ChapterCard index="" title="Soccorso stradale" subtitle="Dalla chiamata alla fattura, senza carta." accent={COLORS.brandHover} />
  </Stage>
);

export const BeatList: React.FC = () => (
  <DesktopScene
    active="trasporti"
    crumbs={["Dashboard", "Soccorso & trasporti"]}
    caption={{ kicker: "Centrale operativa", text: "Arriva una richiesta di soccorso." }}
    cursor={{ keys: [{ f: 0, x: 720, y: 640 }, { f: 46, x: 1435, y: 120 }], clicks: [52] }}
    camera={[{ f: 0, scale: 1.0, fx: 0.5, fy: 0.5 }, { f: 118, scale: 1.07, fx: 0.5, fy: 0.44 }]}
  >
    <TransportsList highlightNew />
  </DesktopScene>
);

export const BeatForm: React.FC = () => (
  <DesktopScene
    active="trasporti"
    crumbs={["Dashboard", "Soccorso & trasporti", "Nuovo Trasporto"]}
    caption={{ kicker: "Nuovo intervento", text: "Registri l'intervento e assegni l'autista più vicino." }}
    cursor={{ keys: [{ f: 0, x: 640, y: 760 }, { f: 128, x: 1300, y: 620 }, { f: 150, x: 1440, y: 120 }], clicks: [156] }}
    camera={[
      { f: 0, scale: 1.0, fx: 0.5, fy: 0.5 },
      { f: 60, scale: 1.13, fx: 0.5, fy: 0.64 },
      { f: 120, scale: 1.13, fx: 0.5, fy: 0.64 },
      { f: 150, scale: 1.02, fx: 0.5, fy: 0.5 },
    ]}
  >
    <FormAnimated />
  </DesktopScene>
);

export const BeatTracking: React.FC = () => (
  <DesktopScene
    active="tracking"
    crumbs={["Dashboard", "Tracking Live"]}
    caption={{ kicker: "GPS in tempo reale", text: "Segui la flotta e l'intervento minuto per minuto." }}
    camera={[{ f: 0, scale: 1.0, fx: 0.5, fy: 0.5 }, { f: 120, scale: 1.08, fx: 0.5, fy: 0.5 }]}
  >
    <TrackingAnimated />
  </DesktopScene>
);

export const BeatNotif: React.FC = () => (
  <PhoneScene
    side={{ kicker: "App autista", text: "L'autista riceve tutto sul telefono.", sub: "Notifica immediata, con cliente, mezzo e destinazione." }}
    overlay={<NotifOverlay />}
    glow={{ x: 0.7, y: 0.4 }}
  >
    <NotifHome />
  </PhoneScene>
);

export const BeatDetail: React.FC = () => (
  <PhoneScene side={{ kicker: "Intervento", text: "Il lavoro, in tasca.", sub: "Dettagli, stato e percorso sempre aggiornati." }}>
    <MobileDetail />
  </PhoneScene>
);

export const BeatNavigate: React.FC = () => (
  <PhoneScene
    side={{ kicker: "Navigazione", text: "Arriva prima sul posto.", sub: "Rotta reale, arrivo stimato e indicazioni vocali, senza uscire dall'app." }}
    camera={[{ f: 0, scale: 1, fy: 0.52 }, { f: 140, scale: 1.05, fy: 0.46 }]}
  >
    <MobileNavigate />
  </PhoneScene>
);

export const BeatPhotos: React.FC = () => (
  <PhoneScene side={{ kicker: "Prova fotografica", text: "Foto dei danni al ritiro.", sub: "Documentazione a norma, allegata al trasporto." }}>
    <MobilePhotos count={3} />
  </PhoneScene>
);

export const BeatFirma: React.FC = () => (
  <PhoneScene
    side={{ kicker: "Consenso digitale", text: "Firma del cliente, valida e tracciata.", sub: "Registra condizioni accettate, lingua e orario." }}
    camera={[{ f: 0, scale: 1, fy: 0.5 }, { f: 22, scale: 1.06, fy: 0.5 }, { f: 132, scale: 1.06, fy: 0.5 }]}
  >
    <FirmaAnimated />
  </PhoneScene>
);

export const BeatInvoice: React.FC = () => (
  <DesktopScene
    active="trasporti"
    crumbs={["Dashboard", "Soccorso & trasporti", "TR0042"]}
    caption={{ kicker: "Chiusura", text: "Trasporto completato: fattura in un clic." }}
    cursor={{ keys: [{ f: 0, x: 700, y: 640 }, { f: 46, x: 1445, y: 120 }], clicks: [52] }}
    camera={[{ f: 0, scale: 1.0, fx: 0.5, fy: 0.5 }, { f: 120, scale: 1.09, fx: 0.5, fy: 0.6 }]}
  >
    <DetailInvoiceAnimated />
  </DesktopScene>
);

export const BeatFatturaSoccorso: React.FC = () => (
  <DesktopScene
    active="fatture"
    crumbs={["Dashboard", "Fatture", "Nuova Fattura"]}
    caption={{ kicker: "Fatturazione", text: "Intervento chiuso: fattura elettronica pronta." }}
    cursor={{ keys: [{ f: 0, x: 760, y: 620 }, { f: 42, x: 1466, y: 118 }], clicks: [48] }}
    camera={[{ f: 0, scale: 1.0, fx: 0.5, fy: 0.5 }, { f: 134, scale: 1.07, fx: 0.5, fy: 0.5 }]}
  >
    <InvoiceSoccorsoAnimated />
  </DesktopScene>
);

// ---------- CAPITOLO 2 — DEMOLIZIONE ----------

export const BeatChapter2: React.FC = () => (
  <Stage glowX={0.32} glowY={0.5} glowColor={COLORS.sage[600]}>
    <ChapterCard index="" title="Demolizione veicoli" subtitle="Dall'accettazione alla fattura, tutto conforme." accent={COLORS.sage[400]} />
  </Stage>
);

export const BeatWizard: React.FC = () => (
  <DesktopScene
    active="demolizioni"
    crumbs={["Dashboard", "Demolizioni RVFU", "Nuova pratica"]}
    caption={{ kicker: "Presa in carico", text: "Registri il veicolo: ACI/MIT precompila i dati." }}
    cursor={{ keys: [{ f: 0, x: 700, y: 720 }, { f: 40, x: 470, y: 690 }], clicks: [44] }}
    camera={[
      { f: 0, scale: 1.0, fx: 0.5, fy: 0.5 },
      { f: 60, scale: 1.08, fx: 0.5, fy: 0.5 },
      { f: 146, scale: 1.09, fx: 0.5, fy: 0.5 },
    ]}
  >
    <WizardAnimated />
  </DesktopScene>
);

export const BeatTimeline: React.FC = () => (
  <DesktopScene
    active="demolizioni"
    crumbs={["Dashboard", "Demolizioni RVFU", "Lavorazione"]}
    caption={{ kicker: "Lavorazione", text: "Ogni fase a norma: sicurezza, bonifica, radiazione." }}
    cursor={{ keys: [{ f: 0, x: 900, y: 700 }, { f: 110, x: 640, y: 828 }], clicks: [116] }}
    camera={[{ f: 0, scale: 1.0, fx: 0.5, fy: 0.5 }, { f: 70, scale: 1.1, fx: 0.5, fy: 0.56 }, { f: 150, scale: 1.11, fx: 0.5, fy: 0.56 }]}
  >
    <TimelineAnimated />
  </DesktopScene>
);

export const BeatRentri: React.FC = () => (
  <DesktopScene
    active="rifiuti"
    crumbs={["Dashboard", "Rifiuti RENTRI", "Movimenti"]}
    caption={{ kicker: "Rifiuti", text: "Registro carico/scarico e RENTRI, in digitale." }}
    cursor={{ keys: [{ f: 0, x: 800, y: 500 }, { f: 62, x: 1380, y: 852 }], clicks: [68] }}
    camera={[{ f: 0, scale: 1.0, fx: 0.5, fy: 0.46 }, { f: 60, scale: 1.06, fx: 0.5, fy: 0.62 }, { f: 140, scale: 1.07, fx: 0.5, fy: 0.64 }]}
  >
    <RentriAnimated />
  </DesktopScene>
);

export const BeatCertificate: React.FC = () => (
  <DesktopScene
    active="demolizioni"
    crumbs={["Dashboard", "Demolizioni RVFU", "Chiusura pratica"]}
    caption={{ kicker: "Documento finale", text: "Certificato di rottamazione e radiazione PRA." }}
    cursor={{ keys: [{ f: 0, x: 700, y: 760 }, { f: 34, x: 470, y: 790 }], clicks: [38] }}
    camera={[
      { f: 0, scale: 1.0, fx: 0.5, fy: 0.5 },
      { f: 60, scale: 1.09, fx: 0.5, fy: 0.5 },
      { f: 152, scale: 1.1, fx: 0.5, fy: 0.5 },
    ]}
  >
    <CertificateAnimated />
  </DesktopScene>
);

export const BeatFatturaDemo: React.FC = () => (
  <DesktopScene
    active="fatture"
    crumbs={["Dashboard", "Fatture", "Nuova Fattura"]}
    caption={{ kicker: "Fatturazione", text: "Dalla demolizione alla fattura, in un unico flusso." }}
    cursor={{ keys: [{ f: 0, x: 760, y: 620 }, { f: 48, x: 1466, y: 118 }], clicks: [54] }}
    camera={[{ f: 0, scale: 1.0, fx: 0.5, fy: 0.5 }, { f: 134, scale: 1.07, fx: 0.5, fy: 0.5 }]}
  >
    <InvoiceDemoAnimated />
  </DesktopScene>
);
