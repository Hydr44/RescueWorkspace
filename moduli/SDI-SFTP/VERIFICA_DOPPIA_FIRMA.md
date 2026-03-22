# 🔍 Verifica: Doppia Firma Necessaria?

**Domanda:** Dobbiamo firmare sia i file XML individuali che il ZIP?

---

## 📋 Citazione Chiave dal Manuale SFTP

**Istruzioni-SDIFTP-v4.3, Capitolo 7:**

> "I **supporti FI. ed FO.** scambiati fra il client Sogei ed il server SFTP dell'Ente collegato, dovranno essere **file compressi** (contenenti i documenti da trasmettere allo SDI o inviati dallo SDI) **sottoposti a firma e cifratura**, nelle modalità descritte al precedente capitolo."

**Analisi:**
- "supporti FI" = i file ZIP
- "sottoposti a firma e cifratura" = il ZIP deve essere firmato E cifrato
- "nelle modalità descritte al precedente capitolo" = capitolo 6 (Specifiche di sicurezza)

---

## ⚠️ CONFLITTO CON FATTURAPA?

**Manuale FatturaPA (Par. 2.2 caso c):**
> "**non è il file compresso (.zip) che deve essere firmato digitalmente**, ma ogni singolo file in esso contenuto."

**Ma** questo potrebbe riferirsi solo alla **struttura del contenuto** (cosa c'è dentro il ZIP), non alla **trasmissione via SFTP**.

---

## 💡 INTERPRETAZIONE: DUE LIVELLI DI FIRMA

### Livello 1: Struttura Contenuto (FatturaPA)
- Ogni file XML viene firmato individualmente
- Conforme a FatturaPA par. 2.2 caso c

### Livello 2: Trasmissione SFTP (Manuali SFTP)
- Il supporto (ZIP) viene firmato per la trasmissione
- Il supporto firmato viene cifrato per la trasmissione
- Conforme a Istruzioni-SDIFTP-v4.3 cap. 7

---

## 🎯 SEQUENZA POSSIBILE: DOPPIA FIRMA

1. ✅ **Firmare ogni XML individualmente** (PKCS#7 SignedData, CAdES-BES)
   - Estensione: `.xml.p7m`
   - Conforme a FatturaPA

2. ✅ **Mettere XML firmati nello ZIP**

3. ✅ **Firmare il ZIP** (PKCS#7 SignedData)
   - Per la trasmissione SFTP
   - Conforme a Istruzioni-SDIFTP-v4.3 cap. 7

4. ✅ **Cifrare il ZIP firmato** (PKCS#7 EnvelopedData)
   - Per la trasmissione SFTP
   - Conforme a Istruzioni-SDIFTP-v4.3 cap. 7

---

## 🔍 DA VERIFICARE

Il manuale SFTP dice "nelle modalità descritte al precedente capitolo" (capitolo 6).

**Capitolo 6 = "SPECIFICHE DI SICUREZZA E CRITTOGRAFIA"**

Dobbiamo verificare cosa dice esattamente il capitolo 6 per capire se:
- Si riferisce al ZIP (supporto)
- O ai file dentro il ZIP

---

## 📝 PROSSIMI PASSI

1. **Verificare capitolo 6** del manuale Istruzioni-SDIFTP-v4.3 (se disponibile)
2. **Implementare approccio con doppia firma** come test alternativo
3. **Confrontare** con l'approccio attuale (solo firma XML)

---

## ⚠️ NOTA

Se il manuale SFTP richiede esplicitamente che i "supporti FI" siano "sottoposti a firma e cifratura", allora:
- Il ZIP deve essere firmato (oltre ai file XML dentro)
- Questo potrebbe essere il problema!
