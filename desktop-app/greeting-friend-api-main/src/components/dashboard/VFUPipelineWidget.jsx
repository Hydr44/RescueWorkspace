import { FiTruck, FiClock } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const PHASE_CONFIG = {
  accettazione: { label: 'Accettazione', color: 'blue', deadline: null },
  messa_in_sicurezza: { label: 'Messa in sicurezza', color: 'amber', deadline: 3 },
  bonifica: { label: 'Bonifica', color: 'emerald', deadline: 5 },
  smontaggio_ricambi: { label: 'Smontaggio ricambi', color: 'purple', deadline: 10 },
  smontaggio_componenti: { label: 'Smontaggio componenti', color: 'cyan', deadline: 15 },
  pesatura: { label: 'Pesatura', color: 'orange', deadline: null },
  radiazione_pra: { label: 'Radiazione PRA', color: 'red', deadline: 30 },
  conferimento: { label: 'Conferimento', color: 'slate', deadline: 60 }
};

function VFUCard({ vfu, phase }) {
  const navigate = useNavigate();
  const config = PHASE_CONFIG[phase];
  
  const getDaysInPhase = () => {
    if (!vfu.processing_started_at) return 0;
    const start = new Date(vfu.processing_started_at);
    const now = new Date();
    return Math.floor((now - start) / (1000 * 60 * 60 * 24));
  };

  const getUrgencyColor = () => {
    if (!config.deadline) return 'text-slate-400';
    const days = getDaysInPhase();
    const percentage = (days / config.deadline) * 100;
    
    if (percentage > 100) return 'text-red-400';
    if (percentage > 80) return 'text-amber-400';
    return 'text-emerald-400';
  };

  const daysInPhase = getDaysInPhase();

  return (
    <div
      onClick={() => navigate('/demolizioni-rvfu')}
      className="bg-[#141c27] border border-[#243044] p-2.5 hover:bg-[#1a2536] transition cursor-pointer group"
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-slate-200 truncate">{vfu.targa}</p>
          <p className="text-[10px] text-slate-500 truncate">{vfu.marca} {vfu.modello}</p>
        </div>
        <FiTruck className="w-3 h-3 text-slate-600 flex-shrink-0" />
      </div>
      
      <div className="flex items-center gap-1.5">
        <FiClock className={`w-3 h-3 ${getUrgencyColor()}`} />
        <span className={`text-[10px] font-medium ${getUrgencyColor()}`}>
          {daysInPhase}gg
          {config.deadline && ` / ${config.deadline}gg`}
        </span>
      </div>
    </div>
  );
}

export default function VFUPipelineWidget({ pipeline }) {
  const navigate = useNavigate();

  const phases = Object.keys(PHASE_CONFIG);
  const totalVFU = phases.reduce((sum, phase) => sum + (pipeline[phase]?.length || 0), 0);

  if (totalVFU === 0) {
    return (
      <div className="bg-[#1a2536] border border-[#243044] p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-200">Pipeline VFU</h2>
          <button
            onClick={() => navigate('/demolizioni-rvfu/nuovo')}
            className="text-xs text-blue-400 hover:text-blue-300 transition"
          >
            Nuova Demolizione →
          </button>
        </div>
        <div className="text-center py-8">
          <FiTruck className="w-8 h-8 text-slate-600 mx-auto mb-3" />
          <p className="text-sm text-slate-500 mb-3">Nessun veicolo in lavorazione</p>
          <button
            onClick={() => navigate('/demolizioni-rvfu/nuovo')}
            className="text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 transition"
          >
            Inizia Prima Demolizione
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#1a2536] border border-[#243044] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#243044]">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-slate-200">Pipeline VFU</h2>
          <span className="text-xs text-slate-500">({totalVFU} veicoli)</span>
        </div>
        <button
          onClick={() => navigate('/demolizioni-rvfu')}
          className="text-xs text-blue-400 hover:text-blue-300 transition"
        >
          Vedi tutti →
        </button>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          {phases.map(phase => {
            const config = PHASE_CONFIG[phase];
            const vehicles = pipeline[phase] || [];
            
            return (
              <div key={phase} className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider truncate">
                    {config.label}
                  </h3>
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 bg-${config.color}-500/10 text-${config.color}-400`}>
                    {vehicles.length}
                  </span>
                </div>
                
                <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
                  {vehicles.length === 0 ? (
                    <div className="bg-[#141c27] border border-[#243044] p-2.5 text-center">
                      <p className="text-[10px] text-slate-600">Nessuno</p>
                    </div>
                  ) : (
                    vehicles.map(vfu => (
                      <VFUCard key={vfu.id} vfu={vfu} phase={phase} />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
