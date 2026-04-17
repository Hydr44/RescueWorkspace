# Use Case Diagram — Gestione Presa in Carico

## Attori (Actors)

| ID | Attore | Note |
|----|--------|------|
| A1 | Concessionario, Automercato | Ritira e conferisce veicoli fuori uso |
| A2 | Centro di Raccolta (Demolitore) | Riceve veicoli conferiti, gestisce registrazione e trasferimento |

---

## Nota di Dominio

### RITIRO DEL VEICOLO
Il Concessionario o il Centro di Raccolta prendono in carico il veicolo e rilasciano un Certificato di Rottamazione all'ultimo possessore.

---

## Use Cases

> **Legenda utenti:** CN = Concessionario · CC = Casa Costruttrice · AM = Automercato · CR = Centro di Raccolta

---

### UC3002 — Verifica Veicolo da Ritirare
- **Attori:** A1 (CN, CC, AM) e A2 (CR)
- **Relazioni:**
  - `<<extend>>` UC3003 *(lato CN/CC/AM)*
  - `<<extend>>` UC3012 *(lato CR)*

---

### UC3003 — Inserisci Veicolo Ritirato
- **Attori:** A1 (CN, CC, AM)
- **Relazioni:**
  - riceve `<<extend>>` da UC3002
  - `<<extend>>` UC3006
  - `<<extend>>` UC3004

---

### UC3006 — Genera Ricevuta Presa in Carico VFU
- **Attori:** A1 (CN, CC, AM)
- **Relazioni:** riceve `<<extend>>` da UC3003
- **Condizione:** applicabile a **Veicoli non iscritti PRA**

---

### UC3004 — Conferisci Veicolo Fuori Uso a CR
- **Attori:** A1 (CN, CC, AM)
- **Relazioni:**
  - riceve `<<extend>>` da UC3003
  - `<<use>>` UC3005

---

### UC3005 — Genera Certificato di Rottamazione VFU
- **Attori:** A1 (CN, CC, AM)
- **Relazioni:**
  - riceve `<<use>>` da UC3004
  - `<<use>>` UC3021 *(Crea Fascicolo Veicolo Fuori Uso)*
  - `<<use>>` Notifica *(sistema)*

---

### UC3021 — Crea Fascicolo Veicolo Fuori Uso
- **Attori:** CR, CN, CC, AM
- **Relazioni:**
  - invocato via `<<use>>` da UC3005 e da UC3013
  - `<<use>>` UC3014 *(Inserisci dati Certificato cartaceo)*
- **Tipo:** Use case condiviso tra flusso CN/AM e flusso CR

---

### UC3007 — Lista Veicoli Ritirati
- **Attori:** A1 (CN, CC, AM)
- **Relazioni:**
  - `<<extend>>` UC3008
  - `<<extend>>` UC3009

---

### UC3008 — Scarica/Stampa Lista Veicoli Ritirati
- **Attori:** A1 (CN, CC, AM)
- **Relazioni:** riceve `<<extend>>` da UC3007

---

### UC3009 — Dettaglio Veicolo Ritirato
- **Attori:** A1 (CN, CC, AM)
- **Relazioni:**
  - riceve `<<extend>>` da UC3007
  - `<<extend>>` UC4003 *(condizione: Se in stato "Inserita")*
  - `<<extend>>` UC3022

---

### UC4003 — Elimina Veicolo
- **Attori:** A1 (CR)
- **Condizione:** solo se il veicolo è in stato **"Inserita"**
- **Relazioni:** riceve `<<extend>>` da UC3009

---

### UC3022 — Visualizza Certificato di Rottamazione / Ricevuta Presa in Carico
- **Attori:** CR, CN, CC, AM
- **Relazioni:**
  - riceve `<<extend>>` da UC3009
  - `<<extend>>` UC3019

---

### UC3019 — Presa in Carico Veicolo Conferito
- **Attori:** A2 (CR)
- **Relazioni:**
  - riceve `<<extend>>` da UC3022
  - `<<extend>>` UC3018

---

### UC3018 — Dettaglio Veicolo Ritirato/Conferito
- **Attori:** A2 (CR)
- **Relazioni:**
  - riceve `<<extend>>` da UC3019
  - `<<extend>>` UC3017
  - `<<extend>>` UC3020 *(condizione: Se Preso in Carico)*

---

### UC3017 — Ricerca Veicoli Conferiti
- **Attori:** A2 (CR)
- **Relazioni:** riceve `<<extend>>` da UC3018

---

### UC3020 — Trasferisci Veicolo ad Altro CR
- **Attori:** A2 (CR)
- **Condizione:** solo se veicolo **"Preso in Carico"**
- **Relazioni:** riceve `<<extend>>` da UC3018

---

### UC3001 — Ricerca Veicolo Ritirato nel Registro
- **Attori:** A2 (CR, CN, CC, AM)
- **Relazioni:** `<<extend>>` UC3018

---

### UC3012 — Registra Veicolo Ritirato
- **Attori:** A2 (CR)
- **Relazioni:**
  - riceve `<<extend>>` da UC3002
  - `<<use>>` UC3013
  - `<<extend>>` UC3014 *(oppure UC3014 estende UC3012)*

---

### UC3013 — Genera Certificato/Ricevuta Veicolo Fuori Uso
- **Attori:** A2 (CR)
- **Relazioni:**
  - riceve `<<use>>` da UC3012
  - `<<extend>>` UC3021 *(Crea Fascicolo)*
  - `<<use>>` Notifica *(sistema)*

---

### UC3014 — Inserisci Dati Certificato di Rottamazione Cartaceo
- **Attori:** A2 (CR)
- **Relazioni:**
  - riceve `<<use>>` da UC3021
  - `<<extend>>` UC3015

---

### UC3015 — Upload Documento
- **Attori:** A2 (CR)
- **Relazioni:** riceve `<<extend>>` da UC3014

---

### Notifica *(sistema)*
- **Tipo:** Use case di sistema, invocato automaticamente
- **Invocato da:** UC3005 e UC3013

---

## Tabella Relazioni tra Use Case

| Tipo | Sorgente | Destinazione |
|------|----------|--------------|
| `<<extend>>` | UC3002 | UC3003 |
| `<<extend>>` | UC3002 | UC3012 |
| `<<extend>>` | UC3003 | UC3006 |
| `<<extend>>` | UC3003 | UC3004 |
| `<<use>>` | UC3004 | UC3005 |
| `<<use>>` | UC3005 | UC3021 |
| `<<use>>` | UC3005 | Notifica |
| `<<extend>>` | UC3007 | UC3008 |
| `<<extend>>` | UC3007 | UC3009 |
| `<<extend>>` | UC3009 | UC4003 *(Se stato = "Inserita")* |
| `<<extend>>` | UC3009 | UC3022 |
| `<<extend>>` | UC3022 | UC3019 |
| `<<extend>>` | UC3019 | UC3018 |
| `<<extend>>` | UC3018 | UC3017 |
| `<<extend>>` | UC3018 | UC3020 *(Se Preso in Carico)* |
| `<<extend>>` | UC3001 | UC3018 |
| `<<use>>` | UC3012 | UC3013 |
| `<<extend>>` | UC3013 | UC3021 |
| `<<use>>` | UC3013 | Notifica |
| `<<use>>` | UC3021 | UC3014 |
| `<<extend>>` | UC3014 | UC3015 |

---

## Flussi per Ruolo

### Flusso Concessionario / Automercato (CN, CC, AM)

```
[A1 - Concessionario / Automercato]
│
├─► UC3002 — Verifica Veicolo da Ritirare
│     └─ [<<extend>>] UC3003 — Inserisci Veicolo Ritirato
│           ├─ [<<extend>>] UC3006 — Genera Ricevuta Presa in Carico VFU
│           │     [Nota: solo veicoli non iscritti PRA]
│           └─ [<<extend>>] UC3004 — Conferisci Veicolo Fuori Uso a CR
│                 └─ [<<use>>] UC3005 — Genera Certificato di Rottamazione VFU
│                       ├─ [<<use>>] UC3021 — Crea Fascicolo Veicolo Fuori Uso
│                       └─ [<<use>>] Notifica (sistema)
│
└─► UC3007 — Lista Veicoli Ritirati
      ├─ [<<extend>>] UC3008 — Scarica/Stampa Lista
      └─ [<<extend>>] UC3009 — Dettaglio Veicolo Ritirato
            ├─ [<<extend>>] UC4003 — Elimina Veicolo [Se stato = "Inserita"]
            └─ [<<extend>>] UC3022 — Visualizza Certificato/Ricevuta
```

### Flusso Centro di Raccolta (CR)

```
[A2 - Centro di Raccolta]
│
├─► UC3001 — Ricerca Veicolo Ritirato nel Registro
│     └─ [<<extend>>] UC3018 — Dettaglio Veicolo Ritirato/Conferito
│           ├─ [<<extend>>] UC3017 — Ricerca Veicoli Conferiti
│           └─ [<<extend>>] UC3020 — Trasferisci Veicolo ad Altro CR [Se Preso in Carico]
│
└─► UC3002 — Verifica Veicolo da Ritirare
      └─ [<<extend>>] UC3012 — Registra Veicolo Ritirato
            ├─ [<<use>>] UC3013 — Genera Certificato/Ricevuta VFU
            │     ├─ [<<extend>>] UC3021 — Crea Fascicolo VFU
            │     │     └─ [<<use>>] UC3014 — Inserisci Dati Certificato Cartaceo
            │     │           └─ [<<extend>>] UC3015 — Upload Documento
            │     └─ [<<use>>] Notifica (sistema)
            └─ (eventualmente) UC3014 — Inserisci Dati Certificato Cartaceo
```

### Flusso Condiviso (post conferimento)

```
UC3022 — Visualizza Certificato/Ricevuta [da UC3009 lato CN, o da CR]
  └─ [<<extend>>] UC3019 — Presa in Carico Veicolo Conferito (CR)
        └─ [<<extend>>] UC3018 — Dettaglio Veicolo Ritirato/Conferito (CR)
              ├─ [<<extend>>] UC3017 — Ricerca Veicoli Conferiti
              └─ [<<extend>>] UC3020 — Trasferisci Veicolo ad Altro CR
```

---

## Note su Use Case Mancanti

I numeri **3010, 3011, 3016** non compaiono in questo diagramma — presumibilmente definiti in altri diagrammi del sistema.