# 🎉 dnQualifier TROVATO NEL CERTIFICATO

## ✅ DATI ESTRATTI

```
Subject: dnQualifier=RENTRI-100011134, 
         CN=SCOZZARINI EMMANUEL SALVATORE, 
         organizationIdentifier=CF:IT-SCZMNL05L21D960T, 
         O=SCOZZARINI EMMANUEL SALVATORE, 
         C=IT

Email: RESCUEMANAGER@LEGALMAIL.IT
```

---

## 🔍 ANALISI

- **dnQualifier**: `RENTRI-100011134`
- **Codice operatore**: `100011134` (9 cifre)

---

## ⚠️ PROBLEMA

Il `dnQualifier` contiene solo il **codice operatore**, NON il `num_iscr_sito` completo.

Il `num_iscr_sito` ha formato: `OP[4][3][6]-[2][4]` (22 caratteri)

Esempio: `OP1000ABC123456-MI0001`

---

## 🎯 SOLUZIONI POSSIBILI

### Opzione 1: Tentativo Pattern da dnQualifier

Il codice `100011134` (9 cifre) potrebbe essere scomposto così:
```
1000 (4) + 111 (3) + 34 (2)
```

**Ma mancano**:
- 6 cifre centrali (invece di 2)
- Provincia (2 lettere)
- Progressivo sito (4 cifre)

**Pattern tentativo**:
```
OP1000111340000-MI0001
  ^^^^ ^^^ ^^^^^^  ^^ ^^^^
  1000 111 340000  MI 0001
```

---

### Opzione 2: Controlla Database Supabase

Abbiamo salvato `num_iscr_sito` nel DB?

```sql
SELECT num_iscr_sito
FROM rentri_org_certificates
WHERE cf_operatore = 'SCZMNL05L21D960T';
```

---

### Opzione 3: Portale Web RENTRI (PIÙ SICURO)

1. Vai su: **https://portale.rentri.gov.it** (ambiente DEMO)
2. Login con SPID/CIE
3. **Area Operatori** → **I miei siti** / **Unità locali**
4. Copia il `num_iscr_sito` esatto

---

## 📋 PROSSIMI PASSI

1. **Esegui SQL** su Supabase per verificare se `num_iscr_sito` è salvato
2. **Se NULL o sbagliato**: accedi al portale RENTRI e trova il valore reale
3. **Aggiorna** `rentri_org_certificates` con il valore corretto
4. **Riprova** la trasmissione FIR

---

## 🔍 NOTA

Il `dnQualifier` nel certificato serve per **identificare l'operatore**, ma NON è il `num_iscr_sito` dell'unità locale.

Ogni operatore può avere **più unità locali** (siti), ognuna con il proprio `num_iscr_sito`.

Il certificato è legato all'**operatore** (dnQualifier), ma il FIR deve essere creato per una specifica **unità locale** (num_iscr_sito).



