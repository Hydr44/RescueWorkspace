# 🧪 Preparazione Test SDI-SFTP

## ✅ Stato Attuale

### Implementazione Completa
- ✅ Desktop App: `sendInvoiceToSDI` chiama `/api/sdi-sftp/send`
- ✅ API Vercel: Route `/api/sdi-sftp/send` configurata (proxy a VPS)
- ✅ Server VPS: Online e funzionante (porta 3004)
- ✅ Generazione XML: FatturaPA 1.2.2 completa
- ✅ Certificati: Caricati e configurati

### Da Verificare Prima dei Test
- ⚠️ Test end-to-end non ancora eseguiti
- ⚠️ Verificare connessione SFTP effettiva
- ⚠️ Verificare firma e cifratura file
- ⚠️ Verificare naming convention file
- ⚠️ Verificare upload su directory corretta

## 📋 Checklist Pre-Test

### 1. Verifiche Server VPS
- [x] Server online (PM2)
- [x] Health check OK
- [x] Certificati presenti
- [ ] Test connessione SFTP locale
- [ ] Verificare directory `/var/sftp/sdi/DatiVersoSdITest`

### 2. Verifiche Desktop App
- [x] `sendInvoiceToSDI` aggiornato
- [x] `orgId` passato correttamente
- [ ] Fattura di test con codici destinatario validi
- [ ] Fattura validata prima dell'invio

### 3. Verifiche API
- [x] Route Vercel configurata
- [x] Proxy a VPS funzionante
- [ ] Test chiamata API completa

## 🎯 Codici Destinatario Test

Vedi `CODICI_DESTINATARIO_TEST.md` per i codici da usare.

## ⚠️ Note Importanti

1. **Ambiente TEST**: Usare codici destinatario TEST forniti
2. **Validazione**: Fattura deve essere validata prima dell'invio
3. **Directory**: File caricati su `/DatiVersoSdITest` (test mode)
4. **Monitoraggio**: Controllare log server VPS per errori
5. **Progressivo**: Attualmente fisso (da implementare per produzione)

## 🚀 Come Testare

1. Aprire Desktop App
2. Creare nuova fattura con codice destinatario TEST
3. Validare fattura (genera XML)
4. Cliccare "Invia a SDI" (test mode)
5. Verificare log server VPS
6. Verificare file su SFTP `/DatiVersoSdITest`
7. Attendere processamento SDI

