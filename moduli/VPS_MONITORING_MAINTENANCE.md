# Spostamento Monitoring/Maintenance API su VPS

## Route da creare

### `/opt/rentri-api/routes/monitoring.js`
- `POST /api/monitoring/heartbeat` - Heartbeat dall'app desktop

### `/opt/rentri-api/routes/maintenance.js`
- `GET /api/maintenance/status` - Status manutenzione

## Configurazione richiesta

### Variabili d'ambiente (`/root/.env`)
- `JWT_SECRET` - Per verificare token OAuth (già presente o da aggiungere)
- `NEXT_PUBLIC_SUPABASE_URL` - Già presente
- `SUPABASE_SERVICE_ROLE_KEY` - Già presente

### Npm packages
- `jsonwebtoken` - Da installare sulla VPS

## Nginx

Aggiungere a `/etc/nginx/sites-enabled/rentri` (o configurazione principale):

```nginx
# Monitoring e Maintenance API
location ^~ /api/monitoring/ {
    proxy_pass http://localhost:3003;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}

location ^~ /api/maintenance/ {
    proxy_pass http://localhost:3003;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

## Frontend

Aggiornare `API_BASE_URL` in `remote-control.ts`:
- Da: `https://rescuemanager.eu/api`
- A: `https://rentri-test.rescuemanager.eu/api` (o configurare con env var)
