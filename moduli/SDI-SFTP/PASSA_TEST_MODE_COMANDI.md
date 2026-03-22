# 🔧 Comandi per Passare SDI in Test Mode

Esegui questi comandi sul VPS per passare SDI in modalità TEST:

```bash
# 1. Connettiti al VPS
ssh root@217.154.118.37

# 2. Rimuovi eventuali righe SDI_SFTP_TEST_MODE esistenti
sed -i '/^SDI_SFTP_TEST_MODE=/d' /root/.env

# 3. Aggiungi SDI_SFTP_TEST_MODE=true
echo "" >> /root/.env
echo "# SDI-SFTP Test Mode" >> /root/.env
echo "SDI_SFTP_TEST_MODE=true" >> /root/.env

# 4. Verifica che sia stato aggiunto
grep SDI_SFTP_TEST_MODE /root/.env

# 5. Riavvia il server
cd /opt/sdi-sftp-server
pm2 restart sdi-sftp-server

# 6. Verifica che sia in test mode (controlla i log)
pm2 logs sdi-sftp-server --lines 20 | grep -i "test mode"
```

**Dovresti vedere:** `[SDI-SFTP-SERVER] Test mode: true`

---

**Dopo aver eseguito questi comandi, SDI sarà in modalità TEST.**
