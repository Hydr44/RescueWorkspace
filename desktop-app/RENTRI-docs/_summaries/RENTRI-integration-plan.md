# Piano di integrazione RENTRI

## 1. Obiettivi
- Collegare RescueManager al Registro Elettronico Nazionale per la Tracciabilità dei Rifiuti (RENTRI).
- Automatizzare gestione anagrafiche operatori/siti/registri, invio registrazioni carico-scarico e FIR, vidimazione digitale.
- Garantire conformità normativa (D.M. 4 aprile 2023 n. 59, decreti attuativi, linee guida MASE/ISPRA).

## 2. Documentazione da acquisire
- Manuali operativi RENTRI (modalità operative, casi d’uso, esempi flussi).
- Specifiche complete API (oltre alle anagrafiche: dati-registri, formulari, vidimazione, ca-rentri, codifiche, status).
- Schema XSD, tracciati XML/JSON di input/output con esempi reali.
- Procedure per ottenimento certificati di dominio RENTRI, firma remota, credenziali porta applicativa.
- Informazioni ambienti (STUB, DEMO, produzione) con endpoint e limiti.

## 3. Analisi preliminare (da completare)
- Attori: Operatore, Soggetto delegato, CA RENTRI, Autorità (ISPRA/MASE).
- Oggetti chiave: iscrizione, unità locali, autorizzazioni, registri, registrazioni, FIR, codifiche, firma digitale.
- Processi: creazione registri, trasmissione registrazioni, scarico XML, gestione deleghe, vidimazione FIR, firma remota.
- Confronto con moduli esistenti (RVFU, Trasporti) per capire riuso vs nuove entità.

## 4. Architettura e sicurezza
- Autenticazione: previsto mutual TLS + certificati di dominio; verificare eventuali token/JWT aggiuntivi.
- Gestione certificati: storage sicuro, rinnovo, revoca, download CRL, pairing device (API ca-rentri).
- Multi-tenancy: mappare `org_id` ↔ operatori RENTRI, gestione deleghe e autorizzazioni per utente.
- Tracciabilità: logging/audit per ogni chiamata RENTRI (obbligo normativo).

## 5. Disegno dati
- Tabelle aggiuntive: operatori RENTRI, siti, autorizzazioni, registri (metadata e versioni), registrazioni carico/scarico, FIR, codifiche cache.
- Relazioni con anagrafiche interne (clienti, fornitori, mezzi, trasporti) e moduli RVFU.
- Conservazione: definire policy retention, cronologia modifiche, sigilli su file XML/FIR.

## 6. Roadmap sviluppo (proposta)
1. **Fase 0 – Setup tecnico**: ottenere certificati test, configurare ambiente STUB/DEMO, POC mutual TLS.
2. **Fase 1 – Anagrafiche**: import operatori/siti/autorizzazioni/registri, UI consultazione, sincronizzazione periodica, deleghe.
3. **Fase 2 – Registri di carico-scarico**: mapping dati interni→RENTRI, workflow invio, polling stato, download XML, gestione errori.
4. **Fase 3 – Formulari (FIR)**: trasmissione FIR, tracking, esiti, integrazione con trasporti e modulistica interna.
5. **Fase 4 – Vidimazione e firma remota**: pipeline di firma con CA RENTRI, gestione device/OTP, overlay UX desktop.
6. **Fase 5 – Codifiche & report**: cache lookup, allineamento codici (CER/EER/comuni), dashboard status integrazione.
7. **Fase 6 – Compliance & collaudo**: test regolamentari, certificazione ufficiale, manualistica utenti.

## 7. Azioni immediate
- Completare raccolta documentazione mancanti e validare con stakeholder.
- Analizzare flussi autenticazione (ca-rentri) e definire proof-of-concept.
- Preparare mapping dati preliminare e requisiti UI per Fase 1.
- Allineare team su prerequisiti (certificati, sandbox, tempistiche aperture API).

## 8. Prossimi deliverable
- Summary dettagliati per gli altri moduli (ca-rentri, dati-registri, formulari, vidimazione, codifiche, FIR).
- Piano esecutivo Fase 1 (anagrafiche) con milestone e effort stimato.
- POC di chiamata STUB con logging completo e gestione errori.

