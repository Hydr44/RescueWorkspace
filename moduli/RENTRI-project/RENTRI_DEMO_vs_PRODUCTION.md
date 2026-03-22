# 🧪 RENTRI: Ambiente DEMO vs PRODUZIONE

**Ultimo Aggiornamento**: 3 Dicembre 2025  
**Status Attuale**: 🟡 **AMBIENTE DEMO**

---

## 🎯 Stato Attuale: DEMO

### ✅ Configurazione DEMO Attiva

| Componente | Valore DEMO | Status |
|------------|-------------|--------|
| **Certificato** | `SCZMNL05L21D960T (1).p12` | ✅ Installato |
| **Password Cert** | `6o^Z+waO` | ✅ Configurata |
| **CA Issuer** | RENTRI API CA DEMO | ✅ Valido |
| **Scadenza** | 3 dicembre 2027 | ✅ Valido 2 anni |
| **Gateway URL** | `https://rentri-test.rescuemanager.eu` | ✅ Operativo |
| **Upstream API** | `demoapi.rentri.gov.it` | ✅ Connesso |
| **JWT Audience** | `rentrigov.demo.api` | ✅ Configurato |
| **JWT Issuer** | `SCZMNL05L21D960T` | ✅ Configurato |

### 🧪 Endpoint DEMO Attivi

```
✅ https://rentri-test.rescuemanager.eu/anagrafiche/v1.0/*
✅ https://rentri-test.rescuemanager.eu/codifiche/v1.0/*
✅ https://rentri-test.rescuemanager.eu/ca-rentri/v1.0/*
✅ https://rentri-test.rescuemanager.eu/dati-registri/v1.0/*
✅ https://rentri-test.rescuemanager.eu/formulari/v1.0/*
✅ https://rentri-test.rescuemanager.eu/vidimazione-formulari/v1.0/*
```

### ⚠️ Limitazioni Ambiente DEMO

1. **Dati NON vanno in produzione reale**
   - Tutto è simulato/test
   - Nessun valore legale
   - Può essere resettato da RENTRI

2. **Modalità STUB possibile**
   - Alcune API possono ritornare HTTP 422 (stub mode)
   - Risposte potrebbero essere fittizie
   - Non tutte le validazioni sono attive

3. **Performance non garantite**
   - Tempi risposta potrebbero variare
   - Quota API limitata
   - Uptime non garantito al 100%

4. **Supporto limitato**
   - Documentazione generale
   - No supporto diretto RENTRI
   - Self-service troubleshooting

---

## 🚀 Passaggio a PRODUZIONE

### 📋 Checklist Pre-Produzione

#### 1. **Certificato Produzione**
- [ ] Richiedere certificato PRODUZIONE su portale RENTRI
- [ ] Scaricare nuovo file `.p12` PRODUZIONE
- [ ] Annotare password certificato PROD
- [ ] Verificare scadenza (generalmente 2-3 anni)

#### 2. **Configurazione VPS**
- [ ] Estrarre chiave/cert dal `.p12` PROD
- [ ] Caricare su VPS in `/etc/nginx/ssl/rentri/prod/`
- [ ] Duplicare config Nginx per dominio prod
- [ ] Aggiungere server block per `rentri.rescuemanager.eu` (PROD)
- [ ] Aggiornare upstream da `demoapi` a `api.rentri.gov.it`
- [ ] Test connessione PROD

#### 3. **Variabili Ambiente**

**Website (Vercel)**:
```bash
# Modificare in Vercel Environment Variables:
RENTRI_GATEWAY_URL=https://rentri.rescuemanager.eu  # rimuovi -test
RENTRI_JWT_AUDIENCE=rentrigov.api  # rimuovi .demo
RENTRI_JWT_PRIVATE_KEY=[nuovo certificato PROD]
RENTRI_JWT_CERT=[nuovo certificato PROD]
# RENTRI_JWT_ISSUER rimane: SCZMNL05L21D960T
```

**Desktop App**:
```bash
# .env o env.example
VITE_RENTRI_API_URL=https://rescuemanager.eu/api/rentri
# (punta automaticamente al gateway PROD dopo config Vercel)
```

#### 4. **Nginx Configurazione PROD**

**File**: `/etc/nginx/sites-available/rentri`

Aggiungere o modificare server block:
```nginx
server {
  listen 443 ssl http2;
  server_name rentri.rescuemanager.eu;  # PROD (senza -test)

  ssl_certificate     /etc/letsencrypt/live/rentri.rescuemanager.eu/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/rentri.rescuemanager.eu/privkey.pem;

  location / {
    proxy_pass https://api.rentri.gov.it$request_uri;  # PROD API
    proxy_set_header Host api.rentri.gov.it;
    
    # Certificati PRODUZIONE
    proxy_ssl_certificate      /etc/nginx/ssl/rentri/prod/cert.pem;
    proxy_ssl_certificate_key  /etc/nginx/ssl/rentri/prod/key.pem;
    proxy_ssl_trusted_certificate /etc/nginx/ssl/rentri/prod/ca-bundle.pem;
    
    proxy_ssl_verify on;
    proxy_ssl_verify_depth 4;
  }
}
```

#### 5. **DNS**
- [ ] Verificare che `rentri.rescuemanager.eu` punti a 217.154.118.37
- [ ] Certificato SSL Let's Encrypt per dominio PROD
- [ ] Test DNS resolution

#### 6. **Test End-to-End PRODUZIONE**
- [ ] Test status endpoint PROD
- [ ] Test lookup codifiche PROD
- [ ] Test creazione registro PROD
- [ ] Test trasmissione movimento PROD
- [ ] Verificare su portale RENTRI che dati arrivano

#### 7. **Backup & Monitoring**
- [ ] Backup certificati PROD (sicuri!)
- [ ] Monitoring uptime gateway
- [ ] Alerting errori RENTRI
- [ ] Log retention policy

---

## 📊 Differenze DEMO vs PRODUZIONE

| Aspetto | DEMO | PRODUZIONE |
|---------|------|------------|
| **Gateway URL** | `rentri-test.rescuemanager.eu` | `rentri.rescuemanager.eu` |
| **API Upstream** | `demoapi.rentri.gov.it` | `api.rentri.gov.it` |
| **JWT Audience** | `rentrigov.demo.api` | `rentrigov.api` |
| **Certificato** | DEMO (scade 2027) | PROD (da richiedere) |
| **Portale** | https://demo.rentri.gov.it | https://www.rentri.gov.it |
| **Dati** | Simulati/Test | Reali/Legali |
| **Validazioni** | Ridotte | Complete |
| **Supporto** | Self-service | Ufficiale RENTRI |
| **Uptime SLA** | Nessuno | 99.5% |

---

## ⚠️ IMPORTANTE: Uso Corretto DEMO

### ✅ Cosa PUOI Fare in DEMO
- Testing funzionalità
- Sviluppo integrazioni
- Training utenti
- Simulazioni flussi
- Verificare logica applicativa
- Validare UI/UX

### ❌ Cosa NON Puoi Fare in DEMO
- Trasmettere dati reali
- Usare per operatività vera
- Fare affidamento su uptime
- Aspettare supporto ufficiale
- Considerare dati con valore legale
- Pianificare produzioni su DEMO

---

## 🔄 Strategia Dual-Environment

### Raccomandazione: Mantenere DEMO + PROD

**Setup ideale**:
```
DEMO:  rentri-test.rescuemanager.eu  (testing continuo)
PROD:  rentri.rescuemanager.eu       (operatività reale)
```

**Vantaggi**:
- ✅ Test nuove feature senza rischi
- ✅ Training nuovi utenti in sicurezza
- ✅ Debugging senza impatto produzione
- ✅ Sviluppo parallelo

**Configurazione**:
```javascript
// Selezione ambiente dinamica
const RENTRI_ENV = process.env.RENTRI_ENVIRONMENT || 'demo';

const RENTRI_CONFIG = {
  demo: {
    gateway: 'https://rentri-test.rescuemanager.eu',
    audience: 'rentrigov.demo.api',
  },
  prod: {
    gateway: 'https://rentri.rescuemanager.eu',
    audience: 'rentrigov.api',
  }
};

const config = RENTRI_CONFIG[RENTRI_ENV];
```

---

## 📅 Timeline Suggerita

### Fase 1: DEMO (ATTUALE) ✅
**Durata**: 1-2 mesi
- ✅ Setup certificato DEMO
- ✅ Sviluppo modulo base
- ⏳ Test funzionalità
- ⏳ Training team
- ⏳ Validazione flussi

### Fase 2: Sviluppo Completo
**Durata**: 1-2 mesi
- [ ] Form dettagliati
- [ ] Integrazione completa API
- [ ] Testing esteso
- [ ] Documentazione utente

### Fase 3: Pre-Produzione
**Durata**: 2-4 settimane
- [ ] Richiesta certificato PROD
- [ ] Setup ambiente PROD
- [ ] Test paralleli DEMO/PROD
- [ ] Validazione compliance

### Fase 4: GO-LIVE PRODUZIONE
**Durata**: 1 settimana
- [ ] Switch a ambiente PROD
- [ ] Migrazione dati (se necessario)
- [ ] Monitoring attivo
- [ ] Supporto H24 primo periodo

---

## 💰 Costi Previsti PRODUZIONE

### Setup Iniziale
- Certificato RENTRI PROD: €0 (incluso registrazione)
- DNS/SSL: €0 (già attivo)
- Sviluppo: Già fatto ✅

### Costi Ricorrenti
- VPS 217.154.118.37: €X/mese (già attivo)
- Supabase: €0-25/mese (se upgrade a Pro)
- Vercel: €0-20/mese (se upgrade)
- Monitoring: €0-15/mese (opzionale)

**Totale stimato**: €0-60/mese

---

## 🔐 Sicurezza

### Certificati
```
DEMO:  /etc/nginx/ssl/rentri/SCZMNL05L21D960T-*.pem
PROD:  /etc/nginx/ssl/rentri/prod/ (da creare)
```

### Backup
```
DEMO:  ~/Downloads/SCZMNL05L21D960T (1).p12 ✅
PROD:  Da backuppare quando disponibile
```

### Scadenze
```
DEMO:  3 dicembre 2027 (reminder: 3 nov 2027)
PROD:  Da definire
```

---

## 📝 Note Operative

### Database
- ✅ Tabelle RENTRI create
- ✅ Pronte per DEMO e PROD (stesso schema)
- ✅ Campo `sync_status` traccia ambiente
- 💡 Suggerimento: Aggiungere campo `environment` per distinguere

### Logging
- ✅ Console log attivi per debug
- 💡 In PROD: ridurre logging, usare monitoring
- 💡 Salvare transaction_id RENTRI per audit

### UI
- 💡 Aggiungere badge "DEMO" visibile in app
- 💡 Warning prima trasmissione PROD
- 💡 Colori diversi DEMO (blu) vs PROD (verde)

---

## ✅ Status Corrente

```
🟡 AMBIENTE: DEMO
🟢 GATEWAY: Operativo
🟢 CERTIFICATO: Valido
🟢 TABELLE DB: Create
🟢 MODULO UI: 70% completo
🟡 BACKEND API: Da implementare
🔴 PRODUZIONE: Non ancora configurata
```

---

## 🎯 Prossimi Step

### Short-term (DEMO)
1. ✅ ~~Setup certificato~~ **FATTO**
2. ✅ ~~Creare tabelle DB~~ **FATTO**
3. ✅ ~~Creare pagine UI~~ **FATTO**
4. ⏳ Implementare form
5. ⏳ Test trasmissione DEMO
6. ⏳ Validare risposte RENTRI

### Medium-term (Pre-PROD)
7. Richiedere certificato PRODUZIONE
8. Setup dual-environment
9. Test paralleli
10. Documentazione compliance

### Long-term (GO-LIVE)
11. Switch a PRODUZIONE
12. Monitoring continuo
13. Supporto operativo

---

## 📞 Supporto RENTRI

### Ambiente DEMO
- Documentazione: https://demo.rentri.gov.it/supporto
- Email: Supporto generico RENTRI
- Self-service: Portale DEMO

### Ambiente PRODUZIONE (futuro)
- Supporto diretto RENTRI
- Ticket prioritari
- Assistenza tecnica dedicata
- SLA garantiti

---

## 🎊 Reminder

**✅ DEMO è perfetto per**:
- Sviluppo
- Testing
- Training
- Validazione

**❌ DEMO NON è per**:
- Operatività reale
- Dati legali
- Compliance normativa
- Clienti finali

---

**📌 RICORDA: Siamo in DEMO. Prima di andare live serve certificato PRODUZIONE!**

---

**Creato da**: AI Assistant  
**Per**: RescueManager RENTRI Integration  
**Ambiente Attuale**: 🟡 DEMO

