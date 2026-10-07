-- Codici OAuth a uso singolo DAVVERO.
--
-- Trovato il 08/10/2026: su public.oauth_codes gira il trigger
-- `update_oauth_codes_updated_at` (BEFORE UPDATE → update_updated_at_column()),
-- ma la tabella NON ha la colonna updated_at. Ogni UPDATE fallisce con
-- «record "new" has no field "updated_at"». Il proxy OAuth (VPS,
-- /opt/oauth-proxy-server/exchange-handler.js) faceva `update({used:true})`
-- senza leggere l'errore: risultato, 350 codici su 350 mai marcati usati, e
-- ogni codice riutilizzabile finche' non scade (5 minuti).
--
-- RIMEDIO: si AGGIUNGE la colonna che manca, invece di togliere il trigger.
-- E' la scelta che funziona in QUALUNQUE ordine di deploy: con la colonna al
-- suo posto l'UPDATE riesce sia col vecchio handler (che da quel momento marca
-- davvero i codici usati) sia col nuovo (che altrimenti, trovando l'errore,
-- rifiuterebbe TUTTI gli accessi dal browser, telefono e gestionale). Il
-- revisore avversariale l'ha fatto notare: un passo invertito nel rilascio
-- avrebbe chiuso l'unica porta d'ingresso di due prodotti.
--
-- Poi il deploy del nuovo exchange-handler.js (un solo UPDATE ... WHERE
-- used = false RETURNING; 500 se il database da' errore, 400 se nessuna riga).
--
-- Verifica prima: SELECT count(*) FILTER (WHERE used) FROM public.oauth_codes;  -- oggi 0
-- Verifica dopo un login: la riga nuova deve avere used = true e updated_at valorizzato.

BEGIN;

ALTER TABLE public.oauth_codes
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- Pulizia: i codici scaduti non servono a niente e non li legge nessuno.
DELETE FROM public.oauth_codes WHERE expires_at < now() - interval '1 day';

COMMIT;
