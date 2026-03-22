# 🔍 GUIDA DIAGNOSTICA SINCRONIZZAZIONE TRASPORTI

## 📊 PROBLEMA

**Sintomo**: I trasporti appaiono nel sito web ma non nell'app desktop, anche se entrambi accedono allo stesso database Supabase.

---

## 🔎 ANALISI APPROFONDITA

### **1. STRUTTURA DATABASE**

Entrambe le piattaforme accedono a:
- **Tabella**: `public.transports`
- **Campo critico**: `org_id` (UUID)

### **2. SITO WEB - Dashboard**

**File**: `website/src/app/dashboard/page.tsx` (linea 58-89)

**Flusso**:
```typescript
1. Ottiene user.id da Supabase auth
2. Carica profile.current_org
3. Filtra transports con: .eq("org_id", profile.current_org)
```

**Organizzazione usata**: `profiles.current_org`

### **3. APP DESKTOP - Dashboard**

**File**: `desktop-app/greeting-friend-api-main/src/pages/Dashboard.jsx` (linea 147-194)

**Flusso**:
```typescript
1. Usa useOrg() hook per ottenere orgId
2. Filtra transports con: .eq("org_id", orgId)
3. orgId viene da OrgContext
```

**Organizzazione usata**: `orgId` da `OrgContext`

### **4. ORGCONTEXT - App Desktop**

**File**: `desktop-app/greeting-friend-api-main/src/context/OrgContext.jsx`

**Come determina orgId**:
```javascript
// 1. Carica orgs dell'utente da org_members
// 2. Preferisce owner role
// 3. Fallback alla prima org disponibile
// 4. Salva in localStorage come 'rm-org'
// 5. Usa cached se disponibile
```

**Problema potenziale**:
- L'app desktop potrebbe usare un'organizzazione diversa dal sito
- Se l'utente è membro di più org, potrebbe sceglierne una diversa

---

## 🧪 COME DEBUGGARE

### **STEP 1: Verifica Organizzazione Utente**

**Nel sito web**:
1. Apri console browser
2. Esegui:
```javascript
const { data: profile } = await supabase
  .from("profiles")
  .select("current_org")
  .eq("id", user.id)
  .single();
console.log("Current org (sito):", profile.current_org);
```

**Nell'app desktop**:
1. Apri DevTools (F12 o Cmd+Option+I)
2. Esegui:
```javascript
// Verifica localStorage
console.log("Cached org:", localStorage.getItem('rm-org'));
```

### **STEP 2: Verifica Membri Organizzazione**

Controlla che l'utente sia membro della stessa organizzazione:
```sql
SELECT om.*, o.name as org_name
FROM org_members om
JOIN orgs o ON om.org_id = o.id
WHERE om.user_id = 'USER_ID_HERE'
ORDER BY om.created_at;
```

### **STEP 3: Verifica Trasporti Creati**

Controlla quali trasporti esistono e per quale org:
```sql
SELECT t.*, o.name as org_name
FROM transports t
JOIN orgs o ON t.org_id = o.id
ORDER BY t.created_at DESC
LIMIT 10;
```

### **STEP 4: Verifica Discrepanza**

Confronta `org_id` dei trasporti con le org dell'utente:
```sql
-- Trasporti per utente
SELECT t.id, t.org_id, o.name, t.created_at
FROM transports t
JOIN orgs o ON t.org_id = o.id
WHERE EXISTS (
  SELECT 1 FROM org_members om 
  WHERE om.user_id = 'USER_ID_HERE' 
  AND om.org_id = t.org_id
)
ORDER BY t.created_at DESC;
```

---

## 🛠️ SOLUZIONI

### **Soluzione 1: Sincronizzare Organizzazione**

**Problema**: `profiles.current_org` (sito) vs `orgId` (app) potrebbero essere diversi.

**Fix**: Far usare all'app desktop la stessa logica del sito web:

```javascript
// Desktop App - Sync con sito web
async function syncCurrentOrg() {
  const { data: profile } = await supabase
    .from("profiles")
    .select("current_org")
    .eq("id", userId)
    .single();
  
  if (profile?.current_org && orgId !== profile.current_org) {
    // Usa la stessa org del sito web
    setOrgId(profile.current_org);
  }
}
```

### **Soluzione 2: Aggiornare OrgContext**

Aggiorna `OrgContext.jsx` per usare `profiles.current_org`:

```javascript
// In OrgContext.jsx, refresh function
const { data: profile } = await supabase
  .from("profiles")
  .select("current_org")
  .eq("id", user.id)
  .single();

// Usa profiles.current_org come priority
if (profile?.current_org) {
  setOrgId(profile.current_org);
} else if (myOrgs.length) {
  // Fallback alle org esistenti
  const owner = myOrgs.find(o => (o.role || "").toLowerCase() === "owner");
  setOrgId(owner?.id ?? myOrgs[0].id);
}
```

### **Soluzione 3: Mostrare Debug Info**

Aggiungi info debug nella dashboard:

```javascript
// Desktop App Dashboard
useEffect(() => {
  console.log('[Dashboard] Current orgId:', orgId);
  console.log('[Dashboard] User orgs:', orgs);
  console.log('[Dashboard] Transports count:', rows.length);
}, [orgId, orgs, rows]);
```

---

## ✅ CHECKLIST DEBUG

- [ ] Verifica `profiles.current_org` nel sito web
- [ ] Verifica `orgId` nell'app desktop  
- [ ] Confronta che siano **uguali**
- [ ] Verifica che l'utente sia membro della org corretta
- [ ] Controlla che i trasporti abbiano `org_id` corretto
- [ ] Verifica RLS policies sulla tabella `transports`
- [ ] Controlla console per errori Supabase

---

## 🚨 POSSIBILI CAUSE

1. **Organizzazione diversa**: Sito e app usano org diverse
2. **RLS Policy**: Policy troppo restrittive su `transports`
3. **Cache**: App desktop usa cache vecchia
4. **Permessi**: User non membro della org corretta
5. **LocalStorage**: App desktop usa org cached non valida

---

## 📝 TODO IMMEDIATO

1. Aggiungere log debug in `OrgContext`
2. Aggiungere sync con `profiles.current_org`  
3. Migliorare UI per mostrare orgId corrente
4. Aggiungere refresh manuale organizzazione

**PROSSIMI PASSI**: Implementare fix con priorità su Soluzione 2

