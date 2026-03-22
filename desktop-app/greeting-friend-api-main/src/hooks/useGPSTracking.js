/**
 * Hook per GPS Tracking degli autisti
 * Gestisce geolocalizzazione e invio posizione a Supabase
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabaseBrowser } from '../lib/supabase-browser';

export function useGPSTracking(driverId, orgId, transportId = null, options = {}) {
  const {
    enableTracking = false,
    updateInterval = 10000, // 10 secondi
    highAccuracy = true
  } = options;

  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [batteryLevel, setBatteryLevel] = useState(null);

  const supabase = supabaseBrowser();
  const watchId = useRef(null);
  const updateTimer = useRef(null);

  // Invia posizione a Supabase
  const sendLocationToServer = useCallback(async (position) => {
    if (!driverId || !orgId) return;

    try {
      const locationData = {
        driver_id: driverId,
        org_id: orgId,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        altitude: position.coords.altitude,
        heading: position.coords.heading,
        speed: position.coords.speed ? position.coords.speed * 3.6 : null, // m/s to km/h
        battery_level: batteryLevel,
        is_moving: position.coords.speed > 0.5, // > 0.5 m/s = in movimento
        last_activity_at: new Date().toISOString(),
        transport_id: transportId
      };

      // Upsert: aggiorna se esiste, altrimenti inserisce
      const { error: upsertError } = await supabase
        .from('driver_locations')
        .upsert(locationData, {
          onConflict: 'driver_id',
          ignoreDuplicates: false
        });

      if (upsertError) {
        console.error('[GPS] Error sending location:', upsertError);
        setError(upsertError.message);
      } else {
        console.log('[GPS] Location sent:', locationData.latitude, locationData.longitude);
      }
    } catch (err) {
      console.error('[GPS] Error:', err);
      setError(err.message);
    }
  }, [driverId, orgId, transportId, batteryLevel, supabase]);

  // Callback successo geolocalizzazione
  const handleSuccess = useCallback((position) => {
    const locationData = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      altitude: position.coords.altitude,
      heading: position.coords.heading,
      speed: position.coords.speed,
      timestamp: position.timestamp
    };

    setLocation(locationData);
    setError(null);

    // Invia a server
    sendLocationToServer(position);
  }, [sendLocationToServer]);

  // Callback errore geolocalizzazione
  const handleError = useCallback((err) => {
    console.error('[GPS] Geolocation error:', err);
    
    let errorMessage = 'Errore GPS';
    switch (err.code) {
      case err.PERMISSION_DENIED:
        errorMessage = 'Permesso GPS negato';
        break;
      case err.POSITION_UNAVAILABLE:
        errorMessage = 'Posizione non disponibile';
        break;
      case err.TIMEOUT:
        errorMessage = 'Timeout GPS';
        break;
      default:
        errorMessage = err.message;
    }
    
    setError(errorMessage);
    setIsTracking(false);
  }, []);

  // Ottieni livello batteria (se disponibile)
  useEffect(() => {
    if ('getBattery' in navigator) {
      navigator.getBattery().then((battery) => {
        setBatteryLevel(Math.round(battery.level * 100));
        
        battery.addEventListener('levelchange', () => {
          setBatteryLevel(Math.round(battery.level * 100));
        });
      });
    }
  }, []);

  // Avvia/ferma tracking
  useEffect(() => {
    if (!enableTracking || !driverId || !orgId) {
      // Ferma tracking
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current);
        watchId.current = null;
      }
      if (updateTimer.current) {
        clearInterval(updateTimer.current);
        updateTimer.current = null;
      }
      setIsTracking(false);
      return;
    }

    // Verifica supporto geolocalizzazione
    if (!('geolocation' in navigator)) {
      setError('Geolocalizzazione non supportata');
      return;
    }

    // Avvia tracking
    setIsTracking(true);

    const options = {
      enableHighAccuracy: highAccuracy,
      timeout: 10000,
      maximumAge: 5000
    };

    // Watch position continuo
    watchId.current = navigator.geolocation.watchPosition(
      handleSuccess,
      handleError,
      options
    );

    // Cleanup
    return () => {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current);
        watchId.current = null;
      }
      if (updateTimer.current) {
        clearInterval(updateTimer.current);
        updateTimer.current = null;
      }
    };
  }, [enableTracking, driverId, orgId, highAccuracy, handleSuccess, handleError]);

  // Funzione per ottenere posizione singola (one-shot)
  const getCurrentPosition = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (!('geolocation' in navigator)) {
        reject(new Error('Geolocalizzazione non supportata'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const locationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          };
          setLocation(locationData);
          resolve(locationData);
        },
        (err) => {
          handleError(err);
          reject(err);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    });
  }, [handleError]);

  return {
    location,
    error,
    isTracking,
    batteryLevel,
    getCurrentPosition
  };
}

/**
 * Hook per visualizzare posizioni autisti (admin/dispatcher)
 */
export function useDriverLocations(orgId) {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const supabase = supabaseBrowser();

  // Carica posizioni iniziali
  useEffect(() => {
    if (!orgId) return;

    const loadLocations = async () => {
      try {
        setLoading(true);
        
        const { data, error: fetchError } = await supabase
          .from('driver_last_locations')
          .select('*')
          .eq('org_id', orgId);

        if (fetchError) throw fetchError;

        setLocations(data || []);
        setError(null);
      } catch (err) {
        console.error('[GPS] Error loading locations:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadLocations();
  }, [orgId, supabase]);

  // Subscribe a real-time updates
  useEffect(() => {
    if (!orgId) return;

    const channel = supabase
      .channel(`driver_locations:${orgId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'driver_locations',
          filter: `org_id=eq.${orgId}`
        },
        (payload) => {
          console.log('[GPS] Location update:', payload);
          
          // Aggiorna lista
          setLocations(prev => {
            const index = prev.findIndex(loc => loc.driver_id === payload.new.driver_id);
            if (index >= 0) {
              const updated = [...prev];
              updated[index] = payload.new;
              return updated;
            } else {
              return [...prev, payload.new];
            }
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orgId, supabase]);

  return {
    locations,
    loading,
    error
  };
}
