/**
 * Creazione automatica movimento di carico RENTRI per VFU
 * Secondo D.Lgs 209/2003 e manuale RENTRI
 */

import { supabaseBrowser } from './supabase-browser';
import logger from './logger';

/**
 * Crea movimento di carico RENTRI quando si accetta un VFU.
 * Tipo movimento: NP (Nuova Produzione) + VFU flag
 * Richiede: vfu_numero_registro e vfu_data_registro (registro Pubblica Sicurezza)
 */
export async function creaMovimentoCaricoVFU({ caseId, orgId, registroId }) {
  const supabase = supabaseBrowser();

  try {
    // Carica dati caso VFU
    const { data: case_, error: caseErr } = await supabase
      .from('demolition_cases')
      .select('*')
      .eq('id', caseId)
      .single();

    if (caseErr) throw caseErr;
    if (!case_) throw new Error('Caso demolizione non trovato');

    const meta = case_.meta || {};
    const owner = meta.owner || {};

    // Carica org_settings per dati produttore completi
    const { data: orgSettings } = await supabase
      .from('org_settings')
      .select('*')
      .eq('org_id', orgId)
      .maybeSingle();

    // Peso ingresso (se disponibile, altrimenti stima)
    const pesoIngresso = Number.parseFloat(case_.peso_ingresso_kg) || 1000; // Default 1000kg se non specificato

    // Numero e data registro PS (da implementare nel form RVFU)
    // Per ora usa numero caso come fallback
    const vfuNumeroRegistro = case_.certificato_rottamazione_numero || `VFU-${new Date().getFullYear()}-${case_.id.slice(0, 8)}`;
    const vfuDataRegistro = case_.certificato_rottamazione_data || new Date().toISOString().split('T')[0];

    // Trova registro attivo per l'org (se non specificato)
    let targetRegistroId = registroId;
    if (!targetRegistroId) {
      const { data: registri } = await supabase
        .from('rentri_registri')
        .select('id')
        .eq('org_id', orgId)
        .eq('stato', 'attivo')
        .eq('anno', new Date().getFullYear())
        .contains('attivita', ['Produzione'])
        .limit(1);

      if (registri && registri.length > 0) {
        targetRegistroId = registri[0].id;
      } else {
        throw new Error('Nessun registro RENTRI attivo trovato per Produzione');
      }
    }

    const now = new Date();

    // Crea movimento di carico VFU (colonne reali da RifiutiMovimenti.jsx)
    const movimentoPayload = {
      org_id: orgId,
      registro_id: targetRegistroId,
      tipo_operazione: 'carico',
      causale_operazione: 'NP', // Nuova Produzione
      data_operazione: now.toISOString().split('T')[0],
      data_ora_registrazione: now.toISOString(),
      anno: now.getFullYear(),
      progressivo: 1,
      
      // Codice EER principale VFU (carcassa)
      codice_eer: '160104',
      descrizione_eer: `Veicolo fuori uso - ${case_.marca_modello || ''} Targa: ${case_.targa || 'N/A'}`,
      stato_fisico: 'S', // S = Solido
      
      // Quantità
      quantita: pesoIngresso,
      unita_misura: 'kg',
      
      // Dati VFU specifici
      veicolo_fuori_uso: true,
      vfu_numero_registro: vfuNumeroRegistro,
      vfu_data_registro: vfuDataRegistro,
      
      // Provenienza (proprietario del veicolo)
      provenienza_codice: 'S', // S = Soggetto privato
      provenienza_destinazione: owner.name || 'Privato Cittadino',
      
      // Produttore (autodemolitore)
      produttore_denominazione: orgSettings?.company_name || '',
      produttore_codice_fiscale: orgSettings?.vat || '',
      produttore_indirizzo: orgSettings?.address?.street || '',
      produttore_comune_id: orgSettings?.address?.city || '',
      
      // Destinazione attività
      destinato_attivita: 'R4', // R4 = Riciclaggio/recupero metalli
      
      // Note
      note: `CF proprietario: ${owner.cf || 'N/D'}`,
      annotazioni: `Accettazione VFU - Caso: ${caseId.slice(0, 8)} - Telaio: ${case_.telaio || 'N/A'} - Anno: ${case_.anno || 'N/A'}`,
      
      // Stato
      sync_status: 'pending',
    };

    const { data: movimento, error: movErr } = await supabase
      .from('rentri_movimenti')
      .insert(movimentoPayload)
      .select('id')
      .single();

    if (movErr) throw movErr;

    logger.info('[VFU Movimento] Movimento di carico creato:', movimento.id);

    // Aggiorna caso VFU con riferimento al movimento
    await supabase
      .from('demolition_cases')
      .update({
        rentri_movimento_id: movimento.id,
      })
      .eq('id', caseId);

    return movimento;
  } catch (error) {
    logger.error('[VFU Movimento] Error creating movimento carico:', error);
    throw error;
  }
}
