# eBay OAuth Server - RescueManager

Server OAuth per integrazione eBay multi-org (ogni cliente pubblica dal proprio account eBay).

## 🚀 Deploy su VPS

### 1. Copia file sul VPS

```bash
# Sul tuo Mac
scp -r vps-ebay-oauth root@217.154.118.37:/opt/ebay-oauth
```

### 2. Installa dipendenze

```bash
ssh root@217.154.118.37
cd /opt/ebay-oauth
npm install
```

### 3. Configura .env

```bash
cd /opt/ebay-oauth
nano .env
```

Inserisci:
```env
PORT=3400
EBAY_CLIENT_ID=Emmanuel-RescueMa-SBX-9957a538d-4173022f
EBAY_CLIENT_SECRET=SBX-957a538ddce4-0250-42c9-a231-b496
EBAY_DEV_ID=d0cb2cfa-b7a9-4252-bd69-39a7dd844784
EBAY_REDIRECT_URI=https://api.rescuemanager.eu/api/ebay/auth/callback
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 4. Avvia con PM2

```bash
pm2 start server.js --name ebay-oauth
pm2 save
```

### 5. Configura Nginx

```bash
nano /etc/nginx/sites-available/api
```

Aggiungi nel blocco `server`:

```nginx
# eBay OAuth
location /api/ebay/ {
    proxy_pass http://127.0.0.1:3400;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

```bash
nginx -t
systemctl reload nginx
```

### 6. Test

```bash
curl https://api.rescuemanager.eu/api/ebay/health
```

Dovrebbe rispondere:
```json
{"status":"ok","service":"ebay-oauth","timestamp":"..."}
```

## 📡 Endpoints

### `GET /api/ebay/auth/start?org_id=xxx`
Inizia il flusso OAuth. Redirect a eBay login.

### `GET /api/ebay/auth/callback?code=xxx&state=xxx`
Callback eBay. Scambia code per token e salva in DB.

### `POST /api/ebay/refresh-token`
Body: `{ "org_id": "..." }`
Rinnova access_token usando refresh_token.

### `POST /api/ebay/disconnect`
Body: `{ "org_id": "..." }`
Rimuove connessione eBay per org.

## 🔐 Sicurezza

- State token (32 bytes random) con timeout 10 minuti
- Credenziali salvate in `marketplace_connections` con RLS
- Access token rinnovato automaticamente alla scadenza
- HTTPS obbligatorio (nginx + Let's Encrypt)

## 📊 Database

Tabella: `marketplace_connections`
- `org_id` (uuid)
- `platform` ('ebay')
- `credentials` (jsonb con access_token, refresh_token, expires_at)
- `is_active` (boolean)
- `last_sync` (timestamp)

## 🧪 Test OAuth Flow

1. Apri browser: `https://api.rescuemanager.eu/api/ebay/auth/start?org_id=YOUR_ORG_ID`
2. Login con account eBay Sandbox
3. Autorizza app
4. Redirect a callback → token salvato in DB
5. Verifica in Supabase: `SELECT * FROM marketplace_connections WHERE platform = 'ebay'`
