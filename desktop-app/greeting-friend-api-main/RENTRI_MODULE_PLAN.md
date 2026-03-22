# 🗑️ Modulo Rifiuti RENTRI - Piano Implementazione

**Data**: 3 Dicembre 2025  
**Obiettivo**: Integrare la gestione rifiuti con RENTRI nella desktop app

---

## 📋 Panoramica

Il modulo Rifiuti RENTRI permette di:
- 📖 Gestire **Registri Cronologici** (carico/scarico rifiuti)
- 🚛 Creare e gestire **Formulari** (FIR - Formulario Identificazione Rifiuti)
- ⚖️ Registrare **Movimenti** di carico e scarico
- 📄 **Vidimazione** formulari e registri
- 🔄 **Sincronizzazione** automatica con portale RENTRI

---

## 🎯 Struttura Modulo

### 1. Sezione Sidebar
Aggiungere nella sezione "OPERATIVO":

```jsx
{
  label: "OPERATIVO",
  items: [
    { to: "/",           icon: FiHome,      label: "Dashboard" },
    { to: "/trasporti",  icon: FiTruck,     label: "Trasporti" },
    { to: "/demolizioni-rvfu", icon: FiShield,   label: "Demolizioni RVFU" },
    { to: "/rifiuti",    icon: FiTrash2,    label: "Rifiuti RENTRI" }, // NUOVO
    { to: "/calendario", icon: FiCalendar,  label: "Calendario" },
    { to: "/notifiche",  icon: FiBell,      label: "Notifiche" },
  ],
}
```

### 2. Pagine da Creare

#### 📁 `/src/pages/RifiutiDashboard.jsx`
**Rotta**: `/rifiuti`

Dashboard principale con:
- Card riassuntive (registri attivi, movimenti mese, FIR da trasmettere)
- Grafici movimenti rifiuti
- Stato sincronizzazione RENTRI
- Azioni rapide (nuovo movimento, nuovo FIR)

---

#### 📁 `/src/pages/RifiutiRegistri.jsx`
**Rotta**: `/rifiuti/registri`

Lista registri cronologici:
- Tabella con filtri (anno, stato, tipo registro)
- Azioni: Visualizza, Modifica, Vidima, Scarica XML
- Stato vidimazione e sincronizzazione

---

#### 📁 `/src/pages/RifiutiRegistroForm.jsx`
**Rotte**: 
- `/rifiuti/registri/nuovo` (creazione)
- `/rifiuti/registri/:id` (modifica)

Form per:
- Dati intestazione registro
- Autorizzazioni
- Configurazione unità locale
- Selezione codici EER (rifiuti)

---

#### 📁 `/src/pages/RifiutiMovimenti.jsx`
**Rotta**: `/rifiuti/movimenti`

Gestione movimenti carico/scarico:
- Lista movimenti con filtri (data, tipo, codice EER)
- Form inline per nuovo movimento
- Esportazione verso RENTRI
- Stato trasmissione

---

#### 📁 `/src/pages/RifiutiMovimentoForm.jsx`
**Rotte**:
- `/rifiuti/movimenti/nuovo` (creazione)
- `/rifiuti/movimenti/:id` (modifica)

Form dettagliato movimento:
- Tipo operazione (carico/scarico)
- Codice EER (rifiuto)
- Quantità e unità misura
- Data operazione
- Riferimenti (FIR, trasportatore, ecc.)

---

#### 📁 `/src/pages/RifiutiFormulari.jsx`
**Rotta**: `/rifiuti/formulari`

Gestione Formulari (FIR):
- Lista FIR con stati (bozza, trasmesso, accettato, rifiutato)
- Filtri (data, produttore, destinatario, trasportatore)
- Azioni: Visualizza, Modifica, Trasmetti, Annulla, Stampa

---

#### 📁 `/src/pages/RifiutiFormularioForm.jsx`
**Rotte**:
- `/rifiuti/formulari/nuovo` (creazione)
- `/rifiuti/formulari/:id` (modifica/visualizzazione)

Form completo FIR:
- **Sezione 1**: Produttore/Detentore
- **Sezione 2**: Trasportatore
- **Sezione 3**: Destinatario
- **Sezione 4**: Rifiuti (codici EER, quantità, caratteristiche)
- **Sezione 5**: Date e firme
- Generazione PDF anteprima

---

#### 📁 `/src/pages/RifiutiCodifiche.jsx`
**Rotta**: `/rifiuti/codifiche`

Consultazione codifiche RENTRI:
- Ricerca codici EER (rifiuti)
- Operazioni ammesse
- Caratteristiche rifiuti
- Cache locale per uso offline

---

### 3. Componenti Condivisi

#### `/src/components/rentri/RentriStatusBadge.jsx`
Badge per stato sincronizzazione:
```jsx
<RentriStatusBadge status="synced" />      // Verde
<RentriStatusBadge status="pending" />     // Giallo
<RentriStatusBadge status="error" />       // Rosso
<RentriStatusBadge status="offline" />     // Grigio
```

#### `/src/components/rentri/RifiutoCodePicker.jsx`
Picker per codici EER:
```jsx
<RifiutoCodePicker 
  value={codiceEER}
  onChange={setCodiceEER}
  categoria="pericoloso" // opzionale
/>
```

#### `/src/components/rentri/MovimentoQuickForm.jsx`
Form rapido per movimento:
```jsx
<MovimentoQuickForm 
  registroId={registroId}
  onSave={handleSave}
/>
```

#### `/src/components/rentri/FormularioPreview.jsx`
Anteprima PDF formulario:
```jsx
<FormularioPreview 
  formularioId={id}
  onDownload={handleDownload}
/>
```

---

## 🔌 Integrazione API

### `/src/lib/rentri-api.js`
Wrapper per chiamate RENTRI via gateway:

```javascript
// Configurazione
const RENTRI_GATEWAY = process.env.VITE_RENTRI_GATEWAY_URL || 
                       'https://rescuemanager.eu/api/rentri';

// Funzioni principali
export async function fetchRegistri(filters) { ... }
export async function createRegistro(data) { ... }
export async function fetchMovimenti(registroId, filters) { ... }
export async function createMovimento(registroId, data) { ... }
export async function fetchFormulari(filters) { ... }
export async function createFormulario(data) { ... }
export async function trasmittiFormulario(id) { ... }
export async function fetchCodifiche(tabella, params) { ... }
```

---

## 📊 Database Schema (Supabase)

### Tabella `rentri_registri`
```sql
CREATE TABLE rentri_registri (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES orgs(id) ON DELETE CASCADE,
  anno INTEGER NOT NULL,
  tipo VARCHAR(50) NOT NULL, -- 'carico', 'scarico', 'carico_scarico'
  numero_registro VARCHAR(100),
  stato VARCHAR(30) DEFAULT 'bozza', -- 'bozza', 'attivo', 'vidimato', 'chiuso'
  unita_locale VARCHAR(100),
  autorizzazione VARCHAR(200),
  vidimato_at TIMESTAMP,
  rentri_id VARCHAR(100), -- ID del registro su RENTRI
  sync_status VARCHAR(30) DEFAULT 'pending', -- 'pending', 'synced', 'error'
  sync_at TIMESTAMP,
  sync_error TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_rentri_registri_org ON rentri_registri(org_id);
CREATE INDEX idx_rentri_registri_anno ON rentri_registri(anno);
```

### Tabella `rentri_movimenti`
```sql
CREATE TABLE rentri_movimenti (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES orgs(id) ON DELETE CASCADE,
  registro_id UUID REFERENCES rentri_registri(id) ON DELETE CASCADE,
  tipo_operazione VARCHAR(20) NOT NULL, -- 'carico', 'scarico'
  data_operazione DATE NOT NULL,
  numero_riga INTEGER,
  codice_eer VARCHAR(10) NOT NULL, -- Codice rifiuto
  descrizione TEXT,
  quantita DECIMAL(12, 3) NOT NULL,
  unita_misura VARCHAR(10) NOT NULL, -- 'kg', 't', 'm3', 'l'
  provenienza_destinazione VARCHAR(255),
  riferimento_fir VARCHAR(100), -- Riferimento formulario
  note TEXT,
  rentri_id VARCHAR(100),
  sync_status VARCHAR(30) DEFAULT 'pending',
  sync_at TIMESTAMP,
  sync_error TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_rentri_movimenti_org ON rentri_movimenti(org_id);
CREATE INDEX idx_rentri_movimenti_registro ON rentri_movimenti(registro_id);
CREATE INDEX idx_rentri_movimenti_data ON rentri_movimenti(data_operazione);
```

### Tabella `rentri_formulari`
```sql
CREATE TABLE rentri_formulari (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES orgs(id) ON DELETE CASCADE,
  numero_fir VARCHAR(50),
  anno INTEGER,
  data_creazione DATE NOT NULL,
  
  -- Produttore
  produttore_cf VARCHAR(16),
  produttore_nome VARCHAR(255),
  produttore_indirizzo TEXT,
  
  -- Trasportatore
  trasportatore_cf VARCHAR(16),
  trasportatore_nome VARCHAR(255),
  trasportatore_targa VARCHAR(20),
  
  -- Destinatario
  destinatario_cf VARCHAR(16),
  destinatario_nome VARCHAR(255),
  destinatario_indirizzo TEXT,
  
  -- Rifiuti
  codici_eer JSONB, -- Array di {codice, descrizione, quantita, unita}
  
  -- Date
  data_inizio_trasporto TIMESTAMP,
  data_fine_trasporto TIMESTAMP,
  data_accettazione TIMESTAMP,
  
  -- Stati
  stato VARCHAR(30) DEFAULT 'bozza', -- 'bozza', 'trasmesso', 'accettato', 'rifiutato', 'annullato'
  
  -- RENTRI
  rentri_id VARCHAR(100),
  rentri_numero VARCHAR(100), -- Numero assegnato da RENTRI
  pdf_url TEXT, -- URL PDF generato
  
  sync_status VARCHAR(30) DEFAULT 'pending',
  sync_at TIMESTAMP,
  sync_error TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_rentri_formulari_org ON rentri_formulari(org_id);
CREATE INDEX idx_rentri_formulari_stato ON rentri_formulari(stato);
CREATE INDEX idx_rentri_formulari_data ON rentri_formulari(data_creazione);
```

### Tabella `rentri_codifiche` (cache)
```sql
CREATE TABLE rentri_codifiche (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tabella VARCHAR(50) NOT NULL, -- 'Paesi', 'CodiciEER', 'UnitaMisura', ecc.
  codice VARCHAR(50) NOT NULL,
  descrizione TEXT,
  data JSONB, -- Dati completi della codifica
  cached_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(tabella, codice)
);

CREATE INDEX idx_rentri_codifiche_tabella ON rentri_codifiche(tabella);
```

---

## 🔄 Flussi Operativi

### Flusso 1: Creazione Registro
1. Utente crea nuovo registro (`/rifiuti/registri/nuovo`)
2. Compila dati intestazione
3. Salva in locale (`rentri_registri`)
4. [Opzionale] Sincronizza con RENTRI
5. Vidimazione registro quando pronto

### Flusso 2: Registrazione Movimento
1. Utente accede a registro
2. Crea nuovo movimento carico/scarico
3. Seleziona codice EER
4. Inserisce quantità e riferimenti
5. Salva movimento
6. [Batch] Trasmissione movimenti a RENTRI

### Flusso 3: Creazione Formulario (FIR)
1. Utente crea nuovo formulario
2. Compila sezioni (produttore, trasportatore, destinatario, rifiuti)
3. Genera anteprima PDF
4. Trasmette a RENTRI
5. Monitora stato accettazione
6. Stampa copia conforme

---

## 🎨 UI/UX

### Design System
- Seguire pattern esistenti (Transports, Demolizioni RVFU)
- Card con shadow per contenuti principali
- Badge colorati per stati
- Modal per form rapidi
- Toast per feedback operazioni

### Colori Stati
- 🟢 **Verde**: Sincronizzato, Accettato, Vidimato
- 🟡 **Giallo**: Pending, In attesa, Bozza
- 🔴 **Rosso**: Errore, Rifiutato, Scaduto
- ⚪ **Grigio**: Offline, Disabilitato, Archiviato

---

## 🚀 Priorità Implementazione

### Fase 1: MVP (Priorità Alta) ✅
1. ✅ Dashboard rifiuti base
2. ✅ Lista registri
3. ✅ Form nuovo registro
4. ✅ Lista movimenti
5. ✅ Form nuovo movimento
6. ✅ Integrazione API RENTRI base

### Fase 2: Formulari (Priorità Media)
7. Lista formulari
8. Form completo FIR
9. Trasmissione RENTRI
10. Generazione PDF

### Fase 3: Avanzate (Priorità Bassa)
11. Vidimazione registri
12. Codifiche offline
13. Esportazione Excel
14. Statistiche avanzate

---

## 📝 Note Tecniche

### Autenticazione RENTRI
Le chiamate API passano attraverso il gateway web (`rescuemanager.eu/api/rentri`) che gestisce:
- JWT authentication
- mTLS handshake
- Rate limiting
- Error handling

### Offline-First
- Salvataggio locale prioritario
- Sincronizzazione asincrona batch
- Coda operazioni pending
- Retry automatico errori temporanei

### Performance
- Lazy loading pagine
- Infinite scroll liste lunghe
- Cache codifiche in IndexedDB
- Debounce ricerche

---

## ✅ Checklist Pre-Release

- [ ] Tutte le pagine create e funzionanti
- [ ] Routes configurate in `App.jsx`
- [ ] Sidebar aggiornata
- [ ] Database schema applicato
- [ ] API integration testata
- [ ] Gestione errori implementata
- [ ] UI/UX responsive
- [ ] Documentazione utente
- [ ] Test con dati reali RENTRI
- [ ] Deploy e verifica produzione

---

**Status**: 🚧 In Pianificazione  
**Prossimo Step**: Implementazione Fase 1 - Dashboard e Registri

