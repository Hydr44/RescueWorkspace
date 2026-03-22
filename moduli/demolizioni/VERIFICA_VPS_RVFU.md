# 🔍 Verifica Configurazione VPS per RVFU

**Data:** 19 gennaio 2026  
**Problema:** CDSSO non funziona, errore "Script failed to execute"

---

## 🔍 Verifiche da Fare

### 1. Verifica Connessione VPS

```bash
# Test connessione SSH
ssh root@217.154.118.37

# Se non funziona, verifica:
# - Chiave SSH configurata
# - Firewall permette connessioni SSH
# - IP VPS corretto: 217.154.118.37
```

### 2. Verifica Configurazione Nginx per RVFU Proxy

```bash
# SSH sulla VPS
ssh root@217.154.118.37

# Verifica se esiste configurazione rvfu-proxy
ls -la /etc/nginx/sites-available/ | grep rvfu
ls -la /etc/nginx/sites-enabled/ | grep rvfu

# Se non esiste, creala:
cat > /etc/nginx/sites-available/rvfu-proxy << 'EOF'
server {
    listen 80;
    server_name rvfu.rescuemanager.eu;

    location / {
        proxy_pass https://formazione.ilportaledeltrasporto.it;
        proxy_http_version 1.1;
        proxy_set_header Host formazione.ilportaledeltrasporto.it;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        proxy_buffering off;
        
        # Importante per CDSSO: passa tutti i cookie
        proxy_cookie_path / /;
        proxy_set_header Cookie $http_cookie;
    }
}
EOF

# Abilita sito
ln -sf /etc/nginx/sites-available/rvfu-proxy /etc/nginx/sites-enabled/

# Verifica configurazione
nginx -t

# Ricarica Nginx
systemctl reload nginx
```

### 3. Verifica DNS

```bash
# Verifica che il DNS punti alla VPS
dig rvfu.rescuemanager.eu
# Dovrebbe restituire: 217.154.118.37

# Se non è configurato, aggiungi record A:
# rvfu.rescuemanager.eu → 217.154.118.37
```

### 4. Verifica VPN sulla VPS

```bash
# SSH sulla VPS
ssh root@217.154.118.37

# Verifica connessione VPN (se necessario)
ping formazione.ilportaledeltrasporto.it

# Verifica che la VPS possa raggiungere i server RVFU
curl -I https://formazione.ilportaledeltrasporto.it
```

### 5. Test Proxy VPS

```bash
# Dalla VPS, testa il proxy
curl -X GET "http://localhost/demolitori-aci-ws/rest/concessionario/veicolo?causale=DEMOLIZIONE&tipoVeicolo=A&targa=VA054AJ" \
  -H "Authorization: Bearer YOUR_ID_TOKEN"

# Dalla tua macchina, testa il proxy pubblico
curl -X GET "http://rvfu.rescuemanager.eu/demolitori-aci-ws/rest/concessionario/veicolo?causale=DEMOLIZIONE&tipoVeicolo=A&targa=VA054AJ" \
  -H "Authorization: Bearer YOUR_ID_TOKEN"
```

---

## 📋 Configurazione Frontend

Se il proxy VPS è configurato, abilitalo nel frontend:

```bash
# .env
VITE_RVFU_USE_PROXY=true
VITE_RVFU_PROXY_URL=http://rvfu.rescuemanager.eu
```

---

## 🚨 Se il Proxy Non Esiste

Se il proxy VPS non è configurato, devi:

1. **Configurare Nginx** (vedi sopra)
2. **Configurare DNS** (record A per rvfu.rescuemanager.eu)
3. **Abilitare proxy nel frontend** (variabili ambiente)

---

**Status:** ⚠️ Da verificare configurazione VPS
