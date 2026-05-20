/**
 * Creazione automatica movimento di scarico RENTRI per VFU
 * Quando si conferisce il veicolo demolito al frantumatore
 */

import { supabaseBrowser } from './supabase-browser';
import logger from './logger';

/**
 * Crea movimento di scarico RENTRI quando si conferisce VFU al frantumatore.
 * Tipo movimento: T (Trasporto) - Scarico verso impianto autorizzato
 */
/**
 * @param {object} p
 * @param {string} [p.causale='T'] Causale RENTRI. 'T' = trasporto in uscita
 *   (autodemolitore che conferisce). 'aT'/'T*aT' = accettazione al destino
 *   (ROT/FRA): in tal caso `esitoAccettazione` è obbligatorio.
 * @param {('Accettato'|'AccettatoConRiserva'|'Respinto')} [p.esitoAccettazione]
 *   Esito conferimento, richiesto da RENTRI per causali aT/T*aT.
 */
export async function creaMovimentoScaricoVFU({
  caseId, orgId, registroId, destinatarioNome, destinatarioCF,
  causale = 'T', esitoAccettazione = null,
}) {
  const supabase = supabaseBrowser();

  const CAUSALI_VALIDE = ['T', 'aT', 'T*aT'];
  if (!CAUSALI_VALIDE.includes(causale)) {
    throw new Error(`Causale scarico VFU non valida: '${causale}' (ammesse: ${CAUSALI_VALIDE.join(', ')})`);
  }
  const richiedeEsito = causale === 'aT' || causale === 'T*aT';
  if (richiedeEsito && !esitoAccettazione) {
    throw new Error(`Causale '${causale}' richiede esitoAccettazione (Accettato/AccettatoConRiserva/Respinto)`);
  }

  try {
    // Carica dati caso VFU
    const { data: case_, error: caseErr } = await supabase
      .from('demolition_cases')
      .select('*')
      .eq('id', caseId)
      .single();

    if (caseErr) throw caseErr;
    if (!case_) throw new Error('Caso demolizione non trovato');

    // Carica org_settings per dati produttore completi
    const { data: orgSettings } = await supabase
      .from('org_settings')
      .select('*')
      .eq('org_id', orgId)
      .maybeSingle();

    // Carica movimento di carico originale per prendere i dati
    const { data: movimentoCarico } = await supabase
      .from('rentri_movimenti')
      .select('*')
      .eq('id', case_.rentri_movimento_id)
      .single();

    if (!movimentoCarico) {
      throw new Error('Movimento di carico non trovato - completa prima la fase Accettazione');
    }

    // Peso carcassa (se disponibile, altrimenti usa peso carico)
    const pesoCarcassa = Number.parseFloat(case_.peso_carcassa_kg) || movimentoCarico.quantita || 1000;

    // Trova registro attivo per l'org (se non specificato)
    let targetRegistroId = registroId || movimentoCarico.registro_id;

    const now = new Date();

    // Crea movimento di scarico VFU (colonne reali da RifiutiMovimenti.jsx)
    const movimentoPayload = {
      org_id: orgId,
      registro_id: targetRegistroId,
      tipo_operazione: 'scarico',
      causale_operazione: causale,
      ...(richiedeEsito ? { esito_accettazione: esitoAccettazione } : {}),
      data_operazione: now.toISOString().split('T')[0],
      data_ora_registrazione: now.toISOString(),
      anno: now.getFullYear(),
      progressivo: 1,
      
      // Codice EER principale VFU (carcassa)
      codice_eer: movimentoCarico.codice_eer || '160104',
      descrizione_eer: movimentoCarico.descrizione_eer || `Veicolo fuori uso - ${case_.marca_modello || ''} Targa: ${case_.targa || 'N/A'}`,
      stato_fisico: 'S', // S = Solido
      
      // Quantità (carcassa dopo smontaggio)
      quantita: pesoCarcassa,
      unita_misura: 'kg',
      
      // Dati VFU specifici
      veicolo_fuori_uso: true,
      vfu_numero_registro: movimentoCarico.vfu_numero_registro,
      vfu_data_registro: movimentoCarico.vfu_data_registro,
      
      // Provenienza/Destinazione
      provenienza_codice: 'S',
      provenienza_destinazione: destinatarioNome || 'Impianto di frantumazione',
      
      // Produttore (autodemolitore)
      produttore_denominazione: orgSettings?.company_name || '',
      produttore_codice_fiscale: orgSettings?.vat || '',
      produttore_indirizzo: orgSettings?.address?.street || '',
      produttore_comune_id: orgSettings?.address?.city || '',
      
      // Destinazione attività
      destinato_attivita: 'R4', // R4 = Riciclaggio/recupero metalli
      
      // Note
      note: destinatarioCF ? `CF destinatario: ${destinatarioCF}` : '',
      annotazioni: `Conferimento VFU a frantumatore - Caso: ${caseId.slice(0, 8)} - Targa: ${case_.targa || 'N/A'} - Peso carcassa: ${pesoCarcassa} kg`,
      
      // Stato
      sync_status: 'pending',
    };

    const { data: movimento, error: movErr } = await supabase
      .from('rentri_movimenti')
      .insert(movimentoPayload)
      .select('id')
      .single();

    if (movErr) throw movErr;

    logger.info('[VFU Movimento] Movimento di scarico creato:', movimento.id);

    return movimento;
  } catch (error) {
    logger.error('[VFU Movimento] Error creating movimento scarico:', error);
    throw error;
  }
}
