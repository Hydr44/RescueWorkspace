# Fix di conformità — registro RENTRI della bonifica VFU

> **Tipo:** checklist di correzione dev-ready. **Origine:** verifica meccanica registro (master [semplificazione-processi-ambientali.md](semplificazione-processi-ambientali.md) §5.3), confermata su manuali RENTRI v1.0 + fonti ufficiali online (MASE, ekoservice impianti di recupero, ADA autodemolitori). **Data:** 2026-07.
>
> **Perché ora:** questi non sono "nice-to-have" del redesign — sono **bug che fanno rifiutare i movimenti da RENTRI** (causali/enum invalidi) o che falsano la conformità. Vanno corretti sul codice esistente, indipendentemente dal profilo ambientale.
>
> **App:** `desktop-app/greeting-friend-api-main/`. Path relativi a lì salvo diverso.

## La meccanica corretta (riferimento)
Bonifica VFU = trattamento interno. Sequenza a registro:
1. **Carico** `16 01 04*` (accettazione). *(causale passo 1 = punto aperto, vedi §Prima di toccare)*
2. **Scarico `I`** (scarico interno) del `16 01 04*` — `RiferimentoOperazione` → carico #1.
3. **Carichi `NP`** dei prodotti (fluidi + carcassa `16 01 06`) — `RiferimentoOperazione` → scarico #2.
4. **Scarico `aT`** (conferimento a terzi con FIR + `Esito`) verso il frantumatore.

Causali v1.0 valide (9): carico `DT NP T* RE` · scarico `I aT M TR` · combinata `T*aT`. **Non** esistono `T PR RS AS RM`.

---

## Priorità

| # | Fix | File | Gravità |
|---|-----|------|---------|
| 1 | Scarico 16 01 04* usa `NP` (causale di carico) → deve essere `I` | `src/lib/vfu-draft-creator.js:1223` | **P1 blocca** |
| 2 | Causale scarico `'T'` inesistente nell'enum → conferimento = `aT` | `src/lib/vfu-movimento-scarico.js:24-28` | **P1 blocca** |
| 3 | `provenienza_codice:'I'` invalido (solo U/S) → `S` | `src/lib/vfu-draft-creator.js:1292` | **P1 blocca** |
| 4 | Validatore `causale_operazione` accetta valori inesistenti (T, PR, RS, AS, RM) | `buildMovimentoPayload` (VPS `movimenti.js`) | **P1 blocca** |
| 5 | `RiferimentoOperazione` punta al verso sbagliato (carico→carico) | `src/lib/vfu-draft-creator.js:1312-1314` | P2 conformità |
| 6 | Formato `riferimento_operazione` non XSD (UUID+`ruolo` custom) | `vfu-draft-creator.js:1228-1230,1312`; VPS trasmissione | P2 conformità |
| 7 | `destinato_attivita` hardcoded `R4` → dal profilo | `vfu-movimento-carico.js:150`; `vfu-movimento-scarico.js:152`; `vfu-draft-creator.js:1185,1304` | P2 conformità |
| 8 | Glossa causali UI contraddittoria (aT/I/M dati come "carico") | `src/pages/RifiutiMovimentoForm.jsx:248-249` | P3 coerenza |

---

## Dettaglio

### 1 · Scarico del 16 01 04* con causale `NP` → `I` — P1
- **Dove:** `vfu-draft-creator.js:1223` (`causale_operazione:'NP'` su `tipo_operazione:'scarico'`, riga 1218). Il commento del file lo ammette già: righe 1219-1222 ("Da rivedere con esperto normativo").
- **Perché sbagliato:** `NP` è causale di **carico**; uno scarico non può averla → RENTRI rifiuta.
- **Fix:** causale **`I`** (scarico interno — lavorazione del rifiuto).
- **Verifica:** trasmissione demo → il movimento di scarico 16 01 04* passa la validazione (no errore causale/tipo).

### 2 · Causale scarico `'T'` inesistente → `aT` — P1
- **Dove:** `vfu-movimento-scarico.js:24` (default `causale='T'`), `:28` (`CAUSALI_VALIDE=['T','aT','T*aT']`), usata `:119`.
- **Perché sbagliato:** `'T'` **non è nell'enum** (esistono solo `T*`, `TR`, `T*aT`, `aT`). Il conferimento a terzi con FIR è **`aT`** (scarico a terzi, `Esito` richiesto).
- **Fix:** default e set validi → `aT` (`T*aT` solo per ricezione+accettazione contestuale). Rimuovere `'T'`.
- **Verifica:** conferimento al frantumatore → scarico `aT` accettato; presenza blocco `Esito`.

### 3 · `provenienza_codice:'I'` invalido → `S` — P1
- **Dove:** `vfu-draft-creator.js:1292` (rifiuti derivati). Enum `ProvenienzaRifiuto` = solo `U`/`S`. Lo stesso file usa già `'S'` altrove (`:1175`) → incoerenza interna.
- **Fix:** `'S'` (rifiuto speciale) su tutti i derivati.
- **Verifica:** nessun errore enum provenienza in validazione.

### 4 · Validatore causale con valori inesistenti — P1
- **Dove:** `buildMovimentoPayload` (VPS `rentri-server`/`movimenti.js`, cfr. master §fix A5 storico): l'enum accettato includeva `{NP,DT,RE,I,M,T,aT,TR,T*,T*aT,PR,RS,AS,RM}`.
- **Perché sbagliato:** `T, PR, RS, AS, RM` **non esistono** in v1.0 → il validatore lascia passare payload che RENTRI poi rifiuta (o peggio: accetta valori errati).
- **Fix:** restringere a **`{DT,NP,T*,RE,I,aT,M,TR,T*aT}`** (9 valori). Errore esplicito sugli altri.
- **Verifica:** payload con `T` → 422 lato VPS prima della trasmissione.

### 5 · `RiferimentoOperazione` verso sbagliato — P2
- **Dove:** `vfu-draft-creator.js:1312-1314` — i carichi `NP` puntano al **carico** `16 01 06`.
- **Perché sbagliato:** il rifiuto prodotto da trattamento va collegato allo **scarico** che lo ha prodotto (lo scarico `I` del 16 01 04*), non a un altro carico.
- **Fix:** ogni carico `NP` → `RiferimentoOperazione` verso lo **scarico `I`** del passo 2. (E lo scarico `I` → verso il carico del 16 01 04*.)
- **Verifica:** l'XML esportato mostra la catena carico(104*) ← scarico I ← carichi NP.

### 6 · Formato `riferimento_operazione` non XSD — P2
- **Dove:** `vfu-draft-creator.js:1228-1230,1312-1314` salva `[{rentri_id:<UUID Supabase>, ruolo:'...'}]`. L'XSD `rentri-movimenti-1.0.xsd:77-92` vuole `{Anno, Progressivo, [IdentificativoRentri]}`. La colonna JSONB (`migrations/20260606_rentri_movimenti_normativi.sql:19-23`) prevede `{anno,progressivo}` **o** `{rentri_id:"M…"}`, ma il codice scrive un UUID locale, non l'`IdentificativoRentri` `M{20}` né anno/progressivo. La chiave `ruolo` è extra fuori XSD.
- **Fix:** scrivere `{anno, progressivo}` (o `rentri_id` = identificativo RENTRI reale, non UUID). Rimuovere `ruolo` dal payload trasmesso (ok come metadato locale separato). **Verificare dove avviene la conversione → XSD**: risulta lato VPS (`rentri-api.js:227` `/movimenti/trasmetti`) → controllare che il server risolva UUID→anno/progressivo prima di serializzare l'XML.
- **Verifica:** l'XML trasmesso contiene `RiferimentoOperazione/{Anno,Progressivo}` valorizzati e conformi allo schema.

### 7 · `destinato_attivita` hardcoded `R4` → dal profilo — P2
- **Dove:** `vfu-movimento-carico.js:150`, `vfu-movimento-scarico.js:152`, `vfu-draft-creator.js:1185,1304`.
- **Perché sbagliato:** ✅ confermato ADA — R4 (recupero metalli) è del **frantumatore**; l'autodemolitore fa messa in sicurezza/smontaggio → **R12/R13**; e varia per EER (olio 13 02 05\* → **R9**). Un valore fisso falsa la conformità.
- **Fix:** ricavare `destinato_attivita` dalle **operazioni R/D autorizzate del sito** (profilo ambientale, §2/§3 master), con default sensato per EER. In attesa del profilo: parametrizzare (no costante) e usare R13/R12 per la carcassa.
- **Verifica:** un sito autorizzato solo R13 non produce movimenti con R4.

### 8 · Glossa causali UI contraddittoria — P3
- **Dove:** `RifiutiMovimentoForm.jsx:248-249` classifica `aT, I, M` come **carico** e glossa `I="intermediazione in entrata"`. L'ufficiale (`movimento_schema.md:65`): `I/aT/M` = **scarico**; `TR` = intermediazione. Anche `rentri-test-data.js:72-90` ha tipo_operazione incoerenti.
- **Fix:** allineare la tassonomia UI all'enum ufficiale (carico `DT/NP/T*/RE`, scarico `I/aT/M/TR`); correggere le glosse e i dati di test.
- **Verifica:** i dropdown mostrano le causali nel gruppo giusto; nessun test con causale/tipo incoerente.

---

## Prima di toccare il carico del VFU (passo 1) — cross-check obbligatorio
Un punto **non ancora chiuso** dal repo né dalle fonti secondarie: **la causale del carico iniziale del 16 01 04\*** (probabile `T*` con FIR, ma il VFU segue spesso il regime CDR/scheda senza FIR ordinario → potrebbe essere `DT` o regime speciale VFU). Prima di modificare `vfu-movimento-carico.js` (che oggi usa `NP` per la ricezione — dubbio):
1. Interrogare la codifica ufficiale **`GET /codifiche/v1.0/causali-operazione`** (glossa autorevole).
2. Verificare il regime VFU per la presa in carico da privato/concessionario.
Fino ad allora: **non forzare** una causale sul carico VFU; lasciarla esplicita/parametrica.

## Come testare l'intero fix
Ambiente **Formazione/demo** (mai prod): registrare un VFU end-to-end (carico 104* → scarico I → carichi NP fluidi+106 → conferimento aT), esportare l'XML del registro e verificarlo contro `rentri-registri-1.0.xsd`/`rentri-movimenti-1.0.xsd`; controllare che la catena `RiferimentoOperazione` sia integra e le causali nel gruppo corretto.
