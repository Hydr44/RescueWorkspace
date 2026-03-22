// src/lib/rentri-multi-cert.js
/**
 * Gestione Multi-Certificato RENTRI
 * Supporta certificati separati per ogni organizzazione
 */

import { supabaseBrowser } from "./supabase-browser";

/**
 * Ottieni certificato di interoperabilità attivo (usato per chiamate API RENTRI)
 * Filtra esplicitamente per tipo_certificato='interoperabilita' per non
 * confondersi con i certificati firma_remota che hanno anch'essi is_default=true.
 */
export async function getActiveCertificate(orgId, environment = 'demo') {
  const supabase = supabaseBrowser();
  
  const { data, error } = await supabase
    .from('rentri_org_certificates')
    .select('*')
    .eq('org_id', orgId)
    .eq('environment', environment)
    .eq('tipo_certificato', 'interoperabilita')
    .eq('is_active', true)
    .eq('is_default', true)
    .single();
  
  if (error) {
    console.error('[RENTRI-CERT] Errore recupero certificato:', error);
    throw new Error(`Certificato RENTRI ${environment} non configurato per questa organizzazione`);
  }
  
  if (!data) {
    throw new Error(`Nessun certificato RENTRI ${environment} trovato`);
  }
  
  // Verifica scadenza
  const expiresAt = new Date(data.expires_at);
  if (expiresAt < new Date()) {
    throw new Error(`Certificato RENTRI scaduto il ${expiresAt.toLocaleDateString('it-IT')}`);
  }
  
  return data;
}

/**
 * Ottieni certificato di firma remota attivo (usato per firma digitale FIR)
 * Separato da getActiveCertificate perché i due tipi coesistono indipendentemente.
 */
export async function getActiveFirmaCertificate(orgId, environment = 'demo') {
  const supabase = supabaseBrowser();
  
  const { data, error } = await supabase
    .from('rentri_org_certificates')
    .select('*')
    .eq('org_id', orgId)
    .eq('environment', environment)
    .eq('tipo_certificato', 'firma_remota')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  
  if (error) {
    console.error('[RENTRI-CERT] Errore recupero cert firma:', error);
    return null;
  }
  
  return data || null;
}

/**
 * Lista tutti i certificati di un'organizzazione
 */
export async function listCertificates(orgId) {
  const supabase = supabaseBrowser();
  
  const { data, error } = await supabase
    .from('rentri_org_certificates')
    .select('*')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('[RENTRI-CERT] Errore lista certificati:', error);
    return [];
  }
  
  return data || [];
}

/**
 * Aggiungi nuovo certificato per organizzazione
 */
export async function addCertificate(orgId, certificateData) {
  const supabase = supabaseBrowser();
  
  // Se è il primo certificato, impostalo come default
  const existing = await listCertificates(orgId);
  const isFirst = existing.filter(c => c.environment === certificateData.environment).length === 0;
  
  const { data, error } = await supabase
    .from('rentri_org_certificates')
    .insert({
      org_id: orgId,
      ...certificateData,
      is_default: isFirst,
      is_active: true,
    })
    .select()
    .single();
  
  if (error) {
    console.error('[RENTRI-CERT] Errore inserimento certificato:', error);
    throw error;
  }
  
  return data;
}

/**
 * Imposta certificato come default
 */
export async function setDefaultCertificate(certId, orgId, environment) {
  const supabase = supabaseBrowser();
  
  // Prima rimuovi default dagli altri
  await supabase
    .from('rentri_org_certificates')
    .update({ is_default: false })
    .eq('org_id', orgId)
    .eq('environment', environment);
  
  // Poi imposta questo come default
  const { data, error } = await supabase
    .from('rentri_org_certificates')
    .update({ is_default: true })
    .eq('id', certId)
    .eq('org_id', orgId)
    .select()
    .single();
  
  if (error) {
    console.error('[RENTRI-CERT] Errore set default:', error);
    throw error;
  }
  
  return data;
}

/**
 * Disattiva certificato
 */
export async function deactivateCertificate(certId, orgId) {
  const supabase = supabaseBrowser();
  
  const { data, error } = await supabase
    .from('rentri_org_certificates')
    .update({ is_active: false, is_default: false })
    .eq('id', certId)
    .eq('org_id', orgId)
    .select()
    .single();
  
  if (error) {
    console.error('[RENTRI-CERT] Errore disattivazione:', error);
    throw error;
  }
  
  return data;
}

/**
 * Verifica scadenza certificato
 */
export function checkCertificateExpiry(certificate) {
  const expiresAt = new Date(certificate.expires_at);
  const now = new Date();
  const daysRemaining = Math.floor((expiresAt - now) / (1000 * 60 * 60 * 24));
  
  return {
    isExpired: daysRemaining < 0,
    isExpiringSoon: daysRemaining <= 30 && daysRemaining >= 0,
    daysRemaining,
    expiresAt,
  };
}

/**
 * Lista certificati in scadenza (30 giorni)
 */
export async function getExpiringCertificates(daysBeforeExpiry = 30) {
  const supabase = supabaseBrowser();
  
  const { data, error } = await supabase
    .rpc('check_expiring_rentri_certificates', { days_before: daysBeforeExpiry });
  
  if (error) {
    console.error('[RENTRI-CERT] Errore check scadenze:', error);
    return [];
  }
  
  return data || [];
}

/**
 * Estrai info da file .p12 (da usare in upload)
 */
export async function parseCertificateFile(file) {
  // TODO: Implementare parsing .p12 file
  // Opzioni:
  // 1. Backend API che usa openssl
  // 2. Library JavaScript (node-forge in Electron)
  // 3. Upload a backend che processa e ritorna dati
  
  throw new Error('parseCertificateFile: Da implementare');
}

/**
 * Genera JWT per certificato specifico
 * NOTA: Questa funzione deve essere chiamata lato backend o in Electron main process
 */
export async function generateJWTForCertificate(certificate, audience) {
  // TODO: Implementare generazione JWT
  // Deve essere fatto lato backend o Electron main (accesso a crypto)
  // Per ora, le chiamate API passano attraverso il gateway che gestisce JWT
  
  console.warn('[RENTRI-CERT] JWT generation: Da implementare lato backend');
  return null;
}

export default {
  getActiveCertificate,
  getActiveFirmaCertificate,
  listCertificates,
  addCertificate,
  setDefaultCertificate,
  deactivateCertificate,
  checkCertificateExpiry,
  getExpiringCertificates,
  parseCertificateFile,
  generateJWTForCertificate,
};

