# 🧪 Test Proxy RVFU

## ✅ Pre-requisiti Verificati

- ✅ Proxy server online su `https://rvfu.rescuemanager.eu`
- ✅ Health check funzionante
- ✅ SSL configurato correttamente

## 📝 Configurazione Necessaria

Aggiungi al file `.env` (o crealo se non esiste):

```bash
# Abilita uso del proxy server per gestione CDSSO automatica
VITE_RVFU_USE_PROXY=true
VITE_RVFU_PROXY_URL=https://rvfu.rescuemanager.eu
```

## 🚀 Avvio App

```bash
cd desktop-app/greeting-friend-api-main
npm run dev
```

## 🧪 Test da Eseguire

### 1. Verifica Configurazione Proxy

Apri la console del browser (F12) e verifica che nei log appaia:
```
[RVFU Client] Request via Proxy: { ... }
```

Invece di:
```
[RVFU Client] Request via BrowserWindow: { ... }
```

### 2. Test Ricerca Veicolo

1. Vai alla pagina **Demolizioni RVFU**
2. Clicca su **"Riempi Dati Test"** (se presente)
3. Clicca su **"Cerca Veicolo"**
4. Verifica nei log:
   - `[RVFU Client] Request via Proxy:` deve apparire
   - La risposta deve essere JSON (non HTML)
   - Nessun errore CDSSO

### 3. Verifica Logs Proxy

Su VPS:
```bash
ssh root@217.154.118.37
pm2 logs rvfu-proxy --lines 50
```

Dovresti vedere:
- `[SessionManager] Inizializzazione browser...`
- `[SessionManager] 📤 GET https://formazione.ilportaledeltrasporto.it/...`
- Se CDSSO necessario: `[SessionManager] 🔐 CDSSO richiesto, gestione automatica...`

## ✅ Cosa Aspettarsi

### ✅ Successo
- Risposta JSON con dati del veicolo
- Nessun errore CDSSO
- Logs mostrano chiamata via proxy
- SessionManager gestisce automaticamente CDSSO se necessario

### ❌ Problemi Possibili

**Errore: "Proxy URL non configurato"**
- Verifica che `VITE_RVFU_USE_PROXY=true` nel `.env`
- Riavvia l'app dopo aver modificato `.env`

**Errore: "Proxy request failed: 500"**
- Verifica che il proxy sia online: `curl https://rvfu.rescuemanager.eu/health`
- Controlla logs del proxy: `pm2 logs rvfu-proxy`

**Ancora riceve HTML invece di JSON**
- Verifica che la VPN ACI sia attiva sulla VPS
- Controlla logs del proxy per vedere se CDSSO viene gestito
- Verifica che Puppeteer possa accedere alle pagine RVFU

## 📊 Monitoraggio

### Desktop App Console
- Cerca `[RVFU Client] Request via Proxy:`
- Verifica che non ci siano errori CDSSO

### Proxy Logs
```bash
ssh root@217.154.118.37
pm2 logs rvfu-proxy --lines 100
```

### Health Check
```bash
curl https://rvfu.rescuemanager.eu/health
```

## 🎯 Test Completo

1. ✅ Login RVFU (dovrebbe funzionare normalmente)
2. ✅ Ricerca veicolo (deve usare proxy e restituire JSON)
3. ✅ Creazione VFU (se implementato)
4. ✅ Verifica che non ci siano più errori CDSSO

Buon test! 🚀


