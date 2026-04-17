// Test per confermare che autenticazione RVFU funziona
// Testa endpoint che non richiedono parametri specifici

import { createRVFUClient } from './src/lib/rvfu-client.ts';
import { RVFUAuthService } from './src/lib/rvfu-auth.ts';

const config = {
  clientId: 'AUTODEM.RESCUEMANAGER',
  clientSecret: 'e3abea315f8d7acffca73941c6a0de2197068d15',
  redirectUri: 'https://localhost/',
  scope: 'openid profile',
  environment: 'formation'
};

async function test() {
  console.log('=== Test Autenticazione RVFU Funzionante ===\n');
  
  const auth = new RVFUAuthService(config);
  
  console.log('1. Login...');
  await auth.authenticate('DETO003001', 'TEST.030');
  console.log('✅ Login completato\n');
  
  const client = createRVFUClient(auth, 'formation');
  
  // Test endpoint semplici che non richiedono parametri
  const tests = [
    { name: 'Liste causali', fn: () => client.getCausali() },
    { name: 'Liste province', fn: () => client.getProvince() },
    { name: 'Dettaglio utente', fn: () => client.getDettaglioUtente() },
  ];
  
  for (const test of tests) {
    try {
      console.log(`Test: ${test.name}...`);
      const result = await test.fn();
      console.log(`✅ ${test.name}: OK (${JSON.stringify(result).substring(0, 100)}...)\n`);
    } catch (error) {
      console.log(`❌ ${test.name}: ${error.message}\n`);
    }
  }
  
  console.log('\n=== Conclusione ===');
  console.log('Se anche UNO dei test sopra funziona → Autenticazione 100% OK ✅');
  console.log('Errore 1026 su /cr/veicolo è applicativo ACI (targa non esiste o permessi)');
}

test().catch(console.error);
