// test-sentry.js - Test invio errori a GlitchTip
const https = require('https');

const DSN = 'https://06cbf7995d244424b5b2b5ef90541636@errors.rescuemanager.eu/1';
const PROJECT_ID = '1';

// Crea 3 tipi di errori diversi
const errors = [
  {
    type: 'TypeError',
    value: 'Cannot read property "map" of undefined - Test da Cascade',
    filename: 'src/pages/Transports.jsx',
    function: 'handleExport',
    lineno: 547,
    level: 'error'
  },
  {
    type: 'NetworkError',
    value: 'Failed to fetch transport data - Test da Cascade',
    filename: 'src/hooks/useTransportsCache.js',
    function: 'fetchTransports',
    lineno: 107,
    level: 'error'
  },
  {
    type: 'ValidationError',
    value: 'Invalid phone number format - Test da Cascade',
    filename: 'src/lib/validators.js',
    function: 'validatePhone',
    lineno: 25,
    level: 'warning'
  }
];

function sendError(error, index) {
  return new Promise((resolve, reject) => {
    const timestamp = Math.floor(Date.now() / 1000);
    const eventId = require('crypto').randomBytes(16).toString('hex');
    
    const event = {
      event_id: eventId,
      timestamp: timestamp,
      platform: 'javascript',
      sdk: {
        name: 'sentry.javascript.electron',
        version: '4.0.0'
      },
      exception: {
        values: [{
          type: error.type,
          value: error.value,
          stacktrace: {
            frames: [{
              filename: error.filename,
              function: error.function,
              lineno: error.lineno,
              colno: 12,
              in_app: true
            }]
          }
        }]
      },
      level: error.level,
      environment: 'production',
      release: '1.0.0',
      user: {
        id: 'cascade-test-user',
        email: 'test@rescuemanager.eu',
        username: 'Test User'
      },
      tags: {
        test: 'cascade_integration',
        test_number: (index + 1).toString()
      },
      contexts: {
        organization: {
          org_id: 'test-org-cascade-123'
        }
      }
    };

    const payload = JSON.stringify(event);
    
    const options = {
      hostname: 'errors.rescuemanager.eu',
      port: 443,
      path: `/api/${PROJECT_ID}/store/`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        'X-Sentry-Auth': `Sentry sentry_key=06cbf7995d244424b5b2b5ef90541636, sentry_version=7, sentry_client=test-script/1.0.0`
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        console.log(`✅ Errore ${index + 1} inviato - Status: ${res.statusCode}`);
        console.log(`   Type: ${error.type}`);
        console.log(`   File: ${error.filename}:${error.lineno}`);
        resolve();
      });
    });

    req.on('error', (e) => {
      console.error(`❌ Errore ${index + 1} fallito:`, e.message);
      reject(e);
    });

    req.write(payload);
    req.end();
  });
}

async function main() {
  console.log('🚀 Invio 3 errori di test a GlitchTip...\n');
  
  for (let i = 0; i < errors.length; i++) {
    await sendError(errors[i], i);
    await new Promise(r => setTimeout(r, 500)); // Pausa tra invii
  }
  
  console.log('\n✅ Tutti gli errori inviati!');
  console.log('\n📊 Vai su: https://errors.rescuemanager.eu');
  console.log('   1. Fai login');
  console.log('   2. Seleziona progetto "Desktop App"');
  console.log('   3. Vedrai i 3 errori nella lista');
}

main().catch(console.error);
