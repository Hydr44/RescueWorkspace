// src/lib/geocoding.js
// Auto-completamento indirizzi con OpenStreetMap Nominatim (fallback)
// Se Google Maps è configurato, viene usato quello (vedi google-maps.js)

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

/**
 * Cerca un indirizzo in Italia usando Nominatim
 * @param {string} address - Indirizzo da cercare (via, piazza, etc)
 * @returns {Promise<Array>} Array di risultati con CAP, città, provincia
 */
export async function searchAddress(address) {
  if (!address || address.length < 3) return [];

  try {
    const params = new URLSearchParams({
      q: address,
      format: 'json',
      addressdetails: '1',
      countrycodes: 'it',
      limit: '5'
    });

    const response = await fetch(`${NOMINATIM_URL}?${params}`, {
      headers: {
        'User-Agent': 'RescueManager/1.0' // Nominatim richiede un User-Agent
      }
    });

    if (!response.ok) return [];
    
    const data = await response.json();
    
    return data.map(item => ({
      displayName: item.display_name,
      street: item.address?.road || '',
      houseNumber: item.address?.house_number || '',
      postcode: item.address?.postcode || '',
      city: item.address?.city || item.address?.town || item.address?.village || '',
      province: item.address?.state || '',
      // Estrai sigla provincia da state (es. "Provincia di Roma" -> "RM")
      provinceCode: extractProvinceCode(item.address?.state || ''),
      lat: item.lat,
      lon: item.lon
    }));
  } catch (error) {
    console.error('Errore geocoding:', error);
    return [];
  }
}

/**
 * Estrae il codice provincia da una stringa (es. "Provincia di Roma" -> "RM")
 */
function extractProvinceCode(state) {
  const provinceMap = {
    'agrigento': 'AG', 'alessandria': 'AL', 'ancona': 'AN', 'aosta': 'AO',
    'arezzo': 'AR', 'ascoli piceno': 'AP', 'asti': 'AT', 'avellino': 'AV',
    'bari': 'BA', 'barletta-andria-trani': 'BT', 'belluno': 'BL', 'benevento': 'BN',
    'bergamo': 'BG', 'biella': 'BI', 'bologna': 'BO', 'bolzano': 'BZ',
    'brescia': 'BS', 'brindisi': 'BR', 'cagliari': 'CA', 'caltanissetta': 'CL',
    'campobasso': 'CB', 'carbonia-iglesias': 'CI', 'caserta': 'CE', 'catania': 'CT',
    'catanzaro': 'CZ', 'chieti': 'CH', 'como': 'CO', 'cosenza': 'CS',
    'cremona': 'CR', 'crotone': 'KR', 'cuneo': 'CN', 'enna': 'EN',
    'fermo': 'FM', 'ferrara': 'FE', 'firenze': 'FI', 'foggia': 'FG',
    'forlì-cesena': 'FC', 'frosinone': 'FR', 'genova': 'GE', 'gorizia': 'GO',
    'grosseto': 'GR', 'imperia': 'IM', 'isernia': 'IS', 'la spezia': 'SP',
    'l\'aquila': 'AQ', 'latina': 'LT', 'lecce': 'LE', 'lecco': 'LC',
    'livorno': 'LI', 'lodi': 'LO', 'lucca': 'LU', 'macerata': 'MC',
    'mantova': 'MN', 'massa-carrara': 'MS', 'matera': 'MT', 'messina': 'ME',
    'milano': 'MI', 'modena': 'MO', 'monza e brianza': 'MB', 'napoli': 'NA',
    'novara': 'NO', 'nuoro': 'NU', 'oristano': 'OR', 'padova': 'PD',
    'palermo': 'PA', 'parma': 'PR', 'pavia': 'PV', 'perugia': 'PG',
    'pesaro e urbino': 'PU', 'pescara': 'PE', 'piacenza': 'PC', 'pisa': 'PI',
    'pistoia': 'PT', 'pordenone': 'PN', 'potenza': 'PZ', 'prato': 'PO',
    'ragusa': 'RG', 'ravenna': 'RA', 'reggio calabria': 'RC', 'reggio emilia': 'RE',
    'rieti': 'RI', 'rimini': 'RN', 'roma': 'RM', 'rovigo': 'RO',
    'salerno': 'SA', 'sassari': 'SS', 'savona': 'SV', 'siena': 'SI',
    'siracusa': 'SR', 'sondrio': 'SO', 'taranto': 'TA', 'teramo': 'TE',
    'terni': 'TR', 'torino': 'TO', 'trapani': 'TP', 'trento': 'TN',
    'treviso': 'TV', 'trieste': 'TS', 'udine': 'UD', 'varese': 'VA',
    'venezia': 'VE', 'verbano-cusio-ossola': 'VB', 'vercelli': 'VC', 'verona': 'VR',
    'vibo valentia': 'VV', 'vicenza': 'VI', 'viterbo': 'VT'
  };

  const normalized = state.toLowerCase()
    .replace(/provincia di /gi, '')
    .replace(/libero consorzio comunale di /gi, '')
    .trim();

  return provinceMap[normalized] || '';
}
