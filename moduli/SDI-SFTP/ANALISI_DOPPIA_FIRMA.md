# 🔍 Analisi: Doppia Firma (XML + ZIP)?

**Domanda:** Dobbiamo firmare sia i file XML individuali che il ZIP?

---

## 📚 Cosa Dicono i Manuali

### Manuale FatturaPA (Par. 2.2 caso c)

> "In questo caso **non è il file compresso (.zip) che deve essere firmato digitalmente, ma ogni singolo file in esso contenuto.**"

**Interpretazione:**
- ✅ Firmare ogni XML individualmente
- ❌ NON firmare il ZIP

---

### Manuali SFTP

**Modulo_scambio_dati / Manuale_scambio_dati (Par. 5):**
> "I dati trasmessi via SFTP saranno crittografati e firmati digitalmente allo scopo di assicurarne la provenienza e la riservatezza. **I dati saranno prima firmati, con il formato PKCS7 e quindi cifrati.**"

**Istruzioni-SDIFTP-v4.3 (Capitolo 7):**
> "I supporti FI. ed FO. scambiati fra il client Sogei ed il server SFTP dell'Ente collegato, dovranno essere **file compressi** (contenenti i documenti da trasmettere allo SDI o inviati dallo SDI) **sottoposti a firma e cifratura**, nelle modalità descritte al precedente capitolo."

**Interpretazione:**
- I "supporti FI" devono essere "sottoposti a firma e cifratura"
- Ma cosa significa "supporti"? Il ZIP o i file dentro?

---

## 🤔 POSSIBILE INTERPRETAZIONE: DOPPIA FIRMA

### Ipotesi: Firma a Due Livelli

**Livello 1: Contenuto (FatturaPA)**
- Ogni file XML viene firmato individualmente (PKCS#7 SignedData)
- Estensione: `.xml.p7m`

**Livello 2: Trasmissione (SFTP)**
- Il ZIP (contenente XML già firmati) viene FIRMATO (PKCS#7 SignedData)
- Il ZIP firmato viene CIFRATO (PKCS#7 EnvelopedData)

**Sequenza:**
1. Firmare ogni XML → `.xml.p7m`
2. Mettere XML firmati nello ZIP
3. **Firmare il ZIP** (PKCS#7 SignedData)
4. Cifrare il ZIP firmato (PKCS#7 EnvelopedData)

---

## ⚠️ CONFLITTO CON FATTURAPA?

Il manuale FatturaPA dice esplicitamente:
> "**non è il file compresso (.zip) che deve essere firmato digitalmente**"

**Ma** potrebbe riferirsi solo alla **struttura del contenuto** (cosa c'è dentro), non alla **trasmissione** (come viene trasmesso).

---

## 💡 INTERPRETAZIONE POSSIBILE

Forse:
- **FatturaPA** si riferisce alla **struttura del contenuto** (ogni XML deve essere firmato)
- **SFTP** si riferisce alla **trasmissione** (il supporto ZIP deve essere firmato E cifrato per SFTP)

**Quindi:**
- ✅ Firmare XML individuali (FatturaPA - struttura contenuto)
- ✅ Firmare ZIP (SFTP - trasmissione)
- ✅ Cifrare ZIP firmato (SFTP - trasmissione)

---

## 🔍 DA VERIFICARE

1. Cercare nel manuale Istruzioni-SDIFTP-v4.3 se c'è un esempio esplicito
2. Verificare se "sottoposti a firma e cifratura" si riferisce al ZIP o ai file dentro
3. Controllare se c'è una distinzione tra "firma contenuto" e "firma trasmissione"

---

## 📋 PROSSIMI PASSI

1. Cercare esempi concreti nei manuali
2. Verificare se l'errore "File di Quadratura non presente" potrebbe essere causato dalla mancanza di firma del ZIP
3. Considerare di implementare anche la firma del ZIP come test alternativo
