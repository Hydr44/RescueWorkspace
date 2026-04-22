import React, { useState, useEffect, useCallback } from 'react';
import {
  FiPlus, FiSearch, FiRefreshCw, FiEdit, FiTrash2, FiXCircle,
  FiCheckCircle, FiCalendar, FiUser, FiChevronLeft, FiChevronRight,
  FiPrinter, FiAlertCircle, FiLogIn
} from 'react-icons/fi';
import { useToast } from '@/hooks/useToast';
import { useRVFUAuth } from '@/hooks/useRVFUAuth';
import { createRVFUClient } from '@/lib/rvfu-client';
import { useOrg } from '@/context/OrgContext';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Modal from '@/components/ui/Modal';
import RVFULogin from '@/components/rvfu/RVFULogin';
import { logger } from '@/lib/logger';

const PAGE_SIZE = 25;

const STATO_STYLES = {
  ATTIVA:    { bg: 'bg-green-500/10',  text: 'text-green-400',  label: 'Attiva' },
  REVOCATA:  { bg: 'bg-red-500/10',    text: 'text-red-400',    label: 'Revocata' },
  SCADUTA:   { bg: 'bg-slate-500/10',  text: 'text-slate-400',  label: 'Scaduta' },
  ANNULLATA: { bg: 'bg-orange-500/10', text: 'text-orange-400', label: 'Annullata' },
};

const StatoBadge = ({ stato }) => {
  const s = STATO_STYLES[stato?.toUpperCase()] || { bg: 'bg-slate-500/10', text: 'text-slate-400', label: stato || '—' };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${s.bg} ${s.text}`}>
      {s.label}
    </span>
  );
};

const fmtDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('it-IT');
};

const EMPTY_FORM = {
  codiceFiscaleDelegato: '',
  matricolaSedeDelegato: '',
  dataInizio: '',
  dataFine: '',
  noteAggiuntive: '',
};

export default function DelegheRVFU() {
  const { showError, showSuccess } = useToast();
  useOrg();
  const { isAuthenticated: rvfuAuthenticated, authService } = useRVFUAuth('formation');

  const [rvfuClient, setRvfuClient] = useState(null);
  const [loading, setLoading] = useState(false);
  const [deleghe, setDeleghe] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [filterStato, setFilterStato] = useState('');

  // Modal state
  const [showForm, setShowForm] = useState(false);
  const [editDelega, setEditDelega] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [formLoading, setFormLoading] = useState(false);

  // Revoca modal
  const [showRevoca, setShowRevoca] = useState(false);
  const [revocaTarget, setRevocaTarget] = useState(null);
  const [revocaData, setRevocaData] = useState({ dataRevoca: '', motivoRevoca: '' });

  // Delete confirm
  const [showDelete, setShowDelete] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Concessionari autocomplete
  const [concessionari, setConcessionari] = useState([]);

  useEffect(() => {
    if (rvfuAuthenticated && authService) {
      const client = createRVFUClient(authService, 'formation');
      setRvfuClient(client);
    }
  }, [rvfuAuthenticated, authService]);

  const loadDeleghe = useCallback(async () => {
    if (!rvfuClient) return;
    setLoading(true);
    try {
      const filters = {
        pageNumber: page,
        pageSize: PAGE_SIZE,
      };
      if (search.trim()) filters.codiceFiscale = search.trim();
      if (filterStato) filters.statoDelega = filterStato;
      const response = await rvfuClient.consultaDeleghe(filters);
      const result = response?.result;
      setDeleghe(result?.content || []);
      setTotal(result?.totalElements || 0);
    } catch (err) {
      logger.error('Error loading deleghe:', err);
      showError(`Errore caricamento deleghe: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [rvfuClient, page, search, filterStato, showError]);

  useEffect(() => {
    loadDeleghe();
  }, [loadDeleghe]);

  const openNew = () => {
    setEditDelega(null);
    setFormData(EMPTY_FORM);
    setConcessionari([]);
    setShowForm(true);
  };

  const openEdit = async (delega) => {
    setEditDelega(delega);
    setFormData({
      codiceFiscaleDelegato: delega.concessionario?.codiceFiscale || '',
      matricolaSedeDelegato: delega.concessionario?.matricolaSede || '',
      dataInizio: delega.dataInizio ? delega.dataInizio.substring(0, 10) : '',
      dataFine: delega.dataFine ? delega.dataFine.substring(0, 10) : '',
      noteAggiuntive: delega.noteAggiuntive || '',
    });
    setConcessionari([]);
    setShowForm(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.codiceFiscaleDelegato || !formData.matricolaSedeDelegato || !formData.dataInizio || !formData.dataFine || !formData.noteAggiuntive) {
      showError('Tutti i campi obbligatori devono essere compilati');
      return;
    }
    setFormLoading(true);
    try {
      const payload = {
        codiceFiscaleDelegato: formData.codiceFiscaleDelegato,
        matricolaSedeDelegato: formData.matricolaSedeDelegato,
        dataInizio: `${formData.dataInizio}T00:00:00Z`,
        dataFine: `${formData.dataFine}T23:59:59Z`,
        noteAggiuntive: formData.noteAggiuntive,
      };
      let resp;
      if (editDelega) {
        resp = await rvfuClient.aggiornaDelega(editDelega.idDelega, payload);
      } else {
        resp = await rvfuClient.inserisciDelega(payload);
      }
      const esito = resp?.esito;
      if (esito && esito.responseStatus !== 'OK' && esito.code !== 'E000') {
        throw new Error(esito.message || esito.descrizione || `Errore (${esito.code})`);
      }
      showSuccess(editDelega ? 'Delega aggiornata con successo' : 'Delega creata con successo');
      setShowForm(false);
      loadDeleghe();
    } catch (err) {
      showError(`Errore: ${err.message}`);
    } finally {
      setFormLoading(false);
    }
  };

  const handleRevoca = async () => {
    if (!revocaTarget || !revocaData.dataRevoca) {
      showError('Inserire la data di revoca');
      return;
    }
    setFormLoading(true);
    try {
      const resp = await rvfuClient.revocaDelega(revocaTarget.idDelega, {
        dataRevoca: `${revocaData.dataRevoca}T23:59:59Z`,
        motivoRevoca: revocaData.motivoRevoca,
      });
      const esito = resp?.esito;
      if (esito && esito.responseStatus !== 'OK' && esito.code !== 'E000') {
        throw new Error(esito.message || `Errore revoca (${esito.code})`);
      }
      showSuccess('Delega revocata con successo');
      setShowRevoca(false);
      setRevocaTarget(null);
      loadDeleghe();
    } catch (err) {
      showError(`Errore revoca: ${err.message}`);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setFormLoading(true);
    try {
      const resp = await rvfuClient.eliminaDelega(deleteTarget.idDelega);
      const esito = resp?.esito;
      if (esito && esito.responseStatus !== 'OK' && esito.code !== 'E000') {
        throw new Error(esito.message || `Errore eliminazione (${esito.code})`);
      }
      showSuccess('Delega annullata con successo');
      setShowDelete(false);
      setDeleteTarget(null);
      loadDeleghe();
    } catch (err) {
      showError(`Errore: ${err.message}`);
    } finally {
      setFormLoading(false);
    }
  };

  const handleStampa = async () => {
    if (!rvfuClient) return;
    try {
      const filters = {};
      if (search.trim()) filters.codiceFiscale = search.trim();
      if (filterStato) filters.statoDelega = filterStato;
      const resp = await rvfuClient.stampaDeleghe(filters);
      if (resp instanceof Blob || resp instanceof ArrayBuffer) {
        const blob = resp instanceof Blob ? resp : new Blob([resp], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `deleghe_${new Date().toISOString().slice(0,10)}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      } else if (resp?.result) {
        showSuccess('Stampa avviata');
      }
    } catch (err) {
      showError(`Errore stampa: ${err.message}`);
    }
  };

  if (!rvfuAuthenticated) {
    return (
      <div className="min-h-screen bg-[#141c27] flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-3 mb-6">
            <FiLogIn className="w-6 h-6 text-blue-400" />
            <h2 className="text-xl font-semibold text-white">Accesso RVFU richiesto</h2>
          </div>
          <RVFULogin environment="formation" />
        </div>
      </div>
    );
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="min-h-screen bg-[#141c27] text-white">
      {/* Header */}
      <div className="bg-[#1a2535] border-b border-slate-700/50 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-white">Deleghe RVFU</h1>
            <p className="text-sm text-slate-400 mt-0.5">Gestione deleghe ai concessionari</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleStampa}
              className="flex items-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm transition-colors"
            >
              <FiPrinter className="h-4 w-4" />
              Stampa PDF
            </button>
            <button
              onClick={openNew}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <FiPlus className="h-4 w-4" />
              Nuova delega
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="px-6 py-4 bg-[#1a2535]/50 border-b border-slate-700/30">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              placeholder="Cerca per codice fiscale..."
              className="w-full pl-9 pr-3 py-2 bg-[#243044] border border-slate-600/50 rounded-lg text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
          </div>
          <select
            value={filterStato}
            onChange={(e) => { setFilterStato(e.target.value); setPage(0); }}
            className="px-3 py-2 bg-[#243044] border border-slate-600/50 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
          >
            <option value="">Tutti gli stati</option>
            <option value="ATTIVA">Attiva</option>
            <option value="REVOCATA">Revocata</option>
            <option value="SCADUTA">Scaduta</option>
            <option value="ANNULLATA">Annullata</option>
          </select>
          <button
            onClick={loadDeleghe}
            className="p-2 text-slate-400 hover:text-white transition-colors"
            title="Aggiorna"
          >
            <FiRefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <span className="text-xs text-slate-500">{total} delega/e</span>
        </div>
      </div>

      {/* Table */}
      <div className="px-6 py-4">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <LoadingSpinner size="lg" />
          </div>
        ) : deleghe.length === 0 ? (
          <div className="text-center py-20 text-slate-500">
            <FiUser className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>Nessuna delega trovata</p>
          </div>
        ) : (
          <div className="bg-[#1a2535] rounded-xl border border-slate-700/50 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700/50 text-xs text-slate-400 uppercase tracking-wider">
                  <th className="px-4 py-3 text-left">ID</th>
                  <th className="px-4 py-3 text-left">Concessionario</th>
                  <th className="px-4 py-3 text-left">Sede</th>
                  <th className="px-4 py-3 text-left">Dal</th>
                  <th className="px-4 py-3 text-left">Al</th>
                  <th className="px-4 py-3 text-left">Stato</th>
                  <th className="px-4 py-3 text-left">Note</th>
                  <th className="px-4 py-3 text-right">Azioni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {deleghe.map((d) => (
                  <tr key={d.idDelega} className="hover:bg-slate-700/20 transition-colors">
                    <td className="px-4 py-3 text-xs font-mono text-slate-400">{d.idDelega}</td>
                    <td className="px-4 py-3">
                      <div className="text-xs text-slate-300 font-medium">
                        {d.concessionario?.denominazioneSociale || '—'}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {d.concessionario?.codiceFiscale}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400 font-mono">
                      {d.concessionario?.matricolaSede || '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-300">
                      <div className="flex items-center gap-1">
                        <FiCalendar className="h-3 w-3 text-slate-500" />
                        {fmtDate(d.dataInizio)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-300">
                      {fmtDate(d.dataFine)}
                    </td>
                    <td className="px-4 py-3">
                      <StatoBadge stato={d.statoDelega} />
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400 max-w-[180px] truncate">
                      {d.noteAggiuntive || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {d.statoDelega === 'ATTIVA' && (
                          <>
                            <button
                              onClick={() => openEdit(d)}
                              className="p-1.5 text-slate-400 hover:text-blue-400 transition-colors rounded"
                              title="Modifica"
                            >
                              <FiEdit className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => { setRevocaTarget(d); setRevocaData({ dataRevoca: '', motivoRevoca: '' }); setShowRevoca(true); }}
                              className="p-1.5 text-slate-400 hover:text-yellow-400 transition-colors rounded"
                              title="Revoca"
                            >
                              <FiXCircle className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => { setDeleteTarget(d); setShowDelete(true); }}
                              className="p-1.5 text-slate-400 hover:text-red-400 transition-colors rounded"
                              title="Annulla"
                            >
                              <FiTrash2 className="h-3.5 w-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <span className="text-xs text-slate-400">
              Pagina {page + 1} di {totalPages} — {total} deleghe totali
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="p-2 text-slate-400 hover:text-white disabled:opacity-30 transition-colors"
              >
                <FiChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="p-2 text-slate-400 hover:text-white disabled:opacity-30 transition-colors"
              >
                <FiChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Form Modal (Nuova / Modifica) */}
      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={editDelega ? 'Modifica delega' : 'Nuova delega'}>
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Codice Fiscale Concessionario *</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={formData.codiceFiscaleDelegato}
                onChange={(e) => setFormData(f => ({ ...f, codiceFiscaleDelegato: e.target.value.toUpperCase() }))}
                className="flex-1 bg-[#243044] border border-slate-600 rounded-lg px-3 py-2 text-white text-sm font-mono focus:outline-none focus:border-blue-500"
                placeholder="Codice fiscale (16 char)"
                maxLength={16}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Matricola Sede Delegato *</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={formData.matricolaSedeDelegato}
                onChange={(e) => setFormData(f => ({ ...f, matricolaSedeDelegato: e.target.value.toUpperCase() }))}
                className="flex-1 bg-[#243044] border border-slate-600 rounded-lg px-3 py-2 text-white text-sm font-mono focus:outline-none focus:border-blue-500"
                placeholder="es. RMCN0003 (8 char)"
                maxLength={8}
                required
              />
            </div>
            <p className="text-[10px] text-slate-500 mt-1">Matricola sede del concessionario (8 caratteri)</p>
            {concessionari.length > 0 && (
              <div className="mt-2 bg-[#1a2535] border border-slate-600 rounded-lg divide-y divide-slate-700/50">
                {concessionari.slice(0, 5).map((c) => (
                  <button
                    key={c.matricolaSede}
                    type="button"
                    onClick={() => {
                      setFormData(f => ({
                        ...f,
                        codiceFiscaleDelegato: c.codiceFiscale,
                        matricolaSedeDelegato: c.matricolaSede,
                      }));
                      setConcSearch(c.denominazioneSociale);
                      setConcessionari([]);
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-slate-700/40 transition-colors"
                  >
                    <div className="text-xs text-white">{c.denominazioneSociale}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{c.codiceFiscale} — {c.matricolaSede}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Data Inizio *</label>
              <input
                type="date"
                value={formData.dataInizio}
                onChange={(e) => setFormData(f => ({ ...f, dataInizio: e.target.value }))}
                className="w-full bg-[#243044] border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Data Fine *</label>
              <input
                type="date"
                value={formData.dataFine}
                onChange={(e) => setFormData(f => ({ ...f, dataFine: e.target.value }))}
                className="w-full bg-[#243044] border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Note aggiuntive *</label>
            <textarea
              value={formData.noteAggiuntive}
              onChange={(e) => setFormData(f => ({ ...f, noteAggiuntive: e.target.value }))}
              rows={3}
              maxLength={600}
              className="w-full bg-[#243044] border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 resize-none"
              placeholder="Note obbligatorie (max 600 caratteri)"
              required
            />
            <p className="text-[10px] text-slate-500 mt-1">{formData.noteAggiuntive.length}/600</p>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm transition-colors"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={formLoading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {formLoading ? <LoadingSpinner size="sm" /> : <FiCheckCircle className="h-4 w-4" />}
              {editDelega ? 'Aggiorna' : 'Crea delega'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Revoca Modal */}
      <Modal isOpen={showRevoca} onClose={() => setShowRevoca(false)} title="Revoca delega">
        <div className="space-y-4">
          {revocaTarget && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 text-sm text-yellow-300">
              <FiAlertCircle className="inline h-4 w-4 mr-1" />
              Stai revocando la delega a <strong>{revocaTarget.concessionario?.denominazioneSociale}</strong>
            </div>
          )}
          <div>
            <label className="block text-xs text-slate-400 mb-1">Data revoca *</label>
            <input
              type="date"
              value={revocaData.dataRevoca}
              onChange={(e) => setRevocaData(r => ({ ...r, dataRevoca: e.target.value }))}
              className="w-full bg-[#243044] border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Motivo revoca</label>
            <textarea
              value={revocaData.motivoRevoca}
              onChange={(e) => setRevocaData(r => ({ ...r, motivoRevoca: e.target.value }))}
              rows={2}
              className="w-full bg-[#243044] border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 resize-none"
              placeholder="Motivo opzionale..."
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setShowRevoca(false)} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm transition-colors">
              Annulla
            </button>
            <button
              onClick={handleRevoca}
              disabled={formLoading || !revocaData.dataRevoca}
              className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {formLoading ? <LoadingSpinner size="sm" /> : <FiXCircle className="h-4 w-4" />}
              Revoca
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal isOpen={showDelete} onClose={() => setShowDelete(false)} title="Annulla delega">
        <div className="space-y-4">
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-300">
            <FiAlertCircle className="inline h-4 w-4 mr-1" />
            Confermi l&apos;annullamento della delega {deleteTarget?.idDelega} a <strong>{deleteTarget?.concessionario?.denominazioneSociale}</strong>?
            <div className="mt-1 text-xs text-red-400">Questa operazione non è reversibile.</div>
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setShowDelete(false)} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm transition-colors">
              No, torna indietro
            </button>
            <button
              onClick={handleDelete}
              disabled={formLoading}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {formLoading ? <LoadingSpinner size="sm" /> : <FiTrash2 className="h-4 w-4" />}
              Annulla delega
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
