# ✅ Pronto per Test - Nuovo Approccio OpenSSL

**Data:** 14 gennaio 2026

---

## 🎯 Test da Eseguire

**Obiettivo:** Verificare se l'uso di OpenSSL per la firma risolve l'errore 00102 (Signed attributes non ordinati).

---

## ✅ Verifiche Pre-Test

### 1. OpenSSL Installato
- ⏳ Verifica in corso...

### 2. Server in Esecuzione
- ⏳ Verifica in corso...

### 3. Certificati Presenti
- ⏳ Verifica in corso...

### 4. Codice Deployato
- ✅ Codice deployato sul VPS
- ✅ Server riavviato

---

## 🔧 Configurazione Attuale

**Metodo di firma:** OpenSSL (default, come da manuale SDI)

**Variabile d'ambiente:**
- `SDI_USE_OPENSSL` non impostata → Default: `true` (usa OpenSSL)

**Comando OpenSSL utilizzato:**
```bash
# Estrai PEM dal P12
openssl pkcs12 -in cert.p12 -out FIRMA.PEM -nodes -passin pass:password

# Firma file
openssl smime -sign -in DATA/dati -outform der -binary -nodetach -out DATA/dati.p7m -signer CERTS/FIRMA.PEM
```

---

## 📋 Cosa Aspettarsi

### Se Funziona:
- ✅ File inviato correttamente
- ✅ Prelevato da SDI
- ✅ File EO con esito positivo (ET01)
- ✅ Nessun file ER (notifica di scarto)

### Se Non Funziona:
- ⚠️ File ER con codice errore 2 (verifica firma)
- ⚠️ Errore 00102 persistente
- ⏳ Prossimo step: Testare con node-forge (`SDI_USE_OPENSSL=false`)

---

## ⏳ Prossimi Passi

1. ✅ Verifiche pre-test
2. ⏳ **Invia fattura per test**
3. ⏳ Monitora risultato (circa 20-30 minuti)
4. ⏳ Verifica file EO o ER

---

**Status:** ⏳ In attesa di verifica pre-test
