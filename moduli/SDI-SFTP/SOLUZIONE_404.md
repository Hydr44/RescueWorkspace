# ✅ Soluzione 404 - File Non Tracciato da Git

## Problema

Route `/api/sdi-sftp/send` ritorna 404 anche dopo deploy completato.

## Causa

Il file `src/app/api/sdi-sftp/send/route.ts` **non era tracciato da git**.

Quando un file non è tracciato da git, Vercel non lo vede durante il build, quindi la route non viene inclusa nel deploy.

## Soluzione Applicata

1. **Aggiunto file a git:**
   ```bash
   git add src/app/api/sdi-sftp/send/route.ts
   ```

2. **Commit eseguito:**
   ```bash
   git commit -m "Add: Route SDI-SFTP send (route.ts file)"
   ```

## Prossimi Passi

**Fai push:**
```bash
cd website
git push
```

**Attendi deploy Vercel:**
- Vercel Dashboard → Deployments
- Aspetta che il nuovo deploy sia completato (1-2 minuti)

**Riprova:**
- Dopo il deploy, riprova l'invio fattura dalla app

## Verifica

Dopo il push e deploy, verifica:
```bash
curl -X POST https://rescuemanager.eu/api/sdi-sftp/send \
  -H "Content-Type: application/json" \
  -d '{"invoice_ids":["test"],"org_id":"test","test_mode":true}'
```

Dovrebbe rispondere (anche con errore, ma non 404).

## Stato

- ✅ File aggiunto a git
- ✅ Commit eseguito
- ⚠️ Push da fare
- ⚠️ Deploy Vercel da attendere

