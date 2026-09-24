# Componenti del design system

Le schede dei componenti, una per file, copiate dal design system pubblicato.

---

# Button

I pulsanti Carbon con il blu del marchio e gli angoli a zero. Ogni azione si vede.

Pulsanti di IBM Carbon (`@carbon/react` `Button`), quattro tipi e basta:

- **Primario**: pieno in `brand` con `brand-on`. Uno per vista: Salva, Nuovo trasporto, Emetti.
- **Secondario**: `layer-3` con un bordo `border-strong`. Per Annulla e le azioni di contorno accanto al primario.
- **Terziario**: bordo e testo in `brand-text`, si riempie al passaggio. Per le azioni dentro le righe, le tabelle e le schede: Compila, Cerca, Genera, Modifica, Nuova voce, Aggiungi riga, Crea cliente.
- **Ghost**: solo per le icone nelle barre (cerca, notifiche, altro), per il selettore azienda e per Indietro.

**Il consumatore fornisce**: testo, tipo, icona facoltativa.

- Niente pulsanti che sembrano testo: un'azione senza bordo e senza fondo non si trova. Se e' un'azione, e' almeno terziario.
- I link (testo in `brand-text`, sottolineato) portano in un'altra pagina, non fanno cose.
- Testo in minuscolo con iniziale maiuscola e il verbo giusto: "Nuovo trasporto", "Salva cliente", "Invia sollecito".
- Mai pulsanti pieni di un colore diverso da `brand`: per eliminare, rosso a bordo (`danger--tertiary`), mai rosso pieno.
- Altezza `md` 40 px nelle testate e nelle schede, `sm` 32 px dentro le tabelle. Icona a 16 px a destra del testo.

---

# ContentSwitcher

Selettore a segmenti per scelte a due o tre voci.

Il `ContentSwitcher` di Carbon con angoli a zero: per Azienda e Privato, per il tipo di intervento, per la priorita'. La voce selezionata e' piena (Carbon la disegna in `text` su `layer`, invertita); le altre in `layer-3`.

**Il consumatore fornisce**: le voci (2 o 3) e quella selezionata.

- Mai piu' di tre voci: oltre, un menu a tendina.

---

# DataTable

Tabella Carbon a due livelli per cella, con selezione e riga attiva.

La tabella delle liste: Carbon `DataTable` a filo dei bordi del contenuto, `row-height` 48 px per le righe a due livelli, selezione con caselle, riga selezionata in `selected` con la barretta `brand` a sinistra.

**Il consumatore fornisce**: le colonne (ora, targa, cliente, percorso, autista, stato), le righe, la riga selezionata.

- Ogni cella porta una informazione per riga: nome sopra, tipo sotto in `secondario`; partenza sopra, destinazione sotto; autista sopra, targa del carro sotto.
- Lo stato e' testo: `danger` a peso 600 per i ritardi, `brand-text` per "in viaggio", `text-secondary` per il resto. Niente pallini, badge o icone.
- Intestazioni in minuscolo, peso 500, `text-secondary`.
- Targa in peso 600, mai in maiuscolo spaziato.

---

# Datasheet

Il modulo scheda: sezioni con barretta, righe a griglia con l'etichetta in cella, conferme neutre, pie' di pagina.

Il pattern delle schede e dei form (clienti, mezzi, autisti, pratiche, nuovo trasporto), preso da ClientNew.jsx e vestito con i token. Contenuto centrato, massimo 940 px.

**Struttura**: `dt-card` per sezione con `dt-sechead` (barretta `accent-bar` in `brand` e `titolo-sezione`); righe `dt-row` alte `row-height` 48 px; l'etichetta in una cella a sinistra larga `label-column` 140 px, allineata a destra, in `etichetta` e `text-secondary`, con fondo `canvas`; il campo nella cella `dt-fld`. Due righe affiancate con `dt-grid`. Conferme in `dt-rowok`: testo `text-secondary` su `layer-2`, a larghezza intera, senza icona ne' colore. Errori uguali ma in `danger` su `danger-bg`. In fondo `dt-footer` con le scorciatoie e le azioni ripetute.

**Il consumatore fornisce**: sezioni, righe (etichetta, campo o campi, obbligatorio), conferme ed errori, azioni.

- Un asterisco in `brand-text` per i campi obbligatori, spiegato nel pie' di pagina.
- Dentro una cella al massimo un campo e un pulsante terziario ("Compila", "Genera"), o due campi corti (citta' e provincia).
- Niente verde: la conferma e' una frase neutra.

---

# DetailPanel

Pannello di dettaglio a destra della lista: codice, metriche, coppie, attivita', azioni.

Pannello largo `panel-width` 300 px con bordo sinistro `border`, fondo `layer`. In testa il codice o la targa in `titolo-pannello`, poi il nome in `body-strong` e due righe in `text-secondary`. Le due metriche che contano in `metrica`, separate da linee. Coppie etichetta e valore a 96 px. Attivita' come elenco ora e testo. In fondo tre azioni: due secondarie e una principale.

**Il consumatore fornisce**: codice, nome, righe descrittive, le due metriche, le coppie, le attivita', le azioni.

- Le metriche sono i soli numeri grandi: mai piu' di due.
- Niente barre di avanzamento a tappe, niente linea verticale nelle attivita'.

---

# FormHeader

Testata di una scheda: indietro, briciola, titolo, stato bozza, avanzamento, azioni.

Sopra ogni scheda, sotto la `TopBar`: pulsante ghost indietro, sopra il titolo la voce di provenienza in `secondario`, il titolo in `titolo-scheda`, sotto una riga con la descrizione e lo stato della bozza ("Bozza salvata alle 14:41", neutro). A destra "Compilato" con una barra lineare in `brand` su `border` e la percentuale, poi le azioni.

**Il consumatore fornisce**: provenienza, titolo, descrizione, stato bozza, percentuale, azioni.

- Lo stato bozza e' testo neutro: niente verde, niente icona.
- Le stesse azioni tornano nel pie' di pagina del `Datasheet`.

---

# KeyValueRows

Coppie etichetta e valore in un riquadro, una per riga, con linee sottili.

Dentro un riquadro Carbon `Tile` con titolo in `body-strong` e un link o una nota a destra, le informazioni stanno una per riga: etichetta a 150 px in `text-secondary`, valore in `text`, riga alta 36 px con un `hairline` sopra. Il dato che identifica (ragione sociale, piano) in peso 600. Usato in Panoramica, Organizzazione, Abbonamento, Sicurezza.

**Il consumatore fornisce**: titolo, azione a destra, le coppie.

- Mai due valori nella stessa riga separati da pallini o trattini: due righe.
- Gli stati ("attivo", "verificata", "non attivi") sono testo in `text-secondary`, non badge.

---

# KpiTile

Riquadro indicatore per la pagina iniziale: etichetta, numero in metrica, riga di contesto.

Riquadro Carbon `Tile` con etichetta in `secondario`, numero in `metrica` (peso 500), riga di contesto in `text-secondary`. Solo nella pagina iniziale, quattro per riga, separati da 1 px.

**Il consumatore fornisce**: etichetta, valore, contesto.

- Niente barre di avanzamento sotto il numero, niente frecce colorate: il contesto e' una frase ("2 in piu' di ieri").
- Mai in cima a una lista.

---

# LoginProgress

La scheda mentre si aspetta il browser: i quattro passi dell'OAuth in verticale, scadenza, riapri e annulla.

Sostituisce la scheda di `LoginSso` dal momento in cui l'app apre il browser. Titolo "Accesso in corso", sotto "Completa l'accesso nella finestra del browser". I quattro passi dell'OAuthProgress dell'app (Connessione, Verifica, Autorizzazione, Completato) come `ProgressIndicator` verticale di Carbon: i passi fatti con l'icona `CheckmarkOutline` in `brand-text`, quello in corso con `Incomplete` e il titolo in peso 600, quelli da fare con `CircleDash` in `text-secondary`; ogni passo ha una riga di spiegazione in `secondario`. Poi una riga su `layer-2` con l'icona `Time` e la scadenza del codice ("Scade tra 4 minuti e 12 secondi", che si aggiorna). In fondo due pulsanti a meta' larghezza: "Riapri il browser" secondario con `Restart`, "Annulla" ghost con `Close`.

**Il consumatore fornisce**: il passo corrente, i testi dei passi, i secondi rimanenti, le azioni.

- Niente barra con la percentuale: i passi sono quattro e si vedono.
- Quando la scadenza arriva a zero il passo corrente diventa un errore in `danger` e il pulsante primario torna "Accedi con il browser".
- Niente verde per i passi completati: `brand-text`.

---

# LoginSso

La schermata di accesso dell'app: nessun campo, un solo pulsante che apre il browser.

L'app desktop non chiede email e password: l'accesso avviene nel browser (OAuth su rescuemanager.eu, ritorno con `desktop://auth/callback`). La schermata e' divisa in due: a sinistra il pannello in `sidebar` con il logo bianco, la frase del prodotto in bianco e i quattro moduli (Soccorso stradale, Radiazioni RVFU, Fatturazione SDI, Registro RENTRI) come elenco con quadratini bianchi; in basso la versione in `sidebar-muted`. A destra, centrata su `canvas`, una `Tile` con "Accedi" in `titolo-scheda`, la riga "Entra nel tuo account per continuare" in `text-secondary`, il pulsante primario a tutta larghezza "Accedi con il browser" con l'icona Carbon `Launch`, sotto la nota "Si aprira' il browser per l'autenticazione sicura" con l'icona `Security` a 14 px, poi la guida "Come funziona" in tre passi numerati (quadrati a bordo `border-strong`), e il rimando alla registrazione. In fondo alla colonna destra una riga a 44 px con l'azienda e i link Supporto e Privacy.

**Il consumatore fornisce**: la versione dell'app, l'azione del pulsante, gli stati di errore (browser non aperto, codice scaduto) come `InlineNotification` sopra il pulsante.

- Mai campi di testo in questa schermata: le credenziali stanno solo nel browser.
- Un solo pulsante primario; "Registrati" e' un link.
- Niente saluti, niente frasi con punto esclamativo.

---

# PageHeader

Titolo di pagina con conteggio, navigazione per data e azione principale.

Testata di ogni lista: `titolo-pagina` con il conteggio accanto in `text-secondary` a peso 400, poi la navigazione per data (freccia, "Oggi, mercoledi' 24 settembre", freccia), a destra il pulsante principale e un pulsante secondario con l'icona altro.

**Il consumatore fornisce**: titolo, conteggio, data corrente, azione principale.

- Un solo pulsante in `brand` per pagina.
- Il titolo usa la parola del mestiere (Trasporti, Clienti, Carri), mai "Dashboard".

---

# Sidebar

La barra laterale C1: logo in testa, gruppi di voci, utente in piede, due toni di blu.

Barra laterale a sinistra di ogni pagina, larga `sidebar-width` 232 px. Testa e piede in `sidebar-ends`, lista in `sidebar`, voce selezionata in `sidebar-selected`. Il logo bianco (asset `logo-principale-bianco.svg`) sta in testa; l'azienda cliente NON sta qui ma nella `TopBar`.

**Il consumatore fornisce**: i gruppi e le voci (nome, icona Carbon a 16 px, conteggio facoltativo), la voce attiva, il nome utente.

- Gruppi in `sidebar-muted`, minuscolo con iniziale maiuscola, 11,5 px.
- Il conteggio (bianco su `sidebar`) solo per le code di lavoro (Trasporti), mai per le anagrafiche.
- Niente pallini di presenza accanto all'utente; niente icona per il gruppo.
- Uguale nei due temi: la barra e' parte del marchio.

---

# StatusTabs

Tab con conteggi come filtro di stato.

Sotto la testata, i tab Carbon con il conteggio accanto al nome: sono il filtro di stato della lista. A destra, nella stessa riga, i menu a tendina per autista e mezzo.

**Il consumatore fornisce**: gli stati con i conteggi, lo stato selezionato.

- Il conteggio va nel testo del tab, senza badge.
- Il tab "In ritardo" resta neutro: il colore `danger` appartiene alle righe, non ai filtri.

---

# TextInput

Campi e menu a tendina Carbon, piatti e squadrati.

Campi Carbon (`TextInput`, `Select`) con fondo `field`, bordo `border`, testo `text`, segnaposto `text-placeholder`; focus con anello `focus` pieno. Nel `Datasheet` l'etichetta sta nella cella a sinistra e il campo usa `hideLabel`.

**Il consumatore fornisce**: valore, segnaposto, stato di errore.

- Errore: bordo `danger` e riga di errore a larghezza intera sotto la riga, in `danger` su `danger-bg`.
- Codici e targhe in `codice` (monospazio).

---

# TopBar

La barra dell'azienda: selettore sede a sinistra, cerca, notifiche, aiuto e avatar a destra.

Barra alta `topbar-height` 48 px sopra ogni pagina, fondo `layer`, bordo `border`. A sinistra il nome dell'azienda cliente come pulsante ghost con freccia (apre il selettore sede), accanto la sede in `text-secondary`. A destra tre pulsanti ghost con icone Carbon a 20 px e l'avatar in `brand`.

**Il consumatore fornisce**: nome azienda, sede, iniziali utente, contatore notifiche facoltativo.

- Niente campo di ricerca finto: la ricerca e' un'icona e si apre sopra la pagina.
- Niente briciole di pane: la barra laterale e il titolo della pagina bastano.

---

# UsageRow

Riga di consumo con barra: cosa, quanto su quanto, una riga di contesto.

Per i consumi del piano (archivio, compilazioni automatiche, SMS, richieste al consulente IA): nome a sinistra in `body`, "usato di totale" a destra in `text-secondary`, sotto una barra alta 4 px in `brand` su `border`, sotto ancora una riga di contesto in `secondario`. La barra passa a `danger` solo oltre l'85 per cento: e' l'unico caso in cui il rosso non indica un errore.

**Il consumatore fornisce**: nome, usato, totale, contesto.

- Nessuna percentuale scritta: il rapporto e' gia' nel testo e nella barra.
- Niente verde e niente giallo intermedio.

---

# WebAuthPage

La pagina nel browser dove si inseriscono le credenziali e si autorizza l'app desktop.

La pagina rescuemanager.eu/auth/oauth/desktop, quella che l'app apre nel browser. Stesso tema scuro dell'area personale. In alto una barra a 52 px con il logo bianco e "Accesso per l'app desktop" in `text-secondary`. Al centro due colonne: a sinistra l'etichetta "App desktop" in `brand-text`, il titolo "Accedi alla tua applicazione." in `titolo-pagina` e i quattro vantaggi con icone Carbon a 16 px in `text-secondary` (Sincronizzazione automatica, Accesso offline ai dati, Notifiche desktop in tempo reale, Performance ottimizzate); a destra la `Tile` con "Accesso desktop", "Bentornato. Inserisci le credenziali per autorizzare l'app.", l'avviso su `layer-2` con la barretta `brand` "Stai autorizzando RescueManager Desktop su questo computer", i campi Email e Password, "Ricordami" e "Password dimenticata?", il pulsante primario "Autorizza e torna nell'app", la riga "oppure" e il pulsante terziario "Continua con Google". In fondo la riga con azienda, Privacy e Termini.

**Il consumatore fornisce**: il nome del computer o dell'app che chiede l'accesso, gli errori di credenziali (riga in `danger` su `danger-bg` sotto il campo), il pulsante Google con il marchio secondo le linee guida di Google.

- E' l'unico posto del sistema con email e password.
- Il login normale del sito (rescuemanager.eu/login) e' la stessa pagina senza l'avviso e con "Accesso" al posto di "Accesso desktop".

---

# WebShell

La cornice dell'area personale del sito: stessa barra laterale con la mappa del sito, barra in alto con Area personale ed Esci.

La stessa `Sidebar` dell'app con le voci del sito al posto dei moduli: Panoramica; gruppo Account con Profilo, Sicurezza, Privacy, Notifiche; Organizzazione; gruppo Fatturazione con Abbonamento, Metodi di pagamento, Fatture; Download app; Supporto. Icone Carbon a 16 px (`Meter`, `UserAvatar`, `Locked`, `View`, `Notification`, `Enterprise`, `Purchase`, `Receipt`, `Document`, `Download`, `Help`). La barra in alto e' la `TopBar` senza il selettore azienda: a sinistra "Area personale" in peso 600 e il dominio in `text-secondary`, a destra notifiche, aiuto, avatar e il pulsante ghost "Esci" con `Logout`. Il contenuto sta in una colonna larga al massimo 1000 px con rientro `space-6`.

**Il consumatore fornisce**: la voce attiva, il nome utente, il conteggio delle notifiche.

- Le pagine dell'area personale non hanno conteggi nelle voci: non sono code di lavoro.
- Il titolo di pagina e' la voce del menu (Panoramica, Fatture), con sotto una riga in `text-secondary` che dice di chi e' l'account o cosa elenca la pagina.
- Niente "Dashboard" e niente "Benvenuto".
