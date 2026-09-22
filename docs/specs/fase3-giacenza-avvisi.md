# Fase 3 — Giacenza netta + avvisi (progettazione)

> **⚠️ SOLO DESIGN — NIENTE APPLICATO / NIENTE PROD.** Nasce **spento** (feature flag), attivo per org con profilo `confermato`. Chi non ha il profilo mantiene il comportamento attuale (solo alert soft esistenti). Vedi [[feedback_prod_live_no_touch]].
>
> **Cosa fa:** calcola quanto rifiuto hai *davvero* in giacenza (carico − scarico, in tempo reale) e avvisa quando ti avvicini o superi i limiti dell'autorizzazione — **avvisi, mai blocchi** (Decisione B). I limiti vengono dal profilo (Fase 0), single-source.

## 1. Due grandezze, due limiti (oggi confuse in una)
| | Cos'è | Limite dal profilo | Oggi |
|---|---|---|---|
| **Giacenza istantanea** | quanto rifiuto è *ora* in impianto (stock) | `limiti[tipo='istantaneo']` (giacenza max t/kg) | ❌ non calcolata |
| **Cumulato annuo** | quanto ne hai trattato/ricevuto nell'anno (flusso) | `limiti[tipo='annuo']` (t/anno) | 🟡 `rentri_limiti_rifiuti.quantita_attuale`, ma solo movimenti `trasmesso` |

I limiti stanno in `environmental_authorization.limiti` (jsonb, Fase 0), per CER **e** totale (`codice_eer=null`).

## 2. Il calcolo (net, tempo reale, tutti i movimenti)
- **Giacenza istantanea (per sito, per CER)** = Σ carichi − Σ scarichi. È uno **stock**: cresce a carico, cala a scarico, si inverte con l'annullamento. **Nessun reset annuale.**
  - Conta **tutti** i movimenti registrati (non solo `trasmesso`): il rifiuto è fisicamente lì anche prima della trasmissione. *(Corregge il difetto attuale del trigger, che conta solo i trasmessi.)*
- **Cumulato annuo (per sito, per CER)** = Σ carichi dell'anno solare; reset a inizio anno. *(È ciò che il limite `t/anno` verifica.)*

**Approccio implementativo (proposta):** contatori mantenuti da trigger, non query live a ogni schermata (il form movimento e la dashboard leggono spesso → serve istantaneo). Tabella dedicata:
```sql
-- PROPOSTA (non applicata)
create table public.environmental_giacenza (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  site_id uuid not null references public.environmental_site(id) on delete cascade,
  codice_eer text not null,
  anno int not null,
  giacenza_istantanea numeric not null default 0,   -- stock netto (kg/l)
  cumulato_annuo numeric not null default 0,        -- flusso annuo
  updated_at timestamptz not null default now(),
  unique (site_id, codice_eer, anno)
);
-- trigger su rentri_movimenti: carico → +istantanea +annuo; scarico → −istantanea;
-- annullamento → reverse. (Estende update_rentri_limiti_on_movimento, ma NET e tutti gli stati.)
```
`rentri_limiti_rifiuti` resta per compatibilità ma il **valore-limite** si legge dal profilo (Fase 0, decisione fonte unica); `environmental_giacenza` è il *consumato* netto.

## 3. Gli avvisi ② (Decisione B — mai blocco)
Confronto giacenza/cumulato vs limite del profilo, per CER e totale:

| Stato | Soglia | UI |
|---|---|---|
| **ok** | < soglia (default 80%, `soglia_alert_percentuale` esistente) | barra verde |
| **in avvicinamento** | ≥ soglia, < 100% | barra ambra ② «ti avvicini al limite: X su Y» |
| **superato** | ≥ 100% | barra rossa ② **«operazione vivamente sconsigliata: superi la giacenza autorizzata di Z kg»** — **procedibile** |

- **Mai blocco** (Decisione B). L'unico blocco resta l'invalido tecnico (Fase 2, EER inesistente).
- Il superamento è **loggato** (per audit / consulente AI / admin).

## 4. Dove si mostra
| Punto | Comportamento |
|---|---|
| **Movimento rifiuti** (mentre digiti la quantità) | barra giacenza live per il CER scelto; se il carico sforerebbe → avviso ② prima di salvare (procedibile) |
| **Esplosione VFU / bonifica** | ogni fluido rimosso scala la giacenza del suo CER; avviso se un fluido sfora |
| **Dashboard** (`RENTRIComplianceWidget` esistente) | riepilogo per CER vicino/oltre limite → banner |
| **Profilo ambientale** | vista limiti vs consumato (barre), come `RifiutiLimitiPreview` ma su dati net |

## 5. Come cambia rispetto a oggi
- Oggi: solo **cumulato annuo** sui **trasmessi**, alert soft (`RENTRIComplianceWidget:107`, soglia hardcoded `LIMIT_PERICOLOSO_KG=10000` in `useNotifications.js:273`).
- Fase 3: + **giacenza istantanea netta**, su **tutti** i movimenti, con **limiti dal profilo** (non hardcoded), avvisi a soglia configurabile. Rimuovere il `10000` hardcoded → dal profilo.

## 6. Riuso vs nuovo
| Riusa | Nuovo |
|---|---|
| `rentri_limiti_rifiuti` (soglia, quantita_attuale), trigger `update_rentri_limiti_on_movimento` | `environmental_giacenza` (stock netto) + trigger NET/tutti-gli-stati |
| `RifiutiLimitiPreview`, `RENTRIComplianceWidget` (barre/alert) | alimentati da giacenza netta + limiti dal profilo |
| soglia % esistente | rimozione soglia hardcoded `10000` → dal profilo |

## 7. Domande aperte
1. **Cumulato annuo = carichi o throughput?** Il limite `t/anno` dell'autorizzazione conta il *ricevuto/trattato* → probabile Σ carichi. Da confermare col testo dell'autorizzazione (varia per provvedimento).
2. **Contatore vs query live**: proposta = contatore mantenuto (perf). Ok, o preferisci una `view`/funzione ricalcolata (più semplice, meno performante)?
3. **Cosa conta per l'istantanea**: tutti i movimenti (proposta, realtà fisica) o solo trasmessi? La proposta è "tutti"; da confermare se la lettura legale della "giacenza" coincide.
4. **Unità**: il profilo può avere limiti in t, i movimenti in kg/l → normalizzazione (t↔kg) nel confronto. Gestire densità per i liquidi (kg↔l) o tenere kg?
