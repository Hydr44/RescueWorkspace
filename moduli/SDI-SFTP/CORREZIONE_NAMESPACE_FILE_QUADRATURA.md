# 🔧 Correzione Namespace File di Quadratura

**Data:** 14 gennaio 2026  
**Errore:** "Invalid content was found starting with element 'IdentificativoNodo'. One of '{IdentificativoNodo}' is expected."

---

## 🔍 Problema Identificato

L'errore XSD indica che il parser non riconosce correttamente l'elemento `IdentificativoNodo` nel namespace.

**Causa:** Il file di esempio usa un prefisso namespace (`nomeapriacere:FileQuadraturaFTP`) mentre il nostro codice usava un namespace di default (`xmlns="..."`).

---

## ✅ Correzione Applicata

**Prima:**
```xml
<FileQuadraturaFTP xmlns="http://www.fatturapa.it/sdi/ftp/v2.0" versione="2.0">
```

**Dopo:**
```xml
<ns2:FileQuadraturaFTP xmlns:ns2="http://www.fatturapa.it/sdi/ftp/v2.0" versione="2.0">
```

Gli elementi figli ereditano il namespace dal parent (come nel file di esempio).

---

## 🎯 Prossimo Passo

Deploy sul VPS e test con nuovo formato.
