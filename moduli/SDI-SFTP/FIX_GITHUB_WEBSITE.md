# ✅ Fix GitHub Website

**Data:** 13 gennaio 2026  
**Problema:** Git non riusciva a connettersi a GitHub (chiave SSH mancante)  
**Soluzione:** Cambiato remote da SSH a HTTPS

---

## 🔍 Problema Identificato

Git stava cercando la chiave SSH:
```
/Users/sign.rascozzarini/.ssh/id_ed25519_github
```

Ma questa chiave non esisteva (nel config SSH è configurata, ma il file non esiste), causando:
```
Permission denied (publickey)
```

---

## ✅ Soluzione 1: Usare HTTPS (Consigliata)

Cambiato il remote da SSH a HTTPS:
- **Prima:** `git@github.com:Hydr44/Web.git`
- **Dopo:** `https://github.com/Hydr44/Web.git`

**Comando eseguito:**
```bash
cd /Users/sign.rascozzarini/Projects/rescuemanager-workspace/website
git remote set-url origin https://github.com/Hydr44/Web.git
```

---

## 🔑 Soluzione 2: Creare la Chiave SSH Mancante (Alternativa)

Se preferisci continuare a usare SSH, puoi:

1. **Creare la chiave SSH:**
```bash
ssh-keygen -t ed25519 -f ~/.ssh/id_ed25519_github -C "github-key"
```

2. **Aggiungere la chiave pubblica a GitHub:**
```bash
cat ~/.ssh/id_ed25519_github.pub
# Copia il contenuto e aggiungilo su GitHub Settings > SSH Keys
```

3. **Oppure modificare il config SSH per usare la chiave esistente:**
Modifica `~/.ssh/config` e cambia:
```
Host github.com
  AddKeysToAgent yes
  IdentityFile ~/.ssh/id_ed25519  # Usa la chiave esistente
  IdentitiesOnly yes
```

---

## ⚠️ Nota per HTTPS

Con HTTPS, GitHub potrebbe richiedere:
- Token di accesso personale (PAT) se 2FA è abilitato
- Credenziali GitHub standard

Se necessario, configurare le credenziali tramite:
- GitHub CLI (`gh auth login`)
- Credential helper di Git
- Credenziali salvate nel keychain macOS

---

## 🎯 Prossimi Passi

1. ✅ Remote aggiornato a HTTPS
2. ⏳ Testare `git fetch` e `git push`
3. ⏳ Se necessario, configurare autenticazione GitHub (token o credenziali)
