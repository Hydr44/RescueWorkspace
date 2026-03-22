## Accreditamento al RENTRI

La funzionalità di accreditamento è necessaria per l’utilizzo dei servizi interoperanti (sia in ambiente demo che in ambiente di produzione).
Per accedere a tale funzionalità, dopo aver effettuato l'accesso all'area riservata, occorre cliccare sull'operazione *"Accreditamento operatori"* nel caso di operatori oppure "Accreditamento" nel caso di soggetti delegati.

![Funzione accreditamento](/docs/assets/accesso-certificato-dominio-1.png)


Per l'accreditamento dell'operatore o del soggetto delegato il primo accesso all’area riservata deve essere effettuato da persona avente titolo per rappresentare l’operatore o il soggetto delegato («rappresentante»).
Nel caso l'operatore sia un'impresa, i poteri del rappresentante vengono verificati automaticamente consultando il Registro Imprese tenuto dalle Camere di Commercio.
Nel caso di ente o di altra organizzazione non presente nel Registro Imprese, il RENTRI invia una comunicazione tramite PEC con la quale l’ENTE o l'organizzazione può confermare il titolo di rappresentanza della persona che ha fatto accesso al RENTRI. L’indirizzo PEC nel caso di ente sarà desunto da Indice dei domicili digitali della Pubblica Amministrazione (Indice PA).
Nel caso particolare in cui l'operatore fosse un professionista, dove il codice fiscale del rappresentante e dell'operatore coincidono, l'accreditamento avviene in modo automatico senza conferma tramite PEC.


![Funzione accreditamento](/docs/assets/accesso-certificato-dominio-2.png)

### Incaricati

Il rappresentante, ancora prima di iscrivere l'operatore o il soggetto delegato, potrà indicare ulteriori persone fisiche, denominate incaricati, che potranno operare in RENTRI per conto del rappresentante.

## Certificato riconosciuto AgID

A completamento delle operazioni, il  rappresentante e gli utenti da questo incaricati saranno riconosciuti come fruitori dal sistema.
Questi utenti, utilizzando un certificato a loro intestato (emesso da una CA riconosciuta da AgID ed in conformità al regolamento eIDAS) potranno accedere alle API di interoperabilità e interfacciarsi, tramite porta applicativa, per conto dell'operatore.

Il certificato, in conformità al regolamento eIDAS, può essere quindi intestato :
- all'identificativo del rappresentante;
- all'identificativo dell'incaricato.

E' sempre  possibile utilizzare un certificato intestato con l'identificativo dell’operatore o del soggetto delegato (*sigillo*); in questo caso  l’identificativo indicato nel campo “subject” del certificato deve corrispondere al codice fiscale (o alla partita IVA) dell'operatore o del soggetto delegato iscritto al RENTRI.

## Certificato di dominio RENTRI

Un'altra possibilità per usufruire dei servizi interoperanti è tramite l'utilizzo del certificato di dominio RENTRI, ossia un certificato 
con l'identificativo dell’operatore o del soggetto delegato (*sigillo*) emesso dal sistema RENTRI. Tale certificato, per sua natura, permette di apporre firme che saranno valide esclusivamente all'intero del RENTRI, e non risulteranno riconosciute valide al di fuori di questo contesto.

Per ottenere questo certificato occorre utilizzare l'operazione  *"Interoperabilità"* dall'area riservata RENTRI.

Dopo aver selezionato l'operatore accreditato e compilato i campi richiesti l'utente può scaricare il certificato di dominio RENTRI associato all'operatore selezionato. 

Il certificato verrà scaricato nella crittografia PKCS #12, ossia un singolo file contenente sia la chiave privata che il suo 
certificato X.509. Alla prima emissione viene generata anche la relativa *password* di protezione del file *.p12*, che si consiglia di conservare opportunatamente,
per evitare l'impossibilità di riutilizzo del certificato.

Il file *.p12* contenendo anche la chiave privata può essere utilizzato direttamente nel processo di firma degli header *JWT* che devono essere 
trasmessi nelle request API.

![Funzione Emissione certificati digitali RENTRI](/docs/assets/accesso-certificato-dominio-3.png)

---

*Ultimo aggiornamento: 03/07/2024*