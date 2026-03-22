#!/usr/bin/env node

/**
 * Script per resettare la password di un utente Supabase
 * 
 * Utilizzo:
 *   node scripts/reset-password.js EMAIL_UTENTE
 * 
 * Oppure:
 *   node scripts/reset-password.js EMAIL_UTENTE NUOVA_PASSWORD
 */

const { createClient } = require('@supabase/supabase-js');
const readline = require('readline');

// Configurazione Supabase
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ienzdgrqalltvkdkuamp.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

// Crea client Supabase Admin
function createAdminClient() {
  if (!SUPABASE_SERVICE_KEY) {
    console.error('❌ ERRORE: SUPABASE_SERVICE_ROLE_KEY non trovata!');
    console.error('');
    console.error('Aggiungi la chiave service_role nel file .env:');
    console.error('  SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here');
    console.error('');
    console.error('Oppure esportala come variabile d\'ambiente:');
    console.error('  export SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here');
    process.exit(1);
  }

  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

// Funzione per leggere input da terminale
function askQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise(resolve => rl.question(query, ans => {
    rl.close();
    resolve(ans);
  }));
}

// Funzione per leggere password (nascondendo input)
function askPassword(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise(resolve => {
    rl.question(query, (password) => {
      rl.close();
      resolve(password);
    });
    // Nascondi input (non sempre funziona su tutti i terminali)
    rl._writeToOutput = function _writeToOutput(stringToWrite) {
      if (stringToWrite === '\r\n' || stringToWrite === '\n') {
        rl.output.write(stringToWrite);
      } else {
        rl.output.write('*');
      }
    };
  });
}

// Funzione principale
async function resetPassword() {
  console.log('🔐 RESET PASSWORD UTENTE SUPABASE');
  console.log('=====================================\n');

  // Leggi email da argomenti
  const email = process.argv[2];

  if (!email) {
    console.error('❌ ERRORE: Email non specificata!');
    console.error('');
    console.error('Utilizzo:');
    console.error('  node scripts/reset-password.js EMAIL_UTENTE');
    console.error('  node scripts/reset-password.js EMAIL_UTENTE NUOVA_PASSWORD');
    console.error('');
    process.exit(1);
  }

  console.log(`📧 Email utente: ${email}\n`);

  // Crea client admin
  const supabase = createAdminClient();

  try {
    // Cerca utente per email
    console.log('🔍 Cerca utente...');
    const { data: users, error: searchError } = await supabase.auth.admin.listUsers();

    if (searchError) {
      throw new Error(`Errore ricerca utenti: ${searchError.message}`);
    }

    const user = users?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase());

    if (!user) {
      console.error(`❌ Utente non trovato con email: ${email}`);
      console.error('');
      console.error('Utenti disponibili:');
      users?.users?.forEach(u => {
        console.error(`  - ${u.email} (id: ${u.id})`);
      });
      process.exit(1);
    }

    console.log(`✅ Utente trovato: ${user.email}`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Creato: ${user.created_at}`);
    console.log(`   Ultimo accesso: ${user.last_sign_in_at || 'Mai'}`);
    console.log('');

    // Leggi nuova password
    let newPassword = process.argv[3];

    if (!newPassword) {
      newPassword = await askPassword('🔑 Inserisci nuova password: ');
      console.log('');
      
      if (!newPassword) {
        console.error('❌ Password non può essere vuota!');
        process.exit(1);
      }

      const confirmPassword = await askPassword('🔑 Conferma nuova password: ');
      console.log('');

      if (newPassword !== confirmPassword) {
        console.error('❌ Le password non corrispondono!');
        process.exit(1);
      }

      if (newPassword.length < 6) {
        console.error('❌ Password deve essere almeno 6 caratteri!');
        process.exit(1);
      }
    }

    // Reset password
    console.log('🔄 Reset password in corso...');
    const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      { password: newPassword }
    );

    if (updateError) {
      throw new Error(`Errore reset password: ${updateError.message}`);
    }

    console.log('✅ Password resettata con successo!');
    console.log('');
    console.log('📋 Prossimi passi:');
    console.log('  1. Prova a fare login su https://rescuemanager.eu/login');
    console.log('  2. Prova login OAuth dall\'app desktop');
    console.log('  3. Se ancora non funziona, controlla i log');
    console.log('');

  } catch (error) {
    console.error(`❌ ERRORE: ${error.message}`);
    console.error('');
    console.error('Stack trace:');
    console.error(error.stack);
    process.exit(1);
  }
}

// Esegui script
if (require.main === module) {
  resetPassword()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Errore fatale:', error);
      process.exit(1);
    });
}

module.exports = { resetPassword };






