# SDI-SFTP - Piano di Implementazione

## Stato Attuale
- ✅ Server SFTP configurato sul VPS (217.154.118.37)
- ✅ Certificati ricevuti (firma e cifratura)
- ✅ Flussi attivati da SDI - PRONTI PER I TEST

## Certificati Ricevuti
- **Firma**: `EMMAT002.SCZMNL05L21D960T.firma.p12` (password: `IBVvOZqq`)
- **Cifratura**: `EMMAT002.SCZMNL05L21D960T.cifra.p12` (password: `IBVvOZqq`)
- **Certificati pubblici**: `sogeiunicocifra.pem`, `CAEntrate.pem`

## Naming Convention File

### File da Inviare (FI - Fatture)
```
FI.{IdNodo}.{aaaaggg}.{hhmm}.{nnn}.zip
```
- `FI.` = Prefisso fisso
- `IdNodo` = P.IVA/CF di registrazione (es: `SCZMNL05L21D960T`)
- `aaaaggg` = Anno (4 cifre) + giorno giuliano (3 cifre, 001-366)
- `hhmm` = Ora e minuti (formato 24h)
- `nnn` = Progressivo:
  - **Produzione**: 000-899
  - **Test**: 900-999
- Estensione: `.zip` (file firmato e cifrato)

### File da Ricevere
- **EO** (Esiti): `EO.{IdNodo}.{aaaaggg}.{hhmm}.{nnn}.xml`
- **ER** (Scarti): `ER.{IdNodo}.{aaaaggg}.{hhmm}.{nnn}.run`
- **FO** (Fatture): `FO.{IdNodo}.{aaaaggg}.{hhmm}.{nnn}.zip.p7m.enc`

## Directory SFTP
- **Produzione**:
  - Upload: `/DatiVersoSdI`
  - Download: `/DatiDaSdI`
- **Test**:
  - Upload: `/DatiVersoSdITest`
  - Download: `/DatiDaSdITest`

## Workflow

### Invio Fattura
1. Genera XML fattura (FatturaPA 1.2.2)
2. Crea ZIP con XML
3. Firma file ZIP (PKCS#7)
4. Cifra file ZIP (AES)
5. Genera nome file secondo convenzione
6. Upload su SFTP `/DatiVersoSdI` (o `/DatiVersoSdITest`)
7. SDI polling preleva file
8. SDI processa e genera esito

### Ricezione File
1. Monitora directory `/DatiDaSdI` (o `/DatiDaSdITest`)
2. Rileva file con estensione completa (`.xml`, `.run`, `.p7m.enc`)
3. Download file
4. Decifra (se FO)
5. Processa e aggiorna database

## Implementazione

### Librerie Necessarie
- `ssh2-sftp-client` - Client SFTP
- `adm-zip` o `jszip` - Gestione ZIP
- `node-forge` - Firma e cifratura (già presente)
- `@xmldom/xmldom` - Gestione XML (già presente)

### API Routes da Creare
- `POST /api/sdi-sftp/send` - Invia fatture via SFTP
- `GET /api/sdi-sftp/status` - Stato trasmissioni
- `POST /api/sdi-sftp/process` - Processa file ricevuti (da chiamare da cron/monitor)
- `GET /api/sdi-sftp/files` - Lista file in coda/processati

### Funzioni da Implementare
1. **Generazione nome file FI**
2. **Firma file ZIP** (PKCS#7)
3. **Cifratura file ZIP** (AES)
4. **Upload SFTP**
5. **Download e processamento file ricevuti**

## Note Importanti
- File in creazione NON devono avere prefisso "FI." (vengono prelevati prematuramente)
- Progressivo: Test usa 900-999, Produzione 000-899
- Dimensioni: Max 150 MB per file
- Processare solo file con estensione finale completa

