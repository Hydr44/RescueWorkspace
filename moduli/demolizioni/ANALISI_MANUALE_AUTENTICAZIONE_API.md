# Analisi Manuale - Autenticazione API REST

## Dal Manuale SpecificheWS-GestioneDemolitori1.24

### Sezione 5.1.2 OIDC TOKENS

Il manuale specifica:

> **Access Token**: specifico per il protocollo OAuth2, è il token che può essere speso per essere autorizzati ad accedere direttamente ad una risorsa

Nel JSON di esempio:
```json
{
  "access_token": "fdhYNyTikmph8MCI2MgMq2MVdGE",
  "token_type": "Bearer",
  ...
}
```

### Conclusione

Secondo il manuale:
- L'**Access Token** è quello da usare per accedere alle risorse (API REST)
- Il `token_type` è **"Bearer"**
- Quindi l'header deve essere: `Authorization: Bearer <access_token>`

**ATTENZIONE**: Il manuale NON fornisce esempi espliciti di chiamate API REST con il token. Mostra solo il flusso OAuth/OIDC per ottenere i token.

## Problema Attuale

Il server restituisce HTML "Submit This Form" invece di JSON quando chiamiamo le API REST con `Authorization: Bearer <access_token>`.

## Possibili Cause

1. **Token non valido**: Il token potrebbe non essere valido per le API REST
2. **Configurazione Client OAuth**: Il client OAuth potrebbe non essere configurato per accedere alle API REST
3. **Scope insufficienti**: Gli scope richiesti potrebbero non essere sufficienti per le API REST
4. **URL base errato**: L'URL base potrebbe non essere corretto (potrebbe servire URL interno con VPN invece di pubblico)

## Azioni Necessarie

1. **Verificare con ACI/MIT**:
   - Quale token usare per le API REST (access_token o id_token?)
   - Se il client OAuth è configurato correttamente per le API REST
   - Quale URL usare (pubblico o interno?)
   - Se ci sono scope aggiuntivi necessari

2. **Verificare nel file HTML OpenAPI** se ci sono esempi di chiamate con autenticazione

