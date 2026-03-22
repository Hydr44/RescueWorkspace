/**
 * Componente preview mappa per trasporti
 * Mostra rotta, distanza e tempo stimato
 */

import { useEffect, useRef, useState } from 'react';
import { FiMapPin, FiNavigation, FiClock, FiLoader } from 'react-icons/fi';

export default function TransportMapPreview({ 
  pickupAddress, 
  dropoffAddress,
  pickupCoords,
  dropoffCoords,
  onRouteCalculated
}) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [loading, setLoading] = useState(false);
  const [routeInfo, setRouteInfo] = useState(null);
  const [error, setError] = useState(null);

  const apiKey = import.meta.env?.VITE_GOOGLE_MAPS_API_KEY;

  // Carica Google Maps API
  useEffect(() => {
    if (!apiKey) return;
    if (typeof window === 'undefined') return;
    if (window.google) return;

    try {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,routes`;
      script.async = true;
      script.defer = true;
      script.onerror = () => setError('Errore caricamento Google Maps');
      document.head.appendChild(script);
    } catch (err) {
      setError('Errore caricamento Google Maps');
    }
  }, [apiKey]);

  // Inizializza mappa e calcola rotta
  useEffect(() => {
    if (!window.google || !mapContainer.current) return;
    if (!pickupCoords || !dropoffCoords) return;

    const initMap = async () => {
      try {
        setLoading(true);
        setError(null);

        // Crea mappa
        const center = {
          lat: (pickupCoords.lat + dropoffCoords.lat) / 2,
          lng: (pickupCoords.lng + dropoffCoords.lng) / 2
        };

        if (!map.current) {
          map.current = new window.google.maps.Map(mapContainer.current, {
            zoom: 12,
            center,
            mapTypeControl: false,
            fullscreenControl: false,
            streetViewControl: false
          });
        }

        // Aggiungi marker partenza
        new window.google.maps.Marker({
          position: pickupCoords,
          map: map.current,
          title: 'Partenza',
          icon: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png'
        });

        // Aggiungi marker arrivo
        new window.google.maps.Marker({
          position: dropoffCoords,
          map: map.current,
          title: 'Arrivo',
          icon: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'
        });

        // Calcola rotta
        const service = new window.google.maps.DirectionsService();
        const renderer = new window.google.maps.DirectionsRenderer({
          map: map.current,
          suppressMarkers: true,
          polylineOptions: {
            strokeColor: '#3b82f6',
            strokeWeight: 3
          }
        });

        const result = await service.route({
          origin: pickupCoords,
          destination: dropoffCoords,
          travelMode: window.google.maps.TravelMode.DRIVING,
          unitSystem: window.google.maps.UnitSystem.METRIC
        });

        renderer.setDirections(result);

        // Estrai info rotta
        const route = result.routes[0];
        const leg = route.legs[0];

        const info = {
          distance: leg.distance.text,
          distanceValue: leg.distance.value,
          duration: leg.duration.text,
          durationValue: leg.duration.value
        };

        setRouteInfo(info);
        onRouteCalculated?.(info);

        // Zoom su rotta
        const bounds = new window.google.maps.LatLngBounds();
        bounds.extend(pickupCoords);
        bounds.extend(dropoffCoords);
        map.current.fitBounds(bounds);

      } catch (err) {
        console.error('[TransportMapPreview] Error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    initMap();
  }, [pickupCoords, dropoffCoords, onRouteCalculated]);

  if (!pickupCoords || !dropoffCoords) {
    return (
      <div className="w-full h-64 bg-[#1a2536] border border-[#243044] rounded-lg flex items-center justify-center">
        <p className="text-sm text-slate-500">Inserisci indirizzi di partenza e arrivo</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Mappa */}
      <div className="relative">
        <div
          ref={mapContainer}
          className="w-full h-64 bg-[#1a2536] border border-[#243044] rounded-lg overflow-hidden"
        />
        
        {loading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
            <FiLoader className="w-6 h-6 animate-spin text-blue-400" />
          </div>
        )}

        {error && (
          <div className="absolute inset-0 bg-red-500/10 border border-red-500/20 flex items-center justify-center rounded-lg">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}
      </div>

      {/* Info rotta */}
      {routeInfo && (
        <div className="grid grid-cols-2 gap-2">
          {/* Distanza */}
          <div className="p-3 bg-[#1a2536] border border-[#243044] rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <FiNavigation className="w-4 h-4 text-blue-400" />
              <p className="text-xs font-medium text-slate-400">Distanza</p>
            </div>
            <p className="text-lg font-semibold text-slate-200">
              {routeInfo.distance}
            </p>
          </div>

          {/* Tempo stimato */}
          <div className="p-3 bg-[#1a2536] border border-[#243044] rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <FiClock className="w-4 h-4 text-emerald-400" />
              <p className="text-xs font-medium text-slate-400">Tempo stimato</p>
            </div>
            <p className="text-lg font-semibold text-slate-200">
              {routeInfo.duration}
            </p>
          </div>
        </div>
      )}

      {/* Indirizzi */}
      <div className="space-y-2 text-xs">
        <div className="flex items-start gap-2 p-2 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <FiMapPin className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-slate-500">Partenza</p>
            <p className="text-slate-200 font-medium">{pickupAddress}</p>
          </div>
        </div>

        <div className="flex items-start gap-2 p-2 bg-red-500/10 border border-red-500/20 rounded-lg">
          <FiMapPin className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-slate-500">Arrivo</p>
            <p className="text-slate-200 font-medium">{dropoffAddress}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
