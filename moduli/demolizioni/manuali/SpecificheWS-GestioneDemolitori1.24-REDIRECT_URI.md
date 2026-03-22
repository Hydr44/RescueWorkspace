# SpecificheWS-GestioneDemolitori1.24 - Sezione redirect_uri

## Riferimento Manuale
**Documento**: SpecificheWS-GestioneDemolitori1.24.pdf  
**Versione**: 1.24  
**Data**: 03.02.2025

---

## 5.2 INFORMAZIONI DI INTEGRAZIONE

**Pagina**: 22 del PDF (circa riga 852 del testo)

Per procedere all'integrazione con la piattaforma IAM, la Software House dovrà condividere le seguenti informazioni:

| Nome | Descrizione | Note |
|------|-------------|------|
| **ClientID** | Nome del client | CodiceUtente di IdentificativoSoftwareHouse |
| **Client Secret** | Password del Client | PasswordUtente di IdentificativoSoftwareHouse |
| **Redirection URIs** | URL di redirect | **https://localhost/** |
| **Post Logout URIs** | URL di Post Logout | **https://localhost/** |
| AuthorizationCode LifeTime | Durata del Authorization Code | Il valore di default, se non specificato dal client è pari a 2 minuti |
| AccessToken LifeTime | Durata del Access Token | Il valore di default, se non specificato dal client è pari a 30 minuti |
| IDToken LifeTime | Durata del ID Token | Se non specificato dal client è pari a 4 ore |
| RefreshToken LifeTime | Durata del Refresh Token | Il valore di default, se non diversamente richiesto è pari a 2 giorni |

Il metodo di autenticazione utilizzato è `client_secret_post`.

**⚠️ NOTA IMPORTANTE**: Nella tabella delle informazioni di integrazione viene indicato `https://localhost/`, ma negli esempi curl del manuale viene utilizzato `http://localhost/` (vedi sezione 5.3.2).

---

## 5.3.2 AUTHORIZE

**Pagina**: 25 del PDF (circa riga 989 del testo)

La chiamata all'endpoint `/authorize` serve per ottenere l'authorization code, necessario per la prosecuzione del flusso. 

### Parametri necessari:

- **iPlanetDirectoryPro**: è il valore del Cookie ritornato dal servizio `/authenticate`.
- **scope**: è un valore fisso impostato a `"openid profile"`.
- **response_type**: è un valore fisso impostato a `"code"`.
- **client_id**: è l'identificativo univoco del client indicato nelle informazioni di integrazione.
- **csrf**: è il valore del Cookie ritornato dal servizio `/authenticate`.
- **redirect_uri**: è il valore di redirect indicato nelle informazioni di integrazione.
- **state**: è un valore fisso impostato a `"abc123"`.
- **nonce**: è un valore fisso impostato a `"123abc"`.
- **decision**: è un valore fisso impostato a `"allow"`.

### Tabella parametri di Input:

| Param | Tipologia | Valore |
|-------|-----------|--------|
| iPlanetDirectoryPro | Cookie | `<Valore del cookie tornato dalla chiamata /authenticate>` |
| scope | data | `openid profile` |
| response_type | data | `code` |
| client_id | data | `<ClientID della SoftwareHouse>` |
| csrf | data | `<Valore del cookie tornato dalla chiamata /authenticate>` |
| **redirect_uri** | data | **`<Redirection URI SoftwareHouse>`** |
| state | data | `abc123` |
| nonce | data | `123abc` |
| decision | data | `allow` |

### Esempio chiamata curl (AMBIENTE FORMAZIONE):

```bash
curl --dump-header - --request POST \
  --Cookie "iPlanetDirectoryPro=GcJUXdAjFcCFjYdnIVw8qM7clFU.*AAJTSQACMDIAAlNLABxNTFNZZGxRTUE4T2pETk5NWEp5SGRCTW5RV2M9AAR0eXBlAANDVFMAAlMxAAIwMQ..*" \
  --data "scope=openid profile" \
  --data "response_type=code" \
  --data "client_id=softwarehouse1" \
  --data "csrf=GcJUXdAjFcCFjYdnIVw8qM7clFU.*AAJTSQACMDIAAlNLABxNTFNZZGxRTUE4T2pETk5NWEp5SGRCTW5RV2M9AAR0eXBlAANDVFMAAlMxAAIwMQ..*" \
  --data "redirect_uri=http://localhost/" \
  --data "state=abc123" \
  --data "nonce=123abc" \
  --data "decision=allow" \
  https://ssoformazione.ilportaledeltrasporto.it/sso/oauth2/authorize
```

### Esempio di risposta:

```
<redirect url>?code=1AxzjSmuIkEG9MTF4wrff_5PpLs&iss=http%3A%2F%2Fssoformazione.ilportaledeltrasporto.it%2Fsso%2Foauth2&state=abc123&client_id=softwarehouse1
```

**🔍 OSSERVAZIONE CRITICA**: 
- Nel **parametro** viene usato: `--data "redirect_uri=http://localhost/"` (**HTTP, non HTTPS**)
- Ma nella **tabella 5.2** viene indicato: `https://localhost/` (**HTTPS**)

---

## 5.3.3 ACCESS TOKEN

**Pagina**: 26 del PDF (circa riga 1063 del testo)

### Parametri necessari:

- **grant_type**: valore fisso impostato a `"authorization_code"`.
- **code**: è l'authorization code ottenuto in precedenza dall'endpoint `/authorize`.
- **client_id**: è l'identificativo univoco del client della SoftwareHouse, definito nelle informazioni di integrazione.
- **client_secret**: è la password del client della SoftwareHouse, definito nelle informazioni di integrazione.
- **redirect_uri**: è il valore di redirect indicato nelle informazioni di integrazione.

### Esempio chiamata curl (AMBIENTE FORMAZIONE):

```bash
curl --request POST \
  --data "grant_type=authorization_code" \
  --data "code=R_rdi4dn0dTtOgDzLzVV83pACYw" \
  --data "client_id=softwarehouse1" \
  --data "client_secret=<Password>" \
  --data "redirect_uri=http://localhost/" \
  https://ssoformazione.ilportaledeltrasporto.it/sso/oauth2/access_token
```

**🔍 CONFERMA**: Anche qui viene usato `http://localhost/` (HTTP, non HTTPS).

---

## Riepilogo redirect_uri

### Nel manuale troviamo:

1. **Sezione 5.2 (Informazioni di Integrazione)** - Tabella:
   - **Redirection URIs**: `https://localhost/` ✅ (HTTPS)

2. **Sezione 5.3.2 (AUTHORIZE)** - Esempio curl:
   - **redirect_uri**: `http://localhost/` ✅ (HTTP)

3. **Sezione 5.3.3 (ACCESS TOKEN)** - Esempio curl:
   - **redirect_uri**: `http://localhost/` ✅ (HTTP)

### Conclusione

Esiste una **discrepanza** nel manuale:
- La **tabella informativa** (5.2) indica `https://localhost/`
- Gli **esempi pratici** (5.3.2 e 5.3.3) usano `http://localhost/`

**Gli esempi pratici sono più affidabili** perché mostrano il codice reale funzionante.

**Attualmente il codice implementa**: `http://localhost/` ✅ (come negli esempi curl)

**Il problema**: Il server SSO restituisce `redirect_uri_mismatch`, il che significa che il `redirect_uri` `http://localhost/` **NON è registrato** per il `client_id` `AUTODEM.RESCUEMANAGER` nell'ambiente di formazione.

**Azione richiesta**: Contattare ACI/MIT per:
1. Verificare quale `redirect_uri` è stato effettivamente registrato per `AUTODEM.RESCUEMANAGER`
2. Registrare `http://localhost/` se non presente
3. Verificare se è necessario registrare anche `https://localhost/`

