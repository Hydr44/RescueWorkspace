-- Crea bucket storage per immagini ricambi
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'spare-parts-images',
  'spare-parts-images',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- Policy: chiunque può leggere le immagini
CREATE POLICY "spare_parts_images_public_read"
ON storage.objects FOR SELECT
USING (bucket_id = 'spare-parts-images');

-- Policy: solo membri org possono caricare
CREATE POLICY "spare_parts_images_org_upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'spare-parts-images' AND
  EXISTS (
    SELECT 1 FROM org_members m
    WHERE m.user_id = auth.uid()
  )
);

-- Policy: solo membri org possono eliminare
CREATE POLICY "spare_parts_images_org_delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'spare-parts-images' AND
  EXISTS (
    SELECT 1 FROM org_members m
    WHERE m.user_id = auth.uid()
  )
);