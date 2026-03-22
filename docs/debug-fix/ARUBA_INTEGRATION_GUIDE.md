# 🔗 Guida Integrazione Aruba Fatturazione Elettronica

## 📋 **Panoramica**

Questa guida spiega come integrare **Aruba Fatturazione Elettronica** nella tua app, sostituendo l'invio diretto a SDI con Aruba come intermediario.

**Vantaggi:**
- ✅ I clienti **NON si loggano** su Aruba
- ✅ Inseriscono dati **direttamente nella tua app**
- ✅ Aruba gestisce tutto: firma, invio SDI, notifiche
- ✅ Meno complessità tecnica per te

---

## 🚀 **Step 1: Registrazione Aruba**

### 1.1 Crea Account
1. Vai su https://www.aruba.it/fatturazione-elettronica
2. Clicca "Registrati" o "Accedi"
3. Completa la registrazione

### 1.2 Attiva Servizio
1. Nel pannello Aruba → "Fatturazione Elettronica"
2. Scegli piano (base, avanzato, ecc.)
3. Completa configurazione:
   - **Dati aziendali**: P.IVA, CF, indirizzo
   - **Certificato digitale**: Carica il tuo `.p12` (quello che hai già)
   - **Webhook URL**: `https://rescuemanager.eu/api/billing/aruba/webhook`

### 1.3 Ottieni Credenziali API
1. Nel pannello Aruba → "API" o "Integrazione"
2. Genera **API Key** / **Token**
3. Copia:
   - `API Key`
   - `Endpoint API` (es: `https://ws.fatturazioneelettronica.aruba.it/api/v1`)

---

## ⚙️ **Step 2: Configurazione Vercel**

Aggiungi queste variabili d'ambiente in **Vercel Secrets**:

```bash
ARUBA_API_KEY=your_api_key_here
ARUBA_ENDPOINT=https://ws.fatturazioneelettronica.aruba.it/api/v1
ARUBA_WEBHOOK_URL=https://rescuemanager.eu/api/billing/aruba/webhook
```

**Come fare:**
1. Vai su Vercel Dashboard → Il tuo progetto
2. Settings → Environment Variables
3. Aggiungi le 3 variabili sopra

---

## 🔧 **Step 3: Modifica Flusso Fatturazione**

### 3.1 Nel Desktop App

**Prima (invio diretto SDI):**
```javascript
// src/pages/InvoiceForm.jsx
const result = await sendInvoiceToSDI(invoiceId, { testMode });
```

**Dopo (con Aruba):**
```javascript
// src/pages/InvoiceForm.jsx
const result = await fetch('/api/billing/aruba/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ invoice_id: invoiceId }),
});
const data = await result.json();
```

### 3.2 Nel Website

**Prima:**
```typescript
// src/app/api/sdi/trasmissione/route.ts
const sdiResponse = await sendInvoiceToSDI(invoiceXml, fileName, 'production');
```

**Dopo:**
```typescript
// Usa il nuovo endpoint Aruba
// Oppure modifica direttamente per usare ArubaClient
import { createArubaClient } from '@/lib/billing/aruba-client';

const arubaClient = createArubaClient();
const result = await arubaClient.sendInvoice({
  xml: invoiceXml,
  fileName,
  metadata: { invoiceId: invoice.id },
});
```

---

## 📡 **Step 4: Webhook Aruba**

### 4.1 Configura Webhook su Aruba

1. Nel pannello Aruba → "Webhook" o "Notifiche"
2. Aggiungi URL: `https://rescuemanager.eu/api/billing/aruba/webhook`
3. Seleziona eventi:
   - ✅ Fattura inviata
   - ✅ Fattura accettata
   - ✅ Fattura rifiutata
   - ✅ Fattura consegnata
   - ✅ Errori

### 4.2 Test Webhook

Aruba dovrebbe chiamare automaticamente il tuo endpoint quando cambia lo stato di una fattura.

Puoi testare con:
```bash
curl -X POST https://rescuemanager.eu/api/billing/aruba/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "invoice.accepted",
    "invoice_id": "test-123",
    "sdi_id": "SDI-123456",
    "status": "accepted",
    "metadata": { "invoiceId": "your-invoice-id" }
  }'
```

---

## 🔄 **Flusso Completo**

### **1. Cliente inserisce dati fattura**
```
Cliente → Tua App → Form Fattura
```

### **2. Generi XML FatturaPA**
```
Tua App → generateFatturaPAXML() → XML completo
```

### **3. Invii ad Aruba**
```
Tua App → POST /api/billing/aruba/send → Aruba API
```

### **4. Aruba gestisce tutto**
```
Aruba:
  ├── Firma digitale XML
  ├── Invio a SDI
  ├── Ricezione esiti
  └── Notifica a te (webhook)
```

### **5. Ricevi notifiche**
```
Aruba → POST /api/billing/aruba/webhook → Tua App
  ├── Aggiorna status fattura
  └── Notifica cliente (opzionale)
```

---

## 📝 **Esempio Completo**

### **Frontend (Desktop App)**

```javascript
// src/pages/InvoiceForm.jsx

async function sendToAruba() {
  try {
    setSending(true);
    
    // Invia ad Aruba invece che direttamente a SDI
    const response = await fetch('/api/billing/aruba/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        invoice_id: invoiceId 
      }),
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Errore invio');
    }

    // Aggiorna UI
    setInfo(`Fattura inviata ad Aruba. ID: ${result.aruba_invoice_id}`);
    
    // Status verrà aggiornato automaticamente via webhook
    // quando Aruba riceve esito da SDI
    
  } catch (error) {
    setErr(error.message);
  } finally {
    setSending(false);
  }
}
```

### **Backend (API Route)**

```typescript
// src/app/api/billing/aruba/send/route.ts
// (già implementato sopra)
```

---

## 🧪 **Test**

### **1. Test Invio Fattura**
```bash
curl -X POST https://rescuemanager.eu/api/billing/aruba/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"invoice_id": "your-invoice-id"}'
```

### **2. Verifica Status**
Controlla nel database che la fattura abbia:
- `sdi_status`: 'sent'
- `meta.aruba.invoice_id`: ID Aruba
- `meta.aruba.status`: 'pending' o 'sent'

### **3. Test Webhook**
Aruba chiamerà automaticamente il webhook quando cambia lo status.

---

## ⚠️ **Note Importanti**

### **1. Certificato Digitale**
- Usa lo stesso certificato che hai già per SDI
- Aruba lo userà per firmare le fatture

### **2. Costi**
- Aruba ha piani mensili (da ~€20-30/mese)
- Controlla limiti fatture incluse nel piano

### **3. Fallback**
- Puoi mantenere entrambi i flussi (SDI diretto + Aruba)
- Usa Aruba per produzione, SDI diretto per test

### **4. Webhook Security**
- Aruba dovrebbe firmare le richieste webhook
- Implementa verifica firma (vedi commento nel codice)

---

## 🐛 **Troubleshooting**

### **Errore: "ARUBA_API_KEY non configurata"**
- Verifica variabili d'ambiente in Vercel
- Riavvia deployment dopo aver aggiunto variabili

### **Errore: "Fattura non trovata" (webhook)**
- Verifica che `metadata.invoiceId` sia passato correttamente
- Controlla che il numero fattura corrisponda

### **Webhook non ricevuto**
- Verifica URL webhook in pannello Aruba
- Controlla log Vercel per errori
- Testa endpoint manualmente con curl

---

## 📚 **Riferimenti**

- **Documentazione Aruba**: https://fatturazioneelettronica.aruba.it/documentazione
- **Supporto Aruba**: supporto@aruba.it
- **API Reference**: Disponibile nel pannello Aruba

---

## ✅ **Checklist Implementazione**

- [ ] Registrato su Aruba
- [ ] Attivato servizio Fatturazione Elettronica
- [ ] Ottenuto API Key
- [ ] Configurato variabili d'ambiente Vercel
- [ ] Configurato webhook URL su Aruba
- [ ] Testato invio fattura
- [ ] Testato webhook
- [ ] Aggiornato UI per usare Aruba
- [ ] Documentato per team

---

**Pronto a partire?** 🚀

