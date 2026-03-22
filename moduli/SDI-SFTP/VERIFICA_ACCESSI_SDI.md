# Verifica Accessi Utente SDI

## 🔍 Analisi Log e Accessi

**Obiettivo:** Verificare se l'utente `sdi` ha tentato di prelevare dati dal server SFTP.

---

## 📋 Metodi di Verifica

### 1. Log SSH/SFTP
- `/var/log/auth.log` (Debian/Ubuntu)
- `/var/log/secure` (RHEL/CentOS)
- Contengono tutti gli accessi SSH/SFTP

### 2. Log Sistema
- `/var/log/messages` o `/var/log/syslog`
- Contengono eventi di sistema

### 3. Lastlog
- Comando `lastlog -u sdi`
- Mostra ultimo accesso dell'utente

### 4. Wtmp/Utmp
- Comando `last` o `who`
- Mostra cronologia accessi

### 5. Timestamp File
- `stat` sui file SFTP
- Verifica se file sono stati "toccati" (access time)
- Confronto con timestamp semaforo

### 6. Processi Attivi
- `ps aux | grep sftp`
- Verifica sessioni SFTP attive

---

## 🎯 Cosa Cercare

### Segnali di Accesso SDI:
- ✅ Righe nei log con `sdi` o `sftp`
- ✅ Timestamp semaforo aggiornato
- ✅ File access time modificato (se abilitato)
- ✅ Processi SFTP per utente sdi

### Segnali di Prelievo:
- ✅ File rimosso da `DatiVersoSdITest`
- ✅ File ER/EO creato in `DatiDaSdITest`
- ✅ Semaforo aggiornato dopo caricamento file

---

## 📝 Nota Importante

**ChrootDirectory per sdi:**
- L'utente `sdi` ha una home directory chroot (`/var/sftp/sdi`)
- I log standard potrebbero non mostrare tutti i dettagli
- Il semaforo è l'indicatore principale di accesso SDI

---

## 🔗 File di Riferimento

- Configurazione SFTP: `/etc/ssh/sshd_config`
- Directory SFTP: `/var/sftp/sdi/`
- Semaforo: `/var/sftp/sdi/DatiVersoSdITest/semaforodaSogei.log`

