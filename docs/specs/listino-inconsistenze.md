# Listino — inconsistenze rilevate e decisioni aperte

> Emerso dalla mappatura prezzi (F1, 2026-06-16) prima di spostare il listino su `plans`.
> La tabella DB **`plans`** (migration `20260216_subscription_system.sql`, prezzi in centesimi,
> RLS read-all) è la fonte di verità e **coincide col sito pubblico**. Tutto il resto va riallineato lì.

## 1. Prezzi piani — 4 fonti che si contraddicono

| Fonte | Prezzi | Note |
|---|---|---|
| **DB `plans`** (canonico) | starter 179 / professional 279 / business 359 / full 449 €/mese (annuali 1800/2800/3600/4500) | ✅ verità, = sito |
| website `BillingClient.tsx` | 179/279/359/449 mese + 1800/2800/3600/4500 anno | ✅ allineato al DB |
| desktop `BillingSettings.jsx` | 1.800/2.800/3.600/4.500 €/**anno** (solo annuale) | ✅ valori ok, ma **hardcoded** |
| admin `SubscriptionsPage.tsx` | 19,99 / 98,99 / 149,99 €/mese | ❌ **SBAGLIATI** (ordine di grandezza) |

**Fatto in F1:** `SubscriptionsPage` ora legge da `plans` via `fetchPlans()` (fallback `LISTINO_FALLBACK`),
quindi i prezzi sbagliati sono rimossi. `BillingSettings` (desktop) e `BillingClient` (website) restano
hardcoded ma con valori corretti — **da spostare su `plans`** quando si tocca quel codice (richiede deploy).

## 2. Tassonomia piani incoerente — ✅ RISOLTA (admin)

- **Canonica decisa**: `starter | professional | business | full` (+ `custom` = "Su misura" per preventivi su misura).
- Verificato che il backend usa `plan_type` solo come **etichetta** (`PLAN_LABELS[plan_type] || plan_type`),
  non lo valida contro un enum → cambiarlo è sicuro. `plan_type` allargato a `string` in `CreateQuotePayload`.
- **Fatto**: i selettori e le etichette piano ora vengono dal listino DB (`fetchPlans` + helper
  `planOptions`/`planLabel` in `lib/listino.ts`) in **NewLeadQuotePage, LeadDetailPage, LeadQuoteDetailPage, ClientsPage**.
  Eliminati gli `starter/flotta/enterprise` hardcoded. Aggiunto un piano via editor → compare ovunque.
- **Listino editabile**: nuova tab **Impostazioni → Listino** (`ListinoEditor`) scrive su `plans` via
  `/api/staff/admin/plans` (service_role + auth admin).

## 3. Mapping Stripe price-id → piano copiato 6 volte (website)

Lo stesso oggetto `PLAN_MAPPING` (env `NEXT_PUBLIC_STRIPE_PRICE_*` → nome piano) è copia-incollato in:
`api/checkout`, `api/webhooks/stripe`, `api/billing/sync`, `api/billing/force-sync`,
`api/billing/force-sync-complete`, `dashboard/billing/page`. Più i `VALID_PLANS`/`VALID_MODULES`
ridichiarati in 4+ route. **Da centralizzare** in un unico modulo `website/src/lib/plans.ts` (deploy-bound).

## 4. Regole di prezzo (sconti) duplicate

- Annuale = `mensile * 12 * 0.9` (-10%) · Biennale = `mensile * 24 * 0.85` (-15%).
- Presenti in admin `NewLeadQuotePage` (annuale) e website `api/quotes/[uuid]` + `.../quotes/[qid]/approve`.
- **Fatto in F1 (admin):** centralizzate in `admin-panel/src/lib/listino.ts` (`ANNUAL_DISCOUNT`, `BIENNIAL_DISCOUNT`).
  Il website resta da allineare (deploy).

## 5. Default prezzo moduli speciali incoerente (dentro l'admin)

- `NewLeadQuotePage`: default rvfu 29,99 / rentri 29,99 / fatturazione 19,99 €/mese.
- `LeadDetailPage`: stessi campi ma default **0**.

**Fatto in F1:** i default di `NewLeadQuotePage` ora vengono da `SPECIAL_MODULE_DEFAULT_PRICES` (listino.ts),
valore invariato. **Decisione utente:** qual è il default giusto? (0 = operatore digita; 29,99 = listino).
Se 29,99, far adottare la costante anche a `LeadDetailPage`.

## 6. Email promo con prezzo/piano inesistente

Template promo (admin `LeadsPage` + website `api/staff/admin/leads/email/templates`) cita
"Piano **Enterprise** a €119,99 (invece di €149,99)" — ma "Enterprise" non esiste in `VALID_PLANS` e i
prezzi non corrispondono al listino. **Da correggere** (allineare nome piano + prezzi al listino).

---

### Stato sincronizzazione (onesto)
**Già sincronizzato dal listino DB `plans`** (modifica in Impostazioni → Listino vale subito):
- admin: SubscriptionsPage, NewLeadQuotePage, LeadDetailPage, LeadQuoteDetailPage, ClientsPage.

**NON ancora sincronizzato** (mostra ancora valori hardcoded — richiede lavoro a parte + deploy):
- **Sito pubblico** `BillingClient.tsx` (prezzi mostrati al cliente).
- **Desktop** `BillingSettings.jsx` (prezzi nel gestionale).
- **Checkout/Stripe**: `PLAN_MAPPING` (price-id Stripe → piano) in 6 file + math sconti.
  ⚠️ Sync end-to-end col checkout è **delicato**: il prezzo mostrato deve combaciare col prezzo
  effettivo del *price object* di Stripe, altrimenti il cliente vede X e paga Y. Serve un mapping
  piano↔Stripe (gestito da admin) prima di rendere DB-driven il prezzo pubblico.

### Priorità residua
1. ✅ admin: listino DB single-source + editor + tassonomia unificata.
2. Decidere default moduli speciali (§5: 0 vs 29,99).
3. Sito `BillingClient` → mostra prezzi da `plans` (medio rischio, da coordinare con Stripe).
4. Centralizzare `PLAN_MAPPING` Stripe in un modulo unico + mapping piano↔Stripe gestito da admin (§3).
5. Correggere email promo "Enterprise" (§6).
