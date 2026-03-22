# 📊 Stato Integrazione SDI-SFTP nel Desktop App

## ✅ Completato

1. **Server VPS SDI-SFTP**
   - ✅ Server deployato su `/opt/sdi-sftp-server/`
   - ✅ Porta 3004, PM2 attivo
   - ✅ Certificati caricati in `/opt/sdi-certs/`
   - ✅ Health check funzionante

2. **Route API Vercel**
   - ✅ `/api/sdi-sftp/send` fa proxy al server VPS
   - ✅ Gestione CORS e errori

3. **Generazione XML FatturaPA**
   - ✅ Funzione `generateFatturaPA` esistente in `supabase/functions/sdi_send/index.ts`
   - ⚠️ Server VPS ha placeholder `generateInvoiceXML` da implementare

4. **Modulo Fatture Desktop**
   - ✅ `InvoiceForm.jsx` con funzione `send()`
   - ✅ `sendInvoiceToSDI()` in `src/lib/sdi.js`
   - ⚠️ Attualmente chiama endpoint diverso (`/api/sdi/trasmissione`)

## 🔄 Da Fare

### 1. Modificare `sendInvoiceToSDI` per usare SDI-SFTP

**File**: `desktop-app/greeting-friend-api-main/src/lib/sdi.js`

**Cambiamenti**:
- Modificare endpoint da `/api/sdi/trasmissione` a `/api/sdi-sftp/send`
- Cambiare payload: invece di `{ invoice_id }` usare `{ invoice_ids: [invoice_id], org_id, test_mode }`
- Gestire risposta: `{ success, filename, invoices_sent, test_mode }`

### 2. Implementare generazione XML nel server VPS

**File**: `moduli/SDI-SFTP/server-vps/server.js`

**Cambiamenti**:
- Sostituire placeholder `generateInvoiceXML` con implementazione completa
- Usare funzione `generateFatturaPA` esistente o ricrearla
- Assicurarsi conformità FatturaPA 1.2.2

### 3. Verificare conformità manuali SDI

**Checklist**:
- ✅ Naming convention file: `FI.{IdNodo}.{aaaaggg}.{hhmm}.{nnn}.zip`
- ✅ Progressivo: Test 900-999, Produzione 000-899
- ✅ Directory: `DatiVersoSdITest` / `DatiVersoSdI`
- ⚠️ Firma digitale PKCS#7 (implementata ma da verificare)
- ⚠️ Cifratura AES-256-CBC (implementata ma da verificare)
- ⚠️ Formato ZIP corretto

### 4. Aggiungere gestione progressivo incrementale

**File**: `moduli/SDI-SFTP/server-vps/server.js`

**Necessità**:
- Gestire progressivo incrementale per organizzazione
- Evitare duplicati
- Salvare progressivo in database o file

### 5. Gestire risposta e aggiornamento fatture

**File**: `desktop-app/greeting-friend-api-main/src/pages/InvoiceForm.jsx`

**Cambiamenti**:
- Gestire risposta da `/api/sdi-sftp/send`
- Aggiornare `sdi_status` a "sent"
- Salvare `sdi_sftp_filename` in meta
- Gestire errori SFTP

## 📋 Checklist Conformità Manuali

### Manuale Sogei - Analisi Completa

#### ✅ Conforme
- [x] Server SFTP configurato (utente `sdi`)
- [x] Directory `/DatiVersoSdI` e `/DatiVersoSdITest`
- [x] Certificati caricati (firma e cifra)
- [x] Naming convention file FI
- [x] Gestione test/produzione

#### ⚠️ Da Verificare/Implementare
- [ ] Formato ZIP corretto (deve contenere XML firmato e cifrato)
- [ ] Firma PKCS#7 conforme (verificare algoritmo e formato)
- [ ] Cifratura AES-256-CBC conforme (verificare formato finale)
- [ ] Progressivo incrementale gestito correttamente
- [ ] Gestione errori e retry
- [ ] Logging completo per debugging

#### ❌ Non Implementato
- [ ] Monitoraggio directory `/DatiDaSdI` per file ricevuti (EO, ER, FO)
- [ ] Decifratura file ricevuti
- [ ] Processamento esiti EO
- [ ] Gestione scarti ER
- [ ] Gestione fatture ricevute FO

## 🎯 Priorità Implementazione

### Alta (per test immediati)
1. ✅ Modificare `sendInvoiceToSDI` per chiamare `/api/sdi-sftp/send`
2. ✅ Implementare `generateInvoiceXML` nel server VPS (o importare da funzione esistente)
3. ✅ Gestire progressivo incrementale base
4. ✅ Test end-to-end invio singola fattura

### Media (per produzione)
1. Verificare conformità firma/cifratura
2. Gestione errori completa
3. Logging dettagliato
4. Gestione progressivo robusta

### Bassa (future)
1. Monitoraggio directory ricezione
2. Decifratura e processamento file ricevuti
3. Gestione esiti EO/ER/FO
4. Report e statistiche

