# Inserire Qui le Chiavi Pubbliche SSH di SDI

## 📝 Istruzioni

1. **Crea un nuovo file** per ciascuna chiave pubblica ricevuta da SDI
2. **Nome file**: Usa un nome descrittivo, ad esempio:
   - `sdi_test.pub`
   - `sdi_production.pub`
   - `sdi_chiave_1.pub`

3. **Incolla la chiave pubblica** nel file (una chiave per file)

4. **Formato atteso**: Le chiavi SSH pubbliche hanno questo formato:
   ```
   ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQ... commento
   ```
   oppure
   ```
   ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAA... commento
   ```

## ⚠️ Esempio

Quando riceverai le chiavi, crea un file come questo:

**File**: `sdi_test.pub`
```
ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQC... sdi-test@fatturapa.gov.it
```

## 🔄 Prossimi Passi

Dopo aver inserito le chiavi qui:
1. Aggiungerle a `/var/sftp/sdi/.ssh/authorized_keys` sul server VPS
2. Verificare i permessi
3. Testare la connessione SFTP

---

**In attesa delle chiavi pubbliche da SDI...**



Sogei_SdI1.pub
Sogei_SdI2.pub