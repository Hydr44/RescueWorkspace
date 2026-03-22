/**
 * Settings Page
 * Gestione completa delle impostazioni dell'applicazione
 *
 * @author haxies
 * @created 2025
 */

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FiSave, FiUpload, FiDownload, FiTrash2, FiBell, FiImage, FiGlobe, FiDatabase, FiStar, FiPlus, FiUsers, FiFileText, FiRefreshCw, FiCheck, FiX, FiAlertCircle, FiInfo, FiEdit3, FiDownload as FiDownloadIcon, FiUser, FiCreditCard, FiLock, FiMenu, FiSettings, FiNavigation, FiTruck, FiGrid, FiClipboard, FiCalendar, FiBookOpen, FiMapPin, FiSmartphone } from "react-icons/fi";
import RifiutiLimitiSettings from "./RifiutiLimitiSettings";
import MarketplaceSettings from "../components/settings/MarketplaceSettings";
import OrganizationSettings from "../components/settings/OrganizationSettings";
import ProfileSettings from "../components/settings/ProfileSettings";
import TeamSettings from "../components/settings/TeamSettings";
import BillingSettings from "../components/settings/BillingSettings";
import GpsTrackingSettings from "../components/settings/GpsTrackingSettings";
import SecuritySettings from "../components/settings/SecuritySettings";
import NotificationSettings from "../components/settings/NotificationSettings";
import DemolizioneSettings from "../components/settings/DemolizioneSettings";
import { supabaseBrowser } from "../lib/supabase-browser";
import { useOrg } from "../context/OrgContext";
import { CompanySettingsService } from "../lib/services/companySettingsService";
import { ExportTemplateService } from "../lib/services/exportTemplateService";
import { filterTabsByRole } from "../lib/permissions";
import Modal from "../components/Modal";
import PropTypes from "prop-types";
import { Field, Toggle, Card, Section } from "../components/ui/SettingsUI";

// Regimi fiscali italiani completi (FatturaPA)
const REGIMI_FISCALI = [
  { value: "RF01", label: "RF01 - Ordinario" },
  { value: "RF02", label: "RF02 - Contribuenti minimi (art.1 c.96-117 L.244/2007)" },
  { value: "RF04", label: "RF04 - Agricoltura e pesca (artt.34-34-bis DPR 633/72)" },
  { value: "RF05", label: "RF05 - Vendita sali e tabacchi (art.74 c.1 DPR 633/72)" },
  { value: "RF06", label: "RF06 - Commercio fiammiferi (art.74 c.1 DPR 633/72)" },
  { value: "RF07", label: "RF07 - Editoria (art.74 c.1 DPR 633/72)" },
  { value: "RF08", label: "RF08 - Gestione servizi telefonia pubblica (art.74 c.1 DPR 633/72)" },
  { value: "RF09", label: "RF09 - Rivendita documenti di trasporto (art.74 c.1 DPR 633/72)" },
  { value: "RF10", label: "RF10 - Intrattenimenti, giochi e altre attività (art.74 c.6 DPR 633/72)" },
  { value: "RF11", label: "RF11 - Agenzie viaggi e turismo (art.74-ter DPR 633/72)" },
  { value: "RF12", label: "RF12 - Agriturismo (art.5 c.2 L.413/91)" },
  { value: "RF13", label: "RF13 - Vendite a domicilio (art.25-bis c.6 DPR 600/73)" },
  { value: "RF14", label: "RF14 - Rivendita beni usati, oggetti d'arte (art.36 DL 41/95)" },
  { value: "RF15", label: "RF15 - Agenzie di vendite all'asta (art.40-bis DL 41/95)" },
  { value: "RF16", label: "RF16 - IVA per cassa P.A. (art.6 c.5 DPR 633/72)" },
  { value: "RF17", label: "RF17 - IVA per cassa (art.32-bis DL 83/2012)" },
  { value: "RF18", label: "RF18 - Altro" },
  { value: "RF19", label: "RF19 - Forfettario (art.1 c.54-89 L.190/2014)" },
];

// Tabs con permessi granulari
const ALL_TABS = [
  {
    key: "profile",
    label: "Profilo Personale",
    icon: FiUser,
    description: "Il tuo account, password e email",
    requiredPermission: "settings.profile",
    group: "personale",
  },
  {
    key: "organization",
    label: "Organizzazione",
    icon: FiUsers,
    description: "Gestisci l'organizzazione corrente",
    requiredPermission: "settings.organization",
    group: "organizzazione",
  },
  {
    key: "team",
    label: "Team & Membri",
    icon: FiUsers,
    description: "Invita membri, gestisci ruoli",
    requiredPermission: "settings.team",
    group: "organizzazione",
  },
  {
    key: "company",
    label: "Azienda & Fatturazione",
    icon: FiFileText,
    description: "Dati aziendali per documenti e SDI",
    requiredPermission: "settings.company",
    group: "organizzazione",
  },
  {
    key: "billing",
    label: "Abbonamento",
    icon: FiCreditCard,
    description: "Piano, pagamento e moduli attivi",
    requiredPermission: "settings.billing",
    group: "organizzazione",
  },
  {
    key: "rifiuti",
    label: "Rifiuti RENTRI",
    icon: FiTrash2,
    description: "Limiti, certificati e configurazioni RENTRI",
    requiredPermission: "settings.rifiuti",
    group: "moduli",
  },
  {
    key: "marketplace",
    label: "Marketplace",
    icon: FiGlobe,
    description: "Collega eBay, Subito.it, Shopify",
    requiredPermission: "settings.marketplace",
    group: "moduli",
  },
  {
    key: "invoiceSettings",
    label: "Fatture",
    icon: FiFileText,
    description: "Voci preimpostate, termini e note fatture",
    requiredPermission: "settings.company",
    group: "moduli",
  },
  {
    key: "quoteSettings",
    label: "Preventivi",
    icon: FiClipboard,
    description: "Voci preimpostate, validità e note preventivi",
    requiredPermission: "settings.company",
    group: "moduli",
  },
  {
    key: "piazzale",
    label: "Piazzale",
    icon: FiMapPin,
    description: "Zone, posizioni e gestione piazzale",
    requiredPermission: "settings.general",
    group: "moduli",
  },
  {
    key: "trasporti",
    label: "Trasporti",
    icon: FiTruck,
    description: "Configurazione trasporti e workflow autisti",
    requiredPermission: "settings.general",
    group: "moduli",
  },
  {
    key: "demolizione",
    label: "Demolizione VFU",
    icon: FiTruck,
    description: "Voci fattura, importi e template demolizione",
    requiredPermission: "settings.general",
    group: "moduli",
  },
  {
    key: "calendario",
    label: "Calendario",
    icon: FiCalendar,
    description: "Orari, festivi, durata appuntamenti e colori",
    requiredPermission: "settings.general",
    group: "moduli",
  },
  {
    key: "crmClienti",
    label: "CRM Clienti",
    icon: FiBookOpen,
    description: "Categorie, tag, campi custom e pipeline",
    requiredPermission: "settings.company",
    group: "moduli",
  },
  {
    key: "gps",
    label: "Tracking GPS",
    icon: FiNavigation,
    description: "Dispositivi GPS e tracking live trasporti",
    requiredPermission: "settings.general",
    group: "moduli",
  },
  {
    key: "general",
    label: "Generali",
    icon: FiSettings,
    description: "Lingua, fuso orario, workflow",
    requiredPermission: "settings.general",
    group: "sistema",
  },
  {
    key: "appearance",
    label: "Aspetto & Branding",
    icon: FiGlobe,
    description: "Tema e personalizzazione grafica",
    requiredPermission: "settings.appearance",
    group: "sistema",
  },
  {
    key: "notifications",
    label: "Notifiche",
    icon: FiBell,
    description: "Preferenze notifiche",
    requiredPermission: "settings.notifications",
    group: "sistema",
  },
  {
    key: "security",
    label: "Sicurezza",
    icon: FiLock,
    description: "Sessioni, audit log, 2FA",
    requiredPermission: "settings.security",
    group: "sistema",
  },
  {
    key: "data",
    label: "Dati & Backup",
    icon: FiDatabase,
    description: "Esporta e importa impostazioni",
    requiredPermission: "settings.data",
    group: "sistema",
  },
];

const TAB_GROUPS = [
  { key: "personale", label: "Personale" },
  { key: "organizzazione", label: "Organizzazione" },
  { key: "moduli", label: "Moduli" },
  { key: "sistema", label: "Sistema" },
];

// Valori di default
const DEFAULTS = {
  company: {
    name: "",
    vat: "",
    taxCode: "",
    address: "",
    zip: "",
    city: "",
    province: "",
    country: "IT",
    phone: "",
    email: "",
    regimeFiscale: "RF01",
    logoUrl: null,
    brandColor: "#4f46e5",
  },
  appearance: {
    theme: "system",
    density: "comfortable",
    sidebar: "expanded"
  },
  general: {
    language: "it",
    timezone: "Europe/Rome",
    units: "metric",
    mapProvider: "google",
    workflow: {
      statuses: ["da fare", "in corso", "completato", "in attesa"],
      defaultStatus: "da fare",
      requirePhotoOnComplete: true,
      requireSignature: false,
      slaMinutes: 45,
    },
  },
  quotes: {
    presets: [],
    defaultFields: {
      paymentTerms: "30 giorni data fattura",
      validityDays: 30,
      notes: "",
    }
  },
  invoices: {
    presets: [],
    defaultFields: {
      paymentTerms: "30 giorni data fattura",
      paymentMethod: "bonifico",
      iban: "",
      notes: "",
    },
    availableFields: [
      { key: "paymentTerms", label: "Termini di pagamento", enabled: true },
      { key: "paymentMethod", label: "Metodo di pagamento", enabled: true },
      { key: "iban", label: "IBAN", enabled: true },
      { key: "notes", label: "Note", enabled: true },
      { key: "discount", label: "Sconto", enabled: false },
      { key: "stamp", label: "Bollo", enabled: false },
    ]
  },
  piazzale: {
    zones: [
      { name: "Zona A - Ingresso", type: "ingresso", capacity: 20, color: "#3b82f6" },
      { name: "Zona B - Stoccaggio", type: "stoccaggio", capacity: 50, color: "#10b981" },
      { name: "Zona C - Demolizione", type: "lavorazione", capacity: 10, color: "#f59e0b" },
      { name: "Zona D - Ricambi", type: "ricambi", capacity: 30, color: "#8b5cf6" },
      { name: "Zona E - Rottami", type: "rottami", capacity: 40, color: "#ef4444" },
    ],
    defaultZone: "Zona A - Ingresso",
    autoAssignPosition: true,
    requirePhotoOnEntry: false,
    trackMovements: true,
  },
  trasporti: {
    defaultStatus: "da fare",
    statuses: ["da fare", "assegnato", "in corso", "completato", "annullato"],
    requireDriverAssignment: true,
    requireVehicleAssignment: true,
    requirePhotoOnPickup: false,
    requirePhotoOnDelivery: false,
    requireSignatureOnDelivery: false,
    autoNotifyDriver: true,
    maxStopsPerTrip: 5,
    defaultNotes: "",
  },
  calendario: {
    orarioLavorativo: { inizio: "08:00", fine: "18:00" },
    giorniLavorativi: ["lun", "mar", "mer", "gio", "ven"],
    durataDefaultMinuti: 60,
    pausa: { inizio: "13:00", fine: "14:00", abilitata: true },
    giorniFestivi: [
      { data: "01-01", nome: "Capodanno" },
      { data: "06-01", nome: "Epifania" },
      { data: "25-04", nome: "Liberazione" },
      { data: "01-05", nome: "Festa del Lavoro" },
      { data: "02-06", nome: "Festa della Repubblica" },
      { data: "15-08", nome: "Ferragosto" },
      { data: "01-11", nome: "Ognissanti" },
      { data: "08-12", nome: "Immacolata" },
      { data: "25-12", nome: "Natale" },
      { data: "26-12", nome: "Santo Stefano" },
    ],
    coloriEventi: {
      trasporto: "#3b82f6",
      appuntamento: "#10b981",
      scadenza: "#ef4444",
      promemoria: "#f59e0b",
      personale: "#8b5cf6",
    },
    mostraWeekend: false,
    vistaDefault: "settimana",
  },
  crmClienti: {
    categorie: [
      { nome: "Privato", colore: "#3b82f6" },
      { nome: "Azienda", colore: "#10b981" },
      { nome: "Ente Pubblico", colore: "#8b5cf6" },
      { nome: "Assicurazione", colore: "#f59e0b" },
      { nome: "Concessionario", colore: "#ef4444" },
      { nome: "Officina", colore: "#06b6d4" },
    ],
    tagPredefiniti: [
      "VIP", "Pagatore puntuale", "Ritardatario", "Fornitore", "Grossista",
      "Nuovo", "Fidelizzato", "Da ricontattare", "Sospeso"
    ],
    campiCustom: [
      { key: "referente", label: "Referente", tipo: "testo", abilitato: true },
      { key: "settore", label: "Settore", tipo: "selezione", abilitato: true, opzioni: ["Automotive", "Trasporti", "Edilizia", "Altro"] },
      { key: "note_interne", label: "Note Interne", tipo: "testo_lungo", abilitato: true },
      { key: "sconto_default", label: "Sconto Default %", tipo: "numero", abilitato: false },
      { key: "data_primo_contatto", label: "Data Primo Contatto", tipo: "data", abilitato: false },
    ],
    pipeline: [
      { nome: "Lead", colore: "#94a3b8" },
      { nome: "Contattato", colore: "#3b82f6" },
      { nome: "Preventivo inviato", colore: "#f59e0b" },
      { nome: "Trattativa", colore: "#8b5cf6" },
      { nome: "Cliente attivo", colore: "#10b981" },
      { nome: "Perso", colore: "#ef4444" },
    ],
    requireEmail: false,
    requirePhone: true,
    requirePIVA: false,
    autoAssignCategory: true,
  },
  notify: {
    desktop: true,
    sound: false,
    when: {
      newAssignment: true,
      statusChange: true,
      calendarReminder: true
    },
  },
};

export default function Settings() {
  const supabase = supabaseBrowser();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { orgId: currentOrg, orgName, orgs, setCurrentOrg, refresh, role } = useOrg();

  // Filtra tab in base al ruolo utente
  const TABS = useMemo(() => filterTabsByRole(ALL_TABS, role || "owner"), [role]);

  const [activeTab, setActiveTab] = useState("profile");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [toast, setToast] = useState({ type: "success", msg: "" });

  // Toast auto-dismiss
  const toastTimerRef = useRef(null);
  const showToast = useCallback((type, msg) => {
    setToast({ type, msg });
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast({ type: "success", msg: "" }), 4000);
  }, []);

  // Gestisci ?tab= dalla URL
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam && TABS.some(t => t.key === tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams, TABS]);

  // Stato sezioni
  const [company, setCompany] = useState(DEFAULTS.company);
  const [appearance, setAppearance] = useState(DEFAULTS.appearance);
  const [general, setGeneral] = useState(DEFAULTS.general);
  const [quotes, setQuotes] = useState(DEFAULTS.quotes);
  const [invoices, setInvoices] = useState(DEFAULTS.invoices);
  const [piazzale, setPiazzale] = useState(DEFAULTS.piazzale);
  const [trasporti, setTrasporti] = useState(DEFAULTS.trasporti);
  const [calendario, setCalendario] = useState(DEFAULTS.calendario);
  const [crmClienti, setCrmClienti] = useState(DEFAULTS.crmClienti);
  const [notify, setNotify] = useState(DEFAULTS.notify);

  // Stato ambiente RENTRI
  const [rentriEnv, setRentriEnv] = useState('demo');
  const [rentriEnvLoading, setRentriEnvLoading] = useState(false);
  const [rentriCertInfo, setRentriCertInfo] = useState(null);
  const [rentriOtherEnvHasCert, setRentriOtherEnvHasCert] = useState(false);

  // Stato dispositivi di firma remota (demo + prod separati)
  const [firmaDevices, setFirmaDevices] = useState({ demo: null, prod: null }); // { demo: {certId, devices[]}, prod: {certId, devices[]} }
  const [editingFirmaEnv, setEditingFirmaEnv] = useState(null); // 'demo' | 'prod' | null
  const [firmaDeviceInputs, setFirmaDeviceInputs] = useState([]);
  const [savingFirmaDev, setSavingFirmaDev] = useState(false);

  // Stato personalizzazione aziendale
  const [companySettings, setCompanySettings] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  // Stato modal creazione template
  const [showCreateTemplateModal, setShowCreateTemplateModal] = useState(false);
  const [templateForm, setTemplateForm] = useState({
    name: '',
    description: '',
    category: 'transports',
    document_type: 'pdf',
    template_config: {},
    fields_config: {},
    styling_config: {},
    layout_config: {},
    data_source: 'transports'
  });
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [editTemplateForm, setEditTemplateForm] = useState({ name: '', description: '' });
  const [savingEditTemplate, setSavingEditTemplate] = useState(false);

  // Carica ambiente RENTRI corrente
  const loadRentriEnvironment = useCallback(async () => {
    if (!currentOrg) return;
    try {
      // Legge dal certificato attivo (is_default = true)
      const { data: activeCert } = await supabase
        .from('rentri_org_certificates')
        .select('id, cf_operatore, ragione_sociale, expires_at, environment, is_active')
        .eq('org_id', currentOrg)
        .eq('is_default', true)
        .eq('is_active', true)
        .maybeSingle();

      const currentEnv = activeCert?.environment || 'demo';
      setRentriEnv(currentEnv);

      // Carica info certificato attivo e verifica se l'altro ambiente ha certificato
      const { data: certs } = await supabase
        .from('rentri_org_certificates')
        .select('id, cf_operatore, ragione_sociale, expires_at, environment, is_active')
        .eq('org_id', currentOrg)
        .eq('is_active', true);

      if (certs?.length > 0) {
        const currentEnvCert = certs.find(c => c.environment === currentEnv);
        const otherEnvCert = certs.find(c => c.environment !== currentEnv);
        if (currentEnvCert) setRentriCertInfo(currentEnvCert);
        setRentriOtherEnvHasCert(!!otherEnvCert);
      }
    } catch (err) {
      console.error("[Settings] Errore caricamento ambiente RENTRI:", err);
    }
  }, [currentOrg]);

  useEffect(() => {
    loadRentriEnvironment();
  }, [loadRentriEnvironment]);

  function parseDevicesSett(raw) {
    if (!raw) return [];
    const t = raw.trim();
    if (t.startsWith('[')) {
      try { const arr = JSON.parse(t); if (Array.isArray(arr)) return arr.map((d, i) => ({ name: d.name || `Dispositivo ${i + 1}`, id: d.id || '' })); } catch(e) {}
    }
    const plain = t.replace(/^credentials_id_mobile:/, '');
    return plain ? [{ name: 'Dispositivo 1', id: plain }] : [];
  }

  const loadFirmaDevice = useCallback(async () => {
    if (!currentOrg) return;
    try {
      const { data: certs } = await supabase
        .from('rentri_org_certificates')
        .select('id, credentials_id_mobile, note, environment')
        .eq('org_id', currentOrg)
        .eq('tipo_certificato', 'firma_remota')
        .eq('is_active', true);
      const result = { demo: null, prod: null };
      (certs || []).forEach(c => {
        const raw = c.credentials_id_mobile || c.note?.match(/credentials_id_mobile:(\S+)/)?.[1] || null;
        result[c.environment] = { certId: c.id, devices: parseDevicesSett(raw) };
      });
      setFirmaDevices(result);
    } catch (err) {
      console.error('[Settings] Errore caricamento firma devices:', err);
    }
  }, [currentOrg]);

  useEffect(() => { loadFirmaDevice(); }, [loadFirmaDevice]);

  function startEditFirmaEnv(env) {
    const envData = firmaDevices[env];
    setFirmaDeviceInputs(envData?.devices.length > 0 ? envData.devices : [{ name: 'Dispositivo 1', id: '' }]);
    setEditingFirmaEnv(env);
  }

  async function saveFirmaDevices() {
    const certId = firmaDevices[editingFirmaEnv]?.certId;
    if (!certId) return;
    setSavingFirmaDev(true);
    try {
      const valid = firmaDeviceInputs.filter(d => d.id.trim());
      const jsonVal = valid.length > 0 ? JSON.stringify(valid) : null;
      const { error } = await supabase
        .from('rentri_org_certificates')
        .update({ credentials_id_mobile: jsonVal, note: valid.length > 0 ? `credentials_id_mobile:${valid[0].id}` : null })
        .eq('id', certId).eq('org_id', currentOrg);
      if (error) throw error;
      setEditingFirmaEnv(null);
      await loadFirmaDevice();
    } catch (err) { alert('Errore salvataggio: ' + err.message); }
    finally { setSavingFirmaDev(false); }
  }

  // Cambia ambiente RENTRI
  const handleRentriEnvChange = useCallback(async (newEnv) => {
    if (!currentOrg || newEnv === rentriEnv) return;

    // Verifica che esista il certificato per l'ambiente di destinazione
    const { data: targetCert } = await supabase
      .from('rentri_org_certificates')
      .select('id')
      .eq('org_id', currentOrg)
      .eq('environment', newEnv)
      .eq('is_active', true)
      .maybeSingle();

    if (!targetCert) {
      showToast('error', `Nessun certificato ${newEnv === 'prod' ? 'PRODUZIONE' : 'DEMO'} trovato. Caricane uno prima di cambiare ambiente.`);
      return;
    }

    if (newEnv === 'prod') {
      const conferma = window.confirm(
        'ATTENZIONE: Stai per passare all\'ambiente di PRODUZIONE.\n\n' +
        '• I dati inviati avranno valore legale\n' +
        '• Assicurati di avere un certificato PRODUZIONE valido\n' +
        '• Verifica che tutti i test in ambiente DEMO siano superati\n\n' +
        'Vuoi continuare?'
      );
      if (!conferma) return;
    }

    setRentriEnvLoading(true);
    try {
      // Disattiva il certificato dell'ambiente opposto
      const oldEnv = rentriEnv === 'demo' ? 'prod' : 'demo';
      await supabase
        .from('rentri_org_certificates')
        .update({ is_default: false })
        .eq('org_id', currentOrg)
        .eq('environment', oldEnv);

      // Attiva il certificato del nuovo ambiente
      const { error: certError } = await supabase
        .from('rentri_org_certificates')
        .update({ is_default: true, is_active: true })
        .eq('org_id', currentOrg)
        .eq('environment', newEnv);

      if (certError) throw certError;

      // BUGFIX: Aggiorna anche org_settings.rentri_environment
      // Questo è necessario perché getRentriEnvironment() legge da org_settings
      const { error: settingsError } = await supabase
        .from('org_settings')
        .update({ rentri_environment: newEnv })
        .eq('org_id', currentOrg);

      if (settingsError) {
        console.warn("[Settings] Errore aggiornamento org_settings:", settingsError);
        // Non bloccare l'operazione se org_settings fallisce
      }

      setRentriEnv(newEnv);
      showToast('success', `Ambiente RENTRI cambiato a ${newEnv === 'prod' ? 'PRODUZIONE' : 'TEST/DEMO'}`);
      await loadRentriEnvironment();
    } catch (err) {
      console.error("[Settings] Errore cambio ambiente RENTRI:", err);
      showToast('error', 'Errore salvataggio ambiente RENTRI');
    } finally {
      setRentriEnvLoading(false);
    }
  }, [currentOrg, rentriEnv, showToast, loadRentriEnvironment]);

  // Carica impostazioni iniziali
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);
        // Carica da localStorage come fallback
        const savedSettings = localStorage.getItem('rm-settings');
        if (savedSettings) {
          const parsed = JSON.parse(savedSettings);
          setCompany({ ...DEFAULTS.company, ...parsed.company });
          setAppearance({ ...DEFAULTS.appearance, ...parsed.appearance });
          setGeneral({ ...DEFAULTS.general, ...parsed.general });
          setQuotes({ ...DEFAULTS.quotes, ...parsed.quotes });
          setInvoices({ ...DEFAULTS.invoices, ...parsed.invoices });
          setNotify({ ...DEFAULTS.notify, ...parsed.notify });
        }

        // Carica impostazioni aziendali da Supabase
        if (currentOrg) {
          await loadCompanySettings();
          await loadTemplates();
        }
      } catch (err) {
        console.error("Error loading settings:", err);
        showToast("error", "Errore durante il caricamento delle impostazioni");
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [currentOrg]);

  // Propaga le modifiche di "appearance" (tema, densità, sidebar) all'intera app
  useEffect(() => {
    try {
      localStorage.setItem('rm-appearance', JSON.stringify(appearance));
      window.dispatchEvent(new CustomEvent('rm-appearance-change', { detail: appearance }));
    } catch {
      // se localStorage non è disponibile, ignoriamo
    }
  }, [appearance]);

  // Carica impostazioni aziendali
  const loadCompanySettings = async () => {
    if (!currentOrg) return;

    try {
      const settings = await CompanySettingsService.get(currentOrg);
      setCompanySettings(settings);
    } catch (error) {
      console.error("Error loading company settings:", error);
    }
  };

  // Carica template
  const loadTemplates = async () => {
    if (!currentOrg) return;

    try {
      setLoadingTemplates(true);
      const templatesData = await ExportTemplateService.getAll(currentOrg);
      setTemplates(templatesData);
    } catch (error) {
      console.error("Error loading templates:", error);
      showToast("error", "Errore durante il caricamento dei template");
    } finally {
      setLoadingTemplates(false);
    }
  };

  // Crea nuovo template
  const handleCreateTemplate = async () => {
    if (!currentOrg) {
      showToast("error", "Organizzazione non selezionata");
      return;
    }

    // Validazione
    if (!templateForm.name || !templateForm.name.trim()) {
      showToast("error", "Il nome del template è obbligatorio");
      return;
    }

    try {
      setSavingTemplate(true);

      // Determina data_source basato sulla categoria
      const dataSourceMap = {
        'transports': 'transports',
        'clients': 'clients',
        'quotes': 'quotes',
        'invoices': 'invoices',
        'yard': 'yard',
        'spare_parts': 'spare_parts',
        'drivers': 'drivers',
        'vehicles': 'vehicles'
      };

      const templateData = {
        name: templateForm.name.trim(),
        description: templateForm.description.trim() || undefined,
        category: templateForm.category,
        document_type: templateForm.document_type,
        template_config: templateForm.template_config,
        fields_config: templateForm.fields_config,
        styling_config: templateForm.styling_config,
        layout_config: templateForm.layout_config,
        data_source: dataSourceMap[templateForm.category] || 'transports'
      };

      // Valida prima di salvare
      const errors = ExportTemplateService.validateTemplate(templateData);
      if (errors.length > 0) {
        showToast("error", `Errori di validazione: ${errors.join(', ')}`);
        return;
      }

      await ExportTemplateService.create(currentOrg, templateData);

      showToast("success", "Template creato con successo!");
      setShowCreateTemplateModal(false);
      setTemplateForm({
        name: '',
        description: '',
        category: 'transports',
        document_type: 'pdf',
        template_config: {},
        fields_config: {},
        styling_config: {},
        layout_config: {},
        data_source: 'transports'
      });

      // Ricarica template
      await loadTemplates();
    } catch (error) {
      console.error("Error creating template:", error);
      showToast("error", error.message || "Errore durante la creazione del template");
    } finally {
      setSavingTemplate(false);
    }
  };

  const openEditTemplateModal = (template) => {
    if (!template) return;
    setEditingTemplate(template);
    setEditTemplateForm({
      name: template.name || '',
      description: template.description || ''
    });
  };

  const handleUpdateTemplate = async () => {
    if (!editingTemplate) return;

    const trimmedName = editTemplateForm.name.trim();
    if (!trimmedName) {
      showToast("error", "Il nome del template è obbligatorio");
      return;
    }

    try {
      setSavingEditTemplate(true);
      await ExportTemplateService.update(editingTemplate.id, {
        name: trimmedName,
        description: editTemplateForm.description.trim() || null
      });

      showToast("success", "Template aggiornato con successo");
      setEditingTemplate(null);
      await loadTemplates();
    } catch (error) {
      console.error("Error updating template:", error);
      showToast("error", error.message || "Errore durante l'aggiornamento del template");
    } finally {
      setSavingEditTemplate(false);
    }
  };


  // Tracking modifiche
  const snapshot = useMemo(() => JSON.stringify({
    company, appearance, general, quotes, invoices, piazzale, trasporti, calendario, crmClienti, notify
  }), [company, appearance, general, quotes, invoices, piazzale, trasporti, calendario, crmClienti, notify]);

  const lastSavedRef = useRef(snapshot);
  const hasLoadedRef = useRef(false);
  useEffect(() => {
    // Dopo il primo caricamento, aggiorna il riferimento "salvato" per evitare falso dirty
    if (!hasLoadedRef.current && !loading) {
      lastSavedRef.current = snapshot;
      hasLoadedRef.current = true;
      setDirty(false);
      return;
    }
    setDirty(snapshot !== lastSavedRef.current && !loading);
  }, [snapshot, loading]);

  // Funzioni per gestire le impostazioni aziendali
  const updateCompanySetting = async (field, value) => {
    if (!currentOrg) return;

    try {
      const updatedSettings = await CompanySettingsService.update(currentOrg, {
        [field]: value
      });
      setCompanySettings(updatedSettings);
      showToast("success", "Impostazione aggiornata");
    } catch (error) {
      console.error("Error updating company setting:", error);
      showToast("error", "Errore durante l'aggiornamento");
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !currentOrg) return;

    try {
      const logoUrl = await CompanySettingsService.uploadLogo(file, currentOrg);
      setCompanySettings(prev => ({ ...prev, logo_url: logoUrl }));
      showToast("success", "Logo caricato con successo");
    } catch (error) {
      console.error("Error uploading logo:", error);
      showToast("error", "Errore durante il caricamento del logo");
    }
  };

  const handleLogoDelete = async () => {
    if (!currentOrg || !companySettings?.logo_url) return;

    try {
      await CompanySettingsService.deleteLogo(currentOrg, companySettings.logo_url);
      setCompanySettings(prev => ({ ...prev, logo_url: null }));
      showToast("success", "Logo rimosso");
    } catch (error) {
      console.error("Error deleting logo:", error);
      showToast("error", "Errore durante la rimozione del logo");
    }
  };

  // Salvataggio
  const saveAll = async () => {
    try {
      setSaving(true);
      const settings = { company, appearance, general, quotes, invoices, notify };

      // Salva in localStorage
      localStorage.setItem('rm-settings', JSON.stringify(settings));
      lastSavedRef.current = JSON.stringify(settings);

      // Salva anche in org_settings per uso nelle fatture SDI
      if (currentOrg && company) {
        try {
          // Salva dati azienda in org_settings per uso nelle fatture
          const { error: orgSettingsError } = await supabase
            .from('org_settings')
            .upsert({
              org_id: currentOrg,
              key: 'company',
              value: company,
              updated_at: new Date().toISOString(),
            }, {
              onConflict: 'org_id,key'
            });

          if (orgSettingsError) {
            console.warn('Errore salvataggio org_settings:', orgSettingsError);
            // Non bloccare il salvataggio se fallisce
          }
        } catch (e) {
          console.warn('Errore salvataggio org_settings:', e);
          // Non bloccare il salvataggio se fallisce
        }
      }

      setDirty(false);
      showToast("success", "Impostazioni salvate con successo");

      // Se c'è un parametro return, torna alla pagina precedente dopo il salvataggio
      const returnPath = searchParams.get('return');
      if (returnPath) {
        setTimeout(() => {
          navigate(returnPath);
        }, 500);
      }
    } catch (err) {
      console.error("Error saving settings:", err);
      showToast("error", "Errore durante il salvataggio");
    } finally {
      setSaving(false);
    }
  };

  // Esporta configurazione
  const exportConfig = async () => {
    try {
      const settings = { company, appearance, general, quotes, invoices, notify };
      const json = JSON.stringify(settings, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `rescuemanager_settings_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      showToast("success", "Configurazione esportata");
    } catch (err) {
      console.error("Export error:", err);
      showToast("error", "Errore durante l'esportazione");
    }
  };

  // Importa configurazione
  const importConfig = async () => {
    try {
      const inp = document.createElement("input");
      inp.type = "file";
      inp.accept = "application/json";
      inp.onchange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const text = await file.text();
        const data = JSON.parse(text || "{}");

        setCompany({ ...DEFAULTS.company, ...data.company });
        setAppearance({ ...DEFAULTS.appearance, ...data.appearance });
        setGeneral({ ...DEFAULTS.general, ...data.general });
        setQuotes({ ...DEFAULTS.quotes, ...data.quotes });
        setInvoices({ ...DEFAULTS.invoices, ...data.invoices });
        setNotify({ ...DEFAULTS.notify, ...data.notify });

        showToast("success", "Configurazione importata con successo");
      };
      inp.click();
    } catch (err) {
      console.error("Import error:", err);
      showToast("error", "Errore durante l'importazione");
    }
  };

  // Gestione logo
  const onLogoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => setCompany(prev => ({ ...prev, logoUrl: reader.result }));
    reader.readAsDataURL(file);
  };

  // Gestione organizzazioni
  const createOrganization = async (name) => {
    const cleanName = String(name || "").trim();
    if (!cleanName) {
      showToast("error", "Inserisci un nome valido");
      return;
    }

    try {
      const { data: org, error: orgError } = await supabase
        .from("orgs")
        .insert({ name: cleanName })
        .select("id, name")
        .single();

      if (orgError) throw orgError;

      await setCurrentOrg(org.id);
      await refresh();
      showToast("success", "Organizzazione creata con successo");
    } catch (err) {
      console.error("Error creating organization:", err);
      const errorMsg = err?.message || "Errore durante la creazione dell'organizzazione";
      showToast("error", errorMsg);
    }
  };

  const deleteOrganization = async (orgId, orgName) => {
    if (!orgId) return;
    if (!confirm(`Eliminare l'organizzazione "${orgName}"?`)) return;

    try {
      const { error } = await supabase
        .from("orgs")
        .delete()
        .eq("id", orgId);

      if (error) throw error;

      if (currentOrg === orgId) await setCurrentOrg(null);
      await refresh();
      showToast("success", "Organizzazione eliminata");
    } catch (err) {
      showToast("error", err?.message || "Errore durante l'eliminazione");
    }
  };

  const setOrgAsCurrent = async (id) => {
    try {
      await setCurrentOrg(id);
      showToast("success", "Organizzazione impostata come corrente");
    } catch (err) {
      showToast("error", "Errore durante l'impostazione dell'organizzazione");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-3">
          <FiRefreshCw className="w-6 h-6 animate-spin text-blue-400" />
          <p className="text-slate-400">Caricamento impostazioni...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-100">Impostazioni</h1>
          <p className="text-xs text-slate-500 mt-0.5">Personalizza RescueManager per la tua azienda</p>
        </div>
        {/* Mobile sidebar toggle */}
        <button
          onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          className="md:hidden inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-300 bg-[#1a2536] border border-[#243044] rounded-lg"
        >
          <FiMenu className="w-3.5 h-3.5" />
          {TABS.find(t => t.key === activeTab)?.label || "Menu"}
        </button>
      </div>

      {/* Mobile dropdown */}
      {mobileSidebarOpen && (
        <div className="md:hidden bg-[#1a2536] rounded-xl border border-[#243044] p-2 mt-2">
          <div className="grid grid-cols-2 gap-1">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => { setActiveTab(tab.key); setMobileSidebarOpen(false); }}
                  className={`flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs transition-colors ${activeTab === tab.key ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-[#141c27]"
                    }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex gap-4 flex-1">
        {/* Sidebar — grouped by category */}
        <aside className="hidden md:block w-64 shrink-0">
          <div className="bg-[#1a2536] rounded-xl border border-[#243044] p-3 sticky top-4">
            <nav className="space-y-3">
              {TAB_GROUPS.map((group) => {
                const groupTabs = TABS.filter(t => t.group === group.key);
                if (groupTabs.length === 0) return null;
                return (
                  <div key={group.key}>
                    <h3 className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5 px-2">{group.label}</h3>
                    <div className="space-y-0.5">
                      {groupTabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.key;
                        return (
                          <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`w-full text-left flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-colors ${isActive
                              ? "bg-blue-600 text-white"
                              : "text-slate-300 hover:bg-[#141c27]"
                              }`}
                          >
                            <Icon className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">{tab.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Content */}
        <div className="flex-1 space-y-4 min-w-0">
          {/* Action Bar */}
          <div className="bg-[#1a2536] rounded-xl border border-[#243044] p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {dirty && (
                  <span className="inline-flex items-center gap-1.5 px-2 py-1 text-xs text-amber-400 bg-amber-500/10 rounded-full">
                    <FiAlertCircle className="w-3 h-3" />
                    Non salvato
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={exportConfig}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-slate-400 bg-[#141c27] border border-[#243044] rounded-lg hover:bg-[#243044] transition-colors"
                >
                  <FiDownload className="w-3.5 h-3.5" />
                  Esporta
                </button>
                <button
                  onClick={importConfig}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-slate-400 bg-[#141c27] border border-[#243044] rounded-lg hover:bg-[#243044] transition-colors"
                >
                  <FiUpload className="w-3.5 h-3.5" />
                  Importa
                </button>
                <button
                  onClick={saveAll}
                  disabled={saving || !dirty}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {saving ? <FiRefreshCw className="w-3.5 h-3.5 animate-spin" /> : <FiSave className="w-3.5 h-3.5" />}
                  {saving ? "Salvataggio..." : "Salva"}
                </button>
              </div>
            </div>
          </div>

          {/* Profile Tab */}
          {activeTab === "profile" && (
            <ProfileSettings showToast={showToast} />
          )}

          {/* Team Tab */}
          {activeTab === "team" && (
            <TeamSettings showToast={showToast} />
          )}

          {/* Billing Tab */}
          {activeTab === "billing" && (
            <BillingSettings showToast={showToast} />
          )}

          {/* Security Tab */}
          {activeTab === "security" && (
            <SecuritySettings showToast={showToast} />
          )}

          {/* Organization Tab */}
          {activeTab === "organization" && (
            <OrganizationSettings showToast={showToast} />
          )}

          {/* Demolizione VFU Tab */}
          {activeTab === "demolizione" && (
            <DemolizioneSettings showToast={showToast} />
          )}

          {/* Company Tab */}
          {activeTab === "company" && (
            <Section title="Profilo Aziendale" desc="Dati aziendali per fatturazione elettronica e branding">
              <div className="space-y-5">
                {/* Dati Anagrafici */}
                <div>
                  <h3 className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-3">Dati Anagrafici</h3>
                  <div className="grid grid-cols-6 gap-x-3 gap-y-3">
                    <Field label="Denominazione / Ragione sociale" required className="col-span-4">
                      <input
                        type="text"
                        className="w-full px-3 py-1.5 text-xs border border-[#243044] rounded-lg bg-[#141c27] text-slate-200 placeholder-slate-500 focus:ring-1 focus:ring-blue-500/40 outline-none"
                        placeholder="La Tua Azienda Srl"
                        value={company.name}
                        onChange={(e) => setCompany(prev => ({ ...prev, name: e.target.value }))}
                      />
                    </Field>
                    <Field label="Partita IVA" required className="col-span-2">
                      <input
                        type="text"
                        className="w-full px-3 py-1.5 text-xs border border-[#243044] rounded-lg bg-[#141c27] text-slate-200 placeholder-slate-500 focus:ring-1 focus:ring-blue-500/40 outline-none"
                        placeholder="IT12345678901"
                        value={company.vat}
                        onChange={(e) => setCompany(prev => ({ ...prev, vat: e.target.value.toUpperCase() }))}
                      />
                    </Field>
                    <Field label="Codice Fiscale" tooltip="Se diverso dalla Partita IVA" className="col-span-2">
                      <input
                        type="text"
                        className="w-full px-3 py-1.5 text-xs border border-[#243044] rounded-lg bg-[#141c27] text-slate-200 placeholder-slate-500 focus:ring-1 focus:ring-blue-500/40 outline-none"
                        placeholder="Se diverso da P.IVA"
                        value={company.taxCode}
                        onChange={(e) => setCompany(prev => ({ ...prev, taxCode: e.target.value.toUpperCase() }))}
                      />
                    </Field>
                    <Field label="Regime Fiscale" required className="col-span-4">
                      <select
                        className="w-full px-3 py-1.5 text-xs border border-[#243044] rounded-lg bg-[#141c27] text-slate-200 focus:ring-1 focus:ring-blue-500/40 outline-none"
                        value={company.regimeFiscale}
                        onChange={(e) => setCompany(prev => ({ ...prev, regimeFiscale: e.target.value }))}
                      >
                        {REGIMI_FISCALI.map(rf => (
                          <option key={rf.value} value={rf.value}>{rf.label}</option>
                        ))}
                      </select>
                    </Field>

                  </div>
                </div>

                {/* Sede Legale */}
                <div>
                  <h3 className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-3">Sede Legale</h3>
                  <div className="grid grid-cols-6 gap-x-3 gap-y-3">
                    <Field label="Indirizzo" required className="col-span-4">
                      <input
                        type="text"
                        className="w-full px-3 py-1.5 text-xs border border-[#243044] rounded-lg bg-[#141c27] text-slate-200 placeholder-slate-500 focus:ring-1 focus:ring-blue-500/40 outline-none"
                        placeholder="Via Roma 123"
                        value={company.address}
                        onChange={(e) => setCompany(prev => ({ ...prev, address: e.target.value }))}
                      />
                    </Field>
                    <Field label="CAP" required className="col-span-1">
                      <input
                        type="text"
                        className="w-full px-3 py-1.5 text-xs border border-[#243044] rounded-lg bg-[#141c27] text-slate-200 placeholder-slate-500 focus:ring-1 focus:ring-blue-500/40 outline-none"
                        placeholder="00100"
                        value={company.zip}
                        maxLength={5}
                        onChange={(e) => setCompany(prev => ({ ...prev, zip: e.target.value }))}
                      />
                    </Field>
                    <Field label="Nazione" className="col-span-1">
                      <input
                        type="text"
                        className="w-full px-3 py-1.5 text-xs border border-[#243044] rounded-lg bg-[#141c27] text-slate-200 placeholder-slate-500 focus:ring-1 focus:ring-blue-500/40 outline-none"
                        placeholder="IT"
                        value={company.country || 'IT'}
                        maxLength={2}
                        onChange={(e) => setCompany(prev => ({ ...prev, country: e.target.value.toUpperCase() }))}
                      />
                    </Field>
                    <Field label="Comune" required className="col-span-2">
                      <input
                        type="text"
                        className="w-full px-3 py-1.5 text-xs border border-[#243044] rounded-lg bg-[#141c27] text-slate-200 placeholder-slate-500 focus:ring-1 focus:ring-blue-500/40 outline-none"
                        placeholder="Roma"
                        value={company.city}
                        onChange={(e) => setCompany(prev => ({ ...prev, city: e.target.value }))}
                      />
                    </Field>
                    <Field label="Provincia" required className="col-span-1">
                      <input
                        type="text"
                        className="w-full px-3 py-1.5 text-xs border border-[#243044] rounded-lg bg-[#141c27] text-slate-200 placeholder-slate-500 focus:ring-1 focus:ring-blue-500/40 outline-none"
                        placeholder="RM"
                        value={company.province}
                        maxLength={2}
                        onChange={(e) => setCompany(prev => ({ ...prev, province: e.target.value.toUpperCase() }))}
                      />
                    </Field>

                  </div>
                </div>

                {/* Contatti */}
                <div>
                  <h3 className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-3">Contatti</h3>
                  <div className="grid grid-cols-6 gap-x-3 gap-y-3">
                    <Field label="Telefono" className="col-span-2">
                      <input
                        type="tel"
                        className="w-full px-3 py-1.5 text-xs border border-[#243044] rounded-lg bg-[#141c27] text-slate-200 placeholder-slate-500 focus:ring-1 focus:ring-blue-500/40 outline-none"
                        placeholder="+39 06 000000"
                        value={company.phone}
                        onChange={(e) => setCompany(prev => ({ ...prev, phone: e.target.value }))}
                      />
                    </Field>
                    <Field label="Email" className="col-span-2">
                      <input
                        type="email"
                        className="w-full px-3 py-1.5 text-xs border border-[#243044] rounded-lg bg-[#141c27] text-slate-200 placeholder-slate-500 focus:ring-1 focus:ring-blue-500/40 outline-none"
                        placeholder="info@azienda.it"
                        value={company.email}
                        onChange={(e) => setCompany(prev => ({ ...prev, email: e.target.value }))}
                      />
                    </Field>
                    <Field label="PEC" tooltip="Posta Elettronica Certificata" className="col-span-2">
                      <input
                        type="email"
                        className="w-full px-3 py-1.5 text-xs border border-[#243044] rounded-lg bg-[#141c27] text-slate-200 placeholder-slate-500 focus:ring-1 focus:ring-blue-500/40 outline-none"
                        placeholder="azienda@pec.it"
                        value={company.pec || ''}
                        onChange={(e) => setCompany(prev => ({ ...prev, pec: e.target.value }))}
                      />
                    </Field>
                  </div>
                </div>

                {/* Fatturazione Elettronica SDI */}
                <div>
                  <h3 className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-3">Fatturazione Elettronica (SDI)</h3>
                  <div className="grid grid-cols-6 gap-x-3 gap-y-3">
                    <Field label="Codice Destinatario SDI" tooltip="7 caratteri alfanumerici per ricezione fatture" className="col-span-2">
                      <input
                        type="text"
                        className="w-full px-3 py-1.5 text-xs border border-[#243044] rounded-lg bg-[#141c27] text-slate-200 placeholder-slate-500 focus:ring-1 focus:ring-blue-500/40 outline-none font-mono"
                        placeholder="T04ZHR3"
                        value={company.codiceDestinatario || ''}
                        maxLength={7}
                        onChange={(e) => setCompany(prev => ({ ...prev, codiceDestinatario: e.target.value.toUpperCase() }))}
                      />
                    </Field>
                    <Field label="IBAN" tooltip="Per pagamenti bonifico" className="col-span-4">
                      <input
                        type="text"
                        className="w-full px-3 py-1.5 text-xs border border-[#243044] rounded-lg bg-[#141c27] text-slate-200 placeholder-slate-500 focus:ring-1 focus:ring-blue-500/40 outline-none font-mono"
                        placeholder="IT60X0542811101000000123456"
                        value={company.iban || ''}
                        onChange={(e) => setCompany(prev => ({ ...prev, iban: e.target.value.replace(/\s+/g, '').toUpperCase() }))}
                      />
                    </Field>
                    <Field label="Note Legali" tooltip="Appariranno in fondo alle fatture (es. capitale sociale, REA, ecc.)" className="col-span-6">
                      <textarea
                        className="w-full px-3 py-2 text-xs border border-[#243044] rounded-lg bg-[#141c27] text-slate-200 placeholder-slate-500 focus:ring-1 focus:ring-blue-500/40 outline-none resize-vertical"
                        placeholder="Es: Capitale Sociale € 10.000 i.v. - REA RM-123456 - Registro Imprese di Roma"
                        rows={2}
                        value={company.legalNotes || ''}
                        onChange={(e) => setCompany(prev => ({ ...prev, legalNotes: e.target.value }))}
                      />
                    </Field>
                  </div>
                </div>

                {/* Branding */}
                <div>
                  <h3 className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Branding</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-3 p-3 bg-[#141c27] rounded-lg border border-[#243044]">
                      <div className="h-12 w-12 rounded-lg border border-[#243044] bg-[#1a2536] overflow-hidden flex items-center justify-center shrink-0">
                        {company.logoUrl ? (
                          <img src={company.logoUrl} alt="Logo" className="h-full w-full object-contain" />
                        ) : (
                          <FiImage className="w-5 h-5 text-slate-600" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-medium text-slate-300 mb-1">Logo Aziendale</div>
                        <label className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-medium text-slate-400 bg-[#1a2536] border border-[#243044] rounded hover:bg-[#243044] transition-colors cursor-pointer">
                          <FiUpload className="w-3 h-3" />
                          Carica
                          <input type="file" accept="image/*" className="hidden" onChange={onLogoChange} />
                        </label>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-[#141c27] rounded-lg border border-[#243044]">
                      <input
                        type="color"
                        value={company.brandColor}
                        onChange={(e) => setCompany(prev => ({ ...prev, brandColor: e.target.value }))}
                        className="h-12 w-12 rounded-lg border border-[#243044] bg-transparent cursor-pointer shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-medium text-slate-300">Colore Brand</div>
                        <div className="text-[10px] font-mono text-slate-500">{company.brandColor}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Section>
          )}

          {/* Rifiuti Tab */}
          {activeTab === "rifiuti" && (
            <Section
              title="Rifiuti RENTRI"
              desc="Configura limiti, certificati e parametri per il modulo RENTRI"
            >
              <div className="space-y-4">
                {/* Ambiente RENTRI */}
                <div className="bg-[#1a2536] rounded-lg border border-[#243044] p-4">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                    Ambiente RENTRI
                  </h3>
                  {rentriEnv !== 'prod' && (
                    <p className="text-xs text-slate-500 mb-4">
                      Seleziona l'ambiente di lavoro per RENTRI. L'ambiente TEST è per prove e sviluppo, mentre PRODUZIONE è per l'operatività reale con valore legale.
                    </p>
                  )}

                  <div className={`grid gap-3 ${rentriEnv === 'prod' ? 'grid-cols-1 max-w-sm' : 'grid-cols-2'}`}>
                    {rentriEnv !== 'prod' && (
                      <button
                        onClick={() => handleRentriEnvChange('demo')}
                        disabled={rentriEnvLoading || rentriEnv === 'demo'}
                        className={`flex flex-col items-start gap-2 p-4 rounded-lg border-2 transition-all ${rentriEnv === 'demo'
                          ? 'border-blue-500 bg-blue-500/10'
                          : 'border-[#243044] bg-[#141c27] hover:bg-[#1a2536] hover:border-blue-500/30'
                          }`}
                      >
                        <div className="flex items-center gap-2 w-full">
                          <div className={`flex-shrink-0 w-3 h-3 rounded-full ${rentriEnv === 'demo' ? 'bg-blue-500' : 'bg-slate-600'}`}></div>
                          <span className={`text-sm font-semibold ${rentriEnv === 'demo' ? 'text-white' : 'text-slate-300'}`}>TEST</span>
                          {rentriEnv === 'demo' && (
                            <span className="ml-auto px-2 py-0.5 text-xs font-medium text-blue-400 bg-blue-500/20 rounded flex items-center gap-1">
                              <FiCheck className="w-3 h-3" /> Attivo
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400">
                          Ambiente di test per sviluppo e formazione. I dati non hanno valore legale.
                        </p>
                      </button>
                    )}

                    <button
                      onClick={() => handleRentriEnvChange('prod')}
                      disabled={rentriEnvLoading || rentriEnv === 'prod'}
                      className={`flex flex-col items-start gap-2 p-4 rounded-lg border-2 transition-all ${rentriEnv === 'prod'
                        ? 'border-green-500 bg-green-500/10'
                        : 'border-[#243044] bg-[#141c27] hover:bg-[#1a2536] hover:border-green-500/30'
                        }`}
                    >
                      <div className="flex items-center gap-2 w-full">
                        <div className={`flex-shrink-0 w-3 h-3 rounded-full ${rentriEnv === 'prod' ? 'bg-green-500' : 'bg-slate-600'}`}></div>
                        <span className={`text-sm font-semibold ${rentriEnv === 'prod' ? 'text-white' : 'text-slate-300'}`}>PRODUZIONE</span>
                        {rentriEnv === 'prod' && (
                          <span className="ml-auto px-2 py-0.5 text-xs font-medium text-green-400 bg-green-500/20 rounded flex items-center gap-1">
                            <FiCheck className="w-3 h-3" /> Attivo
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400">
                        {rentriEnv === 'prod'
                          ? 'Operatività reale con valore legale.'
                          : 'Ambiente di produzione per operatività reale. Richiede certificato valido.'}
                      </p>
                    </button>
                  </div>

                  {rentriEnvLoading && (
                    <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
                      <FiRefreshCw className="w-3 h-3 animate-spin" />
                      <span>Cambio ambiente in corso...</span>
                    </div>
                  )}

                  {rentriCertInfo && (
                    <div className="mt-3 p-3 bg-[#141c27] border border-[#243044] rounded-lg">
                      <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                        <FiLock className="w-3 h-3" />
                        <span className="font-medium">Certificato attivo</span>
                      </div>
                      <div className="text-xs text-slate-500 space-y-0.5">
                        <div>CF: <span className="text-slate-300 font-mono">{rentriCertInfo.cf_operatore}</span></div>
                        {rentriCertInfo.ragione_sociale && (
                          <div>Ragione Sociale: <span className="text-slate-300">{rentriCertInfo.ragione_sociale}</span></div>
                        )}
                        <div>
                          Scadenza: <span className={new Date(rentriCertInfo.expires_at) > new Date() ? 'text-green-400' : 'text-red-400'}>
                            {new Date(rentriCertInfo.expires_at).toLocaleDateString('it-IT')}
                            {new Date(rentriCertInfo.expires_at) <= new Date() && ' (SCADUTO)'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {rentriEnv !== 'prod' && (
                    <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                      <div className="flex items-start gap-2">
                        <FiAlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                        <div className="text-xs text-amber-200">
                          <strong>Attenzione:</strong> Per passare a PRODUZIONE è necessario un certificato RENTRI valido. I certificati devono essere richiesti sul portale RENTRI.
                          {!rentriOtherEnvHasCert && (
                            <span className="block mt-1 text-amber-300">Nessun certificato di produzione trovato. Caricane uno prima di cambiare ambiente.</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Gestione Limiti */}
                <div>
                  <RifiutiLimitiSettings />
                </div>

                {/* Certificati e Configurazione */}
                <div className="bg-[#1a2536] rounded-lg border border-[#243044] p-4">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                    Certificati RENTRI
                  </h3>
                  <p className="text-xs text-slate-500 mb-3">
                    Gestisci i certificati per l'autenticazione con RENTRI. I certificati devono essere in formato .p12.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => navigate("/rifiuti/certificati")}
                      className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <FiLock className="h-4 w-4" />
                      Gestisci Certificati
                    </button>
                    <button
                      onClick={() => navigate("/rifiuti/certificati/upload")}
                      className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-blue-400 bg-blue-500/10 rounded-lg hover:bg-blue-500/10 transition-colors"
                    >
                      <FiUpload className="h-4 w-4" />
                      Carica Nuovo Certificato
                    </button>
                  </div>
                </div>

                {/* Dispositivi Firma Remota — DEMO + PROD separati */}
                <div className="bg-[#1a2536] rounded-lg border border-[#243044] p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <FiSmartphone className="w-4 h-4 text-purple-400" />
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Dispositivi Firma Remota</h3>
                  </div>

                  {['demo', 'prod'].map(env => {
                    const envData = firmaDevices[env];
                    const isEditing = editingFirmaEnv === env;
                    const envLabel = env === 'demo' ? 'DEMO' : 'PROD';
                    const envColor = env === 'demo'
                      ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                      : 'bg-green-500/10 text-green-400 border-green-500/20';
                    return (
                      <div key={env} className="mb-3 last:mb-0 p-3 bg-[#141c27]/60 border border-[#1e2d44] rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${envColor}`}>{envLabel}</span>
                          {envData && !isEditing && (
                            <button onClick={() => startEditFirmaEnv(env)} className="flex items-center gap-1 px-2 py-0.5 text-[10px] text-slate-400 hover:text-slate-200 bg-[#1e2d44] hover:bg-[#243044] rounded transition-colors">
                              <FiEdit3 className="w-3 h-3" />
                              {envData.devices.length > 0 ? 'Modifica' : 'Aggiungi'}
                            </button>
                          )}
                        </div>

                        {!envData ? (
                          <p className="text-[10px] text-slate-600">
                            Nessun cert. firma remota {envLabel}. <button onClick={() => navigate('/rifiuti/certificati/upload')} className="text-blue-400 underline">Carica certificato</button>.
                          </p>
                        ) : isEditing ? (
                          <div className="space-y-2">
                            <p className="text-[10px] text-slate-500">
                              Portale <a href="https://demooperatori.rentri.gov.it" target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">RENTRI Operatori</a> → Firma Remota → Dispositivi → copia il credentials_id.
                            </p>
                            {firmaDeviceInputs.map((dev, idx) => (
                              <div key={idx} className="flex gap-2 items-center">
                                <input value={dev.name} onChange={e => setFirmaDeviceInputs(prev => prev.map((d, i) => i === idx ? { ...d, name: e.target.value } : d))} placeholder="Nome" className="w-28 px-2 py-1.5 bg-[#0f1623] border border-[#243044] rounded text-[11px] text-slate-300 placeholder-slate-600 focus:outline-none" />
                                <input value={dev.id} onChange={e => setFirmaDeviceInputs(prev => prev.map((d, i) => i === idx ? { ...d, id: e.target.value.toUpperCase() } : d))} placeholder="credentials_id" className="flex-1 px-2 py-1.5 bg-[#0f1623] border border-[#243044] rounded text-[11px] font-mono text-slate-200 placeholder-slate-600 focus:outline-none" />
                                {idx === 0 && <span className="text-[9px] text-purple-400 whitespace-nowrap">Primary</span>}
                                <button onClick={() => setFirmaDeviceInputs(prev => prev.filter((_, i) => i !== idx))} className="p-1 text-slate-600 hover:text-red-400"><FiX className="w-3.5 h-3.5" /></button>
                              </div>
                            ))}
                            <div className="flex gap-2 pt-1">
                              <button onClick={() => setFirmaDeviceInputs(prev => [...prev, { name: `Dispositivo ${prev.length + 1}`, id: '' }])} className="flex items-center gap-1 px-2 py-1 text-[10px] text-slate-400 hover:text-slate-200 bg-[#1e2d44] rounded">
                                <FiPlus className="w-3 h-3" /> Aggiungi
                              </button>
                              <button onClick={saveFirmaDevices} disabled={savingFirmaDev} className="flex items-center gap-1 px-3 py-1 text-xs font-medium bg-purple-600 hover:bg-purple-700 text-white rounded disabled:opacity-50 ml-auto">
                                <FiSave className="w-3 h-3" /> {savingFirmaDev ? 'Salvo...' : 'Salva'}
                              </button>
                              <button onClick={() => setEditingFirmaEnv(null)} className="p-1.5 text-slate-500 hover:text-slate-300 bg-[#1e2d44] rounded"><FiX className="w-3.5 h-3.5" /></button>
                            </div>
                          </div>
                        ) : envData.devices.length > 0 ? (
                          <div className="space-y-1">
                            {envData.devices.map((dev, idx) => (
                              <div key={idx} className="flex items-center gap-2">
                                <span className="text-[9px] text-slate-600 w-10 flex-shrink-0">{idx === 0 ? 'Primary' : `Alt ${idx}`}</span>
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-purple-500/10 border border-purple-500/20 rounded text-[11px]">
                                  <FiSmartphone className="w-3 h-3 text-purple-400" />
                                  <span className="text-slate-400">{dev.name}</span>
                                  <span className="text-purple-300 font-mono font-medium">{dev.id}</span>
                                </span>
                                {idx === 0 && <FiCheck className="w-3 h-3 text-green-400" />}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[10px] text-amber-300 flex items-center gap-1"><FiAlertCircle className="w-3 h-3" /> Nessun dispositivo configurato.</p>
                        )}
                      </div>
                    );
                  })}
                </div>

              </div>
            </Section>
          )}

          {/* Branding / Aspetto avanzato (tenuto ma nascosto dal menu principale) */}
          {activeTab === "branding" && (
            <Section title="Personalizzazione Aziendale" desc="Configura logo, colori e font per il branding completo">
              <div className="space-y-4">
                {/* Logo Aziendale */}
                <div>
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Logo Aziendale</h3>
                  <div className="grid md:grid-cols-2 gap-3">
                    <Field label="Logo Principale">
                      <div className="flex items-center gap-4">
                        <div className="h-16 w-16 rounded-lg border border-[#243044] bg-[#141c27] overflow-hidden flex items-center justify-center">
                          {companySettings?.logo_url ? (
                            <img src={companySettings.logo_url} alt="Logo" className="h-full w-full object-contain" />
                          ) : (
                            <FiImage className="w-8 h-8 text-slate-500" />
                          )}
                        </div>
                        <div className="space-y-2">
                          <label className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-300 bg-[#141c27] rounded-lg hover:bg-[#243044] transition-colors cursor-pointer">
                            <FiUpload className="w-4 h-4" />
                            Carica Logo
                            <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                          </label>
                          {companySettings?.logo_url && (
                            <button
                              onClick={handleLogoDelete}
                              className="flex items-center gap-2 px-3 py-1 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                            >
                              <FiTrash2 className="w-3 h-3" />
                              Rimuovi Logo
                            </button>
                          )}
                        </div>
                      </div>
                    </Field>

                    <Field label="Anteprima Logo">
                      <div className="p-4 border border-[#243044] rounded-lg bg-[#1a2536]">
                        <div className="text-xs text-slate-500 mb-2">Come apparirà nei documenti:</div>
                        <div className="h-16 bg-[#141c27] rounded border flex items-center justify-center">
                          {companySettings?.logo_url ? (
                            <img src={companySettings.logo_url} alt="Preview" className="h-12 w-auto object-contain" />
                          ) : (
                            <span className="text-slate-500 text-sm">Nessun logo caricato</span>
                          )}
                        </div>
                      </div>
                    </Field>
                  </div>
                </div>

                {/* Colori Aziendali */}
                <div>
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Palette Colori</h3>
                  <div className="grid md:grid-cols-3 gap-3">
                    <Field label="Colore Primario">
                      <div className="flex items-center gap-4">
                        <input
                          type="color"
                          value={companySettings?.primary_color || '#3B82F6'}
                          onChange={(e) => updateCompanySetting('primary_color', e.target.value)}
                          className="h-10 w-16 rounded-lg border border-[#243044] bg-transparent cursor-pointer"
                        />
                        <div className="text-xs text-slate-500">
                          <div className="font-medium">Colore principale</div>
                          <div className="text-xs font-mono">{companySettings?.primary_color || '#3B82F6'}</div>
                        </div>
                      </div>
                    </Field>

                    <Field label="Colore Secondario">
                      <div className="flex items-center gap-4">
                        <input
                          type="color"
                          value={companySettings?.secondary_color || '#6B7280'}
                          onChange={(e) => updateCompanySetting('secondary_color', e.target.value)}
                          className="h-10 w-16 rounded-lg border border-[#243044] bg-transparent cursor-pointer"
                        />
                        <div className="text-xs text-slate-500">
                          <div className="font-medium">Colore secondario</div>
                          <div className="text-xs font-mono">{companySettings?.secondary_color || '#6B7280'}</div>
                        </div>
                      </div>
                    </Field>

                    <Field label="Colore Accent">
                      <div className="flex items-center gap-4">
                        <input
                          type="color"
                          value={companySettings?.accent_color || '#EC4899'}
                          onChange={(e) => updateCompanySetting('accent_color', e.target.value)}
                          className="h-10 w-16 rounded-lg border border-[#243044] bg-transparent cursor-pointer"
                        />
                        <div className="text-xs text-slate-500">
                          <div className="font-medium">Colore accent</div>
                          <div className="text-xs font-mono">{companySettings?.accent_color || '#EC4899'}</div>
                        </div>
                      </div>
                    </Field>
                  </div>
                </div>

                {/* Font e Tipografia */}
                <div>
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Tipografia</h3>
                  <div className="grid md:grid-cols-2 gap-3">
                    <Field label="Font Family">
                      <select
                        className="w-full px-3 py-1.5 text-xs border border-[#243044] rounded-lg bg-[#1a2536] text-slate-200 focus:ring-1 focus:ring-blue-500/40 outline-none"
                        value={companySettings?.font_family || 'Inter, sans-serif'}
                        onChange={(e) => updateCompanySetting('font_family', e.target.value)}
                      >
                        <option value="Inter, sans-serif">Inter (Default)</option>
                        <option value="Roboto, sans-serif">Roboto</option>
                        <option value="Open Sans, sans-serif">Open Sans</option>
                        <option value="Lato, sans-serif">Lato</option>
                        <option value="Montserrat, sans-serif">Montserrat</option>
                        <option value="Poppins, sans-serif">Poppins</option>
                      </select>
                    </Field>

                    <Field label="Dimensione Font Base">
                      <select
                        className="w-full px-3 py-1.5 text-xs border border-[#243044] rounded-lg bg-[#1a2536] text-slate-200 focus:ring-1 focus:ring-blue-500/40 outline-none"
                        value={companySettings?.font_size_base || '14px'}
                        onChange={(e) => updateCompanySetting('font_size_base', e.target.value)}
                      >
                        <option value="12px">12px (Piccolo)</option>
                        <option value="14px">14px (Standard)</option>
                        <option value="16px">16px (Grande)</option>
                        <option value="18px">18px (Molto Grande)</option>
                      </select>
                    </Field>
                  </div>
                </div>

                {/* Note Legali */}
                <div>
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Note Legali</h3>
                  <Field label="Note da includere nei documenti" tooltip="Queste note verranno incluse automaticamente nei documenti generati">
                    <textarea
                      rows={4}
                      className="w-full px-3 py-1.5 text-xs border border-[#243044] rounded-lg bg-[#1a2536] text-slate-200 placeholder-slate-600 focus:ring-1 focus:ring-blue-500/40 outline-none resize-none"
                      placeholder="Es. P.IVA: IT12345678901 - Capitale Sociale: €10.000,00 i.v."
                      value={companySettings?.legal_notes || ''}
                      onChange={(e) => updateCompanySetting('legal_notes', e.target.value)}
                    />
                  </Field>
                </div>
              </div>
            </Section>
          )}

          {/* Templates Tab */}
          {activeTab === "templates" && (
            <Section title="Template Export" desc="Gestisci i template per l'export di documenti">
              <div className="space-y-4">
                {/* Statistiche Template */}
                <div className="grid md:grid-cols-4 gap-3">
                  <Card title="Template Totali">
                    <div className="text-lg font-semibold text-blue-400">
                      {templates.length}
                    </div>
                    <div className="text-xs text-slate-500">
                      Template disponibili
                    </div>
                  </Card>

                  <Card title="Template PDF">
                    <div className="text-lg font-semibold text-red-400">
                      {templates.filter(t => t.document_type === 'pdf').length}
                    </div>
                    <div className="text-xs text-slate-500">
                      Template PDF
                    </div>
                  </Card>

                  <Card title="Template CSV">
                    <div className="text-lg font-semibold text-emerald-400">
                      {templates.filter(t => t.document_type === 'csv').length}
                    </div>
                    <div className="text-xs text-slate-500">
                      Template CSV
                    </div>
                  </Card>

                  <Card title="Template Default">
                    <div className="text-lg font-semibold text-purple-400">
                      {templates.filter(t => t.is_default).length}
                    </div>
                    <div className="text-xs text-slate-500">
                      Template predefiniti
                    </div>
                  </Card>
                </div>

                {/* Lista Template */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Template Disponibili</h3>
                    <button
                      onClick={() => setShowCreateTemplateModal(true)}
                      className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <FiPlus className="w-4 h-4" />
                      Nuovo Template
                    </button>
                  </div>

                  {loadingTemplates ? (
                    <div className="flex items-center justify-center py-8">
                      <FiRefreshCw className="w-6 h-6 animate-spin text-blue-400" />
                      <span className="ml-2 text-slate-400">Caricamento template...</span>
                    </div>
                  ) : templates.length > 0 ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {templates.map(template => (
                        <div
                          key={template.id}
                          className="border border-[#243044] rounded-lg p-4 hover:bg-[#1a2536] transition-colors"
                        >
                          <div className="flex items-center gap-3 mb-3">
                            {template.document_type === 'pdf' ? (
                              <FiFileText className="w-5 h-5 text-red-400" />
                            ) : (
                              <FiDownloadIcon className="w-5 h-5 text-emerald-400" />
                            )}
                            <div>
                              <h4 className="font-semibold text-slate-200">
                                {template.name}
                                {template.is_default && (
                                  <span className="ml-2 text-xs bg-blue-500/10 text-blue-400 px-2 py-1 rounded-full">
                                    Default
                                  </span>
                                )}
                              </h4>
                              <p className="text-xs text-slate-500">
                                {template.category} • {template.document_type.toUpperCase()}
                              </p>
                            </div>
                          </div>

                          {template.description && (
                            <p className="text-xs text-slate-500 mb-2">
                              {template.description}
                            </p>
                          )}

                          <div className="flex items-center justify-between">
                            <div className="text-xs text-slate-500">
                              <span>Versione {template.version}</span>
                              <span className="ml-2">•</span>
                              <span className="ml-2">{new Date(template.updated_at).toLocaleDateString('it-IT')}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => openEditTemplateModal(template)}
                                className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded transition-colors"
                                title="Modifica template"
                              >
                                <FiEdit3 className="w-4 h-4" />
                              </button>
                              {!template.is_default && (
                                <button
                                  onClick={async () => {
                                    if (confirm(`Vuoi impostare "${template.name}" come template predefinito?`)) {
                                      try {
                                        await ExportTemplateService.setAsDefault(template.id, currentOrg);
                                        showToast("success", "Template impostato come predefinito");
                                        await loadTemplates();
                                      } catch (error) {
                                        showToast("error", "Errore durante l'operazione");
                                      }
                                    }
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-purple-400 hover:bg-purple-500/10 rounded transition-colors"
                                  title="Imposta come default"
                                >
                                  <FiStar className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FiFileText className="w-6 h-6 text-slate-500 mx-auto mb-2" />
                      <h3 className="text-sm font-semibold text-slate-200 mb-1">
                        Nessun template trovato
                      </h3>
                      <p className="text-xs text-slate-500 mb-3">
                        Crea il tuo primo template personalizzato per l'export di documenti
                      </p>
                      <button
                        onClick={() => setShowCreateTemplateModal(true)}
                        className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Crea Template
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </Section>
          )}

          {/* Appearance Tab */}
          {activeTab === "appearance" && (
            <Section title="Personalizzazione Aspetto" desc="Configura densità e layout dell'interfaccia">
              <div className="grid md:grid-cols-2 gap-3">
                <Card title="Densità Interfaccia">
                  <div className="space-y-3">
                    {[
                      { value: "comfortable", label: "Confortevole", desc: "Spaziature ampie e rilassanti" },
                      { value: "compact", label: "Compatta", desc: "Spaziature ridotte per più contenuto" }
                    ].map((density) => (
                      <button
                        key={density.value}
                        onClick={() => setAppearance(prev => ({ ...prev, density: density.value }))}
                        className={`w-full text-left p-3 rounded-lg border transition-colors ${appearance.density === density.value
                          ? "border-blue-500 bg-blue-500/10"
                          : "border-[#243044] hover:bg-[#141c27]"
                          }`}
                      >
                        <div className="font-medium text-slate-200">{density.label}</div>
                        <div className="text-xs text-slate-500">{density.desc}</div>
                      </button>
                    ))}
                  </div>
                </Card>

                <Card title="Sidebar">
                  <div className="space-y-3">
                    {[
                      { value: "expanded", label: "Estesa", desc: "Sidebar sempre visibile" },
                      { value: "collapsed", label: "Compatta", desc: "Sidebar collassabile" }
                    ].map((sidebar) => (
                      <button
                        key={sidebar.value}
                        onClick={() => setAppearance(prev => ({ ...prev, sidebar: sidebar.value }))}
                        className={`w-full text-left p-3 rounded-lg border transition-colors ${appearance.sidebar === sidebar.value
                          ? "border-blue-500 bg-blue-500/10"
                          : "border-[#243044] hover:bg-[#141c27]"
                          }`}
                      >
                        <div className="font-medium text-slate-200">{sidebar.label}</div>
                        <div className="text-xs text-slate-500">{sidebar.desc}</div>
                      </button>
                    ))}
                  </div>
                </Card>
              </div>
            </Section>
          )}

          {/* General Tab */}
          {activeTab === "general" && (
            <div className="space-y-4">
              <Section title="Impostazioni Generali" desc="Configura lingua, fuso orario e altre preferenze di sistema">
                <div className="grid md:grid-cols-2 gap-3">
                  <Field label="Lingua">
                    <select
                      className="w-full px-3 py-1.5 text-xs border border-[#243044] rounded-lg bg-[#1a2536] text-slate-200 focus:ring-1 focus:ring-blue-500/40 outline-none"
                      value={general.language}
                      onChange={(e) => setGeneral(prev => ({ ...prev, language: e.target.value }))}
                    >
                      <option value="it">Italiano</option>
                      <option value="en">English</option>
                    </select>
                  </Field>

                  <Field label="Fuso Orario">
                    <input
                      type="text"
                      className="w-full px-3 py-1.5 text-xs border border-[#243044] rounded-lg bg-[#1a2536] text-slate-200 placeholder-slate-600 focus:ring-1 focus:ring-blue-500/40 outline-none"
                      placeholder="Europe/Rome"
                      value={general.timezone}
                      onChange={(e) => setGeneral(prev => ({ ...prev, timezone: e.target.value }))}
                    />
                  </Field>

                  <Field label="Unità di Misura">
                    <select
                      className="w-full px-3 py-1.5 text-xs border border-[#243044] rounded-lg bg-[#1a2536] text-slate-200 focus:ring-1 focus:ring-blue-500/40 outline-none"
                      value={general.units}
                      onChange={(e) => setGeneral(prev => ({ ...prev, units: e.target.value }))}
                    >
                      <option value="metric">Metriche (km, °C)</option>
                      <option value="imperial">Imperiali (mi, °F)</option>
                    </select>
                  </Field>

                  <Field label="Provider Mappe">
                    <select
                      className="w-full px-3 py-1.5 text-xs border border-[#243044] rounded-lg bg-[#1a2536] text-slate-200 focus:ring-1 focus:ring-blue-500/40 outline-none"
                      value={general.mapProvider}
                      onChange={(e) => setGeneral(prev => ({ ...prev, mapProvider: e.target.value }))}
                    >
                      <option value="google">Google Maps</option>
                      <option value="osm">OpenStreetMap</option>
                    </select>
                  </Field>
                </div>
              </Section>

              <Section title="Workflow Trasporti" desc="Configura stati, SLA e requisiti per i trasporti">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-md font-medium text-slate-200 mb-3">Stati Disponibili</h4>
                    <div className="flex flex-wrap gap-2">
                      {["da fare", "in corso", "completato", "in attesa", "annullato"].map((status) => {
                        const isEnabled = general.workflow.statuses.includes(status);
                        return (
                          <button
                            key={status}
                            onClick={() => {
                              setGeneral(prev => ({
                                ...prev,
                                workflow: {
                                  ...prev.workflow,
                                  statuses: isEnabled
                                    ? prev.workflow.statuses.filter(s => s !== status)
                                    : [...prev.workflow.statuses, status]
                                }
                              }));
                            }}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isEnabled
                              ? "bg-blue-600 text-white"
                              : "bg-[#243044]  text-slate-300 hover:bg-[#243044] "
                              }`}
                          >
                            {status}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-3">
                    <Field label="Stato Predefinito">
                      <select
                        className="w-full px-3 py-1.5 text-xs border border-[#243044] rounded-lg bg-[#1a2536] text-slate-200 focus:ring-1 focus:ring-blue-500/40 outline-none"
                        value={general.workflow.defaultStatus}
                        onChange={(e) => setGeneral(prev => ({
                          ...prev,
                          workflow: { ...prev.workflow, defaultStatus: e.target.value }
                        }))}
                      >
                        {general.workflow.statuses.map(status => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                    </Field>

                    <Field label="SLA Intervento (minuti)" tooltip="Tempo obiettivo dalla presa in carico all'arrivo">
                      <input
                        type="number"
                        min={5}
                        step={5}
                        className="w-full px-3 py-1.5 text-xs border border-[#243044] rounded-lg bg-[#1a2536] text-slate-200 focus:ring-1 focus:ring-blue-500/40 outline-none"
                        value={general.workflow.slaMinutes}
                        onChange={(e) => setGeneral(prev => ({
                          ...prev,
                          workflow: { ...prev.workflow, slaMinutes: Number.parseInt(e.target.value, 10) || 0 }
                        }))}
                      />
                    </Field>
                  </div>

                  <div className="space-y-4">
                    <Toggle
                      label="Richiedi foto per completare trasporto"
                      checked={general.workflow.requirePhotoOnComplete}
                      onChange={(checked) => setGeneral(prev => ({
                        ...prev,
                        workflow: { ...prev.workflow, requirePhotoOnComplete: checked }
                      }))}
                    />

                    <Toggle
                      label="Richiedi firma del cliente"
                      checked={general.workflow.requireSignature}
                      onChange={(checked) => setGeneral(prev => ({
                        ...prev,
                        workflow: { ...prev.workflow, requireSignature: checked }
                      }))}
                    />
                  </div>
                </div>
              </Section>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === "notifications" && (
            <div className="space-y-4">
              <Section title="Preferenze Notifiche" desc="Configura quando e come ricevere le notifiche">
                <div className="space-y-4">
                  <Card title="Notifiche Desktop">
                    <div className="space-y-4">
                      <Toggle
                        label="Notifiche desktop"
                        checked={notify.desktop}
                        onChange={(checked) => setNotify(prev => ({ ...prev, desktop: checked }))}
                      />

                      <Toggle
                        label="Suono notifiche"
                        checked={notify.sound}
                        onChange={(checked) => setNotify(prev => ({ ...prev, sound: checked }))}
                      />
                    </div>
                  </Card>

                  <Card title="Quando Notificare">
                    <div className="space-y-4">
                      <Toggle
                        label="Nuova assegnazione trasporto"
                        checked={notify.when.newAssignment}
                        onChange={(checked) => setNotify(prev => ({
                          ...prev,
                          when: { ...prev.when, newAssignment: checked }
                        }))}
                      />

                      <Toggle
                        label="Cambio stato trasporto"
                        checked={notify.when.statusChange}
                        onChange={(checked) => setNotify(prev => ({
                          ...prev,
                          when: { ...prev.when, statusChange: checked }
                        }))}
                      />

                      <Toggle
                        label="Promemoria calendario"
                        checked={notify.when.calendarReminder}
                        onChange={(checked) => setNotify(prev => ({
                          ...prev,
                          when: { ...prev.when, calendarReminder: checked }
                        }))}
                      />
                    </div>
                  </Card>
                </div>
              </Section>

              <Section title="Notifiche Email" desc="Gestisci notifiche automatiche e invio documenti via email">
                <NotificationSettings showToast={showToast} />
              </Section>
            </div>
          )}

          {/* Marketplace Tab */}
          {activeTab === "marketplace" && (
            <Section title="Marketplace" desc="Collega i tuoi account eBay, Subito.it e Shopify per pubblicare i ricambi">
              <MarketplaceSettings />
            </Section>
          )}

          {/* GPS Tracking Tab */}
          {activeTab === "gps" && (
            <GpsTrackingSettings showToast={showToast} />
          )}

          {/* Invoice Settings Tab */}
          {activeTab === "invoiceSettings" && (
            <div className="space-y-4">
              <Section title="Configurazione Fatture" desc="Voci preimpostate, termini di pagamento e impostazioni predefinite per le fatture">
                <div className="space-y-4">
                  {/* Campi predefiniti */}
                  <Card title="Impostazioni Predefinite Fattura">
                    <div className="space-y-3">
                      <Field label="Termini di Pagamento">
                        <select
                          className="w-full px-3 py-1.5 text-xs border border-[#243044] rounded-lg bg-[#141c27] text-slate-200 focus:ring-1 focus:ring-blue-500/40 outline-none"
                          value={invoices.defaultFields?.paymentTerms || ""}
                          onChange={e => setInvoices(p => ({ ...p, defaultFields: { ...p.defaultFields, paymentTerms: e.target.value } }))}
                        >
                          <option value="immediato">Pagamento immediato</option>
                          <option value="30 giorni data fattura">30 giorni data fattura</option>
                          <option value="60 giorni data fattura">60 giorni data fattura</option>
                          <option value="90 giorni data fattura">90 giorni data fattura</option>
                          <option value="30 giorni fine mese">30 giorni fine mese</option>
                          <option value="60 giorni fine mese">60 giorni fine mese</option>
                          <option value="alla consegna">Alla consegna</option>
                          <option value="anticipato">Pagamento anticipato</option>
                        </select>
                      </Field>
                      <Field label="Metodo di Pagamento">
                        <select
                          className="w-full px-3 py-1.5 text-xs border border-[#243044] rounded-lg bg-[#141c27] text-slate-200 focus:ring-1 focus:ring-blue-500/40 outline-none"
                          value={invoices.defaultFields?.paymentMethod || ""}
                          onChange={e => setInvoices(p => ({ ...p, defaultFields: { ...p.defaultFields, paymentMethod: e.target.value } }))}
                        >
                          <option value="bonifico">Bonifico Bancario</option>
                          <option value="contanti">Contanti</option>
                          <option value="carta">Carta di Credito/Debito</option>
                          <option value="ri.ba">Ri.Ba. (Ricevuta Bancaria)</option>
                          <option value="assegno">Assegno</option>
                          <option value="paypal">PayPal</option>
                          <option value="satispay">Satispay</option>
                        </select>
                      </Field>
                      <Field label="IBAN Predefinito">
                        <input
                          type="text"
                          className="w-full px-3 py-1.5 text-xs border border-[#243044] rounded-lg bg-[#141c27] text-slate-200 placeholder-slate-500 focus:ring-1 focus:ring-blue-500/40 outline-none font-mono"
                          placeholder="IT60X0542811101000000123456"
                          value={invoices.defaultFields?.iban || ""}
                          onChange={e => setInvoices(p => ({ ...p, defaultFields: { ...p.defaultFields, iban: e.target.value } }))}
                        />
                      </Field>
                      <Field label="Note Predefinite Fattura">
                        <textarea
                          className="w-full px-3 py-1.5 text-xs border border-[#243044] rounded-lg bg-[#141c27] text-slate-200 placeholder-slate-500 focus:ring-1 focus:ring-blue-500/40 outline-none resize-none"
                          rows={3}
                          placeholder="Es: Pagamento tramite bonifico bancario entro i termini indicati."
                          value={invoices.defaultFields?.notes || ""}
                          onChange={e => setInvoices(p => ({ ...p, defaultFields: { ...p.defaultFields, notes: e.target.value } }))}
                        />
                      </Field>
                    </div>
                  </Card>

                  {/* Voci preimpostate */}
                  <Card title="Voci Preimpostate">
                    <p className="text-[10px] text-slate-500 mb-3">
                      Aggiungi voci che appariranno come suggerimenti rapidi durante la creazione di una fattura.
                    </p>
                    <div className="space-y-2 mb-3">
                      {(invoices.presets || []).map((preset, idx) => (
                        <div key={idx} className="flex items-center gap-2 p-2 bg-[#141c27] rounded-lg border border-[#243044]">
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium text-slate-200">{preset.description}</div>
                            <div className="text-[10px] text-slate-500">
                              €{preset.unitPrice?.toFixed(2)} × {preset.quantity} {preset.unit} — IVA {preset.vatRate}%
                            </div>
                          </div>
                          <button
                            onClick={() => setInvoices(p => ({ ...p, presets: p.presets.filter((_, i) => i !== idx) }))}
                            className="p-1 text-red-400 hover:bg-red-500/10 rounded transition-colors"
                          >
                            <FiTrash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      {(invoices.presets || []).length === 0 && (
                        <div className="text-center py-4 text-[10px] text-slate-600">
                          Nessuna voce preimpostata. Aggiungine una qui sotto.
                        </div>
                      )}
                    </div>
                    <InvoicePresetForm onAdd={(preset) => setInvoices(p => ({ ...p, presets: [...(p.presets || []), preset] }))} />
                  </Card>

                  {/* Campi visibili */}
                  <Card title="Campi Visibili in Fattura">
                    <p className="text-[10px] text-slate-500 mb-3">
                      Scegli quali campi mostrare nel modulo di creazione fattura.
                    </p>
                    <div className="space-y-2">
                      {(invoices.availableFields || []).map((field, idx) => (
                        <label key={field.key} className="flex items-center gap-3 p-2 bg-[#141c27] rounded-lg border border-[#243044] cursor-pointer hover:border-blue-500/20 transition-colors">
                          <input
                            type="checkbox"
                            checked={field.enabled}
                            onChange={() => {
                              const updated = [...invoices.availableFields];
                              updated[idx] = { ...updated[idx], enabled: !updated[idx].enabled };
                              setInvoices(p => ({ ...p, availableFields: updated }));
                            }}
                            className="rounded border-[#243044] text-blue-500 focus:ring-blue-500/40"
                          />
                          <span className="text-xs text-slate-300">{field.label}</span>
                        </label>
                      ))}
                    </div>
                  </Card>
                </div>
              </Section>
            </div>
          )}

          {/* Quote Settings Tab */}
          {activeTab === "quoteSettings" && (
            <div className="space-y-4">
              <Section title="Configurazione Preventivi" desc="Voci preimpostate, validità e impostazioni predefinite per i preventivi">
                <div className="space-y-4">
                  <Card title="Impostazioni Predefinite Preventivo">
                    <div className="space-y-3">
                      <Field label="Termini di Pagamento">
                        <select
                          className="w-full px-3 py-1.5 text-xs border border-[#243044] rounded-lg bg-[#141c27] text-slate-200 focus:ring-1 focus:ring-blue-500/40 outline-none"
                          value={quotes.defaultFields?.paymentTerms || ""}
                          onChange={e => setQuotes(p => ({ ...p, defaultFields: { ...p.defaultFields, paymentTerms: e.target.value } }))}
                        >
                          <option value="immediato">Pagamento immediato</option>
                          <option value="30 giorni data fattura">30 giorni data fattura</option>
                          <option value="60 giorni data fattura">60 giorni data fattura</option>
                          <option value="90 giorni data fattura">90 giorni data fattura</option>
                          <option value="alla consegna">Alla consegna</option>
                          <option value="anticipato">Pagamento anticipato</option>
                        </select>
                      </Field>
                      <Field label="Validità Preventivo (giorni)">
                        <input
                          type="number"
                          min={1}
                          max={365}
                          className="w-full px-3 py-1.5 text-xs border border-[#243044] rounded-lg bg-[#141c27] text-slate-200 focus:ring-1 focus:ring-blue-500/40 outline-none"
                          value={quotes.defaultFields?.validityDays || 30}
                          onChange={e => setQuotes(p => ({ ...p, defaultFields: { ...p.defaultFields, validityDays: parseInt(e.target.value) || 30 } }))}
                        />
                      </Field>
                      <Field label="Note Predefinite Preventivo">
                        <textarea
                          className="w-full px-3 py-1.5 text-xs border border-[#243044] rounded-lg bg-[#141c27] text-slate-200 placeholder-slate-500 focus:ring-1 focus:ring-blue-500/40 outline-none resize-none"
                          rows={3}
                          placeholder="Es: Preventivo valido 30 giorni dalla data di emissione. Prezzi IVA esclusa."
                          value={quotes.defaultFields?.notes || ""}
                          onChange={e => setQuotes(p => ({ ...p, defaultFields: { ...p.defaultFields, notes: e.target.value } }))}
                        />
                      </Field>
                    </div>
                  </Card>

                  {/* Voci preimpostate preventivi */}
                  <Card title="Voci Preimpostate">
                    <p className="text-[10px] text-slate-500 mb-3">
                      Aggiungi voci che appariranno come suggerimenti rapidi durante la creazione di un preventivo.
                    </p>
                    <div className="space-y-2 mb-3">
                      {(quotes.presets || []).map((preset, idx) => (
                        <div key={idx} className="flex items-center gap-2 p-2 bg-[#141c27] rounded-lg border border-[#243044]">
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium text-slate-200">{preset.description}</div>
                            <div className="text-[10px] text-slate-500">
                              €{preset.unitPrice?.toFixed(2)} × {preset.quantity} {preset.unit} — IVA {preset.vatRate}%
                            </div>
                          </div>
                          <button
                            onClick={() => setQuotes(p => ({ ...p, presets: p.presets.filter((_, i) => i !== idx) }))}
                            className="p-1 text-red-400 hover:bg-red-500/10 rounded transition-colors"
                          >
                            <FiTrash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      {(quotes.presets || []).length === 0 && (
                        <div className="text-center py-4 text-[10px] text-slate-600">
                          Nessuna voce preimpostata. Aggiungine una qui sotto.
                        </div>
                      )}
                    </div>
                    <InvoicePresetForm onAdd={(preset) => setQuotes(p => ({ ...p, presets: [...(p.presets || []), preset] }))} />
                  </Card>
                </div>
              </Section>
            </div>
          )}

          {/* Piazzale Tab */}
          {activeTab === "piazzale" && (
            <div className="space-y-4">
              <Section title="Gestione Piazzale" desc="Configura zone, posizioni e regole per il piazzale veicoli">
                <div className="space-y-4">
                  <Card title="Zone del Piazzale">
                    <p className="text-[10px] text-slate-500 mb-3">
                      Definisci le zone del piazzale per organizzare i veicoli in ingresso, stoccaggio, lavorazione e uscita.
                    </p>
                    <div className="space-y-2 mb-3">
                      {(piazzale.zones || []).map((zone, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-2.5 bg-[#141c27] rounded-lg border border-[#243044]">
                          <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: zone.color }} />
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium text-slate-200">{zone.name}</div>
                            <div className="text-[10px] text-slate-500">
                              Tipo: {zone.type} — Capacità: {zone.capacity} veicoli
                            </div>
                          </div>
                          <button
                            onClick={() => setPiazzale(p => ({ ...p, zones: p.zones.filter((_, i) => i !== idx) }))}
                            className="p-1 text-red-400 hover:bg-red-500/10 rounded transition-colors"
                          >
                            <FiTrash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <PiazzaleZoneForm onAdd={(zone) => setPiazzale(p => ({ ...p, zones: [...(p.zones || []), zone] }))} />
                  </Card>

                  <div className="grid md:grid-cols-2 gap-4">
                    <Card title="Comportamento Piazzale">
                      <div className="space-y-3">
                        <Field label="Zona Predefinita Ingresso">
                          <select
                            className="w-full px-3 py-1.5 text-xs border border-[#243044] rounded-lg bg-[#141c27] text-slate-200 focus:ring-1 focus:ring-blue-500/40 outline-none"
                            value={piazzale.defaultZone || ""}
                            onChange={e => setPiazzale(p => ({ ...p, defaultZone: e.target.value }))}
                          >
                            {(piazzale.zones || []).map((z, i) => (
                              <option key={i} value={z.name}>{z.name}</option>
                            ))}
                          </select>
                        </Field>
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={piazzale.autoAssignPosition}
                            onChange={() => setPiazzale(p => ({ ...p, autoAssignPosition: !p.autoAssignPosition }))}
                            className="rounded border-[#243044] text-blue-500 focus:ring-blue-500/40"
                          />
                          <span className="text-xs text-slate-300">Assegna posizione automaticamente</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={piazzale.requirePhotoOnEntry}
                            onChange={() => setPiazzale(p => ({ ...p, requirePhotoOnEntry: !p.requirePhotoOnEntry }))}
                            className="rounded border-[#243044] text-blue-500 focus:ring-blue-500/40"
                          />
                          <span className="text-xs text-slate-300">Richiedi foto all&apos;ingresso</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={piazzale.trackMovements}
                            onChange={() => setPiazzale(p => ({ ...p, trackMovements: !p.trackMovements }))}
                            className="rounded border-[#243044] text-blue-500 focus:ring-blue-500/40"
                          />
                          <span className="text-xs text-slate-300">Traccia spostamenti tra zone</span>
                        </label>
                      </div>
                    </Card>

                    <Card title="Suggerimenti Zone">
                      <div className="space-y-2 text-[10px] text-slate-500">
                        <div className="p-2 bg-blue-500/5 border border-blue-500/20 rounded-lg">
                          <span className="font-medium text-blue-400">Ingresso:</span> Veicoli appena arrivati, in attesa di ispezione
                        </div>
                        <div className="p-2 bg-emerald-500/5 border border-emerald-500/20 rounded-lg">
                          <span className="font-medium text-emerald-400">Stoccaggio:</span> Veicoli in attesa di demolizione o vendita ricambi
                        </div>
                        <div className="p-2 bg-amber-500/5 border border-amber-500/20 rounded-lg">
                          <span className="font-medium text-amber-400">Lavorazione:</span> Veicoli in fase di smontaggio/demolizione
                        </div>
                        <div className="p-2 bg-purple-500/5 border border-purple-500/20 rounded-lg">
                          <span className="font-medium text-purple-400">Ricambi:</span> Area stoccaggio ricambi estratti
                        </div>
                        <div className="p-2 bg-red-500/5 border border-red-500/20 rounded-lg">
                          <span className="font-medium text-red-400">Rottami:</span> Materiali pronti per il conferimento
                        </div>
                      </div>
                    </Card>
                  </div>
                </div>
              </Section>
            </div>
          )}

          {/* Trasporti Tab */}
          {activeTab === "trasporti" && (
            <div className="space-y-4">
              <Section title="Configurazione Trasporti" desc="Workflow, requisiti e impostazioni predefinite per i trasporti">
                <div className="grid md:grid-cols-2 gap-4">
                  <Card title="Workflow Trasporti">
                    <div className="space-y-3">
                      <Field label="Stato Predefinito">
                        <select
                          className="w-full px-3 py-1.5 text-xs border border-[#243044] rounded-lg bg-[#141c27] text-slate-200 focus:ring-1 focus:ring-blue-500/40 outline-none"
                          value={trasporti.defaultStatus || "da fare"}
                          onChange={e => setTrasporti(p => ({ ...p, defaultStatus: e.target.value }))}
                        >
                          {(trasporti.statuses || []).map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </Field>
                      <Field label="Massimo Fermate per Viaggio">
                        <input
                          type="number"
                          min={1}
                          max={20}
                          className="w-full px-3 py-1.5 text-xs border border-[#243044] rounded-lg bg-[#141c27] text-slate-200 focus:ring-1 focus:ring-blue-500/40 outline-none"
                          value={trasporti.maxStopsPerTrip || 5}
                          onChange={e => setTrasporti(p => ({ ...p, maxStopsPerTrip: parseInt(e.target.value) || 5 }))}
                        />
                      </Field>
                      <Field label="Note Predefinite Trasporto">
                        <textarea
                          className="w-full px-3 py-1.5 text-xs border border-[#243044] rounded-lg bg-[#141c27] text-slate-200 placeholder-slate-500 focus:ring-1 focus:ring-blue-500/40 outline-none resize-none"
                          rows={2}
                          placeholder="Note che appariranno su ogni nuovo trasporto"
                          value={trasporti.defaultNotes || ""}
                          onChange={e => setTrasporti(p => ({ ...p, defaultNotes: e.target.value }))}
                        />
                      </Field>
                    </div>
                  </Card>

                  <Card title="Requisiti Trasporto">
                    <div className="space-y-3">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={trasporti.requireDriverAssignment}
                          onChange={() => setTrasporti(p => ({ ...p, requireDriverAssignment: !p.requireDriverAssignment }))}
                          className="rounded border-[#243044] text-blue-500 focus:ring-blue-500/40"
                        />
                        <span className="text-xs text-slate-300">Richiedi assegnazione autista</span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={trasporti.requireVehicleAssignment}
                          onChange={() => setTrasporti(p => ({ ...p, requireVehicleAssignment: !p.requireVehicleAssignment }))}
                          className="rounded border-[#243044] text-blue-500 focus:ring-blue-500/40"
                        />
                        <span className="text-xs text-slate-300">Richiedi assegnazione veicolo</span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={trasporti.requirePhotoOnPickup}
                          onChange={() => setTrasporti(p => ({ ...p, requirePhotoOnPickup: !p.requirePhotoOnPickup }))}
                          className="rounded border-[#243044] text-blue-500 focus:ring-blue-500/40"
                        />
                        <span className="text-xs text-slate-300">Richiedi foto al ritiro</span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={trasporti.requirePhotoOnDelivery}
                          onChange={() => setTrasporti(p => ({ ...p, requirePhotoOnDelivery: !p.requirePhotoOnDelivery }))}
                          className="rounded border-[#243044] text-blue-500 focus:ring-blue-500/40"
                        />
                        <span className="text-xs text-slate-300">Richiedi foto alla consegna</span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={trasporti.requireSignatureOnDelivery}
                          onChange={() => setTrasporti(p => ({ ...p, requireSignatureOnDelivery: !p.requireSignatureOnDelivery }))}
                          className="rounded border-[#243044] text-blue-500 focus:ring-blue-500/40"
                        />
                        <span className="text-xs text-slate-300">Richiedi firma alla consegna</span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={trasporti.autoNotifyDriver}
                          onChange={() => setTrasporti(p => ({ ...p, autoNotifyDriver: !p.autoNotifyDriver }))}
                          className="rounded border-[#243044] text-blue-500 focus:ring-blue-500/40"
                        />
                        <span className="text-xs text-slate-300">Notifica automatica autista</span>
                      </label>
                    </div>
                  </Card>
                </div>
              </Section>
            </div>
          )}

          {/* Calendario Tab */}
          {activeTab === "calendario" && (
            <div className="space-y-4">
              <Section title="Configurazione Calendario" desc="Orari lavorativi, giorni festivi, durata appuntamenti e colori eventi">
                <div className="grid md:grid-cols-2 gap-4">
                  <Card title="Orario Lavorativo">
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <Field label="Inizio Giornata">
                          <input
                            type="time"
                            className="w-full px-3 py-1.5 text-xs border border-[#243044] rounded-lg bg-[#141c27] text-slate-200 focus:ring-1 focus:ring-blue-500/40 outline-none"
                            value={calendario.orarioLavorativo?.inizio || "08:00"}
                            onChange={e => setCalendario(p => ({ ...p, orarioLavorativo: { ...p.orarioLavorativo, inizio: e.target.value } }))}
                          />
                        </Field>
                        <Field label="Fine Giornata">
                          <input
                            type="time"
                            className="w-full px-3 py-1.5 text-xs border border-[#243044] rounded-lg bg-[#141c27] text-slate-200 focus:ring-1 focus:ring-blue-500/40 outline-none"
                            value={calendario.orarioLavorativo?.fine || "18:00"}
                            onChange={e => setCalendario(p => ({ ...p, orarioLavorativo: { ...p.orarioLavorativo, fine: e.target.value } }))}
                          />
                        </Field>
                      </div>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={calendario.pausa?.abilitata}
                          onChange={() => setCalendario(p => ({ ...p, pausa: { ...p.pausa, abilitata: !p.pausa.abilitata } }))}
                          className="rounded border-[#243044] text-blue-500 focus:ring-blue-500/40"
                        />
                        <span className="text-xs text-slate-300">Pausa pranzo</span>
                      </label>
                      {calendario.pausa?.abilitata && (
                        <div className="grid grid-cols-2 gap-3 pl-6">
                          <Field label="Inizio Pausa">
                            <input
                              type="time"
                              className="w-full px-3 py-1.5 text-xs border border-[#243044] rounded-lg bg-[#141c27] text-slate-200 focus:ring-1 focus:ring-blue-500/40 outline-none"
                              value={calendario.pausa?.inizio || "13:00"}
                              onChange={e => setCalendario(p => ({ ...p, pausa: { ...p.pausa, inizio: e.target.value } }))}
                            />
                          </Field>
                          <Field label="Fine Pausa">
                            <input
                              type="time"
                              className="w-full px-3 py-1.5 text-xs border border-[#243044] rounded-lg bg-[#141c27] text-slate-200 focus:ring-1 focus:ring-blue-500/40 outline-none"
                              value={calendario.pausa?.fine || "14:00"}
                              onChange={e => setCalendario(p => ({ ...p, pausa: { ...p.pausa, fine: e.target.value } }))}
                            />
                          </Field>
                        </div>
                      )}
                      <Field label="Giorni Lavorativi">
                        <div className="flex flex-wrap gap-1.5">
                          {[
                            { key: "lun", label: "Lun" }, { key: "mar", label: "Mar" }, { key: "mer", label: "Mer" },
                            { key: "gio", label: "Gio" }, { key: "ven", label: "Ven" }, { key: "sab", label: "Sab" }, { key: "dom", label: "Dom" },
                          ].map(g => {
                            const active = (calendario.giorniLavorativi || []).includes(g.key);
                            return (
                              <button
                                key={g.key}
                                onClick={() => setCalendario(p => ({
                                  ...p,
                                  giorniLavorativi: active
                                    ? p.giorniLavorativi.filter(d => d !== g.key)
                                    : [...p.giorniLavorativi, g.key]
                                }))}
                                className={`px-2.5 py-1 text-[10px] font-medium rounded-md transition-colors ${active ? "bg-blue-600 text-white" : "bg-[#141c27] text-slate-400 border border-[#243044] hover:border-blue-500/30"
                                  }`}
                              >
                                {g.label}
                              </button>
                            );
                          })}
                        </div>
                      </Field>
                      <Field label="Durata Predefinita Appuntamento">
                        <select
                          className="w-full px-3 py-1.5 text-xs border border-[#243044] rounded-lg bg-[#141c27] text-slate-200 focus:ring-1 focus:ring-blue-500/40 outline-none"
                          value={calendario.durataDefaultMinuti || 60}
                          onChange={e => setCalendario(p => ({ ...p, durataDefaultMinuti: Number.parseInt(e.target.value) }))}
                        >
                          <option value={15}>15 minuti</option>
                          <option value={30}>30 minuti</option>
                          <option value={45}>45 minuti</option>
                          <option value={60}>1 ora</option>
                          <option value={90}>1 ora e 30</option>
                          <option value={120}>2 ore</option>
                          <option value={240}>4 ore</option>
                          <option value={480}>Giornata intera</option>
                        </select>
                      </Field>
                      <Field label="Vista Predefinita">
                        <select
                          className="w-full px-3 py-1.5 text-xs border border-[#243044] rounded-lg bg-[#141c27] text-slate-200 focus:ring-1 focus:ring-blue-500/40 outline-none"
                          value={calendario.vistaDefault || "settimana"}
                          onChange={e => setCalendario(p => ({ ...p, vistaDefault: e.target.value }))}
                        >
                          <option value="giorno">Giorno</option>
                          <option value="settimana">Settimana</option>
                          <option value="mese">Mese</option>
                        </select>
                      </Field>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={calendario.mostraWeekend}
                          onChange={() => setCalendario(p => ({ ...p, mostraWeekend: !p.mostraWeekend }))}
                          className="rounded border-[#243044] text-blue-500 focus:ring-blue-500/40"
                        />
                        <span className="text-xs text-slate-300">Mostra weekend nel calendario</span>
                      </label>
                    </div>
                  </Card>

                  <div className="space-y-4">
                    <Card title="Colori Eventi">
                      <div className="space-y-2">
                        {Object.entries(calendario.coloriEventi || {}).map(([tipo, colore]) => (
                          <div key={tipo} className="flex items-center gap-3 p-2 bg-[#141c27] rounded-lg border border-[#243044]">
                            <input
                              type="color"
                              className="w-6 h-6 rounded border border-[#243044] cursor-pointer"
                              value={colore}
                              onChange={e => setCalendario(p => ({ ...p, coloriEventi: { ...p.coloriEventi, [tipo]: e.target.value } }))}
                            />
                            <span className="text-xs text-slate-300 capitalize">{tipo}</span>
                          </div>
                        ))}
                      </div>
                    </Card>

                    <Card title="Giorni Festivi">
                      <p className="text-[10px] text-slate-500 mb-2">Festività italiane predefinite. Puoi aggiungerne di personalizzate.</p>
                      <div className="space-y-1.5 mb-3 max-h-48 overflow-y-auto">
                        {(calendario.giorniFestivi || []).map((f, idx) => (
                          <div key={idx} className="flex items-center justify-between p-1.5 bg-[#141c27] rounded border border-[#243044]">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-slate-500 font-mono w-10">{f.data}</span>
                              <span className="text-xs text-slate-300">{f.nome}</span>
                            </div>
                            <button
                              onClick={() => setCalendario(p => ({ ...p, giorniFestivi: p.giorniFestivi.filter((_, i) => i !== idx) }))}
                              className="p-0.5 text-red-400 hover:bg-red-500/10 rounded transition-colors"
                            >
                              <FiX className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                      <CalendarioFestivoForm onAdd={(f) => setCalendario(p => ({ ...p, giorniFestivi: [...(p.giorniFestivi || []), f] }))} />
                    </Card>
                  </div>
                </div>
              </Section>
            </div>
          )}

          {/* CRM Clienti Tab */}
          {activeTab === "crmClienti" && (
            <div className="space-y-4">
              <Section title="CRM Clienti" desc="Categorie, tag predefiniti, campi personalizzati e pipeline vendita">
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Categorie Clienti */}
                    <Card title="Categorie Clienti">
                      <p className="text-[10px] text-slate-500 mb-2">Categorie per classificare i clienti.</p>
                      <div className="space-y-1.5 mb-3">
                        {(crmClienti.categorie || []).map((cat, idx) => (
                          <div key={idx} className="flex items-center gap-2 p-2 bg-[#141c27] rounded-lg border border-[#243044]">
                            <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: cat.colore }} />
                            <span className="text-xs text-slate-200 flex-1">{cat.nome}</span>
                            <button
                              onClick={() => setCrmClienti(p => ({ ...p, categorie: p.categorie.filter((_, i) => i !== idx) }))}
                              className="p-0.5 text-red-400 hover:bg-red-500/10 rounded transition-colors"
                            >
                              <FiX className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                      <CrmCategoriaForm onAdd={(cat) => setCrmClienti(p => ({ ...p, categorie: [...(p.categorie || []), cat] }))} />
                    </Card>

                    {/* Pipeline Vendita */}
                    <Card title="Pipeline Vendita">
                      <p className="text-[10px] text-slate-500 mb-2">Fasi del processo commerciale con il cliente.</p>
                      <div className="space-y-1.5 mb-3">
                        {(crmClienti.pipeline || []).map((fase, idx) => (
                          <div key={idx} className="flex items-center gap-2 p-2 bg-[#141c27] rounded-lg border border-[#243044]">
                            <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: fase.colore }} />
                            <span className="text-xs text-slate-200 flex-1">{fase.nome}</span>
                            <span className="text-[10px] text-slate-500">Fase {idx + 1}</span>
                            <button
                              onClick={() => setCrmClienti(p => ({ ...p, pipeline: p.pipeline.filter((_, i) => i !== idx) }))}
                              className="p-0.5 text-red-400 hover:bg-red-500/10 rounded transition-colors"
                            >
                              <FiX className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                      <CrmCategoriaForm onAdd={(fase) => setCrmClienti(p => ({ ...p, pipeline: [...(p.pipeline || []), fase] }))} placeholder="Nome fase (es: Qualificato)" />
                    </Card>
                  </div>

                  {/* Tag Predefiniti */}
                  <Card title="Tag Predefiniti">
                    <p className="text-[10px] text-slate-500 mb-2">Tag rapidi da assegnare ai clienti per filtrarli velocemente.</p>
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {(crmClienti.tagPredefiniti || []).map((tag, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium bg-[#141c27] text-slate-300 rounded-full border border-[#243044]">
                          {tag}
                          <button
                            onClick={() => setCrmClienti(p => ({ ...p, tagPredefiniti: p.tagPredefiniti.filter((_, i) => i !== idx) }))}
                            className="text-red-400 hover:text-red-300"
                          >
                            <FiX className="w-2.5 h-2.5" />
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        id="newTag"
                        className="flex-1 px-3 py-1.5 text-xs border border-[#243044] rounded-lg bg-[#141c27] text-slate-200 placeholder-slate-500 focus:ring-1 focus:ring-blue-500/40 outline-none"
                        placeholder="Nuovo tag..."
                        onKeyDown={e => {
                          if (e.key === "Enter" && e.target.value.trim()) {
                            setCrmClienti(p => ({ ...p, tagPredefiniti: [...(p.tagPredefiniti || []), e.target.value.trim()] }));
                            e.target.value = "";
                          }
                        }}
                      />
                      <button
                        onClick={() => {
                          const input = document.getElementById("newTag");
                          if (input?.value.trim()) {
                            setCrmClienti(p => ({ ...p, tagPredefiniti: [...(p.tagPredefiniti || []), input.value.trim()] }));
                            input.value = "";
                          }
                        }}
                        className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <FiPlus className="w-3 h-3" />
                      </button>
                    </div>
                  </Card>

                  {/* Campi Personalizzati */}
                  <Card title="Campi Personalizzati Cliente">
                    <p className="text-[10px] text-slate-500 mb-2">Campi aggiuntivi da mostrare nella scheda cliente.</p>
                    <div className="space-y-2 mb-3">
                      {(crmClienti.campiCustom || []).map((campo, idx) => (
                        <label key={campo.key} className="flex items-center gap-3 p-2 bg-[#141c27] rounded-lg border border-[#243044] cursor-pointer hover:border-blue-500/20 transition-colors">
                          <input
                            type="checkbox"
                            checked={campo.abilitato}
                            onChange={() => {
                              const updated = [...crmClienti.campiCustom];
                              updated[idx] = { ...updated[idx], abilitato: !updated[idx].abilitato };
                              setCrmClienti(p => ({ ...p, campiCustom: updated }));
                            }}
                            className="rounded border-[#243044] text-blue-500 focus:ring-blue-500/40"
                          />
                          <div className="flex-1">
                            <span className="text-xs text-slate-200">{campo.label}</span>
                            <span className="text-[10px] text-slate-500 ml-2">({campo.tipo})</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </Card>

                  {/* Requisiti */}
                  <Card title="Requisiti Anagrafica Cliente">
                    <div className="space-y-3">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={crmClienti.requireEmail}
                          onChange={() => setCrmClienti(p => ({ ...p, requireEmail: !p.requireEmail }))}
                          className="rounded border-[#243044] text-blue-500 focus:ring-blue-500/40"
                        />
                        <span className="text-xs text-slate-300">Email obbligatoria</span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={crmClienti.requirePhone}
                          onChange={() => setCrmClienti(p => ({ ...p, requirePhone: !p.requirePhone }))}
                          className="rounded border-[#243044] text-blue-500 focus:ring-blue-500/40"
                        />
                        <span className="text-xs text-slate-300">Telefono obbligatorio</span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={crmClienti.requirePIVA}
                          onChange={() => setCrmClienti(p => ({ ...p, requirePIVA: !p.requirePIVA }))}
                          className="rounded border-[#243044] text-blue-500 focus:ring-blue-500/40"
                        />
                        <span className="text-xs text-slate-300">P.IVA / Codice Fiscale obbligatorio</span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={crmClienti.autoAssignCategory}
                          onChange={() => setCrmClienti(p => ({ ...p, autoAssignCategory: !p.autoAssignCategory }))}
                          className="rounded border-[#243044] text-blue-500 focus:ring-blue-500/40"
                        />
                        <span className="text-xs text-slate-300">Assegna categoria automaticamente (Privato se CF, Azienda se P.IVA)</span>
                      </label>
                    </div>
                  </Card>
                </div>
              </Section>
            </div>
          )}

          {/* Data & Backup Tab */}
          {activeTab === "data" && (
            <Section title="Gestione Dati e Backup" desc="Esporta, importa e gestisci i tuoi dati">
              <div className="grid md:grid-cols-2 gap-3">
                <Card title="Backup e Ripristino">
                  <div className="space-y-4">
                    <p className="text-xs text-slate-500">
                      Esporta tutte le tue impostazioni in un file JSON per creare un backup completo.
                    </p>
                    <div className="flex gap-3">
                      <button
                        onClick={exportConfig}
                        className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <FiDownload className="w-4 h-4" />
                        Esporta Backup
                      </button>
                      <button
                        onClick={importConfig}
                        className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-300 bg-[#141c27] rounded-lg hover:bg-[#243044] transition-colors"
                      >
                        <FiUpload className="w-4 h-4" />
                        Ripristina Backup
                      </button>
                    </div>
                  </div>
                </Card>

                <Card title="Informazioni Sistema">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">SLA Attuale:</span>
                      <span className="text-sm font-medium">{general.workflow.slaMinutes} minuti</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">Tema:</span>
                      <span className="text-sm font-medium capitalize">{appearance.theme}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">Lingua:</span>
                      <span className="text-sm font-medium">{general.language === 'it' ? 'Italiano' : 'English'}</span>
                    </div>
                  </div>
                </Card>
              </div>
            </Section>
          )}
        </div>
      </div>

      {/* Modal Creazione Template */}
      <Modal
        open={showCreateTemplateModal}
        onClose={() => setShowCreateTemplateModal(false)}
        title="Crea Nuovo Template"
        footer={
          <>
            <button
              type="button"
              onClick={() => setShowCreateTemplateModal(false)}
              className="px-3 py-1.5 text-xs font-medium text-slate-300 bg-[#141c27] rounded-lg hover:bg-[#243044] transition-colors"
            >
              Annulla
            </button>
            <button
              type="button"
              onClick={handleCreateTemplate}
              disabled={savingTemplate || !templateForm.name.trim()}
              className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {savingTemplate ? (
                <>
                  <FiRefreshCw className="w-4 h-4 inline mr-2 animate-spin" />
                  Creazione...
                </>
              ) : (
                <>
                  <FiCheck className="w-4 h-4 inline mr-2" />
                  Crea Template
                </>
              )}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Nome Template" required>
            <input
              type="text"
              className="w-full px-3 py-1.5 text-xs border border-[#243044] rounded-lg bg-[#1a2536] text-slate-200 placeholder-slate-600 focus:ring-1 focus:ring-blue-500/40 outline-none"
              placeholder="Es. Lista Trasporti Base"
              value={templateForm.name}
              onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
            />
          </Field>

          <Field label="Descrizione" tooltip="Breve descrizione del template">
            <textarea
              rows={2}
              className="w-full px-3 py-1.5 text-xs border border-[#243044] rounded-lg bg-[#1a2536] text-slate-200 placeholder-slate-600 focus:ring-1 focus:ring-blue-500/40 outline-none resize-none"
              placeholder="Es. Template base per esportare liste di trasporti in PDF"
              value={templateForm.description}
              onChange={(e) => setTemplateForm({ ...templateForm, description: e.target.value })}
            />
          </Field>

          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Categoria" required>
              <select
                className="w-full px-3 py-1.5 text-xs border border-[#243044] rounded-lg bg-[#1a2536] text-slate-200 focus:ring-1 focus:ring-blue-500/40 outline-none"
                value={templateForm.category}
                onChange={(e) => setTemplateForm({ ...templateForm, category: e.target.value })}
              >
                <option value="transports">Trasporti</option>
                <option value="clients">Clienti</option>
                <option value="quotes">Preventivi</option>
                <option value="invoices">Fatture</option>
                <option value="yard">Piazzale</option>
                <option value="spare_parts">Ricambi</option>
                <option value="drivers">Autisti</option>
                <option value="vehicles">Veicoli</option>
              </select>
            </Field>

            <Field label="Tipo Documento" required>
              <select
                className="w-full px-3 py-1.5 text-xs border border-[#243044] rounded-lg bg-[#1a2536] text-slate-200 focus:ring-1 focus:ring-blue-500/40 outline-none"
                value={templateForm.document_type}
                onChange={(e) => setTemplateForm({ ...templateForm, document_type: e.target.value })}
              >
                <option value="pdf">PDF</option>
                <option value="csv">CSV</option>
                <option value="xlsx">Excel (XLSX)</option>
                <option value="html">HTML</option>
              </select>
            </Field>
          </div>

          <div className="mt-4 p-4 bg-blue-500/10 rounded-lg">
            <p className="text-sm text-blue-400">
              <FiInfo className="w-4 h-4 inline mr-2" />
              Il template sarà creato con configurazioni di base. Potrai personalizzarlo successivamente modificandolo.
            </p>
          </div>
        </div>
      </Modal>

      {/* Modal Modifica Template */}
      <Modal
        open={Boolean(editingTemplate)}
        onClose={() => setEditingTemplate(null)}
        title={editingTemplate ? `Modifica ${editingTemplate.name}` : "Modifica Template"}
        footer={
          <>
            <button
              type="button"
              onClick={() => setEditingTemplate(null)}
              className="px-3 py-1.5 text-xs font-medium text-slate-300 bg-[#141c27] rounded-lg hover:bg-[#243044] transition-colors"
            >
              Annulla
            </button>
            <button
              type="button"
              onClick={handleUpdateTemplate}
              disabled={savingEditTemplate || !editTemplateForm.name.trim()}
              className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {savingEditTemplate ? (
                <>
                  <FiRefreshCw className="w-4 h-4 inline mr-2 animate-spin" />
                  Salvataggio...
                </>
              ) : (
                <>
                  <FiCheck className="w-4 h-4 inline mr-2" />
                  Aggiorna Template
                </>
              )}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Nome Template" required>
            <input
              type="text"
              className="w-full px-3 py-1.5 text-xs border border-[#243044] rounded-lg bg-[#1a2536] text-slate-200 placeholder-slate-600 focus:ring-1 focus:ring-blue-500/40 outline-none"
              value={editTemplateForm.name}
              onChange={(e) => setEditTemplateForm(prev => ({ ...prev, name: e.target.value }))}
            />
          </Field>

          <Field label="Descrizione">
            <textarea
              rows={3}
              className="w-full px-3 py-1.5 text-xs border border-[#243044] rounded-lg bg-[#1a2536] text-slate-200 placeholder-slate-600 focus:ring-1 focus:ring-blue-500/40 outline-none resize-none"
              value={editTemplateForm.description}
              onChange={(e) => setEditTemplateForm(prev => ({ ...prev, description: e.target.value }))}
            />
          </Field>

          {editingTemplate?.updated_at && (
            <div className="text-sm text-slate-500 border border-[#243044] rounded-lg p-3 bg-[#141c27]/30">
              Ultima modifica: {new Date(editingTemplate.updated_at).toLocaleString('it-IT')}
            </div>
          )}
        </div>
      </Modal>

      {/* Toast Notification — auto-dismiss */}
      {toast.msg && (
        <div
          className={`fixed bottom-4 right-4 z-50 px-4 py-3 rounded-xl border shadow-lg backdrop-blur-sm animate-[slideIn_0.3s_ease-out] ${toast.type === "success"
            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
            : "bg-red-500/10 border-red-500/20 text-red-400"
            }`}
        >
          <div className="flex items-center gap-2.5">
            {toast.type === "success" ? <FiCheck className="w-4 h-4 shrink-0" /> : <FiAlertCircle className="w-4 h-4 shrink-0" />}
            <span className="text-sm">{toast.msg}</span>
            <button
              onClick={() => { setToast({ type: "success", msg: "" }); if (toastTimerRef.current) clearTimeout(toastTimerRef.current); }}
              className="ml-2 opacity-60 hover:opacity-100 transition-opacity"
            >
              <FiX className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Componenti helper
function NewOrgForm({ onCreate }) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || busy) return;

    setBusy(true);
    await onCreate?.(name);
    setBusy(false);
    setName("");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field label="Nome Organizzazione" required>
        <input
          type="text"
          className="w-full px-3 py-1.5 text-xs border border-[#243044] rounded-lg bg-[#1a2536] text-slate-200 placeholder-slate-600 focus:ring-1 focus:ring-blue-500/40 outline-none"
          placeholder="es. Carrozzeria Rossi"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </Field>
      <button
        type="submit"
        disabled={busy || !name.trim()}
        className="w-full flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {busy ? <FiRefreshCw className="w-3.5 h-3.5 animate-spin" /> : <FiPlus className="w-4 h-4" />}
        {busy ? "Creazione..." : "Crea Organizzazione"}
      </button>
    </form>
  );
}

function OrgList({ orgs, currentOrg, onSetCurrent, onDelete = null }) {
  return (
    <table className="w-full text-sm">
      <thead className="bg-[#141c27]/50">
        <tr>
          <th className="text-left px-4 py-3 font-medium text-slate-400">Nome</th>
          <th className="text-left px-4 py-3 font-medium text-slate-400">ID</th>
          <th className="text-left px-4 py-3 font-medium text-slate-400">Ruolo</th>
          <th className="text-right px-4 py-3 font-medium text-slate-400">Azioni</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-[#243044]">
        {orgs.map((org) => {
          const isCurrent = currentOrg === org.id;
          const isOwner = (org.role || "").toLowerCase() === "owner";

          return (
            <tr key={org.id} className="hover:bg-[#141c27]">
              <td className="px-4 py-3">
                <div className="font-medium text-slate-200">{org.name}</div>
              </td>
              <td className="px-4 py-3">
                <code className="text-xs bg-[#141c27] px-2 py-1 rounded font-mono">
                  {org.number ? `ORG${String(org.number).padStart(4, '0')}` : org.id?.slice(0, 8)}
                </code>
              </td>
              <td className="px-4 py-3">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isOwner
                  ? "bg-red-500/10 text-red-400"
                  : "bg-[#141c27] text-slate-200"
                  }`}>
                  {org.role || "member"}
                </span>
              </td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => onSetCurrent?.(org.id)}
                    disabled={isCurrent}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${isCurrent
                      ? "bg-blue-500/10 text-blue-400 cursor-not-allowed"
                      : "bg-[#141c27] text-slate-200   hover:bg-[#243044]"
                      }`}
                  >
                    {isCurrent ? "Selezionata" : "Seleziona"}
                  </button>
                  {isOwner && onDelete && (
                    <button
                      onClick={() => onDelete(org.id, org.name)}
                      className="px-3 py-1.5 text-xs font-medium text-red-400 bg-red-500/10 rounded-lg hover:bg-red-500/15 transition-colors"
                    >
                      <FiTrash2 className="w-3 h-3 inline mr-1" />
                      Elimina
                    </button>
                  )}
                </div>
              </td>
            </tr>
          );
        })}
        {orgs.length === 0 && (
          <tr>
            <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
              Nessuna organizzazione trovata
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}

// PropTypes
NewOrgForm.propTypes = {
  onCreate: PropTypes.func.isRequired
};

OrgList.propTypes = {
  orgs: PropTypes.array.isRequired,
  currentOrg: PropTypes.string,
  onSetCurrent: PropTypes.func.isRequired,
  onDelete: PropTypes.func
};

// --- Helper: Form per aggiungere voce preimpostata fattura/preventivo ---
function InvoicePresetForm({ onAdd }) {
  const [desc, setDesc] = useState("");
  const [price, setPrice] = useState("");
  const [qty, setQty] = useState("1");
  const [unit, setUnit] = useState("pz");
  const [vat, setVat] = useState("22");

  function handleAdd() {
    if (!desc.trim() || !price) return;
    onAdd({
      description: desc.trim(),
      unitPrice: parseFloat(price) || 0,
      quantity: parseFloat(qty) || 1,
      unit,
      vatRate: parseFloat(vat) || 22,
    });
    setDesc("");
    setPrice("");
    setQty("1");
    setUnit("pz");
    setVat("22");
  }

  return (
    <div className="border border-dashed border-[#243044] rounded-lg p-3 space-y-2">
      <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Nuova voce</div>
      <input
        type="text"
        className="w-full px-3 py-1.5 text-xs border border-[#243044] rounded-lg bg-[#141c27] text-slate-200 placeholder-slate-500 focus:ring-1 focus:ring-blue-500/40 outline-none"
        placeholder="Descrizione (es: Smontaggio motore, Trasporto veicolo...)"
        value={desc}
        onChange={e => setDesc(e.target.value)}
      />
      <div className="grid grid-cols-4 gap-2">
        <div>
          <label className="text-[10px] text-slate-500 mb-0.5 block">Prezzo unit.</label>
          <input
            type="number"
            step="0.01"
            min="0"
            className="w-full px-2 py-1.5 text-xs border border-[#243044] rounded-lg bg-[#141c27] text-slate-200 focus:ring-1 focus:ring-blue-500/40 outline-none"
            placeholder="0.00"
            value={price}
            onChange={e => setPrice(e.target.value)}
          />
        </div>
        <div>
          <label className="text-[10px] text-slate-500 mb-0.5 block">Quantità</label>
          <input
            type="number"
            step="1"
            min="1"
            className="w-full px-2 py-1.5 text-xs border border-[#243044] rounded-lg bg-[#141c27] text-slate-200 focus:ring-1 focus:ring-blue-500/40 outline-none"
            value={qty}
            onChange={e => setQty(e.target.value)}
          />
        </div>
        <div>
          <label className="text-[10px] text-slate-500 mb-0.5 block">Unità</label>
          <select
            className="w-full px-2 py-1.5 text-xs border border-[#243044] rounded-lg bg-[#141c27] text-slate-200 focus:ring-1 focus:ring-blue-500/40 outline-none"
            value={unit}
            onChange={e => setUnit(e.target.value)}
          >
            <option value="pz">pz</option>
            <option value="kg">kg</option>
            <option value="ore">ore</option>
            <option value="km">km</option>
            <option value="lt">lt</option>
            <option value="mq">mq</option>
            <option value="forfait">forfait</option>
          </select>
        </div>
        <div>
          <label className="text-[10px] text-slate-500 mb-0.5 block">IVA %</label>
          <select
            className="w-full px-2 py-1.5 text-xs border border-[#243044] rounded-lg bg-[#141c27] text-slate-200 focus:ring-1 focus:ring-blue-500/40 outline-none"
            value={vat}
            onChange={e => setVat(e.target.value)}
          >
            <option value="22">22%</option>
            <option value="10">10%</option>
            <option value="4">4%</option>
            <option value="0">Esente (0%)</option>
          </select>
        </div>
      </div>
      <button
        onClick={handleAdd}
        disabled={!desc.trim() || !price}
        className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        <FiPlus className="w-3 h-3" /> Aggiungi Voce
      </button>
    </div>
  );
}

InvoicePresetForm.propTypes = {
  onAdd: PropTypes.func.isRequired,
};

// --- Helper: Form per aggiungere zona piazzale ---
function PiazzaleZoneForm({ onAdd }) {
  const [name, setName] = useState("");
  const [type, setType] = useState("stoccaggio");
  const [capacity, setCapacity] = useState("20");
  const [color, setColor] = useState("#3b82f6");

  function handleAdd() {
    if (!name.trim()) return;
    onAdd({
      name: name.trim(),
      type,
      capacity: parseInt(capacity) || 20,
      color,
    });
    setName("");
    setType("stoccaggio");
    setCapacity("20");
    setColor("#3b82f6");
  }

  return (
    <div className="border border-dashed border-[#243044] rounded-lg p-3 space-y-2">
      <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Nuova zona</div>
      <input
        type="text"
        className="w-full px-3 py-1.5 text-xs border border-[#243044] rounded-lg bg-[#141c27] text-slate-200 placeholder-slate-500 focus:ring-1 focus:ring-blue-500/40 outline-none"
        placeholder="Nome zona (es: Zona F - Veicoli elettrici)"
        value={name}
        onChange={e => setName(e.target.value)}
      />
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="text-[10px] text-slate-500 mb-0.5 block">Tipo</label>
          <select
            className="w-full px-2 py-1.5 text-xs border border-[#243044] rounded-lg bg-[#141c27] text-slate-200 focus:ring-1 focus:ring-blue-500/40 outline-none"
            value={type}
            onChange={e => setType(e.target.value)}
          >
            <option value="ingresso">Ingresso</option>
            <option value="stoccaggio">Stoccaggio</option>
            <option value="lavorazione">Lavorazione</option>
            <option value="ricambi">Ricambi</option>
            <option value="rottami">Rottami</option>
            <option value="uscita">Uscita</option>
            <option value="speciale">Speciale</option>
          </select>
        </div>
        <div>
          <label className="text-[10px] text-slate-500 mb-0.5 block">Capacità</label>
          <input
            type="number"
            min="1"
            max="500"
            className="w-full px-2 py-1.5 text-xs border border-[#243044] rounded-lg bg-[#141c27] text-slate-200 focus:ring-1 focus:ring-blue-500/40 outline-none"
            value={capacity}
            onChange={e => setCapacity(e.target.value)}
          />
        </div>
        <div>
          <label className="text-[10px] text-slate-500 mb-0.5 block">Colore</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              className="w-8 h-8 rounded border border-[#243044] cursor-pointer"
              value={color}
              onChange={e => setColor(e.target.value)}
            />
            <span className="text-[10px] text-slate-500 font-mono">{color}</span>
          </div>
        </div>
      </div>
      <button
        onClick={handleAdd}
        disabled={!name.trim()}
        className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        <FiPlus className="w-3 h-3" /> Aggiungi Zona
      </button>
    </div>
  );
}

PiazzaleZoneForm.propTypes = {
  onAdd: PropTypes.func.isRequired,
};

// --- Helper: Form per aggiungere giorno festivo ---
function CalendarioFestivoForm({ onAdd }) {
  const [data, setData] = useState("");
  const [nome, setNome] = useState("");

  function handleAdd() {
    if (!data || !nome.trim()) return;
    const formatted = data.slice(5); // da YYYY-MM-DD a MM-DD
    onAdd({ data: formatted, nome: nome.trim() });
    setData("");
    setNome("");
  }

  return (
    <div className="flex gap-2">
      <input
        type="date"
        className="px-2 py-1.5 text-xs border border-[#243044] rounded-lg bg-[#141c27] text-slate-200 focus:ring-1 focus:ring-blue-500/40 outline-none"
        value={data}
        onChange={e => setData(e.target.value)}
      />
      <input
        type="text"
        className="flex-1 px-2 py-1.5 text-xs border border-[#243044] rounded-lg bg-[#141c27] text-slate-200 placeholder-slate-500 focus:ring-1 focus:ring-blue-500/40 outline-none"
        placeholder="Nome festività"
        value={nome}
        onChange={e => setNome(e.target.value)}
      />
      <button
        onClick={handleAdd}
        disabled={!data || !nome.trim()}
        className="px-2.5 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        <FiPlus className="w-3 h-3" />
      </button>
    </div>
  );
}

CalendarioFestivoForm.propTypes = {
  onAdd: PropTypes.func.isRequired,
};

// --- Helper: Form per aggiungere categoria/fase CRM ---
function CrmCategoriaForm({ onAdd, placeholder }) {
  const [nome, setNome] = useState("");
  const [colore, setColore] = useState("#3b82f6");

  function handleAdd() {
    if (!nome.trim()) return;
    onAdd({ nome: nome.trim(), colore });
    setNome("");
    setColore("#3b82f6");
  }

  return (
    <div className="flex gap-2 items-center">
      <input
        type="color"
        className="w-7 h-7 rounded border border-[#243044] cursor-pointer shrink-0"
        value={colore}
        onChange={e => setColore(e.target.value)}
      />
      <input
        type="text"
        className="flex-1 px-2 py-1.5 text-xs border border-[#243044] rounded-lg bg-[#141c27] text-slate-200 placeholder-slate-500 focus:ring-1 focus:ring-blue-500/40 outline-none"
        placeholder={placeholder || "Nome categoria (es: Carrozzeria)"}
        value={nome}
        onChange={e => setNome(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter") handleAdd(); }}
      />
      <button
        onClick={handleAdd}
        disabled={!nome.trim()}
        className="px-2.5 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        <FiPlus className="w-3 h-3" />
      </button>
    </div>
  );
}

CrmCategoriaForm.propTypes = {
  onAdd: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
};
