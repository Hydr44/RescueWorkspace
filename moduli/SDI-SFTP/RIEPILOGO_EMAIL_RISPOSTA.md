# 📧 Riepilogo per Risposta Email a SDI

## ⚠️ DA COMPLETARE

Prima di inviare l'email, **decidere la mailing list** per le comunicazioni tecniche.

### Opzioni Mailing List:
1. `sdi-tecnico@rescuemanager.eu` (se esiste)
2. `rescuemanager@legalmail.it` (PEC esistente)
3. Altro indirizzo da creare

---

## 📋 Informazioni da Inviare

### 1. User di accesso SFTP
```
sdi
```

### 2. Mailing list comunicazioni tecniche
```
[DA INSERIRE - ESEMPIO: sdi-tecnico@rescuemanager.eu]
```

**Nota**: Questa mailing list riceverà:
- Comunicazioni tecniche per gestione canale
- Comunicazioni automatiche in caso di errori collegamento/prelievo file

### 3. IP Server
```
217.154.118.37
Porta: 22 (SSH/SFTP)
```

---

## 📧 Template Email (DA COMPLETARE)

**A**: servizicrittograficiftp@sogei.it  
**Oggetto**: R: Attivazione canale SFTP - Conferma configurazione

```
Gentile Team Servizicrittograficiftp,

in riferimento alla richiesta di attivazione canale SFTP per SDI, 
confermiamo di aver ricevuto:
- Certificati pubblici SSH: Sogei_SdI1.pub e Sogei_SdI2.pub
- Manuale scambio dati

Configurazione server completata:

1. User di accesso SFTP: sdi

2. Mailing list per comunicazioni tecniche: 
   [INSERIRE QUI L'INDIRIZZO EMAIL DECISO]
   (gestione canale, errori collegamento/prelievo file)

3. IP Server: 217.154.118.37
   Porta: 22 (SSH/SFTP)

4. Directory configurate:
   - /DatiDaSdI (permessi: put, rename)
   - /DatiVersoSdI (permessi: get, delete)
   - /DatiDaSdITest (permessi: put, rename)
   - /DatiVersoSdITest (permessi: get, delete, sovrascrittura)

5. Firewall configurato per IP Sogei:
   - 217.175.54.31 (Internet - Client 1)
   - 217.175.56.129 (Internet - DR)
   - 217.175.48.25 (SPC - Client 1)
   - 217.175.56.25 (SPC - DR)

6. Chiavi pubbliche SSH aggiunte a authorized_keys per entrambi i client SFTP.

Siamo pronti per le verifiche sul collegamento al nostro server SFTP.

Restiamo in attesa delle vostre verifiche e dell'invio dei certificati di firma 
e cifratura via PEC.

Cordiali saluti,
RescueManager

--
PEC: rescuemanager@legalmail.it
Telefono: 3921723028
```

---

## ✅ Checklist Prima di Inviare

- [ ] **Decidere mailing list** per comunicazioni tecniche
- [ ] **Eseguire script configurazione** su VPS
- [ ] **Verificare configurazione** directory e permessi
- [ ] **Verificare firewall** regole UFW
- [ ] **Testare connessione SFTP** localmente (opzionale)
- [ ] **Compilare email** con informazioni corrette
- [ ] **Inviare email** a servizicrittograficiftp@sogei.it

---

## 🔄 Prossimi Passi Dopo Invio Email

1. **Attendere conferma SDI** per abilitazione firewall (IP 217.154.118.37)
2. **Attendere verifiche connessione** da parte Sogei
3. **Ricevere certificati firma/cifratura** via PEC
4. **Implementare automatismi** movimentazione file
5. **Eseguire test interoperabilità**

---

## 📞 Contatti

- **Email Sogei**: servizicrittograficiftp@sogei.it
- **PEC SDI**: sdi01@pec.fatturapa.it
- **Assistenza SDI**: https://www.fatturapa.gov.it/it/assistenza/
- **Numero verde**: 800 299 940

