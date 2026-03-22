# ✅ Checklist Attivazione Canale SFTP SDI

## 📋 Stato: IN CORSO - Analisi Manuale e Configurazione

---

## 📄 Informazioni Ricevute da SDI

### Chiavi Pubbliche SSH Ricevute
- ✅ **Sogei_SdI1.pub** - Client SFTP 1 (fatturazione@SFTP-SDI1-AT.srv.sogei.it)
- ✅ **Sogei_SdI2.pub** - Client SFTP 2 (fatturazione@SFTP-SDI2-AT.srv.sogei.it)

### Manuale Ricevuto
- ✅ **Manuale.Scambio.Dati.pdf** - Manuale Sogei per scambio dati SFTP

### Email Ricevuta
- **Da**: servizicrittograficiftp@sogei.it
- **Oggetto**: Attivazione canale SFTP
- **Casella risposta**: servizicrittograficiftp@sogei.it

---

## 🔍 Analisi Manuale Sogei

### Directory Richieste sul Server SFTP

#### **Produzione:**
1. `/DatiDaSdI` 
   - **Permessi**: `put` e `rename`
   - **Utilizzo**: SDI deposita qui file FO (fatture), EO (esiti), ER (scarti)

2. `/DatiVersoSdI`
   - **Permessi**: `get`, `delete`
   - **Utilizzo**: Noi depositiamo qui file FI (fatture da inviare), SDI li preleva

#### **Test:**
3. `/DatiDaSdITest`
   - **Permessi**: `put` e `rename`
   - **Utilizzo**: Come `/DatiDaSdI` ma per ambiente test

4. `/DatiVersoSdITest`
   - **Permessi**: `get`, `delete`, `sovrascrittura`
   - **Utilizzo**: Come `/DatiVersoSdI` ma per ambiente test

### IP Pubblici da Abilitare sul Firewall

Sogei si connetterà da questi IP pubblici (abilitare **tutti**):

#### **Ambiente Internet:**
- **Client principale**: `217.175.54.31`
- **Client DR (Disaster Recovery)**: `217.175.56.129`

#### **Ambiente SPC Infranet:**
- **Client principale**: `217.175.48.25`
- **Client DR (Disaster Recovery)**: `217.175.56.25`

**Porta**: 22 (SSH/SFTP)

### Naming Convention File

#### File da Noi a SDI (FI):
```
FI.{IdNodo}.{aaaaggg}.{hhmm}.{nnn}.zip
```
- `IdNodo`: P.IVA/CF di registrazione
- `aaaaggg`: Anno e giorno giuliano (001-366)
- `hhmm`: Ora e minuti
- `nnn`: Progressivo (000-899 produzione, 900-999 test)

#### File da SDI a Noi:
- **EO** (Esiti): `EO.{IdNodo}.{aaaaggg}.{hhmm}.{nnn}.xml`
- **ER** (Scarti): `ER.{IdNodo}.{aaaaggg}.{hhmm}.{nnn}.run`
- **FO** (Fatture): `FO.{IdNodo}.{aaaaggg}.{hhmm}.{nnn}.zip.p7m.enc`

### Limiti File
- **Dimensione massima**: 150 MB
- **Dimensione minima**: > 0 bytes

---

## ✅ Checklist Azioni da Completare

### 1. Configurazione Server SFTP VPS ⏳

#### 1.1 Verificare Utente SFTP Esistente
```bash
# Verificare se utente 'sdi' esiste
id sdi

# Se non esiste, crearlo (ma probabilmente già configurato)
```

#### 1.2 Creare Directory Richieste
```bash
# Sulla VPS, come root:
mkdir -p /var/sftp/sdi/DatiDaSdI
mkdir -p /var/sftp/sdi/DatiVersoSdI
mkdir -p /var/sftp/sdi/DatiDaSdITest
mkdir -p /var/sftp/sdi/DatiVersoSdITest

# Impostare permessi
chown sdi:sdi /var/sftp/sdi/DatiDaSdI
chown sdi:sdi /var/sftp/sdi/DatiVersoSdI
chown sdi:sdi /var/sftp/sdi/DatiDaSdITest
chown sdi:sdi /var/sftp/sdi/DatiVersoSdITest

chmod 755 /var/sftp/sdi/DatiDaSdI
chmod 755 /var/sftp/sdi/DatiVersoSdI
chmod 755 /var/sftp/sdi/DatiDaSdITest
chmod 755 /var/sftp/sdi/DatiVersoSdITest
```

### 2. Aggiungere Chiavi Pubbliche SSH ⏳

#### 2.1 Aggiungere Chiavi a authorized_keys
```bash
# Sulla VPS, come root:
cat > /tmp/sogei_keys.txt << 'EOF'
ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQCqsb+b6233XJcBCMRdiJV6fAeeFuim/3tLxQtU4II4DR1B7YILYCDDxgjwMJiIDqVe7r+a2HNbXcgVFdERhj1DliFqYHbfI+iXVxD6LR3AMgZULczZMRAA9m0mg52FiYxQxR7e/U/Cn+KZZN90riZAiYnvkTtLR9ibiXouZblUWJsX87oINUFz46iz9EEL5qpNjZTquU3km0lS7nEAnw6sor8X0Rm3f5bRFPS4LBbJA1ltLP9+jZBa+2C2AEfpNRtw6horQtIWWZkm9UOCh/3GqybW0/POs2hPErrF3mlewQElK1qH3gzmGsRl1neneYM4aYbGI9LDJnwRPgcCoUMr fatturazione@SFTP-SDI1-AT.srv.sogei.it
ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQDmTrhTE5IUERY6QskEkBcWK4W8xryv15zlIxgc/+UseGAX69P4gfC4amvs6WNAqcP1jWzjlqngm71/XqCcwFc6EYy6yrdke1xlprdQXVNOmlhx+76mFVP/tnkTaj3s1RyxQG9VcSNSaPYKdXuZwEROZykvlG8HD8ErcxReksB7nQj5+NxVsM5GLGtr8CpmdhAfBzi9NhsN6JMVUWTJh9a3aHDwpcBMxBhCr4aUVwjebJZLS0FVVcJX6p+mSkvMI4/XKrzK5vYpZyQBCWRs6xAFddgnY/CkjZhYumSkuSPiCicH3WK77h1Oy3H7gofltnG3GAXZMU0iR9m3EsWQUmPl fatturazione@SFTP-SDI2-AT.srv.sogei.it
EOF

# Aggiungere chiavi (senza duplicare se già presenti)
mkdir -p /var/sftp/sdi/.ssh
cat /tmp/sogei_keys.txt >> /var/sftp/sdi/.ssh/authorized_keys
chmod 600 /var/sftp/sdi/.ssh/authorized_keys
chown sdi:sdi /var/sftp/sdi/.ssh/authorized_keys
rm /tmp/sogei_keys.txt
```

### 3. Configurare Firewall ⏳

#### 3.1 Abilitare IP Sogei su Porta 22
```bash
# Sulla VPS, come root:
# Abilita IP Internet
ufw allow from 217.175.54.31 to any port 22 proto tcp comment "Sogei SFTP Client 1 Internet"
ufw allow from 217.175.56.129 to any port 22 proto tcp comment "Sogei SFTP Client DR Internet"

# Abilita IP SPC Infranet
ufw allow from 217.175.48.25 to any port 22 proto tcp comment "Sogei SFTP Client 1 SPC"
ufw allow from 217.175.56.25 to any port 22 proto tcp comment "Sogei SFTP Client DR SPC"

# Ricarica firewall
ufw reload

# Verifica regole
ufw status numbered
```

### 4. Verificare Configurazione SSHD ⏳

#### 4.1 Verificare Configurazione SFTP Chroot
```bash
# Verificare che /etc/ssh/sshd_config contenga:
grep -A 10 "Match User sdi" /etc/ssh/sshd_config

# Dovrebbe essere presente:
# Match User sdi
#     ChrootDirectory /var/sftp/sdi
#     ForceCommand internal-sftp
#     PasswordAuthentication no
#     PubkeyAuthentication yes
```

#### 4.2 Riavviare SSHD (se necessario)
```bash
# Se modificata la configurazione:
systemctl restart sshd

# Verificare che sia attivo:
systemctl status sshd
```

### 5. Preparare Risposta Email ⏳

#### Informazioni da Inviare a SDI:

1. **User di accesso SFTP**: `sdi`
2. **Mailing list per comunicazioni tecniche**: Da definire
   - Suggerimento: `sdi-tecnico@rescuemanager.eu` o `rescuemanager@legalmail.it`
3. **Conferma IP**: `217.154.118.37`

---

## 📧 Template Risposta Email

```
Oggetto: R: Attivazione canale SFTP - Conferma configurazione

Gentile Team Servizicrittograficiftp,

in riferimento alla richiesta di attivazione canale SFTP, confermiamo di aver ricevuto:
- Certificati pubblici: Sogei_SdI1.pub e Sogei_SdI2.pub
- Manuale scambio dati

Configurazione completata:

1. User di accesso SFTP: sdi

2. Mailing list per comunicazioni tecniche: [DA INSERIRE]
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

Cordiali saluti,
RescueManager
```

---

## 🔄 Prossimi Passi Dopo Risposta SDI

1. ⏳ **Attendere conferma abilitazione firewall Sogei** (IP 217.154.118.37)
2. ⏳ **Attendere verifiche connessione** da parte Sogei
3. ⏳ **Ricevere certificati firma e cifratura** via PEC
4. ⏳ **Implementare automatismi** movimentazione file
5. ⏳ **Eseguire test interoperabilità**

---

## 📝 Note Importanti

- **Polling**: Sogei effettua polling permanente per prelevare file da `/DatiVersoSdI`
- **File in corso**: File in creazione non devono avere prefisso "FI." per evitare prelievo prematuro
- **Dimensione file**: Max 150 MB, min > 0 bytes
- **Progressivi**: Produzione 000-899, Test 900-999
- **Estensioni**: I file `.p7m.enc` e `.xml.run` vengono aggiunti solo a trasferimento completato

---

## 🔗 Riferimenti

- **Email Sogei**: servizicrittograficiftp@sogei.it
- **Assistenza SDI**: https://www.fatturapa.gov.it/it/assistenza/
- **Numero verde SDI**: 800 299 940
- **PEC SDI**: sdi01@pec.fatturapa.it

