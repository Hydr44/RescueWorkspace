/**
 * ChartOfAccounts — Piano dei Conti
 * Design compatto con raggruppamento per categoria, ricerca, form modale
 *
 * @author haxies
 * @created 2025
 */

import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { useOrg } from "@/context/OrgContext";
import {
  FiPlus, FiEdit2, FiTrash2, FiRefreshCcw, FiLock,
  FiSearch, FiChevronDown, FiChevronRight, FiBookOpen, FiDatabase
} from "react-icons/fi";
import { initChartOfAccounts } from "@/lib/accounting";

/* ---------- Helpers ---------- */
const inputCls = "w-full px-3 py-2 text-sm border border-[#243044] rounded-lg focus:ring-1 focus:ring-blue-500/40 outline-none transition-colors bg-[#141c27] text-slate-200 placeholder-slate-600";
const CATEGORIES = [
  { value: "asset",     label: "Attività",         cls: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  { value: "liability", label: "Passività",        cls: "bg-red-500/10 text-red-400 border-red-500/20" },
  { value: "equity",    label: "Patrimonio Netto", cls: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
  { value: "revenue",   label: "Ricavi",           cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  { value: "expense",   label: "Costi",            cls: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
];
const CAT_MAP = Object.fromEntries(CATEGORIES.map(c => [c.value, c]));

export default function ChartOfAccounts() {
  const supabase = supabaseBrowser();
  const { orgId } = useOrg();
  const navigate = useNavigate();

  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("all");
  const [expandedCats, setExpandedCats] = useState(new Set(CATEGORIES.map(c => c.value)));

  // Confirm dialogs
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [showInitConfirm, setShowInitConfirm] = useState(false);

  useEffect(() => { if (orgId) loadAccounts(); }, [orgId]); // eslint-disable-line

  async function loadAccounts() {
    try {
      setLoading(true);
      const { data, error } = await supabase.from("chart_of_accounts").select("*").eq("org_id", orgId).order("code");
      if (error) throw error;
      setAccounts(data || []);
    } catch (err) {
      console.error("Errore caricamento conti:", err);
    } finally {
      setLoading(false);
    }
  }

  async function doInit() {
    try {
      setShowInitConfirm(false);
      await initChartOfAccounts(orgId);
      await loadAccounts();
    } catch (err) {
      console.error("Errore inizializzazione conti:", err);
    }
  }

  async function doDelete() {
    if (!confirmDelete) return;
    try {
      const { error } = await supabase.from("chart_of_accounts").delete().eq("id", confirmDelete.id);
      if (error) throw error;
      setConfirmDelete(null);
      await loadAccounts();
    } catch (err) {
      console.error("Errore eliminazione:", err);
    }
  }

  function toggleCat(cat) {
    setExpandedCats(prev => { const n = new Set(prev); n.has(cat) ? n.delete(cat) : n.add(cat); return n; });
  }

  // Filtered + grouped
  const filtered = useMemo(() => {
    let list = accounts;
    if (filterCat !== "all") list = list.filter(a => a.category === filterCat);
    if (search.trim()) {
      const s = search.toLowerCase();
      list = list.filter(a => a.code?.toLowerCase().includes(s) || a.name?.toLowerCase().includes(s) || a.subcategory?.toLowerCase().includes(s));
    }
    return list;
  }, [accounts, filterCat, search]);

  const grouped = useMemo(() => {
    const g = {};
    for (const cat of CATEGORIES) g[cat.value] = [];
    for (const a of filtered) { const key = a.category || "asset"; if (!g[key]) g[key] = []; g[key].push(a); }
    return g;
  }, [filtered]);

  const catCounts = useMemo(() => {
    const c = {};
    for (const a of accounts) { c[a.category || "asset"] = (c[a.category || "asset"] || 0) + 1; }
    return c;
  }, [accounts]);

  /* Loading */
  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-10 bg-[#1a2536] rounded-xl border border-[#243044]" />
        <div className="h-10 bg-[#1a2536] rounded-xl border border-[#243044]" />
        {[1, 2, 3].map(i => <div key={i} className="h-20 bg-[#1a2536] rounded-xl border border-[#243044]" />)}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 rounded-lg"><FiBookOpen className="w-5 h-5 text-emerald-400" /></div>
          <div>
            <h1 className="text-lg font-semibold text-slate-100">Piano dei Conti</h1>
            <p className="text-xs text-slate-500">{accounts.length} conti configurati</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowInitConfirm(true)} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg font-medium transition-colors bg-[#1a2536] text-slate-300 border border-[#243044] hover:bg-[#243044]">
            <FiDatabase className="w-3.5 h-3.5" />Inizializza
          </button>
          <button onClick={() => navigate("/contabilita/piano-conti/nuovo")} className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs rounded-lg font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors">
            <FiPlus className="w-3.5 h-3.5" />Nuovo Conto
          </button>
        </div>
      </div>

      {/* Search + Filter tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cerca codice o nome..." className={`${inputCls} pl-9 w-full`} />
        </div>
        <div className="flex items-center gap-1 flex-wrap">
          <button onClick={() => setFilterCat("all")} className={`px-2.5 py-1 text-[10px] font-medium rounded-lg border transition-colors ${filterCat === "all" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" : "bg-[#1a2536] text-slate-400 border-[#243044] hover:bg-[#243044]"}`}>
            Tutti ({accounts.length})
          </button>
          {CATEGORIES.map(cat => (
            <button key={cat.value} onClick={() => setFilterCat(cat.value)} className={`px-2.5 py-1 text-[10px] font-medium rounded-lg border transition-colors ${filterCat === cat.value ? cat.cls : "bg-[#1a2536] text-slate-400 border-[#243044] hover:bg-[#243044]"}`}>
              {cat.label} ({catCounts[cat.value] || 0})
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {filtered.length === 0 ? (
        <div className="bg-[#1a2536] rounded-xl border border-[#243044] p-10 text-center">
          <FiBookOpen className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-sm text-slate-400 mb-1">{accounts.length === 0 ? "Nessun conto configurato" : "Nessun risultato"}</p>
          <p className="text-xs text-slate-600 mb-4">{accounts.length === 0 ? "Inizializza i conti predefiniti per autodemolizioni." : "Prova a cambiare i filtri."}</p>
          {accounts.length === 0 && (
            <button onClick={() => setShowInitConfirm(true)} className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors">
              <FiRefreshCcw className="w-3.5 h-3.5" />Inizializza Conti Predefiniti
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {CATEGORIES.filter(cat => filterCat === "all" || filterCat === cat.value).map(cat => {
            const items = grouped[cat.value] || [];
            if (items.length === 0) return null;
            const isOpen = expandedCats.has(cat.value);
            const catInfo = CAT_MAP[cat.value];
            return (
              <div key={cat.value} className="bg-[#1a2536] rounded-xl border border-[#243044] overflow-hidden">
                <button onClick={() => toggleCat(cat.value)} className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#141c27]/50 transition-colors text-left">
                  <div className="flex items-center gap-2.5">
                    {isOpen ? <FiChevronDown className="w-3.5 h-3.5 text-slate-500" /> : <FiChevronRight className="w-3.5 h-3.5 text-slate-500" />}
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border ${catInfo.cls}`}>{catInfo.label}</span>
                    <span className="text-xs text-slate-500">{items.length} conti</span>
                  </div>
                </button>
                {isOpen && (
                  <div className="border-t border-[#243044]">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[#243044]/50">
                          <th className="text-left px-4 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider w-24">Codice</th>
                          <th className="text-left px-4 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Nome Conto</th>
                          <th className="text-left px-4 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider w-40">Sottocategoria</th>
                          <th className="text-center px-4 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider w-20">Stato</th>
                          <th className="w-20" />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#243044]/30">
                        {items.map(a => (
                          <tr key={a.id} className="group hover:bg-[#141c27]/30 transition-colors">
                            <td className="px-4 py-2">
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono text-xs font-medium text-slate-200">{a.code}</span>
                                {a.is_system && <FiLock className="w-2.5 h-2.5 text-slate-600" title="Sistema" />}
                              </div>
                            </td>
                            <td className="px-4 py-2 text-sm text-slate-200">{a.name}</td>
                            <td className="px-4 py-2 text-xs text-slate-500">{a.subcategory || "—"}</td>
                            <td className="px-4 py-2 text-center">
                              <span className={`inline-flex px-1.5 py-0.5 text-[10px] font-medium rounded ${a.is_active ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-500/10 text-slate-500"}`}>
                                {a.is_active ? "Attivo" : "Off"}
                              </span>
                            </td>
                            <td className="px-4 py-2">
                              <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => navigate(`/contabilita/piano-conti/${a.id}/modifica`)} disabled={a.is_system} className="p-1 text-slate-500 hover:text-blue-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors" title="Modifica">
                                  <FiEdit2 className="w-3 h-3" />
                                </button>
                                <button onClick={() => !a.is_system && setConfirmDelete(a)} disabled={a.is_system} className="p-1 text-slate-500 hover:text-red-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors" title="Elimina">
                                  <FiTrash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Confirm Delete */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 grid place-items-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setConfirmDelete(null)} />
          <div className="relative w-full max-w-sm rounded-xl border border-[#243044] bg-[#1a2536] p-4">
            <div className="font-medium text-sm mb-2">Elimina conto</div>
            <div className="text-xs text-slate-400 mb-1">Stai per eliminare:</div>
            <div className="text-xs text-slate-200 font-mono bg-[#141c27] rounded-lg px-3 py-2 mb-4">{confirmDelete.code} — {confirmDelete.name}</div>
            <div className="flex justify-end gap-2">
              <button className="px-3 py-1.5 text-xs text-slate-300 bg-[#141c27] border border-[#243044] rounded-lg hover:bg-[#243044] transition-colors" onClick={() => setConfirmDelete(null)}>Annulla</button>
              <button className="px-3 py-1.5 text-xs text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors" onClick={doDelete}>Elimina</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Init */}
      {showInitConfirm && (
        <div className="fixed inset-0 z-50 grid place-items-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowInitConfirm(false)} />
          <div className="relative w-full max-w-sm rounded-xl border border-[#243044] bg-[#1a2536] p-4">
            <div className="font-medium text-sm mb-2">Inizializza Conti Predefiniti</div>
            <div className="text-xs text-slate-400 mb-4">Verranno aggiunti i conti standard per autodemolizioni. I conti esistenti non verranno modificati.</div>
            <div className="flex justify-end gap-2">
              <button className="px-3 py-1.5 text-xs text-slate-300 bg-[#141c27] border border-[#243044] rounded-lg hover:bg-[#243044] transition-colors" onClick={() => setShowInitConfirm(false)}>Annulla</button>
              <button className="px-3 py-1.5 text-xs text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors" onClick={doInit}>Inizializza</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
