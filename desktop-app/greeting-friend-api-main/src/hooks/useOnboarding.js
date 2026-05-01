/**
 * useOnboarding — Hook per calcolare stato di completamento configurazione
 * Controlla: dati org, certificati RENTRI, configurazione SDI, veicoli RVFU, ecc.
 * Adatta gli step ai moduli attivi nell'abbonamento
 */
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { useOrg } from "@/context/OrgContext";
import { useSubscription } from "@/hooks/useSubscription";

const LS_KEY = "rm-onboarding-progress";
const CACHE_TTL = 5 * 60 * 1000; // 5 minuti

const GROUP_META = {
  company: { label: "Dati Aziendali", icon: "FiSettings", route: "/settings?tab=organization" },
  team: { label: "Team", icon: "FiUsers", route: "/settings?tab=team" },
  rvfu: { label: "Demolizioni RVFU", icon: "FiTruck", route: "/demolizioni" },
  sdi: { label: "Fatturazione SDI", icon: "FiFileText", route: "/settings?tab=sdi" },
  rentri: { label: "Rifiuti RENTRI", icon: "FiDatabase", route: "/settings?tab=rifiuti" },
};

export function useOnboarding() {
  const supabase = supabaseBrowser();
  const { orgId } = useOrg();
  const { activeModules, loading: subLoading } = useSubscription();
  const loadedRef = useRef(false);

  // Step filtrati per abbonamento attivo
  const steps = useMemo(() => {
    if (subLoading) return [];
    return [
      // Dati Aziendali (sempre richiesti)
      { id: "org_name", group: "company", label: "Nome organizzazione" },
      { id: "org_address", group: "company", label: "Indirizzo sede" },
      { id: "org_piva", group: "company", label: "Partita IVA / Codice Fiscale" },
      // Team (sempre)
      { id: "team_member", group: "team", label: "Almeno un membro del team" },
      // RVFU (solo se attivo)
      ...(activeModules.rvfu ? [
        { id: "rvfu_auth", group: "rvfu", label: "Credenziali RVFU configurate" },
      ] : []),
      // SDI (solo se attivo)
      ...(activeModules.sdi ? [
        { id: "sdi_credentials", group: "sdi", label: "Credenziali SDI configurate" },
      ] : []),
      // RENTRI (solo se attivo)
      ...(activeModules.rentri ? [
        { id: "rentri_cert", group: "rentri", label: "Certificato RENTRI caricato" },
        { id: "rentri_device", group: "rentri", label: "Dispositivo firma configurato" },
      ] : []),
    ];
  }, [activeModules, subLoading]);

  // Inizializza checks da localStorage (cache rapida)
  const [checks, setChecks] = useState(() => {
    try {
      const stored = localStorage.getItem(LS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.orgId === orgId && parsed.ts && (Date.now() - parsed.ts) < CACHE_TTL) {
          return parsed.checks;
        }
      }
    } catch { /* ignore */ }
    return {};
  });
  const [loading, setLoading] = useState(true);

  // Carica stato reale dal DB — query parallele
  const loadChecks = useCallback(async () => {
    if (!orgId || subLoading) return;

    // Mostra loading solo al primo caricamento
    if (!loadedRef.current) setLoading(true);

    try {
      const result = {};

      // Batch tutte le query indipendenti in parallelo
      const settingsKeys = ["company", "sdi", "onboarding_skipped"];
      if (activeModules.rvfu) settingsKeys.push("rvfu_auth");

      const [orgRes, settingsRes, membersRes, rentriRes] = await Promise.all([
        // Org name
        supabase.from("orgs").select("name").eq("id", orgId).single(),
        // Tutte le settings in una query
        supabase.from("org_settings").select("key, value").eq("org_id", orgId).in("key", settingsKeys),
        // Team members count
        supabase.from("org_members").select("*", { count: "exact", head: true }).eq("org_id", orgId),
        // RENTRI certs (solo se attivo)
        activeModules.rentri
          ? supabase.from("rentri_org_certificates").select("id, credentials_id_mobile").eq("org_id", orgId)
          : Promise.resolve({ data: null }),
      ]);

      const org = orgRes.data;
      const settingsMap = (settingsRes.data || []).reduce((acc, row) => ({ ...acc, [row.key]: row.value }), {});
      const company = settingsMap.company || {};
      const sdi = settingsMap.sdi || {};

      // Skip flag
      result.skipped = !!settingsMap.onboarding_skipped;

      // Dati organizzazione
      result.org_name = !!(org?.name && org.name.trim().length > 2);
      result.org_address = !!(company.address && (
        typeof company.address === 'object' ? company.address.street : company.address.trim().length > 3
      ));
      result.org_piva = !!(company.vat || company.tax_code);

      // Team
      result.team_member = (membersRes.count || 0) >= 1;

      // RVFU
      if (activeModules.rvfu) {
        const rvfuAuth = settingsMap.rvfu_auth;
        result.rvfu_auth = !!(rvfuAuth?.username && rvfuAuth?.password);
      }

      // SDI
      if (activeModules.sdi) {
        result.sdi_credentials = !!((company.vat || company.tax_code) && (company.regime_fiscale || sdi.pec));
      }

      // RENTRI
      if (activeModules.rentri) {
        const certs = rentriRes.data || [];
        result.rentri_cert = certs.length > 0;
        result.rentri_device = certs.some(c => c.credentials_id_mobile);
      }

      setChecks(result);
      loadedRef.current = true;

      // Salva in localStorage per lettura rapida al prossimo avvio
      try {
        localStorage.setItem(LS_KEY, JSON.stringify({ orgId, checks: result, ts: Date.now() }));
      } catch { /* ignore */ }
    } catch (err) {
      console.error("[useOnboarding] Error:", err);
    } finally {
      setLoading(false);
    }
  }, [orgId, activeModules, subLoading, supabase]);

  // Ascolta aggiornamenti cross-tab e eventi custom
  useEffect(() => {
    const handleUpdate = () => {
      try {
        const stored = localStorage.getItem(LS_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.orgId === orgId) setChecks(parsed.checks);
        }
      } catch { /* ignore */ }
    };
    window.addEventListener("storage", handleUpdate);
    window.addEventListener("rm-onboarding-update", handleUpdate);
    return () => {
      window.removeEventListener("storage", handleUpdate);
      window.removeEventListener("rm-onboarding-update", handleUpdate);
    };
  }, [orgId]);

  useEffect(() => { loadChecks(); }, [loadChecks]);

  // ── markSkipped: aggiorna DB + localStorage + stato React in un solo colpo ──
  // Usato da SetupWizard, AppOnboarding, e chiunque voglia uscire dal setup.
  // Restituisce true se riuscito. NON fa navigate — quello lo fa il chiamante.
  const markSkipped = useCallback(async () => {
    if (!orgId) return false;
    try {
      const { error } = await supabase.from("org_settings").upsert({
        org_id: orgId,
        key: "onboarding_skipped",
        value: true,
        updated_at: new Date().toISOString(),
      }, { onConflict: "org_id,key" });
      if (error) throw error;

      // Aggiorna stato React immediatamente (non aspetta il prossimo loadChecks).
      setChecks(prev => ({ ...prev, skipped: true }));

      // Persisti su localStorage leggendo lo stato attuale, così altre tab/istanze
      // di useOnboarding (es. Shell) lo vedono subito.
      try {
        const stored = localStorage.getItem(LS_KEY);
        const parsed = stored ? JSON.parse(stored) : null;
        const baseChecks = (parsed && parsed.orgId === orgId) ? (parsed.checks || {}) : {};
        const nextChecks = { ...baseChecks, skipped: true };
        localStorage.setItem(LS_KEY, JSON.stringify({ orgId, checks: nextChecks, ts: Date.now() }));
      } catch { /* ignore */ }

      // Defer dispatch al prossimo tick per uscire dal render-phase corrente
      // (evita il warning "Cannot update a component while rendering another").
      setTimeout(() => {
        try { window.dispatchEvent(new CustomEvent("rm-onboarding-update")); } catch { /* ignore */ }
      }, 0);

      return true;
    } catch (err) {
      console.error("[useOnboarding] markSkipped error:", err);
      return false;
    }
  }, [orgId, supabase]);

  // Calcoli derivati
  const completedCount = useMemo(() => steps.filter(s => checks[s.id]).length, [steps, checks]);
  const totalCount = steps.length;
  const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const isComplete = checks.skipped || percent === 100;
  const nextStep = useMemo(() => steps.find(s => !checks[s.id]) || null, [steps, checks]);

  // Raggruppa step per gruppo
  const groups = useMemo(() => {
    const groupMap = {};
    steps.forEach(s => {
      if (!groupMap[s.group]) groupMap[s.group] = { id: s.group, steps: [], completed: 0, total: 0 };
      groupMap[s.group].steps.push({ ...s, done: !!checks[s.id] });
      groupMap[s.group].total++;
      if (checks[s.id]) groupMap[s.group].completed++;
    });
    return Object.values(groupMap);
  }, [steps, checks]);

  const enrichedGroups = useMemo(() =>
    groups.map(g => ({
      ...g,
      ...(GROUP_META[g.id] || {}),
      percent: g.total > 0 ? Math.round((g.completed / g.total) * 100) : 0,
    }))
  , [groups]);

  return {
    steps,
    checks,
    groups: enrichedGroups,
    completedCount,
    totalCount,
    percent,
    isComplete,
    nextStep,
    activeModules,
    loading: loading || subLoading,
    refresh: loadChecks,
    markSkipped,
  };
}
