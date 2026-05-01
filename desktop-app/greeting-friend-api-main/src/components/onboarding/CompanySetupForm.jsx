import { useState, useEffect, useRef, useCallback } from "react";
import { FiCheck, FiRefreshCw, FiMapPin, FiBriefcase, FiSearch, FiX } from "react-icons/fi";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { useOrg } from "@/context/OrgContext";
import PropTypes from "prop-types";
import ItalianAddressAutocomplete from "../ui/ItalianAddressAutocomplete";

const inputCls = "w-full px-3 py-2 text-sm bg-[#141c27] border border-[#243044] rounded-xl text-slate-200 focus:ring-1 focus:ring-blue-500/40 outline-none transition";
const labelCls = "text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1.5 block";

/**
 * Cerca dati aziendali italiani dalla P.IVA usando l'API openapi.it gratuita
 * Fallback: Registro Imprese / VIES check
 */
async function lookupPIVA(vat) {
  const cleanVat = vat.replace(/\D/g, "").slice(0, 11);
  if (cleanVat.length < 11) return null;

  try {
    // Usa l'API gratuita openapi.it per la ricerca dati aziendali
    const res = await fetch(`https://openapi.it/api/v1/partitaiva/${cleanVat}`, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.denominazione || data?.nome) {
        return {
          company_name: data.denominazione || `${data.nome} ${data.cognome}`,
          address: {
            street: data.indirizzo || "",
            city: data.comune || "",
            zip: data.cap || "",
            province: data.provincia || "",
            country: "IT",
          },
          tax_code: data.codice_fiscale || "",
        };
      }
    }
  } catch (e) {
    console.warn("[PIVA Lookup] openapi.it failed:", e.message);
  }

  // Fallback: prova con il servizio VIES europeo
  try {
    const res = await fetch(`https://ec.europa.eu/taxation_customs/vies/rest-api/check-vat-number`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ countryCode: "IT", vatNumber: cleanVat }),
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.valid && data.name) {
        const addressParts = (data.address || "").split("\n");
        return {
          company_name: data.name,
          address: {
            street: addressParts[0] || "",
            city: addressParts.length > 1 ? addressParts[1].replace(/\d{5}\s*/, "").trim() : "",
            zip: (addressParts.length > 1 ? addressParts[1].match(/\d{5}/)?.[0] : "") || "",
            province: "",
            country: "IT",
          },
          tax_code: "",
        };
      }
    }
  } catch (e) {
    console.warn("[PIVA Lookup] VIES failed:", e.message);
  }

  return null;
}

/**
 * P.IVA autocomplete con debounce — suggerimenti durante la digitazione
 */
function PIVAInput({ value, onChange, onDataFound, saving }) {
  const [searching, setSearching] = useState(false);
  const [found, setFound] = useState(null);
  const [error, setError] = useState("");
  const debounceRef = useRef(null);

  const doSearch = useCallback(async (vat) => {
    const clean = vat.replace(/\D/g, "");
    if (clean.length < 11) { setFound(null); setError(""); return; }
    
    setSearching(true);
    setError("");
    try {
      const result = await lookupPIVA(clean);
      if (result) {
        setFound(result);
        setError("");
      } else {
        setFound(null);
        setError("P.IVA non trovata nei registri pubblici");
      }
    } catch {
      setFound(null);
      setError("Errore durante la ricerca");
    } finally {
      setSearching(false);
    }
  }, []);

  const handleChange = useCallback((e) => {
    const raw = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
    onChange(raw);
    setFound(null);
    setError("");
    
    clearTimeout(debounceRef.current);
    const clean = raw.replace(/\D/g, "");
    if (clean.length === 11) {
      debounceRef.current = setTimeout(() => doSearch(raw), 600);
    }
  }, [onChange, doSearch]);

  const handleApply = useCallback(() => {
    if (found && onDataFound) {
      onDataFound(found);
      setFound(null);
    }
  }, [found, onDataFound]);

  return (
    <div className="space-y-2">
      <label className={labelCls}>Partita IVA</label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={value}
            onChange={handleChange}
            className={inputCls}
            placeholder="12345678901"
            maxLength={13}
          />
          {searching && (
            <FiRefreshCw className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400 animate-spin" />
          )}
        </div>
        <button
          onClick={() => doSearch(value)}
          disabled={value.replace(/\D/g, "").length < 11 || searching || saving}
          className="px-4 py-2 bg-[#1c2636] border border-[#243044] rounded-xl text-xs font-bold text-blue-400 hover:bg-blue-500/10 transition disabled:opacity-40 flex items-center gap-1.5"
        >
          <FiSearch className="w-3.5 h-3.5" />
          Cerca
        </button>
      </div>

      {error && (
        <p className="text-[10px] text-amber-400 flex items-center gap-1">
          <FiX className="w-3 h-3" /> {error}
        </p>
      )}

      {found && (
        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3 space-y-1 animate-in fade-in duration-300">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Dati trovati</span>
            <button
              onClick={handleApply}
              className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 px-2 py-1 bg-emerald-500/10 rounded-lg transition flex items-center gap-1"
            >
              <FiCheck className="w-3 h-3" /> Compila automaticamente
            </button>
          </div>
          <p className="text-sm text-slate-200 font-semibold">{found.company_name}</p>
          {found.address?.street && (
            <p className="text-xs text-slate-400">
              {found.address.street}{found.address.city ? `, ${found.address.city}` : ""}{found.address.zip ? ` (${found.address.zip})` : ""}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default function CompanySetupForm({ onComplete }) {
  const supabase = supabaseBrowser();
  const { orgId } = useOrg();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false); // false = mostra summary di conferma se dati già presenti
  const [hasPrefilledData, setHasPrefilledData] = useState(false);
  const [form, setForm] = useState({
    company_name: "",
    vat: "",
    tax_code: "",
    address: { street: "", civico: "", city: "", zip: "", province: "", country: "IT" },
    regime_fiscale: "RF01"
  });

  useEffect(() => {
    async function loadData() {
      if (!orgId) return;
      setLoading(true);
      try {
        const { data: org } = await supabase.from("orgs").select("name").eq("id", orgId).single();
        const { data: settingsRow } = await supabase
          .from("org_settings")
          .select("value")
          .eq("org_id", orgId)
          .eq("key", "company")
          .maybeSingle();

        const settings = settingsRow?.value || {};

        if (org || settings) {
          setForm({
            company_name: settings?.company_name || org?.name || "",
            vat: settings?.vat || settings?.piva || "",
            tax_code: settings?.tax_code || "",
            address: {
              street: settings?.address?.street || "",
              civico: settings?.address?.civico || "",
              city: settings?.address?.city || "",
              zip: settings?.address?.zip || "",
              province: settings?.address?.province || "",
              country: settings?.address?.country || "IT",
            },
            regime_fiscale: settings?.regime_fiscale || "RF01"
          });
          // Considero "pre-compilato" se ci sono almeno i campi minimi essenziali per fattura
          const hasEssentials = !!(settings?.company_name && (settings?.vat || settings?.piva) && settings?.address?.street && settings?.address?.city);
          setHasPrefilledData(hasEssentials);
          setEditMode(!hasEssentials); // se mancano dati essenziali, vai diretto in modifica
        }
      } catch (err) {
        console.error("[CompanySetupForm] Load error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [orgId, supabase]);

  const handlePIVADataFound = useCallback((data) => {
    setForm(prev => ({
      ...prev,
      company_name: data.company_name || prev.company_name,
      tax_code: data.tax_code || prev.tax_code,
      address: {
        street: data.address?.street || prev.address.street,
        civico: prev.address.civico || "",
        city: data.address?.city || prev.address.city,
        zip: data.address?.zip || prev.address.zip,
        province: data.address?.province || prev.address.province,
        country: data.address?.country || prev.address.country || "IT",
      },
    }));
  }, []);

  const handleSave = async () => {
    if (!orgId) return;
    setSaving(true);
    try {
      // 1. Update orgs table (name)
      await supabase.from("orgs").update({ name: form.company_name }).eq("id", orgId);
      
      // 2. Update org_settings with key='company'
      const { error } = await supabase.from("org_settings").upsert({
        org_id: orgId,
        key: "company",
        value: {
          company_name: form.company_name,
          vat: form.vat,
          tax_code: form.tax_code,
          address: form.address,
          regime_fiscale: form.regime_fiscale,
        },
        updated_at: new Date().toISOString()
      }, { onConflict: "org_id,key" });

      if (error) throw error;
      if (onComplete) onComplete();
    } catch (err) {
      console.error("[CompanySetupForm] Save error:", err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center py-10"><FiRefreshCw className="animate-spin text-blue-500" /></div>;

  // Modalità "conferma": dati già pre-compilati dal sito web → mostra summary
  if (hasPrefilledData && !editMode) {
    return (
      <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-500">
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 flex items-start gap-3">
          <FiCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-emerald-300">Dati già configurati</h4>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Hai già completato i dati aziendali dal sito web. Verifica che siano corretti, poi conferma.
            </p>
          </div>
        </div>

        <div className="bg-[#0f1622] border border-[#243044] rounded-2xl p-4 space-y-3">
          <div>
            <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Ragione Sociale</span>
            <div className="text-sm text-white font-semibold">{form.company_name || "—"}</div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">P.IVA</span>
              <div className="text-sm text-slate-200 font-mono">{form.vat || "—"}</div>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Codice Fiscale</span>
              <div className="text-sm text-slate-200 font-mono">{form.tax_code || "—"}</div>
            </div>
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Indirizzo Sede</span>
            <div className="text-sm text-slate-200">
              {[form.address.street, form.address.civico].filter(Boolean).join(" ") || "—"}<br />
              <span className="text-xs text-slate-400">
                {form.address.zip} {form.address.city}{form.address.province ? ` (${form.address.province})` : ""}
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setEditMode(true)}
            className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-slate-200 font-bold rounded-xl transition border border-white/10"
          >
            Modifica
          </button>
          <button
            type="button"
            onClick={() => onComplete?.()}
            className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2"
          >
            <FiCheck className="w-4 h-4" /> Conferma e Continua
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className={labelCls}>Ragione Sociale</label>
          <div className="relative">
            <FiBriefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input 
              type="text" 
              value={form.company_name} 
              onChange={e => setForm({...form, company_name: e.target.value})} 
              className={inputCls + " pl-10"} 
              placeholder="Nome Azienda Srl"
            />
          </div>
        </div>
        
        <div className="col-span-2">
          <PIVAInput
            value={form.vat}
            onChange={(val) => setForm(prev => ({...prev, vat: val}))}
            onDataFound={handlePIVADataFound}
            saving={saving}
          />
        </div>

        <div className="col-span-2">
          <label className={labelCls}>Codice Fiscale</label>
          <input 
            type="text" 
            value={form.tax_code} 
            onChange={e => setForm({...form, tax_code: e.target.value.toUpperCase()})} 
            className={inputCls} 
            placeholder="Codice fiscale (se diverso da P.IVA)"
            maxLength={16}
          />
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-[11px] font-bold text-slate-400 flex items-center gap-2 uppercase tracking-widest">
          <FiMapPin className="w-3 h-3" /> Indirizzo Sede Legale
        </h4>
        
        <ItalianAddressAutocomplete
          prefix="company"
          form={{
            company_indirizzo: form.address.street || "",
            company_civico: form.address.civico || "",
            company_cap: form.address.zip || "",
            company_comune_id: (form.address.city || "") + (form.address.province ? " (" + form.address.province + ")" : ""),
            company_nazione_id: form.address.country
          }}
          onChange={(key, val) => {
            if (key === 'company_indirizzo') setForm(prev => ({...prev, address: {...prev.address, street: val}}));
            if (key === 'company_civico') setForm(prev => ({...prev, address: {...prev.address, civico: val}}));
            if (key === 'company_cap') setForm(prev => ({...prev, address: {...prev.address, zip: val}}));
            if (key === 'company_nazione_id') setForm(prev => ({...prev, address: {...prev.address, country: val}}));
            if (key === 'company_comune_id') {
              const match = val.match(/(.*)\s\((.*)\)/);
              if (match) {
                setForm(prev => ({...prev, address: {...prev.address, city: match[1], province: match[2]}}));
              } else {
                setForm(prev => ({...prev, address: {...prev.address, city: val, province: ""}}));
              }
            }
          }}
        />
      </div>

      <button
        onClick={handleSave}
        disabled={saving || !form.company_name}
        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
      >
        {saving ? <FiRefreshCw className="animate-spin" /> : <FiCheck />}
        Salva e Continua
      </button>
    </div>
  );
}

CompanySetupForm.propTypes = {
  onComplete: PropTypes.func
};
