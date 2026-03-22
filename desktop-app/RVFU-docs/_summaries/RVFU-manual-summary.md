# Registro VFU – Sintesi Manuale Utente v1.6 (Ottobre 2025)

## Accesso & struttura applicazione
- Accesso via Portale del Trasporto (`https://www.ilportaledeltrasporto.it`) con credenziali MIT → voce **Gestione Demolitori**.
- Home page con menu principali: **Gestione Deleghe**, **Gestione VFU** (no PRA), **Gestione VFU PRA**, **Consulta VFU PRA**, più voci per consultazione storico, stampa, export.
- Ogni sezione espone funzioni di ricerca con filtri avanzati (periodi, stato, codice fiscale, targa/telaio) e pulsanti `Scarica` (XLSX) / `Stampa` (PDF).

## Gestione Deleghe
- CR crea deleghe verso concessionari/case costruttrici: ricerca impresa per codice fiscale → verifica stato impresa e assenza deleghe attive.
- Campi obbligatori: data decorrenza, data scadenza, note opzionali. Messaggi di errore: “Impresa non attiva”, “Delega già presente”.
- Funzioni successive: lista deleghe con filtri, dettaglio, modifica periodo, revoca, annullo, export/stampa.

## Gestione VFU senza obbligo PRA
1. **Inserimento**
   - Registrazione dati veicolo ritirato (riconoscimento automatico o inserimento manuale per veicoli non radiabili/particolari).
   - Gestione distinta componenti (nuova funzionalità 2024) e “note aggiuntive parti mancanti”.
2. **Certificati & ricevute**
   - Generazione e stampa CDR e ricevuta di presa in carico; alternative cartacee con caricamento PDF firmati e gestione firma su tablet.
3. **Presa in carico**
   - Lista veicoli (filtri per stato, date, delega) → dettaglio, azione `Presa in carico`, trasferimento ad altro CR prima della presa in carico, visualizzazione CDR/ricevuta.
4. **Rottamazione**
   - Dettaglio veicolo da rottamare, modifica dati registro, annulla inserimento, valida veicolo.
   - Gestione fascicolo documentale: inserisci/sostituisci/elimina documento, invio al tablet, recupero firmato, chiusura fascicolo.
5. **Radiazione & post-rottamazione**
   - Radiazione per veicoli no PRA con procedimento verso UMC; sezione dedicata a veicoli radiati/demoliti con possibilità di modifica dati.
6. **Stato CEDUTO/PRESERVATO**
   - Nuove sezioni per VFU ceduti (vers. 1.6) e preservati; trasferimento consentito anche in stato RADIATO.

## Gestione VFU con obbligo PRA
- Processi speculari con differenze chiave:
  - Inserimento veicolo da radiare o già radiato (distinzione moduli).
  - Possibilità di proseguire fino all’inoltro verso STA e radiazione tramite Documento Unico.
  - Funzione `Associa VFU a STA`, gestione richieste integrazione, riapertura fascicolo.
  - Tracciamento radiazione (ricevuta PRA), gestione ceduti, consulta storico PRA.

## Documentazione & firma digitale
- Fascicolo generato in automatico dopo il CDR: obbligo di caricamento documenti tipologia (documento identità, procura, ricevuta, ecc.).
- Integrazione con dispositivo FDR/Tablet: `Invia documenti al tablet`, `Recupera documenti firmati`; possibilità di annullare e clonare cartelle di firma.
- Linee guida su distruzione documenti cartacei dopo periodo normativo (citata nella tabella modifiche; dettaglio nei paragrafi 2.3.4.1 / 2.4.3).

## Trasferimenti & stati
- Stati gestiti dal manuale: Inserito, Preso in carico, Trasferito, Da radiare, Inviato a STA, Radiato, Demolito, Ceduto, Preservato, Annullato.
- Trasferimento VFU: prima o dopo presa in carico; da 2025 possibile anche tra aziende diverse nello stato RADIATO.
- Annullamento inoltro STA e riapertura fascicolo disponibili dal menu PRA.

## Consultazione & storico
- Sezioni dedicate a:
  - `Visualizza VFU` / `Visualizza VFU PRA` con storico passaggi di stato.
  - Storico VFU e storico fascicolo con log azioni (utile per auditing interno).
  - Reportistica tramite export XLSX/PDF per elenchi deleghe, veicoli, fascicoli.

## Indicazioni operative per RescueManager
- UI da modellare su percorsi descritti: wizard “Inserimento → Documenti → Firma → Inoltro → Chiusura”; separare flussi no PRA / PRA.
- Necessità di replicare controlli front-end: validazione dati impresa, presenza deleghe, stati documenti obbligatori prima di chiudere fascicolo o inoltrare a STA.
- Prevedere gestione distinta componenti, note parti mancanti, nuove causalità (ceduto/preservato) e trasferimenti multi-CR.
- Gestire ruoli e permessi in base al menu originale (CR vs Concessionario vs Agenzia/UMC) per evitare azioni non consentite.
- Implementare report/export coerenti (PDF/XLSX) e tracciamento storico per garantire trasparenza in audit e ispezioni.

