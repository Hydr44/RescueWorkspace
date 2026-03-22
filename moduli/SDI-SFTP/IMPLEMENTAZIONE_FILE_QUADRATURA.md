# 🔧 Implementazione File di Quadratura

**Data:** 13 gennaio 2026  
**Status:** 🚀 In implementazione

---

## 📋 Requisiti

Dal piano di test FTP04 e dal file di esempio:
- Il file `FileQuadraturaFTP` **DEVE essere incluso nello ZIP**
- Nome file: `FI.{idNodo}.{dataGiuliana}.{ora}.{progressivo}.xml` (stesso nome del ZIP ma con `.xml`)
- Contiene metadati che descrivono il supporto
- Tipo file: `FA` (Fattura) con numero di occorrenze

---

## 🔧 Modifiche da Fare

1. ✅ Creare funzione `generateFileQuadraturaFTP()` per generare XML
2. ✅ Includere file di quadratura nello ZIP (prima dei file XML delle fatture)
3. ✅ Il file di quadratura è XML plain (NON firmato)

---

## 📝 Struttura File

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

---

## 🎯 Ordine Operazioni

1. Genera XML fatture
2. Firma ogni XML individualmente
3. **Genera file FileQuadraturaFTP XML**
4. Crea ZIP con:
   - File FileQuadraturaFTP XML (plain)
   - File XML fatture firmati
5. Firma ZIP
6. Cifra ZIP
