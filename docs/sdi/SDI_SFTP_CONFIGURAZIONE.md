# SDI-SFTP - Configurazione e Installazione

## Dipendenze da Installare

```bash
cd website
npm install ssh2-sftp-client adm-zip --save
```

**Nota**: `@types/node-ssh2-sftp-client` non esiste - ssh2-sftp-client include già i tipi TypeScript.

## Configurazione Certificati

I certificati devono essere caricati sul server (VPS o Vercel) in una directory sicura.

### Su VPS (217.154.118.37)

```bash
# Crea directory certificati
sudo mkdir -p /opt/sdi-certs
sudo chmod 700 /opt/sdi-certs

# Carica certificati (da local machine)
scp "EMMAT002.SCZMNL05L21D960T.firma.p12" root@217.154.118.37:/opt/sdi-certs/
scp "EMMAT002.SCZMNL05L21D960T.cifra.p12" root@217.154.118.37:/opt/sdi-certs/
scp "sogeiunicocifra.pem" root@217.154.118.37:/opt/sdi-certs/
scp "CAEntrate.pem" root@217.154.118.37:/opt/sdi-certs/

# Imposta permessi
sudo chmod 600 /opt/sdi-certs/*
sudo chown root:root /opt/sdi-certs/*
```

### Variabili d'Ambiente

Aggiungere al file `.env` del server (o variabili d'ambiente Vercel):

```env
# SFTP Config
SDI_SFTP_HOST=217.154.118.37
SDI_SFTP_PORT=22
SDI_SFTP_USERNAME=sdi
SDI_SFTP_PRIVATE_KEY=<chiave_ssh_privata_per_connessione>
SDI_SFTP_TEST_MODE=true  # false per produzione

# Certificati Path
SDI_CERT_FIRMA_PATH=/opt/sdi-certs/EMMAT002.SCZMNL05L21D960T.firma.p12
SDI_CERT_CIFRA_PATH=/opt/sdi-certs/EMMAT002.SCZMNL05L21D960T.cifra.p12
SDI_CERT_SOGEI_PUBLIC_PATH=/opt/sdi-certs/sogeiunicocifra.pem
SDI_CERT_PASSWORD=IBVvOZqq
```

## Configurazione SSH Key per SFTP

Il server SFTP è configurato per autenticazione via chiave SSH.

### Generare chiave SSH (se necessario)

```bash
ssh-keygen -t rsa -b 4096 -f ~/.ssh/sdi_sftp_key -N ""
```

### Aggiungere chiave pubblica al server

```bash
# Sul server VPS, aggiungere chiave pubblica a authorized_keys dell'utente sdi
cat ~/.ssh/sdi_sftp_key.pub | ssh root@217.154.118.37 "cat >> /var/sftp/sdi/.ssh/authorized_keys"
```

### Configurare variabile d'ambiente con chiave privata

```bash
# Su Vercel, aggiungere variabile d'ambiente SDI_SFTP_PRIVATE_KEY con contenuto chiave privata
SDI_SFTP_PRIVATE_KEY=$(cat ~/.ssh/sdi_sftp_key)
```

## Test Connessione SFTP

```bash
# Test connessione manuale
sftp -i ~/.ssh/sdi_sftp_key sdi@217.154.118.37

# Una volta connessi, testare directory
cd DatiVersoSdITest
ls
```

## Note Importanti

1. **Certificati**: I certificati `.p12` contengono chiavi private - mantenere sicuri e non committare su git
2. **Password**: Password certificati (`IBVvOZqq`) - gestire come secret
3. **Test Mode**: Inizialmente usare `SDI_SFTP_TEST_MODE=true` per test
4. **IdNodo**: Configurare IdNodo (P.IVA) per ogni organizzazione
5. **Progressivo**: Gestire progressivo incrementale per evitare duplicati

## Prossimi Passi

1. ✅ Installare dipendenze npm
2. ✅ Configurare certificati su server
3. ✅ Configurare variabili d'ambiente
4. ✅ Testare connessione SFTP
5. ⏳ Implementare generazione XML FatturaPA completa
6. ⏳ Verificare algoritmo firma/cifratura secondo manuale SDI
7. ⏳ Implementare monitoraggio directory ricezione
8. ⏳ Testare invio fattura via SFTP

