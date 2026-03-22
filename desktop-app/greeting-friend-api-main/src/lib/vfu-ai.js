/**
 * Modulo IA per il processo VFU
 * Integra OpenAI GPT-4o per:
 * 1. OCR targa/libretto da foto
 * 3. Classificazione automatica CER codes
 * 4. Assistente virtuale checklist
 * 5. Pricing dinamico ricambi
 * 6. Anomaly detection e compliance
 */

import logger from './logger';

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

/**
 * Helper: chiama OpenAI API
 */
async function callOpenAI({ model = 'gpt-4o-mini', messages, temperature = 0.3, max_tokens = 1500 }) {
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY non configurata. Imposta VITE_OPENAI_API_KEY nel file .env');
  }

  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model, messages, temperature, max_tokens }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenAI API error ${response.status}: ${err}`);
  }

  const data = await response.json();
  return data.choices[0].message.content.trim();
}

/**
 * Helper: parse JSON dalla risposta AI (gestisce markdown wrapping)
 */
function parseAIJson(raw) {
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (jsonMatch) return JSON.parse(jsonMatch[0]);
  return JSON.parse(raw);
}

// ═══════════════════════════════════════════════════════════════
// 1. OCR TARGA / LIBRETTO DA FOTO
// ═══════════════════════════════════════════════════════════════

/**
 * Riconosce targa e dati veicolo da foto (targa, libretto, carta di circolazione)
 * @param {string} imageBase64 - Immagine in base64
 * @param {string} imageType - 'targa' | 'libretto' | 'auto'
 * @returns {Promise<object>} Dati estratti
 */
export async function ocrVeicoloFromImage(imageBase64, imageType = 'targa') {
  logger.info('[VFU AI] OCR richiesto per:', imageType);

  const systemPrompt = `Sei un esperto di veicoli italiani. Analizza l'immagine e estrai i dati del veicolo.
Rispondi SEMPRE e SOLO con JSON valido, senza markdown.`;

  const userPrompts = {
    targa: `Analizza questa foto di una targa italiana.
Estrai SOLO la targa (formato AA000BB o formato vecchio con provincia).
Rispondi con: {"targa": "XX000XX", "confidence": 0.95, "formato": "nuovo|vecchio"}`,

    libretto: `Analizza questa foto di un libretto di circolazione / carta di circolazione italiana.
Estrai TUTTI i dati visibili:
{
  "targa": "XX000XX",
  "telaio": "numero telaio VIN",
  "marca": "FIAT",
  "modello": "PANDA",
  "versione": "1.2 Easy",
  "anno_immatricolazione": "2015",
  "cilindrata": "1200",
  "potenza_kw": "51",
  "alimentazione": "benzina",
  "massa_kg": "900",
  "proprietario": {
    "nome": "MARIO",
    "cognome": "ROSSI",
    "cf": "RSSMRA80A01H501U",
    "indirizzo": "Via Roma 1",
    "cap": "00100",
    "comune": "ROMA",
    "provincia": "RM"
  },
  "confidence": 0.9
}
Se un campo non è leggibile, metti null.`,

    auto: `Analizza questa foto di un'automobile.
Identifica marca, modello, colore e condizioni generali.
{
  "marca": "FIAT",
  "modello": "PANDA",
  "colore": "bianco",
  "generazione": "terza generazione (2012-2021)",
  "anno_stimato": "2015-2018",
  "condizioni": "buone|discrete|cattive|da demolire",
  "danni_visibili": ["paraurti anteriore danneggiato", "graffi portiera"],
  "confidence": 0.85
}`
  };

  const messages = [
    { role: 'system', content: systemPrompt },
    {
      role: 'user',
      content: [
        { type: 'text', text: userPrompts[imageType] || userPrompts.targa },
        {
          type: 'image_url',
          image_url: {
            url: imageBase64.startsWith('data:') ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`,
            detail: 'high'
          }
        }
      ]
    }
  ];

  try {
    const raw = await callOpenAI({ model: 'gpt-4o', messages, max_tokens: 1000 });
    const result = parseAIJson(raw);
    logger.info('[VFU AI] OCR result:', result);
    return { success: true, data: result };
  } catch (err) {
    logger.error('[VFU AI] OCR error:', err.message);
    return { success: false, error: err.message };
  }
}

// ═══════════════════════════════════════════════════════════════
// 3. CLASSIFICAZIONE AUTOMATICA CER CODES
// ═══════════════════════════════════════════════════════════════

/**
 * Classifica rifiuti VFU con codici CER precisi basati sul veicolo specifico
 * @param {object} vehicleData - {marca_modello, anno, alimentazione, peso_kg, optional}
 * @returns {Promise<object>} Lista CER con pesi stimati
 */
export async function classificaRifiutiCER(vehicleData) {
  logger.info('[VFU AI] Classificazione CER per:', vehicleData.marca_modello);

  const messages = [
    {
      role: 'system',
      content: `Sei un esperto ambientale italiano specializzato in classificazione rifiuti da veicoli fuori uso (VFU) secondo D.Lgs 209/2003 e normativa RENTRI.
Conosci perfettamente il Catalogo Europeo dei Rifiuti (CER/EER).
Rispondi SEMPRE e SOLO con JSON valido, senza markdown.`
    },
    {
      role: 'user',
      content: `Classifica i rifiuti producibili dalla demolizione di questo veicolo:

Marca/Modello: ${vehicleData.marca_modello}
Anno: ${vehicleData.anno || 'N/D'}
Alimentazione: ${vehicleData.alimentazione || 'benzina'}
Peso totale: ${vehicleData.peso_kg || 'N/D'} kg
Dotazioni: ${vehicleData.optional || 'standard'}

Genera la lista COMPLETA dei rifiuti con codici CER corretti e pesi REALISTICI per questo specifico modello.
Include TUTTI i rifiuti: pericolosi e non pericolosi.

{
  "rifiuti": [
    {
      "codice_cer": "160104*",
      "descrizione": "Veicoli fuori uso",
      "peso_kg": 700,
      "pericoloso": true,
      "caratteristiche_hp": ["HP14"],
      "note": "Carcassa dopo bonifica"
    }
  ],
  "totale_kg": 920,
  "totale_pericolosi_kg": 720,
  "totale_non_pericolosi_kg": 200,
  "note_classificazione": "Attenzione: veicolo con ...",
  "confidence": 0.9
}`
    }
  ];

  try {
    const raw = await callOpenAI({ messages, max_tokens: 2000 });
    const result = parseAIJson(raw);
    logger.info('[VFU AI] CER classification:', result.rifiuti?.length, 'rifiuti');
    return { success: true, data: result };
  } catch (err) {
    logger.error('[VFU AI] CER classification error:', err.message);
    return { success: false, error: err.message };
  }
}

// ═══════════════════════════════════════════════════════════════
// 4. ASSISTENTE CHECKLIST PERSONALIZZATO
// ═══════════════════════════════════════════════════════════════

/**
 * Genera istruzioni personalizzate per una fase di demolizione
 * @param {string} fase - Nome fase (bonifica, messa_in_sicurezza, ecc)
 * @param {object} vehicleData - Dati veicolo
 * @returns {Promise<object>} Istruzioni dettagliate
 */
export async function assistenteChecklist(fase, vehicleData) {
  logger.info('[VFU AI] Assistente checklist per fase:', fase, vehicleData.marca_modello);

  const messages = [
    {
      role: 'system',
      content: `Sei un esperto tecnico di autodemolizioni italiane. Conosci perfettamente le procedure D.Lgs 209/2003 e le specifiche tecniche di ogni modello di auto.
Dai istruzioni PRATICHE e SPECIFICHE per il modello indicato: posizione componenti, quantità liquidi, attrezzi necessari, tempistiche.
Rispondi SEMPRE e SOLO con JSON valido, senza markdown.`
    },
    {
      role: 'user',
      content: `Genera istruzioni DETTAGLIATE e SPECIFICHE per la fase "${fase}" della demolizione di:

Veicolo: ${vehicleData.marca_modello}
Anno: ${vehicleData.anno || 'N/D'}
Alimentazione: ${vehicleData.alimentazione || 'benzina'}
Cilindrata: ${vehicleData.cilindrata || 'N/D'}

{
  "fase": "${fase}",
  "veicolo": "${vehicleData.marca_modello}",
  "steps": [
    {
      "ordine": 1,
      "operazione": "Nome operazione",
      "istruzioni": "Istruzioni dettagliate specifiche per questo modello (posizione, quantità, procedura)",
      "attrezzi": ["chiave 13mm", "recipiente 5L"],
      "cer_code": "130205*",
      "pericoloso": true,
      "dpi_necessari": ["guanti", "occhiali"],
      "tempo_stimato_minuti": 5,
      "avvertenze": ["Non fumare", "Evitare fiamme"]
    }
  ],
  "tempo_totale_minuti": 45,
  "alert_speciali": ["ATTENZIONE: veicolo GPL - procedura speciale bombola"],
  "normativa_riferimento": "D.Lgs 209/2003, Art. 5, comma 2"
}`
    }
  ];

  try {
    const raw = await callOpenAI({ messages, max_tokens: 2500 });
    const result = parseAIJson(raw);
    logger.info('[VFU AI] Checklist:', result.steps?.length, 'steps per', fase);
    return { success: true, data: result };
  } catch (err) {
    logger.error('[VFU AI] Checklist error:', err.message);
    return { success: false, error: err.message };
  }
}

// ═══════════════════════════════════════════════════════════════
// 5. PRICING DINAMICO RICAMBI
// ═══════════════════════════════════════════════════════════════

/**
 * Stima prezzo di mercato per un ricambio usato
 * @param {object} partData - {descrizione, marca, modello, anno, condizione, km}
 * @returns {Promise<object>} Pricing con analisi mercato
 */
export async function pricingRicambio(partData) {
  logger.info('[VFU AI] Pricing per:', partData.descrizione, partData.marca, partData.modello);

  const messages = [
    {
      role: 'system',
      content: `Sei un esperto del mercato italiano dei ricambi auto usati (eBay, Subito.it, ricambi24.it).
Conosci i prezzi medi di mercato per ogni tipo di ricambio, marca e modello.
Fornisci stime REALISTICHE basate sul mercato italiano attuale.
Rispondi SEMPRE e SOLO con JSON valido, senza markdown.`
    },
    {
      role: 'user',
      content: `Stima il prezzo di mercato per questo ricambio usato:

Ricambio: ${partData.descrizione}
Marca veicolo: ${partData.marca || 'N/D'}
Modello: ${partData.modello || 'N/D'}
Anno veicolo: ${partData.anno || 'N/D'}
Condizione: ${partData.condizione || 'usato'}
Km veicolo: ${partData.km || 'N/D'}

{
  "ricambio": "${partData.descrizione}",
  "prezzo_mercato": {
    "min": 50,
    "medio": 80,
    "max": 120
  },
  "prezzo_consigliato": 75,
  "domanda": "alta|media|bassa",
  "tempo_vendita_stimato_giorni": 15,
  "probabilita_vendita_30gg": 0.75,
  "piattaforma_migliore": "eBay|Subito|Ricambi24",
  "suggerimenti": [
    "Prezzo competitivo per km basso",
    "Questo modello ha alta richiesta"
  ],
  "confidence": 0.85
}`
    }
  ];

  try {
    const raw = await callOpenAI({ messages, max_tokens: 800 });
    const result = parseAIJson(raw);
    logger.info('[VFU AI] Pricing result:', result.prezzo_consigliato, '€');
    return { success: true, data: result };
  } catch (err) {
    logger.error('[VFU AI] Pricing error:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Pricing batch per tutti i ricambi di un veicolo
 * @param {Array} ricambi - Lista ricambi
 * @param {object} vehicleData - {marca, modello, anno, km}
 * @returns {Promise<object>} Pricing per tutti i ricambi
 */
export async function pricingRicambiBatch(ricambi, vehicleData) {
  logger.info('[VFU AI] Pricing batch per', ricambi.length, 'ricambi');

  const ricambiList = ricambi.map(r => `- ${r.descrizione} (condizione: ${r.condizione || 'usato'})`).join('\n');

  const messages = [
    {
      role: 'system',
      content: `Sei un esperto del mercato italiano dei ricambi auto usati. Fornisci stime REALISTICHE per il mercato italiano 2026.
Rispondi SEMPRE e SOLO con JSON valido, senza markdown.`
    },
    {
      role: 'user',
      content: `Stima i prezzi di mercato per questi ricambi usati:

Veicolo: ${vehicleData.marca || ''} ${vehicleData.modello || ''}
Anno: ${vehicleData.anno || 'N/D'}
Km: ${vehicleData.km || 'N/D'}

Ricambi:
${ricambiList}

Rispondi con:
{
  "ricambi": [
    {
      "descrizione": "nome ricambio",
      "prezzo_min": 30,
      "prezzo_max": 80,
      "prezzo_consigliato": 55,
      "domanda": "alta|media|bassa",
      "probabilita_vendita": 0.8
    }
  ],
  "totale_valore_stimato": 1500,
  "ricavi_probabili_30gg": 900,
  "suggerimenti_generali": ["Motore ha alta domanda, dare priorità"]
}`
    }
  ];

  try {
    const raw = await callOpenAI({ messages, max_tokens: 3000 });
    const result = parseAIJson(raw);
    logger.info('[VFU AI] Batch pricing:', result.totale_valore_stimato, '€ totale');
    return { success: true, data: result };
  } catch (err) {
    logger.error('[VFU AI] Batch pricing error:', err.message);
    return { success: false, error: err.message };
  }
}

// ═══════════════════════════════════════════════════════════════
// 6. ANOMALY DETECTION E COMPLIANCE MONITOR
// ═══════════════════════════════════════════════════════════════

/**
 * Controlla anomalie e compliance per un caso VFU
 * @param {object} caseData - Dati completi del caso
 * @param {Array} steps - Step di processing con stati
 * @returns {Promise<object>} Report anomalie e compliance
 */
export async function complianceCheck(caseData, steps) {
  logger.info('[VFU AI] Compliance check per caso:', caseData.id?.slice(0, 8));

  const stepsInfo = steps.map(s => 
    `- ${s.step_code}: ${s.status} ${s.started_at ? `(iniziato: ${s.started_at})` : ''} ${s.completed_at ? `(completato: ${s.completed_at})` : ''}`
  ).join('\n');

  const messages = [
    {
      role: 'system',
      content: `Sei un esperto di normativa ambientale italiana specializzato in veicoli fuori uso (VFU).
Conosci perfettamente il D.Lgs 209/2003, le tempistiche obbligatorie, e le procedure RENTRI.
Identifica anomalie, rischi e non conformità.
Rispondi SEMPRE e SOLO con JSON valido, senza markdown.`
    },
    {
      role: 'user',
      content: `Analizza la compliance di questo caso VFU:

Targa: ${caseData.targa || 'N/D'}
Marca/Modello: ${caseData.marca_modello || 'N/D'}
Anno: ${caseData.anno || 'N/D'}
Data accettazione: ${caseData.processing_started_at || 'N/D'}
Peso ingresso: ${caseData.peso_ingresso_kg || 'N/D'} kg
Peso carcassa: ${caseData.peso_carcassa_kg || 'N/D'} kg
FIR creato: ${caseData.fir_rifiuti_id ? 'Sì' : 'No'}
Fattura creata: ${caseData.invoice_draft_id ? 'Sì' : 'No'}
Movimento RENTRI: ${caseData.rentri_movimento_id ? 'Sì' : 'No'}
Certificato rottamazione: ${caseData.certificato_rottamazione_numero || 'Non presente'}

Step processing:
${stepsInfo}

Data odierna: ${new Date().toISOString().split('T')[0]}

{
  "compliance_score": 0.85,
  "anomalie": [
    {
      "tipo": "peso_anomalo|scadenza|documento_mancante|procedura_incompleta",
      "gravita": "critical|high|medium|low",
      "messaggio": "Descrizione chiara del problema",
      "azione_suggerita": "Cosa fare per risolvere",
      "normativa": "D.Lgs 209/2003, Art. X"
    }
  ],
  "scadenze_imminenti": [
    {
      "fase": "bonifica_ambientale",
      "scadenza": "2026-03-03",
      "giorni_rimanenti": 5,
      "urgenza": "alta|media|bassa"
    }
  ],
  "documenti_mancanti": ["certificato rottamazione", "FIR RENTRI"],
  "rischi_sanzioni": [
    {
      "descrizione": "Ritardo bonifica ambientale",
      "sanzione_min": 500,
      "sanzione_max": 2000,
      "probabilita": "media"
    }
  ],
  "suggerimenti": ["Completare bonifica entro ...", "Richiedere certificato PRA"]
}`
    }
  ];

  try {
    const raw = await callOpenAI({ messages, max_tokens: 2000 });
    const result = parseAIJson(raw);
    logger.info('[VFU AI] Compliance score:', result.compliance_score, 'anomalie:', result.anomalie?.length);
    return { success: true, data: result };
  } catch (err) {
    logger.error('[VFU AI] Compliance error:', err.message);
    return { success: false, error: err.message };
  }
}
