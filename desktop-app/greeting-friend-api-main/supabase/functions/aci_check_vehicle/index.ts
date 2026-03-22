// ACI Vehicle Check - Verifica dati veicolo presso il Pubblico Registro Automobilistico (PRA)
// Endpoint: POST /aci_check_vehicle
// Body: { targa: string, telaio?: string }

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VehicleCheckRequest {
  targa: string;
  telaio?: string;
}

interface ACIVehicleData {
  targa: string;
  telaio: string;
  marca: string;
  modello: string;
  anno_immatricolazione: number;
  alimentazione: string;
  cilindrata: string;
  kw: number;
  posti: number;
  massa: number;
  proprietario: {
    tipo: "PF" | "PG"; // Persona Fisica / Giuridica
    nome?: string;
    cognome?: string;
    ragione_sociale?: string;
    codice_fiscale: string;
    residenza: {
      indirizzo: string;
      comune: string;
      provincia: string;
      cap: string;
    };
  };
  stato_veicolo: "attivo" | "radiato" | "sospeso" | "rubato" | "fermo_amministrativo";
  data_ultima_revisione?: string;
  gravami: Array<{
    tipo: string;
    descrizione: string;
    data: string;
  }>;
  note?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authorization
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    // Parse request
    const body = await req.json() as VehicleCheckRequest;
    
    // Input validation
    if (!body.targa) {
      throw new Error('Targa è obbligatoria');
    }
    if (body.targa.length < 5 || body.targa.length > 10) {
      throw new Error('Formato targa non valido');
    }
    if (!/^[A-Z0-9]+$/i.test(body.targa)) {
      throw new Error('La targa può contenere solo lettere e numeri');
    }
    if (body.telaio && (body.telaio.length > 17 || !/^[A-HJ-NPR-Z0-9]+$/i.test(body.telaio))) {
      throw new Error('Formato telaio non valido');
    }

    console.log('Checking vehicle:', body.targa);

    // Get ACI credentials from secrets
    const aciApiUrl = Deno.env.get('ACI_API_URL') || 'https://api.aci.it/pra/v1';
    const aciApiKey = Deno.env.get('ACI_API_KEY');
    const aciCertCode = Deno.env.get('ACI_CERT'); // Codice certificazione demolitore

    if (!aciApiKey || !aciCertCode) {
      console.warn('ACI credentials not configured, returning mock data');
      
      // Mock response per sviluppo
      const mockResponse: ACIVehicleData = {
        targa: body.targa,
        telaio: body.telaio || 'WVWZZZ1KZXW000001',
        marca: 'VOLKSWAGEN',
        modello: 'GOLF 1.6 TDI',
        anno_immatricolazione: 2018,
        alimentazione: 'GASOLIO',
        cilindrata: '1598',
        kw: 85,
        posti: 5,
        massa: 1420,
        proprietario: {
          tipo: 'PF',
          nome: 'MARIO',
          cognome: 'ROSSI',
          codice_fiscale: 'RSSMRA80A01H501U',
          residenza: {
            indirizzo: 'VIA ROMA 123',
            comune: 'ROMA',
            provincia: 'RM',
            cap: '00100'
          }
        },
        stato_veicolo: 'attivo',
        data_ultima_revisione: '2023-03-15',
        gravami: [],
        note: 'DATI MOCK - Configurare credenziali ACI per dati reali'
      };

      return new Response(
        JSON.stringify({ success: true, data: mockResponse, mock: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Real ACI API call
    const aciResponse = await fetch(`${aciApiUrl}/vehicle/check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': aciApiKey,
        'X-Cert-Code': aciCertCode,
      },
      body: JSON.stringify({
        targa: body.targa.toUpperCase(),
        telaio: body.telaio?.toUpperCase(),
        richiedente: {
          codice_certificazione: aciCertCode,
          tipo_operazione: 'VERIFICA_PRELIMINARE'
        }
      })
    });

    if (!aciResponse.ok) {
      const errorText = await aciResponse.text();
      console.error('ACI API error:', errorText);
      throw new Error(`Errore ACI: ${aciResponse.status} - ${errorText}`);
    }

    const aciData = await aciResponse.json() as ACIVehicleData;

    // Log the check
    console.log('Vehicle check completed:', {
      targa: body.targa,
      stato: aciData.stato_veicolo,
      gravami: aciData.gravami.length
    });

    return new Response(
      JSON.stringify({ success: true, data: aciData, mock: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in aci_check_vehicle:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Internal server error' 
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
