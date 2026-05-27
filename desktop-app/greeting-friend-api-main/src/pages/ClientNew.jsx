/**
 * ClientNew — Design L aligned
 * Form creazione/modifica cliente con validazione, auto-fill P.IVA,
 * calcolo CF, indirizzo autocomplete, SDI, auto-save bozza
 *
 * Route: /clienti/nuovo  |  /clienti/:id/modifica
 */

import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { useOrg } from "@/context/OrgContext";
import {
  FiArrowLeft, FiSave, FiUser, FiCheck,
  FiAlertTriangle, FiInfo, FiRefreshCw, FiZap,
  FiAlertCircle, FiX, FiBriefcase,
  FiFileText, FiPhone, FiMapPin, FiDollarSign,
  FiUsers, FiLock, FiEdit3
} from "react-icons/fi";

/* ─── Optional deps (graceful if missing) ─── */
let searchAddress = async () => [];
let selectAddressWithDetails = async () => ({});
let autoFillFromPIVA = async () => null;
try { 
  ({ searchAddress, selectAddressWithDetails } = await import("@/lib/google-maps")); 
} catch { 
  // Fallback to old geocoding
  try { ({ searchAddress } = await import("@/lib/geocoding")); } catch { /* noop */ }
}
try { ({ autoFillFromPIVA } = await import("@/lib/openapi-company")); } catch { /* noop */ }

/* ═══════════════════════════════════════════════
   Codice Fiscale: usa lib dedicata con database
   comuni completo (8000+ comuni ISTAT)
   ═══════════════════════════════════════════════ */
import { calcolaCodiceFiscale } from "@/lib/codiceFiscale";
import { searchComuni, getComuneByName } from "@/lib/comuniItaliani";

/* ═══════════════════════════════════════════════
   Utility: P.IVA validation
   ═══════════════════════════════════════════════ */
function validatePIVA(piva) {
  if (!piva) return { valid: false, msg: "P.IVA obbligatoria" };
  const clean = piva.replace(/\s/g, "").toUpperCase();
  if (!/^IT\d{11}$/.test(clean)) return { valid: false, msg: "Formato: IT + 11 cifre" };
  const digits = clean.slice(2);
  let s = 0;
  for (let i = 0; i < 10; i++) {
    let d = Number.parseInt(digits[i], 10);
    if (i % 2 === 1) d *= 2;
    if (d > 9) d = Math.floor(d / 10) + (d % 10);
    s += d;
  }
  const ok = (10 - (s % 10)) % 10 === Number.parseInt(digits[10], 10);
  return { valid: ok, msg: ok ? "P.IVA valida" : "P.IVA non valida (check digit)" };
}

function generateClientCode(nome, cognome, isCompany) {
  if (!nome.trim()) return null;
  const norm = (s) => s.trim().replace(/\s+/g, "").replace(/[^A-ZÀÈÉÌÒÙ]/gi, "").toUpperCase();
  return isCompany ? norm(nome) : norm(`${nome}${cognome}`);
}

/* ─── Shared input class ─── */
const inputCls = (err) =>
  `w-full h-8 px-3 text-xs border rounded-lg focus:ring-1 focus:ring-blue-500/30 outline-none transition bg-[#141c27] text-slate-200 placeholder-slate-600 ${
    err ? "border-red-500/30" : "border-[#243044]"
  }`;

/* ═══════════════════════════════════════════════
   Component
   ═══════════════════════════════════════════════ */
export default function ClientNew() {
  const supabase = supabaseBrowser();
  const { orgId } = useOrg();
  const navigate = useNavigate();
  const { id: editId } = useParams(); // /clienti/:id/modifica
  const [searchParams] = useSearchParams();
  const returnUrl = searchParams.get('return') || null;

  /* ─── Form state ─── */
  const [codice, setCodice] = useState("");
  const [nome, setNome] = useState("");
  const [cognome, setCognome] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [piva, setPiva] = useState("");
  const [codiceFiscale, setCodiceFiscale] = useState("");
  const [note, setNote] = useState("");
  const [via, setVia] = useState("");
  const [cap, setCap] = useState("");
  const [citta, setCitta] = useState("");
  const [provincia, setProvincia] = useState("");
  const [paese, setPaese] = useState("Italia");
  const [codiceDestinatario, setCodiceDestinatario] = useState("");
  const [pec, setPec] = useState("");
  const [isCompany, setIsCompany] = useState(true);
  const [dataNascita, setDataNascita] = useState("");
  const [sesso, setSesso] = useState("M");
  const [luogoNascita, setLuogoNascita] = useState("");
  const [luogoNascitaCode, setLuogoNascitaCode] = useState("");
  const [birthPlaceSuggestions, setBirthPlaceSuggestions] = useState([]);
  const [showBirthPlaceSugg, setShowBirthPlaceSugg] = useState(false);
  
  /* ─── Nuovi campi priorità alta (1-4) ─── */
  const [tipoDocumento, setTipoDocumento] = useState("CI"); // CI, Patente, Passaporto
  const [numeroDocumento, setNumeroDocumento] = useState("");
  const [scadenzaDocumento, setScadenzaDocumento] = useState("");
  const [categoriaCliente, setCategoriaCliente] = useState("privato_occasionale");
  const [scontoDefault, setScontoDefault] = useState("");
  const [telefono2, setTelefono2] = useState("");
  
  /* ─── Nuovi campi priorità media (5-7) ─── */
  const [modalitaPagamento, setModalitaPagamento] = useState("contanti");
  const [giorniDilazione, setGiorniDilazione] = useState("");
  const [nomeReferente, setNomeReferente] = useState("");
  const [telefonoReferente, setTelefonoReferente] = useState("");
  const [emailReferente, setEmailReferente] = useState("");
  const [iban, setIban] = useState("");
  const [sitoWeb, setSitoWeb] = useState("");
  
  /* ─── Nuovi campi priorità bassa (9-11) ─── */
  const [consensoPrivacy, setConsensoPrivacy] = useState(false);
  const [consensoMarketing, setConsensoMarketing] = useState(false);
  const [tags, setTags] = useState("");
  const [limiteFido, setLimiteFido] = useState("");

  /* ─── UI state ─── */
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!!editId);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState(null);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [loadingPIVA, setLoadingPIVA] = useState(false);
  const [calculatingCF, setCalculatingCF] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [showAddrSugg, setShowAddrSugg] = useState(false);
  const [draftStatus, setDraftStatus] = useState(""); // saving | saved | ""

  /* ─── Completion % ─── */
  const completionPercent = useMemo(() => {
    const fields = isCompany
      ? [nome, piva, codiceFiscale, email, telefono, via, citta, provincia, cap, codiceDestinatario || pec]
      : [nome, cognome, codiceFiscale, dataNascita, luogoNascita, email, telefono, via, citta, provincia, cap];
    const filled = fields.filter(f => f && f.trim()).length;
    return Math.round((filled / fields.length) * 100);
  }, [nome, cognome, piva, codiceFiscale, email, telefono, via, citta, provincia, cap, codiceDestinatario, pec, dataNascita, luogoNascita, isCompany]);

  /* ─── Has meaningful changes ─── */
  const hasMeaningful = useCallback(() => {
    if (!editId && !nome.trim()) return false;
    return !!(nome.trim() || cognome.trim() || telefono.trim() || email.trim() || piva.trim());
  }, [editId, nome, cognome, telefono, email, piva]);

  /* ─── Load existing client ─── */
  useEffect(() => {
    if (!editId || !orgId) return;
    (async () => {
      setLoading(true);
      try {
        const { data, error: err } = await supabase
          .from("clients")
          .select("*")
          .eq("id", editId)
          .eq("org_id", orgId)
          .maybeSingle();
        if (err) throw err;
        if (data) {
          setCodice(data.codice || "");
          setNome(data.nome || "");
          setCognome(data.surname || "");
          setTelefono(data.phone || "");
          setEmail(data.email || "");
          setPiva(data.piva || "");
          setCodiceFiscale(data.tax_code || "");
          setNote(data.notes || data.note || "");
          setDataNascita(data.birth_date || "");
          setSesso(data.gender || "M");
          setLuogoNascita(data.birth_place || "");
          setIsCompany(data.is_company ?? true);
          setCodiceDestinatario(data.codice_destinatario || "");
          setPec(data.pec || "");
          if (data.address || data.zip || data.city || data.province) {
            setVia(data.address || "");
            setCap(data.zip || "");
            setCitta(data.city || "");
            setProvincia(data.province || "");
            setPaese(data.country || "Italia");
          } else if (data.indirizzo) {
            setVia(data.indirizzo);
          }
        }
      } catch (e) {
        console.error("Errore caricamento cliente:", e);
        setError("Errore nel caricamento del cliente.");
      } finally {
        setLoading(false);
      }
    })();
  }, [editId, orgId]); // eslint-disable-line

  /* ─── Auto-save draft (new only) ─── */
  useEffect(() => {
    if (editId || !nome.trim()) return;
    const t = setTimeout(() => {
      try {
        setDraftStatus("saving");
        const draft = { nome, cognome, telefono, email, piva, codiceFiscale, note, via, cap, citta, provincia, paese, codiceDestinatario, pec, dataNascita, sesso, luogoNascita, isCompany, codice };
        localStorage.setItem("client_draft_new", JSON.stringify(draft));
        setDraftStatus("saved");
        setTimeout(() => setDraftStatus(""), 2000);
      } catch { setDraftStatus(""); }
    }, 2000);
    return () => clearTimeout(t);
  }, [editId, nome, cognome, telefono, email, piva, codiceFiscale, note, via, cap, citta, provincia, paese, codiceDestinatario, pec, dataNascita, sesso, luogoNascita, isCompany, codice]);

  /* ─── Load draft on mount (new only) ─── */
  useEffect(() => {
    if (editId) return;
    try {
      const raw = localStorage.getItem("client_draft_new");
      if (!raw) return;
      const d = JSON.parse(raw);
      if (d.nome) setNome(d.nome);
      if (d.cognome) setCognome(d.cognome);
      if (d.telefono) setTelefono(d.telefono);
      if (d.email) setEmail(d.email);
      if (d.piva) setPiva(d.piva);
      if (d.codiceFiscale) setCodiceFiscale(d.codiceFiscale);
      if (d.note) setNote(d.note);
      if (d.via) setVia(d.via);
      if (d.cap) setCap(d.cap);
      if (d.citta) setCitta(d.citta);
      if (d.provincia) setProvincia(d.provincia);
      if (d.codiceDestinatario) setCodiceDestinatario(d.codiceDestinatario);
      if (d.pec) setPec(d.pec);
      if (d.dataNascita) setDataNascita(d.dataNascita);
      if (d.sesso) setSesso(d.sesso);
      if (d.luogoNascita) setLuogoNascita(d.luogoNascita);
      if (d.isCompany != null) setIsCompany(d.isCompany);
      if (d.codice) setCodice(d.codice);
    } catch { /* noop */ }
  }, [editId]);

  /* ─── Pre-fill from query params (e.g. from Trasporti → Registra Cliente) ─── */
  useEffect(() => {
    if (editId) return;
    const name = searchParams.get('name');
    const phone = searchParams.get('phone');
    const emailParam = searchParams.get('email');
    const address = searchParams.get('address');
    const noteParam = searchParams.get('note');
    if (name) setNome(name);
    if (phone) setTelefono(phone);
    if (emailParam) setEmail(emailParam);
    if (address) setVia(address);
    if (noteParam) setNote(noteParam);
  }, [editId, searchParams]);

  /* ─── Keyboard shortcuts ─── */
  useEffect(() => {
    const h = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") { e.preventDefault(); save(); }
      if (e.key === "Escape") { e.preventDefault(); handleExit(); }
    };
    globalThis.addEventListener("keydown", h);
    return () => globalThis.removeEventListener("keydown", h);
  }); // eslint-disable-line

  /* ─── Beforeunload ─── */
  useEffect(() => {
    const h = (e) => { if (hasMeaningful()) { e.preventDefault(); e.returnValue = ""; } };
    globalThis.addEventListener("beforeunload", h);
    return () => globalThis.removeEventListener("beforeunload", h);
  }, [hasMeaningful]);

  /* ─── Address autocomplete ─── */
  async function handleViaChange(value) {
    setVia(value);
    if (value.length >= 3) {
      const results = await searchAddress(value);
      setAddressSuggestions(results);
      setShowAddrSugg(results.length > 0);
    } else {
      setAddressSuggestions([]);
      setShowAddrSugg(false);
    }
  }
  async function selectAddress(s) {
    try {
      // Use Google Maps detailed address resolution if available
      const details = await selectAddressWithDetails(s);
      
      setVia(details.street || s.displayName);
      if (details.zip) setCap(details.zip);
      if (details.city) setCitta(details.city);
      if (details.provinceCode) setProvincia(details.provinceCode);
      setShowAddrSugg(false);
    } catch (error) {
      // Fallback to basic address data
      setVia(s.street ? `${s.street}${s.houseNumber ? " " + s.houseNumber : ""}` : s.displayName);
      if (s.postcode) setCap(s.postcode);
      if (s.city) setCitta(s.city);
      if (s.provinceCode) setProvincia(s.provinceCode);
      setShowAddrSugg(false);
    }
  }

  /* ─── P.IVA auto-fill ─── */
  async function handlePIVAAutoFill() {
    const clean = piva.replace(/\s/g, "").toUpperCase().replace(/^IT/, "");
    if (clean.length !== 11 || !/^\d{11}$/.test(clean)) return;
    setLoadingPIVA(true);
    try {
      const d = await autoFillFromPIVA(clean);
      if (d) {
        if (d.name && !nome.trim()) setNome(d.name);
        if (d.taxCode && !codiceFiscale.trim()) setCodiceFiscale(d.taxCode);
        if (d.street && !via.trim()) setVia(d.street);
        if (d.zip && !cap.trim()) setCap(d.zip);
        if (d.city && !citta.trim()) setCitta(d.city);
        if (d.province && !provincia.trim()) setProvincia(d.province);
        if (d.codiceDestinatario && !codiceDestinatario.trim()) setCodiceDestinatario(d.codiceDestinatario);
        if (d.pec && !pec.trim()) setPec(d.pec);
      }
    } catch (err) {
      console.error("Auto-fill P.IVA error:", err);
    } finally {
      setLoadingPIVA(false);
    }
  }

  /* ─── Validation ─── */
  function validate() {
    const errs = {};
    if (!nome.trim()) errs.nome = "Nome obbligatorio";
    if (!isCompany && !cognome.trim()) errs.cognome = "Cognome obbligatorio";
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = "Email non valida";
    if (telefono && !/^[\d+()\s-]{5,}$/.test(telefono)) errs.telefono = "Telefono non valido";
    if (isCompany && !piva.trim()) errs.piva = "P.IVA obbligatoria per aziende";
    else if (isCompany && piva.trim()) { const v = validatePIVA(piva); if (!v.valid) errs.piva = v.msg; }
    if (!isCompany && !codiceFiscale.trim()) errs.codiceFiscale = "CF obbligatorio";
    if (cap && !/^\d{5}$/.test(cap)) errs.cap = "CAP: 5 cifre";
    if (provincia && !/^[A-Z]{2}$/i.test(provincia)) errs.provincia = "2 lettere";
    if (codiceDestinatario && !/^[A-Z\d]{7}$/i.test(codiceDestinatario)) errs.codiceDestinatario = "7 caratteri";
    if (pec && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(pec)) errs.pec = "PEC non valida";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  /* ─── Build indirizzo string ─── */
  function buildIndirizzo() {
    const parts = [];
    if (via.trim()) parts.push(via.trim());
    if (cap.trim() || citta.trim()) {
      const city = [cap.trim(), citta.trim()].filter(Boolean).join(" ");
      parts.push(provincia.trim() ? `${city} (${provincia.trim().toUpperCase()})` : city);
    }
    return parts.join(", ") || null;
  }

  /* ─── Save ─── */
  async function save() {
    if (!validate()) return;
    setSaving(true);
    setError(null);
    try {
      let finalCodice = codice.trim();
      if (!finalCodice && nome.trim()) finalCodice = generateClientCode(nome, cognome, isCompany);
      let finalCodiceDest = codiceDestinatario.trim();
      if (isCompany && !finalCodiceDest && !pec.trim()) finalCodiceDest = "0000000";

      const payload = {
        org_id: orgId,
        codice: finalCodice || null,
        nome: nome.trim(),
        surname: isCompany ? null : cognome.trim() || null,
        phone: telefono.trim() || null,
        phone_2: telefono2.trim() || null,
        email: email.trim() || null,
        piva: piva.trim() || null,
        tax_code: codiceFiscale.trim() || null,
        indirizzo: buildIndirizzo(),
        address: via.trim() || null,
        zip: cap.trim() || null,
        city: citta.trim() || null,
        province: provincia.trim().toUpperCase() || null,
        country: paese || "IT",
        codice_destinatario: finalCodiceDest || null,
        pec: pec.trim() || null,
        notes: note.trim() || null,
        birth_date: dataNascita || null,
        gender: isCompany ? null : sesso,
        birth_place: isCompany ? null : luogoNascita.trim() || null,
        is_company: isCompany,
        // Nuovi campi priorità alta
        tipo_documento: !isCompany ? tipoDocumento : null,
        numero_documento: !isCompany ? numeroDocumento.trim() || null : null,
        scadenza_documento: !isCompany ? scadenzaDocumento || null : null,
        categoria_cliente: categoriaCliente,
        sconto_default: scontoDefault ? parseFloat(scontoDefault) : null,
        // Nuovi campi priorità media
        modalita_pagamento: modalitaPagamento,
        giorni_dilazione: giorniDilazione ? parseInt(giorniDilazione, 10) : null,
        iban: iban.trim() || null,
        sito_web: sitoWeb.trim() || null,
        nome_referente: isCompany ? nomeReferente.trim() || null : null,
        telefono_referente: isCompany ? telefonoReferente.trim() || null : null,
        email_referente: isCompany ? emailReferente.trim() || null : null,
        // Nuovi campi priorità bassa
        consenso_privacy: consensoPrivacy,
        consenso_marketing: consensoMarketing,
        data_consenso: consensoPrivacy ? new Date().toISOString() : null,
        tags: tags.trim() || null,
        limite_fido: limiteFido ? parseFloat(limiteFido) : null,
      };

      if (editId) {
        const { error: err } = await supabase.from("clients").update(payload).eq("id", editId).eq("org_id", orgId);
        if (err) throw err;
      } else {
        const { error: err } = await supabase.from("clients").insert(payload);
        if (err) throw err;
      }
      localStorage.removeItem("client_draft_new");
      navigate(editId ? `/clienti/${editId}` : "/clienti");
    } catch (e) {
      console.error("Errore salvataggio:", e);
      setError("Errore durante il salvataggio.");
    } finally {
      setSaving(false);
    }
  }

  /* ─── Exit ─── */
  function handleExit() {
    if (hasMeaningful()) setShowExitConfirm(true);
    else navigate(editId ? `/clienti/${editId}` : "/clienti");
  }
  function confirmExit() {
    localStorage.removeItem("client_draft_new");
    setShowExitConfirm(false);
    navigate(editId ? `/clienti/${editId}` : "/clienti");
  }

  /* ─── Loading skeleton ─── */
  if (loading) {
    return (
      <div className="space-y-5 animate-pulse">
        <div className="flex items-center gap-3"><div className="h-8 w-8 bg-[#243044] rounded-lg" /><div className="h-5 w-48 bg-[#243044] rounded" /></div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-40 bg-[#1a2536] rounded-xl border border-[#243044]" />)}</div>
          <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-40 bg-[#1a2536] rounded-xl border border-[#243044]" />)}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">

      {/* ── Header sticky ── */}
      <div className="sticky top-0 z-30 -mx-4 px-4 py-2 bg-[#0a1119]/95 backdrop-blur border-b border-[#243044] flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={handleExit}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#243044] bg-[#1a2536] text-slate-400 hover:bg-[#1e2b3d] transition flex-shrink-0">
            <FiArrowLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <h1 className="text-base font-semibold text-slate-100 truncate">
              {editId ? "Modifica Cliente" : "Nuovo Cliente"}
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-[10px] text-slate-500 truncate">
                {editId ? "Aggiorna le informazioni" : (isCompany ? "Azienda / P.IVA" : "Persona fisica")}
              </p>
              {draftStatus === "saving" && (
                <span className="inline-flex items-center px-1.5 py-px rounded text-[9px] font-medium bg-blue-500/10 text-blue-400">
                  <div className="w-2 h-2 border border-blue-500 border-t-transparent rounded-full animate-spin mr-1" />Bozza...
                </span>
              )}
              {draftStatus === "saved" && (
                <span className="inline-flex items-center px-1.5 py-px rounded text-[9px] font-medium bg-emerald-500/10 text-emerald-400">
                  <FiCheck className="w-2.5 h-2.5 mr-0.5" />Bozza salvata
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Completion ring */}
          <div className="w-8 h-8 relative" title={`Completezza ${completionPercent}%`}>
            <svg className="w-8 h-8 -rotate-90" viewBox="0 0 36 36">
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#243044" strokeWidth="3" />
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none"
                stroke={completionPercent >= 80 ? "#10b981" : completionPercent >= 50 ? "#f59e0b" : "#64748b"}
                strokeWidth="3" strokeDasharray={`${completionPercent}, 100`} strokeLinecap="round" />
            </svg>
            <span className={`absolute inset-0 flex items-center justify-center text-[8px] font-semibold ${
              completionPercent >= 80 ? "text-emerald-400" : completionPercent >= 50 ? "text-amber-400" : "text-slate-500"
            }`}>{completionPercent}%</span>
          </div>
          <button onClick={handleExit}
            className="h-8 px-3 text-xs font-medium text-slate-400 bg-[#1a2536] border border-[#243044] rounded-lg hover:bg-[#1e2b3d] transition">
            Annulla
          </button>
          <button onClick={save} disabled={saving}
            className={`h-8 px-3.5 text-xs font-medium rounded-lg transition inline-flex items-center gap-1.5 ${
              saving ? "bg-[#243044] text-slate-500 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-600/20"
            }`}>
            <FiSave className="w-3.5 h-3.5" />
            {saving ? "Salvataggio..." : "Salva"}
          </button>
        </div>
      </div>

      {/* ── Error banner ── */}
      {error && (
        <div className="bg-red-500/5 rounded-xl border border-red-500/15 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <FiAlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span className="text-xs text-red-400 flex-1">{error}</span>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300"><FiX className="w-3 h-3" /></button>
          </div>
        </div>
      )}

      {/* ── Tipo Cliente + Categoria full-width (sempre visibili in cima) ── */}
      <div className="max-w-6xl mx-auto bg-[#1a2536] rounded-xl border border-[#243044] p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Selettore tipo cliente */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { val: false, label: "Persona Fisica", sub: "Privato", Icon: FiUser },
              { val: true,  label: "Azienda",        sub: "Persona giuridica", Icon: FiBriefcase },
            ].map(opt => (
              <button key={String(opt.val)} type="button" onClick={() => setIsCompany(opt.val)}
                className={`p-3 rounded-lg border-2 transition-all text-left ${
                  isCompany === opt.val
                    ? "border-blue-500 bg-blue-500/10 text-blue-400"
                    : "border-[#243044] bg-[#141c27] text-slate-400 hover:border-slate-600"
                }`}>
                <div className="flex items-center gap-2.5">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                    isCompany === opt.val ? "bg-blue-500/20" : "bg-[#243044]"
                  }`}>
                    <opt.Icon className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-xs font-medium">{opt.label}</div>
                    <div className="text-[10px] opacity-60">{opt.sub}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
          {/* Categoria + sconto inline */}
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2">
              <label className="text-[10px] text-slate-500 mb-1 block">Categoria Cliente</label>
              <select value={categoriaCliente} onChange={e => setCategoriaCliente(e.target.value)}
                className={inputCls(false)}>
                <option value="privato_occasionale">Privato Occasionale</option>
                <option value="privato_abituale">Privato Abituale</option>
                <option value="rivenditore">Rivenditore</option>
                <option value="carrozzeria">Carrozzeria</option>
                <option value="officina">Officina</option>
                <option value="demolitore">Demolitore</option>
                <option value="altro">Altro</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] text-slate-500 mb-1 block">Sconto %</label>
              <input type="number" value={scontoDefault} onChange={e => setScontoDefault(e.target.value)}
                className={inputCls(false)} placeholder="0" min="0" max="100" step="0.5" />
            </div>
          </div>
        </div>
      </div>

      {/* ── 2-column grid (max-w container) ── */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* LEFT COLUMN */}
        <div className="space-y-4">

          {/* Dati anagrafici / azienda */}
          <div className="bg-[#1a2536] rounded-xl border border-[#243044] p-4">
            <h2 className="text-xs font-semibold text-slate-200 mb-3 flex items-center gap-2 pb-2 border-b border-[#243044]">
              <FiUser className="w-3.5 h-3.5 text-blue-400" />
              {isCompany ? "Dati Azienda" : "Dati Anagrafici"}
            </h2>
            <div className="space-y-3">
              {isCompany ? (
                <>
                  <div>
                    <label className="text-[10px] text-slate-500 mb-1 block">Ragione Sociale <span className="text-red-500">*</span></label>
                    <input type="text" value={nome} onChange={e => setNome(e.target.value)}
                      className={inputCls(errors.nome)} placeholder="Es. Acme S.r.l." />
                    {errors.nome && <div className="text-[10px] text-red-400 mt-0.5">{errors.nome}</div>}
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 mb-1 block">Partita IVA <span className="text-red-500">*</span></label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input type="text" value={piva}
                          onChange={e => setPiva(e.target.value.toUpperCase())}
                          onBlur={() => {
                            // Auto-fill OpenAPI on blur se P.IVA valida e nome/indirizzo vuoti
                            const clean = piva.replace(/\s/g, "").toUpperCase().replace(/^IT/, "");
                            if (clean.length === 11 && /^\d{11}$/.test(clean) && validatePIVA(piva).valid && !loadingPIVA) {
                              if (!nome.trim() || !via.trim() || !codiceFiscale.trim()) handlePIVAAutoFill();
                            }
                          }}
                          className={`${inputCls(errors.piva)} font-mono pr-7`} placeholder="IT12345678901" />
                        {piva.trim() && (
                          <div className="absolute right-2 top-1/2 -translate-y-1/2">
                            {loadingPIVA
                              ? <div className="w-3 h-3 border border-emerald-400 border-t-transparent rounded-full animate-spin" />
                              : validatePIVA(piva).valid
                                ? <FiCheck className="w-3 h-3 text-emerald-400" />
                                : <FiAlertTriangle className="w-3 h-3 text-red-400" />}
                          </div>
                        )}
                      </div>
                      <button type="button" onClick={handlePIVAAutoFill}
                        disabled={loadingPIVA || piva.replace(/\s/g, "").replace(/^IT/i, "").length !== 11}
                        className="h-8 px-2.5 text-[10px] font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition disabled:bg-[#243044] disabled:text-slate-500 disabled:cursor-not-allowed flex items-center gap-1">
                        {loadingPIVA ? <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" /> : <FiZap className="w-3 h-3" />}
                        Auto
                      </button>
                    </div>
                    {errors.piva && <div className="text-[10px] text-red-400 mt-0.5">{errors.piva}</div>}
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 mb-1 block">Codice Fiscale</label>
                    <input type="text" value={codiceFiscale} onChange={e => setCodiceFiscale(e.target.value.toUpperCase())}
                      className={`${inputCls(false)} font-mono`} placeholder="12345678901" />
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-500 mb-1 block">Nome <span className="text-red-500">*</span></label>
                      <input type="text" value={nome} onChange={e => setNome(e.target.value)}
                        className={inputCls(errors.nome)} placeholder="Mario" />
                      {errors.nome && <div className="text-[10px] text-red-400 mt-0.5">{errors.nome}</div>}
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 mb-1 block">Cognome <span className="text-red-500">*</span></label>
                      <input type="text" value={cognome} onChange={e => setCognome(e.target.value)}
                        className={inputCls(errors.cognome)} placeholder="Rossi" />
                      {errors.cognome && <div className="text-[10px] text-red-400 mt-0.5">{errors.cognome}</div>}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-500 mb-1 block">Data Nascita</label>
                      <input type="date" value={dataNascita} onChange={e => setDataNascita(e.target.value)} className={inputCls(false)} />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 mb-1 block">Sesso</label>
                      <select value={sesso} onChange={e => setSesso(e.target.value)} className={inputCls(false)}>
                        <option value="M">Maschio</option>
                        <option value="F">Femmina</option>
                      </select>
                    </div>
                    <div className="relative">
                      <label className="text-[10px] text-slate-500 mb-1 block">Luogo Nascita</label>
                      <input type="text" value={luogoNascita}
                        onChange={async (e) => {
                          const v = e.target.value;
                          setLuogoNascita(v);
                          setLuogoNascitaCode("");
                          if (v.length >= 2) {
                            const results = await searchComuni(v);
                            setBirthPlaceSuggestions(results);
                            setShowBirthPlaceSugg(results.length > 0);
                          } else {
                            setBirthPlaceSuggestions([]);
                            setShowBirthPlaceSugg(false);
                          }
                        }}
                        onBlur={() => setTimeout(async () => {
                          if (luogoNascita && !luogoNascitaCode) {
                            const comune = await getComuneByName(luogoNascita);
                            if (comune) setLuogoNascitaCode(comune.codiceCatastale);
                          }
                          setShowBirthPlaceSugg(false);
                        }, 200)}
                        className={inputCls(false)} placeholder="Roma" />
                      {showBirthPlaceSugg && birthPlaceSuggestions.length > 0 && (
                        <div className="absolute z-50 w-full mt-1 bg-[#141c27] border border-[#243044] rounded-md max-h-56 overflow-y-auto">
                          {birthPlaceSuggestions.map((s, idx) => (
                            <button type="button" key={idx}
                              className="w-full px-3 py-1.5 hover:bg-[#1a2536] cursor-pointer text-xs border-b border-[#243044] last:border-b-0 text-left"
                              onClick={() => {
                                setLuogoNascita(s.nome);
                                setLuogoNascitaCode(s.codiceCatastale);
                                setShowBirthPlaceSugg(false);
                                setBirthPlaceSuggestions([]);
                              }}>
                              <div className="flex items-baseline justify-between gap-2">
                                <span className="font-medium text-slate-200">{s.nome}</span>
                                <span className="text-[9px] text-slate-500 font-mono">{s.codiceCatastale}</span>
                              </div>
                              <div className="text-[10px] text-slate-500 mt-0.5">
                                {s.provincia} ({s.sigla}){s.cap ? ` · CAP ${s.cap}` : ''}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                      {luogoNascitaCode && (
                        <div className="text-[10px] text-emerald-400 mt-0.5">
                          Codice catastale {luogoNascitaCode}
                          {(() => {
                            const sel = birthPlaceSuggestions.find(s => s.codiceCatastale === luogoNascitaCode);
                            return sel ? ` · ${sel.provincia} (${sel.sigla})${sel.cap ? ` · CAP ${sel.cap}` : ''}` : '';
                          })()}
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 mb-1 block">Codice Fiscale <span className="text-red-500">*</span></label>
                    <div className="flex gap-2">
                      <input type="text" value={codiceFiscale} onChange={e => setCodiceFiscale(e.target.value.toUpperCase())}
                        className={`flex-1 ${inputCls(errors.codiceFiscale)} font-mono`} placeholder="RSSMRA80A01H501U" />
                      <button type="button"
                        onClick={async () => {
                          setCalculatingCF(true);
                          try {
                            let code = luogoNascitaCode;
                            if (!code && luogoNascita) {
                              const comune = await getComuneByName(luogoNascita);
                              if (comune) {
                                code = comune.codiceCatastale;
                                setLuogoNascitaCode(code);
                              }
                            }
                            if (!code) {
                              setCalculatingCF(false);
                              return;
                            }
                            const cf = calcolaCodiceFiscale({
                              surname: cognome,
                              name: nome,
                              birthDate: dataNascita,
                              birthPlace: code,
                              gender: sesso,
                            });
                            if (cf) setCodiceFiscale(cf);
                          } catch (e) {
                            console.error("Errore calcolo CF:", e);
                          }
                          setCalculatingCF(false);
                        }}
                        disabled={calculatingCF || !nome.trim() || !cognome.trim() || !dataNascita || !luogoNascita.trim()}
                        className="h-8 px-2.5 text-[10px] font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition disabled:bg-[#243044] disabled:text-slate-500 disabled:cursor-not-allowed flex items-center gap-1">
                        {calculatingCF ? <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" /> : <FiRefreshCw className="w-3 h-3" />}
                        Calcola
                      </button>
                    </div>
                    {luogoNascitaCode && <div className="text-[10px] text-emerald-400 mt-0.5">Codice catastale: {luogoNascitaCode}</div>}
                    {errors.codiceFiscale && <div className="text-[10px] text-red-400 mt-0.5">{errors.codiceFiscale}</div>}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Documento (solo persona fisica) */}
          {!isCompany && (
            <div className="bg-[#1a2536] rounded-xl border border-[#243044] p-4">
              <h2 className="text-xs font-semibold text-slate-200 mb-3 flex items-center gap-2 pb-2 border-b border-[#243044]">
                <FiFileText className="w-3.5 h-3.5 text-purple-400" /> Documento d'identità
              </h2>
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] text-slate-500 mb-1 block">Tipo Documento</label>
                  <select value={tipoDocumento} onChange={e => setTipoDocumento(e.target.value)}
                    className={inputCls(false)}>
                    <option value="CI">Carta d'Identità</option>
                    <option value="Patente">Patente</option>
                    <option value="Passaporto">Passaporto</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-500 mb-1 block">Numero Documento</label>
                    <input type="text" value={numeroDocumento} onChange={e => setNumeroDocumento(e.target.value.toUpperCase())}
                      className={`${inputCls(false)} font-mono`} placeholder="AB1234567" />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 mb-1 block">Scadenza</label>
                    <input type="date" value={scadenzaDocumento} onChange={e => setScadenzaDocumento(e.target.value)}
                      className={inputCls(false)} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Contatti */}
          <div className="bg-[#1a2536] rounded-xl border border-[#243044] p-4">
            <h2 className="text-xs font-semibold text-slate-200 mb-3 flex items-center gap-2 pb-2 border-b border-[#243044]">
              <FiPhone className="w-3.5 h-3.5 text-cyan-400" /> Contatti
            </h2>
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-500 mb-1 block">Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    className={inputCls(errors.email)} placeholder="cliente@esempio.it" />
                  {errors.email && <div className="text-[10px] text-red-400 mt-0.5">{errors.email}</div>}
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 mb-1 block">Telefono</label>
                  <input type="tel" value={telefono} onChange={e => setTelefono(e.target.value)}
                    className={inputCls(errors.telefono)} placeholder="+39 123 456 7890" />
                  {errors.telefono && <div className="text-[10px] text-red-400 mt-0.5">{errors.telefono}</div>}
                </div>
              </div>
              <div>
                <label className="text-[10px] text-slate-500 mb-1 block">Telefono 2 (opzionale)</label>
                <input type="tel" value={telefono2} onChange={e => setTelefono2(e.target.value)}
                  className={inputCls(false)} placeholder="+39 987 654 3210" />
              </div>
              {isCompany && (
                <div>
                  <label className="text-[10px] text-slate-500 mb-1 block">Sito Web</label>
                  <input type="url" value={sitoWeb} onChange={e => setSitoWeb(e.target.value)}
                    className={inputCls(false)} placeholder="https://www.esempio.it" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-4">

          {/* Indirizzo */}
          <div className="bg-[#1a2536] rounded-xl border border-[#243044] p-4">
            <h2 className="text-xs font-semibold text-slate-200 mb-3 flex items-center gap-2 pb-2 border-b border-[#243044]">
              <FiMapPin className="w-3.5 h-3.5 text-emerald-400" /> Indirizzo
            </h2>
            <div className="space-y-3">
              <div className="relative">
                <label className="text-[10px] text-slate-500 mb-1 block">Via / Indirizzo</label>
                <input type="text" value={via}
                  onChange={e => handleViaChange(e.target.value)}
                  onBlur={() => setTimeout(() => setShowAddrSugg(false), 200)}
                  className={inputCls(false)} placeholder="Via Roma 1" />
                {showAddrSugg && addressSuggestions.length > 0 && (
                  <div className="absolute z-20 w-full mt-1 bg-[#141c27] border border-[#243044] rounded-lg max-h-40 overflow-y-auto shadow-xl">
                    {addressSuggestions.map((s, i) => (
                      <button key={`addr-${i}`} type="button" onClick={() => selectAddress(s)}
                        className="w-full px-3 py-1.5 text-left hover:bg-[#1a2536] transition border-b border-[#243044] last:border-b-0">
                        {/* Google Maps format: main_text + secondary_text */}
                        {s._googleMaps ? (
                          <>
                            <div className="text-xs text-slate-200 font-medium">{s.main_text}</div>
                            <div className="text-xs text-slate-500">{s.secondary_text}</div>
                          </>
                        ) : (
                          <>
                            {/* Fallback format: displayName or street + details */}
                            <div className="text-xs text-slate-200 font-medium">
                              {s.displayName || `${s.street || ''} ${s.houseNumber || ''}`.trim()}
                            </div>
                            <div className="text-xs text-slate-500">
                              {s.postcode && s.city ? (
                                `${s.postcode} ${s.city}${s.provinceCode ? ` (${s.provinceCode})` : ''}`
                              ) : (
                                s.city || s.secondary_text || ''
                              )}
                            </div>
                          </>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] text-slate-500 mb-1 block">CAP</label>
                  <input type="text" value={cap} onChange={e => setCap(e.target.value.replace(/\D/g, "").slice(0, 5))}
                    className={`${inputCls(errors.cap)} font-mono`} placeholder="00100" maxLength={5} />
                  {errors.cap && <div className="text-[10px] text-red-400 mt-0.5">{errors.cap}</div>}
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 mb-1 block">Città</label>
                  <input type="text" value={citta} onChange={e => setCitta(e.target.value)} className={inputCls(false)} placeholder="Roma" />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 mb-1 block">Prov.</label>
                  <input type="text" value={provincia}
                    onChange={e => setProvincia(e.target.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 2))}
                    className={`${inputCls(errors.provincia)} font-mono uppercase`} placeholder="RM" maxLength={2} />
                  {errors.provincia && <div className="text-[10px] text-red-400 mt-0.5">{errors.provincia}</div>}
                </div>
              </div>
            </div>
          </div>

          {/* SDI */}
          <div className="bg-[#1a2536] rounded-xl border border-[#243044] p-4">
            <h2 className="text-xs font-semibold text-slate-200 mb-3 flex items-center gap-2 pb-2 border-b border-[#243044]">
              <FiZap className="w-3.5 h-3.5 text-amber-400" /> Fatturazione Elettronica (SDI)
            </h2>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-slate-500 mb-1 block">Codice Destinatario</label>
                <input type="text" value={codiceDestinatario}
                  onChange={e => setCodiceDestinatario(e.target.value.toUpperCase().replace(/[^A-Z\d]/g, "").slice(0, 7))}
                  className={`${inputCls(errors.codiceDestinatario)} font-mono uppercase`} placeholder="0000000" maxLength={7} />
                {errors.codiceDestinatario && <div className="text-[10px] text-red-400 mt-0.5">{errors.codiceDestinatario}</div>}
              </div>
              <div>
                <label className="text-[10px] text-slate-500 mb-1 block">PEC</label>
                <input type="email" value={pec} onChange={e => setPec(e.target.value.toLowerCase())}
                  className={inputCls(errors.pec)} placeholder="azienda@pec.it" />
                {errors.pec && <div className="text-[10px] text-red-400 mt-0.5">{errors.pec}</div>}
              </div>
              {!codiceDestinatario.trim() && !pec.trim() && isCompany && (
                <div className="flex items-start gap-2 p-2 rounded-lg bg-amber-500/5 border border-amber-500/10">
                  <FiInfo className="w-3 h-3 text-amber-400 mt-0.5 flex-shrink-0" />
                  <p className="text-[9px] text-amber-400/80">
                    Senza Codice Destinatario o PEC verrà usato <span className="font-mono font-medium">0000000</span>.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Dati Commerciali */}
          <div className="bg-[#1a2536] rounded-xl border border-[#243044] p-4">
            <h2 className="text-xs font-semibold text-slate-200 mb-3 flex items-center gap-2 pb-2 border-b border-[#243044]">
              <FiDollarSign className="w-3.5 h-3.5 text-yellow-400" /> Dati Commerciali
            </h2>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-500 mb-1 block">Modalità Pagamento</label>
                  <select value={modalitaPagamento} onChange={e => setModalitaPagamento(e.target.value)}
                    className={inputCls(false)}>
                    <option value="contanti">Contanti</option>
                    <option value="bonifico">Bonifico</option>
                    <option value="carta">Carta</option>
                    <option value="assegno">Assegno</option>
                    <option value="rid">RID/SDD</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 mb-1 block">Giorni Dilazione</label>
                  <input type="number" value={giorniDilazione} onChange={e => setGiorniDilazione(e.target.value)}
                    className={inputCls(false)} placeholder="0" min="0" max="365" />
                </div>
              </div>
              <div>
                <label className="text-[10px] text-slate-500 mb-1 block">IBAN (per bonifici)</label>
                <input type="text" value={iban} onChange={e => setIban(e.target.value.toUpperCase().replace(/\s/g, ""))}
                  className={`${inputCls(false)} font-mono`} placeholder="IT60X0542811101000000123456" />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 mb-1 block">Limite Fido (€)</label>
                <input type="number" value={limiteFido} onChange={e => setLimiteFido(e.target.value)}
                  className={inputCls(false)} placeholder="0.00" min="0" step="100" />
              </div>
            </div>
          </div>

          {/* Referente Aziendale (solo aziende) */}
          {isCompany && (
            <div className="bg-[#1a2536] rounded-xl border border-[#243044] p-4">
              <h2 className="text-xs font-semibold text-slate-200 mb-3 flex items-center gap-2 pb-2 border-b border-[#243044]">
                <FiUsers className="w-3.5 h-3.5 text-indigo-400" /> Referente Aziendale
              </h2>
              <div className="space-y-2">
                <div>
                  <label className="text-[10px] text-slate-500 mb-1 block">Nome Referente</label>
                  <input type="text" value={nomeReferente} onChange={e => setNomeReferente(e.target.value)}
                    className={inputCls(false)} placeholder="Mario Rossi" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-500 mb-1 block">Telefono</label>
                    <input type="tel" value={telefonoReferente} onChange={e => setTelefonoReferente(e.target.value)}
                      className={inputCls(false)} placeholder="+39 123 456 7890" />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 mb-1 block">Email</label>
                    <input type="email" value={emailReferente} onChange={e => setEmailReferente(e.target.value)}
                      className={inputCls(false)} placeholder="referente@azienda.it" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Privacy & Consensi */}
          <div className="bg-[#1a2536] rounded-xl border border-[#243044] p-4">
            <h2 className="text-xs font-semibold text-slate-200 mb-3 flex items-center gap-2 pb-2 border-b border-[#243044]">
              <FiLock className="w-3.5 h-3.5 text-rose-400" /> Privacy & Consensi
            </h2>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={consensoPrivacy} onChange={e => setConsensoPrivacy(e.target.checked)}
                  className="w-4 h-4 rounded border-[#243044] bg-[#141c27] text-blue-600 focus:ring-1 focus:ring-blue-500/30" />
                <span className="text-xs text-slate-300">Consenso trattamento dati (GDPR)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={consensoMarketing} onChange={e => setConsensoMarketing(e.target.checked)}
                  className="w-4 h-4 rounded border-[#243044] bg-[#141c27] text-blue-600 focus:ring-1 focus:ring-blue-500/30" />
                <span className="text-xs text-slate-300">Consenso marketing e comunicazioni</span>
              </label>
              <div>
                <label className="text-[10px] text-slate-500 mb-1 block">Tag / Etichette</label>
                <input type="text" value={tags} onChange={e => setTags(e.target.value)}
                  className={inputCls(false)} placeholder="vip, abituale, rivenditore" />
                <p className="text-[9px] text-slate-600 mt-1">Separa i tag con virgole</p>
              </div>
            </div>
          </div>

          {/* Codice + Note */}
          <div className="bg-[#1a2536] rounded-xl border border-[#243044] p-4">
            <h2 className="text-xs font-semibold text-slate-200 mb-3 flex items-center gap-2 pb-2 border-b border-[#243044]">
              <FiEdit3 className="w-3.5 h-3.5 text-slate-400" /> Codice & Note interne
            </h2>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-slate-500 mb-1 block">Codice Cliente</label>
                <div className="flex gap-2">
                  <input type="text" value={codice} onChange={e => setCodice(e.target.value.toUpperCase())}
                    className={`flex-1 ${inputCls(false)} font-mono`} placeholder="Auto-generato" />
                  <button type="button" onClick={() => setCodice(generateClientCode(nome, cognome, isCompany) || "")}
                    className="h-8 px-2.5 text-[10px] font-medium bg-[#243044] hover:bg-[#2d3d56] text-slate-300 rounded-lg transition flex items-center gap-1">
                    <FiRefreshCw className="w-3 h-3" /> Genera
                  </button>
                </div>
              </div>
              <div>
                <label className="text-[10px] text-slate-500 mb-1 block">Note</label>
                <textarea value={note} onChange={e => setNote(e.target.value)} rows={3}
                  className={`${inputCls(false)} resize-none h-auto py-2`}
                  placeholder="Note aggiuntive..." />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="bg-[#141c27] rounded-xl border border-[#243044] px-4 py-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-[10px] text-slate-600">
            <span><span className="text-red-500">*</span> Obbligatori</span>
            <span className="text-slate-700">|</span>
            <span><kbd className="px-1 py-px bg-[#243044] rounded text-[9px]">⌘S</kbd> Salva</span>
            <span><kbd className="px-1 py-px bg-[#243044] rounded text-[9px]">Esc</kbd> Esci</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleExit}
              className="h-7 px-3 text-[10px] font-medium text-slate-400 bg-[#1a2536] border border-[#243044] rounded-lg hover:bg-[#1e2b3d] transition">
              Annulla
            </button>
            <button onClick={save} disabled={saving}
              className={`h-7 px-3.5 text-[10px] font-medium rounded-lg transition inline-flex items-center gap-1.5 ${
                saving ? "bg-[#243044] text-slate-500 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 text-white"
              }`}>
              <FiSave className="w-3 h-3" />
              {saving ? "Salvataggio..." : "Salva Cliente"}
            </button>
          </div>
        </div>
      </div>

      {/* ── Exit confirm ── */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <button className="absolute inset-0 bg-black/60 backdrop-blur-sm border-none cursor-pointer"
            onClick={() => setShowExitConfirm(false)} aria-label="Chiudi" type="button" />
          <div className="relative w-full max-w-sm rounded-xl border border-[#243044] bg-[#1a2536] p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 bg-amber-500/10 rounded-lg flex items-center justify-center">
                <FiAlertTriangle className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-200">Modifiche non salvate</div>
                <div className="text-[10px] text-slate-500">I dati inseriti andranno persi</div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button className="h-8 px-3 text-xs font-medium text-slate-400 bg-[#141c27] border border-[#243044] rounded-lg hover:bg-[#1e2b3d] transition"
                onClick={() => setShowExitConfirm(false)}>Annulla</button>
              <button className="h-8 px-3 text-xs font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition"
                onClick={confirmExit}>Esci senza salvare</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
