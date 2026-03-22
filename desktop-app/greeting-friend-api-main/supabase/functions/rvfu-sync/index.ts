// supabase/functions/rvfu-sync/index.ts
// Edge Function per sincronizzazione con RVFU

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RVFUConfig {
  baseUrl: string;
  apiKey?: string;
  timeout?: number;
}

interface DemolitionCase {
  id: string;
  org_id: string;
  targa: string;
  telaio: string;
  marca_modello: string;
  meta: any;
}

interface RVFUResponse<T = any> {
  esito: {
    code: string;
    message: string;
    responseStatus: 'OK' | 'KO';
  };
  result: T;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get user from JWT
    const {
      data: { user },
    } = await supabaseClient.auth.getUser()

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { demolitionCaseId, operation } = await req.json()

    if (!demolitionCaseId) {
      return new Response(
        JSON.stringify({ error: 'demolitionCaseId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get demolition case
    const { data: demolitionCase, error: demolitionError } = await supabaseClient
      .from('demolition_cases')
      .select('*')
      .eq('id', demolitionCaseId)
      .eq('org_id', user.user_metadata.org_id)
      .single()

    if (demolitionError || !demolitionCase) {
      return new Response(
        JSON.stringify({ error: 'Demolition case not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get RVFU configuration for organization
    const { data: rvfuConfig, error: configError } = await supabaseClient
      .from('rvfu_configurations')
      .select('*')
      .eq('org_id', user.user_metadata.org_id)
      .eq('is_active', true)
      .single()

    if (configError || !rvfuConfig) {
      return new Response(
        JSON.stringify({ error: 'RVFU configuration not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Log operation start
    const { error: logError } = await supabaseClient
      .from('rvfu_operation_logs')
      .insert({
        demolition_case_id: demolitionCaseId,
        operation_type: operation || 'SYNC',
        operation_status: 'PENDING',
        request_data: { demolitionCase, operation }
      })

    if (logError) {
      console.error('Failed to log operation:', logError)
    }

    let result;

    switch (operation) {
      case 'SEARCH_VEHICLE':
        result = await searchVehicle(demolitionCase, rvfuConfig)
        break
      case 'CREATE_VFU':
        result = await createVFU(demolitionCase, rvfuConfig)
        break
      case 'UPDATE_VFU':
        result = await updateVFU(demolitionCase, rvfuConfig)
        break
      case 'SYNC':
      default:
        result = await syncWithRVFU(demolitionCase, rvfuConfig)
        break
    }

    // Update demolition case with RVFU data
    if (result.success && result.data) {
      const updatedMeta = {
        ...demolitionCase.meta,
        rvfu: {
          id: result.data.idVFU,
          status: result.data.statoVfuEnum,
          sync_date: new Date().toISOString(),
          communication_id: `RVFU-${result.data.idVFU}`,
          error: null
        }
      }

      const { error: updateError } = await supabaseClient
        .from('demolition_cases')
        .update({ meta: updatedMeta })
        .eq('id', demolitionCaseId)

      if (updateError) {
        console.error('Failed to update demolition case:', updateError)
      }
    }

    // Log operation result
    await supabaseClient
      .from('rvfu_operation_logs')
      .insert({
        demolition_case_id: demolitionCaseId,
        rvfu_id: result.data?.idVFU,
        operation_type: operation || 'SYNC',
        operation_status: result.success ? 'SUCCESS' : 'ERROR',
        response_data: result.data,
        error_message: result.error
      })

    return new Response(
      JSON.stringify(result),
      { 
        status: result.success ? 200 : 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('RVFU sync error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        data: null 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

async function searchVehicle(demolitionCase: DemolitionCase, config: RVFUConfig): Promise<any> {
  try {
    const response = await fetch(`${config.baseUrl}/rest/cr/veicolo`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        targa: demolitionCase.targa,
        telaio: demolitionCase.telaio,
        tipoVeicolo: 'A', // Default per autoveicolo
        causale: 'ROTTAMAZIONE'
      })
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const result: RVFUResponse = await response.json()

    if (result.esito.responseStatus === 'KO') {
      return {
        success: false,
        error: result.esito.message,
        data: null
      }
    }

    return {
      success: true,
      data: result.result,
      error: null
    }

  } catch (error) {
    return {
      success: false,
      error: error.message,
      data: null
    }
  }
}

async function createVFU(demolitionCase: DemolitionCase, config: RVFUConfig): Promise<any> {
  try {
    // Estrai dati dal meta per costruire il payload VFU
    const meta = demolitionCase.meta || {}
    const owner = meta.owner || {}

    const vfuPayload = {
      targa: demolitionCase.targa,
      telaio: demolitionCase.telaio,
      tipoVeicolo: 'A', // Default per autoveicolo
      flagConsegnaForzeOrdine: 'N',
      intestatario: {
        codiceFiscale: owner.cf || '',
        cognome: owner.name?.split(' ')[0] || '',
        nome: owner.name?.split(' ').slice(1).join(' ') || '',
        dataNascita: owner.birth_date || '',
        codiceComuneNascita: '001', // Default Torino
        codiceProvinciaNascita: 'TO',
        codiceComuneResidenza: '001', // Default Torino
        codiceProvinciaResidenza: 'TO',
        indirizzoResidenza: owner.address || '',
        capResidenza: owner.cap || '',
        tipoPersonaGiuridica: 'PF'
      },
      distinta: {
        du: 'ASSENTE',
        cdc: 'ASSENTE',
        cdp: 'ASSENTE',
        foglioC: 'ASSENTE',
        documentoIntestatario: false,
        documentoDetentore: false,
        targaAnteriore: false,
        targaPosteriore: false,
        targaDenuncia: false
      },
      noteAggiuntive: `Demolizione: ${demolitionCase.marca_modello}`,
      notePartiRifiuti: ''
    }

    const response = await fetch(`${config.baseUrl}/rest/concessionario/VFU`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify(vfuPayload)
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const result: RVFUResponse = await response.json()

    if (result.esito.responseStatus === 'KO') {
      return {
        success: false,
        error: result.esito.message,
        data: null
      }
    }

    return {
      success: true,
      data: result.result,
      error: null
    }

  } catch (error) {
    return {
      success: false,
      error: error.message,
      data: null
    }
  }
}

async function updateVFU(demolitionCase: DemolitionCase, config: RVFUConfig): Promise<any> {
  try {
    const rvfuId = demolitionCase.meta?.rvfu?.id

    if (!rvfuId) {
      return {
        success: false,
        error: 'RVFU ID not found in demolition case',
        data: null
      }
    }

    const updatePayload = {
      noteAggiuntive: `Aggiornamento demolizione: ${demolitionCase.marca_modello}`,
      notePartiRifiuti: ''
    }

    const response = await fetch(`${config.baseUrl}/rest/cr/VFU/${rvfuId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify(updatePayload)
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const result: RVFUResponse = await response.json()

    if (result.esito.responseStatus === 'KO') {
      return {
        success: false,
        error: result.esito.message,
        data: null
      }
    }

    return {
      success: true,
      data: result.result,
      error: null
    }

  } catch (error) {
    return {
      success: false,
      error: error.message,
      data: null
    }
  }
}

async function syncWithRVFU(demolitionCase: DemolitionCase, config: RVFUConfig): Promise<any> {
  // Prima cerca il veicolo
  const searchResult = await searchVehicle(demolitionCase, config)
  
  if (searchResult.success) {
    return searchResult
  }

  // Se non trovato, prova a crearlo
  return await createVFU(demolitionCase, config)
}
