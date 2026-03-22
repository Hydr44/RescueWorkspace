# RVFU JSON — Sintesi operativa (v1.0)

## Contesto generale
- API REST pubblicate dal MIT/ACI (`/demolitori-aci-ws/rest/...`) per la gestione del Registro Veicoli Fuori Uso.
- Server indicato: `http://gestione-veicolo-fuoriuso-tst.serviziaci.it:80` (ambiente test/formazione).
- Ogni file della cartella rappresenta un **controller** destinato a un attore specifico (Concessionario, Centro di Raccolta/CR, Agenzia STA, UMC) o a un dominio trasversale (delega, fascicolo, impresa, monitoraggio, utility, errori).
- Risposte standardizzate: esito HTTP 200 con wrapper `VfuRestResponse<...>` + codici 401/403/404; in diversi casi disponibili export PDF/XLSX.

## Attori e responsabilità principali

### Concessionario
- **VFU** (`19_VFU_Concessionario.md`)
  - `POST /concessionario/VFU`: inserimento VFU ritirato dal concessionario (`VFUCreateAsConcessionario`).
  - `PUT /concessionario/conferisci/VFU/{id}`: conferimento al CR delegante (`VFUConferisci`).
  - `PUT /concessionario/annulla/VFU/{id}`: annullamento prima del conferimento (`VFUElimina`).
  - Liste, export XLSX e stampa PDF filtrate per campi data, stato VFU, targa/telaio, notePartiRifiuti ecc.
- **Veicoli** (`16_Veicolo_Concessionario.md`)
  - Consultazione per targa/telaio, creazione/precompilazione, upload documenti associati.
  - Endpoint dedicati per emissione certificato di rottamazione digitale e ricevute.
- **Delega** (`03_Delega_Concessionario.md`)
  - Ricerca deleghe attive verso CR (`/consulta/delega`), dettaglio e stampa PDF.
- **Fascicolo** (`07_Fascicolo_Concessionario.md`)
  - Accesso a fascicoli collegati ai veicoli conferiti; download documento singolo (`/documento/{id}`) e export.
- **Impresa Gestione VFU** (`10_Impresa_gestione_VFU_Concessionario.md`)
  - Elenco e dettaglio imprese autorizzate, verifica deleghe attive.

### Centro di Raccolta (CR)
- **VFU** (`20_VFU_CR.md`)
  - Inserimento/aggiornamento VFU (`VFUCreateAsCR`, `VFUUpdate`).
  - Annullamento e annullamento inoltro a STA, cessione, radiazione (`confermaRadiazioneVFU`), demolisci, trasferimenti.
  - Consultazioni per processo: `consultaPresaInCarico`, `consultaRottamazione`, `consultaRadiati`, `consultaRichiestaIntegrazione`, `consultaPreservati` ecc. con paginazione.
  - Endpoint export/stampa analoghi a quelli del concessionario + download massivo documenti.
- **Veicoli** (`17_Veicolo_CR.md`)
  - Ricerca per parametri PRA, stato fascicolo, tipi documento; upload/download documenti; generazione ricevute.
- **Fascicolo** (`08_Fascicolo_CR.md`)
  - Visualizzazione fascicolo completo, gestione documenti (upload/download, sostituzioni, cancellazione), consultazione storico azioni.
- **Delega** (`04_Delega_CR.md`)
  - CRUD deleghe verso concessionari: creazione (`POST /delega`), modifica periodo, revoca, consultazioni, export PDF/XLSX.
- **Impresa Gestione VFU** (`11_Impresa_gestione_VFU_CR.md`)
  - Ricerca sedi operative, abilitazioni PRA/no PRA, trasferimenti; endpoint per aggiornare dati impresa.
- **Monitoraggio** (`14_monitoraggio-controller.md`)
  - Statistiche su code, stato processi, esito caricamenti.

### Agenzia STA
- **VFU** (`18_VFU_Agenzia.md`)
  - Accesso VFU conferiti dal CR per gestione radiazione: consultazione, modifica stato (inoltro STA, validazione, richiesta integrazione), download allegati.
  - Esporta risultati e stampa elenchi.
- **Fascicolo** (`06_Fascicolo_Agenzia.md`)
  - Consultazione fascicoli, documenti obbligatori, caricamento integrazioni.
- **Veicolo**: non presente sezione dedicata (gestito tramite fascicoli/VFU).
- **Delega**: non gestita direttamente lato STA.

### UMC (MCTC)
- **VFU** (`21_VFU_UMC.md`)
  - Consultazione VFU PRA e no-PRA per verifica, aggiornamento note, gestione richieste integrazione.
- **Fascicolo** (`09_Fascicolo_UMC.md`)
  - Lettura fascicolo e documenti, limitatamente a veicoli senza PRA o per verifiche.
- **Delega** (`05_Delega_UMC.md`)
  - Ricerca deleghe attive ai fini di controllo.
- **Impresa** (`12_Impresa_gestione_VFU_UMC.md`)
  - Accesso master data imprese, sedi, matricole.

## Domini trasversali
- **Utility** (`15_Utility.md`)
  - Tipologiche generali (stati VFU, tipi documento, tipi veicolo, stati fascicolo, causali trasferimento, motivi annullo, elenco notePartiRifiuti ecc.).
  - Servizi di validazione targa/telaio, ricerca comuni/province/stati esteri, verifica codici ISTAT, generazione numerazioni.
- **basic-error-controller** (`02_basic-error-controller.md`)
  - Specifica payload errori standard: `timestamp`, `status`, `error`, `message`, `path`.
- **internal-radiazione** (`13_internal-radiazione.md`)
  - Endpoint interni per gestione radiazione (non esposti alle Software House ma importanti per flussi asincroni).

## Campi e payload ricorrenti
- `VFUCreateAs...`, `VFUUpdate`, `VFUConferisci`, `VFUElimina`, `VFUCedi`, `VFUTrasferisci`, `VFURadiazione`, `VFUConsulta`.
- Wrapper risposta: `VfuRestResponseOfVFUBean`, `...OfPageOfVFUBean`, `...OfPdfBean`, `...OfXlsxBean`.
- Nuovi flag evidenziati dalla specifica 1.25: `notePartiRifiuti`, `IMPRESA_IN_CARICO`, stato aggiuntivo `PRESERVATO`, supporto trasferimenti cross-CR.
- Filtri omnipresenti: paginazione (`pageNumber`, `pageSize`, `paged`, `unpaged`), sorting (`sort.sorted`, `sort.unsorted`), range date (conferimento, inserimento, presa in carico, radiazione, ritiro).

## Implicazioni per il modulo RescueManager
- **Allineamento ruoli**: l’app dovrà distinguere comportamenti e menu in base all’attore collegato (Concessionario vs CR vs Agenzia/UMC) mappando credenziali IAM sul profilo Supabase.
- **Flussi di stato**: implementare transizioni C→T→P→R→N→S→D/Z con possibilità di annullo, richiesta integrazione, trasferimento, preservazione.
- **Documentazione**: gestire upload/download firmati, sostituzioni, export PDF/XLSX, e collegamento fascicolo ↔ veicolo ↔ deleghe.
- **Ricerca avanzata**: replicare filtri MIT (date multiple, targa, telaio, PRA, notePartiRifiuti, causali) e prevedere caching per tipologiche.
- **Error handling**: mappare `VfuRestResponse` e `basic-error-controller` nelle nostre classi di servizio per surfacing messaggi MIT all’utente.

## Prossimi passi
- Mettere in relazione questa sintesi con la documentazione HTML, le sequenze e il manuale per definire:
  - mapping campi → UI (inserimento, check-list documenti, step radiazione/demolizione);
  - orchestrazione chiamate (ordine, prerequisiti, possibili errori);
  - struttura DB/app (nuove colonne e tabelle) coerente con payload MIT.
- Integrare il tutto nel **Piano di verifica/inserimento RVFU** che verrà aggiornato dopo l’analisi delle altre sottocartelle.

