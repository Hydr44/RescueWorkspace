# 🔑 Configurazione Accesso SSH Permanente al VPS

## Scopo

Questo documento spiega come configurare l'accesso SSH permanente al VPS SDI-SFTP, in modo che possa accedere automaticamente senza specificare ogni volta la chiave SSH.

## Prerequisiti

- La chiave SSH `id_ed25519` deve essere presente in `moduli/SDI-SFTP/`
- Accesso al terminale con permessi per modificare `~/.ssh/config`

## Configurazione Automatica (Consigliata)

Esegui semplicemente lo script di configurazione:

```bash
cd moduli/SDI-SFTP
bash CONFIGURA_ACCESSO_VPS.sh
```

Lo script:
1. ✅ Copia la chiave SSH in `~/.ssh/id_ed25519_vps_sdi`
2. ✅ Imposta i permessi corretti (600)
3. ✅ Aggiorna `~/.ssh/config` con la configurazione `vps-sdi`
4. ✅ Testa la connessione

## Configurazione Manuale

Se preferisci farlo manualmente:

### 1. Copia la chiave SSH

```bash
cp moduli/SDI-SFTP/id_ed25519 ~/.ssh/id_ed25519_vps_sdi
chmod 600 ~/.ssh/id_ed25519_vps_sdi
```

### 2. Aggiorna ~/.ssh/config

Aggiungi alla fine del file `~/.ssh/config`:

```
# VPS SDI-SFTP Server
Host vps-sdi
  HostName 217.154.118.37
  User root
  IdentityFile ~/.ssh/id_ed25519_vps_sdi
  IdentitiesOnly yes
  StrictHostKeyChecking no
  UserKnownHostsFile /dev/null
```

### 3. Test connessione

```bash
ssh vps-sdi "echo 'Connessione OK'"
```

## Utilizzo

Dopo la configurazione, puoi usare:

```bash
# Accesso interattivo
ssh vps-sdi

# Eseguire comandi remoti
ssh vps-sdi "pm2 status"
ssh vps-sdi "pm2 logs sdi-sftp-server --lines 50"

# Copiare file
scp file.xml vps-sdi:/opt/sdi-sftp-server/
scp vps-sdi:/opt/sdi-sftp-server/log.txt ./
```

## Vantaggi

- ✅ **Nessun parametro da specificare**: Basta usare `ssh vps-sdi`
- ✅ **Script semplificati**: Gli script possono usare `vps-sdi` invece di specificare IP, user, chiave
- ✅ **Sicurezza**: La chiave è in `~/.ssh/` con permessi corretti
- ✅ **Backup automatico**: Lo script fa backup del config esistente

## Script Aggiornati

Dopo questa configurazione, gli script possono essere semplificati. Ad esempio, invece di:

```bash
ssh -i moduli/SDI-SFTP/id_ed25519 -o StrictHostKeyChecking=no root@217.154.118.37 "comando"
```

Puoi semplicemente usare:

```bash
ssh vps-sdi "comando"
```

## Verifica Configurazione

Per verificare che tutto sia configurato correttamente:

```bash
# Test connessione
ssh vps-sdi "whoami && hostname"

# Verifica chiave
ls -la ~/.ssh/id_ed25519_vps_sdi

# Verifica config
grep -A 5 "Host vps-sdi" ~/.ssh/config
```

## Risoluzione Problemi

### Errore: "Permission denied (publickey)"

- Verifica che la chiave abbia i permessi corretti: `chmod 600 ~/.ssh/id_ed25519_vps_sdi`
- Verifica che la chiave pubblica sia presente sul VPS: `ssh vps-sdi "cat ~/.ssh/authorized_keys"`

### Errore: "Bad permissions"

- Verifica permessi directory: `chmod 700 ~/.ssh`
- Verifica permessi config: `chmod 600 ~/.ssh/config`
- Verifica permessi chiave: `chmod 600 ~/.ssh/id_ed25519_vps_sdi`

### La configurazione non funziona

- Verifica sintassi config: `ssh -F ~/.ssh/config -T vps-sdi`
- Verifica che non ci siano spazi extra o caratteri strani nel config
- Controlla i log: `ssh -v vps-sdi 2>&1 | grep -i error`

## Note di Sicurezza

- ⚠️ **Non committare mai la chiave SSH** nel repository Git
- ✅ La chiave è già in `.gitignore` per sicurezza
- ✅ I permessi 600 sulla chiave privata sono essenziali per sicurezza
- ✅ `IdentitiesOnly yes` assicura che SSH usi solo la chiave specificata

## File Coinvolti

- `moduli/SDI-SFTP/id_ed25519` - Chiave SSH sorgente (NON committare)
- `~/.ssh/id_ed25519_vps_sdi` - Chiave SSH copiata (locale)
- `~/.ssh/config` - Configurazione SSH (può essere committata, senza chiavi private)
- `moduli/SDI-SFTP/CONFIGURA_ACCESSO_VPS.sh` - Script di configurazione

