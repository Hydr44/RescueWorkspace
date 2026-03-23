# 🎯 SETUP FINALE - Istruzioni Complete

**Status:** ✅ Supabase e Redis configurati | ⏳ VPS, Vercel, GitHub pending

---

## ✅ COMPLETATO

### 1. Supabase Staging
- ✅ Progetto creato: `nkcnvjrspndqwqmryldc`
- ✅ URL: https://nkcnvjrspndqwqmryldc.supabase.co
- ✅ Credenziali salvate in `.credentials-staging.md`

### 2. Upstash Redis Staging
- ✅ Database creato: `central-humpback-82030`
- ✅ URL: https://central-humpback-82030.upstash.io
- ✅ Credenziali salvate

### 3. File Configurazione
- ✅ `.env.staging` completo con tutte le variabili
- ✅ `.credentials-staging.md` con tutte le credenziali organizzate
- ✅ `JWT_SECRET` generato: `/QB+2dRLPDoEXJSXWPu6HWHsTda5OgRY6+6cVMShE/E=`
- ✅ Script `setup-vps-staging.sh` per automazione VPS

---

## 📋 PROSSIMI STEP

### STEP 1: Configura Cloudflare R2 (5 min)

**Problema:** R2 free tier permette solo 1 bucket, già usato per production.

**Soluzione:** Usa stesso bucket con prefix `staging/`

1. **Cloudflare Dashboard** → **R2** → Bucket esistente
2. Nessuna modifica necessaria
3. Nel codice, usa prefix `staging/` per tutti i file staging

**Già configurato in `.env.staging`:**
```bash
R2_BUCKET_NAME=rescuemanager-production
R2_STAGING_PREFIX=staging/
```

### STEP 2: Configura DNS Cloudflare (10 min)

**Cloudflare Dashboard** → **DNS** → **Records**

Aggiungi questi record A:

```
Type   Name              Target              Proxy   TTL
A      staging-assist    217.154.118.37      OFF     Auto
A      staging-rentri    217.154.118.37      OFF     Auto
A      staging-api       217.154.118.37      OFF     Auto
A      staging-sdi       217.154.118.37      OFF     Auto
A      staging-lead      217.154.118.37      OFF     Auto
```

**Opzionale - Website staging custom domain:**
```
CNAME  staging   cname.vercel-dns.com    OFF     Auto
```

### STEP 3: Setup VPS Staging (30-45 min)

**Opzione A - Script Automatico (Raccomandato):**

```bash
cd /Users/sign.rascozzarini/Projects/rescuemanager-workspace

# Modifica script con URL repository corretto
nano scripts/setup-vps-staging.sh
# Cambia: REPO_URL="https://github.com/YOUR-USERNAME/rescuemanager.git"

# Esegui script
./scripts/setup-vps-staging.sh
```

**Opzione B - Manuale:**

Segui `VPS_STAGING_SETUP.md` step-by-step.

### STEP 4: Configura Vercel (15 min)

#### 4.1 Crea Token Vercel

1. **Vercel Dashboard** → **Settings** → **Tokens**
2. **Create Token**
   - Name: `GitHub Actions Deploy`
   - Scope: Full Account
   - Expiration: No expiration
3. **Copy token** → Salva in `.credentials-staging.md`

#### 4.2 Trova Project ID

```bash
# Installa Vercel CLI
npm i -g vercel

# Login
vercel login

# Link progetto esistente
cd website
vercel link

# Copia Project ID mostrato
```

**Oppure via Dashboard:**
- Vercel → Progetto → Settings → General
- Copia `Project ID`

#### 4.3 Configura Environment Variables

**Vercel Dashboard** → Progetto → **Settings** → **Environment Variables**

**Per Production (Environment: Production):**
```bash
NEXT_PUBLIC_ENV=production
NEXT_PUBLIC_SUPABASE_URL=<production-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<production-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<production-service-key>
UPSTASH_REDIS_REST_URL=<production-redis-url>
UPSTASH_REDIS_REST_TOKEN=<production-redis-token>
JWT_SECRET=<production-jwt-secret>
R2_ACCOUNT_ID=<your-account-id>
R2_ACCESS_KEY_ID=<production-access-key>
R2_SECRET_ACCESS_KEY=<production-secret-key>
R2_BUCKET_NAME=rescuemanager-production
VPS_API_BASE_URL=https://api.rescuemanager.eu
VPS_ASSIST_BASE=https://assist.rescuemanager.eu
VPS_RENTRI_BASE=https://rentri-test.rescuemanager.eu
```

**Per Preview/Staging (Environment: Preview):**
```bash
NEXT_PUBLIC_ENV=staging
NEXT_PUBLIC_SUPABASE_URL=https://nkcnvjrspndqwqmryldc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5rY252anJzcG5kcXdxbXJ5bGRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyNzQzMjUsImV4cCI6MjA4OTg1MDMyNX0.v8a7UHff2H80GjMlHDDr91FpMyAwQtrAXOD_mDz6s7A
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5rY252anJzcG5kcXdxbXJ5bGRjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDI3NDMyNSwiZXhwIjoyMDg5ODUwMzI1fQ.7ToAcVETYEsumw9XwqsDLGyb_5J3pdggiXqo3THM7t0
UPSTASH_REDIS_REST_URL=https://central-humpback-82030.upstash.io
UPSTASH_REDIS_REST_TOKEN=gQAAAAAAAUBuAAIncDI1NDQ5MThiOTk0MzU0OWRhYTNmMmQwYmZlMjk5OTdhYnAyODIwMzA
JWT_SECRET=/QB+2dRLPDoEXJSXWPu6HWHsTda5OgRY6+6cVMShE/E=
R2_ACCOUNT_ID=<your-account-id>
R2_ACCESS_KEY_ID=<staging-access-key>
R2_SECRET_ACCESS_KEY=<staging-secret-key>
R2_BUCKET_NAME=rescuemanager-production
R2_STAGING_PREFIX=staging/
VPS_API_BASE_URL=https://staging-api.rescuemanager.eu
VPS_ASSIST_BASE=https://staging-assist.rescuemanager.eu
VPS_RENTRI_BASE=https://staging-rentri.rescuemanager.eu
```

#### 4.4 Configura Git Branches

**Vercel Dashboard** → Progetto → **Settings** → **Git**

- **Production Branch:** `main`
- **Preview Branches:** Seleziona `staging` e `develop`

### STEP 5: Crea Repository GitHub (10 min)

#### 5.1 Crea Repository

1. Vai su https://github.com/new
2. **Repository name:** `rescuemanager`
3. **Visibility:** Private
4. **NON** inizializzare con README
5. **Create repository**

#### 5.2 Push Codice

```bash
cd /Users/sign.rascozzarini/Projects/rescuemanager-workspace

# Aggiungi remote (sostituisci YOUR-USERNAME)
git remote add origin https://github.com/YOUR-USERNAME/rescuemanager.git

# Push tutti i branch
git push -u origin main
git push origin staging
git push origin develop

# Verifica
git remote -v
git branch -a
```

#### 5.3 Configura GitHub Secrets

**GitHub** → Repository → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

Aggiungi questi secrets:

```bash
# Vercel
VERCEL_TOKEN=<token-creato-step-4.1>
VERCEL_ORG_ID=team_q6rrpEMYyvzqvSo0ZoVNbDwU
VERCEL_PROJECT_ID=<project-id-trovato-step-4.2>

# VPS
VPS_HOST=217.154.118.37
VPS_SSH_KEY=<contenuto-chiave-privata-ssh>

# Supabase Staging
STAGING_SUPABASE_URL=https://nkcnvjrspndqwqmryldc.supabase.co
STAGING_SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5rY252anJzcG5kcXdxbXJ5bGRjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDI3NDMyNSwiZXhwIjoyMDg5ODUwMzI1fQ.7ToAcVETYEsumw9XwqsDLGyb_5J3pdggiXqo3THM7t0

# Redis Staging
STAGING_UPSTASH_REDIS_REST_URL=https://central-humpback-82030.upstash.io
STAGING_UPSTASH_REDIS_REST_TOKEN=gQAAAAAAAUBuAAIncDI1NDQ5MThiOTk0MzU0OWRhYTNmMmQwYmZlMjk5OTdhYnAyODIwMzA
```

**Come generare VPS_SSH_KEY:**
```bash
# Genera nuova chiave SSH
ssh-keygen -t ed25519 -C "github-actions@rescuemanager.eu" -f ~/.ssh/rescuemanager_deploy

# Copia chiave pubblica sul VPS
ssh-copy-id -i ~/.ssh/rescuemanager_deploy.pub root@217.154.118.37

# Copia chiave privata per GitHub Secret
cat ~/.ssh/rescuemanager_deploy
# Copia TUTTO l'output (incluso -----BEGIN/END-----)
```

#### 5.4 Branch Protection (Opzionale ma raccomandato)

**Settings** → **Branches** → **Add rule**

**Per `main`:**
- Branch name pattern: `main`
- ✅ Require a pull request before merging
- ✅ Require approvals: 1
- ✅ Require status checks to pass
- Create

**Per `staging`:**
- Branch name pattern: `staging`
- ✅ Require a pull request before merging
- ✅ Require approvals: 1
- Create

---

## 🧪 TESTING FINALE

### Test 1: Supabase Staging

```bash
cd /Users/sign.rascozzarini/Projects/rescuemanager-workspace

# Esegui test
node scripts/test-supabase-staging.js
```

**Expected:** ✅ Tutti i test passati

### Test 2: Redis & R2 Staging

```bash
# Configura R2 credentials in .env.staging prima
node scripts/test-storage-cache-staging.js
```

**Expected:** ✅ Tutti i test passati

### Test 3: VPS Services

```bash
# Dopo setup VPS
./scripts/smoke-test.sh staging
```

**Expected:** ✅ Tutti i servizi accessibili

### Test 4: CI/CD Pipeline

```bash
# Crea test branch
git checkout -b test/cicd
echo "# Test" >> TEST.md
git add TEST.md
git commit -m "test: CI/CD pipeline"
git push origin test/cicd

# Vai su GitHub
# Crea PR verso staging
# Verifica che GitHub Actions parta
```

**Expected:** ✅ Deploy automatico su staging

---

## 📊 CHECKLIST COMPLETA

### Infrastruttura
- [x] Supabase staging creato
- [x] Redis staging creato
- [x] JWT secret generato
- [x] File .env.staging completo
- [ ] DNS Cloudflare configurato
- [ ] VPS staging setup completato
- [ ] SSL certificates installati

### Vercel
- [ ] Token creato
- [ ] Project ID trovato
- [ ] Environment variables configurate (Production)
- [ ] Environment variables configurate (Preview/Staging)
- [ ] Git branches configurate

### GitHub
- [ ] Repository creato
- [ ] Codice pushato (main, staging, develop)
- [ ] GitHub Secrets configurati
- [ ] SSH key generata e configurata
- [ ] Branch protection configurata (opzionale)

### Testing
- [x] Test Supabase pronto
- [x] Test Redis/R2 pronto
- [ ] Test VPS eseguito
- [ ] Test CI/CD eseguito
- [ ] Smoke test staging passato

---

## ⏱️ TEMPO STIMATO RIMANENTE

| Task | Tempo |
|------|-------|
| DNS Cloudflare | 10 min |
| VPS Setup | 30-45 min |
| Vercel Config | 15 min |
| GitHub Setup | 10 min |
| Testing | 15 min |
| **TOTALE** | **1h 20min - 1h 35min** |

---

## 🆘 TROUBLESHOOTING

### VPS: "Permission denied (publickey)"
```bash
# Verifica chiave SSH
ssh -i ~/.ssh/rescuemanager_deploy root@217.154.118.37

# Se fallisce, riconfigura
ssh-copy-id -i ~/.ssh/rescuemanager_deploy.pub root@217.154.118.37
```

### Vercel: "Project not found"
```bash
# Verifica Project ID
vercel list
# Usa ID mostrato
```

### GitHub Actions: "Invalid credentials"
```bash
# Verifica GitHub Secrets
# Ricrea VERCEL_TOKEN se necessario
```

---

## 📖 DOCUMENTI DI RIFERIMENTO

1. `.credentials-staging.md` - Tutte le credenziali
2. `VERCEL_DNS_STAGING_SETUP.md` - Guida Vercel completa
3. `VPS_STAGING_SETUP.md` - Guida VPS completa
4. `GITHUB_QUICK_SETUP.md` - Guida GitHub completa
5. `PHASE2_COMPLETE_SUMMARY.md` - Roadmap generale

---

**Prossimo step:** Configura DNS Cloudflare (10 min) 🚀
