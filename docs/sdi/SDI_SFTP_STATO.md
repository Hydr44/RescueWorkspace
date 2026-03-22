# SDI-SFTP - Stato Implementazione

## ✅ Completato

1. **Struttura Codice Base**
   - ✅ Utility per naming convention (`utils.ts`)
   - ✅ Utility per firma/cifratura (`crypto.ts`) - base implementata
   - ✅ Client SFTP (`client.ts`)
   - ✅ API Route per invio (`/api/sdi-sftp/send`)

2. **Documentazione**
   - ✅ Piano implementazione
   - ✅ Guida configurazione
   - ✅ Istruzioni caricamento certificati VPS

## ⏳ Da Fare

### 1. Installazione Dipendenze (URGENTE)
```bash
cd website
npm install ssh2-sftp-client adm-zip --save
```

### 2. Caricamento Certificati VPS (URGENTE)
Vedi `moduli/SDI-SFTP/CARICA_CERTIFICATI_VPS.md`

**File da caricare su `/opt/sdi-certs/`:**
- `EMMAT002.SCZMNL05L21D960T.firma.p12`
- `EMMAT002.SCZMNL05L21D960T.cifra.p12`
- `sogeiunicocifra.pem`
- `CAEntrate.pem`

**Password certificati**: `IBVvOZqq`

### 3. Configurazione Variabili d'Ambiente

Aggiungere su Vercel (o `.env` locale):

```env
# SFTP Config
SDI_SFTP_HOST=217.154.118.37
SDI_SFTP_PORT=22
SDI_SFTP_USERNAME=sdi
SDI_SFTP_PRIVATE_KEY=<chiave_ssh_privata>
SDI_SFTP_TEST_MODE=true

# Certificati Path
SDI_CERT_FIRMA_PATH=/opt/sdi-certs/EMMAT002.SCZMNL05L21D960T.firma.p12
SDI_CERT_CIFRA_PATH=/opt/sdi-certs/EMMAT002.SCZMNL05L21D960T.cifra.p12
SDI_CERT_SOGEI_PUBLIC_PATH=/opt/sdi-certs/sogeiunicocifra.pem
SDI_CERT_PASSWORD=IBVvOZqq
```

### 4. Perfezionamenti Tecnici

- ⏳ **Generazione XML FatturaPA completa** (attualmente placeholder)
- ⏳ **Verifica algoritmi firma/cifratura** secondo manuale SDI
- ⏳ **Gestione progressivo incrementale**
- ⏳ **IdNodo da configurazione organizzazione**

### 5. Funzionalità Aggiuntive

- ⏳ Monitoraggio directory `/DatiDaSdI` per file ricevuti
- ⏳ Processamento file EO (esiti)
- ⏳ Processamento file ER (scarti)
- ⏳ Processamento file FO (fatture ricevute)

## 📝 Note

- **Password certificati**: `IBVvOZqq` (da file "SPiegazione chiavi")
- **Password VPS**: `1x9Wa2eW` (per accesso root)
- **Test Mode**: Usare `SDI_SFTP_TEST_MODE=true` per iniziare i test
- **IdNodo**: Attualmente hardcoded, da configurare per organizzazione

## 🚀 Prossimi Passi Immediati

1. Eseguire `npm install` per dipendenze
2. Caricare certificati sulla VPS (vedi `CARICA_CERTIFICATI_VPS.md`)
3. Configurare variabili d'ambiente
4. Testare connessione SFTP
5. Perfezionare generazione XML FatturaPA
6. Testare invio prima fattura

