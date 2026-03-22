# Setup Completo Server SDI-SFTP sulla VPS

## Passo 1: Caricare File Server sulla VPS

```bash
# Dalla macchina locale
cd /Users/sign.rascozzarini/Projects/rescuemanager-workspace/moduli/SDI-SFTP

# Crea directory sulla VPS
ssh root@217.154.118.37 "mkdir -p /opt/sdi-sftp-server"

# Carica file
scp server-vps/server.js root@217.154.118.37:/opt/sdi-sftp-server/
scp server-vps/package.json root@217.154.118.37:/opt/sdi-sftp-server/
```

## Passo 2: Installare Dipendenze

```bash
ssh root@217.154.118.37
cd /opt/sdi-sftp-server
npm install
```

## Passo 3: Configurare Variabili d'Ambiente

Aggiungere a `/root/.env` (già esistente per RENTRI):

```bash
ssh root@217.154.118.37
nano /root/.env
```

Aggiungere:

```env
# SDI-SFTP Server
SDI_SFTP_PORT=3002
SDI_SFTP_HOST=127.0.0.1
SDI_SFTP_PORT_SFTP=22
SDI_SFTP_USERNAME=sdi
SDI_SFTP_PRIVATE_KEY=/root/.ssh/sdi_sftp_key
SDI_SFTP_TEST_MODE=true

# Certificati (già caricati)
SDI_CERT_FIRMA_PATH=/opt/sdi-certs/EMMAT002.SCZMNL05L21D960T.firma.p12
SDI_CERT_CIFRA_PATH=/opt/sdi-certs/EMMAT002.SCZMNL05L21D960T.cifra.p12
SDI_CERT_SOGEI_PUBLIC_PATH=/opt/sdi-certs/sogeiunicocifra.pem
SDI_CERT_PASSWORD=IBVvOZqq
```

**Nota**: `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` dovrebbero essere già presenti.

## Passo 4: Generare Chiave SSH per Utente SDI (se necessario)

```bash
ssh root@217.154.118.37

# Genera chiave SSH (se non esiste)
ssh-keygen -t rsa -b 4096 -f /root/.ssh/sdi_sftp_key -N ""

# Aggiungi chiave pubblica a authorized_keys di sdi
cat /root/.ssh/sdi_sftp_key.pub >> /var/sftp/sdi/.ssh/authorized_keys
chmod 600 /var/sftp/sdi/.ssh/authorized_keys
chown sdi:sdi /var/sftp/sdi/.ssh/authorized_keys
```

## Passo 5: Configurare Nginx

Aggiungere a `/etc/nginx/sites-available/rentri`:

```nginx
# SDI-SFTP Server
location /api/sdi-sftp/ {
    proxy_pass http://127.0.0.1:3002/api/sdi-sftp/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
}
```

Test e reload:

```bash
nginx -t
systemctl reload nginx
```

## Passo 6: Avviare Server con PM2

```bash
ssh root@217.154.118.37
cd /opt/sdi-sftp-server
pm2 start server.js --name sdi-sftp-server
pm2 save
```

## Passo 7: Test

```bash
# Test health check locale
curl http://localhost:3002/health

# Test health check via Nginx (se configurato dominio)
curl https://sdi-sftp.rescuemanager.eu/api/sdi-sftp/health
```

## Monitoraggio

```bash
# Log server
pm2 logs sdi-sftp-server

# Status
pm2 status
pm2 info sdi-sftp-server

# Riavvia
pm2 restart sdi-sftp-server
```

## Prossimi Passi

1. Aggiornare route Vercel per proxy a VPS
2. Perfezionare generazione XML FatturaPA
3. Testare invio fattura end-to-end

