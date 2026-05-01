import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiArrowRight, FiCheck, FiLoader, FiCheckCircle,
  FiShield, FiGlobe, FiClock, FiSmartphone, FiFileText
} from "react-icons/fi";
import { useToast } from "@/hooks/useToast";
import { useOnboarding } from "@/hooks/useOnboarding";

// Import step components
import CompanySetupForm from "@/components/onboarding/CompanySetupForm";
import SdiSettings from "@/components/settings/SdiSettings";
import RentriWizardStep from "@/components/onboarding/RentriWizardStep";
import RvfuWizardStep from "@/components/onboarding/RvfuWizardStep";

const STEP_META = {
  company: { title: "Azienda", icon: FiGlobe, description: "Dati fiscali e indirizzo" },
  rvfu: { title: "RVFU ACI", icon: FiShield, description: "Credenziali MIT/ACI" },
  sdi: { title: "SDI / Fatture", icon: FiFileText, description: "Fatturazione Elettronica" },
  rentri: { title: "RENTRI", icon: FiSmartphone, description: "Certificati e Dispositivi" },
  team: { title: "Team", icon: FiGlobe, description: "Membri del team" },
};

export default function SetupWizard() {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const { groups, refresh, loading: onboardingLoading, markSkipped } = useOnboarding();
  const [activeTab, setActiveTab] = useState(null);
  const [initializing, setInitializing] = useState(false);

  // Step del wizard derivati dai gruppi onboarding (escludi team — si gestisce da settings)
  const wizardGroups = useMemo(() => {
    const order = ["company", "rvfu", "sdi", "rentri"];
    return groups
      .filter(g => order.includes(g.id))
      .sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
  }, [groups]);

  // Imposta tab iniziale al primo gruppo incompleto
  const effectiveTab = useMemo(() => {
    if (activeTab) return activeTab;
    const firstIncomplete = wizardGroups.find(g => g.percent < 100);
    return firstIncomplete?.id || wizardGroups[0]?.id || "company";
  }, [activeTab, wizardGroups]);

  const currentStepIndex = wizardGroups.findIndex(g => g.id === effectiveTab);
  const progressPercent = wizardGroups.length > 0
    ? Math.round(wizardGroups.filter(g => g.percent === 100).length / wizardGroups.length * 100)
    : 0;

  // ── Uscita / Skip: usa markSkipped centralizzato ──
  const handleSkip = async () => {
    console.log("[SetupWizard] handleSkip clicked");
    setInitializing(true);
    try {
      const ok = await markSkipped();
      console.log("[SetupWizard] markSkipped result:", ok);
      if (ok) {
        // Naviga subito senza aspettare refreshOrg — orgContext si aggiorna in background
        navigate("/", { replace: true });
      } else {
        console.error("[SetupWizard] Errore durante l'uscita dal setup");
        showError("Errore durante l'uscita dal setup.");
      }
    } catch (err) {
      console.error("[SetupWizard] handleSkip error:", err);
      showError("Errore: " + err.message);
    } finally {
      setInitializing(false);
    }
  };

  const handleCompleteStep = async () => {
    // Refresh checks dal DB per verificare completamento reale
    await refresh();

    // Passa al prossimo step incompleto
    const nextIncomplete = wizardGroups.find((g, i) => i > currentStepIndex && g.percent < 100);
    if (nextIncomplete) {
      setActiveTab(nextIncomplete.id);
    } else {
      // Tutti completati — segna onboarding come fatto
      await handleFinish();
    }
  };

  const handleFinish = async () => {
    console.log("[SetupWizard] handleFinish clicked");
    setInitializing(true);
    try {
      const ok = await markSkipped();
      if (ok) {
        showSuccess("Configurazione completata!");
        navigate("/", { replace: true });
      } else {
        console.error("[SetupWizard] handleFinish: markSkipped returned false");
        showError("Errore durante la finalizzazione.");
      }
    } catch (err) {
      console.error("[SetupWizard] handleFinish error:", err);
      showError("Errore: " + err.message);
    } finally {
      setInitializing(false);
    }
  };

  if (onboardingLoading) {
    return (
      <div className="min-h-screen bg-[#0a0f18] flex items-center justify-center">
        <FiLoader className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0f18] text-slate-300 flex flex-col font-sans selection:bg-blue-500/30">
      {/* Top Progress Bar */}
      <div className="h-1 bg-white/5 relative overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-500 transition-all duration-700 ease-out shadow-[0_0_20px_rgba(37,99,235,0.5)]"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Nav */}
        <div className="w-80 border-r border-white/5 bg-[#0d141f]/50 p-8 flex flex-col gap-10">
          <div className="space-y-2">
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/30">
                <FiGlobe className="text-white w-6 h-6" />
              </div>
              Setup Wizard
            </h1>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest ml-1">Configurazione Ambiente</p>
          </div>

          <nav className="flex-1 space-y-3">
            {wizardGroups.map((group) => {
              const meta = STEP_META[group.id] || {};
              const Icon = meta.icon || FiGlobe;
              const isCompleted = group.percent === 100;
              const isActive = effectiveTab === group.id;

              return (
                <button
                  key={group.id}
                  onClick={() => setActiveTab(group.id)}
                  className={`w-full group text-left p-4 rounded-2xl border transition-all duration-300 flex items-center gap-4 ${
                    isActive
                      ? "bg-blue-600/10 border-blue-500/40 text-blue-400 shadow-lg shadow-blue-600/5"
                      : isCompleted
                        ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-400"
                        : "bg-transparent border-transparent text-slate-500 hover:bg-white/5"
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                    isActive ? "bg-blue-600 text-white shadow-lg" : isCompleted ? "bg-emerald-500 text-white" : "bg-slate-800 text-slate-600"
                  }`}>
                    {isCompleted ? <FiCheck className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-bold tracking-tight">{meta.title || group.label}</div>
                    <div className="text-[10px] opacity-60 font-medium">{meta.description}</div>
                  </div>
                  {isCompleted && (
                    <FiCheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  )}
                </button>
              );
            })}
          </nav>

          <div className="p-5 bg-gradient-to-br from-blue-600/10 to-purple-600/10 border border-white/5 rounded-3xl">
            <div className="flex items-center gap-3 mb-3">
              <FiClock className="text-blue-400 w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Progresso</span>
            </div>
            <div className="text-xl font-bold text-white tracking-tight">{progressPercent}%</div>
            <p className="text-[10px] text-slate-500 mt-2 leading-relaxed italic">
              {progressPercent === 100
                ? "Tutto configurato! Puoi procedere."
                : "Assicurati di avere a portata di mano certificati e credenziali."}
            </p>
          </div>

          <button
            onClick={handleSkip}
            disabled={initializing}
            className="w-full py-4 text-xs font-bold text-slate-500 hover:text-slate-300 transition-colors flex items-center justify-center gap-2 border border-white/5 rounded-2xl bg-white/[0.02] disabled:opacity-40"
          >
            {initializing ? <FiLoader className="w-3 h-3 animate-spin" /> : null}
            Esci dal Setup e configura in seguito
          </button>
        </div>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-12 custom-scrollbar relative">
          <div className="max-w-3xl mx-auto mb-10 animate-in fade-in slide-in-from-top-4 duration-500">
            <h2 className="text-4xl font-black text-white tracking-tighter mb-4 flex items-center gap-4">
              {STEP_META[effectiveTab]?.title || effectiveTab}
              <span className="text-sm font-bold px-3 py-1 bg-white/5 rounded-full text-slate-500 tracking-normal border border-white/5">
                Step {currentStepIndex + 1} di {wizardGroups.length}
              </span>
            </h2>
            <p className="text-lg text-slate-400 leading-relaxed max-w-xl">
              {effectiveTab === 'company' && "Configura i dati fiscali della tua organizzazione. Queste informazioni appariranno sui documenti ufficiali."}
              {effectiveTab === 'rvfu' && "Inserisci le credenziali RVFU fornite da ACI/MIT per la gestione dei formulari digitali."}
              {effectiveTab === 'sdi' && "Configura i parametri per la fatturazione elettronica e l'invio al Sistema di Interscambio."}
              {effectiveTab === 'rentri' && "Carica i certificati RENTRI e configura i dispositivi di firma remota."}
            </p>
          </div>

          {/* Interactive Card */}
          <div className="max-w-3xl mx-auto bg-[#141c27] border border-white/5 rounded-3xl p-8 shadow-2xl relative">
            {effectiveTab === 'company' && (
              <CompanySetupForm onComplete={handleCompleteStep} />
            )}

            {effectiveTab === 'rvfu' && (
              <RvfuWizardStep onComplete={handleCompleteStep} />
            )}

            {effectiveTab === 'sdi' && (
              <div className="space-y-6">
                <SdiSettings showToast={(type, msg) => type === 'success' ? showSuccess(msg) : showError(msg)} />
                <div className="flex justify-end items-center pt-6 border-t border-white/5">
                  <button
                    onClick={handleCompleteStep}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition"
                  >
                    Salva configurazione e continua <FiArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {effectiveTab === 'rentri' && (
              <RentriWizardStep onComplete={handleCompleteStep} />
            )}
          </div>

          {/* Pulsante Completa Tutto (visibile se tutti i gruppi sono 100%) */}
          {progressPercent === 100 && (
            <div className="max-w-3xl mx-auto mt-8 text-center">
              <button
                onClick={handleFinish}
                disabled={initializing}
                className="px-10 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl transition shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-3 mx-auto disabled:opacity-40"
              >
                {initializing ? <FiLoader className="w-5 h-5 animate-spin" /> : <FiCheckCircle className="w-5 h-5" />}
                Completa Configurazione
              </button>
            </div>
          )}
        </main>
      </div>

      {initializing && (
        <div className="fixed inset-0 z-[200] bg-[#0a0f18]/95 backdrop-blur-md flex flex-col items-center justify-center gap-6 animate-in fade-in duration-500">
          <div className="relative">
            <div className="w-24 h-24 border-4 border-blue-500/20 rounded-full animate-[spin_3s_linear_infinite]" />
            <div className="w-24 h-24 border-t-4 border-blue-500 rounded-full animate-spin absolute inset-0" />
            <FiGlobe className="absolute inset-0 m-auto w-8 h-8 text-blue-500 animate-pulse" />
          </div>
          <div className="text-center space-y-2">
            <h3 className="text-xl font-black text-white uppercase tracking-widest">Inizializzazione Ambiente</h3>
            <p className="text-sm text-slate-500 font-medium">Stiamo preparando tutto per te...</p>
          </div>
        </div>
      )}
    </div>
  );
}
