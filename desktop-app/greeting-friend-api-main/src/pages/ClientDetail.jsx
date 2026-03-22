/**
 * ClientDetail — Design L aligned
 * CRM completo: info, pipeline, tags, timeline/note, storico preventivi/trasporti/fatture
 *
 * Route: /clienti/:id
 */

import { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { useOrg } from "@/context/OrgContext";
import {
  FiArrowLeft, FiEdit, FiTrash2, FiPhone, FiMail, FiMapPin,
  FiFileText, FiTruck, FiCreditCard, FiPlus, FiRefreshCw,
  FiAlertCircle, FiX, FiCalendar, FiHash, FiClock, FiTag,
  FiMessageSquare, FiSend, FiChevronDown
} from "react-icons/fi";

/* ─── Helpers ─── */
const EUR = (v) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return "€ 0,00";
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(n);
};
const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString("it-IT", { day: "2-digit", month: "short", year: "numeric" }) : "—";
const fmtDateTime = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return `${d.toLocaleDateString("it-IT", { day: "2-digit", month: "short" })} ${d.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}`;
};

const statusColor = (s) => {
  const map = {
    accettato: "bg-emerald-500/10 text-emerald-400", fatturato: "bg-emerald-500/10 text-emerald-400",
    rifiutato: "bg-red-500/10 text-red-400", inviato: "bg-amber-500/10 text-amber-400",
    bozza: "bg-slate-500/10 text-slate-400", completato: "bg-emerald-500/10 text-emerald-400",
    "in corso": "bg-blue-500/10 text-blue-400", "da fare": "bg-amber-500/10 text-amber-400",
    new: "bg-blue-500/10 text-blue-400", cancelled: "bg-red-500/10 text-red-400",
    paid: "bg-emerald-500/10 text-emerald-400", pending: "bg-amber-500/10 text-amber-400",
  };
  return map[(s || "").toLowerCase()] || "bg-slate-500/10 text-slate-400";
};

const activityIcon = (type) => {
  const map = {
    note: FiMessageSquare, call: FiPhone, email: FiMail, visit: FiMapPin,
    quote_created: FiFileText, transport_created: FiTruck, invoice_created: FiCreditCard,
    status_change: FiRefreshCw, tag_added: FiTag, tag_removed: FiTag, pipeline_change: FiChevronDown,
  };
  return map[type] || FiClock;
};

const activityColor = (type) => {
  const map = {
    note: "text-blue-400 bg-blue-500/10", call: "text-emerald-400 bg-emerald-500/10",
    email: "text-purple-400 bg-purple-500/10", visit: "text-amber-400 bg-amber-500/10",
    quote_created: "text-blue-400 bg-blue-500/10", transport_created: "text-emerald-400 bg-emerald-500/10",
    invoice_created: "text-amber-400 bg-amber-500/10", pipeline_change: "text-purple-400 bg-purple-500/10",
    tag_added: "text-emerald-400 bg-emerald-500/10", tag_removed: "text-red-400 bg-red-500/10",
  };
  return map[type] || "text-slate-400 bg-slate-500/10";
};

export default function ClientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const supabase = supabaseBrowser();
  const { orgId } = useOrg();

  /* ─── State ─── */
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const [quotes, setQuotes] = useState([]);
  const [transports, setTransports] = useState([]);
  const [invoices, setInvoices] = useState([]);

  // CRM
  const [activities, setActivities] = useState([]);
  const [tags, setTags] = useState([]);           // all org tags
  const [clientTags, setClientTags] = useState([]); // assigned tag IDs
  const [pipelineStages, setPipelineStages] = useState([]);
  const [showTagDropdown, setShowTagDropdown] = useState(false);

  // New note form
  const [newNoteBody, setNewNoteBody] = useState("");
  const [newNoteType, setNewNoteType] = useState("note");
  const [savingNote, setSavingNote] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState("timeline");

  /* ─── Load ─── */
  useEffect(() => {
    if (orgId && id) loadAll();
  }, [orgId, id]); // eslint-disable-line

  async function loadAll() {
    try {
      setRefreshing(true);
      setError(null);

      const safe = (promise) => promise.then(r => r).catch(() => ({ data: [], error: null }));

      const [clientRes, quotesRes, transportsRes, invoicesRes, activitiesRes, tagsRes, assignmentsRes, stagesRes] = await Promise.all([
        supabase.from("clients").select("*").eq("id", id).eq("org_id", orgId).single(),
        safe(supabase.from("quotes").select("id, numero, data, importo, stato, client_id").eq("org_id", orgId).or(`client_id.eq.${id}`).order("data", { ascending: false }).limit(50)),
        safe(supabase.from("transports").select("id, created_at, pickup_address, dropoff_address, status, client_id").eq("org_id", orgId).eq("client_id", id).order("created_at", { ascending: false }).limit(50)),
        safe(supabase.from("invoices").select("id, number, date, total, payment_status").eq("org_id", orgId).eq("client_id", id).order("date", { ascending: false }).limit(50)),
        safe(supabase.from("client_activities").select("*").eq("client_id", id).eq("org_id", orgId).order("created_at", { ascending: false }).limit(100)),
        safe(supabase.from("client_tags").select("*").eq("org_id", orgId).order("name")),
        safe(supabase.from("client_tag_assignments").select("tag_id").eq("client_id", id)),
        safe(supabase.from("client_pipeline_stages").select("*").eq("org_id", orgId).order("position")),
      ]);

      if (clientRes.error) throw clientRes.error;

      const c = clientRes.data;
      setClient({
        id: c.id, nome: c.nome ?? c.name ?? "", cognome: c.surname ?? null,
        telefono: c.phone ?? null, email: c.email ?? null, piva: c.piva ?? c.vat ?? null,
        indirizzo: c.indirizzo ?? c.address ?? null, note: c.note ?? c.notes ?? null,
        number: c.number ?? null, codice: c.codice ?? null, isCompany: c.is_company ?? false,
        createdAt: c.created_at, pipelineStageId: c.pipeline_stage_id ?? null,
      });

      setQuotes(quotesRes.data || []);
      setTransports(transportsRes.data || []);
      setInvoices(invoicesRes.data || []);
      setActivities(activitiesRes.data || []);
      setTags(tagsRes.data || []);
      setClientTags((assignmentsRes.data || []).map(a => a.tag_id));
      setPipelineStages(stagesRes.data || []);
    } catch (err) {
      console.error("Errore caricamento dettaglio cliente:", err);
      setError("Errore caricamento dati cliente.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  /* ─── Pipeline change ─── */
  async function changePipelineStage(stageId) {
    const oldStage = pipelineStages.find(s => s.id === client.pipelineStageId);
    const newStage = pipelineStages.find(s => s.id === stageId);
    try {
      const { error: err } = await supabase.from("clients").update({ pipeline_stage_id: stageId }).eq("id", id).eq("org_id", orgId);
      if (err) throw err;
      setClient(prev => ({ ...prev, pipelineStageId: stageId }));
      // Log activity
      await supabase.from("client_activities").insert({
        org_id: orgId, client_id: id, user_id: (await supabase.auth.getUser()).data?.user?.id,
        type: "pipeline_change", title: `Pipeline: ${oldStage?.name || "—"} → ${newStage?.name || "—"}`,
        metadata: { old_stage: oldStage?.name, new_stage: newStage?.name },
      });
      loadAll();
    } catch (err) {
      console.error("Errore cambio pipeline:", err);
      setError("Errore aggiornamento pipeline.");
    }
  }

  /* ─── Tag toggle ─── */
  async function toggleTag(tagId) {
    const isAssigned = clientTags.includes(tagId);
    const tag = tags.find(t => t.id === tagId);
    try {
      if (isAssigned) {
        await supabase.from("client_tag_assignments").delete().eq("client_id", id).eq("tag_id", tagId);
        setClientTags(prev => prev.filter(t => t !== tagId));
        await supabase.from("client_activities").insert({
          org_id: orgId, client_id: id, user_id: (await supabase.auth.getUser()).data?.user?.id,
          type: "tag_removed", title: `Tag rimosso: ${tag?.name}`, metadata: { tag_name: tag?.name },
        });
      } else {
        await supabase.from("client_tag_assignments").insert({ client_id: id, tag_id: tagId });
        setClientTags(prev => [...prev, tagId]);
        await supabase.from("client_activities").insert({
          org_id: orgId, client_id: id, user_id: (await supabase.auth.getUser()).data?.user?.id,
          type: "tag_added", title: `Tag aggiunto: ${tag?.name}`, metadata: { tag_name: tag?.name },
        });
      }
    } catch (err) {
      console.error("Errore toggle tag:", err);
    }
  }

  /* ─── Add activity/note ─── */
  async function addNote() {
    if (!newNoteBody.trim()) return;
    setSavingNote(true);
    try {
      const { error: err } = await supabase.from("client_activities").insert({
        org_id: orgId, client_id: id,
        user_id: (await supabase.auth.getUser()).data?.user?.id,
        type: newNoteType, title: newNoteType === "note" ? "Nota" : newNoteType === "call" ? "Chiamata" : newNoteType === "email" ? "Email" : "Visita",
        body: newNoteBody.trim(),
      });
      if (err) throw err;
      setNewNoteBody("");
      loadAll();
    } catch (err) {
      console.error("Errore salvataggio nota:", err);
      setError("Errore salvataggio nota.");
    } finally {
      setSavingNote(false);
    }
  }

  /* ─── Delete ─── */
  async function handleDelete() {
    try {
      const { error: err } = await supabase.from("clients").delete().eq("id", id).eq("org_id", orgId);
      if (err) {
        if (err.code === "23503") setError("Impossibile eliminare: ci sono dati collegati.");
        else throw err;
      } else navigate("/clienti");
    } catch (err) {
      console.error("Errore eliminazione:", err);
      setError("Errore eliminazione cliente.");
    } finally {
      setShowDeleteConfirm(false);
    }
  }

  /* ─── KPI ─── */
  const stats = useMemo(() => {
    const qTotal = quotes.reduce((s, q) => s + Number(q.importo || 0), 0);
    const iTotal = invoices.reduce((s, i) => s + Number(i.total || 0), 0);
    const iPaid = invoices.filter(i => i.payment_status === "paid").reduce((s, i) => s + Number(i.total || 0), 0);
    return { quotesCount: quotes.length, quotesTotal: qTotal, transportsCount: transports.length, invoicesCount: invoices.length, invoicesTotal: iTotal, invoicesPaid: iPaid };
  }, [quotes, transports, invoices]);

  const clientCode = client?.number ? `CL${String(client.number).padStart(4, "0")}` : (client?.codice || client?.id?.slice(0, 8) || "");
  const company = client?.isCompany || (client?.piva && client.piva.trim());
  const currentStage = pipelineStages.find(s => s.id === client?.pipelineStageId);
  const assignedTags = tags.filter(t => clientTags.includes(t.id));

  /* ─── Loading skeleton ─── */
  if (loading) {
    return (
      <div className="space-y-5 animate-pulse">
        <div className="flex items-center gap-3"><div className="h-8 w-8 bg-[#243044] rounded-lg" /><div className="h-5 w-48 bg-[#243044] rounded" /></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="h-48 bg-[#1a2536] rounded-xl border border-[#243044]" />
          <div className="lg:col-span-2 h-48 bg-[#1a2536] rounded-xl border border-[#243044]" />
        </div>
        <div className="h-64 bg-[#1a2536] rounded-xl border border-[#243044]" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <FiAlertCircle className="w-10 h-10 text-slate-600 mb-3" />
        <p className="text-sm text-slate-400 mb-4">Cliente non trovato</p>
        <button onClick={() => navigate("/clienti")} className="h-8 px-3 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition">
          <FiArrowLeft className="w-3.5 h-3.5 inline mr-1" /> Torna alla lista
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/clienti")}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#243044] bg-[#1a2536] text-slate-400 hover:bg-[#1e2b3d] transition">
            <FiArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${
              company ? "bg-purple-500/15 text-purple-400" : "bg-blue-500/15 text-blue-400"
            }`}>
              {(client.nome || "?").charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-lg font-semibold text-slate-100">{client.nome}</h1>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span className="text-[10px] text-slate-500 font-mono">{clientCode}</span>
                <span className={`inline-flex px-1.5 py-px rounded text-[9px] font-medium ${
                  company ? "bg-purple-500/10 text-purple-400" : "bg-blue-500/10 text-blue-400"
                }`}>
                  {company ? "Azienda" : "Privato"}
                </span>
                {currentStage && (
                  <span className="inline-flex px-1.5 py-px rounded text-[9px] font-medium" style={{ backgroundColor: currentStage.color + "20", color: currentStage.color }}>
                    {currentStage.name}
                  </span>
                )}
                {assignedTags.map(tag => (
                  <span key={tag.id} className="inline-flex px-1.5 py-px rounded text-[9px] font-medium" style={{ backgroundColor: tag.color + "20", color: tag.color }}>
                    {tag.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={loadAll} disabled={refreshing}
            className="h-8 px-3 text-xs font-medium text-slate-400 bg-[#1a2536] border border-[#243044] rounded-lg hover:bg-[#1e2b3d] transition disabled:opacity-50">
            <FiRefreshCw className={`w-3.5 h-3.5 inline mr-1 ${refreshing ? "animate-spin" : ""}`} />
          </button>
          <button onClick={() => navigate(`/clienti/${id}/modifica`)}
            className="h-8 px-3 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition shadow-sm shadow-blue-600/20">
            <FiEdit className="w-3.5 h-3.5 inline mr-1" /> Modifica
          </button>
          <button onClick={() => setShowDeleteConfirm(true)}
            className="h-8 px-3 text-xs font-medium text-red-400 bg-[#1a2536] border border-red-500/20 rounded-lg hover:bg-red-500/10 transition">
            <FiTrash2 className="w-3.5 h-3.5 inline mr-1" /> Elimina
          </button>
        </div>
      </div>

      {/* ── Errore ── */}
      {error && (
        <div className="bg-red-500/5 rounded-xl border border-red-500/15 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <FiAlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span className="text-xs text-red-400 flex-1">{error}</span>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300"><FiX className="w-3 h-3" /></button>
          </div>
        </div>
      )}

      {/* ── Info + Pipeline + Tags + KPI ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Info card */}
        <div className="bg-[#1a2536] rounded-xl border border-[#243044] overflow-hidden">
          <div className="px-5 py-3 border-b border-[#243044]">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Informazioni</h3>
          </div>
          <div className="p-5 space-y-3">
            {client.telefono && (
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0"><FiPhone className="w-3.5 h-3.5 text-emerald-400" /></div>
                <div><div className="text-[10px] text-slate-500">Telefono</div><div className="text-xs text-slate-200">{client.telefono}</div></div>
              </div>
            )}
            {client.email && (
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0"><FiMail className="w-3.5 h-3.5 text-blue-400" /></div>
                <div><div className="text-[10px] text-slate-500">Email</div><div className="text-xs text-slate-200">{client.email}</div></div>
              </div>
            )}
            {client.piva && (
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0"><FiHash className="w-3.5 h-3.5 text-purple-400" /></div>
                <div><div className="text-[10px] text-slate-500">{company ? "P. IVA" : "Codice Fiscale"}</div><div className="text-xs text-slate-200 font-mono">{client.piva}</div></div>
              </div>
            )}
            {client.indirizzo && (
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0"><FiMapPin className="w-3.5 h-3.5 text-amber-400" /></div>
                <div><div className="text-[10px] text-slate-500">Indirizzo</div><div className="text-xs text-slate-200">{client.indirizzo}</div></div>
              </div>
            )}
            {client.createdAt && (
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-slate-500/10 flex items-center justify-center flex-shrink-0"><FiCalendar className="w-3.5 h-3.5 text-slate-400" /></div>
                <div><div className="text-[10px] text-slate-500">Registrato il</div><div className="text-xs text-slate-200">{fmtDate(client.createdAt)}</div></div>
              </div>
            )}
            {client.note && (
              <div className="mt-3 p-3 rounded-lg bg-[#141c27] border border-[#243044]">
                <div className="text-[10px] text-slate-500 mb-1">Note</div>
                <div className="text-xs text-slate-300 whitespace-pre-wrap">{client.note}</div>
              </div>
            )}
            {!client.telefono && !client.email && !client.piva && !client.indirizzo && (
              <div className="text-xs text-slate-600 text-center py-4">Nessuna informazione aggiuntiva</div>
            )}
          </div>
        </div>

        {/* KPI + Pipeline + Tags + Azioni */}
        <div className="lg:col-span-2 space-y-3">

          {/* Pipeline funnel */}
          {pipelineStages.length > 0 && (
            <div className="bg-[#1a2536] rounded-xl border border-[#243044] p-4">
              <h4 className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-3">Pipeline</h4>
              <div className="flex items-center gap-1">
                {pipelineStages.map(stage => {
                  const isActive = stage.id === client.pipelineStageId;
                  return (
                    <button key={stage.id} onClick={() => changePipelineStage(stage.id)}
                      className={`flex-1 h-8 rounded-lg text-[10px] font-medium transition border ${
                        isActive
                          ? "text-white border-transparent shadow-sm"
                          : "text-slate-500 border-[#243044] bg-[#141c27] hover:text-slate-300 hover:border-slate-600"
                      }`}
                      style={isActive ? { backgroundColor: stage.color, borderColor: stage.color } : {}}>
                      {stage.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tags */}
          <div className="bg-[#1a2536] rounded-xl border border-[#243044] p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Tags</h4>
              <div className="relative">
                <button onClick={() => setShowTagDropdown(!showTagDropdown)}
                  className="h-6 px-2 text-[10px] font-medium text-slate-400 bg-[#141c27] border border-[#243044] rounded-md hover:bg-[#1e2b3d] transition flex items-center gap-1">
                  <FiTag className="w-2.5 h-2.5" /> Gestisci
                </button>
                {showTagDropdown && (
                  <div className="absolute right-0 top-full mt-1 z-20 w-48 bg-[#141c27] border border-[#243044] rounded-lg shadow-xl overflow-hidden">
                    {tags.map(tag => {
                      const assigned = clientTags.includes(tag.id);
                      return (
                        <button key={tag.id} onClick={() => toggleTag(tag.id)}
                          className="w-full px-3 py-2 text-left hover:bg-[#1a2536] transition flex items-center gap-2 border-b border-[#243044] last:border-b-0">
                          <div className="w-3 h-3 rounded-sm border" style={{ borderColor: tag.color, backgroundColor: assigned ? tag.color : "transparent" }} />
                          <span className="text-xs text-slate-300">{tag.name}</span>
                        </button>
                      );
                    })}
                    {tags.length === 0 && <div className="px-3 py-2 text-[10px] text-slate-500">Nessun tag disponibile</div>}
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {assignedTags.length > 0 ? assignedTags.map(tag => (
                <span key={tag.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium cursor-pointer hover:opacity-80 transition"
                  style={{ backgroundColor: tag.color + "20", color: tag.color }}
                  onClick={() => toggleTag(tag.id)}>
                  {tag.name}
                  <FiX className="w-2.5 h-2.5" />
                </span>
              )) : (
                <span className="text-[10px] text-slate-600">Nessun tag assegnato</span>
              )}
            </div>
          </div>

          {/* KPI row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-[#1a2536] rounded-xl border border-[#243044] p-4 hover:border-blue-500/30 transition">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center mb-2"><FiFileText className="w-4 h-4 text-blue-400" /></div>
              <div className="text-xl font-semibold text-slate-100">{stats.quotesCount}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Preventivi</div>
              <div className="text-[10px] text-blue-400 mt-1">{EUR(stats.quotesTotal)}</div>
            </div>
            <div className="bg-[#1a2536] rounded-xl border border-[#243044] p-4 hover:border-emerald-500/30 transition">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-2"><FiTruck className="w-4 h-4 text-emerald-400" /></div>
              <div className="text-xl font-semibold text-slate-100">{stats.transportsCount}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Trasporti</div>
            </div>
            <div className="bg-[#1a2536] rounded-xl border border-[#243044] p-4 hover:border-amber-500/30 transition">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center mb-2"><FiCreditCard className="w-4 h-4 text-amber-400" /></div>
              <div className="text-xl font-semibold text-slate-100">{stats.invoicesCount}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Fatture</div>
              <div className="text-[10px] text-emerald-400 mt-1">{EUR(stats.invoicesPaid)} incassato</div>
            </div>
          </div>

          {/* Azioni rapide */}
          <div className="bg-[#1a2536] rounded-xl border border-[#243044] p-4">
            <h4 className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-3">Azioni Rapide</h4>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => navigate(`/preventivi/nuovo?clientId=${id}`)}
                className="h-7 px-3 text-[10px] font-medium text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-lg hover:bg-blue-500/15 transition">
                <FiPlus className="w-3 h-3 inline mr-1" /> Preventivo
              </button>
              <button onClick={() => navigate(`/trasporti/new?clientId=${id}`)}
                className="h-7 px-3 text-[10px] font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg hover:bg-emerald-500/15 transition">
                <FiPlus className="w-3 h-3 inline mr-1" /> Trasporto
              </button>
              <button onClick={() => navigate(`/fatture/new?clientId=${id}`)}
                className="h-7 px-3 text-[10px] font-medium text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg hover:bg-amber-500/15 transition">
                <FiPlus className="w-3 h-3 inline mr-1" /> Fattura
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="bg-[#1a2536] rounded-xl border border-[#243044] overflow-hidden">
        <div className="flex items-center border-b border-[#243044] px-1 overflow-x-auto">
          {[
            { key: "timeline", label: "Timeline", count: activities.length, icon: FiClock },
            { key: "preventivi", label: "Preventivi", count: stats.quotesCount, icon: FiFileText },
            { key: "trasporti", label: "Trasporti", count: stats.transportsCount, icon: FiTruck },
            { key: "fatture", label: "Fatture", count: stats.invoicesCount, icon: FiCreditCard },
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 transition whitespace-nowrap ${
                activeTab === tab.key ? "border-blue-500 text-blue-400" : "border-transparent text-slate-500 hover:text-slate-300"
              }`}>
              <tab.icon className="w-3 h-3" />
              {tab.label}
              {tab.count > 0 && (
                <span className={`ml-1 px-1.5 py-px rounded-full text-[9px] font-medium ${
                  activeTab === tab.key ? "bg-blue-500/15 text-blue-400" : "bg-[#243044] text-slate-500"
                }`}>{tab.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* Tab: Timeline */}
        {activeTab === "timeline" && (
          <div>
            {/* New note form */}
            <div className="p-4 border-b border-[#243044]">
              <div className="flex items-center gap-2 mb-2">
                {[
                  { val: "note", label: "Nota", icon: FiMessageSquare },
                  { val: "call", label: "Chiamata", icon: FiPhone },
                  { val: "email", label: "Email", icon: FiMail },
                  { val: "visit", label: "Visita", icon: FiMapPin },
                ].map(opt => (
                  <button key={opt.val} onClick={() => setNewNoteType(opt.val)}
                    className={`h-6 px-2 text-[10px] font-medium rounded-md transition flex items-center gap-1 ${
                      newNoteType === opt.val ? "bg-blue-600 text-white" : "bg-[#141c27] text-slate-500 border border-[#243044] hover:text-slate-300"
                    }`}>
                    <opt.icon className="w-2.5 h-2.5" /> {opt.label}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <textarea value={newNoteBody} onChange={e => setNewNoteBody(e.target.value)}
                  placeholder="Aggiungi una nota, registra una chiamata..."
                  rows={2}
                  className="flex-1 px-3 py-2 text-xs border border-[#243044] rounded-lg bg-[#141c27] text-slate-200 placeholder-slate-600 focus:ring-1 focus:ring-blue-500/30 outline-none transition resize-none" />
                <button onClick={addNote} disabled={savingNote || !newNoteBody.trim()}
                  className="self-end h-8 px-3 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition disabled:bg-[#243044] disabled:text-slate-500 disabled:cursor-not-allowed flex items-center gap-1">
                  <FiSend className="w-3 h-3" /> {savingNote ? "..." : "Invia"}
                </button>
              </div>
            </div>

            {/* Activity list */}
            {activities.length > 0 ? (
              <div className="divide-y divide-[#243044]/60">
                {activities.map(act => {
                  const Icon = activityIcon(act.type);
                  const colorCls = activityColor(act.type);
                  return (
                    <div key={act.id} className="px-4 py-3 flex gap-3">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${colorCls}`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-slate-200">{act.title || act.type}</span>
                          <span className="text-[10px] text-slate-600">{fmtDateTime(act.created_at)}</span>
                        </div>
                        {act.body && <div className="text-xs text-slate-400 mt-0.5 whitespace-pre-wrap">{act.body}</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center">
                <FiClock className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-xs text-slate-500">Nessuna attività registrata</p>
                <p className="text-[10px] text-slate-600 mt-1">Aggiungi una nota per iniziare la timeline</p>
              </div>
            )}
          </div>
        )}

        {/* Tab: Preventivi */}
        {activeTab === "preventivi" && (
          quotes.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="bg-[#141c27]">
                  <th className="px-4 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider text-left">Numero</th>
                  <th className="px-4 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider text-left">Data</th>
                  <th className="px-4 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider text-right">Importo</th>
                  <th className="px-4 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider text-left">Stato</th>
                </tr></thead>
                <tbody className="divide-y divide-[#243044]/60">
                  {quotes.map(q => (
                    <tr key={q.id} className="hover:bg-[#141c27]/60 transition-colors cursor-pointer" onClick={() => navigate(`/preventivi?id=${q.id}`)}>
                      <td className="px-4 py-2 text-xs font-medium text-slate-200">{q.numero || "—"}</td>
                      <td className="px-4 py-2 text-xs text-slate-400">{fmtDate(q.data)}</td>
                      <td className="px-4 py-2 text-xs text-right font-medium text-slate-200">{EUR(q.importo)}</td>
                      <td className="px-4 py-2"><span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium ${statusColor(q.stato)}`}>{q.stato || "bozza"}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center"><FiFileText className="w-8 h-8 text-slate-600 mx-auto mb-2" /><p className="text-xs text-slate-500">Nessun preventivo</p></div>
          )
        )}

        {/* Tab: Trasporti */}
        {activeTab === "trasporti" && (
          transports.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="bg-[#141c27]">
                  <th className="px-4 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider text-left">Data</th>
                  <th className="px-4 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider text-left">Ritiro</th>
                  <th className="px-4 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider text-left">Consegna</th>
                  <th className="px-4 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider text-left">Stato</th>
                </tr></thead>
                <tbody className="divide-y divide-[#243044]/60">
                  {transports.map(t => (
                    <tr key={t.id} className="hover:bg-[#141c27]/60 transition-colors cursor-pointer" onClick={() => navigate(`/trasporti/${t.id}`)}>
                      <td className="px-4 py-2 text-xs text-slate-400">{fmtDate(t.created_at)}</td>
                      <td className="px-4 py-2 text-xs text-slate-200 truncate max-w-[180px]">{t.pickup_address || "—"}</td>
                      <td className="px-4 py-2 text-xs text-slate-200 truncate max-w-[180px]">{t.dropoff_address || "—"}</td>
                      <td className="px-4 py-2"><span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium ${statusColor(t.status)}`}>{t.status || "new"}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center"><FiTruck className="w-8 h-8 text-slate-600 mx-auto mb-2" /><p className="text-xs text-slate-500">Nessun trasporto</p></div>
          )
        )}

        {/* Tab: Fatture */}
        {activeTab === "fatture" && (
          invoices.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="bg-[#141c27]">
                  <th className="px-4 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider text-left">Numero</th>
                  <th className="px-4 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider text-left">Data</th>
                  <th className="px-4 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider text-right">Totale</th>
                  <th className="px-4 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider text-left">Pagamento</th>
                </tr></thead>
                <tbody className="divide-y divide-[#243044]/60">
                  {invoices.map(inv => (
                    <tr key={inv.id} className="hover:bg-[#141c27]/60 transition-colors cursor-pointer" onClick={() => navigate(`/fatture/${inv.id}`)}>
                      <td className="px-4 py-2 text-xs font-medium text-slate-200">{inv.number || "—"}</td>
                      <td className="px-4 py-2 text-xs text-slate-400">{fmtDate(inv.date)}</td>
                      <td className="px-4 py-2 text-xs text-right font-medium text-slate-200">{EUR(inv.total)}</td>
                      <td className="px-4 py-2"><span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium ${statusColor(inv.payment_status)}`}>{inv.payment_status || "pending"}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center"><FiCreditCard className="w-8 h-8 text-slate-600 mx-auto mb-2" /><p className="text-xs text-slate-500">Nessuna fattura</p></div>
          )
        )}
      </div>

      {/* ── Dialog conferma eliminazione ── */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <button className="absolute inset-0 bg-black/60 backdrop-blur-sm border-none cursor-pointer"
            onClick={() => setShowDeleteConfirm(false)} aria-label="Chiudi" type="button" />
          <div className="relative w-full max-w-sm rounded-xl border border-[#243044] bg-[#1a2536] p-5">
            <div className="text-sm font-semibold text-slate-200 mb-1.5">Conferma eliminazione</div>
            <div className="text-xs text-slate-400 mb-5">
              Eliminare il cliente <strong className="text-slate-200">{client.nome}</strong>? L&apos;azione non può essere annullata.
            </div>
            <div className="flex justify-end gap-2">
              <button className="h-8 px-3 text-xs font-medium text-slate-400 bg-[#141c27] border border-[#243044] rounded-lg hover:bg-[#1e2b3d] transition"
                onClick={() => setShowDeleteConfirm(false)}>Annulla</button>
              <button className="h-8 px-3 text-xs font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition"
                onClick={handleDelete}>Elimina</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
