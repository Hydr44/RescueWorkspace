# App telefono — cosa manca, e in che ordine

Stato al 6 ottobre 2026, dopo un esame a dodici agenti: sei sonde indipendenti
(codice non collegato, stato della pubblicazione, permessi, disegni, migration,
e un critico incaricato di trovare quello che le altre non guardavano), e per
ognuna un agente il cui compito era **smentirla**.

**70 voci confermate, 4 smentite.** Le smentite sono in fondo e non vanno
riaperte: due di esse erano nella versione precedente di questo documento.

Ogni voce dice **cosa si rompe**, non solo cosa manca nel codice. Le prove sono
comandi eseguiti con la loro risposta, oppure `file:riga`. Dove c'è scritto
«misurato», è una sessione da autista vera su staging in transazione annullata,
non una rilettura delle policy.

Un limite dichiarato: lo strumento SQL della sessione è legato a **staging**.
Tutto quello che riguarda produzione è stato verificato leggendo il catalogo
(`pg_policies`, `pg_proc`) con il connettore di prod, **senza eseguire nessuna
scrittura là**.

---

## L'ordine consigliato

Ogni passo è rotto a monte del successivo: farne uno prima del precedente non
produce niente di visibile.

**0. Spingere RescueMobile.** 50 commit — tutto il lavoro del 5 e 6 ottobre —
esistono solo su un Mac, con un rsync ogni dieci minuti come unica rete. Quel
repo non ha CI: il push non pubblica niente. È l'unica azione a rischio zero che
elimina il rischio più grande. Sito e desktop **non** su `main`: là il push fa
partire Vercel e la pubblicazione su R2.

**0-bis. Disinnescare i due `project-ref`.** Il CLI Supabase di `desktop-app` e
di `website` punta a produzione: un `db push` per distrazione tenterebbe
centinaia di migration sul database dei clienti.

**1. Le policy, lettura e scrittura, partendo dalle credenziali.** È già attiva
adesso, con la 1.0.4 nelle mani dei clienti: non aspetta una build. Si stringe a
`is_org_ufficio(org)` — che **esiste già su prod** — e non a `is_org_admin`, che
toglierebbe la fatturazione agli operatori. Su `org_members` serve un trigger,
non una policy: il divieto è per colonna (`role`).

**2. Il tasto «Aggiorna» su Android, prima di accendere il controllo versione.**
Due funzioni corrette per conto loro che insieme murano le persone fuori.

**3. I difetti che si spedirebbero rotti.** Le fermate intermedie, la coda
offline che perde due tipi, la bozza fattura su colonne inesistenti, la sessione
scaduta senza spiegazione.

**4. L'interruttore che nessuno può accendere.** Prezzi, turni e Custodia: tre
funzioni finite e inerti per mancanza di un campo.

**5. Solo adesso:** versione, pubblicazione del sito, build.

**Fuori dalla release:** il restyling dei disegni rimasti (demolizioni, ricambi,
le cinque schermate d'ingresso, i colori di `rm-alert`, Inter che non viene
caricato). Reale, ma nessuno si rompe, ed è un blocco di lavoro grosso.

---

## Alta — 16 voci

### Le fermate in mezzo messe dall'ufficio non arrivano al navigatore: l'autista va diritto e salta tutto

L'ufficio scrive due fermate intermedie sul gestionale. Sul telefono il navigatore porta l'autista da ritiro a consegna e le fermate non ci sono: non le salta per errore di percorso, non le vede nemmeno. Nessun messaggio, nessuna riga vuota: la schermata sembra normale. Il contrario vale per chi crea dal telefono, perche' le due parti scrivono la stessa casella in due forme diverse e ognuna legge solo la sua.

*Prova:* RescueMobile/app/(tabs)/transports/navigate.tsx:253 fa `return raw.map((t) => t?.coords).filter(isLL)`. Il gestionale crea la tappa a desktop-app/greeting-friend-api-main/src/pages/TransportNew.jsx:758 come `{ address: loc.indirizzo, label: loc.name, km_from_prev: null }` — senza `coords`, e due righe sopra (:756) `loc.coords` ce l'ha in mano e la usa per la consegna. Anche PresetControls.jsx:184 crea `{ address, label, km_from_prev }`. Quindi `t?.coords`…

### L'autista non legge tre tabelle di troppo: ne legge 81, e fra queste un codice d'accesso ancora valido di un altro utente e la chiave privata RENTRI in chiaro

La lista dice invoices, accounting_entries e costo_orario. Sono veri, ma sono la punta: con la sessione di un autista rispondono 81 tabelle su 210. Fra queste `oauth_codes` risponde 299 righe su 299 e una di quelle e' un codice non usato e non scaduto intestato a un altro utente — con quello si entra al posto suo. `rentri_org_certificates` risponde 2 righe su 2 e una ha `private_key_pem` in chiaro piu' `certificate_password`: e' la chiave con cui si firma verso RENTRI, in mano a chi guida il carro. Poi `org_invites` (5/5, con la colonna `token` e il `role`), `plan_activation_links` (9/9, con `token`), `audit_log` (590/722), `system_settings` (17/17), `operator_sessions` (48/48). Oggi inviti…

*Prova:* Blocco `do $$ ... raise exception` su staging con `request.jwt.claims` dell'autista 97c00a8b (transazione annullata). Prima passata: «tabelle_con_RLS=210 | di_cui_con_almeno_una_riga_visibile_all_autista=81». Seconda: «codici_oauth_vivi=1 (di_altri=1) | inviti_pending=0 (ruolo_ufficio=0) | certificati=2 (di_altre_org=0, con_chiave_o_password=2) | link_attivazione_vivi=0». Terza: «chiave_privata_IN_CHIARO=1 | chiave_cifrata=0 | password_cert=1 |…

### L'App Store ha la versione di luglio: 1.0.4, non 1.1.0

Sul telefono di chi usa l'app oggi c'e' la 1.0.4 del 23 luglio. Il telaio dice 1.1.0 e sul Mac ci sono 50 modifiche oltre a quella. Il pericolo vero e' il controllo versione appena accendi la catena: se nel pannello scrivi «minima 1.1.0», ogni telefono reale si blocca davanti a una schermata che dice «aggiorna» e porta a una scheda App Store dove c'e' ancora la 1.0.4. Nessuno puo' obbedire. Prima di scrivere una policy deve esistere nello store la versione che la policy pretende.

*Prova:* curl -s 'https://itunes.apple.com/lookup?id=6774180587&country=it' -> version: 1.0.4, currentVersionReleaseDate: 2026-07-23T21:09:13Z, trackName: RescueManager (l'id e' quello di eas.json submit.production.ios.ascAppId e di RescueMobile/src/lib/versione.ts:77)

### Le 50 modifiche del telefono non sono mai uscite da questo Mac

Tutto il lavoro del 5 e 6 ottobre e' solo qui: il vestito nuovo, l'autista rimosso che non entra piu', la coda offline, il controllo versione, le schermate che fermano l'app. Il ramo pubblicato si fermava al 1 ottobre. Non e' «da buildare»: non c'e' niente da buildare, perche' nessun server ha questi commit. E se il disco si rompe stanotte, quelle 50 modifiche non esistono piu' da nessuna parte.

*Prova:* git -C RescueMobile rev-list --count origin/main..main -> 50; git ls-remote origin refs/heads/main -> 7c36c5e (identico al ref locale, quindi non e' un riferimento vecchio); git log -1 7c36c5e -> 2026-10-01 'mobile: versione 1.1.0'

### Le due route del sito non sono su nessun ramo remoto, non solo «non pubblicate»

GET /api/app-version risponde 404 su prod e su staging, e non e' un disservizio: /api/health risponde 200 su entrambi. Non e' nemmeno «scritta e in attesa di deploy»: il file non esiste su origin/main ne' su origin/staging, quindi un deploy adesso non la porterebbe. Finche' e' cosi' la catena e' inerte: il pannello scrive e nessuno legge, il telefono chiede e riceve una pagina HTML.

*Prova:* curl -s -o /dev/null -w '%{http_code}' su prod e staging /api/app-version?platform=ios&current=1.1.0 -> 404 e 404 (anche con platform=android -> 404/404); controllo: /api/health -> 200 e 200. git -C website cat-file -e origin/main:src/app/api/app-version/route.ts -> «exists on disk, but not in origin/main»; idem origin/staging. git ls-remote origin refs/heads/staging -> b288314, che e' esattamente il commit che /api/health dichiara servito da staging

### Confermato a mano: l'autista legge le 45 fatture e i 32 movimenti dell'azienda

L'ho rimisurato io, non riletto: con la sessione di un autista vero, invoices=45 (tutte le fatture presenti), accounting_entries=32, e le 5 paghe orarie dei colleghi. Aggiungo cosa la lista non diceva: la policy e' `is_member(org_id)`, quindi lo scoperto e' dentro l'azienda, non fra aziende — nessun altro cliente e' esposto. E su staff_drivers ci sono DUE policy di lettura in OR, per cui quella «solo me stesso» non restringe niente. La chiave anon e' dentro il bundle del telefono: basta estrarla.

*Prova:* do $$ ... set_config('request.jwt.claims', sub=97c00a8b-d2dd-4bbd-812e-4d3c96f2ee49) ... raise exception $$ -> «ESITO invoices=45 accounting_entries=32 costo_orario=5 org_settings=0 orgs=1 transports=0 clients=6» (transazione annullata dall'eccezione). Totali reali: invoices=45, accounting_entries=32 -> legge tutto. select from pg_policies -> invoices_select e accounting_entries_select = `is_member(org_id)`; staff_drivers ha staff_drivers_select…

### Il desktop: 5 file nuovi non tracciati, importati da 24 file che invece sono tracciati

Rotella.jsx, StartupSplash.jsx, OfflineGate.jsx, BootScreens.jsx, PaymentFailedGate.jsx non sono in git, ma App.jsx importa StartupSplash e OfflineGate, e Rotella e' importato da 24 file che sono committati e modificati. Se parte un build da un commit che non li contiene, vite non risolve l'import e il build muore — e' identico al guasto del 6 agosto, dove il CI Windows cadde su «Could not resolve ./pages/VehicleDetail».

*Prova:* git -C desktop-app/greeting-friend-api-main status --porcelain | grep '^??' -> i 5 file; git ls-files --error-unmatch su ognuno -> NON TRACCIATO; grep -rl 'components/Rotella' src -> 24 file, fra cui src/App.jsx (modificato), src/components/RequireAuth.jsx, src/components/SubscriptionGate.jsx

### Il desktop: il feed e' alla 2.4.17, il repo dice 3.0.0, e il commit che pubblica non e' sul remoto

Il programma che i clienti hanno in mano riceve aggiornamenti dal feed, e il feed e' fermo al 6 agosto. Il commit che insegna al CI a pubblicare su R2 (07c81aa) e il commit del fix «un autista non entra nel gestionale» sono solo locali, su un ramo che e' 46 commit avanti a main e 5 indietro: un tag tirato da main non li includerebbe, e il rilascio non pubblicherebbe niente. Quindi anche il blocco dell'autista sul gestionale, che la lista da' per chiuso, non e' arrivato a nessuno.

*Prova:* curl -s https://rescuemanager.eu/api/app-update/latest.yml e latest-mac.yml -> version: 2.4.17 (entrambi); /api/app-release/latest -> win 2.4.17, releaseDate 2026-08-06. package.json:3 -> "version": "3.0.0". git rev-list --count origin/feat/design-system-carbon..feat/design-system-carbon -> 2 (3bc0627, 07c81aa); git rev-list --left-right --count origin/main...feat/design-system-carbon -> 5 46

### Un autista si fa titolare della sua azienda con una riga, e da lì si apre tutto

L'autista scrive il proprio ruolo nella tabella dei membri e diventa «owner». Da quel momento legge le credenziali dell'azienda (utenze e password RVFU, IBAN, dati SDI), cancella le fatture e modifica l'anagrafica dell'azienda. È anche la via che annulla la chiusura di org_settings fatta il 6 ottobre: quella porta è stata chiusa, questa la riapre. Non serve nessun trucco: basta il gettone del suo telefono.

*Prova:* Blocco annullato su staging con l'identità di 97c00a8b (ruolo 'autista'): 1. ruolo di partenza: autista / 2. is_org_admin prima: false / 3. update org_members set role='owner' where user_id=me → 1 righe, rileggo ruolo=owner / 4. is_org_admin dopo: true / 5. org_settings leggibili ora: 18 (prima 0) / 6. delete fattura: 1 righe / 7. update orgs: 1 righe. Seconda prova, le chiavi lette dopo la promozione: rvfu_auth, rvfu_credentials, demolizioni, sdi,…

### Un autista cambia l'importo delle fatture e l'IBAN dei clienti

Non è solo lettura, come dice la lista: è scrittura. L'autista porta il totale di una fattura a 1 euro, sposta l'IBAN di un cliente sul proprio, ritocca la prima nota, cambia i prezzi del listino e lo cancella. L'ufficio non vede niente: il programma dice «fatto». Il rischio non è la riservatezza, è il denaro e la contabilità.

*Prova:* Blocco annullato, stessa identità: fatture.total → 1 righe, rileggo=1.00 | clienti.iban → 1 righe, rileggo=IT00X | contabilita.debit → 1 righe | preventivi.importo → 1 righe | tariffario.prezzo_base → 1 righe | update price_lists → 1 righe | DELETE price_lists → 1 righe. Causa, tutte con la stessa forma: invoices_update / clients_update / accounting_entries_update / quotes_update = is_member(org_id), price_lists_org_members = ALL con is_member(org_id). Il…

### Un autista riscrive la riga dei colleghi: paga, scadenze, e li chiude fuori dall'app

Il trigger del 6 ottobre protegge solo la riga dell'autista stesso: sulle righe degli altri lascia passare tutto, per scelta scritta nel commento («il service_role, o un impiegato su un'altra riga»). Quindi l'autista mette a 99 il costo orario dei quattro colleghi, retrodata le loro scadenze patente, cambia telefono ed email, e soprattutto spegne il loro accesso all'app: il collega la mattina dopo non entra. Può anche intestarsi la loro riga, cioè prendere la loro identità dentro l'app.

*Prova:* Blocco annullato: collega.costo_orario → 4 righe, rileggo=99,99,99,99 | collega mobile_status='inactive' → 4 righe, rileggo=inactive,inactive,inactive,inactive | collega telefono+email → 4 righe, rileggo=3990000022/mio22@test.it ... | collega auth_user_id = il mio → 4 righe | DELETE collega → 0 righe (questa sola è chiusa a owner/admin). Sulla sua riga il trigger invece tiene: suo.costo_orario → 1 righe ma rileggo=0, il valore torna indietro. Causa:…

### La chiave privata e la password dei certificati RENTRI le legge anche un autista

Il certificato con cui l'azienda firma verso RENTRI è leggibile da qualsiasi membro, autisti compresi: chiave privata in chiaro piu password. Con quelli si trasmette a nome dell'azienda. Su questa riga la colonna cifrata (la fase 1 del lavoro di giugno) è vuota: il dato sta ancora in chiaro.

*Prova:* Blocco annullato: 'CERT RENTRI letti dall autista: SCOZZARINI EMMANUEL SALVATORE env=demo chiave_in_chiaro_byte=241 password_presente=true cifrata_byte=0' (seconda riga senza chiave). Policy: «Users can view certificates of their org» = org_id IN (select org_id from org_members where user_id = auth.uid()), nessun ruolo. Nota: 241 byte è una chiave da prova, non una vera — su staging il contenuto è finto, il permesso no.

### La Custodia è costruita e nessun autista la può aprire

Le due schermate del piazzale (disegni 20 e 21, ~380 righe nuove) non compaiono a nessuno. La voce «Custodia» nella barra in basso passa da una lista per autista che non contiene quella parola, e le due pagine del gestionale che scrivono quella lista non la offrono nemmeno: offrono soltanto Trasporti, Demolizioni e Ricambi. Peggio, al salvataggio buttano via qualunque voce che non sia una delle tre — quindi anche scrivendola a mano nel database, il primo salvataggio dell'ufficio la cancella. E dalla home non c'è nessun'altra strada per arrivarci.

*Prova:* SQL su staging: select mobile_modules from staff_drivers where auth_user_id is not null → tutti e 5 rispondono ["transports"] (uno ["transports","demolitions"]); nessuno ha "custodia". Il filtro: RescueMobile/src/hooks/useOrgModules.ts:311 («if (Array.isArray(driverModules) && driverModules.length > 0 && !driverModules.includes(tabKey)) return false»). L'elenco offerto all'ufficio: desktop-app/greeting-friend-api-main/src/pages/DriverMobile.jsx:31-33 e…

### Il controllo versione resta spento: l'indirizzo risponde «non trovato»

Le quattro schermate dell'aggiornamento (disegni 71, 72, 73, 74) sono scritte e montate nel telefono, ma tutte e quattro aspettano una risposta che non arriva: senza quella non si attiva nessuna delle cinque regole. Un telefono con una versione vecchia non viene fermato e non viene avvisato.

*Prova:* curl -s -o /dev/null -w "%{http_code}" https://staging.rescuemanager.eu/api/app-version → 404; stesso comando su https://rescuemanager.eu/api/app-version → 404. Le schermate sono montate: RescueMobile/app/_layout.tsx:225 (SchermoAggiornaOra), :237 (SchermoCosaECambiato), :252 (FoglioAggiornamento), :275 (StrisciaVersioneNuova). Chi chiama l'indirizzo: RescueMobile/src/lib/versione.ts:409.

### Il CLI Supabase di entrambi i repo è agganciato a PRODUZIONE

Un `supabase db push` dato per sbaglio in desktop-app o in website parte verso il database dei clienti, non verso staging. E non spedirebbe una migration: ne tenterebbe centinaia, perché il registro non sa cosa è già stato applicato (voce successiva). Fra quelle c'è almeno un file che fallisce a metà strada.

*Prova:* desktop-app/greeting-friend-api-main/supabase/.temp/project-ref = ienzdgrqalltvkdkuamp e config.toml project_id = "ienzdgrqalltvkdkuamp"; website/supabase/.temp/project-ref e config.toml: identici. ienzdgrqalltvkdkuamp è PROD (così lo nomina desktop-app/.../supabase/da-applicare/staging-05-10-2026.sql:3: «Prima su STAGING (rqwdimgwtewrsintvwoe), poi su PROD (ienzdgrqalltvkdkuamp)»). Nessuno dei due repo è agganciato a uno staging.

### L'autista non si limita a leggere le fatture: le può anche cambiare

La lista dice che un autista «legge» 45 fatture e 32 movimenti. Misurato, con la stessa sessione può anche MODIFICARLE: 45 fatture aggiornabili, 44 righe di fattura cancellabili, 32 movimenti contabili aggiornabili, 6 clienti e 1 veicolo modificabili. Può anche inserire movimenti contabili e fatture nuove. La chiave anon sta nel bundle del telefono: chi la estrae non guarda i soldi dell'azienda, li riscrive. Un numero di fattura cambiato o una riga cancellata non lascia traccia a schermo di chi l'ha fatto.

*Prova:* do $$ ... perform set_config('request.jwt.claims', ...'97c00a8b-d2dd-4bbd-812e-4d3c96f2ee49'...); set local role authenticated; ... raise exception 'ESITO ...' end $$ → ERROR P0001: ESITO inv_select=45 inv_updatable=45 items_deletable=44 acc_updatable=32 clienti_updatable=6 veicoli_updatable=1 is_member=t. Policy: invoices_update USING+CHECK is_member(org_id); invoice_items_delete USING exists(org_members); accounting_entries_insert CHECK…

---

## Media — 25 voci

**L'interruttore della manutenzione, acceso dal pannello, oggi non ferma nessuno: la correzione e' scritta e mai spedita**  
Chi accende la manutenzione dal pannello lo vede passare a ON e non succede niente, su nessuna piattaforma: telefono, desktop e dashboard web continuano a lavorare mentre l'ufficio crede di aver fermato tutto. Il fix esiste in un commit locale che non e' mai arrivato sul remoto, quindi in produzione gira ancora la versione rotta.  
*Prova:* In website: `git log --oneline origin/main..HEAD` → due commit non spediti, il primo e' f55d93ff «sito: l'interruttore della manutenzione ora funziona davvero». `curl https://rescuemanager.eu/api/maintenance/status` → HTTP 200…

**La catena della versione e' inerte, e non basta il deploy: i due commit del sito non sono mai stati spediti**  
Nulla, oggi: tutto fallisce aperto e l'autista entra. Ma la policy non arriva a nessun telefono, e la scheda «App telefono» del pannello salva in un posto che non esiste. La lista dice «deploy del sito»: il passo prima e' il push, perche' la route non e' su origin/main — e' solo in un commit locale.  
*Prova:* `curl .../api/app-version?platform=ios&versione=1.1.0&current=1.1.0` → HTTP 404 (text/html) sia su rescuemanager.eu sia su staging.rescuemanager.eu. In website: `git rev-list --left-right --count origin/main...HEAD` → `0 2`; `git log…

**Il tipo di intervento che l'autista ha scelto esce come codice sul foglio che va al cliente**  
Su un soccorso a listino di un committente l'autista scegliendo la voce vede l'etichetta giusta a schermo, ma il telefono salva solo la chiave. Sulla scheda del gestionale e sul PDF che va al cliente e alla compagnia, alla riga «Tipo di intervento», esce il codice ripulito — «Prog km», «V3» — invece del nome della prestazione. E'…  
*Prova:* Il telefono scrive `service_data.tipo_intervento` (RescueMobile/src/components/transport/NuovoTrasportoWizard.tsx:658) e `grep -rn tipo_intervento_label src app` in RescueMobile non trova niente. Il gestionale legge…

**«Di che azienda e' questo utente» e' scritta due volte, e le due copie guardano tabelle diverse — lo stesso difetto che ufficio.ts era nato per chiudere**  
Oggi niente, e l'ho misurato. Ma il controllo dell'abbonamento e il numero dell'ufficio rispondono alla stessa domanda con due catene diverse: un autista che ha la riga in `staff_drivers` e non ha riga in `org_members` ne' `profiles.org_id` viene trovato dalla prima copia e non dalla seconda — e quando la seconda non trova l'azienda…  
*Prova:* RescueMobile/src/lib/ufficio.ts:52 guarda tre posti in ordine (staff_drivers → org_members → profiles) e lancia su ogni `.error`. RescueMobile/src/lib/abbonamento.ts:122 ne guarda due (org_members → profiles, in Promise.all) e non legge…

**Il registro delle modifiche è aperto all'autista: 590 righe, 528 copie di fatture**  
Anche chiudendo le fatture resterebbe questa seconda porta: audit_log conserva il prima e il dopo di ogni modifica, e dentro ci sono le fatture intere. Chi stringe solo la tabella invoices non si accorge che la copia è altrove.  
*Prova:* Blocco annullato: 'AUDIT LOG righe=590, tabelle: invoices=528 | transports=30 | drivers=24 | clients=8'. 390 righe contengono la parola iban (controllato: è il blocco pagamento SDI della fattura, in questi casi col valore vuoto). Policy…

**Le letture larghe: 14 tabelle che si accontentano di «sono dell'azienda»**  
La lista ne nomina due (fatture e contabilità). Misurate tutte, con la stessa sessione: fatture 45, righe fattura 44, contabilità 32, piano dei conti 124, clienti 6, preventivi 1, listini 1, autisti 5, autisti vecchia tabella 9, anagrafiche utenti 8, ricambi 58, membri 9, certificati RENTRI 2, registro modifiche 590. È una sola forma di…  
*Prova:* Blocco annullato con 42 tabelle in fila: 'invoices=45 | invoice_items=44 | accounting_entries=32 | chart_of_accounts=124 | clients=6 | quotes=1 | price_lists=1 | staff_drivers=5 | drivers=9 | profiles=8 | spare_parts=58 | org_members=9 |…

**Il controllo versione risponde 404 anche seguendo i reindirizzamenti**  
Confermata la voce 3, e verificata meglio: su prod il primo tentativo dava 308 (www che rimanda), ma seguendo il reindirizzamento arriva 404 come su staging. Tutta la catena resta spenta e la scheda del pannello scrive dove nessuno legge.  
*Prova:* curl -sL -w '%{http_code}': https://rescuemanager.eu/api/app-version?platform=ios&version=1.0.0 → 404 (corpo: la pagina HTML del sito); www.rescuemanager.eu → 404 dopo il redirect; staging.rescuemanager.eu?platform=android → 404.

**Le notifiche Android: il file c'è ed è cablato, ma solo per il pacchetto di produzione**  
La lista dice «FCM non è configurato, serve google-services.json su EAS». In parte è vecchia: il file c'è nel progetto e il config lo usa. Quello che manca è l'incastro dei nomi: il file registra com.rescuemanager.mobile, cioè solo la build di produzione; staging e sviluppo aggiungono .staging e .dev, e per quelli non esiste voce. Quindi…  
*Prova:* RescueMobile/google-services.json esiste (694 byte), package_name = com.rescuemanager.mobile. RescueMobile/app.config.js:143 googleServicesFile: './google-services.json'; righe 17-19: BUNDLE_BASE='com.rescuemanager.mobile', bundleSuffix =…

**L'interruttore dei prezzi e quello dei turni non si accendono da nessuna parte**  
Il telefono legge due decisioni dell'azienda da una riga che nessuno può scrivere: non c'è nessun campo né nel gestionale né nel pannello. Conseguenze: 1) i prezzi restano accesi per sempre — la voce «interruttore d'azienda per i prezzi» che la lista dà per chiusa non è azionabile, un autista dipendente vedrà sempre gli importi; 2) i…  
*Prova:* SQL su staging: select key, count(*) from org_settings group by key → 22 chiavi, nessuna è 'mobile'. La tabella c'è: select from information_schema.tables → driver_shifts esiste (7 colonne), 0 righe. Chi la legge:…

**I testi delle notifiche non sono stati rifatti, e le notifiche finiscono nel canale sbagliato**  
L'autista riceve ancora «Nuovo trasporto assegnato» senza la targa, con il puntino di separazione e il «Da:»/«A:» che il disegno vieta. E il messaggio non dice a quale canale appartiene, quindi su Android entra nel canale generico invece di quello «Trasporti» a importanza alta: il canale è stato creato nel telefono e nessuno lo usa,…  
*Prova:* website/src/app/api/notify/transport-assigned/route.ts:169-172 (i quattro titoli vecchi), :176 («tr.customer_name ? `· ${tr.customer_name}` : null»), :177-178 («\nDa: » e «\nA: »), :84 (la select non chiede `meta`, dove sta la targa),…

**Chi demolisce apre l'app e vede la schermata del soccorso**  
Il disegno 50 è una home diversa per gli autodemolitori: pratiche da continuare, scadenza bonifica, azioni rapide (Scansione AI, Stato rapido, Nuovo ricambio, Cerca un pezzo), ricambi inseriti oggi. Non esiste. La home è solo quella del soccorso: «Adesso», «Dopo», posizione cliente. Chi lavora in autodemolizione apre l'app e la prima…  
*Prova:* grep -n "useOrgModules|demoliz|pratic|vfu|ricambi" 'RescueMobile/app/(tabs)/index.tsx' → nessun risultato: la home non sa nemmeno quali moduli ha l'azienda. Le sue sole sezioni: index.tsx:192 («Adesso») e :227 («Posizione cliente»).…

**Dodici schermate disegnate hanno ancora il vestito vecchio: demolizioni e ricambi**  
I disegni 51-56 (pratiche, pratica, accettazione, bonifica, scansione AI, stato rapido) e 60-64 (magazzino, scheda ricambio, i tre passi del nuovo ricambio) hanno un'implementazione, ma è quella di prima: colori che il kit vieta, scritte sotto i 12 px che in strada non si leggono, etichette in maiuscoletto spaziato. Dell'intero restyling…  
*Prova:* git log --since=2026-10-05 -- 'app/(tabs)/demolizioni/' 'app/(tabs)/spare-parts/' → un solo commit, cabaa13 «la rotella del design al posto di tutti gli ActivityIndicator», 17 file e 66 righe aggiunte in tutto. Colori vietati: grep -rniE…

**Un autista può aprire, chiudere e cancellare il turno di un collega**  
Appena i turni si accendono, un autista col suo telefono può timbrare al posto di un collega, chiudergli il turno e cancellarglielo. Le ore di servizio di tutti diventano riscrivibili da chiunque in azienda abbia l'app, e non resta traccia di chi l'ha fatto: l'ufficio vede orari che non tornano e non ha modo di sapere perché. Oggi non fa…  
*Prova:* Blocco do$$ con l'identità di Marco Sotto (auth_user_id b538a773-12de-4741-93f5-0695b10570f1, staff_drivers.id 16) su staging, dentro transazione annullata. Primo blocco, risposta: «ESITO || INSERITO turno per il COLLEGA id=2 ->…

**La funzione turni non si può accendere da nessuna parte, e nemmeno spegnere i prezzi**  
L'interruttore che decide turni e prezzi è una riga di org_settings con key='mobile'. Il telefono la LEGGE, ma nessun programma la SCRIVE: non il gestionale, non il pannello, non il sito. Quindi i turni restano spenti per sempre (il valore di serie è false) e l'azienda con autisti dipendenti NON può nascondere loro gli importi, benché la…  
*Prova:* Su staging: «select count(*) from org_settings where key='mobile'» → 0 righe; «select count(*) from driver_shifts» → 0. Lato lettura c'è tutto: RescueMobile/src/hooks/useImpostazioniMobile.ts:51 legge .eq('key','mobile') e la riga 40 fissa…

**Il registro delle migration non sa niente di quello che è stato applicato a mano**  
Nessuno può più dire, guardando il database, cosa è stato applicato e cosa no: il registro e le cartelle sono due mondi separati. Chi arriva deve misurare oggetto per oggetto, come ho fatto io. E uno strumento automatico che si fidasse del registro ritenterebbe tutto.  
*Prova:* list_migrations su staging rqwdimgwtewrsintvwoe → 22 righe, la più recente 20261001122757 enable_rls_sdi_progressivo. Le cartelle contengono 237 file (11 in supabase/migrations, 43 in website/supabase/migrations, 183 in…

**Sette file dicono «SCRITTA E NON ESEGUITA», ma sono già applicate**  
Chi legge il file crede che una protezione non ci sia e la riapplica, o peggio progetta come se il buco fosse aperto. Il caso serio è il contrario: 20261006d chiude la lettura di org_settings all'autista ed È ATTIVA su staging, ma il suo file dice di no — qualcuno potrebbe «risolverla» una seconda volta, o credere ancora leggibili IBAN e…  
*Prova:* Intestazioni (grep -rliE "NON ESEGUITA|DA APPLICARE|..."): 20261006_turni_autista.sql:5, 20261006_autista_colonne_sue.sql:5, 20261006b:5, 20261006c:6, 20261006d:5, 20261006f:6, e i tre 20260924*:2. Schema reale su staging: driver_shifts…

**I vincoli contro i doppioni non ci sono, e oggi passerebbero puliti**  
Nessuna rete sul database: due schede cliente con la stessa partita IVA, o due mezzi con la stessa targa, entrano ancora. L'avviso nell'app si può ignorare e non copre chi scrive da altre strade (import, pannello, API). La buona notizia: il timore che gli indici falliscano sui doppioni, su staging, non si avvera.  
*Prova:* Dei 5 oggetti di desktop-app/.../migrations/20260924_vincoli_doppioni.sql, su staging ce n'è ZERO: IDX ux_clients_org_piva 0, ux_clients_org_tax_code 0, ux_vehicles_org_targa 0, CON chk_rentri_movimenti_quantita 0 (e…

**La fattura atomica è installata e nessuno la chiama**  
Niente è cambiato per l'utente: l'app continua a scrivere testata e righe con due insert separati, quindi una caduta di rete lascia ancora una fattura numerata senza righe (e il numero successivo bruciato), o svuota in modifica una fattura già emessa. Le funzioni che risolverebbero il problema esistono sul database da giorni, ferme.  
*Prova:* Su staging FN rpc_invoice_create 1 e rpc_invoice_update 1 (presenti). Chiamanti: grep -rlnE "rpc_invoice_(create|update)" su tutto il workspace → due soli file, ed entrambi sono SQL:…

**La partita doppia ha la colonna e il controllo di quadratura, ma zero righe collegate**  
Anche questo è inerte. Le due gambe di ogni registrazione restano slegate: aprendo una riga in modifica non si trova la compagna, si cambia un importo e i conti si sbilanciano senza che niente avvisi; cancellandone una, l'altra resta orfana. Il trigger che dovrebbe impedirlo non scatta mai, perché scatta solo su chi scrive il gruppo — e…  
*Prova:* Su staging: COL accounting_entries.entry_group_id presente, IDX idx_accounting_entries_group presente, FN chk_registrazione_quadra 1, TRG trg_registrazione_quadra 1. Riempimento: «count(*) filter (where entry_group_id is not null) /…

**Su Android la schermata che blocca l'app non ha una via d'uscita: «Aggiorna» porta al login del sito**  
La schermata 71 prende il posto dell'app e lascia tre tasti: «Aggiorna da Google Play», «Chiama l'ufficio», «Controlla di nuovo». Su Android l'indirizzo dello store non è Google Play: la route lo costruisce come <host>/download, e /download sul sito rimanda a /dashboard/download, che chiede il login del gestionale. L'autista non ha un…  
*Prova:* curl -sL -o /dev/null -w '%{url_effective}' https://rescuemanager.eu/download → https://rescuemanager.eu/login?redirect=%2Fdashboard%2Fdownload (308 poi 307). curl https://rescuemanager.eu/api/app-release/latest → "android": null.…

**«Crea bozza fattura» nel telefono scrive su tre colonne che non esistono**  
Nel modulo Demolizioni il passo Fatturazione ha un tasto che inserisce una fattura con `client_name`, `description` e `status`. La tabella `invoices` non ha nessuna delle tre: ha `customer_name`, `payment_status`, `sdi_status`, e niente `description`. L'inserimento quindi non riesce MAI, e a schermo compare il messaggio tecnico di…  
*Prova:* app/(tabs)/demolizioni/steps/fatturazione.js:60-67 `supabase.from('invoices').insert({ org_id, client_name: ownerName, description: ..., status: 'draft', demolition_case_id, meta })`. SQL: select string_agg(column_name...) from…

**Due cose fatte senza rete vengono dichiarate salvate e non partono mai**  
I tre tap del piazzalista (Ricevuto/Bonificato/In deposito) e le foto VFU, se non c'è campo, finiscono in coda come `demolition_case` e `vfu_attachment`. Ma i gestori registrati sono solo due, `transport` e `transport_media`. Senza gestore la coda marca la voce «non riuscita» con scritto «aggiorna l'app e riprova» — un messaggio falso,…  
*Prova:* src/lib/vfu-quick-status.ts:61 `queueMutation('update','demolition_case',...)`, :119 e :146 `queueMutation('create','vfu_attachment',...)`. src/hooks/useOfflineQueue.ts:42-84: l'oggetto passato a setupOfflineQueueListener ha SOLO le chiavi…

**Sessione scaduta a metà intervento: l'app lo butta fuori senza dire perché, e la coda si stacca**  
Quando la sessione muore, `onAuthStateChange` porta `session` a null e il guardiano fa `router.replace('/welcome')`: l'autista, in mezzo a un intervento, si ritrova sulla schermata di benvenuto senza una riga che spieghi cosa è successo né dove è finito il lavoro appena fatto. Peggio: il consumatore della coda offline (`useOfflineQueue`)…  
*Prova:* app/_layout.tsx:305-315 (onAuthStateChange → setSession) e :348-351 `} else if (!isAuthed && (inTabsGroup || top === undefined)) { console.log(...); router.replace('/welcome'); }` — nessun messaggio. src/components/app/AppBootstrap.tsx:38…

**Un autista può prendersi il trasporto di un collega, e le due regole scritte per impedirlo sono lettera morta**  
Sulla tabella trasporti ci sono tre regole di scrittura: due strette, fatte per l'autista (`solo se driver_id è vuoto`, `solo se è mio`), e una larga, `is_member(org_id)`. In Postgres le regole permissive si sommano con un OR: quella larga vince sempre, e le due strette non servono a niente. Misurato, per l'autista is_member è vero.…  
*Prova:* pg_policy su public.transports: transports_update, cmd=UPDATE, permissive, USING e CHECK = is_member(org_id) — senza condizione su driver_id; accanto transports_driver_claim (USING driver_id IS NULL) e transports_driver_update_own.…

**Una modifica salvata senza rete riscrive l'intero `meta` con una copia vecchia**  
L'arrivo sul posto e l'annullamento scrivono dentro `meta`, e lo fanno ricostruendo tutto il blocco dalla copia che l'app aveva in mano. Online non è un problema: la schermata foto rilegge `meta` fresco un attimo prima di scrivere, proprio «per non distruggere campi scritti nel frattempo, es. meta.signature_otp, il sigillo legale OTP».…  
*Prova:* src/lib/tempiIntervento.ts:100-106 `patchSulPosto` costruisce `meta: { ...(trasporto?.meta || {}), tempi: {...} }` dalla copia locale, e :148 `await queueMutation('update','transport',{ id, ...patch })`.…


---

## Bassa — 29 voci

**I km delle tappe non tornano all'ufficio: il preventivo perde quei tratti**  
Il telefono calcola i km veri passando per le tappe (OSRM) e li usa per il prezzo, poi non li salva da nessuna parte: nel carico finisce `{address, coords}` e nessun km. Quando l'ufficio riapre quel trasporto per prezzarlo, i km delle…  
*Prova:* RescueMobile/src/components/transport/NuovoTrasportoWizard.tsx:700-703 costruisce le tappe come `{ address, coords }`; il carico che esce (:732-745) non ha nessun campo di…

**927 righe in src/ che nessuno raggiunge, due delle quali sono la vecchia versione di cose che il wizard ora fa per conto suo**  
Niente a schermo. Il guaio e' che `StopsList.tsx` documenta la forma GIUSTA di `meta.stops` (`{ address, label, km_from_prev }`, «allineato al desktop») e sta li' spento mentre il wizard scrive un'altra forma: il file che sapeva la…  
*Prova:* Grafo degli import risolto con uno script node (alias `@/` + index di cartella, ogni file sotto app/ trattato come punto d'ingresso expo-router): 10 file in src/ che nessuno…

**25 file .js, 12.375 righe, che tsc non guarda: fra loro il profilo, il login e il layout dei tab**  
Niente adesso — ho controllato i punti di contatto e reggono. Ma su quelle 12.375 righe un campo rinominato o una prop sbagliata non si vede al controllo: si vede sul telefono. E sono proprio i file che toccano i flussi nuovi:…  
*Prova:* tsconfig.json: `include` e' solo `**/*.ts`, `**/*.tsx`, `nativewind-env.d.ts`, e `allowJs` non c'e'. `tsc --noEmit --listFiles | grep -v node_modules` → 132 file, nessuno .js.…

**I log di debug del gate sono rimasti nel layout di radice**  
A ogni cambio di schermata l'app stampa nel log del telefono i segmenti della rotta e se la sessione e' autenticata. Il commento accanto dice che servivano a diagnosticare un ciclo di redirect, cioe' erano temporanei.  
*Prova:* RescueMobile/app/_layout.tsx:336 `console.log('[GATE]', { segments, top, isAuthed, isAlwaysOpen, isGuestOnly, inTabsGroup })`, piu' :340, :345, :349. In tutto src/ e app/ ci sono…

**Un tipo esportato che nessuno usa, dentro ne' fuori**  
Niente. Lo segnalo perche' e' l'unico export davvero morto fra i file nuovi: tutti gli altri che sembravano morti sono usati dentro il loro file, e li ho verificati uno per uno.  
*Prova:* `grep -rnw VerdettoVersione src app website` → una sola riga, RescueMobile/src/lib/versione.ts:156 `export type VerdettoVersione = Verdetto;`.

**La versione installata e' letta in tre copie con tre ripieghi diversi**  
Probabilmente niente: due delle tre copie servono solo a scrivere un numero a schermo, e un ripiego diverso li' e' difendibile. Lo marco incerto perche' non ho potuto provare su una build vera se `Constants.expoConfig` risponde sempre: se…  
*Prova:* Tre letture della stessa cosa: src/lib/versione.ts:208 (`versioneInstallata()`, ripiego `null`), src/components/app/ErrorBoundary.tsx:120 (ripiego `'?'`),…

**In system_settings non esiste nessuna delle due chiavi del telefono**  
Su staging non c'e' ne' `mobile_update_policy` (la policy che il pannello salva) ne' `mobile_app_store_url`. Le uniche chiavi di rilascio sono quelle del desktop, ferme alla 2.4.3 del 28 maggio. Quindi: il link allo store esce dai tre…  
*Prova:* select key, left(value::text,160), updated_at from public.system_settings where key ilike '%mobile%' or key ilike '%app_update%' or key ilike '%release%' or key ilike '%store%' ->…

**L'AdminPanel non ha un ramo principale sul remoto: solo rami di lavoro**  
Su Hydr44/AdminPanel esistono soltanto feat/cobat, feat/crm-lead-cockpit e snapshot. Non c'e' main. La scheda «App telefono» e' su feat/cobat e non e' pubblicata; e non c'e' un posto dove portarla, perche' il posto non esiste. Fino a…  
*Prova:* git -C admin-panel ls-remote --heads origin -> refs/heads/feat/cobat 9c6fc08, refs/heads/feat/crm-lead-cockpit d80ebba, refs/heads/snapshot 5eb75b3 (nessun refs/heads/main); git…

**Le tariffe dei privati: non e' un permesso che manca, e' codice che non c'e'**  
L'autista PUO' leggere il listino: la policy su price_lists e' `is_member(org_id)` e con la sua sessione legge 1 listino su 2 (l'altro e' di un'altra azienda). Il buco e' che l'app non lo chiede mai: in tutto RescueMobile/src non esiste…  
*Prova:* do $$ ... set_config(sub=autista) ... $$ -> «ESITO price_lists(autista)=1 price_list_items(autista)=0»; totale price_lists=2; pg_policies -> price_lists_org_members ALL…

**Il file google-services.json c'e' ed e' pubblicato: la causa scritta nella lista e' sbagliata**  
La lista dice che le push Android sono spente perche' manca google-services.json su EAS. Il file e' tracciato in git dal 7 agosto, c'e' anche nel commit pubblicato, ed e' agganciato nel telaio (package com.rescuemanager.mobile, progetto…  
*Prova:* git -C RescueMobile ls-files google-services.json -> tracciato; git check-ignore -> non ignorato; git cat-file -e 7c36c5e:google-services.json -> presente nel commit pubblicato;…

**Cinque aziende su otto non hanno il numero dell'ufficio (confermato)**  
Dove orgs.phone e' vuoto il tasto «Chiama l'ufficio» non compare, e quel tasto e' l'uscita delle schermate che fermano l'app: l'autista legge «avvisa l'ufficio» e non ha come farlo. Il travaso e' stato applicato, il buco che resta sono i…  
*Prova:* select count(*) from public.orgs -> 8; select count(*) where phone is null or btrim(phone)='' -> 5

**Anche la lista e i documenti non sono pubblicati: il workspace e' 8 commit avanti**  
Il file con cui stiamo decidendo cosa viene prima e' committato ma non spinto, come tutto il resto. Chi non sta davanti a questo Mac non lo vede: ne' la lista, ne' le migration scritte e non eseguite che stanno nello stesso ramo.  
*Prova:* git rev-parse --abbrev-ref HEAD -> fix/soccorso-registro-difetti; git rev-list --count origin/fix/soccorso-registro-difetti..HEAD -> 8; git log -1 --…

**La vista che doveva nascondere il costo orario non esiste, e l'app non ne ha bisogno**  
Confermo la voce 2 della lista, con una precisazione che cambia la fretta: in public ci sono due viste in tutto, nessuna sugli autisti. Ma l'app non chiede mai quella colonna — elenca i campi a mano — quindi a schermo il costo orario non…  
*Prova:* select table_name from information_schema.views where table_schema='public' → latest_driver_locations, yard_vehicles_view. RescueMobile/src/lib/profilo.ts:188 seleziona 'id, nome,…

**Il tariffario dei privati: confermo che il telefono non lo guarda nemmeno**  
Confermata la voce 6: per un intervento su privato il prezzo non ha da dove uscire. Non è che legga la tabella sbagliata — non la cerca affatto.  
*Prova:* grep -rn 'transport_presets_soccorso|tariffario' RescueMobile/src → nessun risultato. La tabella esiste su staging con 1 riga ed è leggibile dall'autista (misurato:…

**Il numero dell'ufficio: 5 aziende su 8 non l'hanno, ma nessuna di quelle ha autisti**  
La voce 4 della lista è vera nei numeri e troppo severa nelle conseguenze: oggi, su staging, nessun autista si trova senza il tasto «Chiama l'ufficio», perché l'unica azienda con autisti il numero ce l'ha. Resta una cosa da sistemare per…  
*Prova:* select count(*) from orgs → 8; con phone vuoto → 5; con autisti E phone vuoto → 0.

**Il link allo store non è in system_settings**  
Confermata la voce 7: il valore resta scritto a mano in tre posti.  
*Prova:* select count(*) from system_settings where key='mobile_app_store_url' → 0. Le 17 chiavi presenti: registration_enabled, trial_days, default_plan, maintenance_enabled,…

**Le cinque schermate d'ingresso sono rimaste quelle vecchie**  
I disegni 01-05 (scelta dell'accesso, email e password, codice dell'ufficio, primo accesso, consenso posizione) hanno un'implementazione, ma è la prima cosa che l'autista vede e non è nella grammatica del kit: angoli arrotondati e sfondi…  
*Prova:* Angoli non a zero: WelcomeScreen.tsx (6), QRPairingScreen.tsx (9), GPSConsentScreen.tsx (7), ForcePasswordScreen.tsx (3), app/login.js (6) — in tutto 31, per esempio…

**La finestra di conferma ha colori suoi, e si apre sopra ogni schermata rifatta**  
Ogni domanda dell'app («vuoi annullare?», «esci?») passa da una sola finestra, e quella finestra ha sei colori diversi da quelli del kit — pannello, bordo, testo, grigio, blu e rosso. Si apre sopra le schermate rifatte, quindi lo stacco si…  
*Prova:* RescueMobile/src/lib/rm-alert.tsx:32-39: card '#121A2B' (il kit: #141C27), border '#1F2A40' (#243044), text '#ECF1F8' (#E2E8F0), muted '#7C8AA3' (#94A3B8), primary '#2B7FF6'…

**Il carattere del disegno non viene caricato: l'app scrive col font del telefono**  
Tutte le misure del disegno (titolo 24, corpo 15, seconda riga 13) sono calcolate su Inter. L'app non lo carica mai, quindi scrive col carattere di sistema: su iPhone San Francisco, su Android Roboto. Le larghezze non tornano — ed è la…  
*Prova:* Il token esiste e non è usato da nessuno: RescueMobile/src/design/tokens.ts:155-156 (FONT.sans = 'Inter'); grep -rn 'FONT\.' app src → solo FONT.mono, mai FONT.sans. Nessun…

**«Metti in custodia» non c'è: il piazzale si può solo guardare**  
Il disegno 22 (ingresso in piazzale) non ha implementazione, e con lui mancano «Sposta» e «Fai uscire» della scheda veicolo. Un veicolo entra in custodia solo se qualcuno lo scrive dal gestionale: dal telefono non si può registrare…  
*Prova:* RescueMobile/app/(tabs)/custodia/index.tsx:178-182: «Nota per chi continua: il tasto «Metti in custodia» del design sta in fondo alla schermata ... Non e' qui perche' scrive, e la…

**La barra in basso può arrivare a sei voci**  
Il kit dice al massimo cinque voci, e per l'azienda che ha tutto scrive esattamente quali: Oggi, Trasporti, Demolizioni, Ricambi, Profilo — con la custodia che si apre dalla home. Nel codice non c'è nessun tetto: con tutti e quattro i…  
*Prova:* RescueMobile/app/(tabs)/_layout.js:154-227: sei Tabs.Screen (index, transports, demolizioni, spare-parts, custodia, profile), ciascuno visibile o nascosto da sé, senza nessun…

**Una pagina vecchia è rimasta aperta e raggiungibile**  
C'è una seconda copia della pagina «condizioni + firma», col vestito di prima (18 angoli arrotondati). Dall'app non ci si arriva — nessun tasto la apre — ma resta registrata fra le pagine, quindi un collegamento diretto la apre ancora. Se…  
*Prova:* RescueMobile/app/consent.js:38 (export default TransportConsent, con SignatureCanvas come app/transport-firma.js). Nessuna navigazione: grep -rn "'/consent'" app src → nessun…

**Il blu vecchio, il grigio vecchio, un verde e un viola sopravvivono nei pezzi condivisi**  
Il kit ammette un solo blu e vieta verde, giallo e viola. Il blu di prima e il grigio di prima sono ancora dentro i mattoni comuni (campi, tendine, interruttori, schede), quindi ricompaiono anche nelle schermate rifatte che li usano. E il…  
*Prova:* Il viola, vietato per nome: RescueMobile/src/components/transport/NuovoTrasportoWizard.tsx:194-196 — '#2DD4BF' (verde-acqua), '#F87171' (un secondo rosso), '#A78BFA' (viola). Il…

**La migration 20260318 non si può eseguire: fallisce sulla prima policy**  
È una mina nella cartella. Chi la esegue — a mano o con un db push, che da entrambi i repo punta a prod — si ferma a metà: le quattro policy su transports leggono una colonna che non esiste. Se qualcuno la «aggiustasse» e la portasse in…  
*Prova:* supabase/migrations/20260318_transports_rls_audit.sql:13-60, quattro CREATE POLICY con «org_id = (SELECT org_id FROM auth.users WHERE id = auth.uid())». Misurato su staging:…

**Cinque aziende su otto non hanno il numero dell'ufficio**  
Dove orgs.phone è vuoto, il tasto «Chiama l'ufficio» non compare — ed è il tasto principale delle schermate bloccanti: l'autista legge «avvisa l'ufficio» e non ha come. Il travaso automatico non aiuta più: su staging ha finito il lavoro…  
*Prova:* Su staging, join orgs con org_settings key='company': 5 org su 8 hanno orgs.phone vuoto (autodem test, Azienda Test S.r.l., E2E Org, Rescuetest, Test Demo SRL) e nessuna delle…

**Lo staging di cui parlano i file non è sempre quello a cui si parla**  
«Applicata su staging» non vuol dire niente finché non si dice quale. Un file manda a un progetto, lo strumento ne interroga un altro: una verifica può tornare verde su un database e rossa su quello che si intendeva.  
*Prova:* I file nominano tre ref. rqwdimgwtewrsintvwoe (quello a cui sono collegato) compare in 9 punti, fra cui da-applicare/staging-05-10-2026.sql:3 e…

**Il secchio delle foto non esiste sul Supabase a cui punta il build di staging**  
L'app carica le foto dell'intervento nel bucket `transport-photos`. Su quel progetto esiste un solo bucket, `company-assets`. Quindi ogni foto fallisce con «Bucket not found» — che NON somiglia a un errore di rete, quindi non va in coda:…  
*Prova:* select id, name, public from storage.buckets → una sola riga: company-assets. app.config.js:29-31: APP_ENV=staging → https://rqwdimgwtewrsintvwoe.supabase.co, che è lo stesso…

**Se l'ufficio cancella il trasporto mentre l'autista è sul posto, la scheda resta a «Carico il trasporto» per sempre**  
Ogni cambio di stato, la nota, l'arrivo sul posto e l'annullamento passano da `updateField`, che scrive e poi fa `setItem(data)`. Se la riga non c'è più, PostgREST non dà errore: torna `data = null`. L'app mette `null` dentro `item`, e il…  
*Prova:* app/(tabs)/transports/[id].js:428-431 `const { data, error } = await supabase.from("transports").update(patch).eq("id", item.id).select().maybeSingle(); if (error) throw error;…

**La voce 4 della lista (numero dell'ufficio mancante) è messa troppo in alto: oggi non colpisce nessuno**  
La lista la mette quarta fra i buchi «in ordine di quanto fanno male» e dice che l'autista legge «avvisa l'ufficio» senza avere come. Il numero vero è un altro: 5 aziende su 8 sono senza telefono, ma l'UNICA azienda che ha autisti ce l'ha.…  
*Prova:* select count(*), count(nullif(trim(coalesce(phone,'')),'')) ... from orgs → org_totali=8, con_telefono=3, senza_telefono=5, org_con_autisti=1, org_con_autisti_senza_telefono=0.


---

## Chiusi — e per chi

La distinzione che l'esame ha reso necessaria: **chiuso nel codice** non è
**arrivato alle persone**. Quasi tutto quello che segue vive su un Mac.

| Buco | Chiuso da | Arrivato ai clienti |
|---|---|---|
| Un autista rimosso dal gestionale entrava ancora, e vedeva tutti i trasporti | `src/lib/accesso.ts` (commit `2725a48`) | **no** — dentro i 50 commit non spinti |
| «In dubbio lascia passare» era scritto solo nel commento: senza campo l'autista veniva chiuso fuori | `postgrest-js` non lancia, l'errore si legge (`e0896f2`) | **no** |
| L'autista poteva riscriversi tutta la riga di anagrafica | trigger v4, allow-list dei ruoli + `pg_trigger_depth()` | **sì**, applicato su prod |
| `org_settings` leggibile per intero, IBAN e password RVFU compresi | `is_org_ufficio(org)` + policy (20261006d) | **sì**, applicato su prod |
| Il navigatore diceva «non ci sono le coordinate» con le coordinate caricate | leggeva solo i parametri, non il trasporto | **no** |
| I prezzi: l'autista li vedeva sempre | interruttore d'azienda, preimpostato acceso | **no**, e l'interruttore non si può nemmeno scrivere (voce in Media) |
| Un autista poteva entrare nel gestionale | `RequireAuth.jsx`, schermata «Questo è il programma dell'ufficio» | **no** — il commit è su un ramo locale, il feed è fermo alla 2.4.17 del 6 agosto |
| Abbonamento scaduto: l'app non si fermava | `src/lib/abbonamento.ts` + `SchermoAziendaFerma` | **no** |
| Il numero dell'ufficio letto da due copie che guardavano tabelle diverse | una copia sola in `src/lib/ufficio.ts` | **no** |
| La banda della versione finiva sotto la striscia della manutenzione e non si poteva più chiudere | una riga alla volta (`src/lib/avvisoManutenzione.ts`) | **no** |
| La stessa domanda «di che azienda è questo utente» ancora sdoppiata in `abbonamento.ts` | `trovaAzienda` esportata e condivisa (`4bb567d`) | **no** |

Le due righe con «sì» sono le sole il cui effetto esiste fuori da qui, e sono
entrambe sul database. Tutto il resto è codice che aspetta il passo 0.

---

## Le 4 smentite — non riaprirle

**Il numero di versione del telefono non e' stato alzato: una nuova build sarebbe ancora 1.1.0**  
Il fatto e' vero, la conseguenza no — e si contraddice con la voce 1. Fatto: RescueMobile/app.config.js:68 -> version: '1.1.0'; `git show 2095a21 -- app.config.js | grep '^[+-].*version'` -> nessuna riga, quindi il commit del 5 ottobre non ha toccato il valore; app.config.js:84 e :144-145 confermano che buildNumber/versionCode li fa EAS e `version` resta a mano. Ma la 1.1.0 non e' MAI uscita: l'App Store e' alla 1.0.4 (voce 1), `git -C RescueMobile tag --list` e `git ls-remote --tags origin` -> nessun tag, e eas.json submit.production.android.track -> 'internal'. Quindi una build 1.1.0 oggi…

**«Il tuo carro» nel profilo non comparirà a nessuno**  
SMENTITA: la prova misura i dati di prova di staging, non il prodotto. Vero che `select count(*), count(driver_id), count(vehicle_id) from gps_devices` → 2, 2, 0 e che entrambe sono device_type='mobile_app' con vehicle_id null. Ma questo dice soltanto che su un database di test nessuno ha compilato il campo. Il meccanismo nel gestionale è COMPLETO e funzionante, l'ho letto: desktop-app/greeting-friend-api-main/src/components/settings/GpsTrackingSettings.jsx ha nello stesso modulo la tendina «Mezzo» (righe 799-803, popolata da `supabase.from('vehicles')` alla riga 160) E la tendina «Autista»…

**Il travaso del numero ufficio: non so dire se è stato eseguito su staging**  
SMENTITA: è decidibile, e il dato discrimina. Il discriminante è updated_at, che la voce non ha guardato pur avendo elencato `update_orgs_updated_at` fra i trigger di orgs nella voce 10. Misurato: le DUE sole org che soddisfano il WHERE della migration (company->>'phone' non vuoto) hanno entrambe orgs.updated_at = 2026-10-06 13:24:19.084683+00, identico al microsecondo — cioè scritte da un UNICO statement, oggi. Il loro org_settings(company).updated_at è 2026-05-27 18:54:31 e 2026-06-10 15:00:25: 131 e 117 giorni PRIMA. Le altre sei org sono intonse, con updated_at tutti diversi fra…

**Il tasto «Elimina trasporto» non elimina niente, e lo schermo si chiude come se avesse funzionato**  
SMENTITA nel meccanismo: l'eliminazione RIESCE DAVVERO. Chi ha scritto il rilievo ha letto solo transports_delete e si è fermato lì. Su public.transports c'è una SECONDA policy permissiva, demo_data_isolation_transports, con cmd=ALL — quindi vale anche per DELETE — e le permissive si sommano in OR. L'ho provato senza scrivere, con EXPLAIN (verbose, costs off) DELETE dentro la sessione dell'autista: Filter: ((is_org_admin(transports.org_id) OR (transports.is_demo = (SubPlan 2))) AND (is_member(transports.org_id) OR (transports.is_demo = (SubPlan 4)))). Il congiunto demo è vero: la sottoquery…

---

## Il metodo, perché conta

Tre delle quattro smentite nascono dallo stesso errore: **guardare una policy e
fermarsi**. In Postgres le policy permissive si sommano in **OR**, quindi una
seconda regola larga annulla la prima stretta. È così che «Elimina trasporto non
funziona» era falso (c'era `demo_data_isolation_transports` con `cmd=ALL`), ed è
così che su `transports` le due regole scritte per legare l'autista al suo
trasporto sono lettera morta.

La regola da tenere: su qualunque cosa tocchi i permessi, **contare tutte le
policy permissive** e provarle con un blocco che si annulla da sé, prima di
dichiarare qualcosa aperto o chiuso.
