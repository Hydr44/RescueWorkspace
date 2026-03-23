# Guida Pratica per la Chiamata con ACI

> Cosa dire, come rispondere, script da seguire

---

## PREPARAZIONE (5 minuti prima)

### 1. Apri i file necessari
```bash
# Terminale 1: lo script di test
bash /tmp/test-rvfu-chiamata-live.sh

# Editor: documenti di riferimento
open /Users/sign.rascozzarini/Projects/rescuemanager-workspace/desktop-app/RVFU-docs/STUDIO_FLUSSO_OIDC_COMPLETO.md
open /Users/sign.rascozzarini/Projects/rescuemanager-workspace/desktop-app/RVFU-docs/PREPARAZIONE_CHIAMATA_ACI.md
```

### 2. Verifica VPN
- VPN ACI deve essere attiva
- Gateway: `ilportaledellautomobilista.it/utentiMCTC`
- Credenziali VPN: `swh.scorazzini` / `Vpn-2011`

### 3. Tieni a portata di mano
- Credenziali test: `DETO003001` / `TEST.030`
- Client ID: `AUTODEM.RESCUEMANAGER`
- Client secret: `e3abea315f8d7acffca73941c6a0de2197068d15`

---

## INTRODUZIONE CHIAMATA (primi 2 minuti)

### Cosa dire all'inizio

**Tu:**
> "Buongiorno, sono Emmanuel Scozzarini di RescueManager. Grazie per la disponibilità. Abbiamo implementato il flusso OIDC Authorization Code come descritto nel manuale ACI Sezione 5, ma riceviamo sempre 401 Unauthorized quando chiamiamo le API `/rvfu/sh/` con Bearer token. Il flusso di autenticazione funziona correttamente — otteniamo id_token valido — ma il gateway API non lo accetta. Vorrei eseguire un test live insieme a voi per mostrarvi esattamente cosa succede."

**Loro potrebbero chiedere:**
- "Quale ambiente state usando?" → **Formazione**
- "Quali credenziali?" → **DETO003001 / TEST.030**
- "Quale client ID?" → **AUTODEM.RESCUEMANAGER**
- "Da quando avete il problema?" → **Da sempre, dal primo test (febbraio 2026)**

---

## ESECUZIONE SCRIPT (15-20 minuti)

### Step 1: Authenticate

**Cosa succede:**
- Lo script fa POST a `/sso/json/authenticate`
- Riceve `tokenId`

**Cosa dire:**
```
"Sto eseguendo lo Step 1: authenticate con le credenziali DETO003001.
[premi INVIO]
Ecco, ho ricevuto HTTP 200 e il tokenId. Questo è il cookie iPlanetDirectoryPro
che userò nel prossimo step. Il timestamp preciso è [leggi timestamp]."
```

**Se chiedono di vedere il tokenId:**
```
"Sì, il tokenId inizia con [leggi primi 40 caratteri]. Posso inviarvelo
via email se serve per i vostri log."
```

---

### Step 2: Authorize

**Cosa succede:**
- Lo script fa POST a `/sso/oauth2/authorize` con cookie
- Riceve redirect con `code`

**Cosa dire:**
```
"Step 2: authorize. Sto inviando il cookie iPlanetDirectoryPro e richiedendo
un authorization code per il client AUTODEM.RESCUEMANAGER.
[premi INVIO]
Perfetto, ho ricevuto HTTP 302 con Location header che contiene il code.
Timestamp: [leggi timestamp]."
```

**Se chiedono dettagli:**
```
"Il redirect_uri è https://localhost/ come registrato con voi.
Lo scope è 'openid profile'. Il code che ho ricevuto inizia con [primi 40 char]."
```

---

### Step 3: Access Token

**Cosa succede:**
- Lo script scambia il code con i token JWT
- Mostra il payload decodificato

**Cosa dire:**
```
"Step 3: token exchange. Sto inviando il code insieme a client_id e client_secret.
[premi INVIO]
Ottimo, ho ricevuto HTTP 200 con id_token e access_token. Timestamp: [leggi].
Ecco il payload JWT decodificato che vedete sullo schermo:
- sub: DETO003001
- aud: AUTODEM.RESCUEMANAGER
- iss: ssoformazione.ilportaledeltrasporto.it
- exp: [leggi scadenza]
Il token è valido e ben formato."
```

**Se chiedono di verificare il token:**
```
"Posso eseguire l'introspection sul vostro server SSO per confermare
che il token è attivo. Lo faccio nello Step 5."
```

---

### Step 4: API Call (IL PROBLEMA)

**Cosa succede:**
- Lo script chiama `/rvfu/sh/cr/veicolo` con Bearer token
- Riceve 401

**Cosa dire:**
```
"Adesso Step 4: la chiamata API vera e propria. Sto chiamando
GET /rvfu/sh/cr/veicolo con Authorization: Bearer <id_token>.
[premi INVIO]
Ecco il problema: HTTP 401 Unauthorized. Timestamp preciso: [leggi timestamp].
Guardate gli header di risposta che vedete sullo schermo:
- Server: Apache
- Set-Cookie: HTTP_SESSION_ATTR_TOKEN=;Max-Age=0  ← vuoto
- Set-Cookie: HTTP_SESSIONITIPOACCESSO=;Max-Age=0  ← vuoto

Questi cookie vengono azzerati, il che significa che il server non riconosce
il Bearer token."
```

**DOMANDA CHIAVE da fare qui:**
```
"Nei vostri log Apache di questo timestamp [ripeti timestamp], vedete
la nostra richiesta con header Authorization: Bearer? Se sì, che errore
viene loggato?"
```

---

### Step 5: Introspection

**Cosa succede:**
- Lo script verifica il token sul server SSO
- Conferma che è `active: true`

**Cosa dire:**
```
"Step 5: introspection. Verifico che il token sia valido sul vostro server SSO.
[premi INVIO]
Il server SSO conferma: active: true. Il token è valido e non scaduto.
Quindi il problema non è il token in sé, ma la configurazione del gateway API
che non lo riconosce."
```

---

### Step 6-7: Test aggiuntivi

**Cosa dire:**
```
"Step 6: provo con access_token invece di id_token.
[premi INVIO]
Stesso risultato: HTTP 401.

Step 7: confronto il comportamento. Chiamo l'API senza token, con token
inventato, e con token valido.
[premi INVIO]
Come vedete, la risposta è identica in tutti i casi: HTTP 401.
Questo conferma che il gateway non sta leggendo o validando il Bearer token."
```

---

## LE 4 DOMANDE CHIAVE

### Dopo aver finito lo script, fai queste domande:

**DOMANDA 1: Policy ForgeRock**
```
"È configurata una policy di tipo 'OAuth2 Resource Server' in ForgeRock
per il client AUTODEM.RESCUEMANAGER sul path /rvfu/sh/* ?"
```

**Risposta attesa:**
- Se dicono "sì" → chiedi di verificare che sia attiva e non in errore
- Se dicono "no" → **questo è il problema**, chiedi quando possono configurarla
- Se dicono "non so" → chiedi chi può verificare (team ForgeRock)

---

**DOMANDA 2: Attributo profilo**
```
"L'utente DETO003001 ha l'attributo HTTP_SESSIONITIPOACCESSO configurato
nel profilo LDAP? Nei nostri test questo cookie è sempre vuoto (Max-Age=0),
anche quando usiamo CDSSO."
```

**Risposta attesa:**
- Se dicono "sì" → chiedi il valore (dovrebbe essere "CR" per Centro Raccolta)
- Se dicono "no" → chiedi come valorizzarlo
- Se dicono "è gestito automaticamente" → spiega che nei test è sempre vuoto

---

**DOMANDA 3: JWT Bearer profile**
```
"Il client AUTODEM.RESCUEMANAGER ha il JWT Bearer profile abilitato
in ForgeRock? Questo è necessario per validare token JWT con firma RS256."
```

**Risposta attesa:**
- Se dicono "sì" → chiedi di verificare la configurazione
- Se dicono "no" → chiedi di abilitarlo
- Se dicono "cos'è?" → spiega: "È il profilo ForgeRock che permette di validare JWT Bearer token secondo RFC 7523"

---

**DOMANDA 4: Test diretto**
```
"Potete eseguire un test diretto sui vostri sistemi usando il token JWT
che vi ho appena mostrato? Posso inviarvelo via email insieme ai timestamp
precisi per aiutarvi a trovare le richieste nei log."
```

**Risposta attesa:**
- Se dicono "sì" → invia email con token e timestamp
- Se dicono "no" → chiedi alternative (accesso a ambiente di test, log condivisi)

---

## RISPOSTE A DOMANDE COMUNI

### "Avete provato senza Bearer token?"
**Risposta:**
> "Sì, nello Step 7 dello script. La risposta è identica: HTTP 401. Il server non distingue tra token valido, token inventato, o nessun token. Questo conferma che il Bearer token non viene letto."

---

### "Funziona con CDSSO?"
**Risposta:**
> "CDSSO è per browser web, non per applicazioni desktop. Il manuale ACI Sezione 5 descrive il flusso OIDC Authorization Code per software house. Comunque, anche con CDSSO il cookie HTTP_SESSIONITIPOACCESSO è sempre vuoto, quindi c'è un problema di configurazione del profilo utente."

---

### "Il token è scaduto?"
**Risposta:**
> "No, l'introspection nello Step 5 conferma active: true. Inoltre, il token è appena stato generato pochi secondi prima della chiamata API. Il claim 'exp' nel JWT mostra scadenza tra [X] minuti."

---

### "Avete la VPN attiva?"
**Risposta:**
> "Sì, altrimenti non riusciremmo a completare gli Step 1-2-3 che funzionano correttamente. Il problema è solo nello Step 4 (chiamata API con Bearer token)."

---

### "Quale versione del manuale state seguendo?"
**Risposta:**
> "SpecificheWS-GestioneDemolitori versione 1.25, Sezione 5.3 'Modalità di autenticazione di un utente per l'utilizzo dei Web Service'. Seguiamo esattamente il flusso Authorization Code Flow descritto lì."

---

### "Avete provato in produzione?"
**Risposta:**
> "No, perché non abbiamo ancora ricevuto le credenziali di produzione. Stiamo testando in formazione come da vostre indicazioni. L'architettura è identica, quindi il problema sarà lo stesso."

---

### "Il client_secret è corretto?"
**Risposta:**
> "Sì, altrimenti lo Step 3 (token exchange) fallirebbe con HTTP 401. Invece riceviamo HTTP 200 e token validi. Il client_secret è: e3abea315f8d7acffca73941c6a0de2197068d15 (40 caratteri esadecimali), confermato da ACI Informatica il 26 febbraio 2026."

---

### "Potete mostrarci il codice?"
**Risposta:**
> "Sì, il codice è in TypeScript. I file principali sono:
> - `src/lib/rvfu-auth.ts` — classe RVFUAuthService che esegue i 3 step OIDC
> - `src/lib/rvfu-client.ts` — classe RVFUClient che chiama le API con Bearer token
> Posso condividere il repository GitHub se serve."

---

## CONCLUSIONE CHIAMATA

### Cosa dire alla fine

**Tu:**
> "Ricapitolando: il flusso OIDC funziona perfettamente (Step 1-2-3), otteniamo token JWT validi, ma il gateway API su /rvfu/sh/ non li riconosce (Step 4 → 401). Dalle vostre risposte, sembra che [riassumi cosa hanno detto]. Quali sono i prossimi passi? Potete configurare la policy ForgeRock e l'attributo HTTP_SESSIONITIPOACCESSO? Avete una timeline?"

**Chiedi:**
- Timeline per il fix
- Chi è il referente tecnico (nome/email)
- Se serve altro da parte nostra
- Quando possiamo rifare un test

**Invia dopo la chiamata:**
- Email di riepilogo con timestamp precisi
- Token JWT (se richiesto)
- Link al repository GitHub (se richiesto)
- Screenshot degli header di risposta

---

## CHECKLIST FINALE

Prima di chiudere la chiamata, assicurati di aver:

- [ ] Eseguito tutti i 7 step dello script
- [ ] Fatto le 4 domande chiave
- [ ] Ottenuto risposte chiare (o almeno "verificheremo")
- [ ] Concordato prossimi passi
- [ ] Ottenuto timeline indicativa
- [ ] Ottenuto contatto del referente tecnico
- [ ] Annotato tutte le risposte

---

## FRASI UTILI DA RICORDARE

**Per sembrare preparato:**
> "Come da manuale ACI Sezione 5.3, stiamo usando Authorization Code Flow con JWT Bearer token secondo RFC 6749 e RFC 7523."

**Per essere assertivo:**
> "Il problema non è nel nostro codice — il flusso OIDC è implementato correttamente. Serve una configurazione lato server ForgeRock."

**Per essere collaborativo:**
> "Siamo disponibili a fare tutti i test necessari. Possiamo anche darvi accesso temporaneo al nostro sistema se serve per il debug."

**Per gestire obiezioni:**
> "Capisco la vostra posizione, ma abbiamo documentato ogni singolo test con timestamp precisi. Il comportamento del server è inequivocabile: il Bearer token non viene validato."

**Per chiudere positivamente:**
> "Grazie per il supporto. Appena avrete configurato la policy, siamo pronti a ritestare immediatamente. Vi invio subito l'email di riepilogo con tutti i dettagli tecnici."
