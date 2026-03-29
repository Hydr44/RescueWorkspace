// src/lib/assist.js
import { API } from "./apiConfig";

export async function createAssistRequest({ phone, note, orgId, createdBy }) {
  const payload = {
    phone,
    note,
  };

  if (orgId) {
    payload.orgId = orgId;
  }

  if (createdBy) {
    payload.createdBy = createdBy;
  }

  const r = await fetch(`${API.ASSIST}/api/assist/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!r.ok) throw new Error((await r.json()).error || r.statusText);
  return r.json(); // { ok, token, url, request }
}

export async function listAssistRequests(orgId) {
  const params = new URLSearchParams();
  if (orgId) params.set("orgId", orgId);
  params.set("limit", "50");

  const r = await fetch(`${API.ASSIST}/api/assist/list?${params.toString()}`);
  if (!r.ok) throw new Error((await r.json()).error || r.statusText);
  const data = await r.json();
  return data.rows || [];
}

export async function deleteAssistRequest(requestId) {
  const r = await fetch(`${API.ASSIST}/api/assist/${requestId}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
  });
  if (!r.ok) throw new Error((await r.json()).error || r.statusText);
  return r.json();
}
