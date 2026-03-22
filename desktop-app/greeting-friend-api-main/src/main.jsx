// src/main.jsx
import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "./styles/design-tokens.css";
import App from "./App.jsx";

// Initialize Sentry for error tracking (renderer process)
import * as Sentry from "@sentry/electron/renderer";
import { init as reactInit } from "@sentry/react";

Sentry.init({
  dsn: "https://06cbf7995d244424b5b2b5ef90541636@errors.rescuemanager.eu/1",
  environment: import.meta.env.MODE || "production",
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  // Disable IPC in dev mode to avoid sentry-ipc:// warnings
  transport: import.meta.env.DEV ? undefined : Sentry.makeElectronTransport,
});

// Inizializza il client Supabase lato browser (definisce window.supabase ed export)
import "./lib/supabase-browser";

// Provider per org corrente, lista org e ruolo (owner/member)
import { OrgProvider } from "./context/OrgContext";

/**
 * Applica subito il tema prima del render per evitare FOUC.
 * Legge rm-theme da localStorage: "system" | "light" | "dark" (default: "system").
 * In "system" segue matchMedia("(prefers-color-scheme: dark)").
 */
(function bootTheme() {
  try {
    const mode = localStorage.getItem("rm-theme") || "system";
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const shouldDark = mode === "dark" || (mode === "system" && mq.matches);
    const root = document.documentElement; // <html>

    if (shouldDark) root.classList.add("dark");
    else root.classList.remove("dark");

    if (mode === "system" && mq.addEventListener) {
      mq.addEventListener("change", (e) => {
        if (e.matches) root.classList.add("dark");
        else root.classList.remove("dark");
      });
    }
  } catch {
    // non blocca il boot se qualcosa va storto
  }
})();

/** Assicura che esista il nodo root */
function ensureRoot() {
  let el = document.getElementById("root");
  if (!el) {
    el = document.createElement("div");
    el.id = "root";
    document.body.appendChild(el);
  }
  return el;
}

const rootEl = ensureRoot();

createRoot(rootEl).render(
  <StrictMode>
    <OrgProvider>
      <App />
    </OrgProvider>
  </StrictMode>
);