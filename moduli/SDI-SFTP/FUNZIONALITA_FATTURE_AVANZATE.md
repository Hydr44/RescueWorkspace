# 📄 Funzionalità Fatture Avanzate

## 🎯 Funzionalità da Implementare

### ✅ Funzionalità Già Presenti (NON TOCcare)
- ✅ Nota di credito/debito: TD04 e TD05 già nelle opzioni (`InvoiceNew.jsx`)
- ✅ Flussi SDI completi (trasmissione, ricezione esito, prelievo file)
- ✅ Generazione XML FatturaPA 1.2.2 conforme
- ✅ PDF generazione
- ✅ Validazioni pre-invio

### 📋 Funzionalità da Aggiungere (NON Toccare Flussi SDI)

#### **1. Nota di Credito/Debito Completa** ✅ Già presente
- ✅ TD04 (Nota di credito) già nelle opzioni
- ✅ TD05 (Nota di debito) già nelle opzioni
- ⚠️ **DA COMPLETARE**: Collegamento alla fattura originale (`original_invoice_id`)
- ⚠️ **DA COMPLETARE**: Precompilazione dati da fattura originale

#### **2. Invio Email Automatico**
- 📧 Invio PDF fattura via email dopo invio SDI
- 📧 Template email personalizzabile
- 📧 Configurazione SMTP in `org_settings`
- 📧 Log invii email in `invoice_email_logs`

#### **5. Sconti e Abboni**
- 💰 Campo `discount_type`: `percentage` | `fixed` | `none`
- 💰 Campo `discount_value`: valore sconto
- 💰 Applicazione sconto su righe o totale
- 💰 Calcolo IVA dopo sconto

#### **6. Gestione Pagamenti (Storico)**
- 💳 Tabella `invoice_payments` per storico pagamenti
- 💳 Campo `payment_status`: `pending` | `paid` | `partial` | `overdue`
- 💳 Storico pagamenti parziali
- 💳 Segnalazione visiva pagato/parziale/non pagato
- ⚠️ **NON connesso a SDI**: Solo gestione interna

#### **7. Note Interne vs Esterne**
- 📝 Campo `note_internal`: note per uso interno (non su PDF/SDI)
- 📝 Campo `note_external`: note visibili su PDF (già presente come `note`)
- 📝 UI separata per note interne/esterne

#### **9. Dashboard Statistiche Fatture**
- 📊 Statistiche totali fatture (mensile/annuale)
- 📊 Fatturato per periodo
- 📊 Stato pagamenti (pagato/pendente/scaduto)
- 📊 Top clienti per fatturato
- ⚠️ **NON connesso a SDI**: Solo analytics interne

#### **10. Export Contabile Avanzato**
- 📥 Export CSV per contabilità
- 📥 Export Excel con formattazione
- 📥 Filtri avanzati (data, cliente, stato pagamento)
- 📥 Report periodici automatici
- ⚠️ **NON connesso a SDI**: Solo export dati interni

---

## 🗄️ Schema Database da Aggiungere

### **Colonne `invoices` da Aggiungere:**
```sql
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS original_invoice_id UUID REFERENCES invoices(id);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS discount_type TEXT DEFAULT 'none' CHECK (discount_type IN ('none', 'percentage', 'fixed'));
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS discount_value NUMERIC(10,2) DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS note_internal TEXT;
-- note (note_external) già esiste come campo
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'partial', 'overdue'));
```

### **Tabella `invoice_payments` (Storico Pagamenti):**
```sql
CREATE TABLE IF NOT EXISTS invoice_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  
  -- Pagamento
  amount NUMERIC(10,2) NOT NULL,
  payment_date DATE NOT NULL,
  payment_method TEXT, -- 'cash', 'transfer', 'check', etc.
  
  -- Riferimenti
  reference_number TEXT, -- numero assegno, bonifico, etc.
  notes TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_invoice_payments_invoice ON invoice_payments(invoice_id);
CREATE INDEX idx_invoice_payments_org ON invoice_payments(org_id);
```

### **Tabella `invoice_email_logs` (Log Email):**
```sql
CREATE TABLE IF NOT EXISTS invoice_email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  
  -- Email
  recipient_email TEXT NOT NULL,
  subject TEXT,
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'pending')),
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  error_message TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_invoice_email_logs_invoice ON invoice_email_logs(invoice_id);
CREATE INDEX idx_invoice_email_logs_org ON invoice_email_logs(org_id);
```

---

## 🎨 UI/UX Modifiche

### **InvoiceNew.jsx - Aggiunte:**
1. **Sconto/Abbuoni** (sezione dopo righe)
   - Toggle "Applica sconto"
   - Tipo sconto (percentuale/fisso)
   - Valore sconto
   - Anteprima totale dopo sconto

2. **Note Interne/Esterne** (sezione Note)
   - Due campi separati: "Note per cliente" (già presente) e "Note interne"
   - Tooltip che spiega differenza

3. **Nota di Credito/Debito**
   - Se `tipoDoc === 'TD04' || tipoDoc === 'TD05'`: mostra campo "Fattura originale"
   - Auto-search fatture da selezionare
   - Precompila dati cliente da fattura originale

4. **Stato Pagamento** (sezione dopo salvataggio)
   - Badge visivo: pagato/pendente/parziale/scaduto
   - Storico pagamenti visualizzabile
   - Pulsante "Registra Pagamento"

### **InvoiceDashboard.jsx - Da Creare:**
- Lista fatture con filtri
- Statistiche in alto (totale fatturato, fatture pagate/pendenti)
- Filtri: data, cliente, stato pagamento, tipo documento
- Export CSV/Excel
- Segnalazione pagato/parziale/non pagato

---

## ⚠️ IMPORTANTE: NON Toccare Flussi SDI

### **Cosa NON Modificare:**
- ❌ `sendInvoiceToSDI()` in `lib/sdi.js`
- ❌ Generazione XML in `server-vps/xml-generator.js`
- ❌ Endpoint `/api/sdi-sftp/send`
- ❌ Logica trasmissione SDI
- ❌ Logica ricezione esito SDI
- ❌ Logica prelievo file SDI
- ❌ Campo `meta` della fattura (contiene dati SDI)

### **Cosa SI Può Modificare:**
- ✅ Aggiunta colonne database (con migration)
- ✅ UI `InvoiceNew.jsx` (aggiunta sezioni, NON rimozione esistenti)
- ✅ Logica calcoli (sconti) DOPO flusso SDI
- ✅ Nuove pagine (InvoiceDashboard, InvoicePayments)
- ✅ Export dati (CSV/Excel) - solo lettura, NON modifica SDI

---

## 📋 Dettagli Implementazione XML (Cosa Aggiungere a `xml-generator.js`)

### **1. ScontoMaggiorazione nelle Righe**

**Dove aggiungere**: Dentro `<DettaglioLinee>` (dopo `<PrezzoUnitario>`, prima di `<PrezzoTotale>`)

**Codice da aggiungere**:
```javascript
// In xml-generator.js, dentro la funzione che genera DettaglioLinee
${(() => {
  // Se c'è uno sconto o maggiorazione sulla riga
  const sconto = item.sconto || item.discount;
  if (sconto && (sconto.percentuale || sconto.importo)) {
    const tipo = sconto.tipo === 'MG' ? 'MG' : 'SC'; // MG = Maggiorazione, SC = Sconto
    const percentuale = sconto.percentuale ? `<Percentuale>${sconto.percentuale.toFixed(2)}</Percentuale>` : '';
    const importo = sconto.importo ? `<Importo>${sconto.importo.toFixed(2)}</Importo>` : '';
    return `
    <ScontoMaggiorazione>
      <Tipo>${tipo}</Tipo>
      ${percentuale}
      ${importo}
    </ScontoMaggiorazione>`;
  }
  return '';
})()}
```

**⚠️ IMPORTANTE**: Se c'è sconto, `PrezzoTotale` deve essere calcolato DOPO lo sconto:
```javascript
const prezzoTotale = (qty * price) - (sconto?.importo || (qty * price * sconto?.percentuale / 100) || 0);
```

### **2. Causale per Note Credito/Debito**

**Dove aggiungere**: Dentro `<DatiGeneraliDocumento>` (dopo `<Numero>`, prima di `<ImportoTotaleDocumento>`)

**Codice da aggiungere**:
```javascript
// In xml-generator.js, dentro DatiGeneraliDocumento
${(() => {
  const tipoDoc = sdi.documento?.tipo_documento || 'TD01';
  // Causale è OBBLIGATORIA per TD04 (nota credito) e TD05 (nota debito)
  if ((tipoDoc === 'TD04' || tipoDoc === 'TD05') && invoice.note) {
    const causale = invoice.note.substring(0, 200); // Max 200 caratteri
    return `<Causale>${esc(causale)}</Causale>`;
  }
  // Opzionale per altri tipi documento
  if (invoice.note && invoice.note.length > 0) {
    const causale = invoice.note.substring(0, 200);
    return `<Causale>${esc(causale)}</Causale>`;
  }
  return '';
})()}
```

### **3. DatiRiferimento per Note Credito/Debito**

**Dove aggiungere**: Dentro `<DatiGeneraliDocumento>` (dopo `<Causale>`, prima di `<ImportoTotaleDocumento>`)

**Codice da aggiungere**:
```javascript
// In xml-generator.js, dentro DatiGeneraliDocumento
${(() => {
  const tipoDoc = sdi.documento?.tipo_documento || 'TD01';
  // DatiRiferimento è OBBLIGATORIO per TD04 (nota credito) e TD05 (nota debito)
  if ((tipoDoc === 'TD04' || tipoDoc === 'TD05') && invoice.original_invoice_id) {
    // Recupera dati fattura originale (da database o da meta)
    const originalInvoice = invoice.meta?.original_invoice || {};
    const numeroOriginale = originalInvoice.number || invoice.meta?.original_invoice_number || '';
    const dataOriginale = originalInvoice.date || invoice.meta?.original_invoice_date || '';
    
    if (!numeroOriginale || !dataOriginale) {
      throw new Error('Per nota credito/debito, è obbligatorio indicare numero e data della fattura originale');
    }
    
    return `
    <DatiRiferimento>
      <RiferimentoNumeroLinea>1</RiferimentoNumeroLinea>
      <IdDocumento>${esc(numeroOriginale)}</IdDocumento>
      <Data>${esc(dataOriginale)}</Data>
    </DatiRiferimento>`;
  }
  return '';
})()}
```

**⚠️ IMPORTANTE**: 
- Per TD04/TD05, `DatiRiferimento` è **OBBLIGATORIO**
- Deve contenere almeno `IdDocumento` (numero fattura originale) e `Data` (data fattura originale)
- `RiferimentoNumeroLinea` è opzionale (indica quale riga della fattura originale viene rettificata)

### **4. Note Esterne (Causale Generale)**

**Dove aggiungere**: Dentro `<DatiGeneraliDocumento>` (come già fatto sopra per Causale)

**Nota**: Il campo `note` (o `note_external`) va incluso come `<Causale>` se presente, anche per fatture normali (TD01).

---

## ✅ Rimozioni Completate

### **1. Modulo Notifiche** ✅
- ❌ Rimosso `Notifications.jsx` dal routing in `App.jsx`
- ❌ Rimosso import `SystemLog` da `App.jsx`
- ❌ Rimossa route `/log` da `App.jsx`

### **2. Dashboard Personalizzabile** ✅
- ❌ Rimossa sezione "Dashboard Personalizzabile" vuota da `Dashboard.jsx` (righe 660-674)

### **3. Log di Sistema** ✅
- ❌ Rimosso `SystemLog` dal routing in `App.jsx`

---

## 📝 Piano di Implementazione

### **✅ Fase 1: Database (30 min)** ✅ COMPLETATO
1. ✅ Creata migration SQL: `20260116_fatture_funzionalita_avanzate.sql`
2. ✅ Colonne `invoices`: `original_invoice_id`, `discount_type`, `discount_value`, `note_internal`, `payment_status`
3. ✅ Tabella `invoice_payments` creata
4. ✅ Tabella `invoice_email_logs` creata
5. ✅ Indici aggiunti per performance

### **Fase 2: Modifiche XML Generator (1.5 ore)** ⚠️ CRITICO
1. **Aggiungere ScontoMaggiorazione** in `xml-generator.js`:
   - Dentro `<DettaglioLinee>`, dopo `<PrezzoUnitario>`
   - Calcolare `PrezzoTotale` DOPO sconto
   - Testare con sconto percentuale e importo fisso

2. **Aggiungere Causale** in `xml-generator.js`:
   - Dentro `<DatiGeneraliDocumento>`, dopo `<Numero>`
   - OBBLIGATORIA per TD04/TD05
   - Opzionale per altri tipi documento

3. **Aggiungere DatiRiferimento** in `xml-generator.js`:
   - Dentro `<DatiGeneraliDocumento>`, dopo `<Causale>`
   - OBBLIGATORIO per TD04/TD05
   - Deve contenere numero e data fattura originale

4. **Test XML generato**:
   - Validare XML con sconto
   - Validare XML nota credito con Causale e DatiRiferimento
   - Verificare che SDI accetti il file

### **Fase 3: UI InvoiceNew (2 ore)**
1. Aggiungere sezione "Sconto/Abbuoni"
2. Aggiungere campo "Note interne" (separato da note esistenti)
3. Aggiungere logica "Nota di credito/debito" con selezione fattura originale
4. **NON toccare** logica salvataggio SDI esistente

### **Fase 4: Storico Pagamenti (1.5 ore)**
1. Creare componente `InvoicePayments.jsx`
2. Integrare in `InvoiceNew.jsx` o `InvoiceDetail.jsx`
3. Aggiornare `payment_status` in base a pagamenti registrati

### **Fase 5: Email Automatica (2 ore)**
1. Configurazione SMTP in `org_settings`
2. Funzione `sendInvoiceEmail()` in `lib/invoice-email.js`
3. Chiamata dopo salvataggio fattura (OPZIONALE, non obbligatoria)
4. Log invii in `invoice_email_logs`

### **Fase 6: Dashboard Statistiche (1.5 ore)**
1. Creare `InvoiceDashboard.jsx`
2. Query statistiche da `invoices` e `invoice_payments`
3. Grafici con libreria esistente (es. Recharts)

### **Fase 7: Export Contabile (1 ora)**
1. Funzione `exportInvoicesCSV()` e `exportInvoicesExcel()`
2. Filtri avanzati
3. Pulsante export in `InvoiceDashboard.jsx`

---

## ✅ Checklist Implementazione

### **Database**
- [ ] Migration database creata e testata
- [ ] Colonne `discount_type`, `discount_value`, `note_internal`, `payment_status`, `original_invoice_id` aggiunte
- [ ] Tabelle `invoice_payments` e `invoice_email_logs` create

### **XML Generator (CRITICO)**
- [ ] ScontoMaggiorazione aggiunto in `<DettaglioLinee>` ✅
- [ ] Causale aggiunta in `<DatiGeneraliDocumento>` ✅
- [ ] DatiRiferimento aggiunto in `<DatiGeneraliDocumento>` per TD04/TD05 ✅
- [ ] Test XML con sconto → SDI accetta?
- [ ] Test XML nota credito con Causale e DatiRiferimento → SDI accetta?
- [ ] Verifica che flussi SDI esistenti continuano a funzionare

### **UI**
- [ ] UI sconti/abbuoni aggiunta
- [ ] UI note interne/esterne aggiunta
- [ ] UI nota credito/debito con selezione fattura originale
- [ ] Storico pagamenti implementato
- [ ] Email automatica configurata
- [ ] Dashboard statistiche creata
- [ ] Export CSV/Excel funzionante

### **Test Finali**
- [ ] Test completo senza toccare flussi SDI
- [ ] Verifica che SDI continua a funzionare
- [ ] Test nota credito/debito completa
- [ ] Test sconto su fattura normale

---

## 🔍 Test da Eseguire

1. ✅ Creare fattura normale → SDI funziona?
2. ✅ Applicare sconto → totale calcolato correttamente?
3. ✅ Creare nota credito → collegamento a fattura originale OK?
4. ✅ Registrare pagamento → stato aggiornato?
5. ✅ Inviare email → ricevuta correttamente?
6. ✅ Export CSV → formato corretto?
7. ✅ Dashboard statistiche → dati corretti?

---

**NOTA CRITICA**: Durante l'implementazione, NON modificare alcuna funzione o endpoint relativo a SDI. Solo aggiunte, mai sostituzioni.
