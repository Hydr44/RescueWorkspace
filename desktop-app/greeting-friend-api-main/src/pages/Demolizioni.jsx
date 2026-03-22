// src/pages/Demolizioni.jsx
import { useEffect, useMemo, useState } from "react";
import {
  FiPlus, FiSearch, FiFileText,
  FiEdit2, FiTrash2, FiRefreshCcw
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { useOrg } from "@/context/OrgContext";

const TABLE = "demolition_cases";

/* ============== Helpers ============== */
const MONEY = (cents) =>
  typeof cents === "number" ? (cents / 100).toFixed(2) + "€" : "—";

const SELECT_COLS = [
  "id","org_id","client_id","transport_id",
  "targa","telaio","marca_modello","anno","stato",
  "invoice_id","invoice_total_cents","invoice_currency",
  "invoice_number","invoice_date",
  "meta",
  "created_at","updated_at"
].join(",");

// per il mock, manteniamo una shape sensata
const EMPTY_META = {
  owner: {
    name: "", birth_date: "", cf: "",
    id_doc_type: "CI", id_doc_number: "", id_doc_issue_date: "", id_doc_expiry_date: "",
    address: "", city: "", province: "", cap: "", phone: ""
  },
  owner_docs: { ci_file_url: "", cf_file_url: "" },
  qualifica: "intestatario",
  attestazione_url: "",
  vehicle_extra: { type: "", engine_code: "" },
  docs: {
    carta_circolazione: { stato: "none", file_url: "" },
    certificato_proprieta: { stato: "none", file_url: "" }
  }
};

/* ============== Conferma ============== */
function Confirm({ open, title, onCancel, onConfirm }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <div className="relative w-full max-w-md rounded-xl border border-[#243044]  bg-[#1a2536]  p-4">
        <div className="font-semibold mb-2">{title}</div>
        <div className="flex justify-end gap-2">
          <button className="btn btn-outline" onClick={onCancel}>Annulla</button>
          <button className="btn btn-danger" onClick={onConfirm}><FiTrash2/> Elimina</button>
        </div>
      </div>
    </div>
  );
}

/* ============== Pagina lista ============== */
export default function Demolizioni() {
  const supabase = supabaseBrowser();
  const { orgId } = useOrg();
  const navigate = useNavigate();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState(true);
  const [q, setQ] = useState("");
  const [stato, setStato] = useState("tutti");

  const [askDel, setAskDel] = useState({ open:false, id:null });

  async function fetchAll() {
    if (!orgId) { setRows([]); setLoading(false); return; }
    try {
      setLoading(true);
      const { data, error, status } = await supabase
        .from(TABLE)
        .select(SELECT_COLS)
        .eq("org_id", orgId)
        .order("created_at", { ascending: false });
      if (error) throw Object.assign(error, { status });
      setRows(data || []);
      setEnabled(true);
    } catch (e) {
      const msg = String(e?.message || "");
      if (e?.status === 404 || msg.includes("relation") || msg.includes("not exist")) {
        // fallback mock se tabella non esiste
        setEnabled(false);
        setRows([
          {
            id: "mock-1",
            org_id: orgId,
            targa: "AB123CD",
            telaio: "WVWZZZ1JZXW000001",
            marca_modello: "Fiat Panda",
            stato: "documenti",
            invoice_number: "FAT-12/2025",
            invoice_date: "2025-10-01",
            invoice_id: null,
            invoice_total_cents: 9000,
            meta: { ...EMPTY_META },
            created_at: new Date().toISOString(),
          },
          {
            id: "mock-2",
            org_id: orgId,
            targa: "FG456HI",
            telaio: "VF1AAAAA555000002",
            marca_modello: "Renault Clio",
            stato: "bozza",
            invoice_number: null,
            invoice_id: "int-uuid-1",
            invoice_total_cents: 15000,
            meta: { ...EMPTY_META },
            created_at: new Date(Date.now()-86400000).toISOString(),
          },
        ]);
      } else {
        console.error("fetch demolitions failed", e);
        alert("Errore caricando le demolizioni");
      }
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
    return () => { try { supabase.removeChannel(ch); } catch {} };
    // eslint-disable-next-line
  }, [orgId, enabled]);

  const filtered = useMemo(() => {
    let l = [...rows];
    if (stato !== "tutti") l = l.filter(r => r.stato === stato);
    if (q.trim()) {
      const s = q.toLowerCase();
      l = l.filter(r =>
        (r.targa || "").toLowerCase().includes(s) ||
        (r.telaio || "").toLowerCase().includes(s) ||
        (r.marca_modello || "").toLowerCase().includes(s)
      );
    }
    return l;
  }, [rows, stato, q]);

  /* ---------- CRUD local helpers ---------- */
  const onRemoved = (id) => setRows(prev => prev.filter(r => r.id !== id));
  const askDelete = (id) => setAskDel({ open:true, id });
  const doDelete = async () => {
    try {
      if (!enabled) {
        onRemoved(askDel.id);
      } else {
        const { error } = await supabase
          .from(TABLE)
          .delete()
          .eq("id", askDel.id)
          .eq("org_id", orgId);
        if (error) throw error;
        onRemoved(askDel.id);
      }
    } catch (e) {
      console.error("delete demolition_case failed", e);
      alert("Eliminazione non riuscita.");
    } finally {
      setAskDel({ open:false, id:null });
    }
  };

  return (
    <div className="space-y-4">
      {/* Header con gradiente */}
      <div className="rounded-xl border border-[#243044]  bg-[#1a2536] p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-slate-100">
              Demolizioni
            </h1>
            {!enabled && (
              <p className="text-xs text-amber-400 mt-2">
                Modalità mock (crea la tabella <code>demolition_cases</code> e la colonna <code>meta</code> per attivare il live)
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button className="btn btn-outline inline-flex items-center gap-2 h-10" onClick={fetchAll}>
              <FiRefreshCcw className="h-4 w-4"/> Ricarica
            </button>
            <button
              className="btn btn-primary inline-flex items-center gap-2 h-10"
              onClick={() => navigate("/demolizioni/new")}
            >
              <FiPlus className="h-4 w-4"/> Nuova pratica
            </button>
          </div>
        </div>
      </div>

      {/* Filtri moderni */}
      <div className="rounded-xl border border-[#243044]  bg-[#1a2536]  p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[280px]">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 h-4 w-4"/>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cerca targa, telaio, modello…"
            className="pl-10 pr-4 h-11 w-full rounded-lg border border-[#243044]  bg-[#1a2536]  outline-none focus:ring-2 ring-indigo-500 text-sm transition-shadow"
          />
        </div>
        <select
          value={stato}
          onChange={(e)=>setStato(e.target.value)}
          className="h-11 rounded-lg border border-[#243044]  bg-[#1a2536]  px-4 text-sm outline-none focus:ring-2 ring-indigo-500 transition-shadow"
        >
          {["tutti","bozza","documenti","inviata","completata","scartata"].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
        </select>
      </div>

      {/* Tabella */}
      <div className="rounded-xl border border-[#243044]  bg-[#1a2536]  overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#141c27]/50">
            <tr>
              <th className="text-left px-4 py-2">Veicolo</th>
              <th className="text-left px-4 py-2">Targa</th>
              <th className="text-left px-4 py-2">Telaio</th>
              <th className="text-left px-4 py-2">Stato</th>
              <th className="text-left px-4 py-2">Fattura</th>
              <th className="text-left px-4 py-2">Importo</th>
              <th className="text-right px-4 py-2">Azioni</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#243044] ">
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-500">Caricamento…</td></tr>
            ) : filtered.length ? filtered.map(r => (
              <tr key={r.id}>
                <td className="px-4 py-2">{r.marca_modello || "—"}</td>
                <td className="px-4 py-2">{r.targa || "—"}</td>
                <td className="px-4 py-2">{r.telaio || "—"}</td>
                <td className="px-4 py-2">
                  <span className={`chip ${
                    r.stato === "completata" ? "chip-emerald" :
                    r.stato === "inviata" ? "chip-indigo" :
                    r.stato === "documenti" ? "chip-amber" :
                    r.stato === "scartata" ? "chip-red" : "chip-gray"
                  }`}>{r.stato}</span>
                </td>
                <td className="px-4 py-2">
                  {r.invoice_id
                    ? <span className="inline-flex items-center gap-1"><FiFileText/> Collegata</span>
                    : (r.invoice_number
                        ? <span>#{r.invoice_number} {r.invoice_date ? `(${r.invoice_date})` : ""}</span>
                        : <span className="text-slate-500">—</span>
                      )
                  }
                </td>
                <td className="px-4 py-2">{MONEY(r.invoice_total_cents)}</td>
                <td className="px-4 py-2 text-right">
                  <div className="inline-flex gap-2">
                    <button
                      className="btn btn-outline"
                      onClick={()=> navigate(`/demolizioni/${r.id}`)}
                    >
                      <FiEdit2/> Modifica
                    </button>
                    <button
                      className="btn btn-outline btn-outline-red"
                      onClick={()=>askDelete(r.id)}
                    >
                      <FiTrash2/> Elimina
                    </button>
                  </div>
                </td>
              </tr>
            )) : (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-500">Nessuna pratica.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Confirm
        open={askDel.open}
        title="Eliminare la pratica di demolizione?"
        onCancel={()=>setAskDel({ open:false, id:null })}
        onConfirm={doDelete}
      />
    </div>
  );
}