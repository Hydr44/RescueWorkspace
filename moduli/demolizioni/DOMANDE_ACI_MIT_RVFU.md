# ❓ Domande per ACI/MIT - Integrazione API REST RVFU

**Data**: 2026-01-23  
**Contesto**: Integrazione API REST RVFU per applicazione desktop  
**Problema**: 401 Unauthorized dopo login OAuth2 riuscito

---

## 🔐 1. AUTENTICAZIONE API REST

### Domanda 1.1: Quale token usare per API REST?

**Situazione attuale**:
- Login OAuth2 riuscito ✅
- Ricevuti: `access_token`, `id_token`, `refresh_token`
- Usiamo: `access_token` (standard OAuth2)

**Contraddizione**:
- Manuale ACI/MIT (sezione 5.3, punto 7) dice: `Authorization: Bearer {id_token}`
- Standard OAuth2 dice: `access_token` per API REST

**Domanda**: 
> Quale token dobbiamo usare per le chiamate API REST?
> - `access_token` (standard OAuth2)
> - `id_token` (come indicato nel manuale)
> - Dipende dall'endpoint?

**Esempio chiamata attuale**:
```http
GET https://formazione.ilportaledeltrasporto.it/demolitori-aci-ws/rest/agenzia/consulta/VFU
Authorization: Bearer <access_token>
```

**Errore ricevuto**: `401 Unauthorized`

---

### Domanda 1.2: Serve CDSSO anche per API REST?

**Situazione attuale**:
- Documentazione OpenAPI dice: "NO CDSSO, solo Bearer Token"
- Comportamento server: 401 senza sessione attiva

**Domanda**:
> Le API REST su `formazione.ilportaledeltrasporto.it` richiedono una sessione browser attiva (CDSSO)?
> - NO (solo Bearer Token)
> - SÌ (serve navigare prima per stabilire sessione)
> - Dipende dal dominio/endpoint?

**Test effettuati**:
- ✅ Solo Bearer Token → 401
- ⚠️ Bearer Token + navigazione finestra → Non testato completamente

---

### Domanda 1.3: Cookie di sessione necessari?

**Situazione attuale**:
- Documentazione dice: "NO cookie"
- Server potrebbe richiedere cookie di sessione

**Domanda**:
> Le API REST richiedono cookie di sessione oltre al Bearer Token?
> - NO (solo Bearer Token)
> - SÌ (quali cookie? `am-auth-jwt`, `iPlanetDirectoryPro`, altri?)
> - Dipende dal dominio?

---

## 🌐 2. URL API REST

### Domanda 2.1: Quale URL corretto per formazione?

**Contraddizione**:
- **OpenAPI (`RVFU.json`)**: `https://formazione.ilportaledeltrasporto.it/demolitori-aci-ws/rest`
- **Manuale ACI/MIT**: `http://gestione-veicolo-fuoriuso-tst.serviziaci.it:80/demolitori-aci-ws/rest`

**Situazione**:
- `formazione.ilportaledeltrasporto.it` → Accessibile, ma 401
- `serviziaci.it` → DNS non risolve (`NXDOMAIN`)

**Domanda**:
> Quale è l'URL corretto per le API REST in ambiente formazione?
> - `https://formazione.ilportaledeltrasporto.it/demolitori-aci-ws/rest`
> - `http://gestione-veicolo-fuoriuso-tst.serviziaci.it:80/demolitori-aci-ws/rest`
> - Altro?

**Nota**: `serviziaci.it` non risolve DNS. È solo intranet/VPN?

---

### Domanda 2.2: `serviziaci.it` è solo intranet?

**Domanda**:
> Il dominio `gestione-veicolo-fuoriuso-tst.serviziaci.it` è:
> - Accessibile solo da rete interna/VPN?
> - Richiede configurazione DNS speciale?
> - Non più utilizzato?

---

## 🔑 3. CONFIGURAZIONE CLIENT

### ⚠️ PROBLEMA CRITICO TROVATO NEI LOG

**Situazione osservata**:
- Login usa Client ID: `AUTODEM.RESCUEMANAGER`
- Token JWT ricevuto ha: `audience: 'formazioneAgent'` ❌
- Risultato: 403 Forbidden

**Log completo**:
```
tokenInfo: {
  audience: 'formazioneAgent',
  issuer: 'https://ssoformazione.ilportaledeltrasporto.it/sso/oauth2',
  subject: 'DETO003001...',
  expectedAudience: 'formazioneAgent',
  audienceMatch: true
}
```

**Domanda critica**:
> Perché il token JWT ha audience `formazioneAgent` invece di `AUTODEM.RESCUEMANAGER`?
> - È normale che il server SSO emetta token con audience diversa dal client ID usato?
> - Dobbiamo usare `formazioneAgent` come client ID per le API REST?
> - Se sì, qual è il `client_secret` per `formazioneAgent`?
> - `AUTODEM.RESCUEMANAGER` è autorizzato per API REST su `formazione.ilportaledeltrasporto.it`?

---

### Domanda 3.1: Client ID corretto?

**Configurazione attuale**:
- Client ID: `AUTODEM.RESCUEMANAGER`
- Client Secret: `R2Y2L9T2`

**⚠️ PROBLEMA CRITICO TROVATO**:
Nei log, il token JWT ha `audience: 'formazioneAgent'` invece di `AUTODEM.RESCUEMANAGER`!

**Log osservato**:
```
tokenInfo: {
  audience: 'formazioneAgent',
  issuer: 'https://ssoformazione.ilportaledeltrasporto.it/sso/oauth2',
  subject: 'DETO003001...',
  expectedAudience: 'formazioneAgent',
  audienceMatch: true
}
```

**Domanda**:
> Il Client ID `AUTODEM.RESCUEMANAGER` è:
> - Registrato correttamente?
> - Autorizzato per API REST?
> - Ha i permessi necessari per `/agenzia/consulta/VFU`?
> - **Perché il token ha audience `formazioneAgent` invece di `AUTODEM.RESCUEMANAGER`?**
> - **Dobbiamo usare `formazioneAgent` come client ID per le API REST su `formazione.ilportaledeltrasporto.it`?**

---

### Domanda 3.2: Scope corretti?

**Configurazione attuale**:
- Scope: `openid profile`

**Domanda**:
> Gli scope `openid profile` sono sufficienti per API REST?
> - SÌ
> - NO (serve scope aggiuntivo, es. `rvfu`?)
> - Dipende dall'endpoint?

---

### Domanda 3.3: Redirect URI corretto?

**Configurazione attuale**:
- Redirect URI: `https://localhost/`

**Domanda**:
> Il Redirect URI `https://localhost/` è registrato per `AUTODEM.RESCUEMANAGER`?
> - SÌ
> - NO (quale è quello corretto?)

---

## 📋 4. ENDPOINT SPECIFICI

### Domanda 4.1: Endpoint ricerca veicolo corretto?

**Endpoint usato**:
```
GET /demolitori-aci-ws/rest/agenzia/consulta/VFU
```

**Domanda**:
> Questo endpoint è corretto per ricerca veicolo per targa?
> - SÌ
> - NO (qual è quello corretto?)
> - Serve endpoint diverso per demolitori?

**Nota**: OpenAPI mostra `/agenzia/consulta/VFU`, ma manuale menziona anche `/concessionario/veicolo` (che però è UI, non API)

---

### Domanda 4.2: Parametri query corretti?

**Parametri usati**:
```
?targa=VA058AJ&tipoVeicolo=A&causale=DEMOLIZIONE
```

**Domanda**:
> Questi parametri sono corretti?
> - SÌ
> - NO (quali sono quelli corretti?)
> - `causale` è necessario per la ricerca?

---

## 🔍 5. DEBUGGING

### Domanda 5.1: Come diagnosticare 401?

**Domanda**:
> In caso di 401 Unauthorized, come possiamo diagnosticare il problema?
> - Log server disponibili?
> - Header di risposta specifici?
> - Tool di test consigliati?

---

### Domanda 5.2: Ambiente test disponibile?

**Domanda**:
> C'è un ambiente di test/documentazione per verificare l'integrazione?
> - URL test specifico?
> - Credenziali test?
> - Esempi di chiamate funzionanti?

---

## 📝 6. DOCUMENTAZIONE

### Domanda 6.1: Documentazione più aggiornata?

**Contraddizioni trovate**:
1. Token: Manuale dice `id_token`, standard OAuth2 dice `access_token`
2. URL: OpenAPI dice `formazione.ilportaledeltrasporto.it`, manuale dice `serviziaci.it`
3. CDSSO: OpenAPI dice "NO CDSSO", comportamento suggerisce il contrario

**Domanda**:
> Quale documentazione è più aggiornata?
> - OpenAPI (`RVFU.json`)
> - Manuale ACI/MIT (`SpecificheWS-GestioneDemolitori1.25.md`)
> - Entrambe sono valide per aspetti diversi?

---

### Domanda 6.2: Esempi funzionanti disponibili?

**Domanda**:
> Sono disponibili esempi di chiamate API REST funzionanti?
> - curl commands?
> - Postman collection?
> - SDK/Client library?

---

## 🎯 PRIORITÀ DOMANDE

### 🔴 CRITICHE (bloccanti - 403 persiste)
1. **Domanda 4.1**: ⚠️ **NUOVO - CRITICO**: Perché 403 Forbidden anche con token e cookie corretti?
2. **Domanda 4.2**: ⚠️ **NUOVO - CRITICO**: L'utente `DETO003001` ha i permessi per `/agenzia/consulta/VFU`?
3. **Domanda 4.3**: ⚠️ **NUOVO - CRITICO**: Quale è l'endpoint corretto per ricerca veicolo?
4. **Domanda 3.1b**: Perché il token JWT ha audience `formazioneAgent` invece di `AUTODEM.RESCUEMANAGER`?
5. **Domanda 1.1**: Quale token (`access_token` vs `id_token`)?
6. **Domanda 2.1**: Quale URL corretto?
7. **Domanda 1.2**: Serve CDSSO per API REST?

### 🟡 MEDIA PRIORITÀ (importanti)
4. **Domanda 1.3**: Cookie di sessione necessari?
5. **Domanda 3.1**: Client ID configurato correttamente?
6. **Domanda 4.1**: Endpoint corretto?

### 🟢 BASSA PRIORITÀ (utili)
7. **Domanda 3.2**: Scope corretti?
8. **Domanda 4.2**: Parametri query corretti?
9. **Domanda 6.1**: Documentazione aggiornata?

---

## 📧 CONTATTO

**Quando contattare**: Dopo aver provato TEST 1 e TEST 8 (vedi `ANALISI_COMPLETA_APPROCCI_RVFU.md`)

**Cosa includere nella richiesta**:
1. Questo documento con tutte le domande
2. Log delle chiamate (con token mascherati)
3. Esempio di chiamata che fallisce
4. Configurazione attuale (Client ID, URL, ecc.)

---

**Ultimo aggiornamento**: 2026-01-23
