# 🤔 Come è Possibile se Siamo Già Autenticati?

## La Differenza tra Autenticazione OAuth e Accesso API

### ✅ Autenticazione OAuth (Funziona)
Quando effettui il login RVFU:
1. ✅ Chiamata a `/sso/json/authenticate` → Ricevi `tokenId`
2. ✅ Chiamata a `/sso/oauth2/authorize` → Ricevi `authorization_code`
3. ✅ Chiamata a `/sso/oauth2/access_token` → Ricevi `accessToken`, `idToken`, `refreshToken`

**L'autenticazione OAuth è completata con successo!** Abbiamo i token validi.

### ❌ Accesso API REST (Non Funziona)
Quando chiami l'API REST (es. `/demolitori-aci-ws/rest/concessionario/veicolo`):
1. ✅ Inviai `Authorization: Bearer <idToken>` (come da manuale)
2. ❌ Il server risponde con HTML "Submit This Form" invece di JSON
3. ❌ L'HTML contiene un form con action `/agent/cdsso-oauth2`

## Perché Succede?

### CDSSO (Cross-Domain Single Sign-On)
Il problema **CDSSO** indica che l'**API Gateway** richiede:

1. **Non solo il token Bearer**, ma anche:
   - Cookie di sessione dal SSO
   - Una sessione attiva nel browser
   - Meccanismi di autenticazione aggiuntivi non documentati

2. **Il token da solo non basta** perché:
   - L'API Gateway potrebbe richiedere cookie di sessione SSO
   - Potrebbe essere configurato per richiedere CDSSO (cross-domain SSO)
   - Il client `AUTODEM.RESCUEMANAGER` potrebbe avere configurazioni specifiche non documentate

## Cosa Significa "Submit This Form"

Quando vedi questo HTML:
```html
<form action="http://formazione.ilportaledeltrasporto.it:80/agent/cdsso-oauth2">
```

Significa che:
- L'API Gateway sta cercando di reindirizzare la richiesta attraverso un **agent CDSSO**
- Questo agent richiede una **sessione browser attiva** con cookie SSO
- Il nostro token Bearer viene rifiutato o ignorato

## Possibili Soluzioni

### 1. Cookie di Sessione Richiesti
L'API Gateway potrebbe richiedere che venga inviato anche il cookie `iPlanetDirectoryPro` (o altri cookie SSO) insieme al token Bearer.

**Problema**: I cookie di sessione SSO sono solitamente `HttpOnly`, quindi non possiamo leggerli e inviarli manualmente.

### 2. Configurazione Client OAuth Specifica
Il client `AUTODEM.RESCUEMANAGER` potrebbe essere configurato in modo diverso dal manuale generico:
- Potrebbe richiedere scopes specifici
- Potrebbe richiedere claim specifici nel token
- Potrebbe essere configurato per usare CDSSO invece di Bearer token semplice

### 3. Meccanismo CDSSO Obbligatorio
L'ambiente di formazione potrebbe avere CDSSO obbligatorio, che richiede:
- Una finestra browser attiva con sessione SSO
- Cookie di sessione inviati automaticamente dal browser
- Un proxy intermedio che gestisce il CDSSO

## Cosa Possiamo Fare

### Opzione 1: Contattare ACI/MIT
Chiedere:
1. La configurazione specifica del client `AUTODEM.RESCUEMANAGER`
2. Se sono richiesti cookie di sessione oltre al token Bearer
3. Se il client è configurato per CDSSO
4. Esempi di chiamate API funzionanti

### Opzione 2: Test con curl
Provare a fare una chiamata manuale con curl per vedere se funziona:
```bash
curl -X GET "https://formazione.ilportaledeltrasporto.it/demolitori-aci-ws/rest/concessionario/veicolo?causale=DEMOLIZIONE&tipoVeicolo=A&codiceFiscale=SCZMNL05L21D960T&targa=GN457PG" \
  -H "Authorization: Bearer <IDTOKEN>" \
  -H "Accept: application/json" \
  -H "Cookie: iPlanetDirectoryPro=<VALORE_COOKIE>" \
  -v
```

### Opzione 3: Verificare Scopes e Claims
Decodificare il JWT `idToken` per vedere:
- Quali scopes sono inclusi
- Quali claim sono presenti
- Se mancano informazioni necessarie

## Conclusione

**L'autenticazione OAuth è corretta e funziona**, ma **l'API Gateway richiede qualcos'altro** oltre al semplice token Bearer. Questo è un problema di **configurazione server-side**, non del nostro codice.

Il fatto che vediamo "Submit This Form" con action `/agent/cdsso-oauth2` indica che il server sta cercando di reindirizzare attraverso un meccanismo CDSSO, che richiede cookie di sessione browser o configurazioni specifiche non documentate nel manuale generico.

