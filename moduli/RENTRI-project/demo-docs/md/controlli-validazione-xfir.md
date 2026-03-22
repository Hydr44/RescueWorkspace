## Controlli di validazione del file xFIR

I controlli effettuati dall'endpoint di validazione **<span style="color:#61affe">POST</span> `<ambiente>/formulari/v1.0/xfir/valida`** [vedi documentazione API](javascript:loadApi('formulari')) vengono restituiti raggruppati in diverse categorie in funzione del tipo di controllo effettuato.
Tutti i controlli hanno in comune una proprietà **`codice`** che contiene il nome in codice del controllo, e una proprietà **`esito`** che contiene un valore di un enumerativo che può assumere i valori _Ok_, _Errore_ o _Avviso_. 

Nel modello restituito con l'esito della transazione asincrona per la validazione del FIR digitale i controllli di validazione sono raggruppati in quattro categorie:	

- **`formato`**: contiene l'esito dei controlli relativi all'integrità del file rispetto delle specifiche attese (ZIP, ASiC-E);
- **`schema`**: contiene i controlli relativi alla struttura dati dei file XML presenti nell'archivio e contenenti le informazioni sul FIR;
- **`firme`**: contiene i controlli relativi alle firme digitali apposte sul FIR digitale: la loro validità e la copertura della firma dei file attesi.
- **`vidimazione`**: contiene i controlli relativi alla presenza e alla validità del file di vidimazione del numero FIR che identifica il FIR digitale.

#### 1 - Controlli del formato ASiC-E

I controlli di **`formato`** sono i seguenti:

- **asicIntegrita**: controlla la conformità del file al formato più esterno del file, ossia allo standard .ZIP, in assenza di questo;
- **asicMimeType**: controlla la presenza del file **`mimetype`** nell'archivio .ZIP;
- **asicMimeTypeASiCE**: controlla il valore contenuto nel file **`mimetype`** che deve obbligatoriamente essere la stringa  "application/vnd.etsi.asic-e+zip";
- **asicManifestPresente**: controlla che sia presente il file **`manifest.xml`** previsto dalle specifiche ASiC-E;
- **asicManifestValido**: controlla che il file **`manifest.xml`** sia un XML valido rispetto allo schema definito nell'allegato A.3 delle specifiche <a href="https://www.etsi.org/deliver/etsi_ts/102900_102999/102918/01.02.01_60/ts_102918v010201p.pdf">ETSI TS 102 918 V1.2.1</a>
- **asicManifestMimeType**: controlla che il file **`manifest.xml`** dichiari il _MIME type_ "application/vnd.etsi.asic-e+zip" per il path radice ("/") del container
- **asicFileInContainer**: controlla la presenza nel container dei file dichiarati nel file **`manifest.xml`**
- **asicFileInManifest**: controlla la presenza tra i file dichiarati nel file **`manifest.xml`** dei file trovati all'interno dell'archivio

#### 2 - Controlli sulle informazioni di schema

I controlli di **`schema`** agiscono su ogni file XML presente nel file xFIR tra quelli previsti dalla <a href="/docs?page=guida-tecnica-struttura-fir-digitale">guida</a>.
Il nome del file a cui si riferisce ciascun controllo è contenuto nella proprietà **`nome_file`**, mentre, nella proprietà **`dettaglio`**, può essere presente l'eventuale dettaglio utile a contestualizzare il dato specifico del controllo.

- **schemaDataEmissione**: controlla la presenza della data emissione tra i dati del formulario
- **schemaXmlFormulario**: controlla che il file XML identificato dalla proprietà **`nome_file`** sia ben formato e sia valido secondo lo schema XML Schema definito nella <a href="/docs?page=guida-tecnica-struttura-fir-digitale">guida</a>, nel caso la validazione fallisca l'errore specifico viene inserito nella proprietà **`dettaglio`**.
- **schemaIdTrasportatore**: controlla l'univocità del valore specificato nell'attributo **`id`** per gli oggetti di tipo _fir:Trasportatore_ all'interno dei file XML all'interno dell'xFIR, in particolare quello/i definito/i nel tipo _fir:DatiPartenza_ del file **`partenza.xml`** e quello eventualmente definito nel file **`trasbordo-totale.xml`**
- **schemaRiferimentoTrasportatore**: controlla che il valore definito nell'attributo **`idRef`** per gli oggetti che rappresentano informazioni aggiunte al FIR digitale riferibili ad uno specifico trasportatore (in particolare _fir:Trasporto_, _fir:SostaTecnica_, _fir:TrasbordoParziale_) si riferisca al valore dell'attributo **`id`** di un trasportatore esistente.
- **schemaIdDestinatario**: controlla l'univocità del valore specificato nell'attributo **`id`** per gli oggetti di tipo _fir:DestinatarioSuccessivo_ all'interno dei file XML del contenitore xFIR relativi ad eventuali destinatari successivi al primo, cioè i file **`destinatario-successivo[nnn].xml`**.
- **schemaRiferimentoDestinatario**: controlla che il valore definito nell'attributo **`idRef`** per gli oggetti che rappresentano l'informazione dei dati di accettazione di un destinatario successivo al primo (_fir:Accettazione_) si riferisca al valore **`id`** definito per un destinatario successivo al primo.
- **schemaLookupEer**: controlla la validità del codice EER specificato nei dati di rifiuto del file **`partenza.xml`**;
- **schemaLookupIstat**: controlla la validità del codice ISTAT dei comuni indicati tra i dati anagrafici di produttori e destinatari presenti nei dati dei file XML **`partenza.xml`** e **`destinatario-successivo[nnn].xml`**
- **schemaTipoAllegato**: controlla che il file riconsociuto come allegato (cioè diverso da quelli attesi secondo la specifica della <a href="/docs?page=guida-tecnica-struttura-fir-digitale">guida</a>) sia di tipo PDF;
- **schemaDimensioneAllegato**: controlla che la dimensione del file riconosciuto come allegato PDF sia non più grande di 1 MB.

#### 3 - Controlli sulle firme digitali

I controlli sulle firme digitali agiscono sui file XAdES presenti nel file xFIR, contenuti nella cartella META-INF del contenitore con prefisso "signatures-".

Come il gruppo di controlli precedenti, anche i controlli del gruppo **`firma`** sono definiti nella <a href="/docs?page=guida-tecnica-struttura-fir-digitale">guida</a>.
Il nome del file di firma a cui si riferisce ciascun controllo è contenuto nella proprietà **`nome_file`**, mentre, nella proprietà **`dettaglio`**, può essere presente l'eventuale dettaglio utile a contestualizzare il dato specifico del controllo.

- **asicFirmaFile**: controlla la validità della firma crittografica presente nel file di firma XAdES indicato in **`nome_file`**;
- **asicCertificatoFirma**: controlla la validità del certificato di firma presente nel file di firma XAdES indicato in **`nome_file`**, alla data di apposizione dichiarata nell'elemento "xades:SigningTime" della struttura dati XAdES;
- **asicReferenceFirma**: contolla la presenza nel file xFIR di tutti i file referenziati nella firma digitale;
- **asicFileFirmato**: controlla la presenza del file di firma atteso dalle regole definite nella <a href="/docs?page=guida-tecnica-struttura-fir-digitale">guida</a> per il file XML relativo al FIR digitale indicato in **`nome_file`**;
- **firmaRiferimenti**: controlla che ciascuna firma abbia la _copertura_ attesa rispetto ai file firmati, come descritto nella nella <a href="/docs?page=guida-tecnica-struttura-fir-digitale">guida</a>;
- **firmaNomeFile**: controlla la corrispondenza del nome del file di firma rispetto a quelli definiti nella <a href="/docs?page=guida-tecnica-struttura-fir-digitale">guida</a>;
- **firmaDataDichiarata**: controlla la congruità delle data dichiarate nell'apposizione delle firme ai file che determinano le _fasi_ del ciclo di vita del FIR digitale, definite nella <a href="/docs?page=guida-tecnica-struttura-fir-digitale">guida</a>;
- **firmaIntestazioneSigillo**: controllo che, quando il certificato è rappresentanto da un sigillo elettronico, questo sia intestato allo stesso soggetto a cui è riferibile il dato presente file XML per cui è stata apposta la firma.

#### 4 - Controlli sulle informazioni di vidimazione

I controlli sui dati di vidimazione riguardano il file XML recuperabile attraverso l'endpoint **<span style="color:#49cc90">GET</span> `<ambiente>vidimazione-formulari/v1.0/{codice_blocco}/{progressivo}?xml`**. Il file XML restituito da questo endpoint deve essere incluso nel contenitore xFIR, e viene validato nel contesto del FIR digitale con i seguenti controlli:

- **viViFIRFilePresente**: controlla la presenza del file XML relativo alla vidimazione del numero FIR;
- **viViFIRNumeroCorrispondente**: controlla la corrispondenza tra il numero di vidimazione del presente nel file XML e quello indicato nel file **`partenza.xml`**;
- **viViFIRFileFirma**: controlla la firma del file XML relativo alla vidimazione del numero FIR indicato nel file **`partenza.xml`**, sia in termini crittografici che di corrispondenza del certificato;
- **viViFIRFileTitolarita**: controlla la corrispondenza del soggetto a cui è stato emesso il FIR con il produttore o primo trasportatore del formulario per come indicati nel file **`partenza.xml`**;
- **viViFIRNumeroValidita**: controlla che la vidimazione del numero FIR non sia stata annullata.


---

*Ultimo aggiornamento: 06/11/2025*