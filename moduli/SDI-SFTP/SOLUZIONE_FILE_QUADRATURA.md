# ✅ SOLUZIONE: File di Quadratura

**Data:** 13 gennaio 2026  
**Status:** 🎯 PROBLEMA IDENTIFICATO - File di Quadratura mancante!

---

## 🔍 Scoperta

Dal **piano_test_interoperabilita_SDIFTP** (test FTP04):

> "Predisposizione da parte del Nodo (utente) di un supporto FI con **file di quadratura errato** da spedire allo SdI."

**CONCLUSIONE:** Il file di quadratura **DEVE essere presente** nel supporto (ZIP)!

---

## 📋 File di Quadratura

### Nome File

Dal file di esempio `FY.xxxxxxxxxxx.YYYYDDD.HHMM.ppp.xml`:
- **FY** → **FI** per supporti preparati dalla società ed inviati allo SDI
- **xxxxxxxxxxx** → identificativo del nodo SFTP (solitamente PIVA)
- **YYYYDDD** → data Giuliana
- **HHMM** → ore e minuti
- **ppp** → progressivo (001-899 per produzione, 900-999 per test)

**Esempio:** `FI.02166430856.2026013.1732.957.xml`

### Struttura XML

```xml
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<FileQuadraturaFTP xmlns="http://www.fatturapa.it/sdi/ftp/v2.0" versione="2.0">
    <IdentificativoNodo>02166430856</IdentificativoNodo>
    <DataOraCreazione>2026-01-13T17:32:00.000Z</DataOraCreazione>
    <NomeSupporto>FI.02166430856.2026013.1732.957.zip</NomeSupporto>
    <NumeroFile>
        <File>
            <Tipo>FA</Tipo>
            <Numero>1</Numero>
        </File>
    </NumeroFile>
</FileQuadraturaFTP>
```

### Elemento `<NumeroFile>`

- **`<Tipo>`**: Tipo di file (definito in `FtpTypes_v2.0.xsd`)
  - **FA** = Fattura
  - **NE** = Notifica Esito
  - **MT** = Metadati
  - etc.
- **`<Numero>`**: Numero di occorrenze del tipo di file nel supporto

---

## 📦 Struttura ZIP Corretta

```
FI.02166430856.2026013.1732.957.zip
├── FI.02166430856.2026013.1732.957.xml (File di Quadratura - DESCRIVE IL SUPPORTO)
├── IT02166430856_00001.xml.p7m (Fattura 1 - firmata)
├── IT02166430856_00002.xml.p7m (Fattura 2 - firmata)
└── ...
```

---

## ✅ Cosa Fare

1. ✅ Generare il file `FileQuadraturaFTP` XML
2. ✅ Includere il file nel ZIP (con nome `FI.{idNodo}.{data}.{ora}.{progressivo}.xml`)
3. ✅ Il file deve contenere il conteggio dei file XML delle fatture presenti nello ZIP
4. ✅ Verificare se il file di quadratura deve essere firmato o plain

---

## 🎯 Prossimi Passi

1. ⏳ Leggere schema XSD `FtpTypes_v2.0.xsd` per struttura esatta
2. ⏳ Implementare generazione file di quadratura
3. ⏳ Includere file di quadratura nello ZIP
4. ⏳ Testare con nuovo ZIP

---

## 💡 Nota

Questo è probabilmente il problema! Il file di quadratura manca nello ZIP, quindi SDI non riesce a elaborare il supporto e genera l'errore "File di Quadratura non presente".
