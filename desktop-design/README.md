# RescueManager desktop, tema nuovo

Progetto a parte, da trasferire nell'app desktop (`desktop-app/greeting-friend-api-main`). Contiene il tema (IBM Carbon, scuro blu, un solo tema), la cornice (barra laterale C1 e barra azienda), l'accesso SSO via browser, il pattern datasheet e le prime pagine rifatte. Il riferimento è il design system pubblicato "RescueManager" (token, README e componenti): questo progetto ne è la versione in codice.

## Provare

```
npm install
npm run dev
```

Si apre su http://localhost:5180. Il router usa l'hash (`#/login`, `#/trasporti`) così funziona anche in Electron con `file://`. I dati sono finti (`src/data/demo.js`).

## Cosa c'è

| Cartella | Cosa | Corrisponde nell'app a |
| --- | --- | --- |
| `src/theme/carbon.scss` | Carbon compilato da sass, senza i font di IBM | nuovo |
| `src/theme/tokens.css` | i token del design system come variabili CSS (`--brand`, `--canvas`, `--layer`, ...) | sostituisce i colori di `tailwind.config.js` (gray 700-950) |
| `src/theme/overrides.css` | i token sopra le variabili `--cds-*` del tema g100, angoli a zero, Inter, barra laterale, datasheet, liste, pannelli, accesso | `src/styles/*.css`, `App.css`, `index.css` |
| `src/theme/fonts.css` + `src/fonts/` | Inter variabile | i font attuali |
| `src/components/Shell.jsx`, `Sidebar.jsx`, `TopBar.jsx` | cornice | `src/components/Shell.jsx`, `Navbar.jsx`, `Topbar.jsx` |
| `src/components/PageHeader.jsx`, `StatusTabs.jsx`, `ListTable.jsx`, `DetailPanel.jsx` | pezzi delle liste | `src/components/list-shell/*` |
| `src/components/Datasheet.jsx` | pattern scheda (testata, sezioni, righe, conferme, piè di pagina) | il CSS `cf-*` dentro `src/pages/ClientNew.jsx` |
| `src/components/Card.jsx` | riquadro e indicatore (KpiTile) | `src/components/dashboard/*` |
| `src/components/LoginFrame.jsx` + `src/pages/Login.jsx` | accesso SSO: pulsante "Accedi con il browser", passi Connessione, Verifica, Autorizzazione, Completato | `src/pages/Login.jsx` (OAuthProgress) |
| `src/pages/Dashboard.jsx` | pagina iniziale con la data nel titolo | `src/pages/Dashboard.jsx` |
| `src/pages/Trasporti.jsx` | lista con tab, tabella e pannello di dettaglio | `src/pages/Transports.jsx` |
| `src/pages/TrasportoNuovo.jsx` | nuovo trasporto, passo 1 di 4 | `src/pages/TransportNew.jsx` |
| `src/pages/Clienti.jsx`, `ClienteNuovo.jsx` | lista clienti e scheda nuovo cliente | `src/pages/Clients.jsx`, `ClientNew.jsx` |
| `src/pages/TrasportoNuovo.jsx` (4 passi) | chiamata, veicolo (visura, classe, mezzo speciale), percorso (mappa, chilometri, chi paga, prezzo), riepilogo (assegnazione autista, avvisi) | `src/pages/TransportNew.jsx` |
| `src/pages/Impostazioni.jsx` | menu a sinistra per gruppi (Azienda, Moduli, Fatturazione, Sistema), datasheet a destra. Tutte le 22 sezioni sono fatte con i campi veri: Organizzazione, Personale, Sicurezza, Profilo, Soccorso e trasporti, Custodia, Demolizione VFU, Rifiuti RENTRI, Ricambi, Marketplace, UNRAE, Cobat, Tracking GPS, Calendario, CRM, Fatturazione, Abbonamento, Metodo di pagamento, Notifiche, Stampante etichette, Dati e backup, Sistema. Le tabelle dentro le sezioni usano `Tab` (righe con modifica e togli, riga "Nuovo" in fondo) | `SettingsLegacy.jsx` e ogni file di `components/settings/*` (una funzione qui per ogni componente di là) |
| `src/pages/FatturaNuova.jsx` | documento, cliente, righe modificabili con IVA e imponibile, totali, pagamento | `InvoiceNew.jsx`, `InvoiceForm.jsx` |
| `src/pages/Tracking.jsx` | elenco carri a sinistra, mappa, pannello di dettaglio | `TransportTracking.jsx`, `LiveDriverMap.jsx` |
| `src/pages/Calendario.jsx` | agenda settimanale a colonne, eventi con barretta per tipo | `CalendarPage.jsx` |
| `src/pages/PraticaRvfu.jsx` | timeline delle 7 fasi a sinistra, tab, veicolo, soggetti, documenti con stato | `DemolizioneRVFUDettaglio.jsx`, `components/rvfu/RVFUDetail.jsx` |
| `src/pages/RentriGuidato.jsx` | percorso a 6 tappe con elenco a sinistra e tappa corrente a destra | `RifiutiMovimentoGuidato.jsx` |
| `src/pages/RifiutiDaDemolizione.jsx` | veicolo demolito, tabella dei rifiuti con spunta e quantità, annota in un colpo | `RifiutiDaDemolizione.jsx` |
| `src/pages/LavagnaVfu.jsx` | lavagna per fase, una scheda per veicolo, barretta rossa per le pratiche ferme | `VFUKanbanBoard.jsx` |
| `src/pages/RifiutiSintesi.jsx`, `FattureSintesi.jsx`, `ContabilitaSintesi.jsx`, `Report.jsx`, `Mud.jsx`, `RiepilogoQuantita.jsx`, `ControlloGiacenza.jsx` | pagine di sintesi: titolo, quattro indicatori, cose da fare, elenchi; grafici a barre in `rm-bars` | `RifiutiDashboard.jsx`, `InvoiceDashboard.jsx`, `AccountingDashboard.jsx`, `Reports.jsx`, `RifiutiMud.jsx`, `RifiutiRiepilogo.jsx`, `ControlloGiacenza.jsx` |
| `src/components/Chat.jsx` | i pezzi della messaggistica RescueAI: messaggio utente (blocco layer-3), risposta (testo con il marchio, senza fumetto), righe delle attività sugli strumenti, azione proposta con Conferma e Annulla, fonti, dati usati, suggerimenti, campo di scrittura con Stop | `MessageBubble` e l'input in `AiAssistantPanel.jsx` |
| `src/components/AiPanel.jsx` | RescueAI come pannello agganciato a destra (380 px), non più finestra galleggiante; selettore Assistente e Consulente ambientale; si apre dal pulsante RescueAI nella barra azienda | `AiAssistantPanel.jsx` (stati, streaming, proposals restano) |
| `src/pages/ConsulenteAmbientale.jsx` | pagina intera: a sinistra cosa sa dell'azienda, come lavora, conversazioni; al centro la conversazione con fonti e dati usati; suggerimenti a elenco quando è vuota | `pages/ConsulenteAmbientale.jsx` |
| `src/pages/Fatture.jsx` | una lista sola con i tab di stato (Emesse, Da incassare, Scadute, Bozze, Ricevute) al posto di elenco, pagamenti, scadenzario, storico e invio SDI; pannello a destra con stato SDI, incasso, documenti, azioni che cambiano con lo stato | `Invoices.jsx`, `InvoicePayments.jsx`, `InvoiceScadenzario.jsx`, `InvoiceStorico.jsx`, `SdiBulkSend.jsx` |
| `src/pages/ChiusuraIva.jsx` | registri vendite e acquisti per aliquota, IVA da versare, cose da sistemare prima di chiudere | `InvoiceChiusuraIva.jsx` |
| `src/pages/unrae/Unrae.jsx` | un modulo con il titolo in testa e un selettore a tre voci: Demolizioni (sintesi e lista con pannello), Reti di vendita (lista con pannello), Caricamento massivo (file, anteprima con esito per riga). Nuova comunicazione a pagina intera nel pattern datasheet | `pages/unrae/*` (Dashboard, DemolizioniList, DemolizioneDetail, InserimentoForm, RetiVendita, UploadFile) |
| `src/components/Modals.jsx` | le tre finestre del sistema: `Confirm` (domanda nel titolo, conseguenze, dati, Annulla e azione), `Picker` (cerca e scegli con elenco a due righe), `Sheet` (scheda laterale da destra, 720 px, con dentro il datasheet, per modificare o creare cose piccole) | `Modal.jsx` e le 50 `ComposedModal` nelle pagine; `EditorModal` in TransportPresetsSettings |
| `src/components/ListinoEditor.jsx` | la scheda unica della voce di listino soccorso: cos'è, a chi si applica (tutti, privati, convenzione), come si calcola, prezzi per classe, supplementi, note | `PresetSoccorsoCard`, `SoccorsoListinoCard` e `SoccorsoListinoEditor` in `TransportPresetsSettings.jsx`: diventano una cosa sola |
| `src/pages/DemoModali.jsx` | pagina di prova per vedere le tre finestre (`#/demo/modali?m=confirm`, `picker`, `sheet`). Nell'app non va | |
| `src/components/FakeMap.jsx` | segnaposto della mappa (strade, percorso, mezzi in SVG) | nell'app resta Leaflet o Mapbox: si tiene solo la cornice e i marker squadrati |
| `src/data/nav.js` | gruppi e voci della barra laterale con le rotte dell'app | la lista in `Shell.jsx` |
| `src/components/Placeholder.jsx` | pagina non ancora rifatta | |

## Rotte del prototipo

`#/login`, `#/`, `#/trasporti`, `#/trasporti/nuovo`, `#/trasporti/nuovo/veicolo`, `#/trasporti/nuovo/percorso`, `#/trasporti/nuovo/riepilogo`, `#/clienti`, `#/clienti/nuovo`, `#/tracking`, `#/calendario`, `#/demolizioni-rvfu` (lavagna), `#/demolizioni-rvfu/dettaglio/1`, `#/rifiuti`, `#/rifiuti/movimenti/guidato`, `#/rifiuti/da-demolizione`, `#/rifiuti/mud`, `#/rifiuti/riepilogo`, `#/rifiuti/giacenza`, `#/fatture`, `#/fatture/nuova`, `#/contabilita`, `#/report`, `#/settings`, `#/settings/soccorso`, `#/rifiuti/consulente`. Il pannello RescueAI si apre dal pulsante nella barra azienda, oppure con `?ai=1` o `?ai=ambientale` dopo la rotta (`#/trasporti?ai=1`). Le altre voci del menu aprono `Placeholder`.

## RescueAI

- Il pannello sta a destra del contenuto, come il pannello di dettaglio, e la pagina si restringe: niente finestra sopra la pagina. Sotto i 1.280 px di finestra conviene aprirlo sopra la pagina come oggi.
- Le risposte non hanno fumetti: testo con il marchio a sinistra. I messaggi dell'utente sono un blocco `layer-3` allineato a destra. Nessun colore diverso per il consulente: cambia il testo sotto il nome, non il colore.
- Quello che l'assistente fa (`Consultando fatture`, `Cercando la normativa`) è una riga in `layer-2` con lo stato a destra come testo: in corso, fatto, non riuscito. Niente spinner colorati.
- Le azioni proposte sono una scheda con la barretta `brand`, le coppie della richiesta e due pulsanti: Conferma (primario, con il verbo giusto: "Invia sollecito") e Annulla (ghost). Dopo, lo stato è una riga di testo.
- Il consulente cita le fonti (titolo, ente, una per riga) e mostra i dati dell'azienda che ha usato in una griglia `ai-data`. Il piè di pagina dice sempre "Non trasmette nulla a RENTRI".

## Finestre

- Conferma (`Confirm`): il titolo è la domanda con il dato dentro ("Eliminare il trasporto TR0003?"), una riga dice cosa succede e se si può annullare, sotto i dati di cosa si tocca. Due pulsanti: Annulla e l'azione con il verbo ("Elimina il trasporto"). Per le azioni che non si annullano il pulsante è rosso a bordo, mai pieno. Sostituisce le 38 finestre "Attenzione".
- Scelta (`Picker`): per cercare un cliente, un articolo, un mezzo. Campo in testa, elenco a due righe, un clic sceglie. "Nuovo" in fondo se da lì si può creare.
- Scheda laterale (`Sheet`): per modificare o creare cose piccole (voce di listino, indirizzo, zona, membro). Si apre da destra, 720 px, dentro ha il datasheet con le sezioni, in fondo scorciatoie e azioni. Sostituisce le modali con i campi impilati.
- Listino soccorso: le tre cose di oggi (tariffario base, preset, tariffario privati) diventano il tariffario base in Impostazioni più un listino unico di voci. Ogni voce dice a chi si applica e come si calcola, con i prezzi per classe. Il preset è solo una voce che si propone da sola nel nuovo trasporto.

## Le pagine di sintesi

Hanno tutte la stessa forma, così le altre (Vendite, Marketplace, Ricambi, UNRAE) si fanno uguali: `PageHeader` con titolo e riga di contesto, quattro `KpiTile`, una `Card` "Richiede attenzione" o "Scadenze" con righe `rm-row` e stato come testo, una `Card` con l'elenco delle funzioni o i totali, una tabella o un elenco degli ultimi movimenti. Grafici solo a barre (`rm-bars`), un colore, l'ultimo periodo in `brand`.

## Come trasferirlo nell'app (per Claude Code)

1. Nell'app: `npm install @carbon/react @carbon/icons-react sass`. Tailwind può restare durante il passaggio; alla fine si toglie.
2. Copiare `src/theme/` e `src/fonts/` nell'app e importare in `src/main.jsx`, in quest'ordine: `fonts.css`, `carbon.scss`, `tokens.css`, `overrides.css`. Mettere `class="cds--g100 rm-root"` sul `<body>` di `index.html`. Togliere `ThemeInit.jsx` e `ThemeToggle.jsx`: esiste un solo tema.
3. Sostituire `Shell.jsx` (e `Navbar.jsx`, `Topbar.jsx`) con `Shell.jsx`, `Sidebar.jsx`, `TopBar.jsx` di qui. Le voci vengono da `src/data/nav.js`: collegare `ORG` e `USER` a `OrgContext` e all'utente OAuth (`readStoredUser`), il conteggio di Trasporti alla query vera. Tenere i guard (`RequireAuth`, `ModuleGuard`, `SubscriptionGate`) come sono: avvolgono l'`Outlet`.
4. Sostituire `src/pages/Login.jsx` con quello di qui: il pulsante chiama `OAuthService.startLogin()` al posto di `startDemo()`, i passi seguono lo stato dell'OAuthService, il pulsante "Demo: simula il ritorno dal browser" si toglie. `AuthCallback.jsx` resta com'è.
5. Pagina per pagina: prendere la pagina di qui, collegare i dati veri (query, hook, contesti dell'app) al posto di `src/data/demo.js`, tenere la logica dell'app e buttare il vecchio JSX e le classi Tailwind. Le liste usano `PageHeader`, `StatusTabs`, `ListTable`, `DetailPanel`; le schede e i form usano il kit `Datasheet.jsx`.
6. Per ogni pagina non ancora rifatta, `Placeholder` mostra il titolo nel tema nuovo, così l'app resta navigabile.

## Regole (le stesse del design system)

- Ogni azione si vede come un pulsante. Quattro tipi e basta: primario (pieno blu, uno per vista), secondario (grigio con bordo, per Annulla e le azioni di contorno), terziario (blu a bordo, per le azioni dentro le righe e le tabelle: Compila, Cerca, Genera, Nuova voce, Modifica), ghost solo per le icone nelle barre, il selettore azienda e Indietro. Niente pulsanti che sembrano testo: "Crea cliente", "Modifica", "Aggiungi riga" sono terziari. I link (testo blu sottolineato) servono solo per andare in un'altra pagina, mai per fare qualcosa.
- Un solo blu, `--brand` #005DFA. `--brand-text` #54A2FF per link e "in viaggio". Nient'altro di acceso.
- Angoli a zero su tutto: `.rm-root *{border-radius:0}` lo impone anche ai componenti Carbon.
- Una riga, una informazione. Mai pallini, puntini o trattini tra le informazioni: la seconda informazione va sotto, in `rm-sub` o `rm-muted`.
- Niente verde: le conferme sono neutre (`DtOk`), gli errori in `--danger`. Il rosso è l'unico colore di stato.
- Stati come testo (`Stato` in `ListTable.jsx`), mai badge, pallini o icone nelle celle.
- Titoli in minuscolo con iniziale maiuscola, mai maiuscolo spaziato. La pagina iniziale si intitola con la data, mai "Dashboard".
- Icone di Carbon (`@carbon/icons-react`) a 16 px, non più `react-icons/fi`.
- Niente ombre sui pannelli, niente gradienti, niente saluti ("Benvenuto"), niente punti esclamativi.
