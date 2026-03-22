# SDI-SFTP Server - Riepilogo Deploy

## ✅ File Pronti

Ho creato tutti i file necessari per il server:

- ✅ `server-vps/server.js` - Server Express completo
- ✅ `server-vps/package.json` - Dipendenze
- ✅ `DEPLOY_SERVER_VPS.sh` - Script automatico (richiede sshpass)
- ✅ `DEPLOY_COMANDI_MANUALI.txt` - Comandi manuali passo-passo

## 🚀 Deploy

### Opzione 1: Script Automatico
```bash
cd moduli/SDI-SFTP
./DEPLOY_SERVER_VPS.sh
```

### Opzione 2: Comandi Manuali (Consigliato)
Vedi `DEPLOY_COMANDI_MANUALI.txt` - copia e incolla ogni sezione.

## 📋 Checklist Deploy

- [ ] File caricati sulla VPS (`/opt/sdi-sftp-server/`)
- [ ] Dipendenze installate (`npm install`)
- [ ] Variabili d'ambiente configurate (`/root/.env`)
- [ ] Chiave SSH generata (`/root/.ssh/sdi_sftp_key`)
- [ ] Server avviato con PM2
- [ ] Health check funzionante (`curl http://localhost:3002/health`)
- [ ] Nginx configurato (vedi passo successivo)
- [ ] Test endpoint pubblico

## 🔧 Prossimi Passi Dopo Deploy

1. **Configurare Nginx** (vedi `SETUP_VPS_COMPLETO.md`)
2. **Testare endpoint pubblico**
3. **Perfezionare generazione XML FatturaPA**
4. **Testare invio fattura end-to-end**

## 📝 Note

- Server su porta **3002** (RENTRI è 3001)
- Certificati già caricati in `/opt/sdi-certs/`
- Usa stesso `/root/.env` di RENTRI
- PM2 gestisce riavvio automatico

