/**
 * Login Page
 * Pagina di autenticazione OAuth con design moderno e feedback visivo
 * 
 * @author haxies
 * @created 2025
 */

import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabaseBrowser, isSupabaseReady } from "@/lib/supabase-browser";
import { OAuthService } from "@/lib/oauth";
import { SecurityService } from "@/lib/security";
import logoUrl from "@/logos/logo-principale-a-colori.svg";
import PropTypes from "prop-types";

import { FiLink, FiSearch, FiShield, FiCheckCircle, FiExternalLink, FiMonitor } from 'react-icons/fi';

function OAuthProgress({ step }) {
  const steps = [
    { label: "Connessione", icon: FiLink },
    { label: "Verifica", icon: FiSearch },
    { label: "Autorizzazione", icon: FiShield },
    { label: "Completato", icon: FiCheckCircle }
  ];

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>Passo {step + 1} di {steps.length}</span>
        <span className="text-blue-400 font-medium">
          {Math.round(((step + 1) / steps.length) * 100)}%
        </span>
      </div>
      <div className="w-full bg-[#243044] rounded-full h-1.5 overflow-hidden">
        <div 
          className="bg-blue-500 h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: `${((step + 1) / steps.length) * 100}%` }}
        />
      </div>
      <div className="flex items-center justify-between mt-1">
        {steps.map((s, idx) => (
          <div key={idx} className="flex flex-col items-center">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm transition-colors ${
              idx <= step ? 'bg-blue-600 text-white' : 'bg-[#243044] text-slate-500'
            }`}>
              {idx === step && idx < steps.length - 1 ? (
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <s.icon className="w-3.5 h-3.5" />
              )}
            </div>
            <span className={`text-[10px] mt-1 ${idx <= step ? 'text-blue-400' : 'text-slate-500'}`}>
              {s.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

OAuthProgress.propTypes = {
  step: PropTypes.number.isRequired
};

function Spinner({ text = "Accesso in corso…" }) {
  return (
    <div className="flex items-center justify-center gap-3">
      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      <span className="text-sm font-medium">{text}</span>
    </div>
  );
}

Spinner.propTypes = {
  text: PropTypes.string
};

export default function Login() {
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthStep, setOauthStep] = useState(-1); // -1 = non attivo, 0-3 = step attivi
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const unsubRef = useRef(null);
  const stepIntervalRef = useRef(null);
  

  const redirectTo = (() => {
    const p = params.get("redirect");
    if (p && typeof p === "string" && p.startsWith("/")) return p;
    const last = localStorage.getItem("rm-last-route");
    if (last && last.startsWith("/login") === false) return last;
    return "/";
  })();

  useEffect(() => {
    const r = params.get("reason");
    if (r === "logout") setInfo("Sei uscito dall'account.");
    if (r === "expired") setInfo("Sessione scaduta. Effettua di nuovo l'accesso.");
  }, [params]);

  useEffect(() => {
    // Se OAuth è autenticato, vai direttamente alla dashboard
    if (OAuthService.isAuthenticated()) {
      console.log('[Login] OAuth authenticated on mount, navigating to dashboard');
      navigate(redirectTo, { replace: true });
      return;
    }

    if (!isSupabaseReady) return;
    const supabase = supabaseBrowser();
    let mounted = true;

    (async () => {
      // Prima controlla OAuth
      const { OAuthService } = await import("@/lib/oauth");
      if (OAuthService.isAuthenticated()) {
        console.log('[Login] OAuth authenticated (async), navigating to dashboard');
        if (mounted) navigate(redirectTo, { replace: true });
        return;
      }
      
      // Fallback a Supabase
      const { data } = await supabase.auth.getUser();
      if (mounted && data?.user) {
        console.log('[Login] Supabase user found, navigating to dashboard');
        navigate(redirectTo, { replace: true });
      }
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        console.log('[Login] SIGNED_IN event, navigating to dashboard');
        navigate(redirectTo, { replace: true });
      }
    });
    unsubRef.current = sub?.subscription;

    return () => {
      mounted = false;
      try { unsubRef.current?.unsubscribe?.(); } catch {}
    };
  }, [navigate, redirectTo]);

  useEffect(() => {
    // Flag globale per prevenire elaborazioni multiple del callback
    const callbackProcessedKey = 'oauth_callback_processed';
    const isProcessingRef = { current: false };
    
    const handleOAuthCallback = async (url) => {
      console.log('[Login] handleOAuthCallback called with URL:', url);
      
      if (!url || (!url.includes('desktop://auth/callback') && !url.includes('localhost:3001/auth/callback') && !url.includes('127.0.0.1:3001/auth/callback'))) {
        console.log('[Login] URL does not match callback pattern, ignoring');
        return;
      }
      
      // Verifica se il callback è già stato processato (per prevenire elaborazioni multiple al riavvio)
      const alreadyProcessed = sessionStorage.getItem(callbackProcessedKey);
      if (alreadyProcessed === url) {
        return; // Già processato
      }
      
      if (isProcessingRef.current) {
        return;
      }
      
      const savedState = localStorage.getItem('oauth_state');
      if (!savedState) {
        // Se non c'è state ma c'è già un token OAuth valido, probabilmente è un riavvio
        // Non processare il callback
        return;
      }
      
      isProcessingRef.current = true;
      sessionStorage.setItem(callbackProcessedKey, url); // Marca come processato
      setLoading(true);
      setErr("");
      setInfo("");
      setOauthStep(2); // Autorizzazione
      
      try {
        setInfo("Elaborazione in corso...");
        
        // Timeout di 30 secondi per il callback OAuth
        const timeoutId = setTimeout(() => {
          if (isProcessingRef.current) {
            console.error('[Login] OAuth callback timeout - callback non ricevuto entro 30 secondi');
            setErr("Timeout: il callback OAuth non è stato ricevuto. Verifica che il server locale sia raggiungibile e riprova.");
            setOauthStep(-1);
            setLoading(false);
            isProcessingRef.current = false;
          }
        }, 30000);
        
        const tokens = await OAuthService.handleOAuthCallback(url);
        clearTimeout(timeoutId);
        
        if (tokens) {
          console.log('[Login] OAuth tokens received, proceeding with authentication');
          setOauthStep(3); // Successo
          setInfo("Autenticazione completata. Preparazione ambiente...");
          
          const isAuth = OAuthService.isAuthenticated();
          console.log('[Login] OAuth authenticated:', isAuth);
          
          if (isAuth) {
            setLoading(false);
            setOauthStep(-1); // Reset OAuth step
            
            console.log('[Login] OAuth authenticated, navigating to dashboard');
            setInfo("Accesso completato. Reindirizzamento...");
            setTimeout(() => {
              navigate(redirectTo, { replace: true });
            }, 1000);
          } else {
            setErr("Errore: autenticazione OAuth non completata correttamente. Ricarica la pagina e riprova.");
            setOauthStep(-1);
            setLoading(false);
          }
        } else {
          setErr("Errore durante l'autenticazione OAuth. Il server non ha risposto correttamente.");
          setOauthStep(-1);
          setLoading(false);
        }
        } catch (error) {
          console.error('[Login] OAuth callback error:', error);
          clearTimeout(timeoutId);
        
        if (error.message?.includes('State non trovato')) {
          setErr("Callback già elaborato. Riprova il login.");
        } else if (error.message?.includes('State non corrispondente')) {
          setErr("Errore di sicurezza. Riprova il login.");
        } else if (error.message?.includes('Invalid or expired')) {
          setErr("Codice scaduto. Riprova il login.");
        } else if (error.message?.includes('Timeout')) {
          setErr(error.message);
        } else {
          setErr(error.message || "Errore durante l'autenticazione OAuth. Verifica la connessione e riprova.");
        }
        setOauthStep(-1);
        setLoading(false);
      } finally {
        // NON chiamare setLoading(false) qui - mantieni il loading attivo finché non avviene la navigazione
        // Solo se c'è stato un errore, il loading è già stato fermato sopra
        isProcessingRef.current = false;
      }
    };

    if (typeof window !== 'undefined' && window.api) {
      console.log('[Login] Registering OAuth callback handler...');
      window.api.onOAuthCallback(handleOAuthCallback);
      console.log('[Login] OAuth callback handler registered');
    } else {
      console.error('[Login] window.api not available, cannot register OAuth callback handler');
    }
  }, [navigate, redirectTo]);

  async function startOAuthLogin() {
    setErr("");
    setLoading(true);
    setOauthStep(0); // Inizio connessione
    
    // Reset rate limiter per evitare blocchi durante sviluppo
    SecurityService.resetRateLimit('oauth', 'oauth-flow');
    
    try {
      console.log('[Login] Starting OAuth login...');
      await OAuthService.startOAuthFlow();
      console.log('[Login] OAuth flow started successfully');
      setInfo("Browser aperto. Accedi con le tue credenziali...");
      setOauthStep(1); // Verifica
      
      // Auto-avanzamento step ogni 3 secondi
      stepIntervalRef.current = setInterval(() => {
        setOauthStep(prev => {
          if (prev < 2) return prev + 1;
          return prev;
        });
      }, 3000);
      
    } catch (error) {
      console.error('OAuth error:', error);
      setErr("Errore durante l'avvio dell'autenticazione OAuth.");
      setOauthStep(-1);
      setLoading(false);
    }
  }

  // Cleanup interval
  useEffect(() => {
    return () => {
      if (stepIntervalRef.current) {
        clearInterval(stepIntervalRef.current);
      }
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#141c27]">
      <div className="flex-1 flex min-h-0">
        {/* Sidebar branding */}
        <div className="hidden md:flex w-[320px] shrink-0 flex-col bg-[#0c1929] border-r border-[#243044]">
          <div className="flex-1 flex flex-col justify-center px-8">
            <div className="mb-6">
              <img src={logoUrl} alt="RescueManager" className="h-16 w-auto" />
              <span className="inline-block mt-2 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-amber-500/15 text-amber-400 border border-amber-500/25 leading-none">Beta</span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed mb-8">
              Gestionale per autodemolizioni e soccorso stradale
            </p>

            <div className="space-y-3">
              {[
                { icon: FiCheckCircle, text: "Soccorso stradale" },
                { icon: FiCheckCircle, text: "Radiazioni RVFU" },
                { icon: FiCheckCircle, text: "Fatturazione SDI" },
                { icon: FiCheckCircle, text: "Registro RENTRI" },
              ].map((item) => (
                <div key={item.text} className="flex items-center gap-3 text-slate-400">
                  <item.icon className="w-4 h-4 text-blue-500 shrink-0" />
                  <span className="text-sm">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main area */}
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="w-full max-w-sm space-y-4">
            {/* Mobile logo (hidden on desktop where sidebar shows) */}
            <div className="md:hidden flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center p-1 shrink-0">
                <img src={logoUrl} alt="RescueManager" className="w-full h-full object-contain" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-extrabold text-white tracking-tight">RESCUE<span className="text-blue-500">MANAGER</span></h1>
                  <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded bg-amber-500/15 text-amber-400 border border-amber-500/25 leading-none">Beta</span>
                </div>
                <p className="text-xs text-slate-500">Autodemolizioni & Soccorso</p>
              </div>
            </div>

            {/* Login card */}
            <div className="rounded-xl bg-[#1a2536] border border-[#243044] p-5">
            {/* Header */}
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-slate-100 mb-1">
                Accedi
              </h2>
              <p className="text-sm text-slate-400">
                Entra nel tuo account per continuare
              </p>
            </div>

            {/* Progress OAuth */}
            {oauthStep >= 0 && loading && (
              <div className="mb-5">
                <OAuthProgress step={oauthStep} />
              </div>
            )}

            {info && (
              <div className="mb-4 rounded-lg bg-blue-500/10 text-blue-400 px-3.5 py-2.5 text-sm flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse shrink-0" />
                {info}
              </div>
            )}

            {!isSupabaseReady && (
              <div className="mb-4 rounded-lg bg-amber-500/10 text-amber-400 px-3.5 py-2.5 text-sm flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                Supabase non configurato. Imposta le variabili d'ambiente e riavvia.
              </div>
            )}

            {/* OAuth Form */}
              <div className="space-y-4">
                {err && (
                  <div className="rounded-lg bg-red-500/10 text-red-400 px-3.5 py-2.5 text-sm flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                    {err}
                  </div>
                )}

                <button
                  onClick={startOAuthLogin}
                  disabled={loading || !isSupabaseReady}
                  className="w-full rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 font-medium transition-colors"
                >
                  {loading ? (
                    <Spinner text={oauthStep === 3 ? "Preparazione ambiente..." : "In attesa..."} />
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <FiShield className="w-4 h-4" />
                      Accedi con il browser
                    </span>
                  )}
                </button>

                <p className="text-center text-xs text-slate-500">
                  Si aprirà il browser per l'autenticazione sicura
                </p>
              </div>
            </div>{/* end login card */}

            {/* Mini-guida: Come funziona */}
            {!loading && (
              <div className="rounded-lg border border-[#243044] px-4 py-3">
                <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-3">Come funziona</p>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { icon: FiShield, step: "1", text: "Clicca \"Accedi\"" },
                    { icon: FiExternalLink, step: "2", text: "Accedi nel popup" },
                    { icon: FiMonitor, step: "3", text: "Torna all'app" },
                  ].map((s) => (
                    <div key={s.step} className="flex flex-col items-center text-center gap-1.5">
                      <div className="w-7 h-7 rounded-md bg-[#1a2536] flex items-center justify-center">
                        <s.icon className="w-3.5 h-3.5 text-blue-500" />
                      </div>
                      <span className="text-[10px] text-slate-500">{s.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom bar — unica, full width */}
      <div className="px-6 py-3 border-t border-[#243044] flex items-center justify-between">
        <span className="text-[10px] text-slate-600">© {new Date().getFullYear()} RescueManager</span>
        <span className="px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider rounded bg-amber-500/15 text-amber-400 border border-amber-500/25 leading-none">Beta</span>
        <a href="https://rescuemanager.eu/contatti" target="_blank" rel="noopener noreferrer" className="text-[10px] text-slate-600 hover:text-slate-400 transition-colors">
          Supporto
        </a>
      </div>
    </div>
  );
}
