# 📋 Riepilogo Test Connettività RVFU

## 🔐 Configurazione VPN

**Gateway VPN**: `ilportaledellautomobilista.it/utentiMCTC`

**Importante**: Connettiti alla VPN tramite questo gateway prima di testare gli endpoint.

## 🧪 Metodi di Test Disponibili

### 1. Test HTML (Consigliato per Browser/Electron)
File: `test-rvfu-from-browser.html`

**Come usare:**
1. Connettiti alla VPN ACI
2. Apri il file `test-rvfu-from-browser.html` in un browser o nell'app Electron
3. Esegui i test interattivi:
   - Test Base URL
   - Test Endpoint Monitoraggio (non richiede auth)
   - Test Autenticazione SSO
   - Test OAuth2

**Vantaggi:**
- Funziona nel contesto browser/Electron dove la VPN è attiva
- Test interattivi con risultati visibili
- Supporta test di autenticazione

### 2. Test Node.js CLI
File: `test-rvfu-connection.js`

**Come usare:**
```bash
cd moduli/demolizioni
node test-rvfu-connection.js
```

**Nota**: Questo test potrebbe fallire se la VPN funziona solo a livello browser/Electron e non per processi CLI.

### 3. Test dall'App Desktop
1. Apri l'app RescueManager
2. Vai a **Demolizioni → RVFU**
3. Prova il login RVFU
4. Apri DevTools (Cmd+Option+I / Ctrl+Shift+I)
5. Controlla la tab **Network** per vedere le richieste

## 🌐 Endpoint da Testare

### Ambiente Formation (Test)
- **Base URL**: `http://gestione-veicolo-fuoriuso-tst.serviziaci.it:80`
- **Status Monitor**: `http://gestione-veicolo-fuoriuso-tst.serviziaci.it:80/demolitori-aci-ws/mon/status/up`
- **SSO Authenticate**: `http://gestione-veicolo-fuoriuso-tst.serviziaci.it:80/sso/json/authenticate`
- **OAuth2 Authorize**: `http://gestione-veicolo-fuoriuso-tst.serviziaci.it:80/oauth2/authorize`

### Ambiente Production
- **Base URL**: `http://gestione-veicolo-fuoriuso.serviziaci.it:80`

## ⚠️ Nota Importante: HTTP vs HTTPS

**Nel codice esistono discrepanze:**

1. **File HTML documentazione** (`RVFU.html`): Usa **HTTP** sulla porta **80**
2. **rvfu-auth.ts** e **rvfu-client.ts**: Usano **HTTPS** (porta 443)
3. **rvfu-api.ts**: Usa **HTTP** sulla porta **80**

**Raccomandazione:**
- Per l'ambiente di **formation/test**: Usare **HTTP** sulla porta **80** (come nella documentazione)
- Per l'ambiente di **production**: Verificare se è HTTP o HTTPS

Se i test falliscono con HTTPS, provare a cambiare a HTTP per l'ambiente di formazione.

## 📝 Credenziali

### Credenziali VPN
- **Matricola**: `swh.scorazzini`
- **Password**: `Vpn-2011` (da cambiare al primo accesso)

### Credenziali Software House
- **Codice Software House**: `AUTODEM.RESCUEMANAGER`
- **Codice di Sicurezza**: `R2Y2L9T2`

### Credenziali di Agenzia (per Header Request)
- **Matricola**: `DETO003001`
- **Password**: `TEST.030`

## 🔍 Debugging

### Se i test falliscono:

1. **Verifica VPN**: Assicurati di essere connesso a `ilportaledellautomobilista.it/utentiMCTC`
2. **Test Base URL**: Prova ad aprire `http://gestione-veicolo-fuoriuso-tst.serviziaci.it:80` nel browser
3. **Controlla CORS**: Se vedi errori CORS, potrebbe essere necessario configurare CORS lato server o disabilitare il controllo CORS nel browser per i test
4. **Console DevTools**: Controlla gli errori nella console per dettagli specifici
5. **Network Tab**: Verifica se le richieste vengono fatte e qual è la risposta del server

## ✅ Cosa Aspettarsi

### Test Base URL
- **Successo**: Status 200 o 302/301 (redirect)
- **Errore comune**: DNS non risolto → VPN non attiva

### Test Status Monitor
- **Successo**: Status 200 con JSON response
- **Errore comune**: 401/403 se richiede auth (ma questo endpoint non dovrebbe)

### Test SSO Authenticate
- **Successo**: Status 200 con cookie `iPlanetDirectoryPro`
- **Errore comune**: 401 se credenziali errate, 403 se non autorizzato

### Test OAuth2
- **Successo**: Status 302/307 con `Location` header contenente `code=...`
- **Errore comune**: 401 se non autenticato, 400 se parametri errati

