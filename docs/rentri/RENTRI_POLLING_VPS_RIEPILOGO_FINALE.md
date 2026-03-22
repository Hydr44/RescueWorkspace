# RENTRI Polling VPS - Riepilogo Finale

## ✅ Setup Completato

### 1. Server VPS
- **Posizione**: `/opt/rentri-polling/`
- **Status**: ✅ Online (PM2)
- **Porta**: 3001
- **Health check**: http://localhost:3001/health ✅

### 2. Variabili d'ambiente
- ✅ `NEXT_PUBLIC_SUPABASE_URL` configurato
- ✅ `SUPABASE_SERVICE_ROLE_KEY` configurato
- ✅ File `/root/.env` aggiornato

### 3. Nginx
- ✅ Location `/api/rentri/transazioni/` configurato
- ✅ Proxing a `http://localhost:3001`
- ✅ Configurazione valida

### 4. Frontend
- ✅ `RifiutiMovimenti.jsx` aggiornato
- ✅ Usa `https://rentri-test.rescuemanager.eu` invece di Vercel
- ✅ Variabile `pollingApiUrl` implementata

## 🧪 Test

### Test 1: Health Check Locale
```bash
ssh root@217.154.118.37
curl http://localhost:3001/health
# Risultato atteso: {"status":"ok","service":"rentri-polling"}
```

### Test 2: Endpoint Pubblico
```bash
curl "https://rentri-test.rescuemanager.eu/api/rentri/transazioni/test-id/status?org_id=xxx&registro_id=yyy&environment=demo"
# Risultato atteso: Errore 404 (certificato non trovato) o risposta valida
```

### Test 3: Test End-to-End
1. Apri l'app desktop
2. Vai su "Rifiuti RENTRI" → "Movimenti"
3. Seleziona movimenti e clicca "Trasmetti a RENTRI"
4. Dopo la trasmissione, il polling dovrebbe usare il VPS
5. Verifica nei log che le chiamate vadano a `rentri-test.rescuemanager.eu`

## 📋 Monitoraggio

### Log Server VPS
```bash
ssh root@217.154.118.37
pm2 logs rentri-polling
```

### Log Nginx
```bash
ssh root@217.154.118.37
tail -f /var/log/nginx/rentri-test.access.log
tail -f /var/log/nginx/rentri-test.error.log
```

### Status PM2
```bash
ssh root@217.154.118.37
pm2 status
pm2 info rentri-polling
```

## 🔄 Flusso Completo

1. **Frontend** trasmette movimenti → Vercel (come prima)
2. **Vercel** restituisce `transazione_id`
3. **Frontend** inizia polling → **VPS** (`rentri-test.rescuemanager.eu`)
4. **Nginx** proxa a `localhost:3001`
5. **Server Express** recupera certificato da Supabase
6. **Server Express** genera JWT e chiama RENTRI (via nginx reverse proxy)
7. **Server Express** restituisce risposta al frontend
8. **Frontend** aggiorna UI in base allo stato

## ✨ Vantaggi Ottenuti

- ✅ **Bypassa Vercel** per il polling (evita problemi con 303 redirect)
- ✅ **Controllo completo** sul server
- ✅ **Logging centralizzato** sul VPS
- ✅ **Gestione diretta header Authorization** (nessun problema)
- ✅ **PM2** per gestione processo (riavvio automatico)

## 📝 Note

- Il server è configurato per usare il database Supabase principale
- Le credenziali sono in `/root/.env` (solo root può leggerle)
- PM2 salva la configurazione, il server si riavvierà automaticamente al reboot
- Se il server crasha, PM2 lo riavvia automaticamente

## 🚀 Prossimi Passi (Opzionali)

1. **Endpoint /result**: Implementare anche il polling del risultato sul VPS
2. **Monitoraggio**: Aggiungere metriche/logging più dettagliati
3. **Production**: Configurare anche per `rentri.rescuemanager.eu` (production)
4. **Rate limiting**: Aggiungere rate limiting se necessario

