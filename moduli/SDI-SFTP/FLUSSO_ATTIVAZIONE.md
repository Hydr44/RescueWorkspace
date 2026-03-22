# 📋 Flusso Attivazione Canale SFTP SDI

## ✅ Stato Attuale: CONFIGURAZIONE COMPLETATA

---

## 🔄 Flusso Completo Attivazione

### ✅ FASE 1: Configurazione Server (COMPLETATA)
- [x] Server SFTP configurato sul VPS
- [x] Directory create (DatiDaSdI, DatiVersoSdI, DatiDaSdITest, DatiVersoSdITest)
- [x] Chiavi pubbliche SSH Sogei aggiunte
- [x] Firewall configurato per IP Sogei
- [x] Configurazione SSHD completata

### ⏳ FASE 2: Invio Email a SDI (DA FARE ORA)

**Email da inviare a**: `servizicrittograficiftp@sogei.it`

**Oggetto**: `R: Attivazione canale SFTP - Conferma configurazione`

**File email**: `SDI-SFTP/EMAIL_RISPOSTA_SDI.md`

**Contenuto principale**:
- User SFTP: `sdi`
- Mailing list: `sditecnico@rescuemanager.eu`
- IP Server: `217.154.118.37`
- Conferma directory configurate
- Conferma firewall configurato

---

### ⏳ FASE 3: Attesa Risposta SDI

Dopo l'invio dell'email, SDI procederà con:

1. **Abilitazione Firewall SDI**
   - SDI abiliterà il nostro IP `217.154.118.37` sui loro firewall
   - ⏱️ Tempo stimato: 1-3 giorni lavorativi

2. **Verifiche Connessione**
   - SDI testerà la connessione SFTP al nostro server
   - Verificheranno autenticazione con chiavi SSH
   - Verificheranno accesso alle directory
   - ⏱️ Tempo stimato: 1-2 giorni lavorativi dopo abilitazione firewall

3. **Invio Certificati via PEC**
   - SDI invierà i **certificati di firma e cifratura** via PEC
   - Certificati intestati al riferimento sottoscrittore
   - ⏱️ Tempo stimato: 1-3 giorni lavorativi dopo verifiche positive
   - **PEC di destinazione**: Quella indicata in fase di registrazione (probabilmente `rescuemanager@legalmail.it`)

4. **Test Interoperabilità**
   - Dopo ricezione certificati, eseguire test interoperabilità
   - Test invio/ricezione file via SFTP
   - ⏱️ Tempo stimato: Variabile

---

## ⏱️ Timeline Stimata

| Fase | Azione | Tempo Stimato |
|------|--------|---------------|
| ✅ 1 | Configurazione server | **Completata** |
| ⏳ 2 | Invio email | **DA FARE ORA** |
| ⏳ 3a | Abilitazione firewall SDI | 1-3 giorni lavorativi |
| ⏳ 3b | Verifiche connessione | 1-2 giorni lavorativi |
| ⏳ 3c | Invio certificati via PEC | 1-3 giorni lavorativi |
| ⏳ 3d | Test interoperabilità | Variabile |

**Tempo totale stimato**: 3-8 giorni lavorativi dall'invio email

---

## 📧 Email da Inviare

**A**: servizicrittograficiftp@sogei.it  
**Oggetto**: R: Attivazione canale SFTP - Conferma configurazione

**Contenuto completo**: Vedi `SDI-SFTP/EMAIL_RISPOSTA_SDI.md`

---

## 🔔 Cosa Monitorare

### Dopo Invio Email:

1. **Controlla email** `sditecnico@rescuemanager.eu` per comunicazioni SDI
2. **Controlla PEC** `rescuemanager@legalmail.it` per certificati
3. **Verifica log SSH/SFTP** sul VPS per tentativi di connessione da IP Sogei
4. **Monitora email SDI** per eventuali richieste di chiarimenti

### Verifica Connessioni SFTP:

```bash
# Sul VPS, verifica tentativi di connessione
ssh root@217.154.118.37 "tail -f /var/log/auth.log | grep sdi"

# O verifica ultimi accessi
ssh root@217.154.118.37 "last | grep sdi"
```

---

## 📝 Note Importanti

1. **Non creare manualmente l'email account** `sditecnico@rescuemanager.eu` prima che SDI inizi a utilizzarla (a meno che non sia già necessaria per altri scopi)

2. **Certificati PEC**: I certificati verranno inviati alla PEC indicata in fase di registrazione. Assicurarsi di avere accesso a quella casella.

3. **Timeout**: L'email indica che SDI revocherà la richiesta dopo 30 giorni di assenza di riscontro. Dato che stiamo rispondendo, questo non è un problema.

4. **Verifiche SDI**: SDI testerà la connessione dal loro lato. Non è necessario fare test dal nostro lato in questa fase.

---

## ✅ Prossimo Step

**INVIARE L'EMAIL** a `servizicrittograficiftp@sogei.it` usando il contenuto di `EMAIL_RISPOSTA_SDI.md`

