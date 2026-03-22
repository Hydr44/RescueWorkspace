# Checklist Implementazioni RENTRI

## 1. Configurazione certificati
- [x] Import `.p12` e derivazione `crt/key/chain`.
- [x] Caricamento segreti sul VPS (`/etc/nginx/ssl/rentri/`).
- [x] Configurazione Nginx mTLS (rentri-test.rescuemanager.eu).
- [ ] Configurazione variabili ambiente website (Vercel/produzione).
- [ ] Script di rinnovo con reminder 30gg (scadenza: 3 dic 2027).

## 2. Client HTTP
- [x] Wrapper `rentriClient` (fetch) con:
  - [x] Gestione base URL `RENTRI_GATEWAY_URL`
  - [x] Timeout + gestione modalità STUB (HTTP 422)
  - [x] mTLS via Nginx proxy (gateway funzionante ✅)
  - [ ] Retry + exponential backoff
- [ ] Logger centralizzato (request id, transaction id, payload hash).

## 3. Moduli funzionali
1. **Anagrafiche**: sincronizzazione unita locali e registri.
2. **Codifiche**: cache lookup con refresh programmato.
3. **Dati registri**: upload righe, gestione esiti.
4. **Formulari**: invio, polling status/result, download copia.
5. **Vidimazione**: generazione FIR virtuale e ricevuta PDF.
6. **CA RENTRI**: provisioning device firma remota.

## 4. UI/UX
- [ ] Wizard configurazione certificati + test handshake.
- [ ] Dashboard stato transazioni RENTRI.
- [ ] Notifiche operatori (email/slack) su errori.

## 5. Operazioni
- [ ] Documentare procedure runbook in `docs/ops`.
- [ ] Monitorare quota API e tempi di risposta.
- [ ] Coordinare backup log e retention.

Aggiornato al $(date +%Y-%m-%d).
