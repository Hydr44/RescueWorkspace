/**
 * Preset ricambi estratti per modelli comuni di veicoli
 * Basato su componenti tipicamente riutilizzabili secondo D.Lgs 209/2003
 */

import { supabaseBrowser } from './supabase-browser';
import logger from './logger';

/**
 * Ricambi standard estratti da un veicolo VFU
 * Ogni ricambio ha: categoria, descrizione, condizione stimata, valore stimato
 */
const RICAMBI_STANDARD = {
  // Motore e trasmissione
  motore: { categoria: 'Motore', descrizione: 'Motore completo', valore_min: 200, valore_max: 1500 },
  cambio: { categoria: 'Trasmissione', descrizione: 'Cambio', valore_min: 150, valore_max: 800 },
  alternatore: { categoria: 'Elettrico', descrizione: 'Alternatore', valore_min: 50, valore_max: 200 },
  motorino_avviamento: { categoria: 'Elettrico', descrizione: 'Motorino di avviamento', valore_min: 40, valore_max: 150 },
  
  // Carrozzeria
  porta_anteriore_sx: { categoria: 'Carrozzeria', descrizione: 'Porta anteriore sinistra', valore_min: 80, valore_max: 300 },
  porta_anteriore_dx: { categoria: 'Carrozzeria', descrizione: 'Porta anteriore destra', valore_min: 80, valore_max: 300 },
  porta_posteriore_sx: { categoria: 'Carrozzeria', descrizione: 'Porta posteriore sinistra', valore_min: 70, valore_max: 250 },
  porta_posteriore_dx: { categoria: 'Carrozzeria', descrizione: 'Porta posteriore destra', valore_min: 70, valore_max: 250 },
  cofano: { categoria: 'Carrozzeria', descrizione: 'Cofano motore', valore_min: 60, valore_max: 250 },
  portellone: { categoria: 'Carrozzeria', descrizione: 'Portellone posteriore', valore_min: 100, valore_max: 400 },
  parafango_anteriore_sx: { categoria: 'Carrozzeria', descrizione: 'Parafango anteriore sinistro', valore_min: 40, valore_max: 150 },
  parafango_anteriore_dx: { categoria: 'Carrozzeria', descrizione: 'Parafango anteriore destro', valore_min: 40, valore_max: 150 },
  
  // Interni
  sedile_anteriore_sx: { categoria: 'Interni', descrizione: 'Sedile anteriore sinistro', valore_min: 50, valore_max: 200 },
  sedile_anteriore_dx: { categoria: 'Interni', descrizione: 'Sedile anteriore destro', valore_min: 50, valore_max: 200 },
  sedile_posteriore: { categoria: 'Interni', descrizione: 'Sedile posteriore', valore_min: 60, valore_max: 250 },
  volante: { categoria: 'Interni', descrizione: 'Volante', valore_min: 30, valore_max: 150 },
  cruscotto: { categoria: 'Interni', descrizione: 'Cruscotto', valore_min: 80, valore_max: 300 },
  
  // Sospensioni e freni
  ammortizzatore_anteriore_sx: { categoria: 'Sospensioni', descrizione: 'Ammortizzatore anteriore sinistro', valore_min: 30, valore_max: 120 },
  ammortizzatore_anteriore_dx: { categoria: 'Sospensioni', descrizione: 'Ammortizzatore anteriore destro', valore_min: 30, valore_max: 120 },
  ammortizzatore_posteriore_sx: { categoria: 'Sospensioni', descrizione: 'Ammortizzatore posteriore sinistro', valore_min: 30, valore_max: 120 },
  ammortizzatore_posteriore_dx: { categoria: 'Sospensioni', descrizione: 'Ammortizzatore posteriore destro', valore_min: 30, valore_max: 120 },
  pinza_freno_anteriore_sx: { categoria: 'Freni', descrizione: 'Pinza freno anteriore sinistra', valore_min: 40, valore_max: 150 },
  pinza_freno_anteriore_dx: { categoria: 'Freni', descrizione: 'Pinza freno anteriore destra', valore_min: 40, valore_max: 150 },
  
  // Ottica e specchi
  faro_anteriore_sx: { categoria: 'Ottica', descrizione: 'Faro anteriore sinistro', valore_min: 50, valore_max: 300 },
  faro_anteriore_dx: { categoria: 'Ottica', descrizione: 'Faro anteriore destro', valore_min: 50, valore_max: 300 },
  fanale_posteriore_sx: { categoria: 'Ottica', descrizione: 'Fanale posteriore sinistro', valore_min: 30, valore_max: 150 },
  fanale_posteriore_dx: { categoria: 'Ottica', descrizione: 'Fanale posteriore destro', valore_min: 30, valore_max: 150 },
  specchietto_sx: { categoria: 'Ottica', descrizione: 'Specchietto retrovisore sinistro', valore_min: 20, valore_max: 100 },
  specchietto_dx: { categoria: 'Ottica', descrizione: 'Specchietto retrovisore destro', valore_min: 20, valore_max: 100 },
  
  // Cerchi e pneumatici
  cerchio_anteriore_sx: { categoria: 'Ruote', descrizione: 'Cerchio anteriore sinistro', valore_min: 30, valore_max: 200 },
  cerchio_anteriore_dx: { categoria: 'Ruote', descrizione: 'Cerchio anteriore destro', valore_min: 30, valore_max: 200 },
  cerchio_posteriore_sx: { categoria: 'Ruote', descrizione: 'Cerchio posteriore sinistro', valore_min: 30, valore_max: 200 },
  cerchio_posteriore_dx: { categoria: 'Ruote', descrizione: 'Cerchio posteriore destro', valore_min: 30, valore_max: 200 },
};

/**
 * Preset ricambi per tipologie di veicoli
 * Alcuni veicoli hanno componenti specifici o valori diversi
 */
const RICAMBI_PER_CATEGORIA = {
  // Utilitarie (Panda, Punto, 500, Polo, Clio, Corsa, Yaris, Micra)
  utilitaria: [
    'motore', 'cambio', 'alternatore', 'motorino_avviamento',
    'porta_anteriore_sx', 'porta_anteriore_dx', 'cofano',
    'sedile_anteriore_sx', 'sedile_anteriore_dx', 'volante', 'cruscotto',
    'ammortizzatore_anteriore_sx', 'ammortizzatore_anteriore_dx',
    'faro_anteriore_sx', 'faro_anteriore_dx',
    'cerchio_anteriore_sx', 'cerchio_anteriore_dx', 'cerchio_posteriore_sx', 'cerchio_posteriore_dx',
  ],
  
  // Berline medie (Golf, Megane, Focus, Astra, Auris)
  berlina: [
    'motore', 'cambio', 'alternatore', 'motorino_avviamento',
    'porta_anteriore_sx', 'porta_anteriore_dx', 'porta_posteriore_sx', 'porta_posteriore_dx', 'cofano', 'portellone',
    'parafango_anteriore_sx', 'parafango_anteriore_dx',
    'sedile_anteriore_sx', 'sedile_anteriore_dx', 'sedile_posteriore', 'volante', 'cruscotto',
    'ammortizzatore_anteriore_sx', 'ammortizzatore_anteriore_dx', 'ammortizzatore_posteriore_sx', 'ammortizzatore_posteriore_dx',
    'pinza_freno_anteriore_sx', 'pinza_freno_anteriore_dx',
    'faro_anteriore_sx', 'faro_anteriore_dx', 'fanale_posteriore_sx', 'fanale_posteriore_dx',
    'specchietto_sx', 'specchietto_dx',
    'cerchio_anteriore_sx', 'cerchio_anteriore_dx', 'cerchio_posteriore_sx', 'cerchio_posteriore_dx',
  ],
  
  // SUV e crossover (Qashqai, Tiguan, 3008, Captur, RAV4, Kuga)
  suv: [
    'motore', 'cambio', 'alternatore', 'motorino_avviamento',
    'porta_anteriore_sx', 'porta_anteriore_dx', 'porta_posteriore_sx', 'porta_posteriore_dx', 'cofano', 'portellone',
    'parafango_anteriore_sx', 'parafango_anteriore_dx',
    'sedile_anteriore_sx', 'sedile_anteriore_dx', 'sedile_posteriore', 'volante', 'cruscotto',
    'ammortizzatore_anteriore_sx', 'ammortizzatore_anteriore_dx', 'ammortizzatore_posteriore_sx', 'ammortizzatore_posteriore_dx',
    'pinza_freno_anteriore_sx', 'pinza_freno_anteriore_dx',
    'faro_anteriore_sx', 'faro_anteriore_dx', 'fanale_posteriore_sx', 'fanale_posteriore_dx',
    'specchietto_sx', 'specchietto_dx',
    'cerchio_anteriore_sx', 'cerchio_anteriore_dx', 'cerchio_posteriore_sx', 'cerchio_posteriore_dx',
  ],
  
  // Furgoni (Ducato, Doblò)
  furgone: [
    'motore', 'cambio', 'alternatore', 'motorino_avviamento',
    'porta_anteriore_sx', 'porta_anteriore_dx', 'cofano',
    'sedile_anteriore_sx', 'sedile_anteriore_dx', 'volante', 'cruscotto',
    'ammortizzatore_anteriore_sx', 'ammortizzatore_anteriore_dx', 'ammortizzatore_posteriore_sx', 'ammortizzatore_posteriore_dx',
    'faro_anteriore_sx', 'faro_anteriore_dx',
    'specchietto_sx', 'specchietto_dx',
    'cerchio_anteriore_sx', 'cerchio_anteriore_dx', 'cerchio_posteriore_sx', 'cerchio_posteriore_dx',
  ],
};

/**
 * Determina la categoria del veicolo in base al modello
 */
function getCategoriaVeicolo(marcaModello) {
  if (!marcaModello) return 'berlina'; // Default
  
  const normalized = marcaModello.toLowerCase();
  
  // Utilitarie
  if (['panda', 'punto', '500', 'polo', 'clio', 'corsa', 'yaris', 'micra', 'ypsilon', 'fortwo', 'forfour', '208', 'c3', 'fiesta'].some(m => normalized.includes(m))) {
    return 'utilitaria';
  }
  
  // SUV
  if (['qashqai', 'tiguan', '3008', 'captur', 'rav4', 'kuga', 'juke', 'scenic'].some(m => normalized.includes(m))) {
    return 'suv';
  }
  
  // Furgoni
  if (['ducato', 'doblo', 'doblò'].some(m => normalized.includes(m))) {
    return 'furgone';
  }
  
  // Default: berlina
  return 'berlina';
}

/**
 * Genera lista ricambi estratti in base al modello del veicolo
 */
export function generaRicambiPerModello(marcaModello, anno) {
  const categoria = getCategoriaVeicolo(marcaModello);
  const ricambiKeys = RICAMBI_PER_CATEGORIA[categoria] || RICAMBI_PER_CATEGORIA.berlina;
  
  // Fattore di svalutazione per anno (veicoli più vecchi = ricambi meno preziosi)
  const anniVecchiaia = new Date().getFullYear() - (anno || 2010);
  const fattoreSvalutazione = Math.max(0.3, 1 - (anniVecchiaia * 0.05)); // Min 30% del valore
  
  return ricambiKeys.map(key => {
    const preset = RICAMBI_STANDARD[key];
    const valoreStimato = Math.round((preset.valore_min + preset.valore_max) / 2 * fattoreSvalutazione);
    
    return {
      nome: preset.descrizione,
      categoria: preset.categoria,
      condizione: anniVecchiaia < 5 ? 'buono' : anniVecchiaia < 10 ? 'discreto' : 'usato',
      prezzo_stimato: valoreStimato,
    };
  });
}

/**
 * Crea automaticamente i ricambi estratti per un caso VFU
 */
export async function creaRicambiEstratti({ caseId, orgId }) {
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
    
    // Genera ricambi in base al modello
    const ricambi = generaRicambiPerModello(case_.marca_modello, case_.anno);
    
    // Inserisci ricambi nel DB
    const ricambiPayload = ricambi.map(r => ({
      org_id: orgId,
      demolition_case_id: caseId,
      ...r,
    }));
    
    const { data, error } = await supabase
      .from('vfu_ricambi_estratti')
      .insert(ricambiPayload)
      .select('id');
    
    if (error) throw error;
    
    logger.info('[VFU Ricambi] Creati', data.length, 'ricambi per caso', caseId.slice(0, 8));
    
    return data;
  } catch (error) {
    logger.error('[VFU Ricambi] Error creating ricambi:', error);
    throw error;
  }
}
