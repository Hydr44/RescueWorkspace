# ✅ Deploy Server SDI-SFTP Completato con Successo!

## Server Installato e Funzionante

- **Posizione**: `/opt/sdi-sftp-server/`
- **Porta**: **3004** (cambiata da 3002 per evitare conflitto con rvfu-proxy-tunnel)
- **PM2**: `sdi-sftp-server` (status: **online** ✅)
- **Health Check**: `http://localhost:3004/health`
- **Dipendenze**: Installate correttamente (100 packages)

## Stato Attuale

```bash
# Verifica status
ssh -i ~/.ssh/id_ed25519_vps root@217.154.118.37 "pm2 status | grep sdi-sftp"

# Health check
ssh -i ~/.ssh/id_ed25519_vps root@217.154.118.37 "curl http://localhost:3004/health"
```

Output atteso:
```json
{"status":"ok","service":"sdi-sftp-server","port":"3004"}
```

## Configurazione

### Variabili d'Ambiente
Configurate in `/root/.env`:
- `SDI_SFTP_PORT=3004`
- `SDI_SFTP_HOST=127.0.0.1`
- `SDI_SFTP_PORT_SFTP=22`
- `SDI_SFTP_USERNAME=sdi`
- `SDI_SFTP_PRIVATE_KEY=/root/.ssh/sdi_sftp_key`
- `SDI_SFTP_TEST_MODE=true`
- Certificati configurati (path e password)

### Chiave SSH
- Chiave generata: `/root/.ssh/sdi_sftp_key`
- Chiave pubblica aggiunta a `/var/sftp/sdi/.ssh/authorized_keys`

## Prossimi Passi

### 1. Configurare Nginx (se necessario)

Se vuoi esporre il server pubblicamente, aggiungi a `/etc/nginx/sites-available/rentri`:

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

### 2. Aggiornare Route Vercel (se necessario)

La route Vercel (`website/src/app/api/sdi-sftp/send/route.ts`) dovrebbe fare proxy a:
- `https://sdi-sftp.rescuemanager.eu/api/sdi-sftp/send` (se Nginx configurato)
- O direttamente a `http://217.154.118.37:3004/api/sdi-sftp/send` (se firewall aperto)

### 3. Caricare Certificati

I certificati devono essere caricati in `/opt/sdi-certs/`:
- `EMMAT002.SCZMNL05L21D960T.firma.p12`
- `EMMAT002.SCZMNL05L21D960T.cifra.p12`
- `sogeiunicocifra.pem`

Vedi `CARICA_CERTIFICATI_VPS.md` per istruzioni.

### 4. Testare End-to-End

Una volta caricati i certificati, testare l'invio di una fattura via API.

## Monitoraggio

```bash
# Log server
ssh -i ~/.ssh/id_ed25519_vps root@217.154.118.37 "pm2 logs sdi-sftp-server"

# Log ultimi 50 righe
ssh -i ~/.ssh/id_ed25519_vps root@217.154.118.37 "pm2 logs sdi-sftp-server --lines 50 --nostream"

# Status
ssh -i ~/.ssh/id_ed25519_vps root@217.154.118.37 "pm2 status"

# Riavvia
ssh -i ~/.ssh/id_ed25519_vps root@217.154.118.37 "pm2 restart sdi-sftp-server"

# Stop
ssh -i ~/.ssh/id_ed25519_vps root@217.154.118.37 "pm2 stop sdi-sftp-server"

# Start
ssh -i ~/.ssh/id_ed25519_vps root@217.154.118.37 "pm2 start sdi-sftp-server"
```

## Note

- Porta cambiata da 3002 a 3004 perché 3002 era già in uso da `rvfu-proxy-tunnel`
- Server configurato per test mode (`SDI_SFTP_TEST_MODE=true`)
- Il server usa `dotenv` per caricare variabili da `/root/.env`

