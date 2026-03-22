# Analisi Dettagliata CDSSO

## Problema

Il server continua a restituire HTML "Submit This Form" con action `/agent/cdsso-oauth2` anche dopo aver cambiato a `accessToken`.

## Cosa Significa CDSSO

**CDSSO** = Cross-Domain Single Sign-On

È un meccanismo di autenticazione che permette di condividere una sessione tra domini diversi tramite:
- Cookie di sessione
- Token intermedi
- Redirect tra domini

## Analisi Log

Dai log vediamo:
1. ✅ Login riuscito (`tokenId` ricevuto)
2. ✅ Authorization code ricevuto
3. ✅ Token exchange riuscito (`access_token` e `id_token` ricevuti)
4. ✅ Token salvati
5. ❌ Chiamata API REST → Server restituisce HTML con form che punta a `/agent/cdsso-oauth2`

## Possibili Cause

### 1. Token Non Corretto
- **Stato**: Testato sia `idToken` che `accessToken`, nessuno funziona
- **Nota**: Il log mostra ancora `Bearer eyJ...` che è JWT (idToken), ma dovremmo vedere il log di `getAuthHeader` che indica quale token viene usato

### 2. Cookie di Sessione Mancanti
L'API Gateway potrebbe richiedere:
- Cookie `iPlanetDirectoryPro` dalla sessione SSO
- Cookie di sessione CDSSO
- Altri cookie di autenticazione

**Problema**: `fetch` in Electron renderer process non invia automaticamente cookie cross-origin a meno che non sia esplicitamente configurato con `credentials: 'include'`.

### 3. Meccanismo CDSSO Non Completato
Il form HTML con action `/agent/cdsso-oauth2` potrebbe essere necessario per:
- Stabilire una sessione CDSSO tra domini
- Ottenere un token CDSSO aggiuntivo
- Completare l'autenticazione cross-domain

### 4. Configurazione Client OAuth
Il client `AUTODEM.RESCUEMANAGER` potrebbe essere configurato per:
- Richiedere un passaggio CDSSO aggiuntivo
- Non supportare Bearer token direttamente
- Richiedere cookie di sessione invece di Bearer token

## Soluzioni Possibili

### A. Aggiungere Cookie di Sessione

Proviamo ad aggiungere il cookie `iPlanetDirectoryPro` alle richieste API:

```typescript
// In makeRequest, dopo aver impostato headers
const cookies = document.cookie; // Potrebbe non funzionare in Electron
// O meglio, ottenere il cookie dalla sessione SSO
```

**Problema**: In Electron, `document.cookie` potrebbe non contenere cookie cross-origin.

### B. Usare Electron Session per Cookie

In Electron, possiamo ottenere cookie dalla sessione:

```typescript
// In electron main process o preload
const { session } = require('electron');
const cookies = await session.defaultSession.cookies.get({ 
  domain: 'formazione.ilportaledeltrasporto.it' 
});
// Inviare questi cookie nelle richieste API
```

### C. Completare il Flusso CDSSO

Se il form HTML è necessario, potremmo dover:
1. Eseguire il form POST a `/agent/cdsso-oauth2`
2. Ottenere cookie/token CDSSO dalla risposta
3. Usare questi nelle richieste API successive

**Problema**: Questo richiederebbe una logica complessa di parsing HTML e gestione form.

### D. Contattare ACI/MIT

Data la complessità del meccanismo CDSSO, potrebbe essere necessario:
1. Verificare se il client `AUTODEM.RESCUEMANAGER` richiede CDSSO
2. Verificare se c'è un modo per bypassare CDSSO (es. usando un altro endpoint)
3. Ottenere documentazione specifica sul meccanismo CDSSO per questo client

## Prossimi Step

1. ✅ Aggiunto logging dettagliato per vedere quale token viene effettivamente usato
2. ⏳ Verificare se `getAuthHeader` viene chiamato e quale token restituisce
3. ⏳ Provare ad aggiungere cookie di sessione alle richieste API
4. ⏳ Se non funziona, contattare ACI/MIT per documentazione CDSSO specifica

