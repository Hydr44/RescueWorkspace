/**
 * Converte ricambi estratti VFU in ricambi di magazzino
 */

import { supabaseBrowser } from './supabase-browser';
import logger from './logger';

/**
 * Crea un ricambio in spare_parts da un ricambio VFU estratto
 * @param {string} vfuRicambioId - ID del ricambio VFU
 * @param {string} orgId - ID organizzazione
 * @returns {Promise<object>} Ricambio creato
 */
export async function convertiRicambioVFUInSparePart(vfuRicambioId, orgId) {
  const supabase = supabaseBrowser();

  try {
    // Carica ricambio VFU con dati caso
    const { data: vfuRicambio, error: ricambioErr } = await supabase
      .from('vfu_ricambi_estratti')
      .select(`
        *,
        demolition_case:demolition_cases(
          id,
          targa,
          telaio,
          marca_modello,
          anno
        )
      `)
      .eq('id', vfuRicambioId)
      .single();

    if (ricambioErr) throw ricambioErr;
    if (!vfuRicambio) throw new Error('Ricambio VFU non trovato');

    const caso = vfuRicambio.demolition_case;

    // Mappa categoria VFU → categoria spare_parts
    const categoriaMap = {
      'Motore': 'ENG',
      'Trasmissione': 'TRX',
      'Elettrico': 'ELEC',
      'Carrozzeria': 'BODY',
      'Interni': 'INT',
      'Sospensioni': 'SUS',
      'Freni': 'BRK',
      'Ottica': 'LIGHT',
      'Ruote': 'TIRE',
    };

    const categoryCode = categoriaMap[vfuRicambio.categoria] || 'OTHER';

    // Recupera category_id dalla tabella spare_parts_categories
    const { data: categoryData } = await supabase
      .from('spare_parts_categories')
      .select('id')
      .eq('code', categoryCode)
      .maybeSingle();

    // Genera codice interno ricambio (RM-{CATEGORIA}-{ANNO}-{PROGRESSIVO})
    const anno = new Date().getFullYear();
    
    // Ottieni prossimo progressivo per questa categoria
    const { data: counter } = await supabase
      .from('spare_parts_code_counters')
      .select('counter')
      .eq('org_id', orgId)
      .eq('category_code', categoryCode)
      .eq('year', anno)
      .maybeSingle();

    const progressivo = (counter?.counter || 0) + 1;
    const internalCode = `RM-${categoryCode}-${anno}-${String(progressivo).padStart(4, '0')}`;

    // Mappa condizione italiana → inglese (DB constraint)
    const condizioneMap = {
      'nuovo': 'new',
      'usato': 'used',
      'ricondizionato': 'refurbished',
      'danneggiato': 'damaged',
    };
    
    const condition = condizioneMap[vfuRicambio.condizione?.toLowerCase()] || 'used';

    // Crea ricambio in spare_parts
    const sparePartPayload = {
      org_id: orgId,
      name: vfuRicambio.nome,
      description: `Estratto da ${caso?.marca_modello || 'veicolo'} - Targa: ${caso?.targa || 'N/A'}`,
      internal_code: internalCode,
      category_id: categoryData?.id || null,
      
      // Dati veicolo sorgente
      source_vehicle_make: caso?.marca_modello?.split(' ')[0] || '',
      source_vehicle_model: caso?.marca_modello?.split(' ').slice(1).join(' ') || '',
      source_vehicle_year: caso?.anno,
      source_vehicle_vin: caso?.telaio,
      source_vehicle_plate: caso?.targa,
      
      // Categoria e condizione
      condition: condition,
      status: 'available',
      
      // Prezzo
      price_sell: vfuRicambio.prezzo_stimato,
      auto_price: false,
      
      // Quantità
      quantity: 1,
      
      // Metadata
      metadata: {
        vfu_ricambio_id: vfuRicambioId,
        vfu_case_id: caso?.id,
        qualita: vfuRicambio.qualita,
        step_code: vfuRicambio.step_code,
      },
    };

    const { data: sparePart, error: spError } = await supabase
      .from('spare_parts')
      .insert(sparePartPayload)
      .select()
      .single();

    if (spError) throw spError;

    // Aggiorna contatore
    await supabase
      .from('spare_parts_code_counters')
      .upsert({
        org_id: orgId,
        category_code: categoryCode,
        year: anno,
        counter: progressivo,
      }, {
        onConflict: 'org_id,category_code,year',
      });

    // Aggiorna vfu_ricambi_estratti con riferimento
    await supabase
      .from('vfu_ricambi_estratti')
      .update({ spare_part_id: sparePart.id })
      .eq('id', vfuRicambioId);

    logger.info('[VFU→SpareParts] Convertito ricambio:', vfuRicambioId, '→', sparePart.id);

    return sparePart;
  } catch (error) {
    logger.error('[VFU→SpareParts] Error:', error);
    throw error;
  }
}

/**
 * Converte tutti i ricambi VFU di un caso in spare_parts
 * @param {string} caseId - ID caso demolizione
 * @param {string} orgId - ID organizzazione
 * @returns {Promise<Array>} Ricambi creati
 */
export async function convertiTuttiRicambiVFU(caseId, orgId) {
  const supabase = supabaseBrowser();

  try {
    // Carica tutti i ricambi VFU del caso che non sono ancora stati convertiti
    const { data: ricambi, error } = await supabase
      .from('vfu_ricambi_estratti')
      .select('id')
      .eq('demolition_case_id', caseId)
      .is('spare_part_id', null);

    if (error) throw error;

    const converted = [];
    for (const ricambio of ricambi || []) {
      try {
        const sparePart = await convertiRicambioVFUInSparePart(ricambio.id, orgId);
        converted.push(sparePart);
      } catch (err) {
        logger.warn('[VFU→SpareParts] Skip ricambio', ricambio.id, ':', err.message);
      }
    }

    logger.info('[VFU→SpareParts] Convertiti', converted.length, 'ricambi per caso', caseId.slice(0, 8));

    return converted;
  } catch (error) {
    logger.error('[VFU→SpareParts] Batch error:', error);
    throw error;
  }
}
