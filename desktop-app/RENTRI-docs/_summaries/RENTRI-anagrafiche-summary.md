# RENTRI – Documentazione API Anagrafiche (v1.0)

## Contesto generale
- **Fonte**: `https://api.rentri.gov.it/docs/api/anagrafiche/v/v1.0` e pagine collegate.
- **Obiettivo**: integrare il Registro Elettronico Nazionale per la Tracciabilità dei Rifiuti (RENTRI).
- **Servizi principali**: anagrafiche operatori/impianti, gestione registri di carico-scarico, consultazione soggetti delegati, firma digitale (ca-rentri), codifiche, vidimazione formulari, trasmissione registri e FIR.
- **Ambientazioni**: modalità STUB (solo test di connessione), API produzione (progressiva apertura), demo per FIR digitali/app mobile.

## Struttura documentazione ricevuta
- **Home**: panoramica interoperabilità, elenco servizi disponibili, calendarizzazione attivazione API.
- **Anagrafiche – OpenAPI**:
  - `/status` – health check (in modalità stub risponde 422).
  - `GET /operatore` – elenco operatori collegati al certificato.
  - `GET /operatore/{identificativo}/controllo-iscrizione` – verifica iscrizione RENTRI.
  - `GET /operatore/{identificativo}/controllo-autorizzazione-albo` – verifica iscrizione Albo.
  - `GET /operatore/{num_iscr}/siti` – unità locali prendendo dal numero di iscrizione.
  - `GET /operatore/{num_iscr}/siti/{num_iscr_sito}` – dettaglio sito.
  - `GET /operatore/{num_iscr}/siti/{num_iscr_sito}/autorizzazioni` – autorizzazioni impianto.
  - `GET /operatore/{num_iscr}/siti/{num_iscr_sito}/registri` – registri associati.
  - `POST /operatore/registri` – creazione registro (stub → 422).
  - `GET /operatore/registri/{identificativo}` – lettura registro.
  - `PUT /operatore/registri/{identificativo}` – aggiornamento registro.
  - `DELETE /operatore/registri/{identificativo}` – cancellazione.
  - `GET /operatore/registri/{identificativo}/xml` – download registro in XML.
- **Registri generici** (`/registri/...`): stessi pattern ma senza prefisso operatore (scope amministratore/RENTRI).
- **Soggetti delegati**: simmetrico alle rotte operatore ma riferito a delegati.

## Metadati e requisiti comuni
- **Autenticazione**: tramite certificati (dominio RENTRI) + CA RENTRI (API specifiche per gestione device/CRL).
- **Versione API**: `v1.0`, server indicato come porta applicativa (URL finale da concordare con CA).
- **Codifiche**: endpoint dedicato per lookup di tabelle (codici CER, EER, comuni, ecc.).
- **Formato dati**: JSON per la maggior parte delle rotte, download XML per registri.
- **Erroristica**:
  - Modalità STUB → 422 per POST/PUT/DELETE.
  - GET `/status` → 422.
  - Autenticazione fallita → 401.

## Punti aperti / Documenti mancanti
- Specifiche complete “dati-registri”, “formulari”, “vidimazione formulari”, “ca-rentri” non ancora incluse.
- Manuale operativo, tracciati XSD, guida all’ottenimento certificati di dominio RENTRI.
- Flow di onboarding (iscrizione operatori, deleghe) e mapping campi vs DB RescueManager.

## Prossimi passi consigliati
1. Reperire documentazione mancante su altri servizi (registri, FIR, CA).
2. Confermare dettaglio autenticazione (mutual TLS? JWT?) e ambienti (demo, produzione, stub).
3. Costruire matrice ruoli ↔ endpoint (operatore, delegato, amministratore).
4. Definire data model esteso (operatori, impianti, autorizzazioni, registri).
5. Stendere piano di integrazione completo (vedi file dedicato da redigere).

