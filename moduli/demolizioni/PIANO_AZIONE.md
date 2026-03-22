# 📋 Piano d'Azione - Problema API REST RVFU

## Situazione Attuale

✅ **Codice Corretto**: L'implementazione è conforme al manuale ACI/MIT
- ✅ Usa `accessToken` (non `idToken`) per le API REST
- ✅ Header `Authorization: Bearer <access_token>`
- ✅ URL base corretto (`https://formazione.ilportaledeltrasporto.it`)
- ✅ Endpoint corretti (`/demolitori-aci-ws/rest/...`)

❌ **Problema**: Il server restituisce HTML "Submit This Form" invece di JSON
- Form HTML ha action `/agent/cdsso-oauth2`
- Indica problema di autenticazione/configurazione lato server

## Opzioni

### 1. 📞 Contattare ACI/MIT (CONSIGLIATO)

**Cosa chiedere:**
- Le API REST richiedono cookie di sessione SSO oltre al Bearer token?
- L'`accessToken` OAuth è valido per le API REST o serve un token diverso?
- Il client OAuth `AUTODEM.RESCUEMANAGER` è configurato per accedere alle API REST?
- C'è una configurazione mancante o un passo aggiuntivo necessario?

**Email template:**
```
Oggetto: Problema autenticazione API REST RVFU - Client AUTODEM.RESCUEMANAGER

Gentile supporto ACI/MIT,

Stiamo integrando le API REST RVFU e abbiamo completato il flusso OAuth/OIDC 
secondo il manuale SpecificheWS-GestioneDemolitori1.24.

Abbiamo ottenuto correttamente:
- access_token (Bearer token)
- id_token
- refresh_token

Tuttavia, quando chiamiamo le API REST (es. GET /demolitori-aci-ws/rest/concessionario/consulta/VFU)
con header Authorization: Bearer <access_token>, il server restituisce HTML 
"Submit This Form" con action /agent/cdsso-oauth2 invece di JSON.

Potreste verificare:
1. Se il client OAuth AUTODEM.RESCUEMANAGER è configurato per accedere alle API REST?
2. Se è necessario qualche passo aggiuntivo o configurazione?
3. Se le API REST richiedono cookie di sessione SSO oltre al Bearer token?

Grazie,
[Nome]
```

### 2. 🔍 Test Manuale con curl

Prova a fare una chiamata manuale per vedere la risposta esatta:

```bash
# Dopo aver fatto login e ottenuto l'accessToken
ACCESS_TOKEN="il_tuo_access_token_qui"

curl -v -H "Authorization: Bearer $ACCESS_TOKEN" \
     -H "Accept: application/json" \
     "https://formazione.ilportaledeltrasporto.it/demolitori-aci-ws/rest/concessionario/consulta/VFU?pageNumber=0&pageSize=10&paged=true"
```

Questo ti mostrerà:
- Headers di risposta
- Status code esatto
- Contenuto completo della risposta HTML

### 3. 🔄 Provare URL Interno

Se la VPN è attiva, prova temporaneamente con l'URL interno:

```typescript
const baseUrl = 'http://gestione-veicolo-fuoriuso-tst.serviziaci.it';
```

**Nota**: Questo richiede modificare temporaneamente il codice in `rvfu-client.ts` per test.

### 4. ⏸️ Usare Solo Supabase per Ora

Finché il problema non è risolto, l'app usa già il fallback a Supabase:
- ✅ Le funzionalità locali continuano a funzionare
- ✅ I dati vengono salvati in Supabase
- ❌ La sincronizzazione con RVFU è disabilitata

## Raccomandazione

**Fai subito l'opzione 2 (test manuale)** per avere più informazioni, poi **contatta ACI/MIT (opzione 1)** con i dettagli del test.

Nel frattempo, l'app continua a funzionare con Supabase come backend.

