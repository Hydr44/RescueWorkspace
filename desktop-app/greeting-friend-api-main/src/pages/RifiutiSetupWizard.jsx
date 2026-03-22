// src/pages/RifiutiSetupWizard.jsx
/**
 * Wizard di Setup RENTRI - Configurazione Guidata
 * Design L aligned
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useOrg } from "../context/OrgContext";
import { useRentriSetupStatus } from "../hooks/useRentriSetupStatus";
import { supabaseBrowser } from "../lib/supabase-browser";
import {
  FiCheckCircle, FiAlertCircle, FiShield, FiUpload, FiSettings,
  FiArrowRight, FiArrowLeft, FiExternalLink,
  FiInfo, FiPlay, FiAlertTriangle
} from "react-icons/fi";
import { useDemo } from "@/hooks/useDemo";

/* ─── Constants ─── */
const STEPS = [
  { id: 'intro', title: 'Introduzione', icon: FiInfo },
  { id: 'certificate', title: 'Certificato .p12', icon: FiUpload },
  { id: 'num_iscr_sito', title: 'Configurazione Sito', icon: FiSettings },
  { id: 'test', title: 'Test Trasmissione', icon: FiPlay },
];

const inputCls = "w-full px-3 py-2 text-sm bg-[#141c27] border border-[#243044] rounded-lg text-slate-200 focus:ring-1 focus:ring-blue-500/40 outline-none transition-colors";

/* ─── Alert box helper ─── */
function AlertBox({ type = "info", icon: Icon, title, children }) {
  const styles = {
    info:    "bg-blue-500/10 border-blue-500/20 text-blue-400",
    warn:    "bg-amber-500/10 border-amber-500/20 text-amber-400",
    success: "bg-sky-500/8 border-sky-500/15 text-sky-400",
    error:   "bg-red-500/10 border-red-500/20 text-red-400",
  };
  return (
    <div className={`flex items-start gap-2.5 px-4 py-3 rounded-xl border text-xs ${styles[type]}`}>
      {Icon && <Icon className="w-3.5 h-3.5 mt-0.5 shrink-0" />}
      <div className="flex-1">
        {title && <p className="font-medium mb-1">{title}</p>}
        <div className="text-slate-400">{children}</div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */
export default function RifiutiSetupWizard() {
  const navigate = useNavigate();
  const { orgId } = useOrg();
  const { isDemo } = useDemo();
  const [currentStep, setCurrentStep] = useState(0);
  const [environment, setEnvironment] = useState('demo');

  const setupStatus = useRentriSetupStatus(orgId, environment);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Form dati
  const [numIscrSito, setNumIscrSito] = useState('');
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    if (setupStatus.certificate?.num_iscr_sito) {
      setNumIscrSito(setupStatus.certificate.num_iscr_sito);
    }
  }, [setupStatus.certificate]);

  function nextStep() {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
      setError(null);
      setSuccess(null);
    }
  }

  function prevStep() {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setError(null);
      setSuccess(null);
    }
  }

  async function handleSaveNumIscrSito() {
    if (!numIscrSito || numIscrSito.length < 22) {
      setError('num_iscr_sito deve avere almeno 22 caratteri (es: OP2512HTM066432-CL0001)');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const supabase = supabaseBrowser();
      const { error: updateError } = await supabase
        .from('rentri_org_certificates')
        .update({ num_iscr_sito: numIscrSito })
        .eq('org_id', orgId)
        .eq('environment', environment)
        .eq('is_active', true)
        .eq('is_default', true);

      if (updateError) throw updateError;

      setSuccess('num_iscr_sito configurato correttamente');
      setupStatus.refresh();
      setTimeout(() => nextStep(), 1500);
    } catch (err) {
      setError('Errore salvataggio: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleTestTransmission() {
    if (isDemo) {
      alert("\u{1F512} Modalità Demo\n\nIl test di trasmissione RENTRI non è disponibile in modalità demo.");
      return;
    }
    setLoading(true);
    setError(null);
    setTestResult(null);

    try {
      const supabase = supabaseBrowser();

      const { data: testFir } = await supabase
        .from('rentri_formulari')
        .select('id')
        .eq('org_id', orgId)
        .eq('rentri_stato', 'bozza')
        .limit(1)
        .single();

      if (!testFir) {
        setError('Crea prima un FIR di test nella sezione Formulari. Usa "Riempi Dati Test" per generarlo rapidamente.');
        setLoading(false);
        return;
      }

      const apiUrl = import.meta.env.VITE_RENTRI_API_URL || 'https://rentri-test.rescuemanager.eu/api/rentri';
      const response = await fetch(`${apiUrl}/fir/trasmetti`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fir_id: testFir.id }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Errore trasmissione');

      setTestResult({
        success: true,
        message: `FIR trasmesso con successo!\nNumero FIR: ${result.rentri_numero || 'N/A'}\nID RENTRI: ${result.rentri_id || 'N/A'}`,
      });
      setSuccess('Configurazione completata — RENTRI pronto all\'uso.');
      setTimeout(() => navigate('/rifiuti'), 3000);
    } catch (err) {
      setTestResult({ success: false, message: err.message });
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function skipToUpload() {
    navigate('/rifiuti/certificati/upload?wizard=true&return=/rifiuti/setup');
  }

  /* ─── Step renderer ─── */
  function renderStep() {
    switch (STEPS[currentStep].id) {
      case 'intro':
        return <IntroStep environment={environment} setEnvironment={setEnvironment} />;
      case 'certificate':
        return <CertificateStep hasCertificate={setupStatus.hasCertificate} certificate={setupStatus.certificate} onUpload={skipToUpload} environment={environment} />;
      case 'num_iscr_sito':
        return <NumIscrSitoStep numIscrSito={numIscrSito} setNumIscrSito={setNumIscrSito} hasNumIscrSito={setupStatus.hasNumIscrSito} certificate={setupStatus.certificate} onSave={handleSaveNumIscrSito} loading={loading} error={error} success={success} />;
      case 'test':
        return <TestStep onTest={handleTestTransmission} loading={loading} error={error} testResult={testResult} success={success} />;
      default:
        return null;
    }
  }

  const progress = ((currentStep + 1) / STEPS.length) * 100;
  const canGoNext =
    (currentStep === 0) ||
    (currentStep === 1 && setupStatus.hasCertificate) ||
    (currentStep === 2 && setupStatus.hasNumIscrSito) ||
    (currentStep === 3);

  /* ─── Skeleton ─── */
  if (setupStatus.loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 bg-[#243044] rounded-lg" />
          <div><div className="h-5 w-48 bg-[#243044] rounded mb-1" /><div className="h-3 w-64 bg-[#1a2536] rounded" /></div>
        </div>
        <div className="bg-[#1a2536] rounded-xl border border-[#243044] p-5 space-y-4">
          {[1,2,3].map(i => <div key={i} className="h-10 bg-[#141c27] rounded-lg" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header — Design L compact */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/rifiuti")} className="p-2 text-slate-400 hover:text-slate-200 hover:bg-[#1a2536] rounded-lg transition-colors" title="Torna alla dashboard">
            <FiArrowLeft className="w-4 h-4" />
          </button>
          <div className="p-2 bg-blue-500/10 rounded-lg"><FiShield className="w-5 h-5 text-blue-400" /></div>
          <div>
            <h1 className="text-lg font-semibold text-slate-100">Configurazione RENTRI</h1>
            <p className="text-xs text-slate-500">Setup guidato passo-passo per l'integrazione RENTRI</p>
          </div>
        </div>
        <button onClick={() => navigate('/rifiuti')} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-[#1a2536] border border-[#243044] rounded-lg hover:bg-[#243044] transition-colors">
          Salta per ora
        </button>
      </div>

      {/* Stepper */}
      <div className="bg-[#1a2536] rounded-xl border border-[#243044] p-4">
        <div className="flex items-center gap-1">
          {STEPS.map((step, idx) => {
            const StepIcon = step.icon;
            const isActive = idx === currentStep;
            const isComplete = idx < currentStep || (idx === 1 && setupStatus.hasCertificate) || (idx === 2 && setupStatus.hasNumIscrSito);

            return (
              <div key={step.id} className="flex items-center flex-1">
                <button
                  onClick={() => { if (isComplete || idx <= currentStep) { setCurrentStep(idx); setError(null); setSuccess(null); } }}
                  disabled={!isComplete && idx > currentStep}
                  className="flex flex-col items-center flex-1 group"
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                    isComplete ? 'bg-sky-500/10 text-sky-400' :
                    isActive   ? 'bg-blue-500/10 text-blue-400' :
                                 'bg-[#141c27] text-slate-600'
                  }`}>
                    {isComplete ? <FiCheckCircle className="w-4 h-4" /> : <StepIcon className="w-4 h-4" />}
                  </div>
                  <p className={`text-[10px] mt-1.5 font-medium transition-colors ${
                    isActive ? 'text-blue-400' : isComplete ? 'text-sky-400' : 'text-slate-600'
                  }`}>
                    {step.title}
                  </p>
                </button>
                {idx < STEPS.length - 1 && (
                  <div className={`flex-1 h-px mx-1 ${isComplete ? 'bg-sky-500/30' : 'bg-[#243044]'}`} />
                )}
              </div>
            );
          })}
        </div>
        {/* Progress bar */}
        <div className="w-full bg-[#141c27] rounded-full h-1 mt-3">
          <div className="bg-blue-500 h-1 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-[#1a2536] rounded-xl border border-[#243044] p-5">
        {renderStep()}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={prevStep}
          disabled={currentStep === 0}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-[#1a2536] border border-[#243044] rounded-lg hover:bg-[#243044] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <FiArrowLeft className="w-3.5 h-3.5" />
          Indietro
        </button>

        {currentStep < STEPS.length - 1 ? (
          <button
            onClick={nextStep}
            disabled={!canGoNext}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Avanti
            <FiArrowRight className="w-3.5 h-3.5" />
          </button>
        ) : (
          <button
            onClick={handleTestTransmission}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? (
              <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Test in corso...</>
            ) : (
              <><FiPlay className="w-3.5 h-3.5" /> Esegui Test</>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   STEP 1: Intro
   ═══════════════════════════════════════════════════════════════ */
function IntroStep({ environment, setEnvironment }) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-slate-200 mb-1">Benvenuto nella Configurazione RENTRI</h2>
        <p className="text-xs text-slate-500">Ti guideremo passo-passo per configurare l'integrazione con il Registro Elettronico Nazionale.</p>
      </div>

      <AlertBox type="info" icon={FiInfo} title="Cosa ti serve prima di iniziare">
        <ul className="space-y-0.5 list-disc list-inside">
          <li>Accesso al portale RENTRI (SPID/CIE)</li>
          <li>Operatore accreditato su RENTRI</li>
          <li>Almeno 1 unità locale creata</li>
          <li>Certificato .p12 scaricato dal portale</li>
          <li>Password del certificato .p12</li>
          <li>Numero iscrizione sito (num_iscr_sito)</li>
        </ul>
      </AlertBox>

      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1.5">Ambiente RENTRI</label>
        <select
          value={environment}
          onChange={(e) => setEnvironment(e.target.value)}
          className={inputCls}
        >
          <option value="demo">DEMO — Ambiente di Test</option>
          <option value="production">PRODUZIONE — Ambiente Reale</option>
        </select>
        <p className="text-[10px] text-slate-500 mt-1.5">
          {environment === 'demo'
            ? 'DEMO è gratuito e perfetto per testare. I dati non hanno valore legale.'
            : 'PRODUZIONE per operatività reale. Richiede accreditamento completo.'}
        </p>
      </div>

      <AlertBox type="warn" icon={FiAlertTriangle} title="Tempo stimato: 15-20 minuti">
        <p>
          Se non hai ancora il certificato .p12, vai su{' '}
          <a href="https://portale.rentri.gov.it" target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">portale RENTRI</a>{' '}
          per scaricarlo prima.
        </p>
      </AlertBox>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   STEP 2: Certificate
   ═══════════════════════════════════════════════════════════════ */
function CertificateStep({ hasCertificate, certificate, onUpload, environment }) {
  if (hasCertificate && certificate) {
    const expiresAt = new Date(certificate.expires_at);
    const isExpiringSoon = expiresAt.getTime() - Date.now() < 30 * 24 * 60 * 60 * 1000;

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-sky-500/10 rounded-lg"><FiCheckCircle className="w-4 h-4 text-sky-400" /></div>
          <div>
            <h2 className="text-sm font-semibold text-slate-200">Certificato Configurato</h2>
            <p className="text-xs text-slate-500">Il certificato RENTRI è presente e attivo</p>
          </div>
        </div>

        <div className="bg-[#141c27] rounded-lg border border-[#243044] p-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-0.5">CF Operatore</p>
              <p className="text-sm font-mono text-slate-200">{certificate.cf_operatore}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-0.5">Ragione Sociale</p>
              <p className="text-sm text-slate-200">{certificate.ragione_sociale || 'N/A'}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-0.5">Scadenza</p>
              <p className={`text-sm ${isExpiringSoon ? 'text-amber-400 font-semibold' : 'text-slate-200'}`}>
                {expiresAt.toLocaleDateString('it-IT')}
                {isExpiringSoon && <span className="ml-1.5 text-[10px] bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded">In scadenza</span>}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-0.5">Ambiente</p>
              <p className="text-sm text-slate-200">{environment === 'demo' ? 'DEMO' : 'PRODUZIONE'}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-slate-200 mb-1">Carica Certificato .p12</h2>
        <p className="text-xs text-slate-500">Carica il file certificato scaricato dal portale RENTRI</p>
      </div>

      <div className="bg-[#141c27] rounded-xl border-2 border-dashed border-[#243044] hover:border-blue-500/30 p-8 text-center transition-colors">
        <div className="p-3 bg-blue-500/10 rounded-lg inline-flex mb-3">
          <FiUpload className="w-5 h-5 text-blue-400" />
        </div>
        <p className="text-sm font-medium text-slate-300 mb-1">Nessun certificato caricato</p>
        <p className="text-xs text-slate-500 mb-4">Carica il file .p12 per continuare la configurazione</p>
        <button
          onClick={onUpload}
          className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <FiUpload className="w-3.5 h-3.5" />
          Carica Certificato .p12
        </button>
      </div>

      <AlertBox type="info" icon={FiInfo} title="Come ottenere il certificato">
        <ol className="space-y-0.5 list-decimal list-inside">
          <li>Accedi al <a href="https://portale.rentri.gov.it" target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">portale RENTRI</a></li>
          <li>Vai su <strong className="text-slate-300">Interoperabilità &rarr; Gestione certificati</strong></li>
          <li>Richiedi un nuovo certificato di dominio RENTRI</li>
          <li>Scarica il file .p12 e annota la password</li>
        </ol>
      </AlertBox>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   STEP 3: num_iscr_sito
   ═══════════════════════════════════════════════════════════════ */
function NumIscrSitoStep({ numIscrSito, setNumIscrSito, hasNumIscrSito, certificate, onSave, loading, error, success }) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-slate-200 mb-1">Configura Numero Iscrizione Sito</h2>
        <p className="text-xs text-slate-500">Inserisci il num_iscr_sito ottenuto dal portale RENTRI</p>
      </div>

      {hasNumIscrSito && certificate?.num_iscr_sito && (
        <div className="flex items-center gap-2.5 px-4 py-2.5 bg-sky-500/8 border border-sky-500/15 rounded-xl">
          <FiCheckCircle className="w-3.5 h-3.5 text-sky-400 shrink-0" />
          <div className="flex-1">
            <p className="text-xs text-sky-400 font-medium">Già configurato</p>
            <p className="text-sm font-mono text-slate-200 mt-0.5">{certificate.num_iscr_sito}</p>
          </div>
        </div>
      )}

      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1.5">
          Numero Iscrizione Sito (num_iscr_sito) <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={numIscrSito}
          onChange={(e) => setNumIscrSito(e.target.value.toUpperCase())}
          className={`${inputCls} font-mono`}
          placeholder="OP2512HTM066432-CL0001"
          maxLength={50}
        />
        <p className="text-[10px] text-slate-500 mt-1.5">
          Formato: OP[4cifre][3alfanum][6cifre]-[2lett][4cifre] (min. 22 caratteri)
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg">
          <FiAlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 px-3 py-2 bg-sky-500/8 border border-sky-500/15 rounded-lg">
          <FiCheckCircle className="w-3.5 h-3.5 text-sky-400 shrink-0" />
          <p className="text-xs text-sky-400">{success}</p>
        </div>
      )}

      <button
        onClick={onSave}
        disabled={loading || !numIscrSito || numIscrSito.length < 22}
        className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {loading ? (
          <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Salvataggio...</>
        ) : (
          <><FiCheckCircle className="w-3.5 h-3.5" /> Salva Configurazione</>
        )}
      </button>

      <AlertBox type="info" icon={FiInfo} title="Come ottenere num_iscr_sito">
        <ol className="space-y-0.5 list-decimal list-inside">
          <li>Vai su <strong className="text-slate-300">Anagrafica &rarr; Unità Locali</strong> nel portale RENTRI</li>
          <li>Crea o seleziona la tua unità locale</li>
          <li>Copia il <strong className="text-slate-300">num_iscr_sito</strong> (es: OP2512HTM066432-CL0001)</li>
          <li>Incollalo qui sopra</li>
        </ol>
        <a href="https://portale.rentri.gov.it" target="_blank" rel="noopener noreferrer" className="text-blue-400 underline mt-2 inline-flex items-center gap-1">
          Apri Portale RENTRI <FiExternalLink className="w-3 h-3" />
        </a>
      </AlertBox>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   STEP 4: Test
   ═══════════════════════════════════════════════════════════════ */
function TestStep({ onTest, loading, error, testResult, success }) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-slate-200 mb-1">Test Trasmissione FIR</h2>
        <p className="text-xs text-slate-500">Verifica che tutto funzioni trasmettendo un FIR di test</p>
      </div>

      <div className="bg-[#141c27] rounded-lg border border-[#243044] p-4 space-y-3">
        <p className="text-xs text-slate-400">
          Assicurati di avere almeno un FIR in bozza nella sezione Formulari.
          Puoi crearne uno usando <strong className="text-slate-300">"Riempi Dati Test"</strong> nel form FIR.
        </p>

        {testResult && (
          <div className={`rounded-lg p-3 border ${
            testResult.success
              ? 'bg-sky-500/10 border-sky-500/20'
              : 'bg-red-500/10 border-red-500/20'
          }`}>
            <div className="flex items-start gap-2">
              {testResult.success
                ? <FiCheckCircle className="w-3.5 h-3.5 text-sky-400 mt-0.5 shrink-0" />
                : <FiAlertCircle className="w-3.5 h-3.5 text-red-400 mt-0.5 shrink-0" />
              }
              <pre className="text-xs whitespace-pre-wrap text-slate-200">{testResult.message}</pre>
            </div>
          </div>
        )}

        {error && !testResult && (
          <div className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg">
            <FiAlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
            <p className="text-xs text-red-400">{error}</p>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 px-3 py-2 bg-sky-500/8 border border-sky-500/15 rounded-lg">
            <FiCheckCircle className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <p className="text-xs text-sky-400">{success}</p>
          </div>
        )}
      </div>

      <AlertBox type="warn" icon={FiAlertTriangle} title="Nota importante">
        <p>
          Il test trasmetterà un FIR reale a RENTRI. In ambiente DEMO non ci sono problemi,
          ma in PRODUZIONE il FIR avrà valore legale.
        </p>
      </AlertBox>
    </div>
  );
}

