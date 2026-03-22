# 🔍 TROVA IL TUO NUM_ISCR_SITO REALE

## ❌ PROBLEMA 403 FORBIDDEN

```
"num_iscr_sito": "OP1000ABC123456-MI0001"  ❌ INVENTATO!
```

RENTRI risponde **403** perché questo `num_iscr_sito` **NON ESISTE** nel database RENTRI per il tuo CF operatore.

---

## ✅ SOLUZIONE: Trova il Valore REALE

### Metodo 1: Portale Web RENTRI DEMO

1. **Vai su**: https://portale.rentri.gov.it (seleziona ambiente **DEMO**)
2. **Login** con SPID/CIE
3. **Area Operatori** → **I miei siti** / **Unità locali**
4. Trova il tuo `num_iscr_sito` (formato: `OP1234ABC567890-XX0001`)

**Screenshot** del portale e inviamelo!

---

### Metodo 2: Email di Conferma RENTRI

Quando hai scaricato il certificato `.p12` da RENTRI, dovresti aver ricevuto un'email con:

```
Oggetto: Certificato RENTRI rilasciato
...
CF Operatore: SCZMNL05L21D960T
Num. Iscrizione Sito: OP1234ABC567890-MI0001  ← QUESTO!
...
```

**Cerca** nell'email e copia il `num_iscr_sito` reale.

---

### Metodo 3: API Anagrafiche RENTRI

Possiamo interrogare l'API RENTRI per ottenere i tuoi siti registrati:

```bash
GET https://demoapi.rentri.gov.it/anagrafiche/v1.0/operatore/SCZMNL05L21D960T/siti
```

**Header**: `Authorization: Bearer {jwt}`

Questa API restituisce **tutti i tuoi siti registrati** con i relativi `num_iscr_sito`.

---

### Metodo 4: Sezione "Interoperabilità" Portale RENTRI

Nel portale web RENTRI, vai su:

**Interoperabilità** → **Gestione certificati** / **I miei certificati**

Lì dovresti vedere:
- Certificato scaricato
- CF Operatore
- **Unità locale associata** con `num_iscr_sito`

---

## 🎯 COSA FARE DOPO

Una volta trovato il **vero** `num_iscr_sito`, esegui questo SQL:

```sql
UPDATE rentri_org_certificates
SET num_iscr_sito = 'OP____VALORE_REALE____'
WHERE cf_operatore = 'SCZMNL05L21D960T';
```

Poi:
1. DELETE FIR vecchi
2. Riavvia app
3. Nuovo FIR → Trasmetti

---

## ⚠️ SE NON TROVI IL NUM_ISCR_SITO

Significa che **non hai ancora iscritto un'unità locale** in RENTRI DEMO.

In questo caso, devi:

1. Accedere al **portale web RENTRI DEMO**
2. **Iscrivere un'unità locale** (sito/sede operativa)
3. RENTRI ti assegnerà un `num_iscr_sito`
4. Usare quel valore per creare FIR via API

---

## 📚 RIFERIMENTO

Specifiche API RENTRI (formulari-v1.0.json, riga 9134-9138):

> `num_iscr_sito`: Numero iscrizione unità locale di riferimento a cui il formulario verrà associato.
> 
> **L'unità locale deve appartenere al produttore o al primo trasportatore.**

Questo spiega il **403 Forbidden**: RENTRI verifica che il `num_iscr_sito` sia:
1. Esistente nel database
2. Associato al CF dell'operatore autenticato
3. Appartenente al produttore o trasportatore del FIR



