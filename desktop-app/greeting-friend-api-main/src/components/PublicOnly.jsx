// src/components/PublicOnly.jsx
import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabaseBrowser, isSupabaseReady } from "@/lib/supabase-browser";
import { OAuthService } from "@/lib/oauth";

export default function PublicOnly({ children }) {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const redirectTo = (() => {
    const p = params.get("redirect");
    if (p && p.startsWith("/")) return p;
    const last = localStorage.getItem("rm-last-route");
    if (last && !last.startsWith("/login")) return last;
    return "/";
  })();

  useEffect(() => {
    // Prima verifica OAuth
    if (OAuthService.isAuthenticated()) {
      console.log("[PublicOnly] OAuth authenticated, redirecting...");
      navigate(redirectTo, { replace: true });
      return;
    }

    if (!isSupabaseReady) return;               // se env mancanti resta su login
    const supabase = supabaseBrowser();

    // se già autenticato → vai via subito
    (async () => {
      try {
        const { data } = await supabase.auth.getUser();
        if (data?.user) navigate(redirectTo, { replace: true });
      } catch {}
    })();

    // se durante la pagina di login arriva l'evento SIGNED_IN → vai via
    const { data: sub } = supabase.auth.onAuthStateChange((ev, session) => {
      if (ev === "SIGNED_IN" && session) navigate(redirectTo, { replace: true });
    });

    return () => sub?.subscription?.unsubscribe?.();
  }, [navigate, redirectTo, params]);

  return <>{children}</>;
}