# 🏢 Architettura Multi-Tenant RENTRI

**Data**: 3 Dicembre 2025  
**Versione**: 1.0  
**Status**: ✅ Pronto per Implementazione

---

## 🎯 Obiettivo

Permettere a **RescueManager** di gestire **più aziende clienti**, ognuna con il proprio certificato RENTRI e identificazione separata.

---

## 📊 Architettura Overview

```
RescueManager (Software SaaS)
│
├── Organizzazione 1: Officina Rossi
│   ├── org_id: aaa-111-bbb
│   ├── CF: RSSMRA70A01H501Z
│   ├── Certificato RENTRI: cert_demo.p12
│   ├── Certificato RENTRI: cert_prod.p12
│   └── Dati: registri, movimenti, formulari
│
├── Organizzazione 2: Carrozzeria Bianchi
│   ├── org_id: ccc-222-ddd
│   ├── CF: BNCGPP80B02F205W
│   ├── Certificato RENTRI: cert_demo.p12
│   └── Dati: registri, movimenti, formulari
│
└── Organizzazione 3: RescueManager (tua azienda)
    ├── org_id: eee-333-fff
    ├── CF: SCZMNL05L21D960T
    ├── Certificato RENTRI DEMO: ✅ Attivo
    ├── Certificato RENTRI PROD: Da richiedere
    └── Dati: registri, movimenti, formulari
```

---

## 🗄️ Database Schema

### Tabella Principale: `rentri_org_certificates`

```sql
CREATE TABLE rentri_org_certificates (
  id UUID PRIMARY KEY,
  org_id UUID REFERENCES orgs(id), -- Identificativo azienda
  
  -- Identificazione RENTRI
  cf_operatore VARCHAR(16),  -- Es: SCZMNL05L21D960T
  ragione_sociale VARCHAR(255),
  rentri_id VARCHAR(100),    -- Es: RENTRI-100011134
  
  -- Certificato (PEM format)
  certificate_pem TEXT,      -- Certificato pubblico
  private_key_pem TEXT,      -- Chiave privata (encrypted at rest)
  ca_chain_pem TEXT,         -- CA chain
  certificate_password TEXT, -- Password (encrypted)
  
  -- Ambiente
  environment VARCHAR(10),   -- 'demo' o 'prod'
  
  -- Validità
  issued_at TIMESTAMP,
  expires_at TIMESTAMP,
  
  -- Status
  is_active BOOLEAN,
  is_default BOOLEAN,        -- Un solo default per org+environment
  
  -- Audit
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### Tabelle Collegate

```sql
-- Aggiungi certificate_id alle tabelle esistenti
ALTER TABLE rentri_registri 
  ADD COLUMN certificate_id UUID REFERENCES rentri_org_certificates(id);

ALTER TABLE rentri_movimenti 
  ADD COLUMN certificate_id UUID;

ALTER TABLE rentri_formulari 
  ADD COLUMN certificate_id UUID;

-- Aggiungi campo environment
ALTER TABLE rentri_registri ADD COLUMN environment VARCHAR(10);
ALTER TABLE rentri_movimenti ADD COLUMN environment VARCHAR(10);
ALTER TABLE rentri_formulari ADD COLUMN environment VARCHAR(10);
```

---

## 🔄 Flusso Operativo

### 1. Setup Iniziale (Per Ogni Cliente)

#### A. Cliente Registra su RENTRI

```
1. Cliente va su https://demo.rentri.gov.it (o www.rentri.gov.it)
2. Registrazione come operatore
3. Inserisce dati azienda (CF, Ragione Sociale, etc.)
4. Richiede certificato di dominio
5. Scarica file .p12 con password
```

#### B. Configurazione in RescueManager

```
1. Cliente/Admin accede a RescueManager
2. Impostazioni → Rifiuti RENTRI → Certificati
3. Click "Aggiungi Certificato"
4. Upload file .p12
5. Inserisce password certificato
6. Seleziona ambiente (DEMO o PROD)
7. Salva
8. Sistema estrae: certificate_pem, private_key_pem, ca_chain_pem
9. Salva in rentri_org_certificates associato a org_id
10. Imposta come default se è il primo
```

### 2. Utilizzo Operativo

#### Quando Cliente Crea Registro/Movimento/FIR

```javascript
// 1. Recupera certificato attivo dell'org
const cert = await getActiveCertificate(currentOrg, 'demo');

// 2. Genera JWT firmato con certificato dell'org
const jwt = await generateJWT({
  privateKey: cert.private_key_pem,
  certificate: cert.certificate_pem,
  issuer: cert.cf_operatore,  // ← CF del cliente!
  audience: 'rentrigov.demo.api'
});

// 3. Chiama API RENTRI con JWT del cliente
const response = await fetch('https://rentri-test.rescuemanager.eu/...', {
  headers: {
    'Authorization': `Bearer ${jwt}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(data)
});

// 4. RENTRI riceve dati intestati al CF del cliente ✅
```

#### Salvataggio nel Database

```javascript
await supabase.from('rentri_registri').insert({
  org_id: currentOrg,           // ID azienda in RescueManager
  certificate_id: cert.id,      // Certificato usato
  environment: 'demo',          // Ambiente usato
  cf_operatore: cert.cf_operatore, // CF per riferimento
  // ... altri dati
});
```

---

## 🔐 Sicurezza

### Encryption at Rest

**Problema**: Certificati e chiavi private sono dati sensibili.

**Soluzione** (da implementare Fase 2):

```javascript
// 1. Encryption lato client prima di salvare
import { encrypt, decrypt } from '@/lib/crypto';

const encryptedKey = await encrypt(privateKeyPem, masterKey);
const encryptedPassword = await encrypt(password, masterKey);

await supabase.from('rentri_org_certificates').insert({
  private_key_pem: encryptedKey,
  certificate_password: encryptedPassword,
  // ...
});

// 2. Decryption quando serve
const cert = await getActiveCertificate(orgId);
const decryptedKey = await decrypt(cert.private_key_pem, masterKey);
```

**Master Key**: Può essere:
- Variabile ambiente (RENTRI_MASTER_KEY)
- Derivata da org_id + secret
- Gestita da KMS (AWS, Azure)

### RLS Policies

```sql
-- Solo utenti dell'org vedono i propri certificati
CREATE POLICY "org_certificates_select"
  ON rentri_org_certificates FOR SELECT
  USING (org_id IN (
    SELECT org_id FROM org_members WHERE user_id = auth.uid()
  ));

-- Solo admin possono modificare
CREATE POLICY "org_certificates_admin"
  ON rentri_org_certificates FOR ALL
  USING (
    org_id IN (
      SELECT org_id FROM org_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );
```

---

## 🔄 Gestione Ambienti DEMO vs PROD

### Doppio Certificato per Org

Ogni org può avere:
- **1 certificato DEMO** (per test)
- **1 certificato PROD** (per operatività reale)

```javascript
// Selezione automatica in base a modalità
const environment = userSettings.rentri_use_production ? 'prod' : 'demo';
const cert = await getActiveCertificate(orgId, environment);
```

### Toggle DEMO/PROD in UI

```jsx
// In Settings o Dashboard
<div>
  <label>Modalità RENTRI</label>
  <select value={mode} onChange={e => setMode(e.target.value)}>
    <option value="demo">🧪 DEMO (Test)</option>
    <option value="prod">🚀 PRODUZIONE (Reale)</option>
  </select>
</div>

{mode === 'prod' && (
  <div className="warning">
    ⚠️ Modalità PRODUZIONE: I dati trasmessi hanno valore legale!
  </div>
)}
```

---

## 🔔 Notifiche Scadenza

### Funzione di Check Automatico

```sql
-- Trova certificati in scadenza (30gg)
SELECT * FROM check_expiring_rentri_certificates(30);
```

### Cron Job (da implementare)

```javascript
// Esegui ogni giorno
async function checkExpiringCertificates() {
  const expiring = await rentriCert.getExpiringCertificates(30);
  
  for (const cert of expiring) {
    // Invia email/notifica
    await sendNotification({
      to: cert.org_id,
      subject: `Certificato RENTRI in scadenza (${cert.days_remaining} giorni)`,
      body: `Il certificato RENTRI di ${cert.org_name} scadrà il ${cert.expires_at}...`
    });
    
    // Marca come notificato
    await supabase
      .from('rentri_org_certificates')
      .update({ expiry_notified_at: new Date() })
      .eq('id', cert.id);
  }
}
```

---

## 🚀 Flow Trasmissione Dati

### Step-by-Step

```
┌─────────────────────────────────────────────────┐
│ 1. Utente crea Movimento/FIR in Desktop App    │
│    org_id: aaa-111-bbb (Officina Rossi)        │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ 2. Sistema recupera certificato attivo         │
│    SELECT * FROM rentri_org_certificates       │
│    WHERE org_id = 'aaa-111-bbb'                │
│    AND environment = 'demo'                     │
│    AND is_default = true                        │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ 3. Genera JWT con certificato cliente          │
│    issuer: RSSMRA70A01H501Z ← CF del cliente!  │
│    x5c: [base64(certificato cliente)]          │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ 4. Chiama API RENTRI tramite Gateway           │
│    POST rentri-test.rescuemanager.eu/...       │
│    Authorization: Bearer <JWT_CLIENTE>          │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ 5. Gateway VPS (Nginx)                         │
│    - Aggiunge mTLS con cert gateway            │
│    - Passa JWT cliente nel header              │
│    - Proxy a demoapi.rentri.gov.it             │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ 6. RENTRI Riceve                                │
│    - JWT issuer: RSSMRA70A01H501Z              │
│    - RENTRI sa: dati sono di Officina Rossi!   │
│    - Registra movimento intestato al cliente   │
└─────────────────────────────────────────────────┘
```

**Risultato**: ✅ Ogni cliente identificato correttamente su RENTRI!

---

## 🔧 Implementazione Backend

### API Gateway Enhancement

**File**: `website/src/app/api/rentri/[...path]/route.ts`

```typescript
export async function POST(request: Request) {
  // 1. Autentica utente
  const session = await getServerSession();
  const orgId = session.user.currentOrg;
  
  // 2. Recupera certificato org
  const cert = await getActiveCertificate(orgId, 'demo');
  
  // 3. Genera JWT con certificato org
  const jwt = await generateJWT({
    privateKey: cert.private_key_pem,
    certificate: cert.certificate_pem,
    issuer: cert.cf_operatore,  // ← CF del cliente
    audience: 'rentrigov.demo.api'
  });
  
  // 4. Proxy a RENTRI con JWT cliente
  const rentriResponse = await fetch(
    `https://rentri-test.rescuemanager.eu${request.url}`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${jwt}`,
        'Content-Type': 'application/json'
      },
      body: await request.text()
    }
  );
  
  return rentriResponse;
}
```

---

## 📋 User Journey: Nuovo Cliente

### Scenario: Nuova Officina si Iscrive

```
Giorno 1: Registrazione RescueManager
  ├── Cliente crea account su rescuemanager.eu
  ├── Crea organizzazione "Officina Rossi"
  ├── org_id generato: aaa-111-bbb
  └── Accesso a dashboard ✅

Giorno 2: Setup RENTRI (DEMO per test)
  ├── Cliente va su demo.rentri.gov.it
  ├── Registra azienda su RENTRI
  ├── CF: RSSMRA70A01H501Z
  ├── Richiede certificato DEMO
  ├── Scarica RSSMRA70A01H501Z_demo.p12
  └── Password: abc123xyz

Giorno 3: Configurazione RescueManager
  ├── Cliente accede a RescueManager
  ├── Rifiuti RENTRI → Certificati
  ├── Click "Aggiungi Certificato"
  ├── Upload .p12, inserisce password
  ├── Seleziona "DEMO"
  ├── Sistema salva in rentri_org_certificates
  └── Certificato attivo ✅

Giorno 4-30: Uso DEMO
  ├── Cliente usa modulo Rifiuti
  ├── Crea registri, movimenti, FIR
  ├── Trasmette a RENTRI DEMO
  ├── Test funzionalità
  └── Training team

Giorno 30+: Passaggio PRODUZIONE
  ├── Cliente richiede certificato PROD su www.rentri.gov.it
  ├── Scarica RSSMRA70A01H501Z_prod.p12
  ├── Carica in RescueManager (ambiente PROD)
  ├── Toggle modalità da DEMO a PROD
  ├── Inizia operatività reale
  └── Dati hanno valore legale ✅
```

---

## 🔀 Isolamento Dati

### Separazione per Org

**RLS Policies** garantiscono che:
```sql
-- Ogni org vede solo i propri dati
WHERE org_id IN (
  SELECT org_id FROM org_members WHERE user_id = auth.uid()
)
```

**Trasmissione a RENTRI**:
- Org A trasmette con cert A → RENTRI registra su operatore A
- Org B trasmette con cert B → RENTRI registra su operatore B
- **Nessuna commistione!** ✅

---

## 💰 Modello Business

### Opzione 1: Certificato Cliente

**Cliente fornisce**: Suo certificato RENTRI  
**RescueManager**: Solo software e gateway  
**Responsabilità**: Del cliente

**Pro**:
- ✅ Compliance piena
- ✅ Cliente è proprietario dati
- ✅ Nessuna responsabilità per te

**Contro**:
- ⚠️ Cliente deve registrarsi su RENTRI
- ⚠️ Setup più complesso

---

### Opzione 2: Certificato Condiviso (NON RACCOMANDATO)

**Cliente usa**: TUO certificato (SCZMNL05L21D960T)  
**RENTRI vede**: Tutti dati intestati a te

**Pro**:
- ✅ Setup semplice per cliente
- ✅ Un solo certificato da gestire

**Contro**:
- ❌ Tutti dati intestati a te (rischio legale!)
- ❌ Non conforme normativa
- ❌ Responsabilità penale su di te
- ❌ Non tracciabilità per cliente
- ❌ **ILLEGALE** per compliance

**Conclusione**: ❌ **MAI USARE**

---

## 📊 Comparazione Modelli

| Aspetto | Certificato per Cliente | Certificato Condiviso |
|---------|-------------------------|----------------------|
| **Compliance** | ✅ Conforme | ❌ Non conforme |
| **Responsabilità** | ✅ Del cliente | ❌ Tua |
| **Tracciabilità** | ✅ Per cliente | ❌ Tutto a te |
| **Setup** | ⚠️ Complesso | ✅ Semplice |
| **Costo** | ✅ Nessuno extra | ✅ Nessuno extra |
| **Legale** | ✅ OK | ❌ Illegale |
| **GDPR** | ✅ Conforme | ❌ Problematico |

**Scelta obbligata**: ✅ **Certificato per Cliente**

---

## 🎨 UI/UX Multi-Certificato

### Dashboard Rifiuti

```jsx
// Mostra quale certificato è attivo
<div className="certificate-status">
  <FiShield className="h-4 w-4" />
  <span>Certificato: {activeCert.ragione_sociale}</span>
  <span className="badge">🧪 DEMO</span>
</div>
```

### Settings → Certificati RENTRI

```
📋 Lista Certificati
├── [⭐ Default] DEMO - SCOZZARINI EMMANUEL (scade 3 dic 2027)
├── [ ] PROD - SCOZZARINI EMMANUEL (da caricare)
└── [+ Aggiungi Certificato]

Per ogni certificato:
├── Ragione sociale
├── CF operatore
├── Ambiente (DEMO/PROD)
├── Scadenza
├── Status (attivo/scaduto/in scadenza)
└── Azioni (imposta default, disattiva, elimina)
```

### Warning Scadenza

```jsx
{expiringCerts.length > 0 && (
  <Alert type="warning">
    ⚠️ {expiringCerts.length} certificato/i in scadenza!
    <Link to="/rifiuti/certificati">Visualizza</Link>
  </Alert>
)}
```

---

## 🧪 Testing Multi-Tenant

### Test Case 1: Singola Org

```
1. Crea org: "Test Azienda"
2. Aggiungi certificato DEMO
3. Crea registro
4. Verifica: usa certificato corretto
5. Trasmetti a RENTRI
6. Controlla su portale RENTRI: dati intestati all'org
```

### Test Case 2: Due Org Diverse

```
1. Crea org A: "Officina Rossi" (CF: AAA)
2. Aggiungi certificato A
3. Crea org B: "Carrozzeria Bianchi" (CF: BBB)
4. Aggiungi certificato B
5. Login come org A → crea movimento
6. Login come org B → crea movimento
7. Verifica: movimenti separati
8. Trasmetti entrambi
9. Controlla RENTRI: dati separati per CF diversi ✅
```

### Test Case 3: DEMO + PROD

```
1. Org con certificato DEMO
2. Aggiungi certificato PROD (stesso CF)
3. Toggle modalità DEMO
4. Crea registro → usa cert DEMO
5. Toggle modalità PROD
6. Crea registro → usa cert PROD
7. Verifica: 2 registri separati per ambiente
```

---

## 📅 Roadmap Implementazione

### Fase 1: Fondamenta (✅ COMPLETATA)
- [x] Tabella rentri_org_certificates
- [x] Funzioni helper (get, list, add, set default)
- [x] Pagina UI gestione certificati
- [x] Routes configurate
- [x] Documentazione

### Fase 2: Upload & Parsing (4-6 ore)
- [ ] Backend API upload .p12
- [ ] Parsing .p12 con openssl
- [ ] Estrazione cert/key/chain
- [ ] Encryption at rest
- [ ] Validazione certificato

### Fase 3: Integrazione API (3-4 ore)
- [ ] Selezione automatica cert per org
- [ ] Generazione JWT per org
- [ ] Proxy API con JWT corretto
- [ ] Gestione errori per org
- [ ] Logging per org

### Fase 4: UX Avanzata (2-3 ore)
- [ ] Toggle DEMO/PROD in UI
- [ ] Warning scadenze
- [ ] Notifiche email scadenza
- [ ] Wizard setup certificato
- [ ] Guida interattiva

---

## ✅ Checklist Go-Live Multi-Tenant

### Prerequisiti
- [x] Tabella certificati creata
- [x] RLS policies attive
- [x] UI gestione certificati
- [ ] Backend parsing .p12
- [ ] Encryption layer
- [ ] Test multi-org

### Per Ogni Cliente
- [ ] Cliente registrato su RENTRI
- [ ] Certificato DEMO caricato
- [ ] Test trasmissione DEMO
- [ ] Certificato PROD caricato
- [ ] Test trasmissione PROD
- [ ] Training completato

### Monitoring
- [ ] Dashboard certificati scaduti
- [ ] Alerting 30gg prima scadenza
- [ ] Backup certificati
- [ ] Audit log trasmissioni

---

## 📝 Note Importanti

### 🔒 Sicurezza Certificati

1. **MAI** committare certificati su Git
2. **SEMPRE** encrypt chiavi private at rest
3. **SEMPRE** HTTPS per trasmissione
4. **Backup** sicuro di tutti i certificati
5. **Rinnovo** 30gg prima scadenza

### 📋 Compliance

1. **Ogni azienda** = 1 certificato RENTRI
2. **Trasmissioni** intestate al CF corretto
3. **Audit log** completo per org
4. **Separazione dati** garantita da RLS
5. **GDPR** compliant (data ownership)

### 🎯 Best Practices

1. **Default certificato**: Sempre uno solo per ambiente
2. **Scadenze**: Monitor continuo, notifiche 30gg prima
3. **Backup**: Certificati in storage sicuro
4. **Test**: Sempre DEMO prima di PROD
5. **Documentazione**: Guida per ogni cliente

---

## 🎊 Risultato

**Architettura Multi-Tenant RENTRI completa e pronta!**

✅ Database schema  
✅ Helper functions  
✅ UI gestione certificati  
✅ Documentazione completa  
✅ Sicurezza RLS  
✅ Flow operativo chiaro  

**Pronto per**: Sviluppo Fase 2 (upload .p12 automatico)

---

**Creato da**: AI Assistant  
**Per**: RescueManager Multi-Tenant RENTRI  
**Data**: 3 Dicembre 2025  
**Versione**: 1.0

