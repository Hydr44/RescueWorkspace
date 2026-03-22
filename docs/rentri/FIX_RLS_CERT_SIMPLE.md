# 🔧 FIX RLS per Upload Certificati

## 🐛 Problema

```
Error: new row violates row-level security policy for table "rentri_org_certificates"
```

L'upload del certificato **funziona perfettamente** (VPS estrae il file), ma Supabase blocca l'inserimento per via delle policy RLS.

---

## ✅ Soluzione

### Opzione A: Via Dashboard Supabase (VELOCE)

1. **Apri Supabase Dashboard**
   ```
   https://supabase.com/dashboard/project/ienzdgrqalltvkdkuamp
   ```

2. **Vai a Authentication → Policies**
   ```
   → rentri_org_certificates table
   ```

3. **Aggiungi Policy INSERT**
   ```sql
   CREATE POLICY "Users can insert certificates for their org"
   ON rentri_org_certificates
   FOR INSERT
   TO authenticated
   WITH CHECK (
     org_id IN (
       SELECT org_id 
       FROM org_members 
       WHERE user_id = auth.uid()
     )
   );
   ```

4. **Click "Save"**

---

### Opzione B: Via SQL Editor (COMPLETA)

```sql
-- 1. DROP policy esistenti per INSERT (se ci sono conflitti)
DROP POLICY IF EXISTS "Users can insert certificates for their org" ON rentri_org_certificates;
DROP POLICY IF EXISTS "rentri_org_certificates_insert_policy" ON rentri_org_certificates;

-- 2. Crea policy INSERT corretta
CREATE POLICY "Users can insert certificates for their org"
ON rentri_org_certificates
FOR INSERT
TO authenticated
WITH CHECK (
  org_id IN (
    SELECT org_id 
    FROM org_members 
    WHERE user_id = auth.uid()
  )
);

-- 3. Verifica che esista
SELECT policyname, cmd, qual
FROM pg_policies 
WHERE tablename = 'rentri_org_certificates' AND cmd = 'INSERT';
```

---

## 🧪 Dopo aver eseguito la FIX

### 1. Ricarica App
```
Cmd+R
```

### 2. Riprova Upload
```
Rifiuti RENTRI → Certificati → Carica Certificato
→ Seleziona .p12
→ Compila form
→ Carica Certificato
✅ Dovrebbe funzionare!
```

---

## 📊 Console Output Atteso

```javascript
[CERT-UPLOAD] Inizio upload...
[CERT-UPLOAD] File: nome.p12 2145 bytes
[CERT-UPLOAD] Chiamata API VPS...
[CERT-UPLOAD] VPS Response status: 200  ← ✅ Questo già funziona!
[CERT-UPLOAD] VPS Response data: {success: true, ...}
[CERT-UPLOAD] Salvataggio in Supabase...
[CERT-UPLOAD] Upload completato con successo!  ← ✅ Questo apparirà dopo la fix!
```

---

## ✅ Sistema Funzionante

```
[✅] VPS Server: ATTIVO
[✅] Nginx Proxy: ATTIVO
[✅] CORS: SISTEMATO
[✅] OpenSSL Extraction: FUNZIONANTE ← Fatto!
[⏳] RLS Policy: DA SISTEMARE ← Questo è l'ultimo step!
```

Dopo questa fix, **il sistema sarà 100% operativo**! 🚀

