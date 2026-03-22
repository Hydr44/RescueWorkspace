## Changelog delle API di Interoperabilità RENTRI

In questo file vengono riportate tutte le modifiche apportate ai servizi delle **API di Interoperabilità RENTRI**.
Il formato del changelog è basato sui principi guida di [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

Per ogni nuovo rilascio, verrà aggiunto un paragrafo che ha come titolo la **data del rilascio**.
All'interno di ogni paragrafo, sono poi elencate tutte le API coinvolte, per le quali vengono descritte le modifiche in maniera specifica.
Le modifiche più recenti sono sempre elencate per prime.

## 🚨 ATTENZIONE

### ca-rentri
A partire dal **03/12/2025** l'endpoint **<span style="color:#49cc90">GET</span> `<ambiente>/ca-rentri/v1.0/ca/{num_seriale_ca_cert}`** restituirà il certificato CA in formato **`byte[]`**, come previsto dal paragrafo *4.2.2.1 delle specifiche RFC 5280*.

### dati-registri
A partire dal **03/12/2025** nel servizio di elaborazione delle registrazioni verrà attivata una nuova regola di validazione dei dati riguardante le registrazioni indicate all'interno della lista di valori `riferimento_operazione` del modello **`MovimentoModel`**.
Nello specifico, potranno essere specificati solo riferimenti a registrazioni esistenti (già trasmesse o meno al RENTRI) **antecedenti per anno/progressivo alla registrazione stessa**.

---

## 🗓️ 07/11/2025

### ca-rentri - v1.0.20251107
Modifiche inerenti al servizio [API - ca-rentri](javascript:loadApi('ca-rentri')).

#### 🌟 Aggiunto
- Nuovo endpoint **<span style="color:#49cc90">GET</span> `<ambiente>/ca-rentri/v1.0/logs/ca/{num_seriale_ca_cert}/certificato/{num_seriale_cert}`** e relativi modelli di dati, per il recupero dell'elenco delle operazioni di firma remota effettuate con il certificato.
- Nuovo endpoint **<span style="color:#49cc90">GET</span> `<ambiente>/ca-rentri/v1.0/credentials/{credentials_id}/signature-logs`** e relativi modelli di dati, per il recupero dell'elenco delle operazioni di firma remota relative alle credenziali.
- Nuovo campo **`serial_number`** nel modello **`CertificateModel`** dell'endpoint **<span style="color:#49cc90">GET</span> `<ambiente>/ca-rentri/v1.0/ca/{num_seriale_ca_cert}`** che contiene il numero seriale del certificato.
- Nuovo campo **`num_iscr_sito`** nel modello **`CredentialsListRequest`** dell'endpoint **<span style="color:#49cc90">GET</span> `<ambiente>/ca-rentri/v1.0/credentials/list`** per specificare una singola unità locale tra i criteri di ricerca.

#### ↪️ Modificato
- Modificati i valori dell'enum **`Stato`** associato al campo **`stato`** utilizzato in vari modelli dell'API:
    - aggiunto il nuovo valore **`Inattivo`** utilizzato per le credenziali come stato assegnato a seguito del blocco del corrispondente dispositivo;
    - il valore **`Revocato`** ora è utilizzato esclusivamente per indicare le credenziali revocate e quindi non più utilizzabili.

### codifiche - v1.0.20251103
Modifiche inerenti al servizio [API - codifiche](javascript:loadApi('codifiche')).

#### 🌟 Aggiunto
- Nuovo endpoint **<span style="color:#49cc90">GET</span> `<ambiente>/codifiche/v1.0/lookup/stati-formulario`** per il recupero dell'elenco degli stati del formulario.

### formulari - v1.0.20251106
Modifiche inerenti al servizio [API - formulari](javascript:loadApi('formulari')).

#### ↪️ Modificato
- Modificato l'endpoint **<span style="color:#61affe">POST</span> `<ambiente>/{numero_fir}/rollback-firma`**: aggiunti vincoli di validazione nella possibilità di invocare l'endpoint. Fare riferimento alla documentazione dell'endpoint per i dettagli.
- Modificato il modello **`FormularioItemResult`** dell'endpoint di elencazione formulari **<span style="color:#49cc90">GET</span> `<ambiente>/formulari/v1.0`**:
	- aggiunto il campo **`versione`** per la restituzione della versione di modifica locale di ciascun formulario presente nell'area virtuale di interscambio;
	- rinominato il campo da **`destinazione_rifiuto`** a **`descrizione_rifiuto`** per un precedente errore nell'assegnazione del nome.
	- modificato il formato del campo **`data_creazione`** ora espresso in UTC.
- Modificata la risorsa [Controlli di validazione del file xFIR](javascript:loadPage('controlli-validazione-xfir')) per la descrizione dei controlli effettuati in fase di validazione di un file xFIR, per l'aggiunta dei controlli **`schemaTipoAllegato`**, **`schemaDimensioneAllegato`** relativo al raggruppamento _schema_, e dei controlli **`asicReferenceFirma`**, **`firmaPresente`**, **`firmaNomeFile`**, **`firmaDataDichiarata`** e **`firmaRiferimenti`** per il raggruppamento _firma_.
- Modificati i modelli di restituzione degli esiti sui controlli di validazione del file xFIR, in particolare **`ControlloFormatoResult`**, **`ControlloSchemaResult`**, **`ControlloFirmeResult`**, **`ControlloVidimazioneResult`**: eliminata la proprietà **`controllo`** perché non più utilizzata.
- Modificato il modello **`EsitoValidaXfirModel`**: eliminata la proprietà **`codice_fiscale_soggetto`** non più utilizzata.
- Modificato l'endpoint **<span style="color:#61affe">POST</span> `<ambiente>/copia-cartacea/caricamento/{num_iscr_sito}`**: per il documento di copia cartacea vengono ora accettati anche i formati JPEG e PNG.

---

## 🗓️ 24/10/2025

### formulari - v1.0.20251023
Modifiche inerenti al servizio [API - formulari](javascript:loadApi('formulari')).

#### ↪️ Modificato
- Modificato il modello **`DatiTrasbordoParzialeModel`** dell'endpoint **<span style="color:#61affe">POST</span> `<ambiente>/{numero_fir}/trasbordo-parziale`**: per la proprietà **`numero_fir`** aggiunta una regola di validazione per la conformità con l'espressione regolare che definisce la numerazione dei FIR.
- Modificato il modello **`DatiTrasbordoParzialeTrasmissioneModel`** degli endpoint **<span style="color:#61affe">POST</span> `<ambiente>/trasmissioni/operatore/{num_iscr_sito}`** e **<span style="color:#61affe">POST</span> `<ambiente>/trasmissioni/soggetto-delegato/{num_iscr_sito}`**: per la proprietà **`numero_fir`** aggiunta una regola di validazione per la conformità con l'espressione regolare che definisce la numerazione dei FIR.

---

## 🗓️ 22/10/2025

### Documentazione
Modifiche inerenti alla documentazione dei [Flussi operativi dei formulari digitali](javascript:loadPage('api-flussi-operativi-formulari-digitali')).

#### ↪️ Modificato
- È stato ampliato e ristrutturato il capitolo _2. Restituzione della copia di un FIR digitale_ 

---

## 🗓️ 13/10/2025

### formulari - v1.0.20251013
Modifiche inerenti al servizio [API - formulari](javascript:loadApi('formulari')).

#### 🌟 Aggiunto
- Nuovo endpoint **<span style="color:#61affe">POST</span> `<ambiente>/formulari/v1.0/{numeroFIR}/xfir`** per l'upload e acquisizione in area virtuale di interscambio di un file xFIR.

#### ↪️ Modificato
- Modificato il modello **`DatiTrasmissionePartenzaModel`** dell'endpoint **<span style="color:#61affe">POST</span> `<ambiente>/trasmissioni/operatore/{num_iscr_sito}`**:
  - il tipo della proprietà **`produttore`** con il nuovo tipo **`DatiProduttoreTrasmissioneModel`**
  - il tipo della proprietà **`destinatario`** con il nuovo tipo **`DatiDestinatarioTrasmissioneModel`**

  per consentire la trasmissione del dato di identificazione dell'unità locale, con la proprietà **`num_iscr_sito`**, quando presente nel FIR digitale.
- Modificato il tipo **`DatiTrasportatoreTrasmissioneModel`** aggiungendo la proprietà **`num_iscr_sito`**, per consentire la trasmissione del dato di identificazione dell'unità locale, quando presente nel FIR digitale.
- Modificato il tipo **`DettaglioFormulario`** aggiungendo la proprietà booleana **`provenienza_upload`** che è valorizzataa a _true_ quando il modello riporta informazioni di un file xFIR presente in area virtuale di interscambio che risulta essere stato prodotto e/o modificato al di fuori di essa e successivamente caricato con l'endpoint **<span style="color:#61affe">POST</span> `<ambiente>/formulari/v1.0/{numeroFIR}/xfir`**.
- Modificato il tipo **`ValidazioneXfirResult`** aggiungendo la proprietà booleana **`valido`** che è valorizzato a _true_ se nessun controllo tra quelli effettuati e presenti nelle altre proprietà del modello ha restituito un codice di errore bloccante.
- Modificato il tipo **`FormularioItemResult`** aggiungendo la proprietà booleana **`is_upload`** che è valorizzato a _true_ se il formulario è stato prodotto e/o modificato al di fuori dell'area virtuale di interscambio

#### 🔧 Corretto
- Nell'endpoint **<span style="color:#61affe">POST</span> `<ambiente>/formulari/v1.0/`** per l'acquisizione della richiesta di creazione di un nuovo FIR:
  - per la proprietà **`produttore`** del modello **`DatiPartenzaModel`** eliminato il tipo **`DatiProduttoreFormularioResultModel`** come possibile modello (*oneOf*) dei dati anagrafici per l'identificazione del produttore (aggiunto alla documentazione per errore con il precedente aggiornamento).
  - modificato il controllo sul parametro opzionale in query-string **`codice_blocco`** che ora valida con successo l'indicazione di un blocco associato alla ditta del soggetto che emette il FIR anche se il blocco non è direttamente legato all'unità locale specificata nella proprietà **`num_iscr_sito`** del modello **`NuovoFormularioModel`**

### Documentazione
Modifiche inerenti alla documentazione dei [Flussi operativi dei formulari digitali](javascript:loadPage('api-flussi-operativi-formulari-digitali')).

#### ↪️ Modificato
- Sono stati aggiornati i seguenti paragrafi per rendere più esplicativo l'utilizzo dei rispettivi flussi operativi:
	- _1.5.6 Rollback dell'ultima firma acquisita_ 
	- _1.7 Annullamento di un FIR digitale_ 

#### 🌟 Aggiunto
- Sono stati aggiunti i paragrafi
	- _1.8 Inserimento di un trasbordo parziale_ 
	- _1.9 Inserimento di un trasbordo totale_ 
	- _1.14 Upload di un file xFIR_
 
- Aggiunta risorsa [Controlli di validazione del file xFIR](javascript:loadPage('controlli-validazione-xfir')) per la descrizione dei controlli effettuati in fase di validazione di un file xFIR

---

## 🗓️ 18/09/2025

### vidimazione-formulari - v1.0.20250904
Modifiche inerenti al servizio [API - vidimazione-formulari](javascript:loadApi('vidimazione-formulari')).

#### ↪️ Modificato
- Nuovo parametro **`senza_numero_pagina`** all'endpoint **<span style="color:#49cc90">GET</span> `<ambiente>/vidimazione-formulari/v1.0/{codice_blocco}/{progressivo}/pdf`**.

### formulari - v1.0.20250904
Modifiche inerenti al servizio [API - formulari](javascript:loadApi('formulari')).

#### ↪️ Modificato
- Rinominati i seguenti modelli: da **`DatiProduttoreFormularioModel`** a **`DatiProduttoreFormularioResultModel`**, da **`DatiDestinatarioFormularioModel`** a **`DatiDestinatarioFormularioResultModel`**, da **`DestinatarioSuccessivoResultModel`** a **`DatiDestinatarioSuccessivoResultModel`** dell'endpoint **<span style="color:#49cc90">GET</span> `<ambiente>/formulari/v1.0/{numero_fir}`**.

#### 🌟 Aggiunto
- Nuovo campo **`num_iscr_sito`** nei modelli **`DatiProduttoreFormularioResultModel`**, **`DatiDestinatarioFormularioResultModel`**, **`DatiDestinatarioSuccessivoResultModel`**, **`DatiTrasportatoreFormularioResultModel`** dell'endpoint **<span style="color:#49cc90">GET</span> `<ambiente>/formulari/v1.0/{numero_fir}`**.
- Nuovo endpoint **<span style="color:#61affe">POST</span> `<ambiente>/formulari/v1.0/{numero_fir}/note-annullamento`** per l'aggiunta delle note di annullamento.
- Nuovo endpoint **<span style="color:#61affe">POST</span> `<ambiente>/formulari/v1.0/{numero_fir}/rollback-firma`** per la richiesta di rollback della firma.

#### 🔧 Corretto
- Nel modello **`AnalisiClassificazioneModel`** dell'endpoint **<span style="color:#19abff">POST</span> `<ambiente>/formulari/v1.0`** i campi **`tipo`** e **`numero`** sono ora obbligatori.

#### ❌ Rimosso
- Rimosso il campo **`trasportatore_id`** nel modello **`DatiTrasportatoreFormularioBaseModel`** in quanto non necessario nel modello di input: l'identificatore è contestuale al FIR e assegnato automaticamente dalla procedura di creazione.

#### ⚠️ Deprecato
- Deprecato endpoint **<span style="color:#61affe">POST</span> `<ambiente>/formulari/v1.0/{numero_fir}/annulla`** a favore di **<span style="color:#61affe">POST</span> `<ambiente>/formulari/v1.0/{numero_fir}/annulla-fir`**

### Documentazione
Modifiche inerenti alla [Guida tecnica alla struttura del Registro cronologico di carico e scarico dei rifiuti in formato digitale](javascript:loadPage('registro-digitale')).

#### ↪️ Modificato
- Nel paragrafo *3.2.2 Blocco "Riferimenti Precedenti"* è stata aggiunta una nota che specifica la possibilità di inserire unicamente il riferimento all’ultima esportazione, oltre a quello della vidimazione.

---

## 🗓️ Rilasci precedenti
I rilasci precedenti sono elencati in questa pagina: [Changelog - Rilasci precedenti](javascript:loadPage('changelog-archivio-demo')).
