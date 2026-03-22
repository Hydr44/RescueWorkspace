# Gap Analysis — Sito vs App
> Generato: 5 Marzo 2026  
> Nota: RVFU escluso (in attesa risposta MIT/ACI)

---

## Legenda
- ✅ Implementato e coerente
- ⚠️ Parzialmente implementato / discrepanza minore
- ❌ Non implementato o incoerente con quanto scritto sul sito

---

## 1. TRASPORTI

### Cosa dice il sito
- Tracking GPS live su mappa con posizioni ritiro/consegna
- Dispatch: assegna mezzo + autista con stati (new/assigned/enroute/done)
- Report e analytics con export CSV
- "La fattura nasce dal trasporto — i dati del cliente, dell'intervento e dell'importo sono già lì"
- Storico trasporti per cliente linkato al CRM
- Notifiche automatiche per trasporti non chiusi

### Stato effettivo
| Feature | Stato | Note |
|---|---|---|
| Mappa tracking live (Leaflet) | ✅ | `TransportTracking.jsx` con marker ritiro/consegna |
| Stati new/assigned/enroute/done | ✅ | Implementati con colori |
| Export CSV | ✅ | `Reports.jsx` → bottone CSV |
| Storico per cliente | ✅ | `ClientDetail.jsx` tab Trasporti |
| Notifica trasporti non chiusi | ✅ | `useNotifications.js` controlla ogni 60s |
| **Crea fattura da trasporto** | ❌ | `TransportDetail.jsx` non ha nessun bottone "Crea Fattura". La fattura si crea da zero in `/fatture/new` senza pre-fill del trasporto |

### Azioni richieste
1. **[ALTA]** Aggiungere bottone "Crea Fattura" in `TransportDetail.jsx` che naviga a `/fatture/new?transportId=X` pre-compilando cliente, importo e descrizione dell'intervento.

---

## 2. CLIENTI

### Cosa dice il sito
- Anagrafica completa (nome, P.IVA/CF, indirizzo, SDI)
- "Contatti multipli per lo stesso cliente"
- Storico completo: preventivi, trasporti, fatture
- Pipeline CRM, tags, timeline attività
- KPI (count + totali)
- Tipologie: Privati, Assicurazioni, Aziende & Flotte

### Stato effettivo
| Feature | Stato | Note |
|---|---|---|
| Anagrafica base | ✅ | nome, P.IVA, CF, indirizzo, note |
| Storico completo (tabs) | ✅ | `ClientDetail.jsx` tab preventivi/trasporti/fatture |
| Pipeline CRM | ✅ | `client_pipeline_stages` |
| Tags | ✅ | `client_tag_assignments` |
| Timeline attività (note/call/email) | ✅ | `client_activities` |
| KPI | ✅ | Conteggi + totali in euro |
| **Contatti multipli** | ❌ | Il form `ClientNew.jsx` ha un solo telefono e una sola email. Il sito parla di "contatti multipli" ma la feature non esiste |
| **Tipo "Assicurazione"** | ❌ | L'app distingue solo Azienda/Privato. Il sito promette gestione specifica per assicurazioni ("tariffe con rimborso diretto"). Nessun campo specifico |
| **Codice SDI / PEC** del cliente | ⚠️ | Non presente in `ClientNew.jsx` — serve per la fatturazione (destinatario SDI) |

### Azioni richieste
1. **[MEDIA]** Aggiungere campo `codice_sdi` / `pec` in `ClientNew.jsx` — serve per pre-compilare la fattura elettronica
2. **[BASSA]** Aggiungere tipo cliente "Assicurazione" nel form con eventuali campi specifici (numero sinistro, compagnia)
3. **[BASSA]** Valutare se aggiungere "contatti multipli" (tabella `client_contacts`) o rinominare la feature sul sito

---

## 3. MEZZI & AUTISTI

### Cosa dice il sito
- Anagrafica mezzi con targa, marca, modello, tipo, portata
- Scadenze: assicurazione, revisione, bollo con notifiche automatiche
- Email automatica 30gg prima delle scadenze
- "Storico manutenzioni programmata e straordinaria"
- Gestione autisti con disponibilità settimanale
- Dispatch intelligente basato su disponibilità

### Stato effettivo
| Feature | Stato | Note |
|---|---|---|
| Anagrafica mezzi | ✅ | targa, marca, modello, tipo, portata, telaio |
| Scadenze assicurazione/revisione/bollo | ✅ | `VehicleNew.jsx` con colore warning se entro 30gg |
| Notifiche in-app scadenze | ✅ | `useNotifications.js` controlla mezzi entro 30gg |
| Email automatica scadenze | ✅ | `emailNotifications.js` ogni 6 ore |
| Gestione autisti + disponibilità settimanale | ✅ | `DriverNew.jsx` con checkbox giorni |
| **Manutenzioni** | ❌ | L'app ha solo uno stato "manutenzione" sul mezzo. Il sito promette "storico manutenzioni programmata e straordinaria" — non esiste una sezione/tabella per registrare le manutenzioni con data, tipo, km |
| **Tachigrafo** | ❌ | La pagina sito originale citava "Tachigrafo" tra le scadenze. Il form `VehicleNew.jsx` ha solo assicurazione/revisione/bollo — il tachigrafo manca come campo scadenza |
| **Km percorsi** | ❌ | Il sito menziona "chilometraggio aggiornato e storico interventi". Nessun campo km nel form |

### Azioni richieste
1. **[MEDIA]** Aggiungere campo `scad_tachigrafo` in `VehicleNew.jsx` e `vehicles` table — oppure toglierlo dalla pagina del sito
2. **[BASSA]** Valutare se implementare un registro manutenzioni (`vehicle_maintenances`) o riformulare il copy del sito
3. **[BASSA]** Aggiungere campo km al mezzo (opzionale)

---

## 4. PIAZZALE

### Cosa dice il sito
- "Registro veicoli con posizione nel deposito, settore assegnato e stato"
- "Settori configurabili (A1, B3, zona nord, ecc.)"
- "Quando il veicolo viene spostato, aggiorni la posizione in 10 secondi"
- Notifiche per veicoli fermi da 60+ giorni
- Storico movimenti per ogni veicolo
- "Mappa interattiva del piazzale" (nelle feature cards)

### Stato effettivo
| Feature | Stato | Note |
|---|---|---|
| Registro veicoli con zona/posizione | ✅ | `YardNew.jsx` ha `zona` (testo) e `posizione` |
| Tag (sequestro, confisca, demolizione...) | ✅ | `TAG_MAP` in `Yard.jsx` |
| Scadenza pratica per sequestri | ✅ | `scadenza_pratica` nel form |
| Notifiche veicoli 60+ giorni | ✅ | `useNotifications.js` |
| **Mappa interattiva piazzale** | ❌ | NON esiste. `Yard.jsx` è una lista filtrata, non una mappa grafica del layout del piazzale. Il sito promette una mappa visuale |
| **Settori configurabili** | ❌ | La zona è un campo testo libero, non ci sono settori predefiniti configurabili dall'utente |
| **Storico movimenti** | ⚠️ | `YardDetail.jsx` esiste ma occorre verificare se ha storico completo dei movimenti/spostamenti |
| **Stati coerenti con il sito** | ⚠️ | App usa: `attivo/in_manutenzione/venduto/demolito/rimosso`; il sito elenca: "In attesa, In lavorazione, Pronto per ritiro, Demolito, Uscito" — nomi diversi |

### Azioni richieste
1. **[ALTA]** Il sito promette una "mappa interattiva del piazzale" — questa è la feature più distante dalla realtà. Valutare: (a) implementarla, oppure (b) riformulare il copy del sito togliendo "mappa interattiva" e parlando di "registro con posizioni per settore"
2. **[MEDIA]** Allineare i nomi degli stati tra app e sito (cambiare `rimosso` → `uscito`, `in_manutenzione` → `in lavorazione`, ecc.) o aggiornare il sito
3. **[BASSA]** Verificare e potenziare `YardDetail.jsx` per lo storico movimenti

---

## 5. PREVENTIVI

*(Nessuna pagina dedicata sul sito — solo voce nel dropdown)*

### Stato effettivo
| Feature | Stato | Note |
|---|---|---|
| Lista preventivi | ✅ | `Quotes.jsx` |
| Nuovo preventivo | ✅ | `QuoteNew.jsx` |
| Preventivo da cliente | ✅ | ClientDetail → Azioni Rapide → Preventivo |
| Conversione preventivo → fattura | ⚠️ | Da verificare in `QuoteNew.jsx` |

### Azioni richieste
- Nessuna urgente. Il sito non ha una pagina dedicata quindi nessun gap da colmare.

---

## 6. RENTRI (Rifiuti)

### Cosa dice il sito
- FIR digitali con firma digitale e invio telematico
- "Ogni demolizione genera automaticamente un movimento di carico nel registro RENTRI"
- Registro carico/scarico sincronizzato col portale MASE
- MUD generato automaticamente dai movimenti dell'anno
- Alert limiti di giacenza per codice EER
- "Codici EER assegnati automaticamente in base al tipo di veicolo"

### Stato effettivo
| Feature | Stato | Note |
|---|---|---|
| FIR digitali (XFir) | ✅ | `RifiutiXFir.jsx` + `RifiutiXFirForm.jsx` + firma remota |
| Formulari PDF (FIR cartacei digitalizzati) | ✅ | `RifiutiFormularioFormPDF.jsx` |
| Registro movimenti (manuale) | ✅ | `RifiutiMovimenti.jsx` + `RifiutiMovimentoForm.jsx` |
| MUD export | ✅ | `RifiutiMud.jsx` con export XML/PDF |
| Notifiche PUSH da RENTRI | ✅ | Webhook implementato nel VPS |
| **Registro automatico da demolizione** | ❌ | Il sito dice "ogni demolizione genera automaticamente movimenti RENTRI". NON è vero: i movimenti si inseriscono manualmente in `RifiutiMovimentoForm.jsx`. Il collegamento demolizione→RENTRI non è automatico |
| **Alert limiti giacenza** | ❌ | Non trovato in nessuna pagina/hook. Il sito promette notifiche quando ci si avvicina alla soglia — non implementato |
| **Codici EER automatici da tipo veicolo** | ❌ | I codici EER si selezionano manualmente dal form. Il sito dice "il sistema lo conosce già e lo applica" — non è vero |
| **Sincronizzazione automatica col portale** | ⚠️ | Le trasmissioni sono manuali (si avviano dal pannello). Non è completamente automatica |

### Azioni richieste
1. **[ALTA]** Riformulare il copy del sito: togliere "genera automaticamente" e usare "crea in un click" o "con dati precompilati dalla demolizione"
2. **[MEDIA]** Implementare alert limiti giacenza — calcolare la somma per codice EER dai movimenti e confrontare con le soglie legali (10gg per pericolosi, 30m³ per non pericolosi)
3. **[MEDIA]** Aggiungere collegamento rapido demolizione→RENTRI: dalla scheda demolizione, bottone "Aggiungi carico RENTRI" con EER e peso precompilati (non necessariamente automatico, ma guidato)
4. **[BASSA]** Aggiungere EER suggerito in base al tipo di veicolo selezionato nel form

---

## 7. SDI / FATTURAZIONE

### Cosa dice il sito
- Generazione XML FatturaPA con validazione pre-invio
- Invio via nodo SDI SFTP certificato
- Notifiche SDI (RC, NS, MC, NE) gestite automaticamente
- "Fatture passive: RescueManager le scarica automaticamente, analizza l'XML, le registra in prima nota"
- "Conservazione sostitutiva con marca temporale e firma digitale per 10 anni"
- "La fattura nasce dal trasporto o dal preventivo"
- Nota di credito TD04 automatica
- Bollo virtuale, numerazione automatica
- Export per commercialista

### Stato effettivo
| Feature | Stato | Note |
|---|---|---|
| Generazione XML FatturaPA | ✅ | `xml-generator.js` conforme v1.7.1 |
| Invio SFTP nodo certificato | ✅ | Certificati P7M, firma digitale |
| Validazione pre-invio | ✅ | Implementata |
| Nota di credito TD04 | ✅ | `InvoiceForm.jsx` con bottone Storna |
| Eliminazione bozze / storno accettate | ✅ | Completamente implementato |
| Numerazione automatica | ✅ | Contatori per anno |
| **Fatture passive auto-import** | ❌ | Le fatture ricevute SI caricano ma **non automaticamente**: nella tab "Fatture Ricevute" c'è un bottone "Sincronizza" che l'utente deve premere manualmente. Il sito dice "le scarica automaticamente" — non è vero |
| **Prima nota automatica** | ⚠️ | `AccountingEntries.jsx` esiste ma serve verificare se la registrazione è automatica all'invio fattura o manuale |
| **Conservazione sostitutiva a norma** | ❌ | Le fatture sono salvate in Supabase DB, ma NON c'è una vera conservazione sostitutiva con marca temporale qualificata e firma digitale conforme al CAD italiano. Il sito afferma "conservate per 10 anni" — questa è una promessa legale non sostenibile con il solo DB |
| **Fattura da trasporto/preventivo** | ❌ | Vedi gap Trasporti: non esiste pre-fill dalla scheda trasporto |
| Bollo virtuale | ⚠️ | Da verificare in `InvoiceForm.jsx` |
| Export per commercialista | ⚠️ | `AccountingEntries.jsx` ha lista ma export CSV/PDF da verificare |

### Azioni richieste
1. **[ALTA]** Aggiungere sincronizzazione automatica fatture passive (polling ogni N ore) o almeno chiarire nel sito che è "con un click" non "automaticamente"
2. **[ALTA]** Correggere il copy sulla "conservazione sostitutiva" — è una dichiarazione legale forte. O implementarla con un servizio certificato (es. Aruba), o rimuovere dal sito e scrivere "archiviazione digitale sicura"
3. **[MEDIA]** Verificare e documentare se la prima nota si registra automaticamente
4. **[MEDIA]** Fattura da trasporto: vedi gap Trasporti #1

---

## Riepilogo Priorità

### ALTA PRIORITÀ (impatto commerciale immediato / rischio legale)

| # | Modulo | Gap | Azione |
|---|---|---|---|
| 1 | SDI | Copy "conservazione sostitutiva" è una promessa legale non mantenuta | **Correggere il sito** o integrare servizio certificato |
| 2 | SDI / Trasporti | "La fattura nasce dal trasporto" — non implementato | Aggiungere bottone in `TransportDetail.jsx` |
| 3 | SDI | Fatture passive "automaticamente" → in realtà manuale | Correggere copy del sito: "con un click" |
| 4 | Piazzale | Il sito promette "mappa interattiva" — non esiste | Correggere copy o implementare la mappa |
| 5 | RENTRI | "Registro automatico da demolizione" — non esiste | Correggere copy del sito |

### MEDIA PRIORITÀ (feature mancanti ma non bloccanti)

| # | Modulo | Gap | Azione |
|---|---|---|---|
| 6 | RENTRI | Alert limiti giacenza non implementati | Implementare calcolo giacenza + notifica |
| 7 | Clienti | Codice SDI / PEC cliente assente | Aggiungere campo in `ClientNew.jsx` |
| 8 | Piazzale | Stati app ≠ stati scritti sul sito | Allineare nomi stati |
| 9 | Mezzi | `scad_tachigrafo` mancante | Aggiungere campo o togliere dal sito |
| 10 | RENTRI | EER non automatici ma sito dice automatici | Aggiungere suggerimento EER da tipo veicolo |

### BASSA PRIORITÀ (nice to have / copy minore)

| # | Modulo | Gap | Azione |
|---|---|---|---|
| 11 | Clienti | "Contatti multipli" promessi ma singolo tel/email | Aggiungere o riformulare |
| 12 | Clienti | Tipo "Assicurazione" non esiste | Aggiungere o riformulare |
| 13 | Mezzi | Registro manutenzioni mancante | Implementare o riformulare |
| 14 | Mezzi | Km percorsi non presenti | Aggiungere campo opzionale |
| 15 | SDI | Export contabilità per commercialista da verificare | Verificare `AccountingEntries.jsx` |

---

## Note su RVFU
*(Escluso dall'analisi — in attesa risposta MIT/ACI per autorizzazione ForgeRock)*
Il workflow locale (9 fasi D.Lgs. 209/2003) è implementato e funzionante in modalità mock. Quando arriverà l'autorizzazione, il collegamento con il registro RENTRI e la generazione fattura saranno i punti da completare.
