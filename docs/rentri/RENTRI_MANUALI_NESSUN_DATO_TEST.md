# 📚 VERIFICA MANUALI RENTRI - DATI DI TEST

## ❌ RISULTATO: Nessun Dato di Test Ufficiale

Ho verificato **tutti i manuali RENTRI** (`RENTRI-project/demo-docs/`):

- ✅ `esempi.md` - Solo codice C#/PHP con placeholder "XXX"
- ✅ `supporto-faq.md` - FAQ generiche
- ✅ `api-flussi-operativi-*.md` - Documentazione endpoint
- ✅ `*.json` (OpenAPI spec) - Solo definizioni schema

**Nessun file contiene**:
- CF di test
- P.IVA di test
- Operatori DEMO specifici
- Dati di esempio per FIR

---

## 📋 INFORMAZIONI TROVATE

### 1. Ambiente DEMO
```
URL: https://demoapi.rentri.gov.it
Audience JWT: rentrigov.demo.api
```

### 2. Limitazioni DEMO
- Max **100 blocchi** per operatore (vs 500 in produzione)
- Max **500 richieste/giorno** per operatore

### 3. Certificati
**Due tipi supportati**:
1. **CNS (Carta Nazionale Servizi)** - Certificato personale
2. **Certificato di Dominio RENTRI** - File `.p12` rilasciato da RENTRI

**Validazione certificati in DEMO**:
> "Esclusivamente in ambiente DEMO, se il certificato firmatario non viene riconosciuto come valido secondo la regola qui descritta, il sistema produrrà un **avviso non bloccante**."

Fonte: `formulari-v1.0.json`, righe 517 e 1362

---

## 🔍 CONCLUSIONI

I manuali **NON forniscono** dati di test (CF/P.IVA) perché:

1. **RENTRI richiede registrazione reale** anche in DEMO
2. Gli operatori devono **accreditarsi** al sistema
3. L'accreditamento verifica:
   - Registro Imprese (per aziende)
   - PEC (per enti)
   - Codice fiscale (per professionisti)

---

## ✅ RACCOMANDAZIONI

### Opzione 1: Usa il TUO CF operatore
Il tuo certificato RENTRI (`SCZMNL05L21D960T`) **è già accreditato**.

**Test**:
```javascript
produttore: { cf: "SCZMNL05L21D960T" },
destinatario: { cf: "SCZMNL05L21D960T" },
trasportatore: { cf: "SCZMNL05L21D960T" }
```

### Opzione 2: Contatta Supporto RENTRI
**Email**: `techref@rentri.it` (da manuali)

**Richiedi**:
1. Lista operatori DEMO validi
2. CF/P.IVA di test per FIR
3. Conferma validazione in ambiente DEMO

### Opzione 3: P.IVA Grandi Aziende
Le P.IVA che abbiamo usato (Telecom, Enel, ENI) **potrebbero** essere registrate in RENTRI.

**Nota**: Potrebbe richiedere che queste aziende abbiano effettivamente caricato dati in RENTRI DEMO.

---

## 🎯 PROSSIMO STEP

**TESTA con il TUO CF** (`SCZMNL05L21D960T`) per tutti i ruoli:

```sql
-- Riempi dati test con CF operatore principale
UPDATE rentri_formulari
SET 
  produttore_cf = 'SCZMNL05L21D960T',
  destinatario_cf = 'SCZMNL05L21D960T',
  trasportatore_cf = 'SCZMNL05L21D960T'
WHERE org_id = '1ea3be12-a439-46ac-94d9-eaff1bb346c2';
```

Se funziona, confermiamo che **RENTRI valida solo CF registrati**.



