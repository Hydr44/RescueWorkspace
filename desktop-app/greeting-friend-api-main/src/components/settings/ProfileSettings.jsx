// src/components/settings/ProfileSettings.jsx
// Sezione Profilo Utente — password, email, avatar, eliminazione account
import { useState, useEffect } from "react";
import { FiUser, FiMail, FiLock, FiCamera, FiCheck, FiAlertCircle, FiRefreshCw } from "react-icons/fi";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { useOrg } from "@/context/OrgContext";
import { Section, Card, Field } from "@/components/ui/SettingsUI";

export default function ProfileSettings({ showToast }) {
  const supabase = supabaseBrowser();
  const { userId } = useOrg();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Form states
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // Password change
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  // Email change
  const [newEmail, setNewEmail] = useState("");
  const [changingEmail, setChangingEmail] = useState(false);


  useEffect(() => {
    loadProfile();
  }, [userId]);

  async function loadProfile() {
    try {
      setLoading(true);
      const { data: { user: authUser } } = await supabase.auth.getUser();
      setUser(authUser);

      if (authUser?.id) {
        const { data: prof } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", authUser.id)
          .maybeSingle();

        setDisplayName(prof?.display_name || prof?.full_name || authUser?.user_metadata?.full_name || "");
        setPhone(prof?.phone || "");
        setAvatarUrl(prof?.avatar_url || authUser?.user_metadata?.avatar_url || "");
      }
    } catch (err) {
      console.error("[ProfileSettings] Error loading profile:", err);
    } finally {
      setLoading(false);
    }
  }

  async function saveProfile() {
    try {
      setSavingProfile(true);

      // Update auth metadata
      const { error: authErr } = await supabase.auth.updateUser({
        data: { full_name: displayName }
      });
      if (authErr) throw authErr;

      // Update profiles table
      if (userId) {
        const { error: profErr } = await supabase
          .from("profiles")
          .update({
            display_name: displayName,
            full_name: displayName,
            phone: phone || null,
            avatar_url: avatarUrl || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", userId);
        if (profErr) console.warn("[ProfileSettings] Profile update warning:", profErr);
      }

      showToast?.("success", "Profilo aggiornato");
    } catch (err) {
      showToast?.("error", err?.message || "Errore aggiornamento profilo");
    } finally {
      setSavingProfile(false);
    }
  }

  async function changePassword() {
    if (!currentPassword) {
      showToast?.("error", "Inserisci la password attuale");
      return;
    }
    if (!newPassword || newPassword.length < 8) {
      showToast?.("error", "La nuova password deve essere di almeno 8 caratteri");
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast?.("error", "Le password non corrispondono");
      return;
    }

    try {
      setChangingPassword(true);

      // Verifica la password attuale ri-autenticandosi
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: user?.email,
        password: currentPassword,
      });
      if (signInErr) {
        showToast?.("error", "Password attuale non corretta");
        return;
      }

      // Aggiorna la password
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      showToast?.("success", "Password aggiornata con successo");
    } catch (err) {
      showToast?.("error", err?.message || "Errore cambio password");
    } finally {
      setChangingPassword(false);
    }
  }

  async function changeEmail() {
    if (!newEmail || !newEmail.includes("@")) {
      showToast?.("error", "Inserisci un indirizzo email valido");
      return;
    }

    try {
      setChangingEmail(true);
      const { error } = await supabase.auth.updateUser({ email: newEmail });
      if (error) throw error;

      setNewEmail("");
      showToast?.("success", "Email di conferma inviata al nuovo indirizzo. Controlla la casella.");
    } catch (err) {
      showToast?.("error", err?.message || "Errore cambio email");
    } finally {
      setChangingEmail(false);
    }
  }

  async function handleAvatarUpload(e) {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    try {
      const ext = file.name.split(".").pop();
      const path = `avatars/${userId}.${ext}`;

      const { error: uploadErr } = await supabase.storage
        .from("public")
        .upload(path, file, { upsert: true });

      if (uploadErr) throw uploadErr;

      const { data: { publicUrl } } = supabase.storage
        .from("public")
        .getPublicUrl(path);

      setAvatarUrl(publicUrl);
      showToast?.("success", "Avatar caricato");
    } catch (err) {
      showToast?.("error", err?.message || "Errore caricamento avatar");
    }
  }


  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <FiRefreshCw className="w-5 h-5 animate-spin text-blue-400" />
        <span className="ml-2 text-sm text-slate-400">Caricamento profilo...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Profilo */}
      <Section title="Il tuo Profilo" desc="Gestisci le informazioni del tuo account personale">
        <div className="space-y-4">
          {/* Avatar + Info base */}
          <div className="flex items-start gap-4">
            <div className="relative group">
              <div className="h-16 w-16 rounded-full border-2 border-[#243044] bg-[#141c27] overflow-hidden flex items-center justify-center">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <FiUser className="w-7 h-7 text-slate-500" />
                )}
              </div>
              <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <FiCamera className="w-4 h-4 text-white" />
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
              </label>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-slate-200">{displayName || "Utente"}</div>
              <div className="text-xs text-slate-500">{user?.email || "—"}</div>
              <div className="text-[10px] text-slate-600 mt-1">
                ID: <code className="bg-[#141c27] px-1 py-0.5 rounded">{userId?.slice(0, 12)}...</code>
              </div>
            </div>
          </div>

          {/* Campi profilo */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Nome Visualizzato" required>
              <input
                type="text"
                className="w-full px-3 py-1.5 text-xs border border-[#243044] rounded-lg bg-[#141c27] text-slate-200 placeholder-slate-500 focus:ring-1 focus:ring-blue-500/40 outline-none"
                placeholder="Mario Rossi"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </Field>
            <Field label="Telefono">
              <input
                type="tel"
                className="w-full px-3 py-1.5 text-xs border border-[#243044] rounded-lg bg-[#141c27] text-slate-200 placeholder-slate-500 focus:ring-1 focus:ring-blue-500/40 outline-none"
                placeholder="+39 333 1234567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </Field>
          </div>

          <div className="flex justify-end">
            <button
              onClick={saveProfile}
              disabled={savingProfile}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {savingProfile ? <FiRefreshCw className="w-3.5 h-3.5 animate-spin" /> : <FiCheck className="w-3.5 h-3.5" />}
              Salva Profilo
            </button>
          </div>
        </div>
      </Section>

      {/* Cambio Password */}
      <Section title="Sicurezza Account" desc="Modifica password e email di accesso">
        <div className="grid md:grid-cols-2 gap-4">
          <Card title="Cambio Password">
            <div className="space-y-3">
              <Field label="Password Attuale" required>
                <input
                  type="password"
                  className="w-full px-3 py-1.5 text-xs border border-[#243044] rounded-lg bg-[#141c27] text-slate-200 placeholder-slate-500 focus:ring-1 focus:ring-blue-500/40 outline-none"
                  placeholder="Inserisci la password attuale"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </Field>
              <Field label="Nuova Password" required>
                <input
                  type="password"
                  className="w-full px-3 py-1.5 text-xs border border-[#243044] rounded-lg bg-[#141c27] text-slate-200 placeholder-slate-500 focus:ring-1 focus:ring-blue-500/40 outline-none"
                  placeholder="Minimo 8 caratteri"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </Field>
              <Field label="Conferma Nuova Password" required>
                <input
                  type="password"
                  className="w-full px-3 py-1.5 text-xs border border-[#243044] rounded-lg bg-[#141c27] text-slate-200 placeholder-slate-500 focus:ring-1 focus:ring-blue-500/40 outline-none"
                  placeholder="Ripeti la nuova password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </Field>
              {newPassword && confirmPassword && newPassword !== confirmPassword && (
                <p className="text-xs text-red-400 flex items-center gap-1">
                  <FiAlertCircle className="w-3 h-3" /> Le password non corrispondono
                </p>
              )}
              <button
                onClick={changePassword}
                disabled={changingPassword || !currentPassword || !newPassword || newPassword !== confirmPassword}
                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {changingPassword ? <FiRefreshCw className="w-3.5 h-3.5 animate-spin" /> : <FiLock className="w-3.5 h-3.5" />}
                Aggiorna Password
              </button>
            </div>
          </Card>

          <Card title="Cambio Email">
            <div className="space-y-3">
              <div className="text-xs text-slate-500 mb-2">
                Email attuale: <span className="text-slate-300 font-medium">{user?.email || "—"}</span>
              </div>
              <Field label="Nuova Email" required>
                <input
                  type="email"
                  className="w-full px-3 py-1.5 text-xs border border-[#243044] rounded-lg bg-[#141c27] text-slate-200 placeholder-slate-500 focus:ring-1 focus:ring-blue-500/40 outline-none"
                  placeholder="nuova@email.it"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                />
              </Field>
              <p className="text-[10px] text-slate-600">
                Riceverai un'email di conferma al nuovo indirizzo.
              </p>
              <button
                onClick={changeEmail}
                disabled={changingEmail || !newEmail}
                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {changingEmail ? <FiRefreshCw className="w-3.5 h-3.5 animate-spin" /> : <FiMail className="w-3.5 h-3.5" />}
                Aggiorna Email
              </button>
            </div>
          </Card>
        </div>
      </Section>

      {/* Info account */}
      <Section title="Informazioni Account" desc="Dettagli del tuo account">
        <div className="bg-[#141c27] rounded-lg border border-[#243044] p-4">
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-500">Email:</span>
              <span className="ml-2 text-slate-300 font-medium">{user?.email || "—"}</span>
            </div>
            <div>
              <span className="text-slate-500">Creato il:</span>
              <span className="ml-2 text-slate-300">
                {user?.created_at ? new Date(user.created_at).toLocaleDateString("it-IT") : "—"}
              </span>
            </div>
            <div>
              <span className="text-slate-500">Ultimo accesso:</span>
              <span className="ml-2 text-slate-300">
                {user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"}
              </span>
            </div>
            <div>
              <span className="text-slate-500">Provider:</span>
              <span className="ml-2 text-slate-300">{user?.app_metadata?.provider || "email"}</span>
            </div>
          </div>
          <p className="text-[10px] text-slate-600 mt-3">
            Per eliminare il tuo account, contatta il supporto all'indirizzo info@rescuemanager.eu
          </p>
        </div>
      </Section>
    </div>
  );
}
