/**
 * Transports List Page
 * Gestione lista trasporti con filtri e azioni CRUD
 * 
 * @author haxies
 * @created 2025
 */

import { useEffect, useMemo, useState, useCallback, memo } from "react";
import { useNavigate } from "react-router-dom";
import { FiTrash2, FiPlus, FiSearch, FiTruck, FiEdit, FiDownload, FiFileText, FiClock, FiCheckCircle } from "react-icons/fi";
import { supabaseBrowser } from "../lib/supabase-browser";
import { useOrg } from "../context/OrgContext";
import { DocumentGenerationService } from "../lib/services/documentGenerationService";
import { ExportTemplateService } from "../lib/services/exportTemplateService";
import { useTransportsCache, useTransportMutations } from "../hooks/useTransportsCache";
import RealtimeNotifications from "../components/RealtimeNotifications";

const Badge = memo(({ status }) => {
  const getStatusStyles = (status) => {
    switch (status) {
      case "new":
        return "bg-blue-500/10 text-blue-400";
      case "assigned":
        return "bg-amber-500/10 text-amber-400";
      case "enroute":
        return "bg-purple-500/10 text-purple-400";
      case "done":
        return "bg-emerald-500/10 text-emerald-400";
      default:
        return "bg-[#141c27] text-slate-200";
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "new": return "Nuovo";
      case "assigned": return "Assegnato";
      case "enroute": return "In Viaggio";
      case "done": return "Completato";
      default: return status;
    }
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusStyles(status)}`}>
      {getStatusLabel(status)}
    </span>
  );
});

const TransportRow = memo(function TransportRow({ transport, onEdit, onAskDelete, selected, onToggleSelect }) {
  const handleEdit = useCallback(() => onEdit(transport.id), [onEdit, transport.id]);
  const handleAskDelete = useCallback(() => onAskDelete(transport.id), [onAskDelete, transport.id]);

  return (
    <tr className={`transition-colors ${selected ? 'bg-blue-500/5' : 'hover:bg-[#141c27]'}`}>
      <td className="px-4 py-3.5">
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onToggleSelect(transport.id)}
          className="w-4 h-4 text-blue-600 bg-[#1a2536] border-[#243044] rounded focus:ring-blue-500/40 focus:ring-1"
        />
      </td>
      <td className="px-4 py-3.5">
        <span className="text-sm font-mono text-slate-300">{transport.number ? `TR${String(transport.number).padStart(4, '0')}` : `#${transport.id.slice(0, 6)}`}</span>
      </td>
      <td className="px-4 py-3.5 text-sm font-medium text-slate-200">
        {transport.client?.nome || transport.client?.codice || transport.customer_name || (transport.client?.number ? `CL${String(transport.client.number).padStart(4, '0')}` : (transport.client_id ? `#${transport.client_id.slice(0,6)}` : "N/A"))}
      </td>
      <td className="px-4 py-3.5 text-sm text-slate-400">{transport.pickup_address || "N/A"}</td>
      <td className="px-4 py-3.5 text-sm text-slate-400">{transport.dropoff_address || "N/A"}</td>
      <td className="px-4 py-3.5"><Badge status={transport.status} /></td>
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-2">
          <button
            onClick={handleEdit}
            className="p-1 text-slate-500 hover:text-blue-600 transition-colors"
            title="Modifica"
          >
            <FiEdit className="w-4 h-4" />
          </button>
          <button
            onClick={handleAskDelete}
            className="p-1 text-slate-500 hover:text-red-600 transition-colors"
            title="Elimina"
          >
            <FiTrash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
});

function ConfirmDialog({ open, title, message, confirmLabel, onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-sm rounded-xl border border-[#243044]  bg-[#141c27] p-6 ">
        <div className="text-lg font-semibold text-slate-200 mb-2">{title}</div>
        {message && <div className="text-sm text-slate-400 mb-6">{message}</div>}
        <div className="flex justify-end gap-3">
          <button 
            className="px-4 py-2 text-sm font-medium text-slate-300 bg-[#141c27] rounded-lg hover:bg-[#243044]  transition-colors"
            onClick={onCancel}
          >
            Annulla
          </button>
          <button 
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Transports() {
  const navigate = useNavigate();
  const supabase = supabaseBrowser();
  const { orgId } = useOrg();
  const isDev = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DEV;
  
  // State per UI
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [templates, setTemplates] = useState([]);
  const [exporting, setExporting] = useState(false);
  const [statusCounts, setStatusCounts] = useState({ new: 0, assigned: 0, enroute: 0, done: 0 });
  const [deleteError, setDeleteError] = useState(null);
  
  // Selezione multipla
  const [selectedIds, setSelectedIds] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  
  // Hook cache Redis per trasporti
  const { 
    transports, 
    totalCount, 
    loading, 
    error, 
    refresh: refreshTransports,
    getCacheStats 
  } = useTransportsCache(orgId, {
    status: filterStatus,
    searchTerm: debouncedSearchTerm,
    page: currentPage,
    itemsPerPage
  });
  
  // Hook per mutations con invalidazione cache automatica
  const { deleteTransport, deleting } = useTransportMutations(orgId);

  // Callback stabili
  const onEdit = useCallback((id) => {
    navigate(`/trasporti/new?id=${id}`);
  }, [navigate]);

  const onAskDelete = useCallback((id) => {
    setDeleteId(id);
    setShowConfirm(true);
  }, []);

  // Selezione multipla handlers
  const toggleSelect = useCallback((id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectedIds.length === transports.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(transports.map(t => t.id));
    }
  }, [selectedIds.length, transports]);

  const clearSelection = useCallback(() => {
    setSelectedIds([]);
  }, []);

  const handleBulkDelete = useCallback(async () => {
    if (selectedIds.length === 0) return;
    setShowBulkActions(true);
  }, [selectedIds.length]);

  const confirmBulkDelete = useCallback(async () => {
    try {
      for (const id of selectedIds) {
        await deleteTransport(id);
      }
      setSelectedIds([]);
      setShowBulkActions(false);
    } catch (err) {
      console.error('Bulk delete error:', err);
    }
  }, [selectedIds, deleteTransport]);

  const handleBulkExport = useCallback(async () => {
    if (selectedIds.length === 0) return;
    setExporting(true);
    try {
      const selectedTransports = transports.filter(t => selectedIds.includes(t.id));
      for (const transport of selectedTransports) {
        await handleExportPDF(transport);
      }
    } finally {
      setExporting(false);
    }
  }, [selectedIds, transports]);


  // Debounce ricerca
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearchTerm(searchTerm.trim()), 350);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // Reset pagina quando cambiano filtri o page size
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, filterStatus, itemsPerPage]);

  // Carica conteggi per stato (una volta)
  useEffect(() => {
    if (!orgId) return;
    const loadCounts = async () => {
      try {
        const statuses = ['new', 'assigned', 'enroute', 'done'];
        const results = await Promise.all(
          statuses.map(s => supabase.from('transports').select('id', { count: 'exact', head: true }).eq('org_id', orgId).eq('status', s))
        );
        const counts = {};
        statuses.forEach((s, i) => { counts[s] = results[i].count || 0; });
        setStatusCounts(counts);
      } catch (err) {
        if (isDev) console.error('Error loading counts:', err);
      }
    };
    loadCounts();
  }, [orgId, supabase]);

  // Trasporti caricati automaticamente da useTransportsCache hook
  // Cache Redis con TTL 5 minuti, invalidazione automatica su update/delete

  // Carica template per export
  useEffect(() => {
    if (!orgId) return;
    
    const loadTemplates = async () => {
      try {
        const templatesData = await ExportTemplateService.getByCategory(orgId, 'transports');
        setTemplates(templatesData);
      } catch (err) {
        if (isDev) console.error("Error loading templates:", err);
      }
    };

    loadTemplates();
  }, [orgId]);

  // Funzioni di export
  const handleExportPDF = async () => {
    if (!orgId || templates.length === 0) return;
    
    try {
      setExporting(true);
      
      // Trova template PDF di default per trasporti
      const pdfTemplate = templates.find(t => t.document_type === 'pdf' && t.is_default) || 
                         templates.find(t => t.document_type === 'pdf');
      
      if (!pdfTemplate) {
        alert('Nessun template PDF disponibile per i trasporti');
        return;
      }
      
      // Carica dati azienda dalla tab "Company" (localStorage)
      let companyData = null;
      try {
        const savedSettings = localStorage.getItem('rm-settings');
        if (savedSettings) {
          const parsed = JSON.parse(savedSettings);
          companyData = parsed.company || null;
        }
      } catch (error) {
        console.warn('Error loading company data:', error);
      }

      const document = await DocumentGenerationService.generateDocument({
        templateId: pdfTemplate.id,
        orgId,
        data: filteredTransports,
        fileName: `trasporti_${new Date().toISOString().slice(0, 10)}`,
        includeLogo: true,
        includeCompanyInfo: true,
        includeLegalNotes: false,
        // Passa dati azienda dalla tab "Company"
        companyName: companyData?.name,
        companyAddress: companyData?.address,
        companyZip: companyData?.zip,
        companyCity: companyData?.city,
        companyPhone: companyData?.phone,
        companyEmail: companyData?.email,
        companyVat: companyData?.vat
      });
      
      DocumentGenerationService.downloadDocument(document);
      
      } catch (error) {
        if (isDev) console.error('Error exporting PDF:', error);
      alert('Errore nell\'export del PDF');
    } finally {
      setExporting(false);
    }
  };

  const handleExportCSV = async () => {
    if (!orgId || templates.length === 0) return;
    
    try {
      setExporting(true);
      
      // Trova template CSV di default per trasporti
      const csvTemplate = templates.find(t => t.document_type === 'csv' && t.is_default) || 
                         templates.find(t => t.document_type === 'csv');
      
      if (!csvTemplate) {
        alert('Nessun template CSV disponibile per i trasporti');
        return;
      }
      
      const document = await DocumentGenerationService.generateDocument({
        templateId: csvTemplate.id,
        orgId,
        data: filteredTransports,
        fileName: `trasporti_${new Date().toISOString().slice(0, 10)}`,
        includeLogo: false,
        includeCompanyInfo: false,
        includeLegalNotes: false
      });
      
      DocumentGenerationService.downloadDocument(document);
      
      } catch (error) {
        if (isDev) console.error('Error exporting CSV:', error);
      alert('Errore nell\'export del CSV');
    } finally {
      setExporting(false);
    }
  };

  // Già filtrati server-side
  const filteredTransports = useMemo(() => transports, [transports]);

  // Paginazione
  const totalPages = Math.max(1, Math.ceil(totalCount / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTransports = filteredTransports; // già paginati server-side

  // Elimina trasporto
  const confirmDelete = async () => {
    if (!deleteId) return;
    
    try {
      // Usa hook con invalidazione cache automatica
      const result = await deleteTransport(deleteId);
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      setShowConfirm(false);
      setDeleteId(null);
      setDeleteError(null);
      
      // Cache già invalidata automaticamente da deleteTransport
      // I dati si ricaricano automaticamente tramite useTransportsCache
    } catch (err) {
      if (isDev) console.error("Error deleting transport:", err);
      setDeleteError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
          <div className="flex items-center justify-between">
            <div>
              <div className="h-6 w-32 bg-[#243044] rounded" />
              <div className="h-3 w-48 bg-[#1a2536] rounded mt-2" />
            </div>
            <div className="h-9 w-36 bg-[#243044] rounded-lg" />
          </div>
          <div className="flex gap-3">
            <div className="h-10 flex-1 bg-[#1a2536] rounded-lg border border-[#243044]" />
            <div className="h-10 w-40 bg-[#1a2536] rounded-lg border border-[#243044]" />
          </div>
          <div className="bg-[#1a2536] rounded-xl border border-[#243044] overflow-hidden">
            <div className="h-11 bg-[#141c27] border-b border-[#243044]" />
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-3.5 border-b border-[#243044]">
                <div className="h-4 w-10 bg-[#243044] rounded" />
                <div className="h-4 w-28 bg-[#243044] rounded" />
                <div className="h-4 w-36 bg-[#1a2536] rounded flex-1" />
                <div className="h-4 w-36 bg-[#1a2536] rounded flex-1" />
                <div className="h-5 w-20 bg-blue-500/10 rounded-full" />
                <div className="h-4 w-14 bg-[#1a2536] rounded" />
              </div>
            ))}
          </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
        {/* Header compatto */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-slate-100">Trasporti</h1>
            <p className="text-slate-500 text-xs mt-0.5">
              {totalCount} trasporti totali
            </p>
          </div>
          <div className="flex items-center gap-2">
            {filteredTransports.length > 0 && (
              <>
                <button
                  onClick={handleExportPDF}
                  disabled={exporting || !templates.some(t => t.document_type === 'pdf')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg hover:bg-red-500/15 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <FiFileText className="w-3.5 h-3.5" />
                  PDF
                </button>
                <button
                  onClick={handleExportCSV}
                  disabled={exporting || !templates.some(t => t.document_type === 'csv')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg hover:bg-emerald-500/15 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <FiDownload className="w-3.5 h-3.5" />
                  CSV
                </button>
              </>
            )}
            <button
              onClick={() => navigate("/trasporti/new")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FiPlus className="w-3.5 h-3.5" />
              Nuovo Trasporto
            </button>
          </div>
        </div>

        {/* KPI Status Cards */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { key: 'new',      label: 'Nuovi',      icon: FiClock,       iconBox: 'bg-blue-500/10',   iconColor: 'text-blue-400',    activeBorder: 'border-blue-500/40 ring-1 ring-blue-500/20',   badgeCls: 'bg-blue-500/10 text-blue-400',    count: statusCounts.new },
            { key: 'assigned', label: 'Assegnati',   icon: FiTruck,       iconBox: 'bg-amber-500/10',  iconColor: 'text-amber-400',   activeBorder: 'border-amber-500/40 ring-1 ring-amber-500/20', badgeCls: 'bg-amber-500/10 text-amber-400',  count: statusCounts.assigned },
            { key: 'enroute',  label: 'In Viaggio',  icon: FiTruck,       iconBox: 'bg-purple-500/10', iconColor: 'text-purple-400',  activeBorder: 'border-purple-500/40 ring-1 ring-purple-500/20',badgeCls: 'bg-purple-500/10 text-purple-400',count: statusCounts.enroute },
            { key: 'done',     label: 'Completati',  icon: FiCheckCircle, iconBox: 'bg-emerald-500/10',iconColor: 'text-emerald-400', activeBorder: 'border-emerald-500/40 ring-1 ring-emerald-500/20',badgeCls: 'bg-emerald-500/10 text-emerald-400',count: statusCounts.done },
          ].map(({ key, label, icon: Icon, iconBox, iconColor, activeBorder, badgeCls, count }) => (
            <button
              key={key}
              onClick={() => setFilterStatus(filterStatus === key ? 'all' : key)}
              className={`relative bg-[#1a2536] rounded-xl border p-3 text-left transition-all duration-150 ${
                filterStatus === key ? activeBorder : 'border-[#243044] hover:border-[#243044]/80'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${iconBox}`}>
                  <Icon className={`w-3.5 h-3.5 ${iconColor}`} />
                </div>
                {filterStatus === key && (
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-medium ${badgeCls}`}>Filtro attivo</span>
                )}
              </div>
              <p className="text-xl font-semibold text-slate-100">{count}</p>
              <p className="text-[11px] text-slate-500">{label}</p>
            </button>
          ))}
        </div>

        {/* Filtri e Ricerca */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
            <input
              type="text"
              placeholder="Cerca per cliente, indirizzo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-[#243044] rounded-lg bg-[#1a2536] text-slate-200 placeholder-slate-600 focus:ring-1 focus:ring-blue-500/40 focus:border-blue-500/40 outline-none transition-colors"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 text-sm border border-[#243044] rounded-lg bg-[#1a2536] text-slate-300 focus:ring-1 focus:ring-blue-500/40 outline-none transition-colors"
          >
            <option value="all">Tutti gli stati</option>
            <option value="new">Nuovo</option>
            <option value="assigned">Assegnato</option>
            <option value="enroute">In Viaggio</option>
            <option value="done">Completato</option>
          </select>
        </div>

        {/* Barra Azioni Bulk */}
        {selectedIds.length > 0 && (
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-blue-300">
                {selectedIds.length} {selectedIds.length === 1 ? 'trasporto selezionato' : 'trasporti selezionati'}
              </span>
              <button
                onClick={clearSelection}
                className="text-xs text-blue-400 hover:text-blue-300 underline"
              >
                Deseleziona tutto
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleBulkExport}
                disabled={exporting}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg hover:bg-emerald-500/15 disabled:opacity-50 transition-colors"
              >
                <FiDownload className="w-3.5 h-3.5" />
                Esporta PDF
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={deleting}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg hover:bg-red-500/15 disabled:opacity-50 transition-colors"
              >
                <FiTrash2 className="w-3.5 h-3.5" />
                Elimina
              </button>
            </div>
          </div>
        )}

        {/* Lista Trasporti */}
        <div className="bg-[#1a2536] rounded-xl border border-[#243044] overflow-hidden">

          {/* Tabella */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#141c27]">
                <tr>
                  <th className="px-4 py-3 w-12">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === paginatedTransports.length && paginatedTransports.length > 0}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 text-blue-600 bg-[#1a2536] border-[#243044] rounded focus:ring-blue-500/40 focus:ring-1"
                    />
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">ID</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Cliente</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Partenza</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Arrivo</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Stato</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Azioni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#243044]">
                {paginatedTransports.map((transport) => (
                  <TransportRow 
                    key={transport.id} 
                    transport={transport} 
                    onEdit={onEdit} 
                    onAskDelete={onAskDelete}
                    selected={selectedIds.includes(transport.id)}
                    onToggleSelect={toggleSelect}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {filteredTransports.length === 0 && (
            <div className="text-center py-16">
              <div className="w-12 h-12 bg-[#243044] rounded-xl flex items-center justify-center mx-auto mb-3">
                <FiTruck className="w-6 h-6 text-slate-500" />
              </div>
              <p className="text-sm font-medium text-slate-300 mb-1">
                Nessun trasporto trovato
              </p>
              <p className="text-xs text-slate-500 mb-4">
                {searchTerm || filterStatus !== "all" 
                  ? "Prova a modificare i filtri di ricerca"
                  : "Inizia creando il tuo primo trasporto"
                }
              </p>
              {!searchTerm && filterStatus === "all" && (
                <button
                  onClick={() => navigate("/trasporti/new")}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <FiPlus className="w-3.5 h-3.5" />
                  Nuovo Trasporto
                </button>
              )}
            </div>
          )}

          {/* Paginazione */}
          {totalCount > 0 && (
            <div className="px-4 py-3 border-t border-[#243044] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-500">
                  {Math.min(startIndex + 1, totalCount)}-{Math.min(endIndex, totalCount)} di {totalCount}
                </span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                  className="px-2 py-1 text-xs border border-[#243044] rounded bg-[#141c27] text-slate-400 outline-none"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
              {totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-2.5 py-1 text-xs border border-[#243044] rounded bg-[#1a2536] text-slate-400 hover:bg-[#1a2536]/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    ←
                  </button>
                  <span className="px-2 text-xs text-slate-500">
                    {currentPage}/{totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-2.5 py-1 text-xs border border-[#243044] rounded bg-[#1a2536] text-slate-400 hover:bg-[#1a2536]/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="mt-4 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 flex items-center gap-2">
            <span className="text-red-400 text-xs">⚠ {error}</span>
          </div>
        )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={showConfirm}
        title="Elimina Trasporto"
        message="Sei sicuro di voler eliminare questo trasporto? Questa azione non può essere annullata."
        confirmLabel="Elimina"
        onConfirm={confirmDelete}
        onCancel={() => {
          setShowConfirm(false);
          setDeleteId(null);
        }}
      />

      {/* Bulk Delete Confirm */}
      <ConfirmDialog
        open={showBulkActions}
        title={`Elimina ${selectedIds.length} Trasporti`}
        message={`Sei sicuro di voler eliminare ${selectedIds.length} trasporti? Questa azione non può essere annullata.`}
        confirmLabel="Elimina Tutti"
        onConfirm={confirmBulkDelete}
        onCancel={() => setShowBulkActions(false)}
      />

      {/* Real-time Notifications */}
      <RealtimeNotifications 
        orgId={orgId}
        onTransportChange={refreshTransports}
      />
    </div>
  );
}