// src/components/RequireAuth.jsx
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabaseBrowser, isSupabaseReady } from "@/lib/supabase-browser";
import { OAuthService } from "@/lib/oauth";
import { useOrg } from "@/context/OrgContext";
import { FiLoader } from "react-icons/fi";

function EnvironmentScreen({ title, message, hint }) {
  return (
    <div className="min-h-screen bg-[#0f1419] text-white flex items-center justify-center px-6">
      <div className="w-full max-w-lg">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/10 backdrop-blur-xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.6)]">
          <div className="absolute inset-0 bg-blue-500/5" />
          <div className="relative p-8 space-y-6">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.35em] text-indigo-200/80">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              RescueManager
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold text-white drop-shadow-sm">{title}</h2>
              <p className="text-sm text-indigo-100 leading-relaxed">{message}</p>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-full border-2 border-white/30 border-t-transparent animate-spin">
                <FiLoader className="text-indigo-100" />
              </div>
              <div className="text-xs text-indigo-100/90">
                {hint || "Stiamo completando le ultime verifiche. Operazione in corso..."}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Legge la sessione persistita da Supabase nel localStorage
function readStoredSession() {
  try {
    const raw = localStorage.getItem("rm-auth");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const s = parsed?.currentSession ?? parsed ?? null;
    const token = s?.access_token;
    const exp = s?.expires_at; // epoch seconds
    if (!token) return null;
    if (typeof exp === "number") {
      const now = Math.floor(Date.now() / 1000);
      if (exp < now - 60) return null;
    }
    return s;
  } catch {
    return null;
  }
}

export default function RequireAuth({ children }) {
  // null = sconosciuto, true = autenticato, false = non autenticato
  const [authed, setAuthed] = useState(null);
  // diventa true quando abbiamo ricevuto INITIAL_SESSION o è scaduto il safety timeout
  const [booted, setBooted] = useState(false);
  // Aggiungi stato per aspettare che le organizzazioni siano caricate
  const [orgsReady, setOrgsReady] = useState(false);

  const unsubRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Ottieni stato organizzazioni
  const { loading: orgLoading, userId } = useOrg();

  // Controlla autenticazione OAuth
  const checkOAuthAuth = () => {
    const isOAuthAuth = OAuthService.isAuthenticated();
    if (isOAuthAuth) {
      setAuthed(true);
      setBooted(true);
      return true;
    }
    return false;
  };

  useEffect(() => {
    if (checkOAuthAuth()) return;

    setAuthed(false);

    if (!isSupabaseReady) {
      setBooted(true);
      return;
    }

    const supabase = supabaseBrowser();

    const local = readStoredSession();
    if (local) {
      setAuthed(true);
    } else {
      setAuthed(false);
    }

    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (data?.session?.user) {
          setAuthed(true);
        } else {
          setAuthed(false);
        }
      } catch (e) {
        console.warn("[RequireAuth] getSession error (ignored)", e?.message || e);
      }
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (["SIGNED_IN", "TOKEN_REFRESHED"].includes(event)) {
        setAuthed(!!session?.user);
      }
      if (event === "SIGNED_OUT") {
        setAuthed(false);
        setBooted(true);
      }
      if (event === "INITIAL_SESSION") {
        setAuthed(!!session?.user);
        setBooted(true);
      }
    });
    unsubRef.current = sub?.subscription;

    // 4) safety: se non arriva INITIAL_SESSION entro 2s, consideriamo boot completato
    const safety = setTimeout(() => setBooted(true), 2000);

    return () => {
      clearTimeout(safety);
      try { unsubRef.current?.unsubscribe?.(); } catch {}
    };
  }, []);

  useEffect(() => {
    const oauthInterval = setInterval(() => {
      if (!authed) {
        if (checkOAuthAuth()) return;
      }
    }, 2000);

    return () => clearInterval(oauthInterval);
  }, [authed]);

  // Aspetta che le organizzazioni siano caricate dopo il login
  useEffect(() => {
    if (authed) {
      if (orgLoading) {
        setOrgsReady(false);
      } else {
        // Loading completato
        setOrgsReady(true);
        
        // Se loading completato ma userId è null, sessione scaduta
        // Forza logout e redirect a login
        if (!userId) {
          console.warn("[RequireAuth] Session expired - no userId after org loading");
          setAuthed(false);
        }
      }
    }
  }, [authed, orgLoading, userId]);

  // Safety: se resta bloccato su "Preparazione ambiente" per più di 12s, forza logout
  useEffect(() => {
    if (!authed) return;
    
    // Avvia timer solo se siamo in stato di loading
    if (orgLoading || !orgsReady) {
      const safetyTimer = setTimeout(() => {
        console.error("[RequireAuth] Stuck on environment preparation for 12s, forcing logout");
        setAuthed(false);
      }, 12000);
      
      return () => clearTimeout(safetyTimer);
    }
  }, [authed, orgLoading, orgsReady]);

  // Redirect solo quando sappiamo di essere "booted"
  useEffect(() => {
    if (!booted) {
      return;
    }
    
    if (authed === true) {
      return;
    }
    
    if (authed === false && !location.pathname.startsWith("/login")) {
      const here = `${location.pathname}${location.search || ""}`;
      navigate(`/login?redirect=${encodeURIComponent(here)}`, { replace: true });
    }
  }, [authed, booted, location, navigate]);

  if (!booted) {
    return (
      <EnvironmentScreen
        title="Preparazione sessione"
        message="Stiamo verificando la tua sessione corrente e sincronizzando i dati di accesso."
        hint="Questo richiederà solo qualche secondo."
      />
    );
  }
  
  if (authed) {
    if (orgLoading || !orgsReady) {
      return (
        <EnvironmentScreen
          title="Preparazione ambiente"
          message="Stiamo caricando la tua organizzazione, le preferenze utente e i dati operativi."
          hint="Puoi chiudere questa finestra solo quando la configurazione è completata."
        />
      );
    }
    
    return <>{children}</>;
  }
  
  return (
    <EnvironmentScreen
      title="Sessione non valida"
      message="Non abbiamo trovato una sessione attiva. Tra pochi istanti verrai reindirizzato alla schermata di accesso."
      hint="Se il problema persiste, effettua di nuovo l'accesso."
    />
  );
}