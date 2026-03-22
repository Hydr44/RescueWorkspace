// src/components/rvfu/VFUProcessingTimeline.jsx
// Timeline visiva delle fasi di lavorazione VFU (D.Lgs 209/2003)

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  FiTruck, FiShield, FiDroplet, FiTool, FiPackage, FiBarChart2,
  FiFileText, FiSend, FiCheckCircle, FiClock, FiAlertTriangle,
  FiChevronDown, FiChevronUp, FiPlay, FiCheck, FiSkipForward,
  FiPrinter, FiLoader, FiRefreshCw,
} from 'react-icons/fi';
import { supabaseBrowser } from '@/lib/supabase-browser';
import { creaBozzaFIR, creaBozzaFattura } from '@/lib/vfu-draft-creator';
import { creaMovimentoCaricoVFU } from '@/lib/vfu-movimento-carico';
import { creaMovimentoScaricoVFU } from '@/lib/vfu-movimento-scarico';
import { creaRicambiEstratti } from '@/lib/vfu-ricambi-presets';
import { convertiTuttiRicambiVFU } from '@/lib/vfu-ricambi-to-spare-parts';
import { logger } from '@/lib/logger';

const STEP_ICONS = {
  accettazione: FiTruck,
  messa_in_sicurezza: FiShield,
  bonifica: FiDroplet,
  smontaggio_ricambi: FiTool,
  smontaggio_componenti: FiPackage,
  pesatura: FiBarChart2,
  radiazione_pra: FiFileText,
  conferimento: FiSend,
  completato: FiCheckCircle,
};

const STATUS_STYLES = {
  pending: { bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/20', dot: 'bg-slate-500' },
  in_progress: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30', dot: 'bg-blue-500 animate-pulse' },
  completed: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', dot: 'bg-emerald-500' },
  skipped: { bg: 'bg-slate-500/5', text: 'text-slate-500', border: 'border-slate-500/10', dot: 'bg-slate-600' },
  blocked: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20', dot: 'bg-red-500' },
};

const STATUS_LABELS = {
  pending: 'In attesa',
  in_progress: 'In corso',
  completed: 'Completato',
  skipped: 'Saltato',
  blocked: 'Bloccato',
};

// Parti da bonificare - lista stampabile (D.Lgs 209/2003)
const BONIFICA_PARTI = [
  { nome: 'Carburante (benzina/diesel/GPL/metano)', cer: '13 07 01*', pericoloso: true },
  { nome: 'Olio motore', cer: '13 02 05*', pericoloso: true },
  { nome: 'Olio cambio/differenziale', cer: '13 02 06*', pericoloso: true },
  { nome: 'Olio servosterzo', cer: '13 02 08*', pericoloso: true },
  { nome: 'Liquido freni', cer: '16 01 13*', pericoloso: true },
  { nome: 'Liquido antigelo', cer: '16 01 14*', pericoloso: true },
  { nome: 'Liquido lavavetri', cer: '16 01 15', pericoloso: false },
  { nome: 'Gas condizionatore (R134a/R1234yf)', cer: '14 06 01*', pericoloso: true },
  { nome: 'Filtro olio', cer: '16 01 07*', pericoloso: true },
  { nome: 'Filtro carburante', cer: '16 01 07*', pericoloso: true },
  { nome: 'Batteria al piombo', cer: '16 06 01*', pericoloso: true },
  { nome: 'Airbag (se non disattivati)', cer: '16 01 10*', pericoloso: true },
];

function getDeadlineInfo(step) {
  if (!step.deadline_at || step.status === 'completed' || step.status === 'skipped') return null;
  const deadline = new Date(step.deadline_at);
  const now = new Date();
  const diffMs = deadline - now;
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  const isOverdue = diffDays < 0;
  const isUrgent = diffDays >= 0 && diffDays <= 2;

  let label, color;
  if (isOverdue) {
    label = `Scaduto da ${Math.abs(diffDays)} giorn${Math.abs(diffDays) === 1 ? 'o' : 'i'}`;
    color = 'text-red-400 bg-red-500/10';
  } else if (diffDays === 0) {
    label = 'Scade OGGI';
    color = 'text-amber-400 bg-amber-500/10';
  } else if (isUrgent) {
    label = `Scade tra ${diffDays} giorn${diffDays === 1 ? 'o' : 'i'}`;
    color = 'text-amber-400 bg-amber-500/10';
  } else {
    label = `Scade tra ${diffDays} giorni (${deadline.toLocaleDateString('it-IT')})`;
    color = 'text-slate-500 bg-slate-500/5';
  }
  return { label, color, isOverdue, isUrgent, diffDays };
}

// Stampa lista bonifica
function printBonificaList(targa, telaio) {
  const w = window.open('', '_blank', 'width=800,height=600');
  if (!w) return;
  w.document.write(`
    <html><head><title>Lista Bonifica - ${targa || 'N/A'}</title>
    <style>
      body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
      h1 { font-size: 18px; border-bottom: 2px solid #333; padding-bottom: 8px; }
      h2 { font-size: 14px; color: #666; margin-top: 4px; }
      table { width: 100%; border-collapse: collapse; margin-top: 16px; }
      th, td { border: 1px solid #ccc; padding: 6px 10px; text-align: left; font-size: 13px; }
      th { background: #f5f5f5; font-weight: bold; }
      .check { width: 30px; text-align: center; }
      .danger { color: #c00; font-weight: bold; }
      .footer { margin-top: 24px; font-size: 11px; color: #999; border-top: 1px solid #ddd; padding-top: 8px; }
      @media print { body { padding: 0; } }
    </style></head><body>
    <h1>SCHEDA BONIFICA AMBIENTALE - D.Lgs 209/2003</h1>
    <h2>Veicolo: ${targa || '___________'} | Telaio: ${telaio || '___________'} | Data: ${new Date().toLocaleDateString('it-IT')}</h2>
    <table>
      <tr><th class="check">✓</th><th>Fluido / Componente</th><th>CER</th><th>Peric.</th><th>Quantità</th><th>Note</th></tr>
      ${BONIFICA_PARTI.map(p => `
        <tr>
          <td class="check">☐</td>
          <td>${p.nome}</td>
          <td>${p.cer}</td>
          <td>${p.pericoloso ? '<span class="danger">Sì</span>' : 'No'}</td>
          <td></td>
          <td></td>
        </tr>
      `).join('')}
    </table>
    <div class="footer">
      <p>Operatore: ___________________________ Firma: ___________________________</p>
      <p>Stampato il ${new Date().toLocaleString('it-IT')} - RescueManager VFU</p>
    </div>
    </body></html>
  `);
  w.document.close();
  w.print();
}

function StepChecklist({ checklist, stepData, onToggle, disabled }) {
  if (!checklist || checklist.length === 0) return null;
  const data = stepData || {};

  return (
    <div className="mt-3 space-y-1.5">
      {checklist.map((item) => {
        const checked = !!data[item.key];
        return (
          <label
            key={item.key}
            className={`flex items-center gap-2 px-2 py-1 rounded text-xs cursor-pointer hover:bg-white/5 transition ${
              disabled ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <input
              type="checkbox"
              checked={checked}
              onChange={() => !disabled && onToggle(item.key, !checked)}
              disabled={disabled}
              className="rounded border-slate-600 bg-[#141c27] text-blue-500 focus:ring-blue-500/30 focus:ring-offset-0"
            />
            <span className={checked ? 'text-slate-300 line-through' : 'text-slate-400'}>
              {item.label}
              {item.required && !checked && <span className="text-red-400 ml-1">*</span>}
            </span>
          </label>
        );
      })}
    </div>
  );
}

function StepCard({ step, stepDef, isActive, isLast, caseId, orgId, targa, telaio, onStart, onComplete, onSkip, onToggleChecklist, onUpdateNotes, onActionMessage }) {
  const [expanded, setExpanded] = useState(step.status === 'in_progress');
  const [actionLoading, setActionLoading] = useState(false);
  const [retryAction, setRetryAction] = useState(null); // 'fir' | 'fattura' | null
  const [retryLoading, setRetryLoading] = useState(false);
  const style = STATUS_STYLES[step.status] || STATUS_STYLES.pending;
  const Icon = STEP_ICONS[step.step_code] || FiClock;
  const checklist = stepDef?.checklist || [];
  const stepData = step.step_data || {};

  const requiredItems = checklist.filter(i => i.required);
  const completedRequired = requiredItems.filter(i => stepData[i.key]);
  const allRequiredDone = requiredItems.length === 0 || completedRequired.length === requiredItems.length;
  const checkedCount = Object.values(stepData).filter(Boolean).length;

  const deadlineInfo = getDeadlineInfo(step);

  // Auto-azioni al completamento fase
  const handleCompleteWithActions = async () => {
    setActionLoading(true);
    try {
      await onComplete(step);

      // Azioni automatiche per fase specifica
      if (step.step_code === 'accettazione' && orgId && caseId) {
        try {
          await creaMovimentoCaricoVFU({ caseId, orgId });
          onActionMessage?.('success', 'Movimento di carico RENTRI creato automaticamente');
          setRetryAction(null);
        } catch (err) {
          logger.warn('[VFU] Auto-Movimento carico failed:', err.message);
          onActionMessage?.('info', 'Movimento RENTRI non creato - usa il bottone Riprova');
          setRetryAction('movimento_carico');
        }
      }
      if (step.step_code === 'smontaggio_ricambi' && orgId && caseId) {
        try {
          await creaRicambiEstratti({ caseId, orgId });
          // Converti automaticamente in spare_parts
          const converted = await convertiTuttiRicambiVFU(caseId, orgId);
          onActionMessage?.('success', `${converted.length} ricambi aggiunti al magazzino`);
          setRetryAction(null);
        } catch (err) {
          logger.warn('[VFU] Auto-Ricambi failed:', err.message);
          onActionMessage?.('info', 'Ricambi non creati - usa il bottone Riprova');
          setRetryAction('ricambi');
        }
      }
      if (step.step_code === 'pesatura' && orgId && caseId) {
        try {
          await creaBozzaFIR({ caseId, orgId });
          onActionMessage?.('success', 'Bozza FIR RENTRI creata automaticamente');
          setRetryAction(null);
        } catch (err) {
          logger.warn('[VFU] Auto-FIR failed:', err.message);
          onActionMessage?.('info', 'FIR non creato - usa il bottone Riprova');
          setRetryAction('fir');
        }
      }
      if (step.step_code === 'conferimento_frantumatore' && orgId && caseId) {
        try {
          await creaMovimentoScaricoVFU({ caseId, orgId });
          onActionMessage?.('success', 'Movimento di scarico RENTRI creato automaticamente');
          setRetryAction(null);
        } catch (err) {
          logger.warn('[VFU] Auto-Movimento scarico failed:', err.message);
          onActionMessage?.('info', 'Movimento scarico non creato - usa il bottone Riprova');
          setRetryAction('movimento_scarico');
        }
      }
      if (step.step_code === 'completato' && orgId && caseId) {
        try {
          await creaBozzaFattura({ caseId, orgId });
          onActionMessage?.('success', 'Bozza fattura creata automaticamente');
          setRetryAction(null);
        } catch (err) {
          logger.warn('[VFU] Auto-Invoice failed:', err.message);
          onActionMessage?.('info', 'Fattura non creata - usa il bottone Riprova');
          setRetryAction('fattura');
        }
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleRetry = async () => {
    if (!retryAction || !orgId || !caseId) return;
    setRetryLoading(true);
    try {
      if (retryAction === 'movimento_carico') {
        await creaMovimentoCaricoVFU({ caseId, orgId });
        onActionMessage?.('success', 'Movimento di carico RENTRI creato!');
      } else if (retryAction === 'ricambi') {
        await creaRicambiEstratti({ caseId, orgId });
        const converted = await convertiTuttiRicambiVFU(caseId, orgId);
        onActionMessage?.('success', `${converted.length} ricambi aggiunti al magazzino!`);
      } else if (retryAction === 'movimento_scarico') {
        await creaMovimentoScaricoVFU({ caseId, orgId });
        onActionMessage?.('success', 'Movimento di scarico RENTRI creato!');
      } else if (retryAction === 'fir') {
        await creaBozzaFIR({ caseId, orgId });
        onActionMessage?.('success', 'Bozza FIR RENTRI creata!');
      } else if (retryAction === 'fattura') {
        await creaBozzaFattura({ caseId, orgId });
        onActionMessage?.('success', 'Bozza fattura creata!');
      }
      setRetryAction(null);
    } catch (err) {
      logger.error(`[VFU] Retry ${retryAction} failed:`, err.message);
      onActionMessage?.('error', `Errore: ${err.message}`);
    } finally {
      setRetryLoading(false);
    }
  };

  return (
    <div className="flex gap-3">
      {/* Timeline line + dot */}
      <div className="flex flex-col items-center">
        <div className={`w-3 h-3 rounded-full mt-1.5 flex-shrink-0 ${style.dot}`} />
        {!isLast && <div className="w-0.5 flex-1 bg-[#243044] mt-1" />}
      </div>

      {/* Card */}
      <div className={`flex-1 mb-3 rounded-lg border ${style.border} ${style.bg} overflow-hidden`}>
        {/* Header */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full px-3 py-2.5 flex items-center gap-2 text-left hover:bg-white/5 transition"
        >
          <Icon className={`w-4 h-4 flex-shrink-0 ${style.text}`} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-sm font-medium ${style.text}`}>{step.step_label}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded ${style.bg} ${style.text}`}>
                {STATUS_LABELS[step.status]}
              </span>
              {deadlineInfo?.isOverdue && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 flex items-center gap-0.5">
                  <FiAlertTriangle className="w-2.5 h-2.5" />
                  Scaduto
                </span>
              )}
              {deadlineInfo?.isUrgent && !deadlineInfo?.isOverdue && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 flex items-center gap-0.5">
                  <FiClock className="w-2.5 h-2.5" />
                  Urgente
                </span>
              )}
            </div>
            {step.completed_at && (
              <p className="text-[10px] text-slate-500 mt-0.5">
                Completato: {new Date(step.completed_at).toLocaleString('it-IT')}
              </p>
            )}
            {deadlineInfo && (
              <p className={`text-[10px] mt-0.5 ${deadlineInfo.color.split(' ')[0]}`}>
                {deadlineInfo.label}
              </p>
            )}
          </div>
          {checklist.length > 0 && (
            <span className="text-[10px] text-slate-500 mr-1">
              {checkedCount}/{checklist.length}
            </span>
          )}
          {expanded ? <FiChevronUp className="w-3.5 h-3.5 text-slate-500" /> : <FiChevronDown className="w-3.5 h-3.5 text-slate-500" />}
        </button>

        {/* Expanded content */}
        {expanded && (
          <div className="px-3 pb-3 border-t border-[#243044]/50">
            {stepDef?.description && (
              <p className="text-xs text-slate-500 mt-2 mb-2">{stepDef.description}</p>
            )}

            {/* Deadline normativa */}
            {stepDef?.deadline_days && step.status !== 'completed' && step.status !== 'skipped' && (
              <div className={`text-[11px] px-2 py-1.5 rounded mb-2 ${deadlineInfo?.color || 'text-slate-500 bg-slate-500/5'}`}>
                ⏱ Scadenza normativa: <strong>{stepDef.deadline_days} giorni</strong> dalla presa in carico (D.Lgs 209/2003)
              </div>
            )}

            {/* Checklist */}
            <StepChecklist
              checklist={checklist}
              stepData={stepData}
              onToggle={(key, val) => onToggleChecklist(step, key, val)}
              disabled={step.status === 'completed' || step.status === 'skipped'}
            />

            {/* Stampa lista bonifica */}
            {step.step_code === 'bonifica' && step.status === 'in_progress' && (
              <button
                onClick={() => printBonificaList(targa, telaio)}
                className="mt-3 px-3 py-1.5 text-xs font-medium bg-[#1a2536] text-slate-300 border border-[#243044] rounded hover:bg-[#243044] transition flex items-center gap-1.5"
              >
                <FiPrinter className="w-3 h-3" /> Stampa scheda bonifica
              </button>
            )}

            {/* Notes */}
            {(step.status === 'in_progress' || step.status === 'completed') && (
              <div className="mt-3">
                <textarea
                  value={step.operator_notes || ''}
                  onChange={(e) => onUpdateNotes(step, e.target.value)}
                  placeholder="Note operatore..."
                  rows={2}
                  disabled={step.status === 'completed'}
                  className="w-full text-xs bg-[#141c27] border border-[#243044] rounded px-2 py-1.5 text-slate-300 placeholder-slate-600 focus:ring-1 focus:ring-blue-500/40 outline-none resize-none disabled:opacity-50"
                />
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-2 mt-3">
              {step.status === 'pending' && isActive && (
                <button
                  onClick={() => onStart(step)}
                  className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded hover:bg-blue-700 transition flex items-center gap-1"
                >
                  <FiPlay className="w-3 h-3" /> Inizia
                </button>
              )}
              {step.status === 'in_progress' && (
                <button
                  onClick={handleCompleteWithActions}
                  disabled={!allRequiredDone || actionLoading}
                  className="px-3 py-1.5 text-xs font-medium bg-emerald-600 text-white rounded hover:bg-emerald-700 transition flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  title={!allRequiredDone ? 'Completa tutti i campi obbligatori prima' : ''}
                >
                  {actionLoading ? <FiLoader className="w-3 h-3 animate-spin" /> : <FiCheck className="w-3 h-3" />}
                  {actionLoading ? 'Completamento...' : 'Completa'}
                </button>
              )}
              {(step.status === 'pending' || step.status === 'in_progress') && !stepDef?.is_mandatory && (
                <button
                  onClick={() => onSkip(step)}
                  className="px-3 py-1.5 text-xs font-medium bg-slate-600/50 text-slate-300 rounded hover:bg-slate-600 transition flex items-center gap-1"
                >
                  <FiSkipForward className="w-3 h-3" /> Salta
                </button>
              )}

              {/* Info azioni automatiche */}
              {step.step_code === 'pesatura' && step.status === 'in_progress' && !retryAction && (
                <span className="text-[10px] text-blue-400/60 self-center ml-1">
                  Al completamento verrà creata la bozza FIR
                </span>
              )}
              {step.step_code === 'completato' && step.status === 'in_progress' && !retryAction && (
                <span className="text-[10px] text-blue-400/60 self-center ml-1">
                  Verrà creata la bozza fattura
                </span>
              )}
            </div>

            {/* Bottone Riprova per azioni fallite */}
            {retryAction && (
              <div className="mt-2 px-2 py-2 rounded bg-amber-500/5 border border-amber-500/20 flex items-center justify-between">
                <span className="text-[11px] text-amber-400">
                  {retryAction === 'fir' ? 'Bozza FIR non creata' : 'Bozza fattura non creata'}
                </span>
                <button
                  onClick={handleRetry}
                  disabled={retryLoading}
                  className="px-2.5 py-1 text-[11px] font-medium bg-amber-600 text-white rounded hover:bg-amber-700 transition flex items-center gap-1 disabled:opacity-50"
                >
                  {retryLoading ? <FiLoader className="w-3 h-3 animate-spin" /> : <FiRefreshCw className="w-3 h-3" />}
                  Riprova
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function VFUProcessingTimeline({ caseId, orgId, targa, telaio, onStepChange }) {
  const [steps, setSteps] = useState([]);
  const [stepDefs, setStepDefs] = useState({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const notesTimerRef = useRef(null);

  const loadSteps = useCallback(async () => {
    if (!caseId) return;
    setLoading(true);
    try {
      const supabase = supabaseBrowser();
      const [stepsRes, defsRes] = await Promise.all([
        supabase
          .from('vfu_processing_steps')
          .select('*')
          .eq('demolition_case_id', caseId)
          .order('step_order', { ascending: true }),
        supabase
          .from('vfu_step_definitions')
          .select('*')
          .order('step_order', { ascending: true }),
      ]);

      if (stepsRes.error) throw stepsRes.error;
      setSteps(stepsRes.data || []);

      if (defsRes.data) {
        const defsMap = {};
        for (const d of defsRes.data) {
          defsMap[d.step_code] = d;
        }
        setStepDefs(defsMap);
      }
    } catch (err) {
      console.error('[VFU Timeline] Error loading steps:', err);
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  useEffect(() => { loadSteps(); }, [loadSteps]);

  // Aggiornamento ottimistico: aggiorna lo stato locale, salva in background
  const updateStepOptimistic = useCallback(async (stepId, updates) => {
    // 1. Aggiorna state locale subito (nessun reload)
    setSteps(prev => prev.map(s =>
      s.id === stepId ? { ...s, ...updates, updated_at: new Date().toISOString() } : s
    ));

    // 2. Salva nel DB in background
    try {
      const supabase = supabaseBrowser();
      const { error } = await supabase
        .from('vfu_processing_steps')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', stepId);
      if (error) {
        console.error('[VFU Timeline] Error updating step:', error);
        await loadSteps(); // Ricarica da DB in caso di errore
      }
    } catch (err) {
      console.error('[VFU Timeline] Error updating step:', err);
      await loadSteps();
    }
  }, [loadSteps]);

  const handleStart = useCallback(async (step) => {
    await updateStepOptimistic(step.id, { status: 'in_progress', started_at: new Date().toISOString() });
  }, [updateStepOptimistic]);

  const handleComplete = useCallback(async (step) => {
    const now = new Date().toISOString();
    await updateStepOptimistic(step.id, { status: 'completed', completed_at: now });

    // Auto-start next pending step (usa lo state corrente)
    setSteps(prev => {
      const currentIdx = prev.findIndex(s => s.id === step.id);
      if (currentIdx >= 0 && currentIdx < prev.length - 1) {
        const next = prev[currentIdx + 1];
        if (next && next.status === 'pending') {
          updateStepOptimistic(next.id, { status: 'in_progress', started_at: now });
        }
      }

      // Update case processing_status
      const nextActive = prev.find((s, i) => i > currentIdx && s.id !== step.id && s.status !== 'completed' && s.status !== 'skipped');
      const supabase = supabaseBrowser();
      if (nextActive) {
        supabase.from('demolition_cases').update({ processing_status: nextActive.step_code }).eq('id', caseId);
      } else {
        supabase.from('demolition_cases').update({ processing_status: 'completato', processing_completed_at: now }).eq('id', caseId);
      }

      return prev;
    });

  }, [updateStepOptimistic, caseId]);

  const handleSkip = useCallback(async (step) => {
    await updateStepOptimistic(step.id, { status: 'skipped', completed_at: new Date().toISOString() });
  }, [updateStepOptimistic]);

  // Checklist: aggiornamento ottimistico senza reload
  const handleToggleChecklist = useCallback(async (step, key, value) => {
    const newData = { ...(step.step_data || {}), [key]: value };
    await updateStepOptimistic(step.id, { step_data: newData });
  }, [updateStepOptimistic]);

  // Notes: debounce con ref per evitare stale closures
  const handleUpdateNotes = useCallback((step, notes) => {
    setSteps(prev => prev.map(s => s.id === step.id ? { ...s, operator_notes: notes } : s));
    if (notesTimerRef.current) clearTimeout(notesTimerRef.current);
    notesTimerRef.current = setTimeout(async () => {
      try {
        const supabase = supabaseBrowser();
        await supabase
          .from('vfu_processing_steps')
          .update({ operator_notes: notes, updated_at: new Date().toISOString() })
          .eq('id', step.id);
      } catch (err) {
        console.error('[VFU Timeline] Error saving notes:', err);
      }
    }, 1000);
  }, []);

  const handleActionMessage = useCallback((type, msg) => {
    setMessage({ type, msg });
    setTimeout(() => setMessage(null), 5000);
  }, []);

  // Find the first non-completed step to determine which is "active"
  const activeStepIdx = steps.findIndex(s => s.status !== 'completed' && s.status !== 'skipped');

  // Progress
  const completedCount = steps.filter(s => s.status === 'completed' || s.status === 'skipped').length;
  const progress = steps.length > 0 ? Math.round((completedCount / steps.length) * 100) : 0;

  // Scadenze urgenti
  const overdueSteps = useMemo(() =>
    steps.filter(s => {
      const info = getDeadlineInfo(s);
      return info && (info.isOverdue || info.isUrgent);
    }),
  [steps]);

  if (loading) {
    return (
      <div className="p-4 text-center text-slate-500 text-sm">
        Caricamento fasi di lavorazione...
      </div>
    );
  }

  if (steps.length === 0) {
    return (
      <div className="p-4 text-center text-slate-500 text-sm">
        Nessuna fase di lavorazione trovata per questo caso.
      </div>
    );
  }

  return (
    <div>
      {/* Messaggi auto-azioni */}
      {message && (
        <div className={`mb-3 px-3 py-2 rounded-lg text-xs flex items-center gap-2 ${
          message.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
          message.type === 'error' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
          'bg-blue-500/10 text-blue-400 border border-blue-500/20'
        }`}>
          {message.type === 'success' ? <FiCheckCircle className="w-3.5 h-3.5" /> : <FiAlertTriangle className="w-3.5 h-3.5" />}
          {message.msg}
        </div>
      )}

      {/* Avviso scadenze urgenti */}
      {overdueSteps.length > 0 && (
        <div className="mb-3 px-3 py-2 rounded-lg bg-red-500/5 border border-red-500/20">
          <div className="flex items-center gap-1.5 text-xs text-red-400 font-medium mb-1">
            <FiAlertTriangle className="w-3.5 h-3.5" />
            Scadenze normative
          </div>
          {overdueSteps.map(s => {
            const info = getDeadlineInfo(s);
            return (
              <p key={s.id} className={`text-[11px] ${info?.isOverdue ? 'text-red-400' : 'text-amber-400'}`}>
                • {s.step_label}: {info?.label}
              </p>
            );
          })}
        </div>
      )}

      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
          <span>Avanzamento lavorazione</span>
          <span>{progress}% ({completedCount}/{steps.length} fasi)</span>
        </div>
        <div className="w-full h-2 bg-[#1a2536] rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Timeline */}
      <div>
        {steps.map((step, idx) => (
          <StepCard
            key={step.id}
            step={step}
            stepDef={stepDefs[step.step_code]}
            isActive={idx === activeStepIdx}
            isLast={idx === steps.length - 1}
            caseId={caseId}
            orgId={orgId}
            targa={targa}
            telaio={telaio}
            onStart={handleStart}
            onComplete={handleComplete}
            onSkip={handleSkip}
            onToggleChecklist={handleToggleChecklist}
            onUpdateNotes={handleUpdateNotes}
            onActionMessage={handleActionMessage}
          />
        ))}
      </div>
    </div>
  );
}
