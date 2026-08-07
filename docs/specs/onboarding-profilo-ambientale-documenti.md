# Specifica: onboarding automatico del profilo ambientale da documenti

> **Parte della progettazione "Semplificazione processi ambientali"** — master: **[semplificazione-processi-ambientali.md](semplificazione-processi-ambientali.md)**. Questo file dettaglia le **Fasi 0–1** (profilo ambientale + onboarding chiavi-in-mano) sul versante *estrazione da documenti*: quali documenti chiedere, cosa estrarne, con quali regole. Solo progettazione — nessuna implementazione.

**Progetto:** RescueManager — modulo autodemolitori / gestione rifiuti
**Scopo:** definire quali documenti richiedere a ogni cliente (autodemolitore), cosa estrarne automaticamente, con quali regole di validazione, per configurare il suo ambiente (profilo trasporto, profilo impianto, scadenzario, guardrail FIR/RENTRI) senza inserimento manuale.
**Caso di riferimento:** SCOZZARINI SERVICE CAR S.R.L. (documenti reali analizzati a luglio 2026).

---

## 1. Documenti da richiedere al cliente

### Set minimo — SOLO DUE documenti

| # | Documento | Dove lo prende il cliente | Cosa configura |
|---|---|---|---|
| 1 | **Informazioni inerenti l'iscrizione dell'impresa** | Area riservata Albo Gestori Ambientali (albonazionalegestoriambientali.it) → Profilo impresa; un solo PDF | TUTTO il lato trasporto: anagrafica, categorie/classi, validità, RT, veicoli, CER per categoria |
| 2 | **Autorizzazione impianto** (provvedimento ex art. 208 D.Lgs. 152/2006, o AUA/AIA) | Regione/Provincia (archivio del cliente) | TUTTO il lato impianto: CER ammessi in ingresso, operazioni R13/R12/D15..., quantità max stoccaggio, prescrizioni |

Il flusso di onboarding chiede esplicitamente questi due file e nient'altro ("entra nell'area riservata dell'Albo, scarica il PDF 'Informazioni iscrizione'; poi carica l'autorizzazione dell'impianto").

### Opzionali — accettati se caricati, mai richiesti

| Documento | Valore aggiunto |
|---|---|
| Estrazione elenco mezzi (VisuraMezzi) | Matrice CER-per-targa più leggibile + stato mezzo (attivo/sospeso); il doc #1 contiene già veicoli e CER |
| Attestato iscrizione (QR) | Verifica autenticità — ma sostituibile con la verifica d'ufficio (v. sotto) |
| Provvedimento di iscrizione Albo | Fallback del doc #1; unico ad aggiungere i dati della garanzia finanziaria (compagnia, n. polizza, importo) |
| Numero RENTRI + unità locali | Solo se già iscritto; altrimenti lo impostiamo noi (servizio di onboarding) |
| Visura camerale | NON richiederla: si recupera in automatico dal CF |

### Riduzione a zero documenti per il trasporto (evoluzione)

L'Albo Gestori Ambientali espone una **ricerca pubblica per codice fiscale** sul proprio portale: con il solo CF il sistema può recuperare e verificare d'ufficio iscrizione, categorie e validità, chiedendo al cliente soltanto conferma. In prospettiva, quindi, l'unico documento realmente indispensabile che il cliente deve caricare è l'**autorizzazione dell'impianto** (non esiste alcuna banca dati interrogabile che la contenga). Implementare la ricerca pubblica anche come verifica periodica di vigenza dei profili già configurati.

---

## 2. Regole di validazione e anti-errore (guardrail dell'onboarding)

Queste regole nascono da casi reali osservati nei documenti di esempio:

1. **Il codice fiscale è la chiave.** Ogni documento caricato deve riportare il CF dell'impresa del profilo. Se il CF estratto ≠ CF del profilo → **blocco con avviso**: "Questo documento appartiene a {denominazione}, CF {cf} — impresa diversa da quella del profilo."
   *Caso reale:* nel set Scozzarini era presente un provvedimento del 2011 intestato a SCOZZARINI S.R.L. (CF 01726430851), impresa diversa da SCOZZARINI SERVICE CAR S.R.L. (CF 01935590859). Senza questo controllo, il profilo sarebbe stato inquinato da dati di un altro soggetto giuridico.
2. **Gli estratti del portale vincono sui provvedimenti scansionati.** Ordine di affidabilità: estratto portale Albo (nativo digitale, aggiornato) > provvedimento recente (nativo digitale) > scansione. A parità di campo, vince la fonte più affidabile e più recente.
3. **Ogni dato ha una validità temporale.** Estrarre sempre inizio/fine validità per categoria. Un provvedimento più recente sulla stessa categoria **sostituisce** il precedente. Documenti con fine validità superata → accettati solo come storico, mai come configurazione attiva.
4. **Verifica online via QR.** Se è presente l'attestato QR, verificare l'iscrizione sul servizio pubblico dell'Albo e marcare il profilo come "verificato" con data. Ripetere la verifica periodicamente (es. mensile) e alla scadenza di ogni categoria.
5. **Validazione umana sempre.** L'estrazione AI compila una schermata "documento a sinistra, campi estratti a destra"; l'operatore (o il cliente) conferma campo per campo prima dell'attivazione. Confidence bassa su un campo → evidenziarlo.
6. **Scadenzario automatico.** Da ogni validità estratta nascono alert: rinnovo iscrizione Albo (istanza entro 5 mesi prima della scadenza), rinnovo garanzia finanziaria, verifica RT. Alert a 6 mesi / 3 mesi / 1 mese.
7. **Coerenza incrociata.** Le targhe nel doc #2 devono comparire anche nel doc #1/#6; un CER usato in un FIR deve esistere sia nel profilo trasporto (per il mezzo scelto) sia nell'autorizzazione del destinatario.

---

## 3. Schema JSON di estrazione — profilo trasporto (docs #1, #2, #6)

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "ProfiloTrasportoAlbo",
  "type": "object",
  "required": ["impresa", "iscrizione_albo", "categorie", "veicoli", "fonte"],
  "properties": {
    "impresa": {
      "type": "object",
      "required": ["denominazione", "codice_fiscale"],
      "properties": {
        "denominazione": { "type": "string" },
        "codice_fiscale": { "type": "string", "pattern": "^[0-9]{11}$|^[A-Z0-9]{16}$" },
        "forma_giuridica": { "type": "string" },
        "sede": {
          "type": "object",
          "properties": {
            "indirizzo": { "type": "string" },
            "cap": { "type": "string" },
            "comune": { "type": "string" },
            "provincia": { "type": "string" }
          }
        },
        "pec": { "type": "string" },
        "numero_addetti": { "type": "integer" },
        "attivita_ateco": {
          "type": "array",
          "items": { "type": "object", "properties": {
            "codice": { "type": "string" }, "descrizione": { "type": "string" } } }
        }
      }
    },
    "iscrizione_albo": {
      "type": "object",
      "required": ["numero_iscrizione", "sezione_regionale"],
      "properties": {
        "numero_iscrizione": { "type": "string" },
        "sezione_regionale": { "type": "string" },
        "verificato_online": { "type": "boolean" },
        "data_verifica": { "type": "string", "format": "date" }
      }
    },
    "categorie": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["categoria", "fine_validita"],
        "properties": {
          "categoria": { "type": "string", "description": "es. 2-bis, 4, 5, 6, 8, 9, 10" },
          "classe": { "type": "string", "description": "A-F; 'unica' per 2-bis" },
          "descrizione": { "type": "string" },
          "regime": { "type": "string", "enum": ["conto_proprio", "conto_terzi"] },
          "inizio_validita": { "type": "string", "format": "date" },
          "fine_validita": { "type": "string", "format": "date" },
          "limite_quantita_annua_t": { "type": "number" },
          "cer_non_pericolosi": { "type": "array", "items": { "type": "string" } },
          "cer_pericolosi": { "type": "array", "items": { "type": "string" } },
          "responsabili_tecnici": {
            "type": "array",
            "items": { "type": "object", "properties": {
              "nome": { "type": "string" }, "codice_fiscale": { "type": "string" } } }
          },
          "garanzia_finanziaria": {
            "type": "object",
            "properties": {
              "tipo": { "type": "string", "description": "polizza fideiussoria / fideiussione bancaria" },
              "compagnia": { "type": "string" },
              "numero": { "type": "string" },
              "importo_eur": { "type": "number" }
            }
          }
        }
      }
    },
    "veicoli": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["targa", "categorie_attive"],
        "properties": {
          "targa": { "type": "string" },
          "telaio": { "type": "string" },
          "tipo": { "type": "string" },
          "titolo_disponibilita": { "type": "string" },
          "stato": { "type": "string", "enum": ["attivo", "sospeso", "cancellato"] },
          "uso_proprio_esente_licenza": { "type": "boolean" },
          "categorie_attive": { "type": "array", "items": { "type": "string" } },
          "cer_per_categoria": {
            "type": "object",
            "additionalProperties": { "type": "array", "items": { "type": "string" } },
            "description": "chiave = categoria (es. '5'), valore = lista CER trasportabili con quel mezzo in quella categoria"
          }
        }
      }
    },
    "fonte": {
      "type": "object",
      "properties": {
        "documenti": {
          "type": "array",
          "items": { "type": "object", "properties": {
            "nome_file": { "type": "string" },
            "tipo": { "type": "string", "enum": ["estratto_portale_albo", "provvedimento", "attestato_qr", "scansione"] },
            "protocollo": { "type": "string" },
            "data_documento": { "type": "string", "format": "date" },
            "affidabilita": { "type": "string", "enum": ["alta", "media", "bassa"] } } }
        }
      }
    },
    "anomalie": {
      "type": "array",
      "items": { "type": "object", "properties": {
        "tipo": { "type": "string", "enum": ["cf_diverso", "documento_scaduto", "documento_sostituito", "targa_incoerente", "campo_illeggibile"] },
        "gravita": { "type": "string", "enum": ["blocco", "avviso"] },
        "messaggio": { "type": "string" },
        "documento": { "type": "string" } } }
    }
  }
}
```

Convenzione CER: stringa a 6 cifre con punti, asterisco per i pericolosi (es. `"16.01.04*"`).

---

## 4. Esempio compilato — dati reali SCOZZARINI SERVICE CAR S.R.L.

```json
{
  "impresa": {
    "denominazione": "SCOZZARINI SERVICE CAR S.R.L.",
    "codice_fiscale": "01935590859",
    "forma_giuridica": "Società a Responsabilità Limitata",
    "sede": { "indirizzo": "Contrada Fiaccavento S.N.", "cap": "93012", "comune": "Gela", "provincia": "CL" },
    "pec": "SCOZZARINISC@PEC.IT",
    "numero_addetti": 2,
    "attivita_ateco": [
      { "codice": "38.32.1", "descrizione": "Recupero e preparazione per il riciclaggio di cascami e rottami metallici" },
      { "codice": "81.29.91", "descrizione": "Pulizia e lavaggio di aree pubbliche, rimozione di neve e ghiaccio" }
    ]
  },
  "iscrizione_albo": {
    "numero_iscrizione": "PA07561",
    "sezione_regionale": "Sicilia",
    "verificato_online": true,
    "data_verifica": "2026-07-15"
  },
  "categorie": [
    {
      "categoria": "2-bis",
      "classe": "unica",
      "descrizione": "Produttori iniziali che trasportano i propri rifiuti (conto proprio)",
      "regime": "conto_proprio",
      "fine_validita": "2031-05-04",
      "cer_non_pericolosi": ["15.02.03", "16.03.04", "16.10.02"],
      "cer_pericolosi": ["15.02.02*", "16.03.03*", "16.10.01*"]
    },
    {
      "categoria": "5",
      "classe": "F",
      "descrizione": "Raccolta e trasporto di rifiuti speciali pericolosi",
      "regime": "conto_terzi",
      "inizio_validita": "2023-10-06",
      "fine_validita": "2028-10-06",
      "limite_quantita_annua_t": 3000,
      "responsabili_tecnici": [ { "nome": "PASSARO FILIPPO", "codice_fiscale": "PSSFPP73D02Z133T" } ],
      "garanzia_finanziaria": { "tipo": "polizza fideiussoria", "compagnia": "Zurich Insurance Plc", "numero": "PC8SE1Z5", "importo_eur": 51645.69 },
      "cer_pericolosi": ["13.01.05*","13.01.11*","13.01.13*","13.02.05*","13.02.06*","13.02.08*","14.06.01*","16.01.04*","16.01.07*","16.01.08*","16.01.09*","16.01.10*","16.01.11*","16.01.13*","16.01.14*","16.01.21*","16.02.09*","16.02.10*","16.06.01*","16.08.02*","17.04.09*"],
      "cer_non_pericolosi": ["12.01.01","12.01.03","16.01.03","16.01.06","16.01.12","16.01.15","16.01.16","16.01.17","16.01.18","16.01.19","16.01.20","16.01.22","16.08.01","17.02.01","17.02.02","17.02.03","17.04.01","17.04.02","17.04.03","17.04.04","17.04.05","17.04.06","17.04.07","19.12.02","19.12.03","20.01.40"]
    }
  ],
  "veicoli": [
    {
      "targa": "BGB87723",
      "telaio": "ZCFC3570005990862",
      "tipo": "Autoveicolo - Autocarro",
      "stato": "attivo",
      "categorie_attive": ["5"],
      "cer_per_categoria": { "5": ["<stessa lista CER cat. 5 sopra>"] }
    },
    {
      "targa": "GC046EP",
      "telaio": "ZCFC3591005261696",
      "tipo": "Autoveicolo per uso speciale",
      "titolo_disponibilita": "proprietà dell'impresa",
      "uso_proprio_esente_licenza": true,
      "stato": "attivo",
      "categorie_attive": ["2-bis", "5", "Reg-Met."],
      "cer_per_categoria": {
        "2-bis": ["15.02.02*", "15.02.03", "16.03.03*", "16.03.04", "16.10.01*", "16.10.02"],
        "5": ["<stessa lista CER cat. 5 sopra>"]
      }
    }
  ],
  "fonte": {
    "documenti": [
      { "nome_file": "Informazioni_inerenti_l_iscrizione_dell_impresa.pdf", "tipo": "estratto_portale_albo", "data_documento": "2023-10-23", "affidabilita": "alta" },
      { "nome_file": "Estrazione_elenco_mezzi.pdf", "tipo": "estratto_portale_albo", "data_documento": "2023-10-23", "affidabilita": "alta" },
      { "nome_file": "Provvedimento_iscrizione_Cat._5F.pdf", "tipo": "provvedimento", "protocollo": "31788/2023 del 06/10/2023", "data_documento": "2023-10-06", "affidabilita": "alta" },
      { "nome_file": "AttestatoANGA01935590859.pdf", "tipo": "attestato_qr", "protocollo": "33751/2023 del 23/10/2023", "data_documento": "2023-10-23", "affidabilita": "alta" }
    ]
  },
  "anomalie": [
    {
      "tipo": "cf_diverso",
      "gravita": "blocco",
      "messaggio": "Il documento 'Iscrizione SCOZZARINI SRL Albo Gestori Ambientali.pdf' (prot. 315/2011) è intestato a SCOZZARINI S.R.L., CF 01726430851: impresa DIVERSA dal profilo (SCOZZARINI SERVICE CAR S.R.L., CF 01935590859). Documento escluso dalla configurazione.",
      "documento": "Iscrizione_SCOZZARINI_SRL_Albo_Gestori_Ambientali.pdf"
    }
  ]
}
```

---

## 5. Cosa abilita questo profilo, in concreto

- **FIR precompilato:** sezione trasportatore (denominazione, CF, n. iscrizione Albo, targa) compilata in automatico; selezione mezzo filtrata sui soli mezzi abilitati al CER scelto.
- **Guardrail:** CER non presente nel profilo → non selezionabile; CER su mezzo non abilitato → blocco; trasporto conto terzi con sola 2-bis → blocco; quantità annua cat. 5F che si avvicina alle 3.000 t → avviso.
- **Scadenzario:** rinnovo cat. 5F entro 06/10/2028 (alert da aprile 2028), cat. 2-bis entro 04/05/2031, monitoraggio garanzia finanziaria.
- **RENTRI:** anagrafica pronta per iscrizione/collegamento API (registro digitale + xFIR, obbligatorio dal 15/09/2026).

## 6. Profilo impianto (documento #3 — da definire con lo stesso metodo)

L'autorizzazione ex art. 208/AUA richiede uno schema gemello (`ProfiloImpianto`): ente rilasciante, numero/data provvedimento, validità, CER ammessi in ingresso con operazioni (R13/R12/R4/D15...), quantità massime di stoccaggio istantaneo (t) e trattamento annuo (t/anno), prescrizioni specifiche. Appena un cliente fornisce un provvedimento reale, replicare l'esercizio fatto qui: estrazione → schema → esempio compilato → regole di validazione.

---

## 7. Costo dell'analisi documenti e anti-riesecuzione (aggiunta 2026-07-15)

L'estrazione via vision/OCR ha un costo per cliente: va bounded come il consulente AI (master §9), perché anche l'upload+analisi si paga e un cliente potrebbe ri-caricare più volte.

### 7.1 Quanto costa
- **Costo per estrazione completa** (2 PDF, ~10–20 pagine, Sonnet vision): **~€0,15–0,30**. È un **evento una-tantum di onboarding** → trascurabile sul canone (~0,02% di €1.380).
- **Riduzione strutturale del costo**: il **lato trasporto** si ricava dalla **ricerca pubblica Albo per CF** (dati strutturati, niente vision) → resta da OCR solo l'**autorizzazione impianto** (doc #2). Meno pagine analizzate = meno costo, e il pezzo più affidabile (Albo) non passa nemmeno dal modello.

### 7.2 Come si evita che ri-caricando più volte costi ogni volta
- **Dedup per hash del file**: se il cliente ri-carica lo *stesso* file (hash identico) → si restituisce l'estrazione **in cache**, nessuna nuova chiamata al modello. Uccide il costo delle ri-esecuzioni accidentali (il caso più comune).
- **Cap "analisi documenti"** separato dal budget chat: es. **~10 analisi/anno incluse** per org. I re-run *legittimi* sono ~1–3/anno (autorizzazione rinnovata, nuovo mezzo, nuova categoria) → il cap è ampio ma taglia l'abuso. Oltre → gestione **manuale/admin** (stesso pattern del top-up, master §9.4): un campo `doc_analisi_rimaste` per org, rialzabile a mano.
- **Tetto per singola estrazione**: pagine massime per run + output JSON bounded, così un PDF anomalo (300 pagine) non esplode.

### 7.3 Instradamento modello
- **PDF nativo testuale** → estrazione del testo (economica, niente vision).
- **Scansione/immagine** → vision. **Sonnet** default; **Opus** solo su scansioni difficili dove l'accuratezza legale lo giustifica.

> **Report/audit rifiuti**: la funzione "scegli cosa stampare — n° veicoli demoliti, carcasse, ricambi smontati, olio smaltito…" è **quasi gratuita** (aggregazione DB + PDF, infra esistente) e vive nel master come **§4.3**. Non è un costo AI: i dati sono già in casa.
