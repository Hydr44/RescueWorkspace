# Fix Applicati - Problemi Segnalati

## ✅ **Problema 1: Funzione RPC `rpc_invoice_next_number` non trovata**

### **Errore**
```
POST https://ienzdgrqalltvkdkuamp.supabase.co/rest/v1/rpc/rpc_invoice_next_number 404 (Not Found)
```

### **Soluzione**
Creata migration SQL per la funzione RPC:
- **File**: `supabase/migrations/20250201_add_invoice_next_number_rpc.sql`
- **Funzione**: `rpc_invoice_next_number(p_org_id uuid)`
- **Funzionalità**: Calcola il prossimo numero di fattura basandosi sulle fatture esistenti per l'organizzazione

### **Come Applicare**
1. Applica la migration manualmente in Supabase:
   ```sql
   -- Esegui il contenuto di:
   -- supabase/migrations/20250201_add_invoice_next_number_rpc.sql
   ```

2. Oppure usa Supabase CLI:
   ```bash
   supabase db push
   ```

---

## ✅ **Problema 2: Info Cedente/Prestatore non si aggiornano da Settings**

### **Problema**
Le modifiche ai dati azienda in Settings non vengono riflesse nella pagina "Nuovo Fattura".

### **Soluzioni Applicate**

#### **1. Salvataggio in `org_settings`**
Modificato `Settings.jsx` per salvare anche in `org_settings` quando si salva:
```typescript
// Salva anche in org_settings per uso nelle fatture SDI
if (currentOrg && company) {
  await supabase
    .from('org_settings')
    .upsert({
      org_id: currentOrg,
      key: 'company',
      value: company,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'org_id,key'
    });
}
```

#### **2. Pulsante "Aggiorna"**
Aggiunto pulsante per ricaricare manualmente i dati:
- **Posizione**: Sezione "Cedente/Prestatore" in `InvoiceNew.jsx`
- **Funzione**: `loadCompanyData()` - ricarica dati da `org_settings`

#### **3. Auto-Ricarica**
Aggiunti listener per ricaricare automaticamente quando:
- Si torna dalla pagina Settings (evento `focus` e `visibilitychange`)
- Si naviga indietro (evento `popstate`)

#### **4. Navigazione con Return**
- **Da InvoiceNew**: Passa parametro `return` quando si va a Settings
- **Da Settings**: Dopo il salvataggio, torna automaticamente alla pagina precedente

---

## 📋 **File Modificati**

1. ✅ `supabase/migrations/20250201_add_invoice_next_number_rpc.sql` - Nuova migration
2. ✅ `src/pages/InvoiceNew.jsx` - Aggiunto refresh e navigazione
3. ✅ `src/pages/Settings.jsx` - Salvataggio in `org_settings` e navigazione return

---

## 🔧 **Prossimi Passi**

1. **Applica la Migration**:
   - Vai su Supabase Dashboard → SQL Editor
   - Esegui il contenuto di `20250201_add_invoice_next_number_rpc.sql`

2. **Test**:
   - Crea una nuova fattura → verifica che il numero venga generato automaticamente
   - Modifica dati azienda in Settings → verifica che si aggiornino in "Nuovo Fattura"
   - Clicca "Aggiorna" → verifica che i dati vengano ricaricati

---

**Ultimo Aggiornamento**: Gennaio 2025

