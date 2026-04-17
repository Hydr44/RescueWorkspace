# Use Case Diagram — Gestione Radiazione su Registro Veicoli Fuori Uso

## Attori (Actors)

| ID | Attore | Note |
|----|--------|------|
| A1 | Punto di Servizio (STA) | Accede al sistema tramite Portale del Trasporto → RVFU |
| A2 | Centro di Raccolta (Demolitore) | Gestisce le richieste di integrazione sui fascicoli |

---

## Nota di Dominio

### GESTIONE RADIAZIONE per DEMOLIZIONE
- Per la Radiazione, il **Demolitore** o il **Punto di Servizio** accedono al **Portale del Trasporto**.
- Il Portale del Trasporto, per Agenzia e per Demolitore, visualizza un link all'applicazione **RVFU** (Registro Veicoli Fuori Uso).

### Integrazione Tecnica
- **Portale del Trasporto → RVFU**: disponibile sia come **webapp** che come **Web Service (WS)**

---

## Use Cases

> In questo diagramma i use case non hanno numerazione progressiva — vengono indicati per nome esteso.

---

### UC_RVA — Ricercare Veicoli Assegnati per Radiazione
- **Attori:** A1 (Punto di Servizio)
- **Relazioni:** `<<extend>>` UC_DVA

---

### UC_DVA — Visualizzare Dettaglio Veicolo Assegnato per Radiazione
- **Attori:** A1
- **Relazioni:**
  - riceve `<<extend>>` da UC_RVA
  - `<<extend>>` UC_FVA

---

### UC_FVA — Visualizzare Fascicolo Veicolo Assegnato per Radiazione
- **Attori:** A1
- **Relazioni:**
  - riceve `<<extend>>` da UC_DVA
  - `<<extend>>` UC_DDA

---

### UC_DDA — Visualizzare Dettaglio Documento Veicolo Assegnato per Radiazione
- **Attori:** A1
- **Relazioni:**
  - riceve `<<extend>>` da UC_FVA
  - `<<extend>>` UC_RIM

---

### UC_RIM — Richiedere Integrazione/Modifica Fascicolo
- **Attori:** A1 (Punto di Servizio)
- **Relazioni:** riceve `<<extend>>` da UC_DDA
- **Descrizione:** Il Punto di Servizio segnala al Centro di Raccolta che il fascicolo richiede integrazioni o modifiche

---

### UC_LVI — Visualizzare Lista Veicoli con Richiesta di Integrazione
- **Attori:** A2 (Centro di Raccolta)
- **Relazioni:** `<<extend>>` UC_DVI

---

### UC_DVI — Visualizzare Dettaglio Veicolo con Richiesta di Integrazione
- **Attori:** A2
- **Relazioni:**
  - riceve `<<extend>>` da UC_LVI
  - `<<extend>>` UC_RFI

---

### UC_RFI — Riaprire Fascicolo Veicolo con Richiesta di Integrazione
- **Attori:** A2
- **Relazioni:**
  - riceve `<<extend>>` da UC_DVI
  - `<<extend>>` UC_AVI

---

### UC_AVI — Aggiornare Veicolo con Richiesta di Integrazione
- **Attori:** A2
- **Relazioni:** riceve `<<extend>>` da UC_RFI
- **Descrizione:** Il Centro di Raccolta aggiorna il fascicolo in risposta alla richiesta di integrazione del Punto di Servizio

---

## Tabella Relazioni tra Use Case

| Tipo | Sorgente | Destinazione |
|------|----------|--------------|
| `<<extend>>` | UC_RVA — Ricercare Veicoli Assegnati | UC_DVA — Visualizzare Dettaglio Veicolo Assegnato |
| `<<extend>>` | UC_DVA — Visualizzare Dettaglio Veicolo Assegnato | UC_FVA — Visualizzare Fascicolo Veicolo Assegnato |
| `<<extend>>` | UC_FVA — Visualizzare Fascicolo Veicolo Assegnato | UC_DDA — Visualizzare Dettaglio Documento |
| `<<extend>>` | UC_DDA — Visualizzare Dettaglio Documento | UC_RIM — Richiedere Integrazione/Modifica Fascicolo |
| `<<extend>>` | UC_LVI — Lista Veicoli con Richiesta Integrazione | UC_DVI — Dettaglio Veicolo con Richiesta Integrazione |
| `<<extend>>` | UC_DVI — Dettaglio Veicolo con Richiesta Integrazione | UC_RFI — Riaprire Fascicolo |
| `<<extend>>` | UC_RFI — Riaprire Fascicolo | UC_AVI — Aggiornare Veicolo |

---

## Flussi per Ruolo

### Flusso A1 — Punto di Servizio (STA): Verifica e Richiesta Integrazione

```
[A1 - Punto di Servizio]
│
└─► UC_RVA — Ricercare Veicoli Assegnati per Radiazione
      └─ [<<extend>>] UC_DVA — Visualizzare Dettaglio Veicolo Assegnato
            └─ [<<extend>>] UC_FVA — Visualizzare Fascicolo Veicolo Assegnato
                  └─ [<<extend>>] UC_DDA — Visualizzare Dettaglio Documento
                        └─ [<<extend>>] UC_RIM — Richiedere Integrazione/Modifica Fascicolo
                                          [→ notifica al Centro di Raccolta]
```

### Flusso A2 — Centro di Raccolta: Gestione Integrazioni Richieste

```
[A2 - Centro di Raccolta]
│
└─► UC_LVI — Visualizzare Lista Veicoli con Richiesta di Integrazione
      └─ [<<extend>>] UC_DVI — Visualizzare Dettaglio Veicolo con Richiesta di Integrazione
            └─ [<<extend>>] UC_RFI — Riaprire Fascicolo Veicolo con Richiesta di Integrazione
                  └─ [<<extend>>] UC_AVI — Aggiornare Veicolo con Richiesta di Integrazione
                                    [→ fascicolo aggiornato, pronto per ri-valutazione]
```

---

## Interazione tra Attori (Flusso end-to-end)

```
[A1 - Punto di Servizio]                     [A2 - Centro di Raccolta]
        │                                               │
        ▼                                               │
  Ricerca veicoli assegnati                             │
  Visualizza dettaglio veicolo                          │
  Visualizza fascicolo                                  │
  Visualizza documento                                  │
  Richiede integrazione/modifica ──────────────────────►│
                                                        ▼
                                          Visualizza lista richieste integrazione
                                          Visualizza dettaglio veicolo
                                          Riapre fascicolo
                                          Aggiorna veicolo
                                                        │
                                            [fascicolo aggiornato]
```

---

## Contesto Tecnico — Accesso RVFU

| Componente | Dettaglio |
|-----------|-----------|
| Portale di accesso | Portale del Trasporto |
| Applicazione target | RVFU (Registro Veicoli Fuori Uso) |
| Modalità di accesso | Webapp (interfaccia utente) + Web Service (WS) |
| Utenti abilitati | Agenzia, Demolitore, Punto di Servizio |