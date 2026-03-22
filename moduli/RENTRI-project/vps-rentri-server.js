// VPS RENTRI Server - Proxy per trasmissioni RENTRI con mTLS
// Deploy su: /opt/rentri-server/server.js
// PM2: pm2 start server.js --name rentri-server

const express = require('express');
const cors = require('cors');
const https = require('https');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3200;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

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
      .from('rentri_certificates')
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
    const { org_id, environment = 'demo', identificativo } = req.query;
    
    if (!org_id || !identificativo) {
      return res.status(400).json({ 
        error: 'Parametri mancanti: org_id, identificativo' 
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
    const { org_id, environment = 'demo' } = req.body;
    
    if (!org_id) {
      return res.status(400).json({ error: 'org_id mancante' });
    }

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
    const { org_id, environment = 'demo', progressivo_iniziale, progressivo_finale } = req.query;
    
    if (!org_id) {
      return res.status(400).json({ error: 'org_id mancante' });
    }

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
    const { org_id, environment = 'demo' } = req.query;
    
    if (!org_id) {
      return res.status(400).json({ error: 'org_id mancante' });
    }

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
    const { org_id, environment = 'demo', movimenti } = req.body;
    
    if (!org_id || !movimenti || !Array.isArray(movimenti)) {
      return res.status(400).json({ 
        error: 'Parametri mancanti: org_id, movimenti (array)' 
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
    const { org_id, environment = 'demo', service = 'dati-registri' } = req.query;
    
    if (!org_id) {
      return res.status(400).json({ error: 'org_id mancante' });
    }

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
    const { org_id, environment = 'demo', service = 'dati-registri' } = req.query;
    
    if (!org_id) {
      return res.status(400).json({ error: 'org_id mancante' });
    }

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
    const { org_id, stato, tipo, limit = 50 } = req.query;
    
    if (!org_id) {
      return res.status(400).json({ error: 'org_id mancante' });
    }

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
// START SERVER
// =====================================================
app.listen(PORT, () => {
  console.log(`🚀 RENTRI Server running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
});
