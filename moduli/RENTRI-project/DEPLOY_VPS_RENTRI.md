# Deploy VPS RENTRI Server

## 📋 Prerequisiti

- VPS con accesso SSH (chiave `vps-sdi`)
- Node.js 18+ installato
- PM2 installato globalmente
- Nginx configurato
- Certificati SSL Let's Encrypt

---

## 🚀 Deploy Iniziale

### 1. Connessione VPS

```bash
ssh -i ~/.ssh/vps-sdi root@217.154.118.37
```

### 2. Creazione Directory

```bash
mkdir -p /opt/rentri-server
cd /opt/rentri-server
```

### 3. Upload File Server

```bash
# Da locale (nella cartella moduli/RENTRI-project/)
scp -i ~/.ssh/vps-sdi vps-rentri-server.js root@217.154.118.37:/opt/rentri-server/server.js
```

### 4. Installazione Dipendenze

```bash
cd /opt/rentri-server

# Crea package.json
cat > package.json << 'EOF'
{
  "name": "rentri-server",
  "version": "1.0.0",
  "description": "RENTRI API Proxy con mTLS",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "@supabase/supabase-js": "^2.39.0"
  }
}
EOF

# Installa dipendenze
npm install
```

### 5. Configurazione Variabili Ambiente

```bash
cat > /opt/rentri-server/.env << 'EOF'
PORT=3200
SUPABASE_URL=https://[YOUR_PROJECT].supabase.co
SUPABASE_SERVICE_ROLE_KEY=[YOUR_SERVICE_ROLE_KEY]
NODE_ENV=production
EOF

chmod 600 /opt/rentri-server/.env
```

### 6. Avvio con PM2

```bash
# Avvia server
pm2 start server.js --name rentri-server

# Salva configurazione PM2
pm2 save

# Setup auto-start
pm2 startup
```

### 7. Verifica Funzionamento

```bash
# Check logs
pm2 logs rentri-server

# Test health endpoint
curl http://localhost:3200/health
```

---

## 🔧 Configurazione Nginx

### 1. Crea Configurazione

```bash
cat > /etc/nginx/sites-available/rentri << 'EOF'
server {
    listen 80;
    server_name rentri-test.rescuemanager.eu;

    location / {
        return 301 https://$server_name$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name rentri-test.rescuemanager.eu;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/rentri-test.rescuemanager.eu/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/rentri-test.rescuemanager.eu/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Proxy to Node.js
    location / {
        proxy_pass http://127.0.0.1:3200;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeout per operazioni lunghe
        proxy_read_timeout 120s;
        proxy_connect_timeout 120s;
        proxy_send_timeout 120s;
    }

    # Logs
    access_log /var/log/nginx/rentri-access.log;
    error_log /var/log/nginx/rentri-error.log;
}
EOF
```

### 2. Abilita Sito

```bash
ln -s /etc/nginx/sites-available/rentri /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

### 3. Certificato SSL

```bash
# Se non esiste già
certbot --nginx -d rentri-test.rescuemanager.eu
```

---

## 📦 Aggiornamento Server

### Script di Deploy

```bash
cat > /opt/rentri-server/deploy.sh << 'EOF'
#!/bin/bash
set -e

echo "🚀 Deploy RENTRI Server..."

# Backup vecchia versione
cp server.js server.js.backup

# Download nuova versione (da implementare upload)
# scp -i ~/.ssh/vps-sdi vps-rentri-server.js root@217.154.118.37:/opt/rentri-server/server.js

# Installa/aggiorna dipendenze
npm install

# Restart PM2
pm2 restart rentri-server

# Check health
sleep 3
curl -f http://localhost:3200/health || {
    echo "❌ Health check fallito, rollback..."
    cp server.js.backup server.js
    pm2 restart rentri-server
    exit 1
}

echo "✅ Deploy completato!"
EOF

chmod +x /opt/rentri-server/deploy.sh
```

### Esecuzione Deploy

```bash
# Da locale
scp -i ~/.ssh/vps-sdi vps-rentri-server.js root@217.154.118.37:/opt/rentri-server/server.js

# Su VPS
ssh -i ~/.ssh/vps-sdi root@217.154.118.37
cd /opt/rentri-server
./deploy.sh
```

---

## 🔍 Monitoraggio

### PM2 Commands

```bash
# Status
pm2 status

# Logs real-time
pm2 logs rentri-server

# Logs ultimi 100 righe
pm2 logs rentri-server --lines 100

# Restart
pm2 restart rentri-server

# Stop
pm2 stop rentri-server

# Metriche
pm2 monit
```

### Log Files

```bash
# PM2 logs
tail -f ~/.pm2/logs/rentri-server-out.log
tail -f ~/.pm2/logs/rentri-server-error.log

# Nginx logs
tail -f /var/log/nginx/rentri-access.log
tail -f /var/log/nginx/rentri-error.log
```

---

## 🧪 Testing

### Health Check

```bash
curl https://rentri-test.rescuemanager.eu/health
```

### Test Endpoint Vidimazione

```bash
# GET blocchi FIR
curl -X GET "https://rentri-test.rescuemanager.eu/api/rentri/vidimazione-formulari?org_id=YOUR_ORG_ID&identificativo=CF_OPERATORE"

# POST vidima FIR
curl -X POST "https://rentri-test.rescuemanager.eu/api/rentri/vidimazione-formulari/CODICE_BLOCCO" \
  -H "Content-Type: application/json" \
  -d '{"org_id":"YOUR_ORG_ID","environment":"demo"}'
```

### Test Endpoint Trasmissioni

```bash
# GET lista trasmissioni
curl -X GET "https://rentri-test.rescuemanager.eu/api/rentri/trasmissioni?org_id=YOUR_ORG_ID&limit=10"

# POST trasmetti movimenti
curl -X POST "https://rentri-test.rescuemanager.eu/api/rentri/registri/IDENTIFICATIVO_REGISTRO/movimenti" \
  -H "Content-Type: application/json" \
  -d '{
    "org_id": "YOUR_ORG_ID",
    "environment": "demo",
    "movimenti": [
      {
        "riferimenti": {
          "numero_registrazione": {"anno": 2024, "progressivo": 1},
          "data_ora_registrazione": "2024-02-18T10:00:00Z",
          "causale_operazione": "aT"
        },
        "rifiuto": {
          "codice_eer": "150101",
          "stato_fisico": "SP",
          "quantita": {"valore": 1000, "unita_misura": "kg"}
        }
      }
    ]
  }'
```

---

## 🛡️ Sicurezza

### Firewall

```bash
# Permetti solo traffico necessario
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP (redirect)
ufw allow 443/tcp   # HTTPS
ufw enable
```

### Backup Certificati

```bash
# Backup certificati RENTRI in DB
# I certificati .p12 sono già salvati in rentri_certificates table
# con p12_base64 e p12_password criptati
```

### Rate Limiting Nginx

```nginx
# Aggiungi in /etc/nginx/nginx.conf
http {
    limit_req_zone $binary_remote_addr zone=rentri_limit:10m rate=10r/s;
    
    # Nel server block
    location /api/rentri/ {
        limit_req zone=rentri_limit burst=20 nodelay;
        # ... resto config proxy
    }
}
```

---

## 📊 Metriche e Alerting

### PM2 Plus (opzionale)

```bash
pm2 link [SECRET_KEY] [PUBLIC_KEY]
```

### Custom Health Check Script

```bash
cat > /opt/rentri-server/healthcheck.sh << 'EOF'
#!/bin/bash
HEALTH_URL="http://localhost:3200/health"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $HEALTH_URL)

if [ $RESPONSE -ne 200 ]; then
    echo "❌ RENTRI Server unhealthy (HTTP $RESPONSE)"
    # Invia notifica (email, Slack, ecc.)
    pm2 restart rentri-server
    exit 1
fi

echo "✅ RENTRI Server healthy"
EOF

chmod +x /opt/rentri-server/healthcheck.sh

# Cron ogni 5 minuti
crontab -e
# Aggiungi: */5 * * * * /opt/rentri-server/healthcheck.sh >> /var/log/rentri-health.log 2>&1
```

---

## 🐛 Troubleshooting

### Server non risponde

```bash
# Check processo
pm2 status rentri-server

# Check logs
pm2 logs rentri-server --lines 50

# Restart
pm2 restart rentri-server
```

### Errori mTLS

```bash
# Verifica certificati in DB
psql -h db.YOUR_PROJECT.supabase.co -U postgres -d postgres
SELECT id, org_id, cf_operatore, environment, is_active, expires_at 
FROM rentri_certificates 
WHERE is_active = true;

# Test connessione RENTRI
openssl s_client -connect demoapi.rentri.gov.it:443 -cert cert.pem -key key.pem
```

### Timeout Transazioni

```bash
# Aumenta timeout Nginx
# In /etc/nginx/sites-available/rentri
proxy_read_timeout 300s;
proxy_connect_timeout 300s;

# Reload Nginx
nginx -t && systemctl reload nginx
```

---

## 📝 Checklist Deploy

- [ ] File server.js caricato
- [ ] Dipendenze npm installate
- [ ] File .env configurato
- [ ] PM2 avviato e salvato
- [ ] Nginx configurato
- [ ] SSL certificato attivo
- [ ] Health check OK
- [ ] Test endpoint vidimazione
- [ ] Test endpoint trasmissioni
- [ ] Logs monitorati
- [ ] Backup configurato

---

## 🔗 Link Utili

- **URL Server**: https://rentri-test.rescuemanager.eu
- **Health Check**: https://rentri-test.rescuemanager.eu/health
- **PM2 Docs**: https://pm2.keymetrics.io/docs/usage/quick-start/
- **RENTRI API Docs**: Vedi `moduli/RENTRI-project/demo-docs/`

---

**Ultimo aggiornamento**: 18 Febbraio 2026  
**Versione Server**: 1.0.0
