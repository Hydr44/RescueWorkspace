/**
 * Audit delle azioni (restart/stop/start) su tabella Supabase vps_control_audit.
 * Scrive via service_role (bypassa RLS). Se manca la config, logga soltanto.
 */
const { createClient } = require('@supabase/supabase-js');

const supabase = (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } })
  : null;

async function audit(row) {
  console.log(`[AUDIT] ${row.actor} ${row.action} ${row.target} ok=${row.ok}${row.detail ? ' — ' + row.detail : ''}`);
  if (!supabase) return;
  try {
    await supabase.from('vps_control_audit').insert(row);
  } catch (e) {
    console.error('[AUDIT] insert fallita:', e.message);
  }
}

async function recentAudit(limit) {
  if (!supabase) return [];
  const { data } = await supabase
    .from('vps_control_audit')
    .select('actor, action, target, ok, detail, ip, created_at')
    .order('created_at', { ascending: false })
    .limit(limit || 50);
  return data || [];
}

module.exports = { audit, recentAudit };
