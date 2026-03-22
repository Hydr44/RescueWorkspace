# 🔧 Fix Endpoint API SDI Status

**Problema:** Errore 503 - SSH non funziona su Vercel/serverless  
**Soluzione:** Cambiare approccio - usare HTTP diretto invece di SSH

---

## 🔍 Problema Identificato

L'endpoint `/api/sdi-sftp/status` nel website usa SSH per connettersi al VPS:
```typescript
const command = `ssh -o StrictHostKeyChecking=no -o ConnectTimeout=5 vps-sdi "curl -s http://localhost:3004/api/sdi-sftp/status"`;
```

**Problema:**
- Su Vercel/serverless non si può eseguire SSH
- Non si possono eseguire comandi shell
- L'ambiente è sandboxed

---

## ✅ Soluzione 1: Esporre Server VPS Pubblicamente (Consigliata)

### Opzione A: Cambiare bind a 0.0.0.0 (semplice ma meno sicuro)
- Modificare server VPS per ascoltare su `0.0.0.0:3004` invece di `127.0.0.1:3004`
- Configurare firewall per permettere accesso solo da Vercel IPs

### Opzione B: Usare Nginx Reverse Proxy (più sicuro)
- Configurare nginx per esporre `/api/sdi-sftp/status` pubblicamente
- Aggiungere autenticazione/token se necessario
- URL: `https://vps-domain.com/api/sdi-sftp/status`

---

## ✅ Soluzione 2: Webhook/Endpoint Pubblico Alternativo

Creare un endpoint separato sul VPS che:
- Accetta richieste HTTP pubbliche
- Ha autenticazione token-based
- Esposto su una porta pubblica (es. 8080) o via nginx

---

## 📝 Prossimi Passi

1. **Decidere approccio:**
   - Esporre porta 3004 pubblicamente (semplice)
   - Usare nginx reverse proxy (più sicuro)

2. **Modificare endpoint website:**
   - Cambiare da SSH a HTTP fetch diretto
   - URL: `http://217.154.118.37:3004/api/sdi-sftp/status` (o dominio)

3. **Test e deploy**
