// supabase/functions/rvfu-documents/index.ts
// Edge Function per gestione documenti RVFU

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DocumentUpload {
  demolitionCaseId: string;
  rvfuId: number;
  documentType: string;
  fileName: string;
  fileData: string; // base64
  fileExtension: string;
}

interface DocumentDownload {
  demolitionCaseId: string;
  documentId: number;
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

    const { action, ...params } = await req.json()

    switch (action) {
      case 'upload':
        return await handleDocumentUpload(supabaseClient, user, params as DocumentUpload)
      case 'download':
        return await handleDocumentDownload(supabaseClient, user, params as DocumentDownload)
      case 'list':
        return await handleDocumentList(supabaseClient, user, params)
      case 'delete':
        return await handleDocumentDelete(supabaseClient, user, params)
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

  } catch (error) {
    console.error('RVFU documents error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

async function handleDocumentUpload(
  supabaseClient: any, 
  user: any, 
  params: DocumentUpload
): Promise<Response> {
  try {
    const { demolitionCaseId, rvfuId, documentType, fileName, fileData, fileExtension } = params

    // Verify demolition case belongs to user's org
    const { data: demolitionCase, error: demolitionError } = await supabaseClient
      .from('demolition_cases')
      .select('id, org_id')
      .eq('id', demolitionCaseId)
      .eq('org_id', user.user_metadata.org_id)
      .single()

    if (demolitionError || !demolitionCase) {
      return new Response(
        JSON.stringify({ error: 'Demolition case not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get RVFU configuration
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

    // Upload document to RVFU
    const documentPayload = {
      tipoDocumento: documentType,
      file: fileData,
      fileName: fileName,
      ext: fileExtension,
      dataEmissioneDocumento: new Date().toISOString().split('T')[0],
      enteEmissioneDocumento: 'RescueManager',
      noteAggiuntive: `Documento caricato da RescueManager per demolizione ${demolitionCaseId}`
    }

    const rvfuResponse = await fetch(`${rvfuConfig.rvfu_base_url}/rest/cr/allega/documentoVFU/${rvfuId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${rvfuConfig.rvfu_api_key}`,
      },
      body: JSON.stringify(documentPayload)
    })

    if (!rvfuResponse.ok) {
      throw new Error(`RVFU upload failed: ${rvfuResponse.status} ${rvfuResponse.statusText}`)
    }

    const rvfuResult = await rvfuResponse.json()

    if (rvfuResult.esito.responseStatus === 'KO') {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: rvfuResult.esito.message 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Save document metadata to database
    const { data: documentRecord, error: insertError } = await supabaseClient
      .from('rvfu_documents')
      .insert({
        demolition_case_id: demolitionCaseId,
        rvfu_id: rvfuId,
        document_type: documentType,
        document_name: fileName,
        document_data: fileData,
        document_status: 'FIRMATO'
      })
      .select()
      .single()

    if (insertError) {
      console.error('Failed to save document metadata:', insertError)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: rvfuResult.result,
        documentId: documentRecord?.id 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}

async function handleDocumentDownload(
  supabaseClient: any, 
  user: any, 
  params: DocumentDownload
): Promise<Response> {
  try {
    const { demolitionCaseId, documentId } = params

    // Verify demolition case belongs to user's org
    const { data: demolitionCase, error: demolitionError } = await supabaseClient
      .from('demolition_cases')
      .select('id, org_id')
      .eq('id', demolitionCaseId)
      .eq('org_id', user.user_metadata.org_id)
      .single()

    if (demolitionError || !demolitionCase) {
      return new Response(
        JSON.stringify({ error: 'Demolition case not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get document from database
    const { data: document, error: documentError } = await supabaseClient
      .from('rvfu_documents')
      .select('*')
      .eq('id', documentId)
      .eq('demolition_case_id', demolitionCaseId)
      .single()

    if (documentError || !document) {
      return new Response(
        JSON.stringify({ error: 'Document not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: {
          id: document.id,
          documentType: document.document_type,
          fileName: document.document_name,
          fileData: document.document_data,
          status: document.document_status,
          createdAt: document.created_at
        }
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}

async function handleDocumentList(
  supabaseClient: any, 
  user: any, 
  params: { demolitionCaseId: string }
): Promise<Response> {
  try {
    const { demolitionCaseId } = params

    // Verify demolition case belongs to user's org
    const { data: demolitionCase, error: demolitionError } = await supabaseClient
      .from('demolition_cases')
      .select('id, org_id')
      .eq('id', demolitionCaseId)
      .eq('org_id', user.user_metadata.org_id)
      .single()

    if (demolitionError || !demolitionCase) {
      return new Response(
        JSON.stringify({ error: 'Demolition case not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get documents from database
    const { data: documents, error: documentsError } = await supabaseClient
      .from('rvfu_documents')
      .select('*')
      .eq('demolition_case_id', demolitionCaseId)
      .order('created_at', { ascending: false })

    if (documentsError) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch documents' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: documents.map(doc => ({
          id: doc.id,
          documentType: doc.document_type,
          fileName: doc.document_name,
          status: doc.document_status,
          createdAt: doc.created_at,
          updatedAt: doc.updated_at
        }))
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}

async function handleDocumentDelete(
  supabaseClient: any, 
  user: any, 
  params: { demolitionCaseId: string; documentId: string }
): Promise<Response> {
  try {
    const { demolitionCaseId, documentId } = params

    // Verify demolition case belongs to user's org
    const { data: demolitionCase, error: demolitionError } = await supabaseClient
      .from('demolition_cases')
      .select('id, org_id')
      .eq('id', demolitionCaseId)
      .eq('org_id', user.user_metadata.org_id)
      .single()

    if (demolitionError || !demolitionCase) {
      return new Response(
        JSON.stringify({ error: 'Demolition case not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Delete document from database
    const { error: deleteError } = await supabaseClient
      .from('rvfu_documents')
      .delete()
      .eq('id', documentId)
      .eq('demolition_case_id', demolitionCaseId)

    if (deleteError) {
      return new Response(
        JSON.stringify({ error: 'Failed to delete document' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Document deleted successfully' 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}
