# Aggiornamento VPS - Istruzioni

## ✅ File Preparato

Ho preparato lo script per aggiornare `xml-generator.js` sul VPS.

## 🚀 Come Eseguire

### Opzione 1: Script Automatico (Consigliato)

Esegui questo comando nel terminale:

```bash
cd /Users/sign.rascozzarini/Projects/rescuemanager-workspace/moduli/SDI-SFTP
./AGGIORNA_XML_GENERATOR_VPS.sh
```

Lo script:
1. Copia `xml-generator.js` aggiornato sul VPS
2. Riavvia il server PM2
3. Verifica che tutto funzioni

**Password richiesta:** `1x9Wa2eW`

### Opzione 2: Comandi Manuali

Se lo script non funziona, esegui questi comandi uno alla volta:

```bash
cd /Users/sign.rascozzarini/Projects/rescuemanager-workspace/moduli/SDI-SFTP/server-vps

# 1. Copia file
scp xml-generator.js root@217.154.118.37:/opt/sdi-sftp-server/xml-generator.js
# Password: 1x9Wa2eW

# 2. Riavvia server
ssh root@217.154.118.37 "cd /opt/sdi-sftp-server && pm2 restart sdi-sftp-server"
# Password: 1x9Wa2eW

# 3. Verifica
ssh root@217.154.118.37 "pm2 status sdi-sftp-server && curl -s http://localhost:3004/health"
# Password: 1x9Wa2eW
```

## 📝 Verifica Website

Ho verificato che **non ci sono modifiche su website** da committare.

Il file `website/src/app/api/sdi-sftp/send/route.ts` usa già il proxy corretto verso il VPS.

## ✅ Dopo l'Aggiornamento

1. **Testa con una fattura** dall'app desktop
2. **Verifica i log** del server:
   ```bash
   ssh root@217.154.118.37 "pm2 logs sdi-sftp-server --lines 50"
   ```
3. **Controlla che SDI prelevi** il file (controlla `/var/sftp/sdi/DatiVersoSdITest/`)

## 🎯 File Aggiornato

- `moduli/SDI-SFTP/server-vps/xml-generator.js` - **32 problemi critici risolti**
- Pronto per il deploy sul VPS
- Tutte le validazioni SDI implementate

---

**Data:** 13 gennaio 2026  
**Stato:** ✅ Pronto per il deploy

