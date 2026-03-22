// src/hooks/useAuthUser.ts
import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { getAuthSnapshot } from "@/lib/auth-snapshot";
import { OAuthService, OAuthUser } from "@/lib/oauth";

export function useAuthUser() {
  const [user, setUser] = useState<OAuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [authMethod, setAuthMethod] = useState<'supabase' | 'oauth' | null>(null);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log('=== INITIALIZING AUTH ===');
        
        // Prima controlla OAuth
        if (OAuthService.isAuthenticated()) {
          console.log('OAuth authenticated, getting user...');
          const oauthUser = await OAuthService.getCurrentUser();
          if (oauthUser) {
            console.log('OAuth user found:', oauthUser);
            setUser(oauthUser);
            setAuthMethod('oauth');
            setLoading(false);
            return;
          }
        }

        console.log('OAuth not authenticated, checking Supabase...');
        // Fallback a Supabase
        const supabase = supabaseBrowser();
        const snapshot = getAuthSnapshot();
        
        if (snapshot.user) {
          console.log('Supabase user found:', snapshot.user);
          setUser({ 
            id: snapshot.user.id, 
            email: snapshot.user.email || '',
            full_name: snapshot.user.email || ''
          });
          setAuthMethod('supabase');
        }

        // Listener per cambiamenti Supabase
        const { data: sub } = supabase.auth.onAuthStateChange((_ev, session) => {
          console.log('Supabase auth state change:', _ev, session?.user?.email);
          if (session?.user) {
            setUser({ 
              id: session.user.id, 
              email: session.user.email || '',
              full_name: session.user.email || ''
            });
            setAuthMethod('supabase');
          } else {
            setUser(null);
            setAuthMethod(null);
          }
        });

        setLoading(false);
        return () => sub?.subscription?.unsubscribe?.();
        
      } catch (error) {
        console.error('Auth initialization error:', error);
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Log dello stato corrente
  console.log('=== USE AUTH USER STATE ===');
  console.log('User:', user);
  console.log('Loading:', loading);
  console.log('Auth Method:', authMethod);

  return { user, loading, authMethod };
}