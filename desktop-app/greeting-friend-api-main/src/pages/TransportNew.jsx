/**
 * New Transport Form Page
 * Crea nuovo trasporto con pickup/dropoff, clienti e autisti
 * 
 * @author haxies
 * @created 2025
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FiArrowLeft, FiSave, FiLoader, FiUser, FiUserPlus, FiFileText, FiShield, FiAlertTriangle, FiCheck, FiMapPin, FiCalendar, FiDollarSign, FiZap } from "react-icons/fi";
import { supabaseBrowser } from "../lib/supabase-browser";
import { useOrg } from "../context/OrgContext";
import ClientSearchModal from "../components/ClientSearchModal";
import TransportMap from "../components/TransportMap";
import ClientAutocomplete from "../components/ClientAutocomplete";
import AutoSaveIndicator from "../components/AutoSaveIndicator";
import { useAutoSave } from "../hooks/useAutoSave";
import { validateTransportForm } from "../lib/validators";
import PropTypes from "prop-types";

// Componente Field riutilizzabile
function Field({ label, children, required = false, tooltip = null, error = null }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-slate-400">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
        {tooltip && (
          <span className="ml-1.5 text-slate-600 font-normal">({tooltip})</span>
        )}
      </label>
      {children}
      {error && (
        <p className="flex items-center gap-1 text-xs text-red-400">
          <FiAlertTriangle className="w-3 h-3" />
          {error}
        </p>
      )}
    </div>
  );
}

Field.propTypes = {
  label: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  required: PropTypes.bool,
  tooltip: PropTypes.string,
  error: PropTypes.string
};

export default function TransportNew() {
  const navigate = useNavigate();
  const { orgId } = useOrg();
  const supabase = supabaseBrowser();
  
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("id");
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState(null);
  const [showClientModal, setShowClientModal] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  
  const emptyForm = useMemo(() => ({
    client_id: null,
    client_code: "",
    client_name: "",
    client_phone: "",
    pickup_address: "",
    dropoff_address: "",
    pickup_coords: null,
    dropoff_coords: null,
    scheduled_date: "",
    scheduled_time: "",
    is_urgent: false,
    driver_id: null,
    vehicle_id: null,
    price: "",
    status: "new",
    notes: ""
  }), []);
  const [form, setForm] = useState({ ...emptyForm });
  const [baselineForm, setBaselineForm] = useState({ ...emptyForm });
  
  // Load drivers, vehicles and clients
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  
  const [errors, setErrors] = useState({});

  // Auto-save con hook dedicato
  const { saveState, lastSaved, error: autoSaveError } = useAutoSave(
    'transports',
    editId,
    form,
    orgId,
    { enabled: !editId && hasUnsavedChanges } // Solo in create mode
  );

  // Carica draft salvato (solo in create)
  useEffect(() => {
    if (!editId) {
      const savedDraft = localStorage.getItem('transport-draft');
      if (savedDraft) {
        try {
          const draft = JSON.parse(savedDraft);
          setForm(draft);
          // mantenere baseline come form vuoto: se esiste un draft con contenuti, l'utente ha già inserito qualcosa → prompt ok
        } catch (error) {
          console.error("Error loading draft:", error);
        }
      }
    }
  }, [editId]);

  // Rileva modifiche reali: prompt solo se form non è vuoto e differisce dalla baseline
  const isEmptyForm = useMemo(() => {
    const f = form;
    return !f.client_id && !f.client_name && !f.client_phone && !f.pickup_address && !f.dropoff_address && !f.driver_id && !f.vehicle_id && !f.price && !f.notes && !f.client_code && !f.scheduled_date && !f.scheduled_time && !f.is_urgent;
  }, [form]);

  const isEqualToBaseline = useMemo(() => {
    const keys = Object.keys(baselineForm);
    for (const k of keys) {
      if (form[k] !== baselineForm[k]) return false;
    }
    return true;
  }, [form, baselineForm]);

  useEffect(() => {
    setHasUnsavedChanges(!isEqualToBaseline && !isEmptyForm);
  }, [isEqualToBaseline, isEmptyForm]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        handleExit();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
    };

    globalThis.addEventListener("keydown", handleKeyDown);
    return () => globalThis.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Protezione uscita
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    globalThis.addEventListener("beforeunload", handleBeforeUnload);
    return () => globalThis.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Determina modalità
  useEffect(() => {
    if (editId) {
      setMode("edit");
      loadTransportData();
    } else {
      setMode("create");
    }
  }, [editId]);

  // Carica dati trasporto per modifica
  const loadTransportData = async () => {
    if (!editId) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("transports")
        .select("*")
        .eq("id", editId)
        .eq("org_id", orgId)
        .single();

      if (error) throw error;
      
      const mapped = {
        client_id: data.client_id,
        client_code: "",
        client_name: data.customer_name || "",
        client_phone: data.customer_phone || "",
        pickup_address: data.pickup_address || "",
        dropoff_address: data.dropoff_address || "",
        pickup_coords: data.pickup_coords || null,
        dropoff_coords: data.dropoff_coords || null,
        scheduled_date: "",
        scheduled_time: "",
        is_urgent: false,
        driver_id: data.driver_id,
        vehicle_id: data.vehicle_id,
        price: "",
        status: data.status || "new",
        notes: data.notes || ""
      };
      setForm(mapped);
      setBaselineForm(mapped);
      
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error("Error loading transport:", error);
      setErrors({ general: "Errore nel caricamento del trasporto" });
    } finally {
      setLoading(false);
    }
  };

  // Carica autisti e veicoli
  useEffect(() => {
    if (!orgId) return;
    
    const loadData = async () => {
      try {
        const [driversResult, vehiclesResult] = await Promise.all([
          supabase.from("staff_drivers").select("*").eq("org_id", orgId),
          supabase.from("vehicles").select("*").eq("org_id", orgId)
        ]);
        
        setDrivers(driversResult.data || []);
        setVehicles(vehiclesResult.data || []);
      } catch (error) {
        console.error("Error loading data:", error);
      }
    };
    
    loadData();
  }, [orgId, supabase]);

  // Validazione con validators centralizzati
  const validate = () => {
    const validation = validateTransportForm(form);
    setErrors(validation.errors);
    return validation.valid;
  };

  // Salva trasporto
  const handleSave = async () => {
    if (!validate()) return;
    
    try {
      setSaving(true);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simula delay
      
      const transportData = {
        org_id: orgId,
        client_id: form.client_id || null,
        customer_name: !form.client_id ? (form.client_name || null) : null,
        customer_phone: !form.client_id ? (form.client_phone || null) : null,
        pickup_address: form.pickup_address,
        dropoff_address: form.dropoff_address,
        pickup_coords: form.pickup_coords || null,
        dropoff_coords: form.dropoff_coords || null,
        driver_id: form.driver_id || null,
        vehicle_id: form.vehicle_id || null,
        status: form.status,
        notes: form.notes || null
      };
      
      if (mode === "edit") {
        const { error } = await supabase
          .from("transports")
          .update(transportData)
          .eq("id", editId);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("transports")
          .insert(transportData);
        
        if (error) throw error;
      }
      
      // Pulisci draft
      localStorage.removeItem('transport-draft');
      setHasUnsavedChanges(false);
      
      navigate("/trasporti");
    } catch (error) {
      console.error("Error saving transport:", error);
      setErrors({ general: "Errore nel salvataggio del trasporto" });
    } finally {
      setSaving(false);
    }
  };

  // Gestione uscita
  const handleExit = () => {
    if (hasUnsavedChanges) {
      setShowExitConfirm(true);
    } else {
      navigate("/trasporti");
    }
  };

  const handleConfirmExit = () => {
    localStorage.removeItem('transport-draft');
    navigate("/trasporti");
  };

  const handleCancelExit = () => {
    setShowExitConfirm(false);
  };

  // Selezione cliente (da modal o autocomplete)
  const handleClientSelect = (client) => {
    if (!client) {
      setForm(prev => ({ ...prev, client_id: null, client_code: '', client_name: '', client_phone: '' }));
      return;
    }
    setForm(prev => ({
      ...prev,
      client_id: client.id,
      client_code: client.codice || (client.number ? `CL${String(client.number).padStart(4, '0')}` : ''),
      client_name: client.nome || "",
      client_phone: client.phone || client.telefono || ""
    }));
    setShowClientModal(false);
  };

  // Registra come cliente (da customer_name/phone) e collega client_id
  const handleRegisterAsClient = () => {
    if (!form.client_name?.trim()) return;
    const ret = mode === 'edit' && editId ? `/trasporti/new?id=${editId}` : '/trasporti';
    const q = `?name=${encodeURIComponent(form.client_name.trim())}&phone=${encodeURIComponent(form.client_phone || '')}&return=${encodeURIComponent(ret)}`;
    setSaving(true);
    setTimeout(() => {
      navigate(`/clienti/nuovo${q}`);
    }, 650);
  };

  const inputCls = (err) => `w-full px-3 py-2 text-sm border rounded-lg bg-[#141c27] text-slate-200 placeholder-slate-600 focus:ring-1 focus:ring-blue-500/40 focus:border-blue-500/40 outline-none transition-colors ${err ? 'border-red-500/30' : 'border-[#243044]'}`;

  const completionPct = useMemo(() => {
    let filled = 0;
    const total = 5;
    if (form.client_name?.trim()) filled++;
    if (form.pickup_address?.trim()) filled++;
    if (form.dropoff_address?.trim()) filled++;
    if (form.driver_id) filled++;
    if (form.scheduled_date) filled++;
    return Math.round((filled / total) * 100);
  }, [form]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="ml-3 text-sm text-slate-400">Caricamento trasporto...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
        {/* Header compatto */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={handleExit} className="p-1.5 text-slate-400 hover:text-slate-200 transition-colors">
              <FiArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-slate-100">
                {mode === "edit" ? "Modifica Trasporto" : "Nuovo Trasporto"}
              </h1>
              <div className="flex items-center gap-3 mt-0.5">
                <AutoSaveIndicator 
                  state={saveState} 
                  lastSaved={lastSaved} 
                  error={autoSaveError}
                />
                <span className="text-xs text-slate-600">Completamento: {completionPct}%</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleExit} className="px-3 py-1.5 text-xs font-medium text-slate-400 bg-[#1a2536] border border-[#243044] rounded-lg hover:bg-[#243044] transition-colors">
              Annulla
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? <><FiLoader className="w-3.5 h-3.5 animate-spin" /> Salvataggio...</> : <><FiSave className="w-3.5 h-3.5" /> Salva Trasporto</>}
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-[#1a2536] rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${completionPct}%` }} />
        </div>

        {errors.general && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 flex items-center gap-2">
            <FiAlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span className="text-red-400 text-sm">{errors.general}</span>
          </div>
        )}

        {/* Layout 2 colonne: form + sidebar riepilogo */}
        <div className="grid grid-cols-3 gap-4">
          {/* Form principale - 2/3 */}
          <div className="col-span-2 space-y-4">

            {/* Sezione Cliente */}
            <div className="bg-[#1a2536] rounded-xl border border-[#243044] p-5">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-7 h-7 bg-blue-500/10 rounded-lg flex items-center justify-center">
                  <FiUser className="w-3.5 h-3.5 text-blue-400" />
                </div>
                <h2 className="text-sm font-semibold text-slate-200">Cliente</h2>
                {form.client_id && <span className="ml-auto text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 font-medium">Collegato</span>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <Field label="Nome cliente" required error={errors.client_name}>
                    <ClientAutocomplete
                      orgId={orgId}
                      value={form.client_id ? { id: form.client_id, nome: form.client_name, phone: form.client_phone } : null}
                      onSelect={handleClientSelect}
                      placeholder="Cerca per nome, codice o telefono..."
                    />
                  </Field>
                </div>
                <Field label="Telefono" error={errors.client_phone}>
                  <input type="tel" value={form.client_phone} onChange={(e) => setForm(prev => ({ ...prev, client_phone: e.target.value }))} placeholder="+39 ..." className={inputCls(errors.client_phone)} />
                </Field>
                <Field label="Codice" tooltip="opzionale">
                  <input type="text" value={form.client_code} onChange={(e) => setForm(prev => ({ ...prev, client_code: e.target.value }))} placeholder="COD-001" className={inputCls()} />
                </Field>
              </div>
            </div>

            {/* Sezione Percorso con Mappa */}
            <div className="bg-[#1a2536] rounded-xl border border-[#243044] p-5">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-7 h-7 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                  <FiMapPin className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <h2 className="text-sm font-semibold text-slate-200">Percorso</h2>
                <span className="ml-auto text-[10px] text-slate-500">Cerca o clicca sulla mappa</span>
              </div>
              <TransportMap
                pickupCoords={form.pickup_coords}
                dropoffCoords={form.dropoff_coords}
                pickupAddress={form.pickup_address}
                dropoffAddress={form.dropoff_address}
                onPickupChange={(addr) => setForm(prev => ({ ...prev, pickup_address: addr }))}
                onDropoffChange={(addr) => setForm(prev => ({ ...prev, dropoff_address: addr }))}
                onCoordsChange={(type, coords) => {
                  if (type === "pickup") setForm(prev => ({ ...prev, pickup_coords: coords }));
                  else setForm(prev => ({ ...prev, dropoff_coords: coords }));
                }}
                height="300px"
              />
              {(errors.pickup_address || errors.dropoff_address) && (
                <div className="mt-2 space-y-1">
                  {errors.pickup_address && <p className="flex items-center gap-1 text-xs text-red-400"><FiAlertTriangle className="w-3 h-3" />{errors.pickup_address}</p>}
                  {errors.dropoff_address && <p className="flex items-center gap-1 text-xs text-red-400"><FiAlertTriangle className="w-3 h-3" />{errors.dropoff_address}</p>}
                </div>
              )}
            </div>

            {/* Sezione Dettagli - griglia compatta */}
            <div className="bg-[#1a2536] rounded-xl border border-[#243044] p-5">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-7 h-7 bg-purple-500/10 rounded-lg flex items-center justify-center">
                  <FiCalendar className="w-3.5 h-3.5 text-purple-400" />
                </div>
                <h2 className="text-sm font-semibold text-slate-200">Programmazione e Dettagli</h2>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Field label="Data">
                  <input type="date" value={form.scheduled_date} onChange={(e) => setForm(prev => ({ ...prev, scheduled_date: e.target.value }))} className={inputCls()} />
                </Field>
                <Field label="Ora">
                  <input type="time" value={form.scheduled_time} onChange={(e) => setForm(prev => ({ ...prev, scheduled_time: e.target.value }))} className={inputCls()} />
                </Field>
                <Field label="Prezzo" error={errors.price}>
                  <div className="relative">
                    <FiDollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                    <input type="number" step="0.01" value={form.price} onChange={(e) => setForm(prev => ({ ...prev, price: e.target.value }))} placeholder="0.00" className={`pl-8 ${inputCls(errors.price)}`} />
                  </div>
                </Field>
              </div>
              <div className="mt-3 flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input type="checkbox" id="is_urgent" checked={form.is_urgent} onChange={(e) => setForm(prev => ({ ...prev, is_urgent: e.target.checked }))} className="w-4 h-4 text-red-500 bg-[#141c27] border-[#243044] rounded focus:ring-red-500/40 focus:ring-1" />
                  <FiZap className={`w-3.5 h-3.5 ${form.is_urgent ? 'text-red-400' : 'text-slate-500'}`} />
                  <span className={`text-xs font-medium ${form.is_urgent ? 'text-red-400' : 'text-slate-400'}`}>Urgente</span>
                </label>
              </div>
            </div>

            {/* Sezione Assegnazione + Note affiancate */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#1a2536] rounded-xl border border-[#243044] p-5">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-7 h-7 bg-amber-500/10 rounded-lg flex items-center justify-center">
                    <FiShield className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                  <h2 className="text-sm font-semibold text-slate-200">Assegnazione</h2>
                </div>
                <div className="space-y-3">
                  <Field label="Autista">
                    <select value={form.driver_id || ""} onChange={(e) => setForm(prev => ({ ...prev, driver_id: e.target.value || null }))} className={inputCls()}>
                      <option value="">Seleziona autista</option>
                      {drivers.map(d => <option key={d.id} value={d.id}>{d.nome || `Autista #${d.id}`}</option>)}
                    </select>
                  </Field>
                  <Field label="Veicolo">
                    <select value={form.vehicle_id || ""} onChange={(e) => setForm(prev => ({ ...prev, vehicle_id: e.target.value || null }))} className={inputCls()}>
                      <option value="">Seleziona veicolo</option>
                      {vehicles.map(v => <option key={v.id} value={v.id}>{v.targa || v.modello || `Veicolo #${v.id}`}</option>)}
                    </select>
                  </Field>
                </div>
              </div>
              <div className="bg-[#1a2536] rounded-xl border border-[#243044] p-5">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-7 h-7 bg-slate-500/10 rounded-lg flex items-center justify-center">
                    <FiFileText className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                  <h2 className="text-sm font-semibold text-slate-200">Note</h2>
                </div>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Note aggiuntive..."
                  rows={4}
                  className={`${inputCls()} resize-none`}
                />
              </div>
            </div>
          </div>

          {/* Sidebar riepilogo - 1/3 */}
          <div className="space-y-4">
            {/* Riepilogo live */}
            <div className="bg-[#1a2536] rounded-xl border border-[#243044] p-5 sticky top-4">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Riepilogo</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-[10px] text-slate-600 uppercase">Cliente</p>
                  <p className={`text-sm ${form.client_name ? 'text-slate-200 font-medium' : 'text-slate-600 italic'}`}>
                    {form.client_name || 'Non specificato'}
                  </p>
                  {form.client_phone && <p className="text-xs text-slate-500">{form.client_phone}</p>}
                </div>
                <div className="h-px bg-[#243044]" />
                <div>
                  <p className="text-[10px] text-slate-600 uppercase">Percorso</p>
                  <div className="mt-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                      <p className={`text-xs ${form.pickup_address ? 'text-slate-300' : 'text-slate-600 italic'}`}>
                        {form.pickup_address || 'Partenza'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <p className={`text-xs ${form.dropoff_address ? 'text-slate-300' : 'text-slate-600 italic'}`}>
                        {form.dropoff_address || 'Destinazione'}
                      </p>
                    </div>
                  </div>
                  {(form.pickup_coords || form.dropoff_coords) && (
                    <div className="mt-2">
                      <TransportMap
                        pickupCoords={form.pickup_coords}
                        dropoffCoords={form.dropoff_coords}
                        pickupAddress={form.pickup_address}
                        dropoffAddress={form.dropoff_address}
                        height="140px"
                        readOnly
                      />
                    </div>
                  )}
                </div>
                <div className="h-px bg-[#243044]" />
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-[10px] text-slate-600 uppercase">Data</p>
                    <p className={`text-xs ${form.scheduled_date ? 'text-slate-300' : 'text-slate-600'}`}>
                      {form.scheduled_date ? new Date(form.scheduled_date + 'T00:00').toLocaleDateString('it-IT', { day: '2-digit', month: 'short' }) : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-600 uppercase">Prezzo</p>
                    <p className={`text-xs ${form.price ? 'text-slate-300 font-medium' : 'text-slate-600'}`}>
                      {form.price ? `€ ${Number(form.price).toFixed(2)}` : '—'}
                    </p>
                  </div>
                </div>
                {form.is_urgent && (
                  <>
                    <div className="h-px bg-[#243044]" />
                    <div className="flex items-center gap-1.5 text-xs text-red-400 font-medium">
                      <FiZap className="w-3 h-3" /> Trasporto urgente
                    </div>
                  </>
                )}
              </div>

              {/* Azioni rapide sidebar */}
              <div className="mt-5 pt-4 border-t border-[#243044] space-y-2">
                {mode === 'edit' && !form.client_id && form.client_name?.trim() && (
                  <button
                    onClick={handleRegisterAsClient}
                    disabled={saving}
                    className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-lg hover:bg-blue-500/15 transition-colors"
                  >
                    <FiUserPlus className="w-3.5 h-3.5" /> Registra come cliente
                  </button>
                )}
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {saving ? <><FiLoader className="w-3.5 h-3.5 animate-spin" /> Salvataggio...</> : <><FiSave className="w-3.5 h-3.5" /> Salva Trasporto</>}
                </button>
                <p className="text-center text-[10px] text-slate-600 mt-1">Esc per uscire · ⌘S per salvare</p>
              </div>
            </div>
          </div>
        </div>

      {/* Client Search Modal */}
      {showClientModal && (
        <ClientSearchModal
          isOpen={showClientModal}
          onSelect={handleClientSelect}
          onClose={() => setShowClientModal(false)}
          orgId={orgId}
        />
      )}

      {/* Exit Confirmation Modal */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <button className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleCancelExit} aria-label="Chiudi modal" />
          <div className="relative w-full max-w-md rounded-xl border border-[#243044]  bg-[#141c27] p-6 ">
            <div className="text-lg font-semibold text-slate-200 mb-2">
              Modifiche non salvate
            </div>
            <div className="text-sm text-slate-400 mb-6">
              Hai modifiche non salvate. Sei sicuro di voler uscire senza salvare?
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={handleCancelExit}
                className="px-4 py-2 text-sm font-medium text-slate-300 bg-[#141c27] rounded-lg hover:bg-[#243044]  transition-colors"
              >
                Annulla
              </button>
              <button
                onClick={handleConfirmExit}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
              >
                Esci senza salvare
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}