# 🔐 Configurazione Reset Password Supabase

**Data**: 3 Dicembre 2025  
**Progetto**: ienzdgrqalltvkdkuamp (RescueManager)

---

## 📋 Configurazioni Necessarie su Supabase Dashboard

### 1. **Redirect URLs** (CRITICO)

**Percorso**: `Authentication → URL Configuration`

Aggiungi queste URL alla whitelist:

```
✅ https://rescuemanager.eu/update-password
✅ https://rescuemanager.eu/login
✅ https://rescuemanager.eu/auth/callback
✅ https://rescuemanager.eu/**
```

**Come fare**:
```
1. Vai su: https://supabase.com/dashboard/project/ienzdgrqalltvkdkuamp
2. Authentication → URL Configuration
3. Scroll a "Redirect URLs"
4. Aggiungi ogni URL sopra (uno per riga)
5. Click "Save"
```

---

### 2. **Site URL**

**Percorso**: `Authentication → URL Configuration`

Verifica che sia impostato:

```
Site URL: https://rescuemanager.eu
```

---

### 3. **Email Templates** (Opzionale ma Consigliato)

**Percorso**: `Authentication → Email Templates → Reset Password`

#### Template Predefinito (già funzionante)
Supabase usa un template di default che funziona, ma puoi personalizzarlo:

**Subject**:
```
Reimposta la tua password - RescueManager
```

**Body** (HTML personalizzato):
```html
<h2>Ciao!</h2>

<p>Hai richiesto di reimpostare la password per il tuo account RescueManager.</p>

<p>Clicca sul link qui sotto per impostare una nuova password:</p>

<p><a href="{{ .ConfirmationURL }}">Reimposta Password</a></p>

<p>Oppure copia e incolla questo link nel tuo browser:</p>
<p>{{ .ConfirmationURL }}</p>

<p><strong>Questo link scadrà tra 1 ora.</strong></p>

<p>Se non hai richiesto questa operazione, puoi ignorare questa email.</p>

<hr>
<p style="color: #666; font-size: 12px;">
  RescueManager - Sistema di gestione trasporti e demolizioni<br>
  <a href="https://rescuemanager.eu">rescuemanager.eu</a>
</p>
```

**Note**:
- `{{ .ConfirmationURL }}` viene sostituito automaticamente con il link magico
- Il link contiene il token e reindirizza a `/update-password`

---

### 4. **Email Auth Settings**

**Percorso**: `Authentication → Providers → Email`

Verifica che sia:
```
✅ Email provider: Enabled
✅ Confirm email: Enabled (opzionale)
✅ Secure email change: Enabled (consigliato)
```

---

### 5. **Email Rate Limiting**

**Percorso**: `Authentication → Rate Limits`

Configurazione consigliata:
```
Password Reset Emails: 3 per ora per email
(Previene abuso del sistema)
```

---

## 🔧 Configurazione SMTP (Se Email non Arrivano)

Se le email di reset non arrivano, potrebbe essere necessario configurare SMTP personalizzato:

**Percorso**: `Project Settings → Auth → SMTP Settings`

### Opzione A: Usa SMTP Supabase (Default)
```
✅ Invia da: noreply@mail.app.supabase.io
✅ Funziona out-of-the-box
⚠️ Potrebbe finire in spam
```

### Opzione B: SMTP Personalizzato (Consigliato per Produzione)

**Provider consigliati**:
- **SendGrid** (gratis 100 email/giorno)
- **Mailgun** (gratis 5000 email/mese)
- **AWS SES** (gratis 62k email/mese)
- **Gmail SMTP** (per test)

**Esempio configurazione Gmail SMTP**:
```
SMTP Host: smtp.gmail.com
SMTP Port: 587
SMTP User: tua-email@gmail.com
SMTP Password: [App Password - non la password normale!]
Sender Email: tua-email@gmail.com
Sender Name: RescueManager
```

**Come ottenere Gmail App Password**:
```
1. Vai su: https://myaccount.google.com/apppasswords
2. Crea "App Password" per "Mail"
3. Copia la password generata (16 caratteri)
4. Usala nel campo SMTP Password su Supabase
```

---

## 🧪 Test Configurazione

### Test 1: Verifica Redirect URLs

```bash
# Controlla che il redirect funzioni
curl -I "https://ienzdgrqalltvkdkuamp.supabase.co/auth/v1/verify?token=test&type=recovery&redirect_to=https://rescuemanager.eu/update-password"
```

**Risposta attesa**: `HTTP/1.1 302` (redirect)

### Test 2: Test Reset Password End-to-End

```bash
# 1. Richiedi reset
curl -X POST "https://ienzdgrqalltvkdkuamp.supabase.co/auth/v1/recover" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImllbnpkZ3JxYWxsdHZrZGt1YW1wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxNzcwNDUsImV4cCI6MjA3Mzc1MzA0NX0.sj4ZQJcSMjGkqpizDgmUDImm9esIvTLrsPOT0IIBegA" \
  -H "Content-Type: application/json" \
  -d '{"email": "tua-email@example.com"}'
```

**Risposta attesa**:
```json
{}
```
(Email inviata in background)

### Test 3: Verifica Email Template

```
1. Vai su: Authentication → Email Templates → Reset Password
2. Click "Send test email"
3. Inserisci tua email
4. Verifica ricezione (anche spam!)
```

---

## 📊 Checklist Configurazione

### Minimo Richiesto
- [ ] Site URL: `https://rescuemanager.eu`
- [ ] Redirect URL: `https://rescuemanager.eu/update-password` aggiunto
- [ ] Email provider: Enabled

### Consigliato
- [ ] Redirect URL: `https://rescuemanager.eu/**` aggiunto (wildcard)
- [ ] Email template personalizzato
- [ ] Rate limiting configurato

### Opzionale (Produzione)
- [ ] SMTP personalizzato (SendGrid/Mailgun)
- [ ] Email customizzate con logo aziendale
- [ ] Domain email personalizzato (es: noreply@rescuemanager.eu)

---

## 🔍 Troubleshooting

### Problema: Email non arriva

**Soluzioni**:
1. ✅ Controlla spam/junk folder
2. ✅ Verifica che l'email sia registrata su Supabase (Authentication → Users)
3. ✅ Controlla rate limiting (max 3 email/ora per default)
4. ✅ Verifica SMTP settings (se configurato)
5. ✅ Test con email diversa (Gmail, Outlook, etc.)

### Problema: Link non funziona

**Soluzioni**:
1. ✅ Verifica Redirect URLs configurate
2. ✅ Controlla che il link non sia scaduto (1 ora default)
3. ✅ Verifica che il deploy Vercel sia completato
4. ✅ Prova in modalità incognito (cache browser)

### Problema: "Invalid token" o "Expired token"

**Cause**:
- Token scaduto (1 ora)
- Token già usato (usa-e-getta)
- URL redirect non autorizzato

**Soluzione**:
- Richiedi nuovo link reset
- Verifica Redirect URLs su Supabase

---

## 🚀 Quick Setup (Copy-Paste)

### Redirect URLs da aggiungere:
```
https://rescuemanager.eu/update-password
https://rescuemanager.eu/login
https://rescuemanager.eu/auth/callback
https://rescuemanager.eu/**
```

### Site URL:
```
https://rescuemanager.eu
```

### Email Template Subject:
```
Reimposta la tua password - RescueManager
```

---

## 📝 Note Importanti

1. **Token Expiration**: I link di reset scadono dopo **1 ora** (default Supabase)
2. **One-Time Use**: Ogni link può essere usato **una sola volta**
3. **Rate Limiting**: Max **3 richieste/ora** per email per prevenire abuso
4. **Wildcard URL**: `https://rescuemanager.eu/**` permette qualsiasi sotto-path
5. **HTTPS Only**: Supabase accetta solo URL HTTPS in produzione

---

## ✅ Verifica Finale

Dopo aver configurato tutto:

1. [ ] Vai su https://rescuemanager.eu/reset
2. [ ] Inserisci email valida
3. [ ] Verifica ricezione email (anche spam)
4. [ ] Click link nell'email
5. [ ] Verifica redirect a /update-password
6. [ ] Imposta nuova password
7. [ ] Verifica login con nuova password

---

**Status Configurazione**: ⏳ DA COMPLETARE

**Azioni Richieste**:
1. Accedi a Supabase Dashboard
2. Aggiungi Redirect URLs
3. Verifica Site URL
4. (Opzionale) Personalizza email template
5. Test completo

---

**Link Rapidi**:
- Dashboard: https://supabase.com/dashboard/project/ienzdgrqalltvkdkuamp
- Auth Settings: https://supabase.com/dashboard/project/ienzdgrqalltvkdkuamp/auth/url-configuration
- Email Templates: https://supabase.com/dashboard/project/ienzdgrqalltvkdkuamp/auth/templates

