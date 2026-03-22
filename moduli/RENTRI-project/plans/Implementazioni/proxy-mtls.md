# Configurazione Reverse Proxy RENTRI (VPS 217.154.118.37)

## 15/11/2025 – Setup sottodomini
1. Creati record DNS `rentri.rescuemanager.eu` e `rentri-test.rescuemanager.eu` → IP VPS.
2. Installato `certbot` via snap e richiesto certificato LE unico:
   - percorso: `/etc/letsencrypt/live/rentri.rescuemanager.eu/{fullchain,privkey}.pem`
   - scadenza attuale: 13/02/2026 (autorenew attivo).

## Import certificato dominio RENTRI
- File sorgente: `RENTRI-project/cert/SCZMNL05L21D960T.p12` (pass `WY6?9xSH`).
- Estratti e copiati in VPS:
  - `/etc/nginx/certs/SCZMNL05L21D960T.crt.pem`
  - `/etc/nginx/certs/SCZMNL05L21D960T.key.pem` (chmod 600)
  - `/etc/nginx/certs/SCZMNL05L21D960T-chain.pem`

## Nginx
- Nuovo vhost `/etc/nginx/sites-available/rentri` (linkato in `sites-enabled`).
- Due server block:
  1. `rentri-test.rescuemanager.eu` → proxy verso `https://demoapi.rentri.gov.it`, mTLS client con cert RENTRI.
  2. `rentri.rescuemanager.eu` → proxy verso `https://api.rentri.gov.it` (prod futuro), stesso setup.
- Resolver espliciti `1.1.1.1` e `8.8.8.8` per evitare errori DNS.
- Log dedicati (`/var/log/nginx/rentri-*.access.log`).
- Reload eseguito (`nginx -t && systemctl reload nginx`).

## Test eseguiti (con `curl -k` per via dell’ambiente locale)
- `https://rentri-test.rescuemanager.eu/status` → HTTP 200 (proxy demo).
- `https://rentri.rescuemanager.eu/status` → HTTP 200 (proxy prod).

## TODO immediati
- Caricare su Vercel/VPS le variabili `RENTRI_GATEWAY_URL` puntando ai nuovi host.
- Implementare client REST che colpisce `https://rentri-test.rescuemanager.eu/...` (modalità STUB) entro Fase 1 della roadmap.

## Config variabili ambiente (15/11/2025)
- Aggiunte a `/etc/environment` sulla VPS:
  - `RENTRI_GATEWAY_URL=https://rentri-test.rescuemanager.eu`
  - `RENTRI_HTTP_TIMEOUT_MS=30000`
- Riavviato `nginx` per sicurezza (`systemctl restart nginx`).
- Da replicare su Vercel/servizi serverless per mantenere lo stesso base URL.
