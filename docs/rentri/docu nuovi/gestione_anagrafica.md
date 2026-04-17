# Use Case Diagram — Gestione Anagrafica e Rapporti

## Attori (Actors)

| ID | Attore | Note |
|----|--------|------|
| A1 | Concessionario / Automercato / Centro di Raccolta (Demolitore) | Accesso via SPID, autocensimento anagrafico |
| A2 | Centro di Raccolta (Demolitore) | Gestisce deleghe verso concessionari |
| A3 | Concessionario, Automercato | Visualizza e gestisce deleghe ricevute |

---

## Note di Dominio

### Accesso al Sistema (box giallo)
Il Concessionario, Automercato, Casa costruttrice, Centro di raccolta:
- Accede con **SPID**
- Effettua **autocensimento anagrafico** (il sistema controlla P.IVA ed esistenza Camera di Commercio)
- Crea in autonomia la propria **Matricola/Password** di accesso al Portale del Trasporto per le funzioni di Gestione Rottamazione

**In alternativa:** il Concessionario entra con SPID e gli viene affidato un **Codice segreto** e **Codice Fiscale** per accedere al Registro dei Veicoli Fuori Uso.

> Ai Demolitori viene assegnata una **Utenza dedicata** (valida anche per la Radiazione).

### GESTIONE RAPPORTO
Riguarda la relazione **Concessionario ↔ Centro di Raccolta**.

---

## Use Cases

### UC1 — Gestione Anagrafica e Utenza Concessionari e Centri di Raccolta
- **Attori:** A1 (Concessionario / Automercato / Centro di Raccolta)
- **Tipo:** Use case principale di accesso e censimento

---

### UC2001 — Ricerca Imprese (CN, CC e AM) per Nuova Delega
- **Attori:** A2 (Centro di Raccolta / Demolitore)
- **Utente:** CR (Centro di Raccolta)
- **Relazioni:** `<<extend>>` UC2002
- **Descrizione:** Il CR ricerca concessionari, automercati o case costruttrici a cui concedere una nuova delega

---

### UC2002 — Delega Impresa
- **Attori:** A2
- **Utente:** CR
- **Relazioni:**
  - riceve `<<extend>>` da UC2001
  - `<<use>>` UC2003

---

### UC2003 — Notifica Delega a Concessionari
- **Attori:** (nessun attore diretto — sistema)
- **Relazioni:** invocato via `<<use>>` da UC2002
- **Tipo:** Use case incluso/usato (notifica automatica)

---

### UC2004 — Lista Concessionari Delegati
- **Attori:** A2
- **Utente:** CR
- **Relazioni:** `<<extend>>` UC2005

---

### UC2005 — Dettaglio Delega a Concessionario
- **Attori:** A2
- **Utente:** CR
- **Relazioni:**
  - riceve `<<extend>>` da UC2004
  - `<<extend>>` UC2006
  - `<<extend>>` UC2007
  - `<<extend>>` UC2008

---

### UC2006 — Modifica Delega
- **Attori:** A2
- **Utente:** CR
- **Relazioni:** riceve `<<extend>>` da UC2005

---

### UC2007 — Revoca Delega
- **Attori:** A2
- **Utente:** CR
- **Relazioni:** riceve `<<extend>>` da UC2005

---

### UC2008 — Annulla Delega
- **Attori:** A2
- **Utente:** CR
- **Relazioni:** riceve `<<extend>>` da UC2005

---

### UC2009 — Lista Deleghe Attive
- **Attori:** A2
- **Utente:** CR
- **Relazioni:**
  - `<<extend>>` UC2010
  - `<<extend>>` UC2011

---

### UC2010 — Stampa Lista Deleghe Attive
- **Attori:** A2
- **Utente:** CR
- **Relazioni:** riceve `<<extend>>` da UC2009

---

### UC2011 — Scarica Lista Deleghe Attive
- **Attori:** A2
- **Utente:** CR
- **Relazioni:** riceve `<<extend>>` da UC2009

---

### UC2012 — Lista Demolitori Deleganti
- **Attori:** A3 (Concessionario, Automercato)
- **Utente:** CN, CC, AM
- **Relazioni:**
  - `<<extend>>` UC2013
  - `<<extend>>` UC2014
- **Nota:** Visualizza sia i Demolitori già configurati che quelli non ancora configurati

---

### UC2013 — Dettaglio Delega
- **Attori:** A3
- **Utente:** CN, CC, AM
- **Relazioni:**
  - riceve `<<extend>>` da UC2012
  - `<<extend>>` UC2015

---

### UC2014 — Stampa Lista Deleghe Possedute
- **Attori:** A3
- **Utente:** CN, CC, AM
- **Relazioni:** riceve `<<extend>>` da UC2012

---

### UC2015 — Scarica Lista Deleghe Possedute
- **Attori:** A3
- **Utente:** CN, CC, AM
- **Relazioni:** riceve `<<extend>>` da UC2013

---

## Tabella Relazioni tra Use Case

| Tipo | Sorgente | Destinazione |
|------|----------|--------------|
| `<<extend>>` | UC2001 — Ricerca Imprese | UC2002 — Delega Impresa |
| `<<use>>` | UC2002 — Delega Impresa | UC2003 — Notifica Delega |
| `<<extend>>` | UC2004 — Lista Concessionari Delegati | UC2005 — Dettaglio Delega a Concessionario |
| `<<extend>>` | UC2005 — Dettaglio Delega a Concessionario | UC2006 — Modifica Delega |
| `<<extend>>` | UC2005 — Dettaglio Delega a Concessionario | UC2007 — Revoca Delega |
| `<<extend>>` | UC2005 — Dettaglio Delega a Concessionario | UC2008 — Annulla Delega |
| `<<extend>>` | UC2009 — Lista Deleghe Attive | UC2010 — Stampa Lista Deleghe Attive |
| `<<extend>>` | UC2009 — Lista Deleghe Attive | UC2011 — Scarica Lista Deleghe Attive |
| `<<extend>>` | UC2012 — Lista Demolitori Deleganti | UC2013 — Dettaglio Delega |
| `<<extend>>` | UC2012 — Lista Demolitori Deleganti | UC2014 — Stampa Lista Deleghe Possedute |
| `<<extend>>` | UC2013 — Dettaglio Delega | UC2015 — Scarica Lista Deleghe Possedute |

---

## Flusso per Ruolo

### Flusso Centro di Raccolta (CR) — Gestione Deleghe verso Concessionari

```
[A2 - Centro di Raccolta]
│
├─► UC2001 — Ricerca Imprese per nuova delega
│     └─ [<<extend>>] UC2002 — Delega Impresa
│           └─ [<<use>>] UC2003 — Notifica Delega a Concessionari (automatica)
│
├─► UC2004 — Lista Concessionari Delegati
│     └─ [<<extend>>] UC2005 — Dettaglio Delega a Concessionario
│           ├─ [<<extend>>] UC2006 — Modifica Delega
│           ├─ [<<extend>>] UC2007 — Revoca Delega
│           └─ [<<extend>>] UC2008 — Annulla Delega
│
└─► UC2009 — Lista Deleghe Attive
      ├─ [<<extend>>] UC2010 — Stampa Lista Deleghe Attive
      └─ [<<extend>>] UC2011 — Scarica Lista Deleghe Attive
```

### Flusso Concessionario / Automercato (CN, CC, AM) — Visualizzazione Deleghe Ricevute

```
[A3 - Concessionario / Automercato]
│
└─► UC2012 — Lista Demolitori Deleganti
      │  [Nota: mostra sia configurati che non]
      ├─ [<<extend>>] UC2013 — Dettaglio Delega
      │     └─ [<<extend>>] UC2015 — Scarica Lista Deleghe Possedute
      └─ [<<extend>>] UC2014 — Stampa Lista Deleghe Possedute
```

---

## Legenda Abbreviazioni Utenti

| Sigla | Significato |
|-------|-------------|
| CR | Centro di Raccolta |
| CN | Concessionario |
| CC | Casa Costruttrice |
| AM | Automercato |
| PdS | Punto di Servizio (STA) |