# Registri e movimenti (o registrazioni)

Nei paragrafi che seguono sono descritti i principali flussi operativi degli endpoint dei servizi RENTRI legati ai **Registri di C/S e ai movimenti (o registrazioni)**.

La presente documentazione fa riferimento alle **API RENTRI v1.0**. Nelle URL degli endpoint di seguito indicate non viene specificato il server, in quanto dipende dall'ambiente su cui si sta operando. Gli indirizzi dei server per gli ambienti **DEMO** e **PRODUZIONE** sono:

```http
https://demoapi.rentri.gov.it/...
https://api.rentri.gov.it/...
```

## 1. Recupero delle unità locali

Per recuperare la lista delle unità locali, utilizzare l'endpoint:

&emsp;**<span style="color:#49cc90">GET</span> `<ambiente>/anagrafiche/v1.0/operatore/{num_iscr}/siti`**

Nel path occorre specificare il parametro obbligatorio **`{num_iscr}`** che corrisponde al numero iscrizione operatore rilasciato all'iscrizione (ad esempio: `OP123XXXXXXXX00`).

L'endpoint utilizza la paginazione per la restituzione dei risultati. È quindi possibile specificare i seguenti parametri opzionali negli header della richiesta:
- **`Paging-Page`** è il numero di pagina (default e min: 1).
- **`Paging-PageSize`** è la dimensione della singola pagina (default e max: 100).

> 💡 **SUGGERIMENTO**
> 
> Consultare la documentazione di riferimento delle [API - anagrafiche](javascript:loadApi('anagrafiche')) per il dettaglio completo dei modelli dell'endpoint e degli eventuali parametri opzionali.

> ℹ️ **IMPORTANTE**
> 
> Per i **Soggetti delegati**, fare riferimento agli endpoint con il suffisso **`/soggetto-delegato/`** ed ai relativi modelli, che potrebbero differire.

Questo paragrafo descrive i passaggi necessari per recuperare una o più unità locali di un soggetto.

### 1.1 Autenticazione

L'endpoint utilizzato richiede l'autenticazione, quindi è necessario seguire i passaggi indicati nel paragrafo [Autenticazione](javascript:loadPage('api-flussi-operativi-introduzione#autenticazione')).

### 1.2 Ricezione dei dati

Il seguente esempio di codice C# mostra come recuperare le unità locali:

```csharp
using Newtonsoft.Json;
using System.Net.Http;

string basePath = "https://<ambiente>/anagrafiche/v1.0";
string numIscr = "OP123XXXXXXXX00";

var client = new HttpClient();
// TODO: Inizializzare il client HTTP con gli header previsti per il tipo di richiesta (vedi pattern AgID ID_AUTH_REST_02)

// Invio della richiesta HTTP
var response = await client.GetAsync($"{basePath}/operatore/{numIscr}/siti");
if (response.IsSuccessStatusCode)
{
	string result = await response.Content.ReadAsStringAsync();
	var siti = JsonConvert.DeserializeObject<SitoModel[]>(result);
}
```

## 2. Apertura di un nuovo registro

Per aprire un nuovo registro, utilizzare l'endpoint:

&emsp;**<span style="color:#61affe">POST</span> `<ambiente>/anagrafiche/v1.0/registri`**

Nel body occorre specificare i seguenti parametri obbligatori:

- - **`num_iscr_sito`** è il numero iscrizione unità locale rilasciato all'iscrizione (ad esempio: `OP123XXXXXXXX00-PD00001`).
- **`attivita`** sono le attività legate al registro.
- **`descrizione`** è la descrizione.

> 💡 **SUGGERIMENTO**
> 
> Consultare la documentazione di riferimento delle [API - anagrafiche](javascript:loadApi('anagrafiche')) per il dettaglio completo dei modelli dell'endpoint e degli eventuali parametri opzionali.

> ℹ️ **IMPORTANTE**
> 
> Per i **Soggetti delegati**, fare riferimento agli endpoint con il suffisso **`/soggetto-delegato/`** ed ai relativi modelli, che potrebbero differire.

Questo paragrafo descrive i passaggi necessari per creare un registro associato ad un'unità locale.

### 2.1 Autenticazione

L'endpoint utilizzato richiede l'autenticazione, quindi è necessario seguire i passaggi indicati nel paragrafo [Autenticazione](javascript:loadPage('api-flussi-operativi-introduzione#autenticazione')).

### 2.2 Invio dei dati

Il seguente esempio di codice C# mostra come aprire un nuovo registro:

```csharp
using Newtonsoft.Json;
using System.Net.Http;

string basePath = "https://<ambiente>/anagrafiche/v1.0";
string numIscrSito = "OP123XXXXXXXX00-PD00001";

var client = new HttpClient();
// TODO: Inizializzare il client HTTP con gli header previsti per il tipo di richiesta (vedi pattern AgID ID_AUTH_REST_02)

// Creazione del payload con i dati del registro
var registro = @"{""numIscrSito"": ""OP123XXXXXXXX00-PD00001"", ""attivita"": [ ""Produzione"", ""Recupero"", ""Smaltimento"" ], ""descrizione"": ""Test"" }";
var content = new StringContent(registro, System.Text.Encoding.UTF8, "application/json");
// TODO: Firmare il contenuto (vedi pattern AgID INTEGRITY_REST_01)

// Invio della richiesta HTTP
var response = await client.PostAsync($"{basePath}/registri", content, cancellationToken);
if (response.IsSuccessStatusCode)
{
	string result = await response.Content.ReadAsStringAsync();
	var createRegistro = JsonConvert.DeserializeObject<CreateRegistroResponse>(result);
	string identificativoRegistro = createRegistro.Identificativo;
}
```

## 3. Recupero dei registri

Per recuperare uno o più registri, utilizzare l'endpoint:

&emsp;**<span style="color:#49cc90">GET</span> `<ambiente>/anagrafiche/v1.0/operatore/{num_iscr}/siti/{num_iscr_sito}/registri`**

Nel path occorre specificare i seguenti parametri obbligatori:
- **`{num_iscr}`** è il numero iscrizione operatore rilasciato all'iscrizione (ad esempio: `OP123XXXXXXXX00`).
- **`{num_iscr_sito}`** è il numero iscrizione unità locale rilasciato all'iscrizione (ad esempio: `OP123XXXXXXXX00-PD00001`).

L'endpoint utilizza la paginazione per la restituzione dei risultati. È quindi possibile specificare i seguenti parametri opzionali negli header della richiesta:
- **`Paging-Page`** è il numero di pagina (default e min: 1).
- **`Paging-PageSize`** è la dimensione della singola pagina (default e max: 100).

> 💡 **SUGGERIMENTO**
> 
> Consultare la documentazione di riferimento delle [API - anagrafiche](javascript:loadApi('anagrafiche')) per il dettaglio completo dei modelli dell'endpoint e degli eventuali parametri opzionali.

> ℹ️ **IMPORTANTE**
> 
> Per i **Soggetti delegati**, fare riferimento agli endpoint con il suffisso **`/soggetto-delegato/`** ed ai relativi modelli, che potrebbero differire.

Questo paragrafo descrive i passaggi necessari per recuperare uno o più registri associati ad un'unità locale.

### 3.1 Autenticazione

L'endpoint utilizzato richiede l'autenticazione, quindi è necessario seguire i passaggi indicati nel paragrafo [Autenticazione](javascript:loadPage('api-flussi-operativi-introduzione#autenticazione')).

### 3.2 Ricezione dei dati

Il seguente esempio di codice C# mostra come recuperare i registri:

```csharp
using Newtonsoft.Json;
using System.Net.Http;

string basePath = "https://<ambiente>/anagrafiche/v1.0";
string numIscr = "OP123XXXXXXXX00";
string numIscrSito = "OP123XXXXXXXX00-PD00001";

var client = new HttpClient();
// TODO: Inizializzare il client HTTP con gli header previsti per il tipo di richiesta (vedi pattern AgID ID_AUTH_REST_02)

// Invio della richiesta HTTP
var response = await client.GetAsync($"{basePath}/operatore/{numIscr}/siti/{numIscrSito}/registri");
if (response.IsSuccessStatusCode)
{
	string result = await response.Content.ReadAsStringAsync();
	var registri = JsonConvert.DeserializeObject<RegistroModel[]>(result);
}
```

## 4. Recupero della vidimazione di un registro

Per recuperare la vidimazione virtuale di un registro, utilizzare l'endpoint:

&emsp;**<span style="color:#49cc90">GET</span> `<ambiente>/anagrafiche/v1.0/registri/{identificativo}/xml`**

Nel path occorre specificare il parametro obbligatorio **`{identificativo_registro}`** che corrisponde all'identificativo RENTRI assegnato al registro (ad esempio: `RXXXXXXXXX0`).

> 💡 **SUGGERIMENTO**
> 
> Consultare la documentazione di riferimento delle [API - anagrafiche](javascript:loadApi('anagrafiche')) per il dettaglio completo dei modelli dell'endpoint e degli eventuali parametri opzionali.

> ℹ️ **IMPORTANTE**
> 
> Per i **Soggetti delegati**, fare riferimento agli endpoint con il suffisso **`/soggetto-delegato/`** ed ai relativi modelli, che potrebbero differire.

Questo paragrafo descrive i passaggi necessari per recuperare la vidimazione virtuale di un registro.

### 4.1 Autenticazione

L'endpoint utilizzato richiede l'autenticazione, quindi è necessario seguire i passaggi indicati nel paragrafo [Autenticazione](javascript:loadPage('api-flussi-operativi-introduzione#autenticazione')).

### 4.2 Ricezione dei dati

Il seguente esempio di codice C# mostra come recuperare il file in formato XML della vidimazione del registro:

```csharp
using Newtonsoft.Json;
using System.Net.Http;

string basePath = "https://<ambiente>/anagrafiche/v1.0";
string identificativoRegistro = "RXXXXXXXXX0";
string filePath = @"C:\temp";

var client = new HttpClient();
// TODO: Inizializzare il client HTTP con gli header previsti per il tipo di richiesta (vedi pattern AgID ID_AUTH_REST_02)

// Invio della richiesta HTTP
var response = await client.GetAsync($"{basePath}/operatore/registri/{identificativoRegistro}/xml");
if (response.IsSuccessStatusCode)
{
	string result = await response.Content.ReadAsStringAsync();
	var vidimazione = JsonConvert.DeserializeObject<DownloadableBaseResponse>(result);
	var xml = Encoding.UTF8.GetString(vidimazione.Content); // Contenuto del file XML firmato digitalmente
	File.WriteAllBytes(Path.Combine(filePath, vidimazione.NomeFile!), vidimazione.Content);
}
```

## 5. Trasmissione dei movimenti di un registro

Per inviare i dati di uno o più movimenti, utilizzare l'endpoint:

&emsp;**<span style="color:#61affe">POST</span> `<ambiente>/dati-registri/v1.0/operatore/{identificativo_registro}/movimenti`**

Nel path occorre specificare il parametro obbligatorio **`{identificativo_registro}`** che corrisponde all'identificativo RENTRI assegnato al registro (ad esempio: `RXXXXXXXXX0`).
Nel body della richiesta occorre specificare tutti i dati necessari per l'invio dei movimenti.

> 💡 **SUGGERIMENTO**
> 
> Consultare la documentazione di riferimento delle [API - dati-registri](javascript:loadApi('dati-registri')) per il dettaglio completo dei modelli dell'endpoint e degli eventuali parametri opzionali.

> ℹ️ **IMPORTANTE**
> 
> Per i **Soggetti delegati**, fare riferimento agli endpoint con il suffisso **`/soggetto-delegato/`** ed ai relativi modelli, che potrebbero differire.

L'endpoint è di tipo **asincrono** e si basa sul pattern **NONBLOCK_PULL_REST** delle linee guida AgID per l’interoperabilità (vedi <a href="https://www.agid.gov.it/it/linee-guida" target="_blank">Linee guida</a>).
Una volta concluso correttamente l'invio della richiesta HTTP, si ottiene come risposta il valore `transazione_id`, ovvero un <a href="https://it.wikipedia.org/wiki/GUID" target="_blank">GUID</a> che identifica la transazione di elaborazione assegnata alla richiesta.

> ⚠️ **ATTENZIONE**
> 
> Ogni singola chiamata all'endpoint permette l'invio di un massimo di **1000 movimenti**.

In seguito, tramite l'endpoint **<span style="color:#49cc90">GET</span> `<ambiente>/dati-registri/v1.0/{transazione_id}/status`** è possibile conoscere lo stato di elaborazione della richiesta.
Una volta che l'elaborazione si è conclusa, utilizzando l'endpoint **<span style="color:#49cc90">GET</span> `<ambiente>/dati-registri/v1.0/{transazione_id}/result`** è possibile ottenere l'esito dell'elaborazione.

Questo paragrafo descrive i passaggi necessari per la trasmissione dei movimenti relativi ad un registro e per la verifica e il recupero dell'esito dell'elaborazione.

### 5.1 Autenticazione

L'endpoint utilizzato richiede l'autenticazione, quindi è necessario seguire i passaggi indicati nel paragrafo [Autenticazione](javascript:loadPage('api-flussi-operativi-introduzione#autenticazione')).

### 5.2 Recupero del registro

Se non è già noto a priori l'identificativo del registro da utilizzare, è possibile recuperarlo utilizzando i passaggi indicati nel paragrafo [Recupero dei registri](#3-recupero-dei-registri).

### 5.3 Invio dei movimenti

I seguenti esempi di codice C# mostrano 3 casi differenti di invio dei dati dei movimenti relativi a:
- nuovi movimenti;
- rettifiche di movimenti esistenti;
- annullamenti di movimenti esistenti.

> ℹ️ **IMPORTANTE**
> 
> Nei casi in cui è necessario specificare movimenti esistenti (**`riferimento_operazione`**, **`numero_registrazione_rettifica`**, **`numero_registrazione_annullata`**) è possibile utilizzare in maniera **mutuamente esclusiva**, l'anno di riferimento e il progressivo della registrazione oppure l'identificativo rilasciato dal RENTRI.

#### 5.3.1 Invio di nuovi movimenti

Il seguente esempio di codice C# mostra come inviare i dati di un nuovo movimento:

```csharp
using Newtonsoft.Json;
using System.Net.Http;

string basePath = "https://<ambiente>/dati-registri/v1.0";
string identificativoRegistro = "RXXXXXXXXX0";

var client = new HttpClient();
// TODO: Inizializzare il client HTTP con gli header previsti per il tipo di richiesta (vedi pattern AgID ID_AUTH_REST_02)

// Creazione del payload con il movimento da inviare
var movimenti = @"[{""riferimenti"":{""numero_registrazione"":{""anno"":2024,""progressivo"":1},""data_ora_registrazione"":""2024-05-09T09:16:54.729Z"",""causale_operazione"":""aT""},
	""rifiuto"":{""codice_eer"":""150101"",""stato_fisico"":""SP"",""quantita"":{""valore"":5000.1234,""unita_misura"":""kg""}}}]";
var content = new StringContent(movimenti, System.Text.Encoding.UTF8, "application/json");
// TODO: Firmare il contenuto (vedi pattern AgID INTEGRITY_REST_01)

// Invio della richiesta HTTP
var response = await client.PostAsync($"{basePath}/operatore/{identificativoRegistro}/movimenti", content, cancellationToken);
if (response.IsSuccessStatusCode)
{
	string result = await response.Content.ReadAsStringAsync();
	var transazione = JsonConvert.DeserializeObject<TransazioneModel>(result);
	Guid transazioneId = transazione.TransazioneId;
}
```

#### 5.3.2 Invio di rettifiche di movimenti

Il seguente esempio di codice C# mostra come inviare una rettifica di un movimento esistente:

```csharp
using Newtonsoft.Json;
using System.Net.Http;

string basePath = "https://<ambiente>/dati-registri/v1.0";
string identificativoRegistro = "RXXXXXXXXX0";

var client = new HttpClient();
// TODO: Inizializzare il client HTTP con gli header previsti per il tipo di richiesta (vedi pattern AgID ID_AUTH_REST_02)

// Creazione del payload con la rettifica da inviare
var movimenti = @"[{""riferimenti"":{""numero_registrazione"":{""anno"":2024,""progressivo"":2},""data_ora_registrazione"":""2024-05-09T10:15:45.219Z"",""causale_operazione"":""aT"",
	""numero_registrazione_rettifica"":{""anno"":2024,""progressivo"":1}},
	""rifiuto"":{""codice_eer"":""150101"",""stato_fisico"":""SP"",""quantita"":{""valore"":6000.9876,""unita_misura"":""kg""}}}]";
var content = new StringContent(movimenti, System.Text.Encoding.UTF8, "application/json");
// TODO: Firmare il contenuto (vedi pattern AgID INTEGRITY_REST_01)

// Invio della richiesta HTTP
var response = await client.PostAsync($"{basePath}/operatore/{identificativoRegistro}/movimenti", content, cancellationToken);
if (response.IsSuccessStatusCode)
{
	string result = await response.Content.ReadAsStringAsync();
	var transazione = JsonConvert.DeserializeObject<TransazioneModel>(result);
	Guid transazioneId = transazione.TransazioneId;
}
```

#### 5.3.3 Invio di annullamenti di movimenti

Il seguente esempio di codice C# mostra come inviare un annullamento di un movimento esistente:

```csharp
using Newtonsoft.Json;
using System.Net.Http;

string basePath = "https://<ambiente>/dati-registri/v1.0";
string identificativoRegistro = "RXXXXXXXXX0";

var client = new HttpClient();
// TODO: Inizializzare il client HTTP con gli header previsti per il tipo di richiesta (vedi pattern AgID ID_AUTH_REST_02)

// Creazione del payload con l'annullamento da inviare
var movimenti = @"[{""numero_registrazione"":{""anno"":2024,""progressivo"":3},""data_ora_registrazione"":""2024-05-09T10:15:45.219Z"",
	""numero_registrazione_annullata"":{""anno"":2024,""progressivo"":1},
	""annotazioni"":""Annullamento posizione n. 2024/1""}]";
var content = new StringContent(movimenti, System.Text.Encoding.UTF8, "application/json");
// TODO: Firmare il contenuto (vedi pattern AgID INTEGRITY_REST_01)

// Invio della richiesta HTTP
var response = await client.PostAsync($"{basePath}/operatore/{identificativoRegistro}/movimenti", content, cancellationToken);
if (response.IsSuccessStatusCode)
{
	string result = await response.Content.ReadAsStringAsync();
	var transazione = JsonConvert.DeserializeObject<TransazioneModel>(result);
	Guid transazioneId = transazione.TransazioneId;
}
```

### 5.4 Recupero dell'esito della transazione

L'endpoint per la trasmissione dei movimenti di un registro è di tipo **asincrono** e restituisce come risposta il valore `transazione_id`, ovvero un GUID che identifica la transazione di elaborazione assegnata alla richiesta.
Per ottenere l'esito dell'elaborazione, seguire i passaggi indicati nel paragrafo [Recupero dell'esito di una transazione asincrona](javascript:loadPage('api-flussi-operativi-introduzione#recupero-dell-esito-di-una-transazione-asincrona')).

## 6. Recupero dei movimenti di un registro

Per recuperare i movimenti di un registro, utilizzare l'endpoint:

&emsp;**<span style="color:#49cc90">GET</span> `<ambiente>/dati-registro/v1.0/operatore/{identificativo_registro}/movimenti`**

Nel path occorre specificare il parametro obbligatorio **`{identificativo_registro}`** che corrisponde all'identificativo RENTRI assegnato al registro (ad esempio: `RXXXXXXXXX0`).

L'endpoint utilizza la paginazione per la restituzione dei risultati. È quindi possibile specificare i seguenti parametri opzionali negli header della richiesta:
- **`Paging-Page`** è il numero di pagina (default e min: 1).
- **`Paging-PageSize`** è la dimensione della singola pagina (default e max: 100).

> 💡 **SUGGERIMENTO**
> 
> Consultare la documentazione di riferimento delle [API - anagrafiche](javascript:loadApi('dati-registri')) per il dettaglio completo dei modelli dell'endpoint e degli eventuali parametri opzionali.

> ℹ️ **IMPORTANTE**
> 
> Per i **Soggetti delegati**, fare riferimento agli endpoint con il suffisso **`/soggetto-delegato/`** ed ai relativi modelli, che potrebbero differire.

Questo paragrafo descrive i passaggi necessari per recuperare i movimenti di un registro.

### 6.1 Autenticazione

L'endpoint utilizzato richiede l'autenticazione, quindi è necessario seguire i passaggi indicati nel paragrafo [Autenticazione](javascript:loadPage('api-flussi-operativi-introduzione#autenticazione')).

### 6.2 Ricezione dei dati

Il seguente esempio di codice C# mostra come recuperare i registri:

```csharp
using Newtonsoft.Json;
using System.Net.Http;

string basePath = "https://<ambiente>/dati-registri/v1.0";
string identificativoRegistro = "RXXXXXXXXX0";

var client = new HttpClient();
// TODO: Inizializzare il client HTTP con gli header previsti per il tipo di richiesta (vedi pattern AgID ID_AUTH_REST_02)

// Invio della richiesta HTTP
var response = await client.GetAsync($"{basePath}/operatore/{identificativoRegistro}/movimenti");
if (response.IsSuccessStatusCode)
{
	string result = await response.Content.ReadAsStringAsync();
	var movimenti = JsonConvert.DeserializeObject<DatiMovimentoModel[]>(result);
}
```

## 7. Creazione e firma di un'esportazione

La <a href="/docs?page=registro-digitale#5-firma-del-registro-cronologico-digitale">Guida tecnica alla struttura del Registro cronologico di carico e scarico dei rifiuti in formato digitale</a> 
descrive la struttura del file XML da utilizzare per l'esportazione dei dati relativi ai movimenti di un registro. In questo paragrafo viene descritto come creare il file di esportazione
del registro digitale e come firmarlo digitalmente, con particolare attenzione a come evitare di invalidare la firma del nodo di vidimazione già presente nel file.

### 7.1 Creazione del file XML di esportazione dei dati relativi ai movimenti di registro

Nella preparazione del file XML con l'esportazione dei dati relativi ai movimenti di un registro, è necessario fare particolare attenzione a come si include il nodo di vidimazione 
prodotto da RENTRI _**reg:eREGI**_ con namespace <i>xmlns:reg="urn:it:rentri:registri:1.0"</i>. Il nodo è firmato digitalmente e la firma digitale XML è 
rappresentata dall'elemento _**ds:Signature**_ con namespace _xmlns:ds="http&#58;&#47;&#47;www&period;w3&period;org&#47;2000&#47;09&#47;xmldsig#"_ che è figlio del nodo _reg:eREGI_. 

Le firme digitali, per definizione, sono calcolate con procedura crittografica sulle informazioni oggetto di firma, e pertanto, in generale, eventuali modifiche apportate alle informazioni 
oggetto di firma che avvengano successivamente al calcolo della firma, la invalidano. 

Le firme digitali <a href="https://www.w3.org/TR/xmldsig-core/">XMLDSig</a> (e per estensione le firme <a href="https://www.etsi.org/deliver/etsi_en/319100_319199/31913201/01.02.01_60/en_31913201v010201p.pdf">XAdES</a>), 
quando applicate all'XML in cui le firme stesse sono contenute (o a parti di esso), permettono una maggiore flessibilità rispetto ad altre specifiche di firma digitale, quali CAdES e PAdES, 
perché attraverso la procedura di "<a href="https://www.w3.org/TR/xml-exc-c14n/" target=_blank>_Canonicalization_</a>" permettono di tradurre in una forma "normalizzata", 
prima del calcolo crittografico, il file XML o la parte di esso oggetto di firma (oltre al nodo _ds:SignedInfo_ e all'eventuale _xades:SignedProperties_ interni al nodo _ds:Signature_, 
anch'essi coinvolti nel processo di firma), applicando varie trasformazioni che, tra le altre cose, riallineano gli attributi degli elementi in ordine lessicografico, 
rimuovono i namespace non necessari, ed in particolare eliminano gli spazi bianchi (tabulazioni e "a capo" compresi) non significativi come ad esempio possono essere eventuali 
<a href="https://www.w3.org/TR/2001/REC-xml-c14n-20010315#Example-SETags" target=_blank>spazi che separano il nome dell'elemento dai suoi attributi</a>.

Tuttavia, questo processo di trasformazione in forma normale via "<i>Canonicalization</i>" rispetto agli spazi bianchi dell'XML firmato **NON COMPRENDE** gli spazi bianchi presenti tra i tag
dell'XML, che sono e rimangono parte integrante dell'XML oggetto di firma, e che non possono quindi essere eliminati o aggiunti successivamente alla firma. 
Tra questi spazi sono inclusi in particolare quelli di **indentazione** dell'XML, pertanto, nella creazione del file di esportazione del registro, 
che <a href="/docs?page=schemi-xsd">come da schema</a> deve contenere il nodo XML di vidimazione firmato come primo elemento figlio del nodo radice, 
occorre prestare particolare attenzione a non modificare le spaziature di indentazione di questo nodo.

Il seguente esempio di codice in C# mostra come provvedere, con le librerie di sistema disponibili in ambiente .NET, a creare il file XML di esportazione del registro evitando di 
invalidare la firma sul nodo di vidimazione:

```csharp
using System.Text;
using System.Xml;
using System.Xml.Schema;
using System.Xml.Serialization;

// Esempio minimo di creazione dei dati di esportazione del registro
var registro = new Registro { 
    RiferimentiPrecedenti = new RegistroRiferimentiPrecedenti {
        Ref = [new RiferimentoDocumento { 
            DigestValue = "digestValue", 
            DataCreazione = DateTime.UtcNow 
        }]
    },
    Registrazioni = [new Registrazioni { 
        Items = [new Movimento {
            Autore = "autore",
            IdentificativoTemporale = DateTime.UtcNow,
            Riferimenti = new DatiRiferimenti {
                NumeroRegistrazione = new IdentificativoMovimento { 
                    Anno = 2024, 
                    Progressivo = 1, 
                },
                DataOraRegistrazione = DateTime.UtcNow
            }
            // ...
        }] 
    }]
};

// Serializza il registro da esportare in memoria
using var ms = new MemoryStream();
using var xmlWriter = XmlWriter.Create(ms, new XmlWriterSettings { Encoding = new UTF8Encoding(false) });
new XmlSerializer(typeof(Registro)).Serialize(ms, registro);

// Carica l'XML firmato di vidimazione ottenuto da RENTRI
var vidimazioneDoc = new XmlDocument() { PreserveWhitespace = true };
vidimazioneDoc.LoadXml(File.ReadAllText("vidimazione_registro.xml"));

// Crea l'XML di esportazione del registro importando il nodo vidimazione come primo figlio del nodo radice preservandone l'indentazione
var xmlReg = new XmlDocument { PreserveWhitespace = true };
xmlReg.LoadXml(Encoding.UTF8.GetString(ms.ToArray()));
xmlReg.DocumentElement!.PrependChild(xmlReg.ImportNode(vidimazioneDoc.DocumentElement!, true));

// Serializza l'XML di esportazione del registro nel file
File.WriteAllText(@"registro_da_firmare.xml", xmlReg.OuterXml);


// Esempio minimo di classi per la serializzazione XML del registro
// ottenute a partire dagli schemi forniti nella pagina "Schemi di validazione XSD"
[XmlRoot(Namespace = "urn:it:rentri:registri:1.0", IsNullable = false)]
public class Registro {
    [XmlElement("RiferimentiPrecedenti")]
    public RegistroRiferimentiPrecedenti RiferimentiPrecedenti { get; set; }
    [XmlElement("Registrazioni")]
    public Registrazioni[] Registrazioni { get; set; }
}

[XmlType(AnonymousType = true, Namespace = "urn:it:rentri:registri:1.0")]
public class RegistroRiferimentiPrecedenti {
    [XmlElement("Ref")]
    public RiferimentoDocumento[] Ref { get; set; }
}

[XmlType(Namespace = "urn:it:rentri:registri:1.0")]
public class RiferimentoDocumento {
    [XmlAttribute]
    public string DigestValue { get; set; }
    [XmlAttribute]
    public DateTime DataCreazione { get; set; }
}

[XmlType(Namespace = "urn:it:rentri:registri:1.0")]
public class Registrazioni {
    [XmlElement("Movimento", typeof(Movimento))]
    public OperazioneItem[] Items { get; set; }
    [XmlAttribute]
    public short Anno { get; set; }
    [XmlAttribute]
    public int ProgressivoDa { get; set; }
    [XmlAttribute]
    public int ProgressivoA { get; set; }
    [XmlAttribute]
    public int NumeroRegistrazioni { get; set; }
    [XmlAttribute]
    public DateTime DataCreazione { get; set; }
}

[XmlInclude(typeof(Movimento))]
[XmlType(Namespace = "urn:it:rentri:movimenti:1.0")]
public abstract class OperazioneItem {
    public string Autore { get; set; }
    public DateTime IdentificativoTemporale { get; set; }
}

[XmlType(Namespace = "urn:it:rentri:movimenti:1.0")]
public class Movimento : OperazioneItem {
    public DatiRiferimenti Riferimenti { get; set; }
    // ... altre proprietà del movimento
}

[XmlType(Namespace = "urn:it:rentri:movimenti:1.0")]
public class IdentificativoMovimento {
    public short Anno { get; set; }
    public int Progressivo { get; set; }
    // ... altre proprietà dell'identificativo
}

[XmlType(Namespace = "urn:it:rentri:movimenti:1.0")]
public class DatiRiferimenti {
    public IdentificativoMovimento NumeroRegistrazione { get; set; }
    public DateTime DataOraRegistrazione { get; set; }
    // ... altre proprietà dei riferimenti
}
// ... altre classi derviate dagli schemi 

```

In generale, per verificare che una firma digitale sia valida è possibile utilizzare sia strumenti locali (librerie o applicazioni per la gestione della firma digitale) 
sia strumenti online, spesso offerti dai certificatori nazionali.

Nell'ambito del progetto europeo <a href="https://ec.europa.eu/digital-building-blocks/sites/display/digital/eSignature" target=_blank>eSignature</a>,
elemento costitutivo del programma <a href="https://digital-strategy.ec.europa.eu/en/activities/digital-programme" target=_blank>DIGITAL</a>, è stata sviluppata la libreria Java open-source 
<a href="https://ec.europa.eu/digital-building-blocks/sites/display/DIGITAL/Digital+Signature+Service+-++DSS" target=_blank>DSS (Digital Signature Services)</a> per la creazione e la validazione 
di firme digitali conformemente alla normativa europea eIDAS. Questa libreria è disponibile anche come <a href="https://ec.europa.eu/digital-building-blocks/DSS/webapp-demo/" target=_blank>servizio online dimostrativo</a> 
con funzioni utili al debugging per effettuare validazioni di file contenenti firme digitali. È quindi possibile utilizzare anche questo servizio per verificare la validità delle firme digitali 
prima e dopo le varie elaborazioni effettuate sui file XML di esportazione del registro RENTRI.

> ℹ️ **IMPORTANTE**
> La validazione di un file firmato digitalmente viene normalmente effettuata in diversi passaggi, riassumibili in:
> - **Controllo di formato**: verifica che la struttura del file sia conforme ad una delle specifiche ammesse (es: XMLDsig, CMS, PAdES);
> - **Controllo crittografico**: verifica che i dati oggetto di firma non siano stati modificati dopo l'apposizione della firma;
> - **Controllo di accettabilità del certificato**: verifica che il certificato sia valido e la catena di certificazione sia accettabile.
>
> Se la firma digitale applicata ad un file è crittograficamente corretta ed è confezionata in un formato conforme alle specifiche, ma è applicata con un certificato di dominio RENTRI, 
le procedure di validazione di firma digitale comunemente disponibili e conformi alla normativa eIDAS generano normalmente un esito complessivo della verifica negativo o indeterminato, 
perché nelle _policy_ predefinite di validazione è previsto che la catena di certificazione da validare termini con un certificato di _root_ riferibile ad una CA pubblica e censito 
nell'elenco dei certificati _trusted_ (<a href="https://eidas.ec.europa.eu/efda/trust-services/browse/eidas/tls/tl/IT" target=_blank>TSP - _Trusted Service Providers_</a>).
Questi servizi di validazione normalmente espongono anche i dettagli dei vari passi di verifica che evidenziano l'esito di tutti gli altri controlli, 
tra cui quelli di formato e quelli crittografici.
La procedura di validazione applicata da RENTRI è sostanzialmente la stessa applicata dai vari servizi di validazione conformi alla normativa eIDAS, 
salvo che accetta anche i certificati di dominio RENTRI come _trusted_.

### 7.2 Firma di integrità del file XML di esportazione del registro

Il seguente esempio di codice in C# mostra come provvedere ad apporre la firma digitale XML di tipo "Enveloped" in formato XMLDSig semplice (non XAdES) 
al file del registro esportato come descritto al punto precedente, utilizzando il certificato di interoperabilità (e relativa chiave privata) fornita nella sezione 
"Interoperabilità" dell'area riservata RENTRI, con l'ausilio delle sole librerie standard per l'apposizione di firme digitali XML fornite dall'ambiente .NET.

> ℹ️ **IMPORTANTE**
> 
> La firma digitale da apporre sul registro cronologico non deve necessariamente essere prodotta in modalità programmatica e può non essere una firma XML conforme allo standard XAdES (ma soltanto allo standard XMLDSig) 
perché rappresenta una firma di integrità.


```csharp
using System.Security.Cryptography;
using System.Security.Cryptography.X509Certificates;
using System.Security.Cryptography.Xml;
using System.Xml;

var p12 = "XXX"; // Base64 file .p12
var password = "XXX"; // Password del file .p12
var cert = new X509Certificate2(Convert.FromBase64String(p12), password, X509KeyStorageFlags.MachineKeySet | X509KeyStorageFlags.EphemeralKeySet);

var filXmlDaFirmare = "registro_da_firmare.xml";

var xmlDoc = new XmlDocument { PreserveWhitespace = true };
xmlDoc.Load(filXmlDaFirmare);

// 
CryptoConfig.AddAlgorithm(typeof(ECDsa256SignatureDescription), "http://www.w3.org/2001/04/xmldsig-more#ecdsa-sha256");

var signedXml = new SignedXml(xmlDoc) {
    SigningKey = cert.GetECDsaPrivateKey(),
};
signedXml.SignedInfo.SignatureMethod = "http://www.w3.org/2001/04/xmldsig-more#ecdsa-sha256";

var reference = new Reference { Uri = "" };
reference.AddTransform(new XmlDsigEnvelopedSignatureTransform { });
signedXml.AddReference(reference);

signedXml.ComputeSignature();
signedXml.KeyInfo.AddClause(new KeyInfoX509Data(cert.RawData));
XmlElement xmlDigitalSignature = signedXml.GetXml();

xmlDoc.DocumentElement?.AppendChild(xmlDoc.ImportNode(xmlDigitalSignature, true));
File.WriteAllText(@"registro_firmato.xml", xmlDoc.OuterXml);

public class ECDsa256SignatureDescription : SignatureDescription {
    public ECDsa256SignatureDescription() {
        KeyAlgorithm = typeof(ECDsa).AssemblyQualifiedName;
    }
    public override HashAlgorithm CreateDigest() => SHA256.Create();
    public override AsymmetricSignatureFormatter CreateFormatter(AsymmetricAlgorithm key) => new EcdsaSignatureFormatter(key as ECDsa);
}

public class EcdsaSignatureFormatter : AsymmetricSignatureFormatter {
    private ECDsa key;
    public EcdsaSignatureFormatter(ECDsa key) => this.key = key;
    public override void SetKey(AsymmetricAlgorithm key) => this.key = key as ECDsa;
    public override void SetHashAlgorithm(string strName) { }
    public override byte[] CreateSignature(byte[] rgbHash) => key.SignHash(rgbHash);
}

```

> ℹ️ **IMPORTANTE**
> 
> Come descritto nel paragrafo [Creazione del file XML di esportazione dei dati relativi ai movimenti di registro](javascript:loadPage('api-flussi-operativi-registri#7-1-creazione-del-file-xml-di-esportazione-dei-dati-relativi-ai-movimenti-di-registro')), 
> il file indicato con **`registro_da_firmare.xml`** nel codice deve essere generato facendo attenzione a non modificare in nessun modo (spazi di indentazione compresi) 
> la parte dell'XML che contiene il nodo di vidimazione e la relativa firma digitale per evitare di comprometterne la validità.


### 7.3 Validazione del registro firmato attraverso l'endpoint di verifica

Come indicato nel [capitolo 6](javascript:loadPage('registro-digitale#6-validazione-del-registro-cronologico-digitale-tramite-api-e-servizi-rentri')) 
della <a href="/docs?page=registro-digitale#5-firma-del-registro-cronologico-digitale">Guida tecnica alla struttura del Registro cronologico di carico e scarico dei rifiuti in formato digitale</a>, 
è stato implementato un endpoint delle API per la validazione del file del registro esportato e firmato come sopra indicato.

Il seguente esempio di codice in C# mostra come provvedere alla verifica dell'esportazione XML del Registro:

```csharp
using Newtonsoft.Json;
using System.Net.Http;

string basePath = "https://<ambiente>/dati-registri/v1.0";
string identificativoRegistro = "R00XXXX0000"; // identificativo del registro
string registroFileName = "registro_firmato.xml";
string fileContent = Convert.ToBase64String(File.ReadAllBytes(registroFileName));

var client = new HttpClient();
// TODO: Inizializzare il client HTTP con gli header previsti per il tipo di richiesta (vedi pattern AgID ID_AUTH_REST_02)

// Creazione del payload con i dati del registro firmato da validare
var verificaModel = @$"{{""file_content"": ""{fileContent}"", ""nome_file"": ""{registroFileName}"", ""mime"": ""application/xml"" }}";
var content = new StringContent(registro, System.Text.Encoding.UTF8, "application/json");
// TODO: Firmare il contenuto (vedi pattern AgID INTEGRITY_REST_01)

// Invio della richiesta HTTP
var response = await client.PostAsync($"{basePath}/operatore/{identificativoRegistro}/valida", content, cancellationToken);
if (response.IsSuccessStatusCode)
{
	string result = await response.Content.ReadAsStringAsync();
	var transazione = JsonConvert.DeserializeObject<TransazioneModel>(result);
	Guid transazioneId = transazione.TransazioneId;
}
```

L'endpoint per la verifica dell'esportazione XML del Registro è di tipo **asincrono** e restituisce come risposta il valore `transazione_id`, ovvero un GUID che identifica la transazione di elaborazione assegnata alla richiesta.
Per ottenere l'esito dell'elaborazione seguire i passaggi indicati nel paragrafo [Recupero dell'esito di una transazione asincrona](javascript:loadPage('api-flussi-operativi-introduzione#recupero-dell-esito-di-una-transazione-asincrona')).
Nel modello restituito saranno elencati tutti i controlli che hanno generato un errore o un avviso rispetto al file inviato nel campo `file_content` del modello della richiesta.

---

*Ultimo aggiornamento: 06/10/2025*