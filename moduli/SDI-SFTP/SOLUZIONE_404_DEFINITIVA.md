# 🔧 Soluzione 404 Definitiva

## Problema

Push fatto 1 ora fa, ma Vercel dà ancora 404 per `/api/sdi-sftp/send`.

## Verifiche Fatte

✅ File esiste: `website/src/app/api/sdi-sftp/send/route.ts`
✅ File committato: Commit `53b84f39`, `c9846d3f`, `b0098480`
✅ File corretto: No errori linter, importazioni corrette
✅ Middleware: Non blocca `/api` (escluso dal matcher)

## Possibili Cause

### 1. Route Non Inclusa nel Build

Vercel potrebbe non aver incluso la route nel build.

**Verifica**:
1. Vai su Vercel Dashboard → Deployments → Ultimo deploy
2. Clicca **View Build Logs**
3. Cerca nella sezione "Route (app)" se appare:
   ```
   ┌ ○ /api/sdi-sftp/send
   ```

Se **NON appare**, la route non è stata inclusa.

### 2. Problema con Path "sdi-sftp" (Dash)

Next.js potrebbe avere problemi con dash nel path.

**Test**: Ho creato `/api/sdi-sftp/test` per verificare.

**Se il test funziona**:
- Il problema è nella route `send` (probabilmente `fetch` al VPS)

**Se il test NON funziona**:
- Il problema è con il path `sdi-sftp`
- **Soluzione**: Rinomina la directory:
  ```bash
  # Da
  src/app/api/sdi-sftp/
  
  # A
  src/app/api/sdi_sftp/  # underscore invece di dash
  ```

### 3. Cache di Vercel

Vercel potrebbe aver cachato una versione vecchia.

**Soluzione**:
1. Vercel Dashboard → Deployments
2. **Redeploy** → **Use existing Build Cache: No**

### 4. Errore Runtime Silenzioso

La route potrebbe esistere ma dare errore runtime.

**Test**: Chiama direttamente:
```bash
curl -X POST https://rescuemanager.eu/api/sdi-sftp/send \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

**Risposte**:
- `404 Not Found` → Route non deployata
- `405 Method Not Allowed` → Route esiste ma metodo sbagliato
- `500 Internal Server Error` → Route esiste ma errore runtime
- `200 OK` → Route funziona!

## Soluzioni Step-by-Step

### Step 1: Test Route Semplice

Ho creato `/api/sdi-sftp/test` per verificare.

1. **Commit e push**:
   ```bash
   cd website
   git add src/app/api/sdi-sftp/test/route.ts
   git commit -m "test: aggiunta route test SDI-SFTP"
   git push
   ```

2. **Aspetta deploy Vercel** (2-3 minuti)

3. **Testa**:
   ```bash
   curl https://rescuemanager.eu/api/sdi-sftp/test
   ```

   **Se funziona** → Il problema è nella route `send`
   **Se NON funziona** → Il problema è con il path `sdi-sftp`

### Step 2: Verifica Build Logs

1. Vercel Dashboard → Deployments → Ultimo deploy
2. **View Build Logs**
3. Cerca:
   - Errori TypeScript
   - Errori di importazione
   - Route non riconosciute
   - Warnings su `sdi-sftp`

### Step 3: Redeploy Senza Cache

1. Vercel Dashboard → Deployments
2. Clicca **⋮** → **Redeploy**
3. **Use existing Build Cache: No**
4. Clicca **Redeploy**

### Step 4: Rinomina Directory (se necessario)

Se il test non funziona, rinomina:

```bash
cd website/src/app/api
mv sdi-sftp sdi_sftp
```

Poi aggiorna il frontend:
```javascript
// src/lib/sdi.js
const endpoint = `${apiUrl}/api/sdi_sftp/send`;  // underscore invece di dash
```

## Stato Attuale

- ✅ File esiste e è corretto
- ✅ File committato e pushato
- ✅ Route di test creata (`/api/sdi-sftp/test`)
- ⏳ Da fare: Commit route test, testare, verificare build logs

## Prossimi Passi

1. **Commit route test** e push
2. **Testa** `/api/sdi-sftp/test` dopo deploy
3. **Verifica build logs** su Vercel
4. **Redeploy senza cache** se necessario
5. **Rinomina directory** se il problema persiste

