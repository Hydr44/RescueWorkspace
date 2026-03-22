# 📋 Analisi Completa Implementazione RVFU - AGGIORNATA

**Data Analisi**: 2025-01-XX  
**Versione Manuale**: SpecificheWS-GestioneDemolitori1.24  
**Totale Endpoint API**: 99  
**⚠️ AGGIORNATO DOPO SECONDO CHECK APPROFONDITO**

> **Vedi anche**: `ANALISI_SECONDO_CHECK_COMPLETA.md` per analisi dettagliata con priorità

---

## ✅ COSA È STATO IMPLEMENTATO

### 1. **Autenticazione OIDC** ✅
- ✅ `/json/authenticate` - Autenticazione con credenziali
- ✅ `/oauth2/authorize` - Autorizzazione OAuth2
- ✅ `/oauth2/access_token` - Token exchange
- ✅ `/oauth2/access_token` (refresh) - Refresh token
- ✅ `/oauth2/connect/endSession` - Logout
- ✅ Gestione token in sessionStorage
- ✅ Refresh automatico token (quando scade tra < 5 minuti)
- ✅ Durata token estesa (24h se non specificato)

### 2. **Form Creazione Demolizione** ✅
- ✅ Ricerca veicolo (`/rest/concessionario/veicolo`)
- ✅ Form completo con tutti i campi:
  - ✅ Dati veicolo (targa, telaio, marca, modello, tipo, cilindrata, potenza, ecc.)
  - ✅ Dati intestatario (PF/PG, nome/cognome, codice fiscale, nascita, residenza con ISTAT)
  - ✅ Dati detentore opzionale (completo)
  - ✅ Distinta documenti (DU, CDC, CDP, Foglio C, ecc.)
  - ✅ Note aggiuntive
- ✅ Autocompletamento form da ricerca veicolo
- ✅ Lookup ISTAT (province, comuni)
- ✅ Causali demolizione (caricate da DB)

### 3. **Endpoint API Implementati** (in `rvfu-client.ts`)
- ✅ `verificaVeicolo()` - GET `/rest/concessionario/veicolo`
- ✅ `registraVFUConcessionario()` - POST `/rest/concessionario/VFU`
- ✅ `generaCertificato()` - POST `/rest/cr/genera/certificatoRottamazione/{idVFU}`
- ✅ `generaRicevuta()` - POST `/rest/cr/genera/ricevutaPresaInCarico/{idVFU}`
- ✅ `allegaDocumento()` - POST `/rest/cr/allega/documentoVFU/{idVFU}`
- ✅ `consultaDocumento()` - GET `/rest/cr/consulta/documentoVFU/{idVFU}`
- ✅ `verificaVFU()` - PUT `/rest/cr/verifica/VFU/{idVFU}/{causale}`
- ✅ `inoltraSTA()` - PUT `/rest/cr/inoltraSTA/VFU/{codiceSTA}`
- ✅ `chiudiFascicolo()` - PUT `/rest/cr/chiudi/fascicolo/{idVFU}`

### 4. **UI/UX** ✅
- ✅ Pagina lista demolizioni (`DemolizioniRVFU.jsx`)
- ✅ Form creazione/modifica demolizione (`DemolizioneRVFUForm.jsx`)
- ✅ Sincronizzazione con RVFU
- ✅ Indicatori stato connessione RVFU
- ✅ Messaggi di errore/successo

### 5. **Database Schema** ✅
- ✅ Tabelle Supabase per `demolition_cases`
- ✅ Tabelle lookup: `rvfu_causali`, `rvfu_comuni_istat`, `rvfu_province_istat`
- ✅ Tabelle RVFU: `rvfu_documents`, `rvfu_operation_logs`, `rvfu_subjects`, `rvfu_document_distincts`

---

## ❌ COSA MANCA DA IMPLEMENTARE

### 1. **Endpoint API Mancanti (Critici per Concessionario)**

#### 1.1 Gestione VFU come Concessionario
- ❌ `GET /rest/concessionario/VFU/{id}` - Dettaglio VFU
- ❌ `GET /rest/concessionario/consulta/VFU` - Lista VFU paginata
- ❌ `PUT /rest/concessionario/annulla/VFU/{idVFU}` - Annulla VFU non conferito
- ❌ `PUT /rest/concessionario/conferisci/VFU/{idVFU}` - Conferisci VFU a CR
- ❌ `GET /rest/concessionario/centriRaccoltaConferibili` - Lista CR delegati
- ❌ `GET /rest/concessionario/export/VFU` - Export Excel lista VFU
- ❌ `GET /rest/concessionario/stampa/VFU` - Stampa PDF lista VFU
- ❌ `GET /rest/concessionario/documentoVFU` - Download documento
- ❌ `GET /rest/concessionario/consulta/documentoVFU/{idVFU}` - Lista documenti VFU

#### 1.2 Deleghe (Concessionario)
- ❌ `GET /rest/concessionario/consulta/delega` - Lista deleghe ricevute
- ❌ `GET /rest/concessionario/delega/{idDelega}` - Dettaglio delega
- ❌ `GET /rest/concessionario/stampa/delega` - Stampa PDF deleghe

### 2. **Endpoint API Mancanti (Per Centro di Raccolta - CR)**

#### 2.1 Gestione VFU come CR
- ❌ `POST /rest/cr/VFU` - Registra VFU come CR
- ❌ `GET /rest/cr/VFU/{idVFU}` - Dettaglio VFU
- ❌ `PUT /rest/cr/VFU/{idVFU}` - Modifica VFU
- ❌ `PUT /rest/cr/annulla/VFU/{idVFU}` - Annulla VFU
- ❌ `PUT /rest/cr/prendiInCarico/VFU/{idVFU}` - Prendi in carico VFU conferito
- ❌ `PUT /rest/cr/demolisci/VFU/{idVFU}` - Demolisci VFU
- ❌ `PUT /rest/cr/trasferisci/VFU/{idVFU}` - Trasferisci VFU ad altro CR
- ❌ `PUT /rest/cr/cedi/VFU/{idVFU}` - Cedi VFU
- ❌ `GET /rest/cr/consulta/VFU` - Lista VFU paginata
- ❌ `GET /rest/cr/consultaPresaInCarico/VFU` - Lista VFU da prendere in carico
- ❌ `GET /rest/cr/consultaRottamazione/VFU` - Lista VFU da rottamare
- ❌ `GET /rest/cr/consultaRadiati/VFU` - Lista VFU radiati
- ❌ `GET /rest/cr/consultaRichiestaIntegrazione/VFU` - Lista VFU con richiesta integrazione STA

#### 2.2 Fascicolo e Documenti (CR)
- ❌ `GET /rest/cr/fascicolo/{idFascicolo}` - Dettaglio fascicolo
- ❌ `GET /rest/cr/consulta/documentoVFU/{idVFU}` - Lista documenti VFU
- ❌ `GET /rest/cr/documentoVFU` - Download documento
- ❌ `PUT /rest/cr/documentoVFU` - Sostituisci documento
- ❌ `POST /rest/cr/documentoVFU` - Elimina documento
- ❌ `PUT /rest/cr/riapri/fascicolo/{idVFU}` - Riapri fascicolo chiuso

#### 2.3 STA e Radiazione (CR)
- ❌ `PUT /rest/cr/annullaInoltroSTA/VFU/{idVFU}` - Annulla inoltro STA
- ❌ `PUT /rest/cr/confermaRadiazioneVFU/VFU/{idVFU}` - Conferma radiazione (Da Radiare → Radiato)
- ❌ `GET /rest/cr/agenziaSTA/{codiceAgenzia}` - Dettaglio agenzia STA
- ❌ `GET /rest/cr/agenziaSTA/sedeOperativa/{codiceAgenzia}` - Dettaglio sede operativa STA

#### 2.4 Deleghe (CR)
- ❌ `POST /rest/cr/delega` - Crea delega per concessionario
- ❌ `GET /rest/cr/delega/{idDelega}` - Dettaglio delega
- ❌ `PUT /rest/cr/delega/{idDelega}` - Aggiorna delega
- ❌ `DELETE /rest/cr/delega/{idDelega}` - Elimina delega
- ❌ `PUT /rest/cr/revoca/delega/{idDelega}` - Revoca delega
- ❌ `GET /rest/cr/consulta/delega` - Lista deleghe emesse
- ❌ `GET /rest/cr/consulta/concessionario` - Lista concessionari delegabili

#### 2.5 Export e Stampa (CR)
- ❌ `GET /rest/cr/export/VFU` - Export Excel lista VFU
- ❌ `GET /rest/cr/exportPresaInCarico/VFU` - Export Excel presa in carico
- ❌ `GET /rest/cr/exportRottamazione/VFU` - Export Excel rottamazione
- ❌ `GET /rest/cr/exportRadiati/VFU` - Export Excel radiati
- ❌ `GET /rest/cr/stampa/VFU` - Stampa PDF lista VFU
- ❌ `GET /rest/cr/stampaPresaInCarico/VFU` - Stampa PDF presa in carico
- ❌ `GET /rest/cr/stampaRottamazione/VFU` - Stampa PDF rottamazione
- ❌ `GET /rest/cr/stampaRadiati/VFU` - Stampa PDF radiati
- ❌ `GET /rest/cr/stampa/delega` - Stampa PDF deleghe

#### 2.6 Altri Utili (CR)
- ❌ `GET /rest/cr/veicolo` - Ricerca veicolo (come CR)
- ❌ `GET /rest/cr/storico/VFU` - Storico VFU
- ❌ `GET /rest/cr/consulta/centroRaccolta` - Lista CR per trasferimento
- ❌ `GET /rest/cr/VFU/{idVFU}/sediTrasferimento` - Sedi trasferimento per VFU
- ❌ `GET /rest/cr/verifica/fascicolo/{idFascicolo}` - Verifica fascicolo
- ❌ `POST /rest/cr/genera/postillaCdr/{idVFU}` - Genera postilla CDR
- ❌ `POST /rest/cr/filtroDatiDU/VFU/{idVFU}/{filterValue}` - Switch filtro dati DU
- ❌ `PUT /rest/cr/inviaAlTablet/{idFascicolo}` - Invia al tablet

#### 2.7 Firma Documenti (CR)
- ❌ `GET /rest/cr/cartellaFirma/{idCartella}` - Recupera cartella firma
- ❌ `DELETE /rest/cr/cartellaFirma/{idCartella}` - Annulla e clona cartella firma

### 3. **Endpoint Utility/Lookup Mancanti**

#### 3.1 Lookup Data
- ❌ `GET /rest/cr/causali` - Lista causali
- ❌ `GET /rest/cr/causalePerCodice/{codiceCausale}` - Causale per codice
- ❌ `GET /rest/utility/provincia` - Lista province
- ❌ `GET /rest/utility/provincia/{codiceDtt}/comune` - Comuni per provincia
- ❌ `GET /rest/utility/comune` - Ricerca comuni
- ❌ `GET /rest/utility/statiEsteri` - Stati esteri validi
- ❌ `GET /rest/utility/statoEstero` - Ricerca stati esteri

#### 3.2 Utente
- ❌ `GET /rest/utility/detail/utente` - Dettaglio utente corrente

### 4. **Endpoint Agenzia STA Mancanti**

- ❌ `GET /rest/agenzia/VFU/{id}` - Dettaglio VFU
- ❌ `GET /rest/agenzia/consulta/VFU` - Lista VFU
- ❌ `PUT /rest/agenzia/confermaRadiazioneVFU/VFU/{idVFU}` - Conferma radiazione (Assegnato a STA → Radiato)
- ❌ `GET /rest/agenzia/consulta/documentoVFU/{idVFU}` - Lista documenti
- ❌ `GET /rest/agenzia/documentoVFU` - Download documento
- ❌ `GET /rest/agenzia/export/VFU` - Export Excel
- ❌ `GET /rest/agenzia/stampa/VFU` - Stampa PDF
- ❌ `GET /rest/agenzia/fascicolo/{idFascicolo}` - Dettaglio fascicolo

### 5. **Endpoint UMC (Ufficio Motorizzazione Civile) Mancanti**

- ❌ `GET /rest/umc/VFU/{id}` - Dettaglio VFU
- ❌ `GET /rest/umc/consulta/VFU` - Lista VFU
- ❌ `GET /rest/umc/consulta/delega` - Lista deleghe
- ❌ `GET /rest/umc/delega/{idDelega}` - Dettaglio delega
- ❌ `GET /rest/umc/consulta/documentoVFU/{idVFU}` - Lista documenti
- ❌ `GET /rest/umc/documentoVFU` - Download documento
- ❌ `GET /rest/umc/export/VFU` - Export Excel
- ❌ `GET /rest/umc/stampa/VFU` - Stampa PDF
- ❌ `GET /rest/umc/stampa/delega` - Stampa PDF deleghe
- ❌ `GET /rest/umc/fascicolo/{idFascicolo}` - Dettaglio fascicolo
- ❌ `GET /rest/umc/consulta/impresaGestioneVFU` - Lista imprese accreditate
- ❌ `GET /rest/umc/impresaGestioneVFU/{idImpresa}` - Dettaglio impresa
- ❌ `GET /rest/umc/stampa/impresaGestioneVFU` - Stampa PDF imprese
- ❌ `GET /rest/umc/stampa/impresaGestioneVFU/{idImpresa}` - Stampa PDF dettaglio impresa
- ❌ `GET /rest/umc/storico/VFU` - Storico VFU

---

## 🎯 PRIORITÀ DI IMPLEMENTAZIONE

### **PRIORITÀ ALTA** (Flusso base Concessionario)
1. **Consultazione VFU**
   - `GET /rest/concessionario/consulta/VFU` - Lista demolizioni
   - `GET /rest/concessionario/VFU/{id}` - Dettaglio singola demolizione

2. **Conferimento VFU a CR**
   - `GET /rest/concessionario/centriRaccoltaConferibili` - Lista CR disponibili
   - `PUT /rest/concessionario/conferisci/VFU/{idVFU}` - Conferisci VFU

3. **Annullamento VFU**
   - `PUT /rest/concessionario/annulla/VFU/{idVFU}` - Annulla se non conferito

4. **Documenti**
   - `GET /rest/concessionario/consulta/documentoVFU/{idVFU}` - Lista documenti
   - `GET /rest/concessionario/documentoVFU` - Download documento

### **PRIORITÀ MEDIA** (Funzionalità avanzate Concessionario)
5. **Export/Stampa**
   - `GET /rest/concessionario/export/VFU` - Export Excel
   - `GET /rest/concessionario/stampa/VFU` - Stampa PDF

6. **Deleghe (se necessarie)**
   - `GET /rest/concessionario/consulta/delega` - Lista deleghe
   - `GET /rest/concessionario/delega/{idDelega}` - Dettaglio delega

### **PRIORITÀ BASSA** (CR, STA, UMC - se necessari)
7. **Funzionalità Centro di Raccolta** (se l'app deve supportare CR)
8. **Funzionalità Agenzia STA** (se l'app deve supportare STA)
9. **Funzionalità UMC** (se l'app deve supportare UMC)

---

## 📝 FLUSSI OPERATIVI DA IMPLEMENTARE

### **Flusso 1: Concessionario - Registrazione e Conferimento** ⚠️ PARZIALMENTE IMPLEMENTATO
1. ✅ Ricerca veicolo
2. ✅ Registrazione VFU (`registraVFUConcessionario`)
3. ❌ Consultazione lista VFU registrati
4. ❌ Visualizzazione dettaglio VFU
5. ❌ Ricerca centri raccolta disponibili
6. ❌ Conferimento VFU a CR
7. ❌ Annullamento VFU (se non conferito)

### **Flusso 2: Concessionario - Gestione Documenti** ⚠️ PARZIALMENTE IMPLEMENTATO
1. ✅ Allega documento (`allegaDocumento`)
2. ❌ Consultazione lista documenti
3. ❌ Download documento
4. ❌ Visualizzazione documento

### **Flusso 3: Concessionario - Verifica e Certificati** ⚠️ PARZIALMENTE IMPLEMENTATO
1. ✅ Genera certificato rottamazione (`generaCertificato`)
2. ✅ Verifica VFU (`verificaVFU`)
3. ❌ Consultazione stato certificati generati
4. ❌ Download certificati

### **Flusso 4: CR - Presa in Carico** ❌ NON IMPLEMENTATO
1. ❌ Lista VFU conferiti da prendere in carico
2. ❌ Presa in carico VFU
3. ❌ Genera ricevuta presa in carico
4. ❌ Verifica documentazione

### **Flusso 5: CR - Radiazione e Rottamazione** ❌ NON IMPLEMENTATO
1. ❌ Richiesta radiazione PRA
2. ❌ Inoltro a STA
3. ❌ Conferma radiazione
4. ❌ Rottamazione veicolo
5. ❌ Chiusura fascicolo

---

## 🔍 FUNZIONALITÀ UI MANCANTI

### 1. **Pagina Lista Demolizioni Migliorata**
- ❌ Filtri avanzati (stato, data, targa, ecc.)
- ❌ Ordinamento colonne
- ❌ Paginazione
- ❌ Export Excel
- ❌ Stampa PDF

### 2. **Pagina Dettaglio Demolizione**
- ❌ Visualizzazione completa dati VFU
- ❌ Lista documenti allegati
- ❌ Download documenti
- ❌ Storico operazioni
- ❌ Azioni disponibili (conferisci, annulla, ecc.)

### 3. **Gestione Documenti**
- ❌ Upload multiplo documenti
- ❌ Anteprima documenti
- ❌ Eliminazione documenti
- ❌ Sostituzione documenti

### 4. **Gestione Deleghe** (se necessaria)
- ❌ Lista deleghe ricevute
- ❌ Dettaglio delega
- ❌ Visualizzazione permessi delega

### 5. **Dashboard/Statistiche**
- ❌ Statistiche demolizioni (per stato, periodo, ecc.)
- ❌ Grafici e report

---

## 📚 DOCUMENTAZIONE DA CONSULTARE

1. **SpecificheWS-GestioneDemolitori1.24.pdf** - Manuale principale
   - Sezione 3: Diagramma di processo
   - Sezione 4: Definizione dei servizi
   - Sezione 4.3: Esempi di chiamate

2. **RVFU.json** - OpenAPI Specification
   - Tutti i 99 endpoint con parametri e risposte

3. **SpecificheWS-DocumentoUnico-STAPlus-13.0.pdf** - Integrazione Documento Unico
   - Per integrazione con sistema DU

---

## ✅ CONCLUSIONI

**Stato Attuale**: ~15% implementato (15 endpoint su 99)

**Prossimi Passi Raccomandati**:
1. Implementare consultazione lista VFU (`GET /rest/concessionario/consulta/VFU`)
2. Implementare dettaglio VFU (`GET /rest/concessionario/VFU/{id}`)
3. Implementare conferimento VFU (`PUT /rest/concessionario/conferisci/VFU/{idVFU}`)
4. Implementare gestione documenti completa (lista, download)
5. Migliorare UI lista demolizioni con filtri e paginazione

**Note**: 
- L'app attualmente funziona come **Concessionario**
- Per supportare **Centro di Raccolta**, **Agenzia STA**, o **UMC** servono implementazioni aggiuntive
- Molti endpoint sono simili ma con prefissi diversi (`/concessionario/`, `/cr/`, `/agenzia/`, `/umc/`)

