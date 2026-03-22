// ACI Vehicle Radiation - Radiazione definitiva veicolo presso il PRA
// Endpoint: POST /aci_radiate_vehicle
// Body: { demolition_case_id: string }

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RadiationRequest {
  demolition_case_id: string;
}

interface ACIRadiationResponse {
  protocollo: string;
  data_radiazione: string;
  stato: "completata" | "in_lavorazione" | "rifiutata";
  motivo_rifiuto?: string;
  certificato_radiazione_url?: string;
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
    const body = await req.json() as RadiationRequest;
    if (!body.demolition_case_id) {
      throw new Error('demolition_case_id è obbligatorio');
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(body.demolition_case_id)) {
      throw new Error('Formato ID non valido');
    }

    console.log('Processing radiation for case:', body.demolition_case_id);

    // Get user's organization
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('org_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.org_id) {
      throw new Error('Organizzazione non trovata');
    }

    // Get demolition case from database with organization check
    const { data: demolitionCase, error: dbError } = await supabase
      .from('demolition_cases')
      .select('*')
      .eq('id', body.demolition_case_id)
      .eq('org_id', profile.org_id)
      .single();

    if (dbError || !demolitionCase) {
      throw new Error('Pratica di demolizione non trovata o accesso negato');
    }

    // Validate case is ready for radiation
    if (demolitionCase.stato !== 'documenti' && demolitionCase.stato !== 'inviata') {
      throw new Error('La pratica deve essere nello stato "documenti" o "inviata" per essere radiata');
    }

    // Get ACI credentials
    const aciApiUrl = Deno.env.get('ACI_API_URL') || 'https://api.aci.it/pra/v1';
    const aciApiKey = Deno.env.get('ACI_API_KEY');
    const aciCertCode = Deno.env.get('ACI_CERT');

    if (!aciApiKey || !aciCertCode) {
      console.warn('ACI credentials not configured, returning mock response');
      
      // Mock response per sviluppo
      const mockResponse: ACIRadiationResponse = {
        protocollo: `MOCK-RAD-${Date.now()}`,
        data_radiazione: new Date().toISOString().split('T')[0],
        stato: 'completata',
        certificato_radiazione_url: `https://mock-aci.it/cert/${body.demolition_case_id}`,
        note: 'RADIAZIONE MOCK - Configurare credenziali ACI per radiazione reale'
      };

      // Update demolition case status
      await supabase
        .from('demolition_cases')
        .update({ 
          stato: 'completata',
          meta: {
            ...demolitionCase.meta,
            radiazione: mockResponse
          }
        })
        .eq('id', body.demolition_case_id);

      return new Response(
        JSON.stringify({ success: true, data: mockResponse, mock: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Real ACI radiation API call
    const ownerData = demolitionCase.meta?.owner || {};
    const radiationPayload = {
      targa: demolitionCase.targa,
      telaio: demolitionCase.telaio,
      demolitore: {
        codice_certificazione: aciCertCode,
        tipo_operazione: 'RADIAZIONE_DEMOLIZIONE'
      },
      proprietario: {
        tipo: ownerData.ragione_sociale ? 'PG' : 'PF',
        codice_fiscale: ownerData.cf,
        nome: ownerData.name,
        cognome: ownerData.cognome,
        ragione_sociale: ownerData.ragione_sociale,
        residenza: {
          indirizzo: ownerData.address,
          comune: ownerData.city,
          provincia: ownerData.province,
          cap: ownerData.cap
        }
      },
      documenti: {
        certificato_proprieta: demolitionCase.meta?.docs?.certificato_proprieta,
        carta_circolazione: demolitionCase.meta?.docs?.carta_circolazione,
        attestazione_consegna: demolitionCase.meta?.attestazione_url
      },
      data_demolizione: new Date().toISOString().split('T')[0]
    };

    const aciResponse = await fetch(`${aciApiUrl}/vehicle/radiate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': aciApiKey,
        'X-Cert-Code': aciCertCode,
      },
      body: JSON.stringify(radiationPayload)
    });

    if (!aciResponse.ok) {
      const errorText = await aciResponse.text();
      console.error('ACI radiation API error:', errorText);
      
      // Update case with error
      await supabase
        .from('demolition_cases')
        .update({ 
          stato: 'scartata',
          meta: {
            ...demolitionCase.meta,
            radiazione_error: {
              timestamp: new Date().toISOString(),
              error: errorText
            }
          }
        })
        .eq('id', body.demolition_case_id);

      throw new Error(`Errore ACI: ${aciResponse.status} - ${errorText}`);
    }

    const radiationData = await aciResponse.json() as ACIRadiationResponse;

    // Update demolition case with radiation data
    const newStatus = radiationData.stato === 'completata' ? 'completata' : 'inviata';
    await supabase
      .from('demolition_cases')
      .update({ 
        stato: newStatus,
        meta: {
          ...demolitionCase.meta,
          radiazione: radiationData
        }
      })
      .eq('id', body.demolition_case_id);

    console.log('Radiation completed:', {
      case_id: body.demolition_case_id,
      protocollo: radiationData.protocollo,
      stato: radiationData.stato
    });

    return new Response(
      JSON.stringify({ success: true, data: radiationData, mock: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in aci_radiate_vehicle:', error);
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
