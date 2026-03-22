## Obiettivi

In questo documento verranno indicate le modalità, relativamente ai pattern sicurezza, che 
permettono l’accesso ai servizi interoperanti e la verifica dell’integrità dei messaggi scambiati.

Inoltre viene precisata la modalità di riconoscimento dei fruitori che accederanno  al sistema 
attraverso l’interoperabilità applicativa.

Per quanto riguarda l’interfaccia dei servizi esposti si rimanda alla consultazione della specifica 
OpenAPI e alla relativa visualizzazione UI (*Stoplight/Swagger*) consultando il menu *API*.

## Prerequisiti

Il fruitore del servizio è il soggetto che interagisce tramite l’interoperabilità con il sistema e corrisponde all'operatore oppure al soggetto delegato di cui all'art. 18 del Decreto 4 aprile 2023 n. 59.
Il fruitore del servizio deve essere stato preventivamente accreditato all'interno del  RENTRI, affinché possa essere riconosciuto quando si presenterà per via applicativa.

L’accreditamento avviene attraverso la procedura web esposta dal portale RENTRI e viene effettuato da persona fisica avente il titolo per rappresentare l'operatore o il soggetto delegato.

L’interoperabilità applicativa si basa sullo scambio di header nella richiesta http, i quali sono firmati 
digitalmente utilizzando un certificato di tipo X.509 rilasciato da una CA riconosciuta, oppure un certificato di
dominio RENTRI rilasciato da RENTRI stesso, al fine di garantire l’adeguato livello di sicurezza ed integrità della trasmissione dei dati.

Il riconoscimento del fruitore del servizio applicativo nel sistema RENTRI avviene mediante l’identità 
digitale utilizzata per la sottoscrizione dei pacchetti di dati scambiati.

### Certificato

Il certificato utilizzato dal fruitore deve corrispondere ad un certificato rilasciato da una CA qualificata 
in conformità al regolamento eIDAS, oppure un certificato di dominio RENTRI rilasciato da RENTRI stesso.

#### Certificato RENTRI

Il certificato di dominio rilasciato da RENTRI è un certificato di tipo *sigillo*, ossia un certificato
intestato all'operatore. In altre parole il certificato contiene nel *subject* il codice fiscale dell'operatore, ed in caso di  un *ente della pubblica amministrazione* il codice UO o il codice AOO dell'ufficio stesso.

Per approfondire la funzionalità di rilascio del certificato di dominio RENTRI per l'interoperabilità si rimanda alla documentazione
relativa accedendo alla pagina [Modalità di accesso - Accreditamento e certificati](javascript:loadPage('accesso-certificati')).


#### Certificato eIDAS

Il certificato, in conformità al regolamento eIDAS, può essere intestato a vari soggetti:
- all’impresa, ossia l’identificativo indicato nel campo “subject” del certificato deve 
corrispondere al codice fiscale (o alla partita IVA) dell'impresa/ente iscritta al RENTRI;
- al legale rappresentante, o comunque ad altra persona con poteri di rappresentanza dell’impresa;
- a persona incaricata secondo le modalità fornite attraverso apposita procedura web nell’area riservata del portale RENTRI.

Può essere utilizzato il certificato della CNS intestata alla persona (legale rappresentante o suo 
incaricato), oppure un dispositivo HSM nel quale custodire il certificato, oppure un servizio di firma 
remota, purché il certificato sia emesso da una CA riconosciuta da AgID, o riconosciuta da altro ente 
comunitario secondo il regolamento eIDAS.

### Riconoscimento dei fruitori

Per l’utilizzo dei servizi interoperanti, sia in ambiente dimostrativo che in ambiente effettivo, occorre 
che il fruitore del servizio sia riconosciuto dal sistema.

**Questo avviene attraverso l’accreditamento e la configurazione preliminare degli operatori e dei soggetti delegati nel  
RENTRI tramite le funzioni fornite dal portale web.**

> ⚠️ **ATTENZIONE**
> 
> Il solo accesso all’area di produzione (o dimostrativa) non abilita automaticamente l’utilizzo dei servizi.

Per approfondire la funzionalità di accreditamento al RENTRI si rimanda alla documentazione
relativa accedendo alla pagina [Modalità di accesso - Accreditamento e certificati](javascript:loadPage('accesso-certificati')).

---

*Ultimo aggiornamento: 09/04/2024*