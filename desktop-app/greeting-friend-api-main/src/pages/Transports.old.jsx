// src/pages/Transports.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiTrash2, FiRefreshCcw, FiCopy, FiExternalLink, FiPlus,
  FiCheck, FiLoader, FiSearch, FiArchive, FiCalendar,
  FiMoreHorizontal
} from "react-icons/fi";
import { supabaseBrowser } from "../lib/supabase-browser";
import { useOrg } from "../context/OrgContext";

/* ---------- Helpers ---------- */
const fmtDMY = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
};
const fmtHM = (iso) => (iso ? new Date(iso).toTimeString().slice(0, 5) : "");

/* ---------- UI helpers ---------- */
const Badge = ({ stato }) => {
  const cls =
    stato === "new" ? "chip chip-indigo"
      : stato === "assigned" ? "chip chip-amber"
      : stato === "enroute" ? "chip chip-blue"
      : stato === "done" ? "chip chip-emerald"
      : "chip chip-gray";
  const label = 
    stato === "new" ? "Nuovo"
      : stato === "assigned" ? "Assegnato"
      : stato === "enroute" ? "In Viaggio"
      : stato === "done" ? "Completato"
      : stato;
  return <span className={cls}>{label}</span>;
};

function Field({ label, required, hint, error, children, className = "" }) {
  return (
    <label className={`block ${className}`}>
      <div className="flex items-center justify-between mb-1">
        <div className="text-sm text-slate-500">
          {label} {required && <span className="text-red-500">*</span>}
        </div>
        {hint && <div className="text-xs text-slate-500">{hint}</div>}
      </div>
      {children}
      {error && <div className="mt-1 text-xs text-red-600">{error}</div>}
    </label>
  );
}

function Toast({ show, text }) {
  if (!show) return null;
  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-lg bg-[#141c27] text-white border border-[#243044] px-3 py-2 shadow-lg">
      <FiCheck className="opacity-80" />
      <span className="text-sm">{text}</span>
    </div>
  );
}

function ConfirmDialog({ open, title = "Sei sicuro?", message, confirmLabel = "Sì", onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onCancel} />
      <div className="relative w-full max-w-sm rounded-xl border border-[#243044] bg-[#1a2536] p-4">
        <div className="text-lg font-semibold mb-1">{title}</div>
        {message && <div className="text-sm text-slate-500 mb-4">{message}</div>}
        <div className="flex justify-end gap-2">
          <button className="btn btn-outline" onClick={onCancel}>No</button>
          <button className="btn btn-danger" onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Pagina ---------- */
export default function Transports() {
  const navigate = useNavigate();
  const supabase = supabaseBrowser();
  const { orgId, userId, role, authEvent } = useOrg(); // authEvent: 'SIGNED_IN' | 'TOKEN_REFRESHED' | etc.

  // lista
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  // UI state
  const [openDetail, setOpenDetail] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [confirmId, setConfirmId] = useState(null);
  const [savedToast, setSavedToast] = useState(false);

  // filtri/ricerca
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // conferma archiviazione
  const [archivePrompt, setArchivePrompt] = useState({ open: false, id: null });

  /* --------- Caricamento/refresh dati --------- */
  // 1) carica quando org e user sono pronti
  useEffect(() => {
    if (!orgId || !userId) {
      setRows([]);
      setLoading(false);
      return;
    }
    loadTransports(orgId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId, userId]);

  // 2) refresh quando Supabase emette eventi auth (dopo login / refresh token)
  useEffect(() => {
    if (!orgId || !userId) return;
    if (authEvent === "SIGNED_IN" || authEvent === "TOKEN_REFRESHED" || authEvent === "USER_UPDATED") {
      loadTransports(orgId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authEvent]);

  // 3) realtime per org
  useEffect(() => {
    if (!orgId) return;
    const channel = supabase
      .channel(`transports:${orgId}`)
      .on("postgres_changes",
        { event: "*", schema: "public", table: "transports", filter: `org_id=eq.${orgId}` },
        () => loadTransports(orgId))
      .subscribe();
    return () => supabase.removeChannel(channel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId]);

  async function loadTransports(currentOrg) {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("transports")
        .select("id, client_id, pickup_address, dropoff_address, status, driver_id, vehicle_id, notes, lat, lng, created_at")
        .eq("org_id", currentOrg)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setRows(data || []);
    } catch (e) {
      console.error("load transports failed", e);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  const selected = useMemo(() => rows.find((r) => r.id === selectedId) || null, [rows, selectedId]);

  /* --------- Actions CRUD --------- */

  const requestDelete = (id) => setConfirmId(id);

  const confirmDelete = async () => {
    const id = confirmId;
    if (!id) return;
    if (role !== "owner") {
      alert("Solo il proprietario dell’organizzazione può eliminare i trasporti.");
      setConfirmId(null);
      return;
    }
    try {
      const prev = rows;
      setRows((p) => p.filter((r) => r.id !== id));
      const { error } = await supabase.from("transports").delete().eq("id", id).eq("org_id", orgId);
      if (error) { setRows(prev); throw error; }
      if (id === selectedId) setOpenDetail(false);
    } catch (err) {
      console.error("delete failed", err);
      alert("Errore durante l'eliminazione.");
      await loadTransports(orgId);
    } finally {
      setConfirmId(null);
    }
  };

  const cycleStato = async (id) => {
    const order = ["new", "assigned", "enroute", "done"];
    const row = rows.find((r) => r.id === id);
    if (!row) return;
    const next = order[(order.indexOf(row.status) + 1) % order.length];
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status: next } : r)));
    try {
      const { data, error } = await supabase
        .from("transports")
        .update({ status: next })
        .eq("id", id)
        .eq("org_id", orgId)
        .select("*")
        .single();
      if (error) throw error;
      if (data?.status === "done") setArchivePrompt({ open: true, id });
    } catch (e) {
      setRows((prev) => prev.map((r) => (r.id === id ? row : r))); // rollback
    }
  };

  const archiveRow = async (id) => {
    try {
      const { data, error } = await supabase
        .from("transports")
        .update({ stato: "archiviato" })
        .eq("id", id)
        .eq("org_id", orgId)
        .select("*")
        .single();
      if (error) throw error;
      setRows((prev) => prev.map((r) => (r.id === id ? data : r)));
      setSavedToast(true);
      setTimeout(() => setSavedToast(false), 1200);
    } catch (e) {
      console.error("archive failed", e);
      alert("Errore durante l'archiviazione.");
    } finally {
      setArchivePrompt({ open: false, id: null });
    }
  };

  const duplicateRow = async (id) => {
    const r = rows.find((x) => x.id === id);
    if (!r || !orgId) return;
    try {
      const payload = {
        org_id: orgId, created_by: userId,
        client_id: r.client_id || null,
        pickup_address: r.pickup_address || null,
        dropoff_address: r.dropoff_address || null,
        status: "new",
        driver_id: r.driver_id || null,
        vehicle_id: r.vehicle_id || null,
        notes: r.notes || null,
        lat: r.lat ?? null,
        lng: r.lng ?? null
      };
      const optimistic = { id: Math.floor(Math.random() * 1e9) * -1, ...payload };
      setRows((prev) => [optimistic, ...prev]);
      const { data, error } = await supabase.from("transports").insert(payload).select("*").single();
      if (error) throw error;
      setRows((prev) => prev.map((r) => (r.id === optimistic.id ? data : r)));
    } catch (err) {
      console.error("duplicate failed", err);
      setRows((prev) => prev.filter((x) => x.id >= 0));
    }
  };

  const openDetailFor = (id) => { setSelectedId(id); setOpenDetail(true); };

  const canCreate = !!orgId;
  const canDelete = role === "owner";

  /* --------- Filtri / ricerca --------- */
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (!term) return true;
      const hay = [
        r.id, r.client_id, r.pickup_address, r.dropoff_address, r.status, r.driver_id, r.vehicle_id, r.notes
      ].filter(Boolean).join(" ").toLowerCase();
      return hay.includes(term);
    });
  }, [rows, q, statusFilter]);

  /* --------- Render --------- */
  return (
    <div className="space-y-6">
      <Toast show={savedToast} text="Modifiche salvate" />

      {/* Header moderno con gradiente */}
      <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
               Trasporti
            </h1>
            <p className="text-white/80 text-sm mt-1">
              {filtered.length} {filtered.length === 1 ? 'trasporto' : 'trasporti'} 
              {q && ` · Risultati per "${q}"`}
            </p>
          </div>
          
          <button
            type="button"
            onClick={() => navigate("/trasporti/new")}
            className="btn bg-[#1a2536] text-indigo-600 hover:bg-[#141c27] font-semibold shadow-md px-6 py-3 rounded-xl whitespace-nowrap active:scale-[0.98] transition-all"
            title="Nuovo trasporto"
            disabled={!orgId}
          >
            <FiPlus className="mr-2" /> Nuovo trasporto
          </button>
        </div>
      </div>

      {/* Filtri e ricerca - Card moderna */}
      <div className="bg-[#1a2536] rounded-xl border border-[#243044] p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 pointer-events-none" />
            <input
              placeholder="Cerca cliente, indirizzo, autista, mezzo..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-lg border border-[#243044] bg-transparent text-sm focus:ring-2 ring-indigo-500 outline-none transition-all"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500 whitespace-nowrap">Stato:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-[#243044] bg-transparent text-sm px-4 py-3 focus:ring-2 ring-indigo-500 outline-none transition-all min-w-[140px]"
            >
              <option value="all">Tutti</option>
              <option value="new">Nuovo</option>
              <option value="assigned">Assegnato</option>
              <option value="enroute">In Viaggio</option>
              <option value="done">Completato</option>
              <option value="archiviato">Archiviato</option>
            </select>
          </div>
        </div>
      </div>

      {/* Avviso organizzazione mancante */}
      {!orgId && (
        <div className="mt-2 rounded-lg border border-amber-300 bg-amber-500/10 text-amber-900 p-3 flex items-center justify-between">
          <div className="text-sm">
            Nessuna organizzazione selezionata. Vai su <b>Impostazioni → Organizzazione</b> e scegli/crea la tua organizzazione.
          </div>
          <a href="#/settings" className="btn btn-sm btn-outline shrink-0 whitespace-nowrap">Apri Impostazioni</a>
        </div>
      )}

      {/* Lista: tabella su md+, cards su mobile */}
      <div className="rounded-xl border border-[#243044] bg-[#1a2536] overflow-hidden">
        {/* Mobile cards */}
        <div className="md:hidden divide-y divide-gray-200">
          {loading && <div className="px-4 py-6 text-slate-500">Caricamento…</div>}
          {!loading && filtered.length === 0 && (
            <div className="px-4 py-8 text-center text-slate-500">
              Nessun trasporto.
            </div>
          )}
          {!loading && filtered.map((r) => (
            <div key={r.id} className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-slate-500">#{r.id}</div>
                  <div className="font-medium truncate">{r.client_id || r.pickup_address || "—"}</div>
                </div>
                <Badge stato={r.status} />
              </div>
              
              <div className="mt-3 space-y-2">
                <div className="text-sm text-slate-400">
                  <div className="font-medium truncate">{r.pickup_address || "—"}</div>
                  <div className="text-xs text-slate-500 mt-1">
                    {r.pickup_address || "—"}
                  </div>
                </div>
                
                {r.orario && (
                  <div className="text-xs text-slate-500 flex items-center gap-1">
                    <span className="text-slate-500"></span>
                    {fmtDMY(r.orario)} {fmtHM(r.orario)}
                  </div>
                )}
                
                {r.note && (
                  <div className="mt-2 p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                    <div className="text-xs text-amber-400 line-clamp-2">
                      {r.note}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="mt-3 flex items-center gap-2 flex-wrap">
                <button className="btn btn-outline btn-sm" onClick={() => cycleStato(r.id)}>
                  <FiRefreshCcw className="mr-1" /> Stato
                </button>
                {r.status === "done" && (
                  <button className="btn btn-outline btn-sm" onClick={() => setArchivePrompt({ open: true, id: r.id })}>
                    <FiArchive className="mr-1" /> Archivia
                  </button>
                )}
                <button className="btn btn-outline-red btn-sm" onClick={() => requestDelete(r.id)} disabled={!canDelete}>
                  <FiTrash2 className="mr-1" /> Elimina
                </button>
                <button className="btn btn-ghost btn-sm ml-auto" onClick={() => openDetailFor(r.id)}>
                  <FiMoreHorizontal />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop table */}
        <table className="w-full text-sm hidden md:table">
          <thead className="bg-[#141c27] text-slate-400">
            <tr>
              <th className="text-left px-4 py-2">#</th>
              <th className="text-left px-4 py-2">Cliente</th>
              <th className="text-left px-4 py-2">Indirizzo</th>
              <th className="text-left px-4 py-2">Città</th>
              <th className="text-left px-4 py-2">CAP</th>
              <th className="text-left px-4 py-2">Provincia</th>
              <th className="text-left px-4 py-2">Data/Ora</th>
              <th className="text-left px-4 py-2">Autista</th>
              <th className="text-left px-4 py-2">Mezzo</th>
              <th className="text-left px-4 py-2">Stato</th>
              <th className="text-right px-4 py-2">Azioni</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading && (
              <tr>
                <td className="px-4 py-6 text-slate-500" colSpan={11}>Caricamento…</td>
              </tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr>
                <td className="px-4 py-10 text-center text-slate-500" colSpan={11}>
                  Nessun trasporto.
                </td>
              </tr>
            )}
            {!loading && filtered.map((r) => (
              <tr
                key={r.id}
                className="hover:bg-[#141c27] cursor-pointer"
                onClick={(e) => { if (!e.target.closest("button")) openDetailFor(r.id); }}
              >
                <td className="px-4 py-2 text-slate-500">#{r.id}</td>
                <td className="px-4 py-2">{r.client_id || "-"}</td>
                <td className="px-4 py-2">{r.pickup_address || "-"}</td>
                <td className="px-4 py-2">{r.status || "-"}</td>
                <td className="px-4 py-2">{r.created_at ? `${fmtDMY(r.created_at)} ${fmtHM(r.created_at)}` : "-"}</td>
                <td className="px-4 py-2">{r.driver_id || "-"}</td>
                <td className="px-4 py-2">{r.vehicle_id || "-"}</td>
                <td className="px-4 py-2"><Badge stato={r.status} /></td>
                <td className="px-4 py-2 text-right space-x-2 whitespace-nowrap">
                  <button type="button" onClick={() => cycleStato(r.id)} className="btn btn-outline-indigo btn-sm active:scale-[0.98]">
                    <FiRefreshCcw className="h-4 w-4 mr-1" /> Stato
                  </button>
                  {r.status === "done" && (
                    <button type="button" onClick={() => setArchivePrompt({ open: true, id: r.id })} className="btn btn-outline btn-sm active:scale-[0.98]">
                      <FiArchive className="h-4 w-4 mr-1" /> Archivia
                    </button>
                  )}
                  <button type="button" onClick={() => requestDelete(r.id)} className="btn btn-outline-red btn-sm active:scale-[0.98]" disabled={!canDelete}>
                    <FiTrash2 className="h-4 w-4 mr-1" /> Elimina
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Conferma Elimina */}
      <ConfirmDialog
        open={confirmId != null}
        title="Eliminare questo trasporto?"
        message="Questa azione non può essere annullata."
        onConfirm={confirmDelete}
        onCancel={() => setConfirmId(null)}
      />

      {/* Prompt archiviazione */}
      <ConfirmDialog
        open={archivePrompt.open}
        title="Archiviare il trasporto?"
        message="Il trasporto è stato completato. Vuoi archiviarlo ora?"
        confirmLabel="Archivia"
        onConfirm={() => archiveRow(archivePrompt.id)}
        onCancel={() => setArchivePrompt({ open: false, id: null })}
      />

      {/* Drawer Dettaglio */}
      {openDetail && selected && (
        <DetailDrawer
          row={selected}
          onClose={() => setOpenDetail(false)}
          onCycle={() => cycleStato(selected.id)}
          onRequestDelete={() => setConfirmId(selected.id)}
          onDuplicate={() => duplicateRow(selected.id)}
          onSave={async (patch) => {
            try {
              const prev = rows.find((r) => r.id === selected.id);
              setRows((p) => p.map((r) => (r.id === selected.id ? { ...r, ...patch } : r)));

              const clean = { ...patch };
              if (clean.orario && !/Z$/.test(clean.orario)) clean.orario = new Date(clean.orario).toISOString();

              const { data, error } = await supabase
                .from("transports")
                .update(clean)
                .eq("id", selected.id)
                .eq("org_id", orgId)
                .select("*")
                .single();

              if (error) { setRows((p) => p.map((r) => (r.id === selected.id ? prev : r))); throw error; }

              setRows((p) => p.map((r) => (r.id === selected.id ? data : r)));
              setSavedToast(true); setTimeout(() => setSavedToast(false), 1400);
            } catch (err) {
              console.error("update failed", err);
              alert("Errore durante il salvataggio.");
            }
          }}
        />
      )}
    </div>
  );
}

/* ---------- Drawer dettaglio ---------- */
// Rimuoviamo il componente NewTransportModal - ora c'è una pagina separata TransportNew
function NewTransportModalRemoved(props) {
  const {
    form, setForm, touched, markTouched, indirizzoError, statoError,
    formValid, submitting, onClose, onSubmit,
    // autocomplete
    addrBoxRef, addrOpen, setAddrOpen, addrQuery, setAddrQuery,
    addrItems, addrActive, setAddrActive, addrLoading, chooseAddress
  } = props;

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") { e.preventDefault(); onClose(); }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "enter") {
        e.preventDefault(); onSubmit({ preventDefault() {} });
      }
      if (addrOpen && ["ArrowDown", "ArrowUp", "Enter"].includes(e.key)) {
        if (e.key === "ArrowDown") { e.preventDefault(); setAddrActive((i) => Math.min(addrItems.length - 1, Math.max(0, i + 1))); }
        else if (e.key === "ArrowUp") { e.preventDefault(); setAddrActive((i) => Math.max(0, i - 1)); }
        else if (e.key === "Enter") { e.preventDefault(); if (addrItems[addrActive]) chooseAddress(addrItems[addrActive], addrActive); }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [addrOpen, addrItems, addrActive, onClose, onSubmit, chooseAddress, setAddrActive]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl rounded-2xl border border-[#243044] bg-[#1a2536] shadow-2xl max-h-[90vh] overflow-hidden flex flex-col animate-scale-in">
        {/* Header con gradiente */}
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/5 p-2 rounded-lg">
              <FiPlus className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Nuovo trasporto</h2>
              <p className="text-sm text-white/80">Compila i campi per creare un nuovo trasporto</p>
            </div>
          </div>
          <button className="btn btn-ghost text-white hover:bg-white/5" onClick={onClose} title="Chiudi (Esc)">
            <FiX className="h-5 w-5" />
          </button>
        </div>

        {/* Body scrollabile */}
        <form onSubmit={onSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Sezione Cliente */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-300">
              <div className="h-px flex-1 bg-[#243044]" />
              <span> Informazioni Cliente</span>
              <div className="h-px flex-1 bg-[#243044]" />
            </div>
            
            <Field label="Cliente" hint="Nome o ragione sociale (facoltativo)">
              <input
                className="w-full rounded-lg border border-[#243044] bg-[#1a2536] px-4 py-3 focus:ring-2 ring-indigo-500 outline-none transition-all"
                placeholder="Mario Rossi / Azienda S.p.A."
                value={form.cliente}
                onChange={(e) => setForm((p) => ({ ...p, cliente: e.target.value }))}
              />
            </Field>
          </div>

          {/* Sezione Indirizzo */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-300">
              <div className="h-px flex-1 bg-[#243044]" />
              <span> Indirizzo di destinazione</span>
              <div className="h-px flex-1 bg-[#243044]" />
            </div>

            {/* INDIRIZZO + autocomplete */}
            <div ref={addrBoxRef} className="relative">
              <Field
                label="Via e numero civico"
                required
                hint={form._coords ? ` Coordinate: ${form._coords.lat.toFixed(4)}, ${form._coords.lng.toFixed(4)}` : "Inizia a digitare per cercare l'indirizzo"}
                error={indirizzoError}
              >
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 pointer-events-none" />
                    <input
                      id="nuovo-indirizzo"
                      className={`w-full rounded-lg border bg-[#1a2536] pl-10 pr-4 py-3 focus:ring-2 outline-none transition-all ${
                        indirizzoError ? "border-red-400 ring-red-500" : "border-[#243044] ring-indigo-500"
                      }`}
                      placeholder="Via Roma 123, Milano..."
                      value={form.via}
                      onChange={(e) => {
                        const v = e.target.value;
                        setForm((p) => ({ ...p, via: v, _addrConfirmed: false, indirizzoFull: "", _coords: null }));
                        setAddrQuery(v); setAddrOpen(true);
                      }}
                      onFocus={() => { setAddrQuery(form.via); setAddrOpen(true); }}
                      onBlur={() => markTouched("via")}
                      autoComplete="off"
                    />
                    {addrOpen && (
                      <div className="absolute z-20 mt-2 w-full max-h-64 overflow-auto rounded-xl border border-[#243044] bg-[#1a2536] shadow-xl">
                        {addrLoading && (
                          <div className="px-4 py-3 text-sm text-slate-500 flex items-center gap-2">
                            <FiLoader className="animate-spin h-4 w-4" /> Cerco indirizzi...
                          </div>
                        )}
                        {!addrLoading && addrItems.length === 0 && (
                          <div className="px-4 py-3 text-sm text-slate-500">Nessun risultato trovato</div>
                        )}
                        {!addrLoading && addrItems.map((it, i) => (
                          <button
                            key={it.id}
                            type="button"
                            className={`w-full text-left px-4 py-3 text-sm hover:bg-blue-500/10 transition-colors ${
                              i === addrActive ? "bg-blue-500/10" : ""
                            }`}
                            onMouseEnter={() => setAddrActive(i)}
                            onClick={() => chooseAddress(it, i)}
                          >
                            <div className="font-medium text-slate-200">{it.label.split(',')[0]}</div>
                            <div className="text-xs text-slate-500 mt-1">{it.label}</div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {!!form.via && (
                    <a
                      className="btn btn-outline px-4 py-3"
                      href={`https://www.google.com/maps?q=${encodeURIComponent([form.via, form.citta, form.cap, form.provincia].filter(Boolean).join(", "))}`}
                      title="Apri in Google Maps"
                      target="_blank"
                      rel="noreferrer"
                    >
                      <FiExternalLink className="h-5 w-5" />
                    </a>
                  )}
                </div>
              </Field>
            </div>

            <div className="grid md:grid-cols-3 gap-3">
              <Field label="Città" required>
                <input className="w-full rounded-lg border border-[#243044] bg-[#1a2536] px-4 py-3 focus:ring-2 ring-indigo-500 outline-none transition-all"
                  placeholder="Milano"
                  value={form.citta} onChange={(e) => setForm((p) => ({ ...p, citta: e.target.value }))} />
              </Field>
              <Field label="CAP" required>
                <input className="w-full rounded-lg border border-[#243044] bg-[#1a2536] px-4 py-3 focus:ring-2 ring-indigo-500 outline-none transition-all"
                  placeholder="20100"
                  value={form.cap} onChange={(e) => setForm((p) => ({ ...p, cap: e.target.value }))} />
              </Field>
              <Field label="Provincia" required>
                <input className="w-full rounded-lg border border-[#243044] bg-[#1a2536] px-4 py-3 focus:ring-2 ring-indigo-500 outline-none transition-all"
                  placeholder="MI"
                  value={form.provincia} onChange={(e) => setForm((p) => ({ ...p, provincia: e.target.value }))} />
              </Field>
            </div>
          </div>

          {/* Sezione Dettagli */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-300">
              <div className="h-px flex-1 bg-[#243044]" />
              <span> Dettagli trasporto</span>
              <div className="h-px flex-1 bg-[#243044]" />
            </div>

            <div className="grid md:grid-cols-2 gap-3">
              <Field label="Data e ora" hint="Quando effettuare il trasporto (facoltativo)">
                <input type="datetime-local" className="w-full rounded-lg border border-[#243044] bg-[#1a2536] px-4 py-3 focus:ring-2 ring-indigo-500 outline-none transition-all"
                  value={form.orario} onChange={(e) => setForm((p) => ({ ...p, orario: e.target.value }))} />
              </Field>
              <Field label="Stato" required error={statoError}>
                <select
                  className={`w-full rounded-lg border bg-[#1a2536] px-4 py-3 focus:ring-2 outline-none transition-all ${
                    statoError ? "border-red-400 ring-red-500" : "border-[#243044] ring-indigo-500"
                  }`}
                  value={form.stato} onChange={(e) => setForm((p) => ({ ...p, stato: e.target.value }))} onBlur={() => markTouched("stato")}
                >
                  <option value="new">Nuovo</option>
                  <option value="assigned">Assegnato</option>
                  <option value="enroute">In Viaggio</option>
                  <option value="done">Completato</option>
                </select>
              </Field>
            </div>

            <div className="grid md:grid-cols-2 gap-3">
              <Field label="Autista" hint="Assegna un autista (facoltativo)">
                <input className="w-full rounded-lg border border-[#243044] bg-[#1a2536] px-4 py-3 focus:ring-2 ring-indigo-500 outline-none transition-all"
                  placeholder="Mario Rossi" value={form.autista}
                  onChange={(e) => setForm((p) => ({ ...p, autista: e.target.value }))} />
              </Field>
              <Field label="Mezzo" hint="Assegna un veicolo (facoltativo)">
                <input className="w-full rounded-lg border border-[#243044] bg-[#1a2536] px-4 py-3 focus:ring-2 ring-indigo-500 outline-none transition-all"
                  placeholder="AB123CD" value={form.mezzo}
                  onChange={(e) => setForm((p) => ({ ...p, mezzo: e.target.value }))} />
              </Field>
            </div>

            <Field label="Note aggiuntive" hint="Istruzioni speciali, dettagli operativi...">
              <textarea rows={3} className="w-full rounded-lg border border-[#243044] bg-[#1a2536] px-4 py-3 focus:ring-2 ring-indigo-500 outline-none transition-all resize-none"
                placeholder="Es: Ingresso da via secondaria, citofono 42, ecc..." value={form.note} onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))} />
            </Field>
          </div>
        </form>

        {/* Footer con pulsanti */}
        <div className="sticky bottom-0 px-6 py-4 bg-gradient-to-t from-white via-white to-transparent border-t border-[#243044] flex items-center justify-between">
          <div className="text-xs text-slate-500 flex items-center gap-2">
            {form._addrConfirmed ? (
              <><FiCheck className="text-green-500" /> Indirizzo confermato</>
            ) : (
              <span className="text-amber-600"> Seleziona un suggerimento per confermare</span>
            )}
          </div>
          <div className="flex gap-2">
            <button className="btn btn-outline px-6 py-3" onClick={onClose}>Annulla</button>
            <button className="btn btn-primary px-6 py-3 inline-flex items-center active:scale-[0.98] transition-transform shadow-md" onClick={onSubmit}
              disabled={!formValid || submitting}
              title={!formValid ? "Completa i campi obbligatori" : "Salva trasporto (Ctrl/Cmd+Invio)"}
            >
              {submitting ? <FiLoader className="mr-2 animate-spin h-5 w-5" /> : <FiSave className="mr-2 h-5 w-5" />}
              {submitting ? "Salvataggio…" : "Salva"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Drawer dettaglio ---------- */
function DetailDrawer({ row, onClose, onCycle, onRequestDelete, onDuplicate, onSave }) {
  const [draft, setDraft] = useState(row);
  const mapsUrl = `https://maps.google.com/?q=${encodeURIComponent([draft.via || draft.indirizzo, draft.citta, draft.cap, draft.provincia].filter(Boolean).join(", "))}`;

  useEffect(() => setDraft(row), [row]); // sync

  const dirty =
    (draft.cliente || "") !== (row.cliente || "") ||
    (draft.via || "") !== (row.via || "") ||
    (draft.citta || "") !== (row.citta || "") ||
    (draft.cap || "") !== (row.cap || "") ||
    (draft.provincia || "") !== (row.provincia || "") ||
    (draft.orario || "") !== (row.orario || "") ||
    (draft.autista || "") !== (row.autista || "") ||
    (draft.mezzo || "") !== (row.mezzo || "") ||
    (draft.stato || "") !== (row.stato || "") ||
    (draft.note || "") !== (row.note || "") ||
    (draft.indirizzo || "") !== (row.indirizzo || "");

  const update = (patch) => setDraft({ ...draft, ...patch });

  const doCopy = async (txt) => { try { await navigator.clipboard.writeText(txt); } catch {} };

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/50" onClick={onClose} />
      <div className="w-full max-w-xl h-full overflow-auto bg-[#1a2536] border-l border-[#243044]">
        <div className="sticky top-0 z-10 bg-[#1a2536]/90 backdrop-blur border-b border-[#243044] px-4 py-3 flex items-center justify-between">
          <div className="font-semibold">Trasporto #{row.id}</div>
          <div className="flex items-center gap-2">
            <button className="btn btn-outline btn-sm shrink-0 whitespace-nowrap" onClick={onDuplicate}>Duplica</button>
            <a className="btn btn-outline btn-sm shrink-0 whitespace-nowrap" title="Vedi in calendario" href="#/calendario">
              <FiCalendar className="mr-1" /> Calendario
            </a>
            <button className="btn btn-danger btn-sm shrink-0 whitespace-nowrap" onClick={onRequestDelete}>
              <FiTrash2 className="mr-1" /> Elimina
            </button>
            <button
              className={`btn ${dirty ? "btn-primary" : "btn-secondary"} btn-sm inline-flex items-center shrink-0 whitespace-nowrap`}
              onClick={() => dirty && onSave(draft)} disabled={!dirty}
              title={dirty ? "Salva modifiche" : "Nessuna modifica"}
            >
              <FiSave className="mr-1" /> Salva
            </button>
            <button className="btn btn-ghost btn-sm" onClick={onClose}><FiX /></button>
          </div>
        </div>

        <div className="p-4 space-y-6">
          <div className="rounded-xl border border-[#243044] p-4">
            <div className="grid md:grid-cols-2 gap-3">
              <Field label="Cliente">
                <input value={draft.cliente || ""} onChange={(e) => update({ cliente: e.target.value })} className="w-full rounded-md border px-3 py-2" />
              </Field>

              <Field label="Via / indirizzo">
                <div className="flex gap-2">
                  <input value={draft.via || ""} onChange={(e) => update({ via: e.target.value })}
                    className="w-full rounded-md border px-3 py-2" placeholder="Via e numero" />
                  <a href={mapsUrl} target="_blank" className="btn btn-outline" title="Apri in Maps" rel="noreferrer"><FiExternalLink /></a>
                  <button className="btn btn-outline" onClick={() => doCopy([draft.via, draft.citta, draft.cap, draft.provincia].filter(Boolean).join(", "))} title="Copia indirizzo">
                    <FiCopy />
                  </button>
                </div>
              </Field>

              <Field label="Città"><input value={draft.citta || ""} onChange={(e) => update({ citta: e.target.value })} className="w-full rounded-md border px-3 py-2" /></Field>
              <Field label="CAP"><input value={draft.cap || ""} onChange={(e) => update({ cap: e.target.value })} className="w-full rounded-md border px-3 py-2" /></Field>
              <Field label="Provincia"><input value={draft.provincia || ""} onChange={(e) => update({ provincia: e.target.value })} className="w-full rounded-md border px-3 py-2" /></Field>

              <Field label="Data/Ora"><input type="datetime-local" value={draft.orario || ""} onChange={(e) => update({ orario: e.target.value })} className="w-full rounded-md border px-3 py-2" /></Field>
              <Field label="Mezzo"><input value={draft.mezzo || ""} onChange={(e) => update({ mezzo: e.target.value })} className="w-full rounded-md border px-3 py-2" /></Field>
              <Field label="Autista"><input value={draft.autista || ""} onChange={(e) => update({ autista: e.target.value })} className="w-full rounded-md border px-3 py-2" /></Field>

              <Field label="Stato">
                <div className="flex items-center gap-2">
                  <Badge stato={draft.stato} />
                  <button className="btn btn-outline-indigo btn-sm" onClick={() => {
                    const order = ["new", "assigned", "enroute", "done"];
                    const i = order.indexOf(draft.stato);
                    update({ stato: order[(i + 1) % order.length] });
                  }}>
                    <FiRefreshCcw className="mr-1" /> Cambia
                  </button>
                </div>
              </Field>
            </div>
          </div>

          <div className="rounded-xl border border-[#243044] p-4">
            <div className="mb-2 font-medium text-slate-300 flex items-center gap-2">
              <FiFileText className="h-4 w-4" />
              Note interne
            </div>
            <textarea 
              rows={6} 
              value={draft.note || ""} 
              onChange={(e) => update({ note: e.target.value })}
              className="w-full rounded-lg border border-[#243044] bg-[#1a2536] px-3 py-2 text-sm focus:ring-2 ring-indigo-500 outline-none transition-all resize-y" 
              placeholder="Aggiungi note operative, informazioni demolizione, dettagli speciali…" 
            />
            <div className="mt-2 text-xs text-slate-500">
              Suggerimento: Utilizza questo campo per salvare informazioni sulla demolizione, documenti richiesti, o altre note importanti.
            </div>
          </div>

          {/* Azioni rapide */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-500">ID #{row.id}</div>
            <div className="flex gap-2 flex-wrap">
              <button className="btn btn-outline btn-sm" onClick={onDuplicate}>Duplica</button>
              {draft.stato === "done" && (
                <button className="btn btn-secondary btn-sm" onClick={() => onSave({ ...draft, stato: "archiviato" })} title="Archivia">
                  <FiArchive className="mr-1" /> Archivia
                </button>
              )}
              <button className="btn btn-outline btn-sm" onClick={onCycle}><FiRefreshCcw className="mr-1" /> Stato</button>
              <a className="btn btn-outline btn-sm" href="#/calendario"><FiCalendar className="mr-1" /> Calendario</a>
              <button className="btn btn-danger btn-sm" onClick={onRequestDelete}><FiTrash2 className="mr-1" /> Elimina</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}