# 🔧 Correzione Flusso Stato Fattura

**Data:** 14 gennaio 2026  
**Problema:** Dopo l'invio, la fattura mostra "non validata" invece di "sent"

---

## 🐛 Problema Identificato

**Sintomo:**
1. Utente clicca "Pronto per l'invio" → stato diventa "validated"
2. Utente clicca "Invia al SDI" → fattura viene inviata
3. Fattura mostra "non validata" invece di "sent"
4. Utente deve ricliccare "Pronto per l'invio"

**Causa:**
- **Doppio aggiornamento:** Sia il server che il client aggiornano lo stato
- **Race condition:** Il client potrebbe sovrascrivere l'aggiornamento del server
- **Mancanza di sincronizzazione:** Il client non aspetta che il server aggiorni lo stato

---

## ✅ Soluzione Implementata

### 1. Server (server.js)
**Aggiornamento migliorato:**
- ✅ Aggiorna lo stato a "sent" dopo invio riuscito
- ✅ Aggiorna tutte le informazioni necessarie (meta, filename, timestamp)
- ✅ Usa il filename come riferimento temporaneo per identificativo SDI
- ✅ Log per debug

**Codice:**
```javascript
// Aggiorna stato fatture dopo invio riuscito
const sentAt = new Date().toISOString();
const envLabel = useTestMode ? "TEST" : "PRODUCTION";

for (const invoice of invoices) {
  const baseMeta = invoice.meta || {};
  const updatedMeta = {
    ...baseMeta,
    sdi_sftp_filename: filename,
    sdi_sftp_sent_at: sentAt,
    sdi_sftp_test_mode: useTestMode,
    sdi_environment: envLabel,
    sdi_sent_at: sentAt,
    // ...
  };
  
  await supabase
    .from('invoices')
    .update({
      sdi_status: 'sent',
      meta: updatedMeta,
      provider_ext_id: filename,
    })
    .eq('id', invoice.id);
}
```

---

### 2. Client (InvoiceForm.jsx)
**Rimosso doppio aggiornamento:**
- ❌ Rimosso: Aggiornamento stato nel client dopo invio
- ✅ Mantenuto: Solo ricaricamento fattura per mostrare stato aggiornato
- ✅ Il server è l'unica fonte di verità per lo stato

**Codice:**
```javascript
// Il server ha già aggiornato lo stato a "sent" dopo l'invio riuscito
// Non serve fare un altro aggiornamento qui per evitare conflitti
// Ricarica semplicemente la fattura per mostrare lo stato aggiornato
console.log('[SDI] Invio completato, ricarico fattura per mostrare stato aggiornato');
await load();
```

---

## 📋 Flusso Corretto

### Prima (Problematico):
1. Utente clicca "Pronto per l'invio" → stato = "validated"
2. Utente clicca "Invia al SDI" → server invia e aggiorna a "sent"
3. Client aggiorna anche a "sent" → possibile conflitto
4. Client ricarica → stato potrebbe essere "validated" (sovrascritto)

### Dopo (Corretto):
1. Utente clicca "Pronto per l'invio" → stato = "validated"
2. Utente clicca "Invia al SDI" → server invia e aggiorna a "sent"
3. Client ricarica → stato = "sent" ✅

---

## 🎯 Vantaggi

1. **Single Source of Truth:** Solo il server aggiorna lo stato
2. **Nessun conflitto:** Eliminata race condition
3. **Stato corretto:** La fattura mostra sempre lo stato corretto dopo l'invio
4. **Meno click:** Non serve ricliccare "Pronto per l'invio"

---

## ⏳ Prossimi Passi

1. ✅ **Correzione implementata**
2. ⏳ **Deploy su VPS**
3. ⏳ **Test con nuova fattura**

---

**Status:** ✅ Correzione implementata - Pronto per deploy e test
