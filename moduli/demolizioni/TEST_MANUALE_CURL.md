# 🔧 Test Manuale con curl

## Come Eseguire il Test

### 1. Ottieni l'AccessToken

1. Fai login nell'app RVFU
2. Apri la console del browser (F12)
3. Esegui:
```javascript
const tokens = JSON.parse(sessionStorage.getItem('rvfu_tokens'));
console.log('Access Token:', tokens.accessToken);
```

### 2. Esegui curl

Sostituisci `YOUR_ACCESS_TOKEN` con il token ottenuto:

```bash
# Test chiamata consulta VFU
curl -v \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Accept: application/json" \
  "https://formazione.ilportaledeltrasporto.it/demolitori-aci-ws/rest/concessionario/consulta/VFU?pageNumber=0&pageSize=10&paged=true"

# Test chiamata verifica veicolo
curl -v \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Accept: application/json" \
  "https://formazione.ilportaledeltrasporto.it/demolitori-aci-ws/rest/concessionario/veicolo?causale=DEMOLIZIONE&tipoVeicolo=A&codiceFiscale=SCZMNL05L21D960T&targa=GN457PG"
```

### 3. Analizza la Risposta

Il flag `-v` mostra:
- **Headers di richiesta** inviati
- **Headers di risposta** ricevuti
- **Status code** (200, 401, 403, ecc.)
- **Contenuto completo** della risposta

### Cosa Cercare

1. **Se restituisce JSON**: Il problema è nel codice JavaScript/Electron
2. **Se restituisce HTML**: Il problema è lato server/configurazione
3. **Se restituisce 401**: Token non valido o scaduto
4. **Se restituisce 403**: Token valido ma permessi insufficienti
5. **Headers Set-Cookie**: Se ci sono cookie richiesti

## Esempio Output Atteso

### ✅ Successo (JSON)
```json
{
  "esito": {
    "codice": "OK",
    "descrizione": "..."
  },
  "result": [...]
}
```

### ❌ Problema (HTML)
```html
<html>
  <head><title>Submit This Form</title></head>
  <body>
    <form action="http://formazione.ilportaledeltrasporto.it:80/agent/cdsso-oauth2">
      ...
    </form>
  </body>
</html>
```

