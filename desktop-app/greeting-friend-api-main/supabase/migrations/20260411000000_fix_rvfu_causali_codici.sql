-- Fix codici causali RVFU: i vecchi codici (DEMOLIZIONE, ROTTAMAZIONE, ecc.) 
-- non corrispondono ai codici API ACI che sono: D, SD, PA, NN
-- Questo causava errore 500 sull'API /cr/veicolo

-- Elimina i vecchi codici errati
DELETE FROM rvfu_causali WHERE codice IN ('ROTTAMAZIONE', 'DEMOLIZIONE', 'CESSAZIONE', 'FURTO', 'INCIDENTE');

-- Inserisci i codici corretti secondo la documentazione ACI RVFU
INSERT INTO rvfu_causali (codice, codice_mtv, codice_mne, descrizione) VALUES
('D',  'D',  'D',  'Demolizione'),
('SD', 'SD', 'SD', 'Demolizione (SD)'),
('PA', 'PA', 'PA', 'Demolizione su provvedimento PA'),
('NN', 'NN', 'NN', 'Veicoli non riconosciuti')
ON CONFLICT (codice) DO UPDATE SET
  descrizione = EXCLUDED.descrizione,
  codice_mtv = EXCLUDED.codice_mtv,
  codice_mne = EXCLUDED.codice_mne;
