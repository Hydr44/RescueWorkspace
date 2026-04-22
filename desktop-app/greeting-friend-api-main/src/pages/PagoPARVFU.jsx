import React, { useState, useEffect, useCallback } from 'react';
import {
  FiSearch, FiRefreshCw, FiPlus, FiTrash2, FiPrinter,
  FiDollarSign, FiX, FiCheck,
  FiCreditCard, FiClipboard, FiGrid,
  FiGift, FiDownload, FiToggleLeft, FiToggleRight, FiLayers
} from 'react-icons/fi';
import { useToast } from '@/hooks/useToast';
import { useRVFUAuth } from '@/hooks/useRVFUAuth';
import { createRVFUClient } from '@/lib/rvfu-client';
import { useOrg } from '@/context/OrgContext';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Modal from '@/components/ui/Modal';
import RVFULogin from '@/components/rvfu/RVFULogin';
import { logger } from '@/lib/logger';

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════

const TABS = [
  { key: 'cassetto',   label: 'Cassetto Pagamenti', icon: FiCreditCard },
  { key: 'tariffario', label: 'Tariffario',         icon: FiClipboard },
  { key: 'saldo',      label: 'Saldo',              icon: FiDollarSign },
  { key: 'voucher',    label: 'Voucher',            icon: FiGift },
];

const STATO_RICHIESTA = {
  D: { label: 'Da Pagare',             color: 'text-amber-400',  bg: 'bg-amber-500/10' },
  C: { label: 'Creazione in corso',    color: 'text-blue-400',   bg: 'bg-blue-500/10' },
  P: { label: 'Pagata',                color: 'text-green-400',  bg: 'bg-green-500/10' },
  B: { label: 'Bruciata',              color: 'text-red-400',    bg: 'bg-red-500/10' },
  L: { label: 'Cancellata',            color: 'text-slate-400',  bg: 'bg-slate-500/10' },
  Z: { label: 'Parz. Cancellata',      color: 'text-orange-400', bg: 'bg-orange-500/10' },
  A: { label: 'Parz. Annullata',       color: 'text-orange-400', bg: 'bg-orange-500/10' },
  N: { label: 'Da Integrare',          color: 'text-purple-400', bg: 'bg-purple-500/10' },
  E: { label: 'Da Integrare (Errore)', color: 'text-red-400',    bg: 'bg-red-500/10' },
  X: { label: 'Errore',                color: 'text-red-400',    bg: 'bg-red-500/10' },
  I: { label: 'Pagamento in corso',    color: 'text-blue-400',   bg: 'bg-blue-500/10' },
};

const StatoRichiestaBadge = ({ codice }) => {
  const s = STATO_RICHIESTA[codice] || { label: codice || '—', color: 'text-slate-400', bg: 'bg-slate-500/10' };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${s.bg} ${s.color}`}>
      {s.label}
    </span>
  );
};

const fmtDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('it-IT');
};

const fmtCurrency = (n) => {
  if (n == null) return '—';
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(n);
};

// Helper: parse PagoPA esito
const checkEsito = (resp) => {
  const esito = resp?.esito;
  if (esito && esito.codice === 'KO') {
    throw new Error(esito.descrizione || 'Errore PagoPA');
  }
  return resp;
};

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export default function PagoPARVFU() {
  const { showError, showSuccess } = useToast();
  useOrg();
  const { isAuthenticated: rvfuAuthenticated, authService } = useRVFUAuth('formation');

  const [rvfuClient, setRvfuClient] = useState(null);
  const [activeTab, setActiveTab] = useState('cassetto');

  // ── Client init ──
  useEffect(() => {
    if (rvfuAuthenticated && authService) {
      try {
        const client = createRVFUClient(authService, 'formation');
        setRvfuClient(client);
      } catch (err) {
        logger.error('[PagoPA] Errore creazione client:', err);
      }
    } else {
      setRvfuClient(null);
    }
  }, [rvfuAuthenticated, authService]);

  // ── Login guard ──
  if (!rvfuAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0f1724] p-6">
        <div className="max-w-md mx-auto mt-20">
          <div className="text-center mb-6">
            <FiCreditCard className="h-12 w-12 text-blue-400 mx-auto mb-3" />
            <h1 className="text-xl font-bold text-white">PagoPA — Pagamenti</h1>
            <p className="text-sm text-slate-400 mt-1">Effettua il login RVFU per accedere ai pagamenti</p>
          </div>
          <RVFULogin />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f1724]">
      {/* Header */}
      <div className="bg-[#141e2e] border-b border-slate-700/50 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FiCreditCard className="h-6 w-6 text-blue-400" />
            <div>
              <h1 className="text-lg font-bold text-white">PagoPA — Pagamenti</h1>
              <p className="text-xs text-slate-400">Gestione pagamenti, tariffario, saldo e voucher</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-4">
          {TABS.map(t => {
            const Icon = t.icon;
            const active = activeTab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-colors ${
                  active
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'cassetto'   && <CassettoPagamentiTab client={rvfuClient} showError={showError} showSuccess={showSuccess} />}
        {activeTab === 'tariffario' && <TariffarioTab client={rvfuClient} showError={showError} />}
        {activeTab === 'saldo'      && <SaldoTab client={rvfuClient} showError={showError} />}
        {activeTab === 'voucher'    && <VoucherTab client={rvfuClient} showError={showError} showSuccess={showSuccess} />}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// TAB 1: CASSETTO PAGAMENTI
// ═══════════════════════════════════════════════════════════════

function CassettoPagamentiTab({ client, showError, showSuccess }) {
  const [loading, setLoading] = useState(false);
  const [richieste, setRichieste] = useState([]);
  // API richiede intervallo data creazione <= 7 giorni
  const [filters, setFilters] = useState(() => {
    const t = new Date();
    const w = new Date(t);
    w.setDate(w.getDate() - 7);
    const iso = (d) => d.toISOString().split('T')[0];
    return {
      codiceStatoRichiesta: '',
      codiceTipoTariffario: '',
      idRichiesta: '',
      dataCreazioneRichiestaDa: iso(w),
      dataCreazioneRichiestaA: iso(t),
    };
  });
  const [showNewForm, setShowNewForm] = useState(false);
  const [newFormLoading, setNewFormLoading] = useState(false);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);

  // New payment form state
  const [newPayment, setNewPayment] = useState({
    causalePagamento: '',
    codiceTipoTariffario: 'N',
    flagCumulativo: 'N',
    flagEsenzione: 'N',
    flagUrgenza: 'N',
    numeroPratiche: '1',
    flagAggregato: 'N',
    flagAbbinamentoAutomatico: 'S',
    codiceTipoPraticaMctc: '',
  });

  const loadRichieste = useCallback(async () => {
    if (!client) return;
    setLoading(true);
    try {
      const params = {};
      if (filters.codiceStatoRichiesta) params.codiceStatoRichiesta = filters.codiceStatoRichiesta;
      if (filters.codiceTipoTariffario) params.codiceTipoTariffario = filters.codiceTipoTariffario;
      if (filters.idRichiesta) params.idRichiesta = filters.idRichiesta;
      // Date range obbligatorio (max 7 giorni)
      if (filters.dataCreazioneRichiestaDa) params.dataCreazioneRichiestaDa = filters.dataCreazioneRichiestaDa;
      if (filters.dataCreazioneRichiestaA) params.dataCreazioneRichiestaA = filters.dataCreazioneRichiestaA;
      const resp = await client.ricercaRichiestePagamento(params);
      const data = resp?.risultato || resp?.result || resp;
      setRichieste(Array.isArray(data) ? data : data?.content || []);
    } catch (err) {
      logger.error('[PagoPA] Errore caricamento richieste:', err);
      showError(`Errore caricamento: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [client, filters, showError]);

  // NON auto-load: l'API richiede date range + header identificazione
  // L'utente deve cliccare "Cerca" manualmente

  const handleCancel = async () => {
    if (!cancelTarget || !client) return;
    setCancelLoading(true);
    try {
      const resp = await client.cancellaRichiestaPagamento(cancelTarget.idRichiesta);
      checkEsito(resp);
      showSuccess(`Richiesta #${cancelTarget.idRichiesta} cancellata`);
      setCancelTarget(null);
      loadRichieste();
    } catch (err) {
      showError(`Errore cancellazione: ${err.message}`);
    } finally {
      setCancelLoading(false);
    }
  };

  const handlePrintAvviso = async (id) => {
    try {
      const resp = await client.stampaAvvisoPagamento(id);
      const data = resp?.risultato || resp;
      if (data?.file || data?.contenuto) {
        const b64 = data.file || data.contenuto;
        const blob = new Blob([Uint8Array.from(atob(b64), c => c.charCodeAt(0))], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
      } else {
        showError('Nessun PDF ricevuto');
      }
    } catch (err) {
      showError(`Errore stampa avviso: ${err.message}`);
    }
  };

  const handlePrintRicevuta = async (id) => {
    try {
      const resp = await client.stampaRicevutaPagamento(id);
      const data = resp?.risultato || resp;
      if (data?.file || data?.contenuto) {
        const b64 = data.file || data.contenuto;
        const blob = new Blob([Uint8Array.from(atob(b64), c => c.charCodeAt(0))], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
      } else {
        showError('Nessun PDF ricevuto');
      }
    } catch (err) {
      showError(`Errore stampa ricevuta: ${err.message}`);
    }
  };

  const handleToggleAbbinamento = async (id, currentFlag) => {
    try {
      const newFlag = currentFlag === 'S' ? 'N' : 'S';
      const resp = await client.modificaFlagAbbinamento(id, newFlag);
      checkEsito(resp);
      showSuccess(`Flag abbinamento aggiornato a ${newFlag === 'S' ? 'Automatico' : 'Manuale'}`);
      loadRichieste();
    } catch (err) {
      showError(`Errore modifica flag: ${err.message}`);
    }
  };

  const handleNewPayment = async (e) => {
    e.preventDefault();
    if (!newPayment.causalePagamento || !newPayment.codiceTipoTariffario) {
      showError('Causale pagamento e tipo tariffario sono obbligatori');
      return;
    }
    setNewFormLoading(true);
    try {
      const payload = {
        richieste: [{
          causalePagamento: newPayment.causalePagamento,
          codiceTipoTariffario: newPayment.codiceTipoTariffario,
          flagCumulativo: newPayment.flagCumulativo,
          flagEsenzione: newPayment.flagEsenzione,
          flagUrgenza: newPayment.flagUrgenza,
          numeroPratiche: parseInt(newPayment.numeroPratiche) || 1,
          flagAggregato: newPayment.flagAggregato,
          flagAbbinamentoAutomatico: newPayment.flagAbbinamentoAutomatico,
          ...(newPayment.codiceTipoPraticaMctc ? { codiceTipoPraticaMctc: newPayment.codiceTipoPraticaMctc } : {}),
        }],
      };
      const resp = await client.inserimentoPagamentoSync(payload);
      checkEsito(resp);
      const idCarrello = resp?.risultato?.idCarrello || resp?.idCarrello;
      showSuccess(`Pagamento creato${idCarrello ? ` (Carrello #${idCarrello})` : ''}`);
      setShowNewForm(false);
      setNewPayment({
        causalePagamento: '', codiceTipoTariffario: 'N', flagCumulativo: 'N',
        flagEsenzione: 'N', flagUrgenza: 'N', numeroPratiche: '1',
        flagAggregato: 'N', flagAbbinamentoAutomatico: 'S', codiceTipoPraticaMctc: '',
      });
      loadRichieste();
    } catch (err) {
      showError(`Errore inserimento: ${err.message}`);
    } finally {
      setNewFormLoading(false);
    }
  };

  const handleDisaggrega = async (id) => {
    try {
      const resp = await client.disaggregaIUV(id);
      checkEsito(resp);
      showSuccess(`IUV disaggregati per richiesta #${id}`);
      loadRichieste();
    } catch (err) {
      showError(`Errore disaggregazione: ${err.message}`);
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-[#141e2e] rounded-xl border border-slate-700/50 p-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Stato</label>
            <select
              value={filters.codiceStatoRichiesta}
              onChange={e => setFilters(f => ({ ...f, codiceStatoRichiesta: e.target.value }))}
              className="bg-[#243044] border border-slate-600 rounded-lg px-3 py-2 text-white text-sm"
            >
              <option value="">Tutti</option>
              {Object.entries(STATO_RICHIESTA).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Tipo Tariffario</label>
            <input
              type="text"
              value={filters.codiceTipoTariffario}
              onChange={e => setFilters(f => ({ ...f, codiceTipoTariffario: e.target.value.toUpperCase() }))}
              placeholder="es. N"
              className="bg-[#243044] border border-slate-600 rounded-lg px-3 py-2 text-white text-sm w-24"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">ID Richiesta</label>
            <input
              type="text"
              value={filters.idRichiesta}
              onChange={e => setFilters(f => ({ ...f, idRichiesta: e.target.value }))}
              placeholder="ID"
              className="bg-[#243044] border border-slate-600 rounded-lg px-3 py-2 text-white text-sm w-28"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Data Da *</label>
            <input
              type="date"
              value={filters.dataCreazioneRichiestaDa}
              onChange={e => setFilters(f => ({ ...f, dataCreazioneRichiestaDa: e.target.value }))}
              className="bg-[#243044] border border-slate-600 rounded-lg px-3 py-2 text-white text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Data A *</label>
            <input
              type="date"
              value={filters.dataCreazioneRichiestaA}
              onChange={e => setFilters(f => ({ ...f, dataCreazioneRichiestaA: e.target.value }))}
              className="bg-[#243044] border border-slate-600 rounded-lg px-3 py-2 text-white text-sm"
            />
          </div>
          <button
            onClick={loadRichieste}
            disabled={loading}
            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg text-sm flex items-center gap-1.5"
          >
            {loading ? <LoadingSpinner size="sm" /> : <FiSearch className="h-4 w-4" />}
            Cerca
          </button>
          <button
            onClick={() => setShowNewForm(true)}
            className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm flex items-center gap-1.5 ml-auto"
          >
            <FiPlus className="h-4 w-4" /> Nuovo Pagamento
          </button>
        </div>
      </div>

      {/* Results */}
      <div className="bg-[#141e2e] rounded-xl border border-slate-700/50 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12"><LoadingSpinner /></div>
        ) : richieste.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <FiSearch className="h-8 w-8 mx-auto mb-3 opacity-40" />
            <p className="text-sm">Imposta le date e clicca <strong className="text-slate-300">Cerca</strong> per visualizzare le richieste</p>
            <p className="text-xs text-slate-600 mt-1">Intervallo massimo: 7 giorni</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700/50 text-xs text-slate-400">
                  <th className="text-left px-4 py-2.5">ID</th>
                  <th className="text-left px-4 py-2.5">Stato</th>
                  <th className="text-left px-4 py-2.5">Causale</th>
                  <th className="text-left px-4 py-2.5">Tariffario</th>
                  <th className="text-left px-4 py-2.5">IUV</th>
                  <th className="text-left px-4 py-2.5">Importo</th>
                  <th className="text-left px-4 py-2.5">Creazione</th>
                  <th className="text-left px-4 py-2.5">Pagamento</th>
                  <th className="text-left px-4 py-2.5">Abb.</th>
                  <th className="text-right px-4 py-2.5">Azioni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {richieste.map((r, idx) => {
                  const id = r.idRichiesta || r.id || idx;
                  return (
                    <tr key={id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-2.5 text-sm text-white font-mono">{id}</td>
                      <td className="px-4 py-2.5"><StatoRichiestaBadge codice={r.codiceStatoRichiesta || r.stato} /></td>
                      <td className="px-4 py-2.5 text-sm text-slate-300">{r.causalePagamento || r.causale || '—'}</td>
                      <td className="px-4 py-2.5 text-sm text-slate-400 font-mono">{r.codiceTipoTariffario || '—'}</td>
                      <td className="px-4 py-2.5 text-xs text-slate-400 font-mono">{r.codiceIUV || '—'}</td>
                      <td className="px-4 py-2.5 text-sm text-white">{fmtCurrency(r.importo || r.importoTotale)}</td>
                      <td className="px-4 py-2.5 text-xs text-slate-400">{fmtDate(r.dataCreazioneRichiesta || r.dataCreazione)}</td>
                      <td className="px-4 py-2.5 text-xs text-slate-400">{fmtDate(r.dataPagamento)}</td>
                      <td className="px-4 py-2.5">
                        <button
                          onClick={() => handleToggleAbbinamento(id, r.flagAbbinamentoAutomatico)}
                          title={r.flagAbbinamentoAutomatico === 'S' ? 'Automatico (clicca per disattivare)' : 'Manuale (clicca per attivare)'}
                          className="text-slate-400 hover:text-white transition-colors"
                        >
                          {r.flagAbbinamentoAutomatico === 'S' ? <FiToggleRight className="h-4 w-4 text-green-400" /> : <FiToggleLeft className="h-4 w-4" />}
                        </button>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => handlePrintAvviso(id)} className="p-1.5 text-blue-400 hover:bg-blue-500/10 rounded" title="Stampa avviso">
                            <FiPrinter className="h-3.5 w-3.5" />
                          </button>
                          {(r.codiceStatoRichiesta === 'P' || r.stato === 'P') && (
                            <button onClick={() => handlePrintRicevuta(id)} className="p-1.5 text-green-400 hover:bg-green-500/10 rounded" title="Stampa ricevuta">
                              <FiDownload className="h-3.5 w-3.5" />
                            </button>
                          )}
                          <button onClick={() => handleDisaggrega(id)} className="p-1.5 text-purple-400 hover:bg-purple-500/10 rounded" title="Disaggrega IUV">
                            <FiLayers className="h-3.5 w-3.5" />
                          </button>
                          {(r.codiceStatoRichiesta === 'D' || r.stato === 'D') && (
                            <button onClick={() => setCancelTarget(r)} className="p-1.5 text-red-400 hover:bg-red-500/10 rounded" title="Cancella">
                              <FiTrash2 className="h-3.5 w-3.5" />
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
      </div>

      {/* ── New Payment Modal ── */}
      <Modal isOpen={showNewForm} onClose={() => setShowNewForm(false)} title="Nuovo Pagamento">
          <form onSubmit={handleNewPayment} className="space-y-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Causale Pagamento *</label>
              <input
                type="text"
                value={newPayment.causalePagamento}
                onChange={e => setNewPayment(f => ({ ...f, causalePagamento: e.target.value }))}
                className="w-full bg-[#243044] border border-slate-600 rounded-lg px-3 py-2 text-white text-sm"
                placeholder="Descrizione causale"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Tipo Tariffario *</label>
                <input
                  type="text"
                  value={newPayment.codiceTipoTariffario}
                  onChange={e => setNewPayment(f => ({ ...f, codiceTipoTariffario: e.target.value.toUpperCase() }))}
                  className="w-full bg-[#243044] border border-slate-600 rounded-lg px-3 py-2 text-white text-sm"
                  placeholder="es. N"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">N. Pratiche</label>
                <input
                  type="number"
                  min="1"
                  value={newPayment.numeroPratiche}
                  onChange={e => setNewPayment(f => ({ ...f, numeroPratiche: e.target.value }))}
                  className="w-full bg-[#243044] border border-slate-600 rounded-lg px-3 py-2 text-white text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Codice Pratica MCTC</label>
              <input
                type="text"
                value={newPayment.codiceTipoPraticaMctc}
                onChange={e => setNewPayment(f => ({ ...f, codiceTipoPraticaMctc: e.target.value }))}
                className="w-full bg-[#243044] border border-slate-600 rounded-lg px-3 py-2 text-white text-sm"
                placeholder="opzionale"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                ['flagCumulativo', 'Cumulativo'],
                ['flagEsenzione', 'Esenzione'],
                ['flagUrgenza', 'Urgenza'],
                ['flagAggregato', 'Aggregato'],
                ['flagAbbinamentoAutomatico', 'Abbinamento Auto'],
              ].map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newPayment[key] === 'S'}
                    onChange={e => setNewPayment(f => ({ ...f, [key]: e.target.checked ? 'S' : 'N' }))}
                    className="w-4 h-4 rounded bg-[#243044] border-slate-600"
                  />
                  {label}
                </label>
              ))}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowNewForm(false)} className="px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 rounded-lg">Annulla</button>
              <button type="submit" disabled={newFormLoading} className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg flex items-center gap-1.5">
                {newFormLoading ? <LoadingSpinner size="sm" /> : <FiPlus className="h-4 w-4" />}
                Crea Pagamento
              </button>
            </div>
          </form>
        </Modal>

      {/* ── Cancel Confirmation Modal ── */}
      <Modal isOpen={!!cancelTarget} onClose={() => setCancelTarget(null)} title="Conferma Cancellazione">
          <p className="text-sm text-slate-300 mb-4">
            Sei sicuro di voler cancellare la richiesta <strong>#{cancelTarget?.idRichiesta || cancelTarget?.id}</strong>?
          </p>
          <div className="flex justify-end gap-2">
            <button onClick={() => setCancelTarget(null)} className="px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 rounded-lg">Annulla</button>
            <button onClick={handleCancel} disabled={cancelLoading} className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white rounded-lg flex items-center gap-1.5">
              {cancelLoading ? <LoadingSpinner size="sm" /> : <FiTrash2 className="h-4 w-4" />}
              Cancella
            </button>
          </div>
        </Modal>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// TAB 2: TARIFFARIO
// ═══════════════════════════════════════════════════════════════

function TariffarioTab({ client, showError }) {
  const [loading, setLoading] = useState(false);
  const [tariffari, setTariffari] = useState([]);
  const [searchCode, setSearchCode] = useState('');
  const [searchProv, setSearchProv] = useState('');
  const [catalogo, setCatalogo] = useState(null);
  const [catalogoLoading, setCatalogoLoading] = useState(false);
  const [corrispondenza, setCorrispondenza] = useState([]);
  const [corrLoading, setCorrLoading] = useState(false);
  const [corrCode, setCorrCode] = useState('');

  const loadTariffari = useCallback(async () => {
    if (!client) return;
    setLoading(true);
    try {
      const params = {};
      if (searchCode) params.codiceTipoTariffario = searchCode;
      if (searchProv) params.siglaProvincia = searchProv;
      const resp = await client.ricercaTipoTariffario(params);
      const data = Array.isArray(resp) ? resp : resp?.risultato || resp?.result || [];
      setTariffari(Array.isArray(data) ? data : []);
    } catch (err) {
      logger.error('[PagoPA] Errore tariffario:', err);
      showError(`Errore: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [client, searchCode, searchProv, showError]);

  useEffect(() => { loadTariffari(); }, [loadTariffari]);

  const loadCatalogoCompleto = async () => {
    setCatalogoLoading(true);
    try {
      const resp = await client.catalogoPraticheTariffeCompleto();
      const data = Array.isArray(resp) ? resp : resp?.risultato || resp?.result || resp;
      setCatalogo(data);
    } catch (err) {
      showError(`Errore catalogo: ${err.message}`);
    } finally {
      setCatalogoLoading(false);
    }
  };

  const loadCorrispondenza = async () => {
    if (!corrCode) return;
    setCorrLoading(true);
    try {
      const resp = await client.corrispondenzaTariffe(corrCode);
      const data = Array.isArray(resp) ? resp : resp?.risultato || resp?.result || [];
      setCorrispondenza(Array.isArray(data) ? data : []);
    } catch (err) {
      showError(`Errore corrispondenza: ${err.message}`);
    } finally {
      setCorrLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="bg-[#141e2e] rounded-xl border border-slate-700/50 p-4">
        <h3 className="text-sm font-medium text-white mb-3">Ricerca Tariffario</h3>
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Codice Tariffario</label>
            <input
              type="text"
              value={searchCode}
              onChange={e => setSearchCode(e.target.value.toUpperCase())}
              placeholder="es. N"
              className="bg-[#243044] border border-slate-600 rounded-lg px-3 py-2 text-white text-sm w-24"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Provincia</label>
            <input
              type="text"
              value={searchProv}
              onChange={e => setSearchProv(e.target.value.toUpperCase())}
              placeholder="es. RM"
              className="bg-[#243044] border border-slate-600 rounded-lg px-3 py-2 text-white text-sm w-24"
            />
          </div>
          <button onClick={loadTariffari} disabled={loading} className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg text-sm flex items-center gap-1.5">
            {loading ? <LoadingSpinner size="sm" /> : <FiSearch className="h-4 w-4" />} Cerca
          </button>
          <button onClick={loadCatalogoCompleto} disabled={catalogoLoading} className="px-3 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg text-sm flex items-center gap-1.5 ml-auto">
            {catalogoLoading ? <LoadingSpinner size="sm" /> : <FiGrid className="h-4 w-4" />} Catalogo Completo
          </button>
        </div>
      </div>

      {/* Results */}
      <div className="bg-[#141e2e] rounded-xl border border-slate-700/50 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12"><LoadingSpinner /></div>
        ) : tariffari.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <FiClipboard className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">Nessun tariffario trovato</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700/50 text-xs text-slate-400">
                  <th className="text-left px-4 py-2.5">Codice</th>
                  <th className="text-left px-4 py-2.5">Descrizione</th>
                  <th className="text-left px-4 py-2.5">Province</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {tariffari.map((t, idx) => (
                  <tr key={t.codiceTipoTariffario || idx} className="hover:bg-slate-800/30">
                    <td className="px-4 py-2.5 text-sm text-white font-mono">{t.codiceTipoTariffario || '—'}</td>
                    <td className="px-4 py-2.5 text-sm text-slate-300">{t.descrizioneTipoTariffario || t.descrizione || '—'}</td>
                    <td className="px-4 py-2.5 text-xs text-slate-400">
                      {t.province ? (Array.isArray(t.province) ? t.province.map(p => p.siglaProvincia || p).join(', ') : t.province) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Corrispondenza Tariffe */}
      <div className="bg-[#141e2e] rounded-xl border border-slate-700/50 p-4">
        <h3 className="text-sm font-medium text-white mb-3">Corrispondenza Tariffe</h3>
        <div className="flex gap-3 items-end">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Codice Tariffario *</label>
            <input
              type="text"
              value={corrCode}
              onChange={e => setCorrCode(e.target.value.toUpperCase())}
              placeholder="es. N"
              className="bg-[#243044] border border-slate-600 rounded-lg px-3 py-2 text-white text-sm w-24"
            />
          </div>
          <button onClick={loadCorrispondenza} disabled={corrLoading || !corrCode} className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg text-sm flex items-center gap-1.5">
            {corrLoading ? <LoadingSpinner size="sm" /> : <FiSearch className="h-4 w-4" />} Cerca
          </button>
        </div>
        {corrispondenza.length > 0 && (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700/50 text-xs text-slate-400">
                  <th className="text-left px-4 py-2">Pratica MCTC</th>
                  <th className="text-left px-4 py-2">Vecchio Codice</th>
                  <th className="text-left px-4 py-2">Nuovo Codice</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {corrispondenza.map((c, i) => (
                  <tr key={i} className="hover:bg-slate-800/30">
                    <td className="px-4 py-2 text-sm text-white">{c.codicePraticaMctc || c.codiceTipoPraticaMctc || '—'}</td>
                    <td className="px-4 py-2 text-sm text-slate-400 font-mono">{c.vecchioCodTariffa || '—'}</td>
                    <td className="px-4 py-2 text-sm text-slate-300 font-mono">{c.nuovoCodTariffa || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Catalogo Completo (raw JSON display) */}
      {catalogo && (
        <div className="bg-[#141e2e] rounded-xl border border-slate-700/50 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-white">Catalogo Completo</h3>
            <button onClick={() => setCatalogo(null)} className="text-slate-400 hover:text-white"><FiX className="h-4 w-4" /></button>
          </div>
          <pre className="text-xs text-slate-300 bg-[#0f1724] rounded-lg p-3 max-h-96 overflow-auto whitespace-pre-wrap">
            {JSON.stringify(catalogo, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// TAB 3: SALDO
// ═══════════════════════════════════════════════════════════════

function SaldoTab({ client, showError }) {
  const [loading, setLoading] = useState(false);
  const [saldoCompleto, setSaldoCompleto] = useState(null);
  const [saldoSpecifico, setSaldoSpecifico] = useState(null);
  const [saldoParams, setSaldoParams] = useState({ codiceTipoTariffario: '', codiceTipoPratica: '' });
  const [richiestePagate, setRichiestePagate] = useState([]);
  const [pagateLoading, setPagateLoading] = useState(false);

  const loadSaldoCompleto = useCallback(async () => {
    if (!client) return;
    setLoading(true);
    try {
      const resp = await client.saldoCompleto();
      setSaldoCompleto(resp?.risultato || resp?.result || resp);
    } catch (err) {
      logger.error('[PagoPA] Errore saldo:', err);
      showError(`Errore saldo: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [client, showError]);

  useEffect(() => { loadSaldoCompleto(); }, [loadSaldoCompleto]);

  const loadSaldoSpecifico = async () => {
    if (!saldoParams.codiceTipoTariffario) { showError('Tipo tariffario obbligatorio'); return; }
    try {
      const resp = await client.verificaPagamenti(saldoParams);
      setSaldoSpecifico(resp?.risultato || resp?.result || resp);
    } catch (err) {
      showError(`Errore: ${err.message}`);
    }
  };

  const loadRichiestePagate = async () => {
    setPagateLoading(true);
    try {
      const resp = await client.ricercaRichiestePagate();
      const data = resp?.risultato || resp?.result || resp;
      setRichiestePagate(Array.isArray(data) ? data : data?.content || []);
    } catch (err) {
      showError(`Errore: ${err.message}`);
    } finally {
      setPagateLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Saldo Completo */}
      <div className="bg-[#141e2e] rounded-xl border border-slate-700/50 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-white">Saldo Completo Cassetto</h3>
          <button onClick={loadSaldoCompleto} disabled={loading} className="text-slate-400 hover:text-white">
            <FiRefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        {loading ? (
          <LoadingSpinner />
        ) : saldoCompleto ? (
          <pre className="text-xs text-slate-300 bg-[#0f1724] rounded-lg p-3 max-h-64 overflow-auto whitespace-pre-wrap">
            {JSON.stringify(saldoCompleto, null, 2)}
          </pre>
        ) : (
          <p className="text-sm text-slate-400">Nessun dato disponibile</p>
        )}
      </div>

      {/* Verifica Saldo Specifico */}
      <div className="bg-[#141e2e] rounded-xl border border-slate-700/50 p-4">
        <h3 className="text-sm font-medium text-white mb-3">Verifica Saldo per Tariffario</h3>
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Tipo Tariffario *</label>
            <input
              type="text"
              value={saldoParams.codiceTipoTariffario}
              onChange={e => setSaldoParams(f => ({ ...f, codiceTipoTariffario: e.target.value.toUpperCase() }))}
              placeholder="es. N"
              className="bg-[#243044] border border-slate-600 rounded-lg px-3 py-2 text-white text-sm w-24"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Tipo Pratica</label>
            <input
              type="text"
              value={saldoParams.codiceTipoPratica}
              onChange={e => setSaldoParams(f => ({ ...f, codiceTipoPratica: e.target.value }))}
              placeholder="es. 001"
              className="bg-[#243044] border border-slate-600 rounded-lg px-3 py-2 text-white text-sm w-28"
            />
          </div>
          <button onClick={loadSaldoSpecifico} disabled={!saldoParams.codiceTipoTariffario} className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg text-sm flex items-center gap-1.5">
            <FiSearch className="h-4 w-4" /> Verifica
          </button>
        </div>
        {saldoSpecifico && (
          <pre className="mt-3 text-xs text-slate-300 bg-[#0f1724] rounded-lg p-3 max-h-48 overflow-auto whitespace-pre-wrap">
            {JSON.stringify(saldoSpecifico, null, 2)}
          </pre>
        )}
      </div>

      {/* Richieste Pagate */}
      <div className="bg-[#141e2e] rounded-xl border border-slate-700/50 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-white">Richieste Pagate (pronte per abbinamento)</h3>
          <button onClick={loadRichiestePagate} disabled={pagateLoading} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg text-sm flex items-center gap-1.5">
            {pagateLoading ? <LoadingSpinner size="sm" /> : <FiSearch className="h-3.5 w-3.5" />} Carica
          </button>
        </div>
        {richiestePagate.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700/50 text-xs text-slate-400">
                  <th className="text-left px-3 py-2">ID</th>
                  <th className="text-left px-3 py-2">IUV</th>
                  <th className="text-left px-3 py-2">Importo</th>
                  <th className="text-left px-3 py-2">Pagamento</th>
                  <th className="text-left px-3 py-2">Abb. Auto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {richiestePagate.map((r, i) => (
                  <tr key={r.idRichiesta || i} className="hover:bg-slate-800/30">
                    <td className="px-3 py-2 text-sm text-white font-mono">{r.idRichiesta || '—'}</td>
                    <td className="px-3 py-2 text-xs text-slate-400 font-mono">{r.codiceIUV || '—'}</td>
                    <td className="px-3 py-2 text-sm text-white">{fmtCurrency(r.importo)}</td>
                    <td className="px-3 py-2 text-xs text-slate-400">{fmtDate(r.dataPagamento)}</td>
                    <td className="px-3 py-2 text-sm">
                      {r.flagAbbinamentoAutomatico === 'S'
                        ? <span className="text-green-400 text-xs">Si</span>
                        : <span className="text-slate-400 text-xs">No</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-slate-500">Premi "Carica" per visualizzare le richieste pagate</p>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// TAB 4: VOUCHER
// ═══════════════════════════════════════════════════════════════

function VoucherTab({ client, showError, showSuccess }) {
  const [adesioni, setAdesioni] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showNewAdesione, setShowNewAdesione] = useState(false);
  const [newFormLoading, setNewFormLoading] = useState(false);
  const [newAdesione, setNewAdesione] = useState({ codiceTariffa: '', codiceTipoTariffario: '' });

  // Verifica riscatto
  const [verificaCF, setVerificaCF] = useState('');
  const [verificaCodice, setVerificaCodice] = useState('');
  const [verificaResult, setVerificaResult] = useState(null);
  const [verificaLoading, setVerificaLoading] = useState(false);

  const loadAdesioni = useCallback(async () => {
    if (!client) return;
    setLoading(true);
    try {
      const resp = await client.ricercaAdesioniVoucher();
      const data = resp?.risultato || resp?.result || resp;
      setAdesioni(Array.isArray(data) ? data : data?.content || []);
    } catch (err) {
      logger.error('[PagoPA] Errore adesioni:', err);
      showError(`Errore: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [client, showError]);

  useEffect(() => { loadAdesioni(); }, [loadAdesioni]);

  const handleNewAdesione = async (e) => {
    e.preventDefault();
    if (!newAdesione.codiceTariffa || !newAdesione.codiceTipoTariffario) {
      showError('Tutti i campi sono obbligatori');
      return;
    }
    setNewFormLoading(true);
    try {
      const resp = await client.inserimentoAdesioneVoucher(newAdesione);
      checkEsito(resp);
      showSuccess('Adesione voucher creata');
      setShowNewAdesione(false);
      setNewAdesione({ codiceTariffa: '', codiceTipoTariffario: '' });
      loadAdesioni();
    } catch (err) {
      showError(`Errore: ${err.message}`);
    } finally {
      setNewFormLoading(false);
    }
  };

  const handleRevoca = async (progressivo) => {
    try {
      const resp = await client.revocaAdesioneVoucher(progressivo);
      checkEsito(resp);
      showSuccess(`Adesione #${progressivo} revocata`);
      loadAdesioni();
    } catch (err) {
      showError(`Errore revoca: ${err.message}`);
    }
  };

  const handleVerifica = async () => {
    if (!verificaCF || !verificaCodice) { showError('Codice fiscale e codice riscatto obbligatori'); return; }
    setVerificaLoading(true);
    try {
      const resp = await client.verificaCodiceRiscattoVoucher(verificaCF, verificaCodice);
      setVerificaResult(resp?.risultato || resp?.result || resp);
    } catch (err) {
      showError(`Errore verifica: ${err.message}`);
    } finally {
      setVerificaLoading(false);
    }
  };

  const handleFinalizza = async () => {
    if (!verificaCF || !verificaCodice) { showError('Codice fiscale e codice riscatto obbligatori'); return; }
    try {
      const resp = await client.finalizzaRiscattoVoucher({ codiceFiscale: verificaCF, codiceRiscatto: verificaCodice });
      checkEsito(resp);
      showSuccess('Riscatto finalizzato con successo');
      setVerificaResult(null);
    } catch (err) {
      showError(`Errore finalizzazione: ${err.message}`);
    }
  };

  return (
    <div className="space-y-4">
      {/* Adesioni */}
      <div className="bg-[#141e2e] rounded-xl border border-slate-700/50 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-white">Adesioni Riscatto Voucher</h3>
          <div className="flex gap-2">
            <button onClick={loadAdesioni} disabled={loading} className="text-slate-400 hover:text-white">
              <FiRefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={() => setShowNewAdesione(true)} className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm flex items-center gap-1.5">
              <FiPlus className="h-3.5 w-3.5" /> Nuova
            </button>
          </div>
        </div>
        {loading ? (
          <LoadingSpinner />
        ) : adesioni.length === 0 ? (
          <p className="text-sm text-slate-500">Nessuna adesione trovata</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700/50 text-xs text-slate-400">
                  <th className="text-left px-3 py-2">Progressivo</th>
                  <th className="text-left px-3 py-2">Codice Tariffa</th>
                  <th className="text-left px-3 py-2">Tipo Tariffario</th>
                  <th className="text-left px-3 py-2">Stato</th>
                  <th className="text-right px-3 py-2">Azioni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {adesioni.map((a, i) => (
                  <tr key={a.progressivo || i} className="hover:bg-slate-800/30">
                    <td className="px-3 py-2 text-sm text-white font-mono">{a.progressivo || '—'}</td>
                    <td className="px-3 py-2 text-sm text-slate-300">{a.codiceTariffa || '—'}</td>
                    <td className="px-3 py-2 text-sm text-slate-400">{a.codiceTipoTariffario || '—'}</td>
                    <td className="px-3 py-2 text-sm text-slate-300">{a.stato || a.descrizioneStato || '—'}</td>
                    <td className="px-3 py-2 text-right">
                      <button onClick={() => handleRevoca(a.progressivo)} className="p-1.5 text-red-400 hover:bg-red-500/10 rounded" title="Revoca">
                        <FiX className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Verifica & Finalizza Riscatto */}
      <div className="bg-[#141e2e] rounded-xl border border-slate-700/50 p-4">
        <h3 className="text-sm font-medium text-white mb-3">Verifica / Finalizza Codice Riscatto</h3>
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Codice Fiscale *</label>
            <input
              type="text"
              value={verificaCF}
              onChange={e => setVerificaCF(e.target.value.toUpperCase())}
              placeholder="RSSMRA80A01H501U"
              className="bg-[#243044] border border-slate-600 rounded-lg px-3 py-2 text-white text-sm w-48 font-mono"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Codice Riscatto *</label>
            <input
              type="text"
              value={verificaCodice}
              onChange={e => setVerificaCodice(e.target.value.toUpperCase())}
              placeholder="ABC123"
              className="bg-[#243044] border border-slate-600 rounded-lg px-3 py-2 text-white text-sm w-32 font-mono"
            />
          </div>
          <button onClick={handleVerifica} disabled={verificaLoading || !verificaCF || !verificaCodice} className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg text-sm flex items-center gap-1.5">
            {verificaLoading ? <LoadingSpinner size="sm" /> : <FiSearch className="h-4 w-4" />} Verifica
          </button>
          <button onClick={handleFinalizza} disabled={!verificaCF || !verificaCodice} className="px-3 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg text-sm flex items-center gap-1.5">
            <FiCheck className="h-4 w-4" /> Finalizza
          </button>
        </div>
        {verificaResult && (
          <pre className="mt-3 text-xs text-slate-300 bg-[#0f1724] rounded-lg p-3 max-h-48 overflow-auto whitespace-pre-wrap">
            {JSON.stringify(verificaResult, null, 2)}
          </pre>
        )}
      </div>

      {/* New Adesione Modal */}
      <Modal isOpen={showNewAdesione} onClose={() => setShowNewAdesione(false)} title="Nuova Adesione Voucher">
          <form onSubmit={handleNewAdesione} className="space-y-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Codice Tariffa *</label>
              <input
                type="text"
                value={newAdesione.codiceTariffa}
                onChange={e => setNewAdesione(f => ({ ...f, codiceTariffa: e.target.value }))}
                className="w-full bg-[#243044] border border-slate-600 rounded-lg px-3 py-2 text-white text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Tipo Tariffario *</label>
              <input
                type="text"
                value={newAdesione.codiceTipoTariffario}
                onChange={e => setNewAdesione(f => ({ ...f, codiceTipoTariffario: e.target.value.toUpperCase() }))}
                className="w-full bg-[#243044] border border-slate-600 rounded-lg px-3 py-2 text-white text-sm"
                required
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowNewAdesione(false)} className="px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 rounded-lg">Annulla</button>
              <button type="submit" disabled={newFormLoading} className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg flex items-center gap-1.5">
                {newFormLoading ? <LoadingSpinner size="sm" /> : <FiPlus className="h-4 w-4" />}
                Crea Adesione
              </button>
            </div>
          </form>
        </Modal>
    </div>
  );
}
