# SDI-SFTP - Riepilogo Implementazione

## ✅ Cosa è Stato Implementato

### 1. Utility Base (`website/src/lib/sdi-sftp/`)
- **utils.ts**: Funzioni per naming convention file SDI, calcolo date giuliane, parsing nomi file
- **crypto.ts**: Funzioni base per firma (PKCS#7) e cifratura (AES) - **da perfezionare secondo manuale SDI**
- **client.ts**: Client SFTP per connessione, upload, download file

### 2. API Route (`website/src/app/api/sdi-sftp/`)
- **send/route.ts**: Endpoint POST per invio fatture via SFTP
  - Carica fatture da database
  - Genera ZIP con XML fatture
  - Firma e cifra file
  - Upload su SFTP
  - Aggiorna stato fatture

### 3. Documentazione
- **SDI_SFTP_IMPLEMENTAZIONE.md**: Piano di implementazione
- **SDI_SFTP_CONFIGURAZIONE.md**: Guida configurazione certificati e variabili d'ambiente

## ⚠️ Da Fare PRIMA di Testare

### 1. Installare Dipendenze
```bash
cd website
npm install ssh2-sftp-client adm-zip @types/node-ssh2-sftp-client --save
```

### 2. Configurare Certificati sul Server
I certificati devono essere caricati sul server (VPS o Vercel):
- `EMMAT002.SCZMNL05L21D960T.firma.p12`
- `EMMAT002.SCZMNL05L21D960T.cifra.p12`
- `sogeiunicocifra.pem`
- `CAEntrate.pem`

Vedi `SDI_SFTP_CONFIGURAZIONE.md` per dettagli.

### 3. Configurare Variabili d'Ambiente
Aggiungere variabili d'ambiente per:
- Configurazione SFTP (host, port, username, private key)
- Path certificati
- Password certificati

### 4. Verificare Algoritmi Firma/Cifratura
Gli algoritmi implementati in `crypto.ts` sono una base - **verificare con manuale SDI_SFTP_Massivi_v2.pdf** che siano conformi alle specifiche SDI.

## 📝 TODO Rimanenti

1. **Generazione XML FatturaPA completa**
   - Attualmente è solo un placeholder
   - Implementare generazione conforme FatturaPA 1.2.2
   - Riferimento: `desktop-app/.../supabase/functions/sdi_send/index.ts` ha esempio di generazione XML

2. **Monitoraggio Directory Ricezione**
   - Implementare cron/script per monitorare `/DatiDaSdI`
   - Rilevare file con estensione completa (`.xml`, `.run`, `.p7m.enc`)

3. **Processamento File Ricevuti**
   - Processare file EO (esiti)
   - Processare file ER (scarti)
   - Processare file FO (fatture ricevute)

4. **Gestione Progressivo**
   - Implementare gestione progressivo incrementale
   - Evitare duplicati progressivi

5. **IdNodo per Organizzazione**
   - Recuperare IdNodo (P.IVA) da configurazione organizzazione
   - Attualmente hardcoded

## 🔧 Note Tecniche

### Firma e Cifratura
- Firma: PKCS#7 (implementata con node-forge)
- Cifratura: AES-256-CBC (implementata con node-forge)
- **IMPORTANTE**: Verificare formato esatto richiesto da SDI - potrebbe essere necessario formato PKCS#7 EnvelopedData specifico

### Naming Convention
- File inviati: `FI.{IdNodo}.{aaaaggg}.{hhmm}.{nnn}.zip`
- File ricevuti: `EO.{IdNodo}.{aaaaggg}.{hhmm}.{nnn}.xml` (esiti)
- File ricevuti: `ER.{IdNodo}.{aaaaggg}.{hhmm}.{nnn}.run` (scarti)
- File ricevuti: `FO.{IdNodo}.{aaaaggg}.{hhmm}.{nnn}.zip.p7m.enc` (fatture)

### Directory SFTP
- Test: `/DatiVersoSdITest` (upload), `/DatiDaSdITest` (download)
- Produzione: `/DatiVersoSdI` (upload), `/DatiDaSdI` (download)

## 🚀 Prossimi Passi

1. Installare dipendenze npm
2. Caricare certificati sul server
3. Configurare variabili d'ambiente
4. Testare connessione SFTP manualmente
5. Perfezionare generazione XML FatturaPA
6. Testare invio prima fattura via SFTP
7. Implementare monitoraggio e processamento file ricevuti

## 📚 Riferimenti

- Manuali: `/moduli/SDI-SFTP/manuali/`
- Certificati: `/moduli/SDI-SFTP/Chiavi erogate con istruzioni/`
- Configurazione server: `/moduli/SDI-SFTP/CONFIGURAZIONE_COMPLETATA.md`

