# ✅ Fix HTTPS → HTTP per SDI-SFTP

## Problema

L'errore 500 "fetch failed" era causato dal fatto che:
- La route API Vercel usa `https://sdi-sftp.rescuemanager.eu` (default)
- Nginx sul server VPS è configurato solo per HTTP (porta 80)
- Non c'è certificato SSL per `sdi-sftp.rescuemanager.eu`

## Soluzione Applicata

**Cambiato URL da HTTPS a HTTP** in `website/src/app/api/sdi-sftp/send/route.ts`:

```typescript
// Prima:
const SDI_SFTP_SERVER_URL = process.env.SDI_SFTP_SERVER_URL || 'https://sdi-sftp.rescuemanager.eu';

// Dopo:
const SDI_SFTP_SERVER_URL = process.env.SDI_SFTP_SERVER_URL || 'http://sdi-sftp.rescuemanager.eu';
```

## Commit

✅ Commit eseguito su `website`:
```
Fix: Cambiato SDI-SFTP URL da HTTPS a HTTP (Nginx non ha ancora SSL)
```

## Deploy

Vercel farà deploy automaticamente oppure puoi fare:
```bash
git push
```

## ⚠️ Nota: HTTPS (Opzionale, per produzione)

Se in futuro vuoi abilitare HTTPS:

1. **Genera certificato SSL con Certbot:**
```bash
ssh root@217.154.118.37
certbot --nginx -d sdi-sftp.rescuemanager.eu
```

2. **Cambia URL di nuovo a HTTPS:**
```typescript
const SDI_SFTP_SERVER_URL = process.env.SDI_SFTP_SERVER_URL || 'https://sdi-sftp.rescuemanager.eu';
```

3. **Redeploy su Vercel**

## Stato Attuale

- ✅ URL cambiato a HTTP
- ✅ Commit eseguito
- ✅ Nginx configurato per HTTP (porta 80)
- ⚠️ HTTPS non configurato (opzionale per futuro)

