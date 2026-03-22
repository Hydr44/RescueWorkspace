# Rapporto Modulo Fatture — RescueManager Desktop App

**Data:** 11 Febbraio 2026  
**Autore:** Analisi automatica del codice sorgente  
**Scope:** Desktop App (`desktop-app/greeting-friend-api-main/`) + Modulo SDI-SFTP (`moduli/SDI-SFTP/`)

---

## 1. Cosa deve avere un modulo fatture completo (standard italiano)

Un modulo fatturazione elettronica completo per un'azienda italiana deve coprire **8 aree funzionali**:

| # | Area | Descrizione |
|---|------|-------------|
| 1 | **Creazione fattura** | Form completo con dati cedente, cessionario, righe dettaglio, IVA, sconti, pagamento |
| 2 | **Tipi documento** | TD01 (fattura), TD02 (acconto), TD04 (nota credito), TD05 (nota debito), TD24 (differita), TD18/TD19 (autofattura) |
| 3 | **Generazione XML FatturaPA 1.2.2** | XML conforme allo schema XSD dell'Agenzia delle Entrate, con validazione errori SDI |
| 4 | **Trasmissione a SDI** | Invio tramite canale accreditato (SFTP, PEC, o web service SDICoop) |
| 5 | **Ricezione fatture passive** | Ricezione e decifratura file FO dal canale SDI |
| 6 | **Gestione stati SDI** | Tracking completo: bozza → validata → inviata → consegnata/rifiutata → archiviata |
| 7 | **Contabilità** | Movimenti contabili in partita doppia, piano dei conti, registrazioni automatiche |
| 8 | **Reportistica** | Dashboard con KPI, fatturato mensile, top clienti, stato pagamenti |

### Requisiti tecnici obbligatori per conformità SDI:

- **Validazione XML** contro errori SDI (00417-00430)
- **Firma digitale** (CAdES o XAdES) del file XML
- **Cifratura** con certificato pubblico Sogei
- **Naming convention** file: `IT{P.IVA}_{progressivo}.xml`
- **Conservazione sostitutiva** a norma (10 anni)
- **Gestione notifiche** SDI (RC, NS, MC, NE, DT, AT)
- **Numerazione progressiva** senza buchi
- **Gestione split payment** (PA) e reverse charge
- **Supporto multi-aliquota IVA** e Natura IVA (N1-N7)
- **Gestione clienti esteri** (CAP 00000, Provincia EE)

---

## 2. Stato attuale del modulo fatture RescueManager

### 2.1 File coinvolti

| File | Righe | Ruolo |
|------|-------|-------|
| `src/pages/InvoiceNew.jsx` | 2414 | Form creazione fattura (completo) |
| `src/pages/InvoiceForm.jsx` | 1234 | Dettaglio/modifica fattura + invio SDI |
| `src/pages/Invoices.jsx` | 723 | Lista fatture emesse + ricezione passive |
| `src/pages/InvoiceDashboard.jsx` | 412 | Dashboard statistiche |
| `src/lib/sdi.js` | 210 | Client API per SDI-SFTP server |
| `src/lib/accounting.js` | 478 | Movimenti contabili partita doppia |
| `src/lib/billing/sdi.ts` | 45 | Driver BillingGateway per SDI |
| `src/lib/billing/types.ts` | 6 | Interfaccia BillingDriver |
| `src/lib/billing/index.ts` | 8 | Factory BillingGateway |
| `moduli/SDI-SFTP/server-vps/server.js` | 1110 | Server VPS per SFTP SDI |
| `moduli/SDI-SFTP/server-vps/xml-generator.js` | 634 | Generatore XML FatturaPA 1.2.2 |

### 2.2 Matrice completezza

| Area | Stato | Dettaglio |
|------|-------|-----------|
| **Creazione fattura** | ✅ Completo | Form con cedente/cessionario, righe, IVA, sconti, pagamento, note. Supporta persona fisica/giuridica, calcolo CF automatico, autocompletamento P.IVA da Agenzia Entrate, ricerca indirizzo Google Maps |
| **Tipi documento** | ✅ Completo | TD01, TD02, TD04, TD05, TD24, TD18, TD19 tutti supportati. Note credito/debito con riferimento fattura originale |
| **Generazione XML** | ✅ Completo | `xml-generator.js` genera FatturaPA 1.2.2 conforme con namespace corretto, validazione errori SDI (00417-00430), gestione multi-aliquota, sconti/maggiorazioni, causale obbligatoria per NC/ND, DatiRiferimento |
| **Trasmissione SDI** | ✅ Funzionante | Server VPS su porta 3004, invio via SFTP con firma digitale e cifratura Sogei. Supporta test mode |
| **Ricezione passive** | ✅ Funzionante | `getIncomingInvoices()` + `decryptIncomingInvoice()` per file FO. Tab "Ricevute" in Invoices.jsx |
| **Gestione stati** | ✅ Completo | draft → validated → sent → delivered/rejected → archived. Badge colorati, filtri per stato |
| **Contabilità** | ✅ Completo | Partita doppia per fatture emesse, pagamenti, note credito. Piano dei conti inizializzabile. Conti: 120 (crediti clienti), 401 (ricavi), 1001 (banca), 1002 (cassa), 2001 (IVA debito) |
| **Reportistica** | ✅ Completo | Dashboard con: totale fatture, fatturato totale/mensile, fatture per stato, trend mensile, top clienti |

---

## 3. Punti di forza

1. **XML Generator robusto** — Il `xml-generator.js` è il componente più maturo. Gestisce correttamente:
   - Validazione errori SDI specifici (00417, 00421, 00422, 00423, 00424, 00425, 00427, 00428, 00429, 00430)
   - Multi-aliquota IVA con raggruppamento automatico in DatiRiepilogo
   - Sconti/maggiorazioni per riga (SC/MG) con ricalcolo PrezzoTotale
   - Clienti esteri con validazione P.IVA per paese (IT, DE, FR, ES, GB, extra-UE)
   - FormatoTrasmissione automatico (FPA12 per PA, FPR12 per privati)
   - Causale obbligatoria per TD04/TD05
   - DatiRiferimento per note credito/debito

2. **Form InvoiceNew molto completo** — 2414 righe con:
   - Autocompletamento P.IVA da OpenAPI/Agenzia Entrate
   - Calcolo automatico codice fiscale per persone fisiche
   - Ricerca indirizzo con Google Maps
   - Gestione sconti percentuali e fissi
   - Riepilogo IVA con Natura e Esigibilità
   - Condizioni e modalità pagamento (MP01-MP23)
   - Note esterne (SDI) e interne

3. **Infrastruttura SFTP reale** — Server VPS con certificati firma/cifra, chiavi SFTP, certificato pubblico Sogei

4. **Contabilità in partita doppia** — Registrazioni automatiche per fatture, pagamenti e note credito

---

## 4. Lacune e problemi identificati

### 4.1 Critici (bloccanti per produzione)

| # | Problema | Impatto | File |
|---|----------|---------|------|
| C1 | **Validazione XML solo lato server** — `validateInvoiceXML()` in `sdi.js` ritorna sempre `{ success: true }` senza validare nulla | L'utente non ha feedback pre-invio | `src/lib/sdi.js:177-181` |
| C2 | **Generazione XML solo lato server** — `generateInvoiceXML()` ritorna sempre `{ success: true }` | Non si può visualizzare/scaricare l'XML prima dell'invio | `src/lib/sdi.js:189-193` |
| C3 | **getPdf() non implementato** — Il driver SDI ritorna `null` | Non si possono generare PDF delle fatture | `src/lib/billing/sdi.ts:33-37` |
| C4 | **getXml() non implementato** — Il driver SDI ritorna `null` | Non si può recuperare l'XML dal database | `src/lib/billing/sdi.ts:39-43` |
| C5 | **Nessuna gestione notifiche SDI** — Non c'è polling/webhook per RC, NS, MC, NE, DT, AT | Non si sa se la fattura è stata accettata o rifiutata dal destinatario | Assente |
| C6 | **Nessuna conservazione sostitutiva** — Obbligo legale 10 anni | Non conforme alla normativa | Assente |
| C7 | **buildXmlMinimal in InvoiceForm.jsx è un mock** — Genera XML incompleto senza CedentePrestatore, senza DatiRiepilogo, senza DatiPagamento | Usato per anteprima ma fuorviante | `src/pages/InvoiceForm.jsx:24-90` |

### 4.2 Importanti (funzionalità mancanti)

| # | Problema | Impatto |
|---|----------|---------|
| I1 | **Nessuna gestione pagamenti** — Non c'è UI per registrare pagamenti ricevuti | Il `payment_status` non viene mai aggiornato |
| I2 | **Nessun export PDF** — jsPDF è importato in InvoiceForm ma non c'è generazione PDF reale | Non si possono stampare/inviare fatture in PDF |
| I3 | **Nessuna gestione solleciti** — Non c'è tracking scadenze pagamento | Nessun alert per fatture scadute |
| I4 | **Nessuna fattura ricorrente** — Non si possono creare fatture periodiche automatiche | Tutto manuale |
| I5 | **Nessun import fatture passive** — Le fatture ricevute via SDI non vengono salvate come record nel DB | Solo visualizzazione file FO |
| I6 | **Nessuna gestione allegati** — FatturaPA supporta allegati (DDT, contratti) | Non implementato |
| I7 | **Nessuna numerazione automatica garantita** — Il progressivo viene calcolato lato client con possibili race condition | Rischio numeri duplicati in multi-utente |
| I8 | **DatiPagamento fisso a TP02/MP05** — L'XML generator ignora i dati pagamento dal form e usa sempre TP02 (completo) e MP05 (bonifico) | I dati inseriti dall'utente nel form non finiscono nell'XML |

### 4.3 Minori (miglioramenti)

| # | Problema |
|---|----------|
| M1 | **Nessuna validazione P.IVA italiana** (check digit) lato client prima dell'invio |
| M2 | **Nessun supporto fattura accompagnatoria** (con DDT integrato) |
| M3 | **Nessun supporto bollo virtuale** (€2 per fatture esenti > €77.47) |
| M4 | **Nessun supporto cassa previdenziale** (INPS, ENASARCO, ecc.) |
| M5 | **Nessun supporto ritenuta d'acconto** |
| M6 | **Nessuna gestione multi-valuta reale** — Il campo currency esiste ma l'XML usa sempre EUR |
| M7 | **Nessun log/audit trail** delle operazioni SDI |

---

## 5. Riepilogo percentuale completezza

| Area | % | Note |
|------|---|------|
| Creazione fattura | **90%** | Manca: allegati, bollo, cassa previdenziale, ritenuta |
| Tipi documento | **95%** | Tutti i principali supportati |
| Generazione XML | **85%** | Server-side OK, client-side mock. DatiPagamento hardcoded |
| Trasmissione SDI | **80%** | Funziona ma manca gestione notifiche di ritorno |
| Ricezione passive | **60%** | Visualizzazione OK, import in DB assente |
| Gestione stati | **70%** | Stati base OK, manca aggiornamento automatico da notifiche SDI |
| Contabilità | **75%** | Partita doppia OK, manca UI pagamenti e riconciliazione |
| Reportistica | **85%** | Dashboard buona, manca report scadenze e aging |

### **Completezza complessiva stimata: ~80%**

Il modulo è **sorprendentemente completo** per un progetto in sviluppo. La parte più forte è il generatore XML FatturaPA che gestisce correttamente la maggior parte dei casi d'uso e degli errori SDI. Le lacune principali sono nella **post-trasmissione** (notifiche, conservazione) e nella **gestione pagamenti**.

---

## 6. Priorità di sviluppo consigliate

### Fase 1 — Produzione minima (1-2 settimane)
1. ~~Implementare~~ **Collegare DatiPagamento** dal form all'XML (C8 → I8)
2. **Implementare getPdf()** — Generazione PDF da dati fattura (C3)
3. **Implementare validazione XML client-side** — Almeno controlli base prima dell'invio (C1)
4. **Implementare getXml()** — Recupero XML generato dal server (C4)

### Fase 2 — Conformità (2-4 settimane)
5. **Gestione notifiche SDI** — Polling periodico per RC/NS/MC/NE/DT/AT (C5)
6. **Import fatture passive** — Salvare file FO decifrati come record invoice nel DB (I5)
7. **Numerazione server-side** — Spostare generazione progressivo su Supabase function (I7)
8. **Conservazione sostitutiva** — Integrazione con provider (Aruba, InfoCert) o storage conforme (C6)

### Fase 3 — Funzionalità avanzate (4-8 settimane)
9. **Gestione pagamenti** — UI per registrare incassi, riconciliazione automatica (I1)
10. **Solleciti automatici** — Alert scadenze, email sollecito (I3)
11. **Bollo virtuale** — Calcolo automatico €2 per fatture esenti > €77.47 (M3)
12. **Ritenuta d'acconto e cassa previdenziale** (M4, M5)

---

## 7. Architettura attuale

```
┌─────────────────────────────────────────────────────┐
│                   Desktop App (Electron)             │
│                                                      │
│  InvoiceNew.jsx ──→ Supabase (invoices table)       │
│  InvoiceForm.jsx ──→ sdi.js ──→ VPS Server (:3004)  │
│  Invoices.jsx ──→ sdi.js ──→ VPS Server (:3004)     │
│  InvoiceDashboard.jsx ──→ Supabase (query)          │
│  accounting.js ──→ Supabase (accounting_entries)     │
│                                                      │
└──────────────────────┬──────────────────────────────┘
                       │ HTTPS
                       ▼
┌──────────────────────────────────────────────────────┐
│              VPS Server (sdi-sftp.rescuemanager.eu)   │
│                                                      │
│  server.js (:3004)                                   │
│    ├── /api/sdi-sftp/send (genera XML + firma + SFTP)│
│    ├── /api/sdi-sftp/files/incoming (lista FO)       │
│    └── /api/sdi-sftp/files/incoming/:id/decrypt      │
│                                                      │
│  xml-generator.js (FatturaPA 1.2.2)                  │
│  Certificati: firma.p12, cifra.p12, sogei.pem        │
│                                                      │
└──────────────────────┬──────────────────────────────┘
                       │ SFTP
                       ▼
┌──────────────────────────────────────────────────────┐
│           Sistema di Interscambio (SDI)               │
│           Agenzia delle Entrate                       │
└──────────────────────────────────────────────────────┘
```

---

*Fine rapporto*
