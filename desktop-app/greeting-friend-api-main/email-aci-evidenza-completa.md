# Email ACI — Problema accesso API RVFU

**Oggetto:** RVFU API - Login OK ma chiamate API restituiscono 401 - Request/Response allegati

---

Buongiorno,

vi scriviamo per segnalare che, nonostante il flusso di login OAuth funzioni correttamente (come da voi confermato nelle email precedenti con le credenziali fornite), **tutte le chiamate API successive restituiscono errore 401**.

Abbiamo testato con le credenziali che ci avete fornito:
- Username: `DETO000301`
- Password: `TEST.003`
- Client: `AUTODEM.RESCUEMANAGER`
- Client Secret: `e3abea315f8d7acffca73941c6a0de2197068d15`

## Cosa funziona

Il login OAuth (step 1-3) funziona perfettamente e otteniamo il token:
- ✅ Step 1 (authenticate): tokenId ottenuto
- ✅ Step 2 (authorize): code ottenuto
- ✅ Step 3 (access_token): id_token JWT ricevuto

## Cosa non funziona

Quando proviamo a chiamare qualsiasi endpoint API con il Bearer token ottenuto, riceviamo sempre **HTTP 401** da nginx.

## Esempio di chiamata che non funziona

Vi alleghiamo un esempio completo di **request e response** per l'endpoint `/cr/veicolo`:

### REQUEST
```bash
curl -X GET \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..." \
  -H "Accept: application/json" \
  "https://formazione.ilportaledeltrasporto.it/rvfu/sh/cr/veicolo?causale=DEMOLIZIONE&tipoVeicolo=A&targa=FN082XY"
```

### RESPONSE
```
HTTP/1.1 401 Authorization Required
Server: nginx
Date: Wed, 26 Feb 2026 21:30:15 GMT
Content-Type: text/html
Content-Length: 179

<html>
<head><title>401 Authorization Required</title></head>
<body>
<center><h1>401 Authorization Required</h1></center>
<hr><center>nginx</center>
</body>
</html>
```

**Nota importante:** La risposta è identica sia con il Bearer token che senza. Questo succede per **tutti gli endpoint** che abbiamo testato (veicolo, VFU, deleghe, utility, etc.).

## Cosa abbiamo verificato

Abbiamo testato 28 endpoint diversi su entrambi i path:
- `/rvfu/sh/...` → tutti restituiscono **401** (nginx)
- `/demolitori-aci-ws/rest/...` → tutti restituiscono **302** (redirect a SSO)

Tutti gli endpoint danno lo stesso risultato, quindi non sembra essere un problema di un singolo endpoint specifico.

## Cosa vi chiediamo

Potete verificare la configurazione per il client `AUTODEM.RESCUEMANAGER` sul path `/rvfu/sh/`? 

Se possibile, ci servirebbe un esempio di curl funzionante per una chiamata API qualsiasi (anche solo `/cr/causali` che è il più semplice), così possiamo vedere se ci manca qualcosa nella nostra richiesta.

In allegato trovate lo script bash completo con tutti i test effettuati, se volete riprodurre i risultati.

Grazie per il supporto.

Cordiali saluti
