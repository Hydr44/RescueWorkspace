# ✅ Verifica Deploy VPS - xml-generator.js

## 🔍 Check Completo

Verifica che tutto sia OK dopo il deploy del file aggiornato.

---

## ✅ Checklist Verifica

- [ ] File copiato correttamente
- [ ] Server PM2 riavviato
- [ ] Health check OK
- [ ] File contiene tutte le validazioni (32 problemi risolti)
- [ ] Log server senza errori
- [ ] Server risponde correttamente

---

## 📋 Comandi Verifica

```bash
# 1. Status PM2
ssh -i moduli/SDI-SFTP/id_ed25519 root@217.154.118.37 "pm2 status sdi-sftp-server"

# 2. Health Check
ssh -i moduli/SDI-SFTP/id_ed25519 root@217.154.118.37 "curl -s http://localhost:3004/health"

# 3. Verifica file
ssh -i moduli/SDI-SFTP/id_ed25519 root@217.154.118.37 "ls -lh /opt/sdi-sftp-server/xml-generator.js"

# 4. Verifica contenuto (prime righe)
ssh -i moduli/SDI-SFTP/id_ed25519 root@217.154.118.37 "head -30 /opt/sdi-sftp-server/xml-generator.js"

# 5. Verifica validazioni presenti
ssh -i moduli/SDI-SFTP/id_ed25519 root@217.154.118.37 "grep -c 'ERRORE 004' /opt/sdi-sftp-server/xml-generator.js"

# 6. Log server
ssh -i moduli/SDI-SFTP/id_ed25519 root@217.154.118.37 "pm2 logs sdi-sftp-server --lines 30 --nostream"
```

---

## 🎯 Risultati Attesi

### Status PM2
```
┌─────┬──────────────────┬─────────┬─────────┬──────────┐
│ id  │ name             │ status  │ restart │ uptime   │
├─────┼──────────────────┼─────────┼─────────┼──────────┤
│ 0   │ sdi-sftp-server  │ online  │ 0       │ 5m       │
└─────┴──────────────────┴─────────┴─────────┴──────────┘
```

### Health Check
```json
{"status":"ok","service":"sdi-sftp-server","port":"3004"}
```

### File
- Dimensione: ~15-20 KB
- Contiene: tutte le validazioni ERRORE 00417, 00421, 00422, 00423, 00424, 00425, 00427, 00428, 00429, 00430
- Contiene: validazioni formato (CAP, Provincia, IdCodice, P.IVA, Codice Fiscale, Data, Quantità, PrezzoUnitario, AliquotaIVA)
- Contiene: calcoli con arrotondamento corretto

### Log Server
- Nessun errore di sintassi
- Nessun errore di import
- Server avviato correttamente

---

## ✅ Tutto OK se:

1. PM2 status: `online` ✅
2. Health check: `{"status":"ok"}` ✅
3. File presente e aggiornato ✅
4. Log senza errori ✅
5. Server risponde alle richieste ✅

---

**Data Verifica:** 13 gennaio 2026

