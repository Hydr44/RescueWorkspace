# ✅ Soluzione: Chiamata Diretta VPS

## Problema

Route `/api/sdi-sftp/send` su Vercel ritorna 404, anche dopo deploy.

## Soluzione Semplice

**Bypass Vercel completamente**: Frontend chiama direttamente il server VPS.

## Modifiche Applicate

### Frontend (`desktop-app/src/lib/sdi.js`)

**Prima:**
```javascript
const endpoint = `${API.SDI}/api/sdi-sftp/send`; // Vercel
```

**Dopo:**
```javascript
const sdiSftpServerUrl = import.meta.env.VITE_SDI_SFTP_SERVER_URL || 'http://sdi-sftp.rescuemanager.eu';
const endpoint = `${sdiSftpServerUrl}/api/sdi-sftp/send`; // VPS diretto
```

## Architettura

**Prima:**
```
Frontend → Vercel (/api/sdi-sftp/send) → VPS
```

**Dopo:**
```
Frontend → VPS (http://sdi-sftp.rescuemanager.eu/api/sdi-sftp/send)
```

## Vantaggi

✅ **Risolve 404**: Niente route Vercel necessaria  
✅ **Più semplice**: Un hop in meno  
✅ **Più veloce**: Niente proxy intermedio  
✅ **Server VPS**: Già configurato con CORS  

## Configurazione

### Server VPS

- ✅ CORS già configurato (`app.use(cors())`)
- ✅ Endpoint `/api/sdi-sftp/send` già funzionante
- ✅ Porta 3004, Nginx proxy su `sdi-sftp.rescuemanager.eu`

### Frontend

- ✅ Variabile ambiente opzionale: `VITE_SDI_SFTP_SERVER_URL`
- ✅ Default: `http://sdi-sftp.rescuemanager.eu`
- ✅ Endpoint: `/api/sdi-sftp/send`

## Route Vercel

La route `/api/sdi-sftp/send` su Vercel può essere:
- **Rimossa** (non più necessaria)
- **Mantenuta** come backup/alternativa

## Test

Dopo il deploy del frontend, testa:
```bash
# Dalla app desktop: Invia fattura
# Dovrebbe chiamare direttamente: http://sdi-sftp.rescuemanager.eu/api/sdi-sftp/send
```

## Stato

- ✅ Frontend modificato
- ✅ Server VPS pronto
- ⚠️ Commit e deploy frontend da fare

