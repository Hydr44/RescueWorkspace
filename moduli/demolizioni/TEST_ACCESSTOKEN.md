# 🧪 Test: Prova accessToken invece di idToken

## Situazione

Dal diagramma 5.3, passo [7]:
> "La Software House invoca i Web Services protetti passando: **ID Token (o Access Token, secondo specifica)**"

La nota "secondo specifica" significa che **dipende dalla configurazione del client OAuth specifico**.

## Ipotesi

Il client `AUTODEM.RESCUEMANAGER` potrebbe essere configurato per usare **accessToken** invece di **idToken** per le API REST.

## Test da Fare

### Opzione 1: Cambiare temporaneamente a accessToken

Modifica `rvfu-auth.ts` temporaneamente per testare:

```typescript
getAuthHeader(): string {
  if (!this.tokens) {
    this.tokens = this.loadTokens();
  }
  
  // TEST: Prova accessToken invece di idToken
  // Il diagramma dice "secondo specifica" - potrebbe essere accessToken per questo client
  if (!this.tokens?.accessToken) {
    throw new Error('No access token available for API calls');
  }
  
  const token = this.tokens.accessToken;
  
  console.log('[RVFU Auth] getAuthHeader:', {
    using: 'accessToken (TEST - secondo specifica client)',
    tokenLength: token.length,
    tokenPrefix: token.substring(0, 20) + '...',
  });
  
  return `Bearer ${token}`;
}
```

### Opzione 2: Fare un test manuale con curl

Dopo il login, prova manualmente:

```bash
# Ottieni i token dalla console del browser
# Poi prova con accessToken:
curl -v \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Accept: application/json" \
  "https://formazione.ilportaledeltrasporto.it/demolitori-aci-ws/rest/concessionario/consulta/VFU?pageNumber=0&pageSize=10&paged=true"

# E confronta con idToken:
curl -v \
  -H "Authorization: Bearer <ID_TOKEN>" \
  -H "Accept: application/json" \
  "https://formazione.ilportaledeltrasporto.it/demolitori-aci-ws/rest/concessionario/consulta/VFU?pageNumber=0&pageSize=10&paged=true"
```

## Risultato Atteso

Se funziona con `accessToken`:
- ✅ Il problema è risolto
- ✅ Il client è configurato per usare `accessToken`
- ✅ Dobbiamo aggiornare il codice per usare `accessToken` invece di `idToken`

Se NON funziona neanche con `accessToken`:
- ❌ Il problema è altrove
- ❌ Potrebbe essere configurazione server/client
- ❌ Potrebbe servire qualcos'altro (cookie, header aggiuntivi, ecc.)

