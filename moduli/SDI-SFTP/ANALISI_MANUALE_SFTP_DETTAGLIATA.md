# 📚 Analisi Dettagliata Manuali SFTP

**Obiettivo:** Capire esattamente cosa richiedono i manuali SFTP per evitare test lunghi

---

## 🔍 Problema Chiave

**DISCREPANZA TRA DUE MANUALI:**

1. **Manuale FatturaPA (par. 2.2 caso c):**
   > "In questo caso non è il file compresso (.zip) che deve essere firmato digitalmente, ma ogni singolo file in esso contenuto."

2. **Manuale SFTP (capitolo 7):**
   > "I supporti FI. ed FO. scambiati fra il client Sogei ed il server SFTP dell'Ente collegato, dovranno essere **file compressi** (contenenti i documenti da trasmettere allo SDI o inviati dallo SDI) **sottoposti a firma e cifratura**, nelle modalità descritte al precedente capitolo."

---

## 🤔 Interpretazione Possibile

Forse i due manuali si riferiscono a cose diverse:

- **Manuale FatturaPA**: Si riferisce alla **struttura del contenuto** (cosa c'è dentro il ZIP)
- **Manuale SFTP**: Si riferisce alla **trasmissione via SFTP** (come viene trasmesso il file)

**Possibile soluzione:**
1. Firmare ogni XML individualmente (FatturaPA) ✅
2. Mettere XML firmati nello ZIP (FatturaPA) ✅
3. Cifrare il ZIP per la trasmissione SFTP (SFTP) ✅
4. **MA:** Il manuale SFTP dice "firmati E cifrati" - forse serve ANCHE firmare il ZIP per SFTP?

---

## 📋 Domande da Chiarire

1. Il manuale SFTP richiede che il ZIP sia **firmato E cifrato** per la trasmissione?
2. O richiede solo che il **contenuto** sia conforme (XML firmati individualmente)?
3. C'è una differenza tra "firmati e cifrati" per SFTP vs struttura contenuto FatturaPA?

---

## 🎯 Prossimi Passi

1. **Leggere manuale SFTP completo** - Capire esattamente cosa dice
2. **Verificare se c'è una doppia firma** - XML individuali + ZIP per SFTP
3. **Analizzare esempi** - Se presenti nei manuali
