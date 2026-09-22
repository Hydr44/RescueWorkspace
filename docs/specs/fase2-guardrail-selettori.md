# Fase 2 — Guardrail dei selettori (progettazione)

> **⚠️ SOLO DESIGN — NIENTE APPLICATO / NIENTE PROD.** Nasce **spento** (feature flag), attivo per org solo con profilo `confermato`; chi non ha il profilo mantiene il comportamento attuale (nessuna rottura per trasporti/clienti/chi non ha ancora fatto onboarding). Vedi [[feedback_prod_live_no_touch]].
>
> **Cosa fa:** trasforma il **profilo ambientale** (Fase 0/1) in filtri concreti nelle schermate: il selettore CER mostra solo ciò che sei autorizzato a trattare, le operazioni R/D solo quelle permesse. È il master §4.2 reso implementabile.
> **Confine con la Fase 3:** qui si filtrano **CER e operazioni R/D**. La **giacenza** (calcolo carico−scarico + avvisi) è la Fase 3.

## 1. Il motore guardrail (condiviso, riusabile)
Un unico punto che legge il profilo del **sito attivo** e risponde a tutte le schermate. Proposta: un hook + un servizio.

```
useProfileGuardrails(orgId, siteId) → {
  ready: boolean,               // false se profilo non 'confermato' → guardrail OFF
  cerAutorizzati: string[],     // da environmental_authorization.cer_autorizzati (∩ catalogo)
  operazioniRD: string[],       // da environmental_authorization.operazioni_rd
  isCerAutorizzato(cer): 'ok' | 'non_autorizzato' | 'inesistente',
  isRdAutorizzata(rd): boolean,
  defaultRdPerCer(cer): string  // es. olio 13 02 08* → R9, se nel profilo
}
```
- **`ready=false`** (profilo non confermato) → i selettori restano come oggi (testo libero / opzioni complete). Nessun blocco d'ufficio.
- Fonte: `environmental_authorization` del sito attivo; catalogo = `rentri_codifiche_cache`.

## 2. I tre livelli, concretamente — selettore CER
Riusa il componente esistente `RentriCodiceEERLookup.jsx` (+ RPC `search_codici_eer`), **filtrandolo sul profilo**.

| Livello | Caso | Comportamento UI |
|---|---|---|
| **① Propone** | CER nella tua autorizzazione | Il selettore mostra **solo** i `cer_autorizzati` del sito: nome in italiano + codice in mono. È la lista di default. |
| **② Avviso** | CER valido a catalogo ma **NON** nella tua autorizzazione | Non compare nella lista di default. Serve un'azione esplicita "cerca altri codici"; se selezionato → **banner giallo forte**: «questo CER non è nella tua autorizzazione — procedi solo se sai cosa fai». Procedibile (scelta di merito del gestore, Decisione B). |
| **③ Blocco** | EER **inesistente** a catalogo / formato non valido | Non selezionabile — lo rifiuterebbe RENTRI comunque. Messaggio: «codice non valido». |

> La demarcazione ②/③ segue il master §0: si blocca solo l'invalido tecnico; il "non autorizzato ma esistente" è una scelta di merito → avviso forte, non muro.

## 3. Selettore operazioni R/D
Oggi le operazioni R13/R12/D15… sono `<option>` **hardcoded** in `RifiutiMovimentoForm.jsx:~1309`, `RifiutiFormularioFormPDF.jsx:~120`, `RifiutiXFirForm.jsx`, `fir-builder.ts`. Con la Fase 2:
- il selettore propone **solo** `operazioni_rd` del profilo (①);
- `destinato_attivita` sul movimento/FIR ha un **default per CER** dal profilo (es. olio 13 02 08* → R9) invece della costante `R4` (chiude il bug §5.3 / [fix-conformita-registro-vfu.md](fix-conformita-registro-vfu.md) #7);
- un'operazione fuori dall'autorizzazione → avviso ② (merito), non presente di default.

## 4. Dove si aggancia
| Schermata | Cosa filtra |
|---|---|
| **Movimento rifiuti** (`RifiutiMovimentoForm.jsx`) | selettore CER (①/②/③) + operazioni R/D + `destinato_attivita` default per CER |
| **Esplosione VFU / bonifica** (`VFUBonificaForm.jsx`) | i 12 CER della bonifica devono essere nei `cer_autorizzati` del sito → altrimenti avviso ② in fase di setup profilo, non blocco al volo |
| **FIR / xFIR** (`fir-builder.ts`, `RifiutiXFirForm.jsx`) | `destinatario/destinato_attivita` dal profilo; CER coerente col mezzo (Fase 0 `environmental_vehicle`) |
| **Registro** (`RifiutiRegistroForm.jsx`) | `attivita_rec_smalt[]` proposto dalle `operazioni_rd` del sito |

## 5. Comportamento con profilo assente/non confermato (compatibilità)
- **Nessun profilo o `status≠'confermato'`** → `ready=false` → schermate **come oggi** (opzioni complete / lookup libero). Zero rotture.
- Il passaggio al filtrato avviene **solo** quando l'org ha completato l'onboarding e confermato il profilo. Feature flag per accensione graduale (org pilota su staging prima).

## 6. Riuso vs nuovo
| Riusa | Nuovo |
|---|---|
| `RentriCodiceEERLookup.jsx` + `search_codici_eer` | filtro `cerAutorizzati` sul lookup + livelli ②/③ |
| `rentri_codifiche_cache` (catalogo/validità EER) | hook `useProfileGuardrails` (motore condiviso) |
| i form esistenti (movimento/FIR/registro) | sostituzione `<option>` R/D hardcoded con quelle del profilo + default per CER |

## 7. Domande aperte
1. **"Cerca altri codici" (②)**: quanto renderlo difficile? Proposta: azione secondaria esplicita + banner, log dell'override (per audit) — non nascosto ma non di default.
2. **CER non autorizzato: chi può forzarlo?** solo ruoli senior o chiunque con l'avviso? (proposta: chiunque, ma con override loggato).
3. **Esplosione VFU**: se un fluido standard (es. gas condizionatore 14 06 01\*) non è nei `cer_autorizzati`, come gestirlo — avviso in onboarding (mancante in autorizzazione) o al momento? (proposta: check in onboarding, così non sorprende in bonifica).
