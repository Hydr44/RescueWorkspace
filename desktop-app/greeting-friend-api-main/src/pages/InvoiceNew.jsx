// src/pages/InvoiceNew.jsx
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { useOrg } from "@/context/OrgContext";
import {
  FiArrowLeft, FiSave, FiPlus, FiTrash2, FiInfo, FiCalendar, FiRefreshCw,
  FiZap, FiFileText, FiX, FiCheck, FiCreditCard, FiUser, FiHash,
  FiDollarSign, FiPercent, FiAlertCircle, FiCheckCircle, FiMapPin
} from "react-icons/fi";
import { calcolaCodiceFiscale } from "@/lib/codiceFiscale";
// Google Maps autocomplete with fallback
let searchAddress = async () => [];
let selectAddressWithDetails = async () => ({});
try { 
  ({ searchAddress, selectAddressWithDetails } = await import("@/lib/google-maps")); 
} catch { 
  // Fallback to old geocoding
  try { ({ searchAddress } = await import("@/lib/geocoding")); } catch { /* noop */ }
}
import { searchComuni, getComuneByName } from "@/lib/comuniItaliani";
import { generateAccountingEntriesForInvoice, saveAccountingEntries, initChartOfAccounts } from "@/lib/accounting";
import { autoFillFromPIVA } from "@/lib/agenzia-entrate";
import OpenAPIDataModal from "@/components/OpenAPIDataModal";
import { getSdiConfig } from "@/lib/sdi";

/* ---------- Helpers ---------- */
const asNum = (v) => (isFinite(Number(v)) ? Number(v) : 0);
const EUR = (v) => (isFinite(Number(v)) ? Number(v).toFixed(2) + " €" : "—");
const EMPTY_ROW = { descr: "Prestazione", item_description: "", qty: 1, price: 0, vat_perc: 22, unit: "PZ", sconto: null };

const tdOptions = [
  { v: "TD01", l: "TD01 - Fattura" },
  { v: "TD02", l: "TD02 - Acconto/Anticipo su fattura" },
  { v: "TD04", l: "TD04 - Nota di credito" },
  { v: "TD05", l: "TD05 - Nota di debito" },
  { v: "TD24", l: "TD24 - Fattura differita" },
];

// Lista paesi ISO 3166-1 alpha-2 (principali per fatturazione)
const PAESI = [
  { code: "IT", name: "Italia" },
  { code: "DE", name: "Germania" },
  { code: "FR", name: "Francia" },
  { code: "ES", name: "Spagna" },
  { code: "GB", name: "Regno Unito" },
  { code: "NL", name: "Paesi Bassi" },
  { code: "BE", name: "Belgio" },
  { code: "AT", name: "Austria" },
  { code: "PL", name: "Polonia" },
  { code: "PT", name: "Portogallo" },
  { code: "GR", name: "Grecia" },
  { code: "CZ", name: "Repubblica Ceca" },
  { code: "RO", name: "Romania" },
  { code: "HU", name: "Ungheria" },
  { code: "SE", name: "Svezia" },
  { code: "DK", name: "Danimarca" },
  { code: "FI", name: "Finlandia" },
  { code: "IE", name: "Irlanda" },
  { code: "CH", name: "Svizzera" },
  { code: "US", name: "Stati Uniti" },
  { code: "CA", name: "Canada" },
  { code: "AU", name: "Australia" },
  { code: "JP", name: "Giappone" },
  { code: "CN", name: "Cina" },
  { code: "BR", name: "Brasile" },
  { code: "MX", name: "Messico" },
  { code: "IN", name: "India" },
  { code: "RU", name: "Russia" },
  { code: "KR", name: "Corea del Sud" },
  { code: "ZA", name: "Sudafrica" },
];

const esigIvaOptions = [
  { v: "I", l: "I - IVA immediata" },
  { v: "D", l: "D - IVA differita" },
  { v: "S", l: "S - Scissione pagamenti (split)" },
];

const modPagOptions = [
  { v: "MP01", l: "MP01 - Contanti" },
  { v: "MP02", l: "MP02 - Assegno" },
  { v: "MP05", l: "MP05 - Bonifico" },
  { v: "MP08", l: "MP08 - Carta di pagamento" },
  { v: "MP12", l: "MP12 - RIBA" },
  { v: "MP23", l: "MP23 - PayPal" },
];

const naturaIvaOptions = [
  { v: "", l: "Nessuna (IVA imponibile)" },
  { v: "N1", l: "N1 - Escluse ex art.15" },
  { v: "N2.1", l: "N2.1 - Non soggette ad IVA" },
  { v: "N2.2", l: "N2.2 - Non soggette - altri casi" },
  { v: "N3.1", l: "N3.1 - Non imponibili - esportazioni" },
  { v: "N3.2", l: "N3.2 - Non imponibili - cessioni intracomunitarie" },
  { v: "N4", l: "N4 - Esenti" },
  { v: "N5", l: "N5 - Regime del margine" },
  { v: "N6.1", l: "N6.1 - Inversione contabile - cessione rottami" },
  { v: "N6.2", l: "N6.2 - Inversione contabile - cessione oro" },
  { v: "N7", l: "N7 - IVA assolta in altro stato UE" },
];

function Field({ label, children, hint }) {
  return (
    <div>
      {label && <label className="block text-xs text-slate-400 mb-1">{label}</label>}
      {children}
      {hint && <div className="mt-1 text-[11px] text-slate-500 flex items-start gap-1"><FiInfo className="shrink-0 mt-0.5" /><span>{hint}</span></div>}
    </div>
  );
}

export default function InvoiceNew() {
  const supabase = supabaseBrowser();
  const { orgId } = useOrg();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("edit");
  const [isEditMode, setIsEditMode] = useState(false);
  const [editLoading, setEditLoading] = useState(false);

  /* ---------- Cedente/Prestatore (Azienda emittente) - caricato da Settings ---------- */
  const [companyData, setCompanyData] = useState(null);

  /* ---------- Configurazione SDI dal VPS (read-only) ---------- */
  const [sdiConfig, setSdiConfig] = useState(null);
  useEffect(() => {
    let mounted = true;
    getSdiConfig().then(c => { if (mounted) setSdiConfig(c); });
    return () => { mounted = false; };
  }, []);

  /* ---------- Trasmissione SdI ---------- */
  const [codiceDest, setCodiceDest] = useState(""); // 7-char o "0000000" se PEC
  const [pecDest, setPecDest] = useState("");
  const [loadingPIVA, setLoadingPIVA] = useState(false);
  const [pivaStatus, setPivaStatus] = useState(null); // { valid: boolean, status: string, error?: string, warning?: string }
  const [showOpenAPIModal, setShowOpenAPIModal] = useState(false);
  const [openAPIData, setOpenAPIData] = useState(null);

  /* ---------- Cessionario/Committente ---------- */
  const [customerName, setCustomerName] = useState("");
  const [customerSurname, setCustomerSurname] = useState("");
  const [customerVat, setCustomerVat] = useState("");
  const [customerTax, setCustomerTax] = useState("");
  const [customerBirthDate, setCustomerBirthDate] = useState("");
  const [customerGender, setCustomerGender] = useState("M");
  const [customerBirthPlace, setCustomerBirthPlace] = useState(""); // nome comune
  const [customerBirthPlaceCode, setCustomerBirthPlaceCode] = useState(""); // codice catastale
  const [isCompany, setIsCompany] = useState(true); // persona giuridica o fisica
  const [custStreet, setCustStreet] = useState("");
  const [custZip, setCustZip] = useState("");
  const [custCity, setCustCity] = useState("");
  const [custProv, setCustProv] = useState("");
  const [custCountry, setCustCountry] = useState("IT");

  /* ---------- Documento ---------- */
  const [tipoDoc, setTipoDoc] = useState("TD01");
  const [number, setNumber] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [currency, setCurrency] = useState("EUR");

  /* ---------- Righe ---------- */
  const [rows, setRows] = useState([{ ...EMPTY_ROW }]);

  /* ---------- Riepilogo IVA ---------- */
  const [riepAliq, setRiepAliq] = useState(22);
  const [riepNatura, setRiepNatura] = useState(""); // es. N1..N7 se serve, altrimenti vuoto
  const [riepEsig, setRiepEsig] = useState("I");

  /* ---------- Pagamento ---------- */
  const [condPag, setCondPag] = useState("TP02"); // TP01=pagamento a rate, TP02=completo, TP03=anticipo
  const [modPag, setModPag] = useState("MP05");
  const [iban, setIban] = useState("");
  const [beneficiario, setBeneficiario] = useState("");
  const [scadenza, setScadenza] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30); // default: 30 giorni
    return d.toISOString().slice(0, 10);
  });

  /* ---------- Note ---------- */
  const [note, setNote] = useState(""); // Note esterne (visibili su PDF/SDI)
  const [noteInternal, setNoteInternal] = useState(""); // Note interne (non visibili su PDF/SDI)

  /* ---------- Sconti e Abbuoni ---------- */
  const [discountType, setDiscountType] = useState("none"); // 'none', 'percentage', 'fixed'
  const [discountValue, setDiscountValue] = useState(0); // Valore sconto (percentuale o importo fisso)

  /* ---------- Bollo Virtuale (Art. 6 DM 17/06/2014) ---------- */
  const [bolloVirtuale, setBolloVirtuale] = useState(false);
  const [bolloImporto, setBolloImporto] = useState(2.00);

  /* ---------- Ritenuta d'Acconto (Art. 25 DPR 600/1973) ---------- */
  const [ritenutaTipo, setRitenutaTipo] = useState("");
  const [ritenutaAliquota, setRitenutaAliquota] = useState(20);
  const [ritenutaCausale, setRitenutaCausale] = useState("A");

  /* ---------- Cassa Previdenziale (Art. 1 L. 335/1995) ---------- */
  const [cassaTipo, setCassaTipo] = useState("");
  const [cassaAliquota, setCassaAliquota] = useState(4);
  const [cassaAliquotaIva, setCassaAliquotaIva] = useState(22);

  /* ---------- Nota Credito/Debito ---------- */
  const [originalInvoiceId, setOriginalInvoiceId] = useState(null); // ID fattura originale per TD04/TD05
  const [originalInvoice, setOriginalInvoice] = useState(null); // Dati fattura originale
  const [showOriginalInvoiceSearch, setShowOriginalInvoiceSearch] = useState(false);
  const [originalInvoiceSearchTerm, setOriginalInvoiceSearchTerm] = useState("");
  const [originalInvoiceResults, setOriginalInvoiceResults] = useState([]);

  /* ---------- Stato UI ---------- */
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState([]);
  const hasPrefilledNumber = useRef(false);
  const [calculatingCF, setCalculatingCF] = useState(false);

  /* ---------- Popup post-salvataggio: stato incasso ---------- */
  const [showPaymentPopup, setShowPaymentPopup] = useState(false);
  const [savedInvoiceId, setSavedInvoiceId] = useState(null);
  const [paymentChoice, setPaymentChoice] = useState("pending"); // pending | paid
  const [paymentMethod, setPaymentMethod] = useState(""); // MP01, MP05, etc.
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [paymentNote, setPaymentNote] = useState("");
  const [savingPayment, setSavingPayment] = useState(false);
  
  /* Auto-completamento */
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);
  const [birthPlaceSuggestions, setBirthPlaceSuggestions] = useState([]);
  const [showBirthPlaceSuggestions, setShowBirthPlaceSuggestions] = useState(false);

  /* Indirizzo cliente: collassabile quando già compilato */
  const [showClientAddress, setShowClientAddress] = useState(false);

  /* Modali per ricerca rapida */
  const [showClientSearch, setShowClientSearch] = useState(false);
  const [clientSearchTerm, setClientSearchTerm] = useState("");
  const [clientResults, setClientResults] = useState([]);

  /* Selettore cliente inline (top della sezione Cessionario) */
  const [inlineClientQuery, setInlineClientQuery] = useState("");
  const [inlineClientResults, setInlineClientResults] = useState([]);
  const [inlineClientOpen, setInlineClientOpen] = useState(false);
  const [inlineClientLoading, setInlineClientLoading] = useState(false);
  const [editClientForm, setEditClientForm] = useState(false); // mostra form manuale
  const inlineDebounceRef = useRef(null);

  const inlineClientSearch = useCallback(async (term) => {
    if (!orgId) { setInlineClientResults([]); return; }
    setInlineClientLoading(true);
    try {
      let q = supabase
        .from("clients")
        .select("id, codice, nome, surname, piva, vat, tax_code, indirizzo, address, codice_destinatario, pec, city, zip, province, country, email, phone, is_company, birth_date, birth_place, birth_province, gender")
        .eq("org_id", orgId)
        .order("nome", { ascending: true })
        .limit(8);
      if (term?.trim()) {
        const safe = term.replace(/[%_]/g, c => "\\" + c);
        q = q.or(`codice.ilike.%${safe}%,nome.ilike.%${safe}%,surname.ilike.%${safe}%,piva.ilike.%${safe}%,vat.ilike.%${safe}%,tax_code.ilike.%${safe}%,email.ilike.%${safe}%`);
      }
      const { data } = await q;
      setInlineClientResults(data || []);
    } finally {
      setInlineClientLoading(false);
    }
  }, [orgId, supabase]);

  const handleInlineClientChange = (val) => {
    setInlineClientQuery(val);
    setInlineClientOpen(true);
    clearTimeout(inlineDebounceRef.current);
    inlineDebounceRef.current = setTimeout(() => inlineClientSearch(val), 200);
  };

  const clearCustomerData = () => {
    setCustomerName("");
    setCustomerSurname("");
    setCustomerVat("");
    setCustomerTax("");
    setCustomerBirthDate("");
    setCustomerGender("M");
    setCustomerBirthPlace("");
    setCustStreet("");
    setCustZip("");
    setCustCity("");
    setCustProv("");
    setCustCountry("IT");
    setIsCompany(true);
    setCodiceDest("");
    setPecDest("");
    setEditClientForm(false);
    setInlineClientQuery("");
  };
  const [showPresetSearch, setShowPresetSearch] = useState(false);
  const [presetSearchTerm, setPresetSearchTerm] = useState("");
  const [presetResults, setPresetResults] = useState([]);
  const [allPresets, setAllPresets] = useState([]); // tutti i preset caricati
  const [descrSuggRow, setDescrSuggRow] = useState(null); // indice riga con suggerimenti aperti
  const [descrSuggestions, setDescrSuggestions] = useState([]); // suggerimenti filtrati

  /* ---------- Totali (con sconti) ---------- */
  const totals = useMemo(() => {
    // Calcola importo per ogni riga considerando sconto di riga
    let imponibile = rows.reduce((s, r) => {
      let itemTotal = asNum(r.qty) * asNum(r.price);
      // Applica sconto di riga se presente
      const sconto = r.sconto || r.discount;
      if (sconto) {
        if (sconto.percentuale !== undefined && sconto.percentuale !== null) {
          const scontoImporto = (itemTotal * Number(sconto.percentuale)) / 100;
          itemTotal -= scontoImporto; // Sconto percentuale
        } else if (sconto.importo !== undefined && sconto.importo !== null) {
          itemTotal -= Number(sconto.importo); // Sconto importo fisso
        }
      }
      return s + itemTotal;
    }, 0);
    
    let iva = rows.reduce((s, r) => {
      let itemTotal = asNum(r.qty) * asNum(r.price);
      // Applica sconto di riga se presente
      const sconto = r.sconto || r.discount;
      if (sconto) {
        if (sconto.percentuale !== undefined && sconto.percentuale !== null) {
          const scontoImporto = (itemTotal * Number(sconto.percentuale)) / 100;
          itemTotal -= scontoImporto; // Sconto percentuale
        } else if (sconto.importo !== undefined && sconto.importo !== null) {
          itemTotal -= Number(sconto.importo); // Sconto importo fisso
        }
      }
      return s + itemTotal * (asNum(r.vat_perc) / 100);
    }, 0);
    
    let totale = imponibile + iva;
    
    // Applica sconto globale se presente (oltre agli sconti di riga)
    if (discountType !== "none" && discountValue > 0) {
      if (discountType === "percentage") {
        totale -= (totale * discountValue) / 100;
      } else {
        totale -= discountValue;
      }
      totale = Math.max(0, totale); // Non può essere negativo
    }
    
    return { imponibile, iva, totale };
  }, [rows, discountType, discountValue]);

  /* ---------- Rows helpers ---------- */
  const addRow = () => setRows((prev) => [...prev, { ...EMPTY_ROW }]);
  const patchRow = (i, p) => setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...p } : r)));
  const removeRow = (i) => setRows((prev) => prev.filter((_, idx) => idx !== i));

  /* Shortcut: Ctrl/Cmd+S = salva, F3 = cerca cliente, F2 = preset righe */
  useEffect(() => {
    const onKey = (e) => {
      // Salva
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        void save();
      }
      // Cerca cliente (F3)
      if (e.key === "F3") {
        e.preventDefault();
        setShowClientSearch(true);
      }
      // Preset righe (F2)
      if (e.key === "F2") {
        e.preventDefault();
        setShowPresetSearch(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  /* Carica dati azienda da Settings */
  const loadCompanyData = async () => {
    if (!orgId) return;
    try {
      const { data, error } = await supabase
        .from("org_settings")
        .select("value")
        .eq("org_id", orgId)
        .eq("key", "company")
        .maybeSingle();

      if (!error && data?.value) {
        // Normalizza schema: address può essere stringa (vecchio) o oggetto
        // {street, civico, city, zip, province, country} (nuovo).
        // Esponi anche alias camelCase per compatibilità con codice legacy
        // (es. companyData.name, companyData.taxCode, companyData.regimeFiscale).
        const v = data.value;
        const addr = v.address;
        let normalized;
        if (addr && typeof addr === "object") {
          const street = [addr.street, addr.civico].filter(Boolean).join(" ").trim();
          normalized = {
            ...v,
            address: street || null,
            address_full: addr,
            zip: v.zip || addr.zip || null,
            city: v.city || addr.city || null,
            province: v.province || addr.province || null,
            country: v.country || addr.country || "IT",
          };
        } else {
          normalized = { ...v };
        }
        // Alias camelCase su snake_case
        normalized.name = normalized.company_name || normalized.name || null;
        normalized.taxCode = normalized.tax_code || normalized.taxCode || null;
        normalized.regimeFiscale = normalized.regime_fiscale || normalized.regimeFiscale || "RF01";
        setCompanyData(normalized);
      }
    } catch (e) {
      console.error("Errore caricamento dati azienda:", e);
    }
  };

  useEffect(() => {
    loadCompanyData();
  }, [orgId, supabase]);

  // Ricarica dati quando si torna dalla pagina Settings
  useEffect(() => {
    const handleFocus = () => {
      // Ricarica dati quando la finestra torna in focus (utente tornato da Settings)
      if (document.visibilityState === 'visible') {
        loadCompanyData();
      }
    };
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);
    
    // Ricarica anche quando si torna dalla pagina Settings (URL change)
    const handlePopState = () => {
      loadCompanyData();
    };
    window.addEventListener('popstate', handlePopState);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [orgId]);

  /* Autonumerazione: proponi numero progressivo se il campo è vuoto (solo per nuove fatture) */
  useEffect(() => {
    if (!orgId || hasPrefilledNumber.current || editId) return;
    (async () => {
      try {
        const { data, error } = await supabase.rpc("rpc_invoice_next_number", { p_org_id: orgId });
        if (!error && data && !number) {
          const year = new Date().getFullYear();
          setNumber(`${data}/${year}`);
          hasPrefilledNumber.current = true;
        }
      } catch {}
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId]);

  /* ---------- Caricamento fattura esistente per modifica ---------- */
  useEffect(() => {
    if (editId && orgId) {
      loadExistingInvoice(editId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId, orgId]);

  async function loadExistingInvoice(invoiceId) {
    setEditLoading(true);
    try {
      const { data: inv, error: e1 } = await supabase
        .from("invoices")
        .select("*")
        .eq("id", invoiceId)
        .single();
      if (e1) throw e1;

      // Solo bozze e rifiutate sono modificabili
      if (inv.sdi_status !== "draft" && inv.sdi_status !== "rejected") {
        setErrors(["Solo le fatture in bozza o rifiutate possono essere modificate."]);
        setEditLoading(false);
        return;
      }

      const { data: itemsData, error: e2 } = await supabase
        .from("invoice_items")
        .select("*")
        .eq("invoice_id", invoiceId)
        .order("id", { ascending: true });
      if (e2) throw e2;

      // Popola tutti i campi del form
      setIsEditMode(true);
      hasPrefilledNumber.current = true;

      // Documento
      setNumber(inv.number || "");
      setDate(inv.date || new Date().toISOString().slice(0, 10));
      setCurrency(inv.currency || "EUR");
      setTipoDoc(inv.meta?.sdi?.documento?.tipo_documento || "TD01");

      // Cliente
      const custName = inv.customer_name || "";
      const nameParts = custName.split(" ");
      const isComp = !!inv.customer_vat;
      setIsCompany(isComp);
      if (isComp) {
        setCustomerName(custName);
      } else {
        setCustomerName(nameParts[0] || "");
        setCustomerSurname(nameParts.slice(1).join(" ") || "");
      }
      setCustomerVat(inv.customer_vat || "");
      setCustomerTax(inv.customer_tax_code || "");

      // Indirizzo cliente (supporta sia chiavi nuove street/zip/city che vecchie via/cap/comune)
      const addr = inv.customer_address || inv.meta?.cessionario?.address || {};
      const sdiCliente = inv.meta?.sdi?.cliente || {};
      setCustStreet(addr.street || addr.via || sdiCliente.indirizzo || "");
      setCustZip(addr.zip || addr.cap || sdiCliente.cap || "");
      setCustCity(addr.city || addr.comune || sdiCliente.comune || "");
      setCustProv(addr.province || addr.provincia || sdiCliente.provincia || "");
      setCustCountry(addr.country || addr.nazione || sdiCliente.nazione || "IT");

      // Dati nascita cliente (da meta.sdi.cliente)
      setCustomerBirthDate(sdiCliente.data_nascita || "");
      setCustomerBirthPlace(sdiCliente.comune_nascita || "");
      setCustomerGender(sdiCliente.sesso || "M");

      // Trasmissione SDI
      const trasm = inv.meta?.sdi?.trasmissione || {};
      setCodiceDest(trasm.codice_destinatario || "");
      setPecDest(trasm.pec_destinatario || "");

      // Riepilogo IVA
      const riep = inv.meta?.sdi?.riepilogo_iva?.[0] || {};
      setRiepAliq(riep.aliquota ?? 22);
      setRiepNatura(riep.natura || "");
      setRiepEsig(riep.esigibilita || "I");

      // Pagamento
      const pag = inv.meta?.sdi?.pagamento || {};
      setCondPag(pag.condizioni || "TP02");
      setModPag(pag.modalita || "MP05");
      setIban(pag.iban || "");
      setBeneficiario(pag.beneficiario || "");
      setScadenza(pag.scadenza || "");

      // Note
      setNote(inv.meta?.sdi?.note || "");
      setNoteInternal(inv.note_internal || "");

      // Sconti
      setDiscountType(inv.discount_type || "none");
      setDiscountValue(inv.discount_value || 0);

      // Bollo
      setBolloVirtuale(inv.bollo_virtuale || false);
      setBolloImporto(inv.bollo_importo || 2.00);

      // Ritenuta
      setRitenutaTipo(inv.ritenuta_tipo || "");
      setRitenutaAliquota(inv.ritenuta_aliquota || 20);
      setRitenutaCausale(inv.ritenuta_causale || "A");

      // Cassa
      setCassaTipo(inv.cassa_tipo || "");
      setCassaAliquota(inv.cassa_aliquota || 4);
      setCassaAliquotaIva(inv.cassa_aliquota_iva || 22);

      // Nota credito/debito
      setOriginalInvoiceId(inv.original_invoice_id || null);

      // Righe
      if (itemsData?.length) {
        setRows(itemsData.map(r => ({
          descr: r.item_code || r.descr || "",
          item_description: r.item_description || "",
          qty: r.qty || 1,
          price: r.price || 0,
          vat_perc: r.vat_perc || 0,
          unit: r.unit || "PZ",
          sconto: r.discount_type === "percent"
            ? { tipo: "SC", percentuale: r.discount_value }
            : r.discount_type === "amount"
              ? { tipo: "SC", importo: r.discount_value }
              : null,
        })));
      }
    } catch (e) {
      console.error("Errore caricamento fattura per modifica:", e);
      setErrors([`Impossibile caricare la fattura: ${e?.message || "Errore sconosciuto"}`]);
    } finally {
      setEditLoading(false);
    }
  }

  async function getNextNumberOnFocus() {
    if (!orgId || number?.trim()) return;
    try {
      const { data } = await supabase.rpc("rpc_invoice_next_number", { p_org_id: orgId });
      if (data) { const year = new Date().getFullYear(); setNumber(`${data}/${year}`); }
    } catch {}
  }

  /* Auto-rilevamento persona fisica/giuridica */
  useEffect(() => {
    const hasVat = customerVat?.trim().length > 0;
    setIsCompany(hasVat);
  }, [customerVat]);

  /* Calcolo automatico codice fiscale */
  async function handleCalcolaCF() {
    try {
      setCalculatingCF(true);
      setErrors([]);

      if (!customerName || !customerSurname || !customerBirthDate || !customerGender || !customerBirthPlaceCode) {
        setErrors(["Compila Nome, Cognome, Data di nascita, Sesso e Comune di nascita per calcolare il CF"]);
        return;
      }

      const cf = calcolaCodiceFiscale({
        surname: customerSurname,
        name: customerName,
        birthDate: customerBirthDate,
        birthPlace: customerBirthPlaceCode, // usa il codice catastale
        gender: customerGender,
      });

      setCustomerTax(cf);
    } catch (e) {
      setErrors([String(e?.message || "Errore calcolo codice fiscale")]);
    } finally {
      setCalculatingCF(false);
    }
  }

  /* Auto-completamento indirizzo */
  async function handleStreetChange(street) {
    setCustStreet(street);
    
    if (street.length >= 3) {
      const results = await searchAddress(street);
      setAddressSuggestions(results);
      setShowAddressSuggestions(results.length > 0);
    } else {
      setAddressSuggestions([]);
      setShowAddressSuggestions(false);
    }
  }

  /* Applica dati selezionati dal modal Agenzia delle Entrate */
  function handleApplyOpenAPIData(fieldsToApply) {
    if (fieldsToApply.name && !customerName) {
      setCustomerName(fieldsToApply.name);
    }
    if (fieldsToApply.taxCode && !customerTax) {
      setCustomerTax(fieldsToApply.taxCode);
    }
    if (fieldsToApply.street && !custStreet) {
      setCustStreet(fieldsToApply.street);
    }
    if (fieldsToApply.zip && !custZip) {
      setCustZip(fieldsToApply.zip);
    }
    if (fieldsToApply.city && !custCity) {
      setCustCity(fieldsToApply.city);
    }
    if (fieldsToApply.province && !custProv) {
      setCustProv(fieldsToApply.province);
    }
    if (fieldsToApply.codiceDestinatario && !codiceDest) {
      setCodiceDest(fieldsToApply.codiceDestinatario);
    }
    if (fieldsToApply.pec && !pecDest) {
      setPecDest(fieldsToApply.pec);
    }
  }

  /* Verifica P.IVA e auto-compila dati da Agenzia delle Entrate */
  async function handleVatChange(vat) {
    setCustomerVat(vat);
    setPivaStatus(null);
    
    // Normalizza P.IVA (rimuovi spazi e prefisso IT)
    const cleanVat = String(vat).trim().replace(/\s+/g, '').replace(/^IT/i, '');
    
    // Verifica se la P.IVA è completa (11 caratteri per IT)
    if (cleanVat.length === 11 && /^\d{11}$/.test(cleanVat)) {
      setLoadingPIVA(true);
      
      try {
        // 1. PRIMA: Verifica se cliente esiste già nel database
        const supabase = supabaseBrowser();
        const { data: existingClient } = await supabase
          .from('clients')
          .select('*')
          .eq('vat', cleanVat)
          .eq('org_id', orgId)
          .maybeSingle();
        
        if (existingClient) {
          // Usa dati cliente esistente (NON chiamare API - RISPARMIO COSTI!)
          console.log('[InvoiceNew] Cliente esistente trovato, uso dati database');
          setCustomerName(existingClient.name || '');
          setCustomerTax(existingClient.tax_code || '');
          setCustStreet(existingClient.street || '');
          setCustZip(existingClient.zip || '');
          setCustCity(existingClient.city || '');
          setCustProv(existingClient.province || '');
          setCodiceDest(existingClient.codice_destinatario || '');
          setPecDest(existingClient.pec || '');
          setPivaStatus({ valid: true, message: 'Cliente esistente' });
          setLoadingPIVA(false);
          return;
        }
        
        // 2. SOLO se cliente non esiste, chiama Agenzia delle Entrate (con cache automatica)
        const companyData = await autoFillFromPIVA(cleanVat);
        
        console.log('[InvoiceNew] Dati azienda ricevuti:', companyData);
        
        if (companyData) {
          console.log('[InvoiceNew] companyData.active:', companyData.active);
          console.log('[InvoiceNew] companyData.status:', companyData.status);
          // Salva i dati e mostra modal per selezione campi
          setOpenAPIData(companyData);
          setShowOpenAPIModal(true);
          
          // Mostra status P.IVA
          if (!companyData.active) {
            const statusUpper = (companyData.status || 'unknown').toUpperCase();
            setPivaStatus({
              valid: true,
              status: companyData.status || 'unknown',
              warning: `Azienda ${statusUpper === 'SUSPENDED' ? 'sospesa' : statusUpper === 'CEASED' ? 'cessata' : 'non attiva'}`
            });
          } else {
            setPivaStatus({
              valid: true,
              status: 'active'
            });
          }
        } else {
          setPivaStatus({
            valid: false,
            error: 'P.IVA non trovata nel database'
          });
        }
      } catch (error) {
        console.error('[InvoiceNew] Errore verifica P.IVA:', error);
        setPivaStatus({
          valid: false,
          error: 'Errore durante la verifica P.IVA'
        });
      } finally {
        setLoadingPIVA(false);
      }
    } else if (cleanVat.length > 0 && cleanVat.length < 11) {
      // P.IVA incompleta, reset status
      setPivaStatus(null);
    }
  }

  async function selectAddress(suggestion) {
    try {
      // Use Google Maps detailed address resolution if available
      const details = await selectAddressWithDetails(suggestion);
      
      setCustStreet(details.street || suggestion.displayName);
      setCustZip(details.zip || '');
      setCustCity(details.city || '');
      setCustProv(details.provinceCode || '');
      
      setShowAddressSuggestions(false);
      setAddressSuggestions([]);
    } catch (error) {
      // Fallback to basic address data
      const fullAddress = suggestion.houseNumber 
        ? `${suggestion.street} ${suggestion.houseNumber}`
        : suggestion.street;
      
      setCustStreet(fullAddress || suggestion.displayName);
      setCustZip(suggestion.postcode || '');
      setCustCity(suggestion.city || '');
      setCustProv(suggestion.provinceCode || '');
      
      setShowAddressSuggestions(false);
      setAddressSuggestions([]);
    }
  }

  /* Auto-completamento comune di nascita */
  async function handleBirthPlaceChange(value) {
    setCustomerBirthPlace(value);
    
    if (value.length >= 2) {
      const results = await searchComuni(value);
      setBirthPlaceSuggestions(results);
      setShowBirthPlaceSuggestions(results.length > 0);
    } else {
      setBirthPlaceSuggestions([]);
      setShowBirthPlaceSuggestions(false);
    }
  }

  function selectBirthPlace(suggestion) {
    setCustomerBirthPlace(suggestion.nome);
    setCustomerBirthPlaceCode(suggestion.codiceCatastale);
    
    setShowBirthPlaceSuggestions(false);
    setBirthPlaceSuggestions([]);
  }

  /* Quando l'utente esce dal campo comune, cerca il codice catastale */
  async function handleBirthPlaceBlur() {
    // Delay per permettere il click sui suggerimenti
    setTimeout(async () => {
      if (customerBirthPlace && !customerBirthPlaceCode) {
        const comune = await getComuneByName(customerBirthPlace);
        if (comune) {
          setCustomerBirthPlaceCode(comune.codiceCatastale);
        }
      }
      setShowBirthPlaceSuggestions(false);
    }, 200);
  }

  /* Ricerca clienti — supporta nome, cognome, P.IVA, CF, email, codice cliente */
  async function searchClients(term) {
    if (!orgId) {
      setClientResults([]);
      return;
    }
    try {
      let query = supabase
        .from("clients")
        .select("id, codice, nome, surname, piva, vat, tax_code, indirizzo, address, codice_destinatario, pec, city, zip, province, country, email, phone, birth_date, birth_place, birth_province, gender, is_company")
        .eq("org_id", orgId)
        .order("created_at", { ascending: false })
        .limit(15);

      if (term?.trim()) {
        const safe = term.replace(/[%_]/g, c => "\\" + c);
        query = query.or(`codice.ilike.%${safe}%,nome.ilike.%${safe}%,surname.ilike.%${safe}%,piva.ilike.%${safe}%,vat.ilike.%${safe}%,tax_code.ilike.%${safe}%,email.ilike.%${safe}%`);
      }

      const { data, error } = await query;
      if (!error && data) {
        setClientResults(data);
      }
    } catch (e) {
      console.error("Errore ricerca clienti:", e);
    }
  }

  /* Carica dati cliente selezionato */
  function loadClient(client) {
    setCustomerName(client.nome || "");
    setCustomerSurname(client.surname || "");
    setCustomerVat(client.piva || "");
    setCustomerTax(client.tax_code || client.codice_fiscale || "");
    setCustomerBirthDate(client.birth_date || "");
    setCustomerGender(client.gender || "M");
    setCustomerBirthPlace(client.birth_place || "");
    setCustStreet(client.address || client.indirizzo || "");
    setCustZip(client.zip || "");
    setCustCity(client.city || "");
    setCustProv(client.province || client.birth_province || "");
    setCustCountry(client.country || "IT");
    setIsCompany(client.is_company ?? true);
    // Carica campi SDI dal cliente
    setCodiceDest(client.codice_destinatario || "");
    setPecDest(client.pec || "");
    setShowClientSearch(false);
  }

  /* Ricerca preset */
  /* Ricerca fatture originali per nota credito/debito */
  async function searchOriginalInvoices(term) {
    if (!orgId) {
      setOriginalInvoiceResults([]);
      return;
    }

    try {
      let query = supabase
        .from("invoices")
        .select("id, number, date, customer_name, total")
        .eq("org_id", orgId)
        .neq("sdi_status", "rejected") // Escludi fatture rifiutate
        .order("date", { ascending: false })
        .limit(10);

      if (term?.trim()) {
        query = query.or(`number.ilike.%${term}%,customer_name.ilike.%${term}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setOriginalInvoiceResults(data || []);
    } catch (e) {
      console.error("Errore ricerca fatture:", e);
      setOriginalInvoiceResults([]);
    }
  }

  function selectOriginalInvoice(invoice) {
    setOriginalInvoice(invoice);
    setOriginalInvoiceId(invoice.id);
    setShowOriginalInvoiceSearch(false);
    setOriginalInvoiceSearchTerm("");
    setOriginalInvoiceResults([]);

    // Precompila dati cliente da fattura originale (opzionale)
    if (invoice.customer_name) {
      // Se il nome contiene uno spazio, potrebbe essere nome+cognome
      const nameParts = invoice.customer_name.trim().split(/\s+/);
      if (nameParts.length >= 2) {
        setCustomerName(nameParts[0]);
        setCustomerSurname(nameParts.slice(1).join(" "));
        setIsCompany(false);
      } else {
        setCustomerName(invoice.customer_name);
        setIsCompany(true);
      }
    }
  }

  // Auto-search fatture originali quando si apre la modale
  useEffect(() => {
    if (showOriginalInvoiceSearch) {
      if (originalInvoiceSearchTerm.trim()) {
        searchOriginalInvoices(originalInvoiceSearchTerm);
      } else {
        // Se il campo è vuoto, mostra le ultime fatture
        searchOriginalInvoices("");
      }
    }
  }, [showOriginalInvoiceSearch, originalInvoiceSearchTerm, orgId]);

  /* Genera un codice articolo breve da una descrizione (fallback se preset non lo ha) */
  function presetCodeFromDescription(desc) {
    if (!desc) return "ART";
    const words = String(desc)
      .toUpperCase()
      .replace(/[^A-Z0-9 ]/g, "")
      .split(/\s+/)
      .filter(w => w.length >= 2);
    if (words.length === 0) return "ART";
    const code = words.slice(0, 3).map(w => w.slice(0, 3)).join("");
    return code.slice(0, 12) || "ART";
  }

  async function loadAllPresets() {
    const combined = [];
    // 1. Carica da tabella quote_presets (DB)
    if (orgId) {
      try {
        const { data } = await supabase
          .from("quote_presets")
          .select("*")
          .eq("org_id", orgId)
          .order("ord", { ascending: true })
          .limit(100);
        if (data) {
          data.forEach(p => combined.push({
            code: p.code || p.codice || presetCodeFromDescription(p.description),
            description: p.description,
            price: p.price || 0,
            qty: p.qty || 1,
            vat_perc: p.vat_perc || 22,
            unit: p.unit || 'PZ',
          }));
        }
      } catch (e) {
        console.error("Errore caricamento preset DB:", e);
      }
    }
    // 2. Carica da localStorage (Settings)
    try {
      const saved = localStorage.getItem('rm-settings');
      if (saved) {
        const settings = JSON.parse(saved);
        const localPresets = settings?.invoices?.presets || [];
        localPresets.forEach(p => {
          if (!combined.find(c => c.description === p.description)) {
            combined.push({
              code: p.code || p.codice || presetCodeFromDescription(p.description),
              description: p.description,
              price: p.unitPrice || 0,
              qty: p.quantity || 1,
              vat_perc: p.vatRate || 22,
              unit: p.unit || 'PZ',
            });
          }
        });
      }
    } catch (e) {
      console.error("Errore caricamento preset localStorage:", e);
    }
    setAllPresets(combined);
    return combined;
  }

  async function searchPresets(term) {
    const all = allPresets.length > 0 ? allPresets : await loadAllPresets();
    if (term?.trim()) {
      setPresetResults(all.filter(p => p.description.toLowerCase().includes(term.toLowerCase())));
    } else {
      setPresetResults(all);
    }
  }

  function handleDescrChange(i, value) {
    patchRow(i, { item_description: value });
    if (value.length >= 2 && allPresets.length > 0) {
      const filtered = allPresets.filter(p =>
        p.description.toLowerCase().includes(value.toLowerCase())
      );
      setDescrSuggestions(filtered);
      setDescrSuggRow(i);
    } else {
      setDescrSuggestions([]);
      setDescrSuggRow(null);
    }
  }

  function applyDescrPreset(rowIdx, preset) {
    patchRow(rowIdx, {
      descr: preset.code || presetCodeFromDescription(preset.description),
      item_description: preset.description || "",
      price: preset.price || 0,
      qty: preset.qty || 1,
      vat_perc: preset.vat_perc || 22,
      unit: preset.unit || "PZ",
    });
    setDescrSuggRow(null);
    setDescrSuggestions([]);
  }

  /* Aggiungi preset come riga */
  function addPresetAsRow(preset) {
    const newRow = {
      descr: preset.code || presetCodeFromDescription(preset.description),
      item_description: preset.description || "",
      qty: preset.qty || 1,
      price: preset.price || 0,
      vat_perc: preset.vat_perc || 22,
      unit: preset.unit || "PZ",
    };
    setRows((prev) => [...prev, newRow]);
    setShowPresetSearch(false);
  }

  /* Effetto per ricerca clienti */
  useEffect(() => {
    if (showClientSearch) {
      searchClients(clientSearchTerm);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientSearchTerm, showClientSearch]);

  /* Carica tutti i preset all'avvio per autocomplete descrizione */
  useEffect(() => {
    if (orgId) loadAllPresets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId]);

  /* Effetto per ricerca preset */
  useEffect(() => {
    if (showPresetSearch) {
      searchPresets(presetSearchTerm);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presetSearchTerm, showPresetSearch]);

  /* Registrazione automatica cliente */
  async function registerCustomer() {
    if (!customerName.trim()) return null;

    try {
      // Controlla se il cliente esiste già (per P.IVA o CF)
      let existingClient = null;
      if (customerVat?.trim()) {
        const { data } = await supabase
          .from("clients")
          .select("id")
          .eq("org_id", orgId)
          .eq("piva", customerVat.trim())
          .maybeSingle();
        existingClient = data;
      } else if (customerTax?.trim()) {
        const { data } = await supabase
          .from("clients")
          .select("id")
          .eq("org_id", orgId)
          .eq("tax_code", customerTax.trim())
          .maybeSingle();
        existingClient = data;
      }

      if (existingClient) {
        return existingClient.id;
      }

      // Determina codice destinatario: se B2C senza codice/PEC → 0000000
      let finalCodiceDest = codiceDest.trim();
      let finalPecDest = pecDest.trim();
      if (!finalCodiceDest && !finalPecDest) {
        finalCodiceDest = "0000000";
      }

      // Crea nuovo cliente - allineato con campi da invoices
      const clientPayload = {
        org_id: orgId,
        nome: isCompany ? customerName : customerName,
        surname: !isCompany ? customerSurname : null,
        piva: customerVat?.trim() || null,
        tax_code: customerTax?.trim() || null, // Allineato con customer_tax_code
        indirizzo: custStreet || null, // Allineato con customer_address.street
        address: custStreet || null, // Duplicato per compatibilità
        zip: custZip || null, // Allineato con customer_address.zip
        city: custCity || null, // Allineato con customer_address.city
        province: custProv || null, // Allineato con customer_address.province
        country: custCountry || "IT", // Allineato con customer_address.country
        codice_destinatario: finalCodiceDest || null, // Allineato con meta.codice_destinatario
        pec: finalPecDest || null, // Allineato con meta.pec
        is_company: isCompany,
        birth_date: !isCompany && customerBirthDate ? customerBirthDate : null,
        gender: !isCompany ? customerGender : null,
        birth_place: !isCompany && customerBirthPlace ? customerBirthPlace : null,
      };

      const { data: newClient, error } = await supabase
        .from("clients")
        .insert(clientPayload)
        .select("id")
        .single();

      if (error) throw error;
      return newClient.id;
    } catch (e) {
      console.error("Errore registrazione cliente:", e);
      return null;
    }
  }

  /* ---------- Validazioni base ---------- */
  function validate() {
    const errs = [];
    if (!orgId) errs.push("Organizzazione non selezionata.");
    
    // Cedente/Prestatore
    if (!companyData?.name?.trim()) {
      errs.push("Configura i dati azienda nelle Impostazioni (Settings > Azienda).");
    }
    if (!companyData?.vat?.trim()) {
      errs.push("Configura la Partita IVA nelle Impostazioni (Settings > Azienda).");
    }
    
    // Cessionario
    if (!customerName.trim()) errs.push("Cliente obbligatorio.");
    if (!number.trim()) errs.push("Numero documento obbligatorio.");
    if (!date) errs.push("Data documento obbligatoria.");
    if (!rows.length) errs.push("Inserire almeno una riga.");
    
    // Validazione codice destinatario/PEC
    if (codiceDest && codiceDest.length !== 7) {
      errs.push("Il Codice Destinatario deve avere 7 caratteri.");
    }
    
    // Validazione provincia: 2 lettere per IT, "EE" per estero
    if (custCountry === 'IT') {
      if (custProv && custProv.length !== 2) {
        errs.push("La provincia deve avere 2 lettere (es. RM).");
      }
    } else {
      // Per estero, provincia deve essere "EE" o vuota
      if (custProv && custProv !== 'EE' && custProv.length > 0) {
        errs.push("Per clienti esteri, la provincia deve essere 'EE' (Estero).");
      }
    }
    
    // Validazione CAP: 5 cifre per IT, "00000" per estero
    if (custCountry === 'IT') {
      if (custZip && !/^\d{5}$/.test(custZip)) {
        errs.push("CAP non valido (5 cifre).");
      }
    } else {
      // Per estero, CAP deve essere "00000"
      if (custZip !== '00000') {
        errs.push("Per clienti esteri, il CAP deve essere '00000'.");
      }
    }
    setErrors(errs);
    return errs.length === 0;
  }

  async function save() {
    if (!validate()) return;

    try {
      setSaving(true);

      // Registra cliente automaticamente
      const clientId = await registerCustomer();

      // Determina codice destinatario: se B2C senza codice/PEC → 0000000
      let finalCodiceDest = codiceDest.trim();
      let finalPecDest = pecDest.trim();
      
      // Se non hanno né codice né PEC, usiamo 0000000 (standard per B2C)
      if (!finalCodiceDest && !finalPecDest) {
        finalCodiceDest = "0000000";
      }

      // Meta conforme/FatturaPA (minimo necessario per SdI, salvato in jsonb)
      const company_address = {
        street: companyData?.address || null,
        zip: companyData?.zip || companyData?.zipCode || null,
        city: companyData?.city || null,
        province: companyData?.province || null,
        country: companyData?.country || "IT",
      };

      const customer_address = {
        street: custStreet || null,
        zip: custZip || null,
        city: custCity || null,
        province: custProv || null,
        country: custCountry || "IT",
      };

      const envLabel = "PRODUCTION";
      const rawVat = (companyData?.vat || "").replace(/\s+/g, "");
      const normalizedVat = rawVat.replace(/^IT/i, "");
      const cedentePrestatore = {
        id_fiscale_iva: {
          id_paese: "IT",
          id_codice: normalizedVat || "02166430856",
        },
        codice_fiscale: (companyData?.taxCode || "").trim() || null,
        denominazione: (companyData?.name || "").trim(),
        regime_fiscale: companyData?.regimeFiscale || "RF01",
        partita_iva: rawVat || null,
        indirizzo: company_address,
        sede: {
          indirizzo: company_address.street || "",
          cap: company_address.zip || "",
          comune: company_address.city || "",
          provincia: company_address.province || "",
          nazione: company_address.country || "IT",
        },
      };

      const meta = {
        sdi_environment: envLabel,
        sdi: {
          progressivo_invio: number || "00001",
          cedente_prestatore: cedentePrestatore,
          trasmissione: {
            codice_destinatario: finalCodiceDest || "0000000",
            pec_destinatario: finalPecDest || null,
            ambiente: envLabel,
          },
          documento: {
            tipo_documento: tipoDoc,
            valuta: currency || "EUR",
          },
          riepilogo_iva: [
            {
              aliquota: asNum(riepAliq),
              natura: riepNatura || null,
              esigibilita: riepEsig,
            },
          ],
          pagamento: {
            condizioni: condPag,
            modalita: modPag,
            scadenza: scadenza || null,
            iban: iban || null,
            beneficiario: beneficiario || null,
          },
          bollo_virtuale: bolloVirtuale || false,
          bollo_importo: bolloVirtuale ? bolloImporto : null,
          ritenuta: ritenutaTipo ? {
            tipo: ritenutaTipo,
            aliquota: ritenutaAliquota,
            importo: Math.round(totals.imponibile * (ritenutaAliquota / 100) * 100) / 100,
            causale: ritenutaCausale,
          } : null,
          cassa: cassaTipo ? {
            tipo: cassaTipo,
            aliquota: cassaAliquota,
            importo: Math.round(totals.imponibile * (cassaAliquota / 100) * 100) / 100,
            imponibile: totals.imponibile,
            aliquota_iva: cassaAliquotaIva,
          } : null,
          note: note || null,
          // Dati per nota credito/debito (per XML)
          original_invoice: originalInvoice ? {
            number: originalInvoice.number,
            date: originalInvoice.date,
          } : null,
        },
        cliente: {
          denominazione: isCompany
            ? customerName
            : `${customerName} ${customerSurname}`.trim(),
          codice_fiscale: customerTax || null,
          partita_iva: customerVat || null,
          data_nascita: !isCompany ? customerBirthDate || null : null,
          comune_nascita: !isCompany ? customerBirthPlace || null : null,
          sesso: !isCompany ? customerGender || null : null,
          indirizzo: custStreet || null,
          cap: custZip || null,
          comune: custCity || null,
          provincia: custProv || null,
          nazione: custCountry || "IT",
          codice_destinatario: finalCodiceDest || "0000000",
          pec: finalPecDest || null,
        },
        cessionario: {
          denominazione: isCompany
            ? customerName
            : `${customerName} ${customerSurname}`.trim(),
          codice_destinatario: finalCodiceDest || "0000000",
          pec: finalPecDest || null,
          address: customer_address,
          indirizzo: customer_address,
        },
      };

      // 1) crea intestazione fattura
      const invoicePayload = {
        org_id: orgId,
        customer_name: isCompany ? customerName : `${customerName} ${customerSurname}`.trim(),
        customer_vat: customerVat || null,
        customer_tax_code: customerTax || null,
        customer_address, // jsonb
        number: number || null,
        date,
        currency: currency || "EUR",
        total: totals.totale,
        provider_id: "sdi_prod",
        sdi_status: "draft",
        meta: {
          ...meta,
          // Aggiungi dati nota credito/debito al meta
          original_invoice: originalInvoice ? {
            number: originalInvoice.number,
            date: originalInvoice.date,
          } : null,
        },
        // Nuovi campi funzionalità avanzate (ora nelle colonne del database)
        original_invoice_id: originalInvoiceId || null,
        discount_type: discountType || "none",
        discount_value: discountValue || 0,
        note_internal: noteInternal || null,
        // Bollo virtuale
        bollo_virtuale: bolloVirtuale || false,
        bollo_importo: bolloVirtuale ? bolloImporto : 0,
        // Ritenuta d'acconto
        ritenuta_tipo: ritenutaTipo || null,
        ritenuta_aliquota: ritenutaTipo ? ritenutaAliquota : null,
        ritenuta_importo: ritenutaTipo ? Math.round(totals.imponibile * (ritenutaAliquota / 100) * 100) / 100 : null,
        ritenuta_causale: ritenutaTipo ? ritenutaCausale : null,
        // Cassa previdenziale
        cassa_tipo: cassaTipo || null,
        cassa_aliquota: cassaTipo ? cassaAliquota : null,
        cassa_importo: cassaTipo ? Math.round(totals.imponibile * (cassaAliquota / 100) * 100) / 100 : null,
        cassa_imponibile: cassaTipo ? totals.imponibile : null,
        cassa_aliquota_iva: cassaTipo ? cassaAliquotaIva : null,
        // payment_status omesso - usa il default del database ('pending')
      };

      // Valida nota credito/debito: se TD04/TD05, original_invoice_id è obbligatorio
      if ((tipoDoc === "TD04" || tipoDoc === "TD05") && !originalInvoiceId) {
        throw new Error(`Per ${tipoDoc === "TD04" ? "nota di credito" : "nota di debito"} (${tipoDoc}) è obbligatorio selezionare la fattura originale.`);
      }

      // Helper: costruisci payload righe
      function buildItemsPayload(invoiceId) {
        return rows.map((r) => {
          const sconto = r.sconto || r.discount || null;
          let rowDiscType = null;
          let rowDiscValue = 0;
          let rowDiscDesc = null;
          
          if (sconto) {
            if (sconto.percentuale !== undefined && sconto.percentuale !== null) {
              rowDiscType = 'percent';
              rowDiscValue = asNum(sconto.percentuale);
              rowDiscDesc = `Sconto ${rowDiscValue}%`;
            } else if (sconto.importo !== undefined && sconto.importo !== null) {
              rowDiscType = 'amount';
              rowDiscValue = asNum(sconto.importo);
              rowDiscDesc = `Sconto ${EUR(rowDiscValue)}`;
            }
          }
          
          return {
            invoice_id: invoiceId,
            item_code: String(r.descr || "").trim() || "Riga",
            item_description: String(r.item_description || "").trim() || null,
            qty: asNum(r.qty) || 1,
            price: asNum(r.price) || 0,
            vat_perc: asNum(r.vat_perc) || 0,
            discount_type: rowDiscType,
            discount_value: rowDiscValue,
            discount_description: rowDiscDesc,
          };
        });
      }

      if (isEditMode && editId) {
        // ── MODALITÀ MODIFICA ──
        // Costruisci payload senza org_id e sdi_status (non devono cambiare)
        const updatePayload = Object.fromEntries(
          Object.entries(invoicePayload).filter(([k]) => k !== "org_id" && k !== "sdi_status")
        );

        const { error: e1 } = await supabase
          .from("invoices")
          .update(updatePayload)
          .eq("id", editId);
        if (e1) throw e1;

        // Elimina vecchie righe e reinserisci
        const { error: eDel } = await supabase
          .from("invoice_items")
          .delete()
          .eq("invoice_id", editId);
        if (eDel) throw eDel;

        if (rows.length) {
          const { error: e2 } = await supabase
            .from("invoice_items")
            .insert(buildItemsPayload(editId));
          if (e2) throw e2;
        }

        // Naviga direttamente alla fattura modificata
        navigate(`/fatture/${editId}`);
      } else {
        // ── MODALITÀ CREAZIONE ──
        const { data: inv, error: e1 } = await supabase
          .from("invoices")
          .insert(invoicePayload)
          .select("id")
          .single();
        if (e1) throw e1;
        const invoiceId = inv.id;

        // Inserisci righe
        if (rows.length) {
          const { error: e2 } = await supabase
            .from("invoice_items")
            .insert(buildItemsPayload(invoiceId));
          if (e2) throw e2;
        }

        // Genera movimenti contabili (solo per nuove fatture)
        try {
          await initChartOfAccounts(orgId);
          const { data: invoiceComplete, error: invoiceError } = await supabase
            .from("invoices")
            .select(`*, invoice_items (*)`)
            .eq("id", invoiceId)
            .single();
          
          if (!invoiceError && invoiceComplete) {
            const accountingEntries = await generateAccountingEntriesForInvoice(invoiceComplete, orgId);
            if (accountingEntries.length > 0) {
              await saveAccountingEntries(accountingEntries);
            }
          }
        } catch (accountingError) {
          console.warn("Errore generazione movimenti contabili (non bloccante):", accountingError);
        }

        // Mostra popup stato incasso
        setSavedInvoiceId(invoiceId);
        setPaymentChoice("pending");
        setPaymentMethod(modPag || "MP05");
        setPaymentDate(new Date().toISOString().slice(0, 10));
        setPaymentNote("");
        setShowPaymentPopup(true);
      }
    } catch (e) {
      console.error("invoice create failed", e);
      setErrors([String(e?.message || "Creazione non riuscita.")]);
    } finally {
      setSaving(false);
    }
  }

  /* ---------- Conferma stato pagamento post-salvataggio ---------- */
  async function confirmPaymentStatus() {
    if (!savedInvoiceId) return;
    try {
      setSavingPayment(true);
      const updates = { payment_status: paymentChoice };
      if (paymentChoice === "paid") {
        updates.payment_date = paymentDate;
        updates.payment_method = paymentMethod;
        updates.payment_note = paymentNote || null;
      }
      await supabase.from("invoices").update(updates).eq("id", savedInvoiceId);
    } catch (e) {
      console.warn("Errore aggiornamento stato pagamento:", e);
    } finally {
      setSavingPayment(false);
      setShowPaymentPopup(false);
      navigate(`/fatture/${savedInvoiceId}`);
    }
  }

  function skipPaymentStatus() {
    setShowPaymentPopup(false);
    if (savedInvoiceId) navigate(`/fatture/${savedInvoiceId}`);
  }

  /* ---------- UI ---------- */
  const inputBase =
    "border border-[#243044] rounded-lg w-full px-3 py-2 " +
    "bg-[#1a2536] text-slate-200 placeholder-slate-600 outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm";

  if (editLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <FiRefreshCw className="w-5 h-5 animate-spin text-slate-500 mr-2" />
        <span className="text-sm text-slate-400">Caricamento fattura…</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-4">
        {/* Header — Design L */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => isEditMode ? navigate(`/fatture/${editId}`) : navigate("/fatture")}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#1a2536] border border-[#243044] text-slate-400 hover:text-slate-200 hover:border-slate-500 transition-colors"
            >
              <FiArrowLeft className="w-4 h-4" />
            </button>
            <div className={`w-9 h-9 rounded-full flex items-center justify-center ${isEditMode ? 'bg-blue-500/10' : 'bg-emerald-500/10'}`}>
              <FiFileText className={`w-4 h-4 ${isEditMode ? 'text-blue-400' : 'text-emerald-400'}`} />
            </div>
            <div>
              <h1 className="text-base font-semibold text-slate-100">{isEditMode ? 'Modifica Fattura' : 'Nuova Fattura'}</h1>
              <div className="flex items-center gap-2 mt-0.5">
                {number && <span className="text-[10px] text-slate-500">#{number}</span>}
                <span className="text-[10px] text-slate-500">{date}</span>
                {totals.totale > 0 && <span className="text-[10px] text-slate-300 font-medium">{EUR(totals.totale)}</span>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/fatture")}
              className="h-8 px-3 text-xs font-medium rounded-lg border border-[#243044] bg-[#1a2536] text-slate-300 hover:bg-[#243044] transition-colors"
            >
              Annulla
            </button>
            <button
              onClick={save}
              disabled={saving}
              className="h-8 px-4 text-xs font-medium rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1.5"
            >
              {saving ? (
                <><FiRefreshCw className="w-3.5 h-3.5 animate-spin" /> Salvataggio…</>
              ) : (
                <><FiSave className="w-3.5 h-3.5" /> {isEditMode ? 'Salva Modifiche' : 'Salva Fattura'}</>
              )}
            </button>
          </div>
        </div>

      {/* Errori — Design L */}
      {!!errors.length && (
        <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
          <FiAlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
          <div className="flex-1 text-sm text-red-400">
            {errors.map((e, i) => <div key={i}>{e}</div>)}
          </div>
          <button onClick={() => setErrors([])} className="text-red-400/60 hover:text-red-400"><FiX className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {/* Cedente/Prestatore — banner compatto (dati pre-impostati da Info Azienda) */}
      {!companyData ? (
        <section className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 flex items-center gap-3">
          <FiInfo className="w-4 h-4 text-amber-400 shrink-0" />
          <div className="flex-1 text-xs text-amber-200">
            Dati azienda non configurati. Vai su <strong>Impostazioni → Organizzazione → Info Azienda</strong>.
          </div>
          <button
            onClick={() => navigate(`/settings?return=${encodeURIComponent('/fatture/nuovo')}`)}
            className="px-3 py-1.5 text-xs font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition"
          >
            Configura
          </button>
        </section>
      ) : (
        <section className="bg-[#1a2536] rounded-xl border border-[#243044] px-4 py-2.5 flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="w-7 h-7 bg-emerald-500/10 rounded-lg flex items-center justify-center shrink-0">
              <FiUser className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Emessa da</span>
                <strong className="text-sm text-slate-200 truncate">{companyData.name || "—"}</strong>
                {companyData.vat && (
                  <span className="text-[11px] text-slate-400 font-mono">P.IVA {companyData.vat}</span>
                )}
                {sdiConfig?.environment && sdiConfig.environment !== 'UNKNOWN' && (
                  <span
                    title={`Ambiente SDI deciso dal VPS (${sdiConfig.upload_dir || ''})`}
                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      sdiConfig.test_mode
                        ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                        : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    }`}
                  >
                    {sdiConfig.test_mode ? '🧪 SDI TEST' : '✓ SDI PROD'}
                  </span>
                )}
              </div>
              <div className="text-[10px] text-slate-500 truncate mt-0.5">
                {[companyData.address, companyData.zip, companyData.city, companyData.province && `(${companyData.province})`].filter(Boolean).join(' ')}
                {companyData.regimeFiscale && <span className="ml-2">• Regime {companyData.regimeFiscale}</span>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={loadCompanyData}
              title="Ricarica dati"
              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-[#141c27] rounded transition"
            >
              <FiRefreshCw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => navigate(`/settings?return=${encodeURIComponent('/fatture/nuovo')}`)}
              className="text-[11px] font-medium text-slate-400 hover:text-slate-200 px-2 py-1 hover:bg-[#141c27] rounded transition"
            >
              Modifica
            </button>
          </div>
        </section>
      )}

      {/* Trasmissione SdI */}
      <section className="bg-[#1a2536] rounded-xl border border-[#243044] p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center">
            <FiZap className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-200">Trasmissione SdI</h2>
            <p className="text-xs text-slate-500">Configurazione Sistema di Interscambio</p>
          </div>
        </div>
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm text-slate-400">
            Per le fatture <b>B2B</b> (aziende) usa il <b>Codice Destinatario</b> di 7 caratteri. 
            Per <b>B2C</b> (privati) puoi lasciare vuoto (verrà usato "0000000" automaticamente) oppure inserire la PEC se disponibile.
          </div>
          <div className="flex items-center gap-2">
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          <Field 
            label="Codice Destinatario (7 caratteri)" 
            hint="B2B: inserisci il codice. B2C: lascia vuoto (verrà usato 0000000)"
          >
            <input
              className={inputBase}
              value={codiceDest}
              onChange={(e) => setCodiceDest(e.target.value.toUpperCase())}
              maxLength={7}
              placeholder="es. T04ZHR3 o lascia vuoto per B2C"
            />
          </Field>
          <Field 
            label="PEC Destinatario (opzionale)" 
            hint="Opzionale: per privati/aziende con PEC"
          >
            <input
              className={inputBase}
              value={pecDest}
              onChange={(e) => setPecDest(e.target.value)}
              type="email"
              placeholder="cliente@pec.it (opzionale)"
            />
          </Field>
        </div>
      </section>

      {/* Cessionario / Committente */}
      <section className="bg-[#1a2536] rounded-xl border border-[#243044] p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-purple-500/10 rounded-lg flex items-center justify-center">
              <FiUser className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-200">Cliente</h2>
              <p className="text-xs text-slate-500">Cessionario / Committente</p>
            </div>
          </div>
        </div>

        {/* Quick selector: cerca per codice/nome/P.IVA — sempre visibile */}
        {!editClientForm && !customerName.trim() && !customerSurname.trim() && (
          <div className="relative">
            <div className="relative">
              <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
              <input
                type="text"
                className={`${inputBase} pl-10 pr-24`}
                placeholder="Cerca per codice cliente, nome, P.IVA, CF, email..."
                value={inlineClientQuery}
                onChange={(e) => handleInlineClientChange(e.target.value)}
                onFocus={() => { setInlineClientOpen(true); inlineClientSearch(inlineClientQuery); }}
                onBlur={() => setTimeout(() => setInlineClientOpen(false), 200)}
              />
              {inlineClientLoading && (
                <FiRefreshCw className="absolute right-24 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-blue-400 animate-spin" />
              )}
              <button
                onClick={() => setEditClientForm(true)}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-2.5 py-1 text-[11px] font-medium text-slate-300 bg-[#141c27] hover:bg-[#243044] rounded transition flex items-center gap-1"
                title="Inserisci cliente nuovo manualmente"
              >
                <FiPlus className="w-3 h-3" /> Nuovo
              </button>
            </div>
            {inlineClientOpen && inlineClientResults.length > 0 && (
              <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-[#141c27] border border-[#243044] rounded-lg shadow-2xl max-h-80 overflow-y-auto">
                {inlineClientResults.map((c) => {
                  const display = c.is_company
                    ? (c.nome || c.surname || "(senza nome)")
                    : [c.nome, c.surname].filter(Boolean).join(" ") || c.email || "(senza nome)";
                  const sub = [
                    c.codice && `#${c.codice}`,
                    (c.piva || c.vat) && `P.IVA ${c.piva || c.vat}`,
                    c.tax_code && `CF ${c.tax_code}`,
                    c.city && `${c.city}${c.province ? ` (${c.province})` : ""}`,
                  ].filter(Boolean).join("  •  ");
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onMouseDown={() => { loadClient(c); setInlineClientQuery(""); setInlineClientOpen(false); }}
                      className="w-full text-left px-3 py-2 hover:bg-[#1a2536] border-b border-[#243044] last:border-b-0 transition"
                    >
                      <div className="text-sm font-medium text-slate-200 flex items-center gap-2">
                        {c.is_company ? (
                          <span className="text-[9px] font-bold text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded">AZ</span>
                        ) : (
                          <span className="text-[9px] font-bold text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">PF</span>
                        )}
                        {display}
                      </div>
                      {sub && <div className="text-[10px] text-slate-500 mt-0.5">{sub}</div>}
                    </button>
                  );
                })}
              </div>
            )}
            {inlineClientOpen && !inlineClientLoading && inlineClientResults.length === 0 && inlineClientQuery.trim().length >= 2 && (
              <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-[#141c27] border border-[#243044] rounded-lg p-3 text-xs text-slate-500">
                Nessun cliente trovato per "{inlineClientQuery}".
                <button
                  onClick={() => setEditClientForm(true)}
                  className="ml-2 text-blue-400 hover:text-blue-300 underline"
                >
                  Crea nuovo cliente
                </button>
              </div>
            )}
          </div>
        )}

        {/* Banner compatto cliente selezionato */}
        {!editClientForm && (customerName.trim() || customerSurname.trim()) && (
          <div className="bg-[#141c27]/60 border border-[#243044] rounded-lg p-3 flex items-start gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isCompany ? "bg-purple-500/15" : "bg-blue-500/15"}`}>
              <FiUser className={`w-4 h-4 ${isCompany ? "text-purple-400" : "text-blue-400"}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  {isCompany ? "Azienda" : "Persona fisica"}
                </span>
                <strong className="text-sm text-slate-100">
                  {isCompany ? customerName : [customerName, customerSurname].filter(Boolean).join(" ")}
                </strong>
                {customerVat && <span className="text-[11px] text-slate-400 font-mono">P.IVA {customerVat}</span>}
                {customerTax && <span className="text-[11px] text-slate-400 font-mono">CF {customerTax}</span>}
              </div>
              <div className="text-[11px] text-slate-500 mt-1 truncate">
                {[custStreet, custZip, custCity, custProv && `(${custProv})`].filter(Boolean).join(" ")}
                {codiceDest && <span className="ml-2">• Cod. Dest. <span className="font-mono">{codiceDest}</span></span>}
                {pecDest && <span className="ml-2">• PEC {pecDest}</span>}
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => setEditClientForm(true)}
                className="text-[11px] font-medium text-slate-400 hover:text-slate-200 px-2 py-1 hover:bg-[#1a2536] rounded transition"
              >
                Modifica
              </button>
              <button
                onClick={clearCustomerData}
                title="Cambia cliente"
                className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded transition"
              >
                <FiX className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Form manuale (solo se editClientForm o nessun cliente) */}
        {(editClientForm || (!customerName.trim() && !customerSurname.trim() && !inlineClientOpen && inlineClientQuery === "")) && editClientForm && (
        <>
        <div className="flex items-center justify-between bg-[#141c27]/30 border border-[#243044] rounded-lg px-3 py-2">
          <div className="flex items-center gap-3 text-sm text-slate-300">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Tipo cliente</span>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                checked={isCompany}
                onChange={() => setIsCompany(true)}
                className="w-3.5 h-3.5"
              />
              <span className="text-xs">Azienda</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                checked={!isCompany}
                onChange={() => setIsCompany(false)}
                className="w-3.5 h-3.5"
              />
              <span className="text-xs">Privato</span>
            </label>
          </div>
          <button
            type="button"
            onClick={() => { setEditClientForm(false); }}
            className="text-[11px] text-slate-400 hover:text-slate-200 px-2 py-1"
          >
            Chiudi modifica
          </button>
        </div>

        {isCompany ? (
          <div className="grid md:grid-cols-3 gap-3">
            <Field label="Denominazione / Ragione Sociale">
              <input
                className={inputBase}
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Nome azienda"
              />
            </Field>
            <Field label="Partita IVA">
              <div className="relative">
                <input
                  className={inputBase}
                  value={customerVat}
                  onChange={(e) => handleVatChange(e.target.value.toUpperCase())}
                  onBlur={() => {
                    // Verifica quando perde il focus se P.IVA è completa
                    const cleanVat = String(customerVat).trim().replace(/\s+/g, '').replace(/^IT/i, '');
                    if (cleanVat.length === 11 && /^\d{11}$/.test(cleanVat)) {
                      handleVatChange(customerVat);
                    }
                  }}
                  placeholder="IT12345678901"
                />
                {loadingPIVA && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <FiRefreshCw className="animate-spin text-blue-500" size={16} />
                  </div>
                )}
                {pivaStatus && (
                  <div className={`mt-1 text-xs flex items-center gap-1 ${
                    pivaStatus.valid 
                      ? pivaStatus.warning 
                        ? 'text-yellow-600' 
                        : 'text-green-600'
                      : 'text-red-600'
                  }`}>
                    {pivaStatus.valid ? (
                      pivaStatus.warning ? (
                        <>
                          <FiInfo size={12} />
                          <span>{pivaStatus.warning}</span>
                        </>
                      ) : (
                        <>
                          <FiCheck size={12} />
                          <span>P.IVA valida</span>
                        </>
                      )
                    ) : (
                      <>
                        <FiInfo size={12} />
                        <span>{pivaStatus.error || 'P.IVA non valida'}</span>
                      </>
                    )}
                  </div>
                )}
              </div>
            </Field>
            <Field label="Codice Fiscale (opz.)">
              <input
                className={inputBase}
                value={customerTax}
                onChange={(e) => setCustomerTax(e.target.value.toUpperCase())}
                placeholder="12345678901"
              />
            </Field>
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 gap-3">
              <Field label="Nome">
                <input
                  className={inputBase}
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Mario"
                />
              </Field>
              <Field label="Cognome">
                <input
                  className={inputBase}
                  value={customerSurname}
                  onChange={(e) => setCustomerSurname(e.target.value)}
                  placeholder="Rossi"
                />
              </Field>
            </div>
            <div className="grid md:grid-cols-4 gap-3">
              <Field label="Data di nascita">
                <input
                  type="date"
                  className={inputBase}
                  value={customerBirthDate}
                  onChange={(e) => setCustomerBirthDate(e.target.value)}
                />
              </Field>
              <Field label="Sesso">
                <select 
                  className={inputBase}
                  value={customerGender}
                  onChange={(e) => setCustomerGender(e.target.value)}
                >
                  <option value="M">M - Maschio</option>
                  <option value="F">F - Femmina</option>
                </select>
              </Field>
              <Field label="Comune di nascita" hint="Inserisci il comune (es. Roma, Milano)">
                <div className="relative">
                  <input
                    className={inputBase}
                    value={customerBirthPlace}
                    onChange={(e) => handleBirthPlaceChange(e.target.value)}
                    onBlur={handleBirthPlaceBlur}
                    onFocus={() => customerBirthPlace.length >= 2 && birthPlaceSuggestions.length > 0 && setShowBirthPlaceSuggestions(true)}
                    placeholder="Roma"
                  />
                  {showBirthPlaceSuggestions && birthPlaceSuggestions.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-[#141c27] border border-[#243044] rounded-md  max-h-60 overflow-y-auto">
                      {birthPlaceSuggestions.map((suggestion, idx) => (
                        <div
                          key={idx}
                          className="px-3 py-2 hover:bg-[#141c27]  cursor-pointer text-sm"
                          onClick={() => selectBirthPlace(suggestion)}
                        >
                          <div className="font-medium">{suggestion.nome}</div>
                          <div className="text-xs text-slate-500">
                            {suggestion.sigla} - {suggestion.codiceCatastale}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Field>
              <Field label="Calcola CF">
                <button
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 h-10 text-slate-300 bg-[#141c27] rounded-lg hover:bg-[#243044]  transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleCalcolaCF}
                  disabled={calculatingCF}
                  title="Calcola codice fiscale automaticamente"
                >
                  {calculatingCF ? (
                    <>
                      <FiRefreshCw className="w-4 h-4 animate-spin" />
                      <span>Calcolo in corso...</span>
                    </>
                  ) : (
                    <>
                      <FiCalendar className="w-4 h-4" />
                      <span>Calcola CF</span>
                    </>
                  )}
                </button>
              </Field>
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              <Field label="Codice Fiscale">
                <input
                  className={inputBase}
                  value={customerTax}
                  onChange={(e) => setCustomerTax(e.target.value.toUpperCase())}
                  placeholder="RSSMRA85..."
                />
              </Field>
              <Field label="Partita IVA (opz.)" hint="Solo se il privato ha P.IVA">
                <input
                  className={inputBase}
                  value={customerVat}
                  onChange={(e) => handleVatChange(e.target.value.toUpperCase())}
                  onBlur={() => {
                    // Verifica quando perde il focus se P.IVA è completa
                    const cleanVat = String(customerVat).trim().replace(/\s+/g, '').replace(/^IT/i, '');
                    if (cleanVat.length === 11 && /^\d{11}$/.test(cleanVat)) {
                      handleVatChange(customerVat);
                    }
                  }}
                  placeholder="IT12345678901"
                />
                {loadingPIVA && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <FiRefreshCw className="animate-spin text-blue-500" size={16} />
                  </div>
                )}
                {pivaStatus && (
                  <div className={`mt-1 text-xs flex items-center gap-1 ${
                    pivaStatus.valid 
                      ? pivaStatus.warning 
                        ? 'text-yellow-600' 
                        : 'text-green-600'
                      : 'text-red-600'
                  }`}>
                    {pivaStatus.valid ? (
                      pivaStatus.warning ? (
                        <>
                          <FiInfo size={12} />
                          <span>{pivaStatus.warning}</span>
                        </>
                      ) : (
                        <>
                          <FiCheck size={12} />
                          <span>P.IVA valida</span>
                        </>
                      )
                    ) : (
                      <>
                        <FiInfo size={12} />
                        <span>{pivaStatus.error || 'P.IVA non valida'}</span>
                      </>
                    )}
                  </div>
                )}
              </Field>
            </div>
          </>
        )}

        {/* Indirizzo — collassabile quando compilato */}
        {custStreet && custCity && !showClientAddress ? (
          <div className="flex items-center justify-between bg-[#141c27] rounded-lg px-3 py-2 border border-[#243044]">
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <FiMapPin className="w-3 h-3 text-slate-500" />
              <span>{custStreet}, {custZip} {custCity} {custProv ? `(${custProv})` : ''} — {custCountry}</span>
            </div>
            <button
              type="button"
              className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
              onClick={() => setShowClientAddress(true)}
            >
              Modifica
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-5 gap-3">
            <Field label="Paese" hint={custCountry !== 'IT' ? 'Cliente estero: CAP e Provincia verranno impostati automaticamente' : ''}>
              <select
                className={inputBase}
                value={custCountry}
                onChange={(e) => {
                  setCustCountry(e.target.value);
                }}
              >
                {PAESI.map(p => (
                  <option key={p.code} value={p.code}>{p.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Indirizzo">
              <div className="relative">
                <input
                  className={inputBase}
                  value={custStreet}
                  onChange={(e) => handleStreetChange(e.target.value)}
                  onBlur={() => setTimeout(() => setShowAddressSuggestions(false), 200)}
                  onFocus={() => custStreet.length >= 3 && addressSuggestions.length > 0 && setShowAddressSuggestions(true)}
                  placeholder="Via/Piazza e civico"
                />
                {showAddressSuggestions && addressSuggestions.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-[#141c27] border border-[#243044] rounded-md  max-h-60 overflow-y-auto">
                    {addressSuggestions.map((suggestion, idx) => (
                      <div
                        key={idx}
                        className="px-3 py-2 hover:bg-[#1a2536] cursor-pointer text-sm border-b border-[#243044] last:border-b-0"
                        onClick={() => selectAddress(suggestion)}
                      >
                        {suggestion._googleMaps ? (
                          <>
                            <div className="font-medium text-slate-200">{suggestion.main_text}</div>
                            <div className="text-xs text-slate-500">{suggestion.secondary_text}</div>
                          </>
                        ) : (
                          <>
                            <div className="font-medium text-slate-200">
                              {suggestion.displayName || `${suggestion.street || ''} ${suggestion.houseNumber || ''}`.trim()}
                            </div>
                            <div className="text-xs text-slate-500">
                              {suggestion.postcode && suggestion.city ? (
                                `${suggestion.postcode} ${suggestion.city}${suggestion.provinceCode ? ` (${suggestion.provinceCode})` : ''}`
                              ) : (
                                suggestion.city || suggestion.secondary_text || ''
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Field>
            <Field label="CAP">
              {custCountry === 'IT' ? (
                <input
                  className={inputBase}
                  value={custZip}
                  onChange={(e) => setCustZip(e.target.value)}
                  placeholder="00100"
                  inputMode="numeric"
                />
              ) : (
                <input
                  className={`${inputBase} bg-[#141c27] cursor-not-allowed`}
                  value="00000"
                  readOnly
                  disabled
                />
              )}
            </Field>
            <Field label="Comune">
              <input
                className={inputBase}
                value={custCity}
                onChange={(e) => setCustCity(e.target.value)}
                placeholder="Roma"
              />
            </Field>
            <Field label="Provincia">
              {custCountry === 'IT' ? (
                <input
                  className={inputBase}
                  value={custProv}
                  onChange={(e) => setCustProv(e.target.value.toUpperCase())}
                  placeholder="RM"
                  maxLength={2}
                />
              ) : (
                <input
                  value="EE"
                  readOnly
                  disabled
                  className={`${inputBase} bg-[#141c27] cursor-not-allowed`}
                />
              )}
            </Field>
          </div>
        )}
        </>
        )}
      </section>

      {/* Dati Documento */}
      <section className="bg-[#1a2536] rounded-xl border border-[#243044] p-4 space-y-3">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 bg-amber-500/10 rounded-lg flex items-center justify-center">
            <FiFileText className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-200">Dati Documento</h2>
            <p className="text-xs text-slate-500">Informazioni della fattura</p>
          </div>
        </div>
        <div className="grid md:grid-cols-4 gap-3">
          <Field label="Tipo documento">
            <select className={inputBase} value={tipoDoc} onChange={(e) => setTipoDoc(e.target.value)}>
              {tdOptions.map((o) => (
                <option key={o.v} value={o.v}>
                  {o.l}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Numero" hint="Generato automaticamente">
            <input
              className={inputBase + " bg-[#141c27] cursor-not-allowed"}
              value={number}
              readOnly
              placeholder="2025/0001"
            />
          </Field>
          <Field label="Data">
            <input type="date" className={inputBase} value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label="Valuta">
            <input
              className={inputBase}
              value={currency}
              onChange={(e) => setCurrency(e.target.value.toUpperCase())}
              placeholder="EUR"
              maxLength={3}
            />
          </Field>
        </div>
      </section>

      {/* Righe */}
      <section className="bg-[#1a2536] rounded-xl border border-[#243044] p-4 space-y-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-teal-500/10 rounded-lg flex items-center justify-center">
              <FiHash className="w-4 h-4 text-teal-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-200">Righe Fattura</h2>
              <p className="text-xs text-slate-500">Dettaglio beni e servizi</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-300 bg-[#141c27] rounded-lg hover:bg-[#243044]  transition-colors"
              onClick={() => setShowPresetSearch(true)}
              title="F2: Preset righe"
            >
              <FiHash className="w-3 h-3" /> Preset (F2)
            </button>
            <button
              className="inline-flex items-center gap-2 px-4 py-2 text-slate-300 bg-[#141c27] rounded-lg hover:bg-[#243044]  transition-colors"
              onClick={addRow}
            >
              <FiPlus className="w-4 h-4" /> Aggiungi riga
            </button>
          </div>
        </div>

        <div className="overflow-x-auto" style={{ overflowY: 'visible' }}>
          <table className="w-full" style={{ overflowY: 'visible', tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: '10%' }} />
              <col style={{ width: '34%' }} />
              <col style={{ width: '8%' }} />
              <col style={{ width: '12%' }} />
              <col style={{ width: '9%' }} />
              <col style={{ width: '9%' }} />
              <col style={{ width: '12%' }} />
              <col style={{ width: '6%' }} />
            </colgroup>
            <thead className="bg-[#141c27]/50">
              <tr>
                <th className="text-left px-2 py-3 text-sm font-semibold">Codice</th>
                <th className="text-left px-2 py-3 text-sm font-semibold">Descrizione</th>
                <th className="text-left px-2 py-3 text-sm font-semibold">Q.tà</th>
                <th className="text-left px-2 py-3 text-sm font-semibold">Prezzo €</th>
                <th className="text-left px-2 py-3 text-sm font-semibold">IVA %</th>
                <th className="text-left px-2 py-3 text-sm font-semibold">Sc. %</th>
                <th className="text-left px-2 py-3 text-sm font-semibold">Totale €</th>
                <th className="text-left px-2 py-3 text-sm font-semibold"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#243044] ">
              {rows.map((r, i) => {
                // Calcola importo con sconto di riga
                let itemTotal = asNum(r.qty) * asNum(r.price);
                const sconto = r.sconto || r.discount;
                if (sconto) {
                  if (sconto.percentuale !== undefined && sconto.percentuale !== null) {
                    const scontoImporto = (itemTotal * Number(sconto.percentuale)) / 100;
                    itemTotal -= scontoImporto; // Sconto percentuale
                  } else if (sconto.importo !== undefined && sconto.importo !== null) {
                    itemTotal -= Number(sconto.importo); // Sconto importo fisso
                  }
                }
                const importo = itemTotal;
                
                return (
                  <tr key={i} className="hover:bg-[#141c27]/50 transition-colors">
                    <td className="px-2 py-2">
                      <input
                        className={`${inputBase} w-full text-sm`}
                        value={r.descr}
                        onChange={(e) => patchRow(i, { descr: e.target.value })}
                        onFocus={(e) => e.target.select()}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); const inputs = Array.from(document.querySelectorAll('tr input:not([disabled]):not([readonly])')); const idx = inputs.indexOf(e.target); if (idx >= 0 && inputs[idx + 1]) inputs[idx + 1].focus(); } }}
                        placeholder="Codice"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <div className="relative">
                        <input
                          className={`${inputBase} w-full text-sm`}
                          value={r.item_description || ''}
                          onChange={(e) => handleDescrChange(i, e.target.value)}
                          onFocus={(e) => { e.target.select(); if (allPresets.length === 0) loadAllPresets(); }}
                          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); const inputs = Array.from(document.querySelectorAll('tr input:not([disabled]):not([readonly])')); const idx = inputs.indexOf(e.target); if (idx >= 0 && inputs[idx + 1]) inputs[idx + 1].focus(); } }}
                          onBlur={() => setTimeout(() => { setDescrSuggRow(null); setDescrSuggestions([]); }, 200)}
                          placeholder="Descrizione personalizzata"
                        />
                        {descrSuggRow === i && descrSuggestions.length > 0 && (
                          <div className="absolute z-[200] left-0 right-0 top-full mt-1 bg-[#141c27] border border-[#243044] rounded-lg shadow-2xl max-h-48 overflow-y-auto"
                            style={{ minWidth: '280px' }}
                          >
                            {descrSuggestions.map((p) => (
                              <button
                                key={p.description}
                                type="button"
                                className="w-full px-3 py-2 text-left hover:bg-[#1a2536] border-b border-[#243044] last:border-b-0"
                                onMouseDown={(e) => { e.preventDefault(); applyDescrPreset(i, p); }}
                              >
                                <div className="text-xs text-slate-200 font-medium">{p.description}</div>
                                <div className="text-[10px] text-slate-500">€{p.price} × {p.qty} — IVA {p.vat_perc}%</div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-2 py-2">
                      <input
                        type="number"
                        className={`${inputBase} w-full text-sm`}
                        value={r.qty}
                        onChange={(e) => patchRow(i, { qty: asNum(e.target.value) })}
                        onFocus={(e) => e.target.select()}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); const inputs = Array.from(document.querySelectorAll('tr input:not([disabled]):not([readonly])')); const idx = inputs.indexOf(e.target); if (idx >= 0 && inputs[idx + 1]) inputs[idx + 1].focus(); } }}
                        placeholder="1"
                        min={0}
                        step="0.01"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input
                        type="number"
                        className={`${inputBase} w-full text-sm`}
                        value={r.price}
                        onChange={(e) => patchRow(i, { price: asNum(e.target.value) })}
                        onFocus={(e) => e.target.select()}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); const inputs = Array.from(document.querySelectorAll('tr input:not([disabled]):not([readonly])')); const idx = inputs.indexOf(e.target); if (idx >= 0 && inputs[idx + 1]) inputs[idx + 1].focus(); } }}
                        placeholder="0"
                        min={0}
                        step="0.01"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input
                        type="number"
                        className={`${inputBase} w-full text-sm`}
                        value={r.vat_perc}
                        onChange={(e) => patchRow(i, { vat_perc: asNum(e.target.value) })}
                        onFocus={(e) => e.target.select()}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); const inputs = Array.from(document.querySelectorAll('tr input:not([disabled]):not([readonly])')); const idx = inputs.indexOf(e.target); if (idx >= 0 && inputs[idx + 1]) inputs[idx + 1].focus(); } }}
                        placeholder="22"
                        min={0}
                      />
                    </td>
                    <td className="px-2 py-2">
                      <div className="flex gap-1 items-center">
                        <input
                          type="number"
                          className={`${inputBase} w-full text-sm`}
                          value={sconto?.percentuale || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            const numVal = Number(val);
                            if (val === '' || numVal >= 0) {
                              patchRow(i, { 
                                sconto: val ? { 
                                  tipo: 'SC',
                                  percentuale: numVal,
                                  importo: null
                                } : null
                              });
                            }
                          }}
                          onFocus={(e) => e.target.select()}
                          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); const inputs = Array.from(document.querySelectorAll('tr input:not([disabled]):not([readonly])')); const idx = inputs.indexOf(e.target); if (idx >= 0 && inputs[idx + 1]) inputs[idx + 1].focus(); } }}
                          placeholder="0"
                          min={0}
                          max={100}
                          step="0.01"
                        />
                        {sconto && (
                          <button
                            type="button"
                            className="p-1 text-slate-500 hover:text-red-600 transition-colors rounded hover:bg-red-500/10 flex-shrink-0"
                            onClick={() => patchRow(i, { sconto: null })}
                            title="Rimuovi sconto"
                          >
                            <FiX className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-2 py-2 text-right font-medium text-sm">
                      {EUR(importo)}
                    </td>
                    <td className="px-2 py-2 text-right">
                      <button 
                        className="p-1.5 text-slate-500 hover:text-red-600 transition-colors rounded hover:bg-red-500/10" 
                        onClick={() => removeRow(i)}
                        title="Rimuovi riga"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!rows.length && (
            <div className="text-sm text-slate-500 text-center py-8">
              Nessuna riga. Clicca "Aggiungi riga" per iniziare.
            </div>
          )}
        </div>

        {/* Totali */}
        <div className="pt-3 border-t border-[#243044]  grid md:grid-cols-3 gap-3">
          <div className="md:col-span-2" />
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Imponibile</span>
              <b>{EUR(totals.imponibile)}</b>
            </div>
            <div className="flex justify-between">
              <span>IVA</span>
              <b>{EUR(totals.iva)}</b>
            </div>
            <div className="flex justify-between text-base pt-1 border-t ">
              <span>Totale</span>
              <b>{EUR(totals.totale)}</b>
            </div>
          </div>
        </div>
      </section>

      {/* Nota Credito/Debito - Selezione Fattura Originale */}
      {(tipoDoc === "TD04" || tipoDoc === "TD05") && (
        <section className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
              <FiFileText className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-200">
                {tipoDoc === "TD04" ? "Nota di Credito" : "Nota di Debito"}
              </h2>
              <p className="text-sm text-slate-400">Seleziona la fattura originale</p>
            </div>
          </div>
          {originalInvoice ? (
            <div className="bg-[#1a2536] rounded-lg p-4 border border-[#243044]">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-slate-200">
                    Fattura n. {originalInvoice.number || "—"}
                  </div>
                  <div className="text-sm text-slate-400">
                    {originalInvoice.date || "—"} • {originalInvoice.customer_name || "—"}
                  </div>
                </div>
                <button
                  className="text-sm text-red-600 hover:text-red-400"
                  onClick={() => {
                    setOriginalInvoice(null);
                    setOriginalInvoiceId(null);
                  }}
                >
                  Cambia
                </button>
              </div>
            </div>
          ) : (
            <button
              className="w-full px-4 py-3 text-left border-2 border-dashed border-amber-300 rounded-lg hover:border-amber-400 transition-colors text-slate-300"
              onClick={() => setShowOriginalInvoiceSearch(true)}
            >
              Clicca per selezionare la fattura originale
            </button>
          )}
        </section>
      )}

      {/* Sconto/Abbuoni */}
      <section className="bg-[#1a2536] rounded-xl border border-[#243044] p-4 space-y-3">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 bg-purple-500/10 rounded-lg flex items-center justify-center">
            <FiPercent className="w-4 h-4 text-purple-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-200">Sconto/Abbuoni</h2>
            <p className="text-xs text-slate-500">Applica sconto o abbuono sulla fattura</p>
          </div>
        </div>
        <div className="grid md:grid-cols-3 gap-3">
          <Field label="Tipo sconto">
            <select
              className={inputBase}
              value={discountType}
              onChange={(e) => {
                setDiscountType(e.target.value);
                if (e.target.value === "none") setDiscountValue(0);
              }}
            >
              <option value="none">Nessuno</option>
              <option value="percentage">Percentuale (%)</option>
              <option value="fixed">Importo fisso (€)</option>
            </select>
          </Field>
          {discountType !== "none" && (
            <Field label={discountType === "percentage" ? "Percentuale (%)" : "Importo (€)"}>
              <input
                type="number"
                className={inputBase}
                value={discountValue}
                onChange={(e) => setDiscountValue(asNum(e.target.value))}
                min={0}
                step={discountType === "percentage" ? "1" : "0.01"}
                placeholder={discountType === "percentage" ? "10" : "50.00"}
              />
            </Field>
          )}
          {discountType !== "none" && (
            <div className="flex items-end">
              <div className="w-full p-3 bg-[#141c27] rounded-lg text-sm">
                <div className="text-slate-400">Sconto applicato:</div>
                <div className="text-sm font-semibold text-slate-200">
                  {discountType === "percentage"
                    ? `${discountValue}% (${EUR((totals.totale * discountValue) / 100)})`
                    : EUR(discountValue)}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Riepilogo IVA */}
      <section className="bg-[#1a2536] rounded-xl border border-[#243044] p-4 space-y-3">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 bg-red-500/10 rounded-lg flex items-center justify-center">
            <FiDollarSign className="w-4 h-4 text-red-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-200">Riepilogo IVA</h2>
            <p className="text-xs text-slate-500">Dettagli IVA</p>
          </div>
        </div>
        <div className="grid md:grid-cols-4 gap-3">
          <Field label="Aliquota IVA (%)">
            <input
              className={inputBase}
              type="number"
              min={0}
              value={riepAliq}
              onChange={(e) => setRiepAliq(asNum(e.target.value))}
              placeholder="22"
            />
          </Field>
          <Field 
            label="Natura (se fuori campo IVA)" 
            hint="Compila solo se l'operazione è esente, non imponibile, etc."
          >
            <select 
              className={inputBase} 
              value={riepNatura} 
              onChange={(e) => setRiepNatura(e.target.value)}
            >
              {naturaIvaOptions.map((o) => (
                <option key={o.v} value={o.v}>
                  {o.l}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Esigibilità IVA">
            <select className={inputBase} value={riepEsig} onChange={(e) => setRiepEsig(e.target.value)}>
              {esigIvaOptions.map((o) => (
                <option key={o.v} value={o.v}>
                  {o.l}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </section>

      {/* Bollo, Ritenuta, Cassa */}
      <section className="bg-[#1a2536] rounded-xl border border-[#243044] p-4 space-y-3">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 bg-amber-500/20 rounded-lg flex items-center justify-center">
            <FiFileText className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-200">Bollo, Ritenuta, Cassa</h2>
            <p className="text-xs text-slate-500">Opzionali — compilare solo se applicabili</p>
          </div>
        </div>

        {/* Bollo Virtuale */}
        <div className="border border-[#243044] rounded-lg p-3 space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={bolloVirtuale} onChange={e => setBolloVirtuale(e.target.checked)} className="rounded" />
            <span className="text-sm font-medium">Bollo virtuale</span>
            <span className="text-xs text-slate-500">(obbligatorio per fatture esenti IVA &gt; €77,47)</span>
          </label>
          {bolloVirtuale && (
            <Field label="Importo bollo" hint="Art. 6 DM 17/06/2014 — fisso €2,00">
              <input type="number" step="0.01" className={inputBase} value={bolloImporto} onChange={e => setBolloImporto(Number(e.target.value))} />
            </Field>
          )}
        </div>

        {/* Ritenuta d'Acconto */}
        <div className="border border-[#243044] rounded-lg p-3 space-y-2">
          <Field label="Ritenuta d'acconto" hint="Art. 25 DPR 600/1973 — lasciare vuoto se non applicabile">
            <select className={inputBase} value={ritenutaTipo} onChange={e => setRitenutaTipo(e.target.value)}>
              <option value="">Nessuna ritenuta</option>
              <option value="RT01">RT01 — Ritenuta persone fisiche</option>
              <option value="RT02">RT02 — Ritenuta persone giuridiche</option>
              <option value="RT03">RT03 — Contributo INPS</option>
              <option value="RT04">RT04 — Contributo ENASARCO</option>
              <option value="RT05">RT05 — Contributo ENPAM</option>
              <option value="RT06">RT06 — Altro contributo previdenziale</option>
            </select>
          </Field>
          {ritenutaTipo && (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Aliquota ritenuta (%)">
                <input type="number" step="0.01" className={inputBase} value={ritenutaAliquota} onChange={e => setRitenutaAliquota(Number(e.target.value))} />
              </Field>
              <Field label="Causale pagamento" hint="A=lavoro autonomo, B=royalties, C=utili, ecc.">
                <select className={inputBase} value={ritenutaCausale} onChange={e => setRitenutaCausale(e.target.value)}>
                  <option value="A">A — Prestazioni lavoro autonomo</option>
                  <option value="B">B — Royalties / diritti d'autore</option>
                  <option value="C">C — Utili</option>
                  <option value="D">D — Utili da contratti di associazione</option>
                  <option value="L">L — Redditi di lavoro dipendente</option>
                  <option value="M">M — Prestazioni lavoro autonomo non esercenti</option>
                  <option value="O">O — Prestazioni occasionali</option>
                  <option value="Q">Q — Provvigioni agente monomandatario</option>
                  <option value="R">R — Provvigioni agente plurimandatario</option>
                  <option value="V">V — Redditi da cessione brevetti</option>
                  <option value="Z">Z — Titolo diverso</option>
                </select>
              </Field>
            </div>
          )}
        </div>

        {/* Cassa Previdenziale */}
        <div className="border border-[#243044] rounded-lg p-3 space-y-2">
          <Field label="Cassa previdenziale" hint="Solo per professionisti iscritti a casse — lasciare vuoto se non applicabile">
            <select className={inputBase} value={cassaTipo} onChange={e => setCassaTipo(e.target.value)}>
              <option value="">Nessuna cassa</option>
              <option value="TC01">TC01 — Cassa nazionale previdenza avvocati</option>
              <option value="TC02">TC02 — Cassa previdenza dottori commercialisti</option>
              <option value="TC03">TC03 — Cassa previdenza geometri</option>
              <option value="TC04">TC04 — Cassa nazionale previdenza ingegneri e architetti</option>
              <option value="TC05">TC05 — Cassa nazionale del notariato</option>
              <option value="TC07">TC07 — ENPAIA</option>
              <option value="TC08">TC08 — ENPALS</option>
              <option value="TC09">TC09 — ENPAM</option>
              <option value="TC10">TC10 — ENPAF</option>
              <option value="TC11">TC11 — ENPAV</option>
              <option value="TC13">TC13 — ONAOSI</option>
              <option value="TC15">TC15 — EPAP</option>
              <option value="TC16">TC16 — EPPI</option>
              <option value="TC17">TC17 — EPCE</option>
              <option value="TC19">TC19 — INPGI</option>
              <option value="TC22">TC22 — INPS gestione separata</option>
            </select>
          </Field>
          {cassaTipo && (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Aliquota contributo (%)">
                <input type="number" step="0.01" className={inputBase} value={cassaAliquota} onChange={e => setCassaAliquota(Number(e.target.value))} />
              </Field>
              <Field label="Aliquota IVA su contributo (%)">
                <input type="number" step="0.01" className={inputBase} value={cassaAliquotaIva} onChange={e => setCassaAliquotaIva(Number(e.target.value))} />
              </Field>
            </div>
          )}
        </div>
      </section>

      {/* Pagamento */}
      <section className="bg-[#1a2536] rounded-xl border border-[#243044] p-4 space-y-3">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center">
            <FiCreditCard className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-200">Pagamento</h2>
            <p className="text-xs text-slate-500">Modalità e condizioni di pagamento</p>
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          <Field label="Condizioni di pagamento">
            <select className={inputBase} value={condPag} onChange={(e) => setCondPag(e.target.value)}>
              <option value="TP01">TP01 - Pagamento a rate</option>
              <option value="TP02">TP02 - Pagamento completo</option>
              <option value="TP03">TP03 - Anticipo</option>
            </select>
          </Field>
          <Field label="Scadenza pagamento">
            <input
              type="date"
              className={inputBase}
              value={scadenza}
              onChange={(e) => setScadenza(e.target.value)}
            />
          </Field>
        </div>
        <div className={`grid gap-3 ${modPag === 'MP05' || modPag === 'MP12' ? 'md:grid-cols-3' : 'md:grid-cols-1'}`}>
          <Field label="Modalità">
            <select className={inputBase} value={modPag} onChange={(e) => setModPag(e.target.value)}>
              {modPagOptions.map((o) => (
                <option key={o.v} value={o.v}>
                  {o.l}
                </option>
              ))}
            </select>
          </Field>
          
          {/* IBAN: solo per Bonifico (MP05) e RIBA (MP12) */}
          {(modPag === 'MP05' || modPag === 'MP12') && (
            <Field label="IBAN" hint="Obbligatorio per bonifico/RIBA">
              <input
                className={inputBase}
                value={iban}
                onChange={(e) => setIban(e.target.value.replace(/\s+/g, "").toUpperCase())}
                placeholder="IT60X0542811101000000123456"
              />
            </Field>
          )}
          
          {/* Beneficiario: solo per Bonifico (MP05) e RIBA (MP12) */}
          {(modPag === 'MP05' || modPag === 'MP12') && (
            <Field label="Beneficiario (opz.)">
              <input
                className={inputBase}
                value={beneficiario}
                onChange={(e) => setBeneficiario(e.target.value)}
                placeholder="Ragione sociale beneficiario"
              />
            </Field>
          )}
        </div>
      </section>

      {/* Note */}
      <section className="bg-[#1a2536] rounded-xl border border-[#243044] p-4 space-y-3">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 bg-slate-500/10 rounded-lg flex items-center justify-center">
            <FiFileText className="w-4 h-4 text-slate-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-200">Note</h2>
            <p className="text-xs text-slate-500">Note aggiuntive</p>
          </div>
        </div>
        <Field 
          label="Note per il cliente" 
          hint="Queste note saranno visibili sul PDF e nell'XML inviato a SDI (Causale)"
        >
          <textarea
            className={inputBase + " h-28 resize-vertical"}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Eventuali note per il cliente o dettagli aggiuntivi contrattuali…"
            maxLength={200}
          />
        </Field>
        <Field 
          label="Note interne" 
          hint="Queste note sono solo per uso interno e NON appariranno sul PDF o nell'XML SDI"
        >
          <textarea
            className={inputBase + " h-20 resize-vertical"}
            value={noteInternal}
            onChange={(e) => setNoteInternal(e.target.value)}
            placeholder="Note per uso interno (non visibili al cliente)…"
          />
        </Field>
      </section>

      {/* Azioni — Design L */}
      <div className="flex justify-end gap-2 pt-4 border-t border-[#243044]">
        <button
          onClick={() => navigate("/fatture")}
          className="h-8 px-3 text-xs font-medium rounded-lg border border-[#243044] bg-[#1a2536] text-slate-300 hover:bg-[#243044] transition-colors"
        >
          Annulla
        </button>
        <button
          onClick={save}
          disabled={saving}
          className="h-8 px-4 text-xs font-medium rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1.5"
        >
          {saving ? (
            <><FiRefreshCw className="w-3.5 h-3.5 animate-spin" /> Salvataggio…</>
          ) : (
            <><FiSave className="w-3.5 h-3.5" /> Salva Fattura</>
          )}
        </button>
      </div>

      {/* Modale ricerca clienti */}
      {showClientSearch && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowClientSearch(false)}>
          <div className="bg-[#141c27] rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-[#243044] ">
              <h3 className="font-semibold text-lg mb-3"> Cerca Cliente</h3>
              <input
                autoFocus
                type="text"
                className={inputBase}
                placeholder="Cerca per nome, cognome, P.IVA o CF..."
                value={clientSearchTerm}
                onChange={(e) => setClientSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {clientResults.length === 0 && (
                <div className="text-center text-slate-500 py-8">
                  {clientSearchTerm ? "Nessun cliente trovato" : "Inizia a digitare per cercare"}
                </div>
              )}
              {clientResults.map((client) => (
                <div
                  key={client.id}
                  className="p-3 rounded-lg border border-[#243044]  hover:bg-[#141c27]  cursor-pointer mb-2"
                  onClick={() => loadClient(client)}
                >
                  <div className="font-semibold">{client.nome} {client.surname}</div>
                  <div className="text-sm text-slate-400 space-x-3">
                    {client.piva && <span>P.IVA: {client.piva}</span>}
                    {(client.tax_code || client.codice_fiscale) && (
                      <span>CF: {client.tax_code || client.codice_fiscale}</span>
                    )}
                    {client.indirizzo && <span>{client.indirizzo}</span>}
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-[#243044]  flex justify-end">
              <button
                className="inline-flex items-center gap-2 px-4 py-2 text-slate-300 bg-[#141c27] rounded-lg hover:bg-[#243044]  transition-colors"
                onClick={() => setShowClientSearch(false)}
              >
                Chiudi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modale preset righe */}
      {showPresetSearch && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowPresetSearch(false)}>
          <div className="bg-[#141c27] rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-[#243044] ">
              <h3 className="font-semibold text-lg mb-3">Preset Righe</h3>
              <input
                autoFocus
                type="text"
                className={inputBase}
                placeholder="Cerca per descrizione..."
                value={presetSearchTerm}
                onChange={(e) => setPresetSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {presetResults.length === 0 && (
                <div className="text-center text-slate-500 py-8">
                  {presetSearchTerm ? "Nessun preset trovato" : "Nessun preset disponibile"}
                </div>
              )}
              {presetResults.map((preset, idx) => (
                <div
                  key={`preset-${preset.id ?? idx}-${preset.description}`}
                  className="p-3 rounded-lg border border-[#243044]  hover:bg-[#141c27]  cursor-pointer mb-2"
                  onClick={() => addPresetAsRow(preset)}
                >
                  <div className="font-semibold">{preset.description}</div>
                  <div className="text-sm text-slate-400 space-x-3">
                    <span>Q.tà: {preset.qty}</span>
                    <span>Prezzo: {EUR(preset.price)}</span>
                    <span>Tot: {EUR(preset.qty * preset.price)}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-[#243044]  flex justify-end">
              <button
                className="inline-flex items-center gap-2 px-4 py-2 text-slate-300 bg-[#141c27] rounded-lg hover:bg-[#243044]  transition-colors"
                onClick={() => setShowPresetSearch(false)}
              >
                Chiudi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modale ricerca fatture originali (per nota credito/debito) */}
      {showOriginalInvoiceSearch && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowOriginalInvoiceSearch(false)}>
          <div className="bg-[#1a2536] rounded-xl  max-w-2xl w-full max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-[#243044] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-200">Seleziona Fattura Originale</h3>
                <p className="text-sm text-slate-400 mt-1">Cerca per numero fattura o nome cliente</p>
              </div>
              <button
                className="p-2 text-slate-500 hover:text-slate-400  transition-colors"
                onClick={() => setShowOriginalInvoiceSearch(false)}
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 flex-1 overflow-y-auto">
              <input
                type="text"
                className={inputBase + " mb-4"}
                value={originalInvoiceSearchTerm}
                onChange={(e) => {
                  setOriginalInvoiceSearchTerm(e.target.value);
                  searchOriginalInvoices(e.target.value);
                }}
                placeholder="Cerca fattura..."
                autoFocus
              />
              <div className="space-y-2">
                {originalInvoiceResults.length > 0 ? (
                  originalInvoiceResults.map((inv) => (
                    <div
                      key={inv.id}
                      className="p-4 border border-[#243044] rounded-lg hover:bg-[#141c27]  cursor-pointer transition-colors"
                      onClick={() => selectOriginalInvoice(inv)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-slate-200">
                            Fattura n. {inv.number || "—"}
                          </div>
                          <div className="text-sm text-slate-400 mt-1">
                            {inv.date || "—"} • {inv.customer_name || "—"} • {EUR(inv.total || 0)}
                          </div>
                        </div>
                        <button
                          className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            selectOriginalInvoice(inv);
                          }}
                        >
                          Seleziona
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    {originalInvoiceSearchTerm.trim() ? "Nessuna fattura trovata" : "Inserisci un termine di ricerca"}
                  </div>
                )}
              </div>
            </div>
            <div className="p-6 border-t border-[#243044] flex justify-end">
              <button
                className="px-4 py-2 text-slate-300 bg-[#141c27] rounded-lg hover:bg-[#243044]  transition-colors"
                onClick={() => setShowOriginalInvoiceSearch(false)}
              >
                Chiudi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Dati Agenzia delle Entrate */}
      <OpenAPIDataModal
        isOpen={showOpenAPIModal}
        onClose={() => setShowOpenAPIModal(false)}
        companyData={openAPIData}
        onApply={handleApplyOpenAPIData}
      />

      {/* Popup stato incasso post-salvataggio */}
      {showPaymentPopup && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a2536] rounded-xl border border-[#243044] max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="px-5 py-4 border-b border-[#243044] flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <FiCheckCircle className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-100">Fattura Salvata</h3>
                <p className="text-xs text-slate-500">Registra lo stato del pagamento</p>
              </div>
            </div>

            {/* Scelta pagamento */}
            <div className="px-5 py-4 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setPaymentChoice("pending")}
                  className={`p-3 rounded-lg border text-left transition-colors ${
                    paymentChoice === "pending"
                      ? "border-amber-500/50 bg-amber-500/10"
                      : "border-[#243044] bg-[#141c27] hover:border-slate-500"
                  }`}
                >
                  <FiAlertCircle className={`w-5 h-5 mb-1.5 ${paymentChoice === "pending" ? "text-amber-400" : "text-slate-500"}`} />
                  <div className={`text-sm font-medium ${paymentChoice === "pending" ? "text-amber-300" : "text-slate-300"}`}>Non incassata</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Da incassare in futuro</div>
                </button>
                <button
                  onClick={() => setPaymentChoice("paid")}
                  className={`p-3 rounded-lg border text-left transition-colors ${
                    paymentChoice === "paid"
                      ? "border-emerald-500/50 bg-emerald-500/10"
                      : "border-[#243044] bg-[#141c27] hover:border-slate-500"
                  }`}
                >
                  <FiCheckCircle className={`w-5 h-5 mb-1.5 ${paymentChoice === "paid" ? "text-emerald-400" : "text-slate-500"}`} />
                  <div className={`text-sm font-medium ${paymentChoice === "paid" ? "text-emerald-300" : "text-slate-300"}`}>Incassata</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Pagamento già ricevuto</div>
                </button>
              </div>

              {/* Dettagli pagamento (solo se incassata) */}
              {paymentChoice === "paid" && (
                <div className="space-y-2.5 pt-2 border-t border-[#243044]">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Metodo di pagamento</label>
                    <select
                      className={inputBase}
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    >
                      {modPagOptions.map((o) => (
                        <option key={o.v} value={o.v}>{o.l}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Data incasso</label>
                    <input
                      type="date"
                      className={inputBase}
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Note (opzionale)</label>
                    <input
                      className={inputBase}
                      value={paymentNote}
                      onChange={(e) => setPaymentNote(e.target.value)}
                      placeholder="es. Contanti alla consegna"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-[#243044] flex items-center justify-between">
              <button
                onClick={skipPaymentStatus}
                className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
              >
                Salta
              </button>
              <button
                onClick={confirmPaymentStatus}
                disabled={savingPayment}
                className="h-8 px-4 text-xs font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 inline-flex items-center gap-1.5"
              >
                {savingPayment ? (
                  <><FiRefreshCw className="w-3.5 h-3.5 animate-spin" /> Salvataggio…</>
                ) : (
                  <><FiCheck className="w-3.5 h-3.5" /> Conferma</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}