# RENTRI Polling VPS - Setup Completato

## ✅ Cosa è stato fatto

1. **Server Express creato** in `/opt/rentri-polling/`
   - `server.js` - Server Express con endpoint polling
   - `package.json` - Dipendenze (express, @supabase/supabase-js, crypto)
   - `start.sh` - Script di avvio con variabili d'ambiente
   - `npm install` completato

2. **Nginx configurato** per proxare a localhost:3001
   - Location block aggiunto: `/api/rentri/transazioni/`
   - Configurazione testata e valida

3. **Frontend aggiornato** (`RifiutiMovimenti.jsx`)
   - Usa `https://rentri-test.rescuemanager.eu` invece di Vercel per polling
   - Cambio già presente nel codice (pollingApiUrl)

4. **PM2 configurato** (processo creato ma non avviato)

## ⚠️ Problema attuale

**Il server non si avvia perché mancano le variabili d'ambiente:**

Il file `/root/.env` non contiene:
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## 🔧 Cosa serve per completare

### 1. Configurare variabili d'ambiente

Aggiungere al file `/root/.env` (o creare se non esiste):

```bash
NEXT_PUBLIC_SUPABASE_URL=https://hbcygzqiuvqhxmvfqcjy.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<chiave_service_role_da_supabase>
RENTRI_GATEWAY_URL=https://rentri-test.rescuemanager.eu  # Opzionale
```

**Nota:** La chiave `SUPABASE_SERVICE_ROLE_KEY` deve essere quella con permessi completi (service_role), non quella pubblica (anon).

### 2. Avviare il server

```bash
cd /opt/rentri-polling
pm2 restart rentri-polling
pm2 save
```

### 3. Verificare che funzioni

```bash
# Health check
curl http://localhost:3001/health

# Test endpoint (dovrebbe funzionare dopo aver configurato le variabili)
curl "https://rentri-test.rescuemanager.eu/api/rentri/transazioni/test-id/status?org_id=xxx&registro_id=yyy&environment=demo"
```

### 4. Monitorare i log

```bash
pm2 logs rentri-polling
```

## 📋 Endpoint disponibili

- `GET /health` - Health check
- `GET /api/rentri/transazioni/:id/status?org_id=xxx&registro_id=yyy&environment=demo` - Status transazione

## 🔄 Flusso

1. **Frontend** chiama `https://rentri-test.rescuemanager.eu/api/rentri/transazioni/:id/status`
2. **Nginx** proxa a `http://localhost:3001/api/rentri/transazioni/:id/status`
3. **Server Express** recupera certificato da Supabase, genera JWT, chiama RENTRI
4. **Server Express** restituisce risposta al frontend

## ✨ Vantaggi

- Bypassa completamente Vercel per il polling
- Gestione diretta degli header Authorization (nessun problema con 303 redirect)
- Controllo completo sul server
- Logging centralizzato sul VPS

## 📝 Note

- Il frontend è già stato aggiornato e usa il VPS
- Il server è pronto, serve solo configurare le variabili d'ambiente
- PM2 gestirà automaticamente il riavvio in caso di crash

