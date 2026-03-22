/**
 * AccountingEntries — Design L aligned
 * Movimenti contabili in partita doppia
 *
 * @author haxies
 * @created 2025
 */

import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { useOrg } from "@/context/OrgContext";
import {
  FiPlus, FiSearch, FiRefreshCw, FiDownload, FiFileText, FiEdit,
  FiTrash2, FiCheckCircle, FiXCircle, FiCalendar,
  FiAlertCircle, FiX, FiChevronLeft, FiChevronRight
} from "react-icons/fi";

/* ─── Helpers ─── */
const EUR = (v) => (Number.isFinite(Number(v)) ? Number(v).toFixed(2) + " €" : "—");
const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit", year: "2-digit" }) : "—";
const isoToday = () => new Date().toISOString().split("T")[0];

export default function AccountingEntries() {
  const navigate = useNavigate();
  const supabase = supabaseBrowser();
  const { orgId } = useOrg();

  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [accountFilter, setAccountFilter] = useState("");
  const [accounts, setAccounts] = useState([]);
  const [exporting, setExporting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  // Paginazione
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 30;

  // Carica dati
  useEffect(() => {
    if (orgId) { loadEntries(); loadAccounts(); }
  }, [orgId]); // eslint-disable-line

  async function loadEntries() {
    try {
      setRefreshing(true);
      setError(null);
      let query = supabase
        .from("accounting_entries")
        .select("*")
        .eq("org_id", orgId)
        .order("accounting_date", { ascending: false })
        .order("created_at", { ascending: false });

      if (dateFrom) query = query.gte("accounting_date", dateFrom);
      if (dateTo) query = query.lte("accounting_date", dateTo);
      if (accountFilter) query = query.eq("account_code", accountFilter);

      const { data, error: err } = await query;
      if (err) throw err;
      setEntries(data || []);
    } catch (err) {
      console.error("Errore caricamento movimenti:", err);
      setError("Errore caricamento movimenti.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function loadAccounts() {
    try {
      const { data, error: err } = await supabase
        .from("chart_of_accounts").select("*").eq("org_id", orgId).eq("is_active", true).order("code");
      if (err) throw err;
      setAccounts(data || []);
    } catch (err) { console.error("Errore caricamento conti:", err); }
  }

  // Filtra
  const filteredEntries = useMemo(() => {
    if (!searchTerm) return entries;
    const t = searchTerm.toLowerCase();
    return entries.filter(e =>
      e.description?.toLowerCase().includes(t) ||
      e.reference?.toLowerCase().includes(t) ||
      e.account_code?.toLowerCase().includes(t) ||
      e.account_name?.toLowerCase().includes(t)
    );
  }, [entries, searchTerm]);

  // Totali
  const totals = useMemo(() => {
    const totalDebit = filteredEntries.reduce((s, e) => s + Number(e.debit_amount || 0), 0);
    const totalCredit = filteredEntries.reduce((s, e) => s + Number(e.credit_amount || 0), 0);
    const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;
    return { totalDebit, totalCredit, isBalanced, difference: totalDebit - totalCredit };
  }, [filteredEntries]);

  // Paginazione
  const totalPages = Math.ceil(filteredEntries.length / itemsPerPage);
  const paginatedEntries = filteredEntries.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Elimina
  async function deleteEntry(id) {
    try {
      const { error: err } = await supabase.from("accounting_entries").delete().eq("id", id);
      if (err) throw err;
      setShowDeleteConfirm(null);
      loadEntries();
    } catch (err) {
      console.error("Errore eliminazione:", err);
      setError("Errore eliminazione: " + err.message);
    }
  }

  // Export CSV
  async function exportCSV() {
    try {
      setExporting(true);
      const headers = ["Data", "Numero", "Conto", "Nome Conto", "Dare", "Avere", "Descrizione", "Riferimento"];
      const rows = filteredEntries.map(e => [
        e.accounting_date, e.reference || "", e.account_code, e.account_name || "",
        Number(e.debit_amount || 0).toFixed(2), Number(e.credit_amount || 0).toFixed(2),
        e.description || "", e.reference || ""
      ]);
      const csv = [headers.join(","), ...rows.map(r => r.map(c => `"${c}"`).join(","))].join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `movimenti_contabili_${isoToday()}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Errore export CSV:", err);
      setError("Errore export CSV: " + err.message);
    } finally {
      setExporting(false);
    }
  }

  /* ─── Loading skeleton ─── */
  if (loading) {
    return (
      <div className="space-y-5 animate-pulse">
        <div><div className="h-5 w-48 bg-[#243044] rounded mb-1.5" /><div className="h-3 w-72 bg-[#1a2536] rounded" /></div>
        <div className="grid grid-cols-3 gap-3">
          {[1,2,3].map(i => <div key={i} className="h-16 bg-[#1a2536] rounded-xl border border-[#243044]" />)}
        </div>
        <div className="h-10 bg-[#1a2536] rounded-xl border border-[#243044]" />
        <div className="h-64 bg-[#1a2536] rounded-xl border border-[#243044]" />
      </div>
    );
  }

  return (
    <div className="space-y-5">

      {/* ── Header compatto ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-100">Movimenti Contabili</h1>
          <p className="text-xs text-slate-500 mt-0.5">Registrazioni in partita doppia</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { loadEntries(); }} disabled={refreshing}
            className="h-8 px-3 text-xs font-medium text-slate-400 bg-[#1a2536] border border-[#243044] rounded-lg hover:bg-[#1e2b3d] transition disabled:opacity-50">
            <FiRefreshCw className={`w-3.5 h-3.5 inline mr-1 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "..." : "Aggiorna"}
          </button>
          <button onClick={exportCSV} disabled={exporting || filteredEntries.length === 0}
            className="h-8 px-3 text-xs font-medium text-slate-400 bg-[#1a2536] border border-[#243044] rounded-lg hover:bg-[#1e2b3d] transition disabled:opacity-50">
            <FiDownload className="w-3.5 h-3.5 inline mr-1" />
            CSV
          </button>
          <button onClick={() => navigate("/contabilita/movimenti/new")}
            className="h-8 px-3.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition shadow-sm shadow-blue-600/20">
            <FiPlus className="w-3.5 h-3.5 inline mr-1" />
            Nuovo
          </button>
        </div>
      </div>

      {/* ── KPI Totali ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-[#1a2536] rounded-xl border border-[#243044] p-4 hover:border-blue-500/30 transition">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center mb-2">
            <FiFileText className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-xl font-semibold text-slate-100">{filteredEntries.length}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Movimenti</div>
        </div>
        <div className="bg-[#1a2536] rounded-xl border border-[#243044] p-4 hover:border-emerald-500/30 transition">
          <div className="text-[10px] text-slate-500 mb-1">Totale Dare</div>
          <div className="text-lg font-semibold text-slate-100">{EUR(totals.totalDebit)}</div>
        </div>
        <div className="bg-[#1a2536] rounded-xl border border-[#243044] p-4 hover:border-amber-500/30 transition">
          <div className="text-[10px] text-slate-500 mb-1">Totale Avere</div>
          <div className="text-lg font-semibold text-slate-100">{EUR(totals.totalCredit)}</div>
        </div>
        <div className={`bg-[#1a2536] rounded-xl border p-4 transition ${totals.isBalanced ? "border-emerald-500/30" : "border-red-500/30"}`}>
          <div className="flex items-center gap-1.5 mb-1">
            {totals.isBalanced
              ? <><FiCheckCircle className="w-3 h-3 text-emerald-400" /><span className="text-[10px] text-emerald-400">Bilanciato</span></>
              : <><FiXCircle className="w-3 h-3 text-red-400" /><span className="text-[10px] text-red-400">Non bilanciato</span></>
            }
          </div>
          <div className={`text-lg font-semibold ${totals.isBalanced ? "text-emerald-400" : "text-red-400"}`}>{EUR(totals.difference)}</div>
        </div>
      </div>

      {/* ── Toolbar filtri ── */}
      <div className="bg-[#1a2536] rounded-xl border border-[#243044] px-4 py-2.5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[180px]">
            <FiSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 w-3 h-3" />
            <input type="text" placeholder="Cerca descrizione, conto, rif..." value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full h-7 pl-7 pr-3 text-[11px] border border-[#243044] rounded-md bg-[#141c27] text-slate-200 placeholder-slate-600 focus:ring-1 focus:ring-blue-500/30 outline-none transition" />
          </div>
          <div className="flex items-center gap-1.5">
            <FiCalendar className="w-3 h-3 text-slate-500" />
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
              className="h-7 px-2 text-[11px] border border-[#243044] rounded-md bg-[#141c27] text-slate-200 outline-none" />
            <span className="text-[10px] text-slate-600">→</span>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
              className="h-7 px-2 text-[11px] border border-[#243044] rounded-md bg-[#141c27] text-slate-200 outline-none" />
          </div>
          <select value={accountFilter} onChange={(e) => { setAccountFilter(e.target.value); setCurrentPage(1); }}
            className="h-7 px-2 text-[11px] border border-[#243044] rounded-md bg-[#141c27] text-slate-200 outline-none">
            <option value="">Tutti i conti</option>
            {accounts.map(a => <option key={a.id} value={a.code}>{a.code} - {a.name}</option>)}
          </select>
          {(dateFrom || dateTo || accountFilter) && (
            <button onClick={() => { setDateFrom(""); setDateTo(""); setAccountFilter(""); loadEntries(); }}
              className="h-7 px-2 text-[10px] text-slate-400 hover:text-red-400 transition">
              <FiXCircle className="w-3 h-3 inline mr-0.5" /> Reset
            </button>
          )}
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

      {/* ── Tabella ── */}
      {filteredEntries.length > 0 ? (
        <div className="bg-[#1a2536] rounded-xl border border-[#243044] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#141c27]">
                  {["Data", "Conto", "Descrizione", "Rif.", "Dare", "Avere", ""].map((h, i) => (
                    <th key={h || i} className={`px-3 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider ${i >= 4 && i <= 5 ? "text-right" : i === 6 ? "text-right" : "text-left"}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#243044]/60">
                {paginatedEntries.map(entry => (
                  <tr key={entry.id} className="hover:bg-[#141c27]/60 transition-colors">
                    <td className="px-3 py-2 text-xs text-slate-400">{fmtDate(entry.accounting_date)}</td>
                    <td className="px-3 py-2">
                      <div className="text-xs font-medium text-slate-200">{entry.account_code}</div>
                      <div className="text-[10px] text-slate-600">{entry.account_name}</div>
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-400 truncate max-w-[200px]">{entry.description || "—"}</td>
                    <td className="px-3 py-2 text-xs text-slate-500 truncate max-w-[120px]">{entry.reference || "—"}</td>
                    <td className="px-3 py-2 text-xs text-right font-medium text-slate-200">
                      {Number(entry.debit_amount || 0) > 0 ? EUR(entry.debit_amount) : "—"}
                    </td>
                    <td className="px-3 py-2 text-xs text-right font-medium text-slate-200">
                      {Number(entry.credit_amount || 0) > 0 ? EUR(entry.credit_amount) : "—"}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => navigate(`/contabilita/movimenti/${entry.id}`)}
                          className="w-6 h-6 flex items-center justify-center rounded text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 transition"
                          title="Modifica">
                          <FiEdit className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(entry.id)}
                          className="w-6 h-6 flex items-center justify-center rounded text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition"
                          title="Elimina">
                          <FiTrash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginazione */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-2 border-t border-[#243044]">
              <span className="text-[10px] text-slate-500">{filteredEntries.length} movimenti</span>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-slate-500">{currentPage} / {totalPages}</span>
                <button onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1}
                  className="w-6 h-6 flex items-center justify-center rounded border border-[#243044] bg-[#141c27] text-slate-400 disabled:opacity-30 hover:bg-[#1e2b3d] transition">
                  <FiChevronLeft className="w-3 h-3" />
                </button>
                <button onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages}
                  className="w-6 h-6 flex items-center justify-center rounded border border-[#243044] bg-[#141c27] text-slate-400 disabled:opacity-30 hover:bg-[#1e2b3d] transition">
                  <FiChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 bg-[#1a2536] rounded-xl border border-[#243044]">
          <FiFileText className="w-10 h-10 text-slate-600 mb-3" />
          <p className="text-sm font-medium text-slate-400 mb-1">Nessun movimento trovato</p>
          <p className="text-[10px] text-slate-600 mb-4">Inizia registrando il primo movimento contabile</p>
          <button onClick={() => navigate("/contabilita/movimenti/new")}
            className="h-7 px-3 text-[10px] font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition">
            <FiPlus className="w-3 h-3 inline mr-1" /> Nuovo Movimento
          </button>
        </div>
      )}

      {/* ── Dialog conferma eliminazione ── */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <button className="absolute inset-0 bg-black/60 backdrop-blur-sm border-none cursor-pointer"
            onClick={() => setShowDeleteConfirm(null)} aria-label="Chiudi" type="button" />
          <div className="relative w-full max-w-sm rounded-xl border border-[#243044] bg-[#1a2536] p-5">
            <div className="text-sm font-semibold text-slate-200 mb-1.5">Conferma eliminazione</div>
            <div className="text-xs text-slate-400 mb-5">Sei sicuro di voler eliminare questo movimento? L'azione non può essere annullata.</div>
            <div className="flex justify-end gap-2">
              <button className="h-8 px-3 text-xs font-medium text-slate-400 bg-[#141c27] border border-[#243044] rounded-lg hover:bg-[#1e2b3d] transition"
                onClick={() => setShowDeleteConfirm(null)}>Annulla</button>
              <button className="h-8 px-3 text-xs font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition"
                onClick={() => deleteEntry(showDeleteConfirm)}>Elimina</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
