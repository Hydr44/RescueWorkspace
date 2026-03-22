# ✅ Test accessToken Implementato

## Modifica Applicata

Ho modificato `getAuthHeader()` in `rvfu-auth.ts` per usare **accessToken** invece di **idToken**.

## Motivazione

1. Il diagramma 5.3 dice: "ID Token **(o Access Token, secondo specifica)**"
2. La nota "secondo specifica" indica che dipende dalla configurazione del client OAuth
3. Il client `AUTODEM.RESCUEMANAGER` potrebbe essere configurato per usare `accessToken`
4. Con `idToken` non funziona (server restituisce HTML invece di JSON)

## Cosa Fare

1. ✅ Codice modificato per usare `accessToken`
2. ⏳ Riavvia l'app Electron
3. ⏳ Ricollega RVFU
4. ⏳ Prova a fare una ricerca veicolo o caricare la lista VFU
5. ⏳ Verifica se ora funziona

## Risultato Atteso

### Se funziona con accessToken:
- ✅ Problema risolto!
- ✅ Il client è configurato per usare `accessToken`
- ✅ Manteniamo questa modifica

### Se NON funziona neanche con accessToken:
- ❌ Il problema è altrove
- ❌ Potrebbe essere configurazione server/client
- ❌ Potrebbe servire qualcos'altro (cookie, header aggiuntivi, ecc.)
- ⚠️ Torniamo a `idToken` e contattiamo ACI/MIT

## Rollback

Se necessario tornare a `idToken`, cambia in `rvfu-auth.ts`:

```typescript
// Torna a idToken
if (!this.tokens?.idToken) {
  throw new Error('No id token available for API calls');
}
const token = this.tokens.idToken;
```

