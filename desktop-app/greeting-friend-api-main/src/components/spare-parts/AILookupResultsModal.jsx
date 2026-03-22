// src/components/spare-parts/AILookupResultsModal.jsx
import PropTypes from 'prop-types';
import { FiX, FiCheck, FiStar, FiTruck, FiTag, FiMapPin, FiCalendar, FiDollarSign, FiImage, FiGlobe } from 'react-icons/fi';

/**
 * Modale AI Lookup - Layout:
 * 1. PEZZO PIÙ PROBABILE (grande, con foto)
 * 2. ─── linea divisoria ───
 * 3. ALTRI POSSIBILI (griglia compatta)
 */
export default function AILookupResultsModal({ candidates, onSelect, onClose }) {
  if (!candidates || candidates.length === 0) return null;

  const bestMatch = candidates[0];
  const otherMatches = candidates.slice(1);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a2536] rounded-2xl border border-[#243044] max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-b border-[#243044] px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                <FiStar className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-200">Risultati Ricerca AI</h2>
                <p className="text-xs text-slate-400">
                  {candidates.length} risultati da AutoDoc, eBay, Ricambi24
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg transition text-slate-400 hover:text-slate-200">
              <FiX className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-140px)]">

          {/* ═══ PEZZO PIÙ PROBABILE ═══ */}
          <div className="p-6">
            <div className="text-[10px] font-semibold text-emerald-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <FiCheck className="w-3.5 h-3.5" />
              Pezzo più probabile
            </div>

            <button
              type="button"
              onClick={() => onSelect(bestMatch)}
              className="w-full text-left rounded-xl border-2 border-emerald-500/40 bg-emerald-500/5 hover:bg-emerald-500/10 hover:border-emerald-500/60 transition-all p-0 overflow-hidden group"
            >
              <div className="flex">
                {/* Foto */}
                {bestMatch.image ? (
                  <div className="w-36 h-36 flex-shrink-0 bg-white/5 border-r border-emerald-500/20 overflow-hidden">
                    <img
                      src={bestMatch.image}
                      alt={bestMatch.name}
                      className="w-full h-full object-contain p-2"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  </div>
                ) : (
                  <div className="w-36 h-36 flex-shrink-0 bg-white/5 border-r border-emerald-500/20 flex items-center justify-center">
                    <FiImage className="w-10 h-10 text-slate-600" />
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-base font-bold text-slate-100 group-hover:text-white leading-tight">
                      {bestMatch.name}
                    </h3>
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex-shrink-0">
                      <FiStar className="w-3 h-3 text-emerald-400" />
                      <span className="text-[10px] font-bold text-emerald-400">{bestMatch._score}</span>
                    </span>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mt-3">
                    {bestMatch.vehicle_compatibility?.make && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-500/15 text-[11px] text-blue-300 font-medium">
                        <FiTruck className="w-3 h-3" />
                        {bestMatch.vehicle_compatibility.make}
                        {bestMatch.vehicle_compatibility.model && ` ${bestMatch.vehicle_compatibility.model}`}
                      </span>
                    )}
                    {bestMatch.vehicle_compatibility?.year_from && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-500/15 text-[11px] text-purple-300 font-medium">
                        <FiCalendar className="w-3 h-3" />
                        {bestMatch.vehicle_compatibility.year_from}
                        {bestMatch.vehicle_compatibility.year_to && `–${bestMatch.vehicle_compatibility.year_to}`}
                      </span>
                    )}
                    {bestMatch.category && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/15 text-[11px] text-amber-300 font-medium">
                        <FiTag className="w-3 h-3" />
                        {bestMatch.category}
                      </span>
                    )}
                    {bestMatch.position && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-cyan-500/15 text-[11px] text-cyan-300 font-medium">
                        <FiMapPin className="w-3 h-3" />
                        {bestMatch.position}
                      </span>
                    )}
                    {bestMatch.suggested_price && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/15 text-[11px] text-emerald-300 font-medium">
                        <FiDollarSign className="w-3 h-3" />
                        {bestMatch.suggested_price.toFixed(2)}
                      </span>
                    )}
                    {bestMatch._sourceSite && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-500/15 text-[11px] text-slate-400">
                        <FiGlobe className="w-3 h-3" />
                        {bestMatch._sourceSite}
                      </span>
                    )}
                  </div>

                  {/* CTA */}
                  <div className="mt-3 flex items-center gap-2 text-xs text-emerald-400 font-medium group-hover:text-emerald-300">
                    <FiCheck className="w-3.5 h-3.5" />
                    Clicca per usare questo ricambio
                  </div>
                </div>
              </div>
            </button>
          </div>

          {/* ═══ DIVISORE ═══ */}
          {otherMatches.length > 0 && (
            <>
              <div className="px-6">
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-[#243044]" />
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
                    Altri risultati possibili
                  </span>
                  <div className="flex-1 h-px bg-[#243044]" />
                </div>
              </div>

              {/* ═══ ALTRI POSSIBILI ═══ */}
              <div className="p-6 pt-4 space-y-2">
                {otherMatches.map((candidate, index) => (
                  <button
                    key={`candidate-${candidate.name}-${index}`}
                    type="button"
                    onClick={() => onSelect(candidate)}
                    className="w-full text-left flex items-center gap-3 p-3 rounded-lg border border-[#243044] bg-[#141c27] hover:bg-[#1e2b3d] hover:border-blue-500/30 transition-all group"
                  >
                    {/* Mini thumbnail */}
                    {candidate.image ? (
                      <div className="w-14 h-14 rounded-lg bg-white/5 overflow-hidden flex-shrink-0">
                        <img
                          src={candidate.image}
                          alt={candidate.name}
                          className="w-full h-full object-contain p-1"
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      </div>
                    ) : (
                      <div className="w-14 h-14 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                        <FiImage className="w-5 h-5 text-slate-700" />
                      </div>
                    )}

                    {/* Info compatta */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-300 group-hover:text-slate-100 truncate">
                          {candidate.name}
                        </span>
                        {candidate._score > 0 && (
                          <span className="text-[9px] font-bold text-slate-500 bg-slate-500/10 px-1.5 py-0.5 rounded">
                            {candidate._score}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {candidate.vehicle_compatibility?.make && (
                          <span className="text-[10px] text-blue-400">
                            {candidate.vehicle_compatibility.make}
                            {candidate.vehicle_compatibility.model && ` ${candidate.vehicle_compatibility.model}`}
                          </span>
                        )}
                        {candidate.category && (
                          <span className="text-[10px] text-amber-400">{candidate.category}</span>
                        )}
                        {candidate.position && (
                          <span className="text-[10px] text-cyan-400">{candidate.position}</span>
                        )}
                        {candidate.suggested_price && (
                          <span className="text-[10px] text-emerald-400">{candidate.suggested_price.toFixed(2)}</span>
                        )}
                        {candidate._sourceSite && (
                          <span className="text-[10px] text-slate-500">{candidate._sourceSite}</span>
                        )}
                      </div>
                    </div>

                    <FiCheck className="w-4 h-4 text-slate-600 group-hover:text-blue-400 flex-shrink-0 transition" />
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Footer info */}
          <div className="px-6 pb-4">
            <div className="flex items-center gap-2 text-[10px] text-slate-500 bg-[#141c27] rounded-lg p-2.5 border border-[#243044]">
              <FiGlobe className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Dati estratti da AutoDoc, eBay Italia e Ricambi24. Verifica sempre la correttezza prima di salvare.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

AILookupResultsModal.propTypes = {
  candidates: PropTypes.arrayOf(PropTypes.object).isRequired,
  onSelect: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired
};
