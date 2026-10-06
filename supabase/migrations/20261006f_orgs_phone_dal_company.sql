-- 20261006f_orgs_phone_dal_company.sql
--
-- «Chiama l'ufficio» non comparirebbe a nessuno: il numero sta nel posto
-- sbagliato per chi lo deve leggere.
--
-- STATO: SCRITTA E NON ESEGUITA. Staging, controlla, poi prod.
--        Indietro: non serve (riempie solo colonne vuote, non ne svuota).
--
-- ── Il problema, misurato su PRODUZIONE ─────────────────────────────────
--   orgs.phone vuoto                              9 aziende su 9
--   org_settings key='company' con ->>'phone'     8 righe su 10
--
-- Il numero dell'ufficio c'e', ma vive in `org_settings` sotto la chiave
-- `company`, insieme a partita IVA, IBAN, BIC e PEC. Il telefono legge
-- `orgs.phone`, che e' vuoto. Quindi:
--
--   - la riga «Chiama l'ufficio» nel profilo non compare;
--   - il tasto «Chiama l'ufficio» delle schermate bloccanti (85 accesso
--     disattivato, 86 azienda ferma, 87 manutenzione, 88 errore) non compare —
--     ed e' il tasto PRINCIPALE di quattro disegni su cinque, quello che dice
--     all'autista cosa fare.
--
-- E non si risolve lasciando leggere `company` all'autista: quella chiave
-- contiene l'IBAN, ed e' proprio una di quelle chiuse dalla 20261006d. Il
-- numero dell'ufficio non e' un dato riservato; l'IBAN si'. Vanno separati, ed
-- e' quello che fa questo travaso.
--
-- ── Cosa fa ─────────────────────────────────────────────────────────────
-- Copia il telefono in `orgs.phone` SOLO dove e' vuoto. Non sovrascrive mai un
-- numero gia' scritto a mano: se qualcuno ha messo in `orgs.phone` un numero
-- diverso da quello della fatturazione (il centralino invece della sede, per
-- esempio), quello vince.

update public.orgs o
   set phone = btrim(s.value ->> 'phone')
  from public.org_settings s
 where s.org_id = o.id
   and s.key = 'company'
   and coalesce(btrim(s.value ->> 'phone'), '') <> ''
   and coalesce(btrim(o.phone), '') = '';

-- Chi resta senza: aziende che non hanno il telefono nemmeno in fatturazione.
-- Per loro il tasto non compare, ed e' giusto — meglio un tasto in meno che un
-- tasto che non chiama nessuno.
--   select id, name from public.orgs where coalesce(btrim(phone),'') = '';

-- ── Controllo dopo ──────────────────────────────────────────────────────
--   select count(*) filter (where coalesce(btrim(phone),'') <> '') as con_numero,
--          count(*) filter (where coalesce(btrim(phone),'') =  '') as senza_numero
--     from public.orgs;
--   -- atteso su prod: 8 con numero, 1 senza

-- ── Quello che resta da fare nel codice, e non e' SQL ───────────────────
-- Questo travaso e' una fotografia: riempie quello che c'e' adesso. Perche' il
-- numero resti giusto, il form dei dati azienda del gestionale — che scrive
-- `org_settings` chiave `company` — deve scrivere ANCHE `orgs.phone`, oppure
-- `orgs.phone` deve diventare la fonte unica e `company.phone` sparire.
-- Altrimenti al primo cambio di numero si torna allo stesso punto: il
-- gestionale mostra il numero nuovo e il telefono chiama quello vecchio.
--
-- Vale anche per le aziende NUOVE: oggi nascono senza `orgs.phone` e per loro
-- il tasto non comparira' mai.
