# ✅ Fix Loop CDSSO Infinito

**Data:** 19 gennaio 2026  
**Problema:** CDSSO entra in loop infinito, continua a riprovare senza successo

---

## 🔴 Problema Identificato

Il sistema rileva correttamente il CDSSO, ma entra in un loop infinito:

1. ✅ Rileva form CDSSO
2. ✅ Prova a submitare form nell'iframe
3. ❌ Form non trovato nell'iframe (problema CORS/same-origin)
4. ❌ Riprova continuamente ma continua a ricevere CDSSO
5. ❌ Va in timeout dopo 10 secondi

**Causa:** Il CDSSO non può essere gestito automaticamente in modo affidabile tramite iframe nascosto. Il form CDSSO richiede una navigazione reale del browser.

---

## ✅ Fix Applicato

### Semplificazione Gestione CDSSO

**Prima (Loop Infinito):**
- Tentativo di submit automatico del form CDSSO in iframe nascosto
- Retry continuo quando fallisce
- Timeout dopo 10 secondi

**Dopo (Fix):**
- Rileva CDSSO
- Restituisce immediatamente errore chiaro
- Indica che serve re-autenticazione
- Evita loop infinito

### Codice

```javascript
// Quando rileva CDSSO:
if (text.includes('/agent/cdsso-oauth2') && text.includes('name="id_token"')) {
  console.warn('[RVFU API Proxy] ⚠️ CDSSO rilevato - richiede re-autenticazione');
  data = { 
    _html: true, 
    _text: text.substring(0, 1000), 
    _cdsso: true,
    _cdssoMessage: 'Sessione SSO scaduta. È necessario rifare login RVFU per continuare.',
    _requiresReauth: true
  };
}
```

### Gestione Errore Migliorata

```javascript
if (result.data._cdsso && result.data._requiresReauth) {
  pending.reject(new Error(
    result.data._cdssoMessage || 
    'Sessione SSO scaduta. È necessario rifare login RVFU per continuare.\n\n' +
    'Vai alla sezione RVFU e fai login nuovamente.'
  ));
}
```

---

## 🎯 Comportamento Atteso

1. **Rileva CDSSO:** Sistema rileva correttamente il form CDSSO
2. **Errore Immediato:** Restituisce errore chiaro invece di entrare in loop
3. **Messaggio Utente:** Mostra messaggio che indica di rifare login
4. **Nessun Loop:** Evita retry infiniti

---

## 🧪 Test

1. **Test CDSSO:**
   - Fai login RVFU
   - Aspetta che la sessione scada (o forza scadenza)
   - Prova a cercare veicolo
   - Verifica che appaia messaggio chiaro invece di loop

2. **Test Re-Login:**
   - Dopo errore CDSSO, rifai login RVFU
   - Prova di nuovo a cercare veicolo
   - Verifica che funzioni correttamente

---

## 📝 Note

- Il CDSSO non può essere gestito automaticamente in modo affidabile
- La soluzione migliore è rifare login quando la sessione scade
- Il messaggio di errore è chiaro e indica la soluzione

---

**Status:** ✅ Fix applicato - Loop infinito risolto
