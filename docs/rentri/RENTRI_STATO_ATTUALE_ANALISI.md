# RENTRI - Analisi Stato Attuale e Piano Lavoro

**Data**: 4 Gennaio 2025  
**Obiettivo**: Completare integrazione RENTRI - collegare tutti gli endpoint frontend/backend

---

## 📊 Stato Attuale Implementazione

### ✅ **Backend (Next.js API Routes)**

#### Implementati:
- ✅ `GET /api/rentri/status` - Status servizi
- ✅ `GET /api/rentri/codifiche` - Lookup codifiche
- ✅ `POST /api/rentri/registri/create` - Crea registro su RENTRI
- ✅ `GET /api/rentri/siti` - Lista siti operatore
- ✅ `GET /api/rentri/siti/autorizzazioni` - Autorizzazioni sito
- ✅ `POST /api/rentri/certificati/upload` - Upload certificato
- ✅ `POST /api/rentri/fir/trasmetti` - Trasmissione FIR
- ✅ `GET /api/rentri/fir/stato` - Stato FIR
- ✅ `POST /api/rentri/fir/firma` - Firma FIR
- ✅ `POST /api/rentri/fir/accettazione` - Accettazione FIR
- ✅ `POST /api/rentri/fir/annulla` - Annulla FIR
- ✅ `GET /api/rentri/fir/transazione-status` - Status transazione
- ✅ `GET /api/rentri/fir/transazione-result` - Risultato transazione
- ✅ `POST /api/rentri/fir/sync-stati` - Sincronizza stati FIR
- ✅ `POST /api/rentri/registri/sync` - Sincronizza registri
- ✅ `POST /api/rentri/registri/[id]/movimenti` - Gestione movimenti registro
- ✅ `POST /api/rentri/movimenti/sync` - Sincronizza movimenti
- ✅ `GET /api/rentri/registri/transazioni/[id]/status` - Status transazione registro
- ✅ `GET /api/rentri/registri/transazioni/[id]/result` - Risultato transazione registro
- ✅ `GET /api/rentri/blocchi` - Blocchi RENTRI

#### Mancanti (da implementare):
- ❌ `GET /api/rentri/registri` - Lista registri (filtri)
- ❌ `GET /api/rentri/registri/[id]` - Dettaglio registro
- ❌ `PUT /api/rentri/registri/[id]` - Aggiorna registro
- ❌ `DELETE /api/rentri/registri/[id]` - Elimina registro
- ❌ `GET /api/rentri/registri/[id]/xml` - Download XML registro
- ❌ `GET /api/rentri/movimenti` - Lista movimenti (con filtri)
- ❌ `GET /api/rentri/movimenti/[id]` - Dettaglio movimento
- ❌ `PUT /api/rentri/movimenti/[id]` - Aggiorna movimento
- ❌ `DELETE /api/rentri/movimenti/[id]` - Elimina movimento
- ❌ `GET /api/rentri/formulari` - Lista formulari (con filtri)
- ❌ `GET /api/rentri/formulari/[id]` - Dettaglio formulario
- ❌ `PUT /api/rentri/formulari/[id]` - Aggiorna formulario
- ❌ `DELETE /api/rentri/formulari/[id]` - Elimina formulario
- ❌ `GET /api/rentri/formulari/[id]/pdf` - Download PDF formulario
- ❌ `GET /api/rentri/operatore` - Lista operatori
- ❌ `GET /api/rentri/operatore/[id]/siti` - Siti operatore (versione completa)

---

### ✅ **Frontend (Desktop App)**

#### Client API (`src/lib/rentri-api.js`):
- ✅ `fetchRegistri(filters)` - Lista registri
- ✅ `fetchRegistro(id)` - Dettaglio registro
- ✅ `createRegistro(data)` - Crea registro
- ✅ `updateRegistro(id, data)` - Aggiorna registro
- ✅ `deleteRegistro(id)` - Elimina registro
- ✅ `fetchMovimenti(registroId, filters)` - Movimenti registro
- ✅ `createMovimento(registroId, data)` - Crea movimento
- ✅ `updateMovimento(registroId, movimentoId, data)` - Aggiorna movimento
- ✅ `deleteMovimento(registroId, movimentoId)` - Elimina movimento
- ✅ `trasmettiMovimenti(registroId, movimentiIds)` - Trasmette movimenti
- ✅ `fetchFormulari(filters)` - Lista formulari
- ✅ `fetchFormulario(id)` - Dettaglio formulario
- ✅ `createFormulario(data)` - Crea formulario
- ✅ `updateFormulario(id, data)` - Aggiorna formulario
- ✅ `trasmettiFormulario(id)` - Trasmette formulario
- ✅ `downloadFormularioPDF(id)` - Download PDF
- ✅ `fetchCodifiche(tabella, params)` - Lookup codifiche
- ✅ `fetchCodiciEER(searchTerm)` - Codici EER
- ✅ `fetchUnitaMisura()` - Unità misura
- ✅ `fetchOperazioniAmmesse()` - Operazioni ammesse
- ✅ `checkRentriStatus(service)` - Status servizio
- ✅ `testConnessione()` - Test completo

**Problema**: Il client frontend chiama endpoint che NON esistono nel backend!
Ad esempio:
- `fetchRegistri()` → `/api/rentri/registri` (NON esiste)
- `fetchMovimenti()` → `/api/rentri/registri/[id]/movimenti` (esiste ma diverso)
- `fetchFormulari()` → `/api/rentri/formulari` (NON esiste)

---

## 🔍 Analisi Disallineamento

### 1. **Registri**
**Frontend chiama**: `/api/rentri/registri` (GET, POST, PUT, DELETE)  
**Backend implementato**: `/api/rentri/registri/create` (POST solo)

**Gap**: Mancano GET (lista), GET (dettaglio), PUT, DELETE

### 2. **Movimenti**
**Frontend chiama**: 
- `/api/rentri/registri/[id]/movimenti` (GET lista, POST crea)
- `/api/rentri/registri/[id]/movimenti/[id]` (PUT, DELETE)

**Backend implementato**: 
- `/api/rentri/registri/[id]/movimenti` (POST - sincronizza, non crea!)

**Gap**: Logica completamente diversa. Backend sincronizza, frontend vuole CRUD locale.

### 3. **Formulari**
**Frontend chiama**: `/api/rentri/formulari` (GET, POST, PUT, DELETE)  
**Backend implementato**: `/api/rentri/fir/trasmetti` (POST solo)

**Gap**: Frontend vuole CRUD completo, backend ha solo trasmissione.

---

## 📋 Piano Lavoro

### **Fase 1: Allineamento Registri** ⚡ Priorità ALTA

1. **Implementare endpoint GET lista registri**
   - `GET /api/rentri/registri` 
   - Query: anno, stato, tipo
   - Ritorna: lista da DB locale con filtri

2. **Implementare endpoint GET dettaglio**
   - `GET /api/rentri/registri/[id]`
   - Ritorna: registro da DB locale

3. **Implementare endpoint PUT aggiorna**
   - `PUT /api/rentri/registri/[id]`
   - Aggiorna DB locale, opzionalmente RENTRI

4. **Implementare endpoint DELETE**
   - `DELETE /api/rentri/registri/[id]`
   - Elimina da DB locale (se non sincronizzato)

5. **Modificare POST create**
   - Cambiare da `/api/rentri/registri/create` a `/api/rentri/registri`
   - Mantenere compatibilità vecchia route

### **Fase 2: Allineamento Movimenti** ⚡ Priorità ALTA

1. **Implementare CRUD movimenti**
   - `GET /api/rentri/registri/[id]/movimenti` - Lista movimenti
   - `POST /api/rentri/registri/[id]/movimenti` - Crea movimento (locale)
   - `PUT /api/rentri/registri/[id]/movimenti/[id]` - Aggiorna movimento
   - `DELETE /api/rentri/registri/[id]/movimenti/[id]` - Elimina movimento

2. **Separare sincronizzazione**
   - Mantenere `/api/rentri/movimenti/sync` per sincronizzazione RENTRI
   - CRUD gestisce solo DB locale

### **Fase 3: Allineamento Formulari** ⚡ Priorità ALTA

1. **Implementare CRUD formulari**
   - `GET /api/rentri/formulari` - Lista formulari
   - `POST /api/rentri/formulari` - Crea formulario (locale)
   - `GET /api/rentri/formulari/[id]` - Dettaglio formulario
   - `PUT /api/rentri/formulari/[id]` - Aggiorna formulario
   - `DELETE /api/rentri/formulari/[id]` - Elimina formulario

2. **Separare trasmissione**
   - Mantenere `/api/rentri/fir/trasmetti` per trasmissione RENTRI
   - CRUD gestisce solo DB locale

### **Fase 4: Endpoint Opzionali** ⚡ Priorità MEDIA

1. **Download XML Registro**
   - `GET /api/rentri/registri/[id]/xml`
   - Chiama RENTRI per scaricare XML

2. **Download PDF Formulario**
   - `GET /api/rentri/formulari/[id]/pdf`
   - Genera o scarica PDF

3. **Anagrafiche Operatore**
   - `GET /api/rentri/operatore` - Lista operatori
   - `GET /api/rentri/operatore/[id]/siti` - Siti operatore

---

## 🔧 Implementazione Tecnica

### **Pattern da Seguire**

#### 1. **CRUD Locale (DB)**
```typescript
// GET /api/rentri/registri
// Legge da Supabase rentri_registri
// Filtri: org_id, anno, stato, tipo

// POST /api/rentri/registri
// Crea in Supabase rentri_registri
// Non chiama RENTRI subito

// PUT /api/rentri/registri/[id]
// Aggiorna in Supabase rentri_registri
// Se ha rentri_id, può sincronizzare con RENTRI

// DELETE /api/rentri/registri/[id]
// Elimina da Supabase se sync_status !== 'synced'
```

#### 2. **Sincronizzazione RENTRI**
```typescript
// POST /api/rentri/registri/sync
// Prende registro locale, chiama RENTRI
// Aggiorna rentri_id e sync_status

// POST /api/rentri/movimenti/sync
// Prende movimenti locali, chiama RENTRI
// Aggiorna sync_status
```

#### 3. **Autenticazione**
- Usare JWT da `@/lib/rentri/jwt-dynamic`
- Recuperare certificato da `rentri_org_certificates`
- Verificare `org_id` e permessi utente

---

## 📚 Documentazione RENTRI da Consultare

### **File Disponibili**:
1. `/desktop-app/RENTRI-docs/API anagrafiche/` - Documentazione completa API
2. `/desktop-app/RENTRI-docs/_summaries/` - Riassunti e piani
3. Backend client: `/website/src/lib/rentri/client.ts` - Client RENTRI backend

### **Endpoint RENTRI Ufficiali**:
- Base URL: `https://rentri-test.rescuemanager.eu` (DEMO) o produzione
- Servizi:
  - `/anagrafiche/v1.0` - Anagrafiche operatori/siti
  - `/dati-registri/v1.0` - Gestione registri
  - `/formulari/v1.0` - Gestione FIR
  - `/codifiche/v1.0` - Tabelle codifiche
  - `/vidimazione-formulari/v1.0` - Vidimazione
  - `/ca-rentri/v1.0` - Firma remota

---

## ✅ Checklist Implementazione

### **Fase 1: Registri**
- [ ] `GET /api/rentri/registri` - Lista con filtri
- [ ] `GET /api/rentri/registri/[id]` - Dettaglio
- [ ] `PUT /api/rentri/registri/[id]` - Aggiorna
- [ ] `DELETE /api/rentri/registri/[id]` - Elimina
- [ ] Modificare POST esistente per compatibilità
- [ ] Test frontend con nuovi endpoint

### **Fase 2: Movimenti**
- [ ] `GET /api/rentri/registri/[id]/movimenti` - Lista
- [ ] `POST /api/rentri/registri/[id]/movimenti` - Crea (locale)
- [ ] `PUT /api/rentri/registri/[id]/movimenti/[id]` - Aggiorna
- [ ] `DELETE /api/rentri/registri/[id]/movimenti/[id]` - Elimina
- [ ] Separare sincronizzazione in endpoint dedicato
- [ ] Test frontend

### **Fase 3: Formulari**
- [ ] `GET /api/rentri/formulari` - Lista
- [ ] `POST /api/rentri/formulari` - Crea (locale)
- [ ] `GET /api/rentri/formulari/[id]` - Dettaglio
- [ ] `PUT /api/rentri/formulari/[id]` - Aggiorna
- [ ] `DELETE /api/rentri/formulari/[id]` - Elimina
- [ ] Test frontend

### **Fase 4: Test Completo**
- [ ] Test CRUD completo per ogni entità
- [ ] Test sincronizzazione RENTRI
- [ ] Test errori e edge cases
- [ ] Verifica conformità documentazione RENTRI

---

## 🚀 Prossimi Passi Immediati

1. **Implementare GET lista registri** (più semplice, buon punto di partenza)
2. **Testare con frontend esistente**
3. **Procedere con gli altri endpoint seguendo lo stesso pattern**

---

**Status**: 🔄 Analisi completata - Pronto per implementazione  
**Tempo stimato**: 6-8 ore per Fase 1-3 completa

