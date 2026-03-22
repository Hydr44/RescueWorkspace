# 🔍 Debug 404 Persistente dopo Push

## Problema

Il push è stato fatto 1 ora fa, ma Vercel dà ancora 404 per `/api/sdi-sftp/send`.

## Verifiche da Fare

### 1. Verifica Build su Vercel

1. Vai su [Vercel Dashboard](https://vercel.com/dashboard)
2. Seleziona progetto `website`
3. Vai su **Deployments**
4. Trova l'ultimo deploy (dovrebbe essere di 1 ora fa)
5. **Controlla lo stato**:
   - ✅ **Ready** → Il deploy è riuscito, ma la route non funziona
   - ⚠️ **Building** → Il deploy è ancora in corso
   - ❌ **Error** → C'è un errore nel build

### 2. Controlla Build Logs

1. Clicca sull'ultimo deploy
2. Clicca su **View Build Logs**
3. Cerca:
   - Errori TypeScript
   - Errori di importazione (`handleCors`, `corsHeaders`)
   - Errori relativi a `sdi-sftp`
   - Warnings su route non riconosciute

### 3. Verifica Route nel Build

Nel build log, cerca:
```
Route (app)                              Size     First Load JS
┌ ○ /api/sdi-sftp/send                   123 B        123 kB
```

Se la route **NON appare** nella lista, non è stata inclusa nel build.

### 4. Test Diretto della Route

Prova a chiamare direttamente la route:

```bash
curl -X POST https://rescuemanager.eu/api/sdi-sftp/send \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

**Risposte possibili**:
- `404 Not Found` → Route non deployata
- `405 Method Not Allowed` → Route esiste ma metodo sbagliato
- `500 Internal Server Error` → Route esiste ma c'è un errore runtime
- `200 OK` → Route funziona!

### 5. Verifica Struttura Directory

La route deve essere in:
```
website/src/app/api/sdi-sftp/send/route.ts
```

**NON**:
- `website/src/app/api/sdi_sftp/send/route.ts` (underscore invece di dash)
- `website/src/app/api/sdi-sftp/send.ts` (manca directory `send`)
- `website/src/app/api/sdi-sftp/route.ts` (manca directory `send`)

### 6. Verifica Importazioni

Controlla che `handleCors` e `corsHeaders` esistano:

```bash
cd website
ls -la src/lib/cors.ts
```

Se il file non esiste, crealo o rimuovi le importazioni dalla route.

### 7. Verifica Direttive Runtime

La route deve avere:
```typescript
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
```

### 8. Possibile Problema: Cache Vercel

Vercel potrebbe aver cachato una versione vecchia.

**Soluzione**:
1. Vai su **Deployments**
2. Clicca **⋮** → **Redeploy**
3. Seleziona **Use existing Build Cache: No**
4. Clicca **Redeploy**

### 9. Possibile Problema: Route Non Riconosciuta

Next.js potrebbe non riconoscere la route per qualche motivo.

**Soluzione**: Rinomina la directory:
```bash
# Da
src/app/api/sdi-sftp/send/route.ts

# A (temporaneamente per test)
src/app/api/sdi-sftp-send/route.ts
```

Poi testa: `https://rescuemanager.eu/api/sdi-sftp-send`

### 10. Verifica Git Status

Assicurati che il file sia stato effettivamente pushato:

```bash
cd website
git log --oneline -5 -- src/app/api/sdi-sftp/send/route.ts
```

Se non ci sono commit, il file non è stato pushato.

## Soluzioni Rapide

### Soluzione 1: Redeploy Senza Cache

1. Vercel Dashboard → Deployments
2. Redeploy → **No cache**

### Soluzione 2: Verifica Build Logs

1. Vercel Dashboard → Deployments → Ultimo deploy
2. View Build Logs
3. Cerca errori

### Soluzione 3: Test Locale

```bash
cd website
npm run build
npm start
# Testa: curl -X POST http://localhost:3000/api/sdi-sftp/send
```

Se funziona localmente ma non su Vercel, è un problema di deploy.

### Soluzione 4: Route Alternativa

Crea una route di test semplice:

```typescript
// src/app/api/sdi-sftp/test/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ message: 'SDI-SFTP route works!' });
}
```

Poi testa: `https://rescuemanager.eu/api/sdi-sftp/test`

Se funziona, il problema è nella route `send`.

## Stato Attuale

- ✅ File esiste localmente
- ✅ File committato (verificare con `git log`)
- ✅ File pushato (verificare con `git log --all`)
- ❌ Route dà 404 su Vercel
- ⏳ Da verificare: Build logs, deploy status, test diretto

