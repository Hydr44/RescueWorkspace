// Transport Portal Notification - Notifica al Portale del Trasporto
// Endpoint: POST /transport_portal_notify
// Body: { demolition_case_id: string, transport_id?: string }

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TransportNotifyRequest {
  demolition_case_id: string;
  transport_id?: string;
}

interface TransportPortalResponse {
  protocollo: string;
  data_notifica: string;
  stato: "accettata" | "rifiutata";
  motivo_rifiuto?: string;
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
    const body = await req.json() as TransportNotifyRequest;
    if (!body.demolition_case_id) {
      throw new Error('demolition_case_id è obbligatorio');
    }

    console.log('Notifying transport portal for case:', body.demolition_case_id);

    // Get demolition case
    const { data: demolitionCase, error: dbError } = await supabase
      .from('demolition_cases')
      .select('*')
      .eq('id', body.demolition_case_id)
      .single();

    if (dbError || !demolitionCase) {
      throw new Error('Pratica di demolizione non trovata');
    }

    // Get transport data if transport_id is provided
    let transportData = null;
    if (body.transport_id || demolitionCase.transport_id) {
      const { data } = await supabase
        .from('transports')
        .select('*')
        .eq('id', body.transport_id || demolitionCase.transport_id)
        .single();
      transportData = data;
    }

    // Get portal credentials
    const portalUrl = Deno.env.get('TRANSPORT_PORTAL_URL') || 'https://portale.trasporti.gov.it/api/v1';
    const portalKey = Deno.env.get('TRANSPORT_PORTAL_KEY');

    if (!portalKey) {
      console.warn('Transport portal credentials not configured, returning mock response');
      
      // Mock response per sviluppo
      const mockResponse: TransportPortalResponse = {
        protocollo: `MOCK-TRANSP-${Date.now()}`,
        data_notifica: new Date().toISOString().split('T')[0],
        stato: 'accettata',
        note: 'NOTIFICA MOCK - Configurare credenziali Portale Trasporti per notifica reale'
      };

      // Update demolition case
      await supabase
        .from('demolition_cases')
        .update({ 
          meta: {
            ...demolitionCase.meta,
            transport_notification: mockResponse
          }
        })
        .eq('id', body.demolition_case_id);

      return new Response(
        JSON.stringify({ success: true, data: mockResponse, mock: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Real Transport Portal API call
    const notificationPayload = {
      tipo_operazione: 'DEMOLIZIONE_VEICOLO',
      veicolo: {
        targa: demolitionCase.targa,
        telaio: demolitionCase.telaio,
        marca_modello: demolitionCase.marca_modello
      },
      demolitore: {
        // Dati del demolitore certificato
        codice_operatore: portalKey
      },
      trasporto: transportData ? {
        data: transportData.orario,
        origine: transportData.pickup_address,
        destinazione: transportData.dropoff_address,
        autista: transportData.autista
      } : null,
      data_operazione: new Date().toISOString().split('T')[0]
    };

    const portalResponse = await fetch(`${portalUrl}/notifications/demolition`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': portalKey,
      },
      body: JSON.stringify(notificationPayload)
    });

    if (!portalResponse.ok) {
      const errorText = await portalResponse.text();
      console.error('Transport portal API error:', errorText);
      
      // Update case with error
      await supabase
        .from('demolition_cases')
        .update({ 
          meta: {
            ...demolitionCase.meta,
            transport_notification_error: {
              timestamp: new Date().toISOString(),
              error: errorText
            }
          }
        })
        .eq('id', body.demolition_case_id);

      throw new Error(`Errore Portale Trasporti: ${portalResponse.status} - ${errorText}`);
    }

    const notificationData = await portalResponse.json() as TransportPortalResponse;

    // Update demolition case
    await supabase
      .from('demolition_cases')
      .update({ 
        meta: {
          ...demolitionCase.meta,
          transport_notification: notificationData
        }
      })
      .eq('id', body.demolition_case_id);

    console.log('Transport notification completed:', {
      case_id: body.demolition_case_id,
      protocollo: notificationData.protocollo,
      stato: notificationData.stato
    });

    return new Response(
      JSON.stringify({ success: true, data: notificationData, mock: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in transport_portal_notify:', error);
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
