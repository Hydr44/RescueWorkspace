# ✅ Monitor Web Creato

**Data:** 13 gennaio 2026  
**Status:** ✅ Implementato

---

## 📋 Cosa Ho Creato

### 1. Endpoint API `/api/sdi-sftp/status`
- **Path:** `website/src/app/api/sdi-sftp/status/route.ts`
- **Funzione:** Recupera lo status dei file SDI dal VPS tramite SSH
- **Metodo:** GET
- **Accesso:** Pubblico (tramite website)

### 2. Pagina Web `/sdi-monitor`
- **Path:** `website/src/app/sdi-monitor/page.tsx`
- **Funzione:** Interfaccia web per monitorare lo status dei file SDI
- **Design:** Responsive, ottimizzato per mobile
- **Features:**
  - Dashboard con conteggi file
  - Lista file in attesa
  - Lista file EO (esiti)
  - Auto-refresh ogni 30 secondi
  - Aggiornamento manuale

---

## 🔗 Come Accedere

### Opzione 1: Tramite Website (Consigliato)
```
https://tuodominio.com/sdi-monitor
```

### Opzione 2: API Diretta
```
https://tuodominio.com/api/sdi-sftp/status
```

---

## 📊 Funzionalità

- ✅ **Dashboard** con statistiche:
  - File in attesa di prelevamento
  - File EO (esiti) ricevuti
  - Modalità (TEST/PROD)
  - Ultimo aggiornamento

- ✅ **File in Attesa:**
  - Nome file
  - Dimensione
  - Data/ora caricamento
  - Tempo trascorso

- ✅ **File EO (Esiti):**
  - Nome file
  - Dimensione
  - Data/ora generazione
  - Esito (ET01/ET02)
  - Nome supporto
  - Contenuto XML (espandibile)

- ✅ **Auto-refresh:**
  - Aggiornamento automatico ogni 30 secondi
  - Attivabile/disattivabile
  - Pulsante refresh manuale

---

## 🔧 Dettagli Tecnici

### Endpoint API
- Usa SSH per connettersi al VPS
- Esegue `curl` sul VPS per recuperare i dati
- Gestisce errori e timeout
- Restituisce JSON standardizzato

### Pagina Web
- React/Next.js client component
- Design responsive con Tailwind CSS
- Parsing XML per file EO
- Gestione stati (loading, error, success)

---

## ⚠️ Nota

L'endpoint API usa SSH per accedere al VPS. Assicurati che:
- SSH key sia configurata (`vps-sdi` in `~/.ssh/config`)
- Il server website abbia accesso SSH al VPS
- Se il website è su Vercel/serverless, potrebbe essere necessario un approccio diverso (webhook o altro)
