# 🔍 Secondo Check Completo - Analisi Implementazione RVFU

**Data**: 2025-01-XX  
**Versione Manuale**: SpecificheWS-GestioneDemolitori1.24  
**Totale Endpoint API**: 99

---

## 📊 STATISTICHE ENDPOINT PER RUOLO

### **CONCESSIONARIO** (14 endpoint totali)
- ✅ **Implementati**: 2/14 (14%)
  - ✅ `GET /rest/concessionario/veicolo` - Verifica veicolo
  - ✅ `POST /rest/concessionario/VFU` - Registra VFU
  
- ❌ **Mancanti**: 12/14 (86%)
  - ❌ `GET /rest/concessionario/VFU/{id}` - **PRIORITÀ ALTA**
  - ❌ `GET /rest/concessionario/consulta/VFU` - **PRIORITÀ ALTA**
  - ❌ `PUT /rest/concessionario/conferisci/VFU/{idVFU}` - **PRIORITÀ ALTA**
  - ❌ `PUT /rest/concessionario/annulla/VFU/{idVFU}` - **PRIORITÀ ALTA**
  - ❌ `GET /rest/concessionario/centriRaccoltaConferibili` - **PRIORITÀ ALTA**
  - ❌ `GET /rest/concessionario/consulta/documentoVFU/{idVFU}` - **PRIORITÀ MEDIA**
  - ❌ `GET /rest/concessionario/documentoVFU` - **PRIORITÀ MEDIA**
  - ❌ `GET /rest/concessionario/export/VFU` - **PRIORITÀ MEDIA**
  - ❌ `GET /rest/concessionario/stampa/VFU` - **PRIORITÀ MEDIA**
  - ❌ `GET /rest/concessionario/consulta/delega` - **PRIORITÀ BASSA**
  - ❌ `GET /rest/concessionario/delega/{idDelega}` - **PRIORITÀ BASSA**
  - ❌ `GET /rest/concessionario/stampa/delega` - **PRIORITÀ BASSA**

### **CENTRO DI RACCOLTA (CR)** (56 endpoint totali)
- ⚠️ **Parzialmente implementati**: 9/56 (16%)
  - ✅ Alcuni metodi implementati ma sono per ruolo CR, non Concessionario
  - ✅ `POST /rest/cr/allega/documentoVFU/{idVFU}`
  - ✅ `GET /rest/cr/consulta/documentoVFU/{idVFU}` (ma dovrebbe essere `/rest/concessionario/...`)
  - ✅ `POST /rest/cr/genera/certificatoRottamazione/{idVFU}`
  - ✅ `POST /rest/cr/genera/ricevutaPresaInCarico/{idVFU}`
  - ✅ `PUT /rest/cr/verifica/VFU/{idVFU}/{causale}`
  - ✅ `PUT /rest/cr/inoltraSTA/VFU/{codiceSTA}`
  - ✅ `PUT /rest/cr/chiudi/fascicolo/{idVFU}`
  - ✅ `POST /rest/cr/inviaAlTablet/{idFascicolo}`
  - ✅ `GET /rest/cr/cartellaFirma/{idCartella}` (recuperaFirmato)

### **UTILITY** (6 endpoint totali)
- ❌ **Mancanti**: 6/6 (100%)
  - ❌ `GET /rest/utility/provincia` - Lista province (utile per lookup)
  - ❌ `GET /rest/utility/provincia/{codiceDtt}/comune` - Comuni per provincia (utile per lookup)
  - ❌ `GET /rest/utility/comune` - Ricerca comuni
  - ❌ `GET /rest/utility/statiEsteri` - Stati esteri validi
  - ❌ `GET /rest/utility/statoEstero` - Ricerca stati esteri
  - ❌ `GET /rest/utility/detail/utente` - Dettaglio utente corrente

### **AGENZIA STA** (8 endpoint totali)
- ❌ **Mancanti**: 8/8 (100%) - Non necessario se app è solo Concessionario

### **UMC** (15 endpoint totali)
- ❌ **Mancanti**: 15/15 (100%) - Non necessario se app è solo Concessionario

---

## ✅ COSA È STATO IMPLEMENTATO CORRETTAMENTE

### 1. **Autenticazione OIDC** ✅ 100%
- ✅ `/json/authenticate` - Autenticazione con credenziali
- ✅ `/oauth2/authorize` - Autorizzazione OAuth2 (con BrowserWindow)
- ✅ `/oauth2/access_token` - Token exchange
- ✅ Refresh token automatico
- ✅ `/oauth2/connect/endSession` - Logout (corretto con redirect manual)

### 2. **Form Creazione Demolizione** ✅ 100%
- ✅ Tutti i campi veicolo (targa, telaio, tipo, marca, modello, cilindrata, potenza, ecc.)
- ✅ Tutti i campi intestatario (PF/PG, nome/cognome, CF, nascita, residenza con ISTAT)
- ✅ Tutti i campi detentore opzionale (completo)
- ✅ Distinta documenti completa (DU, CDC, CDP, Foglio C, ecc.)
- ✅ Note aggiuntive e note parti rifiuti
- ✅ Lookup ISTAT (province, comuni) - caricati da Supabase
- ✅ Causali demolizione - caricate da Supabase

### 3. **Ricerca Veicolo** ✅ 100%
- ✅ Form ricerca con tutti i parametri
- ✅ Integrazione con `/rest/concessionario/veicolo`
- ✅ Visualizzazione risultati
- ✅ Autocompletamento form

### 4. **Registrazione VFU** ✅ 100%
- ✅ `POST /rest/concessionario/VFU`
- ✅ Mapping completo da form a `VFUCreateAsConcessionario`
- ✅ Gestione errori
- ✅ Aggiornamento record Supabase con `rvfu_id`

---

## ❌ COSA MANCA - DETTAGLIO PER PRIORITÀ

### 🔴 **PRIORITÀ ALTA** (Flusso base Concessionario)

#### 1. **Consultazione Lista VFU** ❌
- **Endpoint**: `GET /rest/concessionario/consulta/VFU`
- **Parametri**: Paginazione, filtri (targa, stato, data, ecc.)
- **Descrizione**: Visualizzare tutte le demolizioni registrate dal concessionario
- **Utilizzo UI**: Pagina principale lista demolizioni
- **Stato**: ❌ Non implementato
- **Importanza**: 🔴 CRITICO - Senza questo non si possono vedere le demolizioni registrate

#### 2. **Dettaglio Singolo VFU** ❌
- **Endpoint**: `GET /rest/concessionario/VFU/{id}`
- **Descrizione**: Visualizzare dettaglio completo di una demolizione
- **Utilizzo UI**: Pagina dettaglio demolizione
- **Stato**: ❌ Non implementato
- **Importanza**: 🔴 CRITICO - Necessario per vedere stato, documenti, storico

#### 3. **Lista Centri di Raccolta Disponibili** ❌
- **Endpoint**: `GET /rest/concessionario/centriRaccoltaConferibili`
- **Descrizione**: Lista CR che hanno delegato il concessionario (per conferimento)
- **Utilizzo UI**: Modal/select per scegliere CR quando si conferisce un VFU
- **Stato**: ❌ Non implementato
- **Importanza**: 🔴 CRITICO - Necessario per conferire VFU a CR

#### 4. **Conferimento VFU a CR** ❌
- **Endpoint**: `PUT /rest/concessionario/conferisci/VFU/{idVFU}`
- **Body**: `{ "idCentroRaccolta": "xxx", "dataConferimento": "..." }`
- **Descrizione**: Conferisce un VFU registrato a un Centro di Raccolta
- **Utilizzo UI**: Bottone "Conferisci a CR" nella pagina dettaglio
- **Stato**: ❌ Non implementato
- **Importanza**: 🔴 CRITICO - Flusso principale del processo

#### 5. **Annullamento VFU** ❌
- **Endpoint**: `PUT /rest/concessionario/annulla/VFU/{idVFU}`
- **Descrizione**: Annulla un VFU registrato ma non ancora conferito
- **Utilizzo UI**: Bottone "Annulla" nella pagina dettaglio (solo se stato = "Inserito")
- **Stato**: ❌ Non implementato
- **Importanza**: 🔴 ALTA - Permette di correggere errori

---

### 🟡 **PRIORITÀ MEDIA** (Funzionalità utili)

#### 6. **Consultazione Documenti VFU** ❌
- **Endpoint**: `GET /rest/concessionario/consulta/documentoVFU/{idVFU}`
- **Descrizione**: Lista tutti i documenti allegati a un VFU
- **Utilizzo UI**: Sezione documenti nella pagina dettaglio
- **Stato**: ⚠️ Implementato ma per ruolo CR (`/rest/cr/consulta/documentoVFU/{idVFU}`)
- **Importanza**: 🟡 MEDIA - Utile per verificare documenti allegati

#### 7. **Download Documento** ❌
- **Endpoint**: `GET /rest/concessionario/documentoVFU?{parametri}`
- **Parametri**: `idVFU`, `idDocumento`, `tipoDocumento` (secondo manuale)
- **Descrizione**: Scarica un documento specifico del VFU
- **Utilizzo UI**: Link download nella lista documenti
- **Stato**: ⚠️ Parzialmente implementato (`downloadDocumento` ma usa endpoint CR)
- **Importanza**: 🟡 MEDIA - Utile per visualizzare certificati/documenti

#### 8. **Export Excel Lista VFU** ❌
- **Endpoint**: `GET /rest/concessionario/export/VFU?{filtri}`
- **Descrizione**: Esporta lista VFU in formato Excel (.xlsx)
- **Utilizzo UI**: Bottone "Esporta Excel" nella pagina lista
- **Stato**: ❌ Non implementato
- **Importanza**: 🟡 MEDIA - Utile per reportistica

#### 9. **Stampa PDF Lista VFU** ❌
- **Endpoint**: `GET /rest/concessionario/stampa/VFU?{filtri}`
- **Descrizione**: Genera PDF della lista VFU
- **Utilizzo UI**: Bottone "Stampa PDF" nella pagina lista
- **Stato**: ❌ Non implementato
- **Importanza**: 🟡 MEDIA - Utile per documentazione

---

### 🟢 **PRIORITÀ BASSA** (Deleghe - se necessarie)

#### 10-12. **Gestione Deleghe** ❌
- `GET /rest/concessionario/consulta/delega` - Lista deleghe ricevute
- `GET /rest/concessionario/delega/{idDelega}` - Dettaglio delega
- `GET /rest/concessionario/stampa/delega` - Stampa PDF deleghe
- **Importanza**: 🟢 BASSA - Solo se necessario vedere deleghe ricevute da CR

---

## 🔍 ALTRI ASPETTI IMPORTANTI DA VERIFICARE

### 1. **Endpoint Utility per Lookup** ⚠️
**Problema**: Attualmente usiamo Supabase per lookup ISTAT, ma l'API RVFU offre endpoint dedicati:
- ❌ `GET /rest/utility/provincia` - Potrebbe essere più aggiornato di Supabase
- ❌ `GET /rest/utility/provincia/{codiceDtt}/comune` - Potrebbe essere più aggiornato
- ❌ `GET /rest/cr/causali` - Lista causali dall'API (invece di Supabase)

**Raccomandazione**: Valutare se usare API RVFU per lookup invece di Supabase per dati più aggiornati.

### 2. **Endpoint Causali** ⚠️
- ❌ `GET /rest/cr/causali` - Lista tutte le causali disponibili
- ❌ `GET /rest/cr/causalePerCodice/{codiceCausale}` - Dettaglio causale

**Nota**: Attualmente le causali sono caricate da Supabase. Potrebbe essere meglio caricarle dall'API RVFU.

### 3. **Dettaglio Utente** ❌
- ❌ `GET /rest/utility/detail/utente` - Dettaglio utente corrente
- **Utilizzo**: Mostrare nome utente, ruolo, permessi nella UI
- **Importanza**: 🟡 MEDIA - Utile per mostrare info utente autenticato

### 4. **Gestione Stati VFU** ⚠️

**Stati VFU secondo manuale (sezione 4.4.1):**
- `I` = INSERITO (appena registrato)
- `C` = CONFERITO (conferito a CR)
- `T` = TRASFERITO
- `P` = PRESO IN CARICO (dal CR)
- `R` = DA RADIARE
- `N` = INVIATO A STA
- `S` = RADIATO
- `D` = DEMOLITO
- `A` = ANNULLATO

**Problema**: La UI deve gestire correttamente questi stati e mostrare solo le azioni disponibili per ogni stato.

**Esempi**:
- VFU in stato `I` (Inserito): può essere conferito o annullato
- VFU in stato `C` (Conferito): non può più essere modificato/annullato dal concessionario
- VFU in stato `A` (Annullato): non può più essere modificato

**Raccomandazione**: Implementare logica di stati e azioni permesse per stato.

### 5. **Workflow Processo** ⚠️

**Secondo manuale sezione 3.1, macro-aree:**
1. ✅ **Ritiro da parte dei concessionari** - Parzialmente implementato (registrazione)
2. ❌ **Conferimento a CR** - Non implementato
3. ❌ **Gestione dopo conferimento** - Non implementato (CR gestisce)

**Workflow completo Concessionario:**
```
1. Ricerca veicolo ✅
2. Registrazione VFU ✅
3. Consultazione lista VFU ❌
4. Visualizzazione dettaglio ❌
5. Selezione CR disponibile ❌
6. Conferimento a CR ❌
7. Visualizzazione stato aggiornato ❌
8. Annullamento (se necessario) ❌
```

### 6. **Validazioni e Controlli** ⚠️

**Da verificare nei manuali:**
- ❌ Validazione campi obbligatori prima di registrare
- ❌ Controllo stato VFU prima di operazioni (es: non si può conferire se già conferito)
- ❌ Gestione errori specifici dell'API RVFU
- ❌ Messaggi di errore user-friendly

### 7. **Download Documenti - Parametri Specifici** ⚠️

**Attenzione**: Secondo manuale v1.11, l'endpoint download documenti ha parametri specifici:
- `GET /rest/concessionario/documentoVFU?{parametri}`
- Parametri richiesti: `idVFU`, `idDocumento`, `tipoDocumento`

**Problema**: Il metodo `downloadDocumento` attuale potrebbe non avere tutti i parametri corretti.

---

## 🎯 PRIORITÀ DI IMPLEMENTAZIONE AGGIORNATA

### **FASE 1 - Flusso Base Concessionario** (Priorità Massima)
1. ❌ **Consultazione Lista VFU** (`GET /rest/concessionario/consulta/VFU`)
   - Con filtri e paginazione
   - UI: Migliorare pagina lista con filtri avanzati
   
2. ❌ **Dettaglio VFU** (`GET /rest/concessionario/VFU/{id}`)
   - UI: Pagina dettaglio demolizione completa
   
3. ❌ **Lista CR Disponibili** (`GET /rest/concessionario/centriRaccoltaConferibili`)
   - UI: Modal/select per selezione CR
   
4. ❌ **Conferimento VFU** (`PUT /rest/concessionario/conferisci/VFU/{idVFU}`)
   - UI: Bottone "Conferisci" nella pagina dettaglio
   - Validazione: Solo se stato = "Inserito"
   
5. ❌ **Annullamento VFU** (`PUT /rest/concessionario/annulla/VFU/{idVFU}`)
   - UI: Bottone "Annulla" nella pagina dettaglio
   - Validazione: Solo se stato = "Inserito"

### **FASE 2 - Gestione Documenti** (Priorità Media)
6. ❌ **Lista Documenti** (`GET /rest/concessionario/consulta/documentoVFU/{idVFU}`)
   - Correggere endpoint (attualmente usa `/rest/cr/...`)
   
7. ❌ **Download Documento** (`GET /rest/concessionario/documentoVFU`)
   - Verificare parametri corretti secondo manuale
   - UI: Link download nella lista documenti

### **FASE 3 - Export/Stampa** (Priorità Media)
8. ❌ **Export Excel** (`GET /rest/concessionario/export/VFU`)
9. ❌ **Stampa PDF** (`GET /rest/concessionario/stampa/VFU`)

### **FASE 4 - Lookup API** (Priorità Bassa - Ottimizzazione)
10. ❌ Considerare uso API RVFU per lookup invece di Supabase:
    - `GET /rest/utility/provincia`
    - `GET /rest/utility/provincia/{codice}/comune`
    - `GET /rest/cr/causali`

---

## 📋 CHECKLIST FINALE - COSA VERIFICARE

### **Endpoint API**
- [ ] Tutti gli endpoint Concessionario implementati? **NO - 2/14 (14%)**
- [ ] Endpoint corretti per ruolo? **NO - alcuni usano `/rest/cr/` invece di `/rest/concessionario/`**
- [ ] Parametri endpoint corretti? **DA VERIFICARE - download documento**

### **UI/UX**
- [ ] Pagina lista con filtri funzionanti? **PARZIALE - mancano filtri avanzati**
- [ ] Pagina dettaglio completa? **NO - da creare**
- [ ] Gestione stati VFU? **NO - da implementare**
- [ ] Azioni permesse per stato? **NO - da implementare**
- [ ] Messaggi di errore user-friendly? **PARZIALE**

### **Workflow**
- [ ] Flusso completo da ricerca a conferimento? **NO - manca conferimento**
- [ ] Validazioni stato prima operazioni? **NO**
- [ ] Gestione errori API? **PARZIALE**

### **Lookup Data**
- [ ] Causali caricate correttamente? **SÌ - da Supabase, ma API offre endpoint dedicato**
- [ ] Province/Comuni ISTAT caricate? **SÌ - da Supabase, ma API offre endpoint dedicato**
- [ ] Dati aggiornati? **DA VERIFICARE - API potrebbe essere più aggiornata**

---

## ✅ CONCLUSIONI

**Stato Implementazione**: ~12% completato (12 endpoint su 99 totali, 2 su 14 per Concessionario)

**Problemi Critici Identificati**:
1. ❌ Manca consultazione lista VFU (non si possono vedere le demolizioni registrate)
2. ❌ Manca dettaglio VFU (non si può vedere lo stato dopo registrazione)
3. ❌ Manca conferimento a CR (flusso principale incompleto)
4. ⚠️ Alcuni endpoint usano `/rest/cr/` invece di `/rest/concessionario/`
5. ⚠️ Gestione stati VFU non implementata
6. ⚠️ Lookup dati da Supabase invece di API RVFU (potrebbe essere obsoleto)

**Prossimi Passi Obbligatori**:
1. Implementare consultazione lista VFU
2. Implementare dettaglio VFU
3. Implementare conferimento a CR
4. Correggere endpoint documenti (usare `/rest/concessionario/...`)
5. Implementare gestione stati e azioni permesse

**Raccomandazioni**:
- Verificare se usare API RVFU per lookup invece di Supabase
- Implementare validazione stati prima operazioni
- Migliorare gestione errori con messaggi user-friendly

