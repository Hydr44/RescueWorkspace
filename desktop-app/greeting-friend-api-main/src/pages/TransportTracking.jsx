/**
 * Transport Tracking Live Page
 * Mappa live con tutti i trasporti attivi, posizione autisti, storico percorsi
 * 
 * @author haxies
 * @created 2026
 */

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  FiNavigation, FiMapPin, FiTruck, FiUser, FiRefreshCw,
  FiFilter, FiMaximize2, FiMinimize2, FiArrowLeft,
  FiActivity, FiCheckCircle, FiRadio, FiMap
} from "react-icons/fi";
import { supabaseBrowser } from "../lib/supabase-browser";
import { useOrg } from "../context/OrgContext";

// Fix Leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

/* ─── Custom Icons ─── */
function makeIcon(color, label) {
  return new L.DivIcon({
    className: "custom-tracking-marker",
    html: `<div style="position:relative">
      <div style="width:32px;height:32px;background:${color};border:3px solid rgba(0,0,0,0.3);border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 12px ${color}80;font-size:11px;font-weight:700;color:white">
        ${label}
      </div>
      <div style="position:absolute;bottom:-4px;left:50%;transform:translateX(-50%);width:8px;height:8px;background:${color};border-radius:50%;opacity:0.4;animation:ping 1.5s infinite"></div>
    </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -20],
  });
}

const pickupIcon = new L.DivIcon({
  className: "custom-marker",
  html: `<div style="width:20px;height:20px;background:#3b82f6;border:2px solid #1e3a5f;border-radius:50%;box-shadow:0 1px 4px rgba(59,130,246,0.4)"><div style="width:6px;height:6px;background:white;border-radius:50%;margin:5px auto"></div></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

const dropoffIcon = new L.DivIcon({
  className: "custom-marker",
  html: `<div style="width:20px;height:20px;background:#10b981;border:2px solid #064e3b;border-radius:50%;box-shadow:0 1px 4px rgba(16,185,129,0.4)"><div style="width:6px;height:6px;background:white;border-radius:50%;margin:5px auto"></div></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

/* ─── Status config ─── */
const STATUS_CONFIG = {
  new: { label: "Nuovo", color: "#6366f1", bg: "bg-indigo-500/10", text: "text-indigo-400", border: "border-indigo-500/20" },
  assigned: { label: "Assegnato", color: "#f59e0b", bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20" },
  enroute: { label: "In Viaggio", color: "#3b82f6", bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20" },
  done: { label: "Completato", color: "#10b981", bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20" },
};

/* ─── FitAll component ─── */
function FitAllBounds({ transports, selectedId }) {
  const map = useMap();
  useEffect(() => {
    const points = [];
    const target = selectedId ? transports.filter(t => t.id === selectedId) : transports;
    target.forEach(t => {
      if (t.pickup_coords) points.push(t.pickup_coords);
      if (t.dropoff_coords) points.push(t.dropoff_coords);
    });
    if (points.length >= 2) {
      map.fitBounds(L.latLngBounds(points), { padding: [40, 40], maxZoom: 14 });
    } else if (points.length === 1) {
      map.setView(points[0], 13);
    }
  }, [transports, selectedId, map]);
  return null;
}

export default function TransportTracking() {
  const navigate = useNavigate();
  const supabase = supabaseBrowser();
  const { orgId } = useOrg();

  const [transports, setTransports] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [filterStatus, setFilterStatus] = useState("active"); // active | all | enroute | assigned
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [gpsDevices, setGpsDevices] = useState([]);
  const [livePositions, setLivePositions] = useState({});
  const refreshIntervalRef = useRef(null);
  const routeCacheRef = useRef({});
  const [routeLines, setRouteLines] = useState({});

  // Determine which transports have real GPS
  const gpsTransportIds = useMemo(() => {
    const ids = new Set();
    gpsDevices.forEach(d => {
      if (!d.is_active) return;
      transports.forEach(t => {
        if ((d.vehicle_id && t.vehicle_id === d.vehicle_id) ||
            (d.driver_id && t.driver_id && Number(t.driver_id) === Number(d.driver_id))) {
          ids.add(t.id);
        }
      });
    });
    return ids;
  }, [gpsDevices, transports]);

  // Load data
  const loadData = useCallback(async (isRefresh = false) => {
    if (!orgId) return;
    if (isRefresh) setRefreshing(true); else setLoading(true);

    try {
      const [transportsRes, driversRes, devicesRes] = await Promise.all([
        supabase
          .from("transports")
          .select("id, pickup_address, dropoff_address, pickup_coords, dropoff_coords, status, driver_id, vehicle_id, notes, created_at, customer_name")
          .eq("org_id", orgId)
          .order("created_at", { ascending: false })
          .limit(200),
        supabase
          .from("staff_drivers")
          .select("id, nome, telefono, stato")
          .eq("org_id", orgId),
        supabase
          .from("gps_devices")
          .select("id, name, device_type, vehicle_id, driver_id, is_active, last_latitude, last_longitude, last_seen_at")
          .eq("org_id", orgId)
          .eq("is_active", true),
      ]);

      if (transportsRes.error) throw transportsRes.error;
      setTransports(transportsRes.data || []);
      setDrivers(driversRes.data || []);
      setGpsDevices(devicesRes.data || []);

      // Load latest live positions for active transports
      const { data: trackingData } = await supabase
        .from("transport_tracking")
        .select("transport_id, latitude, longitude, speed, heading, recorded_at, status")
        .eq("org_id", orgId)
        .eq("status", "active")
        .order("recorded_at", { ascending: false })
        .limit(100);

      if (trackingData) {
        const posMap = {};
        trackingData.forEach(tp => {
          if (!posMap[tp.transport_id]) posMap[tp.transport_id] = tp;
        });
        setLivePositions(posMap);
      }
    } catch (err) {
      console.error("[Tracking] Error loading:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [orgId, supabase]);

  useEffect(() => { loadData(); }, [loadData]);

  // Auto-refresh every 30s
  useEffect(() => {
    refreshIntervalRef.current = setInterval(() => loadData(true), 30000);
    return () => clearInterval(refreshIntervalRef.current);
  }, [loadData]);

  // Filter transports
  const filtered = useMemo(() => {
    return transports.filter(t => {
      if (filterStatus === "active") return t.status !== "done";
      if (filterStatus === "enroute") return t.status === "enroute";
      if (filterStatus === "assigned") return t.status === "assigned";
      return true; // "all"
    });
  }, [transports, filterStatus]);

  // Only transports with coordinates for the map
  const mappable = useMemo(() => {
    return filtered.filter(t => t.pickup_coords || t.dropoff_coords);
  }, [filtered]);

  // Fetch OSRM route for selected transport
  useEffect(() => {
    if (!selectedId) return;
    const t = transports.find(tr => tr.id === selectedId);
    if (!t?.pickup_coords || !t?.dropoff_coords) return;
    const cacheKey = `${t.pickup_coords[0]},${t.pickup_coords[1]}-${t.dropoff_coords[0]},${t.dropoff_coords[1]}`;
    if (routeCacheRef.current[cacheKey]) {
      setRouteLines(prev => ({ ...prev, [selectedId]: routeCacheRef.current[cacheKey] }));
      return;
    }
    (async () => {
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${t.pickup_coords[1]},${t.pickup_coords[0]};${t.dropoff_coords[1]},${t.dropoff_coords[0]}?overview=full&geometries=geojson`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          if (data.code === "Ok" && data.routes?.[0]?.geometry?.coordinates) {
            const coords = data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]);
            routeCacheRef.current[cacheKey] = coords;
            setRouteLines(prev => ({ ...prev, [selectedId]: coords }));
          }
        }
      } catch { /* fallback to straight line */ }
    })();
  }, [selectedId, transports]);

  // Stats
  const stats = useMemo(() => ({
    total: transports.length,
    enroute: transports.filter(t => t.status === "enroute").length,
    assigned: transports.filter(t => t.status === "assigned").length,
    newT: transports.filter(t => t.status === "new").length,
    done: transports.filter(t => t.status === "done").length,
    withCoords: transports.filter(t => t.pickup_coords || t.dropoff_coords).length,
    withGps: transports.filter(t => gpsTransportIds.has(t.id)).length,
    liveNow: Object.keys(livePositions).length,
  }), [transports, gpsTransportIds, livePositions]);

  // Driver lookup
  const driverMap = useMemo(() => {
    const m = {};
    drivers.forEach(d => { m[d.id] = d; });
    return m;
  }, [drivers]);

  const selectedTransport = selectedId ? transports.find(t => t.id === selectedId) : null;

  // Status badge
  const StatusBadge = ({ status }) => {
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.new;
    return (
      <span className={`inline-flex items-center rounded-md text-[10px] font-medium px-1.5 py-0.5 ${cfg.bg} ${cfg.text} border ${cfg.border}`}>
        {cfg.label}
      </span>
    );
  };

  /* ─── Loading ─── */
  if (loading) {
    return (
      <div className="space-y-5 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="h-8 w-20 bg-[#1a2536] rounded-lg" />
          <div><div className="h-5 w-48 bg-[#243044] rounded mb-2" /><div className="h-3 w-64 bg-[#1a2536] rounded" /></div>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {[1,2,3,4].map(i => <div key={i} className="bg-[#1a2536] rounded-xl border border-[#243044] p-4 h-20" />)}
        </div>
        <div className="bg-[#1a2536] rounded-xl border border-[#243044] h-[500px]" />
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${isFullscreen ? "fixed inset-0 z-50 bg-[#0c1929] p-4 overflow-auto" : ""}`}>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/trasporti")} className="h-8 px-3 text-xs font-medium text-slate-400 bg-[#1a2536] border border-[#243044] rounded-lg hover:bg-[#1e2b3d] transition">
            <FiArrowLeft className="w-3.5 h-3.5 inline mr-1" />Trasporti
          </button>
          <div>
            <h1 className="text-lg font-semibold text-slate-100">Tracking Live</h1>
            <p className="text-slate-500 text-xs mt-0.5">
              {stats.withCoords} trasporti con GPS · {stats.enroute} in viaggio
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="h-8 px-3 text-xs font-medium text-slate-400 bg-[#1a2536] border border-[#243044] rounded-lg hover:bg-[#1e2b3d] transition disabled:opacity-50"
          >
            <FiRefreshCw className={`w-3.5 h-3.5 inline mr-1 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "..." : "Aggiorna"}
          </button>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="h-8 px-3 text-xs font-medium text-slate-400 bg-[#1a2536] border border-[#243044] rounded-lg hover:bg-[#1e2b3d] transition"
          >
            {isFullscreen ? <FiMinimize2 className="w-3.5 h-3.5" /> : <FiMaximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-5 gap-3">
        {[
          { label: "In Viaggio", value: stats.enroute, icon: FiNavigation, color: "blue" },
          { label: "Assegnati", value: stats.assigned, icon: FiUser, color: "amber" },
          { label: "GPS Live", value: stats.withGps, icon: FiRadio, color: "emerald" },
          { label: "Con Mappa", value: stats.withCoords, icon: FiMap, color: "purple" },
          { label: "Live Ora", value: stats.liveNow, icon: FiActivity, color: "rose" },
        ].map(kpi => (
          <div key={kpi.label} className={`bg-[#1a2536] rounded-xl border border-[#243044] p-3 flex items-center gap-3`}>
            <div className={`w-9 h-9 rounded-lg bg-${kpi.color}-500/10 flex items-center justify-center`}>
              <kpi.icon className={`w-4 h-4 text-${kpi.color}-400`} />
            </div>
            <div>
              <div className="text-lg font-bold text-slate-100">{kpi.value}</div>
              <div className="text-[10px] text-slate-500">{kpi.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-2">
        <FiFilter className="w-3.5 h-3.5 text-slate-500" />
        {[
          { value: "active", label: "Attivi" },
          { value: "enroute", label: "In Viaggio" },
          { value: "assigned", label: "Assegnati" },
          { value: "all", label: "Tutti" },
        ].map(f => (
          <button
            key={f.value}
            onClick={() => { setFilterStatus(f.value); setSelectedId(null); }}
            className={`px-2.5 h-7 rounded-md text-[10px] font-medium transition ${
              filterStatus === f.value
                ? "bg-blue-600 text-white"
                : "text-slate-400 bg-[#1a2536] border border-[#243044] hover:bg-[#1e2b3d]"
            }`}
          >
            {f.label}
          </button>
        ))}
        <span className="ml-auto text-[10px] text-slate-600">
          {filtered.length} trasporti · Auto-refresh 30s
        </span>
      </div>

      {/* Map + Sidebar */}
      <div className="flex gap-4" style={{ height: isFullscreen ? "calc(100vh - 220px)" : "500px" }}>

        {/* Sidebar list */}
        {sidebarOpen && (
          <div className="w-80 shrink-0 bg-[#1a2536] rounded-xl border border-[#243044] overflow-hidden flex flex-col">
            <div className="px-4 py-2.5 border-b border-[#243044] flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Trasporti ({filtered.length})</span>
              <button onClick={() => setSidebarOpen(false)} className="text-slate-500 hover:text-slate-300">
                <FiMinimize2 className="w-3 h-3" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-[#243044]/50">
              {filtered.length === 0 && (
                <div className="p-6 text-center">
                  <FiTruck className="w-6 h-6 text-slate-600 mx-auto mb-2" />
                  <p className="text-xs text-slate-500">Nessun trasporto</p>
                </div>
              )}
              {filtered.map(t => {
                const driver = t.driver_id ? driverMap[t.driver_id] : null;
                const hasCoords = t.pickup_coords || t.dropoff_coords;
                return (
                  <button
                    key={t.id}
                    onClick={() => setSelectedId(selectedId === t.id ? null : t.id)}
                    className={`w-full text-left px-4 py-3 transition hover:bg-[#141c27] ${
                      selectedId === t.id ? "bg-blue-500/5 border-l-2 border-l-blue-500" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-slate-200 truncate">
                          {t.customer_name || t.pickup_address || `#${t.id.slice(0, 8)}`}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate mt-0.5">
                          {t.pickup_address ? `${t.pickup_address} → ${t.dropoff_address || "..."}` : "Nessun indirizzo"}
                        </div>
                      </div>
                      <StatusBadge status={t.status} />
                    </div>
                    <div className="flex items-center gap-2 mt-1.5">
                      {driver && (
                        <span className="text-[10px] text-slate-500 flex items-center gap-1">
                          <FiUser className="w-2.5 h-2.5" />{driver.nome}
                        </span>
                      )}
                      {hasCoords && gpsTransportIds.has(t.id) ? (
                        <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                          <FiRadio className="w-2.5 h-2.5" />LIVE
                        </span>
                      ) : hasCoords ? (
                        <span className="text-[10px] text-slate-500 flex items-center gap-1">
                          <FiMap className="w-2.5 h-2.5" />Mappa
                        </span>
                      ) : null}
                      <span className="text-[10px] text-slate-600 ml-auto">
                        {new Date(t.created_at).toLocaleDateString("it-IT", { day: "2-digit", month: "short" })}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Map */}
        <div className="flex-1 rounded-xl overflow-hidden border border-[#243044] relative">
          {!sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(true)}
              className="absolute top-3 left-3 z-[1000] h-8 px-3 text-xs font-medium text-slate-300 bg-[#1a2536]/90 border border-[#243044] rounded-lg hover:bg-[#1e2b3d] transition backdrop-blur-sm"
            >
              <FiMaximize2 className="w-3 h-3 inline mr-1" />Lista
            </button>
          )}

          <MapContainer
            center={[41.9028, 12.4964]}
            zoom={6}
            style={{ height: "100%", width: "100%" }}
            zoomControl={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <FitAllBounds transports={mappable} selectedId={selectedId} />

            {mappable.map((t, idx) => {
              const isSelected = t.id === selectedId;
              const cfg = STATUS_CONFIG[t.status] || STATUS_CONFIG.new;
              const driver = t.driver_id ? driverMap[t.driver_id] : null;
              const label = driver ? driver.nome?.charAt(0)?.toUpperCase() || "T" : (idx + 1).toString();
              const icon = makeIcon(cfg.color, label);

              return (
                <div key={t.id}>
                  {/* Pickup marker */}
                  {t.pickup_coords && (
                    <Marker
                      position={t.pickup_coords}
                      icon={isSelected ? pickupIcon : icon}
                      eventHandlers={{ click: () => setSelectedId(t.id) }}
                    >
                      <Popup>
                        <div className="text-xs">
                          <div className="font-semibold">{t.customer_name || "Trasporto"}</div>
                          <div className="text-slate-500 mt-0.5">Partenza: {t.pickup_address || "N/A"}</div>
                          {driver && <div className="text-slate-500">Autista: {driver.nome}</div>}
                        </div>
                      </Popup>
                    </Marker>
                  )}

                  {/* Dropoff marker (only when selected) */}
                  {isSelected && t.dropoff_coords && (
                    <Marker position={t.dropoff_coords} icon={dropoffIcon}>
                      <Popup>
                        <div className="text-xs">
                          <div className="font-semibold">Destinazione</div>
                          <div className="text-slate-500">{t.dropoff_address || "N/A"}</div>
                        </div>
                      </Popup>
                    </Marker>
                  )}

                  {/* Route line (only when selected) */}
                  {isSelected && t.pickup_coords && t.dropoff_coords && (
                    <Polyline
                      positions={routeLines[t.id] || [t.pickup_coords, t.dropoff_coords]}
                      pathOptions={{ color: cfg.color, weight: 4, opacity: 0.75, dashArray: routeLines[t.id] ? null : "8, 8" }}
                    />
                  )}

                  {/* Live GPS position marker */}
                  {livePositions[t.id] && gpsTransportIds.has(t.id) && (
                    <Marker
                      position={[livePositions[t.id].latitude, livePositions[t.id].longitude]}
                      icon={makeIcon("#10b981", "⬤")}
                    >
                      <Popup>
                        <div className="text-xs">
                          <div className="font-semibold text-emerald-600">Posizione Live</div>
                          <div className="text-slate-500 mt-0.5">
                            {livePositions[t.id].speed ? `${Math.round(livePositions[t.id].speed)} km/h` : "Fermo"}
                          </div>
                          <div className="text-slate-400 text-[10px] mt-0.5">
                            {new Date(livePositions[t.id].recorded_at).toLocaleTimeString("it-IT")}
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  )}
                </div>
              );
            })}
          </MapContainer>

          {/* Selected transport detail overlay */}
          {selectedTransport && (
            <div className="absolute bottom-3 right-3 z-[1000] w-72 bg-[#1a2536]/95 border border-[#243044] rounded-xl p-4 backdrop-blur-sm shadow-xl">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="text-sm font-semibold text-slate-200">
                    {selectedTransport.customer_name || `Trasporto #${selectedTransport.id.slice(0, 8)}`}
                  </div>
                  <StatusBadge status={selectedTransport.status} />
                </div>
                <button onClick={() => setSelectedId(null)} className="text-slate-500 hover:text-slate-300">
                  <FiMinimize2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="space-y-1.5 mt-3">
                {selectedTransport.pickup_address && (
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                    <span className="text-[11px] text-slate-300">{selectedTransport.pickup_address}</span>
                  </div>
                )}
                {selectedTransport.dropoff_address && (
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                    <span className="text-[11px] text-slate-300">{selectedTransport.dropoff_address}</span>
                  </div>
                )}
                {selectedTransport.driver_id && driverMap[selectedTransport.driver_id] && (
                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-[#243044]">
                    <FiUser className="w-3 h-3 text-slate-500" />
                    <span className="text-[11px] text-slate-400">{driverMap[selectedTransport.driver_id].nome}</span>
                  </div>
                )}
              </div>
              {gpsTransportIds.has(selectedTransport.id) ? (
                <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-[#243044]">
                  <FiRadio className="w-3 h-3 text-emerald-400" />
                  <span className="text-[10px] text-emerald-400 font-medium">GPS Live attivo</span>
                  {livePositions[selectedTransport.id] && (
                    <span className="text-[10px] text-slate-500 ml-auto">
                      {new Date(livePositions[selectedTransport.id].recorded_at).toLocaleTimeString("it-IT")}
                    </span>
                  )}
                </div>
              ) : selectedTransport.pickup_coords ? (
                <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-[#243044]">
                  <FiMap className="w-3 h-3 text-slate-500" />
                  <span className="text-[10px] text-slate-500">Solo mappa statica A&rarr;B</span>
                </div>
              ) : null}
              <button
                onClick={() => navigate(`/trasporti/${selectedTransport.id}`)}
                className="w-full mt-3 h-7 text-[10px] font-medium text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-lg hover:bg-blue-500/15 transition"
              >
                Apri Dettaglio
              </button>
            </div>
          )}

          {/* Empty state overlay */}
          {mappable.length === 0 && (
            <div className="absolute inset-0 z-[999] flex items-center justify-center pointer-events-none">
              <div className="bg-[#1a2536]/90 border border-[#243044] rounded-xl p-6 text-center backdrop-blur-sm pointer-events-auto">
                <FiMapPin className="w-8 h-8 text-slate-600 mx-auto mb-3" />
                <p className="text-sm text-slate-400 font-medium">Nessun trasporto con GPS</p>
                <p className="text-xs text-slate-600 mt-1">Aggiungi coordinate ai trasporti per vederli sulla mappa</p>
                <button
                  onClick={() => navigate("/trasporti/new")}
                  className="mt-3 h-7 px-4 text-[10px] font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition"
                >
                  Nuovo Trasporto
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
