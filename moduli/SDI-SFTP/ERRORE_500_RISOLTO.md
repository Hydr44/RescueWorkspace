# ✅ Errore 500 Risolto

## Problema

Errore 500 "fetch failed" quando si inviava fattura via SDI-SFTP.

## Cause Identificate

1. **File `xml-generator.js` mancante sul server VPS**
   - Il server si riavviava continuamente (16 restart)
   - Errore: `MODULE_NOT_FOUND: Cannot find module './xml-generator'`

2. **Nginx non configurato per dominio `sdi-sftp.rescuemanager.eu`**
   - La route API Vercel usa `https://sdi-sftp.rescuemanager.eu`
   - Nginx non aveva configurazione per questo dominio
   - Il server risponde solo su `localhost:3004`

## Soluzioni Applicate

### 1. Caricato `xml-generator.js` su VPS
```bash
scp moduli/SDI-SFTP/server-vps/xml-generator.js root@217.154.118.37:/opt/sdi-sftp-server/
pm2 restart sdi-sftp-server
```

### 2. Configurato Nginx
Aggiunta configurazione a `/etc/nginx/sites-available/default`:
```nginx
server {
    listen 80;
    listen [::]:80;
    server_name sdi-sftp.rescuemanager.eu;

    location / {
        proxy_pass http://127.0.0.1:3004;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Ricaricato Nginx: `systemctl reload nginx`

## ⚠️ DA VERIFICARE

**Il dominio `sdi-sftp.rescuemanager.eu` deve puntare all'IP `217.154.118.37` (DNS)**

Se il dominio non è configurato nel DNS, ci sono due opzioni:

1. **Configurare il DNS** (consigliato):
   - Aggiungere record A: `sdi-sftp.rescuemanager.eu` → `217.154.118.37`

2. **Usare IP diretto o altro dominio**:
   - Modificare `SDI_SFTP_SERVER_URL` in `website/src/app/api/sdi-sftp/send/route.ts`
   - Esempio: `http://217.154.118.37:3004` (se firewall permette)

## Verifica

Dopo la configurazione DNS, verificare:
```bash
curl http://sdi-sftp.rescuemanager.eu/health
```

Dovrebbe rispondere:
```json
{"status":"ok","service":"sdi-sftp-server","port":"3004"}
```

## Stato

- ✅ File xml-generator.js caricato
- ✅ Server riavviato e funzionante
- ✅ Nginx configurato
- ⚠️ DNS da configurare (se dominio non esiste)

