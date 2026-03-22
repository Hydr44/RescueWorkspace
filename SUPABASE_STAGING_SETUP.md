# Supabase Staging Setup Guide

Guida completa per creare e configurare il progetto Supabase staging.

---

## 📋 Prerequisiti

- Account Supabase
- Accesso al progetto production
- Supabase CLI installato: `npm install -g supabase`

---

## 🆕 Step 1: Crea Nuovo Progetto Staging

### Via Dashboard

1. Vai su https://supabase.com/dashboard
2. Click **New Project**
3. Compila:
   - **Name:** `rescuemanager-staging`
   - **Database Password:** Genera password sicura (salva in password manager)
   - **Region:** Stessa del progetto production (per latency)
   - **Pricing Plan:** Free (sufficiente per staging)
4. Click **Create new project**
5. Attendi ~2 minuti per provisioning

### Salva Credenziali

Dopo creazione, vai su **Settings** → **API**:

```bash
# Project URL
STAGING_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co

# Anon/Public Key
STAGING_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Service Role Key (SEGRETO!)
STAGING_SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Salva in:**
- `.env.staging` (locale)
- GitHub Secrets: `STAGING_SUPABASE_URL`, `STAGING_SUPABASE_SERVICE_KEY`
- Vercel Environment Variables (Preview)

---

## 📊 Step 2: Esporta Schema da Production

### Metodo 1: Via Supabase CLI (Raccomandato)

```bash
# Login
supabase login

# Link al progetto production
supabase link --project-ref <production-project-ref>

# Esporta schema completo
supabase db dump --data-only=false > supabase/staging-schema.sql

# Esporta anche dati di sistema (se necessario)
supabase db dump --data-only > supabase/staging-data.sql
```

### Metodo 2: Via Dashboard

1. Progetto Production → **Database** → **Backups**
2. Click **Download** sull'ultimo backup
3. Salva come `supabase/staging-schema.sql`

---

## 📥 Step 3: Importa Schema in Staging

### Via Supabase CLI

```bash
# Link al progetto staging
supabase link --project-ref <staging-project-ref>

# Importa schema
supabase db push

# O usa psql direttamente
psql "postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres" \
  < supabase/staging-schema.sql
```

### Via SQL Editor (Dashboard)

1. Progetto Staging → **SQL Editor**
2. Click **New query**
3. Copia/incolla contenuto di `staging-schema.sql`
4. Click **Run**

---

## 🌱 Step 4: Crea Dati di Test (Seed Data)

### Crea file seed

Crea `supabase/seed-staging.sql`:

```sql
-- Seed data per staging environment
-- Organizzazioni di test
INSERT INTO orgs (id, name, email, subscription_tier, created_at) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Test Org 1', 'test1@example.com', 'professional', NOW()),
  ('00000000-0000-0000-0000-000000000002', 'Test Org 2', 'test2@example.com', 'enterprise', NOW()),
  ('00000000-0000-0000-0000-000000000003', 'Test Org Free', 'free@example.com', 'free', NOW());

-- Utenti di test
INSERT INTO users (id, org_id, email, role, created_at) VALUES
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000001', 'admin@test1.com', 'admin', NOW()),
  ('00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000001', 'user@test1.com', 'user', NOW()),
  ('00000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000000002', 'admin@test2.com', 'admin', NOW());

-- Trasporti di test
INSERT INTO transports (id, org_id, vehicle_plate, status, created_at) VALUES
  ('00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000001', 'AA000AA', 'completed', NOW() - INTERVAL '1 day'),
  ('00000000-0000-0000-0000-000000000202', '00000000-0000-0000-0000-000000000001', 'BB111BB', 'in_progress', NOW()),
  ('00000000-0000-0000-0000-000000000203', '00000000-0000-0000-0000-000000000002', 'CC222CC', 'pending', NOW());

-- Lead di test
INSERT INTO leads (id, org_id, name, email, phone, status, created_at) VALUES
  ('00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000001', 'Mario Rossi', 'mario@example.com', '+39 333 1234567', 'new', NOW()),
  ('00000000-0000-0000-0000-000000000302', '00000000-0000-0000-0000-000000000001', 'Luigi Verdi', 'luigi@example.com', '+39 333 7654321', 'contacted', NOW() - INTERVAL '2 hours'),
  ('00000000-0000-0000-0000-000000000303', '00000000-0000-0000-0000-000000000002', 'Anna Bianchi', 'anna@example.com', '+39 333 9876543', 'converted', NOW() - INTERVAL '1 week');

-- Password per utenti test: "TestPassword123!"
-- Nota: Dovrai creare gli utenti via Supabase Auth
```

### Importa seed data

```bash
psql "postgresql://postgres:[PASSWORD]@db.[STAGING-PROJECT-REF].supabase.co:5432/postgres" \
  < supabase/seed-staging.sql
```

---

## 🔐 Step 5: Configura Row Level Security (RLS)

Verifica che le policy RLS siano state importate correttamente:

```sql
-- Verifica policy esistenti
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public';

-- Se mancano, ricreale manualmente o reimporta schema
```

---

## 🔑 Step 6: Configura Auth

### Email Templates

1. Progetto Staging → **Authentication** → **Email Templates**
2. Personalizza templates per staging:
   - **Confirm signup:** Aggiungi `[STAGING]` nel subject
   - **Reset password:** Aggiungi `[STAGING]` nel subject
   - **Magic Link:** Aggiungi `[STAGING]` nel subject

### Providers

1. **Authentication** → **Providers**
2. Abilita providers necessari:
   - ✅ Email (già abilitato)
   - ⚠️ Google OAuth (usa credenziali test se necessario)
   - ⚠️ Altri providers (opzionale per staging)

### Site URL

1. **Authentication** → **URL Configuration**
2. **Site URL:** `https://staging.rescuemanager.eu`
3. **Redirect URLs:** Aggiungi:
   ```
   https://staging.rescuemanager.eu/**
   http://localhost:3000/**
   ```

---

## 🔄 Step 7: Configura Database Webhooks (se usati)

Se usi webhooks in production:

1. **Database** → **Webhooks**
2. Ricrea webhooks puntando a URL staging:
   ```
   https://staging-api.rescuemanager.eu/webhooks/supabase
   ```

---

## 📊 Step 8: Configura Storage Buckets

### Crea buckets identici a production

```sql
-- Via SQL Editor
INSERT INTO storage.buckets (id, name, public) VALUES
  ('transports', 'transports', false),
  ('documents', 'documents', false),
  ('avatars', 'avatars', true);

-- Configura policy per ogni bucket
CREATE POLICY "Users can upload to their org bucket"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'transports' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Ripeti per altri buckets...
```

---

## 🧪 Step 9: Test Connessione

### Test via CLI

```bash
# Test connessione
supabase db ping

# Test query
supabase db query "SELECT COUNT(*) FROM orgs"
```

### Test via Codice

Crea `scripts/test-supabase-staging.js`:

```javascript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.STAGING_SUPABASE_URL,
  process.env.STAGING_SUPABASE_SERVICE_KEY
);

async function testConnection() {
  console.log('🧪 Testing Supabase Staging connection...');
  
  // Test 1: Count orgs
  const { data: orgs, error: orgsError } = await supabase
    .from('orgs')
    .select('count');
  
  if (orgsError) {
    console.error('❌ Orgs query failed:', orgsError);
  } else {
    console.log('✅ Orgs count:', orgs);
  }
  
  // Test 2: Auth
  const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
  
  if (authError) {
    console.error('❌ Auth query failed:', authError);
  } else {
    console.log('✅ Users count:', authData.users.length);
  }
  
  console.log('✅ All tests passed!');
}

testConnection();
```

Run:
```bash
node scripts/test-supabase-staging.js
```

---

## 🔄 Step 10: Setup Migrazioni Continue

### Configura sync da production a staging

Crea `.github/workflows/sync-db-schema.yml`:

```yaml
name: Sync DB Schema to Staging

on:
  workflow_dispatch:  # Manual trigger
  schedule:
    - cron: '0 2 * * 1'  # Every Monday at 2 AM

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Supabase CLI
        run: npm install -g supabase
      
      - name: Export Production Schema
        run: |
          supabase db dump \
            --db-url "${{ secrets.PRODUCTION_SUPABASE_URL }}" \
            > schema.sql
      
      - name: Import to Staging
        run: |
          psql "${{ secrets.STAGING_SUPABASE_URL }}" < schema.sql
```

---

## 📋 Checklist Setup Completo

- [ ] Progetto staging creato su Supabase
- [ ] Credenziali salvate in GitHub Secrets
- [ ] Schema importato da production
- [ ] Seed data caricati
- [ ] RLS policies verificate
- [ ] Auth configurato (email templates, providers, URLs)
- [ ] Storage buckets creati
- [ ] Webhooks configurati (se necessario)
- [ ] Test connessione passati
- [ ] Sync workflow configurato (opzionale)

---

## 🔧 Troubleshooting

### Errore: "relation does not exist"
```bash
# Schema non importato correttamente
# Reimporta schema
supabase db push
```

### Errore: "permission denied"
```bash
# Usa service role key, non anon key
# Verifica che STAGING_SUPABASE_SERVICE_KEY sia corretto
```

### Errore: "too many connections"
```bash
# Free tier ha limite connessioni
# Usa connection pooling:
# postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:6543/postgres
```

---

## 📊 Monitoring

### Dashboard Metrics

Monitora su Supabase Dashboard:
- **Database** → **Usage** - Controlla storage e connessioni
- **Auth** → **Users** - Verifica utenti test
- **Logs** → **Postgres Logs** - Controlla errori

### Alerts

Configura alert per:
- Storage > 80% (Free tier: 500MB)
- Connessioni > 50 (Free tier: 60 max)
- Errori query frequenti

---

## 💰 Costi

**Free Tier Limits:**
- 500 MB database storage
- 1 GB file storage
- 2 GB bandwidth
- 50,000 monthly active users

**Sufficiente per staging!** Se superi, upgrade a Pro ($25/mese).

---

## 🔄 Manutenzione

### Settimanale
- [ ] Verifica storage usage
- [ ] Pulisci dati test vecchi
- [ ] Sync schema da production (se modificato)

### Mensile
- [ ] Review logs per errori
- [ ] Update seed data se necessario
- [ ] Verifica performance query

---

**Setup completato!** Database staging pronto per sviluppo. 🎉
