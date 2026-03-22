// src/lib/auth.ts
import { supabaseBrowser } from "./supabase-browser";

/**
 * Logout robusto per Electron (file://) e Web.
 * - NON aspetta indefinitamente signOut (max 800ms), così il click "Esci" è sempre efficace.
 * - Pulisce la cache locale del token (storageKey: rm-auth) e l'ultimo percorso.
 * - In contesti HashRouter (Electron/file://) forza hash + reload per stato pulito.
 */
export async function signOutAndGo(to: string = "/login?reason=logout") {
  const supabase = supabaseBrowser();

  // Logout OAuth se presente
  try {
    const { OAuthService } = await import("./oauth");
    if (OAuthService.isAuthenticated()) {
      await OAuthService.logout();
    }
  } catch (e) {
    console.warn("[signOutAndGo] OAuth logout error:", (e as any)?.message || e);
  }

  // Avvia signOut ma non restare bloccato se la promise non risponde.
  try {
    await Promise.race([
      supabase.auth.signOut(),
      new Promise((resolve) => setTimeout(resolve, 800)), // fail-safe
    ]);
  } catch (e) {
    console.warn("[signOutAndGo] signOut error:", (e as any)?.message || e);
  }

  // Pulisci sempre cache locali
  try {
    localStorage.removeItem("rm-auth");       // sessione persistita del client
    localStorage.removeItem("rm-oauth-tokens"); // token OAuth
    localStorage.removeItem("oauth_state");   // state OAuth
    localStorage.removeItem("rm-last-route"); // ultimo percorso
    localStorage.removeItem("operator_session"); // sessione operatore
    localStorage.removeItem("operator_id");   // ID operatore
    localStorage.removeItem("operator_name"); // nome operatore
    sessionStorage.clear(); // Pulisci sessionStorage
  } catch {}

  const isElectron = typeof window !== "undefined" && !!(window as any).api;
  const isFileProto =
    typeof window !== "undefined" && window.location?.protocol === "file:";

  // In HashRouter/Electron usa l'hash e ricarica per evitare stati zombie
  if (isElectron || isFileProto) {
    try {
      const hash = to.startsWith("#") ? to : "#" + to.replace(/^#/, "");
      window.location.hash = hash;
      window.location.reload();
      return;
    } catch {}
  }

  // In web classico
  window.location.replace(to);
}