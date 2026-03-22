# 📊 Analisi: Vercel vs VPS per API RENTRI

**Data Analisi**: 18 Gennaio 2025  
**Problema**: API RENTRI chiamate su `https://rescuemanager.eu/api/rentri/ai-validate` (Vercel) invece di VPS

---

## 🔍 Situazione Attuale

### **Configurazione Frontend**
Il frontend usa questo fallback:
```javascript
const apiUrl = import.meta.env.VITE_RENTRI_API_URL 
  || import.meta.env.VITE_API_URL 
  || 'https://rescuemanager.eu'; // ⚠️ FALLBACK A VERCEL
```

**Problema**: Se `VITE_RENTRI_API_URL` non è configurato, le chiamate vanno a Vercel invece che alla VPS.

### **URL Corretti**
- ✅ **VPS (corretto)**: `https://rentri-test.rescuemanager.eu/api/rentri`
- ❌ **Vercel (fallback)**: `https://rescuemanager.eu/api/rentri`

---

## ⚠️ Problemi con Vercel Free (Hobby Plan)

### **1. Timeout Funzioni**
- **Hobby**: Max **10 secondi** per funzione serverless
- **Pro**: Max **60 secondi** (o 300s con configurazione)
- **Problema**: Validazione IA può richiedere **30-60 secondi** → **TIMEOUT su Hobby**

### **2. Limiti CPU/Memoria**
- **Hobby**: 4 CPU-h, 360 GB-h memoria/mese
- **Pro**: 16 CPU-h, 1.440 GB-h memoria/mese
- **Problema**: Validazione IA usa molta CPU/memoria → **LIMITI SUPERATI**

### **3. Invocazioni**
- **Hobby**: 1M invocazioni/mese
- **Pro**: 10M invocazioni/mese
- **Problema**: Con molte validazioni → **LIMITE SUPERATO**

### **4. Costi Nascosti**
- **Hobby**: Gratis fino ai limiti, poi **BLOCCATO**
- **Pro**: $20/mese + costi extra per uso oltre credito incluso
- **Problema**: Con traffico reale → **COSTI IMPREVEDIBILI**

### **5. "Memoria Provvisoria Piena"**
- **Hobby**: Memoria limitata, no persistenza
- **Pro**: Più memoria, ma sempre serverless (no persistenza)
- **Problema**: RENTRI richiede memoria per certificati, cache, ecc. → **ERRORE MEMORIA**

---

## 💰 Costi Vercel Pro

### **Piano Pro Base**
- **Costo**: $20/mese
- **Credito incluso**: $20 di credito flessibile
- **Limiti base**: 16 CPU-h, 1.440 GB-h, 10M invocazioni

### **Costi Extra (oltre credito)**
- **CPU**: ~$0.0000100 per GB-secondo
- **Memoria**: ~$0.00000125 per GB-secondo
- **Invocazioni**: ~$0.0000002 per invocazione oltre 10M

### **Stima Costi Mensili (esempio)**
```
Scenario: 1000 validazioni IA/mese
- Durata media: 30 secondi
- Memoria: 512 MB
- CPU: 0.5 vCPU

Calcolo:
- CPU: 1000 × 30s × 0.5 vCPU = 15.000 CPU-secondi = 4.17 CPU-h
- Memoria: 1000 × 30s × 0.5 GB = 15.000 GB-secondi = 4.17 GB-h
- Invocazioni: 1000 (entro limite)

Costo base Pro: $20/mese
Costo extra: ~$0 (entro crediti)
TOTALE: ~$20/mese
```

**Ma se aumenti il traffico:**
- 10.000 validazioni/mese → **$20 + costi extra**
- 100.000 validazioni/mese → **$20 + $100+ extra**

---

## ✅ Vantaggi VPS (Soluzione Attuale)

### **1. Controllo Totale**
- ✅ Nessun limite di timeout (puoi configurare)
- ✅ Memoria dedicata (no "memoria provvisoria piena")
- ✅ CPU dedicata (no throttling)
- ✅ Storage persistente per certificati, cache, log

### **2. Costi Prevedibili**
- ✅ **Costo fisso**: ~€10-20/mese per VPS
- ✅ Nessun costo extra per invocazioni
- ✅ Nessun costo extra per memoria/CPU
- ✅ Scalabilità controllata (puoi aggiungere risorse se serve)

### **3. Prestazioni**
- ✅ Nessun cold start (server sempre attivo)
- ✅ Latenza costante (no variabilità serverless)
- ✅ Gestione processi (PM2, cluster mode)
- ✅ Logging completo e persistente

### **4. Sicurezza**
- ✅ Certificati .p12 gestiti localmente
- ✅ Variabili d'ambiente sicure
- ✅ Nessun limite su dimensioni payload
- ✅ Controllo completo su firewall, rete, ecc.

---

## 🎯 Raccomandazione

### **✅ USA VPS (Soluzione Attuale)**

**Motivi:**
1. ✅ **Costi prevedibili**: €10-20/mese vs $20+ variabili
2. ✅ **Nessun limite timeout**: Validazione IA può durare 60+ secondi
3. ✅ **Nessun problema memoria**: Certificati, cache, log gestiti localmente
4. ✅ **Prestazioni costanti**: No cold start, latenza stabile
5. ✅ **Controllo totale**: PM2, logging, monitoraggio completo

### **❌ NON usare Vercel per API RENTRI**

**Motivi:**
1. ❌ **Timeout**: 10s (Hobby) vs 30-60s necessari per IA
2. ❌ **Memoria limitata**: "Memoria provvisoria piena" già verificato
3. ❌ **Costi imprevedibili**: $20 base + costi extra variabili
4. ❌ **No persistenza**: Certificati, cache non persistenti
5. ❌ **Cold start**: Latenza variabile su chiamate sporadiche

---

## 🔧 Fix Immediato

### **1. Configurare VITE_RENTRI_API_URL**

**Nel file `.env` del frontend:**
```bash
VITE_RENTRI_API_URL=https://rentri-test.rescuemanager.eu/api/rentri
```

**Verifica che sia configurato:**
```bash
# Controlla se esiste .env
cat desktop-app/greeting-friend-api-main/.env | grep VITE_RENTRI_API_URL

# Se non esiste, crealo da env.example
cp desktop-app/greeting-friend-api-main/env.example desktop-app/greeting-friend-api-main/.env
```

### **2. Aggiornare Fallback Default**

**In `AIValidationModal.jsx` e altri file:**
```javascript
// ❌ PRIMA (fallback a Vercel)
const apiUrl = import.meta.env.VITE_RENTRI_API_URL 
  || import.meta.env.VITE_API_URL 
  || 'https://rescuemanager.eu';

// ✅ DOPO (fallback a VPS)
const apiUrl = import.meta.env.VITE_RENTRI_API_URL 
  || import.meta.env.VITE_API_URL 
  || 'https://rentri-test.rescuemanager.eu/api/rentri';
```

---

## 📊 Confronto Finale

| Caratteristica | Vercel Free | Vercel Pro | VPS (Attuale) |
|----------------|-------------|------------|---------------|
| **Costo mensile** | $0 | $20+ | €10-20 |
| **Timeout max** | 10s ❌ | 60s ⚠️ | Illimitato ✅ |
| **Memoria** | Limitata ❌ | Più memoria ⚠️ | Dedicata ✅ |
| **CPU** | Limitata ❌ | Più CPU ⚠️ | Dedicata ✅ |
| **Persistenza** | No ❌ | No ❌ | Sì ✅ |
| **Cold start** | Sì ❌ | Sì ❌ | No ✅ |
| **Controllo** | Limitato ❌ | Medio ⚠️ | Totale ✅ |
| **Costi extra** | Blocco ❌ | Variabili ⚠️ | Fissi ✅ |

---

## ✅ Conclusione

**NON conviene passare a Vercel Pro per API RENTRI.**

**Motivi principali:**
1. ✅ **VPS è già configurata e funzionante**
2. ✅ **Costi prevedibili** (€10-20/mese vs $20+ variabili)
3. ✅ **Nessun limite tecnico** (timeout, memoria, CPU)
4. ✅ **Prestazioni migliori** (no cold start, latenza costante)
5. ✅ **Controllo totale** (PM2, logging, monitoraggio)

**Azione immediata:**
1. ✅ Configurare `VITE_RENTRI_API_URL` nel frontend
2. ✅ Aggiornare fallback default a VPS invece di Vercel
3. ✅ Verificare che tutte le chiamate vadano a VPS

**Vercel Pro conviene solo se:**
- Hai bisogno di funzionalità enterprise (SAML, HIPAA)
- Vuoi collaborazione team avanzata
- Hai budget per costi variabili
- **MA**: Per API RENTRI, VPS è la scelta migliore

---

## 🚀 Prossimi Passi

1. ✅ **Fix immediato**: Configurare `VITE_RENTRI_API_URL` nel frontend
2. ✅ **Verifica**: Controllare che tutte le chiamate vadano a VPS
3. ✅ **Monitoraggio**: Verificare log VPS per confermare traffico
4. ✅ **Documentazione**: Aggiornare env.example con URL VPS

**Il problema attuale è solo di configurazione, non di architettura!** 🎯
