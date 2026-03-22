# 🧪 TEST: Verifica Audience Token JWT

**Priorità**: 🔴 CRITICA  
**Tempo**: 2 minuti  
**Status**: ⏳ DA FARE

---

## 🎯 OBIETTIVO

Verificare perché il token JWT ha `audience: 'formazioneAgent'` invece di `AUTODEM.RESCUEMANAGER`.

---

## 📋 PROCEDURA

### Step 1: Decodificare JWT `id_token`

Dopo il login, decodifica il JWT `id_token` e verifica:

1. **Campo `aud`** (audience):
   - Valore atteso: `AUTODEM.RESCUEMANAGER`
   - Valore osservato: `formazioneAgent` ❌

2. **Campo `iss`** (issuer):
   - Valore: `https://ssoformazione.ilportaledeltrasporto.it/sso/oauth2`

3. **Campo `azp`** (authorized party):
   - Verificare se presente e quale valore ha

4. **Altri campi rilevanti**:
   - `sub` (subject)
   - `exp` (expiration)
   - `iat` (issued at)

---

## 🔍 COME DECODIFICARE JWT

### Metodo 1: Online (jwt.io)
1. Vai su https://jwt.io
2. Incolla il `id_token` completo
3. Verifica i campi nel payload

### Metodo 2: Da codice
```javascript
// In console browser dopo login
const tokens = JSON.parse(sessionStorage.getItem('rvfu-tokens'));
const idToken = tokens.idToken;

// Decodifica payload (seconda parte del JWT)
const parts = idToken.split('.');
const payload = JSON.parse(atob(parts[1]));

console.log('JWT Payload:', payload);
console.log('Audience:', payload.aud);
console.log('Authorized Party:', payload.azp);
```

### Metodo 3: Da log Electron
I log del terminale già mostrano:
```
tokenInfo: {
  audience: 'formazioneAgent',
  ...
}
```

---

## 📊 RISULTATI ATTESI

### Se `aud: "formazioneAgent"`
**Significato**: Il server SSO emette token con audience del portale, non del nostro client ID.

**Possibili cause**:
1. Server SSO fa "token exchange" automatico
2. `AUTODEM.RESCUEMANAGER` non è autorizzato per API REST
3. Serve usare `formazioneAgent` come client ID

**Azioni**:
- Chiedere ad ACI/MIT perché
- Verificare se possiamo usare `formazioneAgent`

---

### Se `aud: "AUTODEM.RESCUEMANAGER"`
**Significato**: Il token è corretto, il problema è altrove.

**Azioni**:
- Continuare con altri test
- Verificare permessi del client ID

---

## 📝 COMPILARE RISULTATI

**Data Test**: _da compilare_  
**Token analizzato**: `id_token` / `access_token`  
**Audience trovata**: `formazioneAgent` / `AUTODEM.RESCUEMANAGER` / altro  
**Authorized Party (`azp`)**: _da compilare_  
**Altri campi rilevanti**: _da compilare_  
**Conclusioni**: _da compilare_

---

**Ultimo aggiornamento**: 2026-01-23
