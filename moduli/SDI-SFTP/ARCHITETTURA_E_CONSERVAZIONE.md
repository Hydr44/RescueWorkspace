# 🏗️ Architettura Sistema e Conservazione Fatture

**Data:** 14 gennaio 2026

---

## 🏢 Come Funziona il Sistema

### **Architettura Multi-Tenant**

Il sistema è **multi-tenant**: ogni organizzazione (azienda cliente) ha:
- I suoi dati azienda (Partita IVA, denominazione, indirizzo, ecc.)
- Le sue fatture
- I suoi clienti
- I suoi dati SDI (certificati, chiavi, configurazione)

### **Dati Azienda (Cedente/Prestatore)**

**Dove vengono salvati:**
1. **Settings/Configurazione azienda:**
   - Tabella `company_settings` (se presente)
   - Oppure caricati da configurazione organizzazione

2. **Nella fattura (invoice.meta.sdi.cedente_prestatore):**
   - Quando si crea/salva una fattura, i dati azienda vengono salvati nel campo `meta.sdi.cedente_prestatore`
   - Questo garantisce che ogni fattura abbia i dati dell'azienda emittente al momento della creazione

**Come funziona:**
- L'app carica i dati azienda dalle Settings
- Quando si crea una fattura, i dati azienda vengono inclusi in `invoice.meta.sdi.cedente_prestatore`
- La fattura viene firmata con i certificati dell'azienda cliente (non tuoi!)

---

## 📋 Chi Emette le Fatture?

### **Scenario 1: Piattaforma SaaS (Tu Offri il Servizio)**

Se la tua è una **piattaforma SaaS** che permette ad altre aziende di emettere fatture:

- ✅ **Ogni azienda cliente** emette fatture con i **suoi dati** (P.IVA, denominazione, ecc.)
- ✅ **Ogni azienda cliente** firma con i **suoi certificati** (P12, chiavi SDI)
- ✅ **La fattura è intestata all'azienda cliente**, non a te
- ✅ **Tu fornisci solo il servizio/software**

**Esempio:**
- Azienda "Rossi SRL" (P.IVA 12345678901) usa la tua piattaforma
- Rossi SRL emette una fattura n. 1/2026 a "Bianchi SPA"
- La fattura è intestata a "Rossi SRL", firmata da Rossi SRL
- Tu hai solo fornito il software/piattaforma

---

## 💾 Conservazione Dati - Obbligo 10 Anni

### **Chi Deve Conservare?**

**Regola generale:**
- ✅ **L'azienda che emette le fatture** (cedente/prestatore) deve conservare per 10 anni
- ⚠️ **La piattaforma SaaS** può conservare o meno, a seconda del contratto/servizio

### **Opzioni per la Conservazione:**

#### **1. Conservazione a Cura del Cliente (Consigliato)**

**Vantaggi:**
- ✅ L'azienda cliente è responsabile della conservazione
- ✅ Tu non devi conservare dati per 10 anni
- ✅ Meno responsabilità legale per te
- ✅ Meno costi di storage

**Come funziona:**
- L'azienda cliente esporta/scarica le fatture
- L'azienda cliente conserva le fatture (XML, PDF) per 10 anni
- Tu conservi solo per il periodo del servizio (es. mentre l'azienda è cliente)

#### **2. Conservazione a Cura della Piattaforma (Servizio Aggiuntivo)**

**Vantaggi:**
- ✅ Servizio aggiuntivo per il cliente
- ✅ Cliente non deve gestire conservazione

**Svantaggi:**
- ❌ Tu devi conservare dati per 10 anni
- ❌ Costi di storage elevati
- ❌ Responsabilità legale
- ❌ Deve essere un servizio a pagamento (non gratuito)

**Requisiti:**
- Sistema di conservazione conforme (es. Conservazione Elettronica Sostitutiva)
- Backup e disaster recovery
- Garanzia di integrità documentale
- Contratto con il cliente che specifica la conservazione

---

## 🔒 Responsabilità Legale

### **Se Offri Solo il Servizio/Software:**

**Tu NON sei responsabile per:**
- ❌ Validità fiscale delle fatture
- ❌ Correttezza dei dati inseriti dal cliente
- ❌ Conservazione delle fatture (se non offerta come servizio)

**Tu SEI responsabile per:**
- ✅ Funzionamento corretto del software
- ✅ Trasmissione corretta a SDI
- ✅ Sicurezza dei dati durante l'uso del servizio

### **Se Offri Conservazione:**

**Tu SEI responsabile per:**
- ✅ Conservazione conforme per 10 anni
- ✅ Integrità documentale
- ✅ Disponibilità e accessibilità dei documenti
- ✅ Conformità normativa (es. Conservazione Elettronica Sostitutiva)

---

## 💡 Raccomandazione

### **Per Piattaforma SaaS:**

1. ✅ **Conservazione a cura del cliente:**
   - Offri export/scaricamento fatture (XML, PDF)
   - L'azienda cliente conserva per 10 anni
   - Tu conservi solo durante il periodo di servizio

2. ⚠️ **Se vuoi offrire conservazione:**
   - Servizio a pagamento separato
   - Sistema di conservazione conforme
   - Contratto specifico con il cliente
   - Backup e disaster recovery

3. 📋 **Nel contratto con il cliente:**
   - Specificare chi conserva
   - Specificare durata conservazione da parte tua
   - Specificare modalità di export/scaricamento

---

## 🔍 Verifica Architettura Attuale

**Dal codice:**
- ✅ Sistema multi-tenant (org_id)
- ✅ Dati azienda salvati in `invoice.meta.sdi.cedente_prestatore`
- ✅ Ogni organizzazione ha i suoi dati
- ✅ Fatture firmate con certificati del cliente

**Cosa verificare:**
- ⏳ Export/scaricamento fatture implementato?
- ⏳ Periodo di conservazione dati definito?
- ⏳ Contratto con clienti che specifica conservazione?

---

**Status:** 📋 Analisi architettura - Raccomandazione: conservazione a cura del cliente
