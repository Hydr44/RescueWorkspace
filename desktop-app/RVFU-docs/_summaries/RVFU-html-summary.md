# RVFU HTML — Sintesi documentazione

## Struttura cartella
- `01_intro.md`: indice completo degli endpoint, derivato dal portale Swagger. Elenca tutti i controller e le relative operazioni (identificate da `operationId`).
- `02_endpoints_veicolo.md`: dettaglio degli endpoint per anagrafiche veicolo/agenzia con esempi di codice (Java, ObjC, Node.js, C#) generati automaticamente.
- `03_endpoints_fascicolo.md`: operazioni su fascicoli e gestione documentale con esempi client.
- `04_endpoints_delega.md`: CRUD deleghe per ogni attore.
- `05_endpoints_vfu.md`: cuore del processo VFU (inserimento, presa in carico, trasferimento, radiazione, demolizione, preservazione, export).
- `06_utility_monitoraggio.md`: servizi di supporto (tipologiche, lookup, monitoraggio) con snippet di integrazione.

## Contenuti chiave rispetto ai JSON
- Ampia presenza di **esempi di integrazione** (Java, Objective-C, JS, C#, Python placeholder), utili per capire payload e chiamate reali.
- Specifica puntuale degli **header** da inviare (`Content-Type`, `Accept-API-Version`, token IAM) nei sample di autenticazione.
- Chiarezza sui **tipi di ritorno** (`VfuRestResponseOf...`) e sulle firme dei metodi client generati dallo Swagger codegen.
- Convalida visiva delle descrizioni delle operazioni (es. quali endpoint generano certificati, ricevute, postille, export PDF/XLSX, invio al tablet).
- Evidenza di nuove operazioni introdotte dalle versioni più recenti:
  - `generaPostillaCdrUsingPOST`, `generaCertificatoRottamazioneUsingPOST`, `generaRicevutaPresaInCaricoUsingPOST`.
  - `annullaAndClonaCartellaFirmaVFUUsingDELETE` per gestire sessioni di firma appese.
  - `consultaPreservati`, `trasferisciVFU`, `cediVFU`, `notaPartiRifiuti` come filtri.
  - `inviaAlTabletUsingPUT` per workflow di firma remota.
- Conferma dei **percorsi REST** per tutti gli attori: `/concessionario/...`, `/cr/...`, `/agenzia/...`, `/umc/...`, `/internal/...`.

## Informazioni operative da estrarre
- Parametri obbligatori e facoltativi con tipi (`string`, `int64`, `date-time`, `boolean`) e semantica (es. `filtri paginazione`, `codiceFiscaleRitiro`, `obbligoIscrizionePRA`, `notePartiRifiuti`).
- Elenco completo delle **tipologiche** disponibili via utility (stati VFU, stati fascicolo, tipi documento, causali trasferimento, liste comuni/province/stati esteri, codici ISTAT).
- Endpoint per **gestione documenti**: upload (`multipart/form-data`), download (PDF, ZIP), sostituzione, cancellazione, generazione ricevute/certificati.
- Endpoint per **monitoraggio** (descrizioni, progress) utili a costruire dashboard interne di verifica integrazione.

## Implicazioni per il progetto
- Utilizzare gli esempi di codice come base per costruire i client REST (adattandoli a Fetch/Axios o libreria server-side); definire interfacce TypeScript partendo dalle classi `VFUCreateAsCR`, `VFUElimina`, `VfuRestResponse...`.
- Prevedere nel modulo un layer di astrazione che permetta di indirizzare automaticamente l’attore corretto (CR, Concessionario, Agenzia, UMC) selezionando la route adeguata.
- Integrare nei test automatici gli scenari suggeriti (inserimento → conferimento → presa in carico → radiazione → demolizione/preservazione) replicando gli esempi di chiamata.
- Tenere conto delle operazioni “di servizio” (es. annullaAndClonaCartellaFirma, inviaAlTablet) per evitare blocchi nei workflow di firma remota.

## Prossimi passi
- Allineare questa sintesi con il manuale e i diagrammi di sequenza per costruire la matrice **azione ↔ endpoint ↔ payload ↔ schermata**.
- Derivare checklist di implementazione UI e validazioni (es. controllo campi obbligatori prima di chiamare `generaCertificatoRottamazione`).
- Preparare template di richieste HTTP (Postman/Insomnia) utilizzando gli esempi forniti come base.

