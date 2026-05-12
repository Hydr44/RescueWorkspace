/**
 * useOrgFeatures — desktop app (Vite + React).
 *
 * Speculare a website/src/lib/useOrgFeatures.ts.
 * Legge org_settings.key='features' + orgs.{web,desktop}_access_enabled + desktop_modules.
 *
 * Esempio uso:
 *   const { isEnabled, hasModule } = useOrgFeatures();
 *   {isEnabled('ai_descriptions') && <GenerateAIButton />}
 *   {hasModule('rvfu') && <RvfuTab />}
 */

import { useEffect, useState, useCallback } from 'react';
import { supabaseBrowser } from '@/lib/supabase-browser';

export type FeatureFlag =
  | 'ai_validation' | 'ai_descriptions' | 'ai_assist' | 'ai_image_recognition'
  | 'sdi_test_mode' | 'sdi_auto_send'
  | 'rvfu_aci_vpn' | 'rvfu_auto_submit' | 'rentri_polling' | 'rentri_auto_movements'
  | 'marketplace_enabled' | 'marketplace_ebay' | 'marketplace_subito'
  | 'gps_tracking_enabled' | 'driver_app_enabled' | 'geofencing'
  | 'email_notifications' | 'push_notifications' | 'whatsapp_notifications'
  | 'twofa_required' | 'audit_log_visible' | 'remote_control_enabled'
  | 'beta_features';

const DEFAULT_FEATURES: Record<FeatureFlag, boolean> = {
  ai_validation: true, ai_descriptions: true, ai_assist: true, ai_image_recognition: false,
  sdi_test_mode: false, sdi_auto_send: true,
  rvfu_aci_vpn: false, rvfu_auto_submit: false, rentri_polling: true, rentri_auto_movements: false,
  marketplace_enabled: false, marketplace_ebay: false, marketplace_subito: false,
  gps_tracking_enabled: true, driver_app_enabled: true, geofencing: false,
  email_notifications: true, push_notifications: true, whatsapp_notifications: false,
  twofa_required: false, audit_log_visible: false, remote_control_enabled: true,
  beta_features: false,
};

const FEATURE_REQUIRES_MODULE: Partial<Record<FeatureFlag, string>> = {
  rvfu_aci_vpn: 'rvfu', rvfu_auto_submit: 'rvfu', ai_image_recognition: 'rvfu',
  rentri_polling: 'rentri', rentri_auto_movements: 'rentri',
  sdi_test_mode: 'fatturazione', sdi_auto_send: 'fatturazione',
  marketplace_ebay: 'marketplace', marketplace_subito: 'marketplace',
  ai_descriptions: 'ricambi', geofencing: 'tracking',
};

interface State {
  loading: boolean;
  orgId: string | null;
  features: Record<string, boolean>;
  modules: string[];
  webAccessEnabled: boolean;
  desktopAccessEnabled: boolean;
}

let cache: State | null = null;
const listeners = new Set<() => void>();
function notify() { for (const l of listeners) l(); }

async function load(): Promise<State> {
  const supabase = supabaseBrowser();
  const s: State = {
    loading: false, orgId: null, features: { ...DEFAULT_FEATURES }, modules: [],
    webAccessEnabled: true, desktopAccessEnabled: true,
  };
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return s;

    const { data: profile } = await supabase
      .from('profiles').select('current_org').eq('id', user.id).maybeSingle();
    let orgId = (profile as any)?.current_org as string | null;
    if (!orgId) {
      const { data: mem } = await supabase
        .from('org_members').select('org_id').eq('user_id', user.id).limit(1).maybeSingle();
      orgId = (mem as any)?.org_id || null;
    }
    if (!orgId) return s;
    s.orgId = orgId;

    const [{ data: org }, { data: settings }] = await Promise.all([
      supabase.from('orgs')
        .select('web_access_enabled, desktop_access_enabled, desktop_modules')
        .eq('id', orgId).maybeSingle(),
      supabase.from('org_settings')
        .select('value').eq('org_id', orgId).eq('key', 'features').maybeSingle(),
    ]);

    const o = org as any;
    if (o) {
      s.webAccessEnabled = o.web_access_enabled !== false;
      s.desktopAccessEnabled = o.desktop_access_enabled !== false;
      s.modules = Array.isArray(o.desktop_modules) ? o.desktop_modules : [];
    }
    const v = (settings as any)?.value;
    if (v && typeof v === 'object') {
      s.features = { ...DEFAULT_FEATURES, ...v };
    }
    return s;
  } catch {
    return s;
  }
}

export function useOrgFeatures() {
  const [state, setState] = useState<State>(
    cache || { loading: true, orgId: null, features: { ...DEFAULT_FEATURES }, modules: [], webAccessEnabled: true, desktopAccessEnabled: true }
  );

  useEffect(() => {
    let mounted = true;
    if (!cache) {
      load().then(s => {
        cache = s;
        if (mounted) setState(s);
        notify();
      });
    }
    const u = () => { if (mounted && cache) setState(cache); };
    listeners.add(u);
    return () => { mounted = false; listeners.delete(u); };
  }, []);

  const isEnabled = useCallback((flag: FeatureFlag): boolean => {
    const req = FEATURE_REQUIRES_MODULE[flag];
    if (req && !state.modules.includes(req)) return false;
    const v = state.features[flag];
    return v === undefined ? DEFAULT_FEATURES[flag] : v === true;
  }, [state.features, state.modules]);

  const hasModule = useCallback((m: string) => state.modules.includes(m), [state.modules]);

  const refresh = useCallback(async () => {
    cache = null;
    const s = await load();
    cache = s;
    setState(s);
    notify();
  }, []);

  return {
    loading: state.loading,
    orgId: state.orgId,
    features: state.features,
    modules: state.modules,
    webAccessEnabled: state.webAccessEnabled,
    desktopAccessEnabled: state.desktopAccessEnabled,
    isEnabled,
    hasModule,
    refresh,
  };
}
