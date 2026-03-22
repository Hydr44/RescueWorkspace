/**
 * Users List Page — Design L aligned
 * Gestione lista utenti, operatori desktop e utenti mobile
 * Visibile solo per admin/owner
 *
 * @author haxies
 * @created 2025
 */

import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiTrash2, FiPlus, FiSearch, FiUsers, FiEdit,
  FiUserCheck, FiUserX, FiPause, FiPlay, FiSend,
  FiRefreshCw, FiAlertCircle, FiMonitor, FiSmartphone,
  FiShield
} from "react-icons/fi";
import { supabaseBrowser } from "../lib/supabase-browser";
import { useOrg } from "../context/OrgContext";

/* ─── Costanti ─── */
const ROLE_MAP = {
  admin:      { label: "Admin",       cls: "bg-red-500/10 text-red-400" },
  dispatcher: { label: "Dispatcher",  cls: "bg-blue-500/10 text-blue-400" },
  autista:    { label: "Autista",     cls: "bg-emerald-500/10 text-emerald-400" },
  meccanico:  { label: "Meccanico",   cls: "bg-amber-500/10 text-amber-400" },
  viewer:     { label: "Solo Lettura", cls: "bg-[#243044] text-slate-300" },
};

const STATUS_MAP = {
  attivo:   { label: "Attivo",   cls: "bg-emerald-500/10 text-emerald-400" },
  sospeso:  { label: "Sospeso",  cls: "bg-red-500/10 text-red-400" },
  invitato: { label: "Invitato", cls: "bg-amber-500/10 text-amber-400" },
};

const ROLE_FILTERS = [
  { value: "all",        label: "Tutti" },
  { value: "admin",      label: "Admin" },
  { value: "dispatcher", label: "Dispatcher" },
  { value: "autista",    label: "Autista" },
  { value: "meccanico",  label: "Meccanico" },
  { value: "viewer",     label: "Viewer" },
];

const STATUS_FILTERS = [
  { value: "all",      label: "Tutti" },
  { value: "attivo",   label: "Attivi" },
  { value: "sospeso",  label: "Sospesi" },
  { value: "invitato", label: "Invitati" },
];

const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit", year: "2-digit" }) : "—";

/* ─── Badge helpers ─── */
function RoleBadge({ role }) {
  const r = ROLE_MAP[role] || ROLE_MAP.viewer;
  return <span className={`inline-flex items-center h-5 px-2 rounded text-[10px] font-medium ${r.cls}`}>{r.label}</span>;
}

function UserStatusBadge({ status }) {
  const s = STATUS_MAP[status] || { label: status, cls: "bg-[#243044] text-slate-300" };
  return <span className={`inline-flex items-center h-5 px-2 rounded text-[10px] font-medium ${s.cls}`}>{s.label}</span>;
}

/* ─── Avatar ─── */
function Avatar({ name }) {
  const initials = name?.trim()
    ? name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";
  return (
    <div className="w-7 h-7 rounded-full bg-blue-600/80 flex items-center justify-center text-[10px] font-semibold text-white flex-shrink-0">
      {initials}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════ */

export default function Users() {
  const navigate = useNavigate();
  const supabase = supabaseBrowser();
  const { orgId, isAdmin } = useOrg();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showConfirm, setShowConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  const fetchUsers = useCallback(async () => {
    if (!orgId) return;
    setRefreshing(true);
    setError(null);
    try {
      let query = supabase
        .from("users")
        .select("*")
        .eq("org_id", orgId)
        .order("created_at", { ascending: false });

      if (filterRole !== "all") query = query.eq("ruolo", filterRole);
      if (filterStatus !== "all") query = query.eq("stato", filterStatus);
      if (searchTerm) query = query.or(`nome.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);

      const { data, error: fetchErr } = await query;
      if (fetchErr) throw fetchErr;
      setUsers(data || []);
    } catch (err) {
      console.error("Error fetching users:", err);
      setError("Errore durante il caricamento degli utenti.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [orgId, filterRole, filterStatus, searchTerm, supabase]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleDelete = async () => {
    if (!userToDelete) return;
    try {
      const { error: delErr } = await supabase
        .from("users")
        .delete()
        .eq("id", userToDelete.id)
        .eq("org_id", orgId);
      if (delErr) throw delErr;
      setUsers(prev => prev.filter(u => u.id !== userToDelete.id));
      setShowConfirm(false);
      setUserToDelete(null);
    } catch (err) {
      console.error("Error deleting user:", err);
      setError("Errore durante l'eliminazione dell'utente.");
    }
  };

  const handleToggleStatus = async (user) => {
    try {
      const newStatus = user.stato === "attivo" ? "sospeso" : "attivo";
      const { error: updErr } = await supabase
        .from("users")
        .update({ stato: newStatus })
        .eq("id", user.id)
        .eq("org_id", orgId);
      if (updErr) throw updErr;
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, stato: newStatus } : u));
    } catch (err) {
      console.error("Error updating user status:", err);
      setError("Errore durante l'aggiornamento dello stato.");
    }
  };

  const stats = useMemo(() => {
    const total = users.length;
    const active = users.filter(u => u.stato === "attivo").length;
    const suspended = users.filter(u => u.stato === "sospeso").length;
    const invited = users.filter(u => u.stato === "invitato").length;
    return { total, active, suspended, invited };
  }, [users]);

  // Guard: solo admin/owner possono accedere (DOPO tutti gli hooks)
  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <FiShield className="w-12 h-12 text-slate-600 mb-4" />
        <h2 className="text-lg font-semibold text-slate-300 mb-2">Accesso Limitato</h2>
        <p className="text-xs text-slate-500 text-center max-w-sm">
          Solo gli amministratori possono gestire utenti e ruoli. Contatta un admin della tua organizzazione.
        </p>
      </div>
    );
  }

  /* ─── Loading skeleton ─── */
  if (loading) {
    return (
      <div className="space-y-5 animate-pulse">
        <div><div className="h-5 w-48 bg-[#243044] rounded mb-1.5" /><div className="h-3 w-72 bg-[#1a2536] rounded" /></div>
        <div className="grid grid-cols-4 gap-3">
          {[1,2,3,4].map(i => <div key={i} className="h-[72px] bg-[#1a2536] rounded-xl border border-[#243044]" />)}
        </div>
        <div className="h-10 bg-[#1a2536] rounded-xl border border-[#243044]" />
        {[1,2,3,4,5].map(i => <div key={i} className="h-12 bg-[#1a2536] rounded-xl border border-[#243044]" />)}
      </div>
    );
  }

  return (
    <div className="space-y-5">

      {/* ── Header compatto ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-100">Utenti e Ruoli</h1>
          <p className="text-xs text-slate-500 mt-0.5">Gestisci utenti, operatori desktop e utenti mobile</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchUsers}
            disabled={refreshing}
            className="h-8 px-3 text-xs font-medium text-slate-400 bg-[#1a2536] border border-[#243044] rounded-lg hover:bg-[#1e2b3d] transition disabled:opacity-50"
          >
            <FiRefreshCw className={`w-3.5 h-3.5 inline mr-1 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "..." : "Aggiorna"}
          </button>
          <button
            onClick={() => navigate("/utenti/new")}
            className="h-8 px-3.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition shadow-sm shadow-blue-600/20"
          >
            <FiPlus className="w-3.5 h-3.5 inline mr-1" />
            Nuovo
          </button>
        </div>
      </div>

      {/* ── Content ── */}

          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-[#1a2536] rounded-xl border border-[#243044] p-4 hover:border-blue-500/30 transition">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center mb-2">
                <FiUsers className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-xl font-semibold text-slate-100">{stats.total}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Totale Utenti</div>
            </div>
            <div className="bg-[#1a2536] rounded-xl border border-[#243044] p-4 hover:border-emerald-500/30 transition">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-2">
                <FiUserCheck className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-xl font-semibold text-slate-100">{stats.active}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Attivi</div>
            </div>
            <div className="bg-[#1a2536] rounded-xl border border-[#243044] p-4 hover:border-red-500/30 transition">
              <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center mb-2">
                <FiUserX className="w-4 h-4 text-red-400" />
              </div>
              <div className="text-xl font-semibold text-slate-100">{stats.suspended}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Sospesi</div>
            </div>
            <div className="bg-[#1a2536] rounded-xl border border-[#243044] p-4 hover:border-amber-500/30 transition">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center mb-2">
                <FiSend className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-xl font-semibold text-slate-100">{stats.invited}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Invitati</div>
            </div>
          </div>

          {/* Toolbar filtri */}
          <div className="bg-[#1a2536] rounded-xl border border-[#243044] px-4 py-2.5">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[180px]">
                <FiSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 w-3 h-3" />
                <input
                  type="text"
                  placeholder="Cerca nome o email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-7 pl-7 pr-3 text-[11px] border border-[#243044] rounded-md bg-[#141c27] text-slate-200 placeholder-slate-600 focus:ring-1 focus:ring-blue-500/30 focus:border-blue-500/30 outline-none transition"
                />
              </div>
              <div className="flex gap-0.5 rounded-lg border border-[#243044] p-0.5 bg-[#141c27]/40">
                {ROLE_FILTERS.map(f => (
                  <button
                    key={f.value}
                    onClick={() => setFilterRole(f.value)}
                    className={`h-6 px-2 rounded-md text-[10px] font-medium transition ${
                      filterRole === f.value
                        ? "bg-blue-600 text-white"
                        : "text-slate-400 hover:bg-[#1e2b3d]"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              <div className="flex gap-0.5 rounded-lg border border-[#243044] p-0.5 bg-[#141c27]/40">
                {STATUS_FILTERS.map(f => (
                  <button
                    key={f.value}
                    onClick={() => setFilterStatus(f.value)}
                    className={`h-6 px-2 rounded-md text-[10px] font-medium transition ${
                      filterStatus === f.value
                        ? "bg-blue-600 text-white"
                        : "text-slate-400 hover:bg-[#1e2b3d]"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Errore */}
          {error && (
            <div className="bg-red-500/5 rounded-xl border border-red-500/15 px-4 py-3">
              <div className="flex items-center gap-2.5">
                <FiAlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <span className="text-xs text-red-400">{error}</span>
              </div>
            </div>
          )}

          {/* Tabella */}
          {users.length > 0 && (
            <div className="bg-[#1a2536] rounded-xl border border-[#243044] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-[#141c27]">
                      {["Utente", "Email", "Ruolo", "Accesso", "Stato", "Creato", ""].map(h => (
                        <th key={h} className={`px-3 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider ${h === "" ? "text-right" : "text-left"}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#243044]/60">
                    {users.map(user => (
                      <tr key={user.id} className="hover:bg-[#141c27]/60 transition-colors">
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2.5">
                            <Avatar name={user.nome} />
                            <div className="min-w-0">
                              <div className="text-xs font-medium text-slate-200 truncate">{user.nome || "—"}</div>
                              <div className="text-[10px] text-slate-600 truncate">#{String(user.id).slice(-6)}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-xs text-slate-400 truncate max-w-[180px]">{user.email || "—"}</td>
                        <td className="px-3 py-2"><RoleBadge role={user.ruolo} /></td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-1">
                            {user.accesso_desktop && (
                              <span className="inline-flex items-center gap-0.5 h-5 px-1.5 rounded text-[10px] font-medium bg-blue-500/10 text-blue-400" title="Desktop App">
                                <FiMonitor className="w-2.5 h-2.5" /> Desktop
                              </span>
                            )}
                            {user.accesso_mobile && (
                              <span className="inline-flex items-center gap-0.5 h-5 px-1.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400" title="RescueMobile">
                                <FiSmartphone className="w-2.5 h-2.5" /> Mobile
                              </span>
                            )}
                            {!user.accesso_desktop && !user.accesso_mobile && (
                              <span className="text-[10px] text-slate-600">—</span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2"><UserStatusBadge status={user.stato} /></td>
                        <td className="px-3 py-2 text-xs text-slate-500">{fmtDate(user.created_at)}</td>
                        <td className="px-3 py-2">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => navigate(`/utenti/${user.id}`)}
                              className="w-6 h-6 flex items-center justify-center rounded text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 transition"
                              title="Modifica"
                            >
                              <FiEdit className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleToggleStatus(user)}
                              className={`w-6 h-6 flex items-center justify-center rounded transition ${
                                user.stato === "attivo"
                                  ? "text-slate-500 hover:text-amber-400 hover:bg-amber-500/10"
                                  : "text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10"
                              }`}
                              title={user.stato === "attivo" ? "Sospendi" : "Attiva"}
                            >
                              {user.stato === "attivo" ? <FiPause className="w-3 h-3" /> : <FiPlay className="w-3 h-3" />}
                            </button>
                            <button
                              onClick={() => { setUserToDelete(user); setShowConfirm(true); }}
                              className="w-6 h-6 flex items-center justify-center rounded text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition"
                              title="Elimina"
                            >
                              <FiTrash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Stato vuoto */}
          {!error && users.length === 0 && !loading && (
            <div className="flex flex-col items-center justify-center py-16 bg-[#1a2536] rounded-xl border border-[#243044]">
              <FiUsers className="w-10 h-10 text-slate-600 mb-3" />
              <p className="text-sm font-medium text-slate-400 mb-1">Nessun utente trovato</p>
              <p className="text-[10px] text-slate-600 mb-4">Nessun utente corrisponde ai filtri selezionati</p>
              <button
                onClick={() => navigate("/utenti/new")}
                className="h-7 px-3 text-[10px] font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition"
              >
                <FiPlus className="w-3 h-3 inline mr-1" />
                Nuovo Utente
              </button>
            </div>
          )}

      {/* ── Dialog conferma eliminazione ── */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <button
            className="absolute inset-0 bg-black/60 backdrop-blur-sm border-none cursor-pointer"
            onClick={() => { setShowConfirm(false); setUserToDelete(null); }}
            aria-label="Chiudi"
            type="button"
          />
          <div className="relative w-full max-w-sm rounded-xl border border-[#243044] bg-[#1a2536] p-5">
            <div className="text-sm font-semibold text-slate-200 mb-1.5">Conferma eliminazione</div>
            <div className="text-xs text-slate-400 mb-5">
              Sei sicuro di voler eliminare <span className="text-slate-200 font-medium">{userToDelete?.nome || userToDelete?.email}</span>? L'azione non può essere annullata.
            </div>
            <div className="flex justify-end gap-2">
              <button
                className="h-8 px-3 text-xs font-medium text-slate-400 bg-[#141c27] border border-[#243044] rounded-lg hover:bg-[#1e2b3d] transition"
                onClick={() => { setShowConfirm(false); setUserToDelete(null); }}
              >
                Annulla
              </button>
              <button
                className="h-8 px-3 text-xs font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition"
                onClick={handleDelete}
              >
                Elimina
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}