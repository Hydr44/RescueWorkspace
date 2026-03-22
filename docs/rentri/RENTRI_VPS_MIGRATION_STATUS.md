# ✅ RENTRI VPS - Stato Migrazione Completo

**Data Analisi**: 18 Gennaio 2025  
**Server VPS**: `217.154.118.37:3003`  
**URL Pubblico**: `https://rentri-test.rescuemanager.eu/api/rentri/*`

---

## ✅ Stato Migrazione RENTRI

### **Spostati su VPS** ✅ (20/32 endpoint - 62.5%)

#### **Status** (1 endpoint)
- ✅ `GET /api/rentri/status` → VPS (`routes/status.js`)

#### **Codifiche** (1 endpoint)
- ✅ `GET /api/rentri/codifiche` → VPS (`routes/codifiche.js`)

#### **Formulari (FIR)** (3/9 endpoint)
- ✅ `POST /api/rentri/fir/trasmetti` → VPS (`routes/formulari.js`)
- ✅ `GET /api/rentri/fir/transazione-status` → VPS (`routes/formulari.js`)
- ✅ `GET /api/rentri/fir/transazione-result` → VPS (`routes/formulari.js`)

#### **Registri** (10 endpoint)
- ✅ `GET /api/rentri/registri` → VPS (`routes/registri.js`)
- ✅ `POST /api/rentri/registri` → VPS (`routes/registri.js`)
- ✅ `GET /api/rentri/registri/:id` → VPS (`routes/registri.js`)
- ✅ `PUT /api/rentri/registri/:id` → VPS (`routes/registri.js`)
- ✅ `DELETE /api/rentri/registri/:id` → VPS (`routes/registri.js`)
- ✅ `POST /api/rentri/registri/create` → VPS (`routes/registri.js`)
- ✅ `POST /api/rentri/registri/sync` → VPS (`routes/registri.js`)
- ✅ `GET /api/rentri/registri/:id/movimenti` → VPS (`routes/registri.js`)
- ✅ `GET /api/rentri/registri/transazioni/:id/status` → VPS (`routes/registri.js`)
- ✅ `GET /api/rentri/registri/transazioni/:id/result` → VPS (`routes/registri.js`)

#### **Movimenti** (2 endpoint)
- ✅ `POST /api/rentri/movimenti/sync` → VPS (`routes/movimenti.js`)
- ✅ `POST /api/rentri/movimenti/update-status` → VPS (`routes/movimenti.js`)

#### **Anagrafiche** (2 endpoint)
- ✅ `GET /api/rentri/siti` → VPS (`routes/anagrafiche.js`)
- ✅ `GET /api/rentri/siti/autorizzazioni` → VPS (`routes/anagrafiche.js`)

#### **MUD** (3 endpoint)
- ✅ `GET /api/rentri/mud` → VPS (`routes/mud.js`)
- ✅ `POST /api/rentri/mud` → VPS (`routes/mud.js`)
- ✅ `GET /api/rentri/mud/:id` → VPS (`routes/mud.js`)

---

### **Rimangono su Vercel** ⚠️ (12/32 endpoint - 37.5%)

#### **Formulari (FIR)** (6 endpoint)
- ⚠️ `POST /api/rentri/fir/firma` → **Vercel** (da valutare spostamento)
- ⚠️ `POST /api/rentri/fir/accettazione` → **Vercel** (da valutare spostamento)
- ⚠️ `POST /api/rentri/fir/annulla` → **Vercel** (da valutare spostamento)
- ⚠️ `GET /api/rentri/fir/stato` → **Vercel** (da valutare spostamento)
- ⚠️ `GET /api/rentri/fir/sync-stati` → **Vercel** (da valutare spostamento)
- ⚠️ `GET /api/rentri/fir/pdf` → **Vercel** (download PDF RENTRI, basso impatto)

#### **Certificati** (1 endpoint)
- ⚠️ `POST /api/rentri/certificati/upload` → **Vercel** (upload file, dipende da Vercel storage)

#### **Limiti** (2 endpoint)
- ⚠️ `GET /api/rentri/limiti` → **Vercel** (calcoli DB locale, basso impatto memoria)
- ⚠️ `GET /api/rentri/limiti/alert` → **Vercel** (calcoli DB locale, basso impatto memoria)

#### **Blocchi** (1 endpoint)
- ⚠️ `GET /api/rentri/blocchi` → **Vercel** (query DB locale, basso impatto memoria)

#### **AI Validate** (1 endpoint)
- ⚠️ `POST /api/rentri/ai-validate` → **Vercel** (AI OpenAI, dipende da Edge Functions)

#### **Status FIR** (1 endpoint)
- ⚠️ `GET /api/rentri/fir/status` → **Vercel** (endpoint semplice, basso impatto)

---

## 📊 Statistiche

### **VPS**
- **Endpoint Spostati**: 20/32 (62.5%)
- **File Route Creati**: 7
- **Righe Codice**: ~1,500+ righe JavaScript
- **Dimensione**: ~68KB
- **PM2 Istanze**: 2 (cluster mode)
- **Status**: ✅ **Operativo**

### **Vercel**
- **Endpoint Rimanenti**: 12/32 (37.5%)
- **Endpoint Critici**: 6 (FIR rimanenti)
- **Endpoint Opzionali**: 6 (PDF, certificati, limiti, blocchi, AI)

---

## 🎯 Raccomandazioni

### **Priorità Alta** ⚠️
**Spostare 6 endpoint FIR rimanenti su VPS**:
- `POST /api/rentri/fir/firma`
- `POST /api/rentri/fir/accettazione`
- `POST /api/rentri/fir/annulla`
- `GET /api/rentri/fir/stato`
- `GET /api/rentri/fir/sync-stati`
- `GET /api/rentri/fir/status`

**Vantaggi**:
- ✅ **Coerenza completa** - Tutte le API FIR su VPS
- ✅ **Basso rischio** - Endpoint semplici (CRUD DB locale)
- ✅ **Basso impatto memoria** - Query semplici
- ✅ **Controllo completo** - Monitoring, log, gestione errori

**Tempo Stimato**: 1-2 ore

### **Priorità Media** 📋
**Valutare spostamento**:
- `POST /api/rentri/certificati/upload` - Dipende da Vercel storage
- `POST /api/rentri/ai-validate` - Dipende da Edge Functions

**Decisione**: Mantenere su Vercel se dipendenze necessarie

### **Priorità Bassa** ✅
**Mantenere su Vercel**:
- `GET /api/rentri/fir/pdf` - Download PDF (basso impatto)
- `GET /api/rentri/limiti` - Calcoli DB locale (basso impatto)
- `GET /api/rentri/limiti/alert` - Calcoli DB locale (basso impatto)
- `GET /api/rentri/blocchi` - Query DB locale (basso impatto)

**Ragione**: Basso impatto memoria, funzionano bene su Vercel

---

## ✅ Stato Finale

**Server VPS**: ✅ **OPERATIVO** (20/32 endpoint - 62.5%)  
**Frontend**: ⚠️ **CONFIGURAZIONE RICHIESTA** (`VITE_RENTRI_API_URL`)  
**Vercel**: ⚠️ **12 ENDPOINT RIMANENTI** (37.5%)

**Prossimo Passo**: Spostare 6 endpoint FIR rimanenti su VPS per raggiungere **81.25%** (26/32 endpoint)

---

## 📝 Note

- Il server VPS è **completamente funzionante** per le 20 route principali
- I 12 endpoint rimanenti su Vercel sono **a basso impatto memoria**
- La migrazione completa FIR (6 endpoint) è **facile e veloce**
- Il frontend **già supporta** `VITE_RENTRI_API_URL` (non serve modificare codice)
