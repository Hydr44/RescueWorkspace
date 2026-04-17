# RVFU Workflow - Implementazione Completa

## Overview
Implementazione completa del workflow RVFU (Radiazione Veicoli Fuori Uso) integrato con le API ACI.

## Componenti Creati

### 1. State Machine (`src/lib/vfu-state-machine.ts`)
Gestisce gli stati VFU e le transizioni disponibili:
- **Stati**: INSERITO, CONFERITO, PRESO_IN_CARICO, DA_RADIARE, INVIATO_A_STA, IN_RADIAZIONE, RADIATO, DEMOLITO, ANNULLATO, CEDUTO, TRASFERITO, VALIDATO
- **Funzioni**:
  - `getAzioniDisponibili(stato, fascicoloStato)` - Restituisce azioni disponibili per lo stato corrente
  - `getStatoBadgeColor(stato)` - Colore badge UI per ogni stato
  - `getStatoLabel(stato)` - Label italiano per ogni stato
  - `getWorkflowSteps(stato)` - Calcola progresso workflow

### 2. Componenti UI

#### VFUWorkflowStepper (`src/components/rvfu/VFUWorkflowStepper.jsx`)
Stepper orizzontale che mostra il progresso del workflow con 6 fasi principali:
1. Registrazione
2. Conferimento
3. Presa in Carico
4. Radiazione PRA
5. Demolizione
6. Completato

#### VFUFascicoloTab (`src/components/rvfu/VFUFascicoloTab.jsx`)
Gestione documenti fascicolo:
- Lista documenti con tipo, data, dimensione
- Upload nuovi documenti (PDF, immagini)
- Download documenti esistenti
- Chiusura/riapertura fascicolo
- Indicatore stato fascicolo (APERTO/CHIUSO)

#### VFUAzioniTab (`src/components/rvfu/VFUAzioniTab.jsx`)
Tab azioni context-aware con 16 azioni disponibili:
1. **chiudiFascicolo** - Chiude fascicolo documentale
2. **riapriFascicolo** - Riapre fascicolo chiuso
3. **inoltraSTA** - Inoltra a STA per radiazione PRA (richiede codice agenzia)
4. **confermaRadiazione** - Conferma avvenuta radiazione
5. **generaCDR** - Genera e scarica Certificato Rottamazione PDF
6. **generaRicevuta** - Genera e scarica ricevuta presa in carico PDF
7. **demolisci** - Segna VFU come demolito (richiede date e numero targhe)
8. **annulla** - Annulla VFU (richiede motivazione)
9. **prendiInCarico** - Prendi in carico VFU conferito
10. **annullaInoltroSTA** - Annulla inoltro a STA
11. **cedi** - Cedi VFU ad altro CR (richiede CF destinatario)
12. **trasferisci** - Trasferisci VFU (richiede CF nuovo CR e motivazione)
13. **integra** - Invia dati integrazione richiesti da STA
14. **modifica** - Modifica dati VFU
15. **esportaExcel** - Export lista VFU in Excel
16. **stampaPDF** - Stampa lista VFU in PDF

Ogni azione include:
- Modal di conferma personalizzato
- Form di input specifici per l'azione
- Validazione campi obbligatori
- Feedback visivo (loading, success, error)

#### VFUStoricoTab (`src/components/rvfu/VFUStoricoTab.jsx`)
Timeline eventi VFU:
- Eventi ordinati cronologicamente (dal più recente)
- Icone e colori per tipo evento
- Date formattate locale italiano
- Badge stato per ogni evento

### 3. Pagina Dettaglio Refactored (`src/pages/DemolizioneRVFUDettaglioNew.jsx`)
Nuova pagina dettaglio con architettura a tab:

**Tab Disponibili**:
1. **Panoramica** - Dati veicolo, intestatario, detentore, note
2. **Fascicolo** - Gestione documenti
3. **Azioni** - Azioni workflow disponibili
4. **Storico** - Timeline eventi

**Caratteristiche**:
- Supporto doppia modalità: RVFU autenticato + Locale (Supabase)
- Workflow stepper sempre visibile
- Badge stato in header
- Download automatico PDF per CDR e ricevute
- Gestione errori robusta
- Auto-refresh dopo ogni azione

## API Client Extensions (`src/lib/rvfu-client.ts`)

### Metodi Aggiunti
- `trasferisciVFU(idVFU, payload)` - PUT /cr/trasferisci/VFU/{idVFU}
- `integraVFU(idVFU, payload)` - PUT /cr/integra/VFU/{idVFU}

### Metodi Esistenti Utilizzati
- `chiudiFascicolo(idVFU)` - PUT /cr/chiudi/fascicolo/{idVFU}
- `riapriFascicolo(idVFU)` - PUT /cr/riapri/fascicolo/{idVFU}
- `inoltraSTA(codiceSTA, idVFUList)` - PUT /cr/inoltraSTA/VFU/{codiceSTA}
- `confermaRadiazione(idVFU)` - PUT /cr/confermaRadiazioneVFU/VFU/{idVFU}
- `generaCDR(idVFU)` - POST /cr/genera/certificatoRottamazione/{idVFU}
- `generaRicevuta(idVFU)` - POST /cr/genera/ricevutaPresaInCarico/{idVFU}
- `demolisciVFU(idVFU, payload)` - PUT /cr/demolisci/VFU/{idVFU}
- `annullaVFU(idVFU, payload)` - PUT /cr/annulla/VFU/{idVFU}
- `prendiInCarico(idVFU, payload)` - PUT /cr/prendiInCarico/VFU/{idVFU}
- `annullaInoltroSTA(idVFU)` - PUT /cr/annullaInoltroSTA/VFU/{idVFU}
- `cediVFU(idVFU, payload)` - PUT /cr/cedi/VFU/{idVFU}
- `consultaDocumenti(idVFU)` - GET /cr/consulta/documentoVFU/{idVFU}
- `allegaDocumento(idVFU, payload)` - POST /cr/allega/documentoVFU/{idVFU}
- `downloadDocumento(params)` - GET /cr/documentoVFU

## Workflow States e Transizioni

### Stati VFU
```
INSERITO → CONFERITO → PRESO_IN_CARICO → DA_RADIARE → INVIATO_A_STA → 
IN_RADIAZIONE → RADIATO → DEMOLITO

Branch alternativi:
- ANNULLATO (da qualsiasi stato pre-demolizione)
- CEDUTO (da PRESO_IN_CARICO)
- TRASFERITO (da CONFERITO o PRESO_IN_CARICO)
- VALIDATO (stato finale alternativo)
```

### Azioni per Stato

**INSERITO**:
- Modifica dati
- Annulla
- Chiudi/Riapri fascicolo

**CONFERITO**:
- Prendi in carico
- Trasferisci
- Annulla
- Chiudi/Riapri fascicolo

**PRESO_IN_CARICO**:
- Chiudi fascicolo (→ DA_RADIARE)
- Cedi
- Trasferisci
- Demolisci (se no PRA)
- Chiudi/Riapri fascicolo

**DA_RADIARE**:
- Inoltra STA
- Genera CDR
- Genera Ricevuta
- Chiudi/Riapri fascicolo

**INVIATO_A_STA**:
- Annulla inoltro STA
- Integra dati (se richiesto)
- Chiudi/Riapri fascicolo

**IN_RADIAZIONE**:
- Conferma radiazione
- Chiudi/Riapri fascicolo

**RADIATO**:
- Demolisci
- Genera CDR
- Chiudi/Riapri fascicolo

**DEMOLITO**:
- Genera CDR
- Solo visualizzazione

## Fix Implementati

### 1. Codice Fiscale Intestatario (`src/pages/DemolizioneRVFUForm.jsx`)
**Problema**: Errore "Codice fiscale intestatario è obbligatorio" durante sync RVFU.

**Soluzione**: Aggiunto oggetto completo `meta.intestatario` con tutti i campi richiesti:
```javascript
meta: {
  intestatario: {
    codiceFiscale: formData.proprietario_cf,
    nome: formData.proprietario_nome,
    cognome: formData.proprietario_cognome,
    ragioneSociale: formData.proprietario_ragioneSociale,
    tipoPersonaGiuridica: formData.proprietario_tipoPersona,
    dataNascita: formData.proprietario_dataNascita,
    comuneNascita: formData.proprietario_comuneNascita,
    provinciaNascita: formData.proprietario_provinciaNascita,
    indirizzoResidenza: formData.proprietario_indirizzoResidenza,
    // ... altri campi
  }
}
```

## Form Dati Specifici per Azione

### Annullamento
- `motivoEliminazione` (textarea, obbligatorio)

### Demolizione
- `dataDemolizione` (date, default oggi)
- `dataBonifica` (date, opzionale)
- `numeroTargheDistrutte` (number 0-2, default 2)

### Presa in Carico
- `dataPresaInCarico` (date, default oggi)

### Inoltra STA
- `codiceSTA` (text, obbligatorio)

### Cessione
- `codiceFiscaleDestinatario` (text 16 char, obbligatorio)
- `matricolaSedeDestinatario` (text, opzionale)

### Trasferimento
- `codiceFiscaleNuovoCR` (text 16 char, obbligatorio)
- `motivazione` (textarea, opzionale)

### Integrazione
- `datiIntegrazione` (textarea, obbligatorio)

## Testing

### Flusso Base Centro Raccolta (CR)
1. ✅ Crea nuovo VFU (Form) → stato INSERITO
2. ✅ Sync RVFU → CF intestatario corretto
3. ✅ Visualizza dettaglio → Tab panoramica, fascicolo, azioni, storico
4. ✅ Workflow stepper → mostra passo corrente
5. ✅ Chiudi fascicolo → INSERITO → DA_RADIARE (se con PRA)
6. ✅ Inoltra STA → DA_RADIARE → INVIATO_A_STA
7. ✅ Conferma radiazione → IN_RADIAZIONE → RADIATO
8. ✅ Demolisci → RADIATO → DEMOLITO
9. ✅ Genera CDR → Download PDF automatico

### Flusso Concessionario → CR
1. Registra VFU come Concessionario → INSERITO
2. Conferisci a CR → CONFERITO
3. CR prende in carico → PRESO_IN_CARICO
4. CR chiude fascicolo → DA_RADIARE
5. Continua come flusso CR standard

### Gestione Documenti
1. ✅ Upload documento (PDF/IMG) → Allegato a fascicolo
2. ✅ Download documento → Blob scaricato
3. ✅ Lista documenti → Mostra tipo, data, dimensione

## Modalità Locale vs RVFU

### Modalità Locale (Supabase)
- Non richiede autenticazione RVFU
- Dati salvati solo su Supabase
- VFUProcessingTimeline visibile (9 fasi D.Lgs 209/2003)
- Azioni workflow limitate (no chiamate API RVFU)
- Badge "Locale" in header

### Modalità RVFU (Autenticato)
- Richiede login RVFU
- Tutte le azioni workflow disponibili
- Sync bidirezionale Supabase ↔ RVFU
- Download PDF CDR e ricevute
- Gestione fascicolo completa

## Known Issues & Limitations

1. **Lint warnings**: Prop validations mancanti nei componenti (non bloccante)
2. **State machine complexity**: SonarQube segnala complessità elevata (funzionale)
3. **API errors 401**: Alcuni endpoint PagoPA richiedono permessi aggiuntivi utente
4. **Form validations**: Validazione base HTML5, potrebbe essere rafforzata con schema validator

## Next Steps (Opzionali)

1. **Integrazione PagoPA** - Visualizzare stato pagamenti nel tab Panoramica
2. **Notifiche Email** - Auto-invio email a intestatario per cambio stato
3. **Export bulk** - Selezione multipla VFU per export/stampa
4. **Ricerca avanzata** - Filtri aggiuntivi in lista VFU
5. **Dashboard analytics** - Statistiche VFU per stato/periodo
6. **Mobile responsive** - Ottimizzazione layout tablet/mobile
7. **Unit tests** - Test coverage componenti e state machine
8. **E2E tests** - Playwright per flussi completi

## Deployment Notes

- ✅ Routing aggiornato in `App.jsx`
- ✅ Tutti i componenti importati correttamente
- ✅ No breaking changes per funzionalità esistenti
- ✅ Backwards compatible con vecchio dettaglio
- ⚠️ Richiede restart app per applicare nuova route

## Performance

- Lazy loading componenti tab (solo tab attivo renderizzato)
- Debounce su ricerca documenti
- Memoization badge colors
- Batch API calls dove possibile

## Accessibilità

- Keyboard navigation su tab
- ARIA labels su form
- Focus management su modal
- Screen reader friendly badges

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Electron 20+ (target principale)
