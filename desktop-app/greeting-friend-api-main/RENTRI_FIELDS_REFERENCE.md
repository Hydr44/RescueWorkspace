# 📋 RENTRI - Campi Obbligatori Reference

**Fonte**: Documentazione RENTRI API v1.0  
**Data**: 3 Dicembre 2025

---

## ✅ Terminologia Corretta

### EER vs CER

**✅ CORRETTO: EER** (European Waste List)
- EER = **E**uropean Waste List
- Codice a **6 cifre**: es. `170101`, `160104`
- Lista europea dei rifiuti

**❌ SBAGLIATO: CER** (vecchia terminologia italiana)
- CER = Catalogo Europeo Rifiuti (vecchio nome)
- Ora si chiama ufficialmente **EER**
- RENTRI usa **codice_eer** nelle API

**Conclusione**: Usiamo **EER** ovunque! ✅

---

## 📊 Campi Obbligatori per Movimento

### Riferimenti (OBBLIGATORI)
```javascript
{
  anno: 2025,                    // >= 1980, <= 2050
  progressivo: 1,                // >= 1, univoco per registro
  data_ora_registrazione: "2025-12-03T15:30:00Z"  // ISO 8601 UTC
}
```

### Causale Operazione (OBBLIGATORIA)
```javascript
causale_operazione: "PS"  // Codici: aT, TR, T*, PS, GI, M, etc.
```

**Codici principali**:
- `aT` = Accettazione Trasporto
- `TR` = Trasporto
- `T*` = Trasporto con asterisco
- `PS` = Produzione Scarico
- `GI` = Giacenza
- `M` = Materiali (non rifiuti)

### Rifiuto (OBBLIGATORIO se causale ≠ "M")
```javascript
{
  codice_eer: "170101",          // 6 cifre, da tabella EER
  descrizione_eer: "Cemento",    // OBBLIGATORIA se EER finisce con .99
  stato_fisico: "solido",        // OBBLIGATORIO: solido, liquido, gassoso, fangoso
  quantita: {
    valore: 1000.5000,           // Max 10 cifre intere + 4 decimali
    unita_misura: "kg"           // OBBLIGATORIO: kg, t, m3, l
  },
  destinato_attivita: "R3",      // OBBLIGATORIO: R1-R13, D1-D15
  provenienza: "01",             // Codice da tabella provenienza
  caratteristiche_pericolo: ["HP14", "HP15"]  // Array, per rifiuti pericolosi
}
```

### Integrazione FIR (se causale = aT, TR, T*, T*AT)
```javascript
{
  numero_fir: "FIR-2025-00042",
  data_inizio_trasporto: "2025-12-03T08:00:00Z",
  data_fine_trasporto: "2025-12-03T12:00:00Z",  // Solo per esito
  peso_verificato_destino: 980.5000,            // Solo per esito
  trasporto_transfrontaliero: false,
  tipo_trasporto_transfrontaliero: "I"          // Se transfrontaliero
}
```

### Veicolo Fuori Uso (se applicabile)
```javascript
{
  veicolo_fuori_uso: true,
  veicolo_fuori_uso_reg_pubblica_sicurezza: {
    numero: "VFU-2025-001",
    data: "2025-12-01"
  }
}
```

---

## 📊 Campi Obbligatori per Registro

### Dati Base
```javascript
{
  anno: 2025,
  tipo: "carico_scarico",  // o "carico", "scarico", "intermediazione", "commercio"
  numero_registro: "REG-2025-001",  // Opzionale, generato da RENTRI se vuoto
  unita_locale: {
    descrizione: "Sede principale",
    indirizzo: "Via Roma 123",
    comune: "Milano",
    provincia: "MI",
    cap: "20100"
  },
  autorizzazione: "AUT-MI-2025-001234"
}
```

---

## 📊 Campi Obbligatori per Formulario (FIR)

### Produttore
```javascript
{
  cf: "RSSMRA70A01H501Z",
  ragione_sociale: "Rossi Mario",
  indirizzo: "Via Roma 10, 20100 Milano (MI)",
  pec: "rossi@pec.it"  // Opzionale ma consigliato
}
```

### Trasportatore
```javascript
{
  cf: "12345678901",
  ragione_sociale: "Trasporti Bianchi Srl",
  albo: "MI-2025-001",
  targa: "AB123CD",
  rimorchio: "XY456ZW",  // Se presente
  pec: "bianchi@pec.it"
}
```

### Destinatario
```javascript
{
  cf: "98765432109",
  ragione_sociale: "Impianto Recupero Verdi Spa",
  indirizzo: "Via Industria 45, 20015 Parabiago (MI)",
  autorizzazione: "AUT-MI-2024-5678",
  pec: "verdi@pec.it"
}
```

### Rifiuti (Array)
```javascript
[
  {
    codice_eer: "170101",
    descrizione: "Cemento",
    quantita: 1000.5,
    unita_misura: "kg",
    stato_fisico: "solido",
    caratteristiche_pericolo: [],  // Array vuoto se non pericoloso
    numero_colli: 10,
    tipo_imballaggio: "Big Bag"
  }
]
```

---

## 🔍 Codifiche RENTRI Principali

### Stati Fisici
```
- solido
- liquido
- gassoso
- fangoso
```

### Unità Misura
```
- kg (chilogrammi) ← PRINCIPALE
- t (tonnellate)
- m3 (metri cubi)
- l (litri)
```

### Attività Recupero/Smaltimento
```
Recupero:
- R1, R2, R3, R4, R5, R6, R7, R8, R9, R10, R11, R12, R13

Smaltimento:
- D1, D2, D3, D4, D5, D6, D7, D8, D9, D10, D11, D12, D13, D14, D15
```

### Causali Operazione Comuni
```
- aT = Accettazione Trasporto
- TR = Trasporto
- T* = Trasporto con asterisco
- T*AT = Trasporto con asterisco + Accettazione
- PS = Produzione Scarico
- GI = Giacenza
- M = Materiali (non rifiuti)
```

### Provenienza
```
- 01 = Produzione
- 02 = Raccolta
- 03 = Trasporto
- 04 = Recupero
- 05 = Smaltimento
... (altre da API /codifiche/v1.0/provenienza)
```

---

## ⚠️ Validazioni RENTRI

### Codice EER
- ✅ Deve essere **6 cifre**
- ✅ Deve esistere nella Lista Europea Rifiuti
- ✅ Se finisce con `.99` → descrizione_eer OBBLIGATORIA
- ✅ API lookup: `/codifiche/v1.0/codici-eer`

### Quantità
- ✅ Valore: 0.0000 - 9999999999.9999
- ✅ Parte intera: max 10 cifre
- ✅ Parte decimale: max 4 cifre
- ✅ Unità misura da tabella codifiche

### Anno/Progressivo
- ✅ Anno: 1980 - 2050
- ✅ Progressivo: >= 1
- ✅ Coppia (anno, progressivo) UNIVOCA per registro
- ✅ Non devono esistere già in RENTRI

### Data/Ora Registrazione
- ✅ Formato ISO 8601 UTC
- ✅ Es: `2025-12-03T15:30:00Z`
- ✅ Può includere ora (opzionale ma consigliato)

---

## 🔧 Form da Aggiornare

### RifiutiMovimentoForm.jsx - Campi da Aggiungere

```javascript
// OBBLIGATORI per RENTRI
anno: currentYear,
progressivo: 1,  // Auto-increment
data_ora_registrazione: new Date().toISOString(),
causale_operazione: "PS",  // Dropdown con codifiche
stato_fisico: "solido",     // Dropdown
destinato_attivita: "R3",   // Dropdown
provenienza_codice: "01",   // Dropdown (opzionale)

// OPZIONALI ma importanti
caratteristiche_pericolo: [],  // Multi-select per rifiuti pericolosi
veicolo_fuori_uso: false,
annotazioni: "",  // Max 500 caratteri
```

### RifiutiFormularioForm.jsx - Campi da Aggiungere

```javascript
// PEC (opzionali ma consigliati)
produttore_pec: "",
trasportatore_pec: "",
destinatario_pec: "",

// Veicolo
trasportatore_rimorchio: "",

// Rifiuti
peso_totale_kg: 0,  // Somma automatica
numero_colli: 0,
tipo_imballaggio: "",

// Per ogni rifiuto in array
stato_fisico: "solido",
caratteristiche_pericolo: [],
```

---

## 📝 Note Implementazione

### Priorità Campi

**ALTA (Obbligatori RENTRI)**:
- ✅ anno, progressivo, data_ora_registrazione
- ✅ causale_operazione
- ✅ codice_eer (già presente)
- ✅ stato_fisico
- ✅ destinato_attivita
- ✅ quantita.valore, quantita.unita_misura

**MEDIA (Opzionali ma importanti)**:
- ⚠️ provenienza
- ⚠️ caratteristiche_pericolo (per pericolosi)
- ⚠️ annotazioni
- ⚠️ PEC (formulari)

**BASSA (Nice-to-have)**:
- ℹ️ veicolo_fuori_uso
- ℹ️ numero_colli
- ℹ️ tipo_imballaggio

---

## 🎯 Action Items

1. [ ] Applicare migration: `20251203_rentri_fix_fields.sql`
2. [ ] Aggiornare `RifiutiMovimentoForm.jsx` con campi obbligatori
3. [ ] Aggiornare `RifiutiFormularioForm.jsx` con campi mancanti
4. [ ] Aggiungere dropdown per codifiche (causale, stato fisico, attività)
5. [ ] Implementare auto-increment progressivo
6. [ ] Validazione codice EER con API RENTRI

---

**Riferimenti**:
- Documentazione: `RENTRI-project/demo-docs/md/registro-digitale.md`
- API Spec: `RENTRI-project/demo-docs/api/dati-registri-v1.0.json`
- Codifiche: `/codifiche/v1.0/*`

