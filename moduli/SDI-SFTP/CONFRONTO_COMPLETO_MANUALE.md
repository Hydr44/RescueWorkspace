# 📊 Confronto Completo Manuali - Analisi Definitiva

**Data:** 13 gennaio 2026  
**Obiettivo:** 100% certezza sui requisiti

---

## 📚 Fonti Analizzate

1. ✅ **Manuale FatturaPA** (Allegato B-1, par. 2.2)
2. ✅ **Modulo_per_scambio_dati_telematico** (par. 5 CRITTOGRAFIA)
3. ✅ **Manuale_scambio_dati** (par. 5 CRITTOGRAFIA, par. 6 UTILIZZO OPENSSL)
4. ✅ **Istruzioni-SDIFTP-v4.3** (indice - par. 3.1.5 Composizione supporti, par. 6 Specifiche sicurezza)
5. ✅ **SDI_SFTP_Massivi_v2** (algoritmi di sicurezza)

---

## 🔑 INFORMAZIONI CHIAVE TROVATE

### 1. Manuale FatturaPA (Par. 2.2 caso c)

> **"Nel caso c) il nome del file deve rispettare la stessa nomenclatura e l'estensione del file può essere solo .zip. In questo caso non è il file compresso (.zip) che deve essere firmato digitalmente, ma ogni singolo file in esso contenuto."**

**Esempio:**
```
ITAAABBB99T99X999W_00001.zip
che al suo interno contiene:
- ITAAABBB99T99X999W_00002.xml
- ITAAABBB99T99X999W_00003.xml  
- ITAAABBB99T99X999W_00004.xml.p7m
```

**Interpretazione:**
- ❌ NON firmare il ZIP
- ✅ Firmare ogni file XML individualmente
- Estensione file XML: `.xml` (XAdES-BES) o `.xml.p7m` (CAdES-BES)

---

### 2. Manuali SFTP (Modulo_scambio_dati + Manuale_scambio_dati)

**Paragrafo 5. CRITTOGRAFIA:**
> "I dati trasmessi via SFTP saranno crittografati e firmati digitalmente allo scopo di assicurarne la provenienza e la riservatezza. **I dati saranno prima firmati, con il formato PKCS7 e quindi cifrati.**"

**Fasi operative (par. 6):**
> "La sequenza delle operazioni da applicare, in fase di predisposizione all'invio, è:
> 1) Firma
> 2) Cifratura"

**Interpretazione:**
- ✅ I dati vengono FIRMATI (PKCS#7 SignedData)
- ✅ I dati vengono CIFRATI (PKCS#7 EnvelopedData)
- Sequenza: Firma → Cifratura

---

## ⚠️ DISCREPANZA APPARENTE

I due manuali sembrano contraddirsi:

- **FatturaPA:** "NON firmare il ZIP, firmare ogni XML individualmente"
- **SFTP:** "I dati saranno prima firmati, con il formato PKCS7 e quindi cifrati"

---

## 💡 INTERPRETAZIONE POSSIBILE

Forse i manuali si riferiscono a **livelli diversi**:

### Livello 1: STRUTTURA CONTENUTO (FatturaPA)
- Ogni file XML viene firmato individualmente (PKCS#7 SignedData)
- Gli XML firmati vengono messi nello ZIP
- Il ZIP stesso NON viene firmato

### Livello 2: TRASMISSIONE SFTP (Manuali SFTP)
- Il ZIP (contenente XML già firmati) viene CIFRATO (PKCS#7 EnvelopedData)
- Per la trasmissione via SFTP, il file viene cifrato

**Ma il manuale SFTP dice "firmati E cifrati"** - quindi:
- ✅ I dati (ZIP) vengono cifrati per SFTP
- ❓ I dati (ZIP) vengono anche firmati per SFTP? O solo i file XML dentro?

---

## 🎯 DOMANDA CHIAVE

Quando il manuale SFTP dice:
> "I dati saranno prima firmati, con il formato PKCS7 e quindi cifrati"

A cosa si riferisce "dati"?
- **A)** Il file ZIP intero (dopo aver messo XML già firmati dentro)?
- **B)** I file XML individuali (prima di metterli nel ZIP)?

**Dall'analisi:**
- Il manuale FatturaPA dice chiaramente **B** (firmare XML individuali, NON il ZIP)
- Il manuale SFTP parla di "dati trasmessi via SFTP" che potrebbero essere **A** (il ZIP)

---

## 🔍 SOLUZIONE POSSIBILE

**Ipotesi più probabile (basata su FatturaPA):**

1. ✅ Firmare ogni file XML individualmente (PKCS#7 SignedData, CAdES-BES)
   - Estensione: `.xml.p7m`
2. ✅ Mettere XML firmati nello ZIP
3. ✅ Cifrare il ZIP (PKCS#7 EnvelopedData) per la trasmissione SFTP
4. ❌ NON firmare il ZIP (perché i file XML sono già firmati)

**Questo è l'approccio 2 che abbiamo implementato!**

---

## ⚠️ MA...

Il manuale SFTP dice "firmati E cifrati" - potrebbe significare:
- Il ZIP viene sia FIRMATO che CIFRATO per SFTP?
- O solo CIFRATO (perché gli XML sono già firmati)?

**Se il manuale SFTP richiede che il ZIP sia anche FIRMATO, allora:**
1. Firmare XML individuali ✅
2. Mettere nello ZIP ✅
3. **Firmare il ZIP** ❓
4. Cifrare il ZIP firmato ❓

---

## 📋 PROSSIMI PASSI

1. Cercare nel manuale **Istruzioni-SDIFTP-v4.3** il paragrafo **3.1.5 "Composizione dei supporti"** per chiarire
2. Cercare nel manuale **Istruzioni-SDIFTP-v4.3** il paragrafo **6 "Specifiche di sicurezza e crittografia"** per chiarire
3. Verificare se ci sono esempi o chiarimenti nei manuali
