# 🔍 Debug: Invio Fattura al SDI

Guida per diagnosticare perché la fattura non viene inviata.

---

## ✅ **Checklist Pre-Invio**

Prima di inviare, verifica:

1. **Fattura Validata**:
   - Stato fattura deve essere `validated` o `rejected`
   - Clicca **"Pronto per Invio"** se non lo è

2. **Dati Azienda Completi**:
   - Vai su **Settings → Azienda**
   - Compila: Nome, P.IVA, Indirizzo completo
   - **Salva**

3. **Modalità Test SDI**:
   - Se stai testando, attiva **"Modalità Test SDI"** ✅
   - Per produzione, lascia disattivato

---

## 🔍 **Debug: Console Browser**

Apri la **Console del Browser** (F12 → Console) e cerca questi log:

### **1. Quando Clicchi "Invia al SDI"**

Dovresti vedere:
```
[SDI] Inizio invio fattura: { invoiceId: "...", testMode: true/false }
[SDI] Chiamata API sendInvoiceToSDI...
[SDI] sendInvoiceToSDI chiamato: { invoiceId: "...", testMode: true/false, endpoint: "..." }
[SDI] Payload: { invoice_id: "..." }
[SDI] Risposta HTTP: { status: 200, statusText: "OK", ok: true }
[SDI] Dati risposta: { success: true, identificativo_sdi: "..." }
```

### **2. Se C'è un Errore**

Cerca errori che iniziano con `[SDI]`:
- `[SDI] Errore invio:` - Problema con l'API
- `[SDI] Errore risposta:` - Problema con la risposta HTTP
- `[SDI] Errore aggiornamento fattura:` - Problema aggiornamento database

---

## 🧪 **Test Endpoint API**

Testa manualmente l'endpoint API:

### **Test Endpoint Info**
```bash
curl https://rescuemanager.eu/api/sdi/test
```

**Risposta attesa:**
```json
{
  "success": true,
  "endpoints": {
    "test": {
      "trasmissione": "https://rescuemanager.eu/api/sdi/test/trasmissione",
      "ricezione": "https://rescuemanager.eu/api/sdi/test/ricezione"
    }
  }
}
```

### **Test Trasmissione (con invoice_id reale)**
```bash
curl -X POST https://rescuemanager.eu/api/sdi/test/trasmissione \
  -H "Content-Type: application/json" \
  -d '{"invoice_id": "TUO_INVOICE_ID"}'
```

**Risposta attesa:**
```json
{
  "success": true,
  "message": "Fattura inviata al SDI (TEST)",
  "identificativo_sdi": "..."
}
```

---

## ⚠️ **Problemi Comuni**

### **1. Errore: "Fattura non validata"**
**Soluzione**: Clicca **"Pronto per Invio"** prima di inviare

### **2. Errore: "Fattura non trovata"**
**Soluzione**: 
- Verifica che l'`invoice_id` sia corretto
- Verifica che la fattura esista nel database

### **3. Errore: "XML fattura mancante o vuoto"**
**Soluzione**:
- Verifica che la fattura abbia righe (`invoice_items`)
- Verifica che i dati azienda siano completi in Settings

### **4. Errore: "Errore invio al SDI"**
**Possibili cause**:
- Certificati SDI non configurati (chiavi private mancanti)
- SDI non raggiungibile (problema rete)
- XML non valido

**Soluzione**:
- Verifica log Vercel per errori dettagliati
- Controlla che i certificati siano configurati

### **5. Nessun Errore, ma Fattura Non InviatA**
**Verifica**:
1. Controlla **Console Browser** per log `[SDI]`
2. Controlla **Network Tab** (F12 → Network) per vedere la chiamata `/api/sdi/trasmissione`
3. Verifica **Risposta HTTP** (status code e body)

---

## 📊 **Verifica Stato Fattura**

Dopo l'invio, verifica:

1. **Stato Fattura**:
   - Dovrebbe essere `sent`
   - Se è `draft` o `validated`, l'invio non è andato a buon fine

2. **Identificativo SDI**:
   - Dovrebbe essere presente in `provider_ext_id`
   - Se è `null`, l'invio non ha ricevuto identificativo SDI

3. **Eventi SDI**:
   - Vai su **Fatture** → **Dettaglio Fattura** → **Eventi SDI**
   - Dovresti vedere **"TrasmissioneFattura"**

---

## 🔧 **Log Vercel**

Per vedere gli errori server-side:

1. Vai su **Vercel Dashboard** → **Tuo Progetto** → **Logs**
2. Filtra per `/api/sdi/`
3. Cerca errori che iniziano con `[SDI]`

**Log importanti**:
- `[SDI] Trasmissione fattura richiesta:` - Richiesta ricevuta
- `[SDI] Fattura trasmessa:` - Invio riuscito
- `[SDI] Errore trasmissione fattura:` - Errore durante invio

---

## 📝 **Checklist Debug Completa**

- [ ] Console browser aperta (F12)
- [ ] Fattura validata (`sdi_status = "validated"`)
- [ ] Dati azienda completi in Settings
- [ ] Modalità Test SDI attiva (se testando)
- [ ] Log `[SDI]` visibili in console
- [ ] Chiamata API visibile in Network tab
- [ ] Risposta API con `success: true`
- [ ] Stato fattura aggiornato a `sent`
- [ ] Evento SDI registrato nel database

---

**Ultimo Aggiornamento**: Gennaio 2025

