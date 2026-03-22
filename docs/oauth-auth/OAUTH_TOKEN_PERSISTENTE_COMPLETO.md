# ✅ Token OAuth Persistente - Configurazione Completa

**Data**: 18 Gennaio 2025  
**Obiettivo**: Rendere il token SSO OAuth persistente per il login app

---

## 🔧 **Modifiche Applicate**

### **1. Aumentata Durata Refresh Token** ⏱️

**File**: `website/src/app/api/auth/oauth/exchange/route.ts`

**Prima**:
```typescript
const refreshToken = jwt.sign(
  {
    user_id: oauthData.user_id,
    app_id: app_id,
    type: 'refresh'
  },
  JWT_SECRET,
  { expiresIn: '30d' } // 30 giorni
);
```

**Dopo**:
```typescript
const refreshToken = jwt.sign(
  {
    user_id: oauthData.user_id,
    app_id: app_id,
    type: 'refresh'
  },
  JWT_SECRET,
  { expiresIn: '365d' } // 1 anno per token persistente
);
```

**Impatto**: 
- ✅ Il refresh token ora dura **1 anno** invece di 30 giorni
- ✅ L'utente rimane autenticato per 1 anno senza dover rifare login
- ✅ Il refresh automatico funzionerà per 1 anno

---

## 📊 **Configurazione Attuale Token OAuth**

### **Access Token**
- **Durata**: 1 ora (`expiresIn: '1h'`)
- **Uso**: Per chiamate API immediate
- **Refresh**: Automatico tramite refresh_token quando scade

### **Refresh Token** ✅ **Aggiornato**
- **Durata**: **1 anno** (`expiresIn: '365d'`) - **PRIMA ERA 30 giorni**
- **Uso**: Per rinnovare access_token quando scade
- **Persistenza**: Salvato in localStorage (`rm-oauth-tokens`)

### **Salvataggio Token**

**Desktop App** (`src/lib/oauth.ts`):
```typescript
// Salva in localStorage (persistente in Electron)
localStorage.setItem('rm-oauth-tokens', JSON.stringify(tokens));
```

**Database** (`oauth_tokens` table):
```sql
-- Token salvati nel database per validazione server-side
INSERT INTO oauth_tokens (
  user_id, app_id, access_token, refresh_token,
  expires_at, is_active
)
```

---

## 🔄 **Flusso Refresh Automatico**

### **Quando il Token Scade**

1. **Access Token scade** (dopo 1 ora)
2. **App verifica token** → Scaduto
3. **Chiama refresh automatico** → `/api/auth/refresh`
4. **Server valida refresh_token** → Valido per 1 anno
5. **Server genera nuovo access_token** → 1 ora
6. **App salva nuovo token** → localStorage

### **Refresh Token Scade** (dopo 1 anno)

1. **Refresh token scade** → Dopo 1 anno
2. **App tenta refresh** → Fallisce
3. **App richiede nuovo login** → OAuth flow completo

---

## ✅ **Vantaggi Token Persistente**

### **1. Esperienza Utente Migliorata**
- ✅ L'utente rimane autenticato per **1 anno**
- ✅ Non deve rifare login ogni 30 giorni
- ✅ Login automatico all'avvio dell'app (se token valido)

### **2. Funzionalità Automatiche**
- ✅ Refresh automatico quando access_token scade
- ✅ Salvataggio persistente in localStorage (Electron)
- ✅ Backup token nel database (validazione server-side)

### **3. Sicurezza Mantenuta**
- ✅ Access token breve (1 ora) per sicurezza
- ✅ Refresh token con scadenza ragionevole (1 anno)
- ✅ Validazione token nel database

---

## 📝 **Note Implementazione**

### **Storage Persistente**

**Electron localStorage**:
- ✅ Persiste tra riavvii app
- ✅ Persiste tra aggiornamenti app
- ⚠️ Può essere pulito se l'utente cancella dati app

**Database `oauth_tokens`**:
- ✅ Persiste permanentemente (fino a scadenza)
- ✅ Validazione server-side
- ✅ Possibilità di revoca token (set `is_active = false`)

### **Refresh Automatico**

Il refresh automatico è già implementato in `src/lib/oauth.ts`:

```typescript
static async refreshToken(): Promise<boolean> {
  // ...
  // Chiama /api/auth/refresh con refresh_token
  // Aggiorna access_token se refresh_token è valido
}
```

**Chiamato automaticamente quando**:
- Access token scade (verifica JWT `exp`)
- Verifica token fallisce (404/401)
- Token non valido (server response)

---

## 🎯 **Risultato**

✅ **Token OAuth ora persistente per 1 anno**:
- Refresh token dura 1 anno (prima 30 giorni)
- Access token si rinnova automaticamente
- Login automatico all'avvio app se token valido

✅ **Sicurezza mantenuta**:
- Access token breve (1 ora)
- Refresh token con scadenza ragionevole (1 anno)
- Validazione server-side nel database

---

## 🔍 **Verifica Funzionamento**

### **1. Test Login Persistente**

1. Esegui login OAuth
2. Verifica token in localStorage: `localStorage.getItem('rm-oauth-tokens')`
3. Chiudi app e riapri
4. ✅ App dovrebbe essere ancora autenticata (se refresh_token valido)

### **2. Test Refresh Automatico**

1. Esegui login OAuth
2. Attendi 1 ora (o modifica JWT `exp` per test)
3. Esegui chiamata API
4. ✅ App dovrebbe rinnovare access_token automaticamente

### **3. Test Scadenza Refresh Token**

1. Esegui login OAuth
2. Modifica refresh_token `exp` a scaduto (per test)
3. Tenta chiamata API
4. ✅ App dovrebbe richiedere nuovo login

---

## 📋 **Prossimi Passi (Opzionali)**

Se vuoi renderlo ancora più persistente:

1. **Durata refresh_token a 2-5 anni** (cambia `'365d'` a `'1825d'`)
2. **Storage alternativo** (electron-store invece di localStorage)
3. **Backup token su VPS** (sync token con server per recovery)

**Per ora, 1 anno è un buon compromesso tra persistenza e sicurezza!** ✅
