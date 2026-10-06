# App telefono — i buchi, e quali sono ancora aperti

Stato al 6 ottobre 2026. Ogni voce aperta dice **cosa si rompe per l'autista**, non
solo cosa manca nel codice: è l'unico modo per decidere cosa viene prima.

Le voci marcate «misurato» sono state provate con una sessione da autista vera su
staging (JWT di un `staff_drivers.auth_user_id`, transazione annullata), non
rileggendo le policy. Le altre sono lette dal codice e dichiarate come tali.

---

## Aperti, in ordine di quanto fanno male

### 1. Un autista legge le fatture dell'azienda — misurato
Con la sessione dell'autista `97c00a8b…` su staging: `select count(*) from
invoices` risponde **45**, `accounting_entries` **32**. Non c'è niente nell'app
che gliele mostri, ma la chiave anon è dentro il bundle del telefono: chi la
estrae interroga la tabella direttamente.

Perché è prima di tutto: non è un difetto dell'app, è un permesso del database.
Non si chiude con una build.

Da fare: restringere la RLS a chi ha un ruolo d'ufficio
(`owner|admin|operator`), come già fa `org_settings` dopo la 20261006d.

### 2. Un autista legge quanto costa all'azienda, suo e dei colleghi — misurato
`staff_drivers.costo_orario` risponde **5** righe non nulle alla stessa sessione.
L'autista vede la propria paga oraria e quella di chi lavora con lui.

Le policy di riga non sanno restringere le **colonne**, e i GRANT di colonna
valgono per *ruolo*, non per policy: quindi non si risolve con un'altra policy.
Serve una vista — l'app legge la vista, la tabella resta all'ufficio.

### 3. Il controllo versione è scritto ma inerte
`GET /api/app-version` risponde **404** su staging e su prod: la route è
committata (`website` 07310752) e non ancora pubblicata. Finché resta così, la
policy non arriva a nessun telefono e la scheda «App telefono» del pannello
scrive in un posto che nessuno legge.

Da fare: deploy del sito con pnpm. È il passo che accende tutta la catena.

### 4. Nessun numero dell'ufficio per 5 aziende su 8 (staging)
`orgs.phone` vuoto. Dove è vuoto, il tasto «Chiama l'ufficio» non compare — ed è
il tasto principale di quattro schermate bloccanti su cinque: l'autista legge
«avvisa l'ufficio» e non ha come.

Il travaso da `org_settings` è già stato applicato (prod e staging) e il form del
gestionale ora scrive anche `orgs.phone`, con popup obbligatorio per chi ha
autisti. Resta il numero di SCOZZARINI SERVICE CAR SRL, da prendere dal
gestionale, e le aziende nate senza numero.

### 5. Push Android spente
`notifyDriver` è a posto, ma FCM non è configurato: serve `google-services.json`
su EAS. Su Android l'autista non riceve la notifica di un trasporto nuovo.

### 6. Le tariffe dei privati non arrivano sul telefono
Il tariffario soccorso privati (voci e classi, opt-in `trasporti.soccorso`) vive
nel gestionale. Il telefono mostra il prezzo da `price_cents` o da `meta.price`:
per un intervento su privato, dove il prezzo esce dal listino, non ha da dove
leggerlo.

### 7. `mobile_app_store_url` non esiste in `system_settings` — misurato
Quindi il link allo store esce dal valore fisso scritto nel codice, in tre
posti (telefono, route del sito, segnaposto del pannello). Oggi i tre valori
coincidono, ma non c'è niente che li tenga allineati: basta cambiare scheda
App Store una volta.

Da fare: scrivere la chiave una volta. Da quel momento i tre valori fissi non
contano più.

### 8. Da buildare (nulla di quanto sopra arriva al telefono senza questo)
Il controllo versione, le schermate bloccanti, il navigatore, il wizard Nuovo
Trasporto, la firma con OTP. Le voci corrispondenti in `dev_tasks` dicono già
«buildare»: finché non si fa, sono scritte e invisibili.

---

## Chiusi, con cosa li ha chiusi

Elenco breve: serve a non riaprirli per sbaglio.

| Buco | Com'è stato chiuso |
|---|---|
| Un autista rimosso dal gestionale entrava ancora, e vedeva **tutti** i trasporti dell'azienda | `src/lib/accesso.ts`: `org_members` senza riga in `staff_drivers` = rimosso (commit `2725a48`) |
| «In dubbio lascia passare» era scritto solo nel commento: senza campo l'autista veniva chiuso fuori | `postgrest-js` non lancia sugli errori — l'errore si legge a mano (commit `e0896f2`) |
| L'autista poteva scrivere sulle proprie colonne di anagrafica | trigger v4 con allow-list dei ruoli e `pg_trigger_depth()`, applicato su prod |
| `org_settings` leggibile per intero dall'autista, IBAN compreso | `is_org_ufficio(org)` + policy che lascia all'autista solo `terms` e `mobile` (20261006d) |
| Il navigatore diceva «non ci sono le coordinate» con le coordinate caricate | leggeva solo i parametri dell'indirizzo, non il trasporto |
| I prezzi: l'autista li vedeva sempre | interruttore d'azienda, preimpostato acceso |
| Un autista poteva entrare nel gestionale | `RequireAuth.jsx`: «Questo è il programma dell'ufficio» |
| Abbonamento scaduto: l'app non si fermava | `src/lib/abbonamento.ts` + `SchermoAziendaFerma` — blocco immediato, niente si perde |
| Il numero dell'ufficio letto da due copie che guardavano **tabelle diverse** | una copia sola in `src/lib/ufficio.ts` |
| La banda della versione finiva sotto la striscia della manutenzione e non si poteva più chiudere | una riga alla volta, la manutenzione prima (`src/lib/avvisoManutenzione.ts`) |
