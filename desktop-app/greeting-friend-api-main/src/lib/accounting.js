/**
 * Sistema Movimenti Contabili
 * Genera automaticamente registrazioni in partita doppia per fatture, pagamenti, note credito/debito
 * 
 * NOTA: Sistema completamente separato da SDI
 * - SDI gestisce solo la trasmissione/ricezione XML fatture
 * - I movimenti contabili sono registrazioni interne per la contabilità aziendale
 */

import { supabaseBrowser } from './supabase-browser';

/**
 * Genera movimenti contabili per una fattura emessa
 * 
 * Movimenti generati:
 * - Dare: Cliente (Crediti verso clienti) → Importo totale
 * - Avere: Ricavi vendite → Imponibile
 * - Avere: IVA a debito → Importo IVA
 */
export async function generateAccountingEntriesForInvoice(invoice, orgId) {
  const entries = [];
  
  // Calcola imponibile e IVA
  const totale = Number(invoice.total || 0);
  const items = invoice.invoice_items || [];
  
  // Calcola imponibile e IVA totale dalle righe
  let imponibile = 0;
  let iva = 0;
  
  items.forEach(item => {
    const qty = Number(item.qty || 0);
    const price = Number(item.price || 0);
    const vatPerc = Number(item.vat_perc || 22);
    
    // Applica sconto se presente
    let itemTotal = qty * price;
    if (item.sconto || item.discount) {
      const sconto = item.sconto || item.discount;
      if (sconto.percentuale !== undefined && sconto.percentuale !== null) {
        const scontoImporto = (itemTotal * Number(sconto.percentuale)) / 100;
        if (sconto.tipo === 'MG') {
          itemTotal += scontoImporto; // Maggiorazione
        } else {
          itemTotal -= scontoImporto; // Sconto
        }
      } else if (sconto.importo !== undefined && sconto.importo !== null) {
        if (sconto.tipo === 'MG') {
          itemTotal += Number(sconto.importo); // Maggiorazione
        } else {
          itemTotal -= Number(sconto.importo); // Sconto
        }
      }
    }
    
    const itemImponibile = Math.round(itemTotal * 100) / 100;
    const itemIva = Math.round((vatPerc * itemImponibile / 100) * 100) / 100;
    
    imponibile += itemImponibile;
    iva += itemIva;
  });
  
  // Arrotonda totali
  imponibile = Math.round(imponibile * 100) / 100;
  iva = Math.round(iva * 100) / 100;
  
  const accountingDate = invoice.date || new Date().toISOString().split('T')[0];
  const reference = `FATT/${invoice.number || 'N/A'}/${accountingDate}`;
  
  // Movimento 1: Dare - Cliente (Crediti verso clienti)
  entries.push({
    org_id: orgId,
    document_type: 'invoice',
    document_id: invoice.id,
    accounting_date: accountingDate,
    account_code: '120',
    account_name: 'Crediti verso clienti',
    debit_amount: totale,
    credit_amount: 0,
    description: `Fattura N. ${invoice.number || 'N/A'}`,
    reference: reference
  });
  
  // Movimento 2: Avere - Ricavi vendite
  entries.push({
    org_id: orgId,
    document_type: 'invoice',
    document_id: invoice.id,
    accounting_date: accountingDate,
    account_code: '401',
    account_name: 'Ricavi vendita ricambi usati',
    debit_amount: 0,
    credit_amount: imponibile,
    description: `Fattura N. ${invoice.number || 'N/A'}`,
    reference: reference
  });
  
  // Movimento 3: Avere - IVA a debito (solo se IVA > 0)
  if (iva > 0) {
    entries.push({
      org_id: orgId,
      document_type: 'invoice',
      document_id: invoice.id,
      accounting_date: accountingDate,
      account_code: '2001', // IVA a debito
      account_name: 'IVA a debito per operazioni imponibili',
      debit_amount: 0,
      credit_amount: iva,
      description: `IVA Fattura N. ${invoice.number || 'N/A'}`,
      reference: reference
    });
  }
  
  return entries;
}

/**
 * Genera movimenti contabili per un pagamento
 * 
 * Movimenti generati:
 * - Dare: Banca/Cassa → Importo pagato
 * - Avere: Cliente (Crediti) → Importo pagato
 */
export async function generateAccountingEntriesForPayment(payment, invoice, orgId) {
  const entries = [];
  
  const accountingDate = payment.payment_date || new Date().toISOString().split('T')[0];
  const reference = `PAG/${payment.reference_number || payment.id}`;
  
  // Determina conto in base al metodo di pagamento
  let accountCode = '1001';
  let accountName = 'Banca c/c principale';
  
  if (payment.payment_method === 'cash' || payment.payment_method === 'contanti') {
    accountCode = '1002';
    accountName = 'Cassa contanti';
  } else if (payment.payment_method === 'transfer' || payment.payment_method === 'bonifico') {
    accountCode = '1001';
    accountName = 'Banca c/c principale';
  }
  
  // Movimento 1: Dare - Banca/Cassa
  entries.push({
    org_id: orgId,
    document_type: 'payment',
    document_id: payment.id,
    accounting_date: accountingDate,
    account_code: accountCode,
    account_name: accountName,
    debit_amount: Number(payment.amount || 0),
    credit_amount: 0,
    description: `Pagamento Fattura N. ${invoice?.number || 'N/A'}`,
    reference: reference
  });
  
  // Movimento 2: Avere - Cliente (Crediti)
  entries.push({
    org_id: orgId,
    document_type: 'payment',
    document_id: payment.id,
    accounting_date: accountingDate,
    account_code: '120',
    account_name: 'Crediti verso clienti',
    debit_amount: 0,
    credit_amount: Number(payment.amount || 0),
    description: `Pagamento Fattura N. ${invoice?.number || 'N/A'}`,
    reference: reference
  });
  
  return entries;
}

/**
 * Genera movimenti contabili per una nota di credito
 * 
 * Movimenti generati (storno):
 * - Dare: Ricavi vendite → Imponibile (storno)
 * - Dare: IVA a debito → Importo IVA (storno)
 * - Avere: Cliente (Crediti) → Importo totale (storno)
 */
export async function generateAccountingEntriesForCreditNote(creditNote, orgId) {
  const entries = [];
  
  // Calcola imponibile e IVA (stesso calcolo della fattura)
  const totale = Number(creditNote.total || 0);
  const items = creditNote.invoice_items || [];
  
  let imponibile = 0;
  let iva = 0;
  
  items.forEach(item => {
    const qty = Number(item.qty || 0);
    const price = Number(item.price || 0);
    const vatPerc = Number(item.vat_perc || 22);
    
    let itemTotal = qty * price;
    if (item.sconto || item.discount) {
      const sconto = item.sconto || item.discount;
      if (sconto.percentuale !== undefined && sconto.percentuale !== null) {
        const scontoImporto = (itemTotal * Number(sconto.percentuale)) / 100;
        if (sconto.tipo === 'MG') {
          itemTotal += scontoImporto;
        } else {
          itemTotal -= scontoImporto;
        }
      } else if (sconto.importo !== undefined && sconto.importo !== null) {
        if (sconto.tipo === 'MG') {
          itemTotal += Number(sconto.importo);
        } else {
          itemTotal -= Number(sconto.importo);
        }
      }
    }
    
    const itemImponibile = Math.round(itemTotal * 100) / 100;
    const itemIva = Math.round((vatPerc * itemImponibile / 100) * 100) / 100;
    
    imponibile += itemImponibile;
    iva += itemIva;
  });
  
  imponibile = Math.round(imponibile * 100) / 100;
  iva = Math.round(iva * 100) / 100;
  
  const accountingDate = creditNote.date || new Date().toISOString().split('T')[0];
  const reference = `NC/${creditNote.number || 'N/A'}/${accountingDate}`;
  
  // Movimento 1: Dare - Ricavi vendite (storno)
  entries.push({
    org_id: orgId,
    document_type: 'credit_note',
    document_id: creditNote.id,
    accounting_date: accountingDate,
    account_code: '401',
    account_name: 'Ricavi vendita ricambi usati',
    debit_amount: imponibile,
    credit_amount: 0,
    description: `Nota Credito N. ${creditNote.number || 'N/A'}`,
    reference: reference
  });
  
  // Movimento 2: Dare - IVA a debito (storno, solo se IVA > 0)
  if (iva > 0) {
    entries.push({
      org_id: orgId,
      document_type: 'credit_note',
      document_id: creditNote.id,
      accounting_date: accountingDate,
      account_code: '2001', // IVA a debito
      account_name: 'IVA a debito per operazioni imponibili',
      debit_amount: iva,
      credit_amount: 0,
      description: `IVA Nota Credito N. ${creditNote.number || 'N/A'}`,
      reference: reference
    });
  }
  
  // Movimento 3: Avere - Cliente (Crediti) (storno)
  entries.push({
    org_id: orgId,
    document_type: 'credit_note',
    document_id: creditNote.id,
    accounting_date: accountingDate,
    account_code: '120',
    account_name: 'Crediti verso clienti',
    debit_amount: 0,
    credit_amount: totale,
    description: `Nota Credito N. ${creditNote.number || 'N/A'}`,
    reference: reference
  });
  
  return entries;
}

/**
 * Genera movimenti contabili per una fattura passiva estera (TD17, TD18, TD19)
 * 
 * Movimenti generati:
 * - Dare: Costi per acquisti → Imponibile
 * - Dare: IVA a credito → Importo IVA (se presente)
 * - Avere: Debiti verso fornitori → Importo totale
 */
export async function generateAccountingEntriesForForeignInvoice(invoiceData, orgId) {
  const entries = [];
  
  const totale = Number(invoiceData.invoice_total || 0);
  const imponibile = Number(invoiceData.invoice_imponibile || 0) || totale;
  const iva = Number(invoiceData.invoice_iva || 0) || (totale - imponibile);
  
  const accountingDate = invoiceData.invoice_date || new Date().toISOString().split('T')[0];
  const reference = `FATT-EST/${invoiceData.invoice_number || 'N/A'}/${accountingDate}`;
  const supplierDesc = invoiceData.supplier_name || 'Fornitore estero';
  const docTypeLabel = invoiceData.document_type || 'TD17';
  
  // Movimento 1: Dare - Costi per acquisti
  entries.push({
    org_id: orgId,
    document_type: 'foreign_invoice',
    document_id: null,
    accounting_date: accountingDate,
    account_code: '600',
    account_name: 'Acquisto veicoli da demolire',
    debit_amount: Math.round(imponibile * 100) / 100,
    credit_amount: 0,
    description: `${docTypeLabel} - ${supplierDesc} - Fatt. ${invoiceData.invoice_number || 'N/A'}`,
    reference: reference
  });
  
  // Movimento 2: Dare - IVA a credito (solo se IVA > 0)
  if (iva > 0) {
    entries.push({
      org_id: orgId,
      document_type: 'foreign_invoice',
      document_id: null,
      accounting_date: accountingDate,
      account_code: '2002', // IVA a credito
      account_name: 'IVA a credito per operazioni esenti o non imponibili',
      debit_amount: Math.round(iva * 100) / 100,
      credit_amount: 0,
      description: `IVA ${docTypeLabel} - ${supplierDesc} - Fatt. ${invoiceData.invoice_number || 'N/A'}`,
      reference: reference
    });
  }
  
  // Movimento 3: Avere - Debiti verso fornitori
  entries.push({
    org_id: orgId,
    document_type: 'foreign_invoice',
    document_id: null,
    accounting_date: accountingDate,
    account_code: '200',
    account_name: 'Debiti verso fornitori',
    debit_amount: 0,
    credit_amount: Math.round(totale * 100) / 100,
    description: `${docTypeLabel} - ${supplierDesc} - Fatt. ${invoiceData.invoice_number || 'N/A'}`,
    reference: reference
  });
  
  return entries;
}

/**
 * Salva movimenti contabili nel database
 */
export async function saveAccountingEntries(entries) {
  if (!entries || entries.length === 0) return;
  
  const supabase = supabaseBrowser();
  const { data, error } = await supabase
    .from('accounting_entries')
    .insert(entries)
    .select();
  
  if (error) {
    console.error('Errore salvataggio movimenti contabili:', error);
    throw error;
  }
  
  return data;
}

/**
 * Inizializza piano dei conti per un'organizzazione
 */
export async function initChartOfAccounts(orgId) {
  const supabase = supabaseBrowser();
  
  // Chiama funzione SQL per inserire conti predefiniti
  const { error } = await supabase.rpc('init_chart_of_accounts_for_org', {
    p_org_id: orgId
  });
  
  if (error) {
    console.error('Errore inizializzazione piano dei conti:', error);
    throw error;
  }
}

/**
 * Crea una fattura SDI per autofattura (TD18 o TD19)
 * Per autofatture, il destinatario è l'azienda stessa (noi)
 * @param {object} invoiceData - Dati fattura passiva estera
 * @param {object} companyData - Dati azienda (cedente e destinatario)
 * @param {string} orgId - ID organizzazione
 * @returns {Promise<object>} Fattura creata
 */
export async function createSelfInvoiceForSDI(invoiceData, companyData, orgId) {
  const supabase = supabaseBrowser();
  
  if (!['TD18', 'TD19'].includes(invoiceData.document_type)) {
    throw new Error('createSelfInvoiceForSDI può essere chiamata solo per TD18 o TD19');
  }
  
  // Prepara dati azienda
  const companyAddress = {
    street: companyData?.address || companyData?.street || null,
    zip: companyData?.zip || companyData?.zipCode || null,
    city: companyData?.city || null,
    province: companyData?.province || null,
    country: companyData?.country || "IT",
  };
  
  const rawVat = (companyData?.vat || "").replace(/\s+/g, "");
  const normalizedVat = rawVat.replace(/^IT/i, "");
  
  // CedentePrestatore = I nostri dati
  const cedentePrestatore = {
    id_fiscale_iva: {
      id_paese: "IT",
      id_codice: normalizedVat || companyData?.vat || null,
    },
    tax_code: companyData?.taxCode || null,
    denominazione: (companyData?.name || "").trim(),
    regime_fiscale: companyData?.regimeFiscale || "RF01",
    partita_iva: rawVat || null,
    indirizzo: companyAddress,
    sede: {
      indirizzo: companyAddress.street || "",
      cap: companyAddress.zip || "",
      comune: companyAddress.city || "",
      provincia: companyAddress.province || "",
      nazione: companyAddress.country || "IT",
    },
  };
  
  // CessionarioCommittente = I nostri dati (destinatario = noi stessi)
  const cessionarioCommittente = {
    id_fiscale_iva: {
      id_paese: "IT",
      id_codice: normalizedVat || companyData?.vat || null,
    },
    codice_fiscale: companyData?.taxCode || null,
    denominazione: (companyData?.name || "").trim(),
    indirizzo: companyAddress,
  };
  
  // Calcola totale, imponibile, IVA
  const totale = Number(invoiceData.invoice_total || 0);
  const imponibile = Number(invoiceData.invoice_imponibile || 0) || (totale - Number(invoiceData.invoice_iva || 0));
  const iva = Number(invoiceData.invoice_iva || 0) || (totale - imponibile);
  
  // Genera numero progressivo (formato: AUTOFATT-YYYY-NNN)
  const year = new Date().getFullYear();
  const { data: lastInvoice } = await supabase
    .from('invoices')
    .select('number')
    .eq('org_id', orgId)
    .like('number', `AUTOFATT-${year}-%`)
    .order('number', { ascending: false })
    .limit(1)
    .single();
  
  let progressivo = 1;
  if (lastInvoice?.number) {
    const match = lastInvoice.number.match(/AUTOFATT-\d{4}-(\d+)/);
    if (match) {
      progressivo = parseInt(match[1], 10) + 1;
    }
  }
  const invoiceNumber = `AUTOFATT-${year}-${String(progressivo).padStart(3, '0')}`;
  
  // Meta conforme FatturaPA
  const meta = {
    sdi_environment: "PRODUCTION", // Autofatture vanno sempre in produzione
    sdi: {
      progressivo_invio: invoiceNumber,
      cedente_prestatore: cedentePrestatore,
      cessionario_committente: cessionarioCommittente,
      trasmissione: {
        codice_destinatario: companyData?.sdiCode || companyData?.codiceDestinatario || "0000000",
        pec_destinatario: companyData?.pec || null,
        ambiente: "PRODUCTION",
      },
      documento: {
        tipo_documento: invoiceData.document_type, // TD18 o TD19
        valuta: "EUR",
      },
      riepilogo_iva: iva > 0 ? [{
        aliquota: (iva / imponibile) * 100 || 0,
        natura: invoiceData.document_type === 'TD18' ? 'N2.1' : 'N3.1', // Reverse charge o esportazione
        esigibilita: 'I',
        imponibile_importo: imponibile,
        imposta: iva,
      }] : [],
      note: `Autofattura per acquisto da ${invoiceData.supplier_name || 'fornitore estero'}${invoiceData.supplier_country ? ` (${invoiceData.supplier_country})` : ''}. Fattura originale: ${invoiceData.invoice_number || 'N/A'}`,
    },
    cessionario: {
      denominazione: (companyData?.name || "").trim(),
      codice_destinatario: companyData?.sdiCode || companyData?.codiceDestinatario || "0000000",
      pec: companyData?.pec || null,
      address: companyAddress,
      indirizzo: companyAddress,
    },
  };
  
  // Crea fattura
  const invoicePayload = {
    org_id: orgId,
    customer_name: (companyData?.name || "").trim(), // Destinatario = noi stessi
    customer_vat: rawVat || null,
    customer_tax_code: companyData?.taxCode || null,
    customer_address: companyAddress, // Destinatario = nostro indirizzo
    number: invoiceNumber,
    date: invoiceData.invoice_date || new Date().toISOString().split('T')[0],
    currency: "EUR",
    total: totale,
    provider_id: "sdi_prod", // Autofatture sempre in produzione
    sdi_status: "draft", // Bozza, da inviare a SDI
    meta,
    payment_status: "pending",
    note_internal: `Autofattura ${invoiceData.document_type} per acquisto da fornitore estero: ${invoiceData.supplier_name || 'N/A'}`,
  };
  
  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .insert(invoicePayload)
    .select('id, number')
    .single();
  
  if (invoiceError) {
    console.error('Errore creazione autofattura SDI:', invoiceError);
    throw invoiceError;
  }
  
  // Crea una riga fattura con descrizione generica
  const itemPayload = {
    invoice_id: invoice.id,
    descr: `Acquisto da ${invoiceData.supplier_name || 'fornitore estero'}${invoiceData.supplier_country ? ` (${invoiceData.supplier_country})` : ''}`,
    qty: 1,
    price: imponibile,
    vat_perc: iva > 0 ? (iva / imponibile) * 100 : 0,
  };
  
  const { error: itemError } = await supabase
    .from('invoice_items')
    .insert(itemPayload);
  
  if (itemError) {
    console.error('Errore creazione riga autofattura:', itemError);
    // Non bloccare, la fattura è già stata creata
  }
  
  return invoice;
}
