import { FiPackage, FiTrendingUp, FiAlertTriangle } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

export default function SparePartsWidget({ spareParts }) {
  const navigate = useNavigate();

  const { topSellers, lowStock } = spareParts;

  return (
    <div className="bg-[#1a2536] border border-[#243044] overflow-hidden h-full flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#243044]">
        <div className="flex items-center gap-2">
          <FiPackage className="w-4 h-4 text-emerald-400" />
          <h2 className="text-sm font-semibold text-slate-200">Ricambi</h2>
        </div>
        <button
          onClick={() => navigate('/ricambi')}
          className="text-xs text-blue-400 hover:text-blue-300 transition"
        >
          Magazzino →
        </button>
      </div>

      <div className="p-4 space-y-4 flex-1">
        {/* Alert stock basso */}
        {lowStock > 0 && (
          <div 
            onClick={() => navigate('/ricambi')}
            className="flex items-center gap-3 p-3 bg-amber-500/10 border border-amber-500/20 cursor-pointer hover:bg-amber-500/15 transition"
          >
            <FiAlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-xs font-medium text-amber-400">{lowStock} ricambi con stock basso</p>
              <p className="text-[10px] text-slate-500">Clicca per verificare</p>
            </div>
          </div>
        )}

        {/* Top sellers */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Top Vendite (30gg)</h3>
            <FiTrendingUp className="w-3 h-3 text-emerald-400" />
          </div>

          {topSellers.length === 0 ? (
            <div className="bg-[#141c27] border border-[#243044] p-4 text-center">
              <FiPackage className="w-6 h-6 text-slate-600 mx-auto mb-2" />
              <p className="text-xs text-slate-500">Nessuna vendita recente</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {topSellers.slice(0, 5).map((part, idx) => (
                <div
                  key={part.id}
                  onClick={() => navigate(`/ricambi/${part.id}`)}
                  className="flex items-center gap-2 p-2 bg-[#141c27] border border-[#243044] hover:bg-[#1a2536] transition cursor-pointer"
                >
                  <div className="flex-shrink-0 w-5 h-5 bg-emerald-500/10 flex items-center justify-center text-[10px] font-bold text-emerald-400">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-200 truncate">{part.name}</p>
                    <p className="text-[10px] text-slate-500">{part.internal_code}</p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className="text-xs font-semibold text-emerald-400">€{part.price_sell?.toFixed(2) || '0.00'}</p>
                    <p className="text-[10px] text-slate-500">Stock: {part.stock_quantity || 0}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#243044]">
          <button
            onClick={() => navigate('/ricambi/nuovo')}
            className="px-3 py-2 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 transition"
          >
            Nuovo Ricambio
          </button>
          <button
            onClick={() => navigate('/marketplace')}
            className="px-3 py-2 text-xs font-medium text-slate-300 bg-[#141c27] border border-[#243044] hover:bg-[#1a2536] transition"
          >
            Marketplace
          </button>
        </div>
      </div>
    </div>
  );
}
