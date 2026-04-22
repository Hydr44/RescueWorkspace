// src/context/OrgContext.jsx
import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { setSentryUser } from "@/lib/sentry";

const OrgCtx = createContext(null);

// LocalStorage keys
const LS_KEY  = "rm:current_org";
const AUTH_LS = "rm-auth";

/** Attende che la sessione sia idratata da supabase-js (max ~3s). */
async function waitForSessionReady(supabase, { timeoutMs = 3000, pollMs = 120 } = {}) {
  const start = Date.now();
  const s0 = await supabase.auth.getSession();
  if (s0?.data?.session) return s0.data.session;
  while (Date.now() - start < timeoutMs) {
    await new Promise((r) => setTimeout(r, pollMs));
    const { data } = await supabase.auth.getSession();
    if (data?.session) return data.session;
  }
  return null;
}

/** Lettura user con fallback al localStorage (Electron/file://) */
async function readUserSafe(supabase) {
  try {
    const { data } = await supabase.auth.getSession();
    if (data?.session?.user) return data.session.user;
  } catch {}
  try {
    const raw = localStorage.getItem(AUTH_LS);
    if (raw) {
      const parsed = JSON.parse(raw);
      const sess = parsed?.currentSession ?? parsed;
      if (sess?.user) return sess.user;
    }
  } catch {}
  return null;
}

/** Riprova una funzione async più volte con delay. */
async function retryWithBackoff(fn, { maxRetries = 3, delayMs = 250 } = {}) {
  for (let i = 0; i < maxRetries; i++) {
    try { 
      return await fn(); 
    } catch (err) {
      console.warn(`[OrgContext] Retry ${i + 1}/${maxRetries} failed:`, err);
      if (i < maxRetries - 1) {
        await new Promise(r => setTimeout(r, delayMs * (i + 1)));
      }
    }
  }
  // Ultimo tentativo
  return await fn();
}

/** Carica le org dell'utente */
async function loadMyOrganizations(supabase, userId) {
  const norm = (id, name, role, number) => ({
    id,
    name: (name || "").trim() || "Organizzazione",
    role: role || null,
    number: number || null,
  });

  // Query separata (avoid join issues with Supabase)
  const { data: mem, error: memError } = await supabase
    .from("org_members")
    .select("org_id, role")
    .eq("user_id", userId);
  
  if (memError) {
    console.error("[OrgContext] Error loading org_members:", memError);
    // Non bloccare, prova fallback
  }

  const ids = Array.from(new Set((mem || []).map(m => m.org_id))).filter(Boolean);
  
  if (ids.length === 0) {
    // Fallback: prova profiles.current_org se org_members è vuoto (RLS o dati mancanti)
    console.warn("[OrgContext] org_members vuoto, fallback a profiles.current_org");
    const { data: profile } = await supabase
      .from("profiles")
      .select("current_org")
      .eq("id", userId)
      .maybeSingle();
    if (profile?.current_org) {
      const { data: fallbackOrg } = await supabase
        .from("orgs")
        .select("id, name, number")
        .eq("id", profile.current_org)
        .maybeSingle();
      if (fallbackOrg) {
        console.log("[OrgContext] Fallback org trovata:", fallbackOrg.name);
        return [norm(fallbackOrg.id, fallbackOrg.name, "owner", fallbackOrg.number)];
      }
    }
    return [];
  }

  const { data: orgs, error: orgsError } = await supabase
    .from("orgs")
    .select("id, name, number")
    .in("id", ids);

  if (orgsError) {
    return [];
  }

  const orgsById = {};
  (orgs || []).forEach(o => { orgsById[o.id] = o; });

  const result = (mem || []).map(m => norm(m.org_id, orgsById[m.org_id]?.name, m.role, orgsById[m.org_id]?.number));
  
  return result;
}

export function OrgProvider({ children }) {
  const supabase = supabaseBrowser();

  const [userId, setUserId]   = useState(null);
  const [orgId, setOrgId]     = useState(null);
  const [orgs, setOrgs]       = useState([]);
  const [role, setRole]       = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshRun = useRef(0);

  async function fetchRole(currentOrgId, forUserId) {
    const uid = forUserId || userId;
    if (!currentOrgId || !uid) return null;
    const { data, error } = await supabase
      .from("org_members")
      .select("role")
      .eq("org_id", currentOrgId)
      .eq("user_id", uid)
      .maybeSingle();
    if (error) {
      console.warn("[OrgContext] fetchRole error:", error);
      return null;
    }
    return data?.role ?? null;
  }

  async function refresh({ keepLoading = false } = {}) {
    const runId = ++refreshRun.current;
    if (!keepLoading) setLoading(true);

    // Safety timeout: forza loading=false dopo 8 secondi
    const safetyTimeout = setTimeout(() => {
      console.warn("[OrgContext] Safety timeout reached, forcing loading=false");
      if (runId === refreshRun.current) setLoading(false);
    }, 8000);

    try {
      // Prima prova OAuth
      const { OAuthService } = await import("@/lib/oauth");
      let user = null;
      
      if (OAuthService.isAuthenticated()) {
        try {
          // Chiama getCurrentUser solo una volta, senza retry eccessivi
          // getCurrentUser ha già cache interna per evitare richieste ripetute
          const oauthUser = await OAuthService.getCurrentUser();
          if (oauthUser?.id) {
            user = { id: oauthUser.id, email: oauthUser.email };
          }
        } catch (err) {
          console.error("[OrgContext] Error getting OAuth user:", err);
        }
      }
      
      // Fallback a Supabase con timeout ridotto
      if (!user) {
        const session = await waitForSessionReady(supabase, { timeoutMs: 3000 });
        user = session?.user || (await readUserSafe(supabase));
      }
      
      if (!user) {
        console.warn("[OrgContext] No user found, clearing state");
        setUserId(null); setOrgId(null); setOrgs([]); setRole(null);
        try { localStorage.removeItem(LS_KEY); } catch {}
        clearTimeout(safetyTimeout);
        return;
      }
      setUserId(user.id);
      
      // Retry con backoff ridotto per evitare blocchi
      let myOrgs = [];
      try {
        myOrgs = await retryWithBackoff(() => {
          return loadMyOrganizations(supabase, user.id);
        }, { 
          maxRetries: 2,
          delayMs: 300 
        });
      } catch (err) {
        console.error("[OrgContext] Error loading orgs (will continue anyway):", err);
        // Continua anche se fallisce - l'utente può selezionare org dopo
      }
      
      myOrgs = Array.isArray(myOrgs) ? myOrgs : [];
      console.log("[OrgContext] Loaded orgs:", myOrgs.length);

      let nextOrgId = null;
      try {
        const cached = localStorage.getItem(LS_KEY);
        if (cached && myOrgs.some(o => o.id === cached)) nextOrgId = cached;
      } catch {}

      if (!nextOrgId && myOrgs.length) {
        const owner = myOrgs.find(o => (o.role || "").toLowerCase() === "owner");
        nextOrgId = owner?.id ?? myOrgs[0].id;
      }

      setOrgs(myOrgs);
      setOrgId(nextOrgId);

      const nextRole = nextOrgId ? await fetchRole(nextOrgId, user.id) : null;
      setRole(nextRole);

      // Update Sentry context with user and org info
      setSentryUser(user, nextOrgId);

      try {
        if (nextOrgId) localStorage.setItem(LS_KEY, nextOrgId);
        else localStorage.removeItem(LS_KEY);
      } catch {}

      if (runId !== refreshRun.current) return;
      if (!nextOrgId && myOrgs.length === 0) {
        const again = await loadMyOrganizations(supabase, user.id);
        if (again.length) {
          setOrgs(again);
          const choose = again[0]?.id ?? null;
          setOrgId(choose);
          try { if (choose) localStorage.setItem(LS_KEY, choose); } catch {}
          const r2 = choose ? await fetchRole(choose, user.id) : null;
          setRole(r2);
        }
      }
    } catch (e) {
      console.error("[OrgContext] refresh failed:", e);
      setUserId(null); setOrgId(null); setOrgs([]); setRole(null);
      try { localStorage.removeItem(LS_KEY); } catch {}
    } finally {
      clearTimeout(safetyTimeout);
      if (runId === refreshRun.current) {
        setLoading(false);
        console.log("[OrgContext] Loading complete");
      }
    }
  }

  async function setCurrentOrg(nextId) {
    setOrgId(nextId || null);
    setRole(null);
    try {
      if (nextId) localStorage.setItem(LS_KEY, nextId);
      else localStorage.removeItem(LS_KEY);
    } catch {}
    try {
      // niente user_prefs
    } finally {
      await refresh({ keepLoading: true });
    }
  }

  useEffect(() => {
    refresh();
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "USER_UPDATED") {
        refresh({ keepLoading: true });
      }
      if (event === "SIGNED_OUT") {
        setUserId(null); setOrgId(null); setOrgs([]); setRole(null);
        try { localStorage.removeItem(LS_KEY); } catch {}
      }
    });
    return () => sub?.subscription?.unsubscribe?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // cross-tab sync + OAuth token changes
  useEffect(() => {
    function onStorage(ev) {
      if (ev.key === LS_KEY || ev.key === AUTH_LS || ev.key === "rm-oauth-tokens") {
        refresh({ keepLoading: true });
      }
    }
    
    // Listener immediato per evento custom quando OAuth salva i token
    function onOAuthTokensSaved() {
      console.log("[OrgContext] OAuth tokens saved event received, refreshing immediately...");
      refresh({ keepLoading: true });
    }
    
    window.addEventListener("storage", onStorage);
    window.addEventListener("oauth-tokens-saved", onOAuthTokensSaved);
    
    // Monitora i token OAuth (con debounce per evitare loop) - solo come fallback
    let lastCheck = 0;
    const checkInterval = setInterval(() => {
      const now = Date.now();
      if (now - lastCheck < 2000) return; // Debounce: max 1 check ogni 2 secondi
      lastCheck = now;
      
      const tokens = localStorage.getItem("rm-oauth-tokens");
      if (tokens && !userId) {
        refresh({ keepLoading: true });
      }
    }, 1000); // Check ogni secondo invece di 500ms
    
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("oauth-tokens-saved", onOAuthTokensSaved);
      clearInterval(checkInterval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // realtime: membership o rinomina org
  useEffect(() => {
    if (!userId) return;
    const channel = supabase.channel("orgctx-realtime");
    channel.on(
      "postgres_changes",
      { event: "*", schema: "public", table: "org_members", filter: `user_id=eq.${userId}` },
      () => refresh({ keepLoading: true })
    );
    channel.on(
      "postgres_changes",
      { event: "*", schema: "public", table: "organizations" },
      () => refresh({ keepLoading: true })
    );
    channel.on(
      "postgres_changes",
      { event: "*", schema: "public", table: "orgs" },
      () => refresh({ keepLoading: true })
    );
    channel.subscribe();
    return () => { try { supabase.removeChannel(channel); } catch {} };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // riallinea ruolo quando cambia orgId
  useEffect(() => {
    let stop = false;
    (async () => {
      if (!orgId) { setRole(null); return; }
      const r = await fetchRole(orgId);
      if (!stop) setRole(r);
    })();
    return () => { stop = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId, userId]);

  const isOwner = (role || "").toLowerCase() === "owner";
  const isAdmin = ["owner", "admin"].includes((role || "").toLowerCase());
  const orgName = useMemo(() => {
    const o = orgs.find(x => x.id === orgId);
    return o?.name || "Organizzazione";
  }, [orgs, orgId]);

  const value = useMemo(
    () => ({ userId, orgId, orgName, orgs, role, isOwner, isAdmin, setCurrentOrg, refresh, loading }),
    [userId, orgId, orgName, orgs, role, isOwner, isAdmin, loading]
  );

  return <OrgCtx.Provider value={value}>{children}</OrgCtx.Provider>;
}

export function useOrg() {
  const ctx = useContext(OrgCtx);
  if (!ctx) throw new Error("useOrg() deve essere usato dentro <OrgProvider>");
  return ctx;
}