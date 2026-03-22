// src/lib/vfu-draft-creator.js
// Crea bozze RENTRI (FIR) e SDI (fattura) a partire dai dati di una demolizione VFU
// Usato quando l'operatore completa le fasi di lavorazione

import { supabaseBrowser } from '@/lib/supabase-browser';
import { logger } from '@/lib/logger';

/**
 * Codici CER tipici per demolizione VFU (D.Lgs 209/2003)
 */
const VFU_CER_CODES = {
  carcassa: { codice: '16 01 04*', descrizione: 'Veicoli fuori uso', pericoloso: true },
  pneumatici: { codice: '16 01 03', descrizione: 'Pneumatici fuori uso', pericoloso: false },
  liquidi_freno: { codice: '16 01 13*', descrizione: 'Liquidi per freni', pericoloso: true },
  filtri_olio: { codice: '16 01 07*', descrizione: 'Filtri dell\'olio', pericoloso: true },
  batterie: { codice: '16 06 01*', descrizione: 'Batterie al piombo', pericoloso: true },
  olio_motore: { codice: '13 02 05*', descrizione: 'Scarti di olio minerale per motori', pericoloso: true },
  antigelo: { codice: '16 01 14*', descrizione: 'Antigelo contenente sostanze pericolose', pericoloso: true },
  vetro: { codice: '16 01 20', descrizione: 'Vetro da veicoli', pericoloso: false },
  plastica: { codice: '16 01 19', descrizione: 'Plastica da veicoli', pericoloso: false },
  metalli_ferrosi: { codice: '16 01 17', descrizione: 'Metalli ferrosi da veicoli', pericoloso: false },
  metalli_non_ferrosi: { codice: '16 01 18', descrizione: 'Metalli non ferrosi da veicoli', pericoloso: false },
  catalizzatori: { codice: '16 08 01', descrizione: 'Catalizzatori esauriti contenenti metalli preziosi', pericoloso: false },
  gas_condizionatore: { codice: '14 06 01*', descrizione: 'Clorofluorocarburi, HCFC, HFC', pericoloso: true },
};

/**
 * Carica i rifiuti prodotti per un caso di demolizione
 */
export async function loadRifiutiProdotti(caseId) {
  const supabase = supabaseBrowser();
  const { data, error } = await supabase
    .from('vfu_rifiuti_prodotti')
    .select('*')
    .eq('demolition_case_id', caseId)
    .order('created_at', { ascending: true });

  if (error) {
    logger.error('[VFU Draft] Error loading rifiuti:', error);
    throw error;
  }
  return data || [];
}

/**
 * Carica dati del caso di demolizione con org info
 */
async function loadCaseData(caseId, orgId) {
  const supabase = supabaseBrowser();
  const { data, error } = await supabase
    .from('demolition_cases')
    .select(`
      *,
      clients:client_id (*)
    `)
    .eq('id', caseId)
    .single();

  if (error) throw error;

  // Carica anche i dati org + settings completi
  const { data: org } = await supabase
    .from('orgs')
    .select('*')
    .eq('id', orgId)
    .single();

  const { data: orgSettings } = await supabase
    .from('org_settings')
    .select('*')
    .eq('org_id', orgId)
    .maybeSingle();

  return { case_: data, org, orgSettings };
}

/**
 * Preset pesi per modelli comuni di veicoli.
 * Ogni preset include pesi stimati per i vari componenti.
 */
const VEHICLE_WEIGHT_PRESETS = {
  // Fiat
  'panda': { total: 900, carcassa: 675, pneumatici: 27, vetro: 27, plastica: 90, olio: 4.5, batteria: 12 },
  'punto': { total: 1100, carcassa: 825, pneumatici: 33, vetro: 33, plastica: 110, olio: 5.5, batteria: 15 },
  '500': { total: 865, carcassa: 650, pneumatici: 26, vetro: 26, plastica: 87, olio: 4.3, batteria: 12 },
  'tipo': { total: 1300, carcassa: 975, pneumatici: 39, vetro: 39, plastica: 130, olio: 6.5, batteria: 15 },
  'bravo': { total: 1250, carcassa: 940, pneumatici: 38, vetro: 38, plastica: 125, olio: 6.3, batteria: 15 },
  'doblo': { total: 1400, carcassa: 1050, pneumatici: 42, vetro: 42, plastica: 140, olio: 7, batteria: 18 },
  'ducato': { total: 1800, carcassa: 1350, pneumatici: 54, vetro: 54, plastica: 180, olio: 9, batteria: 20 },
  
  // Volkswagen
  'polo': { total: 1050, carcassa: 790, pneumatici: 32, vetro: 32, plastica: 105, olio: 5.3, batteria: 15 },
  'golf': { total: 1280, carcassa: 960, pneumatici: 38, vetro: 38, plastica: 128, olio: 6.4, batteria: 15 },
  'passat': { total: 1500, carcassa: 1125, pneumatici: 45, vetro: 45, plastica: 150, olio: 7.5, batteria: 18 },
  'tiguan': { total: 1650, carcassa: 1240, pneumatici: 50, vetro: 50, plastica: 165, olio: 8.3, batteria: 18 },
  
  // Renault
  'clio': { total: 1050, carcassa: 790, pneumatici: 32, vetro: 32, plastica: 105, olio: 5.3, batteria: 15 },
  'megane': { total: 1300, carcassa: 975, pneumatici: 39, vetro: 39, plastica: 130, olio: 6.5, batteria: 15 },
  'captur': { total: 1200, carcassa: 900, pneumatici: 36, vetro: 36, plastica: 120, olio: 6, batteria: 15 },
  'scenic': { total: 1450, carcassa: 1090, pneumatici: 44, vetro: 44, plastica: 145, olio: 7.3, batteria: 18 },
  
  // Opel
  'corsa': { total: 1000, carcassa: 750, pneumatici: 30, vetro: 30, plastica: 100, olio: 5, batteria: 15 },
  'astra': { total: 1300, carcassa: 975, pneumatici: 39, vetro: 39, plastica: 130, olio: 6.5, batteria: 15 },
  'insignia': { total: 1600, carcassa: 1200, pneumatici: 48, vetro: 48, plastica: 160, olio: 8, batteria: 18 },
  
  // Toyota
  'yaris': { total: 1000, carcassa: 750, pneumatici: 30, vetro: 30, plastica: 100, olio: 5, batteria: 15 },
  'auris': { total: 1250, carcassa: 940, pneumatici: 38, vetro: 38, plastica: 125, olio: 6.3, batteria: 15 },
  'corolla': { total: 1300, carcassa: 975, pneumatici: 39, vetro: 39, plastica: 130, olio: 6.5, batteria: 15 },
  'rav4': { total: 1600, carcassa: 1200, pneumatici: 48, vetro: 48, plastica: 160, olio: 8, batteria: 18 },
  
  // Ford
  'fiesta': { total: 1050, carcassa: 790, pneumatici: 32, vetro: 32, plastica: 105, olio: 5.3, batteria: 15 },
  'focus': { total: 1300, carcassa: 975, pneumatici: 39, vetro: 39, plastica: 130, olio: 6.5, batteria: 15 },
  'kuga': { total: 1600, carcassa: 1200, pneumatici: 48, vetro: 48, plastica: 160, olio: 8, batteria: 18 },
  
  // Peugeot
  '208': { total: 1000, carcassa: 750, pneumatici: 30, vetro: 30, plastica: 100, olio: 5, batteria: 15 },
  '308': { total: 1250, carcassa: 940, pneumatici: 38, vetro: 38, plastica: 125, olio: 6.3, batteria: 15 },
  '3008': { total: 1450, carcassa: 1090, pneumatici: 44, vetro: 44, plastica: 145, olio: 7.3, batteria: 18 },
  
  // Citroen
  'c3': { total: 1050, carcassa: 790, pneumatici: 32, vetro: 32, plastica: 105, olio: 5.3, batteria: 15 },
  'c4': { total: 1250, carcassa: 940, pneumatici: 38, vetro: 38, plastica: 125, olio: 6.3, batteria: 15 },
  'c5': { total: 1450, carcassa: 1090, pneumatici: 44, vetro: 44, plastica: 145, olio: 7.3, batteria: 18 },
  
  // Nissan
  'micra': { total: 950, carcassa: 715, pneumatici: 29, vetro: 29, plastica: 95, olio: 4.8, batteria: 12 },
  'qashqai': { total: 1450, carcassa: 1090, pneumatici: 44, vetro: 44, plastica: 145, olio: 7.3, batteria: 18 },
  'juke': { total: 1250, carcassa: 940, pneumatici: 38, vetro: 38, plastica: 125, olio: 6.3, batteria: 15 },
  
  // Lancia
  'ypsilon': { total: 950, carcassa: 715, pneumatici: 29, vetro: 29, plastica: 95, olio: 4.8, batteria: 12 },
  'delta': { total: 1300, carcassa: 975, pneumatici: 39, vetro: 39, plastica: 130, olio: 6.5, batteria: 15 },
  
  // Smart
  'fortwo': { total: 750, carcassa: 565, pneumatici: 23, vetro: 23, plastica: 75, olio: 3.8, batteria: 10 },
  'forfour': { total: 900, carcassa: 675, pneumatici: 27, vetro: 27, plastica: 90, olio: 4.5, batteria: 12 },
};

/**
 * Cerca il modello del veicolo nei preset e ritorna i pesi stimati.
 * Usa fuzzy matching per trovare corrispondenze parziali.
 */
function getVehicleWeightEstimate(marcaModello) {
  if (!marcaModello) return null;
  
  const normalized = marcaModello.toLowerCase().trim();
  
  // Cerca corrispondenza esatta prima
  for (const [model, weights] of Object.entries(VEHICLE_WEIGHT_PRESETS)) {
    if (normalized.includes(model)) {
      return weights;
    }
  }
  
  // Cerca corrispondenze parziali (es: "Fiat Panda 1.2" -> "panda")
  for (const [model, weights] of Object.entries(VEHICLE_WEIGHT_PRESETS)) {
    const words = normalized.split(/\s+/);
    if (words.some(word => word.includes(model) || model.includes(word))) {
      return weights;
    }
  }
  
  return null;
}

/**
 * Genera la lista completa di rifiuti standard da una demolizione VFU.
 * Usa stima intelligente basata su marca/modello se disponibile,
 * altrimenti usa peso_ingresso o valori di default.
 */
function buildDefaultVFURifiuti(case_) {
  const pesoIngresso = parseFloat(case_.peso_ingresso_kg) || 0;
  const pesoCarcassa = parseFloat(case_.peso_carcassa_kg) || null;
  
  // Prova a stimare i pesi dal modello
  const estimate = getVehicleWeightEstimate(case_.marca_modello);
  
  // Usa i pesi stimati dal modello, altrimenti calcola da peso_ingresso o default
  const weights = {
    carcassa: pesoCarcassa || estimate?.carcassa || (pesoIngresso * 0.75) || null,
    pneumatici: estimate?.pneumatici || (pesoIngresso ? Math.round(pesoIngresso * 0.03) : 30),
    vetro: estimate?.vetro || (pesoIngresso ? Math.round(pesoIngresso * 0.03) : 25),
    plastica: estimate?.plastica || (pesoIngresso ? Math.round(pesoIngresso * 0.1) : 80),
    olio: estimate?.olio || (pesoIngresso ? Math.round(pesoIngresso * 0.005) : 4),
    batteria: estimate?.batteria || 15,
  };

  const modelInfo = estimate ? ` (stima ${case_.marca_modello})` : '';
  
  const rifiuti = [
    // Carcassa VFU (rifiuto principale)
    {
      codice: VFU_CER_CODES.carcassa.codice,
      descrizione: `${VFU_CER_CODES.carcassa.descrizione} - ${case_.marca_modello || ''} Targa: ${case_.targa || 'N/A'}${modelInfo}`,
      peso: weights.carcassa,
      unita_misura: 'kg',
      pericoloso: true,
      caratteristiche: 'HP14',
    },
    // Liquidi e componenti pericolosi
    {
      codice: VFU_CER_CODES.olio_motore.codice,
      descrizione: VFU_CER_CODES.olio_motore.descrizione,
      peso: weights.olio,
      unita_misura: 'kg',
      pericoloso: true,
      caratteristiche: 'HP3',
    },
    {
      codice: VFU_CER_CODES.liquidi_freno.codice,
      descrizione: VFU_CER_CODES.liquidi_freno.descrizione,
      peso: 1,
      unita_misura: 'kg',
      pericoloso: true,
      caratteristiche: 'HP6',
    },
    {
      codice: VFU_CER_CODES.antigelo.codice,
      descrizione: VFU_CER_CODES.antigelo.descrizione,
      peso: 3,
      unita_misura: 'kg',
      pericoloso: true,
      caratteristiche: 'HP6',
    },
    {
      codice: VFU_CER_CODES.filtri_olio.codice,
      descrizione: VFU_CER_CODES.filtri_olio.descrizione,
      peso: 1,
      unita_misura: 'kg',
      pericoloso: true,
      caratteristiche: 'HP3',
    },
    {
      codice: VFU_CER_CODES.batterie.codice,
      descrizione: VFU_CER_CODES.batterie.descrizione,
      peso: weights.batteria,
      unita_misura: 'kg',
      pericoloso: true,
      caratteristiche: 'HP8',
    },
    // Componenti non pericolosi
    {
      codice: VFU_CER_CODES.pneumatici.codice,
      descrizione: VFU_CER_CODES.pneumatici.descrizione,
      peso: weights.pneumatici,
      unita_misura: 'kg',
      pericoloso: false,
    },
    {
      codice: VFU_CER_CODES.vetro.codice,
      descrizione: VFU_CER_CODES.vetro.descrizione,
      peso: weights.vetro,
      unita_misura: 'kg',
      pericoloso: false,
    },
    {
      codice: VFU_CER_CODES.plastica.codice,
      descrizione: VFU_CER_CODES.plastica.descrizione,
      peso: weights.plastica,
      unita_misura: 'kg',
      pericoloso: false,
    },
    {
      codice: VFU_CER_CODES.catalizzatori.codice,
      descrizione: VFU_CER_CODES.catalizzatori.descrizione,
      peso: 5,
      unita_misura: 'kg',
      pericoloso: false,
    },
  ];

  return rifiuti;
}

/**
 * Crea bozza FIR (Formulario Identificazione Rifiuti) su RENTRI
 * a partire dai dati completi della demolizione VFU.
 * Popola TUTTI i campi disponibili: produttore (org), detentore (proprietario veicolo),
 * rifiuti con pesi stimati, note con dati veicolo.
 */
export async function creaBozzaFIR({ caseId, orgId, rifiuti, environment = 'demo' }) {
  const supabase = supabaseBrowser();

  try {
    const { case_, org, orgSettings } = await loadCaseData(caseId, orgId);
    if (!case_) throw new Error('Caso demolizione non trovato');

    const meta = case_.meta || {};
    const owner = meta.owner || {};
    const detentore = meta.detentore || null;
    const rvfu = meta.rvfu || {};

    // Se non ci sono rifiuti espliciti, usa i dati dalla tabella vfu_rifiuti_prodotti
    let rifiutiDaUsare = rifiuti;
    if (!rifiutiDaUsare || rifiutiDaUsare.length === 0) {
      rifiutiDaUsare = await loadRifiutiProdotti(caseId);
    }

    // Se ancora nessun rifiuto, costruisci la lista standard VFU
    let codiciEer;
    if (rifiutiDaUsare && rifiutiDaUsare.length > 0) {
      codiciEer = rifiutiDaUsare.map(r => ({
        codice: r.codice_cer || r.codice,
        descrizione: r.descrizione,
        peso: r.peso_kg || r.peso || null,
        unita_misura: r.unita_misura || 'kg',
        pericoloso: r.pericoloso || false,
        caratteristiche: r.caratteristiche || null,
      }));
    } else {
      codiciEer = buildDefaultVFURifiuti(case_);
    }

    // Dati veicolo per le note
    const veicoloInfo = [
      case_.targa ? `Targa: ${case_.targa}` : null,
      case_.telaio ? `Telaio: ${case_.telaio}` : null,
      case_.marca_modello ? `Veicolo: ${case_.marca_modello}` : null,
      case_.anno ? `Anno: ${case_.anno}` : null,
      rvfu.tipoVeicolo ? `Tipo: ${rvfu.tipoVeicolo}` : null,
      rvfu.cilindrata ? `Cilindrata: ${rvfu.cilindrata}` : null,
      rvfu.potenza ? `Potenza: ${rvfu.potenza} kW` : null,
      case_.peso_ingresso_kg ? `Peso ingresso: ${case_.peso_ingresso_kg} kg` : null,
      case_.peso_carcassa_kg ? `Peso carcassa: ${case_.peso_carcassa_kg} kg` : null,
    ].filter(Boolean).join(' | ');

    // Costruisci payload completo per rentri_formulari
    const firPayload = {
      org_id: orgId,
      numero_fir: `BOZZA-VFU-${Date.now()}`,
      anno: new Date().getFullYear(),
      data_creazione: new Date().toISOString().split('T')[0],
      stato: 'bozza',
      environment,

      // ── PRODUTTORE (autodemolitore = org + settings completi) ──
      produttore_cf: orgSettings?.vat || org?.piva || '',
      produttore_nome: orgSettings?.company_name || org?.name || '',
      produttore_indirizzo: orgSettings?.address?.street || org?.address || '',
      produttore_civico: '', // non disponibile in settings.address
      produttore_comune_id: orgSettings?.address?.city || org?.city || '',
      produttore_cap: orgSettings?.address?.zip || org?.cap || '',
      produttore_nazione_id: orgSettings?.address?.country || 'IT',
      produttore_pec: orgSettings?.pec || org?.pec || '',
      produttore_detentore: false, // Il produttore (autodemolitore) è DIVERSO dal detentore (proprietario veicolo)
      produttore_iscrizione_albo: orgSettings?.albo_gestori || org?.albo_gestori || '',
      produttore_autorizzazione_numero: orgSettings?.autorizzazione_numero || org?.autorizzazione_numero || '',
      produttore_autorizzazione_tipo: orgSettings?.autorizzazione_tipo || org?.autorizzazione_tipo || 'RecSmalArt208',

      // ── LUOGO DI PRODUZIONE (stesso del produttore = sede dell'autodemolitore) ──
      luogo_prod_indirizzo: orgSettings?.address?.street || org?.address || '',
      luogo_prod_civico: '',
      luogo_prod_comune_id: orgSettings?.address?.city || org?.city || '',
      luogo_prod_cap: orgSettings?.address?.zip || org?.cap || '',

      // ── DETENTORE (proprietario del veicolo, se diverso) ──
      detentore_cf: (detentore?.cf || owner?.cf) || '',
      detentore_nome: (detentore?.name || owner?.name) || '',
      detentore_indirizzo: (detentore?.residence_address || owner?.residence_address) || '',
      detentore_civico: (detentore?.residence_civic || owner?.residence_civic) || '',
      detentore_comune_id: (detentore?.residence_city || owner?.residence_city) || '',
      detentore_cap: (detentore?.residence_cap || owner?.residence_cap) || '',
      detentore_nazione_id: 'IT',

      // ── TRASPORTATORE (da compilare - spesso è lo stesso autodemolitore) ──
      trasportatore_cf: orgSettings?.vat || org?.piva || '',
      trasportatore_nome: orgSettings?.company_name || org?.name || '',
      trasportatore_pec: orgSettings?.pec || org?.pec || '',
      trasportatore_albo: orgSettings?.albo_gestori || org?.albo_gestori || '',
      trasportatore_tipo_trasporto: 'Terrestre',

      // ── DESTINATARIO (impianto frantumazione - da completare) ──
      destinatario_cf: '',
      destinatario_nome: '',
      destinatario_autorizzazione_tipo: 'RecSmalArt208',

      // ── RIFIUTI ──
      rifiuto_provenienza: 'S',
      codici_eer: codiciEer,

      // ── NOTE ──
      note: `Demolizione VFU D.Lgs 209/2003 - ${veicoloInfo}`,
      annotazioni: [
        `Caso VFU: ${caseId}`,
        rvfu.causale ? `Causale demolizione: ${rvfu.causale}` : null,
        rvfu.km ? `Km percorsi: ${rvfu.km}` : null,
        rvfu.osservazioni || null,
        rvfu.notePartiRifiuti ? `Note parti/rifiuti: ${rvfu.notePartiRifiuti}` : null,
        `Generato automaticamente da RescueManager il ${new Date().toLocaleDateString('it-IT')}`,
      ].filter(Boolean).join('\n'),
    };

    const { data: fir, error: firError } = await supabase
      .from('rentri_formulari')
      .insert(firPayload)
      .select('id, numero_fir')
      .single();

    if (firError) throw firError;

    // Aggiorna il caso con il riferimento al FIR
    await supabase
      .from('demolition_cases')
      .update({ fir_rifiuti_id: fir.id })
      .eq('id', caseId);

    // Salva anche i rifiuti nella tabella vfu_rifiuti_prodotti (se non esistono già)
    try {
      const existingRifiuti = await loadRifiutiProdotti(caseId);
      if (existingRifiuti.length === 0) {
        const rifiutiRows = codiciEer.map(r => ({
          demolition_case_id: caseId,
          org_id: orgId,
          codice_cer: r.codice,
          descrizione: r.descrizione,
          peso_kg: r.peso || null,
          unita_misura: r.unita_misura || 'kg',
          pericoloso: r.pericoloso || false,
          destino: r.pericoloso ? 'smaltimento' : 'recupero',
          step_code: 'pesatura',
        }));
        await supabase.from('vfu_rifiuti_prodotti').insert(rifiutiRows);
      }
    } catch (rifiutiErr) {
      logger.warn('[VFU Draft] Could not save rifiuti prodotti:', rifiutiErr.message);
    }

    logger.info(`[VFU Draft] FIR bozza creato: ${fir.id} per caso ${caseId} con ${codiciEer.length} codici EER`);
    return { success: true, fir_id: fir.id, numero_fir: fir.numero_fir };
  } catch (error) {
    logger.error('[VFU Draft] Error creating FIR draft:', error);
    throw error;
  }
}

/**
 * Cerca o crea un cliente nella tabella clients a partire dai dati del proprietario RVFU.
 * Se trova un cliente con lo stesso CF/P.IVA, lo riusa. Altrimenti ne crea uno nuovo.
 */
async function findOrCreateClient(supabase, orgId, owner) {
  if (!owner || (!owner.cf && !owner.name)) return null;

  // Cerca per CF se disponibile
  if (owner.cf) {
    const { data: existing } = await supabase
      .from('clients')
      .select('id, nome')
      .eq('org_id', orgId)
      .or(`tax_code.eq.${owner.cf},piva.eq.${owner.cf}`)
      .limit(1)
      .maybeSingle();
    if (existing) {
      logger.info(`[VFU Draft] Cliente esistente trovato: ${existing.nome} (${existing.id})`);
      return existing.id;
    }
  }

  // Crea nuovo cliente dai dati RVFU
  const isCompany = owner.tipo === 'PG';
  const clientPayload = {
    org_id: orgId,
    nome: isCompany ? (owner.name || 'Cliente VFU') : (owner.name?.split(' ')[0] || 'Cliente'),
    surname: isCompany ? null : (owner.name?.split(' ').slice(1).join(' ') || null),
    tax_code: owner.cf || null,
    piva: isCompany ? owner.cf : null,
    phone: owner.phone || null,
    email: owner.email || null,
    address: owner.residence_address || null,
    city: owner.residence_city || null,
    province: owner.residence_province || null,
    zip: owner.residence_cap || null,
    country: 'IT',
    is_company: isCompany,
    notes: `Creato automaticamente da demolizione VFU`,
    categoria_cliente: 'demolizione',
  };

  const { data: newClient, error: clientError } = await supabase
    .from('clients')
    .insert(clientPayload)
    .select('id, nome')
    .single();

  if (clientError) {
    logger.warn('[VFU Draft] Could not create client:', clientError.message);
    return null;
  }

  logger.info(`[VFU Draft] Nuovo cliente creato: ${newClient.nome} (${newClient.id})`);
  return newClient.id;
}

/**
 * Sostituisce i segnaposto {targa}, {telaio}, etc. nel template
 */
function fillTemplate(template, case_) {
  if (!template) return '';
  return template
    .replace(/\{targa\}/g, case_.targa || 'N/A')
    .replace(/\{telaio\}/g, case_.telaio || 'N/A')
    .replace(/\{marca_modello\}/g, case_.marca_modello || '')
    .replace(/\{anno\}/g, case_.anno || '')
    .replace(/\{peso_ingresso\}/g, case_.peso_ingresso_kg || '')
    .replace(/\{peso_carcassa\}/g, case_.peso_carcassa_kg || '');
}

/**
 * Crea bozza fattura SDI per la demolizione VFU.
 * Auto-crea il cliente dai dati del proprietario RVFU se non esiste.
 * Usa le colonne reali della tabella invoices.
 * Legge voci predefinite da org_settings (key: demolizione_fattura).
 */
export async function creaBozzaFattura({ caseId, orgId, importo, descrizione }) {
  const supabase = supabaseBrowser();

  try {
    const { case_ } = await loadCaseData(caseId, orgId);
    if (!case_) throw new Error('Caso demolizione non trovato');

    // Carica impostazioni personalizzate fattura demolizione
    let demolizioneSettings = null;
    try {
      const { data: settingsRow } = await supabase
        .from('org_settings')
        .select('value')
        .eq('org_id', orgId)
        .eq('key', 'demolizione_fattura')
        .maybeSingle();
      demolizioneSettings = settingsRow?.value || null;
    } catch (settErr) {
      logger.warn('[VFU Draft] Could not load demolizione settings:', settErr.message);
    }

    const meta = case_.meta || {};
    const owner = meta.owner || {};
    const rvfu = meta.rvfu || {};

    // Auto-crea cliente dal proprietario RVFU
    let clientId = null;
    try {
      clientId = await findOrCreateClient(supabase, orgId, owner);
    } catch (err) {
      logger.warn('[VFU Draft] findOrCreateClient failed:', err.message);
    }

    // Costruisci nome cliente
    const customerName = owner.name || 'Cliente demolizione VFU';
    const customerCF = owner.cf || '';

    // Indirizzo cliente in formato JSON (come usato da InvoiceNew)
    const customerAddress = {
      via: owner.residence_address || '',
      civico: owner.residence_civic || '',
      cap: owner.residence_cap || '',
      comune: owner.residence_city || '',
      provincia: owner.residence_province || '',
      nazione: 'IT',
    };

    // Data e luogo di nascita (per persone fisiche)
    const birthDate = owner.birth_date || null;
    const birthPlace = owner.birth_place || null;
    const birthProvince = owner.birth_province || null;

    // Importo: usa personalizzato da settings, poi parametro, poi default
    const settingsItems = demolizioneSettings?.items;
    const importoServizio = importo || (settingsItems?.length
      ? settingsItems.reduce((sum, it) => sum + (it.qty || 1) * (it.prezzo || 0), 0)
      : (demolizioneSettings?.importo_default || 150));

    // Causale: usa template personalizzato se presente
    const causaleDefault = `Servizio demolizione veicolo ${case_.targa || ''} ${case_.marca_modello || ''} - D.Lgs 209/2003`;
    const causale = demolizioneSettings?.causale_template
      ? fillTemplate(demolizioneSettings.causale_template, case_)
      : causaleDefault;

    // Meta SDI completa
    const sdiMeta = {
      sdi: {
        documento: {
          tipo_documento: 'TD01',
          divisa: 'EUR',
          data: new Date().toISOString().split('T')[0],
          causale,
        },
        cliente: {
          denominazione: customerName,
          codice_fiscale: customerCF,
          partita_iva: owner.tipo === 'PG' ? customerCF : null,
          indirizzo: owner.residence_address || '',
          civico: owner.residence_civic || '',
          cap: owner.residence_cap || '',
          comune: owner.residence_city || '',
          provincia: owner.residence_province || '',
          nazione: 'IT',
          codice_destinatario: '0000000',
          data_nascita: birthDate,
          comune_nascita: birthPlace,
          provincia_nascita: birthProvince,
        },
        note: rvfu.osservazioni || null,
      },
      demolizione: {
        case_id: caseId,
        targa: case_.targa,
        telaio: case_.telaio,
        marca_modello: case_.marca_modello,
        anno: case_.anno,
        causale: rvfu.causale || null,
        peso_ingresso_kg: case_.peso_ingresso_kg || null,
        peso_carcassa_kg: case_.peso_carcassa_kg || null,
      },
      vfu_client_id: clientId,
    };

    // Crea bozza fattura con colonne reali della tabella invoices
    const invoicePayload = {
      org_id: orgId,
      customer_name: customerName,
      customer_vat: owner.tipo === 'PG' ? customerCF : null,
      customer_tax_code: customerCF || null,
      customer_address: customerAddress,
      date: new Date().toISOString().split('T')[0],
      currency: 'EUR',
      total: importoServizio,
      sdi_status: 'draft',
      provider_id: 'sdi_prod',
      meta: sdiMeta,
      note_internal: demolizioneSettings?.note_template
        ? fillTemplate(demolizioneSettings.note_template, case_)
        : `Bozza auto-generata da caso VFU - Targa: ${case_.targa || 'N/A'} - Telaio: ${case_.telaio || 'N/A'}`,
    };

    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert(invoicePayload)
      .select('id')
      .single();

    if (invoiceError) throw invoiceError;

    // Crea righe fattura: usa voci personalizzate da settings se disponibili
    try {
      if (settingsItems?.length) {
        const rows = settingsItems.map(it => ({
          invoice_id: invoice.id,
          item_code: fillTemplate(it.codice || '', case_),
          item_description: fillTemplate(it.descrizione || '', case_),
          qty: it.qty || 1,
          price: it.prezzo || 0,
          vat_perc: it.iva ?? 22,
        }));
        await supabase.from('invoice_items').insert(rows);
      } else {
        await supabase
          .from('invoice_items')
          .insert({
            invoice_id: invoice.id,
            item_code: `Demolizione veicolo ${case_.targa || ''}`,
            item_description: [
              `Servizio di demolizione VFU ai sensi del D.Lgs 209/2003`,
              case_.marca_modello ? `Veicolo: ${case_.marca_modello}` : null,
              case_.targa ? `Targa: ${case_.targa}` : null,
              case_.telaio ? `Telaio: ${case_.telaio}` : null,
              case_.anno ? `Anno: ${case_.anno}` : null,
              case_.peso_ingresso_kg ? `Peso: ${case_.peso_ingresso_kg} kg` : null,
            ].filter(Boolean).join(' - '),
            qty: 1,
            price: importoServizio,
            vat_perc: 22,
          });
      }
    } catch (itemErr) {
      logger.warn('[VFU Draft] Could not create invoice item:', itemErr.message);
    }

    // Aggiorna il caso con il riferimento alla fattura
    await supabase
      .from('demolition_cases')
      .update({ invoice_draft_id: invoice.id })
      .eq('id', caseId);

    logger.info(`[VFU Draft] Invoice draft creato: ${invoice.id} per caso ${caseId}, cliente: ${clientId || 'nessuno'}`);
    return { success: true, invoice_id: invoice.id, client_id: clientId };
  } catch (error) {
    logger.error('[VFU Draft] Error creating invoice draft:', error);
    throw error;
  }
}

/**
 * Ottieni i codici CER standard per VFU
 */
export function getVFUCERCodes() {
  return VFU_CER_CODES;
}

/**
 * Verifica se un caso ha già le bozze create
 */
export async function checkDraftStatus(caseId) {
  const supabase = supabaseBrowser();
  const { data } = await supabase
    .from('demolition_cases')
    .select('fir_rifiuti_id, invoice_draft_id, rentri_movimento_id')
    .eq('id', caseId)
    .single();

  return {
    hasFIR: !!data?.fir_rifiuti_id,
    hasInvoice: !!data?.invoice_draft_id,
    hasRENTRI: !!data?.rentri_movimento_id,
    fir_id: data?.fir_rifiuti_id,
    invoice_id: data?.invoice_draft_id,
    rentri_id: data?.rentri_movimento_id,
  };
}
