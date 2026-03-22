# Piano operativo – integrazione modulo RVFU (demolizioni)

## 1. Obiettivi
- Allineare l’app RescueManager al Registro Veicoli Fuori Uso (MIT/ACI) per inserimento, gestione, demolizione e radiazione dei veicoli.
- Garantire conformità funzionale rispetto alla documentazione MIT (Specifiche WS 1.25, manuale utente v1.6, diagrammi di sequenza).
- Definire un flusso di verifica per ogni nuovo documento MIT condiviso (checklist, impatti, aggiornamento piano).

## 2. Fonti di riferimento
- `SpecificheWS-GestioneDemolitori1.25.md` + allegati HTML/JSON.
- `RVFU json` & `RVFU html` (mapping endpoint ↔ attori ↔ payload ↔ esempi codice).
- `RVFU_Sequence_Diagrams.md` (presa in carico diretta vs conferita).
- `Registro_VFU_Manuale.md` (processi lato CR e vincoli operativi).
- Eventuali documenti successivi MIT (salvarli in `SOLO2/NUOVI_DOCS/<data>` e produsre relativo summary).

## 3. Gap analysis preliminare
1. **Autenticazione / Accesso**
   - MIT richiede Authorization Code Flow con step `/authenticate` (cookie `iPlanetDirectoryPro`). Serve gateway backend dedicato rispetto a Supabase auth.
   - Gestione multi-ambiente (formazione vs esercizio) con configurazioni separate.
2. **Ruoli e permessi**
   - Distinguere: Centro di Raccolta (CR), Concessionario, Agenzia STA, UMC, eventuali profili monitoraggio.
   - Mappare utenti RescueManager su matricole/ruoli MIT, includendo deleghe multi-impresa.
3. **Data model**
   - Aggiungere tabelle/colonne per stati MIT (`stato_vfu`, `stato_fascicolo`), deleghe, notePartiRifiuti, distinta componenti, trasferimenti, radiazione, flag `impresa_in_carico`, `preservato`, `ceduto`.
   - Conservazione documenti: storage + metadati (tipo, versione, firma, data scadenza) con retention 10 anni.
4. **UI/UX**
   - Rifattorizzare modulo attuale in wizard: Inserimento → Documenti → Firma → Inoltro → Chiusura.
   - Liste separate per “Da prendere in carico”, “Rottamazione”, “Richiesta integrazione”, “Radiati”, “Ceduti”, “Preservati”, “Storico”.
5. **Workflow documentale**
   - Generazione automatica CDR/ricevute, invio a dispositivo firma, gestione fallback cartaceo.
   - Audit completo per upload/sostituzioni, annullamento cartella firma, log download.
6. **Test & monitoraggio**
   - Preparare dataset di prova replicando casi MIT; integrare endpoint `/monitoraggio` per insight.

## 4. Piano in fasi
### Fase A · Preparazione tecnica
- Implementare gateway RVFU Service (Node/Express o edge Supabase) per autenticazione, token refresh, logging richieste/responses.
- Configurare file `.env` con baseUrl MIT, clientId/clientSecret, redirect, cookie policy.
- Creare template `SUMMARY_TEMPLATE.md` per nuovi documenti MIT (riassunto rapido).

### Fase B · Data layer & storage
- Progettare schema Supabase con tabelle: `rvfu_deleghe`, `rvfu_veicoli`, `rvfu_fascicoli`, `rvfu_documenti`, `rvfu_stati`, `rvfu_distinte`, `rvfu_note`, `rvfu_eventi`.
- Scrivere migrazioni per nuove colonne nei moduli esistenti (clienti, trasporti collegati, allegati) e per referenze verso `org_id`.
- Definire bucket storage (Supabase o S3) con RLS e politiche di retention; predisporre struttura `/rvfu/<org>/<idVFU>/<documento>`.

### Fase C · Integrazione API
- Implementare client tipizzati per attore (`crVfuService`, `concessionarioVfuService`, `agenziaVfuService`, `umcVfuService`).
- Coprire operazioni core: `insertVFU`, `updateVFU`, `annulla`, `annullaInoltroSTA`, `trasferisci`, `demolisci`, `preserva`, `consulta*`, `export`, `stampa`, `gestisciDocumenti`, `inoltraSTA`, `chiudiFascicolo`, `prendiInCarico`.
- Gestire errori standard (`VfuRestResponse`, Basic Error Controller) con mapping verso notifiche UI.
- Integrare utility (tipologiche stati/causali, lookup comuni/province/stati esteri, codici ISTAT, notePartiRifiuti).

### Fase D · UI/UX & flussi
- Creare wizard multi-step per inserimento VFU (no PRA & PRA) con convalide su campi obbligatori e delega.
- Ridisegnare liste operative con filtri avanzati, badge stato, azioni rapide (presa in carico, trasferisci, annulla, genera documenti, inoltra STA).
- Gestione fascicolo come pannello modulare: elenco documenti, upload/sostituzione, firma remota, log azioni.
- Schermata deleghe con grafo relazioni (CR ↔ concessionari) e controlli di sovrapposizione.
- Dashboard e monitoraggio con card KPI (conteggi per stato, errori integrazione, attività da completare).

### Fase E · Documenti & firma
- Definire template PDF (CDR, ricevuta presa in carico, postilla CDR) in linea con layout MIT.
- Implementare pipeline firma: invio a tablet (API `inviaAlTablet`), polling `consulta/documentoVFU`, gestione errori/time-out, fallback manuale.
- Gestire versione firmata vs bozza, con storicizzazione e possibilità di annullare/clonare cartella firma.

### Fase F · QA, test e verifica
- Creare suite Postman/Insomnia con casi MIT (inserimento, conferimento, presa in carico, radiazione, demolizione, preservazione, trasferimento).
- E2E automatizzati (Cypress/Playwright) seguendo diagrammi di sequenza 1 e 2.
- Checklist audit: documenti obbligatori presenti, stati coerenti, log azioni, export PDF/XLSX corretto.
- Pianificare UAT con demolitori/STA: raccolta feedback su usabilità e tempi operativi.

### Fase G · Go-live & rollout
- Preparare manuale interno e formazione (basati su `_summaries`).
- Strategie migrazione dati se esistono registrazioni pregresse (mapping manuale o script import).
- Setup monitoraggio post go-live: alert su errori API, dashboard monitoraggio, log compliance.

## 5. Verifica nuovi documenti MIT
1. Salvataggio file in `SOLO2/NUOVI_DOCS/<data>`.
2. Creare `SUMMARY.md` con: versione, sezione aggiornata, impatto (API/UI/data/test), priorità.
3. Rivedere questo piano: aggiungere attività, aggiornare backlog/sprint.
4. Allineare team (sync breve) per decidere eventuali hotfix.

## 6. Deliverable attesi
- Client REST tipizzati + copertura test unitari.
- Migrazioni DB approvate + script seed tipologiche.
- Nuovo modulo UI (wizard, liste, fascicolo, deleghe) con design system attuale.
- Workflow documentale completo (generazione + firma + conservazione) con audit.
- Documentazione interna aggiornata (`README_RVFU.md`, runbook errori, guida operatore).
- Suite test (Postman + E2E), checklist compliance, template QA.

## 7. Prossimi step immediati
- Richiedere accesso ambiente formazione MIT / credenziali test.
- Validare schema DB proposto con stakeholder/dba.
- Definire roadmap sprint (es. Fase A-B 2 settimane, Fase C-D 3 settimane, Fase E-F 2 settimane).
- Preparare mockup UI (Figma) basati su manuale ed esempi MIT per validazione con utente finale.

