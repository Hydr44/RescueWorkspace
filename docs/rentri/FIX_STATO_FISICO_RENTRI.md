# 🔧 FIX CRITICO: STATO FISICO RENTRI

**Data**: 2025-12-04  
**Problema**: Usavamo codici **COMPLETAMENTE SBAGLIATI** per `stato_fisico`

---

## ❌ ERRORE GRAVE TROVATO

```
'dati_partenza.rifiuto.stato_fisico': ['sys.invalid']
```

---

## 🔍 ANALISI

### ❌ Codici ERRATI (Quelli che usavamo)

```javascript
❌ VS - "Solido"    (SBAGLIATO! VS in RENTRI = "Vischioso sciropposo")
❌ VL - "Liquido"   (NON ESISTE in RENTRI!)
❌ VG - "Gassoso"   (NON ESISTE in RENTRI!)
❌ VF - "Fangoso"   (NON ESISTE in RENTRI!)
```

**Questi codici NON sono nel manuale RENTRI!** Erano stati inventati/dedotti erroneamente.

---

### ✅ Codici CORRETTI (Secondo API RENTRI Ufficiale)

```javascript
StatiFisici enum: {
  ✅ SP - In polvere o pulverulento
  ✅ S  - Solido
  ✅ FP - Fangoso
  ✅ L  - Liquido
  ✅ VS - Vischioso sciropposo
}
```

**Fonte**: `formulari-v1.0.json` → `StatiFisici` enum (righe 9304-9311)

---

## 🔧 CORREZIONI APPLICATE

### 1. Dropdown Form

**Prima**:
```jsx
❌ <option value="VS">VS - Solido</option>
❌ <option value="VL">VL - Liquido</option>
❌ <option value="VG">VG - Gassoso</option>
❌ <option value="VF">VF - Fangoso</option>
```

**Dopo**:
```jsx
✅ <option value="SP">SP - In polvere/pulverulento</option>
✅ <option value="S">S - Solido</option>
✅ <option value="FP">FP - Fangoso</option>
✅ <option value="L">L - Liquido</option>
✅ <option value="VS">VS - Vischioso/sciropposo</option>
```

---

### 2. Dati Test

**Scenario 1 - Officina (Oli)**:
```diff
- stato_fisico: "VL"  ❌ (non esiste!)
+ stato_fisico: "L"   ✅ (Liquido)

- stato_fisico: "VS"  ❌ (significato sbagliato!)
+ stato_fisico: "S"   ✅ (Solido)
```

**Scenario 2 - Carrozzeria (Rottami)**:
```diff
- stato_fisico: "VS"  ❌ (tutti)
+ stato_fisico: "S"   ✅ (Solido)
```

**Scenario 3 - Edilizia (Cemento)**:
```diff
- stato_fisico: "VS"  ❌
+ stato_fisico: "SP"  ✅ (In polvere - per cemento)

- stato_fisico: "VS"  ❌
+ stato_fisico: "S"   ✅ (Solido - per ferro)
```

---

### 3. Builder - Mapping Aggiornato

**Prima**:
```typescript
❌ function mapStatoFisicoToRENTRI(statoFisico: string): string {
  if (/^V[SLFG]$/.test(statoFisico)) return statoFisico; // SBAGLIATO!
  const mapping = {
    'solido': 'VS',   // ❌ VS NON significa Solido!
    'liquido': 'VL',  // ❌ VL non esiste!
    'gassoso': 'VG',  // ❌ VG non esiste!
    'fangoso': 'VF'   // ❌ VF non esiste!
  };
}
```

**Dopo**:
```typescript
✅ function mapStatoFisicoToRENTRI(statoFisico: string): string {
  // Verifica se già in formato RENTRI corretto
  if (['SP', 'S', 'FP', 'L', 'VS'].includes(statoFisico)) {
    return statoFisico;
  }
  // Mapping corretto
  const mapping = {
    'solido': 'S',         ✅
    'liquido': 'L',        ✅
    'fangoso': 'FP',       ✅
    'polvere': 'SP',       ✅
    'vischioso': 'VS'      ✅
  };
}
```

**Ma ora non serve più!** Il form usa direttamente i codici corretti.

---

## 📋 TABELLA CONVERSIONE

| Descrizione | Codice RENTRI | Usavamo (ERRATO) |
|-------------|---------------|------------------|
| Solido | `S` | `VS` ❌ |
| Liquido | `L` | `VL` ❌ |
| Fangoso | `FP` | `VF` ❌ |
| Polvere | `SP` | - |
| Vischioso | `VS` | - |
| Gassoso | **NON ESISTE** | `VG` ❌ |

---

## ✅ STATO ATTUALE

```
✅ Form: Dropdown aggiornato con codici corretti
✅ Builder: Usa valori direttamente dal form (no mapping)
✅ Dati Test: Tutti i 3 scenari corretti
✅ Validazione: Conforme a StatiFisici enum RENTRI
```

---

## 🧪 RIPROVA TEST

```
1. Aspetta deploy Vercel (~30 secondi)
2. Cmd+R (ricarica app)
3. Rifiuti RENTRI → Formulari
4. Elimina FIR vecchi
5. Nuovo Formulario → Riempi Dati Test
6. Verifica tab Rifiuti:
   ✅ Dropdown mostra: SP, S, FP, L, VS
   ✅ Default: S (Solido)
7. Salva
8. Trasmetti a RENTRI
9. ✅ DOVREBBE FUNZIONARE!
```

---

**Deploy pushato su Vercel** 🚀  
**Aspetta ~1 minuto poi testa!**

