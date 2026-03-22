# SDI-SFTP - Prossimi Passi

## ✅ Completato

1. ✅ Struttura codice implementata
2. ✅ Commit codice su website
3. ✅ Dipendenze npm installate
4. ✅ Certificati caricati sulla VPS

## ⏳ Prossimi Passi

### 1. Configurare Variabili d'Ambiente su Vercel

Aggiungere su Vercel (Project Settings → Environment Variables):

```env
# SFTP Config
SDI_SFTP_HOST=217.154.118.37
SDI_SFTP_PORT=22
SDI_SFTP_USERNAME=sdi
SDI_SFTP_PRIVATE_KEY=<chiave_ssh_privata_per_connessione_vps>
SDI_SFTP_TEST_MODE=true

# Certificati Path (sulla VPS, non su Vercel)
SDI_CERT_FIRMA_PATH=/opt/sdi-certs/EMMAT002.SCZMNL05L21D960T.firma.p12
SDI_CERT_CIFRA_PATH=/opt/sdi-certs/EMMAT002.SCZMNL05L21D960T.cifra.p12
SDI_CERT_SOGEI_PUBLIC_PATH=/opt/sdi-certs/sogeiunicocifra.pem
SDI_CERT_PASSWORD=IBVvOZqq
```

**Nota importante**: I certificati sono sulla VPS (`/opt/sdi-certs/`), ma il codice Next.js gira su Vercel. Ci sono due opzioni:

#### Opzione A: Server Node.js sulla VPS (Consigliato)
- Creare un server Node.js sulla VPS che gestisce SFTP
- Next.js chiama questo server via API
- I certificati rimangono sulla VPS

#### Opzione B: Caricare certificati su Vercel (Non consigliato per sicurezza)
- Caricare certificati come secret su Vercel
- Next.js accede direttamente a SFTP VPS

### 2. Testare Connessione SFTP

```bash
# Test manuale
sftp -i <chiave_privata> sdi@217.154.118.37

# Una volta connessi:
cd DatiVersoSdITest
ls
```

### 3. Perfezionare Implementazione

- **Generazione XML FatturaPA completa**: Attualmente è solo un placeholder
  - Riferimento: `desktop-app/.../supabase/functions/sdi_send/index.ts`
  - Implementare conformità FatturaPA 1.2.2 completa

- **Verifica algoritmi firma/cifratura**: Consultare manuale `SDI_SFTP_Massivi_v2.pdf`
  - Verificare formato PKCS#7 esatto
  - Verificare algoritmo cifratura AES

- **Gestione progressivo**: Implementare sistema incrementale per evitare duplicati

- **IdNodo per organizzazione**: Recuperare da configurazione org invece di hardcoded

### 4. Funzionalità Aggiuntive

- Monitoraggio directory `/DatiDaSdI` per file ricevuti (EO, ER, FO)
- Processamento file ricevuti
- Aggiornamento stato fatture nel database

## 📝 Note Tecniche

- **Password certificati**: `IBVvOZqq`
- **Password VPS root**: `1x9Wa2eW`
- **Test Mode**: Iniziare con `SDI_SFTP_TEST_MODE=true`
- **IdNodo attuale**: `SCZMNL05L21D960T` (hardcoded, da configurare)

## 🚀 Stato Attuale

Il codice base è pronto. Manca principalmente:
1. Configurazione variabili d'ambiente
2. Perfezionamento generazione XML FatturaPA
3. Test end-to-end

