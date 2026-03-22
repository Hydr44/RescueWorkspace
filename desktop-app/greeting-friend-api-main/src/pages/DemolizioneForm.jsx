// src/pages/DemolizioneForm.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FiChevronLeft, FiSave, FiSend, FiUpload, FiUser, FiMapPin, FiSettings, FiFileText, FiCheckCircle, FiAlertCircle, FiTruck, FiShield } from "react-icons/fi";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { useOrg } from "@/context/OrgContext";

// —— Badge component and validators ——
function Badge({ ok = false, warn = false, label }) {
  const cls = ok
    ? "chip chip-emerald"
    : warn
    ? "chip chip-amber"
    : "chip chip-red";
  return <span className={cls}>{label}</span>;
}

// —— Validators (very lightweight / heuristics) ——
const isNonEmpty = (s) => !!String(s || "").trim();
const validCF = (s) => /^[A-Z0-9]{16}$/i.test(String(s||"").trim());
const validCAP = (s) => /^\d{5}$/.test(String(s||"").trim());
const validProv = (s) => /^[A-Za-z]{2}$/.test(String(s||"").trim());
const digitCount = (s) => String(s||"").replace(/\D/g, "").length;
const validPhone = (s) => digitCount(s) >= 8;

const validPlate = (s) => isNonEmpty(s) && String(s).length >= 5;

// ——— Field helpers (like Clients modal) ———
function FieldLabel({ children, required=false }) {
  return (
    <div className="flex items-center gap-2 mb-1 flex-wrap">
      <span className="text-xs text-slate-400 uppercase tracking-wide font-medium">{children}</span>
      {required && <span className="chip chip-red shrink-0">*</span>}
    </div>
  );
}
function Hint({ children }) { return <div className="text-[11px] text-slate-500 mt-1">{children}</div>; }
function ErrorText({ children }) { if (!children) return null; return <div className="mt-1 text-xs text-red-400">{children}</div>; }
const ValidOk = () => (<svg className="w-4 h-4 text-emerald-500 shrink-0" viewBox="0 0 24 24" fill="none"><path d="M20 7L9 18l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>);
const ValidWarn = () => (<svg className="w-4 h-4 text-amber-500 shrink-0" viewBox="0 0 24 24" fill="none"><path d="M12 9v4m0 4h.01M10.29 3.86l-8.48 14.7A2 2 0 003.53 22h16.94a2 2 0 001.72-3.44l-8.48-14.7a2 2 0 00-3.42 0z" stroke="currentColor" strokeWidth="2"/></svg>);

const TABLE = "demolition_cases";

const EMPTY_META = {
  owner: {
    is_company: false, // nuovo campo
    name: "", birth_date: "", cf: "", birth_place: "", birth_province: "", gender: "",
    company_name: "", // per aziende
    vat: "", // P.IVA per aziende
    id_doc_type: "CI", id_doc_number: "", id_doc_issue_date: "", id_doc_expiry_date: "",
    address: "", city: "", province: "", cap: "", phone: ""
  },
  owner_docs: { ci_file_url: "", cf_file_url: "" },
  qualifica: "intestatario",
  attestazione_url: "",
  vehicle_extra: { 
    type: "autoveicolo",
    engine_code: "",
    first_registration_date: "",
    total_mass_kg: ""
  },
  docs: {
    carta_circolazione: { stato: "none", file_url: "" },
    certificato_proprieta: { stato: "none", file_url: "" }
  }
};

export default function DemolizioneForm({ mode }) {
  const supabase = supabaseBrowser();
  const { orgId } = useOrg();
  const { id } = useParams();
  const navigate = useNavigate();

  const isCreate = mode === "create";
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [checking, setChecking] = useState(false);
  const [radiating, setRadiating] = useState(false);
  const [notifying, setNotifying] = useState(false);
  const [praCheck, setPraCheck] = useState(null);
  const [radiationResult, setRadiationResult] = useState(null);
  const [transportNotifyResult, setTransportNotifyResult] = useState(null);
  const [touched, setTouched] = useState({}); // traccia campi toccati
  const [availableVehicles, setAvailableVehicles] = useState([]); // veicoli trovati
  const [searchingVehicles, setSearchingVehicles] = useState(false);
  
  // Stati per la ricerca rapida
  const [searchTarga, setSearchTarga] = useState("");
  const [searchTelaio, setSearchTelaio] = useState("");
  const [searchVehicleType, setSearchVehicleType] = useState("autoveicolo");
  const [searchIsCompany, setSearchIsCompany] = useState(false);

  // campi base
  const [targa, setTarga] = useState("");
  const [telaio, setTelaio] = useState("");
  const [marca, setMarca] = useState("");
  const [anno, setAnno] = useState("");
  const [stato, setStato] = useState("bozza");
  const [normativaApplicabile, setNormativaApplicabile] = useState("209/03");

  // fattura
  const [invType, setInvType] = useState("none");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("");
  const [invoiceTotal, setInvoiceTotal] = useState("");

  // meta ricco
  const [meta, setMeta] = useState(EMPTY_META);

  // ——— Errors map (to show under fields) ———
  const errors = useMemo(() => {
    const o = meta.owner || {};
    return {
      owner: {
        name: !isNonEmpty(o.name) ? "Campo obbligatorio." : "",
        birth_date: !isNonEmpty(o.birth_date) ? "Data di nascita obbligatoria." : "",
        birth_place: !isNonEmpty(o.birth_place) ? "Luogo di nascita obbligatorio per ACI." : "",
        birth_province: o.birth_province && !validProv(o.birth_province) ? "Provincia nascita a 2 lettere." : (!isNonEmpty(o.birth_province) ? "Provincia nascita obbligatoria." : ""),
        gender: !isNonEmpty(o.gender) ? "Sesso obbligatorio per ACI." : "",
        cf: isNonEmpty(o.cf) && !validCF(o.cf) ? "CF non valido (16 caratteri)." : (!isNonEmpty(o.cf) ? "Campo obbligatorio." : ""),
        id_doc_number: !isNonEmpty(o.id_doc_number) ? "Numero documento obbligatorio." : "",
        province: o.province && !validProv(o.province) ? "Provincia a 2 lettere (es. RM)." : "",
        cap: o.cap && !validCAP(o.cap) ? "CAP 5 cifre." : "",
        phone: o.phone && !validPhone(o.phone) ? "Telefono non valido." : "",
        address_block: (o.address || o.city || o.cap || o.province) && !(isNonEmpty(o.address) && isNonEmpty(o.city) && validProv(o.province) && validCAP(o.cap)) ? "Completa indirizzo, città, CAP (5 cifre) e provincia (2 lettere)." : "",
      },
      vehicle: {
        plate: !validPlate(targa) ? "Targa obbligatoria." : "",
        marca: !isNonEmpty(marca) ? "" : "",
      },
      docs: {
        carta: meta.docs?.carta_circolazione?.stato === "inserita" && !isNonEmpty(meta.docs?.carta_circolazione?.file_url) ? "File richiesto quando 'Inserita'." : "",
        cdp: meta.docs?.certificato_proprieta?.stato === "inserito" && !isNonEmpty(meta.docs?.certificato_proprieta?.file_url) ? "File richiesto quando 'Inserito'." : "",
      },
      invoice: invType === "external" && (!isNonEmpty(invoiceNumber) || !isNonEmpty(invoiceDate)) ? "Numero e data necessari per fattura esterna." : "",
      attestazione: ["delegato","proprietario_non_intestatario"].includes(meta.qualifica) && !isNonEmpty(meta.attestazione_url) ? "Obbligatorio per questa qualifica." : "",
    };
  }, [meta, targa, marca, invType, invoiceNumber, invoiceDate]);

  const setOwner = (k, v) => {
    setMeta(m => ({ ...m, owner: { ...m.owner, [k]: v }}));
    setTouched(t => ({ ...t, [`owner.${k}`]: true }));
  };
  const setOwnerDoc = (k, v) => setMeta(m => ({ ...m, owner_docs: { ...m.owner_docs, [k]: v }}));
  const setVehicleExtra = (k, v) => setMeta(m => ({ ...m, vehicle_extra: { ...m.vehicle_extra, [k]: v }}));
  const setQualifica = (v) => setMeta(m => ({ ...m, qualifica: v }));
  const setAttestazioneUrl = (v) => setMeta(m => ({ ...m, attestazione_url: v }));
  const setDoc = (key, patch) => setMeta(m => ({ ...m, docs: { ...m.docs, [key]: { ...m.docs[key], ...patch }}}));

  // —— Checks for badges and validation ——
  const checks = useMemo(() => {
    const o = meta.owner || {};
    const docs = meta.docs || {};
    const cc = docs.carta_circolazione || { stato: "none", file_url: "" };
    const cp = docs.certificato_proprieta || { stato: "none", file_url: "" };

    const ownerNameOk = isNonEmpty(o.name);
    const ownerCfOk = validCF(o.cf);
    const ownerDocNumOk = isNonEmpty(o.id_doc_number);
    const ownerBirthOk = isNonEmpty(o.birth_date);
    const ownerBirthPlaceOk = isNonEmpty(o.birth_place) && validProv(o.birth_province);
    const ownerGenderOk = isNonEmpty(o.gender);

    const addrOk = isNonEmpty(o.address) && isNonEmpty(o.city) && validProv(o.province) && validCAP(o.cap);
    const phoneOk = validPhone(o.phone);

    const attestReq = ["delegato","proprietario_non_intestatario"].includes(meta.qualifica);
    const attestOk = attestReq ? isNonEmpty(meta.attestazione_url) : true;

    const plateOk = validPlate(targa);
    const telaioOk = isNonEmpty(telaio) || true; // facoltativo
    const marcaOk = isNonEmpty(marca);

    const cartaOk = cc.stato === "inserita" ? isNonEmpty(cc.file_url) : cc.stato !== "none";
    const certOk  = cp.stato === "inserito" ? isNonEmpty(cp.file_url) : cp.stato !== "none";

    const invoiceOk = invType === "none" ? true : (invType === "external" ? (isNonEmpty(invoiceNumber) && isNonEmpty(invoiceDate)) : true);

    const requiredOk = plateOk && ownerNameOk && ownerCfOk && ownerDocNumOk && ownerBirthOk && ownerBirthPlaceOk && ownerGenderOk && addrOk && attestOk;

    return {
      ownerNameOk, ownerCfOk, ownerDocNumOk, ownerBirthOk, ownerBirthPlaceOk, ownerGenderOk, addrOk, phoneOk,
      attestReq, attestOk,
      plateOk, telaioOk, marcaOk,
      cartaOk, certOk,
      invoiceOk,
      requiredOk,
    };
  }, [meta, targa, telaio, marca, invType, invoiceNumber, invoiceDate]);

  // load se edit
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!orgId) return;
      if (isCreate) { setLoading(false); return; }
      const { data, error } = await supabase
        .from(TABLE)
        .select("id,org_id,targa,telaio,marca_modello,anno,stato,invoice_id,invoice_total_cents,invoice_number,invoice_date,meta")
        .eq("id", id)
        .eq("org_id", orgId)
        .maybeSingle();
      if (!alive) return;
      if (error) { alert("Impossibile caricare la pratica"); navigate("/demolizioni"); return; }
      setTarga(data?.targa || "");
      setTelaio(data?.telaio || "");
      setMarca(data?.marca_modello || "");
      setAnno(data?.anno || "");
      setStato(data?.stato || "bozza");
      setNormativaApplicabile(data?.normativa_applicabile || "209/03");
      setInvType(data?.invoice_id ? "internal" : (data?.invoice_number || data?.invoice_date) ? "external" : "none");
      setInvoiceNumber(data?.invoice_number || "");
      setInvoiceDate(data?.invoice_date || "");
      setInvoiceTotal(typeof data?.invoice_total_cents === "number" ? (data.invoice_total_cents/100).toString() : "");
      setMeta({ ...EMPTY_META, ...(data?.meta || {}) });
      setLoading(false);
    })();
    return () => { alive = false; };
  }, [orgId, isCreate, id, supabase, navigate]);

  async function save(statusOverride) {
    if (!orgId) return;
    const payload = {
      org_id: orgId,
      targa: targa || null,
      telaio: telaio || null,
      marca_modello: marca || null,
      anno: anno ? Number(anno) : null,
      stato: statusOverride || stato,
      normativa_applicabile: normativaApplicabile,
      invoice_id: invType === "internal" ? null : null, // da collegare quando avremo le fatture interne
      invoice_number: invType === "external" ? (invoiceNumber || null) : null,
      invoice_date: invType === "external" ? (invoiceDate || null) : null,
      invoice_total_cents: invoiceTotal ? Math.round(Number(invoiceTotal)*100) : null,
      meta
    };

    try {
      setSaving(true);
      if (isCreate) {
        const { data, error } = await supabase.from(TABLE).insert(payload).select("id").single();
        if (error) throw error;
        navigate(`/demolizioni/${data.id}`);
      } else {
        const { error } = await supabase.from(TABLE).update(payload).eq("id", id).eq("org_id", orgId);
        if (error) throw error;
      }
    } catch (e) {
      alert("Salvataggio non riuscito");
    } finally {
      setSaving(false);
    }
  }

  // calcolo CF (placeholder locale – in futuro useremo una lib)
  function calcolaCF() {
    // TODO: implementare correttamente o usare una libreria
    // per ora non tocco il valore: solo placeholder
    // setOwner("cf", valore_calcolato);
    alert("Calcolo CF: placeholder. Possiamo integrare una libreria dedicata.");
  }

  // Verifica PRA presso ACI
  async function verificaPRA() {
    if (!targa) { alert("Inserisci la targa prima di verificare"); return; }
    try {
      setChecking(true);
      const { data, error } = await supabase.functions.invoke("aci_check_vehicle", {
        body: { targa, telaio: telaio || undefined }
      });
      if (error) throw error;
      setPraCheck(data);
      
      // Auto-fill se dati disponibili
      if (data.data) {
        const v = data.data;
        if (!telaio && v.telaio) setTelaio(v.telaio);
        if (!marca && v.marca) setMarca(`${v.marca} ${v.modello || ''}`);
        if (!anno && v.anno_immatricolazione) setAnno(String(v.anno_immatricolazione));
        
        // Dati proprietario
        if (v.proprietario) {
          const p = v.proprietario;
          if (!meta.owner.name && p.nome) setOwner("name", `${p.nome} ${p.cognome || ''}`);
          if (!meta.owner.cf && (p.tax_code || p.codice_fiscale)) {
            setOwner("cf", p.tax_code || p.codice_fiscale);
          }
          if (p.residenza) {
            if (!meta.owner.address) setOwner("address", p.residenza.indirizzo);
            if (!meta.owner.city) setOwner("city", p.residenza.comune);
            if (!meta.owner.province) setOwner("province", p.residenza.provincia);
            if (!meta.owner.cap) setOwner("cap", p.residenza.cap);
          }
        }
      }
      
      alert(data.mock ? "Verifica completata (DATI MOCK)" : "Verifica completata con successo!");
    } catch (e) {
      console.error(e);
      alert("Errore durante la verifica PRA: " + (e.message || ""));
    } finally {
      setChecking(false);
    }
  }

  // Radiazione veicolo presso ACI
  async function radiaVeicolo() {
    if (isCreate) { alert("Salva prima la pratica"); return; }
    if (!checks.requiredOk) { alert("Completa tutti i campi obbligatori"); return; }
    if (!confirm("Confermi la radiazione definitiva del veicolo presso il PRA?")) return;
    
    try {
      setRadiating(true);
      const { data, error } = await supabase.functions.invoke("aci_radiate_vehicle", {
        body: { demolition_case_id: id }
      });
      if (error) throw error;
      setRadiationResult(data);
      
      // Ricarica pratica
      const { data: updated } = await supabase
        .from(TABLE)
        .select("stato,meta")
        .eq("id", id)
        .single();
      if (updated) {
        setStato(updated.stato);
        setMeta(m => ({ ...m, ...updated.meta }));
      }
      
      alert(data.mock ? "Radiazione completata (MOCK)" : "Radiazione inviata con successo!");
    } catch (e) {
      console.error(e);
      alert("Errore durante la radiazione: " + (e.message || ""));
    } finally {
      setRadiating(false);
    }
  }

  // Notifica Portale Trasporti
  async function notificaTrasporto() {
    if (isCreate) { alert("Salva prima la pratica"); return; }
    
    try {
      setNotifying(true);
      const { data, error } = await supabase.functions.invoke("transport_portal_notify", {
        body: { demolition_case_id: id }
      });
      if (error) throw error;
      setTransportNotifyResult(data);
      
      alert(data.mock ? "Notifica inviata (MOCK)" : "Notifica inviata al Portale Trasporti!");
    } catch (e) {
      console.error(e);
      alert("Errore durante la notifica: " + (e.message || ""));
    } finally {
      setNotifying(false);
    }
  }

  // Ricerca veicoli con targa/telaio e CF/P.IVA
  async function cercaVeicoli() {
    if (!searchTarga && !searchTelaio) {
      alert("Inserisci almeno la targa o il telaio");
      return;
    }
    
    try {
      setSearchingVehicles(true);
      const { data, error } = await supabase.functions.invoke("aci_check_vehicle", {
        body: { 
          targa: searchTarga || undefined, 
          telaio: searchTelaio || undefined,
          vehicle_type: searchVehicleType,
          is_company: searchIsCompany
        }
      });
      
      if (error) throw error;
      
      // Simulo più veicoli (in produzione l'ACI potrebbe ritornarne più di uno)
      if (data.data) {
        setAvailableVehicles([data.data]);
        if (!data.mock) {
          alert("Veicolo trovato! Selezionalo per compilare automaticamente.");
        }
      } else {
        setAvailableVehicles([]);
        alert("Nessun veicolo trovato con questi criteri");
      }
    } catch (e) {
      console.error(e);
      alert("Errore durante la ricerca: " + (e.message || ""));
    } finally {
      setSearchingVehicles(false);
    }
  }

  // Seleziona un veicolo e compila i campi
  function selezionaVeicolo(vehicle) {
    if (!vehicle) return;
    
    // Compila dati veicolo
    if (vehicle.telaio) setTelaio(vehicle.telaio);
    if (vehicle.marca) setMarca(`${vehicle.marca} ${vehicle.modello || ''}`);
    if (vehicle.anno_immatricolazione) setAnno(String(vehicle.anno_immatricolazione));
    
    // Compila dati proprietario
    if (vehicle.proprietario) {
      const p = vehicle.proprietario;
      if (!meta.owner.is_company) {
        if (p.nome) setOwner("name", `${p.nome} ${p.cognome || ''}`);
        if (p.tax_code || p.codice_fiscale) {
          setOwner("cf", p.tax_code || p.codice_fiscale);
        }
      } else {
        if (p.ragione_sociale) setOwner("company_name", p.ragione_sociale);
        if (p.partita_iva) setOwner("vat", p.partita_iva);
      }
      
      if (p.residenza) {
        if (p.residenza.indirizzo) setOwner("address", p.residenza.indirizzo);
        if (p.residenza.comune) setOwner("city", p.residenza.comune);
        if (p.residenza.provincia) setOwner("province", p.residenza.provincia);
        if (p.residenza.cap) setOwner("cap", p.residenza.cap);
      }
    }
    
    setAvailableVehicles([]);
    alert("Dati veicolo compilati! Completa i campi mancanti.");
  }

  if (loading) return <div className="p-6 text-sm text-slate-500">Caricamento…</div>;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#141c27] border-b border-[#243044]  ">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <button className="btn btn-ghost" onClick={() => navigate("/demolizioni")}>
            <FiChevronLeft className="w-5 h-5"/> 
            <span className="hidden sm:inline">Indietro</span>
          </button>
          
          <div className="flex-1 flex items-center gap-3 min-w-0">
            <FiTruck className="w-5 h-5 text-blue-400 shrink-0"/>
            <div className="font-semibold text-slate-200 truncate">
              {isCreate ? "Nuova demolizione" : `Pratica ${targa || id}`}
            </div>
            <div className="hidden lg:flex items-center gap-2">
              <Badge ok={checks.plateOk} label={checks.plateOk ? "Targa" : "Targa"} />
              <Badge ok={checks.ownerNameOk} label="Proprietario" />
              <Badge ok={checks.ownerCfOk} warn={!checks.ownerCfOk && isNonEmpty(meta.owner.cf)} label="CF" />
              <Badge ok={checks.addrOk} warn={!checks.addrOk && (isNonEmpty(meta.owner.address)||isNonEmpty(meta.owner.city))} label="Residenza" />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {!isCreate && (
              <button 
                className="btn btn-outline-indigo" 
                onClick={verificaPRA} 
                disabled={checking || !targa}
                title="Verifica dati veicolo presso il PRA"
              >
                {checking ? "..." : <FiShield className="w-4 h-4"/>} 
                <span className="hidden sm:inline">Verifica PRA</span>
              </button>
            )}
            <button className="btn btn-outline" onClick={() => save("bozza")} disabled={saving}>
              <FiSave className="w-4 h-4"/> 
              <span className="hidden sm:inline">Bozza</span>
            </button>
            <button className="btn btn-primary" onClick={() => save()} disabled={saving || !checks.requiredOk}>
              <FiSend className="w-4 h-4"/> 
              <span className="hidden sm:inline">Salva</span>
            </button>
          </div>
        </div>
      </div>

      {/* Contenuto */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Ricerca rapida veicolo */}
        <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-4">
          <div className="flex items-center gap-3 mb-3">
            <FiShield className="w-5 h-5 text-blue-400"/>
            <div>
              <h3 className="text-sm font-semibold text-slate-200">Ricerca Rapida Veicolo</h3>
              <p className="text-xs text-slate-400">Inserisci targa o telaio e seleziona il tipo di veicolo</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
            <input 
              className="rounded-md border border-[#243044] px-3 py-2 placeholder:text-slate-500 focus:ring-1 focus:ring-blue-500/40 outline-none/40 outline-none"
              placeholder="Targa (es. AB123CD)"
              value={searchTarga}
              onChange={(e)=>setSearchTarga(e.target.value.toUpperCase())}
            />
            <input 
              className="rounded-md border border-[#243044] px-3 py-2 uppercase placeholder:text-slate-500 focus:ring-1 focus:ring-blue-500/40 outline-none/40 outline-none"
              placeholder="Telaio/VIN"
              value={searchTelaio}
              onChange={(e)=>setSearchTelaio(e.target.value.toUpperCase())}
            />
            <select
              className="rounded-md border border-[#243044] px-3 py-2 focus:ring-1 focus:ring-blue-500/40 outline-none/40 outline-none bg-[#141c27]"
              value={searchVehicleType}
              onChange={(e)=>setSearchVehicleType(e.target.value)}
            >
              <option value="autoveicolo">Autoveicolo</option>
              <option value="motociclo">Motociclo</option>
              <option value="ciclomotore">Ciclomotore</option>
              <option value="rimorchio">Rimorchio</option>
              <option value="altro">Altro</option>
            </select>
            <button 
              className="btn btn-primary"
              onClick={cercaVeicoli}
              disabled={searchingVehicles}
            >
              {searchingVehicles ? "Cercando..." : " Cerca"}
            </button>
            <label className="flex items-center gap-2 text-sm justify-center">
              <input 
                type="checkbox" 
                checked={searchIsCompany}
                onChange={(e)=>setSearchIsCompany(e.target.checked)}
                className="rounded"
              />
              <span>Azienda</span>
            </label>
          </div>
          
          {availableVehicles.length > 0 && (
            <div className="mt-3 p-3 bg-[#141c27] rounded-lg border border-[#243044] ">
              <div className="text-sm font-medium mb-2">Veicoli trovati:</div>
              {availableVehicles.map((v, i) => (
                <div key={i} className="flex items-center justify-between p-2 hover:bg-[#141c27]  rounded">
                  <div className="text-sm">
                    <div className="font-medium">{v.marca} {v.modello} - {v.targa}</div>
                    <div className="text-xs text-slate-500">Telaio: {v.telaio || "N/D"} | Anno: {v.anno_immatricolazione || "N/D"}</div>
                  </div>
                  <button 
                    className="btn btn-outline-indigo btn-sm"
                    onClick={()=>selezionaVeicolo(v)}
                  >
                    Seleziona
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Sezione ACI e Portale Trasporti */}
        {!isCreate && (
          <div className="rounded-xl border border-blue-500/20 bg-purple-500/5 p-6 ">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 rounded-lg bg-blue-600">
                <FiSettings className="w-5 h-5 text-white"/>
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-200">Integrazione ACI e Portale Trasporti</h3>
                <p className="text-xs text-slate-400">Gestisci le comunicazioni ufficiali</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Verifica PRA */}
              <div className="bg-[#141c27] rounded-xl p-4 border border-[#243044]  hover:border-blue-500/20 transition-all ">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-xs font-bold text-blue-400">1</div>
                  <div className="text-sm font-medium text-slate-200">Verifica PRA (ACI)</div>
                </div>
                <button 
                  className="btn btn-outline w-full mb-2" 
                  onClick={verificaPRA}
                  disabled={checking || !targa}
                >
                  {checking ? "Verificando..." : " Verifica veicolo"}
                </button>
                {praCheck && (
                  <div className={`text-xs p-2 rounded ${praCheck.mock ? 'bg-amber-500/10' : 'bg-emerald-500/10'}`}>
                    {praCheck.mock ? " Verifica completata (dati MOCK)" : " Verificato"}
                    {praCheck.data?.stato_veicolo && <div className="mt-1">Stato: {praCheck.data.stato_veicolo}</div>}
                  </div>
                )}
              </div>

              {/* Radiazione */}
              <div className="bg-[#141c27] rounded-xl p-4 border border-[#243044]  hover:border-blue-500/20 transition-all ">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-xs font-bold text-blue-400">2</div>
                  <div className="text-sm font-medium text-slate-200">Radiazione veicolo</div>
                </div>
                <button 
                  className="btn btn-primary w-full mb-2" 
                  onClick={radiaVeicolo}
                  disabled={radiating || !checks.requiredOk || stato === 'completata'}
                >
                  {radiating ? "Radiando..." : <><FiCheckCircle className="w-4 h-4"/> Radia veicolo</>}
                </button>
                {radiationResult && (
                  <div className={`text-xs p-3 rounded-lg ${radiationResult.mock ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                    <div className="flex items-center gap-2">
                      <FiCheckCircle className="w-4 h-4"/>
                      {radiationResult.mock ? "Radiazione completata (MOCK)" : "Radiato con successo"}
                    </div>
                    {radiationResult.data?.protocollo && <div className="mt-1 font-medium">Prot: {radiationResult.data.protocollo}</div>}
                  </div>
                )}
                {meta.radiazione && (
                  <div className="text-xs p-3 rounded-lg bg-emerald-500/10 text-emerald-400 mt-2">
                    <div className="flex items-center gap-2">
                      <FiCheckCircle className="w-4 h-4"/>
                      Radiato
                    </div>
                    <div className="mt-1 font-medium">{meta.radiazione.protocollo}</div>
                  </div>
                )}
              </div>

              {/* Portale Trasporti */}
              <div className="bg-[#141c27] rounded-xl p-4 border border-[#243044]  hover:border-blue-500/20 transition-all ">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-xs font-bold text-blue-400">3</div>
                  <div className="text-sm font-medium text-slate-200">Notifica trasporti</div>
                </div>
                <button 
                  className="btn btn-outline w-full mb-2" 
                  onClick={notificaTrasporto}
                  disabled={notifying}
                >
                  {notifying ? "Notificando..." : <><FiFileText className="w-4 h-4"/> Notifica portale</>}
                </button>
                {transportNotifyResult && (
                  <div className={`text-xs p-3 rounded-lg ${transportNotifyResult.mock ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                    <div className="flex items-center gap-2">
                      <FiCheckCircle className="w-4 h-4"/>
                      {transportNotifyResult.mock ? "Notifica inviata (MOCK)" : "Notificato con successo"}
                    </div>
                    {transportNotifyResult.data?.protocollo && <div className="mt-1 font-medium">Prot: {transportNotifyResult.data.protocollo}</div>}
                  </div>
                )}
                {meta.transport_notification && (
                  <div className="text-xs p-3 rounded-lg bg-emerald-500/10 text-emerald-400 mt-2">
                    <div className="flex items-center gap-2">
                      <FiCheckCircle className="w-4 h-4"/>
                      Notificato
                    </div>
                    <div className="mt-1 font-medium">{meta.transport_notification.protocollo}</div>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-5 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <div className="flex items-start gap-3">
                <FiAlertCircle className="w-5 h-5 text-blue-400 shrink-0 mt-0.5"/>
                <div className="text-xs text-slate-300">
                  <strong className="text-blue-400">Configurazione API:</strong> Le chiamate sono in modalità MOCK. 
                  Configura i secrets Supabase (ACI_API_KEY, ACI_API_URL, ACI_CERT, TRANSPORT_PORTAL_URL, TRANSPORT_PORTAL_KEY) 
                  per collegarti ai portali reali.
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Sezione: Intestatario / Delegato */}
        <div className="rounded-xl border border-[#243044]  bg-[#141c27] p-6 ">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <FiUser className="w-5 h-5 text-emerald-600"/>
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-200">Intestatario / Delegato</h3>
                <p className="text-xs text-slate-400">Dati del proprietario del veicolo</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 justify-end">
              <Badge ok={checks.ownerNameOk} label="Nome" />
              <Badge ok={checks.ownerCfOk} warn={!checks.ownerCfOk && isNonEmpty(meta.owner.cf)} label="CF" />
              <Badge ok={checks.ownerDocNumOk} label="Doc" />
              <Badge ok={checks.addrOk} warn={!checks.addrOk && (isNonEmpty(meta.owner.address)||isNonEmpty(meta.owner.city))} label="Residenza" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Nome persona o azienda */}
            {!meta.owner.is_company ? (
              <>
                <div>
                  <FieldLabel required>Nome Cognome</FieldLabel>
                  <div className="flex items-center gap-2">
                    <input
                      className="w-full rounded-md border border-[#243044] px-3 py-2 placeholder:text-slate-500 focus:ring-1 focus:ring-blue-500/40 outline-none/40/40 outline-none"
                      value={meta.owner.name}
                      onChange={(e)=>setOwner("name", e.target.value)}
                      placeholder="Mario Rossi"
                    />
                    {checks.ownerNameOk ? <ValidOk/> : <ValidWarn/>}
                  </div>
                  <ErrorText>{errors.owner.name}</ErrorText>
                </div>
                
                <div>
                  <FieldLabel required>Codice Fiscale</FieldLabel>
                  <div className="flex items-center gap-2">
                    <input
                      className="w-full rounded-md border border-[#243044] px-3 py-2 uppercase placeholder:text-slate-500 focus:ring-1 focus:ring-blue-500/40 outline-none/40/40 outline-none"
                      value={meta.owner.cf}
                      onChange={(e)=>setOwner("cf", e.target.value.toUpperCase())}
                      onBlur={()=>setTouched(t=>({...t,'owner.cf':true}))}
                      placeholder="RSSMRA80A01H501U"
                    />
                    <button className="btn btn-outline" onClick={calcolaCF} title="Calcola CF">CF</button>
                    {checks.ownerCfOk ? <ValidOk/> : <ValidWarn/>}
                  </div>
                  {touched['owner.cf'] && <ErrorText>{errors.owner.cf}</ErrorText>}
                </div>
              </>
            ) : (
              <>
                <div>
                  <FieldLabel required>Ragione Sociale</FieldLabel>
                  <div className="flex items-center gap-2">
                    <input
                      className="w-full rounded-md border border-[#243044] px-3 py-2 placeholder:text-slate-500 focus:ring-1 focus:ring-blue-500/40 outline-none/40/40 outline-none"
                      value={meta.owner.company_name}
                      onChange={(e)=>setOwner("company_name", e.target.value)}
                      placeholder="Officina Auto SRL"
                    />
                    {isNonEmpty(meta.owner.company_name) ? <ValidOk/> : <ValidWarn/>}
                  </div>
                  <ErrorText>{!isNonEmpty(meta.owner.company_name) ? "Campo obbligatorio" : ""}</ErrorText>
                </div>
                
                <div>
                  <FieldLabel required>Partita IVA</FieldLabel>
                  <div className="flex items-center gap-2">
                    <input
                      className="w-full rounded-md border border-[#243044] px-3 py-2 placeholder:text-slate-500 focus:ring-1 focus:ring-blue-500/40 outline-none/40/40 outline-none"
                      value={meta.owner.vat}
                      onChange={(e)=>setOwner("vat", e.target.value)}
                      placeholder="12345678901"
                      maxLength={11}
                    />
                    {meta.owner.vat && meta.owner.vat.length === 11 ? <ValidOk/> : <ValidWarn/>}
                  </div>
                  <ErrorText>{meta.owner.vat && meta.owner.vat.length !== 11 ? "P.IVA deve essere 11 cifre" : ""}</ErrorText>
                </div>
              </>
            )}

            {/* Data di nascita */}
            <div>
              <FieldLabel required>Data di nascita</FieldLabel>
              <div className="flex items-center gap-2">
                <input type="date"
                  className="w-full rounded-md border border-[#243044] px-3 py-2 focus:ring-1 focus:ring-blue-500/40 outline-none/40/40 outline-none"
                  value={meta.owner.birth_date}
                  onChange={(e)=>setOwner("birth_date", e.target.value)}
                />
                {checks.ownerBirthOk ? <ValidOk/> : <ValidWarn/>}
              </div>
              <ErrorText>{errors.owner.birth_date}</ErrorText>
            </div>

            {/* Luogo di nascita */}
            <div>
              <FieldLabel required>Luogo di nascita</FieldLabel>
              <div className="flex items-center gap-2">
                <input
                  className="w-full rounded-md border border-[#243044] px-3 py-2 focus:ring-1 focus:ring-blue-500/40 outline-none/40/40 outline-none"
                  value={meta.owner.birth_place}
                  onChange={(e)=>setOwner("birth_place", e.target.value)}
                  placeholder="es. Roma"
                />
                {checks.ownerBirthPlaceOk ? <ValidOk/> : <ValidWarn/>}
              </div>
              <ErrorText>{errors.owner.birth_place}</ErrorText>
              <Hint>Obbligatorio per ACI</Hint>
            </div>

            {/* Provincia nascita + Sesso */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <FieldLabel required>Prov. nascita</FieldLabel>
                <div className="flex items-center gap-2">
                  <input
                    className="w-full rounded-md border border-[#243044] px-3 py-2 uppercase focus:ring-1 focus:ring-blue-500/40 outline-none/40/40 outline-none"
                    value={meta.owner.birth_province}
                    onChange={(e)=>setOwner("birth_province", e.target.value.toUpperCase())}
                    placeholder="RM"
                    maxLength={2}
                  />
                  {checks.ownerBirthPlaceOk ? <ValidOk/> : <ValidWarn/>}
                </div>
                <ErrorText>{errors.owner.birth_province}</ErrorText>
              </div>
              <div>
                <FieldLabel required>Sesso</FieldLabel>
                <div className="flex items-center gap-2">
                  <select
                    className="w-full rounded-md border border-[#243044] px-3 py-2 focus:ring-1 focus:ring-blue-500/40 outline-none/40/40 outline-none"
                    value={meta.owner.gender}
                    onChange={(e)=>setOwner("gender", e.target.value)}
                  >
                    <option value="">-</option>
                    <option value="M">M</option>
                    <option value="F">F</option>
                  </select>
                  {checks.ownerGenderOk ? <ValidOk/> : <ValidWarn/>}
                </div>
                <ErrorText>{errors.owner.gender}</ErrorText>
              </div>
            </div>

            {/* Codice fiscale */}
            <div>
              <FieldLabel required>Codice fiscale</FieldLabel>
              <div className="flex items-center gap-2">
                <input
                  className={`w-full rounded-md border ${touched['owner.cf'] && !checks.ownerCfOk ? "border-red-500" : "border-[#243044]"} px-3 py-2 uppercase focus:ring-1 focus:ring-blue-500/40 outline-none/40/40 outline-none`}
                  value={meta.owner.cf}
                  onChange={(e)=>setOwner("cf", e.target.value.toUpperCase())}
                  onBlur={()=>setTouched(t=>({...t,'owner.cf':true}))}
                />
                <button className="btn btn-outline" onClick={calcolaCF} title="Calcola CF">CF</button>
                {checks.ownerCfOk ? <ValidOk/> : <ValidWarn/>}
              </div>
              {touched['owner.cf'] && <ErrorText>{errors.owner.cf}</ErrorText>}
            </div>

            {/* Documento */}
            <div>
              <FieldLabel>Documento (CI/Patente)</FieldLabel>
              <select className="w-full rounded-md border border-[#243044] px-3 py-2 focus:ring-1 focus:ring-blue-500/40 outline-none/40/40 outline-none" value={meta.owner.id_doc_type} onChange={(e)=>setOwner("id_doc_type", e.target.value)}>
                <option value="CI">Carta d'identità</option>
                <option value="PATENTE">Patente</option>
                <option value="PASSAPORTO">Passaporto</option>
              </select>
              <Hint>Facoltativo</Hint>
            </div>
            <div>
              <FieldLabel required>Numero documento</FieldLabel>
              <div className="flex items-center gap-2">
                <input
                  className="w-full rounded-md border border-[#243044] px-3 py-2 focus:ring-1 focus:ring-blue-500/40 outline-none/40/40 outline-none"
                  value={meta.owner.id_doc_number}
                  onChange={(e)=>setOwner("id_doc_number", e.target.value)}
                />
                {checks.ownerDocNumOk ? <ValidOk/> : <ValidWarn/>}
              </div>
              <ErrorText>{errors.owner.id_doc_number}</ErrorText>
            </div>
            <div>
              <FieldLabel>Data rilascio</FieldLabel>
              <input type="date" className="w-full rounded-md border border-[#243044] px-3 py-2 focus:ring-1 focus:ring-blue-500/40 outline-none/40/40 outline-none" value={meta.owner.id_doc_issue_date} onChange={(e)=>setOwner("id_doc_issue_date", e.target.value)} />
            </div>
            <div>
              <FieldLabel>Scadenza documento</FieldLabel>
              <input type="date" className="w-full rounded-md border border-[#243044] px-3 py-2 focus:ring-1 focus:ring-blue-500/40 outline-none/40/40 outline-none" value={meta.owner.id_doc_expiry_date} onChange={(e)=>setOwner("id_doc_expiry_date", e.target.value)} />
            </div>

            {/* Indirizzo */}
            <div className="sm:col-span-3 grid grid-cols-1 sm:grid-cols-5 gap-3">
              <div className="sm:col-span-2">
                <FieldLabel required>Indirizzo</FieldLabel>
                <input
                  className="w-full rounded-md border border-[#243044] px-3 py-2 focus:ring-1 focus:ring-blue-500/40 outline-none/40/40 outline-none"
                  value={meta.owner.address}
                  onChange={(e)=>setOwner("address", e.target.value)}
                  placeholder="Via/Piazza…"
                />
              </div>
              <div className="sm:col-span-2">
                <FieldLabel required>Città</FieldLabel>
                <input
                  className="w-full rounded-md border border-[#243044] px-3 py-2 focus:ring-1 focus:ring-blue-500/40 outline-none/40/40 outline-none"
                  value={meta.owner.city}
                  onChange={(e)=>setOwner("city", e.target.value)}
                />
              </div>
              <div>
                <FieldLabel required>Prov.</FieldLabel>
                <input
                  className="w-full rounded-md border border-[#243044] px-3 py-2 uppercase focus:ring-1 focus:ring-blue-500/40 outline-none/40/40 outline-none"
                  value={meta.owner.province}
                  onChange={(e)=>setOwner("province", e.target.value.toUpperCase())}
                  maxLength={2}
                />
              </div>
              <div>
                <FieldLabel required>CAP</FieldLabel>
                <input
                  className="w-full rounded-md border border-[#243044] px-3 py-2 focus:ring-1 focus:ring-blue-500/40 outline-none/40/40 outline-none"
                  value={meta.owner.cap}
                  onChange={(e)=>setOwner("cap", e.target.value)}
                  maxLength={5}
                />
              </div>
              <div className="sm:col-span-2">
                <FieldLabel>Telefono</FieldLabel>
                <div className="flex items-center gap-2">
                  <input
                    className="w-full rounded-md border border-[#243044] px-3 py-2 focus:ring-1 focus:ring-blue-500/40 outline-none/40/40 outline-none"
                    value={meta.owner.phone}
                    onChange={(e)=>setOwner("phone", e.target.value)}
                    placeholder="+39 …"
                  />
                  {checks.phoneOk ? <ValidOk/> : <ValidWarn/>}
                </div>
                <Hint>Facoltativo</Hint>
                <ErrorText>{errors.owner.phone || errors.owner.address_block}</ErrorText>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <FieldLabel required={["delegato","proprietario_non_intestatario"].includes(meta.qualifica)}>Qualifica</FieldLabel>
              <select className="w-full rounded-md border border-[#243044] px-3 py-2 focus:ring-1 focus:ring-blue-500/40 outline-none/40/40 outline-none" value={meta.qualifica} onChange={(e)=>setQualifica(e.target.value)}>
                <option value="intestatario">Intestatario</option>
                <option value="delegato">Delegato</option>
                <option value="proprietario_non_intestatario">Proprietario non intestatario</option>
              </select>
            </div>
            <div>
              <FieldLabel required={["delegato","proprietario_non_intestatario"].includes(meta.qualifica)}>Attestazione (link/file)</FieldLabel>
              <input className="w-full rounded-md border border-[#243044] px-3 py-2 focus:ring-1 focus:ring-blue-500/40 outline-none/40/40 outline-none" placeholder="URL o file (placeholder)" value={meta.attestazione_url} onChange={(e)=>setAttestazioneUrl(e.target.value)} />
              <ErrorText>{errors.attestazione}</ErrorText>
            </div>
            <div className="flex items-end">
              <button className="btn btn-outline w-full"><FiUpload/> Carica attestazione</button>
            </div>
          </div>

          {/* Allegati CI / CF */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-md border border-[#243044]  p-3 space-y-2">
              <div className="text-sm font-medium">Documento identità (scan)</div>
              <div className="flex gap-2">
                <input className="w-full rounded-md border border-[#243044] px-3 py-2 focus:ring-1 focus:ring-blue-500/40 outline-none/40/40 outline-none" placeholder="URL file (placeholder)" value={meta.owner_docs.ci_file_url} onChange={(e)=>setOwnerDoc("ci_file_url", e.target.value)} />
                <button className="btn btn-outline"><FiUpload/> Upload</button>
              </div>
            </div>
            <div className="rounded-md border border-[#243044]  p-3 space-y-2">
              <div className="text-sm font-medium">Codice Fiscale (scan)</div>
              <div className="flex gap-2">
                <input className="w-full rounded-md border border-[#243044] px-3 py-2 focus:ring-1 focus:ring-blue-500/40 outline-none/40/40 outline-none" placeholder="URL file (placeholder)" value={meta.owner_docs.cf_file_url} onChange={(e)=>setOwnerDoc("cf_file_url", e.target.value)} />
                <button className="btn btn-outline"><FiUpload/> Upload</button>
              </div>
            </div>
          </div>
        </div>

        {/* Veicolo */}
        <div className="rounded-xl border border-[#243044]  bg-[#141c27] p-6 ">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <FiTruck className="w-5 h-5 text-blue-400"/>
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-200">Veicolo</h3>
                <p className="text-xs text-slate-400">Dati identificativi del veicolo</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 justify-end">
              <Badge ok={checks.plateOk} label="Targa" />
              <Badge ok={checks.marcaOk} label="Modello" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <FieldLabel required>Targa</FieldLabel>
              <div className="flex items-center gap-2">
                <input
                  className="w-full rounded-md border border-[#243044] px-3 py-2 focus:ring-1 focus:ring-blue-500/40 outline-none/40/40 outline-none"
                  value={targa}
                  onChange={(e)=>setTarga(e.target.value)}
                />
                {checks.plateOk ? <ValidOk/> : <ValidWarn/>}
              </div>
              <ErrorText>{errors.vehicle.plate}</ErrorText>
            </div>
            <div>
              <FieldLabel>Telaio (VIN)</FieldLabel>
              <input className="w-full rounded-md border border-[#243044] px-3 py-2 uppercase placeholder:text-slate-500 focus:ring-1 focus:ring-blue-500/40 outline-none/40/40 outline-none" value={telaio} onChange={(e)=>setTelaio(e.target.value.toUpperCase())} placeholder="ZFA19900..." maxLength={17} />
              <Hint>Raccomandato per ACI</Hint>
            </div>
            <div>
              <FieldLabel>Tipo veicolo</FieldLabel>
              <select className="w-full rounded-md border border-[#243044] px-3 py-2 focus:ring-1 focus:ring-blue-500/40 outline-none/40/40 outline-none" value={meta.vehicle_extra.type} onChange={(e)=>setVehicleExtra("type", e.target.value)}>
                <option value="autoveicolo">Autoveicolo</option>
                <option value="motoveicolo">Motoveicolo</option>
                <option value="ciclomotore">Ciclomotore</option>
                <option value="rimorchio">Rimorchio</option>
                <option value="autocarro">Autocarro</option>
              </select>
              <Hint>Categoria ACI</Hint>
            </div>
            <div>
              <FieldLabel required>Normativa applicabile</FieldLabel>
              <select className="w-full rounded-md border border-[#243044] px-3 py-2 focus:ring-1 focus:ring-blue-500/40 outline-none" value={normativaApplicabile} onChange={(e)=>setNormativaApplicabile(e.target.value)}>
                <option value="209/03">D.Lgs. 209/03 — VFU (M1, N1, L)</option>
                <option value="152/06">D.Lgs. 152/06 — Rifiuti speciali (N2, N3, M2, M3…)</option>
              </select>
              <Hint>M1/N1 = auto/furgone ≤3.5t (209/03) · Veicoli pesanti e altri (152/06)</Hint>
            </div>
            <div>
              <FieldLabel>Codice motore</FieldLabel>
              <input className="w-full rounded-md border border-[#243044] px-3 py-2 focus:ring-1 focus:ring-blue-500/40 outline-none/40/40 outline-none" value={meta.vehicle_extra.engine_code} onChange={(e)=>setVehicleExtra("engine_code", e.target.value)} />
              <Hint>Facoltativo</Hint>
            </div>
            <div className="sm:col-span-2">
              <FieldLabel>Marca/Modello</FieldLabel>
              <div className="flex items-center gap-2">
                <input className="w-full rounded-md border border-[#243044] px-3 py-2 placeholder:text-slate-500 focus:ring-1 focus:ring-blue-500/40 outline-none/40/40 outline-none" value={marca} onChange={(e)=>setMarca(e.target.value)} placeholder="Fiat Panda 1.2" />
                {checks.marcaOk ? <ValidOk/> : <ValidWarn/>}
              </div>
            </div>
            <div>
              <FieldLabel>Anno immatric.</FieldLabel>
              <input type="number" className="w-full rounded-md border border-[#243044] px-3 py-2 placeholder:text-slate-500 focus:ring-1 focus:ring-blue-500/40 outline-none/40/40 outline-none" value={anno} onChange={(e)=>setAnno(e.target.value)} placeholder="2020" min="1900" max={new Date().getFullYear()} />
              <Hint>Facoltativo</Hint>
            </div>
            <div>
              <FieldLabel>Data 1ª immatric.</FieldLabel>
              <input type="date" className="w-full rounded-md border border-[#243044] px-3 py-2 focus:ring-1 focus:ring-blue-500/40 outline-none/40/40 outline-none" value={meta.vehicle_extra.first_registration_date} onChange={(e)=>setVehicleExtra("first_registration_date", e.target.value)} />
              <Hint>Richiesto da ACI</Hint>
            </div>
            <div>
              <FieldLabel>Massa (kg)</FieldLabel>
              <input type="number" className="w-full rounded-md border border-[#243044] px-3 py-2 placeholder:text-slate-500 focus:ring-1 focus:ring-blue-500/40 outline-none/40/40 outline-none" value={meta.vehicle_extra.total_mass_kg} onChange={(e)=>setVehicleExtra("total_mass_kg", e.target.value)} placeholder="1200" />
              <Hint>Massa complessiva</Hint>
            </div>
            <div>
              <FieldLabel>Stato pratica</FieldLabel>
              <select className="w-full rounded-md border border-[#243044] px-3 py-2 focus:ring-1 focus:ring-blue-500/40 outline-none/40/40 outline-none" value={stato} onChange={(e)=>setStato(e.target.value)}>
                {["bozza","documenti","inviata","completata","scartata"].map(s=> <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Documenti veicolo */}
        <div className="rounded-xl border border-[#243044]  bg-[#141c27] p-6 ">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <FiFileText className="w-5 h-5 text-purple-400"/>
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-200">Documenti veicolo</h3>
                <p className="text-xs text-slate-400">Carta di circolazione e certificato di proprietà</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 justify-end">
              <Badge ok={checks.cartaOk} label="Carta" />
              <Badge ok={checks.certOk} label="CdP" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-md border border-[#243044]  p-3 space-y-2">
              <div className="text-sm font-medium">Carta di circolazione</div>
              <select className="w-full rounded-md border border-[#243044] px-3 py-2 focus:ring-1 focus:ring-blue-500/40 outline-none/40/40 outline-none" value={meta.docs.carta_circolazione.stato} onChange={(e)=>setDoc("carta_circolazione", { stato: e.target.value })}>
                <option value="none">—</option>
                <option value="inserita">Inserita</option>
                <option value="smarrita">Smarrita</option>
              </select>
              <div className="flex gap-2">
                <input className="w-full rounded-md border border-[#243044] px-3 py-2 placeholder:text-slate-500 focus:ring-1 focus:ring-blue-500/40 outline-none/40/40 outline-none" placeholder="URL documento" value={meta.docs.carta_circolazione.file_url} onChange={(e)=>setDoc("carta_circolazione", { file_url: e.target.value })} />
                <button className="btn btn-outline"><FiUpload/> Upload</button>
              </div>
              <ErrorText>{errors.docs.carta}</ErrorText>
            </div>
            <div className="rounded-md border border-[#243044]  p-3 space-y-2">
              <div className="text-sm font-medium">Certificato di proprietà</div>
              <select className="w-full rounded-md border border-[#243044] px-3 py-2 focus:ring-1 focus:ring-blue-500/40 outline-none/40/40 outline-none" value={meta.docs.certificato_proprieta.stato} onChange={(e)=>setDoc("certificato_proprieta", { stato: e.target.value })}>
                <option value="none">—</option>
                <option value="inserito">Inserito</option>
                <option value="smarrito">Smarrito</option>
              </select>
              <div className="flex gap-2">
                <input className="w-full rounded-md border border-[#243044] px-3 py-2 placeholder:text-slate-500 focus:ring-1 focus:ring-blue-500/40 outline-none/40/40 outline-none" placeholder="URL documento" value={meta.docs.certificato_proprieta.file_url} onChange={(e)=>setDoc("certificato_proprieta", { file_url: e.target.value })} />
                <button className="btn btn-outline"><FiUpload/> Upload</button>
              </div>
              <ErrorText>{errors.docs.cdp}</ErrorText>
            </div>
          </div>
        </div>

        {/* Fattura */}
        <div className="rounded-xl border border-[#243044]  bg-[#141c27] p-6 ">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <FiFileText className="w-5 h-5 text-amber-400"/>
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-200">Fattura</h3>
                <p className="text-xs text-slate-400">Collegamento con fattura (opzionale)</p>
              </div>
            </div>
            <Badge ok={checks.invoiceOk} warn={!checks.invoiceOk && invType!=="none"} label={invType==="none" ? "Nessuna" : (checks.invoiceOk ? "OK" : "Incompleta")} />
          </div>
          <div className="flex flex-wrap gap-2 mb-4">
            <button className={`btn ${invType==="none"?"btn-primary":"btn-outline"}`} onClick={()=>setInvType("none")}>Nessuna</button>
            <button className={`btn ${invType==="external"?"btn-primary":"btn-outline"}`} onClick={()=>setInvType("external")}>Esterna</button>
            <button className={`btn ${invType==="internal"?"btn-primary":"btn-outline"}`} onClick={()=>setInvType("internal")}>Interna</button>
          </div>
          {invType === "external" && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label className="text-xs text-slate-500 space-y-1 block"><span>Numero</span>
                  <input className="w-full rounded-md border border-[#243044] px-3 py-2 focus:ring-1 focus:ring-blue-500/40 outline-none/40/40 outline-none" value={invoiceNumber} onChange={e=>setInvoiceNumber(e.target.value)} /></label>
                <label className="text-xs text-slate-500 space-y-1 block"><span>Data</span>
                  <input type="date" className="w-full rounded-md border border-[#243044] px-3 py-2 focus:ring-1 focus:ring-blue-500/40 outline-none/40/40 outline-none" value={invoiceDate} onChange={e=>setInvoiceDate(e.target.value)} /></label>
                <label className="text-xs text-slate-500 space-y-1 block"><span>Importo (€)</span>
                  <input type="number" step="0.01" className="w-full rounded-md border border-[#243044] px-3 py-2 focus:ring-1 focus:ring-blue-500/40 outline-none/40/40 outline-none" value={invoiceTotal} onChange={e=>setInvoiceTotal(e.target.value)} /></label>
              </div>
              <ErrorText>{errors.invoice}</ErrorText>
            </>
          )}
          {invType === "internal" && (
            <div className="mt-1 text-xs text-slate-500">Collega una fattura interna (quando il modulo fatture sarà attivo).</div>
          )}
        </div>
      </div>

      {/* Footer fisso azioni */}
      <div className="sticky bottom-0 bg-[#1a2536]/90 backdrop-blur border-t border-[#243044] ">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-end gap-2">
          <button className="btn btn-outline" onClick={() => navigate("/demolizioni")}>Annulla</button>
          <button className="btn btn-outline" onClick={() => save("bozza")} disabled={saving}><FiSave/> Salva bozza</button>
          <button className="btn btn-primary min-w-[10rem]" onClick={() => save()} disabled={saving || !checks.requiredOk}><FiSend/> Salva</button>
        </div>
      </div>
    </div>
  );
}