## RVFU – Flussi principali (da RVFU.html)

Fonte: `rvfu/RVFU.html` (documentazione API/SDK).

### Struttura generale documentazione

Le intestazioni principali individuate sono, tra le altre:

- `h1: Api Documentation`
- `h2: API and SDK Documentation`
- `h1: AgenziaCR`
- `h1: findAgenziaSedeOperativaUsingGET`
- `h1: findOneUsingGET4`
- `h1: BasicErrorController`
- `h1: errorHtmlUsingDELETE`
- `h1: errorHtmlUsingGET`
- `h1: errorHtmlUsingHEAD`
- `h1: errorHtmlUsingOPTIONS`

Per ciascuna operazione sono presenti sezioni tipiche:

- `Usage and SDK Samples`
- `Parameters`
- `Responses`
  - `Status: 200 - OK`
  - `Status: 401 - Unauthorized`
  - `Status: 403 - Forbidden`
  - `Status: 404 - Not Found`
  - Eventuali altri status (204, ecc.).

### Componenti logici principali

Da `RVFU.html` e `RVFU.json` emergono almeno tre blocchi logici:

- **Agenzia / AgenziaCR / AgenziaSTA**
  - Funzioni di consultazione delle agenzie, sedi operative, ecc.
- **Concessionario / Centri Raccolta**
  - Operazioni di:
    - consultazione e gestione **deleghe**,
    - consultazione/creazione **VFU** (veicoli fuori uso),
    - conferimento/annullamento/stampa/esportazione VFU.
- **Error / BasicErrorController**
  - Gestione centralizzata degli errori HTTP (errorHtml, ecc.).

### Flussi RVFU rilevanti per il modulo Demolizioni

In base alla spec OpenAPI (`RVFU.json`) e alle intestazioni HTML, i flussi che dovremo coprire nel modulo sono principalmente:

1. **Gestione VFU lato Concessionario / Demolitore**
   - Creazione/aggiornamento di un VFU.
   - Consultazione VFU esistenti (ricerca).
   - Conferimento VFU a centro raccolta / agenzia.
   - Annullamento VFU (se previsto).
   - Stampa / export documento VFU.

2. **Consultazione Documenti VFU**
   - Endpoint `.../consulta/documentoVFU/{idVFU}` (Agenzia / Concessionario).
   - Endpoint `.../documentoVFU` per ottenere dettagli documento.

3. **Gestione Deleghe**
   - Creazione/aggiornamento/revoca deleghe.
   - Stampa deleghe.

4. **Integrazioni con Agenzie / Sedi Operative**
   - Consultazione dati agenzia/agenziaSTA/sedi operative per i flussi amministrativi collegati.

Questa pagina è una sintesi strutturale dei flussi così come emergono dalla documentazione HTML; durante l’implementazione andranno aggiunti, per ogni operazione realmente usata, i dettagli tecnici (metodo HTTP, path, parametri obbligatori, corpo richiesta, risposta attesa, errori più comuni).





