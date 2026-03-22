# GitHub Repository Setup

Guida per configurare il repository GitHub con branch protection e secrets.

---

## 🔐 Branch Protection Rules

### Setup su GitHub

1. Vai su **Settings** → **Branches** → **Add rule**

### Regola per `main` branch

**Branch name pattern:** `main`

**Protezioni da abilitare:**
- ✅ Require a pull request before merging
  - ✅ Require approvals: 1
  - ✅ Dismiss stale pull request approvals when new commits are pushed
  - ✅ Require review from Code Owners (se configurato)
- ✅ Require status checks to pass before merging
  - ✅ Require branches to be up to date before merging
  - Status checks richiesti:
    - `deploy` (GitHub Actions)
    - `build` (se configurato)
- ✅ Require conversation resolution before merging
- ✅ Require linear history
- ✅ Include administrators
- ✅ Restrict who can push to matching branches
  - Solo: Lead developers, CI/CD bot

**Regole per force push:**
- ❌ Allow force pushes: NO
- ❌ Allow deletions: NO

### Regola per `staging` branch

**Branch name pattern:** `staging`

**Protezioni da abilitare:**
- ✅ Require a pull request before merging
  - ✅ Require approvals: 1
- ✅ Require status checks to pass before merging
  - Status checks richiesti:
    - `deploy` (GitHub Actions)
- ✅ Require conversation resolution before merging
- ✅ Include administrators

**Regole per force push:**
- ❌ Allow force pushes: NO
- ❌ Allow deletions: NO

### Regola per `develop` branch

**Branch name pattern:** `develop`

**Protezioni da abilitare:**
- ✅ Require a pull request before merging
  - Require approvals: 0 (opzionale)
- ✅ Require status checks to pass before merging

**Regole per force push:**
- ✅ Allow force pushes: YES (solo per developers)
- ❌ Allow deletions: NO

---

## 🔑 GitHub Secrets

### Setup Secrets

1. Vai su **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**

### Secrets da configurare:

#### Vercel
```
Name: VERCEL_TOKEN
Value: <token da Vercel Dashboard → Settings → Tokens>

Name: VERCEL_ORG_ID
Value: <da Vercel Dashboard → Settings → General>

Name: VERCEL_PROJECT_ID
Value: <da Vercel Project → Settings → General>
```

**Come ottenere Vercel token:**
1. Vai su https://vercel.com/account/tokens
2. Create Token
3. Nome: `GitHub Actions RescueManager`
4. Scope: Full Access
5. Expiration: No Expiration
6. Copia il token

#### VPS
```
Name: VPS_HOST
Value: 217.154.118.37

Name: VPS_SSH_KEY
Value: <private SSH key per accesso VPS>
```

**Come ottenere SSH key:**
```bash
# Sul tuo computer locale
ssh-keygen -t ed25519 -C "github-actions@rescuemanager.eu" -f ~/.ssh/rescuemanager_deploy

# Copia chiave pubblica sul VPS
ssh-copy-id -i ~/.ssh/rescuemanager_deploy.pub root@217.154.118.37

# Copia chiave privata (TUTTO il contenuto del file)
cat ~/.ssh/rescuemanager_deploy
# Incolla in GitHub Secret VPS_SSH_KEY
```

#### Supabase Staging
```
Name: STAGING_SUPABASE_URL
Value: https://your-staging-project.supabase.co

Name: STAGING_SUPABASE_SERVICE_KEY
Value: <service role key da Supabase staging project>
```

#### Supabase Production
```
Name: PRODUCTION_SUPABASE_URL
Value: https://your-production-project.supabase.co

Name: PRODUCTION_SUPABASE_SERVICE_KEY
Value: <service role key da Supabase production project>
```

#### Altri Secrets (opzionali)
```
Name: SENTRY_AUTH_TOKEN
Value: <se usi Sentry>

Name: SLACK_WEBHOOK_URL
Value: <per notifiche deploy su Slack>
```

---

## 👥 Collaborators & Teams

### Setup Team

1. **Settings** → **Collaborators and teams**
2. **Add people** o **Add teams**

### Ruoli consigliati:

**Admin:**
- Lead Developer
- DevOps Engineer

**Write:**
- Senior Developers
- Full-time Developers

**Read:**
- Junior Developers (inizialmente)
- Stakeholders
- QA Team

---

## 🔔 Notifications

### Setup Notifications

**Settings** → **Notifications**

**Consigliato:**
- ✅ Email notifications per PR reviews
- ✅ Email notifications per failed deployments
- ✅ Slack integration per deploy notifications

### Slack Integration

1. Installa GitHub app su Slack
2. `/github subscribe rescuemanager/rescuemanager`
3. Configura eventi:
   ```
   /github subscribe rescuemanager/rescuemanager deployments
   /github subscribe rescuemanager/rescuemanager pulls
   /github subscribe rescuemanager/rescuemanager commits:main
   ```

---

## 📊 GitHub Actions Permissions

### Setup Permissions

**Settings** → **Actions** → **General**

**Workflow permissions:**
- ✅ Read and write permissions
- ✅ Allow GitHub Actions to create and approve pull requests

**Fork pull request workflows:**
- ⚠️ Require approval for first-time contributors

---

## 🏷️ Labels

### Setup Labels per Issues/PRs

**Issues** → **Labels** → **New label**

**Labels consigliati:**

```
bug - Qualcosa non funziona - #d73a4a
enhancement - Nuova feature o richiesta - #a2eeef
documentation - Miglioramenti documentazione - #0075ca
good first issue - Buono per newcomers - #7057ff
help wanted - Aiuto extra richiesto - #008672
invalid - Non sembra corretto - #e4e669
question - Ulteriori informazioni richieste - #d876e3
wontfix - Non verrà lavorato - #ffffff
duplicate - Issue o PR già esistente - #cfd3d7
priority: high - Alta priorità - #b60205
priority: medium - Media priorità - #fbca04
priority: low - Bassa priorità - #0e8a16
status: in progress - In lavorazione - #1d76db
status: blocked - Bloccato - #e99695
type: frontend - Frontend changes - #bfdadc
type: backend - Backend changes - #c2e0c6
type: infrastructure - Infrastructure changes - #f9d0c4
```

---

## 🔒 Security

### Setup Security Features

**Settings** → **Security**

**Consigliato abilitare:**
- ✅ Dependency graph
- ✅ Dependabot alerts
- ✅ Dependabot security updates
- ✅ Code scanning (GitHub Advanced Security se disponibile)
- ✅ Secret scanning

### Dependabot Configuration

Crea `.github/dependabot.yml`:

```yaml
version: 2
updates:
  # Website dependencies
  - package-ecosystem: "npm"
    directory: "/website"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 10
    
  # Admin Panel dependencies
  - package-ecosystem: "npm"
    directory: "/admin-panel"
    schedule:
      interval: "weekly"
    
  # Desktop App dependencies
  - package-ecosystem: "npm"
    directory: "/desktop-app/greeting-friend-api-main"
    schedule:
      interval: "weekly"
    
  # GitHub Actions
  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"
```

---

## 📝 Templates

### Issue Template

Crea `.github/ISSUE_TEMPLATE/bug_report.md`:

```markdown
---
name: Bug Report
about: Crea un report per aiutarci a migliorare
title: '[BUG] '
labels: bug
assignees: ''
---

**Descrizione del bug**
Una descrizione chiara e concisa del bug.

**Come riprodurre**
Steps per riprodurre:
1. Vai su '...'
2. Click su '....'
3. Scroll down to '....'
4. Vedi errore

**Comportamento atteso**
Cosa ti aspettavi che succedesse.

**Screenshots**
Se applicabile, aggiungi screenshots.

**Environment:**
 - OS: [e.g. iOS, Windows, macOS]
 - Browser [e.g. chrome, safari]
 - Version [e.g. 22]

**Informazioni aggiuntive**
Qualsiasi altra informazione sul problema.
```

### Pull Request Template

Crea `.github/PULL_REQUEST_TEMPLATE.md`:

```markdown
## Descrizione
Descrivi le modifiche in questa PR.

## Tipo di modifica
- [ ] Bug fix (non-breaking change che risolve un issue)
- [ ] Nuova feature (non-breaking change che aggiunge funzionalità)
- [ ] Breaking change (fix o feature che causa malfunzionamenti esistenti)
- [ ] Documentazione

## Come è stato testato?
Descrivi i test eseguiti.

- [ ] Test A
- [ ] Test B

## Checklist:
- [ ] Il mio codice segue lo style guide del progetto
- [ ] Ho fatto self-review del mio codice
- [ ] Ho commentato il codice, specialmente in aree complesse
- [ ] Ho fatto modifiche corrispondenti alla documentazione
- [ ] Le mie modifiche non generano nuovi warnings
- [ ] Ho aggiunto test che provano che il mio fix è efficace o che la mia feature funziona
- [ ] Test nuovi ed esistenti passano localmente
- [ ] Modifiche dipendenti sono state mergiate e pubblicate

## Screenshots (se applicabile):

## Issue correlati:
Fixes #(issue)
```

---

## ✅ Checklist Setup Completo

- [ ] Branch protection configurata per `main`
- [ ] Branch protection configurata per `staging`
- [ ] Branch protection configurata per `develop`
- [ ] Vercel secrets configurati
- [ ] VPS SSH key configurata
- [ ] Supabase secrets configurati (staging + prod)
- [ ] Collaborators aggiunti
- [ ] Notifications configurate
- [ ] GitHub Actions permissions configurate
- [ ] Labels create
- [ ] Security features abilitate
- [ ] Dependabot configurato
- [ ] Issue templates creati
- [ ] PR template creato

---

**Setup completato!** Il repository è pronto per il team. 🎉
