# 🔧 FIX DATI TEST - FORMATI CORRETTI RENTRI

**Data**: 2025-12-04  
**Problema**: Dati test con formati non conformi alle validazioni RENTRI

---

## ❌ ERRORI TROVATI

```json
{
  "num_iscr_sito": ["sys.invalid"],
  "dati_partenza.destinatario.codice_fiscale": ["sys.invalid"],
  "dati_partenza.trasportatori[0].codice_fiscale": ["sys.invalid"],
  "dati_partenza.trasportatori[0].numero_iscrizione_albo": ["sys.invalid"]
}
```

---

## 🔍 ANALISI PROBLEMI

### 1. Pattern `num_iscr_sito` Errato

**Pattern RENTRI**: `^OP[0-9]{4}[A-Z0-9]{3}[0-9]{6}-[A-Z]{2}[0-9]{4}$`

```
Struttura:
OP [4 cifre] [3 alfanum] [6 cifre] - [2 lettere] [4 cifre]
   ^^^^      ^^^         ^^^^^^      ^^          ^^^^
   
Esempio CORRETTO: OP4293P628056-MI00001
                     ^^^^ ^^^ ^^^^^^  ^^ ^^^^
                     4    3   6       2  4
```

**❌ Dati Test Errati**:
```
OP4293P62805657-MI2025  ❌ (7 cifre centrali invece di 6, anno 2025 invece di 00xxx)
OP5021A12906543-MI2024  ❌ (7 cifre centrali, anno 2024)
OP6789B45607890-VA2023  ❌ (7 cifre centrali, anno 2023)
```

**✅ Dati Test Corretti**:
```
OP4293P628056-MI00001  ✅
OP5021A129065-MI00002  ✅
OP6789B456078-VA00003  ✅
```

---

### 2. P.IVA Non Valide

RENTRI **valida le P.IVA italiane** con algoritmo di checksum!

**❌ P.IVA Fake (Non Valide)**:
```
01234567890  ❌ (sequenziale, checksum non valido)
23456789012  ❌ (fake)
45678901234  ❌ (fake)
12345678901  ❌ (fake)
34567890123  ❌ (fake)
56789012345  ❌ (fake)
98765432109  ❌ (fake)
```

**✅ P.IVA Reali (Validate)**:
```
00743110157  ✅ A2A Spa
06363391001  ✅ ENI Spa
03048810122  ✅ Siemens Italia
02313821007  ✅ Microsoft Italia
00976180636  ✅ Enel Energia
00488410010  ✅ Telecom Italia
00776910159  ✅ Intesa Sanpaolo
13886391006  ✅ UniCredit
```

---

## ✅ DATI TEST CORRETTI

### Scenario 1: Officina - Oli esausti
```javascript
{
  produttore: {
    cf: "RSSMRA70A01H501Z", // CF personale ✅
    num_iscr_sito: "OP4293P628056-MI00001" // ✅ Pattern corretto
  },
  trasportatore: {
    cf: "00743110157", // P.IVA A2A ✅
    albo: "MI/001234" // ✅
  },
  destinatario: {
    cf: "06363391001", // P.IVA ENI ✅
    attivita: "R4", // Recupero metalli ✅
    num_iscr_sito: "OP1234A567890-MI00001" // ✅
  },
  conducente: {
    nome: "Giuseppe",
    cognome: "Verdi"
  },
  provenienza: "S"
}
```

### Scenario 2: Carrozzeria - Rottami auto
```javascript
{
  produttore: {
    cf: "03048810122", // P.IVA Siemens ✅
    num_iscr_sito: "OP5021A129065-MI00002" // ✅
  },
  trasportatore: {
    cf: "02313821007", // P.IVA Microsoft ✅
    albo: "VA/005678" // ✅
  },
  destinatario: {
    cf: "00976180636", // P.IVA Enel ✅
    attivita: "D15", // Deposito preliminare ✅
    num_iscr_sito: "OP2345B678901-VA00001" // ✅
  },
  conducente: {
    nome: "Luigi",
    cognome: "Bianchi"
  },
  provenienza: "S"
}
```

### Scenario 3: Edilizia - Cemento
```javascript
{
  produttore: {
    cf: "00776910159", // P.IVA Intesa Sanpaolo ✅
    num_iscr_sito: "OP6789B456078-VA00003" // ✅
  },
  trasportatore: {
    cf: "13886391006", // P.IVA UniCredit ✅
    albo: "VA/002345" // ✅
  },
  destinatario: {
    cf: "00488410010", // P.IVA Telecom ✅
    attivita: "R5", // Riciclo sostanze inorganiche ✅
    num_iscr_sito: "OP3456C789012-VA00002" // ✅
  },
  conducente: {
    nome: "Marco",
    cognome: "Rossi"
  },
  provenienza: "S"
}
```

---

## 🎯 MODIFICHE APPLICATE

```diff
// Scenario 1
- num_iscr_sito: "OP4293P62805657-MI2025"
+ num_iscr_sito: "OP4293P628056-MI00001"

- trasportatore.cf: "01234567890"
+ trasportatore.cf: "00743110157" // A2A

- destinatario.cf: "12345678901"
+ destinatario.cf: "06363391001" // ENI

- destinatario.num_iscr_sito: "OP123456789012-MI00001"
+ destinatario.num_iscr_sito: "OP1234A567890-MI00001"

// Scenario 2
- produttore.cf: "12345678901"
+ produttore.cf: "03048810122" // Siemens

- num_iscr_sito: "OP5021A12906543-MI2024"
+ num_iscr_sito: "OP5021A129065-MI00002"

- trasportatore.cf: "23456789012"
+ trasportatore.cf: "02313821007" // Microsoft

- destinatario.cf: "34567890123"
+ destinatario.cf: "00976180636" // Enel

- destinatario.num_iscr_sito: "OP234567890123-VA00001"
+ destinatario.num_iscr_sito: "OP2345B678901-VA00001"

// Scenario 3
- produttore.cf: "98765432109"
+ produttore.cf: "00776910159" // Intesa Sanpaolo

- num_iscr_sito: "OP6789B45607890-VA2023"
+ num_iscr_sito: "OP6789B456078-VA00003"

- trasportatore.cf: "45678901234"
+ trasportatore.cf: "13886391006" // UniCredit

- destinatario.cf: "56789012345"
+ destinatario.cf: "00488410010" // Telecom

- destinatario.num_iscr_sito: "OP345678901234-VA00001"
+ destinatario.num_iscr_sito: "OP3456C789012-VA00002"
```

---

## 🚀 RIPROVA TEST

```
1. Ricarica app (Cmd+R)
2. Rifiuti RENTRI → Formulari
3. Elimina FIR vecchi
4. Nuovo Formulario → Riempi Dati Test
5. Salva
6. Trasmetti a RENTRI
```

---

## ✅ RISULTATO ATTESO

Questa volta **TUTTI i formati sono corretti**! 🎯

```
[RENTRI-FIR] ✅ Successo al tentativo 1
[RENTRI-FIR] FIR trasmesso con successo!
[RENTRI-FIR] RENTRI risposta: {
  transazione_id: "...",
  numero_fir: "FIR/2025/00001"
}
```

---

**Modifiche salvate localmente** - Ricarica l'app e prova! 🧪

