# Fase 6 — Movimento unico / motore di routing (progettazione)

> **⚠️ SOLO DESIGN — NIENTE APPLICATO / NIENTE PROD.** È la scommessa **architetturale** più grande e va **per ultima** (dipende da Fase 2/3). Feature flag; staging-first; **tocca `yard_items` che oggi vive solo in SQLite locale** → richiede prima la migrazione a Postgres. Massima cautela. Vedi [[feedback_prod_live_no_touch]].
>
> **Cosa fa:** l'operatore registra *cosa* entra/esce con **una sola azione**; un **motore di regole** decide le uscite (RENTRI / FIR / fattura / piazzale / report). Fine del doppio inserimento e dei 4 silos scollegati. Master §4.

## 1. Il problema oggi: 4 silos di "movimento" scollegati
| Silo | Dove | Cos'è |
|---|---|---|
| `rentri_movimenti` | Postgres | rifiuti carico/scarico (registro) |
| `yard_items` | **SQLite locale (Electron)** | veicoli in custodia/piazzale |
| `part_batches` | Postgres | ricambi (magazzino) |
| `accounting_entries` | Postgres | movimenti contabili |
L'operatore deve *sapere* dove registrare cosa. Obiettivo: **una UI, il motore instrada**.

## 2. Il motore di routing
Una sola funzione d'ingresso; l'operatore descrive la **natura** del movimento, il motore fa il fan-out.

```
registerMovement({ natura, cer?, quantita?, verso?, veicolo?, destinatario?, … }) → {
  outputs: [ ... ]   // creati dietro le quinte, ognuno con la sua tabella/adempimento
}
```

| Natura | Uscite (dietro le quinte) | Riusa |
|---|---|---|
| Rifiuto (EER) carico/scarico | `rentri_movimenti` (causale corretta §5.3) + scala giacenza (Fase 3) | `vfu-movimento-*` |
| Rifiuto trasportato a terzi | + FIR/xFIR digitale | `fir-builder` |
| Ricambio venduto per riuso (**non** rifiuto) | DDT + fattura SDI — **nessun** RENTRI | `part_batches`, invoice creator |
| Carcassa VFU al frantumatore | scarico RENTRI + FIR + collegamento pratica RVFU | Fase 5 |
| Veicolo in custodia (sequestro) | scheda piazzale + eventuale giacenza fatturabile (no RENTRI) | `yard_items`→Postgres |

**Guardrail** (Fase 2/3) scattano qui: CER solo se autorizzato ①/②, giacenza avviso ②, causali corrette by design.

## 3. Prerequisito duro: `yard_items` da SQLite a Postgres
Oggi il piazzale vive nel DB **locale** di Electron (`electron/db.js`) → non è multi-tenant cloud, non partecipa a RLS, non è nel motore. **Prima** del movimento unico va **portato su Supabase/Postgres** (tabella `yard_items` cloud + migrazione dati + RLS via `org_members`). È un intervento a sé, con rischio proprio → pianificarlo isolato e testato (è anche l'occasione per collegare Trasporto ⇄ Piazzale, cfr. `consigli-campi-processi.md §2`).

## 4. Approccio implementativo (proposta)
- **Non** una super-tabella "movimento" unica (rischiosa, riscrive tutto). Invece un **dispatcher** applicativo: `registerMovement` classifica e chiama i creatori esistenti (rifiuto→`vfu-movimento-*`, FIR→`fir-builder`, ricambio→invoice, piazzale→yard). I silos restano, ma **dietro un'unica porta**.
- Un log trasversale leggero `movement_log(org_id, tipo, ref_table, ref_id, created_at)` per tracciare "cosa è stato generato" (alimenta anche il report/audit §4.3 e la timeline).
- La UI è **una** ("Registra movimento", il mockup 🖥️/🔀); le uscite sono invisibili all'operatore.

## 5. Report / audit (l'uscita di lettura, master §4.3)
Se ogni movimento passa dal dispatcher e lascia traccia in `movement_log`, il **report configurabile** (veicoli demoliti, carcasse, olio smaltito kg, per CER/periodo/sito → PDF/Excel) è aggregazione DB, **costo ~zero**, niente AI.

## 6. Perché per ultima
- Dipende da Fase 2 (guardrail) e Fase 3 (giacenza) già attivi.
- Richiede la migrazione `yard_items`→Postgres (rischio a sé).
- Tocca moduli live (piazzale, ricambi) → massima cautela, staging + un'org pilota, mai big-bang.

## 7. Riuso vs nuovo
| Riusa | Nuovo |
|---|---|
| `vfu-movimento-*`, `fir-builder`, invoice creator, `part_batches` | dispatcher `registerMovement` (classifica + fan-out) |
| `yard_items` (schema) | **migrazione a Postgres** + RLS |
| Fase 2/3 (guardrail/giacenza) | `movement_log` trasversale + report configurabile |
| UI "Registra movimento" (mockup) | il collegamento UI → dispatcher |

## 8. Domande aperte
1. **Big-bang vs graduale**: accendere il dispatcher per un tipo di movimento alla volta (prima rifiuti, poi ricambi, poi piazzale)? (proposta: graduale, per tipo).
2. **`yard_items`→Postgres**: intervento separato e propedeutico — quando pianificarlo (potrebbe stare anche prima, slegato dal movimento unico, perché sblocca già Trasporto⇄Piazzale)?
3. **Retrocompatibilità**: chi crea movimenti "alla vecchia maniera" durante la transizione — il dispatcher intercetta o convivono? (proposta: convivenza dietro flag, poi convergenza).
