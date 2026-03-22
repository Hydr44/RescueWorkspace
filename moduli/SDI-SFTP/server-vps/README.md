# SDI-SFTP Server VPS

Server Node.js sulla VPS per gestione SFTP SDI.

## Installazione

```bash
cd /opt/sdi-sftp-server
npm install
```

## Configurazione

Aggiungere a `/root/.env`:

```env
# SDI-SFTP Server
SDI_SFTP_PORT=3002
SDI_SFTP_HOST=127.0.0.1
SDI_SFTP_PORT_SFTP=22
SDI_SFTP_USERNAME=sdi
SDI_SFTP_PRIVATE_KEY=/root/.ssh/sdi_sftp_key
SDI_SFTP_TEST_MODE=true

# Certificati
SDI_CERT_FIRMA_PATH=/opt/sdi-certs/EMMAT002.SCZMNL05L21D960T.firma.p12
SDI_CERT_CIFRA_PATH=/opt/sdi-certs/EMMAT002.SCZMNL05L21D960T.cifra.p12
SDI_CERT_SOGEI_PUBLIC_PATH=/opt/sdi-certs/sogeiunicocifra.pem
SDI_CERT_PASSWORD=IBVvOZqq

# Supabase (già presenti per RENTRI)
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```

## Avvio con PM2

```bash
pm2 start server.js --name sdi-sftp-server
pm2 save
pm2 startup
```

## Monitoraggio

```bash
pm2 logs sdi-sftp-server
pm2 status
pm2 restart sdi-sftp-server
```

