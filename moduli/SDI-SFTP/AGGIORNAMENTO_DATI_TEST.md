# Aggiornamento Dati Test SDI-SFTP

## ✅ Modifiche Effettuate

### 1. `fillTestData()` in `InvoiceNew.jsx`

**Aggiornato con dati validi:**
- ✅ P.IVA B2B: `IT12345678901` (formato corretto con prefisso IT)
- ✅ Indirizzi completi e validi (non placeholder)
- ✅ Codici destinatario test corretti (VRFFZQ per PA, VRCAXRR per B2B)
- ✅ Descrizione servizio: "Servizio Test SDI-SFTP"

### 2. `xml-generator.js` - Validazione Dati

**Aggiunta validazione per evitare valori placeholder:**
- ✅ Controllo `IdCodice` (non può essere `XXXXXXX`)
- ✅ Controllo `Denominazione` (non può essere `'Da configurare'`)
- ✅ Controllo indirizzo completo (Via, CAP, Comune, Provincia validi)
- ✅ Messaggi di errore chiari che indicano di configurare Settings

**Prima:**
```javascript
<IdCodice>${esc(cedente.id_fiscale_iva?.id_codice || cedente.id_codice || 'XXXXXXX')}</IdCodice>
<Denominazione>${esc(cedente.denominazione || 'Da configurare')}</Denominazione>
```

**Dopo:**
```javascript
// Validazione obbligatoria
if (!idCodice || idCodice === 'XXXXXXX') {
  throw new Error('IdCodice obbligatorio. Configura i dati azienda in Settings.');
}
if (!denominazione || denominazione === 'Da configurare') {
  throw new Error('Denominazione obbligatoria. Configura i dati azienda in Settings.');
}
// ... validazione indirizzo completo
```

## 📋 Dati Test Configurati

### Test PA (Pubblica Amministrazione)
- **Cliente**: Comune di Test
- **Codice Destinatario**: VRFFZQ
- **Indirizzo**: Via Roma 1, 00100 Roma (RM)
- **P.IVA**: (vuoto - PA può non avere)
- **Servizio**: Servizio Test SDI-SFTP - 100.00€ - IVA 22%

### Test B2B (Azienda)
- **Cliente**: Azienda Test SRL
- **Codice Destinatario**: VRCAXRR
- **Indirizzo**: Via Garibaldi 123, 20121 Milano (MI)
- **P.IVA**: IT12345678901 (formato corretto)
- **Servizio**: Servizio Test SDI-SFTP - 200.00€ - IVA 22%

## 🎯 Come Usare

1. **Aprire "Nuova Fattura"**
2. **Cliccare "Test PA" o "Test B2B"** per riempire dati validi
3. **Verificare che i dati azienda siano configurati in Settings** (obbligatorio)
4. **Salvare fattura**
5. **Inviare a SDI**

## ⚠️ Importante

**I dati azienda (Cedente/Prestatore) DEVONO essere configurati in Settings:**
- Denominazione azienda
- Partita IVA / Codice Fiscale
- Indirizzo completo (Via, CAP, Comune, Provincia)

Se non configurati, la generazione XML fallirà con un errore chiaro.

## 🔍 Verifica

Dopo l'invio, verificare:
1. File generato su SFTP: `/var/sftp/sdi/DatiVersoSdITest/`
2. XML interno valido (senza valori placeholder)
3. File prelevato da SDI (dovrebbe essere prelevato se dati validi)

