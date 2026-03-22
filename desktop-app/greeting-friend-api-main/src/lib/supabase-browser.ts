// src/lib/supabase-browser.ts
import { createClient, SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | null = null;

// --- DIAGNOSTICA ENV ---------------------------------------------------------
function redact(s?: string) {
  if (!s) return "(vuoto)";
  if (s.length <= 8) return "***";
  return s.slice(0, 6) + "…" + s.slice(-4);
}

function checkEnv() {
  const url = import.meta.env?.VITE_SUPABASE_URL as string | undefined;
  const anon = import.meta.env?.VITE_SUPABASE_ANON_KEY as string | undefined;

  const ok = !!url && !!anon;
  if (!ok) {
    console.error(
      "[supabase] ENV mancanti. VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY non sono disponibili nel renderer.",
    );
    console.info("[supabase] VITE_SUPABASE_URL:", url || "(manca)");
    console.info("[supabase] VITE_SUPABASE_ANON_KEY:", anon ? redact(anon) : "(manca)");
  } else {
    // Log non sensibile, utile per Electron/file://
    try {
      const host = new URL(url!).host;
      console.log(`[supabase] URL ok → ${host}, ANON len=${anon!.length}`);
    } catch {
      console.warn("[supabase] URL non valido:", url);
    }
  }
  return { ok, url, anon };
}

const env = checkEnv();
export const isSupabaseReady = env.ok;

// --- CLIENT ------------------------------------------------------------------
export function supabaseBrowser(): SupabaseClient {
  if (browserClient) return browserClient;

  // Se le env mancano, creiamo comunque un client “invalido” per evitare crash.
  // Le chiamate falliranno, ma possiamo intercettare prima in UI usando isSupabaseReady.
  const url = env.url ?? "";
  const anon = env.anon ?? "";

  browserClient = createClient(url, anon, {
    auth: {
      persistSession: true,
      detectSessionInUrl: true,
      storage: typeof window !== "undefined" ? window.localStorage : undefined,
      storageKey: "rm-auth",
      autoRefreshToken: true,
    },
  });

  return browserClient;
}

// Comodità: istanza pronta all'uso (se le env mancano, non lanciamo eccezioni)
export const supabase: SupabaseClient = supabaseBrowser();