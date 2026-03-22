// src/components/settings/GpsTrackingSettings.jsx
// Configurazione dispositivi GPS per tracking live trasporti
import { useState, useEffect, useCallback } from "react";
import { FiNavigation, FiPlus, FiTrash2, FiEdit3, FiCheck, FiX, FiRefreshCw, FiTruck, FiRadio, FiSmartphone, FiWifi } from "react-icons/fi";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { useOrg } from "@/context/OrgContext";
import { Section, Card, Field, Toggle } from "@/components/ui/SettingsUI";
import PropTypes from "prop-types";

const GPS_DEVICE_TYPES = [
  { value: "teltonika", label: "Teltonika (FMB/FMC)", desc: "Tracker OBD-II o cablato" },
  { value: "queclink", label: "Queclink", desc: "Tracker veicolare compatto" },
  { value: "concox", label: "Concox/Jimi", desc: "Tracker economico" },
  { value: "obd2", label: "OBD-II generico", desc: "Dongle OBD Bluetooth/4G" },
  { value: "mobile_app", label: "App Mobile (RescueMobile)", desc: "GPS dal telefono autista" },
  { value: "api", label: "API esterna", desc: "Integrazione custom via webhook" },
];

const PROTOCOL_OPTIONS = [
  { value: "tcp", label: "TCP (Teltonika/Queclink)" },
  { value: "http", label: "HTTP Webhook" },
  { value: "mqtt", label: "MQTT" },
  { value: "mobile", label: "App Mobile (automatico)" },
];

export default function GpsTrackingSettings({ showToast }) {
  const supabase = supabaseBrowser();
  const { orgId } = useOrg();

  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [gpsEnabled, setGpsEnabled] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30);
  const [trackingMode, setTrackingMode] = useState("active_only"); // active_only | all

  // Form state for add/edit
  const [form, setForm] = useState({
    name: "",
    device_type: "mobile_app",
    protocol: "mobile",
    device_imei: "",
    sim_number: "",
    vehicle_id: null,
    driver_id: null,
    notes: "",
    is_active: true,
  });

  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);

  const loadDevices = useCallback(async () => {
    if (!orgId) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("gps_devices")
        .select("*")
        .eq("org_id", orgId)
        .order("created_at", { ascending: false });

      if (error) {
        // Table might not exist yet
        if (error.code === "42P01") {
          setDevices([]);
          return;
        }
        throw error;
      }
      setDevices(data || []);
    } catch (err) {
      console.error("[GpsSettings] Error loading devices:", err);
      // Don't show error if table doesn't exist yet
      if (!err.message?.includes("does not exist")) {
        showToast?.("error", "Errore caricamento dispositivi GPS");
      }
      setDevices([]);
    } finally {
      setLoading(false);
    }
  }, [orgId, supabase, showToast]);

  const loadVehiclesAndDrivers = useCallback(async () => {
    if (!orgId) return;
    const [{ data: v }, { data: d }] = await Promise.all([
      supabase.from("vehicles").select("id, targa, modello").eq("org_id", orgId).order("targa"),
      supabase.from("staff_drivers").select("id, nome").eq("org_id", orgId).order("nome"),
    ]);
    setVehicles(v || []);
    setDrivers(d || []);
  }, [orgId, supabase]);

  useEffect(() => { loadDevices(); loadVehiclesAndDrivers(); }, [loadDevices, loadVehiclesAndDrivers]);

  const resetForm = () => {
    setForm({
      name: "", device_type: "mobile_app", protocol: "mobile",
      device_imei: "", sim_number: "", vehicle_id: null, driver_id: null,
      notes: "", is_active: true,
    });
    setShowAddForm(false);
    setEditingId(null);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      showToast?.("error", "Inserisci un nome per il dispositivo");
      return;
    }

    try {
      const payload = {
        org_id: orgId,
        name: form.name.trim(),
        device_type: form.device_type,
        protocol: form.protocol,
        device_imei: form.device_imei.trim() || null,
        sim_number: form.sim_number.trim() || null,
        vehicle_id: form.vehicle_id || null,
        driver_id: form.driver_id ? Number(form.driver_id) : null,
        notes: form.notes.trim() || null,
        is_active: form.is_active,
      };

      if (editingId) {
        const { error } = await supabase.from("gps_devices").update(payload).eq("id", editingId);
        if (error) throw error;
        showToast?.("success", "Dispositivo aggiornato");
      } else {
        const { error } = await supabase.from("gps_devices").insert(payload);
        if (error) throw error;
        showToast?.("success", "Dispositivo aggiunto");
      }

      resetForm();
      loadDevices();
    } catch (err) {
      console.error("[GpsSettings] Save error:", err);
      showToast?.("error", `Errore: ${err.message}`);
    }
  };

  const handleEdit = (device) => {
    setForm({
      name: device.name || "",
      device_type: device.device_type || "mobile_app",
      protocol: device.protocol || "mobile",
      device_imei: device.device_imei || "",
      sim_number: device.sim_number || "",
      vehicle_id: device.vehicle_id || null,
      driver_id: device.driver_id || null,
      notes: device.notes || "",
      is_active: device.is_active ?? true,
    });
    setEditingId(device.id);
    setShowAddForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Eliminare questo dispositivo GPS?")) return;
    try {
      const { error } = await supabase.from("gps_devices").delete().eq("id", id);
      if (error) throw error;
      showToast?.("success", "Dispositivo eliminato");
      loadDevices();
    } catch (err) {
      showToast?.("error", `Errore: ${err.message}`);
    }
  };

  const inputCls = "w-full px-3 py-1.5 text-xs border border-[#243044] rounded-lg bg-[#141c27] text-slate-200 placeholder-slate-500 focus:ring-1 focus:ring-blue-500/40 outline-none";

  return (
    <Section title="Tracking GPS" desc="Configura dispositivi GPS per il tracciamento live dei trasporti">
      <div className="space-y-4">

        {/* General Settings */}
        <Card title="Impostazioni Generali">
          <div className="space-y-3">
            <Toggle
              label="Tracking GPS attivo"
              checked={gpsEnabled}
              onChange={setGpsEnabled}
            />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Intervallo aggiornamento">
                <select value={refreshInterval} onChange={(e) => setRefreshInterval(Number(e.target.value))} className={inputCls}>
                  <option value={10}>Ogni 10 secondi</option>
                  <option value={15}>Ogni 15 secondi</option>
                  <option value={30}>Ogni 30 secondi</option>
                  <option value={60}>Ogni minuto</option>
                  <option value={120}>Ogni 2 minuti</option>
                </select>
              </Field>
              <Field label="Modalita tracking">
                <select value={trackingMode} onChange={(e) => setTrackingMode(e.target.value)} className={inputCls}>
                  <option value="active_only">Solo trasporti attivi (in viaggio)</option>
                  <option value="all">Tutti i trasporti con GPS</option>
                </select>
              </Field>
            </div>
          </div>
        </Card>

        {/* How it works */}
        <Card title="Come funziona">
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-[#141c27] rounded-lg border border-[#243044]">
              <FiSmartphone className="w-5 h-5 text-blue-400 mb-2" />
              <h4 className="text-xs font-semibold text-slate-200 mb-1">App Mobile</h4>
              <p className="text-[10px] text-slate-500 leading-relaxed">
                L&apos;autista usa RescueMobile. Il GPS del telefono invia la posizione automaticamente durante il trasporto.
              </p>
              <span className="inline-block mt-2 text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-medium">Consigliato</span>
            </div>
            <div className="p-3 bg-[#141c27] rounded-lg border border-[#243044]">
              <FiRadio className="w-5 h-5 text-amber-400 mb-2" />
              <h4 className="text-xs font-semibold text-slate-200 mb-1">Tracker Hardware</h4>
              <p className="text-[10px] text-slate-500 leading-relaxed">
                Dispositivo GPS installato sul veicolo (Teltonika, OBD-II). Invia dati via TCP/MQTT al server.
              </p>
              <span className="inline-block mt-2 text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 font-medium">Avanzato</span>
            </div>
            <div className="p-3 bg-[#141c27] rounded-lg border border-[#243044]">
              <FiWifi className="w-5 h-5 text-purple-400 mb-2" />
              <h4 className="text-xs font-semibold text-slate-200 mb-1">API / Webhook</h4>
              <p className="text-[10px] text-slate-500 leading-relaxed">
                Integra un servizio GPS esterno. I dati arrivano via HTTP webhook al nostro endpoint.
              </p>
              <span className="inline-block mt-2 text-[9px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 font-medium">Custom</span>
            </div>
          </div>
        </Card>

        {/* Devices List */}
        <Card title="Dispositivi GPS Configurati">
          <div className="space-y-2">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <FiRefreshCw className="w-4 h-4 text-slate-500 animate-spin" />
              </div>
            ) : devices.length === 0 ? (
              <div className="text-center py-6">
                <FiNavigation className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-xs text-slate-500 mb-1">Nessun dispositivo GPS configurato</p>
                <p className="text-[10px] text-slate-600">
                  Aggiungi un dispositivo per iniziare il tracking live dei trasporti.
                  <br />I trasporti senza GPS mostreranno solo la mappa statica A&rarr;B.
                </p>
              </div>
            ) : (
              devices.map((d) => (
                <div key={d.id} className="flex items-center gap-3 p-3 bg-[#141c27] rounded-lg border border-[#243044] group">
                  <div className={`w-2 h-2 rounded-full ${d.is_active ? "bg-emerald-400" : "bg-slate-600"}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-slate-200">{d.name}</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#1a2536] text-slate-500 font-mono">
                        {GPS_DEVICE_TYPES.find(t => t.value === d.device_type)?.label || d.device_type}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      {d.device_imei && <span className="text-[10px] text-slate-600">IMEI: {d.device_imei}</span>}
                      {d.vehicle_id && (
                        <span className="text-[10px] text-slate-500 flex items-center gap-1">
                          <FiTruck className="w-2.5 h-2.5" />
                          {vehicles.find(v => v.id === d.vehicle_id)?.targa || "Veicolo"}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleEdit(d)} className="p-1.5 text-slate-500 hover:text-blue-400 transition">
                      <FiEdit3 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(d.id)} className="p-1.5 text-slate-500 hover:text-red-400 transition">
                      <FiTrash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}

            {/* Add button */}
            {!showAddForm && (
              <button
                onClick={() => { resetForm(); setShowAddForm(true); }}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-lg hover:bg-blue-500/15 transition"
              >
                <FiPlus className="w-3.5 h-3.5" />
                Aggiungi Dispositivo GPS
              </button>
            )}
          </div>
        </Card>

        {/* Add/Edit Form */}
        {showAddForm && (
          <Card title={editingId ? "Modifica Dispositivo" : "Nuovo Dispositivo GPS"}>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Nome dispositivo" required>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))}
                    placeholder="es. GPS Furgone 1"
                    className={inputCls}
                  />
                </Field>
                <Field label="Tipo dispositivo">
                  <select
                    value={form.device_type}
                    onChange={(e) => {
                      const type = e.target.value;
                      setForm(p => ({
                        ...p,
                        device_type: type,
                        protocol: type === "mobile_app" ? "mobile" : type === "api" ? "http" : "tcp",
                      }));
                    }}
                    className={inputCls}
                  >
                    {GPS_DEVICE_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.label} — {t.desc}</option>
                    ))}
                  </select>
                </Field>
              </div>

              {form.device_type !== "mobile_app" && (
                <div className="grid grid-cols-3 gap-3">
                  <Field label="Protocollo">
                    <select value={form.protocol} onChange={(e) => setForm(p => ({ ...p, protocol: e.target.value }))} className={inputCls}>
                      {PROTOCOL_OPTIONS.filter(p => p.value !== "mobile").map(p => (
                        <option key={p.value} value={p.value}>{p.label}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="IMEI / ID dispositivo">
                    <input
                      type="text"
                      value={form.device_imei}
                      onChange={(e) => setForm(p => ({ ...p, device_imei: e.target.value }))}
                      placeholder="es. 352625090123456"
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Numero SIM" tooltip="opzionale">
                    <input
                      type="text"
                      value={form.sim_number}
                      onChange={(e) => setForm(p => ({ ...p, sim_number: e.target.value }))}
                      placeholder="+39 ..."
                      className={inputCls}
                    />
                  </Field>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <Field label="Veicolo associato">
                  <select value={form.vehicle_id || ""} onChange={(e) => setForm(p => ({ ...p, vehicle_id: e.target.value || null }))} className={inputCls}>
                    <option value="">Nessun veicolo</option>
                    {vehicles.map(v => <option key={v.id} value={v.id}>{v.targa || v.modello || `Veicolo #${v.id}`}</option>)}
                  </select>
                </Field>
                <Field label="Autista associato">
                  <select value={form.driver_id || ""} onChange={(e) => setForm(p => ({ ...p, driver_id: e.target.value || null }))} className={inputCls}>
                    <option value="">Nessun autista</option>
                    {drivers.map(d => <option key={d.id} value={d.id}>{d.nome || `Autista #${d.id}`}</option>)}
                  </select>
                </Field>
              </div>

              <Field label="Note">
                <input
                  type="text"
                  value={form.notes}
                  onChange={(e) => setForm(p => ({ ...p, notes: e.target.value }))}
                  placeholder="Note opzionali..."
                  className={inputCls}
                />
              </Field>

              <Toggle label="Dispositivo attivo" checked={form.is_active} onChange={(v) => setForm(p => ({ ...p, is_active: v }))} />

              {/* Endpoint info for hardware devices */}
              {form.device_type !== "mobile_app" && (
                <div className="p-3 bg-[#141c27] rounded-lg border border-[#243044]">
                  <h4 className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Configurazione Dispositivo</h4>
                  <div className="space-y-1 text-[10px] text-slate-500 font-mono">
                    {form.protocol === "tcp" && (
                      <>
                        <div>Server: <span className="text-slate-300">gps.rescuemanager.eu</span></div>
                        <div>Porta: <span className="text-slate-300">5027</span> (Teltonika) / <span className="text-slate-300">5028</span> (Queclink)</div>
                      </>
                    )}
                    {form.protocol === "http" && (
                      <div>Webhook URL: <span className="text-slate-300">https://api.rescuemanager.eu/api/gps/webhook</span></div>
                    )}
                    {form.protocol === "mqtt" && (
                      <>
                        <div>Broker: <span className="text-slate-300">mqtt.rescuemanager.eu:8883</span></div>
                        <div>Topic: <span className="text-slate-300">gps/{"{org_id}"}/{"{device_imei}"}</span></div>
                      </>
                    )}
                  </div>
                  <p className="text-[9px] text-slate-600 mt-2">
                    Configura il dispositivo hardware con questi parametri. Il server ricevera i dati GPS automaticamente.
                  </p>
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={handleSave}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition"
                >
                  <FiCheck className="w-3.5 h-3.5" />
                  {editingId ? "Aggiorna" : "Aggiungi"}
                </button>
                <button
                  onClick={resetForm}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-slate-400 bg-[#141c27] border border-[#243044] rounded-lg hover:text-slate-200 transition"
                >
                  <FiX className="w-3.5 h-3.5" />
                  Annulla
                </button>
              </div>
            </div>
          </Card>
        )}

        {/* Info box */}
        <div className="p-3 bg-blue-500/5 border border-blue-500/10 rounded-lg">
          <p className="text-[10px] text-blue-300/70 leading-relaxed">
            <strong>Nota:</strong> Solo i trasporti con un dispositivo GPS collegato (via veicolo o autista) verranno tracciati in tempo reale nella pagina Tracking GPS.
            I trasporti senza GPS mostreranno comunque la mappa statica con il percorso A&rarr;B nel riepilogo.
          </p>
        </div>
      </div>
    </Section>
  );
}

GpsTrackingSettings.propTypes = {
  showToast: PropTypes.func,
};
