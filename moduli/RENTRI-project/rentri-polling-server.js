/**
 * RENTRI Polling Server (VPS)
 * Bypassa Vercel per gestire polling RENTRI direttamente sul server
 * 
 * Fix 2026-02-14:
 * - Rimossa route /result duplicata (Express usava solo la prima, senza aggiornamento DB)
 * - Rimosso import 'https' non utilizzato
 * - Aggiunto helper getCertificate() per evitare duplicazione codice
 * - Aggiunto error handling migliorato
 */

require('dotenv').config({ path: '/root/.env' });

const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const { createPrivateKey, randomUUID, sign: signData } = require('crypto');
const http = require('http');

const app = express();
const PORT = process.env.PORT || 3001;

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.use(express.json());

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const RENTRI_PROXY_URL = 'http://127.0.0.1:8080';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('[RENTRI-POLLING] Errore: SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY richiesti');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ─── Helper: Estrai certificati dal PEM ───
function extractCertificates(certPem) {
  const certRegex = /-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----/g;
  const matches = certPem.match(certRegex);
  if (!matches || matches.length === 0) throw new Error('Nessun certificato trovato nel PEM');
  return matches.map(cert =>
    cert.replace(/-----BEGIN CERTIFICATE-----/g, '')
        .replace(/-----END CERTIFICATE-----/g, '')
        .replace(/\s/g, '')
  );
}

// ─── Helper: Genera JWT per RENTRI ───
function generateRentriJWT(options) {
  const { issuer, certificatePem, privateKeyPem, audience = 'rentrigov.demo.api', ttlSeconds = 55 } = options;
  const privateKey = createPrivateKey(privateKeyPem);
  const certChain = extractCertificates(certificatePem);

  const header = { alg: 'ES256', typ: 'JWT', x5c: certChain };
  const now = Math.floor(Date.now() / 1000);
  const payload = { iss: issuer, aud: audience, exp: now + ttlSeconds, iat: now, jti: randomUUID() };

  const headerB64 = Buffer.from(JSON.stringify(header)).toString('base64url');
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const dataToSign = `${headerB64}.${payloadB64}`;
  const signature = signData(null, Buffer.from(dataToSign), {
    key: privateKey,
    dsaEncoding: 'ieee-p1363'
  }).toString('base64url');

  return `${dataToSign}.${signature}`;
}

// ─── Helper: HTTP request verso proxy mTLS locale (porta 8080) ───
function httpRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const { URL } = require('url');
    const parsedUrl = new URL(url);
    const requestOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || 80,
      path: parsedUrl.pathname + parsedUrl.search,
      method: options.method || 'GET',
      headers: options.headers || {},
      timeout: 30000
    };

    const req = http.request(requestOptions, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        const body = Buffer.concat(chunks);
        resolve({
          status: res.statusCode,
          statusText: res.statusMessage,
          headers: res.headers,
          ok: res.statusCode >= 200 && res.statusCode < 300,
          text: () => Promise.resolve(body.toString()),
          json: () => {
            try {
              return Promise.resolve(JSON.parse(body.toString()));
            } catch {
              return Promise.resolve({});
            }
          }
        });
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (options.body) req.write(options.body);
    req.end();
  });
}

// ─── Helper: Recupera certificato attivo per org/environment ───
async function getCertificate(orgId, environment) {
  // Prova prima il certificato default
  const { data: certDefault } = await supabase
    .from('rentri_org_certificates')
    .select('*')
    .eq('org_id', orgId)
    .eq('environment', environment)
    .eq('is_active', true)
    .eq('is_default', true)
    .maybeSingle();

  if (certDefault) return certDefault;

  // Fallback: ultimo certificato attivo
  const { data: certActive } = await supabase
    .from('rentri_org_certificates')
    .select('*')
    .eq('org_id', orgId)
    .eq('environment', environment)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return certActive || null;
}

// ─── Helper: Risolvi org_id e environment dal registro ───
async function resolveOrgAndEnv(orgId, registroId, environment) {
  let finalOrgId = orgId;
  let finalEnvironment = environment;

  if (registroId) {
    const { data: registro } = await supabase
      .from('rentri_registri')
      .select('org_id, environment')
      .eq('id', registroId)
      .single();

    if (registro) {
      finalOrgId = registro.org_id || orgId;
      finalEnvironment = registro.environment || environment;
    }
  }

  return { finalOrgId, finalEnvironment };
}

// ─── Helper: Genera JWT autenticazione per RENTRI ───
function generateJWTForCert(cert, environment) {
  return generateRentriJWT({
    issuer: cert.cf_operatore,
    certificatePem: cert.certificate_pem,
    privateKeyPem: cert.private_key_pem,
    audience: environment === 'demo' ? 'rentrigov.demo.api' : 'rentrigov.api'
  });
}

// ══════════════════════════════════════════════════════
// ENDPOINT: Status transazione (polling)
// ══════════════════════════════════════════════════════
app.get('/api/rentri/transazioni/:id/status', async (req, res) => {
  try {
    const transazioneId = req.params.id;
    const { org_id, registro_id, environment = 'demo' } = req.query;
    console.log('[RENTRI-POLLING] Richiesta status:', { transazioneId, org_id, registro_id, environment });

    if (!org_id) return res.status(400).json({ error: 'org_id richiesto' });

    const { finalOrgId, finalEnvironment } = await resolveOrgAndEnv(org_id, registro_id, environment);

    const cert = await getCertificate(finalOrgId, finalEnvironment);
    if (!cert) {
      console.error('[RENTRI-POLLING] Certificato non trovato per', finalOrgId, finalEnvironment);
      return res.status(404).json({ error: 'Certificato RENTRI non trovato' });
    }

    let jwtAuth;
    try {
      jwtAuth = generateJWTForCert(cert, finalEnvironment);
      console.log('[RENTRI-POLLING] JWT generato');
    } catch (jwtError) {
      console.error('[RENTRI-POLLING] Errore generazione JWT:', jwtError.message);
      return res.status(500).json({ error: 'Errore generazione JWT', details: jwtError.message });
    }

    const rentriUrl = `${RENTRI_PROXY_URL}/dati-registri/v1.0/${transazioneId}/status`;
    console.log('[RENTRI-POLLING] Chiamata RENTRI:', rentriUrl);

    const rentriResponse = await httpRequest(rentriUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${jwtAuth}`,
        'Content-Type': 'application/json'
      }
    });

    const status = rentriResponse.status;
    console.log('[RENTRI-POLLING] Risposta RENTRI:', status);

    if (status === 200) {
      return res.status(200).json({ stato: 'in_elaborazione', transazione_id: transazioneId });
    }

    if (status === 303) {
      const location = rentriResponse.headers.location || rentriResponse.headers.Location;
      return res.status(303).json({ stato: 'completata', transazione_id: transazioneId, location });
    }

    const errorData = await rentriResponse.json().catch(() => ({}));
    console.error('[RENTRI-POLLING] Errore RENTRI:', status, JSON.stringify(errorData).substring(0, 200));
    return res.status(status).json({ error: 'Errore recupero stato transazione', status, details: errorData });

  } catch (error) {
    console.error('[RENTRI-POLLING] Errore status:', error.message);
    return res.status(500).json({ error: 'Errore interno', details: error.message });
  }
});

// ══════════════════════════════════════════════════════
// ENDPOINT: Risultato transazione + aggiornamento DB
// ══════════════════════════════════════════════════════
app.get('/api/rentri/transazioni/:id/result', async (req, res) => {
  try {
    const transazioneId = req.params.id;
    const { org_id, registro_id, environment = 'demo' } = req.query;
    console.log('[RENTRI-POLLING] Richiesta result:', { transazioneId, org_id, registro_id, environment });

    if (!org_id || !registro_id) {
      return res.status(400).json({ error: 'org_id e registro_id richiesti' });
    }

    const { finalOrgId, finalEnvironment } = await resolveOrgAndEnv(org_id, registro_id, environment);

    const cert = await getCertificate(finalOrgId, finalEnvironment);
    if (!cert) {
      console.error('[RENTRI-POLLING] Certificato non trovato');
      return res.status(404).json({ error: 'Certificato RENTRI non trovato' });
    }

    let jwtAuth;
    try {
      jwtAuth = generateJWTForCert(cert, finalEnvironment);
      console.log('[RENTRI-POLLING] JWT generato per result');
    } catch (jwtError) {
      console.error('[RENTRI-POLLING] Errore generazione JWT:', jwtError.message);
      return res.status(500).json({ error: 'Errore generazione JWT', details: jwtError.message });
    }

    const rentriUrl = `${RENTRI_PROXY_URL}/dati-registri/v1.0/${transazioneId}/result`;
    console.log('[RENTRI-POLLING] Chiamata RENTRI result:', rentriUrl);

    const rentriResponse = await httpRequest(rentriUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${jwtAuth}`,
        'Content-Type': 'application/json'
      }
    });

    const status = rentriResponse.status;
    console.log('[RENTRI-POLLING] Risposta RENTRI result:', status);

    if (status === 200) {
      const resultData = await rentriResponse.json();

      // ─── Aggiorna movimenti nel database ───
      if (resultData && !resultData.errore) {
        const { data: movimenti, error: movError } = await supabase
          .from('rentri_movimenti')
          .select('id')
          .eq('registro_id', registro_id)
          .eq('org_id', finalOrgId)
          .eq('sync_status', 'in_trasmissione')
          .not('transazione_id', 'is', null);

        if (!movError && movimenti && movimenti.length > 0) {
          // Estrai identificativi da esito
          const identificativi = [];
          if (resultData.esito && resultData.esito.numero_registrazioni) {
            resultData.esito.numero_registrazioni.forEach(reg => {
              if (reg.identificativo) identificativi.push(reg.identificativo);
            });
          }

          const updateData = {
            sync_status: 'trasmesso',
            rentri_stato: 'validato',
            sync_at: new Date().toISOString(),
            sync_error: null
          };

          if (identificativi.length > 0 && identificativi.length === movimenti.length) {
            // Mappa identificativi 1:1 con movimenti
            for (let i = 0; i < movimenti.length; i++) {
              await supabase
                .from('rentri_movimenti')
                .update({ ...updateData, rentri_id: identificativi[i] })
                .eq('id', movimenti[i].id);
            }
          } else {
            // Aggiorna tutti insieme
            await supabase
              .from('rentri_movimenti')
              .update(updateData)
              .in('id', movimenti.map(m => m.id));
          }

          console.log('[RENTRI-POLLING] Aggiornati', movimenti.length, 'movimenti → trasmesso');
        } else if (movError) {
          console.error('[RENTRI-POLLING] Errore ricerca movimenti:', movError.message);
        }
      } else if (resultData && resultData.errore) {
        // Aggiorna movimenti con errore
        const { data: movimenti } = await supabase
          .from('rentri_movimenti')
          .select('id')
          .eq('registro_id', registro_id)
          .eq('org_id', finalOrgId)
          .eq('sync_status', 'in_trasmissione');

        if (movimenti && movimenti.length > 0) {
          await supabase
            .from('rentri_movimenti')
            .update({
              sync_status: 'error',
              sync_error: JSON.stringify(resultData),
              sync_at: new Date().toISOString()
            })
            .in('id', movimenti.map(m => m.id));

          console.log('[RENTRI-POLLING] Aggiornati', movimenti.length, 'movimenti → error');
        }
      }

      return res.status(200).json(resultData);
    }

    const errorData = await rentriResponse.json().catch(() => ({}));
    console.error('[RENTRI-POLLING] Errore RENTRI result:', status, JSON.stringify(errorData).substring(0, 200));
    return res.status(status).json({ error: 'Errore recupero risultato transazione', status, details: errorData });

  } catch (error) {
    console.error('[RENTRI-POLLING] Errore result:', error.message);
    return res.status(500).json({ error: 'Errore interno', details: error.message });
  }
});

// ══════════════════════════════════════════════════════
// HEALTH CHECK
// ══════════════════════════════════════════════════════
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'rentri-polling',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// ══════════════════════════════════════════════════════
// START SERVER
// ══════════════════════════════════════════════════════
app.listen(PORT, () => {
  console.log(`[RENTRI-POLLING] Server avviato sulla porta ${PORT}`);
});
