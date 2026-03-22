# 🔄 Migrazione Endpoint `/api/rentri/limiti/alert` alla VPS

**Data**: 18 Gennaio 2025  
**Status**: ⚠️ **Da Migrare**

---

## 📋 Problema Attuale

**Frontend chiama:**
```
GET https://rescuemanager.eu/limiti/alert?org_id=...&anno=2026
```

**Errore**: `404 Not Found`

**Causa**: L'URL non include `/api/rentri/` nel path.

---

## ✅ Fix Applicato

### **1. Frontend - URL Corretto**

**File**: `desktop-app/greeting-friend-api-main/src/pages/RifiutiDashboard.jsx`

**Prima**:
```javascript
const apiUrl = import.meta.env.VITE_API_URL || 'https://rescuemanager.eu';
const response = await fetch(`${apiUrl}/limiti/alert?...`);
```

**Dopo**:
```javascript
const apiUrl = import.meta.env.VITE_RENTRI_API_URL || import.meta.env.VITE_API_URL || 'https://rentri-test.rescuemanager.eu/api/rentri';
const response = await fetch(`${apiUrl}/limiti/alert?...`);
```

### **2. Frontend - Compatibilità Risposta**

**Aggiunto supporto per entrambi i formati di risposta:**
```javascript
if (response.ok && result.success && (Array.isArray(result.limiti_con_alert) || Array.isArray(result.limiti))) {
  setLimitiAlert(result.limiti_con_alert || result.limiti || []);
}
```

---

## 🔍 Endpoint su Vercel

**File**: `website/src/app/api/rentri/limiti/alert/route.ts`

**Endpoint**: `GET /api/rentri/limiti/alert`

**Funzionalità**:
- Recupera limiti per `org_id` e `anno`
- Calcola percentuale utilizzo
- Filtra solo limiti con alert (warning/critical/superato)
- Ritorna formato: `{ success: true, limiti: [...], count: N }`

---

## 🚀 Migrazione alla VPS

### **Verifica Stato VPS**

**File**: `/opt/rentri-api/routes/limiti.js`

**Da verificare**:
- [ ] Esiste file `routes/limiti.js` sulla VPS?
- [ ] Include endpoint `/limiti/alert`?
- [ ] Se no, aggiungere endpoint

### **Implementazione VPS (se mancante)**

**Aggiungere a `/opt/rentri-api/routes/limiti.js`:**

```javascript
/**
 * GET /api/rentri/limiti/alert
 * Recupera limiti con alert (warning/critical) per organizzazione/anno
 */
router.get('/limiti/alert', async (req, res) => {
  try {
    const { org_id, anno } = req.query;
    
    if (!org_id || !anno) {
      return res.status(400).json({
        error: 'org_id e anno sono parametri obbligatori.'
      });
    }
    
    const { data: limiti, error } = await supabase
      .from('rentri_limiti_rifiuti')
      .select('*')
      .eq('org_id', org_id)
      .eq('anno', parseInt(anno));
    
    if (error) {
      console.error('[RENTRI-LIMITI-ALERT] Errore lettura limiti:', error);
      return res.status(500).json({
        error: 'Errore lettura limiti',
        details: error.message
      });
    }
    
    // Calcola percentuale utilizzo e filtra solo quelli con alert
    const limitiConAlert = (limiti || [])
      .map(limite => {
        const percentuale = limite.limite_quantita > 0
          ? (limite.quantita_attuale / limite.limite_quantita) * 100
          : 0;
        
        const superato = percentuale >= 100;
        const warning = percentuale >= (limite.soglia_alert_percentuale || 80) && !superato && percentuale < 95;
        const critical = percentuale >= 95 && !superato;
        
        return {
          ...limite,
          percentuale_utilizzo: percentuale,
          alert_dovuto: warning || critical || superato,
          superato,
          warning,
          critical
        };
      })
      .filter(l => l.alert_dovuto);
    
    res.json({
      success: true,
      limiti: limitiConAlert,
      count: limitiConAlert.length
    });
    
  } catch (error) {
    console.error('[RENTRI-LIMITI-ALERT] Errore:', error);
    res.status(500).json({
      error: 'Errore interno',
      details: error.message
    });
  }
});
```

---

## ✅ Checklist Migrazione

- [x] Fix URL frontend (usa `VITE_RENTRI_API_URL`)
- [x] Aggiunto supporto compatibilità risposta
- [ ] Verificare se endpoint esiste sulla VPS
- [ ] Aggiungere endpoint `/limiti/alert` alla VPS se mancante
- [ ] Testare endpoint sulla VPS
- [ ] Verificare che frontend funzioni correttamente

---

## 🧪 Test

**Dopo migrazione, testare:**

```bash
# Test endpoint VPS
curl "https://rentri-test.rescuemanager.eu/api/rentri/limiti/alert?org_id=xxx&anno=2026"

# Risultato atteso:
# {
#   "success": true,
#   "limiti": [...],
#   "count": N
# }
```

---

## 📝 Note

- L'endpoint su Vercel funziona correttamente
- Il problema era solo l'URL nel frontend (mancava `/api/rentri/`)
- Ora il frontend usa `VITE_RENTRI_API_URL` che punta alla VPS
- Se l'endpoint non esiste sulla VPS, va aggiunto

---

**Prossimo passo**: Verificare se l'endpoint esiste sulla VPS e aggiungerlo se mancante.
