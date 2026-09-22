# VPS Control API

API di controllo del VPS per l'admin panel: stato servizi pm2, log, restart/stop/start,
risorse (CPU/RAM/disco), backup. Protetta da bearer token, con audit su Supabase.

## Architettura
- Node/Express in ascolto SOLO su `127.0.0.1:3910`.
- Esposta via nginx su `control.rescuemanager.eu` (TLS certbot).
- L'admin panel chiama gli endpoint con `Authorization: Bearer <VPS_CONTROL_TOKEN>`
  e header `X-Actor: <email staff>` (per l'audit).

## Endpoint
- `GET  /health` — libero (no token)
- `GET  /api/services` — lista servizi (stato, mem, restart, uptime, env, descrizione)
- `GET  /api/resources` — CPU/RAM/disco/uptime
- `GET  /api/backups` — stato backup (Supabase, dump VPS, locale, per-cliente, R2)
- `GET  /api/audit?limit=N` — ultime azioni
- `GET  /api/services/:name/logs?lines=N` — tail log (out+err)
- `POST /api/services/:name/restart`
- `POST /api/services/:name/stop`   — richiede body `{ "confirm": true }`
- `POST /api/services/:name/start`

## Sicurezza
- Token in tempo costante; `execFile` su pm2 (no shell); nomi validati vs lista reale.
- Non agisce su sé stessa (`vps-control`).
- `stop` con doppia conferma server-side; ogni azione mutante è tracciata.

## Deploy
```
cd /opt/vps-control && npm install --production
# in /root/.env: VPS_CONTROL_TOKEN=<openssl rand -hex 32>
pm2 start ecosystem.config.js && pm2 save
# nginx: vedi nginx-control.conf (dopo DNS + certbot)
```
