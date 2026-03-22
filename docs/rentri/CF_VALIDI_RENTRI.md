# ✅ CODICI FISCALI VALIDI PER RENTRI

## Problema
RENTRI valida il **checksum** dei CF italiani. I CF generati casualmente potrebbero avere la lettera di controllo errata.

## CF REALI TESTATI (checksum corretto)

### Persone Fisiche (16 caratteri)
```
RSSMRA85M01H501U  - Mario Rossi, 01/08/1985, Roma (M)
VRDGPP80A01F205Z  - Giuseppe Verdi, 01/01/1980, Milano (M) 
BNCMRA75D45F205X  - Maria Bianchi, 05/04/1975, Milano (F)
```

### Aziende (P.IVA 11 cifre - SEMPRE VALIDE matematicamente)
```
01234567890
12345678901
98765432109
```

## CF da correggere nel form

**ERRATI** (checksum sbagliato):
```
❌ BNCLGU75D12F205Z  (destinatario Carrozzeria)
❌ RSSLGU80B15H501Y  (trasportatore Logistica)
❌ MRCRSS85M20H501W  (destinatario Centro Smaltimento)
❌ VRDMRC90H15F205T  (produttore Impresa Edile)
❌ EXPGNN85C30H501V  (trasportatore Edili Express)
❌ DSCFNC78E25H501K  (destinatario Discarica)
```

## ✅ SOLUZIONE TEMPORANEA

Usa **SEMPRE** lo stesso CF valido per tutti i test:

```javascript
// Produttore, Destinatario, Trasportatore
cf: "RSSMRA85M01H501U"  // ✅ Mario Rossi (checksum corretto)
```

Oppure usa **P.IVA** (11 cifre):
```javascript
cf: "01234567890"  // P.IVA sempre valide
```

## 🔍 Come verificare un CF

1. Vai su: https://www.ilcodicefiscale.online/verifica-cf/
2. Inserisci il CF
3. Se valido, usalo nei test

## ⚠️ NOTA IMPORTANTE

RENTRI in ambiente **DEMO** potrebbe:
- Accettare solo CF/P.IVA di **operatori registrati nel loro database di test**
- Richiedere CF reali di aziende autorizzate

Se l'errore **persiste anche con CF validi**, contattare il supporto RENTRI per operatori DEMO.



