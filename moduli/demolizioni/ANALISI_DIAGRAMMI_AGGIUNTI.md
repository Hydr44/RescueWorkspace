# 🔍 Analisi Diagrammi Aggiunti

## Diagrammi Ricevuti

1. **OIDC Authorization Code Flow Standard** (Sezione 5.1)
2. **Stati Veicolo RVFU** (Sezione 3)
3. **Flusso Autenticazione IAM-MIT con /authenticate** (Sezione 5.3) ⭐ CRITICO

---

## 🎯 Analisi Flusso 5.3 - Punto Critico

### Passo [7] - Chiamata ai Services

Nel diagramma 5.3, il passo [7] dice:

> ### [7] Chiamata ai Services con ID Token
> Software House → API Gateway / Services
> 
> La Software House invoca i Web Services protetti passando:
> - **ID Token (o Access Token, secondo specifica)**
> 
> I Services:
> - validano il token
> - estraggono l'identità utente
> - autorizzano la richiesta

### ⚠️ NOTA IMPORTANTE

Il diagramma dice **"secondo specifica"** - questo significa che dipende dalla configurazione del client OAuth!

---

## 📝 Nota "Riferirsi comunque alle specifiche del proprio client oidc/oauth2"

**Cosa significa:**
- Ogni client OAuth può avere configurazioni diverse
- Il manuale fornisce le linee guida generali
- Ma ogni client (`AUTODEM.RESCUEMANAGER` nel nostro caso) può avere:
  - Scope diversi
  - Token diversi da usare per le API (idToken vs accessToken)
  - Configurazioni aggiuntive
  - Endpoint specifici

**Nel nostro caso:**
- Il manuale generico dice di usare `idToken` (sezione 5.3 punto 7)
- Ma la configurazione del client `AUTODEM.RESCUEMANAGER` potrebbe richiedere `accessToken`
- Oppure potrebbe richiedere qualcosa di completamente diverso

---

## 🔍 Confronto Flussi

### Flusso Standard OIDC (5.1) vs Flusso RVFU (5.3)

**Differenze chiave:**

1. **Step 0**: RVFU ha un passo preliminare `/authenticate` che standard OIDC non ha
2. **Step 3**: RVFU usa cookie `iPlanetDirectoryPro` invece di redirect browser
3. **Step 7**: RVFU chiama "API Gateway / Services" invece di risorse standard

### Il Problema: API Gateway vs API REST Dirette

Il diagramma dice "API Gateway / Services" - questo suggerisce che:
- C'è un **API Gateway** intermedio
- Le API REST potrebbero essere dietro questo gateway
- Il gateway potrebbe richiedere autenticazione diversa da quella delle API REST dirette

---

## 💡 Ipotesi sul Problema CDSSO

Il form HTML con action `/agent/cdsso-oauth2` suggerisce:

1. **CDSSO (Cross-Domain Single Sign-On)**:
   - Il sistema usa un meccanismo CDSSO per autenticare le richieste
   - Questo richiede una sessione SSO attiva
   - Solo il Bearer token potrebbe non essere sufficiente

2. **API Gateway come Intermediario**:
   - Le chiamate alle API REST passano attraverso un API Gateway
   - Il gateway richiede autenticazione CDSSO
   - Questo spiegherebbe perché otteniamo HTML invece di JSON

3. **Token Non Corretto**:
   - Il client `AUTODEM.RESCUEMANAGER` potrebbe essere configurato per usare `accessToken` invece di `idToken`
   - Oppure potrebbe richiedere entrambi i token
   - O potrebbe richiedere un token diverso

---

## 🎯 Cosa Verificare

### 1. Configurazione Client OAuth

**Domande da fare ad ACI/MIT:**
- Quale token deve essere usato per le API REST con client `AUTODEM.RESCUEMANAGER`?
- È `idToken` o `accessToken`?
- Serve qualcosa di diverso rispetto al manuale generico?

### 2. API Gateway

**Verificare:**
- C'è un API Gateway intermedio?
- Il gateway richiede autenticazione CDSSO?
- Come si autentica al gateway?

### 3. Cookie di Sessione

**Verificare:**
- Serve mantenere il cookie `iPlanetDirectoryPro` anche per le API REST?
- Il cookie deve essere inviato insieme al Bearer token?

---

## 🔄 Possibili Soluzioni da Testare

### Opzione 1: Usare accessToken invece di idToken

Se il client è configurato per usare `accessToken`, proviamo a cambiare:

```typescript
// Invece di idToken, usa accessToken
return `Bearer ${this.tokens.accessToken}`;
```

### Opzione 2: Inviare anche Cookie

Prova a inviare il cookie `iPlanetDirectoryPro` insieme al Bearer token (anche se normalmente non dovrebbe servire).

### Opzione 3: Contattare ACI/MIT

Chiedere esplicitamente:
- Quale token usare per le API REST con client `AUTODEM.RESCUEMANAGER`
- Se serve qualcosa oltre al Bearer token
- Se c'è un API Gateway e come autenticarsi

---

## 📋 Conclusioni

1. ✅ Il flusso di autenticazione è corretto (segue il diagramma 5.3)
2. ⚠️ Il problema è probabilmente nella configurazione del client OAuth
3. ⚠️ La nota "secondo specifica" indica che ogni client può avere configurazioni diverse
4. 🎯 **NECESSARIO**: Verificare con ACI/MIT la configurazione specifica del client `AUTODEM.RESCUEMANAGER`

