# 📊 Monitoraggio Test Approccio 2

**Data:** 13 gennaio 2026  
**Approccio:** Firma XML Individuale → ZIP → Cifra ZIP  
**Stato:** 🟡 IN MONITORAGGIO

---

## 🧪 Test Approccio 2

### Modifiche Implementate
- ✅ Firma XML individuale (PKCS#7 SignedData, CAdES-BES)
- ✅ Estensione file: `.xml.p7m`
- ✅ ZIP con XML firmati
- ✅ Cifratura ZIP (senza firma ZIP)

### Conformità
- ✅ Conforme a manuale FatturaPA par. 2.2 caso c
- ✅ "Ogni singolo file in esso contenuto" viene firmato

---

## 📋 Timeline Monitoraggio

### Fase 1: Caricamento (IMMEDIATO)
- **Status:** ✅ File caricato su SFTP
- **Directory:** `/var/sftp/sdi/DatiVersoSdITest/`
- **Formato:** `FI.{idNodo}.{data}.{ora}.{progressivo}.zip`

### Fase 2: Prelevamento SDI (10-30 minuti)
- **Status:** 🟡 IN ATTESA
- **Tempo tipico:** 10-30 minuti dopo caricamento
- **Indicatore:** File scompare da `DatiVersoSdITest/`

### Fase 3: Elaborazione SDI (60-120 minuti)
- **Status:** 🟡 IN ATTESA
- **Tempo tipico:** 60-120 minuti dopo prelevamento
- **Indicatore:** File EO generato in `DatiDaSdITest/`

---

## ✅ Criteri di Successo

### Successo
- ✅ File prelevato da SDI entro 30 minuti
- ✅ File EO generato con esito positivo (ET01 o equivalente)
- ✅ Nessun errore "File di Quadratura non presente"

### Errore
- ❌ File non prelevato dopo 60 minuti
- ❌ File EO con esito negativo (ET02 o altri errori)
- ❌ Errore "File di Quadratura non presente" persistente

---

## 🔍 Verifiche da Fare

1. **Verifica prelevamento:** Controllare se file scompare da `DatiVersoSdITest/`
2. **Verifica file EO:** Controllare file EO in `DatiDaSdITest/`
3. **Analisi esito:** Leggere codice esito nel file EO
4. **Tempi:** Registrare tempi di prelevamento ed elaborazione

---

## 📝 Note

- Questo test verifica se l'approccio 2 (firma XML individuale) risolve l'errore
- Se funziona, conferma che il problema era nella firma del ZIP vs firma XML individuale
- Se non funziona, potrebbe essere necessario verificare altri aspetti (formato firma, algoritmi, ecc.)
