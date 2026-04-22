import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  FiPlus, FiSearch, FiRefreshCw, FiFileText, FiEdit2, FiTrash2,
  FiCheckCircle, FiTruck, FiClock, FiLogIn, FiChevronLeft, FiChevronRight,
  FiEye, FiAlertCircle, FiXCircle, FiSend, FiDownload, FiPrinter
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase-browser';
import rvfuIcon from '@/assets/icons/icons8/icons8-auto-50-10.png';
import { useOrg } from '@/context/OrgContext';
import { useToast } from '@/hooks/useToast';
import { useRVFUAuth } from '@/hooks/useRVFUAuth';
import { createRVFUClient } from '@/lib/rvfu-client';
import { normalizeStato } from '@/lib/vfu-state-machine';
import Modal from '@/components/ui/Modal';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import RVFULogin from '@/components/rvfu/RVFULogin';
import { logger } from '@/lib/logger';

const TABLE = "demolition_cases";
const PAGE_SIZE = 25;

// ─── Tab definitions ────────────────────────────────────────────
const TAB_COLORS = {
  blue:    { active: 'border-blue-500 text-blue-400',       badge: 'bg-blue-500/20' },
  emerald: { active: 'border-emerald-500 text-emerald-400', badge: 'bg-emerald-500/20' },
  amber:   { active: 'border-amber-500 text-amber-400',     badge: 'bg-amber-500/20' },
  purple:  { active: 'border-purple-500 text-purple-400',   badge: 'bg-purple-500/20' },
  orange:  { active: 'border-orange-500 text-orange-400',   badge: 'bg-orange-500/20' },
  rose:    { active: 'border-rose-500 text-rose-400',       badge: 'bg-rose-500/20' },
  slate:   { active: 'border-slate-500 text-slate-400',     badge: 'bg-slate-500/20' },
};

const VFU_TABS = [
  { id: 'tutti',          label: 'Tutti',                icon: FiFileText,     endpoint: 'consultaVFU',                   color: 'blue' },
  { id: 'presiInCarico',  label: 'Presi in Carico',      icon: FiCheckCircle,  endpoint: 'consultaPresaInCarico',         color: 'emerald' },
  { id: 'rottamazione',   label: 'In Rottamazione',      icon: FiTruck,        endpoint: 'consultaRottamazione',          color: 'amber' },
  { id: 'daRadiare',      label: 'Da Radiare',           icon: FiSend,         endpoint: 'consultaRottamazione', extraFilters: { statoVFU: 'DA_RADIARE' }, color: 'rose' },
  { id: 'radiati',        label: 'Radiati',              icon: FiXCircle,      endpoint: 'consultaRadiati',               color: 'purple' },
  { id: 'integrazione',   label: 'Richieste Integraz.',  icon: FiAlertCircle,  endpoint: 'consultaRichiestaIntegrazione', color: 'orange' },
  { id: 'storico',        label: 'Storico',              icon: FiClock,        endpoint: 'storicoVFU',                    color: 'slate' },
];

// ─── Stato VFU badge ────────────────────────────────────────────
const STATO_STYLES = {
  INSERITO:             { bg: 'bg-slate-500/10',   text: 'text-slate-300',   label: 'Inserito' },
  CONFERITO:            { bg: 'bg-cyan-500/10',     text: 'text-cyan-400',    label: 'Conferito' },
  PRESO_IN_CARICO:      { bg: 'bg-blue-500/10',    text: 'text-blue-400',    label: 'Preso in carico' },
  VALIDATO:             { bg: 'bg-teal-500/10',    text: 'text-teal-400',    label: 'Validato' },
  DA_RADIARE:           { bg: 'bg-rose-500/10',    text: 'text-rose-400',    label: 'Da radiare' },
  INVIATO_A_STA:        { bg: 'bg-violet-500/10',  text: 'text-violet-400',  label: 'Inviato a STA' },
  INOLTRATO_STA:        { bg: 'bg-violet-500/10',  text: 'text-violet-400',  label: 'Inoltrato STA' },
  IN_RADIAZIONE:        { bg: 'bg-fuchsia-500/10', text: 'text-fuchsia-400', label: 'In radiazione' },
  RADIATO:              { bg: 'bg-green-500/10',   text: 'text-green-400',   label: 'Radiato' },
  DEMOLITO:             { bg: 'bg-emerald-500/10', text: 'text-emerald-400', label: 'Demolito' },
  ANNULLATO:            { bg: 'bg-red-500/10',     text: 'text-red-500',     label: 'Annullato' },
  CEDUTO:               { bg: 'bg-orange-500/10',  text: 'text-orange-400',  label: 'Ceduto' },
  TRASFERITO:           { bg: 'bg-amber-500/10',   text: 'text-amber-400',   label: 'Trasferito' },
  RICHIESTA_INTEGRAZIONE: { bg: 'bg-orange-500/10', text: 'text-orange-400',  label: 'Rich. Integrazione' },
};

const StatoBadge = ({ stato }) => {
  const norm = normalizeStato(stato);
  const s = STATO_STYLES[norm] || { bg: 'bg-slate-500/10', text: 'text-slate-400', label: stato || '—' };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${s.bg} ${s.text}`}>
      {s.label}
    </span>
  );
};


// ─── Helper: format date ────────────────────────────────────────
const fmtDate = (d) => {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('it-IT'); } catch { return d; }
};

// ═════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═════════════════════════════════════════════════════════════════
export default function DemolizioniRVFU() {
  const navigate = useNavigate();
  const { orgId } = useOrg();
  const { showError, showSuccess } = useToast();
  const {
    isAuthenticated: rvfuAuthenticated,
    logout: rvfuLogout,
    reloadState: rvfuReloadState,
    authService,
  } = useRVFUAuth('formation');

  // State
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('tutti');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [showRVFULogin, setShowRVFULogin] = useState(false);
  const [tabCounts, setTabCounts] = useState({});
  const loginJustHappened = useRef(false);

  // ─── Load data from RVFU API per active tab ──────────────────
  const loadData = useCallback(async (tabId = activeTab, pageNum = page) => {
    if (!rvfuAuthenticated || !authService) return;

    setLoading(true);
    try {
      const rvfuClient = createRVFUClient(authService, 'formation', true);
      const tabDef = VFU_TABS.find(t => t.id === tabId) || VFU_TABS[0];

      const filters = {
        pageNumber: pageNum,
        pageSize: PAGE_SIZE,
        paged: true,
        ...tabDef.extraFilters,
      };

      // Ricerca per targa o telaio
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toUpperCase();
        if (/^[A-Z]{2}\d{3}[A-Z]{2}$/.test(q) || /^[A-Z]{2}\d{4,6}$/.test(q)) {
          filters.targa = q;
        } else {
          filters.targaOTelaio = q;
        }
      }

      let response;
      switch (tabDef.endpoint) {
        case 'consultaPresaInCarico':
          response = await rvfuClient.consultaPresaInCarico(filters);
          break;
        case 'consultaRottamazione':
          response = await rvfuClient.consultaRottamazione(filters);
          break;
        case 'consultaRadiati':
          response = await rvfuClient.consultaRadiati(filters);
          break;
        case 'consultaRichiestaIntegrazione':
          response = await rvfuClient.consultaRichiestaIntegrazione(filters);
          break;
        case 'storicoVFU':
          response = await rvfuClient.storicoVFU(filters);
          break;
        default:
          response = await rvfuClient.consultaVFUConcessionario(filters);
      }

      const payload = response?.payload || response?.result || response || {};
      const content = payload?.content || [];
      const total = payload?.totalElements ?? content.length;
      const pages = payload?.totalPages ?? (total > 0 ? Math.ceil(total / PAGE_SIZE) : 0);

      setRows(content);
      setTotalElements(total);
      setTotalPages(pages);

      // Aggiorna contatore per questo tab
      setTabCounts(prev => ({ ...prev, [tabId]: total }));

    } catch (err) {
      logger.error(`[DemolizioniRVFU] Errore caricamento tab ${tabId}:`, err);
      showError(`Errore caricamento: ${err.message}`);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [rvfuAuthenticated, authService, activeTab, page, searchQuery, showError]);

  // ─── Load local cases from Supabase (when not authenticated) ─
  const loadLocalCases = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from(TABLE)
        .select('id, targa, telaio, marca_modello, anno, stato, processing_status, rvfu_id, rvfu_status, created_at, meta')
        .eq('org_id', orgId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRows(data || []);
      setTotalElements(data?.length || 0);
      setTotalPages(1);
    } catch (err) {
      logger.error('[DemolizioniRVFU] Errore caricamento locale:', err);
      showError('Errore nel caricamento dei casi locali');
    } finally {
      setLoading(false);
    }
  }, [orgId, showError]);

  // ─── Effects ─────────────────────────────────────────────────
  useEffect(() => {
    if (loginJustHappened.current && rvfuAuthenticated) {
      loginJustHappened.current = false;
      return;
    }
    if (rvfuAuthenticated && authService) {
      loadData(activeTab, 0);
      setPage(0);
    } else {
      loadLocalCases();
    }
  }, [rvfuAuthenticated, authService, activeTab]);

  // Debounce search
  useEffect(() => {
    if (!rvfuAuthenticated) return;
    const timer = setTimeout(() => {
      setPage(0);
      loadData(activeTab, 0);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // ─── Tab change ──────────────────────────────────────────────
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setPage(0);
    setSearchQuery('');
  };

  // ─── Pagination ──────────────────────────────────────────────
  const handlePageChange = (newPage) => {
    setPage(newPage);
    loadData(activeTab, newPage);
  };

  // ─── Delete local case ──────────────────────────────────────
  const handleDelete = async (caseId) => {
    if (!confirm('Sei sicuro di voler eliminare questo caso?')) return;
    try {
      const { error } = await supabase.from(TABLE).delete().eq('id', caseId).eq('org_id', orgId);
      if (error) throw error;
      showSuccess('Caso eliminato');
      loadLocalCases();
    } catch (err) {
      showError(`Errore: ${err.message}`);
    }
  };

  // ─── Login handlers ─────────────────────────────────────────
  const handleRVFULoginSuccess = () => {
    setShowRVFULogin(false);
    showSuccess('Connesso a RVFU!');
    loginJustHappened.current = true;
    setTimeout(() => {
      rvfuReloadState();
      setTimeout(() => loadData('tutti', 0), 1000);
    }, 50);
  };

  const handleRVFULogout = async () => {
    try {
      await rvfuLogout();
      showSuccess('Disconnesso da RVFU');
      setRows([]);
    } catch (err) {
      showError(`Errore logout: ${err.message}`);
    }
  };

  // ─── Export XLSX ───────────────────────────────────────────
  const handleExport = async () => {
    if (!rvfuAuthenticated || !authService) return;
    try {
      const client = createRVFUClient(authService, 'formation', true);
      const exportMap = {
        presiInCarico: () => client.exportPresaInCarico(),
        rottamazione: () => client.exportRottamazione(),
        daRadiare: () => client.exportRottamazione({ statoVFU: 'DA_RADIARE' }),
        radiati: () => client.exportRadiati(),
      };
      const response = await (exportMap[activeTab] || (() => client.exportVFU()))();
      if (response?.url) {
        window.open(response.url, '_blank');
      } else {
        showSuccess('Export avviato — il file verrà scaricato');
      }
    } catch (err) {
      showError(`Errore export: ${err.message}`);
    }
  };

  // ─── Stampa PDF ───────────────────────────────────────────
  const handleStampa = async () => {
    if (!rvfuAuthenticated || !authService) return;
    try {
      const client = createRVFUClient(authService, 'formation', true);
      const stampaMap = {
        presiInCarico: () => client.stampaPresaInCarico(),
        rottamazione: () => client.stampaRottamazione(),
        daRadiare: () => client.stampaRottamazione({ statoVFU: 'DA_RADIARE' }),
        radiati: () => client.stampaRadiati(),
      };
      const response = await (stampaMap[activeTab] || (() => client.stampaVFU()))();
      if (response?.url) {
        window.open(response.url, '_blank');
      } else {
        showSuccess('Stampa PDF avviata');
      }
    } catch (err) {
      showError(`Errore stampa: ${err.message}`);
    }
  };

  // ─── Row click handler ──────────────────────────────────────
  const handleRowClick = (row) => {
    const idVFU = row.idVFU || row.rvfu_id;
    if (idVFU) {
      navigate(`/demolizioni-rvfu/dettaglio/${idVFU}`);
    } else if (row.id) {
      navigate(`/demolizioni-rvfu/${row.id}`);
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-[#0d1117]">

      {/* ─── Header ────────────────────────────────────────────── */}
      <div className="bg-[#141c27] border-b border-[#243044]">
        <div className="max-w-[1400px] mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <img src={rvfuIcon} alt="RVFU" className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-sm font-semibold text-slate-200">Demolizioni RVFU</h1>
                <p className="text-xs text-slate-500">
                  {rvfuAuthenticated
                    ? `Connesso — ${totalElements} pratiche`
                    : 'Non connesso — modalità locale'}
                </p>
              </div>
              {rvfuAuthenticated ? (
                <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-emerald-500/10 text-emerald-400 rounded-full">
                  <FiCheckCircle className="h-3 w-3" /> Connesso
                </span>
              ) : (
                <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-amber-500/10 text-amber-400 rounded-full">
                  <FiClock className="h-3 w-3" /> Locale
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/demolizioni-rvfu/deleghe')}
                className="px-3 py-1.5 text-sm bg-slate-700 text-slate-200 rounded-md hover:bg-slate-600 transition-colors flex items-center gap-1.5"
              >
                Deleghe
              </button>
              <button
                onClick={() => navigate('/demolizioni-rvfu/pagopa')}
                className="px-3 py-1.5 text-sm bg-slate-700 text-slate-200 rounded-md hover:bg-slate-600 transition-colors flex items-center gap-1.5"
              >
                PagoPA
              </button>
              <button
                onClick={() => navigate('/demolizioni-rvfu/new')}
                className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-1.5"
              >
                <FiPlus className="h-3.5 w-3.5" /> Nuova Pratica
              </button>
              {rvfuAuthenticated ? (
                <button
                  onClick={handleRVFULogout}
                  className="px-3 py-1.5 text-sm bg-[#1a2536] text-slate-300 border border-[#243044] rounded-md hover:bg-[#1e2b3d] transition-colors"
                >
                  Disconnetti
                </button>
              ) : (
                <button
                  onClick={() => setShowRVFULogin(true)}
                  className="px-3 py-1.5 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors flex items-center gap-1.5"
                >
                  <FiLogIn className="h-3.5 w-3.5" /> Connetti RVFU
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Tab bar (solo se autenticato) ─────────────────────── */}
      {rvfuAuthenticated && (
        <div className="bg-[#141c27] border-b border-[#243044]">
          <div className="max-w-[1400px] mx-auto px-4">
            <div className="flex gap-1 overflow-x-auto">
              {VFU_TABS.map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                const count = tabCounts[tab.id];
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
                      isActive
                        ? TAB_COLORS[tab.color].active
                        : 'border-transparent text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {tab.label}
                    {count !== undefined && (
                      <span className={`ml-1 px-1.5 py-0.5 text-[10px] rounded-full ${
                        isActive ? TAB_COLORS[tab.color].badge : 'bg-slate-700/50'
                      }`}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ─── Toolbar: search + actions ─────────────────────────── */}
      <div className="max-w-[1400px] mx-auto px-4 py-3">
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="flex-1 max-w-md relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Cerca per targa o telaio..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-3 py-2 text-sm border border-[#243044] rounded-md bg-[#1a2536] text-slate-200 placeholder-slate-600 focus:ring-1 focus:ring-blue-500/40 outline-none"
            />
          </div>

          {/* Refresh */}
          <button
            onClick={() => rvfuAuthenticated ? loadData(activeTab, page) : loadLocalCases()}
            disabled={loading}
            className="p-2 text-slate-400 hover:text-slate-200 bg-[#1a2536] border border-[#243044] rounded-md hover:bg-[#1e2b3d] transition-colors disabled:opacity-50"
          >
            <FiRefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {/* Export + Stampa */}
          {rvfuAuthenticated && rows.length > 0 && (
            <>
              <button
                onClick={handleExport}
                disabled={loading}
                className="p-2 text-slate-400 hover:text-slate-200 bg-[#1a2536] border border-[#243044] rounded-md hover:bg-[#1e2b3d] transition-colors disabled:opacity-50"
                title="Esporta XLSX"
              >
                <FiDownload className="h-4 w-4" />
              </button>
              <button
                onClick={handleStampa}
                disabled={loading}
                className="p-2 text-slate-400 hover:text-slate-200 bg-[#1a2536] border border-[#243044] rounded-md hover:bg-[#1e2b3d] transition-colors disabled:opacity-50"
                title="Stampa PDF"
              >
                <FiPrinter className="h-4 w-4" />
              </button>
            </>
          )}

          {/* Info: pagina */}
          {totalElements > 0 && (
            <span className="text-xs text-slate-500">
              {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, totalElements)} di {totalElements}
            </span>
          )}
        </div>
      </div>

      {/* ─── Table ─────────────────────────────────────────────── */}
      <div className="max-w-[1400px] mx-auto px-4 pb-6">
        <div className="bg-[#141c27] rounded-lg border border-[#243044] overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <LoadingSpinner text="Caricamento pratiche..." />
            </div>
          ) : rows.length === 0 ? (
            <div className="text-center py-16">
              <FiFileText className="h-10 w-10 text-slate-600 mx-auto mb-3" />
              <p className="text-sm text-slate-400 mb-1">
                {rvfuAuthenticated
                  ? 'Nessuna pratica trovata'
                  : 'Nessun caso locale'}
              </p>
              <p className="text-xs text-slate-600 mb-4">
                {searchQuery ? 'Prova a modificare la ricerca' : 'Crea una nuova pratica per iniziare'}
              </p>
              {!searchQuery && (
                <button
                  onClick={() => navigate('/demolizioni-rvfu/new')}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  <FiPlus className="inline h-4 w-4 mr-1" /> Nuova Pratica
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Table header */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-slate-500 uppercase tracking-wider border-b border-[#243044]">
                      <th className="px-4 py-3 font-medium">Targa</th>
                      <th className="px-4 py-3 font-medium">Telaio</th>
                      <th className="px-4 py-3 font-medium">Veicolo</th>
                      <th className="px-4 py-3 font-medium">Intestatario</th>
                      <th className="px-4 py-3 font-medium">Stato</th>
                      <th className="px-4 py-3 font-medium">Data Ritiro</th>
                      <th className="px-4 py-3 font-medium">Registrazione</th>
                      <th className="px-4 py-3 font-medium w-20">Azioni</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#243044]/50">
                    {rows.map((row, idx) => {
                      const idVFU = row.idVFU || row.rvfu_id;
                      const isRVFU = !!row.idVFU;
                      const intestatario = row.intestatario;
                      const stato = row.statoVFU || row.statoVfuEnum || row.rvfu_status || row.processing_status || row.stato;

                      return (
                        <tr
                          key={idVFU || row.id || idx}
                          onClick={() => handleRowClick(row)}
                          className="hover:bg-[#1a2536] cursor-pointer transition-colors"
                        >
                          {/* Targa */}
                          <td className="px-4 py-3">
                            <span className="font-mono font-semibold text-slate-200">
                              {row.targa || '—'}
                            </span>
                            {idVFU && (
                              <div className="text-[10px] text-slate-600 font-mono">ID {idVFU}</div>
                            )}
                          </td>

                          {/* Telaio */}
                          <td className="px-4 py-3 font-mono text-xs text-slate-400">
                            {row.telaio || '—'}
                          </td>

                          {/* Veicolo */}
                          <td className="px-4 py-3">
                            <div className="text-slate-300 text-xs">
                              {row.descrizioneVeicolo || row.marca_modello || row.veicolo?.modello || '—'}
                            </div>
                            {(row.tipoVeicolo || row.veicolo?.tipoVeicolo) && (
                              <div className="text-[10px] text-slate-600">
                                Tipo: {row.tipoVeicolo || row.veicolo?.tipoVeicolo}
                              </div>
                            )}
                          </td>

                          {/* Intestatario */}
                          <td className="px-4 py-3">
                            {intestatario ? (
                              <div>
                                <div className="text-xs text-slate-300">
                                  {intestatario.cognome} {intestatario.nome}
                                </div>
                                <div className="text-[10px] text-slate-600 font-mono">
                                  {intestatario.codiceFiscale}
                                </div>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-600">—</span>
                            )}
                          </td>

                          {/* Stato */}
                          <td className="px-4 py-3">
                            <StatoBadge stato={stato} />
                          </td>

                          {/* Data Ritiro */}
                          <td className="px-4 py-3 text-xs text-slate-400">
                            {fmtDate(row.dataRitiro)}
                          </td>

                          {/* Data Registrazione */}
                          <td className="px-4 py-3 text-xs text-slate-400">
                            {fmtDate(row.dataRegistrazione || row.created_at)}
                          </td>

                          {/* Azioni */}
                          <td className="px-4 py-3">
                            <div className="flex gap-1">
                              {isRVFU ? (
                                <button
                                  onClick={(e) => { e.stopPropagation(); navigate(`/demolizioni-rvfu/dettaglio/${idVFU}`); }}
                                  className="p-1.5 text-blue-400 hover:bg-blue-500/10 rounded transition-colors"
                                  title="Dettaglio"
                                >
                                  <FiEye className="h-3.5 w-3.5" />
                                </button>
                              ) : (
                                <>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); navigate(`/demolizioni-rvfu/${row.id}`); }}
                                    className="p-1.5 text-slate-400 hover:bg-slate-500/10 rounded transition-colors"
                                    title="Modifica"
                                  >
                                    <FiEdit2 className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleDelete(row.id); }}
                                    className="p-1.5 text-red-400 hover:bg-red-500/10 rounded transition-colors"
                                    title="Elimina"
                                  >
                                    <FiTrash2 className="h-3.5 w-3.5" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-[#243044]">
                  <span className="text-xs text-slate-500">
                    Pagina {page + 1} di {totalPages} ({totalElements} risultati)
                  </span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handlePageChange(page - 1)}
                      disabled={page === 0}
                      className="px-2.5 py-1 text-xs bg-[#1a2536] text-slate-400 border border-[#243044] rounded hover:bg-[#1e2b3d] disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <FiChevronLeft className="h-3.5 w-3.5" />
                    </button>
                    {/* Page numbers */}
                    {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 7) {
                        pageNum = i;
                      } else if (page < 4) {
                        pageNum = i;
                      } else if (page > totalPages - 5) {
                        pageNum = totalPages - 7 + i;
                      } else {
                        pageNum = page - 3 + i;
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`px-2.5 py-1 text-xs rounded border ${
                            pageNum === page
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-[#1a2536] text-slate-400 border-[#243044] hover:bg-[#1e2b3d]'
                          }`}
                        >
                          {pageNum + 1}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => handlePageChange(page + 1)}
                      disabled={page >= totalPages - 1}
                      className="px-2.5 py-1 text-xs bg-[#1a2536] text-slate-400 border border-[#243044] rounded hover:bg-[#1e2b3d] disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <FiChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ─── Login Modal ───────────────────────────────────────── */}
      {showRVFULogin && (
        <Modal
          isOpen={showRVFULogin}
          onClose={() => setShowRVFULogin(false)}
          title="Autenticazione RVFU"
          size="lg"
        >
          <RVFULogin
            onSuccess={handleRVFULoginSuccess}
            onCancel={() => setShowRVFULogin(false)}
          />
        </Modal>
      )}
    </div>
  );
}
