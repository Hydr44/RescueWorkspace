# Fase 5 — RVFU cleanup (progettazione)

> **⚠️ SOLO DESIGN — NIENTE APPLICATO / NIENTE PROD.** Feature flag; testare in **Formazione** (mai prod). Vedi [[feedback_prod_live_no_touch]].
>
> **Cosa fa:** togliere complessità dal modulo demolizioni e mettere i guardrail dov'è facile sbagliare. **Indipendente** dal profilo (non aspetta la Fase 0), tranne il `destinato_attivita` dal profilo. Consolida master §5 + gli artifact esplosione 💥 e timeline 🧭.

## 1. Ritiro del form legacy
`pages/DemolizioneRVFUForm.jsx` (**2438 righe**, monolite) è la singola fonte di complessità storica più grande, ancora routato su `/demolizioni-rvfu/new` e `/:id`. → **deprecare** quelle rotte verso il wizard nuovo (`nuova-pratica/`, già a 4 step) + il dettaglio. Rimozione a valle, dopo che il wizard copre tutti i casi.

## 2. Guardrail sui picker (default 90% dagli schemi 1.26)
| Scelta | Default | Guardrail |
|---|---|---|
| PRA vs non-PRA | derivato da `obbligoIscrizionePRA` (ACI) | mai chiesto |
| Tipo veicolo | `A` = Autoveicolo | label corrette (M=Moto **PRA**, F=Filobus); 15 codici |
| Causale | `D` | all'operatore solo D/P |
| Tipo documento | di sistema | trappole: smarrimento `S` (non D), procura `T` (non L) |
| Distinta | `DOCUMENTO` | 4 valori enum |
| Forzatura | `N` | `S` solo mostrando il vincolo ACI |

## 3. Scadenze come promemoria (aggancio al calendario)
- Annullo VFU: **entro la giornata** del CDR → badge "annullo disponibile solo oggi".
- "Radia veicolo" non-PRA: **entro il giorno dopo** il DA RADIARE → badge "scade oggi".
- Distruzione documenti: **non prima di 120gg** dal CDR → campo bloccato.
- Conservazione documentazione: **10 anni** dalla radiazione.

## 4. Timeline di lavorazione unificata (artifact 🧭)
Una sola timeline che intreccia il binario **legale RVFU/ACI** (radiazione, `vfu-state-machine.ts`) e quello **rifiuti RENTRI** (bonifica/movimenti/FIR), con: stato inequivocabile (✓/●/○/errore), *cosa ha generato* ogni passo, **errori spiegati** (non "Riprova" nudo), un solo pulsante. La timeline **mostra** la state machine, non la sostituisce (pulita → non toccarla). Dettaglio master §5.1 p4.

## 5. Esplosione VFU (artifact 💥)
Il veicolo entra come `16 01 04*`; la **bonifica** lo esplode nei fluidi (set `BONIFICA_PARTI`, 12 componenti) e lo declassifica in **`16 01 06`** (non "16 01 04 non pericoloso"). **Anteprima all'inserimento** ("in cosa verrà diviso"); in bonifica l'operatore spunta *cosa ha tolto + kg*, il resto è automatico. Meccanica a registro (causali `I`/`NP`/`aT`, `RiferimentoOperazione`) → **verificata**, master §5.3.

## 6. Fix di conformità collegati
La Fase 5 include i fix del registro VFU ([fix-conformita-registro-vfu.md](fix-conformita-registro-vfu.md)): causale scarico `I` (non NP), conferimento `aT` (non 'T'), provenienza `S`, `destinato_attivita` dal profilo (non R4), `RiferimentoOperazione` corretto/XSD. Sono **P1** (rompono la trasmissione) → prioritari, indipendenti dal resto.

## 7. Riuso vs nuovo
| Riusa | Nuovo |
|---|---|
| wizard `nuova-pratica/` (4 step), `vfu-state-machine.ts` (pulita) | ritiro form legacy; guardrail picker |
| `VFUProcessingTimeline`, `VFUBonificaForm` (BONIFICA_PARTI) | timeline unificata + esplosione con anteprima; errori spiegati |
| calendario/promemoria esistenti | scadenze normative come eventi |

## 8. Nota auth produzione (indipendente)
L'attrito storico #1 è l'auth OIDC/CDSSO in **produzione** (401/403, in attesa di ACI): problema infrastrutturale **separato**, non blocca il redesign UX (si testa in Formazione). Tracciarlo a parte.

## 9. Domande aperte
1. Quando ritirare del tutto il form legacy: dopo copertura completa del wizard o subito con redirect? (proposta: redirect subito, rimozione codice dopo un ciclo di test).
2. I fix §5.3 vanno rilasciati **prima** del resto (sono bug live-relevant appena si userà RENTRI demolizioni)? (proposta: sì, come patch a sé).
