// src/pages/RifiutiDashboard.jsx
/**
 * Dashboard Rifiuti RENTRI
 * Panoramica gestione rifiuti con RENTRI
 */

import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiFileText, FiTrendingUp, FiAlertCircle,
  FiRefreshCw, FiShield, FiSettings, FiTruck, FiZap
} from "react-icons/fi";
import { useOrg } from "../context/OrgContext";
import { useRentriSetupStatus } from "../hooks/useRentriSetupStatus";
import { supabaseBrowser } from "../lib/supabase-browser";

export default function RifiutiDashboard() {
  const navigate = useNavigate();
  const { orgId } = useOrg();
  const [environment, setEnvironment] = useState('demo');
  const setupStatus = useRentriSetupStatus(orgId, environment);

  const [stats, setStats] = useState({
    registriAttivi: 0,
    movimentiMese: 0,
    formulariPending: 0,
    ultimaSync: null,
    // Statistiche specifiche per autodemolitori
    demolizioniCompletate: 0,
    rifiutiDaDemolizioni: 0,
    movimentiPendenti: 0,
  });
  const [limitiAlert, setLimitiAlert] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (orgId) {
      // Carica ambiente dal certificato attivo
      const loadEnvironment = async () => {
        const supabase = supabaseBrowser();
        const { data: cert } = await supabase
          .from('rentri_org_certificates')
          .select('environment')
          .eq('org_id', orgId)
          .eq('is_default', true)
          .eq('is_active', true)
          .maybeSingle();
        
        if (cert) {
          setEnvironment(cert.environment || 'demo');
        }
      };
      
      loadEnvironment();
      loadStats();
      loadLimitiAlert();
    }
  }, [orgId]);

  async function loadStats() {
    setLoading(true);
    try {
      const supabase = supabaseBrowser();

      // Carica statistiche reali
      const { data: registri } = await supabase
        .from("rentri_registri")
        .select("id")
        .eq("org_id", orgId)
        .eq("stato", "attivo");

      const { data: movimenti } = await supabase
        .from("rentri_movimenti")
        .select("id")
        .eq("org_id", orgId);

      const { data: formulari } = await supabase
        .from("rentri_formulari")
        .select("id")
        .eq("org_id", orgId);

      // Statistiche demolizioni
      const { data: demolizioni } = await supabase
        .from("demolition_cases")
        .select("id")
        .eq("org_id", orgId)
        .eq("stato", "completata");

      // Demolizioni completate senza movimento RENTRI → pronte per generare rifiuti
      const { data: demolPronte } = await supabase
        .from("demolition_cases")
        .select("id")
        .eq("org_id", orgId)
        .eq("stato", "completata")
        .is("rentri_movimento_id", null);

      const { data: movimentiPend } = await supabase
        .from("rentri_movimenti")
        .select("id")
        .eq("org_id", orgId)
        .in("sync_status", ["pending", "in_trasmissione"]);

      setStats({
        registriAttivi: registri?.length || 0,
        movimentiMese: movimenti?.length || 0,
        formulariPending: formulari?.length || 0, // ora conta tutti i FIR
        demolizioniCompletate: demolizioni?.length || 0,
        rifiutiDaDemolizioni: demolPronte?.length || 0,
        movimentiPendenti: movimentiPend?.length || 0,
      });
    } catch (error) {
      console.error("[RENTRI-DASHBOARD] Errore caricamento statistiche:", error);
    } finally {
      setLoading(false);
    }
  }

  async function loadLimitiAlert() {
    if (!orgId) return;
    // Skip se l'endpoint RENTRI non è configurato (evita 404 su fallback)
    const apiUrl = import.meta.env.VITE_RENTRI_API_URL;
    if (!apiUrl) {
      setLimitiAlert([]);
      return;
    }
    try {
      const response = await fetch(`${apiUrl}/limiti/alert?org_id=${orgId}&anno=${new Date().getFullYear()}`);
      if (!response.ok) {
        setLimitiAlert([]);
        return;
      }
      const result = await response.json();

      if (result.success && (Array.isArray(result.limiti_con_alert) || Array.isArray(result.limiti))) {
        setLimitiAlert(result.limiti_con_alert || result.limiti || []);
      } else {
        setLimitiAlert([]);
      }
    } catch {
      setLimitiAlert([]);
    }
  }

  const sb = { cls: 'bg-teal-500/10 text-teal-400', label: 'Sincronizzato' };

  if (setupStatus.loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-[#243044] rounded w-48" />
          <div className="grid grid-cols-3 gap-3">
            {[1,2,3].map(i => <div key={i} className="h-40 bg-[#1a2536] rounded-xl border border-[#243044]" />)}
          </div>
        </div>
      </div>
    );
  }

  if (!setupStatus.isConfigured) {
    return (
      <div className="space-y-4">
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-5 max-w-xl">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-amber-500/10 rounded-lg flex items-center justify-center shrink-0">
              <FiAlertCircle className="w-4 h-4 text-amber-400" />
            </div>
            <div className="flex-1">
              <h2 className="text-sm font-semibold text-amber-300 mb-1">Configurazione RENTRI Necessaria</h2>
              <p className="text-xs text-slate-400 mb-3">
                Completa la configurazione iniziale per utilizzare il modulo Rifiuti.
              </p>
              <button
                onClick={() => navigate("/rifiuti/setup")}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 transition-colors"
              >
                <FiSettings className="w-3.5 h-3.5" /> Avvia Configurazione
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const compliancePct = stats.movimentiMese > 0
    ? Math.round(((stats.movimentiMese - stats.movimentiPendenti) / stats.movimentiMese) * 100)
    : 100;

  return (
    <div className="space-y-4">
      {/* Header compatto */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-100">Rifiuti RENTRI</h1>
          <p className="text-xs text-slate-500 mt-0.5">Registri, movimenti e formulari — Autodemolitori</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium ${sb.cls}`}>{sb.label}</span>
          
          {/* Environment Badge - solo visualizzazione, cambio solo da Settings */}
          <span className={`px-2.5 py-1 rounded-md text-[10px] font-medium ${
            environment === 'demo' 
              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' 
              : 'bg-teal-500/10 text-teal-400 border border-teal-500/20'
          }`}>
            {environment === 'demo' ? '🧪 DEMO' : '🟢 PRODUZIONE'}
          </span>

          <button onClick={loadStats} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
            <FiRefreshCw className="w-3.5 h-3.5" /> Sincronizza
          </button>
        </div>
      </div>


      {/* Alert Limiti */}
      {limitiAlert && limitiAlert.length > 0 && (
        <div className="bg-[#1a2536] rounded-xl border border-amber-500/20 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-amber-500/10 rounded-lg flex items-center justify-center">
                <FiAlertCircle className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <span className="text-xs font-semibold text-amber-300">Alert Limiti Rifiuti</span>
            </div>
            <Link to="/settings" className="text-[10px] text-amber-400 hover:text-amber-300">Gestisci →</Link>
          </div>
          <div className="space-y-1.5">
            {limitiAlert.map((l) => (
              <div key={l.id} className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs ${l.superato ? 'bg-red-500/10 border border-red-500/20' : 'bg-amber-500/5 border border-amber-500/10'}`}>
                <div>
                  <span className="font-medium text-slate-300">{l.codice_eer || 'Totale'}</span>
                  <span className="text-slate-500 ml-2">{l.quantita_attuale}/{l.limite_quantita} {l.unita_misura} ({l.percentuale_utilizzo?.toFixed(0) || 0}%)</span>
                </div>
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${l.superato ? 'bg-red-500/20 text-red-300' : 'bg-amber-500/20 text-amber-300'}`}>
                  {l.superato ? 'SUPERATO' : 'ATTENZIONE'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Funzioni Principali — card grandi con conteggio integrato, riga da 3 */}
      <div className="grid grid-cols-3 gap-3">
        <Link to="/rifiuti/registri" className="bg-[#1a2536] rounded-xl border border-[#243044] hover:border-blue-500/30 p-5 transition-all group">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center group-hover:bg-blue-500/15 transition-colors">
              <FiFileText className="w-6 h-6 text-blue-400" />
            </div>
            <span className="text-2xl font-bold text-slate-100">{loading ? '—' : stats.registriAttivi}</span>
          </div>
          <p className="text-sm font-semibold text-slate-200">Registri Cronologici</p>
          <p className="text-xs text-slate-500 mt-0.5">Gestione registri carico/scarico rifiuti</p>
          <div className="mt-3 pt-3 border-t border-[#243044] flex items-center justify-between">
            <span className="text-[10px] text-slate-600">{loading ? '' : stats.registriAttivi + ' attivi'}</span>
            <span className="text-[10px] text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">Apri →</span>
          </div>
        </Link>

        <Link to="/rifiuti/movimenti" className="bg-[#1a2536] rounded-xl border border-[#243044] hover:border-blue-500/30 p-5 transition-all group">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center group-hover:bg-blue-500/15 transition-colors">
              <FiTrendingUp className="w-6 h-6 text-blue-400" />
            </div>
            <span className="text-2xl font-bold text-slate-100">{loading ? '—' : stats.movimentiMese}</span>
          </div>
          <p className="text-sm font-semibold text-slate-200">Movimenti</p>
          <p className="text-xs text-slate-500 mt-0.5">Carico e scarico rifiuti (totale)</p>
          <div className="mt-3 pt-3 border-t border-[#243044] flex items-center justify-between">
            <span className="text-[10px] text-slate-600">{loading ? '' : stats.movimentiPendenti + ' in attesa'}</span>
            <span className="text-[10px] text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">Apri →</span>
          </div>
        </Link>

        <Link to="/rifiuti/formulari" className="bg-[#1a2536] rounded-xl border border-[#243044] hover:border-amber-500/30 p-5 transition-all group">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center group-hover:bg-amber-500/15 transition-colors">
              <FiFileText className="w-6 h-6 text-amber-400" />
            </div>
            <span className="text-2xl font-bold text-slate-100">{loading ? '—' : stats.formulariPending}</span>
          </div>
          <p className="text-sm font-semibold text-slate-200">Formulari FIR</p>
          <p className="text-xs text-slate-500 mt-0.5">Identificazione e trasporto rifiuti</p>
          <div className="mt-3 pt-3 border-t border-[#243044] flex items-center justify-between">
            <span className="text-[10px] text-slate-600">{loading ? '' : stats.formulariPending + ' pending'}</span>
            <span className="text-[10px] text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity">Apri →</span>
          </div>
        </Link>
      </div>

      {/* Riga secondaria — xFIR + demolizione + MUD + compliance */}
      <div className="grid grid-cols-4 gap-3">
        <Link to="/rifiuti/xfir" className="bg-[#1a2536] rounded-xl border border-[#243044] hover:border-cyan-500/30 p-5 transition-all group">
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 bg-cyan-500/10 rounded-xl flex items-center justify-center group-hover:bg-cyan-500/15 transition-colors">
              <FiZap className="w-5 h-5 text-cyan-400" />
            </div>
          </div>
          <p className="text-sm font-semibold text-slate-200">xFIR Digitali</p>
          <p className="text-xs text-slate-500 mt-0.5">FIR digitali interoperabili</p>
        </Link>

        <Link to="/rifiuti/movimenti?from=demolizione" className="bg-[#1a2536] rounded-xl border border-[#243044] hover:border-purple-500/30 p-5 transition-all group">
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center group-hover:bg-purple-500/15 transition-colors">
              <FiTruck className="w-5 h-5 text-purple-400" />
            </div>
            <span className="text-xl font-bold text-slate-100">{loading ? '—' : stats.rifiutiDaDemolizioni}</span>
          </div>
          <p className="text-sm font-semibold text-slate-200">Da Demolizione</p>
          <p className="text-xs text-slate-500 mt-0.5">Crea rifiuti da veicoli demoliti</p>
        </Link>

        <Link to="/rifiuti/mud" className="bg-[#1a2536] rounded-xl border border-[#243044] hover:border-slate-500/30 p-5 transition-all group">
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 bg-slate-500/10 rounded-xl flex items-center justify-center group-hover:bg-slate-500/15 transition-colors">
              <FiFileText className="w-5 h-5 text-slate-400" />
            </div>
          </div>
          <p className="text-sm font-semibold text-slate-200">MUD</p>
          <p className="text-xs text-slate-500 mt-0.5">Dichiarazioni annuali rifiuti</p>
        </Link>

        <Link to="/rifiuti/report-normativo" className="bg-[#1a2536] rounded-xl border border-[#243044] hover:border-blue-500/30 p-5 transition-all group">
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center group-hover:bg-blue-500/15 transition-colors">
              <FiFileText className="w-5 h-5 text-blue-400" />
            </div>
          </div>
          <p className="text-sm font-semibold text-slate-200">Report Normativo</p>
          <p className="text-xs text-slate-500 mt-0.5">209/03 vs 152/06 per ispezioni</p>
        </Link>

        {/* Compliance + stats rapide */}
        <div className="bg-[#1a2536] rounded-xl border border-[#243044] p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs text-slate-500">Compliance RENTRI</p>
              <p className="text-2xl font-bold text-slate-100">{loading ? '—' : compliancePct + '%'}</p>
            </div>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${compliancePct >= 80 ? 'bg-teal-500/10' : 'bg-red-500/10'}`}>
              <FiShield className={`w-5 h-5 ${compliancePct >= 80 ? 'text-teal-400' : 'text-red-400'}`} />
            </div>
          </div>
          {/* Progress bar */}
          <div className="h-1.5 bg-[#141c27] rounded-full overflow-hidden mb-3">
            <div
              className={`h-full rounded-full transition-all duration-500 ${compliancePct >= 80 ? 'bg-teal-500' : compliancePct >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
              style={{ width: `${compliancePct}%` }}
            />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Demolizioni</span>
              <span className="text-slate-300 font-medium">{loading ? '—' : stats.demolizioniCompletate}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">In attesa</span>
              <span className={`font-medium ${stats.movimentiPendenti > 0 ? 'text-amber-400' : 'text-slate-300'}`}>{loading ? '—' : stats.movimentiPendenti}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Banner ambiente: solo in demo */}
      {environment !== 'prod' && (
        <div className="bg-amber-500/5 border border-amber-500/15 rounded-lg px-4 py-2.5 flex items-center gap-2">
          <FiAlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <p className="text-[11px] text-slate-400">
            <span className="text-amber-300 font-medium">Ambiente TEST</span> — I dati trasmessi non hanno valore legale. Per operatività reale passa a PRODUZIONE nelle Impostazioni.
          </p>
        </div>
      )}
    </div>
  );
}
