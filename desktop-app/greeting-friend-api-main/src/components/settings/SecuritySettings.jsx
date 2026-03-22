// src/components/settings/SecuritySettings.jsx
// Sezione Sicurezza — sessioni, controlli sicurezza, audit log
import { useState, useEffect } from "react";
import { FiShield, FiMonitor, FiLogOut, FiRefreshCw, FiClock, FiAlertTriangle, FiLock, FiKey, FiUser } from "react-icons/fi";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { useOrg } from "@/context/OrgContext";
import { Section, Card } from "@/components/ui/SettingsUI";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";

export default function SecuritySettings({ showToast }) {
  const supabase = supabaseBrowser();
  const { orgId } = useOrg();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    loadUserAndLogs();
  }, [orgId]);

  async function loadUserAndLogs() {
    try {
      setLoadingLogs(true);

      // Carica dati utente per i security checks
      const { data: { user: authUser } } = await supabase.auth.getUser();
      setUser(authUser);

      // Prova a caricare audit log (ignora se tabella non esiste)
      if (orgId) {
        try {
          const { data, error } = await supabase
            .from("staff_audit_log")
            .select("id, action, details, created_at")
            .eq("org_id", orgId)
            .order("created_at", { ascending: false })
            .limit(20);

          if (!error) setAuditLogs(data || []);
        } catch {
          // Tabella potrebbe non esistere ancora
        }
      }
    } catch (err) {
      console.error("[SecuritySettings] Error:", err);
    } finally {
      setLoadingLogs(false);
    }
  }

  async function signOutAllDevices() {
    if (!confirm("Verrai disconnesso da tutti i dispositivi. Continuare?")) return;
    try {
      setSigningOut(true);
      const { error } = await supabase.auth.signOut({ scope: "global" });
      if (error) throw error;
      showToast?.("success", "Disconnesso da tutti i dispositivi");
    } catch (err) {
      showToast?.("error", err?.message || "Errore disconnessione");
    } finally {
      setSigningOut(false);
    }
  }

  // Calcola security checks dinamici
  const emailVerified = !!user?.email_confirmed_at;
  const hasRecentLogin = !!user?.last_sign_in_at;
  const lastLoginDate = user?.last_sign_in_at ? new Date(user.last_sign_in_at) : null;
  const daysSinceLogin = lastLoginDate ? Math.floor((Date.now() - lastLoginDate.getTime()) / 86400000) : null;
  const provider = user?.app_metadata?.provider || "email";
  const isPasswordAuth = provider === "email";

  return (
    <div className="space-y-4">
      {/* Sessione Corrente */}
      <Section title="Sicurezza Account" desc="Gestisci sessioni e impostazioni di sicurezza">
        <div className="grid md:grid-cols-2 gap-3">
          {/* Sessione attiva */}
          <Card title="Sessione Corrente">
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-[#141c27] rounded-lg border border-emerald-500/20">
                <FiMonitor className="w-5 h-5 text-emerald-400 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-medium text-slate-200">Questo dispositivo</div>
                  <div className="text-[10px] text-slate-500">
                    {navigator.userAgent.includes("Electron") ? "Desktop App (Electron)" : "Browser Web"}
                  </div>
                  <div className="text-[10px] text-emerald-400 mt-0.5">Sessione attiva</div>
                  {lastLoginDate && (
                    <div className="text-[10px] text-slate-600 mt-0.5">
                      Ultimo accesso: {lastLoginDate.toLocaleString("it-IT", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={signOutAllDevices}
                disabled={signingOut}
                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-400 bg-red-500/10 rounded-lg hover:bg-red-500/20 transition-colors"
              >
                {signingOut ? <FiRefreshCw className="w-3.5 h-3.5 animate-spin" /> : <FiLogOut className="w-3.5 h-3.5" />}
                Disconnetti tutti i dispositivi
              </button>
            </div>
          </Card>

          {/* Azioni rapide sicurezza */}
          <Card title="Azioni Rapide">
            <div className="space-y-2">
              <button
                onClick={() => navigate("/settings?tab=profile")}
                className="w-full flex items-center gap-3 p-3 bg-[#141c27] rounded-lg border border-[#243044] hover:border-blue-500/30 transition-colors text-left"
              >
                <FiKey className="w-4 h-4 text-blue-400 shrink-0" />
                <div>
                  <div className="text-xs font-medium text-slate-200">Cambia Password</div>
                  <div className="text-[10px] text-slate-500">Vai al profilo per aggiornare la password</div>
                </div>
              </button>
              <button
                onClick={() => navigate("/settings?tab=profile")}
                className="w-full flex items-center gap-3 p-3 bg-[#141c27] rounded-lg border border-[#243044] hover:border-blue-500/30 transition-colors text-left"
              >
                <FiUser className="w-4 h-4 text-blue-400 shrink-0" />
                <div>
                  <div className="text-xs font-medium text-slate-200">Gestisci Profilo</div>
                  <div className="text-[10px] text-slate-500">Aggiorna email, nome e avatar</div>
                </div>
              </button>
              <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg">
                <div className="flex items-start gap-2">
                  <FiLock className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                  <p className="text-[10px] text-amber-400">
                    2FA (TOTP) sarà disponibile in un prossimo aggiornamento.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </Section>

      {/* Controlli Sicurezza Dinamici */}
      <Section title="Stato Sicurezza" desc="Verifica lo stato di sicurezza del tuo account">
        <div className="space-y-2">
          <SecurityCheck
            label="Email verificata"
            ok={emailVerified}
            desc={emailVerified ? `Email ${user?.email} verificata` : "La tua email non è ancora verificata"}
          />
          <SecurityCheck
            label={isPasswordAuth ? "Autenticazione con password" : `Autenticazione con ${provider}`}
            ok={true}
            desc={isPasswordAuth ? "Accesso tramite email e password" : `Accesso tramite provider ${provider}`}
          />
          <SecurityCheck
            label="Autenticazione a due fattori"
            ok={false}
            desc="Non ancora disponibile — consigliamo una password forte e unica"
          />
          {hasRecentLogin && (
            <SecurityCheck
              label="Attività recente"
              ok={daysSinceLogin <= 30}
              desc={daysSinceLogin === 0 ? "Ultimo accesso oggi" : `Ultimo accesso ${daysSinceLogin} giorni fa`}
            />
          )}
          <SecurityCheck
            label="Account attivo"
            ok={true}
            desc={`Account creato il ${user?.created_at ? new Date(user.created_at).toLocaleDateString("it-IT") : "—"}`}
          />
        </div>
      </Section>

      {/* Audit Log */}
      <Section title="Log Attività" desc="Ultime azioni registrate nella tua organizzazione">
        {loadingLogs ? (
          <div className="flex items-center justify-center py-8">
            <FiRefreshCw className="w-4 h-4 animate-spin text-blue-400" />
            <span className="ml-2 text-xs text-slate-400">Caricamento log...</span>
          </div>
        ) : auditLogs.length > 0 ? (
          <div className="space-y-1">
            {auditLogs.map(log => (
              <div key={log.id} className="flex items-center gap-3 px-3 py-2 bg-[#141c27] rounded-lg border border-[#243044]">
                <FiClock className="w-3 h-3 text-slate-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-xs text-slate-300">{log.action}</span>
                  {log.details && (
                    <span className="ml-2 text-[10px] text-slate-500">{typeof log.details === "string" ? log.details : JSON.stringify(log.details)}</span>
                  )}
                </div>
                <span className="text-[10px] text-slate-600 shrink-0">
                  {new Date(log.created_at).toLocaleString("it-IT", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <FiShield className="w-6 h-6 text-slate-500 mx-auto mb-2" />
            <p className="text-xs text-slate-500">Nessuna attività registrata</p>
            <p className="text-[10px] text-slate-600 mt-1">
              Le azioni importanti verranno registrate qui automaticamente
            </p>
          </div>
        )}
      </Section>
    </div>
  );
}

function SecurityCheck({ label, ok, desc }) {
  return (
    <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border ${
      ok ? "border-emerald-500/20 bg-emerald-500/5" : "border-amber-500/20 bg-amber-500/5"
    }`}>
      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
        ok ? "bg-emerald-500/20" : "bg-amber-500/20"
      }`}>
        {ok ? (
          <FiShield className="w-3 h-3 text-emerald-400" />
        ) : (
          <FiAlertTriangle className="w-3 h-3 text-amber-400" />
        )}
      </div>
      <div className="min-w-0">
        <div className={`text-xs font-medium ${ok ? "text-emerald-400" : "text-amber-400"}`}>{label}</div>
        <div className="text-[10px] text-slate-500">{desc}</div>
      </div>
    </div>
  );
}

SecuritySettings.propTypes = {
  showToast: PropTypes.func,
};

SecurityCheck.propTypes = {
  label: PropTypes.string.isRequired,
  ok: PropTypes.bool.isRequired,
  desc: PropTypes.string,
};
