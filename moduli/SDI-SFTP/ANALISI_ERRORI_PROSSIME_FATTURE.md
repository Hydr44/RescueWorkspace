# 🔍 Analisi Errori - Prossime Fatture

**Data:** 14 gennaio 2026

---

## ✅ Errore 00427 - RISOLTO NEL CODICE

**Errore:** CodiceDestinatario lunghezza errata per FormatoTrasmissione

**Status:** ✅ **CORRETTO NEL CODICE**

- Il codice ora gestisce correttamente:
  - **FPA12** → CodiceDestinatario = 6 caratteri
  - **FPR12** → CodiceDestinatario = 7 caratteri
- **Conclusione:** ✅ **Non si verificherà più** nelle prossime fatture (dopo deploy)

---

## ⚠️ Errore 00300 - DIPENDE DAI DATI

**Errore:** 1.1.1.2 <IdCodice> non valido (02166430856)

**Causa:** IdCodice del trasmittente non valido nell'anagrafe tributaria

**Status:** ⚠️ **Dipende dai dati inseriti**

- Se i dati azienda (P.IVA) sono corretti → ✅ Non si verificherà
- Se i dati sono errati o la P.IVA non è valida → ❌ Si verificherà

---

## ⚠️ Errore 00305 - DIPENDE DAI DATI

**Errore:** 1.4.1.1.2 <IdCodice> non valido (12345678901)

**Causa:** IdCodice del cessionario/committente non valido nell'anagrafe tributaria

**Status:** ⚠️ **Dipende dai dati inseriti**

- Se i dati cliente (P.IVA) sono corretti → ✅ Non si verificherà
- Se i dati sono errati o la P.IVA non è valida → ❌ Si verificherà
- **Nota:** "12345678901" è chiaramente un dato di test fittizio

---

## ⚠️ Errore 00311 - DIPENDE DAI DATI

**Errore:** CodiceDestinatario non valido (VRCAXR non trovato)

**Causa:** CodiceDestinatario non presente/attivo nell'anagrafica IPA

**Status:** ⚠️ **Dipende dai dati inseriti**

- Se il CodiceDestinatario è valido e attivo nell'anagrafica IPA → ✅ Non si verificherà
- Se il CodiceDestinatario non esiste o non è attivo → ❌ Si verificherà
- **Nota:** "VRCAXR" sembra un dato di test fittizio

---

## 📋 Riepilogo

| Errore | Tipo | Status Prossime Fatture |
|--------|------|-------------------------|
| **00427** | Codice | ✅ **RISOLTO** - Non si verificherà più |
| **00300** | Dati | ⚠️ Dipende da dati azienda corretti |
| **00305** | Dati | ⚠️ Dipende da dati cliente corretti |
| **00311** | Dati | ⚠️ Dipende da CodiceDestinatario valido |

---

## ✅ Conclusione

**Errore 00427:**
- ✅ **Risolto nel codice**
- ✅ **Non si verificherà più** dopo il deploy

**Errori 00300, 00305, 00311:**
- ⚠️ **Dipende dai dati inseriti**
- Se i dati sono corretti (P.IVA valide, CodiceDestinatario valido) → ✅ Non si verificheranno
- Se i dati sono errati o di test → ❌ Si verificheranno

**Raccomandazione:**
- Verificare che i dati azienda e cliente siano corretti prima di inviare
- Verificare che il CodiceDestinatario sia valido e attivo nell'anagrafica IPA

---

**Status:** ✅ Errore 00427 risolto - Altri errori dipendono dai dati inseriti
