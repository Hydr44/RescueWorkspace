# Sequence Diagram — Presa in Carico CR (RVFU)

Questo documento descrive i sequence diagram relativi alla **Gestione Presa in Carico** lato Centro di Raccolta (CR), con i relativi endpoint REST del sistema RVFU.

---

## Flusso 1 — Presa in Carico Veicolo Ritirato da CR

Il CR ritira direttamente il veicolo e lo registra nel sistema. Il flusso si biforca a seconda che la documentazione sia **cartacea** o **digitale**.

### Step 1 — Verifica Veicolo

| Campo | Valore |
|-------|--------|
| Azione | Verifica Veicolo |
| Endpoint | `GET /rvfu/sh/cr/veicolo` |

---

### Step 2a — Flusso Cartaceo

Attivato quando il veicolo ha documentazione in formato cartaceo.

| Step | Azione | Endpoint |
|------|--------|----------|
| 2a.1 | Inserisci Dati Certificato Rottamazione | `POST /cr/allega/documentoVFU/` |
| 2a.2 | Registra Veicolo Ritirato | `POST /rvfu/sh/cr/VFU` |
| 2a.3 | Genera Certificato (Rottamazione) | `POST /rvfu/sh/cr/genera/certificatoRottamazione` |
| 2a.4 | Firma Certificato / Ricevuta | `POST /rvfu/sh/cr/inviaAlTablet` |
| 2a.5 | Crea Fascicolo Veicolo Fuori Uso | *(automatico — creato con la generazione del certificato)* |

> **Nota:** Il fascicolo viene **creato automaticamente** al momento della generazione del certificato di rottamazione.

---

### Step 2b — Flusso Digitale

Attivato quando il veicolo ha documentazione in formato digitale.

#### Sotto-caso: Veicolo NON iscritto al PRA

| Step | Azione | Endpoint |
|------|--------|----------|
| 2b.1 | Inserisci Dati Ricevuta Presa in Carico | `POST /cr/allega/documentoVFU/` |
| 2b.2 | Registra Veicolo Ritirato | `POST /rvfu/sh/cr/VFU` |
| 2b.3 | Genera Ricevuta Presa in Carico Documentazione | `POST /rvfu/sh/cr/genera/ricevutaPresaInCarico` |
| 2b.4 | Firma Certificato / Ricevuta | `POST /rvfu/sh/cr/inviaAlTablet` |
| 2b.5 | Crea Fascicolo Veicolo Fuori Uso | *(automatico — creato con la generazione del certificato)* |

---

### Step 3 — Gestione Fascicolo (comune a cartaceo e digitale)

Dopo la creazione del fascicolo, il flusso è identico per entrambi i casi.

| Step | Azione | Endpoint |
|------|--------|----------|
| 3.1 | Aggiungi Documenti e Allegati | `POST /rvfu/sh/cr/allega/documentoVFU` |
| 3.2 | Dettaglio Fascicolo | `GET /rvfu/sh/cr/documentoVFU` |
| 3.3 | Firma Fascicolo | `POST /rvfu/sh/cr/inviaAlTablet` |
| 3.4 | Recupera Documenti Firmati | `GET /rvfu/sh/cr/consulta/documentoVFU` *(sic — typo nel doc originale)* |

---

### Step 4 — Chiusura e Invio a STA

| Step | Azione | Endpoint |
|------|--------|----------|
| 4.1 | Verifica Veicolo (pre-chiusura) | `GET /rvfu/sh/cr/verifica/VFU` |
| 4.2 | Ricerca Agenzia (STA) | `GET /rvfu/sh/cr/agenziaSTA` |
| 4.3 | Assegna a STA | `POST /rvfu/sh/cr/inoltraSTA/VFU/` |
| 4.4 | Chiudi Fascicolo | `POST /rvfu/sh/cr/chiudi/fascicolo` |

---

## Flusso 2 — Presa in Carico Veicolo Conferito da Concessionario

Il Concessionario ha già effettuato la presa in carico (flusso lato CN/AM); il CR riceve il veicolo conferito e lo prende a sua volta in carico.

| Step | Azione | Endpoint |
|------|--------|----------|
| 1 | Ricerca Veicolo (conferito) | `GET /rvfu/sh/cr/consultaPresaInCarico/VFU` |
| 2 | Dettaglio Veicolo Conferito | `GET /rvfu/sh/cr/VFU` |
| 3 | Presa in Carico | `POST /rvfu/sh/cr/prendiInCarico/VFU` |
| 4+ | Aggiungi Doc e Allegati → … → Chiudi Fascicolo | **→ Prosegue dal Step 3.1 del Flusso 1** (stessa sequenza da "Aggiungi Doc e Allegati" in poi) |

> **Nota:** Dopo la presa in carico del veicolo conferito, il flusso si riconduce al **Flusso 1 dallo step 3.1** (`/cr/allega/documentoVFU`), identico per entrambi gli scenari.

---

## Riepilogo Endpoint REST

| Endpoint | Metodo | Descrizione |
|----------|--------|-------------|
| `/rvfu/sh/cr/veicolo` | GET | Verifica dati veicolo |
| `/rvfu/sh/cr/VFU` | POST | Registra veicolo ritirato |
| `/rvfu/sh/cr/VFU` | GET | Dettaglio veicolo conferito |
| `/rvfu/sh/cr/verifica/VFU` | GET | Verifica veicolo pre-chiusura fascicolo |
| `/cr/allega/documentoVFU/` | POST | Inserisce dati Certificato Rottamazione o Ricevuta Presa in Carico |
| `/rvfu/sh/cr/allega/documentoVFU` | POST | Aggiungi documenti e allegati al fascicolo |
| `/rvfu/sh/cr/documentoVFU` | GET | Dettaglio fascicolo |
| `/rvfu/sh/cr/cunsulta/documentoVFU` | GET | Recupera documenti firmati *(typo: "cunsulta" nel doc originale)* |
| `/rvfu/sh/cr/genera/certificatoRottamazione` | POST | Genera Certificato di Rottamazione |
| `/rvfu/sh/cr/genera/ricevutaPresaInCarico` | POST | Genera Ricevuta Presa in Carico |
| `/rvfu/sh/cr/inviaAlTablet` | POST | Firma Certificato / Ricevuta / Fascicolo (invio a tablet per firma) |
| `/rvfu/sh/cr/agenziaSTA` | GET | Ricerca Agenzia / Punto di Servizio STA |
| `/rvfu/sh/cr/inoltraSTA/VFU/` | POST | Assegna veicolo a STA |
| `/rvfu/sh/cr/chiudi/fascicolo` | POST | Chiudi fascicolo (→ stato: DA RADIARE) |
| `/rvfu/sh/cr/consultaPresaInCarico/VFU` | GET | Ricerca veicolo conferito da Concessionario |
| `/rvfu/sh/cr/prendiInCarico/VFU` | POST | Presa in carico veicolo conferito da CR |

---

## Note Tecniche

- Il prefisso comune a quasi tutti gli endpoint è `/rvfu/sh/cr/` — suggerisce un namespace dedicato al ruolo CR (Centro di Raccolta) all'interno dell'applicazione RVFU.
- La **firma** (certificato, ricevuta, fascicolo) avviene sempre tramite lo stesso endpoint `/inviaAlTablet` — presumibilmente un meccanismo di firma digitale delegata a dispositivo mobile/tablet.
- Il typo `cunsulta` nell'endpoint di recupero documenti firmati è presente nel documento originale — da verificare con il team DXC/MIT prima dell'implementazione.
- Il Fascicolo VFU viene **creato automaticamente** alla generazione del primo documento (certificato o ricevuta) — non esiste una chiamata esplicita di creazione fascicolo.