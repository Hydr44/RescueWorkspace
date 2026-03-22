# Formulari

Nei paragrafi che seguono sono descritti i principali flussi operativi degli endpoint dei servizi RENTRI legati ai **Formulari**.

La presente documentazione fa riferimento alle **API RENTRI v1.0**. Nelle URL degli endpoint di seguito indicate non viene specificato il server, in quanto dipende dall'ambiente su cui si sta operando. Gli indirizzi dei server per gli ambienti **DEMO** e **PRODUZIONE** sono:

```http
https://demoapi.rentri.gov.it/...
https://api.rentri.gov.it/...
```

Nei paragrafi seguenti è presente un glossario con un elenco dei termini comuni utilizzati nell'API e la descrizione dei principali flussi operativi con il dettaglio dei passaggi per il corretto utilizzo degli endpoint dei servizi RENTRI.

## 1. Vidimazione FIR

Per vidimare un formulario (FIR), utilizzare l'endpoint **<span style="color:#61affe">POST</span> `<ambiente>/vidimazione-formulari/v1.0?codiceBlocco={codiceBlocco}`**.
Nel path occorre specificare il parametro obbligatorio **`{codiceBlocco}`** che corrisponde al codice del blocco in cui vidimare il FIR.

### 1.1 Recupero dei blocchi FIR

Per recuperare uno o più blocchi di FIR, utilizzare l'endpoint **<span style="color:#49cc90">GET</span> `<ambiente>/vidimazione-formulari/v1.0?identificativo={identificativo}`**.
Nella query string occorre specificare il parametro **`identificativo`** con il codice fiscale del soggetto per cui si richiede l'elenco dei blocchi.

È possibile inoltre specificare degli ulteriori parametri per restringere la ricerca, in particolare: 
- **`codice_blocco`** è il codice del singolo blocco che si vuole recuperare.
- **`num_iscr_sito`** è il numero iscrizione unità locale rilasciato all'iscrizione (ad esempio: `OP123XXXXXXXX00-PD00001`) per ottenere solo i blocchi creati per questa unità locale.

L'endpoint utilizza la paginazione per la restituzione dei risultati. È quindi possibile specificare i seguenti parametri opzionali negli header della richiesta:
- **`Paging-Page`** è il numero di pagina (default e min: 1).
- **`Paging-PageSize`** è la dimensione della singola pagina (default e max: 100).

> 💡 **SUGGERIMENTO**
> 
> Consultare la documentazione di riferimento delle [API - vidimazione-formulari](javascript:loadApi('vidimazione-formulari')) per il dettaglio completo dei modelli dell'endpoint e degli eventuali parametri opzionali.

Questo paragrafo descrive i passaggi necessari per recuperare uno o più blocchi FIR.

#### 1.1.1 Autenticazione

L'endpoint utilizzato richiede l'autenticazione, quindi è necessario seguire i passaggi indicati nel paragrafo [Autenticazione](javascript:loadPage('api-flussi-operativi-introduzione#autenticazione')).

#### 1.1.2 Ricezione dei dati

Il seguente esempio di codice C# mostra come recuperare i blocchi FIR del soggetto di cui si specifica l'identificativo:

```csharp
using Newtonsoft.Json;
using System.Net.Http;

string basePath = "https://<ambiente>/vidimazione-formulari/v1.0";
string identificativo = "RXXXXXXXXX0";

var client = new HttpClient();
// TODO: Inizializzare il client HTTP con gli header previsti per il tipo di richiesta (vedi pattern AgID ID_AUTH_REST_02)

// Invio della richiesta HTTP
var response = await client.GetAsync($"{basePath}?identificativo={identificativo}");
if (response.IsSuccessStatusCode)
{
	string result = await response.Content.ReadAsStringAsync();
	var blocchi = JsonConvert.DeserializeObject<BloccoModel[]>(result);
}
```

### 1.2 Vidimazione di un FIR

Per vidimare un FIR, utilizzare l'endpoint **<span style="color:#61affe">POST</span> `<ambiente>/vidimazione-formulari/v1.0/{codice_blocco}`**.
Nel path occorre specificare il parametro obbligatorio **`{codice_blocco}`** che corrisponde all'identificativo RENTRI assegnato al blocco in cui si vuole vidimare un nuovo FIR.
L'elenco dei blocchi può essere recuperato seguendo i passaggi indicati nel paragrafo [Recupero dei blocchi](#1-1-recupero-dei-blocchi-fir).

> 💡 **SUGGERIMENTO**
> 
> Consultare la documentazione di riferimento delle [API - vidimazione-formulari](javascript:loadApi('vidimazione-formulari')) per il dettaglio completo dei modelli dell'endpoint e degli eventuali parametri opzionali.

L'endpoint è di tipo **asincrono** e si basa sul pattern **NONBLOCK_PULL_REST** delle linee guida AgID per l’interoperabilità (vedi <a href="https://www.agid.gov.it/it/linee-guida" target="_blank">Linee guida</a>).
Una volta concluso correttamente l'invio della richiesta HTTP, si ottiene come risposta il valore `transazione_id`, ovvero un <a href="https://it.wikipedia.org/wiki/GUID" target="_blank">GUID</a> che identifica la transazione di elaborazione assegnata alla richiesta.

> ⚠️ **ATTENZIONE**
> 
> Ogni singola chiamata all'endpoint genera un solo FIR.

In seguito, tramite l'endpoint **<span style="color:#49cc90">GET</span> `<ambiente>/vidimazione-formulari/v1.0/{transazione_id}/status`** è possibile conoscere lo stato di elaborazione della richiesta.
Una volta che l'elaborazione si è conclusa, utilizzando l'endpoint **<span style="color:#49cc90">GET</span> `<ambiente>/vidimazione-formulari/v1.0/verifica/result`** è possibile ottenere l'esito dell'elaborazione.

Questo paragrafo descrive i passaggi necessari per la vidimazione di un nuovo FIR e per la verifica e il recupero dell'esito dell'elaborazione.

#### 1.2.1 Autenticazione

L'endpoint utilizzato richiede l'autenticazione, quindi è necessario seguire i passaggi indicati nel paragrafo [Autenticazione](javascript:loadPage('api-flussi-operativi-introduzione#autenticazione')).

#### 1.2.2 Recupero del blocco

Se non è già noto a priori l'identificativo del blocco da utilizzare, è possibile recuperarlo utilizzando i passaggi indicati nel paragrafo [Recupero dei blocchi FIR](#1-1-recupero-dei-blocchi-fir).

#### 1.2.3 Vidimazione

Il seguente esempio di codice C# mostra come vidimare un nuovo FIR:
```csharp
using Newtonsoft.Json;
using System.Net.Http;

string basePath = "https://<ambiente>/vidimazione-formulari/v1.0";
string codiceBlocco = "XXXX";

var client = new HttpClient();
// TODO: Inizializzare il client HTTP con gli header previsti per il tipo di richiesta (vedi pattern AgID ID_AUTH_REST_02)

// Invio della richiesta HTTP
var response = await client.PostAsync($"{basePath}/{codiceBlocco}", null, cancellationToken);
if (response.IsSuccessStatusCode)
{
	string result = await response.Content.ReadAsStringAsync();
	var transazione = JsonConvert.DeserializeObject<TransazioneModel>(result);
	Guid transazioneId = transazione.TransazioneId;
}
```

#### 1.2.4 Recupero dell'esito di una transazione asincrona

L'endpoint per la vidimazione di un FIR è di tipo **asincrono** e restituisce come risposta il valore `transazione_id`, ovvero un GUID che identifica la transazione di elaborazione assegnata alla richiesta.
Per ottenere l'esito dell'elaborazione, seguire i passaggi indicati nel paragrafo [Recupero dell'esito di una transazione asincrona](javascript:loadPage('api-flussi-operativi-introduzione#recupero-dell-esito-di-una-transazione-asincrona')).

### 1.3 Recupero dei FIR vidimati

Per recuperare un singolo FIR vidimato, utilizzare l'endpoint **<span style="color:#49cc90">GET</span> `<ambiente>/vidimazione-formulari/v1.0/{codice_blocco}/{progressivo}`**.
Per ottenere una lista di più FIR vidimati, utilizzare l'endpoint **<span style="color:#49cc90">GET</span> `<ambiente>/vidimazione-formulari/v1.0/{codice_blocco}`**.

Nel primo caso, nel path occorre specificare i seguenti parametri obbligatori:
- **`{codice_blocco}`** è il codice del blocco da cui estrarre i FIR
- **`{progressivo}`** è il numero progressivo del FIR da recuperare.

Nel secondo caso, oltre a specificare il parametro obbligatorio **`{codice_blocco}`** nel path della richiesta, è possibile specificare nella query string i seguenti parametri opzionali:
- **`progressivo_iniziale`** è il progressivo numerico del primo FIR della lista da recuperare
- **`progressivo_finale`** è il progressivo numerico dell'ultimo FIR della lista da recuperare

> 💡 **SUGGERIMENTO**
> 
> Consultare la documentazione di riferimento delle [API - vidimazione-formulari](javascript:loadApi('vidimazione-formulari')) per il dettaglio completo dei modelli dell'endpoint e degli eventuali parametri opzionali.

Questo paragrafo descrive i passaggi necessari per recuperare uno o più FIR vidimati.

#### 1.3.1 Autenticazione

L'endpoint utilizzato richiede l'autenticazione, quindi è necessario seguire i passaggi indicati nel paragrafo [Autenticazione](javascript:loadPage('api-flussi-operativi-introduzione#autenticazione')).

#### 1.3.2 Ricezione dei dati

Il seguente esempio di codice C# mostra come recuperare i FIR vidimati all'interno di un blocco:

```csharp
using Newtonsoft.Json;
using System.Net.Http;

string basePath = "https://<ambiente>/vidimazione-formulari/v1.0";
string codiceBlocco = "XXXX";

var client = new HttpClient();
// TODO: Inizializzare il client HTTP con gli header previsti per il tipo di richiesta (vedi pattern AgID ID_AUTH_REST_02)

// Invio della richiesta HTTP
var response = await client.GetAsync($"{basePath}/{codiceBlocco}");

if (response.IsSuccessStatusCode)
{
	string result = await response.Content.ReadAsStringAsync();
	var firList = JsonConvert.DeserializeObject<EfirModel[]>(result);
}
```

#### 1.3.3 Interpretazione dei dati di vidimazione

Tra i campi restituiti nel modello contenente i dati di un FIR vidimato, è presente il campo **`xml`**. 
Il valore di questa proprietà è una stringa contenente un XML firmato con i dati vidimati.

La firma apposta sull'XML è conforme alle specfiche <a href="https://www.etsi.org/deliver/etsi_en/319100_319199/31913201/01.02.01_60/en_31913201v010201p.pdf" target="_blank">XAdES Baseline-B</a>.

Il certificato di firma apparirà come rilasciato dalla CA di dominio RENTRI per la firma di documenti, la corretta verifica della firma deve pertanto prevedere una policy di riconoscimento del certificato di CA come "trusted".

#### 1.3.4 Interpretazione dei dati sul QR code del FIR vidimato

Tra i campi restituiti nel modello contenente i dati di un FIR vidimato, è presente il campo **`qr_code_bytes`**.
Il valore di questa proprietà è un array di byte che viene utilizzato per la creazione dell'immagine del QR code 
incluso nella stampa PDF ottenibile attraverso l'endpoint **<span style="color:#49cc90">GET</span> `<ambiente>/vidimazione-formulari/v1.0/{codice_blocco}/{progressivo}/pdf`**. 
L'informazione che si estrae dal QR code prodotto dalla funzione di stampa del PDF è una codifica in base45 <a href="https://datatracker.ietf.org/doc/rfc9285/" target="_blank">(RFC 9285)</a> per essere facilmente estraibile e per diminuire la densità dell'immagine codificata.
Nel caso si utilizzino processi di stampa su carta dei formulari alternativi a quello offerto dalle API di vidimazione è comunque richiesto che questa sia la stringa da codificare nel QR Code.

L'array di byte che si ricava dalla decodifica base45 è una struttura dati binaria firmata nel formato <a href="https://datatracker.ietf.org/doc/rfc8152/" target="_blank">COSE_Sign1</a>.

Il payload dell'oggetto firmato è costituito da un "dictionary" (o mappa) in formato <a href="https://datatracker.ietf.org/doc/rfc8949/" target="_blank">CBOR</a> con indice numerico e contenente le seguenti informazioni:

	0. Numero FIR
	1. Codice fiscale soggetto
	2. Numero iscrizione Unità Locale (*)
	3. Data rilascio (secondi da Epoch)
	4. Sigla CCIAA
	5. Identificativo certificato
	6. Demo flag

Per la verifica della firma apposta sull'oggetto `COSE_Sign1` è necessario dapprima estrarre il payload e decodificare la struttura dati estraendo l'identificativo del certificato (indice 5). 
Il recupero del certificato di vidimazione con cui effettuare la verifica della firma avviene utilizzando questo identificativo nel parametro **`{certificato_id}`** 
dell'endpoint **<span style="color:#49cc90">GET</span> `<ambiente>/vidimazione-formulari/v1.0/certificati/{certificato_id}`**.

Il certificato di firma apparirà come rilasciato dalla CA di dominio RENTRI per la firma di documenti, la corretta verifica della firma deve pertanto prevedere una policy di riconoscimento del certificato di CA come "trusted".
  
La verifica di autenticità del numero FIR e la corrispondenza con quanto indicato nella stampa cartacea relativamente al soggetto intestatario può quindi essere eseguita in locale in modalità disconnessa.

```csharp
using Base45Utility;
using Newtonsoft.Json;
using PeterO.Cbor;
using System.Security.Cryptography.Cose;
using System.Security.Cryptography.X509Certificates;

string basePath = "https://<ambiente>/vidimazione-formulari/v1.0";
string qrCodeString = "QRCODESTRING"; // esito lettura QR code 

byte[] qrCodeBytes = new Base45().Decode(qrCodestring)

CoseSign1Message coseSign1 = CoseMessage.DecodeSign1(qrCodeBytes);
CBORObject decodedCborData = CBORObject.DecodeFromBytes(coseSign1.Content.Value.ToArray());

// Recupero informazioni dal payload
var numeroFir = decodedCborData.GetOrDefault(0, null).AsString();
var identificativoSoggetto = decodedCborData.GetOrDefault(1, null).AsString();
// ...
var certificateId = decodedCborData.GetOrDefault(5, null).AsString();

// Recupero certificato di vidimazione (se non già disponibile)
X509Certificate2 cert = null;

if (cert == null)
{
	var client = new HttpClient();
	// TODO: Inizializzare il client HTTP con gli header previsti per il tipo di richiesta (vedi pattern AgID ID_AUTH_REST_02)
	var response = await client.GetAsync($"{basePath}/certificati/{certificateId}");

	if (response.IsSuccessStatusCode) {
		var certificateChain = JsonConvert.DeserializeObject<CertificateModel[]>(await response.Content.ReadAsStringAsync());
		cert = new X509Certificate2(Convert.FromBase64String(certificateChain.First().Certificato));
	}
}

var isValid = coseSign1.VerifyEmbedded(cert.GetECDsaPublicKey());
```

### 1.4 Verifica esistenza numero FIR

Verifica l'esistenza del numero FIR, utilizzare l'endpoint **<span style="color:#49cc90">GET</span> `<ambiente>/vidimazione-formulari/v1.0/verifica/{numero_fir}`**.
Nel path occorre specificare il parametro obbligatorio **`{numero_fir}`** che corrisponde al numero del FIR.

> 💡 **SUGGERIMENTO**
> 
> Consultare la documentazione di riferimento delle [API - vidimazione-formulari](javascript:loadApi('vidimazione-formulari')) per il dettaglio completo dei modelli dell'endpoint e degli eventuali parametri opzionali.

Questo paragrafo descrive i passaggi necessari per verificare l'esistenza del numero FIR.

#### 1.4.1 Autenticazione

L'endpoint utilizzato richiede l'autenticazione, quindi è necessario seguire i passaggi indicati nel paragrafo [Autenticazione](javascript:loadPage('api-flussi-operativi-introduzione#autenticazione')).

#### 1.4.2 Ricezione dei dati

Il seguente esempio di codice C# mostra come verificare l'esistenza di un numero FIR:

```csharp
using Newtonsoft.Json;
using System.Net.Http;

string basePath = "https://<ambiente>/vidimazione-formulari/v1.0";
string numeroFir = "XX XXXX XX";

var client = new HttpClient();
// TODO: Inizializzare il client HTTP con gli header previsti per il tipo di richiesta (vedi pattern AgID ID_AUTH_REST_02)

// Invio della richiesta HTTP
var response = await client.GetAsync($"{basePath}/verifica/{numeroFir}");

if (response.IsSuccessStatusCode)
{
	string result = await response.Content.ReadAsStringAsync();
	var efir = JsonConvert.DeserializeObject<EfirPublicModel>(result);
}
```

## 2. Restituzione formulario copia cartacea

È possibile caricare la copia cartacea di un FIR con l'endpoint **<span style="color:#61affe">POST</span> `<ambiente>/formulari/v1.0/copia-cartacea/caricamento/{num_iscr_sito}`**.
Successivamente al caricamento della copia cartacea di un FIR, è possibile recuperarla utilizzando l'endpoint **<span style="color:#49cc90">GET</span> `<ambiente>/formulari/v1.0/copia-cartacea/caricamento/{num_iscr_sito}`**.
Nei path occorre specificare il parametro obbligatorio **`{num_iscr_sito}`** che è il numero iscrizione unità locale rilasciato all'iscrizione (ad esempio: `OP123XXXXXXXX00-PD00001`).

Il caricamento della copia cartacea viene effettuato dall'ultimo trasportatore che ha avuto in carico il rifiuto prima della consegna al destinatario

### 2.1 Caricamento della copia cartacea di un FIR

Per caricare la copia cartacea di un FIR, utilizzare l'endpoint **<span style="color:#61affe">POST</span> `<ambiente>/formulari/v1.0/copia-cartacea/caricamento/{num_iscr_sito}`**.
Nel path occorre specificare il parametro obbligatorio **`{num_iscr_sito}`** che è il numero iscrizione unità locale rilasciato all'iscrizione (ad esempio: `OP123XXXXXXXX00-PD00001`).

> 💡 **SUGGERIMENTO**
> 
> Consultare la documentazione di riferimento delle [API - formulari](javascript:loadApi('formulari')) per il dettaglio completo dei modelli dell'endpoint e degli eventuali parametri opzionali.

Questo paragrafo descrive i passaggi necessari per caricare la copia cartacea di un FIR.

#### 2.1.1 Autenticazione

L'endpoint utilizzato richiede l'autenticazione, quindi è necessario seguire i passaggi indicati nel paragrafo [Autenticazione](javascript:loadPage('api-flussi-operativi-introduzione#autenticazione')).

#### 2.1.2 Trasmissione della copia cartacea

Il seguente esempio di codice C# mostra come caricare la copia cartacea di un FIR:

```csharp
using Newtonsoft.Json;
using System.Net.Http;

string basePath = "https://<ambiente>/formulari/v1.0";
string numIscrSito = "OP123XXXXXXXX00-PD00001";
string filePath = @"C:\fir";

var client = new HttpClient();
// TODO: Inizializzare il client HTTP con gli header previsti per il tipo di richiesta (vedi pattern AgID ID_AUTH_REST_02)

var content = new StringContent(
	JsonConvert.SerializeObject(new
	{
		FileContent = File.ReadAllBytes($@"{filePath}\nome-file-copia-cartacea.pdf"),
		NomeFile = "nome-file-copia-cartacea.pdf",
		Mime = "application/pdf",
		NumeroFir = "XX XXXX XX",
		DataEmissione = DateTime.UtcNow,
		Note = "Note...",
		Produttore = new
		{
			Identificativo = "01122334455",
			NumIscrSito = "OP000XXXXXXXX12-CB0001",
			Denominazione = "Denominazione Produttore",
		},
	}),
	System.Text.Encoding.UTF8,
	"application/json"
);

// TODO: Firmare il contenuto (vedi pattern AgID INTEGRITY_REST_01)

// Invio della richiesta HTTP
var response = await client.PostAsync($"{basePath}/copia-cartacea/caricamento/{numIscrSito}", content, cancellationToken);
if (response.IsSuccessStatusCode)
{
	string result = await response.Content.ReadAsStringAsync();
	var transazione = JsonConvert.DeserializeObject<TransazioneModel>(result);
	Guid transazioneId = transazione.TransazioneId;
}
```


#### 2.1.3 Recupero dell'esito di una transazione asincrona

L'endpoint per la trasmissione della copia cartacea è di tipo **asincrono** e restituisce come risposta il valore `transazione_id`, ovvero un GUID che identifica la transazione di elaborazione assegnata alla richiesta.
Per ottenere l'esito dell'elaborazione, seguire i passaggi indicati nel paragrafo [Recupero dell'esito di una transazione asincrona](javascript:loadPage('api-flussi-operativi-introduzione#recupero-dell-esito-di-una-transazione-asincrona')).

### 2.2 Recupero delle copie FIR cartaceo caricate

Per recuperare le proprie copie FIR cartaceo caricate, utilizzare l'endpoint **<span style="color:#49cc90">GET</span> `<ambiente>/formulari/v1.0/copia-cartacea/caricamento/{num_iscr_sito}`**.
Nel path occorre specificare il parametro obbligatorio **`{num_iscr_sito}`** che è il numero iscrizione unità locale rilasciato all'iscrizione (ad esempio: `OP123XXXXXXXX00-PD00001`).

> 💡 **SUGGERIMENTO**
> 
> Consultare la documentazione di riferimento delle [API - formulari](javascript:loadApi('formulari')) per il dettaglio completo dei modelli dell'endpoint e degli eventuali parametri opzionali.

Questo paragrafo descrive i passaggi necessari per recuperare le copie FIR cartaceo caricate.

#### 2.2.1 Autenticazione

L'endpoint utilizzato richiede l'autenticazione, quindi è necessario seguire i passaggi indicati nel paragrafo [Autenticazione](javascript:loadPage('api-flussi-operativi-introduzione#autenticazione')).

#### 2.2.2 Recupero elenco copie FIR cartaceo caricate

Il seguente esempio di codice C# mostra come recuperare l'elenco delle copie FIR cartaceo caricate:

```csharp
using Newtonsoft.Json;
using System.Net.Http;

string basePath = "https://<ambiente>/formulari/v1.0";
string numIscrSito = "OP123XXXXXXXX00-PD00001";

var client = new HttpClient();
// TODO: Inizializzare il client HTTP con gli header previsti per il tipo di richiesta (vedi pattern AgID ID_AUTH_REST_02)

// Invio della richiesta HTTP
var response = await client.GetAsync($"{basePath}/copia-cartacea/caricamento/{numIscrSito}");
if (response.IsSuccessStatusCode)
{
	string result = await response.Content.ReadAsStringAsync();
	var elencoCopie = JsonConvert.DeserializeObject<CopiaCartaceaResult[]>(result);
}
```

#### 2.2.3 Recupero copia FIR cartaceo caricata

Il recupero della copia FIR cartaceo caricata prevede l'utilizzo di due endpoint distinti: il primo per recuperare i dati della copia cartacea e il secondo per recuperare il documento associato.

##### 2.2.3.1 Recupero dettaglio copia FIR cartaceo

Per recuperare il dettaglio della copia FIR cartaceo, utilizzare l'endpoint **<span style="color:#49cc90">GET</span> `<ambiente>/formulari/v1.0/copia-cartacea/caricamento/{num_iscr_sito}/{identificativo}`**.
Nel path occorre specificare i seguenti parametri obbligatori:
- **`{num_iscr_sito}`** che è il numero iscrizione unità locale rilasciato all'iscrizione (ad esempio: `OP123XXXXXXXX00-PD00001`).
- **`{identificativo}`** che è l'identificativo della copia del FIR cartaceo.

Il seguente esempio di codice C# mostra come recuperare il dettaglio della copia FIR cartaceo caricata:

```csharp
using Newtonsoft.Json;
using System.Net.Http;

string basePath = "https://<ambiente>/formulari/v1.0";
string numIscrSito = "OP123XXXXXXXX00-PD00001";
string identificativo = "XXXXX";

var client = new HttpClient();
// TODO: Inizializzare il client HTTP con gli header previsti per il tipo di richiesta (vedi pattern AgID ID_AUTH_REST_02)

// Invio della richiesta HTTP
var response = await client.GetAsync($"{basePath}/copia-cartacea/caricamento/{numIscrSito}/{identificativo}");
if (response.IsSuccessStatusCode)
{
	string result = await response.Content.ReadAsStringAsync();
	var copiaCartacea = JsonConvert.DeserializeObject<CopiaCartaceaResult>(result);
}
```

##### 2.2.3.2 Recupero documento copia FIR cartaceo caricata

Per recuperare il dettaglio della copia FIR cartaceo, utilizzare l'endpoint **<span style="color:#49cc90">GET</span> `<ambiente>/formulari/v1.0/copia-cartacea/caricamento/{num_iscr_sito}/{identificativo}/documento`**.
Nel path occorre specificare i seguenti parametri obbligatori:
- **`{num_iscr_sito}`** che è il numero iscrizione unità locale rilasciato all'iscrizione (ad esempio: `OP123XXXXXXXX00-PD00001`).
- **`{identificativo}`** che è l'identificativo della copia del FIR cartaceo.

Il seguente esempio di codice C# mostra come recuperare il documento della copia FIR cartaceo caricata:

```csharp
using Newtonsoft.Json;
using System.Net.Http;

string basePath = "https://<ambiente>/formulari/v1.0";
string numIscrSito = "OP123XXXXXXXX00-PD00001";
string identificativo = "XXXXX";
string filePath = @"C:\fir";

var client = new HttpClient();
// TODO: Inizializzare il client HTTP con gli header previsti per il tipo di richiesta (vedi pattern AgID ID_AUTH_REST_02)

// Invio della richiesta HTTP
var response = await client.GetAsync($"{basePath}/copia-cartacea/caricamento/{numIscrSito}/{identificativo}/documento");
if (response.IsSuccessStatusCode)
{
	string result = await response.Content.ReadAsStringAsync();
    var copiaCartacea = JsonConvert.DeserializeObject<DownloadableBaseResponse>(result);

	// Scrittura del file
    File.WriteAllBytes($@"{filePath}\{copiaCartacea.NomeFile}", Convert.FromBase64String(copiaCartacea.Content));
}
```

### 2.3 Recupero delle copie FIR cartaceo rese disponibili dal trasportatore

A seguito del caricamento della copia FIR cartaceo da parte del trasportatore, i soggetti destinatari della copia FIR cartaceo (tipicamente il produttore ed eventuali altri trasportatori ed intermediari iscritti) possono prendere visione della copia FIR cartaceo caricata dal trasportatore, ed eventualmente confermare la presa visione al soggetto che ha caricato la copia FIR cartaceo. Con l'operazione di conferma i soggetti iscritti destinatari della copia FIR cartacea potranno associarla al contesto di una specifica unità locale iscritta.

#### 2.3.1 Controllo delle copie FIR cartaceo rese disponibili

Per controllare quali copie del FIR cartaceo sono state rese disponibili al soggetto o all'unità locale (in qualità di produttore o altro soggetto coinvolto nella movimentazione del rifiuto) è possibile utilizzare l'endpoint **<span style="color:#49cc90">GET</span> `<ambiente>/formulari/v1.0/copia-cartacea/conferma/{identificativo_soggetto}`**.
Nel path occorre specificare il parametro obbligatorio **`{identificativo_soggetto}`** valorizzato con il codice fiscale del soggetto che richiede le copie cartacee rese disponibili.
All'endpoint possono essere indicati dei parametri per filtrare le copie FIR cartaceo caricate dai trasportatori:
- **`data_emissione_a`** e **`data_emissione_da`** per filtrare le copie disponibili sulla base della data di emissione del FIR;
- **`numero_fir`** per filtrare sulla base del numero FIR della copia del FIR cartaceo;
- **`confermate`** per filtrare le copie FIR cartaceo per le quali si è data esplicita conferma di presa visione con l'apposito endpoint (vedi paragrafo [Conferma della presa visione di un FIR cartaceo](javascript:loadPage('api-flussi-operativi-formulari#2-3-2-conferma-della-presa-visione-di-un-fir-cartaceo')));
- **`num_iscr_sito`** per filtrare le copie FIR cartaceo sulla base dell numero di iscrizione dell'unità locale nella quale si è data conferma della presa visione.

##### 2.3.1.1 Recupero elenco copie FIR cartaceo caricate disponibili

Il seguente esempio di codice C# mostra come recuperare l'elenco delle copie FIR cartaceo rese disponibili da un trasportatore:

```csharp
using Newtonsoft.Json;
using System.Net.Http;

string basePath = "https://<ambiente>/formulari/v1.0";
string identificativoSoggetto = "XXXXX";

var client = new HttpClient();
// TODO: Inizializzare il client HTTP con gli header previsti per il tipo di richiesta (vedi pattern AgID ID_AUTH_REST_02)

// Invio della richiesta HTTP
var response = await client.GetAsync($"{basePath}/copia-cartacea/conferma/{identificativoSoggetto}");
if (response.IsSuccessStatusCode)
{
	string result = await response.Content.ReadAsStringAsync();
	var elencoCopie = JsonConvert.DeserializeObject<CopiaCartaceaResult[]>(result);
}
```

##### 2.3.1.2 Dettaglio delle copie FIR cartaceo disponibili

Ad ogni copia FIR cartaceo caricata viene associato dal sistema un identificativo univoco. In modo analogo a come mostrato nell'esempio precedente è possibile recuperare il dettaglio di una singola copia FIR cartaceo disponibile invocando l'endpoint **<span style="color:#49cc90">GET</span> `<ambiente>/formulari/v1.0/copia-cartacea/conferma/{identificativo_soggetto}/{identificativo}`**, specificando nel path anche il parametro obbligatorio **`{identificativo}`** con il valore dell'identificativo univoco della copia FIR cartaceo.


#### 2.3.2 Conferma della presa visione di un FIR cartaceo

È possibile confermare la presa visione di un FIR cartaceo con l'endpoint **<span style="color:#fca130">PUT</span> `<ambiente>/formulari/v1.0/copia-cartacea/conferma/{identificativo_soggetto}`**. Con questa operazione il soggetto a cui è destinata una copia FIR cartaceo associa una data di presa visione al documento e rende nota la presa visione al soggetto che ha effettuato il caricamento. Per i soggetti iscritti, con questa operazione è possibile anche collocare la copia cartacea nel contesto di una specifica unità locale iscritta.
Dopo l'avvenuta presa visione del documento da parte di uno dei soggetti destinatari, la copia del FIR cartaceo non è più eliminabile da parte del soggetto che ne ha effettuato il caricamento.

##### 2.3.2.1 Operazione di conferma della presa visione di un FIR cartaceo

Il seguente esempio di codice C# mostra come un _produttore_ iscritto a cui un _trasportatore_ ha reso disponibile la copia del FIR cartaceo conferma la presa visione del documento.


```csharp
using Newtonsoft.Json;
using System.Net.Http;

string basePath = "https://<ambiente>/formulari/v1.0";
string identificativoSoggetto = "XXXXX";
string identificativoCopiaCartacea = "CCAB0000000000111";
string numIscrSito = "OP456XXXXXXXX00-PD00002";

var client = new HttpClient();
// TODO: Inizializzare il client HTTP con gli header previsti per il tipo di richiesta (vedi pattern ID_AUTH_REST_02)

var datiConferma = $@"{{
    ""identificativo"": ""{identificativoCopiaCartacea}"",
    ""num_iscr_sito"": ""{numIscrSito}"",
    ""ruolo"": ""Produttore""
}}";
var content = new StringContent(authorizeConfirmation, Encoding.UTF8, "application/json");
// TODO: Firmare il contenuto (vedi pattern INTEGRITY_REST_01)

// Invio della richiesta HTTP
var response = await client.PutAsync($"{basePath}/copia-cartacea/conferma/{identificativo_soggetto}");
```

---

*Ultimo aggiornamento: 21/01/2025*