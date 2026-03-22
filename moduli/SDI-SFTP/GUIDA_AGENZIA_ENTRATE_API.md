# 🏛️ Guida Integrazione API Agenzia delle Entrate

**Data:** 19 gennaio 2026  
**Scopo:** Sostituire OpenAPI.it con API gratuita dell'Agenzia delle Entrate  
**Costo:** GRATIS (servizio pubblico)

---

## 📋 Panoramica

**Provvedimento:** n. 118366/2023 del Direttore dell'Agenzia delle Entrate  
**Data attivazione:** 15 maggio 2023  
**Base giuridica:** CAD (Codice Amministrazione Digitale), art. 7, 50, 64-bis, 71

L'Agenzia delle Entrate offre servizi **GRATUITI** e di **libero accesso** per:
- ✅ Verifica esistenza e validità Partita IVA
- ✅ Verifica esistenza e validità Codice Fiscale
- ✅ Stato P.IVA (attiva/inattiva)
- ✅ Denominazione aziendale (o nome/cognome per persone fisiche)

**Limitazioni:**
- ❌ Non restituisce indirizzo completo
- ❌ Non restituisce codice destinatario SDI
- ❌ Non restituisce PEC
- ⚠️ Richiede registrazione e adesione alle Condizioni generali di utilizzo
- ⚠️ Sistema di autenticazione/autorizzazione OAuth2
- ⚠️ Tracciamento degli accessi (monitoraggio operazioni)

---

## 🔐 Registrazione e Setup

### Step 1: Registrazione

1. **Vai al sito Agenzia delle Entrate:**
   - https://www.agenziaentrate.gov.it/portale/web/guest/servizi/api-management

2. **Adesione Condizioni d'Uso:**
   - Accedi all'**area riservata** (SPID, CIE o CNS)
   - **Aderisci alle Condizioni Generali di Utilizzo** (obbligatorio per legge)
   - Le condizioni sono **specifiche per ciascuna tipologia di servizio**
   - Attendi approvazione (solitamente 1-2 giorni lavorativi)

3. **Piano di Utilizzo:**
   - L'Agenzia offre **volumi differenziati** in base alla categoria di utenza
   - I **Piani d'utilizzo** garantiscono un carico transazionale controllato
   - Verifica il piano disponibile per la tua categoria

4. **Ottieni Credenziali:**
   - Client ID
   - Client Secret
   - Endpoint OAuth2
   - Endpoint API

### Step 2: Configurazione OAuth2

L'API usa OAuth2 per l'autenticazione. Dovrai:
- Ottenere `access_token` tramite OAuth2
- Usare `access_token` per chiamare gli endpoint API
- Rinnovare token quando scade

---

## 🔧 Endpoint API

### Base URL
```
https://api.agenziaentrate.gov.it
```

### OAuth2 Token
```
POST /oauth/token
```

### Verifica Partita IVA
```
POST /verifica-piva
```

### Verifica Codice Fiscale
```
POST /verifica-cf
```

---

## 📝 Formato Richieste/Risposte

### Verifica P.IVA - Request
```json
{
  "partitaIva": "02166430856"
}
```

### Verifica P.IVA - Response
```json
{
  "valid": true,
  "status": "attiva",
  "denominazione": "SCOZZARINI SERVICE CAR S.R.L.",
  "nome": null,
  "cognome": null,
  "codiceFiscale": "01935590859"
}
```

**Se persona fisica:**
```json
{
  "valid": true,
  "status": "attiva",
  "denominazione": null,
  "nome": "Mario",
  "cognome": "Rossi",
  "codiceFiscale": "RSSMRA80A01H501U"
}
```

### Verifica CF - Request
```json
{
  "codiceFiscale": "RSSMRA80A01H501U",
  "nome": "Mario",
  "cognome": "Rossi",
  "dataNascita": "1980-01-01",
  "sesso": "M",
  "comuneNascita": "Roma"
}
```

### Verifica CF - Response
```json
{
  "valid": true,
  "corrispondenza": true,
  "messaggio": "Codice fiscale valido e corrispondente ai dati anagrafici"
}
```

---

## ⚠️ Limitazioni e Considerazioni

### Dati NON Disponibili
- ❌ Indirizzo completo
- ❌ Codice destinatario SDI
- ❌ PEC
- ❌ Dati finanziari
- ❌ ATECO
- ❌ REA

### Soluzioni Alternative
1. **Indirizzo:** Usare Google Maps Platform (già integrato)
2. **Codice SDI:** Chiedere all'utente o usare IPA per PA
3. **PEC:** Chiedere all'utente

### Rate Limiting e Piani di Utilizzo
- L'API ha **Piani d'utilizzo** con volumi differenziati per categoria utenza
- I piani garantiscono un **carico transazionale controllato**
- Implementare cache aggressiva (già fatto) per ridurre chiamate
- Gestire errori 429 (Too Many Requests)

### Tracciamento e Monitoraggio
⚠️ **IMPORTANTE:** L'Agenzia:
- **Traccia tutti gli accessi**
- **Monitora e analizza periodicamente** le operazioni effettuate
- **Verifica a campione** il rispetto delle Condizioni generali di utilizzo
- **Richiede conformità** alle norme GDPR e CAD

### Trattamento Dati Personali
- Gli utenti sono **Titolari autonomi** del trattamento dati
- Obbligo di rispettare principi GDPR (liceità, necessità, correttezza, pertinenza, non eccedenza)
- Obbligo di adottare **misure tecniche ed organizzative** per sicurezza dati (art. 32 GDPR)
- Conservazione dati solo per il tempo necessario

---

## 🚀 Prossimi Passi

1. ✅ Registrazione su Agenzia delle Entrate
2. ✅ Ottenere credenziali OAuth2
3. ✅ Implementare integrazione (vedi codice seguente)
4. ✅ Testare con P.IVA reali
5. ✅ Rimuovere OpenAPI.it dal codice

---

**Status:** ✅ Guida completa - Pronto per implementazione
