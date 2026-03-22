-- Inserisci certificato RENTRI DEMO per la tua org
-- Esegui questo su Supabase SQL Editor

-- Trova il tuo org_id (quello che usi nell'app)
SELECT id, name FROM orgs ORDER BY created_at DESC LIMIT 5;

-- Dopo aver identificato l'org_id giusto, esegui questo INSERT
-- Sostituisci <ORG_ID> con il tuo UUID

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
  '6b4a96a6-3808-4fff-a7d2-bdf2764c71c5', -- ← Org "scozz" (cambia se usi altra org)
  'SCZMNL05L21D960T',
  'SCOZZARINI EMMANUEL SALVATORE',
  '-----BEGIN CERTIFICATE-----
MIIGaTCCBFGgAwIBAgIQY2l3jdNfWo/YogP1IXqzszANBgkqhkiG9w0BAQwFADCB
hzELMAkGA1UEBhMCVVMxETAPBgNVBAgTCE5ldyBZb3JrMREwDwYDVQQHEwhOZXcg
WW9yazEfMB0GA1UEChMWU1NMLmNvbSBDb3Jwb3JhdGlvbjExMC8GA1UEAxMoU1NM
LmNvbSBEb2N1bWVudCBTaWduaW5nIEludGVybWVkaWF0ZSBDQTAEFHSW1lMRgw
FgYDVQQDDA9TQ09aWkFSSU5JIEVNTUFOVUVMIFNBTFZBVE9SRTEYMBZCCQGDVQRF
ExVDRjpJVC1TQ1pNTkwwNUwyMUQ5NjBUMSQwIgYDVQQKDBtTQ09aWkFSSU5JIEVE
TUFOVUVMIFNBTFZBVE9SRTENMAsGA1UEKgwERU1NQU5VRUwxEjAQBgNVBAQMCVNB
TFZBVE9SRTERMA8GA1UEBRMIVEVTVFVTRVIxCzAJBgNVBAYTAklUMIIBIjANBgkq
hkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAo8VXsQKqv9LKF3WZb8fKxGPGNqI/XJTr
Jt8F... (continua con certificato completo)
-----END CERTIFICATE-----',
  '-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCjxVexAqq/0soX
dZlvx8rEY8Y2oj9clOsm3wXP... (continua con chiave privata)
-----END PRIVATE KEY-----',
  'Salvatore05',
  'demo',
  '2025-12-01 00:00:00',
  '2027-12-01 00:00:00',
  true,
  true
)
ON CONFLICT (org_id, environment, is_default) 
WHERE is_default = true
DO UPDATE SET
  is_active = true,
  updated_at = NOW();

-- Verifica inserimento
SELECT 
  org_id,
  cf_operatore,
  environment,
  is_active,
  is_default,
  expires_at
FROM rentri_org_certificates
WHERE org_id = '6b4a96a6-3808-4fff-a7d2-bdf2764c71c5';

