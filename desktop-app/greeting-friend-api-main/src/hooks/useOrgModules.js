// src/hooks/useOrgModules.js
/**
 * Hook per caricare i moduli attivi dell'organizzazione corrente.
 * Legge dalla tabella org_modules e restituisce un oggetto con i moduli attivi.
 * 
 * Moduli disponibili: base, rvfu, sdi, rentri
 */
import { useState, useEffect, useCallback, useMemo } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { useOrg } from "@/context/OrgContext";

export function useOrgModules() {
  const supabase = supabaseBrowser();
  const { orgId } = useOrg();

  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orgId) {
      setModules([]);
      setLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("org_modules")
          .select("module, status")
          .eq("org_id", orgId)
          .eq("status", "active");

        if (!cancelled) {
          if (error) {
            // Tabella potrebbe non esistere ancora — fallback: tutti attivi
            console.warn("[useOrgModules] Error loading modules, defaulting all active:", error.message);
            setModules(["base", "rvfu", "sdi", "rentri"]);
          } else {
            setModules((data || []).map(m => m.module));
          }
        }
      } catch (err) {
        if (!cancelled) {
          console.warn("[useOrgModules] Exception, defaulting all active:", err.message);
          setModules(["base", "rvfu", "sdi", "rentri"]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [orgId, supabase]);

  const activeModules = useMemo(() => ({
    base: modules.includes("base"),
    rvfu: modules.includes("rvfu"),
    sdi: modules.includes("sdi"),
    rentri: modules.includes("rentri"),
  }), [modules]);

  const isModuleActive = useCallback((mod) => {
    return modules.includes(mod);
  }, [modules]);

  return { activeModules, isModuleActive, loading, modules };
}
