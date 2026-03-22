# 🧪 Istruzioni per Passare SDI in Modalità TEST

## ✅ Implementazione Completata

### **Modifiche all'XML Generator:**
1. ✅ **ScontoMaggiorazione** aggiunto in `<DettaglioLinee>`
2. ✅ **Causale** aggiunta in `<DatiGeneraliDocumento>` (obbligatoria per TD04/TD05)
3. ✅ **DatiRiferimento** aggiunto in `<DatiGeneraliDocumento>` (obbligatorio per TD04/TD05)
4. ✅ **Calcolo PrezzoTotale** aggiornato per includere sconti
5. ✅ **Calcolo Imponibile e IVA** aggiornato per includere sconti

---

## 🔧 Come Passare SDI in Modalità TEST

### **Opzione 1: Tramite Variabile d'Ambiente sul VPS**

Connettiti alla VPS e modifica il file `/root/.env`:

```bash
ssh root@217.154.118.37

# Apri il file .env
nano /root/.env

# Aggiungi o modifica questa riga:
SDI_SFTP_TEST_MODE=true

# Salva e esci (Ctrl+X, Y, Enter)
```

Poi riavvia il server:

```bash
cd /opt/sdi-sftp-server
pm2 restart sdi-sftp-server

# Verifica che sia in modalità test
pm2 logs sdi-sftp-server --lines 20 | grep -i "test mode"
```

---

### **Opzione 2: Tramite Script Automatico**

Usa lo script `PASSA_TEST_MODE.sh`:

```bash
cd moduli/SDI-SFTP
chmod +x PASSA_TEST_MODE.sh
./PASSA_TEST_MODE.sh
```

**Nota:** Lo script richiede accesso SSH alla VPS. Se non hai accesso SSH configurato, usa l'**Opzione 1**.

---

### **Opzione 3: Tramite Parametro nella Richiesta API**

Puoi passare `test_mode: true` nella richiesta API senza modificare il file `.env`:

```javascript
// Nella chiamata API
const response = await fetch('https://rescuemanager.eu/api/sdi-sftp/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    invoice_ids: [invoiceId],
    org_id: orgId,
    test_mode: true  // <-- Questo passa in test mode anche se SDI_SFTP_TEST_MODE=false
  })
});
```

Il server userà `test_mode` dalla richiesta se presente, altrimenti userà `SDI_SFTP_TEST_MODE` dal `.env`.

---

## ✅ Verifica Modalità TEST

Dopo aver configurato la modalità test, verifica che funzioni:

1. **Controlla i log del server:**
   ```bash
   ssh root@217.154.118.37
   pm2 logs sdi-sftp-server --lines 50
   ```

   Dovresti vedere: `[SDI-SFTP-SERVER] Test mode: true`

2. **Controlla la variabile d'ambiente:**
   ```bash
   ssh root@217.154.118.37
   grep SDI_SFTP_TEST_MODE /root/.env
   ```

   Dovresti vedere: `SDI_SFTP_TEST_MODE=true`

3. **Testa l'invio di una fattura:**
   - Usa codici destinatario TEST (vedi `CODICI_DESTINATARIO_TEST.md`)
   - Il file verrà caricato su `/var/sftp/sdi/DatiVersoSdITest` invece di `/var/sftp/sdi/DatiVersoSdI`

---

## 📋 Directory SFTP Test vs Produzione

### **Modalità TEST:**
- **Upload:** `/var/sftp/sdi/DatiVersoSdITest`
- **Download:** `/var/sftp/sdi/DatiDaSdITest`
- **Codici destinatario:** Usa codici TEST forniti da SDI

### **Modalità PRODUZIONE:**
- **Upload:** `/var/sftp/sdi/DatiVersoSdI`
- **Download:** `/var/sftp/sdi/DatiDaSdI`
- **Codici destinatario:** Usa codici reali

---

## 🧪 Test con Dati Veri Domani Mattina

Dopo aver passato in test mode:

1. ✅ **Verifica che il server sia in modalità TEST**
2. ✅ **Crea una fattura con codice destinatario TEST**
3. ✅ **Aggiungi sconto su una riga** (per testare ScontoMaggiorazione)
4. ✅ **Invia la fattura a SDI**
5. ✅ **Verifica che il file XML sia corretto:**
   - Contiene `<ScontoMaggiorazione>` se presente sconto
   - Contiene `<Causale>` se presente nota
   - Contiene `<DatiRiferimento>` se è TD04/TD05
6. ✅ **Verifica che il file sia caricato su `/var/sftp/sdi/DatiVersoSdITest`**
7. ✅ **Attendi processamento SDI e verifica esito**

---

## ⚠️ Note Importanti

- **NON modificare** gli altri flussi SDI esistenti
- **NON toccare** la logica di trasmissione SDI
- **NON modificare** la logica di prelievo file SDI
- Solo le **aggiunte** per ScontoMaggiorazione, Causale e DatiRiferimento sono state implementate

---

**Status:** ✅ Implementazione completata - Pronta per test domani mattina
