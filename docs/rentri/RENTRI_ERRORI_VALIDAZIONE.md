# 🐛 Errori Validazione RENTRI FIR

## ✅ Autenticazione: FUNZIONA!

Non più 401! I due JWT funzionano correttamente! 🎊

---

## ❌ Errori Validazione Dati (400)

```json
{
  "num_iscr_sito": ["sys.invalid"],
  "dati_partenza.rifiuto": ["sys.required"],
  "dati_partenza.numero_fir": ["sys.invalid"],
  "dati_partenza.trasportatori": ["sys.required"],
  "dati_partenza.produttore.luogo_produzione.citta.comune_id": ["sys.invalid"]
}
```

---

## 🔍 Analisi Errori

### 1. `num_iscr_sito`: sys.invalid
**Problema**: Il NumIscrSito dell'operatore non è valido.

**Cosa inviamo**: Probabilmente il CF operatore invece del NumIscrSito.

**Fix**: Dobbiamo usare il vero NumIscrSito RENTRI (es: `OP123XXXXXXXX00-MI00001`).

### 2. `dati_partenza.rifiuto`: sys.required
**Problema**: Campo "rifiuto" mancante.

**Nota**: Stiamo inviando "rifiuti" (array), ma forse serve anche "rifiuto" (singolo)?

### 3. `dati_partenza.numero_fir`: sys.invalid
**Problema**: Il numero FIR `TEST-FIR-1764805951725` non è valido.

**Fix**: Probabilmente RENTRI si aspetta un formato specifico o preferisce assegnarlo lui.

### 4. `dati_partenza.trasportatori`: sys.required
**Problema**: Stiamo inviando "trasportatore" (singolo), ma serve "trasportatori" (array)?

### 5. `produttore.luogo_produzione.citta.comune_id`: sys.invalid
**Problema**: Il codice comune "F205" (Milano) non è valido per RENTRI.

**Fix**: Serve il codice ISTAT corretto.

---

## 🎯 Soluzioni

### Soluzione A: Consulta Schema API RENTRI
Leggere `formulari-v1.0.json` per vedere lo schema esatto richiesto.

### Soluzione B: Usa API Demo per Test Semplice
Prima di trasmettere FIR complessi, testa con endpoint più semplici (es: `/status`).

### Soluzione C: Contatta Supporto RENTRI
Email: techref@rentri.it
Chiedi esempio payload FIR valido per demo.

---

## 📊 Progresso

```
[✅] Upload Certificati: FUNZIONANTE
[✅] VPS OpenSSL: ATTIVO
[✅] JWT Autenticazione: CORRETTO (2 JWT)
[✅] JWT Integrità: CORRETTO (signed_headers)
[✅] Headers AgID: COMPLETI
[✅] Gateway mTLS: CONFIGURATO
[✅] Certificati: PULITI
[✅] Autenticazione RENTRI: SUCCESSO (non più 401!)
[⏳] Payload FIR: 5 campi da sistemare
```

---

## 🚀 Prossimi Step

1. ⏳ Leggere schema JSON formulari per struttura esatta
2. ⏳ Correggere builder payload FIR
3. ⏳ Aggiungere campi mancanti al form
4. ⏳ Testare con payload minimo valido

---

**L'autenticazione funziona! Ora serve sistemare la struttura del payload FIR.** 🎯

Vuoi che legga lo schema JSON dei formulari e sistemi il builder?

