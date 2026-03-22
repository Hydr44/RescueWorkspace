# Formulari digitali

Nei paragrafi che seguono sono descritti i principali flussi operativi degli endpoint dei servizi RENTRI legati ai **Formulari digitali**.

La presente documentazione fa riferimento alle **API RENTRI v1.0**. Nelle URL degli endpoint di seguito indicate non viene specificato il server, in quanto dipende dall'ambiente su cui si sta operando. Gli indirizzi dei server per gli ambienti **DEMO** e **PRODUZIONE** sono:

```http
https://demoapi.rentri.gov.it/...
https://api.rentri.gov.it/...
```

Nei paragrafi seguenti è presente un glossario con un elenco dei termini comuni utilizzati nell'API e la descrizione dei principali flussi operativi con il dettaglio dei passaggi per il corretto utilizzo degli endpoint dei servizi RENTRI.

## 1. Compilazione formulario digitale

Le API per il supporto alla compilazione del FIR digitale sono uno strumento per la creazione e gestione assistita dei file xFIR.

### 1.1 Stati del FIR digitale

Il FIR digitale (xFIR) è un oggetto condiviso tra più soggetti che possono operare su di esso in funzione dello stato in cui si trova.

Il ciclo di vita del FIR digitale è sintetizzabile nelle seguenti fasi:
 - il produttore o il trasportatore iniziale creano il FIR e firmano entrambi i dati di partenza e i dati di trasporto iniziale
 - il trasportatore che ha in carico il rifiuto può inserire le informazioni previste dal modello (art.4 D.M. 59/2023) per poi firmarle
 - il destinatario può accettare o respingere (totalmente o parzialmente) il rifiuto, inserendo il dato con l'esito dell'accettazione e apponendovi la propria firma digitale
 - se il rifiuto viene respinto (o accettato solo parzialmente) il produttore (oppure il trasportatore su richiesta del produttore), può aggiungere e firmare i dati del nuovo destinatario, il quale potrà a sua volta accettare o respingere il rifiuto.
 
Gli stati in cui può trovarsi un FIR digitale sono definiti dall'enumerativo `StatoFormulario` e hanno il seguente significato:
- `InserimentoQuantita`: Il formulario è in attesa dei dati sulla quantità del rifiuto
- `InserimentoQuantitaTrasportoIniziale`: Il formulario è in attesa dei dati sulla quantità del rifiuto e dei dati del trasporto iniziale
- `InserimentoTrasportoIniziale`: Il formulario è in attesa dei dati del trasporto iniziale
- `FirmaProduttoreTrasportatoreIniziale`: Il formulario è in attesa della firma del produttore e del trasportatore iniziale
- `FirmaTrasportatoreIniziale`: Il formulario è in attesa della firma del trasportatore iniziale
- `FirmaProduttore`: Il formulario è in attesa della firma del produttore
- `InserimentoTrasportoSuccessivo`: Il formulario è in carico ad un traportatore e necessita dell'inserimento dei dati del trasporto successivo; il trasportatore che ha in carico il rifiuto può inserire informazioni aggiuntive (annotazioni, trasbordo parziale, sosta tecnica, trasbordo totale, allegati) che dovranno essere successivamente firmate
- `FirmaTrasportatoreSuccessivo`: Il formulario è in attesa della firma del trasportatore successivo al primo che ha in carico il rifiuto
- `FirmaAnnotazione`: Il formulario è in attesa della firma dell'annotazione da parte del soggetto che l'ha inserita
- `FirmaTrasbordoParziale`: Il formulario è in attesa della firma del trasportatore che effettua il trasbordo parziale del rifiuto
- `FirmaTrasbordoTotale`: Il formulario è in attesa della firma del trasportatore che prende in carico il rifiuto con l'operazione di trasbordo totale del rifiuto
- `FirmaSostaTecnica`: Il formulario è in attesa della firma del trasportatore che ha in carico il rifiuto e ha inserito i dati della sosta tecnica
- `InserimentoAccettazione`: Il formulario è in carico all'ultimo trasportatore ed è in attesa dell'inserimento dei dati di accettazione da parte del destinatario verso cui è destinato il rifiuto (a meno di ulteriori informazioni aggiuntive che l'ultimo trasportatore può inserire prima della consegna al destinatario)
- `FirmaAccettazione`: Il formulario è in attesa della firma del destinatario indicato nei dati di partenza,
- `Accettato`: Il formulario è stato accettato dal destinatario ed ha concluso il suo ciclo di vita
- `RespintoAccettatoParzialmente`: Il formulario è stato respinto o accettato parzialmente, il trasportatore che ha in carico il rifiuto può inserire (in accordo con il produttore) i dati di un nuovo destinatario
- `FirmaDestinatarioSuccessivo`: Il formulario è in attesa della firma dei dati del nuovo destinatario inseriti da parte del trasportatore che ha in carico il rifiuto
- `FirmaAccettazioneSuccessiva`: Il formulario è in attesa della firma del destinatario successivo a quello indicato nei dati di partenza che ha rifiutato totalmente o parzialmente il rifiuto
- `FirmaAnnullamento`: Il formulario è in attesa della firma dei dati di annullamento inseriti dal soggetto titolare della vidimazione del numero FIR
- `Annullato`: Il formulario risulta essere stato annullato

Gli endpoint per il supporto alla compilazione del FIR digitale assicurano che il formulario sia sempre in uno stato coerente: ogni operazione che si effettua su di un FIR digitale 
attraverso le API viene validata per verificare che l'operazione sia eseguita da un soggetto con l'abilitazione per eseguirla e che sia in uno stato che consenta di poterla eseguire.

<a name="Diagramma"></a>
Il diagramma di flusso tra gli stati possibili di un FIR digitale è il seguente:

![Diagramma](/docs/assets/20250728_Rentri_Stati-xFIR.svg "Diagramma a stati del FIR digitale")

<a name="creazione-di-un-fir-digitale"></a>
### 1.2 Creazione di un FIR digitale

Per creare un FIR digitale, utilizzare l'endpoint **<span style="color:#61affe">POST</span> `<ambiente>/formulari/v1.0/`**.

In query string è possibile specificare il parametro opzionale **`{codice_blocco}`** che è il codice del blocco in cui creare il FIR digitale (pattern di esempio: `^[BCDFGHJKLMNPQRSTVWXYZ]{4,6}$`), se non specificato RENTRI crea il FIR nel primo codice blocco disponibile. Se presente il numero del FIR nel payload della request, il codice blocco passato in query string viene ignorato.

Per recuperare i blocchi FIR è possibile utilizzare i passaggi indicati nel paragrafo [Recupero dei blocchi FIR](javascript:loadPage('api-flussi-operativi-formulari#1-1-recupero-dei-blocchi-fir')).

> 💡 **SUGGERIMENTO**
> 
> Consultare la documentazione di riferimento delle [API - formulari](javascript:loadApi('formulari')) per il dettaglio completo dei modelli dell'endpoint e degli eventuali parametri opzionali.

Questo paragrafo descrive i passaggi necessari per creare e lavorare con i FIR digitali.

#### 1.2.1 Autenticazione

L'endpoint utilizzato richiede l'autenticazione, quindi è necessario seguire i passaggi indicati nel paragrafo [Autenticazione](javascript:loadPage('api-flussi-operativi-introduzione#autenticazione')).

#### 1.2.2 Invio dei dati per la creazione del FIR

Il seguente esempio di codice C# mostra come inviare i dati per creare un FIR digitale:

```csharp
using Newtonsoft.Json;
using System.Net.Http;

string basePath = "https://<ambiente>/formulari/v1.0";
string codiceBlocco = "XXXX";

var client = new HttpClient();
// TODO: Inizializzare il client HTTP con gli header previsti per il tipo di richiesta (vedi pattern AgID ID_AUTH_REST_02)

// Creazione del payload con il FIR da creare
var formulario = new {
	NumIscrSito = "OP123XXXXXXXX00-PD00001"
	DatiPartenza = new {
		Produttore = new {
			NumIscrSito = "OP123XXXXXXXX00-PD00001",
			LuogoProduzione = new {
				Indirizzo = "VIA XYZ",
				Civico = "1",
				Citta = new {
					ComuneId = "XXXXXX",
				},
			},
		},
		Destinatario = new {
			CodiceFiscale = "12345678901",
			Denominazione = "Denominazione destinatario",
			Indirizzo = new {
				Indirizzo = "VIA XYZ",
				Civico = "1",
				Citta = new {
					ComuneId = "XXXXXX",
				}
			},
			Autorizzazione = new {
				numero = "XXX",
				tipo = "TrattamentoAcqueReflue",
			},
			Attivita = "R4",
		},
		Trasportatori = new object[] {
			new {
				CodiceFiscale = "12345678901",
				Denominazione = "Denominazione trasportatore",
				NumeroIscrizioneAlbo = "XX/123456",
				TipoTrasporto = "Terrestre",
			}
		},
		Intermediari = new[] {
			new {
					CodiceFiscale = "12345678901",
					Denominazione = "Denominazione intermediario",
					NumeroIscrizioneAlbo = "XX/123456",
			},
		},
		Rifiuto = new {
			CodiceEer = "010304",
			Provenienza = "S",
			ClassiPericolo = new[] { "HP01", },
			StatoFisico = "VS",
			VerificatoInPartenza = false,
			Quantita = new {
				UnitaMisura = "kg",
				Valore = 800,
			},
		},
	},
	DatiTrasportoPartenza = new {
		Conducente = new {
			Nome = "Mario",
			Cognome = "Rossi",
		},
		TargaAutomezzo = "AB123CD",
		TargaRimorchio = "EF456GH",
		DataOraInizioTrasporto = DateTime.UtcNow,
		Annotazioni = "Note su questo primo traporto",
	}
};
var content = new StringContent(JsonConvert.SerializeObject(formulario), System.Text.Encoding.UTF8, "application/json");
// TODO: Firmare il contenuto (vedi pattern AgID INTEGRITY_REST_01)

// Invio della richiesta HTTP
var response = await client.PostAsync($"{basePath}/?codice_blocco={codiceBlocco}", content);
if (response.IsSuccessStatusCode)
{
	string result = await response.Content.ReadAsStringAsync();
	var transazione = JsonConvert.DeserializeObject<TransazioneModel>(result);
	Guid transazioneId = transazione.TransazioneId;
}
```


#### 1.2.3 Recupero dell'esito della transazione asincrona

L'endpoint per la creazione di un FIR digitale è di tipo **asincrono** e restituisce come risposta il valore `transazione_id`, ovvero un GUID che identifica la transazione di elaborazione assegnata alla richiesta.
Per ottenere l'esito dell'elaborazione, seguire i passaggi indicati nel paragrafo [Recupero dell'esito di una transazione asincrona](javascript:loadPage('api-flussi-operativi-introduzione#recupero-dell-esito-di-una-transazione-asincrona')).

Nel modello restituito con l'esito della transazione asincrona sarà presente il campo **`numero_fir`** che, nel caso sia stata richiesta la vidimazione di un nuovo numero FIR specificando in query string il **codice_blocco**, 
conterrà appunto il codice identificativo del FIR digitale, mentre sarà valorizzato con lo stesso **`numero_fir`** specificato nel modello di input altrimenti.

### 1.3 Modifica di un FIR digitale

I dati di partenza e di inizio trasporto di un FIR digitale possono sempre essere modificati tramite le API prima che venga acquisita la prima firma (da parte del produttore e/o del primo trasportatore).

Per modificare un FIR digitale non ancora firmato, utilizzare l'endpoint **<span style="color:#fca130">PUT</span> `<ambiente>/formulari/v1.0/{numero_fir}`**.

Il parametro **`numero_fir`** è il numero del FIR digitale che si intende modificare.
Il modello dati ed il processo di invio e recupero dell'esito dell'operazione sono gli stessi utilizzati per la creazione del FIR digitale.
(vedi paragrafo [Creazione di un FIR digitale](javascript:loadPage('api-flussi-operativi-formulari-digitali#1-2-creazione-di-un-fir-digitale')))

#### 1.3.1 Inserimento o modifica della quantità di rifiuto

Per inserire o modificare il dato della sola quantità di rifiuto di un FIR digitale senza utilizzare l'endpoint di modifica di tutti i dati del FIR digitale è possibile utilizzare 
l'endpoint **<span style="color:#61affe">POST</span> `<ambiente>/formulari/v1.0/{numero_fir}/quantita`**.

> 💡 **SUGGERIMENTO**
> 
> Consultare la documentazione di riferimento delle [API - formulari](javascript:loadApi('formulari')) per il dettaglio completo dei modelli dell'endpoint


#### 1.3.2 Inserimento o modifica dei dati di trasporto iniziale	

Per inserire o modificare solamente i dati del trasporto iniziale di un FIR digitale senza utilizzare l'endpoint di modifica di tutti i dati del FIR digitale è possibile utilizzare 
l'endpoint **<span style="color:#61affe">POST</span> `<ambiente>/formulari/v1.0/{numero_fir}/trasporto`**.

> 💡 **SUGGERIMENTO**
> 
> Consultare la documentazione di riferimento delle [API - formulari](javascript:loadApi('formulari')) per il dettaglio completo dei modelli dell'endpoint


### 1.4 Elenco FIR digitali

Per recuperare i FIR digitali disponibili per una specifica unità locale utilizzare l'endpoint **<span style="color:#49cc90">GET</span> `<ambiente>/formulari/v1.0`**.

I FIR digitali disponibili per l'unità locale sono quelli creati dal soggetto che effettua la richiesta nel contesto dell'unità locale indicata in fase di creazione, 
e quelli per i quali il soggetto ha acquisito la visibilità per la stessa unità locale (vedi paragrafo [Acquisizione della visibilità di un FIR digitale](javascript:loadPage('api-flussi-operativi-formulari-digitali#1-4-3-acquisizione-della-visibilit-di-un-fir-digitale')))

È necessario specificare in query string il numero di iscrizione unità locale (ad esempio: `OP123XXXXXXXX00-PD00001`) per il quale si intendono recuperare i FIR digitali disponibili, utilizzando il parametro obbligatorio **`num_iscr_sito`**.

L'endpoint utilizza la paginazione per la restituzione dei risultati. È quindi possibile specificare i seguenti parametri opzionali negli header della richiesta:
- **`Paging-Page`** è il numero di pagina (default e min: 1).
- **`Paging-PageSize`** è la dimensione della singola pagina (default e max: 100).
È possibile specificare degli ulteriori parametri in query string per restringere la ricerca.

> 💡 **SUGGERIMENTO**
> 
> Consultare la documentazione di riferimento delle [API - formulari](javascript:loadApi('formulari')) per il dettaglio completo dei modelli dell'endpoint e degli eventuali parametri opzionali.

> ⚠️ **ATTENZIONE**
> 
> I soggetti che non hanno creato il FIR digitale devono acquisirne la visibilità per poterlo vedere nell'elenco dei FIR digitali.

Questo paragrafo descrive i passaggi necessari per recuperare l'elenco dei FIR digitali disponibili per una specifica unità locale.

#### 1.4.1 Autenticazione

L'endpoint utilizzato richiede l'autenticazione, quindi è necessario seguire i passaggi indicati nel paragrafo [Autenticazione](javascript:loadPage('api-flussi-operativi-introduzione#autenticazione')).

#### 1.4.2 Ricezione dei dati

Il seguente esempio di codice C# mostra come recuperare i FIR digitali:

```csharp
using Newtonsoft.Json;
using System.Net.Http;

string basePath = "https://<ambiente>/formulari/v1.0";
string numIscrSito = "OP123XXXXXXXX00-PD00001";

var client = new HttpClient();
// TODO: Inizializzare il client HTTP con gli header previsti per il tipo di richiesta (vedi pattern AgID ID_AUTH_REST_02)

// Invio della richiesta HTTP
var response = await client.GetAsync($"{basePath}?num_iscr_sito={numIscrSito}");
if (response.IsSuccessStatusCode)
{
	string result = await response.Content.ReadAsStringAsync();
	var elenco = JsonConvert.DeserializeObject<FormularioItemResult[]>(result);
}
```

#### 1.4.3 Acquisizione della visibilità di un FIR digitale

I formulari creati da un soggetto nel contesto di una unità locale vengono sempre restituiti dall'endpoint per ottenere l'elenco dei FIR digitali disponibili.
I soggetti terzi identificati tramite codice fiscale in un FIR digitale possono acquisirne la visibilità relativamente ad una specifica unità locale affinché il FIR venga restituito dall'endpoint per ottenere l'elenco dei FIR digitali disponibili.

Il seguente esempio di codice C# mostra come acquisire la visibilità di un FIR digitale per una specifica unità locale:

```csharp
using Newtonsoft.Json;
using System.Net;
using System.Net.Http;

string basePath = "https://<ambiente>/formulari/v1.0";
string numeroFir = "XXXX";
string numIscrSito = "OP123XXXXXXXX00-PD00001";

var client = new HttpClient();
// TODO: Inizializzare il client HTTP con gli header previsti per il tipo di richiesta (vedi pattern AgID ID_AUTH_REST_02)

// Invio della richiesta HTTP
var response = await client.PostAsync($"{basePath}/{numeroFir}/acquisizione-visibilita/{numIscrSito}", null, cancellationToken);
if (response.IsSuccessStatusCode)
{
	//visibilità acquisita
}
```

#### 1.4.4 Rilascio della visibilità di un FIR digitale

Il seguente esempio di codice C# mostra come abbandonare la visibilità di un FIR digitale (acquisita con l'operazione precedente) per una specifica unità locale:

```csharp
using Newtonsoft.Json;
using System.Net;
using System.Net.Http;

string basePath = "https://<ambiente>/formulari/v1.0";
string numeroFir = "XXXX";
string numIscrSito = "OP123XXXXXXXX00-PD00001";

var client = new HttpClient();
// TODO: Inizializzare il client HTTP con gli header previsti per il tipo di richiesta (vedi pattern AgID ID_AUTH_REST_02)

// Invio della richiesta HTTP
var response = await client.PostAsync($"{basePath}/{numeroFir}/rilascio-visibilita/{numIscrSito}", null, cancellationToken);
if (response.IsSuccessStatusCode)
{
	//visibilità abbandonata
}
```


### 1.5 Firma di un FIR digitale

La firma di un FIR digitale, come indicato nel [Diagramma a stati](#Diagramma), è necessaria quando il FIR digitale si trova in uno degli stati con prefisso "*Firma*", 
cioè successivamente alla creazione (quando anche i dati del primo trasporto sono stati inseriti), e successivamente ad ogni inserimento di dati aggiuntivi tra quelli previsti.

L'apposizione della firma in un FIR digitale avviene attraverso le API per il supporto alla compilazione, e si articola in due fasi:
- recupero del codice hash SHA-256 da firmare, con l'endpoint **<span style="color:#61affe">POST</span> `<ambiente>/formulari/v1.0/{numero_fir}/hash`**
- invio dell'array di byte che costituiscono la firma, calcolata sul codice hash SHA-256 recuperato precedentemente, con l'endpoint **<span style="color:#61affe">POST</span> `<ambiente>/formulari/v1.0/{numero_fir}/acquisizione-firma`**

> ⚠️ **ATTENZIONE**
> 
> Gli endpoint sopraindicati per l'apposizione della firma, disponibili tra le API *formulari*, <ins>NON</ins> servono per il calcolo della *firma crittografica*, ma solo per la fase iniziale e per la fase finale del processo
di creazione del *file di firma digitale XAdES* che verrà inserito nel FIR digitale a seguito dell'operazione di firma, in modo da supportare qualsiasi sistema di firma crittografica, riconosciuta come valida, 
che sia nella disponibilità del soggetto firmatario. Se si sceglie l'utilizzo della firma remota RENTRI è possibile fare riferimento alla guida su [Autorizzazione credenziali, 2fa e firma remota](javascript:loadPage('api-flussi-operativi-mobile#4-autorizzazione-credenziali-2fa-e-firma-remota')).

Il certificato di firma deve essere rilasciato da una CA (Certificate Authority) accreditata <a href="https://www.agid.gov.it/it/piattaforme/firma-elettronica-qualificata/certificati" target="_blank">AgID</a>.
Sono ritenuti validi sia il sigillo di firma qualificata per persone giuridiche, sia le firme apposte con certificato di firma qualificata o con certificato di autenticazione CNS (Carta Nazionale dei Servizi) per le persone fisiche.

In alternativa è possibile utilizzare il certificato di **firma remota** RENTRI ottenibile nella sezione _Interoperabilità_ del portale RENTRI.

> ⚠️ **ATTENZIONE**
> 
> Il certificato di *interoperabilità* RENTRI, rilasciato nel file `p12` attraverso la sezione _Interoperabilità_ del portale RENTRI, <ins>NON</ins> è un certificato di firma riconosciuto come valido per le firme sui FIR digitali.


#### 1.5.1 Autenticazione

L'endpoint utilizzato richiede l'autenticazione, quindi è necessario seguire i passaggi indicati nel paragrafo [Autenticazione](javascript:loadPage('api-flussi-operativi-introduzione#autenticazione')).

#### 1.5.2 Recupero del codice hash da firmare
Il seguente esempio di codice C# mostra come recuperare l'array di byte che costituisce il codice hash da firmare per un FIR digitale in attesa di firma:

```csharp
using Newtonsoft.Json;
using System.Net.Http;

string basePath = "https://<ambiente>/formulari/v1.0";
string numeroFir = "XXXX";
string x509Cert = "XXXX";

var client = new HttpClient();
// TODO: Inizializzare il client HTTP con gli header previsti per il tipo di richiesta (vedi pattern AgID ID_AUTH_REST_02)

// Creazione del payload con il certificato di firma
var datiPerFirma = new {
	certificato = x509Cert,
};
var content = new StringContent(datiPerFirma, System.Text.Encoding.UTF8, "application/json");
// TODO: Firmare il contenuto (vedi pattern AgID INTEGRITY_REST_01)

// Invio della richiesta HTTP
var response = await client.PostAsync($"{basePath}/{numeroFir}/hash", content, cancellationToken);
if (response.IsSuccessStatusCode)
{
	string result = await response.Content.ReadAsStringAsync();
	var transazione = JsonConvert.DeserializeObject<TransazioneModel>(result);
	Guid transazioneId = transazione.TransazioneId;
}
```


#### 1.5.3 Recupero dell'esito della transazione asincrona

L'endpoint per il recupero del codice hash da firmare è di tipo **asincrono** e restituisce come risposta il valore `transazione_id`, ovvero un GUID che identifica la transazione di elaborazione assegnata alla richiesta.
Per ottenere l'esito dell'elaborazione, seguire i passaggi indicati nel paragrafo [Recupero dell'esito di una transazione asincrona](javascript:loadPage('api-flussi-operativi-introduzione#recupero-dell-esito-di-una-transazione-asincrona')).

Nel modello restituito con l'esito della transazione asincrona saranno presenti i seguenti campi:
- **`hash_algorithm`**: valorizzato sempre con "_SHA256_", identificativo dell'algoritmo di hashing utilizzato nelle firme digitali del FIR digitale;
- **`token`**: struttura dati _opaca_ da restituire nella chiamata successiva del ciclo di firma per collegare le due operazioni;
- **`digest_to_sign`**: array di byte (restituito in una stringa che ne rappresenta la **codifica in base64**) che rappresenta il codice hash SHA256 che sarà necessario firmare. 


#### 1.5.4 Acquisizione della firma di un FIR digitale

Per completare il ciclo di firma sarà necessario ottenere la firma crittografica calcolata sul codice hash **`digest_to_sign`**, prodotta mediante operazione di firma 
eseguita con dispositivo fisico locale o con sistema di firma remoto, purché il certificato sia tra quelli riconosciuti [definiti precedentemente](#1-5-firma-di-un-fir-digitale).


Il seguente esempio di codice C# mostra come inviare la firma calcolata sul codice hash recuperato precedentemente per un FIR digitale in attesa di firma:

```csharp
using Newtonsoft.Json;
using System.Net;
using System.Net.Http;

string basePath = "https://<ambiente>/formulari/v1.0";
string numeroFir = "XXXX";
string identificativo_utente = "XXXX"; // identificativo assegnato dal sistema interno del chiamante
string certificato = "XXXX"; // deve essere lo stesso che è stato utilizzato per recuperare il codice hash 

// "esitoHash" è l'oggetto che viene restituito dalla chiamata di esito visto nel capitolo "9.4.5 Recupero dell'esito dell'elaborazione"
// Il parametro "token" è un codice di stato che lega l'operazione di restituzione del codice hash a quella di acquisizione della firma
var token = esitoHash!["token"]!.ToString();
string firma = "XXX"; // array di byte della firma crittografica codificata in base64

var client = new HttpClient();
// TODO: Inizializzare il client HTTP con gli header previsti per il tipo di richiesta (vedi pattern AgID ID_AUTH_REST_02)

// Creazione del payload
var firmaModel = new {
	firma,
	token,
	certificato,
	identificativo_utente,
};
var content = new StringContent(firmaModel, System.Text.Encoding.UTF8, "application/json");
// TODO: Firmare il contenuto (vedi pattern AgID INTEGRITY_REST_01)

// Invio della richiesta HTTP
var response = await client.PostAsync($"{basePath}/{numeroFir}/acquisizione-firma", content, cancellationToken);
if (response.IsSuccessStatusCode)
{
	string result = await response.Content.ReadAsStringAsync();
	var transazione = JsonConvert.DeserializeObject<TransazioneModel>(result);
	Guid transazioneId = transazione.TransazioneId;
}
```

L'endpoint di acquisizione della firma si occuperà di creare la struttura dati necessaria secondo le specifiche XAdES, affinché le firme apposte sul FIR digitale possano essere validate 
con gli strumenti di verifica che implementano le specifiche previste dalla normativa _eIDAS_.


#### 1.5.5 Recupero dell'esito della transazione asincrona

L'endpoint per l'acquisizione della firma di un FIR digitale è di tipo **asincrono** e restituisce come risposta il valore `transazione_id`, ovvero un GUID che identifica la transazione di elaborazione assegnata alla richiesta.
Per ottenere l'esito dell'elaborazione, seguire i passaggi indicati nel paragrafo [Recupero dell'esito di una transazione asincrona](javascript:loadPage('api-flussi-operativi-introduzione#recupero-dell-esito-di-una-transazione-asincrona')).


#### 1.5.6 Rollback dell'ultima firma acquisita

L'operazione di apposizione delle firme digitali in un FIR è reversibile con l'endpoint **<span style="color:#61affe">POST</span> `<ambiente>/formulari/v1.0/{numero_fir}/rollback-firma`** solo alle condizioni elencate nella documentazione dell'endpoint stesso.

> 💡 **SUGGERIMENTO**
> 
> Consultare la documentazione di riferimento delle [API - formulari](javascript:loadApi('formulari')) per il dettaglio completo dei modelli dell'endpoint e degli eventuali parametri opzionali.

Il seguente esempio di codice C# mostra come eliminare una firma apposta per creare un FIR digitale:

```csharp
using Newtonsoft.Json;
using System.Net.Http;

string basePath = "https://<ambiente>/formulari/v1.0";
string numeroFir = "XXXXX";

var client = new HttpClient();
// TODO: Inizializzare il client HTTP con gli header previsti per il tipo di richiesta (vedi pattern AgID ID_AUTH_REST_02)

// Invio della richiesta HTTP
var response = await client.PostAsync($"{numeroFir}/rollback-firma", null, cancellationToken);
if (response.IsSuccessStatusCode)
{
	string result = await response.Content.ReadAsStringAsync();
	var transazione = JsonConvert.DeserializeObject<TransazioneModel>(result);
	Guid transazioneId = transazione.TransazioneId;
}
```

#### 1.5.7 Recupero dell'esito della transazione asincrona

L'endpoint per l'eliminazione dell'ultima firma digitale acquisita è di tipo **asincrono** e restituisce come risposta il valore `transazione_id`, ovvero un GUID che identifica la transazione di elaborazione assegnata alla richiesta.
Per ottenere l'esito dell'elaborazione, seguire i passaggi indicati nel paragrafo [Recupero dell'esito di una transazione asincrona](javascript:loadPage('api-flussi-operativi-introduzione#recupero-dell-esito-di-una-transazione-asincrona')).


### 1.6 Elenco delle azioni disponibili su un FIR digitale

Questo flusso operativo descrive come estrarre le azioni disponibili che si possono eseguire su un FIR digitale.
Nel path occorre specificare il parametro obbligatorio **`{numero_fir}`** che è il numero del FIR digitale su cui ci interessa sapere le azioni disponibili.
In query string è necessario specificare il parametro **`{identificativo_soggetto}`** che è il codice fiscale del soggetto per il quale si richiedono le azioni possibili sul FIR digitale.
Se in query string si indica anche il parametro opzionale **`{num_iscr_sito}`** (che deve coincidere con il numero iscrizione di una unità locale dell'operatore identificato da **`{identificativo_soggetto}`**)
l'invocazione dell'endpoint ha come effetto anche l'acquisizione della visibilità del FIR digitale per l'unità locale indicata, come avviene in modo esplicito con l'apposito endpoint 
(vedi [Acquisizione della visibilità di un FIR digitale](javascript:loadPage('api-flussi-operativi-formulari-digitali#1-4-3-acquisizione-della-visibilit-di-un-fir-digitale')))

> 💡 **SUGGERIMENTO**
> 
> Consultare la documentazione di riferimento delle [API - formulari](javascript:loadApi('formulari')) per il dettaglio completo dei modelli dell'endpoint e degli eventuali parametri opzionali.

#### 1.6.1 Autenticazione

L'endpoint utilizzato richiede l'autenticazione, quindi è necessario seguire i passaggi indicati nel paragrafo [Autenticazione](javascript:loadPage('api-flussi-operativi-introduzione#autenticazione')).

#### 1.6.2 Estrazione azioni disponibili

Il seguente esempio di codice C# mostra come ottenere la lista delle azioni disponibili per un FIR digitale:

```csharp
using Newtonsoft.Json;
using System.Net.Http;

string basePath = "https://<ambiente>/formulari/v1.0";
string numeroFir = "XXXXX";

var client = new HttpClient();
// TODO: Inizializzare il client HTTP con gli header previsti per il tipo di richiesta (vedi pattern AgID ID_AUTH_REST_02)

// Invio della richiesta HTTP
var response = await client.GetAsync($"{numeroFir}/azioni");
if (response.IsSuccessStatusCode)
{
	string result = await response.Content.ReadAsStringAsync();
	var elencoAzioni = JsonConvert.DeserializeObject<AzioniResult>(result);
}
```



### 1.7 Annullamento di un FIR digitale

Questo flusso operativo descrive l'operazione di annullamento di uno specifico FIR digitale.
Nel path occorre specificare il parametro obbligatorio **`{numero_fir}`** che è il numero del FIR digitale da annullare.

> ⚠️ **ATTENZIONE**
> 
> L'operazione di annullamento del FIR digitale provvede ad annullare **anche la vidimazione del numero FIR corrispondente**, e pertanto può essere richiesta solo dal soggetto (produttore o trasportatore) a cui è stato vidimato il numero FIR.
> L'annullamento attraverso questo endpoint è possibile solo se nel file xFIR non è ancora presente alcuna firma digitale, oppure se è presente solo la firma del soggetto a cui è stato vidimato il numero FIR.
> Esistono ulteriori condizioni che devono essere soddisfatte per portare a terminre l'operazione di annullamento, che tengono in considerazione le possibili attività di chiusura del ciclo di vita del FIR, consultare la documentazione di riferimento delle [API - formulari](javascript:loadApi('formulari')) per il dettaglio completo delle condizioni di annullamento.

#### 1.7.1 Autenticazione

L'endpoint utilizzato richiede l'autenticazione, quindi è necessario seguire i passaggi indicati nel paragrafo [Autenticazione](javascript:loadPage('api-flussi-operativi-introduzione#autenticazione')).

#### 1.7.2 Annullamento del FIR

Il seguente esempio di codice C# mostra come annullare un FIR digitale:

```csharp
using Newtonsoft.Json;
using System.Net.Http;

string basePath = "https://<ambiente>/formulari/v1.0";
string numeroFir = "XXXXX";

var client = new HttpClient();
// TODO: Inizializzare il client HTTP con gli header previsti per il tipo di richiesta (vedi pattern AgID ID_AUTH_REST_02)

// Invio della richiesta HTTP
var response = await client.PostAsync($"{numeroFir}/annulla-fir", null, cancellationToken);
if (response.IsSuccessStatusCode)
{
	string result = await response.Content.ReadAsStringAsync();
	var transazione = JsonConvert.DeserializeObject<TransazioneModel>(result);
	Guid transazioneId = transazione.TransazioneId;
}
```

#### 1.7.3 Recupero dell'esito della transazione asincrona

L'endpoint per l'annullamento di un FIR digitale è di tipo **asincrono** e restituisce come risposta il valore `transazione_id`, ovvero un GUID che identifica la transazione di elaborazione assegnata alla richiesta.
Per ottenere l'esito dell'elaborazione, seguire i passaggi indicati nel paragrafo [Recupero dell'esito di una transazione asincrona](javascript:loadPage('api-flussi-operativi-introduzione#recupero-dell-esito-di-una-transazione-asincrona')).

A seguito dell'invocazione dell'endpoint **<span style="color:#61affe">POST</span> `<ambiente>/formulari/v1.0/{numero_fir}/annulla-fir`** il FIR digitale viene portato nello stato "**Annullato**" e, contestualmente, la vidimazione associata al FIR è anch'essa annullata.


#### 1.7.4 Aggiunta note di annullamento

Sul FIR digitale in stato annullato non sono previste ulteriori operazioni, salvo l'aggiunta di eventuali note di annullamento che andranno anch'esse firmate.

Il seguente esempio di codice C# mostra come aggiungere note di annullamento al FIR digitale:

```csharp
using Newtonsoft.Json;
using System.Net.Http;

string basePath = "https://<ambiente>/formulari/v1.0";
string numeroFir = "XXXXX";

var client = new HttpClient();
// TODO: Inizializzare il client HTTP con gli header previsti per il tipo di richiesta (vedi pattern AgID ID_AUTH_REST_02)

// Creazione del payload
var datiAnnullamento = new {
  note = "nota per l'annullamento",
};

var content = new StringContent(datiAnnullamento, System.Text.Encoding.UTF8, "application/json");
// TODO: Firmare il contenuto (vedi pattern AgID INTEGRITY_REST_01)

// Invio della richiesta HTTP
var response = await client.PostAsync($"{numeroFir}/note-annullamento", content, cancellationToken);
if (response.IsSuccessStatusCode)
{
	string result = await response.Content.ReadAsStringAsync();
	var transazione = JsonConvert.DeserializeObject<TransazioneModel>(result);
	Guid transazioneId = transazione.TransazioneId;
}
```

#### 1.7.5 Recupero dell'esito della transazione asincrona

L'endpoint per l'aggiunta delle note di annullamento di un FIR digitale è di tipo **asincrono** e restituisce come risposta il valore `transazione_id`, ovvero un GUID che identifica la transazione di elaborazione assegnata alla richiesta. 
Per ottenere l'esito dell'elaborazione, seguire i passaggi indicati nel paragrafo [Recupero dell'esito di una transazione asincrona](javascript:loadPage('api-flussi-operativi-introduzione#recupero-dell-esito-di-una-transazione-asincrona')).


#### 1.7.6 Acquisizione della firma per le note di annullamento

Le note di annullamente fanno parte dell'insieme di informazioni per cui è prevista l'apposizione della firma digitale, per cui è necessario eseguire le operazioni riportate al punto 
[Firma di un FIR digitale](#1-5-firma-di-un-fir-digitale).

<a name="inserimento-di-un-trasbordo-parziale"></a>
### 1.8 Inserimento di un trasbordo parziale

Questo flusso operativo descrive l'operazione di trasbordo parziale del carico del rifiuto da parte di un trasportatore. Come previsto dalle istruzioni di compilazione di cui all’art.5 del D.M. n.59 del 2023, per il nuovo trasporto deve essere emesso un nuovo FIR relativo al quantitativo di rifiuti trasbordato sul nuovo mezzo di trasporto, indicando nel formulario originario il trasportatore che prende parzialmente in carico il rifiuto,il numero del nuovo formulario e la quantità residua.
L'operazione viene effettuata attraverso l'endpoint **<span style="color:#61affe">POST</span> `<ambiente>/formulari/v1.0/{numero_fir}/trasbordo-parziale`** e può essere effettuata soltanto quando il carico risulta essere in viaggio, cioè negli stati in cui può trovarsi il formulario dopo la partenza e prima dell'accettazione del destinatario.
Nel caso si renda necessario procedere al trasbordo parziale con trasferimento del carico su più veicoli sarà necessario aggiungere le informazioni di trasbordo parziale con 
ulteriori invocazioni dello stesso endpoint.

> 💡 **SUGGERIMENTO**
> 
> Consultare la documentazione di riferimento delle [API - formulari](javascript:loadApi('formulari')) per il dettaglio completo dei modelli dell'endpoint e degli eventuali parametri opzionali.

#### 1.8.1 Autenticazione

L'endpoint utilizzato richiede l'autenticazione, quindi è necessario seguire i passaggi indicati nel paragrafo [Autenticazione](javascript:loadPage('api-flussi-operativi-introduzione#autenticazione')).

#### 1.8.2 Aggiunta dei dati di trasbordo parziale

Il seguente esempio di codice C# mostra come inviare i dati relativi ad un trasbordo parziale:

```csharp
using Newtonsoft.Json;
using System.Net;
using System.Net.Http;

string basePath = "https://<ambiente>/formulari/v1.0";
string numeroFir = "XXXXX 000123 XX"; // numero FIR da cui avviene il trasbordo
string nuovoNumeroFir = "YYYYY 000456 YY"; // numero FIR del nuovo formulario creato per la presa in carico del rifiuto trasbordato

var client = new HttpClient();
// TODO: Inizializzare il client HTTP con gli header previsti per il tipo di richiesta (vedi pattern AgID ID_AUTH_REST_02)

// Creazione del payload
var trasbordoParziale = new {
	NumeroFir = nuovoNumeroFir,
	Trasportatore = new {
		CodiceFiscale = "12345678901",
		Denominazione = "Denominazione trasportatore",
		NumeroIscrizioneAlbo = "XX/123456",
	},
	QuantitaResidua = new {
		UnitaMisura = "kg",
		Valore = 12.34,
	},
	Causale = "causale trabordo parziale"
};

var content = new StringContent(trasbordoParziale, System.Text.Encoding.UTF8, "application/json");
// TODO: Firmare il contenuto (vedi pattern AgID INTEGRITY_REST_01)

// Invio della richiesta HTTP
var response = await client.PostAsync($"{basePath}/{numeroFir}/trasbordo-parziale", content, cancellationToken);
if (response.IsSuccessStatusCode)
{
	string result = await response.Content.ReadAsStringAsync();
	var transazione = JsonConvert.DeserializeObject<TransazioneModel>(result);
	Guid transazioneId = transazione.TransazioneId;
}
```

#### 1.8.3 Recupero dell'esito della transazione asincrona

L'endpoint per l'invio dei dati di trasbordo parziale di un FIR digitale è di tipo **asincrono** e restituisce come risposta il valore `transazione_id`, ovvero un GUID che identifica la transazione di elaborazione assegnata alla richiesta.
Per ottenere l'esito dell'elaborazione, seguire i passaggi indicati nel paragrafo [Recupero dell'esito di una transazione asincrona](javascript:loadPage('api-flussi-operativi-introduzione#recupero-dell-esito-di-una-transazione-asincrona')).


#### 1.8.4 Acquisizione della firma del trasportatore

Il processo di inserimento delle informazioni di trasbordo parziale si deve concludere con la firma del trasportatore a cui era in carico il rifiuto prima dell'operazione di trasbordo, eseguendo le operazioni riportate al punto [Firma di un FIR digitale](#1-5-firma-di-un-fir-digitale).

Il trasportatore indicato con i dati di trasbordo parziale non interviene come parte attiva del formulario originario e, se è un soggetto diverso da quelli già presenti in esso, non può acquisirne visibilità.

Il nuovo formulario che trae origine da un'operazione di trasbordo parziale, il cui numero FIR viene inserito nel formulario che effettua il trasbordo, dovrà essere creato necessariamente dal trasportatore che prende in carico il rifiuto parzialmente trasbordato, indicando il produttore originario nella proprietà **`trasbordo_parziale_origine`** prevista nel modello dell'[endpoint di creazione](javascript:loadApi('formulari')), senza valorizzare la proprietà **`produttore`**. 

<a name="inserimento-di-un-trasbordo-totale"></a>
### 1.9 Inserimento di un trasbordo totale

Questo flusso operativo descrive l'operazione di trasbordo totale del carico del rifiuto da parte di un trasportatore.
L'operazione di trasbordo totale può comportare l'aggiunta di un nuovo soggetto trasportatore tra quelli inizialmente previsti nella fase di partenza. 
Se il soggetto trasportatore che prende in carico il rifiuto coincide con quello che effettua il trasbordo totale, i dati del nuovo soggetto trasportatore devono comunque essere indicati nella struttura dati del modello.
Nel trasbordo totale, l'aggiunta dei dati del trasportatore e dei dati della presa in carico del rifiuto viene eseguita contestualmente con un'unica operazione da parte del trasportatore che aveva in carico il rifiuto originariamente. Se il nuovo soggetto trasportatore è diverso da quello originario, dopo l'aggiunta dei suoi dati anagrafici il nuovo trasportatore diventa un soggetto della filiera e può operare su di esso, e quindi può eventualmente associare il FIR all'unità locale iscritta attraverso l'endpoint **<span style="color:#19abff">POST</span> `<ambiente>/formulari/v1.0/{numero_fir}/acquisizione-visibilita/{num_iscr_sito}`** e procedere quindi con la firma della presa in carico.

È supportata un'unica operazione di trasbordo totale, e solamente per trasbordi terrestri.

#### 1.9.1 Autenticazione

L'endpoint utilizzato richiede l'autenticazione, quindi è necessario seguire i passaggi indicati nel paragrafo [Autenticazione](javascript:loadPage('api-flussi-operativi-introduzione#autenticazione')).

#### 1.9.2 Aggiunta dei dati di trasbordo totale

Il seguente esempio di codice C# mostra come aggiungere i dati relativi ad un trasbordo totale da parte del soggetto trasportatore che ha in carico il rifiuto al momento del trasbordo totale:

```csharp
using Newtonsoft.Json;
using System.Net;
using System.Net.Http;

string basePath = "https://<ambiente>/formulari/v1.0";
string numeroFir = "XXXXX 000123 XX"; // numero FIR da cui avviene il trasbordo

var client = new HttpClient();
// TODO: Inizializzare il client HTTP con gli header previsti per il tipo di richiesta (vedi pattern AgID ID_AUTH_REST_02)

// Creazione del payload
var trasbordoTotale = new {
	Trasportatore = new {
		CodiceFiscale = "12345678901",
		Denominazione = "Denominazione nuovo trasportatore",
		NumeroIscrizioneAlbo = "XX/123456",
	},
	PresaInCarico = new {
		DataOraInizioTrasporto = DateTime.UtcNow,
		TargaAutomezzo = "AB123CD",
		Conducente = new {
			Nome = "Mario",
			Cognome = "Rossi",
		},
	},
};

var content = new StringContent(trasbordoParziale, System.Text.Encoding.UTF8, "application/json");
// TODO: Firmare il contenuto (vedi pattern AgID INTEGRITY_REST_01)

// Invio della richiesta HTTP
var response = await client.PostAsync($"{basePath}/{numeroFir}/trasbordo-totale", content, cancellationToken);
if (response.IsSuccessStatusCode)
{
	string result = await response.Content.ReadAsStringAsync();
	var transazione = JsonConvert.DeserializeObject<TransazioneModel>(result);
	Guid transazioneId = transazione.TransazioneId;
}
```

#### 1.9.3 Recupero dell'esito della transazione asincrona

L'endpoint per l'invio dei dati di trasbordo totale di un FIR digitale è di tipo **asincrono** e restituisce come risposta il valore `transazione_id`, ovvero un GUID che identifica la transazione di elaborazione assegnata alla richiesta.
Per ottenere l'esito dell'elaborazione, seguire i passaggi indicati nel paragrafo [Recupero dell'esito di una transazione asincrona](javascript:loadPage('api-flussi-operativi-introduzione#recupero-dell-esito-di-una-transazione-asincrona')).

#### 1.9.4 Acquisizione della firma del trasportatore

Il processo di inserimento delle informazioni di trasbordo totale si deve concludere con la firma del nuovo trasportatore che ha preso in carico il rifiuto, che potrà essere eseguito anche quando il soggetto trasportatore non è lo stesso del soggetto trasportatore originario, essendo l'eventuale nuovo soggetto trasportatore riconosciuto come nuovo soggetto nel FIR digitale.

La procedura di apposizione della firma digitale potrà essere completata eseguendo le operazioni riportate al punto [Firma di un FIR digitale](#1-5-firma-di-un-fir-digitale).


<a name="accettazione-di-un-fir-digitale"></a>
### 1.10 Accettazione di un FIR digitale

Questo flusso operativo descrive l'operazione di accettazione del rifiuto da parte del destinatario, e rappresenta un esempio del processo di aggiunta di informazioni e conseguente firma del FIR digitale da parte del soggetto responsabile dei dati aggiunti, 
analogo alle altre operazioni sintetizzate nel [Diagramma a stati](#Diagramma).

> 💡 **SUGGERIMENTO**
> 
> Consultare la documentazione di riferimento delle [API - formulari](javascript:loadApi('formulari')) per il dettaglio completo dei modelli dell'endpoint e degli eventuali parametri opzionali.

#### 1.10.1 Autenticazione

L'endpoint utilizzato richiede l'autenticazione, quindi è necessario seguire i passaggi indicati nel paragrafo [Autenticazione](javascript:loadPage('api-flussi-operativi-introduzione#autenticazione')).

#### 1.10.2 Invio dei dati di accettazione

Il seguente esempio di codice C# mostra come inviare i dati di accettazione del rifiuto:

```csharp
using Newtonsoft.Json;
using System.Net;
using System.Net.Http;

string basePath = "https://<ambiente>/formulari/v1.0";
string numeroFir = "XXXX";

var client = new HttpClient();
// TODO: Inizializzare il client HTTP con gli header previsti per il tipo di richiesta (vedi pattern AgID ID_AUTH_REST_02)

// Creazione del payload
var datiAccettazione = new {
  tipoAccettazione = "A",
  quantitaAccettata = {
    valore = 800
  },
  dataOraArrivo = "2024-06-13T13:52:06.304Z"
};
var content = new StringContent(datiAccettazione, System.Text.Encoding.UTF8, "application/json");
// TODO: Firmare il contenuto (vedi pattern AgID INTEGRITY_REST_01)

// Invio della richiesta HTTP
var response = await client.PostAsync($"{basePath}/{numeroFir}/accettazione", content, cancellationToken);
if (response.IsSuccessStatusCode)
{
	string result = await response.Content.ReadAsStringAsync();
	var transazione = JsonConvert.DeserializeObject<TransazioneModel>(result);
	Guid transazioneId = transazione.TransazioneId;
}
```


#### 1.10.3 Recupero dell'esito della transazione asincrona

L'endpoint per l'invio dei dati di accettazione di un FIR digitale è di tipo **asincrono** e restituisce come risposta il valore `transazione_id`, ovvero un GUID che identifica la transazione di elaborazione assegnata alla richiesta.
Per ottenere l'esito dell'elaborazione, seguire i passaggi indicati nel paragrafo [Recupero dell'esito di una transazione asincrona](javascript:loadPage('api-flussi-operativi-introduzione#recupero-dell-esito-di-una-transazione-asincrona')).


#### 1.10.4 Acquisizione della firma del destinatario

Il processo di accettazione si conclude con la firma da parte del destinatario e quindi dopo aver eseguito questa operazione è necessario eseguire le operazioni riportate al punto 
[Firma di un FIR digitale](#1-5-firma-di-un-fir-digitale).


### 1.11 Recupero del dettaglio di un FIR digitale

Per recuperare il dettaglio di un FIR digitale, utilizzare l'endpoint **<span style="color:#49cc90">GET</span> `<ambiente>/formulari/v1.0/{numero_fir}`**.

> 💡 **SUGGERIMENTO**
> 
> Consultare la documentazione di riferimento delle [API - formulari](javascript:loadApi('formulari')) per il dettaglio completo dei modelli dell'endpoint e degli eventuali parametri opzionali.

Questo paragrafo descrive i passaggi necessari per recuperare uno o più FIR digitali.

#### 1.11.1 Autenticazione

L'endpoint utilizzato richiede l'autenticazione, quindi è necessario seguire i passaggi indicati nel paragrafo [Autenticazione](javascript:loadPage('api-flussi-operativi-introduzione#autenticazione')).

#### 1.11.2 Ricezione dei dati

Il seguente esempio di codice C# mostra come recuperare il dettaglio di un FIR digitale:

```csharp
using Newtonsoft.Json;
using System.Net.Http;

string basePath = "https://<ambiente>/formulari/v1.0";
string numeroFir = "XXX";

var client = new HttpClient();
// TODO: Inizializzare il client HTTP con gli header previsti per il tipo di richiesta (vedi pattern AgID ID_AUTH_REST_02)

// Invio della richiesta HTTP
var response = await client.GetAsync($"{basePath}/{numeroFir}");
if (response.IsSuccessStatusCode)
{
	string result = await response.Content.ReadAsStringAsync();
	var fir = JsonConvert.DeserializeObject<DettaglioFormulario>(result);
}
```

<a name="recupero-del-file-xfir-di-un-fir-digitale"></a>
### 1.12 Recupero del file xFIR di un FIR digitale

Il file xFIR è un container di firme digitali basato sulla specifica `ASiC-E` (definito all'interno del regolamento _eIDAS_, vedi specifica <a href="https://www.etsi.org/deliver/etsi_en/319100_319199/31916201/01.01.01_60/en_31916201v010101p.pdf" target="_blank">ETSI EN 319 162-1</a>) 
e contiene tutti i dati del formulario digitale, comprese le firme.
È possibile scaricare il file xFIR di un FIR digitale con l'endpoint sincrono **<span style="color:#49cc90">GET</span> `<ambiente>/formulari/v1.0/{numero_fir}/xfir`**.

> 💡 **SUGGERIMENTO**
> 
> Consultare la documentazione di riferimento delle [API - formulari](javascript:loadApi('formulari')) per il dettaglio completo dei modelli dell'endpoint e degli eventuali parametri opzionali.


#### 1.12.1 Autenticazione

L'endpoint utilizzato richiede l'autenticazione, quindi è necessario seguire i passaggi indicati nel paragrafo [Autenticazione](javascript:loadPage('api-flussi-operativi-introduzione#autenticazione')).

#### 1.12.2 Ricezione dei dati

Il seguente esempio di codice C# mostra come recuperare il file xFIR:

```csharp
using Newtonsoft.Json;
using System.Net.Http;

string basePath = "https://<ambiente>/formulari/v1.0";
string numeroFir = "XXX";

var client = new HttpClient();
// TODO: Inizializzare il client HTTP con gli header previsti per il tipo di richiesta (vedi pattern AgID ID_AUTH_REST_02)

// Invio della richiesta HTTP
var response = await client.GetAsync($"{basePath}/{numeroFir}/xfir");
if (response.IsSuccessStatusCode)
{
	string result = await response.Content.ReadAsStringAsync();
	var elenco = JsonConvert.DeserializeObject<DownloadableBaseResponse[]>(result);
}
```

<a name="validazione-di-un-file-xfir"></a>
### 1.13 Validazione di un file xFIR 

Il file xFIR è un container di firme digitali basato sulla specifica `ASiC-E` (definito all'interno del regolamento _eIDAS_, vedi specifica
<a href="https://www.etsi.org/deliver/etsi_en/319100_319199/31916201/01.01.01_60/en_31916201v010101p.pdf" target="_blank">ETSI EN 319 162-1</a>) e contiene tutti i dati del formulario digitale comprese le firme.
Questo flusso operativo permette di validare un file xFIR che rappresenta un FIR digitale firmato.

> 💡 **SUGGERIMENTO**
> 
> Consultare la documentazione di riferimento delle [API - formulari](javascript:loadApi('formulari')) per il dettaglio completo dei modelli dell'endpoint e degli eventuali parametri opzionali.


#### 1.13.1 Autenticazione

L'endpoint utilizzato richiede l'autenticazione, quindi è necessario seguire i passaggi indicati nel paragrafo [Autenticazione](javascript:loadPage('api-flussi-operativi-introduzione#autenticazione')).

#### 1.13.2 Invio del file xFIR da validare

Il seguente esempio di codice C# mostra come validare un file xFIR:

```csharp
using Newtonsoft.Json;
using System.Net.Http;

string basePath = "https://<ambiente>/formulari/v1.0";
string xfir = "XXX"; //byte string del file xFIR che deve essere validato

var client = new HttpClient();
// TODO: Inizializzare il client HTTP con gli header previsti per il tipo di richiesta (vedi pattern AgID ID_AUTH_REST_02)

// Creazione del payload
var validaXfirModel = new {
  xfir
};
var content = new StringContent(validaXfirModel, System.Text.Encoding.UTF8, "application/json");
// TODO: Firmare il contenuto (vedi pattern AgID INTEGRITY_REST_01)

// Invio della richiesta HTTP
var response = await client.PostAsync($"{basePath}/xfir/valida", content, cancellationToken);
if (response.IsSuccessStatusCode)
{
	string result = await response.Content.ReadAsStringAsync();
	var transazione = JsonConvert.DeserializeObject<TransazioneModel>(result);
	Guid transazioneId = transazione.TransazioneId;
}
```

#### 1.13.3 Recupero dell'esito della transazione asincrona

L'endpoint per la validazione di un file xFIR è di tipo **asincrono** e restituisce come risposta il valore `transazione_id`, ovvero un GUID che identifica la transazione di elaborazione assegnata alla richiesta.
Per ottenere l'esito dell'elaborazione, seguire i passaggi indicati nel paragrafo [Recupero dell'esito di una transazione asincrona](javascript:loadPage('api-flussi-operativi-introduzione#recupero-dell-esito-di-una-transazione-asincrona')).

Nel modello restituito con l'esito della transazione asincrona per la validazione del FIR digitale è presente un oggetto che contiene il dettaglio dei dati del formulario, 
assieme all'insieme dei controllo effettuati sul FIR digitale, con relativo esito, raggruppati in quattro categorie:	
- **`formato`**: contiene l'esito dei controlli relativi all'integrità del file rispetto delle specifiche attese (ZIP, ASiC-E);
- **`schema`**: contiene i controlli relativi alla struttura dati dei file XML presenti nell'archivio e contenenti le informazioni sul FIR;
- **`firme`**: contiene i controlli relativi alle firme digitali apposte sul FIR digitale: la loro validità e la copertura della firma dei file attesi.
- **`vidimazione`**: contiene i controlli relativi alla presenza e alla validità del file di vidimazione del numero FIR che identifica il FIR digitale.

Ogni controllo effettuato è identificato da un codice. I controlli effettuati ed il loro singolo esito vengono riportati nel risultato di validazione anche quando il relativo controllo è terminato con successo.
Alcuni controlli sono propedeutici a quelli successivi, ed un loro esito negativo determina l'arresto della procedura di validazione o il passaggio diretto ad una fase successiva di validazione, che risulterà quindi priva dei controlli non significativi a valle di quelli falliti.
In alcuni casi l'esito del controllo non è strettamente positivo (**`Ok`**) o negativo (**`Errore`**), ma di tipo avviso, che segnala una situazione di non conformità ma di tipo non bloccante.

#### 1.13.4 Controlli effettuati in sede di validazione del file xFIR

Tutti i controlli restituiti e raggruppati nelle categoria di cui al punto precedente hanno in comune una proprietà **`codice`** che contiene il nome in codice del controllo, e una proprietà **`esito`** che contiene un valore di un enumerativo che può assumere i valori _Ok_, _Errore_ o _Avviso_.

Nella pagina [Controlli di validazione del file xFIR](javascript:loadPage('controlli-validazione-xfir')) sono descritti i controlli effettuati, riportando i codici di controllo e relativa descrizione.


### 1.14 Upload di un file xFIR

Come descritto nella <a href="/docs?page=guida-tecnica-struttura-fir-digitale">Guida tecnica alla struttura del FIR digitale</a>, il file xFIR che contiene i dati del FIR digitale può anche essere creato, ed evolvere nel suo ciclo di vita, 
_in autonomia_ rispetto alle API per il supporto alla compilazione qui descritte. 

L'endpoint di caricamento  **<span style="color:#61affe">POST</span> `<ambiente>/formulari/v1.0/{numero_fir}/xfir`** permette di condividere un file xFIR creato in autonomia, 
oppure creato attraverso l'[endpoint di creazione](#1-2-creazione-di-un-fir-digitale) e successivamente prelevato con l'endpoint di [recupero del file xFIR](#recupero-del-file-xfir-di-un-fir-digitale) 
ed ampliato in autonomia, nel suo ciclo di vita, con l'aggiunta dei file XML e delle firme previste e descritte nella <a href="/docs?page=guida-tecnica-struttura-fir-digitale">guida</a>.

La possibilità di caricare il file xFIR nello spazio di condivisione gestito dalle API realizza quindi l'**area virtuale di interscambio**, nella quale è quindi possibile:
- utilizzare le API di supporto alla compilazione in modo condiviso tra i soggetti del formulario;
- scaricare e caricare file xFIR, rendendoli visibili e modificabili dai soggetti coinvolti tramite le API stesse.

Il caricamento di un file xFIR è soggetto alla stessa procedura di [validazione del file xFIR](#validazione-di-un-file-xfir) già descritta. Il caricamento viene inibito nel caso in cui l'esito della validazione non sia positivo.  

Il file che viene caricato dovrà essere compatibile in termini di visibilità con l'identità del soggetto che richiede il caricamento.

Se l'operazione di caricamento rappresenta un _aggiornamento_ dei dati del FIR digitale, ossia se nell'**area virtuale di interscambio** è già presente un FIR digitale con lo stesso numero FIR, la nuova versione dovrà rappresentare
un'**evoluzione della precedente**, e non potrà quindi modificare o alterare i dati dell'xFIR già acquisiti, firmati e condivisi. In altri termini il sistema valuta la _compatibilità_ della nuova versione con quella del file xFIR 
già presente, che è tecnicamente definita dalle seguenti regole: 
- tutte le firme digitali XAdES incluse nel file xFIR già presente nell'area virtuale di interscambio devono essere _incluse e verificabili_ anche nella nuova versione del file xFIR che si intende caricare;
- le _firme crittografiche_ contenute nei singoli file XAdES dell'xFIR già presente nell'area virtuale di interscambio devono _coincidere_ con quelle dei rispettivi file XAdES della nuova versione del file xFIR che si vuole caricare.

#### 1.14.1 Autenticazione

L'endpoint richiede l'autenticazione, quindi è necessario seguire i passaggi indicati nel paragrafo [Autenticazione](javascript:loadPage('api-flussi-operativi-introduzione#autenticazione')).

#### 1.14.2 Caricamento dell'xFIR

Il seguente esempio di codice C# mostra come effettuare la richiesta di caricamento di un file xFIR che contiene i file del FIR digitale:

```csharp
using Newtonsoft.Json;
using System.Net.Http;
using System.Text;

string basePath = "https://<ambiente>/formulari/v1.0";
string filePath = @"C:\xfir";
string numIscrSito = "OP123XXXXXXXX00-PD00001";

var client = new HttpClient();
// TODO: Inizializzare il client HTTP con gli header previsti per il tipo di richiesta (vedi pattern AgID ID_AUTH_REST_02)

var uploadModel = new {
	num_iscr_sito = numIscrSito,
	xfir = File.ReadAllBytes(filePath)
};

var content = new StringContent(JsonConvert.SerializeObject(uploadModel), Encoding.UTF8, "application/json");
// TODO: Firmare il contenuto (vedi pattern AgID INTEGRITY_REST_01)

// Invio della richiesta HTTP
var response = await client.PostAsync($"{basePath}/xfir", content);
if (response.IsSuccessStatusCode)
{
	string result = await response.Content.ReadAsStringAsync();
	var transazione = JsonConvert.DeserializeObject<TransazioneModel>(result);
	Guid transazioneId = transazione.TransazioneId;
}
```


#### 1.14.3 Recupero dell'esito della transazione asincrona

L'endpoint per il caricamento del file xFIR è di tipo **asincrono** e restituisce come risposta il valore `transazione_id`, ovvero un GUID che identifica la transazione di elaborazione assegnata alla richiesta.
Per ottenere l'esito dell'elaborazione, seguire i passaggi indicati nel paragrafo [Recupero dell'esito di una transazione asincrona](javascript:loadPage('api-flussi-operativi-introduzione#recupero-dell-esito-di-una-transazione-asincrona')).

Nel modello restituito con l'esito della transazione asincrona per il caricamento del file xFIR viene restituito anche l'esito della validazione 
come descritto nella sezione relativa all'[endpoint di validazione](#validazione-di-un-file-xfir).


## 2. Restituzione della copia di un FIR digitale

La restituzione della copia del FIR digitale da parte del **destintario** agli altri soggetti indicati nel FIR, completa dei dati di accettazione e relativa firma digitale, è definita dal capitolo 9.5.3 ("Comunicazione al RENTRI della chiusura del ciclo del FIR") presente nelle modalità operative allegate al Decreto Direttoriale n.143/2023, ed è prevista dall’art. 7, comma 7 del D.M. 4 aprile 2023, n. 59.

### 2.1 Caricamento della copia di un FIR digitale

Per caricare la copia di un FIR digitale da restituire (cioè il file xFIR completo dei dati di accettazione firmati) il destinatario deve utilizzare l'endpoint **<span style="color:#61affe">POST</span> `<ambiente>/formulari/v1.0/copia-digitale/caricamento/{numero_fir}`**.
Nel path occorre specificare il parametro obbligatorio **`{numero_fir}`**, che è il numero del FIR digitale che deve coincidere con la stessa informazione contenuta tra i dati del FIR digitale, e nel modello previsto dal payload è richiesto, con il parametro **`num_iscr_sito`**, il numero di iscrizione dell'unità locale al quale il destinatario intende collegare l'operazione di restituzione.

> 💡 **SUGGERIMENTO**
> 
> Consultare la documentazione di riferimento delle [API - formulari](javascript:loadApi('formulari')) per il dettaglio completo dei modelli dell'endpoint e degli eventuali parametri opzionali.

Questo paragrafo descrive i passaggi necessari affinché il destinatario possa caricare la copia di un FIR digitale.

#### 2.1.1 Autenticazione

Gli endpoint relativi alla fase di caricamento della copia del FIR digitale richiedono l'autenticazione, quindi è necessario seguire i passaggi indicati nel paragrafo [Autenticazione](javascript:loadPage('api-flussi-operativi-introduzione#autenticazione')).

#### 2.1.2 Caricamento 

Il seguente esempio di codice C# mostra come il destinatario può caricare la copia di un FIR digitale, in restituzione a produttore, trasportatore/i ed eventuale intermediario/i:

```csharp
using Newtonsoft.Json;
using System.Net.Http;

string basePath = "https://<ambiente>/formulari/v1.0";
string numIscrSito = "OP123XXXXXXXX00-PD00001";
string numeroFir = "XXXX";
string filePath = @"C:\fir\nome-file-copia-digitale.xfir";

var client = new HttpClient();
// TODO: Inizializzare il client HTTP con gli header previsti per il tipo di richiesta (vedi pattern AgID ID_AUTH_REST_02)

var content = new StringContent(
	JsonConvert.SerializeObject(new
	{
		xfir = File.ReadAllBytes(filePath),
		numIscrSito = numIscrSito,
		note = "...",
	}),
	System.Text.Encoding.UTF8,
	"application/json"
);

// TODO: Firmare il contenuto (vedi pattern AgID INTEGRITY_REST_01)

// Invio della richiesta HTTP
var response = await client.PostAsync($"{basePath}/copia-digitale/caricamento/{numeroFir}", content, cancellationToken);
if (response.IsSuccessStatusCode)
{
	string result = await response.Content.ReadAsStringAsync();
	var transazione = JsonConvert.DeserializeObject<TransazioneModel>(result);
	Guid transazioneId = transazione.TransazioneId;
}
```

Nella fase di controllo del file xFIR inviato, il sistema procede alla validazione del file applicando i controlli definiti nel documento [Controlli di validazione del file xFIR](javascript:loadPage('controlli-validazione-xfir')), e in assenza di errori formali che ne impediscano l'estrazione dei dati necessari, si occupa di recuperare dal file xFIR le informazioni utili a rendere visibile il file caricato agli altri soggetti presenti nel FIR, in modo che questi possano prenderne visione, utilizzando le API con rotta **`/formulari/v1.0/copia-digitale/conferma/`**.

#### 2.1.3 Recupero dell'esito della transazione asincrona

L'endpoint di restituzione della copia del FIR digitale è di tipo **asincrono** e restituisce come risposta il valore `transazione_id`, ovvero un GUID che identifica la transazione di elaborazione assegnata alla richiesta.
Per ottenere l'esito dell'elaborazione, seguire i passaggi indicati nel paragrafo [Recupero dell'esito di una transazione asincrona](javascript:loadPage('api-flussi-operativi-introduzione#recupero-dell-esito-di-una-transazione-asincrona')).

A seguito dell'operazione di caricamento del file xFIR da parte del destinatario, viene generato un codice identificativo dell'operazione di restituzione, con cui ci si potrà riferire alla specifica operazione di restituzione.
Il codice identificativo sarà presente nella proprietà **`identificativo`** del modello restituito come esito dell'operazione.


#### 2.1.4 Recupero delle copie del FIR digitale caricate

Per recuperare l'elenco delle operazioni di caricamento dei FIR digitali, per la restituzione del file xFIR ai soggetti che vi hanno partecipato, il destinatario può utilizzare l'endpoint **<span style="color:#49cc90">GET</span> `<ambiente>/formulari/v1.0/copia-digitale/caricamento/{num_iscr_sito}`**.
Nel path occorre specificare il parametro obbligatorio **`{num_iscr_sito}`**, che è il numero iscrizione dell'unità locale del destinatario che è stato usato nell'operazione di caricamento.

> 💡 **SUGGERIMENTO**
> 
> Consultare la documentazione di riferimento delle [API - formulari](javascript:loadApi('formulari')) per il dettaglio completo dei modelli dell'endpoint e degli eventuali parametri opzionali.

#### 2.1.5 Recupero elenco delle copie dei FIR digitali caricate

Il seguente esempio di codice C# mostra come recuperare l'elenco delle copie dei FIR digitali caricati:

```csharp
using Newtonsoft.Json;
using System.Net.Http;

string basePath = "https://<ambiente>/formulari/v1.0";
string numIscrSito = "OP123XXXXXXXX00-PD00001";

var client = new HttpClient();
// TODO: Inizializzare il client HTTP con gli header previsti per il tipo di richiesta (vedi pattern AgID ID_AUTH_REST_02)

// Invio della richiesta HTTP
var response = await client.GetAsync($"{basePath}/copia-digitale/caricamento/{numIscrSito}");
if (response.IsSuccessStatusCode)
{
	string result = await response.Content.ReadAsStringAsync();
	var elencoCopie = JsonConvert.DeserializeObject<CopiaDigitaleItemResult[]>(result);
}
```

#### 2.1.6 Recupero della copia del FIR digitale caricata

Il recupero, da parte del destinatario, di una copia di FIR digitale da esso stesso caricata, si articola in due endpoint distinti: il primo per recuperare il _dettaglio dei dati di restituzione_ della copia del FIR digitale, ed il secondo per recuperare il documento vero e proprio, ossia il _file xFIR_.

##### 2.1.6.1 Recupero dettaglio della copia del FIR digitale

Per recuperare il dettaglio della copia del FIR digitale da esso stesso caricata, il destinatario può utilizzare l'endpoint **<span style="color:#49cc90">GET</span> `<ambiente>/formulari/v1.0/copia-digitale/caricamento/{num_iscr_sito}/{identificativo}`**.
Nel path occorre specificare i seguenti parametri obbligatori:
- **`{num_iscr_sito}`** che è il numero iscrizione unità locale del destinatario, rilasciato all'iscrizione, in cui è stato collocato il FIR digitale dal destinatario (ad esempio: `OP123XXXXXXXX00-PD00001`).
- **`{identificativo}`** che è l'identificativo della restituzione della copia del FIR digitale, generato successivamete all'operazione di caricamento di cui al punto [Caricamento della copia di un FIR digitale](#2-1-caricamento-della-copia-di-un-fir-digitale)

Il seguente esempio di codice C# mostra come il destinatario recupera il dettaglio della restituzione della copia FIR digitale caricata:

```csharp
using Newtonsoft.Json;
using System.Net.Http;

string basePath = "https://<ambiente>/formulari/v1.0";
string numIscrSito = "OP123XXXXXXXX00-PD00001";
string identificativoCopiaDigitale = "CDXXXXXXXXXXXX";

var client = new HttpClient();
// TODO: Inizializzare il client HTTP con gli header previsti per il tipo di richiesta (vedi pattern AgID ID_AUTH_REST_02)

// Invio della richiesta HTTP
var response = await client.GetAsync($"{basePath}/copia-digitale/caricamento/{numIscrSito}/{identificativoCopiaDigitale}");
if (response.IsSuccessStatusCode)
{
	string result = await response.Content.ReadAsStringAsync();
	var copiaDigitale = JsonConvert.DeserializeObject<CopiaDigitaleResult>(result);
}
```

##### 2.1.6.2 Recupero del documento della copia del FIR digitale

Per recuperare il documento della copia del FIR digitale, ossia il file xFIR caricato, il destinatario utilizzerà l'endpoint **<span style="color:#49cc90">GET</span> `<ambiente>/formulari/v1.0/copia-digitale/caricamento/{num_iscr_sito}/{identificativo}/documento`**.
Nel path occorre specificare gli stessi parametri dell'endpoint precedente.

Il seguente esempio di codice C# mostra come il destinatario recupera il file xFIR da esso stesso caricato e restituito ai soggetti coinvolti nel FIR:

```csharp
using Newtonsoft.Json;
using System.Net.Http;

string basePath = "https://<ambiente>/formulari/v1.0";
string numIscrSito = "OP123XXXXXXXX00-PD00001";
string identificativoCopiaDigitale = "CDXXXXXXXXXXXX";
string fileFolder = @"C:\xfir";

var client = new HttpClient();
// TODO: Inizializzare il client HTTP con gli header previsti per il tipo di richiesta (vedi pattern AgID ID_AUTH_REST_02)

// Invio della richiesta HTTP
var response = await client.GetAsync($"{basePath}/copia-digitale/caricamento/{numIscrSito}/{identificativoCopiaDigitale}/documento");
if (response.IsSuccessStatusCode)
{
	string result = await response.Content.ReadAsStringAsync();
    var copiaDigitale = JsonConvert.DeserializeObject<DownloadableBaseResponse>(result);

	// Scrittura del file
    File.WriteAllBytes($@"{fileFolder}\{copiaDigitale.NomeFile}", Convert.FromBase64String(copiaDigitale.Content));
}
```

### 2.2 Conferma di presa visione delle copie di FIR digitale

A seguito dell'operazione di restituzione della copia del FIR digitale, completa dei dati di accettazione (o respingimento) firmati dal destinatario, gli altri soggetti presenti nel FIR digitale, ossia produttore, trasportatore/i ed eventuale intermediario/i, possono:

- recuperare l'elenco e i dettagli delle operazioni di restituzione;
- scaricare i file xFIR restituiti dal destinatario;
- confermare la presa visione delle restituzioni.

> 💡 **SUGGERIMENTO**
> 
> Consultare la documentazione di riferimento delle [API - formulari](javascript:loadApi('formulari')) per il dettaglio completo dei modelli dell'endpoint e degli eventuali parametri opzionali.

#### 2.2.1 Autenticazione

Gli endpoint utilizzati richiedono l'autenticazione, quindi è necessario seguire i passaggi indicati nel paragrafo [Autenticazione](javascript:loadPage('api-flussi-operativi-introduzione#autenticazione')).

#### 2.2.2 Recupero elenco delle copie dei FIR digitali disponibili

Per recuperare l'elenco delle restituzioni dei FIR digitali effettuate dai destinatari, un produttore/trasportatore/intermediario può utilizzare l'endpoint **<span style="color:#49cc90">GET</span> `<ambiente>/formulari/v1.0/copia-digitale/conferma/{identificativo_soggetto}`**.
Nel path occorre specificare il parametro obbligatorio **`{identificativo_soggetto}`** che corrisponde al codice fiscale del soggetto per cui viene richiesto l'elenco delle copie dei FIR digitali disponibili.

Il seguente esempio di codice C# mostra come recuperare l'elenco delle copie FIR digitale disponibili per un soggetto produttore/trasportatore/intermediario:

```csharp
using Newtonsoft.Json;
using System.Net.Http;

string basePath = "https://<ambiente>/formulari/v1.0";
string identificativoSoggetto = "01234567890";

var client = new HttpClient();
// TODO: Inizializzare il client HTTP con gli header previsti per il tipo di richiesta (vedi pattern AgID ID_AUTH_REST_02)

// Invio della richiesta HTTP
var response = await client.GetAsync($"{basePath}/copia-digitale/conferma/{identificativoSoggetto}");
if (response.IsSuccessStatusCode)
{
	string result = await response.Content.ReadAsStringAsync();
	var elencoCopie = JsonConvert.DeserializeObject<CopiaDigitaleItemResult[]>(result);
}
```

Gli oggetti presenti nell'array restituito dall'endpoint sono dati riassuntivi delle copie dei FIR digitali, ed ogni oggetto conterrà la proprietà **`identificativo`** con cui ciascuna copia del FIR digitale restituita potrà essere referenziata dagli endpoint descritti qui di seguito.

#### 2.2.3 Recupero di una copia del FIR digitale disponibile

Il recupero, da parte del produttore/trasportatore/intermediario, del dettaglio di restituzione di una copia di FIR digitale resa disponibile dal destinatario, si articola in due endpoint distinti: il primo per recuperare il _dettaglio dei dati di restituzione_ della copia del FIR digitale, ed il secondo per recuperare il documento vero e proprio, ossia _il file xFIR_.

##### 2.2.3.1 Recupero del dettaglio di restituzione di una copia FIR digitale disponibile

Per recuperare il dettaglio della copia del FIR digitale disponibile, utilizzare l'endpoint **<span style="color:#49cc90">GET</span> `<ambiente>/formulari/v1.0/copia-digitale/conferma/{identificativo_soggetto}/{identificativo}`**.
Nel path occorre specificare i seguenti parametri obbligatori:
- **`{identificativo_soggetto}`** che corrsiponde al codifice fiscale del soggetto per il quale si richiede la copia del FIR digitale disponibile;
- **`{identificativo}`** che è l'identificativo della copia del FIR digitale disponibile, generato successivamete all'operazione di caricamento da parte del destinatario, di cui al punto [Caricamento della copia di un FIR digitale](#2-1-caricamento-della-copia-di-un-fir-digitale).

Il seguente esempio di codice C# mostra come il produttore/trasportatore/intermediario recupera il dettaglio di restituzione della copia FIR digitale disponibile:

```csharp
using Newtonsoft.Json;
using System.Net.Http;

string basePath = "https://<ambiente>/formulari/v1.0";
string identificativoSoggetto = "01234567890";
string identificativoCopiaDigitale = "CDXXXXXXXXXXXX";

var client = new HttpClient();
// TODO: Inizializzare il client HTTP con gli header previsti per il tipo di richiesta (vedi pattern AgID ID_AUTH_REST_02)

// Invio della richiesta HTTP
var response = await client.GetAsync($"{basePath}/copia-digitale/conferma/{identificativoSoggetto}/{identificativoCopiaDigitale}");
if (response.IsSuccessStatusCode)
{
	string result = await response.Content.ReadAsStringAsync();
	var copiaDigitale = JsonConvert.DeserializeObject<CopiaDigitaleResult>(result);
}
```

##### 2.2.3.2 Recupero del documento della copia del FIR digitale disponibile

Per recuperare il documento della copia del FIR digitale disponibile, il produttore/trasportatore/intermediario può utilizzare l'endpoint **<span style="color:#49cc90">GET</span> `<ambiente>/formulari/v1.0/copia-digitale/conferma/{identificativo_soggetto}/{identificativo}/documento`**. 
Nel path occorre specificare gli stessi parametri dell'endpoint precedente.

Il seguente esempio di codice C# mostra come il produttore/trasportatore/intermediario recupera il file xFIR caricato dal destinatario:

```csharp
using Newtonsoft.Json;
using System.Net.Http;

string basePath = "https://<ambiente>/formulari/v1.0";
string identificativoSoggetto = "01234567890";
string identificativoCopiaDigitale = "CDXXXXXXXXXXXX";
string fileFolder = @"C:\xfir";

var client = new HttpClient();
// TODO: Inizializzare il client HTTP con gli header previsti per il tipo di richiesta (vedi pattern AgID ID_AUTH_REST_02)

// Invio della richiesta HTTP
var response = await client.GetAsync($"{basePath}/copia-digitale/conferma/{identificativoSoggetto}/{identificativoCopiaDigitale}/documento");
if (response.IsSuccessStatusCode)
{
	string result = await response.Content.ReadAsStringAsync();
    var copiaDigitale = JsonConvert.DeserializeObject<DownloadableBaseResponse>(result);

	// Scrittura del file
    File.WriteAllBytes($@"{fileFolder}\{copiaDigitale.NomeFile}", Convert.FromBase64String(copiaDigitale.Content));
}
```

#### 2.2.4 Conferma della presa visione di una copia del FIR digitale disponibile

Con l'endpoint **<span style="color:#fca130">PUT</span> `<ambiente>/formulari/v1.0/copia-digitale/conferma/{num_iscr_sito}/{identificativo}`** viene data al produttore/trasportatore/intermediario a cui è stata resa disponibile la copia del FIR digitale dal destinatario, la possibilità di:

- _contrassegnare_ la presa visione del documento xFIR restituito con un'informazione di stato, visibile anche dal destinatario;
- _attribuire_ la restituzione della copia del FIR digitale ad una specifica unità locale iscritta, specificata nel path dell'endpoint, quando nei dati del FIR digitale non era già stato indicato il numero di iscrizione dell'unità locale stessa.

Il seguente esempio di codice C# mostra come il produttore/trasportatore/intermediario: 

```csharp
using Newtonsoft.Json;
using System.Net.Http;

string basePath = "https://<ambiente>/formulari/v1.0";
string numIscrSito = "OP123XXXXXXXX00-PD00001";
string identificativoCopiaDigitale = "CDXXXXXXXXXXXX";

var client = new HttpClient();
// TODO: Inizializzare il client HTTP con gli header previsti per il tipo di richiesta (vedi pattern AgID ID_AUTH_REST_02)

// Invio della richiesta HTTP
var response = await client.PutAsync($"{basePath}/copia-digitale/conferma/{numIscrSito}/{identificativoCopiaDigitale}", null);

```

## 3. Trasmissione dati di un FIR digitale

La trasmissione dei dati del FIR digitale a RENTRI è definita dal capitolo 12, ("Trasmissione dei dati del FIR mediante interoperabilità") delle modalità operative allegate al Decreto Direttoriale n.143/2023 e prevista dall'art. 21 comma 1 del D.M. 4 aprile 2023, n. 59.

### 3.1 Estrazione dati dal file xFIR

Per trasmettere i dati di un FIR digitale è necessario estrarre le informazioni contenute nel file xFIR. Per estrarre i dati di un file xFIR può essere utilizzato l'endpoint **<span style="color:#61affe">POST</span> `<ambiente>/trasmissioni/operatore/{numIscrSito}/{numeroFir}/estrai`**.
Nel path occorre specificare il parametro obbligatorio **`{num_iscr_sito}`** che è il numero iscrizione unità locale rilasciato all'iscrizione (ad esempio: `OP123XXXXXXXX00-PD00001`).

> 💡 **SUGGERIMENTO**
> 
> Consultare la documentazione di riferimento delle [API - formulari](javascript:loadApi('formulari')) per il dettaglio completo dei modelli dell'endpoint e degli eventuali parametri opzionali.

Questo paragrafo descrive le operazioni necessarie all'estrazione dei dati di un FIR da un file xFIR.

#### 3.1.1 Autenticazione

L'endpoint utilizzato richiede l'autenticazione, quindi è necessario seguire i passaggi indicati nel paragrafo [Autenticazione](javascript:loadPage('api-flussi-operativi-introduzione#autenticazione')).

#### 3.1.2 Estrazione dei dati da trasmettere dal file xFIR

Il seguente esempio di codice C# mostra come estrarre i dati di un FIR digitale da un file xFIR:

```csharp
using Newtonsoft.Json;
using System.Net.Http;

string basePath = "https://<ambiente>/formulari/v1.0";
string numIscrSito = "OP123XXXXXXXX00-PD00001";
string numeroFir = "XXX";
string filePath = @"C:\xfir";

var client = new HttpClient();
// TODO: Inizializzare il client HTTP con gli header previsti per il tipo di richiesta (vedi pattern AgID ID_AUTH_REST_02)

var content = new StringContent(
	JsonConvert.SerializeObject(new
	{
		xfir = File.ReadAllBytes($@"{filePath}\nome-file-copia-digitale.xfir")
	}),
	System.Text.Encoding.UTF8,
	"application/json"
);

// TODO: Firmare il contenuto (vedi pattern AgID INTEGRITY_REST_01)

// Invio della richiesta HTTP
var response = await client.PostAsync($"{basePath}/trasmissioni/operatore/{numIscrSito}/{numeroFir}/estrai", content, cancellationToken);
if (response.IsSuccessStatusCode)
{
	string result = await response.Content.ReadAsStringAsync();
	var transazione = JsonConvert.DeserializeObject<TransazioneModel>(result);
	Guid transazioneId = transazione.TransazioneId;
}
```

#### 3.1.3 Recupero dell'esito della transazione asincrona

L'endpoint per l'estrazione dei dati di un FIR digitale è di tipo **asincrono** e restituisce come risposta il valore `transazione_id`, ovvero un GUID che identifica la transazione di elaborazione assegnata alla richiesta.
Per ottenere l'esito dell'elaborazione, seguire i passaggi indicati nel paragrafo [Recupero dell'esito di una transazione asincrona](javascript:loadPage('api-flussi-operativi-introduzione#recupero-dell-esito-di-una-transazione-asincrona')).

> ⚠️ **ATTENZIONE**
> 
> L'esito dell'operazione di estrazione dati restituirà un oggetto contenente il campo `formulario` che rispetta il modello [`DatiTrasmissioneFormularioModel`](javascript:loadApi('formulari')) richiesto dall'endpoint di trasmissione dati del FIR. 

### 3.2 Trasmissione dati di un FIR digitale

Per trasmettere i dati di un FIR digitale, eventualmente estratti con l'endpoint di estrazione precedentemente descritto, utilizzare l'endpoint **<span style="color:#61affe">POST</span> `<ambiente>/formulari/v1.0/trasmissioni/operatore/{num_iscr_sito}`**.
Nel path occorre specificare il parametro obbligatorio **`{num_iscr_sito}`** che è il numero iscrizione unità locale rilasciato all'iscrizione (ad esempio: `OP123XXXXXXXX00-PD00001`).

> 💡 **SUGGERIMENTO**
> 
> Consultare la documentazione di riferimento delle [API - formulari](javascript:loadApi('formulari')) per il dettaglio completo dei modelli dell'endpoint e degli eventuali parametri opzionali.

Questo paragrafo descrive i passaggi necessari alla trasmissione dei dati di un FIR digitale.

#### 3.2.1 Autenticazione

L'endpoint utilizzato richiede l'autenticazione, quindi è necessario seguire i passaggi indicati nel paragrafo [Autenticazione](javascript:loadPage('api-flussi-operativi-introduzione#autenticazione')).

#### 3.2.2 Trasmissione del FIR digitale

Il seguente esempio di codice C# mostra come trasmettere i dati di un FIR digitale:

```csharp
using Newtonsoft.Json;
using System.Net.Http;

string basePath = "https://<ambiente>/formulari/v1.0";
string numIscrSito = "OP123XXXXXXXX00-PD00001";
// DatiTrasmissioneFormularioModel formulario = ...; // oggetto restituito dall'esito dell'operazione di estrazione descritto al paragrafo "5.1 Estrazione dati dal file xFIR"

var client = new HttpClient();
// TODO: Inizializzare il client HTTP con gli header previsti per il tipo di richiesta (vedi pattern AgID ID_AUTH_REST_02)

var content = new StringContent(JsonConvert.SerializeObject(formulario), System.Text.Encoding.UTF8, "application/json");

// TODO: Firmare il contenuto (vedi pattern AgID INTEGRITY_REST_01)

// Invio della richiesta HTTP
var response = await client.PostAsync($"{basePath}/trasmissioni/operatore/{numIscrSito}", content, cancellationToken);
if (response.IsSuccessStatusCode)
{
    string result = await response.Content.ReadAsStringAsync();
    var trasmissioneResult = JsonConvert.DeserializeObject<TrasmissioneFormularioResponse>(result);
	string identificativoTrasmissione = trasmissioneResult.identificativo;
}
```

### 3.3 Lista delle trasmissioni effettuate a RENTRI

Per recuperare la lista dei FIR digitali trasmessi a RENTRI, utilizzare l'endpoint **<span style="color:#49cc90">GET</span> `<ambiente>/formulari/v1.0/trasmissioni/operatore/{num_iscr_sito}`**.
Nel path occorre specificare il parametro obbligatorio **`{num_iscr_sito}`** che è il numero iscrizione unità locale rilasciato all'iscrizione (ad esempio: `OP123XXXXXXXX00-PD00001`).

> 💡 **SUGGERIMENTO**
> 
> Consultare la documentazione di riferimento delle [API - formulari](javascript:loadApi('formulari')) per il dettaglio completo dei modelli dell'endpoint e degli eventuali parametri opzionali.

Questo paragrafo descrive i passaggi necessari a recuperare la lista dei FIR trasmessi a RENTRI.

#### 3.3.1 Autenticazione

L'endpoint utilizzato richiede l'autenticazione, quindi è necessario seguire i passaggi indicati nel paragrafo [Autenticazione](javascript:loadPage('api-flussi-operativi-introduzione#autenticazione')).

#### 3.3.2 Recupero della lista delle trasmissioni effettuate

Il seguente esempio di codice C# mostra come recuperare la lista delle trasmissioni:

```csharp
using Newtonsoft.Json;
using System.Net.Http;

string basePath = "https://<ambiente>/formulari/v1.0";
string numIscrSito = "OP123XXXXXXXX00-PD00001";

var client = new HttpClient();
// TODO: Inizializzare il client HTTP con gli header previsti per il tipo di richiesta (vedi pattern AgID ID_AUTH_REST_02)

// Invio della richiesta HTTP
var response = await client.GetAsync($"{basePath}/trasmissioni/operatore/{numIscrSito}");
if (response.IsSuccessStatusCode)
{
	string result = await response.Content.ReadAsStringAsync();
	var listaTrasmissioni = JsonConvert.DeserializeObject<TrasmissioneDatiItemResult[]>(result);
}
```

### 3.4 Recupero dei dati di un FIR digitale trasmesso a RENTRI

Per recuperare i dati di un FIR digitale trasmesso a RENTRI, utilizzare l'endpoint **<span style="color:#49cc90">GET</span> `<ambiente>/formulari/v1.0/trasmissioni/operatore/{num_iscr_sito}/{identificativo}`**.

Nel path occorre specificare i parametro obbligatori:
- **`{num_iscr_sito}`** che è il numero iscrizione unità locale rilasciato all'iscrizione (ad esempio: `OP123XXXXXXXX00-PD00001`);
- **`{identificativo}`** che identifica la trasmissione dei dati del FIR digitale.

> 💡 **SUGGERIMENTO**
> 
> Consultare la documentazione di riferimento delle [API - formulari](javascript:loadApi('formulari')) per il dettaglio completo dei modelli dell'endpoint e degli eventuali parametri opzionali.

Questo paragrafo descrive i passaggi necessari a recuperare i dati di un FIR trasmesso a RENTRI.

#### 3.4.1 Autenticazione

L'endpoint utilizzato richiede l'autenticazione, quindi è necessario seguire i passaggi indicati nel paragrafo [Autenticazione](javascript:loadPage('api-flussi-operativi-introduzione#autenticazione')).

#### 3.4.2 Recupero dati trasmessi

Il seguente esempio di codice C# mostra come recuperare i dati trasmessi a RENTRI:

```csharp
using Newtonsoft.Json;
using System.Net.Http;

string basePath = "https://<ambiente>/formulari/v1.0";
string numIscrSito = "OP123XXXXXXXX00-PD00001";
string identificativo = "XXX";

var client = new HttpClient();
// TODO: Inizializzare il client HTTP con gli header previsti per il tipo di richiesta (vedi pattern AgID ID_AUTH_REST_02)

// Invio della richiesta HTTP
var response = await client.GetAsync($"{basePath}/trasmissioni/operatore/{numIscrSito}/{identificativo}");
if (response.IsSuccessStatusCode)
{
	string result = await response.Content.ReadAsStringAsync();
	var fir = JsonConvert.DeserializeObject<TrasmissioneDatiResult>(result);
}
```

### 3.5 Annullamento trasmissione dati di un FIR digitale

Per annullare la trasmissione di un FIR digitale, utilizzare l'endpoint **<span style="color:#f93e3e">DELETE</span> `<ambiente>/formulari/v1.0/trasmissioni/operatore/{num_iscr_sito}/{identificativo}/annulla`**.

Nel path occorre specificare i parametro obbligatori:
- **`{num_iscr_sito}`** che è il numero iscrizione unità locale rilasciato all'iscrizione (ad esempio: `OP123XXXXXXXX00-PD00001`);
- **`{identificativo}`** che identifica la trasmissione dei dati del FIR digitale.

> 💡 **SUGGERIMENTO**
> 
> Consultare la documentazione di riferimento delle [API - formulari](javascript:loadApi('formulari')) per il dettaglio completo dei modelli dell'endpoint e degli eventuali parametri opzionali.

Questo paragrafo descrive i passaggi necessari ad annullare la trasmissione dati di un FIR digitale.

#### 3.5.1 Autenticazione

L'endpoint utilizzato richiede l'autenticazione, quindi è necessario seguire i passaggi indicati nel paragrafo [Autenticazione](javascript:loadPage('api-flussi-operativi-introduzione#autenticazione')).

#### 3.5.2 Annullamento

Il seguente esempio di codice C# mostra come annullare la trasmissione di un FIR digitale:

```csharp
using Newtonsoft.Json;
using System.Net.Http;

string basePath = "https://<ambiente>/formulari/v1.0";
string numIscrSito = "OP123XXXXXXXX00-PD00001";
string identificativo = "XXX";

var client = new HttpClient();
// TODO: Inizializzare il client HTTP con gli header previsti per il tipo di richiesta (vedi pattern AgID ID_AUTH_REST_02)

// TODO: Firmare il contenuto (vedi pattern AgID INTEGRITY_REST_01)

// Invio della richiesta HTTP
var response = await client.DeleteAsync($"{basePath}/trasmissioni/operatore/{numIscrSito}/{identificativo}/annulla", null, cancellationToken);
if (response.IsSuccessStatusCode)
{
    // trasmissione dati annullata con successo
}
```

---

*Ultimo aggiornamento: 22/10/2025*