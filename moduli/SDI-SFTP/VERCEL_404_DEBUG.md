# 🔍 Debug 404 Vercel - Route SDI-SFTP

## Problema

```
POST https://rescuemanager.eu/api/sdi-sftp/send 404 (Not Found)
```

La route `/api/sdi-sftp/send` non viene trovata su Vercel, anche se il file esiste ed è stato committato.

## Verifica Stato

✅ **File esiste**: `website/src/app/api/sdi-sftp/send/route.ts`
✅ **File tracciato da Git**: `git ls-files` conferma
✅ **File committato**: Commit `53b84f39` e altri
✅ **Branch up to date**: Git status conferma

## Possibili Cause

### 1. Vercel Non Ha Fatto Rebuild

Vercel potrebbe non aver fatto rebuild dopo l'ultimo commit.

**Soluzione**:
1. Vai su [Vercel Dashboard](https://vercel.com/dashboard)
2. Seleziona il progetto `website`
3. Vai su **Deployments**
4. Verifica l'ultimo deploy:
   - Se è in **Building** → aspetta
   - Se è in **Error** → controlla i log
   - Se è in **Ready** → controlla se il commit è quello giusto

### 2. Problema di Build su Vercel

La build potrebbe fallire senza errori visibili.

**Soluzione**:
1. Vai su **Deployments** → Ultimo deploy
2. Clicca su **View Build Logs**
3. Cerca errori relativi a:
   - `sdi-sftp`
   - `route.ts`
   - TypeScript errors
   - Import errors

### 3. Cache di Vercel

Vercel potrebbe aver cachato una versione vecchia.

**Soluzione**:
1. Vai su **Deployments** → Ultimo deploy
2. Clicca su **⋮** (tre punti) → **Redeploy**
3. Seleziona **Use existing Build Cache: No**
4. Clicca **Redeploy**

### 4. Route Non Riconosciuta da Next.js

Next.js potrebbe non riconoscere la route per qualche motivo.

**Verifica**:
1. Controlla che il file sia in: `src/app/api/sdi-sftp/send/route.ts`
2. Controlla che esporti `export async function POST(...)`
3. Controlla che non ci siano errori TypeScript

## Verifica Locale

Puoi verificare che la route funzioni localmente:

```bash
cd website
npm run build
npm start
# Poi testa: curl -X POST http://localhost:3000/api/sdi-sftp/send
```

Se funziona localmente ma non su Vercel, è un problema di deploy/build.

## Soluzione Rapida

**Forza un nuovo deploy**:
1. Fai un commit vuoto (touch file e commit)
2. Push su GitHub
3. Vercel farà rebuild automaticamente

Oppure:
1. Vai su Vercel Dashboard
2. **Deployments** → **Redeploy** (senza cache)

## Stato Attuale

- ✅ File esiste e è corretto
- ✅ File committato e pushato
- ❌ Vercel dà 404
- ⏳ Da verificare: build logs su Vercel

