# 🔧 Migration: Aggiungi Campo Tipo Autorizzazione

## 📝 SQL da Eseguire su Supabase

Esegui questo SQL nel **SQL Editor** di Supabase:

```sql
-- Aggiungi tipo autorizzazione destinatario
ALTER TABLE rentri_formulari
ADD COLUMN IF NOT EXISTS destinatario_autorizzazione_tipo VARCHAR(50);

-- Aggiungi tipo autorizzazione produttore (futuro)
ALTER TABLE rentri_formulari
ADD COLUMN IF NOT EXISTS produttore_autorizzazione_tipo VARCHAR(50);

-- Aggiorna FIR esistenti con valore default
UPDATE rentri_formulari
SET destinatario_autorizzazione_tipo = 'AIA'
WHERE destinatario_autorizzazione IS NOT NULL
AND destinatario_autorizzazione_tipo IS NULL;

-- Verifica
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'rentri_formulari'
AND column_name LIKE '%autorizzazione%'
ORDER BY column_name;
```

## ✅ Output Atteso

Dovresti vedere le colonne:
```
- destinatario_autorizzazione (VARCHAR)
- destinatario_autorizzazione_tipo (VARCHAR) ← NUOVO!
- produttore_autorizzazione_tipo (VARCHAR) ← NUOVO!
```

## 🧪 Dopo la Migration

1. **Ricarica app** (Cmd+R)
2. **Elimina FIR vecchio** (ha tipo NULL)
3. **Crea nuovo FIR** con "Riempi Dati Test"
4. **Trasmetti a RENTRI**
5. ✅ Dovrebbe funzionare!

---

**Esegui la migration ora!** 📝

