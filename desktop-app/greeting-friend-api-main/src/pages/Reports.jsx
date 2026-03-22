/**
 * Reports Page — Design L aligned
 * Dashboard analitica con report avanzati e visualizzazioni moderne
 *
 * @author haxies
 * @created 2025
 */

import { useEffect, useMemo, useState } from "react";
import {
  FiDownload, FiCalendar, FiChevronLeft, FiChevronRight,
  FiTrendingUp, FiTrendingDown, FiBarChart2, FiRefreshCw,
  FiFileText, FiTruck, FiClock, FiAlertCircle, FiCheckCircle
} from "react-icons/fi";
import { supabaseBrowser } from "../lib/supabase-browser";
import { useOrg } from "../context/OrgContext";

/* ─── Costanti ─── */
const STATUS_MAP = {
  done:     { label: "Completato", cls: "bg-emerald-500/10 text-emerald-400" },
  enroute:  { label: "In Viaggio", cls: "bg-amber-500/10 text-amber-400" },
  assigned: { label: "Assegnato",  cls: "bg-blue-500/10 text-blue-400" },
  new:      { label: "Nuovo",      cls: "bg-[#243044] text-slate-300" },
};

const QUICK_RANGES = [
  { key: "7",   label: "7g" },
  { key: "30",  label: "30g" },
  { key: "90",  label: "90g" },
  { key: "all", label: "Tutto" },
];

const STATUS_FILTERS = [
  { value: "all",      label: "Tutti" },
  { value: "new",      label: "Nuovo" },
  { value: "assigned", label: "Assegnato" },
  { value: "enroute",  label: "In Viaggio" },
  { value: "done",     label: "Completato" },
];

const inputCls = "h-7 px-2 text-[11px] border border-[#243044] rounded-md bg-[#141c27] text-slate-200 focus:ring-1 focus:ring-blue-500/30 focus:border-blue-500/30 outline-none transition";

/* ─── Helpers ─── */
const fmtDate = (iso) => new Date(iso).toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit", year: "2-digit" });
const isoToday = () => new Date().toISOString().split("T")[0];
const isoDaysAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().split("T")[0]; };

/* ─── StatusBadge ─── */
function StatusBadge({ status }) {
  const s = STATUS_MAP[status] || STATUS_MAP.new;
  return (
    <span className={`inline-flex items-center h-5 px-2 rounded text-[10px] font-medium ${s.cls}`}>
      {s.label}
    </span>
  );
}

/* ─── BarChart SVG ─── */
function BarChart({ data }) {
  if (!data?.length) return <div className="text-[10px] text-slate-600 py-6 text-center">Nessun dato</div>;

  const max = Math.max(...data.map(d => d.value), 1);
  const barW = 100 / data.length;

  return (
    <div className="relative w-full h-28">
      <svg viewBox="0 0 100 50" preserveAspectRatio="none" className="w-full h-full">
        {data.map((item, i) => {
          const h = (item.value / max) * 42;
          return (
            <rect
              key={`${item.label}-${i}`}
              x={i * barW + barW * 0.15}
              y={48 - h}
              width={barW * 0.7}
              height={h}
              rx="0.8"
              className="fill-blue-500/70 hover:fill-blue-400 transition-colors"
            />
          );
        })}
      </svg>
      {/* X-axis labels */}
      <div className="flex justify-between px-0.5 mt-1">
        {data.length <= 14 ? data.map((item, i) => (
          <span key={i} className="text-[8px] text-slate-600 truncate" style={{ width: `${barW}%`, textAlign: "center" }}>
            {item.label}
          </span>
        )) : (
          <>
            <span className="text-[8px] text-slate-600">{data[0]?.label}</span>
            <span className="text-[8px] text-slate-600">{data[data.length - 1]?.label}</span>
          </>
        )}
      </div>
    </div>
  );
}

export default function Reports() {
  const { orgId } = useOrg();
  const supabase = supabaseBrowser();

  const [transports, setTransports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Filtri
  const [dateRange, setDateRange] = useState("30");
  const [fromDate, setFromDate] = useState(() => isoDaysAgo(30));
  const [toDate, setToDate] = useState(isoToday);
  const [statusFilter, setStatusFilter] = useState("all");
  const [driverFilter, setDriverFilter] = useState("all");

  // Paginazione
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // Carica trasporti
  const fetchTransports = async () => {
    if (!orgId) return;

    try {
      setRefreshing(true);
      setError(null);

      const { data, error } = await supabase
        .from("transports")
        .select(`
          id, created_at, client_id, pickup_address, dropoff_address,
          status, driver_id, eta_minutes, price_cents, notes, org_id
        `)
        .eq("org_id", orgId)
        .gte("created_at", `${fromDate}T00:00:00`)
        .lte("created_at", `${toDate}T23:59:59`)
        .order("created_at", { ascending: false })
        .limit(5000);

      if (error) throw error;
      setTransports(data || []);
    } catch (err) {
      console.error("Error fetching transports:", err);
      setError("Errore durante il caricamento dei dati dei trasporti.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchTransports(); }, [orgId, fromDate, toDate]); // eslint-disable-line

  // Applica filtri rapidi
  const applyQuickFilter = (range) => {
    setDateRange(range);
    const today = isoToday();
    switch (range) {
      case "7":   setFromDate(isoDaysAgo(7));   break;
      case "30":  setFromDate(isoDaysAgo(30));  break;
      case "90":  setFromDate(isoDaysAgo(90));  break;
      case "all": setFromDate(isoDaysAgo(365)); break;
    }
    setToDate(today);
    setCurrentPage(1);
  };

  // Filtra trasporti
  const filteredTransports = useMemo(() => {
    return transports.filter(t => {
      const statusMatch = statusFilter === "all" || t.status === statusFilter;
      const driverMatch = driverFilter === "all" || t.driver_id === driverFilter;
      return statusMatch && driverMatch;
    });
  }, [transports, statusFilter, driverFilter]);

  // Calcola statistiche
  const stats = useMemo(() => {
    const total = filteredTransports.length;
    const completed = filteredTransports.filter(t => t.status === "done").length;
    const inProgress = filteredTransports.filter(t => t.status === "enroute").length;
    const assigned = filteredTransports.filter(t => t.status === "assigned").length;
    const newT = filteredTransports.filter(t => t.status === "new").length;

    const withDuration = filteredTransports.filter(t => t.eta_minutes > 0);
    const avgDuration = withDuration.length > 0
      ? Math.round(withDuration.reduce((s, t) => s + t.eta_minutes, 0) / withDuration.length)
      : 0;

    // Trend vs periodo precedente
    const daysDiff = Math.ceil((new Date(toDate) - new Date(fromDate)) / 86400000);
    const prevFrom = new Date(fromDate);
    prevFrom.setDate(prevFrom.getDate() - daysDiff);
    const prevTo = new Date(fromDate);
    prevTo.setDate(prevTo.getDate() - 1);

    const prevCount = transports.filter(t => {
      const d = new Date(t.created_at);
      return d >= prevFrom && d <= prevTo;
    }).length;

    const trend = prevCount > 0 ? Math.round(((total - prevCount) / prevCount) * 100) : 0;

    return { total, completed, inProgress, assigned, newT, avgDuration, trend, completionRate: total > 0 ? Math.round((completed / total) * 100) : 0 };
  }, [filteredTransports, transports, fromDate, toDate]);

  // Dati per grafico giornaliero
  const dailyData = useMemo(() => {
    const map = new Map();
    for (const t of filteredTransports) {
      const d = t.created_at.split("T")[0];
      map.set(d, (map.get(d) || 0) + 1);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-14)
      .map(([date, count]) => ({
        label: new Date(date).toLocaleDateString("it-IT", { month: "short", day: "numeric" }),
        value: count,
      }));
  }, [filteredTransports]);

  // Paginazione
  const totalPages = Math.ceil(filteredTransports.length / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const paginatedTransports = filteredTransports.slice(startIdx, startIdx + itemsPerPage);

  // Opzioni autisti
  const driverOptions = useMemo(() => {
    return [...new Set(transports.map(t => t.driver_id).filter(Boolean))];
  }, [transports]);

  // Export CSV
  const handleExportCSV = () => {
    const headers = ["ID", "Data", "Cliente", "Partenza", "Arrivo", "Autista", "Stato", "ETA (min)"];
    const rows = filteredTransports.map(t => [
      t.id, t.created_at.split("T")[0], t.client_id || "", t.pickup_address || "",
      t.dropoff_address || "", t.driver_id || "", t.status || "", t.eta_minutes || "",
    ]);
    const csv = [headers, ...rows]
      .map(r => r.map(c => `"${String(c).replaceAll('"', '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `report_trasporti_${fromDate}_${toDate}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  /* ─── Loading skeleton ─── */
  if (loading) {
    return (
      <div className="space-y-5 animate-pulse">
        <div><div className="h-5 w-40 bg-[#243044] rounded mb-1.5" /><div className="h-3 w-64 bg-[#1a2536] rounded" /></div>
        <div className="h-10 bg-[#1a2536] rounded-xl border border-[#243044]" />
        <div className="grid grid-cols-4 gap-3">
          {[1,2,3,4].map(i => <div key={i} className="h-20 bg-[#1a2536] rounded-xl border border-[#243044]" />)}
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="h-40 bg-[#1a2536] rounded-xl border border-[#243044]" />
          <div className="col-span-2 h-40 bg-[#1a2536] rounded-xl border border-[#243044]" />
        </div>
        <div className="h-64 bg-[#1a2536] rounded-xl border border-[#243044]" />
      </div>
    );
  }

  return (
    <div className="space-y-5">

      {/* ── Header compatto ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-100">Report e Analisi</h1>
          <p className="text-xs text-slate-500 mt-0.5">Performance e statistiche dei trasporti</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchTransports}
            disabled={refreshing}
            className="h-8 px-3 text-xs font-medium text-slate-400 bg-[#1a2536] border border-[#243044] rounded-lg hover:bg-[#1e2b3d] transition disabled:opacity-50"
          >
            <FiRefreshCw className={`w-3.5 h-3.5 inline mr-1 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "..." : "Aggiorna"}
          </button>
          <button
            onClick={handleExportCSV}
            disabled={filteredTransports.length === 0}
            className="h-8 px-3.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition shadow-sm shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiDownload className="w-3.5 h-3.5 inline mr-1" />
            CSV
          </button>
        </div>
      </div>

      {/* ── Toolbar filtri ── */}
      <div className="bg-[#1a2536] rounded-xl border border-[#243044] px-4 py-2.5">
        <div className="flex flex-wrap items-center gap-3">
          {/* Quick range */}
          <div className="flex gap-0.5 rounded-lg border border-[#243044] p-0.5 bg-[#141c27]/40">
            {QUICK_RANGES.map(r => (
              <button
                key={r.key}
                onClick={() => applyQuickFilter(r.key)}
                className={`h-6 px-2 rounded-md text-[10px] font-medium transition ${
                  dateRange === r.key
                    ? "bg-blue-600 text-white"
                    : "text-slate-400 hover:bg-[#1e2b3d]"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          {/* Date pickers */}
          <div className="flex items-center gap-1.5">
            <FiCalendar className="w-3 h-3 text-slate-500" />
            <input type="date" value={fromDate} onChange={(e) => { setFromDate(e.target.value); setDateRange("custom"); }} className={inputCls} />
            <span className="text-[10px] text-slate-600">→</span>
            <input type="date" value={toDate} onChange={(e) => { setToDate(e.target.value); setDateRange("custom"); }} className={inputCls} />
          </div>

          {/* Status filter segmented */}
          <div className="flex gap-0.5 rounded-lg border border-[#243044] p-0.5 bg-[#141c27]/40">
            {STATUS_FILTERS.map(f => (
              <button
                key={f.value}
                onClick={() => { setStatusFilter(f.value); setCurrentPage(1); }}
                className={`h-6 px-2 rounded-md text-[10px] font-medium transition ${
                  statusFilter === f.value
                    ? "bg-blue-600 text-white"
                    : "text-slate-400 hover:bg-[#1e2b3d]"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Driver select */}
          {driverOptions.length > 0 && (
            <select
              value={driverFilter}
              onChange={(e) => { setDriverFilter(e.target.value); setCurrentPage(1); }}
              className={inputCls}
            >
              <option value="all">Tutti autisti</option>
              {driverOptions.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          )}
        </div>
      </div>

      {/* ── Errore ── */}
      {error && (
        <div className="bg-red-500/5 rounded-xl border border-red-500/15 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <FiAlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span className="text-xs text-red-400">{error}</span>
          </div>
        </div>
      )}

      {/* ── KPI Cards ── */}
      {!error && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Totali */}
          <div className="bg-[#1a2536] rounded-xl border border-[#243044] p-4 hover:border-blue-500/30 transition">
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <FiTruck className="w-4 h-4 text-blue-400" />
              </div>
              {stats.trend !== 0 && (
                <span className={`flex items-center gap-0.5 text-[10px] font-medium ${stats.trend > 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {stats.trend > 0 ? <FiTrendingUp className="w-3 h-3" /> : <FiTrendingDown className="w-3 h-3" />}
                  {Math.abs(stats.trend)}%
                </span>
              )}
            </div>
            <div className="text-xl font-semibold text-slate-100">{stats.total}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Trasporti Totali</div>
          </div>

          {/* Completati */}
          <div className="bg-[#1a2536] rounded-xl border border-[#243044] p-4 hover:border-emerald-500/30 transition">
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <FiCheckCircle className="w-4 h-4 text-emerald-400" />
              </div>
              <span className="text-[10px] text-emerald-400 font-medium">{stats.completionRate}%</span>
            </div>
            <div className="text-xl font-semibold text-slate-100">{stats.completed}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Completati</div>
          </div>

          {/* In Corso */}
          <div className="bg-[#1a2536] rounded-xl border border-[#243044] p-4 hover:border-amber-500/30 transition">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center mb-2">
              <FiClock className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-xl font-semibold text-slate-100">{stats.inProgress}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">In Viaggio · {stats.assigned} assegnati · {stats.newT} nuovi</div>
          </div>

          {/* ETA Medio */}
          <div className="bg-[#1a2536] rounded-xl border border-[#243044] p-4 hover:border-blue-500/30 transition">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center mb-2">
              <FiBarChart2 className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-xl font-semibold text-slate-100">{stats.avgDuration > 0 ? `${stats.avgDuration}m` : "N/A"}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">ETA Medio</div>
          </div>
        </div>
      )}

      {/* ── Grafici ── */}
      {!error && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {/* Attività giornaliera */}
          <div className="bg-[#1a2536] rounded-xl border border-[#243044] overflow-hidden">
            <div className="flex items-center gap-2.5 px-4 py-2.5 border-b border-[#243044]">
              <FiBarChart2 className="w-3.5 h-3.5 text-blue-400" />
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Attività Giornaliera</h3>
            </div>
            <div className="p-4">
              <BarChart data={dailyData} />
            </div>
          </div>

          {/* Distribuzione stati */}
          <div className="lg:col-span-2 bg-[#1a2536] rounded-xl border border-[#243044] overflow-hidden">
            <div className="flex items-center gap-2.5 px-4 py-2.5 border-b border-[#243044]">
              <FiFileText className="w-3.5 h-3.5 text-emerald-400" />
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Distribuzione Stati</h3>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: "Completati", value: stats.completed, color: "text-emerald-400", bg: "bg-emerald-500/10" },
                  { label: "In Viaggio", value: stats.inProgress, color: "text-amber-400", bg: "bg-amber-500/10" },
                  { label: "Assegnati", value: stats.assigned, color: "text-blue-400", bg: "bg-blue-500/10" },
                  { label: "Nuovi", value: stats.newT, color: "text-slate-400", bg: "bg-[#243044]" },
                ].map(item => (
                  <div key={item.label} className={`rounded-lg ${item.bg} p-3 text-center`}>
                    <div className={`text-lg font-semibold ${item.color}`}>{item.value}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{item.label}</div>
                    {stats.total > 0 && (
                      <div className="mt-1.5 h-1 rounded-full bg-[#141c27] overflow-hidden">
                        <div
                          className={`h-full rounded-full ${item.color.replace("text-", "bg-")} opacity-60`}
                          style={{ width: `${Math.round((item.value / stats.total) * 100)}%` }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Tabella Dettagliata ── */}
      {!error && filteredTransports.length > 0 && (
        <div className="bg-[#1a2536] rounded-xl border border-[#243044] overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#243044]">
            <div className="flex items-center gap-2.5">
              <FiFileText className="w-3.5 h-3.5 text-blue-400" />
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Dettaglio Trasporti</h3>
            </div>
            <span className="text-[10px] text-slate-500">{filteredTransports.length} risultati</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#141c27]">
                  {["ID", "Data", "Cliente", "Partenza", "Arrivo", "Autista", "Stato", "ETA"].map(h => (
                    <th key={h} className="px-3 py-2 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#243044]/60">
                {paginatedTransports.map(t => (
                  <tr key={t.id} className="hover:bg-[#141c27]/60 transition-colors">
                    <td className="px-3 py-2 text-xs text-slate-400 font-mono">#{String(t.id).slice(-6)}</td>
                    <td className="px-3 py-2 text-xs text-slate-400">{fmtDate(t.created_at)}</td>
                    <td className="px-3 py-2 text-xs text-slate-200 truncate max-w-[120px]">{t.client_id || "—"}</td>
                    <td className="px-3 py-2 text-xs text-slate-400 truncate max-w-[160px]">{t.pickup_address || "—"}</td>
                    <td className="px-3 py-2 text-xs text-slate-400 truncate max-w-[160px]">{t.dropoff_address || "—"}</td>
                    <td className="px-3 py-2 text-xs text-slate-400 truncate max-w-[100px]">{t.driver_id || "—"}</td>
                    <td className="px-3 py-2"><StatusBadge status={t.status} /></td>
                    <td className="px-3 py-2 text-xs text-slate-400">{t.eta_minutes ? `${t.eta_minutes}m` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginazione */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-2 border-t border-[#243044]">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-slate-500">Mostra</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                  className="h-6 px-1.5 text-[10px] border border-[#243044] rounded bg-[#141c27] text-slate-300 outline-none"
                >
                  {[10, 25, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-slate-500">{currentPage} / {totalPages}</span>
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="w-6 h-6 flex items-center justify-center rounded border border-[#243044] bg-[#141c27] text-slate-400 disabled:opacity-30 hover:bg-[#1e2b3d] transition"
                >
                  <FiChevronLeft className="w-3 h-3" />
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="w-6 h-6 flex items-center justify-center rounded border border-[#243044] bg-[#141c27] text-slate-400 disabled:opacity-30 hover:bg-[#1e2b3d] transition"
                >
                  <FiChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Stato vuoto ── */}
      {!error && !loading && filteredTransports.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 bg-[#1a2536] rounded-xl border border-[#243044]">
          <FiBarChart2 className="w-10 h-10 text-slate-600 mb-3" />
          <p className="text-sm font-medium text-slate-400 mb-1">Nessun dato trovato</p>
          <p className="text-[10px] text-slate-600 mb-4">Nessun trasporto corrisponde ai filtri selezionati</p>
          <button
            onClick={() => { setStatusFilter("all"); setDriverFilter("all"); applyQuickFilter("30"); }}
            className="h-7 px-3 text-[10px] font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition"
          >
            <FiRefreshCw className="w-3 h-3 inline mr-1" />
            Reset Filtri
          </button>
        </div>
      )}
    </div>
  );
}