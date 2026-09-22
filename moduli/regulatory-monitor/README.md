# Regulatory Monitor

Monitoraggio automatico delle fonti normative ufficiali — **RENTRI**, **SDI/FatturaPA**, **RVFU** — con **notifica email** quando vengono pubblicate nuove note, manuali o specifiche tecniche.

Gira sul VPS sotto PM2, schedulato con `node-cron`. Riusa l'email (`nodemailer` → Resend) e Supabase (`service_role`) degli altri servizi.

## Come funziona

Per ogni fonte (vedi [`sources.js`](sources.js)):

- **mode `links`** — scarica la pagina, estrae i link che corrispondono a `match` (es. `/news/...`, `/export/documenti/...`, `/content/id/...`) come **array ordinato** `[{url,title}]` (i più recenti in cima) e lo confronta con l'ultimo salvato. Le **voci nuove** finiscono in email. Opzioni: `stripQuery` (rimuove la query volatile, es. redirect Liferay).
- **mode `changelog`** — scarica un changelog markdown stile RENTRI e parsifica ogni rilascio `## 🗓️ DD/MM/YYYY` (con servizi+versioni) come voce; ogni nuovo rilascio → notifica. Usa `linkBase` per la pagina human da aprire (il `.md` è solo la sorgente dati).
- **mode `text`** — normalizza il testo visibile della pagina e ne calcola un hash; se cambia, notifica "contenuto aggiornato". (Fallback per pagine senza elenco.)

Al **primo controllo** di ogni fonte registra solo la *baseline* (nessuna email): la prima notifica utile arriva dal controllo successivo.

Lo stato vive su Supabase: `regulatory_monitor_state` (1 riga per fonte) e `regulatory_monitor_events` (storico delle novità rilevate).

## Setup

1. **Tabelle Supabase** — esegui [`migration.sql`](migration.sql) nel SQL editor del progetto (o `supabase db push` se versioni le migration).

2. **Dipendenze**
   ```bash
   cd moduli/regulatory-monitor && npm install
   ```

3. **Variabili** — vedi [`.env.example`](.env.example). `SUPABASE_*` e `SMTP_*` sono già in `/root/.env`; bastano (opzionali) `MONITOR_EMAIL_TO`, `MONITOR_SCHEDULE`, `MONITOR_TZ`.

4. **Test al volo** (un controllo e termina — alla prima esecuzione registra solo le baseline):
   ```bash
   RUN_ONCE=true MONITOR_RUN_ON_START=true node server.js
   # oppure: npm run check
   ```
   Eseguilo **due volte** per vedere il flusso completo: la prima crea le baseline, la seconda rileverà eventuali novità.

## Deploy (PM2)

Il modulo include un [`ecosystem.config.js`](ecosystem.config.js) dedicato (istanza **singola**, `fork`, path-independent). Va eseguito in **un solo ambiente** (di norma produzione): più istanze ⇒ email duplicate.

Una tantum sul VPS, dalla cartella del modulo:

```bash
cd /opt/production/moduli/regulatory-monitor   # path dove risiede il modulo
npm install --production
pm2 start ecosystem.config.js && pm2 save
pm2 logs regulatory-monitor
```

Agli aggiornamenti successivi (dopo un `git pull`) basta:

```bash
pm2 restart regulatory-monitor
```

> ⚠️ **Le tabelle devono esistere nello stesso Supabase che il modulo legge** — cioè quello configurato in `/root/.env` (di norma il progetto di produzione). Se hai applicato [`migration.sql`](migration.sql) su un progetto diverso, riapplicalo su quello giusto.

## Aggiungere / modificare fonti

Modifica [`sources.js`](sources.js). Ogni voce: `id` (univoco, chiave di stato), `group`, `label`, `url`, `mode` (`links`|`changelog`|`text`). Per `links`: `match` (sottostringa che l'URL del link deve contenere) e opzionale `stripQuery`. Per `changelog`: `url` = il `.md` grezzo, `linkBase` = la pagina human. Per `text`: opzionale `selector` CSS per limitare l'area osservata.

## Limiti noti

- Le pagine **client-rendered** (caricate via JavaScript) possono restituire 0 link in mode `links`: il monitor non azzera lo stato e logga `no_items_extracted`. Se succede, valuta `mode: 'text'`, un altro URL più "statico", oppure un endpoint JSON di backend.
- **RVFU**: monitoriamo la pagina "Documenti" pubblica del Portale del Trasporto (`/web/ptr/78`, anno corrente): memorandum di rilascio, informative e SpecificheWS. ⚠️ È la pagina dell'**anno corrente** (oggi 2025): quando il portale aprirà la pagina del nuovo anno, l'URL della fonte va aggiornato. I manuali nell'Area Privata (login) restano fuori portata.
- È un controllo a **diff di pagina**: rileva che *qualcosa* è cambiato e (in mode `links`) *cosa*, ma non interpreta il contenuto. Per i dettagli si apre il link ufficiale.
