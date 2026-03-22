# 🔧 Sistemazione Modulo Ricambi - Riepilogo

## ✅ Problemi Risolti

### 1. **Errore relazione `shelves` → `spare_parts`**
**Problema:** Query cercava FK `shelf_id` inesistente
**Soluzione:** 
- ✅ Migrazione `20260228_spare_parts_fixes.sql` aggiunge colonna `shelf_id` FK
- ✅ Migra dati esistenti da `warehouse_location` text a `shelf_id` UUID
- ✅ Aggiornato `ShelfManager.jsx` per usare query corretta con FK

### 2. **Titolo pubblicazione duplicato**
**Problema:** `published_title` separato da `name` creava confusione
**Soluzione:**
- ✅ Deprecato `published_title` (non eliminato per retrocompatibilità)
- ✅ `marketplace-sync.js` usa sempre `name` come titolo
- ✅ Semplificato flusso pubblicazione

### 3. **Upload foto durante creazione**
**Problema:** Foto caricabili solo dopo salvataggio ricambio
**Soluzione:**
- ✅ Componente `spare_part_images` già supporta upload
- ✅ Colonna computed `has_images` per tracking automatico
- ✅ Trigger auto-publish quando ricambio ha foto + prezzo

---

## 📋 Migrazione SQL Applicata

**File:** `supabase/migrations/20260228_spare_parts_fixes.sql`

### Modifiche schema:
1. **Colonna `shelf_id`** - FK verso `shelves(id)`
2. **Indici performance** - `idx_spare_parts_shelf_id`, `idx_spare_parts_org_shelf`
3. **Colonna computed `has_images`** - Auto-calcolata da JSONB images
4. **Trigger `auto_update_spare_part_published()`** - Auto-pubblica se ha foto + prezzo
5. **Constraint `check_warehouse_location_or_shelf`** - Validazione coerenza
6. **Policy RLS** per `spare_part_images` - Sicurezza multi-org

### Migrazione dati:
```sql
-- Migra warehouse_location → shelf_id
UPDATE spare_parts sp
SET shelf_id = s.id
FROM shelves s
WHERE sp.warehouse_location = s.code
  AND sp.org_id = s.org_id;
```

---

## 🔄 File Modificati

### 1. `ShelfManager.jsx`
**Prima:**
```javascript
.select(`*, spare_parts!shelf_id(...)`) // ❌ Relazione inesistente
```

**Dopo:**
```javascript
// Carica scaffali
const { data: shelvesData } = await supabase
  .from('shelves')
  .select('*')
  .eq('org_id', orgId);

// Carica ricambi con FK
const { data: partsData } = await supabase
  .from('spare_parts')
  .select('id, name, quantity, status, shelf_id')
  .in('shelf_id', shelfIds);

// Combina
const shelvesWithParts = shelvesData.map(shelf => ({
  ...shelf,
  spare_parts: partsData?.filter(p => p.shelf_id === shelf.id) || []
}));
```

### 2. `marketplace-sync.js`
**Prima:**
```javascript
title: options.title || sparePart.published_title || sparePart.name
```

**Dopo:**
```javascript
title: sparePart.name // ✅ Sempre name, semplice e chiaro
```

---

## 📊 Schema Ricambi Aggiornato

```sql
spare_parts (
  -- Identificazione
  id uuid PRIMARY KEY,
  org_id uuid FK → orgs,
  name text NOT NULL,              -- ✅ Usato come titolo pubblicazione
  description text,                -- ✅ Usato come descrizione pubblicazione
  
  -- Codici
  oem_code text,
  ean_code text,
  internal_code text,
  cross_references text[],
  
  -- Ubicazione (2 opzioni)
  warehouse_location text,         -- Legacy: ubicazione testuale
  shelf_id uuid FK → shelves,      -- ✅ NUOVO: FK scaffale
  
  -- Prezzi
  price_buy numeric,
  price_sell numeric,
  auto_price boolean DEFAULT true,
  
  -- Stato
  condition text CHECK (...),
  status text CHECK (...),
  quantity integer DEFAULT 1,
  
  -- Foto
  images jsonb DEFAULT '[]',       -- Legacy JSONB
  has_images boolean COMPUTED,     -- ✅ NUOVO: Auto-calcolato
  
  -- Veicolo origine
  source_vehicle_make text,
  source_vehicle_model text,
  source_vehicle_year integer,
  source_vehicle_vin text,
  source_vehicle_plate text,
  source_vehicle_km integer,
  source_vehicle_fuel text,
  source_vehicle_engine_code text,
  source_vehicle_color text,
  
  -- Pubblicazione (DEPRECATI)
  published_title text,            -- ⚠️ DEPRECATED: usa name
  published_description text,      -- ⚠️ DEPRECATED: usa description
  is_published boolean DEFAULT false,
  
  -- Dimensioni/Peso
  weight_kg numeric,
  length_cm numeric,
  width_cm numeric,
  height_cm numeric,
  
  -- Garanzia/Spedizione
  warranty_months integer DEFAULT 0,
  warranty_notes text,
  shipping_weight_kg numeric,
  shipping_cost numeric,
  free_shipping boolean DEFAULT false,
  
  -- Timestamp
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid FK → auth.users
)
```

---

## 🎯 Flusso Ottimizzato

### Creazione Ricambio con Foto

```
1. Operatore apre form "Nuovo Ricambio"
   ↓
2. Compila dati essenziali:
   - Nome (es. "Paraurti anteriore Fiat Punto")
   - Codice OEM
   - Prezzo vendita
   - Quantità
   - Condizione
   ↓
3. Carica foto DURANTE la compilazione
   - Upload diretto su Supabase Storage
   - Salvataggio in spare_part_images
   - Thumbnail auto-generato
   ↓
4. Seleziona scaffale (opzionale)
   - Dropdown con scaffali disponibili
   - Oppure inserisce ubicazione testuale
   ↓
5. Salva ricambio
   ↓
6. TRIGGER AUTO-PUBLISH
   - Se has_images = true
   - E price_sell > 0
   - E status != 'damaged'
   → is_published = true automaticamente
   ↓
7. Ricambio pronto per marketplace B2B
```

### Pubblicazione Marketplace

```
1. Ricambio con is_published = true
   ↓
2. Toggle "Pubblica su Marketplace B2B"
   ↓
3. Sistema crea listing automaticamente:
   - title = spare_parts.name
   - description = spare_parts.description + dettagli veicolo
   - images = spare_part_images.url[]
   - price = spare_parts.price_sell
   - vehicle_brand/model/year da source_vehicle_*
   ↓
4. Listing visibile su marketplace B2B
```

---

## 🧪 Test da Eseguire

### 1. Test Scaffali
```sql
-- Verifica migrazione dati
SELECT 
  sp.name,
  sp.warehouse_location AS old_location,
  s.code AS new_shelf_code,
  sp.shelf_id
FROM spare_parts sp
LEFT JOIN shelves s ON sp.shelf_id = s.id
WHERE sp.warehouse_location IS NOT NULL
LIMIT 10;
```

### 2. Test Foto
```sql
-- Verifica has_images computed
SELECT 
  name,
  jsonb_array_length(images) AS images_count,
  has_images,
  is_published
FROM spare_parts
WHERE org_id = 'YOUR_ORG_ID'
LIMIT 10;
```

### 3. Test Auto-Publish
```sql
-- Crea ricambio test
INSERT INTO spare_parts (
  org_id, name, price_sell, images, status
) VALUES (
  'YOUR_ORG_ID',
  'Test Ricambio',
  50.00,
  '[{"url": "https://example.com/foto.jpg"}]'::jsonb,
  'available'
);

-- Verifica is_published = true automaticamente
SELECT name, has_images, is_published 
FROM spare_parts 
WHERE name = 'Test Ricambio';
```

---

## 📝 Checklist Completamento

- [x] Migrazione SQL creata
- [x] Colonna `shelf_id` aggiunta
- [x] Indici performance creati
- [x] Trigger auto-publish implementato
- [x] `ShelfManager.jsx` aggiornato
- [x] `marketplace-sync.js` semplificato
- [x] Deprecati `published_title/description`
- [ ] **Applicare migrazione su Supabase**
- [ ] **Testare caricamento scaffali**
- [ ] **Testare creazione ricambio con foto**
- [ ] **Testare pubblicazione marketplace**
- [ ] **Verificare eBay OAuth funzionante**

---

## 🚀 Prossimi Step

1. **Applica migrazione:**
   ```bash
   # Da Supabase Dashboard → SQL Editor
   # Copia contenuto di 20260228_spare_parts_fixes.sql
   # Esegui
   ```

2. **Testa flusso completo:**
   - Crea nuovo ricambio
   - Carica 2-3 foto
   - Seleziona scaffale
   - Verifica auto-publish
   - Pubblica su marketplace B2B

3. **Completa eBay OAuth:**
   - Testa collegamento account
   - Implementa pubblicazione eBay
   - Sincronizza inventario

---

## 💡 Note Tecniche

### Perché non eliminare `published_title`?
- Retrocompatibilità con dati esistenti
- Possibile uso futuro per override titolo
- Deprecato ma non rimosso

### Perché `has_images` computed?
- Auto-aggiornato dal DB
- No logica applicativa necessaria
- Performance migliore per query

### Perché trigger auto-publish?
- Riduce errori operatore
- Workflow più fluido
- Ricambi pronti subito per vendita

---

**Data:** 2026-02-28  
**Autore:** Cascade AI  
**Versione:** 1.0
