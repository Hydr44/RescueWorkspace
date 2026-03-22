# 🔍 Troubleshooting 404 Persistente

## Situazione

- ✅ Build completato senza errori
- ✅ File route.ts presente e corretto
- ✅ Direttive runtime aggiunte
- ✅ Commit fatto
- ❌ 404 persiste dopo deploy

## Possibili Cause

### 1. Push Non Completato

Il commit è locale ma non è stato pushato al remoto.

**Verifica:**
```bash
cd website
git status
git log origin/main..HEAD  # Mostra commit locali non pushati
```

**Soluzione:**
```bash
git push
```

### 2. Deploy Vercel Non Completo

Il deploy potrebbe essere ancora in corso o fallito silenziosamente.

**Verifica:**
- Vercel Dashboard → Deployments
- Controlla stato ultimo deploy (deve essere "Ready", non "Building" o "Error")
- Controlla Runtime Logs (non Build Logs)

### 3. Cache Vercel

Vercel potrebbe avere una cache della route mancante.

**Soluzione:**
- Vercel Dashboard → Deployments → Ultimo deploy → "Redeploy"
- Oppure: Clear cache e redeploy completo

### 4. Route Non Riconosciuta da Next.js

Next.js potrebbe non riconoscere la route per qualche motivo.

**Verifica struttura:**
```
src/app/api/sdi-sftp/send/route.ts
```

Deve essere esattamente questa struttura (case-sensitive).

### 5. Problema Runtime vs Build

Il build potrebbe essere OK ma il runtime fallisce.

**Verifica:**
- Vercel Dashboard → Deployments → Ultimo deploy → Functions
- Cerca `/api/sdi-sftp/send` nelle Functions
- Controlla Runtime Logs per errori

### 6. Middleware o Rewrite Rules

Potrebbe esserci un middleware o rewrite rule che interferisce.

**Verifica:**
- Controlla `middleware.ts` se esiste
- Controlla `next.config.js` per rewrite rules

## Azioni da Fare

### 1. Verifica Push

```bash
cd website
git push
```

### 2. Verifica Deploy Vercel

- Vercel Dashboard → Deployments
- Stato ultimo deploy
- Runtime Logs

### 3. Redeploy

- Vercel Dashboard → Deployments → "Redeploy"

### 4. Test Diretto

Dopo deploy, testa direttamente:
```bash
curl -X POST https://rescuemanager.eu/api/sdi-sftp/send \
  -H "Content-Type: application/json" \
  -d '{"invoice_ids":["test"],"org_id":"test","test_mode":true}'
```

### 5. Verifica Route in Functions

- Vercel Dashboard → Deployments → Functions
- Cerca `/api/sdi-sftp/send`
- Se non c'è, la route non è stata compilata

## Debug Avanzato

### Verifica File in Commit

```bash
cd website
git show HEAD:src/app/api/sdi-sftp/send/route.ts
```

Dovrebbe mostrare il file completo.

### Verifica Remote

```bash
cd website
git remote -v
git log origin/main --oneline -5
```

### Verifica Build Output (se possibile)

Se hai accesso al build output di Vercel, verifica che la route sia presente.

## Stato Attuale

- ✅ File presente localmente
- ✅ Commit fatto
- ⚠️ Push da verificare
- ⚠️ Deploy Vercel da verificare
- ❌ 404 persiste

