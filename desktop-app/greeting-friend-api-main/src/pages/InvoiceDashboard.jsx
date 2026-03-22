// src/pages/InvoiceDashboard.jsx
/**
 * Dashboard Fatture
 * Panoramica statistiche fatture e fatturato
 */

import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiFileText, FiTrendingUp, FiDollarSign, FiCheckCircle,
  FiClock, FiPlus, FiRefreshCw, FiAlertCircle, FiArrowRight
} from "react-icons/fi";
import { useOrg } from "../context/OrgContext";
import { supabaseBrowser } from "../lib/supabase-browser";

export default function InvoiceDashboard() {
  const navigate = useNavigate();
  const { orgId } = useOrg();
  
  const [stats, setStats] = useState({
    totalInvoices: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    invoicesThisMonth: 0,
    draftInvoices: 0,
    validatedInvoices: 0,
    sentInvoices: 0,
    deliveredInvoices: 0,
    rejectedInvoices: 0,
    paidInvoices: 0,
    pendingInvoices: 0,
    monthlyTrend: [],
    topCustomers: [],
  });
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [orgId]);

  async function loadStats() {
    if (!orgId) return;
    
    setLoading(true);
    try {
      const supabase = supabaseBrowser();
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      
      // Statistiche base
      const { data: allInvoices, error: errAll } = await supabase
        .from("invoices")
        .select("id, total, date, sdi_status, payment_status, customer_name, created_at")
        .eq("org_id", orgId);
      
      if (errAll) throw errAll;
      
      const invoices = allInvoices || [];
      
      // Calcola statistiche
      const totalInvoices = invoices.length;
      const totalRevenue = invoices.reduce((sum, inv) => sum + (Number(inv.total) || 0), 0);
      
      const invoicesThisMonth = invoices.filter(inv => 
        inv.date && new Date(inv.date) >= startOfMonth
      );
      const monthlyRevenue = invoicesThisMonth.reduce((sum, inv) => 
        sum + (Number(inv.total) || 0), 0
      );
      
      // Per stato SDI
      const draftInvoices = invoices.filter(inv => inv.sdi_status === "draft").length;
      const validatedInvoices = invoices.filter(inv => inv.sdi_status === "validated").length;
      const sentInvoices = invoices.filter(inv => inv.sdi_status === "sent").length;
      const deliveredInvoices = invoices.filter(inv => inv.sdi_status === "delivered").length;
      const rejectedInvoices = invoices.filter(inv => inv.sdi_status === "rejected").length;
      
      // Per stato pagamento
      const paidInvoices = invoices.filter(inv => inv.payment_status === "paid").length;
      const pendingInvoices = invoices.filter(inv => 
        !inv.payment_status || inv.payment_status === "pending"
      ).length;
      
      // Trend mensile (ultimi 6 mesi)
      const monthlyTrend = [];
      for (let i = 5; i >= 0; i--) {
        const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
        const monthInvoices = invoices.filter(inv => {
          if (!inv.date) return false;
          const invDate = new Date(inv.date);
          return invDate >= monthStart && invDate <= monthEnd;
        });
        const monthRevenue = monthInvoices.reduce((sum, inv) => 
          sum + (Number(inv.total) || 0), 0
        );
        monthlyTrend.push({
          month: monthStart.toLocaleDateString('it-IT', { month: 'short', year: 'numeric' }),
          count: monthInvoices.length,
          revenue: monthRevenue
        });
      }
      
      // Top clienti (per fatturato)
      const customerRevenue = {};
      invoices.forEach(inv => {
        const customer = inv.customer_name || "Sconosciuto";
        if (!customerRevenue[customer]) {
          customerRevenue[customer] = { name: customer, count: 0, revenue: 0 };
        }
        customerRevenue[customer].count++;
        customerRevenue[customer].revenue += Number(inv.total) || 0;
      });
      
      const topCustomers = Object.values(customerRevenue)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);
      
      setStats({
        totalInvoices,
        totalRevenue,
        monthlyRevenue,
        invoicesThisMonth: invoicesThisMonth.length,
        draftInvoices,
        validatedInvoices,
        sentInvoices,
        deliveredInvoices,
        rejectedInvoices,
        paidInvoices,
        pendingInvoices,
        monthlyTrend,
        topCustomers,
      });
    } catch (error) {
      console.error("[INVOICE-DASHBOARD] Errore caricamento statistiche:", error);
    } finally {
      setLoading(false);
    }
  }

  function StatCard({ icon: Icon, label, value, color, link, subtitle }) {
    const colors = {
      indigo: "text-blue-400 bg-blue-500/10 border-blue-500/20",
      green: "text-green-400 bg-green-500/10 border-green-500/20",
      blue: "text-blue-400 bg-blue-500/10 border-blue-500/20",
      yellow: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
      red: "text-red-400 bg-red-500/10 border-red-500/20",
      purple: "text-purple-400 bg-purple-500/10 border-purple-500/20",
    };
    
    const content = (
      <div className={`p-6 rounded-xl border ${colors[color] || colors.indigo} transition-all hover:`}>
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-lg ${colors[color] || colors.indigo}`}>
            <Icon className="w-6 h-6" />
          </div>
          {link && (
            <Link
              to={link}
              className="text-xs font-medium hover:underline opacity-70 hover:opacity-100"
            >
              Vedi tutto <FiArrowRight className="inline ml-1" />
            </Link>
          )}
        </div>
        <div>
          <div className="text-2xl font-bold text-slate-200 mb-1">
            {typeof value === "number" && label.includes("€")
              ? value.toFixed(2) + " €"
              : value.toLocaleString("it-IT")
            }
          </div>
          <div className="text-sm text-slate-400">{label}</div>
          {subtitle && (
            <div className="text-xs text-slate-500  mt-1">{subtitle}</div>
          )}
        </div>
      </div>
    );
    
    if (link) {
      return <Link to={link}>{content}</Link>;
    }
    return content;
  }

  const EUR = (val) => (typeof val === "number" ? Number(val).toFixed(2) + " €" : "—");

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <FiRefreshCw className="w-5 h-5 animate-spin text-slate-500 mx-auto mb-2" />
          <p className="text-xs text-slate-500">Caricamento statistiche...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-slate-100">Dashboard Fatture</h1>
            <p className="text-xs text-slate-500 mt-0.5">Panoramica statistiche fatture e fatturato</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadStats}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-300 bg-[#1a2536] border border-[#243044] rounded-lg hover:bg-[#243044] transition-colors"
            >
              <FiRefreshCw className="w-3.5 h-3.5" />
              Aggiorna
            </button>
            <button
              onClick={() => navigate("/fatture/new")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors"
            >
              <FiPlus className="w-3.5 h-3.5" />
              Nuova Fattura
            </button>
          </div>
        </div>

        {/* Statistiche Principali */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            icon={FiFileText}
            label="Totale Fatture"
            value={stats.totalInvoices}
            color="indigo"
            link="/fatture"
          />
          <StatCard
            icon={FiDollarSign}
            label="Fatturato Totale"
            value={EUR(stats.totalRevenue)}
            color="green"
          />
          <StatCard
            icon={FiTrendingUp}
            label="Fatturato Mese"
            value={EUR(stats.monthlyRevenue)}
            color="blue"
            subtitle={`${stats.invoicesThisMonth} fatture`}
          />
          <StatCard
            icon={FiCheckCircle}
            label="Fatture Consegnate"
            value={stats.deliveredInvoices}
            color="green"
            link="/fatture?stato=delivered"
          />
        </div>

        {/* Statistiche Secondarie */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <StatCard
            icon={FiClock}
            label="In Bozza"
            value={stats.draftInvoices}
            color="yellow"
            link="/fatture?stato=draft"
          />
          <StatCard
            icon={FiCheckCircle}
            label="Validata"
            value={stats.validatedInvoices}
            color="blue"
            link="/fatture?stato=validated"
          />
          <StatCard
            icon={FiAlertCircle}
            label="Rifiutate"
            value={stats.rejectedInvoices}
            color="red"
            link="/fatture?stato=rejected"
          />
        </div>

        {/* Trend Mensile e Top Clienti */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Trend Mensile */}
          <div className="bg-[#1a2536] rounded-xl border border-[#243044] p-6">
            <h2 className="text-lg font-semibold text-slate-200 mb-4">
              Trend Mensile (Ultimi 6 Mesi)
            </h2>
            <div className="space-y-3">
              {stats.monthlyTrend.map((month, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-slate-200">
                        {month.month}
                      </span>
                      <span className="text-sm font-semibold text-green-600">
                        {EUR(month.revenue)}
                      </span>
                    </div>
                    <div className="w-full bg-[#243044]  rounded-full h-2">
                      <div
                        className="bg-emerald-600 h-2 rounded-full transition-all"
                        style={{
                          width: `${stats.totalRevenue > 0 ? (month.revenue / stats.totalRevenue) * 100 : 0}%`
                        }}
                      />
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {month.count} fatture
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Clienti */}
          <div className="bg-[#1a2536] rounded-xl border border-[#243044] p-6">
            <h2 className="text-lg font-semibold text-slate-200 mb-4">
              Top 5 Clienti (per Fatturato)
            </h2>
            <div className="space-y-3">
              {stats.topCustomers.length > 0 ? (
                stats.topCustomers.map((customer, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-[#141c27]/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-500/10 rounded-full flex items-center justify-center">
                        <span className="text-xs font-semibold text-blue-400">
                          #{idx + 1}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-slate-200">
                          {customer.name}
                        </div>
                        <div className="text-xs text-slate-500">
                          {customer.count} fatture
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-green-600">
                        {EUR(customer.revenue)}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-500">
                  Nessun dato disponibile
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Azioni Rapide */}
        <div className="bg-[#1a2536] rounded-xl border border-[#243044] p-6">
          <h2 className="text-lg font-semibold text-slate-200 mb-4">
            Azioni Rapide
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              to="/fatture/new"
              className="p-4 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all duration-200  hover: flex items-center gap-3"
            >
              <FiPlus className="w-5 h-5" />
              <div>
                <div className="font-semibold">Nuova Fattura</div>
                <div className="text-xs opacity-90">Crea una nuova fattura elettronica</div>
              </div>
            </Link>
            <Link
              to="/fatture?stato=draft"
              className="p-4 bg-amber-500/10 border border-yellow-500/20 rounded-lg hover:bg-yellow-500/10 transition-colors flex items-center gap-3"
            >
              <FiClock className="w-5 h-5 text-yellow-600" />
              <div>
                <div className="font-semibold text-slate-200">
                  Bozze ({stats.draftInvoices})
                </div>
                <div className="text-xs text-slate-400">
                  Fatture in bozza da completare
                </div>
              </div>
            </Link>
            <Link
              to="/fatture"
              className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg hover:bg-blue-500/10 transition-colors flex items-center gap-3"
            >
              <FiFileText className="w-5 h-5 text-blue-400" />
              <div>
                <div className="font-semibold text-slate-200">
                  Tutte le Fatture
                </div>
                <div className="text-xs text-slate-400">
                  Visualizza elenco completo
                </div>
              </div>
            </Link>
          </div>
        </div>
    </div>
  );
}
