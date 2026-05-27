// src/hooks/useSubscription.js
/**
 * Hook per controllare l'abbonamento dell'organizzazione corrente.
 * Carica da org_subscriptions + org_modules al login/avvio.
 * Espone: subscription, plan, isValid, daysLeft, modules attivi.
 */
import { useState, useEffect, useCallback, useMemo } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { useOrg } from "@/context/OrgContext";
import { PLANS, SUBSCRIPTION_STATUS, isSubscriptionValid, daysRemaining } from "@/lib/plans";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";

export function useSubscription() {
  const supabase = supabaseBrowser();
  const { orgId, loading: orgLoading } = useOrg();
  const { integrationFlags: globalFlags } = useFeatureFlags();

  const [subscription, setSubscription] = useState(null);
  const [modules, setModules] = useState([]);
  const [features, setFeatures] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadSubscription = useCallback(async () => {
    // Mantieni loading=true finché OrgContext non ha finito di caricare
    if (orgLoading) {
      setLoading(true);
      return;
    }
    // Se OrgContext ha finito ma non c'è orgId, mantieni loading=true
    // per evitare flash di "Nessun abbonamento" durante il caricamento iniziale
    if (!orgId) {
      // Solo se OrgContext ha davvero finito e non c'è orgId, allora mostra "no subscription"
      // Altrimenti continua a mostrare loading
      setSubscription(null);
      setModules([]);
      // Mantieni loading=true se siamo ancora in fase di inizializzazione
      setLoading(true);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fonte di verità per i moduli abilitati: `orgs.desktop_modules`
      // (array di nomi UI tipo 'trasporti','clienti','fatturazione',ecc).
      // La tabella legacy `org_modules` era usata in passato ma il CHECK
      // constraint accetta solo 5 valori billing, non i nomi UI.
      // ClientControlsPanel + demo activate/PATCH scrivono in `orgs.desktop_modules`.
      const [subRes, orgRes] = await Promise.all([
        supabase
          .from("org_subscriptions")
          .select("*")
          .eq("org_id", orgId)
          .maybeSingle(),
        supabase
          .from("orgs")
          .select("desktop_modules")
          .eq("id", orgId)
          .maybeSingle(),
      ]);

      if (subRes.error && subRes.error.code !== "PGRST116") {
        console.warn("[useSubscription] Error loading subscription:", subRes.error.message);
      }

      if (orgRes.error) {
        console.warn("[useSubscription] Error loading org modules:", orgRes.error.message);
      }

      setSubscription(subRes.data || null);
      const desktopModules = Array.isArray(orgRes.data?.desktop_modules)
        ? orgRes.data.desktop_modules
        : [];
      setModules(desktopModules);

      // Carica feature flags dell'org (org_settings.key='features')
      try {
        const { data: featRow } = await supabase
          .from("org_settings")
          .select("value")
          .eq("org_id", orgId)
          .eq("key", "features")
          .maybeSingle();
        setFeatures((featRow?.value && typeof featRow.value === "object") ? featRow.value : {});
      } catch (e) {
        console.warn("[useSubscription] features load failed:", e.message);
        setFeatures({});
      }
    } catch (err) {
      console.error("[useSubscription] Exception:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [orgId, orgLoading, supabase]);

  useEffect(() => {
    loadSubscription();
  }, [loadSubscription]);

  // Piano corrente
  const plan = useMemo(() => {
    if (!subscription?.plan) return null;
    return PLANS[subscription.plan] || { id: subscription.plan, label: subscription.plan, color: "slate" };
  }, [subscription]);

  // Abbonamento valido?
  const isValid = useMemo(() => isSubscriptionValid(subscription), [subscription]);

  // Giorni rimanenti
  const daysLeft = useMemo(() => daysRemaining(subscription), [subscription]);

  // Status info
  const statusInfo = useMemo(() => {
    if (!subscription) return SUBSCRIPTION_STATUS.inactive;
    return SUBSCRIPTION_STATUS[subscription.status] || SUBSCRIPTION_STATUS.inactive;
  }, [subscription]);

  // Check se un modulo specifico è attivo (per-org AND globale).
  // Accetta sia il nome UI ('fatturazione') sia l'alias legacy ('sdi').
  const isModuleActive = useCallback((mod) => {
    if (globalFlags[mod] === false) return false;
    if (modules.includes(mod)) return true;
    // Aliasing: SDI è il nome billing, 'fatturazione' è il nome UI admin.
    if (mod === 'sdi' && modules.includes('fatturazione')) return true;
    if (mod === 'fatturazione' && modules.includes('sdi')) return true;
    return false;
  }, [modules, globalFlags]);

  // Oggetto activeModules: legge da `orgs.desktop_modules` (nomi UI).
  // - 'fatturazione' (label admin) = 'sdi' (chiave legacy) → accettiamo entrambi.
  // - Un modulo è attivo solo se è presente nell'org E non disabilitato dai
  //   feature flag globali.
  // Mag 2026: la fonte canonica è `orgs.desktop_modules`; ClientControlsPanel
  // e demo activate/PATCH scrivono lì.
  const activeModules = useMemo(() => {
    const has = (m) => modules.includes(m);
    return {
      // Billing modules
      sdi: (has("sdi") || has("fatturazione")) && globalFlags.sdi !== false,
      rvfu: has("rvfu") && globalFlags.rvfu !== false,
      rentri: has("rentri") && globalFlags.rentri !== false,
      contabilita: has("contabilita") && globalFlags.contabilita !== false,
      // Moduli operativi (gated da desktop_modules + flag globale)
      ricambi: has("ricambi") && globalFlags.ricambi !== false,
      piazzale: has("piazzale") && globalFlags.piazzale !== false,
      trasporti: has("trasporti") && globalFlags.trasporti !== false,
      tracking: has("tracking") && globalFlags.tracking !== false,
      calendario: has("calendario") && globalFlags.calendario !== false,
      clienti: has("clienti") && globalFlags.clienti !== false,
      mezzi: has("mezzi") && globalFlags.mezzi !== false,
      autisti: has("autisti") && globalFlags.autisti !== false,
      preventivi: has("preventivi") && globalFlags.preventivi !== false,
      report: has("report") && globalFlags.report !== false,
    };
  }, [modules, globalFlags]);

  // Feature defaults (allineati a admin ClientControlsPanel)
  const FEATURE_DEFAULTS = {
    ai_validation: true, ai_descriptions: true, ai_assist: true, ai_image_recognition: false,
    sdi_test_mode: false, sdi_auto_send: true,
    rvfu_aci_vpn: false, rvfu_auto_submit: false,
    rentri_polling: true, rentri_auto_movements: false,
    marketplace_enabled: false, marketplace_ebay: false, marketplace_subito: false,
    gps_tracking_enabled: true, driver_app_enabled: true, geofencing: false,
    email_notifications: true, push_notifications: true, whatsapp_notifications: false,
    twofa_required: false, audit_log_visible: false, remote_control_enabled: true,
    beta_features: false,
  };

  // Mapping feature → modulo richiesto (per auto-disable se modulo off)
  const FEATURE_MODULE_DEP = {
    rvfu_aci_vpn: 'rvfu', rvfu_auto_submit: 'rvfu', ai_image_recognition: 'rvfu',
    rentri_polling: 'rentri', rentri_auto_movements: 'rentri',
    sdi_test_mode: 'sdi', sdi_auto_send: 'sdi',
    marketplace_ebay: 'marketplace', marketplace_subito: 'marketplace',
    ai_descriptions: 'ricambi',
  };

  const isFeatureEnabled = useCallback((flag) => {
    const req = FEATURE_MODULE_DEP[flag];
    if (req && !isModuleActive(req)) return false;
    const v = features[flag];
    return v === undefined ? FEATURE_DEFAULTS[flag] === true : v === true;
  }, [features, isModuleActive]);

  return {
    subscription,
    plan,
    isValid,
    daysLeft,
    statusInfo,
    modules,
    activeModules,
    isModuleActive,
    features,
    isFeatureEnabled,
    loading,
    error,
    refresh: loadSubscription,
  };
}
