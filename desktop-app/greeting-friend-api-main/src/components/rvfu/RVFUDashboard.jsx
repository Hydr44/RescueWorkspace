import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { 
  FiBarChart, FiTrendingUp, FiTrendingDown, FiClock, 
  FiCheckCircle, FiRefreshCw, FiShield, FiFileText, FiDownload,
  FiActivity
} from 'react-icons/fi';
import { useOrg } from '@/context/OrgContext';
import { supabase } from '@/lib/supabase-browser';
import { useToast } from '@/hooks/useToast';
import { logger } from '@/lib/logger';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import LoadingButton from '@/components/ui/LoadingButton';

const TABLE = "demolition_cases";

// Componente StatCard migliorato
const StatCard = ({ title, value, icon: Icon, color, trend, subtitle, className = '' }) => {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    yellow: 'from-yellow-500 to-yellow-600',
    red: 'from-red-500 to-red-600',
    purple: 'from-purple-500 to-purple-600',
    indigo: 'from-indigo-500 to-indigo-600'
  };

  const iconBgClasses = {
    blue: 'bg-blue-500/10',
    green: 'bg-green-500/10',
    yellow: 'bg-yellow-500/10',
    red: 'bg-red-500/10',
    purple: 'bg-purple-500/10',
    indigo: 'bg-blue-500/10'
  };

  const iconColorClasses = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    yellow: 'text-yellow-600',
    red: 'text-red-600',
    purple: 'text-purple-600',
    indigo: 'text-indigo-600'
  };

  return (
    <div className={`group relative overflow-hidden bg-[#141c27] rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 ${className}`}>
      {/* Background overlay */}
      <div className={`absolute inset-0 ${colorClasses[color]} opacity-5 group-hover:opacity-10 transition-opacity duration-300`}></div>
      
      <div className="relative p-6">
        <div className="flex items-center justify-between">
          <div className={`p-3 rounded-xl ${iconBgClasses[color]} transition-all duration-300 group-hover:scale-110`}>
            <Icon className={`h-6 w-6 ${iconColorClasses[color]}`} />
          </div>
          {trend !== undefined && (
            <div className={`flex items-center gap-1 text-sm font-medium ${
              trend > 0 ? 'text-green-600' : 
              trend < 0 ? 'text-red-600' : 
              'text-slate-500'
            }`}>
              {trend > 0 ? <FiTrendingUp className="h-4 w-4" /> : 
               trend < 0 ? <FiTrendingDown className="h-4 w-4" /> : null}
              {trend !== 0 && Math.abs(trend)}
            </div>
          )}
        </div>
        
        <div className="mt-4">
          <p className="text-sm font-medium text-slate-400">{title}</p>
          <p className="text-3xl font-bold text-slate-200 mt-1">{value}</p>
          {subtitle && (
            <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  );
};

// Componente Chart Card migliorato
const ChartCard = ({ title, icon: Icon, children, className = '' }) => (
  <div className={`bg-[#141c27] rounded-2xl shadow-lg border border-[#243044]  overflow-hidden ${className}`}>
    <div className="p-6 border-b border-[#243044] ">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-500/10 rounded-lg">
          <Icon className="h-5 w-5 text-indigo-600" />
        </div>
        <h3 className="text-lg font-semibold text-slate-200">{title}</h3>
      </div>
    </div>
    <div className="p-6">
      {children}
    </div>
  </div>
);

const RVFUDashboard = ({ className = '' }) => {
  const { orgId } = useOrg();
  const { showError } = useToast();

  const [stats, setStats] = useState({
    totalCases: 0,
    rvfuSynced: 0,
    rvfuPending: 0,
    draftCases: 0,
    monthlyTrend: [],
    causaliStats: [],
    statusDistribution: [],
    recentActivity: [],
  });
  
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30d');

  const fetchStats = useCallback(async () => {
    if (!orgId) return;

    setLoading(true);
    try {
      let query = supabase
        .from(TABLE)
        .select(`
          id,
          created_at,
          stato,
          rvfu_id,
          rvfu_causale
        `)
        .eq('org_id', orgId);

      const now = new Date();
      let startDate;
      if (dateRange === '7d') {
        startDate = new Date(now.setDate(now.getDate() - 7));
      } else if (dateRange === '30d') {
        startDate = new Date(now.setMonth(now.getMonth() - 1));
      } else if (dateRange === '90d') {
        startDate = new Date(now.setMonth(now.getMonth() - 3));
      } else if (dateRange === '1y') {
        startDate = new Date(now.setFullYear(now.getFullYear() - 1));
      }

      if (startDate) {
        query = query.gte('created_at', startDate.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;

      const cases = data || [];

      const totalCases = cases.length;
      const rvfuSynced = cases.filter(c => c.rvfu_id).length;
      const rvfuPending = cases.filter(c => !c.rvfu_id && c.stato === 'completata').length;
      const draftCases = cases.filter(c => c.stato === 'bozza').length;

      const monthlyTrendMap = new Map();
      for (const case_ of cases) {
        const month = new Date(case_.created_at).toLocaleString('it-IT', { year: 'numeric', month: 'short' });
        monthlyTrendMap.set(month, (monthlyTrendMap.get(month) || 0) + 1);
      }
      const monthlyTrend = Array.from(monthlyTrendMap.entries()).map(([month, count]) => ({ month, count }));

      const causaliStatsMap = new Map();
      for (const case_ of cases) {
        if (case_.rvfu_causale) {
          causaliStatsMap.set(case_.rvfu_causale, (causaliStatsMap.get(case_.rvfu_causale) || 0) + 1);
        }
      }
      const causaliStats = Array.from(causaliStatsMap.entries()).map(([causale, count]) => ({ causale, count }));

      const statusDistributionMap = new Map();
      for (const case_ of cases) {
        statusDistributionMap.set(case_.stato, (statusDistributionMap.get(case_.stato) || 0) + 1);
      }
      const statusDistribution = Array.from(statusDistributionMap.entries()).map(([status, count]) => ({ status, count }));

      const recentActivity = cases
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5);

      setStats({
        totalCases,
        rvfuSynced,
        rvfuPending,
        draftCases,
        monthlyTrend,
        causaliStats,
        statusDistribution,
        recentActivity,
      });

    } catch (err) {
      logger.error('Error fetching RVFU dashboard stats:', err);
      showError('Errore nel caricamento delle statistiche RVFU.');
    } finally {
      setLoading(false);
    }
  }, [orgId, supabase, showError, dateRange]);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 60000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  const handleExport = async () => {
    try {
      const csvData = generateCSV(stats);
      const blob = new Blob([csvData], { type: 'text/csv' });
      const url = globalThis.URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `rvfu-stats-${dateRange}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      globalThis.URL.revokeObjectURL(url);
      a.remove();
    } catch (error) {
      logger.error('Error exporting stats:', error);
      showError('Errore durante l\'export');
    }
  };

  const generateCSV = (stats) => {
    const headers = ['Metrica', 'Valore', 'Periodo'];
    const rows = [
      ['Casi Totali', stats.totalCases, dateRange],
      ['RVFU Sincronizzati', stats.rvfuSynced, dateRange],
      ['Pronti per RVFU', stats.rvfuPending, dateRange],
      ['Bozze', stats.draftCases, dateRange],
    ];
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  };

  if (loading) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner text="Caricamento dashboard RVFU..." />
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Header */}
      <div className="relative overflow-hidden bg-blue-600 rounded-2xl p-8 text-white">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/5 rounded-xl backdrop-blur-sm">
              <FiBarChart className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-3xl font-bold">Dashboard RVFU</h2>
              <p className="text-indigo-100 mt-1">Monitoraggio completo del sistema demolizioni</p>
            </div>
          </div>
          <div className="flex gap-3">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="rounded-lg border-0 bg-white/5 backdrop-blur-sm px-4 py-2 text-sm text-white placeholder-white/70 focus:bg-white/5 focus:ring-2 focus:ring-white/50 transition-all duration-200"
            >
              <option value="7d" className="text-slate-200">Ultimi 7 giorni</option>
              <option value="30d" className="text-slate-200">Ultimi 30 giorni</option>
              <option value="90d" className="text-slate-200">Ultimi 90 giorni</option>
              <option value="1y" className="text-slate-200">Ultimo anno</option>
              <option value="all" className="text-slate-200">Tutti i tempi</option>
            </select>
            <LoadingButton 
              onClick={fetchStats} 
              variant="outline" 
              className="bg-white/5 backdrop-blur-sm border-white/30 text-white hover:bg-white/5 transition-all duration-200"
            >
              <FiRefreshCw className="h-4 w-4" />
              Aggiorna
            </LoadingButton>
            <LoadingButton 
              onClick={handleExport} 
              variant="outline"
              className="bg-white/5 backdrop-blur-sm border-white/30 text-white hover:bg-white/5 transition-all duration-200"
            >
              <FiDownload className="h-4 w-4" />
              Esporta CSV
            </LoadingButton>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Casi Totali"
          value={stats.totalCases}
          icon={FiFileText}
          color="blue"
          trend={stats.monthlyTrend.length > 1 ? 
            stats.monthlyTrend[stats.monthlyTrend.length - 1].count - stats.monthlyTrend[stats.monthlyTrend.length - 2].count : 0
          }
          subtitle={`Ultimi ${dateRange}`}
        />
        <StatCard
          title="RVFU Sincronizzati"
          value={stats.rvfuSynced}
          icon={FiShield}
          color="green"
          subtitle={`${((stats.rvfuSynced / stats.totalCases) * 100 || 0).toFixed(1)}% del totale`}
        />
        <StatCard
          title="Pronti per RVFU"
          value={stats.rvfuPending}
          icon={FiCheckCircle}
          color="yellow"
          subtitle="In attesa di sincronizzazione"
        />
        <StatCard
          title="Bozze"
          value={stats.draftCases}
          icon={FiFileText}
          color="purple"
          subtitle="In lavorazione"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Trend Mensile Demolizioni" icon={FiActivity}>
          <div className="h-64 flex items-center justify-center">
            <div className="text-center">
              <FiBarChart className="h-12 w-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400">Grafico trend mensile</p>
              <p className="text-sm text-slate-500  mt-1">
                {stats.monthlyTrend.length} mesi di dati
              </p>
            </div>
          </div>
        </ChartCard>

        <ChartCard title="Distribuzione Causali" icon={FiBarChart}>
          <div className="h-64 flex items-center justify-center">
            <div className="text-center">
              <FiBarChart className="h-12 w-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400">Grafico causali</p>
              <p className="text-sm text-slate-500  mt-1">
                {stats.causaliStats.length} causali diverse
              </p>
            </div>
          </div>
        </ChartCard>
      </div>

      {/* Recent Activity */}
      <ChartCard title="Attività Recente" icon={FiClock}>
        <div className="space-y-4">
          {stats.recentActivity.length > 0 ? (
            stats.recentActivity.map((case_, index) => (
              <div 
                key={case_.id} 
                className="flex items-center justify-between p-4 bg-[#141c27]  rounded-lg hover:bg-white/5 transition-colors duration-200 animate-fade-in" 
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <FiFileText className="h-4 w-4 text-indigo-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-200">
                      {case_.targa || case_.telaio || 'Caso senza identificativo'}
                    </p>
                    <p className="text-sm text-slate-400">
                      {case_.rvfu_causale || 'Nessuna causale'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    case_.rvfu_id ? 'bg-green-500/10 text-green-400' :
                    case_.stato === 'completata' ? 'bg-yellow-500/10 text-yellow-400' :
                    'bg-[#141c27] text-slate-200  '
                  }`}>
                    {case_.rvfu_id ? 'Sincronizzato RVFU' : case_.stato}
                  </span>
                  <span className="text-sm text-slate-500">
                    {new Date(case_.created_at).toLocaleDateString('it-IT')}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <FiClock className="h-12 w-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400">Nessuna attività recente</p>
            </div>
          )}
        </div>
      </ChartCard>
    </div>
  );
};

// PropTypes per StatCard
StatCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  icon: PropTypes.elementType.isRequired,
  color: PropTypes.string.isRequired,
  trend: PropTypes.number,
  subtitle: PropTypes.string,
  className: PropTypes.string,
};

// PropTypes per ChartCard
ChartCard.propTypes = {
  title: PropTypes.string.isRequired,
  icon: PropTypes.elementType.isRequired,
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

RVFUDashboard.propTypes = {
  className: PropTypes.string,
};

export default RVFUDashboard;