# 📞 Richiesta Assistenza SDI

**Data:** 13 gennaio 2026  
**Oggetto:** Errore "File di Quadratura non presente" - Richiesta chiarimenti

---

## 👤 Informazioni Richiedente

- **Nome:** SCOZZARINI, EMMANUEL SALVATORE
- **IdCodice/Partita IVA:** 02166430856
- **Servizio:** SFTP - Trasmissione - Ricezione
- **Canale:** SFTP (attivo)

---

## 📋 File in Errore

### File Principale
- **Nome supporto:** `FI.02166430856.2026013.1732.957.zip`
- **Data invio:** 13/01/2026 19:49:00
- **Stato:** Sospeso
- **Errore:** "CONTROLLO SUPPORTO VERSIONE V2.0 /prod/installedApps/sdi2/shared/ftp/in/FI.02166430856.2026013.1732.957.260131914 - Il supporto FI.02166430856.2026013.1732.957.260131914 non è conforme al formato. File di Quadratura non presente o mancanza dei documenti di fatturazione"

---

## 🔍 Implementazione Attuale

### Struttura File Generato

1. **Generazione XML FatturaPA 1.2.2**
   - XML conforme alle specifiche FatturaPA
   - Validazione XSD passata

2. **Firma Individuale File XML**
   - Ogni file XML viene firmato individualmente
   - Formato: PKCS#7 SignedData (CAdES-BES)
   - Estensione: `.xml.p7m`
   - Nome file interno: `IT{IdCodice}_{progressivo}.xml.p7m`

3. **Creazione ZIP**
   - File XML firmati vengono inseriti nello ZIP
   - Struttura: ZIP contiene file `.xml.p7m` (PKCS#7 SignedData)

4. **Firma ZIP**
   - ZIP viene firmato (PKCS#7 SignedData)
   - Conforme a manuale SFTP cap. 7 ("supporti FI sottoposti a firma e cifratura")

5. **Cifratura ZIP**
   - ZIP firmato viene cifrato (PKCS#7 EnvelopedData)
   - Certificato pubblico Sogei
   - Formato conforme alle specifiche SDI

6. **Upload SFTP**
   - File cifrato caricato con estensione `.zip`

---

## ✅ Verifiche Eseguite

1. **Nome file ZIP:** Conforme (formato `FI.{IdCodice}.{AAAAGGG}.{HHMM}.{SSS}.zip`)
2. **Formato firma/cifratura:** PKCS#7 conforme
3. **Certificati:** Validi e corretti
4. **Struttura ZIP:** Contiene file `IT{IdCodice}_{progressivo}.xml.p7m` (PKCS#7 SignedData)
5. **Validazione XML:** Conforme a XSD FatturaPA 1.2.2

---

## ❓ Domande per Assistenza SDI

1. **Cosa significa esattamente "File di Quadratura"?**
   - È un file che dovrebbe essere presente dentro il ZIP?
   - È un file che SDI genera dopo l'elaborazione?
   - Quale struttura/formato dovrebbe avere?

2. **Struttura ZIP corretta:**
   - I file XML dentro il ZIP devono essere firmati (`.xml.p7m`) o plain (`.xml`)?
   - Il supporto ZIP deve essere solo cifrato o anche firmato?
   - La sequenza operazioni (firma XML → ZIP → firma ZIP → cifra ZIP) è corretta?

3. **Requisiti aggiuntivi:**
   - Ci sono altri requisiti/formati che devono essere soddisfatti?
   - C'è qualche file/documento che manca nella struttura attuale?

4. **Formato supporto:**
   - Quale struttura ZIP è corretta per SFTP?
   - Ci sono esempi/documentazione aggiuntiva disponibile?

---

## 📝 Informazioni Aggiuntive

- **Ambiente:** Test
- **Versione manuale consultata:** Istruzioni-SDIFTP-v4.3, SDI_SFTP_Massivi_v2
- **Implementazione basata su:** Manuale FatturaPA 1.2.2 + Manuali SFTP

---

## 🎯 Obiettivo

Capire esattamente quale struttura/formato è richiesto per risolvere l'errore "File di Quadratura non presente" e procedere con la corretta implementazione.
