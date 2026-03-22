# 🐛 FIX: Trasporti Non Appaiono in App Desktop

## 🔍 PROBLEMA

I trasporti creati sul sito web non appaiono nell'app desktop, anche se entrambi usano lo stesso database Supabase.

---

## ✅ SOLUZIONE RAPIDA

### **Opzione 1: Apri TestSync nell'App**

1. Apri app desktop Electron
2. Vai su: `http://localhost:8080/#/test-sync` (o `http://localhost:8081/#/test-sync`)
3. **In alto** vedrai un box "🔍 Debug Info" che mostra:
   - ✅ o ❌ se c'è mismatch organizzazione
   - OrgId app desktop
   - OrgId sito web
   - Numero trasporti nel database

### **Opzione 2: Rigenera App Electron**

Se l'app è vecchia e non carica le modifiche:

```bash
cd desktop-app/greeting-friend-api-main
npm run build
npm run dev:electron
```

### **Opzione 3: Verifica Manualmente**

Apri console nell'app desktop (F12) ed esegui:

```javascript
// Verifica orgId corrente
console.log("Current orgId:", window.__orgId);

// Verifica transports nel database
const { data } = await supabase
  .from("transports")
  .select("*")
  .eq("org_id", "TUA_ORG_ID");
console.log("Transports:", data);
```

---

## 🔧 CAUSE COMUNI

### 1. **Organizzazione Diversa**
- Sito usa: `profiles.current_org`
- App usa: Prima org disponibile da `org_members`

**Fix**: L'app deve usare la stessa org del sito

### 2. **Cache Vecchia**
- LocalStorage ha orgId cached non valido

**Fix**: Pulisci cache:
```javascript
localStorage.removeItem('rm-org');
window.location.reload();
```

### 3. **RLS Policy Troppo Restrittive**
- Le RLS potrebbero bloccare la lettura transports

**Fix**: Verifica RLS su tabella `transports`

---

## 📊 COME DEBUGGARE

### **Nel Sito Web**:

1. Console browser, esegui:
```javascript
const { data: profile } = await supabase
  .from("profiles")
  .select("current_org")
  .eq("id", user.id)
  .single();
console.log("Sito web org:", profile.current_org);
```

2. Verifica transports per quella org:
```javascript
const { data: trs } = await supabase
  .from("transports")
  .select("*")
  .eq("org_id", profile.current_org);
console.log("Transports sito:", trs.length);
```

### **Nell'App Desktop**:

1. Apri TestSync: `/#/test-sync`
2. Guarda il box "Debug Info" in alto
3. Verifica se c'è **MISMATCH**

Se c'è mismatch:
```javascript
// Fix: Usa la stessa org del sito web
const { data: profile } = await supabase
  .from("profiles")
  .select("current_org")
  .eq("id", userId)
  .single();

if (profile.current_org) {
  setOrgId(profile.current_org);
}
```

---

## 🎯 PROSSIMI PASSI

1. Apri `/test-sync` nell'app
2. Controlla il box "Debug Info" in alto
3. Dimmi cosa vedi (MATCH o MISMATCH)
4. Dimmi quanti trasporti mostra

**ADESSO FA QUELLO SOPRA E RIMANDI COSA VEDI** 🔍

