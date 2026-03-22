# 🔍 Analisi ZIP Debug

**Data:** Analisi file ZIP debug generato  
**Obiettivo:** Verificare struttura e contenuto del ZIP plain

---

## 📋 File Debug Generato

Quando viene inviato un file, viene generato automaticamente:
- **Path:** `/opt/sdi-sftp-server/debug/debug_{IdCodice}_{timestamp}.zip`
- **Contenuto:** ZIP plain (non cifrato) con file XML firmati

---

## 🔍 Analisi Struttura

### Contenuto ZIP

Il ZIP contiene:
- File XML firmati individualmente (PKCS#7 SignedData)
- Formato: `.xml.p7m`
- Nome: `IT{IdCodice}_{progressivo}.xml.p7m`

### Verifiche da Fare

1. **Struttura ZIP:**
   - Numero file dentro il ZIP
   - Nomi file corretti
   - Formato file (`.xml.p7m`)

2. **Conformità:**
   - Formato conforme a FatturaPA?
   - Nome file conforme a SDI?
   - Struttura corretta?

---

## 📝 Prossimi Passi

1. ✅ Verificare file debug generato
2. ⏳ Analizzare struttura ZIP
3. ⏳ Verificare contenuto file
4. ⏳ Confrontare con standard SDI
