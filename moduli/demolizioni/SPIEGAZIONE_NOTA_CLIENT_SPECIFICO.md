# 📖 Spiegazione: "Riferirsi comunque alle specifiche del proprio client oidc/oauth2"

## Cosa Significa

Questa nota significa che **ogni client OAuth può avere configurazioni specifiche diverse** dal manuale generico.

---

## Esempio Pratico

### Manuale Generico (linee guida)
Il manuale dice:
- Usa `idToken` per le API REST (sezione 5.3 punto 7)
- Scope: `openid profile`
- Redirect URI: `https://localhost/`

### Configurazione Specifica Client
Il client `AUTODEM.RESCUEMANAGER` potrebbe avere:
- **Token diverso**: `accessToken` invece di `idToken`
- **Scope diversi**: `openid profile rvfu_api` (con scope aggiuntivi)
- **Endpoint diversi**: Chiamate dirette alle API REST senza gateway
- **Header aggiuntivi**: Header personalizzati richiesti
- **Cookie necessari**: Cookie di sessione insieme al Bearer token

---

## Perché Esiste Questa Nota?

1. **Flessibilità**: Ogni client può essere configurato diversamente
2. **Sicurezza**: Configurazioni diverse per client diversi
3. **Evoluzione**: I client possono essere aggiornati nel tempo
4. **Personalizzazione**: ACI/MIT può configurare ogni client secondo necessità

---

## Nel Nostro Caso

### Cosa Abbiamo Fatto
- ✅ Seguito il manuale generico (usiamo `idToken`)
- ✅ Implementato il flusso corretto (5.3)
- ❌ Il server restituisce ancora HTML invece di JSON

### Cosa Significa
Probabilmente il client `AUTODEM.RESCUEMANAGER` ha una configurazione specifica che differisce dal manuale generico:
- Potrebbe richiedere `accessToken` invece di `idToken`
- Potrebbe richiedere header aggiuntivi
- Potrebbe richiedere cookie di sessione
- Potrebbe avere endpoint diversi

---

## Cosa Fare

### 1. Contattare ACI/MIT

Chiedere esplicitamente:

> "Per il client OAuth `AUTODEM.RESCUEMANAGER`, quale token deve essere usato per le API REST?
> Il manuale generico dice `idToken`, ma la configurazione specifica del nostro client potrebbe essere diversa.
> Inoltre, serve qualcosa oltre al Bearer token (es. cookie, header aggiuntivi)?"

### 2. Test Empirici

Prova entrambi i token:
- Prova con `idToken` (già fatto - non funziona)
- Prova con `accessToken` (da fare)
- Prova con entrambi (se necessario)

### 3. Documentazione Client-Specifica

Verificare se esiste documentazione specifica per il client `AUTODEM.RESCUEMANAGER` che differisce dal manuale generico.

---

## Conclusione

**"Riferirsi comunque alle specifiche del proprio client oidc/oauth2"** significa:

> **Il manuale fornisce le linee guida generali, ma ogni client OAuth può avere configurazioni specifiche diverse.**
> **Devi verificare con ACI/MIT o nella documentazione specifica del tuo client quali sono le configurazioni esatte.**

Questo spiega perché il codice è corretto secondo il manuale, ma non funziona - probabilmente il client ha una configurazione diversa!

