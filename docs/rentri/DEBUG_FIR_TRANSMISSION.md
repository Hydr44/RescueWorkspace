# 🐛 Debug Trasmissione FIR - Errore 401

## Problema

```
POST https://rescuemanager.eu/api/rentri/fir/trasmetti
Status: 401 Unauthorized
```

Il backend riceve la richiesta ma RENTRI rifiuta l'autenticazione JWT.

---

## Possibili Cause

### 1. Certificato Non Aggiornato
L'UPDATE SQL potrebbe non essere stato eseguito. Il certificato ha ancora i "Bag Attributes".

**Verifica**:
```sql
SELECT 
  cf_operatore,
  SUBSTRING(certificate_pem, 1, 50) as cert_start,
  SUBSTRING(private_key_pem, 1, 50) as key_start
FROM rentri_org_certificates
WHERE cf_operatore = 'SCZMNL05L21D960T';
```

**Deve mostrare**:
```
cert_start: "-----BEGIN CERTIFICATE-----\nMIIDGDCCAr+gAwIBAgIEBf"
key_start: "-----BEGIN PRIVATE KEY-----\nMIGHAgEAMBMGByqGSM49Ag"
```

**NON deve contenere**: "Bag Attributes"

### 2. JWT Non Valido
Il JWT generator potrebbe avere problemi con il formato del certificato.

### 3. Endpoint RENTRI Gateway Errato
L'URL potrebbe non puntare correttamente al gateway RENTRI.

### 4. Certificato Non Accettato da RENTRI
RENTRI potrebbe non riconoscere il certificato (problema con CA chain).

---

## Debug Steps

### Step 1: Verifica Certificato nel DB

```sql
-- Controlla che sia pulito
SELECT 
  id,
  cf_operatore,
  LENGTH(certificate_pem) as cert_len,
  LENGTH(private_key_pem) as key_len,
  CASE 
    WHEN certificate_pem LIKE '%Bag Attributes%' THEN '❌ NON PULITO'
    ELSE '✅ PULITO'
  END as cert_status,
  CASE 
    WHEN private_key_pem LIKE '%Bag Attributes%' THEN '❌ NON PULITO'
    ELSE '✅ PULITO'
  END as key_status
FROM rentri_org_certificates
WHERE cf_operatore = 'SCZMNL05L21D960T';
```

### Step 2: Controlla Logs Vercel

1. Vai su https://vercel.com/hydr44s-projects/web
2. Click ultimo deployment
3. Tab "Functions"
4. Cerca logs di `/api/rentri/fir/trasmetti`
5. Cerca errori `[RENTRI-FIR]` o `[RENTRI-JWT]`

### Step 3: Test JWT Manuale

```bash
# Sul VPS, genera JWT manualmente
ssh root@217.154.118.37

# Crea script test JWT
cat > /tmp/test-jwt.js << 'EOF'
const crypto = require('crypto');
const fs = require('fs');

const cert = fs.readFileSync('/etc/nginx/ssl/rentri/cert_clean.pem', 'utf-8');
const key = fs.readFileSync('/etc/nginx/ssl/rentri/key_clean.pem', 'utf-8');

// ... genera JWT ...
// ... testa con RENTRI ...
EOF

node /tmp/test-jwt.js
```

---

## Soluzioni Immediate

### Soluzione A: Usa SQL per Inserire Certificato Pulito

Se l'UPDATE non ha funzionato, elimina e reinserisci:

```sql
-- 1. Elimina vecchio
DELETE FROM rentri_org_certificates 
WHERE cf_operatore = 'SCZMNL05L21D960T';

-- 2. Reinserisci con UPDATE_CERT_CLEAN.sql
-- (Copia tutto il contenuto di UPDATE_CERT_CLEAN.sql ma usa INSERT invece di UPDATE)
```

### Soluzione B: Ricarica dalla UI

```
1. Elimina certificato dal DB (SQL sopra)
2. Ricarica app
3. Upload certificato di nuovo
4. Ora VPS pulisce automaticamente
```

### Soluzione C: Controlla Logs Vercel

I logs del backend diranno esattamente cosa sta fallendo:
- JWT generation error?
- RENTRI API connection error?
- Certificate format error?

---

## Prossimi Step

1. ✅ **Verifica che UPDATE sia andato a buon fine** (SQL Step 1 sopra)
2. ⏳ **Controlla logs Vercel** per vedere errore esatto
3. ⏳ **Riprova trasmissione** dopo verifica

---

**Esegui il SQL di verifica (Step 1) e dimmi cosa mostra!** 🔍

Questo ci dirà se il certificato è effettivamente pulito o no.

