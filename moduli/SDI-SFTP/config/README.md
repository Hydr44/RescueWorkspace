# Configurazione SDI SFTP

Questa cartella contiene i file di configurazione per il canale SFTP SDI.

## 📋 Configurazione Server

Il server SFTP è configurato sul VPS con le seguenti specifiche:

### Dettagli Server
- **IP**: 217.154.118.37
- **Porta**: 22 (SSH/SFTP)
- **Utente**: `sdi`
- **Home Directory**: `/var/sftp/sdi` (chroot)

### Directory Struttura
```
/var/sftp/sdi/
├── upload/       # File da inviare a SDI
├── download/     # File ricevuti da SDI
└── notifiche/    # Notifiche da SDI
```

### Autenticazione
- **Metodo**: Chiavi SSH pubbliche
- **Password**: Disabilitata
- **Chiavi**: Da aggiungere a `/var/sftp/sdi/.ssh/authorized_keys`

### Configurazione SSHD
- Chroot abilitato per utente `sdi`
- ForceCommand: `internal-sftp`
- PubkeyAuthentication: `yes`
- PasswordAuthentication: `no`

## 🔗 Collegamenti

- Script di setup: `SDI-project/setup-sftp-server.sh`
- Documentazione setup: `SDI-project/CONFIGURA_SFTP_SERVER.md`



