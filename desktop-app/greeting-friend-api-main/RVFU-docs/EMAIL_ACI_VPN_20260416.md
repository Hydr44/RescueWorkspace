# Email per ACI Informatica — Problemi VPN e Blocco Workflow

**Da:** RescueManager — Rescue Manager S.R.L. (P.IVA 02166430856)
**Per:** ACI Informatica / DXC Technology (Massimiliano Alocci)
**Oggetto:** Test RVFU Formazione 16/04/2026 — Blocco workflow dataPresaInCarico + Connettività VPN
**Data:** 16 Aprile 2026, ore 14:00 CEST
**Client:** AUTODEM.RESCUEMANAGER
**Utenza:** DETO003001

---

## Gentile Massimiliano,

in data odierna abbiamo eseguito una sessione completa di test sull'ambiente di formazione RVFU. Di seguito il resoconto dei risultati e le problematiche riscontrate.

---

## 1. 🔴 Connettività VPN — IP 10.220.222.45 NON Raggiungibile con le Nostre Credenziali VPN

### Configurazione

Come da vostre indicazioni, abbiamo configurato il file hosts con:

```
10.220.222.45 ssoformazione.ilportaledeltrasporto.it
```

e ci colleghiamo tramite VPN Cisco AnyConnect a `anyvpn.ilportaledellautomobilista.it/rep-applicativi`.

### Problema: le nostre credenziali VPN non raggiungono 10.220.222.45

**Con le vecchie credenziali VPN del reparto applicativo**, l'IP `10.220.222.45` è raggiungibile e il flusso RVFU funziona correttamente (autenticazione SSO, chiamate API, registrazione VFU — tutto OK).

**Con le nostre credenziali VPN (RescueManager)**, l'IP `10.220.222.45` è **irraggiungibile**:

### Test connettività eseguiti il 16/04/2026 ore 14:00 CEST — con le nostre credenziali VPN

| Test | IP | Risultato | Note |
|------|-----|-----------|------|
| Ping 10.220.222.45 | 10.220.222.45 | ❌ **100% packet loss** | 3 pacchetti inviati, 0 ricevuti |
| TCP porta 443 su 10.220.222.45 | 10.220.222.45 | ❌ **Connection timeout** (5s) | Non raggiungibile |
| curl authenticate su 10.220.222.45 | 10.220.222.45 | ❌ **Timeout** dopo 5 secondi | HTTP code 000 |

La risoluzione DNS pubblica punta a un IP diverso (`10.139.231.53`) che è un server diverso e non consente il flusso SSO di formazione.

### Confronto tra credenziali VPN

| | Credenziali VPN reparto applicativo (vecchie) | Credenziali VPN RescueManager (nostre) |
|---|---|---|
| VPN Connect | ✅ Connesso | ✅ Connesso |
| Raggiunge 10.220.222.45 | ✅ **Sì** | ❌ **No — timeout** |
| SSO Authenticate | ✅ OK | ❌ Non raggiungibile |
| API RVFU | ✅ Funzionante | ❌ Non raggiungibile |

**Le credenziali VPN del reparto applicativo permettono di raggiungere `10.220.222.45` senza problemi. Le nostre credenziali VPN no.**

### Richiesta

Chiediamo cortesemente di **verificare la configurazione del nostro profilo VPN** affinché possa raggiungere la subnet `10.220.222.x` dove si trova il server SSO di formazione. Attualmente la nostra VPN non ha la rotta verso questo IP e non possiamo procedere con i test in autonomia.

---

## 2. Autenticazione e API — ✅ FUNZIONANTE (solo con VPN reparto applicativo)

I seguenti test sono stati eseguiti utilizzando le **credenziali VPN del reparto applicativo** (le uniche che raggiungono `10.220.222.45`). Il flusso OAuth2 completo funziona correttamente con le nostre credenziali applicative:

| Step | Endpoint | Risultato |
|------|----------|-----------|
| 1. Authenticate | POST /sso/json/authenticate | ✅ tokenId (114 chars) |
| 2. Authorize | POST /sso/oauth2/authorize (Cookie: pdtsso-form) | ✅ code (154 chars) |
| 3. Access Token | POST /sso/oauth2/access_token | ✅ id_token (1410 chars) |
| 4. API Call | GET /cr/consulta/VFU (Bearer id_token) | ✅ E000 — 6 VFU trovati |

**Credenziali utilizzate:**
- Username: `DETO003001`
- Password: `TEST.030`
- Client ID: `AUTODEM.RESCUEMANAGER`
- Client Secret: `e3abea315f8d7acffca73941c6a0de2197068d15`

L'autenticazione e le chiamate API di consultazione funzionano perfettamente.

---

## 3. 🔴 Blocco Critico — `dataPresaInCarico` è NULL

### Il problema

Dopo la registrazione di un VFU con `POST /cr/VFU`, il campo **`dataPresaInCarico`** nella risposta è sempre **`null`** per la nostra utenza DETO003001.

### Esempio concreto

**Chiamata effettuata alle 13:42:18 CEST del 16/04/2026:**

```
GET https://formazione.ilportaledeltrasporto.it/rvfu/sh/cr/VFU/116002
Authorization: Bearer {id_token DETO003001}

Risposta:
{
  "esito": { "code": "E000", "responseStatus": "OK" },
  "result": {
    "idVFU": 116002,
    "targa": "AG004557",
    "statoVFU": "PRESO IN CARICO",
    "dataConferimento": "2026-04-16T10:14:42",
    "dataPresaInCarico": null,              ← ⚠️ NULL
    "dataBonifica": null,
    "dataDemolizione": null
  }
}
```

### Confronto con documentazione ACI

Nella vostra documentazione "Casi di test WS ACI (CR)", la **stessa targa AG004557** registrata con utenza **DETO000101** ha `dataPresaInCarico` **correttamente valorizzata**:

```
VFU #39002 (utenza DETO000101):
  "dataPresaInCarico": "2024-01-31T11:03:26"    ← ✅ VALORIZZATA
```

| | VFU #39002 (DETO000101) | VFU #116002 (DETO003001) |
|---|---|---|
| Targa | AG004557 | AG004557 |
| Payload | Identico | Identico |
| dataPresaInCarico | ✅ "2024-01-31T11:03:26" | ❌ **null** |

**Stessa targa, stesso payload, stesso endpoint — la differenza è solo l'utenza.**

### Effetto a cascata

Questo campo NULL blocca l'intero workflow:

```
POST /cr/genera/ricevutaPresaInCarico/116002  → ❌ 1026 "ERRORE"
POST /cr/genera/certificatoRottamazione/116002 → ❌ 1026 "ERRORE"
PUT /cr/chiudi/fascicolo/116002                → ❌ 1010 "DOCUMENTI MINIMI NON PRESENTI"
PUT /cr/demolisci/VFU/116002                   → ❌ 1001 "ERRORE CAMBIAMENTO STATO VFU"
```

### Log completo della sessione (16/04/2026, ore 13:40–13:43 CEST)

| Ora | Chiamata | Esito |
|-----|----------|-------|
| 13:40:59 | GET /utility/detail/utente | ✅ E000 |
| 13:40:59 | GET /cr/consulta/VFU | ✅ E000 (6 VFU) |
| 13:41:56 | POST /cr/genera/ricevutaPresaInCarico/116006 | ❌ **1026** |
| 13:41:59 | POST /cr/genera/certificatoRottamazione/116006 | ❌ **1026** |
| 13:42:01 | GET /cr/consulta/documentoVFU/116006 | ✅ E000 (0 documenti) |
| 13:42:10 | PUT /cr/chiudi/fascicolo/116006 | ❌ **1010** |
| 13:42:12 | PUT /cr/verifica/VFU/116006/D | ❌ 1001 (già VALIDATO) |
| 13:42:14 | PUT /cr/demolisci/VFU/116006 | ❌ **1001** |
| 13:42:18 | GET /cr/VFU/116002 | ✅ E000 |
| 13:42:22 | POST /cr/genera/certificatoRottamazione/116002 | ❌ **1026** |
| 13:42:24 | PUT /cr/verifica/VFU/116002/D | ✅ **E000** → VALIDATO |
| 13:42:27 | GET /cr/consulta/documentoVFU/116002 | ✅ E000 (0 documenti) |
| 13:42:28 | PUT /cr/chiudi/fascicolo/116002 | ❌ **1010** |
| 13:42:30 | POST /cr/genera/certificatoRottamazione/116002 | ❌ **1026** |
| 13:42:31 | POST /cr/genera/ricevutaPresaInCarico/116002 | ❌ **1026** |

### VFU creati durante i test

| idVFU | Targa | Stato | dataPresaInCarico |
|-------|-------|-------|-------------------|
| 116001 | AG004557 | ANNULLATO | null |
| 116002 | AG004557 | VALIDATO | **null** |
| 116003 | AG004558 | PRESO IN CARICO | **null** |
| 116004 | AG004558 | PRESO IN CARICO | **null** |
| 116005 | AG004559 | PRESO IN CARICO | **null** |
| 116006 | AG004559 | VALIDATO | **null** |

**Tutti i 6 VFU hanno `dataPresaInCarico: null`.**

---

## 4. Richieste

### 🔴 Urgente

1. **Verificare la configurazione dell'utenza DETO003001.** Il campo `dataPresaInCarico` non viene valorizzato per il nostro account, mentre per DETO000101 (nella vostra documentazione) funziona. È possibile che manchi un attributo o una configurazione nel profilo CR?

2. **Fornire un log lato server degli errori 1026** sui nostri VFU (116002 e 116006). Il messaggio generico "SI È VERIFICATO UN ERRORE SI PREGA DI RIPROVARE PIÙ TARDI" non ci consente di diagnosticare il problema.

3. **Come sbloccare il workflow?** Possiamo:
   - a) Correggere la configurazione di DETO003001?
   - b) Ottenere un'utenza test funzionante (come DETO000101)?
   - c) Esiste un endpoint per impostare manualmente `dataPresaInCarico`?

### 🟡 Chiarimenti

4. **Targhe VA***: Le targhe VA189AJ–VA231AJ funzionano per la ricerca ma non per la registrazione VFU. Quale serie di targhe dobbiamo usare per i test completi?

5. **VPN**: L'IP `10.220.222.45` è raggiungibile solo via VPN. È il comportamento atteso?

---

## 5. Riepilogo

| Funzionalità | Stato | Note |
|-------------|-------|------|
| **VPN nostre credenziali → 10.220.222.45** | **❌** | **Non raggiungibile — la nostra VPN non ha rotta verso 10.220.222.x** |
| VPN reparto applicativo → 10.220.222.45 | ✅ | Funziona — raggiunge il server SSO di formazione |
| Autenticazione OAuth2 (via VPN rep. applicativo) | ✅ | Flusso completo funzionante |
| API consultazione | ✅ | 16/19 endpoint OK |
| Registrazione VFU | ✅ | 6 VFU creati |
| Verifica VFU | ✅ | 2 VFU portati a VALIDATO |
| **dataPresaInCarico** | **❌ NULL** | **Blocco su tutti i 6 VFU** |
| **Genera documenti** | **❌ 1026** | **Bloccato da dataPresaInCarico NULL** |
| **Demolizione** | **❌** | **Intero workflow bloccato** |

**Il nostro client è completamente funzionante.** Il blocco è sulla valorizzazione di `dataPresaInCarico` per l'utenza DETO003001.

Restiamo a disposizione per qualsiasi test aggiuntivo o per una sessione congiunta di debug.

Cordiali saluti,
**Rescue Manager S.R.L.**
info@rescuemanager.eu

---

*Allegato: Rapporto tecnico dettagliato RAPPORTO_TEST_ACI_20260416_v4.md*
