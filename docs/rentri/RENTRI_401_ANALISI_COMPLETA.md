# RENTRI 401 - Analisi Completa Problema Polling

**Data**: 11 Gennaio 2026  
**Problema**: 401 durante polling transazione movimenti RENTRI

---

## 🔍 **ANALISI FLUSSO COMPLETO**

### **1. TRASMISSIONE MOVIMENTI** ✅ **FUNZIONA**

#### **Frontend → Backend:**
```javascript
// File: desktop-app/.../RifiutiMovimenti.jsx
const response = await fetch(`${apiUrl}/api/rentri/registri/${registroId}/movimenti`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    org_id: orgId,  // ← Passato nel body
    movimenti_ids: movimentoIds
  }),
});
```

#### **Backend - Ricerca Certificato:**
```typescript
// File: website/src/app/api/rentri/registri/[id]/movimenti/route.ts
const { data: registro } = await supabase
  .from("rentri_registri")
  .select("*")
  .eq("id", registroId)
  .single();

// Certificato cercato con:
// - org_id: registro.org_id  ← Da registro locale
// - environment: registro.environment || "demo"
// - is_active: true
// - is_default: true (ora opzionale dopo fix)
```

**Status**: ✅ Funziona - Certificato trovato, JWT generato, trasmissione OK

---

### **2. POLLING STATUS** ❌ **401 ERRORE**

#### **Frontend → Backend:**
```javascript
// File: desktop-app/.../RifiutiMovimenti.jsx
const statusResponse = await fetch(
  `${apiUrl}/api/rentri/registri/transazioni/${transazioneId}/status?org_id=${orgId}&environment=demo`,
  { method: 'GET' }
);
```

**Parametri passati**:
- `org_id`: `${orgId}` (dal contesto React)
- `environment`: `"demo"` (hardcoded)

#### **Backend - Ricerca Certificato:**
```typescript
// File: website/src/app/api/rentri/registri/transazioni/[id]/status/route.ts
const searchParams = request.nextUrl.searchParams;
const orgId = searchParams.get("org_id");
const environment = searchParams.get("environment") || "demo";

// Certificato cercato con:
// - org_id: orgId  ← Da query param
// - environment: environment  ← Da query param ("demo")
// - is_active: true
// - is_default: true (ora opzionale dopo fix)
```

**Status**: ❌ 401 - Certificato non trovato

---

## ⚠️ **DIFFERENZE TROVATE**

### **1. Fonte org_id**
- **Trasmissione**: `registro.org_id` (dal database, dal registro locale)
- **Polling**: `orgId` (dal query param, dal contesto React frontend)

### **2. Fonte environment**
- **Trasmissione**: `registro.environment || "demo"` (dal registro locale)
- **Polling**: `"demo"` (hardcoded nel frontend)

### **3. Possibili Problemi**

#### **A) org_id diverso**
- Il `orgId` dal frontend potrebbe essere diverso da `registro.org_id`
- Se il registro appartiene a un'organizzazione diversa, il certificato non viene trovato

#### **B) environment diverso**
- Il registro potrebbe avere `environment = "production"` ma il polling cerca `"demo"`
- Oppure viceversa

#### **C) Certificato non esiste per org_id/environment**
- Il certificato potrebbe esistere solo per l'org_id/environment del registro
- Ma non per l'org_id/environment passati nel polling

---

## 🔧 **SOLUZIONE PROPOSTA**

### **Opzione 1: Usare org_id/environment dal registro** ✅ **CONSIGLIATA**

Recuperare il registro dalla transazione (salvando `registro_id` nella transazione) e usare `registro.org_id` e `registro.environment` invece dei query params.

**Problema**: Le transazioni RENTRI non sono salvate localmente (solo `transazione_id` è disponibile).

### **Opzione 2: Salvare registro_id con la transazione** ✅ **MIGLIORE**

Quando si riceve `transazione_id` dalla trasmissione, salvare anche `registro_id` per poter recuperare org_id/environment corretti durante il polling.

**Problema**: Serve modificare la struttura dati o salvare transazioni temporaneamente.

### **Opzione 3: Passare registro_id nel polling** ✅ **PIÙ SEMPLICE**

Il frontend passa anche `registro_id` nel polling, il backend recupera il registro e usa `registro.org_id` e `registro.environment`.

**Vantaggi**:
- Modifica minima
- Garantisce coerenza (stesso org_id/environment della trasmissione)
- Non richiede salvare transazioni

---

## ✅ **IMPLEMENTAZIONE OPZIONE 3**

### **Frontend - Modifica polling:**
```javascript
// Passa anche registro_id
const statusResponse = await fetch(
  `${apiUrl}/api/rentri/registri/transazioni/${transazioneId}/status?org_id=${orgId}&registro_id=${registroId}&environment=demo`,
  { method: 'GET' }
);
```

### **Backend - Usa org_id/environment dal registro:**
```typescript
const registroId = searchParams.get("registro_id");

if (registroId) {
  // Recupera registro e usa org_id/environment dal registro
  const { data: registro } = await supabase
    .from("rentri_registri")
    .select("org_id, environment")
    .eq("id", registroId)
    .single();
  
  if (registro) {
    orgId = registro.org_id;
    environment = registro.environment || "demo";
  }
}
```

---

## 🎯 **PROSSIMI PASSI**

1. **Verificare org_id/environment usati**:
   - Controllare quale `orgId` viene passato dal frontend
   - Verificare quale `org_id` ha il registro nel database
   - Verificare quale `environment` ha il registro

2. **Implementare Opzione 3**:
   - Modificare frontend per passare `registro_id`
   - Modificare backend per usare `org_id/environment` dal registro

3. **Test**:
   - Trasmettere movimento
   - Verificare che il polling funzioni senza 401

---

## 📋 **CHECKLIST DEBUG**

Per capire esattamente cosa succede, servirebbero:

- [ ] Log completo dell'errore 401 (con org_id/environment usati)
- [ ] Verifica org_id del registro nel database
- [ ] Verifica environment del registro nel database
- [ ] Verifica org_id passato dal frontend nel polling
- [ ] Verifica se certificato esiste per org_id/environment del registro
- [ ] Verifica se certificato esiste per org_id/environment passati nel polling

---

**Nota**: La soluzione migliore è usare `org_id/environment` dal registro (Opzione 3), garantendo coerenza con la trasmissione.

