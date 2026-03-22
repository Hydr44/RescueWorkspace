# 📋 GUIDA CONFIGURAZIONE RENTRI - Per Nuovi Clienti

## 🎯 OBIETTIVO

Configurare l'integrazione RENTRI per permettere la trasmissione di Formulari Identificazione Rifiuti (FIR) direttamente dall'applicazione RescueManager.

**Tempo stimato**: 30-45 minuti

---

## ✅ PREREQUISITI

Prima di iniziare, il cliente deve avere:
- ✅ **SPID** o **CIE** (Carta Identità Elettronica) attivi
- ✅ **Codice Fiscale** operatore (persona fisica o P.IVA società)
- ✅ **PEC** aziendale attiva
- ✅ Dati sede legale completi (indirizzo, CAP, comune, provincia)

---

## 📋 FASE 1: ISCRIZIONE PORTALE RENTRI (20 minuti)

### 1️⃣ Accedi al Portale RENTRI

**URL**: https://portale.rentri.gov.it

- Clicca **"Seleziona Ambiente"** → **DEMO** (per test) o **PRODUZIONE**
- Clicca **"Accedi"**
- Login con **SPID** o **CIE**

---

### 2️⃣ Accreditamento Operatore

**Percorso**: Menu → **Area Operatori** → **Accreditamento operatori**

**Compila**:
```
CF Operatore: ABCDEF12G34H567I (o P.IVA 12345678901)
Denominazione: Nome Azienda Srl
Sede Legale: Via Roma 123, 20100 Milano (MI)
PEC: azienda@pec.example.it
Tipo: Impresa / Professionista / Ente
```

**Verifica**:
- **Imprese**: RENTRI verifica automaticamente nel Registro Imprese
- **Professionisti**: CF personale → accreditamento immediato
- **Enti**: Verifica via PEC (1-2 giorni)

**Tempo**: 5-10 minuti (in DEMO è immediato)

---

### 3️⃣ Creazione Unità Locale (Sito)

**Percorso**: Menu → **Anagrafica** → **Unità Locali** → **Aggiungi**

**Due metodi**:

#### A) Importazione da Registro Imprese (se sei impresa)
1. Clicca **"Importa da Registro Imprese"**
2. Seleziona la sede legale dall'elenco
3. **Conferma**

#### B) Inserimento Manuale
1. Clicca **"Inserimento Manuale"**
2. Compila:
```
Nome unità locale: "Sede Operativa Milano"

Indirizzo:
- Via: Via Roma
- Civico: 123
- CAP: 20100
- Comune: Milano
- Provincia: MI

Attività (seleziona le tue):
☑ Produzione di rifiuti
☑ Trasporto di rifiuti
☐ Recupero di rifiuti
☐ Smaltimento di rifiuti
☐ Intermediazione senza detenzione

Profilo:
☑ Produttore
☑ Trasportatore
☐ Destinatario
☐ Intermediario
```

3. **Autorizzazioni**: 
   - In **DEMO**: Lascia vuoto (non richieste)
   - In **PRODUZIONE**: Carica documenti autorizzazioni (AIA, AUA, ecc.)

4. **Conferma**

**Risultato**: RENTRI ti assegna il **`num_iscr_sito`**

**Esempio**: `OP2512HTM066432-CL0001`

**⚠️ IMPORTANTE**: **COPIA e SALVA** questo codice! Serve dopo.

**Tempo**: 5 minuti

---

### 4️⃣ Scarica Certificato .p12

**Percorso**: Menu → **Interoperabilità** → **Gestione certificati** → **Richiedi certificato**

1. Clicca **"Richiedi nuovo certificato"**
2. Tipo: **"Certificato di dominio RENTRI"**
3. **Conferma**

**Download**:
- RENTRI genera il certificato (1-2 minuti)
- Scarica il file **`.p12`** (es: `SCZMNL05L21D960T.p12`)
- **COPIA la password** mostrata a schermo (es: `6o^Z+waO`)

**⚠️ IMPORTANTE**: 
- **Salva il file .p12** in un luogo sicuro
- **Annota la password** (non viene mostrata di nuovo!)

**Tempo**: 5 minuti

---

### 5️⃣ Crea Blocco Virtuale FIR

**Percorso**: Menu → **Interoperabilità** → **Gestione blocchi virtuali dei FIR** → **Nuovo Blocco**

**Compila**:
```
Codice Blocco: XXXX (4-6 lettere maiuscole, no vocali)
Esempi validi: ABCD, FGHJ, KLMN, PQRS

Descrizione: "Blocco FIR 2025"

Unità Locale: OP2512HTM066432-CL0001 (seleziona dall'elenco)
```

**Conferma**

**Risultato**: Blocco creato e attivo

**Limiti**:
- DEMO: Max 100 blocchi
- PRODUZIONE: Max 500 blocchi

**Tempo**: 2 minuti

---

## 📋 FASE 2: CONFIGURAZIONE RESCUEMANAGER (10 minuti)

### 1️⃣ Accedi all'App RescueManager

- Apri **RescueManager Desktop**
- Login con le tue credenziali
- **Seleziona l'organizzazione** dal menu in alto

---

### 2️⃣ Vai alla Sezione RENTRI

**Menu laterale** → **Rifiuti RENTRI** → **Dashboard**

---

### 3️⃣ Carica Certificato .p12

1. Dashboard → Clicca **"Certificati RENTRI"**
2. Clicca **"Carica Certificato"** o **"Upload .p12"**
3. **Seleziona il file** `.p12` scaricato
4. **Inserisci i dati**:
```
CF Operatore: SCZMNL05L21D960T
Ragione Sociale: Nome Azienda Srl
Password .p12: 6o^Z+waO (quella salvata)
Ambiente: Demo / Produzione
```
5. Clicca **"Carica"**

**Risultato**: ✅ Certificato caricato e validato

**Tempo**: 3 minuti

---

### 4️⃣ Configura num_iscr_sito (Solo Prima Volta)

**⚠️ IMPORTANTE**: Questo passaggio è **obbligatorio** e va fatto **solo la prima volta**.

**Vai su Supabase** (dashboard.supabase.com):

1. Seleziona il progetto
2. Vai su **SQL Editor**
3. Esegui questa query:

```sql
UPDATE rentri_org_certificates
SET num_iscr_sito = 'OP2512HTM066432-CL0001'  -- Usa il TUO num_iscr_sito!
WHERE cf_operatore = 'SCZMNL05L21D960T';      -- Usa il TUO CF!

-- Verifica
SELECT 
  cf_operatore,
  num_iscr_sito,
  ragione_sociale,
  environment,
  is_active
FROM rentri_org_certificates
WHERE cf_operatore = 'SCZMNL05L21D960T';
```

**Risultato atteso**:
```
num_iscr_sito: OP2512HTM066432-CL0001
is_active: true
```

**Tempo**: 2 minuti

---

### 5️⃣ Test Trasmissione FIR

1. **Dashboard RENTRI** → **Formulari** → **Nuovo Formulario**
2. Clicca **"Riempi Dati Test"** (per test rapido)
3. **Salva**
4. **Trasmetti a RENTRI**
5. Attendi 10-30 secondi
6. Vedrai alert: **"✅ Numero FIR RENTRI: ABCD-00001-ZZ"**

**Se funziona**: ✅ Configurazione completata!

**Se errore**: Verifica i passaggi precedenti

**Tempo**: 3 minuti

---

## 🎯 CHECKLIST FINALE

Prima di considerare la configurazione completa, verifica:

- [ ] ✅ Accesso portale RENTRI con SPID/CIE
- [ ] ✅ Operatore accreditato
- [ ] ✅ Almeno 1 unità locale creata
- [ ] ✅ `num_iscr_sito` annotato (es: `OP2512HTM066432-CL0001`)
- [ ] ✅ Certificato .p12 scaricato
- [ ] ✅ Password certificato salvata
- [ ] ✅ Blocco virtuale FIR creato
- [ ] ✅ Certificato caricato in RescueManager
- [ ] ✅ `num_iscr_sito` configurato nel DB
- [ ] ✅ Test trasmissione FIR riuscito

---

## ⚠️ ERRORI COMUNI E SOLUZIONI

### Errore: "Certificato RENTRI non trovato"
**Causa**: Certificato non caricato o non attivo  
**Soluzione**: Vai su Certificati RENTRI e carica il .p12

### Errore: "403 Forbidden"
**Causa**: `num_iscr_sito` non configurato o errato  
**Soluzione**: Esegui UPDATE SQL con il valore corretto

### Errore: "fir.bloccoFirNonTrovato"
**Causa**: Nessun blocco virtuale FIR creato  
**Soluzione**: Crea blocco sul portale RENTRI

### Errore: "sys.invalid" su campi
**Causa**: Dati non conformi alle specifiche RENTRI  
**Soluzione**: Usa "Riempi Dati Test" per vedere formato corretto

---

## 📞 SUPPORTO

Se il cliente ha problemi:

### 1. Supporto RENTRI (questioni tecniche RENTRI)
- **Portale**: https://supporto.rentri.gov.it
- **Email**: techref@rentri.it
- **Tel**: Vedi portale supporto

### 2. Supporto RescueManager (questioni app)
- **Email**: support@rescuemanager.eu
- **Interno**: Documentazione dettagliata in `RENTRI-project/`

---

## 🔐 SICUREZZA

**IMPORTANTE**:
- ✅ Il file `.p12` contiene **chiave privata** → **NON condividere**
- ✅ La password va **custodita in modo sicuro**
- ✅ Non inviare mai .p12 via email non cifrata
- ✅ Usa canali sicuri per lo scambio

---

## 📊 AMBIENTE DEMO vs PRODUZIONE

### DEMO (Test)
- ✅ Iscrizione immediata
- ✅ No autorizzazioni richieste
- ✅ Limiti: 100 blocchi, 500 richieste/giorno
- ✅ URL: https://demoapi.rentri.gov.it
- ❌ Dati non valgono per obblighi normativi

### PRODUZIONE (Reale)
- ⏱️ Iscrizione con verifica (1-5 giorni)
- ✅ Autorizzazioni obbligatorie (AIA, AUA, ecc.)
- ✅ Limiti: 500 blocchi, illimitate richieste
- ✅ URL: https://api.rentri.gov.it
- ✅ Dati valgono per obblighi normativi

---

## 🎯 RIEPILOGO FINALE

Un cliente **nuovo** deve:

1. **Iscriversi** su portale RENTRI (20 min)
   - Accreditamento operatore
   - Creazione unità locale
   - Download certificato .p12
   - Creazione blocco FIR

2. **Configurare** RescueManager (10 min)
   - Upload certificato nell'app
   - Configurazione num_iscr_sito nel DB
   - Test trasmissione

**Totale**: ~30 minuti per cliente (in DEMO)  
**Totale**: ~2-5 giorni per cliente (in PRODUZIONE, per verifiche RENTRI)

---

## 📚 DOCUMENTI DI SUPPORTO

Per il cliente, fornisci:
1. **Questa guida** (`GUIDA_CONFIGURAZIONE_RENTRI_CLIENTE.md`)
2. **Manuale portale RENTRI**: https://supporto.rentri.gov.it
3. **Video tutorial** (se disponibili sul sito RENTRI)
4. **Supporto tecnico** RescueManager per assistenza

---

## 🔧 AUTOMAZIONE FUTURA

**Possibili miglioramenti**:
1. ✅ Upload certificato → **GIÀ AUTOMATICO**
2. ⏳ Recupero `num_iscr_sito` dal certificato → Da verificare se possibile
3. ⏳ Creazione automatica blocco FIR via API → Da verificare se RENTRI lo permette
4. ⏳ Wizard guidato nella prima configurazione

---

**Data creazione**: 04 Dicembre 2025, ore 12:13



