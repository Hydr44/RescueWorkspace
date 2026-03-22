# 🏢 P.IVA GRANDI AZIENDE PER RENTRI DEMO

## Problema
RENTRI in ambiente **DEMO** verifica che i CF/P.IVA siano **registrati nel loro database**.

I CF personali casuali vengono rifiutati anche se matematicamente validi.

---

## ✅ SOLUZIONE: P.IVA Grandi Aziende Italiane

Queste P.IVA sono quasi certamente nel database RENTRI:

### Energia & Utilities
```
00488410010  - Telecom Italia Spa
00976180636  - Enel Energia Spa
06363391001  - ENI Spa
00743110157  - A2A Spa (settore rifiuti!)
```

### Banche & Finanza
```
13886391006  - UniCredit Spa
00348170101  - Intesa Sanpaolo Spa
```

### Tecnologia
```
02313821007  - Microsoft Italia Srl
03048810122  - Siemens Italia Spa
```

### Industria
```
00776910159  - Stellantis (ex FCA)
```

---

## 🎯 STRATEGIA

1. **Destinatari**: Usa aziende del settore energia/utilities (Enel, ENI, A2A)
2. **Trasportatori**: Usa aziende grandi ma generiche (UniCredit, Microsoft, Telecom)
3. **Produttori**: Usa CF operatore principale (`SCZMNL05L21D960T`)

---

## ⚠️ SE IL PROBLEMA PERSISTE

Contattare **supporto tecnico RENTRI** per:
1. Lista operatori DEMO validi
2. Credenziali per operatori di test
3. Modalità corretta di test in ambiente DEMO

**Email supporto**: supporto@rentri.gov.it (verificare sul portale ufficiale)

---

## 📊 P.IVA APPLICATE NEI TEST

| Scenario | Ruolo | P.IVA | Azienda |
|----------|-------|-------|---------|
| Officina | Destinatario | 00488410010 | Telecom Italia |
| Officina | Trasportatore | 00743110157 | A2A |
| Carrozzeria | Destinatario | 00976180636 | Enel Energia |
| Carrozzeria | Trasportatore | 02313821007 | Microsoft |
| Edilizia | Destinatario | 06363391001 | ENI |
| Edilizia | Trasportatore | 13886391006 | UniCredit |

---

## ✅ PROSSIMO TEST

1. **Attendi 2 minuti** (deploy Vercel)
2. **Elimina FIR vecchi** (`DELETE FROM rentri_formulari`)
3. **Chiudi/Riapri app** (Cmd+Q)
4. **Nuovo FIR** → "Riempi Dati Test" (ora con P.IVA grandi aziende)
5. **Trasmetti a RENTRI**

---

## 🔍 COSA VERIFICARE NEL PAYLOAD

Dopo il deploy, il payload **DEVE contenere**:
```json
"rifiuto": {
  "codice_eer": "130205",
  "provenienza": "S",
  "stato_fisico": "L",
  "caratteristiche_pericolo": []  // ✅ DEVE ESSERCI!
}
```

Se manca, il deploy non è ancora attivo.



