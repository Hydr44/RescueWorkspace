# Staff Auth — Ridisegno sicuro (struttura, no codice)

> Stato: **PROPOSTA / struttura da validare**. Nessun codice scritto. Decisioni prese con l'utente il 2026-07-07.
> Obiettivo: creazione staff robusta e sicura, con **email verificata**, **invito self-service**, **OTP step-up**, rimozione delle backdoor.

## Decisioni prese (bivi già chiusi)
1. **Identità**: si mantiene la **tabella `staff` dedicata** (staff separati dai clienti), irrobustita. Niente migrazione a Supabase Auth.
2. **Creazione**: **invito via email + password impostata dal nuovo staff** (l'admin non conosce mai la password).
3. **OTP**: richiesto **solo su dispositivo/IP nuovo**, poi ricordato ~7 giorni (step-up, non ad ogni login).
4. Problema "account inesistente" = **email mai verificata** (account nati da seed/script). Va introdotta la verifica email, incluso per l'account attuale dell'utente.

---

## 1. Stato reale (dump PROD `ienzdgrqalltvkdkuamp`, via OpenAPI PostgREST)

Schema **vero** in produzione (non c'è migration nel repo → questa è la fonte di verità):

**`staff`**
- `id uuid PK`, `email text NN`, `password_hash text NN`, `full_name text NN=''`, `avatar_url text`,
  `role text NN='staff'`, `is_active bool NN=true`, `last_login_at`, `last_login_ip`, `created_at`, `updated_at`
- ❌ Mancano: `email_verified_at`, `status`, `invited_by`, `password_set_at`, lockout.

**`staff_sessions`** — `id`, `staff_id FK→staff.id`, `token_hash`, `ip_address`, `user_agent`, `expires_at`, `created_at`. (revoca via hash SHA-256 del JWT — già ok)

**`staff_audit_log`** — `id`, `staff_id`, `staff_email`, `action`, `target_type/id/label`, `details jsonb`, `ip_address`, `user_agent`, `created_at`, `org_id`.

**`email_otp`** — ⚠️ **accoppiata ai preventivi**: `quote_uuid uuid NN FK→lead_quotes.public_uuid`. NON riusabile per lo staff → serve tabella OTP dedicata.

**`org_invites`** — ✅ **template perfetto** già esistente per gli inviti: `email`, `role`, `invited_by`, `status`, `token (gen_random_bytes hex)`, `expires_at (+7d)`, `accepted_at`, `email_sent_at`, `email_error`. Replichiamo lo stesso pattern per lo staff.

### Conflitti/gotcha rilevati (importante per non rompere niente)
| # | Fatto reale | Impatto sul nuovo design |
|---|---|---|
| C1 | `staff.password_hash` è **NOT NULL** | L'invito crea lo staff **prima** che scelga la password → rendere `password_hash` **nullable** (o placeholder) + `status` a governare il ciclo di vita. |
| C2 | `email_otp` legata a `quote_uuid` (FK+NN) | Creare **`staff_otp`** dedicata, non riusare `email_otp`. |
| C3 | Nessuna migration per `staff*` nel repo | Creare la **migration canonica** che documenta lo stato attuale + le aggiunte (idempotente). |
| C4 | `staff_invites`/`staff_otp`/`staff_trusted_devices` **non esistono** | Nessun conflitto di naming: tabelle nuove pulite. |
| C5 | `/api/staff/auth/seed` vivo in prod, `secret == STAFF_JWT_SECRET` | Backdoor: rimuovere/lockare (vedi §5). |
| C6 | Prod↔staging divergono (staging non introspezionabile: anon 401) | Migration **idempotenti** (`IF NOT EXISTS` / `ADD COLUMN IF NOT EXISTS`). |

---

## 2. Modello dati target (idempotente)

### 2.1 `staff` — colonne aggiunte
```
ALTER TABLE staff
  ALTER COLUMN password_hash DROP NOT NULL,              -- C1: null finché non impostata
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active'
        CHECK (status IN ('invited','active','suspended')),
  ADD COLUMN IF NOT EXISTS email_verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS invited_by uuid REFERENCES staff(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS password_set_at timestamptz,
  ADD COLUMN IF NOT EXISTS failed_login_count int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS locked_until timestamptz;
```
- `status`: `invited` (creato da invito, non ha ancora password) → `active` (email verificata + password impostata) → `suspended`.
- Gli account **esistenti** restano `active` ma con `email_verified_at = NULL` → trattati come "da verificare" (vedi §3E).

### 2.2 `staff_invites` (nuova — modellata su `org_invites`)
```
id uuid PK, email text NN, role text NN, full_name text,
invited_by uuid FK→staff.id, token_hash text NN,           -- hash del token, non il token in chiaro
status text NN DEFAULT 'pending' CHECK (pending|accepted|revoked|expired),
expires_at timestamptz NN DEFAULT now()+'48 hours',        -- invito più corto di org (48h)
accepted_at timestamptz, email_sent_at timestamptz, email_error text,
created_at timestamptz NN DEFAULT now()
UNIQUE (email) WHERE status='pending'                       -- un solo invito pending per email
```

### 2.3 `staff_otp` (nuova — OTP login step-up + reset)
```
id uuid PK, staff_id uuid NN FK→staff.id ON DELETE CASCADE,
purpose text NN CHECK (purpose IN ('login','password_reset','email_verify')),
code_hash text NN,                                         -- SHA-256 del codice 6 cifre (riusa otp.ts hashCode)
expires_at timestamptz NN,                                 -- +10 min (OTP_TTL_MS esistente)
attempts int NN DEFAULT 0,                                 -- max 5 (OTP_MAX_ATTEMPTS esistente)
consumed_at timestamptz, ip_address text, created_at timestamptz NN DEFAULT now()
```

### 2.4 `staff_trusted_devices` (nuova — "ricorda 7gg")
```
id uuid PK, staff_id uuid NN FK→staff.id ON DELETE CASCADE,
device_token_hash text NN,                                 -- hash del token nel cookie httpOnly firmato
label text, ip_address text, user_agent text,
last_used_at timestamptz, expires_at timestamptz NN DEFAULT now()+'7 days',
created_at timestamptz NN DEFAULT now()
UNIQUE (staff_id, device_token_hash)
```

### 2.5 Riuso
- `otp.ts`: `generateOtpCode`, `hashCode`, `randomSessionToken`, TTL/max — riusati per `staff_otp`.
- `staff_sessions`: invariata (revoca già ok).
- Email: **Resend** (come newsletter/support) per invito, OTP, reset.

---

## 3. Flussi

### A) Creazione staff (invito)
1. Admin (super_admin) apre **modale "Invita staff"** → email + ruolo (+ nome opzionale).
2. Backend: crea `staff` con `status='invited'`, `password_hash=NULL`; crea `staff_invites` (token random, `token_hash` a DB, TTL 48h); invia email Resend con link `…/staff/invito?token=…`.
3. Nuovo staff apre il link → **pagina pubblica** "Imposta il tuo accesso": mostra email (read-only), chiede **password** (+ conferma, policy min 10, controllo forza).
4. Submit valido → `password_hash` impostato, `password_set_at=now()`, `email_verified_at=now()` (il possesso del link **prova** l'email), `status='active'`, invito → `accepted`. Redirect al login.
5. Token scaduto/usato → errore + possibilità di reinvio dall'admin.

### B) Login (password + OTP step-up)
1. email+password → bcrypt (come ora) + check `status='active'` e non `locked_until`.
2. **Device fidato?** (cookie `rm_staff_device` valido e presente in `staff_trusted_devices` non scaduto) → **JWT diretto** (come oggi) → dashboard.
3. **Device NON fidato** → genera `staff_otp` (purpose=login), invia codice 6 cifre via email; risposta "OTP richiesto" (NO token ancora).
4. Utente inserisce codice → verifica `staff_otp` (hash, TTL, attempts) → se ok: crea `staff_trusted_devices` (7gg) + set cookie firmato httpOnly → **JWT** → dashboard.
5. Password errata → `failed_login_count++`; oltre soglia (es. 8) → `locked_until=now()+15min`.

### C) Reset password
1. Login → "Password dimenticata" → email → se staff attivo, `staff_otp(purpose=password_reset)` + email con codice/link.
2. Verifica codice → pagina "Nuova password" → set hash → **revoca tutte le `staff_sessions`** dello staff (logout globale).

### D) Sospensione / rimozione
- `status='suspended'` o `is_active=false` → login negato; `getStaffFromRequest` già rifiuta i non-attivi. Rimozione = come oggi (staff/[id]).

### E) Bootstrap + fix del TUO account "fantasma" (senza lockout)
- Nessuna ricreazione. Al **primo login dopo il rollout**, ogni account con `email_verified_at IS NULL` viene trattato come **device non fidato** → parte l'**OTP** verso la sua email → alla verifica si setta `email_verified_at` → account "sano". Se l'email a DB è sbagliata, un super_admin la corregge da `staff/[id]` prima.
- Il **primo super_admin** (bootstrap iniziale a DB vuoto) si crea con una migration seed **una-tantum** (non un endpoint HTTP), poi si verifica via OTP.

---

## 4. API (contratti — nessun codice qui)
| Metodo | Endpoint | Scopo | Auth |
|---|---|---|---|
| POST | `/api/staff/admin/staff/invite` | crea invito + email | super_admin |
| POST | `/api/staff/admin/staff/invite/[id]/resend` | reinvia invito | super_admin |
| GET  | `/api/staff/invite/verify?token=` | valida token invito (pagina pubblica) | pubblico (token) |
| POST | `/api/staff/invite/accept` | imposta password, attiva account | pubblico (token) |
| POST | `/api/staff/auth/login` | **modificato**: ritorna `otp_required` se device nuovo | pubblico + rate-limit |
| POST | `/api/staff/auth/otp/verify` | verifica OTP login → JWT + trust device | pubblico (sessione OTP) |
| POST | `/api/staff/auth/password/forgot` | avvia reset (OTP email) | pubblico + rate-limit |
| POST | `/api/staff/auth/password/reset` | imposta nuova password | pubblico (OTP) |
| ~~POST~~ | ~~`/api/staff/auth/seed`~~ | **RIMOSSO** (vedi §5) | — |
| POST | `/api/staff/admin/staff` (create diretto) | **deprecato** in favore dell'invito (o solo super_admin, con `status='invited'`) | super_admin |

## 5. Hardening di sicurezza (indipendente dai flussi)
1. **Rimuovere `/api/staff/auth/seed`** (o gate dietro `ALLOW_STAFF_SEED=1` + secret **dedicato** ≠ JWT, solo per bootstrap locale). Raccomandato: **rimozione**, bootstrap via migration.
2. **Separare i segreti**: `STAFF_JWT_SECRET` (firma JWT) ≠ eventuale secret bootstrap. Oggi coincidono → un leak = takeover totale.
3. **Rate-limit durevole** su invite/otp/reset/login. ⚠️ Nota: `checkRateLimit` di `lib/security.ts` è **no-op su serverless** (vedi memoria [[reference_ratelimit_vercel.md]]) → usare la versione durable (Redis/Upstash o contatore Postgres) per questi endpoint, altrimenti l'OTP è brute-forzabile.
4. **Token invito/reset**: solo `token_hash` a DB, single-use, TTL corti (48h / 15min).
5. **OTP**: hash a DB, TTL 10min, max 5 tentativi (già in `otp.ts`), invalidazione dopo uso.
6. **Cookie trusted-device**: `httpOnly`, `Secure`, `SameSite=Strict`, firmato; a DB solo l'hash.
7. **Audit reale**: `staff_audit_log` con `staff_id` reale dell'attore (oggi certi log usano attore `'system'`).
8. **Policy password**: min 10, blocklist banali, bcrypt cost ≥ 10.

## 6. UI Admin (pagine/modali — coerenti con la regola "azioni importanti = modale/pagina")
- **Lista staff**: badge `status` (invited/active/suspended), "ultimo accesso", "email verificata ✓/—".
- **Modale "Invita staff"** (email + ruolo).
- **Pagina pubblica "Accetta invito / imposta password"**.
- **Login**: step aggiuntivo "Inserisci il codice inviato a m…@dominio" quando `otp_required`.
- **Pagina "Password dimenticata" / "Nuova password"**.
- Riga staff: azioni reinvia-invito, sospendi, reset password (da admin), rimuovi.

## 7. Rollout (ordine sicuro, zero-lockout)
1. **Migration idempotente** (colonne + 3 tabelle nuove) su **staging**, poi prod. Non tocca account esistenti (restano `active`).
2. Deploy backend nuovi endpoint (invite/otp/reset) — **login resta retrocompatibile** finché non si attiva lo step-up.
3. Deploy UI admin (invito) + pagine pubbliche.
4. **Attivare lo step-up OTP** dietro un flag (`STAFF_OTP_ENABLED`) — prima su staging.
5. **Rimuovere `/auth/seed`** dopo aver confermato il bootstrap del primo super_admin.
6. Verifica email degli account esistenti (incluso il tuo) via primo OTP.

## 8. Cosa NON cambia
- Firma JWT HS256 + `staff_sessions` (revoca) — invariati.
- `getStaffFromRequest` (verifica staff attivo) — invariato, si aggiunge solo il check `status`.
- Separazione staff/clienti — rafforzata, non modificata.

---

### Aperto / da confermare
- **A]** Rimozione totale del seed endpoint vs gate con flag? (raccomando rimozione)
- **B]** Rate-limit durevole: Upstash Redis (serve env) o contatore Postgres? (memoria [[reference_ratelimit_vercel.md]])
- **C]** Dump **staging** reale: serve service_role o connection string staging validi (l'anon key in `admin/.env.staging` dà 401).
