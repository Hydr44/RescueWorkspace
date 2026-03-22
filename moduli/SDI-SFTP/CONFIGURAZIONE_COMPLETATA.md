# ✅ Configurazione Server SFTP SDI - COMPLETATA

**Data**: 15 Dicembre 2025  
**Server**: 217.154.118.37

---

## ✅ Configurazione Eseguita con Successo

### 1. Utente SFTP
- **Utente**: `sdi`
- **Home Directory**: `/var/sftp/sdi`
- **Shell**: `/usr/sbin/nologin` (SFTP only)
- **Status**: ✅ Configurato

### 2. Directory Create

#### Produzione:
- ✅ `/var/sftp/sdi/DatiDaSdI` 
  - Permessi: `put`, `rename`
  - Proprietario: `sdi:sdi`
  
- ✅ `/var/sftp/sdi/DatiVersoSdI`
  - Permessi: `get`, `delete`
  - Proprietario: `sdi:sdi`

#### Test:
- ✅ `/var/sftp/sdi/DatiDaSdITest`
  - Permessi: `put`, `rename`
  - Proprietario: `sdi:sdi`
  
- ✅ `/var/sftp/sdi/DatiVersoSdITest`
  - Permessi: `get`, `delete`, `sovrascrittura`
  - Proprietario: `sdi:sdi`

### 3. Chiavi Pubbliche SSH Sogei
- ✅ `Sogei_SdI1.pub` (fatturazione@SFTP-SDI1-AT.srv.sogei.it)
- ✅ `Sogei_SdI2.pub` (fatturazione@SFTP-SDI2-AT.srv.sogei.it)
- **Location**: `/var/sftp/sdi/.ssh/authorized_keys`
- **Permessi**: `600` (solo proprietario può leggere/scrivere)

### 4. Configurazione SSHD

```bash
Match User sdi
    ChrootDirectory /var/sftp/sdi
    ForceCommand internal-sftp
    PasswordAuthentication no
    PubkeyAuthentication yes
    PermitTunnel no
    AllowAgentForwarding no
    AllowTcpForwarding no
    X11Forwarding no
```

**Status**: ✅ Configurato e attivo

### 5. Firewall UFW

Regole aggiunte per IP Sogei:
- ✅ `217.175.54.31` - Sogei SFTP Client 1 Internet
- ✅ `217.175.56.129` - Sogei SFTP Client DR Internet
- ✅ `217.175.48.25` - Sogei SFTP Client 1 SPC
- ✅ `217.175.56.25` - Sogei SFTP Client DR SPC

**Porta**: 22/tcp (SSH/SFTP)

---

## 📋 Prossimi Passi

### 1. ⏳ Rispondere all'Email SDI

**Da fare**:
1. Decidere **mailing list** per comunicazioni tecniche
2. Compilare email template (vedi `RIEPILOGO_EMAIL_RISPOSTA.md`)
3. Inviare a: `servizicrittograficiftp@sogei.it`

**Informazioni da inviare**:
- ✅ User SFTP: `sdi`
- ⏳ Mailing list: **[DA DECIDERE]**
- ✅ IP Server: `217.154.118.37`
- ✅ Directory configurate: tutte e 4

### 2. ⏳ Attendere Risposta SDI

Dopo l'invio dell'email, SDI:
1. Abiliterà IP `217.154.118.37` sui loro firewall
2. Eseguirà verifiche di collegamento
3. Invierà certificati di firma e cifratura via PEC
4. Procederà con test interoperabilità

### 3. ⏳ Implementare Automatismi

Dopo attivazione, implementare:
- Script per monitorare `/DatiDaSdI` e processare file ricevuti
- Script per generare e caricare file in `/DatiVersoSdI`
- Gestione naming convention file
- Gestione firma e cifratura file

---

## 🔍 Verifica Configurazione

Per verificare manualmente la configurazione:

```bash
# Verifica directory
ls -la /var/sftp/sdi/

# Verifica chiavi SSH
cat /var/sftp/sdi/.ssh/authorized_keys

# Verifica configurazione SSHD
grep -A 10 "Match User sdi" /etc/ssh/sshd_config

# Verifica firewall
ufw status numbered | grep "217.175"

# Test connessione SFTP locale (da server)
sftp -i /dev/null sdi@localhost
```

---

## 📞 Contatti

- **Email Sogei**: servizicrittograficiftp@sogei.it
- **PEC SDI**: sdi01@pec.fatturapa.it
- **Assistenza SDI**: https://www.fatturapa.gov.it/it/assistenza/
- **Numero verde**: 800 299 940

---

## 📝 Note

- Il server SFTP è pronto per ricevere connessioni da Sogei
- Le chiavi pubbliche SSH sono configurate
- Il firewall permette connessioni dai 4 IP Sogei
- Le directory hanno i permessi corretti
- Il chroot è configurato per sicurezza

**Status**: ✅ **CONFIGURAZIONE COMPLETA - PRONTO PER VERIFICHE SDI**

