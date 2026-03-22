// src/components/ThemeInit.jsx
import { useLayoutEffect } from "react";

export default function ThemeInit() {
  useLayoutEffect(() => {
    try {
      // Tema unico: modalità scura. Forziamo la classe "dark" e
      // impostiamo color-scheme su dark così tutti i componenti
      // usano la palette scura definita nei CSS/Tailwind.
      document.documentElement.classList.add("dark");
      document.documentElement.style.colorScheme = "dark";
    } catch {
      // Se qualcosa va storto, non blocchiamo il rendering.
    }
  }, []);
  return null;
}