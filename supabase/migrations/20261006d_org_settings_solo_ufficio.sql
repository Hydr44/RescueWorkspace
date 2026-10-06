-- 20261006d_org_settings_solo_ufficio.sql
--
-- Un autista, col gettone del suo telefono, legge le CREDENZIALI dell'azienda.
--
-- STATO: SCRITTA E NON ESEGUITA. Staging, prova col blocco in fondo, poi prod.
--        Indietro:
--          drop policy org_settings_select on public.org_settings;
--          create policy org_settings_select on public.org_settings
--            for select using (is_member(org_id));
--
-- ── Cosa ho misurato, non dedotto ───────────────────────────────────────
-- Con l'identita' di un autista vero (Marco Sotto, staging), dentro una
-- transazione annullata e col ruolo `authenticated`:
--
--   org_settings       18 righe lette
--   invoices           45
--   accounting_entries 32
--   clients             6
--   staff_drivers       5
--   org_subscriptions   1
--
-- Le 18 chiavi di org_settings che vede comprendono: `rvfu_auth`,
-- `rvfu_credentials`, `demolizioni` (che contiene
-- `{"rvfu": {"username": ..., "password": ...}}`), `sdi` e `company` (partita
-- IVA, IBAN, BIC, PEC). Per l'azienda con i cinque autisti sono TRE righe di
-- credenziali RVFU piu' i dati fiscali.
--
-- Le chiavi `api_key:<uuid>`, che contengono i gettoni delle API, oggi stanno
-- su un'azienda SENZA autisti: nessuno le legge adesso. Ma la policy lo
-- permetterebbe, quindi e' un caso che aspetta solo l'azienda giusta.
--
-- La policy colpevole e' una riga:
--   org_settings_select  SELECT  using (is_member(org_id))
-- cioe' «chiunque appartenga all'azienda», e gli autisti appartengono:
-- stanno tutti in `org_members` con `role = 'autista'`.
--
-- ── Cosa legge DAVVERO il telefono ──────────────────────────────────────
-- Due chiavi, e nient'altro. Verificato cercando `org_settings` in tutto
-- RescueMobile:
--   `terms`   le condizioni di servizio, mostrate nella pagina della firma
--             (app/transport-firma.js:111 e app/consent.js:87)
--   `mobile`  i due interruttori dell'azienda, prezzi e turni
--             (src/hooks/useImpostazioniMobile.ts:48)
-- Quindi restringere a queste due non toglie niente a nessuno.
--
-- ── Perche' si risolve con una policy e non con i permessi di colonna ───
-- Perche' qui il problema sono le RIGHE, non le colonne: org_settings e'
-- chiave/valore, una riga per impostazione. Una regola di riga sa dire «solo
-- queste chiavi», ed e' esattamente il taglio che serve.

-- «Ufficio» con la stessa lista di permessi usata dal trigger degli autisti
-- (20261006c): owner, admin, operator. Un ruolo nuovo o vuoto NON e' ufficio.
-- Nota: `is_org_admin` esiste ma e' solo (owner, admin) — serve anche
-- l'operatore, che dal gestionale legge le impostazioni.
create or replace function public.is_org_ufficio(org uuid)
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $$
  select exists (
    select 1 from public.org_members
     where org_id = org
       and user_id = auth.uid()
       and coalesce(role, '') in ('owner', 'admin', 'operator')
  );
$$;

comment on function public.is_org_ufficio(uuid) is
  'Vero se chi chiama e'' dell''ufficio di quell''azienda: org_members.role in (owner, admin, operator). Lista di permessi, non di esclusioni: un ruolo sconosciuto non e'' ufficio.';

drop policy if exists org_settings_select on public.org_settings;
create policy org_settings_select on public.org_settings
  for select using (
    -- L'ufficio legge tutto, come prima.
    public.is_org_ufficio(org_id)
    -- Chiunque altro appartenga all'azienda (cioe' l'autista) legge le due
    -- chiavi che il telefono usa, e nessun'altra.
    or (public.is_member(org_id) and key in ('terms', 'mobile'))
  );

-- La scrittura resta com'era: `org_settings_insert` / `_update` / `_delete`
-- sono gia' su `is_org_admin` (owner, admin). L'autista non scriveva e
-- continua a non scrivere.


-- ══════════════════════════════════════════════════════════════════════════
-- LA PROVA. Dopo aver applicato, incolla questo (sostituisci l'uuid con un
-- autista vero della tua azienda, NON un owner).
--
-- Non lascia niente: legge e poi si annulla da sola col `raise`.
--
-- Atteso:  autista -> 2 chiavi (terms, mobile) e ZERO credenziali
--          ufficio -> tutte, come prima
-- ══════════════════════════════════════════════════════════════════════════
--
-- do $$
-- declare
--   v_uid_aut uuid := 'b538a773-12de-4741-93f5-0695b10570f1';
--   v_org     uuid := '1ea3be12-a439-46ac-94d9-eaff1bb346c2';
--   v_uid_uff uuid;
--   n_aut int; n_cred_aut int; chiavi_aut text; n_uff int;
-- begin
--   select user_id into v_uid_uff from org_members
--    where org_id = v_org and coalesce(role,'') in ('owner','admin','operator') limit 1;
--
--   -- 1) l'autista
--   perform set_config('request.jwt.claims',
--     json_build_object('sub', v_uid_aut, 'role','authenticated')::text, true);
--   execute 'set local role authenticated';
--   select count(*), string_agg(key, ', ' order by key) into n_aut, chiavi_aut from org_settings;
--   select count(*) into n_cred_aut from org_settings
--    where key in ('rvfu_auth','rvfu_credentials','demolizioni','sdi','company')
--       or key like 'api_key:%';
--   execute 'reset role';
--
--   -- 2) l'ufficio
--   perform set_config('request.jwt.claims',
--     json_build_object('sub', v_uid_uff, 'role','authenticated')::text, true);
--   execute 'set local role authenticated';
--   select count(*) into n_uff from org_settings;
--   execute 'reset role';
--
--   raise exception E'ESITO (nulla salvato)\n  autista: % righe, % credenziali  -> %\n    chiavi viste: %\n  ufficio: % righe -> %',
--     n_aut, n_cred_aut,
--     case when n_cred_aut = 0 then 'CHIUSO' else 'ANCORA APERTO!' end,
--     coalesce(chiavi_aut,'nessuna'),
--     n_uff, case when n_uff > 2 then 'legge tutto, giusto' else 'TROPPO STRETTO!' end;
-- end $$;
--
-- Poi la prova dall'app, che conta piu' di tutte: apri la pagina della firma
-- di un trasporto (le condizioni di servizio vengono da `terms`) e controlla
-- che si vedano ancora.
