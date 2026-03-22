# ✅ Validazione Ricerca Veicolo - CORRETTA

## 📋 Regole di Validazione

### **Campi Obbligatori**

1. ✅ **Codice Fiscale** - OBBLIGATORIO
   - Campo richiesto sempre
   - Errore: "Il codice fiscale è obbligatorio"

2. ✅ **Causale** - OBBLIGATORIA
   - Campo richiesto sempre
   - Errore: "La causale è obbligatoria"

3. ✅ **Tipo Veicolo** - OBBLIGATORIO
   - Campo richiesto sempre
   - Errore: "Il tipo veicolo è obbligatorio"

4. ✅ **Targa O Telaio** - Almeno uno deve essere presente
   - Deve essere presente almeno TARGA oppure TELAIO (non necessariamente entrambi)
   - Errore: "Inserisci almeno la targa O il telaio"

---

## 🔧 Logica di Validazione

```javascript
// CF è obbligatorio
const hasCF = codiceFiscale && codiceFiscale.trim().length > 0;
if (!hasCF) {
  errors.codiceFiscale = 'Il codice fiscale è obbligatorio';
}

// Targa O Telaio (almeno uno)
const hasTarga = targa && targa.trim().length > 0;
const hasTelaio = telaio && telaio.trim().length > 0;

if (!hasTarga && !hasTelaio) {
  errors.ricerca = 'Inserisci almeno la targa O il telaio';
}
```

---

## ✅ Comportamento UI

- Campo CF mostra asterisco rosso (*) = obbligatorio
- Campi Targa/Telaio mostrano testo helper "(oppure targa/telaio)"
- Errori mostrati sotto ogni campo e in box di errore generale
- Campi evidenziati in rosso se hanno errori

---

## ⚠️ Nota ERR_NAME_NOT_RESOLVED

L'errore `ERR_NAME_NOT_RESOLVED` indica che:
- La VPN non è attiva
- Il sistema non riesce a risolvere il DNS `gestione-veicolo-fuoriuso-tst.serviziaci.it`

**Soluzione**: Attiva la VPN ACI prima di eseguire la ricerca.

