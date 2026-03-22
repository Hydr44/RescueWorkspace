# 🔧 Fix Stampa PDF FIR - Problema VPS

**Data**: 18 Gennaio 2025  
**Problema**: La stampa PDF del FIR non funziona correttamente (non restituisce il file giusto)

---

## 🔍 **Analisi Problema**

### **Endpoint VPS** (`/opt/rentri-api/routes/formulari.js`)

**Endpoint**: `GET /api/rentri/fir/pdf?fir_id={id}`

**Problema Identificato**:
- L'endpoint usa `pdfResponse.buffer()` che **non esiste in `node-fetch` v3**
- In `node-fetch` v3, il metodo corretto è `pdfResponse.arrayBuffer()` o `pdfResponse.text()`
- Questo causa un errore che impedisce di restituire il PDF corretto

---

## 🔧 **Fix Necessario**

### **Correggere Lettura Buffer PDF sulla VPS**

**File**: `/opt/rentri-api/routes/formulari.js`

**Problema**:
```javascript
const pdfBuffer = await pdfResponse.buffer(); // ❌ NON esiste in node-fetch v3
```

**Fix**:
```javascript
const pdfArrayBuffer = await pdfResponse.arrayBuffer(); // ✅ Metodo corretto
const pdfBuffer = Buffer.from(pdfArrayBuffer); // ✅ Converte a Buffer Node.js
```

---

## ✅ **Fix Completo**

### **1. Correggere Lettura PDF sulla VPS**

**File**: `/opt/rentri-api/routes/formulari.js`

**Modifiche**:
1. Cambiare `pdfResponse.buffer()` in `pdfResponse.arrayBuffer()`
2. Convertire `ArrayBuffer` in `Buffer` Node.js
3. Verificare Content-Type e headers corretti

**Codice Corretto**:
```javascript
if (!pdfResponse.ok) {
  return res.status(404).json({
    error: 'PDF non disponibile da RENTRI. Usa PDF locale come fallback.',
    details: `Status: ${pdfResponse.status}, Tentativi: identificativo, numero_fir, transazione_id`
  });
}

// ✅ FIX: Usa arrayBuffer() invece di buffer()
const pdfArrayBuffer = await pdfResponse.arrayBuffer();
const pdfBuffer = Buffer.from(pdfArrayBuffer);

res.setHeader('Content-Type', 'application/pdf');
res.setHeader('Content-Disposition', `attachment; filename="fir-${fir.rentri_numero || fir.numero_fir || 'rentri'}.pdf"`);
res.send(pdfBuffer);
```

---

## 📝 **Implementazione**

Devo correggere il file sulla VPS per usare il metodo corretto per leggere il PDF.

**Prossimi passi**:
1. ✅ Correggere `/opt/rentri-api/routes/formulari.js` sulla VPS
2. ✅ Testare endpoint PDF
3. ✅ Verificare che il PDF scaricato sia corretto

---

## 🎯 **Risultato Atteso**

Dopo il fix:
- ✅ L'endpoint `/api/rentri/fir/pdf` restituisce il PDF corretto
- ✅ Il PDF scaricato è quello ufficiale da RENTRI (se disponibile)
- ✅ Se non disponibile, fallback al PDF locale generato
