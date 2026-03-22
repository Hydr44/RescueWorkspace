# Analisi Flusso Creazione Demolizione RVFU

**Data**: 2025-01-XX  
**Scopo**: Analizzare il flusso attuale di creazione demolizione e confrontarlo con le specifiche ACI/MIT

---

## 📋 SOMMARIO

Questo documento analizza:
1. Il flusso attuale implementato nel form `DemolizioneRVFUForm.jsx`
2. La struttura dati salvata in Supabase (`demolition_cases`)
3. La struttura dati richiesta dalle API RVFU secondo le specifiche
4. Le discrepanze e cosa manca per completare l'implementazione

---

## 🔍 STATO ATTUALE

### 1. Form di Creazione (`DemolizioneRVFUForm.jsx`)

Il form attualmente raccoglie:

#### **Dati Veicolo**
- `targa` ✅
- `marca` ✅
- `modello` ✅
- `anno` ✅
- `colore` ⚠️ (non presente nelle API RVFU standard)
- `numero_telaio` ✅

#### **Dati Proprietario**
- `proprietario_nome` ⚠️ (dovrebbe essere separato nome/cognome)
- `proprietario_cf` ✅ (codice fiscale)
- `proprietario_indirizzo` ✅
- `proprietario_cap` ✅
- `proprietario_comune` ✅
- `proprietario_provincia` ✅
- `proprietario_telefono` ✅
- `proprietario_email` ✅

#### **Dati Demolizione**
- `demolizione_data` ✅
- `demolizione_causale` ✅ (codice causale)
- `demolizione_km` ⚠️ (chilometraggio - non standard RVFU)
- `demolizione_osservazioni` ✅ (note)

#### **Documenti**
- `rvfu_documenti` ✅ (array documenti)

---

### 2. Struttura Dati in Supabase

**Tabella: `demolition_cases`**

Campi principali:
- `id`, `org_id`, `created_at`, `updated_at`
- `targa`, `telaio`, `marca_modello`, `anno`
- `stato` ('bozza', 'documenti', 'inviata', 'completata', 'scartata')
- `meta` (JSONB) - contiene dati strutturati aggiuntivi
- `rvfu_id`, `rvfu_status`, `rvfu_sync_date` (per sincronizzazione)

**Problema attuale**: Il form salva direttamente campi come `proprietario_nome`, `demolizione_data`, ecc., ma questi **NON esistono come colonne separate** nella tabella. Dovrebbero essere salvati nel campo `meta` o in colonne dedicate che devono essere aggiunte.

---

### 3. Struttura Dati API RVFU (secondo specifiche)

Dalla documentazione OpenAPI e dai tipi TypeScript (`rvfu-types.ts`), per registrare un VFU serve:

#### **POST `/demolitori-aci-ws/rest/concessionario/VFU`** (o `/rest/cr/VFU`)

**Struttura richiesta (`VFUCreateAsConcessionario` o `VFUCreateAsCR`)**:

```typescript
{
  veicolo: {
    targa: string;           // ✅
    telaio: string;          // ✅
    marca: string;           // ✅
    modello: string;         // ✅
    cilindrata?: number;     // ⚠️ MANCA
    potenza?: number;        // ⚠️ MANCA
    dataPrimaImmatricolazione?: string; // ⚠️ MANCA (anno → data completa)
  };
  
  soggetti: Array<{          // ⚠️ STRUTTURA COMPLESSA
    tipo: 'INTESTATARIO' | 'DETENTORE' | 'DETENTORE_RAPPRESENTANTE';
    codiceFiscale: string;
    cognome?: string;        // ⚠️ MANCA (ora c'è solo "nome completo")
    nome?: string;           // ⚠️ MANCA (ora c'è solo "nome completo")
    ragioneSociale?: string; // ⚠️ MANCA (per aziende)
    dataNascita?: string;    // ⚠️ MANCA
    comuneNascita?: string;  // ⚠️ MANCA
    comuneResidenza: string; // ⚠️ MANCA (ora c'è solo "comune")
    provinciaResidenza: string; // ⚠️ MANCA (ora c'è solo "provincia")
    indirizzoResidenza: string; // ✅
    numeroCivico?: string;   // ⚠️ MANCA
    capResidenza: string;    // ✅
    tipoPersonaGiuridica?: 'PF' | 'PG'; // ⚠️ MANCA
  }>;
  
  causale: {                 // ⚠️ STRUTTURA DIVERSA
    codice: string;          // ✅ (demolizione_causale)
    descrizione?: string;
  };
  
  dataDemolizione: string;   // ✅ (demolizione_data)
  
  centroRaccolta?: {         // ⚠️ MANCA COMPLETAMENTE
    codice: string;
    nome: string;
    indirizzo: string;
  };
  
  note?: string;             // ✅ (demolizione_osservazioni)
  
  documenti?: Array<{        // ⚠️ STRUTTURA COMPLESSA
    tipo: string;
    nome: string;
    contenuto: string; // base64
    // ...
  }>;
}
```

---

## ⚠️ PROBLEMI IDENTIFICATI

### 1. **Struttura Proprietario Incompleta**
   - ❌ Il form ha solo "nome completo" invece di nome/cognome separati
   - ❌ Manca data di nascita
   - ❌ Manca comune di nascita
   - ❌ Manca numero civico
   - ❌ Manca gestione aziende (ragione sociale, P.IVA)
   - ❌ Manca tipo persona (fisica/giuridica)

### 2. **Dati Veicolo Incompleti**
   - ❌ Manca cilindrata
   - ❌ Manca potenza
   - ❌ Manca data prima immatricolazione (solo anno presente)

### 3. **Struttura Soggetti Multipla**
   - ⚠️ L'API RVFU prevede un **array di soggetti** (INTESTATARIO, DETENTORE, ecc.)
   - ⚠️ Attualmente il form gestisce solo il "proprietario" (INTESTATARIO)
   - ❌ Non c'è modo di specificare DETENTORE o altri soggetti

### 4. **Centro di Raccolta Mancante**
   - ❌ Non c'è campo per selezionare/inserire il centro di raccolta
   - ❌ Il centro di raccolta è obbligatorio per alcune operazioni

### 5. **Causale come Oggetto**
   - ⚠️ La causale dovrebbe essere un oggetto con `codice` e `descrizione`, non solo il codice

### 6. **Mappatura Campi Supabase**
   - ❌ I campi del form non corrispondono alle colonne della tabella
   - ⚠️ Dovrebbero essere salvati in `meta` JSONB o creare colonne dedicate

---

## ✅ COSA SERVE PER COMPLETARE

### 1. **Aggiornare il Form**
   - [ ] Separare nome/cognome del proprietario
   - [ ] Aggiungere data di nascita
   - [ ] Aggiungere comune di nascita
   - [ ] Aggiungere numero civico
   - [ ] Aggiungere gestione aziende (toggle persona fisica/giuridica)
   - [ ] Aggiungere cilindrata e potenza veicolo
   - [ ] Aggiungere data prima immatricolazione
   - [ ] Aggiungere selettore centro di raccolta
   - [ ] Gestire array soggetti (INTESTATARIO + eventuali DETENTORI)

### 2. **Aggiornare Schema Database**
   - [ ] Decidere se salvare in `meta` JSONB o creare colonne dedicate
   - [ ] Se colonne dedicate, creare migration per aggiungerle
   - [ ] Se `meta`, definire struttura JSON precisa

### 3. **Aggiornare Mappatura per API RVFU**
   - [ ] Creare funzione di mappatura da form → payload API RVFU
   - [ ] Gestire conversione anno → data prima immatricolazione
   - [ ] Costruire array soggetti correttamente
   - [ ] Gestire causale come oggetto

### 4. **Validazione**
   - [ ] Validare codice fiscale
   - [ ] Validare formato targa
   - [ ] Validare formato CAP
   - [ ] Validare codici ISTAT comuni/province
   - [ ] Validare causale (codice valido)

---

## 📚 RIFERIMENTI

- **Manuale**: `SpecificheWS-GestioneDemolitori1.24.pdf`
- **OpenAPI Spec**: `rvfu/RVFU.json` (se disponibile)
- **Documentazione HTML**: `rvfu/RVFU.html` (se disponibile)
- **Tipi TypeScript**: `src/lib/rvfu-types.ts`
- **Client API**: `src/lib/rvfu-client.ts`

---

## 🎯 PROSSIMI PASSI

1. Leggere il file HTML/JSON della documentazione OpenAPI per verificare la struttura esatta
2. Decidere struttura dati Supabase (meta JSONB vs colonne)
3. Aggiornare form con campi mancanti
4. Implementare mappatura form → API RVFU
5. Testare integrazione end-to-end

