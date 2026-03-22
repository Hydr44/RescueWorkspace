# 🔍 Debug Errore 404 SDI-SFTP

## Errore

```
POST https://rescuemanager.eu/api/sdi-sftp/send 404 (Not Found)
```

## Possibili Cause

### 1. Deploy Vercel Non Completato

Il commit è stato fatto localmente ma potrebbe non essere ancora deployato su Vercel.

**Verifica:**
- Vai su [Vercel Dashboard](https://vercel.com/dashboard)
- Controlla se c'è un deploy in corso o appena completato
- Verifica che il commit `Fix: Cambiato SDI-SFTP URL da HTTPS a HTTP` sia presente

**Soluzione:**
- Se il commit non è su Vercel, fai `git push`
- Aspetta che Vercel completi il deploy (1-2 minuti)

### 2. Route Non Presente

La route `/api/sdi-sftp/send` non è riconosciuta da Next.js/Vercel.

**Verifica:**
```bash
# Controlla che il file esista
ls -la website/src/app/api/sdi-sftp/send/route.ts

# Controlla che esporti POST
grep "export async function POST" website/src/app/api/sdi-sftp/send/route.ts
```

**Soluzione:**
- Se il file non esiste, ripristinalo
- Se esiste ma non viene riconosciuto, verifica la struttura directory

### 3. Build Error su Vercel

Vercel potrebbe avere errori di build che impediscono il deploy della route.

**Verifica:**
- Vercel Dashboard → Deployments → Ultimo deploy → Logs
- Cerca errori TypeScript o di build

**Soluzione:**
- Corregere errori di build
- Rigenerare il deploy

## Verifica Rapida

1. **File locale:**
   ```bash
   cd website
   ls -la src/app/api/sdi-sftp/send/route.ts
   ```

2. **Commit locale:**
   ```bash
   git log --oneline -3
   ```

3. **Push a Vercel:**
   ```bash
   git push
   ```

4. **Attendi deploy Vercel:**
   - Vercel Dashboard → Deployments
   - Aspetta che lo status diventi "Ready"

5. **Test di nuovo:**
   - Riprova l'invio fattura dalla app

## Stato Attuale

- ✅ File route.ts presente localmente
- ✅ Commit locale eseguito
- ⚠️ Deploy Vercel da verificare
- ⚠️ 404 indica route non disponibile su Vercel

## Prossimi Passi

1. Verifica Vercel Dashboard
2. Se necessario, fai `git push`
3. Aspetta deploy completato
4. Riprova

