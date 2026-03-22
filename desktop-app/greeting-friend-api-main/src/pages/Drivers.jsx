/**
 * Drivers Management Page
 * Gestione autisti — Design L aligned
 * 
 * @author haxies
 * @created 2025
 */

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiTrash2, FiRefreshCw, FiPlus, FiSearch, FiUsers,
  FiEdit, FiPhone, FiAlertCircle
} from "react-icons/fi";
import { supabaseBrowser } from "../lib/supabase-browser";
import { useOrg } from "../context/OrgContext";
import { KPICard } from "../components/ui/DashboardCards";

/* ─── Status Badge (driver-specific) ─── */
function DriverStatusBadge({ status }) {
  const map = {
    disponibile: "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20",
    occupato:    "text-amber-400 bg-amber-500/10 border border-amber-500/20",
    offline:     "text-slate-400 bg-slate-500/10 border border-slate-500/20",
  };
  const labels = { disponibile: "Disponibile", occupato: "Occupato", offline: "Offline" };
  return (
    <span className={`inline-flex items-center rounded-lg font-medium text-[10px] uppercase px-2 py-1 ${map[status] || map.offline}`}>
      {labels[status] || status}
    </span>
  );
}

/* ─── Avatar ─── */
function Avatar({ name }) {
  const initials = name?.trim()
    ? name.split(" ").map(p => p[0]?.toUpperCase()).slice(0, 2).join("")
    : "AU";
  return (
    <div className="h-8 w-8 shrink-0 rounded-full bg-blue-600 text-white grid place-items-center text-xs font-semibold">
      {initials}
    </div>
  );
}

/* ─── Confirm Dialog ─── */
function ConfirmDialog({ open, title, message, confirmLabel, onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <button
        className="absolute inset-0 bg-black/60 backdrop-blur-sm border-none cursor-pointer"
        onClick={onCancel}
        onKeyDown={(e) => e.key === "Escape" && onCancel()}
        aria-label="Chiudi dialog"
        type="button"
      />
      <div className="relative w-full max-w-sm rounded-xl border border-[#243044] bg-[#1a2536] p-5">
        <div className="text-sm font-semibold text-slate-200 mb-1.5">{title}</div>
        {message && <div className="text-xs text-slate-400 mb-5">{message}</div>}
        <div className="flex justify-end gap-2">
          <button
            className="h-8 px-3 text-xs font-medium text-slate-400 bg-[#141c27] border border-[#243044] rounded-lg hover:bg-[#1e2b3d] transition"
            onClick={onCancel}
          >
            Annulla
          </button>
          <button
            className="h-8 px-3 text-xs font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition"
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Drivers() {
  const navigate = useNavigate();
  const supabase = supabaseBrowser();
  const { orgId } = useOrg();

  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showConfirm, setShowConfirm] = useState(false);
  const [driverToDelete, setDriverToDelete] = useState(null);

  // Paginazione
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // Carica autisti
  const fetchDrivers = async (isRefresh = false) => {
    if (!orgId) return;
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from("staff_drivers")
        .select("*")
        .eq("org_id", orgId)
        .order("nome", { ascending: true });

      if (error) throw error;
      setDrivers(data || []);
    } catch (err) {
      console.error("Error fetching drivers:", err);
      setError("Errore durante il caricamento degli autisti.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, [orgId]);

  // Filtra autisti
  const filteredDrivers = useMemo(() => {
    return drivers.filter(driver => {
      const matchesSearch = !searchTerm ||
        driver.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        driver.telefono?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        driver.patente?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = filterStatus === "all" || driver.stato === filterStatus;

      return matchesSearch && matchesStatus;
    });
  }, [drivers, searchTerm, filterStatus]);

  // Paginazione
  const totalPages = Math.ceil(filteredDrivers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedDrivers = filteredDrivers.slice(startIndex, startIndex + itemsPerPage);

  // Gestione eliminazione
  const handleDelete = async () => {
    if (!driverToDelete) return;
    try {
      const { error } = await supabase
        .from("staff_drivers")
        .delete()
        .eq("id", driverToDelete.id)
        .eq("org_id", orgId);

      if (error) throw error;
      setDrivers(drivers.filter((d) => d.id !== driverToDelete.id));
      setShowConfirm(false);
      setDriverToDelete(null);
    } catch (err) {
      console.error("Error deleting driver:", err);
      setError("Errore durante l'eliminazione dell'autista.");
    }
  };

  // Statistiche
  const stats = useMemo(() => {
    const total = drivers.length;
    const disponibili = drivers.filter(d => d.stato === "disponibile").length;
    const occupati = drivers.filter(d => d.stato === "occupato").length;
    const offline = drivers.filter(d => d.stato === "offline").length;
    return { total, disponibili, occupati, offline };
  }, [drivers]);

  /* ─── Loading skeleton ─── */
  if (loading) {
    return (
      <div className="space-y-5 animate-pulse">
        <div className="flex items-center justify-between">
          <div><div className="h-5 w-28 bg-[#243044] rounded mb-2" /><div className="h-3 w-44 bg-[#1a2536] rounded" /></div>
          <div className="flex gap-2"><div className="h-8 w-20 bg-[#1a2536] rounded-lg" /><div className="h-8 w-32 bg-blue-600/30 rounded-lg" /></div>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-[#1a2536] rounded-xl border border-[#243044] p-4">
              <div className="h-2.5 w-16 bg-[#243044] rounded mb-3" />
              <div className="h-7 w-12 bg-[#243044] rounded" />
            </div>
          ))}
        </div>
        <div className="bg-[#1a2536] rounded-xl border border-[#243044] p-5">
          {[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-[#141c27] rounded-lg mb-2" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">

      {/* ── Header compatto ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-100">Autisti</h1>
          <p className="text-slate-500 text-xs mt-0.5">
            Gestisci disponibilità, competenze e turni
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchDrivers(true)}
            disabled={refreshing}
            className="h-8 px-3 text-xs font-medium text-slate-400 bg-[#1a2536] border border-[#243044] rounded-lg hover:bg-[#1e2b3d] transition disabled:opacity-50"
          >
            <FiRefreshCw className={`w-3.5 h-3.5 inline mr-1.5 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "..." : "Aggiorna"}
          </button>
          <button
            onClick={() => navigate("/autisti/new")}
            className="h-8 px-4 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition shadow-sm shadow-blue-600/20"
          >
            <FiPlus className="w-3.5 h-3.5 inline mr-1" />
            Nuovo Autista
          </button>
        </div>
      </div>

      {/* ── KPI 4 colonne ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPICard title="Totale" value={stats.total} icon={FiUsers} color="blue" delta={null} />
        <KPICard title="Disponibili" value={stats.disponibili} icon={FiUsers} color="green" delta={null} />
        <KPICard title="Occupati" value={stats.occupati} icon={FiUsers} color="amber" delta={null} />
        <KPICard title="Offline" value={stats.offline} icon={FiUsers} color="red" delta={null} />
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

      {/* ── Tabella ── */}
      <div className="bg-[#1a2536] rounded-2xl border border-[#243044] overflow-hidden">

        {/* Toolbar ricerca/filtro */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#243044] gap-3">
          <div className="relative flex-1 max-w-sm">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Cerca nome, telefono, patente..."
              className="w-full h-8 pl-9 pr-3 text-xs border border-[#243044] rounded-lg bg-[#141c27] text-slate-200 placeholder-slate-600 focus:ring-1 focus:ring-blue-500/30 focus:border-blue-500/30 outline-none"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="flex gap-1 rounded-lg border border-[#243044] p-0.5 bg-[#141c27]">
              {[
                { value: "all", label: "Tutti" },
                { value: "disponibile", label: "Disponibili" },
                { value: "occupato", label: "Occupati" },
                { value: "offline", label: "Offline" },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => { setFilterStatus(opt.value); setCurrentPage(1); }}
                  className={`px-2.5 h-7 rounded-md text-[10px] font-medium transition ${
                    filterStatus === opt.value
                      ? "bg-blue-600 text-white"
                      : "text-slate-400 hover:text-slate-200 hover:bg-[#1a2536]"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Empty state */}
        {filteredDrivers.length === 0 && (
          <div className="text-center py-12">
            <FiUsers className="w-8 h-8 text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-500 mb-1">Nessun autista trovato</p>
            <p className="text-xs text-slate-600 mb-4">
              {searchTerm || filterStatus !== "all" ? "Prova a modificare i filtri di ricerca" : "Aggiungi il tuo primo autista"}
            </p>
            {!searchTerm && filterStatus === "all" && (
              <button
                onClick={() => navigate("/autisti/new")}
                className="text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition"
              >
                <FiPlus className="w-3.5 h-3.5 inline mr-1" />
                Nuovo Autista
              </button>
            )}
          </div>
        )}

        {/* Table */}
        {filteredDrivers.length > 0 && (
          <>
            <table className="w-full">
              <thead>
                <tr className="text-[10px] text-slate-500 uppercase tracking-wider border-b border-[#243044]">
                  <th className="py-2.5 px-5 text-left font-medium">Autista</th>
                  <th className="py-2.5 px-5 text-left font-medium">Contatto</th>
                  <th className="py-2.5 px-5 text-left font-medium">Patenti</th>
                  <th className="py-2.5 px-5 text-center font-medium">Stato</th>
                  <th className="py-2.5 px-5 text-center font-medium">Assegnati</th>
                  <th className="py-2.5 px-5 text-right font-medium">Azioni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#243044]/50">
                {paginatedDrivers.map((driver) => (
                  <tr
                    key={driver.id}
                    className="hover:bg-[#141c27] transition-colors cursor-pointer"
                    onClick={() => navigate(`/autisti/${driver.id}`)}
                  >
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-3">
                        <Avatar name={driver.nome} />
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-slate-200 truncate">
                            {driver.nome || "N/A"}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            ID: {driver.id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <FiPhone className="w-3 h-3" />
                        {driver.telefono || "—"}
                      </div>
                    </td>
                    <td className="py-3 px-5 text-xs text-slate-400">
                      {driver.patente || driver.patenti?.join(", ") || "—"}
                    </td>
                    <td className="py-3 px-5 text-center">
                      <DriverStatusBadge status={driver.stato} />
                    </td>
                    <td className="py-3 px-5 text-center text-xs text-slate-300 font-medium">
                      {driver.assegnati_oggi || 0}
                    </td>
                    <td className="py-3 px-5 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => navigate(`/autisti/${driver.id}/modifica`)}
                          className="p-1.5 text-slate-400 bg-white/5 border border-[#243044] rounded-lg hover:bg-[#141c27] hover:text-blue-400 transition"
                          title="Modifica"
                        >
                          <FiEdit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => { setDriverToDelete(driver); setShowConfirm(true); }}
                          className="p-1.5 text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg hover:bg-red-500/15 transition"
                          title="Elimina"
                        >
                          <FiTrash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Paginazione */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-[#243044]">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-500">Mostra</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                    className="h-7 px-2 text-[10px] border border-[#243044] rounded-lg bg-[#141c27] text-slate-300 outline-none"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                  <span className="text-[10px] text-slate-500">per pagina</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-500">
                    {startIndex + 1}–{Math.min(startIndex + itemsPerPage, filteredDrivers.length)} di {filteredDrivers.length}
                  </span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="h-7 px-2.5 text-[10px] font-medium border border-[#243044] rounded-lg bg-[#141c27] text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#1e2b3d] transition"
                    >
                      Prec.
                    </button>
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="h-7 px-2.5 text-[10px] font-medium border border-[#243044] rounded-lg bg-[#141c27] text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#1e2b3d] transition"
                    >
                      Succ.
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Dialog di conferma eliminazione */}
      <ConfirmDialog
        open={showConfirm}
        title="Eliminare autista?"
        message={`Sei sicuro di voler eliminare l'autista "${driverToDelete?.nome}"? Questa azione non può essere annullata.`}
        confirmLabel="Elimina"
        onConfirm={handleDelete}
        onCancel={() => { setShowConfirm(false); setDriverToDelete(null); }}
      />
    </div>
  );
}

