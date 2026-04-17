# Use Case Diagram — Gestione Radiazione: Funzioni su Gestione Istanza DU

## Attori (Actors)

| ID | Attore | Note |
|----|--------|------|
| A1 | Punto di Servizio / Centro di Raccolta | Gestisce inserimento pratiche, istanze e radiazione |
| A2 | PRA / UMC | Può rifiutare la pratica tramite UC "Ricusa pratica" |

---

## Codifica Colori nel Diagramma

| Colore | Significato |
|--------|-------------|
| **Arancione scuro** | Use case specifici per **Veicoli iscritti al PRA** (chiamate WS C05332) |
| **Rosa/Salmone** | Use case specifici per **Veicoli NON iscritti al PRA** |
| **Grigio** | Use case condivisi / di sistema |

---

## Note di Dominio

### Accesso al Sistema (top left)
- Per la Radiazione il Demolitore o il Punto di Servizio accedono al **Portale del Trasporto**
- Il Portale visualizza un link all'applicazione **RVFU** (sia webapp che Web Service)

### Istanza di Radiazione per Demolizione (box giallo centrale)
La funzione "Radiare veicolo" deve:
1. Reperire dal RVFU e precaricare **ISTANZA** e **FASCICOLO**
   - Istanza deve essere in stato: **INSERITA**
   - Fascicolo deve essere in stato: **ACQUISITO**
2. L'utente seleziona il **Tipo Pratica** tra le "Radiazioni per demolizione" disponibili per veicoli registrati in RVFU

### STA Plus / Prenota Plus
Etichetta del contesto applicativo per i flussi con WS 5002.

### Funzioni per Veicoli NON iscritti al PRA (box giallo sinistro)
La funzione di inserimento deve:
- Reperire dati da **AVFU**
- Mostrare messaggio di errore se non trovati in AVFU

Per i veicoli non iscritti al PRA, il controllo avviene nella fase di inserimento della pratica nei seguenti workflow (wkpg):
- `ST00` — DEMOLIZIONE CICLOMOTORI PRESSO AGENZIA
- `CM00` — DEMOLIZIONI CICLOMOTORI PRESSO UMC
- `GPRA` — DEMOLIZIONI RIMORCHI < 3,52 TON PRESSO UMC

### Registrazione su RVFU (post-cancellazione)
- Data e Protocollo avvenuta cancellazione
- Aggiorna documento Fascicolo Demolitore

### Se CONVALIDATA PRA
- Aggiorna Stato "Radiato" del RVFU
- Registra Data Radiazione
- Aggiorna doc Fascicolo Demolitore con Ricevuta radiazione

### Se C05332 — Rifiuto STA
Se la pratica C05332 viene rifiutata, lo stato nel RVFU rimane **"Assegnato a STA"**. Lo STA poi lavorerà sul RVFU richiedendo nuova lavorazione al Centro di Raccolta.

---

## Web Service Coinvolti (C05332)

| WS | Funzione | Trigger |
|----|----------|---------|
| **WS 5001** | Importare in istanza radiazione DU i dati del veicolo PRA assegnato per radiazione | Apertura istanza lato PRA |
| **WS 5002** | Importare in istanza/pratica DU il fascicolo del veicolo PRA assegnato per radiazione | Apertura fascicolo lato STA Plus |
| **WS 5006** | Aggiornare stato veicolo PRA radiato da DU | Presentazione pratica |
| **WS RVFU** | Aggiornare lo stato del Registro Veicoli Fuori Uso | Annullamento pratica (via C05332) |

---

## Use Cases

### 5a — Visualizza Lista Veicoli da Radiare *(rosa — NON PRA)*
- **Attori:** A1
- **Relazioni:** `<<extend>>` 5a_DET

---

### 5a_DET — Visualizza Dettaglio Veicolo da Radiare *(rosa — NON PRA)*
- **Attori:** A1
- **Relazioni:**
  - riceve `<<extend>>` da 5a
  - `<<extend>>` UC_AGG_NON_PRA

---

### UC_AGG_NON_PRA — Aggiornare Stato Veicolo NON PRA Radiato da STA *(rosa)*
- **Attori:** A1
- **Relazioni:**
  - riceve `<<extend>>` da 5a_DET
  - `<<use>>` UC_REG_RVFU *(Registra su RVFU: data/protocollo cancellazione, aggiorna Fascicolo)*
- **Azione collaterale:** inserisce nel fascicolo del veicolo NON PRA la ricevuta di radiazione da STA

---

### UC_INS_PRATICA — Inserisci Pratica *(grigio)*
- **Attori:** A1
- **Relazioni:**
  - `<<extend>>` UC_ISTANZA *(use case hub centrale)*
  - `<<extend>>` UC_STAMPA_RIC *(Stampa Ricevuta Cessazione — bottom left)*

---

### UC_ISTANZA — Inserisci / Salva Istanza *(grigio — hub centrale)*
- **Attori:** sistema
- **Relazioni (riceve <<extend>> da):**
  - UC_WS5001 *(veicoli PRA — lato sinistro)*
  - UC_INS_PRATICA
  - UC_FIRMA_IST *(Firma Istanza o Conferma Istanza)*
  - UC_WS5002 *(veicoli PRA — lato STA Plus)*
  - UC_GEST_DOC *(Gestione Documenti)*
  - UC_FIRMA_DOC *(Firma Documenti Fascicolo)*
- **Relazioni (estende verso):**
  - `<<extend>>` UC_LAVORA

---

### UC_WS5001 — WS 5001: Importa Dati Veicolo PRA in Istanza Radiazione DU *(arancione)*
- **Trigger:** SE codice pratica = C05332 RADIAZIONE per DEMOLIZIONE
- **Funzione:** chiama WS 5001 per importare i dati del veicolo PRA assegnato per radiazione
- **Relazioni:** `<<extend>>` UC_ISTANZA

---

### UC_WS5002 — WS 5002: Importa Fascicolo Veicolo PRA in Istanza/Pratica DU *(arancione)*
- **Trigger:** SE codice pratica = C05332 RADIAZIONE per DEMOLIZIONE
- **Funzione:** chiama WS 5002 per importare il fascicolo del veicolo PRA
- **Relazioni:** `<<extend>>` UC_ISTANZA
- **Condizione aggiuntiva:** Se Fascicolo DU è "Da integrare" o "Da rivedere" → utente può importare Fascicolo dal RVFU

---

### UC_FIRMA_IST — Firma Istanza o Conferma Istanza (crea Fascicolo) *(arancione)*
- **Attori:** A1
- **Relazioni:** `<<extend>>` UC_ISTANZA

---

### UC_GEST_DOC — Gestione Documenti *(grigio)*
- **Attori:** A1
- **Relazioni:** `<<extend>>` UC_ISTANZA

---

### UC_FIRMA_DOC — Firma Documenti Fascicolo *(grigio)*
- **Attori:** A1
- **Relazioni:** `<<extend>>` UC_ISTANZA

---

### UC_LAVORA — Lavora Pratica *(grigio)*
- **Attori:** A1
- **Relazioni:**
  - riceve `<<extend>>` da UC_ISTANZA
  - `<<extend>>` UC_PRESENTA
  - `<<extend>>` UC_ANNULLA

---

### UC_PRESENTA — Presenta Pratica *(arancione)*
- **Attori:** A1
- **Relazioni:**
  - riceve `<<extend>>` da UC_LAVORA
  - `<<use>>` UC_WS5006
  - `<<extend>>` UC_STAMPA_ACI

---

### UC_WS5006 — WS 5006: Aggiorna Stato Veicolo PRA Radiato da DU *(arancione)*
- **Trigger:** SE codice pratica = C05332 RADIAZIONE per DEMOLIZIONE
- **Funzione:** chiama WS 5006 per aggiornare lo stato del veicolo PRA radiato
- **Relazioni:** invocato via `<<use>>` da UC_PRESENTA

---

### UC_STAMPA_ACI — Stampa Ricevuta Cessazione Veicolo (doc prodotto da ACI) *(grigio/arancione)*
- **Attori:** A1
- **Relazioni:** riceve `<<extend>>` da UC_PRESENTA

---

### UC_ANNULLA — Annullare Pratica *(grigio)*
- **Attori:** A1
- **Relazioni:**
  - riceve `<<extend>>` da UC_LAVORA
  - `<<use>>` UC_AGG_RVFU

---

### UC_AGG_RVFU — Aggiorna Stato Registro VFU via Servizio RVFU *(arancione)*
- **Trigger:** SE codice pratica = C05332
- **Funzione:** aggiorna lo stato del Registro Veicoli Fuori Uso invocando il servizio esposto da RVFU
- **Relazioni:** invocato via `<<use>>` da UC_ANNULLA

---

### UC_RICUSA — Ricusa Pratica *(grigio)*
- **Attori:** A2 (PRA / UMC)
- **Effetto:** lo stato nel RVFU rimane "Assegnato a STA"; lo STA lavorerà nuovamente sul RVFU richiedendo integrazione al Centro di Raccolta

---

### UC_STAMPA_RIC — Stampa Ricevuta Cessazione Veicolo *(grigio — bottom left)*
- **Attori:** A1
- **Relazioni:** riceve `<<extend>>` da UC_INS_PRATICA

---

## Tabella Relazioni tra Use Case

| Tipo | Sorgente | Destinazione |
|------|----------|--------------|
| `<<extend>>` | 5a — Visualizza Lista | 5a_DET — Visualizza Dettaglio |
| `<<extend>>` | 5a_DET | UC_AGG_NON_PRA — Aggiorna Stato NON PRA |
| `<<use>>` | UC_AGG_NON_PRA | UC_REG_RVFU — Registra su RVFU |
| `<<extend>>` | UC_INS_PRATICA | UC_ISTANZA — Inserisci/Salva Istanza |
| `<<extend>>` | UC_INS_PRATICA | UC_STAMPA_RIC — Stampa Ricevuta |
| `<<extend>>` | UC_WS5001 | UC_ISTANZA |
| `<<extend>>` | UC_FIRMA_IST | UC_ISTANZA |
| `<<extend>>` | UC_WS5002 | UC_ISTANZA |
| `<<extend>>` | UC_GEST_DOC | UC_ISTANZA |
| `<<extend>>` | UC_FIRMA_DOC | UC_ISTANZA |
| `<<extend>>` | UC_ISTANZA | UC_LAVORA |
| `<<extend>>` | UC_LAVORA | UC_PRESENTA |
| `<<extend>>` | UC_LAVORA | UC_ANNULLA |
| `<<use>>` | UC_PRESENTA | UC_WS5006 |
| `<<extend>>` | UC_PRESENTA | UC_STAMPA_ACI |
| `<<use>>` | UC_ANNULLA | UC_AGG_RVFU |

---

## Flussi Principali

### Flusso 1 — Veicoli NON iscritti al PRA (rosa)

```
[A1]
├─► 5a — Visualizza Lista Veicoli da Radiare
│     └─ [<<extend>>] 5a_DET — Visualizza Dettaglio Veicolo
│           └─ [<<extend>>] UC_AGG_NON_PRA — Aggiorna Stato NON PRA radiato da STA
│                 └─ [<<use>>] UC_REG_RVFU — Registra su RVFU
│                              (data cancellazione + aggiorna Fascicolo Demolitore)
│
└─► UC_INS_PRATICA — Inserisci Pratica
      ├─ [<<extend>>] UC_STAMPA_RIC — Stampa Ricevuta Cessazione
      └─ [<<extend>>] UC_ISTANZA — Inserisci/Salva Istanza
            └─ (continua nel Flusso 2)
```

### Flusso 2 — Veicoli iscritti al PRA con codice C05332 (arancione)

```
UC_ISTANZA — Inserisci/Salva Istanza  ◄── hub centrale, riceve da:
  ├── UC_WS5001  [chiama WS 5001: importa dati veicolo PRA]
  ├── UC_FIRMA_IST  [Firma/Conferma Istanza → crea Fascicolo]
  ├── UC_WS5002  [chiama WS 5002: importa Fascicolo PRA]
  │     [Se fascicolo "Da integrare/rivedere" → importa da RVFU]
  ├── UC_GEST_DOC  [Gestione Documenti]
  └── UC_FIRMA_DOC  [Firma Documenti Fascicolo]

UC_ISTANZA
  └─ [<<extend>>] UC_LAVORA — Lavora Pratica
        ├─ [<<extend>>] UC_PRESENTA — Presenta Pratica
        │     ├─ [<<use>>] UC_WS5006  [chiama WS 5006: aggiorna stato PRA]
        │     │     [Se CONVALIDATA: stato RVFU = "Radiato" + Ricevuta radiazione]
        │     └─ [<<extend>>] UC_STAMPA_ACI  [Stampa Ricevuta da ACI]
        │
        └─ [<<extend>>] UC_ANNULLA — Annullare Pratica
              └─ [<<use>>] UC_AGG_RVFU  [Aggiorna RVFU via servizio C05332]
```

### Flusso 3 — Ricusa da PRA/UMC

```
[A2 - PRA/UMC]
└─► UC_RICUSA — Ricusa Pratica
      [Effetto: stato RVFU = "Assegnato a STA"]
      [→ STA lavora su RVFU e richiede nuova lavorazione al Centro di Raccolta]
```

---

## Stati del Veicolo in questo Diagramma

| Stato | Condizione | Triggered da |
|-------|-----------|-------------|
| `INSERITA` | Istanza caricata nel sistema | UC_ISTANZA |
| `ACQUISITO` | Fascicolo precaricato da RVFU | Precondizione ingresso flusso |
| `ASSEGNATO A STA` | Pratica rifiutata da PRA/UMC | UC_RICUSA |
| `RADIATO` | Pratica convalidata da PRA | UC_WS5006 + validazione PRA |
| `DEMOLITO` | *(gestito nel diagramma Gestione Rottamazione)* | UC4022 |