// src/lib/orgs.js
import { supabaseBrowser } from "@/lib/supabase-browser";

/**
 * Nota: in tutto il progetto usiamo la tabella `orgs` (NON `organizations`)
 * e la tabella `org_members` con colonne: org_id, user_id, role.
 */

function sb() {
  return supabaseBrowser();
}

/** Ritorna l'ID utente corrente o null */
export async function getUserId() {
  const { data, error } = await sb().auth.getUser();
  if (error) throw error;
  return data?.user?.id ?? null;
}

/** Membership dell’utente corrente: [{ org_id, role }] */
export async function listMyMemberships() {
  const uid = await getUserId();
  if (!uid) return [];
  const { data, error } = await sb()
    .from("org_members")
    .select("org_id, role")
    .eq("user_id", uid);
  if (error) throw error;
  return data || [];
}

/** Organizzazioni dell’utente, con ruolo associato */
export async function listMyOrgs() {
  const mem = await listMyMemberships();
  const ids = mem.map((m) => m.org_id);
  if (ids.length === 0) return [];
  const { data, error } = await sb()
    .from("orgs")
    .select("id, name")
    .in("id", ids)
    .order("name", { ascending: true });
  if (error) throw error;
  const roleBy = Object.fromEntries(mem.map((m) => [m.org_id, m.role]));
  return (data || []).map((o) => ({ ...o, role: roleBy[o.id] || null }));
}

/** Crea organizzazione e ritorna {id, name}; aggiunge anche l'owner */
export async function createOrg(name) {
  const clean = String(name || "").trim();
  if (!clean) throw new Error("Nome organizzazione vuoto");

  const client = sb();
  const { data: org, error: e1 } = await client
    .from("orgs")
    .insert({ name: clean })
    .select("id, name")
    .single();
  if (e1) throw e1;

  // owner auto-join
  const uid = await getUserId();
  if (uid) {
    await client
      .from("org_members")
      .insert({ org_id: org.id, user_id: uid, role: "owner" })
      .select("org_id")
      .single()
      .catch(() => {});
  }
  return org;
}

/** Elimina organizzazione (RLS: solo owner) */
export async function deleteOrg(orgId) {
  const { error } = await sb().from("orgs").delete().eq("id", orgId).single();
  if (error) throw error;
}

/** Legge/scrive l’organizzazione corrente nel profilo */
export async function getCurrentOrg() {
  const uid = await getUserId();
  if (!uid) return null;
  const { data, error } = await sb()
    .from("profiles")
    .select("current_org")
    .eq("id", uid)
    .maybeSingle();
  if (error) throw error;
  return data?.current_org ?? null;
}

export async function setCurrentOrg(orgId) {
  const uid = await getUserId();
  if (!uid) throw new Error("Utente non autenticato");
  const { error } = await sb()
    .from("profiles")
    .update({ current_org: orgId || null })
    .eq("id", uid);
  if (error) throw error;
}

/** True se l’utente corrente è owner della org */
export async function amIOwner(orgId) {
  const uid = await getUserId();
  if (!uid || !orgId) return false;
  const { data, error } = await sb()
    .from("org_members")
    .select("role")
    .eq("org_id", orgId)
    .eq("user_id", uid)
    .maybeSingle();
  if (error) throw error;
  return (data?.role || "").toLowerCase() === "owner";
}