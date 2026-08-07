# Fase 0 — Schema del Profilo Ambientale (progettazione)

> **⚠️ SOLO DESIGN — NIENTE APPLICATO.** Questo documento progetta le tabelle; la DDL qui sotto è **una proposta**, non una migrazione eseguita. Nessun tocco al DB, tantomeno prod. Percorso quando si implementerà: branch → **staging** → verifica → prod solo con via libera. La feature nasce **spenta** (feature flag `environmental_profile`), quindi non tocca chi già usa trasporti/clienti. Vedi [[feedback_prod_live_no_touch]].
>
> **Cosa è:** la fondazione di tutto (master [semplificazione-processi-ambientali.md](semplificazione-processi-ambientali.md) §2 · Fase 0). Dettaglia e supera lo sketch del master §2.2. Convenzioni allineate al repo: `public.`, `gen_random_uuid()`, RLS via `org_members`.

## 1. Il modello — 5 tabelle

Il profilo ha due facce, entrambe modellate:
- **Lato impianto** (cosa il sito può *ricevere/trattare*): `environmental_site` + `environmental_authorization`.
- **Lato trasporto** (cosa i mezzi possono *trasportare*, per categoria Albo): `environmental_albo_category` + `environmental_vehicle`.
- **Header** per org: `environmental_profile`.

```
environmental_profile        (1 per org — anagrafica, iscrizione RENTRI, Albo, stato)
  ├── environmental_site               (N — unità locali/siti + registro vidimato)
  │     └── environmental_authorization (N per sito — autorizzazione impianto: R/D, CER, limiti)
  ├── environmental_albo_category      (N — categorie Albo: 2-bis, 5F… + validità, RT, garanzia)
  └── environmental_vehicle            (N — dati Albo del mezzo · companion di `vehicles`, non la duplica)
```

## 2. DDL proposta (NON applicata)

```sql
-- =========================================================================
-- FASE 0 · Profilo ambientale — PROPOSTA (non eseguire su prod)
-- feature flag: nasce spento; staging prima
-- =========================================================================

-- Header org ------------------------------------------------------------
create table public.environmental_profile (
  org_id          uuid primary key references public.orgs(id) on delete cascade,
  num_iscr_rentri text,                    -- da GET /operatore
  denominazione   text,
  codice_fiscale  text,
  partita_iva     text,
  anagrafica      jsonb,                   -- snapshot /operatore (REA, PEC, sede legale, LR…)
  albo_sezione    text,                    -- da /operatore/{n}/autorizzazione-albo
  albo_numero     text,
  albo_categorie  jsonb,                   -- [{categoria, classe, stato}]
  source          text not null default 'rentri_api',  -- rentri_api | ocr | manual
  status          text not null default 'bozza',       -- bozza | confermato
  last_synced_at  timestamptz,
  confirmed_at    timestamptz,
  confirmed_by    uuid,                    -- auth.users
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Unità locali / siti ---------------------------------------------------
create table public.environmental_site (
  id                     uuid primary key default gen_random_uuid(),
  org_id                 uuid not null references public.orgs(id) on delete cascade,
  num_iscr_sito          text not null,           -- da /operatore/{n}/siti
  nome                   text,
  indirizzo              text,
  comune_id              text,                    -- ISTAT 6
  provincia_id           text,                    -- ISTAT 3
  cap                    text,
  is_sede_legale         boolean not null default false,
  attivita               text[],                  -- macro-attività RENTRI (CentroRaccolta/Recupero/…)
  registro_identificativo text,                   -- registro vidimato (onboarding, e-seal)
  stato                  text,
  synced_from_rentri     boolean not null default true,
  created_at             timestamptz not null default now(),
  unique (org_id, num_iscr_sito)
);

-- Autorizzazione impianto per sito -------------------------------------
create table public.environmental_authorization (
  id                 uuid primary key default gen_random_uuid(),
  site_id            uuid not null references public.environmental_site(id) on delete cascade,
  org_id             uuid not null references public.orgs(id) on delete cascade,  -- denormalizzato per RLS
  tipo_autorizzazione text,                -- enum RENTRI: RecSmalArt208 | AIA | RecProcSemplificata | …
  autorizzazione_rif text,                 -- n°/riferimento provvedimento
  ente_rilasciante   text,
  data_rilascio      date,
  data_scadenza      date,
  operazioni_rd      text[],               -- R1..R13 / D1..D15  · da /siti/{id}/autorizzazioni (RENTRI)
  cer_autorizzati    text[],               -- da OCR + validazione umana
  limiti             jsonb,                -- [{codice_eer|null, tipo:'annuo'|'istantaneo', valore, unita}] · OCR
  prescrizioni       text,                 -- da OCR/manuale
  documento_url      text,                 -- PDF autorizzazione su R2
  extraction_status  text not null default 'ocr_grezzo',  -- ocr_grezzo | validato_umano
  source_rd          text not null default 'rentri_api',
  source_cer         text not null default 'ocr',
  created_at         timestamptz not null default now()
);

-- Categorie Albo (lato trasporto) --------------------------------------
create table public.environmental_albo_category (
  id                    uuid primary key default gen_random_uuid(),
  org_id                uuid not null references public.orgs(id) on delete cascade,
  categoria             text not null,          -- 2-bis, 4, 5, 6, 8, 9, 10
  classe                text,                   -- A-F | unica
  descrizione           text,
  regime                text,                   -- conto_proprio | conto_terzi
  inizio_validita       date,
  fine_validita         date,
  limite_quantita_annua_t numeric,
  cer_non_pericolosi    text[],
  cer_pericolosi        text[],
  responsabili_tecnici  jsonb,                  -- [{nome, codice_fiscale}]
  garanzia_finanziaria  jsonb,                  -- {tipo, compagnia, numero, importo_eur}
  source                text not null default 'rentri_api',  -- Albo API/estratto | ocr
  created_at            timestamptz not null default now()
);

-- Dati Albo/ambientali del mezzo — COMPANION di public.vehicles ---------
-- ⚠️ NON aggiungere colonne a `vehicles`: è LIVE, usata da trasporti. Qui solo il delta Albo.
create table public.environmental_vehicle (
  id                        uuid primary key default gen_random_uuid(),
  org_id                    uuid not null references public.orgs(id) on delete cascade,
  vehicle_id                uuid references public.vehicles(id) on delete set null,  -- link al mezzo del parco esistente
  targa                     text not null,        -- ridondante: fallback se il mezzo non è (ancora) in vehicles
  categorie_attive          text[],               -- categorie Albo attive per questo mezzo
  cer_per_categoria         jsonb,                -- {categoria: [cer…]}
  uso_proprio_esente_licenza boolean,
  titolo_disponibilita      text,
  stato                     text,                 -- attivo | sospeso | cancellato (stato Albo)
  source                    text not null default 'rentri_api',
  created_at                timestamptz not null default now(),
  unique (org_id, targa)
);

-- Indici utili
create index on public.environmental_site (org_id);
create index on public.environmental_authorization (site_id);
create index on public.environmental_authorization (org_id);
create index on public.environmental_albo_category (org_id);
create index on public.environmental_vehicle (org_id);
```

## 3. RLS (org-scoped, via `org_members`)
Pattern del repo (esempio da `20260527_assist_requests.sql`): per ogni tabella, abilitare RLS e policy che verificano l'appartenenza all'org.

```sql
alter table public.environmental_profile enable row level security;
create policy ep_all on public.environmental_profile for all to authenticated
  using (exists (select 1 from public.org_members m
                 where m.org_id = environmental_profile.org_id and m.user_id = auth.uid()));
-- idem per site / authorization / albo_category / vehicle (tutte hanno org_id).
```
Scritture sensibili (conferma profilo, validazione OCR) restano gated da ruolo lato app; la conferma (`status='confermato'`) può richiedere ruolo admin/owner.

## 4. Provenienza di ogni dato (il cuore del profilo)
| Campo | Fonte | Come |
|---|---|---|
| `environmental_profile.*` (anagrafica, num_iscr, Albo) | 🟢 RENTRI API | `/operatore`, `/autorizzazione-albo` |
| `environmental_site.*` | 🟢 RENTRI API | `/operatore/{n}/siti` |
| `environmental_site.registro_identificativo` | 🟢 RENTRI | `POST /operatore/registri` (vidimazione, onboarding) |
| `environmental_authorization.operazioni_rd`, tipo, rif, date | 🟢 RENTRI API | `/siti/{id}/autorizzazioni` |
| `environmental_authorization.cer_autorizzati`, `limiti`, `prescrizioni` | 🟠 OCR + validazione | PDF autorizzazione (le uniche 2 cose non esposte dall'API) |
| `environmental_albo_category.*`, `environmental_vehicle.*` | 🟢 Albo (API/estratto) o 🟠 OCR | ricerca pubblica Albo per CF, o estratto |

## 5. Riconciliazione con le tabelle esistenti (riusare, non duplicare)
- `rentri_org_certificates.num_iscr_sito` → **collega** a `environmental_site.num_iscr_sito` (il certificato resta l'ancora tecnica; il sito diventa entità).
- `rentri_registri.autorizzazione` (text libero) e `num_iscr_sito` → **sostituire** con FK a `environmental_authorization` / `environmental_site`. Migrazione dati graduale (i registri esistenti restano validi finché non ri-mappati).
- `rentri_limiti_rifiuti` → i **valori-limite** diventano derivati da `environmental_authorization.limiti` (single source); `rentri_limiti_rifiuti` mantiene solo `quantita_attuale` (cumulato annuo trasmesso). Evitare doppia verità.
- `rentri_codifiche_cache` (catalogo EER) → è la tabella contro cui **validare** `cer_autorizzati` (un CER autorizzato deve esistere a catalogo).
- `org_settings` (EAV) → **non** ci mettiamo il profilo (troppo strutturato); resta per feature flag e config leggere.

## 6. Come si popola (flusso onboarding, master §3)
1. Certificato → JWT (esistente).
2. **Sync** (`/operatore` + `/siti` + `/siti/{id}/autorizzazioni` + `/autorizzazione-albo`) → riempie `profile`, `site`, `authorization.operazioni_rd`, `albo_category`, `vehicle`. `source='rentri_api'`.
3. **OCR** dell'autorizzazione → riempie `authorization.cer_autorizzati` + `limiti` + `prescrizioni`. `extraction_status='ocr_grezzo'`.
4. **Validazione umana** → `extraction_status='validato_umano'`, poi `profile.status='confermato'`.
5. **Vidima registri** → `site.registro_identificativo`.

Guardrail e movimento unico si accendono per l'org solo quando `status='confermato'` (feature flag).

## 7. Come alimenta i guardrail (a valle)
- **Selettore CER** (movimento, esplosione VFU) → `authorization.cer_autorizzati` del sito attivo ∩ catalogo. Non autorizzato = avviso ②; inesistente = blocco ③.
- **Selettore operazione R/D** → `authorization.operazioni_rd` (fine dell'`R4` hardcoded, cfr. fix §5.3 / [fix-conformita-registro-vfu.md](fix-conformita-registro-vfu.md)).
- **Giacenza** → `authorization.limiti` (avviso ②, mai blocco — Decisione B).
- **FIR trasportatore** → `environmental_vehicle` (targa abilitata al CER) + `albo_category` (categoria/classe).
- **Scadenzario** → `authorization.data_scadenza`, `albo_category.fine_validita`.

## 8. Rollout (piano, non azione)
1. Migrazione su **branch** → applicata **solo su staging**.
2. Feature flag `environmental_profile` OFF di default; ON per una singola org pilota su staging.
3. Test onboarding end-to-end su staging + RENTRI **Formazione** (mai prod).
4. Solo dopo esito positivo e via libera: prod, org per org.

## 9. Decisioni di progettazione (CHIUSE — 2026-07)
1. ✅ **`environmental_vehicle` = companion, non duplicato**: esiste già `public.vehicles` (parco mezzi, **usata da trasporti, LIVE**). Non toccare `vehicles`; `environmental_vehicle` referenzia `vehicles.id` e tiene solo il delta Albo. `targa` ridondante come fallback.
2. ✅ **JSONB** per `cer_per_categoria` e `limiti` (flessibili, pochi record per org); le liste semplici (`cer_autorizzati`, `operazioni_rd`) restano `text[]`.
3. ✅ **Multi-sede**: N siti supportati; 1 sede inclusa, extra come add-on ([[project_semplificazione_ambientale]] §9.1).
4. ✅ **CER del VFU solo da OCR** dell'autorizzazione (+ validazione umana) — **nessun preset** che pre-conceda codici. Si tratta solo ciò che è autorizzato → `cer_autorizzati` nasce sempre dal documento, mai da una lista di default. *(Coerente con `source_cer='ocr'` + `extraction_status` nella DDL.)*
5. ✅ **Limiti = fonte unica nel profilo**: il valore-limite vive in `environmental_authorization.limiti`; `rentri_limiti_rifiuti` mantiene solo il consumato (`quantita_attuale`) e legge il limite dal profilo. Nessuna doppia verità (cfr. §5).
