# 📋 Spiegazione: IdTrasmittente vs CedentePrestatore

## 🔍 Differenza Chiave

### **IdTrasmittente** (1.1.1 - DatiTrasmissione)
- **Chi è:** Il soggetto che **trasmette** la fattura a SDI
- **Può essere:**
  - ✅ **L'azienda stessa** (se trasmette direttamente) → Stessa P.IVA del CedentePrestatore
  - ✅ **Un intermediario/software provider** (se trasmette per conto dell'azienda) → P.IVA dell'intermediario

### **CedentePrestatore** (1.2)
- **Chi è:** Il soggetto che **emette** la fattura (chi vende/presta servizio)
- **Sempre:** La tua azienda (P.IVA del cedente/prestatore)

---

## 📊 Nel Tuo Caso

### Situazione Attuale (Codice)
```xml
<DatiTrasmissione>
  <IdTrasmittente>
    <IdPaese>IT</IdPaese>
    <IdCodice>02166430856</IdCodice>  <!-- ← Stesso del CedentePrestatore -->
  </IdTrasmittente>
  ...
</DatiTrasmissione>

<CedentePrestatore>
  <DatiAnagrafici>
    <IdFiscaleIVA>
      <IdPaese>IT</IdPaese>
      <IdCodice>02166430856</IdCodice>  <!-- ← Stesso dell'IdTrasmittente -->
    </IdFiscaleIVA>
  </DatiAnagrafici>
</CedentePrestatore>
```

**Interpretazione:** Stai trasmettendo direttamente (non tramite intermediario), quindi:
- **IdTrasmittente** = La tua P.IVA (02166430856)
- **CedentePrestatore** = La tua P.IVA (02166430856)

---

## ❌ Errore 00300 - Cosa Significa

**Errore:** `1.1.1.2 <IdCodice> non valido : 02166430856`

**Significato:** SDI non riconosce la P.IVA **02166430856** come **trasmittente registrato**.

### Possibili Cause:

1. **P.IVA non ancora registrata come trasmittente su SDI**
   - La P.IVA è valida (verificata sul sito)
   - Ma SDI non la riconosce come trasmittente abilitato
   - **Soluzione:** Completare la registrazione/attivazione su SDI

2. **Canale SFTP non completamente attivato**
   - Il canale SFTP è configurato
   - Ma la P.IVA potrebbe non essere ancora associata come trasmittente
   - **Soluzione:** Verificare con SDI lo stato dell'attivazione

3. **Ambiente test vs produzione**
   - In ambiente test potrebbe servire un periodo di attivazione
   - **Soluzione:** Attendere attivazione o verificare con SDI

---

## 🔄 Quando IdTrasmittente ≠ CedentePrestatore

### Esempio: Intermediario/Software Provider

```xml
<IdTrasmittente>
  <IdCodice>12345678901</IdCodice>  <!-- ← P.IVA dell'intermediario -->
</IdTrasmittente>

<CedentePrestatore>
  <IdFiscaleIVA>
    <IdCodice>02166430856</IdCodice>  <!-- ← P.IVA della tua azienda -->
  </IdFiscaleIVA>
</CedentePrestatore>
```

**In questo caso:**
- L'intermediario (P.IVA 12345678901) trasmette per conto tuo
- Tu emetti la fattura (P.IVA 02166430856)
- SDI verifica che l'intermediario sia registrato come trasmittente

---

## ✅ Nel Tuo Caso (Trasmissione Diretta)

**Se trasmetti direttamente** (senza intermediario):
- ✅ **IdTrasmittente** = La tua P.IVA (02166430856)
- ✅ **CedentePrestatore** = La tua P.IVA (02166430856)
- ✅ **Codice attuale:** Corretto (usa la stessa P.IVA)

**Problema:**
- ❌ SDI non riconosce la P.IVA come trasmittente registrato
- ⚠️ **Non è un problema di codice**, ma di **registrazione su SDI**

---

## 🎯 Cosa Fare

1. **Verifica registrazione su SDI**
   - Controlla se la P.IVA è registrata come trasmittente
   - Verifica lo stato dell'attivazione canale SFTP

2. **Contatta SDI se necessario**
   - Se la P.IVA non risulta abilitata, richiedi l'attivazione
   - Fornisci: P.IVA, nome azienda, data attivazione canale SFTP

3. **Verifica ambiente test**
   - In ambiente test potrebbe servire un periodo di attivazione
   - Verifica con SDI i tempi di attivazione

---

## 📝 Conclusione

**IdCodice nell'IdTrasmittente** = P.IVA del soggetto che trasmette (nel tuo caso, la tua azienda)

**L'errore 00300** significa che SDI non riconosce quella P.IVA come trasmittente registrato, non che il codice è sbagliato.

Il codice è corretto: usa la tua P.IVA sia per IdTrasmittente che per CedentePrestatore (trasmissione diretta).
