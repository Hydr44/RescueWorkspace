Gestionale per il soccorso stradale e le demolizioni, usato tutto il giorno in officina e in ufficio. Il sistema nasce dal marchio RescueManager (blu `brand` #005DFA e verde-acqua `brand-teal` del logo), dal pattern "datasheet" delle schede dell'app e da IBM Carbon come base dei componenti. Un solo blu, angoli a zero, una informazione per riga. Un solo tema, scuro blu: vale per l'app desktop e per l'area personale del sito.

## Principi

1. **Sembra un programma, non un sito.** Pannelli piatti, linee sottili in `border`, niente ombre sui pannelli, niente gradienti, niente angoli arrotondati (`radius-0` ovunque).
2. **Un blu solo.** `brand` fa tutto quello che e' azione o selezione. `brand-text` e' il solo blu per il testo. Il verde-acqua resta nel logo.
3. **Una riga, una informazione.** Mai separatori come pallini, puntini o trattini tra le informazioni. Se due dati stanno insieme, vanno su due righe: la seconda in `secondario` e `text-secondary`.
4. **Il colore e' un'eccezione.** Solo `danger` (ritardi, errori) e `brand-text` (in corso, link) colorano il testo. Le conferme sono neutre: testo in `text-secondary` su `layer-2`, senza verde.
5. **Le parole del mestiere.** Chiamata, targa, carro, autista, convenzione, pratica, formulario, deposito. Mai "Dashboard" nei titoli di pagina: la pagina iniziale si intitola con la data.

## Contenuti

- Tono: diretto, in seconda persona solo quando serve, mai saluti ("Buongiorno, Emmanuel" no; "Oggi, mercoledi' 24 settembre" si').
- Casing: frasi in minuscolo con la sola iniziale maiuscola, anche nei titoli di sezione e nelle intestazioni di tabella. Mai maiuscolo spaziato.
- Numeri: cifre tabellari; unita' scritte per esteso quando c'e' spazio ("16 min", "9,8 km", "per cento" invece di %).
- Date e ore: "Oggi, mercoledi' 24 settembre", "14:41", "ieri 17:45". Ora e data nella stessa cella, l'ora in `text-secondary`.
- Stati: testo, mai pallini. "Da assegnare" in `text`, "Parte 15:10" in `text-secondary`, "16 min" con "in viaggio" sotto in `brand-text`, "Ritardo 12 min" in `danger` a peso 600, "Completato" e "Annullato" in `text-secondary`.
- Niente emoji, niente punti esclamativi.

## Colore

- Superfici: `canvas` per la pagina, `layer` per pannelli, barre e tabelle, `layer-2` un gradino sopra (righe di conferma, tasti), `layer-3` per avatar e segmenti spenti. Sono i navy blu del codice dell'app (#0A1119, #141C27, #1A2536, #243044). Non esiste un tema chiaro.
- Barra laterale: `sidebar` per la lista, `sidebar-ends` per testa (logo) e piede (utente), `sidebar-selected` per la voce attiva, testo in `sidebar-text`, gruppi in `sidebar-muted`, icone in `sidebar-icon`. E' la stessa nell'app e nell'area personale web: cambiano solo le voci.
- Testo: `text` su `canvas` e `layer`; `text-secondary` per etichette e seconde righe; `text-placeholder` solo nei campi vuoti.
- Azione: `brand` con `brand-on` sopra; `brand-hover` e `brand-active` per gli stati. Pulsante secondario: `layer-3` con `text` e un bordo `border-strong`. Pulsante terziario: bordo e testo `brand-text`. Ogni azione si vede: niente pulsanti che sembrano testo, il ghost e' solo per le icone nelle barre.
- Segnale: `danger` per testo e bordi di errore, `danger-bg` per la riga di errore. Nessun verde, nessun giallo, nessun viola.
- `marketing-navy` e `brand-teal` sono registrati perche' esistono nel marchio e nelle brochure, non perche' si usino nell'app.

## Tipografia

Inter variabile (file in `fonts/`), la stessa delle brochure e del sito. Tre misure di lavoro: `titolo-pagina` 24, `body` 13, `secondario` 12; i numeri che contano in `metrica` 28 a peso 500 (non 300: con Inter il peso leggero risulta esile). Targhe e codici in `codice` (monospazio). Etichette in `etichetta` 12,5 in minuscolo. Niente testo sotto i 12 px.

## Spaziatura e misure

Scala 4, 8, 12, 16, 24. Righe da `row-height` 48 px nelle schede e nelle tabelle a due livelli, `row-height-compact` 40 px altrove. Cella etichetta `label-column` 140 px. Barra laterale `sidebar-width` 232, pannello di dettaglio `panel-width` 300, barra dell'azienda `topbar-height` 48. Contenuto delle schede al massimo 940 px, centrato.

## Bordi, angoli, ombre

Tutto con `hairline` 1 px in `border`. Raggio `radius-0` su ogni elemento, campi e avatar compresi. `accent-bar` 3 px in `brand` solo per la barretta dei titoli di sezione e per il bordo sinistro della riga selezionata. Ombra solo `shadow-overlay`, su finestre e menu aperti.

## Layout delle pagine

- Barra laterale a sinistra (logo, gruppi Operativo, Anagrafiche, Analisi; utente in basso), barra dell'azienda in alto (nome azienda con selettore sede a sinistra; cerca, notifiche, aiuto, avatar a destra).
- Liste: titolo con conteggio e navigazione per data, azione principale a destra; tab con conteggi come filtro di stato; tabella a filo dei bordi con selezione; pannello di dettaglio a destra con il numero che conta in `metrica`.
- Schede e form: pattern datasheet (componente `Datasheet`): testata con indietro, briciola, titolo, stato bozza, avanzamento e azioni; selettore di tipo; sezioni con barretta; righe a griglia con l'etichetta nella cella a sinistra; conferme neutre a riga intera; pie' di pagina con scorciatoie e azioni ripetute.
- Pagina iniziale: titolo con la data, quattro indicatori, andamento, tre liste (da sistemare, attivita', scadenze).
- Accesso all'app: nessun campo email o password nell'app. La schermata ha il pannello blu con il logo e i quattro moduli a sinistra e, a destra, una scheda con il solo pulsante "Accedi con il browser" (componente `LoginSso`); mentre si aspetta il browser la scheda mostra i quattro passi Connessione, Verifica, Autorizzazione, Completato (`LoginProgress`). Le credenziali si inseriscono nel browser, sulla pagina rescuemanager.eu/auth/oauth/desktop (`WebAuthPage`), che poi rimanda all'app.

## Area personale web

L'area personale di rescuemanager.eu (Panoramica; Account con Profilo, Sicurezza, Privacy, Notifiche; Organizzazione; Fatturazione con Abbonamento, Metodi di pagamento, Fatture; Download app; Supporto) usa lo stesso sistema dell'app: stessi token, stessa `Sidebar` con la mappa del sito al posto dei moduli, stessa barra in alto con "Area personale" ed "Esci" al posto del selettore azienda (`WebShell`), stesse schede, tabelle e pulsanti. Le pagine sono piu' strette (contenuto al massimo 1000 px) e usano riquadri con coppie etichetta e valore (`KeyValueRows`) e righe di consumo con barra (`UsageRow`). Le pagine pubbliche del sito (home, prezzi) restano sul `marketing-navy` delle brochure e non fanno parte di questo sistema.

## Iconografia

Icone di IBM Carbon (`@carbon/icons-react`), 16 px nelle voci e nei pulsanti, 20 px nella barra dell'azienda, a un solo tratto, in `sidebar-icon` nella barra laterale e in `text-secondary` altrove. Niente icone dentro le celle di tabella e niente icone decorative accanto ai titoli.

## Componenti

I componenti visivi sono quelli di IBM Carbon (`@carbon/react`) con i token di questo sistema applicati alle variabili `--cds-*` nel tema `g100` (scuro blu): pulsanti, campi, menu a tendina, tabelle, tab, selettore a segmenti, avvisi, indicatore di avanzamento. Il modulo `Datasheet`, la `Sidebar`, la `TopBar` e il `DetailPanel` sono del sistema. Il foglio `components/bundle.css` contiene Carbon compilato piu' le regole del sistema: angoli a zero, scuro blu, datasheet, barra laterale.

## Cosa non fare

- Riquadri KPI in cima a una lista; badge in maiuscolo su ogni riga; avatar a iniziali al posto dei nomi; barre di avanzamento a tappe nei pannelli; linee verticali nelle liste di attivita'; finta barra di ricerca con scorciatoia; briciole di pane insieme alla barra laterale.
- Piu' di un blu acceso; verde per le conferme; gradienti; angoli arrotondati; ombre sui pannelli; maiuscolo spaziato; pallini e trattini tra le informazioni.
