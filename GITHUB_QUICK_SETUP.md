# GitHub Repository - Quick Setup Guide

Guida rapida per creare e configurare il repository GitHub.

---

## 🚀 STEP 1: Crea Repository su GitHub

### Via Web Interface

1. Vai su https://github.com/new
2. Compila:
   - **Owner:** Il tuo account o organization
   - **Repository name:** `rescuemanager`
   - **Description:** `Sistema completo di gestione per demolizioni, trasporti e recupero veicoli`
   - **Visibility:** 🔒 **Private** (raccomandato)
   - **Initialize:** ❌ **NON** aggiungere README, .gitignore, license (già presenti)
3. Click **Create repository**

### Via GitHub CLI (alternativa)

```bash
# Installa GitHub CLI se non presente
brew install gh

# Login
gh auth login

# Crea repository
gh repo create rescuemanager --private --description "Sistema completo di gestione per demolizioni, trasporti e recupero veicoli"
```

---

## 📤 STEP 2: Push Codice su GitHub

```bash
cd /Users/sign.rascozzarini/Projects/rescuemanager-workspace

# Aggiungi remote origin
git remote add origin https://github.com/TUO-USERNAME/rescuemanager.git

# Verifica remote
git remote -v

# Push branch main
git push -u origin main

# Push branch staging
git push origin staging

# Push branch develop
git push origin develop

# Verifica su GitHub
# Vai su https://github.com/TUO-USERNAME/rescuemanager
```

---

## 🔐 STEP 3: Configura Branch Protection

### Main Branch

1. **Settings** → **Branches** → **Add rule**
2. **Branch name pattern:** `main`
3. Abilita:
   - ✅ Require a pull request before merging
     - Require approvals: **1**
   - ✅ Require status checks to pass before merging
   - ✅ Require conversation resolution before merging
   - ✅ Include administrators
4. **Create**

### Staging Branch

1. **Add rule**
2. **Branch name pattern:** `staging`
3. Abilita:
   - ✅ Require a pull request before merging
     - Require approvals: **1**
   - ✅ Require status checks to pass before merging
4. **Create**

---

## 🔑 STEP 4: Aggiungi GitHub Secrets

**Settings** → **Secrets and variables** → **Actions** → **New repository secret**

### Vercel Secrets

```
VERCEL_TOKEN
VERCEL_ORG_ID
VERCEL_PROJECT_ID
```

**Come ottenerli:**
1. Vercel Dashboard → Settings → Tokens → Create Token
2. Copia token in `VERCEL_TOKEN`
3. Settings → General → copia `VERCEL_ORG_ID` e `VERCEL_PROJECT_ID`

### VPS Secrets

```
VPS_HOST=217.154.118.37
VPS_SSH_KEY=<contenuto chiave privata SSH>
```

**Come generare SSH key:**
```bash
ssh-keygen -t ed25519 -C "github-actions@rescuemanager.eu" -f ~/.ssh/rescuemanager_deploy
ssh-copy-id -i ~/.ssh/rescuemanager_deploy.pub root@217.154.118.37
cat ~/.ssh/rescuemanager_deploy  # Copia TUTTO in VPS_SSH_KEY
```

### Supabase Secrets

```
STAGING_SUPABASE_URL=https://your-staging.supabase.co
STAGING_SUPABASE_SERVICE_KEY=eyJhbGc...
PRODUCTION_SUPABASE_URL=https://your-prod.supabase.co
PRODUCTION_SUPABASE_SERVICE_KEY=eyJhbGc...
```

### R2 & Redis Secrets (opzionali)

```
STAGING_R2_ACCESS_KEY_ID
STAGING_R2_SECRET_ACCESS_KEY
STAGING_UPSTASH_REDIS_REST_URL
STAGING_UPSTASH_REDIS_REST_TOKEN
```

---

## 👥 STEP 5: Aggiungi Collaboratori

**Settings** → **Collaborators and teams** → **Add people**

Ruoli consigliati:
- **Admin:** Lead developer, DevOps
- **Write:** Senior developers
- **Read:** Junior developers (inizialmente)

---

## 🧪 STEP 6: Test CI/CD

```bash
# Crea feature branch
git checkout -b test/cicd-pipeline

# Fai una modifica
echo "# CI/CD Test" >> TEST_CICD.md
git add TEST_CICD.md
git commit -m "test: verify CI/CD pipeline"

# Push
git push origin test/cicd-pipeline

# Vai su GitHub
# 1. Crea Pull Request verso staging
# 2. Verifica che GitHub Actions parta
# 3. Merge PR
# 4. Verifica deploy automatico su staging
```

---

## 📊 STEP 7: Configura GitHub Actions Permissions

**Settings** → **Actions** → **General**

- **Workflow permissions:** Read and write permissions
- ✅ Allow GitHub Actions to create and approve pull requests

---

## 🏷️ STEP 8: Crea Labels (opzionale)

**Issues** → **Labels** → **New label**

Labels utili:
```
bug - #d73a4a
enhancement - #a2eeef
documentation - #0075ca
good first issue - #7057ff
priority: high - #b60205
priority: medium - #fbca04
priority: low - #0e8a16
type: frontend - #bfdadc
type: backend - #c2e0c6
type: infrastructure - #f9d0c4
```

---

## ✅ Checklist Setup GitHub

- [ ] Repository creato su GitHub
- [ ] Remote origin aggiunto
- [ ] Branch main pushato
- [ ] Branch staging pushato
- [ ] Branch develop pushato
- [ ] Branch protection configurata (main + staging)
- [ ] GitHub Secrets aggiunti (Vercel, VPS, Supabase)
- [ ] Collaboratori aggiunti
- [ ] GitHub Actions permissions configurate
- [ ] Test CI/CD completato
- [ ] Labels create (opzionale)

---

## 🔧 Troubleshooting

### "Permission denied (publickey)"
```bash
# Genera SSH key per GitHub
ssh-keygen -t ed25519 -C "your_email@example.com"
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519

# Aggiungi chiave pubblica su GitHub
cat ~/.ssh/id_ed25519.pub
# GitHub → Settings → SSH and GPG keys → New SSH key
```

### "Remote origin already exists"
```bash
# Rimuovi e ri-aggiungi
git remote remove origin
git remote add origin https://github.com/TUO-USERNAME/rescuemanager.git
```

### "Failed to push some refs"
```bash
# Pull prima di push
git pull origin main --rebase
git push origin main
```

---

## 🎯 Comandi Rapidi

```bash
# Setup completo in un colpo
git remote add origin https://github.com/TUO-USERNAME/rescuemanager.git
git push -u origin main
git push origin staging
git push origin develop

# Verifica
git remote -v
git branch -a
```

---

**Repository GitHub pronto!** 🎉

**Prossimo step:** Configura Vercel, Supabase, VPS seguendo le guide in `PHASE2_COMPLETE_SUMMARY.md`
