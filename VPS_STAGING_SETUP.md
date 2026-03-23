# VPS Staging Setup - Complete Guide

Guida completa per configurare l'ambiente staging sul VPS.

---

## 📋 Overview

Setup di tutti i servizi VPS in ambiente staging:
- 9 servizi Node.js con PM2
- Porte staging = porte production + 1000
- Nginx reverse proxy con SSL
- Environment variables separate

---

## 🔐 Step 1: SSH nel VPS

```bash
ssh root@217.154.118.37
# Usa chiave SSH configurata in GitHub Secrets
```

---

## 📁 Step 2: Crea Directory Staging

```bash
# Crea directory base
mkdir -p /opt/staging
cd /opt/staging

# Clone repository (branch staging)
git clone -b staging https://github.com/rescuemanager/rescuemanager.git .

# Verifica branch
git branch
# Dovrebbe mostrare: * staging
```

---

## 🔑 Step 3: Configura Environment Variables

```bash
# Crea file .env per staging
nano /opt/staging/.env.staging
```

Contenuto:
```bash
# Environment
NODE_ENV=staging
PORT_OFFSET=1000

# Supabase Staging
SUPABASE_URL=https://your-staging-project.supabase.co
SUPABASE_SERVICE_KEY=your-staging-service-key
SUPABASE_ANON_KEY=your-staging-anon-key

# JWT
JWT_SECRET=your-staging-jwt-secret-min-32-chars

# Redis Staging
UPSTASH_REDIS_REST_URL=https://staging-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-staging-token

# R2 Staging
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-staging-access-key
R2_SECRET_ACCESS_KEY=your-staging-secret-key
R2_BUCKET_NAME=rescuemanager-staging

# SDI (stesso di production)
SDI_ID_NODO=02166430856
SDI_ID_NODO_CF=SCZMNL05L21D960T

# Email (opzionale per staging)
EMAIL_FROM=staging@rescuemanager.eu
EMAIL_API_KEY=your-staging-email-key
```

---

## 📦 Step 4: Installa Dependencies

```bash
# Per ogni servizio
cd /opt/staging/moduli/assist-server
npm install --production

cd /opt/staging/moduli/rentri-api
npm install --production

cd /opt/staging/moduli/sdi-sftp-server
npm install --production

cd /opt/staging/moduli/lead-api
npm install --production

cd /opt/staging/moduli/ebay-oauth
npm install --production

cd /opt/staging/moduli/oauth-proxy-server
npm install --production

cd /opt/staging/moduli/rentri-polling
npm install --production

cd /opt/staging/moduli/rentri-server
npm install --production

cd /opt/staging/moduli/rvfu-proxy-direct
npm install --production
```

Script automatico:
```bash
#!/bin/bash
for service in assist-server rentri-api sdi-sftp-server lead-api ebay-oauth oauth-proxy-server rentri-polling rentri-server rvfu-proxy-direct; do
  if [ -d "/opt/staging/moduli/$service" ]; then
    echo "Installing $service..."
    cd "/opt/staging/moduli/$service"
    npm install --production
  fi
done
```

---

## 🚀 Step 5: Configura PM2

```bash
# Copia ecosystem config
cp /opt/staging/staging-ecosystem.config.js /opt/staging/

# Carica environment variables
export $(cat /opt/staging/.env.staging | xargs)

# Start services
pm2 start /opt/staging/staging-ecosystem.config.js

# Save PM2 config
pm2 save

# Setup PM2 startup
pm2 startup
# Copia e esegui il comando mostrato
```

Verifica servizi:
```bash
pm2 list | grep staging

# Output atteso:
# staging-assist-server    │ online │ 4100
# staging-rentri-api       │ online │ 4003
# staging-sdi-sftp-server  │ online │ 4005
# staging-lead-api         │ online │ 4006
# staging-ebay-oauth       │ online │ 4007
# staging-oauth-proxy      │ online │ 4008
# staging-rentri-polling   │ online │ N/A
# staging-rentri-server    │ online │ 4200
# staging-rvfu-proxy       │ online │ 4009
```

---

## 🌐 Step 6: Configura Nginx

```bash
# Copia config staging
cp /opt/staging/nginx-staging-config.conf /etc/nginx/sites-available/staging-apis

# Crea symlink
ln -s /etc/nginx/sites-available/staging-apis /etc/nginx/sites-enabled/

# Test config
nginx -t

# Reload Nginx
systemctl reload nginx
```

---

## 🔒 Step 7: Setup SSL Certificates

```bash
# Installa Certbot (se non già installato)
apt-get update
apt-get install certbot python3-certbot-nginx

# Genera certificati per tutti i sottodomini staging
certbot --nginx \
  -d staging-assist.rescuemanager.eu \
  -d staging-rentri.rescuemanager.eu \
  -d staging-api.rescuemanager.eu \
  -d staging-sdi.rescuemanager.eu \
  -d staging-lead.rescuemanager.eu \
  --email info@rescuemanager.eu \
  --agree-tos \
  --no-eff-email

# Auto-renewal già configurato da Certbot
```

---

## 🧪 Step 8: Test Services

```bash
# Test locale (dal VPS)
curl http://localhost:4100/health  # assist-server
curl http://localhost:4003/health  # rentri-api
curl http://localhost:4005/health  # sdi-sftp
curl http://localhost:4006/health  # lead-api

# Test esterno (da locale)
curl https://staging-assist.rescuemanager.eu/health
curl https://staging-rentri.rescuemanager.eu/health
curl https://staging-api.rescuemanager.eu/health
```

---

## 📊 Step 9: Monitoring & Logs

```bash
# View logs
pm2 logs staging-assist-server
pm2 logs staging-rentri-api

# Monitor in real-time
pm2 monit

# Check status
pm2 status

# Restart service
pm2 restart staging-assist-server

# Restart all staging
pm2 restart all | grep staging
```

---

## 🔄 Step 10: Setup Auto-Deploy

File già creato: `.github/workflows/vps-deploy.yml`

Quando fai push su `staging` branch:
1. GitHub Actions si attiva
2. SSH nel VPS
3. Pull latest code
4. npm install
5. PM2 restart

---

## 📋 Checklist Setup VPS

- [ ] SSH access configurato
- [ ] Directory /opt/staging creata
- [ ] Repository clonato (branch staging)
- [ ] .env.staging configurato
- [ ] Dependencies installate per tutti i servizi
- [ ] PM2 ecosystem configurato
- [ ] Servizi PM2 running
- [ ] Nginx config creato
- [ ] SSL certificates installati
- [ ] Test servizi passati
- [ ] Logs verificati
- [ ] Auto-deploy testato

---

## 🔧 Troubleshooting

### Servizio non parte
```bash
# Check logs
pm2 logs staging-service-name --lines 100

# Check environment
pm2 env staging-service-name

# Restart
pm2 restart staging-service-name
```

### Porta già in uso
```bash
# Check porta
lsof -i :4100

# Kill processo
kill -9 <PID>

# Restart service
pm2 restart staging-assist-server
```

### Nginx 502 Bad Gateway
```bash
# Check service running
pm2 status

# Check Nginx logs
tail -f /var/log/nginx/error.log

# Test upstream
curl http://localhost:4100
```

### SSL Certificate Error
```bash
# Renew certificates
certbot renew

# Force renew
certbot renew --force-renewal

# Check expiry
certbot certificates
```

---

## 🔄 Manutenzione

### Giornaliera
```bash
# Check services status
pm2 status | grep staging

# Check disk space
df -h
```

### Settimanale
```bash
# Update code
cd /opt/staging
git pull origin staging

# Restart services
pm2 restart all | grep staging

# Check logs for errors
pm2 logs --lines 100 --nostream
```

### Mensile
```bash
# Update dependencies
cd /opt/staging/moduli/assist-server
npm update

# Clean old logs
pm2 flush

# Check SSL expiry
certbot certificates
```

---

**VPS Staging setup completato!** 🎉
