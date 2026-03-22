# 🔧 Comandi per Correggere Nginx

## Problema

Nginx sta facendo **redirect 301** invece di **proxy** a `localhost:3004`.

## Soluzione

Esegui questi comandi **dalla VPS** (dopo esserti connesso con SSH):

```bash
# 1. Accedi alla VPS
ssh root@217.154.118.37

# 2. Crea configurazione Nginx per sdi-sftp.rescuemanager.eu
cat > /etc/nginx/sites-available/sdi-sftp << 'EOF'
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
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
}
EOF

# 3. Abilita il sito
ln -sf /etc/nginx/sites-available/sdi-sftp /etc/nginx/sites-enabled/

# 4. Verifica configurazione
nginx -t

# 5. Se tutto OK, ricarica Nginx
systemctl reload nginx

# 6. Verifica che il server Node.js sia in esecuzione
pm2 list
pm2 logs sdi-sftp-server --lines 20

# 7. Testa localmente
curl http://localhost:3004/health
curl -X POST http://localhost:3004/api/sdi-sftp/send \
  -H "Content-Type: application/json" \
  -d '{"test":true}'
```

## Verifica Finale

Dopo aver eseguito i comandi, testa dall'esterno:

```bash
# Dovrebbe rispondere con JSON, non redirect
curl -X POST http://sdi-sftp.rescuemanager.eu/api/sdi-sftp/send \
  -H "Content-Type: application/json" \
  -d '{"test":true}'
```

Se funziona, dovresti vedere una risposta JSON (non un redirect 301).

