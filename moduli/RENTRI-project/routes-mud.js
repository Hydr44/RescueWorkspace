/**
 * Routes per API MUD (Modello Unico Dichiarazione)
 * Gestione dichiarazioni annuali rifiuti per autodemolitori
 */

const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

/**
 * GET /api/rentri/mud
 * Lista MUD per organizzazione/anno
 */
router.get('/mud', async (req, res) => {
  try {
    const { org_id, anno } = req.query;
    if (!org_id) return res.status(400).json({ error: 'org_id richiesto' });

    let query = supabase
      .from('rentri_mud')
      .select('*')
      .eq('org_id', org_id)
      .order('anno', { ascending: false })
      .order('created_at', { ascending: false });

    if (anno) query = query.eq('anno', parseInt(anno));

    const { data, error } = await query;
    if (error) {
      console.error('[RENTRI-MUD] Errore lettura:', error);
      return res.status(500).json({ error: 'Errore lettura MUD', details: error.message });
    }

    res.json({ success: true, mud: data || [], count: (data || []).length });
  } catch (error) {
    console.error('[RENTRI-MUD] Errore:', error);
    res.status(500).json({ error: 'Errore interno', details: error.message });
  }
});

/**
 * POST /api/rentri/mud
 * Genera nuovo MUD aggregando movimenti, registri e formulari
 */
router.post('/mud', async (req, res) => {
  try {
    const { org_id, anno, data_inizio, data_fine } = req.body;
    if (!org_id || !anno) return res.status(400).json({ error: 'org_id e anno richiesti' });

    const annoInt = parseInt(anno);
    const dInizio = data_inizio || (annoInt + '-01-01');
    const dFine = data_fine || (annoInt + '-12-31');

    // Verifica se MUD per questo anno esiste già
    const { data: existing } = await supabase
      .from('rentri_mud')
      .select('id')
      .eq('org_id', org_id)
      .eq('anno', annoInt)
      .maybeSingle();

    if (existing) {
      return res.status(409).json({
        error: 'MUD per questo anno già esistente. Eliminalo prima di rigenerare.',
        mud_id: existing.id
      });
    }

    // 1. Conta registri attivi per l'anno
    const { data: registri } = await supabase
      .from('rentri_registri')
      .select('id, anno, tipo, numero_registro')
      .eq('org_id', org_id)
      .eq('anno', annoInt);

    // 2. Conta movimenti nel periodo
    const { data: movimenti } = await supabase
      .from('rentri_movimenti')
      .select('id, tipo_operazione, codice_eer, descrizione, quantita, unita_misura')
      .eq('org_id', org_id)
      .gte('data_operazione', dInizio)
      .lte('data_operazione', dFine);

    // 3. Conta formulari nel periodo
    const { data: formulari } = await supabase
      .from('rentri_formulari')
      .select('id')
      .eq('org_id', org_id)
      .gte('data_creazione', dInizio)
      .lte('data_creazione', dFine);

    const totaleRegistri = (registri || []).length;
    const totaleMovimenti = (movimenti || []).length;
    const totaleFormulari = (formulari || []).length;

    // 4. Calcola totale quantità (normalizza tutto in kg)
    let totaleQuantita = 0;
    (movimenti || []).forEach(function(m) {
      let q = parseFloat(m.quantita) || 0;
      if (m.unita_misura === 't') q *= 1000;
      if (m.unita_misura === 'l') q *= 1;
      totaleQuantita += q;
    });

    // 5. Riepilogo per codice EER
    const eerMap = {};
    (movimenti || []).forEach(function(m) {
      const codice = m.codice_eer || 'SCONOSCIUTO';
      if (!eerMap[codice]) {
        eerMap[codice] = { codice: codice, descrizione: m.descrizione || '', carico: 0, scarico: 0 };
      }
      let q = parseFloat(m.quantita) || 0;
      if (m.unita_misura === 't') q *= 1000;
      if (m.tipo_operazione === 'carico') {
        eerMap[codice].carico += q;
      } else {
        eerMap[codice].scarico += q;
      }
    });
    const riepilogoEer = Object.values(eerMap).sort(function(a, b) {
      return a.codice.localeCompare(b.codice);
    });

    // 6. Inserisci MUD
    const { data: mud, error: insertErr } = await supabase
      .from('rentri_mud')
      .insert({
        org_id: org_id,
        anno: annoInt,
        data_inizio: dInizio,
        data_fine: dFine,
        stato: 'bozza',
        totale_registri: totaleRegistri,
        totale_movimenti: totaleMovimenti,
        totale_formulari: totaleFormulari,
        totale_quantita: totaleQuantita,
        riepilogo_eer: riepilogoEer,
      })
      .select()
      .single();

    if (insertErr) {
      console.error('[RENTRI-MUD] Errore inserimento:', insertErr);
      return res.status(500).json({ error: 'Errore creazione MUD', details: insertErr.message });
    }

    console.log('[RENTRI-MUD] MUD generato:', {
      id: mud.id, anno: annoInt,
      movimenti: totaleMovimenti, registri: totaleRegistri,
      formulari: totaleFormulari, kg: totaleQuantita.toFixed(2)
    });

    res.json({
      success: true,
      mud: mud,
      aggregazione: {
        movimenti: totaleMovimenti,
        registri: totaleRegistri,
        formulari: totaleFormulari,
        totale_quantita: totaleQuantita,
        codici_eer: riepilogoEer.length,
      }
    });
  } catch (error) {
    console.error('[RENTRI-MUD] Errore generazione:', error);
    res.status(500).json({ error: 'Errore generazione MUD', details: error.message });
  }
});

/**
 * POST /api/rentri/mud/:id?action=generate-xml|generate-pdf
 * Genera XML o PDF/HTML per il MUD
 */
router.post('/mud/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const action = req.query.action;

    const { data: mud, error: mudErr } = await supabase
      .from('rentri_mud')
      .select('*')
      .eq('id', id)
      .single();

    if (mudErr || !mud) return res.status(404).json({ error: 'MUD non trovato' });

    const { data: org } = await supabase
      .from('organizations')
      .select('name, piva, codice_fiscale, indirizzo, comune, provincia, cap, pec')
      .eq('id', mud.org_id)
      .single();

    if (action === 'generate-xml') {
      const xml = generateMudXML(mud, org);
      const xmlBase64 = Buffer.from(xml, 'utf-8').toString('base64');
      return res.json({
        success: true,
        xml: xmlBase64,
        filename: 'MUD_' + mud.anno + '_' + (org && org.piva ? org.piva : 'ORG') + '.xml'
      });
    }

    if (action === 'generate-pdf') {
      const html = generateMudHTML(mud, org);
      const htmlBase64 = Buffer.from(html, 'utf-8').toString('base64');
      return res.json({
        success: true,
        html: htmlBase64,
        filename: 'MUD_' + mud.anno + '_' + (org && org.piva ? org.piva : 'ORG') + '.html'
      });
    }

    return res.status(400).json({ error: 'action richiesta: generate-xml o generate-pdf' });
  } catch (error) {
    console.error('[RENTRI-MUD] Errore export:', error);
    res.status(500).json({ error: 'Errore export MUD', details: error.message });
  }
});

/**
 * DELETE /api/rentri/mud/:id
 * Elimina MUD
 */
router.delete('/mud/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { org_id } = req.body;
    if (!org_id) return res.status(400).json({ error: 'org_id richiesto' });

    const { data: mud } = await supabase
      .from('rentri_mud')
      .select('id, stato')
      .eq('id', id)
      .eq('org_id', org_id)
      .single();

    if (!mud) return res.status(404).json({ error: 'MUD non trovato' });
    if (mud.stato === 'trasmesso' || mud.stato === 'accettato') {
      return res.status(400).json({ error: 'Impossibile eliminare un MUD già trasmesso/accettato' });
    }

    const { error } = await supabase.from('rentri_mud').delete().eq('id', id);
    if (error) return res.status(500).json({ error: 'Errore eliminazione', details: error.message });

    console.log('[RENTRI-MUD] MUD eliminato:', id);
    res.json({ success: true });
  } catch (error) {
    console.error('[RENTRI-MUD] Errore eliminazione:', error);
    res.status(500).json({ error: 'Errore interno', details: error.message });
  }
});

/**
 * POST /api/rentri/mud/:id/invio-mudcomuni
 * Invio a MudComuni/ECOCERVED
 */
router.post('/mud/:id/invio-mudcomuni', async (req, res) => {
  try {
    const { id } = req.params;
    const { org_id } = req.body;
    if (!org_id) return res.status(400).json({ error: 'org_id richiesto' });

    const { data: mud } = await supabase
      .from('rentri_mud')
      .select('*')
      .eq('id', id)
      .eq('org_id', org_id)
      .single();

    if (!mud) return res.status(404).json({ error: 'MUD non trovato' });

    const { data: org } = await supabase
      .from('organizations')
      .select('name, piva, codice_fiscale')
      .eq('id', org_id)
      .single();

    // Aggiorna stato
    await supabase
      .from('rentri_mud')
      .update({ stato: 'in_completamento', updated_at: new Date().toISOString() })
      .eq('id', id);

    console.log('[RENTRI-MUD] Invio MudComuni avviato:', { id: id, org: org ? org.name : 'N/A' });

    // Per ora: redirect al portale MudComuni
    // In futuro: integrazione diretta API ECOCERVED
    res.json({
      success: false,
      redirect_url: 'https://www.mudcomuni.it',
      message: 'Integrazione diretta MudComuni in sviluppo. Scarica l\'XML e caricalo manualmente su mudcomuni.it'
    });
  } catch (error) {
    console.error('[RENTRI-MUD] Errore invio MudComuni:', error);
    res.status(500).json({ error: 'Errore invio MudComuni', details: error.message });
  }
});

/* ─── XML Generator ─── */
function generateMudXML(mud, org) {
  var riepilogo = Array.isArray(mud.riepilogo_eer) ? mud.riepilogo_eer : [];
  var schedaRIF = riepilogo.map(function(eer) {
    return '    <SchedaRIF>' +
      '<CodiceEER>' + escXml(eer.codice) + '</CodiceEER>' +
      '<Descrizione>' + escXml(eer.descrizione) + '</Descrizione>' +
      '<QuantitaCarico>' + (eer.carico || 0).toFixed(2) + '</QuantitaCarico>' +
      '<QuantitaScarico>' + (eer.scarico || 0).toFixed(2) + '</QuantitaScarico>' +
      '<UnitaMisura>KG</UnitaMisura>' +
      '</SchedaRIF>';
  }).join('\n');

  var orgName = org ? org.name : '';
  var orgPiva = org ? (org.piva || '') : '';
  var orgCF = org ? (org.codice_fiscale || org.piva || '') : '';
  var orgIndirizzo = org ? (org.indirizzo || '') : '';
  var orgComune = org ? (org.comune || '') : '';
  var orgProvincia = org ? (org.provincia || '') : '';
  var orgCap = org ? (org.cap || '') : '';
  var orgPec = org ? (org.pec || '') : '';

  return '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<MUD xmlns="http://www.mudcomuni.it/schema/mud">\n' +
    '  <Intestazione>\n' +
    '    <Anno>' + mud.anno + '</Anno>\n' +
    '    <CodiceFiscale>' + escXml(orgCF) + '</CodiceFiscale>\n' +
    '    <RagioneSociale>' + escXml(orgName) + '</RagioneSociale>\n' +
    '    <PartitaIVA>' + escXml(orgPiva) + '</PartitaIVA>\n' +
    '    <Indirizzo>' + escXml(orgIndirizzo) + '</Indirizzo>\n' +
    '    <Comune>' + escXml(orgComune) + '</Comune>\n' +
    '    <Provincia>' + escXml(orgProvincia) + '</Provincia>\n' +
    '    <CAP>' + escXml(orgCap) + '</CAP>\n' +
    '    <PEC>' + escXml(orgPec) + '</PEC>\n' +
    '    <PeriodoDal>' + (mud.data_inizio || mud.anno + '-01-01') + '</PeriodoDal>\n' +
    '    <PeriodoAl>' + (mud.data_fine || mud.anno + '-12-31') + '</PeriodoAl>\n' +
    '    <DataGenerazione>' + new Date().toISOString().split('T')[0] + '</DataGenerazione>\n' +
    '  </Intestazione>\n' +
    '  <ComunicazioneRifiutiSpeciali>\n' +
    '    <TotaleMovimenti>' + (mud.totale_movimenti || 0) + '</TotaleMovimenti>\n' +
    '    <TotaleRegistri>' + (mud.totale_registri || 0) + '</TotaleRegistri>\n' +
    '    <TotaleFormulari>' + (mud.totale_formulari || 0) + '</TotaleFormulari>\n' +
    '    <TotaleQuantitaKg>' + (mud.totale_quantita || 0).toFixed(2) + '</TotaleQuantitaKg>\n' +
    (schedaRIF ? schedaRIF + '\n' : '') +
    '  </ComunicazioneRifiutiSpeciali>\n' +
    '</MUD>';
}

/* ─── HTML/PDF Generator ─── */
function generateMudHTML(mud, org) {
  var riepilogo = Array.isArray(mud.riepilogo_eer) ? mud.riepilogo_eer : [];
  var righeEER = riepilogo.map(function(eer) {
    return '<tr><td style="font-family:monospace;color:#3b82f6">' + escHtml(eer.codice) + '</td>' +
      '<td>' + escHtml(eer.descrizione) + '</td>' +
      '<td style="text-align:right;color:#10b981">' + (eer.carico || 0).toFixed(2) + '</td>' +
      '<td style="text-align:right;color:#f59e0b">' + (eer.scarico || 0).toFixed(2) + '</td></tr>';
  }).join('\n');

  var orgName = org ? (org.name || '') : '';
  var orgPiva = org ? (org.piva || '') : '';
  var orgCF = org ? (org.codice_fiscale || '') : '';
  var orgPec = org ? (org.pec || '') : '';
  var orgIndirizzo = org ? (org.indirizzo || '') : '';
  var orgComune = org ? ((org.comune || '') + ' (' + (org.provincia || '') + ') ' + (org.cap || '')) : '';

  return '<!DOCTYPE html><html lang="it"><head><meta charset="UTF-8">' +
    '<title>MUD ' + mud.anno + '</title>' +
    '<style>' +
    'body{font-family:Arial,sans-serif;max-width:800px;margin:0 auto;padding:20px;color:#1e293b}' +
    'h1{color:#0f172a;border-bottom:2px solid #3b82f6;padding-bottom:8px}' +
    'h2{color:#334155;margin-top:24px}' +
    '.info{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:12px 0}' +
    '.info div{padding:8px 12px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px}' +
    '.info label{font-size:11px;color:#64748b;text-transform:uppercase;display:block}' +
    '.info span{font-size:14px;font-weight:600;color:#1e293b}' +
    '.kpi{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:16px 0}' +
    '.kpi div{text-align:center;padding:16px;background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px}' +
    '.kpi .num{font-size:24px;font-weight:700;color:#0369a1}' +
    '.kpi .lbl{font-size:11px;color:#64748b;margin-top:4px}' +
    'table{width:100%;border-collapse:collapse;margin:12px 0}' +
    'th{background:#f1f5f9;padding:8px 12px;text-align:left;font-size:11px;text-transform:uppercase;color:#64748b;border-bottom:2px solid #e2e8f0}' +
    'td{padding:8px 12px;border-bottom:1px solid #f1f5f9;font-size:13px}' +
    'tr:hover{background:#f8fafc}' +
    '.footer{margin-top:32px;padding-top:12px;border-top:1px solid #e2e8f0;font-size:11px;color:#94a3b8;text-align:center}' +
    '@media print{body{padding:10px}.kpi div{border:1px solid #ccc}}' +
    '</style></head><body>' +
    '<h1>MUD &mdash; Modello Unico Dichiarazione ' + mud.anno + '</h1>' +
    '<div class="info">' +
    '<div><label>Ragione Sociale</label><span>' + escHtml(orgName || '&mdash;') + '</span></div>' +
    '<div><label>P.IVA</label><span>' + escHtml(orgPiva || '&mdash;') + '</span></div>' +
    '<div><label>Codice Fiscale</label><span>' + escHtml(orgCF || '&mdash;') + '</span></div>' +
    '<div><label>PEC</label><span>' + escHtml(orgPec || '&mdash;') + '</span></div>' +
    '<div><label>Indirizzo</label><span>' + escHtml(orgIndirizzo || '&mdash;') + '</span></div>' +
    '<div><label>Comune</label><span>' + escHtml(orgComune) + '</span></div>' +
    '<div><label>Periodo</label><span>' + (mud.data_inizio || '') + ' &mdash; ' + (mud.data_fine || '') + '</span></div>' +
    '<div><label>Stato</label><span>' + escHtml(mud.stato || 'bozza') + '</span></div>' +
    '</div>' +
    '<div class="kpi">' +
    '<div><div class="num">' + (mud.totale_movimenti || 0) + '</div><div class="lbl">Movimenti</div></div>' +
    '<div><div class="num">' + (mud.totale_registri || 0) + '</div><div class="lbl">Registri</div></div>' +
    '<div><div class="num">' + (mud.totale_formulari || 0) + '</div><div class="lbl">Formulari</div></div>' +
    '<div><div class="num">' + (mud.totale_quantita || 0).toFixed(0) + ' kg</div><div class="lbl">Quantit&agrave; Totale</div></div>' +
    '</div>' +
    (riepilogo.length > 0 ?
      '<h2>Riepilogo per Codice EER</h2>' +
      '<table><thead><tr><th>Codice EER</th><th>Descrizione</th><th style="text-align:right">Carico (kg)</th><th style="text-align:right">Scarico (kg)</th></tr></thead>' +
      '<tbody>' + righeEER + '</tbody></table>'
      : '') +
    '<div class="footer">Generato da RescueManager &mdash; ' + new Date().toLocaleDateString('it-IT') + ' &mdash; Documento non ufficiale, da presentare tramite MudComuni/ECOCERVED</div>' +
    '</body></html>';
}

function escXml(s) {
  return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function escHtml(s) {
  return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

module.exports = router;
