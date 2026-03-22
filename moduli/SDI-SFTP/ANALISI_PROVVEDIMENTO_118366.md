# 📄 Analisi Provvedimento n. 118366/2023

**Data:** 19 gennaio 2026  
**Provvedimento:** n. 118366/2023 del Direttore dell'Agenzia delle Entrate  
**Data attivazione servizi:** 15 maggio 2023

---

## 📋 Cosa Stabilisce il Provvedimento

### 1. **Servizi Disponibili** (Art. 3.1)

Dal **15 maggio 2023**, sono disponibili due servizi API:

#### a) Verifica Codice Fiscale
- Verifica esistenza e validità del codice fiscale
- Verifica corrispondenza tra CF e dati anagrafici disponibili in Anagrafe Tributaria

#### b) Verifica Partita IVA
- Verifica validità del numero di partita IVA
- Fornisce informazioni su:
  - **Stato di attività** della partita IVA
  - **Denominazione** del soggetto (se azienda)
  - **Cognome e nome** della persona fisica titolare (se persona fisica, in assenza di denominazione)

---

## 🔐 Requisiti di Accesso

### 1. **Adesione Obbligatoria** (Art. 2.2)
- ✅ Accesso ai servizi **previo adesione** alle Condizioni Generali di Utilizzo
- ✅ Condizioni sono **specifiche per ciascuna tipologia di servizio**
- ✅ Pubblicate nell'**area riservata** del sito

### 2. **Categorie di Utenza** (Art. 2.2)
- Servizi disponibili in base alla **categoria di utenza** individuata dall'Agenzia
- Categorie rese note sul sito internet
- **Piani d'utilizzo** differenziati per categoria

### 3. **Piani d'Utilizzo** (Art. 1.1.g)
- Livelli di erogazione del servizio
- Garantiscono **carico transazionale controllato**
- Assicurano **disponibilità del servizio**
- Volumi differenziati in base alla categoria di fruitori

---

## 🔒 Sicurezza e Monitoraggio

### 1. **Sistema di Autenticazione** (Art. 4.1)
- Sistema di **identificazione, autenticazione e autorizzazione** degli accessi
- Garantisce sicurezza del sistema informativo dell'Anagrafe Tributaria

### 2. **Tracciamento** (Art. 4.2)
⚠️ **IMPORTANTE:**
- L'Agenzia **traccia tutti gli accessi**
- **Monitora e analizza periodicamente** le operazioni effettuate
- **Verifica a campione** il rispetto delle Condizioni generali di utilizzo

### 3. **Conseguenze**
- Possibile revoca accesso in caso di violazioni
- Monitoraggio continuo delle operazioni

---

## 📊 Trattamento Dati Personali

### 1. **Base Giuridica** (Art. 5.1)
- CAD (art. 7, 50, 64-bis, 71)
- GDPR (art. 6, par. 3, lett. b)

### 2. **Titolari del Trattamento**

#### Agenzia delle Entrate
- **Titolare** del trattamento dati utenti
- Si avvale di **Sogei S.p.A.** come Responsabile del trattamento (art. 28 GDPR)
- Conserva dati per il tempo necessario alle attività connesse

#### Utenti (Noi)
- **Titolari autonomi** del trattamento (art. 5.6)
- Dati oggetto: nome, cognome, codice fiscale dei soggetti verificati

### 3. **Obblighi Utenti** (Art. 5.7)
⚠️ **CRITICO - Da rispettare:**

- ✅ Trattare dati secondo principi GDPR:
  - Liceità
  - Necessità
  - Correttezza
  - Pertinenza
  - Non eccedenza

- ✅ Adottare **misure tecniche ed organizzative** (art. 32 GDPR):
  - Sicurezza del trattamento
  - Protezione dati personali
  - Conformità a legge e GDPR

- ✅ Conservare dati solo per il tempo necessario

---

## 🎯 Implicazioni per la Nostra Implementazione

### ✅ Cosa Possiamo Fare
1. **Usare i servizi gratuitamente** (libero accesso)
2. **Verificare P.IVA e CF** per i nostri clienti
3. **Auto-compilare** denominazione e stato P.IVA
4. **Cache dei dati** (rispettando GDPR)

### ⚠️ Cosa Dobbiamo Fare
1. **Registrarci** e aderire alle Condizioni generali
2. **Rispettare GDPR** nel trattamento dati
3. **Implementare sicurezza** (art. 32 GDPR)
4. **Conservare dati** solo per il tempo necessario
5. **Monitorare** il nostro utilizzo (l'Agenzia lo fa)

### ❌ Cosa NON Possiamo Fare
1. **Eccedere** nel trattamento dati
2. **Conservare dati** oltre il necessario
3. **Violare** le Condizioni generali di utilizzo
4. **Trasferire dati** a terzi senza autorizzazione

---

## 📝 Checklist Conformità

### Prima dell'Attivazione
- [ ] Registrazione su area riservata Agenzia delle Entrate
- [ ] Adesione alle Condizioni generali di utilizzo
- [ ] Verifica categoria utenza e piano disponibile
- [ ] Ottenimento credenziali OAuth2

### Implementazione Tecnica
- [ ] Implementazione OAuth2 per autenticazione
- [ ] Cache dati rispettando GDPR (30 giorni max)
- [ ] Gestione errori e rate limiting
- [ ] Logging accessi (per audit)

### Conformità GDPR
- [ ] Informativa privacy per trattamento dati
- [ ] Misure di sicurezza (art. 32 GDPR)
- [ ] Conservazione dati limitata al necessario
- [ ] Procedure per cancellazione dati

### Monitoraggio
- [ ] Tracciamento chiamate API
- [ ] Monitoraggio errori e rate limiting
- [ ] Audit periodico utilizzo
- [ ] Verifica conformità Condizioni generali

---

## 🚨 Punti Critici da Considerare

### 1. **Tracciamento Accessi**
- L'Agenzia traccia TUTTI gli accessi
- Monitoraggio continuo delle operazioni
- Verifica a campione del rispetto condizioni

### 2. **Piani d'Utilizzo**
- Volumi differenziati per categoria
- Possibili limiti di rate limiting
- Verificare piano disponibile per la nostra categoria

### 3. **Trattamento Dati**
- Siamo Titolari autonomi del trattamento
- Obbligo misure di sicurezza (art. 32 GDPR)
- Conservazione limitata al necessario

### 4. **Conseguenze Violazioni**
- Possibile revoca accesso
- Sanzioni GDPR (se violazioni trattamento dati)
- Responsabilità civile/penale

---

## 💡 Raccomandazioni

### 1. **Implementazione**
- ✅ Usare cache aggressiva (riduce chiamate)
- ✅ Verificare cliente esistente prima di chiamare API
- ✅ Gestire errori e rate limiting
- ✅ Logging per audit

### 2. **Conformità**
- ✅ Informativa privacy chiara
- ✅ Misure di sicurezza adeguate
- ✅ Conservazione dati limitata (30 giorni cache)
- ✅ Procedure cancellazione dati

### 3. **Monitoraggio**
- ✅ Tracciare numero chiamate API
- ✅ Monitorare errori e rate limiting
- ✅ Audit periodico utilizzo
- ✅ Verifica conformità continua

---

## 📚 Riferimenti Normativi

### CAD (Codice Amministrazione Digitale)
- Art. 7: Diritto di fruire servizi digitali
- Art. 50: Dati PA resi disponibili e accessibili
- Art. 64-bis: Servizi fruibili in rete, integrazione, interoperabilità
- Art. 71: Regole tecniche (Linee guida AGID)

### GDPR
- Art. 6, par. 3, lett. b: Base giuridica trattamento
- Art. 32: Misure di sicurezza
- Art. 28: Responsabile del trattamento

---

**Status:** ✅ Analisi completa - Documento conforme alle normative vigenti
