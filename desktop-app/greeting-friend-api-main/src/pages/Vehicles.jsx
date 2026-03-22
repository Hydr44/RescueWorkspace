/**
 * Vehicles List Page
 * Gestione lista mezzi — Design L aligned
 * 
 * @author haxies
 * @created 2025
 */

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiTrash2, FiRefreshCw, FiPlus, FiSearch, FiTruck,
  FiEdit, FiAlertCircle
} from "react-icons/fi";
import { supabaseBrowser } from "../lib/supabase-browser";
import { useOrg } from "../context/OrgContext";
import { KPICard } from "../components/ui/DashboardCards";

/* ─── Status Badge (vehicle-specific) ─── */
function VehicleStatusBadge({ status }) {
  const map = {
    disponibile:    "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20",
    in_uso:         "text-blue-400 bg-blue-500/10 border border-blue-500/20",
    manutenzione:   "text-amber-400 bg-amber-500/10 border border-amber-500/20",
    fuori_servizio: "text-red-400 bg-red-500/10 border border-red-500/20",
  };
  const labels = {
    disponibile: "Disponibile", in_uso: "In Uso",
    manutenzione: "Manutenzione", fuori_servizio: "Fuori Servizio",
  };
  return (
    <span className={`inline-flex items-center rounded-lg font-medium text-[10px] uppercase px-2 py-1 ${map[status] || "text-slate-400 bg-slate-500/10 border border-slate-500/20"}`}>
      {labels[status] || status || "—"}
    </span>
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

export default function Vehicles() {
  const navigate = useNavigate();
  const supabase = supabaseBrowser();
  const { orgId } = useOrg();

  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);

  // Carica mezzi
  const fetchVehicles = async (isRefresh = false) => {
    if (!orgId) return;
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from("vehicles")
        .select("*")
        .eq("org_id", orgId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setVehicles(data || []);
    } catch (err) {
      console.error("Error loading vehicles:", err);
      setError("Errore durante il caricamento dei mezzi.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, [orgId]);

  // Filtra mezzi
  const filteredVehicles = useMemo(() => {
    return vehicles.filter(vehicle => {
      const matchesSearch = !searchTerm ||
        vehicle.targa?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.modello?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.tipo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.autista?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = filterStatus === "all" || vehicle.stato === filterStatus;

      return matchesSearch && matchesStatus;
    });
  }, [vehicles, searchTerm, filterStatus]);

  // Paginazione
  const totalPages = Math.ceil(filteredVehicles.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedVehicles = filteredVehicles.slice(startIndex, startIndex + itemsPerPage);

  // Elimina mezzo
  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const { error } = await supabase
        .from("vehicles")
        .delete()
        .eq("id", deleteId);

      if (error) throw error;
      setVehicles(prev => prev.filter(v => v.id !== deleteId));
      setShowConfirm(false);
      setDeleteId(null);
    } catch (err) {
      console.error("Error deleting vehicle:", err);
      setError("Errore durante l'eliminazione del mezzo.");
    }
  };

  // Statistiche
  const stats = useMemo(() => {
    const total = vehicles.length;
    const disponibili = vehicles.filter(v => v.stato === "disponibile").length;
    const inUso = vehicles.filter(v => v.stato === "in_uso").length;
    const manutenzione = vehicles.filter(v => v.stato === "manutenzione").length;
    const fuoriServizio = vehicles.filter(v => v.stato === "fuori_servizio").length;
    return { total, disponibili, inUso, manutenzione, fuoriServizio };
  }, [vehicles]);

  /* ─── Loading skeleton ─── */
  if (loading) {
    return (
      <div className="space-y-5 animate-pulse">
        <div className="flex items-center justify-between">
          <div><div className="h-5 w-24 bg-[#243044] rounded mb-2" /><div className="h-3 w-48 bg-[#1a2536] rounded" /></div>
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
          <h1 className="text-lg font-semibold text-slate-100">Mezzi</h1>
          <p className="text-slate-500 text-xs mt-0.5">
            Gestisci la flotta, scadenze e assegnazioni
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchVehicles(true)}
            disabled={refreshing}
            className="h-8 px-3 text-xs font-medium text-slate-400 bg-[#1a2536] border border-[#243044] rounded-lg hover:bg-[#1e2b3d] transition disabled:opacity-50"
          >
            <FiRefreshCw className={`w-3.5 h-3.5 inline mr-1.5 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "..." : "Aggiorna"}
          </button>
          <button
            onClick={() => navigate("/mezzi/new")}
            className="h-8 px-4 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition shadow-sm shadow-blue-600/20"
          >
            <FiPlus className="w-3.5 h-3.5 inline mr-1" />
            Nuovo Mezzo
          </button>
        </div>
      </div>

      {/* ── KPI 4 colonne ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPICard title="Totale" value={stats.total} icon={FiTruck} color="blue" delta={null} />
        <KPICard title="Disponibili" value={stats.disponibili} icon={FiTruck} color="green" delta={null} />
        <KPICard title="In Uso" value={stats.inUso} icon={FiTruck} color="amber" delta={null} />
        <KPICard title="Manutenzione" value={stats.manutenzione + stats.fuoriServizio} icon={FiTruck} color="red" delta={null} />
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
              placeholder="Cerca targa, modello, tipo, autista..."
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
                { value: "in_uso", label: "In Uso" },
                { value: "manutenzione", label: "Manut." },
                { value: "fuori_servizio", label: "Fuori S." },
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
        {filteredVehicles.length === 0 && (
          <div className="text-center py-12">
            <FiTruck className="w-8 h-8 text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-500 mb-1">Nessun mezzo trovato</p>
            <p className="text-xs text-slate-600 mb-4">
              {searchTerm || filterStatus !== "all" ? "Prova a modificare i filtri di ricerca" : "Aggiungi il tuo primo mezzo"}
            </p>
            {!searchTerm && filterStatus === "all" && (
              <button
                onClick={() => navigate("/mezzi/new")}
                className="text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition"
              >
                <FiPlus className="w-3.5 h-3.5 inline mr-1" />
                Nuovo Mezzo
              </button>
            )}
          </div>
        )}

        {/* Table */}
        {filteredVehicles.length > 0 && (
          <>
            <table className="w-full">
              <thead>
                <tr className="text-[10px] text-slate-500 uppercase tracking-wider border-b border-[#243044]">
                  <th className="py-2.5 px-5 text-left font-medium">Mezzo</th>
                  <th className="py-2.5 px-5 text-left font-medium">Tipo</th>
                  <th className="py-2.5 px-5 text-left font-medium">Autista</th>
                  <th className="py-2.5 px-5 text-center font-medium">Stato</th>
                  <th className="py-2.5 px-5 text-right font-medium">Azioni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#243044]/50">
                {paginatedVehicles.map((vehicle) => (
                  <tr
                    key={vehicle.id}
                    className="hover:bg-[#141c27] transition-colors cursor-pointer"
                    onClick={() => navigate(`/mezzi/${vehicle.id}`)}
                  >
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 shrink-0 rounded-lg bg-blue-600/10 grid place-items-center">
                          <FiTruck className="w-3.5 h-3.5 text-blue-400" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-slate-200 truncate">
                            {vehicle.targa || "N/A"}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {vehicle.marca && vehicle.modello ? `${vehicle.marca} ${vehicle.modello}` : vehicle.modello || "—"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-5 text-xs text-slate-400 capitalize">
                      {vehicle.tipo || "—"}
                    </td>
                    <td className="py-3 px-5 text-xs text-slate-400">
                      {vehicle.autista || "—"}
                    </td>
                    <td className="py-3 px-5 text-center">
                      <VehicleStatusBadge status={vehicle.stato} />
                    </td>
                    <td className="py-3 px-5 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => navigate(`/mezzi/${vehicle.id}`)}
                          className="p-1.5 text-slate-400 bg-white/5 border border-[#243044] rounded-lg hover:bg-[#141c27] hover:text-blue-400 transition"
                          title="Modifica"
                        >
                          <FiEdit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => { setDeleteId(vehicle.id); setShowConfirm(true); }}
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
                    {startIndex + 1}–{Math.min(startIndex + itemsPerPage, filteredVehicles.length)} di {filteredVehicles.length}
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
        title="Eliminare mezzo?"
        message="Sei sicuro di voler eliminare questo mezzo? Questa azione non può essere annullata."
        confirmLabel="Elimina"
        onConfirm={handleDelete}
        onCancel={() => { setShowConfirm(false); setDeleteId(null); }}
      />
    </div>
  );
}