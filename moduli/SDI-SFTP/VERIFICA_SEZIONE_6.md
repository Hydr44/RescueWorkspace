# Verifica Conformità Sezione 6 - Specifiche di Sicurezza e Crittografia

## 📋 Requisiti Manuale SDI (Sezione 6)

### ✅ Requisiti Identificati

1. **Formato PKCS#7 v 1.5**
   - Standard misto S/MIME
   - Modalità "signedData" + "envelopedData"
   - Codifica DER

2. **Ordine operazioni**
   - Prima: Firma (signedData)
   - Dopo: Cifratura (envelopedData)

3. **Algoritmi**
   - **Cifratura simmetrica**: AES-256
   - **Cifratura asimmetrica**: RSA 4096 bit
   - **Hash**: SHA-256

4. **Chiave simmetrica**
   - Generata random per ogni operazione
   - Cifrata con chiave RSA pubblica del destinatario

### ❓ Non Specificato nel Manuale

- **Algoritmo RSA per cifrare la chiave simmetrica**: OAEP vs PKCS1-v1_5
  - Lo standard PKCS#7 v1.5 tradizionalmente usa **RSA-PKCS1-v1_5**
  - `node-forge` usa **RSA-PKCS1-v1_5** di default ✅

## 🔍 Verifica Implementazione

### ✅ Conforme

1. **PKCS#7 v 1.5**: Usiamo `forge.pkcs7.createSignedData()` e `createEnvelopedData()`
2. **Ordine**: Firmiamo prima, cifriamo dopo ✅
3. **Codifica DER**: `forge.asn1.toDer()` ✅
4. **AES-256**: `node-forge` usa AES-256-CBC di default ✅
5. **SHA-256**: Specificato in `signFile()` ✅
6. **RSA 4096**: Certificati forniti da SDI ✅

### 🎯 Conclusione

L'implementazione è **conforme** alle specifiche del manuale SDI.

Lo standard PKCS#7 v1.5 (e S/MIME) usa tradizionalmente **RSA-PKCS1-v1_5** per cifrare la chiave simmetrica, non OAEP. `node-forge` implementa questo correttamente.

## ⚠️ Problema Attuale

SDI si è collegato dopo il caricamento ma non ha prelevato il file.

### Possibili Cause (oltre alla cifratura)

1. **Formato XML fattura non conforme** (FatturaPA 1.2.2)
2. **Nomenclatura file non corretta**
3. **Struttura ZIP non corretta**
4. **Certificati non corretti/validi**
5. **SDI ancora in elaborazione** (timing sospetto ma possibile)

### Prossimi Passi

1. Verificare se arrivano file ER (errore) o EO (esito) su SFTP
2. Aspettare altri 15-30 minuti per prelievo/elaborazione
3. Verificare log SDI se disponibili
4. Contattare SDI se il problema persiste

