import { useState, useEffect } from "react";
import { FiBell, FiCheck, FiX, FiRefreshCw } from "react-icons/fi";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { useOrg } from "@/context/OrgContext";

const Section = ({ title, desc, children }) => (
  <div className="mb-6">
    <h3 className="text-sm font-semibold text-slate-200 mb-1">{title}</h3>
    {desc && <p className="text-xs text-slate-500 mb-3">{desc}</p>}
    {children}
  </div>
);

const Toggle = ({ label, description, enabled, onChange, disabled }) => (
  <div className="flex items-center justify-between py-3 px-4 bg-[#141c27] rounded-lg border border-[#243044]">
    <div className="flex-1">
      <div className="text-sm font-medium text-slate-200">{label}</div>
      {description && <div className="text-xs text-slate-500 mt-0.5">{description}</div>}
    </div>
    <button
      onClick={() => onChange(!enabled)}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        enabled ? "bg-blue-600" : "bg-slate-600"
      } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          enabled ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  </div>
);

export default function NotificationSettings({ showToast }) {
  const { orgId, orgName } = useOrg();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Impostazioni notifiche email
  const [settings, setSettings] = useState({
    // Notifiche automatiche
    scadenze_veicoli: true,
    trasporti_assegnati: true,
    solleciti_fatture: true,
    
    // Invio documenti
    invio_fatture_auto: false,
    invio_preventivi_auto: false,
    
    // Email destinatari
    email_notifiche_admin: "",
    email_cc_documenti: "",
  });

  useEffect(() => {
    loadSettings();
  }, [orgId]);

  async function loadSettings() {
    if (!orgId) return;
    
    try {
      setLoading(true);
      
      const supabase = supabaseBrowser();
      const { data, error } = await supabase
        .from("org_settings")
        .select("value")
        .eq("org_id", orgId)
        .eq("key", "email_notifications")
        .maybeSingle();

      if (error && error.code !== "PGRST116") throw error;

      if (data?.value) {
        setSettings(prev => ({ ...prev, ...data.value }));
      }
    } catch (err) {
      console.error("[NotificationSettings] Error loading:", err);
      showToast?.("error", "Errore caricamento impostazioni");
    } finally {
      setLoading(false);
    }
  }

  async function saveSettings() {
    if (!orgId) return;

    try {
      setSaving(true);

      const supabase = supabaseBrowser();
      const { error } = await supabase
        .from("org_settings")
        .upsert({
          org_id: orgId,
          key: "email_notifications",
          value: settings,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      showToast?.("success", "Impostazioni salvate");
    } catch (err) {
      console.error("[NotificationSettings] Error saving:", err);
      showToast?.("error", err?.message || "Errore salvataggio");
    } finally {
      setSaving(false);
    }
  }

  function updateSetting(key, value) {
    setSettings(prev => ({ ...prev, [key]: value }));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <FiRefreshCw className="w-5 h-5 animate-spin text-blue-400" />
        <span className="ml-2 text-sm text-slate-400">Caricamento impostazioni...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Section
        title="Notifiche Email Automatiche"
        desc={`Le notifiche vengono inviate da noreply@rescuemanager.eu per conto di "${orgName}"`}
      >
        <div className="space-y-2">
          <Toggle
            label="Scadenze Veicoli"
            description="Notifica via email quando revisione, assicurazione o bollo stanno per scadere"
            enabled={settings.scadenze_veicoli}
            onChange={(val) => updateSetting("scadenze_veicoli", val)}
          />
          
          <Toggle
            label="Trasporti Assegnati"
            description="Notifica agli autisti quando viene assegnato un nuovo trasporto"
            enabled={settings.trasporti_assegnati}
            onChange={(val) => updateSetting("trasporti_assegnati", val)}
          />
          
          <Toggle
            label="Solleciti Fatture"
            description="Invia promemoria automatici ai clienti per fatture in scadenza o scadute"
            enabled={settings.solleciti_fatture}
            onChange={(val) => updateSetting("solleciti_fatture", val)}
          />
        </div>
      </Section>

      <div className="flex items-center gap-3 pt-4 border-t border-[#243044]">
        <button
          onClick={saveSettings}
          disabled={saving}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {saving ? (
            <>
              <FiRefreshCw className="w-4 h-4 animate-spin" />
              Salvataggio...
            </>
          ) : (
            <>
              <FiCheck className="w-4 h-4" />
              Salva Impostazioni
            </>
          )}
        </button>

        <button
          onClick={loadSettings}
          disabled={saving}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-200 transition-colors"
        >
          <FiX className="w-4 h-4" />
          Annulla
        </button>
      </div>

      <div className="mt-6 p-4 bg-slate-800/30 border border-slate-700/50 rounded-lg">
        <div className="flex items-start gap-3">
          <FiBell className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
          <div className="text-xs text-slate-400 space-y-2">
            <p>
              <strong className="text-slate-300">Come funziona:</strong>
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Tutte le email vengono inviate da <code className="text-blue-400">noreply@rescuemanager.eu</code></li>
              <li>Il nome della tua organizzazione viene incluso automaticamente</li>
              <li>Le email hanno un template professionale con il tuo branding</li>
              <li>Puoi inviare manualmente fatture e preventivi anche se l'invio automatico è disattivato</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
