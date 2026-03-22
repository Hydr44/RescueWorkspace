# Guida tecnica alla struttura del Registro cronologico di carico e scarico dei rifiuti in formato digitale

## 1. Introduzione

Questa guida tecnica si pone l'obiettivo di spiegare la struttura del modello dati previsto nel RENTRI per rappresentare 
in modalità digitale il Registro cronologico dei movimenti di carico e scarico dei rifiuti che deve essere tenuto localmente dai soggetti obbligati.<br/>
Il documento ha lo scopo di favorire la transizione dal precedente regime cartaceo, alle nuove modalità digitali introdotte dal RENTRI.

E' fondamentale tenere in considerazione che il Registro cronologico di carico e scarico, nella formulazione del DM 59/2023, 
è un "*documento informatico*" e come tale, deve formarsi nel rispetto delle linee guida definite da AgID così come esplicitato 
all'art.4 del DM 59/2023 nonché di una serie di riferimenti normativi che disciplinano la tenuta di registri obbligatori con 
strumenti informatici che per comodità sono stati riportati al paragrafo 17.3 (requisiti generali) delle modalità operative. 
Tra questi si deve considerare l'Art. 7, commi 4-ter e 4-quater, del Decreto-Legge 10 giugno 1994 n. 357 per la 
"*tenuta di qualsiasi registro contabile con sistemi meccanografici*".

Passare dai precedenti registri cartacei vidimati prima del loro utilizzo, nei quali l'integrità 
del dato era implicitamente legata alla stampa sul supporto cartaceo vidimato, a dei registri digitali 
gestiti con sistemi informatici propri, richiede l'adozione di soluzioni tecniche che saranno descritte 
nel documento, finalizzate a fornire l'evidenza dell'integrità dell'informazione fin dalla formazione del documento.<br/>
Infine, in termini generali, è necessario comprendere che, tenuta e conservazione dei documenti, per quanto si tratti 
di azioni che vanno poste in continuità, sono concetti e adempimenti distinti.

> ℹ️ **NOTA**
> 
> In questo documento si esaminerà dal punto di vista tecnico la struttura del modello dati del registro cronologico di carico e scarico, 
> senza entrare nel merito delle regole per la corretta registrazione delle diverse tipologie di movimentazioni, in quanto tali indicazioni 
> sono fornite nel documento Allegato 1 al Decreto Direttoriale n.251/2023 - "Modalità di compilazione del modello di cui 
> all'art.4 del D.M. n.59 del 2023" - "Istruzioni per la compilazione del registro cronologico di carico e scarico rifiuti", 
> reperibile a questo [link](https://www.rentri.gov.it/decreti-direttoriali/istruzioni-manuali-e-guide-sintetiche/modalita-di-compilazione-del-registro-di-carico-e-scarico-e-del-formulario).
> Quanto esposto nel seguito deriva inoltre dal recepimento delle norme che regolano la formazione dei documenti informatici 
> riportate nella Modalità Operativa 17 "Specifiche tecniche" al paragrafo 3 (Requisiti Generali).

## 2. Elenco dei file XSD del modello dati

Il modello dati del registro cronologico RENTRI è definito mediante uno schema di tipo XSD (XML Schema Definition). 
La scelta di utilizzare tale formato di definizione deriva dalla necessità di implementare un modello di rifermento basato su standard 
aperti per ottenere la validazione rigorosa dei dati.<br/>
Gli schemi XSD di RENTRI sono raggiungibili alla pagina [Schemi di validazione XSD](javascript:loadPage('schemi-xsd')).

I file XSD che compongono il modello dati del Registro cronologico sono i seguenti:
- **rentri-registri-1.0.xsd** - Modello principale di definizione del registro.
- **rentri-movimenti-1.0.xsd** - Dettaglio della registrazione  di un singolo movimento.
- **rentri-enum-1.0.xsd** - Valori ammessi nella validazione dei diversi campi. Corrisponde alla trasposizione informatica delle tabelle di codifica esposte nella sezione "Allegati" nelle istruzioni pubblicate con Decreto direttoriale n.251 del 19 dicembre 2023.
- **rentri-common-1.0.xsd** - Definizione di elementi comuni semplici.

Eventuali revisioni ai modelli XSD saranno commentate convenzionalmente nell'header del file stesso.

Nella pagina [Schemi di validazione XSD](javascript:loadPage('schemi-xsd')) è disponibile anche lo schema XSD **xmldsig-core-schema.xsd** relativo alla firma degli XML secondo lo standard XAdES e rilasciato dal W3C.

## 3. Modello dati del Registro cronologico in formato digitale

### 3.1 La vidimazione virtuale

la realizzazione del sistema di tracciabilità sui rifiuti introdotto con il sistema RENTRI 
impone la necessità di adottare un modello dati che sia sincrono tra quanto registrato 
localmente nel rispetto delle disposizioni del D.lgs. 152/2006, e quanto comunicato periodicamente a RENTRI come richiesto dal DM 59/2023.

Per questi motivi, la dematerializzazione dei registri cronologici in RENTRI richiede di adottare alcuni accorgimenti 
e operazioni che saranno gestite dai sistemi informativi gestionali e non avranno un impatto rilevante per l'utente.

Il Registro cronologico <u>nasce</u> nel momento in cui l'operatore esegue l'apertura di un nuovo registro collegato ad una unità locale iscritta a RENTRI.<br/>
Tale operazione può avvenire mediante il servizio esposto in area riservata nel Portale RENTRI, oppure applicativamente mediante l'apposito servizio API.
In tutti i casi, l'operazione di apertura di un nuovo registro mediante RENTRI, produce un identificativo unico attraverso il servizio per la vidimazione virtuale fornito dal Sistema Camerale, che qualificherà inequivocabilmente il registro per tutta la sua vita.

![Apertura Nuovo registro da procedura web Portale RENTRI](/docs/assets/api-flussi-operativi-registro-digitale.apertura-registro.png)

![Apertura Nuovo registro da servizio applicativo API – RENTRI](/docs/assets/api-flussi-operativi-registro-digitale.apertura-registro-api.png)

Il file XML della vidimazione virtuale ottenuto con l'apertura di un nuovo registro contiene, oltre all'identificativo unico del registro, 
anche le informazioni del soggetto richiedente, ed il tutto è firmato digitalmente dal sistema RENTRI mediante l'utilizzo di un 
sigillo elettronico (e-seal) proprio del sistema. Sostanzialmente, il file della vidimazione virtuale di un registro è conforme al 
formato XAdES (*XML Advanced Electronic Signatures*).

![Struttura della vidimazione virtuale del registro cronologico elettronico](/docs/assets/api-flussi-operativi-registro-digitale.vidimazione.png)

#### 3.1.1 Struttura della vidimazione virtuale

- **Identificativo** Codice identificativo univoco assegnato al registro (ad es. >R7JFEKL2250<)
- **Operatore**	Identificazione dell'operatore richiedente iscritto a RENTRI
	- **NumIscr**	Identificativo di iscrizione a RENTRI (ad es. >OP2404BPA000004<)
	- **CodiceFiscale**	Codice fiscale 
	- **Denominazione**	Ragione sociale
- **SoggettoDelegato**	Identificazione del soggetto delegato che ha richiesto la vidimazione del registro per conto di un operatore iscritto a RENTRI in delega.
	- **NumIscr**	Identificativo di iscrizione a RENTRI del soggetto delegato (ad es. >SD2404BPA000004<)
	- **CodiceFiscale**	Codice fiscale del soggetto delegato
	- **Denominazione**	Ragione sociale del soggetto delegato
- **NumIscrSito**	Identificativo dell'unità locale iscritta a RENTRI (ad es. >OP2404BPA000004-PD0001<)
- **IndirizzoSito**	Indirizzo dell'unità locale iscritta a RENTRI
- **DataRichiesta**	Data e ora (UTC) in cui è stata trasmessa la richiesta di apertura di un nuovo registro
- **IdentificativoRichiesta**	Codice fiscale dell'utente che ha materialmente eseguito l'azione di apertura di un nuovo registro
- **AutoreRichiesta**	Nome e cognome dell'utente che ha materialmente eseguito l'azione di apertura di un nuovo registro
- **CCIAANome**	Nome della CCIAA competente territorialmente rispetto all'unità locale richiedente
- **Signature**	Firma digitale della vidimazione virtuale prodotta da una CA di dominio RENTRI specifica per questo scopo e distinta tra ambiente demo e ambiente effettivo.

L'attributo "**Id**" sarà normalmente valorizzato con una etichetta del tipo seguente "**eREGI-CS-0**" necessaria per identificare l'impronta (digest) prodotta sui dati della vidimazione, che infatti si presenta nel blocco dati riservato alla firma della vidimazione (ds: Signature):

```xml
Signature -> SignedInfo -> Reference URI="#eREGI-CS-0"
```

dove troveremo anche l'impronta della vidimazione:  

```xml
<ds:DigestValue>LzF537ocYWA+/6NsS20rXqp222FLqaKRCcFtKs9ImWg=</ds:DigestValue>
```

![Vidimazione virtuale del registro cronologico](/docs/assets/api-flussi-operativi-registro-digitale.vidimazione-xml.png)

L'impronta evidenziata è un elemento cardine, come si vedrà nel seguito, per la costruzione del registro partendo dalle informazioni della vidimazione, e concatenando su queste tutte le successive registrazioni.

### 3.2 Registro cronologico

Lo schema della struttura del registro cronologico RENTRI è molto semplice, ed è formata da 4 nodi:
**(1) Vidimazione + (2) Collegamento con parti esterne + (3) Dati movimenti + (4) Firma**

![Struttura del Registro Cronologico dei movimenti di carico e scarico in RENTRI](/docs/assets/api-flussi-operativi-registro-digitale.registro.png)

- **eREGI**	Blocco dati proveniente dalla vidimazione virtuale.
- **RiferimentiPrecedenti**	Raccoglie la cronologia delle impronte di eventuali esportazioni di dati (movimenti) eseguite precedentemente.
  In particolare, la prima impronta dell'elenco si riferisce al digest del blocco dati della vidimazione virtuale (eREGI) che è sempre presente come header del registro in ogni file esportato anche parzialmente.
- **Registrazioni**	Rappresenta il blocco dati che contiene l'insieme delle registrazioni  dei "movimenti".
  Inizialmente, prima dei movimenti, riporta alcuni attributi che forniscono le informazioni "sommarie" dell'esportazione dati eseguita (anno; dal nr. registrazione; al nr. registrazione; numero di registrazioni estratte; data dell'estrazione).
- **Signature**	Elemento canonico che chiude ogni file con l'apposizione di una firma digitale (firma o sigillo) al fine di rendere immodificabile il file prodotto.

Il Registro sarà quindi un file XML nel quale saranno sempre presenti due firme, la prima appartiene alla vidimazione virtuale 
(*nodo "eREGI" element ID 'eREGI-CS-0' scope PARTIAL*), mentre la seconda firma, apposta ad ogni esportazione delle movimentazioni, 
la troveremo in calce a chiusura del file (*scope Full XML File*). 

Trattandosi di una firma c.d. "tecnica" apposta al fine di consolidare e rendere immodificabile il file ottenuto, è indifferente in questo punto l'utilizzo di un sigillo elettronico, o di una firma personale.

> ℹ️ **NOTA**
>
> Per apporre la firma standard XML "enveloped" nel registro, oltre ai certificati personali o ai sigilli qualificati, è possibile utilizzare il "certificato di interoperabilità" CA RENTRI (impiegato per firmare i token JWT di autenticazione delle API).
> È anche possibile utilizzare il "certificato di firma remota" CA RENTRI (soluzione adottata ad esempio nel caso di esportazione creata dai servizi di supporto RENTRI).
> Nel caso del certificato di firma remota CA RENTRI, sarà però necessario implementare una app mobile in grado di gestire un "pin operativo" per l'approvazione di ogni firma (spesso definito anche codice OTP), integrata al RENTRI tramite l'abbinamento descritto nel flusso operativo "Interfacciamento App mobile".
> Per questa funzionalità non è previsto il supporto dell'App mobile RENTRI, che invece è specificatamente dedicata al FIR digitale.
> In entrambi i casi si tratta di una "firma tecnica" e il certificato risulterà "non valido" quando verificato al di fuori del dominio RENTRI (il fallimento del check è dovuto all'impossibilità di ricostruire la c.d. "trusted list" ovvero di creare una catena di certificati attendibile al di fuori del dominio RENTRI). Questo comporta, ad esempio, che entrambi i certificati non possano essere utilizzati per l'archiviazione e il trasferimento in conservazione a norma del file.

#### 3.2.1 Blocco vidimazione "eREGI"

  Questo blocco corrisponde all'XML della vidimazione virtuale ottenuta dal RENTRI, e sarà sempre presente e costante in ogni file di esportazione del registro.

#### 3.2.2 Blocco "Riferimenti Precedenti"

In questa sezione troveremo nella prima riga i riferimenti qualificanti la vidimazione virtuale, e nelle righe successive, i riferimenti qualificanti ogni eventuale esportazione di movimenti eseguita precedentemente rispetto al file corrente.

![Struttura del Registro Cronologico - riferimento con parti esterne al file](/docs/assets/api-flussi-operativi-registro-digitale.riferimenti-precedenti.png)

- **DigestValue**	è una stringa in formato Base64 corrispondente al digest di un file prodotto in precedenza. Il primo record si riferisce al digest della vidimazione virtuale identificato da "eREGI-CS-0".
- **DataCreazione**	è un campo di tipo dataTime (UTC) che riporta il timestamp di creazione del file prodotto in precedenza (visibile nel blocco dati "Registrazioni"). Il primo record si riferisce al timestamp "DataRichiesta" della vidimazione virtuale identificato da "eREGI-CS-0".

Questo blocco informativo consente all'operatore di poter legare in modo indissolubile le parti del registro cronologico che possono essere prodotte anche periodicamente, senza dover necessariamente attendere la registrazione dell'ultimo movimento per una determinata annualità, quindi esportando le registrazioni dei movimenti ad una certa data.<br/>
In questo modo si consente sia l'archiviazione locale della parte del registro esportata, che si ricorda è necessario sia controfirmata dal legale rappresentante o suo delegato, oppure si potrà passare il file direttamente il file ad un sistema per la conservazione a norma, che in questo caso corrisponde solo ad una prima parte del registro cronologico.

![Riferimenti Precedenti - ripresa dell'impronta (digest) e del timestamp della vidimazione virtuale](/docs/assets/api-flussi-operativi-registro-digitale.riferimenti-precedenti-1.png)

Nell'immagine precedente si pone in evidenza una sezione "RiferimentiPrecedenti" in cui è evidente il riferimento con il blocco dati della vidimazione virtuale, e l'esistenza di due precedenti sessioni di esportazione dati (le ultime due righe bordate in verde) oltre alla sessione corrente (il file corrente).

![Riferimenti Precedenti - ripresa dell'impronta (digest) e del timestamp di una precedente esportazione dello stesso registro](/docs/assets/api-flussi-operativi-registro-digitale.riferimenti-precedenti-2.png)

Nell'immagine precedente si evidenzia il legame tra due file appartenenti allo stesso registro che sono stati esportati in momenti successivi, dove si riprende nella sezione "RiferimentiPrecedenti" il digest (Full XML File) della firma posta in calce al primo file esportato, ed il timestamp della prima esportazione.
 
Il "DigestValue" da inserire per ogni riferimento precedente è quello della firma con la reference "principale" che punta alla radice del documento (URI="").

La necessità di frazionare l'esportazione delle registrazioni in più file può dipendere da svariate motivazioni sempre legate al modello organizzativo adottato dall'operatore, oppure da necessità tecniche.<br/>
Ad esempio, gli operatori che effettuano svariate migliaia di movimenti potrebbero trovare utile poter esportare periodicamente svariate decine di migliaia di registrazioni, così da avviare subito alla conservazione le parti di registro "pronte" senza dover attendere l'effettuazione dell'ultima registrazione per l'annualità corrente (in passato, poteva corrispondere all'archiviazione di quanto stampato periodicamente sul registro cartaceo vidimato).<br/>
Questa sezione è rilevante nel momento in cui si renda necessario ricostruire un registro cronologico complesso, composto da più file, in quanto l'operatore dovrà fornire tutti i singoli "pezzi" (chunk) che saranno riconoscibili non tanto per il nome assegnato ai file, quanto per le impronte (digest) presenti nelle firme in calce, e riepilogate nella sezione "RiferimentiPrecedenti" dove solo l'ultimo file prodotto riporterà tutte le precedenti impronte.

È possibile indicare, come rifermimenti precedenti, unicamente il riferimento alla vidimazione virtuale e quello relativo all’ultima esportazione, senza riportare tutti i riferimenti delle esportazioni intermedie.
Questa modalità consente di ottenere file più compatti; pur non permettendo di avere in ogni file l'intera cronologia delle esportazioni, garantisce comunque l'integrità del registro e la possibilità di ricostruire la catena completa dei file, a partire dalla vidimazione virtuale fino all'ultima esportazione effettuata.

#### 3.2.3 Blocco "Registrazioni"

Il blocco dati "Registrazioni" è qualificato con degli attributi che indicano quante registrazioni (movimenti) sono stati esportati e quando è stata eseguita l'esportazione, a seguire, troviamo la collezione dei movimenti esportati, o di eventuali annullamenti di movimenti.

![Struttura dati del Registro Cronologico - dettaglio del blocco dati "Registrazioni"](/docs/assets/api-flussi-operativi-registro-digitale.registrazioni.png)

- **Anno**	Anno di riferimento.
- **ProgressivoDa**	Primo numero di registrazione esportata sulla base cronologica dell'anno.
- **ProgressivoA**	Ultimo numero di registrazione esportata sulla base cronologica dell'anno.
- **NumeroRegistrazioni**	Numero di registrazioni esportate (numero di record "Movimento" a seguire).
- **DataCreazione**	è un campo di tipo dataTime che riporta il timestamp (UTC) di esecuzione dell'estrazione dati, e che corrisponde alla creazione del file prodotto. In seguito, nelle successive esportazioni, questo valore sarà visibile nel blocco dati "RiferimentiPrecedenti". 
- **Movimento**	Blocco dati che identifica una registrazione cronologica.
- **AnnullamentoMovimento** (in alternativa a "Movimento")	Blocco dati che identifica una registrazione di annullamento di una precedente registrazione cronologica.

La sezione "Registrazioni" inizia come evidenziato nell'immagine seguente dove è evidente che una sessione di export movimenti non può ammettere più annualità contemporaneamente.

![Registrazioni - dettaglio degli attributi qualificanti il blocco dati](/docs/assets/api-flussi-operativi-registro-digitale.registrazioni-1.png)

Il timestamp della data di creazione (in UTC) è l'elemento che verrà ripreso nelle esportazioni successive assieme al digest della firma apposta in calce, come illustrato nella descrizione del blocco "RiferimentiPrecedenti".

Seguono, cronologicamente tanti blocchi dati di tipo "Movimento" o "AnnullamentoMovimento" quanti sono indicati in "NumeroRegistrazioni".

![Registrazioni - Blocco dati completo di movimenti e annullamenti](/docs/assets/api-flussi-operativi-registro-digitale.registrazioni-2.png)

#### 3.2.4 Blocco "Movimento"

Questo blocco dati ricalca le informazioni previste dall'allegato 1 al DM 59/2023 "Registro cronologico di carico e scarico" (Articolo 4, comma 1), ed integra il modello dati di base tracciato dal DM con alcuni elementi tecnici necessari all'informatizzazione di un modello dati predisposto nativamente per essere riprodotto in formato documentale su supporto cartaceo.

![Registrazioni - Blocco dati "Movimento"](/docs/assets/api-flussi-operativi-registro-digitale.movimento.png)

I primi tre attributi del blocco dati "Movimento" servono a qualificare l'operazione, ed eventualmente consentono all'operatore di inserire nell'export del registro ulteriori informazioni non richieste da RENTRI.

![Registrazioni - Blocco dati "Movimento" : "OperazioneMovimentoBase"](/docs/assets/api-flussi-operativi-registro-digitale.movimento-1.png)

- **Autore**	Campo di tipo stringa che identifica, anche in forma codificata, l'utente che ha materialmente eseguito la registrazione per conto dell'operatore.
- **IdentificativoTemporale**	Timestamp in cui è stata eseguita la registrazione nel sistema gestionale dell'operatore.
- **CampiCustom**	L'operatore, a sua discrezione, ha la possibilità di esportare nel registro cronologico, ulteriori informazioni presenti nel proprio sistema gestionale e non richieste da RENTRI. Pertanto, affinché sia possibile la validazione del modello dati complessivo, è necessario che l'operatore definisca preventivamente questi ulteriori attributi personalizzati.

![Registrazioni - Definizione di campi personalizzati a cura dell'utente](/docs/assets/api-flussi-operativi-registro-digitale.movimento-2.png)

La restante parte del blocco dati "Movimento" ricalca esattamente la struttura del registro cronologico.

![Layout grafico finale del Registro cronologico di carico e scarico (DM 59/2023 Art. 4, comma 1)](/docs/assets/api-flussi-operativi-registro-digitale.movimento-3.png)

![Registrazioni - Blocco dati "Movimento" : sezioni del Registro cronologico di carico e scarico (DM 59/2023 Art. 4, comma 1)](/docs/assets/api-flussi-operativi-registro-digitale.movimento-4.png)

A parte il primo nodo "Riferimenti" che è obbligatorio, tutti gli altri nodi possono essere presenti solo quando valorizzati, in funzione del tipo di movimento registato.

| Blocchi dati per esportazione XML | Campi definiti nel modello Allegato 1 al DM 59/2023 |
|-----------------------------------|------------------------------------------------------|
| **Riferimenti**| "RIFERIMENTI OPERAZIONE"|
| &nbsp;&nbsp;<span style="color:blue">NumeroRegistrazione<span>| Campo: "1)"&nbsp;&nbsp;&nbsp;"Registrazione"|
| &nbsp;&nbsp;&nbsp;&nbsp;*Anno*||
| &nbsp;&nbsp;&nbsp;&nbsp;*Progressivo*||
| &nbsp;&nbsp;&nbsp;&nbsp;*IdentificativoRentri*| *Non previsto dal modello Allegato 1 al DM 59/2023* |
| &nbsp;&nbsp;<span style="color:blue">DataOraRegistrazione<span>| Campo: "2)"&nbsp;&nbsp;&nbsp;"Del"|
| &nbsp;&nbsp;<span style="color:blue">NumeroRegistrazioneRettifica<span>| Campo: "6)"&nbsp;&nbsp;&nbsp;"Rettifica Reg. nr."|
| &nbsp;&nbsp;&nbsp;&nbsp;*Anno*||
| &nbsp;&nbsp;&nbsp;&nbsp;*Progressivo*||
| &nbsp;&nbsp;&nbsp;&nbsp;*IdentificativoRentri*| *Non previsto dal modello Allegato 1 al DM 59/2023* |
| &nbsp;&nbsp;<span style="color:blue">CausaleOperazione<span>| Campi: "3)" - "4)"&nbsp;&nbsp;&nbsp;"Causale operazione"|
| &nbsp;&nbsp;<span style="color:blue">StoccaggioIstantaneo<span>| Campo: "7)"&nbsp;&nbsp;&nbsp;"Stoccaggio istantaneo"|
| &nbsp;&nbsp;<span style="color:blue">RiferimentoOperazione<span>| Campo: "5)"&nbsp;&nbsp;&nbsp;"Riferimento operazione"|
| &nbsp;&nbsp;&nbsp;&nbsp;*Anno*||
| &nbsp;&nbsp;&nbsp;&nbsp;*Progressivo*||
| &nbsp;&nbsp;&nbsp;&nbsp;*IdentificativoRentri*| *Non previsto dal modello Allegato 1 al DM 59/2023* |
| **Rifiuto**| "IDENTIFICAZIONE DEL RIFIUTO"|
| &nbsp;&nbsp;<span style="color:blue">CodiceEer<span>| Campo: "8)"&nbsp;&nbsp;&nbsp;"Codice EER"|
| &nbsp;&nbsp;<span style="color:blue">DescrizioneEer<span>| Campo: "10)"&nbsp;&nbsp;&nbsp;"Descrizione del rifiuto"|
| &nbsp;&nbsp;<span style="color:blue">Provenienza<span>| Campo: "9)"&nbsp;&nbsp;&nbsp;"Provenienza"|
| &nbsp;&nbsp;<span style="color:blue">CaratteristichePericolo<span>| Campo: "11)"&nbsp;&nbsp;&nbsp;"Caratteristica di Pericolo"|
| &nbsp;&nbsp;<span style="color:blue">StatoFisico<span>| Campo: "12)"&nbsp;&nbsp;&nbsp;"Stato fisico"|
| &nbsp;&nbsp;<span style="color:blue">Quantita<span>| Campo: "13)"&nbsp;&nbsp;&nbsp;"Quantità"|
| &nbsp;&nbsp;&nbsp;&nbsp;*Valore*||
| &nbsp;&nbsp;&nbsp;&nbsp;*UnitaMisura*| Campo: "14)"&nbsp;&nbsp;&nbsp;"Unità di misura"|
| &nbsp;&nbsp;<span style="color:blue">DestinatoAttivita<span>| Campo: "15)"&nbsp;&nbsp;&nbsp;"Destinato a"|
| &nbsp;&nbsp;<span style="color:blue">CategorieAee<span>| Campo: "16)"&nbsp;&nbsp;&nbsp;"Categoria AEE"|
| &nbsp;&nbsp;<span style="color:blue">VeicoloFuoriUso<span>| Campo: "17)"&nbsp;&nbsp;&nbsp;"Veicolo Fuori Uso"|
| &nbsp;&nbsp;<span style="color:blue">VeicoloFuoriUsoRegPubblicaSicurezza<span>| Campo: "18)"&nbsp;&nbsp;&nbsp;"Reg. Pubblica Sicurezza"|
| &nbsp;&nbsp;&nbsp;&nbsp;*Numero*||
| &nbsp;&nbsp;&nbsp;&nbsp;*Data*||
| **Materiali**| "MATERIALI"|
| &nbsp;&nbsp;<span style="color:blue">Materiale<span>| Campo: "19)"&nbsp;&nbsp;&nbsp;"Materiale"|
| &nbsp;&nbsp;<span style="color:blue">DescrizioneMateriale<span>| Campo: "20)"&nbsp;&nbsp;&nbsp;"Altro"|
| &nbsp;&nbsp;<span style="color:blue">Quantita<span>| Campo: "21)"&nbsp;&nbsp;&nbsp;"Quantità"|
| &nbsp;&nbsp;&nbsp;&nbsp;*Valore*||
| &nbsp;&nbsp;&nbsp;&nbsp;*UnitaMisura*||
| **IntegrazioneFir**| "INTEGRAZIONE FIR/REGISTRO C/S"|
| &nbsp;&nbsp;<span style="color:blue">NumeroFir<span>| Campo: "22)"&nbsp;&nbsp;&nbsp;"Num. Formulario"|
| &nbsp;&nbsp;<span style="color:blue">TrasportoTransfrontaliero<span>| Campo: "22b)"&nbsp;&nbsp;&nbsp;"Trasp. Transfrontaliero"|
| &nbsp;&nbsp;<span style="color:blue">TipoTrasportoTransfrontaliero<span>| Campo: "22b)"&nbsp;&nbsp;&nbsp;"Tipo"|
| &nbsp;&nbsp;<span style="color:blue">DataInizioTrasporto<span>| Campo: "23)"&nbsp;&nbsp;&nbsp;"Data inizio trasporto"|
| **Esito**| "ESITO CONFERIMENTO"|
| &nbsp;&nbsp;<span style="color:blue">DataFineTrasporto<span>| Campo: "24)"&nbsp;&nbsp;&nbsp;"Data fine trasporto"|
| &nbsp;&nbsp;<span style="color:blue">PesoVerificatoDestino<span>| Campo: "25)"&nbsp;&nbsp;&nbsp;"Peso verificato a destino"|
| &nbsp;&nbsp;<span style="color:blue">Respingimento<span>| "Respingimento"|
| &nbsp;&nbsp;&nbsp;&nbsp;*Tipo*| Campo: "26)"&nbsp;&nbsp;&nbsp;"Tipologia"|
| &nbsp;&nbsp;&nbsp;&nbsp;*Quantita*| Campo: "27)"&nbsp;&nbsp;&nbsp;"Quantità"|
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;*Valore*||
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;*UnitaMisura*| Campo: "28)"&nbsp;&nbsp;&nbsp;"Unità di m."|
| &nbsp;&nbsp;&nbsp;&nbsp;*Causale*| Campo: "29)"&nbsp;&nbsp;&nbsp;"Causale"|
| &nbsp;&nbsp;&nbsp;&nbsp;*CausaleAltro*| Campo: "29)"&nbsp;&nbsp;&nbsp;"Altro"|
| **Produttore**| "Produttore"|
| &nbsp;&nbsp;<span style="color:blue">*NazioneId*<span>| *Non previsto dal modello Allegato 1 al DM 59/2023* |
| &nbsp;&nbsp;<span style="color:blue">Denominazione<span>| Campo: "30)"&nbsp;&nbsp;&nbsp;"Denominazione"|
| &nbsp;&nbsp;<span style="color:blue">CodiceFiscale<span>| Campo: "31)"&nbsp;&nbsp;&nbsp;"Codice fiscale"|
| &nbsp;&nbsp;<span style="color:blue">Indirizzo<span>| Campo: "32)"&nbsp;&nbsp;&nbsp;"Indirizzo/luogo di produzione"|
| &nbsp;&nbsp;&nbsp;&nbsp;*Indirizzo*||
| &nbsp;&nbsp;&nbsp;&nbsp;*Civico*||
| &nbsp;&nbsp;&nbsp;&nbsp;*Cap*||
| &nbsp;&nbsp;&nbsp;&nbsp;*Citta*||
| &nbsp;&nbsp;&nbsp;&nbsp;*ComuneId*||
| &nbsp;&nbsp;&nbsp;&nbsp;*NazioneId*||
| &nbsp;&nbsp;&nbsp;&nbsp;*NomeCitta*||
| **Trasportatore**| "Trasportatore"|
| &nbsp;&nbsp;<span style="color:blue">*NazioneId*<span>| *Non previsto dal modello Allegato 1 al DM 59/2023* |
| &nbsp;&nbsp;<span style="color:blue">Denominazione<span>| Campo: "33)"&nbsp;&nbsp;&nbsp;"Denominazione"|
| &nbsp;&nbsp;<span style="color:blue">CodiceFiscale<span>| Campo: "34)"&nbsp;&nbsp;&nbsp;"Codice fiscale"|
| &nbsp;&nbsp;<span style="color:blue">NumIscrizioneAlbo<span>| Campo: "35)"&nbsp;&nbsp;&nbsp;"N. Iscrizione Albo"|
| **Destinatario**| "Destinatario"|
| &nbsp;&nbsp;<span style="color:blue">*NazioneId*<span>| *Non previsto dal modello Allegato 1 al DM 59/2023* |
| &nbsp;&nbsp;<span style="color:blue">Denominazione<span>| Campo: "36)"&nbsp;&nbsp;&nbsp;"Denominazione"|
| &nbsp;&nbsp;<span style="color:blue">CodiceFiscale<span>| Campo: "37)"&nbsp;&nbsp;&nbsp;"Codice fiscale"|
| &nbsp;&nbsp;<span style="color:blue">NumAutorizzazione<span>| Campo: "38)"&nbsp;&nbsp;&nbsp;"N. Autorizzazione"|
| **Intermediario**| "Lista di Intermediari o Commercianti"|
| &nbsp;&nbsp;<span style="color:blue">*NazioneId*<span>| *Non previsto dal modello Allegato 1 al DM 59/2023* |
| &nbsp;&nbsp;<span style="color:blue">Denominazione<span>| Campo: "39)"&nbsp;&nbsp;&nbsp;"Denominazione"|
| &nbsp;&nbsp;<span style="color:blue">CodiceFiscale<span>| Campo: "40)"&nbsp;&nbsp;&nbsp;"Codice fiscale"|
| &nbsp;&nbsp;<span style="color:blue">NumIscrizioneAlbo<span>| Campo: "41)"&nbsp;&nbsp;&nbsp;"N. Iscrizione Albo"|
| **Annotazioni**| Campo: "42)"&nbsp;&nbsp;&nbsp;"Annotazioni"|

#### 3.2.5 Rettifica di un movimento

Una registrazione di rettifica di un movimento registrato precedentemente è una registrazione a tutti gli effetti, quindi, avrà un proprio "numero progressivo operazione" e una propria data di registrazione come qualsiasi altra operazione di carico e scarico e come tale entrerà nell'elenco delle registrazioni da esportate nel file XML e da trasmettere al RENTRI.

L'unica differenza rispetto a una normale registrazione è la valorizzazione di **NumeroRegistrazioneRettifica**, ovvero l'identificativo o l'anno e progressivo della registrazione da rettificare.

Non è possibile rettificare una registrazione di rettifica o di annullamento e, con una rettifica, non si può "spostare" cronologicamente la registrazione che si intende rettificare.

#### 3.2.6 Blocco "AnnullamentoMovimento"

Una registrazione per l'annullamento di un movimento registrato precedentemente consiste in una registrazione a tutti gli effetti, quindi, occuperà un proprio "numero progressivo operazione" come qualsiasi altra operazione, e come tale entrerà nel conteggio delle registrazioni da esportate nel file XML e da trasmettere al RENTRI.

![Registrazioni - Blocco dati "AnnullamentoMovimento"](/docs/assets/api-flussi-operativi-registro-digitale.annullamento.png)

Anche in questo caso, esattamente come visto in precedenza per la sezione "Movimento" i primi tre attributi del blocco dati servono a qualificare l'operazione, ed eventualmente consentono all'operatore di inserire nell'export del registro ulteriori informazioni non richieste da RENTRI, mentre per identificare la registrazione da annullare seguono i seguenti elementi.

- **NumeroRegistrazione**	identifica la registrazione cronologica corrente annotata nel registro.
	Oltre al numero progressivo e formato da: (Anno; Progressivo; IdentificativoRentri)
- **DataOraRegistrazione**	È un valore di tipo timestamp che rappresenta la data di registrazione come previsto nel modello di registro RENTRI, nel quale l'indicazione dell'ora non è presente. Tuttavia, trattandosi di una registrazione informatica, è comunque consentito indicare anche l'ora.
- **NumeroRegistrazioneAnnullata**	Rappresenta il numero cronologico che identifica la registrazione da annullare. Oltre al numero progressivo è formato da: (Anno; Progressivo; IdentificativoRentri)
- **Annotazioni**	Annotazioni in forma testuale libera.

#### 3.2.7 Esempio di registrazione, rettifica e annullamento

La tabella seguente rappresenta una sequenza di operazioni registrate cercando di simulare una situazione reale, allo scopo di comprendere 
la dinamica dei riferimenti alle operazioni e come questi devono essere trattati e rappresentati.  

| NumeroRegistrazione | DataOraRegistrazione | CausaleOperazione | Dati della registrazione | Riferimento alla registrazione nr. &#8593;  | Riferimento nella registrazione nr. &#8595; |
|:--------------------:|:---------------------:|:-----------------:|:-----------------------:|:-------------------------------------------:|:-------------------------------------------:|
| 1 | 10-01-2024 | C | <span style="color:gray">{XX}<span> ||(3)|
| 2 | 12-01-2024 | C | <span style="color:gray">{XX}<span> ||(3),(7)|
| **3** | **15-01-2024** | **S** | {~~XX~~}<span style="color:blue">{~~YY~~}</span><span style="color:red">{--}<span> |{1,2}|<span style="color:red">[Rettificata dalla **6** e annullata dalla **8**]<span>|
| 5 | 18-01-2024 | C | <span style="color:gray">{XX}<span> ||(7)|
| <span style="color:red">**6**</span> | <span style="color:red">20-01-2024</span> | <span style="color:red">**[Rettifica]**</span> | <span style="color:blue">{YY}<span> | <span style="color:red">[Rettifica la **3**]</span> ||
| 7 | 20-01-2024 | S | <span style="color:gray">{XX}<span> |{2, 5}||
| <span style="color:red">**8**</span> | <span style="color:red">21-01-2024</span> | <span style="color:red">**[Annullamento]**</span> | <span style="color:red">{--}<span> | <span style="color:red">[Annulla la **3**]</span> ||

Il carico 1 viene scaricato dallo scarico 3.

Il carico 2 viene scaricato dagli scarichi 3 e 7. 

Si tratta di due carichi 1 e 2 che escono con lo scarico 3 dove il 2 è parziale (infatti, lo ritroviamo anche sul 7). <br/>
Lo scarico 3 è rettificato dall'operazione 6, che corregge alcuni dati, e "integra" le parti mancanti.<br/> 
Si evidenzia quindi che la registrazione numero 3 del 15-01-2024 è stata successivamente rettificata dalla numero 6 del 20-01-2024.
Analogamente, la numero 6 del 20-01-2024 riporta le informazioni corrette, ma è importante comprendere che si tratta di un evento che temporalmente deve rimanere al numero 3 del 15-01-2024. 

La rettifica non "sposta" cronologicamente la registrazione che intende rettificare, che infatti rimane alla data di registrazione originale. Per poter spostare l'evento in una data successiva, sarebbe necessario "annullare" la registrazione originaria, e inserirne una completamente nuova, considerando che non si può attribuire ad una registrazione un numero già assegnato ad un'altra registrazione (bis, tris, etc.) pertanto, la nuova registrazione di rettifica troverà una collocazione temporale pari, o successiva, all'ultima data registrata a garanzia della cronologia delle registrazioni.

L'operazione di rettifica 6  consente all'Operatore di modificare le informazioni della registrazione originale 3.
La registrazione 8 annulla la registrazione 3, i cui dati sono stati rettificati dalla 6.
Pertanto, per effetto dell'annullamento, la registrazione originale (e le eventuali sue successive rettifiche, nell'esempio la 3 e la 6) risulteranno annullate dalla 8.

## 4. Validazione del Registro cronologico digitale

La mancata osservazione delle regole sotto riportate comporta la non accettazione 
da parte del sistema RENTRI di tutto il set delle registrazioni in trasmissione.
### 4.1 Regole di validazione

#### 4.1.1 Movimento
Questa tabella è una sintesi delle regole di validazione che il sistema RENTRI applica ai singoli movimenti. Per una descrizione dettagliata delle regole di validazione, compresi gli elenchi dei valori ammessi rispetto alle codifiche,
si rimanda alla documentazione degli endpoint **<span style="color:#61affe">POST</span> `<ambiente>/dati-registri/v1.0/operatore/{identificativo_registro}/movimenti`** 
e **<span style="color:#61affe">POST</span> `<ambiente>/dati-registri/v1.0/soggetto-delegato/{identificativo_registro}/movimenti`**, modello MovimentoModel.

| Blocchi dati (rif. schema XSD) | Modelli/Proprietà (rif. endpoint API) | Regole di validazione |
|------------------------------|------------------------------|----------------------------------------------------------------|
| **Riferimenti**| **riferimenti**| Richiesto. |
| &nbsp;&nbsp;<span style="color:blue">NumeroRegistrazione<span>| &nbsp;&nbsp;<span style="color:blue">numero_registrazione<span>| Richiesto. |
| &nbsp;&nbsp;&nbsp;&nbsp;*Anno*| &nbsp;&nbsp;&nbsp;&nbsp;*anno*| Richiesto.<br/>>= 1980, <= 2050 |
| &nbsp;&nbsp;&nbsp;&nbsp;*Progressivo*| &nbsp;&nbsp;&nbsp;&nbsp;*progressivo*| Richiesto.<br/>>= 1 |
| &nbsp;&nbsp;<span style="color:blue">DataOraRegistrazione<span>| &nbsp;&nbsp;<span style="color:blue">data_ora_registrazione<span>| Richiesto.<br/>Formato ISO 8601 UTC.<br/>In caso di rettifica, è la data di registrazione della registrazione di rettifica. Trattandosi di una registrazione informatica, è consentito indicare l'ora, anche se non obbligatoria.|
| &nbsp;&nbsp;<span style="color:blue">NumeroRegistrazioneRettifica<span>| &nbsp;&nbsp;<span style="color:blue">numero_registrazione_rettifica<span>| Richiesto nel caso di registrazione di rettifica.<br/>Specificare alternativamente anno e progressivo oppure identificativo RENTRI. |
| &nbsp;&nbsp;&nbsp;&nbsp;*Anno*| &nbsp;&nbsp;&nbsp;&nbsp;*anno*| >= 1980, <= 2050 |
| &nbsp;&nbsp;&nbsp;&nbsp;*Progressivo*| &nbsp;&nbsp;&nbsp;&nbsp;*progressivo*| >= 1 |
| &nbsp;&nbsp;&nbsp;&nbsp;*IdentificativoRentri*| &nbsp;&nbsp;&nbsp;&nbsp;*identificativo*| Pattern: ^M[0-9A-Z]{19}$ |
| &nbsp;&nbsp;<span style="color:blue">CausaleOperazione<span>| &nbsp;&nbsp;<span style="color:blue">causale_operazione<span>| Non richiesto solo nel caso di stoccaggio istantaneo (o giacenza).<br/>API di codifica: *GET /codifiche/v1.0/causali-operazione* |
| &nbsp;&nbsp;<span style="color:blue">StoccaggioIstantaneo<span>| &nbsp;&nbsp;<span style="color:blue">stoccaggio_istantaneo<span>| Formato ISO 8601 UTC.<br/>Se valorizzata possono essere compilati solamente i dati relativi al rifiuto e non al materiale. |
| &nbsp;&nbsp;<span style="color:blue">RiferimentoOperazione<span>| &nbsp;&nbsp;<span style="color:blue">riferimento_operazione<span>| Tipo array.<br/>Specificare alternativamente anno e progressivo oppure identificativo RENTRI. |
| &nbsp;&nbsp;&nbsp;&nbsp;*Anno*| &nbsp;&nbsp;&nbsp;&nbsp;*anno*| >= 1980, <= 2050 |
| &nbsp;&nbsp;&nbsp;&nbsp;*Progressivo*| &nbsp;&nbsp;&nbsp;&nbsp;*progressivo*| >= 1 |
| &nbsp;&nbsp;&nbsp;&nbsp;*IdentificativoRentri*| &nbsp;&nbsp;&nbsp;&nbsp;*identificativo*| Pattern: ^M[0-9A-Z]{19}$ |
| **Rifiuto**| **rifiuto**| Richiesto solamente se CausaleOperazione è diversa da "M". |
| &nbsp;&nbsp;<span style="color:blue">CodiceEer<span>| &nbsp;&nbsp;<span style="color:blue">codice_eer<span>| Richiesto.<br>Vengono accettati solo codici EER validi e presenti nella Lista Europea dei Rifiuti (European Waste List - EWL).<br/>API di codifica: *GET /codifiche/v1.0/codici-eer* |
| &nbsp;&nbsp;<span style="color:blue">DescrizioneEer<span>| &nbsp;&nbsp;<span style="color:blue">descrizione_eer<span>| Richiesta se il Codice EER specificato è di tipo .99.<br/>Lunghezza massima di 250 caratteri. |
| &nbsp;&nbsp;<span style="color:blue">Provenienza<span>| &nbsp;&nbsp;<span style="color:blue">provenienza<span>| API di codifica: *GET /codifiche/v1.0/provenienza* |
| &nbsp;&nbsp;<span style="color:blue">CaratteristichePericolo<span>| &nbsp;&nbsp;<span style="color:blue">caratteristiche_pericolo<span>| Tipo array.<br/>API di codifica: *GET /codifiche/v1.0/caratteristiche-pericolo* |
| &nbsp;&nbsp;<span style="color:blue">StatoFisico<span>| &nbsp;&nbsp;<span style="color:blue">stato_fisico<span>| Richiesto.<br/>API di codifica: *GET /codifiche/v1.0/stati-fisici* |
| &nbsp;&nbsp;<span style="color:blue">Quantita<span>| &nbsp;&nbsp;<span style="color:blue">quantita<span>| Richiesto. |
| &nbsp;&nbsp;&nbsp;&nbsp;*Valore*| &nbsp;&nbsp;&nbsp;&nbsp;*valore*| Richiesto.<br/>Compreso tra 0.0000 e 9999999999.9999 (parte intera: 10, parte decimale: 4). |
| &nbsp;&nbsp;&nbsp;&nbsp;*UnitaMisura*| &nbsp;&nbsp;&nbsp;&nbsp;*unita_misura*| Richiesto.<br/>API di codifica: *GET /codifiche/v1.0/unita-misura* |
| &nbsp;&nbsp;<span style="color:blue">DestinatoAttivita<span>| &nbsp;&nbsp;<span style="color:blue">destinato_attivita<span>| Richiesto.<br/>API di codifica: *GET /codifiche/v1.0/attivita-rs* |
| &nbsp;&nbsp;<span style="color:blue">CategorieAee<span>| &nbsp;&nbsp;<span style="color:blue">categorie_aee<span>| Tipo array.<br/>API di codifica: *GET /codifiche/v1.0/categorie-raee* |
| &nbsp;&nbsp;<span style="color:blue">VeicoloFuoriUso<span>| &nbsp;&nbsp;<span style="color:blue">veicolo_fuori_uso<span>| true/false o nullo. |
| &nbsp;&nbsp;<span style="color:blue">VeicoloFuoriUsoRegPubblicaSicurezza<span>| &nbsp;&nbsp;<span style="color:blue">veicolo_fuori_uso_reg_pubblica_sicurezza<span>| Richiesto solamente se VeicoliFuoriUso è uguale a "true". |
| &nbsp;&nbsp;&nbsp;&nbsp;*Numero*| &nbsp;&nbsp;&nbsp;&nbsp;*numero*| Lunghezza massima di 50 caratteri. |
| &nbsp;&nbsp;&nbsp;&nbsp;*Data*| &nbsp;&nbsp;&nbsp;&nbsp;*data*| Formato ISO 8601 UTC. |
| **Materiali**| **materiali**| Richiesto solamente se CausaleOperazione è uguale a "M". |
| &nbsp;&nbsp;<span style="color:blue">Materiale<span>| &nbsp;&nbsp;<span style="color:blue">materiale<span>| Richiesto.<br/>API di codifica: *GET /codifiche/v1.0/materiali* |
| &nbsp;&nbsp;<span style="color:blue">DescrizioneMateriale<span>| &nbsp;&nbsp;<span style="color:blue">descrizione_materiale<span>| Lunghezza massima di 50 caratteri. |
| &nbsp;&nbsp;<span style="color:blue">Quantita<span>| &nbsp;&nbsp;<span style="color:blue">quantita<span>|  |
| &nbsp;&nbsp;&nbsp;&nbsp;*Valore*| &nbsp;&nbsp;&nbsp;&nbsp;*valore*| Richiesto.<br/>Compreso tra 0.0000 e 9999999999.9999 (parte intera: 10, parte decimale: 4). |
| &nbsp;&nbsp;&nbsp;&nbsp;*UnitaMisura*| &nbsp;&nbsp;&nbsp;&nbsp;*unita_misura*| Richiesto. Valori permessi: "kg".<br/>API di codifica: *GET /codifiche/v1.0/unita-misura* | 
| **IntegrazioneFir**| **integrazione_fir**| Non deve essere indicato se CausaleOperazione è diversa da: "aT", "TR", "T*", "T*AT". |
| &nbsp;&nbsp;<span style="color:blue">NumeroFir<span>| &nbsp;&nbsp;<span style="color:blue">numero_fir<span>| Lungezza massima 20 caratteri. |
| &nbsp;&nbsp;<span style="color:blue">TrasportoTransfrontaliero<span>| &nbsp;&nbsp;<span style="color:blue">trasporto_transfrontaliero<span>| true/false o nullo. |
| &nbsp;&nbsp;<span style="color:blue">TipoTrasportoTransfrontaliero<span>| &nbsp;&nbsp;<span style="color:blue">tipo_trasporto_transfrontaliero<span>| API di codifica: *GET /codifiche/v1.0/tipi-trasporto-transfrontaliero*
| &nbsp;&nbsp;<span style="color:blue">DataInizioTrasporto<span>| &nbsp;&nbsp;<span style="color:blue">data_inizio_trasporto<span>| Formato ISO 8601 UTC. |
| **Esito**| **esito**| Richiesto se CausaleOperazione è uguale a: "aT" o "T*AT". |
| &nbsp;&nbsp;<span style="color:blue">DataFineTrasporto<span>| &nbsp;&nbsp;<span style="color:blue">data_fine_trasporto<span>| Formato ISO 8601 UTC. |
| &nbsp;&nbsp;<span style="color:blue">PesoVerificatoDestino<span>| &nbsp;&nbsp;<span style="color:blue">peso_verificato_destino<span>| Compreso tra 0.0000 e 9999999999.9999 (parte intera: 10, parte decimale: 4). |
| &nbsp;&nbsp;<span style="color:blue">Respingimento<span>| &nbsp;&nbsp;<span style="color:blue">respingimento<span>| |
| &nbsp;&nbsp;&nbsp;&nbsp;*Tipo*| &nbsp;&nbsp;&nbsp;&nbsp;*tipo*| Richiesto.<br />API di codifica: *GET /codifiche/v1.0/tipi-respingimento* |
| &nbsp;&nbsp;&nbsp;&nbsp;*Quantita*| &nbsp;&nbsp;&nbsp;&nbsp;*quantita*| Quantità respinta. |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;*Valore*| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;*valore*| Richiesto.<br/>Compreso tra 0.0000 e 9999999999.9999 (parte intera: 10, parte decimale: 4). |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;*UnitaMisura*| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;*unita_misura*| Richiesto.<br/>API di codifica: *GET /codifiche/v1.0/unita-misura* |
| &nbsp;&nbsp;&nbsp;&nbsp;*Causale*| &nbsp;&nbsp;&nbsp;&nbsp;*causale*| API di codifica: *GET /codifiche/v1.0/causali-respingimento* |
| &nbsp;&nbsp;&nbsp;&nbsp;*CausaleAltro*| &nbsp;&nbsp;&nbsp;&nbsp;*causale_altro*| Richiesto se Causale è uguale a "A" (altro).<br/>Lunghezza massima di 50 caratteri. |
| **Produttore**| **produttore**| |
| &nbsp;&nbsp;<span style="color:blue">Denominazione<span>| &nbsp;&nbsp;<span style="color:blue">denominazione<span>| Lunghezza massima di 255 caratteri. |
| &nbsp;&nbsp;<span style="color:blue">CodiceFiscale<span>| &nbsp;&nbsp;<span style="color:blue">codice_fiscale<span>| Lunghezza compresa tra 5 e 20 caratteri. |
| &nbsp;&nbsp;<span style="color:blue">Indirizzo<span>| &nbsp;&nbsp;<span style="color:blue">indirizzo<span>| Richiesto. |
| &nbsp;&nbsp;&nbsp;&nbsp;*Indirizzo*| &nbsp;&nbsp;&nbsp;&nbsp;*indirizzo*| Lunghezza massima di 100 caratteri. |
| &nbsp;&nbsp;&nbsp;&nbsp;*Civico*| &nbsp;&nbsp;&nbsp;&nbsp;*civico*| Lunghezza massima di 20 caratteri. |
| &nbsp;&nbsp;&nbsp;&nbsp;*Cap*| &nbsp;&nbsp;&nbsp;&nbsp;*cap*| Se indirizzo italiano 5 cifre, altrimenti lunghezza compresa tra 2 e 20 caratteri. |
| &nbsp;&nbsp;&nbsp;&nbsp;*Citta*| &nbsp;&nbsp;&nbsp;&nbsp;*citta*| Richiesto. |
| &nbsp;&nbsp;&nbsp;&nbsp;*ComuneId*| &nbsp;&nbsp;&nbsp;&nbsp;*comune_id*| Richiesto in caso venga specificato un produttore italiano.<br/>Vengono accettati solo codici ISTAT di comuni italiani.<br/>API di codifica: *GET /codifiche/v1.0/comuni* |
| &nbsp;&nbsp;&nbsp;&nbsp;*NazioneId*| &nbsp;&nbsp;&nbsp;&nbsp;*nazione_id*| Richiesto in caso venga specificato un produttore estero.<br/>Vengono accettati solo codici previsti dallo standard ISO 3166-1 alpha-2.<br/>API di codifica: *GET /codifiche/v1.0/nazioni* |
| &nbsp;&nbsp;&nbsp;&nbsp;*NomeCitta*| &nbsp;&nbsp;&nbsp;&nbsp;*nome_citta*| Richiesto in caso venga specificato un produttore estero.<br/>Lunghezza massima di 100 caratteri. |
| **Trasportatore**| **trasportatore**||
| &nbsp;&nbsp;<span style="color:blue">Denominazione<span>| &nbsp;&nbsp;<span style="color:blue">denominazione<span>| Richiesto.<br/>Lunghezza massima di 255 caratteri. |
| &nbsp;&nbsp;<span style="color:blue">CodiceFiscale<span>| &nbsp;&nbsp;<span style="color:blue">codice_fiscale<span>| Richiesto.<br/>Lunghezza compresa tra 5 e 20 caratteri. |
| &nbsp;&nbsp;<span style="color:blue">NumIscrizioneAlbo<span>| &nbsp;&nbsp;<span style="color:blue">num_iscrizione_albo<span>| Pattern: ^([A-Za-z]{2})/([0-9]{6})$ |
| **Destinatario**| **destinatario**||
| &nbsp;&nbsp;<span style="color:blue">Denominazione<span>| &nbsp;&nbsp;<span style="color:blue">denominazione<span>| Richiesto.<br/>Lunghezza massima di 255 caratteri. |
| &nbsp;&nbsp;<span style="color:blue">CodiceFiscale<span>| &nbsp;&nbsp;<span style="color:blue">codice_fiscale<span>| Richiesto.<br/>Lunghezza compresa tra 5 e 20 caratteri. |
| &nbsp;&nbsp;<span style="color:blue">NumAutorizzazione<span>| &nbsp;&nbsp;<span style="color:blue">num_autorizzazione<span>| Richiesto in caso venga specificato il destinatario, non obbligatorio nel caso di destinatario estero.<br/>Lunghezza massima di 50 caratteri. |
| **Intermediario**| **intermediari**| Tipo array. |
| &nbsp;&nbsp;<span style="color:blue">Denominazione<span>| &nbsp;&nbsp;<span style="color:blue">denominazione<span>| Richiesto.<br/>Lunghezza massima di 255 caratteri. |
| &nbsp;&nbsp;<span style="color:blue">CodiceFiscale<span>| &nbsp;&nbsp;<span style="color:blue">codice_fiscale<span>| Richiesto.<br/>Lunghezza compresa tra 5 e 20 caratteri. |
| &nbsp;&nbsp;<span style="color:blue">NumIscrizioneAlbo<span>| &nbsp;&nbsp;<span style="color:blue">num_iscrizione_albo<span>| Pattern: ^([A-Za-z]{2})/([0-9]{6})$ |
| <span style="color:blue">Annotazioni<span>| <span style="color:blue">annotazioni<span>| Lunghezza massima di 500 caratteri. |

#### 4.1.2 Annullamento
Questa tabella è una sintesi delle regole di validazione che il sistema RENTRI applica ai singoli annullamenti di movimenti. Per una descrizione dettagliata delle regole di validazione, compresi gli elenchi dei valori ammessi rispetto alle codifiche,
si rimanda alla documentazione degli endpoint **<span style="color:#61affe">POST</span> `<ambiente>/dati-registri/v1.0/operatore/{identificativo_registro}/movimenti`** 
e **<span style="color:#61affe">POST</span> `<ambiente>/dati-registri/v1.0/soggetto-delegato/{identificativo_registro}/movimenti`**, modello AnnullamentoMovimentoModel.

| Blocchi dati (rif. schema XSD) | Modelli/Proprietà (rif. endpoint API) | Regole di validazione |
|------------------------------|------------------------------|----------------------------------------------------------------|
| <span style="color:blue">NumeroRegistrazione<span>| <span style="color:blue">numero_registrazione<span>| Richiesto. |
| &nbsp;&nbsp;*Anno*| &nbsp;&nbsp;*anno*| Richiesto.<br/>>= 1980, <= 2050 |
| &nbsp;&nbsp;*Progressivo*| &nbsp;&nbsp;*progressivo*| Richiesto.<br/>>= 1 |
| <span style="color:blue">DataOraRegistrazione<span>| <span style="color:blue">data_ora_registrazione<span>| Richiesto.<br/>Formato ISO 8601 UTC. |
| <span style="color:blue">NumeroRegistrazioneAnnullata<span>| <span style="color:blue">numero_registrazione_annullata<span>| Richiesto.<br/>Specificare alternativamente anno e progressivo oppure identificativo RENTRI. |
| &nbsp;&nbsp;*Anno*| &nbsp;&nbsp;*anno*| >= 1980, <= 2050 |
| &nbsp;&nbsp;*Progressivo*| &nbsp;&nbsp;*progressivo*| >= 1 |
| &nbsp;&nbsp;*IdentificativoRentri*| &nbsp;&nbsp;*identificativo*| Pattern: ^M[0-9A-Z]{19}$ |
| <span style="color:blue">Annotazioni<span>| <span style="color:blue">annotazioni<span>| Lunghezza massima di 500 caratteri. |

### 4.2 Validazioni aggiuntive in fase di elaborazione

Sono validazioni di corrispondenza eseguite durante il processo di acquisizione del registro digitale, per il movimento:

| Blocchi dati | Regole di validazione |
|-----------------------------------|------------------------------------------------------|
| **Riferimenti**| |
| &nbsp;&nbsp;<span style="color:blue">NumeroRegistrazione<span>| I valori di anno e progressivo indicati non devono corrispondere a quelli di una registrazione già trasmessa al RENTRI e devono essere univoci come coppia di valori. |
| &nbsp;&nbsp;<span style="color:blue">NumeroRegistrazioneRettifica<span>| I valori di anno e progressivo (oppure, alternativamente, identificativo RENTRI) indicati devono fare riferimento ad una registrazione già trasmessa al RENTRI, non devono fare riferimento ad una registrazione di rettifica o di annullamento e devono sempre essere relativi a registrazioni presenti all'interno dello stesso registro. |
| &nbsp;&nbsp;<span style="color:blue">RiferimentoOperazione<span>| I valori di anno e progressivo (oppure, alternativamente, identificativo RENTRI) specificati in RiferimentoOperazione non devono fare riferimento a:<br/> - l'operazione stessa; <br/> - una registrazione di rettifica; <br/> - una registrazione di annullamento|

> ℹ️ **NOTA**
> 
> All'interno della lista di valori **`RiferimentoOperazione`** è possibile specificare tramite anno e progressivo anche registrazioni che non risultano già trasmesse al RENTRI.
> Tali registrazioni saranno create con i soli riferimenti di anno e progressivo forniti e l'identificativo RENTRI automaticamente generato.
> Sarà possibile in seguito inviare i dati di queste registrazioni, tramite la trasmissione di una nuova registrazione che riporti gli stessi anno e progressivo.
> È possibile anche indicare nella lista di valori **`RiferimentoOperazione`**, riferimenti a registrazioni annotate nel registro cartaceo non soggette quindi ad obbligo di trasmissione al RENTRI.


Per l'annullamento:

| Blocchi dati | Regole di validazione |
|-----------------------------------|------------------------------------------------------|
| <span style="color:blue">NumeroRegistrazioneAnnullata<span>| I valori di anno e progressivo (oppure, alternativamente, identificativo RENTRI) indicati devono fare riferimento ad una registrazione già trasmessa al RENTRI, non devono fare riferimento ad una registrazione di rettifica, di annullamento o ad una registrazione già annullata e devono sempre essere relativi a registrazioni presenti all'interno dello stesso registro. |

## 5. Firma del registro cronologico digitale

La firma digitale da apporre sul registro cronologico di carico e scarico rappresenta una firma tecnica di integrità, e pertanto è possibile anche apporre una firma digitale non necessariamente conforme allo standard XAdES,
ma anche solamente conforme allo standard XMLDSig (di cui lo standard XAdES è un'estensione, definita dall'Istituto Europeo per la Standardizzazione Tecnologica, ETSI).

Nell'apposizione della firma digitale XML sul registro cronologico per via programmatica occorrerà prestare attenzione a non alterare il contenuto del file XML già firmato (corrispondente al nodo con i dati di vidimazione 
e la relativa firma).
Si rimanda ai flussi operativi per un esempio su come operare all'apposizione della firma digitale XML di tipo "Enveloped" sul registro cronologico di carico e scarico in ambiente .NET.

> 💡 **SUGGERIMENTO**
> 
> Consultare la <a href="/docs?page=api-flussi-operativi-registri#7-creazione-e-firma-di-un-esportazione">pagina dedicata dei flussi operativi</a> 
per un esempio di firma del file di esportazione del registro cronologico digitale.


## 6. Validazione del registro cronologico digitale tramite API e servizi RENTRI

Il Registro cronologico digitale, essendo un file XML, è soggetto a validazione secondo lo schema XSD predisposto per il modello dati del registro.
Oltre alle regole di validazione XSD è fondamentale che il registro digitale rispetti altre regole di validazione che sono state definite per garantire l'integrità e la coerenza dei dati del registro.

Per effettuare la validazione tramite API utilizzare l'endpoint **<span style="color:#61affe">POST</span> `<ambiente>/dati-registri/v1.0/operatore/{identificativo_registro}/valida`**.
Questa funzionalità esegue la validazione strutturale del registro cronologico di carico e scarico digitale in formato XML secondo le specifiche tecniche.<br/>
In particolare acquisisce la richiesta e:
 - esegue la validazione XSD e tutte le validazioni applicate nella trasmissione delle registrazioni al RENTRI ad esclusione delle validazioni aggiuntive in fase di elaborazione elencate al paragrafo precedente;
 - esegue il test di corrispondenza tra la versione locale e i dati già trasmessi al RENTRI.

Successivamente fornisce in modo asincrono l'esito contenente alcune informazioni estrapolate dal file e la lista dei problemi di validazione identificati divisi in 2 livelli:
 - *"Errore"*: problemi di validazione;
 - *"Avvertimento"*: problemi di non corrispondenza dei dati con quelli già trasmessi al RENTRI.

 Questa funzionalità è disponibile anche tramite il servizio RENTRI on line alla pagina **"Dati trasmessi al RENTRI"** => **"Verifica registro informatico locale"**.

 
---

*Ultimo aggiornamento: 14/08/2025*