// src/core/datalayer.js
// Unifica gli accessi a window.api.* + relazioni tra tabelle.
// Non impone ORM: solo helpers tipizzati e cache leggera.

const isEl = typeof window !== "undefined" && window.api;

// Fallbacks in browser (usano localStorage come negli altri file)
const fallback = {
  async list(key) {
    try { return JSON.parse(localStorage.getItem(`dev:${key}`) || "[]"); } catch { return []; }
  },
  async create(key, payload) {
    const list = await this.list(key);
    const id = (list.at(-1)?.id ?? 0) + 1;
    const rec = { id, ...payload };
    list.push(rec);
    localStorage.setItem(`dev:${key}`, JSON.stringify(list));
    return rec;
  },
  async update(key, id, patch) {
    const list = await this.list(key);
    const i = list.findIndex(v => v.id === id);
    if (i === -1) throw new Error(`${key} not found`);
    list[i] = { ...list[i], ...patch };
    localStorage.setItem(`dev:${key}`, JSON.stringify(list));
    return list[i];
  },
  async remove(key, id) {
    const list = await this.list(key);
    const next = list.filter(v => v.id !== id);
    localStorage.setItem(`dev:${key}`, JSON.stringify(next));
    return { ok: true };
  },
};

const api = {
  clients: isEl?.clients ?? {
    list: () => fallback.list("clients"),
    create: (p) => fallback.create("clients", p),
    update: (id, p) => fallback.update("clients", id, p),
    remove: (id) => fallback.remove("clients", id),
  },
  transports: isEl?.transports ?? {
    list: () => fallback.list("transports"),
    create: (p) => fallback.create("transports", p),
    update: (id, p) => fallback.update("transports", id, p),
    remove: (id) => fallback.remove("transports", id),
  },
  quotes: isEl?.quotes ?? {
    list: () => fallback.list("quotes"),
    create: (p) => fallback.create("quotes", p),
    update: (id, p) => fallback.update("quotes", id, p),
    remove: (id) => fallback.remove("quotes", id),
  },
  users: isEl?.users,
  vehicles: isEl?.vehicles,
  autisti: isEl?.autisti,
  yard: isEl?.yard,
};

let cache = {
  clients: null,
  transports: null,
  quotes: null,
  // … aggiungibili
};

export async function loadAll() {
  const [clients, transports, quotes] = await Promise.all([
    api.clients.list(),
    api.transports.list(),
    api.quotes.list(),
  ]);
  cache = { ...cache, clients, transports, quotes };
  return cache;
}

export function getCache() {
  return { ...cache };
}

// Relazioni utili
export function bindRelations() {
  if (!cache.clients || !cache.transports) return;

  const byClient = new Map(cache.clients.map(c => [c.id, c]));
  // aggiunge client denormalizzato ai trasporti
  cache.transports = cache.transports.map(t => ({
    ...t,
    client: t.client_id ? byClient.get(t.client_id) || null : null,
  }));

  // quotes collegate
  if (cache.quotes) {
    const qByClient = new Map();
    for (const q of cache.quotes) {
      const k = q.client_id || q.clientId || q.client; // varianti
      if (!k) continue;
      if (!qByClient.has(k)) qByClient.set(k, []);
      qByClient.get(k).push(q);
    }
    cache.clients = cache.clients.map(c => ({
      ...c,
      quotes: qByClient.get(c.id) || [],
    }));
  }
}

// Helpers veloci
export function transportsByClient(clientId) {
  if (!cache.transports) return [];
  return cache.transports.filter(t => t.client_id === clientId);
}
export function quotesByClient(clientId) {
  if (!cache.quotes) return [];
  return cache.quotes.filter(q => (q.client_id || q.clientId) === clientId);
}

// Mutations centralizzate (aggiornano cache + DB)
export async function createTransport(p) {
  const res = await api.transports.create(p);
  if (cache.transports) cache.transports = [res, ...cache.transports];
  return res;
}
export async function createQuote(p) {
  const res = await api.quotes.create(p);
  if (cache.quotes) cache.quotes = [res, ...cache.quotes];
  return res;
}
export async function createClient(p) {
  const res = await api.clients.create(p);
  if (cache.clients) cache.clients = [res, ...cache.clients];
  return res;
}

export const DataAPI = api;