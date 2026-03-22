// src/lib/sparePartImages.js
// Gestione upload/delete immagini ricambi via Supabase Storage
import { supabase } from '@/integrations/supabase/client';

const BUCKET = 'spare-parts-images';

/**
 * Upload di un'immagine per un ricambio
 * @param {File} file - File immagine
 * @param {string} orgId - ID organizzazione
 * @param {string} partId - ID ricambio
 * @param {object} opts - { isPrimary, sortOrder }
 * @returns {{ data, error }}
 */
export async function uploadPartImage(file, orgId, partId, opts = {}) {
  const { isPrimary = false, sortOrder = 0 } = opts;

  // 1. Richiedi la URL pre-firmata al server VPS
  const session = await supabase.auth.getSession();
  const token = session.data.session?.access_token;
  
  if (!token) {
    return { data: null, error: new Error("Authentication token not found") };
  }

  const presignRes = await fetch("https://assist.rescuemanager.eu/api/storage/presign", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({
      filename: file.name,
      contentType: file.type || 'application/octet-stream',
      folder: `spare_parts/${partId}`,
      orgId: orgId
    })
  });

  if (!presignRes.ok) {
    const err = await presignRes.json();
    return { data: null, error: new Error(err.error || "Failed to get presigned URL") };
  }

  const { presignedUrl, publicUrl, r2Key } = await presignRes.json();

  // 2. Upload HTTP PUT diretto verso Cloudflare R2
  const uploadRes = await fetch(presignedUrl, {
    method: "PUT",
    body: file,
    headers: {
      "Content-Type": file.type || 'application/octet-stream'
    }
  });

  if (!uploadRes.ok) {
    return { data: null, error: new Error("Failed to upload file to R2") };
  }

  // Se è primary, togli primary dalle altre
  if (isPrimary) {
    await supabase
      .from('spare_part_images')
      .update({ is_primary: false })
      .eq('spare_part_id', partId)
      .eq('org_id', orgId);
  }

  // 3. Inserisci record nel DB
  const { data: imageRecord, error: dbError } = await supabase
    .from('spare_part_images')
    .insert({
      org_id: orgId,
      spare_part_id: partId,
      storage_path: r2Key, // Salviamo il path R2 
      url: publicUrl, // URL pubblica formattata per R2
      file_name: file.name,
      file_size: file.size,
      mime_type: file.type,
      sort_order: sortOrder,
      is_primary: isPrimary,
    })
    .select()
    .single();

  if (dbError) {
    return { data: null, error: dbError };
  }

  return { data: imageRecord, error: null };
}

/**
 * Carica tutte le immagini di un ricambio
 * @param {string} partId
 * @returns {{ data: Array, error }}
 */
export async function getPartImages(partId) {
  const { data, error } = await supabase
    .from('spare_part_images')
    .select('*')
    .eq('spare_part_id', partId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  return { data: data || [], error };
}

/**
 * Elimina un'immagine
 * @param {string} imageId
 * @param {string} storagePath
 * @returns {{ error }}
 */
export async function deletePartImage(imageId, storagePath) {
  // Nota: l'eliminazione fisica da R2 viene bypassata in questa app client per motivi di sicurezza
  // (mancanza presign DELETE). È consigliato fare cleanup batch sulla VPS o soft-delete.
  // if (storagePath && !storagePath.includes('http')) {
  //   await supabase.storage.from(BUCKET).remove([storagePath]);
  // }

  // Cancella record DB
  const { error } = await supabase
    .from('spare_part_images')
    .delete()
    .eq('id', imageId);

  return { error };
}

/**
 * Imposta un'immagine come primaria
 * @param {string} imageId
 * @param {string} partId
 * @param {string} orgId
 * @returns {{ error }}
 */
export async function setPrimaryImage(imageId, partId, orgId) {
  // Togli primary da tutte
  await supabase
    .from('spare_part_images')
    .update({ is_primary: false })
    .eq('spare_part_id', partId)
    .eq('org_id', orgId);

  // Imposta la nuova primary
  const { error } = await supabase
    .from('spare_part_images')
    .update({ is_primary: true })
    .eq('id', imageId);

  return { error };
}

/**
 * Riordina le immagini
 * @param {Array<{id: string, sort_order: number}>} updates
 * @returns {{ error }}
 */
export async function reorderPartImages(updates) {
  for (const { id, sort_order } of updates) {
    const { error } = await supabase
      .from('spare_part_images')
      .update({ sort_order })
      .eq('id', id);
    if (error) return { error };
  }
  return { error: null };
}
