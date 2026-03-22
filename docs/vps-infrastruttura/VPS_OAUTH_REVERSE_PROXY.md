# 🔧 Configurazione Reverse Proxy OAuth sulla VPS

## Soluzione: Reverse Proxy Nginx sulla VPS

Invece di usare direttamente Vercel, configuriamo nginx sulla VPS per fare reverse proxy all'endpoint OAuth.

## Architettura

```
Desktop App
    ↓
VPS (217.154.118.37) - Nginx Reverse Proxy
    ↓
Vercel (rescuemanager.eu) - Endpoint OAuth
```

## Configurazione Nginx

### Opzione 1: Sottodominio dedicato (consigliato)

Crea un sottodominio `oauth.rescuemanager.eu` che punta alla VPS.

**1. Configura DNS:**
- Aggiungi record A: `oauth.rescuemanager.eu` → `217.154.118.37`

**2. Crea configurazione Nginx:**

```bash
ssh root@217.154.118.37

# Crea configurazione
cat > /etc/nginx/sites-available/oauth-proxy << 'EOF'
server {
    listen 80;
    server_name oauth.rescuemanager.eu;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name oauth.rescuemanager.eu;

    # SSL Certificate (usa Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/oauth.rescuemanager.eu/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/oauth.rescuemanager.eu/privkey.pem;
    
    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Proxy all'endpoint OAuth su Vercel
    location /api/auth/oauth/desktop {
        proxy_pass https://rescuemanager.eu;
        proxy_http_version 1.1;
        proxy_set_header Host rescuemanager.eu;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        
        # Timeout aumentati per OAuth
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Disabilita buffering per redirect immediati
        proxy_buffering off;
    }

    # Proxy alla pagina di login OAuth
    location /auth/oauth/desktop {
        proxy_pass https://rescuemanager.eu;
        proxy_http_version 1.1;
        proxy_set_header Host rescuemanager.eu;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        
        proxy_buffering off;
    }
}
EOF

# Abilita il sito
ln -sf /etc/nginx/sites-available/oauth-proxy /etc/nginx/sites-enabled/

# Verifica configurazione
nginx -t

# Se OK, ricarica nginx
systemctl reload nginx
```

**3. Richiedi certificato SSL:**

```bash
# Installa certbot se non presente
apt-get update
apt-get install -y certbot python3-certbot-nginx

# Richiedi certificato
certbot --nginx -d oauth.rescuemanager.eu

# Verifica auto-renewal
certbot renew --dry-run
```

### Opzione 2: Usa dominio principale (più semplice, ma meno pulito)

Aggiungi alla configurazione esistente di `rescuemanager.eu`:

```bash
ssh root@217.154.118.37

# Modifica configurazione esistente (probabilmente in /etc/nginx/sites-available/default o rescuemanager)
nano /etc/nginx/sites-available/rescuemanager

# Aggiungi queste location dentro il server block esistente:
location /api/auth/oauth/desktop {
    proxy_pass https://rescuemanager.eu;
    proxy_http_version 1.1;
    proxy_set_header Host rescuemanager.eu;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_buffering off;
}

location /auth/oauth/desktop {
    proxy_pass https://rescuemanager.eu;
    proxy_http_version 1.1;
    proxy_set_header Host rescuemanager.eu;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_buffering off;
}

# Verifica e ricarica
nginx -t && systemctl reload nginx
```

## Aggiornamento Desktop App

Dopo aver configurato il reverse proxy, aggiorna la desktop app per usare la VPS:

**File:** `desktop-app/greeting-friend-api-main/src/lib/oauth.ts`

```typescript
export class OAuthService {
  // Cambia da Vercel a VPS
  private static readonly OAUTH_BASE_URL = 'https://oauth.rescuemanager.eu'; // O usa rescuemanager.eu se Opzione 2
  // ... resto del codice
}
```

## Test

Dopo la configurazione, testa:

```bash
# Test endpoint OAuth
curl "https://oauth.rescuemanager.eu/api/auth/oauth/desktop?app_id=desktop_app&redirect_uri=http://localhost:3001/auth/callback&state=test"

# Dovresti vedere HTML redirect invece di pagina vuota
```

## Vantaggi

- ✅ Controllo completo sulla VPS
- ✅ Logging dettagliato su nginx
- ✅ Possibilità di aggiungere rate limiting, caching, etc.
- ✅ Non dipende da deploy Vercel
- ✅ Più veloce (meno hop)

## Note

- Se usi Opzione 1 (sottodominio), devi configurare DNS
- Se usi Opzione 2, assicurati che il dominio principale punti già alla VPS
- Il reverse proxy passa tutte le richieste a Vercel, quindi Vercel deve comunque funzionare
