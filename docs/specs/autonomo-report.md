# Report sessione autonoma — 2026-06-15

> ~2 ore di lavoro in autonomia (permesso dato). Paletti rispettati: applico fix ovunque
> tranne deploy e PROD; staging con backup; rebuild admin; esclusi RENTRI/RVFU/SDI.
> **Backup completo fatto PRIMA di iniziare:** `~/Backups/RescueManager/manual/pre-autonomo-20260615-180506.tgz` (1.8 GB) + backup rsync automatico ogni 10 min.

## ✅ Fix APPLICATI (build verde verificata)

### Desktop (greeting-friend-api-main)
1. **Calendario — trasporti per data programmata** (`CalendarPage.jsx`): prima raggruppava per `created_at` → un trasporto programmato in futuro appariva oggi. Ora usa la data programmata (`scheduled_date`/`meta.scheduled_date`, ISO o gg/mm/aaaa) con fallback a `created_at`.
2. **Login OAuth — UI bloccata su errore** (`Login.jsx`): `const timeoutId` era block-scoped nel `try`, quindi `clearTimeout(timeoutId)` nel `catch` lanciava ReferenceError → `setLoading(false)` non veniva mai eseguito. Hoist a `let timeoutId`.
3. **Profilo — salvataggio fallito silenzioso** (`ProfileSettings.jsx`): l'errore di update `profiles` era un `console.warn` → mostrava successo anche se telefono/avatar non venivano salvati. Ora `throw profErr`.

### Website (Next.js)
4. **Form contatti — successo anche su errore** (`_ContattiForm.tsx`): `setIsSubmitted(true)` sia nel try sia nel catch, e nessun controllo `res.ok` → "Richiesta inviata" anche se l'invio falliva. Ora controlla `res.ok` + stato d'errore visibile.
5. **404 — link rotto a `/demo`** (`not-found.tsx`): la pagina non esiste → ora punta a `/contatti`.
6. **OAuth exchange — log sensibili** (`api/auth/oauth/exchange/route.ts`): rimossi i log che stampavano gli header completi (incl. Authorization), `oauthData` e `userData` interi; mantenuti solo flag booleani.
7. **Bulk staff — nessun controllo permessi** (`api/staff/admin/staff/bulk/route.ts`): la route eliminava/sospendeva staff con service_role **senza alcuna auth**. Aggiunto `getStaffFromRequest` + ruolo `admin` per le azioni distruttive + attribuzione reale nell'audit log.

### Admin panel (Electron)
8. **Chiave API lead-api hardcoded nel client** (`LeadDetailPage.tsx`): `API_KEY` e endpoint `http://` in chiaro nel bundle. Rimossi; le 2 operazioni (resend-recovery-link, deactivate-demo) ora passano da **2 nuove route proxy lato website** (`/api/staff/admin/leads/[id]/resend-recovery-link`, `/deactivate-demo`) con **auth staff** e chiave **solo lato server**, + 2 helper in `lib/api.ts`.

> Non applicato: #3 wizard (`OrganizationSettings` "AVVIA WIZARD" → /setup) perché la route/`SetupWizard` va verificata (rischio rotta) — lasciato a te.

## 📋 Da fare TU (richiedono deploy/prod — non li tocco)

### vps-sdi (analisi read-only — dettaglio in `autonomo-fase4-vps.md`)
- 🔴 **`oauth-proxy-server` (prod) crash-loop (382 restart)**: `ReferenceError: url is not defined` (server.js:220/233) + `[driver/provision] stack depth exceeded`. Codice **stale in prod**; staging è già più nuovo → **deploy staging→prod** di oauth-proxy-server.
- 🟠 **`assist-server` (prod) senza Supabase**: `Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY` → funzione assistenza non operativa. Aggiungere le env + `pm2 restart assist-server --update-env`.

### Deploy in sospeso (da turni precedenti)
- AI `/api/ai/chat`: live su staging, manca su prod (`rescuemanager.eu`). + `ANTHROPIC_API_KEY` su Vercel.
- Migration RLS `20260612_rls_audit_followup.sql` + edge functions CORS (`billing_portal`, `send-team-invite`): `supabase db push` / `functions deploy`.
- GoCardless F1 (lead-api): server live; ⚠️ token **LIVE da ruotare** + webhook da configurare nel dashboard GoCardless.

## 🧭 Admin panel (rebuild C)
- **Design unificato pronto**: `admin-panel-design-unificato.md` (modello dati su tabelle reali, 2 macchine a stati con `in_verifica`, mappa 13 pagine, ordine rebuild F1-F7).
- **Schema**: le colonne abbonamento (payment_method/gocardless/auto_renew/sospensione) sono già nella migration `20260615_gocardless_activation_fase0.sql`. `leads.status` è testo libero (nessun CHECK) → aggiungere `trattativa`/`in_verifica` è solo lato codice.
- **Nota dal codice**: prezzi **hardcoded** in `NewLeadQuotePage.tsx` mentre la tabella `plans` esiste → il design li sposta sul listino DB.
- **Stato rebuild**: design + schema pronti. Il rebuild delle pagine è un lavoro grosso che conviene fare **con te che puoi testare l'app Electron** (non si può testare funzionalmente in autonomia) — è la cosa più sicura.

## 💡 Consigli campi/processi (in `consigli-campi-processi.md`)
Top: custodia/giacenza fatturabile in Piazzale (€/giorno + committente) · acquirente alla vendita ricambi (storico/garanzia) · agenda scadenze unica nel Calendario · 3 ponti tra moduli (Trasporto⇄Piazzale, Ricambio⇄Cliente⇄Fattura, Preventivo⇄magazzino) · fido cliente verificato sull'esposto reale · push reali app autisti.

### Wave 2 — altri fix APPLICATI (build verde)
9. **AIContext stale closure** (`AIContext.jsx`, desktop): dopo cambio org i dati azienda restavano quelli vecchi (la guardia `companyData` bloccava il reload). Aggiunto `useEffect` di reset su `orgId`.
10. **Import anni a 2 cifre** (`lib/import/applyImport.js`, desktop): "85" → "2085". Aggiunto pivot 1930-2029.
11. **Privilege escalation `org/select`** (website): impostava `current_org` su qualsiasi org senza verificare la membership. Aggiunto controllo `org_members`.
12. **Chiave API lead-api hardcoded** (`LeadDemoDetailPage.tsx`, admin): stesso problema di LeadDetailPage → spostato sugli helper proxy con auth.
13. **Race coda offline** (`offline-queue.ts`, mobile): `processQueue` eseguibile in concorrenza → corruzione coda. Aggiunto guard in-flight `processing`.
14-16. **3 secret JWT hardcoded** (`operator-auth.ts`, `staff-auth.ts`, `auth/refresh/route.ts`, website): rimossi i fallback in chiaro (uno era pure `NEXT_PUBLIC_` = esposto al client!). Ora fail-fast da env. ⚠️ **Al prossimo deploy del website assicurati che `JWT_SECRET` e `STAFF_JWT_SECRET` siano nelle env Vercel** (i route fratelli già le richiedono, quindi in prod ci sono).

## 📋 Bug confermati NON applicati (richiedono env/test/decisione — non rischio di romperli alla cieca)
- **SMTP senza validazione TLS** (`electron/email-service.js:35`, `rejectUnauthorized:false`): vulnerabilità MITM. NON l'ho tolto perché potrebbe rompere l'invio email se un cliente usa SMTP con cert self-signed → toglilo e **verifica che l'invio email funzioni** (con Gmail/IONOS/Outlook è ok).
- **Operator token persistenti senza scadenza** (`operator-auth.ts:38-42`): impostare sempre una scadenza (es. 90d). È un cambio di comportamento sui login persistenti → meglio decidere insieme.
- **Rate-limiting non persistente su serverless** (`security.ts`, `contact/route.ts`): in-memory non funziona su Vercel (ogni invocazione resetta) → serve Redis/Upstash. Cambio più ampio.
- **Validazione URL OAuth** (`electron/main.js` open-login-window): whitelisting dell'origin OAuth (tocca il path di login → da testare).
- **Listener oauth-callback senza cleanup** (`preload.js`/`Login.jsx`): memory leak minore → ritornare un unsubscribe.

## Bug-hunt — totali
- **Wave 1**: 61 grezzi → 9 confermati → **9 applicati**.
- **Wave 2**: 53 grezzi → 17 confermati → **8 applicati** (5 + 3 secret), 5 riportati sopra (+ doppioni su stesso file).
- **Tutto build-verde** (desktop vite build + esbuild syntax su website/admin/mobile).
