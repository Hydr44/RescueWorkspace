/**
 * Mappa Live con posizioni autisti in tempo reale
 * Usa Google Maps API + Supabase Realtime
 */

import { useEffect, useRef, useState } from 'react';
import { FiMapPin, FiTruck, FiNavigation, FiLoader } from 'react-icons/fi';
import { useDriverLocations } from '../hooks/useGPSTracking';

export default function LiveDriverMap({ orgId, selectedTransportId = null }) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markers = useRef({});
  
  const [mapLoaded, setMapLoaded] = useState(false);
  const [error, setError] = useState(null);

  const { locations, loading } = useDriverLocations(orgId);
  const apiKey = import.meta.env?.VITE_GOOGLE_MAPS_API_KEY;

  // Carica Google Maps API
  useEffect(() => {
    if (!apiKey) {
      setError('Google Maps API key mancante');
      return;
    }

    if (window.google) {
      setMapLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=geometry`;
    script.async = true;
    script.defer = true;
    script.onload = () => setMapLoaded(true);
    script.onerror = () => setError('Errore caricamento Google Maps');
    document.head.appendChild(script);
  }, [apiKey]);

  // Inizializza mappa
  useEffect(() => {
    if (!mapLoaded || !mapContainer.current || map.current) return;

    try {
      // Centro Italia come default
      const center = { lat: 41.9028, lng: 12.4964 };

      map.current = new window.google.maps.Map(mapContainer.current, {
        center,
        zoom: 6,
        styles: [
          {
            featureType: 'all',
            elementType: 'geometry',
            stylers: [{ color: '#242f3e' }]
          },
          {
            featureType: 'all',
            elementType: 'labels.text.stroke',
            stylers: [{ color: '#242f3e' }]
          },
          {
            featureType: 'all',
            elementType: 'labels.text.fill',
            stylers: [{ color: '#746855' }]
          },
          {
            featureType: 'water',
            elementType: 'geometry',
            stylers: [{ color: '#17263c' }]
          }
        ],
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true
      });
    } catch (err) {
      console.error('[Map] Error initializing:', err);
      setError('Errore inizializzazione mappa');
    }
  }, [mapLoaded]);

  // Aggiorna markers quando cambiano le posizioni
  useEffect(() => {
    if (!map.current || !window.google || !locations.length) return;

    const bounds = new window.google.maps.LatLngBounds();

    locations.forEach((location) => {
      const position = {
        lat: parseFloat(location.latitude),
        lng: parseFloat(location.longitude)
      };

      // Crea o aggiorna marker
      if (!markers.current[location.driver_id]) {
        // Nuovo marker
        const marker = new window.google.maps.Marker({
          position,
          map: map.current,
          title: `Autista ${location.driver_id.slice(0, 8)}`,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: location.is_moving ? '#3b82f6' : '#10b981',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2
          }
        });

        // Info window
        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div style="color: #1e293b; padding: 8px;">
              <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600;">
                Autista ${location.driver_id.slice(0, 8)}
              </h3>
              <div style="font-size: 12px; color: #64748b;">
                <div>📍 ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}</div>
                <div>🎯 Precisione: ${Math.round(location.accuracy)}m</div>
                ${location.speed ? `<div>🚗 Velocità: ${Math.round(location.speed)} km/h</div>` : ''}
                ${location.battery_level ? `<div>🔋 Batteria: ${location.battery_level}%</div>` : ''}
                <div>⏰ ${new Date(location.updated_at).toLocaleTimeString('it-IT')}</div>
              </div>
            </div>
          `
        });

        marker.addListener('click', () => {
          infoWindow.open(map.current, marker);
        });

        markers.current[location.driver_id] = { marker, infoWindow };
      } else {
        // Aggiorna marker esistente
        markers.current[location.driver_id].marker.setPosition(position);
        markers.current[location.driver_id].marker.setIcon({
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: location.is_moving ? '#3b82f6' : '#10b981',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2
        });
      }

      bounds.extend(position);
    });

    // Centra mappa su tutti i markers
    if (locations.length > 0) {
      map.current.fitBounds(bounds);
      
      // Se un solo marker, zoom più vicino
      if (locations.length === 1) {
        map.current.setZoom(14);
      }
    }
  }, [locations]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-96 bg-[#1a2536] rounded-xl border border-[#243044]">
        <div className="text-center">
          <FiMapPin className="w-12 h-12 text-slate-500 mx-auto mb-3" />
          <p className="text-sm text-slate-400">{error}</p>
        </div>
      </div>
    );
  }

  if (loading || !mapLoaded) {
    return (
      <div className="flex items-center justify-center h-96 bg-[#1a2536] rounded-xl border border-[#243044]">
        <div className="text-center">
          <FiLoader className="w-8 h-8 text-blue-400 animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-400">Caricamento mappa...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-100">Tracking Autisti Live</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {locations.length} {locations.length === 1 ? 'autista' : 'autisti'} attivi
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-emerald-400 rounded-full" />
            <span className="text-xs text-slate-400">Fermo</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-400 rounded-full" />
            <span className="text-xs text-slate-400">In movimento</span>
          </div>
        </div>
      </div>

      {/* Mappa */}
      <div 
        ref={mapContainer} 
        className="w-full h-96 rounded-xl border border-[#243044] overflow-hidden"
      />

      {/* Lista autisti */}
      {locations.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {locations.map((location) => (
            <div 
              key={location.driver_id}
              className="p-3 bg-[#1a2536] rounded-lg border border-[#243044]"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <FiTruck className={`w-4 h-4 ${location.is_moving ? 'text-blue-400' : 'text-emerald-400'}`} />
                  <span className="text-sm font-medium text-slate-200">
                    Autista {location.driver_id.slice(0, 8)}
                  </span>
                </div>
                {location.is_moving && (
                  <span className="px-2 py-0.5 text-xs bg-blue-500/10 text-blue-400 rounded-full">
                    In viaggio
                  </span>
                )}
              </div>
              <div className="space-y-1 text-xs text-slate-500">
                <div className="flex items-center gap-1">
                  <FiNavigation className="w-3 h-3" />
                  <span>{Math.round(location.accuracy)}m precisione</span>
                </div>
                {location.speed > 0 && (
                  <div>🚗 {Math.round(location.speed)} km/h</div>
                )}
                {location.battery_level && (
                  <div>🔋 {location.battery_level}%</div>
                )}
                <div className="text-slate-600">
                  {new Date(location.updated_at).toLocaleTimeString('it-IT')}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {locations.length === 0 && (
        <div className="text-center py-8">
          <FiMapPin className="w-12 h-12 text-slate-500 mx-auto mb-3" />
          <p className="text-sm text-slate-400">Nessun autista attivo al momento</p>
        </div>
      )}
    </div>
  );
}
