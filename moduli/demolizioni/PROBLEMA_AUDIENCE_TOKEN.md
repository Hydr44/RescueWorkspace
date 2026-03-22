# 🔴 PROBLEMA CRITICO: Audience Token JWT

**Data**: 2026-01-23  
**Severità**: 🔴 CRITICA  
**Status**: ❌ BLOCCANTE

---

## 🎯 PROBLEMA IDENTIFICATO

### Situazione
Il token JWT ottenuto dal login OAuth2 ha `audience: 'formazioneAgent'` invece di `AUTODEM.RESCUEMANAGER`.

### Log Osservato
```json
{
  "tokenInfo": {
    "audience": "formazioneAgent",
    "issuer": "https://ssoformazione.ilportaledeltrasporto.it/sso/oauth2",
    "subject": "DETO003001...",
    "expectedAudience": "formazioneAgent",
    "audienceMatch": true
  }
}
```

### Configurazione Attuale
- **Client ID usato**: `AUTODEM.RESCUEMANAGER`
- **Client Secret**: `R2Y2L9T2`
- **Audience token ricevuto**: `formazioneAgent` ❌

---

## 🔍 ANALISI

### Possibili Cause

#### 1. Server SSO emette token per `formazioneAgent` automaticamente
**Ipotesi**: Quando chiamiamo API su `formazione.ilportaledeltrasporto.it`, il server SSO emette automaticamente un token con audience `formazioneAgent` (il client ID del portale UI), indipendentemente dal client ID usato per il login.

**Evidenza**: 
- Login usa `AUTODEM.RESCUEMANAGER`
- Token ricevuto ha audience `formazioneAgent`
- Il server potrebbe fare "token exchange" automatico

#### 2. `AUTODEM.RESCUEMANAGER` non è autorizzato per API REST
**Ipotesi**: Il client ID `AUTODEM.RESCUEMANAGER` non ha permessi per le API REST su `formazione.ilportaledeltrasporto.it`, quindi il server emette un token con audience `formazioneAgent` (che ha i permessi).

**Evidenza**:
- 403 Forbidden con token `formazioneAgent`
- Potrebbe indicare che anche `formazioneAgent` non ha i permessi, OPPURE
- Il token `formazioneAgent` non è valido per API REST (è solo per UI)

#### 3. Serve usare `formazioneAgent` come client ID
**Ipotesi**: Per accedere alle API REST su `formazione.ilportaledeltrasporto.it`, dobbiamo usare `formazioneAgent` come client ID invece di `AUTODEM.RESCUEMANAGER`.

**Evidenza**:
- Il token ha già audience `formazioneAgent`
- Potrebbe essere necessario fare login con `formazioneAgent`

---

## 🧪 TEST DA FARE

### TEST A: Verificare audience token dopo login
**Obiettivo**: Confermare che il token ha audience `formazioneAgent`

**Azione**: 
1. Fai login
2. Decodifica il JWT `id_token`
3. Verifica campo `aud`

**Risultato atteso**: `aud: "formazioneAgent"`

---

### TEST B: Usare `formazioneAgent` come client ID
**Obiettivo**: Verificare se dobbiamo usare `formazioneAgent` per le API REST

**Azione**:
1. Modifica `RVFU_AUTH_CONFIG_FORMATION`:
   ```typescript
   clientId: 'formazioneAgent', // invece di 'AUTODEM.RESCUEMANAGER'
   ```
2. Fai login
3. Prova ricerca veicolo

**Risultato atteso**: 
- ✅ Token con audience `formazioneAgent` (già così)
- ✅ 200 invece di 403 (se funziona)

**⚠️ PROBLEMA**: Non abbiamo il `client_secret` per `formazioneAgent`!

---

### TEST C: Verificare se `AUTODEM.RESCUEMANAGER` è autorizzato
**Obiettivo**: Capire se il nostro client ID ha permessi per API REST

**Azione**: Chiedere ad ACI/MIT

**Domande**:
1. `AUTODEM.RESCUEMANAGER` è autorizzato per API REST?
2. Perché il token ha audience `formazioneAgent`?
3. Dobbiamo usare un client ID diverso per API REST?

---

## 🔧 SOLUZIONI POSSIBILI

### Soluzione 1: Usare `formazioneAgent` come client ID
**Problema**: Non abbiamo il `client_secret` per `formazioneAgent`

**Domanda per ACI/MIT**: 
> Possiamo usare `formazioneAgent` come client ID per le API REST? Quale è il `client_secret`?

---

### Soluzione 2: Richiedere token con audience corretta
**Problema**: Il server SSO emette automaticamente token con audience `formazioneAgent`

**Domanda per ACI/MIT**:
> Come ottenere un token con audience `AUTODEM.RESCUEMANAGER` per le API REST?

---

### Soluzione 3: Usare scope aggiuntivi
**Ipotesi**: Potrebbe servire uno scope specifico per API REST

**Azione**: Provare scope diversi:
- `openid profile rvfu`
- `openid profile api`
- Altri scope?

---

## 📋 DOMANDE PRIORITARIE PER ACI/MIT

### 🔴 ALTA PRIORITÀ

1. **Perché il token JWT ha audience `formazioneAgent` invece di `AUTODEM.RESCUEMANAGER`?**
   - È normale?
   - È un problema di configurazione?

2. **Quale client ID dobbiamo usare per le API REST?**
   - `AUTODEM.RESCUEMANAGER` (il nostro)
   - `formazioneAgent` (quello del portale)
   - Altro?

3. **Se dobbiamo usare `formazioneAgent`, qual è il `client_secret`?**
   - È disponibile per integrazioni software?
   - O è solo per il portale UI?

4. **`AUTODEM.RESCUEMANAGER` è autorizzato per API REST su `formazione.ilportaledeltrasporto.it`?**
   - Ha i permessi necessari?
   - Serve configurazione aggiuntiva?

---

## 🎯 PROSSIMI PASSI

1. ✅ **Documentare il problema** (questo file)
2. ⏳ **Aggiungere domanda a `DOMANDE_ACI_MIT_RVFU.md`**
3. ⏳ **Testare se possiamo usare `formazioneAgent`** (se abbiamo secret)
4. ⏳ **Contattare ACI/MIT** con domande prioritarie

---

**Ultimo aggiornamento**: 2026-01-23  
**Prossima azione**: Aggiungere domande a DOMANDE_ACI_MIT_RVFU.md e contattare ACI/MIT
