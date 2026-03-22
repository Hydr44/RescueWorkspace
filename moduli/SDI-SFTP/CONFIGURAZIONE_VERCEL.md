# 🔧 Configurazione Vercel per SDI-SFTP

## Variabili Ambiente Vercel

### Opzione 1: Nessuna variabile (usa default)

Se il DNS `sdi-sftp.rescuemanager.eu` è configurato e punta a `217.154.118.37`, **NON servono variabili ambiente** su Vercel.

La route API usa:
```typescript
const SDI_SFTP_SERVER_URL = process.env.SDI_SFTP_SERVER_URL || 'https://sdi-sftp.rescuemanager.eu';
```

Quindi usa il default `https://sdi-sftp.rescuemanager.eu` se la variabile non è impostata.

### Opzione 2: Variabile opzionale (sovrascrittura)

Se vuoi usare un URL diverso o specificare esplicitamente, aggiungi su Vercel:

**Nome**: `SDI_SFTP_SERVER_URL`  
**Valore**: `https://sdi-sftp.rescuemanager.eu` (o altro URL se preferisci)

## Come Aggiungere Variabile su Vercel

1. Vai su [Vercel Dashboard](https://vercel.com/dashboard)
2. Seleziona il progetto `website` (o nome del progetto)
3. Vai su **Settings** → **Environment Variables**
4. Aggiungi:
   - **Key**: `SDI_SFTP_SERVER_URL`
   - **Value**: `https://sdi-sftp.rescuemanager.eu`
   - **Environments**: Production, Preview, Development (tutti)
5. Salva
6. **Redeploy** il progetto (o aspetta il prossimo deploy)

## ⚠️ Nota Importante

**NON è necessario** aggiungere la variabile se il DNS è configurato correttamente e il default funziona.

## Verifica

Dopo il deploy, verifica che la route funzioni:
```bash
curl -X POST https://rescuemanager.eu/api/sdi-sftp/send \
  -H "Content-Type: application/json" \
  -d '{"invoice_ids":["test"],"org_id":"test","test_mode":true}'
```

Dovrebbe rispondere (anche se con errore dati, ma non errore 500 "fetch failed").

