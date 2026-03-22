# 🔐 GUIDA RESET PASSWORD - RescueManager Desktop

## ⚠️ IMPORTANTE: Verifica Status Supabase PRIMA

**Prima di procedere, verifica se Supabase ha problemi:**

🔗 **Status Supabase**: https://status.supabase.com/

Se vedi **"Auth - Partial Outage"** o problemi simili:
- ❌ **NON** provare a resettare la password ora
- ✅ Aspetta che Supabase risolva il problema
- 📄 Vedi: `SUPABASE_AUTH_OUTAGE.md` per dettagli

---

## 🎯 PROBLEMA
"La password è sbagliata per l'accesso ma non è mai stata cambiata"

**NOTA**: Se Supabase ha problemi (vedi sopra), il problema potrebbe essere del servizio, non della password.

---

## 📋 SOLUZIONI POSSIBILI

### **Soluzione 1: Reset Password tramite Supabase Dashboard** ⭐ **CONSIGLIATO**

#### **Passo 1: Accedi a Supabase Dashboard**
1. Vai su: https://supabase.com/dashboard
2. Accedi con le tue credenziali
3. Seleziona il progetto: `ienzdgrqalltvkdkuamp`

#### **Passo 2: Vai alla sezione Authentication**
1. Nel menu laterale, clicca su **Authentication**
2. Clicca su **Users**
3. Cerca l'utente tramite email

#### **Passo 3: Reset Password**
**Opzione A - Invio email reset:**
1. Clicca sull'utente nella lista
2. Clicca su **Send password reset email**
3. L'utente riceverà una email per resettare la password
4. Segui il link nell'email e imposta una nuova password

**Opzione B - Reset diretto (se sei admin):**
1. Clicca sull'utente nella lista
2. Clicca su **Reset password**
3. Inserisci la nuova password
4. Salva

---

### **Soluzione 2: Reset tramite SQL Editor**

#### **Passo 1: Apri SQL Editor**
1. Nel menu laterale di Supabase, clicca su **SQL Editor**
2. Clicca su **New query**

#### **Passo 2: Cerca l'utente**
```sql
-- Verifica quale email/utente esiste
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at,
  last_sign_in_at
FROM auth.users
ORDER BY created_at DESC;
```

#### **Passo 3: Reset password (SOLO SE SEI ADMIN)**
⚠️ **ATTENZIONE**: Questa operazione richiede accesso admin e cambia direttamente la password nell'hash.

```sql
-- IMPORTANTE: Sostituisci 'EMAIL_UTENTE' con l'email reale
-- La nuova password verrà hashatta automaticamente da Supabase

-- Metodo 1: Usa la funzione built-in Supabase
UPDATE auth.users 
SET encrypted_password = crypt('NUOVA_PASSWORD_QUI', gen_salt('bf'))
WHERE email = 'EMAIL_UTENTE@esempio.com';

-- Metodo 2: Usa l'Admin API (più sicuro - vedi script Node.js sotto)
```

**⚠️ NOTA**: Il metodo SQL diretto potrebbe non funzionare se Supabase usa un sistema di hash diverso. È meglio usare l'Admin API.

---

### **Soluzione 3: Script Node.js per Reset Password** ⭐ **PIÙ SICURO**

Ho creato uno script che usa l'Admin API di Supabase per resettare la password in modo sicuro.

#### **Passo 1: Installa dipendenze**
```bash
cd /Users/sign.rascozzarini/Projects/rescuemanager-workspace/desktop-app/greeting-friend-api-main
npm install @supabase/supabase-js
```

#### **Passo 2: Esegui lo script**
```bash
node scripts/reset-password.js EMAIL_UTENTE@esempio.com
```

Lo script ti chiederà:
- Nuova password da impostare
- Conferma password

---

### **Soluzione 4: Verifica Email e Password Corretta**

A volte il problema è che stai usando l'email o la password sbagliata.

#### **Verifica Email:**
1. Vai su Supabase Dashboard → Authentication → Users
2. Controlla quale email è registrata
3. Assicurati di usare quella email esatta (case-sensitive)

#### **Prova Login Diretto su Website:**
1. Vai su: https://rescuemanager.eu/login
2. Prova a fare login con email e password
3. Se funziona qui, il problema è solo nell'app desktop OAuth
4. Se non funziona, il problema è la password su Supabase

---

### **Soluzione 5: Crea Nuovo Utente (se necessario)**

Se non riesci a recuperare la password, puoi creare un nuovo utente:

#### **Tramite Supabase Dashboard:**
1. Vai su **Authentication** → **Users**
2. Clicca su **Add user** → **Create new user**
3. Inserisci:
   - Email
   - Password
   - Auto Confirm User: ✅ (per evitare conferma email)
4. Salva

#### **Tramite SQL (avanzato):**
```sql
-- Crea nuovo utente (richiede conoscenze avanzate)
-- È meglio usare il Dashboard
```

---

## 🔍 DEBUG: Verifica Stato Utente

### **Controlla se l'utente esiste:**
```sql
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at,
  last_sign_in_at,
  confirmed_at,
  banned_until
FROM auth.users
WHERE email = 'EMAIL_UTENTE@esempio.com';
```

### **Controlla se l'account è bloccato:**
```sql
SELECT 
  email,
  banned_until,
  CASE 
    WHEN banned_until IS NULL THEN 'Account attivo'
    WHEN banned_until > NOW() THEN 'Account temporaneamente bloccato'
    ELSE 'Account sbloccato'
  END as status
FROM auth.users
WHERE email = 'EMAIL_UTENTE@esempio.com';
```

---

## 🔧 PROBLEMI COMUNI

### **1. Email non confermata**
**Sintomo**: Login fallisce anche con password corretta  
**Soluzione**: 
```sql
-- Conferma email manualmente
UPDATE auth.users 
SET email_confirmed_at = NOW(), confirmed_at = NOW()
WHERE email = 'EMAIL_UTENTE@esempio.com';
```

### **2. Account bloccato per troppi tentativi**
**Sintomo**: "Too many login attempts"  
**Soluzione**:
```sql
-- Sblocca account
UPDATE auth.users 
SET banned_until = NULL
WHERE email = 'EMAIL_UTENTE@esempio.com';
```

### **3. Password hash corrotto**
**Sintomo**: Login fallisce sempre  
**Soluzione**: Usa lo script di reset password (Soluzione 3)

---

## 📝 INFORMAZIONI UTILI

### **Credenziali Supabase:**
- **Project URL**: `https://ienzdgrqalltvkdkuamp.supabase.co`
- **Dashboard**: https://supabase.com/dashboard/project/ienzdgrqalltvkdkuamp
- **Anon Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (vedi env)

### **Service Role Key (NON CONDIVIDERE):**
Usa questa chiave SOLO per lo script di reset password locale, mai esporla.

---

## ✅ CHECKLIST POST-RESET

Dopo aver resettato la password:

- [ ] Verifica login su https://rescuemanager.eu/login
- [ ] Prova login OAuth dall'app desktop
- [ ] Verifica che i token vengano salvati correttamente
- [ ] Controlla console per errori

---

## 🆘 SUPPORTO

Se nessuna soluzione funziona:

1. Controlla i log della console dell'app desktop
2. Controlla i log di Supabase Dashboard → Logs → Auth
3. Verifica che l'email sia corretta (case-sensitive)
4. Prova a creare un nuovo utente e vedi se funziona

---

**Data creazione**: Gennaio 2025  
**Ultima modifica**: Gennaio 2025

