// src/lib/api.js
const BASE = import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "";

async function req(path, { method = "GET", body, signal } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    signal,
    credentials: "include",
  });
  if (!res.ok) {
    let detail = "";
    try { detail = await res.text(); } catch {}
    const err = new Error(`HTTP ${res.status} ${res.statusText}${detail ? ` – ${detail}` : ""}`);
    err.status = res.status;
    throw err;
  }
  // 204 no content
  if (res.status === 204) return null;
  const ctype = res.headers.get("content-type") || "";
  return ctype.includes("application/json") ? res.json() : res.text();
}

export const api = {
  // Transports
  listTransports: (signal) => req("/api/transports", { signal }),
  createTransport: (payload, signal) => req("/api/transports", { method: "POST", body: payload, signal }),
  patchTransport: (id, patch, signal) => req(`/api/transports/${id}`, { method: "PATCH", body: patch, signal }),
  // Drivers
  listDrivers: (signal) => req("/api/drivers", { signal }),
  // Notes
  getNotes: (signal) => req("/api/notes", { signal }),
  saveNotes: (text, signal) => req("/api/notes", { method: "PUT", body: { text }, signal }),
};