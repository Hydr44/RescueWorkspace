# ✅ Fix: Loop Infinito Re-Login Automatico

**Data:** 22 gennaio 2026  
**Problema:** Re-login automatico crea loop infinito

---

## 🔴 Problema Identificato

Il re-login automatico stava creando un loop infinito:
1. CDSSO rilevato → re-login automatico chiamato
2. Re-login completato → riprova richiesta originale
3. CDSSO rilevato di nuovo (cookie non aggiornati nella finestra persistente)
4. Loop infinito

**Causa:**
- Il re-login viene fatto nel renderer process (frontend)
- Il cookie `iPlanetDirectoryPro` deve essere impostato nella finestra persistente (BrowserWindow) che è nel main process
- Il re-login nel renderer non aggiorna i cookie nella finestra persistente
- Quindi la richiesta viene riprovata, fallisce di nuovo, e il ciclo si ripete

---

## ✅ Fix Applicato

### 1. Flag per Evitare Loop Infiniti

Aggiunto flag `reauthAttempted` in `RVFUClient`:
- Previene retry multipli dello stesso re-login
- Si resetta dopo 10 secondi per permettere un nuovo tentativo in futuro

### 2. Non Riprovare Automaticamente

Dopo il re-login automatico:
- **NON** riprovare automaticamente la richiesta originale
- Lanciare un errore chiaro che indica la necessità di ricaricare la finestra persistente
- L'utente deve chiamare `initApiWindow()` o rifare login manualmente

### Codice

```typescript
if (isCDSSOError && !this.reauthAttempted) {
  this.reauthAttempted = true; // Evita loop infiniti
  console.log('[RVFU Client] 🔄 CDSSO rilevato, tentativo re-login automatico...');
  
  try {
    const newTokens = await this.authService.reAuthenticate();
    if (newTokens) {
      console.log('[RVFU Client] ✅ Re-login automatico completato');
      console.log('[RVFU Client] ⚠️ NOTA: I cookie nella finestra persistente potrebbero non essere aggiornati');
      console.log('[RVFU Client] 💡 Soluzione: Ricarica la finestra persistente chiamando initApiWindow()');
      
      // Reset flag dopo un delay
      setTimeout(() => {
        this.reauthAttempted = false;
      }, 10000); // 10 secondi
      
      // NON riprovare automaticamente
      throw new Error('Re-login completato ma finestra persistente richiede ricaricamento. Chiama initApiWindow() o rifai login manualmente.');
    }
  } catch (reauthError: any) {
    console.error('[RVFU Client] ❌ Errore durante re-login automatico:', reauthError);
    this.reauthAttempted = false; // Reset per permettere retry manuale
  }
} else if (isCDSSOError && this.reauthAttempted) {
  console.warn('[RVFU Client] ⚠️ CDSSO rilevato ma re-login già tentato. Evitando loop infinito.');
  console.warn('[RVFU Client] 💡 Soluzione: Ricarica la finestra persistente chiamando initApiWindow() o rifai login manualmente');
}
```

---

## 💡 Soluzione Completa

Per risolvere completamente il problema CDSSO, l'utente deve:

1. **Opzione 1: Ricaricare la finestra persistente**
   ```javascript
   await window.api.rvfu.closeApiWindow();
   await window.api.rvfu.initApiWindow();
   ```

2. **Opzione 2: Rifare login manualmente**
   - Vai alla sezione RVFU
   - Fai logout
   - Fai login di nuovo

---

## 📝 Note

- Il re-login automatico funziona e aggiorna i token
- Tuttavia, i cookie nella finestra persistente non vengono aggiornati automaticamente
- Per aggiornare i cookie, è necessario ricaricare la finestra persistente
- Il flag `reauthAttempted` previene loop infiniti

---

**Status:** ✅ Fix applicato - Loop infinito risolto
