// src/hooks/useDemo.js
// Hook per rilevare se l'organizzazione corrente è in modalità demo.
// Legge il flag is_demo dalla tabella orgs.
// Espone isDemo (boolean) e demoBlock (wrapper per bloccare azioni pericolose).
import { useState, useEffect, useCallback } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { useOrg } from "@/context/OrgContext";

export function useDemo() {
  const supabase = supabaseBrowser();
  const { orgId } = useOrg();

  const [isDemo, setIsDemo] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orgId) {
      setIsDemo(false);
      setLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("orgs")
          .select("is_demo")
          .eq("id", orgId)
          .maybeSingle();

        if (!cancelled) {
          if (error) {
            console.warn("[useDemo] Error checking demo flag:", error.message);
            setIsDemo(false);
          } else {
            setIsDemo(data?.is_demo === true);
          }
        }
      } catch (err) {
        if (!cancelled) {
          console.warn("[useDemo] Exception:", err.message);
          setIsDemo(false);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [orgId, supabase]);

  /**
   * Wrapper per bloccare un'azione in modalità demo.
   * Se isDemo, mostra un alert e non esegue la callback.
   * Se non è demo, esegue normalmente.
   * 
   * @param {Function} action - Azione da eseguire
   * @param {string} [message] - Messaggio personalizzato
   * @returns {Function} - Funzione wrappata
   */
  const demoBlock = useCallback((action, message) => {
    return (...args) => {
      if (isDemo) {
        const msg = message || "Questa funzione non è disponibile in modalità demo.";
        alert(` Modalità Demo\n\n${msg}`);
        return;
      }
      return action(...args);
    };
  }, [isDemo]);

  return { isDemo, loading, demoBlock };
}
