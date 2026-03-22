// src/lib/organizations.js
import { supabaseBrowser } from "@/lib/supabase-browser";

/** Alias storico; internamente lavora su `orgs` */
export async function deleteOrganization(orgId) {
  const supabase = supabaseBrowser();
  const { error } = await supabase.from("orgs").delete().eq("id", orgId).single();
  if (error) throw error;
}