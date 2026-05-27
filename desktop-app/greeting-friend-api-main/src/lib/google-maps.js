// src/lib/google-maps.js
// Google Maps Platform - Places Autocomplete e Geocoding

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

/**
 * Cerca indirizzi usando Google Places Autocomplete
 * @param {string} input - Testo da cercare (via, piazza, etc)
 * @param {string} country - Codice paese ISO (default: 'it')
 * @returns {Promise<Array>} Array di predizioni
 */
export async function searchAddressGoogle(input, country = 'it') {
  if (!input || input.length < 3) return [];
  
  if (!GOOGLE_MAPS_API_KEY) {
    console.warn('[Google Maps] API key non configurata, uso fallback');
    return [];
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&key=${GOOGLE_MAPS_API_KEY}&components=country:${country}&language=it`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error('[Google Maps] Errore HTTP:', response.status);
      return [];
    }
    
    const data = await response.json();
    
    if (data.status === 'OK' && data.predictions) {
      return data.predictions.map(prediction => ({
        place_id: prediction.place_id,
        description: prediction.description,
        main_text: prediction.structured_formatting?.main_text || '',
        secondary_text: prediction.structured_formatting?.secondary_text || '',
        types: prediction.types || []
      }));
    }
    
    if (data.status === 'ZERO_RESULTS') {
      return [];
    }
    
    // Altri stati (REQUEST_DENIED, OVER_QUERY_LIMIT, etc)
    if (data.error_message) {
      console.error('[Google Maps] Errore:', data.status, data.error_message);
    }
    
    return [];
  } catch (error) {
    console.error('[Google Maps] Errore fetch:', error);
    return [];
  }
}

/**
 * Ottiene i dettagli completi di un indirizzo da place_id
 * @param {string} placeId - Place ID da Google Places
 * @returns {Promise<Object|null>} Dettagli indirizzo o null
 */
export async function getPlaceDetails(placeId) {
  if (!placeId) return null;
  
  if (!GOOGLE_MAPS_API_KEY) {
    console.warn('[Google Maps] API key non configurata');
    return null;
  }

  try {
    const fields = [
      'address_components',
      'formatted_address',
      'geometry',
      'name',
      'place_id'
    ].join(',');
    
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${GOOGLE_MAPS_API_KEY}&fields=${fields}&language=it`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error('[Google Maps] Errore HTTP:', response.status);
      return null;
    }
    
    const data = await response.json();
    
    if (data.status === 'OK' && data.result) {
      const place = data.result;
      const address = parseAddressComponents(place.address_components);
      
      return {
        formatted_address: place.formatted_address,
        street: address.street || '',
        number: address.number || '',
        zip: address.postal_code || '',
        city: address.locality || address.administrative_area_level_3 || '',
        province: address.administrative_area_level_2 || '',
        provinceCode: address.administrative_area_level_2 || '',
        country: address.country || 'IT',
        countryCode: address.country_code || 'IT',
        lat: place.geometry?.location?.lat || null,
        lon: place.geometry?.location?.lng || null,
        place_id: place.place_id
      };
    }
    
    if (data.error_message) {
      console.error('[Google Maps] Errore:', data.status, data.error_message);
    }
    
    return null;
  } catch (error) {
    console.error('[Google Maps] Errore fetch:', error);
    return null;
  }
}

/**
 * Geocoding diretto: converte indirizzo in coordinate e dettagli
 * @param {string} address - Indirizzo completo da geocodificare
 * @param {string} country - Codice paese ISO (default: 'it')
 * @returns {Promise<Object|null>} Dettagli indirizzo o null
 */
export async function geocodeAddress(address, country = 'it') {
  if (!address || address.length < 3) return null;
  
  if (!GOOGLE_MAPS_API_KEY) {
    console.warn('[Google Maps] API key non configurata');
    return null;
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_API_KEY}&region=${country}&language=it`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error('[Google Maps] Errore HTTP:', response.status);
      return null;
    }
    
    const data = await response.json();
    
    if (data.status === 'OK' && data.results && data.results.length > 0) {
      const result = data.results[0];
      const addressComponents = parseAddressComponents(result.address_components);
      
      return {
        formatted_address: result.formatted_address,
        street: addressComponents.street || '',
        number: addressComponents.number || '',
        zip: addressComponents.postal_code || '',
        city: addressComponents.locality || addressComponents.administrative_area_level_3 || '',
        province: addressComponents.administrative_area_level_2 || '',
        provinceCode: addressComponents.administrative_area_level_2 || '',
        country: addressComponents.country || 'IT',
        countryCode: addressComponents.country_code || 'IT',
        lat: result.geometry?.location?.lat || null,
        lon: result.geometry?.location?.lng || null,
        place_id: result.place_id || null
      };
    }
    
    if (data.error_message) {
      console.error('[Google Maps] Errore:', data.status, data.error_message);
    }
    
    return null;
  } catch (error) {
    console.error('[Google Maps] Errore fetch:', error);
    return null;
  }
}

/**
 * Parse degli address_components di Google Maps
 * @param {Array} components - Array di address_components
 * @returns {Object} Oggetto con i campi estratti
 */
function parseAddressComponents(components) {
  if (!Array.isArray(components)) return {};
  
  const address = {};
  
  components.forEach(component => {
    const types = component.types || [];
    
    if (types.includes('street_number')) {
      address.number = component.long_name;
    } else if (types.includes('route')) {
      address.street = component.long_name;
    } else if (types.includes('postal_code')) {
      address.postal_code = component.long_name;
    } else if (types.includes('locality')) {
      address.locality = component.long_name;
    } else if (types.includes('administrative_area_level_3')) {
      address.administrative_area_level_3 = component.long_name;
    } else if (types.includes('administrative_area_level_2')) {
      // Provincia (es. "RM", "MI")
      address.administrative_area_level_2 = component.short_name;
    } else if (types.includes('administrative_area_level_1')) {
      // Regione
      address.administrative_area_level_1 = component.long_name;
    } else if (types.includes('country')) {
      address.country = component.long_name;
      address.country_code = component.short_name;
    }
  });
  
  return address;
}

/**
 * Wrapper compatibile con l'API esistente (searchAddress)
 * Mantiene compatibilità con il codice che usa OpenStreetMap
 * @param {string} address - Indirizzo da cercare
 * @returns {Promise<Array>} Array di risultati compatibili
 */
export async function searchAddress(address) {
  if (!address || address.length < 3) return [];
  
  // Prova prima con Google Maps
  if (GOOGLE_MAPS_API_KEY) {
    try {
      const predictions = await searchAddressGoogle(address);
      
      if (predictions.length > 0) {
        // Converti in formato compatibile con il codice esistente
        return predictions.map(pred => ({
          displayName: pred.description,
          place_id: pred.place_id,
          main_text: pred.main_text,
          secondary_text: pred.secondary_text,
          // Campi per compatibilità con OpenStreetMap
          street: pred.main_text || '',
          city: '',
          postcode: '',
          provinceCode: '',
          // Flag per indicare che è da Google Maps
          _googleMaps: true
        }));
      }
    } catch (error) {
      console.warn('[Google Maps] Fallback a OpenStreetMap:', error);
    }
  }
  
  // Fallback a OpenStreetMap se Google Maps non disponibile o errore
  try {
    const { searchAddress: searchOSM } = await import('./geocoding');
    return await searchOSM(address);
  } catch (error) {
    console.error('[Geocoding] Errore fallback:', error);
    return [];
  }
}

/**
 * Seleziona un indirizzo e ottiene i dettagli completi
 * Usa place_id se disponibile (Google Maps), altrimenti usa i dati già presenti
 * @param {Object} suggestion - Suggerimento selezionato
 * @returns {Promise<Object>} Dettagli completi dell'indirizzo
 */
export async function selectAddressWithDetails(suggestion) {
  let result = null;

  // Se è da Google Maps e ha place_id, ottieni i dettagli
  if (suggestion._googleMaps && suggestion.place_id) {
    const details = await getPlaceDetails(suggestion.place_id);
    if (details) {
      result = {
        street: details.street || '',
        number: details.number || '',
        zip: details.zip || '',
        city: details.city || '',
        province: details.province || '',
        provinceCode: details.provinceCode || '',
        country: details.countryCode || 'IT',
        displayName: details.formatted_address || suggestion.displayName
      };
    }
  }

  // Fallback: dati già presenti (OpenStreetMap o manuali)
  if (!result) {
    result = {
      street: suggestion.street || '',
      number: suggestion.houseNumber || '',
      zip: suggestion.postcode || '',
      city: suggestion.city || '',
      province: suggestion.province || '',
      provinceCode: suggestion.provinceCode || '',
      country: 'IT',
      displayName: suggestion.displayName || ''
    };
  }

  // Fallback CAP/provincia da dataset comuni italiani:
  // Google Places spesso ritorna città senza CAP per piccoli centri italiani.
  if (result.city && (!result.zip || !result.provinceCode)) {
    try {
      const { findComuneExact } = await import('./comuniItaliani');
      const comune = await findComuneExact(result.city, result.provinceCode);
      if (comune) {
        if (!result.zip && comune.cap) result.zip = comune.cap;
        if (!result.provinceCode && comune.sigla) {
          result.provinceCode = comune.sigla;
          result.province = comune.provincia;
        }
      }
    } catch (e) {
      console.warn('[google-maps] comuni fallback fallito:', e.message);
    }
  }

  return result;
}
