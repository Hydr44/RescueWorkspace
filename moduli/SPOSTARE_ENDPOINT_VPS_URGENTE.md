# 🚨 URGENTE: Spostare Endpoint su VPS per Ridurre Costi Vercel

**Data**: 2026-01-23  
**Priorità**: 🔴 CRITICA - Riduzione costi Vercel

---

## 🔴 PROBLEMA

Ho appena spostato tutti gli endpoint su Vercel per risolvere i 404, ma questo **aumenta i costi Vercel** invece di ridurli!

**Endpoint attualmente su Vercel che generano edge requests**:
- `/api/rentri/fir/trasmetti` ❌
- `/api/rentri/fir/firma` ❌
- `/api/rentri/fir/accettazione` ❌
- `/api/rentri/fir/annulla` ❌
- `/api/rentri/fir/transazione-status` ❌
- `/api/rentri/fir/transazione-result` ❌
- `/api/rentri/ai-validate` ❌
- `/api/rentri/limiti/alert` ❌
- `/api/version/check` ❌

---

## ✅ SOLUZIONE: Proxy Nginx sul VPS

### Opzione 1: Proxy Nginx a Vercel (Temporaneo)

Configurare Nginx sul VPS per fare proxy a Vercel per questi endpoint specifici, mantenendo gli altri sul VPS.

**Vantaggi**:
- ✅ Implementazione rapida (5 minuti)
- ✅ Nessuna modifica al codice Vercel
- ✅ Tutto passa attraverso VPS (riduce edge requests dirette)

**Svantaggi**:
- ⚠️ Le richieste arrivano comunque a Vercel (ma passano attraverso VPS)
- ⚠️ Aggiunge un hop in più

### Opzione 2: Creare Server Express sul VPS (Consigliato)

Creare un server Express sul VPS che gestisce questi endpoint, copiando la logica da Vercel.

**Vantaggi**:
- ✅ Zero costi Vercel per questi endpoint
- ✅ Controllo completo
- ✅ Performance migliori

**Svantaggi**:
- ⚠️ Richiede più tempo (1-2 ore)
- ⚠️ Deve mantenere sincronizzazione con Vercel

---

## 🔧 IMPLEMENTAZIONE RAPIDA: Proxy Nginx

### Step 1: Configurare Nginx sul VPS

**File**: `/etc/nginx/sites-available/rentri`

Aggiungere location blocks per gli endpoint che devono andare a Vercel:

```nginx
server {
  listen 443 ssl http2;
  server_name rentri-test.rescuemanager.eu;

  # ... configurazione SSL esistente ...

  # Proxy endpoint FIR a Vercel
  location /api/rentri/fir/ {
    proxy_pass https://rescuemanager.eu;
    proxy_set_header Host rescuemanager.eu;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    
    # Timeout per operazioni lunghe
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
  }

  # Proxy endpoint AI Validation a Vercel
  location /api/rentri/ai-validate {
    proxy_pass https://rescuemanager.eu;
    proxy_set_header Host rescuemanager.eu;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    
    # Timeout lungo per IA
    proxy_connect_timeout 90s;
    proxy_send_timeout 90s;
    proxy_read_timeout 90s;
  }

  # Proxy endpoint limiti/alert a Vercel
  location /api/rentri/limiti/alert {
    proxy_pass https://rescuemanager.eu;
    proxy_set_header Host rescuemanager.eu;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }

  # Proxy endpoint version/check a Vercel
  location /api/version/check {
    proxy_pass https://rescuemanager.eu;
    proxy_set_header Host rescuemanager.eu;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }

  # Tutti gli altri endpoint RENTRI vanno al gateway RENTRI (come prima)
  location / {
    proxy_pass https://demoapi.rentri.gov.it$request_uri;
    proxy_set_header Host demoapi.rentri.gov.it;
    # ... configurazione mTLS esistente ...
  }
}
```

### Step 2: Testare Configurazione

```bash
ssh -i ~/.ssh/vps-sdi root@217.154.118.37

# Verifica configurazione
nginx -t

# Ricarica Nginx
systemctl reload nginx

# Test endpoint
curl -k https://rentri-test.rescuemanager.eu/api/rentri/fir/trasmetti
```

### Step 3: Aggiornare Desktop App

Riportare gli URL a `rentri-test.rescuemanager.eu` invece di `rescuemanager.eu`:

```javascript
// Tutti gli endpoint ora passano attraverso VPS (che fa proxy a Vercel)
const apiUrl = import.meta.env.VITE_RENTRI_API_URL || 'https://rentri-test.rescuemanager.eu/api/rentri';
```

---

## 📊 IMPATTO COSTI

### Prima (Endpoint diretti a Vercel)
- **Edge Requests**: Tutte le richieste vanno direttamente a Vercel
- **Costi**: Massimi

### Dopo (Proxy VPS → Vercel)
- **Edge Requests**: Le richieste passano attraverso VPS
- **Costi**: Ridotti (Vercel vede solo il VPS come client, non tutti i client desktop)
- **Nota**: Vercel conta ancora le richieste, ma da un singolo IP (VPS)

### Ideale (Server Express sul VPS)
- **Edge Requests**: Zero per questi endpoint
- **Costi**: Minimi

---

## 🎯 PROSSIMI PASSI

1. **Immediato** (5 minuti):
   - Configurare proxy Nginx sul VPS
   - Testare endpoint
   - Aggiornare desktop app per usare `rentri-test.rescuemanager.eu`

2. **Breve termine** (1-2 ore):
   - Creare server Express sul VPS
   - Copiare logica endpoint da Vercel
   - Testare e deployare

3. **Lungo termine**:
   - Migrare gradualmente tutti gli endpoint sul VPS
   - Rimuovere dipendenze da Vercel per RENTRI

---

## 🔐 Accesso VPS

- **IP**: 217.154.118.37
- **SSH Key**: `vps-sdi` (salvata in `~/.ssh/vps-sdi`)
- **Comando**: `ssh -i ~/.ssh/vps-sdi root@217.154.118.37`
- **Nginx Config**: `/etc/nginx/sites-available/rentri`

---

## ⚠️ NOTA IMPORTANTE

Anche con il proxy Nginx, Vercel conta ancora le richieste. Per eliminare completamente i costi, bisogna creare un server Express sul VPS che gestisce questi endpoint senza chiamare Vercel.
