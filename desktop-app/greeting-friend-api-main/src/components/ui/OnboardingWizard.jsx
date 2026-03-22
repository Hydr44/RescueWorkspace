// src/components/ui/OnboardingWizard.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiUsers, FiTruck, FiSettings, FiCheckCircle, FiArrowRight, FiX } from 'react-icons/fi';
import PropTypes from 'prop-types';

const STEPS = [
  {
    key: 'org',
    icon: FiSettings,
    title: 'Configura la tua organizzazione',
    description: 'Imposta i dati aziendali, logo e informazioni di fatturazione.',
    action: '/settings',
    actionLabel: 'Vai alle Impostazioni',
    color: 'indigo',
  },
  {
    key: 'client',
    icon: FiUsers,
    title: 'Aggiungi il primo cliente',
    description: 'Crea la tua anagrafica clienti per gestire trasporti e preventivi.',
    action: '/clienti/nuovo',
    actionLabel: 'Nuovo Cliente',
    color: 'blue',
  },
  {
    key: 'transport',
    icon: FiTruck,
    title: 'Crea il primo trasporto',
    description: 'Inizia a gestire i trasporti della tua flotta.',
    action: '/trasporti/new',
    actionLabel: 'Nuovo Trasporto',
    color: 'green',
  },
];

export default function OnboardingWizard({ stats, onDismiss }) {
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(() => {
    return localStorage.getItem('rm-onboarding-dismissed') === 'true';
  });

  if (dismissed) return null;

  const completedSteps = [
    stats.clients > 0,
    stats.clients > 0,
    stats.total > 0,
  ];
  const allDone = completedSteps.every(Boolean);

  if (allDone) return null;

  const handleDismiss = () => {
    localStorage.setItem('rm-onboarding-dismissed', 'true');
    setDismissed(true);
    onDismiss?.();
  };

  const progress = completedSteps.filter(Boolean).length;
  const progressPct = Math.round((progress / STEPS.length) * 100);

  return (
    <div className="bg-[#1a2536] rounded-xl shadow-sm border border-[#243044] overflow-hidden">
      {/* Header */}
      <div className="bg-blue-600 px-6 py-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Inizia con RescueManager</h2>
          <p className="text-indigo-100 text-sm mt-0.5">Completa questi passaggi per configurare il tuo ambiente</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-white text-sm font-medium">{progress}/{STEPS.length}</div>
            <div className="w-24 h-1.5 bg-white/5 rounded-full mt-1">
              <div
                className="h-full bg-[#1a2536] rounded-full transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-white/60 hover:text-white transition-colors"
            title="Nascondi guida"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Steps */}
      <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        {STEPS.map((step, idx) => {
          const Icon = step.icon;
          const done = completedSteps[idx];
          return (
            <div
              key={step.key}
              className={`relative p-4 rounded-xl border-2 transition-all ${
                done
                  ? 'border-green-500/20 bg-green-500/10/50'
                  : 'border-[#243044] hover:border-indigo-300 hover:shadow-md'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  done
                    ? 'bg-green-500/10'
                    : `bg-${step.color}-100`
                }`}>
                  {done ? (
                    <FiCheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <Icon className={`w-5 h-5 text-${step.color}-600`} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={`text-sm font-semibold ${done ? 'text-emerald-400 line-through' : 'text-slate-200'}`}>
                    {step.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">{step.description}</p>
                </div>
              </div>
              {!done && (
                <button
                  onClick={() => navigate(step.action)}
                  className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
                >
                  {step.actionLabel}
                  <FiArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

OnboardingWizard.propTypes = {
  stats: PropTypes.shape({
    total: PropTypes.number,
    clients: PropTypes.number,
  }).isRequired,
  onDismiss: PropTypes.func,
};
