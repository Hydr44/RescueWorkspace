# Riepilogo Problema CDSSO

## Situazione Attuale

1. ✅ **Login OAuth funziona**: Il flusso OAuth è completo e i token vengono ricevuti correttamente
2. ✅ **Cookie SSO disponibili**: Il cookie `iPlanetDirectoryPro` è presente nella sessione Electron condivisa
3. ❌ **API REST falliscono**: Le chiamate API REST restituiscono HTML invece di JSON

## Problema CDSSO

Il server RVFU utilizza un meccanismo **CDSSO (Cross-Domain Single Sign-On)** che:
- Richiede una sessione attiva nel browser
- Non accetta solo il Bearer token nell'header `Authorization`
- Reindirizza a `/agent/cdsso-oauth2` quando la sessione non è attiva

## Risposta HTML dal Server

```
<!DOCTYPE html>
<form method="post" action="http://formazione.ilportaledeltrasporto.it:80/agent/cdsso-oauth2">
    <input type="hidden" name="id_token" value="...">
</form>
```

Questo indica che il server richiede:
1. Una sessione attiva nel browser
2. Un POST a `/agent/cdsso-oauth2` con l'`id_token`
3. Probabilmente la creazione di un cookie di sessione aggiuntivo

## Tentativi Falliti

1. ❌ Chiamate API dirette con Bearer token (idToken)
2. ❌ BrowserWindow con `about:blank` e cookie condivisi
3. ❌ BrowserWindow persistente con pagina SSO (reindirizza a login)

## Prossimi Passi

1. **Caricare pagina SSO nella finestra persistente** per stabilire una sessione attiva
2. **Verificare se il listener console-message intercetta correttamente** le risposte (controllare log Terminale)
3. **Contattare ACI/MIT** per confermare che il meccanismo CDSSO è richiesto per le API REST
4. **Alternative**: Usare un server proxy (VPS) che mantiene una sessione attiva

