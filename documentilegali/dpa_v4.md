# Data Processing Agreement (DPA)

Contratto di Responsabile del Trattamento ex Art. 28 del Regolamento (UE) 2016/679 (GDPR)

**Versione 4.0**
In vigore dal [INSERIRE DATA — stessa data dei Termini e Condizioni v4.0]

Il presente Data Processing Agreement ("DPA") è parte integrante dei Termini e Condizioni di Servizio conclusi tra il Cliente (di seguito "Titolare del Trattamento") e RescueManager S.r.l., società a responsabilità limitata di diritto italiano, P.IVA 02176370852 (di seguito "Responsabile del Trattamento" o "RescueManager"), e disciplina il trattamento dei dati personali effettuato da RescueManager per conto del Cliente nell'ambito dell'erogazione del Servizio SaaS, ai sensi dell'art. 28 del GDPR.

## 1. Ruoli e Responsabilità

### 1.1 Definizione dei Ruoli

Le Parti concordano e riconoscono che, in relazione ai dati personali inseriti dal Cliente nella Piattaforma nell'esercizio della propria attività operativa:

- Il **Cliente** agisce in qualità di Titolare del Trattamento ai sensi dell'art. 4, n. 7, GDPR, in quanto determina autonomamente le finalità e i mezzi del trattamento dei dati relativi alla propria attività
- **RescueManager S.r.l.** agisce in qualità di Responsabile del Trattamento ai sensi dell'art. 4, n. 8, GDPR, in quanto tratta i predetti dati esclusivamente per conto del Cliente

### 1.2 Nomina
Con la sottoscrizione dei Termini e Condizioni (e la conseguente accettazione del presente DPA, che ne costituisce parte integrante), il Cliente nomina formalmente RescueManager S.r.l. quale Responsabile del Trattamento ai sensi dell'art. 28, par. 1, GDPR. Il Responsabile accetta tale nomina.

## 2. Oggetto, Natura e Finalità del Trattamento

### 2.1 Oggetto

Il Responsabile tratta i dati personali per conto del Cliente limitatamente a quanto necessario per erogare i servizi, e in particolare per:

- Gestire e archiviare le schede veicolo e i dati dei proprietari inseriti dal Cliente
- Supportare il Cliente nella trasmissione telematica dei dati alle autorità competenti (RENTRI, MCTC per RVFU)
- Consentire la gestione dell'anagrafica di dipendenti, clienti e fornitori del Cliente
- Gestire gli interventi di soccorso stradale (richiedenti, veicoli soccorsi, commesse e rendicontazione)
- Fornire funzionalità di reportistica e analisi sui dati del Cliente

### 2.2 Categorie dei Dati Trattati

- Dati identificativi e anagrafici dei proprietari dei veicoli (nome, cognome, codice fiscale, documento d'identità)
- Dati relativi ai veicoli: targa, numero di telaio, dati della carta di circolazione
- Dati dei dipendenti del Cliente: nome, cognome, ruolo, credenziali di accesso alla Piattaforma
- Dati anagrafici e fiscali di clienti e fornitori del Cliente
- Dati relativi alle pratiche ambientali: registrazioni RENTRI, FIR digitali, documentazione RVFU
- Dati relativi agli interventi di soccorso stradale: dati del richiedente, luogo e circostanze dell'intervento, veicolo soccorso

Non sono trattati, salvo diversa istruzione scritta del Cliente, dati appartenenti a categorie particolari ai sensi dell'art. 9 GDPR.

## 3. Istruzioni Documentate

**3.1 Obbligo di Seguire le Istruzioni:** Il Responsabile tratta i dati personali esclusivamente sulla base delle istruzioni documentate del Cliente (incorporate nel presente DPA, nei Termini e Condizioni, nelle configurazioni della Piattaforma, e in eventuali istruzioni scritte aggiuntive). Il Responsabile informa immediatamente il Cliente qualora ritenga che un'istruzione violi il GDPR o altra normativa applicabile.

**3.2 Divieto di Utilizzo per Finalità Proprie:** Il Responsabile si impegna a non utilizzare i dati personali trattati per conto del Cliente per finalità proprie o di terzi, né a comunicarli a terzi senza previa autorizzazione scritta del Cliente, salvo quanto imposto dalla legge applicabile.

## 4. Misure di Sicurezza Tecniche e Organizzative

### 4.1 Misure Adottate dal Responsabile (Art. 32 GDPR)

- **Crittografia in transito:** connessioni cifrate con protocollo TLS 1.3
- **Crittografia a riposo:** dati archiviati con standard AES-256
- **Controllo degli accessi:** autenticazione forte (password complesse + 2FA)
- **Backup e continuità operativa:** backup automatici giornalieri, conservati per almeno 30 giorni
- **Monitoraggio e log di audit:** rilevamento anomalie e audit trail
- **Valutazione periodica dei rischi:** analisi delle minacce e aggiornamento contromisure

### 4.2 Misure di Sicurezza dei Sub-responsabili

| Sub-responsabile | Certificazioni | Localizzazione | Note sicurezza |
|---|---|---|---|
| Vercel Inc. | SOC 2 Type 2, ISO 27001 | USA (DPF + SCC) | Infrastruttura edge; cifratura TLS; auth avanzata |
| IONOS SE | ISO 27001 | Germania / UE (SEE) | Data center certificati; nessun trasferimento extra-UE |
| Supabase, Inc. | SOC 2 Type 2 | USA / EU (SCC) | Row-level security; cifratura database |
| Stripe Payments Europe | PCI-DSS Level 1 | Irlanda / UE | Standard massimo per dati di pagamento |
| GoCardless Ltd. | ISO 27001 | Regno Unito (adeguatezza UE) | Istituto di pagamento autorizzato; cifratura dei dati dei mandati SDD |

## 5. Riservatezza del Personale

Il Responsabile del Trattamento garantisce che le persone autorizzate al trattamento dei dati personali per conto del Cliente (collaboratori, consulenti, dipendenti) siano vincolate da obblighi di riservatezza adeguati (contrattuali o derivanti da obblighi di legge) e abbiano ricevuto adeguata formazione in materia di protezione dei dati personali.

## 6. Sub-responsabili del Trattamento

### 6.1 Autorizzazione Generale ed Elenco Aggiornato

Il Cliente autorizza in via generale il ricorso ai seguenti sub-responsabili:

**Vercel Inc.**
Ruolo: hosting sito web e frontend
Sede: 440 N Barranca Ave #4133, Covina, CA 91723, USA
Localizzazione dati: USA — Garanzia: EU-U.S. DPF + SCC

**IONOS SE**
Ruolo: hosting API e backend
Sede: Elgendorfer Str. 57, 56410 Montabaur, Germania
Localizzazione dati: UE / SEE (Germania) — Garanzia: non applicabile, trattamento in SEE

**Supabase, Inc.**
Ruolo: database e autenticazione
Sede: 970 Toa Payoh North #07-04, Singapore (entità legale)
Localizzazione dati: USA / EU — Garanzia: SCC

**Stripe Payments Europe, Ltd.**
Ruolo: elaborazione pagamenti con carta
Sede: 1 Grand Canal Street Lower, Dublin 2, Irlanda
Localizzazione dati: UE — Garanzia: non applicabile, trattamento in UE

**GoCardless Ltd.**
Ruolo: gestione addebiti diretti SEPA (SDD) e relativi mandati
Sede: Sutton Yard, 65 Goswell Road, Londra EC1V 7EN, Regno Unito
Localizzazione dati: Regno Unito / UE — Garanzia: decisione di adeguatezza della Commissione UE per il Regno Unito

### 6.2–6.4 Obblighi, Responsabilità e Modifiche

- Il Responsabile impone ai sub-responsabili gli stessi obblighi del presente DPA (art. 28, par. 4, GDPR) e rimane pienamente responsabile del loro rispetto
- Eventuali modifiche ai sub-responsabili (aggiunta o sostituzione) sono comunicate con preavviso di almeno 30 giorni
- Il Cliente può opporsi alla modifica entro tale termine per ragioni motivate legate alla protezione dei dati

## 7. Notifica di Violazioni dei Dati (Data Breach)

**7.1 Obbligo di notifica entro 72 ore (Art. 33 GDPR)**

Il Responsabile notifica al Cliente, senza ingiustificato ritardo e comunque entro 72 ore dalla scoperta, qualsiasi violazione dei dati personali che lo riguardi.

La notifica contiene almeno: descrizione della natura della violazione, categorie e numero approssimativo di interessati coinvolti, dati di contatto del Responsabile, probabili conseguenze, misure adottate per rimediare alla violazione.

Il Responsabile si impegna a informare tempestivamente il Cliente anche in caso di violazioni comunicate dai propri sub-responsabili (Vercel Inc., IONOS SE, Supabase Inc., Stripe Payments Europe Ltd., GoCardless Ltd.).

**7.2 Collaborazione:** Il Responsabile collabora con il Cliente per consentire il rispetto degli obblighi di notifica all'autorità di controllo e di comunicazione agli interessati previsti dagli artt. 33 e 34 GDPR.

## 8. Assistenza al Titolare

Il Responsabile del Trattamento assiste il Cliente, nei limiti delle proprie competenze e delle informazioni disponibili, per:

- Rispondere alle richieste di esercizio dei diritti degli interessati (artt. 15-22 GDPR)
- Adempiere agli obblighi previsti dagli artt. 32-36 GDPR (sicurezza, notifica violazioni, DPIA)
- Effettuare le verifiche di conformità richieste dal Cliente, incluse audit e ispezioni, con un preavviso ragionevole

## 9. Cancellazione o Restituzione dei Dati

Alla cessazione del contratto di servizio, il Responsabile del Trattamento:

- Rende disponibile al Cliente, per un periodo di 90 giorni dalla cessazione, l'export completo dei dati in formato standard (CSV, JSON o equivalente), in coerenza con l'art. 10 dei Termini e Condizioni e con gli obblighi di portabilità ex Regolamento (UE) 2023/2854 (Data Act)
- Decorso tale termine, procede alla cancellazione definitiva e alla distruzione sicura di tutti i dati personali del Cliente presenti sui propri sistemi e su quelli dei sub-responsabili, salvo obblighi di conservazione previsti dalla legge
- Fornisce, su richiesta del Cliente, attestazione scritta dell'avvenuta cancellazione, comprensiva della conferma dell'avvenuta cancellazione presso i principali sub-responsabili

## Contatti per Questioni Relative al DPA

**Responsabile del Trattamento**
RescueManager S.r.l. — P.IVA 02176370852 — Capitale sociale € 100,00

**Recapiti**
Via dello Smeraldo 18, 93012 Gela (CL)
rescuemanager@legalmail.it
[www.rescuemanager.eu](https://www.rescuemanager.eu)

Termini e Condizioni · Privacy Policy · Cookie Policy · Trasparenza e Switching
