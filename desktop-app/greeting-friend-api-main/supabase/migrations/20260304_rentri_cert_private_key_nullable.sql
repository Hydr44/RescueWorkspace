-- Fix: private_key_pem deve essere nullable per certificati tipo firma_remota (.cer)
-- I certificati di firma remota contengono solo il certificato pubblico,
-- la chiave privata è sul dispositivo HSM/smartcard dell'operatore.

ALTER TABLE rentri_org_certificates
  ALTER COLUMN private_key_pem DROP NOT NULL;
