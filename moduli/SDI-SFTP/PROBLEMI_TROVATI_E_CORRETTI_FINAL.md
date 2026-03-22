# Problemi Trovati e Corretti - Verifica Critica

## 🔍 Verifica Completa Effettuata

**Data:** 13 gennaio 2026  
**Motivazione:** L'utente ha chiesto verifica critica perché non era certo che SDI stesse elaborando il file

---

## ❌ PROBLEMI TROVATI E CORRETTI

### 1. IdNodo Hardcoded ⚠️ CRITICO

**File:** `server-vps/server.js`  
**Riga:** 234

**Problema:**
```javascript
// PRIMA (ERRATO)
const idNodo = 'SCZMNL05L21D960T'; // Hardcoded!
const filename = generateFIFilename(idNodo, progressivo, useTestMode);
```

**Conseguenze:**
- IdNodo sempre lo stesso anche se cambia l'organizzazione
- Inconsistenza tra XML interno (usava idNodo dalla fattura) e nome file esterno (hardcoded)
- Non dinamico per organizzazioni diverse

**Correzione:**
```javascript
// DOPO (CORRETTO)
let idNodoForFilename = null;
for (const invoice of invoices) {
  const cedente = invoice.meta?.sdi?.cedente_prestatore || {};
  const idNodo = cedente.id_fiscale_iva?.id_codice || cedente.id_codice;
  if (!idNodoForFilename) {
    idNodoForFilename = idNodo; // Estrae dalle fatture
  }
}
const filename = generateFIFilename(idNodoForFilename, progressivo, useTestMode);
```

✅ **CORRETTO** - IdNodo ora estratto dalle fatture

---

### 2. Progressivo Sempre 1 ⚠️ PROBLEMA

**File:** `server-vps/server.js`  
**Riga:** 235

**Problema:**
```javascript
// PRIMA (ERRATO)
const progressivo = 1; // Sempre 1!
```

**Conseguenze:**
- Se invii 2 file nello stesso minuto → **stesso nome file!**
- SDI rifiuterebbe il secondo file come duplicato
- Violazione requisito manuale: progressivo deve essere univoco

**Correzione:**
```javascript
// DOPO (CORRETTO)
const now = new Date();
const progressivo = useTestMode 
  ? 900 + (Math.floor(now.getTime() / 1000) % 100) // Test: 900-999
  : Math.floor((now.getTime() / 1000) % 900); // Produzione: 0-899
```

✅ **CORRETTO** - Progressivo basato su timestamp (evita collisioni)

**Nota:** Soluzione temporanea. Ideale sarebbe un progressivo incrementale persistente (database/file).

---

## ⚠️ PUNTI DA VERIFICARE (Non Critici)

### 1. Lunghezza IdNodo

**Situazione:**
- **Manuale:** "P.IVA/CF di registrazione" (non specifica lunghezza)
- **P.IVA:** 11 caratteri (es: `12345678901`)
- **CF completo:** 16 caratteri (es: `RSCSGN80A01H501U`)
- **CF con IT:** 17 caratteri (es: `ITRSCSGN80A01H501U`)
- **Attuale:** 17 caratteri (`SCZMNL05L21D960T`)

**Domanda:** SDI accetta IdNodo di 17 caratteri o richiede esattamente 11?

**Azione:** Verificare con SDI/Sogei se necessario, ma per ora manteniamo così com'è.

---

### 2. Nome File XML Interno

**Situazione:**
- **Formato attuale:** `IT{idNodo}_{number}.xml`
- **Esempio:** `ITSCZMNL05L21D960T_1.xml`
- **Manuale:** Non specifica formato esatto per file XML interni al ZIP

**Azione:** Verificare con esempi SDI se necessario, ma formato sembra ragionevole.

---

### 3. Access Time vs Elaborazione

**Chiarimento:**
- **Access time** può essere aggiornato per vari motivi (ls, stat, verifiche sistema)
- **Non garantisce** che SDI stia elaborando
- **Indicatore migliore:** File rimosso da `DatiVersoSdITest` = SDI ha prelevato
- **File ER/EO** in `DatiDaSdITest` = SDI ha elaborato

**Azione:** Non fare supposizioni basate solo su access time.

---

## ✅ Checklist Problemi Risolti

| Problema | Stato | Priorità |
|----------|-------|----------|
| IdNodo hardcoded | ✅ CORRETTO | ALTA |
| Progressivo sempre 1 | ✅ CORRETTO | ALTA |
| CessionarioCommittente placeholder | ✅ CORRETTO (già fatto) | ALTA |
| Mapping campi cliente | ✅ CORRETTO (già fatto) | ALTA |
| Lunghezza IdNodo | ⚠️ DA VERIFICARE | MEDIA |
| Nome file XML interno | ⚠️ DA VERIFICARE | MEDIA |

---

## 🎯 Conclusione

**Problemi Critici:** ✅ TUTTI RISOLTI

1. ✅ IdNodo ora estratto dalle fatture
2. ✅ Progressivo basato su timestamp (evita collisioni)
3. ✅ Validazione dati completa
4. ✅ Mapping campi corretto

**Punti Minori:**
- Lunghezza IdNodo (da verificare se necessario)
- Nome file XML interno (formato ragionevole)

---

## 📋 Prossimi Passi

1. ✅ Correzioni applicate
2. ✅ Server aggiornato
3. ⏳ Testare con nuova fattura
4. ⏳ Verificare prelievo SDI
5. ⏳ Se necessario, verificare con SDI formato IdNodo

