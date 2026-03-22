// src/lib/licensing.js
import { API } from "./apiConfig";

export async function activateLicense({ key, deviceId, appVersion }) {
  const r = await fetch(`${API.LIC}/api/licensing/activate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key, deviceId, appVersion }),
  });
  if (!r.ok) throw new Error((await r.json()).error || r.statusText);
  return r.json(); // { ok, token, license }
}

export async function verifyLicense(token) {
  const r = await fetch(`${API.LIC}/api/licensing/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });
  if (!r.ok) throw new Error((await r.json()).error || r.statusText);
  return r.json(); // { ok, license }
}