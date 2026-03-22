# 🔍 Verifica Dati Ricerca Veicolo

## Dati Attualmente Usati

Dalla console vediamo:
- `codiceFiscale`: `SCZMNL05L21D960T`
- `targa`: `GN457PG`
- `causale`: `DEMOLIZIONE`
- `tipoVeicolo`: `A`

## Possibili Problemi

### 1. Problema CDSSO (Autenticazione)
L'errore "Submit This Form" indica che il server sta ancora richiedendo autenticazione CDSSO. Questo **NON** è un problema con i dati inseriti, ma con l'autenticazione.

### 2. Parametri Mancanti o Errati
Potrebbero mancare parametri obbligatori o essere nel formato sbagliato secondo il manuale.

### 3. URL Endpoint
L'URL usato è:
```
https://formazione.ilportaledeltrasporto.it/demolitori-aci-ws/rest/concessionario/veicolo
```

## Verifica Manuale

Devo verificare nel manuale:
1. L'endpoint corretto per la ricerca veicolo
2. I parametri obbligatori
3. Il formato dei dati
4. Esempi di chiamate funzionanti

## Log Dettagliati Aggiunti

Ho aggiunto logging dettagliato in `rvfu-api-proxy.html` per vedere:
- Cookie disponibili nella finestra BrowserWindow
- Headers inviati
- Risposta ricevuta
- Tipo di contenuto (HTML vs JSON)

## Prossimi Passi

1. Verifica nei log del BrowserWindow se i cookie SSO sono presenti
2. Controlla nel manuale i parametri corretti
3. Se i cookie mancano, potremmo dover navigare prima alla pagina SSO nella finestra BrowserWindow per stabilire la sessione

