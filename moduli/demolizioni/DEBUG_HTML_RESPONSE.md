# 🔍 Debug Risposta HTML invece di JSON

## Problema

Il server sta restituendo HTML (`<!DOCTYPE`) invece di JSON quando si chiama l'endpoint `/demolitori-aci-ws/rest/concessionario/veicolo`.

## Possibili Cause

1. **Autenticazione non valida**
   - Il token potrebbe essere scaduto o non valido
   - Il server redirige a una pagina di login HTML

2. **Endpoint non trovato (404)**
   - L'URL potrebbe non essere corretto
   - Il server restituisce una pagina di errore HTML

3. **Errore del server**
   - Errore interno del server che mostra una pagina HTML

4. **URL base sbagliato**
   - L'URL base potrebbe non essere corretto
   - Il server potrebbe restituire una pagina di default

## Soluzione Implementata

Ho migliorato la gestione degli errori nel `makeRequest` per:
- ✅ Rilevare se la risposta è HTML prima di fare parse JSON
- ✅ Mostrare un errore più chiaro con informazioni utili
- ✅ Estrapolare il titolo della pagina HTML se presente
- ✅ Mostrare l'URL chiamato per debug

## Prossimi Passi

Quando vedi l'errore, controlla:
1. Il messaggio di errore che ora mostra l'URL chiamato
2. Il titolo della pagina HTML (se presente)
3. Lo status code HTTP

Con queste informazioni possiamo capire meglio il problema.

## Verifiche da Fare

1. **Verifica Autenticazione**:
   - Controlla che il token sia valido
   - Verifica che `getAuthHeader()` restituisca un token corretto

2. **Verifica URL**:
   - L'URL dovrebbe essere: `https://formazione.ilportaledeltrasporto.it/demolitori-aci-ws/rest/concessionario/veicolo`
   - Con i parametri query: `?causale=...&tipoVeicolo=...&codiceFiscale=...&targa=...`

3. **Test Manuale**:
   - Prova a chiamare l'endpoint con curl o Postman
   - Verifica che l'autenticazione funzioni

