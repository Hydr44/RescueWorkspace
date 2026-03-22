# 🔴 Analisi 403 Forbidden - Tutti i Test Falliti

**Data**: 2026-01-23  
**Status**: ❌ TUTTI I TEST FALLITI - 403 PERSISTE

---

## 📊 SITUAZIONE ATTUALE

### Cosa Funziona ✅
1. **Login OAuth2**: ✅ Funziona perfettamente
2. **Token ricevuti**: ✅ `access_token`, `id_token`, `refresh_token` tutti presenti
3. **Cookie di sessione**: ✅ Presenti (`iPlanetDirectoryPro`, `am-auth-jwt`, `agent-authn-tx-*`)
4. **Audience token**: ✅ Corretta (`formazioneAgent`)
5. **CDSSO**: ✅ Gestito automaticamente

### Cosa NON Funziona ❌
1. **API REST**: ❌ 403 Forbidden su `/agenzia/consulta/VFU`
2. **Tutti i test**: ❌ Falliti (TEST 1, 8, 3, 2, 7)

---

## 🔍 ANALISI LOG COMPLETO

### Richiesta Inviata
```
GET https://formazione.ilportaledeltrasporto.it/agenzia/consulta/VFU?causale=DEMOLIZIONE&targa=VA058AJ&tipoVeicolo=A
Headers:
  Authorization: Bearer <id_token con audience formazioneAgent> ✅
  Cookie: iPlanetDirectoryPro, am-auth-jwt, agent-authn-tx-*, GUEST_LANGUAGE_ID ✅
  Accept: application/json, text/json, */* ✅
  X-Requested-With: XMLHttpRequest ✅
```

### Risposta Ricevuta
```
Status: 403 Forbidden
Content-Type: text/html; charset=iso-8859-1
Body: "Forbidden\n\nYou don't have permission to access this resource."
```

### Token Info
```json
{
  "audience": "formazioneAgent", ✅ CORRETTO
  "issuer": "https://ssoformazione.ilportaledeltrasporto.it/sso/oauth2", ✅
  "subject": "DETO003001...", ✅
  "audienceMatch": true ✅
}
```

### Cookie Presenti
- ✅ `iPlanetDirectoryPro` (sessione SSO)
- ✅ `am-auth-jwt` (token JWT con audience corretta)
- ✅ `agent-authn-tx-*` (transazione agent)
- ✅ `GUEST_LANGUAGE_ID`

---

## 🤔 PERCHÉ 403?

### Possibili Cause

#### 1. 🔴 Permessi Utente Mancanti (PIÙ PROBABILE)
**Ipotesi**: L'utente `DETO003001` non ha i permessi necessari per accedere all'endpoint `/agenzia/consulta/VFU`.

**Evidenza**:
- Login funziona ✅
- Token corretti ✅
- Cookie corretti ✅
- Ma 403 Forbidden ❌

**Domanda per ACI/MIT**:
> L'utente `DETO003001` ha i permessi per accedere a `/agenzia/consulta/VFU`?
> - Quali ruoli/permessi servono?
> - Serve una configurazione aggiuntiva?

---

#### 2. 🔴 Endpoint Sbagliato
**Ipotesi**: L'endpoint `/agenzia/consulta/VFU` non è quello corretto per questo tipo di ricerca.

**Possibili endpoint alternativi**:
- `/concessionario/veicolo` (come da OpenAPI originale)
- `/cr/consulta/VFU` (variante)
- Altro endpoint?

**Domanda per ACI/MIT**:
> Quale è l'endpoint corretto per ricerca veicolo per targa?
> - `/agenzia/consulta/VFU`?
> - `/concessionario/veicolo`?
> - Altro?

---

#### 3. 🔴 Client ID Non Autorizzato
**Ipotesi**: Il client ID `AUTODEM.RESCUEMANAGER` (o `formazioneAgent`) non è autorizzato per questo endpoint.

**Evidenza**:
- Token ha audience `formazioneAgent` (corretto)
- Ma potrebbe essere che `formazioneAgent` non abbia permessi per API REST

**Domanda per ACI/MIT**:
> Il client ID `AUTODEM.RESCUEMANAGER` è autorizzato per API REST?
> - Serve configurazione aggiuntiva?
> - Serve usare un client ID diverso?

---

#### 4. 🔴 Ruolo/Scope Mancante
**Ipotesi**: Serve uno scope o ruolo specifico che non abbiamo.

**Configurazione attuale**:
- Scope: `openid profile`
- Ruolo: Non specificato

**Domanda per ACI/MIT**:
> Serve uno scope aggiuntivo per API REST?
> - Es. `rvfu`, `api`, `consulta`?
> - Serve un ruolo specifico?

---

#### 5. 🔴 Ambiente/Configurazione Server
**Ipotesi**: Il server di formazione potrebbe avere configurazioni diverse o restrittive.

**Domanda per ACI/MIT**:
> L'ambiente `formazione` ha le stesse configurazioni di produzione?
> - Ci sono limitazioni specifiche?
> - Serve una configurazione particolare?

---

## 🧪 TEST EFFETTUATI (TUTTI FALLITI)

### ✅ TEST 1: `id_token` invece di `access_token`
- **Status**: ❌ Fallito
- **Risultato**: 403 Forbidden

### ✅ TEST 8: `id_token` + CDSSO (BrowserWindow)
- **Status**: ❌ Fallito
- **Risultato**: 403 Forbidden

### ✅ TEST 3: Navigazione finestra + `net.request` con cookie
- **Status**: ❌ Fallito
- **Risultato**: 403 Forbidden

### ✅ TEST 2: BrowserWindow completo
- **Status**: ❌ Fallito
- **Risultato**: 403 Forbidden

### ✅ TEST 7: Cookie + Bearer Token
- **Status**: ❌ Fallito
- **Risultato**: 403 Forbidden

---

## 📋 CONCLUSIONI

### Cosa Abbiamo Verificato
1. ✅ Token corretti (`id_token` con audience `formazioneAgent`)
2. ✅ Cookie di sessione presenti
3. ✅ CDSSO gestito
4. ✅ Headers corretti
5. ✅ URL corretto (secondo OpenAPI)

### Cosa NON Abbiamo Verificato
1. ❓ Permessi utente
2. ❓ Ruoli/scope necessari
3. ❓ Configurazione client ID
4. ❓ Endpoint alternativo

---

## 🎯 PROSSIMI PASSI

### 1. Contattare ACI/MIT (PRIORITÀ ALTA)
Usare `DOMANDE_ACI_MIT_RVFU.md` con focus su:
- **Domanda 3.1b**: Perché token ha audience `formazioneAgent`?
- **Nuova domanda**: Perché 403 Forbidden anche con token e cookie corretti?
- **Nuova domanda**: L'utente `DETO003001` ha i permessi per `/agenzia/consulta/VFU`?
- **Nuova domanda**: Quale endpoint corretto per ricerca veicolo?

### 2. Verificare Endpoint Alternativi
Provare:
- `/concessionario/veicolo` (come da OpenAPI originale)
- `/cr/consulta/VFU`
- Altri endpoint documentati

### 3. Verificare Permessi Utente
Chiedere ad ACI/MIT:
- Quali ruoli servono?
- L'utente ha i permessi necessari?
- Serve configurazione aggiuntiva?

---

## 📝 DOMANDE PRIORITARIE PER ACI/MIT

### 🔴 CRITICHE

1. **Perché 403 Forbidden anche con token e cookie corretti?**
   - Token: ✅ Corretto (audience `formazioneAgent`)
   - Cookie: ✅ Presenti
   - Headers: ✅ Corretti
   - Ma: ❌ 403 Forbidden

2. **L'utente `DETO003001` ha i permessi per `/agenzia/consulta/VFU`?**
   - Quali ruoli/permessi servono?
   - Serve configurazione aggiuntiva?

3. **Quale è l'endpoint corretto per ricerca veicolo?**
   - `/agenzia/consulta/VFU`?
   - `/concessionario/veicolo`?
   - Altro?

4. **Il client ID `AUTODEM.RESCUEMANAGER` è autorizzato per API REST?**
   - Serve configurazione aggiuntiva?
   - Serve usare un client ID diverso?

---

**Ultimo aggiornamento**: 2026-01-23  
**Prossima azione**: Contattare ACI/MIT con domande prioritarie
