# Integrazione Piloterr AutoDoc

## Panoramica

RescueManager integra **Piloterr AutoDoc API** per fornire suggerimenti di prezzo automatici basati sui dati di mercato reali da AutoDoc.de.

## Funzionalità

- ✅ **Prezzi di mercato** in tempo reale da AutoDoc.de
- ✅ **Disponibilità stock** e tempi di consegna
- ✅ **Markup automatico** per categoria ricambio
- ✅ **Cache 24h** per ridurre consumo crediti
- ✅ **UI integrata** in SparePartNewMVP

## Piano Consigliato

| Clienti | Crediti/mese | Piano | Costo |
|---------|--------------|-------|-------|
| 1-15 | 550-1.650 | **Premium** | €49/mese |
| 16-35 | 1.760-3.850 | Premium | €49/mese |
| 36-80 | 3.960-8.800 | Premium+ | €99/mese |
| 81-200 | 8.910-22.000 | Startup | €249/mese |

**Raccomandazione attuale:** Piano **Premium** (€49/mese) per 10 aziende beta.

## Setup

### 1. Registrazione Piloterr

1. Vai su [piloterr.com](https://piloterr.com)
2. Registrati e attiva il **Free Trial** (50 crediti)
3. Copia la tua API Key dal dashboard

### 2. Configurazione Desktop App

La chiave API è già configurata in `.env`:

```bash
VITE_PILOTERR_API_KEY=8cfa8788-29c8-4543-9a89-62a441a38483
```

### 3. Migrazione Database

Applica la migrazione per aggiungere le colonne pricing:

```bash
# Dalla cartella desktop-app/greeting-friend-api-main
npx supabase db push
```

Oppure applica manualmente:

```sql
-- supabase/migrations/20260216_spare_parts_pricing_suggestions.sql
```

### 4. Test Integrazione

1. Avvia l'app: `npm run dev`
2. Vai su **Ricambi** → **Nuovo Ricambio**
3. Inserisci un codice OEM (es. `0986424689` - pastiglie Bosch)
4. Vai al tab **Magazzino & Prezzi**
5. Clicca su **"Cerca Prezzi AutoDoc"**
6. Dovresti vedere:
   - Prezzo AutoDoc (es. €45,90)
   - Disponibilità e tempi consegna
   - Prezzo suggerito con markup 30%

## Utilizzo

### Nel form Ricambio

1. **Compila codice OEM o EAN** nel tab "Info Base"
2. **Seleziona categoria** (opzionale, per markup automatico)
3. **Vai al tab "Magazzino & Prezzi"**
4. **Clicca "Cerca Prezzi AutoDoc"**
5. **Applica il prezzo suggerito** o modificalo manualmente

### Markup per Categoria

Il sistema applica markup automatici:

```javascript
{
  'motore': 35%,
  'trasmissione': 35%,
  'carrozzeria': 40%,
  'elettronica': 45%,
  'freni': 30%,
  'sospensioni': 30%,
  'pneumatici': 25%,
  'accessori': 50%,
  'consumabili': 40%,
  'default': 30%
}
```

## Cache e Ottimizzazione

- **Cache client-side:** 24 ore (in memoria)
- **Cache database:** 24 ore (colonna `last_price_check`)
- **Rate limiting:** 7 req/sec (Piano Premium)
- **Delay batch:** 150ms tra richieste

## Monitoraggio Crediti

Controlla il consumo sul [dashboard Piloterr](https://piloterr.com/dashboard):

- **Crediti rimanenti** nel mese corrente
- **Storico richieste** per giorno
- **Alert automatici** al 80% consumo

## Troubleshooting

### Errore: "Piloterr Client not initialized"

**Causa:** API key mancante o non valida

**Soluzione:**
```bash
# Verifica che .env contenga:
VITE_PILOTERR_API_KEY=8cfa8788-29c8-4543-9a89-62a441a38483

# Riavvia il dev server
npm run dev
```

### Errore: "No product found for OEM"

**Causa:** Codice OEM non presente nel catalogo AutoDoc

**Soluzione:**
- Verifica che il codice sia corretto
- Prova con un codice alternativo (cross-reference)
- AutoDoc copre ~2M articoli, non tutti i ricambi esistenti

### Prezzi non aggiornati

**Causa:** Cache attiva (24h)

**Soluzione:**
- Clicca nuovamente su "Cerca Prezzi" (forza refresh)
- Oppure aspetta 24h per aggiornamento automatico

## File Modificati

### Nuovi File

- `src/lib/piloterr.js` - Client API Piloterr
- `src/lib/pricingSuggestions.js` - Sistema suggerimenti prezzi
- `supabase/migrations/20260216_spare_parts_pricing_suggestions.sql` - Schema DB

### File Modificati

- `src/pages/SparePartNewMVP.jsx` - UI pricing suggestions nel tab "Magazzino & Prezzi"

### Nuove Colonne DB (`spare_parts`)

```sql
suggested_price_autodoc DECIMAL(10,2)      -- Prezzo AutoDoc
suggested_price_ebay DECIMAL(10,2)         -- Prezzo eBay (futuro)
price_markup_percent DECIMAL(5,2)          -- Markup % applicato
last_price_check TIMESTAMPTZ               -- Ultimo aggiornamento
autodoc_availability JSONB                 -- Stock e disponibilità
autodoc_delivery_days VARCHAR(20)          -- Tempi consegna
```

## Prossimi Sviluppi

- [ ] **Scraping eBay/Subito** per prezzi concorrenza (gratis)
- [ ] **Batch update prezzi** per ricambi obsoleti (>7 giorni)
- [ ] **Dashboard analytics** consumo crediti e prezzi medi
- [ ] **Alert prezzi** quando AutoDoc cambia prezzo >10%
- [ ] **Integrazione TecDoc + Piloterr** per dati completi

## Costi Stimati

Con **10 aziende** e **5 ricambi/giorno** per azienda:

- **Consumo mensile:** ~1.100 crediti
- **Piano Premium:** 18.000 crediti/mese
- **Margine:** 16x (sicurezza per picchi)
- **Costo per cliente:** €4,90/mese
- **% sul ricavo:** 1,5% (su abbonamento €333/mese)

Con **30 aziende** (obiettivo Q2 2026):

- **Consumo mensile:** ~3.300 crediti
- **Piano:** Premium (ancora sufficiente)
- **Costo per cliente:** €1,63/mese
- **% sul ricavo:** 0,5%

## Supporto

- **Documentazione API:** [piloterr.com/docs](https://piloterr.com/docs)
- **Email support:** support@piloterr.com
- **Dashboard:** [piloterr.com/dashboard](https://piloterr.com/dashboard)
