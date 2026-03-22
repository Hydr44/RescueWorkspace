# Nota: "Riferirsi comunque alle specifiche del proprio client oidc/oauth2"

## Cosa Significa

La frase **"Riferirsi comunque alle specifiche del proprio client oidc/oauth2"** nel manuale significa:

✅ **Il nostro client OAuth** (`AUTODEM.RESCUEMANAGER`) potrebbe avere **configurazioni specifiche** diverse dal manuale generico.

❌ **NON significa** che dobbiamo trovare un intermediario o un client esterno che faccia da tramite.

## Cosa Dobbiamo Fare

1. **Contattare ACI/MIT** per verificare le configurazioni specifiche del client `AUTODEM.RESCUEMANAGER`:
   - Quale token usare per le API REST? (`idToken` o `accessToken`?)
   - È richiesto CDSSO?
   - Ci sono header aggiuntivi necessari?
   - Il `redirect_uri` è corretto?

2. **Il problema attuale**: Il server restituisce HTML con CDSSO invece di JSON, anche con Bearer token valido.

## Possibili Configurazioni Specifiche del Client

Il client `AUTODEM.RESCUEMANAGER` potrebbe essere configurato per:
- Usare `idToken` invece di `accessToken` (o viceversa)
- Richiedere CDSSO per le API REST
- Richiedere cookie di sessione aggiuntivi
- Usare un meccanismo di autenticazione diverso

## Conclusione

La nota significa semplicemente: **"Verifica con ACI/MIT le configurazioni specifiche del tuo client, perché potrebbero differire dal manuale generico"**.

Non serve un intermediario esterno.

