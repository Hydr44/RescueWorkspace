# 📊 Analisi Movimenti Contabili

## ⚠️ IMPORTANTE: Movimenti Contabili NON sono connessi a SDI

**SDI (Sistema di Interscambio)** e **Movimenti Contabili** sono due sistemi completamente separati:

- **SDI**: Gestisce solo la trasmissione/ricezione delle fatture elettroniche (XML). Non richiede movimenti contabili.
- **Movimenti Contabili**: Registrazioni contabili interne (partita doppia) per contabilità aziendale, registri IVA, bilancio, export per software contabili esterni.

**Relazione**: I movimenti contabili vengono generati quando si crea/salva una fattura, ma sono completamente indipendenti da SDI. SDI gestisce solo l'XML della fattura.

---

## 🔍 Situazione Attuale

### ✅ Cosa esiste:
- Tabella `invoices` con dati fatture
- Tabella `invoice_payments` per storico pagamenti
- Export CSV/Excel menzionato nei documenti (non ancora implementato)

### ❌ Cosa manca:
- **Tabella movimenti contabili** (registrazioni partita doppia)
- **Generazione automatica movimenti** quando si crea/salva una fattura
- **Piano dei conti** (codici contabili configurabili)
- **Export formattato per software contabili** (TeamSystem, Zucchetti, ecc.)

---

## 📋 Cosa sono i Movimenti Contabili

I movimenti contabili sono le **registrazioni in partita doppia** che documentano ogni operazione economica:

### **Per Fattura Emessa (Attiva):**
1. **Dare**: Cliente (Crediti verso clienti) → Importo totale fattura
2. **Avere**: Ricavi (Vendite/Servizi) → Imponibile
3. **Avere**: IVA a debito → Importo IVA

**Esempio:**
```
Fattura 100€ + IVA 22% = 122€ totale

Dare:  Cliente (Crediti)        122,00€
Avere: Ricavi (Vendite)         100,00€
Avere: IVA a debito             22,00€
```

### **Per Pagamento Fattura:**
1. **Dare**: Banca/Cassa → Importo pagato
2. **Avere**: Cliente (Crediti) → Importo pagato

**Esempio:**
```
Pagamento 122€ via bonifico

Dare:  Banca c/c               122,00€
Avere: Cliente (Crediti)       122,00€
```

### **Per Nota di Credito:**
1. **Dare**: Ricavi (Vendite) → Imponibile (storno)
2. **Dare**: IVA a debito → Importo IVA (storno)
3. **Avere**: Cliente (Crediti) → Importo totale (storno)

### **Per Nota di Debito:**
1. **Dare**: Cliente (Crediti) → Importo totale
2. **Avere**: Ricavi (Vendite) → Imponibile
3. **Avere**: IVA a debito → Importo IVA

---

## 🗄️ Schema Database Proposto

### **Tabella `accounting_entries` (Movimenti Contabili):**
```sql
CREATE TABLE IF NOT EXISTS public.accounting_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  
  -- Riferimento documento
  document_type TEXT NOT NULL, -- 'invoice', 'payment', 'credit_note', 'debit_note'
  document_id UUID, -- ID fattura, pagamento, ecc.
  
  -- Data contabile
  accounting_date DATE NOT NULL,
  registration_date TIMESTAMPTZ DEFAULT NOW(),
  
  -- Movimento (Partita Doppia)
  account_code TEXT NOT NULL, -- Codice conto (es. "120", "401", "2001")
  account_name TEXT, -- Nome conto (es. "Crediti verso clienti", "Ricavi vendite")
  debit_amount NUMERIC(10,2) DEFAULT 0, -- Dare
  credit_amount NUMERIC(10,2) DEFAULT 0, -- Avere
  
  -- Descrizione
  description TEXT, -- Descrizione movimento
  reference TEXT, -- Riferimento documento (es. "Fattura N. 001/2024")
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_accounting_entries_org ON public.accounting_entries(org_id);
CREATE INDEX idx_accounting_entries_document ON public.accounting_entries(document_type, document_id);
CREATE INDEX idx_accounting_entries_date ON public.accounting_entries(accounting_date);
CREATE INDEX idx_accounting_entries_account ON public.accounting_entries(account_code);
```

### **Tabella `chart_of_accounts` (Piano dei Conti):**
```sql
CREATE TABLE IF NOT EXISTS public.chart_of_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  
  -- Codice conto
  code TEXT NOT NULL, -- Codice conto (es. "120", "401", "2001")
  name TEXT NOT NULL, -- Nome conto
  
  -- Categoria
  category TEXT, -- 'asset', 'liability', 'revenue', 'expense', 'equity'
  subcategory TEXT, -- Sottocategoria (es. "current_assets", "sales", "tax")
  
  -- Configurazione
  is_active BOOLEAN DEFAULT true,
  is_system BOOLEAN DEFAULT false, -- Conti di sistema (non modificabili)
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(org_id, code)
);

CREATE INDEX idx_chart_of_accounts_org ON public.chart_of_accounts(org_id);
CREATE INDEX idx_chart_of_accounts_code ON public.chart_of_accounts(code);
```

### **Conti di Sistema Predefiniti:**
```sql
-- Inserire conti predefiniti per ogni org
INSERT INTO public.chart_of_accounts (org_id, code, name, category, subcategory, is_system)
VALUES
  (org_id, '120', 'Crediti verso clienti', 'asset', 'current_assets', true),
  (org_id, '401', 'Ricavi vendite', 'revenue', 'sales', true),
  (org_id, '2001', 'IVA a debito', 'liability', 'tax', true),
  (org_id, '2002', 'IVA a credito', 'asset', 'tax', true),
  (org_id, '1001', 'Banca c/c', 'asset', 'current_assets', true),
  (org_id, '1002', 'Cassa', 'asset', 'current_assets', true);
```

---

## 🔄 Logica Generazione Movimenti

### **1. Quando si crea/salva una Fattura:**
```javascript
async function generateAccountingEntriesForInvoice(invoice) {
  const entries = [];
  
  // Movimento 1: Dare - Cliente (Crediti)
  entries.push({
    account_code: '120', // Crediti verso clienti
    debit_amount: invoice.total,
    credit_amount: 0,
    description: `Fattura N. ${invoice.number}`,
    reference: `FATT/${invoice.number}/${invoice.date}`
  });
  
  // Movimento 2: Avere - Ricavi
  entries.push({
    account_code: '401', // Ricavi vendite
    debit_amount: 0,
    credit_amount: invoice.imponibile, // Totale - IVA
    description: `Fattura N. ${invoice.number}`,
    reference: `FATT/${invoice.number}/${invoice.date}`
  });
  
  // Movimento 3: Avere - IVA a debito
  entries.push({
    account_code: '2001', // IVA a debito
    debit_amount: 0,
    credit_amount: invoice.iva,
    description: `IVA Fattura N. ${invoice.number}`,
    reference: `FATT/${invoice.number}/${invoice.date}`
  });
  
  return entries;
}
```

### **2. Quando si registra un Pagamento:**
```javascript
async function generateAccountingEntriesForPayment(payment) {
  const entries = [];
  
  // Movimento 1: Dare - Banca/Cassa
  const accountCode = payment.payment_method === 'transfer' ? '1001' : '1002';
  entries.push({
    account_code: accountCode,
    debit_amount: payment.amount,
    credit_amount: 0,
    description: `Pagamento Fattura N. ${payment.invoice_number}`,
    reference: `PAG/${payment.reference_number || payment.id}`
  });
  
  // Movimento 2: Avere - Cliente (Crediti)
  entries.push({
    account_code: '120',
    debit_amount: 0,
    credit_amount: payment.amount,
    description: `Pagamento Fattura N. ${payment.invoice_number}`,
    reference: `PAG/${payment.reference_number || payment.id}`
  });
  
  return entries;
}
```

### **3. Quando si crea una Nota di Credito:**
```javascript
async function generateAccountingEntriesForCreditNote(creditNote) {
  const entries = [];
  
  // Movimento 1: Dare - Ricavi (storno)
  entries.push({
    account_code: '401',
    debit_amount: creditNote.imponibile,
    credit_amount: 0,
    description: `Nota Credito N. ${creditNote.number}`,
    reference: `NC/${creditNote.number}/${creditNote.date}`
  });
  
  // Movimento 2: Dare - IVA a debito (storno)
  entries.push({
    account_code: '2001',
    debit_amount: creditNote.iva,
    credit_amount: 0,
    description: `IVA Nota Credito N. ${creditNote.number}`,
    reference: `NC/${creditNote.number}/${creditNote.date}`
  });
  
  // Movimento 3: Avere - Cliente (Crediti) (storno)
  entries.push({
    account_code: '120',
    debit_amount: 0,
    credit_amount: creditNote.total,
    description: `Nota Credito N. ${creditNote.number}`,
    reference: `NC/${creditNote.number}/${creditNote.date}`
  });
  
  return entries;
}
```

---

## 📥 Export per Software Contabili

### **Formato CSV Standard (per TeamSystem, Zucchetti, ecc.):**
```csv
Data,Numero,Conto,Dare,Avere,Descrizione,Riferimento
2024-01-15,001,120,122.00,0.00,"Fattura N. 001/2024","FATT/001/2024-01-15"
2024-01-15,001,401,0.00,100.00,"Fattura N. 001/2024","FATT/001/2024-01-15"
2024-01-15,001,2001,0.00,22.00,"IVA Fattura N. 001/2024","FATT/001/2024-01-15"
```

### **Formato Excel con formattazione:**
- Colonne: Data, Numero, Conto, Nome Conto, Dare, Avere, Descrizione, Riferimento
- Formattazione: Numeri con 2 decimali, date in formato italiano
- Totali: Somma Dare e Avere alla fine

---

## ✅ Checklist Implementazione

- [ ] Creare tabella `accounting_entries`
- [ ] Creare tabella `chart_of_accounts`
- [ ] Inserire conti predefiniti per ogni org
- [ ] Funzione `generateAccountingEntriesForInvoice()`
- [ ] Funzione `generateAccountingEntriesForPayment()`
- [ ] Funzione `generateAccountingEntriesForCreditNote()`
- [ ] Chiamare generazione movimenti quando si salva fattura
- [ ] Chiamare generazione movimenti quando si registra pagamento
- [ ] UI per visualizzare movimenti contabili di una fattura
- [ ] UI per gestire piano dei conti
- [ ] Export CSV formattato per software contabili
- [ ] Export Excel con formattazione
- [ ] Filtri per export (data, conto, documento)

---

## 🎯 Vantaggi

1. **Tracciabilità completa**: Ogni operazione è registrata in partita doppia
2. **Export per software contabili**: Facile integrazione con TeamSystem, Zucchetti, ecc.
3. **Bilancio automatico**: Verifica automatica che Dare = Avere
4. **Report contabili**: Analisi per conto, periodo, cliente
5. **Conformità**: Registrazioni contabili complete per adempimenti fiscali
