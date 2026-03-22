# 🔧 Implementazione Doppio Approccio - Firma PKCS#7

**Data:** 14 gennaio 2026  
**Obiettivo:** Testare entrambi gli approcci per risolvere errore 00102

---

## 🎯 Strategia

Implementare **due metodi di firma** per testare quale risolve l'errore 00102:
1. **OpenSSL** (come suggerito dal manuale SDI)
2. **node-forge** (senza signingTime)

---

## 📋 Certificati

**✅ Certificati forniti da Sogei** - Non serve acquistare una firma digitale!

- `EMMAT002.SCZMNL05L21D960T.firma.p12` - Certificato per firmare
- `EMMAT002.SCZMNL05L21D960T.cifra.p12` - Certificato per decifrare
- `sogeiunicocifra.pem` - Certificato pubblico Sogei per cifrare

---

## 🔧 Implementazione

### 1. OpenSSL (Metodo Consigliato dal Manuale)

**Comando manuale:**
```bash
# Estrai PEM dal P12
openssl pkcs12 -in cert.p12 -out FIRMA.PEM -nodes -passin pass:password

# Firma file
openssl smime -sign -in DATA/dati -outform der -binary -nodetach -out DATA/dati.p7m -signer CERTS/FIRMA.PEM
```

**Funzione:** `signFileOpenSSL()`
- Estrae automaticamente il PEM dal P12
- Usa comando OpenSSL esattamente come da manuale
- Garantisce ordine corretto degli attributi (OpenSSL è standard)

---

### 2. node-forge (Metodo Alternativo)

**Funzione:** `signFileForge()`
- Usa node-forge (già implementato)
- **Senza signingTime** (rimosso per test errore 00102)
- Fallback se OpenSSL fallisce

---

### 3. Funzione Unificata

**Funzione:** `signFile()`
- **Default:** Usa OpenSSL (come da manuale)
- **Fallback:** node-forge se OpenSSL fallisce
- **Configurabile:** Variabile d'ambiente `SDI_USE_OPENSSL`

---

## ⚙️ Configurazione

**Variabile d'ambiente:**
```bash
SDI_USE_OPENSSL=true   # Default: usa OpenSSL
SDI_USE_OPENSSL=false  # Usa node-forge
```

**Nel codice:**
```javascript
const useOpenSSL = process.env.SDI_USE_OPENSSL !== 'false'; // Default: true
const signedXmlBuffer = await signFile(xmlBuffer, CERT_PATHS.firma, CERT_PATHS.password, useOpenSSL);
```

---

## 🧪 Test

### Test 1: OpenSSL (Default)
1. ✅ Deploy codice
2. ⏳ Invia fattura
3. ⏳ Verifica se errore 00102 si risolve

### Test 2: node-forge (Se Test 1 fallisce)
1. ⏳ Imposta `SDI_USE_OPENSSL=false`
2. ⏳ Invia fattura
3. ⏳ Verifica se errore 00102 si risolve

---

## 📊 Vantaggi

### OpenSSL
- ✅ **Conforme al manuale SDI**
- ✅ **Standard de facto** per PKCS#7
- ✅ **Garantisce ordine corretto** degli attributi
- ✅ **Usato da Sogei** come esempio

### node-forge
- ✅ **Nativo JavaScript** (no dipendenze esterne)
- ✅ **Più veloce** (no processi esterni)
- ✅ **Già implementato**

---

## ⏳ Prossimi Passi

1. ✅ **Implementazione completata**
2. ⏳ **Deploy su VPS**
3. ⏳ **Test con OpenSSL** (default)
4. ⏳ **Se necessario, test con node-forge**

---

**Status:** ✅ Implementazione completata - Pronto per deploy e test
