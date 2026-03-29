/**
 * Componente base per card dashboard con stile uniforme
 */
export default function DashboardCard({ icon: Icon, title, action, onAction, children, iconColor = "text-blue-400" }) {
  return (
    <div className="bg-[#1a2536] border border-[#243044] overflow-hidden h-full flex flex-col">
      {/* Header uniforme */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#243044]">
        <div className="flex items-center gap-2">
          {Icon && <Icon className={`w-4 h-4 ${iconColor}`} />}
          <h2 className="text-sm font-semibold text-slate-200">{title}</h2>
        </div>
        {action && (
          <button
            onClick={onAction}
            className="text-xs text-blue-400 hover:text-blue-300 transition"
          >
            {action} →
          </button>
        )}
      </div>

      {/* Contenuto */}
      <div className="p-4 flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
}
