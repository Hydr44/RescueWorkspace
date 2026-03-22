# Analisi Admin Panel - Problemi e Soluzioni Proposte

## Stato attuale: Cosa NON funziona e perché

---

## PROBLEMA 1: Manutenzione App Desktop — NON FUNZIONA

### Causa root
L'admin panel e la desktop app usano **due tabelle diverse** per la manutenzione:

| Chi | Tabella | Endpoint |
|-----|---------|----------|
| **Admin panel SCRIVE** | `system_settings` (chiave `maintenance_enabled`) | `POST /api/staff/admin/remote-control/maintenance` |
| **Desktop app LEGGE** | `maintenance_mode` (colonna `is_active`) | `GET /api/maintenance/status` |

**Risultato**: quando attivi la manutenzione dall'admin panel, il valore viene salvato in `system_settings`, ma la desktop app fa polling su `/api/maintenance/status` che legge da `maintenance_mode` — una tabella completamente diversa che non viene mai aggiornata dall'admin. Il toggle è quindi **completamente scollegato**.

### File coinvolti
- `website/src/app/api/staff/admin/remote-control/maintenance/route.ts` — scrive su `system_settings`
- `website/src/app/api/maintenance/status/route.ts` — legge da `maintenance_mode`
- `desktop-app/.../src/lib/remote-control.ts` — polling su `/api/maintenance/status`

---

## PROBLEMA 2: Manutenzione Sito Web — NON FUNZIONA

### Causa root
Il toggle salva `website_maintenance_enabled` in `system_settings`, ma:
- **Non esiste nessun middleware** nel sito web che controlla questo flag
- **Non esiste nessuna pagina di manutenzione** nel sito
- Il valore viene salvato nel DB ma **nessuno lo legge mai** lato frontend/sito

### File coinvolti
- `website/src/middleware.ts` — gestisce solo CORS e redirect staff, **nessun check manutenzione**
- `website/src/app/api/staff/admin/settings/website-maintenance/` — salva il flag (funziona) ma nessuno lo consuma

---

## PROBLEMA 3: Feature Flags — NON FUNZIONANO sulla Desktop App

### Causa root
I feature flags (`rvfu_enabled`, `sdi_enabled`, `rentri_enabled`, ecc.) vengono salvati correttamente in `system_settings.feature_flags`, ma:
- La **desktop app non li legge mai**
- Il file `Shell.jsx` mostra **sempre** tutte le voci di navigazione (Demolizioni RVFU, Rifiuti RENTRI, ecc.) senza nessuna condizione
- Non esiste nessun hook/servizio che carica i feature flags e li usa per condizionare la UI

---

## PROBLEMA 4: Moduli Organizzazione (`org_modules`) — Disattivazione NON ha effetto sulla Desktop App

### Causa root
La tabella `org_modules` permette di impostare status `active`/`inactive`/`trial` per ogni organizzazione, ma:
- La desktop app li legge **solo** in `BillingSettings.jsx` per **mostrare** quali moduli sono attivi (solo lettura informativa)
- **Le voci di menu e le route non vengono nascoste/bloccate** in base allo status dei moduli
- Puoi disattivare un modulo dall'admin ma l'utente continua ad accedervi normalmente

---

## SOLUZIONI PROPOSTE

### Fix 1: Manutenzione App Desktop (PRIORITÀ ALTA)

**Cosa faccio**: Modifico l'endpoint `/api/maintenance/status` (quello che la desktop app legge) in modo che legga da `system_settings` OPPURE faccio in modo che l'endpoint admin `/api/staff/admin/remote-control/maintenance` aggiorni ANCHE la tabella `maintenance_mode`.

**Approccio consigliato**: Aggiorno la route admin `remote-control/maintenance` per scrivere su **entrambe** le tabelle (`system_settings` + `maintenance_mode`). Così:
- L'admin panel continua a funzionare come prima
- La desktop app vede immediatamente il cambio perché la tabella `maintenance_mode` viene aggiornata

**File da modificare**:
- `website/src/app/api/staff/admin/remote-control/maintenance/route.ts` — aggiungere upsert su `maintenance_mode`

---

### Fix 2: Manutenzione Sito Web (PRIORITÀ MEDIA)

**Cosa faccio**: Aggiungo un middleware nel sito web che controlla `website_maintenance_enabled` da `system_settings` e mostra una pagina di manutenzione per i visitatori non-staff.

**File da modificare/creare**:
- `website/src/middleware.ts` — aggiungere check manutenzione
- `website/src/app/maintenance/page.tsx` — creare pagina manutenzione

---

### Fix 3: Disattivazione Moduli nella Desktop App (PRIORITÀ ALTA)

**Cosa faccio**: Creo un hook React nella desktop app (`useOrgModules`) che:
1. Carica i moduli attivi dell'organizzazione da `org_modules` (Supabase)
2. Li espone come context/hook
3. `Shell.jsx` usa questo hook per nascondere/mostrare le voci di menu
4. Le route protette mostrano un messaggio "Modulo non attivo" se si tenta l'accesso diretto

**File da modificare/creare**:
- `desktop-app/.../src/hooks/useOrgModules.js` — nuovo hook
- `desktop-app/.../src/components/Shell.jsx` — condizionare le voci di menu

Mappatura moduli → voci menu:
| Modulo `org_modules` | Voci menu da nascondere |
|----------------------|------------------------|
| `rvfu` inactive | Demolizioni RVFU |
| `rentri` inactive | Rifiuti, Registri, Formulari |
| `sdi` inactive | Fatture SDI |

---

### Fix 4: Feature Flags globali nella Desktop App (PRIORITÀ BASSA)

**Cosa faccio**: Aggiungo il caricamento dei feature flags globali all'avvio della desktop app, come "kill switch" aggiuntivo rispetto ai moduli per-org.

Questo è meno urgente perché i moduli per-org (`org_modules`) coprono già la necessità di disattivare funzionalità. I feature flags servirebbero come override globale (es. disabilitare RVFU per TUTTI, non solo per una org).

---

## RIEPILOGO PRIORITÀ

| # | Fix | Complessità | Priorità |
|---|-----|-------------|----------|
| 1 | Manutenzione desktop app | Bassa (1 file) | ALTA |
| 2 | Manutenzione sito web | Media (2 file) | MEDIA |
| 3 | Disattivazione moduli desktop | Media (2-3 file) | ALTA |
| 4 | Feature flags desktop | Media (2-3 file) | BASSA |

---

## PROSSIMI PASSI

Attendo conferma su quali fix implementare. Posso procedere con tutti e 4 oppure solo quelli che ritieni prioritari.
