# ✅ Verifica Ricezione Notifiche di Scarto (ER)

**Data:** 14 gennaio 2026

---

## 📋 Cosa sono i File ER?

**ER** = Notifica di Scarto

Secondo il manuale SDI:
- **ER.&IdNodo.aaaaggg.hhmm.nnn.run** - Notifica di scarto, sempre in chiaro
- Prodotta dal sistema di acquisizione in caso di:
  - **Codice 1:** Errore nella fase di decifratura
  - **Codice 2:** Errore nella verifica firma del supporto

---

## ✅ Configurazione Server SFTP

**Secondo manuale:**
- **Directory:** `/DatiDaSdITest` (test) o `/DatiDaSdI` (produzione)
- **Permessi:** `put` e `rename` (Sogei può scrivere i file)
- **Formato:** File in chiaro (non cifrati)

**Status:** ✅ **Configurato correttamente!**

---

## 📊 File ER Ricevuti

Ho trovato **2 file ER** nella directory:

1. **ER.02166430856.2026013.1714.976.run**
   - Contenuto: `FI.02166430856.2026013.1714.976.zip;2`
   - Codice errore: **2** (Errore verifica firma)
   - File correlato: `FI.02166430856.2026013.1714.976.zip`

2. **ER.02166430856.2026013.1729.968.run**
   - Contenuto: `FI.02166430856.2026013.1729.968.zip;2`
   - Codice errore: **2** (Errore verifica firma)
   - File correlato: `FI.02166430856.2026013.1729.968.zip`

---

## 🔍 Analisi

**Entrambi i file ER hanno codice errore 2:**
- **Errore verifica firma del supporto**
- Questo conferma il problema dell'errore 00102 (Signed attributes non ordinati)

**I file sono stati ricevuti correttamente:**
- ✅ Server SFTP configurato correttamente
- ✅ Directory `/DatiDaSdITest` accessibile da Sogei
- ✅ Permessi corretti (put e rename)

---

## 🔧 Modifiche Applicate

**Aggiunto supporto per file ER nell'endpoint `/api/sdi-sftp/status`:**

```javascript
files_er: [
  {
    filename: "ER.02166430856.2026013.1714.976.run",
    error_code: 2,
    related_file: "FI.02166430856.2026013.1714.976.zip",
    error_description: "Errore verifica firma"
  }
]
```

**Ora il monitor mostra:**
- ✅ File in attesa (FI)
- ✅ File EO (esiti)
- ✅ File ER (notifiche di scarto) - **NUOVO!**

---

## 📋 Conclusione

**✅ Siamo configurati correttamente per ricevere le notifiche di scarto!**

- ✅ Server SFTP configurato
- ✅ Directory accessibile
- ✅ File ER ricevuti correttamente
- ✅ Endpoint aggiornato per monitorarli

**Il problema è confermato:**
- Codice errore 2 = Errore verifica firma
- Questo conferma l'errore 00102 (Signed attributes non ordinati)
- La soluzione con OpenSSL dovrebbe risolvere il problema

---

**Status:** ✅ Configurazione corretta - File ER monitorati
