# 📊 Riepilogo Doppio Approccio - Firma PKCS#7

**Data:** 14 gennaio 2026

---

## ✅ Risposte alle Domande

### 1. Serve acquistare una firma digitale?
**NO!** I certificati sono **forniti da Sogei** per i test:
- `EMMAT002.SCZMNL05L21D960T.firma.p12` - Certificato per firmare
- `EMMAT002.SCZMNL05L21D960T.cifra.p12` - Certificato per decifrare
- `sogeiunicocifra.pem` - Certificato pubblico Sogei

**Fonte:** Email da ServiziCrittograficiFTP di Sogei

---

### 2. Cosa dice il manuale?
**Il manuale suggerisce OpenSSL:**
```bash
# Estrai PEM dal P12
openssl pkcs12 -in cert.p12 -out FIRMA.PEM -nodes -passin pass:password

# Firma file
openssl smime -sign -in DATA/dati -outform der -binary -nodetach -out DATA/dati.p7m -signer CERTS/FIRMA.PEM
```

**Fonte:** Manuale "SCAMBIO DATI VIA FILE TRANSFER" - Paragrafo 6

---

### 3. Entrambi gli approcci implementati?
**SÌ!** Implementati entrambi:

1. **OpenSSL** (default, come da manuale)
   - Garantisce ordine corretto degli attributi
   - Standard de facto per PKCS#7
   - Conforme al manuale SDI

2. **node-forge** (fallback)
   - Senza signingTime (per test errore 00102)
   - Più veloce (no processi esterni)
   - Già implementato

---

## 🔧 Configurazione

**Default:** Usa OpenSSL (come da manuale)

**Per usare node-forge:**
```bash
# Sul VPS, nel file .env o variabile d'ambiente
SDI_USE_OPENSSL=false
```

**Nel codice:**
```javascript
const useOpenSSL = process.env.SDI_USE_OPENSSL !== 'false'; // Default: true
```

---

## 🧪 Test

### Test 1: OpenSSL (Default) - IN CORSO
1. ✅ Deploy completato
2. ⏳ Invia fattura
3. ⏳ Verifica se errore 00102 si risolve

### Test 2: node-forge (Se Test 1 fallisce)
1. ⏳ Imposta `SDI_USE_OPENSSL=false`
2. ⏳ Riavvia server: `pm2 restart sdi-sftp-server`
3. ⏳ Invia fattura
4. ⏳ Verifica se errore 00102 si risolve

---

## 📋 Vantaggi

### OpenSSL
- ✅ Conforme al manuale SDI
- ✅ Standard de facto per PKCS#7
- ✅ Garantisce ordine corretto degli attributi
- ✅ Usato da Sogei come esempio

### node-forge
- ✅ Nativo JavaScript (no dipendenze esterne)
- ✅ Più veloce (no processi esterni)
- ✅ Già implementato

---

## ⏳ Prossimi Passi

1. ✅ **Deploy completato**
2. ⏳ **Test con OpenSSL** (default)
3. ⏳ **Se necessario, test con node-forge**

---

**Status:** ✅ Pronto per test - OpenSSL come default (come da manuale)
