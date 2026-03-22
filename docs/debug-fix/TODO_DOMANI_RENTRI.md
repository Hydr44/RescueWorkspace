# 📋 TODO Domani - Finire RENTRI

## ✅ Fatto Ieri

```
✅ Upload certificati automatico
✅ VPS server OpenSSL
✅ Due JWT separati (autenticazione + integrità)
✅ Pattern AgID completi
✅ Autenticazione RENTRI: FUNZIONA! (non più 401)
```

---

## 🎯 Da Fare Oggi (30 min)

### Step 1: Correggere 5 Errori Payload (20 min)

File da modificare: `website/src/lib/rentri/fir-builder.ts`

#### Errore 1: `num_iscr_sito` invalid
```javascript
// ❌ Ora: Uso CF operatore o valore random
num_iscr_sito: numIscrSitoOperatore

// ✅ Fix: Serve vero NumIscrSito RENTRI
// Formato: OP123XXXXXXXX00-MI00001
// Soluzione temporanea: Hardcode o campo in company_settings
num_iscr_sito: "OP100011134-MI00001"  // Dal certificato RENTRI-100011134
```

#### Errore 2: `dati_partenza.rifiuto` required
```javascript
// ❌ Ora: Solo array "rifiuti"
rifiuti: [...]

// ✅ Fix: Verificare schema se serve singolo "rifiuto" o solo array
// Probabilmente è giusto "rifiuti" ma da confermare
```

#### Errore 3: `dati_partenza.numero_fir` invalid
```javascript
// ❌ Ora: "TEST-FIR-1764805951725"
numero_fir: fir.numero_fir

// ✅ Fix: Lasciare vuoto, RENTRI lo assegna
// Oppure usare formato: "FIR-{anno}-{progressivo}"
```

#### Errore 4: `dati_partenza.trasportatori` required (plurale!)
```javascript
// ❌ Ora: Oggetto singolo
trasportatore: { ... }

// ✅ Fix: Array di trasportatori
trasportatori: [
  {
    codice_fiscale: fir.trasportatore_cf,
    denominazione: fir.trasportatore_nome,
    targa: fir.trasportatore_targa,
    ...
  }
]
```

#### Errore 5: `comune_id` invalid
```javascript
// ❌ Ora: "F205" (codice catastale?)
comune_id: prodIndirizzo.comuneId || "F205"

// ✅ Fix: Codice ISTAT comune (es: "015146" per Milano)
// Consultare tabella codifiche RENTRI o usare API /codifiche/v1.0
```

---

### Step 2: Test Payload Minimo (5 min)

Prima di sistemare tutto, testare con payload minimo:

```javascript
{
  num_iscr_sito: "OP100011134-MI00001",
  dati_partenza: {
    // NO numero_fir (lo assegna RENTRI)
    produttore: { ... },
    trasportatori: [ { ... } ],  // Array!
    destinatario: { ... },
    rifiuti: [ { ... } ]  // Verificare se serve "rifiuto" singolo
  }
}
```

---

### Step 3: Aggiornare Dati Test (3 min)

File: `desktop-app/src/pages/RifiutiFormularioForm.jsx`

Aggiornare scenari test con:
- Codici ISTAT comuni corretti
- Formato numero FIR corretto (o vuoto)
- Struttura conforme a schema

---

### Step 4: Test Trasmissione Finale (2 min)

```
1. Ricarica app
2. Nuovo FIR → Riempi Dati Test
3. Salva
4. Trasmetti a RENTRI
5. ✅ SUCCESSO!
```

---

## 📚 Risorse

### Manuali RENTRI
- `RENTRI-project/demo-docs/md/accesso-auth.md` - Autenticazione (FATTO ✅)
- `RENTRI-project/demo-docs/md/api-flussi-operativi-formulari.md` - Struttura FIR
- `RENTRI-project/demo-docs/api/formulari-v1.0.json` - Schema JSON

### Logs Vercel per Debug
https://vercel.com/hydr44s-projects/web → Functions → Cerca `[RENTRI-FIR]`

### Test Endpoint
```bash
# Health check
curl https://rentri-test.rescuemanager.eu/formulari/v1.0/status

# Con autenticazione (dopo fix)
```

---

## 🎯 Obiettivo Finale

```
[RENTRI-FIR] Tentativo 1/3...
[RENTRI-FIR] Successo al tentativo 1
[RENTRI-FIR] FIR trasmesso! ID RENTRI: FIR/2025/00001
```

**Alert UI**:
```
✅ FIR trasmesso con successo a RENTRI!

📋 Numero RENTRI: FIR/2025/00001
🆔 ID RENTRI: 12345678-abcd-...
📅 Data: 04/12/2025

Il FIR è ora visibile su portale RENTRI Demo.
```

---

## ⏱️ Stima Tempo

```
20 min: Fix payload
5 min:  Test minimo
3 min:  Aggiorna test data
2 min:  Test finale
─────────────────
30 min: TOTALE
```

---

## 🚀 Pronti?

**Iniziamo a correggere il payload?** 🎯

Leggo lo schema e sistemo i 5 errori uno alla volta.

