// src/pages/Transports.list.jsx - Versione pulita lista trasporti
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiTrash2, FiRefreshCcw, FiPlus, FiSearch, FiDownload } from "react-icons/fi";
import { supabaseBrowser } from "../lib/supabase-browser";
import { useOrg } from "../context/OrgContext";
import { useMultiSelect } from "../hooks/useMultiSelect";
import MultiSelectActions from "../components/ui/MultiSelectActions";
import SelectableCheckbox from "../components/ui/SelectableCheckbox";

const Badge = ({ status }) => {
  const cls =
    status === "new" ? "chip chip-indigo"
      : status === "assigned" ? "chip chip-amber"
      : status === "enroute" ? "chip chip-blue"
      : status === "done" ? "chip chip-emerald"
      : "chip chip-gray";
  const label = 
    status === "new" ? "Nuovo"
      : status === "assigned" ? "Assegnato"
      : status === "enroute" ? "In Viaggio"
      : status === "done" ? "Completato"
      : status;
  return <span className={cls}>{label}</span>;
};

function ConfirmDialog({ open, title, message, confirmLabel, onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onCancel} />
      <div className="relative w-full max-w-sm rounded-xl border border-[#243044] bg-[#1a2536] p-4">
        <div className="text-lg font-semibold mb-1">{title}</div>
        {message && <div className="text-sm text-slate-500 mb-4">{message}</div>}
        <div className="flex justify-end gap-2">
          <button className="btn btn-outline" onClick={onCancel}>No</button>
          <button className="btn btn-danger" onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

export default function Transports() {
  const navigate = useNavigate();
  const supabase = supabaseBrowser();
  const { orgId, userId, role } = useOrg();
  
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [confirmId, setConfirmId] = useState(null);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);

  // Selezione multipla
  const {
    selectedItems,
    selectedCount,
    isSelected,
    isAllSelected,
    isSomeSelected,
    toggleSelect,
    toggleSelectAll,
    reset: resetSelection,
    getSelectedIds,
  } = useMultiSelect(filtered, (item) => item?.id);

  // Load transports
  useEffect(() => {
    if (!orgId) {
      setRows([]);
      setLoading(false);
      return;
    }
    
    loadTransports();
  }, [orgId]);

  async function loadTransports() {
    if (!orgId) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("transports")
        .select("id, pickup_address, dropoff_address, status, notes, created_at")
        .eq("org_id", orgId)
        .order("created_at", { ascending: false });
        
      if (error) throw error;
      setRows(data || []);
    } catch (e) {
      console.error("Error loading transports:", e);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  // Actions
  const requestDelete = (id) => setConfirmId(id);
  
  const confirmDelete = async () => {
    const id = confirmId;
    if (!id || !orgId) return;
    
    try {
      setRows(prev => prev.filter(r => r.id !== id));
      const { error } = await supabase
        .from("transports")
        .delete()
        .eq("id", id)
        .eq("org_id", orgId);
        
      if (error) throw error;
    } catch (err) {
      console.error("Delete failed:", err);
      await loadTransports();
    } finally {
      setConfirmId(null);
    }
  };

  const cycleStatus = async (id) => {
    const order = ["new", "assigned", "enroute", "done"];
    const row = rows.find(r => r.id === id);
    if (!row) return;
    
    const next = order[(order.indexOf(row.status || "new") + 1) % order.length];
    
    try {
      setRows(prev => prev.map(r => r.id === id ? { ...r, status: next } : r));
      
      const { error } = await supabase
        .from("transports")
        .update({ status: next })
        .eq("id", id)
        .eq("org_id", orgId);
        
      if (error) throw error;
    } catch (e) {
      console.error("Status update failed:", e);
      await loadTransports();
    }
  };

  // Azioni bulk
  const handleBulkDelete = async () => {
    const ids = getSelectedIds();
    if (ids.length === 0 || !orgId) return;

    try {
      // Rimuovi localmente
      setRows(prev => prev.filter(r => !ids.includes(r.id)));
      
      // Elimina dal database
      const { error } = await supabase
        .from("transports")
        .delete()
        .eq("org_id", orgId)
        .in("id", ids);

      if (error) throw error;

      // Reset selezione
      resetSelection();
      setConfirmBulkDelete(false);
    } catch (err) {
      console.error("Bulk delete failed:", err);
      await loadTransports();
      resetSelection();
    }
  };

  const handleBulkExport = async () => {
    const selected = selectedItems;
    if (selected.length === 0) return;

    // Esporta come CSV
    const headers = ["ID", "Da", "A", "Stato", "Note", "Data Creazione"];
    const rows = selected.map(t => [
      t.id,
      t.pickup_address || "",
      t.dropoff_address || "",
      t.status || "",
      t.notes || "",
      new Date(t.created_at).toLocaleString('it-IT')
    ]);

    const csv = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    // Download
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `trasporti_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return rows.filter(r => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (!term) return true;
      const text = [
        r.pickup_address,
        r.dropoff_address,
        r.status,
        r.notes
      ].filter(Boolean).join(" ").toLowerCase();
      return text.includes(term);
    });
  }, [rows, q, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-blue-600 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
               Trasporti
            </h1>
            <p className="text-white/80 text-sm mt-1">
              Gestisci tutti i trasporti e consegne
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate("/trasporti/new")}
            className="btn bg-[#1a2536] text-indigo-600 hover:bg-[#141c27] font-semibold shadow-md px-6 py-3 rounded-xl"
          >
            <FiPlus className="mr-2" /> Nuovo trasporto
          </button>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="bg-[#1a2536] rounded-xl border border-[#243044] p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
            <input
              placeholder="Cerca indirizzo, note..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-lg border border-[#243044] bg-transparent text-sm focus:ring-2 ring-indigo-500 outline-none"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500 whitespace-nowrap">Stato:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-[#243044] bg-transparent text-sm px-4 py-3 focus:ring-2 ring-indigo-500 outline-none min-w-[140px]"
            >
              <option value="all">Tutti</option>
              <option value="new">Nuovo</option>
              <option value="assigned">Assegnato</option>
              <option value="enroute">In Viaggio</option>
              <option value="done">Completato</option>
            </select>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="bg-[#1a2536] rounded-xl border border-[#243044] overflow-hidden">
        {/* Header con checkbox seleziona tutto */}
        {!loading && filtered.length > 0 && (
          <div className="border-b border-[#243044] p-4 bg-[#141c27]/50">
            <div className="flex items-center gap-3">
              <SelectableCheckbox
                checked={isAllSelected}
                indeterminate={isSomeSelected}
                onChange={toggleSelectAll}
              />
              <span className="text-sm text-slate-400">
                {selectedCount > 0 
                  ? `${selectedCount} di ${filtered.length} selezionati`
                  : `Seleziona tutti (${filtered.length} elementi)`
                }
              </span>
            </div>
          </div>
        )}

        {loading && (
          <div className="px-4 py-8 text-center text-slate-500">
            Caricamento...
          </div>
        )}
        
        {!loading && filtered.length === 0 && (
          <div className="px-4 py-10 text-center text-slate-500">
            {q ? "Nessun risultato trovato" : "Nessun trasporto"}
          </div>
        )}
        
        {!loading && filtered.map(r => (
          <div 
            key={r.id} 
            className={`border-b border-[#243044] p-4 hover:bg-[#141c27] transition-colors ${
              isSelected(r) ? 'bg-blue-500/10' : ''
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                {/* Checkbox selezione */}
                <div className="pt-1">
                  <SelectableCheckbox
                    checked={isSelected(r)}
                    onChange={() => toggleSelect(r)}
                  />
                </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <Badge status={r.status} />
                  <span className="text-xs text-slate-500">#{r.id}</span>
                </div>
                
                <div className="space-y-1">
                  <div className="text-sm">
                    <span className="text-slate-500">Da:</span>{" "}
                    <span className="font-medium">{r.pickup_address || "-"}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-slate-500">A:</span>{" "}
                    <span className="font-medium">{r.dropoff_address || "-"}</span>
                  </div>
                  
                  {r.notes && (
                    <div className="text-xs text-slate-500 mt-2 line-clamp-2">
                      {r.notes}
                    </div>
                  )}
                  
                  <div className="text-xs text-slate-500 mt-2">
                    {new Date(r.created_at).toLocaleString('it-IT')}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => cycleStatus(r.id)}
                  className="btn btn-outline btn-sm"
                  title="Cambia stato"
                >
                  <FiRefreshCcw className="h-4 w-4" />
                </button>
                <button
                  onClick={() => requestDelete(r.id)}
                  className="btn btn-outline-red btn-sm"
                  disabled={role !== "owner"}
                  title="Elimina"
                >
                  <FiTrash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Barra azioni bulk */}
      <MultiSelectActions
        selectedCount={selectedCount}
        onBulkDelete={() => setConfirmBulkDelete(true)}
        onBulkExport={handleBulkExport}
        onClearSelection={resetSelection}
      />

      {/* Delete Confirmation Singolo */}
      <ConfirmDialog
        open={confirmId != null}
        title="Eliminare questo trasporto?"
        message="Questa azione non può essere annullata."
        confirmLabel="Elimina"
        onConfirm={confirmDelete}
        onCancel={() => setConfirmId(null)}
      />

      {/* Delete Confirmation Bulk */}
      <ConfirmDialog
        open={confirmBulkDelete}
        title={`Eliminare ${selectedCount} trasporti?`}
        message={`Sei sicuro di voler eliminare ${selectedCount} trasporto${selectedCount > 1 ? 'i' : ''}? Questa azione non può essere annullata.`}
        confirmLabel={`Elimina ${selectedCount}`}
        onConfirm={handleBulkDelete}
        onCancel={() => setConfirmBulkDelete(false)}
      />
    </div>
  );
}

