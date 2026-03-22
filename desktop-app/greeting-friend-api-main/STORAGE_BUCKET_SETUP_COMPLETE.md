# 🗄️ **SETUP COMPLETO BUCKET STORAGE COMPANY-ASSETS**

## 📋 **PROBLEMA RISOLTO:**
`StorageApiError: new row violates row-level security policy`

## ✅ **PASSO 1: Crea il Bucket (Via SQL)**

Esegui questa SQL nel **Supabase Dashboard → SQL Editor**:

```sql
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'company-assets',
  'company-assets',
  true,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
) ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
```

## ✅ **PASSO 2: Crea le Policy Manualmente (Via Dashboard)**

Le policy Storage richiedono privilegi di superuser, quindi **devi crearle manualmente**:

### **A. Vai su Storage Dashboard:**
1. Apri **Supabase Dashboard**
2. Vai su **Storage** (menu laterale)
3. Seleziona il bucket **`company-assets`**
4. Vai alla tab **Policies**

### **B. Crea Policy 1: Lettura Pubblica (SELECT)**

1. Clicca **"New Policy"**
2. Configura:
   - **Policy name**: `company_assets_public_read`
   - **Allowed operation**: `SELECT`
   - **Target roles**: `public`
   - **USING expression**: 
     ```sql
     bucket_id = 'company-assets'
     ```
3. Clicca **"Review"** → **"Save policy"**

### **C. Crea Policy 2: Upload (INSERT)**

1. Clicca **"New Policy"**
2. Configura:
   - **Policy name**: `company_assets_allow_upload`
   - **Allowed operation**: `INSERT`
   - **Target roles**: `public` (temporaneo per sviluppo)
   - **WITH CHECK expression**: 
     ```sql
     bucket_id = 'company-assets'
     ```
3. Clicca **"Review"** → **"Save policy"**

### **D. Crea Policy 3: Update (UPDATE)**

1. Clicca **"New Policy"**
2. Configura:
   - **Policy name**: `company_assets_allow_update`
   - **Allowed operation**: `UPDATE`
   - **Target roles**: `public` (temporaneo per sviluppo)
   - **USING expression**: 
     ```sql
     bucket_id = 'company-assets'
     ```
   - **WITH CHECK expression**: 
     ```sql
     bucket_id = 'company-assets'
     ```
3. Clicca **"Review"** → **"Save policy"**

### **E. Crea Policy 4: Delete (DELETE)**

1. Clicca **"New Policy"**
2. Configura:
   - **Policy name**: `company_assets_allow_delete`
   - **Allowed operation**: `DELETE`
   - **Target roles**: `public` (temporaneo per sviluppo)
   - **USING expression**: 
     ```sql
     bucket_id = 'company-assets'
     ```
3. Clicca **"Review"** → **"Save policy"**

## ✅ **OPPURE: Disabilita RLS Storage Temporaneamente**

Se preferisci una soluzione più rapida per sviluppo:

### **Via SQL (richiede privilegi elevati):**
```sql
-- ⚠️ SOLO PER SVILUPPO - NON IN PRODUZIONE
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;
```

Se questo comando dà errore di permessi, devi creare le policy manualmente dal Dashboard.

## 🧪 **VERIFICA:**

Dopo aver creato le policy o disabilitato RLS:
1. Ricarica la pagina Impostazioni → Branding
2. Prova a caricare un logo
3. Dovrebbe funzionare senza errori

## 📝 **NOTA IMPORTANTE:**

Le policy create con `target roles: public` sono **temporanee per sviluppo**. 
In produzione, dovresti:
- Cambiare `public` → `authenticated`
- Aggiungere controllo `org_members` se necessario
- Limitare l'accesso ai membri dell'organizzazione

