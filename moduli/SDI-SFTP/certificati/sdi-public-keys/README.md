# Chiavi Pubbliche SSH SDI

Questa cartella contiene le **chiavi pubbliche SSH** fornite da SDI per l'autenticazione al server SFTP.

## 📝 Istruzioni

1. **Ricezione chiavi da SDI**: Dopo l'attivazione del canale SFTP, SDI fornirà una o più chiavi pubbliche SSH.

2. **Salvare le chiavi**: Salvare ciascuna chiave pubblica in un file separato con nome descrittivo, ad esempio:
   - `sdi_test_public_key.pub`
   - `sdi_production_public_key.pub`

3. **Formato chiave**: Le chiavi pubbliche SSH sono generalmente in formato:
   ```
   ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQ... commento@sdifatturapa.gov.it
   ```
   oppure
   ```
   ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAA... commento@sdifatturapa.gov.it
   ```

4. **Aggiunta al server**: Dopo aver ricevuto le chiavi, aggiungerle a:
   ```
   /var/sftp/sdi/.ssh/authorized_keys
   ```
   sul server VPS (217.154.118.37).

5. **Permessi**: Assicurarsi che i permessi siano corretti:
   ```bash
   chmod 600 /var/sftp/sdi/.ssh/authorized_keys
   chown sdi:sdi /var/sftp/sdi/.ssh/authorized_keys
   ```

## ⚠️ Note Importanti

- **Non condividere mai le chiavi private**
- Ogni chiave pubblica deve essere su una riga separata in `authorized_keys`
- Il server SFTP è configurato per accettare solo autenticazione basata su chiavi SSH (password disabilitata)



