# Analisi Manuale per CDSSO

## Cosa Dice il Manuale

### Sezione 5.3 - Flusso di Autenticazione (Pagina 23)

Il manuale specifica chiaramente:

**Punto 7:**
> "Il Client chiama l'API Gateway passando l'**IDToken** (Bearer) nel Header Authorization."

## Problema

1. ✅ Il manuale dice di usare **IDToken** (non AccessToken)
2. ❌ Abbiamo provato con **IDToken** → Server restituisce HTML CDSSO
3. ❌ Abbiamo provato con **AccessToken** → Server restituisce HTML CDSSO
4. ❌ Nessuna menzione di CDSSO nel manuale
5. ❌ Nessuna menzione di cookie di sessione aggiuntivi per API REST
6. ❌ Nessuna menzione di `/agent/cdsso-oauth2`

## Conclusione

Il manuale **NON** menziona:
- CDSSO (Cross-Domain Single Sign-On)
- Cookie di sessione aggiuntivi per API REST
- Meccanismi di autenticazione aggiuntivi dopo OAuth
- Il form HTML "Submit This Form"
- L'endpoint `/agent/cdsso-oauth2`

Il manuale dice semplicemente:
- Usa **IDToken** nel Header Authorization come Bearer token
- Fine.

## Implicazioni

Il fatto che il server restituisca HTML CDSSO anche con IDToken valido suggerisce:

1. **Configurazione server-side specifica del client** `AUTODEM.RESCUEMANAGER` che richiede CDSSO
2. **Problema di configurazione** del client OAuth con ACI/MIT
3. **Meccanismo non documentato** che richiede passaggi aggiuntivi

## Prossimi Step

1. ✅ Verificato manuale: **NON c'è menzione di CDSSO**
2. ⏳ Il problema è **configurazione server-side** non documentata
3. ⏳ **Contattare ACI/MIT** per verificare:
   - Perché il client `AUTODEM.RESCUEMANAGER` richiede CDSSO?
   - Come bypassare CDSSO o completare il flusso CDSSO?
   - Configurazioni specifiche del client

