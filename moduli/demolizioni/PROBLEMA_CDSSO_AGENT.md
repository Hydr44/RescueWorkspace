# ⚠️ Problema CDSSO Agent - Server Restituisce HTML

## Problema

Il server restituisce HTML "Submit This Form" con action `/agent/cdsso-oauth2` invece di JSON quando si chiamano le API REST, anche quando si usa correttamente `accessToken` con `Bearer`.

## Analisi

### Log Mostrano:

1. **Prima chiamata** (subito dopo login):
   - Usa `idToken` invece di `accessToken`: `Bearer eyJ0eXAiOiJKV1QiLCJraWQ...` (JWT)
   - Problema di timing: chiamata fatta prima che token siano salvati

2. **Seconda chiamata** (ricerca veicolo):
   - Usa correttamente `accessToken`: `Bearer sgWwSBeX_biC3tdnFqf736c...`
   - Ma il server restituisce comunque HTML

### Form HTML Ricevuto:

```html
<form action="http://formazione.ilportaledeltrasporto.it:80/agent/cdsso-oauth2">
  ...
</form>
```

Il path `/agent/cdsso-oauth2` indica che il server sta cercando di reindirizzare attraverso un **CDSSO Agent** (Cross-Domain Single Sign-On Agent).

## Possibili Cause

1. **Cookie di Sessione Mancanti**: Le API REST potrebbero richiedere cookie di sessione SSO oltre al Bearer token
2. **Token Non Valido per API REST**: L'accessToken potrebbe essere valido solo per SSO, non per le API REST
3. **Configurazione Server**: Il server potrebbe richiedere una configurazione diversa per le API REST
4. **URL Base Errato**: Potrebbe servire URL interno invece di pubblico

## Tentativi di Soluzione

1. ✅ Rimosso fallback a `idToken` - ora usa solo `accessToken`
2. ✅ Aggiunto `credentials: 'include'` per includere cookie
3. ⚠️ Problema persiste

## Prossimi Step

1. **Verificare con ACI/MIT**:
   - Se le API REST richiedono cookie di sessione
   - Se l'accessToken è valido per le API REST
   - Se serve configurazione diversa

2. **Verificare Token Storage**: Assicurarsi che i token siano salvati prima di fare chiamate API

3. **Verificare URL**: Potrebbe servire URL interno con VPN invece di pubblico

