# 🔍 Spiegazione Situazione Fattura 1539

**Data:** 14 gennaio 2026

---

## ❓ Domanda

**Il file verrà prelevato? Se OpenSSL non funziona, l'approccio può funzionare?**

---

## ✅ Risposta Breve

**SÌ, il file verrà prelevato da SDI**, ma potrebbe dare errore 00102 perché è stato firmato con **node-forge** (non OpenSSL).

---

## 📋 Situazione Dettagliata

### 1. File Inviato ✅

**File:** `FI.02166430856.2026014.1539.980.zip`  
**Stato:** Presente nella directory `/DatiVersoSdITest`  
**Dimensione:** 7.1 KB  
**Data invio:** 15:39:41

**Il file verrà prelevato da SDI** (circa 20-30 minuti dopo l'invio)

---

### 2. Problema OpenSSL ❌

**Errore OpenSSL:**
```
Error outputting keys and certificates
error:0308010C:digital envelope routines:inner_evp_generic_fetch:unsupported
Algorithm (RC2-40-CBC : 0)
```

**Causa:** OpenSSL 3.0 non supporta algoritmi legacy (RC2-40-CBC) anche con `-legacy`

**Risultato:** Il sistema ha fatto **fallback a node-forge**

---

### 3. Firma Applicata ⚠️

**Metodo usato:** **node-forge** (fallback)

**Problema:** node-forge potrebbe avere lo stesso problema dell'errore 00102:
- Attributi firmati potrebbero non essere ordinati correttamente
- Anche senza signingTime, l'ordine potrebbe essere sbagliato

**Rischio:** Il file potrebbe dare errore 00102 quando SDI lo processa

---

## 🔧 Soluzioni Possibili

### Opzione 1: Correggere OpenSSL (Consigliato)

**Problema:** OpenSSL 3.0 non supporta RC2-40-CBC anche con `-legacy`

**Soluzione:** Usare `-provider legacy` invece di `-legacy`:

```bash
openssl pkcs12 -in cert.p12 -out FIRMA.PEM -nodes -provider legacy -passin pass:password
```

**Oppure:** Convertire il certificato P12 in un formato compatibile con OpenSSL 3.0

---

### Opzione 2: Usare node-forge con correzioni

**Problema:** node-forge potrebbe non garantire l'ordine corretto degli attributi

**Soluzione:** Verificare se node-forge garantisce l'ordine o usare una libreria alternativa

---

### Opzione 3: Usare OpenSSL 1.1.1 (se disponibile)

**Problema:** OpenSSL 3.0 ha rimosso supporto per algoritmi legacy

**Soluzione:** Installare OpenSSL 1.1.1 (se possibile) o usare Docker con OpenSSL 1.1.1

---

## ⏳ Cosa Aspettarsi

### Scenario 1: File Prelevato e Processato
- ✅ File prelevato da SDI (circa 20-30 minuti)
- ⚠️ Possibile errore 00102 se node-forge non ordina correttamente gli attributi
- ⏳ File EO con esito ET02 (errore) o ET01 (successo)

### Scenario 2: File Prelevato e Scartato
- ✅ File prelevato da SDI
- ❌ File ER con codice errore 2 (verifica firma)
- ❌ Errore 00102 confermato

---

## 🎯 Raccomandazione

**Correggere OpenSSL** per usarlo come metodo principale:
1. Prova con `-provider legacy` invece di `-legacy`
2. Se non funziona, converti il certificato P12
3. Se ancora non funziona, usa OpenSSL 1.1.1

**Per ora:**
- ⏳ Attendere il risultato del test con node-forge
- ⏳ Se dà errore 00102, correggere OpenSSL immediatamente

---

**Status:** ⚠️ File inviato con node-forge (fallback) - Rischio errore 00102
