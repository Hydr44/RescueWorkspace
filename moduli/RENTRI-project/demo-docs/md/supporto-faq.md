## Domande frequenti

Di seguito sono elencate alcune delle domande più frequenti (FAQ) relative all'utilizzo delle **API RENTRI**.

### Generali

Domande e risposte di carattere generale.

#### Qual è la procedura di accreditamento per l'ambiente DEMO?

Per la fase di accreditamento e la successiva iscrizione al RENTRI nell'ambiente DEMO è possibile consultare il manuale disponibile nell'area di supporto del RENTRI seguendo questo <a href="https://supporto.rentri.gov.it/aswsWeb/selectLanding?localizing=YXJ0aWNsZSxOMzc3MzksLA==&idProduct=RENTRI&userRole=rentriud" target="_blank">link</a> per gli operatori e questo <a href="https://supporto.rentri.gov.it/aswsWeb/selectLanding?localizing=YXJ0aWNsZSxOMzc3NDAsLA==&idProduct=RENTRI&userRole=rentriud" target="_blank">link</a> per i soggetti delegati. Le procedure per l'ambiente di produzione finale saranno del tutto analoghe.

#### Il pattern AgID NONBLOCK_PUSH_REST è disponibile?

In riferimento alle API asincrone, l'esito dell'elaborazione della richiesta non è immediatamente disponibile in risposta alla chiamata verso l'endpoint.
A partire dalla fine del mese di **luglio 2024**, è possibile utilizzare due modalità per il recupero dell'esito dell'elaborazione, secondo quanto previsto dai pattern AgID **NONBLOCK_PULL_REST** e **NONBLOCK_PUSH_REST**.
Per maggiori dettagli sull'utilizzo dei due pattern, consultare la sezione [Recupero dell'esito di una transazione asincrona](/docs?page=api-flussi-operativi-introduzione#recupero-dell-esito-di-una-transazione-asincrona).

#### E' possibile richiedere che la callback relativa alla modalità PUSH (NONBLOCK_PUSH_REST) venga inviata su una porta diversa dalla 443?

No, la callback relativa alla modalità PUSH (**NONBLOCK_PUSH_REST**) viene inviata esclusivamente sulla porta 443 per ragioni di sicurezza. E' anche abilitata la "ssl certificate validation" per cui è necessario che il certificato SSL del server di callback sia valido e riconosciuto da una CA.

#### Esistono librerie C# con classi definite sugli oggetti usati dalle API?

No, non sono rese disponibili librerie di questo tipo. È possibile tuttavia generare in maniera automatica delle classi proxy tramite l'utilizzo dei file di definizione delle API in formato OpenAPI. Sono disponibili diversi tool online o integrati negli ambienti di sviluppo in grado di fare questa operazione. Questa possibilità esiste non solo per C#, ma anche per altri linguaggi di programmazione.

#### C'è un esempio di codice relativo al pattern INTEGRITY_REST_01?

Sì, gli esempi sono disponibili nella sezione [Esempi](/docs?page=esempi). Il codice proposto è scritto in linguaggio *Microsoft C#* e fa riferimento al framework *Microsoft .NET Core*. Sono presenti dei commenti relativamente all'applicazione del pattern **INTEGRITY_REST_01**. Ulteriori informazioni relative all'applicazione dei pattern AgID relativi all'autenticazione e all'integrità sono disponibili nella sezione [Autenticazione e integrità](/docs?page=accesso-auth).

#### E' possibile utilizzare il file P12 fornito dalla CA di dominio RENTRI per le firme da apporre sui FIR digitali?

No, la coppia "certificato/chiave privata" fornita attraverso il file P12 nella sezione *Emissione certificati digitali RENTRI* del portale web RENTRI Operatori, è il certificato denominato "Certificato interoperabilità".
La validità delle firme apposte con questo tipo di certificato è limitata ai token di autenticazione ed integrità previsti dalle linee guida AgID.

Per quanto riguarda la firma dei FIR digitali, in concomitanza al rilascio delle funzionalità relative, è stato attivato un servizio di firma remota con un altro certificato di dominio CA RENTRI, denominato "Certificato di firma remota".

#### La firma remota con il certificato di dominio emessa dalla CA RENTRI sarà disponibile anche nell'ambiente di produzione?

La firma tramite certificato di dominio RENTRI sarà disponibile per entrambi gli ambienti DEMO e PRODUZIONE, ma saranno utilizzati certificati diversi. Si fa notare inoltre che RENTRI gestisce due tipologie di certificati per ogni ambiente:
- Certificato di dominio per l'interoperabilità (o certificato interoperabilità CA RENTRI): emesso per firmare i JWT da utilizzare durante le chiamate ai servizi di interoperabilità secondo le linee guida AgID. In questo caso non è previsto un servizio di firma remota, ma viene rilasciato al fruitore il certificato con la sua chiave privata il quale avrà l'onere di custodirlo in modo appropriato.
- Certificato di dominio per la firma remota (o certificato di firma remota CA RENTRI): emesso per firmare i FIR digitali e utilizzabile unicamente tramite i servizi di firma remota RENTRI secondo le specifiche del CSC (Cloud Signature Consortium), in cui, per apporre la firma, è prevista anche l'immissione da parte dell'utente firmatario, di un PIN di tipo dispositivo.

#### È necessario impostare un tempo di attesa tra una chiamata e l'altra di un endpoint?

Sì, ogni endpoint prevede un "rate limit" superato il quale sarà ritornata una response con **`429 Too Many Requests`**. Per l'ambiente DEMO, questa viene restituita quando vengono rilevate **più di 100 richieste in 5s**. In caso occorre attendere 10s per effettuare una nuova richiesta.

#### È possibile avere esempi di codice in altri linguaggi, come è stato fatto per PHP?

L'esempio in PHP, pubblicato nella sezione [Esempi](/docs?page=esempi#certificato-di-dominio), essendo a basso livello ed utilizzando librerie standard come `openssl` e `curl`, può essere facilmente riscritto con altri linguaggi.

#### RENTRI funge anche da sistema di conservazione?

No, RENTRI non funge da sistema di conservazione. Si rimanda a quanto riportato nella scheda "Conservazione dei registri cronologici di carico e scarico tenuti in modalità digitale" disponibile nell'<a href="https://supporto.rentri.gov.it/" target="_blank">Area di supporto del RENTRI</a>.

#### Il "certificato di firma remota" CA RENTRI può essere utilizzato per firmare i registri cronologici?

Si rimanda a quanto riportato nella [Guida tecnica alla struttura del Registro cronologico di carico e scarico dei rifiuti in formato digitale](/docs?page=registro-digitale) e nella scheda "Immodificabilità del registro cronologico di carico e scarico digitale" disponibile nell'<a href="https://supporto.rentri.gov.it/" target="_blank">Area di supporto del RENTRI</a>.

#### È possibile ottenere il file YAML della specifica OpenAPI 3 relativa a una API?

Sì, i file YAML OpenAPI 3 di ogni API si possono recuperare dalla pagina della documentazione delle API, attraverso la funzione export con la visualizzazione Stoplight, oppure tramite l'apposito link sotto il nome dell'API con la visualizzazione Swagger.


### Registri e registrazioni (o movimenti)

Domande e risposte relative alla gestione dei registri e dei movimenti.

#### I registri si possono creare solo tramite API?

No, i registri si possono creare anche tramite il portale web RENTRI, area Operatori, nella sezione *Dati trasmessi al RENTRI - Gestione registri del RENTRI*. Lasciando disattivato il flag "Il registro di carico scarico è gestito con i strumenti di supporto RENTRI", il registro creato può essere utilizzato tramite le API di interoperabilità.

#### È possibile attribuire più registri ad una unità locale?

Sì, è possibile creare più registri per ogni unità locale.

#### Ogni quanto tempo devono essere inviati i movimenti di registro al RENTRI?

Si rimanda a quanto riportato nella scheda "Periodicità di trasmissione dei dati dei registri" disponibile nell'<a href="https://supporto.rentri.gov.it/" target="_blank">Area di supporto del RENTRI</a>.

#### Perché l'orario della registrazione di un movimento è presente solamente nei modelli API e non nei modelli cartacei e nel portale web?

La proprietà **`data_ora_registrazione`**, prevede, di fatto, un valore di tipo `DateTime`.
Mentre è obbligatorio indicare un valore per la data, è possibile (ma opzionale) specificare anche un valore per l'ora. Come descritto nella documentazione delle [API dati-registri](/docs?api=dati-registri&v=v1.0#/), il valore va specificato secondo il formato **ISO 8601 UTC**, compresi eventuali millesimi di secondo.
Nel portale web RENTRI si è scelto di visualizzare solamente la data, in quanto è la parte obbligatoria del valore.

#### In una singola trasmissione delle registrazioni (stessa request) è possibile inviare nuovi movimenti e rettifiche o annullamenti di movimenti all'interno dello stesso array?

All'interno dell'array dei modelli movimento dell'endpoint per la trasmissione delle registrazioni, è possibile inserire contemporaneamente modelli relativi a nuovi movimenti, a rettifiche e ad annullamenti.
Rettifiche ed annullamenti possono fare riferimento sia a registrazioni già inviate a RENTRI in precedenza, sia a registrazioni presenti all'interno della stessa request. 
Per le specifiche relative ai diversi modelli, si rimanda alla documentazione dell'[API dati-registri](/docs?api=dati-registri&v=v1.0#/).
Per informazioni relative al contesto di riferimento si rimanda a quanto riportato nella scheda "Trasmissione dei dati del Registro di carico e scarico da parte degli operatori che utilizzano sistemi gestionali" disponibile nell'<a href="https://supporto.rentri.gov.it/" target="_blank">Area di supporto del RENTRI</a>.

#### Quando viene inviato un nuovo movimento, il numero progressivo è un numero provvisorio che viene riassegnato dal portale web?

Il numero progressivo, assieme all'anno, sono i valori che identificano univocamente un movimento all'interno di un registro. 
Pertanto, devono essere comunicati al RENTRI così come sono stati generati all'interno del gestionale in uso dal soggetto. 
Al momento della registrazione, il servizio di elaborazione del RENTRI aggiunge un ulteriore identificativo univoco, che può anch'esso essere utilizzato per identificare il movimento.

#### Il progressivo delle registrazioni deve partire da 1 o può partire da un valore più alto, considerando che l'avvio del servizio è successivo all'inizio dell'anno?

Tramite API è possibile inviare qualsiasi numero progressivo iniziale del registro, non vengono eseguiti controlli da questo punto di vista. Negli strumenti di supporto è possibile configurare, alla creazione del registro, il progressivo iniziale.

#### Il numero progressivo di ogni registrazione (coppia anno/numero) può essere non strettamente consecutivo per ogni registro?

Tramite API non vengono eseguiti controlli sulla sequenzialità dei numeri progressivi delle registrazioni, ma è necessario garantire nella trasmissione al RENTRI che i progressivi siano univoci e non in conflitto con quelli relativi a registrazioni già trasmesse.
Come previsto dall'*art. 4 del D.M. n. 59 del 4 aprile 2023*, la compilazione in modalità digitale è effettuata nel rispetto di una serie di condizioni, tra le quali quella che "i numeri di ciascuna registrazione che compongono il registro sono progressivi".

#### Quando sono applicate le validazioni descritte nella "Guida tecnica alla struttura del Registro cronologico di carico e scarico dei rifiuti in formato digitale"?

Le validazioni sono applicate in fase di trasmissione delle registrazioni al RENTRI e successivamente, in fase di elaborazione dei dati.
Si consulti la [Guida tecnica alla struttura del Registro cronologico di carico e scarico dei rifiuti in formato digitale](/docs?page=registro-digitale) per maggiori informazioni.

#### È possibile verificare se i dati delle registrazioni sono formalmente validi per la trasmissione tramite API?

Questi dati possono essere validati formalmente sia tramite API, sia tramite il portale web, utilizzando la funzionalità di validazione del registro informatico.
Si consulti la [Guida tecnica alla struttura del Registro cronologico di carico e scarico dei rifiuti in formato digitale](/docs?page=registro-digitale) per maggiori informazioni.

#### In caso di anomalie su una registrazione durante la trasmissione al RENTRI, viene abortita tutta la trasmissione o solo quella registrazione?

Viene abortita tutta la trasmissione.
Si consulti la [Guida tecnica alla struttura del Registro cronologico di carico e scarico dei rifiuti in formato digitale](/docs?page=registro-digitale) per maggiori informazioni.

#### A cosa servono i file XSD pubblicati nel portale web?

I file [XSD](/docs?page=schemi-xsd) rappresentano lo schema del registro di carico e scarico in formato digitale con la vidimazione virtuale fornita dal RENTRI, che va tenuto localmente e posto in conservazione e che sostituisce il registro cartaceo vidimato c/o la CCIAA.
Per ulteriori informazioni si consulti la [Guida tecnica alla struttura del Registro cronologico di carico e scarico dei rifiuti in formato digitale](/docs?page=registro-digitale).

#### come va valorizzato l'elemento "Autore" presente nello schema XSD rentri-movimento-1.0.xsd?

Si tratta di un campo di tipo stringa che identifica, anche in forma codificata, l'utente che ha materialmente eseguito la registrazione per conto dell'operatore. Non sono applicati controlli. 
Per ulteriori informazioni si consulti la [Guida tecnica alla struttura del Registro cronologico di carico e scarico dei rifiuti in formato digitale](/docs?page=registro-digitale).

#### La proprietà "IdentificativoRentri", prevista dall'XSD del registro, è opzionale?

Sì, è opzionale. È possibile valorizzarla ad esempio se l'XML del registro viene esportato dopo la trasmissione dei dati al RENTRI e il sistema raccoglie i riferimenti RENTRI relativi alle registrazioni inviate.

#### In riferimento allo schema XSD rentri-registro-1.0.xsd, è possibile avere approfondimenti su come predisporre il nodo "Signature" che chiude l'XML?

Il nodo "Signature" è una firma digitale conforme allo standard XMLDSig di tipo "Enveloped" e quindi si rimanda alla documentazione ufficiale.

#### Il blocco "RiferimentiPrecedenti" nel file XML del registro è incrementale per sempre? O riparte ad inizio anno?

Il blocco RiferimentiPrecedenti è incrementale sempre fino a chiusura del registro, anche al cambio di anno deve essere incrementato aggiungendo il riferimento all'esportazione precedente.

#### Perché il file XML del registro cronologico non può essere ottenuto, via API, dal RENTRI?

Il registro locale e i dati del registro in RENTRI sono due tipologie di entità diverse e possono essere gestite, sempre nei limiti previsti dalla norma, in modo indipendente e in tempi definiti dagli operatori.
Il file XML del registro cronologico rispecchia la situazione del registro memorizzato nel gestionale locale e questo **può/deve essere generato dal gestionale stesso** dopo (o anche prima) l'invio dei dati delle registrazioni al RENTRI.
Si rimanda alla [Guida tecnica alla struttura del Registro cronologico di carico e scarico dei rifiuti in formato digitale](/docs?page=registro-digitale) per ulteriori informazioni.


#### Un file XML del registro cronologico può essere firmato nel formato CAdES?

Nel rispetto degli XSD pubblicati, il formato della firma deve essere una firma XMLDSig di tipo "Enveloped".
Nel nodo "Reference" della firma digitale "Enveloped" riferito alla radice del documento (URI="") è anche contenuto il digest a cui fare rifermento nell'esportazione successiva.
Per ulteriori informazioni si consulti la [Guida tecnica alla struttura del Registro cronologico di carico e scarico dei rifiuti in formato digitale](/docs?page=registro-digitale).

#### Esclusivamente a titolo di esempio, si ipotizza di generare un file XML del registro cronologico ogni mese. Il dodicesimo file contiene i 12 items dei riferimenti precedenti (impronta della vidimazione e le 11 impronte delle generazioni precedenti) e solo le registrazioni del dodicesimo file. È Corretto?

Possono essere intraprese due strade: includere tutte le esportazioni contenenti le registrazioni dei mesi precedenti, oppure solo l'esportazione contenente le ultime registrazioni non ancora esportate.
Pertanto, quanto indicato, rientra nella seconda casistica ed è una soluzione tecnicamente corretta.
Dal punto di vista procedurale si rimanda alla scheda "Immodificabilità del registro cronologico di carico e scarico digitale" disponibile nell'<a href="https://supporto.rentri.gov.it/" target="_blank">Area di supporto del RENTRI</a>.

#### La firma del file XML del registro cronologico può essere fatta usando il "certificato interoperabilità" scaricato da RENTRI e usato per autenticare le richieste alle API?

Si, in subordine rispetto all'utilizzo di un certificato di firma qualificata.
Si rimanda alla scheda "Immodificabilità del registro cronologico di carico e scarico digitale" disponibile nell'<a href="https://supporto.rentri.gov.it/" target="_blank">Area di supporto del RENTRI</a> per maggiori informazioni.

#### Il certificato di firma remota CA RENTRI può essere utilizzato per firmare i registri cronologici?

Si rimanda a quanto riportato nella [Guida tecnica alla struttura del Registro cronologico di carico e scarico dei rifiuti in formato digitale](/docs?page=registro-digitale) e nella scheda "Immodificabilità del registro cronologico di carico e scarico digitale" disponibile nell'<a href="https://supporto.rentri.gov.it/" target="_blank">Area di supporto del RENTRI</a>.

### Formulari

Domande e risposte relative alla gestione dei formulari.

#### Per vidimare N formulari devono essere fatte N chiamate distinte che richiedono poi il polling su altrettante transazioni?

Sì, l'API consente solo la possibilità di vidimare un formulario alla volta, tramite lo specifico endpoint. Da tenere anche in considerazione l'impostazione del "rate limit", riportata nella documentazione.

#### Nel file PDF del formulario sono presenti degli AcroFields compilabili?

No, il file PDF ottenuto con lo specifico endpoint è un modello precompilato con i soli dati di vidimazione.

#### C'è un modo per modificare lo stato di un formulario tra "usato" e "non usato"?

No, è possibile annullare un formulario con l'apposito endpoint [Annulla FIR](/docs?api=vidimazione-formulari&v=v1.0#/paths/codice_blocco---progressivo--annulla/put).

#### È possibile acquisire tutti i dati del formulario tramite API, conoscendo solo il numero FIR?

L'endpoint [Verifica numero FIR](/docs?api=vidimazione-formulari&v=v1.0#/paths/verifica-numero_fir/get) per la verifica di validazione di un numero FIR restituisce solo le informazioni che identificano chi ha emesso il formulario.
Solo utilizzando i formulari digitali, sarà possibile recuperare tutti i dati inseriti nel formulario a condizione che chi esegue l'interrogazione sia referenziato tra i soggetti indicati nel formulario.

#### Come si ricava il testo da inserire nel QR-code nella stampa del FIR?

I bytes da utilizzare per la generazione del QR Code sono ritornati nella proprietà **`qr_code_bytes`** dell'endpoint [Dati di vidimazione FIR](/docs?api=vidimazione-formulari&v=v1.0#/paths/codice_blocco---progressivo/get).

#### Come si può verificare che il QR Code di un formulario generato sia corretto?

I byte del QR Code sono una struttura dati firmata con formato `Cose_Sign1` e nella documentazione c'è il codice che permette di verificare la firma.
Se la firma è corretta i byte vanno codificati in **base45**, da cui ne deriva una stringa con cui creare il QR Code.
Se si vuole verificare che il QR Code sia corretto basta eseguire il procedimento inverso, quindi: leggere la stringa del QR Code, decodificarla da base45 e verificare l'oggetto nel formato `Cose_Sign1` risultante.

#### In merito alla manutenzione fognaria, i formulari da utilizzare saranno quelli in essere o verranno utilizzati i nuovi FIR digitali (xFIR)?

Si rimanda a quanto indicato al punto 2.4 delle "Istruzioni per la compilazione del formulario di identificazione del rifiuto" pubblicate all'indirizzo <a href="https://www.rentri.gov.it/decreti-direttoriali/istruzioni-manuali-e-guide-sintetiche" target="_blank">Istruzioni manuali e guide sintetiche</a>.

#### Nel caso in cui un FIR digitale venga prodotto ed inviato al RENTRI non ancora firmato né da produttore né da trasportatore, gli altri soggetti (intermediario e destinatario) possono recuperarlo?

Sì, i FIR digitali compilati attraverso le API per il supporto alla compilazione digitale sono resi disponibili a tutti i soggetti indicati nel formulario appena vengono creati. Ciascun soggetto può acquisirne la visibilità con l'apposito endpoint POST <ambiente>/formulari/v1.0/{numero_fir}/acquisizione/{num_iscr_sito} nel quale deve essere indicato il numero FIR e l'identificativo dell'unità locale al quale legare il FIR.

#### Con riferimento al modello rappresentato nelle API del FIR digitale, come viene gestito il detentore?

Facendo riferimento al modello utilizzato dall'endpoint [Crea FIR](/docs?api=formulari&v=v1.0#/paths//post), nel caso in cui il produttore sia inteso come detentore è necessario impostare la proprietà "detentore" a true.

#### Se produttore e primo trasportatore coincidono in termini di soggetto giuridico, le firme da apporre nel FIR digitale devono essere due o ne basta una?

È sufficiente una firma. Il sistema identifica la condizione e applica automaticamente la firma ai dati di partenza in qualità di soggetto che è sia produttore che primo trasportatore.

#### Un formulario creato da un gestionale esterno tramite interoperabilità da un produttore può essere poi ripreso dal destinatario tramite il portale web RENTRI?

Sì, attraverso i servizi di supporto messi a disposizione dal RENTRI nell'area riservata Operatori è possibile prendere in carico il FIR digitale creato attraverso le API di supporto alla compilazione del FIR digitale.

#### Come si può conoscere il numero del FIR che deve essere preso in carico da un determinato soggetto? 

La comunicazione del numero FIR tra i soggetti coinvolti dichiarati nel FIR digitale per consentirne l'acquisizione della visibilità, è lasciata in carico ai soggetti stessi.

#### Esiste una ricerca dei FIR che non sono ancora stati presi in carico da un determinato soggetto?

No, non è prevista.

#### Nel caso siano presenti intermediari, altri trasportatori o altri destinatari come è possibile mettere a disposizione il FIR digitale anche agli altri soggetti?

Ogni FIR digitale presente nel contesto delle API di supporto alla compilazione è sempre disponibile ai soggetti il cui codice fiscale compare tra quelli con un ruolo di produttore, trasportatore, destinatario o intermediario nel FIR digitale stesso, nel senso che tutte le operazioni che è possibile invocare attraverso le API su di un FIR (in funzione dello stato in cui si trova) possono essere invocate dal soggetto che è titolato a farlo. 
L'identificazione del ruolo del soggetto che effettua l'operazione è implicita nell'operazione stessa, salvo nel caso di aggiunta di annotazioni o allegati, che richiedono infatti la specifica del soggetto per il quale si effettua l'operazione.
La validazione dei permessi avviene sui dati del certificato presente nel JWT di autenticazione, il cui codice fiscale deve coincidere con quello del soggetto per cui si effettua l'operazione (nel caso di persone giuridiche) oppure deve avere incarichi definiti nel sistema autorizzativo RENTRI per il soggetto stesso (nel caso di persone fisiche). Tutti gli endpoint che implementano le operazioni coinvolte nel ciclo di vita del FIR digitale necessitano del parametro relativo al numero FIR, che deve essere quindi noto agli operatori che intendo invocare operazioni sul FIR stesso.

#### Che significato ha la "restituzione quarta copia" di un FIR digitale se è presente il metodo di "accettazione" che imposta la quantità?

L'endpoint per l'inserimento dei dati di accettazione fa parte delle API per il supporto alla compilazione del FIR digitale.
Queste API hanno come fine quello di permettere la compilazione del FIR digitale rispettando le specifiche che saranno a breve pubblicate e di fornire uno strumento di condivisione dei FIR digitali tra gli operatori che ne fanno uso.
L'insieme dei FIR digitali creati attraverso queste API e noti al sistema in questo contesto non rappresentano una comunicazione ufficiale dei dati di trasporto del rifiuto al RENTRI.
I FIR digitali potranno essere creati e scambiati con sistemi terzi ed essere quindi avulsi al sistema di supporto alla compilazione. La presenza di un FIR digitale nel contesto del sistema di supporto alla compilazione non ha la funzione di assolvere all'obbligo di restituzione della copia da parte del destinatario agli altri operatori della filiera.

#### La "validazione" di un xFIR che significato ha se l'xFIR viene creato dal portale web e scaricato tramite l'endpoint "download XFIR"?

L'endpoint di validazione di un xFIR ha come scopo quello di fornire uno strumento di verifica della conformità alle specifiche dei file xFIR, che, ricordiamo, potranno essere prodotti anche da sistemi terzi, e rappresenta quindi uno strumento utile allo sviluppo di sistemi alternativi per la compilazione degli xFIR.
È evidente che, a meno di bug o problemi inerenti all'implementazione delle API stesse, i FIR digitali compilati unicamente attraverso le API di supporto alla compilazione non dovranno presentare problemi di conformità alle specifiche.

#### In che contesto utilizzare gli endpoint per i dati del FIR digitale (rifiuti pericolosi)?

Le API per la trasmissione dei dati contenuti nei FIR digitali (xFIR) per i rifiuti pericolosi servono ad assolvere all'obbligo normativo previsto dal RENTRI riguardo la comunicazione al RENTRI di questi dati.

#### Come si possono "simulare" i diversi profili che intervengo nel ciclo di filiera di un FIR da parte di una software house?

La procedura di iscrizione dell'ambiente DEMO consente a qualsiasi operatore di iscrivere più unità locali con profili diversi, nel caso di iscrizione di unità locale con profilo destinatario, trasportatore ed intermediario non è richiesto l'inserimento di autorizzazioni valide. In questo modo è possibile iscrivere più unità locali con profili diversi e completare un ciclo di filiera utilizzando un unico codice fiscale.

#### Come fa un soggetto a conoscere il numero di formulario per il quale deve acquisire la visibilità, visto che il numero di FIR è parte del path dell'endpoint?

Le API di supporto alla compilazione del FIR digitale non affrontano questo aspetto: il numero FIR può essere specificato tra i dati di creazione (se si vuole utilizzare un numero FIR precedentemente vidimato) oppure può essere creato in automatico e restituito dalla procedura di creazione del FIR se viene specificato il blocco specifico su cui effettuare la nuova vidimazione.
In entrambi i casi è disponibile all'operatore che crea il FIR e deve essere reso noto agli altri operatori della filiera con un qualsiasi sistema terzo.
Il numero FIR sarà sempre presente tra i dati contenuti nel file del FIR digitale le cui specifiche sono di prossima pubblicazione.
Si ricorda inoltre che l'operazione di acquisizione di visibilità non è una condizione necessaria a consentire all'operatore coinvolto nella movimentazione di operare sul FIR digitale attraverso le API di supporto, ma serve solo a contestualizzare il FIR nell'ambito di una specifica unità locale iscritta.

#### Come funziona, via API, il caso di inserimento di un FIR digitale da parte di un trasportatore che lo emette per conto del produttore, con particolare riferimento all'acquisizione della visibilità ed inserimento delle unità locali corrette?

Il caso della creazione di un FIR digitale da parte di un trasportatore per conto del produttore attraverso le API di supporto alla compilazione è del tutto analogo a quello di creazione da parte del produttore stesso, salvo che il numero FIR verrà recuperato da un blocco virtuale riferito al trasportatore.
Tutti gli endpoint che consentono l'inserimento dei dati iniziali (creazione, modifica, aggiunta del solo dato di quantità o del solo dato di inizio trasporto) possono essere invocati indistintamente da produttore e trasportatore.
Le firme digitali devono essere apposte da entrambi quando i dati di partenza del FIR si presentano in forma completa e le due firme possono essere apposte in ordine arbitrario.
La visibilità del FIR sarà automatica per l'unità locale iscritta che effettua l'operazione di creazione e può essere acquisita dall'altra unità locale iscritta con l'apposito endpoint delle API in modo che sia incluso tra i FIR disponibili per la specifica un'unità locale dall'endpoint che restituisce l'elenco dei FIR disponibili.
L'acquisizione di visibilità da parte del soggetto che non ha creato il FIR (ma che è stato indicato attraverso il codice fiscale come soggetto della filiera) non è condizione necessaria affinché vi possa operare attraverso le API di supporto alla compilazione se ne conosce già il numero FIR, serve unicamente ad attribuire il FIR ad una specifica unità locale tra quelle iscritte dal soggetto.

#### Perché è necessario acquisire esplicitamente la visibilità di un FIR digitale? non sarebbe più logico che il sistema dia visibilità automatica?

Si è scelto di non dare visibilità automatica perché le unità locali iscritte per ciascun operatore, soprattutto per quanto riguarda produttori e destinatari, possono essere molteplici e nei dati del formulario non è obbligatorio indicare i soggetti specificando il numero di iscrizione dell'unità locale, ma è anche possibile farlo specificando il dato anagrafico fornito per esteso.
In questo secondo caso l'individuazione dell'unità locale RENTRI a cui attribuire la visibilità non è sempre automatizzabile.
Viceversa, l'attribuzione di visibilità del FIR in modo predefinito a tutte le unità locali del soggetto non rappresenta una scelta conforme alle esigenze di molti operatori.
Si ricorda inoltre che il concetto di "visibilità" è inteso come attribuzione del FIR al contesto di operatività di una unità locale, affinché sia presente nell'elenco dei FIR restituiti dall'endpoint per il recupero dei FIR ad essa associati, e non è condizione necessaria affinché un operatore possa invocare gli endpoint delle API per l'aggiunta delle informazioni previste e la relativa firma, purché l'operatore sia stato indicato attraverso il suo codice fiscale in qualità di soggetto della filiera (produttore, trasportatore o destinatario) nel FIR.

### App mobile

#### Se si intende sviluppare un applicativo desktop (Windows o altro sistema) è possibile utilizzare la firma remota CA RENTRI?

Le API messe a disposizione da RENTRI per l'interfacciamento di un'app mobile sono servizi aggiuntivi e non sono vincolanti per implementazione di soluzioni di terze parti.
I servizi di firma remota con certificato di dominio CA RENTRI, prevedono, come requisito minimo per il loro utilizzo, la disponibilità di un'app Android/IOS che implementa la 2FA e che deve essere installata su un dispositivo abbinato (boarding), come descritto in [Interfacciamento App mobile](/docs?page=api-flussi-operativi-mobile).
Tale app può essere realizzata seguendo le indicazioni della documentazione. Un'applicazione desktop potrebbe implementare la firma remota delegando al dispositivo con l'app installata e opportunamente abbinata, la funzionalità di immissione del PIN prevista dalla 2FA.
*In qualunque caso, qualsiasi soluzione di terze parti deve ovviamente tenere conto della normativa vigente.*

#### È possibile implementare un gestionale con tecnologie web per esporre le funzionalità esposte dalle API pubbliche del RENTRI relative ai formulari?

Sì, le API pubbliche esposte in generale sono agnostiche rispetto all'implementazione client che un produttore di terze parti intende realizzare.
Se si prevede l'utilizzo tramite dispositivi mobile, sarà necessario seguire le note best practices per la realizzazione di applicazioni di questo tipo.
Nello scenario in cui non c'è una vera e propria app installata non sarà possibile censire il dispositivo e quindi la fruizione dei servizi RENTRI sarà assimilabile a quanto messo a disposizione dei servizi di supporto del portale web RENTRI.
In ogni caso, per l'utilizzo della firma remota con certificato di dominio CA RENTRI, sarà necessario implementare la 2FA con una app Android/iOS rilascibile in un dispositivo che sia abbinabile, per poter essere in grado di ricevere le notifiche (ad esempio per l'immissione del PIN associato alle credenziali).

#### Verranno rilasciati i sorgenti dell'app mobile ufficiale RENTRI?

Sì, è previsto il rilascio del codice sorgente dell'app.
Quando sarà reso disponibile verrà aggiornata anche questa risposta.

---
*Ultimo aggiornamento: 12/12/2024*