# 🔍 Analisi Errore Formato SDI

**Data:** 13 gennaio 2026  
**Errore:** "File di Quadratura non presente o mancanza dei documenti di fatturazione"  
**Status:** ⚠️ File arrivato ma errore formato

---

## 📋 Errore Ricevuto

```
FI.02166430856.2026013.1006.984.zip
13/01/2026 13:18:00
Sospeso
CONTROLLO SUPPORTO VERSIONE V2.0 /prod/installedApps/sdi2/shared/ftp/in/FI.02166430856.2026013.1006.984.260131142 
- Il supporto FI.02166430856.2026013.1006.984.260131142 non è conforme al formato. 
File di Quadratura non presente o mancanza dei documenti di fatturazione
```

---

## ✅ Progressi

1. ✅ **File arrivato al portale SDI** - Questo è un grande progresso!
2. ✅ **SDI legge il file** - Il file viene elaborato
3. ❌ **SDI non trova i documenti** - Errore formato

---

## 🔍 Analisi Problema

### Cosa fa il nostro codice attualmente:

1. **Crea ZIP** con file XML (non firmati, non cifrati)
2. **Firma il ZIP** con PKCS#7 SignedData
3. **Cifra il file firmato** con PKCS#7 EnvelopedData
4. **Carica il file cifrato** su SFTP

### Cosa potrebbe essere sbagliato:

1. **Formato cifratura**: Forse per SFTP non dobbiamo cifrare il ZIP ma i singoli file XML
2. **Sequenza operazioni**: Forse la sequenza ZIP → Firma → Cifra non è corretta
3. **Formato file interno**: Forse i file XML dentro il ZIP devono essere già firmati/cifrati

---

## 📚 Verifica Manuali

Dai manuali SDI (versione 1.8.3):

> **Caso c)**: un file in formato compresso contenente uno o più file di tipo a) e/o uno o più file di tipo b); il formato di compressione accettato è il formato ZIP.
> 
> **In questo caso non è il file compresso (.zip) che deve essere firmato digitalmente, ma ogni singolo file in esso contenuto.**

Questo suggerisce che:
- I file XML dentro il ZIP devono essere firmati
- Il ZIP stesso NON deve essere firmato
- Ma il manuale parla di "firma", non di "cifratura"

---

## 🔍 Prossimi Passi

1. **Verificare manuali SFTP specifici** - Potrebbero esserci regole diverse per SFTP vs Web Service
2. **Verificare formato file attuale** - Analizzare cosa contiene realmente il file caricato
3. **Verificare sequenza operazioni** - Potrebbe essere necessario:
   - Cifrare i singoli XML
   - Creare ZIP con file XML cifrati
   - Caricare il ZIP (senza firma/cifratura aggiuntiva)

---

## 📝 Note

Il "File di Quadratura" è un file XML che SDI genera DOPO aver elaborato il supporto, non qualcosa che dobbiamo includere. L'errore "File di Quadratura non presente" probabilmente significa che SDI non riesce a trovare i documenti di fatturazione nel supporto, quindi non può generare il file di quadratura.

---

## 🎯 Obiettivo

Capire il formato corretto per i file SFTP SDI e modificare il codice di conseguenza.

