/**
 * Sistema IA per generazione descrizioni aftermarket accattivanti
 * Usa OpenAI GPT per creare descrizioni ottimizzate per vendita
 */

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

/**
 * Genera descrizione aftermarket con IA
 * @param {object} partData - Dati ricambio da TecDoc
 * @returns {Promise<object>} {title, description, keywords, features}
 */
export async function generateAftermarketDescription(partData) {
  if (!OPENAI_API_KEY) {
    console.warn('[AI] OpenAI API key not configured');
    return generateFallbackDescription(partData);
  }

  const compatibleVehicles = partData.compatible_vehicles?.slice(0, 5).map(v => 
    `${v.manufacturerName || v.make} ${v.modelName || v.model} ${v.typeEngineName || v.type || ''}`
  ).join(', ') || 'Vari modelli auto';

  const prompt = `Sei un esperto di ricambi auto aftermarket per autodemolizioni. Crea una descrizione DETTAGLIATA e SPECIFICA per questo ricambio USATO:

DATI RICAMBIO:
- Nome tecnico: ${partData.name}
- Marca originale: ${partData.brand || 'OEM'}
- Codice OEM: ${partData.oem_code}
- Descrizione tecnica: ${partData.description || 'Ricambio auto usato originale'}
- Compatibilità verificata: ${compatibleVehicles}

GENERA in formato JSON (IMPORTANTE: solo JSON puro, senza markdown):
{
  "title": "Titolo specifico 60-80 caratteri con marca, nome parte e codice OEM",
  "description": "Descrizione dettagliata 250-350 parole che include: tipo di ricambio, marca originale, codice OEM, compatibilità veicoli, condizioni (usato garantito), caratteristiche tecniche specifiche, vantaggi rispetto al nuovo (prezzo), garanzia qualità autodemolizione",
  "keywords": ["nome parte", "marca", "codice OEM", "modelli compatibili", "ricambio usato"],
  "features": ["Ricambio originale usato garantito", "Testato e funzionante", "Compatibile con [modelli specifici]", "Codice OEM ${partData.oem_code}", "Pronto per installazione"]
}

REGOLE CRITICHE:
- Usa il nome ESATTO del ricambio (${partData.name})
- Menziona SEMPRE il codice OEM (${partData.oem_code})
- Specifica che è USATO ma GARANTITO
- Elenca modelli compatibili SPECIFICI
- Descrizione DETTAGLIATA e TECNICA
- Ottimizza per ricerca eBay/Subito
- NON usare frasi generiche
- SOLO JSON puro, niente markdown`;

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'Sei un esperto copywriter per ricambi auto aftermarket.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content in OpenAI response');
    }

    // Remove markdown code blocks if present (```json ... ```)
    const cleanContent = content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    
    // Parse JSON response
    const result = JSON.parse(cleanContent);
    
    console.log('[AI] Generated description:', result.title);
    return result;

  } catch (error) {
    console.error('[AI] Error generating description:', error);
    return generateFallbackDescription(partData);
  }
}

/**
 * Genera descrizione fallback senza IA
 */
function generateFallbackDescription(partData) {
  const title = `${partData.brand || 'Ricambio'} ${partData.name} - ${partData.oem_code}`;
  
  const description = `
${partData.name}

Codice OEM: ${partData.oem_code}
${partData.brand ? `Marca: ${partData.brand}` : ''}
${partData.ean_code ? `EAN: ${partData.ean_code}` : ''}

${partData.description || 'Ricambio di qualità compatibile con vari modelli.'}

${partData.compatible_vehicles?.length > 0 ? `
Compatibile con:
${partData.compatible_vehicles.slice(0, 5).map(v => `- ${v.manufacturerName} ${v.modelName} ${v.typeEngineName || ''}`).join('\n')}
${partData.compatible_vehicles.length > 5 ? '...e altri modelli' : ''}
` : ''}

Ricambio usato garantito, testato e pronto per l'installazione.
  `.trim();

  return {
    title: title.substring(0, 80),
    description,
    keywords: [
      partData.name?.split(' ')[0],
      partData.brand,
      partData.oem_code,
      'ricambio',
      'auto',
    ].filter(Boolean),
    features: [
      'Ricambio originale usato',
      'Testato e garantito',
      'Pronto per l\'installazione',
      partData.compatible_vehicles?.length > 0 ? 'Compatibilità verificata' : null,
    ].filter(Boolean),
  };
}

export default {
  generateAftermarketDescription,
};
