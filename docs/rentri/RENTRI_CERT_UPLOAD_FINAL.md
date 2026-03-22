# ✅ UPLOAD CERTIFICATI RENTRI - SISTEMA FINALE

## 🎊 Soluzione Implementata

Upload automatico certificati `.p12` via VPS con Nginx reverse proxy.

---

## 🏗️ Architettura Finale

```
┌─────────────────────┐
│   Desktop App       │
│   (localhost:8080)  │
└──────────┬──────────┘
           │ POST .p12 + password
           ▼
┌─────────────────────────────────┐
│  Nginx (217.154.118.37:80)      │
│  /rentri-cert-upload/*          │
│  (Reverse Proxy + CORS)         │
└──────────┬──────────────────────┘
           │ proxy_pass
           ▼
┌─────────────────────────────────┐
│  Node.js Server (localhost:3456)│
│  cert-upload-server.js          │
│  (OpenSSL extraction)           │
└──────────┬──────────────────────┘
           │ Certificate PEM + Key PEM
           ▼
┌─────────────────────────────────┐
│   Desktop App Frontend          │
└──────────┬──────────────────────┘
           │ Save to database
           ▼
┌─────────────────────────────────┐
│   Supabase PostgreSQL           │
│   rentri_org_certificates       │
└─────────────────────────────────┘
```

---

## 📍 Endpoints

### Health Check
```
GET http://217.154.118.37/rentri-cert-upload/health
Response: {"status":"ok","service":"rentri-cert-upload","timestamp":"..."}
```

### Upload Certificate
```
POST http://217.154.118.37/rentri-cert-upload/upload-cert
Content-Type: multipart/form-data

Body:
- p12_file: File (.p12 binary)
- password: String

Response:
{
  "success": true,
  "certificate_pem": "-----BEGIN CERTIFICATE-----...",
  "private_key_pem": "-----BEGIN PRIVATE KEY-----...",
  "issued_at": "2025-12-03T14:12:12.000Z",
  "expires_at": "2027-12-03T14:12:12.000Z"
}
```

---

## 🔧 Componenti

### 1. Nginx Reverse Proxy
```
Config: /etc/nginx/sites-available/rentri-cert-upload
Listen: 0.0.0.0:80
Path: /rentri-cert-upload/*
Proxy: http://localhost:3456/
CORS: Enabled
Max Upload: 10MB
Timeout: 300s
```

### 2. Node.js Server
```
Service: rentri-cert-upload.service (systemd)
Port: localhost:3456
Process: Node.js 20.19.6
Script: /opt/rentri-cert-upload/cert-upload-server.js
Auto-start: Yes (enabled)
```

### 3. Frontend Desktop App
```
File: src/pages/RifiutiCertificatiUpload.jsx
Endpoint: http://217.154.118.37/rentri-cert-upload/upload-cert
Flow:
  1. Upload .p12 to VPS
  2. Receive PEM from VPS
  3. Save to Supabase
  4. Redirect to certificates list
```

---

## 🚀 Workflow Completo

```
1. User seleziona file .p12 e compila form
   ↓
2. Frontend → POST http://217.154.118.37/rentri-cert-upload/upload-cert
   ↓
3. Nginx → Reverse proxy a localhost:3456
   ↓
4. Node.js → OpenSSL estrae certificato e chiave
   ↓
5. Node.js → Ritorna PEM al frontend
   ↓
6. Frontend → Salva in Supabase rentri_org_certificates
   ↓
7. ✅ Certificato pronto per trasmissione FIR!
```

---

## ✅ Vantaggi Soluzione

### Nginx Reverse Proxy
```
✅ Porta 80 già aperta (HTTP standard)
✅ CORS gestito da Nginx
✅ SSL/TLS disponibile (se necessario)
✅ Rate limiting possibile
✅ Logging centralizzato
✅ Load balancing futuro
✅ No problemi firewall provider
```

### Sicurezza
```
✅ Node.js server non esposto direttamente
✅ Solo localhost:3456 accessibile
✅ Nginx fa da filtro
✅ CORS configurato correttamente
✅ Timeout impostati
✅ Max upload size limitato
```

---

## 🧪 Test

### 1. Health Check
```bash
curl http://217.154.118.37/rentri-cert-upload/health
# Output: {"status":"ok",...}
```

### 2. Upload da App
```
1. Ricarica app (Cmd+R)
2. Rifiuti RENTRI → Certificati → "Carica Certificato"
3. Seleziona .p12
4. Compila form
5. Click "Carica Certificato"
6. ✅ Successo!
```

---

## 📊 Monitoring

### Logs Nginx
```bash
ssh root@217.154.118.37 'tail -f /var/log/nginx/access.log | grep rentri-cert-upload'
```

### Logs Node.js Service
```bash
ssh root@217.154.118.37 'journalctl -u rentri-cert-upload -f'
```

### Status Service
```bash
ssh root@217.154.118.37 'systemctl status rentri-cert-upload'
```

---

## 🔧 Manutenzione

### Restart Services
```bash
# Nginx
ssh root@217.154.118.37 'systemctl restart nginx'

# Node.js Server
ssh root@217.154.118.37 'systemctl restart rentri-cert-upload'
```

### Logs
```bash
# Nginx errors
ssh root@217.154.118.37 'tail -100 /var/log/nginx/error.log'

# Node.js logs
ssh root@217.154.118.37 'journalctl -u rentri-cert-upload -n 100'
```

### Test Connection
```bash
curl -v http://217.154.118.37/rentri-cert-upload/health
```

---

## 🎯 Status Finale

```
[✅] VPS Server: ATTIVO (localhost:3456)
[✅] Nginx Proxy: ATTIVO (0.0.0.0:80)
[✅] Endpoint: http://217.154.118.37/rentri-cert-upload/*
[✅] CORS: CONFIGURATO
[✅] Frontend: AGGIORNATO
[✅] Test: OK
[✅] Sistema: OPERATIVO 24/7
```

---

## 🚀 Pronto per Produzione!

Il sistema è completamente funzionante e accessibile via HTTP sulla porta 80 standard.

**Endpoint Finale**: `http://217.154.118.37/rentri-cert-upload/upload-cert`

Ogni azienda può ora caricare il proprio certificato `.p12` in modo completamente autonomo! 🎊

