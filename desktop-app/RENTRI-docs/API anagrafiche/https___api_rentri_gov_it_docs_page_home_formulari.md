<div id="stoplight">

</div>

<div id="swagger" style="display: none;">

</div>

<div id="md-container">

<div class="row">

<div class="d-none d-sm-block col-sm-5 col-md-4 col-lg-4 col-xl-3">

<div class="title-sidebar">

<div class="sidebar-wrapper">

<div class="sidebar-linklist-wrapper">

<div class="link-list-wrapper">

- ### Home

- <a href="#interoperabilit-rentri"
  class="list-item"><span>Interoperabilità RENTRI</span></a>

- <a
  href="#lista-dei-servizi-di-interoperabilit-resi-disponibili-tramite-api"
  class="list-item"><span>Lista dei servizi di interoperabilità, resi
  disponibili tramite API</span></a>

- <a href="#anagrafiche" class="list-item"><span>anagrafiche</span></a>

- <a href="#ca-rentri" class="list-item"><span>ca-rentri</span></a>

- <a href="#codifiche" class="list-item"><span>codifiche</span></a>

- <a href="#dati-registri"
  class="list-item"><span>dati-registri</span></a>

- <a href="#formulari" class="list-item"><span>formulari</span></a>

- <a href="#vidimazione-formulari"
  class="list-item"><span>vidimazione-formulari</span></a>

- <a href="#api-in-produzione" class="list-item"><span>API in
  produzione</span></a>

- <a href="#modalit-stub" class="list-item"><span>Modalità STUB</span></a>

</div>

</div>

</div>

</div>

</div>

<div class="col-sm-7 col-md-8 col-lg-8 col-xl-9 container px-4 my-4">

## <span id="interoperabilit-rentri">Interoperabilità RENTRI</span>

L'interoperabilità RENTRI consente di trasmettere al RENTRI, tramite
porta applicativa (API):

- i dati del registro cronologico di carico e scarico;
- i dati dei formulari di identificazione del rifiuto (FIR).

Inoltre sono presenti altri servizi per:

- la vidimazione virtuale dei formulari e dei registri di cronologici di
  carico e scarico;
- l'accesso alle anagrafiche RENTRI;
- i servizi di firma remota con certificato di dominio RENTRI;
- l'accesso alle tabelle di codifica.

Per il glossario consultare l’area di
<a href="https://www.rentri.gov.it/supporto"
target="_blank">Supporto</a> del sito RENTRI.

## <span id="lista-dei-servizi-di-interoperabilit-resi-disponibili-tramite-api">Lista dei servizi di interoperabilità, resi disponibili tramite API</span>

### <span id="anagrafiche">anagrafiche</span>

Il servizio consente all'operatore di accedere ai dati anagrafici delle
proprie unità locali iscritte al RENTRI e alla definizione dei relativi
registri.

Le specifiche OpenApi tecniche del servizio sono esposte nella pagina
[API - anagrafiche](javascript:loadApi('anagrafiche')).

### <span id="ca-rentri">ca-rentri</span>

Il servizio consente di utilizzare la firma remota con certificato di
dominio RENTRI. E' possibile gestire anche l'elenco dei device, e delle
relative credenziali associate, utilizzati nel processo di firma.

Le specifiche OpenApi tecniche del servizio sono esposte nella pagina
[API - ca-rentri](javascript:loadApi('ca-rentri')).

### <span id="codifiche">codifiche</span>

Il servizio espone la rotta *lookup* che consente di accedere alle
tabelle di codifica utilizzate nei servizi.

Le specifiche OpenApi tecniche del servizio sono esposte nella pagina
[API - codifiche](javascript:loadApi('codifiche')).

### <span id="dati-registri">dati-registri</span>

Il servizio consente all’operatore iscritto di trasmettere al RENTRI,
mediante interoperabilità, i dati relativi alle registrazioni annotate
nei propri registri cronologici di carico e scarico tenuti in modalità
digitale. La trasmissione deve essere effettuata secondo le tempistiche
indicate dal D.M. 4 aprile 2023, n. 59.

Le specifiche OpenApi tecniche del servizio sono esposte nella pagina
[API - dati-registri](javascript:loadApi('dati-registri')).

### <span id="formulari">formulari</span>

Il servizio consente all’operatore iscritto di trasmettere al RENTRI i
dati contenuti nei FIR, relativi ai soli rifiuti pericolosi, al fine di
alimentare la sezione “Tracciabilità” dello stesso RENTRI. La
trasmissione deve essere effettuata secondo le tempistiche indicate
nelle Modalità Operative approvate con Decreto direttoriale n. 143 del 6
novembre 2023 e pubblicate sul sito del RENTRI.

Le specifiche OpenApi tecniche del servizio sono esposte nella pagina
[API - formulari](javascript:loadApi('formulari')).

### <span id="vidimazione-formulari">vidimazione-formulari</span>

Il servizio permette a imprese ed enti di produrre e vidimare
virtualmente il FIR. Per vidimare il FIR l'operatore deve essere
iscritto al RENTRI oppure registrato nell'area riservata "Produttori di
rifiuti non iscritti"

Le specifiche OpenApi tecniche del servizio sono esposte nella pagina
[API -
vidimazione-formulari](javascript:loadApi('vidimazione-formulari')).

## <span id="api-in-produzione">API in produzione</span>

A partire dal 15 dicembre 2024 sono disponibili le API in produzione,
inizialmente solo in "modalità STUB" (descritta nel capitolo
successivo), per poi essere aperte come indicato nella seguente tabella.

| API v1.0 «Stub» (dal 15/12/24) | API v1.0 VIDIMAZIONE (dal 23/01/25) | API v1.0 (dal 13/02/25) |
|:---|:---|:---|
| /anagrafiche/v1.0 | Aperta | Aperta |
| /ca-rentri/v1.0 (solo /status, /ca/{num_seriale_ca_cert}, /ca/{num_seriale_ca_cert}/crl) | Aperta | Aperta |
| /codifiche/v1.0 | Aperta | Aperta |
| /dati-registri/v1.0 | Stub | Aperta |
| /formulari/v1.0 (solo /status, /{transazione_id}/status, /{transazione_id}/result, gruppo copia FIR cartaceo) | Stub | Aperta |
| /vidimazione-formulari/v1.0 | Aperta | Aperta |

Sono escluse le API relative ai FIR Digitali e di integrazione con APP
mobile, che rimangono in sperimentazione in ambiente DEMO.

### <span id="modalit-stub">Modalità STUB</span>

La "modalità STUB" è temporanea (come indicato nella tabella) e viene
messa a disposizione per permettere il collaudo del solo collegamento
alle API da parte dei gestionali.

Le richieste possono essere eseguite secondo quanto indicato nella
documentazione, tuttavia l’elaborazione sarà gestita diversamente:

- Le richieste GET all'endpoint /status, per la verifica dello stato di
  funzionamento di un servizio, restituiranno il codice di stato 422 e
  una risposta vuota
- Le altre richieste GET restituiranno il codice di stato 200 e una
  risposta vuota
- Le richieste POST, DELETE e PUT restituiranno il codice di stato 422
- Per gli endpoint che prevedono l'autenticazione, questa dovrà essere
  effettuata secondo quanto indicato nella documentazione e verrà
  ritornato il codice di stato 401 qualora l'autenticazione fallisca

Anche nella documentazione descrittiva del singolo servizio è riportata
l'indicazione sulla disponibilità in modalità STUB.

------------------------------------------------------------------------

*Ultimo aggiornamento: 13/12/2024*

</div>

</div>

</div>

<div id="ecoassist">

</div>
