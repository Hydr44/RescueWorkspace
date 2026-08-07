import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";

// Inter = font unico dell'app (heading + body). JetBrains Mono = numeri/codici.
const inter = loadInter("normal", {
  weights: ["300", "400", "500", "600", "700"],
});
const mono = loadMono("normal", { weights: ["400", "500"] });

export const FONT_SANS = `${inter.fontFamily}, system-ui, -apple-system, sans-serif`;
export const FONT_MONO = `${mono.fontFamily}, 'Fira Code', Monaco, monospace`;

export const waitForFonts = async () => {
  await inter.waitUntilDone();
  await mono.waitUntilDone();
};
