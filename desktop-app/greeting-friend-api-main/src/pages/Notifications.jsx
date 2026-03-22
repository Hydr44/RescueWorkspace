// src/pages/Notifications.jsx
import { useEffect, useMemo, useState } from "react";
import Modal from "../components/Modal";
import {
  FiBell, FiPlus, FiTrash2, FiSearch,
  FiEye, FiEyeOff, FiInfo, FiAlertTriangle, FiCheckCircle, FiXCircle
} from "react-icons/fi";

/* -------- Electron vs Browser -------- */
const isElectron = typeof window !== "undefined" && window.api && window.api.notifications;
const notifAPI = isElectron
  ? window.api.notifications
  : {
      async list() {
        try {
          return JSON.parse(localStorage.getItem("dev:notifications") || "[]");
        } catch {
          return [];
        }
      },
      async create(payload) {
        const list = await this.list();
        const id = (list.at(-1)?.id ?? 0) + 1;
        const now = new Date().toISOString();
        const rec = {
          id,
          titolo: payload.titolo,
          messaggio: payload.messaggio || "",
          livello: payload.livello || "info",
          letto: payload.letto ? 1 : 0,
          created_at: now,
        };
        list.push(rec);
        localStorage.setItem("dev:notifications", JSON.stringify(list));
        return rec;
      },
      async update(id, patch) {
        const list = await this.list();
        const idx = list.findIndex((r) => r.id === id);
        if (idx === -1) throw new Error("Notifica non trovata");
        list[idx] = { ...list[idx], ...patch };
        localStorage.setItem("dev:notifications", JSON.stringify(list));
        return list[idx];
      },
      async remove(id) {
        const list = await this.list();
        const next = list.filter((r) => r.id !== id);
        localStorage.setItem("dev:notifications", JSON.stringify(next));
        return { ok: true };
      },
    };

/* -------- UI helpers -------- */
const levelToChip = (lvl) =>
  ({
    info: "chip chip-indigo",
    warn: "chip chip-amber",
    error: "chip chip-red",
    success: "chip chip-emerald",
  }[lvl] || "chip chip-gray");

const LevelIcon = ({ level }) => {
  if (level === "info") return <FiInfo />;
  if (level === "warn") return <FiAlertTriangle />;
  if (level === "error") return <FiXCircle />;
  if (level === "success") return <FiCheckCircle />;
  return <FiInfo />;
};

const timeAgo = (iso) => {
  if (!iso) return "—";
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s fa`;
  const m = Math.floor(diff / 60);
  if (m < 60) return `${m}m fa`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h fa`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}g fa`;
  const dt = new Date(iso);
  return dt.toLocaleString("it-IT");
};

/* -------- Modale nuova notifica -------- */
function NewNotifModal({ open, onClose, onCreate }) {
  const [titolo, setTitolo] = useState("");
  const [messaggio, setMessaggio] = useState("");
  const [livello, setLivello] = useState("info");

  useEffect(() => {
    if (open) {
      setTitolo("");
      setMessaggio("");
      setLivello("info");
    }
  }, [open]);

  if (!open) return null;

  const canSave = titolo.trim().length > 0;

  return (
    <Modal
      open
      onClose={onClose}
      title="Nuova notifica"
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <button className="btn btn-outline" onClick={onClose}>Annulla</button>
          <button
            className="btn btn-primary"
            disabled={!canSave}
            onClick={() => {
              onCreate({ titolo, messaggio, livello });
            }}
          >
            Crea
          </button>
        </div>
      }
    >
      <div className="space-y-3">
        <div>
          <label className="block text-sm text-slate-500 mb-1">Titolo</label>
          <input
            className="w-full rounded-md bg-[#0c1929] border border-[#243044] px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/40/40"
            value={titolo}
            onChange={(e) => setTitolo(e.target.value)}
            placeholder="Breve descrizione"
          />
        </div>
        <div>
          <label className="block text-sm text-slate-500 mb-1">Messaggio</label>
          <textarea
            rows={3}
            className="w-full rounded-md bg-[#0c1929] border border-[#243044] px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/40/40"
            value={messaggio}
            onChange={(e) => setMessaggio(e.target.value)}
            placeholder="Dettagli opzionali…"
          />
        </div>
        <div>
          <label className="block text-sm text-slate-500 mb-1">Livello</label>
          <select
            className="w-full rounded-md bg-[#0c1929] border border-[#243044] px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/40/40"
            value={livello}
            onChange={(e) => setLivello(e.target.value)}
          >
            <option value="info">Info</option>
            <option value="warn">Avviso</option>
            <option value="error">Errore</option>
            <option value="success">Successo</option>
          </select>
        </div>
      </div>
    </Modal>
  );
}

/* -------- Pagina Notifiche -------- */
export default function Notifications() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("tutte"); // tutte | non-lette
  const [levelFilter, setLevelFilter] = useState("tutti"); // tutti | info | warn | error | success

  const [openNew, setOpenNew] = useState(false);

  // Load
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await notifAPI.list();
        const norm = (data || []).map((n) => ({
          ...n,
          // compat: alcune versioni DB non hanno created_at — metto fallback
          created_at: n.created_at || new Date().toISOString(),
        }));
        // ordina per data decrescente
        norm.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        setRows(norm);
      } catch (e) {
        console.error("notifications.list failed", e);
        alert("Errore caricando le notifiche.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Filtri
  const list = useMemo(() => {
    let l = rows.slice();
    if (statusFilter === "non-lette") l = l.filter((r) => (r.letto ? 0 : 1));
    if (levelFilter !== "tutti") l = l.filter((r) => r.livello === levelFilter);
    if (q.trim()) {
      const qq = q.toLowerCase();
      l = l.filter(
        (r) =>
          (r.titolo || "").toLowerCase().includes(qq) ||
          (r.messaggio || "").toLowerCase().includes(qq)
      );
    }
    return l;
  }, [rows, q, statusFilter, levelFilter]);

  const unreadCount = rows.filter((r) => !r.letto).length;

  // Azioni
  const markReadToggle = async (row) => {
    try {
      const updated = await notifAPI.update(row.id, { letto: row.letto ? 0 : 1 });
      setRows((prev) => prev.map((r) => (r.id === row.id ? updated : r)));
    } catch (e) {
      console.error("notifications.update failed", e);
      alert("Errore aggiornando la notifica.");
    }
  };

  const removeOne = async (row) => {
    if (!confirm(`Eliminare la notifica "${row.titolo}"?`)) return;
    try {
      await notifAPI.remove(row.id);
      setRows((prev) => prev.filter((r) => r.id !== row.id));
    } catch (e) {
      console.error("notifications.remove failed", e);
      alert("Errore durante l'eliminazione.");
    }
  };

  const createOne = async ({ titolo, messaggio, livello }) => {
    try {
      const created = await notifAPI.create({
        titolo,
        messaggio,
        livello,
        letto: 0,
      });
      setRows((prev) => [created, ...prev]);
      setOpenNew(false);
    } catch (e) {
      console.error("notifications.create failed", e);
      alert("Errore creando la notifica.");
    }
  };

  return (
    <div className="space-y-4">
      {!isElectron && (
        <div className="rounded-lg border border-amber-300 bg-amber-500/10 text-amber-900 px-3 py-2 text-sm">
          Modalità browser: le notifiche sono salvate localmente (localStorage). Apri l'app Electron per usare il database.
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2">
          <FiBell /> Notifiche
          {unreadCount > 0 && (
            <span className="chip chip-amber">{unreadCount} non lette</span>
          )}
        </h1>
        <div className="flex items-center gap-2">
          <div className="relative">
            <FiSearch className="absolute left-2 top-2.5 text-slate-500" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cerca titolo o messaggio…"
              className="pl-8 pr-3 h-10 w-72 rounded-lg border border-[#243044]  bg-[#1a2536]  outline-none focus:ring-2 ring-indigo-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 rounded-lg border border-[#243044]  bg-[#1a2536]  px-3 outline-none focus:ring-2 ring-indigo-500"
            title="Filtro lettura"
          >
            <option value="tutte">Tutte</option>
            <option value="non-lette">Non lette</option>
          </select>
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="h-10 rounded-lg border border-[#243044]  bg-[#1a2536]  px-3 outline-none focus:ring-2 ring-indigo-500"
            title="Livello"
          >
            <option value="tutti">Tutti i livelli</option>
            <option value="info">Info</option>
            <option value="warn">Avviso</option>
            <option value="error">Errore</option>
            <option value="success">Successo</option>
          </select>
          <button className="btn btn-primary" onClick={() => setOpenNew(true)}>
            <FiPlus /> Nuova
          </button>
        </div>
      </div>

      {/* Lista */}
      <div className="rounded-xl border border-[#243044]  bg-[#1a2536]  overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#141c27]/50">
            <tr>
              <th className="text-left px-4 py-2">#</th>
              <th className="text-left px-4 py-2">Titolo</th>
              <th className="text-left px-4 py-2">Livello</th>
              <th className="text-left px-4 py-2">Stato</th>
              <th className="text-left px-4 py-2">Quando</th>
              <th className="text-right px-4 py-2">Azioni</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#243044] ">
            {loading && (
              <tr>
                <td className="px-4 py-8 text-center text-slate-500" colSpan={6}>
                  Caricamento…
                </td>
              </tr>
            )}
            {!loading &&
              list.map((r) => (
                <tr key={r.id} className="align-top">
                  <td className="px-4 py-3 text-slate-500">#{r.id}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium flex items-center gap-2">
                      <LevelIcon level={r.livello} />
                      {r.titolo}
                    </div>
                    {r.messaggio && (
                      <div className="text-xs text-slate-500 mt-1 whitespace-pre-wrap">
                        {r.messaggio}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={levelToChip(r.livello)}>{r.livello}</span>
                  </td>
                  <td className="px-4 py-3">
                    {r.letto ? (
                      <span className="chip chip-gray">letta</span>
                    ) : (
                      <span className="chip chip-amber">non letta</span>
                    )}
                  </td>
                  <td className="px-4 py-3">{timeAgo(r.created_at)}</td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button
                      className={`btn btn-outline ${r.letto ? "" : "btn-outline-indigo"}`}
                      onClick={() => markReadToggle(r)}
                      title={r.letto ? "Segna come non letta" : "Segna come letta"}
                    >
                      {r.letto ? <FiEyeOff /> : <FiEye />} {r.letto ? "Non letta" : "Letta"}
                    </button>
                    <button
                      className="btn btn-outline btn-outline-red"
                      onClick={() => removeOne(r)}
                      title="Elimina"
                    >
                      <FiTrash2 />
                    </button>
                  </td>
                </tr>
              ))}
            {!loading && list.length === 0 && (
              <tr>
                <td className="px-4 py-10 text-center text-slate-500" colSpan={6}>
                  Nessuna notifica per i filtri correnti.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modale nuova */}
      <NewNotifModal
        open={openNew}
        onClose={() => setOpenNew(false)}
        onCreate={createOne}
      />
    </div>
  );
}