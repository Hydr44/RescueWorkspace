# Configurazione Chiave SSH per Accesso VPS

## Passo 1: Genera Chiave SSH (se non ce l'hai già)

```bash
# Genera una nuova chiave SSH (se non esiste già)
ssh-keygen -t ed25519 -f ~/.ssh/id_ed25519_rescuemanager -N ""

# Oppure se preferisci RSA
ssh-keygen -t rsa -b 4096 -f ~/.ssh/id_rsa_rescuemanager -N ""
```

## Passo 2: Copia Chiave Pubblica sulla VPS

```bash
# Mostra la chiave pubblica
cat ~/.ssh/id_ed25519_rescuemanager.pub
# Oppure
cat ~/.ssh/id_rsa_rescuemanager.pub

# Copia l'output (inizia con ssh-ed25519 o ssh-rsa)
```

Poi esegui sulla VPS:

```bash
ssh root@217.154.118.37
# Password: 1x9Wa2eW

# Aggiungi la chiave pubblica
mkdir -p ~/.ssh
chmod 700 ~/.ssh
echo "INCOLLA_QUI_LA_TUA_CHIAVE_PUBBLICA" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
exit
```

## Passo 3: Testa Connessione senza Password

```bash
# Prova a connetterti
ssh -i ~/.ssh/id_ed25519_rescuemanager root@217.154.118.37

# Se funziona, dovresti entrare senza password!
```

## Alternativa: Usa ssh-copy-id (più semplice)

```bash
# Installa ssh-copy-id se non ce l'hai (di solito già installato)
# macOS: di solito già presente

# Copia automaticamente la chiave
ssh-copy-id -i ~/.ssh/id_ed25519_rescuemanager.pub root@217.154.118.37
# Ti chiederà la password una volta: 1x9Wa2eW

# Poi testa
ssh -i ~/.ssh/id_ed25519_rescuemanager root@217.154.118.37
```

## Configurazione SSH Config (Opzionale)

Aggiungi a `~/.ssh/config`:

```
Host rescuemanager-vps
    HostName 217.154.118.37
    User root
    IdentityFile ~/.ssh/id_ed25519_rescuemanager
    StrictHostKeyChecking no
```

Poi puoi connetterti semplicemente con:
```bash
ssh rescuemanager-vps
```

## Dopo la Configurazione

Una volta configurata la chiave, posso usare:
```bash
ssh -i ~/.ssh/id_ed25519_rescuemanager root@217.154.118.37 "comando"
```

Per eseguire comandi direttamente!

