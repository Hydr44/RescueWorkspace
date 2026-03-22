# 🚀 Vercel Secrets - Configurazione RENTRI Demo

**Guida passo-passo per configurare RENTRI su Vercel.**

⚠️ **IMPORTANTE**: Le variabili RENTRI **NON sono ancora state configurate su Vercel**. Segui questa guida per aggiungerle.

---

## 📋 Variabili da Configurare

### ✅ **OBBLIGATORIE**

| Variabile | Descrizione | Tipo |
|-----------|-------------|------|
| `RENTRI_GATEWAY_URL` | URL gateway proxy mTLS | Pubblico |
| `RENTRI_JWT_ISSUER` | Codice Fiscale operatore | Pubblico |
| `RENTRI_JWT_AUDIENCE` | Target API (demo/prod) | Pubblico |
| `RENTRI_JWT_TTL_SECONDS` | Durata token JWT | Pubblico |
| `RENTRI_JWT_PRIVATE_KEY` | Chiave privata certificato | 🔒 Encrypted |
| `RENTRI_JWT_CERT` | Certificato client | 🔒 Encrypted |

---

## 🔧 Step 1: Vai su Vercel Dashboard

1. Apri: https://vercel.com/dashboard
2. Seleziona il progetto **website**
3. Click su **"Settings"** (menu laterale sinistro)
4. Click su **"Environment Variables"**

---

## 📝 Step 2: Aggiungi le Variabili

### 1️⃣ RENTRI_GATEWAY_URL

- **Key**: `RENTRI_GATEWAY_URL`
- **Value**: 
  ```
  https://rentri-test.rescuemanager.eu
  ```
- **Environment**: ✅ Production, ✅ Preview, ✅ Development
- **Encrypted**: ❌ No
- Click **"Save"**

---

### 2️⃣ RENTRI_JWT_ISSUER

- **Key**: `RENTRI_JWT_ISSUER`
- **Value**: 
  ```
  SCZMNL05L21D960T
  ```
- **Environment**: ✅ Production, ✅ Preview, ✅ Development
- **Encrypted**: ❌ No
- Click **"Save"**

---

### 3️⃣ RENTRI_JWT_AUDIENCE

- **Key**: `RENTRI_JWT_AUDIENCE`
- **Value**: 
  ```
  rentrigov.demo.api
  ```
  ⚠️ **Per produzione** (quando disponibile): `rentrigov.api`
- **Environment**: ✅ Production, ✅ Preview, ✅ Development
- **Encrypted**: ❌ No
- Click **"Save"**

---

### 4️⃣ RENTRI_JWT_TTL_SECONDS

- **Key**: `RENTRI_JWT_TTL_SECONDS`
- **Value**: 
  ```
  55
  ```
- **Environment**: ✅ Production, ✅ Preview, ✅ Development
- **Encrypted**: ❌ No
- Click **"Save"**

---

### 5️⃣ RENTRI_JWT_PRIVATE_KEY ⚠️ SENSIBILE

**Contenuto da copiare** (TUTTO, incluso BEGIN/END):

```
-----BEGIN PRIVATE KEY-----
MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgRguiZJUN2o/WexE8
7XtzFEkFhTUHhE/Oi4ivUiFm7ZehRANCAARrbwsxsr6/68S/2kvcYZYosVCOeqrM
plwWdA9KOu5cDCzegNSgoMy4FcNFGbYy8AtQJjRW7uSsV8rJ3Ch6begM
-----END PRIVATE KEY-----
```

**In Vercel**:
- **Key**: `RENTRI_JWT_PRIVATE_KEY`
- **Value**: Copia e incolla il contenuto sopra (TUTTO, con BEGIN/END)
- **Environment**: ✅ Production, ✅ Preview, ✅ Development
- **Encrypted**: ✅ **SÌ** (molto importante!)
- Click **"Save"**

---

### 6️⃣ RENTRI_JWT_CERT ⚠️ SENSIBILE

**Contenuto da copiare** (TUTTO, incluso BEGIN/END):

```
-----BEGIN CERTIFICATE-----
MIIDGDCCAr+gAwIBAgIEBfYMfjAKBggqhkjOPQQDAjBXMQswCQYDVQQGEwJJVDET
MBEGA1UEChMKUkVOVFJJIE9yZzEWMBQGA1UECxMNUkVOVFJJIEFQSSBDQTEbMBkG
A1UEAxMSUkVOVFJJIEFQSSBDQSBERU1PMB4XDTI1MTIwMzE0MTIxMloXDTI3MTIw
MzE0MTIxMlowgZkxGTAXBgNVBC4TEFJFTlRSSS0xMDAwMTExMzQxJjAkBgNVBAMM
HVNDT1paQVJJTkkgRU1NQU5VRUwgU0FMVkFUT1JFMR8wHQYDVQRhDBZDRjpJVC1T
Q1pNTkwwNUwyMUQ5NjBUMSYwJAYDVQQKDB1TQ09aWkFSSU5JIEVNTUFOVUVMIFNB
TFZBVE9SRTELMAkGA1UEBhMCSVQwWTATBgcqhkjOPQIBBggqhkjOPQMBBwNCAARr
bwsxsr6/68S/2kvcYZYosVCOeqrMplwWdA9KOu5cDCzegNSgoMy4FcNFGbYy8AtQ
JjRW7uSsV8rJ3Ch6begMo4IBNDCCATAwDgYDVR0PAQH/BAQDAgbAMB8GA1UdIwQY
MBaAFHCuwTwtKx3Vpg+RvrF7yLt45QP3MEgGCCsGAQUFBwEBBDwwOjA4BggrBgEF
BQcwAoYsaHR0cHM6Ly9kZW1vYXBpLnJlbnRyaS5nb3YuaXQvY2EtcmVudHJpL2Nh
LzEwCQYDVR0TBAIwADAdBgNVHQ4EFgQUzX7avMMNhRMe3LY8lp9A0PrwrkYwHwYD
VR0lBBgwFgYIKwYBBQUHAwIGCisGAQQBgjcUAgIwJQYDVR0RBB4wHIEaUkVTQ1VF
TUFOQUdFUkBMRUdBTE1BSUwuSVQwQQYDVR0fBDowODA2oDSgMoYwaHR0cHM6Ly9k
ZW1vYXBpLnJlbnRyaS5nb3YuaXQvY2EtcmVudHJpL2NhLzEvY3JsMAoGCCqGSM49
BAMCA0cAMEQCID+xqvAbkrgKhEsbZ7NajlDd6IUPah3D2dfiN/J3bXqdAiAJPvIt
HY13k4f74Lspu+68ovZ2Q9E5KONMS70EzGvyEA==
-----END CERTIFICATE-----
```

**In Vercel**:
- **Key**: `RENTRI_JWT_CERT`
- **Value**: Copia e incolla il contenuto sopra (TUTTO, con BEGIN/END)
- **Environment**: ✅ Production, ✅ Preview, ✅ Development
- **Encrypted**: ✅ **SÌ** (molto importante!)
- Click **"Save"**

---

## ✅ Step 3: Verifica Configurazione

Dopo aver aggiunto tutte le variabili, dovresti vedere 6 variabili RENTRI:

```
✅ RENTRI_GATEWAY_URL              (public)
✅ RENTRI_JWT_ISSUER               (public)
✅ RENTRI_JWT_AUDIENCE             (public)
✅ RENTRI_JWT_TTL_SECONDS          (public)
✅ RENTRI_JWT_PRIVATE_KEY          (encrypted) 🔒
✅ RENTRI_JWT_CERT                 (encrypted) 🔒
```

---

## 🚀 Step 4: Redeploy

**IMPORTANTE**: Le variabili d'ambiente si applicano solo ai nuovi deployment!

1. Vai su **"Deployments"** (menu laterale)
2. Click su **"..."** accanto all'ultimo deployment
3. Click su **"Redeploy"**
4. Attendi il completamento (1-2 minuti)

---

## 🧪 Step 5: Test Connessione

Dopo il redeploy, testa la connessione RENTRI:

### Opzione A: Da Browser
Vai su: `https://tuosito.vercel.app/api/rentri/status?service=anagrafiche`

**Risposta attesa**:
```json
{
  "status": "Ok",
  "service": "anagrafiche"
}
```

### Opzione B: Da Terminale
```bash
curl "https://tuosito.vercel.app/api/rentri/status?service=anagrafiche"
```

---

## 📊 Checklist Finale

Prima di andare in produzione:

- [ ] Tutte le 6 variabili RENTRI configurate
- [ ] `RENTRI_JWT_PRIVATE_KEY` marcata come **Encrypted** ✅
- [ ] `RENTRI_JWT_CERT` marcata come **Encrypted** ✅
- [ ] Redeploy completato con successo
- [ ] Test endpoint `/api/rentri/status` funzionante
- [ ] Test lookup codifiche funzionante
- [ ] Logging/monitoring abilitato

---

## 🐛 Troubleshooting

### Errore: "Configurazione RENTRI JWT mancante"

**Causa**: Variabili non configurate o deployment non aggiornato

**Soluzione**:
1. Verifica che tutte le 6 variabili siano presenti in Vercel
2. Fai un nuovo **Redeploy**
3. Controlla i log del deployment per errori

---

### Errore: "unable to get local issuer certificate"

**Causa**: Problema con il proxy Nginx sul VPS, non Vercel

**Soluzione**:
1. Verifica che il gateway `rentri-test.rescuemanager.eu` sia attivo
2. Test diretto: `curl https://rentri-test.rescuemanager.eu/anagrafiche/v1.0/status`
3. Controlla i log Nginx: `ssh root@217.154.118.37 "tail -f /var/log/nginx/rentri-test.error.log"`

---

### Errore: "401 Unauthorized" su endpoint protetti

**Causa**: JWT non generato correttamente o chiave/certificato errati

**Soluzione**:
1. Verifica che `RENTRI_JWT_PRIVATE_KEY` e `RENTRI_JWT_CERT` siano completi (con BEGIN/END)
2. Controlla che non ci siano spazi o caratteri extra all'inizio/fine
3. Verifica che `RENTRI_JWT_ISSUER` sia corretto: `SCZMNL05L21D960T`

---

### Le variabili non sono visibili nel deployment

**Causa**: Le variabili d'ambiente si applicano solo ai nuovi deployment

**Soluzione**:
1. Dopo aver salvato le variabili, fai sempre un **Redeploy**
2. Non basta fare commit, serve un redeploy esplicito

---

## 🔐 Note di Sicurezza

1. ✅ **SEMPRE** marcare come **Encrypted**:
   - `RENTRI_JWT_PRIVATE_KEY`
   - `RENTRI_JWT_CERT`

2. ❌ **MAI** committare questi valori su Git

3. ✅ Abilita tutte e 3 gli environment (Production, Preview, Development)

4. 🔒 La chiave privata è sensibile: se qualcuno la ottiene può impersonare il tuo operatore RENTRI

5. 📅 **Scadenza certificato**: 3 dicembre 2027 (rinnova 30gg prima)

---

## 📚 Risorse Utili

- [Documentazione Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Vercel Encrypted Variables](https://vercel.com/docs/concepts/projects/environment-variables#encrypted-environment-variables)
- [RENTRI Configuration Guide](./RENTRI_CONFIGURATION.md)
- [RENTRI Setup Complete](../RENTRI_SETUP_COMPLETE.md)

---

## ✅ Status

- **Certificati**: ✅ Disponibili
- **VPS Gateway**: ✅ Configurato e funzionante
- **Vercel Variables**: ⏳ **DA CONFIGURARE** (segui questa guida)
- **Test Endpoint**: ⏳ Dopo configurazione Vercel

---

**Ultimo Aggiornamento**: 3 Dicembre 2025  
**Certificato Scadenza**: 3 Dicembre 2027

