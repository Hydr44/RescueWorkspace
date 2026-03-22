# ✅ Fix: Problema Ricerca Veicoli

## Problema Identificato

L'utente ha ragione: **prima funzionava tutto, dopo aver aggiunto la ricerca veicoli non funziona più**.

## Cause Trovate

### 1. **Nuova Istanza di RVFUAuthService in DemolizioneRVFUForm.jsx**

In `DemolizioneRVFUForm.jsx` (riga 344), veniva creata una **NUOVA istanza** di `RVFUAuthService` invece di usare quella dal hook:

```javascript
// ❌ SBAGLIATO: Crea nuova istanza
const authService = new RVFUAuthService({
  ...RVFU_AUTH_CONFIG_FORMATION,
  environment: 'formation',
});
```

**Problema**: Questa nuova istanza:
- Non ha i token in memoria
- Deve ricaricare i token dallo storage
- Potrebbe non essere sincronizzata con l'istanza principale del hook
- Potrebbe causare problemi di timing con i token

### 2. **Chiamata API Troppo Precoce Dopo Login**

In `DemolizioniRVFU.jsx`, `loadCases()` viene chiamato immediatamente dopo il login tramite `useEffect`:

```javascript
useEffect(() => {
  loadCases();
}, [orgId, rvfuAuthenticated, rvfuTokens]);
```

**Problema**: Il server potrebbe richiedere un delay tra:
- Completamento del login OAuth
- Prima chiamata API REST

Se la chiamata API avviene troppo presto, il server potrebbe non riconoscere ancora la sessione e richiedere CDSSO.

## Fix Applicati

### 1. ✅ Usa authService dal Hook

```javascript
// ✅ CORRETTO: Usa authService dal hook
const { isAuthenticated, tokens, authService } = useRVFUAuth('formation');

// ...

if (!authService) {
  showError('Autenticazione RVFU richiesta. Effettua il login.');
  return;
}

const rvfuClient = createRVFUClient(authService, 'formation');
```

### 2. ✅ Delay Dopo Login

```javascript
const handleRVFULoginSuccess = () => {
  setShowRVFULogin(false);
  showSuccess('✅ Connesso a RVFU con successo!');
  
  setTimeout(() => {
    rvfuReloadState();
    
    // ⚠️ IMPORTANTE: Aspetta che i token siano completamente pronti
    setTimeout(() => {
      loadCases();
    }, 1000); // Delay di 1 secondo
  }, 50);
};
```

### 3. ✅ Delay nel useEffect

```javascript
useEffect(() => {
  if (rvfuAuthenticated) {
    // Aspetta un po' dopo il login per assicurarsi che i token siano pronti
    const timer = setTimeout(() => {
      loadCases();
    }, 500); // Delay di 500ms
    return () => clearTimeout(timer);
  } else {
    loadCases();
  }
}, [orgId, rvfuAuthenticated, rvfuTokens]);
```

## Risultato Atteso

1. ✅ `authService` è sempre la stessa istanza (dal hook)
2. ✅ I token sono sincronizzati tra tutti i componenti
3. ✅ Le chiamate API avvengono dopo un delay appropriato dal login
4. ✅ Il server ha tempo di stabilire completamente la sessione

## Prossimi Step

1. ✅ Codice corretto
2. ⏳ Riavvia l'app Electron
3. ⏳ Ricollega RVFU
4. ⏳ Verifica se ora funziona senza errori CDSSO

Se il problema persiste, potrebbe essere necessario:
- Aumentare il delay (da 1 secondo a 2-3 secondi)
- Verificare se il server richiede un meccanismo aggiuntivo dopo il login

