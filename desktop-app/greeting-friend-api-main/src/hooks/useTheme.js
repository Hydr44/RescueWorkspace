// src/hooks/useTheme.js
import React, { useEffect, useMemo, useState } from "react";

const THEME_KEY = "rm-theme"; // 'system' | 'light' | 'dark'

function computeIsDark(mode) {
  const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
  return mode === "dark" || (mode === "system" && !!mq?.matches);
}

function applyTheme(mode) {
  const isDark = computeIsDark(mode);
  const root = document.documentElement;

  // tailwind dark mode
  root.classList.toggle("dark", isDark);

  // fa rispettare colori nativi (datepicker, scrollbar, ecc.)
  root.style.colorScheme = isDark ? "dark" : "light";

  // salva e notifica tutta l’app
  localStorage.setItem(THEME_KEY, mode);
  window.dispatchEvent(new CustomEvent("rm-theme-change", { detail: { mode } }));
}

export function getThemeMode() {
  const v = localStorage.getItem(THEME_KEY);
  return v === "light" || v === "dark" || v === "system" ? v : "system";
}

export function setThemeMode(mode) {
  if (!["light", "dark", "system"].includes(mode)) mode = "system";
  applyTheme(mode);
}

export function useTheme() {
  const [mode, setModeState] = useState(() => {
    const initial = getThemeMode();
    // Applica immediatamente al primo render
    applyTheme(initial);
    return initial;
  });

  // applica subito quando cambia da UI
  const setMode = (m) => {
    if (!["light", "dark", "system"].includes(m)) m = "system";
    setThemeMode(m);
    setModeState(m);
  };

  // reagisci ai cambi da altri punti (Settings/Toggle) o da altre finestre
  useEffect(() => {
    const onCustom = (e) => setModeState(e.detail?.mode ?? getThemeMode());
    const onStorage = (e) => {
      if (e.key === THEME_KEY) setModeState(getThemeMode());
    };
    window.addEventListener("rm-theme-change", onCustom);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("rm-theme-change", onCustom);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  // se è “system”, cambia live quando cambia il tema di macOS/Windows
  useEffect(() => {
    if (mode !== "system") return;
    const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
    const handler = () => applyTheme("system");
    mq?.addEventListener?.("change", handler);
    return () => mq?.removeEventListener?.("change", handler);
  }, [mode]);

  // assicura che lo stato attuale sia applicato (ad es. primo render)
  useEffect(() => {
    applyTheme(mode);
  }, [mode]);

  const isDark = useMemo(() => computeIsDark(mode), [mode]);
  return { mode, setMode, isDark };
}