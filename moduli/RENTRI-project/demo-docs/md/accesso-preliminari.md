## Architettura

Il servizio utilizza l’architettura “RESTful API” (REpresentational State Transfer Application 
Programming Interface) attraverso l’esposizione di una serie di endpoint web (delle URL) che 
rispondono alle richieste fatte da uno sviluppatore attraverso il protocollo HTTP.

Il principio REST stabilisce una precisa mappatura tra le tipiche operazioni CRUD (creazione, lettura, 
aggiornamento, eliminazione di una risorsa) e i metodi HTTP.

| Metodo http  | Operazione CRUD | Descrizione |
|---|---|---|
| **<span style="color:#61affe">POST</span>** | Create | Crea una nuova risorsa |
| **<span style="color:#49cc90">GET</span>** | Read | Ottiene una risorsa esistente |
| **<span style="color:#fca130">PUT</span>** | Update | Aggiorna una risorsa o ne modifica lo stato |
| **<span style="color:#f93e3e">DELETE</span>** | Delete | Elimina una risorsa |

## Versionamento

A regime, l’aggiornamento e l’evoluzione dei servizi esposti avviene mediante l’indicazione di un numero di 
versione (major number.minor number) direttamente nel path che qualifica l’URL web oppure, in caso di bug fix o modifiche retrocompatibili, con l'incremento del patch number.

Nell'ambiente DEMO è applicato un **versionamento semplificato** che non prevede il cambio di numero di versione major.minor e quindi non prevede il cambio di path.

Il versionamento semplificato proseguirà anche in produzione, fino al 13/02/2025.

In continuità di versione, dal 14/02/2025:  
- Verrà applicato il **Versionamento Semantico** \<major number\>.\<minor number\>.\<patch number\> (es. 1.1.20240711)
- \<major number\> incrementato in caso di modifiche importanti alle interfacce API (high impact breaking change)
- \<minor number\> incrementato in caso di modifiche alle interfacce API (moderate impact breaking change) 
- \<patch number\> incrementato nei casi di bug fix o modifiche retrocompatibili alle interfacce API (inclusa aggiunta di nuove funzionalità minori)

```
/v[major].[minor]
```
dove *major* e *minor* rappresentano la versione del servizio utilizzata anche per la composizione dell'URL.

Esempio:
```http
https://demoapi.rentri.gov.it/anagrafiche/v1.0/operatore
```

### Ciclo di vita API

- Le nuove versioni API (major.minor) verranno pubblicate in anteprima in DEMO e successivamente, dopo un periodo di consolidamento adeguato, rilasciate in PRODUZIONE 
- Ad ogni nuova versione rilasciata, verranno rimosse le funzionalità precedentemente indicate con attributo “Deprecato”  
- Al rilascio in PRODUZIONE di una nuova versione, la precedente continuerà ad essere disponibile, ma «deprecata» e solo fino ad una “data di fine vita”, che verrà dichiarata in anticipo. A partire dalla “data di fine vita”, la relativa versione non sarà più disponibile, né in DEMO né in PRODUZIONE
- Per tutte le API, la prima versione ad essere rilasciata in produzione sarà la 1.0.\<ultimo patch number in demo\> 

Il ciclo di vita si intende per le singole API, che dopo il 13/2/2025 potranno potenzialmente avere versioni diverse (es. /anagrafiche/v1.0, /dati-registri/v1.0, /vidimazione-formulari/v1.1, etc.)

### Esempio ciclo di vita versioni API

![Esempio ciclo di vita versioni API](/docs/assets/esempio-ciclo-vita-api.png)

## Catalogo API

Il catalogo delle API viene esposto tramite la specifica [OpenAPI 3](https://spec.openapis.org/oas/v3.1.0), ed è navigabile anche attraverso l’interfaccia *Stoplight* e *Swagger* accedendo al menu *API*.

Di seguito vengono indicati gli indirizzi dei servizi degli ambienti **DEMO** e **PRODUZIONE**:

```http
https://demoapi.rentri.gov.it/docs
https://api.rentri.gov.it/docs
```

## Messaggi di errore

In caso di status code della risposta diverso da `200` ("2xx" il 2 iniziale significa "successo"), il sistema risponde 
con un oggetto JSON secondo quanto indicato dall’[RFC 7807](https://www.rfc-editor.org/rfc/rfc7807.html).

Alla struttura standard contenente le proprietà **`type`**, **`title`** e **`status`**, si aggiunge una proprietà 
**`model_state`**, contenente un dizionario, le cui chiavi rappresentano i riferimenti dei dati in cui è stato
rilevato l’errore, e i cui valori contengono un array dei relativi codici di errore.

In caso di errore generico la chiave del dizionario è valorizzata a generic.

```json
{
 "type": "https://httpstatuses.com/400",
 "title": "Bad Request",
 "status": 400,
 "model-state": {
	 "[0].dati": [
		"sys.required"
	 ],
	 "[0].identificativo": [
		"sys.required"
	 ]
 }
}

```

L'elenco dei codici di errore e dei relativi messaggi si ottiene tramite l'accesso all'API **codifiche**:
```http
https://demoapi.rentri.gov.it/codifiche/v[major].[minor]/lookup/codici-errore
https://api.rentri.gov.it/codifiche/v[major].[minor]/lookup/codici-errore
```

---

*Ultimo aggiornamento: 12/12/2024*