# RENTRI VPS - Integrazione Frontend

**Stato**: ⚠️ Frontend usa ancora Vercel, non VPS  
**Data**: 18 Gennaio 2025

---

## 🔍 Analisi Attuale

### **Frontend (Desktop App)**

Il frontend usa attualmente:
- **Base URL**: `https://rescuemanager.eu/api/rentri` (Vercel) 
- **Config**: `VITE_RENTRI_API_URL` (opzionale, default: Vercel)
- **File**: `desktop-app/greeting-friend-api-main/src/lib/rentri-api.js`

### **URL Hardcoded nel Codice**

Alcuni file usano URL hardcoded invece di usare `rentri-api.js`:
- `RifiutiFormularioForm.jsx`: `https://rescuemanager.eu/api/rentri/fir/*`
- `RifiutiRegistroForm.jsx`: `https://rescuemanager.eu/api/rentri/*`
- `RifiutiRegistri.jsx`: `https://rescuemanager.eu/api/rentri/*`
- `RifiutiMovimenti.jsx`: Usa `VITE_RENTRI_POLLING_URL` per polling (già configurato per VPS!)

### **VPS Server**

- **Status**: ✅ Operativo (porta 3003, 2 istanze PM2)
- **URL Locale**: `http://localhost:3003/api/rentri/*`
- **URL Pubblico Demo**: `https://rentri-test.rescuemanager.eu/api/rentri/*`
- **URL Pubblico Prod**: `https://rentri-prod.rescuemanager.eu/api/rentri/*`

---

## 📋 Piano Migrazione Frontend → VPS

### **Opzione 1: Variabile Ambiente (Consigliata)**

Aggiungere `VITE_RENTRI_API_URL` al `.env`:
```bash
# Desktop App .env
VITE_RENTRI_API_URL=https://rentri-test.rescuemanager.eu/api/rentri
```

Il file `rentri-api.js` già supporta questa variabile:
```javascript
const RENTRI_BASE_URL = import.meta.env.VITE_RENTRI_API_URL || 'https://rescuemanager.eu/api/rentri';
```

### **Opzione 2: Aggiornare URL Hardcoded**

Trovare e sostituire tutti gli URL hardcoded:
- `https://rescuemanager.eu/api/rentri/*` → `${RENTRI_BASE_URL}/*`
- Usare `rentri-api.js` invece di `fetch()` diretto

---

## 🔧 Configurazione Consigliata

### **`.env` (Desktop App)**

```bash
# RENTRI API - VPS (default: Vercel)
VITE_RENTRI_API_URL=https://rentri-test.rescuemanager.eu/api/rentri

# RENTRI Polling - VPS (già configurato)
VITE_RENTRI_POLLING_URL=https://rentri-test.rescuemanager.eu
```

### **Produzione**

```bash
VITE_RENTRI_API_URL=https://rentri-prod.rescuemanager.eu/api/rentri
```

---

## ✅ Vantaggi VPS

1. ✅ **Risolve problemi memoria** (Vercel aveva limiti)
2. ✅ **Maggiore performance** (server dedicato)
3. ✅ **Più controllo** (monitoring diretto)
4. ✅ **Scalabilità** (PM2 cluster mode)
5. ✅ **Coerenza** (stessa architettura SDI-SFTP)

---

## 🧪 Test

### **Test VPS Locale**
```bash
curl http://localhost:3003/api/rentri/fir/status
```

### **Test VPS Pubblico**
```bash
curl https://rentri-test.rescuemanager.eu/api/rentri/fir/status
```

### **Test Frontend**
Dopo aver configurato `VITE_RENTRI_API_URL`, testare:
- Creazione registro
- Trasmissione FIR
- Sincronizzazione movimenti

---

## 📝 Note

- Il frontend **già supporta** `VITE_RENTRI_API_URL` (non serve modificare codice)
- Alcuni file usano URL hardcoded (da aggiornare)
- Il polling già usa VPS (`VITE_RENTRI_POLLING_URL`)
- Per produzione, cambiare `rentri-test` → `rentri-prod`

---

## 🎯 Prossimi Passi

1. [ ] Aggiungere `VITE_RENTRI_API_URL` al `.env` desktop app
2. [ ] Sostituire URL hardcoded con `rentri-api.js`
3. [ ] Testare tutte le funzionalità RENTRI
4. [ ] Configurare produzione con `rentri-prod`
