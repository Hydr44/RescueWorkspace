# ⚠️ Problema CDSSO - Cookie iPlanetDirectoryPro Mancante

**Data:** 22 gennaio 2026  
**Problema:** CDSSO richiesto ma cookie `iPlanetDirectoryPro` non disponibile

---

## 🔴 Problema Identificato

Dai log:
```
[RVFU API Proxy] 🔍 Cookie disponibili nella pagina: {
  cookieString: 'cookies_consent=true; agent-authn-tx-...',
  cookieCount: 3,
  hasIPlanetCookie: false,  ← PROBLEMA!
  url: 'https://formazione.ilportaledeltrasporto.it/',
  origin: 'https://formazione.ilportaledeltrasporto.it'
}
```

**Causa:**
- Il cookie `iPlanetDirectoryPro` è impostato per `ssoformazione.ilportaledeltrasporto.it`
- La pagina della finestra persistente è su `formazione.ilportaledeltrasporto.it`
- I cookie `httpOnly` non sono visibili in `document.cookie`, ma dovrebbero essere inviati automaticamente con `credentials: 'include'`
- Tuttavia, il server continua a richiedere il CDSSO, indicando che il cookie non viene inviato o non è valido

---

## ✅ Tentativi di Fix

### 1. Impostazione Cookie Multi-Dominio
- Cookie impostato per dominio SSO: `ssoformazione.ilportaledeltrasporto.it`
- Cookie impostato per dominio API: `formazione.ilportaledeltrasporto.it`
- Cookie impostato per dominio parent: `.ilportaledeltrasporto.it`

### 2. Caricamento Sequenziale Pagine
- Prima carica pagina SSO per stabilire sessione
- Poi carica pagina RVFU per stabilire sessione API

### 3. Completamento Automatico CDSSO
- Tentativo di estrarre `id_token` dal form CDSSO
- POST diretto a `/agent/cdsso-oauth2` → **403 Forbidden**
- Conversione HTTP in HTTPS → **Ancora 403 Forbidden**

---

## 🔍 Analisi

Il problema principale è che:
1. Il cookie `iPlanetDirectoryPro` è `httpOnly`, quindi non visibile in `document.cookie`
2. Il cookie dovrebbe essere inviato automaticamente con `credentials: 'include'`
3. Tuttavia, il server continua a richiedere il CDSSO, indicando che:
   - Il cookie non viene inviato correttamente
   - Il cookie non è valido per il dominio API
   - Il server richiede una navigazione reale del browser per completare il CDSSO

---

## 💡 Soluzioni Possibili

### A. Usare VPS Proxy con VPN
- Il VPS ha accesso VPN diretto a RVFU
- Il proxy può mantenere una sessione SSO attiva
- Le chiamate API passano attraverso il proxy che ha i cookie corretti

### B. Navigazione Reale al CDSSO
- Quando rileviamo il CDSSO, navigare effettivamente alla pagina CDSSO
- Questo richiederebbe di gestire la navigazione nella finestra persistente
- Dopo il CDSSO, riprovare la richiesta originale

### C. Rifare Login Periodicamente
- Quando rileviamo il CDSSO, richiedere all'utente di rifare login
- Questo è l'approccio attuale implementato

---

## 📝 Stato Attuale

**Implementato:**
- Rilevamento CDSSO
- Estrazione `id_token` dal form
- Messaggio di errore chiaro che indica la necessità di rifare login

**Non Funzionante:**
- Completamento automatico CDSSO (403 Forbidden)
- Cookie `iPlanetDirectoryPro` non disponibile nella pagina

**Raccomandazione:**
- Usare il VPS proxy con VPN per le chiamate API
- Oppure richiedere all'utente di rifare login quando necessario

---

**Status:** ⚠️ Problema persistente - Richiede soluzione alternativa (VPS proxy o re-login manuale)
