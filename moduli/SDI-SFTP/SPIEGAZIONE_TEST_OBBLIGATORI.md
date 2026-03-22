# 📋 Spiegazione Test Obbligatori SDI

**Domanda:** Cosa significano i test obbligatori mostrati nel portale SDI?

---

## 📋 Test Obbligatori per Accreditamento

Dal manuale SDI SFTP (paragrafo 2.4), ci sono **test di interoperabilità obbligatori** che devono essere superati per l'accreditamento al servizio SFTP.

---

## 🔍 Significato Test

### 1. "Creazione di un supporto FI" - Esito: KO ❌

**FI = File Ingresso** (fatture **verso** SDI)

- **Supporto FI** = File ZIP contenente fatture da inviare a SDI
- **KO** = **Non superato** (ancora da correggere)
- **Test:** Verifica che tu possa creare e inviare correttamente un supporto FI a SDI

**Il tuo caso:**
- Hai inviato file FI (es: `FI.02166430856.2026013.1502.921.zip`)
- Il file è stato prelevato da SDI
- **Ma l'esito è stato ET02 (ERRORE)**
- Quindi il test è **KO** perché SDI non è riuscito a processare correttamente il file

**Per superare il test:**
- Il file FI deve essere processato con successo
- L'esito deve essere **ET01 (OK)** invece di ET02 (ERRORE)

---

### 2. "Ricezione di un supporto FO" - Status: Da fare ⏳

**FO = File Uscita** (fatture **da** SDI)

- **Supporto FO** = File ZIP contenente fatture/notifiche ricevute da SDI
- **Test:** Verifica che tu possa ricevere correttamente un supporto FO da SDI
- **Status:** Non ancora testato (SDI deve inviare un FO e tu devi riceverlo)

**Per superare il test:**
- SDI invierà un file FO nella directory `DatiDaSdITest`
- Tu devi prelevarlo e processarlo correttamente

---

## 📝 Interpretazione del Tuo Status

### Test 1: Creazione Supporto FI - KO ❌

**Perché KO:**
- Il file è stato inviato ✅
- Il file è stato prelevato ✅
- **Ma l'esito è ET02 (ERRORE)** ❌
- SDI non è riuscito a processare il file correttamente

**Cosa serve per superarlo:**
1. ✅ Correggere il problema del progressivo file XML interno (già fatto)
2. ⏳ Inviare un nuovo file con la correzione
3. ⏳ Attendere che SDI lo processi con esito **ET01 (OK)**

---

## 🎯 Test di Interoperabilità (dal Manuale)

Secondo il paragrafo 2.4 del manuale, i test servono per:
- Verificare la corretta **ricezione di un supporto in ingresso** (FI)
- Verificare la corretta **predisposizione del supporto in ingresso** (FI)
- Verificare la corretta **trasmissione di un file di esito in uscita** (EO)
- Verificare la corretta **trasmissione di un supporto in uscita** (FO)

**Durata massima:** 15 giorni

---

## 📝 Prossimi Passi

1. ✅ **Correzione applicata:** Progressivo file XML interno corretto
2. ⏳ **Attendere esito:** Verificare se il nuovo file (1502.921) genera ET01 invece di ET02
3. ⏳ **Test FO:** Attendere che SDI invii un file FO per testare la ricezione

---

## ✅ Conclusioni

- **Test FI KO:** Perché l'ultimo file ha generato ET02 (ERRORE)
- **Test FO:** Non ancora iniziato (da fare)
- **Azione:** Attendere l'esito del nuovo file con progressivo corretto
