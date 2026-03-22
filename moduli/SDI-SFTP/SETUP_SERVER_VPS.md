# Setup Server SDI-SFTP sulla VPS

## Architettura Scelta: Server Node.js sulla VPS

Invece di gestire SFTP da Vercel, creiamo un server Node.js dedicato sulla VPS che:
- Ha accesso diretto ai certificati (`/opt/sdi-certs/`)
- Gestisce SFTP localmente
- Espone API REST

## Setup Iniziale

### 1. Creare Directory

```bash
ssh root@217.154.118.37
mkdir -p /opt/sdi-sftp-server
cd /opt/sdi-sftp-server
```

### 2. Inizializzare Node.js Project

```bash
npm init -y
npm install express cors dotenv ssh2-sftp-client adm-zip node-forge
```

### 3. Creare Struttura File

```bash
mkdir -p lib
touch server.js
touch lib/sftp-client.js
touch lib/crypto.js
touch lib/xml-generator.js
touch .env
```

### 4. Configurare PM2

```bash
npm install -g pm2
pm2 start server.js --name sdi-sftp-server
pm2 save
pm2 startup
```

## Variabili d'Ambiente (.env)

```env
PORT=3002
SFTP_HOST=127.0.0.1
SFTP_PORT=22
SFTP_USERNAME=sdi
SFTP_TEST_MODE=true

CERT_FIRMA_PATH=/opt/sdi-certs/EMMAT002.SCZMNL05L21D960T.firma.p12
CERT_CIFRA_PATH=/opt/sdi-certs/EMMAT002.SCZMNL05L21D960T.cifra.p12
CERT_SOGEI_PUBLIC_PATH=/opt/sdi-certs/sogeiunicocifra.pem
CERT_PASSWORD=IBVvOZqq

SUPABASE_URL=<da configurare>
SUPABASE_SERVICE_ROLE_KEY=<da configurare>
```

## Nginx Config

Aggiungere a `/etc/nginx/sites-available/rentri`:

```nginx
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

Poi:
```bash
nginx -t
systemctl reload nginx
```

## Chiave SSH per Utente SDI

Il server Node.js deve connettersi come utente `sdi`:

```bash
# Genera chiave SSH (se necessario)
ssh-keygen -t rsa -b 4096 -f /root/.ssh/sdi_sftp_key -N ""

# Aggiungi chiave pubblica a authorized_keys di sdi
cat /root/.ssh/sdi_sftp_key.pub >> /var/sftp/sdi/.ssh/authorized_keys
chmod 600 /var/sftp/sdi/.ssh/authorized_keys
chown sdi:sdi /var/sftp/sdi/.ssh/authorized_keys
```

## Test

```bash
# Test server locale
curl http://localhost:3002/health

# Test via Nginx
curl https://sdi-sftp.rescuemanager.eu/api/sdi-sftp/health
```

