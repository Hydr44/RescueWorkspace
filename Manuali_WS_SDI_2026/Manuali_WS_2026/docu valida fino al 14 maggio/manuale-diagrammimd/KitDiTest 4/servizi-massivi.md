ISTRUZIONI PER I
SERVIZI MASSIVI DI TRASMISSIONE E SCARICO FILE
PAG. 1 DI 28
ISTRUZIONI PER I
SERVIZI MASSIVI DI TRASMISSIONE E SCARICO FILE
VERSIONE 1.5
ISTRUZIONI PER I
SERVIZI MASSIVI DI TRASMISSIONE E SCARICO FILE
PAG. 2 DI 28
INDICE
STATO DEL DOCUMENTO 3
1. I SERVIZI MASSIVI DI TRASMISSIONE E SCARICO FILE 5
2. IL WEB SERVICE SM-SCARICO-FILE 8
2.1 DESCRIZIONE DELL’INTERFACCIA 9
2.1.1 Operazione inoltroRichiesta 9
2.1.1.1 Request 10
2.1.1.2 Response 11
2.1.2 Operazione esitoRichiesta 12
2.1.2.1 Request 13
2.1.2.2 Response 13
2.1.3 Operazione scaricoFile 15
2.1.3.1 Request 16
2.1.3.2 Response 16
3. IL WEB SERVICE SM-TRASMISSIONE-FILE 18
3.1 DESCRIZIONE DELL’INTERFACCIA 18
3.1.1 Operazione trasmissioneElenchi 19
3.1.1.1 Request 19
3.1.1.2 Response 20
3.1.2 Operazione esitoTrasmissione 21
3.1.2.1 Request 21
3.1.2.2 Response 22
4. CODICI DI ERRORI E LIMITI DI UTILIZZO 24
ISTRUZIONI PER I
SERVIZI MASSIVI DI TRASMISSIONE E SCARICO FILE
PAG. 3 DI 28
STATO DEL DOCUMENTO
MODIFICHE INTRODOTTE NELLA v1.5
1 I SERVIZI MASSIVI DI
TRASMISSIONE E SCARICO
FILE
Introdotta la possibilità di richiedere il download dei file-
fatture o un loro elenco (in formato csv) che risultano
accolti dal SdI in un dato intervallo temporale, In analogia
a quanto già previsto per le altre tipologie di richieste, sarà
possibile ottenere file-fatture afferenti al proprio flusso di
fatturazione sia attiva che passiva (escluse le fatture
emesse in reverse charge).
In caso di richieste in qualità di cessionario/committente, il
download di archivi contenenti file-fatture messi a
disposizione sul cassetto fiscale varrà come presa visione
di questi ultimi.
MODIFICHE INTRODOTTE NELLA v1.4
PARAGRAFO DESCRIZIONE
1 I SERVIZI MASSIVI DI
TRASMISSIONE E SCARICO
FILE
Introdotto due nuovi servizi massivi il primo riguarda i
“documenti IVA precompilati” che permette di richiedere il
download della dichiarazione precompilata iva, il secondo
permette di richiedere lo scarico massivo dei dati di sintesi
delle fatture della repubblica di San Marino.
4 CODICE DI ERRORE E
LIMITI DI UTILIZZO Introdotto un nuovo codice di errore riscontrabili in fase di
validazione di una richiesta per documenti IVA: 00218
MODIFICHE INTRODOTTE NELLA v1.3
PARAGRAFO DESCRIZIONE
1 I SERVIZI MASSIVI DI
TRASMISSIONE E SCARICO
FILE
Introdotto nuovo servizio massivo per i “documenti IVA
precompilati” che permette di richiedere il download delle
Liquidazioni periodiche IVA.
ISTRUZIONI PER I
SERVIZI MASSIVI DI TRASMISSIONE E SCARICO FILE
PAG. 4 DI 28
Introdotta possibilità di indicare nella stessa richiesta di
scarico file-fatture di tipo ELENCO più partite IVA
4 CODICE DI ERRORE E
LIMITI DI UTILIZZO
Introdotto un nuovo codici di errore riscontrabili in fase di
validazione di una richiesta per documenti IVA: 00217
MODIFICHE INTRODOTTE NELLA v1.2
PARAGRAFO DESCRIZIONE
1 I SERVIZI MASSIVI DI
TRASMISSIONE E SCARICO
FILE
Introdotto nuovo servizio massivo “documenti IVA
precompilati” che permette di richiedere il download dei
registri e dei prospetti IVA.
Introdotta possibilità di indicare nella stessa richiesta di
scarico file-fatture e corrispettivi più partite IVA
2 IL WEB SERVICE SM-
SCARICO-FILE
Aggiunti dettagli in merito a richieste riportanti più partite
IVA
4 CODICI DI ERRORI E LIMITI
DI UTILIZZO
Introdotti nuovi codici di errore riscontrabili in fase di
validazione di una richiesta per documenti IVA: 00209,
00210, 00211, 00212, 00213, 00214, 00215, 00504
Codici di errore introdotti o modificati per gestire le
richieste con più partite IVA: 00207,00216
MODIFICHE INTRODOTTE NELLA v1.1
PARAGRAFO DESCRIZIONE
1 I SERVIZI MASSIVI DI
TRASMISSIONE E SCARICO
FILE
Per il servizio massivo scarico file-fatture è possibile
ottenere, in alternativa ai file-fatture, un report in cui sono
riportati le principali informazioni relative ad essi.
ISTRUZIONI PER I
SERVIZI MASSIVI DI TRASMISSIONE E SCARICO FILE
PAG. 5 DI 28
1. I SERVIZI MASSIVI DI TRASMISSIONE E SCARICO FILE
Il presente documento contiene le specifiche tecniche necessarie all’interazione con le
funzionalità massive denominate Servizi Massivi di Trasmissione e Scarico file (SMTS).
Gli utenti già accreditati al servizio SdI-Cooperazione Operativa (SdICoop), di seguito
denominati provider, possono per il tramite di esse:
• scaricare massivamente i file relativi ad un circoscritto intervallo temporale e
riguardanti dati facenti capo ad una determinata Partita IVA. I file richiesti saranno
scaricabili in uno o più archivi compressi.
• trasmettere a sistema i cd elenchi B del bollo fatture ed ottenere un file di esito in
cui sono indicati i risultati delle modifiche trasmesse.
Per fruire della funzionalità di scarico, deve essere inoltrato a sistema una richiesta massiva
in formato xml la cui struttura segue il tracciato RichiestaServiziMassivi_v1.0.xsd e le regole
riportate nelle Specifiche Tecniche del formato dei file utilizzati nei Servizi Massivi di
Trasmissione e Scarico (di seguito indicate come Specifiche Tecniche di formato).
Al termine della sua elaborazione vengono creati e messi a disposizione i file richiesti,
suddivisi in più archivi compressi.
Analogamente, per utilizzare i servizi di trasmissione, occorre inoltrare a sistema una
richiesta massiva conforme al tracciato RichiestaServiziMassivi_v1.0.xsd.
Ad elaborazione terminata, viene prodotto un file di esito in formato compresso.
Sia per i servizi di scarico massivo che per quello di trasmissione, la richiesta massiva
riguardante una specifica partita IVA, di seguito soggetto interessato, deve esser firmata
per mezzo di firma qualificata dal soggetto richiedente identificabile nello stesso titolare
della partita IVA ovvero in un suo intermediario delegato.
I formati ammessi per firmare elettronicamente le richieste sono i seguenti:
- CAdES-BES (CMS Advanced Electronic Signatures) con struttura aderente alla specifica
pubblica ETSI TS 101 733 V1.7.4, così come previsto dalla normativa vigente in materia
a partire dal 1° settembre 2010;
ISTRUZIONI PER I
SERVIZI MASSIVI DI TRASMISSIONE E SCARICO FILE
PAG. 6 DI 28
- XAdES-BES (XML Advanced Electronic Signatures), con struttura aderente alla specifica
pubblica ETSI TS 101 903 versione 1.4.1, così come previsto dalla normativa vigente in
materia a partire dal 1° settembre 2010.
Per poter utilizzare uno o più servizi, ogni titolare di partita IVA, o il suo intermediario
delegato, deve abilitare i provider attraverso i quali intende inoltrare richieste di fornitura
massive: questa abilitazione può essere effettuata utilizzando la funzionalità 'Censimento
canali per forniture massive', accessibile nella sezione Consultazione del portale
Fatture&Corrispettivi.
Vi sono attualmente quattro servizi massivi a disposizione:
- Scarico file-fatture che permette di scaricare:
• i file-fatture afferenti ad una o più (al più 30) partite IVA ricevuti dal
cessionario/committente, emessi dal cedente/prestatore o accolti dal SdI in
uno dato intervallo di tempo;
• i file-fatture relativi ad una partita IVA indicando una lista di identificativi
SdI;
• i report contenenti gli estremi dei file-fatture (identificativo SdI del file,
nome del file, numero fattura, …) relativi a più partita IVA in uno specifico
lasso temporale;
• i dati di sintesi di fatture emesse e ricevute dalla repubblica di San Marino.
- Scarico corrispettivi che permette di scaricare:
• i corrispettivi relativi ad una o più (al più 30) partite IVA in uno specifico
lasso di tempo;
- Scarico documenti IVA precompilati che permette di scaricare:
• le bozze dei registri e dei prospetti IVA relativi ad una mensilità o trimestre
per una specifica partita IVA;
• le liquidazioni periodiche IVA relativi ad un trimestre per una specifica
partita IVA;
ISTRUZIONI PER I
SERVIZI MASSIVI DI TRASMISSIONE E SCARICO FILE
PAG. 7 DI 28
• dichiarazione annuale iva;
- Scarico e Trasmissione Elenchi Bollo
• che permette di scaricare gli elenchi bollo A e B relativi ad una partita IVA
di uno specifico trimestre e di trasmettere l’elenco B modificato.
Per il servizio di scarico file-fatture è da precisare che sono escluse da tutte le operazioni di
download le fatture emesse in reverse charge e che, in caso di una richiesta massiva inoltrata
in qualità di cessionario/committente, il download di un archivio contenente al suo interno
fatture messe a disposizione del destinatario sul cassetto fiscale varrà come presa visione delle
stesse.
I SMTS sono costituiti da due web service esposti su rete internet sul dominio
servizi.fatturapa.it:
- sm-scarico-file
• che è unico per tutti i servizi di scarico massivo, tramite cui è possibile
richiedere ed effettuare lo scarico di varie tipologie di file relativi ad una
specifica partita IVA (o più) rientranti in un determinato lasso di tempo;
- sm-trasmissione-file
• per il cui tramite cui è possibile trasmettere a sistema l’elenco B del bollo
fattura relativo ad una singola partita IVA e ottenere il file di esito.
Nei paragrafi seguenti, sono descritti i web service con le operazioni rese disponibili in
ciascuna interfaccia.
ISTRUZIONI PER I
SERVIZI MASSIVI DI TRASMISSIONE E SCARICO FILE
PAG. 8 DI 28
2. IL WEB SERVICE SM-SCARICO-FILE
Il web service in oggetto implementa tutti i servizi di scarico massivi, permettendo
al titolare di una partita IVA, o a un suo intermediario delegato, per mezzo di un provider
abilitato in precedenza, di scaricare massivamente file.
Questi ultimi saranno resi disponibili in uno o più archivi in formato compresso.
A supporto di questo flusso, sono esposte tre distinte operazioni:
1) inoltro di una richiesta di scarico massivo;
2) recupero dell’esito della richiesta trasmessa ed eventuale lista di identificativi
univoci degli archivi creati;
3) scarico del singolo archivio.
Attraverso la prima operazione, viene trasmessa - in allegato alla SOAP request - la richiesta
di scarico in formato xml conforme al tracciato RichiestaServiziMassivi_v1.0.xsd (descritto in
dettaglio nelle Specifiche tecniche di formato); in risposta, il sistema fornirà l’identificativo
assegnato alla richiesta.
Tale identificativo deve essere poi utilizzato nella seconda operazione che comunica al
richiedente lo stato di elaborazione del processo; la richiesta potrebbe risultare:
• in elaborazione;
• scartata;
• elaborata.
Nell’ultimo caso viene fornito, in allegato alla risposta, un file contenente un elenco di
identificativi univoci dei diversi archivi creati.
Infine, con la terza operazione, indicando il numero della richiesta elaborata e uno degli
identificativi univoci ottenuti nello step precedente, si ottiene l’archivio richiesto.
Questa operazione deve essere ripetuta tante volte quanti archivi sono stati prodotti a
fronte della richiesta inoltrata.
In caso di richiesta massiva in cui sono indicate più partite IVA, il mancato superamento di
uno dei controlli in fase di elaborazione comporta lo scarto dell’intera richiesta. Inoltre, se
correttamente elaborata, i singoli archivi prodotti conterranno i documenti di una sola
ISTRUZIONI PER I
SERVIZI MASSIVI DI TRASMISSIONE E SCARICO FILE
PAG. 9 DI 28
partita IVA, indicata dagli ultimi undici caratteri (estensione esclusa) nel nome dello zip. In
aggiunta, nel caso in cui il sistema individuasse documenti solo per alcune partite IVA
indicate, la richiesta risulterà correttamente elaborata e sarà possibile scaricare gli archivi
prodotti.
2.1 DESCRIZIONE DELL’INTERFACCIA
L’interfaccia da implementare per il web service sm-scarico-file è descritta nel file
ServiziScaricoMassivo_v1.0.wsdl.
I tipi ai quali fa riferimento sono definiti nel file ServiziMassiviTypes_v1.0.xsd.
2.1.1 OPERAZIONE INOLTRORICHIESTA
L’operazione permette di inoltrare una richiesta di scarico massivo e di ottenere
l’identificativo univoco ad essa assegnata.
La richiesta di scarico massivo trasmessa deve essere:
- in formato xml e conforme al tracciato RichiestaServiziMassivi_v1.0.xsd ed alle
indicazioni riportate nelle Specifiche tecniche di formato;
ISTRUZIONI PER I
SERVIZI MASSIVI DI TRASMISSIONE E SCARICO FILE
PAG. 10 DI 28
- firmata con firma qualificata dal soggetto richiedente il quale può essere il titolare
della partita IVA indicata, cd soggetto interessato, ovvero un suo intermediario
delegato.
La firma apposta può essere di tipo:
- CAdES-BES (CMS Advanced Electronic Signatures) con struttura aderente alla
specifica pubblica ETSI TS 101 733 V1.7.4, così come previsto dalla normativa
vigente in materia a partire dal 1settembre 2010;
- XAdES-BES (XML Advanced Electronic Signatures), con struttura aderente alla
specifica pubblica ETSI TS 101 903 versione 1.4.1, così come previsto dalla
normativa vigente in materia a partire dal 1settembre 2010.
Inoltre, ogni titolare di partita IVA, ovvero un suo intermediario delegato, deve aver censito
il provider che intende utilizzare come canale, per fruire di uno o più servizi di scarico
massivo, accedendo alle apposite funzionalità sul portale Fatture&Corrispettivi.
2.1.1.1 REQUEST
La request SOAP InoltroRichiestaRequest presenta la seguente struttura:
I parametri di input sono descritti di seguito:
Parametro Descrizione
FileRichiesta File di richiesta di scarico.
L’ elemento è composto da:
ISTRUZIONI PER I
SERVIZI MASSIVI DI TRASMISSIONE E SCARICO FILE
PAG. 11 DI 28
- NomeFile: nome del file allegato costituito da una
serie di caratteri alfanumerici di lunghezza
variabile da 9 a 50;
- File: Allegato contenente il file convertito in
base64Binary (il file deve essere conforme al
tracciato RichiestaServiziMassivi_v1.0.xsd ed alle
prescrizioni riportate nelle Specifiche tecniche di
formato).
2.1.1.2 RESPONSE
La response SOAP InoltroRichiestaResponse presenta la seguente struttura:
I parametri di output sono descritti di seguito:
Parametro Descrizione
IdRichiesta Identificativo della richiesta di scarico massivo assegnato
dal sistema.
DataOraRicezione Data e ora della ricezione della richiesta.
ISTRUZIONI PER I
SERVIZI MASSIVI DI TRASMISSIONE E SCARICO FILE
PAG. 12 DI 28
Errore Eventuale errore riscontrato in fase di trasmissione della
richiesta. È strutturato in 2 elementi:
- Codice: codice di errore generico.
Può assumere i valori:
- ER01 = SERVIZIO NON DISPONIBILE
- ER02 = UTENTE NON ABILITATO
- ER03 = RICHIESTA TROPPO FREQUENTE
- ER04 = PARAMETRI DI INPUT NON VALIDI
- ER05 = DATO NON TROVATO
- Descrizione: breve descrizione dell’errore
2.1.2 OPERAZIONE ESITORICHIESTA
L’operazione permette di verificare lo stato di una determinata richiesta attraverso l’invio
dell’identificativo corrispondente. In risposta, il sistema produrrà una serie di informazioni
relative allo stato del processo di elaborazione, al tipo della richiesta, l’eventuale elenco
degli archivi creati o la tipologia di errore riscontrato nella stessa.
Una richiesta potrà risultare nello stato:
- Non disponibile (ST00), l’identificativo indicato nella chiamata non corrisponde a
nessuna richiesta trasmessa dal provider che ne ha richiesto l’esito;
- In elaborazione (ST01), la richiesta è presente a sistema ed è in lavorazione, occorre
ripetere più tardi l’operazione;
- Scartato (ST02), la richiesta è stata scartata per i motivi riportati nella lista di
dettaglio degli errori e non verrà creato alcun file o archivio;
- Elaborato (ST03), la richiesta è stata correttamente elaborata, sono stati prodotti i
file richiesti e nella risposta viene restituito in allegato un file in formato xml
contenente un elenco di identificativi e dettagli dei vari archivi scaricabili.
ISTRUZIONI PER I
SERVIZI MASSIVI DI TRASMISSIONE E SCARICO FILE
PAG. 13 DI 28
L’operazione può essere richiamata per la stessa richiesta al più 10 volte, nel caso si
superasse tale limite il chiamante riscontrerà in risposta l’errore ER03 – Richiesta troppo
frequente.
2.1.2.1 REQUEST
La request SOAP EsitoRichiestaRequest presenta la seguente struttura:
Il parametro di input è descritto di seguito.
Parametro Descrizione
IdRichiesta Identificativo della richiesta di scarico massivo assegnato
dal sistema
2.1.2.2 RESPONSE
La response SOAP EsitoRichiestaResponse ha la seguente struttura:
ISTRUZIONI PER I
SERVIZI MASSIVI DI TRASMISSIONE E SCARICO FILE
PAG. 14 DI 28
I parametri di output sono descritti di seguito.
Parametro Descrizione
Stato Stato della richiesta:
- ST00 = NON DISPONIBILE
- ST01 = IN ELABORAZIONE
- ST02 = SCARTATO
- ST03 = ELABORATO
Tipo Indica la tipologia di richiesta effettuata
EsitoFile File in cui è riportato in caso di scarto l’elenco di errori, in caso
di elaborazione, l’elenco degli archivi creati a fronte della
richiesta di scarico.
L’ elemento è composto da:
- NomeFile: nome del file allegato.
ISTRUZIONI PER I
SERVIZI MASSIVI DI TRASMISSIONE E SCARICO FILE
PAG. 15 DI 28
- File: Allegato contenente il file convertito in
base64Binary (è un file in formato xml)
DataOraProduzioneFile Indica la data di produzione dei file da scaricare.
Errore È strutturato in 2 elementi:
- Codice: codice di errore generico.
Assume i seguenti valori:
- ER01 = SERVIZIO NON DISPONIBILE
- ER02 = UTENTE NON ABILITATO
- ER03 = RICHIESTA TROPPO FREQUENTE
- ER04 = PARAMETRI DI INPUT NON VALIDI
- ER05 = DATO NON TROVATO
- Descrizione: breve descrizione dell’errore
2.1.3 OPERAZIONE SCARICOFILE
L’operazione in oggetto permette di scaricare i singoli archivi indicando l’identificativo della
richiesta e quello dell’archivio creato.
È possibile ottenere in risposta un archivio contenente i documenti richiesti; in caso di
eventuali errori riscontrati in fase di esecuzione dell’operazione, il sistema restituisce una
serie di codici correlati con la relativa descrizione.
Il Sistema, in caso di primo tentativo di scarico di un archivio contenente file-fatture,
effettua in automatico la presa visione di tutti i documenti contenuti in esso.
Nel caso in cui si provasse a scaricare lo stesso archivio più volte contemporaneamente,
ovvero si provasse a scaricare più di 10 archivi per la stessa richiesta in meno di due minuti
l’utente riscontrerà l’errore in risposta ER03 – Richiesta troppo frequente.
ISTRUZIONI PER I
SERVIZI MASSIVI DI TRASMISSIONE E SCARICO FILE
PAG. 16 DI 28
2.1.3.1 REQUEST
La request SOAP ScaricoFileRequest presenta la seguente struttura:
I parametri di input sono descritti di seguito:
Parametro Descrizione
IdRichiesta Identificativo della richiesta di scarico massivo assegnato
dal sistema
IdFile Identificativo univoco dell’archivio da scaricare creato a
fronte della richiesta di scarico.
2.1.3.2 RESPONSE
La response SOAP ScaricoFileResponse presenta la seguente struttura:
ISTRUZIONI PER I
SERVIZI MASSIVI DI TRASMISSIONE E SCARICO FILE
PAG. 17 DI 28
I parametri di output sono riportati di seguito.
Parametro Descrizione
ArchivioFile Archivio creato a fronte della richiesta di scarico.
L’elemento è composto da:
• NomeFile: nome del file allegato costituito da una
serie di caratteri alfanumerici di lunghezza
variabile da 9 a 50.
• File: Allegato contenente l’archivio convertito in
base64Binary (i vari file contenuti nell’archivio
sono descritti nelle Specifiche tecniche di formato)
Errore Eventuale dettaglio degli errori riscontrati
nell’accoglienza della richiesta. È strutturato in due
elementi:
- Codice: codice di errore generico.
Può assumere i valori:
- ER01 = SERVIZIO NON DISPONIBILE
- ER02 = UTENTE NON ABILITATO
- ER03 = RICHIESTA TROPPO FREQUENTE
- ER04 = PARAMETRI DI INPUT NON VALIDI
- ER05 = DATO NON TROVATO
- Descrizione: descrizione generica dell’errore
ISTRUZIONI PER I
SERVIZI MASSIVI DI TRASMISSIONE E SCARICO FILE
PAG. 18 DI 28
3. IL WEB SERVICE SM-TRASMISSIONE-FILE
Il seguente web service, in analogia agli altri servizi sopra descritti, sarà esposto su rete
internet e fornisce la possibilità ai titolari di partita IVA o a un loro intermediario delegato,
di trasmettere in modalità massiva i dati relativi agli elenchi B del bollo e, attraverso il
medesimo servizio, di richiederne l’esito di avvenuta ricezione ed elaborazione da parte del
sistema, sempre avvalendosi di uno dei provider accreditati SdICoop.
A supporto del flusso, sono esposte due distinte operazioni:
- trasmissione di un elenco B;
- comunicazione dell’esito relativo alla trasmissione stessa.
Tramite la prima operazione sarà possibile trasmettere un file xml firmato e conforme alle
norme e regole riportate nelle Specifiche Tecniche di formato. In risposta, il sistema restituirà
un identificativo univoco che individuerà la richiesta stessa: tale flusso ricalca quello
previsto per la trasmissione delle richieste massive di scarico.
La seconda ed ultima operazione prevista permette di comunicare lo stato della
trasmissione e, in caso di esito positivo, restituisce il file di risposta prodotto in fase di
elaborazione.
3.1 DESCRIZIONE DELL’INTERFACCIA
L’interfaccia da implementare per il web service sm-trasmissione-file è descritta nel file
ServiziTrasmissioneMassiva_v1.0.wsdl.
ISTRUZIONI PER I
SERVIZI MASSIVI DI TRASMISSIONE E SCARICO FILE
PAG. 19 DI 28
I tipi ai quali fa riferimento sono definiti nel file ServiziMassiviTypes_v1.0.xsd.
3.1.1 OPERAZIONE TRASMISSIONEELENCHI
L’operazione permette di inoltrare una richiesta a sistema al fine di ottenere l’identificativo
univoco ad essa assegnata.
Tale richiesta in formato xml include tutte le informazioni necessarie per il processo di
trasmissione in conformità alla struttura RichiestaServiziMassivi_v1.0.xsd indicata nelle
Specifiche Tecniche di formato; come descritto nel paragrafo introduttivo, la richiesta deve
essere firmata con firma qualificata dal soggetto richiedente il quale può essere il titolare
della partita IVA indicata nella richiesta, ovvero un suo intermediario delegato.
Le tipologie di firme ammesse sono le stesse indicate nel paragrafo 2.1.1; inoltre, il provider
tramite cui il soggetto richiedente intende procedere con la trasmissione di una specifica
tipologia di file deve risultare abilitato per il corrispondente servizio massivo, dal soggetto
interessato o da un suo intermediario delegato, nell’apposita funzionalità di censimento
del portale Fatture&Corrispettivi.
3.1.1.1 REQUEST
La request SOAP TrasmissioneElenchiRequest presenta la seguente struttura:
I parametri di input sono descritti di seguito.
Parametro Descrizione
ISTRUZIONI PER I
SERVIZI MASSIVI DI TRASMISSIONE E SCARICO FILE
PAG. 20 DI 28
FileElenchi File contente al suo interno l’Elenco B del bollo da
trasmettere a sistema.
L’ elemento è composto da:
- NomeFile: nome del file allegato costituito da una
serie di caratteri alfanumerici di lunghezza
variabile da 9 a 50.
- File: Allegato contenente il file convertito in
base64Binary (il file deve essere conforme al
tracciato RichiestaServiziMassivi_v1.0.xsd ed alle
prescrizioni riportate nelle Specifiche tecniche di
formato)
3.1.1.2 RESPONSE
La response SOAP TrasmissioneElenchiResponse riprende la seguente struttura:
I parametri di output sono descritti di seguito.
Parametro Descrizione
IdTrasmissione Identificativo della trasmissione assegnato dal sistema
DataOraTrasmissione Data e ora della trasmissione a sistema del file.
ISTRUZIONI PER I
SERVIZI MASSIVI DI TRASMISSIONE E SCARICO FILE
PAG. 21 DI 28
Errore Eventuale errore riscontrato in fase di trasmissione della
richiesta. È strutturato in due elementi:
- Codice: codice di errore generico.
Può assumere i valori:
- ER01 = SERVIZIO NON DISPONIBILE
- ER02 = UTENTE NON ABILITATO
- ER03 = RICHIESTA TROPPO FREQUENTE
- ER04 = PARAMETRI DI INPUT NON VALIDI
- ER05 = DATO NON TROVATO
- Descrizione: breve descrizione dell’errore
3.1.2 OPERAZIONE ESITOTRASMISSIONE
L’operazione permette di verificare lo stato di elaborazione del file trasmesso, identificabile
tramite l’id assegnato dal sistema che in risposta restituisce informazioni relative alla
trasmissione e l’eventuale file di esito.
I possibili stati di elaborazione sono gli stessi elencati e descritti nel paragrafo 2.1.2.
3.1.2.1 REQUEST
La request SOAP EsitoTrasmissioneRequest presenta la seguente struttura:
Il parametro di input è descritto di seguito.
Parametro Descrizione
IdTrasmissione Identificativo della trasmissione dell’elenco assegnato dal
sistema
ISTRUZIONI PER I
SERVIZI MASSIVI DI TRASMISSIONE E SCARICO FILE
PAG. 22 DI 28
3.1.2.2 RESPONSE
La response SOAP EsitoTrasmissioneResponse riprende la seguente struttura dati:
I parametri di output sono descritti di seguito.
Parametro Descrizione
Stato Stato della richiesta:
- ST00 = NON DISPONIBILE
- ST01= IN ELABORAZIONE
- ST02= SCARTATO
- ST03= ELABORATO
Tipo Indica la tipologia di file trasmesso
FileEsito L’ elemento è composto da:
- NomeFile: nome del file allegato.
- File: Allegato contenente il file convertito in
base64Binary la cui struttura è descritta nelle
Specifiche tecniche di formato
DataOraProduzioneEsito Indica la data di produzione del file di esito.
ISTRUZIONI PER I
SERVIZI MASSIVI DI TRASMISSIONE E SCARICO FILE
PAG. 23 DI 28
Errore
Eventuale dettaglio degli errori riscontrati.
È strutturato in 2 elementi:
- Codice: codice di errore generico.
Assume i seguenti valori:
- ER01 = SERVIZIO NON DISPONIBILE
- ER02 = UTENTE NON ABILITATO
- ER03 = RICHIESTA TROPPO FREQUENTE
- ER04 = PARAMETRI DI INPUT NON VALIDI
- ER05 =DATO NON TROVATO
- Descrizione: breve descrizione dell’errore
ISTRUZIONI PER I
SERVIZI MASSIVI DI TRASMISSIONE E SCARICO FILE
PAG. 24 DI 28
4. CODICI DI ERRORI E LIMITI DI UTILIZZO
La fase di elaborazione della richiesta prevede diversi controlli formali e semantici del file
trasmesso a sistema.
Si riportano di seguito i codici di errore che possono essere riscontrati:
LISTA CODICI ERRORE
Codice Descrizione
00100 Certificato di firma scaduto.
00101 Certificato di firma revocato.
00102 Firma non valida.
00103 File firmato senza riferimento temporale.
00104 Certification Authority non affidabile.
00105 File firmato con riferimento temporale non coerente.
00106 Formato del certificato di firma non valido.
00107 Certificato di firma non valido.
00108 Firma assente o non valida.
00200 File non conforme al tracciato.
00201 Intervallo temporale indicato troppo ampio.
ISTRUZIONI PER I
SERVIZI MASSIVI DI TRASMISSIONE E SCARICO FILE
PAG. 25 DI 28
LISTA CODICI ERRORE
Codice Descrizione
00202 Numero massimo di elementi superato (codice valido solo per le richieste di
trasmissione degli elenchi B del bollo).
00203 Valore non consentito per il tag <TipoRichiesta>.
00204 “Data a” nel futuro.
00205 “Data da” nel futuro.
00206 “Data da” successiva a “Data a”.
00207 La richiesta presenta più soggetti IVA rispetto al numero consentito
00208 La tipologia di richiesta non è conforme a quella dichiarata.
00209 L'anno non è stato dichiarato.
00210 L'anno dichiarato non è valido.
00211 Il mese o il trimestre non è stato dichiarato.
00212 Il mese o il trimestre dichiarato non è valido (non presente fra i valori ammessi).
00213 Il mese dichiarato non è valido (mese non processabile).
00214 Il trimestre dichiarato non è valido (trimestre non processabile).
ISTRUZIONI PER I
SERVIZI MASSIVI DI TRASMISSIONE E SCARICO FILE
PAG. 26 DI 28
LISTA CODICI ERRORE
Codice Descrizione
00215 La tipologia di output richiesta non è compatibile con la tipologia di registro.
00216 La tipologia di richiesta non prevede l'indicazione di più soggetti IVA
00217 La tipologia di output richiesta non è compatibile con il tipo documento.
00218 Lo stato ‘..’ per il tipo documento ‘..’ non può assumere il valore ‘..’ come tipo
modello.
00300 Verifica anagrafica non valida per la piva.
00301 Al codice fiscale non risulta associata nessuna partita iva.
00302 Il codice fiscale del richiedente non risulta valido.
00400 Per il soggetto firmatario non risulta esservi una delega con il soggetto titolare per la
tipologia di richiesta.
00500 Il titolare non ha aderito al servizio di consultazione.
00501 La richiesta non ha prodotto alcun file.
00502 La richiesta ha prodotto un numero di file maggiore della soglia massima consentita.
00503 La richiesta ha prodotto un numero di archivi maggiore della soglia massima
consentita.
ISTRUZIONI PER I
SERVIZI MASSIVI DI TRASMISSIONE E SCARICO FILE
PAG. 27 DI 28
LISTA CODICI ERRORE
Codice Descrizione
00504 Il titolare non è abilitato ai servizi della precompilata IVA.
00600 Il documento ha più tipologie di firma.
00601 Il provider non è abilitato a fornire il servizio richiesto per la partita IVA indicata.
00602 Richiesta duplicata.
00603 Il documento non presenta alcuna firma.
00604 Per la partita IVA indicata è stato superato il numero massimo di richieste consentite
della medesima tipologia.
00700 La richiesta non ha prodotto risultati per il codice fiscale, partita iva, anno e trimestre
indicati.
Per ogni partita IVA e soggetto richiedente è possibile inviare al più 10 richieste al giorno della
medesima tipologia; inoltre, dove è richiesto di indicare uno specifico intervallo temporale, tale
lasso di tempo non può superare i 3 mesi.
Per ogni richiesta massiva possono essere generati al massimo 50 archivi, ciascuno di
dimensione massima pari a 35 MB.
I file messi a disposizione dai servizi massivi sono scaricabili dal richiedente:
- nei successivi 30 giorni,
• in caso di file-fatture, corrispettivi ed esiti di elaborazione degli elenchi B;
- nei successivi 15 giorni,
• in caso di elenchi A e B.
L’elenco B modificato può contenere al più 5000 righe.
È infine da osservare che tramite il servizio documenti IVA, possono essere scaricati solo i registri
ed i prospetti IVA relativi a soggetti IVA rientranti nella cosiddetta platea abilitata alla
ISTRUZIONI PER I
SERVIZI MASSIVI DI TRASMISSIONE E SCARICO FILE
PAG. 28 DI 28
consultazione, modifica e memorizzazione dei registri IVA. Per verificare tale condizione, il
titolare o un suo intermediario delegato può recarsi nella propria area riservata sul portale F&C
nella sezione Documenti IVA Precompilati.