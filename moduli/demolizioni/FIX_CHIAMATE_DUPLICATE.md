# ✅ Fix: Chiamate Duplicate e Ritorno a IDToken

## Problema

L'errore CDSSO appariva 2 volte (prima 4) a causa di chiamate duplicate a `loadCases()`.

## Cause

1. **Due meccanismi chiamavano loadCases()**:
   - `handleRVFULoginSuccess` chiamava `loadCases()` dopo 1 secondo
   - `useEffect` chiamava `loadCases()` quando `rvfuAuthenticated` diventava `true` (con delay di 500ms)

2. **Stavamo usando accessToken invece di idToken**:
   - Il manuale dice esplicitamente di usare **IDToken**
   - Abbiamo testato con accessToken ma il problema CDSSO persiste

## Fix Applicati

### 1. ✅ Rimosso Chiamate Duplicate

**Prima**:
```javascript
useEffect(() => {
  if (rvfuAuthenticated) {
    const timer = setTimeout(() => {
      loadCases(); // Chiamata 1
    }, 500);
    return () => clearTimeout(timer);
  } else {
    loadCases();
  }
}, [orgId, rvfuAuthenticated, rvfuTokens]);
```

**Dopo**:
```javascript
useEffect(() => {
  // Carica i casi solo quando cambia orgId o quando si disconnette
  // Il login viene gestito da handleRVFULoginSuccess
  if (!rvfuAuthenticated) {
    loadCases(); // Solo se non autenticato
  }
  // Se autenticato, NON caricare qui - verrà caricato da handleRVFULoginSuccess
}, [orgId, rvfuAuthenticated]);
```

Ora `loadCases()` viene chiamato solo:
- Da `handleRVFULoginSuccess` dopo login (una sola volta, dopo 1 secondo)
- Dal `useEffect` solo se non autenticato (per caricare da Supabase)

### 2. ✅ Tornato a Usare IDToken (Come da Manuale)

**Prima**: Usavamo `accessToken` (test)

**Dopo**: Torniamo a usare `idToken` come specificato nel manuale sezione 5.3 punto 7:

> "Il Client chiama l'API Gateway passando l'**IDToken** (Bearer) nel Header Authorization."

```javascript
// ⚠️ IMPORTANTE: Secondo il manuale sezione 5.3, punto 7
if (!this.tokens?.idToken) {
  throw new Error('No id token available for API calls');
}
const token = this.tokens.idToken;
```

## Risultato Atteso

1. ✅ Solo una chiamata a `loadCases()` dopo login
2. ✅ Uso di `idToken` come da manuale
3. ✅ Nessuna chiamata duplicata

## Nota

Se il problema CDSSO persiste anche con `idToken`, allora è definitivamente un problema di configurazione server-side del client `AUTODEM.RESCUEMANAGER` che richiede meccanismi aggiuntivi non documentati nel manuale.

