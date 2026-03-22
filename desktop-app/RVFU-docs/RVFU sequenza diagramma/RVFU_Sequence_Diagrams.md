# RVFU — Sequence Diagrams (Markdown-ready)

> Questo file è pensato per essere **letto direttamente da Cursor** o trasformato in altri formati.  
> Include diagrammi **Mermaid** e riferimenti agli endpoint usati nei flussi.

## 1) Presa in carico veicolo ritirato da CR

```mermaid
sequenceDiagram
    autonumber
    participant CR as Centro di Raccolta (CR)
    participant API as RVFU API
    participant Tablet as Dispositivo di Firma (FDR/Tablet)
    participant STA as Agenzia STA

    Note over CR,API: Presa in carico veicolo ritirato da CR

    CR->>API: GET /rvfu/sh/cr/veicolo<br/>(Verifica veicolo)

    alt Flusso digitale
        CR->>API: POST /rvfu/sh/cr/VFU<br/>(Registra veicolo ritirato)
        CR->>API: POST /rvfu/sh/cr/genera/certificatoRottamazione<br/>(Genera CDR)
        CR->>API: POST /rvfu/sh/cr/genera/ricevutaPresaInCarico<br/>(Genera ricevuta)
    else Flusso cartaceo
        CR->>API: POST /rvfu/sh/cr/allega/documentoVFU<br/>(Allega CDR cartaceo)
        CR->>API: POST /rvfu/sh/cr/allega/documentoVFU<br/>(Allega ricevuta cartacea)
    end

    Note right of API: Il fascicolo viene creato automaticamente<br/>con la generazione del certificato

    CR->>API: POST /rvfu/sh/cr/allega/documentoVFU<br/>(Aggiungi doc e allegati)
    CR->>API: GET /rvfu/sh/cr/documentoVFU<br/>(Dettaglio fascicolo)

    CR->>API: POST /rvfu/sh/cr/inviaAlTablet<br/>(Invio documenti in firma)
    Tablet-->>CR: Firma completata
    CR->>API: GET /rvfu/sh/cr/consulta/documentoVFU<br/>(Recupera documenti firmati)

    CR->>API: PUT /rvfu/sh/cr/verifica/VFU<br/>(Verifica veicolo)
    CR->>API: GET /rvfu/sh/cr/agenziaSTA<br/>(Ricerca agenzia)
    CR->>API: POST /rvfu/sh/cr/inoltraSTA/VFU/<br/>(Assegna a STA)

    CR->>API: POST /rvfu/sh/cr/chiudi/fascicolo<br/>(Chiudi fascicolo)
```

---

## 2) Presa in carico veicolo conferito da Concessionario

```mermaid
sequenceDiagram
    autonumber
    participant CR as Centro di Raccolta (CR)
    participant API as RVFU API

    Note over CR,API: Presa in carico veicolo conferito da Concessionario

    CR->>API: GET /rvfu/sh/cr/consultaPresaInCarico/VFU<br/>(Ricerca veicolo)
    CR->>API: GET /rvfu/sh/cr/VFU<br/>(Dettaglio veicolo conferito)
    CR->>API: POST /rvfu/sh/cr/prendiInCarico/VFU<br/>(Presa in carico)

    Note over CR,API: Proseguire come nel flusso precedente<br/>da “Aggiungi doc e allegati”
```

---

## Riepilogo endpoint (per ricerca/grep rapido)

| Azione | Metodo + Path |
|---|---|
| Verifica veicolo | `GET /rvfu/sh/cr/veicolo` |
| Registra VFU (ritirato) | `POST /rvfu/sh/cr/VFU` |
| Genera Certificato di Rottamazione (CDR) | `POST /rvfu/sh/cr/genera/certificatoRottamazione` |
| Genera Ricevuta Presa in Carico | `POST /rvfu/sh/cr/genera/ricevutaPresaInCarico` |
| Allega documento (CDR/Ricevuta/Altro) | `POST /rvfu/sh/cr/allega/documentoVFU` |
| Dettaglio fascicolo / documenti | `GET /rvfu/sh/cr/documentoVFU` |
| Invio in firma (FDR/Tablet) | `POST /rvfu/sh/cr/inviaAlTablet` |
| Recupera documenti firmati | `GET /rvfu/sh/cr/consulta/documentoVFU` |
| Verifica VFU | `PUT /rvfu/sh/cr/verifica/VFU` |
| Ricerca Agenzia STA | `GET /rvfu/sh/cr/agenziaSTA` |
| Inoltro a STA | `POST /rvfu/sh/cr/inoltraSTA/VFU/` |
| Chiusura fascicolo | `POST /rvfu/sh/cr/chiudi/fascicolo` |
| Ricerca VFU “da prendere in carico” (conferiti) | `GET /rvfu/sh/cr/consultaPresaInCarico/VFU` |
| Dettaglio VFU | `GET /rvfu/sh/cr/VFU` |
| Prendi in carico VFU | `POST /rvfu/sh/cr/prendiInCarico/VFU` |

> **Nota:** nel documento originale alcune etichette riportano possibili refusi (es. `cunsulta`). Qui è stato uniformato a `consulta`. Se preferisci mantenere esattamente il testo originale, dimmelo e genero una variante “as-is”.

---

### Uso in Cursor
- Salva questo file come `RVFU_Sequence_Diagrams.md` nella repo.
- Cursor/VS Code renderizzerà automaticamente i diagrammi Mermaid nel preview Markdown.
