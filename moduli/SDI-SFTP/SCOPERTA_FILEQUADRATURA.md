# 🔍 Scoperta FileQuadraturaFTP

**Data:** 13 gennaio 2026  
**Status:** ⚠️ DA VERIFICARE - Potrebbe essere la soluzione!

---

## 📋 File Trovato

File di esempio nel KitDiTest:
- **Path:** `Chiavi erogate con istruzioni/KitDiTest (5)/FY.xxxxxxxxxxx.YYYYDDD.HHMM.ppp.xml`
- **Nome:** `FileQuadraturaFTP`
- **Descrizione:** "è un file xml che descrive il supporto"

---

## 📝 Struttura File

```xml
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<nomeapriacere:FileQuadraturaFTP xmlns:nomeapriacere="http://www.fatturapa.it/sdi/ftp/v2.0" versione="2.0">
    <IdentificativoNodo>xxxxxxxxxxx</IdentificativoNodo>
    <DataOraCreazione>2019-05-13T08:41:31.771Z</DataOraCreazione>
    <NomeSupporto>FY.xxxxxxxxxxx.YYYYDDD.HHMM.ppp.zip</NomeSupporto>
    <NumeroFile>
        <File>
            <Tipo>FA</Tipo>
            <Numero>ffff</Numero>
        </File>
        <File>
            <Tipo>NE</Tipo>
            <Numero>nnnn</Numero>
        </File>
        <File>
            <Tipo>MT</Tipo>
            <Numero>mmmm</Numero>
        </File>
    </NumeroFile>
</nomeapriacere:FileQuadraturaFTP>
```

---

## 🔍 Informazioni dalla Descrizione

Dal file "Descrizione dei file di esempio presenti":

> "FY.xxxxxxxxxxx.YYYYDDD.HHMM.ppp.xml è un file xml che **descrive il supporto** e va modificato con le istruzioni seguenti:"

1. **FY** → vale **FI** per i supporti preparati dalla società ed inviati allo SDI
2. **xxxxxxxxxxx** → identificativo del nodo SFTP (solitamente PIVA)
3. **YYYYDDD** → data Giuliana
4. **HHMM** → ore e minuti
5. **ppp** → progressivo (001-899 per produzione, 900-999 per test)

### Elemento `<NumeroFile>`

```
<NumeroFile>
    <File>
        <Tipo>XYZ</Tipo>
        <Numero>ffff</Numero>
    </File>
</NumeroFile>
```

- **XYZ** → assume uno dei valori definiti nel file `FtpTypes_v2.0.xsd`
- **ffff** → valore numerico di occorrenze del tipo di file nel supporto

---

## 💡 Ipotesi

### Ipotesi 1: File da INCLUDERE nello ZIP

Il file `FileQuadraturaFTP` (con nome `FY.xxxxxxxxxxx.YYYYDDD.HHMM.ppp.xml` → `FI.02166430856.2026013.1732.957.xml`) potrebbe dover essere incluso nello ZIP insieme ai file XML delle fatture.

**Struttura ZIP potrebbe essere:**
```
FI.02166430856.2026013.1732.957.zip
├── FI.02166430856.2026013.1732.957.xml (FileQuadraturaFTP - descrive il supporto)
├── IT02166430856_00001.xml.p7m (Fattura 1)
├── IT02166430856_00002.xml.p7m (Fattura 2)
└── ...
```

### Ipotesi 2: File generato da SDI DOPO

Il file `FileQuadraturaFTP` potrebbe essere generato da SDI DOPO aver elaborato il supporto, non qualcosa che dobbiamo includere.

---

## ❓ Domande da Verificare

1. **Il file FileQuadraturaFTP deve essere incluso nello ZIP?**
2. **Se sì, qual è il nome corretto del file?** (FY → FI?)
3. **Il file deve essere firmato o plain?**
4. **Dove si trova la specifica XSD per FileQuadraturaFTP?**

---

## 🔍 Prossimi Passi

1. ✅ Verificare manuali SFTP per struttura ZIP
2. ✅ Cercare specifica XSD per FileQuadraturaFTP
3. ✅ Verificare se ci sono esempi di ZIP con questo file
4. ✅ Chiedere assistenza SDI se non chiaro dai manuali

---

## 🎯 Note

Questo potrebbe essere la soluzione all'errore "File di Quadratura non presente"! Se il file FileQuadraturaFTP deve essere incluso nello ZIP, questo spiegherebbe perché SDI non riesce a elaborare il supporto.
