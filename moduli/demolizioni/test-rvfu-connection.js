#!/usr/bin/env node

/**
 * Script di test per verificare la connettività agli endpoint RVFU
 * Richiede VPN ACI attiva
 */

const https = require('https');
const http = require('http');

const BASE_URL_FORMATION = 'http://gestione-veicolo-fuoriuso-tst.serviziaci.it:80';
const BASE_URL_PRODUCTION = 'http://gestione-veicolo-fuoriuso.serviziaci.it:80';

// Credenziali dal file Leggimi
const VPN_CREDENTIALS = {
  username: 'swh.scorazzini',
  password: 'Vpn-2011',
};

const SOFTWARE_HOUSE_CREDENTIALS = {
  codice: 'AUTODEM.RESCUEMANAGER',
  sicurezza: 'R2Y2L9T2',
};

const AGENCY_CREDENTIALS = {
  matricola: 'DETO003001',
  password: 'TEST.030',
};

function testEndpoint(url, method = 'GET', headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const httpModule = isHttps ? require('https') : require('http');
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'User-Agent': 'RescueManager-RVFU-Test/1.0',
        ...headers,
      },
      rejectUnauthorized: isHttps, // Verifica certificati SSL solo per HTTPS
    };

    const req = httpModule.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data,
          success: res.statusCode >= 200 && res.statusCode < 400,
        });
      });
    });

    req.on('error', (error) => {
      reject({
        error: error.message,
        code: error.code,
        hostname: urlObj.hostname,
      });
    });

    if (body) {
      req.write(body);
    }
    
    req.end();
  });
}

async function testConnection() {
  console.log('🧪 Test connettività endpoint RVFU\n');
  console.log('⚠️  Assicurati di essere connesso alla VPN ACI!');
  console.log('    Gateway VPN: ilportaledellautomobilista.it/utentiMCTC\n');

  const tests = [
    {
      name: 'Test 1: Base URL Formation (HTTP)',
      url: BASE_URL_FORMATION,
      description: 'Verifica che il server risponda',
    },
    {
      name: 'Test 2: Endpoint Monitoraggio Status',
      url: `${BASE_URL_FORMATION}/demolitori-aci-ws/mon/status/up`,
      description: 'Test endpoint monitoraggio (non richiede auth)',
    },
    {
      name: 'Test 3: Endpoint SSO Authenticate',
      url: `${BASE_URL_FORMATION}/sso/json/authenticate`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-OpenAM-Username': VPN_CREDENTIALS.username,
        'X-OpenAM-Password': VPN_CREDENTIALS.password,
      },
      body: JSON.stringify({}),
      description: 'Test endpoint autenticazione OpenAM',
    },
    {
      name: 'Test 4: Endpoint OAuth2 Authorize',
      url: `${BASE_URL_FORMATION}/oauth2/authorize?response_type=code&client_id=test`,
      description: 'Verifica endpoint OAuth2 (potrebbe richiedere autenticazione)',
    },
  ];

  for (const test of tests) {
    console.log(`\n📡 ${test.name}`);
    console.log(`   ${test.description}`);
    console.log(`   URL: ${test.url}`);
    
    try {
      const result = await testEndpoint(
        test.url,
        test.method || 'GET',
        test.headers || {},
        test.body || null
      );
      
      if (result.success) {
        console.log(`   ✅ Status: ${result.status}`);
        if (result.body && result.body.length < 500) {
          console.log(`   📄 Response: ${result.body.substring(0, 200)}...`);
        }
      } else {
        console.log(`   ⚠️  Status: ${result.status}`);
        if (result.status === 401 || result.status === 403) {
          console.log(`   ℹ️  Endpoint raggiungibile ma richiede autenticazione corretta`);
        }
      }
    } catch (error) {
      if (error.code === 'ENOTFOUND' || error.code === 'ERR_NAME_NOT_RESOLVED') {
        console.log(`   ❌ ERRORE: DNS non risolto - VPN non attiva o hostname errato`);
        console.log(`   💡 Verifica che la VPN ACI sia connessa`);
      } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED') {
        console.log(`   ❌ ERRORE: Timeout/Connessione rifiutata - ${error.message}`);
      } else {
        console.log(`   ❌ ERRORE: ${error.message} (${error.code})`);
      }
    }
    
    // Pausa tra le richieste
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n\n📊 Riepilogo test completato');
  console.log('\n💡 Note:');
  console.log('   - Status 401/403 sono normali se le credenziali non sono valide');
  console.log('   - Status 200 significa che l\'endpoint è raggiungibile');
  console.log('   - Errori DNS indicano che la VPN non è attiva');
}

// Esegui test
testConnection().catch(console.error);

