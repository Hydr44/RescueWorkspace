# 🔍 Debug ZIP Plain - Analisi Struttura

**Data:** 13 gennaio 2026  
**Obiettivo:** Analizzare struttura ZIP prima della cifratura

---

## 📋 Modifica Implementata

Aggiunto salvataggio copia ZIP plain (prima di cifrare) per analisi:

```javascript
// DEBUG: Salva copia ZIP plain per analisi (prima di cifrare)
const debugDir = path.join(__dirname, 'debug');
if (!fs.existsSync(debugDir)) {
  fs.mkdirSync(debugDir, { recursive: true });
}
const debugZipPath = path.join(debugDir, `debug_${idNodoForFilename}_${Date.now()}.zip`);
fs.writeFileSync(debugZipPath, zipBuffer);
console.log(`[DEBUG] ZIP plain salvato per analisi: ${debugZipPath}`);
```

**Path file debug:** `/opt/sdi-sftp-server/debug/debug_{IdCodice}_{timestamp}.zip`

---

## 📦 Cosa Contiene il ZIP Plain

Il ZIP plain (prima di cifrare) contiene:
- File XML firmati individualmente (PKCS#7 SignedData)
- Nome file: `IT{IdCodice}_{progressivo}.xml.p7m`
- Formato: `.xml.p7m` (PKCS#7 SignedData, CAdES-BES)

---

## 🔍 Come Analizzare il File

### 1. Scaricare File Debug
```bash
scp vps-sdi:/opt/sdi-sftp-server/debug/debug_*.zip ./
```

### 2. Aprire ZIP
```bash
unzip -l debug_02166430856_*.zip
unzip debug_02166430856_*.zip
```

### 3. Verificare Struttura
- Controllare nomi file interni
- Verificare formato file (`.xml.p7m`)
- Controllare contenuto file (se possibile)

### 4. Validare con Strumenti SDI
- Verificare con validator SDI (se disponibile)
- Confrontare con esempi SDI

---

## ✅ Cosa Verificare

1. **Nomi File Interni:**
   - Formato: `IT{IdCodice}_{progressivo}.xml.p7m`
   - IdCodice corretto
   - Progressivo corretto (max 5 caratteri alfanumerico)

2. **Formato File:**
   - Estensione `.xml.p7m` corretta?
   - File è PKCS#7 SignedData valido?

3. **Struttura ZIP:**
   - Un solo file XML dentro?
   - Altri file necessari?

4. **Conformità Standard:**
   - Conforme a FatturaPA?
   - Conforme a manuali SFTP?

---

## 📝 Prossimi Passi

1. ✅ Codice modificato per salvare ZIP plain
2. ⏳ Deploy su VPS
3. ⏳ Inviare nuovo file per generare ZIP debug
4. ⏳ Scaricare e analizzare ZIP debug
5. ⏳ Verificare struttura e conformità

---

## 🎯 Obiettivo

Capire se la struttura del ZIP è corretta prima della cifratura, per identificare il problema "File di Quadratura non presente".
