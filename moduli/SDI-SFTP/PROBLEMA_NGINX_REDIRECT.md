# 🚨 Problema Nginx Redirect

## Problema Trovato

Nginx sta facendo un **redirect 301** a un dominio **sbagliato**:

### Richiesta
```
POST http://sdi-sftp.rescuemanager.eu/api/sdi-sftp/send
```

### Risposta Nginx
```
HTTP/1.1 301 Moved Permanently
Location: https://rentri-test.rescuemanager.eu/api/sdi-sftp/send
```

## Problemi

1. **❌ Redirect a dominio sbagliato**: `rentri-test.rescuemanager.eu` invece di `sdi-sftp.rescuemanager.eu`
2. **❌ Redirect a HTTPS**: Non configurato
3. **❌ Include path nel redirect**: Non dovrebbe

## Cause Possibili

La configurazione Nginx per `sdi-sftp.rescuemanager.eu` probabilmente:
- Sta facendo redirect invece di proxy
- Ha una configurazione di default che fa redirect a `rentri-test.rescuemanager.eu`
- Non ha una configurazione dedicata per `sdi-sftp.rescuemanager.eu`

## Soluzione

Devi configurare Nginx sulla VPS per fare **proxy** invece di redirect.

### Configurazione Nginx Corretta

```nginx
server {
    listen 80;
    server_name sdi-sftp.rescuemanager.eu;

    location / {
        proxy_pass http://localhost:3004;
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

### Comandi da Eseguire sulla VPS

```bash
ssh root@217.154.118.37

# Crea/modifica configurazione Nginx
nano /etc/nginx/sites-available/sdi-sftp

# Copia la configurazione sopra

# Abilita il sito
ln -sf /etc/nginx/sites-available/sdi-sftp /etc/nginx/sites-enabled/

# Verifica configurazione
nginx -t

# Ricarica Nginx
systemctl reload nginx

# Verifica che il server Node.js sia in esecuzione
pm2 list
pm2 logs sdi-sftp-server --lines 20
```

## Verifica

Dopo la correzione:

```bash
# Dovrebbe rispondere con JSON, non redirect
curl -X POST http://sdi-sftp.rescuemanager.eu/api/sdi-sftp/send \
  -H "Content-Type: application/json" \
  -d '{"test":true}'

# Dovrebbe rispondere con JSON
curl http://sdi-sftp.rescuemanager.eu/health
```

## Stato Attuale

- ✅ DNS configurato correttamente
- ✅ Server Node.js probabilmente in esecuzione (da verificare)
- ❌ Nginx fa redirect invece di proxy
- ❌ Redirect a dominio sbagliato (`rentri-test.rescuemanager.eu`)
- ❌ Redirect a HTTPS (non configurato)

## Prossimi Passi

1. Accedi alla VPS: `ssh root@217.154.118.37`
2. Verifica configurazione Nginx esistente
3. Crea/corregi configurazione per `sdi-sftp.rescuemanager.eu`
4. Testa il proxy

