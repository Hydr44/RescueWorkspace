// src/lib/auth-snapshot.ts
// Lettura affidabile della sessione in Electron (file://) senza network.

export type AuthSnapshot = {
    session: any | null;
    user: { id: string; email?: string } | null;
    accessToken: string | null;
  };
  
  function readStoredSessionRaw(): any | null {
    try {
      const raw = localStorage.getItem("rm-auth");
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed?.currentSession ?? parsed ?? null;
    } catch {
      return null;
    }
  }
  
  export function getAuthSnapshot(): AuthSnapshot {
    const s = readStoredSessionRaw();
    const accessToken = s?.access_token ?? null;
    const user = s?.user
      ? { id: s.user.id, email: s.user.email }
      : null;
    return { session: s ?? null, user, accessToken };
  }
  
  /**
   * Aspetta che arrivi una sessione valida (via localStorage o onAuthStateChange).
   * Utile se devi garantire l'utente prima di fare una fetch.
   */
  export function waitForAuthReady(timeoutMs = 3000): Promise<AuthSnapshot> {
    return new Promise((resolve, reject) => {
      // 1) tentativo immediato
      const snap = getAuthSnapshot();
      if (snap.user && snap.accessToken) return resolve(snap);
  
      // 2) ascolto cambi auth
      const { supabaseBrowser } = require("@/lib/supabase-browser");
      const supabase = supabaseBrowser();
  
      const { data: sub } = supabase.auth.onAuthStateChange((_ev: any, session: any) => {
        const s = session ?? getAuthSnapshot().session;
        const out: AuthSnapshot = {
          session: s ?? null,
          user: s?.user ? { id: s.user.id, email: s.user.email } : null,
          accessToken: s?.access_token ?? null,
        };
        if (out.user && out.accessToken) {
          try { sub?.subscription?.unsubscribe?.(); } catch {}
          resolve(out);
        }
      });
  
      // 3) timeout
      const t = setTimeout(() => {
        try { sub?.subscription?.unsubscribe?.(); } catch {}
        resolve(getAuthSnapshot()); // restituiamo comunque lo snapshot (anche se nullo)
      }, timeoutMs);
  
      // cleanup opzionale se qualcuno cancella la promise
      // (qui non serve un abort controller)
    });
  }