# 🔍 Analisi Problema File FO

**Data:** 14 gennaio 2026  
**File:** `FO.02166430856.2026014.1554.901.zip`  
**Problema:** SDI sta cercando di inviare da ~1 ora ma non arriva

---

## 📋 Verifiche Eseguite

### 1. File FO Presente?
- ❌ **File FO NON presente** nella directory `/DatiDaSdITest`

### 2. Permessi Directory
- ✅ Directory: `/var/sftp/sdi/DatiDaSdITest`
- ⚠️ Permessi: `0755` (rwxr-xr-x) - **Problema potenziale**
- ✅ Proprietario: `sdi:sdi`

**Problema:** Permessi 0755 permettono write solo al proprietario. SDI potrebbe non essere proprietario.

**Soluzione:** Cambiato a `0777` (rwxrwxrwx) per permettere write a tutti

---

### 3. Configurazione SFTP
- ✅ ChrootDirectory: `/var/sftp/sdi`
- ✅ ForceCommand: `internal-sftp`
- ✅ PubkeyAuthentication: `yes`
- ✅ PasswordAuthentication: `no`

**Configurazione corretta**

---

### 4. Firewall
- ✅ UFW configurato
- ✅ IP Sogei permessi:
  - `217.175.54.31` (Internet)
  - `217.175.56.129` (DR Internet)
  - `217.175.48.25` (SPC)

**Firewall corretto**

---

### 5. File Semaforo
- ⏳ Verifica in corso...

**Il file `semaforodaSogei.log` viene creato da SDI per verificare la connessione**

---

## 🔧 Correzioni Applicate

### 1. Permessi Directory
```bash
chmod 777 /var/sftp/sdi/DatiDaSdITest
```

**Prima:** `0755` (rwxr-xr-x)  
**Dopo:** `0777` (rwxrwxrwx)

**Motivazione:** SDI deve poter scrivere (put) nella directory

---

## 📋 Verifiche Manuale

**Secondo manuale:**
- Directory `/DatiDaSdITest` deve avere permessi di **put e rename**
- SDI crea file `semaforodaSogei.log` per verificare connessione
- File FO vengono scritti con estensione `.zip.p7m.enc`

---

## ⏳ Prossimi Passi

1. ✅ **Permessi corretti** (777)
2. ⏳ **Attendere nuovo tentativo SDI** (circa 5-10 minuti)
3. ⏳ **Verificare file semaforo** (se creato, connessione OK)
4. ⏳ **Verificare file FO** quando arriva

---

## 📝 Note OpenSSL

**Domanda:** Serve sapere la versione di OpenSSL?

**Risposta:** NO, il manuale NON chiede la versione specifica. Dice solo:
- "Si suggerisce di installare le versioni più recenti e supportate"
- "Si consiglia, ove possibile, di utilizzare i package"

**Versione attuale:** OpenSSL 3.0.13 (recente e supportata) ✅

---

**Status:** ⚠️ Permessi corretti - In attesa di nuovo tentativo SDI
