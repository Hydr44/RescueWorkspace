/**
 * Componente azioni bulk per selezione multipla
 * 
 * Mostra barra azioni quando ci sono elementi selezionati
 */

export default function MultiSelectActions({ 
  selectedCount, 
  onBulkDelete, 
  onBulkExport,
  onClearSelection,
  actions = [] // Array di { label, icon, onClick, variant }
}) {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-blue-600 text-white rounded-xl shadow-2xl px-6 py-4 flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white/5 rounded-full flex items-center justify-center font-semibold">
            {selectedCount}
          </div>
          <span className="font-medium">
            {selectedCount === 1 ? 'elemento selezionato' : 'elementi selezionati'}
          </span>
        </div>

        <div className="h-6 w-px bg-white/5" />

        <div className="flex items-center gap-2">
          {/* Azioni custom */}
          {actions.map((action, idx) => (
            <button
              key={idx}
              onClick={action.onClick}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                action.variant === 'danger' 
                  ? 'bg-red-500/10 hover:bg-red-600' 
                  : action.variant === 'success'
                  ? 'bg-green-500/10 hover:bg-green-600'
                  : 'bg-white/5 hover:bg-white/5'
              }`}
              title={action.label}
            >
              {action.icon && <span className="mr-2">{action.icon}</span>}
              {action.label}
            </button>
          ))}

          {/* Azioni di default */}
          {onBulkExport && (
            <button
              onClick={onBulkExport}
              className="px-4 py-2 bg-white/5 hover:bg-white/5 rounded-lg font-medium text-sm transition-colors"
              title="Esporta selezionati"
            >
              Esporta
            </button>
          )}

          {onBulkDelete && (
            <button
              onClick={onBulkDelete}
              className="px-4 py-2 bg-red-500/10 hover:bg-red-600 rounded-lg font-medium text-sm transition-colors"
              title="Elimina selezionati"
            >
              Elimina
            </button>
          )}

          <button
            onClick={onClearSelection}
            className="px-4 py-2 bg-white/5 hover:bg-white/5 rounded-lg font-medium text-sm transition-colors"
            title="Deseleziona tutto"
          >
            Annulla
          </button>
        </div>
      </div>
    </div>
  );
}

