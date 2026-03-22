// Re-export the singleton Supabase client from supabase-browser.
// IMPORTANT: Do NOT create a second client here — it causes "Multiple GoTrueClient instances"
// and the auth session (created via OAuth verifyOtp) is lost.
import { supabaseBrowser } from '@/lib/supabase-browser';

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = supabaseBrowser();