-- ============================================
-- INSERT CERTIFICATO RENTRI DEMO
-- Estratto con OpenSSL da SCZMNL05L21D960T (1).p12
-- Password: 6o^Z+waO
-- ============================================
-- 
-- ISTRUZIONI:
-- 1. Vai su Supabase Dashboard
-- 2. SQL Editor
-- 3. Copia e incolla questo SQL
-- 4. Esegui
-- 
-- ============================================


-- INSERT Certificato RENTRI DEMO (Estratto con OpenSSL)
-- Org: scozz (1ea3be12-a439-46ac-94d9-eaff1bb346c2)
-- CF: SCZMNL05L21D960T

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
  '1ea3be12-a439-46ac-94d9-eaff1bb346c2',
  'SCZMNL05L21D960T',
  'SCOZZARINI EMMANUEL SALVATORE',
  'Bag Attributes
    localKeyID: CD 7E DA BC C3 0D 85 13 1E DC B6 3C 96 9F 40 D0 FA F0 AE 46 
    friendlyName: SCOZZARINI EMMANUEL SALVATORE
subject=dnQualifier=RENTRI-100011134, CN=SCOZZARINI EMMANUEL SALVATORE, organizationIdentifier=CF:IT-SCZMNL05L21D960T, O=SCOZZARINI EMMANUEL SALVATORE, C=IT
issuer=C=IT, O=RENTRI Org, OU=RENTRI API CA, CN=RENTRI API CA DEMO
-----BEGIN CERTIFICATE-----
MIIDGDCCAr+gAwIBAgIEBfYMfjAKBggqhkjOPQQDAjBXMQswCQYDVQQGEwJJVDET
MBEGA1UEChMKUkVOVFJJIE9yZzEWMBQGA1UECxMNUkVOVFJJIEFQSSBDQTEbMBkG
A1UEAxMSUkVOVFJJIEFQSSBDQSBERU1PMB4XDTI1MTIwMzE0MTIxMloXDTI3MTIw
MzE0MTIxMlowgZkxGTAXBgNVBC4TEFJFTlRSSS0xMDAwMTExMzQxJjAkBgNVBAMM
HVNDT1paQVJJTkkgRU1NQU5VRUwgU0FMVkFUT1JFMR8wHQYDVQRhDBZDRjpJVC1T
Q1pNTkwwNUwyMUQ5NjBUMSYwJAYDVQQKDB1TQ09aWkFSSU5JIEVNTUFOVUVMIFNB
TFZBVE9SRTELMAkGA1UEBhMCSVQwWTATBgcqhkjOPQIBBggqhkjOPQMBBwNCAARr
bwsxsr6/68S/2kvcYZYosVCOeqrMplwWdA9KOu5cDCzegNSgoMy4FcNFGbYy8AtQ
JjRW7uSsV8rJ3Ch6begMo4IBNDCCATAwDgYDVR0PAQH/BAQDAgbAMB8GA1UdIwQY
MBaAFHCuwTwtKx3Vpg+RvrF7yLt45QP3MEgGCCsGAQUFBwEBBDwwOjA4BggrBgEF
BQcwAoYsaHR0cHM6Ly9kZW1vYXBpLnJlbnRyaS5nb3YuaXQvY2EtcmVudHJpL2Nh
LzEwCQYDVR0TBAIwADAdBgNVHQ4EFgQUzX7avMMNhRMe3LY8lp9A0PrwrkYwHwYD
VR0lBBgwFgYIKwYBBQUHAwIGCisGAQQBgjcUAgIwJQYDVR0RBB4wHIEaUkVTQ1VF
TUFOQUdFUkBMRUdBTE1BSUwuSVQwQQYDVR0fBDowODA2oDSgMoYwaHR0cHM6Ly9k
ZW1vYXBpLnJlbnRyaS5nb3YuaXQvY2EtcmVudHJpL2NhLzEvY3JsMAoGCCqGSM49
BAMCA0cAMEQCID+xqvAbkrgKhEsbZ7NajlDd6IUPah3D2dfiN/J3bXqdAiAJPvIt
HY13k4f74Lspu+68ovZ2Q9E5KONMS70EzGvyEA==
-----END CERTIFICATE-----',
  'Bag Attributes
    localKeyID: CD 7E DA BC C3 0D 85 13 1E DC B6 3C 96 9F 40 D0 FA F0 AE 46 
    friendlyName: SCOZZARINI EMMANUEL SALVATORE
Key Attributes: <No Attributes>
-----BEGIN PRIVATE KEY-----
MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgRguiZJUN2o/WexE8
7XtzFEkFhTUHhE/Oi4ivUiFm7ZehRANCAARrbwsxsr6/68S/2kvcYZYosVCOeqrM
plwWdA9KOu5cDCzegNSgoMy4FcNFGbYy8AtQJjRW7uSsV8rJ3Ch6begM
-----END PRIVATE KEY-----',
  '6o^Z+waO',
  'demo',
  '2024-12-01 00:00:00+00',
  '2026-12-01 00:00:00+00',
  true,
  true
)
ON CONFLICT (org_id, cf_operatore) DO UPDATE SET
  certificate_pem = EXCLUDED.certificate_pem,
  private_key_pem = EXCLUDED.private_key_pem,
  certificate_password = EXCLUDED.certificate_password,
  is_active = true,
  is_default = true,
  updated_at = NOW();

-- Verifica inserimento
SELECT id, org_id, cf_operatore, environment, is_active, is_default, 
       LENGTH(certificate_pem) as cert_len, LENGTH(private_key_pem) as key_len
FROM rentri_org_certificates
WHERE cf_operatore = 'SCZMNL05L21D960T';
