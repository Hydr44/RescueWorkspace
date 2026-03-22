# ✅ Bottone "Riempi Dati Test" Aggiunto!

## 🎯 Implementazione Completata

Ho aggiunto il bottone per precompilare i dati di test con i codici destinatario forniti.

## 📋 Cosa è Stato Aggiunto

### 1. Funzione `fillTestData(type)`

**File**: `desktop-app/greeting-friend-api-main/src/pages/InvoiceNew.jsx`

La funzione precompila automaticamente:

**Per PA (Pubblica Amministrazione):**
- Cliente: "Comune di Test"
- Codice Destinatario: `VRFFZQ` (primo codice PA)
- Indirizzo: Via Roma 1, 00100 Roma (RM)
- Riga fattura: Servizio Test - 1 pz - 100.00€ - IVA 22%
- Ambiente: TEST

**Per B2B:**
- Cliente: "Azienda Test SRL"
- Partita IVA: 12345678901
- Codice Destinatario: `VRCAXRR` (primo codice B2B)
- Indirizzo: Via Garibaldi 123, 20121 Milano (MI)
- Riga fattura: Servizio Test - 1 pz - 200.00€ - IVA 22%
- Ambiente: TEST

### 2. Bottoni nella Sezione "Trasmissione SdI"

Due bottoni aggiunti nella sezione "Trasmissione SdI":
- **"Test PA"** - Precompila dati per Pubblica Amministrazione
- **"Test B2B"** - Precompila dati per Business to Business

## 🚀 Come Usare

1. Aprire "Fatture" → "Nuova Fattura"
2. Scorrere fino alla sezione **"Trasmissione SdI"**
3. Cliccare uno dei bottoni:
   - **"Test PA"** per fattura a Pubblica Amministrazione
   - **"Test B2B"** per fattura B2B
4. I dati verranno precompilati automaticamente
5. Modificare se necessario e salvare

## 📝 Codici Destinatario Usati

- **PA**: `VRFFZQ` (primo della lista)
- **B2B**: `VRCAXRR` (primo della lista)

Gli altri codici sono disponibili in `CODICI_DESTINATARIO_TEST.md` e possono essere inseriti manualmente se necessario.

## ✅ Pronto per Test!

Ora puoi testare facilmente cliccando il bottone e precompilando tutto automaticamente!

