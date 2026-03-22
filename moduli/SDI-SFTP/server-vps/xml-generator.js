/**
 * Genera XML FatturaPA 1.2.2 conforme
 * Basato su implementazione esistente in supabase/functions/sdi_send/index.ts
 */

function generateFatturaPA(invoice) {
  // Sanitize XML content
  const esc = (s) => {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  };
  
  const items = invoice.invoice_items || [];
  
  // Validazione: almeno un elemento in items (ERRORE se vuoto)
  if (items.length === 0) {
    throw new Error('La fattura deve contenere almeno una riga di dettaglio (invoice_items non può essere vuoto)');
  }
  
  const rows = items.map((item, i) => {
    let vatPerc = Number(item.vat_perc || 22);
    // ERRORE 00424: AliquotaIVA deve essere >= 1.00 se != 0.00
    // Se è 0.00, va bene (ma serve Natura)
    // Se è != 0.00, deve essere >= 1.00
    if (vatPerc !== 0 && vatPerc < 1.00) {
      throw new Error(`AliquotaIVA non valida alla riga ${i + 1}: deve essere 0.00 o >= 1.00. Valore: ${vatPerc}`);
    }
    const naturaIva = item.natura_iva || item.naturaIva || '';
    // Regole NaturaIVA (ERRORE 00429 e 00430):
    // - Se AliquotaIVA == 0 → Natura è OBBLIGATORIA
    // - Se AliquotaIVA != 0 && naturaIva presente → Natura OBBLIGATORIA (es. reverse charge N2.1, N2.2)
    // - Se AliquotaIVA != 0 && naturaIva vuota → NON aggiungere Natura (ERRORE 00430 se presente)
    let naturaIvaTag = '';
    if (vatPerc === 0) {
      // Aliquota 0 → Natura obbligatoria (ERRORE 00429 se manca)
      naturaIvaTag = `<Natura>${esc(naturaIva || 'N4')}</Natura>`;
    } else if (naturaIva) {
      // Aliquota != 0 ma natura presente (es. reverse charge) → Natura obbligatoria
      naturaIvaTag = `<Natura>${esc(naturaIva)}</Natura>`;
    }
    // Se aliquota != 0 e natura vuota → non aggiungere Natura (corretto)
    return `
    <DettaglioLinee>
      <NumeroLinea>${i + 1}</NumeroLinea>
      <Descrizione>${esc(item.descr)}</Descrizione>
      <Quantita>${(() => {
        // Quantità: deve essere > 0 (FatturaPA non accetta quantità zero o negativa)
        const qty = Number(item.qty || 0);
        if (qty <= 0) {
          throw new Error(`Quantità non valida alla riga ${i + 1}: deve essere maggiore di zero. Valore: ${qty}`);
        }
        return qty.toFixed(2);
      })()}</Quantita>
      ${item.unit ? `<UnitaMisura>${esc(item.unit)}</UnitaMisura>` : ''}
      <PrezzoUnitario>${(() => {
        // PrezzoUnitario: deve essere >= 0 (può essere zero per note credito/debito, ma generalmente > 0)
        // Nota: FatturaPA non vieta esplicitamente zero, ma è poco comune
        const price = Number(item.price || 0);
        if (price < 0) {
          throw new Error(`PrezzoUnitario non valido alla riga ${i + 1}: non può essere negativo. Valore: ${price}`);
        }
        return price.toFixed(2);
      })()}</PrezzoUnitario>
      ${(() => {
        // ScontoMaggiorazione: se presente sulla riga, aggiungere tag XML
        const sconto = item.sconto || item.discount;
        if (sconto && (sconto.percentuale || sconto.importo || sconto.percentuale === 0 || sconto.importo === 0)) {
          const tipo = sconto.tipo === 'MG' ? 'MG' : 'SC'; // MG = Maggiorazione, SC = Sconto
          const percentuale = (sconto.percentuale !== undefined && sconto.percentuale !== null) 
            ? `<Percentuale>${Number(sconto.percentuale).toFixed(2)}</Percentuale>` 
            : '';
          const importo = (sconto.importo !== undefined && sconto.importo !== null) 
            ? `<Importo>${Number(sconto.importo).toFixed(2)}</Importo>` 
            : '';
          if (percentuale || importo) {
            return `
      <ScontoMaggiorazione>
        <Tipo>${tipo}</Tipo>
        ${percentuale}
        ${importo}
      </ScontoMaggiorazione>`;
          }
        }
        return '';
      })()}
      <PrezzoTotale>${(() => {
        // ERRORE 00423: PrezzoTotale deve essere (PrezzoUnitario * Quantità) con tolleranza ±0,01
        // Se c'è sconto/maggiorazione, calcolare DOPO lo sconto
        const qty = Number(item.qty || 0);
        const price = Number(item.price || 0);
        let prezzoTotale = qty * price;
        
        // Applica sconto/maggiorazione se presente
        const sconto = item.sconto || item.discount;
        if (sconto) {
          if (sconto.percentuale !== undefined && sconto.percentuale !== null) {
            // Sconto percentuale
            const scontoImporto = (prezzoTotale * Number(sconto.percentuale)) / 100;
            if (sconto.tipo === 'MG') {
              prezzoTotale += scontoImporto; // Maggiorazione
            } else {
              prezzoTotale -= scontoImporto; // Sconto
            }
          } else if (sconto.importo !== undefined && sconto.importo !== null) {
            // Sconto importo fisso
            if (sconto.tipo === 'MG') {
              prezzoTotale += Number(sconto.importo); // Maggiorazione
            } else {
              prezzoTotale -= Number(sconto.importo); // Sconto
            }
          }
        }
        
        // Arrotondamento a 2 decimali con Math.round
        return (Math.round(prezzoTotale * 100) / 100).toFixed(2);
      })()}</PrezzoTotale>
      <AliquotaIVA>${vatPerc.toFixed(2)}</AliquotaIVA>
      ${naturaIvaTag}
    </DettaglioLinee>`;
  }).join('');

  // Funzione helper per calcolare PrezzoTotale con sconto
  const calcolaPrezzoTotaleConSconto = (item) => {
    const qty = Number(item.qty || 0);
    const price = Number(item.price || 0);
    let prezzoTotale = qty * price;
    
    // Applica sconto/maggiorazione se presente
    const sconto = item.sconto || item.discount;
    if (sconto) {
      if (sconto.percentuale !== undefined && sconto.percentuale !== null) {
        // Sconto percentuale
        const scontoImporto = (prezzoTotale * Number(sconto.percentuale)) / 100;
        if (sconto.tipo === 'MG') {
          prezzoTotale += scontoImporto; // Maggiorazione
        } else {
          prezzoTotale -= scontoImporto; // Sconto
        }
      } else if (sconto.importo !== undefined && sconto.importo !== null) {
        // Sconto importo fisso
        if (sconto.tipo === 'MG') {
          prezzoTotale += Number(sconto.importo); // Maggiorazione
        } else {
          prezzoTotale -= Number(sconto.importo); // Sconto
        }
      }
    }
    
    return Math.round(prezzoTotale * 100) / 100;
  };
  
  // Calcolo totale imponibile e IVA (con sconti applicati)
  // ERRORE 00422: ImponibileImporto deve corrispondere alla somma dei PrezzoTotale (tolleranza ±1 euro)
  const imponibile = items.reduce((sum, r) => {
    return sum + calcolaPrezzoTotaleConSconto(r);
  }, 0);
  
  // Calcolo IVA totale (per ImportoTotaleDocumento) - con sconti applicati
  // ERRORE 00421: Imposta deve essere calcolata con arrotondamento corretto
  const iva = items.reduce((sum, r) => {
    const aliquota = Number(r.vat_perc || 22);
    const imponibileItem = calcolaPrezzoTotaleConSconto(r); // Usa PrezzoTotale DOPO sconto
    const impostaItem = Math.round((aliquota * imponibileItem / 100) * 100) / 100;
    return sum + impostaItem;
  }, 0);
  
  // Arrotondamento finale
  const imponibileArrotondato = Math.round(imponibile * 100) / 100;
  const ivaArrotondata = Math.round(iva * 100) / 100;

  // Raggruppa per aliquota IVA e natura IVA per DatiRiepilogo (UN DatiRiepilogo per OGNI combinazione)
  // Nota: FatturaPA richiede un DatiRiepilogo separato per ogni aliquota, e se presente, anche per natura IVA
  const riepilogoMap = new Map();
  items.forEach(item => {
    const aliquotaVal = Number(item.vat_perc || 22);
    const aliquota = aliquotaVal.toFixed(2); // Stringa per la chiave
    const naturaIva = item.natura_iva || item.naturaIva || '';
    const key = `${aliquota}_${naturaIva}`; // Chiave univoca: aliquota_natura
    
    if (!riepilogoMap.has(key)) {
      riepilogoMap.set(key, { aliquota, naturaIva, imponibile: 0, imposta: 0 });
    }
    // Calcolo ImponibileItem: deve corrispondere esattamente al PrezzoTotale della riga (DOPO sconto)
    // ERRORE 00422: ImponibileImporto deve corrispondere alla somma dei PrezzoTotale (tolleranza ±1 euro)
    const imponibileItem = calcolaPrezzoTotaleConSconto(item);
    
    // Calcolo ImpostaItem: ERRORE 00421 - deve essere calcolata come (AliquotaIVA * ImponibileImporto) / 100
    // Arrotondamento: per difetto se terza cifra < 5, per eccesso se >= 5
    // Tolleranza: ±0,01 euro
    // Usa aliquotaVal (numero) per il calcolo
    const impostaCalcolata = (aliquotaVal * imponibileItem) / 100;
    // Arrotondamento corretto: Math.round(impostaCalcolata * 100) / 100
    const impostaItem = Math.round(impostaCalcolata * 100) / 100;
    
    riepilogoMap.get(key).imponibile += imponibileItem;
    riepilogoMap.get(key).imposta += impostaItem;
  });
  
  // Genera DatiRiepilogo per ogni combinazione aliquota/natura
  const riepilogoRows = Array.from(riepilogoMap.values()).map(riep => {
    const naturaTag = riep.naturaIva ? `<Natura>${esc(riep.naturaIva)}</Natura>` : '';
    // Arrotondamento finale per ImponibileImporto e Imposta (2 decimali)
    const imponibileArrotondato = Math.round(riep.imponibile * 100) / 100;
    const impostaArrotondata = Math.round(riep.imposta * 100) / 100;
    
    // Verifica coerenza: Imposta deve essere (AliquotaIVA * ImponibileImporto) / 100
    // ERRORE 00421: con tolleranza ±0,01
    // ERRORE 00424: AliquotaIVA deve essere >= 1.00 se != 0.00
    const aliquotaNum = Number(riep.aliquota);
    if (aliquotaNum !== 0 && aliquotaNum < 1.00) {
      throw new Error(`ERRORE 00424: AliquotaIVA nel DatiRiepilogo (${aliquotaNum}) deve essere 0.00 o >= 1.00`);
    }
    const impostaAttesa = Math.round((aliquotaNum * imponibileArrotondato / 100) * 100) / 100;
    const differenza = Math.abs(impostaArrotondata - impostaAttesa);
    if (differenza > 0.01) {
      // Tolleranza superata: ricalcola Imposta correttamente
      const impostaCorretta = Math.round((aliquotaNum * imponibileArrotondato / 100) * 100) / 100;
      return `
      <DatiRiepilogo>
        <AliquotaIVA>${riep.aliquota}</AliquotaIVA>
        ${naturaTag}
        <ImponibileImporto>${imponibileArrotondato.toFixed(2)}</ImponibileImporto>
        <Imposta>${impostaCorretta.toFixed(2)}</Imposta>
      </DatiRiepilogo>`;
    }
    
    return `
      <DatiRiepilogo>
        <AliquotaIVA>${riep.aliquota}</AliquotaIVA>
        ${naturaTag}
        <ImponibileImporto>${imponibileArrotondato.toFixed(2)}</ImponibileImporto>
        <Imposta>${impostaArrotondata.toFixed(2)}</Imposta>
      </DatiRiepilogo>`;
  }).join('');

  const sdi = invoice.meta?.sdi || {};
  const cedente = sdi.cedente_prestatore || {};
  const customerAddress = invoice.customer_address || {};
  
  // IdTrasmittente: SEMPRE il CF del sottoscrittore dell'accordo SDI-SFTP
  // SDI valida questo campo come "codice identificativo fiscale" (CF, non P.IVA)
  // Errore 00300 se si usa P.IVA (11 cifre) invece del CF (16 caratteri)
  const idCodiceTrasmittente = process.env.SDI_ID_NODO_CF || 'SCZMNL05L21D960T';
  
  // Validazione dati obbligatori CedentePrestatore (evita valori placeholder)
  let idCodice = cedente.id_fiscale_iva?.id_codice || cedente.id_codice;
  if (!idCodice || idCodice === 'XXXXXXX') {
    throw new Error('IdCodice (codice fiscale/IVA) obbligatorio e deve essere valido. Configura i dati azienda in Settings.');
  }
  
  // Normalizza IdCodice: rimuovi spazi, caratteri speciali e prefisso "IT" se presente
  idCodice = String(idCodice).trim().replace(/\s+/g, '').replace(/^IT/i, '');
  
  // Verifica che non sia vuoto dopo la normalizzazione
  if (!idCodice || idCodice.length === 0) {
    throw new Error('IdCodice non valido dopo normalizzazione. Verifica i dati azienda in Settings.');
  }
  
  // Validazione formato IdCodice: deve essere 11 caratteri (P.IVA) o 16 caratteri (CF)
  if (idCodice.length !== 11 && idCodice.length !== 16) {
    throw new Error(`IdCodice non valido: deve essere 11 caratteri (P.IVA) o 16 caratteri (Codice Fiscale). Valore normalizzato: "${idCodice}" (${idCodice.length} caratteri). Verifica i dati azienda in Settings.`);
  }
  
  const denominazione = cedente.denominazione;
  if (!denominazione || denominazione === 'Da configurare') {
    throw new Error('Denominazione azienda obbligatoria. Configura i dati azienda in Settings.');
  }
  
  const indirizzo = cedente.sede?.indirizzo || cedente.indirizzo;
  const cap = cedente.sede?.cap || cedente.cap;
  const comune = cedente.sede?.comune || cedente.comune;
  const provincia = cedente.sede?.provincia || cedente.provincia;
  
  if (!indirizzo || indirizzo === 'Via' || !cap || cap === '00000' || !comune || comune === 'Comune' || !provincia || provincia === 'XX') {
    throw new Error('Indirizzo completo obbligatorio (Via, CAP, Comune, Provincia). Configura i dati azienda in Settings.');
  }
  
  // Validazione formato CAP: deve essere esattamente 5 caratteri numerici
  if (!/^\d{5}$/.test(cap)) {
    throw new Error(`CAP non valido: deve essere esattamente 5 cifre numeriche. Valore: ${cap}`);
  }
  
  // Validazione formato Provincia: deve essere esattamente 2 caratteri (codice provincia italiano)
  if (!/^[A-Z]{2}$/i.test(provincia)) {
    throw new Error(`Provincia non valida: deve essere esattamente 2 caratteri (codice provincia italiano, es. RM, MI, TO). Valore: ${provincia}`);
  }
  
  // Validazione formato IdCodice: deve essere 11 caratteri (P.IVA) o 16 caratteri (CF)
  if (idCodice.length !== 11 && idCodice.length !== 16) {
    throw new Error(`IdCodice non valido: deve essere 11 caratteri (P.IVA) o 16 caratteri (Codice Fiscale). Lunghezza attuale: ${idCodice.length}`);
  }
  
  // Validazione dati obbligatori CessionarioCommittente (evita valori placeholder)
  const customerName = invoice.customer_name;
  if (!customerName || customerName === 'Cliente') {
    throw new Error('Nome cliente obbligatorio e deve essere valido.');
  }
  
  // Mapping completo: il form salva come street/zip/city/province, ma potrebbero esserci anche altri formati
  const customerIndirizzo = customerAddress.street || customerAddress.address || customerAddress.via || customerAddress.indirizzo;
  const customerCap = customerAddress.zip || customerAddress.postal_code || customerAddress.cap;
  const customerComune = customerAddress.city || customerAddress.comune;
  const customerProvincia = customerAddress.province || customerAddress.provincia;
  const customerCountry = customerAddress.country || 'IT';
  
  // Validazione indirizzo: diversa per IT vs estero
  if (!customerIndirizzo || customerIndirizzo === 'Via' || !customerComune || customerComune === 'Comune') {
    throw new Error('Indirizzo cliente completo obbligatorio (Via, Comune). I dati cliente devono essere completi.');
  }
  
  // Validazione CAP: 5 cifre per IT, "00000" per estero
  if (customerCountry === 'IT') {
    if (!customerCap || !/^\d{5}$/.test(customerCap)) {
      throw new Error(`CAP cliente italiano non valido: deve essere esattamente 5 cifre numeriche. Valore: ${customerCap}`);
    }
  } else {
    // Per estero, CAP deve essere "00000"
    if (customerCap !== '00000') {
      throw new Error(`CAP cliente estero non valido: deve essere "00000" per clienti esteri. Valore: ${customerCap}`);
    }
  }
  
  // Validazione Provincia: 2 lettere per IT, "EE" per estero
  if (customerCountry === 'IT') {
    if (!customerProvincia || !/^[A-Z]{2}$/i.test(customerProvincia) || customerProvincia === 'XX') {
      throw new Error(`Provincia cliente italiano non valida: deve essere esattamente 2 lettere (codice provincia italiano). Valore: ${customerProvincia}`);
    }
  } else {
    // Per estero, provincia deve essere "EE"
    if (customerProvincia !== 'EE') {
      throw new Error(`Provincia cliente estero non valida: deve essere "EE" (Estero) per clienti esteri. Valore: ${customerProvincia}`);
    }
  }
  
  // Validazione CessionarioCommittente: ERRORE 00417 se né IdFiscaleIVA né CodiceFiscale
  // Almeno uno dei due deve essere presente
  if (!invoice.customer_vat && !invoice.customer_tax_code) {
    throw new Error('CessionarioCommittente: almeno uno tra P.IVA (customer_vat) o Codice Fiscale (customer_tax_code) deve essere presente (ERRORE SDI 00417)');
  }
  
  // ERRORE 00428: FormatoTrasmissione deve corrispondere all'attributo VERSION
  // Determina FormatoTrasmissione in base alla lunghezza del CodiceDestinatario:
  // - CodiceDestinatario di 6 caratteri → FPA12 (fattura verso PA)
  // - CodiceDestinatario di 7 caratteri → FPR12 (fattura verso privato)
  // - Se non specificato, usa FPR12 come default
  const codiceDest = sdi.trasmissione?.codice_destinatario || '';
  let formatoTrasm = sdi.trasmissione?.formato_trasmissione;
  
  // Se FormatoTrasmissione non è specificato, determinalo dalla lunghezza del CodiceDestinatario
  if (!formatoTrasm) {
    const codiceLen = codiceDest.trim().length;
    if (codiceLen === 6) {
      formatoTrasm = 'FPA12'; // Fattura verso PA
    } else if (codiceLen === 7 || codiceLen === 0) {
      formatoTrasm = 'FPR12'; // Fattura verso privato (default)
    } else {
      // Se lunghezza non standard, usa FPR12 come default
      formatoTrasm = 'FPR12';
    }
  }
  
  const versioneAttributo = formatoTrasm; // Versione XML deve corrispondere a FormatoTrasmissione
  
  if (formatoTrasm !== versioneAttributo) {
    throw new Error(`ERRORE 00428: FormatoTrasmissione (${formatoTrasm}) non coerente con attributo versione (${versioneAttributo})`);
  }
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<p:FatturaElettronica versione="${versioneAttributo}" xmlns:ds="http://www.w3.org/2000/09/xmldsig#" xmlns:p="http://ivaservizi.agenziaentrate.gov.it/docs/xsd/fatture/v1.2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://ivaservizi.agenziaentrate.gov.it/docs/xsd/fatture/v1.2 http://www.fatturapa.gov.it/export/fatturazione/sdi/fatturapa/v1.2/Schema_del_file_xml_FatturaPA_versione_1.2.xsd">
  <FatturaElettronicaHeader>
    <DatiTrasmissione>
      <IdTrasmittente>
        <IdPaese>IT</IdPaese>
        <IdCodice>${esc(idCodiceTrasmittente)}</IdCodice>
      </IdTrasmittente>
      <ProgressivoInvio>${esc((() => {
        // ProgressivoInvio: stringa alfanumerica max 5 caratteri [a-z], [A-Z], [0-9]
        // Usa invoice.number se presente, altrimenti default
        let progressivo = String(invoice.number || '00001');
        // Rimuovi caratteri non validi e limita a 5 caratteri
        progressivo = progressivo.replace(/[^a-zA-Z0-9]/g, '').substring(0, 5);
        if (progressivo.length === 0) {
          progressivo = '00001'; // Default se rimane vuoto
        }
        // Verifica formato: solo alfanumerici, max 5 caratteri
        if (!/^[a-zA-Z0-9]{1,5}$/.test(progressivo)) {
          throw new Error(`ProgressivoInvio non valido: deve essere alfanumerico (max 5 caratteri). Valore: ${progressivo}`);
        }
        return progressivo;
      })())}</ProgressivoInvio>
      <FormatoTrasmissione>${esc(formatoTrasm)}</FormatoTrasmissione>
      <CodiceDestinatario>${esc((() => {
        // ERRORE 00427: CodiceDestinatario lunghezza in base a FormatoTrasmissione
        // - FPA12 → CodiceDestinatario deve essere 6 caratteri (NON 7)
        // - FPR12 → CodiceDestinatario deve essere 7 caratteri (NON 6)
        const codice = sdi.trasmissione?.codice_destinatario || '';
        const lunghezzaAttesa = formatoTrasm === 'FPA12' ? 6 : 7;
        const defaultCodice = formatoTrasm === 'FPA12' ? '000000' : '0000000';
        
        if (!codice || codice.trim() === '') {
          return defaultCodice;
        }
        
        // Normalizza lunghezza
        let codiceNormalizzato = codice.trim();
        if (codiceNormalizzato.length > lunghezzaAttesa) {
          codiceNormalizzato = codiceNormalizzato.substring(0, lunghezzaAttesa);
        } else if (codiceNormalizzato.length < lunghezzaAttesa) {
          codiceNormalizzato = codiceNormalizzato.padEnd(lunghezzaAttesa, '0');
        }
        
        // Validazione lunghezza
        if (codiceNormalizzato.length !== lunghezzaAttesa) {
          throw new Error(`ERRORE 00427: CodiceDestinatario per FormatoTrasmissione ${formatoTrasm} deve essere ${lunghezzaAttesa} caratteri. Valore: ${codiceNormalizzato} (${codiceNormalizzato.length} caratteri)`);
        }
        
        return codiceNormalizzato;
      })())}</CodiceDestinatario>
      ${sdi.trasmissione?.pec_destinatario ? `<PECDestinatario>${esc(sdi.trasmissione.pec_destinatario)}</PECDestinatario>` : ''}
    </DatiTrasmissione>
    <CedentePrestatore>
      <DatiAnagrafici>
        <IdFiscaleIVA>
          <IdPaese>IT</IdPaese>
          <IdCodice>${esc(idCodice)}</IdCodice>
        </IdFiscaleIVA>
        ${cedente.codice_fiscale ? (() => {
          // Codice Fiscale: se presente, deve essere esattamente 16 caratteri alfanumerici
          const cf = String(cedente.codice_fiscale).replace(/\s+/g, '').toUpperCase();
          if (!/^[A-Z0-9]{16}$/.test(cf)) {
            throw new Error(`Codice Fiscale cedente non valido: deve essere esattamente 16 caratteri alfanumerici. Valore: ${cf}`);
          }
          return `<CodiceFiscale>${esc(cf)}</CodiceFiscale>`;
        })() : ''}
        <Anagrafica>
          <Denominazione>${esc(denominazione)}</Denominazione>
        </Anagrafica>
        <RegimeFiscale>${esc(cedente.regime_fiscale || 'RF01')}</RegimeFiscale>
      </DatiAnagrafici>
      <Sede>
        <Indirizzo>${esc(indirizzo)}</Indirizzo>
        <CAP>${esc(cap)}</CAP>
        <Comune>${esc(comune)}</Comune>
        <Provincia>${esc(provincia)}</Provincia>
        <Nazione>IT</Nazione>
      </Sede>
    </CedentePrestatore>
    <CessionarioCommittente>
      <DatiAnagrafici>
        ${invoice.customer_vat ? (() => {
          // Determina paese cliente
          const customerCountry = customerAddress.country || 'IT';
          
          // Estrai prefisso paese se presente nella P.IVA (es. "DE123456789", "FR12345678901")
          const vatRaw = invoice.customer_vat.toUpperCase().replace(/\s+/g, '');
          const countryFromVat = vatRaw.match(/^([A-Z]{2})(\d+)/)?.[1];
          const finalCountry = countryFromVat || customerCountry;
          
          // Rimuovi prefisso paese se presente
          let vat = vatRaw.replace(/^[A-Z]{2}/, '');
          
          // Validazione P.IVA in base al paese
          if (finalCountry === 'IT') {
            // Italia: 11 cifre numeriche
            if (!/^\d{11}$/.test(vat)) {
              throw new Error(`P.IVA italiana non valida: deve essere 11 cifre numeriche. Valore: ${vat}`);
            }
          } else if (finalCountry === 'DE') {
            // Germania: 9 cifre
            if (!/^\d{9}$/.test(vat)) {
              throw new Error(`P.IVA tedesca non valida: deve essere 9 cifre. Valore: ${vat}`);
            }
          } else if (finalCountry === 'FR') {
            // Francia: 11 caratteri (2 lettere + 9 cifre, ma rimuoviamo le lettere)
            if (!/^\d{9}$/.test(vat)) {
              throw new Error(`P.IVA francese non valida: formato deve essere XY123456789. Valore: ${vatRaw}`);
            }
          } else if (finalCountry === 'ES') {
            // Spagna: 9 caratteri (1 lettera + 8 cifre + 1 lettera)
            if (!/^[A-Z]\d{8}[A-Z]$/.test(vatRaw)) {
              throw new Error(`P.IVA spagnola non valida: formato deve essere X12345678Y. Valore: ${vatRaw}`);
            }
            vat = vatRaw; // Mantieni formato completo per Spagna
          } else if (finalCountry === 'GB') {
            // Regno Unito: 9 o 12 caratteri (dopo Brexit, formato variabile)
            if (!/^[A-Z0-9]{9,12}$/.test(vatRaw)) {
              throw new Error(`P.IVA UK non valida: formato variabile 9-12 caratteri. Valore: ${vatRaw}`);
            }
            vat = vatRaw; // Mantieni formato completo per UK
          } else {
            // Altri paesi: validazione generica (almeno 2 caratteri)
            if (vat.length < 2) {
              throw new Error(`P.IVA per paese ${finalCountry} non valida: lunghezza minima 2 caratteri. Valore: ${vat}`);
            }
            // Per extra-UE senza P.IVA, usare codice convenzionale
            if (finalCountry !== 'IT' && !['AT', 'BE', 'BG', 'CY', 'CZ', 'DE', 'DK', 'EE', 'ES', 'FI', 'FR', 'GR', 'HR', 'HU', 'IE', 'LT', 'LU', 'LV', 'MT', 'NL', 'PL', 'PT', 'RO', 'SE', 'SI', 'SK', 'GB'].includes(finalCountry)) {
              // Extra-UE: se P.IVA non valida, usare codice convenzionale
              if (!/^[A-Z0-9]{2,}$/.test(vatRaw)) {
                vat = 'OO99999999999'; // Codice convenzionale per extra-UE senza P.IVA
              }
            }
          }
          
          return `<IdFiscaleIVA><IdPaese>${esc(finalCountry)}</IdPaese><IdCodice>${esc(vat)}</IdCodice></IdFiscaleIVA>`;
        })() : ''}
        ${invoice.customer_tax_code ? (() => {
          // Codice Fiscale: deve essere esattamente 16 caratteri (lettere e numeri)
          const cf = invoice.customer_tax_code.replace(/\s+/g, '').toUpperCase();
          if (!/^[A-Z0-9]{16}$/.test(cf)) {
            throw new Error(`Codice Fiscale cliente non valido: deve essere esattamente 16 caratteri alfanumerici. Valore: ${cf}`);
          }
          return `<CodiceFiscale>${esc(cf)}</CodiceFiscale>`;
        })() : ''}
        <Anagrafica>
          <Denominazione>${esc(customerName)}</Denominazione>
        </Anagrafica>
      </DatiAnagrafici>
      <Sede>
        <Indirizzo>${esc(customerIndirizzo)}</Indirizzo>
        <CAP>${esc(customerCap)}</CAP>
        <Comune>${esc(customerComune)}</Comune>
        <Provincia>${esc(customerProvincia)}</Provincia>
        <Nazione>${esc(customerAddress.country || 'IT')}</Nazione>
      </Sede>
    </CessionarioCommittente>
  </FatturaElettronicaHeader>
  <FatturaElettronicaBody>
    <DatiGenerali>
      <DatiGeneraliDocumento>
        <TipoDocumento>${esc(sdi.documento?.tipo_documento || 'TD01')}</TipoDocumento>
        <Divisa>${esc((() => {
          // Divisa: codice ISO 4217 (es. EUR, USD, GBP)
          // Validazione: 3 caratteri alfabetici maiuscoli
          const divisa = String(invoice.currency || 'EUR').toUpperCase().substring(0, 3);
          if (!/^[A-Z]{3}$/.test(divisa)) {
            throw new Error(`Divisa non valida: deve essere un codice ISO 4217 di 3 caratteri (es. EUR, USD). Valore: ${divisa}`);
          }
          return divisa;
        })())}</Divisa>
        <Data>${esc((() => {
          // Data: deve essere in formato YYYY-MM-DD (ISO 8601)
          const date = invoice.date || new Date().toISOString().split('T')[0];
          if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            throw new Error(`Data non valida: deve essere in formato YYYY-MM-DD. Valore: ${date}`);
          }
          return date;
        })())}</Data>
        <Numero>${esc((() => {
          // Numero fattura: deve contenere almeno un carattere numerico (ERRORE 00425 se non contiene numeri)
          const num = invoice.number || '1';
          // Assicura che contenga almeno una cifra numerica
          if (!/\d/.test(num)) {
            throw new Error('Numero fattura deve contenere almeno un carattere numerico');
          }
          return num;
        })())}</Numero>
        ${(() => {
          // Causale: OBBLIGATORIA per TD04 (nota credito) e TD05 (nota debito)
          // Opzionale per altri tipi documento
          const tipoDoc = sdi.documento?.tipo_documento || 'TD01';
          const noteEsterne = invoice.note || invoice.note_external || '';
          
          if (noteEsterne && noteEsterne.trim().length > 0) {
            const causale = noteEsterne.substring(0, 200); // Max 200 caratteri
            return `<Causale>${esc(causale)}</Causale>`;
          }
          
          // Se è TD04 o TD05 e non c'è Causale, solleva errore
          if (tipoDoc === 'TD04' || tipoDoc === 'TD05') {
            throw new Error(`Causale obbligatoria per ${tipoDoc === 'TD04' ? 'nota di credito' : 'nota di debito'} (TD${tipoDoc}). Aggiungi una nota/causale alla fattura.`);
          }
          
          return '';
        })()}
        ${(() => {
          // DatiRiferimento: OBBLIGATORIO per TD04 (nota credito) e TD05 (nota debito)
          const tipoDoc = sdi.documento?.tipo_documento || 'TD01';
          
          if (tipoDoc === 'TD04' || tipoDoc === 'TD05') {
            // Recupera dati fattura originale da meta o da invoice
            const originalInvoice = invoice.meta?.original_invoice || {};
            const numeroOriginale = originalInvoice.number || invoice.meta?.original_invoice_number || invoice.original_invoice_number || '';
            const dataOriginale = originalInvoice.date || invoice.meta?.original_invoice_date || invoice.original_invoice_date || '';
            
            // Se c'è original_invoice_id ma non numero/data, cerca nella fattura originale
            if (invoice.original_invoice_id && (!numeroOriginale || !dataOriginale)) {
              // Nota: Qui dovremmo fare una query al database, ma per ora usiamo meta
              // Se necessario, passare i dati dalla fattura originale nella chiamata API
            }
            
            if (!numeroOriginale || !dataOriginale) {
              throw new Error(`DatiRiferimento obbligatorio per ${tipoDoc === 'TD04' ? 'nota di credito' : 'nota di debito'} (TD${tipoDoc}). È necessario indicare il numero e la data della fattura originale.`);
            }
            
            // Valida formato data (YYYY-MM-DD)
            if (!/^\d{4}-\d{2}-\d{2}$/.test(dataOriginale)) {
              throw new Error(`Data fattura originale non valida: deve essere in formato YYYY-MM-DD. Valore: ${dataOriginale}`);
            }
            
            return `
        <DatiRiferimento>
          <IdDocumento>${esc(numeroOriginale)}</IdDocumento>
          <Data>${esc(dataOriginale)}</Data>
        </DatiRiferimento>`;
          }
          
          return '';
        })()}
        <ImportoTotaleDocumento>${(imponibileArrotondato + ivaArrotondata).toFixed(2)}</ImportoTotaleDocumento>
      </DatiGeneraliDocumento>
    </DatiGenerali>
    <DatiBeniServizi>
      ${rows}${riepilogoRows}
    </DatiBeniServizi>
    <DatiPagamento>
      <CondizioniPagamento>TP02</CondizioniPagamento>
      <DettaglioPagamento>
        <ModalitaPagamento>${esc(sdi.pagamento?.modalita || 'MP05')}</ModalitaPagamento>
        <ImportoPagamento>${(() => {
          // ImportoPagamento: deve corrispondere a ImportoTotaleDocumento
          // Tolleranza: generalmente deve essere identico (no tolleranza esplicita nel manuale)
          const importoTotale = imponibileArrotondato + ivaArrotondata;
          const importoPagamento = importoTotale; // Usa stesso valore
          return importoPagamento.toFixed(2);
        })()}</ImportoPagamento>
      </DettaglioPagamento>
    </DatiPagamento>
  </FatturaElettronicaBody>
</p:FatturaElettronica>`;
}

module.exports = { generateFatturaPA };

