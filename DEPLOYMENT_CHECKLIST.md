# Deployment Checklist

Checklist completa per deploy sicuri su staging e production.

---

## 📋 PRE-DEPLOY

### Code Quality
- [ ] Tutti i test passano localmente
- [ ] Nessun errore TypeScript
- [ ] Nessun warning ESLint critico
- [ ] Code review completata e approvata
- [ ] Branch aggiornato con base branch (merge conflicts risolti)

### Database
- [ ] Migrazioni testate su staging
- [ ] Backup database production creato (se deploy prod)
- [ ] Rollback plan definito per migrazioni
- [ ] Seed data preparati (se necessario)

### Environment Variables
- [ ] Tutte le env vars configurate su Vercel/VPS
- [ ] Secrets aggiornati se necessario
- [ ] Nessun secret hardcoded nel codice
- [ ] `.env.example` aggiornato

### Documentation
- [ ] README aggiornato se necessario
- [ ] CHANGELOG aggiornato
- [ ] API docs aggiornate (se cambiate API)
- [ ] Commenti nel codice per parti complesse

---

## 🚀 DEPLOY STAGING

### Pre-Deploy Staging
- [ ] Crea PR verso branch `staging`
- [ ] Review approvata da almeno 1 developer
- [ ] CI/CD checks passati (GitHub Actions)

### Deploy
- [ ] Merge PR in `staging`
- [ ] Verifica auto-deploy Vercel partito
- [ ] Verifica deploy VPS completato (se moduli VPS modificati)
- [ ] Attendi completamento deploy (~2-5 minuti)

### Post-Deploy Staging
- [ ] Verifica sito accessibile: https://staging.rescuemanager.eu
- [ ] Run smoke tests: `./scripts/smoke-test.sh staging`
- [ ] Verifica health checks: `/api/health`
- [ ] Test manuale funzionalità principali
- [ ] Test funzionalità modificate/nuove
- [ ] Verifica logs per errori (Vercel + PM2)

### Smoke Tests Staging
```bash
# Website
curl -f https://staging.rescuemanager.eu/api/health
curl -f https://staging.rescuemanager.eu

# VPS Services
curl -f https://staging-assist.rescuemanager.eu/health
curl -f https://staging-rentri.rescuemanager.eu/health
curl -f https://staging-api.rescuemanager.eu/health

# Database
# Verifica connessione Supabase staging
```

### Test Funzionalità Critiche
- [ ] Login/Logout funzionante
- [ ] Creazione nuovi record (transports, leads, etc.)
- [ ] Sync desktop app (se modificato)
- [ ] Payment flow (se modificato)
- [ ] Email sending (se modificato)
- [ ] File upload/download (se modificato)

---

## 🎯 DEPLOY PRODUCTION

### Pre-Deploy Production
- [ ] Staging testato e stabile per almeno 24h
- [ ] Nessun bug critico riportato su staging
- [ ] Stakeholders notificati del deploy
- [ ] Maintenance window comunicato (se necessario)
- [ ] Backup database production creato
- [ ] Rollback plan pronto

### Deploy
- [ ] Crea PR da `staging` → `main`
- [ ] Review approvata da lead developer
- [ ] CI/CD checks passati
- [ ] Merge PR in `main`
- [ ] Verifica auto-deploy Vercel partito
- [ ] Verifica deploy VPS completato

### Database Migrations (se presenti)
```bash
# Applica migrazioni a production
supabase db push --db-url "$PRODUCTION_DB_URL"

# Verifica migrazioni applicate
supabase db diff --db-url "$PRODUCTION_DB_URL"
```

### Post-Deploy Production
- [ ] Verifica sito accessibile: https://rescuemanager.eu
- [ ] Run smoke tests: `./scripts/smoke-test.sh production`
- [ ] Verifica health checks: `/api/health`
- [ ] Test funzionalità critiche
- [ ] Monitoring attivo per 30 minuti
- [ ] Verifica logs per errori

### Smoke Tests Production
```bash
# Website
curl -f https://rescuemanager.eu/api/health
curl -f https://rescuemanager.eu

# VPS Services
curl -f https://assist.rescuemanager.eu/health
curl -f https://rentri-test.rescuemanager.eu/health
curl -f https://api.rescuemanager.eu/health

# Test login
curl -X POST https://rescuemanager.eu/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test"}'
```

### Monitoring (primi 30 minuti)
- [ ] Vercel Analytics - nessun spike errori
- [ ] Sentry - nessun errore nuovo
- [ ] PM2 logs - nessun crash
- [ ] Supabase logs - nessun errore query
- [ ] User reports - nessun problema segnalato

---

## 🔄 ROLLBACK PROCEDURE

### Se qualcosa va storto:

#### Rollback Vercel (Website)
```bash
# Via Vercel Dashboard
# Deployments → Find previous deployment → Promote to Production

# Via CLI
vercel rollback
```

#### Rollback VPS Services
```bash
# SSH nel VPS
ssh root@217.154.118.37

# Torna al commit precedente
cd /opt/production
git log --oneline -5  # Trova commit precedente
git checkout <previous-commit-hash>

# Reinstalla dependencies
for service in assist-server rentri-api sdi-sftp-server; do
  cd /opt/production/moduli/$service
  npm install --production
done

# Restart services
pm2 restart production-ecosystem
```

#### Rollback Database
```bash
# Ripristina backup
supabase db restore --db-url "$PRODUCTION_DB_URL" backup.sql

# O revert migrazione specifica
supabase migration revert <migration-name>
```

---

## 📊 POST-DEPLOY

### Immediate (0-1h)
- [ ] Notifica team su Slack: "✅ Deploy completato"
- [ ] Aggiorna status page (se presente)
- [ ] Chiudi issue/ticket correlati
- [ ] Tag release su GitHub

### Short-term (1-24h)
- [ ] Monitora error rate
- [ ] Monitora performance metrics
- [ ] Raccogli feedback utenti
- [ ] Documenta problemi riscontrati

### Long-term (1-7 giorni)
- [ ] Analizza metriche post-deploy
- [ ] Retrospettiva deploy (se problemi)
- [ ] Aggiorna documentazione se necessario
- [ ] Pianifica prossimi miglioramenti

---

## 🚨 EMERGENCY ROLLBACK

Se deploy causa problemi critici:

1. **STOP** - Non fare altri deploy
2. **ASSESS** - Valuta gravità problema
3. **DECIDE** - Rollback o hotfix?
4. **ACT** - Esegui rollback o fix
5. **VERIFY** - Testa che problema sia risolto
6. **COMMUNICATE** - Notifica team e utenti
7. **POST-MORTEM** - Analizza causa e previeni

### Criteri per Rollback Immediato
- [ ] Sito completamente down
- [ ] Errori critici per >50% utenti
- [ ] Data loss o corruption
- [ ] Security breach
- [ ] Payment system non funzionante

### Criteri per Hotfix
- [ ] Bug minore che affetta <10% utenti
- [ ] Fix veloce disponibile (<30 min)
- [ ] Nessun rischio di peggiorare situazione

---

## 📞 CONTACTS

### In caso di problemi:

**Lead Developer:** sign.rascozzarini@rescuemanager.eu  
**DevOps:** (se presente)  
**On-call:** (se presente)

**Vercel Support:** https://vercel.com/support  
**Supabase Support:** https://supabase.com/support  
**VPS Provider:** (info provider)

---

## 📝 DEPLOY LOG TEMPLATE

```markdown
## Deploy [DATE] - [VERSION]

**Branch:** staging → main
**Deployed by:** [NAME]
**Time:** [HH:MM] - [HH:MM]

### Changes:
- Feature X implemented
- Bug Y fixed
- Performance improvement Z

### Migrations:
- [x] 20260322_migration_name.sql

### Tests:
- [x] Smoke tests passed
- [x] Manual testing completed
- [x] No errors in logs

### Rollback:
- Rollback commit: abc123
- Backup: backup_20260322.sql

### Notes:
- Everything went smoothly
- No issues reported
```

---

## ✅ QUICK CHECKLIST

### Staging Deploy
```
□ PR approved
□ CI passed
□ Merge to staging
□ Wait for deploy
□ Smoke tests
□ Manual testing
```

### Production Deploy
```
□ Staging stable 24h
□ Backup created
□ PR approved
□ Merge to main
□ Wait for deploy
□ Migrations applied
□ Smoke tests
□ Monitor 30min
□ Notify team
```

---

**Remember:** Better safe than sorry. When in doubt, rollback! 🔄
