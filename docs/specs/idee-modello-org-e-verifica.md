# ABBOZZO — Modello Org (C) + Verifica attivazione + ATECO + allineamento dati

> ⚠️ **ABBOZZO / idee da consolidare** nel design unico del pannello admin.
> Non è la spec finale. Decisione presa: **modello (C)** (leads = funnel,
> orgs = tenant attivato; identità logica, una copia sola all'attivazione).

---

## 1. Decisione: modello (C)
- **`leads`** = "l'Organizzazione nel funnel": tutta l'anagrafica + cronologia, un solo `stato` (lead → demo → trattativa → in_verifica → perso). Già contiene ragione sociale, P.IVA, CF, PEC, ATECO, sede, forma giuridica, demo_org_id.
- **`orgs`** = solo il tenant del prodotto, creato all'attivazione. Stato cliente: cliente_attivo → sospeso → disdetto.
- Preventivo + Demo pendono dal **lead**; Abbonamento + Utenti dall'**org**.
- Confine: *prima dell'attivazione* sta sul lead, *dopo* sull'org. **Una copia sola** al passaggio (no sync bidirezionale).

## 2. Stato `in_verifica` + flusso di verifica (nuovo)
La macchina si raffina: il pagamento **non** attiva subito; apre la verifica.

```
trattativa ──(pagamento ok)──▶ in_verifica ──(approvato)──▶ [ATTIVAZIONE crea org] ──▶ cliente_attivo
                                   └────────(respinto)──────────────────────────────▶ trattativa / perso
```

**Lato cliente (pagina con token, no login — come la pagina pubblica preventivo):**
- "Stiamo verificando le tue informazioni."
- Mostra i **dati autocompilati** (da API P.IVA) per conferma/correzione.
- **Carica la visura camerale** (PDF).

**Verifica (semi-automatica):**
1. **API Registro Imprese (registro vivo)** = fonte di verità: conferma stato `Attiva` + dati canonici (PEC, codice SDI, ATECO, sede).
2. **Parsing visura** (OCR/AI → dati strutturati) e **confronto** con API + dati inseriti. Evidenzia discrepanze.
3. (Opz.) QR visura InfoCamere = controllo autenticità manuale a occhio.

**Lato admin — PAGINA REVISIONE (dedicata):**
- Lista delle org in `in_verifica`. Per ognuna: dati autocompilati, esito API (stato attività), dati estratti dalla visura, **diff/flag**.
- Azione: **Approva** (→ attiva) oppure **Richiedi correzione** / **Respingi**.
- È il gate "regolamentato e documentato": approvazione umana, loggata.
- **Su quale entità?** Sul **lead/funnel** (l'org NON esiste ancora — viene creata solo all'approvazione). Quindi la pagina Revisione vive nel funnel.

**Cosa si salva (compliance/audit):** file visura (storage R2), **snapshot risposta API**, chi approva, timestamp, esito. È la traccia anti-frode / KYC-lite.

**Scelta di policy:** *blocca-fino-a-verifica* (l'account non è vivo finché non approvato) — coerente con "non appena ci siamo attiviamo tutto". Alternativa (attiva subito, verifica in background) scartata: meno "regolamentata".

## 3. ATECO — a cosa serve (verdetto)
Arriva **gratis** da API P.IVA / visura. Usi reali:
1. **Verifica / anti-frode**: il settore combacia? Un cliente RescueManager dovrebbe avere ATECO da autodemolizione/soccorso/trasporto (es. 38.31, 45.x, 49.4). ATECO "strano" = flag in fase di verifica.
2. **Suggerimento configurazione**: ATECO demolizione → proponi modulo RVFU/RENTRI.
3. **Segmentazione/analytics**: che tipo di aziende sono i clienti (utile marketing).
4. Profilo azienda completo.
**Verdetto:** non critico ora (zero clienti). Tienilo (è gratis), usalo come **segnale nella verifica** (§2) e per il suggerimento config. Non costruirci feature dedicate adesso.

## 4. Allineamento dati lead ↔ org (il punto delicato di (C))
**Copia UNA volta, una direzione, all'attivazione.** Niente sync bidirezionale.
- Il **lead** si riempie/verifica nel funnel (autofill API + visura + revisione).
- All'approvazione, i dati **verificati** vengono copiati nell'**org** (in `org_settings.company`, che è ciò che app desktop + SDI leggono). Da lì in poi l'org è autoritativa; il lead resta storia congelata.

**Mapping (canonico, una sola fonte):**
| lead | → | org / org_settings.company |
|---|---|---|
| `company` / `name` | → | `orgs.name` + `company.company_name` |
| `vat_number` | → | `company.vat` |
| `codice_fiscale` | → | `company.tax_code` |
| `pec` | → | `company.pec` |
| `forma_giuridica` | → | `company.forma_giuridica` |
| `codice_ateco` | → | `company.codice_ateco` |
| `address_street/city/province/postal_code` | → | `company.address` (oggetto) |
| (da API) codice destinatario SDI | → | `company.codice_destinatario` |

> Post-attivazione il cliente modifica questi dati **nel prodotto** (OrganizationSettings → org_settings.company). Il lead non si tocca più.

---

## Da consolidare poi (nel design unico)
Questo abbozzo + il modello (C) + la spec flusso preventivo→pagamento + GoCardless F1 → un solo **documento di design del pannello admin** con: modello dati finale, le 2 macchine a stati (funnel + cliente), e la mappa pagine (Lead, Demo, **Revisione**, Attivazione, Clienti, Preventivi, Pagamenti, Task…).
