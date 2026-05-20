# Piano RENTRI — Filiera Veicoli Fuori Uso (AUT / ROT / FRA)

> Stato: **proposta, da approvare**. Modulo complesso: ogni intervento è
> isolato, build-checkato e testato singolarmente prima del successivo.
> Data: 2026-05-19. Scope concordato: **tutta la filiera** AUT+ROT+FRA.

## 0. Glossario filiera (D.Lgs 209/2003, Dir 2000/53/CE, D.M. 59/2023)

| Sigla | Soggetto | Ruolo nel ciclo VFU |
|-------|----------|---------------------|
| **AUT** | Autodemolitore / centro raccolta-trattamento | Riceve il VFU, bonifica, demolisce. Compila sezione AUT |
| **ROT** | Rottamatore | Tratta carcassa/parti metalliche. Sezione ROT |
| **FRA** | Frantumatore | Frantumazione finale del veicolo bonificato. Sezione FRA |

Adempimenti RENTRI per ciascun soggetto:
- **Registro cronologico** carico/scarico digitale (obbligo dal 13/02/2025):
  vidimazione digitale → compilazione → trasmissione **mensile** (entro fine
  mese successivo; impianti di trattamento entro il 2° mese).
- **FIR**: cartaceo ammesso fino **15/09/2026**; se digitale, l'intera filiera
  lo gestisce digitale.
- **MUD / comunicazione VFU**: sezione dedicata per ogni ruolo (AUT/ROT/FRA).
- EER veicoli: `16 01 04*` (VFU), `16 01 06` (bonificati) + bonifica
  (`13 02 05*` olio, `16 06 01*` batterie, `16 01 03` pneumatici,
  `16 01 07*` filtri).

## 1. Stato attuale (≈70% per AUT)

Implementato: registri cronologici (CRUD/sync), movimenti carico/scarico
(progressivo atomico), FIR (creazione/firma/trasmissione), MUD base,
collegamento demolizione→movimento, polling transazioni.

Gap e anomalie: vedi tabelle §3-§4.

## 2. Aggancio endpoint Comuni/CAP (richiesto)

Esiste già `desktop-app/.../src/lib/comuni-api.ts`:
`resolveComune(denominazione) → { istatComune(6), comune, provinciaSigla,
provinciaIstat(3), cap[] }` via `window.api.comuni` (proxy Electron →
cap.openapi.it). È la **fonte di verità** comune/provincia/CAP/ISTAT.

Strategia: la risoluzione avviene **lato client** (desktop, dove `window.api`
è disponibile); i codici risolti (ISTAT comune/provincia, CAP) vengono
**passati nel payload** del movimento/FIR verso il backend VPS. Il VPS NON
deve più indovinare né usare il fallback Milano: se il payload arriva con i
codici risolti li usa, altrimenti rifiuta con errore esplicito (no silent
fallback). Questo chiude il bug §4.2 senza duplicare dataset ISTAT.

## 3. Interventi P1 — conformità filiera (bloccanti)

| # | Intervento | File principali | Rischio | Effort |
|---|-----------|-----------------|---------|--------|
| P1.1 | ~~Vidimazione registro digitale~~ **FATTO 19/05/2026**. Diagnosi: in RENTRI **non esiste** `POST /vidima` per il registro cronologico (diverso dai blocchi FIR); la **creazione su RENTRI** (`POST /anagrafiche/v1.0/operatore/registri` → `identificativo`) **È** la vidimazione digitale legale. Fix: (1) `/registri/create` ora setta `stato='vidimato'`+`vidimato_at`; (2) nuovo `GET /registri/:id/xml` → proxy `/anagrafiche/v1.0/operatore/registri/{id}/xml` con **decodifica envelope JSON RENTRI** `{nome_file,mime,content:base64}` → XML reale; (3) UI: azione reale "Crea/Vidima su RENTRI" (single+bulk), badge `vidimato` da stato reale, bottone "Scarica registro vidimato (XML)"; (4) **rimosso stub fittizio** `DEMO-` (creava registri finti su RENTRI → falso segnale conformità; `isOnRentri` ora esclude `DEMO-`). Backup VPS `registri.js.bak-20260519-102323`. Testato e2e su RENTRI demo: create→`stato=vidimato`+`vidimato_at`+`rentri_id` persistiti, XML scaricato e validato (`urn:it:rentri:registri:1.0`). **Rifinitura (stessa sessione):** RENTRI **non ha un "numero registro"** (l'XML vidimato firmato espone solo `Identificativo`). Bug corretto: `descrizione` non usa più `numero_registro` come fallback (il numero fittizio finiva come descrizione ufficiale RENTRI). Scelta: `numero_registro` ora **allineato a `rentri_id`** (Identificativo) post-create; form → campo informativo read-only "Identificativo RENTRI"; generatore test non inventa più il numero. Testato: registro `FITTIZIO-99999`→`numero_registro=RKKOA101KDA`, fittizio non inviato a RENTRI. | VPS `routes/registri.js`; `src/pages/RifiutiRegistri.jsx` + `RifiutiRegistroForm.jsx` | — | ✅ |
| P1.2 | ~~Causale scarico VFU `aT` + esito accettazione~~ **FATTO 19/05/2026**. Diagnosi (verificata su DB live): colonna `esito_accettazione` esisteva ma **mai scritta dal form**; nessuna select UI; default silenzioso `'Accettato'` lato VPS → ogni aT/T*aT trasmesso "Accettato" anche con respingimento (payload contraddittorio). Fix: (1) `RifiutiMovimentoForm.jsx` select **Esito Accettazione** (Accettato/AccettatoConRiserva/Respinto) obbligatoria per aT/T*aT, mappata in save, respingimento mostrato solo se ≠Accettato, validazione coerenza; (2) VPS `movimenti.js` **niente default silenzioso** → errore esplicito se esito mancante/incoerente (no più `\|\| 'Accettato'`); (3) `vfu-movimento-scarico.js` causale/esito **parametrizzati** (default 'T' retrocompat, valida aT/T*aT+esito). Testato live demo: aT senza esito → 422 "esito_accettazione mancante"; Accettato+respingimento → 422 "incompatibile". Backup `movimenti.js.bak-p12-*`. | `vfu-movimento-scarico.js`; `RifiutiMovimentoForm.jsx`; VPS `movimenti.js` | — | ✅ |
| P1.3 | **MUD discriminato AUT/ROT/FRA** — **CORE FATTO 19/05/2026** (step 5 admin-panel residuo). Modello: `sezioni_attivate` in `org_settings` (key=`rentri_filiera`, EAV, default `['AUT']`, config admin); `rentri_registri.sezione` (tag, movimenti ereditano via registro_id); `rentri_mud.sezione` con `UNIQUE(org_id,anno,sezione)`. **Step1** migration `20260519_rentri_mud_sezioni.sql` applicata prod (registri esistenti→AUT). **Step2** VPS `mud.js`: `POST /mud` genera un MUD per sezione attivata (movimenti via registro.sezione; FIR→AUT); testato live (default AUT; multi ROT/FRA; 409 per-sezione). **Step3** `RifiutiMud.jsx`: tab filiera, badge sezione, rimosso placeholder morto `sezione_<id>_count`. **Step4** `RifiutiRegistroForm.jsx`: selettore sezione (solo se org multi-sezione, altrimenti implicito). **Step5 FATTO**: endpoint website `GET/PUT /api/staff/admin/organizations/[id]/rentri-filiera` (repo `Hydr44/Web`, pattern modules, AUT sempre attiva) + admin-panel `ClientControlsPanel` sezione "Filiera RENTRI" (toggle ROT/FRA, save dedicato) + api.ts `fetch/saveRentriFiliera`. Admin-panel `tsc && vite build` ✅, website tsc route ✅. **Nota**: endpoint live solo dopo deploy website (repo separato, commit/push su richiesta). Backup `mud.js.bak-p13-*`. | mig.+ VPS `mud.js` + `RifiutiMud.jsx` + `RifiutiRegistroForm.jsx` + website route + admin-panel | — | ✅ |
| P1.4 | ~~Polling chiude le transazioni movimenti~~ **FATTO 19/05/2026**: la logica `/transazioni/:id/result` (ramo `tipo='movimenti'`) già esisteva e chiude correttamente (sync_status=trasmesso, rentri_id, azzera tx). Mancava l'invocazione → aggiunto `GET /api/rentri/trasmissioni/sync` (orchestratore, riusa status+result via fetch interno, auth CRON_SECRET) + cron `/root/rentri-sync-trasmissioni.sh` ogni 5 min (`2-59/5`). Backup `trasmissioni.js.bak-20260519-120926`. Testato: 401 senza auth, success con cron. | VPS `routes/trasmissioni.js` + cron | — | ✅ |
| P1.5 | ~~Indirizzi FIR via comuni-api~~ **FATTO 19/05/2026**. Diagnosi (FIR live): `*_comune_id` conteneva **nomi** ("RANCIO VALCUVIA","MILANO") non ISTAT; `vfu-draft-creator.js` non chiamava mai `resolveComune`; `fir-builder.js` ignorava `fir.*_comune_id` e parsava l'indirizzo → fallback **silenzioso Milano `015146`** (anomalia 4.2 confermata). Fix completo: (1) VPS `fir-builder.js` usa `fir.*_comune_id` se ISTAT 6 cifre valido, **rimosso `DEFAULT_COMUNE_ISTAT` Milano**, `validateFIRForRentri` ora richiede **sempre** comune ISTAT per produttore/destinatario (errore esplicito, non solo strict), +CAP nel payload; (2) `vfu-draft-creator.js` risolve produttore/detentore via `resolveComune()`→ISTAT+CAP, degrada a vuoto se non risolvibile (mai inventato); (3) form `RifiutiXFirForm.jsx`: risoluzione comune→ISTAT in `handleSubmit` per produttore/luogo/destinatario, blocco trasmissione se non risolti. Testato VPS live: indirizzo rotto→2 errori espliciti (no Milano), ISTAT passati→payload corretto+CAP. Backup `fir-builder.js.bak-p15-*`. | VPS `fir-builder.js`; `vfu-draft-creator.js`; `RifiutiXFirForm.jsx` | — | ✅ |

## 4. Anomalie da correggere (qualità/sicurezza)

| # | Anomalia | File | Severità | Azione |
|---|----------|------|----------|--------|
| 4.1 | ~~OpenSSL command injection (password `.p12` in shell)~~ | VPS `routes/certificati.js` | ~~P0~~ **CHIUSO 14/05/2026** | ✅ Già riscritto con `node-forge` in-memory. Verificato 19/05/2026: nessun openssl-shell su .p12 in desktop/website/VPS RENTRI. Backup `certificati.js.before-node-forge-*`. |
| 4.2 | ~~Comuni ISTAT fallback Milano → FIR con indirizzo errato~~ | VPS `fir-builder.js` | ~~P1~~ **CHIUSO 19/05/2026** | ✅ Risolto da P1.5: rimosso `DEFAULT_COMUNE_ISTAT`, errore esplicito, risoluzione client comuni-api |
| 4.3 | Race condition progressivo movimenti | VPS `routes/movimenti.js` | P1 | Allineare backend alla mig. 20260515 (sequenza atomica) |
| 4.4 | `sync_status` vs `stato` formulari (doppio enum) | DB + `RifiutiFormulari.jsx` | P2 | Unificare su `sync_status`, deprecare `stato` |
| 4.5 | JWT generation duplicato 5+ volte | VPS routes | P3 | Estrarre `lib/rentri-jwt-context.js` |

### 4.bis Controllo coerenza campi registro↔movimenti↔FIR (audit 19/05/2026)

Audit completo schema DB ↔ payload RENTRI ↔ manuali. Nota: i file
migration storici (es. 20251203, 20260219) erano disallineati al DB **live**
— le verifiche sotto sono fatte sul DB reale, non sui soli file.

| ID | Sev | Entità | Anomalia | Stato |
|----|-----|--------|----------|-------|
| A3 | Medio | FIR | `destinatario_attivita` mai popolato da `vfu-draft-creator.js` → `fir-builder.js` ripiegava in silenzio su `R13` (messa in riserva) falsando la conformità | **FATTO 19/05**: creator imposta `R4` (filiera VFU); `validateFIRForRentri` ora rifiuta esplicitamente se mancante/non valido (no più R13 muto). Backup `fir-builder.js.bak-a3-*`. Testato. ✅ |
| A1 | **Critico** | FIR | `codici_eer` è JSONB **array** ma RENTRI vuole `rifiuto` **singolo**; `fir-builder.js` usa `codici_eer[0]` e **scarta in silenzio** gli altri EER | **FATTO 20/05/2026**: `validateFIRForRentri` ora blocca esplicito se `codici_eer.length > 1` con elenco EER e suggerimento di splittare ("uno per EER"). Niente più drop silenziosi. Testato unit. ✅ |
| A4 | Medio | MOV→FIR | `numero_fir` solo testo, nessun FK verso `rentri_formulari` → riferimenti orfani non intercettati | **FATTO 20/05/2026**: soft-check nell'endpoint trasmetti (batch lookup `rentri_formulari` per `numero_fir` riferiti dai movimenti in trasmissione); errore esplicito se orfano. No DB FK (evita rischio migration). Testato live. ✅ |
| A5 | Medio | MOV/FIR | Builder senza validazione enum (stato_fisico, causale, destinato_attivita) → scarti tardivi RENTRI | **FATTO 20/05/2026**: `buildMovimentoPayload` ora valida enum: `stato_fisico ∈ {S,SP,L,FP,VS}`, `causale_operazione ∈ {NP,DT,RE,I,M,T,aT,TR,T*,T*aT,PR,RS,AS,RM}`, `destinato_attivita ~ /^[RD]\\d{1,2}$/` (eccetto causale M), `unita_misura ∈ {kg,l,t}`. Errori espliciti con elenco ammessi. Testato live. ✅ |
| A6-A9 | Basso | FIR | `numero_colli` inutilizzato; albo/CF/comune_id senza validazione formato | **Aperto** — P2/P3 |
| (falso pos.) | — | MOV | Audit segnalava colonna `provenienza` vs `provenienza_codice`: **smentito**, il DB live ha `provenienza_codice` ovunque (coerente) | — |

## 5. Interventi P2 — qualità dati / UX

- Promemoria scadenza trasmissione mensile (badge "Scadenza fine mese
  successivo" su `RifiutiRegistri.jsx` + cron che marca `scaduto`).
- Anagrafiche multi-sito/unità locali per sezione (`rentri_anagrafiche`:
  `org_id, sito_tipo AUT|ROT|FRA, indirizzo, n_iscrizione, n_autorizzazione`).
- Codici EER da cache `rentri_codifiche` (cron sync mensile da RENTRI) invece
  che hardcoded in `vfu-draft-creator.js`.
- FIR multiriga: aggregare gli EER multipli di una demolizione in un solo FIR.

## 6. Ordine consigliato e dipendenze

```
P0  4.1 (sicurezza certificati) ───────────────► ✅ FATTO
P1  1.4 (polling transazioni)   ───────────────► ✅ FATTO
P1  1.1 (vidimazione)           ───────────────► ✅ FATTO
P1  1.2 (causale aT+esito)      ───────────────► ✅ FATTO
P1  1.5 (indirizzi via comuni-api)─────────────► ✅ FATTO
P1  1.3 (MUD AUT/ROT/FRA)       ───────────────► ✅ FATTO (step5 live post-deploy website)
P2  resto                       ───────────────► dopo P1
A1/A4/A5 (audit campi)          ───────────────► dopo P1
4.3 (race progressivo)          ───────────────► verificare vs mig.20260515
```

Ogni step: branch isolato (no main diretto), build-check, test su ambiente
RENTRI **demo**, poi promozione. Nessun intervento tocca il modulo
**RVFU-ACI ufficiale** (`DemolizioneRVFUForm`, `lib/rvfu-*`, `useRVFU*`).

## 7. Stima totale

P0+P1: ~3-4 settimane sviluppo+test. P2: +~2 settimane. Da eseguire a lotti
approvati, non in blocco.

## 8. Rischi & mitigazioni

- **Codice fiscale/normativo**: errori producono documenti non conformi →
  ogni modifica testata su RENTRI **demo** con casi reali prima di prod.
- **Modulo complesso, molte dipendenze incrociate** → interventi atomici,
  un file logico per volta, backup VPS prima di ogni deploy.
- **comuni-api lato client**: se `window.api` non disponibile (es. contesti
  non-Electron) la risoluzione degrada a null → P1.5 deve bloccare con
  errore chiaro, mai emettere FIR con indirizzo indovinato.
