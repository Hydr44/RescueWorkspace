# 🧪 Guida Test Rapida SDI-SFTP

## ✅ Stato: PRONTO PER TEST

Tutto è implementato. Puoi testare dalla tua app!

## 📋 Codici Destinatario Test

### PA (Pubblica Amministrazione)
- `VRFFZQ` - ftp://217.154.118.37
- `DRNVSC` - ftp://217.154.118.37  
- `VRFMAI` - ftp://217.154.118.37

### B2B
- `VRCAXRR` - ftp://217.154.118.37
- `VRSQZLM` - ftp://217.154.118.37
- `VRVMEOS` - ftp://217.154.118.37

## 🚀 Come Testare (Step by Step)

### 1. Aprire Desktop App
- Vai su "Fatture" → "Nuova Fattura"

### 2. Creare Fattura Test

**Esempio Fattura PA:**
- **Cliente**: "Comune di Test"
- **Codice Destinatario**: `VRFFZQ` (o uno degli altri codici PA)
- **Tipo Documento**: TD01 (Fattura)
- **Data**: Data odierna
- **Numero**: 001
- **Riga 1**: 
  - Descrizione: "Servizio Test"
  - Quantità: 1
  - Prezzo: 100.00€
  - IVA: 22%

**Esempio Fattura B2B:**
- **Cliente**: "Azienda Test SRL"
- **Partita IVA**: 12345678901
- **Codice Destinatario**: `VRCAXRR` (o uno degli altri codici B2B)
- **Tipo Documento**: TD01 (Fattura)
- **Data**: Data odierna
- **Numero**: 002
- **Riga 1**:
  - Descrizione: "Servizio Test"
  - Quantità: 1
  - Prezzo: 200.00€
  - IVA: 22%

### 3. IMPORTANTE: Selezionare Ambiente TEST

Nella pagina di creazione fattura:
- Assicurati che **"Ambiente Test"** sia selezionato (radio button)

### 4. Salvare Fattura

- Cliccare "Salva"
- Verrai portato alla pagina dettaglio fattura

### 5. Validare XML

- Nella pagina dettaglio fattura
- Cliccare **"Valida XML"**
- Attendi validazione (dovrebbe mostrare "Validato")

### 6. Inviare a SDI

- Assicurati che toggle **"Modalità Test SDI"** sia attivo (checkbox)
- Cliccare **"Invia a SDI"**
- Attendi risposta

### 7. Verificare Risultato

**Nell'app:**
- Controlla messaggi di errore/successo
- Stato fattura dovrebbe diventare "sent"

**Log Desktop App (Console Browser F12):**
- Cerca messaggi `[SDI-SFTP]` o `[SDI]`

**Log Server VPS:**
```bash
ssh root@217.154.118.37 "pm2 logs sdi-sftp-server --lines 50"
```

**File su SFTP:**
```bash
ssh root@217.154.118.37 "ls -lah /var/sftp/sdi/DatiVersoSdITest/"
```

## ⚠️ Problemi Comuni

### Errore: "Fattura non validata"
- **Soluzione**: Devi prima validare l'XML con il pulsante "Valida XML"

### Errore: "orgId richiesto"
- **Soluzione**: Questo non dovrebbe succedere, ma se succede verifica che sei loggato

### File non caricato su SFTP
- **Verifica**: Log server VPS per errori
- **Controlla**: Certificati e chiave SSH configurati
- **Verifica**: Directory `/var/sftp/sdi/DatiVersoSdITest/` esistente e scrivibile

## 📝 Note

- **Ambiente TEST**: Usa directory `/DatiVersoSdITest` su SFTP
- **Progressivo**: Attualmente fisso (da implementare incrementale per produzione)
- **Monitoraggio**: SDI preleva i file via polling automatico

## ✅ Checklist Pre-Test

- [x] Server VPS online
- [x] Certificati caricati
- [x] Desktop App aggiornata
- [x] Route API Vercel configurata
- [ ] Test end-to-end (da fare)

## 🎯 Pronto!

Tutto è pronto. Puoi iniziare i test dalla tua app!

