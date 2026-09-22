# Fase 4 — Consulente ambientale AI (progettazione)

> **⚠️ SOLO DESIGN — NIENTE APPLICATO / NIENTE PROD.** Estende `vps-ai-server` (RescueAI esistente); ogni novità è **capability-gated** (come le 6 azioni attuali) + feature flag → i client vecchi non ricevono nulla che non sappiano gestire. Vedi [[feedback_prod_live_no_touch]].
>
> **Cosa fa:** trasforma RescueAI da esecutore di azioni a **consulente che parla come un umano e non allucina la normativa** — perché risponde leggendo il **profilo ambientale** (Fase 0) e una **base normativa citabile** (RAG), e usa **tool deterministici** per i fatti (CER, giacenza) invece di andare a memoria. Master §6.

## 1. Cosa c'è già (da riusare, non rifare)
`vps-ai-server`: chat con tool-calling + streaming SSE, `MODEL_REASONING` (Sonnet) / `MODEL_FAST` (Haiku) scelti da `chooseModel()`, **prompt caching**, auth Supabase + org-scoping, rate-limit 100/h. **10 tool read-only** (`tools.js`) + **6 azioni `propose_*`** (`actions.js`). Manca: RAG, tool di verifica CER, tono da consulente. La logica CER esiste ma **isolata** in `src/lib/vfu-ai.js` (`classificaRifiutiCER`), non collegata alla chat.

## 2. a) Tono umano (riscrivere `buildSystemPrompt`, `server.js:63`)
Da rule-heavy («SEMPRE», passi numerati) a **una persona**: un consulente ambientale esperto che parla come un collega al telefono. Regole di condotta (anti-allucinazione, critiche per la normativa):
- **Non inventa mai** un CER, una causale, una scadenza. Se non è certo → lo dice e **cita la fonte** (dal RAG) o suggerisce la verifica.
- **Usa i tool per i fatti** (CER, giacenza, autorizzazioni) invece di rispondere a memoria.
- **Spiega il perché**, non solo il cosa. Se manca un dato del profilo, **lo chiede**.
- Italiano naturale, niente elenchi a raffica se non servono; ammette l'incertezza.

## 3. b) Tool deterministici (nuovi, in `tools.js`) — grounding
Risposte **esatte e citabili**, ancorate a profilo + cataloghi:
| Tool | Input → Output | Fonte |
|---|---|---|
| `lookup_cer(descrizione)` | testo → codice + pericoloso + HP + stato fisico | `rentri_codifiche_cache` / RPC `search_codici_eer` |
| `check_cer_autorizzato(codice)` | CER → `ok` / `non_autorizzato` / `inesistente` | `environmental_authorization.cer_autorizzati` (sito attivo) |
| `check_giacenza(codice_eer)` | CER → margine su limite istantaneo/annuo | `environmental_giacenza` (Fase 3) + limiti profilo |
| `spiega_adempimento(scenario)` | situazione → passi RENTRI/RVFU + scadenze | profilo + stato pratica + RAG |
| `classifica_rifiuto(...)` | descrizione/veicolo → CER + pericolosità | promuove `vfu-ai.js` a tool della chat |

## 4. b2) Nuove azioni «proponi → conferma» (in `actions.js`)
Stesso pattern capability-gated delle 6 esistenti (`propose_*` → card di conferma, mai auto-eseguite), **pre-compilate dal profilo**:
`propose_movimento_carico`, `propose_movimento_scarico`, `propose_fir`, `propose_registro`.
Esempio: «vuoi che ti apra il movimento di carico dell'olio già compilato?» → card → l'operatore conferma → esegue con causale `NP`/`I`, `destinato_attivita` dal profilo, giacenza scalata (tutto corretto by design, §5.3 + Fase 2/3).

## 5. c) RAG normativo (subito — Decisione C)
- **Corpus condiviso** (uguale per tutti gli autodemolitori): D.Lgs 152/2006, 209/2003, DM 59/2023, guide tecniche registri/FIR, **tabella causali verificata** (§5.3), codifiche. → **indicizzato una volta sola**, non per cliente (costo trascurabile).
- **Embeddings: Anthropic non ne ha** → **Voyage AI** (raccomandato). Storage: **pgvector** su Supabase (naturale, già Postgres) — tabella `normative_chunks(id, fonte, riferimento, testo, embedding vector)`.
- **Retrieval**: query → embedding → top-k (cap ~5-6, §9) per similarità coseno → chunk nel prompt (con caching) → risposta **con citazione** (fonte + articolo).
- I **tool deterministici** (§3) restano la prima linea per i fatti esatti; il RAG copre le domande aperte/interpretative.

## 6. Costo & limiti (il guardrail sul costo — master §9)
- **① Tetto per domanda**: `max_tokens` output ~800-1000 + RAG top-5/6 + storico troncato → una domanda complessa bounded ~€0,04.
- **② Instradamento**: Haiku default, Sonnet solo per normativa, mai Opus (`chooseModel()` esistente, esteso).
- **③ Budget mensile in € per org**: spesa reale dai campi `usage` (già ricevuti) × tariffe; esaurito → degrado a Haiku-only, mai errore. **Controllo utilizzi in admin** (§9.5).
- Embeddings: indice condiviso una-tantum + query ~50 token → irrilevante.

## 7. Come si aggancia al profilo (l'esempio dell'olio)
> **Operatore:** «questo olio esausto va nel registro?»
> **RescueAI:** `lookup_cer("olio esausto")` → 13 02 08\* pericoloso · `check_cer_autorizzato` → sì, nel sito di Gela · `check_giacenza` → margine ok → *«Sì, è un rifiuto pericoloso, lo registri in carico. È tra i CER della tua autorizzazione e hai ancora margine. Se lo mandi a recupero serve il formulario. Ti apro il movimento?»* → `propose_movimento_carico`.

Niente di questo è "a memoria": ogni fatto viene da un tool o dal RAG citato.

## 8. Riuso vs nuovo
| Riusa | Nuovo |
|---|---|
| `vps-ai-server` (chat, streaming, caching, auth, rate-limit) | 5 tool deterministici in `tools.js` |
| pattern `propose_*` (`actions.js`) | 4 azioni ambientali |
| `chooseModel()` + `usage` | budget €/org + controllo utilizzi admin (§9.5) |
| `vfu-ai.js` (CER) | promozione a tool `classifica_rifiuto` |
| Supabase Postgres | pgvector + `normative_chunks` + pipeline embeddings Voyage |
| `buildSystemPrompt` | riscrittura tono/persona + regole anti-allucinazione |

## 9. Domande aperte
1. **Provider embeddings**: Voyage (Anthropic-raccomandato) o alternativa? E dove gira l'indicizzazione (script una-tantum su VPS).
2. **Aggiornamento corpus**: chi/quando aggiorna la base normativa (aggancio al monitor aggiornamenti [[project_regulatory_monitor]] / §3.4?).
3. **Modello**: restare su `claude-sonnet-4-6`/`haiku-4-5` o valutare `claude-sonnet-5` (Sonnet corrente) per il ragionamento? *(scelta di prodotto/costo, non normativa)*
4. **Confini dell'AI**: fin dove può spingersi il consiglio normativo? (proposta: informa + cita + propone, mai "certifica"; la responsabilità resta del gestore — coerente con "indirizzare non decidere").
