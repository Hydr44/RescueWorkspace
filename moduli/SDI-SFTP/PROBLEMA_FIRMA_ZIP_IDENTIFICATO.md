# 🚨 PROBLEMA CRITICO: Firma File ZIP

**Data:** 13 gennaio 2026  
**Errore SDI:** "File di Quadratura non presente o mancanza dei documenti di fatturazione"  
**Status:** ⚠️ **PROBLEMA IDENTIFICATO**

---

## 🔍 Scoperta Chiave

Dal manuale **FatturaPA** (paragrafo 2.2, caso c - file compresso):

> **"In questo caso non è il file compresso (.zip) che deve essere firmato digitalmente, ma ogni singolo file in esso contenuto."**

---

## ❌ Cosa Stiamo Facendo Attualmente

**Processo attuale (server.js, righe 246-255):**

```246:255:moduli/SDI-SFTP/server-vps/server.js
    // Crea ZIP
    const zip = new AdmZip();
    xmlFiles.forEach(({ filename, content }) => {
      zip.addFile(filename, Buffer.from(content, 'utf8'));
    });
    const zipBuffer = zip.toBuffer();

    // Firma e cifra
    const signedBuffer = await signFile(zipBuffer, CERT_PATHS.firma, CERT_PATHS.password);
    const encryptedBuffer = await encryptFile(signedBuffer, CERT_PATHS.sogeiPublic);
```

1. ✅ Creiamo ZIP con file XML **plain** (non firmati)
2. ❌ **Firmiamo il ZIP intero**
3. ❌ **Cifriamo il file firmato**

---

## ✅ Cosa Dice il Manuale FatturaPA

Per file compresso (caso c), il manuale dice:

> **"Non è il file compresso (.zip) che deve essere firmato digitalmente, ma ogni singolo file in esso contenuto."**

**Esempio dal manuale:**
```
ITAAABBB99T99X999W_00001.zip
che al suo interno contiene:
- ITAAABBB99T99X999W_00002.xml (firmato)
- ITAAABBB99T99X999W_00003.xml (firmato)
- ITAAABBB99T99X999W_00004.xml.p7m (firmato CAdES)
```

**Quindi dovremmo:**
1. ✅ Firmare **ogni file XML individualmente**
2. ✅ Mettere i file XML **firmati** nello ZIP
3. ✅ NON firmare il ZIP stesso

---

## ⚠️ DISCREPANZA: Manuale SFTP vs FatturaPA

**PROBLEMA:** C'è una discrepanza tra:
- **Manuale FatturaPA**: Dice di firmare ogni file XML individualmente, NON il ZIP
- **Manuale SFTP**: Dice che i supporti FI devono essere "firmati e cifrati"

**Da verificare:**
- Il manuale SFTP si riferisce al protocollo di trasmissione (firma/cifratura per SFTP)
- Il manuale FatturaPA si riferisce alla struttura del contenuto (firma dei file XML)

**Possibile interpretazione:**
- Per SFTP, potrebbe essere necessario:
  1. ZIP con file XML firmati (secondo FatturaPA)
  2. Poi firmare/cifrare il ZIP per la trasmissione SFTP (secondo protocollo SFTP)

**MA** questo creerebbe una doppia firma, che sembra strano.

---

## 🔍 Prossimi Passi

1. **Verificare manuale SFTP completo** - Capire se per SFTP la regola è diversa
2. **Verificare esempi** - Se disponibili nel manuale SFTP
3. **Analizzare errore SDI** - L'errore "File di Quadratura non presente" potrebbe essere causato da questo
4. **Testare approccio alternativo** - Firmare ogni XML individualmente, poi mettere nello ZIP, poi cifrare per SFTP

---

## 💡 Ipotesi Corrente

L'errore "File di Quadratura non presente" potrebbe essere causato dal fatto che:

1. SDI decifra il file
2. Si aspetta di trovare un ZIP con file XML già firmati
3. Invece trova un ZIP che è stato firmato (non i file XML interni)
4. Non riesce a processare i file XML perché non sono firmati individualmente
5. Quindi non può generare il "file di quadratura"

---

## 📝 Note

- Il problema del progressivo (corretto) era un problema separato
- Questo problema della firma potrebbe essere la causa principale dell'errore persistente
- Serve verificare se per SFTP la regola è diversa o se dobbiamo cambiare approccio
