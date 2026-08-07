import React from "react";
import { Composition } from "remotion";
import { VIDEO } from "./lib/theme";
import {
  SoccorsoMovie,
  DemolizioneMovie,
  CompletoMovie,
  seriesTotal,
  SOCCORSO_ITEMS,
  DEMO_ITEMS,
  COMPLETO_ITEMS,
} from "./Video";

export const RemotionRoot: React.FC = () => {
  const common = { fps: VIDEO.fps, width: VIDEO.width, height: VIDEO.height };
  return (
    <>
      <Composition
        id="Soccorso"
        component={SoccorsoMovie}
        durationInFrames={seriesTotal(SOCCORSO_ITEMS())}
        {...common}
      />
      <Composition
        id="Demolizione"
        component={DemolizioneMovie}
        durationInFrames={seriesTotal(DEMO_ITEMS())}
        {...common}
      />
      <Composition
        id="Completo"
        component={CompletoMovie}
        durationInFrames={seriesTotal(COMPLETO_ITEMS())}
        {...common}
      />
    </>
  );
};
