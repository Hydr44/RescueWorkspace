# Riepilogo Situazione CDSSO

## Problema Attuale

1. ✅ **Login funziona**: Autenticazione OAuth riuscita, token ricevuti correttamente
2. ❌ **API REST falliscono**: Server restituisce HTML "Submit This Form" con action `/agent/cdsso-oauth2` invece di JSON

## Analisi Log

Dal log vediamo:
- `tokenType: 'JWT (probabilmente idToken)'` → Il token inviato è JWT (`eyJ...`)
- Il log `[RVFU Auth] getAuthHeader:` **NON appare**, quindi:
  - O il metodo non viene chiamato
  - O il codice non è stato ricaricato (cache)
  - O c'è un problema con il codice

## Possibili Cause

### 1. Codice Non Ricaricato
Il codice è stato modificato per usare `accessToken`, ma l'app potrebbe non averlo ricaricato.

**Soluzione**: Riavvia completamente l'app Electron (chiudi e riapri).

### 2. AccessToken È JWT (Insolito)
Se l'`accessToken` stesso è un JWT (inizia con `eyJ`), questo è insolito ma possibile in alcuni sistemi OAuth.

**Soluzione**: Verificare con i log se l'`accessToken` ricevuto è effettivamente JWT.

### 3. CDSSO Richiesto
L'API Gateway potrebbe richiedere un meccanismo CDSSO (Cross-Domain SSO) che non è stato completato durante il login.

**Soluzione**: Contattare ACI/MIT per verificare se CDSSO è necessario e come implementarlo.

### 4. Configurazione Client Specifica
Il client `AUTODEM.RESCUEMANAGER` potrebbe richiedere configurazioni specifiche diverse dal manuale generico (vedi nota "Riferirsi comunque alle specifiche del proprio client oidc/oauth2").

**Soluzione**: Contattare ACI/MIT per verificare le configurazioni specifiche del client.

## Prossimi Step

1. ✅ Aggiunto logging esplicito in `getAuthHeader()` per vedere se viene chiamato
2. ⏳ Riavvia completamente l'app Electron
3. ⏳ Ricollega RVFU e controlla i log
4. ⏳ Verifica se `[RVFU Auth] ⚠️ getAuthHeader CHIAMATO:` appare nei log
5. ⏳ Se il problema persiste, contattare ACI/MIT per:
   - Verificare quale token usare (`idToken` o `accessToken`)
   - Verificare se CDSSO è necessario
   - Ottenere configurazioni specifiche del client `AUTODEM.RESCUEMANAGER`

