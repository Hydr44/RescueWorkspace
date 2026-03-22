// src/lib/rentri-test-data.js
/**
 * Generatore dati di test RENTRI
 * Crea registri, movimenti e FIR di esempio per testing
 *
 * Regole causali RENTRI:
 *   CARICO:  NP, DT, aT, T*aT, I, M
 *   SCARICO: RE, TR, T*
 *
 * Codici EER: 6 cifre senza asterisco (es: 160104, non 160104*)
 */

import { supabaseBrowser } from './supabase-browser';

export async function generateRentriTestData(orgId, userId) {
  const supabase = supabaseBrowser();
  const results = { registri: 0, movimenti: 0, formulari: 0, errors: [] };

  try {
    const registri = await createTestRegistri(supabase, orgId, userId);
    results.registri = registri.length;

    const movimenti = await createTestMovimenti(supabase, orgId, userId, registri);
    results.movimenti = movimenti.length;

    const formulari = await createTestFormulari(supabase, orgId, userId);
    results.formulari = formulari.length;

    return { success: true, ...results };
  } catch (error) {
    console.error('[RENTRI-TEST-DATA] Errore:', error);
    results.errors.push(error.message);
    return { success: false, ...results };
  }
}

async function createTestRegistri(supabase, orgId, userId) {
  const anno = new Date().getFullYear();

  const { data, error } = await supabase
    .from('rentri_registri')
    .insert([
      { org_id: orgId, anno, tipo: 'carico_scarico', numero_registro: 'TEST-VFU-' + anno, descrizione: 'Registro C/S Veicoli Fuori Uso', attivita: ['Produzione', 'Recupero'], stato: 'attivo', created_by: userId },
      { org_id: orgId, anno, tipo: 'carico_scarico', numero_registro: 'TEST-METALLI-' + anno, descrizione: 'Registro C/S Rottami Metallici', attivita: ['Recupero'], stato: 'attivo', created_by: userId },
      { org_id: orgId, anno, tipo: 'carico_scarico', numero_registro: 'TEST-PERICOLOSI-' + anno, descrizione: 'Registro C/S Rifiuti Pericolosi', attivita: ['Produzione', 'Smaltimento'], stato: 'attivo', created_by: userId },
      { org_id: orgId, anno, tipo: 'carico_scarico', numero_registro: 'TEST-TRASP-' + anno, descrizione: 'Registro Trasporto Rifiuti', attivita: ['Trasporto'], stato: 'attivo', created_by: userId },
    ])
    .select();

  if (error) throw error;
  return data || [];
}

async function createTestMovimenti(supabase, orgId, userId, registri) {
  const anno = new Date().getFullYear();
  const now = new Date();
  const oggi = now.toISOString().split('T')[0];
  const nowIso = now.toISOString();

  const reg = (pattern) => registri.find(r => r.numero_registro.includes(pattern))?.id;

  // Progressivi per registro (non globali)
  const progs = {};
  const nextProg = (rid) => { progs[rid] = (progs[rid] || 0) + 1; return progs[rid]; };

  const defs = [
    // CARICO: NP - Nuova Produzione VFU
    { registro_id: reg('VFU'), causale_operazione: 'NP', tipo_operazione: 'carico', codice_eer: '160104', descrizione_eer: 'Veicoli fuori uso', stato_fisico: 'S', destinato_attivita: 'R4', quantita: 1450, provenienza_codice: 'S', veicolo_fuori_uso: true, annotazioni: 'VFU - targa AA123BB - demolizione completa', note: 'Test NP - Nuova Produzione VFU' },
    // CARICO: DT - Deposito Temporaneo rottami
    { registro_id: reg('METALLI'), causale_operazione: 'DT', tipo_operazione: 'carico', codice_eer: '170405', descrizione_eer: 'Ferro e acciaio', stato_fisico: 'S', destinato_attivita: 'R4', quantita: 2200, provenienza_codice: 'S', annotazioni: 'Deposito temporaneo rottami ferrosi da demolizioni', note: 'Test DT - Deposito Temporaneo' },
    // SCARICO: RE - Recupero rottami in uscita
    { registro_id: reg('METALLI'), causale_operazione: 'RE', tipo_operazione: 'scarico', codice_eer: '170405', descrizione_eer: 'Ferro e acciaio', stato_fisico: 'S', destinato_attivita: 'R4', quantita: 1900, provenienza_codice: 'S', destinatario_denominazione: 'Rottami Ferrosi Srl', destinatario_num_autorizzazione: 'AUT-MI-2024-001', annotazioni: 'Conferimento rottami ferrosi a impianto recupero', note: 'Test RE - Recupero scarico' },
    // CARICO: I - Intermediazione (carico, non scarico)
    { registro_id: reg('METALLI'), causale_operazione: 'I', tipo_operazione: 'carico', codice_eer: '170407', descrizione_eer: 'Metalli misti', stato_fisico: 'S', destinato_attivita: 'R4', quantita: 950, provenienza_codice: 'S', intermediario_denominazione: 'Intermediari Rifiuti SpA', intermediario_num_iscrizione_albo: 'MI/INT/2024/001', annotazioni: 'Intermediazione metalli misti per conto terzi', note: 'Test I - Intermediazione' },
    // SCARICO: TR - Trasporto VFU in uscita
    { registro_id: reg('TRASP'), causale_operazione: 'TR', tipo_operazione: 'scarico', codice_eer: '160104', descrizione_eer: 'Veicoli fuori uso', stato_fisico: 'S', destinato_attivita: 'R4', quantita: 1300, provenienza_codice: 'S', numero_fir: 'TEST-FIR-001', data_inizio_trasporto: nowIso, trasportatore_denominazione: 'Trasporti Ecologici Srl', trasportatore_num_iscrizione_albo: 'MI/TRA/2024/042', destinatario_denominazione: 'Impianto Trattamento VFU SpA', annotazioni: 'Trasporto VFU verso impianto trattamento autorizzato', note: 'Test TR - Trasporto con FIR' },
    // CARICO: aT - Arrivo da Trasporto rottami
    { registro_id: reg('METALLI'), causale_operazione: 'aT', tipo_operazione: 'carico', codice_eer: '170405', descrizione_eer: 'Ferro e acciaio', stato_fisico: 'S', destinato_attivita: 'R4', quantita: 1300, provenienza_codice: 'S', numero_fir: 'TEST-FIR-001', data_inizio_trasporto: nowIso, data_fine_trasporto: nowIso, peso_verificato_destino: 1285, produttore_denominazione: 'Autodemolizioni Bianchi Srl', annotazioni: 'Arrivo rottami - peso verificato a destinazione', note: 'Test aT - Arrivo da Trasporto' },
    // SCARICO: T* - Trasporto oli in uscita
    { registro_id: reg('TRASP'), causale_operazione: 'T*', tipo_operazione: 'scarico', codice_eer: '130205', descrizione_eer: 'Oli minerali per motori non clorurati', stato_fisico: 'L', destinato_attivita: 'R9', quantita: 420, provenienza_codice: 'S', numero_fir: 'TEST-FIR-002', data_inizio_trasporto: nowIso, trasportatore_denominazione: 'Eco Trasporti Srl', trasportatore_num_iscrizione_albo: 'MI/TRA/2024/018', annotazioni: 'Trasporto oli esausti verso impianto rigenerazione', note: 'Test T* - Trasporto generico' },
    // CARICO: T*aT - Arrivo batterie
    { registro_id: reg('PERICOLOSI'), causale_operazione: 'T*aT', tipo_operazione: 'carico', codice_eer: '160601', descrizione_eer: 'Batterie al piombo', stato_fisico: 'S', destinato_attivita: 'R4', quantita: 380, provenienza_codice: 'S', numero_fir: 'TEST-FIR-002', data_inizio_trasporto: nowIso, data_fine_trasporto: nowIso, peso_verificato_destino: 375, annotazioni: 'Arrivo batterie al piombo - peso verificato', note: 'Test T*aT - Trasporto con arrivo' },
    // CARICO: M - Materiali non rifiuto
    { registro_id: reg('METALLI'), causale_operazione: 'M', tipo_operazione: 'carico', codice_eer: '170405', descrizione_eer: 'Ferro e acciaio', stato_fisico: 'S', destinato_attivita: 'R4', quantita: 600, provenienza_codice: 'S', annotazioni: 'Materiali metallici non classificati come rifiuto', note: 'Test M - Materiali impianto' },
    // CARICO: NP + VFU flag
    { registro_id: reg('VFU'), causale_operazione: 'NP', tipo_operazione: 'carico', codice_eer: '160104', descrizione_eer: 'Veicoli fuori uso', stato_fisico: 'S', destinato_attivita: 'R4', quantita: 1750, provenienza_codice: 'S', veicolo_fuori_uso: true, annotazioni: 'VFU - targa CC456DD - autovettura', note: 'Test NP+VFU - Veicolo Fuori Uso' },
    // CARICO: NP + RAEE
    { registro_id: reg('PERICOLOSI'), causale_operazione: 'NP', tipo_operazione: 'carico', codice_eer: '200135', descrizione_eer: 'Apparecchiature elettriche ed elettroniche dismesse', stato_fisico: 'S', destinato_attivita: 'R3', quantita: 280, provenienza_codice: 'S', annotazioni: 'RAEE da demolizioni - navigatori, centraline, display', note: 'Test NP+RAEE - Apparecchiature elettroniche' },
    // CARICO: aT + Respingimento parziale
    { registro_id: reg('METALLI'), causale_operazione: 'aT', tipo_operazione: 'carico', codice_eer: '170405', descrizione_eer: 'Ferro e acciaio', stato_fisico: 'S', destinato_attivita: 'R4', quantita: 1000, provenienza_codice: 'S', numero_fir: 'TEST-FIR-003', data_inizio_trasporto: nowIso, data_fine_trasporto: nowIso, peso_verificato_destino: 850, respingimento_tipo: 'parziale', respingimento_quantita: 150, respingimento_unita_misura: 'kg', annotazioni: 'Arrivo parziale - 150kg respinti per non conformità', note: 'Test aT+Respingimento - Parziale NC' },
  ];

  const toInsert = defs
    .filter(m => m.registro_id)
    .map(m => ({
      org_id: orgId,
      registro_id: m.registro_id,
      anno,
      progressivo: nextProg(m.registro_id),
      data_ora_registrazione: nowIso,
      data_operazione: oggi,
      causale_operazione: m.causale_operazione,
      tipo_operazione: m.tipo_operazione,
      codice_eer: m.codice_eer,
      descrizione_eer: m.descrizione_eer || null,
      stato_fisico: m.stato_fisico,
      destinato_attivita: m.destinato_attivita,
      quantita: m.quantita,
      unita_misura: 'kg',
      provenienza_codice: m.provenienza_codice || null,
      numero_fir: m.numero_fir || null,
      data_inizio_trasporto: m.data_inizio_trasporto || null,
      data_fine_trasporto: m.data_fine_trasporto || null,
      peso_verificato_destino: m.peso_verificato_destino || null,
      respingimento_tipo: m.respingimento_tipo || null,
      respingimento_quantita: m.respingimento_quantita || null,
      respingimento_unita_misura: m.respingimento_unita_misura || null,
      veicolo_fuori_uso: m.veicolo_fuori_uso || false,
      produttore_denominazione: m.produttore_denominazione || null,
      trasportatore_denominazione: m.trasportatore_denominazione || null,
      trasportatore_num_iscrizione_albo: m.trasportatore_num_iscrizione_albo || null,
      destinatario_denominazione: m.destinatario_denominazione || null,
      destinatario_num_autorizzazione: m.destinatario_num_autorizzazione || null,
      intermediario_denominazione: m.intermediario_denominazione || null,
      intermediario_num_iscrizione_albo: m.intermediario_num_iscrizione_albo || null,
      annotazioni: m.annotazioni || null,
      note: m.note || null,
      environment: 'demo',
      created_by: userId,
    }));

  const { data, error } = await supabase.from('rentri_movimenti').insert(toInsert).select();
  if (error) throw error;
  return data || [];
}

async function createTestFormulari(supabase, orgId, userId) {
  const anno = new Date().getFullYear();
  const oggi = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('rentri_formulari')
    .insert([
      {
        org_id: orgId, numero_fir: 'TEST-FIR-001', anno, data_creazione: oggi, stato: 'bozza',
        produttore_nome: 'Autodemolizioni Rossi Srl', produttore_cf: 'RSSMRC80A01F205X',
        produttore_indirizzo: 'Via Industriale 12', produttore_cap: '20099',
        trasportatore_nome: 'Trasporti Ecologici Srl', trasportatore_albo: 'MI/TRA/2024/042',
        trasportatore_targa: 'AB123CD', tipo_trasporto: 'Terrestre',
        destinatario_nome: 'Impianto Trattamento VFU SpA', destinatario_autorizzazione: 'AUT-MI-2024-001',
        destinatario_attivita: 'R4', rifiuto_provenienza: 'S',
        data_inizio_trasporto: oggi, ora_inizio_trasporto: '08:00',
        note: 'Test FIR-001 - Trasporto VFU da autodemolizione',
        created_by: userId,
      },
      {
        org_id: orgId, numero_fir: 'TEST-FIR-002', anno, data_creazione: oggi, stato: 'bozza',
        produttore_nome: 'Autodemolizioni Bianchi Srl', produttore_cf: 'BNCMRC75B10H501Y',
        produttore_indirizzo: 'Via Roma 45', produttore_cap: '20100',
        trasportatore_nome: 'Eco Trasporti Srl', trasportatore_albo: 'MI/TRA/2024/018',
        trasportatore_targa: 'EF456GH', tipo_trasporto: 'Terrestre',
        destinatario_nome: 'Rigenerazione Oli SpA', destinatario_autorizzazione: 'AUT-VA-2024-007',
        destinatario_attivita: 'R9', rifiuto_provenienza: 'S',
        data_inizio_trasporto: oggi, ora_inizio_trasporto: '09:30',
        note: 'Test FIR-002 - Trasporto oli esausti',
        created_by: userId,
      },
      {
        org_id: orgId, numero_fir: 'TEST-FIR-003', anno, data_creazione: oggi, stato: 'bozza',
        produttore_nome: 'Carrozzeria Verdi Srl', produttore_cf: 'VRDLGI82C15D612Z',
        produttore_indirizzo: 'Via Garibaldi 78', produttore_cap: '20010',
        trasportatore_nome: 'Trasporti Ecologici Srl', trasportatore_albo: 'MI/TRA/2024/042',
        trasportatore_targa: 'IJ789KL', tipo_trasporto: 'Terrestre',
        destinatario_nome: 'Rottami Ferrosi Srl', destinatario_autorizzazione: 'AUT-MI-2024-001',
        destinatario_attivita: 'R4', rifiuto_provenienza: 'S',
        data_inizio_trasporto: oggi, ora_inizio_trasporto: '11:00',
        note: 'Test FIR-003 - Rottami ferrosi con respingimento parziale',
        created_by: userId,
      },
      {
        org_id: orgId, numero_fir: 'TEST-FIR-004', anno, data_creazione: oggi, stato: 'bozza',
        produttore_nome: 'Autodemolizioni Rossi Srl', produttore_cf: 'RSSMRC80A01F205X',
        produttore_indirizzo: 'Via Industriale 12', produttore_cap: '20099',
        trasportatore_nome: 'Eco Trasporti Srl', trasportatore_albo: 'MI/TRA/2024/018',
        trasportatore_targa: 'MN012OP', tipo_trasporto: 'Terrestre',
        destinatario_nome: 'Centro RAEE Autorizzato Srl', destinatario_autorizzazione: 'AUT-MI-2024-RAEE',
        destinatario_attivita: 'R3', rifiuto_provenienza: 'S',
        data_inizio_trasporto: oggi, ora_inizio_trasporto: '14:00',
        note: 'Test FIR-004 - RAEE da demolizioni (navigatori, centraline)',
        created_by: userId,
      },
      {
        org_id: orgId, numero_fir: 'TEST-FIR-005', anno, data_creazione: oggi, stato: 'bozza',
        produttore_nome: 'Autodemolizioni Bianchi Srl', produttore_cf: 'BNCMRC75B10H501Y',
        produttore_indirizzo: 'Via Roma 45', produttore_cap: '20100',
        trasportatore_nome: 'Trasporti Ecologici Srl', trasportatore_albo: 'MI/TRA/2024/042',
        trasportatore_targa: 'QR345ST', tipo_trasporto: 'Terrestre',
        destinatario_nome: 'Smaltimento Batterie SpA', destinatario_autorizzazione: 'AUT-MI-2024-BAT',
        destinatario_attivita: 'R4', rifiuto_provenienza: 'S',
        data_inizio_trasporto: oggi, ora_inizio_trasporto: '15:30',
        note: 'Test FIR-005 - Batterie al piombo da veicoli',
        created_by: userId,
      },
    ])
    .select();

  if (error) throw error;
  return data || [];
}

export async function deleteRentriTestData(orgId) {
  const supabase = supabaseBrowser();

  try {
    // Prima i movimenti (FK → registri), poi registri, poi FIR
    await supabase
      .from('rentri_movimenti')
      .delete()
      .eq('org_id', orgId)
      .in('registro_id',
        (await supabase
          .from('rentri_registri')
          .select('id')
          .eq('org_id', orgId)
          .like('numero_registro', 'TEST-%')
        ).data?.map(r => r.id) || []
      );

    await supabase
      .from('rentri_registri')
      .delete()
      .eq('org_id', orgId)
      .like('numero_registro', 'TEST-%');

    await supabase
      .from('rentri_formulari')
      .delete()
      .eq('org_id', orgId)
      .like('numero_fir', 'TEST-%');

    return { success: true };
  } catch (error) {
    console.error('[RENTRI-TEST-DATA] Errore eliminazione:', error);
    return { success: false, error: error.message };
  }
}
