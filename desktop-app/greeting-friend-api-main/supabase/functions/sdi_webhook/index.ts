// supabase/functions/sdi_webhook/index.ts
// Riceve notifiche da Sistema di Interscambio

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    console.log('Webhook SdI ricevuto:', payload);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Gestisce diversi tipi di notifiche SdI:
    // - RicevutaConsegna (RC) - Fattura consegnata con successo
    // - NotificaMancataConsegna (MC) - Errore consegna
    // - NotificaScarto (NS) - Fattura scartata
    // - NotificaEsito (NE) - Esito committente (accettazione/rifiuto)
    // - NotificaDecorrenzaTermini (DT) - Accettazione tacita

    const { tipo_notifica, id_sdi, identificativo_sdi, invoice_number } = payload;

    // Trova fattura per numero o id_sdi
    const { data: invoice } = await supabase
      .from('invoices')
      .select('id')
      .or(`number.eq.${invoice_number},provider_ext_id.eq.${identificativo_sdi}`)
      .single();

    if (!invoice) {
      console.warn('Fattura non trovata:', { invoice_number, identificativo_sdi });
      return new Response(
        JSON.stringify({ error: 'Fattura non trovata' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Registra evento
    await supabase.from('sdi_events').insert({
      invoice_id: invoice.id,
      event_type: tipo_notifica,
      payload: payload
    });

    // Aggiorna stato fattura in base al tipo di notifica
    let newStatus = 'sent';
    
    switch (tipo_notifica) {
      case 'RicevutaConsegna':
      case 'RC':
        newStatus = 'delivered';
        break;
      case 'NotificaScarto':
      case 'NS':
        newStatus = 'rejected';
        break;
      case 'NotificaEsito':
      case 'NE':
        // Verifica esito committente
        newStatus = payload.esito === 'accettato' ? 'delivered' : 'rejected';
        break;
      case 'NotificaDecorrenzaTermini':
      case 'DT':
        newStatus = 'delivered'; // Accettazione tacita
        break;
    }

    await supabase
      .from('invoices')
      .update({ 
        sdi_status: newStatus,
        provider_ext_id: identificativo_sdi || id_sdi,
        meta: { 
          sdi_notification: payload,
          updated_at: new Date().toISOString()
        }
      })
      .eq('id', invoice.id);

    console.log('Stato fattura aggiornato:', { invoice_id: invoice.id, newStatus });

    return new Response(
      JSON.stringify({ success: true, invoice_id: invoice.id, new_status: newStatus }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Errore webhook SdI:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
