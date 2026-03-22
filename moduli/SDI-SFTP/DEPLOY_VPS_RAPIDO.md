# 🚀 Deploy Rapido VPS - Istruzioni

## ✅ Script Pronto

Lo script `AGGIORNA_XML_GENERATOR_VPS.sh` è stato aggiornato per usare la chiave SSH `id_ed25519`.

## 📝 Esegui Manualmente

Apri il terminale e esegui:

```bash
cd /Users/sign.rascozzarini/Projects/rescuemanager-workspace/moduli/SDI-SFTP
./AGGIORNA_XML_GENERATOR_VPS.sh
```

## 🔑 Oppure Comandi Diretti

Se preferisci eseguire i comandi uno alla volta:

```bash
cd /Users/sign.rascozzarini/Projects/rescuemanager-workspace/moduli/SDI-SFTP

# 1. Imposta permessi chiave
chmod 600 id_ed25519

# 2. Copia file aggiornato
scp -i id_ed25519 -o StrictHostKeyChecking=no server-vps/xml-generator.js root@217.154.118.37:/opt/sdi-sftp-server/xml-generator.js

# 3. Riavvia server
ssh -i id_ed25519 -o StrictHostKeyChecking=no root@217.154.118.37 "cd /opt/sdi-sftp-server && pm2 restart sdi-sftp-server"

# 4. Verifica
ssh -i id_ed25519 -o StrictHostKeyChecking=no root@217.154.118.37 "pm2 status sdi-sftp-server && curl -s http://localhost:3004/health"
```

## ✅ Risultato Atteso

Dovresti vedere:
- ✅ xml-generator.js caricato con successo
- ✅ Server riavviato con successo
- ✅ Status PM2: `online`
- ✅ Health check: `{"status":"ok","service":"sdi-sftp-server","port":"3004"}`

## 🎯 Dopo il Deploy

1. **Testa con una fattura** dall'app desktop
2. **Verifica i log**: `ssh -i id_ed25519 root@217.154.118.37 "pm2 logs sdi-sftp-server --lines 50"`
3. **Controlla che SDI prelevi** il file

---

**File aggiornato:** `xml-generator.js` con **32 problemi critici risolti** ✅

