# Modulo Vendite RescueManager - Specifica Funzionale

## 📋 Panoramica

Modulo dedicato alla gestione completa del ciclo di vendita per autodemolizioni:
- Vendita ricambi usati
- Vendita veicoli interi/demoliti
- Preventivi e ordini
- Listini prezzi dinamici
- Marketplace B2B

---

## 🎯 Obiettivi

1. **Unificare** vendite ricambi + veicoli in un unico flusso
2. **Automatizzare** preventivi e ordini
3. **Integrare** con fatturazione SDI esistente
4. **Tracciare** margini e profittabilità
5. **Marketplace** per vendita B2B tra demolitori

---

## 📊 Funzionalità Principali

### 1. Dashboard Vendite

**Metriche chiave**:
- Vendite giornaliere/mensili/annuali
- Margine lordo per categoria (ricambi/veicoli)
- Top 10 ricambi venduti
- Top 10 clienti
- Ordini in sospeso
- Preventivi aperti

**Grafici**:
- Trend vendite ultimi 12 mesi
- Vendite per categoria prodotto
- Vendite per canale (negozio/online/marketplace)
- Marginalità per linea prodotto

---

### 2. Preventivi (Quotes)

**Creazione preventivo**:
```
- Cliente (da anagrafica esistente)
- Data emissione + validità (es. 30gg)
- Righe prodotto:
  * Ricambi (da magazzino)
  * Veicoli (da yard)
  * Servizi (demolizione, trasporto)
- Sconti per riga/totale
- Note e condizioni
- Allegati (foto ricambi, schede tecniche)
```

**Stati preventivo**:
- Bozza
- Inviato (email/PDF)
- Accettato → Converti in ordine
- Rifiutato
- Scaduto

**Azioni**:
- Duplica preventivo
- Converti in ordine
- Invia via email (template personalizzabile)
- Esporta PDF
- Storico modifiche

---

### 3. Ordini (Orders)

**Creazione ordine**:
```
- Da preventivo accettato
- Ordine diretto (senza preventivo)
- Righe prodotto con disponibilità real-time
- Riserva automatica stock
- Calcolo spedizione (se applicabile)
- Metodo pagamento (contanti/bonifico/carta)
```

**Stati ordine**:
- Nuovo
- Confermato
- In preparazione
- Pronto per ritiro/spedizione
- Consegnato
- Fatturato
- Annullato

**Workflow**:
```
Ordine → Picking magazzino → Packing → Consegna → Fattura SDI
```

**Integrazione magazzino**:
- Riserva stock al momento ordine
- Scarico automatico a consegna
- Alert disponibilità insufficiente
- Suggerimenti ricambi alternativi

---

### 4. Listini Prezzi

**Gestione listini**:
- Listino base (prezzo di vendita standard)
- Listini personalizzati per cliente/categoria
- Prezzi dinamici basati su:
  * Costo acquisto + margine %
  * Domanda/offerta (se marketplace attivo)
  * Condizioni ricambio (A/B/C)
  * Anzianità stock (sconti su vecchio stock)

**Regole pricing**:
```javascript
// Esempio logica pricing
prezzo_vendita = costo_acquisto * (1 + margine_categoria)
if (condizione === 'A') prezzo_vendita *= 1.2
if (condizione === 'B') prezzo_vendita *= 1.0
if (condizione === 'C') prezzo_vendita *= 0.8
if (giorni_in_stock > 180) prezzo_vendita *= 0.9 // Sconto vecchio stock
```

**Import/Export**:
- Import listini da CSV/Excel
- Export per cataloghi online
- API per e-commerce esterno

---

### 5. Canali Vendita

**Negozio fisico**:
- POS integrato (barcode scanner)
- Vendita al banco rapida
- Stampa scontrino/fattura immediata

**Online/E-commerce**:
- Catalogo ricambi pubblico
- Carrello e checkout
- Integrazione pagamenti (Stripe/PayPal)
- Tracking ordini clienti

**Marketplace B2B**:
- Pubblicazione ricambi su marketplace demolitori
- Ricerca ricambi da altri demolitori
- Sistema offerte/controfferte
- Rating fornitori

**Telefono/Email**:
- Creazione ordine manuale
- Invio preventivo via email
- Conferma ordine via link

---

### 6. Gestione Clienti Vendite

**Anagrafica cliente estesa**:
- Storico acquisti
- Prodotti preferiti
- Margine medio per cliente
- Credito residuo
- Fido commerciale
- Note commerciali

**Segmentazione**:
- Privati vs Aziende
- Officine vs Rivenditori
- Frequenza acquisto (occasionale/abituale/VIP)
- Valore lifetime (LTV)

**Programma fedeltà** (opzionale):
- Punti su acquisti
- Sconti progressivi
- Offerte esclusive

---

### 7. Reportistica Vendite

**Report standard**:
- Vendite per periodo
- Vendite per prodotto/categoria
- Vendite per cliente
- Vendite per canale
- Marginalità per linea
- ABC analysis ricambi
- Slow movers (ricambi invenduti)

**Export**:
- PDF, Excel, CSV
- Invio automatico via email (schedulato)
- Dashboard interattive

---

## 🗄️ Schema Database

### Tabella: `sales_quotes` (Preventivi)

```sql
CREATE TABLE sales_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id),
  quote_number VARCHAR(50) UNIQUE NOT NULL, -- PREV-2026-001
  client_id UUID REFERENCES clients(id),
  
  -- Date
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  valid_until DATE NOT NULL, -- Data scadenza preventivo
  
  -- Importi
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  discount_percent DECIMAL(5,2) DEFAULT 0,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  
  -- Stato
  status VARCHAR(20) NOT NULL DEFAULT 'draft', -- draft, sent, accepted, rejected, expired
  
  -- Metadati
  notes TEXT,
  terms TEXT, -- Condizioni di vendita
  internal_notes TEXT, -- Note interne non visibili al cliente
  
  -- Conversione
  converted_to_order_id UUID REFERENCES sales_orders(id),
  converted_at TIMESTAMP,
  
  -- Audit
  created_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMP DEFAULT NOW(),
  sent_at TIMESTAMP, -- Quando inviato al cliente
  accepted_at TIMESTAMP,
  rejected_at TIMESTAMP
);

CREATE INDEX idx_sales_quotes_org ON sales_quotes(org_id);
CREATE INDEX idx_sales_quotes_client ON sales_quotes(client_id);
CREATE INDEX idx_sales_quotes_status ON sales_quotes(status);
```

### Tabella: `sales_quote_items` (Righe Preventivo)

```sql
CREATE TABLE sales_quote_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES sales_quotes(id) ON DELETE CASCADE,
  
  -- Prodotto
  item_type VARCHAR(20) NOT NULL, -- spare_part, vehicle, service
  item_id UUID, -- ID ricambio/veicolo (nullable per servizi custom)
  
  -- Descrizione
  description TEXT NOT NULL,
  sku VARCHAR(100), -- Codice ricambio
  
  -- Quantità e prezzi
  quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  discount_percent DECIMAL(5,2) DEFAULT 0,
  tax_rate DECIMAL(5,2) DEFAULT 22, -- IVA %
  
  -- Totali riga
  line_total DECIMAL(10,2) NOT NULL,
  
  -- Metadati
  notes TEXT,
  sort_order INT DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_quote_items_quote ON sales_quote_items(quote_id);
```

### Tabella: `sales_orders` (Ordini)

```sql
CREATE TABLE sales_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id),
  order_number VARCHAR(50) UNIQUE NOT NULL, -- ORD-2026-001
  client_id UUID REFERENCES clients(id),
  
  -- Riferimenti
  quote_id UUID REFERENCES sales_quotes(id), -- Se da preventivo
  invoice_id UUID REFERENCES invoices(id), -- Fattura generata
  
  -- Date
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expected_delivery_date DATE,
  delivered_at TIMESTAMP,
  
  -- Importi
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  shipping_cost DECIMAL(10,2) DEFAULT 0,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  
  -- Stato
  status VARCHAR(20) NOT NULL DEFAULT 'new', 
  -- new, confirmed, preparing, ready, shipped, delivered, invoiced, cancelled
  
  -- Pagamento
  payment_method VARCHAR(50), -- cash, bank_transfer, card, paypal
  payment_status VARCHAR(20) DEFAULT 'pending', -- pending, partial, paid
  paid_amount DECIMAL(10,2) DEFAULT 0,
  
  -- Spedizione
  shipping_method VARCHAR(50), -- pickup, courier, own_delivery
  shipping_address TEXT,
  tracking_number VARCHAR(100),
  
  -- Metadati
  notes TEXT,
  internal_notes TEXT,
  
  -- Audit
  created_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMP DEFAULT NOW(),
  confirmed_at TIMESTAMP,
  cancelled_at TIMESTAMP,
  cancellation_reason TEXT
);

CREATE INDEX idx_sales_orders_org ON sales_orders(org_id);
CREATE INDEX idx_sales_orders_client ON sales_orders(client_id);
CREATE INDEX idx_sales_orders_status ON sales_orders(status);
CREATE INDEX idx_sales_orders_date ON sales_orders(order_date);
```

### Tabella: `sales_order_items` (Righe Ordine)

```sql
CREATE TABLE sales_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES sales_orders(id) ON DELETE CASCADE,
  
  -- Prodotto
  item_type VARCHAR(20) NOT NULL, -- spare_part, vehicle, service
  item_id UUID, -- ID ricambio/veicolo
  
  -- Descrizione
  description TEXT NOT NULL,
  sku VARCHAR(100),
  
  -- Quantità e prezzi
  quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  discount_percent DECIMAL(5,2) DEFAULT 0,
  tax_rate DECIMAL(5,2) DEFAULT 22,
  line_total DECIMAL(10,2) NOT NULL,
  
  -- Stock management
  reserved BOOLEAN DEFAULT FALSE, -- Stock riservato
  picked BOOLEAN DEFAULT FALSE, -- Prelevato da magazzino
  packed BOOLEAN DEFAULT FALSE, -- Imballato
  
  -- Metadati
  notes TEXT,
  sort_order INT DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_order_items_order ON sales_order_items(order_id);
```

### Tabella: `price_lists` (Listini)

```sql
CREATE TABLE price_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id),
  
  name VARCHAR(100) NOT NULL, -- "Listino Base", "Officine", "Rivenditori"
  code VARCHAR(50) UNIQUE NOT NULL, -- BASE, WORKSHOP, RESELLER
  
  -- Applicabilità
  is_default BOOLEAN DEFAULT FALSE,
  client_category VARCHAR(50), -- Categoria clienti a cui si applica
  
  -- Regole
  markup_percent DECIMAL(5,2) DEFAULT 0, -- Ricarico % su costo
  discount_percent DECIMAL(5,2) DEFAULT 0, -- Sconto % su prezzo base
  
  -- Validità
  valid_from DATE,
  valid_until DATE,
  active BOOLEAN DEFAULT TRUE,
  
  notes TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_price_lists_org ON price_lists(org_id);
```

### Tabella: `price_list_items` (Prezzi Specifici)

```sql
CREATE TABLE price_list_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  price_list_id UUID NOT NULL REFERENCES price_lists(id) ON DELETE CASCADE,
  
  -- Prodotto
  item_type VARCHAR(20) NOT NULL, -- spare_part, vehicle
  item_id UUID NOT NULL,
  
  -- Prezzo
  unit_price DECIMAL(10,2) NOT NULL,
  min_quantity DECIMAL(10,2) DEFAULT 1, -- Prezzo per quantità minima
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(price_list_id, item_type, item_id, min_quantity)
);

CREATE INDEX idx_price_list_items_list ON price_list_items(price_list_id);
```

---

## 🎨 UI/UX - Pagine Principali

### 1. `/sales` - Dashboard Vendite
- KPI cards (vendite oggi/mese, ordini aperti, preventivi)
- Grafici trend
- Lista ordini recenti
- Quick actions (nuovo preventivo, nuovo ordine)

### 2. `/sales/quotes` - Lista Preventivi
- Tabella preventivi con filtri (stato, cliente, data)
- Azioni rapide (invia, converti, duplica)
- Export Excel/PDF

### 3. `/sales/quotes/new` - Nuovo Preventivo
- Form wizard multi-step:
  1. Cliente + date
  2. Aggiungi prodotti (ricerca ricambi/veicoli)
  3. Sconti e totali
  4. Note e condizioni
  5. Anteprima PDF

### 4. `/sales/orders` - Lista Ordini
- Kanban board per stato (nuovo → confermato → preparazione → pronto → consegnato)
- Filtri avanzati
- Bulk actions (stampa picking list, genera fatture)

### 5. `/sales/orders/:id` - Dettaglio Ordine
- Stato ordine con timeline
- Righe prodotto con stato picking/packing
- Pagamenti e fatture collegate
- Tracking spedizione
- Note e comunicazioni cliente

### 6. `/sales/pricelists` - Gestione Listini
- Lista listini attivi
- Editor prezzi con import CSV
- Simulatore prezzi (calcola prezzo per cliente/prodotto)

---

## 🔗 Integrazioni

### Con Moduli Esistenti

**Ricambi (Spare Parts)**:
- Selezione ricambi in preventivi/ordini
- Verifica disponibilità real-time
- Riserva e scarico stock automatico
- Aggiornamento prezzi vendita

**Veicoli (Yard/RVFU)**:
- Vendita veicoli interi o demoliti
- Collegamento a caso RVFU
- Generazione certificato vendita

**Fatturazione (Invoices)**:
- Conversione ordine → fattura SDI
- Copia righe ordine in fattura
- Collegamento pagamenti

**Clienti (Clients)**:
- Anagrafica clienti condivisa
- Storico vendite per cliente
- Fido e credito

**Contabilità (Accounting)**:
- Registrazione ricavi
- Marginalità per prodotto
- Report fiscali

### API Esterne

**Pagamenti**:
- Stripe/PayPal per pagamenti online
- POS fisico (SumUp, Nexi)

**Spedizioni**:
- Corrieri (BRT, GLS, DHL) per tracking
- Calcolo costi spedizione

**Marketplace**:
- API per pubblicazione ricambi su portali esterni
- Sincronizzazione stock

---

## 📱 Mobile/Tablet

**App magazziniere** (tablet):
- Picking list ordini
- Scansione barcode ricambi
- Conferma packing
- Foto prodotto per cliente

**App venditore** (tablet/mobile):
- Creazione preventivo al volo
- Catalogo ricambi offline
- Firma digitale cliente su ordine

---

## 🚀 Roadmap Implementazione

### Fase 1 - MVP (2-3 settimane)
- [ ] Schema DB (quotes, orders, items)
- [ ] CRUD preventivi base
- [ ] CRUD ordini base
- [ ] Conversione preventivo → ordine
- [ ] Integrazione ricambi (selezione + riserva stock)
- [ ] Dashboard vendite semplice

### Fase 2 - Core (3-4 settimane)
- [ ] Listini prezzi
- [ ] Stati ordine + workflow
- [ ] Integrazione fatturazione SDI
- [ ] Gestione pagamenti
- [ ] Report vendite base
- [ ] Email preventivi/ordini

### Fase 3 - Advanced (4-6 settimane)
- [ ] Marketplace B2B
- [ ] POS integrato
- [ ] App mobile magazzino
- [ ] Prezzi dinamici
- [ ] Analytics avanzate
- [ ] Integrazione spedizioni

---

## 💡 Note Tecniche

**Stack suggerito**:
- Frontend: React + TailwindCSS (esistente)
- Backend: Supabase + PostgreSQL (esistente)
- PDF: react-pdf o jsPDF
- Barcode: react-barcode-reader
- Charts: recharts o chart.js

**Performance**:
- Indici DB su org_id, client_id, status, date
- Cache listini prezzi (Redis)
- Lazy loading liste ordini
- Pagination server-side

**Sicurezza**:
- RLS Supabase per org_id
- Permessi ruoli (admin, venditore, magazziniere)
- Audit log modifiche prezzi/ordini

---

## 📊 Metriche Successo

**KPI da monitorare**:
- Tempo medio creazione preventivo (target: <5 min)
- Tasso conversione preventivo → ordine (target: >40%)
- Tempo medio evasione ordine (target: <24h)
- Margine medio vendita (target: >30%)
- Valore medio ordine (AOV)
- Customer lifetime value (CLV)

---

## 🎯 Conclusioni

Il modulo vendite completa l'ecosistema RescueManager trasformandolo da gestionale operativo a **piattaforma commerciale completa** per autodemolizioni.

**Vantaggi**:
✅ Processo vendita unificato e tracciato
✅ Automazione preventivi/ordini
✅ Integrazione seamless con magazzino e fatturazione
✅ Visibilità marginalità e profittabilità
✅ Marketplace B2B per espansione mercato

**Prossimi passi**:
1. Review e approvazione specifica
2. Prioritizzazione funzionalità (MVP vs nice-to-have)
3. Design UI mockup
4. Sviluppo iterativo per fasi
