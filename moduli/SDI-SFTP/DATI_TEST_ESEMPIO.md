# 📝 Dati di Test per Fatture SDI-SFTP

## Codici Destinatario per Test

### PA (Pubblica Amministrazione)
- **VRFFZQ** - ftp://217.154.118.37
- **DRNVSC** - ftp://217.154.118.37
- **VRFMAI** - ftp://217.154.118.37

### B2B
- **VRCAXRR** - ftp://217.154.118.37
- **VRSQZLM** - ftp://217.154.118.37
- **VRVMEOS** - ftp://217.154.118.37

## Esempio Fattura Test - PA

**Cliente:**
- Denominazione: "Comune di Test"
- Codice Destinatario: `VRFFZQ`
- PEC: (opzionale)

**Fattura:**
- Tipo Documento: TD01 (Fattura)
- Data: Data odierna
- Numero: 001
- Riga 1: Servizio Test - Qty: 1 - Prezzo: 100.00€ - IVA: 22%

**Ambiente:** TEST

## Esempio Fattura Test - B2B

**Cliente:**
- Denominazione: "Azienda Test SRL"
- Partita IVA: 12345678901
- Codice Destinatario: `VRCAXRR`
- PEC: (opzionale)

**Fattura:**
- Tipo Documento: TD01 (Fattura)
- Data: Data odierna
- Numero: 002
- Riga 1: Servizio Test - Qty: 1 - Prezzo: 200.00€ - IVA: 22%

**Ambiente:** TEST

## Come Creare Fattura di Test

1. Aprire Desktop App
2. Andare su "Fatture" → "Nuova Fattura"
3. Compilare dati cliente con uno dei codici destinatario sopra
4. Aggiungere righe fattura
5. Salvare fattura
6. Andare su dettaglio fattura
7. Validare XML (pulsante "Valida XML")
8. Selezionare ambiente TEST
9. Cliccare "Invia a SDI"

## Verifica

Dopo l'invio, verificare:
1. Log server VPS: `pm2 logs sdi-sftp-server`
2. File su SFTP: `/var/sftp/sdi/DatiVersoSdITest/`
3. Nome file: `FI.{IdNodo}.{aaaaggg}.{hhmm}.{nnn}.zip`
4. Stato fattura: Dovrebbe essere "sent"

