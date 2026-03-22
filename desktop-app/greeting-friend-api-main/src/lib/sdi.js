// src/lib/sdi.js
// API client per Sistema di Interscambio (SDI)

import { API } from "./apiConfig";
import { supabaseBrowser } from "@/lib/supabase-browser";

async function buildAuthHeaders() {
  const headers = {
    "Content-Type": "application/json",
  };

  try {
    const supabase = supabaseBrowser();
    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token;
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  } catch (error) {
    console.warn("[SDI] Impossibile recuperare sessione Supabase:", error);
  }

  return headers;
}

/**
 * Trasmette fattura al SDI via SFTP
 * @param {string} invoiceId - ID fattura
 * @param {object} options - Opzioni
 * @param {boolean} options.testMode - Se true, usa ambiente test
 * @param {string} options.orgId - ID organizzazione (richiesto)
 * @returns {Promise<{success: boolean, filename?: string, invoices_sent?: number, test_mode?: boolean, error?: string}>}
 */
export async function sendInvoiceToSDI(invoiceId, options = {}) {
  const { testMode = false, orgId } = options;
  
  // Usa VPS direttamente - chiama il server VPS
  const sdiSftpServerUrl = import.meta.env.VITE_SDI_SFTP_SERVER_URL || 'http://sdi-sftp.rescuemanager.eu';
  const endpoint = `${sdiSftpServerUrl}/api/sdi-sftp/send`;

  console.log('[SDI-SFTP] sendInvoiceToSDI chiamato:', { invoiceId, testMode, orgId, endpoint });

  if (!orgId) {
    throw new Error('orgId richiesto per invio SDI-SFTP');
  }

  const payload = {
    invoice_ids: [invoiceId],
    org_id: orgId,
    test_mode: testMode,
  };

  console.log('[SDI-SFTP] Payload:', payload);
  const headers = await buildAuthHeaders();

  try {
    const r = await fetch(endpoint, {
      method: "POST",
      headers,
      credentials: "include",
      body: JSON.stringify(payload),
    });

    console.log('[SDI-SFTP] Risposta HTTP:', { status: r.status, statusText: r.statusText, ok: r.ok });

    if (!r.ok) {
      const errorData = await r.json().catch(() => ({ error: r.statusText }));
      console.error('[SDI-SFTP] Errore risposta:', errorData);
      throw new Error(errorData.error || errorData.details || errorData.message || `HTTP ${r.status}`);
    }

    const responseData = await r.json();
    console.log('[SDI-SFTP] Dati risposta:', responseData);
    
    // Adatta risposta al formato atteso dal frontend
    return {
      success: responseData.success || true,
      filename: responseData.filename,
      invoices_sent: responseData.invoices_sent,
      test_mode: responseData.test_mode,
      identificativo_sdi: responseData.identificativo_sdi,
      message: responseData.message,
    };
  } catch (error) {
    console.error('[SDI-SFTP] Errore fetch:', error);
    throw error;
  }
}

/**
 * Recupera l'elenco dei file FO (fatture passive ricevute)
 * @param {object} options - Opzioni
 * @param {boolean} options.testMode - Se true, usa ambiente test
 * @param {number} options.limit - Numero massimo di risultati (default: 50)
 * @returns {Promise<{test_mode: boolean, files: Array, summary: Object}>}
 */
export async function getIncomingInvoices(options = {}) {
  const { testMode = false, limit = 50, orgId } = options;
  
  const sdiSftpServerUrl = import.meta.env.VITE_SDI_SFTP_SERVER_URL || 'http://sdi-sftp.rescuemanager.eu';
  let endpoint = `${sdiSftpServerUrl}/api/sdi-sftp/files/incoming?test_mode=${testMode}&limit=${limit}`;
  
  // Aggiungi orgId se disponibile
  if (orgId) {
    endpoint += `&org_id=${encodeURIComponent(orgId)}`;
  }

  console.log('[SDI-SFTP] getIncomingInvoices chiamato:', { testMode, limit, orgId, endpoint });

  const headers = await buildAuthHeaders();
  
  try {
    const r = await fetch(endpoint, {
      method: 'GET',
      headers,
      credentials: 'include',
    });

    if (!r.ok) {
      const errorData = await r.json().catch(() => ({ error: r.statusText }));
      console.error('[SDI-SFTP] Errore risposta:', errorData);
      throw new Error(errorData.error || errorData.details || errorData.message || `HTTP ${r.status}`);
    }

    const responseData = await r.json();
    console.log('[SDI-SFTP] Dati risposta:', responseData);
    
    return responseData;
  } catch (error) {
    console.error('[SDI-SFTP] Errore fetch:', error);
    throw error;
  }
}

/**
 * Decifra un file FO ed estrae il contenuto XML
 * @param {string} filename - Nome file FO (es: FO.02166430856.2026014.1554.901.zip.p7m.enc)
 * @param {object} options - Opzioni
 * @param {boolean} options.testMode - Se true, usa ambiente test
 * @returns {Promise<{success: boolean, filename: string, xml_files: Array, invoice_data: Object}>}
 */
export async function decryptIncomingInvoice(filename, options = {}) {
  const { testMode = false } = options;
  
  const sdiSftpServerUrl = import.meta.env.VITE_SDI_SFTP_SERVER_URL || 'http://sdi-sftp.rescuemanager.eu';
  const endpoint = `${sdiSftpServerUrl}/api/sdi-sftp/files/incoming/${encodeURIComponent(filename)}/decrypt?test_mode=${testMode}`;

  console.log('[SDI-SFTP] decryptIncomingInvoice chiamato:', { filename, testMode, endpoint });

  try {
    const r = await fetch(endpoint, {
      method: 'POST',
      credentials: 'include',
    });

    if (!r.ok) {
      const errorData = await r.json().catch(() => ({ error: r.statusText }));
      console.error('[SDI-SFTP] Errore risposta:', errorData);
      throw new Error(errorData.error || errorData.details || errorData.message || `HTTP ${r.status}`);
    }

    const responseData = await r.json();
    console.log('[SDI-SFTP] Dati risposta:', responseData);
    
    return responseData;
  } catch (error) {
    console.error('[SDI-SFTP] Errore fetch:', error);
    throw error;
  }
}

/**
 * Valida dati fattura prima dell'invio a SDI
 * Controlla campi obbligatori FatturaPA 1.2.2 lato client
 * @param {string} invoiceId - ID fattura
 * @returns {Promise<{success: boolean, errors?: string[], warnings?: string[]}>}
 */
export async function validateInvoiceXML(invoiceId) {
  const supabase = supabaseBrowser();
  const errors = [];
  const warnings = [];

  // Carica fattura
  const { data: inv, error: e1 } = await supabase
    .from('invoices')
    .select('*')
    .eq('id', invoiceId)
    .single();
  if (e1 || !inv) return { success: false, errors: ['Fattura non trovata'] };

  // Carica righe
  const { data: items, error: e2 } = await supabase
    .from('invoice_items')
    .select('*')
    .eq('invoice_id', invoiceId);
  if (e2) return { success: false, errors: ['Righe fattura non trovate'] };

  // Carica dati azienda
  const { data: org } = await supabase
    .from('orgs')
    .select('name, vat, tax_code, address')
    .eq('id', inv.org_id)
    .single();

  // === VALIDAZIONE CEDENTE (azienda) ===
  if (!org?.vat && !org?.tax_code) {
    errors.push('Cedente: P.IVA o Codice Fiscale obbligatorio');
  }
  if (!org?.name) {
    errors.push('Cedente: Denominazione obbligatoria');
  }

  // === VALIDAZIONE CESSIONARIO (cliente) ===
  if (!inv.customer_name) {
    errors.push('Cliente: Denominazione obbligatoria');
  }
  if (!inv.customer_vat && !inv.customer_tax_code) {
    errors.push('Cliente: P.IVA o Codice Fiscale obbligatorio');
  }

  // Validazione P.IVA formato
  if (inv.customer_vat && !/^\d{11}$/.test(inv.customer_vat)) {
    warnings.push('Cliente: P.IVA deve essere 11 cifre numeriche');
  }

  // Validazione CF formato
  if (inv.customer_tax_code && !/^[A-Z]{6}\d{2}[A-Z]\d{2}[A-Z]\d{3}[A-Z]$/i.test(inv.customer_tax_code) && !/^\d{11}$/.test(inv.customer_tax_code)) {
    warnings.push('Cliente: Codice Fiscale formato non standard');
  }

  // === VALIDAZIONE DOCUMENTO ===
  if (!inv.number) {
    errors.push('Numero fattura obbligatorio');
  }
  if (!inv.date) {
    errors.push('Data fattura obbligatoria');
  }

  // Tipo documento
  const tipoDoc = inv.meta?.sdi?.documento?.tipo_documento || 'TD01';
  const tipiValidi = ['TD01', 'TD02', 'TD04', 'TD05', 'TD06', 'TD16', 'TD17', 'TD18', 'TD19', 'TD20', 'TD24', 'TD25', 'TD26', 'TD27'];
  if (!tipiValidi.includes(tipoDoc)) {
    errors.push('Tipo documento non valido: ' + tipoDoc);
  }

  // === VALIDAZIONE RIGHE ===
  if (!items || items.length === 0) {
    errors.push('La fattura deve contenere almeno una riga');
  } else {
    items.forEach((item, i) => {
      const n = i + 1;
      if (!item.descr || item.descr.trim() === '') {
        errors.push('Riga ' + n + ': Descrizione obbligatoria');
      }
      if (item.descr && item.descr.length > 1000) {
        errors.push('Riga ' + n + ': Descrizione troppo lunga (max 1000 caratteri)');
      }
      const qty = Number(item.qty || 0);
      if (qty <= 0) {
        errors.push('Riga ' + n + ': Quantita deve essere > 0');
      }
      const price = Number(item.price || 0);
      if (price < 0) {
        errors.push('Riga ' + n + ': Prezzo non puo essere negativo');
      }
      const vatPerc = Number(item.vat_perc || 0);
      if (vatPerc < 0 || vatPerc > 100) {
        errors.push('Riga ' + n + ': Aliquota IVA non valida');
      }
      // Se aliquota 0%, serve Natura IVA
      if (vatPerc === 0 && !item.natura) {
        warnings.push('Riga ' + n + ': Aliquota IVA 0% richiede Natura IVA (N1-N7)');
      }
    });
  }

  // === VALIDAZIONE INDIRIZZO CLIENTE ===
  const addr = inv.customer_address || inv.meta?.sdi?.cessionario?.address;
  if (addr) {
    if (addr.zip && !/^\d{5}$/.test(addr.zip)) {
      errors.push('CAP cliente non valido: deve essere 5 cifre');
    }
    if (addr.province && !/^[A-Z]{2}$/i.test(addr.province)) {
      warnings.push('Provincia cliente: formato consigliato 2 lettere (es. MI, RM)');
    }
  } else {
    warnings.push('Indirizzo cliente mancante (consigliato per FatturaPA)');
  }

  // === VALIDAZIONE TRASMISSIONE ===
  const trasm = inv.meta?.sdi?.trasmissione;
  if (!trasm?.codice_destinatario && !trasm?.pec_destinatario) {
    warnings.push('Codice Destinatario o PEC mancante (necessario per invio SDI)');
  }
  if (trasm?.codice_destinatario && trasm.codice_destinatario !== '0000000' && !/^[A-Z0-9]{7}$/i.test(trasm.codice_destinatario)) {
    errors.push('Codice Destinatario deve essere 7 caratteri alfanumerici');
  }

  // === VALIDAZIONE BOLLO VIRTUALE (Art. 6 DM 17/06/2014) ===
  const bolloAttivo = inv.bollo_virtuale || inv.meta?.sdi?.bollo_virtuale;
  if (!bolloAttivo && items?.length > 0) {
    const hasEsente = items.some(item => {
      const natura = item.natura || '';
      return natura.startsWith('N1') || natura.startsWith('N2') || natura.startsWith('N3') || natura.startsWith('N4');
    });
    const totale = Number(inv.total || 0);
    if (hasEsente && totale > 77.47) {
      warnings.push('Bollo virtuale: obbligatorio per fatture esenti IVA (Natura N1-N4) con importo > €77,47');
    }
  }

  // === VALIDAZIONE PAGAMENTO ===
  const pag = inv.meta?.sdi?.pagamento;
  if (!pag?.modalita) {
    warnings.push('Modalita di pagamento non specificata');
  }

  return {
    success: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

/**
 * Importa una fattura passiva (FO) nel database
 * Decifra il file, estrae XML FatturaPA, e salva come record invoice
 * @param {string} filename - Nome file FO
 * @param {object} options
 * @param {string} options.orgId - ID organizzazione
 * @param {boolean} options.testMode - Se true, usa ambiente test
 * @returns {Promise<{success: boolean, invoice_id?: string, error?: string}>}
 */
export async function importIncomingInvoice(filename, options = {}) {
  const { orgId, testMode = false } = options;
  if (!orgId) throw new Error('orgId richiesto');

  const supabase = supabaseBrowser();

  // 1. Decifra il file FO
  const decrypted = await decryptIncomingInvoice(filename, { testMode });
  if (!decrypted.success || !decrypted.xml_files?.length) {
    return { success: false, error: 'Decifratura fallita o nessun file XML trovato' };
  }

  // 2. Cerca il file XML FatturaPA (non le notifiche NS/RC/MC)
  const fatturaXml = decrypted.xml_files.find(f =>
    f.content && f.content.includes('FatturaElettronica')
  );

  if (!fatturaXml) {
    // Potrebbe essere una notifica, non una fattura
    const notifiche = decrypted.xml_files.filter(f =>
      f.content && (f.content.includes('RicevutaScarto') || f.content.includes('RicevutaConsegna') || f.content.includes('NotificaEsito'))
    );
    if (notifiche.length > 0) {
      return { success: true, is_notification: true, notification_count: notifiche.length };
    }
    return { success: false, error: 'Nessuna FatturaPA trovata nel file' };
  }

  // 3. Parse XML FatturaPA per estrarre dati
  const xml = fatturaXml.content;
  const extract = (tag) => {
    const m = xml.match(new RegExp('<' + tag + '>([^<]*)</' + tag + '>'));
    return m ? m[1].trim() : null;
  };

  // Dati cedente (fornitore)
  const cedenteDenom = extract('Denominazione');
  const cedenteVat = extract('IdCodice');
  const cedenteCF = extract('CodiceFiscale');

  // Dati documento
  const tipoDoc = extract('TipoDocumento') || 'TD01';
  const divisa = extract('Divisa') || 'EUR';
  const dataDoc = extract('Data');
  const numero = extract('Numero');

  // Importo totale
  const importoTotaleMatch = xml.match(/<ImportoTotaleDocumento>([^<]+)<\/ImportoTotaleDocumento>/);
  const importoTotale = importoTotaleMatch ? parseFloat(importoTotaleMatch[1]) : 0;

  // Righe dettaglio
  const righeMatches = xml.matchAll(/<DettaglioLinee>([\s\S]*?)<\/DettaglioLinee>/g);
  const items = [];
  for (const rigaMatch of righeMatches) {
    const rigaXml = rigaMatch[1];
    const descr = rigaXml.match(/<Descrizione>([^<]*)<\/Descrizione>/)?.[1] || '';
    const qty = parseFloat(rigaXml.match(/<Quantita>([^<]*)<\/Quantita>/)?.[1] || '1');
    const price = parseFloat(rigaXml.match(/<PrezzoUnitario>([^<]*)<\/PrezzoUnitario>/)?.[1] || '0');
    const vatPerc = parseFloat(rigaXml.match(/<AliquotaIVA>([^<]*)<\/AliquotaIVA>/)?.[1] || '22');
    items.push({ descr, qty, price, vat_perc: vatPerc });
  }

  // 4. Controlla se gia importata (evita duplicati)
  const { data: existing } = await supabase
    .from('invoices')
    .select('id')
    .eq('org_id', orgId)
    .eq('number', numero || filename)
    .eq('meta->>source', 'sdi_incoming')
    .limit(1);

  if (existing?.length > 0) {
    return { success: true, already_imported: true, invoice_id: existing[0].id };
  }

  // 5. Salva fattura passiva nel DB
  const { data: newInv, error: insertErr } = await supabase
    .from('invoices')
    .insert({
      org_id: orgId,
      customer_name: cedenteDenom || 'Fornitore sconosciuto',
      customer_vat: cedenteVat || '',
      customer_tax_code: cedenteCF || '',
      number: numero || filename,
      date: dataDoc || new Date().toISOString().split('T')[0],
      currency: divisa,
      total: importoTotale || items.reduce((s, r) => s + r.qty * r.price * (1 + r.vat_perc / 100), 0),
      sdi_status: 'received',
      meta: {
        source: 'sdi_incoming',
        tipo_documento: tipoDoc,
        fo_filename: filename,
        imported_at: new Date().toISOString(),
        original_xml: xml,
        sdi: {
          cedente_prestatore: {
            denominazione: cedenteDenom,
            partita_iva: cedenteVat,
            codice_fiscale: cedenteCF,
          },
          documento: { tipo_documento: tipoDoc },
        },
      },
    })
    .select('id')
    .single();

  if (insertErr) {
    return { success: false, error: 'Errore salvataggio: ' + insertErr.message };
  }

  // 6. Salva righe fattura
  if (items.length > 0 && newInv?.id) {
    const itemRows = items.map(item => ({
      invoice_id: newInv.id,
      descr: item.descr,
      qty: item.qty,
      price: item.price,
      vat_perc: item.vat_perc,
    }));
    await supabase.from('invoice_items').insert(itemRows);
  }

  return { success: true, invoice_id: newInv?.id };
}

/**
 * Processa notifiche SDI (EO/ER) e aggiorna stato fatture
 * @param {object} options
 * @param {string} options.orgId - ID organizzazione
 * @param {boolean} options.testMode - Se true, usa ambiente test
 * @returns {Promise<{success: boolean, processed: object, summary: object}>}
 */
export async function processSDINotifications(options = {}) {
  const { orgId, testMode = false } = options;
  if (!orgId) throw new Error('orgId richiesto');

  const sdiSftpServerUrl = import.meta.env.VITE_SDI_SFTP_SERVER_URL || 'http://sdi-sftp.rescuemanager.eu';
  const endpoint = `${sdiSftpServerUrl}/api/sdi-sftp/process-notifications`;

  console.log('[SDI-SFTP] processSDINotifications:', { orgId, testMode });

  const headers = await buildAuthHeaders();

  try {
    const r = await fetch(endpoint, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify({ org_id: orgId, test_mode: testMode }),
    });

    if (!r.ok) {
      const errorData = await r.json().catch(() => ({ error: r.statusText }));
      throw new Error(errorData.error || `HTTP ${r.status}`);
    }

    return await r.json();
  } catch (error) {
    console.error('[SDI-SFTP] Errore processamento notifiche:', error);
    throw error;
  }
}

/**
 * Genera XML fattura (lato server)
 * @param {string} invoiceId - ID fattura
 * @param {boolean} testMode - Se true, usa ambiente test
 * @returns {Promise<{success: boolean, xml?: string, error?: string}>}
 */
export async function generateInvoiceXML(invoiceId, testMode = false) {
  // La generazione XML avviene lato server VPS quando si invia
  return { success: true };
}

/**
 * Ottiene informazioni endpoint SDI
 * @returns {Promise<{success: boolean, endpoints?: object}>}
 */
export async function getSDIEndpoints() {
  try {
    const r = await fetch(`${API.SDI}/api/sdi/test`);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  } catch (error) {
    console.error('Errore recupero endpoint SDI:', error);
    return { success: false, error: error.message };
  }
}

