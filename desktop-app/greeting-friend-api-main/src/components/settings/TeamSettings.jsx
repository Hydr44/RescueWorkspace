// src/components/settings/TeamSettings.jsx
// Gestione membri team, inviti, ruoli granulari
import { useState, useEffect, useCallback } from "react";
import { FiUsers, FiUserPlus, FiTrash2, FiShield, FiMail, FiRefreshCw } from "react-icons/fi";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { useOrg } from "@/context/OrgContext";
import { ROLES, ROLE_OPTIONS, roleInfo, assignableRoles, hasPermission } from "@/lib/permissions";
import { Section, Card, Field } from "@/components/ui/SettingsUI";
import PropTypes from "prop-types";

export default function TeamSettings({ showToast }) {
  const supabase = supabaseBrowser();
  const { orgId, orgName, role: myRole, userId } = useOrg();

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Invite form
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("operator");
  const [inviting, setInviting] = useState(false);

  // Pending invites
  const [pendingInvites, setPendingInvites] = useState([]);

  const loadMembers = useCallback(async () => {
    if (!orgId) return;
    try {
      setLoading(true);

      // Carica membri
      const { data: memBasic, error: basicErr } = await supabase
        .from("org_members")
        .select("user_id, role, created_at")
        .eq("org_id", orgId);

      if (basicErr) throw basicErr;

      // Carica profiles separatamente
      const userIds = (memBasic || []).map(m => m.user_id).filter(Boolean);
      let profilesMap = {};
      
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, email, avatar_url")
          .in("id", userIds);
        
        profilesMap = (profiles || []).reduce((acc, p) => {
          acc[p.id] = p;
          return acc;
        }, {});
      }

      const enriched = (memBasic || []).map(m => {
        const prof = profilesMap[m.user_id];
        return {
          ...m,
          profile: prof || null,
          displayName: prof?.full_name || prof?.email || (m.user_id === userId ? "Tu" : `Utente ${(m.user_id || "").slice(0, 6)}`),
          email: prof?.email || "—",
          avatarUrl: prof?.avatar_url || null,
          isMe: m.user_id === userId,
        };
      });

      enriched.sort((a, b) => {
        const la = ROLES[a.role]?.level ?? 0;
        const lb = ROLES[b.role]?.level ?? 0;
        if (lb !== la) return lb - la;
        return a.displayName.localeCompare(b.displayName);
      });

      setMembers(enriched);

      // Carica inviti pendenti (ignora errore se tabella non esiste)
      try {
        const { data: invites } = await supabase
          .from("org_invites")
          .select("*")
          .eq("org_id", orgId)
          .eq("status", "pending");
        setPendingInvites(invites || []);
      } catch {
        setPendingInvites([]);
      }

    } catch (err) {
      console.error("[TeamSettings] Error loading members:", err);
      showToast?.("error", "Errore caricamento membri");
    } finally {
      setLoading(false);
    }
  }, [orgId, userId]);

  useEffect(() => { loadMembers(); }, [loadMembers]);

  async function inviteMember() {
    if (!inviteEmail || !inviteEmail.includes("@")) {
      showToast?.("error", "Inserisci un indirizzo email valido");
      return;
    }
    if (!orgId) return;

    try {
      setInviting(true);

      // Controlla se l'utente esiste già come membro
      const { data: existingProfiles } = await supabase
        .from("profiles")
        .select("id, email")
        .eq("email", inviteEmail.toLowerCase().trim())
        .maybeSingle();

      if (existingProfiles?.id) {
        // Controlla se è già membro
        const { data: existingMember } = await supabase
          .from("org_members")
          .select("user_id")
          .eq("org_id", orgId)
          .eq("user_id", existingProfiles.id)
          .maybeSingle();

        if (existingMember) {
          showToast?.("error", "Questo utente è già membro dell'organizzazione");
          return;
        }

        // Aggiungi direttamente come membro
        const { error: addErr } = await supabase
          .from("org_members")
          .insert({
            org_id: orgId,
            user_id: existingProfiles.id,
            role: inviteRole,
          });

        if (addErr) throw addErr;

        showToast?.("success", `${inviteEmail} aggiunto come ${roleInfo(inviteRole).label}`);
      } else {
        // Utente non esiste: crea invito pendente
        console.log("[TeamSettings] Creating invite:", {
          org_id: orgId,
          email: inviteEmail.toLowerCase().trim(),
          role: inviteRole,
          invited_by: userId,
        });

        const { data: inviteData, error: invErr } = await supabase
          .from("org_invites")
          .insert({
            org_id: orgId,
            email: inviteEmail.toLowerCase().trim(),
            role: inviteRole,
            invited_by: userId,
            status: "pending",
          })
          .select();

        if (invErr) {
          console.error("[TeamSettings] Invite insert error:", invErr);
          // Se la tabella non esiste, mostra messaggio appropriato
          if (invErr.code === "42P01") {
            showToast?.("error", "Sistema inviti non ancora configurato. Applica la migrazione 20260221_team_invite_system.sql");
            return;
          }
          throw invErr;
        }

        console.log("[TeamSettings] Invite created successfully:", inviteData);
        showToast?.("success", `Invito inviato a ${inviteEmail} - Controlla la tua email!`);
      }

      setInviteEmail("");
      setInviteRole("operator");
      await loadMembers();
    } catch (err) {
      console.error("[TeamSettings] Error inviting:", err);
      showToast?.("error", err?.message || "Errore durante l'invito");
    } finally {
      setInviting(false);
    }
  }

  async function changeRole(memberUserId, newRole) {
    try {
      const { error } = await supabase
        .from("org_members")
        .update({ role: newRole })
        .eq("org_id", orgId)
        .eq("user_id", memberUserId);

      if (error) throw error;

      showToast?.("success", `Ruolo aggiornato a ${roleInfo(newRole).label}`);
      await loadMembers();
    } catch (err) {
      showToast?.("error", err?.message || "Errore cambio ruolo");
    }
  }

  async function removeMember(memberUserId, memberName) {
    if (!confirm(`Rimuovere ${memberName} dall'organizzazione "${orgName}"?`)) return;

    try {
      const { error } = await supabase
        .from("org_members")
        .delete()
        .eq("org_id", orgId)
        .eq("user_id", memberUserId);

      if (error) throw error;

      showToast?.("success", `${memberName} rimosso dall'organizzazione`);
      await loadMembers();
    } catch (err) {
      showToast?.("error", err?.message || "Errore rimozione membro");
    }
  }

  async function cancelInvite(inviteId) {
    try {
      const { error } = await supabase
        .from("org_invites")
        .delete()
        .eq("id", inviteId);

      if (error) throw error;

      showToast?.("success", "Invito annullato");
      await loadMembers();
    } catch (err) {
      showToast?.("error", err?.message || "Errore annullamento invito");
    }
  }

  const canInvite = hasPermission(myRole, "team.invite");
  const canRemove = hasPermission(myRole, "team.remove");
  const canChangeRole = hasPermission(myRole, "team.changeRole");
  const availableRoles = assignableRoles(myRole);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <FiRefreshCw className="w-5 h-5 animate-spin text-blue-400" />
        <span className="ml-2 text-sm text-slate-400">Caricamento team...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Riepilogo Team */}
      <Section title="Gestione Team" desc={`Gestisci i membri di "${orgName}"`}>
        <div className="grid grid-cols-4 gap-3 mb-4">
          <Card title="Membri Totali">
            <div className="text-lg font-semibold text-blue-400">{members.length}</div>
          </Card>
          {Object.entries(ROLES).map(([key, info]) => {
            const count = members.filter(m => m.role === key).length;
            if (count === 0) return null;
            return (
              <Card key={key} title={info.label}>
                <div className={`text-lg font-semibold text-${info.color}-400`}>{count}</div>
              </Card>
            );
          }).filter(Boolean).slice(0, 3)}
        </div>

        {/* Invita Membro */}
        {canInvite && (
          <div className="bg-[#141c27] rounded-lg border border-[#243044] p-4 mb-4">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <FiUserPlus className="w-3.5 h-3.5" />
              Invita Nuovo Membro
            </h3>
            <div className="flex items-end gap-3">
              <Field label="Email" required className="flex-1">
                <input
                  type="email"
                  className="w-full px-3 py-1.5 text-xs border border-[#243044] rounded-lg bg-[#1a2536] text-slate-200 placeholder-slate-500 focus:ring-1 focus:ring-blue-500/40 outline-none"
                  placeholder="utente@email.it"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && inviteMember()}
                />
              </Field>
              <Field label="Ruolo" className="w-44">
                <select
                  className="w-full px-3 py-1.5 text-xs border border-[#243044] rounded-lg bg-[#1a2536] text-slate-200 focus:ring-1 focus:ring-blue-500/40 outline-none"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                >
                  {availableRoles.map(r => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </Field>
              <button
                onClick={inviteMember}
                disabled={inviting || !inviteEmail}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors whitespace-nowrap"
              >
                {inviting ? <FiRefreshCw className="w-3.5 h-3.5 animate-spin" /> : <FiUserPlus className="w-3.5 h-3.5" />}
                Invita
              </button>
            </div>
          </div>
        )}

        {/* Lista Membri */}
        <div className="overflow-x-auto rounded-lg border border-[#243044]">
          <table className="w-full text-sm">
            <thead className="bg-[#141c27]/50">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-400">Membro</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-400">Ruolo</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-400">Aggiunto</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-slate-400">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#243044]">
              {members.map((m) => {
                const info = roleInfo(m.role);
                const isOwner = m.role === "owner";
                const canEditThis = canChangeRole && !m.isMe && !isOwner;
                const canRemoveThis = canRemove && !m.isMe && !isOwner;

                return (
                  <tr key={m.user_id} className="hover:bg-[#141c27]">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-[#243044] flex items-center justify-center overflow-hidden shrink-0">
                          {m.avatarUrl ? (
                            <img src={m.avatarUrl} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <FiUsers className="w-3.5 h-3.5 text-slate-500" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-medium text-slate-200 truncate">
                            {m.displayName}
                            {m.isMe && <span className="ml-1.5 text-[10px] text-blue-400">(tu)</span>}
                          </div>
                          <div className="text-[10px] text-slate-500 truncate">{m.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {canEditThis ? (
                        <select
                          value={m.role}
                          onChange={(e) => changeRole(m.user_id, e.target.value)}
                          className={`px-2 py-1 text-xs rounded-lg border border-[#243044] bg-[#1a2536] text-${info.color}-400 focus:ring-1 focus:ring-blue-500/40 outline-none`}
                        >
                          <option value={m.role}>{info.label}</option>
                          {availableRoles.filter(r => r.value !== m.role).map(r => (
                            <option key={r.value} value={r.value}>{r.label}</option>
                          ))}
                        </select>
                      ) : (
                        <RoleBadge role={m.role} />
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {m.created_at ? new Date(m.created_at).toLocaleDateString("it-IT") : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        {canRemoveThis && (
                          <button
                            onClick={() => removeMember(m.user_id, m.displayName)}
                            className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                            title="Rimuovi membro"
                          >
                            <FiTrash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {members.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-xs text-slate-500">
                    Nessun membro trovato
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Inviti Pendenti */}
        {pendingInvites.length > 0 && (
          <div className="mt-4">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <FiMail className="w-3.5 h-3.5" />
              Inviti Pendenti ({pendingInvites.length})
            </h3>
            <div className="space-y-2">
              {pendingInvites.map(inv => (
                <div key={inv.id} className="flex items-center justify-between px-4 py-2 bg-[#141c27] rounded-lg border border-[#243044]">
                  <div>
                    <span className="text-xs text-slate-300">{inv.email}</span>
                    <span className="ml-2 text-[10px] text-slate-500">→ {roleInfo(inv.role).label}</span>
                  </div>
                  {canInvite && (
                    <button
                      onClick={() => cancelInvite(inv.id)}
                      className="text-xs text-slate-500 hover:text-red-400 transition-colors"
                    >
                      Annulla
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </Section>

      {/* Legenda Ruoli */}
      <Section title="Ruoli Disponibili" desc="Ogni ruolo ha permessi specifici">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {ROLE_OPTIONS.map(r => (
            <div key={r.value} className="p-3 bg-[#141c27] rounded-lg border border-[#243044]">
              <div className="flex items-center gap-2 mb-1">
                <FiShield className={`w-3.5 h-3.5 text-${r.color}-400`} />
                <span className={`text-xs font-medium text-${r.color}-400`}>{r.label}</span>
              </div>
              <p className="text-[10px] text-slate-500">{r.desc}</p>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

function RoleBadge({ role }) {
  const info = roleInfo(role);
  const colorMap = {
    red: "bg-red-500/10 text-red-400",
    purple: "bg-purple-500/10 text-purple-400",
    blue: "bg-blue-500/10 text-blue-400",
    emerald: "bg-emerald-500/10 text-emerald-400",
    slate: "bg-slate-500/10 text-slate-400",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colorMap[info.color] || colorMap.slate}`}>
      {info.label}
    </span>
  );
}

TeamSettings.propTypes = {
  showToast: PropTypes.func,
};

RoleBadge.propTypes = {
  role: PropTypes.string,
};
