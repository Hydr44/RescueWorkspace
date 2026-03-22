# 🔑 SCOPERTA CHIAVE dai Manuali SFTP

**Data Analisi:** 13 gennaio 2026

---

## 📚 Informazioni dai Manuali

### Manuale "Modulo_per_scambio_dati_telematico" e "Manuale_scambio_dati"

**Paragrafo 5. CRITTOGRAFIA:**
> "I dati trasmessi via SFTP saranno crittografati e firmati digitalmente allo scopo di assicurarne la provenienza e la riservatezza. **I dati saranno prima firmati, con il formato PKCS7 e quindi cifrati.**"

**Fasi operative:**
> "La sequenza delle operazioni da applicare, in fase di predisposizione all'invio, è:
> 1) Firma
> 2) Cifratura"

---

## ⚠️ PROBLEMA INTERPRETAZIONE

Questi manuali dicono "I dati saranno prima firmati, con il formato PKCS7 e quindi cifrati."

**Ma cosa significa "dati"?**
- Il file ZIP intero?
- I file XML individuali?

---

## 🔍 MANUALE FATTURAPA (Conflitto?)

**Paragrafo 2.2 caso c:**
> "Nel caso c) il nome del file deve rispettare la stessa nomenclatura e l'estensione del file può essere solo .zip. **In questo caso non è il file compresso (.zip) che deve essere firmato digitalmente, ma ogni singolo file in esso contenuto.**"

---

## 💡 INTERPRETAZIONE POSSIBILE

Forse i due manuali parlano di cose DIVERS E:

1. **Manuale FatturaPA**: Si riferisce alla **STRUTTURA DEL CONTENUTO**
   - I file XML dentro il ZIP devono essere firmati individualmente
   - Il ZIP NON viene firmato (come file)

2. **Manuale SFTP**: Si riferisce alla **TRASMISSIONE**
   - Per la trasmissione via SFTP, il file viene firmato E cifrato
   - Ma cosa viene firmato? Il ZIP con XML già firmati dentro?

---

## ❓ DOMANDA CHIAVE

Quando il manuale SFTP dice "I dati saranno prima firmati, con il formato PKCS7 e quindi cifrati", si riferisce a:
- A) Il ZIP intero (dopo aver messo dentro XML già firmati individualmente)?
- B) I file XML individuali (prima di metterli nel ZIP)?

**Dal manuale FatturaPA sembra essere B**, ma il manuale SFTP parla di "dati trasmessi via SFTP" che potrebbe essere A.

---

## 📋 PROSSIMI PASSI

Cercare nel manuale Istruzioni-SDIFTP-v4.3 il paragrafo **3.1.5 Composizione dei supporti** per chiarire questo punto.
