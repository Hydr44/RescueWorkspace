import React, { useEffect, useState } from "react";
import { delayRender, continueRender } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { waitForFonts } from "./lib/fonts";
import { Intro } from "./scenes/Intro";
import { Outro } from "./scenes/Outro";
import { RecapModuli } from "./scenes/RecapModuli";
import {
  DUR,
  BeatChapter1,
  BeatList,
  BeatForm,
  BeatTracking,
  BeatNotif,
  BeatDetail,
  BeatNavigate,
  BeatPhotos,
  BeatFirma,
  BeatFatturaSoccorso,
  BeatChapter2,
  BeatWizard,
  BeatTimeline,
  BeatRentri,
  BeatFatturaDemo,
} from "./scenes/beats";
import {
  CDUR,
  CBeatDashboard,
  CBeatList,
  CBeatForm,
  CBeatTracking,
  CBeatNotif,
  CBeatHome,
  CBeatDetail,
  CBeatNavigate,
  CBeatPhotos,
  CBeatCondizioni,
  CBeatFirma,
  CBeatFatturaS,
  CBeatWizard,
  CBeatWizardDati,
  CBeatWizardDocs,
  CBeatWizardConf,
  CBeatTimeline,
  CBeatRentri,
  CBeatCertificate,
  CBeatFatturaD,
  CBeatChapterGestione,
  CBeatCliente,
  CBeatRicambi,
  CBeatMovimento,
  CBeatFatturaCompleta,
} from "./scenes/completo";

const FontGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [handle] = useState(() => delayRender("fonts"));
  useEffect(() => {
    waitForFonts().then(() => continueRender(handle));
  }, [handle]);
  return <>{children}</>;
};

type Trans = { presentation: any; timing: any; dur: number };
type Item = { node: React.ReactNode; dur: number; trans?: Trans };

const FADE: Trans = { presentation: fade(), timing: linearTiming({ durationInFrames: 16 }), dur: 16 };
const SLIDE_R: Trans = { presentation: slide({ direction: "from-right" }), timing: linearTiming({ durationInFrames: 20 }), dur: 20 };
const SLIDE_L: Trans = { presentation: slide({ direction: "from-left" }), timing: linearTiming({ durationInFrames: 20 }), dur: 20 };

export const seriesTotal = (items: Item[]) =>
  items.reduce((a, it) => a + it.dur, 0) -
  items.slice(0, -1).reduce((a, it) => a + (it.trans ? it.trans.dur : 0), 0);

const Series: React.FC<{ items: Item[] }> = ({ items }) => {
  const children: React.ReactNode[] = [];
  items.forEach((it, i) => {
    children.push(
      <TransitionSeries.Sequence key={`s${i}`} durationInFrames={it.dur}>
        {it.node}
      </TransitionSeries.Sequence>
    );
    if (it.trans && i < items.length - 1) {
      children.push(
        <TransitionSeries.Transition key={`t${i}`} timing={it.trans.timing} presentation={it.trans.presentation} />
      );
    }
  });
  return (
    <FontGate>
      <TransitionSeries>{children}</TransitionSeries>
    </FontGate>
  );
};

const introItem = (): Item => ({ node: <Intro />, dur: DUR.intro, trans: FADE });
const outroItem = (): Item => ({ node: <Outro />, dur: DUR.outro });

// VIDEO 1 — Soccorso stradale: dalla chiamata alla fattura
export const SOCCORSO_ITEMS = (): Item[] => [
  introItem(),
  { node: <BeatChapter1 />, dur: DUR.chapter, trans: FADE },
  { node: <BeatList />, dur: DUR.list, trans: FADE },
  { node: <BeatForm />, dur: DUR.form, trans: FADE },
  { node: <BeatTracking />, dur: DUR.tracking, trans: SLIDE_R },
  { node: <BeatNotif />, dur: DUR.notif, trans: FADE },
  { node: <BeatDetail />, dur: DUR.detail, trans: FADE },
  { node: <BeatNavigate />, dur: DUR.navigate, trans: FADE },
  { node: <BeatPhotos />, dur: DUR.photos, trans: FADE },
  { node: <BeatFirma />, dur: DUR.firma, trans: SLIDE_L },
  { node: <BeatFatturaSoccorso />, dur: DUR.fattura, trans: FADE },
  outroItem(),
];

// VIDEO 2 — Demolizione VFU: dall'accettazione alla fattura (RENTRI ridotto)
export const DEMO_ITEMS = (): Item[] => [
  introItem(),
  { node: <BeatChapter2 />, dur: DUR.chapter, trans: FADE },
  { node: <BeatWizard />, dur: DUR.wizard, trans: FADE },
  { node: <BeatTimeline />, dur: DUR.timeline, trans: FADE },
  { node: <BeatRentri />, dur: DUR.rentri, trans: FADE },
  { node: <BeatFatturaDemo />, dur: DUR.fattura, trans: FADE },
  outroItem(),
];

// VIDEO 3 — Completo (~5 min): panoramica + soccorso + demolizione + riepilogo
export const COMPLETO_ITEMS = (): Item[] => [
  { node: <Intro />, dur: CDUR.intro, trans: FADE },
  { node: <CBeatDashboard />, dur: CDUR.dashboard, trans: FADE },
  { node: <BeatChapter1 />, dur: CDUR.chapter, trans: FADE },
  { node: <CBeatList />, dur: CDUR.list, trans: FADE },
  { node: <CBeatForm />, dur: CDUR.form, trans: FADE },
  { node: <CBeatTracking />, dur: CDUR.tracking, trans: SLIDE_R },
  { node: <CBeatNotif />, dur: CDUR.notif, trans: FADE },
  { node: <CBeatHome />, dur: CDUR.home, trans: FADE },
  { node: <CBeatDetail />, dur: CDUR.detail, trans: FADE },
  { node: <CBeatNavigate />, dur: CDUR.navigate, trans: FADE },
  { node: <CBeatPhotos />, dur: CDUR.photos, trans: FADE },
  { node: <CBeatCondizioni />, dur: CDUR.condizioni, trans: FADE },
  { node: <CBeatFirma />, dur: CDUR.firma, trans: SLIDE_L },
  { node: <CBeatFatturaS />, dur: CDUR.fatturaS, trans: FADE },
  { node: <BeatChapter2 />, dur: CDUR.chapter, trans: FADE },
  { node: <CBeatWizard />, dur: CDUR.wizard, trans: FADE },
  { node: <CBeatWizardDati />, dur: CDUR.wizardDati, trans: FADE },
  { node: <CBeatWizardDocs />, dur: CDUR.wizardDocs, trans: FADE },
  { node: <CBeatWizardConf />, dur: CDUR.wizardConf, trans: FADE },
  { node: <CBeatTimeline />, dur: CDUR.timeline, trans: FADE },
  { node: <CBeatRentri />, dur: CDUR.rentri, trans: FADE },
  { node: <CBeatCertificate />, dur: CDUR.certificate, trans: FADE },
  { node: <CBeatFatturaD />, dur: CDUR.fatturaD, trans: FADE },
  // --- Capitolo 3: Gestione & amministrazione ---
  { node: <CBeatChapterGestione />, dur: CDUR.chapterGest, trans: FADE },
  { node: <CBeatCliente />, dur: CDUR.cliente, trans: FADE },
  { node: <CBeatRicambi />, dur: CDUR.ricambi, trans: FADE },
  { node: <CBeatMovimento />, dur: CDUR.movimento, trans: FADE },
  { node: <CBeatFatturaCompleta />, dur: CDUR.fatturaC, trans: FADE },
  { node: <RecapModuli />, dur: CDUR.recap, trans: FADE },
  { node: <Outro />, dur: CDUR.outro },
];

export const SoccorsoMovie: React.FC = () => <Series items={SOCCORSO_ITEMS()} />;
export const DemolizioneMovie: React.FC = () => <Series items={DEMO_ITEMS()} />;
export const CompletoMovie: React.FC = () => <Series items={COMPLETO_ITEMS()} />;
