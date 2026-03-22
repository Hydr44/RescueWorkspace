# ⚡ Quick Fix: Inserisci Certificato RENTRI nel DB

**Problema**: Backend non trova certificato per l'org  
**Soluzione**: Inserisci nella tabella `rentri_org_certificates`

---

## 🔧 Opzione A: SQL Diretto (2 Min)

### Step 1: Trova il Tuo org_id

```sql
-- Su Supabase SQL Editor
SELECT id, name FROM orgs ORDER BY created_at DESC LIMIT 5;

-- Prendi l'UUID della org che usi (es: "scozz")
-- Es: 6b4a96a6-3808-4fff-a7d2-bdf2764c71c5
```

### Step 2: Ottieni Certificato e Chiave dal Server

```bash
# Connettiti al server
ssh root@217.154.118.37

# Mostra certificato
cat /etc/nginx/ssl/rentri/SCZMNL05L21D960T.cert.pem

# Mostra chiave
cat /etc/nginx/ssl/rentri/SCZMNL05L21D960T.key.pem
```

### Step 3: Inserisci nel DB

```sql
-- Copia tutto il certificato (da -----BEGIN a -----END)
-- Copia tutta la chiave (da -----BEGIN a -----END)

INSERT INTO rentri_org_certificates (
  org_id,
  cf_operatore,
  ragione_sociale,
  certificate_pem,
  private_key_pem,
  certificate_password,
  environment,
  issued_at,
  expires_at,
  is_active,
  is_default,
  created_at
) VALUES (
  '6b4a96a6-3808-4fff-a7d2-bdf2764c71c5', -- ← TUO org_id
  'SCZMNL05L21D960T',
  'SCOZZARINI EMMANUEL SALVATORE',
  '-----BEGIN CERTIFICATE-----
[INCOLLA QUI CERTIFICATO COMPLETO]
-----END CERTIFICATE-----',
  '-----BEGIN PRIVATE KEY-----
[INCOLLA QUI CHIAVE PRIVATA COMPLETA]
-----END PRIVATE KEY-----',
  'Salvatore05',
  'demo',
  '2025-12-01 00:00:00+00',
  '2027-12-01 00:00:00+00',
  true,
  true,
  NOW()
);

-- Verifica
SELECT id, org_id, cf_operatore, environment, is_active 
FROM rentri_org_certificates;
```

---

## ⚡ Opzione B: Usa Script sul Server (30 Sec)

```bash
# SSH al server
ssh root@217.154.118.37

# Script che inserisce certificato via API
curl -X POST "https://ienzdgrqalltvkdkuamp.supabase.co/rest/v1/rentri_org_certificates" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImllbnpkZ3JxYWxsdHZrZGt1YW1wIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODE3NzA0NSwiZXhwIjoyMDczNzUzMDQ1fQ.YOUR_SERVICE_KEY" \
  -H "Authorization: Bearer YOUR_SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d @- << 'EOF'
{
  "org_id": "6b4a96a6-3808-4fff-a7d2-bdf2764c71c5",
  "cf_operatore": "SCZMNL05L21D960T",
  "ragione_sociale": "SCOZZARINI EMMANUEL SALVATORE",
  "certificate_pem": "...",
  "private_key_pem": "...",
  "environment": "demo",
  "is_active": true,
  "is_default": true
}
EOF
```

---

## 🎯 Più Semplice: Copia Files dal Server

### Script Completo

```bash
# 1. Connetti
ssh root@217.154.118.37

# 2. Prepara INSERT con files
cat > /tmp/insert_cert.sql << 'EOFINSERT'
INSERT INTO rentri_org_certificates (
  org_id,
  cf_operatore,
  ragione_sociale,
  certificate_pem,
  private_key_pem,
  certificate_password,
  environment,
  issued_at,
  expires_at,
  is_active,
  is_default
) VALUES (
  '6b4a96a6-3808-4fff-a7d2-bdf2764c71c5',
  'SCZMNL05L21D960T',
  'SCOZZARINI EMMANUEL SALVATORE',
  '$(cat /etc/nginx/ssl/rentri/SCZMNL05L21D960T.cert.pem | sed "s/'/''/g")',
  '$(cat /etc/nginx/ssl/rentri/SCZMNL05L21D960T.key.pem | sed "s/'/''/g")',
  'Salvatore05',
  'demo',
  '2025-12-01',
  '2027-12-01',
  true,
  true
);
EOFINSERT

# 3. Mostra SQL generato
cat /tmp/insert_cert.sql

# 4. Copia output e esegui su Supabase SQL Editor
```

---

## 💡 Quick Workaround

Se non riesci subito, **disabilita il check certificato temporaneamente**:

Nel backend `trasmetti/route.ts`, commenta temporaneamente il check:

```typescript
// Bypass certificato per test
const cert = {
  cf_operatore: 'SCZMNL05L21D960T',
  certificate_pem: '...',
  private_key_pem: '...'
};
```

---

**🎯 Segui Opzione A (più semplice) e riprova!**

**Hai il certificato sul server, devi solo inserirlo nel DB Supabase!** 🔐

