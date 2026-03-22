# 🚀 RENTRI Fase 3 - Piano Integrazione Completa

**Inizio**: 3 Dicembre 2025, ore 19:00  
**Durata Stimata**: 18-26 ore (3-4 giorni)  
**Obiettivo**: Trasmissione reale FIR a RENTRI con firma digitale

---

## 📋 Componenti da Implementare

### 1. Backend API Trasmissione FIR (4-6 ore)
```
✅ Endpoint: POST /api/rentri/fir/trasmetti
✅ Input: fir_id (UUID locale)
✅ Output: { success, rentri_numero, rentri_id, stato }

Steps:
1. Carica FIR dal DB Supabase
2. Carica certificato org da rentri_org_certificates
3. Genera JWT con certificato
4. Trasforma dati in formato RENTRI (JSON)
5. POST a RENTRI API
6. Salva risposta nel DB
7. Return successo
```

### 2. Generazione XML xFIR (6-8 ore)
```
✅ Formato: XML secondo schema XSD RENTRI
✅ Struttura: DatiPartenza (produttore, trasportatore, destinatario, rifiuti)
✅ Validazione: Conformità schema RENTRI

Librerie:
- xmlbuilder2 (costruzione XML)
- xml2js (parsing se necessario)
```

### 3. Firma Digitale XAdES (6-8 ore)
```
✅ Tipo: XAdES-BES (Basic Electronic Signature)
✅ Certificato: .p12 da DB
✅ Formato: XML firmato secondo RENTRI

Librerie:
- node-forge (manipolazione certificati)
- xmldsig (firma XML)
- crypto (Node.js built-in)

Steps:
1. Carica certificato .p12
2. Estrai chiave privata + certificato pubblico
3. Genera XML xFIR
4. Firma XML con XAdES
5. POST firma a RENTRI
```

### 4. Polling Stati (2-3 ore)
```
✅ Endpoint: GET /api/rentri/fir/stato
✅ Cron: Ogni 5 minuti
✅ Update: Sync stato RENTRI → DB locale

Flow:
1. Query FIR con stato "trasmesso"
2. Per ogni FIR: GET /formulari/v1.0/{numero}
3. Leggi stato RENTRI
4. Update DB se cambiato
5. Notifica frontend (websocket/polling)
```

### 5. Gestione Errori (2-3 ore)
```
✅ Retry automatico (3 tentativi)
✅ Errori firma
✅ Errori RENTRI (validazione)
✅ Timeout
✅ Certificato scaduto
✅ Log dettagliati
```

### 6. Test e Debug (4-6 ore)
```
✅ Test con RENTRI DEMO
✅ Validazione risposta
✅ Test stati workflow
✅ Test errori
✅ Test multi-org
```

---

## 🛠️ Stack Tecnologico

### NPM Packages Necessari
```bash
# Firma digitale
npm install node-forge
npm install xmldsig
npm install @peculiar/x509

# XML
npm install xmlbuilder2
npm install fast-xml-parser

# Utility
npm install dayjs
npm install uuid
```

### Files da Creare
```
website/src/app/api/rentri/fir/
├── trasmetti/route.ts         (POST - trasmette FIR)
├── firma/route.ts             (POST - firma FIR)
├── stato/route.ts             (GET - legge stato)
├── annulla/route.ts           (POST - annulla FIR)
└── download/route.ts          (GET - download PDF)

website/src/lib/rentri/
├── fir-builder.ts             (Costruisce XML xFIR)
├── firma-xades.ts             (Firma digitale XAdES)
├── fir-validator.ts           (Valida FIR prima trasmissione)
└── stato-mapper.ts            (Mappa stati RENTRI → locali)

website/src/jobs/
└── sync-rentri-stati.ts       (Cron job polling stati)

desktop-app/.../src/hooks/
└── useFirTrasmissione.js      (Hook React per UI)
```

---

## 📊 Architettura

### Flow Completo

```
DESKTOP APP (Frontend)
  ↓ [Click "Trasmetti"]
  
WEBSITE BACKEND (/api/rentri/fir/trasmetti)
  ↓ [Carica FIR + Certificato]
  ↓ [Genera JWT]
  ↓ [Costruisce XML xFIR]
  ↓
RENTRI API (https://rentri-test.rescuemanager.eu)
  ↓ [Valida FIR]
  ↓ [Assegna numero]
  ↓ [Ritorna stato]
  ↓
WEBSITE BACKEND
  ↓ [Salva risposta]
  ↓ [Update DB]
  ↓
DESKTOP APP
  ↓ [Mostra "Trasmesso" ✅]
  
CRON JOB (ogni 5 min)
  ↓ [GET stato da RENTRI]
  ↓ [Update DB se cambiato]
  ↓ [Notifica frontend]
```

---

## 🎯 Piano Implementazione

### Sessione 1 (6-8 ore) - Backend Base
```
1. Setup librerie NPM
2. Endpoint trasmetti (senza firma)
3. Costruttore XML xFIR base
4. Test con RENTRI demo
5. Gestione errori base
```

### Sessione 2 (6-8 ore) - Firma Digitale
```
1. Implementa firma XAdES
2. Test firma con certificato .p12
3. Validazione firma
4. Integrazione endpoint trasmetti
5. Test completo con RENTRI
```

### Sessione 3 (4-6 ore) - Polling e UI
```
1. Cron job polling stati
2. Mapping stati RENTRI → locali
3. Notifiche frontend
4. UI aggiornamenti automatici
5. Test workflow completo
```

### Sessione 4 (2-4 ore) - Finalizzazione
```
1. Gestione errori avanzata
2. Retry logic
3. Logging
4. Documentazione
5. Test stress
```

---

## 🚀 Inizio Ora - Sessione 1

### Step 1: Verifico Certificato Disponibile

