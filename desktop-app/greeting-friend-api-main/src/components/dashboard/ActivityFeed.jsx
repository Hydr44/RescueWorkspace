import { FiTruck, FiCheckCircle, FiAlertTriangle, FiPackage, FiFileText, FiDollarSign } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const EVENT_CONFIG = {
  vfu_new: {
    icon: FiTruck,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    getLabel: (data) => `Nuova demolizione ${data.targa}`
  },
  vfu_phase_change: {
    icon: FiCheckCircle,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    getLabel: (data) => `${data.targa} - Fase completata`
  },
  rentri_cert_expiring: {
    icon: FiAlertTriangle,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    getLabel: (data) => `Certificato in scadenza`
  },
  spare_sold: {
    icon: FiPackage,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    getLabel: (data) => `Ricambio venduto`
  },
  invoice_created: {
    icon: FiFileText,
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
    getLabel: (data) => `Fattura emessa`
  },
  transport_completed: {
    icon: FiCheckCircle,
    color: 'text-green-400',
    bg: 'bg-green-500/10',
    getLabel: (data) => `Trasporto completato - ${data.cliente || 'Cliente'}`
  }
};

function ActivityItem({ activity }) {
  const navigate = useNavigate();
  const config = EVENT_CONFIG[activity.type] || EVENT_CONFIG.vfu_new;
  const Icon = config.icon;

  const getTimeAgo = (timestamp) => {
    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now - then;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Ora';
    if (diffMins < 60) return `${diffMins}m fa`;
    if (diffHours < 24) return `${diffHours}h fa`;
    return `${diffDays}g fa`;
  };

  const handleClick = () => {
    if (activity.type === 'vfu_new' && activity.data?.id) {
      navigate('/demolizioni-rvfu');
    } else if (activity.type === 'transport_completed' && activity.data?.id) {
      navigate(`/trasporti/${activity.data.id}`);
    }
  };

  return (
    <div
      onClick={handleClick}
      className="flex items-start gap-3 p-2.5 hover:bg-[#1a2536] transition cursor-pointer"
    >
      <div className={`flex-shrink-0 w-8 h-8 ${config.bg} flex items-center justify-center`}>
        <Icon className={`w-4 h-4 ${config.color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-slate-200">{config.getLabel(activity.data || {})}</p>
        <p className="text-[10px] text-slate-500 mt-0.5">{getTimeAgo(activity.timestamp)}</p>
      </div>
    </div>
  );
}

export default function ActivityFeed({ activities }) {
  return (
    <div className="bg-[#1a2536] border border-[#243044] overflow-hidden">
      <div className="px-4 py-3 border-b border-[#243044]">
        <h2 className="text-sm font-semibold text-slate-200">Attività Recenti</h2>
      </div>

      <div className="divide-y divide-[#243044]/50 max-h-[400px] overflow-y-auto">
        {activities.length === 0 ? (
          <div className="p-6 text-center">
            <FiCheckCircle className="w-6 h-6 text-slate-600 mx-auto mb-2" />
            <p className="text-xs text-slate-500">Nessuna attività recente</p>
          </div>
        ) : (
          activities.map((activity, idx) => (
            <ActivityItem key={`${activity.type}-${idx}`} activity={activity} />
          ))
        )}
      </div>
    </div>
  );
}
