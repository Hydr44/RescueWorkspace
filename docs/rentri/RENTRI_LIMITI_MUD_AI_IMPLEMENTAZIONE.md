# 📊 RENTRI - Sistema Limiti, MUD e Validazione IA

## 📋 Panoramica

Implementazione completa di tre funzionalità avanzate per il modulo RENTRI:
1. **Sistema Limiti Rifiuti Smaltibili** - Alert quando si supera il limite
2. **Gestione MUD (Modello Unico Dichiarazione)** - Struttura per dichiarazioni annuali
3. **Validazione IA Pre-Invio** - Controllo automatico con Intelligenza Artificiale prima della trasmissione

---

## 🎯 1. Sistema Limiti Rifiuti

### Database
**Tabella**: `rentri_limiti_rifiuti`

**Campi principali**:
- `org_id` - Organizzazione
- `anno` - Anno di riferimento
- `codice_eer` - Codice EER specifico (NULL per limite totale)
- `limite_quantita` - Quantità massima smaltibile
- `quantita_attuale` - Quantità attuale (calcolata automaticamente)
- `soglia_alert_percentuale` - Soglia per alert (default 80%)
- `alert_inviato` - Flag alert inviato

**Trigger automatico**: Aggiorna `quantita_attuale` quando un movimento viene trasmesso (`sync_status = 'trasmesso'`)

### API
**GET** `/api/rentri/limiti?org_id={id}&anno={anno}`
- Lista limiti con percentuale utilizzo calcolata
- Include flag `superato` e `alert_dovuto`

**POST** `/api/rentri/limiti`
- Crea/aggiorna limite per organizzazione/anno/codice_eer

### Utilizzo Frontend

```javascript
// Carica limiti
const response = await fetch(
  `${API_URL}/api/rentri/limiti?org_id=${orgId}&anno=${new Date().getFullYear()}`
);
const { limiti } = await response.json();

// Filtra limiti con alert
const limitiAlert = limiti.filter(l => l.alert_dovuto || l.superato);
```

### Integrazione Dashboard
Aggiungere sezione "Alert Limiti" nella `RifiutiDashboard.jsx` per visualizzare limiti superati o prossimi al limite.

---

## 📄 2. Modello Unico Dichiarazione (MUD)

### Database
**Tabella**: `rentri_mud`

**Campi principali**:
- `org_id` - Organizzazione
- `anno` - Anno di riferimento
- `stato` - 'bozza', 'in_completamento', 'completato', 'trasmesso'
- `data_inizio` / `data_fine` - Periodo riferimento
- `dati_mud` - JSONB con dati aggregati
- `totale_movimenti`, `totale_registri`, `totale_formulari`, `totale_quantita`
- `file_xml_url`, `file_pdf_url` - File generati
- `numero_protocollo`, `esito_trasmissione`

### Prossimi Passi
1. **API Route**: Creare `/api/rentri/mud` per:
   - Generazione MUD da movimenti/registri/formulari
   - Export XML/PDF
   - Trasmissione

2. **Componente UI**: Creare pagina per gestione MUD con:
   - Vista riepilogo annuale
   - Generazione MUD
   - Preview dati
   - Export e trasmissione

---

## 🤖 3. Validazione IA Pre-Invio

### Database
**Tabella**: `rentri_ai_validations`

**Campi principali**:
- `tipo_entita` - 'movimento', 'formulario', 'registro'
- `entita_id` - ID dell'entità validata
- `stato_validazione` - 'pending', 'ok', 'warning', 'error', 'confirmed'
- `alert_ia` - JSONB array di alert/avvisi
- `prompt_inviato`, `risposta_ia`, `analisi_ia` - Dati validazione
- `confermato_da`, `confermato_at`, `nota_conferma` - Conferma umana

**Formato Alert**:
```json
{
  "tipo": "error|warning|info",
  "campo": "nome_campo",
  "messaggio": "Descrizione problema",
  "severita": 1-10,
  "suggerimento": "Come correggere (opzionale)"
}
```

### API
**POST** `/api/rentri/ai-validate`

**Request**:
```json
{
  "tipo_entita": "movimento",
  "entita_id": "uuid",
  "org_id": "uuid",
  "dati_entita": { /* dati movimento/formulario/registro */ }
}
```

**Response**:
```json
{
  "success": true,
  "validation": {
    "stato": "ok|warning|error",
    "alert": [ /* array alert */ ],
    "validation_id": "uuid"
  }
}
```

### Componente UI
**File**: `src/components/rentri/AIValidationModal.jsx`

**Utilizzo**:
```jsx
import AIValidationModal from "../components/rentri/AIValidationModal";

function RifiutiMovimentoForm() {
  const [showAIValidation, setShowAIValidation] = useState(false);
  
  async function handleTrasmetti() {
    // Prima di trasmettere, valida con IA
    setShowAIValidation(true);
  }
  
  function handleAIConfirm(validationResult) {
    // L'utente ha confermato dopo aver visto gli alert IA
    // Procedi con trasmissione
    trasmettiMovimento();
  }
  
  return (
    <>
      <button onClick={handleTrasmetti}>Trasmetti a RENTRI</button>
      
      <AIValidationModal
        isOpen={showAIValidation}
        onClose={() => setShowAIValidation(false)}
        onConfirm={handleAIConfirm}
        tipoEntita="movimento"
        entitaId={movimentoId}
        orgId={orgId}
        datiEntita={formData}
      />
    </>
  );
}
```

### Integrazione nei Form

#### Movimenti
In `RifiutiMovimentoForm.jsx`, prima della trasmissione:
1. Aprire `AIValidationModal` con dati movimento
2. Mostrare alert IA all'utente
3. Se confermato, procedere con trasmissione

#### Formulari
In `RifiutiFormularioForm.jsx`, stesso pattern.

#### Registri
In `RifiutiRegistroForm.jsx`, stesso pattern.

### Controlli IA Implementati

#### Per Movimenti:
- ✅ Codice EER valido e coerente con descrizione
- ✅ Quantità ragionevole (non zero, non negativa, non eccessiva)
- ✅ Unità di misura coerente (kg per solidi, litri per liquidi)
- ✅ Causale operazione coerente con tipo operazione
- ✅ Data operazione coerente e non futura
- ✅ Provenienza corretta (U/S)
- ✅ Caratteristiche pericolo presenti se rifiuto pericoloso
- ✅ FIR riferimento presente se causale trasporto
- ✅ Coerenza quantità/codice EER (es: VFU > 1000 kg)
- ✅ Annotazioni non troppo lunghe (max 500 caratteri)

#### Per Formulari:
- ✅ Codici EER validi e coerenti
- ✅ Quantità ragionevoli per ogni codice EER
- ✅ Date trasporto coerenti
- ✅ Codici fiscali validi
- ✅ Dati produttore/destinatario/trasportatore completi
- ✅ Autorizzazione destinatario presente se richiesta

#### Per Registri:
- ✅ Anno valido (non futuro)
- ✅ Tipo registro coerente
- ✅ Unità locale presente se richiesta
- ✅ Autorizzazione presente e valida

---

## 🔧 Configurazione Richiesta

### Variabili Ambiente

**Backend (Vercel)**:
```bash
OPENAI_API_KEY=sk-... # Chiave API OpenAI
```

**Frontend**:
```bash
VITE_API_URL=https://rescuemanager.eu
```

### Database Migration

Eseguire la migrazione SQL:
```bash
# In Supabase Dashboard
# SQL Editor → Eseguire:
supabase/migrations/20250111_rentri_limiti_mud_ai.sql
```

---

## 📊 Workflow Completo

### 1. Creazione Movimento
```
Utente compila form → Clicca "Trasmetti" →
  ↓
Modal Validazione IA si apre →
  ↓
IA analizza dati →
  ↓
Mostra alert (se presenti) →
  ↓
Utente verifica e conferma →
  ↓
Movimento trasmesso a RENTRI →
  ↓
Trigger aggiorna quantita_attuale nei limiti →
  ↓
Se superato limite → Alert nella dashboard
```

### 2. Gestione Limiti
```
Admin configura limiti per org/anno →
  ↓
Sistema calcola quantita_attuale automaticamente →
  ↓
Se quantita_attuale >= soglia_alert_percentuale →
  ↓
Alert mostrato in dashboard →
  ↓
Admin può aggiornare limite se necessario
```

### 3. MUD Annuale
```
Fine anno →
  ↓
Genera MUD aggregando movimenti/registri/formulari →
  ↓
Export XML/PDF →
  ↓
Trasmissione (da implementare)
```

---

## ✅ Stato Implementazione

### Completato
- ✅ Migrazione SQL (limiti, MUD, validazione IA)
- ✅ API route validazione IA (`/api/rentri/ai-validate`)
- ✅ API route limiti (`/api/rentri/limiti`)
- ✅ Componente UI `AIValidationModal`
- ✅ Trigger automatico aggiornamento limiti

### Da Implementare
- ⏳ Integrazione `AIValidationModal` in `RifiutiMovimentoForm`
- ⏳ Integrazione `AIValidationModal` in `RifiutiFormularioForm`
- ⏳ Integrazione `AIValidationModal` in `RifiutiRegistroForm`
- ⏳ Sezione alert limiti in `RifiutiDashboard`
- ⏳ API route MUD (`/api/rentri/mud`)
- ⏳ Pagina gestione MUD
- ⏳ Generazione file XML/PDF MUD
- ⏳ Sistema notifiche alert limiti (email/push)

---

## 🎯 Prossimi Passi

1. **Integrare Validazione IA nei Form**:
   - Modificare `handleTrasmetti` in `RifiutiMovimentoForm.jsx`
   - Aggiungere `AIValidationModal` prima della trasmissione

2. **Dashboard Alert Limiti**:
   - Aggiungere sezione in `RifiutiDashboard.jsx`
   - Mostrare limiti prossimi/superati
   - Link a gestione limiti

3. **Completare MUD**:
   - Implementare aggregazione dati
   - Generazione XML/PDF
   - UI gestione MUD

4. **Notifiche**:
   - Alert email quando limite superato
   - Notifiche in-app per validazioni IA critiche

