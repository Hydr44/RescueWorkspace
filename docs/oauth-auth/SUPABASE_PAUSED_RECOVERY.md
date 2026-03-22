# 🔴 Supabase Progetto in Pausa - Guida Riattivazione

**Data**: 3 Dicembre 2025  
**Problema**: Progetto Supabase inattivo/credenziali non funzionanti  
**Causa Probabile**: Progetto in pausa per inattività (Free Tier)

---

## 🚨 Sintomi

- ❌ Login non funziona
- ❌ Database non risponde
- ❌ API returns timeout o "Project is paused"
- ❌ Dashboard Supabase mostra "Paused" o "Inactive"

---

## ✅ Soluzione Immediata: Riattivare il Progetto

### Passo 1: Accedi a Supabase Dashboard

```
https://supabase.com/dashboard
```

### Passo 2: Seleziona il Progetto

- Vai su **Projects**
- Cerca: `ienzdgrqalltvkdkuamp` (RescueManager)
- Se vedi badge **"PAUSED"** → il progetto è in pausa

### Passo 3: Riattiva il Progetto

**Opzione A: Click "Resume Project"**
```
1. Click sul progetto
2. Vedrai un banner "This project is paused"
3. Click su "Resume Project" o "Restore Project"
4. Attendi 1-2 minuti per il riavvio
```

**Opzione B: Via Settings**
```
1. Project Settings → General
2. Scroll a "Project Status"
3. Click "Resume" o "Unpause"
```

---

## ⏱️ Tempo di Riavvio

**Normale**: 1-3 minuti  
**Con restore da backup**: 5-10 minuti

Durante il riavvio vedrai:
- ⏳ "Restoring project..."
- ⏳ "Starting database..."
- ⏳ "Initializing services..."
- ✅ "Project is active"

---

## 🔧 Test Dopo Riattivazione

### 1. Test API Database
```bash
curl "https://ienzdgrqalltvkdkuamp.supabase.co/rest/v1/" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImllbnpkZ3JxYWxsdHZrZGt1YW1wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxNzcwNDUsImV4cCI6MjA3Mzc1MzA0NX0.sj4ZQJcSMjGkqpizDgmUDImm9esIvTLrsPOT0IIBegA"
```

**Risposta attesa**:
```json
{
  "message": "Welcome to PostgREST"
}
```

### 2. Test Login Desktop App
```
1. Apri RescueManager Desktop
2. Prova login con le tue credenziali
3. Dovrebbe funzionare ✅
```

### 3. Test Website
```
https://rescuemanager.eu/login
```

---

## 🛡️ Prevenire Future Pause

### Opzione 1: GitHub Actions (Ping Automatico) - GRATIS

Ho già creato questa soluzione! Implementala:

**File**: `.github/workflows/keep-supabase-alive.yml`

```yaml
name: Keep Supabase Active

on:
  schedule:
    # Esegui ogni giorno alle 3:00 AM
    - cron: '0 3 * * *'
  workflow_dispatch:

jobs:
  ping:
    runs-on: ubuntu-latest
    steps:
      - name: Ping Supabase
        env:
          SUPABASE_URL: https://ienzdgrqalltvkdkuamp.supabase.co
          SUPABASE_KEY: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImllbnpkZ3JxYWxsdHZrZGt1YW1wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxNzcwNDUsImV4cCI6MjA3Mzc1MzA0NX0.sj4ZQJcSMjGkqpizDgmUDImm9esIvTLrsPOT0IIBegA
        run: |
          curl -X GET "$SUPABASE_URL/rest/v1/profiles?limit=1" \
            -H "apikey: $SUPABASE_KEY" \
            -H "Authorization: Bearer $SUPABASE_KEY"
```

**Setup**:
1. Crea il file nel repository `website` o `desktop-app`
2. Commit e push
3. Verifica su GitHub → Actions
4. Fatto! ✅

### Opzione 2: Cron-job.org (Senza Codice) - GRATIS

```
1. Vai su: https://cron-job.org (registrazione gratuita)
2. Create new cronjob:
   - Title: "Keep Supabase Alive"
   - URL: https://ienzdgrqalltvkdkuamp.supabase.co/rest/v1/profiles?limit=1
   - Schedule: Every day at 3:00 AM
   - Headers:
     * apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
     * Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
3. Save & Enable
```

### Opzione 3: Upgrade a Pro Plan - €25/mese

**Vantaggi**:
- ❌ Nessuna pausa automatica
- ✅ 8GB database (vs 500MB)
- ✅ 100GB bandwidth
- ✅ Backup automatici giornalieri
- ✅ Supporto prioritario

**Quando conviene**:
- Hai clienti paganti
- Non vuoi downtime
- Hai bisogno di più spazio/performance

---

## 🔍 Diagnostica Problemi Credenziali

Se dopo riattivazione le credenziali non funzionano ancora:

### 1. Verifica Credenziali Corrette

**Nel file** `desktop-app/.env` o Vercel:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://ienzdgrqalltvkdkuamp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImllbnpkZ3JxYWxsdHZrZGt1YW1wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxNzcwNDUsImV4cCI6MjA3Mzc1MzA0NX0.sj4ZQJcSMjGkqpizDgmUDImm9esIvTLrsPOT0IIBegA
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImllbnpkZ3JxYWxsdHZrZGt1YW1wIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODE3NzA0NSwiZXhwIjoyMDczNzUzMDQ1fQ.sET1rBO-r0tT-GIVC_2Zalc0qAQ0i5C22PybvThFf4o
```

### 2. Reset Password (Se Necessario)

**Via Dashboard**:
```
1. Supabase Dashboard → Authentication → Users
2. Trova il tuo utente
3. Click "..." → "Reset Password"
4. Controlla email
```

**Via SQL Editor**:
```sql
-- Cambia password direttamente (solo in emergenza)
UPDATE auth.users 
SET encrypted_password = crypt('NuovaPassword123!', gen_salt('bf'))
WHERE email = 'tua-email@example.com';
```

### 3. Verifica RLS Policies

```sql
-- Controlla se le policies bloccano l'accesso
SELECT * FROM pg_policies WHERE tablename = 'profiles';
```

---

## 📊 Monitoraggio Continuo

### Script Verifica Stato

```bash
#!/bin/bash
# check-supabase-status.sh

SUPABASE_URL="https://ienzdgrqalltvkdkuamp.supabase.co"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImllbnpkZ3JxYWxsdHZrZGt1YW1wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxNzcwNDUsImV4cCI6MjA3Mzc1MzA0NX0.sj4ZQJcSMjGkqpizDgmUDImm9esIvTLrsPOT0IIBegA"

response=$(curl -s -o /dev/null -w "%{http_code}" -m 5 \
  "$SUPABASE_URL/rest/v1/" \
  -H "apikey: $ANON_KEY")

if [ "$response" = "200" ]; then
  echo "✅ Supabase ATTIVO"
else
  echo "❌ Supabase NON RISPONDE (HTTP $response)"
  echo "⚠️  Verifica su https://supabase.com/dashboard"
fi
```

**Uso**:
```bash
chmod +x check-supabase-status.sh
./check-supabase-status.sh
```

---

## 🆘 Supporto

### Se il Problema Persiste

1. **Verifica Status Page**:
   - https://status.supabase.com

2. **Contatta Supabase Support**:
   - Dashboard → Help & Support
   - Email: support@supabase.com
   - Discord: https://discord.supabase.com

3. **Forum Community**:
   - https://github.com/supabase/supabase/discussions

---

## ✅ Checklist Risoluzione

- [ ] Accesso a Supabase Dashboard
- [ ] Progetto riattivato (no badge "PAUSED")
- [ ] Test API funzionante (HTTP 200)
- [ ] Login desktop app OK
- [ ] Login website OK
- [ ] Implementato keep-alive (GitHub Actions o cron-job.org)
- [ ] Documentato per futuro riferimento

---

## 📝 Log Intervento

| Data | Azione | Risultato |
|------|--------|-----------|
| 2025-12-03 | Rilevato progetto in pausa | In corso |
| | Riattivazione manuale | Da completare |
| | Setup keep-alive | Da configurare |

---

**Prossimo Step**: Riattiva il progetto su Supabase Dashboard e verifica funzionamento! 🚀

