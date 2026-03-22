// src/pages/Autisti.jsx
import { useEffect, useMemo, useState } from "react";
import {
  FiPlus, FiEdit2, FiTrash2, FiCheck, FiPause, FiPlay, FiSearch, FiChevronDown, FiDatabase
} from "react-icons/fi";
import Modal from "../components/Modal";
import { useOrg } from "@/context/OrgContext";
import { supabaseBrowser } from "@/lib/supabase-browser";

/* ================== Costanti ================== */
const STATI = ["disponibile","occupato","offline"];
const ORDINI = [
  { key:"nome", label:"Nome (A→Z)" },
  { key:"stato", label:"Stato" },
  { key:"assegnatiOggi", label:"Assegnati oggi" },
];

const TABLE = "staff_drivers";

/* ================== Utils encoding/decoding ================== */
const decodePatenti = (raw, arrMode) =>
  arrMode ? (Array.isArray(raw) ? raw : []) :
  String(raw || "").split(",").map(s=>s.trim()).filter(Boolean);

const encodePatenti = (val, arrMode) =>
  arrMode ? (Array.isArray(val) ? val : []) :
  (val || []).join(",");

/* ================== Pill e piccoli componenti ================== */
function StatoPill({ stato }) {
  const map = {
    disponibile: "bg-green-500/10 text-green-400",
    occupato: "bg-amber-500/10 text-amber-400",
    offline: "bg-[#243044] text-slate-200",
  };
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${map[stato]}`}>{stato}</span>;
}

function Avatar({ name }) {
  const initials = name?.trim()
    ? name.split(" ").map(p => p[0]?.toUpperCase()).slice(0,2).join("")
    : "AU";
  return <div className="h-10 w-10 shrink-0 rounded-full bg-blue-600 text-white grid place-items-center font-semibold">{initials}</div>;
}

function TagInput({ value=[], onChange }) {
  const [txt,setTxt] = useState("");
  const add = () => {
    const v = txt.trim();
    if (!v) return;
    if (!value.includes(v)) onChange([...value, v]);
    setTxt("");
  };
  const del = (t) => onChange(value.filter(x=>x!==t));
  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        {value.map(t=>(
          <span key={t} className="chip chip-gray">
            {t}
            <button type="button" className="ml-1 text-slate-500" onClick={()=>del(t)}>×</button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={txt} onChange={e=>setTxt(e.target.value)}
          onKeyDown={(e)=> e.key==="Enter" && (e.preventDefault(), add())}
          placeholder="Aggiungi tag e premi Invio"
          className="w-full rounded-md border px-3 py-2 bg-[#1a2536]"
        />
        <button type="button" className="btn btn-outline" onClick={add}>Aggiungi</button>
      </div>
    </div>
  );
}

function FieldLabel({ children, required=false }) {
  return (
    <div className="flex items-center justify-between mb-1">
      <label className="block text-sm text-slate-500">{children}</label>
      <span className={`text-[10px] px-1.5 py-0.5 rounded ${required ? "bg-rose-100 text-rose-700" : "bg-[#141c27] text-slate-400"}`}>
        {required ? "Obbligatorio" : "Facoltativo"}
      </span>
    </div>
  );
}

/* ================== Modale Modifica/Creazione ================== */
const EMPTY_FORM = {
  nome:"", telefono:"", stato:"disponibile", assegnatiOggi:0, note:"",
  tags:[], patenti:[], preferenze:[],
  disp:{lun:true,mar:true,mer:true,gio:true,ven:true,sab:false,dom:false},
};

function EditAutistaModal({ open, initial, onClose, onSave, arrayMode }) {
  const isNew = !initial?.id;
  const [form,setForm] = useState(initial ?? EMPTY_FORM);
  const [touched, setTouched] = useState({});

  useEffect(() => {
    setForm(initial ?? EMPTY_FORM);
    setTouched({});
  }, [initial, open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      const isMac = navigator.platform.toLowerCase().includes("mac");
      const mod = isMac ? e.metaKey : e.ctrlKey;
      if (e.key === "Escape") { e.preventDefault(); onClose(); }
      if (mod && e.key.toLowerCase() === "s") { e.preventDefault(); if (canSave) onSave(form); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, form]); // eslint-disable-line

  const set = (k,v)=> setForm(f=>({...f,[k]:v}));
  const mark = (k)=> setTouched(t=>({...t,[k]:true}));

  const errors = {
    nome: !form.nome.trim() ? "Inserisci il nome" : "",
    telefono: !form.telefono.trim() ? "Inserisci il telefono" : "",
  };
  const canSave = !errors.nome && !errors.telefono;

  const StatoSegment = (
    <div className="inline-flex rounded-lg border border-[#243044] p-1 bg-[#1a2536]">
      {STATI.map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => set("stato", s)}
          className={`px-3 h-8 rounded-md text-sm transition-colors ${form.stato === s ? "bg-blue-600 text-white" : "hover:bg-[#141c27]"}`}
        >
          {s[0].toUpperCase() + s.slice(1)}
        </button>
      ))}
    </div>
  );

  return open ? (
    <Modal
      open={open}
      onClose={onClose}
      title={
        <div className="flex items-center gap-3">
          <Avatar name={form.nome} />
          <div className="min-w-0">
            <div className="font-medium leading-tight truncate">
              {isNew ? "Nuovo autista" : `Modifica: ${initial.nome}`}
            </div>
            <div className="text-xs text-slate-500">Stato corrente: {form.stato}</div>
          </div>
          <div className="ml-auto">{StatoSegment}</div>
        </div>
      }
      footer={
        <div className="w-full flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs text-slate-400">
            {form.tags?.length ? <>Tag: <b>{form.tags.length}</b> · </> : null}
            Disponibilità attive: <b>{Object.values(form.disp||{}).filter(Boolean).length}/7</b>
          </div>
          <div className="flex items-center gap-2">
            <button className="btn btn-outline" onClick={onClose}>Annulla (Esc)</button>
            <button
              className="btn btn-primary"
              disabled={!canSave}
              onClick={() => onSave(form)}
              title="⌘/Ctrl+S"
            >
              {isNew ? "Crea" : "Salva"}
            </button>
          </div>
        </div>
      }
    >
      {/* Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-3">
          <div>
            <FieldLabel required>Nome</FieldLabel>
            <input
              className={`w-full rounded-md border px-3 py-2 bg-[#1a2536] outline-none focus:ring-2 focus:ring-blue-500/40 ${touched.nome && errors.nome ? "border-rose-400" : "border-[#243044]"}`}
              value={form.nome}
              onChange={e=>set("nome",e.target.value)}
              onBlur={()=>mark("nome")}
              placeholder="Nome e cognome"
              aria-invalid={!!(touched.nome && errors.nome)}
              aria-required="true"
            />
            {touched.nome && errors.nome && <p className="mt-1 text-xs text-rose-500">{errors.nome}</p>}
          </div>

          <div>
            <FieldLabel required>Telefono</FieldLabel>
            <input
              className={`w-full rounded-md border px-3 py-2 bg-[#1a2536] outline-none focus:ring-2 focus:ring-blue-500/40 ${touched.telefono && errors.telefono ? "border-rose-400" : "border-[#243044]"}`}
              value={form.telefono}
              onChange={e=>set("telefono",e.target.value)}
              onBlur={()=>mark("telefono")}
              placeholder="+39 ..."
              aria-invalid={!!(touched.telefono && errors.telefono)}
              aria-required="true"
            />
            {touched.telefono && errors.telefono && <p className="mt-1 text-xs text-rose-500">{errors.telefono}</p>}
          </div>

          <div>
            <FieldLabel>Assegnati oggi</FieldLabel>
            <input
              type="number" min={0}
              className="w-full rounded-md border border-[#243044] px-3 py-2 bg-[#1a2536] outline-none focus:ring-2 focus:ring-blue-500/40"
              value={form.assegnatiOggi}
              onChange={e=>set("assegnatiOggi", Number(e.target.value||0))}
            />
          </div>

          <div>
            <FieldLabel>Note</FieldLabel>
            <textarea
              rows={4}
              className="w-full rounded-md border border-[#243044] px-3 py-2 bg-[#1a2536] outline-none focus:ring-2 focus:ring-blue-500/40"
              value={form.note}
              onChange={e=>set("note",e.target.value)}
              placeholder="Turni, restrizioni, preferenze…"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <div className="text-sm font-medium mb-1">Tag competenze <span className="text-xs text-slate-500">(Facoltativo)</span></div>
            <TagInput value={form.tags} onChange={(v)=>set("tags",v)} />
          </div>

          <div>
            <div className="text-sm font-medium mb-1">Patenti <span className="text-xs text-slate-500">(Facoltativo)</span></div>
            <div className="flex flex-wrap gap-2">
              {["B","C","CE"].map(p=>(
                <button
                  key={p}
                  type="button"
                  className={`btn ${form.patenti?.includes(p) ? "btn-primary" : "btn-outline"}`}
                  onClick={()=>set("patenti",
                    form.patenti?.includes(p)
                      ? form.patenti.filter(x=>x!==p)
                      : [...(form.patenti||[]), p]
                  )}
                >{p}</button>
              ))}
            </div>
          </div>

          <div>
            <div className="text-sm font-medium mb-1">Preferenze mezzo <span className="text-xs text-slate-500">(Facoltativo)</span></div>
            <div className="flex flex-wrap gap-2">
              {["Carro leggero","Carro medio","Carro pesante"].map(m=>(
                <button
                  key={m}
                  type="button"
                  className={`btn ${form.preferenze?.includes(m) ? "btn-primary" : "btn-outline"}`}
                  onClick={()=>set("preferenze",
                    form.preferenze?.includes(m)
                      ? form.preferenze.filter(x=>x!==m)
                      : [...(form.preferenze||[]), m]
                  )}
                >{m}</button>
              ))}
            </div>
          </div>

          <div>
            <div className="text-sm font-medium mb-2">Disponibilità settimanale <span className="text-xs text-slate-500">(Facoltativo)</span></div>
            <div className="grid grid-cols-7 gap-2">
              {["lun","mar","mer","gio","ven","sab","dom"].map(d=>(
                <button
                  key={d}
                  type="button"
                  className={`h-9 rounded-md border text-sm ${form.disp?.[d] ? "btn-primary" : "btn-outline"}`}
                  onClick={()=>set("disp", { ...(form.disp||{}), [d]: !form.disp?.[d] })}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  ) : null;
}

/* ================== Conferma generica ================== */
function Confirm({ open, title, message, onCancel, onConfirm, confirmStyle="btn-primary", confirmLabel="Conferma" }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center">
      <div className="absolute inset-0 bg-black/60" onClick={onCancel} />
      <div className="relative w-full max-w-md rounded-xl border border-[#243044] bg-[#1a2536] p-4">
        <div className="font-semibold mb-2">{title}</div>
        {message && <div className="text-sm text-slate-400">{message}</div>}
        <div className="flex justify-end gap-2 pt-4">
          <button className="btn btn-outline" onClick={onCancel}>Annulla</button>
          <button className={`btn ${confirmStyle}`} onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

/* ================== Pagina ================== */
export default function Autisti() {
  const { orgId } = useOrg();
  const supabase = supabaseBrowser();

  const [autisti, setAutisti] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const [query, setQuery] = useState("");
  const [filtro, setFiltro] = useState("tutti");
  const [order, setOrder] = useState("nome");

  const [sel, setSel] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [delAsk, setDelAsk] = useState({ open:false, id:null });
  const [newOpen, setNewOpen] = useState(false);

  // Modalità colonne/JSONB (auto-detect)
  const [arrayMode, setArrayMode] = useState(true); // se true usa patenti/tags/preferenze array e disp jsonb

  //  alias corretti per PostgREST: alias:colonna
  const selectCols =
    "id, org_id, nome, telefono, stato, assegnatiOggi:assegnati_oggi, note, patente, patenti, tags, preferenze, disp";

  async function fetchAll() {
    if (!orgId) { setAutisti([]); setLoading(false); return; }
    try {
      setLoading(true);
      const { data, error, status } = await supabase
        .from(TABLE)
        .select(selectCols)
        .eq("org_id", orgId)
        .order("id", { ascending: true });
      if (error) throw Object.assign(error, { status });

      // auto-detect array/jsonb
      const hasRich = (data || []).some(r =>
        r.patenti != null || r.tags != null || r.preferenze != null || r.disp != null
      );
      setArrayMode(hasRich);

      const normalized = (data || []).map(a => ({
        id: a.id,
        org_id: a.org_id,
        nome: a.nome || "",
        telefono: a.telefono || "",
        stato: a.stato || "offline",
        assegnatiOggi: Number(a.assegnatiOggi || 0),
        note: a.note || "",
        patenti: decodePatenti(hasRich ? a.patenti : a.patente, hasRich),
        tags: Array.isArray(a.tags) ? a.tags : [],
        preferenze: Array.isArray(a.preferenze) ? a.preferenze : [],
        disp: a.disp || { lun:true, mar:true, mer:true, gio:true, ven:true, sab:false, dom:false },
      }));

      setAutisti(normalized);
      setEnabled(true);
      setErrorMsg("");
    } catch (e) {
      const msg = String(e?.message || "");
      if (e?.status === 404 || msg.includes("Could not find the table") || e?.code === "PGRST205") {
        setEnabled(false);
        setAutisti([]);
        setErrorMsg("La tabella 'staff_drivers' non è presente nel progetto.");
        return;
      }
      console.error("[staff_drivers] fetchAll error:", e);
      setErrorMsg("Errore nel caricamento degli autisti.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchAll(); /* eslint-disable-next-line */ }, [orgId]);

  // realtime
  useEffect(() => {
    if (!orgId || !enabled) return;
    const ch = supabase.channel(`${TABLE}:${orgId}`);
    ch.on(
      "postgres_changes",
      { event: "*", schema: "public", table: TABLE, filter: `org_id=eq.${orgId}` },
      fetchAll
    );
    ch.subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line
  }, [orgId, enabled]);

  const filtered = useMemo(() => {
    let l = [...autisti];
    if (filtro !== "tutti") l = l.filter(a => a.stato === filtro);
    if (query.trim()) {
      const q = query.toLowerCase();
      l = l.filter(a => a.nome.toLowerCase().includes(q) || (a.telefono||"").replace(/\s/g,"").includes(q));
    }
    l.sort((a,b)=>{
      if (order==="assegnatiOggi") return (b.assegnatiOggi||0) - (a.assegnatiOggi||0);
      return String(a[order]||"").localeCompare(String(b[order]||""));
    });
    return l;
  }, [autisti, filtro, query, order]);

  /* ---------- CRUD ---------- */
  const createAutista = async (data) => {
    const payload = {
      org_id: orgId,
      nome: data.nome,
      telefono: data.telefono,
      stato: data.stato || "offline",
      assegnati_oggi: Number(data.assegnatiOggi || 0),
      note: data.note || "",
      ...(arrayMode
        ? {
            patenti: encodePatenti(data.patenti, true),
            tags: data.tags || [],
            preferenze: data.preferenze || [],
            disp: data.disp || null,
          }
        : {
            patente: encodePatenti(data.patenti, false),
          }),
    };
    const { data: created, error } = await supabase
      .from(TABLE)
      .insert(payload)
      .select(selectCols)
      .single();
    if (error) throw error;

    const normalized = {
      id: created.id,
      org_id: created.org_id,
      nome: created.nome || "",
      telefono: created.telefono || "",
      stato: created.stato || "offline",
      assegnatiOggi: Number(created.assegnatiOggi || 0),
      note: created.note || "",
      patenti: decodePatenti(arrayMode ? created.patenti : created.patente, arrayMode),
      tags: Array.isArray(created.tags) ? created.tags : [],
      preferenze: Array.isArray(created.preferenze) ? created.preferenze : [],
      disp: created.disp || { lun:true,mar:true,mer:true,gio:true,ven:true,sab:false,dom:false },
    };
    setAutisti(prev => [normalized, ...prev]);
  };

  const updateAutista = async (id, patch) => {
    const payload = {
      ...("nome" in patch ? { nome: patch.nome } : {}),
      ...("telefono" in patch ? { telefono: patch.telefono } : {}),
      ...("stato" in patch ? { stato: patch.stato } : {}),
      ...("assegnatiOggi" in patch ? { assegnati_oggi: Number(patch.assegnatiOggi||0) } : {}),
      ...("note" in patch ? { note: patch.note || "" } : {}),
      ...(arrayMode
        ? {
            ...(patch.patenti ? { patenti: encodePatenti(patch.patenti, true) } : {}),
            ...(patch.tags ? { tags: patch.tags } : {}),
            ...(patch.preferenze ? { preferenze: patch.preferenze } : {}),
            ...(patch.disp ? { disp: patch.disp } : {}),
          }
        : {
            ...(patch.patenti ? { patente: encodePatenti(patch.patenti, false) } : {}),
          }),
    };
    const { data: upd, error } = await supabase
      .from(TABLE)
      .update(payload)
      .eq("id", id)
      .eq("org_id", orgId)
      .select(selectCols)
      .single();
    if (error) throw error;

    const normalized = {
      id: upd.id,
      org_id: upd.org_id,
      nome: upd.nome || "",
      telefono: upd.telefono || "",
      stato: upd.stato || "offline",
      assegnatiOggi: Number(upd.assegnatiOggi || 0),
      note: upd.note || "",
      patenti: decodePatenti(arrayMode ? upd.patenti : upd.patente, arrayMode),
      tags: Array.isArray(upd.tags) ? upd.tags : [],
      preferenze: Array.isArray(upd.preferenze) ? upd.preferenze : [],
      disp: upd.disp || { lun:true,mar:true,mer:true,gio:true,ven:true,sab:false,dom:false },
    };
    setAutisti(prev => prev.map(a => (a.id === id ? normalized : a)));
  };

  const removeAutista = async (id) => {
    const { error } = await supabase.from(TABLE).delete().eq("id", id).eq("org_id", orgId);
    if (error) throw error;
    setAutisti(prev => prev.filter(a => a.id !== id));
  };

  /* ---------- UI handlers ---------- */
  const changeStato = async (id, next) => { try { await updateAutista(id, { stato: next }); } catch { alert("Aggiornamento stato non riuscito."); } };
  const togglePausa = async (id) => {
    const cur = autisti.find(a => a.id === id);
    if (!cur) return;
    const next = cur.stato === "offline" ? "disponibile" : "offline";
    try { await updateAutista(id, { stato: next }); } catch { alert("Operazione non riuscita."); }
  };

  const openEdit = (a) => { setSel(a); setEditOpen(true); };
  const saveEdit = async (data) => {
    try {
      if (data.id) {
        await updateAutista(data.id, {
          nome: data.nome, telefono: data.telefono, stato: data.stato, note: data.note,
          assegnatiOggi: Number(data.assegnatiOggi||0),
          patenti: data.patenti, tags: data.tags, preferenze: data.preferenze, disp: data.disp,
        });
      } else {
        await createAutista(data);
      }
      setEditOpen(false); setNewOpen(false); setSel(null);
    } catch (err) {
      console.error("save autista failed", err);
      alert("Errore durante il salvataggio.");
    }
  };

  const askDelete = (id) => setDelAsk({ open:true, id });
  const doDelete = async () => {
    try { await removeAutista(delAsk.id); if (sel?.id===delAsk.id) setSel(null); }
    catch { alert("Errore durante l'eliminazione."); }
    finally { setDelAsk({ open:false, id:null }); }
  };

  const countDisponibili = autisti.filter(a=>a.stato==="disponibile").length;
  const countOccupati = autisti.filter(a=>a.stato==="occupato").length;
  const countOffline = autisti.filter(a=>a.stato==="offline").length;

  return (
    <div className="space-y-6">
      {!orgId && (
        <div className="rounded-lg border border-amber-300 bg-amber-500/10 text-amber-900 px-3 py-2 text-sm">
          Nessuna organizzazione corrente. Selezionala in <b>Impostazioni → Organizzazione</b>.
        </div>
      )}

      {orgId && !enabled && (
        <div className="rounded-lg border border-sky-300 bg-blue-500/10 text-sky-900 px-3 py-2 text-sm flex items-center gap-2">
          <FiDatabase />
          <div>
            <b>Funzione autisti disabilitata</b>: tabella <code>{TABLE}</code> non trovata in Supabase.
            Crea la tabella o importa lo schema per abilitare la pagina.
          </div>
        </div>
      )}

      {errorMsg && enabled && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 text-red-400 px-3 py-2 text-sm">
          {errorMsg}
        </div>
      )}

      {/* Heading */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Autisti</h1>
          <p className="text-sm text-slate-500">
            Gestisci disponibilità, competenze e turni — Disponibili: <b>{countDisponibili}</b> · Occupati: <b>{countOccupati}</b> · Offline: <b>{countOffline}</b>
          </p>
        </div>
        <button className="btn btn-primary" onClick={()=>setNewOpen(true)} disabled={!orgId || !enabled}>
          <FiPlus/> Nuovo autista
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <FiSearch className="absolute left-2 top-3 text-slate-500"/>
          <input
            type="text"
            placeholder="Cerca nome o telefono…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="h-10 w-full sm:w-64 pl-8 rounded-lg border border-[#243044] bg-[#1a2536] px-3 outline-none focus:ring-2 ring-blue-500/40"
          />
        </div>

        <div className="flex gap-1 rounded-lg border border-[#243044] p-1 bg-[#1a2536]">
          {["tutti","disponibile","occupato","offline"].map(v => (
            <button
              key={v}
              onClick={() => setFiltro(v)}
              className={`px-3 h-8 rounded-md text-sm ${filtro===v ? "bg-blue-600 text-white" : "hover:bg-[#141c27]"}`}
            >
              {v[0].toUpperCase()+v.slice(1)}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <span className="text-sm text-slate-500">Ordina per</span>
          <div className="relative">
            <FiChevronDown className="pointer-events-none absolute right-3 top-3 text-slate-500"/>
            <select
              value={order} onChange={e=>setOrder(e.target.value)}
              className="appearance-none pr-9 h-10 rounded-lg border border-[#243044] bg-[#1a2536] px-3 text-sm"
            >
              {ORDINI.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {loading && (
          <div className="col-span-full rounded-xl border border-dashed border-[#243044] p-8 text-center text-slate-500">
            Caricamento…
          </div>
        )}
        {!loading && filtered.map(a => (
          <div
            key={a.id}
            className="rounded-xl border border-[#243044] bg-[#1a2536] p-4"
          >
            <div className="flex items-center gap-3">
              <Avatar name={a.nome} />
              <div className="min-w-0">
                <div className="font-medium truncate">{a.nome}</div>
                <div className="text-sm text-slate-500 truncate">{a.telefono || "—"}</div>
              </div>
              <div className="ml-auto"><StatoPill stato={a.stato} /></div>
            </div>

            {!!(a.tags?.length) && (
              <div className="mt-3 flex flex-wrap gap-1">
                {a.tags.map(t=> <span key={t} className="chip chip-gray">{t}</span>)}
              </div>
            )}

            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <div className="text-slate-500">Assegnati oggi</div>
              <div className="text-right font-semibold">{a.assegnatiOggi ?? 0}</div>
              <div className="text-slate-500">Patenti</div>
              <div className="text-right">
                {arrayMode ? (a.patenti?.join(", ") || "—") : (a.patente || a.patenti?.join(", ") || "—")}
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <button className="btn btn-outline" onClick={()=>{ setSel(a); setEditOpen(true); }}><FiEdit2/> Modifica</button>
              <button className="btn btn-outline btn-outline-red" onClick={()=>setDelAsk({open:true,id:a.id})}><FiTrash2/> Elimina</button>

              <div className="ml-auto flex gap-2">
                {a.stato!=="disponibile" && (
                  <button className="btn btn-outline btn-outline-green" onClick={()=>changeStato(a.id,"disponibile")}><FiPlay/> Disponibile</button>
                )}
                {a.stato!=="occupato" && (
                  <button className="btn btn-outline btn-outline-indigo" onClick={()=>changeStato(a.id,"occupato")}><FiCheck/> Occupato</button>
                )}
                <button className="btn btn-outline" onClick={()=>togglePausa(a.id)}>
                  <FiPause/> {a.stato==="offline" ? "Rientra" : "Pausa"}
                </button>
              </div>
            </div>
          </div>
        ))}
        {!loading && filtered.length === 0 && (
          <div className="col-span-full rounded-xl border border-dashed border-[#243044] p-8 text-center text-slate-500">
            Nessun autista trovato.
          </div>
        )}
      </div>

      {/* Modali */}
      <EditAutistaModal
        open={newOpen}
        initial={null}
        onClose={()=>setNewOpen(false)}
        onSave={saveEdit}
        arrayMode={arrayMode}
      />
      <EditAutistaModal
        open={editOpen}
        initial={sel}
        onClose={()=>{ setEditOpen(false); setSel(null); }}
        onSave={saveEdit}
        arrayMode={arrayMode}
      />

      <Confirm
        open={delAsk.open}
        title="Eliminare autista?"
        message="Questa azione non può essere annullata."
        onCancel={()=>setDelAsk({open:false,id:null})}
        onConfirm={doDelete}
        confirmStyle="btn-danger"
        confirmLabel="Elimina"
      />
    </div>
  );
}