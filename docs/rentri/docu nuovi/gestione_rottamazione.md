# Use Case Diagram — Gestione Rottamazione

## Attori (Actors)

| ID | Attore | Note |
|----|--------|------|
| A1 | Centro di Raccolta (Demolitore) | Accesso tramite UC3001 — gestione veicoli e fascicoli |
| A2 | Centro di Raccolta (Demolitore) | Stesso attore — punto d'ingresso per liste e operazioni finali |

> A1 e A2 sono lo stesso attore (Centro di Raccolta / Demolitore), rappresentato due volte per leggibilità del diagramma.

---

## Nota di Dominio — Stati del Veicolo

Il diagramma modella le transizioni di stato dei Veicoli Fuori Uso (VFU):

| Stato | Triggered da |
|-------|-------------|
| `DA RADIARE` | UC4012 — Chiudi Fascicolo |
| `INVIATO A STA` | UC4015 — Associa a STA |
| `DEMOLITO` | UC4022 — Distruggi Targhe e Documenti |

---

## Use Cases

> **Tutti gli use case in questo diagramma sono riservati all'utente CR (Centro di Raccolta)**, salvo UC3001 che include anche CN, CC, AM.

---

### UC3001 — Ricerca Veicolo Ritirato nel Registro
- **Attori:** CR, CN, CC, AM
- **Relazioni:** `<<extend>>` UC4001
- **Nota:** Use case condiviso con il diagramma "Gestione Presa in Carico"

---

### UC4001 — Dettaglio Veicolo da Rottamare
- **Attori:** CR
- **Relazioni:**
  - riceve `<<extend>>` da UC3001
  - riceve `<<extend>>` da UC4002
  - riceve `<<extend>>` da UC4003
  - `<<extend>>` UC4004
  - `<<extend>>` UC4005

---

### UC4002 — Modifica Veicolo
- **Attori:** CR
- **Relazioni:** `<<extend>>` UC4001

---

### UC4003 — Elimina Veicolo
- **Attori:** CR
- **Relazioni:** `<<extend>>` UC4001
- **Nota:** Use case condiviso con "Gestione Presa in Carico" (condizione: stato = "Inserita")

---

### UC4004 — Valida Veicolo
- **Attori:** CR
- **Relazioni:** riceve `<<extend>>` da UC4001
- **Nota:** corrisponde alla funzione **"Verifica"** nell'interfaccia

---

### UC4005 — Dettaglio Fascicolo Veicolo
- **Attori:** CR
- **Relazioni:**
  - riceve `<<extend>>` da UC4001
  - `<<extend>>` UC4006
  - `<<extend>>` UC4007
  - `<<extend>>` UC4008
  - `<<extend>>` UC4009
  - `<<extend>>` UC4010
  - `<<extend>>` UC4011
  - `<<extend>>` UC4012

---

### UC4006 — Dettaglio Documento VFU
- **Attori:** CR
- **Relazioni:** riceve `<<extend>>` da UC4005

---

### UC4007 — Aggiungi Documento VFU
- **Attori:** CR
- **Relazioni:** riceve `<<extend>>` da UC4005

---

### UC4008 — Allega Documento VFU
- **Attori:** CR
- **Relazioni:** riceve `<<extend>>` da UC4005

---

### UC4009 — Elimina Documento VFU
- **Attori:** CR
- **Relazioni:** riceve `<<extend>>` da UC4005

---

### UC4010 — Modifica Documento VFU
- **Attori:** CR
- **Relazioni:** riceve `<<extend>>` da UC4005

---

### UC4011 — Visualizza Documento VFU
- **Attori:** CR
- **Relazioni:** riceve `<<extend>>` da UC4005

---

### UC4012 — Chiudi Fascicolo
- **Attori:** CR
- **Relazioni:** riceve `<<extend>>` da UC4005
- **Effetto:** imposta lo stato del veicolo a **`DA RADIARE`**

---

### UC4013 — Lista Veicoli Fuori Uso da Radiare
- **Attori:** CR
- **Relazioni:**
  - `<<extend>>` UC4016
  - `<<extend>>` UC4014
  - collegato a UC4017 *(invio lista a STA)*

---

### UC4014 — Ricerca Studio di Consulenza
- **Attori:** CR
- **Relazioni:**
  - riceve `<<extend>>` da UC4013
  - `<<extend>>` UC4015

---

### UC4015 — Associa a STA
- **Attori:** CR
- **Relazioni:** riceve `<<extend>>` da UC4014
- **Effetto:** imposta lo stato del veicolo a **`INVIATO A STA`**

---

### UC4016 — Stampa Lista Veicoli Fuori Uso da Radiare
- **Attori:** CR
- **Relazioni:** riceve `<<extend>>` da UC4013

---

### UC4017 — Inoltra Lista VFU da Radiare a STA
- **Attori:** CR
- **Relazioni:** collegato a UC4013
- **Nota (incerta):** `??? invia mail...` — comportamento da chiarire (probabilmente invio via email alla STA)

---

### UC4018 — Lista Veicoli Fuori Uso Radiati
- **Attori:** CR
- **Relazioni:** `<<extend>>` UC4019

---

### UC4019 — Stampa Lista Veicoli Fuori Uso Radiati
- **Attori:** CR
- **Relazioni:** riceve `<<extend>>` da UC4018

---

### UC4021 — Scarica Ricevuta di Radiazione
- **Attori:** CR
- **Nota (incerta):** `??? forse da fascicolo..` — origine della ricevuta da chiarire (probabilmente dal Fascicolo Demolitore)

---

### UC4022 — Distruggi Targhe e Documenti
- **Attori:** CR
- **Effetto:** imposta lo stato del veicolo a **`DEMOLITO`**

---

## Tabella Relazioni tra Use Case

| Tipo | Sorgente | Destinazione |
|------|----------|--------------|
| `<<extend>>` | UC3001 | UC4001 |
| `<<extend>>` | UC4002 | UC4001 |
| `<<extend>>` | UC4003 | UC4001 |
| `<<extend>>` | UC4001 | UC4004 |
| `<<extend>>` | UC4001 | UC4005 |
| `<<extend>>` | UC4005 | UC4006 |
| `<<extend>>` | UC4005 | UC4007 |
| `<<extend>>` | UC4005 | UC4008 |
| `<<extend>>` | UC4005 | UC4009 |
| `<<extend>>` | UC4005 | UC4010 |
| `<<extend>>` | UC4005 | UC4011 |
| `<<extend>>` | UC4005 | UC4012 |
| `<<extend>>` | UC4013 | UC4016 |
| `<<extend>>` | UC4013 | UC4014 |
| `<<extend>>` | UC4014 | UC4015 |
| `<<extend>>` | UC4018 | UC4019 |

---

## Flusso Principale

### Flusso 1 — Gestione Dettaglio Veicolo e Fascicolo

```
[CR] ─► UC3001 — Ricerca Veicolo Ritirato nel Registro
              └─ [<<extend>>] UC4001 — Dettaglio Veicolo da Rottamare
                    ├─ [<<extend>>] UC4002 — Modifica Veicolo
                    ├─ [<<extend>>] UC4003 — Elimina Veicolo
                    ├─ [<<extend>>] UC4004 — Valida Veicolo  [Funzione "Verifica"]
                    └─ [<<extend>>] UC4005 — Dettaglio Fascicolo Veicolo
                          ├─ [<<extend>>] UC4006 — Dettaglio Documento VFU
                          ├─ [<<extend>>] UC4007 — Aggiungi Documento VFU
                          ├─ [<<extend>>] UC4008 — Allega Documento VFU
                          ├─ [<<extend>>] UC4009 — Elimina Documento VFU
                          ├─ [<<extend>>] UC4010 — Modifica Documento VFU
                          ├─ [<<extend>>] UC4011 — Visualizza Documento VFU
                          └─ [<<extend>>] UC4012 — Chiudi Fascicolo
                                           [→ stato: DA RADIARE]
```

### Flusso 2 — Radiazione e Invio a STA

```
[CR] ─► UC4013 — Lista Veicoli Fuori Uso da Radiare
              ├─ [<<extend>>] UC4016 — Stampa Lista VFU da Radiare
              ├─ UC4017 — Inoltra Lista VFU da Radiare a STA  [??? invia mail]
              └─ [<<extend>>] UC4014 — Ricerca Studio di Consulenza
                    └─ [<<extend>>] UC4015 — Associa a STA
                                     [→ stato: INVIATO A STA]
```

### Flusso 3 — Veicoli Radiati e Demolizione

```
[CR] ─► UC4018 — Lista Veicoli Fuori Uso Radiati
              └─ [<<extend>>] UC4019 — Stampa Lista VFU Radiati

[CR] ─► UC4021 — Scarica Ricevuta di Radiazione  [??? forse da fascicolo]

[CR] ─► UC4022 — Distruggi Targhe e Documenti
                  [→ stato: DEMOLITO]
```

---

## Note Aperte (da chiarire con stakeholder)

| UC | Nota | Questione aperta |
|----|------|-----------------|
| UC4017 | `??? invia mail...` | Confermare se l'inoltro avviene via email automatica o manuale |
| UC4021 | `??? forse da fascicolo..` | Verificare se la ricevuta si scarica dal Fascicolo Demolitore o da un'altra fonte |