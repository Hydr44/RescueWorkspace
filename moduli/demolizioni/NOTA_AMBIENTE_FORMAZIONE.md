# 📝 Ambiente Formazione RVFU - Dati Test vs Reali

## Risposta alla Domanda

**La funzione di ricerca veicolo funziona con TARGHE VERE, non solo con targhe di test.**

## Ambiente Formazione (Test)

L'ambiente di **formazione** (`https://formazione.ilportaledeltrasporto.it`) è un ambiente di test che:

### ✅ Cosa Accetta

1. **Targhe Reali**: 
   - ✅ Accetta veicoli reali presenti nel sistema PRA/del MIT
   - ✅ La ricerca funziona se il veicolo esiste nel database
   - ✅ I veicoli reali devono essere presenti nel sistema centrale

2. **Targhe di Test**:
   - ✅ Accetta anche dati di test se presenti nel sistema
   - ✅ Le credenziali di test (`DETO003001` / `TEST.030`) sono fornite per l'accesso

### 🔍 Come Funziona la Ricerca

La funzione `verificaVeicolo` interroga il sistema RVFU che a sua volta:
- Consulta il database centrale dei veicoli
- Verifica se il veicolo esiste
- Restituisce i dati se trovato

**Non c'è distinzione tra "targhe di test" e "targhe reali"** - l'importante è che:
- Il veicolo esista nel sistema
- I dati forniti (CF, targa/telaio) siano corretti
- Il veicolo sia presente nel database PRA/MIT

### 📋 Credenziali di Test

Dal file `Leggimi`:
- **Matricola**: `DETO003001`
- **Password**: `TEST.030`

Queste sono credenziali di **accesso al sistema**, non credenziali per veicoli specifici.

### ⚠️ Note Importanti

1. **Ambiente Formazione = Test**
   - È un ambiente separato dalla produzione
   - I dati qui inseriti non vanno in produzione
   - Utile per testare il flusso senza impatti reali

2. **Veicoli Reali**
   - Se cerchi un veicolo reale, deve esistere nel sistema
   - Non tutti i veicoli del mondo sono presenti (solo quelli registrati)
   - La ricerca funziona per veicoli italiani presenti nel PRA

3. **Produzione**
   - L'ambiente produzione (`https://www.ilportaledeltrasporto.it`) accetta solo dati reali
   - I dati qui inseriti sono ufficiali e definitivi

## Conclusione

**Sì, puoi cercare veicoli con targhe vere nell'ambiente di formazione**, purché:
- Il veicolo esista nel sistema PRA/del MIT
- I dati (CF, targa/telaio) siano corretti
- Tu sia autenticato correttamente

La funzione di ricerca non distingue tra "test" e "reale" - distingue solo tra "presente nel sistema" e "non presente nel sistema".

