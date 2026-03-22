## Introduzione

L'**API RENTRI** è un'API RESTful a cui è possibile accedere tramite chiamate HTTP esplicite o utilizzando apposite librerie client. L'API espone tutte le funzionalità disponibili agli operatori e ai soggetti delegati per l'interazione con i Registri di C/S, i Formulari e tutte le altre entità associate.

La presente documentazione fa riferimento alle **API RENTRI v1.0**. Nelle URL degli endpoint di seguito indicate non viene specificato il server, in quanto dipende dall'ambiente su cui si sta operando. Gli indirizzi dei server per gli ambienti **DEMO** e **PRODUZIONE** sono:

```http
https://demoapi.rentri.gov.it/...
https://api.rentri.gov.it/...
```

Nei paragrafi che seguono sono presenti il glossario con un elenco dei termini più comuni utilizzati nell'API e la descrizione dei principali flussi operativi con il dettaglio dei passaggi per il corretto utilizzo degli endpoint dei servizi RENTRI.

## Glossario

**<span style="color:#0066cc">Operatore</span>**

Un operatore è un soggetto iscritto al RENTRI.

**<span style="color:#0066cc">Soggetto delegato</span>**

Il soggetto delegato è un soggetto che, ricevute le deleghe da parte dell'operatore all'interno del portale RENTRI, può operare in RENTRI in nome e per conto dell'operatore. 

**<span style="color:#0066cc">Unità locale</span>**

L'unità locale (o sito) è una una sede operativa, quale, ad esempio, un laboratorio, un’officina, uno stabilimento, un negozio, oppure una sede amministrativa o gestionale, quale, ad esempio, un ufficio, un magazzino, un deposito, ubicata in luogo coincidente con la sede legale o diverso
da quello della sede legale.

L'unità locale (o sito) è rappresentata da una risorsa [Unità locale](/docs?api=anagrafiche&v=v1.0#/paths/operatore-num_iscr--siti--num_iscr_sito/get)</a>.

**<span style="color:#0066cc">Registro</span>**

Il registro è rappresentato da una risorsa [Registro](/docs?api=anagrafiche&v=v1.0#/paths/registri-identificativo/get)</a>.

**<span style="color:#0066cc">Movimento</span>**

Un movimento identifica una operazione di movimentazione, stoccaggio o trasformazione di un rifiuto presente all'interno di un dato registro.

Il movimento è rappresentato da una risorsa [Movimento](/docs?api=dati-registri&v=v1.0#/paths/operatore-identificativo_registro--movimento--identificativo_movimento/get)</a>.

**<span style="color:#0066cc">Registrazione</span>**

La registrazione è l'operazione di inserimento, di rettifica o di annullamento di un movimento in RENTRI. In generale registrazione e movimento sono considerati sinonimi. 

**<span style="color:#0066cc">Formulario (o FIR) cartaceo</span>**

Il formulario è rappresentato dalle risorse [FIR cartaceo](/docs?api=formulari&v=v1.0#/paths/copia-cartacea-caricamento-num_iscr_sito---identificativo/get) e [Documento FIR cartaceo](/docs?api=formulari&v=v1.0#/paths/copia-cartacea-caricamento-num_iscr_sito---identificativo--documento/get)</a>.

**<span style="color:#0066cc">Formulario (o FIR) digitale</span>**

Il formulario è rappresentato dalle risorse [FIR digitale](/docs?api=formulari&v=v1.0#/paths/copia-digitale-caricamento-num_iscr_sito---identificativo/get) e [Documento FIR digitale](/docs?api=formulari&v=v1.0#/paths/copia-digitale-caricamento-num_iscr_sito---identificativo--documento/get)</a>.

**<span style="color:#0066cc">Blocco</span>**

Un blocco di formulari è rappresentato dalla risorsa [Blocco](/docs?api=vidimazione-formulari&v=v1.0#/paths//get)

**<span style="color:#0066cc">Transazione</span>**

Una transazione in RENTRI è una sequenza di operazioni sui dati forniti da operatori e soggetti delegati, che vengono gestite come una singola elaborazione atomica. Se una delle operazioni fallisce durante l'elaborazione, l'intera transazione fallisce e viene abortita.

## Argomenti correlati

- La presente documentazione fa in parte riferimento alle modalità operative descritte nel documento <a href="https://www.rentri.gov.it/default/media/documentazione/decreto_direttoriale_06112023_143_tracciabilita_rifiuti_allegato.pdf" target="_blank">Modalità operative</a>.
- Per informazioni sulla funzionalità di accreditamento, necessaria per l’utilizzo dei servizi interoperanti, consultare [Accreditamento e certificati](javascript:loadPage('accesso-certificati')).
- Per saperne di più sulla gestione dell'autenticazione e dell'autorizzazione, consultare [Autenticazione e integrità](javascript:loadPage('accesso-auth')).

## Autenticazione

La maggior parte degli endpoint dell'API, richiede obbligatoriamente l'utilizzo di un certificato per la generazione di appositi token JWT (JSON Web Token) e per la creazione di modelli di dati con firma.
Questo paragrafo descrive il processo di autenticazione per la chiamata degli endpoint che la richiedono.

Nel caso di endpoint di tipo **<span style="color:#49cc90">GET</span>**, è necessario aggiungere alla richiesta HTTP l'header `Authorization Bearer` specificando il JWT di autenticazione generato con il proprio certificato.
Si faccia riferimento al pattern sicurezza **ID_AUTH_REST_02** delle linee guida AgID (vedi [Autenticazione e integrità](javascript:loadPage('accesso-auth'))).

Per gli endpoint di tipo **<span style="color:#61affe">POST</span>**, occorre aggiungere alla richiesta HTTP anche gli header `Digest` e `Agid-JWT-Signature` contenenti i dati trasmessi firmati con il proprio certificato. 
In questo caso si faccia riferimento anche al pattern di sicurezza **INTEGRITY_REST_01** delle linee guida AgID per l’interoperabilità (vedi [Autenticazione e integrità](javascript:loadPage('accesso-auth'))).

## Verifica dello stato di funzionamento di un servizio

Prima di operare con qualunque servizio API, è consigliabile eseguire una verifica dello stato di funzionamento dello stesso: ogni servizio di RENTRI espone un endpoint di verifica dello stato di funzionamento.

Il seguente esempio di codice C# mostra come verificare lo stato di funzionamento di un servizio API:

```csharp
using System.Net.Http;

string basePath = "https://<ambiente>/anagrafiche/v1.0";

var client = new HttpClient();

// Invio della richiesta HTTP
var response = await client.GetAsync($"{basePath}/status");
if (response.IsSuccessStatusCode)
{
	// Lo stato delle API è OK, si può procedere con l'utilizzo degli endpoint
}
```

## Recupero dell'esito di una transazione asincrona

Alcuni servizi API RENTRI eseguono operazioni asincrone che richiedono un tempo di elaborazione non trascurabile. In questi casi, gli endpoint ritornano uno status code **`202 Accepted`** e un identificativo della transazione di elaborazione assegnata alla richiesta.

L'ottenimento dell'esito di un'elaborazione può avvenire secondo due modalità: 
- **PUSH**, che prevede di specificare una *URL di callback* nell'header **`X-ReplyTo`** della richiesta, al quale il soggetto riceverà una notifica al termine dell'elaborazione.
- **PULL**, che prevede l'interrogazione dell'endpoint di verifica dello stato di elaborazione per sapere quando l'elaborazione è terminata.

### Modalità PUSH (consigliata)

La modalità PUSH è quella *consigliata* in quanto permette di ricevere una notifica al termine dell'elaborazione, senza che il soggetto debba periodicamente interrogare l'endpoint di verifica dello stato di elaborazione.
Per poter utilizzare la modalità PUSH, è sufficiente interrogare gli endpoint di tipo asincrono specificando l'*URL di callback* nell'header **`X-ReplyTo`** della richiesta.
Al termine dell'elaborazione RENTRI farà una chiamata di tipo **<span style="color:#61affe">POST</span>** all'URL specificata, inviando:
- nel body, l'esito dell'elaborazione (il cui schema è consultabile nella sezione **Callbacks** della documentazione del servizio corrispondente);
- l'header **`X-Correlation-ID`**, contenente l'identificativo della transazione che permette di risalire all'operazione di invio iniziale;
- gli headers **`Digest`** e **`Agid-JWT-Signature`**, contenenti il digest e il JWT firmati secondo il pattern AgID **INTEGRITY_REST_01** per eventuali validazioni di sicurezza e integrità del dato inviato.

> ⚠️ **ATTENZIONE**
> 
> Perché il dialogo tra RENTRI e il servizio del soggetto sia il più stabile ed efficente possibile, occorre seguire le seguenti indicazioni:
> - Quando il servizio del soggetto acquisisce correttamente il messaggio, deve rispondere con lo status code **`200 OK`**. In caso contrario, RENTRI avvierà un meccanismo di "retry" per ritentare l'invio del messaggio.
> Il meccanismo di "retry" prevede un numero limitato di tentativi, al termine dei quali non verrà inviata più alcuna notifica relativa alla transazione.
> - Il soggetto deve garantire una buona efficienza dei propri servizi di callback. Il timeout predefinito per le chiamate effettuate da RENTRI è pari a **5s**, pertanto nel caso in cui i tempi di risposta siano superiori a questo valore, le chiamate verranno abortite facendo scattare il meccanismo di "retry".
> - Le URL di callback devono essere configurate sulla **porta 443**.

### Modalità PULL

La modalità PULL prevede due passaggi. Il primo consiste nell'interrogare l'endpoint di verifica dello stato di elaborazione per sapere quando l'elaborazione è terminata.
Il secondo consiste nel recupero dell'esito dell'elaborazione tramite un altro endpoint dedicato.
Fintanto che l'elaborazione non è stata conclusa, l'endpoint di verifica dello stato di elaborazione risponde con lo status code **`200 OK`**.
Dal momento in cui l'elaborazione è terminata, l'endpoint risponde con lo status code **`303 See Other`** e un header **`Location`** contenente l'URL per il recupero dell'esito.
L'URL restituita corrisponde all'endpoint per il recupero dell'esito dell'elaborazione.

#### Verifica dello stato di elaborazione

Per verificare lo stato di elaborazione di una transazione, utilizzare l'endpoint **<span style="color:#49cc90">GET</span> `<ambiente>/<api>/v1.0/{transazione_id}/status`**.
Nel path occorre specificare il parametro obbligatorio **`{transazione_id}`** che corrisponde al GUID restituito dalla chiamata al metodo asincrono (ad esempio: `ba025bdd-ce28-44eb-827d-14d9792019e7`).

Il seguente esempio di codice C# mostra come verificare lo stato di elaborazione di una transazione:

```csharp
using Newtonsoft.Json;
using System.Net;
using System.Net.Http;

// TODO: Sostituire il valore <api> con il nome dell'API di riferimento (ad esempio: dati-registri, formulari)
string basePath = "https://<ambiente>/<api>/v1.0";
string transazioneId = "ba025bdd-ce28-44eb-827d-14d9792019e7";

var client = new HttpClient(new HttpClientHandler { AllowAutoRedirect = false });

// Invio della richiesta HTTP
HttpResponseMessage response;
do
{
	// TODO: Inizializzare il client HTTP con gli header previsti per il tipo di richiesta (vedi pattern AgID ID_AUTH_REST_02)
	// Il JWT deve essere generato all'interno del ciclo così da rinnovarlo ad ogni richiesta

	// Attesa di 2 secondi prima di effettuare la nuova richiesta
	await Task.Delay(2000);
	response = await client.GetAsync($"{basePath}/{transazioneId}/status");
}
while (response.StatusCode != HttpStatusCode.RedirectMethod)

// URL per il recupero dell'esito
string resultLocation = response.Headers.Location;
```

> ⚠️ **ATTENZIONE**
> 
> Seguire le indicazioni riportate nel paragrafo [Risposte con HTTP Status Code 303](#risposte-con-http-status-code-303) per la corretta gestione di questa chiamata.

> ⚠️ **ATTENZIONE**
> 
> La verifica dello stato di elaborazione di una transazione non è da confondere con la [Verifica dello stato di funzionamento di un servizio](#verifica-dello-stato-di-funzionamento-di-un-servizio).

#### Recupero dell'esito dell'elaborazione

Dopo aver ottenuto l'URL per il recupero dell'esito tramite la chiamata descritta al paragrafo precedente, è possibile utilizzare la stessa URL, che corrisponde all'endpoint **<span style="color:#49cc90">GET</span> `<ambiente>/<api>/v1.0/{transazione_id}/result`**, per recuperare i dati dell'esito dell'elaborazione.
Nel path occorre specificare il parametro obbligatorio **`{transazione_id}`** che corrisponde al GUID restituito dalla chiamata al metodo asincrono (ad esempio: `ba025bdd-ce28-44eb-827d-14d9792019e7`).

> 💡 **SUGGERIMENTO**
> 
> Consultare la documentazione di riferimento delle API specifiche (ad esempio: [dati-registri](javascript:loadApi('dati-registri')), [formulari](javascript:loadApi('formulari'))) per il dettaglio completo dei modelli dell'endpoint.

Il seguente esempio di codice C# mostra come recuperare l'esito dell'elaborazione di una transazione:

```csharp
using Newtonsoft.Json;
using System.Net.Http;

// TODO: Sostituire il valore <api> con il nome dell'API di riferimento (ad esempio: dati-registri, formulari)
string basePath = "https://<ambiente>/<api>/v1.0";
string transazioneId = "ba025bdd-ce28-44eb-827d-14d9792019e7";

var client = new HttpClient();
// TODO: Inizializzare il client HTTP con gli header previsti per il tipo di richiesta (vedi pattern AgID ID_AUTH_REST_02)

// Invio della richiesta HTTP
var response = await client.GetAsync($"{basePath}/{transazioneId}/result");

if (response.IsSuccessStatusCode)
{
	string result = await response.Content.ReadAsStringAsync();
	var esito = JsonConvert.DeserializeObject<EsitoMovimentiModel>(result);
}
```

All'interno dell'oggetto **`esito`** verificare il valore del flag **`errore`** per capire se l'elaborazione ha dato esito positivo (**`false`**) o negativo (**`true`**). In caso di esito negativo, all'interno dell'array **`validazione`** sono presenti tutti i riferimenti agli errori riscontrati.
Per il dettaglio degli errori di validazione, consultare la documentazione di riferimento delle [API - codifiche](javascript:loadApi('codifiche')) in riferimento all'endpoint **<span style="color:#49cc90">GET</span> `<ambiente>/codifiche/v1.0/lookup/codici-errore`**.

> ℹ️ **IMPORTANTE**
> 
> Nel caso dell'endpoint relativo alle [API dati-registri](javascript:loadApi('dati-registri')) se l'elaborazione ha dato esito positivo, l'array **`numero_registrazioni`** contiene tutti gli identificativi delle registrazioni che sono state create.

## Risposte con HTTP Status Code 303

Gli endpoint per la verifica dello stato di elaborazione ritornano lo status code **`303 See Other`** quando l'elaborazione è stata completata.

I framework più comuni fanno un redirect automatico alla nuova location. Questo comportamento deve essere disabilitato in modo da prevenire l'errore **`401 Unauthorized`**, dovuto all'utilizzo dello stesso JWT di autenticazione utilizzato con la richiesta precedente.

Il seguente esempio di codice C# mostra come creare un oggetto `HttpClient` disabilitando il redirect automatico:

```csharp
var client = new HttpClient(new HttpClientHandler { AllowAutoRedirect = false });
```

---

*Ultimo aggiornamento: 16/07/2024*