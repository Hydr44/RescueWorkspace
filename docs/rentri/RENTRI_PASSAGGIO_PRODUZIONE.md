# 🚀 Passaggio RENTRI da Demo a Produzione

**Data:** 14 gennaio 2026

---

## 🔍 Differenza tra RENTRI e SDI

**IMPORTANTE:** RENTRI e SDI sono **due sistemi diversi**:
- **SDI (Sistema di Interscambio):** Fatturazione elettronica
- **RENTRI:** Sistema per gestione registri veicoli fuoriuso

**RENTRI non richiede "attivazione" come SDI!**

---

## 📋 Come Funziona RENTRI

### **RENTRI usa un Gateway/API**

**Attualmente configurato:**
- **URL Gateway:** `https://rentri-test.rescuemanager.eu` (ambiente TEST/DEMO)
- **Autenticazione:** Token JWT
- **API REST:** Chiamate HTTP alle API RENTRI

---

## 🔄 Passaggio da Demo a Produzione

### **1. Verificare URL Produzione**

**Dal codice attuale:**
```typescript
// website/src/lib/rentri/client.ts
const DEFAULT_BASE_URL =
  process.env.RENTRI_GATEWAY_URL?.trim() || 'https://rentri-test.rescuemanager.eu';
```

**URL Produzione RENTRI:**
- ⏳ Verificare qual è l'URL di produzione (non `rentri-test`)
- Probabilmente: `https://rentri.rescuemanager.eu` o simile
- Oppure: URL diretto RENTRI (da verificare con ACI/MIT)

---

### **2. Configurare Variabili Ambiente**

**Per passare in produzione, modificare:**

**File `.env` o configurazione Vercel:**
```bash
# Ambiente DEMO (attuale)
RENTRI_GATEWAY_URL=https://rentri-test.rescuemanager.eu

# Ambiente PRODUZIONE (da configurare)
RENTRI_GATEWAY_URL=https://rentri.rescuemanager.eu
# O URL diretto RENTRI produzione
```

---

### **3. Verificare Credenziali Produzione**

**RENTRI richiede:**
- ✅ Token JWT per autenticazione
- ✅ Certificati client (se necessario)
- ✅ Credenziali API (se necessario)

**Da verificare:**
- ⏳ Hai già le credenziali di produzione?
- ⏳ Le credenziali demo funzionano anche in produzione?
- ⏳ Serve richiedere nuove credenziali per produzione?

---

### **4. Verificare Certificati**

**RENTRI può richiedere:**
- Certificati client per autenticazione
- Certificati per firma digitale FIR

**Da verificare:**
- ⏳ I certificati demo funzionano in produzione?
- ⏳ Serve richiedere certificati produzione?
- ⏳ Come si ottengono certificati produzione?

---

## 📝 Processo Passaggio Produzione

### **Opzione 1: Solo Cambio URL (Più Semplice)**

**Se RENTRI permette di usare lo stesso sistema:**
1. ✅ Modificare `RENTRI_GATEWAY_URL` da test a produzione
2. ✅ Verificare che le credenziali demo funzionino anche in produzione
3. ✅ Testare una chiamata API in produzione
4. ✅ Se funziona → completato!

---

### **Opzione 2: Richiedere Credenziali Produzione**

**Se servono credenziali separate:**
1. ⏳ Contattare ACI/MIT per richiedere credenziali produzione
2. ⏳ Ottenere:
   - Token JWT produzione
   - Certificati produzione (se necessario)
   - URL gateway produzione
3. ⏳ Configurare sistema con credenziali produzione
4. ⏳ Testare in produzione

---

## 🔍 Verifiche Necessarie

### **1. URL Produzione**
- ⏳ Qual è l'URL gateway RENTRI produzione?
- ⏳ È diverso da `rentri-test.rescuemanager.eu`?

### **2. Credenziali**
- ⏳ Le credenziali demo funzionano in produzione?
- ⏳ Serve richiedere credenziali produzione?

### **3. Certificati**
- ⏳ I certificati demo sono validi per produzione?
- ⏳ Serve richiedere certificati produzione?

### **4. API**
- ⏳ Le API produzione sono le stesse di demo?
- ⏳ Ci sono differenze nell'uso?

---

## 💡 Raccomandazione

### **Per RENTRI (vs SDI):**

**RENTRI è diverso da SDI:**
- ✅ RENTRI usa API REST (non SFTP)
- ✅ RENTRI non richiede "attivazione" come SDI
- ✅ RENTRI probabilmente richiede solo cambio URL/credenziali
- ✅ Il passaggio è più semplice (solo configurazione)

**Prossimi Passi:**
1. ⏳ Verificare URL produzione RENTRI
2. ⏳ Verificare se servono credenziali produzione
3. ⏳ Modificare configurazione URL
4. ⏳ Testare in produzione

---

## 📋 Checklist Passaggio Produzione

### **Prima di Passare in Produzione:**

- [ ] Verificare URL gateway produzione
- [ ] Verificare credenziali produzione
- [ ] Verificare certificati produzione
- [ ] Modificare configurazione ambiente
- [ ] Testare chiamata API produzione
- [ ] Verificare autenticazione produzione
- [ ] Testare invio FIR in produzione
- [ ] Monitorare errori produzione

---

**Status:** ⏳ Verificare URL e credenziali produzione RENTRI
