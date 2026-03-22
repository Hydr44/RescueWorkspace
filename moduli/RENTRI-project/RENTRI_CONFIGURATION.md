# 🔐 Configurazione Certificato RENTRI Demo

Configurazione completata il **3 dicembre 2025** per l'integrazione RENTRI in ambiente DEMO.

---

## 📋 Informazioni Certificato

| Campo | Valore |
|-------|--------|
| **File .p12** | `SCZMNL05L21D960T.p12` (DEMO) |
| **Password** | `6o^Z+waO` |
| **Numero Seriale** | (da verificare nel portale RENTRI) |
| **Emesso il** | 03/12/2025 15:12 |
| **Scade il** | 03/12/2027 15:12 |
| **Validità** | 2 anni |
| **Issuer** | RENTRI API CA DEMO |
| **Subject** | CN=SCOZZARINI EMMANUEL SALVATORE, organizationIdentifier=CF:IT-SCZMNL05L21D960T |

---

## 📁 File Estratti

Dal certificato `.p12` sono stati estratti i seguenti file PEM:

### 1. Chiave Privata
```
SCZMNL05L21D960T-key.pem (413 bytes)
```
⚠️ **IMPORTANTE**: Mantieni questo file PRIVATO e sicuro!

### 2. Certificato Client
```
SCZMNL05L21D960T-cert.pem (1.5K)
```

### 3. CA Chain
```
SCZMNL05L21D960T-chain.pem (1.0K)
```
Contiene il certificato della CA RENTRI API DEMO.

---

## 🖥️ Configurazione VPS (217.154.118.37)

### Percorsi sul Server
```bash
/etc/nginx/ssl/rentri/
├── SCZMNL05L21D960T-cert.pem       # Certificato client
├── SCZMNL05L21D960T-key.pem        # Chiave privata (chmod 600)
├── SCZMNL05L21D960T-chain.pem      # CA chain
├── ca-bundle.pem                    # CA bundle combinato (218K)
└── rentri-ca.pem                    # CA server RENTRI
```

### Permessi
```bash
chmod 600 /etc/nginx/ssl/rentri/*.pem
chown root:root /etc/nginx/ssl/rentri/*.pem
```

### Nginx Configuration
File: `/etc/nginx/sites-available/rentri`

**Server Block DEMO** (`rentri-test.rescuemanager.eu`):
```nginx
location / {
  proxy_pass https://demoapi.rentri.gov.it$request_uri;
  proxy_set_header Host demoapi.rentri.gov.it;
  
  # Certificati mTLS
  proxy_ssl_certificate      /etc/nginx/ssl/rentri/SCZMNL05L21D960T-cert.pem;
  proxy_ssl_certificate_key  /etc/nginx/ssl/rentri/SCZMNL05L21D960T-key.pem;
  proxy_ssl_trusted_certificate /etc/nginx/ssl/rentri/ca-bundle.pem;
  
  proxy_ssl_verify on;
  proxy_ssl_verify_depth 4;
}
```

**Reload Nginx**:
```bash
nginx -t && systemctl reload nginx
```

---

## ⚙️ Variabili d'Ambiente (Website/Next.js)

Crea o aggiorna il file `.env.local` nel progetto `website/`:

```bash
# === RENTRI Gateway ===
RENTRI_GATEWAY_URL=https://rentri-test.rescuemanager.eu
RENTRI_HTTP_TIMEOUT_MS=30000

# === JWT Authentication ===
RENTRI_JWT_ISSUER=SCZMNL05L21D960T
RENTRI_JWT_AUDIENCE=rentrigov.demo.api
RENTRI_JWT_TTL_SECONDS=55

# === Certificati (Opzione 1: Path ai file) ===
RENTRI_JWT_PRIVATE_KEY_FILE=/percorso/Downloads/SCZMNL05L21D960T-key.pem
RENTRI_JWT_CERT_FILE=/percorso/Downloads/SCZMNL05L21D960T-cert.pem

# === Certificati (Opzione 2: Content inline) ===
# NOTA: Sostituire \n con a capo reali o usare sintassi multiline
RENTRI_JWT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
...contenuto chiave privata...
-----END PRIVATE KEY-----"

RENTRI_JWT_CERT="-----BEGIN CERTIFICATE-----
...contenuto certificato...
-----END CERTIFICATE-----"
```

### 🔄 Alternative per Deployment

**Vercel/Netlify**: Usa le variabili d'ambiente della piattaforma:
- Copia il contenuto di `SCZMNL05L21D960T-key.pem` in `RENTRI_JWT_PRIVATE_KEY`
- Copia il contenuto di `SCZMNL05L21D960T-cert.pem` in `RENTRI_JWT_CERT`
- ⚠️ Assicurati che siano impostate come **SECRET** (non pubbliche)

**Docker**: Usa secrets o volume mounts per i file PEM.

---

## ✅ Test Connessione

### 1. Test Gateway (via proxy)
```bash
curl -s https://rentri-test.rescuemanager.eu/anagrafiche/v1.0/status
```

**Risposta attesa**:
```json
{"status":"Ok"}
```

### 2. Test Altri Endpoint

**Codifiche**:
```bash
curl -s "https://rentri-test.rescuemanager.eu/codifiche/v1.0/lookup?tabella=Paesi"
```

**CA RENTRI Status**:
```bash
curl -s https://rentri-test.rescuemanager.eu/ca-rentri/v1.0/status
```

---

## 🔄 Rinnovo Certificato

Il certificato scade il **3 dicembre 2027**. Promemoria:

### 30 Giorni Prima della Scadenza
1. Accedi al portale RENTRI (demo)
2. Genera nuovo certificato `.p12`
3. Ripeti il processo di estrazione
4. Aggiorna i file sul VPS
5. Ricarica Nginx: `systemctl reload nginx`
6. Aggiorna le variabili d'ambiente del website

### Script Automatico (TODO)
Creare uno script per monitorare la scadenza e inviare notifiche:
```bash
# TODO: scripts/check-rentri-cert-expiry.sh
```

---

## 🐛 Troubleshooting

### Errore: "unable to get local issuer certificate"
- **Causa**: CA bundle mancante o incompleto
- **Fix**: Rigenerare `ca-bundle.pem`:
  ```bash
  cat /etc/nginx/ssl/rentri/SCZMNL05L21D960T-chain.pem \
      /etc/ssl/certs/ca-certificates.crt \
      > /etc/nginx/ssl/rentri/ca-bundle.pem
  ```

### Errore: 502 Bad Gateway
- Verifica i log: `tail -f /var/log/nginx/rentri-test.error.log`
- Controlla che i certificati siano leggibili: `ls -lh /etc/nginx/ssl/rentri/`
- Test connessione diretta da VPS:
  ```bash
  curl -s --cert /etc/nginx/ssl/rentri/SCZMNL05L21D960T-cert.pem \
           --key /etc/nginx/ssl/rentri/SCZMNL05L21D960T-key.pem \
           https://demoapi.rentri.gov.it/anagrafiche/v1.0/status
  ```

### Errore: "Configurazione RENTRI JWT mancante"
- Verifica che tutte le variabili d'ambiente siano impostate
- Controlla il formato dei certificati (devono includere header/footer)
- Verifica che `\n` sia convertito in newline reali

---

## 📚 Documentazione di Riferimento

- [Piano Integrazione RENTRI](./plans/RENTRI-integration-plan.md)
- [Implementazione Client REST](./plans/Implementazioni/client-rest.md)
- [Checklist Implementazioni](./plans/Implementazioni/checklist.md)
- [Architettura Overview](./plans/Architettura/overview.md)

---

## 📝 Log Modifiche

| Data | Autore | Modifiche |
|------|--------|-----------|
| 2025-12-03 | AI Assistant | Setup iniziale certificato DEMO |
| 2025-12-03 | AI Assistant | Configurazione Nginx mTLS |
| 2025-12-03 | AI Assistant | Test connessione con successo |

---

## ⚠️ Note di Sicurezza

1. ❌ **MAI committare** file `.pem` o `.p12` su Git
2. ✅ Aggiungi a `.gitignore`:
   ```
   *.p12
   *.pem
   *.key
   .env.local
   ```
3. 🔐 Usa variabili d'ambiente o secrets manager per produzione
4. 🔒 Limita accesso SSH al VPS solo a IP fidati
5. 📊 Monitora i log di accesso RENTRI per attività anomale

---

**Status**: ✅ OPERATIVO (Ambiente DEMO)
**Ultimo Test**: 3 dicembre 2025, 15:17 UTC
**Prossima Verifica**: 3 gennaio 2026

