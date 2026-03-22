# 🗄️ **SETUP BUCKET STORAGE COMPANY-ASSETS**

## 📋 **ISTRUZIONI PER CREARE IL BUCKET:**

### **OPZIONE 1: Via SQL (crea solo il bucket)**
Esegui questa SQL nel Supabase Dashboard → SQL Editor:

```sql
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'company-assets',
  'company-assets',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
) ON CONFLICT (id) DO NOTHING;
```

### **OPZIONE 2: Via Dashboard (metodo consigliato)**
1. Vai su **Supabase Dashboard** → **Storage**
2. Clicca su **"New bucket"**
3. Configura:
   - **Name**: `company-assets`
   - **Public bucket**: ✅ (abilita)
   - **File size limit**: `10 MB`
   - **Allowed MIME types**: `image/jpeg, image/png, image/webp, image/gif, image/svg+xml`
4. Clicca **"Create bucket"**

## 🔐 **POLICY STORAGE (Opzionale - solo se RLS Storage è abilitato):**

Se RLS Storage è disabilitato, il bucket funzionerà senza policy aggiuntive.

Se RLS Storage è abilitato, aggiungi queste policy dal Dashboard:

### **Policy 1: Lettura pubblica**
- **Policy name**: `company_assets_public_read`
- **Allowed operation**: `SELECT`
- **Target roles**: `public`
- **USING expression**: `bucket_id = 'company-assets'`

### **Policy 2: Upload**
- **Policy name**: `company_assets_org_upload`
- **Allowed operation**: `INSERT`
- **Target roles**: `authenticated`
- **WITH CHECK expression**: `bucket_id = 'company-assets'`

### **Policy 3: Eliminazione**
- **Policy name**: `company_assets_org_delete`
- **Allowed operation**: `DELETE`
- **Target roles**: `authenticated`
- **USING expression**: `bucket_id = 'company-assets'`

## ✅ **VERIFICA:**
1. Il bucket `company-assets` appare in Storage
2. Il bucket è marcato come "Public"
3. Prova a caricare un logo dall'app Impostazioni → Branding

