# 📋 GUIDA: Creare Unità Locale in RENTRI DEMO

## 🎯 PROCEDURA COMPLETA

### 1️⃣ Accedi al Portale RENTRI

**URL**: https://portale.rentri.gov.it

- Seleziona **ambiente DEMO** (switcher in alto a destra)
- Login con **SPID** o **CIE**

---

### 2️⃣ Trova "Aggiungi Unità Locale"

Nel menu principale, cerca una di queste voci:
- **"Aggiungi Unità Locale"**
- **"Nuova Unità Locale"**
- **"Iscrizione Unità Locale"**
- **"Gestione Unità Locali"** → poi "Aggiungi"

**Possibili percorsi**:
- `Menu → Anagrafica → Unità Locali → Aggiungi`
- `Menu → Iscrizione → Aggiungi Unità Locale`
- `Menu → Area Operatori → I Miei Siti → Nuovo Sito`

---

### 3️⃣ METODO 1: Importazione da Registro Imprese

**Se sei un'impresa registrata**:

1. Clicca su **"Importazione da Registro Imprese"**
2. Il sistema mostra le tue sedi già registrate
3. **Seleziona** la sede che vuoi importare
4. Clicca **"Conferma"**

✅ **Vantaggi**: Dati già compilati, nessun errore

---

### 3️⃣ METODO 2: Inserimento Manuale

**Se sei professionista o la sede non è nel Registro Imprese**:

1. Clicca su **"Inserimento Manuale"**

2. **Compila i dati**:
   ```
   Nome unità locale: "Sede Operativa Milano"
   
   Indirizzo:
   - Via: Via Mazzini
   - Numero civico: 12
   - CAP: 20025
   - Comune: Legnano
   - Provincia: MI
   
   Attività (seleziona almeno 1):
   ☑ Produzione di rifiuti
   ☑ Trasporto di rifiuti
   ☐ Recupero di rifiuti
   ☐ Smaltimento di rifiuti
   ☐ Intermediazione senza detenzione
   
   Profilo (in DEMO):
   ☑ Produttore
   ☑ Trasportatore
   ☐ Destinatario
   ☐ Intermediario
   ```

3. **Autorizzazioni** (in DEMO: **NON richieste!**)
   - In ambiente DEMO puoi **saltare** le autorizzazioni
   - RENTRI accetta profili senza documenti validi

4. Clicca **"Conferma"** / **"Salva"**

---

### 4️⃣ RENTRI Assegna il `num_iscr_sito`

Dopo la conferma, RENTRI ti mostra:

```
✅ Unità locale creata con successo!

Numero iscrizione sito: OP100011134ABC-MI0001
                        ^^^^^^^^^^^^^^^^^^^^^^
                        QUESTO È IL VALORE!
```

**COPIA** questo valore!

---

### 5️⃣ Aggiorna il Database

Esegui su Supabase:

```sql
UPDATE rentri_org_certificates
SET num_iscr_sito = 'OP100011134ABC-MI0001'  -- Usa valore REALE dal portale
WHERE cf_operatore = 'SCZMNL05L21D960T';

-- Verifica
SELECT num_iscr_sito, cf_operatore
FROM rentri_org_certificates
WHERE cf_operatore = 'SCZMNL05L21D960T';
```

---

### 6️⃣ Riprova la Trasmissione FIR

```sql
-- Elimina FIR vecchi
DELETE FROM rentri_formulari
WHERE org_id = '1ea3be12-a439-46ac-94d9-eaff1bb346c2';
```

Poi:
1. Chiudi app (Cmd+Q)
2. Riapri app
3. Nuovo FIR → Riempi Dati Test
4. Trasmetti a RENTRI → **DOVREBBE FUNZIONARE!** ✅

---

## 🔍 SE NON TROVI IL MENU

### Possibili Nomi del Menu:
- "Unità Locali"
- "I Miei Siti"
- "Sedi Operative"
- "Anagrafica"
- "Iscrizione"
- "Gestione Operatore"

### Screenshot?

Fai uno **screenshot** del menu principale del portale RENTRI e inviamelo! Ti dirò esattamente dove cliccare.

---

## 📞 CONTATTI RENTRI

Se proprio non trovi il menu:

- **Supporto RENTRI**: https://supporto.rentri.gov.it
- **Email**: techref@rentri.it

---

## ⏱️ TEMPO STIMATO

- Compilazione form: **3-5 minuti**
- Conferma RENTRI: **Immediata** (in DEMO)
- Totale: **< 10 minuti**

---

## 🎯 DOPO L'ISCRIZIONE

Avrai:
1. ✅ `num_iscr_sito` reale (es: `OP100011134ABC-MI0001`)
2. ✅ Unità locale registrata in RENTRI
3. ✅ Possibilità di creare FIR via API

**Poi la trasmissione FIR funzionerà!** 🚀



