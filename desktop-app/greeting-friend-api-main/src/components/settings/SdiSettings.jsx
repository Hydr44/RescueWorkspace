import { useState, useEffect } from "react";
import { FiFileText, FiCheck, FiRefreshCw, FiInfo, FiShield } from "react-icons/fi";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { useOrg } from "@/context/OrgContext";
import { Section, Field } from "@/components/ui/SettingsUI";
import PropTypes from "prop-types";

export default function SdiSettings({ showToast }) {
  const supabase = supabaseBrowser();
  const { orgId, isAdmin } = useOrg();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    sdi_code: "",
    pec: "",
    regime_fiscale: "RF01"
  });

  useEffect(() => {
    async function loadSdiConfig() {
      if (!orgId) return;
      setLoading(true);
      try {
        const { data: row } = await supabase
          .from("org_settings")
          .select("value")
          .eq("org_id", orgId)
          .eq("key", "sdi")
          .maybeSingle();
        
        if (row?.value) {
          setForm(prev => ({
            ...prev,
            ...row.value
          }));
        }
      } catch (err) {
        console.error("[SdiSettings] Error loading config:", err);
      } finally {
        setLoading(false);
      }
    }
    loadSdiConfig();
  }, [orgId]);

  const handleSave = async () => {
    if (!orgId || !isAdmin) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("org_settings")
        .upsert({
          org_id: orgId,
          key: "sdi",
          value: {
            pec: form.pec,
            regime_fiscale: form.regime_fiscale
          },
          updated_at: new Date().toISOString()
        }, { onConflict: "org_id,key" });

      if (error) throw error;
      showToast("success", "Configurazione SDI salvata");
    } catch (err) {
      console.error("[SdiSettings] Save error:", err);
      showToast("error", "Errore salvataggio configurazione SDI");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <FiRefreshCw className="w-5 h-5 animate-spin text-blue-400 mr-2" />
        <span className="text-slate-400 text-sm">Caricamento configurazione SDI...</span>
      </div>
    );
  }

  return (
    <Section title="Fatturazione Elettronica (SDI)" desc="Configura le credenziali e le impostazioni per l'invio al Sistema di Interscambio">
      <div className="space-y-6">
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex gap-3">
          <FiInfo className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-300 leading-relaxed">
            RescueManager utilizza un canale accreditato per la trasmissione delle fatture. 
            Assicurati che la tua <strong>Partita IVA</strong> e il <strong>Regime Fiscale</strong> siano corretti per evitare scarti dal sistema.
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-200">Trasmissione</h3>
            
            <Field label="Codice Destinatario (SDI)" tooltip="Codice gestito dal team RescueManager (env Vercel VITE_SDI_RECIPIENT_CODE). Comunicalo ai tuoi fornitori per ricevere le fatture passive.">
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={import.meta.env.VITE_SDI_RECIPIENT_CODE || ""}
                  placeholder="— non configurato (env mancante) —"
                  className="flex-1 px-3 py-2 text-sm bg-[#141c27] border border-[#243044] rounded-lg text-slate-400 font-mono"
                />
                {import.meta.env.VITE_SDI_RECIPIENT_CODE ? (
                  <span className="px-3 py-2 text-[10px] bg-emerald-500/10 text-emerald-400 rounded-lg flex items-center">ATTIVO</span>
                ) : (
                  <span className="px-3 py-2 text-[10px] bg-amber-500/10 text-amber-400 rounded-lg flex items-center">NON CONFIG</span>
                )}
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Codice fornito da RescueManager. Comunicalo ai fornitori per ricevere le fatture passive.</p>
            </Field>

            <Field label="PEC Destinatario (Alternativo)">
              <input
                type="email"
                value={form.pec}
                onChange={(e) => setForm({ ...form, pec: e.target.value })}
                placeholder="tua-pec@legalmail.it"
                className="w-full px-3 py-2 text-sm bg-[#141c27] border border-[#243044] rounded-lg text-slate-200 outline-none focus:ring-1 focus:ring-blue-500/40"
              />
            </Field>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-200">Impostazioni Fiscali</h3>
            
            <Field label="Regime Fiscale">
              <select
                value={form.regime_fiscale}
                onChange={(e) => setForm({ ...form, regime_fiscale: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-[#141c27] border border-[#243044] rounded-lg text-slate-200 outline-none focus:ring-1 focus:ring-blue-500/40"
              >
                <option value="RF01">RF01 - Ordinario</option>
                <option value="RF02">RF02 - Contribuenti minimi</option>
                <option value="RF19">RF19 - Forfettario</option>
                <option value="RF18">RF18 - Altro</option>
              </select>
            </Field>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-[#243044]">
          <button
            onClick={handleSave}
            disabled={saving || !isAdmin}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition disabled:opacity-50 shadow-lg shadow-blue-600/20"
          >
            {saving ? <FiRefreshCw className="w-4 h-4 animate-spin" /> : <FiCheck className="w-4 h-4" />}
            Salva Configurazione
          </button>
        </div>
      </div>
    </Section>
  );
}

SdiSettings.propTypes = {
  showToast: PropTypes.func.isRequired
};
