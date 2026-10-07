const https = require('https');
const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');

// Configurazione Supabase (da variabili d'ambiente o configurazione)
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ienzdgrqalltvkdkuamp.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('SUPABASE_SERVICE_ROLE_KEY non configurata!');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Niente ripiego pubblico: con il segreto scritto nel codice chiunque puo'
// firmarsi un token e presentarlo a /api/auth/verify (il sito l'ha tolto
// l'11/06 per questo). Se la variabile manca il processo si ferma, come per la
// service role qui sopra: meglio un pm2 che non parte, e lo dice, di un
// server che accetta token forgiati.
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('JWT_SECRET non configurata!');
  process.exit(1);
}

async function handleExchange(req, res) {
  try {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    
    await new Promise(resolve => req.on('end', resolve));
    
    const { code, app_id } = JSON.parse(body);
    // Il codice vale una sessione: nel log solo l'inizio, come fa auth-js
    // col refresh token.
    console.log('[Exchange] Received:', { code: typeof code === 'string' ? `${code.slice(0, 10)}…` : code, app_id });
    
    if (!code || !app_id) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Missing required parameters' }));
      return;
    }
    
    // Verifica E CONSUMA il codice in un colpo solo.
    //
    // Prima erano due passi: una SELECT con `used = false`, poi un UPDATE
    // `used = true` di cui NESSUNO leggeva l'errore. E l'errore c'era sempre:
    // sulla tabella girava un trigger che scriveva una colonna `updated_at`
    // inesistente, quindi l'UPDATE falliva in silenzio e i codici restavano
    // `used = false` per tutta la loro vita (350 su 350 nel database al
    // 08/10/2026). Un codice «a uso singolo» era riutilizzabile per 5 minuti
    // da chiunque lo intercettasse.
    //
    // Adesso l'UPDATE con `used = false` nella condizione e' il lucchetto: se
    // non torna nessuna riga il codice e' sconosciuto, scaduto o gia' usato —
    // anche da un secondo scambio partito un istante prima di questo. E se
    // l'UPDATE fallisce, lo scambio fallisce: meglio un accesso da rifare che
    // un codice che vale due volte.
    const { data: righe, error: oauthError } = await supabase
      .from('oauth_codes')
      .update({ used: true })
      .eq('code', code)
      .eq('app_id', app_id)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .select();

    // Due casi diversi, due risposte diverse. Un errore del DATABASE (per
    // esempio il trigger che scriveva updated_at su una colonna inesistente) e'
    // un guasto nostro: 500, e nel log si legge il perche'. «Nessuna riga» e'
    // invece il codice sconosciuto, scaduto o gia' usato: 400. Prima erano la
    // stessa cosa, e un guasto del database arrivava all'autista come «hai
    // lasciato la pagina aperta troppo a lungo, riprova» — a riprovare
    // all'infinito.
    if (oauthError) {
      console.error('[Exchange] UPDATE oauth_codes fallito (guasto nostro, non del codice):', oauthError.code, oauthError.message, oauthError.details || '');
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Server error' }));
      return;
    }
    const oauthData = Array.isArray(righe) ? righe[0] : null;
    if (!oauthData) {
      console.warn('[Exchange] OAuth code not found, expired or already used');
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid or expired OAuth code' }));
      return;
    }

    // Recupera dati utente
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', oauthData.user_id)
      .single();
    
    if (userError || !userData) {
      console.error('[Exchange] User not found:', userError);
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'User not found' }));
      return;
    }
    
    // Genera token
    const accessToken = jwt.sign(
      {
        user_id: oauthData.user_id,
        app_id: app_id,
        type: 'access',
        email: userData.email,
        full_name: userData.full_name
      },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    const refreshToken = jwt.sign(
      {
        user_id: oauthData.user_id,
        app_id: app_id,
        type: 'refresh'
      },
      JWT_SECRET,
      { expiresIn: '30d' }
    );
    
    // Salva token
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    const { error: tokenError } = await supabase
      .from('oauth_tokens')
      .insert({
        user_id: oauthData.user_id,
        app_id: app_id,
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_at: expiresAt,
        scope: 'read write',
        is_active: true
      });
    
    if (tokenError) {
      console.error('[Exchange] Error saving tokens:', tokenError);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to save tokens' }));
      return;
    }
    
    // Genera magic link Supabase per creare sessione auth reale nel client
    // Questo permette a auth.uid() di funzionare nelle policy RLS
    let supabaseSession = null;
    try {
      const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email: userData.email,
      });
      
      if (!linkError && linkData && linkData.properties && linkData.properties.hashed_token) {
        supabaseSession = {
          hashed_token: linkData.properties.hashed_token,
          type: 'magiclink',
        };
        console.log('[Exchange] Supabase magic link generated for RLS session');
      } else {
        console.warn('[Exchange] Could not generate Supabase session:', linkError ? linkError.message : 'no hashed_token');
      }
    } catch (sessionErr) {
      console.warn('[Exchange] Supabase session generation failed:', sessionErr.message || sessionErr);
    }
    
    // Risposta
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({
      success: true,
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: 'Bearer',
      expires_in: 3600,
      user: {
        id: userData.id,
        email: userData.email,
        full_name: userData.full_name,
        avatar_url: userData.avatar_url
      },
      supabase_session: supabaseSession
    }));
    
  } catch (error) {
    console.error('[Exchange] Error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Internal server error' }));
  }
}

module.exports = { handleExchange };
