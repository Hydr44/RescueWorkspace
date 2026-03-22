# RVFU — Sintesi diagrammi di sequenza

## Flusso 1 · Presa in carico veicolo ritirato direttamente dal CR
- **Verifica preliminare**: `GET /rvfu/sh/cr/veicolo` per controllare targa/telaio prima della registrazione.
- **Registrazione VFU**: `POST /rvfu/sh/cr/VFU` con payload completo del veicolo ritirato.
- **Documentazione digitale**:
  - Generazione automatica Certificato di Rottamazione digitale (`POST .../genera/certificatoRottamazione`).
  - Generazione Ricevuta di presa in carico (`POST .../genera/ricevutaPresaInCarico`).
- **Alternativa cartacea**: se non disponibile il canale digitale, allegare certificato e ricevuta firmati manualmente tramite `POST .../allega/documentoVFU` (più volte).
- **Gestione fascicolo**: recupero/aggiornamento documenti (`GET .../documentoVFU`, `POST .../allega/documentoVFU`).
- **Firma remota**: invio su tablet/FDR (`POST .../inviaAlTablet`), polling risultato tramite `GET .../consulta/documentoVFU`.
- **Verifica & inoltro**:
  - Validazione interna (`PUT .../verifica/VFU`).
  - Ricerca agenzia STA (`GET .../agenziaSTA`) e inoltro pratiche (`POST .../inoltraSTA/VFU/{id}`).
- **Chiusura fascicolo**: `POST .../chiudi/fascicolo` dopo completamento e firma documenti.
- **Nota**: la creazione fascicolo è implicita dopo il CDR; mantenere sincronizzazione stato fascicolo ↔ stato VFU.

## Flusso 2 · Presa in carico veicolo conferito da Concessionario
- Partenza dall’elenco “da prendere in carico”: `GET /rvfu/sh/cr/consultaPresaInCarico/VFU`.
- Dettaglio del veicolo conferito (`GET /rvfu/sh/cr/VFU/{id}`) e verifica documentazione trasferita.
- Accettazione effettiva (`POST /rvfu/sh/cr/prendiInCarico/VFU/{id}`) → il veicolo passa allo stato “PRESO IN CARICO”.
- Da qui in poi si seguono gli stessi step del flusso 1 (caricamento documenti, firma, inoltro STA, chiusura fascicolo).

## Riepilogo operativo
- I diagrammi confermano l’ordine minimo delle chiamate per completare un iter standard CR:
  1. **Verifica/Registrazione** veicolo.
  2. **Generazione o allegato** documentazione obbligatoria.
  3. **Gestione firma digitale** (tablet/FDR) e recupero file firmati.
  4. **Verifica interna** e **inoltro STA**.
  5. **Chiusura fascicolo**.
- Vengono messi in evidenza gli endpoint più critici per la nostra UI: lista “presa in carico”, azione “prendi in carico”, invio in firma, inoltro e chiusura.
- I diagrammi non coprono ancora fasi successive (radiazione completata, demolizione, preservazione) ma indicano dove agganciarsi (`verifica`, `inoltraSTA`). Al completamento del set documentale dovremo estendere diagrammi per:
  - **Demolisci/PRESERVA** (`PUT /demolitori-aci-ws/rest/cr/demolisci/VFU`, `PUT .../preserva/VFU`).
  - **Conferma radiazione** (`PUT .../confermaRadiazioneVFU`).
  - **Trasferimento** verso altro CR o ritorno concessionario.

## Implicazioni per sviluppo/test
- Definire **wizard/pipeline UI** basata sui blocchi sequenziali evidenziati, con controlli che impediscano di saltare passaggi obbligatori.
- Implementare **log di audit** (timestamp, utente) in corrispondenza di ciascun step per tracciare stato fascicolo.
- Preparare **test end-to-end** che riproducano i due diagrammi: mockare risposte API e verificare stati VFU generati.
- Integrare meccanismo di **retry** per invio al tablet e per il recupero dei documenti firmati (come da frecce API ↔ Tablet). 

