# 📋 Istruzioni per Testare BrowserWindow API

## Cosa Ho Implementato

Ho aggiunto il supporto per usare un `BrowserWindow` invisibile per fare le chiamate API REST, così i cookie di sessione SSO vengono inviati automaticamente.

## Come Abilitarlo per il Test

### 1. Abilita in `DemolizioniRVFU.jsx`

Trova la riga dove viene creato `rvfuClient` e aggiungi il terzo parametro `true`:

```javascript
// PRIMA:
const rvfuClient = createRVFUClient(authService, 'formation');

// DOPO (per test):
const rvfuClient = createRVFUClient(authService, 'formation', true);
```

### 2. Abilita in `DemolizioneRVFUForm.jsx`

Trova la riga dove viene creato `rvfuClient` e aggiungi il terzo parametro `true`:

```javascript
// PRIMA:
const rvfuClient = createRVFUClient(authService, 'formation');

// DOPO (per test):
const rvfuClient = createRVFUClient(authService, 'formation', true);
```

## Cosa Aspettarsi

1. ✅ Le chiamate API verranno fatte tramite un BrowserWindow invisibile
2. ✅ I cookie di sessione SSO verranno inviati automaticamente
3. ✅ Se funziona, NON vedrai più l'errore "Submit This Form"
4. ✅ Dovresti ricevere risposte JSON normali

## Se Vedi Errori

- **"BrowserWindow API not available"**: Sei in un browser normale, non in Electron
- **"API call timeout"**: La chiamata ha impiegato più di 30 secondi
- **"API proxy window was closed"**: La finestra è stata chiusa prima della risposta

## Debug

Per vedere cosa succede nella finestra BrowserWindow:
1. Vai in `electron/ipc.js`
2. Trova la riga `show: false,`
3. Cambiala in `show: true,`
4. Riavvia l'app
5. Vedrai una finestra che si apre e si chiude per ogni chiamata API

