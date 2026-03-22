# EMAIL ESCALATION ACI - BOZZA

---

**A:** ACI Informatica - Supporto Software House RVFU  
**Oggetto:** URGENTE - 401 Unauthorized su /rvfu/sh/ - Evidenze tecniche complete  
**Allegato:** EVIDENZE_TECNICHE_401_RVFU.md

---

Gentile Team ACI Informatica,

facciamo seguito alle precedenti comunicazioni riguardo il persistente errore **401 Unauthorized** su tutti gli endpoint `/rvfu/sh/*` per il client `AUTODEM.RESCUEMANAGER` (utente `DETO003001`).

## SITUAZIONE ATTUALE

Nonostante l'implementazione **esatta** del flusso OIDC descritto nelle specifiche (sezione 5.3), riceviamo 401 su **tutti** gli endpoint API:

```
✅ Step 1-3: Autenticazione OIDC completata con successo
   - tokenId ottenuto
   - authorization code ottenuto  
   - id_token e access_token ottenuti e validi

❌ Step 4: API call con Bearer id_token → 401 Unauthorized
```

## EVIDENZE TECNICHE

Abbiamo effettuato **196 test** (28 endpoint × 7 modalità auth) documentati nel file allegato. Tutti i test confermano:

1. **Il flusso OIDC funziona correttamente** - otteniamo token JWT validi
2. **Il problema è lato server** - analisi header risposta:
   ```
   Set-Cookie: HTTP_SESSION_ATTR_TOKEN=DETO003001  ← utente AUTENTICATO
   Set-Cookie: HTTP_SESSIONITIPOACCESSO=;Max-Age=0  ← tipo accesso NON configurato
   ```
3. **Il gateway OAuth2 non valida il nostro client** - token con `aud=AUTODEM.RESCUEMANAGER` non accettati

## CONFRONTO

- Path `/demolitori-aci-ws/rest/*` (vecchio) → ✅ 302 CDSSO redirect funzionante
- Path `/rvfu/sh/*` (nuovo per CR) → ❌ 401 sempre

## RICHIESTA INTERVENTO

Vi chiediamo di verificare la configurazione ForgeRock per il client `AUTODEM.RESCUEMANAGER`:

1. **Policy OAuth2** su resource `/rvfu/sh/*`
2. **Attributo tipo-accesso** per utente `DETO003001`
3. **Abilitazione API Gateway** per demolitori software house

## URGENZA

Siamo bloccati nello sviluppo del modulo RVFU. I nostri clienti (centri di raccolta) attendono l'integrazione per operare in conformità normativa.

Alleghiamo documentazione tecnica completa con:
- Trace flusso OIDC completo
- Payload JWT decodificati
- Header HTTP request/response
- Script test riproducibili

Restiamo a disposizione per una call tecnica di debug congiunto.

Cordiali saluti,

**[Il tuo nome]**  
RescueManager Development Team  
Email: [la tua email]  
Tel: [il tuo telefono]

---

## ALTERNATIVE SE CONTINUANO A DIRE CHE È UN PROBLEMA VOSTRO

Se ACI insiste che il problema è lato client, chiedete:

### Domanda 1: Token validation
```
"Quale campo del nostro id_token non è valido? 
Il payload JWT contiene:
- aud: AUTODEM.RESCUEMANAGER (client_id corretto)
- sub: DETO003001 (username corretto)
- iss: http://ssoformazione.ilportaledeltrasporto.it/sso/oauth2
- exp: valido (non scaduto)

Abbiamo testato con token freschissimi (< 5 secondi dalla generazione) 
e il risultato è sempre 401.

Quale di questi campi causa il 401?"
```

### Domanda 2: Esempio funzionante
```
"Potete fornirci un esempio di chiamata curl FUNZIONANTE 
con le nostre credenziali (DETO003001 / AUTODEM.RESCUEMANAGER) 
che restituisca 200 OK su /rvfu/sh/cr/veicolo?"
```

### Domanda 3: Log server
```
"Potete condividere i log del gateway OAuth2 
per una nostra richiesta fallita? 
Timestamp: [inserire timestamp di un test recente]
Vogliamo vedere quale validazione fallisce lato server."
```

### Domanda 4: Altri clienti
```
"Ci sono altri client software house che accedono 
con successo a /rvfu/sh/ in ambiente formazione?
Se sì, qual è la differenza di configurazione 
rispetto al nostro client AUTODEM.RESCUEMANAGER?"
```

### Domanda 5: Documentazione mancante
```
"Le specifiche sezione 5.3 dicono solo:
'Il Client chiama l'API Gateway passando l'IDToken (Bearer)'

C'è documentazione aggiuntiva non fornita che descrive 
ulteriori header, parametri o configurazioni necessarie?"
```

---

## SE TUTTO FALLISCE

Ultima opzione: chiedere di **parlare con il team tecnico ForgeRock/OpenAM** che gestisce l'infrastruttura IAM, non solo il supporto applicativo RVFU.

Il problema è a livello di **policy ForgeRock**, non a livello applicativo.
