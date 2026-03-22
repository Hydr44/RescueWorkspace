# 📊 Rapporto Analisi Implementazione SDI vs Documentazione Ufficiale

## 🚨 1. Criticità di Sicurezza (URGENTE)

### **Verifica Certificati (mTLS) Disabilitata**
Nel file `src/lib/sdi/certificate-verification.ts`, la funzione `verifySDIRequest` è uno **stub che ritorna sempre `true`**.
```typescript
// src/lib/sdi/certificate-verification.ts
export function verifySDIRequest(...): boolean {
  // ...
  // Per ora, accettiamo tutte le richieste
  return true; // TODO: Implementare verifica completa
}
```
**Rischio**: Chiunque conosca l'endpoint `/api/sdi/ricezione` può inviare fatture false o notifiche malevole che verranno accettate dal sistema come se provenissero dal SDI.
**Soluzione Richiesta**: Implementare la verifica reale del Client Certificate che il SDI invia durante l'handshake mTLS. Se Vercel termina l'SSL, bisogna verificare l'header `x-client-cert` (o equivalente) e validarlo contro la CA del SDI.

### **Validazione IP Assente**
Il codice menziona una whitelist IP (`sdiIpWhitelist`) ma è vuota.
**Rischio**: Manca un livello di difesa in profondità.
**Soluzione**: Popolare la whitelist con gli IP ufficiali del SDI se disponibili e stabili, o affidarsi strettamente alla verifica mTLS.

---

## ⚠️ 2. Fragilità nel Parsing XML/SOAP

### **Uso di Regex per XML**
Nel file `src/app/api/sdi/_utils.ts`, il parsing delle fatture e delle notifiche avviene tramite **Regular Expressions** (`xml.match(...)`).
```typescript
// src/app/api/sdi/_utils.ts
const tipoDocumentoMatch = xml.match(/<TipoDocumento>([^<]+)<\/TipoDocumento>/i);
```
**Problema**: Questo approccio è estremamente fragile.
- Se il SDI cambia formattazione (es. spazi, namespace, attributi nel tag), la regex fallisce.
- Non gestisce i namespace XML correttamente (`<ns2:TipoDocumento>` non verrebbe catturato se non previsto).
- Non valida la struttura gerarchica (es. un tag annidato male verrebbe comunque letto).
**Soluzione**: Utilizzare un parser XML robusto come `fast-xml-parser` o `@xmldom/xmldom` (già presente nelle dipendenze) per trasformare l'XML in oggetti JavaScript navigabili in sicurezza.

### **Gestione MTOM/MIME Manuale**
In `src/lib/sdi/soap-reception.ts`, il parsing del multipart/related (MTOM) è fatto manualmente splittando le stringhe sui boundary.
**Rischio**: Sebbene funzionale per casi semplici, è prono a errori con encoding binari complessi o boundary formattati diversamente.
**Consiglio**: Monitorare attentamente i log di produzione. Se possibile, usare librerie dedicate per il parsing MIME.

---

## 📉 3. Incongruenze con la Documentazione SDI

### **Risposte SOAP Hardcoded**
Le risposte SOAP (es. `XML_OK_RESPONSE` in `route.ts`) sono stringhe hardcoded.
```typescript
const XML_OK_RESPONSE = '<?xml version="1.0" encoding="UTF-8"?><Esito>OK</Esito>';
```
**Incongruenza**: La documentazione SDI specifica che per `RicezioneFatture` la risposta deve essere una `RiceviFattureResponse` contenente l'esito `ER01`. Il codice tenta di costruire una risposta SOAP completa in `buildSOAPOkResponse`, ma c'è confusione tra quando ritornare XML semplice e quando SOAP.
- Se la richiesta è SOAP (dal SDI), la risposta **DEVE** essere SOAP.
- Il codice attuale ha dei branch `if (shouldReturnSoapResponse)` ma in caso di errore generico potrebbe ritornare stringhe vuote o formati non attesi dal SDI, causando cicli di ritrasmissione.

### **Mancata Validazione XSD**
Non c'è traccia di validazione dei file ricevuti contro gli schemi XSD ufficiali (`FatturaPA_v1.2.xsd`, ecc.).
**Rischio**: Si potrebbero salvare nel database file corrotti o non conformi che poi falliranno in fase di visualizzazione o elaborazione.

---

## 🛠️ 4. Stato Funzionalità

| Funzionalità | Stato Codice | Note |
|--------------|--------------|------|
| **Ricezione Fatture** | ⚠️ Parziale | Salva su DB, ma parsing fragile. |
| **Ricezione Notifiche** | ⚠️ Parziale | Gestisce vari tipi, ma logica basata su regex. |
| **Notifica Esito (EC01/02)** | ❓ Da Verificare | Codice presente per invio automatico, ma va testato con certificati reali. |
| **Decorrenza Termini** | ❌ Minima | Solo log, nessuna azione di business (es. notifica utente). |

## 📝 Raccomandazioni Immediate

1.  **FIX URGENTE**: Implementare la logica di verifica certificato in `verifySDIRequest`. Senza questa, l'endpoint è insicuro.
2.  **Refactoring Parsing**: Sostituire le Regex con `DOMParser` o `fast-xml-parser` per leggere i dati chiave (Partita IVA, Esito, ecc.).
3.  **Test Interoperabilità**: Eseguire i test con il Kit di Test del SDI per verificare che le risposte SOAP generate siano accettate dal validatore del SDI.
