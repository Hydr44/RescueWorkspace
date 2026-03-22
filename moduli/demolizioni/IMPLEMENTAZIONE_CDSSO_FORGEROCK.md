# 🔄 Implementazione CDSSO Secondo Manuale ForgeRock

**Data:** 22 gennaio 2026  
**Fonte:** [ForgeRock/PingIdentity Documentation](https://docs.pingidentity.com/pingoneaic/am-authentication/about-sso.html#about-cross-realm-sso)

---

## 📚 Cosa Dice il Manuale ForgeRock

### Punti Chiave

1. **Cookie Domain**: 
   > "Un cookie con un valore come `Domain=app1.example.net` non funzionerà per sottodomini simili, come `app2.example.net`. La soluzione è configurare il token SSO su `example.net`."

2. **CDSSO Flow**:
   > "Web agents e Java agents avvolgono il token di sessione SSO all'interno di un token OpenID Connect (OIDC) JSON Web Token (JWT). Durante il flusso CDSSO, gli agenti creano cookie per i diversi domini specificati nel profilo dell'agente, e l'endpoint `oauth2/authorize` autorizza i diversi domini dei cookie come richiesto."

3. **Form POST**:
   > "Il token viene inviato con `response_mode=form_post` (cioè un HTML con un form che si auto-invia)."

---

## 🔄 Flusso CDSSO Secondo ForgeRock

### Schema Completo

1. **Browser → Resource (Dominio A)**
   - Browser chiede risorsa protetta su `formazione.ilportaledeltrasporto.it`
   - Non ha cookie valido per quel dominio

2. **Agent → Redirect a IdP**
   - L'Agent reindirizza verso l'IdP su `ssoformazione.ilportaledeltrasporto.it`
   - Se l'utente è già loggato (cookie SSO sul dominio AM) → **salta login** e torna subito

3. **IdP → Browser: Form POST con Token**
   - L'IdP risponde con HTML che fa POST verso `/agent/cdsso-oauth2`
   - Body: `id_token` (JWT) 
   - Il form si auto-invia (`onload="javascript:document.forms[0].submit()"`)

4. **CDSSO Completo**
   - Il form POST completa il CDSSO
   - I cookie vengono creati per i diversi domini specificati
   - La sessione SSO è ora attiva per tutti i domini

5. **Riprova Richiesta Originale**
   - Dopo il CDSSO, riprova la richiesta originale
   - Ora i cookie sono disponibili → richiesta funziona

---

## 🔧 Implementazione

### Strategia: Finestre Separate + CDSSO Automatico

1. **Finestra Login OAuth** (separata, come prima)
   - Per il login iniziale
   - Imposta cookie `iPlanetDirectoryPro` sul dominio parent `.ilportaledeltrasporto.it`

2. **Finestra Persistente API** (separata, come prima)
   - Per le API calls
   - Quando viene rilevato CDSSO, naviga al form CDSSO nella stessa finestra
   - Submit automatico del form
   - Riprova richiesta originale

### Vantaggi

- ✅ Cookie sul dominio parent funziona su tutti i sottodomini
- ✅ CDSSO completato automaticamente nella finestra persistente
- ✅ Nessuna interruzione per l'utente
- ✅ Allineato con il manuale ForgeRock

---

## 📝 Checklist Implementazione

### 1. Cookie sul Dominio Parent ✅ (Già Fatto)

```javascript
// Imposta cookie sul dominio parent
await defaultSession.cookies.set({
  url: 'https://ilportaledeltrasporto.it',
  name: 'iPlanetDirectoryPro',
  value: tokenId,
  domain: '.ilportaledeltrasporto.it', // ✅ Dominio parent
  path: '/',
  secure: true,
  httpOnly: true,
});
```

### 2. Rilevamento CDSSO ✅ (Già Fatto)

Quando la risposta è HTML con form CDSSO:
```javascript
if (text.includes('/agent/cdsso-oauth2') && text.includes('name="id_token"')) {
  // CDSSO rilevato
}
```

### 3. Navigazione al CDSSO nella Finestra Persistente

**DA IMPLEMENTARE:**
```javascript
// Quando rileviamo CDSSO nella finestra persistente
if (isCDSSO) {
  // Estrai id_token e formAction
  const idToken = extractIdTokenFromForm(html);
  const formAction = extractFormAction(html);
  
  // Naviga alla pagina CDSSO nella stessa finestra
  persistentApiWindow.loadURL(formAction, {
    postData: [{
      type: 'application/x-www-form-urlencoded',
      bytes: Buffer.from(`id_token=${idToken}`)
    }],
    extraHeaders: 'Content-Type: application/x-www-form-urlencoded\r\n'
  });
  
  // Aspetta che la navigazione completi
  await new Promise((resolve) => {
    persistentApiWindow.webContents.once('did-finish-load', resolve);
  });
  
  // Riprova la richiesta originale
  return await retryOriginalRequest();
}
```

### 4. Riprova Richiesta Originale

Dopo il CDSSO, riprova la richiesta originale con i cookie aggiornati.

---

## 🎯 Implementazione Completa

### Step 1: Ripristinare Finestre Separate

- Finestra login OAuth (separata)
- Finestra persistente API (separata)
- Cookie sul dominio parent `.ilportaledeltrasporto.it`

### Step 2: Implementare CDSSO Automatico

Quando viene rilevato CDSSO:
1. Naviga nella finestra persistente al form CDSSO
2. Submit automatico del form
3. Attendi completamento
4. Riprova richiesta originale

---

**Status**: 📋 Piano implementazione - Pronto per esecuzione
