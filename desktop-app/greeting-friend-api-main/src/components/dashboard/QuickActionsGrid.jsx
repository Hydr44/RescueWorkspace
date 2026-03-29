import { FiTruck, FiFileText, FiPackage, FiMapPin, FiDollarSign, FiCalendar } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const ACTIONS = [
  { id: 'vfu', icon: FiTruck, label: 'Nuova Demolizione', path: '/demolizioni-rvfu/nuovo', color: 'blue' },
  { id: 'formulario', icon: FiFileText, label: 'Formulario RENTRI', path: '/rifiuti/formulari/nuovo', color: 'emerald' },
  { id: 'ricambio', icon: FiPackage, label: 'Nuovo Ricambio', path: '/ricambi/nuovo', color: 'purple' },
  { id: 'trasporto', icon: FiTruck, label: 'Nuovo Trasporto', path: '/trasporti/new', color: 'amber' },
  { id: 'posizione', icon: FiMapPin, label: 'Posizione Cliente', path: '/dashboard', color: 'cyan', action: 'locate' },
  { id: 'fattura', icon: FiDollarSign, label: 'Genera Fattura', path: '/fatture/nuovo', color: 'green' }
];

export default function QuickActionsGrid({ onLocateClient }) {
  const navigate = useNavigate();

  const handleAction = (action) => {
    if (action.action === 'locate' && onLocateClient) {
      onLocateClient();
    } else {
      navigate(action.path);
    }
  };

  const getColorClasses = (color) => {
    const colors = {
      blue: 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20',
      emerald: 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20',
      purple: 'bg-purple-500/10 text-purple-400 hover:bg-purple-500/20',
      amber: 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20',
      cyan: 'bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20',
      green: 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="bg-[#1a2536] border border-[#243044] overflow-hidden">
      <div className="px-4 py-3 border-b border-[#243044]">
        <h2 className="text-sm font-semibold text-slate-200">Azioni Rapide</h2>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-2 gap-2">
          {ACTIONS.map(action => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                onClick={() => handleAction(action)}
                className={`flex flex-col items-center justify-center gap-2 p-4 border border-[#243044] transition ${getColorClasses(action.color)}`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-medium text-center">{action.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
