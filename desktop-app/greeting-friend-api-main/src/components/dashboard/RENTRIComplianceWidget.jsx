import { FiShield, FiAlertCircle, FiCheckCircle, FiFileText, FiClock } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

export default function RENTRIComplianceWidget({ compliance }) {
  const navigate = useNavigate();

  const getOverallStatus = () => {
    if (compliance.certificates.expired > 0) return 'critical';
    if (compliance.certificates.expiring > 0 || compliance.pendingFormulari > 5) return 'warning';
    return 'ok';
  };

  const status = getOverallStatus();

  const statusConfig = {
    critical: {
      color: 'red',
      icon: FiAlertCircle,
      label: 'Attenzione Richiesta',
      bg: 'bg-red-500/10',
      text: 'text-red-400',
      border: 'border-red-500/20'
    },
    warning: {
      color: 'amber',
      icon: FiClock,
      label: 'Monitoraggio',
      bg: 'bg-amber-500/10',
      text: 'text-amber-400',
      border: 'border-amber-500/20'
    },
    ok: {
      color: 'emerald',
      icon: FiCheckCircle,
      label: 'Tutto OK',
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-400',
      border: 'border-emerald-500/20'
    }
  };

  const config = statusConfig[status];
  const StatusIcon = config.icon;

  return (
    <div className="bg-[#1a2536] border border-[#243044] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#243044]">
        <div className="flex items-center gap-2">
          <FiShield className="w-4 h-4 text-blue-400" />
          <h2 className="text-sm font-semibold text-slate-200">RENTRI Compliance</h2>
        </div>
        <button
          onClick={() => navigate('/rifiuti')}
          className="text-xs text-blue-400 hover:text-blue-300 transition"
        >
          Gestisci →
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Semaforo generale */}
        <div className={`flex items-center gap-3 p-3 border ${config.border} ${config.bg}`}>
          <StatusIcon className={`w-5 h-5 ${config.text}`} />
          <div className="flex-1">
            <p className={`text-sm font-semibold ${config.text}`}>{config.label}</p>
            <p className="text-xs text-slate-500 mt-0.5">
              {status === 'critical' && 'Certificati scaduti da rinnovare'}
              {status === 'warning' && 'Alcuni elementi richiedono attenzione'}
              {status === 'ok' && 'Tutti i certificati sono validi'}
            </p>
          </div>
        </div>

        {/* Certificati */}
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Certificati</h3>
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-[#141c27] border border-[#243044] p-2.5 text-center">
              <p className="text-lg font-bold text-red-400">{compliance.certificates.expired}</p>
              <p className="text-[10px] text-slate-500">Scaduti</p>
            </div>
            <div className="bg-[#141c27] border border-[#243044] p-2.5 text-center">
              <p className="text-lg font-bold text-amber-400">{compliance.certificates.expiring}</p>
              <p className="text-[10px] text-slate-500">In scadenza</p>
            </div>
            <div className="bg-[#141c27] border border-[#243044] p-2.5 text-center">
              <p className="text-lg font-bold text-emerald-400">{compliance.certificates.valid}</p>
              <p className="text-[10px] text-slate-500">Validi</p>
            </div>
          </div>
        </div>

        {/* Formulari pending */}
        {compliance.pendingFormulari > 0 && (
          <div 
            onClick={() => navigate('/rifiuti/formulari')}
            className="flex items-center justify-between p-3 bg-[#141c27] border border-[#243044] hover:bg-[#1a2536] transition cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <FiFileText className="w-4 h-4 text-amber-400" />
              <div>
                <p className="text-xs font-medium text-slate-200">Formulari da firmare</p>
                <p className="text-[10px] text-slate-500">Clicca per gestire</p>
              </div>
            </div>
            <span className="text-sm font-bold text-amber-400">{compliance.pendingFormulari}</span>
          </div>
        )}

        {/* Limiti (se disponibili) */}
        {compliance.limits && compliance.limits.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Limiti Quantità</h3>
            {compliance.limits.map((limit, idx) => {
              const percentage = (limit.used / limit.limit) * 100;
              const isWarning = percentage > 80;
              
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">{limit.type}</span>
                    <span className={isWarning ? 'text-amber-400 font-medium' : 'text-slate-500'}>
                      {limit.used.toFixed(1)} / {limit.limit} {limit.unit}
                    </span>
                  </div>
                  <div className="w-full bg-[#141c27] h-1.5 overflow-hidden">
                    <div
                      className={`h-full transition-all ${isWarning ? 'bg-amber-500' : 'bg-blue-500'}`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#243044]">
          <button
            onClick={() => navigate('/rifiuti/certificati')}
            className="px-3 py-2 text-xs font-medium text-slate-300 bg-[#141c27] border border-[#243044] hover:bg-[#1a2536] transition"
          >
            Certificati
          </button>
          <button
            onClick={() => navigate('/rifiuti/formulari')}
            className="px-3 py-2 text-xs font-medium text-slate-300 bg-[#141c27] border border-[#243044] hover:bg-[#1a2536] transition"
          >
            Formulari
          </button>
        </div>
      </div>
    </div>
  );
}
