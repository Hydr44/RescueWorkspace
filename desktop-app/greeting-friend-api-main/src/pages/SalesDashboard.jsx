/**
 * Sales Dashboard
 * Dashboard vendite con KPI, grafici, ordini recenti
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrg } from '../context/OrgContext';
import { listOrders, listQuotes } from '../lib/sales';
import { FiDollarSign, FiFileText, FiShoppingCart, FiTrendingUp, FiPlus, FiEye } from 'react-icons/fi';

export default function SalesDashboard() {
  const navigate = useNavigate();
  const { orgId } = useOrg();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    todaySales: 0,
    monthSales: 0,
    openQuotes: 0,
    activeOrders: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);

  useEffect(() => {
    if (orgId) loadDashboard();
  }, [orgId]);

  async function loadDashboard() {
    setLoading(true);
    try {
      const [orders, quotes] = await Promise.all([
        listOrders(orgId),
        listQuotes(orgId)
      ]);

      // Calcola statistiche
      const today = new Date().toISOString().split('T')[0];
      const thisMonth = new Date().toISOString().slice(0, 7);

      const todaySales = orders
        .filter(o => o.order_date === today && o.status !== 'cancelled')
        .reduce((sum, o) => sum + (o.total || 0), 0);

      const monthSales = orders
        .filter(o => o.order_date?.startsWith(thisMonth) && o.status !== 'cancelled')
        .reduce((sum, o) => sum + (o.total || 0), 0);

      const openQuotes = quotes.filter(q => ['draft', 'sent'].includes(q.status)).length;
      const activeOrders = orders.filter(o => ['new', 'confirmed', 'preparing', 'ready'].includes(o.status)).length;

      setStats({ todaySales, monthSales, openQuotes, activeOrders });
      setRecentOrders(orders.slice(0, 10));
    } catch (err) {
      console.error('Errore caricamento dashboard vendite:', err);
    } finally {
      setLoading(false);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-200">Dashboard Vendite</h1>
          <p className="text-sm text-slate-400 mt-1">Panoramica vendite e ordini</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/vendite/preventivi/nuovo')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition flex items-center gap-2"
          >
            <FiPlus className="w-4 h-4" />
            Nuovo Preventivo
          </button>
          <button
            onClick={() => navigate('/vendite/ordini/nuovo')}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg transition flex items-center gap-2"
          >
            <FiPlus className="w-4 h-4" />
            Nuovo Ordine
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#1a2536] border border-[#243044] rounded-xl p-5 hover:border-blue-500/30 transition">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
              <FiDollarSign className="w-5 h-5 text-blue-400" />
            </div>
          </div>
          <div className="text-2xl font-semibold text-slate-200">
            €{stats.todaySales.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-slate-400 mt-1">Vendite Oggi</div>
        </div>

        <div className="bg-[#1a2536] border border-[#243044] rounded-xl p-5 hover:border-emerald-500/30 transition">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center">
              <FiTrendingUp className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
          <div className="text-2xl font-semibold text-slate-200">
            €{stats.monthSales.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-slate-400 mt-1">Vendite Mese</div>
        </div>

        <div className="bg-[#1a2536] border border-[#243044] rounded-xl p-5 hover:border-amber-500/30 transition">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-amber-500/10 rounded-lg flex items-center justify-center">
              <FiFileText className="w-5 h-5 text-amber-400" />
            </div>
          </div>
          <div className="text-2xl font-semibold text-slate-200">{stats.openQuotes}</div>
          <div className="text-xs text-slate-400 mt-1">Preventivi Aperti</div>
        </div>

        <div className="bg-[#1a2536] border border-[#243044] rounded-xl p-5 hover:border-purple-500/30 transition">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
              <FiShoppingCart className="w-5 h-5 text-purple-400" />
            </div>
          </div>
          <div className="text-2xl font-semibold text-slate-200">{stats.activeOrders}</div>
          <div className="text-xs text-slate-400 mt-1">Ordini Attivi</div>
        </div>
      </div>

      {/* Azioni Rapide */}
      <div className="bg-[#1a2536] border border-[#243044] rounded-xl p-5">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Azioni Rapide</h2>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => navigate('/vendite/preventivi')}
            className="p-4 bg-[#141c27] border border-[#243044] rounded-lg hover:border-blue-500/30 transition text-left"
          >
            <FiFileText className="w-5 h-5 text-blue-400 mb-2" />
            <div className="text-sm font-medium text-slate-200">Preventivi</div>
            <div className="text-xs text-slate-400">Gestisci preventivi</div>
          </button>
          <button
            onClick={() => navigate('/vendite/ordini')}
            className="p-4 bg-[#141c27] border border-[#243044] rounded-lg hover:border-emerald-500/30 transition text-left"
          >
            <FiShoppingCart className="w-5 h-5 text-emerald-400 mb-2" />
            <div className="text-sm font-medium text-slate-200">Ordini</div>
            <div className="text-xs text-slate-400">Gestisci ordini</div>
          </button>
        </div>
      </div>

      {/* Ordini Recenti */}
      <div className="bg-[#1a2536] border border-[#243044] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#243044]">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Ordini Recenti</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#141c27]">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Numero</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Cliente</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Data</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Totale</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Stato</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#243044]">
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-5 py-8 text-center text-sm text-slate-400">
                    Nessun ordine recente
                  </td>
                </tr>
              ) : (
                recentOrders.map(order => (
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
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border ${statusColors[order.status]}`}>
                        {statusLabels[order.status]}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => navigate(`/vendite/ordini/${order.id}`)}
                        className="text-blue-400 hover:text-blue-300 transition"
                      >
                        <FiEye className="w-4 h-4" />
                      </button>
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
