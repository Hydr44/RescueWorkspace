# 📋 COPIA QUESTO SQL su Supabase

## ⚡ Quick Fix - Inserisci Certificato

**Esegui questo sul server per generare SQL completo**:

```bash
ssh root@217.154.118.37
```

Poi copia e incolla questo comando:

```bash
cat > /tmp/insert_final.sql << 'SQLEND'
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
SQLEND

# Aggiungi certificato
echo "  E'" >> /tmp/insert_final.sql
cat /tmp/cert_clean.pem >> /tmp/insert_final.sql
echo "'," >> /tmp/insert_final.sql

# Aggiungi chiave
echo "  E'" >> /tmp/insert_final.sql
cat /tmp/key_clean.pem >> /tmp/insert_final.sql
echo "'," >> /tmp/insert_final.sql

# Fine SQL
cat >> /tmp/insert_final.sql << 'SQLEND2'
  'Salvatore05',
  'demo',
  '2025-12-01'::date,
  '2027-12-01'::date,
  true,
  true
);
SQLEND2

echo "✅ SQL completo generato!"
echo "📋 Copia tutto l'output di questo comando:"
cat /tmp/insert_final.sql
```

---

## 📋 Poi:

1. Copia tutto l'output del comando sopra
2. Vai su Supabase SQL Editor
3. Incolla
4. Run Query
5. ✅ Fatto!

---

**Oppure esegui questo per vedere il SQL:**

```bash
ssh root@217.154.118.37 "cat /tmp/insert_cert_clean.sql"
```

