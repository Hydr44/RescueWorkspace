# ✅ Deploy Server SDI-SFTP Completato

## Server Installato

- **Posizione**: `/opt/sdi-sftp-server/`
- **Porta**: 3002
- **PM2**: `sdi-sftp-server`
- **Health Check**: `http://localhost:3002/health`

## Prossimi Passi

### 1. Configurare Nginx (se necessario)

Aggiungere a `/etc/nginx/sites-available/rentri`:

```nginx
location /api/sdi-sftp/ {
    proxy_pass http://127.0.0.1:3004/api/sdi-sftp/;
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

### 2. Verificare Route Vercel

La route Vercel (`website/src/app/api/sdi-sftp/send/route.ts`) è già configurata per fare proxy al server VPS.

### 3. Testare

- Health check locale: `curl http://localhost:3004/health`
- Health check pubblico (se Nginx configurato): `curl https://sdi-sftp.rescuemanager.eu/api/sdi-sftp/health`

## Monitoraggio

```bash
# Log server
ssh -i ~/.ssh/id_ed25519_vps root@217.154.118.37 "pm2 logs sdi-sftp-server"

# Status
ssh -i ~/.ssh/id_ed25519_vps root@217.154.118.37 "pm2 status"

# Riavvia
ssh -i ~/.ssh/id_ed25519_vps root@217.154.118.37 "pm2 restart sdi-sftp-server"
```

