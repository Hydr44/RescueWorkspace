# 🔑 Usare Chiave SSH Temporanea

## Opzione 1: Copia Temporanea (CONSIGLIATA)

```bash
# 1. Copia la chiave nella directory workspace
cp ~/.ssh/id_ed25519_vps moduli/SDI-SFTP/.ssh_key_temp

# 2. Imposta permessi corretti
chmod 600 moduli/SDI-SFTP/.ssh_key_temp

# 3. Aggiungi a .gitignore per sicurezza
echo "moduli/SDI-SFTP/.ssh_key_temp" >> .gitignore

# 4. Dopo aver finito, CANCELLA la chiave:
rm moduli/SDI-SFTP/.ssh_key_temp
```

Poi posso usare:
```bash
ssh -i moduli/SDI-SFTP/.ssh_key_temp root@217.154.118.37
```

---

## Opzione 2: Usa Chiave Default

Se hai una chiave default (`~/.ssh/id_rsa` o `~/.ssh/id_ed25519`), prova:

```bash
# Copia quella
cp ~/.ssh/id_rsa moduli/SDI-SFTP/.ssh_key_temp 2>/dev/null || \
cp ~/.ssh/id_ed25519 moduli/SDI-SFTP/.ssh_key_temp

chmod 600 moduli/SDI-SFTP/.ssh_key_temp
```

---

## ⚠️ IMPORTANTE: Sicurezza

1. **NON committare mai la chiave** nel repository Git
2. **Cancella la chiave** dopo aver finito: `rm moduli/SDI-SFTP/.ssh_key_temp`
3. La chiave è già in `.gitignore` quindi non verrà committata per errore

---

## Comandi Rapidi

```bash
# Copia chiave
cp ~/.ssh/id_ed25519_vps moduli/SDI-SFTP/.ssh_key_temp && \
chmod 600 moduli/SDI-SFTP/.ssh_key_temp && \
echo "moduli/SDI-SFTP/.ssh_key_temp" >> .gitignore

# Dopo aver finito, cancella:
rm moduli/SDI-SFTP/.ssh_key_temp
```

