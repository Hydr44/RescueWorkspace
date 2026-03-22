# Email per ACI/MIT - Supporto Integrazione API REST RVFU

---

**Oggetto**: [RescueManager - RIC-001] Richiesta supporto integrazione API REST RVFU - Problema 403 Forbidden

---

Gentile team ACI/MIT,

 Vi scrivo perché stiamo integrando le API REST del sistema RVFU nella nostra applicazione desktop e, nonostante il login OAuth2 funzioni correttamente, stiamo riscontrando un problema con le chiamate alle API che ci sta bloccando.

## Situazione attuale

Abbiamo implementato il flusso di autenticazione OAuth2/OIDC secondo le specifiche fornite e il login funziona perfettamente. Riceviamo correttamente tutti i token (`access_token`, `id_token`, `refresh_token`) e riusciamo a gestire anche il CDSSO quando necessario.

Il problema si presenta quando proviamo a chiamare l'endpoint per la ricerca veicoli. Nonostante inviamo il Bearer Token corretto e tutti i cookie di sessione necessari, riceviamo sempre un errore **403 Forbidden** con il messaggio "You don't have permission to access this resource."

## Dettagli tecnici

Stiamo usando:
- **Client ID**: `AUTODEM.RESCUEMANAGER`
- **Endpoint chiamato**: `GET https://formazione.ilportaledeltrasporto.it/demolitori-aci-ws/rest/agenzia/consulta/VFU`
- **Utente**: `DETO003001`
- **Token**: Inviato come `Authorization: Bearer <id_token>` (abbiamo provato anche con `access_token`)

Nella richiesta includiamo:
- Header `Authorization: Bearer` con il token JWT
- Cookie di sessione (`iPlanetDirectoryPro`, `am-auth-jwt`, `agent-authn-tx-*`)
- Header `Accept: application/json`

Il token JWT che riceviamo ha `audience: 'formazioneAgent'` invece di `AUTODEM.RESCUEMANAGER`. Non siamo sicuri se questo sia normale o se indichi un problema di configurazione.

## Domande

Avremmo bisogno di alcune chiarimenti per procedere:

### 1. Permessi utente
L'utente `DETO003001` che stiamo usando ha i permessi necessari per accedere all'endpoint `/agenzia/consulta/VFU`? Potrebbe essere un problema di autorizzazione a livello utente o ruolo?

### 2. Endpoint corretto
Stiamo usando `/demolitori-aci-ws/rest/agenzia/consulta/VFU` per la ricerca veicoli. È l'endpoint corretto per questo tipo di operazione, oppure dovremmo usare un altro endpoint (ad esempio `/concessionario/veicolo` o altro)?

### 3. Token da usare
Abbiamo notato una discrepanza tra la documentazione: il manuale indica di usare `id_token` mentre lo standard OAuth2 suggerisce `access_token`. Quale dei due dobbiamo usare per le chiamate API REST?

### 4. Client ID e audience
Il token JWT che riceviamo ha `audience: 'formazioneAgent'` anche se facciamo login con `AUTODEM.RESCUEMANAGER`. È un comportamento normale? Il client ID `AUTODEM.RESCUEMANAGER` è autorizzato per le API REST su `formazione.ilportaledeltrasporto.it`?

### 5. URL corretto
Nella documentazione abbiamo trovato due URL diversi:
- `https://formazione.ilportaledeltrasporto.it/demolitori-aci-ws/rest` (dalla OpenAPI)
- `http://gestione-veicolo-fuoriuso-tst.serviziaci.it:80/demolitori-aci-ws/rest` (dal manuale)

Il secondo non risolve DNS. Quale è l'URL corretto per l'ambiente formazione?

### 6. CDSSO e cookie
Le API REST richiedono una sessione browser attiva (CDSSO) oltre al Bearer Token, oppure dovrebbero funzionare solo con il token? Abbiamo provato entrambi gli approcci ma il risultato è sempre 403.

## Cosa abbiamo già provato

Per completezza, vi elenco i test che abbiamo già effettuato senza successo:
- Chiamata con `access_token` (standard OAuth2)
- Chiamata con `id_token` (come indicato nel manuale)
- Chiamata con Bearer Token + cookie di sessione
- Chiamata dopo aver navigato la finestra browser per stabilire sessione CDSSO
- Verifica che il token abbia audience corretta

In tutti i casi riceviamo 403 Forbidden.

## Request e Response di esempio

Come richiesto, vi inviamo di seguito un esempio di request e response che stiamo ricevendo:

### Request inviata

```http
GET https://formazione.ilportaledeltrasporto.it/demolitori-aci-ws/rest/agenzia/consulta/VFU?causale=DEMOLIZIONE&targa=VA058AJ&tipoVeicolo=A HTTP/1.1
Host: formazione.ilportaledeltrasporto.it
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJraWQiOiIxTi9xbkgrUnJSZVk5V29pN00zRW02eDZ1S0E9IiwiYWxnIjoiUlMyNTYifQ.eyJzdWIiOiJERVRPMDAzMDAxIiwiYXVkaXRUcmFja2luZ0lkIjoiYWJiY2ExNWEtNjA5Yi00M2Q5LTlmYTYtMzM4MzdjMzRiNmNlLTk0ODA4NiIsImlzcyI6Imh0dHBzOi8vc3NvZm9ybWF6aW9uZS5pbHBvcnRhbGVkZWx0cmFzcG9ydG8uaXQvc3NvL29hdXRoMiIsInRva2VuTmFtZSI6ImlkX3Rva2VuIiwibm9uY2UiOiI4SThRUFNkR0lxcGY1TDVYIiwiYXVkIjoiZm9ybWF6aW9uZUFnZW50IiwiYWNyIjoiMCIsInNfaGFzaCI6Il9tSEp5UEQ2MWtreXB0c0J5WFdNQ1EiLCJhenAiOiJmb3JtYXppb25lQWdlbnQiLCJhdXRoX3RpbWUiOjE3NjkyMDg4NzEsImZvcmdlcm9jayI6eyJzc290b2tlbiI6Ijk3NTNhTzRjbmRwdVphb1BLcDVNSHZjTDVuay4qQUFKVFNRQUNNRElBQWxOTEFCeHVSVFZRTjBKMEwxSm1Wbk5VTkcxMVV6SjBlVmREVkZOWFJ6QTlBQVIwZVhCbEFBTkRWRk1BQWxNeEFBSXdNUS4uKiIsInN1aWQiOiJhYmJjYTE1YS02MDliLTQzZDktOWZhNi0zMzgzN2MzNGI2Y2UtOTQ4MDUzIn0sInJlYWxtIjoiLyIsImV4cCI6MTc2OTIxNjA4MCwidG9rZW5UeXBlIjoiSldUVG9rZW4iLCJpYXQiOjE3NjkyMDg4ODAsImFnZW50X3JlYWxtIjoiLyJ9.Lfq3FTk_dMQSQUhvtDsw9vyPJwmK-LiJ6ByOFDeOeUUMLR6qRwp9MfRBmczQmarYVftjDDus0tDvR5w9oBlKtkDzvjWPH2TUOseMNrWELhdKDuPOHTsqbhNs_OTVlmStuiv6FEAbAUpz3tIoGnVbCgComc5W1OmHFvzQf70pIw3x7cV9TqiGoEVP0Zzi-SI85iy1jCaNYkhATxY-GSQ7ZjknjsVDPYwDQ3Yxk5ocM7ty-THKLL3Z9JhUs6dMneCaIGvG_o5OMtTIzN9qYi-i2gbEG_OYcxTYdXpDeRKQJSC0BITyA3kBC5DQnRATiLnt6lbJNbL9KFLOaBWTitCXHw
Accept: application/json, text/json, */*
Accept-Language: it
Cookie: GUEST_LANGUAGE_ID=it_IT; iPlanetDirectoryPro=9753aO4cndpuZaoPKp5MHvcL5nk.*AAJTSQACMDIAAlNLABxuRTVQN0J0L1JmVnNUNG11UzJ0eVdDVFNXRzA9AAR0eXBlAANDVFMAAlMxAAIwMQ..*; agent-authn-tx-50HEf6DALggkXADNQjTeJCfmRqM=eAEVjk0LgkAUAP/LO3iS1qIsFySECvqUoDx0iZduurTtk/UpUfTfs+MMc5gPtM6AhIq5lkLcyT3xrcmqgTY1OUajCmXYYfMnGmiWs0Bgqexbo8jJNq1hFNnqPM+xbfo8Xiz36W59WaeHpcfoSoyzJJjMko3HuqZM6ZwMxQn48OSqADn0oSpcA/Lz9UG96t5Mw2gURMNp5IMlm6t+8NR1ZdjdTsftapwuHlf4/gAj1D6N; am-auth-jwt=eyJ0eXAiOiJKV1QiLCJraWQiOiIxTi9xbkgrUnJSZVk5V29pN00zRW02eDZ1S0E9IiwiYWxnIjoiUlMyNTYifQ.eyJzdWIiOiJERVRPMDAzMDAxIiwiYXVkaXRUcmFja2luZ0lkIjoiYWJiY2ExNWEtNjA5Yi00M2Q5LTlmYTYtMzM4MzdjMzRiNmNlLTk0ODA4NiIsImlzcyI6Imh0dHBzOi8vc3NvZm9ybWF6aW9uZS5pbHBvcnRhbGVkZWx0cmFzcG9ydG8uaXQvc3NvL29hdXRoMiIsInRva2VuTmFtZSI6ImlkX3Rva2VuIiwibm9uY2UiOiI4SThRUFNkR0lxcGY1TDVYIiwiYXVkIjoiZm9ybWF6aW9uZUFnZW50IiwiYWNyIjoiMCIsInNfaGFzaCI6Il9tSEp5UEQ2MWtreXB0c0J5WFdNQ1EiLCJhenAiOiJmb3JtYXppb25lQWdlbnQiLCJhdXRoX3RpbWUiOjE3NjkyMDg4NzEsImZvcmdlcm9jayI6eyJzc290b2tlbiI6Ijk3NTNhTzRjbmRwdVphb1BLcDVNSHZjTDVuay4qQUFKVFNRQUNNRElBQWxOTEFCeHVSVFZRTjBKMEwxSm1Wbk5VTkcxMVV6SjBlVmREVkZOWFJ6QTlBQVIwZVhCbEFBTkRWRk1BQWxNeEFBSXdNUS4uKiIsInN1aWQiOiJhYmJjYTE1YS02MDliLTQzZDktOWZhNi0zMzgzN2MzNGI2Y2UtOTQ4MDUzIn0sInJlYWxtIjoiLyIsImV4cCI6MTc2OTIxNjA4MCwidG9rZW5UeXBlIjoiSldUVG9rZW4iLCJpYXQiOjE3NjkyMDg4ODAsImFnZW50X3JlYWxtIjoiLyJ9.Lfq3FTk_dMQSQUhvtDsw9vyPJwmK-LiJ6ByOFDeOeUUMLR6qRwp9MfRBmczQmarYVftjDDus0tDvR5w9oBlKtkDzvjWPH2TUOseMNrWELhdKDuPOHTsqbhNs_OTVlmStuiv6FEAbAUpz3tIoGnVbCgComc5W1OmHFvzQf70pIw3x7cV9TqiGoEVP0Zzi-SI85iy1jCaNYkhATxY-GSQ7ZjknjsVDPYwDQ3Yxk5ocM7ty-THKLL3Z9JhUs6dMneCaIGvG_o5OMtTIzN9qYi-i2gbEG_OYcxTYdXpDeRKQJSC0BITyA3kBC5DQnRATiLnt6lbJNbL9KFLOaBWTitCXHw
User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36
X-Requested-With: XMLHttpRequest
```

**Note sulla request**:
- Il token JWT nell'header `Authorization` ha `audience: 'formazioneAgent'` (decodificato dal payload)
- Includiamo tutti i cookie di sessione ricevuti dopo il login
- L'endpoint è quello indicato nella documentazione OpenAPI

### Response ricevuta

```http
HTTP/1.1 403 Forbidden
Content-Type: text/html; charset=iso-8859-1
Content-Length: 199
Date: Fri, 23 Jan 2026 12:00:00 GMT
Server: Apache
Strict-Transport-Security: max-age=3600
X-Permitted-Cross-Domain-Policies: none

Forbidden

You don't have permission to access this resource.
```

**Note sulla response**:
- Status code: `403 Forbidden` (non `401 Unauthorized`, quindi l'autenticazione sembra passare)
- Content-Type: `text/html` (non JSON, quindi non è una risposta API)
- Nessun header `WWW-Authenticate` o altri dettagli sull'errore

### Informazioni aggiuntive

**Token JWT decodificato** (payload, per riferimento):
```json
{
  "sub": "DETO003001",
  "aud": "formazioneAgent",
  "iss": "https://ssoformazione.ilportaledeltrasporto.it/sso/oauth2",
  "tokenName": "id_token",
  "exp": 1769216080,
  "iat": 1769208880,
  "agent_realm": "/"
}
```

**Configurazione OAuth2**:
- Client ID: `AUTODEM.RESCUEMANAGER`
- Redirect URI: `https://localhost/`
- Scope richiesti: `openid profile`
- Ambiente: `formazione`

Saremmo molto grati se poteste aiutarci a capire cosa ci manca o se c'è qualche configurazione aggiuntiva necessaria che non abbiamo considerato.

Resto in attesa di un vostro riscontro e resto disponibile per qualsiasi chiarimento aggiuntivo.

Cordiali saluti,

Emmanuel Scozzarini  
RescueManager
info@rescuemanager.eu

---

**Note per l'invio**:
- Sostituisci `[Il tuo nome]`, `[La tua azienda]`, `[Contatti]` con i tuoi dati reali
- Se hai un contatto specifico in ACI/MIT, personalizza il saluto iniziale
- Puoi aggiungere eventuali dettagli specifici del tuo caso
