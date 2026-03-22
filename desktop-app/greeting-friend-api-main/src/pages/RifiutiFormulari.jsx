// src/pages/RifiutiFormulari.jsx
/**
 * Gestione Formulari Identificazione Rifiuti (FIR) — Design L
 */

import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useOrg } from "../context/OrgContext";
import {
  FiPlus, FiEdit, FiTrash2, FiSearch, FiFileText,
  FiCheckCircle, FiClock, FiXCircle, FiSend,
  FiRefreshCw, FiDownload, FiPrinter, FiEye,
  FiAlertCircle, FiChevronLeft, FiChevronRight, FiPackage
} from "react-icons/fi";
import { printFirList, printFirDetail } from "../lib/services/rentriPrintService";
import { useMultiSelect } from "../hooks/useMultiSelect";
import MultiSelectActions from "../components/ui/MultiSelectActions";
import SelectableCheckbox from "../components/ui/SelectableCheckbox";
import { supabaseBrowser } from "../lib/supabase-browser";
import FirmaFIRDialog from "../components/rentri/FirmaFIRDialog";

/* ─── Helpers ─── */
const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString("it-IT", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const StatoBadge = ({ stato }) => {
  const config = {
    bozza: { bg: "bg-slate-500/10", text: "text-slate-400", icon: FiClock, label: "Bozza" },
    trasmesso: { bg: "bg-blue-500/10", text: "text-blue-400", icon: FiSend, label: "Trasmesso" },
    accettato: { bg: "bg-sky-500/10", text: "text-sky-400", icon: FiCheckCircle, label: "Accettato" },
    firmato: { bg: "bg-purple-500/10", text: "text-purple-400", icon: FiCheckCircle, label: "Firmato" },
    rifiutato: { bg: "bg-red-500/10", text: "text-red-400", icon: FiXCircle, label: "Rifiutato" },
    annullato: { bg: "bg-slate-500/10", text: "text-slate-500", icon: FiXCircle, label: "Annullato" },
  };
  const c = config[stato] || config.bozza;
  const Icon = c.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${c.bg} ${c.text}`}>
      <Icon className="w-3 h-3" />
      {c.label}
    </span>
  );
};

const PAGE_SIZE = 25;

export default function RifiutiFormulari() {
  const { orgId } = useOrg();
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [filterStato, setFilterStato] = useState("all");
  const [filterAnno, setFilterAnno] = useState(new Date().getFullYear().toString());
  const [confirmId, setConfirmId] = useState(null);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const [printingFirId, setPrintingFirId] = useState(null);
  const [page, setPage] = useState(1);
  const [firmaDialog, setFirmaDialog] = useState(null); // { id, numero }

  async function handlePrintFir(firRow) {
    setPrintingFirId(firRow.id);
    try {
      const supabase = supabaseBrowser();
      const { data: firData, error } = await supabase
        .from("rentri_formulari")
        .select("*")
        .eq("id", firRow.id)
        .single();

      if (error) throw error;

      if (firData) {
        const firForPrint = { ...firData, codici_eer: firData.codici_eer || [] };
        await printFirDetail(firForPrint);
      }
    } catch (error) {
      console.error("Errore caricamento FIR per stampa:", error);
      alert("Errore durante il caricamento del FIR per la stampa");
    } finally {
      setPrintingFirId(null);
    }
  }

  useEffect(() => {
    if (orgId) loadData();
  }, [orgId]); // eslint-disable-line

  async function loadData() {
    setLoading(true);
    try {
      const supabase = supabaseBrowser();
      let query = supabase.from("rentri_formulari").select("*").eq("org_id", orgId);
      if (filterAnno !== "all") query = query.eq("anno", parseInt(filterAnno));
      if (filterStato !== "all") query = query.eq("stato", filterStato);
      const { data, error } = await query.order("data_creazione", { ascending: false });
      if (error) throw error;
      setRows(data || []);
    } catch (error) {
      console.error("Errore caricamento formulari:", error);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    if (!q.trim()) return rows;
    const needle = q.toLowerCase();
    return rows.filter((r) =>
      r.numero_fir?.toLowerCase().includes(needle) ||
      r.produttore_nome?.toLowerCase().includes(needle) ||
      r.trasportatore_nome?.toLowerCase().includes(needle) ||
      r.destinatario_nome?.toLowerCase().includes(needle)
    );
  }, [rows, q]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const {
    selectedCount, isSelected, isAllSelected, isSomeSelected,
    toggleSelect, toggleSelectAll, reset: resetSelection, getSelectedIds,
  } = useMultiSelect(filtered, (item) => item?.id);

  async function handleDelete(id) {
    try {
      const supabase = supabaseBrowser();
      const { error } = await supabase.from("rentri_formulari").delete().eq("id", id);
      if (error) throw error;
      setRows((prev) => prev.filter((r) => r.id !== id));
      setConfirmId(null);
    } catch (error) {
      console.error("Errore eliminazione:", error);
      alert("Errore durante l'eliminazione");
    }
  }

  async function handleBulkDelete() {
    try {
      const ids = getSelectedIds();
      const supabase = supabaseBrowser();
      const { error } = await supabase.from("rentri_formulari").delete().in("id", ids);
      if (error) throw error;
      setRows((prev) => prev.filter((r) => !ids.includes(r.id)));
      resetSelection();
      setConfirmBulkDelete(false);
    } catch (error) {
      console.error("Errore eliminazione multipla:", error);
      alert("Errore durante l'eliminazione");
    }
  }

  const anni = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => currentYear - i);
  }, []);

  /* ─── KPI ─── */
  const stats = useMemo(() => ({
    bozze: rows.filter(r => r.stato === "bozza").length,
    trasmessi: rows.filter(r => r.stato === "trasmesso").length,
    accettati: rows.filter(r => r.stato === "accettato").length,
    rifiutati: rows.filter(r => r.stato === "rifiutato").length,
  }), [rows]);

  /* ─── Loading skeleton ─── */
  if (loading) {
    return (
      <div className="space-y-5 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="h-6 w-48 bg-[#243044] rounded" />
          <div className="flex gap-2"><div className="h-8 w-24 bg-[#243044] rounded-lg" /><div className="h-8 w-28 bg-[#243044] rounded-lg" /></div>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {[1,2,3,4].map(i => <div key={i} className="h-20 bg-[#1a2536] rounded-xl border border-[#243044]" />)}
        </div>
        <div className="h-64 bg-[#1a2536] rounded-xl border border-[#243044]" />
      </div>
    );
  }

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/rifiuti")}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#243044] bg-[#1a2536] text-slate-400 hover:bg-[#1e2b3d] transition">
            <FiChevronLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-slate-100">Formulari (FIR)</h1>
            <p className="text-[10px] text-slate-500 mt-0.5">Formulari di Identificazione Rifiuti</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={loadData}
            className="h-8 px-3 text-xs font-medium text-slate-400 bg-[#1a2536] border border-[#243044] rounded-lg hover:bg-[#1e2b3d] transition">
            <FiRefreshCw className="w-3.5 h-3.5 inline mr-1" /> Aggiorna
          </button>
          <button onClick={() => printFirList(filtered, { anno: filterAnno !== "all" ? filterAnno : null, stato: filterStato !== "all" ? filterStato : null })}
            disabled={filtered.length === 0}
            className="h-8 px-3 text-xs font-medium text-slate-300 bg-[#1a2536] border border-[#243044] rounded-lg hover:bg-[#1e2b3d] transition disabled:opacity-50 disabled:cursor-not-allowed">
            <FiPrinter className="w-3.5 h-3.5 inline mr-1" /> Stampa
          </button>
          <button onClick={() => navigate("/rifiuti/xfir")}
            className="h-8 px-3 text-xs font-medium text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 rounded-lg hover:bg-cyan-500/20 transition">
            xFIR Digitali →
          </button>
          <button onClick={() => navigate("/rifiuti/formulari/nuovo")}
            className="h-8 px-3 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition shadow-sm shadow-blue-600/20">
            <FiPlus className="w-3.5 h-3.5 inline mr-1" /> Nuovo FIR
          </button>
        </div>
      </div>

      {/* ── Gestione Blocchi FIR ── */}
      <div className="bg-gradient-to-br from-blue-500/10 to-sky-500/10 rounded-xl border border-blue-500/20 p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
              <FiPackage className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-100 mb-1">
                Blocchi FIR per Vidimazione
              </h3>
              <p className="text-xs text-slate-400 mb-3">
                Acquista blocchi di formulari cartacei da vidimare. Ogni blocco contiene 25-100 FIR numerati ufficialmente da RENTRI.
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate("/rifiuti/xfir?tab=blocchi")}
                  className="h-8 px-3 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition shadow-sm shadow-blue-600/20"
                >
                  <FiPackage className="w-3.5 h-3.5 inline mr-1" />
                  Gestisci Blocchi FIR
                </button>
                <button
                  onClick={() => navigate("/rifiuti/xfir?tab=vidimazione")}
                  className="h-8 px-3 text-xs font-medium text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-lg hover:bg-blue-500/20 transition"
                >
                  Vidima Formulario
                </button>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-500 mb-1">Info</div>
            <div className="text-[10px] text-slate-600">
              I blocchi FIR si richiedono<br />
              tramite il portale RENTRI
            </div>
          </div>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-[#1a2536] rounded-xl border border-[#243044] p-4 hover:border-slate-500/30 transition">
          <div className="w-8 h-8 rounded-lg bg-slate-500/10 flex items-center justify-center mb-2">
            <FiClock className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-xl font-semibold text-slate-100">{stats.bozze}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Bozze</div>
        </div>
        <div className="bg-[#1a2536] rounded-xl border border-[#243044] p-4 hover:border-blue-500/30 transition">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center mb-2">
            <FiSend className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-xl font-semibold text-slate-100">{stats.trasmessi}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Trasmessi</div>
        </div>
        <div className="bg-[#1a2536] rounded-xl border border-[#243044] p-4 hover:border-sky-500/30 transition">
          <div className="w-8 h-8 rounded-lg bg-sky-500/10 flex items-center justify-center mb-2">
            <FiCheckCircle className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-xl font-semibold text-slate-100">{stats.accettati}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Accettati</div>
        </div>
        <div className="bg-[#1a2536] rounded-xl border border-[#243044] p-4 hover:border-red-500/30 transition">
          <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center mb-2">
            <FiXCircle className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-xl font-semibold text-slate-100">{stats.rifiutati}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Rifiutati</div>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="bg-[#1a2536] rounded-xl border border-[#243044] p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-2 relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <input type="text" placeholder="Cerca per numero, produttore, trasportatore..."
              value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2 text-xs bg-[#141c27] border border-[#243044] rounded-lg text-slate-200 placeholder-slate-600 focus:ring-1 focus:ring-blue-500/30 outline-none transition" />
          </div>
          <select value={filterAnno} onChange={(e) => { setFilterAnno(e.target.value); setPage(1); }}
            className="px-3 py-2 text-xs bg-[#141c27] border border-[#243044] rounded-lg text-slate-200 focus:ring-1 focus:ring-blue-500/30 outline-none transition">
            <option value="all">Tutti gli anni</option>
            {anni.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <select value={filterStato} onChange={(e) => { setFilterStato(e.target.value); setPage(1); }}
            className="px-3 py-2 text-xs bg-[#141c27] border border-[#243044] rounded-lg text-slate-200 focus:ring-1 focus:ring-blue-500/30 outline-none transition">
            <option value="all">Tutti gli stati</option>
            <option value="bozza">Bozza</option>
            <option value="trasmesso">Trasmesso</option>
            <option value="accettato">Accettato</option>
            <option value="rifiutato">Rifiutato</option>
            <option value="annullato">Annullato</option>
          </select>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="bg-[#1a2536] rounded-xl border border-[#243044] overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-8 text-center">
            <FiFileText className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-xs text-slate-500 mb-1">Nessun formulario trovato</p>
            <p className="text-[10px] text-slate-600 mb-4">Crea il primo FIR per documentare il trasporto di rifiuti</p>
            <button onClick={() => navigate("/rifiuti/formulari/nuovo")}
              className="h-8 px-3 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition">
              <FiPlus className="w-3.5 h-3.5 inline mr-1" /> Crea Primo FIR
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#141c27]">
                    <th className="px-4 py-2.5 text-left w-10">
                      <SelectableCheckbox checked={isAllSelected} indeterminate={isSomeSelected} onChange={toggleSelectAll} />
                    </th>
                    <th className="px-4 py-2.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider text-left">Numero FIR</th>
                    <th className="px-4 py-2.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider text-left">Data</th>
                    <th className="px-4 py-2.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider text-left">Produttore</th>
                    <th className="px-4 py-2.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider text-left">Destinatario</th>
                    <th className="px-4 py-2.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider text-left">Stato</th>
                    <th className="px-4 py-2.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider text-right">Azioni</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#243044]/60">
                  {paged.map((row) => (
                    <tr key={row.id} className="hover:bg-[#141c27]/60 transition-colors">
                      <td className="px-4 py-2.5" onClick={(e) => e.stopPropagation()}>
                        <SelectableCheckbox checked={isSelected(row)} onChange={() => toggleSelect(row)} />
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="text-xs font-medium text-slate-200">{row.numero_fir || "Bozza"}</div>
                        {row.rentri_numero && <div className="text-[10px] text-blue-400 mt-0.5">RENTRI: {row.rentri_numero}</div>}
                      </td>
                      <td className="px-4 py-2.5 text-xs text-slate-400">{fmtDate(row.data_creazione)}</td>
                      <td className="px-4 py-2.5">
                        <div className="text-xs text-slate-300">{row.produttore_nome || "—"}</div>
                        {row.produttore_cf && <div className="text-[10px] text-slate-500 mt-0.5 font-mono">{row.produttore_cf}</div>}
                      </td>
                      <td className="px-4 py-2.5 text-xs text-slate-300">{row.destinatario_nome || "—"}</td>
                      <td className="px-4 py-2.5"><StatoBadge stato={row.stato} /></td>
                      <td className="px-4 py-2.5 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => navigate(`/rifiuti/formulari/${row.id}`)}
                            className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-[#243044] transition" title="Visualizza">
                            <FiEye className="w-3.5 h-3.5 text-slate-500" />
                          </button>
                          {row.stato === "bozza" && (
                            <button onClick={() => navigate(`/rifiuti/formulari/${row.id}`)}
                              className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-blue-500/10 transition" title="Modifica">
                              <FiEdit className="w-3.5 h-3.5 text-blue-400" />
                            </button>
                          )}
                          {row.stato === "bozza" && (
                            <button onClick={() => navigate(`/rifiuti/formulari/${row.id}`)}
                              className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-blue-500/10 transition" title="Trasmetti a RENTRI">
                              <FiSend className="w-3.5 h-3.5 text-blue-400" />
                            </button>
                          )}
                          {(row.stato === "trasmesso" || row.stato === "accettato" || row.stato === "in_lavorazione") && (
                            <button
                              onClick={(e) => { e.stopPropagation(); setFirmaDialog({ id: row.id, numero: row.rentri_numero || row.id }); }}
                              className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-blue-500/10 transition" title="Firma FIR">
                              <FiEdit className="w-3.5 h-3.5 text-blue-400" />
                            </button>
                          )}
                          <button onClick={() => handlePrintFir(row)} disabled={printingFirId === row.id}
                            className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-blue-500/10 transition disabled:opacity-50" title="Stampa FIR">
                            {printingFirId === row.id
                              ? <FiRefreshCw className="w-3.5 h-3.5 text-blue-400 animate-spin" />
                              : <FiPrinter className="w-3.5 h-3.5 text-blue-400" />}
                          </button>
                          {row.pdf_url && (
                            <button onClick={() => window.open(row.pdf_url, "_blank")}
                              className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-[#243044] transition" title="Scarica PDF">
                              <FiDownload className="w-3.5 h-3.5 text-slate-500" />
                            </button>
                          )}
                          {(row.stato === "bozza" || row.stato === "rifiutato" || row.stato === "annullato") && (
                            <button onClick={() => setConfirmId(row.id)}
                              className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-red-500/10 transition" title="Elimina">
                              <FiTrash2 className="w-3.5 h-3.5 text-red-400" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-[#243044]">
                <span className="text-[10px] text-slate-500">{filtered.length} formulari &middot; Pagina {page}/{totalPages}</span>
                <div className="flex items-center gap-1">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    className="w-7 h-7 flex items-center justify-center rounded-md border border-[#243044] bg-[#141c27] text-slate-400 hover:bg-[#1e2b3d] transition disabled:opacity-30">
                    <FiChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                    className="w-7 h-7 flex items-center justify-center rounded-md border border-[#243044] bg-[#141c27] text-slate-400 hover:bg-[#1e2b3d] transition disabled:opacity-30">
                    <FiChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Multi-select Actions ── */}
      {selectedCount > 0 && (
        <MultiSelectActions
          selectedCount={selectedCount}
          onBulkDelete={() => setConfirmBulkDelete(true)}
          onClearSelection={resetSelection}
          actions={[
            {
              label: "Stampa PDF",
              icon: <FiPrinter className="w-3.5 h-3.5" />,
              onClick: () => {
                const ids = getSelectedIds();
                const selected = filtered.filter(r => ids.includes(r.id));
                printFirList(selected, {});
              },
            },
            {
              label: "Trasmetti a RENTRI",
              icon: <FiSend className="w-3.5 h-3.5" />,
              onClick: () => {
                const ids = getSelectedIds();
                const nonBozze = filtered.filter(r => ids.includes(r.id) && r.stato !== "bozza");
                if (nonBozze.length > 0) {
                  alert(`${nonBozze.length} FIR non sono in stato bozza e non possono essere trasmessi.`);
                  return;
                }
                alert(`Trasmissione di ${ids.length} FIR a RENTRI — funzionalità in sviluppo.`);
              },
              variant: "success",
            },
          ]}
        />
      )}

      {/* ── Delete Confirmation ── */}
      {confirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <button className="absolute inset-0 bg-black/60 backdrop-blur-sm border-none cursor-pointer"
            onClick={() => setConfirmId(null)} aria-label="Chiudi" type="button" />
          <div className="relative w-full max-w-sm rounded-xl border border-[#243044] bg-[#1a2536] p-5">
            <div className="text-sm font-semibold text-slate-200 mb-1.5">Conferma Eliminazione</div>
            <div className="text-xs text-slate-400 mb-3">Sei sicuro di voler eliminare questo formulario?</div>
            <div className="bg-amber-500/5 border border-amber-500/15 rounded-lg px-3 py-2 mb-5">
              <div className="flex items-start gap-2">
                <FiAlertCircle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                <span className="text-[10px] text-amber-400">Se il FIR è già stato trasmesso a RENTRI, rimarrà nel sistema RENTRI.</span>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setConfirmId(null)}
                className="h-8 px-3 text-xs font-medium text-slate-400 bg-[#141c27] border border-[#243044] rounded-lg hover:bg-[#1e2b3d] transition">
                Annulla
              </button>
              <button onClick={() => handleDelete(confirmId)}
                className="h-8 px-3 text-xs font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition">
                Elimina
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Bulk Delete Confirmation ── */}
      {confirmBulkDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <button className="absolute inset-0 bg-black/60 backdrop-blur-sm border-none cursor-pointer"
            onClick={() => setConfirmBulkDelete(false)} aria-label="Chiudi" type="button" />
          <div className="relative w-full max-w-sm rounded-xl border border-[#243044] bg-[#1a2536] p-5">
            <div className="text-sm font-semibold text-slate-200 mb-1.5">Elimina {selectedCount} Formulari</div>
            <div className="text-xs text-slate-400 mb-5">
              Sei sicuro di voler eliminare {selectedCount} formulari selezionati? L&apos;azione è irreversibile.
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setConfirmBulkDelete(false)}
                className="h-8 px-3 text-xs font-medium text-slate-400 bg-[#141c27] border border-[#243044] rounded-lg hover:bg-[#1e2b3d] transition">
                Annulla
              </button>
              <button onClick={handleBulkDelete}
                className="h-8 px-3 text-xs font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition">
                Elimina Tutto
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Firma FIR Dialog ── */}
      {firmaDialog && (
        <FirmaFIRDialog
          firId={firmaDialog.id}
          firNumero={firmaDialog.numero}
          onClose={() => setFirmaDialog(null)}
          onSuccess={() => { setFirmaDialog(null); loadData(); }}
        />
      )}
    </div>
  );
}
