# 📊 Status Fattura FI.02166430856.2026014.1539.980.zip

**Data verifica:** 14 gennaio 2026

---

## 📋 File Inviato

**Nome file:** `FI.02166430856.2026014.1539.980.zip`  
**Dimensione:** 7.1 KB  
**Data invio:** 14 gennaio 2026, 15:39:41

---

## ⏳ Stato Attuale

**Status:** ⏳ **In attesa di prelevamento da SDI**

- ✅ File presente nella directory `/DatiVersoSdITest`
- ⏳ File NON ancora prelevato da SDI
- ⏳ Nessun file EO (esito) ricevuto
- ⏳ Nessun file ER (notifica di scarto) ricevuto

---

## ⚠️ Problema OpenSSL

**Errore rilevato:**
```
Error outputting keys and certificates
error:0308010C:digital envelope routines:inner_evp_generic_fetch:unsupported
Algorithm (RC2-40-CBC : 0)
```

**Causa:** OpenSSL 3.0 non supporta algoritmi legacy senza l'opzione `-legacy`

**Soluzione applicata:** Fallback a node-forge (funzionante)

**Risultato:** Il file è stato firmato con node-forge invece di OpenSSL

---

## 📊 Tempi di Prelevamento

**Tempo medio di prelevamento SDI:** ~20-30 minuti

**File inviato alle:** 15:39  
**Tempo trascorso:** ~X minuti (da calcolare)

**Stato:** ⏳ In attesa di prelevamento (normale se < 30 minuti)

---

## 🔍 File Correlati

**File più recenti:**
- `FI.02166430856.2026014.1542.921.zip` - Inviato alle 15:42 (ancora in attesa)

**File EO più recenti:**
- `EO.02166430856.2026014.1045.958.xml.run` - Esito ET01 (successo) ✅
- `EO.02166430856.2026014.0014.945.xml.run` - Esito ET02 (errore) ❌

---

## ⏳ Prossimi Passi

1. ⏳ **Attendere prelevamento** (circa 20-30 minuti dall'invio)
2. ⏳ **Verificare file EO** quando disponibile
3. ⏳ **Correggere errore OpenSSL** per usare OpenSSL invece di fallback

---

**Status:** ⏳ File inviato correttamente, in attesa di prelevamento da SDI
