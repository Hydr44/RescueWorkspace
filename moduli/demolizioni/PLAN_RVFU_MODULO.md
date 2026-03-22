## Piano Implementazione Modulo Demolizioni / RVFU

Questo piano serve a **non sbagliare l’implementazione** del modulo demolizioni/RVFU, usando solo ciò che è documentato nei manuali ufficiali.

### 1. Obiettivi del modulo

- Gestire le **pratiche demolizione** in RescueManager.
- Integrare i **Web Service RVFU demolitori**:
  - creazione/aggiornamento pratiche,
  - consultazione stati ed esiti,
  - coerenza con i flussi descritti in `RVFU.html` e nelle specifiche WS.
- Preparare la base per future integrazioni:
  - Documento Unico / STA (`SpecificheWS-DocumentoUnico-STAPlus`),
  - Nuovo sistema pagamenti (`SpecificheWS-NuovoSistemaPagamenti`).

### 2. Fonti ufficiali (da NON perdere di vista)

- `Leggimi`: descrive i file e contiene **credenziali di test** (VPN, SH, Agenzia) → uso solo in ambiente di sviluppo.
- `rvfu/RVFU.html`: riferimento funzionale (come ragiona l’app ufficiale RVFU).
- `rvfu/RVFU.json`: formato dati ultima versione.
- `specs/SpecificheWS-GestioneDemolitori*.docx`: specifiche tecniche dei WS demolitori (MANDATORIE per i dettagli di request/response).
- `specs/SpecificheWS-DocumentoUnico-STAPlus-*.doc`: specifiche Documento Unico.
- `specs/SpecificheWS-NuovoSistemaPagamenti-*.doc` (+ eventuale PDF): specifiche pagamenti.

> NOTA: eventuali conversioni in `.pdf`, `.html` o `.md` vanno salvate in `manuali/` per facilitarne la lettura.

### 3. Architettura proposta

- **Backend (Next.js / shared-api)**:
  - Creare un set di API interne `api/demolizioni/rvfu/*` che incapsulano:
    - autenticazione verso RVFU (header, matricola, codici sicurezza),
    - chiamate SOAP/HTTP ai WS descritti in `SpecificheWS-GestioneDemolitori`,
    - mapping tra modelli interni e formati RVFU (`RVFU.json`).
  - Gestire logging e errori in modo simile a RENTRI/FIR (pattern già usati).

- **Database (Supabase)**:
  - Tabelle dedicate, ad esempio:
    - `demolizioni_pratiche`
    - `demolizioni_veicoli`
    - `demolizioni_rvfu_log` (log chiamate WS, request/response sanitizzate).
  - Campi chiave:
    - identificativo interno pratica,
    - identificativo RVFU,
    - stato RVFU, esiti, timestamp invii.

- **Frontend (desktop-app)**:
  - Nuove pagine tipo:
    - Lista pratiche demolizione (con filtri e stato RVFU),
    - Dettaglio pratica (dati veicolo + timeline invii RVFU),
    - Schermata di invio/aggiornamento verso RVFU.

### 4. Fasi di lavoro

#### Fase 1 – Analisi dettagliata specifiche

1. Leggere e riassumere in `notes/` (da creare) i capitoli chiave di:
   - `SpecificheWS-GestioneDemolitori*.docx`
   - `RVFU.html` e `RVFU.json`
2. Estrarre:
   - elenco dei **Web Service** demolitori (nome, scopo),
   - struttura delle **request/response** principali,
   - codici di **errore** e flow standard.

Output: file `notes/WS_GestioneDemolitori.md` con tabella degli endpoint.

#### Fase 2 – Design modello dati e API interne

1. Definire schema tabelle Supabase (`demolizioni_*`), salvando lo schema in `supabase/migrations_demolizioni.sql`.
2. Progettare le API interne:
   - `POST /api/demolizioni/rvfu/pratiche` (crea/aggiorna pratica verso RVFU),
   - `GET /api/demolizioni/rvfu/pratiche/:id` (stato/esiti),
   - eventuali API batch o di sincronizzazione.
3. Documentare le API in `PLAN_RVFU_API.md` (da creare).

#### Fase 3 – Implementazione tecnica minima (MVP)

Target: far funzionare **un flusso completo minimo** in ambiente test, basato sui manuali:

- Creazione pratica demolizione in RescueManager.
- Invio verso RVFU tramite WS (usando credenziali di test dal `Leggimi`).
- Lettura dello stato/esito da RVFU.
- Visualizzazione in frontend (lista + dettaglio pratica).

#### Fase 4 – Beta su azienda pilota

- Collegare il modulo all’azienda di tuo padre.
- Usare il modulo demolizioni/RVFU in test operativo:
  - su alcune pratiche reali o di prova.
- Raccogliere problemi/flussi mancanti e raffinare.

### 5. Convenzioni per questa cartella

- **NON** committare in chiaro nei repo pubblici credenziali reali (quelle in `Leggimi` vanno trattate come test/confidenziali).
- Tutte le note tecniche derivate dai manuali vanno in:
  - `notes/*.md` (da creare),
  - mantenendo un riferimento chiaro alla sezione/paragrafo originale.
- Quando un WS è implementato:
  - aggiornare `PLAN_RVFU_API.md`,
  - segnare lo stato (es. `planned`, `implemented`, `tested`).





