import { FiAlertTriangle, FiClock, FiShield, FiDollarSign, FiX } from 'react-icons/fi';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AlertBar({ alerts }) {
  const [dismissed, setDismissed] = useState([]);
  const navigate = useNavigate();

  const allAlerts = [
    ...alerts.criticalCerts.map(cert => ({
      id: `cert-${cert.id}`,
      type: 'cert',
      severity: 'critical',
      icon: FiShield,
      message: `Certificato ${cert.tipo} in scadenza`,
      action: () => navigate('/rifiuti/certificati'),
      actionLabel: 'Verifica'
    })),
    ...alerts.overdueVFU.map(vfu => ({
      id: `vfu-${vfu.id}`,
      type: 'vfu',
      severity: 'warning',
      icon: FiClock,
      message: `VFU ${vfu.targa} oltre scadenza fase ${vfu.processing_status}`,
      action: () => navigate(`/demolizioni-rvfu`),
      actionLabel: 'Apri'
    })),
    ...alerts.rentriLimits.map((limit, idx) => ({
      id: `limit-${idx}`,
      type: 'limit',
      severity: 'warning',
      icon: FiAlertTriangle,
      message: `Limite RENTRI ${limit.type} al ${limit.percentage}%`,
      action: () => navigate('/rifiuti'),
      actionLabel: 'Dettagli'
    })),
    ...alerts.overdueInvoices.map((inv, idx) => ({
      id: `invoice-${idx}`,
      type: 'invoice',
      severity: 'info',
      icon: FiDollarSign,
      message: `${inv.count} fatture scadute non pagate`,
      action: () => navigate('/fatture'),
      actionLabel: 'Vedi'
    }))
  ].filter(alert => !dismissed.includes(alert.id));

  if (allAlerts.length === 0) return null;

  const handleDismiss = (alertId, e) => {
    e.stopPropagation();
    setDismissed([...dismissed, alertId]);
  };

  const getSeverityStyles = (severity) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500/10 border-red-500/20 text-red-400';
      case 'warning':
        return 'bg-amber-500/10 border-amber-500/20 text-amber-400';
      case 'info':
        return 'bg-blue-500/10 border-blue-500/20 text-blue-400';
      default:
        return 'bg-slate-500/10 border-slate-500/20 text-slate-400';
    }
  };

  return (
    <div className="space-y-2">
      {allAlerts.map(alert => {
        const Icon = alert.icon;
        return (
          <div
            key={alert.id}
            className={`flex items-center gap-3 px-4 py-2.5 border ${getSeverityStyles(alert.severity)} transition-all`}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            <p className="flex-1 text-xs font-medium">{alert.message}</p>
            {alert.action && (
              <button
                onClick={alert.action}
                className="text-xs font-medium hover:underline flex-shrink-0"
              >
                {alert.actionLabel} →
              </button>
            )}
            <button
              onClick={(e) => handleDismiss(alert.id, e)}
              className="p-1 hover:bg-white/5 transition flex-shrink-0"
              title="Nascondi"
            >
              <FiX className="w-3 h-3" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
