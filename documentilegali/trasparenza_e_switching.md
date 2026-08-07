# Trasparenza e Switching

Informazioni su portabilità dei dati, cambio di fornitore e infrastruttura ICT ai sensi del Regolamento (UE) 2023/2854 ("Data Act"), artt. 23-31

**Versione 1.0**
In vigore dal [INSERIRE DATA — stessa data di entrata in vigore dei Termini e Condizioni v4.0]

La presente pagina è pubblicata da RescueManager S.r.l. (Via dello Smeraldo 18, 93012 Gela (CL), P.IVA 02176370852, PEC rescuemanager@legalmail.it) in qualità di fornitore di servizi di trattamento dei dati (SaaS), in adempimento degli obblighi informativi previsti dagli artt. 25, 26 e 28 del Data Act, applicabile dal 12 settembre 2025. Essa integra l'art. 10 dei Termini e Condizioni di Servizio.

---

## 1. Il tuo diritto di cambiare fornitore (switching)

In qualità di cliente RescueManager hai il diritto, in qualsiasi momento e senza obbligo di motivazione, di:

- passare a un altro fornitore di servizi di trattamento dei dati;
- passare a più fornitori contemporaneamente;
- migrare i tuoi dati verso una tua infrastruttura (on-premise);
- semplicemente esportare i tuoi dati, in ogni momento e gratuitamente, tramite le funzioni self-service della Piattaforma.

## 2. Come si attiva la procedura di switching

La richiesta si presenta tramite la funzione dedicata nella sezione "Il mio account" oppure via e-mail/PEC a rescuemanager@legalmail.it, indicando la destinazione della migrazione (nuovo fornitore o infrastruttura propria) e la data desiderata.

Tempistiche:

| Fase | Durata massima |
|---|---|
| Preavviso dalla richiesta | 2 mesi |
| Periodo di transizione (migrazione assistita, servizio attivo) | 30 giorni |
| Eventuale proroga per non fattibilità tecnica (comunicata entro 14 giorni lavorativi dalla richiesta, con motivazione) | fino a 7 mesi complessivi |
| Periodo di recupero dei dati dopo la cessazione | 90 giorni |

Durante il periodo di transizione RescueManager presta ragionevole assistenza alla migrazione e mantiene la continuità del servizio. Decorso il periodo di recupero, i dati sono cancellati in modo definitivo, salvi gli obblighi di conservazione di legge.

## 3. Categorie di dati esportabili e formati

Sono esportabili tutti i dati di input e di output del Cliente e i metadati generati dall'uso del servizio, con esclusione dei beni protetti da diritti di proprietà intellettuale del Fornitore o da segreti commerciali di terzi:

| Categoria | Formato di esportazione |
|---|---|
| Schede veicolo (targhe, telai, acquisti, cessioni, radiazioni RVFU) | CSV, JSON |
| Anagrafiche clienti, fornitori e proprietari dei veicoli | CSV, JSON |
| Magazzino ricambi e movimenti | CSV, JSON |
| Registri di carico/scarico e FIR digitali (RENTRI) | CSV, JSON + XML nei tracciati RENTRI ove previsti |
| Fatture elettroniche | XML (tracciato SDI) e PDF di cortesia |
| Interventi di soccorso stradale (commesse, mezzi, rendicontazione) | CSV, JSON |
| Documenti e allegati caricati dal Cliente | Formato originale di caricamento |

Tutti i formati strutturati sono di uso comune e leggibili da dispositivo automatico. L'esportazione self-service è disponibile in ogni momento dalla Piattaforma.

## 4. Costi di switching

- Esportazione self-service dei dati: **gratuita, sempre**.
- Operazioni di switching assistite: fino all'11 gennaio 2027 possono essere addebitati esclusivamente i costi effettivamente sostenuti da RescueManager, comunicati al Cliente prima dell'avvio; **dal 12 gennaio 2027 nessun costo di switching sarà addebitato**.
- Non sono previste penali di uscita; restano dovuti i soli corrispettivi maturati fino alla cessazione (art. 10.5 dei Termini e Condizioni).

## 5. Infrastruttura ICT e giurisdizione (art. 28 Data Act)

Il Servizio è erogato tramite i seguenti fornitori di infrastruttura:

| Fornitore | Ruolo | Giurisdizione dell'infrastruttura | Garanzie |
|---|---|---|---|
| Vercel Inc. | Hosting sito web e frontend | USA | EU-U.S. DPF + SCC; SOC 2 Type 2, ISO 27001 |
| IONOS SE | Hosting API e backend | Germania (UE/SEE), nessun trasferimento extra-UE | ISO 27001 |
| Supabase, Inc. | Database e autenticazione | USA / UE | SCC; SOC 2 Type 2 |
| Stripe Payments Europe, Ltd. | Pagamenti con carta | Irlanda (UE) | PCI-DSS Level 1 |
| GoCardless | Addebiti diretti SEPA (SDD) | Regno Unito (decisione di adeguatezza UE) | ISO 27001, FCA/CRD |

**Misure contro accessi governativi illeciti di Paesi terzi ai dati non personali** (art. 28, par. 1, lett. b, Data Act): cifratura dei dati in transito (TLS 1.3) e a riposo (AES-256); vincoli contrattuali con i sub-fornitori (SCC, DPF, DPA ex art. 28 GDPR); impegno a contestare, nei limiti di legge, le richieste di accesso di autorità di Paesi terzi in conflitto con il diritto dell'Unione o nazionale e a informare il Cliente ove legalmente possibile; minimizzazione dei dati trattati su infrastrutture extra-UE.

## 6. Interoperabilità e restrizioni note

RescueManager utilizza formati aperti e documentati per l'esportazione. Restrizioni note: le fatture elettroniche sono vincolate al tracciato XML SDI previsto dalla normativa italiana; i tracciati RENTRI seguono gli standard tecnici pubblicati dall'Albo Gestori Ambientali/RENTRI; la reimportazione dei dati presso altri fornitori dipende dai formati da questi supportati.

## 7. Contatti

Per ogni richiesta relativa a portabilità, switching o alla presente pagina: rescuemanager@legalmail.it — oggetto "Switching Data Act".

---

Termini e Condizioni · Privacy Policy · Cookie Policy · Data Processing Agreement
