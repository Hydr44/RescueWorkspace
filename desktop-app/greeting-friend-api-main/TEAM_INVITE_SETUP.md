# 📧 Sistema Inviti Team - Guida Setup Completo

Sistema di inviti automatici via email per aggiungere membri al team con registrazione guidata.

## 🎯 Funzionalità

- ✅ Invio email automatico da `noreply@rescuemanager.eu`
- ✅ Template email professionale con branding
- ✅ Link di accettazione con token sicuro
- ✅ Pagina registrazione guidata
- ✅ Auto-login dopo registrazione
- ✅ Supporto tutti i ruoli: owner, admin, manager, operator, viewer

## 📋 Prerequisiti

### 1. Account Resend (Email Provider)

1. Vai su https://resend.com
2. Crea account gratuito (100 email/giorno gratis)
3. Verifica dominio `rescuemanager.eu`:
   - Aggiungi record DNS:
     ```
     TXT _resend.rescuemanager.eu → "resend-verify=xxx"
     ```
4. Copia API Key da Dashboard → API Keys

### 2. Configurazione DNS

Aggiungi questi record DNS per `rescuemanager.eu`:

```dns
# SPF (Sender Policy Framework)
TXT @ → "v=spf1 include:_spf.resend.com ~all"

# DKIM (DomainKeys Identified Mail)
TXT resend._domainkey → "v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC..." (fornito da Resend)

# DMARC (Domain-based Message Authentication)
TXT _dmarc → "v=DMARC1; p=none; rua=mailto:dmarc@rescuemanager.eu"
```

## 🚀 Setup Passo-Passo

### Step 1: Applica Migrazioni Database

Vai su Supabase Dashboard → SQL Editor ed esegui in ordine:

#### A) Fix Bug Esistenti
```sql
-- 1. Fix vehicles (colonne mancanti)
-- Copia contenuto da: supabase/migrations/20260221_create_vehicles_table.sql

-- 2. Fix quotes (client_id tipo uuid)
-- Copia contenuto da: supabase/migrations/20260221_fix_quotes_client_id_type.sql

-- 3. Fix org_members (ruoli)
-- Copia contenuto da: supabase/migrations/20260221_fix_org_members_roles.sql
```

#### B) Sistema Inviti
```sql
-- 4. Setup sistema inviti
-- Copia contenuto da: supabase/migrations/20260221_team_invite_system.sql
```

### Step 2: Deploy Edge Function

```bash
cd desktop-app/greeting-friend-api-main

# Login Supabase CLI
npx supabase login

# Link al progetto
npx supabase link --project-ref ienzdgrqalltvkdkuamp

# Deploy Edge Function
npx supabase functions deploy send-team-invite
```

### Step 3: Configura Variabili Ambiente

Vai su Supabase Dashboard → Edge Functions → send-team-invite → Settings:

Aggiungi questi secrets:

```env
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx
APP_URL=https://app.rescuemanager.eu
```

### Step 4: Configura Webhook Database

Vai su Supabase Dashboard → Database → Webhooks:

1. Crea nuovo webhook:
   - **Name**: `team-invite-email`
   - **Table**: `org_invites`
   - **Events**: `INSERT`
   - **Type**: `HTTP Request`
   - **Method**: `POST`
   - **URL**: `https://ienzdgrqalltvkdkuamp.supabase.co/functions/v1/send-team-invite`
   - **Headers**:
     ```
     Authorization: Bearer YOUR_ANON_KEY
     Content-Type: application/json
     ```

### Step 5: Test Completo

1. **Vai in Settings → Team**
2. **Clicca "Invita Membro"**
3. **Inserisci email**: `test@example.com`
4. **Scegli ruolo**: Operator
5. **Clicca "Invia Invito"**

✅ **Cosa succede:**
- Record creato in `org_invites` con token univoco
- Webhook trigger → Edge Function chiamata
- Email inviata a `test@example.com` da `noreply@rescuemanager.eu`
- Email contiene link: `https://app.rescuemanager.eu/accept-invite?token=abc123...`

6. **Apri email** (controlla spam se non arriva)
7. **Clicca "Accetta Invito"**
8. **Compila form registrazione**
9. **Utente aggiunto al team automaticamente!**

## 📧 Template Email

L'email inviata include:

- 🎨 Design professionale con gradiente
- 📋 Info organizzazione e ruolo
- 🔗 Pulsante CTA "Accetta Invito"
- ⏰ Data scadenza invito (7 giorni)
- 📱 Responsive per mobile

## 🔧 Troubleshooting

### Email non arriva

1. **Controlla spam/junk**
2. **Verifica DNS**: `dig TXT rescuemanager.eu`
3. **Controlla Resend Dashboard** → Logs
4. **Verifica webhook Supabase** → Database → Webhooks → Logs

### Errore "Invito non valido"

- Token scaduto (>7 giorni)
- Invito già utilizzato
- Link corrotto (copia/incolla completo)

### Errore registrazione

- Email già registrata → Usa login normale
- Password troppo corta (min 8 caratteri)
- Problema RLS → Controlla policy `org_invites`

## 📊 Monitoraggio

### Supabase Dashboard

- **Edge Functions → send-team-invite → Logs**: Vedi invii email
- **Database → org_invites**: Vedi tutti gli inviti (status: pending/accepted/expired)
- **Database → Webhooks → Logs**: Vedi trigger webhook

### Resend Dashboard

- **Logs**: Vedi tutte le email inviate
- **Analytics**: Tasso apertura, click, bounce
- **Domains**: Verifica health DNS

## 💰 Costi

- **Resend Free**: 100 email/giorno, 3.000/mese
- **Resend Pro**: $20/mese → 50.000 email/mese
- **Supabase Edge Functions**: Incluse nel piano (500k invocazioni/mese)

## 🔐 Sicurezza

- ✅ Token univoci 32 byte (hex)
- ✅ Scadenza automatica 7 giorni
- ✅ Link usa-e-getta (status → accepted)
- ✅ RLS su org_invites
- ✅ Email verificata via Resend

## 📝 Prossimi Miglioramenti

- [ ] Email reminder dopo 3 giorni se non accettato
- [ ] Notifica admin quando invito accettato
- [ ] Personalizzazione template email per org
- [ ] Inviti bulk (CSV upload)
- [ ] Analytics inviti (tasso accettazione)

---

## 🎉 Fine Setup!

Ora il sistema inviti è completamente funzionante. Ogni volta che inviti qualcuno da Settings → Team, riceverà automaticamente un'email professionale con link per registrarsi e unirsi al team.

**Supporto**: support@rescuemanager.eu
