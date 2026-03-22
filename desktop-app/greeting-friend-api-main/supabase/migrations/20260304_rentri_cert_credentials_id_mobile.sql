-- Aggiunge il campo credentials_id_mobile ai certificati di tipo firma_remota.
-- Questo ID viene assegnato da RENTRI quando si registra un dispositivo mobile
-- nell'app "RENTRI FIR Digitale Demo" ed è visibile nel portale RENTRI
-- sotto la sezione Firma Remota / Dispositivi di firma.
-- Formato: numero a 9 cifre tipo '100014392'

ALTER TABLE rentri_org_certificates
  ADD COLUMN IF NOT EXISTS credentials_id_mobile text;

COMMENT ON COLUMN rentri_org_certificates.credentials_id_mobile IS
  'ID credenziale dispositivo mobile RENTRI (da portale demooperatori.rentri.gov.it), necessario per firma remota via app mobile';

-- Imposta il credentials_id del dispositivo iPhone registrato (RENTRI FIR Digitale Demo)
UPDATE rentri_org_certificates
  SET credentials_id_mobile = 'FIZLU1OBD'
WHERE tipo_certificato = 'firma_remota'
  AND is_active = true
  AND credentials_id_mobile IS NULL;
