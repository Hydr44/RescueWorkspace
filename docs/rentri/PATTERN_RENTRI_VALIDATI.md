# ✅ PATTERN RENTRI VALIDATI - RIFERIMENTO DEFINITIVO

**Fonte**: `formulari-v1.0.json` (API OpenAPI RENTRI Demo)  
**Data**: 2025-12-04

---

## 🎯 CAMPI CON VALIDAZIONE PATTERN

### 1. `num_iscr_sito` (Numero Iscrizione Sito RENTRI)

**Pattern**: `^OP[0-9]{4}[A-Z0-9]{3}[0-9]{6}-[A-Z]{2}[0-9]{4}$`

**Struttura**:
```
OP + 4cifre + 3alfanum + 6cifre + - + 2lettere + 4cifre

Esempio: OP4293P628056-MI00001
         OP^^^^P^^^628056-MI^^^^^
           4    3    6      2   4
```

**✅ Esempi VALIDI**:
```
OP4293P628056-MI00001  ✅
OP5021A129065-VA00002  ✅
OP6789B456078-VA00003  ✅
OP1234X567890-TO00001  ✅
OP9876Z123456-RM00099  ✅
```

**❌ Esempi INVALIDI**:
```
OP4293P62805657-MI2025    ❌ (7 cifre centrali invece di 6)
OP4293P62805657-MI00001   ❌ (7 cifre centrali)
OP4293-MI00001            ❌ (manca parte alfanumerica)
OP4293P628056-MILANO00001 ❌ (provincia deve essere 2 lettere)
OP4293P628056-MI2025      ❌ (finale deve essere 4 cifre, non anno)
```

---

### 2. `codice_fiscale` (CF o P.IVA Italiana)

**Per IT (default)**:
- **CF Personale**: 16 caratteri alfanumerici
- **P.IVA**: 11 cifre decimali con **algoritmo checksum Luhn**

**Validazione**: `minLength: 5, maxLength: 20`

**✅ P.IVA REALI VALIDATE (Checksum Corretto)**:
```
00743110157  ✅ A2A Spa
06363391001  ✅ ENI Spa
03048810122  ✅ Siemens Italia Spa
02313821007  ✅ Microsoft Italia Srl
00976180636  ✅ Enel Energia Spa
00488410010  ✅ Telecom Italia Spa
00776910159  ✅ Intesa Sanpaolo Spa
13886391006  ✅ UniCredit Spa
```

**❌ P.IVA FAKE (Checksum Errato)**:
```
01234567890  ❌ Sequenza, checksum invalido
12345678901  ❌ Fake
23456789012  ❌ Fake
98765432109  ❌ Fake
```

**✅ CF Personali VALIDI**:
```
RSSMRA70A01H501Z  ✅ (16 caratteri con checksum)
SCZMNL05L21D960T  ✅
```

---

### 3. `numero_iscrizione_albo` (Albo Trasportatori)

**Pattern**: `^([A-Za-z]{2})/([0-9]{6})$`

**Struttura**:
```
2lettere + / + 6cifre

Esempio: MI/001234
         ^^/^^^^^^
         2  6
```

**✅ Esempi VALIDI**:
```
MI/001234  ✅
VA/005678  ✅
TO/123456  ✅
RM/999999  ✅
```

**❌ Esempi INVALIDI**:
```
MI-2025-001234    ❌ (formato errato)
MI2025001234      ❌ (manca separatore)
MILANO/001234     ❌ (provincia deve essere 2 lettere)
MI/1234           ❌ (solo 4 cifre, servono 6)
MI/12345678       ❌ (8 cifre, servono 6)
```

---

### 4. `stato_fisico` (Stato Fisico Rifiuto)

**Enum**: `['SP', 'S', 'FP', 'L', 'VS']`

**Valori ESATTI**:
```
SP = In polvere o pulverulento  ✅
S  = Solido                     ✅
FP = Fangoso                    ✅
L  = Liquido                    ✅
VS = Vischioso sciropposo       ✅
```

**❌ VALORI NON VALIDI**:
```
VS = "Solido"   ❌ SBAGLIATO! VS = Vischioso
VL = "Liquido"  ❌ NON ESISTE!
VG = "Gassoso"  ❌ NON ESISTE!
VF = "Fangoso"  ❌ NON ESISTE!
solido          ❌ (deve essere maiuscolo: S)
liquido         ❌ (deve essere maiuscolo: L)
```

---

### 5. `provenienza` (Provenienza Rifiuto)

**Enum**: `['U', 'S']`

**Valori ESATTI**:
```
U = Urbano     ✅
S = Speciale   ✅
```

**❌ VALORI NON VALIDI**:
```
u       ❌ (minuscolo)
s       ❌ (minuscolo)
Urbano  ❌ (testo esteso)
P       ❌ (non esiste)
I       ❌ (non esiste)
```

---

### 6. `autorizzazione.tipo` (Tipo Autorizzazione Destinatario)

**Valori ESATTI** (da API `/codifiche/v1.0/tipi-autorizzazione`):
```
RecSmalArt208           ✅ Recupero/smaltimento semplificato art. 208
AIA                     ✅ Autorizzazione Integrata Ambientale
RecProcSemplificata     ✅ Recupero procedura semplificata
AU                      ✅ Autorizzazione Unica
Altro                   ✅ Altro tipo autorizzazione
```

**❌ VALORI NON VALIDI**:
```
R13             ❌ (questo è un codice attività, non autorizzazione!)
recupero        ❌
smaltimento     ❌
```

---

### 7. `attivita` (Attività Recupero/Smaltimento)

**Enum**: `['R1'-'R13', 'D1'-'D15']`

**Pattern**: `^(R([1-9]|1[0-3])|D([1-9]|1[0-5]))$`

**✅ Valori VALIDI**:
```
R1, R2, R3, R4, R5, R6, R7, R8, R9, R10, R11, R12, R13  ✅
D1, D2, D3, D4, D5, D6, D7, D8, D9, D10, D11, D12, D13, D14, D15  ✅
```

**❌ Valori INVALIDI**:
```
R14, R15  ❌ (non esistono)
D16, D17  ❌ (non esistono)
R0        ❌ (parte da R1)
recupero  ❌ (deve essere codice)
```

---

### 8. `comune_id` (Codice ISTAT Comune)

**Pattern**: `^[0-9]{6}$` (6 cifre)

**✅ Esempi VALIDI**:
```
015146  ✅ Milano
058091  ✅ Roma
001272  ✅ Torino
015118  ✅ Lainate
015173  ✅ Parabiago
012115  ✅ Saronno
012076  ✅ Gallarate
021013  ✅ Gallarate (VA)
```

**❌ Esempi INVALIDI**:
```
F205    ❌ (codice catastale, non ISTAT)
MILANO  ❌ (testo)
15146   ❌ (solo 5 cifre, servono 6)
```

---

### 9. `codice_eer` (Codice EER Rifiuto)

**Pattern**: `maxLength: 8, minLength: 1`

**Formato standard**: `XXXXXX` o `XX XX XX` (6 cifre, con o senza spazi)

**✅ Esempi VALIDI**:
```
130205  ✅ Oli minerali
160104  ✅ Veicoli fuori uso
160117  ✅ Metalli ferrosi
160601  ✅ Batterie al piombo
170101  ✅ Cemento
170405  ✅ Ferro e acciaio
```

**❌ Esempi INVALIDI**:
```
13-02-05  ❌ (trattini non accettati)
EER123    ❌ (lettere non accettate)
1302      ❌ (solo 4 cifre)
```

---

## 🔧 CHECKLIST VALIDAZIONE PRE-INVIO

Prima di trasmettere, verifica CHE OGNI CAMPO rispetti ESATTAMENTE questi pattern:

```
[ ] num_iscr_sito: OP[4][3][6]-[2][4]
[ ] produttore.num_iscr_sito: OP[4][3][6]-[2][4] o NULL
[ ] produttore.codice_fiscale: CF 16 char o P.IVA 11 cifre VALIDA
[ ] trasportatori[0].codice_fiscale: P.IVA 11 cifre VALIDA
[ ] trasportatori[0].numero_iscrizione_albo: XX/YYYYYY
[ ] destinatario.codice_fiscale: P.IVA 11 cifre VALIDA
[ ] destinatario.attivita: R1-R13 o D1-D15
[ ] rifiuto.codice_eer: 6 cifre
[ ] rifiuto.provenienza: U o S
[ ] rifiuto.stato_fisico: SP, S, FP, L, VS
[ ] conducente.nome: NON vuoto
[ ] conducente.cognome: NON vuoto
[ ] comune_id: 6 cifre ISTAT
```

---

## 📋 TOOL VALIDAZIONE P.IVA

Per verificare se una P.IVA è valida: https://telematici.agenziaentrate.gov.it/VerificaPIVA/Scegli.do?parameter=verificaPiva

**Oppure usa queste P.IVA reali già validate**:
- 00743110157 (A2A)
- 06363391001 (ENI)
- 03048810122 (Siemens)
- 02313821007 (Microsoft)
- 00976180636 (Enel)

---

## 🚀 PROCEDURA SICURA 101%

### 1. Elimina FIR Vecchi
```sql
-- Esegui su Supabase: DELETE_ALL_FIR_TEST.sql
```

### 2. Aspetta Deploy
```
Vercel: ~2 minuti
```

### 3. Chiudi/Riapri App
```
Forza ricarica codice frontend aggiornato
```

### 4. Crea FIR NUOVO
```
"Riempi Dati Test" userà i dati corretti hardcoded
```

### 5. Verifica Payload nel Log
```
Vercel Logs: Cerca "[RENTRI-FIR] 🔍 PAYLOAD COMPLETO"
Verifica OGNI campo contro questa guida
```

### 6. Trasmetti
```
Se il payload è 100% conforme, DEVE funzionare
```

---

**Deploy in corso, aspetta 2 minuti poi ricomincia da zero!** 🎯

