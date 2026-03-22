/**
 * Sales Quotes List
 * Lista preventivi con filtri e azioni
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrg } from '../context/OrgContext';
import { listQuotes, deleteQuote, sendQuote, convertQuoteToOrder } from '../lib/sales';
import { FiPlus, FiEye, FiTrash2, FiSend, FiShoppingCart, FiFilter } from 'react-icons/fi';

export default function SalesQuotes() {
  const navigate = useNavigate();
  const { orgId } = useOrg();
  const [loading, setLoading] = useState(true);
  const [quotes, setQuotes] = useState([]);
  const [filters, setFilters] = useState({
    status: '',
    client_id: '',
    from_date: '',
    to_date: ''
  });

  useEffect(() => {
    if (orgId) loadQuotes();
  }, [orgId, filters]);

  async function loadQuotes() {
    setLoading(true);
    try {
      const data = await listQuotes(orgId, filters);
      setQuotes(data);
    } catch (err) {
      console.error('Errore caricamento preventivi:', err);
      alert('Errore caricamento preventivi');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(quoteId) {
    if (!confirm('Eliminare questo preventivo?')) return;
    
    try {
      await deleteQuote(quoteId);
      loadQuotes();
    } catch (err) {
      console.error('Errore eliminazione:', err);
      alert('Errore eliminazione preventivo');
    }
  }

  async function handleSend(quoteId) {
    if (!confirm('Inviare questo preventivo al cliente?')) return;
    
    try {
      await sendQuote(quoteId);
      loadQuotes();
    } catch (err) {
      console.error('Errore invio:', err);
      alert('Errore invio preventivo');
    }
  }

  async function handleConvert(quoteId) {
    if (!confirm('Convertire questo preventivo in ordine?')) return;
    
    try {
      const order = await convertQuoteToOrder(quoteId);
      navigate(`/vendite/ordini/${order.id}`);
    } catch (err) {
      console.error('Errore conversione:', err);
      alert('Errore conversione preventivo: ' + err.message);
    }
  }

  const statusColors = {
    draft: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
    sent: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    accepted: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    rejected: 'bg-red-500/10 text-red-400 border-red-500/20',
    expired: 'bg-amber-500/10 text-amber-400 border-amber-500/20'
  };

  const statusLabels = {
    draft: 'Bozza',
    sent: 'Inviato',
    accepted: 'Accettato',
    rejected: 'Rifiutato',
    expired: 'Scaduto'
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-200">Preventivi</h1>
          <p className="text-sm text-slate-400 mt-1">Gestione preventivi di vendita</p>
        </div>
        <button
          onClick={() => navigate('/vendite/preventivi/nuovo')}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition flex items-center gap-2"
        >
          <FiPlus className="w-4 h-4" />
          Nuovo Preventivo
        </button>
      </div>

      {/* Filtri */}
      <div className="bg-[#1a2536] border border-[#243044] rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <FiFilter className="w-4 h-4 text-slate-400" />
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Filtri</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <select
            value={filters.status}
            onChange={e => setFilters({ ...filters, status: e.target.value })}
            className="px-3 py-2 bg-[#141c27] border border-[#243044] rounded-lg text-sm text-slate-200"
          >
            <option value="">Tutti gli stati</option>
            <option value="draft">Bozza</option>
            <option value="sent">Inviato</option>
            <option value="accepted">Accettato</option>
            <option value="rejected">Rifiutato</option>
            <option value="expired">Scaduto</option>
          </select>
          <input
            type="date"
            value={filters.from_date}
            onChange={e => setFilters({ ...filters, from_date: e.target.value })}
            className="px-3 py-2 bg-[#141c27] border border-[#243044] rounded-lg text-sm text-slate-200"
            placeholder="Da data"
          />
          <input
            type="date"
            value={filters.to_date}
            onChange={e => setFilters({ ...filters, to_date: e.target.value })}
            className="px-3 py-2 bg-[#141c27] border border-[#243044] rounded-lg text-sm text-slate-200"
            placeholder="A data"
          />
          <button
            onClick={() => setFilters({ status: '', client_id: '', from_date: '', to_date: '' })}
            className="px-3 py-2 bg-[#141c27] border border-[#243044] rounded-lg text-sm text-slate-400 hover:text-slate-200 transition"
          >
            Reset Filtri
          </button>
        </div>
      </div>

      {/* Tabella */}
      <div className="bg-[#1a2536] border border-[#243044] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#141c27]">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Numero</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Cliente</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Data</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Scadenza</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Totale</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Stato</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#243044]">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-5 py-8 text-center">
                    <div className="flex items-center justify-center">
                      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  </td>
                </tr>
              ) : quotes.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-5 py-8 text-center text-sm text-slate-400">
                    Nessun preventivo trovato
                  </td>
                </tr>
              ) : (
                quotes.map(quote => (
                  <tr key={quote.id} className="hover:bg-[#141c27] transition">
                    <td className="px-5 py-3 text-sm font-medium text-slate-200">{quote.quote_number}</td>
                    <td className="px-5 py-3 text-sm text-slate-300">{quote.client?.nome || 'N/A'}</td>
                    <td className="px-5 py-3 text-sm text-slate-400">
                      {new Date(quote.issue_date).toLocaleDateString('it-IT')}
                    </td>
                    <td className="px-5 py-3 text-sm text-slate-400">
                      {new Date(quote.valid_until).toLocaleDateString('it-IT')}
                    </td>
                    <td className="px-5 py-3 text-sm font-medium text-slate-200">
                      €{quote.total?.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border ${statusColors[quote.status]}`}>
                        {statusLabels[quote.status]}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => navigate(`/vendite/preventivi/${quote.id}`)}
                          className="p-1.5 text-blue-400 hover:text-blue-300 transition"
                          title="Visualizza"
                        >
                          <FiEye className="w-4 h-4" />
                        </button>
                        {quote.status === 'draft' && (
                          <button
                            onClick={() => handleSend(quote.id)}
                            className="p-1.5 text-emerald-400 hover:text-emerald-300 transition"
                            title="Invia"
                          >
                            <FiSend className="w-4 h-4" />
                          </button>
                        )}
                        {quote.status === 'accepted' && !quote.converted_to_order_id && (
                          <button
                            onClick={() => handleConvert(quote.id)}
                            className="p-1.5 text-purple-400 hover:text-purple-300 transition"
                            title="Converti in ordine"
                          >
                            <FiShoppingCart className="w-4 h-4" />
                          </button>
                        )}
                        {quote.status === 'draft' && (
                          <button
                            onClick={() => handleDelete(quote.id)}
                            className="p-1.5 text-red-400 hover:text-red-300 transition"
                            title="Elimina"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
