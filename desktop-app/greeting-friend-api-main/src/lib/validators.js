/**
 * Validators per dati trasporti e altri moduli
 * Validazione lato client e server
 */

/**
 * Valida coordinate GPS
 */
export function validateCoordinates(coords) {
  if (!coords) return { valid: false, error: "Coordinate mancanti" };
  
  const { lat, lng } = coords;
  
  if (typeof lat !== 'number' || typeof lng !== 'number') {
    return { valid: false, error: "Coordinate devono essere numeri" };
  }
  
  // Range validi: lat [-90, 90], lng [-180, 180]
  if (lat < -90 || lat > 90) {
    return { valid: false, error: `Latitudine ${lat} fuori range [-90, 90]` };
  }
  
  if (lng < -180 || lng > 180) {
    return { valid: false, error: `Longitudine ${lng} fuori range [-180, 180]` };
  }
  
  return { valid: true };
}

/**
 * Valida transizioni di stato trasporto
 */
export function validateStatusTransition(currentStatus, newStatus) {
  const validTransitions = {
    'new': ['assigned', 'done'], // Può essere assegnato o completato direttamente
    'assigned': ['enroute', 'new', 'done'], // Può tornare a new o andare in viaggio
    'enroute': ['done', 'assigned'], // Può completare o tornare ad assegnato
    'done': [] // Stato finale, non può cambiare
  };
  
  const allowed = validTransitions[currentStatus] || [];
  
  if (!allowed.includes(newStatus)) {
    return {
      valid: false,
      error: `Transizione da "${currentStatus}" a "${newStatus}" non permessa. Stati validi: ${allowed.join(', ') || 'nessuno'}`
    };
  }
  
  return { valid: true };
}

/**
 * Valida data/ora schedulazione
 */
export function validateScheduledDateTime(date, time) {
  if (!date) return { valid: true }; // Opzionale
  
  try {
    const scheduledDate = new Date(`${date}T${time || '00:00'}`);
    const now = new Date();
    
    if (isNaN(scheduledDate.getTime())) {
      return { valid: false, error: "Data/ora non valida" };
    }
    
    // Non può essere nel passato (con tolleranza di 1 ora)
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    if (scheduledDate < oneHourAgo) {
      return { valid: false, error: "Data/ora non può essere nel passato" };
    }
    
    return { valid: true, scheduledDate };
  } catch (error) {
    return { valid: false, error: "Errore validazione data/ora" };
  }
}

/**
 * Valida form trasporto completo
 */
export function validateTransportForm(form) {
  const errors = {};
  
  // Cliente obbligatorio
  if (!form.client_name?.trim() && !form.client_id) {
    errors.client_name = "Nome cliente è obbligatorio";
  }
  
  // Indirizzi obbligatori
  if (!form.pickup_address?.trim()) {
    errors.pickup_address = "Indirizzo di partenza è obbligatorio";
  }
  
  if (!form.dropoff_address?.trim()) {
    errors.dropoff_address = "Indirizzo di arrivo è obbligatorio";
  }
  
  // Valida coordinate se presenti
  if (form.pickup_coords) {
    const coordsValidation = validateCoordinates(form.pickup_coords);
    if (!coordsValidation.valid) {
      errors.pickup_coords = coordsValidation.error;
    }
  }
  
  if (form.dropoff_coords) {
    const coordsValidation = validateCoordinates(form.dropoff_coords);
    if (!coordsValidation.valid) {
      errors.dropoff_coords = coordsValidation.error;
    }
  }
  
  // Valida prezzo se presente
  if (form.price && form.price !== '') {
    const price = parseFloat(form.price);
    if (isNaN(price) || price < 0) {
      errors.price = "Prezzo deve essere un numero positivo";
    }
  }
  
  // Valida data/ora schedulazione
  if (form.scheduled_date) {
    const dateValidation = validateScheduledDateTime(form.scheduled_date, form.scheduled_time);
    if (!dateValidation.valid) {
      errors.scheduled_date = dateValidation.error;
    }
  }
  
  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Sanitizza input testo (rimuove caratteri pericolosi)
 */
export function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  
  return input
    .replace(/[<>]/g, '') // Rimuovi tag HTML
    .replace(/['"`;]/g, '') // Rimuovi quote e semicolon
    .trim();
}

/**
 * Valida numero telefono (formato italiano/internazionale)
 */
export function validatePhone(phone) {
  if (!phone) return { valid: true }; // Opzionale
  
  // Rimuovi spazi e caratteri speciali
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  
  // Formato italiano: +39 seguito da 9-10 cifre
  // Formato internazionale: + seguito da 7-15 cifre
  const phoneRegex = /^(\+39[0-9]{9,10}|\+[0-9]{7,15}|[0-9]{9,10})$/;
  
  if (!phoneRegex.test(cleaned)) {
    return { valid: false, error: "Numero telefono non valido" };
  }
  
  return { valid: true, cleaned };
}

/**
 * Valida email
 */
export function validateEmail(email) {
  if (!email) return { valid: true }; // Opzionale
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(email)) {
    return { valid: false, error: "Email non valida" };
  }
  
  return { valid: true };
}
