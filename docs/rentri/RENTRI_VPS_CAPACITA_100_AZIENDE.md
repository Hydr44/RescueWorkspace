# 📊 Analisi Capacità VPS RENTRI per 100 Aziende

**Data Analisi**: 18 Gennaio 2025  
**Server VPS**: `217.154.118.37:3003`  
**Target**: 100 aziende (organizzazioni)

---

## 🖥️ Configurazione Server Attuale

### **Risorse Hardware**
- **RAM Totale**: 3.8 GB
- **RAM Disponibile**: 2.6 GB
- **CPU Cores**: 2
- **Disco**: 116 GB (8.6 GB usati, 107 GB disponibili)

### **Configurazione PM2**
- **Istanze**: 2 (cluster mode)
- **Memory Limit**: 500 MB per istanza (max 1 GB totale)
- **Auto-restart**: ✅ Configurato
- **Uptime**: 5 minuti (dopo restart)

### **Configurazione Nginx**
- **Proxy**: `/api/rentri/` → `localhost:3003`
- **Timeout**: 60s (connect, send, read)
- **CORS**: ✅ Configurato

---

## 📈 Stima Carico per 100 Aziende

### **Scenario Base: 100 Aziende**

#### **1. Utenti Simultanei**
- **100 aziende** × **2-3 utenti attivi/azienda** = **200-300 utenti simultanei**
- **Picco**: ~400 utenti (orari lavorativi)

#### **2. Richieste API RENTRI**

**Per Azienda (giornaliere):**
- **Creazione FIR**: 5-10 FIR/giorno
- **Trasmissione FIR**: 5-10 trasmissioni/giorno
- **Polling Status**: 50-100 richieste/giorno (polling ogni 2s per 10-20s)
- **Sync Movimenti**: 1-2 sync/giorno
- **Sync Registri**: 1 sync/giorno
- **Lettura Stato**: 20-30 letture/giorno
- **AI Validate**: 10-20 validazioni/giorno
- **PDF Download**: 5-10 download/giorno

**Totale per Azienda**: ~100-200 richieste/giorno

**100 Aziende**:
- **Totale Richieste/Giorno**: 10,000-20,000
- **Richieste/Ora**: ~400-800
- **Richieste/Minuto**: ~7-13
- **Richieste/Secondo**: **~0.1-0.2 req/s** (media)

**Picco (orari lavorativi 9-18)**:
- **Richieste/Minuto**: ~15-25
- **Richieste/Secondo**: **~0.25-0.4 req/s** (picco)

---

## ✅ Analisi Capacità Server

### **1. CPU (2 Cores)**

**Carico Stimato:**
- **Media**: 0.1-0.2 req/s × 0.1s CPU/req = **0.01-0.02 CPU cores**
- **Picco**: 0.4 req/s × 0.1s CPU/req = **0.04 CPU cores**

**Verdetto**: ✅ **MOLTO SOTTO IL LIMITE** (2 cores disponibili, usa <5%)

### **2. RAM (3.8 GB Totale, 1 GB per RENTRI API)**

**Uso Attuale:**
- **2 istanze PM2**: ~100 MB per istanza = **200 MB**
- **Buffer Node.js**: ~50-100 MB
- **Totale RENTRI API**: **~300 MB**

**Con 100 Aziende:**
- **Connessioni simultanee**: ~10-20 connessioni
- **Memory per connessione**: ~5-10 MB
- **Totale aggiuntivo**: ~100-200 MB
- **Totale stimato**: **~400-500 MB**

**Verdetto**: ✅ **SUFFICIENTE** (1 GB disponibile, usa ~50%)

### **3. Network**

**Bandwidth Stimato:**
- **Media**: 0.2 req/s × 50 KB/req = **10 KB/s**
- **Picco**: 0.4 req/s × 50 KB/req = **20 KB/s**
- **Giornaliero**: ~10,000 req × 50 KB = **500 MB/giorno**

**Verdetto**: ✅ **MOLTO SOTTO IL LIMITE** (bandwidth VPS tipicamente 100+ Mbps)

### **4. Database (Supabase)**

**Query per Richiesta API:**
- **Media**: 2-3 query Supabase per richiesta API
- **Totale Query/Giorno**: 20,000-60,000 query
- **Query/Secondo**: **~0.2-0.7 query/s**

**Verdetto**: ✅ **FACILMENTE GESTIBILE** (Supabase Pro supporta 100+ query/s)

---

## ⚠️ Potenziali Colli di Bottiglia

### **1. Polling FIR (Transazione Status)**

**Scenario Critico:**
- **10 aziende** trasmettono FIR contemporaneamente
- **Polling**: ogni 2s per 20s = **10 richieste per FIR**
- **Totale**: 10 FIR × 10 richieste = **100 richieste in 20s**
- **Rate**: **5 req/s** (picco)

**Verdetto**: ⚠️ **GESTIBILE** ma monitorare durante picchi

### **2. Sync Movimenti/Registri**

**Scenario Critico:**
- **10 aziende** sincronizzano contemporaneamente
- **Ogni sync**: 50-200 movimenti (paginazione)
- **Tempo**: 10-30 secondi per sync
- **Concorrenza**: 10 sync simultanee

**Verdetto**: ⚠️ **GESTIBILE** ma può rallentare durante sync massive

### **3. AI Validate (OpenAI API)**

**Scenario Critico:**
- **10 aziende** validano contemporaneamente
- **Tempo OpenAI**: 2-5 secondi per validazione
- **Concorrenza**: 10 richieste simultanee

**Verdetto**: ⚠️ **DIPENDE DA OPENAI** (rate limit OpenAI, non server VPS)

---

## 🎯 Raccomandazioni

### **1. Ottimizzazioni Immediate** ✅

#### **A. Aumentare Memory Limit PM2**
```bash
# Attuale: 500 MB per istanza
# Consigliato: 1 GB per istanza (2 GB totale)
pm2 restart rentri-api --update-env --max-memory-restart 1G
```

#### **B. Aumentare Istanze Cluster (Opzionale)**
```bash
# Attuale: 2 istanze
# Consigliato: 3-4 istanze per 100 aziende
pm2 scale rentri-api 4
```

#### **C. Configurare Nginx Rate Limiting**
```nginx
# Limita a 10 req/s per IP (previene abusi)
limit_req_zone $binary_remote_addr zone=rentri_limit:10m rate=10r/s;
limit_req zone=rentri_limit burst=20 nodelay;
```

### **2. Monitoring** 📊

#### **A. PM2 Monitoring**
```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

#### **B. Health Check Endpoint**
- ✅ Già implementato: `GET /health`
- ✅ Status API: `GET /api/rentri/status`

#### **C. Logging**
- ✅ Console logging già implementato
- ⚠️ Considerare file logging per produzione

### **3. Scalabilità Futura** 🚀

#### **A. Se > 200 Aziende**
- **Aumentare RAM VPS**: 8 GB
- **Aumentare CPU**: 4 cores
- **Aumentare Istanze PM2**: 4-6 istanze

#### **B. Se > 500 Aziende**
- **Load Balancer**: Nginx upstream con più server
- **Database Connection Pooling**: PgBouncer
- **Caching**: Redis per query frequenti

---

## ✅ Verdict Finale

### **Server VPS Attuale per 100 Aziende**

| Metrica | Attuale | Richiesto | Verdict |
|---------|---------|-----------|---------|
| **CPU** | 2 cores | <0.1 cores | ✅ **SUFFICIENTE** |
| **RAM** | 3.8 GB (1 GB per RENTRI) | ~500 MB | ✅ **SUFFICIENTE** |
| **Network** | 100+ Mbps | ~20 KB/s | ✅ **SUFFICIENTE** |
| **Database** | Supabase Pro | ~0.5 query/s | ✅ **SUFFICIENTE** |
| **Concorrenza** | 2 istanze PM2 | ~10-20 req simultanee | ✅ **SUFFICIENTE** |

### **Conclusione**

✅ **Il server VPS è SUFFICIENTE per 100 aziende** con:
- ✅ **CPU**: Usa <5% (molto sotto il limite)
- ✅ **RAM**: Usa ~50% (margine di sicurezza)
- ✅ **Network**: Usa <1% (molto sotto il limite)
- ✅ **Database**: Query rate molto basso

### **Raccomandazioni**

1. ✅ **Aumentare memory limit PM2** a 1 GB per istanza (opzionale, ma consigliato)
2. ✅ **Configurare rate limiting Nginx** (prevenzione abusi)
3. ✅ **Monitoring PM2** (log rotation, health checks)
4. ⚠️ **Monitorare durante picchi** (polling FIR, sync massive)

---

## 🎯 Frontend - Stato Configurazione

### **File Aggiornati** ✅
- ✅ `src/lib/rentri-api.js` - Usa `VITE_RENTRI_API_URL`
- ✅ `src/components/rentri/AIValidationModal.jsx` - Usa `VITE_RENTRI_API_URL`
- ✅ `src/pages/RifiutiFormularioForm.jsx` - Usa `VITE_RENTRI_API_URL`
- ✅ `src/hooks/useFirSync.js` - Usa `VITE_RENTRI_API_URL`
- ✅ `src/lib/services/rentriPrintService.js` - Usa `VITE_RENTRI_API_URL`
- ✅ `src/pages/RifiutiRegistroForm.jsx` - Usa `VITE_RENTRI_API_URL`
- ✅ `src/pages/RifiutiRegistri.jsx` - Usa `VITE_RENTRI_API_URL`
- ✅ `src/pages/RifiutiSetupWizard.jsx` - Usa `VITE_RENTRI_API_URL`

### **Configurazione Richiesta**

Aggiungere al `.env` della desktop app:
```bash
# RENTRI API - VPS
VITE_RENTRI_API_URL=https://rentri-test.rescuemanager.eu/api/rentri
```

**Nota**: Se non configurato, il sistema userà automaticamente il fallback a Vercel.

### **Verdetto Frontend**

✅ **Frontend PRONTO** - Tutti i file aggiornati per usare `VITE_RENTRI_API_URL`

---

## 🎉 Conclusione Finale

### **Server VPS**
✅ **SUFFICIENTE per 100 aziende** con margine di sicurezza

### **Frontend**
✅ **PRONTO** - Configurazione `VITE_RENTRI_API_URL` richiesta

### **Raccomandazioni**
1. ✅ Aggiungere `VITE_RENTRI_API_URL` al `.env`
2. ✅ Aumentare memory limit PM2 (opzionale)
3. ✅ Configurare rate limiting Nginx (opzionale)
4. ✅ Monitoring PM2 (opzionale)

**Il sistema è pronto per 100 aziende!** 🚀
