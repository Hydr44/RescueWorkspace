# 🔑 Reset Chiavi SSH

## Passo 1: Cancella le chiavi SSH vecchie dal server VPS

```bash
ssh root@217.154.118.37 "rm -f ~/.ssh/authorized_keys && mkdir -p ~/.ssh && chmod 700 ~/.ssh"
```

Ti chiederà la password: `1x9Wa2eW`

---

## Passo 2: Genera nuova chiave SSH (se non l'hai già)

Se vuoi una chiave specifica per la VPS:

```bash
ssh-keygen -t ed25519 -f ~/.ssh/id_ed25519_vps -C "rescuemanager-vps-$(date +%Y%m%d)"
```

Oppure se vuoi usare la chiave default:

```bash
ssh-keygen -t ed25519 -C "rescuemanager-vps-$(date +%Y%m%d)"
```

Quando ti chiede:
- **File location**: Premi Enter per usare il percorso di default, oppure inserisci un percorso personalizzato
- **Passphrase**: Puoi lasciare vuoto (premere Enter due volte) oppure inserire una passphrase per sicurezza

---

## Passo 3: Copia la nuova chiave pubblica sul server

Se hai generato una chiave specifica:

```bash
ssh-copy-id -i ~/.ssh/id_ed25519_vps.pub root@217.154.118.37
```

Oppure se hai usato la chiave default:

```bash
ssh-copy-id root@217.154.118.37
```

Ti chiederà la password: `1x9Wa2eW`

---

## Passo 4: Verifica che funzioni

```bash
ssh root@217.154.118.37 "echo '✅ Accesso SSH funziona!' && hostname"
```

Dovrebbe entrare **senza chiedere la password**.

---

## Se vuoi cancellare tutte le chiavi SSH locali e ricrearle da zero

⚠️ **ATTENZIONE**: Questo cancella tutte le chiavi SSH locali!

```bash
# Backup (opzionale ma consigliato)
mkdir -p ~/.ssh_backup_$(date +%Y%m%d)
cp -r ~/.ssh/* ~/.ssh_backup_$(date +%Y%m%d)/ 2>/dev/null

# Cancella chiavi vecchie
rm -f ~/.ssh/id_*

# Genera nuova chiave
ssh-keygen -t ed25519 -C "rescuemanager-$(date +%Y%m%d)"

# Copia sul server VPS
ssh-copy-id root@217.154.118.37
```

---

## Comandi Rapidi (Tutto in Uno)

```bash
# 1. Cancella chiavi vecchie dal server
ssh root@217.154.118.37 "rm -f ~/.ssh/authorized_keys && mkdir -p ~/.ssh && chmod 700 ~/.ssh"

# 2. Genera nuova chiave (se necessario)
ssh-keygen -t ed25519 -f ~/.ssh/id_ed25519_vps -C "rescuemanager-vps-$(date +%Y%m%d)"

# 3. Copia nuova chiave
ssh-copy-id -i ~/.ssh/id_ed25519_vps.pub root@217.154.118.37

# 4. Verifica
ssh -i ~/.ssh/id_ed25519_vps root@217.154.118.37 "echo '✅ Funziona!'"
```

---

## Nota

Se hai già una chiave `id_ed25519_vps.pub` e vuoi solo cancellarla e ricrearla:

```bash
# Cancella chiave locale vecchia
rm -f ~/.ssh/id_ed25519_vps ~/.ssh/id_ed25519_vps.pub

# Cancella chiavi dal server
ssh root@217.154.118.37 "rm -f ~/.ssh/authorized_keys"

# Genera nuova
ssh-keygen -t ed25519 -f ~/.ssh/id_ed25519_vps -C "rescuemanager-vps-$(date +%Y%m%d)"

# Copia
ssh-copy-id -i ~/.ssh/id_ed25519_vps.pub root@217.154.118.37
```

