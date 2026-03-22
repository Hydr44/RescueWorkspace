# RENTRI Polling Server VPS - Setup

## Stato attuale
Server Express creato in `/opt/rentri-polling/` ma non ancora funzionante.

## Cosa è stato fatto
1. ✅ Directory creata: `/opt/rentri-polling/`
2. ✅ package.json creato
3. ✅ server.js creato (con logica polling)
4. ✅ npm install completato
5. ❌ Server PM2 in errore (mancano variabili d'ambiente)
6. ❌ Nginx non configurato (errore sintassi)

## Cosa manca
1. **Variabili d'ambiente**: Il server ha bisogno di:
   - `SUPABASE_URL` (o `NEXT_PUBLIC_SUPABASE_URL`)
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `RENTRI_GATEWAY_URL` (opzionale, default: https://rentri-test.rescuemanager.eu)

2. **Configurazione Nginx**: Aggiungere location block nel server block corretto:
```nginx
location /api/rentri/transazioni/ {
  proxy_pass http://localhost:3001;
  proxy_http_version 1.1;
  proxy_set_header Host $host;
  proxy_set_header X-Real-IP $remote_addr;
}
```

3. **Avviare server**: Con PM2 già configurato:
```bash
cd /opt/rentri-polling
pm2 start start.sh --name rentri-polling
pm2 save
```

4. **Test endpoint**:
```bash
curl "https://rentri-test.rescuemanager.eu/api/rentri/transazioni/test-id/status?org_id=xxx"
```

5. **Aggiornare frontend**: Cambiare URL da Vercel a VPS:
```javascript
// Invece di: https://rescuemanager.eu/api/rentri/registri/transazioni/${id}/status
// Usa: https://rentri-test.rescuemanager.eu/api/rentri/transazioni/${id}/status
```

## Prossimi passi
1. Trovare/creare file .env con variabili Supabase
2. Correggere configurazione nginx
3. Avviare server con PM2
4. Testare endpoint
5. Aggiornare frontend per usare VPS invece di Vercel
