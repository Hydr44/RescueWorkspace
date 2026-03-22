# ⚠️ Problema CDSSO Persistente

## Situazione Attuale

Nonostante tutti i fix applicati (uso di `idToken`, una sola chiamata, ecc.), il problema CDSSO persiste:

```
Il server ha restituito HTML invece di JSON (Status: 200). 
Titolo pagina: "Submit This Form", 
Form action: http://formazione.ilportaledeltrasporto.it:80/agent/cdsso-oauth2
```

## Cosa Abbiamo Fatto

1. ✅ **Corretto token**: Usiamo `idToken` come da manuale (sezione 5.3 punto 7)
2. ✅ **Rimosse chiamate duplicate**: Una sola chiamata dopo login
3. ✅ **Corretto URL base**: Usiamo `https://formazione.ilportaledeltrasporto.it`
4. ✅ **Aggiunto `credentials: 'include'`**: Per inviare cookie se necessario
5. ✅ **Delay dopo login**: 1 secondo prima della prima chiamata API

## Cosa Potrebbe Essere

### 1. Problema di Configurazione Server-Side
Il client OAuth `AUTODEM.RESCUEMANAGER` potrebbe essere configurato in modo diverso dal manuale generico. Potrebbero essere necessari:
- Cookie di sessione aggiuntivi
- Header HTTP specifici
- Meccanismi CDSSO non documentati

### 2. Token Non Valido per API Gateway
Anche se il token viene generato correttamente, potrebbe non essere valido per l'API Gateway a causa di:
- Scopes mancanti nel token
- Claim mancanti nel token
- Configurazione del client OAuth che limita l'uso del token

### 3. Meccanismo CDSSO Richiesto
Il server potrebbe richiedere un meccanismo CDSSO (Cross-Domain Single Sign-On) che richiede:
- Una sessione attiva nel browser
- Cookie specifici dal SSO
- Un proxy intermedio

## Cosa Fare

### Opzione 1: Contattare ACI/MIT
Chiedere a ACI/MIT:
1. La configurazione specifica del client `AUTODEM.RESCUEMANAGER`
2. Se il client richiede meccanismi CDSSO aggiuntivi
3. Esempi di chiamate API funzionanti con questo client

### Opzione 2: Test Manuale con curl
Provare a fare una chiamata manuale con curl per vedere se funziona:
```bash
curl -X GET "https://formazione.ilportaledeltrasporto.it/demolitori-aci-ws/rest/concessionario/veicolo?causale=DEMOLIZIONE&tipoVeicolo=A&codiceFiscale=SCZMNL05L21D960T&targa=GN457PG" \
  -H "Authorization: Bearer <IDTOKEN>" \
  -H "Accept: application/json" \
  -v
```

### Opzione 3: Verificare Scopes e Claims
Controllare il JWT `idToken` per vedere:
- Quali scopes sono inclusi
- Quali claim sono presenti
- Se mancano informazioni necessarie

## Conclusione

Il problema sembra essere **configurazione server-side** del client OAuth, non un problema del nostro codice. Tutti i fix implementati sono corretti secondo il manuale, ma il server continua a richiedere meccanismi aggiuntivi non documentati.

