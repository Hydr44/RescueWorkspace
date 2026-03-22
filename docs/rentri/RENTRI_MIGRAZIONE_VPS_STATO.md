# 🚀 RENTRI API - Stato Migrazione VPS

**Data Inizio**: 18 Gennaio 2025  
**Server VPS**: `217.154.118.37`  
**Directory**: `/opt/rentri-api/`  
**Porta**: `3003`

---

## ✅ Completato (Fase 1)

### 1. Struttura Server
- ✅ Directory `/opt/rentri-api/` creata
- ✅ Subdirectory `lib/`, `routes/`, `logs/` create
- ✅ `package.json` creato e `npm install` eseguito (117 pacchetti)
- ✅ `server.js` base creato e testato

### 2. Server Base
- ✅ Server Express funzionante
- ✅ Health check endpoint: `/health`
- ✅ Status API endpoint: `/api/rentri/status`
- ✅ Middleware CORS configurato
- ✅ Error handling base
- ✅ Integrazione Supabase configurata

### 3. Test
- ✅ Server si avvia correttamente sulla porta 3003
- ✅ Health check risponde

---

## 🚧 In Corso (Fase 2)

### Prossimi Passi Immediati

1. **Creare Librerie JavaScript** (da TypeScript)
   - [ ] `lib/jwt-dynamic.js` (da `website/src/lib/rentri/jwt-dynamic.ts`)
   - [ ] `lib/fir-builder.js` (da `website/src/lib/rentri/fir-builder.ts`)
   - [ ] `lib/cors.js` (da `website/src/lib/cors.ts`)

2. **Creare Route Express**
   - [ ] `routes/formulari.js` (API FIR)
   - [ ] `routes/registri.js` (API registri)
   - [ ] `routes/movimenti.js` (API movimenti)
   - [ ] `routes/anagrafiche.js` (API anagrafiche)
   - [ ] `routes/codifiche.js` (API codifiche)
   - [ ] `routes/mud.js` (API MUD)

3. **Configurare Nginx**
   - [ ] Aggiungere location `/api/rentri/` → `localhost:3003`
   - [ ] Testare configurazione
   - [ ] Ricaricare Nginx

4. **Configurare PM2**
   - [ ] Creare `ecosystem.config.js`
   - [ ] Avviare server con PM2
   - [ ] Configurare auto-restart

---

## 📋 File da Migrare

### Route Next.js → Express

**Formulari (FIR)**
- `website/src/app/api/rentri/fir/trasmetti/route.ts` → `routes/formulari.js` (POST /fir/trasmetti)
- `website/src/app/api/rentri/fir/transazione-status/route.ts` → `routes/formulari.js` (GET /fir/transazione-status)
- `website/src/app/api/rentri/fir/transazione-result/route.ts` → `routes/formulari.js` (GET /fir/transazione-result)
- `website/src/app/api/rentri/fir/pdf/route.ts` → `routes/formulari.js` (GET /fir/pdf)
- `website/src/app/api/rentri/fir/firma/route.ts` → `routes/formulari.js` (POST /fir/firma)
- `website/src/app/api/rentri/fir/accettazione/route.ts` → `routes/formulari.js` (POST /fir/accettazione)
- `website/src/app/api/rentri/fir/annulla/route.ts` → `routes/formulari.js` (POST /fir/annulla)
- `website/src/app/api/rentri/fir/stato/route.ts` → `routes/formulari.js` (GET /fir/stato)
- `website/src/app/api/rentri/fir/sync-stati/route.ts` → `routes/formulari.js` (GET /fir/sync-stati)

**Registri**
- `website/src/app/api/rentri/registri/route.ts` → `routes/registri.js`
- `website/src/app/api/rentri/registri/create/route.ts` → `routes/registri.js`
- `website/src/app/api/rentri/registri/sync/route.ts` → `routes/registri.js`
- `website/src/app/api/rentri/registri/[id]/route.ts` → `routes/registri.js`
- `website/src/app/api/rentri/registri/[id]/movimenti/route.ts` → `routes/registri.js`
- `website/src/app/api/rentri/registri/transazioni/[id]/status/route.ts` → `routes/registri.js`
- `website/src/app/api/rentri/registri/transazioni/[id]/result/route.ts` → `routes/registri.js`

**Movimenti**
- `website/src/app/api/rentri/movimenti/sync/route.ts` → `routes/movimenti.js`
- `website/src/app/api/rentri/movimenti/update-status/route.ts` → `routes/movimenti.js`

**Altri**
- `website/src/app/api/rentri/siti/route.ts` → `routes/anagrafiche.js`
- `website/src/app/api/rentri/codifiche/route.ts` → `routes/codifiche.js`
- `website/src/app/api/rentri/mud/route.ts` → `routes/mud.js`

---

## 🔧 Comandi Utili

### Connetti alla VPS
```bash
ssh vps-sdi
```

### Directory Server
```bash
cd /opt/rentri-api
```

### Avvia Server (test)
```bash
node server.js
```

### Installa Dipendenze
```bash
npm install
```

### Log Server
```bash
tail -f logs/rentri-api.log  # (quando configurato con PM2)
```

---

## 📝 Note

- Il server è attualmente in **modalità test** (non ancora su PM2)
- Nginx non è ancora configurato (quindi non accessibile pubblicamente)
- Le route non sono ancora implementate (solo health check e status)
- Le librerie JavaScript non sono ancora create (da convertire da TypeScript)

---

## 🎯 Prossima Azione

Creare le librerie JavaScript:
1. `lib/jwt-dynamic.js`
2. `lib/fir-builder.js`
3. `lib/cors.js`

Poi creare la prima route di esempio (formulari).
