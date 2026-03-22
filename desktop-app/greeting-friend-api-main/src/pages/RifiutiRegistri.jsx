// src/pages/RifiutiRegistri.jsx
/**
 * Gestione Registri Cronologici RENTRI
 * Design L aligned
 */

import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useOrg } from "../context/OrgContext";
import {
  FiPlus, FiEdit2, FiEye, FiTrash2, FiSearch,
  FiFileText, FiCheckCircle, FiClock, FiAlertCircle,
  FiRefreshCw, FiDownload, FiSend, FiPrinter, FiX, FiZap,
  FiMoreVertical, FiInfo
} from "react-icons/fi";
import { printRegistriList } from "../lib/services/rentriPrintService";
import { useMultiSelect } from "../hooks/useMultiSelect";
import MultiSelectActions from "../components/ui/MultiSelectActions";
import SelectableCheckbox from "../components/ui/SelectableCheckbox";
import { supabaseBrowser } from "../lib/supabase-browser";

/* ─── Constants ─── */
const STATI = [
  { value: "all",      label: "Tutti" },
  { value: "bozza",    label: "Bozza",    cls: "bg-slate-500/10 text-slate-400 border-slate-500/20" },
  { value: "attivo",   label: "Attivo",   cls: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  { value: "vidimato", label: "Vidimato", cls: "bg-teal-500/10 text-teal-400 border-teal-500/20" },
  { value: "chiuso",   label: "Chiuso",   cls: "bg-slate-500/10 text-slate-500 border-slate-500/20" },
];
const STATO_MAP = Object.fromEntries(STATI.filter(s => s.value !== "all").map(s => [s.value, s]));

const TIPO_LABELS = {
  carico: "Carico",
  scarico: "Scarico",
  carico_scarico: "Carico e Scarico",
};

export default function RifiutiRegistri() {
  const { orgId } = useOrg();
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [filterStato, setFilterStato] = useState("all");
  const [filterAnno, setFilterAnno] = useState(new Date().getFullYear().toString());
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [creatingRentriId, setCreatingRentriId] = useState(null);
  const [trasmettendo, setTrasmettendo] = useState(false);
  const [creatingTest, setCreatingTest] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState(false);

  // Toast banner
  const [toast, setToast] = useState(null);
  const showToast = useCallback((type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 5000);
  }, []);

  useEffect(() => {
    if (orgId) loadData();
  }, [orgId]); // eslint-disable-line

  async function loadData() {
    setLoading(true);
    try {
      const supabase = supabaseBrowser();
      let query = supabase.from("rentri_registri").select("*").eq("org_id", orgId);
      if (filterAnno !== "all") query = query.eq("anno", parseInt(filterAnno));
      if (filterStato !== "all") query = query.eq("stato", filterStato);
      const { data, error } = await query.order("created_at", { ascending: false });
      if (error) throw error;
      setRows(data || []);
    } catch (err) {
      console.error("Errore caricamento registri:", err);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    if (!q.trim()) return rows;
    const needle = q.toLowerCase();
    return rows.filter(r =>
      r.numero_registro?.toLowerCase().includes(needle) ||
      r.tipo?.toLowerCase().includes(needle) ||
      r.unita_locale?.toLowerCase().includes(needle)
    );
  }, [rows, q]);

  const {
    selectedCount, isSelected, isAllSelected, isSomeSelected,
    toggleSelect, toggleSelectAll, reset: resetSelection, getSelectedIds,
  } = useMultiSelect(filtered, (item) => item?.id);

  // Stats
  const statoCounts = useMemo(() => {
    const c = {};
    for (const r of rows) c[r.stato] = (c[r.stato] || 0) + 1;
    return c;
  }, [rows]);

  async function handleDelete() {
    if (!confirmDelete) return;
    try {
      const supabase = supabaseBrowser();
      const { error } = await supabase.from("rentri_registri").delete().eq("id", confirmDelete.id);
      if (error) throw error;
      setRows(prev => prev.filter(r => r.id !== confirmDelete.id));
      setConfirmDelete(null);
      showToast("success", "Registro eliminato.");
    } catch (err) {
      console.error("Errore eliminazione:", err);
      showToast("error", "Errore durante l'eliminazione.");
    }
  }

  async function handleBulkDelete() {
    try {
      const ids = getSelectedIds();
      const supabase = supabaseBrowser();
      const { error } = await supabase.from("rentri_registri").delete().in("id", ids);
      if (error) throw error;
      setRows(prev => prev.filter(r => !ids.includes(r.id)));
      resetSelection();
      setConfirmBulkDelete(false);
      showToast("success", `${ids.length} registri eliminati.`);
    } catch (err) {
      console.error("Errore eliminazione multipla:", err);
      showToast("error", "Errore durante l'eliminazione.");
    }
  }

  async function handleSyncFromRentri() {
    if (!orgId) return;
    setSyncing(true);
    try {
      const supabase = supabaseBrowser();
      const { data: cert } = await supabase
        .from("rentri_org_certificates").select("num_iscr_sito")
        .eq("org_id", orgId).eq("environment", "demo").eq("is_active", true).eq("is_default", true)
        .maybeSingle();
      if (!cert?.num_iscr_sito) {
        showToast("error", "Certificato RENTRI non trovato. Configura il certificato prima di sincronizzare.");
        return;
      }
      const apiUrl = import.meta.env.VITE_RENTRI_API_URL || 'https://rentri-test.rescuemanager.eu/api/rentri';
      const response = await fetch(`${apiUrl}/registri/sync`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ org_id: orgId, num_iscr_sito: cert.num_iscr_sito }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Errore sincronizzazione');
      await loadData();
      const errMsg = result.errori?.length > 0 ? ` (${result.errori.length} errori)` : '';
      showToast("success", `Sincronizzati ${result.registri_sincronizzati || 0} registri da RENTRI.${errMsg}`);
    } catch (err) {
      console.error("Errore sincronizzazione:", err);
      showToast("error", `Errore sincronizzazione: ${err.message}`);
    } finally {
      setSyncing(false);
    }
  }

  async function handleTrasmettiSelezionati() {
    const ids = getSelectedIds();
    if (ids.length === 0) return;
    setTrasmettendo(true);
    let ok = 0;
    let fail = 0;
    try {
      const supabase = supabaseBrowser();
      for (const registroId of ids) {
        try {
          const localRentriId = `DEMO-${Date.now()}-${registroId.slice(0, 8)}`;
          const { error } = await supabase
            .from('rentri_registri')
            .update({ stato: 'attivo', rentri_id: localRentriId })
            .eq('id', registroId)
            .eq('org_id', orgId);
          if (error) { fail++; } else { ok++; }
        } catch { fail++; }
      }
      await loadData();
      resetSelection();
      showToast(fail === 0 ? 'success' : 'error',
        `Trasmessi: ${ok}${fail > 0 ? ` · Errori: ${fail}` : ''}`);
    } catch (err) {
      showToast('error', `Errore: ${err.message}`);
    } finally {
      setTrasmettendo(false);
    }
  }

  async function handleCreateTestRegistro() {
    if (!orgId) return;
    setCreatingTest(true);
    try {
      const supabase = supabaseBrowser();
      const anno = new Date().getFullYear();
      const payload = {
        org_id: orgId,
        anno,
        tipo: 'carico_scarico',
        numero_registro: `TEST-${anno}-${String(Date.now()).slice(-4)}`,
        unita_locale: 'Sede Principale',
        unita_locale_indirizzo: 'Via Test 1',
        unita_locale_comune: 'Milano',
        unita_locale_provincia: 'MI',
        unita_locale_cap: '20100',
        autorizzazione: 'AUT-TEST-2025-001',
        stato: 'bozza',
        attivita: ['Produzione'],
        descrizione: 'Registro test carico/scarico rifiuti autodemolizione',
        note: 'Registro creato automaticamente per test',
        environment: 'demo',
      };
      const { error } = await supabase.from('rentri_registri').insert(payload);
      if (error) throw error;
      await loadData();
      showToast('success', 'Registro di test creato!');
    } catch (err) {
      showToast('error', 'Errore creazione test: ' + err.message);
    } finally {
      setCreatingTest(false);
    }
  }

  async function handleCreateOnRentri(registroId) {
    if (!orgId) return;
    setCreatingRentriId(registroId);
    try {
      const apiUrl = import.meta.env.VITE_RENTRI_API_URL || 'https://rentri-test.rescuemanager.eu/api/rentri';
      const response = await fetch(`${apiUrl}/registri/create`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ org_id: orgId, registro_id: registroId }),
      });
      const result = await response.json();
      if (!response.ok) {
        const msg = result.error || result.details?.detail || 'Errore RENTRI';
        const status = result.status || response.status;
        if (status === 404 || status === 422) {
          showToast("info", `API RENTRI non ancora disponibile in demo (${status}). Il registro è salvato localmente.`);
        } else {
          showToast("error", `Errore RENTRI ${status}: ${msg}`);
        }
        return;
      }
      await loadData();
      showToast("success", `Registro creato su RENTRI (ID: ${result.rentri_id})`);
    } catch (err) {
      console.error("Errore creazione registro su RENTRI:", err);
      showToast("error", `Errore di rete: ${err.message}`);
    } finally {
      setCreatingRentriId(null);
    }
  }

  const anni = useMemo(() => {
    const y = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => y - i);
  }, []);

  /* ─── Skeleton ─── */
  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="flex items-center justify-between">
          <div><div className="h-5 w-48 bg-[#243044] rounded mb-1.5" /><div className="h-3 w-64 bg-[#1a2536] rounded" /></div>
          <div className="flex gap-2"><div className="h-8 w-24 bg-[#1a2536] rounded-lg" /><div className="h-8 w-32 bg-[#1a2536] rounded-lg" /></div>
        </div>
        <div className="h-10 bg-[#1a2536] rounded-xl border border-[#243044]" />
        <div className="grid grid-cols-4 gap-3">{[1,2,3,4].map(i => <div key={i} className="h-16 bg-[#1a2536] rounded-xl border border-[#243044]" />)}</div>
        <div className="h-64 bg-[#1a2536] rounded-xl border border-[#243044]" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Toast */}
      {toast && (
        <div className={`flex items-center justify-between px-4 py-2.5 rounded-lg border text-xs font-medium transition-all ${
          toast.type === "success" ? "bg-sky-500/8 border-sky-500/15 text-sky-400" :
          toast.type === "error" ? "bg-red-500/8 border-red-500/15 text-red-400" :
          "bg-blue-500/8 border-blue-500/15 text-blue-400"
        }`}>
          <div className="flex items-center gap-2">
            {toast.type === "success" ? <FiCheckCircle className="w-3.5 h-3.5" /> : <FiAlertCircle className="w-3.5 h-3.5" />}
            {toast.msg}
          </div>
          <button onClick={() => setToast(null)} className="p-0.5 hover:opacity-70"><FiX className="w-3 h-3" /></button>
        </div>
      )}

      {/* Header — pulito */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-100">Registri Cronologici</h1>
          <p className="text-xs text-slate-500 mt-0.5">{rows.length} registri · {rows.filter(r => r.rentri_id).length} su RENTRI</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate("/rifiuti/registri/nuovo")} className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
            <FiPlus className="w-3.5 h-3.5" />Nuovo
          </button>
          <div className="relative">
            <button onClick={() => setShowActionsMenu(!showActionsMenu)} className="inline-flex items-center px-2.5 py-1.5 text-xs text-slate-400 bg-[#1a2536] border border-[#243044] rounded-lg hover:bg-[#243044] hover:text-slate-200 transition-colors">
              <FiMoreVertical className="w-3.5 h-3.5" />
            </button>
            {showActionsMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowActionsMenu(false)} />
                <div className="absolute right-0 top-full mt-1 w-52 bg-[#1e2d42] border border-[#2d3f56] rounded-lg shadow-xl z-50 py-1">
                  <button onClick={() => { handleSyncFromRentri(); setShowActionsMenu(false); }} disabled={syncing} className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-slate-300 hover:bg-[#243044] transition-colors disabled:opacity-50">
                    <FiDownload className="w-3.5 h-3.5 text-slate-500" />{syncing ? 'Sincronizzazione...' : 'Sincronizza da RENTRI'}
                  </button>
                  <button onClick={() => { printRegistriList(filtered, { anno: filterAnno !== "all" ? filterAnno : null, stato: filterStato !== "all" ? filterStato : null }); setShowActionsMenu(false); }} disabled={filtered.length === 0} className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-slate-300 hover:bg-[#243044] transition-colors disabled:opacity-40">
                    <FiPrinter className="w-3.5 h-3.5 text-slate-500" />Stampa lista
                  </button>
                  <div className="border-t border-[#2d3f56] my-1" />
                  <button onClick={() => { handleCreateTestRegistro(); setShowActionsMenu(false); }} disabled={creatingTest} className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-slate-300 hover:bg-[#243044] transition-colors disabled:opacity-50">
                    <FiZap className="w-3.5 h-3.5 text-amber-500" />{creatingTest ? 'Creazione...' : 'Crea registro test'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-2.5 px-3.5 py-2.5 bg-blue-500/5 border border-blue-500/10 rounded-lg">
        <FiInfo className="w-3.5 h-3.5 text-blue-400 mt-0.5 shrink-0" />
        <p className="text-[11px] text-slate-400">
          Ogni registro deve essere prima <span className="font-medium text-slate-300">creato su RENTRI</span> prima di poter trasmettere i movimenti. 
          I registri già su RENTRI <span className="font-medium text-slate-300">non sono modificabili né eliminabili</span> — eventuali correzioni vanno fatte dal portale RENTRI.
        </p>
      </div>

      {/* Filtri compatti */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Cerca numero, tipo, unità locale..." className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#141c27] border border-[#243044] rounded-lg text-slate-200 placeholder-slate-600 focus:ring-1 focus:ring-blue-500/30 outline-none" />
        </div>
        <select value={filterAnno} onChange={e => { setFilterAnno(e.target.value); setTimeout(loadData, 0); }} className="px-2.5 py-1.5 text-xs bg-[#141c27] border border-[#243044] rounded-lg text-slate-300 focus:ring-1 focus:ring-blue-500/30 outline-none">
          <option value="all">Tutti gli anni</option>
          {anni.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <div className="flex items-center gap-1 border-l border-[#243044] pl-2 ml-1">
          {STATI.map(s => (
            <button key={s.value} onClick={() => { setFilterStato(s.value); setTimeout(loadData, 0); }} className={`px-2 py-1 text-[10px] font-medium rounded-md transition-colors ${
              filterStato === s.value ? 'bg-blue-500/10 text-blue-400' : 'text-slate-500 hover:text-slate-300'
            }`}>
              {s.label}{statoCounts[s.value] ? ` (${statoCounts[s.value]})` : s.value === "all" ? ` (${rows.length})` : ''}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="bg-[#1a2536]/50 rounded-xl border border-[#243044] p-10 text-center">
          <FiFileText className="w-8 h-8 text-slate-600 mx-auto mb-3" />
          <p className="text-xs text-slate-400 mb-1">{rows.length === 0 ? "Nessun registro configurato" : "Nessun risultato per i filtri attivi"}</p>
          <p className="text-[11px] text-slate-600 mb-4">{rows.length === 0 ? "Crea il primo registro cronologico o sincronizza da RENTRI." : "Prova a cambiare i filtri."}</p>
          {rows.length === 0 && (
            <button onClick={() => navigate("/rifiuti/registri/nuovo")} className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
              <FiPlus className="w-3.5 h-3.5" />Crea Primo Registro
            </button>
          )}
        </div>
      ) : (
        <div className="bg-[#1a2536]/50 rounded-xl border border-[#243044] overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[#243044]">
                <th className="px-3 py-2.5 text-left w-8">
                  <SelectableCheckbox checked={isAllSelected} indeterminate={isSomeSelected} onChange={toggleSelectAll} />
                </th>
                <th className="px-3 py-2.5 text-left text-[10px] font-medium text-slate-500 uppercase tracking-wider">Registro</th>
                <th className="px-3 py-2.5 text-left text-[10px] font-medium text-slate-500 uppercase tracking-wider">Tipo</th>
                <th className="px-3 py-2.5 text-left text-[10px] font-medium text-slate-500 uppercase tracking-wider">Unità Locale</th>
                <th className="px-3 py-2.5 text-left text-[10px] font-medium text-slate-500 uppercase tracking-wider">Stato</th>
                <th className="px-3 py-2.5 text-left text-[10px] font-medium text-slate-500 uppercase tracking-wider">RENTRI</th>
                <th className="w-24" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[#243044]/20">
              {filtered.map(row => {
                const statoInfo = STATO_MAP[row.stato] || STATO_MAP.bozza;
                const isOnRentri = !!row.rentri_id;
                return (
                  <tr key={row.id} className="group hover:bg-[#141c27]/40 transition-colors cursor-pointer" onClick={() => navigate(`/rifiuti/registri/${row.id}`)}>
                    <td className="px-3 py-2" onClick={e => e.stopPropagation()}>
                      <SelectableCheckbox checked={isSelected(row)} onChange={() => toggleSelect(row)} />
                    </td>
                    <td className="px-3 py-2">
                      <div className="font-medium text-slate-200">{row.anno} / {row.numero_registro || "—"}</div>
                      <div className="text-[10px] text-slate-600 mt-0.5">{new Date(row.created_at).toLocaleDateString("it-IT")}</div>
                    </td>
                    <td className="px-3 py-2 text-slate-400">{TIPO_LABELS[row.tipo] || row.tipo}</td>
                    <td className="px-3 py-2 text-slate-400 truncate max-w-[200px]">{row.unita_locale || "—"}</td>
                    <td className="px-3 py-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border ${statoInfo.cls}`}>{statoInfo.label}</span>
                    </td>
                    <td className="px-3 py-2">
                      {isOnRentri ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium text-sky-400 bg-sky-500/8">
                          <FiCheckCircle className="w-3 h-3" />Su RENTRI
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium text-slate-500 bg-slate-500/8">
                          <FiClock className="w-3 h-3" />Locale
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!isOnRentri && (
                          <button onClick={() => handleCreateOnRentri(row.id)} disabled={creatingRentriId === row.id} className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-blue-400 hover:bg-blue-500/10 rounded-md transition-colors disabled:opacity-50" title="Crea su RENTRI">
                            {creatingRentriId === row.id ? <FiRefreshCw className="w-3 h-3 animate-spin" /> : <FiSend className="w-3 h-3" />}
                          </button>
                        )}
                        <button onClick={() => navigate(`/rifiuti/registri/${row.id}`)} className="p-1.5 text-slate-500 hover:text-blue-400 transition-colors" title={isOnRentri ? "Visualizza" : "Modifica"}>
                          {isOnRentri ? <FiEye className="w-3.5 h-3.5" /> : <FiEdit2 className="w-3.5 h-3.5" />}
                        </button>
                        {!isOnRentri && (
                          <button onClick={() => setConfirmDelete(row)} className="p-1.5 text-slate-500 hover:text-red-400 transition-colors" title="Elimina">
                            <FiTrash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Multi-select Actions */}
      {selectedCount > 0 && (
        <MultiSelectActions
          selectedCount={selectedCount}
          onBulkDelete={() => setConfirmBulkDelete(true)}
          onClearSelection={resetSelection}
          actions={[
            {
              label: trasmettendo ? 'Trasmissione...' : `Trasmetti a RENTRI (${selectedCount})`,
              onClick: handleTrasmettiSelezionati,
              variant: 'success',
            },
          ]}
        />
      )}

      {/* Confirm Delete */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 grid place-items-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setConfirmDelete(null)} />
          <div className="relative w-full max-w-sm rounded-xl border border-[#243044] bg-[#1a2536] p-4">
            <div className="font-medium text-sm text-slate-200 mb-2">Elimina registro</div>
            <div className="text-xs text-slate-400 mb-1">Stai per eliminare:</div>
            <div className="text-xs text-slate-200 font-mono bg-[#141c27] rounded-lg px-3 py-2 mb-4">{confirmDelete.anno} / {confirmDelete.numero_registro || "N/A"}</div>
            <div className="flex justify-end gap-2">
              <button className="px-3 py-1.5 text-xs text-slate-300 bg-[#141c27] border border-[#243044] rounded-lg hover:bg-[#243044] transition-colors" onClick={() => setConfirmDelete(null)}>Annulla</button>
              <button className="px-3 py-1.5 text-xs text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors" onClick={handleDelete}>Elimina</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Bulk Delete */}
      {confirmBulkDelete && (
        <div className="fixed inset-0 z-50 grid place-items-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setConfirmBulkDelete(false)} />
          <div className="relative w-full max-w-sm rounded-xl border border-[#243044] bg-[#1a2536] p-4">
            <div className="font-medium text-sm text-slate-200 mb-2">Elimina {selectedCount} registri</div>
            <div className="text-xs text-slate-400 mb-4">Sei sicuro? L'azione è irreversibile.</div>
            <div className="flex justify-end gap-2">
              <button className="px-3 py-1.5 text-xs text-slate-300 bg-[#141c27] border border-[#243044] rounded-lg hover:bg-[#243044] transition-colors" onClick={() => setConfirmBulkDelete(false)}>Annulla</button>
              <button className="px-3 py-1.5 text-xs text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors" onClick={handleBulkDelete}>Elimina Tutto</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

