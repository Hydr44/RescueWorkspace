/**
 * Sales Orders List
 * Lista ordini con filtri e azioni
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrg } from '../context/OrgContext';
import { listOrders, deleteOrder, updateOrderStatus } from '../lib/sales';
import { FiPlus, FiEye, FiTrash2, FiCheck, FiFilter } from 'react-icons/fi';

export default function SalesOrders() {
  const navigate = useNavigate();
  const { orgId } = useOrg();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [filters, setFilters] = useState({
    status: '',
    client_id: '',
    from_date: '',
    to_date: ''
  });

  useEffect(() => {
    if (orgId) loadOrders();
  }, [orgId, filters]);

  async function loadOrders() {
    setLoading(true);
    try {
      const data = await listOrders(orgId, filters);
      setOrders(data);
    } catch (err) {
      console.error('Errore caricamento ordini:', err);
      alert('Errore caricamento ordini');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(orderId) {
    if (!confirm('Eliminare questo ordine?')) return;
    
    try {
      await deleteOrder(orderId);
      loadOrders();
    } catch (err) {
      console.error('Errore eliminazione:', err);
      alert('Errore eliminazione ordine');
    }
  }

  async function handleConfirm(orderId) {
    try {
      await updateOrderStatus(orderId, 'confirmed');
      loadOrders();
    } catch (err) {
      console.error('Errore conferma:', err);
      alert('Errore conferma ordine');
    }
  }

  async function handleDeliver(orderId) {
    if (!confirm('Segnare questo ordine come consegnato?')) return;
    
    try {
      await updateOrderStatus(orderId, 'delivered');
      loadOrders();
    } catch (err) {
      console.error('Errore consegna:', err);
      alert('Errore consegna ordine');
    }
  }

  const statusColors = {
    new: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    confirmed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    preparing: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    ready: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    shipped: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    delivered: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    invoiced: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
    cancelled: 'bg-red-500/10 text-red-400 border-red-500/20'
  };

  const statusLabels = {
    new: 'Nuovo',
    confirmed: 'Confermato',
    preparing: 'In preparazione',
    ready: 'Pronto',
    shipped: 'Spedito',
    delivered: 'Consegnato',
    invoiced: 'Fatturato',
    cancelled: 'Annullato'
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-200">Ordini</h1>
          <p className="text-sm text-slate-400 mt-1">Gestione ordini di vendita</p>
        </div>
        <button
          onClick={() => navigate('/vendite/ordini/nuovo')}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg transition flex items-center gap-2"
        >
          <FiPlus className="w-4 h-4" />
          Nuovo Ordine
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
            <option value="new">Nuovo</option>
            <option value="confirmed">Confermato</option>
            <option value="preparing">In preparazione</option>
            <option value="ready">Pronto</option>
            <option value="shipped">Spedito</option>
            <option value="delivered">Consegnato</option>
            <option value="invoiced">Fatturato</option>
            <option value="cancelled">Annullato</option>
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
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Totale</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Pagamento</th>
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
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-5 py-8 text-center text-sm text-slate-400">
                    Nessun ordine trovato
                  </td>
                </tr>
              ) : (
                orders.map(order => (
                  <tr key={order.id} className="hover:bg-[#141c27] transition">
                    <td className="px-5 py-3 text-sm font-medium text-slate-200">{order.order_number}</td>
                    <td className="px-5 py-3 text-sm text-slate-300">{order.client?.nome || 'N/A'}</td>
                    <td className="px-5 py-3 text-sm text-slate-400">
                      {new Date(order.order_date).toLocaleDateString('it-IT')}
                    </td>
                    <td className="px-5 py-3 text-sm font-medium text-slate-200">
                      €{order.total?.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${
                        order.payment_status === 'paid' ? 'bg-emerald-500/10 text-emerald-400' :
                        order.payment_status === 'partial' ? 'bg-amber-500/10 text-amber-400' :
                        'bg-slate-500/10 text-slate-400'
                      }`}>
                        {order.payment_status === 'paid' ? 'Pagato' :
                         order.payment_status === 'partial' ? 'Parziale' :
                         'In attesa'}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border ${statusColors[order.status]}`}>
                        {statusLabels[order.status]}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => navigate(`/vendite/ordini/${order.id}`)}
                          className="p-1.5 text-blue-400 hover:text-blue-300 transition"
                          title="Visualizza"
                        >
                          <FiEye className="w-4 h-4" />
                        </button>
                        {order.status === 'new' && (
                          <button
                            onClick={() => handleConfirm(order.id)}
                            className="p-1.5 text-emerald-400 hover:text-emerald-300 transition"
                            title="Conferma"
                          >
                            <FiCheck className="w-4 h-4" />
                          </button>
                        )}
                        {['confirmed', 'preparing', 'ready', 'shipped'].includes(order.status) && (
                          <button
                            onClick={() => handleDeliver(order.id)}
                            className="p-1.5 text-purple-400 hover:text-purple-300 transition"
                            title="Segna come consegnato"
                          >
                            <FiCheck className="w-4 h-4" />
                          </button>
                        )}
                        {order.status === 'new' && (
                          <button
                            onClick={() => handleDelete(order.id)}
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
