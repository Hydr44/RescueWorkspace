# Lead API - VPS Server

Server Express per gestione lead pesante (demo, preventivi, email, PDF).

## Deploy su VPS

```bash
# 1. Copia files su VPS
scp -r moduli/lead-api/* root@217.154.118.37:/opt/lead-api/

# 2. SSH al server
ssh root@217.154.118.37

# 3. Installa dipendenze
cd /opt/lead-api && npm install

# 4. Aggiungi env vars a /root/.env
# LEAD_API_PORT=3006
# VPS_API_KEY=<stessa chiave usata per SDI>
# SMTP_HOST=smtp.resend.com
# SMTP_PORT=465
# SMTP_USER=resend
# SMTP_PASS=<resend api key>
# SMTP_FROM=info@rescuemanager.eu

# 5. Nginx config
cp nginx-lead-api.conf /etc/nginx/sites-available/lead-api
ln -s /etc/nginx/sites-available/lead-api /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

# 6. PM2
pm2 start ecosystem.config.js
pm2 save
```

## Env Vars richieste in /root/.env

| Var | Descrizione |
|-----|-------------|
| `SUPABASE_URL` | URL Supabase (già presente) |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (già presente) |
| `VPS_API_KEY` | Chiave API per autenticazione (= SDI_API_KEY) |
| `LEAD_API_PORT` | Porta server (default 3006) |
| `SMTP_HOST` | SMTP host |
| `SMTP_PORT` | SMTP port |
| `SMTP_USER` | SMTP user |
| `SMTP_PASS` | SMTP password o API key |
| `SMTP_FROM` | Email mittente |

## Env Vars da aggiungere su Vercel (website)

| Var | Descrizione |
|-----|-------------|
| `LEAD_API_URL` | `http://lead-api.rescuemanager.eu` |
| `VPS_API_KEY` | Stessa chiave del VPS |

## Endpoints

### Health
- `GET /health` — No auth

### Demo (auth: x-api-key)
- `POST /api/leads/:id/activate-demo` — Attiva demo
- `GET  /api/leads/:id/demo` — Stato demo
- `POST /api/leads/:id/extend-demo` — Estendi demo

### Preventivi (auth: x-api-key)
- `POST /api/leads/:id/quotes` — Crea preventivo
- `GET  /api/leads/:id/quotes` — Lista preventivi
- `GET  /api/leads/:id/quotes/:qid` — Dettaglio
- `PUT  /api/leads/:id/quotes/:qid` — Aggiorna (solo draft)
- `POST /api/leads/:id/quotes/:qid/send` — Invia email

### Conversione (auth: x-api-key)
- `POST /api/leads/convert` — Conversione post-pagamento

### Cron (auth: x-api-key)
- `POST /api/cron/expire-demos` — Scade demo manualmente
- `POST /api/cron/expire-quotes` — Scade preventivi manualmente
- `GET  /api/cron/status` — Statistiche cron

## Architettura

```
Admin Panel → Website (Vercel proxy) → VPS lead-api (porta 3006)
                                         ├── routes/demo.js
                                         ├── routes/quotes.js
                                         ├── routes/convert.js
                                         ├── routes/cron.js
                                         ├── lib/email.js
                                         └── lib/pdf.js
```
