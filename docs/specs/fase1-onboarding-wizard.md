# Fase 1 — Wizard di onboarding (progettazione)

> **⚠️ SOLO DESIGN — NIENTE APPLICATO / NIENTE PROD.** Estende il wizard esistente `RifiutiSetupWizard.jsx`; nasce **spento** (feature flag `environmental_profile`), quindi non tocca chi usa trasporti/clienti. Percorso: branch → staging → RENTRI **Formazione** → prod solo con via libera. Vedi [[feedback_prod_live_no_touch]].
>
> **Cosa fa:** riempie le tabelle della **Fase 0** ([fase0-profilo-ambientale-schema.md](fase0-profilo-ambientale-schema.md)) usando le API anagrafiche RENTRI + l'OCR dell'autorizzazione. È l'implementazione operativa del master §3 e della spec [onboarding-profilo-ambientale-documenti.md](onboarding-profilo-ambientale-documenti.md).
> **Principio:** meno tocca l'operatore, meno sbaglia → il grosso è auto-popolato da RENTRI; l'umano **valida**, non digita.

## 1. Estende il wizard esistente (non lo rifà)
`RifiutiSetupWizard.jsx` oggi ha **5 step**: intro → certificato `.p12` → num_iscr_sito (incollato a mano) → firma mobile → FIR di prova. La Fase 1 lo porta a **7 step**, sostituendo l'incolla-manuale con la sincronizzazione automatica e aggiungendo l'OCR + la vidima registri. Riusa: `RifiutiCertificatiUpload.jsx`, `FirmaMobileManager`, `get-siti-operatore.ts` (già legge i siti da RENTRI), la logica AI di `vfu-ai.js`.

## 2. I passi (con dettaglio tecnico)

| # | Passo | Sistema fa | API / mezzo | Scrive in (Fase 0) | Stato profilo |
|---|---|---|---|---|---|
| 1 | **Certificato** | estrae cert+chiave lato VPS, genera JWT | upload .p12 (esistente) | `rentri_org_certificates` (esistente) | — |
| 2 | **Verifica iscrizione** | controlla accreditamento | `GET /operatore/{id}/controllo-iscrizione` + `/controllo-autorizzazione-albo` | — (gate) | — |
| 3 | **Sync profilo** | tira giù anagrafica, Albo, siti, autorizzazioni | *vedi §3* | `environmental_profile`, `environmental_site`, `environmental_authorization.operazioni_rd`, `environmental_albo_category`, `environmental_vehicle` | `bozza` |
| 4 | **OCR autorizzazione** | estrae CER + limiti dal PDF, propone | *vedi §4* | `environmental_authorization.cer_autorizzati` / `limiti` / `prescrizioni` | `bozza`, `extraction_status='ocr_grezzo'` |
| 5 | **Validazione** | mostra doc↔campi, l'operatore conferma | UI (no API) | `extraction_status='validato_umano'` → poi `status='confermato'` | `confermato` |
| 6 | **Vidima registri** | vidima un registro per sito operativo | `POST /operatore/registri` | `environmental_site.registro_identificativo` | — |
| 7 | **Firma mobile + FIR di prova** | collega OTP, trasmette FIR test | esistente | — | — |

I **guardrail** (selettore CER, R/D, giacenza — master §4) si accendono per l'org **solo a `status='confermato'`**.

## 3. Dettaglio Step 3 — Sync RENTRI (la sequenza di chiamate)
Auth = JWT dal certificato (riusa il meccanismo del gateway VPS, non reinventare — cfr. master §1.2). Sequenza e mapping:

1. `GET /operatore` → `environmental_profile` (num_iscr_rentri, denominazione, CF, P.IVA, `anagrafica` jsonb).
2. `GET /operatore/{num_iscr}/autorizzazione-albo` → `environmental_profile.albo_sezione/albo_numero/albo_categorie`; + `environmental_albo_category` (una riga per categoria: 2-bis, 5F… con classe, validità, RT, garanzia).
3. `GET /operatore/{num_iscr}/siti` → `environmental_site` (una riga per sito: num_iscr_sito, indirizzo, `attivita[]`, is_sede_legale). *(riusa `get-siti-operatore.ts`)*
4. per ogni sito: `GET /operatore/{num_iscr}/siti/{num_iscr_sito}/autorizzazioni` → `environmental_authorization` (tipo, rif, date, **`operazioni_rd[]`** — `source_rd='rentri_api'`). **NB: i CER NON arrivano qui** → li prende lo Step 4 (OCR).
5. (mezzi) se disponibili dall'estratto/Albo → `environmental_vehicle` (companion, `vehicle_id`→`vehicles` se il mezzo è già nel parco).
6. **precarica cataloghi** una-tantum: `GET /codifiche/v1.0/{codici-eer, attivita-rs, causali-operazione, stati-fisici, caratteristiche-pericolo, unita-misura}` → aggiorna `rentri_codifiche_cache`.

Tutto marcato `source='rentri_api'`, `last_synced_at=now()`.

## 4. Dettaglio Step 4 — OCR autorizzazione (le sole 2 cose non date da RENTRI)
1. **Upload** del PDF autorizzazione → R2 (`documento_url`).
2. **Dedup per hash file**: se hash già visto per l'org → riusa l'estrazione in cache, **nessuna chiamata al modello** (spec documenti §7.2).
3. **Cap analisi**: contatore per org (~10/anno); oltre → admin manuale (spec documenti §7.2).
4. **Estrazione**: chiamata a Claude in modalità documento/vision con **output strutturato** sullo schema `ProfiloTrasportoAlbo`/`ProfiloImpianto` (onboarding-documenti §3). Estrae **solo** `cer_autorizzati` + `limiti` + `prescrizioni` (il resto è già da RENTRI). Riusa il proxy AI esistente (`website/src/app/api/ai/scan` o equivalente documento) + la logica CER di `vfu-ai.js`. Costo ~€0,15–0,30, una-tantum.
5. Scrive in `environmental_authorization`: `cer_autorizzati` (`source_cer='ocr'`), `limiti` (jsonb), `prescrizioni`, `extraction_status='ocr_grezzo'`.
6. **Guardrail estrazione**: ogni CER estratto è validato contro `rentri_codifiche_cache` (deve esistere a catalogo); i dubbi sono evidenziati per la validazione umana.

## 5. Dettaglio Step 5 — Validazione umana (obbligatoria)
Schermata **documento a sinistra, campi a destra** (onboarding-documenti §2.5). L'operatore conferma campo per campo; confidence bassa → evidenziato. Alla conferma: `extraction_status='validato_umano'`; quando profilo+almeno un'autorizzazione sono validati → `status='confermato'` (gate ruolo admin/owner). **Nessun CER entra nei guardrail senza questo passaggio.**

## 6. Stato del profilo & idempotenza
Macchina a stati: `bozza` → (sync + OCR) → validazione → `confermato`.
- **Re-sync sicuro**: rieseguire lo Step 3 aggiorna i dati `source='rentri_api'` per chiave naturale (`num_iscr_sito`, categoria, targa) — **upsert, non duplica**. I campi OCR/validati non vengono sovrascritti dal re-sync.
- **Re-onboarding**: idempotente; il dedup OCR evita ri-analisi; il profilo `confermato` resta tale finché non lo si rivalida.
- **Verifica periodica**: la ricerca pubblica Albo per CF (onboarding-documenti §1) può rivalidare la vigenza delle categorie e segnalare scadenze.

## 7. Riuso vs nuovo
| Riusa (esistente) | Nuovo (Fase 1) |
|---|---|
| `RifiutiCertificatiUpload`, `FirmaMobileManager`, FIR di prova | Step 2 verifica iscrizione (chiamate controllo-*) |
| `get-siti-operatore.ts` (lettura siti) | **persistenza** in `environmental_*` (oggi i siti si leggono ma non si salvano) |
| gateway VPS RENTRI (auth/JWT) | Step 3 chiamate `/autorizzazione-albo` + `/siti/{id}/autorizzazioni` + mapping tabelle |
| proxy AI `/api/ai/scan` + `vfu-ai.js` (CER) | Step 4 estrazione autorizzazione (schema strutturato, dedup hash, cap) |
| `rentri_codifiche_cache` | Step 5 UI validazione doc↔campi; gate `status='confermato'` |
| `RifiutiSetupWizard` (shell 5 step) | vidima registri (`POST /operatore/registri`) → `registro_identificativo` |

## 8. Domande aperte (per la prossima passata)
1. **Estrazione PDF multi-pagina**: `/api/ai/scan` oggi è vision max 4 foto; l'autorizzazione è un PDF. → usare il *document input* di Claude (PDF nativo) o convertire pagine? *(scelta di implementazione, non normativa)*
2. **Ruolo per `status='confermato'`**: solo owner/admin o anche operatore? (proposta: admin/owner, è il gate legale).
3. **Vidima registri (Step 6)**: uno per sito operativo automatico, o l'operatore sceglie quali attivare? (proposta: propone i siti, l'operatore spunta).
4. **Mezzi**: popolare `environmental_vehicle` dal parco `vehicles` esistente (match per targa) o solo dall'Albo? (proposta: link per targa quando il mezzo è già nel parco).
