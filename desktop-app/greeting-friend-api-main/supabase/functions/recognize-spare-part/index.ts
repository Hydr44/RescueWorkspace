import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!openAIApiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    const { code, type, vehicleInfo } = await req.json();
    
    if (!code) {
      return new Response(
        JSON.stringify({ error: 'Code is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Recognizing spare part:', { code, type, vehicleInfo });

    // Prompt AI per riconoscimento ricambio
    const prompt = `Analizza questo codice ricambio auto e fornisci informazioni strutturate.

Codice: ${code}
Tipo: ${type || 'OEM/Generico'}
${vehicleInfo ? `Info veicolo: ${vehicleInfo}` : ''}

Rispondi SOLO con un oggetto JSON valido nel formato:
{
  "name": "Nome ricambio italiano",
  "description": "Descrizione breve",
  "category": "Codice categoria (ENG|TRX|SUS|BRK|BODY|INT|ELEC|LIGHT|TIRE|OTHER)",
  "manufacturer": "Marca costruttore se identificabile",
  "compatibility": ["Modelli compatibili"],
  "notes": "Note aggiuntive su compatibilità",
  "confidence": 0.95,
  "price_estimate_min": 50,
  "price_estimate_max": 150
}

Se il codice non è riconoscibile, imposta confidence < 0.5 e fornisci suggerimenti generici.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: 'Sei un esperto di ricambi auto. Rispondi SEMPRE e SOLO con JSON valido, senza markdown o testo aggiuntivo.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 800,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI API error:', error);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content.trim();
    
    console.log('AI raw response:', aiResponse);

    // Parse JSON dalla risposta (rimuovi markdown se presente)
    let partInfo;
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      partInfo = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(aiResponse);
    } catch (e) {
      console.error('JSON parse error:', e, 'Response:', aiResponse);
      throw new Error('Failed to parse AI response');
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        part: partInfo,
        original_code: code,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in recognize-spare-part:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
