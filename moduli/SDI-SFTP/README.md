# SDI SFTP - Configurazione Canale SFTP per Sistema di Interscambio

Questa cartella contiene la configurazione e la documentazione per il canale **SFTP** del Sistema di Interscambio (SDI) per la trasmissione e ricezione massiva di fatture elettroniche.

## 📁 Struttura Cartelle

```
SDI-SFTP/
├── manuali/              # Manuali ufficiali SDI SFTP
├── certificati/          # Certificati e chiavi SSH
│   └── sdi-public-keys/  # Chiavi pubbliche SSH fornite da SDI
├── rvfu/                 # Cartella per file RVFU
└── config/               # File di configurazione
```

## 📚 Documentazione

### Manuali Scaricati

- **Istruzioni-SDIFTP-v4.3.pdf** - Manuale principale SDIFTP versione 4.3 (valido dal 08/03/2023)
- **SDI_SFTP_Massivi_v2.pdf** - Informative su algoritmi di hashing, cifratura e firma

### Schemi XSD

- **FtpTypes_v2.0.xsd** - Schema XSD per tipi FTP
- **SMQREsitoRichiestaTypes_v1.0.xsd** - Schema XSD per esito richiesta SMQR
- **SMQRListaRichiesteReportQuadraturaTypes_v1.0.xsd** - Schema XSD per lista richieste report quadratura SMQR

## 🔐 Chiavi Pubbliche SDI

Le chiavi pubbliche SSH fornite da SDI devono essere inserite nella cartella `certificati/sdi-public-keys/`.

**Una volta ricevute le chiavi pubbliche da SDI, aggiungerle a:**
- `/var/sftp/sdi/.ssh/authorized_keys` sul server VPS (217.154.118.37)

## 📂 Cartella RVFU

La cartella `rvfu/` è stata creata **fuori** dalla struttura principale SDI-SFTP come richiesto.

Percorso: `/Users/sign.rascozzarini/Projects/rescuemanager-workspace/rvfu`

## 🖥️ Configurazione Server SFTP

Il server SFTP è già configurato sul VPS (217.154.118.37) con:
- Utente: `sdi`
- Chroot: `/var/sftp/sdi`
- Directory:
  - `/var/sftp/sdi/upload/` - File da inviare a SDI
  - `/var/sftp/sdi/download/` - File ricevuti da SDI
  - `/var/sftp/sdi/notifiche/` - Notifiche da SDI

**Per riferimento, vedere:** `SDI-project/CONFIGURA_SFTP_SERVER.md`

## 🔗 Link Utili

- [Documentazione SDI](https://www.fatturapa.gov.it/it/norme-e-regole/DocumentazioneSDI/)
- [Portale Accreditamento SDI](https://accreditamento.fatturapa.gov.it/)



