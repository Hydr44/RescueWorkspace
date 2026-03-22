# Analisi Requisiti SDI-SFTP dai Manuali

## 📋 Documento Analizzato
- **SDI_SFTP_Massivi_v2**: Evoluzione sistemi di sicurezza
- **Istruzioni-SDIFTP-v4.3**: Manuale completo servizio SDIFTP

## ✅ Requisiti Identificati (obbligatori dal 1° gennaio 2023)

### Algoritmi Richiesti
- **Algoritmo hash**: SHA-256 ✅ (implementato)
- **Algoritmo cifratura contenuto**: AES-256 ✅ (implementato)
- **Lunghezza chiavi RSA**:
  - Cifratura: **4096 bit**
  - Firma: **4096/2048 bit**

### ❓ Informazioni Mancanti nei Documenti
I manuali **NON specificano**:
- Se serve **RSA-OAEP** o **RSA-PKCS1-v1_5** per cifrare la chiave simmetrica in PKCS#7 EnvelopedData
- Dettagli specifici sulla struttura PKCS#7 EnvelopedData (oltre al fatto che è richiesto)

## 🔍 Problema Identificato

### Implementazione Attuale
- Usiamo `node-forge` con `forge.pkcs7.createEnvelopedData()`
- `node-forge` usa **RSA-PKCS1-v1_5** di default per cifrare la chiave simmetrica
- Se SDI richiede **RSA-OAEP**, il file verrà rifiutato

### Evidenza
- SDI si è collegato alle 00:55 (5 minuti dopo il caricamento del file alle 00:50)
- Il file **non è stato prelevato**
- Questo suggerisce che SDI ha verificato il file ma lo ha rifiutato (probabile problema di formato/cifratura)

## 🎯 Prossimi Passi

1. **Verificare file di errore ER** su SFTP (SDI potrebbe aver generato un file di scarto)
2. **Contattare SDI/Sogei** (`servizicrittograficiftp@sogei.it`) per confermare:
   - Algoritmo RSA richiesto (OAEP vs PKCS1)
   - Dettagli specifici su PKCS#7 EnvelopedData
3. **Verificare certificati forniti** (potrebbero contenere indicazioni)

## 📝 Note

- Il manuale `Istruzioni-SDIFTP-v4.3` contiene una sezione "6. SPECIFICHE DI SICUREZZA E CRITTOGRAFIA" (pagina 25)
- Questa sezione è stata integrata nella versione 4.2 (13 settembre 2022)
- Potrebbe contenere informazioni aggiuntive non visibili nell'estratto testo

