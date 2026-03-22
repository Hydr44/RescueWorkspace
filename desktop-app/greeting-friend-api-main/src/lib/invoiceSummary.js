// src/lib/invoiceSummary.js
/**
 * Genera un riassunto intelligente delle voci di una fattura
 * @param {Array} items - Array di invoice_items
 * @param {number} maxLength - Lunghezza massima del riassunto
 * @returns {string} Riassunto delle prestazioni
 */
export function generateInvoiceSummary(items, maxLength = 60) {
  if (!items || !Array.isArray(items) || items.length === 0) {
    return '';
  }

  // Raggruppa per categoria/tipo di servizio
  const categories = new Map();
  
  items.forEach(item => {
    // Priorità: item_description > item_code (ex descr) > description
    const desc = (item.item_description || item.item_code || item.descr || item.description || '').toLowerCase().trim();
    if (!desc) return;
    
    // Identifica categoria dal testo
    let category = 'Altro';
    
    if (desc.includes('ricamb') || desc.includes('pezzo') || desc.includes('parte')) {
      category = 'Ricambi';
    } else if (desc.includes('manodopera') || desc.includes('lavoro') || desc.includes('ore')) {
      category = 'Manodopera';
    } else if (desc.includes('soccorso') || desc.includes('traino') || desc.includes('trasporto')) {
      category = 'Soccorso stradale';
    } else if (desc.includes('demoliz') || desc.includes('rottamaz')) {
      category = 'Demolizione';
    } else if (desc.includes('deposito') || desc.includes('custodia')) {
      category = 'Deposito';
    } else if (desc.includes('pneumatic') || desc.includes('gomm')) {
      category = 'Pneumatici';
    } else if (desc.includes('carburante') || desc.includes('benzina') || desc.includes('gasolio')) {
      category = 'Carburante';
    } else if (desc.includes('lavaggio') || desc.includes('pulizia')) {
      category = 'Lavaggio';
    } else if (desc.includes('revisione') || desc.includes('tagliando')) {
      category = 'Manutenzione';
    } else {
      // Usa la prima parola significativa come categoria
      const words = desc.split(/\s+/).filter(w => w.length > 3);
      if (words.length > 0) {
        category = words[0].charAt(0).toUpperCase() + words[0].slice(1);
      }
    }
    
    const count = categories.get(category) || 0;
    categories.set(category, count + 1);
  });

  // Costruisci il riassunto
  const parts = [];
  let totalLength = 0;
  
  // Ordina per numero di voci (più frequenti prima)
  const sortedCategories = Array.from(categories.entries())
    .sort((a, b) => b[1] - a[1]);
  
  for (const [category, count] of sortedCategories) {
    let part = category;
    if (count > 1) {
      part += ` (${count})`;
    }
    
    const newLength = totalLength + part.length + (parts.length > 0 ? 2 : 0); // +2 per ", "
    
    if (newLength > maxLength) {
      if (parts.length === 0) {
        // Se è il primo elemento e supera già il limite, troncalo
        parts.push(part.substring(0, maxLength - 3) + '...');
      } else {
        // Aggiungi "..." per indicare che ci sono altre voci
        parts.push('...');
      }
      break;
    }
    
    parts.push(part);
    totalLength = newLength;
  }
  
  return parts.join(', ');
}

/**
 * Estrae un riassunto dalle note esterne o genera uno dalle voci
 * @param {Object} invoice - Oggetto fattura con note_external e/o invoice_items
 * @returns {string} Riassunto della fattura
 */
export function getInvoiceDescription(invoice) {
  // Priorità 1: note_external se presente
  if (invoice.note_external && invoice.note_external.trim()) {
    return invoice.note_external.trim();
  }
  
  // Priorità 2: genera da invoice_items se disponibili
  if (invoice.invoice_items && Array.isArray(invoice.invoice_items) && invoice.invoice_items.length > 0) {
    const summary = generateInvoiceSummary(invoice.invoice_items);
    if (summary) return summary;
  }
  
  // Fallback: nessuna descrizione disponibile
  return '';
}
