// src/components/settings/BillingSettings.jsx
// Sezione Abbonamento/Billing — piano attuale, scadenza, moduli, Stripe
import { useState, useEffect } from "react";
import { FiCreditCard, FiPackage, FiCalendar, FiExternalLink, FiRefreshCw, FiCheck, FiAlertCircle, FiZap, FiFileText, FiShield, FiTruck, FiGlobe, FiUsers } from "react-icons/fi";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { useOrg } from "@/context/OrgContext";
import { Section, Card } from "@/components/ui/SettingsUI";
import PropTypes from "prop-types";

const PLAN_INFO = {
  free:         { label: "Free",         color: "slate",   price: "€0",            desc: "Piano gratuito di prova" },
  trial:        { label: "Trial",        color: "amber",   price: "€0",            desc: "Periodo di prova 14 giorni" },
  Starter:      { label: "Starter",      color: "blue",    price: "€1.800/anno",   desc: "Base + 1 modulo a scelta" },
  starter:      { label: "Starter",      color: "blue",    price: "€1.800/anno",   desc: "Base + 1 modulo a scelta" },
  Professional: { label: "Professional", color: "emerald", price: "€2.800/anno",   desc: "Base + 2 moduli a scelta" },
  professional: { label: "Professional", color: "emerald", price: "€2.800/anno",   desc: "Base + 2 moduli a scelta" },
  Business:     { label: "Business",     color: "amber",   price: "€3.600/anno",   desc: "Base + 3 moduli a scelta" },
  business:     { label: "Business",     color: "amber",   price: "€3.600/anno",   desc: "Base + 3 moduli a scelta" },
  Full:         { label: "Full",         color: "purple",  price: "€4.500/anno",   desc: "Tutti i moduli inclusi" },
  full:         { label: "Full",         color: "purple",  price: "€4.500/anno",   desc: "Tutti i moduli inclusi" },
  custom:       { label: "Custom",       color: "purple",  price: "Personalizzato", desc: "Piano su misura" },
};

const MODULES = [
  { key: "sdi",          label: "Fatturazione SDI",    desc: "Invio e ricezione fatture elettroniche via SDI-SFTP",       Icon: FiFileText },
  { key: "rvfu",         label: "Demolizioni RVFU",    desc: "Registro Veicoli Fuoriuso — integrazione API MIT",          Icon: FiTruck },
  { key: "rentri",       label: "Rifiuti RENTRI",      desc: "Registri, FIR, MUD e sincronizzazione portale RENTRI",      Icon: FiShield },
  { key: "contabilita",  label: "Contabilità",         desc: "Prima nota, piano dei conti, movimenti contabili",          Icon: FiCreditCard },
];

export default function BillingSettings({ showToast }) {
  const supabase = supabaseBrowser();
  const { orgId, orgName } = useOrg();

  const [subscription, setSubscription] = useState(null);
  const [activeModules, setActiveModules] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orgId) loadBilling();
  }, [orgId]);

  async function loadBilling() {
    try {
      setLoading(true);

      // Carica abbonamento da org_subscriptions
      const { data: sub } = await supabase
        .from("org_subscriptions")
        .select("*")
        .eq("org_id", orgId)
        .maybeSingle();

      setSubscription(sub);

      // Carica moduli attivi
      const { data: mods } = await supabase
        .from("org_modules")
        .select("*")
        .eq("org_id", orgId)
        .eq("status", "active");

      setActiveModules((mods || []).map(m => m.module));
    } catch (err) {
      console.error("[BillingSettings] Error:", err);
      // Le tabelle potrebbero non esistere ancora
    } finally {
      setLoading(false);
    }
  }

  function openStripePortal() {
    // Link al portale Stripe per gestire pagamento
    const portalUrl = subscription?.stripe_portal_url || "https://billing.stripe.com/p/login/test";
    window.open(portalUrl, "_blank");
  }

  const plan = subscription?.plan || "trial";
  const planInfo = PLAN_INFO[plan] || PLAN_INFO.trial;
  const status = subscription?.status || "trial";
  const expiresAt = subscription?.current_period_end || subscription?.trial_end;
  const daysLeft = expiresAt ? Math.max(0, Math.ceil((new Date(expiresAt) - Date.now()) / 86400000)) : null;

  const statusColors = {
    active: "text-emerald-400 bg-emerald-500/10",
    trial: "text-amber-400 bg-amber-500/10",
    past_due: "text-red-400 bg-red-500/10",
    canceled: "text-red-400 bg-red-500/10",
    suspended: "text-red-400 bg-red-500/10",
  };

  const statusLabels = {
    active: "Attivo",
    trial: "Periodo di Prova",
    past_due: "Pagamento Scaduto",
    canceled: "Cancellato",
    suspended: "Sospeso",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <FiRefreshCw className="w-5 h-5 animate-spin text-blue-400" />
        <span className="ml-2 text-sm text-slate-400">Caricamento abbonamento...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Piano Attuale */}
      <Section title="Il tuo Abbonamento" desc={`Piano attivo per "${orgName}"`}>
        <div className="grid md:grid-cols-3 gap-3 mb-4">
          {/* Piano */}
          <div className={`p-4 rounded-lg border-2 border-${planInfo.color}-500/30 bg-${planInfo.color}-500/5`}>
            <div className="flex items-center gap-2 mb-2">
              <FiPackage className={`w-5 h-5 text-${planInfo.color}-400`} />
              <span className={`text-sm font-semibold text-${planInfo.color}-400`}>{planInfo.label}</span>
            </div>
            <div className="text-lg font-bold text-slate-200">{planInfo.price}</div>
            <div className="text-[10px] text-slate-500 mt-1">{planInfo.desc}</div>
          </div>

          {/* Stato */}
          <Card title="Stato Abbonamento">
            <div className="space-y-2">
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[status] || statusColors.trial}`}>
                {statusLabels[status] || status}
              </span>
              {expiresAt && (
                <div className="text-xs text-slate-500 flex items-center gap-1">
                  <FiCalendar className="w-3 h-3" />
                  {status === "trial" ? "Scade" : "Rinnovo"}: {new Date(expiresAt).toLocaleDateString("it-IT")}
                </div>
              )}
              {daysLeft !== null && daysLeft <= 7 && (
                <div className="text-xs text-amber-400 flex items-center gap-1">
                  <FiAlertCircle className="w-3 h-3" />
                  {daysLeft === 0 ? "Scade oggi!" : `${daysLeft} giorni rimanenti`}
                </div>
              )}
            </div>
          </Card>

          {/* Azioni */}
          <Card title="Gestione">
            <div className="space-y-2">
              <button
                onClick={openStripePortal}
                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <FiCreditCard className="w-3.5 h-3.5" />
                Gestisci Pagamento
                <FiExternalLink className="w-3 h-3" />
              </button>
              {plan !== "enterprise" && (
                <button
                  onClick={() => {
                    window.open("https://rescuemanager.eu/pricing", "_blank");
                  }}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-400 bg-emerald-500/10 rounded-lg hover:bg-emerald-500/20 transition-colors"
                >
                  <FiZap className="w-3.5 h-3.5" />
                  Upgrade Piano
                </button>
              )}
            </div>
          </Card>
        </div>

        {/* Info fatturazione */}
        {subscription?.stripe_customer_id && (
          <div className="bg-[#141c27] rounded-lg border border-[#243044] p-3">
            <div className="grid grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-slate-500">Customer ID:</span>
                <code className="ml-1 text-slate-400 bg-[#1a2536] px-1 py-0.5 rounded text-[10px]">
                  {subscription.stripe_customer_id}
                </code>
              </div>
              <div>
                <span className="text-slate-500">Tipo billing:</span>
                <span className="ml-1 text-slate-300">{subscription.billing_type || "stripe"}</span>
              </div>
              <div>
                <span className="text-slate-500">Creato:</span>
                <span className="ml-1 text-slate-300">
                  {subscription.created_at ? new Date(subscription.created_at).toLocaleDateString("it-IT") : "—"}
                </span>
              </div>
            </div>
          </div>
        )}
      </Section>

      {/* Moduli */}
      <Section title="Moduli Attivi" desc="I moduli abilitati per la tua organizzazione">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {MODULES.map(mod => {
            const isActive = activeModules.includes(mod.key);
            return (
              <div
                key={mod.key}
                className={`p-3 rounded-lg border transition-colors ${
                  isActive
                    ? "border-emerald-500/30 bg-emerald-500/5"
                    : "border-[#243044] bg-[#141c27] opacity-60"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <mod.Icon className={`w-4 h-4 ${isActive ? "text-emerald-400" : "text-slate-500"}`} />
                    <span className="text-xs font-medium text-slate-200">{mod.label}</span>
                  </div>
                  {isActive ? (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium text-emerald-400 bg-emerald-500/10 rounded-full">
                      <FiCheck className="w-2.5 h-2.5" /> Attivo
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-500">Non attivo</span>
                  )}
                </div>
                <p className="text-[10px] text-slate-500">{mod.desc}</p>
              </div>
            );
          })}
        </div>
        <p className="text-[10px] text-slate-600 mt-3">
          Per attivare o disattivare moduli, contatta il supporto o gestisci dal pannello di amministrazione.
        </p>
      </Section>

      {/* Storico (placeholder) */}
      <Section title="Storico Fatture SaaS" desc="Le fatture emesse da RescueManager per il tuo abbonamento">
        <div className="text-center py-8">
          <FiCreditCard className="w-6 h-6 text-slate-500 mx-auto mb-2" />
          <p className="text-xs text-slate-500 mb-2">
            Lo storico fatture è disponibile nel portale di pagamento Stripe.
          </p>
          <button
            onClick={openStripePortal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-[#141c27] border border-[#243044] rounded-lg hover:bg-[#243044] transition-colors"
          >
            <FiExternalLink className="w-3.5 h-3.5" />
            Apri Portale Fatture
          </button>
        </div>
      </Section>
    </div>
  );
}

BillingSettings.propTypes = {
  showToast: PropTypes.func,
};
