# Struttura Finale Implementazione RVFU

## ✅ COMPLETATO

1. **Tipi TypeScript completi** (`src/lib/rvfu-types.ts`)
   - ✅ `VFUCreateAsConcessionario`
   - ✅ `SoggettoVFUCreate`
   - ✅ `DistintaVFUCreate`
   - ✅ Tutti i tipi necessari aggiunti

2. **Migration Database** (`supabase/migrations/20250115000000_rvfu_integration.sql`)
   - ✅ Tabelle `rvfu_subjects` (per intestatario/detentore)
   - ✅ Tabelle `rvfu_document_distincts` (per distinta documenti)
   - ✅ Colonne RVFU in `demolition_cases`

## 📋 PROSSIMI STEP

### 1. Creare funzione di mappatura
**File**: `src/lib/rvfu-mapper.ts`

Funzione che converte i dati del form in `VFUCreateAsConcessionario`:

```typescript
export function mapFormDataToVFUCreate(
  formData: DemolitionFormData,
  lookupData: LookupData
): VFUCreateAsConcessionario
```

### 2. Aggiornare DemolizioneRVFUForm
**File**: `src/pages/DemolizioneRVFUForm.jsx`

- Aggiornare struttura form per includere tutti i campi necessari
- Usare `meta` JSONB per salvare dati strutturati
- Salvare in `rvfu_subjects` e `rvfu_document_distincts` quando possibile

### 3. Aggiornare logica salvataggio
- Salvare dati in `meta` JSONB invece di colonne separate
- Salvare soggetti in `rvfu_subjects`
- Salvare distinta in `rvfu_document_distincts`

### 4. Aggiornare handleRVFUSync
**File**: `src/pages/DemolizioniRVFU.jsx`

- Usare `mapFormDataToVFUCreate` per costruire payload
- Chiamare API corretta con struttura giusta

## 🔄 STRUTTURA DATI CONSIGLIATA

### In `demolition_cases.meta`:
```json
{
  "rvfu": {
    "tipoVeicolo": "A",
    "flagConsegnaForzeOrdine": "N",
    "canaleNoPra": false,
    "cic": "",
    "noteAggiuntive": "",
    "notePartiRifiuti": ""
  }
}
```

### In `rvfu_subjects`:
- Record per INTESTATARIO
- Record per DETENTORE (se presente)
- Record per DETENTORE_RAPPRESENTANTE (se presente)

### In `rvfu_document_distincts`:
- Un record con tutti i flag della distinta

## 📝 NOTE

- Il form attuale `DemolizioneRVFUForm.jsx` salva campi che non esistono come colonne
- Bisogna migrare a salvare in `meta` JSONB o nelle tabelle dedicate
- Esiste già `RVFUForm.jsx` con struttura corretta - potrebbe essere usato come riferimento

