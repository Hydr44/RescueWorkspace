# 📊 Analisi Completa API Vercel

**Data Analisi**: 18 Gennaio 2025  
**Base URL**: `https://rescuemanager.eu/api`

---

## 📂 API RENTRI su Vercel (32 file)

### **Status**
- ✅ `GET /api/rentri/status` → **SPOSTATO su VPS** (`routes/status.js`)

### **Codifiche**
- ✅ `GET /api/rentri/codifiche` → **SPOSTATO su VPS** (`routes/codifiche.js`)

### **Formulari (FIR)** (9 endpoint)
- ✅ `POST /api/rentri/fir/trasmetti` → **SPOSTATO su VPS** (`routes/formulari.js`)
- ✅ `GET /api/rentri/fir/transazione-status` → **SPOSTATO su VPS** (`routes/formulari.js`)
- ✅ `GET /api/rentri/fir/transazione-result` → **SPOSTATO su VPS** (`routes/formulari.js`)
- ✅ `GET /api/rentri/fir/pdf` → **RIMANE su Vercel** (download PDF RENTRI)
- ⚠️ `POST /api/rentri/fir/firma` → **NON SPOSTATO** (da implementare su VPS)
- ⚠️ `POST /api/rentri/fir/accettazione` → **NON SPOSTATO** (da implementare su VPS)
- ⚠️ `POST /api/rentri/fir/annulla` → **NON SPOSTATO** (da implementare su VPS)
- ⚠️ `GET /api/rentri/fir/stato` → **NON SPOSTATO** (da implementare su VPS)
- ⚠️ `GET /api/rentri/fir/sync-stati` → **NON SPOSTATO** (da implementare su VPS)

### **Registri** (10 endpoint)
- ✅ `GET /api/rentri/registri` → **SPOSTATO su VPS** (`routes/registri.js`)
- ✅ `POST /api/rentri/registri` → **SPOSTATO su VPS** (`routes/registri.js`)
- ✅ `GET /api/rentri/registri/:id` → **SPOSTATO su VPS** (`routes/registri.js`)
- ✅ `PUT /api/rentri/registri/:id` → **SPOSTATO su VPS** (`routes/registri.js`)
- ✅ `DELETE /api/rentri/registri/:id` → **SPOSTATO su VPS** (`routes/registri.js`)
- ✅ `POST /api/rentri/registri/create` → **SPOSTATO su VPS** (`routes/registri.js`)
- ✅ `POST /api/rentri/registri/sync` → **SPOSTATO su VPS** (`routes/registri.js`)
- ✅ `GET /api/rentri/registri/:id/movimenti` → **SPOSTATO su VPS** (`routes/registri.js`)
- ✅ `GET /api/rentri/registri/transazioni/:id/status` → **SPOSTATO su VPS** (`routes/registri.js`)
- ✅ `GET /api/rentri/registri/transazioni/:id/result` → **SPOSTATO su VPS** (`routes/registri.js`)

### **Movimenti** (2 endpoint)
- ✅ `POST /api/rentri/movimenti/sync` → **SPOSTATO su VPS** (`routes/movimenti.js`)
- ✅ `POST /api/rentri/movimenti/update-status` → **SPOSTATO su VPS** (`routes/movimenti.js`)

### **Anagrafiche** (2 endpoint)
- ✅ `GET /api/rentri/siti` → **SPOSTATO su VPS** (`routes/anagrafiche.js`)
- ✅ `GET /api/rentri/siti/autorizzazioni` → **SPOSTATO su VPS** (`routes/anagrafiche.js`)

### **MUD** (2 endpoint)
- ✅ `GET /api/rentri/mud` → **SPOSTATO su VPS** (`routes/mud.js`)
- ✅ `POST /api/rentri/mud` → **SPOSTATO su VPS** (`routes/mud.js`)
- ✅ `GET /api/rentri/mud/:id` → **SPOSTATO su VPS** (`routes/mud.js`)

### **Certificati**
- ⚠️ `POST /api/rentri/certificati/upload` → **RIMANE su Vercel** (upload file, dipende da storage Vercel)

### **Limiti**
- ⚠️ `GET /api/rentri/limiti` → **NON SPOSTATO** (calcoli DB locale, basso impatto memoria)
- ⚠️ `GET /api/rentri/limiti/alert` → **NON SPOSTATO** (calcoli DB locale, basso impatto memoria)

### **Blocchi**
- ⚠️ `GET /api/rentri/blocchi` → **NON SPOSTATO** (query DB locale, basso impatto memoria)

### **AI Validate**
- ⚠️ `POST /api/rentri/ai-validate` → **RIMANE su Vercel** (AI OpenAI, dipende da Vercel/Edge Functions)

---

## 📂 Altre API su Vercel (118 file totali)

### **Auth** (11 endpoint)
- `POST /api/auth/login`
- `GET /api/auth/verify`
- `POST /api/auth/refresh`
- `POST /api/auth/oauth/desktop`
- `POST /api/auth/oauth/exchange`
- `POST /api/auth/operator/login`
- `POST /api/auth/operator/logout`
- `POST /api/auth/operator/create`
- `POST /api/auth/operator/create-first`
- `GET /api/auth/operator/list`
- `GET /api/auth/operator/sessions`
- `POST /api/auth/operator/refresh`

### **RVFU** (4 endpoint)
- `POST /api/rvfu/auth/authorize`
- `POST /api/rvfu/auth/authenticate`
- `POST /api/rvfu/auth/token`
- `POST /api/rvfu/auth/refresh`

### **SDI-SFTP** (3 endpoint)
- `POST /api/sdi-sftp/send`
- `GET /api/sdi-sftp/status`
- `POST /api/sdi-sftp/test`
- **NOTA**: Già migrato su VPS (`/opt/sdi-sftp-server/`)

### **SDI AI Validate**
- `POST /api/sdi/ai-validate`

### **Staff Admin** (35+ endpoint)
- Gestione utenti, organizzazioni, staff, leads, analytics, audit, etc.
- **NOTA**: Query DB locale, basso impatto memoria

### **Billing** (6 endpoint)
- Stripe checkout, portal, sync
- **NOTA**: Integrazione Stripe, può rimanere su Vercel

### **Monitoring** (2 endpoint)
- `POST /api/monitoring/heartbeat`
- `GET /api/monitoring/users`

### **Version Control** (4 endpoint)
- `GET /api/version/check`
- `GET /api/version/history`
- `POST /api/version/publish`
- `POST /api/version/enforce`

### **Maintenance** (3 endpoint)
- `GET /api/maintenance/status`
- `POST /api/maintenance/enable`
- `POST /api/maintenance/disable`

### **Sync** (3 endpoint)
- `POST /api/sync/push`
- `POST /api/sync/pull`
- `GET /api/sync/status`

### **Assist** (6 endpoint)
- CRUD per assistenza clienti

### **AI Assist**
- `POST /api/ai/assist`

### **Altri** (18 endpoint)
- `POST /api/checkout`
- `POST /api/contact`
- `POST /api/leads`
- `POST /api/org/create`
- `POST /api/org/select`
- `POST /api/invoices/:id/send-email`
- etc.

---

## 📊 Statistiche Migrazione RENTRI

### **Spostati su VPS** ✅
- **20 endpoint** spostati e funzionanti
- **7 file route** creati sulla VPS
- **~1,500 righe** di codice JavaScript

### **Da Spostare** ⚠️
- **6 endpoint FIR** (firma, accettazione, annulla, stato, sync-stati)
- **Nota**: Endpoint semplici, basso impatto memoria

### **Rimangono su Vercel** 🏠
- **1 endpoint PDF FIR** (download PDF RENTRI, basso impatto)
- **1 endpoint certificati** (upload file, dipende da Vercel storage)
- **2 endpoint limiti** (calcoli DB locale, basso impatto)
- **1 endpoint blocchi** (query DB locale, basso impatto)
- **1 endpoint AI validate** (AI OpenAI, dipende da Edge Functions)

---

## 🎯 Raccomandazioni

### **Priorità Alta** ⚠️
**Endpoint FIR rimanenti** (6 endpoint):
- Sono endpoint semplici (CRUD DB locale)
- **Basso impatto memoria**
- **Raccomandazione**: Spostare su VPS per coerenza e controllo completo

### **Priorità Media** 📋
**Endpoint con dipendenze Vercel**:
- `/api/rentri/certificati/upload` → Dipende da Vercel storage
- `/api/rentri/ai-validate` → Dipende da Edge Functions

### **Priorità Bassa** ✅
**Endpoint calcoli/query DB**:
- `/api/rentri/limiti` → Calcoli DB locale
- `/api/rentri/limiti/alert` → Calcoli DB locale
- `/api/rentri/blocchi` → Query DB locale
- `/api/rentri/fir/pdf` → Download PDF (basso impatto)

---

## ✅ Vantaggi Migrazione Completa

1. ✅ **Coerenza** - Tutte le API RENTRI su VPS
2. ✅ **Controllo** - Monitoring diretto, log accessibili
3. ✅ **Performance** - Server dedicato, cluster mode
4. ✅ **Scalabilità** - PM2 cluster, memory limit
5. ✅ **Affidabilità** - Auto-restart, gestione errori

---

## 📋 Checklist Finale

### **RENTRI VPS** ✅
- [x] Status API
- [x] Codifiche
- [x] FIR: trasmetti, transazione-status, transazione-result
- [x] Registri: tutte le route (10 endpoint)
- [x] Movimenti: sync, update-status
- [x] Anagrafiche: siti, autorizzazioni
- [x] MUD: lista, crea, dettaglio

### **RENTRI Vercel (da valutare)** ⚠️
- [ ] FIR: firma, accettazione, annulla, stato, sync-stati (6 endpoint)
- [ ] Certificati: upload (1 endpoint)
- [ ] Limiti: lista, alert (2 endpoint)
- [ ] Blocchi: lista (1 endpoint)
- [ ] FIR PDF: download (1 endpoint)
- [ ] AI Validate: validazione AI (1 endpoint)

**Totale endpoint da valutare**: **12 endpoint**

---

## 🎯 Conclusione

**Stato Attuale**:
- ✅ **20/32 endpoint RENTRI spostati su VPS** (62.5%)
- ⚠️ **12 endpoint rimangono su Vercel** (37.5%)

**Raccomandazione**:
- Spostare i **6 endpoint FIR rimanenti** su VPS (basso impatto, alta coerenza)
- Valutare **upload certificati** e **AI validate** (dipendenze Vercel)
- Mantenere **limiti/blocchi/PDF** su Vercel (basso impatto memoria)

**Impatto Migrazione Completa FIR**:
- ✅ **Basso rischio** (endpoint semplici)
- ✅ **Alta coerenza** (tutte le API FIR su VPS)
- ✅ **Controllo completo** (monitoring, log, gestione errori)
