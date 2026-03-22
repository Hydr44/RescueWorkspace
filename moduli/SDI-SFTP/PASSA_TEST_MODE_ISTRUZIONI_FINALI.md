# 🔧 Istruzioni Finali per Passare SDI in Test Mode

## ⚠️ IMPORTANTE: SSH Non Disponibile

Non ho permessi SSH per connettermi direttamente alla VPS. Devi eseguire questi comandi manualmente.

---

## 📋 Comandi da Eseguire sulla VPS

Connettiti alla VPS e esegui questi comandi:

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

## ✅ Dopo aver Eseguito i Comandi

SDI sarà in modalità TEST e:

- ✅ File caricati su `/var/sftp/sdi/DatiVersoSdITest`
- ✅ Usa codici destinatario TEST
- ✅ Le nuove funzionalità (ScontoMaggiorazione, Causale, DatiRiferimento) sono implementate
- ✅ Pronto per test domani mattina con dati veri

---

**Status:** ✅ Implementazione UI completata - Eseguire comandi SSH manualmente per passare in test mode
