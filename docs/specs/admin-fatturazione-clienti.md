# Fatturazione clienti dall'Admin Panel — architettura

> Stato: **PROPOSTA / struttura da validare** (design-first, niente codice).
> Obiettivo: dall'admin panel, **RescueManager SRL emette fatture elettroniche ai propri clienti (le org)** per l'abbonamento SaaS, tramite SDI.

## Principio guida: RIUSO, non riscrittura
L'infrastruttura di fatturazione elettronica **esiste già** ed è multi-tenant. NON creiamo un sistema parallelo. Riusiamo:
- Tabella **`invoices`** (già a DB, 41 colonne, `direction`, `number`, `sdi_status`, `payment_status`, IVA/bollo/ritenuta/cassa, `xml_url`/`pdf_url`, `meta` jsonb).
- Servizio **`sdi-ws`** su VPS (multi-tenant per `org_id`): `POST /api/sdi/send-from-db` (genera XML FatturaPA + firma automatica Namirial + invio SDI leggendo la fattura dal DB), `/api/sdi/tx-auto`, `/api/sdi/inbox` (notifiche RX). Vedi memoria `reference_sdi_ws_vps`, `project_sdi_firma_automatica`.
- **Numerazione** già risolta: colonna `direction` + indice unico parziale sulle attive + RPC ricalcolo (memoria `project_invoice_number_race`).

**Intuizione chiave**: RescueManager SRL **è già un'org** nel sistema (org "RescueManager S.R.L.", `org_id`, plan=full). Le fatture SaaS ai clienti sono semplicemente le **fatture attive di quell'org** (cedente = RescueManager SRL), con `customer_*` = dati fiscali dell'org fatturata. Così l'admin diventa un front-office sull'org di RescueManager, riusando engine + tabella + SDI.

## Attori di una fattura SaaS
- **Cedente/Prestatore (emittente)** = RescueManager SRL — dati fissi: P.IVA `02176370852`, PEC `rescuemanager@legalmail.it`, regime, sede, trasmittente `SDI-02176370852` (memoria `project_sdi_accreditamento`). Configurati in `org_settings.company` dell'org di RescueManager + credenziali firma automatica.
- **Cessionario/Committente (destinatario)** = l'org cliente — da `org_settings.company` del cliente: `vat`, `pec`, `codice_destinatario` (SDI), `regime_fiscale`, sede. (Già mostrati/curati nel form cliente `ClientCompanyEdit`.)
- **Righe** = l'abbonamento: piano (`plans`/listino) × periodo (mensile/annuale/biennale) + eventuali moduli speciali. Prezzi da `lib/listino` / tabella `plans`.

## Modello dati (riuso `invoices`)
Nuova fattura SaaS = INSERT in `invoices` con:
- `org_id` = **org_id di RescueManager SRL** (l'emittente)
- `direction` = `attiva`
- `number` = da RPC di numerazione (serie dedicata SaaS, vedi §Decisioni)
- `customer_name/customer_vat/customer_tax_code/customer_address` = dati fiscali dell'**org fatturata**
- `total`, IVA 22%, eventuale bollo/ritenuta/cassa (di norma non servono per SaaS)
- `meta.sdi` = documento (TD01), cessionario, righe; `meta.saas = { billed_org_id, plan, period, subscription_id }` per tracciare CHI è stato fatturato
- `payment_status` = non_pagata → pagata; `sdi_status` = bozza → trasmessa → accettata/rifiutata

Nessuna nuova tabella. Un campo di collegamento (`meta.saas.billed_org_id`) lega la fattura all'org cliente.

## Flusso
1. Admin apre **Fatturazione** → "Nuova fattura cliente".
2. Sceglie il **cliente** (org) — precompila `customer_*` da `org_settings.company` del cliente (avvisa se mancano P.IVA/PEC/codice destinatario, come fa `ClientCompanyEdit` con `alert`).
3. Sceglie **piano + periodo** (o importo custom) → riga fattura + IVA calcolate dal listino.
4. Salva → crea la riga `invoices` (numerazione via RPC) in stato **bozza**.
5. "Invia allo SDI" → chiama `sdi-ws` `POST /api/sdi/send-from-db` con l'id fattura (emittente = org RescueManager) → XML FatturaPA generato + firmato (Namirial) + trasmesso; `sdi_status='trasmessa'`.
6. Notifiche SDI (RC/NS/MC…) arrivano via `sdi-ws /api/sdi/inbox` multi-tenant → aggiornano `sdi_status`.
7. Pagamento: registra incasso → `payment_status='pagata'` (opz. link a bonifico/Stripe).
8. PDF (`fatturaPaPdfGenerator` del desktop, portabile) + XML scaricabili (`pdf_url`/`xml_url`).

## API backend (contratti — no codice)
| Metodo | Endpoint | Scopo |
|---|---|---|
| GET | `/api/staff/admin/invoices` | lista fatture SaaS (invoices dell'org RescueManager, direction attiva) |
| POST | `/api/staff/admin/invoices` | crea bozza (cliente + piano/periodo/importo) + numerazione RPC |
| POST | `/api/staff/admin/invoices/:id/send` | proxy a `sdi-ws /api/sdi/send-from-db` |
| POST | `/api/staff/admin/invoices/:id/mark-paid` | segna pagata (registra incasso) |
| GET | `/api/staff/admin/invoices/:id/notifiche` | stato SDI da inbox |

## UI Admin
- Voce sidebar **Fatturazione** (sezione Analisi/Sistema).
- Lista: numero, cliente, importo, stato SDI, stato pagamento, data. Filtri stato/periodo. KPI (fatturato, incassato, in attesa).
- **Nuova fattura**: step cliente → piano/periodo → riepilogo (imponibile, IVA, totale) → salva bozza → invia SDI. Riusa i componenti puliti del form cliente.
- Dettaglio fattura: dati, timeline notifiche SDI, PDF/XML, segna pagata.
- Da **dettaglio cliente** (`ClientDetailPage`) → azione "Emetti fattura" (precompilata dall'abbonamento).

## Decisioni — VALIDATE (2026-07-07)
- **A] Numerazione → SERIE DEDICATA** per le fatture SaaS (es. `RM/2026/NNN`), separata dalle operative.
- **B] Emittente = org RescueManager esistente (riuso puro)**. L'utente inserirà da admin TUTTI i dati fiscali corretti dell'emittente (RescueManager SRL) in `org_settings.company` dell'org RescueManager.
- **C] Firma automatica VALIDA** e abilitata all'invio di tutte le fatture (`sdi-ws`). Non è un blocco.
- **D] "Come il desktop"**: si replica il flusso desktop → `sdi-ws /api/sdi/send-from-db {invoice_ids, org_id}` che legge `invoices`+`invoice_items` e genera/firma/invia l'XML. Sorgente server locale in `moduli/SDI-WS/server-vps/`; accesso VPS via SSH host `vps-sdi`.
- **E] Incasso FLESSIBILE**: dipende dal metodo (manuale → "segna pagata"; bonifico/Stripe → in base al caso). Fase 1 parte con "segna pagata" manuale, i metodi si aggiungono dopo.

### Implicazioni operative confermate
- Creare le fatture SaaS come righe `invoices` (+ `invoice_items`) con `org_id` = org RescueManager, `customer_*` = dati fiscali dell'org fatturata, poi chiamare `send-from-db` con quell'`org_id`.
- Serve prima popolare l'anagrafica fiscale emittente dell'org RescueManager (l'utente lo farà da admin) + confermare che quell'org sia abilitata alla firma su `sdi-ws`.

## Rollout a fasi
1. **Fase 0 (verifica)**: confermare org_id RescueManager, anagrafica fiscale completa in `org_settings.company`, credenziali firma su `sdi-ws`, che `send-from-db` funzioni per quell'org (test 1 fattura verso un cliente reale in ambiente test SDI).
2. **Fase 1**: endpoint list/create bozza + UI lista e nuova fattura (senza invio) → si emettono bozze corrette.
3. **Fase 2**: invio SDI (proxy `send-from-db`) + tracciamento notifiche.
4. **Fase 3**: PDF/XML download, segna pagata, KPI, azione da dettaglio cliente.
5. **Fase 4**: (opz.) generazione ricorrente automatica alla scadenza abbonamento.

## Cosa NON fare
- NON duplicare l'engine FatturaPA/SDI: è su `sdi-ws`.
- NON creare una tabella fatture separata: usare `invoices` (+ `meta.saas`).
- NON toccare le fatture operative degli altri org (isolamento per `org_id`).
