ISTRUZIONI PER IL
SERVIZIO “SDICOOP - TRASMISSIONE”
VERSIONE 3.3
Pag. 1 di 34
INDICE
1. FATTURE 3
1.1 GLOSSARIO 3
1.2 IL SERVIZIO SDICOOP - TRASMISSIONE 4
1.3 IL WEB-SERVICE SdIRiceviFile 6
1.3.1 Operazione RiceviFile 7
1.4 IL WEB-SERVICE TrasmissioneFatture 9
1.4.1 Operazione RicevutaConsegna 10
1.4.2 Operazione NotificaMancataConsegna 10
1.4.3 Operazione NotificaScarto 11
1.4.4 Operazione NotificaEsito 12
1.4.5 Operazione NotificaDecorrenzaTermini 13
1.4.6 Operazione AttestazioneTrasmissioneFattura 14
2. DATI FATTURA E COMUNICAZIONI DATI LIQUIDAZIONI IVA 15
2.1 GLOSSARIO 15
2.2 IL SERVIZIO SDIDATI 17
2.3 IL WEB-SERVICE SdITrasmissioneFile 19
2.3.1 Operazione Trasmetti 19
2.3.2 Operazione Esito 22
2.3.3 Tipo file 23
3. SERVIZI MASSIVI DI QUADRATURA E REINOLTRO 24
3.1 IL WEB-SERVICE QUADRATURA-FLUSSO-TRASMISSIONE 24
3.1.1 DESCRIZIONE DELL’INTERFACCIA 25
3.1.1.1 Operazione RichiestaReportQuadraturaFlussoTrasmissioneB2G 25
3.1.1.2 Operazione RichiestaReportQuadraturaFlussoTrasmissioneB2B 27
3.1.1.3 Operazione ScaricoReportQuadraturaFlussoTrasmissione 28
3.2 IL WEB-SERVICE REINOLTRO-FLUSSO-TRASMISSIONE 30
3.2.1 DESCRIZIONE DELL’INTERFACCIA 30
3.2.1.1 Operazione RichiestaReinoltroFlussoTrasmissione 30
3.2.1.2 Operazione ScaricoReportReinoltroFlussoTrasmissione 33
Pag. 2 di 34
1. FATTURE
1.1 GLOSSARIO
Si definisce:
- attestazione di avvenuta trasmissione: valida solo per i file fatturaPA, è la
comunicazione che il SdI invia al trasmittente (dopo 10 giorni dalla notifica di
mancata consegna) per segnalare la definitiva impossibilità di recapitare al
destinatario il file fatturaPA;
- destinatario: soggetto, sia esso cessionario/committente o terzo intermediario, al
quale il SdI deve inviare il file fattura ricevuto dal trasmittente;
- file fatturaPA: file conforme alle specifiche del formato fatturaPA pubblicate sul sito
www.fatturapa.gov.it (formato trasmissione FPA12);
- file messaggi: file conforme a quanto riportato all’allegato B-1 delle specifiche
attuative delle regole tecniche pubblicate sul sito www.fatturapa.gov.it;
- file fatturaB2B: file conforme alle specifiche del formato B2B pubblicate sul sito
dell’Agenzia delle entrate nell’Allegato A al provvedimento del 30 aprile 2018
(formato trasmissione FPR12);
- file fattura semplificata: file conforme alle specifiche del formato B2B pubblicate
sul sito dell’Agenzia delle entrate nell’Allegato A al provvedimento del 30 aprile 2018
(formato trasmissione FSM10);
- file archivio: file compresso contenente uno o più file fattura;
- interfaccia: ciò che il web-service espone per interagire con un altro sistema;
- notifica di decorrenza termini: valida solo per i file fatturaPA, è la comunicazione
che il SdI invia sia al trasmittente che al destinatario trascorsi 15 giorni senza aver
ricevuto notifica di esito committente;
- notifica di esito: valida solo per i file fatturaPA, è la comunicazione, che il SdI inoltra
al trasmittente, contenente l’esito esplicitato dal destinatario nella notifica di esito
committente;
- notifica di file non recapitabile: valida solo per i file fatturaPA, è la comunicazione,
che il SdI inoltra al trasmittente, per segnalare la definitiva impossibilità di recapitare
al destinatario il file fatturaPA;
- notifica di mancata consegna: valida solo per i file fatturaPA, è la comunicazione
che il SdI invia al trasmittente per segnalare la temporanea impossibilità di
recapitare al destinatario il file fatturaPA;
- notifica di scarto: valida solo per i file fatturaPA, è la comunicazione che il SdI invia
al trasmittente nel caso in cui il file trasmesso (file fatturaPA ovvero file archivio) non
abbia superato i controlli previsti;
- ricevuta di consegna: comunicazione che il SdI invia al trasmittente per certificare
l’avvenuta consegna al destinatario del file fattura, sia per il flusso verso
Pag. 3 di 34
1.2 la PA sia per il flusso B2B. E’ importante precisare che i tracciati di tali ricevute sono
differenti fra loro ed hanno un preciso schema da rispettare;
- ricevuta di scarto: valida per i soli file fatturaB2B e file fattura semplificata, è la
comunicazione che il SdI invia al trasmittente nel caso in cui il file trasmesso non
abbia superato i controlli previsti;
- ricevuta impossibilità di recapito: valida per i soli file fatturaB2B e file fattura
semplificata, è la comunicazione che il SdI invia al trasmittente per segnalare il
mancato recapito al destinatario del file fattura e la messa a disposizione nell’area
riservata dello stesso;
- servizio: si intende uno dei canali previsti dal SdI per l’interoperabilità dei sistemi
nella gestione della trasmissione e della ricezione dei file fattura e dei file messaggi;
- SdI: Sistema di Interscambio, struttura istituita dal Ministero dell’Economia e delle
Finanze attraverso la quale avviene la trasmissione delle fatture elettroniche verso
PA e verso privati;
- trasmittente: soggetto, sia esso cedente/prestatore o terzo intermediario, che
trasmette al SdI il file fattura ovvero il file archivio;
- web-service: sistema software in grado di garantire l’interoperabilità tra sistemi che
si trovano sulla stessa rete.
- Sistema di accreditamento: il sistema che permette agli utenti di effettuare
l’accreditamento al SDI tramite una procedura dedicata
- Accordo di servizio: il documento, generato sul Sistema di Accreditamento, che
contiene le regole relative al flusso telematico fra il soggetto trasmittente e/o
ricevente ed il SdI.
IL SERVIZIO SDICOOP - TRASMISSIONE
Il presente documento contiene le istruzioni necessarie per interagire con SdI
attraverso il Servizio SDICoop nel ruolo di trasmittente.
Tale Servizio consente al trasmittente, tramite un canale di cooperazione applicativa,
di:
- inviare al SdI il file fattura, tenendo conto dei diversi formati di trasmissione (FPR12,
FPA12, FSM10);
- ricevere dal SdI i messaggi relativi ai file trasmessi, tenendo conto che il formato di
tali file dipende dalla tipologia di fattura trasmessa (FPR12, FPA12, FSM10)
In particolare, il Servizio SDICoop – Trasmissione è realizzato tramite due web-
services:
- SdIRiceviFile: esposto dal SdI, si occupa della ricezione dei file inviati dal
trasmittente;
- TrasmissioneFatture: esposto dal trasmittente, si occupa della ricezione dei
messaggi inviati dal SdI. Tale servizio viene esposto sulla base di endpoint che
Pag. 4 di 34
vengono comunicati in fase di accreditamento.
E’ possibile modificare gli endpoint indicati in qualsiasi momento attraverso l’apposita
funzione presente sull’applicazione “Sistema di Accreditamento”.
Pag. 5 di 34
Nella figura che segue, sono descritti i due web-services con le operazioni rese
disponibili in ciascuna interfaccia.
Il Servizio SDICoop - Trasmissione
Pag. 6 di 34
Di seguito, per ciascuno dei due web-service, sono descritte la Request SOAP e la
Response SOAP relative ad ogni operazione, con il dettaglio della struttura dei singoli
messaggi.
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
I file wsdl ed i file xsd ai quali si farà riferimento in seguito sono reperibili, Sul sito
www.fatturapa.gov.it → Norme e regole → Documentazione Sistema di Interscambio.
La presa visione dell’Accordo di Servizio sul sistema di accreditamento implica
la completa accettazione delle regole tecniche qui descritte.
1.3 IL WEB-SERVICE SDIRICEVIFILE
Il web-service SdIRiceviFile è esposto dal Sistema di Interscambio. Esso:
- riceve in input il file fattura ovvero un file archivio;
- restituisce in output un identificativo del file trasmesso e la data/ora di ricezione
ovvero un codice di errore.
Pag. 7 di 34
Descrizione dell’interfaccia
L’interfaccia che deve essere implementata per il web-service SdIRiceviFile è
descritta nel file SdIRiceviFile_v1.0.wsdl.
1.3.1 OPERAZIONE RICEVIFILE
Il web-service SdIRiceviFile prevede un’unica operazione, RiceviFile, per la ricezione
dei file inviati dal trasmittente.
Request
La request SOAP presenta la seguente struttura:
I parametri di input sono descritti di seguito:
Parametro Descrizione
NomeFile Nome file da trasmettere
File Allegato contenente il file fattura, ovvero il file archivio,
convertito in base64Binary conforme allo schema xsd della
“Fattura1”.
I tipi ai quali si fa riferimento sono definiti nel file TrasmissioneTypes_v1.0.xsd.
Response
La response SOAP presenta la seguente struttura:
1 conforme a quanto riportato nelle specifiche tecniche al provvedimento del 30 aprile 2018 sul sito
dell’Agenzia delle entrate.
Pag. 8 di 34
I parametri di output sono descritti di seguito:
Parametro Descrizione
IdentificativoSdI Identificativo assegnato dal SdI al file trasmesso
DataOraRicezione Data e Ora della ricezione da parte del SdI
Errore Eventuale errore di trasmissione riscontrato. Può
assumere uno dei seguenti valori:
EI01 = file allegato vuoto
EI02 = servizio momentaneamente non disponibile
EI03 = utente non abilitato
I tipi ai quali si fa riferimento sono definiti nel file TrasmissioneTypes_v1.0.xsd.
Pag. 9 di 34
1.4 IL WEB-SERVICE TRASMISSIONEFATTURE
Il web-service TrasmissioneFatture deve essere esposto dal trasmittente.
Esso prevede cinque operazioni attraverso le quali consente la ricezione dei seguenti
file messaggi:
- Ricevuta di consegna, con tracciato distinto fra flusso PA e Flusso B2B;
- Notifica di mancata consegna per il flusso PA, che coinciderà con la Ricevuta
impossibilità di recapito per il flusso B2B;
- Notifica di scarto per il flusso PA, che coinciderà con la Ricevuta di scarto per il
flusso B2B;
- Notifica di esito, esclusiva del flusso PA;
- Notifica di decorrenza termini, esclusiva del flusso PA;
- Attestazione di avvenuta trasmissione della fattura con impossibilità di recapito,
esclusiva del flusso PA;
Descrizione dell’interfaccia
L’interfaccia che deve essere implementata per il web-service TrasmissioneFatture è
descritta nel file TrasmissioneFatture_v1.1.wsdl.
Pag. 10 di 34
1.4.1 OPERAZIONE RICEVUTACONSEGNA
L’operazione RicevutaConsegna consente al trasmittente di ricevere un file messaggi
contenente la ricevuta di consegna per ogni file fattura che il SdI ha consegnato al
destinatario. E’ importante precisare che il tracciato della ricevuta è differente se si tratta
di flusso PA piuttosto che flusso B2B ed ha, nei due casi, un preciso schema da
rispettare, pubblicato nell’allegato A delle specifiche tecniche al provvedimento del 30
aprile 2018;
Request
La request SOAP presenta la seguente struttura:
I parametri di input sono descritti di seguito:
Parametro Descrizione
IdentificativoSdI Identificativo assegnato al file da SdI
NomeFile Nome file della ricevuta di consegna
File Allegato contenente il file messaggi convertito in
base64Binary, conforme allo schema xsd della
“Ricevuta di consegna del file al destinatario2”
I tipi ai quali si fa riferimento sono definiti nel file TrasmissioneTypes_v1.1.xsd.
L’operazione RicevutaConsegna non prevede Response SOAP.
1.4.2 OPERAZIONE NOTIFICAMANCATACONSEGNA
L’operazione NotificaMancataConsegna consente al trasmittente di ricevere un file
messaggi contenente una notifica di mancata consegna per ogni file fatturaPA che il
SdI non è riuscito a consegnare al destinatario. Su tale operazione del Web Services
2 conforme a quanto riportato in allegato B-1 delle specifiche attuative delle regole tecniche pubblicate sul
sito www.fatturapa.gov.it (per la fatturaPA) o in allegato A delle specifiche tecniche al provvedimento del
30 aprile 2018 sul sito dell’Agenzia delle entrate (per la fatturaB2B e semplificata)
Pag. 11 di 34
viene restituita anche la ricevuta di impossibilità di recapito, prevista per il flusso B2B,
con apposito tracciato diverso da quello della notifica di mancata consegna.
Request
La request SOAP presenta la seguente struttura:
I parametri di input sono descritti di seguito:
Parametro Descrizione
IdentificativoSdI Identificativo assegnato al file da SdI
NomeFile Nome file della notifica di mancata consegna
File Allegato contenente il file messaggi convertito in
base64Binary, conforme allo schema xsd della
“Notifica di mancata consegna/Ricevuta di
impossibilità di recapito 3”
I tipi ai quali si fa riferimento sono definiti nel file TrasmissioneTypes_v1.1.xsd.
L’operazione NotificaMancataConsegna non prevede Response SOAP.
1.4.3 OPERAZIONE NOTIFICASCARTO
L’operazione NotificaScarto consente al trasmittente di ricevere un file messaggi
contenente una notifica di scarto per ogni file fattura ovvero per ogni file archivio che
non ha superato i controlli del SdI. Su tale operazione del Web Services viene restituita
anche la ricevuta di scarto, prevista per il flusso B2B, con apposito tracciato diverso da
quello della notifica di scarto.
3 conforme a quanto riportato in allegato B-1 delle specifiche attuative delle regole tecniche pubblicate sul
sito www.fatturapa.gov.it (per la fatturaPA) o in allegato A delle specifiche tecniche al provvedimento del
30 aprile 2018 sul sito dell’Agenzia delle entrate (per la fatturaB2B e semplificata)
Pag. 12 di 34
Request
La request SOAP presenta la seguente struttura:
I parametri di input sono descritti di seguito:
Parametro Descrizione
IdentificativoSdI Identificativo assegnato al file da SdI
NomeFile Nome file della notifica di scarto
File Allegato contenente il file messaggi convertito in
base64Binary, conforme allo schema xsd della
“Notifica di scarto/Ricevuta di scarto 4”
I tipi ai quali si fa riferimento sono definiti nel file TrasmissioneTypes_v1.1.xsd.
L’operazione NotificaScarto non prevede Response SOAP.
1.4.4 OPERAZIONE NOTIFICAESITO
L’operazione NotificaEsito consente al trasmittente di ricevere un file messaggi
contenente una notifica di esito per ogni documento fattura, presente nel file fatturaPA,
consegnato al destinatario e del quale il destinatario ha comunicato al SdI un esito.
4 conforme a quanto riportato in allegato B-1 delle specifiche attuative delle regole tecniche pubblicate sul
sito www.fatturapa.gov.it (per la fatturaPA) o in allegato A delle specifiche tecniche al provvedimento del
30 aprile 2018 sul sito dell’Agenzia delle entrate (per la fatturaB2B e semplificata)
Pag. 12 di 34
Request
La request SOAP presenta la seguente struttura:
I parametri di input sono descritti di seguito:
Parametro Descrizione
IdentificativoSdI Identificativo assegnato al file da SdI
NomeFile Nome file della notifica di esito
File Allegato contenente il file messaggi convertito in
base64Binary, conforme allo schema xsd della
“Notifica di esito (Cedente)5”
I tipi ai quali si fa riferimento sono definiti nel file TrasmissioneTypes_v1.1.xsd.
L’operazione NotificaEsito non prevede Response SOAP.
1.4.5 OPERAZIONE NOTIFICADECORRENZATERMINI
L’operazione NotificaDecorrenzaTermini consente al trasmittente di ricevere un file
messaggi contenente una notifica di decorrenza termini per ogni documento fattura,
presente nel file fatturaPA consegnato al destinatario, del quale, trascorsi i termini
temporali, il SdI non ha ricevuto alcun esito dal destinatario.
5 conforme a quanto riportato all’allegato B-1 delle specifiche attuative delle regole tecniche pubblicate
sul sito www.fatturapa.gov.it
Pag. 13 di 34
Request
La request SOAP presenta la seguente struttura:
I parametri di input sono descritti di seguito:
Parametro Descrizione
IdentificativoSdI Identificativo assegnato al file da SdI
NomeFile Nome file della notifica di decorrenza termini
File Allegato contenente il file messaggi convertito in
base64Binary, conforme allo schema xsd della
“Notifica di decorrenza termini6”
I tipi ai quali si fa riferimento sono definiti nel file TrasmissioneTypes_v1.1.xsd.
L’operazione NotificaDecorrenzaTermini non prevede Response SOAP.
1.4.6 OPERAZIONE ATTESTAZIONETRASMISSIONEFATTURA
L’operazione AttestazioneTrasmissioneFattura consente al trasmittente di ricevere un
file messaggi contenente un’ attestazione di avvenuta trasmissione della fattura con
impossibilità di recapito per ogni file fatturaPA che non è stato possibile inoltrare al
destinatario entro il termine massimo previsto.
6 conforme a quanto riportato all’allegato B-1 delle specifiche attuative delle regole tecniche pubblicate
sul sito www.fatturapa.gov.it
Pag. 14 di 34
Request
La request SOAP presenta la seguente struttura:
I parametri di input sono descritti di seguito:
Parametro Descrizione
IdentificativoSdI Identificativo assegnato al file da SdI
NomeFile Nome file della notifica
trasmissione
di Attestazione Avvenuta
File Allegato contenente il file messaggi convertito in
base64Binary, conforme allo schema xsd della
“Notifica di attestazione di avvenuta trasmissione della
fattura con impossibilità di recapito7”
I tipi ai quali si fa riferimento sono definiti nel file TrasmissioneTypes_v1.1.xsd.
L’operazione AttestazioneTrasmissioneFattura non prevede Response SOAP.
2. COMUNICAZIONI DATI LIQUIDAZIONI IVA
2.1 GLOSSARIO
Si definisce:
- file: documento xml conforme alle specifiche del formato file pubblicate sul sito
www.agenziaentrate.gov.it;
- file messaggi: file conforme a quanto riportato alle specifiche del formato file
pubblicate sul sito www.agenziaentrate.gov.it;
7 conforme a quanto riportato all’allegato B-1 delle specifiche attuative delle regole tecniche pubblicate
sul sito www.fatturapa.gov.it
Pag. 15 di 34
- file archivio: file compresso contenente uno o più file;
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
o terzo intermediario, che trasmette al Sistema Ricevent il file ovvero il file archivio.
- Sistema di accreditamento: il sistema che permette agli utenti di effettuare
l’accreditamento al SDI tramite una procedura dedicata
- Accordo di servizio: il documento, generato sul Sistema di Accreditamento, che
contiene le regole relative al flusso telematico fra il soggetto trasmittente e/o
ricevente ed il SdI.
Pag. 16 di 34
2.2 IL SERVIZIO SDIDATI
Questa sezione contiene le istruzioni necessarie per interagire con il Sistema
Ricevente attraverso il Servizio SDIDati nel ruolo di Trasmittente file.
Tale Servizio realizzato tramite il web service SdITrasmissioneFile consente al
trasmittente, tramite un canale di cooperazione applicativa, di:
- inviare al Sistema Ricevente un file o un file archivio;
- recuperare dal Sistema Ricevente i messaggi relativi ai file trasmessi.
Nella figura che segue, viene descritto il web-services con le operazioni disponibili.
Pag. 17 di 34
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
I file wsdl ed i file xsd ai quali si farà riferimento in seguito sono reperibili, insieme ad
una copia di questo documento, sul sito www.fatturapa.gov.it → Norme e regole →
Documentazione Sistema di Interscambio.
La presa visione dell’Accordo di servizio sul Sistema di Accreditamento implica
la completa accettazione delle regole tecniche qui descritte.
Pag. 18 di 34
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
Pag. 19 di 34
Request
La request SOAP presenta la seguente struttura:
I parametri di input sono descritti di seguito:
Parametro Descrizione
NomeFile Nome del file da trasmettere
Tipo File Tipo file da Trasmettere i cui valori possibili sono
definiti al paragrafo 2.3.3
File Allegato contenente il file, convertito in base64Binary
conforme allo schema xsd del “File8”.
I tipi ai quali si fa riferimento sono definiti nel file TrasmissioneFileTypes_v2.0.xsd
Response
La response SOAP presenta la seguente struttura:
8 conforme a quanto riportato nelle specifiche attuative del formato File pubblicate sul sito
www.agenziaentrate.gov.it.
Pag. 20 di 34
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
Pag. 21 di 34
2.3.2 OPERAZIONE ESITO
Il web-service SdITrasmissioneFile prevede di recuperare l’esito dei file inviati dal
trasmittente.
Request
La request SOAP presenta la seguente struttura:
I parametri di output sono descritti di seguito:
Parametro Descrizione
IDFile Identificativo assegnato dal Sistema Ricevente al file
trasmesso
Response
La response SOAP presenta la seguente struttura:
I parametri di output sono descritti di seguito:
Pag. 22 di 34
Parametro Descrizione
Esito Stato File. Può assumere uno dei seguenti valori:
SF01 = In elaborazione
SF02 = Elaborato
SF03 = Errore
Notifica Notifica per file: Allegato contenente il file messaggi
convertito in base64Binary, conforme allo schema
TrasmissioneFileTypes_v2.0.xsd
DettaglioArchivio
Nome del file e Identificativo assegnato dal Sistema
Ricevente al file trasmesso
Errore Eventuale errore di trasmissione riscontrato. Può
assumere uno dei seguenti valori:
EE01 = Servizio non disponibile
EE02 = utente non abilitato
2.3.3 TIPO FILE
Di seguito l’elenco dei Tipi file ammissibili per la trasmissione:
Valore Descrizione
LI File o archivio di tipo Liquidazioni Iva
FL Archivio contenente Liquidazioni Iva
Pag. 23 di 34
3. SERVIZI MASSIVI DI QUADRATURA E REINOLTRO
Questa sezione contiene le istruzioni necessarie per consentire agli utenti già
accreditati al servizio SDICoop-Trasmissione di inviare al Sistema di interscambio:
- una richiesta di quadratura del flusso in uscita dal SdI verso il proprio servizio;
- una richiesta di reinoltro delle ricevute/notifiche afferenti al proprio flusso. Questi
servizi sono realizzati tramite due web-service esposti dal SdI:
- quadratura-flusso-trasmissione: al quale un provider può inoltrare una
richiesta di report di quadratura dei file notifica a lui indirizzati da parte del SdI;
- reinoltro-flusso-trasmissione: al quale un provider può inoltrare una lista di
identificativi delle ricevute/notifiche che intende far ritrasmettere verso il
proprio servizio esposto; tali identificativi sono accessibili all’utente nel report
di quadratura rilasciato dal ws quadratura-flusso-trasmissione.
Nei paragrafi che seguono sono descritti i due web-services con le operazioni rese
disponibili in ciascuna interfaccia.
3.1 IL WEB-SERVICE QUADRATURA-FLUSSO-TRASMISSIONE
Il web-service quadratura-flusso-trasmissione prevede tre operazioni. La prima
permette di richiedere l’elaborazione di un report di quadratura del flusso B2G
(BusinessTo Government) in uscita dal SdI verso il proprio servizio. Tale flusso include
tutte le ricevute/notifiche inviate al soggetto richiedente, afferenti a file fattura di formato
FPA12. Con la seconda, l’utente può richiedere un report di sintesi relativo al proprio
flusso B2B (BusinessTo Business) e B2C (BusinessTo Consumer) trasmesso dal SdI.
Questo flusso è costituito da tutte le ricevute/notifiche inoltrate al soggetto richiedente,
riconducibili a file fattura di formato FPR12 e FSM10. Tramite la terza ed ultima
operazione, l’utente può effettuare lo scarico del report richiesto in precedenza.
Pag. 24 di 34
3.1.1 DESCRIZIONE DELL’INTERFACCIA
L’interfaccia da implementare per il web-service quadratura-flusso-trasmissione è
descritta nel file SdIQuadraturaWSFlussoTrasmissioneReport_v1.0.wsdl.
I tipi ai quali fa riferimento sono definiti nel file QuadraturaWSTypes_v1.0.xsd.
3.1.1.1 Operazione RichiestaReportQuadraturaFlussoTrasmissioneB2G
L’operazione permette di richiedere la quadratura nell’intervallo temporale indicando la
data minima e massima. Queste date, che fanno riferimento alla data di ricezione del
file fattura presso SdI:
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
Pag. 25 di 34
Request
La request SOAP RichiestaReportQuadraturaFlussoTrasmissioneB2GRequest
presenta la seguente struttura:
I parametri di input sono descritti di seguito:
Parametro Descrizione
DataDa Limite inferiore dell’intervallo di richiesta quadratura
nel formato AAAA-MM-DD
DataA Limite superiore dell’intervallo di richiesta quadratura
nel formato AAAA-MM-DD
Response
La response SOAP RichiestaReportQuadraturaFlussoTrasmissioneB2GResponse
presenta la seguente struttura:
Pag. 26 di 34
I parametri di output sono descritti di seguito:
Parametro Descrizione
IdQuadratura Identificativo della richiesta di quadratura assegnato
dal sistema
DataOraRicezione Data e ora della ricezione della richiesta
Errore Eventuale dettaglio degli errori riscontrati
nell’accoglienza della richiesta. È strutturato in 3
elementi:
• Codice: codice di errore
generico. Può assumere i
valori:
- ER01 = SERVIZIO NON DISPONIBILE
- ER02 = UTENTE NON ABILITATO
- ER03 = RICHIESTA TROPPO FREQUENTE
- ER04 = PARAMETRI DI INPUT NON VALIDI
- ER05 = RICHIESTA NON VALIDA
- ER06 = DATO NON TROVATO
• Descrizione: descrizione generica dell’errore
• ListaErroriDettaglio: eventuale lista in cui
vengono elencati i motivi specifici per cui è
stato riscontrato l’errore. Ciascun elemento è
costituito da un ErroreDettaglio composto da
un Codice e una Descrizione.
3.1.1.2 Operazione RichiestaReportQuadraturaFlussoTrasmissioneB2B
L’operazione permette di richiedere la quadratura del proprio flusso B2B e B2C
nell’intervallo temporale indicando la data minima e massima. Queste date, che fanno
riferimento alla data di ricezione del file fattura presso SdI:
- non potranno ricomprendere i 7 giorni antecedenti la data in cui si effettua la
richiesta;
- potranno abbracciare un intervallo massimo di 15 giorni.
Pag. 27 di 34
Pertanto per una richiesta effettuata, ad esempio, il giorno 31/03, le date da indicare
potranno fare riferimento ad un intervallo temporale che va, al più, dal giorno 09/03 al
giorno 23/03 oppure ad un intervallo più breve ma sempre ricadente tra queste due date.
Nel caso in cui la richiesta venga accolta, all’utente viene rilasciato un identificativo con
cui in seguito potrà richiedere lo scarico del report di quadratura. Se invece viene
scartata verrà indicato il motivo dello scarto.
Request
La request SOAP RichiestaReportQuadraturaFlussoTrasmissioneB2BRequest
presenta la struttura già descritta per la request precedente.
Response
La response SOAP RichiestaReportQuadraturaFlussoTrasmissioneB2BResponse
presenta la struttura già descritta per la response precedente.
3.1.1.3 Operazione ScaricoReportQuadraturaFlussoTrasmissione
L’operazione permette di scaricare il report di quadratura indicando l’identificativo
ottenuto con una delle operazioni precedenti. In entrambi i casi il report sarà costituito
da un unico file csv inserito in un archivio compresso in formato zip allegato alla
response.
Request
La request SOAP ScaricoReportQuadraturaFlussoTrasmissioneRequest
presenta la seguente struttura:
I parametri di input sono descritti di seguito:
Parametro Descrizione
IdQuadratura Identificativo della richiesta di quadratura associato al
report da scaricare
Pag. 28 di 34
Response
La response SOAP ScaricoReportQuadraturaFlussoTrasmissioneResponse
presenta la seguente struttura:
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
Pag. 29 di 34
3.2 IL WEB-SERVICE REINOLTRO-FLUSSO-TRASMISSIONE
Il web-service reinoltro-flusso-trasmissione prevede due operazioni. La prima permette
di richiedere il reinvio delle ricevute/notifiche trasmesse dal SdI verso il proprio servizio.
La seconda, invece, permette all’utente di effettuare lo scarico del report contenente le
informazioni di reinoltro relative alla prima operazione.
L’utente:
- non può inoltrare complessivamente più di 10 richieste giornaliere di reinvio di file
notifica;
- non può richiedere in un mese, attraverso le suddette richieste, la ritrasmissione
complessiva di più di 100.000 file notifica
3.2.1 DESCRIZIONE DELL’INTERFACCIA
L’interfaccia da implementare per il web-service reinoltro-flusso-trasmissione è
descritta nel file SdIQuadraturaWSFlussoTrasmissioneReinoltro_v1.0.wsdl.
I tipi ai quali fa riferimento sono definiti nel file QuadraturaWSTypes_v1.0.xsd.
3.2.1.1 Operazione RichiestaReinoltroFlussoTrasmissione
L’operazione permette di richiedere il reinoltro delle ricevute/notifiche attraverso un csv
contenente gli identificativi delle stesse. Il file di richiesta non può eccedere la
dimensione massima di 5 MB e non può contenere più di
10.000 identificativi file notifica che si riferiscono a file fattura ricevuti dal SdI entro i 30
giorni antecedenti la data della richiesta, con esclusione dei 7 giorni immediatamente
precedenti.
Pertanto una richiesta effettuata, ad esempio, il giorno 31/03, potrà contenere
identificativi di notifiche relative a file fattura ricevuti dal SdI dal giorno 01/03 al giorno
23/03.
Pag. 30 di 34
Nel caso in cui la richiesta venga accolta, all’utente viene rilasciato un identificativo con
cui in seguito potrà richiedere lo scarico del report dell’operazione di reinoltro. Se invece
viene scartata verrà indicato il motivo dello scarto.
Request
struttura:
La request SOAP RichiestaReinoltroFlussoTrasmissioneRequest presenta la seguente
I parametri di input sono descritti di seguito:
Parametro Descrizione
Nome File Nome del file allegato che deve avere estensione .csv.
Non sono permessi né spazi né caratteri speciali oltre
a ‘_’ (underscore) e deve avere una lunghezza
complessiva che varia fra 9 e 50 caratteri.
File File Allegato tipo csv contenente il file convertito in
base64Binary
Di seguito, un esempio di csv corretto:
Pag. 31 di 34
Response
La response SOAP RichiestaReinoltroFlussoTrasmissioneResponse presenta la
seguente struttura:
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
Pag. 32 di 34
3.2.1.2 Operazione ScaricoReportReinoltroFlussoTrasmissione
L’operazione permette all’utente di scaricare il report dell’operazione di reinoltro
indicando l’identificativo ottenuto con la prima operazione.
Request
La request SOAP ScaricoReportReinoltroFlussoTrasmissioneRequest presenta la
seguente struttura:
I parametri di input sono descritti di seguito:
Parametro Descrizione
IdReinoltro Identificativo della richiesta di reinoltro associato al
report da scaricare
Response
La response SOAP ScaricoReportReinoltroFlussoTrasmissioneResponse presenta
la seguente struttura:
Pag. 33 di 34
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
Pag. 34 di 34