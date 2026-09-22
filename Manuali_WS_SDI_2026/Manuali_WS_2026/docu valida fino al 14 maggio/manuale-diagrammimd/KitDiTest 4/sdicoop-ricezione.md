ISTRUZIONI PER IL
SERVIZIO “SDICOOP - RICEZIONE”
VERSIONE 3.3
Pag. 1 di 32
INDICE
1. FATTURE 3
1.1 GLOSSARIO 3
1.2 IL SERVIZIO SDICOOP - RICEZIONE 4
1.3 IL WEB-SERVICE RicezioneFatture 6
1.3.1 Operazione RiceviFatture 6
1.3.2 Operazione NotificaDecorrenzaTermini 9
1.4 IL WEB-SERVICE SdIRiceviNotifica 10
1.4.1 Operazione NotificaEsito 10
2. DATI FATTURA E COMUNICAZIONI DATI LIQUIDAZIONI IVA 12
2.1 GLOSSARIO 12
2.2 IL SERVIZIO SDIDATI 13
2.3 IL WEB-SERVICE SdITrasmissioneFile 15
2.3.1 Operazione Trasmetti 15
2.3.2 Operazione Esito 18
2.3.3 Tipo file 19
3. SERVIZI MASSIVI DI QUADRATURA E REINOLTRO 20
3.1 IL WEB-SERVICE QUADRATURA-FLUSSO-RICEZIONE 20
3.1.1 DESCRIZIONE DELL’INTERFACCIA 20
3.1.1.1 Operazione RichiestaReportQuadraturaFlussoRicezioneB2G 21
3.1.1.2 Operazione RichiestaReportQuadraturaFlussoRicezioneB2B 23
3.1.1.3 Operazione ScaricoReportQuadraturaFlussoRicezione 24
3.2 IL WEB-SERVICE REINOLTRO-FLUSSO-RICEZIONE 26
3.2.1 DESCRIZIONE DELL’INTERFACCIA 26
3.2.1.1 Operazione RichiestaReinoltroFlussoRicezioneFileFattura 26
3.2.1.2 Operazione RichiestaReinoltroFlussoRicezioneNotifica 30
3.2.1.3 Operazione ScaricoReportReinoltroFlussoRicezione 30
Pag. 2 di 32
1. FATTURE
1.1 GLOSSARIO
Si definisce:
- destinatario: soggetto, sia esso cessionario/committente o terzo
intermediario, al quale il SdI deve inviare il file Fattura ricevuto dal
trasmittente;
- file fatturaPA: file conforme alle specifiche del formato FatturaPA pubblicate
sul sito www.fatturapa.gov.it (formato trasmissione FPA12);
- file fatturaB2B: file conforme alle specifiche del formato B2B pubblicate sul
sito dell’Agenzia delle entrate nell’Allegato A al provvedimento del 30 aprile
2018 (formato trasmissione FPR12);
- file fattura semplificata: file conforme alle specifiche del formato B2B
pubblicate sul sito dell’Agenzia delle entrate nell’Allegato A al provvedimento
del 30 aprile 2018 (formato trasmissione FSM10);
- file dei metadati: file in cui sono presenti alcuni dati principali di riferimento
del file Fattura e che, insieme ad esso, il SdI invia al destinatario;
- file messaggi: file conforme a quanto riportato all’allegato B-1 delle
specifiche attuative delle regole tecniche pubblicate sul sito
www.fatturapa.gov.it;
- file archivio: file compresso (.zip) contenente uno più file fattura;
- interfaccia: ciò che il web-service espone per interagire con un altro
sistema;
- notifica di decorrenza termini: valida solo per il file fatturaPA, è la
comunicazione che il SdI invia sia al destinatario che al trasmittente trascorsi
15 giorni senza aver ricevuto notifica di esito committente;
- notifica di esito committente: valida solo per il file fatturaPA, è la
comunicazione che il destinatario invia al SdI per esplicitare l’accettazione o
il rifiuto di ogni singola fattura contenuta nel file ricevuto;
- scarto esito committente: valida solo per il file fatturaPA, è la
comunicazione che il SdI invia al destinatario per segnalare un’eventuale
situazione di non ammissibilità o non conformità della notifica di esito
committente;
- servizio: nell’ambito della Fatturazione Elettronica verso la Pubblica
Amministrazione per servizio si intende uno dei canali previsti dal SdI per
Pag. 3 di 32
1.2 l’interoperabilità dei sistemi nella gestione della trasmissione e della
ricezione dei file fattura e dei file messaggi;
- SdI: Sistema di Interscambio, struttura istituita dal Ministero dell’Economia e
delle Finanze attraverso la quale avviene la trasmissione delle fatture
elettroniche verso la Pubblica Amministrazione (art.1, comma 211, legge 24
dicembre 2007 n. 244);
- trasmittente: soggetto, sia esso cedente/prestatore o terzo intermediario,
che trasmette al SdI il file fattura ovvero il file archivio;
- web-service: sistema software in grado di garantire l’interoperabilità tra
sistemi che si trovano sulla stessa rete.
- Sistema di accreditamento: il sistema che permette agli utenti di effettuare
l’accreditamento al SDI tramite una procedura dedicata.
- Accordo di servizio: il documento, generato sul Sistema di Accreditamento,
che contiene le regole relative al flusso telematico fra il soggetto trasmittente
e/o ricevente ed il SdI.
IL SERVIZIO SDICOOP - RICEZIONE
Il presente documento contiene le istruzioni necessarie per interagire con il
Sistema di Interscambio attraverso il Servizio SDICoop nel ruolo di destinatario.
Tale Servizio consente al destinatario, tramite un canale di cooperazione
applicativa, di:
- ricevere dal SdI un file fattura
- solo per la fatturaPA, inviare al SdI le notifiche di esito committente relative
ad ogni file fatturaPA contenuta nei file ricevuti;
- solo per la fatturaPA, ricevere l’eventuale scarto esito committente.
In particolare, il Servizio SDICoop – Ricezione è costituito da due web-services
differenti:
- RicezioneFatture: esposto dal destinatario, si occupa della ricezione dei
file fattura inviati dal SdI, tenendo conto dei diversi formati di trasmissione
(FPR12, FPA12, FSM10). Il servizio viene esposto sulla base di endpoint
che vengono comunicati in fase di accreditamento. E’ possibile modificare
gli endpoint indicati in qualsiasi momento attraverso l’apposita funzione
presente sul Sistema di Accreditamento.
- SdIRiceviNotifica: esposto dal SdI per i soli file fatturaPA, si occupa di
ricevere la notifica di esito committente e di restituire l’eventuale scarto esito
committente.
Nella figura che segue, sono descritti i due web-services con le operazioni
rese disponibili in ciascuna interfaccia.
Pag. 4 di 32
Il Servizio SDICoop – Ricezione
Di seguito, per ciascun web-service, sono descritte la Request SOAP e la
Response SOAP relative a ogni operazione con il dettaglio della struttura dei
singoli messaggi.
Legenda dei simboli usati in seguito
Web-service
Operazione Input
Output
Nome tag
Nome element
Tipo element
Versione
Nota bene
I file wsdl ed i file xsd ai quali si farà riferimento in seguito sono reperibili, insieme
ad una copia di questo documento, sul sito www.fatturapa.gov.it → Norme e
regole →Documentazione Sistema di Interscambio.
Pag. 5 di 32
La presa visione dell’Accordo di servizio sul Sistema di Accreditamento
implica la completa accettazione delle regole tecniche qui descritte.
1.3 IL WEB-SERVICE RICEZIONEFATTURE
Il web-service RicezioneFatture è esposto dal destinatario.
Esso prevede due operazioni. Con la prima:
- riceve in input un file fattura e il relativo file dei metadati, che rispetta la
tipologia di fattura (FPR12, FPA12, FSM10);
- restituisce in output un esito di presa in carico;
con la seconda:
- riceve un’eventuale notifica di decorrenza termini, per i soli file fatturaPA.
Descrizione dell’interfaccia
L’interfaccia che deve essere implementata per il web-service
RicezioneFatture è descritta nel file RicezioneFatture_v1.0.wsdl.
1.3.1 OPERAZIONE RICEVIFATTURE
L’operazione RiceviFatture si occupa della ricezione del file fattura inoltrato dal
SdI con il relativo file dei metadati, il cui tracciato dipenderà dal formato
trasmissione (FPA12, FPR12,FSM10).
Pag. 6 di 32
Request
La request SOAP presenta la seguente struttura:
I parametri di input sono descritti di seguito:
Parametro Descrizione
IdentificativoSdI Identificativo assegnato al file da SdI
NomeFile Nome file da ricevere
File Allegato contenente il file fattura, ovvero il file
archivio, convertito in base64Binary conforme allo
schema xsd della “Fattura1”
.
NomeFileMetadati Nome del file dei metadati relativo al file fattura da
ricevere
Metadati Allegato contenente il file dei metadati, convertito in
base64Binary, conforme allo schema xsd della
“Notifica metadati del file fattura al destinatario2”.
I tipi ai quali si fa riferimento sono definiti nel file RicezioneTypes_v1.0.xsd.
1 conforme a quanto riportato nelle specifiche tecniche al provvedimento del 30 aprile 2018 sul
sito dell’Agenzia delle entrate . 2 conforme a quanto riportato nell’allegato B-1 delle specifiche tecniche pubblicate sul sito
www.fatturapa.gov.it (per la fatturaPA) o nell’allegato A delle specifiche tecniche al provvedimento
del 30 aprile 2018 sul sito dell’Agenzia delle entrate (per la fattura B2B e semplificata)
Pag. 7 di 32
Response
La response SOAP presenta la seguente struttura:
Il parametro di output è descritto di seguito:
Parametro Descrizione
Esito Esito della ricezione. Può assumere uno dei
seguenti valori:
• ER01 = presa in carico
I tipi ai quali si fa riferimento sono definiti nel file RicezioneTypes_v1.0.xsd.
Pag. 8 di 32
1.3.2 OPERAZIONE NOTIFICADECORRENZATERMINI
L’operazione NotificaDecorrenzaTermini consente al destinatario di ricevere una
notifica di decorrenza termini dal Sistema di Interscambio per ogni file fatturaPA ricevuto
precedentemente.
Request
La request SOAP presenta la seguente struttura:
I parametri di input sono descritti di seguito:
Parametro Descrizione
IdentificativoSdI Identificativo assegnato al file da SdI
NomeFile Nome file della notifica di decorrenza termini
File Allegato contenente il file messaggi convertito
in base64Binary, conforme allo schema xsd
della “Notifica di decorrenza termini3”
I tipi ai quali si fa riferimento sono definiti nel file RicezioneTypes_v1.0.xsd.
L’operazione NotificaDecorrenzaTermini non prevede Response SOAP.
3 conforme a quanto riportato all’allegato B-1 delle specifiche attuative delle regole tecniche pubblicate
sul sito www.fatturapa.gov.it
Pag. 9 di 32
1.4 IL WEB-SERVICE SDIRICEVINOTIFICA
Il web-service SdiRiceviNotifica è esposto dal SdI.
Esso:
- riceve in input la notifica di esito committente per ogni fattura contenuta nei file
inoltrati al destinatario;
- restituisce in output l’eventuale scarto esito committente.
Descrizione dell’interfaccia
L’interfaccia che deve essere implementata per il web-service SdiRiceviNotifica è
descritta nel file SdIRiceviNotifica_v1.0.wsdl.
1.4.1 OPERAZIONE NOTIFICAESITO
Il web-service SdIRiceviNotifica dispone di un’unica operazione, NotificaEsito.
Request
La request SOAP presenta la seguente struttura:
Pag. 10 di 32
I parametri di input sono descritti di seguito:
Parametro Descrizione
IdentificativoSdI Identificativo assegnato al file da SdI
NomeFile Nome file della notifica di esito committente
File Allegato contenente il file messaggi convertito in
base64Binary, conforme allo schema xsd della
“Notifica di esito committente4”
I tipi ai quali si fa riferimento sono definiti nel file RicezioneTypes_v1.0.xsd.
Response
La response SOAP presenta la seguente struttura:
I parametri di output sono descritti di seguito:
Parametro Descrizione
Esito Esito della notifica. Può assumere uno dei seguenti valori:
• ES00 = notifica non accettata
• ES01 = notifica accettata
• ES02 = servizio non disponibile
ScartoEsito È strutturato in due element:
• NomeFile: contiene il nome del file presente
nell’element seguente;
• File: contiene il file messaggi convertito in
base64Binary, conforme allo schema xsd della
“Notifica di Scarto Esito Committente5”. L’allegato è
presente solo se l’Esito assume valore ES00
4 conforme a quanto riportato all’allegato B-1 delle specifiche attuative delle regole tecniche pubblicate
sul sito www.fatturapa.gov.it
5 conforme a quanto riportato all’allegato B-1 delle specifiche attuative delle regole tecniche pubblicate
sul sito www.fatturapa.gov.it
Pag. 11 di 32
I tipi ai quali si fa riferimento sono definiti nel file RicezioneTypes_v1.0.xsd.
2. COMUNICAZIONI DATI LIQUIDAZIONI IVA
2.1 GLOSSARIO
Si definisce:
- file: documento xml conforme alle specifiche del formato file pubblicate sul sito
www.agenziaentrate.gov.it ;
- file messaggi: file conforme a quanto riportato alle specifiche del formato file
pubblicate sul sito www.agenziaentrate.gov.it ;
- file archivio : file compresso contenente uno più file;
- interfaccia: ciò che il web-service espone per interagire con un altro sistema;
- notifica di esito (scarto/accettazione): comunicazione che deve essere
recuperata dal trasmittente richiamando il servizio che attesta il
superamento/mancato superamento dei controlli previsti sul file trasmesso;
- SdI: Sistema di Interscambio, struttura istituita dal Ministero dell’Economia e delle
Finanze attraverso la quale avviene la trasmissione delle fatture elettroniche verso
la Pubblica Amministrazione (art.1, comma 211, legge 24 dicembre 2007 n. 244).
Ai fini della trasmissione dei file, il Sistema di Interscambio si occupa della gestione
dei canali di trasmissione per conto del Sistema Ricevente;
- Sistema Ricevente: sistema deputato all’accoglienza e all’elaborazione di file;
- Trasmittente file: soggetto, sia esso cedente/prestatore o cessionario/committente
o terzo intermediario, che trasmette al Sistema Ricevente il file ovvero il file archivio.
- Sistema di accreditamento: il sistema che permette agli utenti di effettuare
l’accreditamento al SDI tramite una procedura dedicata.
- Accordo di servizio: il documento, generato sul Sistema di Accreditamento, che
contiene le regole relative al flusso telematico fra il soggetto trasmittente e/o
ricevente ed il SdI.
Pag. 12 di 32
2.2 IL SERVIZIO SDIDATI
Questa sezione contiene le istruzioni necessarie per interagire con il Sistema
Ricevente attraverso il Servizio SDIDati nel ruolo di Trasmittente File.
Tale Servizio realizzato tramite il web service SdITrasmissioneFile consente al
trasmittente, tramite un canale di cooperazione applicativa, di:
- inviare al Sistema Ricevente un file o un file archivio;
- recuperare dal Sistema Ricevente i messaggi relativi ai file trasmessi.
Nella figura che segue, viene descritto il web-services con le operazioni disponibili.
Pag. 13 di 32
Di seguito, per il web-service, sono descritte le Request SOAP relative ad ogni
operazione, con il dettaglio della struttura dei singoli messaggi.
Legenda dei simboli usati in seguito
Web-service
Operazione
Input
Output
Nome tag
Nome element
Tipo element
Versione
Nota bene
I file wsdl ed i file xsd ai quali si farà riferimento in seguito sono reperibili, sul sito
www.fatturapa.gov.it → Norme e regole → Documentazione Sistema di Interscambio.
La presa visione dell’Accordo di servizio sul Sistema di Accreditamento implica la
completa accettazione delle regole tecniche qui descritte.
Pag. 14 di 32
2.3 IL WEB-SERVICE SDITRASMISSIONEFILE
Il web-service SdITrasmissioneFile è esposto dal Sistema Ricevente.
Esso:
- riceve in input un file ovvero un file archivio;
- restituisce in output un identificativo del file trasmesso e la data/ora di ricezione
ovvero un codice di errore.
Descrizione dell’interfaccia
L’interfaccia che deve essere implementata per il web-service SdITrasmissione è
descritta nel file SdITrasmissioneFile_v2.0.wsdl.
Il web-service SdITrasmissioneFile prevede sia l’operazione Trasmetti che
l’operazione Esito.
2.3.1 OPERAZIONE TRASMETTI
Il web-service SdITrasmissioneFile prevede la ricezione di file dal trasmittente.
Request
La request SOAP presenta la seguente struttura:
Pag. 15 di 32
I parametri di input sono descritti di seguito:
Parametro Descrizione
NomeFile Nome del file da trasmettere
Tipo File Tipo file da Trasmettere i cui valori possibili sono definiti al
paragrafo 2.3.3
File
Allegato contenente il file, convertito in base64Binary conforme
allo schema xsd del “File6”.
I tipi ai quali si fa riferimento sono definiti nel file TrasmissioneFileTypes_v2.0.xsd.
Response
La response SOAP presenta la seguente struttura:
8 conforme a quanto riportato nelle specifiche attuative del formato File pubblicate sul sito
www.agenziaentrate.gov.it.
Pag. 16 di 32
I parametri di output sono descritti di seguito:
Parametro Descrizione
IDFile Identificativo assegnato dal Sistema Ricevente al file
trasmesso
DataOraRicezione Data e Ora della ricezione da parte del Sistema
Ricevente
Errore Eventuale errore di trasmissione riscontrato. Può
assumere uno dei seguenti valori:
EI01 = file allegato vuoto
EI02 = servizio momentaneamente non disponibile
EI03 = utente non abilitato
EI04 = tipo file non corretto
I tipi ai quali si fa riferimento sono definiti nel file TrasmissioneFileTypes_v2.0.xsd.
Pag. 17 di 32
2.3.2 OPERAZIONE ESITO
Il web-service SdITrasmissioneFile prevede di recuperare dell’esito dei file inviati dal
trasmittente.
Request
La request SOAP presenta la seguente struttura:
I parametri di output sono descritti di seguito:
Parametro Descrizione
IDFile Identificativo assegnato dal Sistema Ricevente al file trasmesso
Response
La response SOAP presenta la seguente struttura:
Pag. 18 di 32
I parametri di output sono descritti di seguito:
Parametro Descrizione
Esito Stato File. Può assumere uno dei seguenti valori:
SF01 = In elaborazione
SF02 = Elaborato
SF03 = Errore
Notifica Notifica per file: Allegato contenente il file messaggi convertito in
base64Binary, conforme allo schema
TrasmissioneFileTypes_v2.0.xsd
DettaglioArchivio
Nome del file e Identificativo assegnato dal Sistema Ricevente
al file trasmesso
Errore Eventuale errore di trasmissione riscontrato. Può assumere uno
dei seguenti valori:
EE01 = Servizio non disponibile
EE02 = utente non abilitato
2.3.3 TIPO FILE
Di seguito l’elenco dei Tipi file ammissibili per la trasmissione:
Valore Descrizione
LI File o archivio di tipo Liquidazioni Iva
FL Archivio contenente Liquidazioni Iva
Pag. 19 di 32
3. SERVIZI MASSIVI DI QUADRATURA E REINOLTRO
Questa sezione contiene le istruzioni necessarie per consentire agli utenti già
accreditati al servizio SDICoop-Ricezione di inviare al Sistema di interscambio:
- una richiesta di quadratura del flusso in uscita dal SdI verso il proprio servizio;
- una richiesta di reinoltro delle fatture e/o delle notifiche afferenti al proprio flusso.
Questi servizi sono realizzati tramite due web-service esposti dal SdI:
- quadratura-flusso-ricezione: al quale un provider può inoltrare una richiesta di
report di quadratura dei file fattura e/o file notifica a lui indirizzati da parte del SdI;
- reinoltro-flusso-ricezione: al quale un provider può inoltrare una lista di identificativi
SdI dei file fattura e/o file notifica che intende far ritrasmettere verso il proprio
servizio esposto; tali identificativi sono accessibili all’utente nel report di quadratura
rilasciato dal ws quadratura-flusso-ricezione.
Nei paragrafi che seguono sono descritti i due web-services con le operazioni rese
disponibili in ciascuna interfaccia.
3.1 IL WEB-SERVICE QUADRATURA-FLUSSO-RICEZIONE
Il web-service quadratura-flusso-ricezione prevede tre operazioni. La prima permette di
richiedere l’elaborazione di un report di quadratura del flusso B2G (BusinessTo
Government) in uscita dal SdI verso il proprio servizio. Tale flusso include sia i file fattura
di formato FPA12 che le notifiche di decorrenza termini inviate al soggetto richiedente.
Con la seconda, l’utente può richiedere un report di sintesi relativo al proprio flusso B2B
(BusinessTo Business) e B2C (BusinessTo Consumer) trasmesso dal SdI. Questo
flusso è costituito da tutti i file fattura di formato FPR12 e FSM10 inoltrati al soggetto
richiedente. Tramite la terza ed ultima operazione, l’utente può effettuare lo scarico del
report richiesto in precedenza.
3.1.1 DESCRIZIONE DELL’INTERFACCIA
L’interfaccia da implementare per il web-service quadratura-flusso-ricezione è descritta
nel file SdIQuadraturaWSFlussoRicezioneReport_v1.0.wsdl.
Pag. 20 di 32
I tipi ai quali fa riferimento sono definiti nel file QuadraturaWSTypes_v1.0.xsd.
3.1.1.1 Operazione RichiestaReportQuadraturaFlussoRicezioneB2G
L’operazione permette di richiedere la quadratura del proprio flusso B2G nell’intervallo
temporale indicando la data minima e massima. Queste date, che fanno riferimento alla
data di ricezione del file fattura presso SdI:
- non potranno ricomprendere i 15 giorni antecedenti la data in cui si effettua la
richiesta;
- potranno abbracciare un intervallo massimo di 15 giorni.
Pertanto per una richiesta effettuata, ad esempio, il giorno 31/03, le date da indicare
potranno fare riferimento ad un intervallo temporale che va, al più, dal giorno 01/03 al
giorno 15/03 oppure ad un intervallo più breve ma sempre ricadente tra queste due
date.
Nel caso in cui la richiesta venga accolta, all’utente viene rilasciato un identificativo con
cui in seguito potrà richiedere lo scarico del report di quadratura. Se invece viene
scartata verrà indicato il motivo dello scarto.
Request
La request SOAP RichiestaReportQuadraturaFlussoRicezioneB2GRequest
presenta la seguente struttura:
Pag. 21 di 32
I parametri di input sono descritti di seguito:
Parametro Descrizione
DataDa Limite inferiore dell’intervallo di richiesta quadratura
nel formato AAAA-MM-DD
DataA Limite superiore dell’intervallo di richiesta quadratura
nel formato AAAA-MM-DD
Response
La response SOAP RichiestaReportQuadraturaFlussoRicezioneB2GResponse
presenta la seguente struttura:
Pag. 22 di 32
I parametri di output sono descritti di seguito:
Parametro Descrizione
IdQuadratura Identificativo della richiesta di quadratura assegnato dal
sistema
DataOraRicezione Data e ora della ricezione della richiesta
Errore Eventuale dettaglio degli errori riscontrati nell’accoglienza
della richiesta. È strutturato in 3 elementi:
• Codice: codice di errore generico.
Può assumere i valori:
- ER01 = SERVIZIO NON DISPONIBILE
- ER02 = UTENTE NON ABILITATO
- ER03 = RICHIESTA TROPPO FREQUENTE
- ER04 = PARAMETRI DI INPUT NON VALIDI
- ER05 = RICHIESTA NON VALIDA
- ER06 = DATO NON TROVATO
• Descrizione: descrizione generica dell’errore
• ListaErroriDettaglio: eventuale lista in cui
vengono elencati i motivi specifici per cui è stato
riscontrato l’errore. Ciascun elemento è costituito
da un ErroreDettaglio composto da un Codice e
una Descrizione.
3.1.1.2 Operazione RichiestaReportQuadraturaFlussoRicezioneB2B
L’operazione permette di richiedere la quadratura del proprio flusso B2B e B2C
nell’intervallo temporale indicando la data minima e massima. Queste date, che
fanno riferimento alla data di ricezione del file fattura presso SdI:
- non potranno ricomprendere i 7 giorni antecedenti la data in cui si effettua
la richiesta;
- potranno abbracciare un intervallo massimo di 15 giorni.
Pertanto per una richiesta effettuata, ad esempio, il giorno 31/03, le date da
indicare potranno fare riferimento ad un intervallo temporale che va, al più, dal
Pag. 23 di 32
giorno 09/03 al giorno 23/03 oppure ad un intervallo più breve ma sempre
ricadente tra queste due date.
Nel caso in cui la richiesta venga accolta, all’utente viene rilasciato un
identificativo con cui in seguito potrà richiedere lo scarico del report di
quadratura. Se invece viene scartata verrà indicato il motivo dello scarto.
Request
La request SOAP RichiestaReportQuadraturaFlussoRicezioneB2BRequest
presenta la struttura già descritta per la request precedente.
Response
La response SOAP RichiestaReportQuadraturaFlussoRicezioneB2BResponse
presenta la struttura già descritta per la response precedente.
3.1.1.3 Operazione ScaricoReportQuadraturaFlussoRicezione
L’operazione permette di scaricare il report di quadratura indicando
l’identificativo ottenuto con una delle operazioni precedenti. Se il report si
riferisce ad un flusso B2G, sarà costituito da al più due file csv, uno per i file
notifica e uno per i file fattura, posti in un unico archivio compresso in formato
zip trasmesso in allegato alla response. Se si riferisce invece ai flussi B2B e B2C
sarà costituito da un unico file csv, anch’esso inserito in un archivio compresso
in formato zip allegato alla response.
Request
La request SOAP ScaricoReportQuadraturaFlussoRicezioneRequest presenta
la seguente struttura:
I parametri di input sono descritti di seguito:
Parametro Descrizione
IdQuadratura Identificativo della richiesta di quadratura associato al
report da scaricare
Response
La response SOAP ScaricoReportQuadraturaFlussoRicezioneResponse
presenta la seguente struttura:
Pag. 24 di 32
I parametri di output sono riportati di seguito:
Parametro Descrizione
Stato Stato di elaborazione della richiesta di quadratura. Può
assumere i valori:
- SR01= IN ELABORAZIONE
- SR02 = SCARTATA
- SR03 = ELABORATA
File Eventuale file di report. L’ elemento è composto da:
• NomeFile: nome del file allegato
• File: Allegato contenente il file convertito in
base64Binary
DataOraProduzione Indica la data e l’ora di produzione del report.
Errore Eventuale indicazione dell’errore secondo il tipo
RichiestaErroreType.
Pag. 25 di 32
3.2 IL WEB-SERVICE REINOLTRO-FLUSSO-RICEZIONE
Il web-service reinoltro-flusso-ricezione prevede tre operazioni. La prima
permette di richiedere il reinvio dei file fattura trasmessi dal SdI verso il proprio
servizio. Con la seconda si può innescare la ritrasmissione dei file notifica di
decorrenza termini indirizzati al soggetto richiedente. La terza ed ultima, invece,
permette all’utente di effettuare lo scarico del report contenente le informazioni
di reinoltro relative alle operazioni precedenti.
L’utente:
- non può inoltrare complessivamente più di 10 richieste giornaliere di reinvio
di file fattura e/o file notifica;
- non può richiedere in un mese, attraverso le suddette richieste, la
ritrasmissione complessiva di più di 100.000 file, siano essi file fattura o file
notifica.
3.2.1 DESCRIZIONE DELL’INTERFACCIA
L’interfaccia da implementare per il web-service reinoltro-flusso-ricezione è
descritta nel file
SdIQuadraturaWSFlussoTrasmissioneReinoltro_v1.0.wsdl.
I tipi ai quali fa riferimento sono definiti nel file
QuadraturaWSTypes_v1.0.xsd.
3.2.1.1 Operazione RichiestaReinoltroFlussoRicezioneFileFattura
L’operazione permette di richiedere il reinoltro dei file fattura attraverso un csv
contenente gli identificativi degli stessi. Il file di richiesta non può eccedere la
Pag. 26 di 32
dimensione massima di 5 MB e non può contenere più di 10.000 identificativi
file. Inoltre gli identificativi contenuti nel csv devono essere di file fattura ricevuti
dal SdI entro i 30 giorni antecedenti la data della richiesta, con esclusione dei 7
giorni immediatamente precedenti.
Pertanto una richiesta effettuata, ad esempio, il giorno 31/03, potrà contenere
identificativi di file fattura ricevuti dal SdI dal giorno 01/03 al giorno 23/03.
Nel caso in cui la richiesta venga accolta, all’utente viene rilasciato un
identificativo con cui in seguito potrà richiedere lo scarico del report
dell’operazione di reinoltro. Se invece viene scartata verrà indicato il motivo dello
scarto.
Request
La request SOAP RichiestaReinoltroFlussoRicezioneFileFatturaRequest
presenta la seguente struttura:
I parametri di input sono descritti di seguito:
Parametro Descrizione
Nome File Nome del file allegato che deve avere estensione .csv.
Non sono permessi né spazi né caratteri speciali oltre
a ‘_’ (underscore) e deve avere una lunghezza
complessiva che varia fra 9 e 50 caratteri.
File File Allegato tipo csv contenente il file convertito in
base64Binary
Pag. 27 di 32
Di seguito, un esempio di csv corretto:
Response
La response SOAP RichiestaReinoltroFlussoRicezioneFileFatturaResponse
presenta la seguente struttura:
Pag. 28 di 32
I parametri di output sono descritti di seguito:
Parametro Descrizione
IdReinoltro Identificativo della richiesta di reinoltro assegnato dal
sistema
DataOraRicezione Data e ora della ricezione della richiesta
Errore Eventuale errore riscontrato nell’accoglienza della
richiesta. È strutturato in 3 sotto-elementi:
• Codice: codice unico di errore generico.
Può assumere i valori:
- ER01 = SERVIZIO NON DISPONIBILE
- ER02 = UTENTE NON ABILITATO
- ER03 = RICHIESTA TROPPO FREQUENTE
- ER04 = PARAMETRI DI INPUT NON VALIDI
- ER05 = RICHIESTA NON VALIDA
- ER06 = DATO NON TROVATO
• Descrizione: descrizione del codice di errore.
• ListaErroriDettaglio: eventuale lista in cui
vengono elencati i motivi specifici per cui è stato
riscontrato l’errore. Ciascun elemento è
costituito da un ErroreDettaglio composto da un
Codice e una Descrizione.
Pag. 29 di 32
3.2.1.2 Operazione RichiestaReinoltroFlussoRicezioneNotifica
L’operazione permette di richiedere il reinoltro delle notifiche di decorrenza
termini attraverso un csv contenente gli identificativi delle stesse. Il file di
richiesta non può eccedere la dimensione massima di 5 MB e non può contenere
più di 10.000 identificativi file. Inoltre gli identificativi contenuti nel csv devono
essere di notifiche che si riferiscono a file fattura ricevuti dal SdI entro i 30 giorni
antecedenti la data della richiesta, con esclusione dei 7 giorni immediatamente
precedenti.
Pertanto una richiesta effettuata, ad esempio, il giorno 31/03, potrà contenere
identificativi di notifiche riferite a file fattura ricevuti dal SdI dal giorno 01/03 al
giorno 23/03.
Nel caso in cui la richiesta venga accolta, all’utente viene rilasciato un
identificativo con cui in seguito potrà richiedere lo scarico del report
dell’operazione di reinoltro. Se invece viene scartata verrà indicato il motivo dello
scarto. Gli identificativi individuano univocamente le singole notifiche e possono
essere recuperati precedentemente richiamando il servizio di quadratura.
Request
La request SOAP RichiestaReinoltroFlussoRicezioneNotificaRequest presenta
la stessa struttura descritta sopra per la request dell’operazione precedente.
Response
La response SOAP RichiestaReinoltroFlussoRicezioneNotificaResponse
presenta la stessa struttura descritta sopra per la response dell’operazione
precedente.
3.2.1.3 Operazione ScaricoReportReinoltroFlussoRicezione
L’operazione permette all’utente di scaricare il report dell’operazione di
reinoltro indicando l’identificativo ottenuto con la prima operazione.
Pag. 30 di 32
Request
La request SOAP ScaricoReportReinoltroFlussoRicezioneRequest presenta la
seguente struttura:
I parametri di input sono descritti di seguito:
Parametro Descrizione
IdReinoltro Identificativo della richiesta di reinoltro associato al
report da scaricare
Response
La response SOAP
ScaricoReportReinoltroFlussoRicezioneResponse
presenta la seguente struttura:
Pag. 31 di 32
I parametri di output sono descritti di seguito:
Parametro Descrizione
Stato Stato di elaborazione della richiesta di quadratura. Può
assumere i valori:
- SR01= IN ELABORAZIONE
- SR02 = SCARTATA
- SR03 = ELABORATA
File Eventuale file di report. L’ elemento è composto da:
• NomeFile: nome del file allegato
• File: Allegato contenente il file convertito in
base64Binary
DataOraProduzione Indica la data e l’ora di produzione del report.
Errore Eventuale indicazione dell’errore secondo il tipo
RichiestaErroreType.
Pag. 32 di 32