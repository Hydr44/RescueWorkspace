# Test Connettività VPN RVFU

## 🔐 Configurazione VPN

**Gateway VPN**: `ilportaledellautomobilista.it/utentiMCTC`

Prima di testare gli endpoint RVFU, è necessario essere connessi alla VPN ACI tramite questo gateway.

## ⚠️ Risultato Test CLI

Lo script `test-rvfu-connection.js` non riesce a risolvere l'hostname `gestione-veicolo-fuoriuso-tst.serviziaci.it`.

**Errore:** `NXDOMAIN` - Il DNS non risolve l'hostname.

**Nota**: Questo è normale se la VPN funziona solo a livello browser/Electron e non per processi CLI.

### Possibili Cause

1. **VPN attiva solo per browser/Electron**: Alcune VPN (soprattutto quelle configurate a livello utente) funzionano solo per applicazioni GUI e non per processi CLI/Node.js.

2. **DNS non configurato correttamente**: La VPN potrebbe non aver configurato i server DNS necessari per risolvere i domini `serviziaci.it`.

3. **Routing VPN incompleto**: Il traffico potrebbe non essere instradato correttamente attraverso la VPN.

## ✅ Soluzione Consigliata: Test dall'App Desktop

Poiché la VPN potrebbe funzionare solo per Electron/browser, **testa direttamente dall'app desktop**:

### Passi per Testare dall'App:

1. **Apri l'app desktop** (RescueManager)
2. **Vai alla sezione Demolizioni RVFU**
3. **Prova il login RVFU** usando le credenziali:
   - Ambiente: **Formation** (test)
   - Credenziali VPN (se richieste): `swh.scorazzini` / `Vpn-2011`

4. **Verifica gli endpoint** attraverso la UI:
   - Il componente `RVFULogin.jsx` dovrebbe tentare la connessione
   - Controlla la console del browser/Electron per errori di rete

### Endpoint da Verificare

- **SSO Authenticate**: `http://gestione-veicolo-fuoriuso-tst.serviziaci.it:80/sso/json/authenticate`
- **Status Monitor**: `http://gestione-veicolo-fuoriuso-tst.serviziaci.it:80/demolitori-aci-ws/mon/status/up`
- **OAuth2 Authorize**: `http://gestione-veicolo-fuoriuso-tst.serviziaci.it:80/oauth2/authorize`

## 📝 Credenziali (dal file Leggimi)

### Credenziali VPN
- **Matricola**: `swh.scorazzini`
- **Password**: `Vpn-2011` (da cambiare al primo accesso)

### Credenziali Software House
- **Codice Software House**: `AUTODEM.RESCUEMANAGER`
- **Codice di Sicurezza**: `R2Y2L9T2`

### Credenziali di Agenzia (per Header Request)
- **Matricola**: `DETO003001`
- **Password**: `TEST.030`

## 🔍 Come Verificare se la VPN Funziona

### Opzione 1: Test HTML (Browser/Electron)
Apri il file `test-rvfu-from-browser.html` in un browser o nell'app Electron dopo aver connesso la VPN.
Questo file contiene test interattivi che funzionano nel contesto del browser.

### Opzione 2: Test dall'App Desktop
1. **Apri l'app desktop** (RescueManager)
2. **Apri DevTools** (Cmd+Option+I su Mac, Ctrl+Shift+I su Windows/Linux)
3. **Vai alla tab Network** e prova a:
   - Aprire `http://gestione-veicolo-fuoriuso-tst.serviziaci.it:80` in una nuova tab
   - Verificare se la pagina carica
4. **Console DevTools**: Controlla gli errori di rete nella console
5. **Network Tab**: Verifica se le richieste raggiungono gli endpoint o vengono bloccate

## 🛠️ Prossimi Passi

1. ✅ Testare dall'app desktop (Electron)
2. ✅ Verificare se il login RVFU funziona
3. ✅ Controllare i log nella console per errori specifici
4. ⚠️ Se necessario, configurare la VPN per consentire accesso a processi Node.js

