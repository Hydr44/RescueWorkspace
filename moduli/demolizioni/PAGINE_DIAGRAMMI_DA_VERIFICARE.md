# 📊 Pagine/Capitoli con Diagrammi da Verificare

## Diagrammi Critici per l'Implementazione

### 1. Sezione 5.1 - Specifiche OpenID Provider
- **Pagina**: ~19-20 del PDF
- **Contenuto**: Probabilmente contiene il diagramma del flusso OIDC Authorization Code Flow
- **Importanza**: ⭐⭐⭐⭐⭐ CRITICO - Mostra il flusso completo OAuth/OIDC
- **Cosa cercare**: 
  - Diagramma di flusso tra Client, User, Authorization Server
  - Passaggi numerati del flusso
  - Freccie e interazioni tra componenti

### 2. Sezione 5.3 - Flusso di Autenticazione
- **Pagina**: ~23-24 del PDF
- **Contenuto**: Il manuale menziona "Di seguito, a titolo di esempio, il diagramma di flusso"
- **Importanza**: ⭐⭐⭐⭐⭐ CRITICO - Mostra il flusso specifico RVFU
- **Cosa cercare**:
  - Flusso step-by-step dell'autenticazione
  - Chiamate tra Client e SSO
  - Sequenza temporale delle operazioni
  - Differenze rispetto al flusso standard OAuth



  diagramma


# OIDC Authorization Code Flow – Flusso di autenticazione

## Attori
- User-Agent: browser dell’utente
- Relying Party (RP): applicazione (es. RescueManager)
- OpenID Provider (IdP): sistema IAM / Identity Provider

## Flusso

1. User → RP  
   L’utente accede a una risorsa protetta dell’applicazione.

2. RP → User → IdP  
   Il RP effettua un redirect verso l’IdP per l’autenticazione con:
   - response_type=code
   - client_id
   - redirect_uri
   - scope=openid
   - state
   - nonce

3. User → IdP  
   L’IdP mostra la pagina di login e autentica l’utente.

4. IdP → User → RP  
   Dopo il login, l’IdP redirige verso il redirect_uri del RP
   includendo un authorization code temporaneo:
   /callback?code=AUTH_CODE&state=XYZ

5. RP → IdP (back-channel)  
   Il RP scambia l’authorization code con i token tramite una
   richiesta server-to-server al token endpoint:
   - grant_type=authorization_code
   - code
   - client_id
   - client_secret
   - redirect_uri

6. IdP → RP  
   L’IdP restituisce:
   - access_token
   - id_token (JWT)
   - eventuale refresh_token

7. RP  
   Il RP valida l’ID Token:
   - verifica firma JWT
   - controlla iss, aud, exp, nonce
   - estrae il subject (sub)

8. RP → User  
   Viene creata la sessione applicativa.
   L’utente è autenticato e autorizzato ad accedere alle risorse.

## Note chiave
- Il browser non riceve mai direttamente i token
- L’authorization code è monouso e a breve durata
- Lo scambio dei token avviene solo server-to-server
- ID Token = identità utente
- Access Token = autorizzazione alle risorse

### 3. Sezione 2 - Architettura Sistema
- **Pagina**: ~2-5 del PDF (all'inizio del documento)
- **Contenuto**: Probabilmente architettura generale
- **Importanza**: ⭐⭐⭐⭐ ALTA - Capire l'architettura completa
- **Cosa cercare**:
  - Componenti del sistema (Client, SSO, API Gateway, API REST)
  - Interazioni tra componenti
  - Dove vengono fatte le chiamate API REST

è il primo diagramma che arriva
# RVFU – Stati del veicolo nel Registro Veicoli Fuori Uso

Il flusso descrive il ciclo di vita di un veicolo dal momento
dell’inserimento nel Registro fino alla demolizione finale.

Ogni stato è identificato da una lettera (STD).

---

## 1. Inserimento e controlli iniziali

### Stato I – INSERITO
Il veicolo viene inserito nel Registro Veicoli Fuori Uso
dal Concessionario.

Durante l’inserimento:
- vengono effettuati controlli sul veicolo
- si verifica la presenza di eventuali ostativi amministrativi

---

### Stato IN ATTESA
Il veicolo:
- è inserito in archivio
- NON può essere preso in carico
- presenta ostativi o anomalie

Uscita dallo stato:
- solo dopo la sanatoria della posizione del veicolo

---

## 2. Presa in carico dal Centro di Raccolta

### Stato RITIRATO DA CONCESSIONARIO
Se i controlli sono OK:
- il veicolo è accettato
- viene rilasciato il Certificato di Rottamazione
  all’ultimo possessore

---

### Stato C – CONFERITO
Il veicolo viene:
- consegnato al Centro di Raccolta
- preso in carico dal Centro di Raccolta

---

### Stato P – PRESO IN CARICO
Il Centro di Raccolta:
- prepara la documentazione
- crea il fascicolo del veicolo

---

### Stato T – TRASFERITO (opzionale)
Il veicolo può essere:
- trasferito ad un altro Centro di Raccolta
- il nuovo Centro deve prenderlo in carico

---

## 3. Annullamento (caso eccezionale)

### Stato A – ANNULLATO
Il veicolo viene:
- eliminato dal Registro
- annullato dal Concessionario o Centro di Raccolta

Il flusso termina senza demolizione.

---

## 4. Validazione e radiazione

### Stato V – VALIDATO
Il Centro di Raccolta verifica:
- stato veicolo in ANV
- provvedimenti amministrativi
- assenza di ostativi

Se tutto è corretto:
- il fascicolo viene chiuso

---

### Stato R – DA RADIARE
Il veicolo è:
- pronto per la pratica di radiazione
- associato a una pratica PRA / STA

---

### Stato N – INVIATO A STA
La documentazione del veicolo:
- viene inviata allo STA
- lo STA prende in carico la pratica di radiazione

---

### Stato INTEGRAZIONE (eventuale)
Lo STA può:
- richiedere integrazioni documentali
- riaprire temporaneamente il fascicolo

---

## 5. Radiazione e demolizione

### Stato S – RADIATO
Lo STA:
- completa la pratica di radiazione
- carica la ricevuta nel fascicolo demolizione

⚠️ Il veicolo diventa **effettivamente RADIATO**
solo dopo la **convalida PRA**

---

### Stato D – DEMOLITO (stato finale)
Il Centro di Raccolta:
- demolisce il veicolo
- distrugge targhe e documenti cartacei

Il ciclo di vita del veicolo termina.

---

## Riassunto sequenziale

INSERITO
→ IN ATTESA (se ostativi)
→ RITIRATO
→ CONFERITO
→ PRESO IN CARICO
→ VALIDATO
→ DA RADIARE
→ INVIATO A STA
→ RADIATO
→ DEMOLITO

---

## Note chiave per backend / logica applicativa

- Ogni stato è esclusivo e sequenziale
- Alcuni stati sono opzionali (TRASFERITO, INTEGRAZIONE)
- DEMOLITO è lo stato terminale
- RADIATO ≠ DEMOLITO (sono due fasi distinte)
- Le azioni dipendono dal ruolo:
  - Concessionario
  - Centro di Raccolta
  - STA / PRA


### 4. Sezione 5.3.x - Dettagli Endpoint
- **Pagine**: ~24-28 del PDF
- **Contenuto**: Dettagli degli endpoint di autenticazione
- **Importanza**: ⭐⭐⭐ MEDIA - Potrebbero esserci diagrammi di sequenza
- **Cosa cercare**:
  - Diagrammi di sequenza per /authenticate
  - Diagrammi di sequenza per /authorize
  - Diagrammi di sequenza per /access_token



  # Flusso di autenticazione IAM – MIT (Authorization Code Flow con /authenticate)

## Attori
- Software House: applicazione client (es. RescueManager backend)
- IAM / OpenID Provider: sistema di Identity Management MIT
- API Gateway / Services: Web Services protetti

---

## Flusso dettagliato

### [1] authenticate (UserId / Password)
Software House → IAM

La Software House effettua una chiamata diretta all’endpoint:
POST /authenticate

Inviando:
- UserId
- Password

Scopo:
- autenticare l’utente **senza mostrare la pagina di login**
- evitare redirect HTML durante le chiamate ai Web Services

---

### [2] Cookie iPlanetDirectoryPro
IAM → Software House

Se le credenziali sono valide, IAM restituisce:
- un cookie di sessione (`iPlanetDirectoryPro`)

Questo cookie rappresenta una sessione autenticata lato IAM.

---

### [3] authorize (iPlanetDirectoryPro + ClientId)
Software House → IAM

La Software House chiama:
GET /authorize

Includendo:
- Cookie `iPlanetDirectoryPro`
- ClientId dell’applicazione

Scopo:
- avviare il flusso OIDC **Authorization Code Flow**
- senza richiedere nuovamente il login

---

### [4] Authorization Code
IAM → Software House

IAM restituisce:
- un Authorization Code (temporaneo, monouso)

Questo code rappresenta l’autorizzazione concessa al client.

---

### [5] accesstoken (AuthorizationCode / ClientId / ClientSecret)
Software House → IAM

La Software House effettua una chiamata server-to-server:
POST /accesstoken

Inviando:
- Authorization Code
- ClientId
- ClientSecret

Scopo:
- scambiare il code con i token OIDC

---

### [6] IDToken / AccessToken / RefreshToken
IAM → Software House

IAM restituisce:
- ID Token (JWT – identità utente)
- Access Token (autorizzazione ai servizi)
- Refresh Token (opzionale)

---

### [7] Chiamata ai Services con ID Token
Software House → API Gateway / Services

La Software House invoca i Web Services protetti passando:
- ID Token (o Access Token, secondo specifica)

I Services:
- validano il token
- estraggono l’identità utente
- autorizzano la richiesta

---

## Concetti chiave
- Nessuna pagina di login HTML viene mai mostrata
- Il cookie iPlanetDirectoryPro serve solo nella fase iniziale
- Il flusso OIDC standard parte dal passo [3]
- Tutto il flusso è **machine-to-machine**
- Sicuro e conforme a OIDC Authorization Code Flow

### 5. Sezione API REST (se presente)
- **Pagine**: Dopo sezione 5, probabilmente ~30+ del PDF
- **Contenuto**: Chiamate alle API REST
- **Importanza**: ⭐⭐⭐⭐⭐ CRITICO - Capire come chiamare le API REST
- **Cosa cercare**:
  - Flusso di chiamata alle API REST dopo autenticazione
  - Come viene passato il token
  - Interazione con API Gateway
  - Esempi di chiamate con diagrammi


  ce scritto questa roba qui Riferirsi comunque alle specifiche del proprio client oidc/oauth2.
  che vuol dire

## 📋 Checklist Diagrammi da Inviare

### Priorità ALTA (implementazione critica):
- [ ] **Sezione 5.1** - Diagramma flusso OIDC Authorization Code Flow (pagina ~19-20)
- [ ] **Sezione 5.3** - Diagramma flusso autenticazione RVFU (pagina ~23-24)
- [ ] **Sezione API REST** - Diagramma chiamate API REST (se presente, dopo sezione 5)

### Priorità MEDIA (utile per comprensione):
- [ ] **Sezione 2** - Architettura sistema (pagina ~2-5)
- [ ] **Sezione 5.3.1-5.3.3** - Diagrammi sequenza endpoint (pagina ~24-28)

## 🎯 Focus Speciale

**PROBLEMA ATTUALE**: Il server restituisce HTML "Submit This Form" con action `/agent/cdsso-oauth2` invece di JSON.

**DIAGRAMMI CHE POTREBBERO AIUTARE**:
1. **Flusso completo autenticazione** (5.3) - per vedere se manca qualche step
2. **Chiamate API REST** - per vedere se serve qualcosa oltre al Bearer token
3. **Architettura API Gateway** - per capire il meccanismo CDSSO

## 📝 Note

Quando invii i diagrammi, fai screenshot chiari che mostrino:
- Tutti i passaggi numerati
- Frecce e direzioni
- Nomi esatti degli endpoint
- Header e parametri richiesti
- Interazioni tra componenti

In particolare, cerca diagrammi che mostrano:
- **Come viene chiamata l'API REST dopo l'autenticazione**
- **Se serve qualcosa oltre al Bearer token (es. cookie, header aggiuntivi)**
- **Il meccanismo CDSSO e come funziona**

