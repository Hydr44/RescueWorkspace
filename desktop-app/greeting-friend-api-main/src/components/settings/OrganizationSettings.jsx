// src/components/settings/OrganizationSettings.jsx
// Gestione completa organizzazione: dettagli, statistiche, personalizzazione, moduli attivi
import { useState, useEffect, useCallback } from "react";
import {
  FiUsers, FiTruck, FiFileText, FiEdit3, FiCheck, FiX, FiCopy,
  FiRefreshCw, FiTrash2, FiShield, FiActivity, FiCalendar, FiClock,
  FiMapPin, FiPhone, FiMail, FiGlobe,
  FiAlertTriangle, FiHash
} from "react-icons/fi";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { useOrg } from "@/context/OrgContext";
import { Section, Field } from "@/components/ui/SettingsUI";
import PropTypes from "prop-types";

const PROVINCES = [
  "AG","AL","AN","AO","AR","AP","AT","AV","BA","BT","BL","BN","BG","BI","BO","BZ","BS","BR",
  "CA","CL","CB","CE","CT","CZ","CH","CO","CS","CR","KR","CN","EN","FM","FE","FI","FG","FC",
  "FR","GE","GO","GR","IM","IS","SP","AQ","LT","LE","LC","LI","LO","LU","MC","MN","MS","MT",
  "ME","MI","MO","MB","NA","NO","NU","OR","PD","PA","PR","PV","PG","PU","PE","PC","PI","PT",
  "PN","PZ","PO","RG","RA","RC","RE","RI","RN","RM","RO","SA","SS","SV","SI","SR","SO","SU",
  "TA","TE","TR","TO","TP","TN","TV","TS","UD","VA","VE","VB","VC","VR","VV","VI","VT"
];

export default function OrganizationSettings({ showToast }) {
  const supabase = supabaseBrowser();
  const { orgId, orgName, orgs, role, isOwner, isAdmin, setCurrentOrg, refresh } = useOrg();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState(null);
  const [orgDetails, setOrgDetails] = useState(null);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState("");
  const [orgSettings, setOrgSettings] = useState({});
  const [activeSection, setActiveSection] = useState("overview");

  // Load org details + stats
  const loadOrgData = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    try {
      // Load org record
      const { data: org } = await supabase
        .from("orgs")
        .select("*")
        .eq("id", orgId)
        .maybeSingle();
      setOrgDetails(org);

      // Load org_settings
      const { data: settings } = await supabase
        .from("org_settings")
        .select("*")
        .eq("org_id", orgId)
        .maybeSingle();
      setOrgSettings(settings || {});

      // Load stats in parallel (each wrapped to avoid crash if table missing)
      const safeCount = async (table) => {
        try {
          const { count } = await supabase.from(table).select("*", { count: "exact", head: true }).eq("org_id", orgId);
          return count || 0;
        } catch { return 0; }
      };

      const [members, clients, transports, invoices, vehicles, quotes] = await Promise.all([
        safeCount("org_members"),
        safeCount("clients"),
        safeCount("transports"),
        safeCount("invoices"),
        safeCount("vehicles"),
        safeCount("quotes"),
      ]);

      setStats({ members, clients, transports, invoices, vehicles, quotes });
    } catch (err) {
      console.error("[OrganizationSettings] Error loading org data:", err);
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    loadOrgData();
  }, [loadOrgData]);

  // Rename org
  const handleRename = async () => {
    const trimmed = newName.trim();
    if (!trimmed || trimmed === orgName) {
      setEditingName(false);
      return;
    }
    try {
      setSaving(true);
      const { error } = await supabase
        .from("orgs")
        .update({ name: trimmed })
        .eq("id", orgId);
      if (error) throw error;
      await refresh({ keepLoading: true });
      setEditingName(false);
      showToast?.("success", "Nome organizzazione aggiornato");
    } catch (err) {
      console.error("[OrganizationSettings] Rename error:", err);
      showToast?.("error", err.message || "Errore durante la rinomina");
    } finally {
      setSaving(false);
    }
  };

  // Save org_settings fields
  const saveOrgSettings = async (fields) => {
    if (!orgId || !isAdmin) return;
    try {
      setSaving(true);
      const updatedSettings = { ...orgSettings, ...fields };
      setOrgSettings(updatedSettings);

      const { error } = await supabase
        .from("org_settings")
        .upsert({
          org_id: orgId,
          ...fields,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: "org_id"
        });

      if (error) {
        const { error: updateErr } = await supabase
          .from("org_settings")
          .update({ ...fields, updated_at: new Date().toISOString() })
          .eq("org_id", orgId);
        if (updateErr) throw updateErr;
      }
      showToast?.("success", "Impostazioni salvate");
    } catch (err) {
      console.error("[OrganizationSettings] Save settings error:", err);
      showToast?.("error", "Errore salvataggio impostazioni");
    } finally {
      setSaving(false);
    }
  };

  // Delete org
  const handleDeleteOrg = async () => {
    if (!orgId || !isOwner) return;
    const confirmMsg = `ATTENZIONE: Stai per eliminare "${orgName}".\n\nTutti i dati (clienti, trasporti, fatture, veicoli) verranno eliminati permanentemente.\n\nDigita "${orgName}" per confermare:`;
    const input = window.prompt(confirmMsg);
    if (input !== orgName) {
      if (input !== null) showToast?.("error", "Nome non corrispondente. Eliminazione annullata.");
      return;
    }
    try {
      const { error } = await supabase.from("orgs").delete().eq("id", orgId);
      if (error) throw error;
      await setCurrentOrg(null);
      await refresh();
      showToast?.("success", "Organizzazione eliminata");
    } catch (err) {
      showToast?.("error", err.message || "Errore durante l'eliminazione");
    }
  };

  // Copy ID to clipboard
  const copyOrgId = () => {
    navigator.clipboard.writeText(orgId).then(() => {
      showToast?.("success", "ID copiato negli appunti");
    }).catch(() => {
      showToast?.("error", "Errore copia ID");
    });
  };

  const currentOrg = orgs.find(o => o.id === orgId);
  const orgNumber = currentOrg?.number ? `ORG${String(currentOrg.number).padStart(4, "0")}` : null;
  const createdAt = orgDetails?.created_at ? new Date(orgDetails.created_at).toLocaleDateString("it-IT", { day: "2-digit", month: "long", year: "numeric" }) : "—";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <FiRefreshCw className="w-5 h-5 animate-spin text-blue-400 mr-2" />
        <span className="text-slate-400 text-sm">Caricamento organizzazione...</span>
      </div>
    );
  }

  if (!orgId) {
    return (
      <Section title="Organizzazione" desc="Nessuna organizzazione selezionata">
        <div className="text-center py-12">
          <FiAlertTriangle className="w-10 h-10 text-amber-400 mx-auto mb-3" />
          <p className="text-sm text-slate-400">Seleziona o crea un'organizzazione per continuare.</p>
        </div>
      </Section>
    );
  }

  // Sections nav
  const sections = [
    { key: "overview", label: "Panoramica", icon: FiActivity },
    { key: "info", label: "Info Azienda", icon: FiFileText },
    { key: "sede", label: "Sede & Contatti", icon: FiMapPin },
    { key: "orari", label: "Orari Lavoro", icon: FiClock },
    { key: "danger", label: "Zona Pericolosa", icon: FiAlertTriangle },
  ];

  return (
    <div className="space-y-4">
      {/* Header Card */}
      <div className="bg-[#1a2536] rounded-xl border border-[#243044] p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            {/* Org Avatar */}
            <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-blue-500 to-emerald-400 flex items-center justify-center text-white text-xl font-semibold shrink-0">
              {(orgName || "O").charAt(0).toUpperCase()}
            </div>
            <div>
              {/* Editable Name */}
              {editingName ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleRename(); if (e.key === "Escape") setEditingName(false); }}
                    autoFocus
                    className="px-2 py-1 text-base font-semibold text-slate-100 bg-[#141c27] border border-blue-500/50 rounded-lg focus:ring-1 focus:ring-blue-500/40 outline-none"
                    placeholder="Nome organizzazione"
                  />
                  <button onClick={handleRename} disabled={saving} className="p-1.5 text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors">
                    <FiCheck className="w-4 h-4" />
                  </button>
                  <button onClick={() => setEditingName(false)} className="p-1.5 text-slate-400 hover:bg-slate-500/10 rounded-lg transition-colors">
                    <FiX className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-semibold text-slate-100">{orgName}</h2>
                  {isAdmin && (
                    <button
                      onClick={() => { setNewName(orgName); setEditingName(true); }}
                      className="p-1 text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 rounded transition-colors"
                      title="Rinomina"
                    >
                      <FiEdit3 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}

              {/* Meta info */}
              <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                {orgNumber && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono text-blue-400 bg-blue-500/10 rounded">
                    <FiHash className="w-2.5 h-2.5" />
                    {orgNumber}
                  </span>
                )}
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded ${
                  isOwner ? "bg-amber-500/10 text-amber-400" : isAdmin ? "bg-blue-500/10 text-blue-400" : "bg-slate-700/50 text-slate-400"
                }`}>
                  <FiShield className="w-2.5 h-2.5" />
                  {role || "member"}
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] text-slate-500">
                  <FiCalendar className="w-2.5 h-2.5" />
                  Creata il {createdAt}
                </span>
                <button
                  onClick={copyOrgId}
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] text-slate-500 hover:text-slate-300 hover:bg-[#243044] rounded transition-colors"
                  title="Copia ID organizzazione"
                >
                  <FiCopy className="w-2.5 h-2.5" />
                  {orgId.slice(0, 8)}...
                </button>
              </div>
            </div>
          </div>

          {/* Status badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-emerald-400 bg-emerald-500/10 rounded-full">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Attiva
          </div>
        </div>
      </div>

      {/* Stats Row */}
      {stats && (
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          {[
            { label: "Membri", value: stats.members, icon: FiUsers, color: "blue" },
            { label: "Clienti", value: stats.clients, icon: FiUsers, color: "emerald" },
            { label: "Trasporti", value: stats.transports, icon: FiTruck, color: "amber" },
            { label: "Fatture", value: stats.invoices, icon: FiFileText, color: "purple" },
            { label: "Preventivi", value: stats.quotes, icon: FiFileText, color: "cyan" },
            { label: "Veicoli", value: stats.vehicles, icon: FiTruck, color: "rose" },
          ].map((stat) => {
            const Icon = stat.icon;
            const colorMap = {
              blue: "text-blue-400 bg-blue-500/10 border-blue-500/20",
              emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
              amber: "text-amber-400 bg-amber-500/10 border-amber-500/20",
              purple: "text-purple-400 bg-purple-500/10 border-purple-500/20",
              cyan: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
              rose: "text-rose-400 bg-rose-500/10 border-rose-500/20",
            };
            const classes = colorMap[stat.color] || colorMap.blue;
            return (
              <div
                key={stat.label}
                className={`rounded-lg border p-3 ${classes} hover:border-opacity-50 transition-colors`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Icon className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-medium uppercase tracking-wider opacity-80">{stat.label}</span>
                </div>
                <div className="text-lg font-semibold">{stat.value.toLocaleString("it-IT")}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Section Navigation */}
      <div className="flex items-center gap-1 bg-[#1a2536] rounded-xl border border-[#243044] p-1.5">
        {sections.map((sec) => {
          const Icon = sec.icon;
          const isActive = activeSection === sec.key;
          return (
            <button
              key={sec.key}
              onClick={() => setActiveSection(sec.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg transition-colors ${
                isActive
                  ? sec.key === "danger" ? "bg-red-500/20 text-red-400" : "bg-blue-600 text-white"
                  : sec.key === "danger" ? "text-red-400/60 hover:bg-red-500/10 hover:text-red-400" : "text-slate-400 hover:bg-[#141c27] hover:text-slate-200"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {sec.label}
            </button>
          );
        })}
      </div>

      {/* SECTION: Overview */}
      {activeSection === "overview" && (
        <div className="space-y-4">
          {/* Org Switch */}
          {orgs.length > 1 && (
            <Section title="Le tue Organizzazioni" desc="Passa da un'organizzazione all'altra">
              <div className="space-y-1.5">
                {orgs.map((org) => {
                  const isCurrent = orgId === org.id;
                  const orgNum = org.number ? `ORG${String(org.number).padStart(4, "0")}` : org.id?.slice(0, 8);
                  return (
                    <div
                      key={org.id}
                      className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                        isCurrent ? "border-blue-500/30 bg-blue-500/5" : "border-[#243044] bg-[#141c27] hover:bg-[#1a2536]"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center text-sm font-semibold ${
                          isCurrent ? "bg-blue-500 text-white" : "bg-[#243044] text-slate-400"
                        }`}>
                          {(org.name || "O").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-slate-200">{org.name}</div>
                          <div className="flex items-center gap-2 text-[10px] text-slate-500">
                            <span className="font-mono">{orgNum}</span>
                            <span>·</span>
                            <span>{org.role || "member"}</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        {isCurrent ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-medium text-blue-400 bg-blue-500/10 rounded-full">
                            <FiCheck className="w-3 h-3" /> Corrente
                          </span>
                        ) : (
                          <button
                            onClick={() => setCurrentOrg(org.id)}
                            className="px-3 py-1 text-xs font-medium text-slate-300 bg-[#243044] rounded-lg hover:bg-[#2a3a52] transition-colors"
                          >
                            Seleziona
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Section>
          )}

          {/* Quick Info Summary */}
          <Section title="Riepilogo Organizzazione" desc="Informazioni rapide sulla tua organizzazione">
            <div className="grid md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <InfoRow label="Nome" value={orgName} />
                <InfoRow label="ID Numerico" value={orgNumber || "—"} />
                <InfoRow label="Tuo Ruolo" value={role || "member"} badge />
                <InfoRow label="Creata il" value={createdAt} />
              </div>
              <div className="space-y-2">
                <InfoRow label="P.IVA" value={orgSettings?.vat || "Non configurata"} muted={!orgSettings?.vat} />
                <InfoRow label="Cod. Fiscale" value={orgSettings?.tax_code || "Non configurato"} muted={!orgSettings?.tax_code} />
                <InfoRow label="Email" value={orgSettings?.email || "Non configurata"} muted={!orgSettings?.email} />
                <InfoRow label="Telefono" value={orgSettings?.phone || "Non configurato"} muted={!orgSettings?.phone} />
              </div>
            </div>
          </Section>
        </div>
      )}

      {/* SECTION: Info Azienda */}
      {activeSection === "info" && (
        <Section title="Informazioni Aziendali" desc="Dati aziendali utilizzati per documenti e fatturazione">
          {!isAdmin ? (
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-300">
              <FiShield className="inline w-3 h-3 mr-1" />
              Solo admin e owner possono modificare queste impostazioni.
            </div>
          ) : (
            <OrgInfoForm
              settings={orgSettings}
              onSave={saveOrgSettings}
              saving={saving}
            />
          )}
        </Section>
      )}

      {/* SECTION: Sede & Contatti */}
      {activeSection === "sede" && (
        <Section title="Sede & Contatti" desc="Indirizzo sede legale e recapiti aziendali">
          {!isAdmin ? (
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-300">
              <FiShield className="inline w-3 h-3 mr-1" />
              Solo admin e owner possono modificare queste impostazioni.
            </div>
          ) : (
            <SedeForm
              settings={orgSettings}
              onSave={saveOrgSettings}
              saving={saving}
            />
          )}
        </Section>
      )}

      {/* SECTION: Orari Lavoro */}
      {activeSection === "orari" && (
        <Section title="Orari di Lavoro" desc="Configura gli orari di apertura e chiusura della tua azienda">
          {!isAdmin ? (
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-300">
              <FiShield className="inline w-3 h-3 mr-1" />
              Solo admin e owner possono modificare queste impostazioni.
            </div>
          ) : (
            <OrariForm
              settings={orgSettings}
              onSave={saveOrgSettings}
              saving={saving}
            />
          )}
        </Section>
      )}

      {/* SECTION: Danger Zone */}
      {activeSection === "danger" && (
        <div className="space-y-4">
          <div className="bg-red-500/5 rounded-xl border border-red-500/20 p-5">
            <h2 className="text-sm font-semibold text-red-400 mb-1">Zona Pericolosa</h2>
            <p className="text-xs text-red-300/60 mb-4">Azioni irreversibili. Procedi con cautela.</p>

            {isOwner ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg border border-red-500/20 bg-[#141c27]">
                  <div>
                    <div className="text-xs font-medium text-slate-200">Elimina Organizzazione</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      Elimina permanentemente "{orgName}" e tutti i dati associati.
                      {stats && (
                        <span className="text-red-400"> ({stats.clients} clienti, {stats.transports} trasporti, {stats.invoices} fatture)</span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={handleDeleteOrg}
                    className="px-3 py-1.5 text-xs font-medium text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/10 transition-colors shrink-0"
                  >
                    <FiTrash2 className="w-3 h-3 inline mr-1" />
                    Elimina
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-[#141c27] border border-[#243044] rounded-lg">
                <div className="text-xs text-slate-400">
                  <FiShield className="inline w-3 h-3 mr-1 text-amber-400" />
                  Solo l'owner dell'organizzazione può eseguire queste azioni.
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

OrganizationSettings.propTypes = {
  showToast: PropTypes.func,
};

// --- Sub-Components ---

function InfoRow({ label, value, badge = false, muted = false }) {
  return (
    <div className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-[#141c27]">
      <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">{label}</span>
      {badge ? (
        <span className="px-2 py-0.5 text-[10px] font-medium text-blue-400 bg-blue-500/10 rounded-full">{value}</span>
      ) : (
        <span className={`text-xs ${muted ? "text-slate-600 italic" : "text-slate-200"}`}>{value}</span>
      )}
    </div>
  );
}

InfoRow.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.string,
  badge: PropTypes.bool,
  muted: PropTypes.bool,
};

// --- Org Info Form ---
function OrgInfoForm({ settings, onSave, saving }) {
  const [form, setForm] = useState({
    company_name: settings?.company_name || "",
    vat: settings?.vat || "",
    tax_code: settings?.tax_code || "",
    regime_fiscale: settings?.regime_fiscale || "RF01",
    iban: settings?.iban || "",
    bank_name: settings?.bank_name || "",
    invoice_prefix: settings?.invoice_prefix || "",
    invoice_footer: settings?.invoice_footer || "",
  });

  useEffect(() => {
    setForm({
      company_name: settings?.company_name || "",
      vat: settings?.vat || "",
      tax_code: settings?.tax_code || "",
      regime_fiscale: settings?.regime_fiscale || "RF01",
      iban: settings?.iban || "",
      bank_name: settings?.bank_name || "",
      invoice_prefix: settings?.invoice_prefix || "",
      invoice_footer: settings?.invoice_footer || "",
    });
  }, [settings]);

  const REGIMI = [
    { value: "RF01", label: "RF01 - Ordinario" },
    { value: "RF02", label: "RF02 - Contribuenti minimi" },
    { value: "RF04", label: "RF04 - Agricoltura e pesca" },
    { value: "RF14", label: "RF14 - Rivendita beni usati" },
    { value: "RF18", label: "RF18 - Altro" },
    { value: "RF19", label: "RF19 - Forfettario" },
  ];

  const handleSave = () => {
    onSave(form);
  };

  const inputClass = "w-full px-3 py-1.5 text-xs border border-[#243044] rounded-lg bg-[#141c27] text-slate-200 placeholder-slate-600 focus:ring-1 focus:ring-blue-500/40 outline-none";

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-3">Dati Anagrafici</h3>
        <div className="grid grid-cols-6 gap-x-3 gap-y-3">
          <Field label="Denominazione / Ragione Sociale" required className="col-span-4">
            <input
              type="text"
              className={inputClass}
              placeholder="La Tua Azienda Srl"
              value={form.company_name}
              onChange={(e) => setForm(p => ({ ...p, company_name: e.target.value }))}
            />
          </Field>
          <Field label="Partita IVA" required className="col-span-2">
            <input
              type="text"
              className={inputClass + " font-mono"}
              placeholder="IT12345678901"
              value={form.vat}
              onChange={(e) => setForm(p => ({ ...p, vat: e.target.value.toUpperCase() }))}
            />
          </Field>
          <Field label="Codice Fiscale" className="col-span-2">
            <input
              type="text"
              className={inputClass + " font-mono"}
              placeholder="Se diverso da P.IVA"
              value={form.tax_code}
              onChange={(e) => setForm(p => ({ ...p, tax_code: e.target.value.toUpperCase() }))}
            />
          </Field>
          <Field label="Regime Fiscale" required className="col-span-4">
            <select
              className={inputClass}
              value={form.regime_fiscale}
              onChange={(e) => setForm(p => ({ ...p, regime_fiscale: e.target.value }))}
            >
              {REGIMI.map(rf => <option key={rf.value} value={rf.value}>{rf.label}</option>)}
            </select>
          </Field>
        </div>
      </div>

      <div>
        <h3 className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-3">Dati Bancari</h3>
        <div className="grid grid-cols-6 gap-x-3 gap-y-3">
          <Field label="IBAN" className="col-span-4">
            <input
              type="text"
              className={inputClass + " font-mono"}
              placeholder="IT60X0542811101000000123456"
              value={form.iban}
              onChange={(e) => setForm(p => ({ ...p, iban: e.target.value.replaceAll(/\s+/g, "").toUpperCase() }))}
            />
          </Field>
          <Field label="Banca" className="col-span-2">
            <input
              type="text"
              className={inputClass}
              placeholder="Nome banca"
              value={form.bank_name}
              onChange={(e) => setForm(p => ({ ...p, bank_name: e.target.value }))}
            />
          </Field>
        </div>
      </div>

      <div>
        <h3 className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-3">Fatturazione</h3>
        <div className="grid grid-cols-6 gap-x-3 gap-y-3">
          <Field label="Prefisso Fattura" tooltip="Es: FATT-, INV-" className="col-span-2">
            <input
              type="text"
              className={inputClass + " font-mono"}
              placeholder="FATT-"
              value={form.invoice_prefix}
              onChange={(e) => setForm(p => ({ ...p, invoice_prefix: e.target.value }))}
            />
          </Field>
          <Field label="Note Piè di Pagina Fatture" className="col-span-4">
            <textarea
              className={inputClass + " resize-none"}
              rows={2}
              placeholder="Es: Capitale Sociale € 10.000 i.v. - REA RM-123456"
              value={form.invoice_footer}
              onChange={(e) => setForm(p => ({ ...p, invoice_footer: e.target.value }))}
            />
          </Field>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {saving ? <FiRefreshCw className="w-3.5 h-3.5 animate-spin" /> : <FiCheck className="w-3.5 h-3.5" />}
          Salva Info Azienda
        </button>
      </div>
    </div>
  );
}

OrgInfoForm.propTypes = {
  settings: PropTypes.object,
  onSave: PropTypes.func.isRequired,
  saving: PropTypes.bool,
};

// --- Sede & Contatti Form ---
function SedeForm({ settings, onSave, saving }) {
  const addr = typeof settings?.address === "object" ? settings.address : {};
  const [form, setForm] = useState({
    phone: settings?.phone || "",
    email: settings?.email || "",
    pec: settings?.pec || "",
    website: settings?.website || "",
    address: {
      street: addr.street || "",
      city: addr.city || "",
      zip: addr.zip || "",
      province: addr.province || "",
      country: addr.country || "IT",
    },
  });

  useEffect(() => {
    const a = typeof settings?.address === "object" ? settings.address : {};
    setForm({
      phone: settings?.phone || "",
      email: settings?.email || "",
      pec: settings?.pec || "",
      website: settings?.website || "",
      address: {
        street: a.street || "",
        city: a.city || "",
        zip: a.zip || "",
        province: a.province || "",
        country: a.country || "IT",
      },
    });
  }, [settings]);

  const handleSave = () => {
    onSave({
      phone: form.phone,
      email: form.email,
      pec: form.pec,
      website: form.website,
      address: form.address,
    });
  };

  const inputClass = "w-full px-3 py-1.5 text-xs border border-[#243044] rounded-lg bg-[#141c27] text-slate-200 placeholder-slate-600 focus:ring-1 focus:ring-blue-500/40 outline-none";

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-3">Sede Legale</h3>
        <div className="grid grid-cols-6 gap-x-3 gap-y-3">
          <Field label="Indirizzo" required className="col-span-4">
            <input
              type="text"
              className={inputClass}
              placeholder="Via Roma 123"
              value={form.address.street}
              onChange={(e) => setForm(p => ({ ...p, address: { ...p.address, street: e.target.value } }))}
            />
          </Field>
          <Field label="CAP" required className="col-span-1">
            <input
              type="text"
              className={inputClass}
              placeholder="00100"
              maxLength={5}
              value={form.address.zip}
              onChange={(e) => setForm(p => ({ ...p, address: { ...p.address, zip: e.target.value } }))}
            />
          </Field>
          <Field label="Nazione" className="col-span-1">
            <input
              type="text"
              className={inputClass}
              placeholder="IT"
              maxLength={2}
              value={form.address.country}
              onChange={(e) => setForm(p => ({ ...p, address: { ...p.address, country: e.target.value.toUpperCase() } }))}
            />
          </Field>
          <Field label="Comune" required className="col-span-3">
            <input
              type="text"
              className={inputClass}
              placeholder="Roma"
              value={form.address.city}
              onChange={(e) => setForm(p => ({ ...p, address: { ...p.address, city: e.target.value } }))}
            />
          </Field>
          <Field label="Provincia" required className="col-span-1">
            <select
              className={inputClass}
              value={form.address.province}
              onChange={(e) => setForm(p => ({ ...p, address: { ...p.address, province: e.target.value } }))}
            >
              <option value="">--</option>
              {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </Field>
        </div>
      </div>

      <div>
        <h3 className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-3">Contatti</h3>
        <div className="grid grid-cols-6 gap-x-3 gap-y-3">
          <Field label="Telefono" className="col-span-2">
            <div className="relative">
              <FiPhone className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500" />
              <input
                type="tel"
                className={inputClass + " pl-7"}
                placeholder="+39 06 0000000"
                value={form.phone}
                onChange={(e) => setForm(p => ({ ...p, phone: e.target.value }))}
              />
            </div>
          </Field>
          <Field label="Email" className="col-span-2">
            <div className="relative">
              <FiMail className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500" />
              <input
                type="email"
                className={inputClass + " pl-7"}
                placeholder="info@azienda.it"
                value={form.email}
                onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))}
              />
            </div>
          </Field>
          <Field label="PEC" tooltip="Posta Elettronica Certificata" className="col-span-2">
            <div className="relative">
              <FiMail className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500" />
              <input
                type="email"
                className={inputClass + " pl-7"}
                placeholder="azienda@pec.it"
                value={form.pec}
                onChange={(e) => setForm(p => ({ ...p, pec: e.target.value }))}
              />
            </div>
          </Field>
          <Field label="Sito Web" className="col-span-3">
            <div className="relative">
              <FiGlobe className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500" />
              <input
                type="url"
                className={inputClass + " pl-7"}
                placeholder="https://www.azienda.it"
                value={form.website}
                onChange={(e) => setForm(p => ({ ...p, website: e.target.value }))}
              />
            </div>
          </Field>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {saving ? <FiRefreshCw className="w-3.5 h-3.5 animate-spin" /> : <FiCheck className="w-3.5 h-3.5" />}
          Salva Sede & Contatti
        </button>
      </div>
    </div>
  );
}

SedeForm.propTypes = {
  settings: PropTypes.object,
  onSave: PropTypes.func.isRequired,
  saving: PropTypes.bool,
};

// --- Orari Form ---
function OrariForm({ settings, onSave, saving }) {
  const defaultOrari = {
    lunedi: { aperto: true, inizio: "08:00", fine: "18:00", pausa_inizio: "13:00", pausa_fine: "14:00" },
    martedi: { aperto: true, inizio: "08:00", fine: "18:00", pausa_inizio: "13:00", pausa_fine: "14:00" },
    mercoledi: { aperto: true, inizio: "08:00", fine: "18:00", pausa_inizio: "13:00", pausa_fine: "14:00" },
    giovedi: { aperto: true, inizio: "08:00", fine: "18:00", pausa_inizio: "13:00", pausa_fine: "14:00" },
    venerdi: { aperto: true, inizio: "08:00", fine: "18:00", pausa_inizio: "13:00", pausa_fine: "14:00" },
    sabato: { aperto: false, inizio: "08:00", fine: "13:00", pausa_inizio: "", pausa_fine: "" },
    domenica: { aperto: false, inizio: "", fine: "", pausa_inizio: "", pausa_fine: "" },
  };

  const stored = typeof settings?.orari_lavoro === "object" ? settings.orari_lavoro : {};
  const [orari, setOrari] = useState({ ...defaultOrari, ...stored });

  useEffect(() => {
    const s = typeof settings?.orari_lavoro === "object" ? settings.orari_lavoro : {};
    setOrari({ ...defaultOrari, ...s });
  }, [settings]);

  const DAYS = [
    { key: "lunedi", label: "Lunedì" },
    { key: "martedi", label: "Martedì" },
    { key: "mercoledi", label: "Mercoledì" },
    { key: "giovedi", label: "Giovedì" },
    { key: "venerdi", label: "Venerdì" },
    { key: "sabato", label: "Sabato" },
    { key: "domenica", label: "Domenica" },
  ];

  const updateDay = (day, field, value) => {
    setOrari(prev => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }));
  };

  const handleSave = () => {
    onSave({ orari_lavoro: orari });
  };

  const inputClass = "w-full px-2 py-1 text-xs border border-[#243044] rounded-lg bg-[#141c27] text-slate-200 focus:ring-1 focus:ring-blue-500/40 outline-none text-center";

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-lg border border-[#243044]">
        <table className="w-full text-xs">
          <thead className="bg-[#141c27]">
            <tr>
              <th className="text-left px-3 py-2 font-medium text-slate-400 w-28">Giorno</th>
              <th className="text-center px-2 py-2 font-medium text-slate-400 w-16">Aperto</th>
              <th className="text-center px-2 py-2 font-medium text-slate-400">Apertura</th>
              <th className="text-center px-2 py-2 font-medium text-slate-400">Chiusura</th>
              <th className="text-center px-2 py-2 font-medium text-slate-400">Pausa da</th>
              <th className="text-center px-2 py-2 font-medium text-slate-400">Pausa a</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#243044]">
            {DAYS.map(({ key, label }) => {
              const day = orari[key] || {};
              const isOpen = day.aperto !== false;
              return (
                <tr key={key} className={`${isOpen ? "" : "opacity-40"} hover:bg-[#141c27]/30`}>
                  <td className="px-3 py-2 font-medium text-slate-300">{label}</td>
                  <td className="px-2 py-2 text-center">
                    <button
                      type="button"
                      onClick={() => updateDay(key, "aperto", !isOpen)}
                      className={`w-8 h-5 rounded-full transition-colors ${isOpen ? "bg-blue-600" : "bg-[#243044]"}`}
                    >
                      <span className={`block w-3.5 h-3.5 rounded-full bg-white transition-transform ${isOpen ? "translate-x-3.5 ml-0.5" : "translate-x-0.5"}`} />
                    </button>
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="time"
                      className={inputClass}
                      value={day.inizio || ""}
                      disabled={!isOpen}
                      onChange={(e) => updateDay(key, "inizio", e.target.value)}
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="time"
                      className={inputClass}
                      value={day.fine || ""}
                      disabled={!isOpen}
                      onChange={(e) => updateDay(key, "fine", e.target.value)}
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="time"
                      className={inputClass}
                      value={day.pausa_inizio || ""}
                      disabled={!isOpen}
                      onChange={(e) => updateDay(key, "pausa_inizio", e.target.value)}
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="time"
                      className={inputClass}
                      value={day.pausa_fine || ""}
                      disabled={!isOpen}
                      onChange={(e) => updateDay(key, "pausa_fine", e.target.value)}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end pt-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {saving ? <FiRefreshCw className="w-3.5 h-3.5 animate-spin" /> : <FiCheck className="w-3.5 h-3.5" />}
          Salva Orari
        </button>
      </div>
    </div>
  );
}

OrariForm.propTypes = {
  settings: PropTypes.object,
  onSave: PropTypes.func.isRequired,
  saving: PropTypes.bool,
};
