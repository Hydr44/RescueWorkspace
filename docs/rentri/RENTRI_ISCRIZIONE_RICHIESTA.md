# ⚠️ ISCRIZIONE RENTRI DEMO RICHIESTA

## 🔍 PROBLEMA IDENTIFICATO

**Errore 404**: L'operatore `OP100011134` **non è iscritto** in RENTRI DEMO.

---

## 📋 SITUAZIONE ATTUALE

- ✅ **Certificato .p12**: PRESENTE e valido
- ✅ **CF Operatore**: `SCZMNL05L21D960T`
- ✅ **dnQualifier**: `RENTRI-100011134`
- ❌ **Iscrizione operatore**: NON COMPLETATA
- ❌ **Unità locale**: NON REGISTRATA

---

## 🎯 CERTIFICATO ≠ ISCRIZIONE

Il certificato `.p12` serve per:
- ✅ **Autenticazione** alle API
- ✅ **Firma digitale** dei JWT

**MA** non significa che sei iscritto operativamente!

Devi **prima**:
1. **Iscriverti** come operatore sul portale RENTRI
2. **Registrare** almeno 1 unità locale (sito/sede)
3. RENTRI ti assegna un `num_iscr_sito` (es: `OP100011134XXX-MI0001`)
4. **POI** puoi usare le API per creare FIR

---

## ✅ PROCEDURA ISCRIZIONE RENTRI DEMO

### 1️⃣ Accedi al Portale RENTRI DEMO

**URL**: https://portale.rentri.gov.it

- Seleziona **ambiente DEMO**
- Login con **SPID** o **CIE**

---

### 2️⃣ Accreditamento Operatore

1. Vai su: **Area Operatori** → **Accreditamento operatori**
2. Segui la procedura guidata
3. RENTRI verifica:
   - **Registro Imprese** (se sei un'impresa)
   - **PEC** (conferma via email)
   - **CF** (automatico se professionista)

**Nota**: In ambiente DEMO, il processo è **semplificato** e **più veloce**.

**Manuale**: https://supporto.rentri.gov.it/aswsWeb/selectLanding?localizing=YXJ0aWNsZSxOMzc3MzksLA==&idProduct=RENTRI&userRole=rentriud

---

### 3️⃣ Iscrizione Unità Locale

1. Vai su: **Gestione unità locali** / **I miei siti**
2. **Crea nuova unità locale**:
   - Nome: "Sede Operativa Milano"
   - Indirizzo: Via Mazzini 12, 20025 Legnano (MI)
   - Attività: **Produzione**, **Trasporto** (seleziona entrambe)
   - Profilo: **Produttore**, **Trasportatore**
3. Conferma

**RENTRI ti assegnerà**: `num_iscr_sito` (es: `OP100011134ABC-MI0001`)

---

### 4️⃣ Dopo l'Iscrizione

1. **Aggiorna** `rentri_org_certificates` nel DB:
   ```sql
   UPDATE rentri_org_certificates
   SET num_iscr_sito = 'OP100011134XXX-MI0001'  -- Usa valore REALE
   WHERE cf_operatore = 'SCZMNL05L21D960T';
   ```

2. **Riprova** la trasmissione FIR

---

## 🚨 ALTERNATIVA: Crea FIR Senza num_iscr_sito?

**NO!** Il campo `num_iscr_sito` è **OBBLIGATORIO** per POST `/formulari/v1.0/`:

```json
"required": [
  "num_iscr_sito",  // ❌ OBBLIGATORIO!
  "dati_partenza"
]
```

Fonte: `formulari-v1.0.json`, riga 9125-9127

---

## 📚 RIFERIMENTI

- **Manuale accreditamento DEMO**: https://supporto.rentri.gov.it (link nelle FAQ)
- **FAQ iscrizione**: `supporto-faq.md`, riga 257
- **API Anagrafiche**: `/anagrafiche/v1.0/operatore/{num_iscr}/siti`

---

## 🎯 PROSSIMI PASSI

1. **Accedi** al portale RENTRI DEMO
2. **Completa** l'iscrizione operatore
3. **Crea** un'unità locale
4. **Recupera** il `num_iscr_sito` reale
5. **Aggiorna** il DB
6. **Riprova** la trasmissione FIR

---

## ⏱️ TEMPO STIMATO

- Accreditamento DEMO: **5-10 minuti** (se già hai SPID/CIE)
- Creazione unità locale: **2 minuti**
- Totale: **~15 minuti**

---

**Vuoi che ti guidi passo-passo nell'iscrizione?** 📋



