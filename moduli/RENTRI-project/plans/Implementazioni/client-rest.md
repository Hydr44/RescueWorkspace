# Client REST RENTRI – Implementazione 15/11/2025

## Obiettivi
- Esporre un wrapper lato Next.js per chiamare le API RENTRI via gateway `rentri(-test).rescuemanager.eu`.
- Fornire un endpoint di diagnostica (`/api/rentri/status`) per testare rapidamente la connettività verso ciascun servizio.

## File principali
- `website/src/lib/rentri/client.ts`  
  - Base URL da env `RENTRI_GATEWAY_URL` (fallback demo).  
  - Timeout configurabile (`RENTRI_HTTP_TIMEOUT_MS`).  
  - Inietta automaticamente l’header `Authorization: Bearer <JWT>` ottenuto da `rentri/auth.ts`.
  - Il modulo `rentri/auth.ts` rileva il tipo di chiave (RSA/EC) e genera il token con algoritmo coerente (ES256 per il sigillo RENTRI) convertendo la firma in formato **JOSE**.
  - Metodi disponibili:
    - `getServiceStatus(service)` → chiama `/status` degli endpoint. Gestisce HTTP 422 (modalità STUB) come risposta valida.
    - `lookupCodifica(tabella, params)` → rotta `/codifiche/v1.0/lookup`.
    - Metodo generico `request(method, path, options)` per estendere rapidamente altri servizi (registri, formulari, ecc.).
  - Errori: `RentriError` restituisce `response` e `rawBody` per il debug.

- `website/src/app/api/rentri/status/route.ts`  
  Endpoint GET che accetta `?service=<nome>` (default `anagrafiche`) e restituisce JSON con `status`, headers e corpo della risposta RENTRI.

## Variabili d'ambiente richieste
```
RENTRI_GATEWAY_URL=https://rentri-test.rescuemanager.eu
RENTRI_HTTP_TIMEOUT_MS=30000   # opzionale
RENTRI_JWT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
RENTRI_JWT_CERT="-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----"
RENTRI_JWT_ISSUER=SCZMNL05L21D960T
RENTRI_JWT_AUDIENCE=rentrigov.demo.api   # produzione: rentrigov.api
RENTRI_JWT_TTL_SECONDS=55               # opzionale, default 55s
RENTRI_JWT_ALG=ES256                    # default per certificato EC
RENTRI_JWT_PRIVATE_KEY_FILE=/percorso/chiave.pem   # alternativa locale
RENTRI_JWT_CERT_FILE=/percorso/certificato.pem
```
(Settare in `.env.local` e nei secret di produzione.)

## Come testare
1. Avviare l’app (`npm run dev`).
2. Chiamare `GET http://localhost:3000/api/rentri/status?service=codifiche` → aspettarsi `status` 422 (modalità STUB) con corpo vuoto.
3. Controllare che i log di errore in console mostrino `RentriError` solo in caso di status non previsto.

## Esiti test 15/11/2025

| Servizio | Endpoint testato | Esito |
| --- | --- | --- |
| anagrafiche | `/api/rentri/status?service=anagrafiche` | HTTP 200, body `{"status":"Ok"}` |
| ca-rentri | `/api/rentri/status?service=ca-rentri` | HTTP 200 |
| codifiche | `/api/rentri/status?service=codifiche` | HTTP 200 (status operativo) |
| dati-registri | `/api/rentri/status?service=dati-registri` | HTTP 200 |
| formulari | `/api/rentri/status?service=formulari` | HTTP 200 |
| vidimazione-formulari | `/api/rentri/status?service=vidimazione-formulari` | HTTP 200 |

Test diretto su `GET https://rentri-test.rescuemanager.eu/codifiche/v1.0/lookup?tabella=TIPO_REGISTRO` → HTTP 401 `agIDInterop.missingAuthorizationBearerHeader`. Per i servizi reali servirà il token bearer indicato in “Autenticazione e integrità” (o header firmati), da implementare nel wrapper.

## Prossimi step
- Aggiungere retry/backoff e logging centralizzato (`rentri_events` in Supabase).  
- Integrare `lookupCodifica` nella UI per popolare dropdown (es. codici CER).  
- Creare metodi analoghi per `dati-registri`, `formulari`, `vidimazione-formulari` seguendo lo schema del wrapper.
