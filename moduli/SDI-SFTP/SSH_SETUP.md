# 🔑 Setup SSH Key per VPS

## Comandi da Eseguire sul Tuo Computer Locale

### Opzione 1: Se hai già accesso SSH (con password) - CONSIGLIATA

```bash
ssh-copy-id root@217.154.118.37
```

Ti chiederà la password (`1x9Wa2eW`) e copierà automaticamente la tua chiave pubblica sul server.

---

### Opzione 2: Se non hai `ssh-copy-id`, esegui manualmente

```bash
cat ~/.ssh/id_rsa.pub | ssh root@217.154.118.37 'mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys'
```

Oppure se usi chiave ed25519:

```bash
cat ~/.ssh/id_ed25519.pub | ssh root@217.154.118.37 'mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys'
```

---

### Opzione 3: Se non hai una chiave SSH, generane una prima

```bash
# Genera nuova chiave SSH
ssh-keygen -t rsa -b 4096 -C "rescuemanager-vps"

# Oppure usa ed25519 (più moderna)
ssh-keygen -t ed25519 -C "rescuemanager-vps"

# Poi usa Opzione 1 o 2 per copiarla
```

---

### Opzione 4: Mostra la chiave pubblica e copiala manualmente

```bash
# Mostra la chiave pubblica
cat ~/.ssh/id_rsa.pub
# oppure
cat ~/.ssh/id_ed25519.pub
```

Poi:
1. Copia l'output completo
2. Accedi al server: `ssh root@217.154.118.37` (password: `1x9Wa2eW`)
3. Esegui:
   ```bash
   mkdir -p ~/.ssh
   chmod 700 ~/.ssh
   nano ~/.ssh/authorized_keys
   ```
4. Incolla la chiave pubblica
5. Salva (Ctrl+X, Y, Enter)
6. Imposta permessi:
   ```bash
   chmod 600 ~/.ssh/authorized_keys
   ```

---

## Verifica

Dopo aver copiato la chiave, prova ad accedere senza password:

```bash
ssh root@217.154.118.37
```

Dovrebbe entrare direttamente senza chiedere la password.

---

## Nota

La sandbox di Cursor non può accedere alle tue chiavi SSH private per motivi di sicurezza. Devi eseguire questi comandi sul **tuo computer locale**, non dalla sandbox.

