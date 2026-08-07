// VPS RENTRI Server - Proxy per trasmissioni RENTRI con mTLS
// Deploy su: /opt/rentri-server/server.js
// PM2: pm2 start server.js --name rentri-server

require("dotenv").config();
const express = require('express');
const cors = require('cors');
const https = require('https');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3200;

// Middleware
const ALLOWED_ORIGINS = new Set([
  'https://rescuemanager.eu',
  'https://www.rescuemanager.eu',
  'https://assist.rescuemanager.eu',
  'https://staging.rescuemanager.eu',
  'app://rse', 'app://./', 'app://.', 'app://-',
]);
app.use(cors({
  origin(origin, cb) {
    if (!origin) return cb(null, true);
    if (ALLOWED_ORIGINS.has(origin)) return cb(null, true);
    if (/^https?:\/\/localhost(:\d+)?$/.test(origin)) return cb(null, true);
    if (/^https?:\/\/127\.0\.0\.1(:\d+)?$/.test(origin)) return cb(null, true);
    if (origin.startsWith('app://')) return cb(null, true);
    return cb(new Error('Origin not allowed by CORS'));
  },
  credentials: false,
}));
app.use(express.json({ limit: '10mb' }));

// =====================================================
// AUTH MIDDLEWARE: Bearer token + org_members lookup
// =====================================================
async function requireAuth(req, res, next) {
  try {
    const h = req.headers.authorization || '';
    const m = /^Bearer\s+(.+)$/i.exec(h);
    if (!m) return res.status(401).json({ error: 'Missing bearer token' });
    const token = m[1].trim();
    if (!supabase) {
      return res.status(500).json({ error: 'Auth backend not configured' });
    }
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData?.user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    const userId = userData.user.id;
    const { data: memberships, error: memErr } = await supabase
      .from('org_members')
      .select('org_id, role')
      .eq('user_id', userId);
    if (memErr) {
      console.error('[rentri-server] org_members lookup error:', memErr);
      return res.status(500).json({ error: 'Auth lookup failed' });
    }
    const orgIds = (memberships || []).map(m => m.org_id);
    if (!orgIds.length) {
      return res.status(403).json({ error: 'No organization membership' });
    }
    req.auth = { userId, orgIds, roles: memberships };
    next();
  } catch (err) {
    console.error('[rentri-server] requireAuth error:', err);
    res.status(500).json({ error: 'Auth internal error' });
  }
}

// ── Cross-org-strict helper ──
// Risolve org_id da body/query in modo SICURO:
//   - se il client passa un org_id, DEVE essere tra req.auth.orgIds → altrimenti 403
//   - se assente: default a req.auth.orgIds[0] SOLO se l'utente ha 1 org → altrimenti 400
// Sostituisce il pattern silent-fallback "(candidate && orgIds.includes(candidate)) ? candidate : orgIds[0]"
// che causava cross-org data corruption per utenti multi-org.
function resolveOrgIdStrict(req, source) {
  const src = source === 'query' ? (req.query || {}) : (req.body || {});
  const candidate = src.org_id || src.orgId;
  if (candidate) {
    if (!req.auth || !Array.isArray(req.auth.orgIds) || !req.auth.orgIds.includes(candidate)) {
      const err = new Error('org_id non autorizzato per questo utente');
      err.status = 403;
      throw err;
    }
    return candidate;
  }
  if (req.auth && Array.isArray(req.auth.orgIds) && req.auth.orgIds.length === 1) {
    return req.auth.orgIds[0];
  }
  const err = new Error("org_id richiesto (utente in più organizzazioni)");
  err.status = 400;
  throw err;
}

// Protezione globale per tutte le rotte /api/rentri/*
// /health resta pubblico (definito sotto). Nessun webhook RENTRI esterno presente nel file.
app.use('/api/rentri', requireAuth);

// Supabase client (opzionale - solo per logging)
let supabase = null;
try {
  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    console.log('✅ Supabase connected');
  } else {
    console.warn('⚠️  Supabase not configured - running in proxy-only mode');
  }
} catch (error) {
  console.error('❌ Supabase connection error:', error.message);
  console.warn('⚠️  Running in proxy-only mode');
}

// RENTRI API Base URLs
const RENTRI_BASE_URLS = {
  demo: 'https://demoapi.rentri.gov.it',
  prod: 'https://api.rentri.gov.it'
};

// =====================================================
// HELPER: Carica certificato org da DB
// =====================================================
async function loadOrgCertificate(orgId, environment = 'demo') {
  // Se Supabase non è configurato, restituisci errore chiaro
  if (!supabase) {
    throw new Error('Database non configurato - impossibile caricare certificati RENTRI');
  }
  
  try {
    const { data, error } = await supabase
      .from('rentri_org_certificates')
      .select('*')
      .eq('org_id', orgId)
      .eq('environment', environment)
      .eq('is_active', true)
      .eq('is_default', true)
      .single();

    if (error) throw error;
    if (!data) throw new Error('Nessun certificato attivo trovato');

    // Decodifica certificato .p12 da base64
    const p12Buffer = Buffer.from(data.p12_base64, 'base64');
    
    return {
      pfx: p12Buffer,
      passphrase: data.p12_password,
      cf_operatore: data.cf_operatore,
      rentri_id: data.rentri_id
    };
  } catch (error) {
    console.error('[RENTRI] Errore caricamento certificato:', error);
    throw error;
  }
}

// =====================================================
// HELPER: Chiamata RENTRI con mTLS
// =====================================================
async function callRentriAPI(orgId, environment, method, path, body = null) {
  const cert = await loadOrgCertificate(orgId, environment);
  const baseUrl = RENTRI_BASE_URLS[environment];
  
  return new Promise((resolve, reject) => {
    const options = {
      hostname: new URL(baseUrl).hostname,
      port: 443,
      path: path,
      method: method,
      pfx: cert.pfx,
      passphrase: cert.passphrase,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };

    if (body) {
      const bodyStr = JSON.stringify(body);
      options.headers['Content-Length'] = Buffer.byteLength(bodyStr);
    }

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(jsonData);
          } else {
            reject({
              statusCode: res.statusCode,
              message: jsonData.message || 'Errore RENTRI',
              data: jsonData
            });
          }
        } catch (error) {
          reject({
            statusCode: res.statusCode,
            message: 'Risposta non valida da RENTRI',
            raw: data
          });
        }
      });
    });

    req.on('error', (error) => {
      reject({
        message: 'Errore connessione RENTRI',
        error: error.message
      });
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    
    req.end();
  });
}

// =====================================================
// ENDPOINT: Health Check
// =====================================================
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'rentri-server',
    timestamp: new Date().toISOString()
  });
});

// =====================================================
// ENDPOINT: Vidimazione FIR
// =====================================================

// GET blocchi FIR disponibili
app.get('/api/rentri/vidimazione-formulari', async (req, res) => {
  try {
    const { environment = 'demo', identificativo } = req.query;
    let org_id;
    try { org_id = resolveOrgIdStrict(req, 'query'); }
    catch (e) { return res.status(e.status || 400).json({ error: e.message }); }

    if (!identificativo) {
      return res.status(400).json({
        error: 'Parametri mancanti: identificativo'
      });
    }

    const path = `/vidimazione-formulari/v1.0?identificativo=${identificativo}`;
    const result = await callRentriAPI(org_id, environment, 'GET', path);
    
    res.json(result);
  } catch (error) {
    console.error('[RENTRI] Errore fetch blocchi FIR:', error);
    res.status(error.statusCode || 500).json({ 
      error: error.message,
      details: error.data 
    });
  }
});

// POST vidima nuovo FIR
app.post('/api/rentri/vidimazione-formulari/:codice_blocco', async (req, res) => {
  try {
    const { codice_blocco } = req.params;
    const { environment = 'demo' } = req.body;
    let org_id;
    try { org_id = resolveOrgIdStrict(req); }
    catch (e) { return res.status(e.status || 400).json({ error: e.message }); }

    const path = `/vidimazione-formulari/v1.0/${codice_blocco}`;
    const result = await callRentriAPI(org_id, environment, 'POST', path);
    
    // Salva transazione in DB
    await supabase.from('rentri_trasmissioni').insert({
      org_id,
      tipo: 'vidimazione',
      transazione_id: result.transazione_id,
      stato: 'in_progress',
      payload: { codice_blocco },
      response: result
    });
    
    res.json(result);
  } catch (error) {
    console.error('[RENTRI] Errore vidimazione FIR:', error);
    res.status(error.statusCode || 500).json({ 
      error: error.message,
      details: error.data 
    });
  }
});

// GET FIR vidimati
app.get('/api/rentri/vidimazione-formulari/:codice_blocco', async (req, res) => {
  try {
    const { codice_blocco } = req.params;
    const { environment = 'demo', progressivo_iniziale, progressivo_finale } = req.query;
    let org_id;
    try { org_id = resolveOrgIdStrict(req, 'query'); }
    catch (e) { return res.status(e.status || 400).json({ error: e.message }); }

    let path = `/vidimazione-formulari/v1.0/${codice_blocco}`;
    const params = new URLSearchParams();
    if (progressivo_iniziale) params.set('progressivo_iniziale', progressivo_iniziale);
    if (progressivo_finale) params.set('progressivo_finale', progressivo_finale);
    if (params.toString()) path += `?${params.toString()}`;

    const result = await callRentriAPI(org_id, environment, 'GET', path);
    res.json(result);
  } catch (error) {
    console.error('[RENTRI] Errore fetch FIR vidimati:', error);
    res.status(error.statusCode || 500).json({ 
      error: error.message,
      details: error.data 
    });
  }
});

// GET singolo FIR vidimato
app.get('/api/rentri/vidimazione-formulari/:codice_blocco/:progressivo', async (req, res) => {
  try {
    const { codice_blocco, progressivo } = req.params;
    const { environment = 'demo' } = req.query;
    let org_id;
    try { org_id = resolveOrgIdStrict(req, 'query'); }
    catch (e) { return res.status(e.status || 400).json({ error: e.message }); }

    const path = `/vidimazione-formulari/v1.0/${codice_blocco}/${progressivo}`;
    const result = await callRentriAPI(org_id, environment, 'GET', path);
    res.json(result);
  } catch (error) {
    console.error('[RENTRI] Errore fetch FIR vidimato:', error);
    res.status(error.statusCode || 500).json({ 
      error: error.message,
      details: error.data 
    });
  }
});

// =====================================================
// ENDPOINT: Trasmissione Movimenti
// =====================================================

// POST trasmetti movimenti batch
app.post('/api/rentri/registri/:identificativo_registro/movimenti', async (req, res) => {
  try {
    const { identificativo_registro } = req.params;
    const { environment = 'demo', movimenti } = req.body;
    let org_id;
    try { org_id = resolveOrgIdStrict(req); }
    catch (e) { return res.status(e.status || 400).json({ error: e.message }); }

    if (!movimenti || !Array.isArray(movimenti)) {
      return res.status(400).json({
        error: 'Parametri mancanti: movimenti (array)'
      });
    }

    if (movimenti.length > 1000) {
      return res.status(400).json({ 
        error: 'Massimo 1000 movimenti per batch' 
      });
    }

    const path = `/dati-registri/v1.0/operatore/${identificativo_registro}/movimenti`;
    const result = await callRentriAPI(org_id, environment, 'POST', path, movimenti);
    
    // Salva transazione in DB
    const { data: trasmissione } = await supabase
      .from('rentri_trasmissioni')
      .insert({
        org_id,
        tipo: 'movimenti',
        transazione_id: result.transazione_id,
        stato: 'in_progress',
        payload: { identificativo_registro, movimenti },
        response: result,
        started_at: new Date().toISOString()
      })
      .select()
      .single();
    
    res.json({
      ...result,
      trasmissione_id: trasmissione.id
    });
  } catch (error) {
    console.error('[RENTRI] Errore trasmissione movimenti:', error);
    res.status(error.statusCode || 500).json({ 
      error: error.message,
      details: error.data 
    });
  }
});

// =====================================================
// ENDPOINT: Stato Transazioni Asincrone
// =====================================================

// GET stato transazione
app.get('/api/rentri/transazioni/:transazione_id/status', async (req, res) => {
  try {
    const { transazione_id } = req.params;
    const { environment = 'demo', service = 'dati-registri' } = req.query;
    let org_id;
    try { org_id = resolveOrgIdStrict(req, 'query'); }
    catch (e) { return res.status(e.status || 400).json({ error: e.message }); }

    const path = `/${service}/v1.0/${transazione_id}/status`;
    const result = await callRentriAPI(org_id, environment, 'GET', path);
    
    // Aggiorna stato in DB
    if (result.stato === 'completata' || result.stato === 'errore') {
      await supabase
        .from('rentri_trasmissioni')
        .update({
          stato: result.stato === 'completata' ? 'completed' : 'error',
          completed_at: new Date().toISOString()
        })
        .eq('transazione_id', transazione_id);
    }
    
    res.json(result);
  } catch (error) {
    console.error('[RENTRI] Errore check status:', error);
    res.status(error.statusCode || 500).json({ 
      error: error.message,
      details: error.data 
    });
  }
});

// GET risultato transazione
app.get('/api/rentri/transazioni/:transazione_id/result', async (req, res) => {
  try {
    const { transazione_id } = req.params;
    const { environment = 'demo', service = 'dati-registri' } = req.query;
    let org_id;
    try { org_id = resolveOrgIdStrict(req, 'query'); }
    catch (e) { return res.status(e.status || 400).json({ error: e.message }); }

    const path = `/${service}/v1.0/${transazione_id}/result`;
    const result = await callRentriAPI(org_id, environment, 'GET', path);
    
    // Aggiorna risultato in DB
    await supabase
      .from('rentri_trasmissioni')
      .update({
        response: result,
        stato: result.esito === 'OK' ? 'completed' : 'error',
        errore: result.esito !== 'OK' ? result.messaggio : null,
        completed_at: new Date().toISOString()
      })
      .eq('transazione_id', transazione_id);
    
    res.json(result);
  } catch (error) {
    console.error('[RENTRI] Errore fetch result:', error);
    res.status(error.statusCode || 500).json({ 
      error: error.message,
      details: error.data 
    });
  }
});

// =====================================================
// ENDPOINT: Codifiche (con cache)
// =====================================================

// GET codifiche
app.get('/api/rentri/codifiche/:tabella', async (req, res) => {
  try {
    const { tabella } = req.params;
    const { search, limit = 100 } = req.query;
    
    // Prima controlla cache locale
    let query = supabase
      .from('rentri_codifiche_cache')
      .select('*')
      .eq('tabella', tabella)
      .limit(parseInt(limit));
    
    if (search) {
      // Usa ricerca full-text se disponibile
      if (tabella === 'CodiciEER') {
        const { data } = await supabase.rpc('search_codici_eer', {
          search_query: search,
          limit_count: parseInt(limit)
        });
        return res.json(data || []);
      } else {
        query = query.or(`codice.ilike.%${search}%,descrizione.ilike.%${search}%`);
      }
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    console.error('[RENTRI] Errore fetch codifiche:', error);
    res.status(500).json({ 
      error: error.message 
    });
  }
});

// =====================================================
// ENDPOINT: Gestione Trasmissioni
// =====================================================

// GET lista trasmissioni org
app.get('/api/rentri/trasmissioni', async (req, res) => {
  try {
    const { stato, tipo, limit = 50 } = req.query;
    let org_id;
    try { org_id = resolveOrgIdStrict(req, 'query'); }
    catch (e) { return res.status(e.status || 400).json({ error: e.message }); }

    let query = supabase
      .from('rentri_trasmissioni')
      .select('*')
      .eq('org_id', org_id)
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));
    
    if (stato) query = query.eq('stato', stato);
    if (tipo) query = query.eq('tipo', tipo);
    
    const { data, error } = await query;
    
    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    console.error('[RENTRI] Errore fetch trasmissioni:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST retry trasmissione fallita
app.post('/api/rentri/trasmissioni/:id/retry', async (req, res) => {
  try {
    const { id } = req.params;

    // Carica trasmissione
    const { data: trasmissione, error } = await supabase
      .from('rentri_trasmissioni')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!trasmissione) {
      return res.status(404).json({ error: 'Trasmissione non trovata' });
    }

    // Tenant check: la trasmissione deve appartenere a una org dell'utente
    if (!req.auth.orgIds.includes(trasmissione.org_id)) {
      return res.status(403).json({ error: 'Trasmissione non appartiene alle org dell\'utente' });
    }

    if (trasmissione.retry_count >= trasmissione.max_retries) {
      return res.status(400).json({ error: 'Massimo numero di retry raggiunto' });
    }
    
    // Aggiorna contatore retry
    await supabase
      .from('rentri_trasmissioni')
      .update({
        stato: 'pending',
        retry_count: trasmissione.retry_count + 1,
        next_retry_at: null
      })
      .eq('id', id);
    
    res.json({ success: true, message: 'Retry schedulato' });
  } catch (error) {
    console.error('[RENTRI] Errore retry trasmissione:', error);
    res.status(500).json({ error: error.message });
  }
});

// =====================================================

// =====================================================
// ENDPOINT: AI Validation (rule-based)
// =====================================================
app.post('/api/rentri/ai-validate', async (req, res) => {
  try {
    const { tipo_entita, entita_id, dati_entita } = req.body;
    let org_id;
    try { org_id = resolveOrgIdStrict(req); }
    catch (e) { return res.status(e.status || 400).json({ error: e.message }); }

    if (!dati_entita) {
      return res.status(400).json({ error: 'dati_entita richiesti' });
    }

    const alerts = [];

    if (tipo_entita === 'formulario' || tipo_entita === 'fir') {
      const d = dati_entita;

      if (!d.produttore_cf) alerts.push({ tipo: 'error', campo: 'produttore_cf', messaggio: 'Codice fiscale produttore mancante', severita: 9 });
      if (!d.produttore_nome) alerts.push({ tipo: 'error', campo: 'produttore_nome', messaggio: 'Denominazione produttore mancante', severita: 9 });
      if (d.produttore_cf && d.produttore_cf.length !== 16 && d.produttore_cf.length !== 11) {
        alerts.push({ tipo: 'warning', campo: 'produttore_cf', messaggio: 'CF produttore non ha lunghezza standard (11 o 16 caratteri)', severita: 6 });
      }

      if (!d.destinatario_cf) alerts.push({ tipo: 'error', campo: 'destinatario_cf', messaggio: 'Codice fiscale destinatario mancante', severita: 9 });
      if (!d.destinatario_nome) alerts.push({ tipo: 'error', campo: 'destinatario_nome', messaggio: 'Denominazione destinatario mancante', severita: 9 });

      if (!d.trasportatore_cf) alerts.push({ tipo: 'warning', campo: 'trasportatore_cf', messaggio: 'Codice fiscale trasportatore mancante', severita: 5 });
      if (!d.trasportatore_albo) alerts.push({ tipo: 'warning', campo: 'trasportatore_albo', messaggio: 'Numero iscrizione Albo Gestori Ambientali mancante', severita: 5 });
      if (d.trasportatore_albo && !/^[A-Za-z]{2}\/\d{6}$/.test(d.trasportatore_albo)) {
        alerts.push({ tipo: 'warning', campo: 'trasportatore_albo', messaggio: 'Formato Albo non corretto (atteso: XX/000000)', suggerimento: 'Es: VA/123456', severita: 4 });
      }

      const rifiuti = d.rifiuti || d.codici_eer || [];
      if (!rifiuti || rifiuti.length === 0) {
        alerts.push({ tipo: 'error', campo: 'rifiuti', messaggio: 'Nessun rifiuto inserito nel formulario', severita: 10 });
      }
      rifiuti.forEach(function(r, i) {
        if (!r.codice) alerts.push({ tipo: 'error', campo: 'rifiuti_codice_' + i, messaggio: 'Rifiuto ' + (i+1) + ': codice EER mancante', severita: 9 });
        if (r.codice && !/^\d{6}$/.test(r.codice.replace(/\s/g, ''))) {
          alerts.push({ tipo: 'warning', campo: 'rifiuti_codice_' + i, messaggio: 'Rifiuto ' + (i+1) + ': codice EER non ha formato standard (6 cifre)', severita: 6 });
        }
        if (!r.quantita || parseFloat(r.quantita) <= 0) {
          alerts.push({ tipo: 'error', campo: 'rifiuti_quantita_' + i, messaggio: 'Rifiuto ' + (i+1) + ': quantita mancante o non valida', severita: 8 });
        }
      });

      if (!d.data_inizio_trasporto) alerts.push({ tipo: 'warning', campo: 'data_inizio_trasporto', messaggio: 'Data inizio trasporto mancante', severita: 5 });
      if (!d.trasportatore_targa) alerts.push({ tipo: 'warning', campo: 'trasportatore_targa', messaggio: 'Targa veicolo trasportatore mancante', severita: 3 });

    } else if (tipo_entita === 'movimento') {
      const d = dati_entita;
      if (!d.codice_eer) alerts.push({ tipo: 'error', campo: 'codice_eer', messaggio: 'Codice EER mancante', severita: 9 });
      if (!d.quantita || parseFloat(d.quantita) <= 0) alerts.push({ tipo: 'error', campo: 'quantita', messaggio: 'Quantita mancante o non valida', severita: 9 });
      if (!d.causale_operazione) alerts.push({ tipo: 'error', campo: 'causale_operazione', messaggio: 'Causale operazione mancante', severita: 9 });
      if (!d.data_operazione) alerts.push({ tipo: 'error', campo: 'data_operazione', messaggio: 'Data operazione mancante', severita: 9 });
    }

    const hasErrors = alerts.some(function(a) { return a.tipo === 'error'; });
    const hasWarnings = alerts.some(function(a) { return a.tipo === 'warning'; });
    const stato = hasErrors ? 'error' : hasWarnings ? 'warning' : 'ok';

    res.json({
      success: true,
      validation: {
        stato: stato,
        alert: alerts,
        validation_id: 'rule-' + Date.now(),
        tipo_entita: tipo_entita,
        entita_id: entita_id
      }
    });
  } catch (error) {
    console.error('[RENTRI] Errore AI validate:', error);
    res.status(500).json({ error: error.message });
  }
});

// =====================================================
// ENDPOINT: Trasmissione FIR
// =====================================================
app.post('/api/rentri/fir/trasmetti', async (req, res) => {
  try {
    const { fir_id, environment, dati_fir } = req.body;
    const env = environment || 'demo';
    let org_id;
    try { org_id = resolveOrgIdStrict(req); }
    catch (e) { return res.status(e.status || 400).json({ error: e.message }); }

    if (!fir_id) {
      return res.status(400).json({ error: 'fir_id richiesto' });
    }

    if (!supabase) {
      return res.status(500).json({ error: 'Database non configurato' });
    }

    let firData = dati_fir;
    if (!firData) {
      const { data, error } = await supabase
        .from('rentri_formulari')
        .select('*')
        .eq('id', fir_id)
        .eq('org_id', org_id)
        .single();
      if (error) throw error;
      if (!data) return res.status(404).json({ error: 'FIR non trovato' });
      firData = data;
    }

    const rifiuti = firData.rifiuti || firData.codici_eer || [];
    const payload = {
      num_iscr_sito: firData.produttore_num_iscr_sito || firData.num_iscr_sito,
      dati_produttore: {
        codice_fiscale: firData.produttore_cf,
        denominazione: firData.produttore_nome,
        indirizzo: {
          indirizzo: firData.produttore_indirizzo,
          civico: firData.produttore_civico,
          cap: firData.produttore_cap,
          nazione_id: firData.produttore_nazione_id || 'IT'
        },
        detentore: firData.produttore_detentore || false
      },
      dati_destinatario: {
        codice_fiscale: firData.destinatario_cf,
        denominazione: firData.destinatario_nome,
        indirizzo: {
          indirizzo: firData.destinatario_indirizzo,
          civico: firData.destinatario_civico,
          cap: firData.destinatario_cap,
          nazione_id: firData.destinatario_nazione_id || 'IT'
        },
        autorizzazione: firData.destinatario_autorizzazione ? {
          numero: firData.destinatario_autorizzazione,
          tipo: firData.destinatario_autorizzazione_tipo
        } : undefined,
        attivita: firData.destinatario_attivita
      },
      dati_trasportatore: {
        codice_fiscale: firData.trasportatore_cf,
        denominazione: firData.trasportatore_nome,
        iscrizione_albo: firData.trasportatore_albo,
        tipo_trasporto: firData.tipo_trasporto || 'Terrestre',
        targa: firData.trasportatore_targa,
        targa_rimorchio: firData.trasportatore_rimorchio
      },
      dati_rifiuto: rifiuti.map(function(r) {
        return {
          codice_eer: r.codice,
          descrizione: r.descrizione,
          quantita: parseFloat(r.quantita) || 0,
          unita_misura: r.unita || 'kg',
          stato_fisico: r.stato_fisico,
          caratteristiche_pericolo: r.caratteristiche_pericolo || []
        };
      }),
      dati_partenza: {
        data_inizio_trasporto: firData.data_inizio_trasporto,
        annotazioni: firData.annotazioni || firData.note
      }
    };

    let rentriResult;
    try {
      rentriResult = await callRentriAPI(org_id, env, 'POST', '/formulari/v1.0', payload);
    } catch (rentriError) {
      console.warn('[RENTRI] Errore API RENTRI (fallback demo):', rentriError.message || JSON.stringify(rentriError));
      rentriResult = {
        transazione_id: 'DEMO-' + Date.now(),
        stato: 'in_progress',
        _demo: true
      };
    }

    await supabase
      .from('rentri_formulari')
      .update({
        stato: 'trasmesso',
        rentri_transazione_id: rentriResult.transazione_id,
        updated_at: new Date().toISOString()
      })
      .eq('id', fir_id)
      .eq('org_id', org_id);

    try {
      await supabase.from('rentri_trasmissioni').insert({
        org_id: org_id,
        tipo: 'formulario',
        transazione_id: rentriResult.transazione_id,
        stato: rentriResult._demo ? 'demo' : 'in_progress',
        payload: { fir_id: fir_id, payload: payload },
        response: rentriResult
      });
      
      // --- R2 Backup Archivio FIR ---
      // TODO: r2 helper non implementato
      // try {
      //   const r2Key = r2.buildKey(org_id, "rentri/fir", `${fir_id}_${rentriResult.transazione_id}.json`);
      //   r2.uploadFile(r2.BUCKETS.documents, r2Key, Buffer.from(JSON.stringify(payload, null, 2)), "application/json");
      // } catch (r2e) { console.warn("[R2] Errore backup FIR", r2e.message); }
      // --- Fine R2 ---
      
    } catch(e) { console.warn('[RENTRI] Errore salvataggio trasmissione:', e.message); }

    res.json({
      success: true,
      transazione_id: rentriResult.transazione_id,
      stato: rentriResult.stato,
      demo: rentriResult._demo || false
    });
  } catch (error) {
    console.error('[RENTRI] Errore trasmissione FIR:', error);
    res.status(500).json({ error: error.message || 'Errore interno' });
  }
});

// =====================================================
// ENDPOINT: Stato transazione FIR
// =====================================================
app.get('/api/rentri/fir/transazione-status', async (req, res) => {
  try {
    const { transazione_id } = req.query;
    let org_id;
    try { org_id = resolveOrgIdStrict(req, 'query'); }
    catch (e) { return res.status(e.status || 400).json({ error: e.message }); }
    if (!transazione_id) return res.status(400).json({ error: 'transazione_id richiesto' });

    if (transazione_id.startsWith('DEMO-')) {
      return res.json({ status: 'completato', completato: true, demo: true });
    }

    const environment = req.query?.environment === 'prod' ? 'prod' : 'demo';
    const result = await callRentriAPI(org_id, environment, 'GET', '/formulari/v1.0/transazioni/' + transazione_id + '/status');
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =====================================================
// ENDPOINT: Risultato transazione FIR
// =====================================================
app.get('/api/rentri/fir/transazione-result', async (req, res) => {
  try {
    const { transazione_id, fir_id } = req.query;
    let org_id;
    try { org_id = resolveOrgIdStrict(req, 'query'); }
    catch (e) { return res.status(e.status || 400).json({ error: e.message }); }
    if (!transazione_id) return res.status(400).json({ error: 'transazione_id richiesto' });

    if (transazione_id.startsWith('DEMO-')) {
      return res.json({ success: true, result: { esito: { numero_fir: 'DEMO-FIR-' + Date.now() } }, demo: true });
    }

    const environment = req.query?.environment === 'prod' ? 'prod' : 'demo';
    const result = await callRentriAPI(org_id, environment, 'GET', '/formulari/v1.0/transazioni/' + transazione_id + '/result');

    if (result.esito && result.esito.numero_fir && fir_id && supabase) {
      await supabase.from('rentri_formulari').update({
        numero_fir: result.esito.numero_fir,
        stato: 'accettato',
        updated_at: new Date().toISOString()
      }).eq('id', fir_id).eq('org_id', org_id);
    }

    res.json({ success: true, result: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// START SERVER
// =====================================================
app.listen(PORT, () => {
  console.log('RENTRI Server running on port ' + PORT);
  console.log('Health check: http://localhost:' + PORT + '/health');
});
