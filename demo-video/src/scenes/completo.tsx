import React from "react";
import { DesktopScene } from "./DesktopScene";
import { PhoneScene } from "./PhoneScene";
import { Stage } from "../components/ui/Stage";
import { ChapterCard } from "../components/ui/Caption";
import { COLORS } from "../lib/theme";
import { VFU } from "../lib/data";

import { Dashboard } from "../screens/desktop/Dashboard";
import { TransportsList } from "../screens/desktop/TransportsList";
import { WizardStep } from "../screens/desktop/WizardStep";
import { MobileDetail } from "../screens/mobile/MobileDetail";
import { MobileNavigate } from "../screens/mobile/MobileNavigate";
import { MobilePhotos } from "../screens/mobile/MobilePhotos";
import { MobileHome } from "../screens/mobile/MobileHome";
import { MobileCondizioni } from "../screens/mobile/MobileCondizioni";
import {
  FormAnimated,
  TrackingAnimated,
  TimelineAnimated,
  RentriAnimated,
  CertificateAnimated,
  FirmaAnimated,
  WizardAnimated,
  InvoiceSoccorsoAnimated,
  InvoiceDemoAnimated,
  ClienteAnimated,
  RicambiAnimated,
  MovimentoAnimated,
  InvoiceCompletaAnimated,
  NotifHome,
  NotifOverlay,
} from "./animated";

/** Durate (frame @30fps) del video completo ~5 minuti. Pacing piu asciutto
 *  rispetto alla versione precedente (meno tempi morti) + nuovo capitolo
 *  "Gestione & amministrazione" con contenuti reali in piu. */
export const CDUR = {
  intro: 160,
  dashboard: 380,
  chapter: 96,
  list: 320,
  form: 520,
  tracking: 360,
  notif: 200,
  home: 240,
  detail: 340,
  navigate: 430,
  photos: 220,
  condizioni: 240,
  firma: 380,
  fatturaS: 460,
  wizard: 440,
  wizardDati: 280,
  wizardDocs: 280,
  wizardConf: 260,
  timeline: 520,
  rentri: 420,
  certificate: 460,
  fatturaD: 440,
  // --- Nuovo capitolo: Gestione & amministrazione ---
  chapterGest: 96,
  cliente: 430,
  ricambi: 470,
  movimento: 440,
  fatturaC: 500,
  recap: 380,
  outro: 180,
};

// ---------- Panoramica ----------
export const CBeatDashboard: React.FC = () => (
  <DesktopScene
    active="dashboard"
    crumbs={["Dashboard"]}
    captions={[
      { kicker: "Panoramica", text: "Tutta l'operatività in un colpo d'occhio." },
      { kicker: "Panoramica", text: "Interventi, flotta, fatturato e custodia, in tempo reale." },
    ]}
  >
    <Dashboard />
  </DesktopScene>
);

// ---------- Soccorso ----------
export const CBeatList: React.FC = () => (
  <DesktopScene
    active="trasporti"
    crumbs={["Dashboard", "Soccorso & trasporti"]}
    captions={[
      { kicker: "Centrale operativa", text: "Arriva una richiesta di soccorso." },
      { kicker: "Centrale operativa", text: "Tutti i trasporti, stato per stato." },
    ]}
    cursor={{ keys: [{ f: 0, x: 720, y: 640 }, { f: 70, x: 1435, y: 120 }], clicks: [78] }}
  >
    <TransportsList highlightNew />
  </DesktopScene>
);

export const CBeatForm: React.FC = () => (
  <DesktopScene
    active="trasporti"
    crumbs={["Dashboard", "Soccorso & trasporti", "Nuovo Trasporto"]}
    captions={[
      { kicker: "Nuovo intervento", text: "Registri l'intervento di soccorso." },
      { kicker: "Nuovo intervento", text: "Cliente, veicolo e percorso in pochi campi." },
      { kicker: "Nuovo intervento", text: "Assegni l'autista e il mezzo più vicini." },
    ]}
  >
    <FormAnimated />
  </DesktopScene>
);

export const CBeatTracking: React.FC = () => (
  <DesktopScene
    active="tracking"
    crumbs={["Dashboard", "Tracking Live"]}
    captions={[
      { kicker: "GPS in tempo reale", text: "Segui la flotta minuto per minuto." },
      { kicker: "GPS in tempo reale", text: "Sai sempre dov'è ogni mezzo." },
    ]}
  >
    <TrackingAnimated />
  </DesktopScene>
);

export const CBeatNotif: React.FC = () => (
  <PhoneScene
    side={{ kicker: "App autista", text: "L'autista riceve tutto sul telefono.", sub: "Notifica immediata con cliente, mezzo e destinazione." }}
    overlay={<NotifOverlay />}
    glow={{ x: 0.7, y: 0.4 }}
  >
    <NotifHome />
  </PhoneScene>
);

export const CBeatHome: React.FC = () => (
  <PhoneScene
    side={{ kicker: "App autista", text: "La giornata dell'autista, organizzata.", sub: "Il prossimo intervento e quelli a seguire, sempre a portata." }}
  >
    <MobileHome />
  </PhoneScene>
);

export const CBeatDetail: React.FC = () => (
  <PhoneScene side={{ kicker: "Intervento", text: "Il lavoro, in tasca.", sub: "Dettagli, stato e percorso sempre aggiornati." }}>
    <MobileDetail />
  </PhoneScene>
);

export const CBeatNavigate: React.FC = () => (
  <PhoneScene
    sides={[
      { kicker: "Navigazione", text: "Arriva prima sul posto.", sub: "Rotta reale, arrivo stimato e indicazioni vocali." },
      { kicker: "Navigazione", text: "Turn-by-turn, senza uscire dall'app." },
    ]}
  >
    <MobileNavigate />
  </PhoneScene>
);

export const CBeatPhotos: React.FC = () => (
  <PhoneScene side={{ kicker: "Prova fotografica", text: "Foto dei danni al ritiro.", sub: "Documentazione a norma, allegata al trasporto." }}>
    <MobilePhotos count={3} />
  </PhoneScene>
);

export const CBeatCondizioni: React.FC = () => (
  <PhoneScene side={{ kicker: "Condizioni", text: "Condizioni chiare, nella lingua del cliente.", sub: "Testo configurabile e multilingua." }}>
    <MobileCondizioni accepted />
  </PhoneScene>
);

export const CBeatFirma: React.FC = () => (
  <PhoneScene
    side={{ kicker: "Consenso digitale", text: "Firma del cliente, valida e tracciata.", sub: "Con snapshot legale di condizioni, lingua e orario." }}
  >
    <FirmaAnimated />
  </PhoneScene>
);

export const CBeatFatturaS: React.FC = () => (
  <DesktopScene
    active="fatture"
    crumbs={["Dashboard", "Fatture", "Nuova Fattura"]}
    captions={[
      { kicker: "Fatturazione", text: "Intervento chiuso: fattura elettronica pronta." },
      { kicker: "Fatturazione", text: "Righe dal trasporto e invio al SdI in un clic." },
    ]}
    cursor={{ keys: [{ f: 0, x: 760, y: 620 }, { f: 70, x: 1466, y: 118 }], clicks: [78] }}
  >
    <InvoiceSoccorsoAnimated />
  </DesktopScene>
);

// ---------- Demolizione ----------
export const CBeatWizard: React.FC = () => (
  <DesktopScene
    active="demolizioni"
    crumbs={["Dashboard", "Demolizioni RVFU", "Nuova pratica"]}
    captions={[
      { kicker: "Presa in carico", text: "Il veicolo entra in demolizione." },
      { kicker: "Presa in carico", text: "Il Registro ACI/MIT precompila i dati." },
    ]}
    cursor={{ keys: [{ f: 0, x: 700, y: 720 }, { f: 60, x: 470, y: 690 }], clicks: [66] }}
  >
    <WizardAnimated />
  </DesktopScene>
);

export const CBeatWizardDati: React.FC = () => (
  <DesktopScene
    active="demolizioni"
    crumbs={["Dashboard", "Demolizioni RVFU", "Dati pratica"]}
    captions={[{ kicker: "Anagrafica", text: "Intestatario e dati della pratica." }]}
  >
    <WizardStep
      step={1}
      primary="Continua"
      sections={[
        {
          head: "Intestatario",
          icon: "user",
          color: COLORS.brandHover,
          fields: [
            { label: "Tipo persona", value: "Persona fisica" },
            { label: "Codice fiscale", value: "RSSMRA80A01H501U", mono: true },
            { label: "Nome", value: "Mario" },
            { label: "Cognome", value: "Rossi" },
            { label: "Data di nascita", value: "01/01/1980" },
            { label: "Comune di nascita", value: "Roma (RM)" },
            { label: "Indirizzo di residenza", value: "Via Roma 14 — Ancona (AN) 60121", full: true },
          ],
        },
      ]}
    />
  </DesktopScene>
);

export const CBeatWizardDocs: React.FC = () => (
  <DesktopScene
    active="demolizioni"
    crumbs={["Dashboard", "Demolizioni RVFU", "Documenti"]}
    captions={[{ kicker: "Documenti", text: "Targhe e allegati, tutto in ordine." }]}
  >
    <WizardStep
      step={2}
      primary="Continua"
      sections={[
        {
          head: "Targhe",
          icon: "fileText",
          color: COLORS.sand[400],
          fields: [
            { label: "Modalità", value: "Targhe consegnate" },
            { label: "Targa anteriore", value: "Presente" },
            { label: "Targa posteriore", value: "Presente" },
            { label: "Stato", value: "Da distruggere (2)" },
          ],
        },
        {
          head: "Allegati",
          icon: "clipboard",
          color: COLORS.brandHover,
          fields: [
            { label: "Documento identità intestatario", value: "Caricato ✓" },
            { label: "Delega", value: "Non necessaria" },
          ],
        },
      ]}
    />
  </DesktopScene>
);

export const CBeatWizardConf: React.FC = () => (
  <DesktopScene
    active="demolizioni"
    crumbs={["Dashboard", "Demolizioni RVFU", "Conferma"]}
    captions={[{ kicker: "Registrazione", text: "Riepilogo e invio al Registro VFU." }]}
    cursor={{ keys: [{ f: 0, x: 800, y: 700 }, { f: 60, x: 1350, y: 820 }], clicks: [66] }}
  >
    <WizardStep
      step={3}
      primary="Registra pratica VFU"
      primaryIcon="check"
      sections={[
        {
          head: "Riepilogo pratica",
          icon: "checkCircle",
          color: COLORS.sage[400],
          fields: [
            { label: "Targa", value: VFU.targa, mono: true },
            { label: "Telaio", value: VFU.telaio, mono: true },
            { label: "Tipo", value: "A — Autoveicolo" },
            { label: "Marca / Modello", value: VFU.marca },
            { label: "Intestatario", value: VFU.intestatario },
            { label: "Causale", value: VFU.causale },
            { label: "PRA", value: "Sì (con obbligo)" },
            { label: "Data ritiro", value: "03/08/2026" },
          ],
        },
      ]}
    />
  </DesktopScene>
);

export const CBeatTimeline: React.FC = () => (
  <DesktopScene
    active="demolizioni"
    crumbs={["Dashboard", "Demolizioni RVFU", "Lavorazione"]}
    captions={[
      { kicker: "Lavorazione", text: "Ogni fase a norma di legge." },
      { kicker: "Lavorazione", text: "Accettazione, messa in sicurezza, bonifica." },
      { kicker: "Lavorazione", text: "Checklist e scadenze sempre sotto controllo." },
    ]}
  >
    <TimelineAnimated />
  </DesktopScene>
);

export const CBeatRentri: React.FC = () => (
  <DesktopScene
    active="rifiuti"
    crumbs={["Dashboard", "Rifiuti RENTRI", "Movimenti"]}
    captions={[
      { kicker: "Rifiuti", text: "Registro carico/scarico in digitale." },
      { kicker: "Rifiuti", text: "Trasmissione a RENTRI in un clic." },
    ]}
    cursor={{ keys: [{ f: 0, x: 800, y: 500 }, { f: 120, x: 1380, y: 852 }], clicks: [128] }}
  >
    <RentriAnimated />
  </DesktopScene>
);

export const CBeatCertificate: React.FC = () => (
  <DesktopScene
    active="demolizioni"
    crumbs={["Dashboard", "Demolizioni RVFU", "Chiusura pratica"]}
    captions={[
      { kicker: "Documento finale", text: "Certificato di rottamazione e radiazione PRA." },
      { kicker: "Documento finale", text: "Generato dal sistema, pronto da consegnare." },
    ]}
    cursor={{ keys: [{ f: 0, x: 700, y: 760 }, { f: 60, x: 470, y: 790 }], clicks: [66] }}
  >
    <CertificateAnimated />
  </DesktopScene>
);

export const CBeatFatturaD: React.FC = () => (
  <DesktopScene
    active="fatture"
    crumbs={["Dashboard", "Fatture", "Nuova Fattura"]}
    captions={[
      { kicker: "Fatturazione", text: "Dalla demolizione alla fattura, in un flusso." },
      { kicker: "Fatturazione", text: "Voci di servizio VFU e invio al SdI." },
    ]}
    cursor={{ keys: [{ f: 0, x: 760, y: 620 }, { f: 80, x: 1466, y: 118 }], clicks: [88] }}
  >
    <InvoiceDemoAnimated />
  </DesktopScene>
);

// ---------- Gestione & amministrazione ----------
export const CBeatChapterGestione: React.FC = () => (
  <Stage glowX={0.32} glowY={0.5} glowColor={COLORS.plum[600]}>
    <ChapterCard
      index=""
      title="Gestione & amministrazione"
      subtitle="Clienti, ricambi, contabilità e fatturazione — un unico gestionale."
      accent={COLORS.plum[400]}
    />
  </Stage>
);

export const CBeatCliente: React.FC = () => (
  <DesktopScene
    active="clienti"
    crumbs={["Dashboard", "Clienti", "Nuovo cliente"]}
    captions={[
      { kicker: "Anagrafiche", text: "Un nuovo cliente in pochi campi." },
      { kicker: "Anagrafiche", text: "P.IVA, PEC e codice SDI: pronto per fatturare." },
    ]}
    cursor={{ keys: [{ f: 0, x: 760, y: 600 }, { f: 236, x: 1470, y: 132 }], clicks: [246] }}
  >
    <ClienteAnimated />
  </DesktopScene>
);

export const CBeatRicambi: React.FC = () => (
  <DesktopScene
    active="ricambi"
    crumbs={["Dashboard", "Ricambi", "Nuovo ricambio"]}
    captions={[
      { kicker: "Magazzino", text: "Carichi un ricambio a magazzino." },
      { kicker: "Magazzino", text: "Codice OE, ubicazione e giacenza sotto controllo." },
    ]}
    cursor={{ keys: [{ f: 0, x: 600, y: 700 }, { f: 270, x: 840, y: 852 }], clicks: [280] }}
  >
    <RicambiAnimated />
  </DesktopScene>
);

export const CBeatMovimento: React.FC = () => (
  <DesktopScene
    active="contabilita"
    crumbs={["Dashboard", "Contabilità", "Prima nota"]}
    captions={[
      { kicker: "Contabilità", text: "Registri un incasso in prima nota." },
      { kicker: "Contabilità", text: "Partita doppia guidata: Dare / Avere." },
    ]}
    cursor={{ keys: [{ f: 0, x: 700, y: 620 }, { f: 250, x: 1230, y: 132 }], clicks: [260] }}
  >
    <MovimentoAnimated />
  </DesktopScene>
);

export const CBeatFatturaCompleta: React.FC = () => (
  <DesktopScene
    active="fatture"
    crumbs={["Dashboard", "Fatture", "Nuova Fattura"]}
    captions={[
      { kicker: "Fatturazione", text: "Componi una fattura completa, riga per riga." },
      { kicker: "Fatturazione", text: "Calcolo IVA e totali automatici." },
      { kicker: "Fatturazione", text: "Firma e invio al SdI in un clic." },
    ]}
    cursor={{ keys: [{ f: 0, x: 760, y: 620 }, { f: 344, x: 1490, y: 118 }], clicks: [352] }}
  >
    <InvoiceCompletaAnimated />
  </DesktopScene>
);
