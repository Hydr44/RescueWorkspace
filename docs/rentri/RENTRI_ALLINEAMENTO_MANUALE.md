# RENTRI - Allineamento con Manuali Ufficiali

**Data**: 4 Gennaio 2025  
**Obiettivo**: Verificare e allineare l'implementazione con i manuali RENTRI ufficiali

---

## 📋 **ENDPOINT UFFICIALI RENTRI** (da manuali)

### **1. SERVIZIO ANAGRAFICHE** (`/anagrafiche/v1.0`)

#### **Gestione Registri**
- ✅ `POST /anagrafiche/v1.0/operatore/registri` - Apertura nuovo registro
- ✅ `GET /anagrafiche/v1.0/operatore/registri/{identificativo}` - Dati registro
- ✅ `PUT /anagrafiche/v1.0/operatore/registri/{identificativo}` - Modifica registro
- ✅ `DELETE /anagrafiche/v1.0/operatore/registri/{identificativo}` - Chiudi registro
- ⚠️ `GET /anagrafiche/v1.0/operatore/registri/{identificativo}/xml` - Vidimazione virtuale registro in formato XML
- ✅ `GET /anagrafiche/v1.0/operatore/{num_iscr}/siti/{num_iscr_sito}/registri` - Elenco registri

#### **Altri endpoint anagrafiche**
- `GET /anagrafiche/v1.0/operatore/{num_iscr}/siti` - Elenco siti
- `GET /anagrafiche/v1.0/operatore/{num_iscr}/siti/{num_iscr_sito}` - Dati sito
- `GET /anagrafiche/v1.0/operatore/{num_iscr}/siti/{num_iscr_sito}/autorizzazioni` - Autorizzazioni sito

---

### **2. SERVIZIO DATI-REGISTRI** (`/dati-registri/v1.0`)

#### **Trasmissione Movimenti**
- ✅ `POST /dati-registri/v1.0/operatore/{identificativo_registro}/movimenti` - Trasmette movimenti (asincrono, pattern NONBLOCK_PULL_REST)
  - Massimo 1000 movimenti per chiamata
  - Restituisce `transazione_id` (GUID)
  
#### **Stato ed Esito Transazione**
- ⚠️ `GET /dati-registri/v1.0/{transazione_id}/status` - Stato elaborazione transazione
- ⚠️ `GET /dati-registri/v1.0/{transazione_id}/result` - Esito elaborazione transazione

#### **Recupero Movimenti**
- ⚠️ `GET /dati-registri/v1.0/operatore/{identificativo_registro}/movimenti` - Recupera movimenti registro (con paginazione)
  - Header opzionali: `Paging-Page`, `Paging-PageSize` (max 100)

---

### **3. SERVIZIO FORMULARI** (`/formulari/v1.0`)

#### **Trasmissione FIR**
- ✅ `POST /formulari/v1.0/` - Trasmette FIR (asincrono)
  - Restituisce `transazione_id` (GUID)

#### **Stato ed Esito Transazione**
- ✅ `GET /formulari/v1.0/{transazione_id}/status` - Stato elaborazione transazione
- ✅ `GET /formulari/v1.0/{transazione_id}/result` - Esito elaborazione transazione

#### **Gestione FIR**
- `GET /formulari/v1.0/status` - Stato servizio
- Altri endpoint per gestione FIR (firma, accettazione, annullamento)

---

### **4. ALTRI SERVIZI**

#### **Codifiche**
- `GET /codifiche/v1.0/lookup` - Tabelle di codifica

#### **CA-RENTRI**
- `GET /ca-rentri/v1.0/status` - Stato servizio
- Gestione certificati dominio RENTRI

#### **Vidimazione Formulari**
- Endpoint per vidimazione virtuale FIR

---

## 🔍 **CONFRONTO: IMPLEMENTAZIONE vs MANUALI**

### ✅ **ENDPOINT IMPLEMENTATI CORRETTAMENTE**

#### **Registri (Anagrafiche)**
| Endpoint Implementato | Endpoint RENTRI Ufficiale | Status |
|----------------------|---------------------------|--------|
| `POST /api/rentri/registri/create` → `POST /anagrafiche/v1.0/registri` | `POST /anagrafiche/v1.0/operatore/registri` | ⚠️ **Path diverso** (`/registri` vs `/operatore/registri`) |
| `POST /api/rentri/registri/sync` → `GET /anagrafiche/v1.0/operatore/{num_iscr}/siti/{num_iscr_sito}/registri` | `GET /anagrafiche/v1.0/operatore/{num_iscr}/siti/{num_iscr_sito}/registri` | ✅ **Corretto** |

#### **Movimenti (dati-registri)**
| Endpoint Implementato | Endpoint RENTRI Ufficiale | Status |
|----------------------|---------------------------|--------|
| `POST /api/rentri/registri/[id]/movimenti` (backup: `route-sync-backup.ts`) → `POST /dati-registri/v1.0/operatore/{identificativo_registro}/movimenti` | `POST /dati-registri/v1.0/operatore/{identificativo_registro}/movimenti` | ✅ **Corretto** |

#### **Formulari**
| Endpoint Implementato | Endpoint RENTRI Ufficiale | Status |
|----------------------|---------------------------|--------|
| `POST /api/rentri/fir/trasmetti` → `POST /formulari/v1.0/` | `POST /formulari/v1.0/` | ✅ **Corretto** |
| `GET /api/rentri/fir/transazione-status/[id]` → `GET /formulari/v1.0/{transazione_id}/status` | `GET /formulari/v1.0/{transazione_id}/status` | ✅ **Corretto** |
| `GET /api/rentri/fir/transazione-result/[id]` → `GET /formulari/v1.0/{transazione_id}/result` | `GET /formulari/v1.0/{transazione_id}/result` | ✅ **Corretto** |

---

### ⚠️ **DISALLINEAMENTI TROVATI**

#### **1. Creazione Registro - Path Endpoint** ✅ **CORRETTO**
- **Implementato**: `POST /anagrafiche/v1.0/operatore/registri` (corretto)
- **Manuale**: `POST /anagrafiche/v1.0/operatore/registri`
- **Status**: ✅ **Corretto** - `/registri` è DEPRECATO secondo OpenAPI spec, ora usa `/operatore/registri`
- **Azione**: Completato

#### **2. Stato ed Esito Transazione Movimenti - ✅ IMPLEMENTATI**
- **Manuale richiede**:
  - `GET /dati-registri/v1.0/{transazione_id}/status`
  - `GET /dati-registri/v1.0/{transazione_id}/result`
- **Implementato**: ✅ Trovati endpoint:
  - `GET /api/rentri/registri/transazioni/[id]/status` → `GET /dati-registri/v1.0/{transazione_id}/status`
  - `GET /api/rentri/registri/transazioni/[id]/result` → `GET /dati-registri/v1.0/{transazione_id}/result`
- **Status**: ✅ **Corretti e allineati con manuali** (pattern NONBLOCK_PULL_REST)

#### **3. Recupero Movimenti da RENTRI - Mancante**
- **Manuale richiede**: `GET /dati-registri/v1.0/operatore/{identificativo_registro}/movimenti`
- **Implementato**: ❌ Non trovato endpoint per recuperare movimenti da RENTRI
- **Azione**: Implementare endpoint per sincronizzazione movimenti da RENTRI (se necessario)

#### **4. Vidimazione Registro XML - Mancante**
- **Manuale richiede**: `GET /anagrafiche/v1.0/operatore/registri/{identificativo}/xml`
- **Implementato**: ❌ Non trovato
- **Azione**: Implementare se necessario per export/vidimazione

---

### ✅ **PATTERN AUTENTICAZIONE E INTEGRITÀ**

#### **Autenticazione (ID_AUTH_REST_02)**
- ✅ JWT dinamico con certificato (implementato in `jwt-dynamic.ts`)
- ✅ Header `Authorization: Bearer {jwt}`
- ✅ Audience corretto (`rentrigov.demo.api` / `rentrigov.api`)

#### **Integrità Messaggio (INTEGRITY_REST_01)**
- ✅ Digest SHA-256 del body (header `Digest`)
- ✅ JWT per integrità (header `Agid-JWT-Signature`)
- ✅ Content-Type corretto (`application/json`)

---

### 📊 **PATTERN ASINCRONO (NONBLOCK_PULL_REST)**

#### **Movimenti**
- ✅ Implementato: POST restituisce `transazione_id`
- ⚠️ **Manca**: Polling per stato/esito transazione

#### **Formulari**
- ✅ Implementato: POST restituisce `transazione_id`
- ✅ Implementato: Polling per stato/esito transazione

---

## 🎯 **AZIONI DI ALLINEAMENTO**

### **PRIORITÀ ALTA** ✅ **COMPLETATE**

1. ✅ **Verificare path creazione registro** - **COMPLETATO**
   - Corretto path da `/registri` (DEPRECATO) a `/operatore/registri`
   - Path ora allineato con OpenAPI spec ufficiale

2. ✅ **Polling stato/esito movimenti** - **GIÀ IMPLEMENTATI**
   - `GET /api/rentri/registri/transazioni/[id]/status` → implementato
   - `GET /api/rentri/registri/transazioni/[id]/result` → implementato
   - Pattern NONBLOCK_PULL_REST corretto

### **PRIORITÀ MEDIA**

3. **Implementare recupero movimenti da RENTRI** (se necessario)
   - Creare `GET /api/rentri/registri/[id]/movimenti-sync` (da RENTRI)
   - Chiamare endpoint RENTRI: `/dati-registri/v1.0/operatore/{identificativo_registro}/movimenti`
   - Gestire paginazione (header `Paging-Page`, `Paging-PageSize`)

4. **Implementare vidimazione registro XML** (se necessario)
   - Creare `GET /api/rentri/registri/[id]/xml`
   - Chiamare endpoint RENTRI: `/anagrafiche/v1.0/operatore/registri/{identificativo}/xml`

### **PRIORITÀ BASSA**

5. **Verificare altri endpoint anagrafiche** (se necessario)
   - Lista siti
   - Dati sito
   - Autorizzazioni sito

---

## 📝 **NOTE TECNICHE**

### **Ambiente e URL Base**
- **Demo**: `https://demoapi.rentri.gov.it` o gateway `https://rentri-test.rescuemanager.eu`
- **Produzione**: `https://api.rentri.gov.it` o gateway `https://rentri-prod.rescuemanager.eu`

### **Limitazioni**
- **Movimenti**: Massimo 1000 movimenti per chiamata POST
- **Paginazione**: Max 100 risultati per pagina (header `Paging-PageSize`)

### **Modalità STUB**
- Fino al 13/02/2025: `/dati-registri/v1.0` in modalità STUB
- Fino al 13/02/2025: `/formulari/v1.0` parzialmente in STUB (solo alcuni endpoint)

---

## ✅ **VERIFICA PAYLOAD E STRUTTURA DATI**

### **1. Creazione Registro** ✅ **ALLINEATO**

**Schema OpenAPI richiede**:
```json
{
  "num_iscr_sito": "string (required, >= 1 chars)",
  "attivita": ["array[string] (required, >= 1 items)"],
    // Valori validi: CentroRaccolta, Produzione, Recupero, Smaltimento, Trasporto, IntermediazioneSenzaDetenzione
  "descrizione": "string or null (optional, <= 250 chars)",
  "attivita_rec_smalt": ["array[string] (optional)"]
    // OBBLIGATORIO se attivita contiene "Recupero" o "Smaltimento"
}
```

**Implementazione** (`create/route.ts`):
- ✅ `num_iscr_sito`: Corretto, preso da certificato
- ✅ `attivita`: Array corretto, valori validati
- ✅ `descrizione`: Opzionale, max 250 chars (preso da registro.numero_registro)
- ✅ `attivita_rec_smalt`: Gestito correttamente (recuperato da autorizzazioni se necessario)

**Status**: ✅ **Allineato con OpenAPI spec**

---

### **2. Trasmissione Movimenti** ✅ **ALLINEATO**

**Schema manuale richiede**:
```json
[{
  "riferimenti": {
    "numero_registrazione": { "anno": number, "progressivo": number },
    "data_ora_registrazione": "ISO 8601 UTC",
    "causale_operazione": "string (DT, NP, T*, RE, I, aT, M, TR, T*aT)"
  },
  "rifiuto": {
    "codice_eer": "string",
    "stato_fisico": "string (SP, S, FP, L, VS)",
    "quantita": { "valore": number, "unita_misura": "string" },
    "caratteristiche_pericolo": ["array[string]"] // SEMPRE presente, anche vuoto
  },
  "integrazione_fir": { "numero_fir": "string" }, // OBBLIGATORIO per causali aT, TR, T*, T*aT
  "numero_registrazione_rettifica": { "anno": number, "progressivo": number }, // Per rettifiche
  "numero_registrazione_annullata": { "anno": number, "progressivo": number }, // Per annullamenti
  "annotazioni": "string (max 500 chars)"
}]
```

**Implementazione** (`movimento-builder.ts`):
- ✅ `riferimenti`: Corretto con `numero_registrazione`, `data_ora_registrazione`, `causale_operazione`
- ✅ `rifiuto`: Corretto con `codice_eer`, `stato_fisico`, `quantita` (valore, unita_misura)
- ✅ `caratteristiche_pericolo`: Sempre presente come array (anche vuoto se non pericoloso)
- ✅ `integrazione_fir`: Gestito correttamente per causali aT, TR, T*, T*aT
- ✅ `annotazioni`: Max 500 caratteri (corretto)
- ⚠️ **Nota**: Rettifiche e annullamenti non ancora implementati (TODO in builder)

**Status**: ✅ **Allineato con manuali** (manca implementazione rettifiche/annullamenti, ma struttura corretta)

---

### **3. Trasmissione FIR (Formulari)** ✅ **ALLINEATO**

**Schema manuale richiede**:
```json
{
  "num_iscr_sito": "string",
  "dati_partenza": {
    "produttore": { "codice_fiscale": "string", "denominazione": "string", "indirizzo": {...}, "luogo_produzione": {...} },
    "destinatario": { "codice_fiscale": "string", "denominazione": "string", "indirizzo": {...}, "attivita": "string" },
    "trasportatori": [{ "codice_fiscale": "string", "denominazione": "string", "tipo_trasporto": "string" }],
    "rifiuto": { "codice_eer": "string", "provenienza": "string (U/S)", "caratteristiche_pericolo": [], "stato_fisico": "string", "quantita": {...} },
    "dati_trasporto_partenza": { "conducente": {...}, "targa_automezzo": "string", "data_ora_inizio_trasporto": "ISO 8601" }
  }
}
```

**Implementazione** (`fir-builder.ts`):
- ✅ `num_iscr_sito`: Corretto
- ✅ `dati_partenza`: Struttura corretta
- ✅ `produttore`, `destinatario`, `trasportatori`: Corretti
- ✅ `rifiuto`: Singolo (non array), con `provenienza` obbligatoria (U/S)
- ✅ `caratteristiche_pericolo`: Sempre presente come array (anche vuoto)
- ✅ `dati_trasporto_partenza`: Con `conducente` obbligatorio per trasporto terrestre

**Status**: ✅ **Allineato con manuali**

---

## ✅ **CHECKLIST ALLINEAMENTO**

- [x] Verificare path creazione registro (`/operatore/registri` vs `/registri`) - ✅ CORRETTO
- [x] Implementare polling stato transazione movimenti - ✅ GIÀ IMPLEMENTATO
- [x] Implementare polling esito transazione movimenti - ✅ GIÀ IMPLEMENTATO
- [x] Verificare tutti i payload secondo schema OpenAPI - ✅ VERIFICATO E ALLINEATO
- [ ] Testare endpoint esistenti con manuali
- [ ] Verificare paginazione movimenti (se implementata)
- [ ] Implementare recupero movimenti da RENTRI (se necessario)
- [ ] Implementare vidimazione registro XML (se necessario)
- [ ] Implementare rettifiche e annullamenti movimenti (opzionale)
- [ ] Verificare gestione errori secondo manuali

---

**Ultimo aggiornamento**: 4 Gennaio 2025

