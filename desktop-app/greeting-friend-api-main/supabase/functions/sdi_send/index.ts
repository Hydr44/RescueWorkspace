// supabase/functions/sdi_send/index.ts
// Invio fattura a Sistema di Interscambio

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
    const { invoice_id } = await req.json();

    // Validate invoice_id
    if (!invoice_id) {
      throw new Error('invoice_id è richiesto');
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(invoice_id)) {
      throw new Error('Formato ID non valido');
    }

    // Get authorization
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Non autorizzato');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify user authentication
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      throw new Error('Non autorizzato');
    }

    // Get user's organization
    const { data: membership } = await supabase
      .from('memberships')
      .select('org_id')
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      throw new Error('Organizzazione non trovata');
    }

    // 1. Recupera fattura e righe con organization check
    const { data: invoice, error: invError } = await supabase
      .from('invoices')
      .select('*, invoice_items(*)')
      .eq('id', invoice_id)
      .eq('org_id', membership.org_id)
      .single();

    if (invError || !invoice) {
      throw new Error('Fattura non trovata o accesso negato');
    }

    // 2. Genera XML FatturaPA conforme
    const xml = generateFatturaPA(invoice);

    // 3. Firma digitalmente (se configurato)
    // const signedXml = await signXml(xml);

    // 4. Invia a SdI tramite SDICoop o PEC
    // NOTA: Qui andranno le credenziali SdI quando disponibili
    // - Endpoint SDICoop
    // - Certificato digitale
    // - Username/Password
    
    console.log('XML generato:', xml.substring(0, 200));

    // 5. Aggiorna stato fattura
    const { error: updateError } = await supabase
      .from('invoices')
      .update({ 
        sdi_status: 'sent',
        meta: { ...invoice.meta, sent_at: new Date().toISOString() }
      })
      .eq('id', invoice_id);

    if (updateError) throw updateError;

    // 6. Registra evento
    await supabase.from('sdi_events').insert({
      invoice_id,
      event_type: 'Invio',
      payload: { message: 'Fattura inviata a SdI' }
    });

    return new Response(
      JSON.stringify({ success: true, invoice_id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Errore invio SdI:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

// Genera XML FatturaPA 1.2.2 conforme
function generateFatturaPA(invoice: any): string {
  // Sanitize XML content
  const esc = (s: any) => {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  };
  
  const items = invoice.invoice_items || [];
  const rows = items.map((item: any, i: number) => `
    <DettaglioLinee>
      <NumeroLinea>${i + 1}</NumeroLinea>
      <Descrizione>${esc(item.descr)}</Descrizione>
      <Quantita>${Number(item.qty || 0).toFixed(2)}</Quantita>
      <UnitaMisura>PZ</UnitaMisura>
      <PrezzoUnitario>${Number(item.price || 0).toFixed(2)}</PrezzoUnitario>
      <PrezzoTotale>${(Number(item.qty || 0) * Number(item.price || 0)).toFixed(2)}</PrezzoTotale>
      <AliquotaIVA>${Number(item.vat_perc || 22).toFixed(2)}</AliquotaIVA>
    </DettaglioLinee>`).join('');

  const imponibile = items.reduce((sum: number, r: any) => 
    sum + Number(r.qty || 0) * Number(r.price || 0), 0);
  
  const iva = items.reduce((sum: number, r: any) => 
    sum + Number(r.qty || 0) * Number(r.price || 0) * (Number(r.vat_perc || 22) / 100), 0);

  const sdi = invoice.meta?.sdi || {};
  const cedente = sdi.cedente_prestatore || {};
  
  // IdTrasmittente: SEMPRE l'Id Nodo dell'accordo di servizio SDI-SFTP
  // Identifica il soggetto trasmittente (noi, RescueManager), NON il cedente
  const idCodiceTrasmittente = Deno.env.get('SDI_ID_NODO') || '02166430856';
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<p:FatturaElettronica versione="FPR12" xmlns:ds="http://www.w3.org/2000/09/xmldsig#" xmlns:p="http://ivaservizi.agenziaentrate.gov.it/docs/xsd/fatture/v1.2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://ivaservizi.agenziaentrate.gov.it/docs/xsd/fatture/v1.2 http://www.fatturapa.gov.it/export/fatturazione/sdi/fatturapa/v1.2/Schema_del_file_xml_FatturaPA_versione_1.2.xsd">
  <FatturaElettronicaHeader>
    <DatiTrasmissione>
      <IdTrasmittente>
        <IdPaese>IT</IdPaese>
        <IdCodice>${esc(idCodiceTrasmittente)}</IdCodice>
      </IdTrasmittente>
      <ProgressivoInvio>${esc(invoice.number || '00001')}</ProgressivoInvio>
      <FormatoTrasmissione>FPR12</FormatoTrasmissione>
      <CodiceDestinatario>${esc(sdi.trasmissione?.codice_destinatario || '0000000')}</CodiceDestinatario>
      ${sdi.trasmissione?.pec_destinatario ? `<PECDestinatario>${esc(sdi.trasmissione.pec_destinatario)}</PECDestinatario>` : ''}
    </DatiTrasmissione>
    <CedentePrestatore>
      <DatiAnagrafici>
        <IdFiscaleIVA>
          <IdPaese>IT</IdPaese>
          <IdCodice>${esc(cedente.id_fiscale_iva?.id_codice || 'XXXXXXX')}</IdCodice>
        </IdFiscaleIVA>
        ${cedente.codice_fiscale ? `<CodiceFiscale>${esc(cedente.codice_fiscale)}</CodiceFiscale>` : ''}
        <Anagrafica>
          <Denominazione>${esc(cedente.denominazione || 'Da configurare')}</Denominazione>
        </Anagrafica>
        <RegimeFiscale>${esc(cedente.regime_fiscale || 'RF01')}</RegimeFiscale>
      </DatiAnagrafici>
      <Sede>
        <Indirizzo>${esc(cedente.sede?.indirizzo || 'Via')}</Indirizzo>
        <CAP>${esc(cedente.sede?.cap || '00000')}</CAP>
        <Comune>${esc(cedente.sede?.comune || 'Comune')}</Comune>
        <Provincia>${esc(cedente.sede?.provincia || 'XX')}</Provincia>
        <Nazione>IT</Nazione>
      </Sede>
    </CedentePrestatore>
    <CessionarioCommittente>
      <DatiAnagrafici>
        ${invoice.customer_vat ? `<IdFiscaleIVA><IdPaese>IT</IdPaese><IdCodice>${esc(invoice.customer_vat)}</IdCodice></IdFiscaleIVA>` : ''}
        ${invoice.customer_tax_code ? `<CodiceFiscale>${esc(invoice.customer_tax_code)}</CodiceFiscale>` : ''}
        <Anagrafica>
          <Denominazione>${esc(invoice.customer_name || 'Cliente')}</Denominazione>
        </Anagrafica>
      </DatiAnagrafici>
      <Sede>
        <Indirizzo>${esc(invoice.customer_address || 'Via')}</Indirizzo>
        <CAP>00000</CAP>
        <Comune>Comune</Comune>
        <Provincia>XX</Provincia>
        <Nazione>IT</Nazione>
      </Sede>
    </CessionarioCommittente>
  </FatturaElettronicaHeader>
  <FatturaElettronicaBody>
    <DatiGenerali>
      <DatiGeneraliDocumento>
        <TipoDocumento>${esc(sdi.documento?.tipo_documento || 'TD01')}</TipoDocumento>
        <Divisa>${esc(invoice.currency || 'EUR')}</Divisa>
        <Data>${esc(invoice.date || new Date().toISOString().split('T')[0])}</Data>
        <Numero>${esc(invoice.number || '1')}</Numero>
        <ImportoTotaleDocumento>${(imponibile + iva).toFixed(2)}</ImportoTotaleDocumento>
      </DatiGeneraliDocumento>
    </DatiGenerali>
    <DatiBeniServizi>
      ${rows}
      <DatiRiepilogo>
        <AliquotaIVA>22.00</AliquotaIVA>
        <ImponibileImporto>${imponibile.toFixed(2)}</ImponibileImporto>
        <Imposta>${iva.toFixed(2)}</Imposta>
      </DatiRiepilogo>
    </DatiBeniServizi>
    <DatiPagamento>
      <CondizioniPagamento>TP02</CondizioniPagamento>
      <DettaglioPagamento>
        <ModalitaPagamento>${esc(sdi.pagamento?.modalita || 'MP05')}</ModalitaPagamento>
        <ImportoPagamento>${(imponibile + iva).toFixed(2)}</ImportoPagamento>
      </DettaglioPagamento>
    </DatiPagamento>
  </FatturaElettronicaBody>
</p:FatturaElettronica>`;
}
