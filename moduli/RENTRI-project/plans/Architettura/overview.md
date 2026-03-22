# Architettura Interoperabilità RENTRI (Demo)

## Componenti principali
- **Client gestionale**: invia registri e FIR tramite API REST v1.0.
- **Gateway mTLS**: Nginx/VPS che presenta certificato server autorizzato e inoltra verso backend.
- **Backend RescueManager**: servizi Next.js / Node che orchestrano chiamate API RENTRI e gestiscono storage Supabase.
- **Firma digitale**: uso di certificato dominio RENTRI (`SCZMNL05L21D960T`) per sigillare header e payload dove richiesto.

## Sicurezza & autenticazione
1. **Trasporto**: HTTPS con mTLS obbligatorio; client presenta certificato dominio.
2. **Header firmati**: secondo doc `accesso-auth`, si inviano header X-RENTRI-* firmati (da implementare wrapper).
3. **Token applicativo**: alcune rotte REST restituiscono `transaction_id`; l’ID deve essere salvato per polling `/status` e `/result`.

## Flussi di alto livello
- **Registri cronologici**: invio pacchetti JSON → ricezione esito asincrono → update Supabase.
- **FIR**: compilazione bozza → upload allegati → polling stato → scarico copia firmata.
- **Vidimazione**: call `POST /vidimazione-formulari/v1.0` con dati intestazione, ritorna PDF numerato.

## Integrazione tecnica
- Adapter REST centralizzato (`apps/backend/lib/rentri/client.ts`) con:
  - gestione mTLS (cert/key/ca dal vault)
  - retriable HTTP 4xx/5xx (modalità STUB = 422)
  - logging request/response (max 4KB) per audit.
- Mapping codifiche → tabelle di supporto (API `/codifiche/v1.0/lookup`).

## Dipendenze esterne
- Certificati e CA RENTRI (cartella `../cert`).
- Documentazione aggiornata `../demo-docs` (Markdown + OpenAPI).

Ultimo aggiornamento: $(date +%Y-%m-%d)
