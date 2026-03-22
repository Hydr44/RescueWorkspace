# Segnalazione Tecnica ACI - Errore 403/401 API REST RVFU

## Ambiente
- **Ambiente**: Formazione
- **Utente test**: DETO003001 (profilo Centro di Raccolta)
- **Client ID Software House**: AUTODEM.RESCUEMANAGER
- **Redirect URI**: https://localhost/
- **Endpoint chiamato**: `GET /demolitori-aci-ws/rest/cr/veicolo?causale=DEMOLIZIONE&tipoVeicolo=A&targa=VA054AJ`
- **URL completo**: `https://formazione.ilportaledeltrasporto.it/demolitori-aci-ws/rest/cr/veicolo?causale=DEMOLIZIONE&tipoVeicolo=A&targa=VA054AJ`

## Login OAuth - FUNZIONA CORRETTAMENTE ✅

Il flusso di autenticazione secondo le specifiche (sezione 5.3) funziona perfettamente:

1. **POST /sso/json/authenticate** → `tokenId` ricevuto ✅
2. **POST /sso/oauth2/authorize** con `iPlanetDirectoryPro` cookie + `client_id=AUTODEM.RESCUEMANAGER` → `authorization code` ricevuto ✅
3. **POST /sso/oauth2/access_token** con `code` + `client_id` + `client_secret` → `id_token` + `access_token` + `refresh_token` ricevuti ✅

## Problema 1: Errore 401 "invalid_client" per formazioneAgent

### Descrizione
Quando si chiama l'API REST con `Authorization: Bearer <id_token>` e il cookie `iPlanetDirectoryPro`, il Web Agent ForgeRock su `formazione.ilportaledeltrasporto.it` redirige la richiesta al CDSSO con `client_id=formazioneAgent`. Il SSO risponde con:

```
error: {
    description: "Client authentication failed",
    message: "invalid_client"
}
```

### URL del redirect CDSSO
```
https://ssoformazione.ilportaledeltrasporto.it/sso/oauth2/authorize?
  state=...&
  nonce=...&
  response_mode=form_post&
  redirect_uri=http://formazione.ilportaledeltrasporto.it:80/agent/cdsso-oauth2&
  response_type=id_token&
  scope=openid&
  client_id=formazioneAgent&
  agent_provider=true&
  agent_realm=/
```

### Analisi
Il client `formazioneAgent` (utilizzato dal Web Agent ForgeRock per il CDSSO) sembra non essere configurato correttamente nel SSO di formazione. Questo impedisce il completamento del flusso CDSSO.

## Problema 2: Errore 403 Forbidden dopo CDSSO completato

### Descrizione
Quando il CDSSO viene completato tramite navigazione browser (BrowserWindow), il cookie `am-auth-jwt` viene impostato correttamente con `aud: formazioneAgent`. Tuttavia, la richiesta successiva all'API REST restituisce 403 Forbidden da Apache:

```html
<!DOCTYPE HTML PUBLIC "-//IETF//DTD HTML 2.0//EN">
<html><head>
<title>403 Forbidden</title>
</head><body>
<h1>Forbidden</h1>
<p>You don't have permission to access this resource.</p>
</body></html>
```

### Analisi
Il 403 viene da Apache (Content-Type: `text/html; charset=iso-8859-1`), NON dal backend Java (che restituirebbe `application/json` con server `JBoss-EAP/7`). Questo suggerisce che il Web Agent ForgeRock blocca la richiesta anche dopo CDSSO completato.

## Domande per ACI

1. **Il client `formazioneAgent` è configurato correttamente nel SSO di formazione?** L'errore `invalid_client` suggerisce un problema di configurazione.

2. **L'utente DETO003001 è autorizzato ad accedere al path `/demolitori-aci-ws/rest/cr/veicolo`?** Il 403 dopo CDSSO completato suggerisce una policy mancante nel Web Agent.

3. **Come devono essere chiamate le API REST da una Software House?** Le specifiche (sezione 5.3 punto 7) dicono `Authorization: Bearer <id_token>`, ma il Web Agent intercetta la richiesta e avvia il CDSSO. Le API REST sono accessibili solo tramite CDSSO o anche con Bearer token diretto?

4. **Esiste un URL alternativo per le API REST che non passa dal Web Agent?** Ad esempio `gestione-veicolo-fuoriuso-tst.serviziaci.it:80` (come indicato nel JSON OpenAPI) è raggiungibile?

## Cookie e Token disponibili al momento della richiesta

- **iPlanetDirectoryPro**: ✅ presente (114 char, dominio `.ilportaledeltrasporto.it`)
- **am-auth-jwt**: ✅ presente dopo CDSSO (1229 char, aud: `formazioneAgent`)
- **id_token OAuth**: ✅ presente (1208 char, aud: `AUTODEM.RESCUEMANAGER`)
- **access_token OAuth**: ✅ presente (55 char, opaco)

## Configurazione Software House

- **ClientID**: AUTODEM.RESCUEMANAGER
- **Redirect URI**: https://localhost/
- **Scope**: openid profile
- **Response Type**: code (Authorization Code Flow)
- **Client Secret**: configurato

---
*Data: 18 Febbraio 2026*
*Software House: RescueManager (P.IVA 02166430856)*
