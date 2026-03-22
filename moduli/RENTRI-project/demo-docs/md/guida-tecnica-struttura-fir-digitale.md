# Guida tecnica alla struttura del FIR digitale

In attuazione del Decreto del Ministro dell'Ambiente e della Sicurezza Energetica di concerto con il Ministro dell'Economia e delle Finanze del 4 aprile 2023, n. 59.  
Regolamento recante:  
«Disciplina del sistema di tracciabilità dei rifiuti e del registro elettronico Nazionale per la tracciabilità dei rifiuti ai sensi dell'articolo 188-bis del decreto legislativo 3 aprile 2006, n. 152»

## 1. Scopo del documento

Questa guida tecnica è stata realizzata con l’obiettivo di spiegare la struttura del modello dati previsto nel RENTRI per rappresentare in modalità digitale il FORMULARIO per l’identificazione dei rifiuti trasportati (xFIR) consentendo così all’Operatore di adottare soluzioni alternative all’utilizzo dei servizi applicativi API RENTRI (*in linea con il paradigma “API-first approach” richiesto anche dalla Commissione Europea per lo sviluppo dei sistemi informativi delle Pubbliche Amministrazioni*) 
resi accessibili e documentati nella pagina dedicata ai formulari digitali del Portale [RENTRI-API Documentazione Interoperabilità RENTRI](/docs?page=api-flussi-operativi-formulari-digitali).

In questo documento si esamina dal punto di vista tecnico la struttura del formulario digitale, che identificheremo con la sigla “xFIR”, senza entrare nel merito delle regole amministrative per la corretta compilazione del formulario per le tutte le possibili tipologie di movimentazioni, in quanto tali indicazioni sono già state fornite nel documento “*Allegato 2*” al Decreto Direttoriale n.251/2023 - “*Modalità di compilazione del modello di cui all’art.4 del D.M. n.59 del 2023*” - “*Istruzioni per la compilazione del registro cronologico di carico e scarico rifiuti*”, reperibile al seguente indirizzo:

<https://www.rentri.gov.it/decreti-direttoriali/istruzioni-manuali-e-guide-sintetiche/modalita-di-compilazione-del-registro-di-carico-e-scarico-e-del-formulario>

## 2. Riferimenti normativi

Quanto esposto nel seguito deriva dalle disposizioni normative in materia ambientale, delle quali si riportano solo i riferimenti ritenuti fondamentali.

-   DECRETO LEGISLATIVO 3 aprile 2006, n. 152,

    Art. 193 - (*Trasporto dei rifiuti*)  
    &nbsp;&nbsp;2\. Con il decreto di cui all'articolo 188-bis, comma 1, sono disciplinati il modello del formulario di identificazione del rifiuto e le modalità di numerazione, vidimazione, tenuta e trasmissione al Registro elettronico nazionale, con possibilità di scaricare dal medesimo Registro elettronico il formato cartaceo. Possono essere adottati modelli di formulario per particolari tipologie di rifiuti ovvero per particolari forme di raccolta.

-   DECRETO Ministeriale 4 aprile 2023, n. 59

    &nbsp;&nbsp;Art. 5 - (*Disposizioni generali sul formulario di identificazione del rifiuto*)  
    &nbsp;&nbsp;Art. 7 - (*Formulario di identificazione del rifiuto in formato digitale*)

-   Decreto Direttoriale n. 143 del 6 novembre 2023
    
    &nbsp;&nbsp;9\. MODALITÀ OPERATIVA: Emissione e gestione in formato digitale del FIR    
    &nbsp;&nbsp;17\. MODALITÀ OPERATIVA: Specifiche tecniche

-   Decreto Direttoriale n. 251 del 19 dicembre 2023

    &nbsp;&nbsp;Modalità di compilazione del modello di cui all’art.5 del D.M. n.59 del 2023    
    &nbsp;&nbsp;*Istruzioni per la compilazione del formulario di identificazione del rifiuto (FIR)*


Eventuali modifiche e/o integrazioni a questi provvedimenti potrebbero comportare la revisione del presente documento.

## 3. Contestualizzazione del quadro normativo di riferimento

L’utilizzo del formulario digitale è un obbligo previsto dal D.Lgs. 152/2006 all’Art. 188-bis comma 5, “*Gli adempimenti relativi agli articoli 190 e 193 sono effettuati digitalmente da parte dei soggetti obbligati ovvero di coloro che intendano volontariamente aderirvi ai sensi del ((comma 3-bis del presente articolo)); negli altri casi i suddetti adempimenti possono essere assolti mediante il formato cartaceo. In entrambi i casi la modulistica è scaricabile direttamente dal Registro elettronico nazionale*.”

La completa dematerializzazione del formulario è prevista dal successivo DM 59/2023 che, all’Art. 7 istituisce e disciplina il Formulario di identificazione del rifiuto in formato digitale.

Inoltre, è indispensabile sottolineare che nell’implementazione della soluzione per il FIR digitale, viene rispettato quanto previsto dall’Articolo 20 del D.Lgs. n. 82/2005 (CAD) in merito alla “*Validità ed efficacia probatoria dei documenti informatici*” ed in particolare il comma «1-bis»:

“*Il documento informatico soddisfa il requisito della forma scritta e ha l'efficacia prevista dall'articolo 2702 del Codice civile quando vi è apposta una firma digitale, altro tipo di firma elettronica qualificata o una firma elettronica avanzata o, comunque, è formato, previa identificazione informatica del suo autore, attraverso un processo avente i requisiti fissati dall'AgID ai sensi dell'articolo 71 con modalità tali da garantire la sicurezza, l’integrità e l’immodificabilità del documento e, in maniera manifesta e inequivoca, la sua riconducibilità all'autore. In tutti gli altri casi, l'idoneità del documento informatico a soddisfare il requisito della forma scritta e il suo valore probatorio sono liberamente valutabili in giudizio, in relazione alle caratteristiche di sicurezza, integrità e immodificabilità. La data e l'ora di formazione del documento informatico sono opponibili ai terzi se apposte in conformità alle Linee guida.*”

Inoltre, per quanto attiene alla regolamentazione sul piano tecnologico, è importante considerare quanto previsto a livello comunitario dal Regolamento UE n 910/2014 sull’identità digitale, comunemente noto come regolamento eIDAS (*electronic IDentification Authentication and Signature*) che, all’Articolo 46 del regolamento, “*Effetti giuridici dei documenti elettronici*” dispone che: “*A un documento elettronico non sono negati gli effetti giuridici e l’ammissibilità come prova in procedimenti giudiziali per il solo motivo della sua forma elettronica*.”

## 4. La soluzione adottata per il formulario digitale

La soluzione scelta per il formulario digitale consiste nella produzione di un documento nativamente informatico, in grado di accettare tutti i tipi di integrazione prevista durante tutto il ciclo di vita del documento, senza per questo alterare le informazioni formatesi nel tempo, e raccolte in esso.

Sulla base di questo principio, si definiscono le regole per la costruzione (formazione) del documento informatico in modo assolutamente disgiunto dalla modalità di rappresentazione grafica del documento stesso, ovvero, il modello di FIR come previsto nel DM n.59/2023, che rappresenta “solo” un possibile formato di stampa del documento informatico.

Questa caratteristica ha suggerito la definizione del suffisso “*xFIR*” (*extended FIR*) per qualificare e distinguere questo nuovo documento informatico. Pertanto, i file dei formulari digitali prodotti secondo le regole definite in RENTRI, saranno riconoscibili dal suffisso “.*xfir*”.

I file dei formulari digitali conterranno, come vedremo in seguito, le informazioni in formato XML secondo lo schema descritto in questo documento, e ciascun file XML deve essere coperto da firma digitale come descritto al paragrafo 
[Struttura delle Firme del formulario xFIR](#11-struttura-delle-firme-del-formulario-xfir).

## 5. Struttura del documento informatico di tipo “xFIR”

La struttura del FIR digitale, in quanto documento informatico, deve coniugare un modello dati derivato da quanto previsto dall’Allegato II al DM n.59/2023 (Art. 5 comma 1), con i requisiti funzionali visti nel paragrafo precedente. La soluzione sarà quindi rappresentata da un classico schema dati di tipo XSD, unitamente a delle regole necessarie a gestirne un utilizzo dinamico, e poiché l’aspetto dinamico implica la necessità di tracciare l’evoluzione incrementale dei dati raccolti nel FIR, il tutto sarà inserito in un “contenitore” la cui struttura è definita da standard riconosciuti a livello comunitario.

Pertanto, il documento informatico di tipo “xFIR” consiste sostanzialmente in un “*container*” di tipo ASiC (*Associated Signature Container*) rispondente alle specifiche definite dall’ETSI (*European Telecommunications Standards Institute*).

Tale formato è stato recentemente adottato anche dal Regolamento di esecuzione (UE) 2024/2979 del 28 novembre 2024 recante modalità di applicazione del regolamento (UE) n. 910/2014 del Parlamento europeo e del Consiglio per quanto riguarda l’integrità e le funzionalità di base dei portafogli europei di identità digitale. (*G.U. 2a Serie Speciale - Unione Europea n. 9 del 3-2-2025*).

I documenti originali delle specifiche tecniche del formato “*Associated Signature Containers* (ASiC)” sono reperibili direttamente dal portale [www.etsi.org](http://www.etsi.org) ai seguenti indirizzi:

-   Part 1: Building blocks and ASiC baseline containers: [ETSI EN 319 162-1 V1.1.1 (2016-04)](https://www.etsi.org/deliver/etsi_en/319100_319199/31916201/01.01.01_60/en_31916201v010101p.pdf)  

-   Part 2: Additional ASiC containers: [ETSI EN 319 162-2 V1.1.1 (2016-04)](https://www.etsi.org/deliver/etsi_en/319100_319199/31916202/01.01.01_60/en_31916202v010101p.pdf)

Per l’implementazione dell’xFIR è stato scelto il formato tipo ASiC-E (*Associated Signature Container Extended*) nella forma compressa: **mimetype=application/vnd.etsi.asic-e+zip**.

In breve, la caratteristica di un container ASiC-E consiste nella possibilità di supportare più file firmati in tempi diversi e con firme diverse. Ogni oggetto può avere informazioni e metadati aggiuntivi associati che possono essere protetti da una qualsiasi delle firme presenti nel contenitore. Il contenitore può essere progettato per impedire ulteriori modifiche o consentire che i file, le firme e le asserzioni temporali aggiuntive, possano essere inclusi in un secondo momento nel container senza invalidare le firme precedenti.

Queste caratteristiche consentono di aggiungere all’interno del contenitore nuovi file dati, per effetto dell’evoluzione delle informazioni raccolte, e di firmarli mantenendo allo stesso tempo valide tutte le firme apposte ai file già presenti.

Un container “vuoto” di questo tipo appare come un file compresso (ZIP) con il seguente contenuto minimo:

![Container vuoto](/docs/media/image0.png)  
<span style="font-size:small;font-style:italic">Figura 1 - Container ASiC-E+zip "vuoto"</span>

La regola “generale” di nomenclatura di un file affinché questo sia identificato come un container ASiC, prevede l’utilizzo del suffisso ".*asice*" oppure ".*sce*" per i nomi brevi. Tuttavia, in questo ambito di utilizzo, per rappresentare un FIR digitale si utilizzerà l’estensione “**.xfir**” (“.*fir*” per i nomi brevi).

Nel seguito si riportano i principali requisiti per la creazione di un container ASiC per quanto attiene all’utilizzo in RENTRI, derivati dalla documentazione ufficiale “*Building blocks and ASiC baseline containers*” indicata sopra.

-   I primi 4 byte del container ASiC devono assumere il valore esadecimale "50 4B 03 04".
-   Il file **mimetype** deve essere il primo file inserito nel container ASiC;
-   Il file **mimetype** non deve contenere alcun "*extra fields*" nel proprio header ZIP (l’offset 28 dell’header ZIP “*extra field length*” deve essere posto a zero ‘0x00’);
-   Il file **mimetype** non deve essere compresso (l’offset 8 dell’header ZIP “*compression method*” deve essere posto a zero ‘0x00’);
-   Il file **mimetype** deve contenere solo la definizione **application/vnd.etsi.asic-e+zip**;
-   Deve esistere una cartella di nome **META-INF** nella quale dovrà essere presente il file **manifest.xml** che rappresenta l’indice di tutti i file (oggetti) inseriti nel container;
-   Nella cartella “META-INF/” si dovranno inserire tutti i file di firma "*\*signatures\*.xml*";
-   Ciascun file di firma deve contenere un'unica firma XAdES nel nodo contenitore asic:XAdESSignatures in cui i file di dati firmati devono essere referenziati direttamente da ciascuna firma con un set di elementi “*ds:Reference*”.
-   Ogni file (*oggetto*) inserito nel container, diverso da un file di firma, deve trovarsi al di fuori della cartella “META-INF/”;

La figura seguente rappresenta la struttura tipica del container ASiC-E, nella quale si pone in evidenza come l'elemento “ds:Reference” viene utilizzato per fare riferimento direttamente agli oggetti firmati.

![Struttura ASiC-E](/docs/media/image1.png)  
<span style="font-size:small;font-style:italic">Figura 2 - Struttura ASiC-E in modalità XAdES e con utilizzo diretto di "ds:Reference"</span>

Il file **manifest.xml** presente nella cartella **META-INF** dovrà contenere l’elenco degli oggetti inseriti nel container. Nella sua forma minima, troviamo le informazioni di base necessarie a qualificare il container secondo lo standard OCF (OEBPS Container Format) e ODF (Open Document Format).

![Contenuto manifest.xml](/docs/media/image2.png)  
<span style="font-size:small;font-style:italic">Figura 3 - Contenuto di base del file "maifest.xml"</span>

Quanto visto fino a questo punto rappresenta la struttura di base di un container “ASiC-E+zip”, nel seguito, saranno esposti gli elementi che caratterizzano il documento elettronico di tipo “xFIR”.

## 6. Creazione di un Formulario digitale “xFIR”

Nel presente capitolo si fa riferimento alle API raggiungibili ai seguenti indirizzi in ambiente dimostrativo

Area documentativa dimostrativa: <https://demoapi.rentri.gov.it> nella sezione API

Una volta avvenuto il passaggio in produzione le API saranno raggiungibili dal medesimo indirizzo in ambiente di produzione

Area documentativa effettiva: https://api.rentri.gov.it

La creazione di un Formulario “xFIR” inizia nel momento in cui si inserisce nel container, avente le caratteristiche descritte sopra, il file XML identificativo della vidimazione virtuale ottenuta da RENTRI mediante gli appositi servizi (vedi la descrizione “*Flussi Operativi Formulari*” [1.2 Vidimazione di un FIR](/docs?page=api-flussi-operativi-formulari#1-2-vidimazione-di-un-fir)).

Si richiama l’attenzione alla modalità operativa “*10. Vidimazione del FIR digitale tramite interoperabilità con sistemi gestionali*”. Il servizio consente all’operatore che produce il FIR in formato digitale con un proprio sistema gestionale, di accedere tramite la piattaforma telematica RENTRI (mediante API) al servizio per la vidimazione digitale messo a disposizione dalle Camere di Commercio (CCIAA), qualificandosi attraverso un certificato digitale rilasciato da una Autorità di Certificazione qualificata in conformità al Regolamento (UE) n. 910/2014 – “eIDAS”, oppure mediante il sigillo elettronico rilasciato dall’Autorità di certificazione di dominio RENTRI.

L’operazione di vidimazione con esito positivo, tra le varie informazioni (vedi il servizio “*API Vidimazione Formulari*” [(POST) [ASYNC] Vidimazione nuovo FIR](/docs?api=vidimazione-formulari&v=v1.0#/paths/codice_blocco/post) e [(GET) Dati Vidimazione FIR](/docs?api=vidimazione-formulari&v=v1.0#/paths/codice_blocco---progressivo/get)), restituisce due oggetti particolarmente rilevanti per la costruzione del documento xFIR:

-   &lt;“**xml**”&gt;: contenente la serializzazione del file XML relativo alla vidimazione virtuale;
-   &lt;“**qr_code_bytes**”&gt;: contenente la serializzazione[^1] di un array di byte utilizzato per la creazione dell'immagine del QR code per la rappresentazione del FIR in formato PDF.

> ℹ️ **NOTA** [^1]
> 
> Le API RENTRI utilizzano la serializzazione JSON che è un protocollo testuale: gli array di byte vengono codificati in una stringa base64


![Esempio response vidimazione](/docs/media/image3.png)  
<span style="font-size:small;font-style:italic">Figura 4 - Esempio di response - Dati di vidimazione FIR</span>

Entrambi questi oggetti devono essere collocati nella **radice** (root “/”) del container, nominandoli con lo stesso identificativo del FIR ottenuto dalla vidimazione, e associando rispettivamente il suffisso .**xml** e .**cbor**  
|                                 |                            |                                 |
|---------------------------------|----------------------------|---------------------------------|
|File di vidimazione              | “**VVVVC 000014 VY.xml**”  | (media-type="text/xml")         |
|File per la stampa del QR code   | “**VVVVC 000014 VY.cbor**” | (media-type="application/cbor") |

![Primi tre elementi](/docs/media/image4.png)  
<span style="font-size:small;font-style:italic">Figura 5 - Primi tre elementi inseriti nel file "maifest.xml" che qualificano il FIR digitale.</span>

Oltre ai due elementi derivanti dalla vidimazione, è previsto anche l’inserimento di un terzo file che avrà sempre il nome “**metadati.xml**” avente una funzione puramente descrittiva.

Lo schema per la definizione di questo file è contenuto nello schema XSD generale del formulario digitale

![Schema metadati](/docs/media/image5.png)  
<span style="font-size:small;font-style:italic">Figura 6 - Schema XSD del file "metadati.xml" \<xs:complexType name="Metadati"\>.</span>

Questo file contiene informazioni utili al riconoscimento dello strumento utilizzato per la produzione del documento xFIR, e della data/ora in cui il documento xFIR è stato effettivamente creato per la prima volta.

![Contenuto metadati](/docs/media/image6.png)  
<span style="font-size:small;font-style:italic">Figura 7 - Contenuto del file informativo "metadati.xml".</span>

Le informazioni sopra indicate(*\<fir:Versione\>, \<fir:Autore\> {IdSoftware, VersioneSoftware}*) non sono codificate in RENTRI, ogni produttore di software potrà inserire in questo file le informazioni che riterrà utili al riconoscimento dello strumento utilizzato per la produzione del documento xFIR.

Tali informazioni potranno essere utilizzate dai produttori di software per proprie finalità.

> ⚠️ **ATTENZIONE**
> 
> Per questi primi tre file, “**{NumeroFIR}.xml**”, “**{NumeroFIR}.cbor**”, e “**metadati.xml**” non troveremo alcun file di firma disgiunta abbinato nella cartella **META-INF** perché i primi due file sono già stati firmati da RENTRI, ciascuno a proprio modo nel momento della loro emissione, e trattandosi dei dati della vidimazione virtuale, rappresentano l’elemento di identificazione nativa del documento xFIR.

Il file “*metadati.xml”* non necessita di alcuna firma in quanto si tratta di un elemento puramente informativo non rilevante ai fini della consistenza e della validità del documento elettronico.

## 7. File della vidimazione virtuale FIR “rentri:vidimazione-fir”

La struttura del file XML della vidimazione digitale ottenuta attraverso RENTRI, mediante il servizio messo a disposizione dalle Camere di Commercio (CCIAA), appare nel modo seguente:

![Struttura vidimazione](/docs/media/image7.png)  
<span style="font-size:small;font-style:italic">Figura 8 - Struttura della vidimazione virtuale del Formulario richiesto via Portale RENTRI Servizi essenziali.</span>

Gli attributi evidenziati rappresentano gli elementi che sono presenti anche nell’array utilizzato per la rappresentazione del QR code.

-   \<NumeroFir\>
-   \<DataRichiesta\>
-   \<CodiceFiscaleSoggetto\>
-   \<CCIAANome\>
-   \<NumIscrSito\>

Gli attributi che identificano colui che richiede la vidimazione sono estratti dall’identità digitale di chi effettua la richiesta al RENTRI: se la richiesta avviene dal portale applicativo mediate i servizi di supporto il richiedente viene identificato mediante l’identità digitale (SPID/CIE/CNS), mentre quando la vidimazione viene richiesta con modalità applicativa (API) i dati del richiedente sono estratti dal certificato di autenticazione. Quindi, nel caso in cui la vidimazione venga richiesta via API utilizzando il certificato di interoperabilità RENTRI, le informazioni sul richiedente e sul titolare della vidimazione coincideranno.
|                                | &larr; uguali se richiesto via API con certificato di interop. RENTRI &rarr; |                              |
|--------------------------------|------------------------------------------------------------------------------|------------------------------|
| \<fd:IdentificativoRichiesta\> |                                                                              | \<fd:CodiceFiscaleSoggetto\> |
| \<fd:AutoreRichiesta\>         |                                                                              | \<fd:DenominazioneSoggetto\> |

### 7.1 File per la produzione del QR code della vidimazione virtuale FIR

L’array di byte ottenuto dell’attributo &lt;"**qr_code_bytes**"&gt; contiene le informazioni per la produzione dell'immagine del QR code da apporre sul FIR riprodotto in formato PDF.

Questa informazione contiene una firma digitale apposta dal RENTRI e può essere quindi prodotta solo da RENTRI, l’utente può solamente utilizzarla per la generazione dell’immagine del QR code, oppure, per ogni eventuale processo che si basi sulla lettura del QR code.

![Esempio QR code](/docs/media/image8.png)  
<span style="font-size:small;font-style:italic">Figura 9 - Esempio di QR code e del rispettivo testo rappresentato.</span>

La stringa letta dal QR code è codificata in Base45 ([RFC 9285](https://datatracker.ietf.org/doc/rfc9285/)) e l'array di byte che si ricava dalla decodifica consiste in una struttura dati binaria di tipo CBOR (“*Concise Binary Object Representation*” [RFC 8949](https://datatracker.ietf.org/doc/rfc8949/)) firmata secondo il protocollo COSE_Sign1 (“*CBOR Object Signing and Encryption*” [RFC 8152](https://datatracker.ietf.org/doc/rfc8152/)).

A titolo puramente esemplificativo, nella figura seguente si rappresenta in chiaro quanto contenuto nella struttura binaria CBOR esposta in *Figura 9*.

![Struttura dati binaria CBOR](/docs/media/image10a.png)  
<span style="font-size:small;font-style:italic">Figura 10 - Rappresentazione “in chiaro” della struttura dati binaria di tipo CBOR.</span>

In questo ambito, è sufficiente ricordare che gli attributi recuperabili dall’oggetto binario sono identificati dal numero d’ordine assegnato come evidenziato nella tabella di *Figura 11*.

Ulteriori dettagli e un esempio di codice programma per la lettura di questo oggetto è esposta al punto “[1.3.4 Interpretazione dei dati sul QR code del FIR vidimato](/docs?page=api-flussi-operativi-formulari#1-3-4-interpretazione-dei-dati-sul-qr-code-del-fir-vidimato) ” della documentazione online [RENTRI Api Docs](/docs?page=api-flussi-operativi-formulari#1-2-4-recupero-dell-esito-di-una-transazione-asincrona).

|                                         |
|-----------------------------------------|
| 0. Numero FIR                           |
| 1. Codice fiscale soggetto              |
| 2. Numero iscrizione Unità Locale (\*)  |
| 3. Data rilascio (secondi da Epoch[^2]) |
| 4. Sigla CCIAA                          |
| 5. Identificativo certificato           |
| 6. Demo flag                            |

<span style="font-size:small;font-style:italic">Figura 11 - Enumerazione degli attributi contenuti nella struttura dati binaria di tipo CBOR</span>

> ℹ️ **NOTA** [^2]  
> [https://pubs.opengroup.org/onlinepubs/9799919799/basedefs/V1_chap03.html\#tag_03_125](https://pubs.opengroup.org/onlinepubs/9799919799/basedefs/V1_chap03.html#tag_03_125)

### 7.2 Esposizione dei dati della vidimazione sul FIR

Nel caso si utilizzino processi di stampa dei formulari alternativi a quello offerto dalle API di vidimazione, è sempre richiesto di esporre il QR Code prodotto codificando in base 45 l’array di byte ottenuto dall’attributo &lt;"**qr_code_bytes**"&gt;.

![Struttura dati binaria CBOR](/docs/media/image10.png)  
<span style="font-size:small;font-style:italic">Figura 12 – Riproduzione della Sezione VIDIMAZIONE nel Formulario stampato.</span>

La vidimazione a piè di pagina del FIR prodotto in formato PDF si compone di tre parti:

| (1) Elementi che identificano la richiesta di emissione di un FIR                                                          |
|----------------------------------------------------------------------------------------------------------------------------|
| **Proprietà FIR:**  <ul><li>\<fd:DataRichiesta\></li><li>\<fd:CCIAANome\></li><li>\<fd:CodiceFiscaleSoggetto\></li><li>\<fd:DenominazioneSoggetto\></li></ul>|
| **Testo fisso di congiunzione delle proprietà precedenti**  <ul><li>“Vid.Virt. del”</li><li>“per conto della”</li><li>“rich. da”</li></ul>|  
  
  
| (2) Identificativo Univoco del FIR    |
|---------------------------------------|
| **Proprietà FIR:**  <ul><li>\<fd:NumeroFir\></li></ul> |


| (3) QR code                                               |
|-----------------------------------------------------------|
| **Formato CBOR dell’Attributo:**  <ul><li>\<"qr_code_bytes"\></li></ul> |


Nella figura seguente si mostra un esempio di costruzione della vidimazione a piè di pagina. 


|                                            |                                                                                                                                                                                                   |
|--------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| *Parte (1):*                               | {“Vid.Virt. del ” + \<DataRichiesta\> + “ per conto della ” + \<CCIAANome\> + “ rich. da ” + \<CodiceFiscaleSoggetto\> + “ - ” + \<DenominazioneSoggetto\>}                                       |
| *Risultato:*                               | Vid.Virt. del 13/02/2025 08:28 per conto della Camera di Commercio di Padova, rich. da 03991350376 - "ECOCERVED SOCIETA' CONSORTILE A RESPONSABILITA' LIMITATA", O IN BREVE “ECOCERVED S.C.A.R.L.”|
|                                            |                                                                                                                                                                                                   |
| *Parte (2):*                               | { \<NumeroFir\> }                                                                                                                                                                                 |
| *Risultato:*                               | **VVVVC 000276 SH**                                                                                                                                                                               |
|                                            |                                                                                                                                                                                                   |
| *Parte (3):*                               | { \<"qr_code_bytes"\> } in formato CBOR  |
| *Risultato:*                               | (QR code ISO/IEC 18004:2015 con livello ‘H’) ![qrcode](docs/media/image10.png) |

<span style="font-size:small;font-style:italic">Figura 13 - Esempio di costruzione della vidimazione a piè di pagina.<span>

Nell’ipotesi in cui s’intendesse implementare una propria funzione di “*Verifica*” dei FIR partendo dalla lettura del QR code, è necessario ricavare l’attributo {\<NumeroFir\>} dal QR code attraverso la deserializzazione della struttura dati binaria CBOR come indicato in precedenza, al fine di poter invocare il servizio API “**GET \<ambiente\>/verifica/{numero_fir}**”.

> ⚠️ **ATTENZIONE**
> È opportuno verificare sempre le informazioni rilevate dai QR Code di FIR “*custom made*”, che non devono contenere alcuna URL, così da escludere eventuali clonazioni con rimandi a servizi di verifica web non ufficiali.

> ⚠️ **ATTENZIONE**
> Il numero del formulario {\<NumeroFir\>} deve sempre essere presente sul documento di trasporto stampato, così come deve sempre essere presente anche l’immagine grafica del codice QR (Quick Reader code), prodotto con capacità di recupero di errore del 30% (*vedi norma ISO/IEC 18004:2015 con livello ‘H’ di correzione d'errore*).

## 8. I file XSD che definiscono il modello dati xFIR

Il modello dati del Formulario digitale RENTRI è definito mediante uno schema di tipo XSD (*XML Schema Definition*) basato su standard aperti per ottenere la validazione rigorosa dei dati.

Gli schemi XSD di RENTRI sono attualmente raggiungibili ai seguenti indirizzi sia attraverso l’area documentativa del portale RENTRI, oppure direttamente per ogni finalità applicativa:

|                                            |                                                           |                                                                                                                                      
|--------------------------------------------|-----------------------------------------------------------|
|Area documentativa dimostrativa:            | https://demoapi.rentri.gov.it/docs?page=schemi-xsd-demo   |
|Link diretto in ambiente dimostrativo:      | https://demoapi.rentri.gov.it/docs/assets/{nome_file.xsd} |  

Gli schemi XSD di RENTRI saranno raggiungibili ai seguenti indirizzi una volta che avverrà il passaggio in produzione, analogamente a quanto avvenuto per la documentazione relativa al registro cronologico di carico e scarico:

|                                            |                                                          |
|--------------------------------------------|----------------------------------------------------------|
|Area documentativa effettiva:               | https://api.rentri.gov.it/docs?page=schemi-xsd           |
|Link diretto in ambiente effettivo:         | https://api.rentri.gov.it/docs/assets/{nome_file.xsd}    |  

Il modello dati del formulario elettronico xFIR è definito dai seguenti file XSD:

-   **rentri-formulario-1.0.xsd**
-   **rentri-common-1.0.xsd**
-   **rentri-enum-1.0.xsd**

Il file “**rentri-formulario-1.0.xsd**” rappresenta il file “master” che definisce tutti i tipi di dato complessi usati nei file XML previsti nel formulario digitale, ed anche eventuali ulteriori elementi a corollario del documento di trasporto.

Il file “**rentri-common-1.0.xsd**” è incluso nel “master” e contiene le definizioni di alcuni tipo complessi che in ambito RENTRI sono comuni ad analoghe definizioni previste in altri contesti (ad es. nell’esportazione dei registri digitali).

Il file “**rentri-enum-1.0.xsd**” è incluso nel “master” e contiene le definizioni dei tipi enumerativi che in ambito RENTRI sono comuni ad analoghe definizioni previste in altri contesti (ad es. nell’esportazione dei registri digitali). Tali definizioni derivano dalle tabelle di codifica standardizzate esposte nella sezione “*allegati*” delle istruzioni pubblicate con il Decreto direttoriale n.251 del 19 dicembre 2023

-   Allegato 1 [Istruzioni per la compilazione del registro cronologico di carico e scarico rifiuti](https://www.rentri.gov.it/default/media/normative/decreti-direttoriali/decreto_direttoriale_251_allegato1_istruzioni_compilazione_registro.pdf)
    -   *5.2 Tabella 2 - Caratteristiche di pericolo*
    -   *5.3 Tabella 3 - Stato fisico*
    -   *5.4 Tabella 4 - Operazioni di recupero*
    -   *5.5 Tabella 5 - Operazioni di smaltimento*
    -   *5.6 Tabella 6 - Causali di respingimento*
-   Allegato 2 [Istruzioni per la compilazione del formulario di identificazione del rifiuto](https://www.rentri.gov.it/default/media/normative/decreti-direttoriali/decreto_direttoriale_251_allegato_2_istruzioni_compilazione_fir.pdf)
    -   *3.2 Tabella 2 – Caratteristiche di pericolo*
    -   *3.3 Tabella 3 – Stato fisico*
    -   *3.4 Tabella 4 - Causali di respingimento*

Eventuali revisioni ai modelli XSD saranno documentate nella sezione informativa del Portale RENTRI-API “*Documentazione Interoperabilità RENTRI*” e commentate convenzionalmente nell’header del file stesso.

> ⚠️ **ATTENZIONE**
> Al fine di evitare eventuali incoerenze tra quanto esposto in questo documento e il reale stato di aggiornamento dei modelli dati, si raccomanda di consultare sempre i dati/modelli pubblicati sul portale RENTRI agli indirizzi forniti in precedenza nel paragrafo “*I file XSD che definiscono il modello dati xFIR*”, che avranno sempre la priorità come “documento originale” in caso si dovessero riscontrare eventuali diversità.

### 8.1 Struttura dei dati del formulario xFIR

Al fine di poter beneficiare di una semplicità nella maggior parte dei casi di utilizzo, il modello dati completo del documento elettronico xFIR è rappresentato da un insieme di blocchi dati distinti, che saranno utilizzati all’occorrenza per gestire le diverse casistiche, formando più file dati di tipo XML durante il ciclo di vita del formulario, e contenenti ciascuno i dati afferenti ad uno specifico “momento” o fase del trasporto.

L’immagine seguente rappresenta il risultato finale del contenuto di un formulario xFIR che ha completato il proprio ciclo di vita. Sul lato sinistro sono esposti i file dati prodotti nelle varie fasi del trasporto, mentre sul lato destro si rappresenta il contenuto della cartella “**META-INF**” che, come si è visto in precedenza, contiene il catalogo “**manifest.xml**” di quanto è contenuto nell’xFIR, e i file delle rispettive firme digitali.

| ![Risultato root](docs/media/image11.png) | ![Risutlato META-INF](docs/media/image12.png) |
|-------------------------------------------|-----------------------------------------------|

<span style="font-size:small;font-style:italic">Figura 14 - Esplorazione del contenuto di un formulario digitale in formato xFIR.<span>

> ℹ️ **NOTA** 
> Il file che si vede nell’elenco a destra con nome “*signatures-produttore-trasportatore.xml*” evidenzia che in questo caso il trasportatore corrisponde anche al produttore. Diversamente, se produttore e trasportatore fossero stati soggetti diversi, avremmo avuto due file di firma distinti: “*signatures-trasporto001.xml*” e “*signatures-produttore.xml*”. La firma del trasportatore non deve essere necessariamente apposta prima di quella del produttore in quanto il produttore ed il trasportatore firmano lo stesso insieme di dati, l'ordine in cui sono applicate le firme del produttore e del trasportatore iniziale quindi non è rilevante.

Il dettaglio sui file di firma è esposto più avanti al paragrafo [Struttura delle Firme del formulario xFIR](#11-struttura-delle-firme-del-formulario-xfir)

Nell’immagine di *Figura 15* è riportato il contenuto del file catalogo “**manifest.xml**” dell'esempio.

```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest:manifest manifest:version="1.2"
                   xmlns:manifest="urn:oasis:names:tc:opendocument:xmlns:manifest:1.0">
	<manifest:file-entry manifest:full-path="/"
	                     manifest:media-type="application/vnd.etsi.asic-e+zip"/>
	<manifest:file-entry manifest:full-path="RRTPC 000068 YP.xml"
	                     manifest:media-type="text/xml"/>
	<manifest:file-entry manifest:full-path="RRTPC 000068 YP.cbor"
	                     manifest:media-type="application/cbor"/>
	<manifest:file-entry manifest:full-path="metadati.xml"
	                     manifest:media-type="text/xml"/>
	<manifest:file-entry manifest:full-path="partenza.xml"
	                     manifest:media-type="text/xml"/>
	<manifest:file-entry manifest:full-path="trasporto001.xml"
	                     manifest:media-type="text/xml"/>
	<manifest:file-entry manifest:full-path="annotazione001.xml"
	                     manifest:media-type="text/xml"/>
	<manifest:file-entry manifest:full-path="accettazione.xml"
	                     manifest:media-type="text/xml"/>
</manifest:manifest>
```

<span style="font-size:small;font-style:italic">Figura 15 - Esempio del contenuto del file di catalogo "manifest.xml".<span>

Il file "**manifest.xml**" è necessario per la conformità del formato xFIR alle specifiche ASiC-E, di cui l’xFIR è una sovrastruttura.

### 8.2 Fasi del ciclo di vita dell’xFIR

La scomposizione del modello dati complessivo del formulario RENTRI in singoli file XML avviene secondo un criterio basato sulla suddivisione in “**fasi**” del ciclo di vita tipico dell’attività di trasporto di rifiuti.

Inoltre, sono stati individuati anche degli “**eventi**” che possono verificarsi nel ciclo di vita del trasporto, che sono stati tradotti in formato digitale con opportune strutture dati.

Tutte le fasi e gli eventi, danno origine ad un proprio file XML che verrà inserito nel container xFIR e che troveremo nel file di catalogo "*manifest.xml*", accompagnato ciascuno dal rispettivo file di firma nella cartella “*META-INF*”.

Le fasi che sono sempre presenti nel documento xFIR sono le seguenti:

**F1. Partenza –** È rappresentata da unico file che contiene gli elementi identificativi del FIR: il numero, la data di emissione, il produttore (o detentore), il destinatario, e l’identificazione del rifiuto. Inoltre, contiene tutto l’elenco dei trasportatori previsti per una spedizione intermodale, e l’indicazione di tutti gli eventuali intermediari.

**F2. Trasporto -** Sono ammessi più file di questo tipo, e sono numerati sequenzialmente seguendo l’ordine di inserimento nel FIR dei trasportatori. Il file contiene la data e ora di inizio trasporto e gli altri dati di trasporto previsti per il tipo di trasporto, ad es. nel caso di trasporto terrestre i dati del conducente, dell’automezzo e rimorchio, e una stringa che indica l’eventuale percorso.

**F3. Accettazione -** Generalmente ci sarà un solo file di questo tipo, contenente le informazioni di accettazione o respingimento all’impianto di destinazione. Nel caso di una seconda destinazione si potranno aggiungere altri file di questo tipo.

Gli eventi che possono verificarsi nel corso del trasporto, che sono stati codificati in RENTRI con i rispettivi blocchi dati da utilizzarsi all’occorrenza, sono i seguenti:

**E1. Sosta tecnica** - Sono ammessi più file di questo tipo, e sono numerati sequenzialmente seguendo l’ordine degli eventi per ciascuna sosta. Il file contiene l’identificazione del trasportatore, gli estremi della sosta e ripartenza.

**E2. Trasbordo parziale** - Corrisponde al campo “*[13] Trasbordo Parziale*” che si trova nel 2° foglio “*Integrazione FORMULARIO RIFIUTI*”. Sono ammessi più file di questo tipo, e sono numerati sequenzialmente seguendo l’ordine dell’eventuale frazionamento del carico su più veicoli. Il file contiene l’identificazione (codice fiscale) del trasportatore, del nuovo formulario, quantità e causale.

**E3. Annotazione** - Sono ammessi più file di questo tipo, e sono numerati sequenzialmente seguendo l’ordine degli eventi che hanno richiesto l’aggiunta di annotazioni. Il file contiene l’identificazione (codice fiscale) di chi che ha inserito l’annotazione, e il testo dell’annotazione.

**E4. Destinatario successivo** - Corrisponde al campo “*[16] Secondo Destinatario*” che si trova nel 2° foglio “*Integrazione FORMULARIO RIFIUTI*”. La struttura dati ammette più file di questo tipo numerati sequenzialmente. Il file contiene sostanzialmente lo stesso blocco dati utilizzato per la definizione del primo destinatario, contenuto nel blocco dati visto al punto “*F1. Partenza*”, ma in questo caso dovrà essere valorizzato anche il numero d’ordine identificativo.

**E5. Accettazione successiva** - Corrisponde al completamento del campo “*[16] Secondo Destinatario*” che si trova nel 2° foglio “*Integrazione FORMULARIO RIFIUTI*”. La struttura dati ammette più file di questo tipo numerati sequenzialmente. Il file contiene sostanzialmente lo stesso blocco dati utilizzato per la definizione della prima accettazione visto sopra al punto “*F3. Accettazione*”, ma in questo caso sarà valorizzato anche il numero d’ordine identificativo.

**E6. Trasbordo totale** - Corrisponde al campo “*[14] Trasbordo Totale*” che si trova nel 2° foglio “*Integrazione FORMULARIO RIFIUTI*”. È ammesso un solo file di questo tipo. Questo blocco informativo è composto dall’unione dei due blocchi dati {“*Trasportatore*”, “*Presa in Carico trasporto terrestre*”}. Contiene l’identificazione completa del trasportatore, e le informazioni della presa in carico visto al punto “*F2. Trasporto*”.

Solo prima dell’inizio del trasporto, il titolare della vidimazione del FIR ha la facoltà di annullare la vidimazione stessa (tramite l’API di vidimazione). In questo caso è possibile inserire una nota per motivare l’avvenuto annullamento e riportare questa nota nel documento xFIR aggiungendo un file di tipo **Note Annullamento**. È ammesso un solo file di questo tipo.

### 8.3 Ulteriori file allegabili

L'operatore ha la possibilità di inserire nel “container” dell’xFIR ulteriori file non previsti dal RENTRI, purché siano file con estensione .pdf, *mimetype* “application/pdf” e ognuno abbia una dimensione massima di 1 MB, complessivamente il file xFIR non deve superare i 3 MB.

Non è richiesto che i file allegati e inseriti nel “container” siano inclusi nella “copertura” delle firme digitali apposte (vedi [Struttura delle Firme del formulario xFIR](#11-struttura-delle-firme-del-formulario-xfir)).

Tutte le informazioni contenute in questi file verranno trascurate dal RENTRI in fase di trasmissione dei dati.

### 8.4 File dati XML dell’xFIR

Nella tabella seguente si riporta la rappresentazione di sintesi della mappatura tra i blocchi informativi individuati per ciascuna fase e ciascun evento, e i rispettivi file XML prodotti.

| **Fase/Evento**              | **Nome del File XML prodotto**     | Esempio implementazione classe funzionale                       |
|------------------------------|------------------------------------|-----------------------------------------------------------------|
|                              |                                    | *public class* **FormularioXml** *{*                            |
|  **F1. Partenza**            | **partenza.xml**                   |  *public* ***DatiPartenza*** *DatiPartenza;*                    |
|  **F2. Trasporto**           | **trasporto[nnn].xml**             |  *public* ***Trasporto[]*** *Trasporto;*                        |
|  **F3. Accettazione**        | **accettazione.xml**               |  *public* ***Accettazione*** *Accettazione;*                    |
|  E1. Sosta tecnica           | sosta-tecnica[<span style="color:#ff4500">nnn</span>].xml           |  *public* ***SostaTecnica[]*** *SosteTecniche;*                 |
|  E2. Trasbordo parziale      | trasbordo-parziale[<span style="color:#ff4500">nnn</span>].xml      |  *public* ***TrasbordoParziale[]*** *TrasbordiParziale;*        |
|  E3. Annotazione             | annotazione[<span style="color:#ff4500">nnn</span>].xml             |  *public* ***AnnotazioneAggiuntiva[]*** *Annotazioni;*          |
|  E4. Destinatario successivo | destinatario-successivo[<span style="color:#ff4500">nnn</span>].xml |  *public* ***DestinatarioSuccessivo[]*** *DestinatariSuccessi;* |
|  E5. Accettazione success.   | accettazione-successiva[<span style="color:#ff4500">nnn</span>].xml |  *public* ***Accettazione[]*** *AccettazioniSuccessive;*        |
|  E6. Trasbordo totale        | trasbordo-totale.xml               |  *public* ***TrasbordoTotale*** *TrasbordoTotale;*              |
|  Note Annullamento           | annullamento.xml                   |  *public* ***Annullamento*** *Annullamento;*                    |

> ℹ️ **NOTA**  
> Nella produzione di un FIR digitale, l’operatore è sostanzialmente libero di agire come preferisce, utilizzando qualsiasi strumento informatico, rispettando unicamente i vincoli tecnici della struttura fisica dell’xFIR e dei dati contenuti.

Il controllo sulla coerenza con il modello dati RENTRI è effettuato da RENTRI nel momento in cui il destinatario restituirà la copia del formulario digitale che ha completato il proprio ciclo di vita, come disposto dall’Articolo 7, comma 7 del DM nr. 59/2023, utilizzando l’Endpoint «Validazione xFIR». Lo stesso endpoint potrà essere utilizzato durante tutto il ciclo di vita dell’xFIR.

## 9 Il modello dei dati del formulario digitale xFIR

Nel seguito, si espone il modello dati per ciascuna fase e per ciascun evento che concorra a formare il ciclo di vita di un trasporto.

*Si fa riferimento ai contenuti ed al formato del formulario di cui all’art.5 del DM 59/2023 e all’allegato II al medesimo decreto, oltre che alle istruzioni pubblicate nell’Allegato 2 al Decreto direttoriale n.251 del 19 dicembre 2023,* [*Istruzioni per la compilazione del formulario di identificazione del rifiuto*](https://www.rentri.gov.it/default/media/normative/decreti-direttoriali/decreto_direttoriale_251_allegato_2_istruzioni_compilazione_fir.pdf)*.*

|         | **Fase/Evento**         | **Nome del File XML prodotto**     | **\<xs:complexType name="………"\>** |
|---------|-------------------------|------------------------------------|-----------------------------------|
| **F1.** | **Partenza**            | **partenza.xml**                   | **name="DatiPartenza"**           |
| **F2.** | **Trasporto**           | **trasporto[nnn].xml**             | **name="Trasporto"**              |
| **F3.** | **Accettazione**        | **accettazione.xml**               | **name="Accettazione"**           |
| E1.     | Sosta tecnica           | sosta-tecnica[<span style="color:#ff4500">nnn</span>].xml           | *name="SostaTecnica"*             |
| E2.     | Trasbordo parziale      | trasbordo-parziale[<span style="color:#ff4500">nnn</span>].xml      | *name="TrasbordoParziale"*        |
| E3.     | Annotazione             | annotazione[<span style="color:#ff4500">nnn</span>].xml             | *name="AnnotazioneAggiuntiva"*    |
| E4.     | Destinatario successivo | destinatario-successivo[<span style="color:#ff4500">nnn</span>].xml | *name="DestinatarioSuccessivo"*   |
| E5.     | Accettazione successiva | accettazione-successiva[<span style="color:#ff4500">nnn</span>].xml | *name="Accettazione"*             |
| E6.     | Trasbordo totale        | trasbordo-totale.xml               | *name="TrasbordoTotale"*          |
|         | Note Annullamento       | annullamento.xml                   | *name="Annullamento"*             |

<span style="font-size:small;font-style:italic">Figura 16 - Mapping delle Fasi ed Eventi del trasporto, nomi dei file XML prodotti e classe dati di riferimento.<span>

### 9.1 (fase F1.) – Partenza [name="DatiPartenza"]

Dopo aver ottenuto da RENTRI il numero FIR attraverso i servizi per la vidimazione, la prima fase della produzione del formulario consiste nell’inserimento degli elementi essenziali all’avvio del processo di formazione del formulario elettronico.

Questa fase include le informazioni che identificano il formulario:

-   Numero FIR
-   Data Emissione

e le seguenti sezioni, come definite nelle istruzioni:

-   Campo 1 (Produttore) – identifica il produttore del rifiuto
-   Campo 2 (Detentore) – identifica il detentore del rifiuto
-   Campo 3 (Destinatario) – identifica il destinatario del rifiuto
-   Campo 4 (Trasportatore) – identifica il trasportatore del rifiuto
-   Campo 5 (Intermediario o commerciante) – identifica l’intermediario o commerciante senza detenzione del rifiuto
-   Campo 6 (Caratteristiche del rifiuto) – identifica le caratteristiche del rifiuto

![Dati partenza formulario](docs/media/image13.png)  
<span style="font-size:small;font-style:italic">Figura 17 - FIR - Dati Partenza.<span>

Queste informazioni sono registrate nel file “partenza.xml” sul quale il produttore dovrà apporre la propria firma digitale unitamente al file “trasporto001.xml” contenente i dati di inizio trasporto (vedi paragrafo “*(fase F2.) – Trasporto [name="Trasporto"]*”). Il trasportatore dovrà parimenti apporre la propria firma in modo che copra entrambi i file.

Il modello dati di riferimento è il seguente:

![Dati partenza schema](docs/media/image14.png)  
<span style="font-size:small;font-style:italic">Figura 18 - Struttura del formulario digitale xFIR [name="DatiPartenza"].<span>

#### 9.1.1 Complex Type [Name=“Produttore”]

La struttura dati che qualifica il produttore è collegata ad uno switch (*xs:choice*) al blocco dati “*TrasbordoParzialeOrigine*” che viene utilizzato nel caso il formulario nasca da un trasbordo parziale, dove i dati del produttore originario devono essere accompagnati anche dalle informazioni sul numero FIR originario e dalla causale del trasbordo, come indicato nel paragrafo “*(evento E2.) - Trasbordo parziale”.*

![Dati produttore](docs/media/image15.png)  
<span style="font-size:small;font-style:italic">Figura 19 - Dati del Produttore [name="Produttore"].<span>

L’elemento "**NumIscrSito**" che rappresenta il numero iscrizione al RENTRI dell’unità locale di riferimento (es.: "*OP4293P62805657-BZ5072*") del produttore/detentore, quando specificato, consente di identificare l’unità locale del produttore/detentore in modo univoco rispetto alle informazioni di iscrizione al RENTRI.

In assenza di questa informazione, l'unità locale del produttore/detentore a cui deve essere restituita la copia digitale potrà essere individuata solo attraverso il codice fiscale e l’indirizzo dell’unità locale presenti nell’elemento “*Anagrafica*”.

#### 9.1.2 Complex Type [Name=“Destinatario”]

![Dati destinatario](docs/media/image16.png)  
<span style="font-size:small;font-style:italic">Figura 20 - Dati del "Destinatario" [name="Destinatario"].<span>

L’indicazione del primo destinatario non richiede la valorizzazione dell’attributo “**id**” che invece è utilizzato obbligatoriamente nell’eventualità in cui fosse necessario inserire una seconda destinazione, per il dettaglio si veda più avanti il paragrafo “*(evento E4.) - Destinatario successivo*”.

#### 9.1.3 Complex Type [Name=“Trasportatori”]

La struttura dati “*Trasportatori*” (*al plurale*) ammette più occorrenze del blocco dati di tipo [“*Trasportatore*”] (*al singolare*) per qualificare le situazioni in cui il trasporto è eseguito con più operatori.

Ogni distinto blocco dati [“*Trasportatore*”] è sempre qualificato dall’attributo “**id**” valorizzato con un progressivo numerico che identifica univocamente il trasportatore all’interno del modello dati dell’xFIR e che rappresenta l’ordine cronologico con il quale gli eventuali diversi trasportatori si avvicenderanno durante il trasporto nelle rispettive tratte. Il valore dell’attributo “**id**” permetterà di collegare i dati di trasporto alla specifica tratta.

Qualora uno stesso trasportatore svolgesse più tratte dovrà essere comunque ripetuto il blocco dati [“*Trasportatore*”] con un diverso valore per l’attributo “**id**”.

![Dati trasportatori](docs/media/image17.png)  
<span style="font-size:small;font-style:italic">Figura 21 - Dati del Trasportatore [name="Trasportatori"].<span>

L’elemento “*\<TipoTrasporto\>*” definisce per ciascuna tratta quale sia il tipo di trasporto tra i seguenti: [*Terrestre, Ferroviario, Marittimo*]. La valorizzazione di questo attributo dovrà essere coerente con la tipologia dei “*Dati Trasporto*” collegati che verranno aggiunti all’xFIR nel suo ciclo di vita. Si veda più avanti il paragrafo “*Trasporto intermodale*”.

Lo schema seguente (*Figura 22*) rappresenta la relazione esistente tra i trasportatori inseriti nel file “**partenza.xml**”, e i dati di avvio del trasporto inseriti nei file “**trasporto[nnn].xml**” e successivamente firmati.

![Dati trasporto](docs/media/image18.png)  
<span style="font-size:small;font-style:italic">Figura 22 - Relazione tra i trasportatori inseriti in “DatiPartenza” e i rispettivi dati di “Trasporto”.<span>

Questa situazione è ripresa anche in seguito nel paragrafo “*Trasporto intermodale*”.

#### 9.1.4 Complex Type [Name=“Intermediari”]

La struttura dati “*Intermediari*” (*al plurale*) ammette più occorrenze del blocco dati di tipo [“*Intermediario*”] (*al singolare*) per qualificare le situazioni in cui siano coinvolti anche più intermediari.

Dato che l’intermediario non è tenuto ad alcun contributo “tracciabile” nel ciclo di vita del trasporto, e non deve apporre alcuna firma sul FIR, non è stato definito alcun elemento che possa rappresentare un ordine cronologico “numerico”, perciò, sarà considerato l’ordine utilizzato nella fase di inserimento dei dati.

![Dati intermediari](docs/media/image19.png)  
<span style="font-size:small;font-style:italic">Figura 23 - Dati dell'Intermediario.<span>

### 9.2 (fase F2.) – Trasporto [name="Trasporto"]

Questa fase consiste nell’inserimento delle informazioni di avvio del trasporto, qualificando, nel caso ad esempio di trasporto terrestre, il mezzo utilizzato, il conducente e la data e l’ora di partenza, abbinandole ai trasportatori inseriti nella sezione “Trasportatori” definiti nell’apposita struttura dati della fase F1 (vedi paragrafo “*Complex Type [Name=“Trasportatori”]*”).

Le informazioni previste in questa fase corrispondono ai campi del modello di formulario:

-   Campo 8 (Nome e cognome conducente)
    -   Nome e cognome dell’autista del veicolo che trasporta il rifiuto,
    -   Ora/Data di inizio del trasporto.
-   Campo 9 (Trasporto)
    -   Targa automezzo,
    -   Targa del rimorchio,
    -   Percorso (se diverso dal più breve).
-   *Campo 10 (Allegato Modello)*
    -   *Intermodale,*
    -   *Microraccolta (da non compilare).*

![Dati trasporto cartaceo](docs/media/image20.png)  
<span style="font-size:small;font-style:italic">Figura 24 - Dati del Trasporto.<span>

Per ciascun trasportatore presente nel file "**partenza.xml**" dovrà essere prodotto un file corrispondente “**trasporto[nnn].xml**” nel quale saranno registrate le informazioni sul trasporto. Il file "**trasporto001.xml**" ed il file “**partenza.xml**” saranno firmati sia dal produttore che dal primo trasportatore. Gli eventuali altri file "**trasporto[nnn].xml**" relativi ai dati di trasporto per i trasportatori che prenderanno in carico il rifiuto successivamente alla prima tratta, verranno aggiunti e firmati dai trasportatori corrispondenti, unitamente agli altri file dati XML del formulario già presenti nel “container” xFIR.

L’inserimento di queste informazioni può avvenire in momenti diversi, successivi alla compilazione del formulario, e durante tutta la fase del trasporto.

![Dati trasporto](docs/media/image21.png)  
<span style="font-size:small;font-style:italic">Figura 25 – Struttura del Blocco dati "Trasporto[nnn]" [name="Trasporto"].<span>

Ogni trasportatore precedentemente inserito in *Complex Type [Name=“Trasportatori”]* nel file “**partenza.xml**”, è abbinato al rispettivo file “**trasporto[nnn].xml**” prodotto in questa fase, dove il numero d’ordine che identifica il file (*ad es.* [*001*]) serve per poter aggiungere i possibili molteplici file dello stesso tipo ma riferiti alle diverse tratte. Il valore dell’attributo “**idRef**” dell’elemento radice dell’XML fissa la relazione esistente con la parte anagrafica del trasportatore che si trova nel file “**partenza.xml**” (o dell’eventuale trasportatore indicato con i dati richiesti per l’operazione di “**trasbordo-totale.xml**”), identificato dal valore dell’attributo “**id**”, come meglio rappresentato al paragrafo *Complex Type [Name=“Trasportatori”]* e nella *Figura 22*.

La “Sezione [10]” del formulario, consentirebbe di evidenziare se vi sia un ulteriore foglio allegato per indicare le informazioni sulla microraccolta o sul trasporto intermodale. La sezione “*MICRORACCOLTA*” non va compilata e sino all’emanazione di ulteriori disposizioni, deve essere emesso un FIR per ogni produttore/detentore e/o per ogni luogo di produzione o di prelievo servito. Il trasporto “*INTERMODALE*” è previsto dal “*Foglio nr. 3 - Allegato FORMULARIO RIFIUTI*” del modello di formulario ed è gestito dal modello dati in esame.

![Dati tipi trasporto](docs/media/image22.png)  
<span style="font-size:small;font-style:italic">Figura 26 - Dati qualificanti il “Tipo di Trasporto" tra Terrestre, Ferroviario e Marittimo.<span>

L’intermodalità è stata già vista nella fase di registrazione dei trasportatori al paragrafo “*Complex Type [Name=“Trasportatori”]*”, e meglio rappresentata al paragrafo “*Trasporto intermodale*”.

### 9.3 (fase F3.) – Accettazione [name="Accettazione"]

Questa è la fase conclusiva del ciclo di vita del formulario, la cui compilazione è riservata al destinatario quando il rifiuto arriva all’impianto.

Le informazioni previste in questa fase corrispondono ai campi del modello di formulario relativi al Campo 12. (sezione riservata al destinatario) indicando:

-   alternativamente se il carico è stato:
    -   Accettato per intero
        -   Accettato parzialmente, indicando la causale del parziale respingimento
        -   Respinto, indicando la causale del respingimento
    -   Quantità accettata
    -   Motivazioni in forma descrittiva dell’eventuale respingimento
    -   Data e ora di arrivo all’impianto
    -   Indicazione se il rifiuto è in attesa di verifica analitica

![Dati accettazione cartaceo](docs/media/image23.png)  
<span style="font-size:small;font-style:italic">Figura 27 - Accettazione a destino o Respingimento.<span>

Queste informazioni sono registrate nel file “**accettazione.xml**” sul quale il destinatario dovrà apporre la propria firma digitale, unitamente agli altri file dati XML del formulario già presenti nel “container” dell’xFIR.

![Dati accettazione](docs/media/image24.png)  
<span style="font-size:small;font-style:italic">Figura 28 – Struttura del Blocco dati "Accettazione" [name="Accettazione"].<span>

Come previsto nelle istruzioni il campo “*quantità accettata*” è espresso in “**kg**” (chilogrammi) e il campo *“quantità respinta”* non va compilato.

Il modello dati contiene la definizione di tutte le costanti enumerative utilizzate, e ne esegue la validazione.

| **enumeration value** | **documentation**       |
|-----------------------|-------------------------|
| "A"                   | Accettato per intero    |
| "P"                   | Accettato parzialmente  |
| "R"                   | Respinto                |  
<span style="font-size:small;font-style:italic">Figura 29 - "TipoAccettazioneEnum"<span>


| **enumeration value** | **documentation**  |
|-----------------------|--------------------|
| "NC"                  |    Non conforme    |
| "IR"                  |    Irricevibile    |
| "A"                   |    Altro           |  
<span style="font-size:small;font-style:italic">Figura 30 - "CausaleRespingimentoEnum" da Tab. 4 (sez. Allegati DD n.251 del 19 dicembre 2023)<span>

### 9.4 (evento E1.) - Sosta tecnica [name="SostaTecnica"]

Questo evento risponde alle operazioni di stazionamento effettuate dal trasportatore che compila il Campo 15 (Sosta tecnica):

-   Luogo di stazionamento.
-   Ora e data di sospensione del trasporto.
-   Ora e data di ripresa dello stesso.

Queste informazioni si trovano sul “*Foglio nr. 2 - Integrazione FORMULARIO RIFIUTI*” nell’attuale modello di formulario.

![Dati sosta tecnica cartacea](docs/media/image25.png)  
<span style="font-size:small;font-style:italic">Figura 31 - Sosta Tecnica<span>

Queste informazioni sono registrate nel file “**sosta-tecnica[nnn].xml**” dove il numero d’ordine che identifica il file (*ad es.* [*001*]) serve per poter aggiungere i possibili molteplici file dello stesso tipo ma riferiti alle diverse soste tecniche. 
Il valore dell’attributo “**idRef**” dell’elemento radice dell’XML fissa la relazione esistente con la parte anagrafica del trasportatore a cui è riferita la sosta tecnica, e dovrà trovare corrispondenza con l’attributo “**id**” di uno dei trasportatori indicati nel file “**partenza.xml**” o dell’eventuale trasportatore indicato con i dati richiesti per l’operazione di “**trasbordo-totale.xml**”.

Il trasportatore che effettua la sosta tecnica e che aggiunge il file che ne contiene i dati dovrà apporvi la propria firma digitale, unitamente agli altri file XML definiti dallo schema già presenti nell’xFIR.

![Dati sosta tecnica](docs/media/image26.png)  
<span style="font-size:small;font-style:italic">Figura 32 - Blocco dati "Sosta Tecnica [nnn]"<span>

Nelle istruzioni si indica di utilizzare il campo “*[17] (Annotazioni)*” nel caso lo spazio riservato non fosse sufficiente, ma questo non è necessario in quanto il modello dati non pone alcun limite alla registrazione di ulteriori occorrenze per questo evento.

### 9.5  (evento E2.) - Trasbordo parziale [name="TrasbordoParziale"]

Per la gestione dell’evento si invita preliminarmente a consultare il Decreto direttoriale n.251 del 19 dicembre 2023, recante “[Istruzioni per la compilazione del formulario di identificazione del rifiuto](https://www.rentri.gov.it/default/media/normative/decreti-direttoriali/decreto_direttoriale_251_allegato_2_istruzioni_compilazione_fir.pdf)”.

Queste informazioni si trovano sul “*Foglio nr. 2 - Integrazione FORMULARIO RIFIUTI*” del modello di formulario.

![Dati trasbordo parziale cartacea](docs/media/image27.png)  
<span style="font-size:small;font-style:italic">Figura 33 - Trasbordo Parziale<span>

Queste informazioni sono registrate nel file “**trasbordo-parziale[nnn].xml**” dove il numero d’ordine che identifica il file (*ad es.* [*001*]) serve per poter aggiungere i possibili molteplici file dello stesso tipo ma riferiti a diverse operazioni di trasbordo parziale, 
o ad un’unica operazione di trasbordo che avviene su più veicoli. Il valore dell’attributo “**idRef**” dell’elemento radice dell’XML fissa la relazione esistente con la parte anagrafica del trasportatore a cui è riferito il trasbordo parziale, 
dovrà trovare corrispondenza con l’attributo “**id**” di uno dei trasportatori indicati nel file “**partenza.xml**” o dell’eventuale trasportatore indicato con i dati richiesti per l’operazione di “**trasbordo-totale.xml**”. 
Tale trasportatore dovrà quindi apporre la propria firma digitale sul file, unitamente agli altri file XML definiti dallo schema già presenti nell’xFIR.

![Dati trasbordo parziale](docs/media/image28.png)  
<span style="font-size:small;font-style:italic">Figura 34 - Blocco dati "Trasbordo Parziale [nnn]"<span>

La compilazione dei nuovi FIR come conseguenza di un “*Trasbordo Parziale*” implica l’utilizzo, nel nuovo formulario, della seconda alternativa nello switch (*\<xs:choice\>*) relativo al produttore nel file “**partenza.xml**” per qualificare l’elemento “\<TrasbordoParzialeOrigine\>”, anziché l’elemento “\<Produttore\>” visto in precedenza al paragrafo “*Complex Type [Name=“Produttore”]*”.

![Dati partenza trasbordo parziale](docs/media/image29.png)  
<span style="font-size:small;font-style:italic">Figura 35 - Dati del "Produttore" nell'eventualità di un "Trasbordo Parziale"<span>

![Dati partenza schema](docs/media/image30.png)  
<span style="font-size:small;font-style:italic">Figura 36 - Scelta per qualificare l’elemento \<TrasbordoParzialeOrigine\>, anziché l’elemento \<Produttore\><span>

### 9.6 (evento E3.) – Annotazione [name="AnnotazioneAggiuntiva"]

La struttura dati del modello contiene già elementi di tipo “\<string\>” che consentono di registrare una annotazione legata direttamente ad un ben preciso contesto.

L’elemento “\<AnnotazioneAggiuntiva\>” interpreta letteralmente il significato del “*Campo 17 – Annotazioni*”, e consente di aggiungere in qualsiasi momento ulteriori annotazioni che saranno associate al formulario.

![Dati annotazioni cartacea](docs/media/image31.png)  
<span style="font-size:small;font-style:italic">Figura 37 – Annotazioni<span>

Queste informazioni sono registrate nel file “**annotazione[nnn].xml**” dove il numero d’ordine che identifica il file (*ad es.* [*001*]) è assegnato sequenzialmente seguendo la cronologia con cui è stata aggiunta l’annotazione. 
La struttura dati prevista per l’annotazione richiede di specificare il codice fiscale dell’operatore (*Produttore, Trasportatore, Destinatario*) che l’ha inserita, per rendere esplicita la titolarità dell’informazione. 
Come gli altri file XML propri dell’xFIR descritti in questo documento è previsto che il file venga firmato digitalmente.

![Dati annotazioni cartacea](docs/media/image32.png)  
<span style="font-size:small;font-style:italic">Figura 38 - Blocco dati "Annotazione [nnn]" [name="AnnotazioneAggiuntiva"]<span>

Nelle istruzioni allegate al Decreto direttoriale n.251 si suggerisce di annotare nel “*Campo 17 – Annotazioni*” tutte le informazioni che non trovano collocazione nel modello cartaceo del formulario. 
Nella tabella seguente si riporta il riferimento alle istruzioni per l’utilizzo nelle diverse circostanze delle annotazioni sul campo “[17]” presenti su ogni foglio del formulario, affiancando nella colonna di destra i riferimenti al modello dati xFIR in cui è gestita in modo puntuale e strutturata l’informazione che dovrebbe essere semplicemente annotata.

| **Istruzione nell’allegato 2 al DD n. 251/2023**                                                                                                                                                                                                                                                                                                                           | **Riferimenti al modello dati xFIR**                                                                                                                                                                                                            |
|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Campo 17 (Annotazioni)** Inserire eventuali note a chiarimento e qualsiasi altra informazione utile al tracciamento dei rifiuti da parte di tutti i soggetti.                                                                                                                                                                                                            | Il file “**annotazione[nnn].xml**” conterrà le informazioni necessarie.                                                                                                                   |
| **1.1.2 Trasporto da produttore a destinatario con trasportatore ed eventuale intermediario.** **Campo 6 (Caratteristiche del rifiuto)** – identifica le caratteristiche del rifiuto Nel caso di FIR in formato cartaceo, le eventuali ulteriori caratteristiche di pericolo, che non trovassero spazio nell’apposito riquadro, vanno indicate nel campo 17 (Annotazioni). | L’elemento "*ClassiPericolo*" contenuto della classe "*Rifiuto*" è definito come un array senza un limite, quindi, può contenere tutti gli elementi necessari.                                                                                  |
| **Campo 8 (Nome e cognome conducente)** – identifica il conducente. Nel caso di cambio del conducente, per esigenze di trasporto, le informazioni sul nuovo conducente andranno inserite al campo 17 (Annotazioni).                                                                                                                                                        | Il file “**annotazione[nnn].xml**” conterrà nell’elemento “\<AnnotazioneAggiuntiva\>” le informazioni necessarie ad individuare il nuovo conducente, prive dello schema previsto nel file di trasporto.                                         |
| **2.5 Trasporto intermodale** In aggiunta al **campo 4 (trasportatore),** si compila la Sezione Intermodale ed il campo 17 (Annotazioni) con l’indicazione della sequenza delle tratte percorse (es. strada – ferrovia – strada).                                                                                                                                          | Il trasporto intermodale è gestito con la classe “*Trasporto*” che comprende delle sottoclassi specifiche per il trasporto *terrestre, ferroviario, marittimo*, senza un limite di occorrenze sul numero delle tratte.                          |
| **2.7 Trasbordo Parziale** Nel caso si renda necessario procedere al trasbordo parziale con trasferimento del carico su più veicoli le informazioni sugli ulteriori trasportatori e/o veicoli dovranno essere riportate al campo 17 (Annotazioni) del FIR compilato alla partenza.                                                                                         | La classe “*TrasbordoParziale*” ammette molteplici occorrenze che consentono di gestire il frazionamento del carico su più veicoli.                                                                                                             |
| **2.9 Stazionamento dei veicoli in configurazione di trasporto come definito all’art. 193, comma 15 del decreto legislativo 3 aprile 2006, n.152** Per gli stazionamenti successivi al primo, il trasportatore compila il campo 17 (Annotazioni).                                                                                                                          | La classe “*SostaTecnica*” ammette molteplici occorrenze che consentono di gestire molteplici soste come rappresentato in *Figura 32*.                                                                                                          |
| **2.11 Trasporto di rifiuti svolto da un vettore diverso da un vettore terrestre** Nel campo 17 (Annotazioni) vanno indicati il numero del treno o dell’imbarcazione.                                                                                                                                                                                                      | Il trasporto intermodale è gestito con in modo articolato con la classe “*Trasporto*” che comprende delle sottoclassi specifiche per il trasporto *terrestre, ferroviario, marittimo*, senza un limite di occorrenze sul numero delle tratte.   |  

<span style="font-size:small;font-style:italic">Figura 39 – Corrispondenza tra dati xFIR rispetto alle indicazioni fornite dalle istruzioni per l’utilizzo del campo [17] Annotazioni<span>

### 9.7 (evento E4.) - Destinatario successivo [name="DestinatarioSuccessivo"]

Questo evento si verifica quando il FIR arrivato a destinazione non può essere accettato e il trasporto prosegue verso una seconda destinazione. La sezione “*Secondo Destinatario*” è compilata dal trasportatore su richiesta del produttore.

Per le modalità di compilazione del destinatario successivo si invita a consultare il Decreto direttoriale n.251 del 19 dicembre 2023, recante “[Istruzioni per la compilazione del formulario di identificazione del rifiuto](https://www.rentri.gov.it/default/media/normative/decreti-direttoriali/decreto_direttoriale_251_allegato_2_istruzioni_compilazione_fir.pdf)”

Queste informazioni sono registrate nel file “**destinatario-successivo[nnn].xml**” dove il numero d’ordine che identifica il file (*ad es.* [*001*]) serve per poter aggiungere i possibili molteplici file dello stesso tipo ma riferiti a diverse indicazioni di un nuovo destinatario. Il valore dell’attributo "**id**” serve ad identificare univocamente il nuovo destinatario e dovrà coincidere con il valore dell’attributo “**idRef**” dell’informazione di accettazione che il destinatario aggiungerà all’xFIR. 
Il file dovrà essere firmato dal produttore o dal trasportatore che ha inserito la destinazione successiva su richiesta del produttore/detentore.

Si evidenzia che le informazioni previste per il “Campo 16” sono rappresentate mediante due elementi abbinati: “*DestinatarioSuccessivo*” e “*Accettazione*”.

![Dati destinatario successivo](docs/media/image33.png)  
<span style="font-size:small;font-style:italic">Figura 40 - Blocco dati "Destinatario Successivo [nnn]"<span>

### 9.8 (evento E5.) - Accettazione successiva [name="Accettazione"]

Questo evento si verifica quando il FIR non accettato alla prima destinazione, arriva alla seconda destinazione, e integra e completa il precedente *(evento E4.) - Destinatario successivo*.

L’elemento “Accettazione” è lo stesso visto in precedenza al paragrafo “*(fase F3.) – Accettazione*”, ma in questo caso sarà valorizzato l’attributo “**idRef**” con lo stesso valore dell’attributo “**id**” utilizzato per l’indicizzazione del “*\<DestinatarioSuccessivo\>*” visto al precedente paragrafo.

L’accettazione ad opera del successivo destinatario produrrà un distinto file XML con un proprio numero d’ordine “**accettazione-successiva[nnn].xml**” dove il numero d’ordine che identifica il file (*ad es.* [*001*]) serve per poter aggiungere i possibili molteplici file dello stesso tipo ma riferiti a diverse operazioni di accettazione di destinatari successivi al primo. 
Il file deve essere firmato dal destinatario referenziato dall’attributo “**idRef**”.

![Dati accettazione successiva](docs/media/image34.png)  
<span style="font-size:small;font-style:italic">Figura 41 - Accettazione Successiva – Relazione tra \<idRef\> verso \<id\> del Destinatario Successivo<span>

### 9.9 (evento E6.) - Trasbordo totale [name="TrasbordoTotale"]

Per la gestione dell’evento si invita preliminarmente a consultare il Decreto direttoriale n.251 del 19 dicembre 2023, recante “[Istruzioni per la compilazione del formulario di identificazione del rifiuto](https://www.rentri.gov.it/default/media/normative/decreti-direttoriali/decreto_direttoriale_251_allegato_2_istruzioni_compilazione_fir.pdf)”.

Queste informazioni si trovano sul “*Foglio nr. 2 - Integrazione FORMULARIO RIFIUTI*” del modello di formulario.

![Dati trasbordo totale](docs/media/image35.png)  
<span style="font-size:small;font-style:italic">Figura 42 - Trasbordo Totale<span>

L’inserimento dei dati di un trasbordo totale produrrà un distinto file XML “**trasbordo-totale.xml**” che dovrà essere firmato digitalmente dal trasportatore che prende in carico il rifiuto con il trasbordo.

![Dati presa in carico](docs/media/image36.png)  
<span style="font-size:small;font-style:italic">Figura 43 - Blocco dati "Trasbordo Totale" – “Presa In Carico”<span>

![Dati nuovo trasportatore](docs/media/image37.png)  
<span style="font-size:small;font-style:italic">Figura 44 - Blocco dati "Trasportatore" inserito nella Presa in Carico di un Trasbordo Totale<span>

In una prossima versione di queste specifiche è prevista l’estensione della cardinalità dei trasbordi totali che è possibile specificare in uno stesso formulario, allo stesso modo di quanto visto in precedenza per i trasbordi parziali.

### 9.10 Note Annullamento [name="Annullamento"]

Se il FIR viene annullato (tramite l’API di vidimazione) dal titolare della vidimazione è possibile aggiungere nell’xFIR una nota per motivare le motivazioni dell’annullamento. La nota dovrà essere firmata digitalmente dal titolare della vidimazione che ha provveduto ad annullare il FIR.

![Dati annullamento](docs/media/image38.png)
Figura 45 – Note di Annullamento

## 10 Trasporto intermodale

Per la corretta compilazione di questa sezione si invita a consultare l’Allegato 2 al Decreto direttoriale n.251 del 19 dicembre 2023, recante “[Istruzioni per la compilazione del formulario di identificazione del rifiuto](https://www.rentri.gov.it/default/media/normative/decreti-direttoriali/decreto_direttoriale_251_allegato_2_istruzioni_compilazione_fir.pdf)”.

Le informazioni trattate in questo contesto sono utilizzate nel caso di trasporto su più tratte e si trovano sul “*Foglio nr. 3 - Allegato FORMULARIO RIFIUTI*” del modello di formulario.

![Dati intermodale cartaceo](docs/media/image39.png)  
<span style="font-size:small;font-style:italic">Figura 45 - Trasporto intermodale (Foglio nr. 3 - Allegato FORMULARIO RIFIUTI)<span>

I dati degli intermediari sono inseriti in un array “*\<Intermediari\>*” che appartiene alla struttura “*DatiPartenza*” vista in precedenza al paragrafo *Complex Type [Name=“Intermediari”]* della *(fase F1.) – Partenza [name="DatiPartenza"]*.

In questo paragrafo sono trattate le informazioni associate alle tre opzioni visibili in *Figura 45* [*Vettore Terrestre*], [*Gestore Ferroviario*] e [*Gestore Marittimo*].

L’intermodalità è gestita attraverso tre elementi:

1.  Il valore progressivo dell’attributo “**id**” identificante il trasportatore inserito in “*DatiPartenza*” definisce l’ordine dei trasportatori, quindi anche delle “**tratte**”,
2.  la qualifica del trasportatore con l’elemento “*\<TipoTrasporto\>*” inserito in “*DatiPartenza*”,
3.  la classe “*Trasporto*” collegata al trasportatore mediante la relazione tra “**id**” e “**idRef**” che attraverso uno switch basato sul valore dell’elemento “*\<TipoTrasporto\>*” individua la struttura dati opportuna tra i tre tipi: [*Terrestre, Ferroviario, Marittimo*].

La parte che riguarda l’inserimento dei trasportatori è descritta al paragrafo *Complex Type [Name=“Trasportatori”]* della *(fase F1.) – Partenza [name="DatiPartenza"]*.

![Dati intermodale tipo](docs/media/image40.png)  
<span style="font-size:small;font-style:italic">Figura 46 – Elemento \<Trasportatore\> nel quale si qualifica il \<TipoTrasporto\><span>

La classe “*Trasporto*” collegata al trasportatore è stata esposta nel paragrafo *(fase F2.) – Trasporto [name="Trasporto"]*.

![Dati intermodale trasporto](docs/media/image40a.png)  
<span style="font-size:small;font-style:italic">Figura 47 – Trasporto intermodale, classe “Trasporto” con i dati qualificanti il "Tipo di Trasporto"<span>

Le informazioni che si devono inserire sono diverse a seconda dei tre tipi di trasporto.

TRATTA TERRESTRE - i dati inseriti dal gestore terrestre sono:

-   Conducente: nome e cognome del conducente dell’automezzo su cui avviene il trasporto del rifiuto.
-   Targa automezzo: targa dell’automezzo su cui avviene il trasporto del rifiuto.
-   Targa rimorchio: targa dell’eventuale rimorchio su cui avviene il trasporto del rifiuto.
-   Presa in carico rimorchio precedente
-   Percorso: eventuale percorso, se diverso dal più breve, previsto per il rifiuto dal punto in cui viene preso in carico alla destinazione
-   Data e ora di presa in carico del rifiuto, corrispondente all’inizio del trasporto.
-   Annotazioni: eventuali annotazioni attribuibili specificamente alla presa in carico del rifiuto

![Dati intermodale trasporto terrestre](docs/media/image41.png)  
<span style="font-size:small;font-style:italic">Figura 48 - Trasporto Terrestre<span>

TRATTA FERROVIARIA - i dati inseriti dal gestore ferroviario sono:

-   Treno: Identificativo del treno.
-   RID: flag che classifica il trasporto come sottoposto al regolamento per il trasporto internazionale delle merci pericolose su ferrovia.
-   Tratta: nomenclatura descrittiva in forma libera della tratta percorsa.
-   Data e ora di presa in carico del rifiuto, corrispondente all’inizio del trasporto.
-   Annotazioni: eventuali annotazioni attribuibili specificamente alla presa in carico del rifiuto

![Dati intermodale trasporto ferroviario](docs/media/image42.png)  
<span style="font-size:small;font-style:italic">Figura 49 - Trasporto Ferroviario<span>

TRATTA MARITTIMA: i dati inseriti dal gestore marittimo sono:

-   Nave: Identificativo della nave.
-   IMDG: (International Marittime Dangerous Goods) flag che classifica il trasporto come sottoposto alla normativa relativa al trasporto di merci pericolose per via marittima.
-   Data e ora di presa in carico del rifiuto, corrispondente all’inizio del trasporto.
-   Annotazioni: eventuali annotazioni attribuibili specificamente alla presa in carico del rifiuto

![Dati intermodale trasporto marittimo](docs/media/image43.png)  
<span style="font-size:small;font-style:italic">Figura 50 - Trasporto Marittimo<span>

## 11 Struttura delle Firme del formulario xFIR

Come visto in precedenza al paragrafo *Struttura dei dati del formulario xFIR*, i file dati che compongono il formulario descritto nei paragrafi precedenti sono firmati digitalmente nella modalità “separata” (o *“detached”)*, e ciascun file di firma è registrato nel container xFIR nella cartella “META-INF/”, con il prefisso “**signatures-**” e con un postfisso che dipende dal file dati aggiunto al container per cui si è resa necessaria la firma.

![META-IN](docs/media/image44a.png)  
<span style="font-size:small;font-style:italic">Figura 51 - La Cartella “META-INF\\” contiene il catalogo “manifest.xml” e i file delle firme digitali<span>

Le firme digitali previste devono essere conformi allo standard *XAdES Baseline-B*, e, in conformità con le specifiche per i container ASiC-E, devono essere firme “*detached*” contenute in un elemento XML che funge da “*wrapper”* con nome “*asic:XAdESSignatures”* (e namepace *xmlns:asic="`http://uri.etsi.org/02918/v1.2.1#`"*). Nell’xFIR è previsto solo questo tipo di contenitore delle firme, ed è prevista la presenza di una sola firma (cioè di un unico nodo “*ds:Signature*”) all’interno di ogni singolo file di firma.

Le firme XML “*detached*” hanno un elemento “*ds:Reference”* per ogni file contenuto nell’xFIR che è oggetto di firma. Le specifiche XMLDSig prevedono che ogni elemento *“ds:Reference”* contenga un elemento *“ds:DigestValue”* dove è specificato un codice hash. Quando l’elemento *“ds:Reference”* referenzia tramite l’attributo *“URI”* un file dell’xFIR, il codice hash presente nell’elemento *“ds:DigestValue”* sottostante corrisponde a quello che si ottiene applicando la funzione di hash all’intero contenuto del file referenziato.

Da specifica XMLDSig, il codice hash utilizzato dalla funzione crittografica di una firma digitale XML è calcolato applicando la funzione di hash su l’array di byte che rappresenta l’elemento *“ds:SignedInfo”* (normalizzato secondo l’algoritmo di *“Canonicalization”*) che contiene tutti gli elementi *“ds:Reference”.* Ne segue che tutti i file referenziati in “*ds:SignedInfo*” sono un input per la funzione di firma, e ne sono quindi oggetto.

Definiamo “copertura” di una firma XML l’insieme dei file che sono oggetto della firma.

Ciascuna firma digitale XML che viene inserita nell’xFIR durante il suo ciclo di vita a seguito dell’inserimento di un nuovo file dati dell’xFIR dovrà *coprire* tutti i file XML relativi al FIR digitale presenti nel file xFIR al momento dell’apposizione della firma stessa.

Nella sezione [Documentazione Interoperabilità RENTRI](/docs) alla pagina [[Schemi di validazione XSD](/docs?page=schemi-xsd-demo)] è disponibile anche lo schema XSD “[**xmldsig-core-schema.xsd**](/docs/assets/xmldsig-core-schema.xsd?r=1.2)” rilasciato dal W3C relativo alla firma degli XML secondo lo standard XAdES.

### 11.1 Regola generale di integrità del formulario xFIR

Nella tabella seguente sono esposti i nomi dei file attesi per le firme aggiunte a seguito dell’inserimento nel container xFIR dei rispettivi file dati XML durante il ciclo di vita del formulario.

|                                                      | **Fase/Evento**                             | **Nome del File dati**                       | **Nome del File di firma**                    |
|------------------------------------------------------|---------------------------------------------|----------------------------------------------|-----------------------------------------------|
| **F1.**                                              | **Partenza**                                | **partenza.xml**                             | **signatures-produttore.xml**                 |
| **F2.**                                              | **Trasporto**                               | **trasporto[nnn].xml**                       | **signatures-trasporto[*nnn*].xml**       |
| (Quando il Trasportatore coincide con il Produttore) |                                             |                                              | **signatures-produttore-trasportatore.xml**   |
| **F3.**                                              | **Accettazione**                            | **accettazione.xml**                         | **signatures-accettazione.xml**               |
| E1.                                                  | Sosta tecnica                               | sosta-tecnica[*nnn*].xml                     | signatures-sosta-tecnica[*nnn*].xml           |
| E2.                                                  | Trasbordo parziale                          | trasbordo-parziale[*nnn*].xml                | signatures-trasbordo-parziale[*nnn*].xml      |
| E3.                                                  | Annotazione                                 | annotazione[*nnn*].xml                       | signatures-annotazione[*nnn*].xml             |
| E4.                                                  | Destinatario successivo                     | destinatario-successivo[*nnn*].xml           | signatures-destinatario-successivo[*nnn*].xml |
| E5.                                                  | Accettazione successiva                     | accettazione-successiva[*nnn*].xml           | signatures-accettazione-successiva[*nnn*].xml |
| E6.                                                  | Trasbordo totale                            | trasbordo-totale.xml                         | signatures-trasbordo-totale.xml               |
|                                                      | Note Annullamento                           | annullamento.xml                             | signatures-annullamento.xml                   |

<span style="font-size:small;font-style:italic">Figura 52 - Fasi ed Eventi del trasporto e rispettivi nomi dei file dei dati e della firma disgiunta<span>

L’integrità complessiva del formulario è assicurata dalla regola generale per cui in ogni firma XML esiste la “*ds:Reference”* a ciascun singolo file dati XML già inserito nel container xFIR, presente nel momento in cui la firma viene aggiunta.

![xmldsig-core-schema](docs/media/image44.png)  
<span style="font-size:small;font-style:italic">Figura 53 - Rif. all’elemento ds:Reference nello schema "xmldsig-core-schema.xsd"<span>

Lo schema seguente rappresenta concettualmente il caso reale di un formulario firmato alla partenza solo dal produttore, in quanto risultava essere anche il trasportatore del proprio rifiuto.

1.  Nel primo file di firma (“**signatures-produttore-trasportatore.xml**”) sono inserite le “*ds:Reference*” ai file “**partenza.xml**” e del file “**trasporto001.xml**”.
2.  All’xFIR è stata aggiunta un’annotazione, quindi nel secondo file di firma (“**signatures-annotazione001.xml**”) si ripetono le precedenti due “*ds:Reference”*, e si aggiunge quella relativa al file “**annotazione001.xml**”.
3.  Quando il trasporto si conclude a destinazione, nel terzo file di firma (“**signatures-accettazione.xml**”) si ripetono le precedenti tre “*ds:Reference”*, e si aggiunge quella relativa al file dati “**accettazione.xml**”.

Il file della firma finale all’accettazione appare come rappresentato nell’immagine seguente.

![signatures-accettazione](docs/media/image45.png)  
<span style="font-size:small;font-style:italic">Figura 54 - esempio di un file di firma "signatures-accettazione.xml"<span>

Nel caso in cui produttore e trasportatore non coincidano, il file “**partenza.xml**” e il file “**trasporto001.xml**” devono comunque essere firmati assieme da entrambi i soggetti, produttore e trasportatore, non necessariamente in quest’ordine. 
Nel caso, ad esempio, che il primo firmatario sia il trasportatore, questi inserirà il file di firma “**signtaures-trasportatore.xml**” che coprirà entrambi i file dati, e successivamente il produttore potrà inserire il file “**signatures-produttore.xml**”, anch’esso con la copertura per entrambi i file.

## 12 Certificati di firma

I certificati che è possibile utilizzare per le firme apposte sull’xFIR potranno essere di tre tipi:

1.  Certificati **qualificati** eIDAS per la firma elettronica qualificata (di tipo sigillo o personali)
2.  Certificati di **identificazione elettronica** eIDAS per la firma elettronica avanzata (CIE e TS-CNS)
3.  Certificato di firma remota rilasciato dalla CA di dominio RENTRI

Nel caso si utilizzi un certificato di tipo sigillo il codice fiscale risultante dai dati estratti dal “*SubjectDN*” del certificato deve coincidere con quello dell’operatore che deve firmare, quindi:

-   dal produttore nel caso della firma apposta ai dati di partenza e di trasporto o ad eventuali annotazioni;
-   dal destinatario nel caso della firma apposta ai dati di accettazione o respingimento o ad eventuali annotazioni;
-   dal trasportatore che ha preso in carico il rifiuto nel caso della firma apposta ai dati di partenza e trasporto, e/o per gli eventuali altri dati che verranno inseriti nei file generati a seguito degli eventi descritti al [paragrafo 8.2](#8-2-fasi-del-ciclo-di-vita-dell-xfir).

[**Attenzione!**] Il servizio di CA di dominio RENTRI fornisce due distinti tipi di sigillo elettronico:

1.  **Certificato Interoperabilità** per il quale è consentito il download completo del certificato e della chiave privata, così che l’Operatore possa portarlo sui propri sistemi
2.  **Certificato di Firma Remota** per il quale è consentito il download limitatamente al solo certificato, in quanto la chiave privata, utilizzata esclusivamente per le operazioni di firma remota mediante i servizi forniti da RENTRI (aree web, app mobile, API di servizio) non può essere scaricata.

![signatures-accettazione](docs/media/image46.png)  
<span style="font-size:small;font-style:italic">Figura 55 - CA RENTRI - rilascio / revoca del certificato di firma remota<span>

L’utilizzo della chiave privata della firma remota rilasciata dal RENTRI deve essere autorizzato tramite l’inserimento di specifiche credenziali generate con un endpoint del dominio CA RENTRI.

Al momento della generazione delle credenziali il sistema gestionale dell’operatore indica l’identità dell’utente a cui sono associate le credenziali e i dati del dispositivo mobile che utilizzerà le credenziali. 
Così facendo il sistema gestionale, anche in mobilità, è in grado di attestare la riconducibilità all’utente che utilizza la firma remota RENTRI. 
La riconducibilità può essere ottenuta in presenza di identificazione informatica dell’utente del sistema gestionale.

Si rimanda alla “*Documentazione Interoperabilità RENTRI*” e in particolare API ca-rentri per maggiori informazioni relative alle possibili integrazioni applicative con i sistemi gestionali e le app mobile di 3e parti.

> ⚠️ **ATTENZIONE**
> 
> Le firme presenti nei file xFIR, essendo queste specifiche un’estensione di ASiC-E, possono essere validate con un qualsiasi strumento di validazione che implementi correttamente le specifiche eIDAS. 
> Tuttavia, per le firme digitali apposte con un certificato di dominio RENTRI, la validazione di attendibilità del certificato non potrà avere esito positivo, poiché la catena di certificazione del certificato non terminerà con un certificato CA presente in una delle “Trusted List” eIDAS.

---

*Ultimo aggiornamento: 25/09/2025*