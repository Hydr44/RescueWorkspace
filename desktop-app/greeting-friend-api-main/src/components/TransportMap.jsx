/**
 * TransportMap — Leaflet map component for transport pickup/dropoff
 * Supports click-to-place markers, geocoding search, and route display.
 * 
 * @author haxies
 * @created 2026
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { FiNavigation, FiMapPin, FiX, FiLoader } from "react-icons/fi";

// Fix default marker icons (Leaflet + bundlers issue)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Custom marker icons
const pickupIcon = new L.DivIcon({
  className: "custom-marker",
  html: `<div style="width:28px;height:28px;background:#3b82f6;border:3px solid #1e3a5f;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(59,130,246,0.5)">
    <div style="width:8px;height:8px;background:white;border-radius:50%"></div>
  </div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -16],
});

const dropoffIcon = new L.DivIcon({
  className: "custom-marker",
  html: `<div style="width:28px;height:28px;background:#10b981;border:3px solid #064e3b;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(16,185,129,0.5)">
    <div style="width:8px;height:8px;background:white;border-radius:50%"></div>
  </div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -16],
});

// Geocode address using Nominatim (OSM)
async function geocodeAddress(address) {
  if (!address || address.trim().length < 3) return null;
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&countrycodes=it&limit=5&addressdetails=1`;
    const res = await fetch(url, {
      headers: { "Accept-Language": "it", "User-Agent": "RescueManager/1.0" },
    });
    const data = await res.json();
    if (data && data.length > 0) {
      return data.map((r) => ({
        lat: parseFloat(r.lat),
        lng: parseFloat(r.lon),
        display: r.display_name,
        short: [r.address?.road, r.address?.house_number, r.address?.city || r.address?.town || r.address?.village, r.address?.postcode]
          .filter(Boolean)
          .join(", "),
      }));
    }
  } catch (err) {
    console.error("[TransportMap] Geocoding error:", err);
  }
  return null;
}

// Reverse geocode coordinates
async function reverseGeocode(lat, lng) {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`;
    const res = await fetch(url, {
      headers: { "Accept-Language": "it", "User-Agent": "RescueManager/1.0" },
    });
    const data = await res.json();
    if (data && data.address) {
      const a = data.address;
      return [a.road, a.house_number, a.city || a.town || a.village, a.postcode]
        .filter(Boolean)
        .join(", ");
    }
    return data?.display_name || null;
  } catch (err) {
    console.error("[TransportMap] Reverse geocode error:", err);
    return null;
  }
}

/* ─── Map click handler ─── */
function MapClickHandler({ placing, onPlaceMarker }) {
  useMapEvents({
    click(e) {
      if (placing) {
        onPlaceMarker(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

/* ─── Auto-fit bounds ─── */
function FitBounds({ pickup, dropoff }) {
  const map = useMap();
  useEffect(() => {
    if (pickup && dropoff) {
      const bounds = L.latLngBounds([pickup, dropoff]);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    } else if (pickup) {
      map.setView(pickup, 13);
    } else if (dropoff) {
      map.setView(dropoff, 13);
    }
  }, [pickup, dropoff, map]);
  return null;
}

/* ─── Route polyline (real road via OSRM) ─── */
function RouteLine({ pickup, dropoff }) {
  const map = useMap();
  const lineRef = useRef(null);

  useEffect(() => {
    if (lineRef.current) {
      map.removeLayer(lineRef.current);
      lineRef.current = null;
    }
    if (!pickup || !dropoff) return;

    let cancelled = false;

    (async () => {
      let coords = null;
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${pickup[1]},${pickup[0]};${dropoff[1]},${dropoff[0]}?overview=full&geometries=geojson`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          if (data.code === "Ok" && data.routes?.[0]?.geometry?.coordinates) {
            coords = data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]);
          }
        }
      } catch {
        // OSRM non disponibile, fallback linea retta
      }

      if (cancelled) return;

      const points = coords || [pickup, dropoff];
      lineRef.current = L.polyline(points, {
        color: "#3b82f6",
        weight: 4,
        opacity: 0.75,
        dashArray: coords ? null : "8, 8",
        smoothFactor: 1,
      }).addTo(map);
    })();

    return () => {
      cancelled = true;
      if (lineRef.current) {
        map.removeLayer(lineRef.current);
      }
    };
  }, [pickup, dropoff, map]);

  return null;
}

/* ─── Geocode Search Input ─── */
function GeoSearchInput({ placeholder, value, onChange, onSelect, icon: Icon, color }) {
  const [query, setQuery] = useState(value || "");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const debounceRef = useRef(null);
  const wrapperRef = useRef(null);

  useEffect(() => { setQuery(value || ""); }, [value]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSearch = useCallback(async (q) => {
    if (q.length < 3) { setResults([]); setShowResults(false); return; }
    setSearching(true);
    const res = await geocodeAddress(q);
    setResults(res || []);
    setShowResults(!!(res && res.length));
    setSearching(false);
  }, []);

  const handleChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    onChange(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => handleSearch(val), 600);
  };

  const handleSelect = (result) => {
    setQuery(result.short || result.display);
    onChange(result.short || result.display);
    onSelect(result);
    setShowResults(false);
    setResults([]);
  };

  return (
    <div ref={wrapperRef} className="relative" style={{ zIndex: 9999 }}>
      <div className="relative">
        <Icon className={`absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${color}`} />
        <input
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => { if (results.length > 0) setShowResults(true); }}
          placeholder={placeholder}
          className="w-full h-9 pl-9 pr-9 text-xs border border-[#243044] rounded-lg bg-[#141c27] text-slate-200 placeholder-slate-600 focus:ring-1 focus:ring-blue-500/30 focus:border-blue-500/30 outline-none transition"
        />
        {searching && <FiLoader className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 animate-spin" />}
        {!searching && query && (
          <button
            onClick={() => { setQuery(""); onChange(""); setResults([]); setShowResults(false); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
          >
            <FiX className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      {showResults && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-[#1a2536] border border-[#243044] rounded-lg shadow-xl max-h-48 overflow-y-auto" style={{ zIndex: 10000 }}>
          {results.map((r, i) => (
            <div
              key={i}
              role="button"
              tabIndex={0}
              onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); handleSelect(r); }}
              className="w-full text-left px-3 py-2.5 text-xs text-slate-300 hover:bg-blue-500/15 hover:text-white cursor-pointer transition border-b border-[#243044]/50 last:border-0"
            >
              <div className="font-medium">{r.short}</div>
              <div className="text-[10px] text-slate-500 truncate mt-0.5">{r.display}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Main TransportMap Component ─── */
export default function TransportMap({
  pickupCoords,
  dropoffCoords,
  pickupAddress,
  dropoffAddress,
  onPickupChange,
  onDropoffChange,
  onCoordsChange,
  height = "320px",
  readOnly = false,
}) {
  const [placing, setPlacing] = useState(null); // "pickup" | "dropoff" | null
  const [localPickup, setLocalPickup] = useState(pickupCoords || null);
  const [localDropoff, setLocalDropoff] = useState(dropoffCoords || null);

  useEffect(() => { if (pickupCoords) setLocalPickup(pickupCoords); }, [pickupCoords]);
  useEffect(() => { if (dropoffCoords) setLocalDropoff(dropoffCoords); }, [dropoffCoords]);

  const handlePlaceMarker = useCallback(async (lat, lng) => {
    const address = await reverseGeocode(lat, lng);
    const coords = [lat, lng];

    if (placing === "pickup") {
      setLocalPickup(coords);
      if (onPickupChange && address) onPickupChange(address);
      if (onCoordsChange) onCoordsChange("pickup", coords);
    } else if (placing === "dropoff") {
      setLocalDropoff(coords);
      if (onDropoffChange && address) onDropoffChange(address);
      if (onCoordsChange) onCoordsChange("dropoff", coords);
    }
    setPlacing(null);
  }, [placing, onPickupChange, onDropoffChange, onCoordsChange]);

  const handleGeoSelect = useCallback((type, result) => {
    const coords = [result.lat, result.lng];
    if (type === "pickup") {
      setLocalPickup(coords);
      if (onCoordsChange) onCoordsChange("pickup", coords);
    } else {
      setLocalDropoff(coords);
      if (onCoordsChange) onCoordsChange("dropoff", coords);
    }
  }, [onCoordsChange]);

  // Default center: Italy
  const center = localPickup || localDropoff || [41.9028, 12.4964];
  const zoom = localPickup || localDropoff ? 13 : 6;

  // Distance calculation
  const distanceKm = localPickup && localDropoff
    ? (L.latLng(localPickup).distanceTo(L.latLng(localDropoff)) / 1000).toFixed(1)
    : null;

  return (
    <div className="space-y-3">
      {/* Search inputs */}
      {!readOnly && (
        <div className="grid grid-cols-2 gap-2">
          <GeoSearchInput
            placeholder="Cerca partenza..."
            value={pickupAddress}
            onChange={(v) => onPickupChange && onPickupChange(v)}
            onSelect={(r) => handleGeoSelect("pickup", r)}
            icon={FiNavigation}
            color="text-blue-400"
          />
          <GeoSearchInput
            placeholder="Cerca destinazione..."
            value={dropoffAddress}
            onChange={(v) => onDropoffChange && onDropoffChange(v)}
            onSelect={(r) => handleGeoSelect("dropoff", r)}
            icon={FiMapPin}
            color="text-emerald-400"
          />
        </div>
      )}

      {/* Map */}
      <div className="relative rounded-xl overflow-hidden border border-[#243044]" style={{ height }}>
        <MapContainer
          center={center}
          zoom={zoom}
          style={{ height: "100%", width: "100%" }}
          className="transport-map"
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapClickHandler placing={placing} onPlaceMarker={handlePlaceMarker} />
          <FitBounds pickup={localPickup} dropoff={localDropoff} />
          <RouteLine pickup={localPickup} dropoff={localDropoff} />

          {localPickup && (
            <Marker position={localPickup} icon={pickupIcon}>
              <Popup className="dark-popup">
                <span className="text-xs font-medium">Partenza</span>
                <br />
                <span className="text-[10px] text-slate-500">{pickupAddress || `${localPickup[0].toFixed(5)}, ${localPickup[1].toFixed(5)}`}</span>
              </Popup>
            </Marker>
          )}

          {localDropoff && (
            <Marker position={localDropoff} icon={dropoffIcon}>
              <Popup className="dark-popup">
                <span className="text-xs font-medium">Destinazione</span>
                <br />
                <span className="text-[10px] text-slate-500">{dropoffAddress || `${localDropoff[0].toFixed(5)}, ${localDropoff[1].toFixed(5)}`}</span>
              </Popup>
            </Marker>
          )}
        </MapContainer>

        {/* Placing mode overlay */}
        {placing && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] bg-[#1a2536]/95 border border-[#243044] rounded-lg px-4 py-2 flex items-center gap-2 shadow-lg">
            <div className={`w-2 h-2 rounded-full animate-pulse ${placing === "pickup" ? "bg-blue-400" : "bg-emerald-400"}`} />
            <span className="text-xs text-slate-200 font-medium">
              Clicca sulla mappa per posizionare {placing === "pickup" ? "la partenza" : "la destinazione"}
            </span>
            <button
              onClick={() => setPlacing(null)}
              className="ml-2 text-slate-400 hover:text-slate-200"
            >
              <FiX className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Distance badge */}
        {distanceKm && (
          <div className="absolute bottom-3 left-3 z-[1000] bg-[#1a2536]/90 border border-[#243044] rounded-lg px-3 py-1.5 flex items-center gap-1.5">
            <FiNavigation className="w-3 h-3 text-blue-400" />
            <span className="text-xs text-slate-200 font-medium">{distanceKm} km</span>
            <span className="text-[10px] text-slate-500">(linea d&apos;aria)</span>
          </div>
        )}
      </div>

      {/* Action buttons */}
      {!readOnly && (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPlacing(placing === "pickup" ? null : "pickup")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition ${
              placing === "pickup"
                ? "text-blue-400 bg-blue-500/15 border-blue-500/30"
                : "text-slate-400 bg-[#141c27] border-[#243044] hover:text-blue-400 hover:border-blue-500/20"
            }`}
          >
            <FiNavigation className="w-3 h-3" />
            {placing === "pickup" ? "Posizionando..." : "Pin Partenza"}
          </button>
          <button
            type="button"
            onClick={() => setPlacing(placing === "dropoff" ? null : "dropoff")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition ${
              placing === "dropoff"
                ? "text-emerald-400 bg-emerald-500/15 border-emerald-500/30"
                : "text-slate-400 bg-[#141c27] border-[#243044] hover:text-emerald-400 hover:border-emerald-500/20"
            }`}
          >
            <FiMapPin className="w-3 h-3" />
            {placing === "dropoff" ? "Posizionando..." : "Pin Destinazione"}
          </button>
          {(localPickup || localDropoff) && (
            <button
              type="button"
              onClick={() => {
                setLocalPickup(null);
                setLocalDropoff(null);
                if (onCoordsChange) {
                  onCoordsChange("pickup", null);
                  onCoordsChange("dropoff", null);
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg hover:bg-red-500/15 transition ml-auto"
            >
              <FiX className="w-3 h-3" />
              Reset Mappa
            </button>
          )}
        </div>
      )}
    </div>
  );
}
