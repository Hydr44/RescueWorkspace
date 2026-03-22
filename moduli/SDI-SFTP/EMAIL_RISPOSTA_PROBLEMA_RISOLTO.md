# Email Risposta SDI - Problema Risolto

**Destinatario:** servizicrittograficiftp@sogei.it  
**Oggetto:** RE: Errore Server SFTP - EMM - PROBLEMA RISOLTO

---

## Testo Email

```
Gentile Service Control Room,

in riferimento alla segnalazione di Incident ricevuta in data odierna relativa 
all'errore "Exceeded MaxStartups" sulla nostra infrastruttura SFTP per la 
Fatturazione Elettronica, vi comunichiamo che il problema è stato identificato 
e risolto.

ANALISI DEL PROBLEMA
--------------------
Il malfunzionamento era causato da un limite troppo basso del parametro 
MaxStartups nella configurazione SSH del server, che impediva l'accettazione 
di nuove connessioni quando il numero di connessioni simultanee in fase di 
autenticazione superava la soglia configurata.

INTERVENTI EFFETTUATI
----------------------
1. Aumentato il parametro MaxStartups da 10:30:100 a 50:100:200
2. Aumentato MaxSessions da 10 a 50
3. Aumentato MaxAuthTries da 6 a 10
4. Riavviato il servizio SSH per applicare le nuove configurazioni
5. Verificata la corretta funzionalità del servizio SFTP

VERIFICA FUNZIONAMENTO
----------------------
Il server SFTP è stato verificato e risulta operativo:
- Porta 22 (SSH/SFTP): in ascolto e accessibile
- Utente SFTP "sdi": configurato correttamente
- Directory richieste: tutte presenti e accessibili
- Chiavi SSH autorizzate: configurate correttamente
- Connessione testata: SDI si è connesso con successo alle ore 08:00:16 
  del 19/01/2026 dopo l'intervento

Il servizio è ora disponibile e pronto a ricevere le connessioni da SDI 
secondo le specifiche concordate.

Restiamo a disposizione per eventuali ulteriori verifiche o chiarimenti.

Cordiali saluti,

[Il tuo nome]
[La tua azienda]
[Email di contatto]
[Telefono (opzionale)]

---
Server SFTP: 217.154.118.37
Utente SFTP: sdi
Ambiente: Test (DatiVersoSdITest, DatiDaSdITest)
```

---

## Note per l'invio

1. **Sostituisci** `[Il tuo nome]`, `[La tua azienda]`, `[Email di contatto]` con i tuoi dati reali
2. **Invia** a: `servizicrittograficiftp@sogei.it`
3. **Oggetto**: Usa "RE:" seguito dall'oggetto originale per mantenere il thread della conversazione
4. **Allegati**: Non necessari
5. **CC/BCC**: Aggiungi eventuali colleghi che devono essere informati

---

## Versione breve (se preferisci)

```
Gentile Service Control Room,

in riferimento alla segnalazione di Incident ricevuta oggi relativa 
all'errore "Exceeded MaxStartups" sulla nostra infrastruttura SFTP, 
vi comunichiamo che il problema è stato risolto.

Il malfunzionamento era causato da un limite troppo basso del parametro 
MaxStartups nella configurazione SSH. Abbiamo aumentato i limiti di 
connessione simultanee e riavviato il servizio.

Il server SFTP è stato verificato e risulta operativo. SDI si è connesso 
con successo alle ore 08:00:16 del 19/01/2026 dopo l'intervento.

Il servizio è ora disponibile e pronto a ricevere le connessioni da SDI.

Restiamo a disposizione per eventuali ulteriori verifiche.

Cordiali saluti,

[Il tuo nome]
[La tua azienda]
```
