import { useState, useCallback, useEffect } from 'react';

// Validazione targa italiana
export const validateTarga = (targa) => {
  if (!targa) return { valid: false, message: 'Targa obbligatoria' };
  
  const cleanTarga = targa.toUpperCase().replace(/\s/g, '');
  
  // Formato nuovo (AA 000 AA)
  const nuovoFormato = /^[A-Z]{2}[0-9]{3}[A-Z]{2}$/;
  // Formato vecchio (AA 000000)
  const vecchioFormato = /^[A-Z]{2}[0-9]{6}$/;
  // Formato moto (AA 00000)
  const motoFormato = /^[A-Z]{2}[0-9]{5}$/;
  
  if (nuovoFormato.test(cleanTarga)) {
    return { valid: true, message: 'Formato targa valido' };
  }
  
  if (vecchioFormato.test(cleanTarga)) {
    return { valid: true, message: 'Formato targa vecchio valido' };
  }
  
  if (motoFormato.test(cleanTarga)) {
    return { valid: true, message: 'Formato targa moto valido' };
  }
  
  return { valid: false, message: 'Formato targa non valido' };
};

// Validazione codice fiscale
export const validateCodiceFiscale = (cf) => {
  if (!cf) return { valid: false, message: 'Codice fiscale obbligatorio' };
  
  const cleanCf = cf.toUpperCase().replace(/\s/g, '');
  
  if (cleanCf.length !== 16) {
    return { valid: false, message: 'Il codice fiscale deve essere di 16 caratteri' };
  }
  
  const cfRegex = /^[A-Z]{6}[0-9]{2}[A-Z][0-9]{2}[A-Z][0-9]{3}[A-Z]$/;
  if (!cfRegex.test(cleanCf)) {
    return { valid: false, message: 'Formato codice fiscale non valido' };
  }
  
  // Controllo caratteri di controllo (simplified)
  const dispari = [1, 0, 5, 7, 9, 13, 15, 17, 19, 21, 2, 4, 18, 20, 11, 3, 6, 8, 12, 14, 16, 10, 22, 25, 24, 23];
  const pari = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25];
  
  let somma = 0;
  for (let i = 0; i < 15; i++) {
    const char = cleanCf[i];
    if (i % 2 === 0) {
      // Posizione dispari
      if (char >= '0' && char <= '9') {
        somma += dispari[char.charCodeAt(0) - 48];
      } else {
        somma += dispari[char.charCodeAt(0) - 65];
      }
    } else {
      // Posizione pari
      if (char >= '0' && char <= '9') {
        somma += pari[char.charCodeAt(0) - 48];
      } else {
        somma += pari[char.charCodeAt(0) - 65];
      }
    }
  }
  
  const resto = somma % 26;
  const carattereControllo = String.fromCharCode(65 + resto);
  
  if (cleanCf[15] !== carattereControllo) {
    return { valid: false, message: 'Codice fiscale non valido' };
  }
  
  return { valid: true, message: 'Codice fiscale valido' };
};

// Validazione telaio
export const validateTelaio = (telaio) => {
  if (!telaio) return { valid: false, message: 'Telaio obbligatorio' };
  
  const cleanTelaio = telaio.toUpperCase().replace(/\s/g, '');
  
  if (cleanTelaio.length !== 17) {
    return { valid: false, message: 'Il telaio deve essere di 17 caratteri' };
  }
  
  const telaioRegex = /^[A-HJ-NPR-Z0-9]{17}$/;
  if (!telaioRegex.test(cleanTelaio)) {
    return { valid: false, message: 'Formato telaio non valido (contiene caratteri non ammessi)' };
  }
  
  return { valid: true, message: 'Telaio valido' };
};

// Validazione email
export const validateEmail = (email) => {
  if (!email) return { valid: true, message: '' }; // Email opzionale
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, message: 'Formato email non valido' };
  }
  
  return { valid: true, message: 'Email valida' };
};

// Validazione telefono
export const validateTelefono = (telefono) => {
  if (!telefono) return { valid: true, message: '' }; // Telefono opzionale
  
  const cleanTelefono = telefono.replace(/\s/g, '');
  const telefonoRegex = /^(\+39)?[0-9]{9,10}$/;
  
  if (!telefonoRegex.test(cleanTelefono)) {
    return { valid: false, message: 'Formato telefono non valido' };
  }
  
  return { valid: true, message: 'Telefono valido' };
};

// Validazione CAP
export const validateCAP = (cap) => {
  if (!cap) return { valid: true, message: '' }; // CAP opzionale
  
  const capRegex = /^[0-9]{5}$/;
  if (!capRegex.test(cap)) {
    return { valid: false, message: 'CAP deve essere di 5 cifre' };
  }
  
  return { valid: true, message: 'CAP valido' };
};

// Hook per validazione real-time
export const useFormValidation = (initialValues = {}) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const validateField = useCallback((name, value) => {
    switch (name) {
      case 'targa':
        return validateTarga(value);
      case 'rvfu_proprietario_cf':
        return validateCodiceFiscale(value);
      case 'telaio':
        return validateTelaio(value);
      case 'rvfu_proprietario_email':
        return validateEmail(value);
      case 'rvfu_proprietario_telefono':
        return validateTelefono(value);
      case 'rvfu_cap':
        return validateCAP(value);
      default:
        return { valid: true, message: '' };
    }
  }, []);

  const setValue = useCallback((name, value) => {
    setValues(prev => ({ ...prev, [name]: value }));
    
    // Validazione real-time se il campo è stato toccato
    if (touched[name]) {
      const validation = validateField(name, value);
      setErrors(prev => ({ ...prev, [name]: validation }));
    }
  }, [touched, validateField]);

  const setTouched = useCallback((name) => {
    setTouched(prev => ({ ...prev, [name]: true }));
    
    // Validazione immediata quando il campo viene toccato
    const validation = validateField(name, values[name]);
    setErrors(prev => ({ ...prev, [name]: validation }));
  }, [values, validateField]);

  const validateAll = useCallback(() => {
    const newErrors = {};
    let isValid = true;

    Object.keys(values).forEach(name => {
      const validation = validateField(name, values[name]);
      newErrors[name] = validation;
      if (!validation.valid) {
        isValid = false;
      }
    });

    setErrors(newErrors);
    setTouched(Object.keys(values).reduce((acc, key) => ({ ...acc, [key]: true }), {}));
    
    return isValid;
  }, [values, validateField]);

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  return {
    values,
    errors,
    touched,
    setValue,
    setTouched,
    validateAll,
    reset,
    isValid: Object.values(errors).every(error => error.valid)
  };
};