# Preparazione Chiamata ACI Sistemistico

> Data: 16 marzo 2026 — Documento di preparazione tecnica

---

## 1. Architettura del sistema (overview)

```
┌───────────────────────────────────────────────────────────────┐
│  App Desktop (Electron + React)                               │
│                                                               │
│  ┌─────────────────┐    IPC    ┌──────────────────────────┐  │
│  │  Renderer       │ ◄──────► │  Main Process (Node.js)  │  │
│  │  (React/UI)     │          │  electron/ipc-modules/   │  │
│  │                 │          │  rvfu.js                 │  │
│  │  RVFULogin.jsx  │          │                          │  │
│  │  DemolizioniRVFU│          │  BrowserWindow hidden    │  │
│  │  .jsx           │          │  (gestisce cookie SSO)   │  │
│  └─────────────────┘          └──────────────────────────┘  │
│           │                              │                    │
│    src/lib/rvfu-auth.ts          Electron net.request        │
│    src/lib/rvfu-client.ts        (bypass CORS, VPN)          │
└───────────────────────────────────────────────────────────────┘
         │                              │
         ▼                              ▼
  ssoformazione.il...      formazione.il...
  /sso/json/authenticate   /rvfu/sh/cr/veicolo
  /sso/oauth2/authorize    /rvfu/sh/cr/VFU
  /sso/oauth2/access_token /rvfu/sh/cr/consulta/VFU
                           ... (28 endpoint totali)
```

**Perché Electron?** L'app è desktop (non web), gira sul PC del demolitore. Electron permette di:
- Gestire i cookie di sessione SSO (VPN + cookie jar)
- Bypassare CORS (il browser web non può fare chiamate a `formazione.ilportaledeltrasporto.it` direttamente)
- Usare `net.request` del main process che ha accesso alla VPN

---

## 2. File chiave e cosa fanno

| File | Responsabilità |
|------|----------------|
| `src/lib/rvfu-auth.ts` | Classe `RVFUAuthService` — gestisce l'intero flusso OIDC (3 step) |
| `src/lib/rvfu-client.ts` | Classe `RVFUClient` — chiama gli endpoint API con Bearer token |
| `electron/ipc-modules/rvfu.js` | Handler IPC Electron — BrowserWindow, cookie management, intercettazione richieste |
| `src/components/rvfu/RVFULogin.jsx` | Componente UI login (form username/password) |
| `src/hooks/useRVFUAuth.ts` | Hook React che espone `login()`, `isLoading`, `error` |
| `src/pages/DemolizioniRVFU.jsx` | Pagina principale lista VFU |
| `src/pages/DemolizioneRVFUForm.jsx` | Form nuova demolizione (usa `verificaVeicolo`) |

---

## 3. Il flusso di login (OIDC Authorization Code Flow)

Basato su manuale ACI "SpecificheWS-GestioneDemolitori1.25.md" Sezione 5.3.

```
Utente inserisce username/password nel form RVFULogin.jsx
            │
            ▼
    useRVFUAuth.ts → chiama login()
            │
            ▼
    RVFUAuthService.authenticate()
            │
    ┌───────┴────────────────────────────────────────┐
    │                                                 │
    ▼  Step 1                                        │
  POST /sso/json/authenticate                        │
  Headers: X-OpenAM-Username: DETO003001             │
           X-OpenAM-Password: TEST.030               │
           Accept-API-Version: resource=2.0          │
  → Risposta HTTP 200: { "tokenId": "abc123..." }    │
            │                                        │
    ▼  Step 2                                        │
  POST /sso/oauth2/authorize                         │
  Cookie: iPlanetDirectoryPro=<tokenId>              │
  Body: scope=openid profile                         │
        response_type=code                           │
        client_id=AUTODEM.RESCUEMANAGER              │
        decision=allow                               │
        redirect_uri=https://localhost/              │
  → Risposta HTTP 302 Location: https://localhost/   │
    ?code=xyz789&state=rvfu_auth                     │
            │                                        │
    ▼  Step 3                                        │
  POST /sso/oauth2/access_token                      │
  Body: grant_type=authorization_code                │
        code=<authorization_code>                    │
        client_id=AUTODEM.RESCUEMANAGER              │
        client_secret=e3abea315f8d7acffca73941...    │
        redirect_uri=https://localhost/              │
  → Risposta HTTP 200:                               │
    { "id_token": "eyJ...", "access_token": "...",   │
      "refresh_token": "...", "expires_in": 3600 }   │
    └───────────────────────────────────────────────┘
            │
    Tokens salvati in sessionStorage del Renderer
    (chiave: "rvfu_tokens")
            │
            ▼
    Login completato ✅
```

**Punto importante:** Lo Step 2 usa una `BrowserWindow` Electron hidden che gestisce il redirect OAuth (`https://localhost/` non è un server reale — è solo la `redirect_uri` registrata con ACI). La finestra cattura il `code` dall'URL del redirect prima che cerchi di caricare `localhost`.

---

## 4. Il flusso di ricerca veicolo

```
Utente inserisce targa nel form DemolizioneRVFUForm.jsx
            │
            ▼
    RVFUClient.verificaVeicolo({ targa: "VA076AJ", tipoVeicolo: "A", causale: "D" })
            │
            ▼
    makeRequest("/cr/veicolo", { method: "GET", params: {...} })
            │
    costruisce URL: https://formazione.ilportaledeltrasporto.it/rvfu/sh/cr/veicolo
                    ?tipoVeicolo=A&targa=VA076AJ&causale=D
            │
    aggiunge Header: Authorization: Bearer <id_token>
                     Accept: application/json
            │
    ┌────────────────────────────────┐
    │ Prova IPC (window.api.rvfu.   │
    │ apiCallDirect)                │  ← percorso Electron (main process)
    │ → electron net.request        │
    │ → ha accesso alla VPN         │
    └────────────────────────────────┘
            │  se IPC non disponibile
            ▼
    fallback: fetch() diretto (renderer)
            │
            ▼
  ❌ Risposta 401 Unauthorized dal server ACI
     Set-Cookie: HTTP_SESSION_ATTR_TOKEN=;Max-Age=0
     Set-Cookie: HTTP_SESSIONITIPOACCESSO=;Max-Age=0
```

---

## 5. Struttura del JWT id_token ricevuto

```json
{
  "sub": "DETO003001",
  "aud": "AUTODEM.RESCUEMANAGER",
  "iss": "https://ssoformazione.ilportaledeltrasporto.it/sso/oauth2",
  "exp": 1741600000,
  "iat": 1741596400,
  "at_hash": "...",
  "nonce": "n1741596400"
}
```

- `sub` = soggetto autenticato (l'utente agenzia)
- `aud` = il nostro client ID (chi ha richiesto il token)
- `iss` = chi ha emesso il token (il server SSO ACI)

---

## 6. Il problema: perché 401?

**Cosa funziona:**
- ✅ Step 1 `/authenticate` → `tokenId` ottenuto (credenziali corrette)
- ✅ Step 2 `/authorize` → `authorization code` ottenuto
- ✅ Step 3 `/access_token` → `id_token` JWT ottenuto e valido
- ✅ Il token è valido (introspection conferma `active: true`)

**Cosa non funziona:**
- ❌ Step 4 `/rvfu/sh/cr/*` con `Authorization: Bearer <id_token>` → **HTTP 401**

**Evidenza chiave dai Set-Cookie del 401:**
```
Set-Cookie: HTTP_SESSION_ATTR_TOKEN=;Max-Age=0   ← VUOTO (dovrebbe = "DETO003001")
Set-Cookie: HTTP_SESSIONITIPOACCESSO=;Max-Age=0  ← VUOTO (dovrebbe = tipo accesso CR)
```

Quando funzionava con CDSSO (flusso browser), il server restituiva:
```
Set-Cookie: HTTP_SESSION_ATTR_TOKEN=DETO003001;Max-Age=300  ← con valore!
```

**Interpretazione:** Il reverse proxy Apache+ForgeRock su `/rvfu/sh/` non è configurato per validare Bearer token OAuth2 emessi per `AUTODEM.RESCUEMANAGER`. L'attributo `HTTP_SESSIONITIPOACCESSO` (tipo di accesso: es. "CR" per Centro di Raccolta) non viene mai popolato nel profilo DETO003001.

---

## 7. Architettura server ACI (come la vediamo)

```
Nostra richiesta HTTP
        │
        ▼
  formazione.ilportaledeltrasporto.it
        │
  ┌─────┴────────────────────────────────────────┐
  │              Reverse Proxy                    │
  │  /rvfu/       → redirect CDSSO (browser web) │
  │  /rvfu/sh/    → Apache + ForgeRock Agent      │ ← noi qui
  │                 Policy Engine                 │
  │                 Bearer token validation       │
  │                 (non configurato per noi)     │
  └──────────────────────────────────────────────┘
```

**`Server: Apache`** nell'header risposta — il 401 viene da Apache (il web container Java), non da nginx. Il template HTML `<center>nginx</center>` nel body è solo la pagina di errore personalizzata di Apache.

---

## 8. Credenziali e configurazione

| Parametro | Valore |
|-----------|--------|
| `client_id` | `AUTODEM.RESCUEMANAGER` |
| `client_secret` | `e3abea315f8d7acffca73941c6a0de2197068d15` |
| `username` (test) | `DETO003001` |
| `password` (test) | `TEST.030` |
| `redirect_uri` | `https://localhost/` |
| `scope` | `openid profile` |
| SSO formazione | `https://ssoformazione.ilportaledeltrasporto.it/sso` |
| API formazione | `https://formazione.ilportaledeltrasporto.it/rvfu/sh` |

---

## 9. Domande tecniche per i sistemisti ACI

### Domanda 1 — Policy ForgeRock
> Il path `/rvfu/sh/*` ha una **policy OAuth2 Resource Server** configurata per validare Bearer token con `aud=AUTODEM.RESCUEMANAGER`?

*Contesto: senza questa policy, il ForgeRock Agent ignora l'header Authorization Bearer e genera 401 immediato.*

### Domanda 2 — Attributo HTTP_SESSIONITIPOACCESSO
> L'attributo `HTTP_SESSIONITIPOACCESSO` è configurato nel **profilo LDAP** dell'utente `DETO003001`?

*Contesto: nei test, il cookie viene sempre azzerato (Max-Age=0). Con CDSSO funziona la sessione ma l'attributo tipo-accesso è sempre vuoto. Significa che il profilo non ha questo campo valorizzato, oppure che la policy non lo legge per chiamate API Bearer.*

### Domanda 3 — Log server
> Nei log Apache del **10/03/2026 11:01:13 UTC**, c'è una richiesta da noi? Se sì, che errore viene loggato?

*Contesto: vogliamo sapere se il server vede la richiesta o se viene respinta prima (dal proxy/firewall).*

### Domanda 4 — JWT Bearer profile
> È abilitato il **JWT Bearer profile** per il client `AUTODEM.RESCUEMANAGER` nel tenant ForgeRock?

*Contesto: ForgeRock ha un profilo specifico per validare JWT Bearer token. Se non è attivato, tutti i Bearer token vengono rifiutati indipendentemente dalla policy.*

### Domanda 5 — Test diretto
> Possono eseguire un test **direttamente sui loro sistemi** usando il nostro token JWT (che vi forniamo in tempo reale durante la chiamata) per verificare se il problema è nel gateway o nel profilo utente?

---

## 10. Script da eseguire durante la chiamata

```bash
bash /tmp/debug-rvfu-chiamata-aci.sh
```

Lo script:
1. Esegue il flusso OIDC completo in tempo reale con timestamp precisi
2. Si ferma ad ogni step aspettando INVIO (puoi commentare live)
3. Mostra i JWT decodificati, gli header di risposta, i cookie
4. Fa l'introspection del token sul server SSO
5. Confronta le risposte con/senza token per evidenziare il comportamento

---

## 11. Cosa NON è il problema (già escluso)

- ❌ **Credenziali sbagliate** — il flusso OIDC completo funziona (3 step OK)
- ❌ **VPN** — le chiamate SSO arrivano e rispondono correttamente
- ❌ **CORS** — l'app è Electron, non browser web
- ❌ **Endpoint sbagliato** — `/rvfu/sh/` confermato da ACI Informatica il 26/02
- ❌ **Token scaduto** — introspection conferma `active: true`
- ❌ **Singolo endpoint** — il 401 è identico su tutti i 28 endpoint `/rvfu/sh/*`
- ❌ **Post-riavvio pod** — comportamento identico prima e dopo (09/03 vs 10/03)
