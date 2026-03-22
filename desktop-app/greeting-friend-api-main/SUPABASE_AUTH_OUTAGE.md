# 🚨 PROBLEMA SUPABASE AUTH - Partial Outage

## 📅 Data: 24 Novembre 2025

## ⚠️ SITUAZIONE ATTUALE

**Supabase sta segnalando un problema con il servizio Auth:**

- **Status**: 🔴 **Partial Outage** (Interruzione Parziale)
- **Problema**: Gli utenti non possono visualizzare la configurazione Auth nel dashboard
- **Impatto**: Possibili problemi con login, reset password, e autenticazione

**Status Page**: https://status.supabase.com/

---

## 🔍 COSA SIGNIFICA PER TE

### **Problemi Possibili:**
1. ❌ Login fallisce anche con password corretta
2. ❌ Reset password non funziona
3. ❌ Dashboard Auth non accessibile
4. ❌ Token OAuth non vengono generati correttamente
5. ❌ Sessioni che scadono prematuramente

### **Se la password "non funziona":**
**Potrebbe NON essere un problema della password**, ma del servizio Auth di Supabase che è temporaneamente instabile.

---

## ✅ SOLUZIONI TEMPORANEE

### **1. Aspetta che Supabase risolva il problema** ⭐ **CONSIGLIATO**

Il problema è lato Supabase, non del tuo codice. Aspetta che risolvano l'incidente.

**Monitora lo status:**
- https://status.supabase.com/
- Twitter: @supabase

**Tempo stimato**: Di solito risolvono in poche ore.

---

### **2. Prova Login Diretto su Website**

Invece di usare l'app desktop OAuth, prova:

1. Vai su: https://rescuemanager.eu/login
2. Fai login con email e password direttamente
3. Se funziona qui, il problema è solo nel flusso OAuth dell'app desktop

---

### **3. Usa Magic Link (se disponibile)**

Se il login con password non funziona, prova il "Magic Link":

1. Vai su: https://rescuemanager.eu/login
2. Cerca l'opzione "Magic Link" o "Login senza password"
3. Inserisci la tua email
4. Riceverai un link via email per accedere

---

### **4. Verifica Token Esistenti**

Se hai già fatto login in passato, i token potrebbero essere ancora validi:

**Nell'app desktop:**
1. Controlla se sei già autenticato
2. Se i token sono scaduti, aspetta che Supabase risolva il problema
3. Non forzare il logout se non necessario

---

### **5. Reset Password Dopo la Risoluzione**

**NON provare a resettare la password ora** - potrebbe non funzionare a causa del problema Supabase.

**Aspetta che lo status torni "Operational", poi:**

1. Vai su: https://supabase.com/dashboard
2. Authentication → Users
3. Trova il tuo utente
4. Clicca "Send password reset email"
5. Segui il link nell'email

---

## 🔧 WORKAROUND TECNICO (Solo per sviluppatori)

### **Verifica se il problema è Supabase o locale:**

```bash
# Testa la connessione a Supabase Auth
curl -X POST 'https://ienzdgrqalltvkdkuamp.supabase.co/auth/v1/token?grant_type=password' \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-email@example.com",
    "password": "your-password"
  }'
```

**Se ricevi errori 500/503/502**: Il problema è lato Supabase  
**Se ricevi errori 401**: La password potrebbe essere sbagliata (ma aspetta comunque che Supabase risolva)

---

## 📊 MONITORAGGIO

### **Come verificare quando il problema è risolto:**

1. **Status Page Supabase**: https://status.supabase.com/
   - Cerca "Auth" → deve essere "Operational" (verde)

2. **Test Login Manuale**:
   - Prova login su https://rescuemanager.eu/login
   - Se funziona, prova OAuth dall'app desktop

3. **Dashboard Supabase**:
   - Vai su https://supabase.com/dashboard
   - Authentication → Users
   - Se riesci a vedere la lista utenti, il problema è risolto

---

## 🆘 COSA FARE SE IL PROBLEMA PERSISTE

### **Dopo che Supabase ha risolto (status "Operational"):**

Se ancora non riesci a fare login:

1. **Verifica Email Corretta**:
   - Controlla che l'email sia esatta (case-sensitive)
   - Controlla spazi o caratteri nascosti

2. **Reset Password**:
   - Segui la guida: `RESET_PASSWORD_GUIDE.md`
   - Usa lo script: `node scripts/reset-password.js EMAIL`

3. **Verifica Account Bloccato**:
   ```sql
   SELECT email, banned_until 
   FROM auth.users 
   WHERE email = 'your-email@example.com';
   ```

4. **Controlla Log Supabase**:
   - Dashboard → Logs → Auth
   - Cerca errori specifici per il tuo account

---

## 📝 NOTE IMPORTANTI

### **Non è un problema del tuo codice:**
- ✅ Il codice dell'app desktop è corretto
- ✅ La configurazione OAuth è corretta
- ❌ Il problema è lato Supabase (servizio esterno)

### **Non modificare nulla ora:**
- ❌ Non cambiare configurazioni
- ❌ Non resettare password (aspetta)
- ❌ Non modificare il codice
- ✅ Aspetta che Supabase risolva

---

## 🔗 LINK UTILI

- **Status Supabase**: https://status.supabase.com/
- **Dashboard Supabase**: https://supabase.com/dashboard
- **Twitter Supabase**: https://twitter.com/supabase
- **Documentazione Auth**: https://supabase.com/docs/guides/auth

---

## 📅 CRONOLOGIA INCIDENTI

### **24 Novembre 2025 - 12:37 UTC**
- **Status**: Investigating
- **Problema**: Utenti non possono visualizzare Auth config nel dashboard
- **Impatto**: Partial Outage

### **24 Novembre 2025 - 09:40 UTC**
- **Status**: Resolved
- **Problema**: Richieste fallite su tutta la piattaforma
- **Azione**: Rollback deployment API Gateway

### **21-23 Novembre 2025**
- **Status**: Completed
- **Problema**: Manutenzione urgente Dashboard e Management API
- **Durata**: 48 ore (23:00 UTC 21 Nov - 23:00 UTC 23 Nov)

---

**Ultimo aggiornamento**: 24 Novembre 2025, 12:37 UTC  
**Prossimo check**: Quando lo status torna "Operational"






