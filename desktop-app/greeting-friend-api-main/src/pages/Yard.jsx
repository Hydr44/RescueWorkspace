/**
 * Yard Management Page
 * Gestione mezzi nel piazzale con tag specifici (sequestro, confisca, ecc.)
 * 
 * @author haxies
 * @created 2025
 */

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiTrash2, FiPlus, FiSearch, FiTruck, FiEdit, FiMapPin, FiCalendar, FiList, FiGrid } from "react-icons/fi";
import { supabaseBrowser } from "../lib/supabase-browser";
import { useOrg } from "../context/OrgContext";
import { useMultiSelect } from "@/hooks/useMultiSelect";
import MultiSelectActions from "@/components/ui/MultiSelectActions";
import SelectableCheckbox from "@/components/ui/SelectableCheckbox";

/* ---------- Tag / Status helpers ---------- */
const TAG_MAP = {
  sequestro:    { label: "Sequestro",    cls: "bg-red-500/10 text-red-400" },
  confisca:     { label: "Confisca",     cls: "bg-orange-500/10 text-orange-400" },
  demolizione:  { label: "Demolizione",  cls: "bg-slate-500/10 text-slate-300" },
  vendita:      { label: "Vendita",      cls: "bg-green-500/10 text-green-400" },
  manutenzione: { label: "Manutenzione", cls: "bg-blue-500/10 text-blue-400" },
  attesa:       { label: "Attesa",       cls: "bg-yellow-500/10 text-yellow-400" },
};

const STATUS_MAP = {
  attivo:           { label: "Attivo",          cls: "bg-emerald-500/10 text-emerald-400" },
  in_manutenzione:  { label: "Manutenzione",   cls: "bg-blue-500/10 text-blue-400" },
  venduto:          { label: "Venduto",         cls: "bg-purple-500/10 text-purple-400" },
  demolito:         { label: "Demolito",        cls: "bg-slate-500/10 text-slate-300" },
  rimosso:          { label: "Rimosso",         cls: "bg-red-500/10 text-red-400" },
};

const Badge = ({ map, value }) => {
  const cfg = map[value] || { label: value || "—", cls: "bg-slate-500/10 text-slate-400" };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${cfg.cls}`}>{cfg.label}</span>;
};

/* ---------- Confirm ---------- */
function Confirm({ open, onCancel, onOk, text = "Confermi l'operazione?" }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center">
      <div className="absolute inset-0 bg-black/60" onClick={onCancel} />
      <div className="relative w-full max-w-sm rounded-xl border border-[#243044] bg-[#1a2536] p-4">
        <div className="font-medium mb-2">Conferma</div>
        <div className="text-xs text-slate-400 mb-4">{text}</div>
        <div className="flex justify-end gap-2">
          <button className="px-3 py-1.5 text-xs text-slate-300 bg-[#141c27] border border-[#243044] rounded-lg hover:bg-[#243044] transition-colors" onClick={onCancel}>Annulla</button>
          <button className="px-3 py-1.5 text-xs text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors" onClick={onOk}>Conferma</button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Days helper ---------- */
const getDaysInYard = (dataIngresso) => {
  if (!dataIngresso) return "—";
  const days = Math.floor((Date.now() - new Date(dataIngresso).getTime()) / (1000 * 60 * 60 * 24));
  if (days === 0) return "Oggi";
  if (days === 1) return "1 giorno";
  return `${days}gg`;
};

/* ---------- YardMapView ---------- */
function YardMapView({ vehicles, navigate, onEdit, onDelete }) {
  // Raggruppa per zona (o "Zona non assegnata" se mancante)
  const zoneGroups = useMemo(() => {
    const map = {};
    for (const v of vehicles) {
      const key = v.zona ? v.zona.trim().toUpperCase() : "—";
      if (!map[key]) map[key] = [];
      map[key].push(v);
    }
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [vehicles]);

  if (vehicles.length === 0) {
    return (
      <div className="text-center py-16 text-slate-500">
        <FiGrid className="w-8 h-8 mx-auto mb-2 opacity-30" />
        <p className="text-sm">Nessun veicolo da mostrare con i filtri selezionati</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {zoneGroups.map(([zona, veicoli]) => (
        <div key={zona} className="bg-[#1a2536] rounded-xl border border-[#243044] overflow-hidden">
          {/* Header zona */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-[#141c27] border-b border-[#243044]">
            <div className="flex items-center gap-2">
              <FiMapPin className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                Zona {zona}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 font-medium">
                {veicoli.length} mezz{veicoli.length === 1 ? "o" : "i"}
              </span>
            </div>
          </div>
          {/* Griglia veicoli */}
          <div className="p-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5">
            {veicoli.map(v => {
              const tagCfg = TAG_MAP[v.tag] || { label: v.tag || "—", cls: "bg-slate-500/10 text-slate-400" };
              const statusCfg = STATUS_MAP[v.stato] || { label: v.stato || "—", cls: "bg-slate-500/10 text-slate-400" };
              const days = v.data_ingresso
                ? Math.floor((Date.now() - new Date(v.data_ingresso).getTime()) / 86400000)
                : null;
              const isLong = days !== null && days > 60;
              return (
                <div
                  key={v.id}
                  className={`relative group flex flex-col gap-1.5 p-2.5 rounded-lg border cursor-pointer transition-all hover:border-blue-500/40 hover:bg-[#243044]/60 ${
                    isLong ? "border-amber-500/30 bg-amber-500/5" : "border-[#243044] bg-[#141c27]"
                  }`}
                  onClick={() => navigate(`/piazzale/${v.id}`)}
                >
                  {/* Targa */}
                  <div className="flex items-center gap-1.5">
                    <FiTruck className="w-3 h-3 text-slate-500 flex-shrink-0" />
                    <span className="text-xs font-semibold text-slate-200 truncate">{v.targa || "N/A"}</span>
                  </div>
                  {/* Marca/modello */}
                  {(v.marca || v.modello) && (
                    <p className="text-[10px] text-slate-500 truncate leading-none">
                      {[v.marca, v.modello].filter(Boolean).join(" ")}
                    </p>
                  )}
                  {/* Posizione */}
                  {v.posizione && (
                    <p className="text-[10px] text-slate-600 truncate leading-none">
                      Pos. {v.posizione}
                    </p>
                  )}
                  {/* Tag + status */}
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${tagCfg.cls}`}>
                      {tagCfg.label}
                    </span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${statusCfg.cls}`}>
                      {statusCfg.label}
                    </span>
                  </div>
                  {/* Permanenza */}
                  {days !== null && (
                    <div className={`flex items-center gap-1 text-[9px] ${isLong ? "text-amber-400" : "text-slate-600"}`}>
                      <FiCalendar className="w-2.5 h-2.5" />
                      {days === 0 ? "Oggi" : `${days}gg`}
                      {isLong && " ⚠️"}
                    </div>
                  )}
                  {/* Azioni hover */}
                  <div className="absolute top-1.5 right-1.5 hidden group-hover:flex gap-0.5">
                    <button
                      onClick={e => { e.stopPropagation(); onEdit(v.id); }}
                      className="p-1 rounded bg-[#1a2536] text-slate-500 hover:text-blue-400 transition-colors"
                      title="Modifica"
                    >
                      <FiEdit className="w-2.5 h-2.5" />
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); onDelete(v.id); }}
                      className="p-1 rounded bg-[#1a2536] text-slate-500 hover:text-red-400 transition-colors"
                      title="Rimuovi"
                    >
                      <FiTrash2 className="w-2.5 h-2.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------- Pagina ---------- */
export default function Yard() {
  const navigate = useNavigate();
  const supabase = supabaseBrowser();
  const { orgId } = useOrg();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [filterTag, setFilterTag] = useState("all");
  const [viewMode, setViewMode] = useState("lista"); // lista | mappa
  const [confirmId, setConfirmId] = useState(null);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);

  // Fetch
  const fetchYard = async () => {
    if (!orgId) { setRows([]); return; }
    try {
      const { data, error } = await supabase
        .from("yard_vehicles")
        .select("*")
        .eq("org_id", orgId)
        .order("data_ingresso", { ascending: false });
      if (error) throw error;
      setRows(data || []);
    } catch (err) {
      console.error("Error loading yard vehicles:", err);
      setRows([]);
    }
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      await fetchYard();
      setLoading(false);
    })();
  }, [orgId]); // eslint-disable-line

  // Realtime
  useEffect(() => {
    if (!orgId) return;
    const ch = supabase
      .channel(`yard-scope:${orgId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "yard_vehicles", filter: `org_id=eq.${orgId}` }, fetchYard)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [orgId]); // eslint-disable-line

  // Tag counts
  const tagCounts = useMemo(() => {
    const counts = {};
    for (const v of rows) {
      const t = v.tag || "altro";
      counts[t] = (counts[t] || 0) + 1;
    }
    return counts;
  }, [rows]);

  // Filtered
  const filtered = useMemo(() => {
    let result = rows;
    if (filterTag !== "all") result = result.filter(v => (v.tag || "altro") === filterTag);
    const s = q.trim().toLowerCase();
    if (s) {
      result = result.filter(v =>
        (v.targa || "").toLowerCase().includes(s) ||
        (v.marca || "").toLowerCase().includes(s) ||
        (v.modello || "").toLowerCase().includes(s) ||
        (v.zona || "").toLowerCase().includes(s) ||
        (v.numero_pratica || "").toLowerCase().includes(s) ||
        (v.numero_chiave || "").toLowerCase().includes(s)
      );
    }
    return result;
  }, [rows, q, filterTag]);

  // Multi-select
  const {
    selectedCount,
    isSelected,
    isAllSelected,
    isSomeSelected,
    toggleSelect,
    toggleSelectAll,
    reset: resetSelection,
    getSelectedIds,
    selectedItems,
  } = useMultiSelect(filtered, (item) => item?.id);

  // Delete single
  const doDelete = async () => {
    if (!confirmId) return;
    try {
      const { error } = await supabase.from("yard_vehicles").delete().eq("id", confirmId);
      if (error) throw error;
      setRows(prev => prev.filter(v => v.id !== confirmId));
    } catch (err) {
      console.error("Error deleting yard vehicle:", err);
      alert("Errore durante l'eliminazione.");
    } finally {
      setConfirmId(null);
    }
  };

  // Delete bulk
  const handleBulkDelete = async () => {
    const ids = getSelectedIds();
    if (ids.length === 0) { setConfirmBulkDelete(false); return; }
    try {
      const { error } = await supabase.from("yard_vehicles").delete().in("id", ids);
      if (error) throw error;
      setRows(prev => prev.filter(v => !ids.includes(v.id)));
      resetSelection();
    } catch (err) {
      console.error("Bulk delete failed:", err);
      alert("Errore durante l'eliminazione multipla.");
      await fetchYard();
      resetSelection();
    } finally {
      setConfirmBulkDelete(false);
    }
  };

  // Export CSV
  const handleBulkExport = () => {
    const items = selectedItems;
    if (items.length === 0) return;
    const headers = ["Targa", "Marca", "Modello", "Zona", "Tag", "Stato", "Pratica", "Chiave", "Data Ingresso"];
    const csvRows = items.map(v => [
      v.targa || "", v.marca || "", v.modello || "", v.zona || "",
      v.tag || "", v.stato || "", v.numero_pratica || "", v.numero_chiave || "",
      v.data_ingresso || ""
    ]);
    const csv = [headers.join(","), ...csvRows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `piazzale_${new Date().toISOString().split("T")[0]}.csv`;
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-100">Piazzale</h1>
          <p className="text-xs text-slate-500 mt-0.5">Gestisci i mezzi nel piazzale</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-3.5 h-3.5" />
            <input
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Cerca targa, modello, zona..."
              className="pl-9 pr-3 py-1.5 w-64 text-xs bg-[#141c27] border border-[#243044] rounded-lg text-slate-200 placeholder-slate-600 focus:ring-1 focus:ring-blue-500/40 outline-none"
            />
          </div>
          <div className="flex items-center rounded-lg border border-[#243044] bg-[#141c27] p-0.5">
            <button
              onClick={() => setViewMode("lista")}
              className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                viewMode === "lista" ? "bg-[#1a2536] text-slate-200" : "text-slate-500 hover:text-slate-300"
              }`}
            >
              <FiList className="w-3.5 h-3.5" /> Lista
            </button>
            <button
              onClick={() => setViewMode("mappa")}
              className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                viewMode === "mappa" ? "bg-[#1a2536] text-slate-200" : "text-slate-500 hover:text-slate-300"
              }`}
            >
              <FiGrid className="w-3.5 h-3.5" /> Mappa
            </button>
          </div>
          <button
            onClick={() => navigate("/piazzale/new")}
            disabled={!orgId}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 rounded-lg transition-colors disabled:cursor-not-allowed"
          >
            <FiPlus className="w-3.5 h-3.5" />
            Nuovo Mezzo
          </button>
        </div>
      </div>

      {/* Filtri Tag */}
      {orgId && (
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-300">Filtri:</span>
            <div className="flex gap-2">
              <button
                onClick={() => setFilterTag("all")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  filterTag === "all"
                    ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                    : "bg-[#141c27] text-slate-400 hover:bg-[#1a2536]"
                }`}
              >
                Tutti ({rows.length})
              </button>
              {Object.entries(TAG_MAP).map(([key, { label }]) => {
                const count = tagCounts[key] || 0;
                if (count === 0 && filterTag !== key) return null;
                return (
                  <button
                    key={key}
                    onClick={() => setFilterTag(filterTag === key ? "all" : key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      filterTag === key
                        ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                        : "bg-[#141c27] text-slate-400 hover:bg-[#1a2536]"
                    }`}
                  >
                    {label} ({count})
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex-1" />
          <div className="text-xs text-slate-500">
            {filtered.length} di {rows.length} mezzi
          </div>
        </div>
      )}

      {/* Vista Mappa: griglia per zone */}
      {!loading && viewMode === "mappa" && (
        <YardMapView
          vehicles={filtered}
          navigate={navigate}
          onEdit={(id) => navigate(`/piazzale/${id}/modifica`)}
          onDelete={(id) => setConfirmId(id)}
        />
      )}

      {/* Tabella */}
      {viewMode === "lista" && (loading ? (
        <div className="bg-[#1a2536] rounded-xl border border-[#243044] overflow-hidden">
          <div className="p-8">
            <div className="animate-pulse space-y-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <div className="h-4 bg-[#243044] rounded w-16" />
                  <div className="h-4 bg-[#243044] rounded w-24" />
                  <div className="h-4 bg-[#243044] rounded w-48" />
                  <div className="h-4 bg-[#243044] rounded w-20" />
                  <div className="h-4 bg-[#243044] rounded w-16" />
                  <div className="h-4 bg-[#243044] rounded w-16" />
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-[#1a2536] rounded-xl border border-[#243044] overflow-hidden">
          {/* Header Tabella */}
          <div className="bg-[#141c27] px-3 py-2 border-b border-[#243044]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <SelectableCheckbox
                  checked={isAllSelected}
                  indeterminate={isSomeSelected}
                  onChange={toggleSelectAll}
                  disabled={filtered.length === 0}
                />
                <h3 className="text-sm font-semibold text-slate-200">
                  Mezzi nel Piazzale ({filtered.length})
                </h3>
                {selectedCount > 0 && (
                  <span className="text-sm text-blue-400 font-medium">
                    {selectedCount} selezionati
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Tabella Compatta */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#141c27]">
                <tr>
                  <th className="text-left px-3 py-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider w-12" />
                  <th className="text-left px-3 py-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Mezzo</th>
                  <th className="text-left px-3 py-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Zona</th>
                  <th className="text-left px-3 py-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Tag</th>
                  <th className="text-left px-3 py-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Pratica</th>
                  <th className="text-left px-3 py-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Permanenza</th>
                  <th className="text-left px-3 py-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Stato</th>
                  <th className="text-right px-3 py-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Azioni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#243044]">
                {filtered.map(vehicle => (
                  <tr
                    key={vehicle.id}
                    className={`hover:bg-[#141c27] transition-colors ${isSelected(vehicle) ? "bg-blue-500/10" : ""}`}
                  >
                    <td className="px-3 py-2">
                      <SelectableCheckbox
                        checked={isSelected(vehicle)}
                        onChange={() => toggleSelect(vehicle)}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate(`/piazzale/${vehicle.id}`)}>
                        <div className="w-7 h-7 bg-[#141c27] rounded-lg flex items-center justify-center flex-shrink-0">
                          <FiTruck className="w-3.5 h-3.5 text-slate-400" />
                        </div>
                        <div>
                          <div className="text-xs font-medium text-slate-200 hover:text-blue-400 transition-colors">
                            {vehicle.targa || "N/A"}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {vehicle.marca && vehicle.modello ? `${vehicle.marca} ${vehicle.modello}` : "—"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <FiMapPin className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate max-w-[100px]">{vehicle.zona || "—"}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <Badge map={TAG_MAP} value={vehicle.tag} />
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-400 font-mono">
                      {vehicle.numero_pratica || "—"}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <FiCalendar className="w-3 h-3 flex-shrink-0" />
                        {getDaysInYard(vehicle.data_ingresso)}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <Badge map={STATUS_MAP} value={vehicle.stato} />
                    </td>
                    <td className="px-3 py-2 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => navigate(`/piazzale/${vehicle.id}/modifica`)}
                          className="p-2 text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                          title="Modifica"
                        >
                          <FiEdit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setConfirmId(vehicle.id)}
                          className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Rimuovi"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          {filtered.length > 0 && (
            <div className="bg-[#141c27] px-3 py-2 border-t border-[#243044]">
              <div className="flex items-center justify-between">
                <div className="text-xs text-slate-400">
                  {filtered.length} mezz{filtered.length === 1 ? "o" : "i"} nel piazzale
                </div>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Stato vuoto */}
      {viewMode === "lista" && !loading && orgId && filtered.length === 0 && (
        <div className="text-center py-10">
          <div className="w-14 h-14 bg-[#141c27] rounded-full flex items-center justify-center mx-auto mb-3">
            <FiTruck className="w-5 h-5 text-slate-500" />
          </div>
          <h3 className="text-xl font-semibold text-slate-200 mb-2">
            {q || filterTag !== "all" ? "Nessun mezzo trovato" : "Piazzale vuoto"}
          </h3>
          <p className="text-slate-400 mb-3">
            {q || filterTag !== "all" ? "Prova a modificare i filtri di ricerca" : "Inizia aggiungendo il primo mezzo al piazzale"}
          </p>
          {!q && filterTag === "all" && (
            <button
              onClick={() => navigate("/piazzale/new")}
              disabled={!orgId}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white font-medium rounded-lg transition-colors disabled:cursor-not-allowed"
            >
              <FiPlus className="w-3.5 h-3.5" />
              Aggiungi Primo Mezzo
            </button>
          )}
        </div>
      )}

      {/* Barra azioni bulk */}
      <MultiSelectActions
        selectedCount={selectedCount}
        onBulkDelete={() => setConfirmBulkDelete(true)}
        onBulkExport={handleBulkExport}
        onClearSelection={resetSelection}
      />

      {/* Conferma elimina singolo */}
      <Confirm
        open={confirmId != null}
        onCancel={() => setConfirmId(null)}
        onOk={doDelete}
        text="Rimuovere questo mezzo dal piazzale? L'azione non è reversibile."
      />

      {/* Conferma elimina bulk */}
      <Confirm
        open={confirmBulkDelete}
        onCancel={() => setConfirmBulkDelete(false)}
        onOk={handleBulkDelete}
        text={`Rimuovere ${selectedCount} mezz${selectedCount > 1 ? "i" : "o"} dal piazzale? L'azione non è reversibile.`}
      />
    </div>
  );
}