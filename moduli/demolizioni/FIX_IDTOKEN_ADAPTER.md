# ✅ Fix: Rimosso Adapter che Usava idToken

## Problema Trovato

Nel file `DemolizioniRVFU.jsx` c'era un adapter che usava direttamente `idToken` invece di chiamare `authService.getAuthHeader()`:

```javascript
const rvfuAuthAdapter = {
  isAuthenticated: () => !!rvfuTokens?.idToken,
  getAuthHeader: () => {
    if (!rvfuTokens?.idToken) {
      throw new Error('Token RVFU non disponibile');
    }
    return `Bearer ${rvfuTokens.idToken}`; // ❌ USA idToken DIRETTAMENTE
  },
  refreshTokens: async () => {
    throw new Error('Sessione RVFU scaduta: effettua nuovamente il login.');
  },
};
```

Questo spiega perché:
- ❌ Il log `[RVFU Auth] getAuthHeader CHIAMATO:` non appariva
- ❌ Il token inviato era sempre JWT (`eyJ...`) invece di opaco
- ❌ Usava sempre `idToken` invece di `accessToken`

## Fix Applicato

1. ✅ Rimosso l'adapter `rvfuAuthAdapter`
2. ✅ Usato direttamente `authService` dal hook `useRVFUAuth`
3. ✅ Esposto `authService` nel return del hook `useRVFUAuth`
4. ✅ Aggiornato `DemolizioniRVFU.jsx` per usare `authService` direttamente

## Codice Corretto

```javascript
const { 
  isAuthenticated: rvfuAuthenticated, 
  logout: rvfuLogout,
  tokens: rvfuTokens,
  reloadState: rvfuReloadState,
  authService, // ✅ Aggiunto
} = useRVFUAuth('formation');

// ...

if (rvfuAuthenticated && authService) {
  try {
    // ✅ Usa direttamente authService invece di creare un adapter
    // authService.getAuthHeader() usa accessToken (come configurato in rvfu-auth.ts)
    const rvfuClient = createRVFUClient(authService, 'formation');
```

## Risultato Atteso

Ora `authService.getAuthHeader()` viene chiamato correttamente e:
- ✅ Usa `accessToken` (opaco) invece di `idToken` (JWT)
- ✅ Il log `[RVFU Auth] 🔍 getAuthHeader() CHIAMATO - INIZIO` appare
- ✅ Il token inviato dovrebbe essere opaco (`sgWwSBeX...`) invece di JWT (`eyJ...`)

## Prossimi Step

1. ✅ Codice corretto
2. ⏳ Riavvia l'app Electron
3. ⏳ Ricollega RVFU
4. ⏳ Verifica i log per vedere:
   - `[RVFU Auth] 🔍 getAuthHeader() CHIAMATO - INIZIO`
   - `[RVFU Client] Request:` con `tokenType: 'OPAQUE (probabilmente accessToken)'`
   - Se il problema CDSSO persiste, potrebbe essere necessario contattare ACI/MIT

