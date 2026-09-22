# Consigli campi & processi — moduli RescueManager

> Scope: **Clienti, Piazzale, Trasporti, Ricambi, Preventivi, Calendario** (desktop) + **app autisti** (RescueMobile).
> **Esclusi**: RENTRI, RVFU/demolizioni, SDI/fatturazione — nessun consiglio su quei moduli.
>
> Metodo: i consigli qui sotto sono stati incrociati con il codice reale dei form/liste già esistenti. Roba già presente NON è ripetuta (es. il CRM cliente ha già pipeline/tag/timeline/storico; il trasporto ha già tipologie servizio, preset soccorso, multi-stop, convenzioni ADR; il ricambio ha già OEM lookup, marketplace, foto, scaffali). Si propone **solo ciò che manca** e che ha valore operativo concreto per autodemolizione / soccorso stradale.
>
> Priorità: ⭐⭐⭐ alto impatto · ⭐⭐ utile · ⭐ nice-to-have.

---

## 1. Clienti

Il form (`ClientNew.jsx`) e il dettaglio (`ClientDetail.jsx`) sono già molto ricchi: anagrafica PF/azienda, documento d'identità, P.IVA auto-fill, SDI, dati commerciali (modalità pagamento, dilazione, IBAN, fido), referente, privacy/consensi, tag, pipeline, timeline, storico preventivi/trasporti/fatture. Quindi qui i campi mancanti sono pochi e mirati.

### Campi da aggiungere
- ⭐⭐ **Convenzione/assicurazione di riferimento** (select + n. polizza). Per i clienti "officina/carrozzeria/assicurazione" il soccorso stradale spesso fa capo a una convenzione (ACI, Europ Assistance, ecc. — le stesse già presenti in `TransportNew`). Averla sul cliente la pre-compila in automatico quando apri un trasporto per quel cliente. *(Serve nel quotidiano: chi lavora con assicurazioni non riscrive la convenzione ogni volta.)*
- ⭐⭐ **Esenzione IVA / regime fiscale** (es. art. 8, reverse charge, cliente estero UE/extra-UE). Un demolitore vende ricambi anche a operatori esteri; oggi l'aliquota è solo sul preventivo. *(Evita errori di IVA ricorrenti sullo stesso cliente.)*
- ⭐ **Blocco/avviso cliente** (flag "moroso/da bloccare" + motivo). Diverso dal fido: è un blocco operativo manuale che mostra un banner rosso quando lo selezioni in trasporto/preventivo.

### Processi/automazioni
- ⭐⭐⭐ **Avviso documento d'identità in scadenza**. Il campo `scadenza_documento` è già raccolto ma non genera nulla. Un badge "documento scaduto/in scadenza" in lista clienti + voce nel Calendario evita di consegnare un veicolo a chi ha CI scaduta (problema reale in custodia/rilascio mezzi sequestrati).
- ⭐⭐⭐ **Controllo fido in tempo reale**. `limite_fido` è raccolto ma mai confrontato con l'esposto. Calcolare esposto = somma fatture non pagate + preventivi accettati non fatturati, e mostrare alert quando si crea un nuovo preventivo/trasporto che sfora. *(Collegamento già possibile: ClientDetail somma già preventivi/trasporti/fatture.)*
- ⭐⭐ **Azione rapida "nuovo trasporto / nuovo preventivo da cliente"** dal dettaglio cliente (oggi il flusso inverso esiste: da trasporto → registra cliente). Pre-compila cliente, sconto default, modalità pagamento, convenzione.

### Collegamenti mancanti
- ⭐⭐ Cliente → **ricambi acquistati**. Lo storico cliente mostra preventivi/trasporti/fatture ma **non** i ricambi venduti a quel cliente (vedi §4: oggi la vendita ricambio non registra l'acquirente). Una volta collegato, è naturale mostrarlo nel timeline.

---

## 2. Piazzale (Yard)

`YardNew.jsx` è già forte sui sequestri/confische: targa, telaio, zona/posizione, n. pratica, n. chiave, autorità competente, date sequestro/confisca/scadenza pratica, foto all'ingresso, condizioni iniziali/finali, stato. Mancano soprattutto **automazioni** e i campi legati alla **custodia/giacenza a pagamento**, che è il vero business del piazzale.

### Campi da aggiungere
- ⭐⭐⭐ **Tariffa di custodia/giacenza giornaliera (€/giorno)** + **data inizio addebito**. Il piazzale che tiene auto sequestrate/incidentate fattura la sosta a giorno. Oggi si calcolano solo i "giorni in giacenza" (`YardDetail` mostra `${days} giorni`) ma non l'importo. *(È letteralmente come si fa il conto quando il mezzo viene ritirato/rilasciato.)*
- ⭐⭐⭐ **Soggetto che ha ordinato la custodia / committente** (Tribunale, GdF, assicurazione, privato) + collegamento a cliente. Serve per sapere a chi fatturare la giacenza e a chi notificare.
- ⭐⭐ **Chi ha consegnato il mezzo e chi lo ritira** (nome + documento + firma al rilascio). Il rilascio di un mezzo in custodia richiede tracciare la consegna. Oggi c'è solo `data_rilascio`.
- ⭐⭐ **Stato pagamento custodia** (da incassare / incassato / a carico erario) — per i sequestri non sempre paga il proprietario.
- ⭐ **Presenza/assenza documenti del veicolo** (libretto, targhe — sì/no/ritirate). Pratico al momento del rilascio.

### Processi/automazioni
- ⭐⭐⭐ **Promemoria scadenza pratica**. `scadenza_pratica` è raccolta e validata ma non genera avvisi. Badge "in scadenza/scaduta" in lista piazzale + evento nel Calendario X giorni prima (configurabile). *(Una pratica scaduta non gestita è un problema legale.)*
- ⭐⭐⭐ **Calcolo automatico importo giacenza** = giorni × tariffa, visibile nel dettaglio e riportabile in preventivo/fattura al rilascio. Chiude il cerchio con la tariffa custodia sopra.
- ⭐⭐ **Alert giacenza prolungata** (es. mezzo fermo da > N giorni senza movimento di stato) — utile per smaltire il piazzale ed evitare auto "dimenticate".
- ⭐ **Foto obbligatorie anche all'uscita** (oggi `requirePhotoOnEntry` esiste solo per l'ingresso): stato del mezzo alla riconsegna tutela da contestazioni.

### Collegamenti mancanti
- ⭐⭐⭐ Mezzo in piazzale → **trasporto di ingresso**. Spesso il mezzo arriva in piazzale via soccorso stradale: poter aprire il mezzo dal trasporto (e viceversa) collega "chi l'ha portato / con quale carro / da dove". Oggi i due moduli non si parlano.
- ⭐⭐ Mezzo in piazzale → **preventivo/fattura giacenza** al rilascio (genera riga "custodia N giorni × €/giorno").

---

## 3. Trasporti

`TransportNew.jsx` è il modulo più maturo: tipologie (standard/soccorso/conto terzi/mezzi speciali), preset soccorso, committenti, multi-stop, convenzioni, ADR, urgenza, prezzo stimato da tariffario, mappa. Anche `TransportDetail.jsx` (desktop) crea già fattura e l'app autisti gestisce stati/GPS/foto/firma. Qui i campi mancanti riguardano **consuntivo e documenti operativi**.

### Campi da aggiungere
- ⭐⭐⭐ **Km a vuoto / km a carico + km totali a consuntivo** (oltre al `soc_km` preventivato). Il soccorso si paga sui km reali; serve la coppia preventivato vs effettivo per fatturare correttamente e per i rimborsi convenzione.
- ⭐⭐ **Costi accessori** (pedaggi, custodia notturna, manodopera extra, materiale di consumo) come righe separate. Oggi c'è un solo `price`. Le convenzioni rimborsano queste voci distintamente.
- ⭐⭐ **Stato pagamento / a chi è addebitato** (cliente / committente / convenzione) + flag "pagato sul posto in contanti". Nel soccorso una parte si incassa cash all'intervento.
- ⭐ **Foto del veicolo al ritiro/consegna con conteggio danni** (l'app già fa foto/firma; manca un campo strutturato "danni pre-esistenti" che protegge da contestazioni assicurative).

### Processi/automazioni
- ⭐⭐⭐ **Programmazione reale a calendario**. `scheduled_date`/`scheduled_time` sono salvati in `meta` ma il Calendario raggruppa i trasporti per `created_at`, non per data programmata (vedi §6 — bug latente). Sistemarlo rende il trasporto programmato visibile nel giorno giusto e abilita i promemoria.
- ⭐⭐ **Assegnazione veicolo/autista con disponibilità**. I dropdown caricano già autisti/veicoli attivi; manca l'avviso se l'autista/mezzo è già impegnato in un altro trasporto nella stessa fascia oraria.
- ⭐⭐ **Promemoria appuntamento al cliente** (SMS/email "il carro arriva tra ~X min") — l'infrastruttura email esiste già (preventivi/calendario la usano).

### Collegamenti mancanti
- ⭐⭐⭐ Trasporto → **mezzo in piazzale** (vedi §2): se il dropoff è il proprio piazzale, creare/collegare la scheda mezzo con un click.
- ⭐⭐ Trasporto → **preventivo**. Oggi va direttamente a fattura; per i lavori "su preventivo" (conto terzi/officine) manca lo step preventivo → trasporto → fattura.

---

## 4. Ricambi

`SparePartNewMVP.jsx` è amplissimo: OEM/EAN/cross-ref, scanner+AI lookup, veicolo d'origine, dimensioni, garanzia, spedizione, prezzi con suggerimento, foto, scaffali, marketplace B2B/online. Il buco vero non è anagrafico: è il **processo di vendita** e il legame col cliente.

### Campi da aggiungere
- ⭐⭐⭐ **Acquirente / cliente al momento della vendita** (`client_id` o nominativo + contatto). Lo stato passa a `sold`/`reserved` ma **non si registra a chi**. Senza questo non c'è storico vendite per cliente, né garanzia tracciabile, né resi gestibili. *(È il dato più importante che manca in tutto il modulo.)*
- ⭐⭐ **Data vendita + canale** (banco / telefono / eBay / marketplace B2B / Subito). Per capire da dove arrivano davvero le vendite.
- ⭐⭐ **Inizio garanzia = data vendita** (la durata `warranty_months` c'è già, ma senza data di decorrenza non si sa quando scade per quel cliente).
- ⭐ **Codice attrezzo/posizione di smontaggio sul mezzo demolito** se proviene da un veicolo in entrata (es. "porta ant. DX, mezzo targa XX") — utile per ritrovare il pezzo fisicamente e per la provenienza.

### Processi/automazioni
- ⭐⭐⭐ **Azione "Vendi" rapida** che in un colpo: setta `sold`, chiede acquirente, decrementa quantità, registra il movimento, e offre "genera preventivo/fattura". Oggi vendere significa editare lo stato a mano senza traccia.
- ⭐⭐ **Prenotazione con scadenza**. Lo stato `reserved` esiste ma non ha "riservato a chi / fino a quando". Auto-rilascio se la prenotazione scade.
- ⭐⭐ **Alert garanzia in scadenza / reso in finestra** sui pezzi venduti — riduce contestazioni.
- ⭐ **Soglia scorta minima per categoria** con avviso (per i ricambi nuovi di consumo: olio, filtri).

### Collegamenti mancanti
- ⭐⭐⭐ Ricambio venduto → **cliente** (§1) e → **preventivo/fattura**. È lo stesso pattern già esistente per i trasporti (`/fatture/new?transportId=…`): replicarlo per i ricambi (`/preventivi/new?partId=…`) chiude il flusso vendita.
- ⭐⭐ Ricambio → **veicolo d'origine in piazzale**. I campi `source_vehicle_*` sono testo libero; agganciarli a un mezzo del piazzale dà "tutti i pezzi ricavati da questo veicolo" e marginalità per mezzo demolito.

---

## 5. Preventivi

`QuoteNew.jsx` ha righe, voci preimpostate, sconto/IVA, totali, stampa PDF, invio email, auto-numero, duplica, auto-save. Buono per l'80% dei casi. Quello che manca è il **ciclo di vita** del preventivo e l'aggancio agli altri moduli.

### Campi da aggiungere
- ⭐⭐ **Data scadenza/validità effettiva** (non solo `validitaGiorni` come numero): mostrare "valido fino al GG/MM" sul PDF e marcare automaticamente "scaduto".
- ⭐⭐ **IVA / sconto per riga** (oggi sono solo globali). Un preventivo che mischia ricambi (22%) e manodopera o voci esenti ha bisogno dell'aliquota per riga.
- ⭐⭐ **Acconto / caparra richiesta** (% o importo) — comune per lavori su preventivo prima di iniziare.
- ⭐ **Tipo voce** (ricambio / manodopera / trasporto / custodia) per righe più leggibili e per report.

### Processi/automazioni
- ⭐⭐⭐ **Sblocco scadenza preventivi**: usando la validità, badge "scaduto" in lista + cambio stato automatico, e promemoria di follow-up al cliente prima della scadenza. *(Recupera lavoro che oggi si perde perché nessuno richiama.)*
- ⭐⭐ **Preventivo accettato → trasforma in trasporto / ordine ricambi / fattura** con un click (oggi lo stato `fatturato` esiste ma il passaggio è manuale e non porta le righe).
- ⭐⭐ **Tracciamento apertura email** o almeno log "inviato/ri-inviato il…" per sapere quali preventivi richiamare.

### Collegamenti mancanti
- ⭐⭐⭐ Preventivo ↔ **ricambi**: aggiungere righe pescando dal magazzino ricambi (con prezzo e disponibilità reali), non solo come testo libero. È il legame oggi totalmente assente tra i due moduli.
- ⭐⭐ Preventivo ↔ **trasporto/custodia**: importare in una riga il consuntivo km/giacenza dagli altri moduli.

---

## 6. Calendario

`CalendarPage.jsx` mostra eventi (`calendar_events`) e trasporti, viste settimana/mese/lista, giorni festivi, invio email appuntamento. Il problema principale è che **vede pochi eventi reali** perché gli altri moduli non ci scrivono scadenze.

### Campi/eventi da aggiungere
- ⭐ Tipo evento "**intervento/sopralluogo**" oltre ad appuntamento/scadenza/promemoria/personale (più aderente al settore).
- ⭐ **Assegnazione evento a operatore/autista** (chi se ne occupa), così ognuno vede la propria agenda.

### Processi/automazioni
- ⭐⭐⭐ **Bug di programmazione trasporti**: il calendario filtra i trasporti per `created_at` (`getTransportsForDay` usa `transport.created_at`), ma la data scelta dall'utente è `meta.scheduled_date`. Risultato: un trasporto programmato fra 3 giorni appare *oggi*. Va letto `scheduled_date`. *(Senza questo fix tutta la programmazione è inaffidabile.)*
- ⭐⭐⭐ **Aggregatore scadenze cross-modulo**: il calendario è il posto naturale per far confluire scadenza pratica piazzale, scadenza documento cliente, validità preventivo, garanzia ricambio. Una "agenda scadenze" unica è il singolo upgrade a più alto valore percepito.
- ⭐⭐ **Promemoria push/notifica** il giorno prima per gli eventi (l'email c'è già, manca la notifica interna/app).

### Collegamenti mancanti
- ⭐⭐ Evento calendario ↔ **mezzo piazzale / ricambio / preventivo** (oggi si collega solo al cliente): aprire l'entità collegata dall'evento.

---

## 7. App autisti (RescueMobile)

L'app è ben fatta per il flusso base: home "Adesso/A seguire", lista trasporti con filtri, dettaglio con stepper stato, naviga/chiama, foto+firma cliente, claim "assegna a me", tracking GPS background, dettagli tipologia (anche meta creati da desktop), offline queue. Manca soprattutto ciò che serve **all'autista in strada** per non dover chiamare la centrale.

### Campi/dati da mostrare in più
- ⭐⭐⭐ **Dati del veicolo da soccorrere** ben in evidenza (targa, marca/modello, motivo, convenzione, n. pratica). Sono nel `meta` e oggi finiscono nella card "dettagli tipologia" in fondo: l'autista li vuole subito, in alto.
- ⭐⭐⭐ **Km a inizio/fine intervento** inseribili dall'autista sul posto (alimenta il consuntivo km del §3). Oggi non c'è modo di registrarli da mobile.
- ⭐⭐ **Note/istruzioni operative dalla centrale** visibili e una **nota di ritorno dell'autista** ("cliente non c'era", "mezzo bloccato in garage"). Le `notes` si vedono ma sono in sola lettura.
- ⭐⭐ **Incasso sul posto** (importo + contanti/POS) — l'autista nel soccorso spesso incassa.

### Processi/automazioni
- ⭐⭐⭐ **Notifiche push reali**. Il desktop chiama già `notifyDriverAssigned`, ma in app la campanella mostra `Alert('Non ci sono nuove notifiche')` hard-coded (`index.tsx`). Collegare le notifiche vere (nuovo trasporto assegnato, modifica, annullo) è essenziale per un'app da autista.
- ⭐⭐ **Multi-stop visibile e navigabile** dall'app: il desktop salva `meta.stops`, ma il dettaglio mobile naviga solo verso pickup/dropoff. L'autista dovrebbe poter aprire ogni tappa.
- ⭐⭐ **Foto in stati intermedi** (es. foto al ritiro, non solo a consegna) — oggi foto/firma sono legate al fine corsa (`consent`).
- ⭐ **"In pausa / non disponibile"** dell'autista, così la centrale non gli assegna trasporti.

### Collegamenti mancanti
- ⭐⭐ Trasporto mobile → **mezzo piazzale**: se l'autista porta il mezzo al piazzale, poter aprire/creare la scheda al volo con targa già compilata.
- ⭐ Cliente del trasporto → **scheda cliente** (anche sola lettura) per vedere convenzione/note ricorrenti senza chiamare l'ufficio.

---

## Riepilogo trasversale: i collegamenti che oggi mancano davvero

Il filo conduttore è che i moduli sono **isolati**. I tre ponti a più alto impatto:

1. **Trasporto ⇄ Piazzale** — il mezzo che arriva via soccorso diventa una scheda piazzale (con custodia/giacenza fatturabile).
2. **Ricambio ⇄ Cliente ⇄ Preventivo/Fattura** — registrare *a chi* si vende e generare il documento, oggi del tutto assente.
3. **Calendario come hub scadenze** — far confluire pratica/documento/validità/garanzia in un'unica agenda con promemoria.
