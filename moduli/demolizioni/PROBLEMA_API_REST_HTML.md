# ⚠️ Problema API REST - Server Restituisce HTML

## Stato Attuale

Il server restituisce HTML "Submit This Form" invece di JSON quando si chiamano gli endpoint REST RVFU, anche se:
- ✅ L'autenticazione OAuth funziona correttamente
- ✅ Il token `accessToken` viene salvato e usato correttamente
- ✅ L'URL è quello indicato nel manuale (`https://formazione.ilportaledeltrasporto.it`)

## Possibili Cause

### 1. URL Base Errato per API REST

Il manuale indica che l'URL base per i servizi è:
- Formazione: `https://formazione.ilportaledeltrasporto.it/`

Ma potrebbe essere che:
- Gli endpoint REST richiedano l'URL interno: `http://gestione-veicolo-fuoriuso-tst.serviziaci.it` (con VPN)
- L'URL pubblico non sia configurato per le API REST

### 2. Token Non Valido per API REST

Il token OAuth potrebbe essere valido solo per SSO, non per le API REST. Potrebbe essere necessario:
- Un token diverso
- Una configurazione diversa del client OAuth
- Scopes diversi nella richiesta OAuth

### 3. Configurazione Client OAuth

Il client OAuth `AUTODEM.RESCUEMANAGER` potrebbe non essere configurato correttamente per:
- Accedere alle API REST
- Usare gli endpoint pubblici

## Azioni da Intraprendere

1. **Contattare ACI/MIT** per verificare:
   - Quale URL usare per le API REST (pubblico o interno?)
   - Se il token OAuth è valido per le API REST
   - Se il client OAuth è configurato correttamente
   - Se ci sono header aggiuntivi richiesti

2. **Provare URL Interno** (se VPN è attiva):
   ```typescript
   const baseUrl = 'http://gestione-veicolo-fuoriuso-tst.serviziaci.it';
   ```

3. **Verificare Scopes OAuth**: Potrebbero essere necessari scopes diversi per le API REST

## Note

Il fatto che il server restituisca "Submit This Form" suggerisce che:
- Il server non riconosce il token
- C'è un problema di autenticazione/autorizzazione
- L'endpoint richiede qualcosa di diverso

Possiamo provare a cambiare l'URL base all'interno `http://gestione-veicolo-fuoriuso-tst.serviziaci.it` se la VPN è attiva.

