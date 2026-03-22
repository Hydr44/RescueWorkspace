# 📧 Email per Assistenza SDI - Errore 00300

**Data:** 19 gennaio 2026  
**Destinatario:** servizicrittograficiftp@sogei.it  
**Oggetto:** Richiesta chiarimento errore 00300 - IdCodice non valido

---

## 📋 Testo Email

**Destinatario:** servizicrittograficiftp@sogei.it  
**Oggetto:** Richiesta chiarimento errore 00300 - IdCodice non valido (P.IVA 02166430856)

---

Gentile Assistenza SDI,

siamo in contatto per un chiarimento riguardo all'errore **00300** ricevuto durante l'invio di fatture elettroniche tramite il sistema SFTP.

### 📌 Dati Identificativi

- **Soggetto sottoscrittore:** Emmanuel Sal. Scozzarini
- **P.IVA / IdCodice Trasmittente:** 02166430856
- **Servizio:** FTP - Trasmissione - Ricezione
- **Ambiente:** [TEST / PRODUZIONE - da verificare]

### ❌ Problema Riscontrato

Durante l'invio di fatture elettroniche, abbiamo ricevuto una **Ricevuta di Scarto** con il seguente errore:

```
Errore 00300: 1.1.1.2 <IdCodice> non valido : 02166430856
```

### ✅ Verifiche Effettuate

Abbiamo verificato che:

1. **P.IVA registrata:** La P.IVA **02166430856** risulta registrata come trasmittente nel vostro sistema (come confermato dalla vostra comunicazione precedente).

2. **Normalizzazione IdCodice:** Il nostro sistema normalizza correttamente l'IdCodice:
   - Rimuove spazi e caratteri speciali
   - Rimuove il prefisso "IT" se presente
   - Verifica la lunghezza (11 caratteri per P.IVA)
   - Il valore normalizzato inviato è: **02166430856** (11 caratteri)

3. **Formato XML:** L'XML generato rispetta lo standard FatturaPA 1.2.2:
   ```xml
   <IdTrasmittente>
     <IdPaese>IT</IdPaese>
     <IdCodice>02166430856</IdCodice>
   </IdTrasmittente>
   ```

4. **Certificati:** I certificati di firma e cifratura sono configurati correttamente.

### ❓ Richiesta di Chiarimento

Per risolvere il problema, avremmo bisogno di sapere:

1. **Ambiente di registrazione:**
   - La P.IVA **02166430856** è registrata per l'ambiente **TEST**, **PRODUZIONE** o **entrambi**?
   - Attualmente il nostro sistema è configurato in modalità **TEST** (`SDI_SFTP_TEST_MODE=true`).
   - Se la P.IVA è registrata solo per PRODUZIONE, potrebbe essere questa la causa dell'errore 00300?

2. **Stato della registrazione:**
   - La registrazione della P.IVA come trasmittente è **attiva** e **completa**?
   - Ci sono eventuali **sospensioni** o **limitazioni** sulla registrazione?

3. **Corrispondenza certificato:**
   - Il certificato di firma utilizzato corrisponde correttamente alla P.IVA **02166430856**?
   - Il certificato è valido e non scaduto?

4. **Verifica anagrafe:**
   - La P.IVA **02166430856** risulta correttamente presente nell'**anagrafe tributaria** SDI?
   - Ci sono eventuali **discrepanze** tra i dati registrati e quelli inviati?

### 📎 Dettagli Tecnici

- **Formato trasmissione:** FPR12 (fattura verso privato) o FPA12 (fattura verso PA)
- **Protocollo:** SFTP
- **Server SFTP:** 217.154.118.37:22
- **Utente SFTP:** sdi
- **Directory upload:** `/var/sftp/sdi/DatiVersoSdITest` (TEST) o `/var/sftp/sdi/DatiVersoSdI` (PRODUZIONE)

### 🔍 File di Riferimento

Se necessario, possiamo fornire:
- Esempio di XML generato (prima della firma)
- Log di trasmissione SFTP
- Dettagli del certificato utilizzato

### 📞 Contatti

Restiamo a disposizione per qualsiasi chiarimento o verifica aggiuntiva.

Cordiali saluti,

**Emmanuel Sal. Scozzarini**  
P.IVA: 02166430856  
Email: [inserire email di contatto]  
Telefono: [inserire telefono di contatto]

---

## 📝 Note Aggiuntive

### Informazioni da Inserire

Prima di inviare, completare:
- [x] Email di destinazione: servizicrittograficiftp@sogei.it
- [ ] Email di contatto (mittente)
- [ ] Telefono di contatto
- [ ] Verificare se l'ambiente è TEST o PRODUZIONE
- [ ] Aggiungere eventuali dettagli specifici del caso

### Possibili Risposte e Azioni

1. **Se SDI conferma che la P.IVA è registrata solo per PRODUZIONE:**
   - Passare il server in modalità PRODUZIONE
   - Oppure richiedere registrazione anche per TEST

2. **Se SDI conferma che la P.IVA è registrata per TEST:**
   - Verificare che il certificato corrisponda
   - Verificare che l'XML sia generato correttamente

3. **Se SDI indica un problema con il certificato:**
   - Verificare che il certificato sia valido
   - Verificare che il certificato corrisponda alla P.IVA

---

**Status:** ✅ Pronta per invio (completare dati mancanti)
