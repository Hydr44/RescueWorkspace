// src/components/ui/DashboardCards.jsx
import PropTypes from 'prop-types';
import {
  FiTrendingUp, FiTrendingDown, FiMinus,
  FiEye, FiEdit, FiRefreshCw
} from 'react-icons/fi';

// Componente KPI Card
export function KPICard({ title, value, delta, icon: Icon, color = "blue" }) {
  const iconColorClasses = {
    blue: "text-blue-400/50",
    green: "text-emerald-400/50",
    amber: "text-amber-400/50",
    red: "text-red-400/50",
    purple: "text-purple-400/50",
    indigo: "text-blue-400/50"
  };

  const hoverBorderClasses = {
    blue: "hover:border-blue-500/20",
    green: "hover:border-emerald-500/20",
    amber: "hover:border-amber-500/20",
    red: "hover:border-red-500/20",
    purple: "hover:border-purple-500/20",
    indigo: "hover:border-blue-500/20"
  };

  let deltaColor;
  if (delta > 0) {
    deltaColor = "text-emerald-400";
  } else if (delta < 0) {
    deltaColor = "text-red-400";
  } else {
    deltaColor = "text-slate-500";
  }

  return (
    <div className={`bg-[#1a2536] rounded-xl border border-[#243044] p-4 transition ${hoverBorderClasses[color]}`}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">{title}</p>
        <Icon className={`w-3.5 h-3.5 ${iconColorClasses[color]}`} />
      </div>
      <p className="text-2xl font-semibold text-slate-100">{value}</p>
      {delta !== null && (
        <div className={`flex items-center gap-1 mt-1.5 text-[10px] font-medium ${deltaColor}`}>
          {(() => {
            if (delta > 0) return <FiTrendingUp className="w-3 h-3" />;
            if (delta < 0) return <FiTrendingDown className="w-3 h-3" />;
            return <FiMinus className="w-3 h-3" />;
          })()}
          <span>{delta > 0 ? '+' : ''}{delta}%</span>
        </div>
      )}
    </div>
  );
}

KPICard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  delta: PropTypes.number,
  icon: PropTypes.elementType.isRequired,
  color: PropTypes.string,
};

// Componente Quick Action Button
export function QuickAction({ icon: Icon, label, description, onClick, color = "blue", disabled = false }) {
  const colorClasses = {
    blue: "text-white bg-blue-600 hover:bg-blue-700",
    green: "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/10/15",
    purple: "text-purple-400 bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/10/15",
    amber: "text-amber-400 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/10/15"
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full p-3 rounded-lg transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed ${colorClasses[color]}`}
    >
      <div className="flex items-center gap-2.5">
        <Icon className="w-4 h-4 shrink-0" />
        <div className="text-left">
          <div className="font-medium text-xs">{label}</div>
          {description && <div className="text-[10px] opacity-60">{description}</div>}
        </div>
      </div>
    </button>
  );
}

QuickAction.propTypes = {
  icon: PropTypes.elementType.isRequired,
  label: PropTypes.string.isRequired,
  description: PropTypes.string,
  onClick: PropTypes.func.isRequired,
  color: PropTypes.string,
  disabled: PropTypes.bool,
};

// Componente Status Badge
export function StatusBadge({ status, size = "md" }) {
  const getStatusStyles = (status) => {
    switch (status) {
      case "new":
      case "da fare":
        return "text-amber-400 bg-amber-500/10 border border-amber-500/20";
      case "assigned":
      case "in attesa":
        return "text-slate-400 bg-slate-500/10 border border-slate-500/20";
      case "enroute":
      case "in corso":
        return "text-blue-400 bg-blue-500/10 border border-blue-500/20";
      case "done":
      case "completato":
        return "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20";
      default:
        return "text-slate-400 bg-slate-500/10 border border-slate-500/20";
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "new": return "Nuovo";
      case "assigned": return "Assegnato";
      case "enroute": return "In Viaggio";
      case "done": return "Completato";
      case "da fare": return "Da Fare";
      case "in corso": return "In Corso";
      case "completato": return "Completato";
      case "in attesa": return "In Attesa";
      default: return status;
    }
  };

  const sizeClasses = {
    sm: "px-2 py-1 text-xs",
    md: "px-3 py-1.5 text-sm"
  };

  return (
    <span className={`inline-flex items-center rounded-lg font-medium text-[10px] uppercase ${getStatusStyles(status)} ${sizeClasses[size]}`}>
      {getStatusLabel(status)}
    </span>
  );
}

StatusBadge.propTypes = {
  status: PropTypes.string,
  size: PropTypes.oneOf(['sm', 'md']),
};

// Componente Transport Card
export function TransportCard({ transport, onView, onEdit, onStatusChange }) {
  const statusBorderColor = {
    'new': 'border-l-amber-500', 'da fare': 'border-l-amber-500',
    'assigned': 'border-l-slate-500', 'in attesa': 'border-l-slate-500',
    'enroute': 'border-l-blue-500', 'in corso': 'border-l-blue-500',
    'done': 'border-l-emerald-500', 'completato': 'border-l-emerald-500',
  };
  const borderColor = statusBorderColor[transport.stato || transport.status] || 'border-l-slate-600';

  return (
    <div className={`bg-[#1a2536] rounded-lg border border-[#243044] border-l-[3px] ${borderColor} p-4 hover:bg-white/[0.02] transition cursor-pointer`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-slate-200 truncate">
            {transport.cliente || transport.titolo || "Trasporto"}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {transport.indirizzo_partenza || transport.pickup_address || "Nessun indirizzo"}
          </p>
        </div>
        <StatusBadge status={transport.stato || transport.status} size="sm" />
      </div>
      
      <div className="flex items-center justify-between text-[10px] text-slate-600 mb-3">
        <span>#{transport.id}</span>
        {transport.created_at && (
          <span>{new Date(transport.created_at).toLocaleDateString()}</span>
        )}
      </div>
      
      <div className="flex items-center gap-2">
        <button
          onClick={() => onView(transport)}
          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-400 bg-white/5 border border-[#243044] rounded-lg hover:bg-white/[0.08] transition"
        >
          <FiEye className="w-3 h-3" />
          Dettagli
        </button>
        <button
          onClick={() => onEdit(transport)}
          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-lg hover:bg-blue-500/10/15 transition"
        >
          <FiEdit className="w-3 h-3" />
          Modifica
        </button>
        <button
          onClick={() => onStatusChange(transport)}
          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg hover:bg-emerald-500/10/15 transition"
        >
          <FiRefreshCw className="w-3 h-3" />
          Stato
        </button>
      </div>
    </div>
  );
}

TransportCard.propTypes = {
  transport: PropTypes.object.isRequired,
  onView: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onStatusChange: PropTypes.func.isRequired,
};

// Componente Driver Status
export function DriverStatus({ driver }) {

  const dotColor = {
    disponibile: 'bg-emerald-500/10',
    occupato: 'bg-amber-500/10',
    offline: 'bg-slate-600'
  };

  return (
    <div className="flex items-center gap-2.5">
      <div className="w-7 h-7 rounded-lg bg-[#0c1929] border border-[#243044] flex items-center justify-center text-slate-300 text-[9px] font-medium">
        {driver.nome?.charAt(0)?.toUpperCase() || "A"}{driver.nome?.split(' ')[1]?.charAt(0)?.toUpperCase() || ""}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium text-slate-200 truncate">
          {driver.nome || "Autista"}
        </div>
        <div className="text-[10px] text-slate-500">
          {driver.telefono || "Nessun telefono"}
        </div>
      </div>
      <div className={`w-2 h-2 rounded-full ${dotColor[driver.stato] || dotColor.offline}`} />
    </div>
  );
}

DriverStatus.propTypes = {
  driver: PropTypes.object.isRequired,
};
