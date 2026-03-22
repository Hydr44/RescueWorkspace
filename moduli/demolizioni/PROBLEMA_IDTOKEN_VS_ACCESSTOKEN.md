# ⚠️ PROBLEMA CRITICO: IDToken vs AccessToken

## Scoperta dal Manuale

Nel manuale **SpecificheWS-GestioneDemolitori1.24.md**, alla sezione **5.3 FLUSSO DI AUTENTICAZIONE**, punto **7**:

> **Il Client chiama l'API Gateway passando l'IDToken (Bearer ) nel Header Authorization.**

Anche nella versione 1.25 (riga 1257):
> **Il Client chiama l'API Gateway passando l'IDToken (Bearer ) nel Header Authorization.**

## Analisi

### Cosa dice il manuale esplicitamente:

1. **Sezione 5.1.2 OIDC TOKENS** (riga 280):
   > **Access Token**: specifico per il protocollo OAuth2, è il token che può essere speso per essere autorizzati ad accedere direttamente ad una risorsa.

2. **Sezione 5.3 FLUSSO DI AUTENTICAZIONE** (riga 371):
   > **Il Client chiama l'API Gateway passando l'IDToken (Bearer ) nel Header Authorization.**

### Contraddizione

Il manuale è **contraddittorio**:
- La sezione sui token dice che l'AccessToken è per accedere alle risorse
- Il flusso di autenticazione dice di usare l'IDToken per le API

## Implementazione Attuale

**Il nostro codice usa `accessToken`**, che è corretto secondo OAuth2/OIDC standard, ma **potrebbe essere errato secondo questo specifico manuale**.

### Codice Attuale (rvfu-auth.ts):
```typescript
getAuthHeader(): string {
  if (!this.tokens?.accessToken) {
    throw new Error('No access token available for API calls');
  }
  return `Bearer ${this.tokens.accessToken}`; // ✅ Usa accessToken
}
```

### Possibile Correzione:
```typescript
getAuthHeader(): string {
  if (!this.tokens?.idToken) {
    throw new Error('No id token available for API calls');
  }
  return `Bearer ${this.tokens.idToken}`; // ⚠️ Usa idToken secondo manuale
}
```

## Conclusioni

### Opzione 1: Il Manuale ha un Errore
- Il manuale dice "IDToken" ma intende "AccessToken"
- La terminologia OAuth2/OIDC standard usa AccessToken per le API
- Il nostro codice è corretto

### Opzione 2: Il Manuale è Corretto
- Questo sistema specifico richiede IDToken per le API REST
- Il nostro codice è errato e dobbiamo cambiare

## Raccomandazione

**PROVIAMO ENTRAMBI**:

1. Prima proviamo con `idToken` (come dice il manuale)
2. Se non funziona, torniamo a `accessToken`

Questo è probabilmente il problema! Il manuale dice esplicitamente di usare IDToken per le API Gateway.

