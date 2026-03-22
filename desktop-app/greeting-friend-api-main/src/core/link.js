// src/core/link.js
// Mini "deeplink" + helpers per navigazione e apertura schede/modali
import { bus } from "./bus";

// Funzione di navigazione (usa window.appNavigate se presente)
export function go(path, state) {
  if (typeof window !== "undefined" && typeof window.appNavigate === "function") {
    window.appNavigate(path, state);
  } else {
    // fallback per dev browser: aggiorna hash
    location.hash = "#" + path.replace(/^\//, "");
  }
}

// Apri entità: emette sia evento che navigazione (opzionale)
export function openClient(id, { navigate = true } = {}) {
  bus.emit("open:client", { id });
  if (navigate) go(`/clients?id=${id}`);
}
export function openTransport(id, { navigate = true } = {}) {
  bus.emit("open:transport", { id });
  if (navigate) go(`/transports?id=${id}`);
}
export function openQuote(id, { navigate = true } = {}) {
  bus.emit("open:quote", { id });
  if (navigate) go(`/quotes?id=${id}`);
}

// Notifiche globali
export function notify(message, type = "info") {
  bus.emit("notify", { type, message });
}