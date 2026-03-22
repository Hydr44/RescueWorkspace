# 🔍 Analisi CDSSO Agent Form

## Problema

Anche dopo la correzione per usare `idToken`, il server continua a restituire HTML "Submit This Form" con action `/agent/cdsso-oauth2`.

## Log Analisi

```
rvfu-auth.ts:960 [RVFU Auth] getAuthHeader: {
  using: 'idToken (come specificato nel manuale sezione 5.3)', 
  tokenLength: 1206, 
  tokenPrefix: 'eyJ0eXAiOiJKV1QiLCJraWQ...'
}
```

✅ **Il token è corretto**: idToken (JWT che inizia con `eyJ`)

```
rvfu-client.ts:701 [RVFU Client] Risposta HTML ricevuta: {
  status: 200, 
  contentType: 'text/html;charset=UTF-8', 
  title: 'Submit This Form', 
  action: 'http://formazione.ilportaledeltrasporto.it:80/agent/cdsso-oauth2', 
  hasCSRF: false
}
```

❌ **Il server restituisce ancora HTML** invece di JSON

## Possibili Cause

### 1. CDSSO (Cross-Domain Single Sign-On)

Il form con action `/agent/cdsso-oauth2` suggerisce un meccanismo CDSSO. Questo potrebbe significare:
- Le API REST richiedono una sessione SSO attiva
- Solo il Bearer token potrebbe non essere sufficiente
- Potrebbe essere necessario un cookie di sessione SSO (`iPlanetDirectoryPro`) insieme al Bearer token

### 2. Token Non Valido per API REST

Anche se il manuale dice di usare `idToken`, potrebbe essere che:
- Il token idToken ottenuto non abbia gli scope/claims necessari per le API REST
- Il token sia valido ma il server non lo riconosce come valido per le API REST
- Il client OAuth non sia configurato per accedere alle API REST

### 3. Cookie di Sessione Mancante

Le API REST potrebbero richiedere:
- Bearer token (idToken) ✅ (stiamo inviando)
- Cookie di sessione SSO (iPlanetDirectoryPro) ❓ (non stiamo inviando)

### 4. Configurazione Client OAuth

Il client OAuth `AUTODEM.RESCUEMANAGER` potrebbe:
- Non essere configurato per accedere alle API REST
- Avere scope limitati
- Richiedere configurazione aggiuntiva

## Verifica da Fare

### 1. Verificare se serve Cookie

Prova a inviare anche il cookie `iPlanetDirectoryPro` con le richieste API REST (anche se normalmente non dovrebbe essere necessario con Bearer token).

### 2. Contattare ACI/MIT

Chiedere:
- Se il client OAuth è configurato per accedere alle API REST
- Se è necessario qualcosa oltre al Bearer token (es. cookie di sessione)
- Se c'è una configurazione mancante
- Se il token idToken deve avere scope/claims specifici per le API REST

### 3. Test Manuale

Fare un test manuale con curl per vedere se il problema è nel codice o nella configurazione server:
- Invia idToken come Bearer
- Eventualmente prova anche con cookie iPlanetDirectoryPro
- Verifica la risposta del server

## Conclusione

Il codice è corretto (usa idToken come da manuale), ma il server continua a richiedere autenticazione tramite CDSSO. Questo suggerisce un problema di configurazione lato server o un requisito aggiuntivo non documentato nel manuale.

