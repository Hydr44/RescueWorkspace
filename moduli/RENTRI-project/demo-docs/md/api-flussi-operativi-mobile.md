# API per App Mobile – Firma remota RENTRI

Tramite API dedicate, è possibile interfacciare un'app mobile sviluppata da terze parti con le funzionalità RENTRI relative alla firma remota rilasciata dalla CA RENTRI.
Le indicazioni di seguito fornite sono quelle adottate dall'app mobile ufficiale RENTRI (*RENTRI FIR Digitale*), utilizzabili allo stesso modo anche da un'app mobile di terze parti.

La presente documentazione fa riferimento alle **API RENTRI v1.0**.
Nelle URL degli endpoint di seguito indicate non viene specificato il server, in quanto dipende dall'ambiente su cui si sta operando.
Gli indirizzi dei server per gli ambienti **DEMO** e **PRODUZIONE** (*funzionalità non ancora esposte*) sono:

```http
https://demoapi.rentri.gov.it/...
https://api.rentri.gov.it/...
```

## Prefazione

RENTRI mette a disposizione una serie di servizi API per la produzione dei formulari (vedi [Formulari digitali](javascript:loadPage('api-flussi-operativi-formulari-digitali'))) e poiché i formulari accompagnano il trasporto dei rifiuti, è necessario prevedere l'utilizzo di alcuni di questi servizi anche *mediante dispositivi mobili* (ad esempio: smartphone, tablet).

Lo sviluppatore di terze parti può scegliere di realizzare *una propria app* a condizione che, nell'utilizzare i servizi API di RENTRI, vengano rispettati i criteri di interoperabilità (vedi [Autenticazione e integrità](javascript:loadPage('accesso-auth'))).
Inoltre, va considerato che per utilizzare i servizi API in mobilità, è necessario censire e abilitare i dispositivi che possono agire per conto di un determinato operatore.
Per questo motivo, sono stati realizzati dei servizi dedicati nel portale RENTRI, che consentono di abilitare e gestire i dispositivi che utilizzano la firma remota RENTRI attraverso un'app mobile.

La procedura di abbinamento dei dispositivi all'operatore (vedi paragrafo [Abbinamento di un dispositivo](#1-abbinamento-di-un-dispositivo)) avviene attraverso la condivisione di un **QR Code** e di un **PIN di configurazione** generati appositamente da RENTRI, tramite i quali avviene il riconoscimento del dispositivo ed il rilascio di apposite credenziali da utilizzare nelle operazioni di firma remota.
Per il rilascio delle credenziali è necessario fornire i dati identificativi dell'utente utilizzatore dell'app, in modo da poter successivamente garantire la riconducibilità all'utente che ha utilizzato la firma remota.
Le funzionalità di firma fanno uso *dello specifico certificato digitale di firma remota rilasciato dal servizio di CA RENTRI all'operatore*, la cui chiave privata viene custodita dal sistema RENTRI.
In questo modo l'operatore abilita i dispositivi mobili all'utilizzo della firma remota RENTRI.

Quanto descritto in seguito rappresenta un **valido esempio pratico** di riferimento per implementazioni di terze parti e ha lo scopo di descrivere le modalità di interfacciamento tra un'app mobile e la firma remota RENTRI, in alternativa all'utilizzo di certificati qualificati eIDAS o certificati di identificazione elettronica.
Ovviamente, lo sviluppatore di terze parti può realizzare soluzioni personalizzate equivalenti per raggiungere il livello di integrazione e funzionalità desiderato.
Le scelte tecniche adottate sono state effettuate in base alle esigenze specifiche del progetto ma, come già detto, **non sono vincolanti per eventuali implementazioni di terze parti**.

### Modalità di integrazione

Lo sviluppatore di terze parti che vuole realizzare una propria app mobile, può scegliere se utilizzare i servizi RENTRI di gestione dei dispositivi, oppure di implementare delle funzionalità di gestione equivalenti per proprio conto.

#### Utilizzo dei servizi RENTRI di gestione dei dispositivi

RENTRI mette a disposizione le seguenti funzionalità:
- Gestione dell'abbinamento dei dispositivi (tramite l'area Operatori dell'ambiente corrispondente, nell'apposita sezione *Interoperabilità - Gestione dispositivi mobili - Accesso unità locali*).
- Gestione dei dispositivi abbinati e delle credenziali (tramite l'area Operatori dell'ambiente corrispondente, nell'apposita sezione *Interoperabilità - Gestione dispositivi mobili - Dispositivi*).
- Servizio di smistamento delle notifiche.
- Utilizzo dei certificati di firma remota RENTRI.

#### Implementazione personalizzata

Lo sviluppatore di terze parti che intende sviluppare per proprio conto sia l'app mobile, sia l'infrastruttura di servizi necessari per la gestione dei dispositivi e delle credenziali, può realizzare un'implementazione totalmente personalizzata interagendo direttamente con le API messe a disposizione da RENTRI, senza la necessità di avvalersi dei servizi dedicati precedentemente citati.
In tal caso, è necessario tenere conto del fatto che **non sarà possibile utilizzare la firma remota RENTRI**.
In questo scenario sarà necessario prevedere l'utilizzo di altri meccanismi di firma locale o remota tra quelli riconosciuti validi nel contesto della normativa eIDAS.

A titolo esemplificativo, altri aspetti rilevanti da tenere in considerazione per questo tipo di implementazione potrebbero essere:
- Garantire la riconducibilità delle operazioni effettuate tramite l'app mobile, in modo da poter risalire all'utente utilizzatore che le ha effettuate.
- Generazione di notifiche a partire dagli eventi legati alle operazioni effettuate in RENTRI (ad esempio: creazione formulario, aggiornamento formulario, etc.), che poi possano essere inviate ai dispositivi nei quali viene installata l'app mobile di terze parti.
- Funzionalità di blocco/sblocco di un dispositivo da parte di un operatore.

## Gestione dei certificati di Interoperabilità RENTRI

Anche le API dedicate all'interfacciamento con un'app mobile di terze parti prevedono (salvo alcune eccezioni specifiche, indicate in questa documentazione) l'utilizzo di un certificato per la generazione dei JWT che devono essere trasmessi nelle request (vedi [Accreditamento e certificati](javascript:loadPage('accesso-certificati'))).

Lo sviluppatore dell'app mobile ha il compito di gestire un *proprio repository contenente i certificati di ciascuno degli operatori* per i quali mette a disposizione la propria app.
Nel caso degli operatori che fanno uso dei [Certificati di dominio RENTRI](javascript:loadPage('accesso-certificati#certificato-dominio-rentri')) utilizzabili esclusivamente per le API di Interoperabilità, questi possono essere generati e scaricati tramite l'area Operatori dell'ambiente corrispondente, nell'apposita sezione *Interoperabilità - Emissione certificati digitali RENTRI*.

Ogni chiamata alle API che avviene tramite l'app, dovrà quindi utilizzare il **certificato corretto**, corrispondente all'operatore al quale sono state abbinate le credenziali con le quali sta operando l'utente utilizzatore dell'app, per poter garantire la corretta autenticazione.

## Servizio di smistamento delle notifiche

Il sistema RENTRI espone **un servizio di smistamento delle notifiche** al quale è possibile sottoscrivere anche un dispositivo nel quale sia stata installata un'app mobile di terze parti.
Il servizio fa uso di un meccanismo basato su **callback**.
In fase di abbinamento di un dispositivo, tramite l'utilizzo dell'apposito endpoint che l'app deve richiamare (vedi paragrafo [Abbinamento di un dispositivo](#1-abbinamento-di-un-dispositivo)), devono essere specificati due parametri che verranno utilizzati per comunicare al sistema di terze parti le notifiche provenienti da RENTRI, relative all'operatività dell'app e alla gestione della registrazione del dispositivo.

I due parametri necessari per la sottoscrizione al servizio sono:
- Una **URI di callback**, che il servizio richiamerà per informare il server di terze parti in ascolto, quando è disponibile una notifica relativa all'operatività dell'app oppure quando è disponibile un aggiornamento delle informazioni di registrazione del dispositivo.
- Un **oggetto custom in formato JSON** che deve essere utilizzato successivamente dallo sviluppatore dell'app, per il riconoscimento del dispositivo destinatario delle notifiche e per l'invio delle corrispondenti notifiche push (ad esempio: piattaforma delle notifiche, push channel, tags, etc.).

Lo sviluppatore dell'app di terze parti, per poter inviare notifiche push alla propria app, che contengano le informazioni provenienti dalle notifiche RENTRI, dovrà prevedere un sistema composto dai seguenti componenti:
- Un endpoint esposto sull'URI di callback comunicata, che si occupi di ricevere le notifiche dal servizio di smistamento delle notifiche.
- Un servizio di gestione delle notifiche push (ad esempio: *APNS*, *Firebase*, *Azure Notification Hubs*, etc.) da configurare nella propria app, che permetta l'invio di notifiche push contenenti le informazioni che sono state ricevute da RENTRI.

RENTRI utilizza le notifiche per inviare informazioni all'utente utilizzatore dell'app. Alcuni esempi di notifiche sono l'esito di un'operazione conclusa o permettere l'utilizzo di determinate funzionalità, quali ad esempio: richiesta di firma, richiesta di cambio PIN Operativo delle credenziali, etc..

### Tipologie di notifiche

Di seguito vengono descritte le tipologie di notifiche che sono gestite dal servizio di smistamento delle notifiche RENTRI e le relative azioni che devono essere implementate e gestite all'interno dell'app mobile di terze parti.

#### AuthorizeCredentials

Viene inviata nel momento in cui è stata richiesta l'autorizzazione alla firma per delle credenziali.
Il tipo di azione associata che si trova all'interno dell'oggetto della notifica, è **`Action = NotificationAction.AuthorizeCredentials`**.

#### CredentialsPinReset

Viene inviata nel momento in cui un operatore, tramite l'area Operatori dell'ambiente corrispondente, nell'apposita sezione *Interoperabilità - Gestione dispositivi mobili*, ha attivato la procedura di ripristino del PIN operativo associato alle credenziali.
Il tipo di azione associata che si trova all'interno dell'oggetto della notifica, è **`Action = NotificationAction.CredentialsPinReset`**.

#### NoAction

Si tratta di una notifica che non prevede alcuna azione e contiene solo informazioni sottoforma di testo.
Il tipo di azione associata che si trova all'interno dell'oggetto della notifica, è **`Action = NotificationAction.NoAction`**.

#### Test

Si tratta di una notifica utilizzata per fare prove di ricezione.
Il tipo di azione associata che si trova all'interno dell'oggetto della notifica, è **`Action = NotificationAction.Test`**.

## 1. Abbinamento di un dispositivo

L'abbinamento (o *boarding*) tra un dispositivo mobile sul quale è installata l'app ufficiale RENTRI (o un'app di terze parti che si avvale dei servizi RENTRI di gestione dei dispositivi) e un operatore in RENTRI, avviene per mezzo della creazione di credenziali che legano il dispositivo a un'unità locale.

L'attivazione della funzionalità di abbinamento con i dispositivi mobili viene gestita dall'operatore tramite l'area Operatori dell'ambiente corrispondente, nell'apposita sezione *Interoperabilità - Gestione dispositivi mobili* (vedi screenshot sottostante).

![Gestione dispositivi mobili](/docs/assets/api-flussi-operativi-mobile-01.png)

Dopo che l'operatore ha attivato il boarding su una delle proprie unità locali, l'app mobile può procedere con l'abbinamento del dispositivo, utilizzando le API dedicate.

La procedura di abbinamento avviene per mezzo del **QR Code** e del **PIN di configurazione** generati dal portale, **che l'operatore deve fornire all'utente utilizzatore dell'app**. Il dispositivo, tramite l'app, inquadra il QR Code e inserisce il PIN di configurazione per completare l'abbinamento.
Il sistema verifica l'effettiva attivazione dell'abbinamento con l'unità locale e, in caso di esito positivo, abilita l'app mobile ad operare con le credenziali generate.

### 1.1 Recupero delle informazioni di boarding

Per recuperare le informazioni sull'operatore e sull'unità locale con cui si sta effettuando il boarding, l'app deve richiamare il seguente endpoint:

&emsp;**<span style="color:#49cc90">GET</span> `<ambiente>/ca-rentri/v1.0/credentials/boarding/{qrcode_token}`**

Nel path occorre specificare il parametro obbligatorio **`{qrcode_token}`** che corrisponde al <a href="https://it.wikipedia.org/wiki/GUID" target="_blank">GUID</a> che identifica l'operatore e l'unità locale (ad esempio: `ba025bdd-ce28-44eb-827d-14d9792019e7`).
Nella query string occorre specificare il parametro obbligatorio **`pin`** con il PIN di configurazione corrispondente.

Se la chiamata ha esito positivo, oltre alle informazioni sull'operatore e sull'unità locale, viene restituito anche il valore **`token`**, che è un GUID utilizzato per l'identificazione e l'autorizzazione della richiesta di boarding (ad esempio: `0ba94286-3eb8-40fc-bef8-4a09d0b1b7b5`).
Questo valore, con **validità di 2 minuti**, deve essere utilizzato come parametro nella successiva chiamata all'endpoint di creazione/aggiornamento delle credenziali.


> ℹ️ **IMPORTANTE**
> 
> L'endpoint è **anonimo** per permettere l'accesso ad ogni nuovo dispositivo non ancora registrato e restituisce le informazioni necessarie per il successivo passaggio che prevede la creazione (o l'aggiornamento) delle credenziali.

> 💡 **SUGGERIMENTO**
> 
> Consultare la documentazione di riferimento delle [API - ca-rentri](javascript:loadApi('ca-rentri')) per il dettaglio completo dei modelli dell'endpoint e degli eventuali parametri opzionali.

Questo paragrafo descrive i passaggi necessari per recuperare le informazioni sull'operatore e sull'unità locale.

#### 1.1.1 Autenticazione

L'endpoint è **anonimo** e non richiede l'autenticazione.

#### 1.1.2 Ricezione dei dati

Il seguente esempio di codice C# mostra come recuperare le informazioni di boarding:

```csharp
using Newtonsoft.Json;
using System.Net.Http;

string basePath = "https://<ambiente>/ca-rentri/v1.0";
string qrcodeToken = "ba025bdd-ce28-44eb-827d-14d9792019e7";
string pin = "123456";

var client = new HttpClient();
// NOTA: L'endpoint è anonimo e non richiede gli header previsti dal pattern AgID ID_AUTH_REST_02

// Invio della richiesta HTTP
var response = await client.GetAsync($"{basePath}/credentials/boarding/{qrcodeToken}?pin={pin}");
if (response.IsSuccessStatusCode)
{
	string result = await response.Content.ReadAsStringAsync();
	var infoBoarding = JsonConvert.DeserializeObject<BoardingAccessResponse>(result);
}
```

### 1.2 Creazione/aggiornamento delle credenziali

Dopo aver recuperato le informazioni di boarding, è possibile procedere con la creazione (o l'aggiornamento) delle credenziali.
Le credenziali che permettono l'operatività tramite l'app mobile sono sempre in *relazione 1:1 con un singolo operatore* e *1:N con le unità locali* appartenenti all'operatore stesso.
Inoltre, dal punto di vista dell'operatore, le credenziali sono in relazione *1:1 con il dispositivo*. Quindi, di fatto, un utilizzatore dell'app mobile che operi per conto di più soggetti diversi, avrà associate più credenziali, una per ciascun operatore.

Nel caso di creazione di nuove credenziali, il flusso prevede i seguenti passaggi:
- Creazione dell'identificativo delle credenziali e del *PIN operativo* associato.
- Verifica dell'esistenza di un *certificato di firma remota RENTRI* intestato all'operatore da utilizzare per la firma digitale.
- Associazione dell'operatore e dell'unità locale alle credenziali.
- Registrazione dei dati del dispositivo e dell'utente utilizzatore.
- Registrazione dei dati dell'app mobile e aggancio con il servizio di smistamento delle notifiche.

Quando invece l'utente utilizzatore dell'app legge un QR Code associato ad un'unità locale di un *operatore con cui è già stato fatto il boarding almeno una volta*, il flusso prevede i seguenti passaggi:
- Verifica dell'esistenza del dispositivo.
- Verifica dello stato del dispositivo, per controllare che non sia stato bloccato dall'operatore&#x00B9;.
- Verifica dell'esistenza delle credenziali indicate, che siano associate all'operatore.
- Verifica dell'associazione tra le credenziali e l'unità locale e, nel caso non esista, viene aggiunta.
- Verifica e aggiornamento delle informazioni necessarie per l'aggancio al servizio di smistamento delle notifiche.

> ✒️ **NOTE**
>
> *1. Il blocco/sblocco di un dispositivo da parte di un operatore, può essere impostato **solamente** tramite l'area Operatori dell'ambiente corrispondente, nell'apposita sezione Interoperabilità - Gestione dispositivi mobili.*

Per creare o aggiornare le credenziali, l'app deve richiamare il seguente endpoint:

&emsp;**<span style="color:#61affe">POST</span> `<ambiente>/ca-rentri/v1.0/credentials`**

Nel body della richiesta occorre specificare tutti i dati necessari per la creazione/aggiornamento delle credenziali.

> ℹ️ **IMPORTANTE**
> 
> Relativamente ai dati richiesti per la creazione delle credenziali, di seguito vengono date alcune informazioni aggiuntive:
> - **`utente_nome_cognome`**: è un campo di tipo `string`, *da compilare con nome e cognome* dell'utente utilizzatore dell'app, utilizzato per identificare colui che appone la firma remota.
> - **`utente_identificativo_altro`**: è un campo di tipo `string` che può essere utilizzato per inserire un eventuale identificativo alternativo dell'utente utilizzatore dell'app e/o del mezzo di trasporto (ad esempio la targa).
> - **`user_name`**: è un campo di tipo `string` che **deve** contenere il codice fiscale dell'utente utilizzatore dell'app nel caso in cui venga effettuato l'accesso all'app con autenticazione tramite SPID, CIE o CNS.
> - **`device_info`**: è l'oggetto che contiene varie informazioni del dispositivo, come ad esempio: modello, produttore, sistema operativo, ecc. e le informazioni necessarie per l'aggancio al [Servizio di smistamento delle notifiche](#servizio-di-smistamento-delle-notifiche), quali: l'URI di callback (campo **`notification_callback_uri`**) utilizzata da RENTRI per l'invio delle notifiche e un oggetto custom in formato JSON (campo **`notification_callback_parameters`**), utilizzabile dallo sviluppatore dell'app per il riconoscimento del dispositivo destinatario.
> Queste informazioni devono essere raccolte dall'app tramite l'accesso alle informazioni di sistema del dispositivo.
> - **`boarding_token`**: è il token di identificazione e autorizzazione della richiesta di boarding, ottenuto in precedenza dalla chiamata all'endpoint di recupero delle informazioni di boarding.

> 💡 **SUGGERIMENTO**
> 
> Consultare la documentazione di riferimento delle [API - ca-rentri](javascript:loadApi('ca-rentri')) per il dettaglio completo dei modelli dell'endpoint e degli eventuali parametri opzionali.

#### 1.2.1 Autenticazione

L'endpoint utilizzato richiede l'autenticazione, quindi è necessario seguire i passaggi indicati nel paragrafo [Autenticazione](javascript:loadPage('api-flussi-operativi-introduzione#autenticazione')).

#### 1.2.2 Invio dei dati

Il seguente esempio di codice C# mostra come creare/aggiornare le credenziali:

```csharp
using Newtonsoft.Json;
using System.Net.Http;

string basePath = "https://<ambiente>/ca-rentri/v1.0";

var client = new HttpClient();
// TODO: Inizializzare il client HTTP con gli header previsti per il tipo di richiesta (vedi pattern ID_AUTH_REST_02)

// Creazione del payload con le informazioni da inviare
var newCredentials = @"{
  ""identificativo_soggetto"": ""03991350376"",
  ""num_iscr_sito"": ""OP123XXXXXXXX00-PD00001"",
  ""utente_nome_cognome"": ""NOME COGNOME"",
  ""utente_identificativo_altro"": ""Altro Identificativo"",
  ""user_name"": ""ABCDEF80A01G224A"",
  ""device_info"": {
    ""identifier"": ""9c42e720a381c90f"",
    ""model"": ""SM-G985F"",
    ""manufacturer"": ""samsung"",
    ""name"": ""Galaxy S20+"",
    ""os_version"": ""13"",
    ""form_factor"": ""Phone"",
    ""type"": ""Physical"",
    ""platform"": ""Android"",
    ""notification_callback_uri"": ""https://server:port/rentri_notification_callback"",
    ""notification_callback_parameters"": ""{ 
      ""notification_platform"": ""fcm"", 
      ""push_channel"": ""cBErzIZsQVml5mimLxn-1O:ADA91bHvB0_o00sKfsez9s4Lwt13f-sPtleJeAWHp6FOIgHyoqehHGOHNOso0hBNua-KiWo0COp11tA9vO77YVRpg-yRIGZLyABH2pEARg-tWs8pRLijYL8rbMctIBF-w3eSnvLFFYMa"" 
    }""
  },
  ""app_info"": {
    ""name"": ""My RENTRI app"",
    ""package_name"": ""it.mycompany.myrentriapp"",
    ""version"": ""1.0"",
    ""build"": ""1""
  },
  ""boarding_token"": ""0ba94286-3eb8-40fc-bef8-4a09d0b1b7b5"",
}";
var content = new StringContent(newCredentials, System.Text.Encoding.UTF8, "application/json");
// TODO: Firmare il contenuto (vedi pattern INTEGRITY_REST_01)

// Invio della richiesta HTTP
var response = await client.PostAsync($"{basePath}/credentials", content, cancellationToken);
if (response.IsSuccessStatusCode)
{
	string result = await response.Content.ReadAsStringAsync();
	var credentials = JsonConvert.DeserializeObject<CreateCredentialsResponse>(result);
}
```

## 2. Sincronizzazione del dispositivo

Quando un dispositivo è stato abbinato con successo almeno una volta ad un operatore, è necessario sincronizzare periodicamente i dati del dispositivo e dell'app con il servizio RENTRI di gestione dei dispositivi per **mantenere il dispositivo attivo** (e la relativa istanza dell'app).

Le informazioni del dispositivo vengono utilizzate per vari scopi:
- Permettere/inibire determinate funzionalità in funzione della versione dell'app e/o del sistema operativo.
- Informare l'utente utilizzatore dell'app di eventuali aggiornamenti o modifiche importanti nelle funzionalità di RENTRI.
- Altro...

> 💡 **SUGGERIMENTO**
> 
> L'approccio utilizzato in questa implementazione e consigliato per le implementazioni di terze parti, è quello di mantenere in una cache locale dell'app le informazioni raccolte all'avvio e, ad ogni nuovo avvio, verificare se sono state modificate in seguito ad aggiornamenti del sistema operativo e/o dell'app stessa.
> Nel caso in cui vi siano state delle variazioni, devono essere comunicate le informazioni aggiornate richiamando l'endpoint per la sincronizzazione.

Per sincronizzare le informazioni del dispositivo, l'app deve richiamare il seguente endpoint:

&emsp;**<span style="color:#fca130">PUT</span> `<ambiente>/ca-rentri/v1.0/devices/sync`**

Nel body della richiesta occorre specificare tutti i dati necessari per la sincronizzazione.

> ℹ️ **IMPORTANTE**
> 
> All'interno del body della richiesta è presente il parametro **`notification_callback_parameters`**.
> Il valore di questo parametro viene **sempre sostituito al precedente** ad ogni sincronizzazione, quindi, **in ogni chiamata occorre inserire tutti i parametri** necessari allo sviluppatore dell'app per il riconoscimento del dispositivo destinatario.

> 💡 **SUGGERIMENTO**
> 
> Consultare la documentazione di riferimento delle [API - ca-rentri](javascript:loadApi('ca-rentri')) per il dettaglio completo dei modelli dell'endpoint e degli eventuali parametri opzionali.

### 2.1 Autenticazione

L'endpoint utilizzato richiede l'autenticazione, quindi è necessario seguire i passaggi indicati nel paragrafo [Autenticazione](javascript:loadPage('api-flussi-operativi-introduzione#autenticazione')).

### 2.2 Invio dei dati

Il seguente esempio di codice C# mostra come sincronizzare i dati di un dispositivo esistente:

```csharp
using Newtonsoft.Json;
using System.Net.Http;

string basePath = "https://<ambiente>/ca-rentri/v1.0";

var client = new HttpClient();
// TODO: Inizializzare il client HTTP con gli header previsti per il tipo di richiesta (vedi pattern ID_AUTH_REST_02)

// Creazione del payload con le informazioni da inviare
var deviceInfo = @"{
  ""identifier"": ""9c42e720a381c90f"",
  ""name"": ""(New) Galaxy S20+"",
  ""os_version"": ""13.1"",
  ""notification_callback_parameters"": ""{ 
    ""push_channel"": ""cBErzIZsQVml5mimLxn-1O:ADA91bHvB0_o00sKfsez9s4Lwt13f-sPtleJeAWHp6FOIgHyoqehHGOHNOso0hBNua-KiWo0COp11tA9vO77YVRpg-yRIGZLyABH2pEARg-tWs8pRLijYL8rbMctIBF-w3eSnvLFFYMa"" 
  }"",
  ""app_info"": {
    ""name"": ""My RENTRI app"",
    ""package_name"": ""it.mycompany.myrentriapp"",
    ""version"": ""1.1"",
    ""build"": ""2""
  }
}";
var content = new StringContent(deviceInfo, System.Text.Encoding.UTF8, "application/json");
// TODO: Firmare il contenuto (vedi pattern INTEGRITY_REST_01)

// Invio della richiesta HTTP
var response = await client.PutAsync($"{basePath}/devices/sync", content, cancellationToken);
if (response.IsSuccessStatusCode)
{
	// HTTP 202 Accepted: sincronizzazione conclusa correttamente
}
```

## 3. Gestione delle credenziali

Oltre alla gestione di dispositivi e credenziali messa a disposizione dall'area Operatori dell'ambiente corrispondente, nell'apposita sezione *Interoperabilità - Gestione dispositivi mobili*, RENTRI mette a disposizione ulteriori endpoint dedicati, tramite i quali è possibile gestire le seguenti operazioni relative alle credenziali:
- Cambio del PIN operativo.
- Ripristino del PIN operativo (o reset)&#x00B9;.
- Rimozione dell'associazione tra credenziali e unità locale&#x00B2;.

> ✒️ **NOTE**
>
> *1. Il ripristino del PIN operativo è una procedura che può essere attivata **solo dall'operatore**, tramite l'area Operatori dell'ambiente corrispondente, nell'apposita sezione Interoperabilità - Gestione dispositivi mobili.*
>
> *2. La rimozione dell'associazione tra le credenziali e un'unità locale può essere effettuata tramite l'app, se viene resa disponibile la funzionalità, ma anche dall'operatore, tramite l'area Operatori dell'ambiente corrispondente, nell'apposita sezione Interoperabilità - Gestione dispositivi mobili.*

### 3.1 Cambio del PIN operativo

Per cambiare il PIN operativo associato alle credenziali, l'app deve richiamare il seguente endpoint:

&emsp;**<span style="color:#fca130">PUT</span> `<ambiente>/ca-rentri/v1.0/credentials/{credentials_id}/change-pin`**

Nel path occorre specificare il parametro obbligatorio **`{credentials_id}`** che corrisponde all'identificativo delle credenziali (ad esempio: `B4HUPE820`).
Nel body della richiesta occorre specificare i seguenti parametri obbligatori:
- **`current_pin`** è il PIN operativo attualmente associato alle credenziali.
- **`new_pin`** è il nuovo PIN operativo da associare alle credenziali.

> 💡 **SUGGERIMENTO**
>
> Consultare la documentazione di riferimento delle [API - ca-rentri](javascript:loadApi('ca-rentri')) per il dettaglio completo dei modelli dell'endpoint e degli eventuali parametri opzionali.

#### 3.1.1 Autenticazione

L'endpoint utilizzato richiede l'autenticazione, quindi è necessario seguire i passaggi indicati nel paragrafo [Autenticazione](javascript:loadPage('api-flussi-operativi-introduzione#autenticazione')).

#### 3.1.2 Invio dei dati

Il seguente esempio di codice C# mostra come cambiare il PIN operativo associato alle credenziali:

```csharp
using Newtonsoft.Json;
using System.Net.Http;

string basePath = "https://<ambiente>/ca-rentri/v1.0";
string credentialsId = "B4HUPE820";

var client = new HttpClient();
// TODO: Inizializzare il client HTTP con gli header previsti per il tipo di richiesta (vedi pattern ID_AUTH_REST_02)

// Creazione del payload con le informazioni da inviare
var changePin = @"{
  ""current_pin"": ""123456"",
  ""new_pin"": ""987654""
}";
var content = new StringContent(newCredentials, System.Text.Encoding.UTF8, "application/json");
// TODO: Firmare il contenuto (vedi pattern INTEGRITY_REST_01)

// Invio della richiesta HTTP
var response = await client.PutAsync($"{basePath}/credentials/{credentialsId}/change-pin", content, cancellationToken);
if (response.IsSuccessStatusCode)
{
	// HTTP 200 Ok: PIN modificato correttamente
}
```

> ℹ️ **IMPORTANTE**
> 
> L'operazione può concludersi correttamente solamente se le credenziali utilizzate risultano essere **attive** nel momento in cui viene inviata la richiesta.

### 3.2 Ripristino del PIN operativo

L'utente utilizzatore dell'app può richiedere il ripristino del PIN operativo associato alle credenziali, nel caso in cui abbia dimenticato il PIN operativo attuale.
La richiesta deve essere inoltrata direttamente all'operatore corrispondente alle credenziali, il quale, tramite l'area Operatori dell'ambiente corrispondente, nell'apposita sezione *Interoperabilità - Gestione dispositivi mobili*, può attivare la procedura di ripristino del PIN operativo per le credenziali corrispondenti (vedi screenshot sottostante).

![Gestione dispositivi mobili](/docs/assets/api-flussi-operativi-mobile-02.png)

Nel momento in cui dal portale viene attivata la procedura di ripristino del PIN operativo, il servizio di smistamento delle notifiche RENTRI invia una notifica per l'app contenente le istruzioni per completare la procedura.
La procedura di ripristino rimane **attiva per 15 minuti**.
La modifica del PIN operativo deve essere completata all'interno dell'app entro questo lasso di tempo.
Se il PIN non viene ripristinato entro il tempo previsto o se viene annullata l'operazione dall'utente tramite l'app, la procedura si disattiva senza nessuna conseguenza per le credenziali, che continueranno a mantenere il PIN operativo corrente.

La notifica inviata all'app, è di tipo [CredentialsPinReset](#credentialspinreset). La gestione di tale notifica deve prevedere che all'interno dell'app venga presentato un apposito form in cui l'utente possa scegliere se procedere e modificare il PIN operativo, oppure annullare la procedura.

Per completare la procedura di ripristino del PIN operativo associato alle credenziali, l'app deve richiamare il seguente endpoint:

&emsp;**<span style="color:#fca130">PUT</span> `<ambiente>/ca-rentri/v1.0/credentials/{credentials_id}/reset-pin`**

Nel path occorre specificare il parametro obbligatorio **`{credentials_id}`** che corrisponde all'identificativo delle credenziali (ad esempio: `B4HUPE820`).
Nel body della richiesta occorre specificare il parametro obbligatorio **`token`** che corrisponde al GUID associato alla richiesta di ripristino (ad esempio: `01e98417-bd7c-49fb-9f8d-e00f2ad8ea71`).
I seguenti parametri opzionali devono invece essere **usati alternativamente**, a seconda di come si intende completare la procedura:
- **`new_pin`** è il nuovo PIN operativo da associare alle credenziali (*da inserire solo nel caso in cui si intenda completare la procedura di ripristino del PIN operativo*).
- **`abort`** per indicare che l'utente ha annullato la procedura di ripristino.

> 💡 **SUGGERIMENTO**
>
> Consultare la documentazione di riferimento delle [API - ca-rentri](javascript:loadApi('ca-rentri')) per il dettaglio completo dei modelli dell'endpoint e degli eventuali parametri opzionali.

#### 3.2.1 Autenticazione

L'endpoint utilizzato richiede l'autenticazione, quindi è necessario seguire i passaggi indicati nel paragrafo [Autenticazione](javascript:loadPage('api-flussi-operativi-introduzione#autenticazione')).

#### 3.2.2 Invio dei dati

Il seguente esempio di codice C# mostra come completare la procedura di ripristino del PIN operativo associato alle credenziali:

```csharp
using Newtonsoft.Json;
using System.Net.Http;

string basePath = "https://<ambiente>/ca-rentri/v1.0";
string credentialsId = "B4HUPE820";

var client = new HttpClient();
// TODO: Inizializzare il client HTTP con gli header previsti per il tipo di richiesta (vedi pattern ID_AUTH_REST_02)

// Creazione del payload con le informazioni da inviare
var resetPin = @"{
  ""token"": ""01e98417-bd7c-49fb-9f8d-e00f2ad8ea71"",
  ""new_pin"": ""987654""
}";
var content = new StringContent(newCredentials, System.Text.Encoding.UTF8, "application/json");
// TODO: Firmare il contenuto (vedi pattern INTEGRITY_REST_01)

// Invio della richiesta HTTP
var response = await client.PutAsync($"{basePath}/credentials/{credentialsId}/reset-pin", content, cancellationToken);
if (response.IsSuccessStatusCode)
{
	// HTTP 200 Ok: Procedura di ripristino completata e nuovo PIN operativo impostato correttamente
}
```

> ℹ️ **IMPORTANTE**
> 
> L'operazione può concludersi correttamente solamente se le credenziali utilizzate risultano essere **attive** nel momento in cui viene inviata la richiesta.

### 3.3 Rimozione dell'associazione tra credenziali e unità locale

La rimozione dell'associazione tra credenziali e unità locale può essere effettuata direttamente dall'utente utilizzatore dell'app, tramite l'app stessa, se viene messa a disposizione tale funzionalità.
In alternativa, l'operatore, tramite l'area Operatori dell'ambiente corrispondente, nell'apposita sezione *Interoperabilità - Gestione dispositivi mobili*, ha pieno controllo su tutti i dispositivi che hanno effettuato l'abbinamento e su tutte le credenziali corrispondenti che sono state generate.
Per ogni credenziale può visualizzare, ed eventualmente rimuovere, l'associazione con le proprie unità locali.

Per rimuovere l'associazione tra le credenziali e un'unità locale, l'app deve richiamare il seguente endpoint:

&emsp;**<span style="color:#f93e3e">DELETE</span> `<ambiente>/ca-rentri/v1.0/credentials/{credentials_id}/rimuovi-associazione`**.

Nel path occorre specificare il parametro obbligatorio **`{credentials_id}`** che corrisponde all'identificativo delle credenziali (ad esempio: `B4HUPE820`).
Nella query string occorre specificare il parametro obbligatorio **`num_iscr_sito`** che corrisponde al numero iscrizione unità locale rilasciato all'iscrizione, da rimuovere (ad esempio: `OP123XXXXXXXX00-PD00001`).

> 💡 **SUGGERIMENTO**
>
> Consultare la documentazione di riferimento delle [API - ca-rentri](javascript:loadApi('ca-rentri')) per il dettaglio completo dei modelli dell'endpoint e degli eventuali parametri opzionali.

#### 3.3.1 Autenticazione

L'endpoint utilizzato richiede l'autenticazione, quindi è necessario seguire i passaggi indicati nel paragrafo [Autenticazione](javascript:loadPage('api-flussi-operativi-introduzione#autenticazione')).

#### 3.3.2 Invio dei dati

Il seguente esempio di codice C# mostra come rimuovere l'associazione tra le credenziali e un'unità locale:

```csharp
using Newtonsoft.Json;
using System.Net.Http;

string basePath = "https://<ambiente>/ca-rentri/v1.0";
string credentialsId = "B4HUPE820";
string ulToDelete = "OP123XXXXXXXX00-PD00001";

var client = new HttpClient();
// TODO: Inizializzare il client HTTP con gli header previsti per il tipo di richiesta (vedi pattern ID_AUTH_REST_02)

// Invio della richiesta HTTP
var response = await client.DeleteAsync($"{basePath}/credentials/{credentialsId}/rimuovi-associazione?num_iscr_sito={ulToDelete}", cancellationToken);
if (response.IsSuccessStatusCode)
{
	// HTTP 202 Accepted: Associazione eliminata
}
```

> ℹ️ **IMPORTANTE**
> 
> L'operazione può concludersi correttamente solamente se le credenziali utilizzate risultano essere **attive** nel momento in cui viene inviata la richiesta.

## 4. Autorizzazione credenziali per il 2FA della firma remota

In questo capitolo viene illustrato come avviene l'interazione con le API **_CSC - Firma digitale RENTRI_** e le API **_Gestione credenziali_** in un flusso operativo che permette di apporre una firma digitale remota con il certificato di dominio RENTRI.

### 4.1 Richiesta di autorizzazione delle credenziali

La richiesta di autorizzazione alla firma tramite le credenziali, deve essere invocata dal canale primario, che può essere un'app mobile (oppure un'applicazione desktop o un servizio Web), che necessita dell'ottenimento di un codice hash firmato per completare la creazione di una struttura dati firmata.
L'autorizzazione viene richiesta per la firma di uno specifico codice hash che dovrà quindi essere già stato calcolato al momento della richiesta.

Per richiedere l'autorizzazione delle credenziali per la firma remota di un determinato codice hash, l'app deve richiamare il seguente endpoint:

&emsp;**<span style="color:#61affe">POST</span> `<ambiente>/ca-rentri/v1.0/credentials/authorize`**

Nel body della richiesta occorre specificare tutti i dati necessari per la richiesta di autorizzazione alla firma.

> 💡 **SUGGERIMENTO**
> 
> Consultare la documentazione di riferimento delle [API - ca-rentri](javascript:loadApi('ca-rentri')) per il dettaglio completo dei modelli dell'endpoint e degli eventuali parametri opzionali.

#### 4.1.1 Autenticazione

L'endpoint utilizzato richiede l'autenticazione, quindi è necessario seguire i passaggi indicati nel paragrafo [Autenticazione](javascript:loadPage('api-flussi-operativi-introduzione#autenticazione')).

#### 4.1.2 Invio dei dati

Il seguente esempio di codice C# mostra come richiedere l'autorizzazione delle credenziali per la firma remota di un determinato codice hash:


```csharp
using Newtonsoft.Json;
using System.Security.Cryptography;
using System.Text;
using System.Net;

string basePath = $"https://<ambiente>/ca-rentri/v1.0";
string credentialsId = "B4HUPE820";
string digest = Convert.ToBase64String(SHA256.Create().ComputeHash(Encoding.ASCII.GetBytes("ciao mondo!")));

var client = new HttpClient();
// TODO: Inizializzare il client HTTP con gli header previsti per il tipo di richiesta (vedi pattern ID_AUTH_REST_02)

// Creazione della request
var requestAuthorize = $@"{{
    ""credentials_id"": ""{credentialsId}"",
    ""num_signatures"": 1,
    ""hashes"": [""{ digest }""],
    ""hash_algo"": ""2.16.840.1.101.3.4.2.1"",
    ""description"": ""Firma remota per il file <codice hash>/<nome file>"",
    ""auth_data"": [{{ ""id"": ""mobile"" }}],
    ""client_data"": ""Eventuali informazioni aggiuntive relative all'operazione""
}}";
var content = new StringContent(requestAuthorize, Encoding.UTF8, "application/json");
// TODO: Firmare il contenuto (vedi pattern INTEGRITY_REST_01)

// Modello di output dell'operazione
CredentialsAuthorizeResponse authorize = null;

// Invio della richiesta HTTP
var response = await client.PostAsync($"{basePath}/credentials/authorize", content, cancellationToken);
if (response.IsSuccessStatusCode)
{
    var result = await response.Content.ReadAsStringAsync();
    authorize = JsonConvert.DeserializeObject<CredentialsAuthorizeResponse>(result);
}

```

> ℹ️ **IMPORTANTE**
> 
> L'operazione può concludersi correttamente solamente se le credenziali utilizzate risultano essere **attive** nel momento in cui viene inviata la richiesta.

Nell'oggetto JSON ottenuto in risposta e deserializzato nella variabile **authorize**, sono presenti le seguenti informazioni:
- **`sad`**: (_Signature Activation Data_) un token che lega l'autorizzazione al codice hash per cui si richiede la firma.
- **`handle`**: identificativo dell'operazione di autorizzazione.
- **`expires_in`**: numero di secondi entro cui il **`sad`** verrà considerato valido.

Una volta richiesta l'autorizzazione è necessario attendere che il dispositivo associato alle credenziali ne autorizzi l'utilizzo. Se l'applicazione richiedente l'autorizzazione non è la stessa a cui si prevede di recapitare il messaggio, si potrà utilizzare l'endpoint per il controllo dello stato dell'autorizzazione in modalità _polling_, fino a quando non riceverà una risposta positiva:

```csharp
//...
string handle = authorize.Handle; // handle restituito dall'operazione precedente di richiesta dell'autorizzazione

while (true) {
	var client = new HttpClient();
    // TODO: Inizializzare il client HTTP con gli header previsti per il tipo di richiesta (vedi pattern ID_AUTH_REST_02)

	var response = await client.GetAsync($"{basePath}/credentials/authorize-check/{handle}");
	var result = await response.Content.ReadAsStringAsync();

    if (response.StatusCode == HttpStatusCode.Accepted) 
    {
        Thread.Sleep(1000);
    }
    else if (response.StatusCode == HttpStatusCode.OK) 
    { 
        authorize = JsonConvert.DeserializeObject<CredentialsAuthorizeResponse>(result);
        break;
    }
    else
    { 
        // TODO: Error handling...
        break;
    }
}
```

### 4.2 Conferma dell'autorizzazione all'uso delle credenziali

A seguito della richiesta di autorizzazione all'utilizzo delle credenziali, il servizio di smistamento delle notifiche RENTRI invierà una richiesta verso l'URL di callback specificato nel campo **`notification_callback_uri`** indicato durante il boarding del dispositivo.
All'interno della richiesta, saranno presenti sia i parametri specificati nel campo **`notification_callback_parameters`** (anch'essi indicati durante il boarding) sia i dati che il servizio di gestione delle notifiche push (implementato da terze parti all'interno del servizio referenziato dall'URL di callback) dovrà inviare all'app sottoforma di notifica push per la conferma dell'operazione.
L'esempio sottostante rappresenta il contenuto di una richiesta che viene inviata dal servizio di smistamento delle notifiche RENTRI all'URL **`notification_callback_uri`** a seguito della richiesta di autorizzazione delle credenziali:

```json
{
    "type": "Notification",
    "credentials_id": "B4HUPE820",
    "device": {
        "identifier": "9c42e720a381c90f",
        "notification_callback_uri": "https://server:port/rentri_notification_callback",
        "notification_callback_parameters": {
            "notification_platform": "FcmV1",
            "push_channel": "cBErzIZsQVml5mimLxn-1O:ADA91bHvB0_o00sKfsez9s4Lwt13f-sPtleJeAWHp6FOIgHyoqehHGOHNOso0hBNua-KiWo0COp11tA9vO77YVRpg-yRIGZLyABH2pEARg-tWs8pRLijYL8rbMctIBF-w3eSnvLFFYMa"
        }
    },
    "rentri_push_notification": {
        "action": "AuthorizeCredentials",
        "handle": "cff3dceb-6872-4251-8787-f7e8b8b4fa4f",
        "otp": "123456",
        "credentials_id": "B4HUPE820",
        "title": "RENTRI - Dashboard dispositivi",
        "body": "Confermare l'autorizzazione all'utilizzo delle credenziali B4HUPE820 per la firma."
    }
}
```

> ℹ️ **IMPORTANTE**
> 
> Così come per le notifiche dell'esito delle transazioni asincrone, l'URL indicato in **`notification_callback_uri`** deve essere raggiungibile dall'esterno e deve essere protetto da un **certificato SSL/TLS valido**.

Per completare la richiesta di autorizzazione, l'app deve richiamare il seguente endpoint:

&emsp;**<span style="color:#61affe">POST</span> `<ambiente>/ca-rentri/v1.0/credentials/authorize-confirmation`**

Nel body della richiesta occorre specificare tutti i dati necessari per la richiesta di autorizzazione alla firma.

> 💡 **SUGGERIMENTO**
> 
> Consultare la documentazione di riferimento delle [API - ca-rentri](javascript:loadApi('ca-rentri')) per il dettaglio completo dei modelli dell'endpoint e degli eventuali parametri opzionali.

#### 4.2.1 Autenticazione

L'endpoint utilizzato richiede l'autenticazione, quindi è necessario seguire i passaggi indicati nel paragrafo [Autenticazione](javascript:loadPage('api-flussi-operativi-introduzione#autenticazione')).

#### 4.2.2 Invio dei dati

Il seguente esempio di codice C# mostra come dall'app è possibile confermare l'autorizzazione all'utilizzo delle credenziali:


```csharp
using Newtonsoft.Json;
using System.Net;

string basePath = "https://<ambiente>/ca-rentri/v1.0";

// Valori recuperati dalla notifica all'app
string otp = "123456";
string handle = "cff3dceb-6872-4251-8787-f7e8b8b4fa4f";
string credentialsId = "B4HUPE820";

var client = new HttpClient();
// TODO: Inizializzare il client HTTP con gli header previsti per il tipo di richiesta (vedi pattern ID_AUTH_REST_02)

var authorizeConfirmation = $@"{{
    ""credentials_id"": ""{credentialsId}"",
    ""handle"": ""{handle}"",
    ""allowed"": true,
    ""pin"": ""317372"",
    ""otp"": ""{otp}"",
}}";
var content = new StringContent(authorizeConfirmation, Encoding.UTF8, "application/json");
// TODO: Firmare il contenuto (vedi pattern INTEGRITY_REST_01)

var response = await client.PutAsync($"{basePath}/credentials/authorize-confirmation", content, cancellationToken);
if (response.IsSuccessStatusCode) 
{
    // HTTP 200 Ok: Autorizzazione confermata 
    // A questo punto, una successiva chiamata all'endpoint GET /credentials/authorize-check/{handle} restituirà HTTP 200 Ok 
}
```

> ℹ️ **IMPORTANTE**
> 
> L'operazione può concludersi correttamente solamente se le credenziali utilizzate risultano essere **attive** nel momento in cui viene inviata la richiesta.

### 4.3 Completamento dell'operazione di firma

Al termine del ciclo di autorizzazione all'utilizzo delle credenziali per la firma del codice hash, per ottenere la firma è possibile invocare il seguente endpoint:

&emsp;**<span style="color:#61affe">POST</span> `<ambiente>/ca-rentri/v1.0/signatures/sign-hash`**

Nel body della richiesta occorre specificare tutti i dati necessari per la richiesta di autorizzazione alla firma.

> ℹ️ **IMPORTANTE**
> 
> L'operazione di firma richiede che vengano specificati i seguenti parametri:
> - Le credenziali per cui è stato autorizzato l'utilizzo.
> - Il _Signature Activation Data_ restituito dalla chiamata per la richiesta dell'autorizzazione.
> - Il codice hash da firmare.
> - L'algoritmo di _hashing_ utilizzato per calcolare il codice hash.

> 💡 **SUGGERIMENTO**
> 
> Consultare la documentazione di riferimento delle [API - ca-rentri](javascript:loadApi('ca-rentri')) per il dettaglio completo dei modelli dell'endpoint e degli eventuali parametri opzionali.

#### 4.3.1 Autenticazione

L'endpoint utilizzato richiede l'autenticazione, quindi è necessario seguire i passaggi indicati nel paragrafo [Autenticazione](javascript:loadPage('api-flussi-operativi-introduzione#autenticazione')).

#### 4.3.2 Invio dei dati

Il seguente esempio di codice C# mostra come richiedere la firma del codice hash:

```csharp   
using Newtonsoft.Json;
using System.Net;

string basePath = "https://<ambiente>/ca-rentri/v1.0";
string credentialsId = "B4HUPE820";
string digest = Convert.ToBase64String(SHA256.Create().ComputeHash(Encoding.ASCII.GetBytes("ciao mondo!"));

var client = new HttpClient();
// TODO: Inizializzare il client HTTP con gli header previsti per il tipo di richiesta (vedi pattern ID_AUTH_REST_02)

var signHash = $@"{{
    ""credentials_id"": ""{credentialsId}"",
    ""sad"": ""{credentials.Sad}"",
    ""hashes"": [""{digest}""],
    ""sign_algo"": ""1.2.840.10045.4.3.2"",
}}";
var content = new StringContent(signHash, Encoding.UTF8, "application/json");
// TODO: Firmare il contenuto (vedi pattern INTEGRITY_REST_01)

response = await client.PostAsync($"{basePath}/signatures/sign-hash", content, cancellationToken);
string result = await response.Content.ReadAsStringAsync();

var signatures = JsonConvert.DeserializeObject<SignatureResponse>(result);
```
> ℹ️ **IMPORTANTE**
> 
> L'operazione può concludersi correttamente solamente se le credenziali utilizzate risultano essere **attive** nel momento in cui viene inviata la richiesta.

Il numero di firme di codici hash richiedibili per ogni richiesta è **limitato a 1**, quindi l'array nel campo **`signatures`** della risposta conterrà sempre un solo elemento.
Allo stesso modo, i parametri tecnici relativi alla firma digitale, ovvero l'algoritmo di hashing di firma e l'algoritmo crittografico della chiave, sono pre-impostati e **non modificabili**.
I valori si riferiscono agli OID (_Object Identifiers_) definiti negli appositi RFC:
- **`"2.16.840.1.101.3.4.2.1"`**: per l'algoritmo di hashing SHA256.
- **`"1.2.840.10045.4.3.2"`**: per l'algoritmo crittografico ECDSAWithSHA256 per firme di hash SHA256 con chiavi ECDSA.

Entrambi sono da utilizzare come costanti.

La firma crittografica restituita viene calcolata con la **chiave privata** associata al certificato di dominio RENTRI per la **firma remota** che è reso disponibile nell'area Operatori dell'ambiente corrispondente, nell'apposita sezione *Interoperabilità - Emissione certificati digitali RENTRI*.
Il certificato di firma remota è ottenibile anche via API utilizzando il seguente endpoint:

&emsp;**<span style="color:#61affe">GET</span> `<ambiente>/ca-rentri/v1.0/credentials/info`**

Nella query string occorre specificare il parametro **`cert_info=true`** per chiedere la restituzione del certificato nell'esito della richiesta.

#### 4.3.3 Verifica della firma

Il seguente esempio di codice C# mostra come, utilzzando la chiave pubblica contenuta nel certificato, è possibile effettuare una verifica locale della corrispondenza tra il codice hash firmato e la firma calcolata da RENTRI con la chiave privata associata al certificato di firma remota:

```csharp
using Newtonsoft.Json;
using System.Net;
using System.Security.Cryptography.X509Certificates;

SignatureResponse signatures = null;
// Recupero dell'esito dell'operazione "sign-hash";

string basePath = "https://<ambiente>/ca-rentri/v1.0";
string credentialsId = "B4HUPE820";
string digest = Convert.ToBase64String(SHA256.Create().ComputeHash(Encoding.ASCII.GetBytes("ciao mondo!")));

var client = new HttpClient();
// TODO: Inizializzare il client HTTP con gli header previsti per il tipo di richiesta (vedi pattern ID_AUTH_REST_02)

var response = await client.GetAsync($"{basePath}/credentials/info?credentials_id={credentialsId}&cert_info=true&certificates=single");
var result = await response.Content.ReadAsStringAsync();

var credInfo = JsonConvert.DeserializeObject<CredentialsInfoResponse>(result)!;
var x509Cert = new X509Certificate2(Convert.FromBase64String(credInfo.Cert.Certificates.FirstOrDefault()));

var esito = x509Cert.GetECDsaPublicKey()!.VerifyHash(
    Convert.FromBase64String(digest),
    Convert.FromBase64String(signatures.Signatures[0])
);
```

Il valore presente nell'array restituito dall'endpoint di firma rappresenta la firma crittografica del codice hash fornito nel modello di input e può essere utilizzato per comporre qualsiasi tipo di struttura dati firmata tra le specifiche previste dagli standard _(*)AdES_ della normativa eIDAS.
Ovviamente farà riferimento al certificato di dominio RENTRI, che dovrà quindi essere incluso nella _Trusted Provider List_ della policy di validazione dello strumento di verifica, se si vuole ottenere un esito della verifica positivo anche in termini di validità della catena di affidabilità dei certificati.

---

*Ultimo aggiornamento: 28/07/2025*