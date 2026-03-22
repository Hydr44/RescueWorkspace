-- Aggiunge colonna firmato_at per tracciare quando un FIR viene firmato digitalmente
ALTER TABLE rentri_formulari
  ADD COLUMN IF NOT EXISTS firmato_at timestamptz;

-- Indice per query filtrate per FIR firmati
CREATE INDEX IF NOT EXISTS idx_rentri_formulari_firmato_at 
  ON rentri_formulari(firmato_at) 
  WHERE firmato_at IS NOT NULL;
