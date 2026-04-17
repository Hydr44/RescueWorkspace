# Use Case Diagram — Gestione Rottamazione e Radiazione Veicoli

## Attori (Actors)

| ID | Attore | Note |
|----|--------|-------|
| A1 | Concessionario / Automercato / Centro di Raccolta (Demolitore) | Utente principale del sistema |
| A2 | Centro di Raccolta (Demolitore) | Gestisce rottamazione e documentazione |
| A3 | Punto di Servizio (STA) | Solo se il Centro di Raccolta decide di avvalersene per la gestione del Fascicolo |
| A4 | Centro di Raccolta o Punto di Servizio | Attore ibrido quando il Demolitore si reca alla STA |

---

## Use Cases

### UC1 — Gestione Anagrafica e Utenza Concessionari e Centri di Raccolta
- **Attori coinvolti:** A1
- **Condition:** Se utente è Concessionario o Automercato
- **Descrizione (nota laterale):**
  - Anagrafica Concessionario, Automercato, …
  - Anagrafica Centro di Raccolta
  - Assegnazione matricola di accesso (comunicata via mail)

---

### UC2 — Selezione del Centro di Raccolta
- **Attori coinvolti:** A1
- **Relazioni:** `<<extend>>` UC1

---

### UC3 — Gestione Presa in Carico Veicolo
- **Attori coinvolti:** A1 (Concessionario / Centro di Raccolta)
- **Relazioni:**
  - `<<extend>>` UC_INS (Inserimento Registro Unico Veicoli Fuori Uso)
  - `<<extend>>` UC_RIL (Rilascio Certificato di Rottamazione Firmato)
- **Registra:**
  - Targa, Telaio, Fabbrica, Tipo
  - Intestatario o suo delegato
  - Data e Ora presa in carico
  - Centro di Raccolta
  - **Indirizzo di Ritiro del veicolo** *(campo evidenziato in rosso — rilevante)*
  - Se Controllo veicolo **OK** → Data e ID Certif. Rottamazione, Stato Veicolo = "Preso in carico"
  - Se Controllo veicolo **KO** → Stato Veicolo = "In attesa"
- **Nota contestuale (GESTIONE RITIRO VEICOLO):**
  - Il Concessionario o il Centro di Raccolta prendono in carico il veicolo
  - Rilasciano un Certificato di Rottamazione all'ultimo proprietario

---

### UC_INS — Inserimento Registro Unico Veicoli Fuori Uso
- **Relazioni:** `<<extend>>` UC3
- **Tipo:** Use case di estensione (nessun attore diretto)

---

### UC_RIL — Rilascio Certificato di Rottamazione Firmato
- **Relazioni:** `<<extend>>` UC3
- **Tipo:** Use case di estensione (nessun attore diretto)

---

### UC4 — Gestione Rottamazione
- **Attori coinvolti:** A2 (Centro di Raccolta / Demolitore)
- **Relazioni:**
  - `<<extend>>` UC_AGG (Aggiornamento Registro Unico Veicoli Fuori Uso)
  - `<<extend>>` UC_INS_DOC (Inserisce documentazione nel Fascicolo Demolitore)
  - `<<extend>>` UC_STA (Stampa elenco Veicoli da Radiare)
- **Registra:**
  - Data conferimento al Centro raccolta
- **Nota contestuale (GESTIONE ROTTAMAZIONE):**
  - Il Centro di Raccolta aggiorna il Registro Unico Veicoli Fuori Uso
  - Raccoglie la documentazione per la Radiazione
  - Quando la STA produce la Ricevuta Radiazione → demolisce il veicolo

---

### UC_AGG — Aggiornamento Registro Unico Veicoli Fuori Uso
- **Relazioni:** `<<extend>>` UC4
- **Tipo:** Use case di estensione

---

### UC_INS_DOC — Inserisce Documentazione nel Fascicolo Demolitore
- **Relazioni:** `<<extend>>` UC4
- **Documenti che può contenere:**
  - Carta di Circolazione
  - Certificato di Proprietà
  - DU
  - Copia denuncia smarrimento documenti
  - Certificato Rottamazione
  - Prevista firma digitale FDR per la trasmissione al PdS

---

### UC_STA — Stampa Elenco Veicoli da Radiare
- **Relazioni:** `<<extend>>` UC4
- **Tipo:** Use case di estensione

---

### UC5a — Acquisizione Fascicolo Demolitore
- **Attori coinvolti:** A4 (Centro di Raccolta o Punto di Servizio)
- **Tipo:** Use case autonomo (in alto a destra nel diagramma)

---

### UC6 — Gestione Istanza e Fascicolo
- **Attori coinvolti:** A4 (Centro di Raccolta o Punto di Servizio)
- **Relazioni:** `<<extend>>` UC7
- **Registra:**
  - Data richiesta cancellazione
  - Data consegna Targhe allo STA
  - Data e Protocollo avvenuta cancellazione

---

### UC7 — Gestione Pratica Radiazione per Demolizione
- **Attori coinvolti:** A4
- **Relazioni:** riceve `<<extend>>` da UC6
- **Tipo:** Use case principale del flusso di radiazione

---

### UC8 — Aggiornamento Registro Unico Veicoli Fuori Uso (post-radiazione)
- **Attori coinvolti:** A4
- **Relazioni:** `<<use>>` UC_CAR (Caricamento nel Fascicolo Demolitore della Ricevuta avvenuta radiazione)

---

### UC_CAR — Caricamento nel Fascicolo Demolitore della Ricevuta Avvenuta Radiazione
- **Relazioni:** invocato via `<<use>>` da UC8
- **Tipo:** Use case incluso/usato

---

### UC9 — Distrugge Targhe
- **Attori coinvolti:** A2 / A3
- **Condizione:** Attivato quando UC10 riceve fascicolo completo di "Ricevuta avvenuta Radiazione"

---

### UC10 — Distrugge Veicolo e Documentazione Cartacea
- **Attori coinvolti:** A2 / A3
- **Condizione:** Se Fascicolo completo di "Ricevuta avvenuta Radiazione"
- **Relazione:** collegato a UC9 (distruzione targhe contestuale)

---

## Relazioni tra Use Case

| Tipo | Sorgente | Destinazione |
|------|----------|--------------|
| `<<extend>>` | UC2 — Selezione Centro di Raccolta | UC1 — Gestione Anagrafica |
| `<<extend>>` | UC_INS — Inserimento Reg. Unico | UC3 — Gestione Presa in Carico Veicolo |
| `<<extend>>` | UC_RIL — Rilascio Certificato Rottamazione | UC3 — Gestione Presa in Carico Veicolo |
| `<<extend>>` | UC_AGG — Aggiornamento Reg. Unico | UC4 — Gestione Rottamazione |
| `<<extend>>` | UC_INS_DOC — Inserisce doc Fascicolo | UC4 — Gestione Rottamazione |
| `<<extend>>` | UC_STA — Stampa elenco Veicoli da Radiare | UC4 — Gestione Rottamazione |
| `<<extend>>` | UC6 — Gestione Istanza e Fascicolo | UC7 — Gestione Pratica Radiazione |
| `<<use>>` | UC8 — Aggiornamento Reg. Unico post-radiazione | UC_CAR — Caricamento Ricevuta Fascicolo |

---

## Note di Dominio

### GESTIONE ANAGRAFICA
Riguarda la gestione delle anagrafiche di Concessionari, Automercati e Centri di Raccolta, inclusa l'assegnazione delle matricole di accesso al sistema (comunicate via mail).

### GESTIONE RITIRO VEICOLO
Il Concessionario o il Centro di Raccolta prendono in carico il veicolo e rilasciano un Certificato di Rottamazione all'ultimo proprietario.

### GESTIONE ROTTAMAZIONE
Il Centro di Raccolta:
- aggiorna il Registro Unico Veicoli Fuori Uso
- raccoglie la documentazione per la Radiazione

Quando la STA produce la Ricevuta Radiazione → demolisce il veicolo.

### GESTIONE CESSAZIONE per DEMOLIZIONE
Per la Radiazione, il Demolitore comunica al Punto di Servizio le informazioni necessarie al riutilizzo dei dati del veicolo demolito e della cartella associata. Consegna:
- le targhe
- l'elenco dei Fascicoli inviati
- i documenti al Punto di Servizio

---

## Flusso Principale (Happy Path)

```
1. [A1] Gestione Anagrafica e Utenza (UC1)
   └─ [A1] Selezione Centro di Raccolta (UC2) [<<extend>>]

2. [A1] Gestione Presa in Carico Veicolo (UC3)
   ├─ [<<extend>>] Inserimento Registro Unico Veicoli Fuori Uso (UC_INS)
   └─ [<<extend>>] Rilascio Certificato di Rottamazione Firmato (UC_RIL)

3. [A2] Gestione Rottamazione (UC4)
   ├─ [<<extend>>] Aggiornamento Registro Unico Veicoli Fuori Uso (UC_AGG)
   ├─ [<<extend>>] Inserisce documentazione nel Fascicolo Demolitore (UC_INS_DOC)
   └─ [<<extend>>] Stampa elenco Veicoli da Radiare (UC_STA)

4. [A4] Acquisizione Fascicolo Demolitore (UC5a)

5. [A4] Gestione Istanza e Fascicolo (UC6)
   └─ [<<extend>>] Gestione Pratica Radiazione per Demolizione (UC7)

6. [A4] Aggiornamento Registro Unico Veicoli Fuori Uso — post radiazione (UC8)
   └─ [<<use>>] Caricamento Ricevuta avvenuta radiazione nel Fascicolo (UC_CAR)

7. [A2/A3] Distrugge Veicolo e Documentazione Cartacea (UC10)
   └─ [condizione] Se Fascicolo completo → Distrugge Targhe (UC9)
```