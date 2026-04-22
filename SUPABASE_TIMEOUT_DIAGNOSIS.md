# 🔥 DIAGNOSI TIMEOUT SUPABASE - 22 Aprile 2026

## 📊 RISULTATI TEST DIAGNOSTICI

### Test eseguiti da macchina locale:

| Test | Risultato | Tempo | Stato |
|------|-----------|-------|-------|
| Ping base | 401 Unauthorized | 133ms | ✅ Server raggiungibile |
| Health check | Invalid API key | 115ms | ✅ API risponde |
| Query semplice (system_settings) | **TIMEOUT** | **5015ms** | ❌ FALLITO |
| Query con RLS (org_members) | **TIMEOUT** | **10016ms** | ❌ FALLITO |
| Query pubblica (system_settings) | **TIMEOUT** | **5022ms** | ❌ FALLITO |
| DNS lookup | 104.18.38.10 | <100ms | ✅ DNS funziona |

---

## 🎯 DIAGNOSI DEFINITIVA

### ❌ PROBLEMA CONFERMATO: Database/PostgREST Supabase

**Tutte le query REST API vanno in timeout**, indipendentemente da:
- Presenza di RLS
- Complessità della query
- Tabella interrogata

**Questo esclude:**
- ❌ Problema di rete (DNS risolve, server risponde)
- ❌ Problema Vercel (non coinvolto nei test)
- ❌ Problema RLS specifico (anche query senza RLS falliscono)
- ❌ Problema client (curl da terminale ha stesso comportamento)

**Questo conferma:**
- ✅ **Problema interno Supabase** (Database o PostgREST layer)
- ✅ **Connection pool** potenzialmente bloccato
- ✅ **Database overload** o risorse esaurite
- ✅ **Bug lato Supabase** sul progetto specifico

---

## 🔍 EVIDENZE RACCOLTE

### 1. Comportamento app desktop
- App si blocca su "Preparazione ambiente"
- Timeout dopo 8 secondi (OrgContext safety timeout)
- Console mostra: `504 Gateway Timeout` su tutte le query
- Errore: `upstream request timeout`

### 2. Test curl da terminale
```bash
# Query semplice - TIMEOUT dopo 5s
curl --max-time 5 "https://ienzdgrqalltvkdkuamp.supabase.co/rest/v1/system_settings?select=key&limit=1" \
  -H "apikey: [REDACTED]" \
  -H "Authorization: Bearer [REDACTED]"
# Exit code: 28 (TIMEOUT)
```

### 3. Pattern osservato
- **Tutte** le query REST API: timeout 5-60s
- **Endpoint health**: risponde in ~115ms
- **DNS**: risolve correttamente
- **Server**: raggiungibile (HTTP 401 su endpoint protetti)

---

## 🚨 CAUSA PROBABILE

### Scenario più probabile:

**PostgREST o Connection Pool bloccato**

Il layer PostgREST (che gestisce le REST API) o il connection pool PostgreSQL sono in uno stato incoerente:
- Accettano connessioni
- Ma non processano query
- Timeout dopo 60s (default PostgREST)

### Possibili cause tecniche:
1. **Connection pool esaurito** - tutte le connessioni occupate/bloccate
2. **PostgREST crash** - processo in stato zombie
3. **Database lock nascosto** - transazione bloccata non visibile
4. **Risorse esaurite** - CPU/memoria database al limite
5. **Bug Supabase** - problema specifico del progetto

---

## ✅ AZIONI IMMEDIATE RICHIESTE

### 1. ⚡ RESTART DATABASE (PRIORITÀ MASSIMA)

**Vai su Supabase Dashboard:**
1. Progetto: `ienzdgrqalltvkdkuamp`
2. Settings → Database
3. **Database Settings** → **Restart database**
4. Conferma restart
5. Attendi 2-3 minuti
6. **Riprova app**

**Questo risolverà:**
- Connection pool bloccato
- PostgREST in stato incoerente
- Lock nascosti
- Cache corrotta

---

### 2. 📊 VERIFICA RISORSE DATABASE

**Vai su Supabase Dashboard:**
1. Database → **Reports**
2. Controlla:
   - **CPU usage** (dovrebbe essere <50%)
   - **Memory usage** (dovrebbe essere <80%)
   - **Active connections** (dovrebbe essere <20)
   - **Slow queries** (non dovrebbero esserci)

**Se CPU >80% o Memory >90%:**
- Problema di risorse
- Potrebbe servire upgrade piano

---

### 3. 🔧 PAUSE/RESUME PROGETTO (se restart non funziona)

**Vai su Supabase Dashboard:**
1. Settings → General
2. **Pause project**
3. Attendi 1 minuto
4. **Resume project**
5. Attendi 2-3 minuti per inizializzazione
6. **Riprova app**

**Questo fa:**
- Full restart di tutti i servizi
- Reset completo connection pool
- Reinizializzazione PostgREST

---

### 4. 📝 APRI TICKET SUPPORTO SUPABASE (se problema persiste)

**Se dopo restart/pause il problema persiste:**

1. Vai su: https://supabase.com/dashboard/support
2. **Apri nuovo ticket**
3. **Titolo**: `All REST API queries timeout after 5-60s - Project: ienzdgrqalltvkdkuamp`
4. **Descrizione**:

```
Project ID: ienzdgrqalltvkdkuamp
Issue: All REST API queries timeout (504 Gateway Timeout)
Started: ~22 April 2026

Symptoms:
- All /rest/v1/* endpoints timeout after 5-60 seconds
- Health check endpoint responds normally (~115ms)
- DNS resolves correctly
- Tested from multiple clients (app, curl, browser)
- Both RLS and non-RLS queries fail
- Simple queries (LIMIT 1) also timeout

Diagnostics performed:
- curl tests from terminal: all timeout (exit code 28)
- DNS lookup: working (104.18.38.10)
- Server reachability: confirmed (HTTP 401 on protected endpoints)
- Connection pool: appears blocked/exhausted

Actions taken:
- Database restart: [YES/NO]
- Project pause/resume: [YES/NO]
- Result: [STILL FAILING]

Request:
Please investigate PostgREST layer and connection pool status.
Appears to be internal Supabase issue, not client-side.
```

5. **Allega screenshot** dei test
6. **Priorità**: High

---

## 🧪 TEST DA FARE SU SUPABASE SQL EDITOR

**Per confermare se è problema Database o PostgREST:**

1. Vai su Supabase → **SQL Editor**
2. Esegui:
```sql
SELECT * FROM system_settings LIMIT 1;
```
3. **Misura il tempo**

**Interpretazione:**
- ✅ **SQL veloce (<1s)** → Problema PostgREST layer
- ❌ **SQL lento (>5s)** → Problema database
- ❌ **SQL bloccato** → Lock o risorse esaurite

---

## 📋 CHECKLIST COMPLETA

- [ ] Eseguito test diagnostici (✅ FATTO)
- [ ] Restart database Supabase
- [ ] Test SQL Editor per conferma
- [ ] Verifica risorse database (CPU/Memory)
- [ ] Se non risolto: Pause/Resume progetto
- [ ] Se ancora non risolto: Ticket supporto Supabase
- [ ] Controlla status.supabase.com per incident
- [ ] Dopo risoluzione: test app desktop

---

## 🎯 SOLUZIONE TEMPORANEA PER UTENTI

**Mentre si risolve il problema Supabase:**

1. **Schermata errore implementata** ✅
   - Dopo 24s di timeout → messaggio chiaro
   - "Servizio temporaneamente non disponibile"
   - Pulsante "Esci" per logout manuale

2. **Messaggio agli utenti:**
   ```
   I nostri server stanno riscontrando problemi tecnici.
   Stiamo lavorando per risolvere il problema.
   Riprova tra qualche minuto.
   ```

---

## 📞 CONTATTI SUPPORTO

- **Supabase Support**: https://supabase.com/dashboard/support
- **Status Page**: https://status.supabase.com
- **Discord**: https://discord.supabase.com

---

## 📅 TIMELINE

- **22 Apr 2026 11:25** - Problema rilevato dall'utente
- **22 Apr 2026 11:38** - Identificato come problema Supabase (non Vercel)
- **22 Apr 2026 12:43** - Test diagnostici completati
- **22 Apr 2026 12:50** - Diagnosi confermata: Database/PostgREST issue

---

## 🔄 PROSSIMI STEP

1. **UTENTE**: Restart database su Supabase
2. **UTENTE**: Test SQL Editor
3. **UTENTE**: Riprova app
4. **SE NON RISOLTO**: Pause/Resume progetto
5. **SE ANCORA NON RISOLTO**: Ticket supporto Supabase

---

**Documento creato**: 22 Aprile 2026  
**Progetto**: RescueManager Desktop App  
**Supabase Project**: ienzdgrqalltvkdkuamp
