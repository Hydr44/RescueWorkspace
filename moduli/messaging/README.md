# messaging-server

Servizio VPS per **notifiche trasporti** e **OTP firma** via **WhatsApp Cloud API**
(account WhatsApp **centrale** RescueManager; il nome dell'azienda va nel testo).

## Endpoint
| Metodo | Path | Auth | Scopo |
|---|---|---|---|
| GET | `/health` | — | stato |
| POST | `/api/messaging/transport-notify` | Bearer utente **o** `X-Internal-Key` | notifica creazione/cambio stato |
| POST | `/api/messaging/otp/send` | Bearer utente | invia OTP firma al cliente |
| POST | `/api/messaging/otp/verify` | Bearer utente | verifica OTP → marca firma |
| POST | `/api/messaging/test` | `X-Internal-Key` | invio di prova (debug) |
| GET/POST | `/webhook/whatsapp` | challenge / firma | webhook Meta |

- **OTP**: codici in **Upstash Redis** (TTL 10 min, hash SHA-256, max 5 tentativi). Nessuna tabella DB.
- **Esito OTP**: scritto in `transports.meta.signature_otp = { phone, verified_at }` (nessuna migration).
- **Stati notificati**: `new`, `enroute`, `done`, `cancelled` (niente `assigned`).

## Variabili (in `/root/.env`)
Vedi `.env.example`. Riusa `SUPABASE_*`, `UPSTASH_REDIS_REST_*`, `VPS_API_KEY` già presenti;
aggiunge i `WHATSAPP_*`.

## Deploy (convenzione prod del VPS: /opt/<servizio>)
```bash
# sul VPS (217.154.118.37)
mkdir -p /opt/messaging-server
# copiare i file del servizio in /opt/messaging-server
cd /opt/messaging-server && npm install --production
pm2 start server.js --name messaging-server
pm2 save
```
Nginx: aggiungere un vhost (o una location) che proxy verso `127.0.0.1:3120`.
Il webhook Meta punterà a `https://<dominio>/webhook/whatsapp` con il `WHATSAPP_VERIFY_TOKEN`.

> Test invio senza dominio: dal VPS `curl -s localhost:3120/health`, e per un invio
> `curl -X POST localhost:3120/api/messaging/test -H 'X-Internal-Key: <VPS_API_KEY>' -H 'Content-Type: application/json' -d '{"to":"+39...","template":"hello_world","language":"en_US"}'`
