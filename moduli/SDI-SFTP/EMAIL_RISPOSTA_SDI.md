# 📧 Email di Risposta a SDI - Attivazione Canale SFTP

## A: servizicrittograficiftp@sogei.it

---

**Oggetto**: R: Attivazione canale SFTP - Conferma configurazione

---

Gentile Team Servizicrittograficiftp,

in riferimento alla richiesta di attivazione canale SFTP per SDI, 
confermiamo di aver ricevuto:
- Certificati pubblici SSH: Sogei_SdI1.pub e Sogei_SdI2.pub
- Manuale scambio dati

Configurazione server completata:

**1. User di accesso SFTP**: sdi

**2. Mailing list per comunicazioni tecniche**: 
   sditecnico@rescuemanager.eu
   (gestione canale, errori collegamento/prelievo file)

**3. IP Server**: 217.154.118.37
   Porta: 22 (SSH/SFTP)

**4. Directory configurate:**
   - /DatiDaSdI (permessi: put, rename)
   - /DatiVersoSdI (permessi: get, delete)
   - /DatiDaSdITest (permessi: put, rename)
   - /DatiVersoSdITest (permessi: get, delete, sovrascrittura)

**5. Firewall configurato per IP Sogei:**
   - 217.175.54.31 (Internet - Client 1)
   - 217.175.56.129 (Internet - DR)
   - 217.175.48.25 (SPC - Client 1)
   - 217.175.56.25 (SPC - DR)

**6. Chiavi pubbliche SSH aggiunte a authorized_keys per entrambi i client SFTP.**

Siamo pronti per le verifiche sul collegamento al nostro server SFTP.

Restiamo in attesa delle vostre verifiche e dell'invio dei certificati di firma 
e cifratura via PEC.

Cordiali saluti,
RescueManager

--
PEC: rescuemanager@legalmail.it
Telefono: 3921723028

