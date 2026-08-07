import { Config } from "@remotion/cli/config";

// Qualita alta per pubblicazione: frame JPEG a qualita 100 (near-lossless su
// UI piatte, molto piu veloce del PNG) + bitrate alto via CRF basso.
Config.setVideoImageFormat("jpeg");
Config.setJpegQuality(100);
Config.setOverwriteOutput(true);
// Concorrenza 4 (come i render stabili precedenti): 8 starvava i caricamenti
// SVG del logo e rallentava tutto per contesa risorse.
Config.setConcurrency(4);
// CRF piu basso = bitrate piu alto = qualita maggiore (h264, range 1-51).
Config.setCrf(16);
// Timeout generoso: gli <Img> (loghi SVG) non vanno mai in delayRender timeout.
Config.setTimeoutInMilliseconds(120000);
Config.setChromiumOpenGlRenderer("angle");
