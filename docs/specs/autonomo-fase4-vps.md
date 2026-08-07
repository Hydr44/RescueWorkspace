# Fase 4 — vps-sdi: analisi (read-only)

> Sessione autonoma 2026-06-15. Servizi PROD: NON modificati (off-limits). Issue da riportare.
> Esclusi RENTRI/RVFU/SDI.

## 🔴 ALTA — `oauth-proxy-server` (prod) in crash-loop (382 restart)
- **Errore:** `ReferenceError: url is not defined` a `/opt/oauth-proxy-server/server.js:220` e `:233`, + `[driver/provision] error: stack depth limit exceeded` (ricorsione).
- **Causa:** nel blocco proxy di fallback (dopo i check `/api/auth/operator/*` e `/api/auth/driver/provision`) il codice costruisce `options = { hostname: url.hostname, port: url.port, path: url.pathname + url.search, ... }` ma la variabile **`url` (il target) non è mai definita** (l'unica URL è `urlObj = new URL(req.url, ...)` a riga 132, in altro scope). Ogni richiesta che non matcha gli endpoint cade qui → crash → pm2 restart.
- **Staging:** `/opt/staging/moduli/oauth-proxy-server/server.js` ha codice **diverso/più nuovo** (niente quel blocco rotto) → il bug è **solo in prod (codice stale)**.
- **Fix consigliato (richiede prod, quindi lo fai tu o autorizzi):** allineare prod a staging (deploy `staging→prod` di oauth-proxy-server). In alternativa, definire il target `url` nel blocco proxy. Poi `pm2 restart oauth-proxy-server`.
- **Impatto:** l'OAuth/provision (login operatore/driver, pairing) è instabile; il proxy generico è rotto.

## 🟠 MEDIA/ALTA — `assist-server` (prod) senza credenziali Supabase
- **Errore:** `[assist-server] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY` (ripetuto).
- **Causa:** il servizio gira ma non ha le env Supabase → non può leggere/scrivere `assistance_requests`. La funzione assistenza è di fatto non operativa.
- **Fix (richiede env prod, lo fai tu):** aggiungere `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` all'env del servizio (probabilmente `/root/.env` o l'ecosystem del servizio) e `pm2 restart assist-server --update-env`.

## ✅ Non problemi (verificati)
- `lead-api`: `[gocardless-webhook] firma non valida` = comportamento corretto (rifiuta richieste non firmate — probabile probe/mio test). OK.
- `gps-server`: "IMEI sconosciuto" = informativo (device non registrato). OK.
- `ai-server`: errore `provider_id ... invoices` = vecchio (apr 2026) e su modulo **SDI/fatture (escluso)**. Ignorato.
- `ebay-oauth`: frammenti JSON nei log = risposte API loggate, nessun crash evidente. Basso.

## Staging fixabile?
I 2 problemi sono **prod-only** (staging già a posto / è env prod). Quindi in questa fase non ci sono fix sicuri da applicare su staging per questi. Eventuali fix staging emergeranno dal bug-hunt sui repo.
