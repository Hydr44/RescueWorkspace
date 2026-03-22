// src/hooks/useFeatureFlags.js
/**
 * Hook per caricare i feature flags globali dalla piattaforma.
 * I feature flags sono un kill switch globale che si applica a TUTTE le organizzazioni.
 * Diverso dai moduli per-org (useOrgModules) che si applicano solo alla singola org.
 * 
 * Legge da Supabase system_settings (key='feature_flags') — la stessa tabella
 * in cui l'admin panel salva i flags globali.
 * 
 * Flags disponibili:
 *   - rvfu_enabled: Integrazione RVFU (MIT)
 *   - sdi_enabled: Fatturazione SDI
 *   - rentri_enabled: Tracciamento rifiuti RENTRI
 *   - ricambi_enabled: Modulo ricambi
 *   - piazzale_enabled: Modulo piazzale
 *   - ai_validation: Validazione AI documenti
 *   - email_notifications: Notifiche email
 *   - push_notifications: Notifiche push
 *   - two_factor_auth: 2FA obbligatorio
 *   - registration_open: Registrazione aperta
 */
import { useState, useEffect, useCallback, useMemo } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";

// Defaults (fail-open: tutto attivo tranne quelli non ancora rilasciati)
const DEFAULT_FLAGS = {
  veicoli_enabled: true,
  clienti_enabled: true,
  trasporti_enabled: true,
  rentri_enabled: true,
  sdi_enabled: true,
  rvfu_enabled: false,
  ricambi_enabled: true,
  piazzale_enabled: true,
  contabilita_enabled: true,
  ai_validation: true,
  email_notifications: true,
  push_notifications: false,
  two_factor_auth: false,
  registration_open: true,
};

// Polling interval: 5 minuti
const POLL_INTERVAL = 300_000;

// Cache globale (condivisa tra hook instances)
let cachedFlags = null;
let lastFetchTime = 0;
const CACHE_TTL = 30_000; // 30 secondi di cache

export function useFeatureFlags() {
  const supabase = supabaseBrowser();
  const [flags, setFlags] = useState(cachedFlags || DEFAULT_FLAGS);
  const [loading, setLoading] = useState(!cachedFlags);
  const [error, setError] = useState(null);

  const fetchFlags = useCallback(async () => {
    // Se la cache è ancora valida, non rifetchare
    if (cachedFlags && Date.now() - lastFetchTime < CACHE_TTL) {
      setFlags(cachedFlags);
      setLoading(false);
      return;
    }

    try {
      const { data, error: fetchError } = await supabase
        .from("system_settings")
        .select("value")
        .eq("key", "feature_flags")
        .maybeSingle();

      if (fetchError) {
        console.warn("[useFeatureFlags] Supabase error:", fetchError.message, "(using defaults)");
        setError(fetchError.message);
        return;
      }

      // data.value è un oggetto { flag_id: boolean } salvato dall'admin panel
      const savedFlags = data?.value || {};
      
      // Merge: default + saved (saved sovrascrivono i default)
      const mergedFlags = { ...DEFAULT_FLAGS, ...savedFlags };

      // Aggiorna cache globale
      cachedFlags = mergedFlags;
      lastFetchTime = Date.now();

      setFlags(mergedFlags);
      setError(null);
      console.log("[useFeatureFlags] Flags loaded from system_settings");
    } catch (err) {
      console.warn("[useFeatureFlags] Error:", err.message, "(using cache/defaults)");
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  // Fetch iniziale + polling
  useEffect(() => {
    fetchFlags();

    const interval = setInterval(fetchFlags, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchFlags]);

  /**
   * Verifica se un feature flag è attivo
   * Se non presente, ritorna true (fail-open)
   */
  const isFlagEnabled = useCallback(
    (flagName) => {
      if (flags[flagName] !== undefined) {
        return flags[flagName];
      }
      // Flag sconosciuto → default a true (fail-open)
      return true;
    },
    [flags]
  );

  /**
   * Oggetto con i flags di integrazione per accesso rapido
   * (quelli più utili per condizionare la UI)
   */
  const integrationFlags = useMemo(
    () => ({
      rvfu: flags.rvfu_enabled ?? false,
      sdi: flags.sdi_enabled ?? true,
      rentri: flags.rentri_enabled ?? true,
      ricambi: flags.ricambi_enabled ?? true,
      piazzale: flags.piazzale_enabled ?? true,
      contabilita: flags.contabilita_enabled ?? true,
    }),
    [flags]
  );

  return {
    flags,
    loading,
    error,
    isFlagEnabled,
    integrationFlags,
    refresh: fetchFlags,
  };
}
