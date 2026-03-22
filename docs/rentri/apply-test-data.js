#!/usr/bin/env node
/**
 * Script per applicare i dati di test RENTRI al database Supabase
 * Uso: node apply-test-data.js
 */

const fs = require('fs');
const path = require('path');

// Leggi il file SQL
const sqlFile = path.join(__dirname, '../../desktop-app/greeting-friend-api-main/supabase/migrations/20260218_rentri_test_data_complete.sql');
const sqlContent = fs.readFileSync(sqlFile, 'utf8');

console.log('📋 ISTRUZIONI PER APPLICARE I DATI DI TEST RENTRI');
console.log('='.repeat(60));
console.log('');
console.log('1️⃣  Apri Supabase Dashboard:');
console.log('   https://supabase.com/dashboard/project/ienzdgrqalltvkdkuamp');
console.log('');
console.log('2️⃣  Vai su "SQL Editor" nel menu laterale');
console.log('');
console.log('3️⃣  Clicca "New Query"');
console.log('');
console.log('4️⃣  Copia e incolla il seguente SQL:');
console.log('');
console.log('📄 FILE SQL:');
console.log('   ' + sqlFile);
console.log('');
console.log('5️⃣  Clicca "Run" per eseguire');
console.log('');
console.log('='.repeat(60));
console.log('');
console.log('✅ DATI CHE VERRANNO INSERITI:');
console.log('   • 7 Registri (tutti i tipi)');
console.log('   • 12 Movimenti (tutte le 9 causali)');
console.log('   • 5 FIR (tutti i casi speciali)');
console.log('');
console.log('📊 CAUSALI TESTATE:');
console.log('   • NP - Nuova Produzione');
console.log('   • DT - Deposito Temporaneo');
console.log('   • RE - Recupero');
console.log('   • I - Intermediazione');
console.log('   • TR - Trasporto');
console.log('   • aT - Arrivo da Trasporto');
console.log('   • T* - Trasporto generico');
console.log('   • T*aT - Trasporto con arrivo');
console.log('   • M - Materiali');
console.log('');
console.log('🎯 CASI SPECIALI:');
console.log('   • VFU (Veicolo Fuori Uso)');
console.log('   • RAEE (Categorie AEE)');
console.log('   • Respingimento parziale');
console.log('   • Trasporto transfrontaliero');
console.log('   • Intermediario');
console.log('   • Rifiuti liquidi (litri)');
console.log('   • Rifiuti pericolosi (HP)');
console.log('');
console.log('='.repeat(60));
console.log('');
console.log('📖 Documentazione completa:');
console.log('   docs/rentri/RENTRI_TEST_DATA_COMPLETE.md');
console.log('');

// Crea anche un file SQL semplificato per copia-incolla rapido
const quickFile = path.join(__dirname, 'QUICK_APPLY.sql');
fs.writeFileSync(quickFile, sqlContent);
console.log('💾 File SQL pronto per copia-incolla:');
console.log('   ' + quickFile);
console.log('');
console.log('✨ Pronto per testare al 100%!');
