-- Funzione RPC per ottenere il prossimo numero di fattura
-- Calcola il numero progressivo basandosi sulle fatture esistenti per l'organizzazione

-- Elimina la funzione esistente se presente (necessario per cambiare il tipo di ritorno)
DROP FUNCTION IF EXISTS rpc_invoice_next_number(uuid);

CREATE OR REPLACE FUNCTION rpc_invoice_next_number(p_org_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_next_number integer;
  v_max_number integer;
  v_last_number text;
BEGIN
  -- Trova il numero più alto tra le fatture esistenti per questa organizzazione
  -- Considera solo fatture con numero valido (non nullo e numerico)
  SELECT COALESCE(MAX(CAST(number AS INTEGER)), 0)
  INTO v_max_number
  FROM invoices
  WHERE org_id = p_org_id
    AND number IS NOT NULL
    AND number ~ '^[0-9]+$'; -- Solo numeri

  -- Se non ci sono fatture, inizia da 1
  IF v_max_number IS NULL OR v_max_number = 0 THEN
    v_next_number := 1;
  ELSE
    v_next_number := v_max_number + 1;
  END IF;

  RETURN v_next_number;
EXCEPTION
  WHEN OTHERS THEN
    -- In caso di errore, restituisci 1
    RETURN 1;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION rpc_invoice_next_number(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION rpc_invoice_next_number(uuid) TO anon;

