// src/core/search.js
// Indice semplice cross-entity (no dipendenze). Full-text "lite" con pesi.

const norm = (s) => String(s ?? "").toLowerCase();

export function buildIndex({ clients = [], transports = [], quotes = [] }) {
  const idx = [];

  // CLIENTI
  for (const c of clients) {
    const title = c.nome || c.name || "(Cliente)";
    idx.push({
      _t: "client",
      id: c.id,
      title,
      terms: [
        c.nome, c.name, c.email, c.telefono, c.piva, c.indirizzo,
      ].map(norm).join(" "),
      raw: c,
      weight: 3, // i clienti pesano di più
    });
  }

  // TRASPORTI
  for (const t of transports) {
    const title = t.targa || t.riferimento || t.cliente || "(Trasporto)";
    idx.push({
      _t: "transport",
      id: t.id,
      title,
      terms: [
        t.targa, t.telaio, t.riferimento, t.note,
        t.cliente, t.client?.nome, t.client?.email, t.client?.telefono,
        t.indirizzo, t.via, t.citta, t.cap, t.provincia,
      ].map(norm).join(" "),
      raw: t,
      weight: 2,
    });
  }

  // PREVENTIVI
  for (const q of quotes) {
    const title = q.ref || q.numero || `Preventivo #${q.id}`;
    idx.push({
      _t: "quote",
      id: q.id,
      title,
      terms: [
        q.ref, q.numero, q.note, q.destinatario, q.client_nome, q.client_email,
      ].map(norm).join(" "),
      raw: q,
      weight: 1,
    });
  }

  return idx;
}

export function queryIndex(idx, q) {
  const s = norm(q).trim();
  if (!s) return [];
  const parts = s.split(/\s+/);
  const scored = [];
  for (const it of idx) {
    let score = 0;
    for (const p of parts) {
      if (it.terms.includes(p)) score += 1;
      if (it.title.toLowerCase().includes(p)) score += 2;
    }
    score *= it.weight;
    if (score > 0) scored.push({ ...it, score });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 20);
}